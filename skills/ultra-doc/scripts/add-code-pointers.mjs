#!/usr/bin/env node

/**
 * Add Code Pointers
 * Creates CODE_POINTERS.json mapping documentation sections to source files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTEXT_DIR = path.join(process.cwd(), 'context_for_llms');
const OUTPUT_FILE = path.join(CONTEXT_DIR, 'CODE_POINTERS.json');

function findSourceFiles() {
  const sourceExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.go', '.rs', '.java', '.rb', '.php'];
  const excludeDirs = ['node_modules', 'dist', 'build', '.git', 'coverage', '__pycache__'];

  try {
    // Use git ls-files if in a git repo for better performance
    const gitFiles = execSync('git ls-files 2>/dev/null || true', { encoding: 'utf-8' })
      .split('\n')
      .filter(f => f && sourceExtensions.some(ext => f.endsWith(ext)));

    if (gitFiles.length > 0) {
      return gitFiles;
    }
  } catch (e) {
    // Fall back to directory scan
  }

  // Fallback: scan directories
  const files = [];

  function scan(dir) {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (excludeDirs.includes(entry.name)) continue;

      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (sourceExtensions.some(ext => entry.name.endsWith(ext))) {
        files.push(path.relative(process.cwd(), fullPath));
      }
    }
  }

  scan(process.cwd());
  return files;
}

function extractCodeReferences(content) {
  const references = [];
  const codeBlockPattern = /```[\w]*\n([\s\S]*?)```/g;
  const filePathPattern = /(?:from|import|require)\s+['"]([^'"]+)['"]/g;
  const classPattern = /class\s+(\w+)/g;
  const functionPattern = /(?:function|def|fn)\s+(\w+)/g;

  // Extract from code blocks
  let match;
  while ((match = codeBlockPattern.exec(content)) !== null) {
    const codeBlock = match[1];

    // Look for file paths in imports
    let pathMatch;
    while ((pathMatch = filePathPattern.exec(codeBlock)) !== null) {
      references.push({ type: 'import', value: pathMatch[1] });
    }

    // Look for class names
    let classMatch;
    while ((classMatch = classPattern.exec(codeBlock)) !== null) {
      references.push({ type: 'class', value: classMatch[1] });
    }

    // Look for function names
    let funcMatch;
    while ((funcMatch = functionPattern.exec(codeBlock)) !== null) {
      references.push({ type: 'function', value: funcMatch[1] });
    }
  }

  return references;
}

function matchReferencesToFiles(references, sourceFiles) {
  const pointers = [];

  for (const ref of references) {
    if (ref.type === 'import') {
      // Try to match import paths to actual files
      const candidates = sourceFiles.filter(f =>
        f.includes(ref.value) ||
        path.basename(f, path.extname(f)) === path.basename(ref.value)
      );

      for (const file of candidates) {
        pointers.push({ file, reason: `imports ${ref.value}` });
      }
    } else if (ref.type === 'class' || ref.type === 'function') {
      // Search source files for class/function definitions
      for (const file of sourceFiles) {
        try {
          const content = fs.readFileSync(file, 'utf-8');
          const pattern = new RegExp(`(?:class|function|def|fn)\\s+${ref.value}\\b`);

          if (pattern.test(content)) {
            pointers.push({ file, reason: `defines ${ref.type} ${ref.value}` });
          }
        } catch (e) {
          // Skip files that can't be read
        }
      }
    }
  }

  return pointers;
}

function generateCodePointers() {
  if (!fs.existsSync(CONTEXT_DIR)) {
    console.error('Error: context_for_llms directory not found');
    process.exit(1);
  }

  const docFiles = fs.readdirSync(CONTEXT_DIR).filter(f => f.endsWith('.md'));
  const sourceFiles = findSourceFiles();
  const mappings = {};

  for (const docFile of docFiles) {
    const filePath = path.join(CONTEXT_DIR, docFile);
    const content = fs.readFileSync(filePath, 'utf-8');
    const references = extractCodeReferences(content);
    const pointers = matchReferencesToFiles(references, sourceFiles);

    if (pointers.length > 0) {
      mappings[docFile] = pointers.reduce((acc, p) => {
        if (!acc[p.file]) {
          acc[p.file] = [];
        }
        if (!acc[p.file].includes(p.reason)) {
          acc[p.file].push(p.reason);
        }
        return acc;
      }, {});
    }
  }

  const output = {
    generated: new Date().toISOString(),
    total_source_files: sourceFiles.length,
    total_mappings: Object.keys(mappings).length,
    mappings
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`Generated CODE_POINTERS.json with ${Object.keys(mappings).length} doc → source mappings`);
}

generateCodePointers();
