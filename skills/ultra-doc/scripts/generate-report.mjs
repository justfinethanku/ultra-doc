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
const DOC_STATE_FILE = path.join(LLM_DIR, 'DOC_STATE.json');
const VALIDATION_FILE = path.join(LLM_DIR, 'VALIDATION.json');

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

function getDocStateMetrics() {
    if (!fs.existsSync(DOC_STATE_FILE)) {
        return {
            total: 'Unknown',
            stale: 'Unknown',
            coverage: 'Unknown',
            priorities: []
        };
    }
    const state = JSON.parse(fs.readFileSync(DOC_STATE_FILE, 'utf-8'));
    return {
        total: state.metrics?.total_docs ?? 0,
        stale: state.metrics?.stale_docs ?? 0,
        coverage: `${state.metrics?.coverage_percentage ?? 0}%`,
        priorities: state.priorities ?? []
    };
}

function getValidationStatus() {
    if (!fs.existsSync(VALIDATION_FILE)) {
        return {
            accuracy: 'Unknown',
            errors: 'Unknown',
            warnings: 'Unknown',
            status: 'Unknown'
        };
    }
    const data = JSON.parse(fs.readFileSync(VALIDATION_FILE, 'utf-8'));
    const results = data.validation_results || {};
    const accuracyPct = results.accuracy_score != null
        ? `${Math.round(results.accuracy_score * 100)}%`
        : 'Unknown';
    const errors = data.errors ? data.errors.length : 0;
    const warnings = data.warnings ? data.warnings.length : 0;
    const status = errors > 0
        ? '⚠️ Needs Attention'
        : warnings > 0
            ? '⚠️ Review Suggested'
            : '✅ Passing';
    return { accuracy: accuracyPct, errors, warnings, status };
}

function getParityStatus() {
    if (!fs.existsSync(LLM_DIR)) {
        return { status: 'Unknown', issues: [], synced: false };
    }

    const llmFiles = fs.readdirSync(LLM_DIR).filter(f => f.endsWith('.md') && f !== 'INDEX.md');
    const issues = [];

    for (const file of llmFiles) {
        const llmPath = path.join(LLM_DIR, file);
        const humanPath = path.join(HUMAN_DIR, file);

        if (!fs.existsSync(humanPath)) {
            issues.push(`Missing human doc for ${file}`);
            continue;
        }

        const llmTime = fs.statSync(llmPath).mtimeMs;
        const humanTime = fs.statSync(humanPath).mtimeMs;
        if (humanTime < llmTime - 1000) {
            issues.push(`Human doc ${file} lags machine doc`);
        }
    }

    return {
        status: issues.length === 0 ? `✅ Synced (${llmFiles.length}/${llmFiles.length})` : `⚠️ ${issues.length} issue(s)`,
        issues,
        synced: issues.length === 0,
        total: llmFiles.length
    };
}

function generateReport() {
    console.log('📊 Generating Summary Report...\n');

    const llmCount = countFiles(LLM_DIR);
    const humanCount = countFiles(HUMAN_DIR);
    const lintStatus = getLintStatus();
    const lastChangelog = getLastChangelog();
    const docMetrics = getDocStateMetrics();
    const validation = getValidationStatus();
    const parity = getParityStatus();

    const content = `# Ultra-Doc Summary Report
Generated: ${new Date().toLocaleString()}

## 📈 Metrics

| Metric | Value | Status |
| :--- | :--- | :--- |
| **Machine Docs** | ${llmCount} | ✅ Active |
| **Human Docs** | ${humanCount} | ${llmCount === humanCount ? '✅ Synced' : '⚠️ Sync Pending'} |
| **Lint Issues** | ${lintStatus.count} | ${lintStatus.status === 'Healthy' ? '✅' : '⚠️'} ${lintStatus.status} |
| **Stale Docs** | ${docMetrics.stale} / ${docMetrics.total} | ${docMetrics.stale === 0 ? '✅ Fresh' : '⚠️ Update Needed'} |
| **Coverage** | ${docMetrics.coverage} | ${docMetrics.coverage === 'Unknown' ? '⚠️ Unknown' : '✅ Tracked'} |
| **Validation** | Accuracy ${validation.accuracy} (errors ${validation.errors}, warnings ${validation.warnings}) | ${validation.status} |
| **Parity** | ${parity.status} | ${parity.synced ? '✅ Mirrored' : '⚠️ Mismatch'} |

## 📋 Recent Changes

${lastChangelog}

## 🧭 Priorities

${docMetrics.priorities.length === 0
        ? 'Documentation looks healthy.'
        : docMetrics.priorities.slice(0, 5).map((p, idx) => `${idx + 1}. **${p.file}** – ${p.reason} (${p.impact})`).join('\n')}

${parity.issues.length > 0 ? `\n### Parity Issues\n${parity.issues.map(issue => `- ${issue}`).join('\n')}\n` : ''}

## 🔗 Quick Links

- [Machine Docs](../context_for_llms/INDEX.md)
- [Human Docs](../context_for_humans/)
- [Full Changelog](../changelog/)
`;

    fs.writeFileSync(REPORT_FILE, content, 'utf-8');
    console.log(`  ✓ Report generated: ${path.relative(process.cwd(), REPORT_FILE)}`);
}

generateReport();
