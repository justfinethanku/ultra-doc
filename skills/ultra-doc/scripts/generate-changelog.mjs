#!/usr/bin/env node

/**
 * Generate Changelog
 * Creates a changelog entry for documentation updates.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHANGELOG_DIR = path.join(process.cwd(), 'changelog');

// Ensure changelog dir exists
if (!fs.existsSync(CHANGELOG_DIR)) {
    fs.mkdirSync(CHANGELOG_DIR, { recursive: true });
}

function getChangedFiles() {
    try {
        const tracked = execSync('git diff --name-only HEAD', { encoding: 'utf-8' })
            .split('\n')
            .filter(Boolean);
        const untracked = execSync('git ls-files --others --exclude-standard', { encoding: 'utf-8' })
            .split('\n')
            .filter(Boolean);

        return [...new Set([...tracked, ...untracked])]
            .filter(line => line.includes('context_for_llms/') || line.includes('context_for_humans/'));
    } catch (error) {
        return [];
    }
}

function generateChangelog() {
    console.log('📜 Generating Changelog Entry...\n');

    const changedFiles = getChangedFiles();

    if (changedFiles.length === 0) {
        console.log('  No documentation changes detected.');
        return;
    }

    const today = new Date().toISOString().split('T')[0];
    const changelogFile = path.join(CHANGELOG_DIR, `docs-${today}.md`);

    let content = '';
    if (!fs.existsSync(changelogFile)) {
        content = `# Documentation Changelog: ${today}\n\n`;
    } else {
        content = fs.readFileSync(changelogFile, 'utf-8') + '\n';
    }

    const timestamp = new Date().toLocaleTimeString();
    content += `## Update at ${timestamp}\n\n`;
    content += `**Files Changed:**\n`;

    for (const file of changedFiles) {
        content += `- \`${file}\`\n`;
    }

    content += '\n---\n';

    fs.writeFileSync(changelogFile, content, 'utf-8');
    console.log(`  ✓ Changelog updated: ${path.relative(process.cwd(), changelogFile)}`);
}

generateChangelog();
