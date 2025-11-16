#!/usr/bin/env node

/**
 * analyze-coverage.mjs
 *
 * Analyzes code coverage by documentation
 * Identifies which code files are documented vs undocumented
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
const OUTPUT_FILE = path.join(DOCS_DIR, 'COVERAGE.json');

// Common source directories to scan
const SOURCE_DIRS = ['src', 'lib', 'app', 'packages'];

// File extensions to analyze
const CODE_EXTENSIONS = ['.js', '.ts', '.jsx', '.tsx', '.py', '.go', '.rs', '.java'];

/**
 * Check if git is available and we're in a git repo
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
 * Get all tracked files using git
 */
function getGitFiles() {
  try {
    const output = execSync('git ls-files', { encoding: 'utf-8' });
    return output.split('\n').filter(Boolean);
  } catch {
    return null;
  }
}

/**
 * Recursively get files from directory
 */
function getFilesRecursive(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      // Skip node_modules, .git, dist, build, etc.
      if (!['node_modules', '.git', 'dist', 'build', 'out', '.next', 'coverage'].includes(file)) {
        getFilesRecursive(filePath, fileList);
      }
    } else if (stats.isFile()) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

/**
 * Get all code files to analyze
 */
function getAllCodeFiles() {
  let allFiles = [];

  // Try git first
  if (isGitRepo()) {
    const gitFiles = getGitFiles();
    if (gitFiles) {
      allFiles = gitFiles.map(f => path.join(process.cwd(), f));
    }
  }

  // Fallback to filesystem scan
  if (allFiles.length === 0) {
    for (const dir of SOURCE_DIRS) {
      const dirPath = path.join(process.cwd(), dir);
      if (fs.existsSync(dirPath)) {
        getFilesRecursive(dirPath, allFiles);
      }
    }
  }

  // Filter to only code files
  return allFiles.filter(f => {
    const ext = path.extname(f);
    return CODE_EXTENSIONS.includes(ext);
  });
}

/**
 * Count usage of a file (how many times it's imported)
 */
function countFileUsage(filePath, allFiles) {
  const fileName = path.basename(filePath, path.extname(filePath));
  const relativePath = path.relative(process.cwd(), filePath);

  let usageCount = 0;

  for (const file of allFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8');

      // Check for various import patterns
      const patterns = [
        new RegExp(`from ['"].*${fileName}['"]`, 'g'),
        new RegExp(`require\\(['"].*${fileName}['"]\\)`, 'g'),
        new RegExp(`import.*${fileName}`, 'g'),
        new RegExp(`import\\s+.*\\s+from\\s+['"].*${relativePath.replace(/\\/g, '/')}['"]`, 'g')
      ];

      for (const pattern of patterns) {
        const matches = content.match(pattern);
        if (matches) {
          usageCount += matches.length;
        }
      }
    } catch {
      // Skip files that can't be read
    }
  }

  return usageCount;
}

/**
 * Parse exports from a file (simple heuristic)
 */
