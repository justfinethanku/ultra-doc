#!/usr/bin/env node

/**
 * Generate Human Doc
 * Translates machine-optimized documentation (context_for_llms)
 * into human-readable documentation (context_for_humans).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LLM_DIR = path.join(process.cwd(), 'context_for_llms');
const HUMAN_DIR = path.join(process.cwd(), 'context_for_humans');

// Ensure human dir exists
if (!fs.existsSync(HUMAN_DIR)) {
    fs.mkdirSync(HUMAN_DIR, { recursive: true });
}

function getTimestamp(filePath) {
    if (!fs.existsSync(filePath)) return 0;
    return fs.statSync(filePath).mtimeMs;
}

function translateContent(content, filename) {
    // TODO: Integrate with Claude API to perform actual translation
    // For now, we'll create a placeholder that wraps the original content

    const header = `---
source_file: ${filename}
generated_at: ${new Date().toISOString()}
---

# [Human Readable] ${filename.replace('.md', '')}

> **Note:** This document is automatically generated from the machine-optimized version.
> *Translation logic pending LLM integration.*

---

`;

    return header + content;
}

function generateHumanDocs() {
    console.log('👥 Generating Human-Readable Documentation...\n');

    if (!fs.existsSync(LLM_DIR)) {
        console.error('❌ context_for_llms directory not found');
        process.exit(1);
    }

    const files = fs.readdirSync(LLM_DIR).filter(f => f.endsWith('.md') && f !== 'INDEX.md');
    let updatedCount = 0;

    for (const file of files) {
        const llmPath = path.join(LLM_DIR, file);
        const humanPath = path.join(HUMAN_DIR, file);

        const llmTime = getTimestamp(llmPath);
        const humanTime = getTimestamp(humanPath);

        // Check if update is needed (human doc missing or older than machine doc)
        if (llmTime > humanTime) {
            console.log(`  Translating: ${file}`);

            const content = fs.readFileSync(llmPath, 'utf-8');
            const humanContent = translateContent(content, file);

            fs.writeFileSync(humanPath, humanContent, 'utf-8');
            updatedCount++;
        }
    }

    if (updatedCount === 0) {
        console.log('  ✓ All human docs are up to date.');
    } else {
        console.log(`\n  ✓ Updated ${updatedCount} human documentation files.`);
    }
}

generateHumanDocs();
