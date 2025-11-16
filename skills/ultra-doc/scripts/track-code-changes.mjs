#!/usr/bin/env node

/**
 * track-code-changes.mjs
 *
 * Tracks code changes since last documentation update
 * Updates DOC_STATE.json with validation needed flags
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DOCS_DIR = path.join(process.cwd(), 'context_for_llms');
const CODE_POINTERS_FILE = path.join(DOCS_DIR, 'CODE_POINTERS.json');
const DOC_STATE_FILE = path.join(DOCS_DIR, 'DOC_STATE.json');

/**
 * Check if git is available
 */
function isGitRepo() {
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get git log for file changes
 */
function getFileChanges(since = '7 days ago') {
  try {
    const output = execSync(
      `git log --since="${since}" --name-only --pretty=format:"%H|%at|%s"`,
      { encoding: 'utf-8' }
    );

    const changes = new Map();
    const lines = output.split('\n');
    let currentCommit = null;

    for (const line of lines) {
      if (line.includes('|')) {
        // Commit line: hash|timestamp|message
        const [hash, timestamp, ...messageParts] = line.split('|');
        currentCommit = {
          hash,
          timestamp: parseInt(timestamp) * 1000,
          message: messageParts.join('|')
        };
      } else if (line.trim() && currentCommit) {
        // File line
        const file = line.trim();
        if (!changes.has(file)) {
          changes.set(file, []);
        }
        changes.get(file).push(currentCommit);
      }
    }

    return changes;
  } catch (error) {
    console.error('Error getting git changes:', error.message);
    return new Map();
  }
}

/**
 * Analyze impact of changes
 */
function analyzeChangeImpact(filePath, commits) {
  try {
    const firstCommit = commits[0].hash;
    const lastCommit = commits[commits.length - 1].hash;

    const diff = execSync(
      `git diff ${lastCommit} ${firstCommit} -- "${filePath}"`,
      { encoding: 'utf-8' }
    );

    const linesAdded = (diff.match(/^\+[^+]/gm) || []).length;
    const linesRemoved = (diff.match(/^-[^-]/gm) || []).length;
    const totalLines = linesAdded + linesRemoved;

    // Classify change type
    let changeType = 'modified';
    if (linesAdded > 0 && linesRemoved === 0) changeType = 'added';
    if (linesRemoved > 0 && linesAdded === 0) changeType = 'deleted';

    // Estimate impact
    let impact = 'low';
    if (totalLines > 100) impact = 'high';
    else if (totalLines > 20) impact = 'medium';

    // Check for breaking changes (function signature changes, exports, etc.)
    const hasBreakingChange = diff.match(/export|function.*\(|class\s+\w+|interface\s+\w+/) !== null;
    if (hasBreakingChange) impact = 'high';

    return {
      changeType,
      linesAdded,
      linesRemoved,
      totalLines,
      impact,
      hasBreakingChange
    };
  } catch (error) {
    return {
      changeType: 'modified',
      linesAdded: 0,
      linesRemoved: 0,
      totalLines: 0,
      impact: 'unknown'
    };
  }
}

/**
 * Main tracking function
 */
function trackCodeChanges() {
  console.log('📊 Tracking code changes...\n');

  if (!isGitRepo()) {
    console.log('⚠️  Not a git repository. Using file modification times instead.');
    return trackViaFileTimes();
  }

  // Load CODE_POINTERS.json
  let codePointers = {};
  if (fs.existsSync(CODE_POINTERS_FILE)) {
    codePointers = JSON.parse(fs.readFileSync(CODE_POINTERS_FILE, 'utf-8'));
  }

  // Load DOC_STATE.json
  let docState = { files: {} };
  if (fs.existsSync(DOC_STATE_FILE)) {
    docState = JSON.parse(fs.readFileSync(DOC_STATE_FILE, 'utf-8'));
  }

  // Get changes from last 30 days
  const changes = getFileChanges('30 days ago');

  const report = {
    generated: new Date().toISOString(),
    changes_since: '30 days ago',
    total_code_changes: changes.size,
    affected_docs: []
  };

  // Find which docs are affected by changes
  for (const [filePath, commits] of changes) {
    // Find docs that reference this file
    const affectedDocs = new Set();

    for (const [key, value] of Object.entries(codePointers)) {
      if (value.files && value.files.includes(filePath)) {
        const docFile = key.split('#')[0];
        affectedDocs.add(docFile);
      }
    }

    if (affectedDocs.size > 0) {
      const analysis = analyzeChangeImpact(filePath, commits);

      report.affected_docs.push({
        code_file: filePath,
        change_type: analysis.changeType,
        lines_changed: analysis.totalLines,
        affected_documentation: Array.from(affectedDocs),
        impact: analysis.impact,
        breaking_change: analysis.hasBreakingChange,
        most_recent_commit: {
          hash: commits[0].hash.substring(0, 7),
          message: commits[0].message,
          timestamp: new Date(commits[0].timestamp).toISOString()
        }
      });

      // Update DOC_STATE.json to mark docs as needing validation
      for (const docFile of affectedDocs) {
        const docPath = `context_for_llms/${docFile}`;
        if (docState.files[docPath]) {
          docState.files[docPath].validationNeeded = true;
          docState.files[docPath].lastCodeChange = new Date(commits[0].timestamp).toISOString();
          docState.files[docPath].status = 'stale';
        }
      }
    }
  }

  // Sort by impact
  const impactOrder = { high: 0, medium: 1, low: 2, unknown: 3 };
  report.affected_docs.sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact]);

  // Update DOC_STATE.json
  if (Object.keys(docState.files).length > 0) {
    fs.writeFileSync(DOC_STATE_FILE, JSON.stringify(docState, null, 2));
    console.log('✓ Updated DOC_STATE.json with validation flags');
  }

  // Save report
  const reportPath = path.join(DOCS_DIR, 'CODE_CHANGES.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`✓ Tracked ${changes.size} code file changes`);
  console.log(`✓ Found ${report.affected_docs.length} documentation files affected`);
  console.log(`\n✓ CODE_CHANGES.json generated: ${reportPath}`);

  if (report.affected_docs.length > 0) {
    console.log('\n⚠️  Documentation may need updating for:');
    for (const item of report.affected_docs.slice(0, 5)) {
      console.log(`  - ${item.code_file} (${item.impact} impact)`);
    }
  }
}

/**
 * Fallback: Track via file modification times
 */
function trackViaFileTimes() {
  console.log('Using file modification times for tracking...\n');

  // Load CODE_POINTERS.json
  let codePointers = {};
  if (fs.existsSync(CODE_POINTERS_FILE)) {
    codePointers = JSON.parse(fs.readFileSync(CODE_POINTERS_FILE, 'utf-8'));
  }

  // Load DOC_STATE.json
  let docState = { files: {} };
  if (fs.existsSync(DOC_STATE_FILE)) {
    docState = JSON.parse(fs.readFileSync(DOC_STATE_FILE, 'utf-8'));
  }

  let changesFound = 0;

  // Check each code file referenced in CODE_POINTERS
  for (const [key, value] of Object.entries(codePointers)) {
    if (!value.files) continue;

    const docFile = key.split('#')[0];
    const docPath = `context_for_llms/${docFile}`;

    for (const codeFile of value.files) {
      const fullPath = path.join(process.cwd(), codeFile);

      if (fs.existsSync(fullPath)) {
        const codeStats = fs.statSync(fullPath);
        const codeModTime = codeStats.mtime;

        // Get doc mod time
        const docFullPath = path.join(process.cwd(), docPath);
        if (fs.existsSync(docFullPath)) {
          const docStats = fs.statSync(docFullPath);
          const docModTime = docStats.mtime;

          // If code is newer than doc
          if (codeModTime > docModTime) {
            if (docState.files[docPath]) {
              docState.files[docPath].validationNeeded = true;
              docState.files[docPath].lastCodeChange = codeModTime.toISOString();
              docState.files[docPath].status = 'stale';
              changesFound++;
            }
          }
        }
      }
    }
  }

  // Update DOC_STATE.json
  if (changesFound > 0) {
    fs.writeFileSync(DOC_STATE_FILE, JSON.stringify(docState, null, 2));
    console.log(`✓ Found ${changesFound} potentially stale documentation files`);
    console.log('✓ Updated DOC_STATE.json');
  } else {
    console.log('✓ No stale documentation detected');
  }
}

// Run tracking
try {
  trackCodeChanges();
} catch (error) {
  console.error('❌ Error tracking code changes:', error.message);
  process.exit(1);
}
