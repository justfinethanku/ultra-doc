#!/usr/bin/env node

/**
 * Generate Report
 * Creates a human-friendly summary of documentation status.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LLM_DIR = path.join(process.cwd(), 'context_for_llms');
const HUMAN_DIR = path.join(process.cwd(), 'context_for_humans');
const CHANGELOG_DIR = path.join(process.cwd(), 'changelog');
const REPORT_FILE = path.join(process.cwd(), 'reports', 'ultra-doc-summary.md');
const LINT_WARNINGS_FILE = path.join(LLM_DIR, 'LINT_WARNINGS.md');

function countFiles(dir) {
    if (!fs.existsSync(dir)) return 0;
    return fs.readdirSync(dir).filter(f => f.endsWith('.md') && f !== 'INDEX.md').length;
}

function getLintStatus() {
    if (!fs.existsSync(LINT_WARNINGS_FILE)) return { count: 0, status: 'Unknown' };
    const content = fs.readFileSync(LINT_WARNINGS_FILE, 'utf-8');
    const match = content.match(/Found (\d+) issues/);
    const count = match ? parseInt(match[1]) : 0;
    return { count, status: count === 0 ? 'Healthy' : 'Needs Attention' };
}

function getLastChangelog() {
    if (!fs.existsSync(CHANGELOG_DIR)) return 'No changelogs found.';
    const files = fs.readdirSync(CHANGELOG_DIR).filter(f => f.startsWith('docs-')).sort().reverse();
    if (files.length === 0) return 'No changelogs found.';

    const lastFile = files[0];
    const content = fs.readFileSync(path.join(CHANGELOG_DIR, lastFile), 'utf-8');
    // Extract first few lines or just link to it
    return `[${lastFile}](../changelog/${lastFile})\n\n${content.split('\n').slice(0, 10).join('\n')}...`;
}

function generateReport() {
    console.log('📊 Generating Summary Report...\n');

    const llmCount = countFiles(LLM_DIR);
    const humanCount = countFiles(HUMAN_DIR);
    const lintStatus = getLintStatus();
    const lastChangelog = getLastChangelog();

    const content = `# Ultra-Doc Summary Report
Generated: ${new Date().toLocaleString()}

## 📈 Metrics

| Metric | Value | Status |
| :--- | :--- | :--- |
| **Machine Docs** | ${llmCount} | ✅ Active |
| **Human Docs** | ${humanCount} | ${llmCount === humanCount ? '✅ Synced' : '⚠️ Sync Pending'} |
| **Lint Issues** | ${lintStatus.count} | ${lintStatus.status === 'Healthy' ? '✅' : '⚠️'} ${lintStatus.status} |

## 📋 Recent Changes

${lastChangelog}

## 🔗 Quick Links

- [Machine Docs](../context_for_llms/INDEX.md)
- [Human Docs](../context_for_humans/)
- [Full Changelog](../changelog/)
`;

    fs.writeFileSync(REPORT_FILE, content, 'utf-8');
    console.log(`  ✓ Report generated: ${path.relative(process.cwd(), REPORT_FILE)}`);
}

generateReport();