function parseExports(filePath) {
  const ext = path.extname(filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  const exports = [];

  if (ext === '.js' || ext === '.jsx' || ext === '.ts' || ext === '.tsx') {
    // Named exports: export function foo()
    const namedExports = content.match(/export\s+(function|const|let|var|class)\s+(\w+)/g) || [];
    for (const exp of namedExports) {
      const match = exp.match(/export\s+(?:function|const|let|var|class)\s+(\w+)/);
      if (match) exports.push(match[1]);
    }

    // Default export
    if (content.includes('export default')) {
      exports.push('default');
    }
  } else if (ext === '.py') {
    // Python functions and classes
    const defs = content.match(/^def\s+(\w+)/gm) || [];
    const classes = content.match(/^class\s+(\w+)/gm) || [];

    for (const def of defs) {
      const match = def.match(/def\s+(\w+)/);
      if (match && !match[1].startsWith('_')) exports.push(match[1]);
    }

    for (const cls of classes) {
      const match = cls.match(/class\s+(\w+)/);
      if (match && !match[1].startsWith('_')) exports.push(match[1]);
    }
  }

  return exports;
}

/**
 * Main coverage analysis function
 */
function analyzeCoverage() {
  console.log('📊 Analyzing code coverage...\n');

  // Load CODE_POINTERS.json if it exists
  let codePointers = {};
  if (fs.existsSync(CODE_POINTERS_FILE)) {
    codePointers = JSON.parse(fs.readFileSync(CODE_POINTERS_FILE, 'utf-8'));
  }

  // Get documented files from CODE_POINTERS
  const documentedFiles = new Set();
  for (const value of Object.values(codePointers)) {
    if (value.files) {
      for (const file of value.files) {
        documentedFiles.add(file);
      }
    }
  }

  // Get all code files
  const allCodeFiles = getAllCodeFiles();
  console.log(`Found ${allCodeFiles.length} code files`);

  const coverage = {
    generated: new Date().toISOString(),
    coverage_stats: {
      total_files: allCodeFiles.length,
      documented_files: 0,
      undocumented_files: 0,
      coverage_percentage: 0
    },
    documented: [],
    undocumented: [],
    partially_documented: []
  };

  for (const filePath of allCodeFiles) {
    const relativePath = path.relative(process.cwd(), filePath);

    // Check if file is documented
    const isDocumented = documentedFiles.has(relativePath) ||
                         documentedFiles.has(filePath) ||
                         Array.from(documentedFiles).some(d => d.includes(path.basename(filePath)));

    if (isDocumented) {
      coverage.coverage_stats.documented_files++;
      coverage.documented.push(relativePath);
    } else {
      coverage.coverage_stats.undocumented_files++;

      // Get exports and usage count
      const exports = parseExports(filePath);
      const usageCount = countFileUsage(filePath, allCodeFiles);

      // Determine priority
      let priority = 'low';
      if (usageCount > 10) priority = 'high';
      else if (usageCount > 5) priority = 'medium';

      coverage.undocumented.push({
        file: relativePath,
        type: detectFileType(filePath),
        exports,
        usage_count: usageCount,
        priority,
        suggested_location: suggestDocLocation(relativePath)
      });
    }
  }

  // Sort undocumented by priority and usage
  coverage.undocumented.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.usage_count - a.usage_count;
  });

  // Calculate coverage percentage
  if (coverage.coverage_stats.total_files > 0) {
    coverage.coverage_stats.coverage_percentage =
      Math.round((coverage.coverage_stats.documented_files / coverage.coverage_stats.total_files) * 100) / 100;
  }

  // Write output
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(coverage, null, 2));

  console.log(`\n✓ Coverage Analysis Complete:`);
  console.log(`  Total files: ${coverage.coverage_stats.total_files}`);
  console.log(`  Documented: ${coverage.coverage_stats.documented_files}`);
  console.log(`  Undocumented: ${coverage.coverage_stats.undocumented_files}`);
  console.log(`  Coverage: ${Math.round(coverage.coverage_stats.coverage_percentage * 100)}%`);
  console.log(`\n✓ COVERAGE.json generated: ${OUTPUT_FILE}`);
}

/**
 * Detect file type from path
 */
function detectFileType(filePath) {
  const fileName = path.basename(filePath).toLowerCase();

  if (fileName.includes('test') || fileName.includes('spec')) return 'test';
  if (fileName.includes('util') || fileName.includes('helper')) return 'utility';
  if (fileName.includes('config')) return 'config';
  if (fileName.includes('route') || fileName.includes('controller')) return 'api';
  if (fileName.includes('model')) return 'model';
  if (fileName.includes('component')) return 'component';

  return 'module';
}

/**
 * Suggest where documentation should go
 */
function suggestDocLocation(filePath) {
  const type = detectFileType(filePath);

  const locationMap = {
    'utility': 'context_for_llms/utilities.md',
    'api': 'context_for_llms/api-overview.md',
    'model': 'context_for_llms/domains-and-modules.md',
    'component': 'context_for_llms/architecture.md',
    'config': 'context_for_llms/development-workflows.md',
    'module': 'context_for_llms/architecture.md'
  };

  return locationMap[type] || 'context_for_llms/architecture.md';
}

// Run analysis
try {
  analyzeCoverage();
} catch (error) {
  console.error('❌ Error analyzing coverage:', error.message);
  process.exit(1);
}
