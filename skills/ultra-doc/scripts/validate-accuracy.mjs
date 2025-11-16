#!/usr/bin/env node

/**
 * validate-accuracy.mjs
 *
 * Validates documentation accuracy by checking factual claims against code
 * Follows CODE_POINTERS.json links for targeted validation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DOCS_DIR = path.join(process.cwd(), 'context_for_llms');
const CODE_POINTERS_FILE = path.join(DOCS_DIR, 'CODE_POINTERS.json');
const OUTPUT_FILE = path.join(DOCS_DIR, 'VALIDATION.json');

/**
 * Extract file paths mentioned in documentation
 */
function extractFilePaths(content) {
  const paths = [];

  // Match various file path patterns
  const patterns = [
    /`([^`]+\.(js|ts|jsx|tsx|py|go|rs|java|rb)(?::\d+)?)`/g,  // `src/file.js:12`
    /\(([^)]+\.(js|ts|jsx|tsx|py|go|rs|java|rb))\)/g,          // (src/file.js)
    /['"]([^'"]+\.(js|ts|jsx|tsx|py|go|rs|java|rb))['"]/g      // "src/file.js"
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const filePath = match[1].split(':')[0]; // Remove line numbers
      paths.push(filePath);
    }
  }

  return [...new Set(paths)]; // Deduplicate
}

/**
 * Check if referenced files exist
 */
function validateFilePaths(docFile, content) {
  const errors = [];
  const filePaths = extractFilePaths(content);

  for (const filePath of filePaths) {
    const fullPath = path.join(process.cwd(), filePath);

    if (!fs.existsSync(fullPath)) {
      errors.push({
        docFile,
        type: 'broken_reference',
        severity: 'error',
        message: `Referenced file does not exist: ${filePath}`,
        autoFixable: false
      });
    }
  }

  return errors;
}

/**
 * Extract code examples from documentation
 */
function extractCodeExamples(content) {
  const examples = [];
  const codeBlockPattern = /```(\w+)?\n([\s\S]*?)```/g;

  let match;
  while ((match = codeBlockPattern.exec(content)) !== null) {
    const language = match[1] || 'unknown';
    const code = match[2];

    examples.push({
      language,
      code: code.trim(),
      startIndex: match.index
    });
  }

  return examples;
}

/**
 * Validate code examples for basic syntax issues
 */
function validateCodeExamples(docFile, content) {
  const errors = [];
  const examples = extractCodeExamples(content);

  for (const example of examples) {
    // Check for common issues
    if (example.language === 'javascript' || example.language === 'typescript') {
      // Check for unmatched braces
      const openBraces = (example.code.match(/{/g) || []).length;
      const closeBraces = (example.code.match(/}/g) || []).length;

      if (openBraces !== closeBraces) {
        errors.push({
          docFile,
          type: 'code_example_error',
          severity: 'warning',
          message: 'Code example has unmatched braces',
          context: example.code.substring(0, 100),
          autoFixable: false
        });
      }

      // Check for common deprecated patterns
      if (example.code.includes('app.start(')) {
        errors.push({
          docFile,
          type: 'deprecated_api',
          severity: 'warning',
          message: 'Code example may use deprecated API: app.start()',
          context: example.code.substring(0, 100),
          autoFixable: false,
          suggestion: 'Check if app.listen() should be used instead'
        });
      }
    }
  }

  return errors;
}

/**
 * Validate documentation via CODE_POINTERS links
 */
function validateViaCodePointers(codePointers) {
  const errors = [];

  for (const [key, value] of Object.entries(codePointers)) {
    const [docFile] = key.split('#');

    if (!value.files) continue;

    for (const codeFile of value.files) {
      const fullPath = path.join(process.cwd(), codeFile);

      // Check if linked file exists
      if (!fs.existsSync(fullPath)) {
        errors.push({
          docFile,
          type: 'broken_code_link',
          severity: 'error',
          message: `CODE_POINTERS references non-existent file: ${codeFile}`,
          codeFile,
          autoFixable: false
        });
        continue;
      }

      // Check if file was modified recently (potential staleness)
      const stats = fs.statSync(fullPath);
      const modTime = stats.mtime;
      const now = new Date();
      const daysSinceModified = (now - modTime) / (1000 * 60 * 60 * 24);

      if (value.lastValidated) {
        const lastValidated = new Date(value.lastValidated);
        const daysSinceValidation = (modTime - lastValidated) / (1000 * 60 * 60 * 24);

        if (daysSinceValidation > 0) {
          errors.push({
            docFile,
            section: key.split('#')[1],
            type: 'stale_documentation',
            severity: daysSinceValidation > 7 ? 'error' : 'warning',
            message: `Code changed ${Math.round(daysSinceValidation)} days after last validation`,
            codeFile,
            lastValidated: value.lastValidated,
            codeModified: modTime.toISOString(),
            autoFixable: false,
            requiresAIReview: true
          });
        }
      }
    }
  }

  return errors;
}

/**
 * Main validation function
 */
function validateAccuracy() {
  console.log('📊 Validating documentation accuracy...\n');

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

  const validation = {
    generated: new Date().toISOString(),
    validation_results: {
      total_checks: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      accuracy_score: 1.0
    },
    errors: [],
    warnings: [],
    info: []
  };

  // Validate via CODE_POINTERS links
  const codePointerErrors = validateViaCodePointers(codePointers);
  validation.errors.push(...codePointerErrors.filter(e => e.severity === 'error'));
  validation.warnings.push(...codePointerErrors.filter(e => e.severity === 'warning'));

  // Get all markdown files
  const files = fs.readdirSync(DOCS_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(DOCS_DIR, f));

  // Validate each file
  for (const filePath of files) {
    const relativePath = path.relative(process.cwd(), filePath);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Validate file paths
    const filePathErrors = validateFilePaths(relativePath, content);
    validation.errors.push(...filePathErrors);

    // Validate code examples
    const codeExampleErrors = validateCodeExamples(relativePath, content);
    validation.warnings.push(...codeExampleErrors.filter(e => e.severity === 'warning'));
    validation.errors.push(...codeExampleErrors.filter(e => e.severity === 'error'));

    validation.validation_results.total_checks++;
  }

  // Calculate results
  validation.validation_results.failed = validation.errors.length;
  validation.validation_results.warnings = validation.warnings.length;
  validation.validation_results.passed =
    validation.validation_results.total_checks - validation.validation_results.failed;

  if (validation.validation_results.total_checks > 0) {
    validation.validation_results.accuracy_score =
      validation.validation_results.passed / validation.validation_results.total_checks;
  }

  // Write output
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(validation, null, 2));

  console.log(`✓ Validation Complete:`);
  console.log(`  Total checks: ${validation.validation_results.total_checks}`);
  console.log(`  Passed: ${validation.validation_results.passed}`);
  console.log(`  Errors: ${validation.validation_results.failed}`);
  console.log(`  Warnings: ${validation.validation_results.warnings}`);
  console.log(`  Accuracy: ${Math.round(validation.validation_results.accuracy_score * 100)}%`);
  console.log(`\n✓ VALIDATION.json generated: ${OUTPUT_FILE}`);

  if (validation.errors.length > 0) {
    console.log('\n⚠️  Found validation errors that need attention');
  }
}

// Run validation
try {
  validateAccuracy();
} catch (error) {
  console.error('❌ Error validating documentation:', error.message);
  process.exit(1);
}
