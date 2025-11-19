#!/usr/bin/env node

/**
 * Sync Doc Metadata
 * Orchestrates metadata updates for documentation:
 * 1. Identifies changed files via git
 * 2. Updates timestamps only for changed files
 * 3. Regenerates indexes (sections, LLM index)
 * 4. Runs linter
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTEXT_DIR = path.join(process.cwd(), 'context_for_llms');
const TIMESTAMP_PATTERN = /^(Last Updated|Updated):\s*.*/m;

function getChangedFiles() {
    try {
        // Get changed files relative to HEAD (staged and unstaged)
        const output = execSync('git diff --name-only HEAD', { encoding: 'utf-8' });
        return output.split('\n')
            .filter(line => line.trim() !== '')
            .filter(line => line.includes('context_for_llms/') && line.endsWith('.md'));
    } catch (error) {
        console.warn('⚠️ Could not determine changed files via git. Assuming all files might need checks.');
        return [];
    }
}

function updateFileTimestamp(filePath) {
    if (!fs.existsSync(filePath)) return false;

    const content = fs.readFileSync(filePath, 'utf-8');
    const now = new Date().toISOString().split('T')[0];
    let newContent = content;
    let updated = false;

    if (TIMESTAMP_PATTERN.test(content)) {
        const match = content.match(TIMESTAMP_PATTERN);
        if (match[0] !== `Last Updated: ${now}`) {
            newContent = content.replace(TIMESTAMP_PATTERN, `Last Updated: ${now}`);
            updated = true;
        }
    } else {
        // Add timestamp
        const lines = content.split('\n');
        let insertIndex = 0;
        if (lines[0] === '---') {
            const endIndex = lines.findIndex((line, i) => i > 0 && line === '---');
            insertIndex = endIndex >= 0 ? endIndex + 1 : 0;
        }
        lines.splice(insertIndex, 0, `Last Updated: ${now}`, '');
        newContent = lines.join('\n');
        updated = true;
    }

    if (updated) {
        fs.writeFileSync(filePath, newContent, 'utf-8');
        console.log(`  ✓ Updated timestamp: ${path.basename(filePath)}`);
    }
    return updated;
}

function runScript(scriptName) {
    const scriptPath = path.join(__dirname, scriptName);
    if (fs.existsSync(scriptPath)) {
        console.log(`\n▶ Running ${scriptName}...`);
        try {
            execSync(`node "${scriptPath}"`, { stdio: 'inherit' });
        } catch (error) {
            console.error(`❌ ${scriptName} failed.`);
            // We don't exit here, we try to continue with other scripts
        }
    } else {
        console.warn(`⚠️ Script not found: ${scriptName}`);
    }
}

function verifyParity() {
    console.log('\n⚖️  Verifying Dual-Track Parity...');
    const llmDir = path.join(process.cwd(), 'context_for_llms');
    const humanDir = path.join(process.cwd(), 'context_for_humans');

    if (!fs.existsSync(llmDir)) return true;

    const llmFiles = fs.readdirSync(llmDir).filter(f => f.endsWith('.md') && f !== 'INDEX.md');
    const issues = [];

    for (const file of llmFiles) {
        const humanPath = path.join(humanDir, file);
        if (!fs.existsSync(humanPath)) {
            issues.push(`Missing human doc for ${file}`);
            continue;
        }
        const llmTime = fs.statSync(path.join(llmDir, file)).mtimeMs;
        const humanTime = fs.statSync(humanPath).mtimeMs;
        if (humanTime < llmTime) {
            issues.push(`Human doc ${file} is older than machine doc`);
        }
    }

    if (issues.length > 0) {
        console.error(`❌ Parity Mismatch detected:`);
        issues.forEach(issue => console.error(`   - ${issue}`));
        return false;
    } else {
        console.log('  ✓ Parity confirmed: All machine docs have human counterparts.');
        return true;
    }
}

function syncMetadata() {
    console.log('🔄 Syncing Documentation Metadata...\n');

    // 1. Identify changed files
    const changedFiles = getChangedFiles();

    if (changedFiles.length > 0) {
        console.log(`Found ${changedFiles.length} changed documentation file(s).`);

        // 2. Update timestamps
        console.log('\nUpdating timestamps...');
        let updatedCount = 0;
        for (const file of changedFiles) {
            const absPath = path.join(process.cwd(), file);
            if (updateFileTimestamp(absPath)) {
                updatedCount++;
            }
        }
        if (updatedCount === 0) console.log('  No timestamps needed updating.');
    } else {
        console.log('No changed documentation files detected via git.');
    }

    // 3. Run generators
    runScript('generate-section-index.mjs');
    runScript('generate-llm-index.mjs');
    runScript('generate-code-pointers.mjs');
    runScript('render-relationships.mjs');

    // 4. Run linter (and autofix before?)
    // Roadmap says: "Auto-sync metadata before linting"
    // So we run linter last.
    runScript('autofix-linting.mjs');
    process.env.ULTRA_DOC_SKIP_PARITY = '1';
    runScript('lint-documentation.mjs');
    delete process.env.ULTRA_DOC_SKIP_PARITY;

    // 5. Regenerate Human Docs post-lint (captures updated digests)
    runScript('generate-human-doc.mjs');

    // 6. Verify Parity
    if (!verifyParity()) {
        console.error('\n❌ Sync failed due to parity mismatch.');
        process.exit(1);
    }

    // 7. Reporting
    runScript('generate-changelog.mjs');
    runScript('generate-report.mjs');

    console.log('\n✅ Sync Complete.');
}

syncMetadata();
