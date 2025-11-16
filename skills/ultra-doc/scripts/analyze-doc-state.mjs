#!/usr/bin/env node

/**
 * analyze-doc-state.mjs
 *
 * Analyzes documentation health and generates DOC_STATE.json
 * Tracks completeness, freshness, and validation status of all docs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DOCS_DIR = path.join(process.cwd(), 'context_for_llms');
const CODE_POINTERS_FILE = path.join(DOCS_DIR, 'CODE_POINTERS.json');
const OUTPUT_FILE = path.join(DOCS_DIR, 'DOC_STATE.json');

/**
 * Get file modification time
 */
function getFileModTime(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.mtime.toISOString();
  } catch (error) {
    return null;
  }
}

/**
 * Calculate days between two dates
 */
function daysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Analyze a single markdown file
 */
function analyzeMarkdownFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Count sections (headings)
  const headings = lines.filter(line => line.trim().startsWith('#'));
  const sectionCount = headings.length;

  // Estimate completeness based on content length and structure
  const wordCount = content.split(/\s+/).length;
  const codeBlocks = (content.match(/```/g) || []).length / 2;

  // Simple completeness score (0-1)
  // Based on: has headings, has content, has examples
  let completeness = 0;
  if (sectionCount > 0) completeness += 0.3;
  if (wordCount > 200) completeness += 0.3;
  if (codeBlocks > 0) completeness += 0.2;
  if (wordCount > 500) completeness += 0.2;

  return {
    sectionCount,
    wordCount,
    codeBlockCount: codeBlocks,
    completeness: Math.min(1.0, completeness)
  };
}

/**
 * Determine staleness risk
 */
function calculateStaleRisk(docUpdateTime, codeChangeTime) {
  if (!codeChangeTime) return 'none';

  const docDate = new Date(docUpdateTime);
  const codeDate = new Date(codeChangeTime);

  if (docDate >= codeDate) return 'none';

  const daysSinceCodeChange = daysBetween(codeDate, new Date());
  const daysSinceDocUpdate = daysBetween(docUpdateTime, codeChangeTime);

  if (daysSinceDocUpdate > 30) return 'critical';
  if (daysSinceDocUpdate > 7) return 'high';
  if (daysSinceDocUpdate > 3) return 'medium';
  return 'low';
}

/**
 * Main analysis function
 */
function analyzeDocState() {
  console.log('📊 Analyzing documentation state...\n');

  // Check if docs directory exists
  if (!fs.existsSync(DOCS_DIR)) {
    console.error(`❌ Documentation directory not found: ${DOCS_DIR}`);
    process.exit(1);
  }

  // Load CODE_POINTERS.json if it exists
  let codePointers = {};
  if (fs.existsSync(CODE_POINTERS_FILE)) {
    codePointers = JSON.parse(fs.readFileSync(CODE_POINTERS_FILE, 'utf-8'));
  }

  // Get all markdown files
  const files = fs.readdirSync(DOCS_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(DOCS_DIR, f));

  const state = {
    generated: new Date().toISOString(),
    version: '2.0.0',
    files: {},
    metrics: {
      total_docs: files.length,
      complete_docs: 0,
      incomplete_docs: 0,
      stale_docs: 0,
      accuracy_score: 1.0, // Default, will be updated by validation
      coverage_percentage: 0 // Will be updated by coverage analysis
    },
    priorities: []
  };

  // Analyze each file
  for (const filePath of files) {
    const relativePath = path.relative(process.cwd(), filePath);
    const fileName = path.basename(filePath);

    const lastUpdated = getFileModTime(filePath);
    const analysis = analyzeMarkdownFile(filePath);

    // Get linked code files from CODE_POINTERS
    const linkedFiles = [];
    let lastCodeChange = null;

    for (const [key, value] of Object.entries(codePointers)) {
      if (key.startsWith(fileName)) {
        if (value.files) {
          linkedFiles.push(...value.files);

          // Check modification time of linked files
          for (const codeFile of value.files) {
            const codeFilePath = path.join(process.cwd(), codeFile);
            const modTime = getFileModTime(codeFilePath);
            if (modTime && (!lastCodeChange || modTime > lastCodeChange)) {
              lastCodeChange = modTime;
            }
          }
        }
      }
    }

    const staleRisk = calculateStaleRisk(lastUpdated, lastCodeChange);
    const status = staleRisk === 'none' || staleRisk === 'low' ? 'current' : 'stale';

    if (analysis.completeness >= 0.7) {
      state.metrics.complete_docs++;
    } else {
      state.metrics.incomplete_docs++;
    }

    if (status === 'stale') {
      state.metrics.stale_docs++;
    }

    state.files[relativePath] = {
      status,
      completeness: analysis.completeness,
      lastUpdated,
      linkedFiles,
      lastCodeChange,
      validationNeeded: status === 'stale',
      sectionCount: analysis.sectionCount,
      wordCount: analysis.wordCount,
      codeBlockCount: analysis.codeBlockCount,
      staleRisk
    };

    // Add to priorities if needs attention
    if (analysis.completeness < 0.7) {
      state.priorities.push({
        file: relativePath,
        action: 'enhance',
        reason: `Low completeness score (${Math.round(analysis.completeness * 100)}%)`,
        impact: analysis.completeness < 0.4 ? 'high' : 'medium'
      });
    }

    if (staleRisk === 'critical' || staleRisk === 'high') {
      state.priorities.push({
        file: relativePath,
        action: 'update',
        reason: `Stale documentation (code changed ${lastCodeChange})`,
        impact: staleRisk
      });
    }
  }

  // Sort priorities by impact
  const impactOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  state.priorities.sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact]);

  // Write output
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(state, null, 2));

  console.log(`✓ Analyzed ${files.length} documentation files`);
  console.log(`  Complete: ${state.metrics.complete_docs}`);
  console.log(`  Incomplete: ${state.metrics.incomplete_docs}`);
  console.log(`  Stale: ${state.metrics.stale_docs}`);
  console.log(`  Priorities identified: ${state.priorities.length}`);
  console.log(`\n✓ DOC_STATE.json generated: ${OUTPUT_FILE}`);
}

// Run analysis
try {
  analyzeDocState();
} catch (error) {
  console.error('❌ Error analyzing documentation state:', error.message);
  process.exit(1);
}
