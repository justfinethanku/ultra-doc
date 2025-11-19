#!/usr/bin/env node

/**
 * Render Relationships
 * Scans source code for imports to build a dependency graph.
 * Generates context_for_llms/RELATIONSHIPS.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = process.cwd();
const LLM_DIR = path.join(ROOT_DIR, 'context_for_llms');
const OUTPUT_FILE = path.join(LLM_DIR, 'RELATIONSHIPS.json');

// Simple regex to find imports
const IMPORT_REGEX = /import\s+(?:[^'"]+from\s+)?['"]([^'"]+)['"]/g;
const REQUIRE_REGEX = /require\(['"]([^'"]+)['"]\)/g;

function scanFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && !file.startsWith('.')) {
        scanFiles(filePath, fileList);
      }
    } else if (file.endsWith('.js') || file.endsWith('.mjs') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function extractImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const imports = [];

  let match;
  while ((match = IMPORT_REGEX.exec(content)) !== null) {
    imports.push(match[1]);
  }
  while ((match = REQUIRE_REGEX.exec(content)) !== null) {
    imports.push(match[1]);
  }

  return imports;
}

function renderRelationships() {
  console.log('🕸️  Rendering Relationships...');

  if (!fs.existsSync(LLM_DIR)) {
    fs.mkdirSync(LLM_DIR, { recursive: true });
  }

  const sourceFiles = scanFiles(ROOT_DIR);
  const relationships = {
    nodes: [],
    edges: []
  };

  const fileIdMap = new Map();

  // Create nodes
  sourceFiles.forEach((file, index) => {
    const relativePath = path.relative(ROOT_DIR, file);
    relationships.nodes.push({
      id: relativePath,
      type: 'file'
    });
    fileIdMap.set(relativePath, relativePath);
  });

  // Create edges
  for (const file of sourceFiles) {
    const relativePath = path.relative(ROOT_DIR, file);
    const imports = extractImports(file);

    for (const imp of imports) {
      // Resolve import to file path (simplified)
      let target = imp;
      if (imp.startsWith('.')) {
        const resolved = path.join(path.dirname(file), imp);
        // Try adding extensions
        const extensions = ['.js', '.mjs', '.ts', '/index.js'];
        for (const ext of extensions) {
          if (fs.existsSync(resolved + ext)) {
            target = path.relative(ROOT_DIR, resolved + ext);
            break;
          }
          if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
            target = path.relative(ROOT_DIR, resolved);
            break;
          }
        }
      }

      // Only add edge if target is in our source files
      if (fileIdMap.has(target)) {
        relationships.edges.push({
          source: relativePath,
          target: target,
          type: 'import'
        });
      }
    }
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(relationships, null, 2));
  console.log(`  ✓ Mapped ${relationships.edges.length} dependencies.`);
}

renderRelationships();
