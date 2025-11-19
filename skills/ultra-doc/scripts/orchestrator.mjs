#!/usr/bin/env node

/**
 * Ultra-Doc Orchestrator
 * Implements the main decision tree and interactive menu.
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = process.cwd();

const CONFIG_FILE = path.join(ROOT_DIR, '.ultra-doc.config.json');
const DOC_STATE_FILE = path.join(ROOT_DIR, 'context_for_llms', 'DOC_STATE.json');
const PACKAGE_FILE = path.join(ROOT_DIR, 'package.json');
const PLUGIN_FILE = path.join(ROOT_DIR, '.claude-plugin', 'plugin.json');
const AUTO_ACTION = (process.env.ULTRA_DOC_AUTO_ACTION || '').toLowerCase();

function runScript(scriptName) {
    const scriptPath = path.join(__dirname, scriptName);
    if (!fs.existsSync(scriptPath)) {
        console.error(`❌ Script not found: ${scriptName}`);
        process.exit(1);
    }

    execSync(`node "${scriptPath}"`, { stdio: 'inherit' });
}

function readJson(file) {
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function enforceInstallation() {
    if (!fs.existsSync(CONFIG_FILE)) {
        console.log('⚠️  Ultra-Doc is not installed in this repository.');
        console.log('\nRun `/ultra-doc install` to create the required structure.');
        process.exit(0);
    }
}

function checkVersion() {
    const config = readJson(CONFIG_FILE);
    const pkg = readJson(PACKAGE_FILE);
    const plugin = readJson(PLUGIN_FILE);

    if (!config || !pkg || !plugin) return;

    const latestVersion = pkg.version || plugin.version;
    const installedVersion = config.version;

    if (installedVersion && latestVersion && installedVersion !== latestVersion) {
        console.log(`⚠️  Ultra-Doc ${latestVersion} is available (installed: ${installedVersion}).`);
        console.log('    Run `/ultra-doc install` to upgrade before continuing.');
    }
}

function runScriptWithContext(scriptName, failureMessage) {
    try {
        runScript(scriptName);
    } catch (error) {
        if (failureMessage) {
            console.error(failureMessage);
        }
        throw error;
    }
}

function runQuickSync() {
    console.log('⚡ Running quick sync (timestamps + lint)...');
    runScript('update-timestamps.mjs');
    runScript('autofix-linting.mjs');
    process.env.ULTRA_DOC_SKIP_PARITY = '1';
    runScript('lint-documentation.mjs');
    delete process.env.ULTRA_DOC_SKIP_PARITY;
    runScript('generate-human-doc.mjs');
}

function runFullSync() {
    runScriptWithContext(
        'track-code-changes.mjs',
        '❌ Tracking code changes failed. Check context_for_llms/CODE_CHANGES.json for details.'
    );
    runScriptWithContext(
        'sync-doc-metadata.mjs',
        '❌ Metadata sync failed. Review context_for_llms/LINT_WARNINGS.md to fix blocking issues.'
    );
    runScriptWithContext(
        'validate-accuracy.mjs',
        '❌ Accuracy checks failed. Inspect context_for_llms/VALIDATION.json to resolve mismatches.'
    );
}

function runReportOnly() {
    runScript('generate-report.mjs');
    const reportPath = path.join(ROOT_DIR, 'reports', 'ultra-doc-summary.md');
    if (fs.existsSync(reportPath)) {
        console.log('\n📄 Latest summary saved to reports/ultra-doc-summary.md');
    }
}

function runValidationOnly() {
    console.log('🧪 Running validation + accuracy checks...');
    runScriptWithContext(
        'track-code-changes.mjs',
        '❌ Tracking code changes failed. Check context_for_llms/CODE_CHANGES.json for details.'
    );
    runScriptWithContext(
        'validate-accuracy.mjs',
        '❌ Accuracy checks failed. Inspect context_for_llms/VALIDATION.json to resolve mismatches.'
    );
    console.log('✅ Validation complete. Review context_for_llms/VALIDATION.json for details.');
}

function analyzeState() {
    runScript('analyze-doc-state.mjs');
    if (!fs.existsSync(DOC_STATE_FILE)) {
        throw new Error('Failed to generate DOC_STATE.json');
    }
    return JSON.parse(fs.readFileSync(DOC_STATE_FILE, 'utf-8'));
}

function logHealth(state) {
    console.log('\n📋 Documentation Health');
    console.log(`  • Docs analyzed: ${state.metrics.total_docs}`);
    console.log(`  • Stale docs: ${state.metrics.stale_docs}`);
    console.log(`  • Coverage (docs with pointers): ${state.metrics.coverage_percentage}%`);
    console.log(`  • Relationships tracked: ${state.metrics.total_relationships}`);

    if (state.priorities.length > 0) {
        console.log('\n🔎 Top Priorities:');
        state.priorities.slice(0, 3).forEach(priority => {
            console.log(`  - [${priority.impact.toUpperCase()}] ${priority.file}: ${priority.reason}`);
        });
    } else {
        console.log('\n✅ Documentation looks healthy!');
    }
}

const ACTION_RUNNERS = {
    sync: runFullSync,
    quick: runQuickSync,
    validate: runValidationOnly,
    summary: runReportOnly
};

function normalizeAction(action) {
    if (!action) return null;
    return ACTION_RUNNERS[action] ? action : null;
}

async function promptForAction(options, defaultIndex = 0) {
    console.log('\nWhat would you like to do?');
    options.forEach((option, index) => {
        const marker = option.recommended ? ' (recommended)' : '';
        console.log(`  ${index + 1}. ${option.label}${marker}`);
    });

    if (!process.stdin.isTTY) {
        const fallback = options[defaultIndex];
        console.log(`\nℹ️  No interactive input detected. Running default action: ${fallback.label}`);
        return fallback;
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const question = () => new Promise(resolve => {
        rl.question('\nEnter choice (press Enter for default): ', answer => resolve(answer.trim()));
    });

    let choice = await question();
    rl.close();

    if (!choice) return options[defaultIndex];
    const numeric = parseInt(choice, 10);
    if (!Number.isNaN(numeric) && numeric >= 1 && numeric <= options.length) {
        return options[numeric - 1];
    }

    console.log('⚠️  Invalid selection. Using default action.');
    return options[defaultIndex];
}

async function renderContextualMenu(state) {
    logHealth(state);

    const shouldRecommendFullSync = state.metrics.stale_docs > 0 || state.priorities.length > 0;

    const options = [
        {
            id: 'sync',
            label: 'Run full sync (metadata + translation + lint)',
            recommended: shouldRecommendFullSync
        },
        {
            id: 'quick',
            label: 'Run quick lint & autofix'
        },
        {
            id: 'validate',
            label: 'Validate accuracy & code references'
        },
        {
            id: 'summary',
            label: 'Generate summary report only',
            recommended: !shouldRecommendFullSync
        },
        {
            id: 'exit',
            label: 'Exit without taking action'
        }
    ];

    const defaultIndex = shouldRecommendFullSync
        ? options.findIndex(opt => opt.id === 'sync')
        : options.findIndex(opt => opt.id === 'summary');
    const selection = await promptForAction(options, defaultIndex);

    if (selection.id === 'exit') {
        console.log('👋 No actions selected. Rerun `/ultra-doc` when you need updates.');
        return;
    }

    await executeAction(selection.id);
}

async function executeAction(actionId) {
    const normalized = normalizeAction(actionId);
    if (!normalized) {
        console.log(`⚠️  Unknown action: ${actionId}`);
        return;
    }
    ACTION_RUNNERS[normalized]();
    console.log('\n🔁 Rechecking documentation health...');
    const refreshedState = analyzeState();
    logHealth(refreshedState);
}

function determinePresetAction(state) {
    const envAction = normalizeAction(AUTO_ACTION);
    if (envAction) {
        console.log(`🔁 ULTRA_DOC_AUTO_ACTION=${envAction} detected. Running preset workflow...`);
        return envAction;
    }

    if (state.metrics.stale_docs > 0) {
        console.log('⚠️  Stale documentation detected. Running full sync...');
        return 'sync';
    }

    return null;
}

async function main() {
    console.log('🚀 Ultra-Doc 2.0 Orchestrator\n');

    enforceInstallation();
    checkVersion();

    const state = analyzeState();

    const preset = determinePresetAction(state);
    if (preset) {
        await executeAction(preset);
        return;
    }

    await renderContextualMenu(state);
}

main().catch(error => {
    console.error('❌ Orchestrator failed:', error.message);
    process.exit(1);
});
