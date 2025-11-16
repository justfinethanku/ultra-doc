#!/usr/bin/env node

/**
 * Render Relationships
 * Creates RELATIONSHIPS.json with dependency and relationship information
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTEXT_DIR = path.join(process.cwd(), 'context_for_llms');
const OUTPUT_FILE = path.join(CONTEXT_DIR, 'RELATIONSHIPS.json');

function detectProjectType() {
  const indicators = {
    nodejs: 'package.json',
    python: 'requirements.txt',
    go: 'go.mod',
    rust: 'Cargo.toml',
    ruby: 'Gemfile',
    java: 'pom.xml'
  };

  for (const [type, file] of Object.entries(indicators)) {
    if (fs.existsSync(path.join(process.cwd(), file))) {
      return type;
    }
  }

  return 'unknown';
}

function extractNodeJSDependencies() {
  const pkgPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(pkgPath)) return [];

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const deps = [];

  if (pkg.dependencies) {
    for (const [name, version] of Object.entries(pkg.dependencies)) {
      deps.push({ name, version, type: 'production' });
    }
  }

  if (pkg.devDependencies) {
    for (const [name, version] of Object.entries(pkg.devDependencies)) {
      deps.push({ name, version, type: 'development' });
    }
  }

  return deps;
}

function extractPythonDependencies() {
  const reqPath = path.join(process.cwd(), 'requirements.txt');
  if (!fs.existsSync(reqPath)) return [];

  const content = fs.readFileSync(reqPath, 'utf-8');
  const deps = [];

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^([a-zA-Z0-9\-_]+)([>=<~!]*)([\d.]*)/);
    if (match) {
      deps.push({
        name: match[1],
        version: match[3] || 'latest',
        type: 'production'
      });
    }
  }

  return deps;
}

function extractDocumentationRelationships() {
  if (!fs.existsSync(CONTEXT_DIR)) return [];

  const files = fs.readdirSync(CONTEXT_DIR).filter(f => f.endsWith('.md'));
  const relationships = [];

  for (const file of files) {
    const filePath = path.join(CONTEXT_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Find markdown links to other docs
    const linkPattern = /\[([^\]]+)\]\(([^)]+\.md)\)/g;
    let match;

    while ((match = linkPattern.exec(content)) !== null) {
      const targetFile = path.basename(match[2]);

      relationships.push({
        from: file,
        to: targetFile,
        type: 'references',
        label: match[1]
      });
    }

    // Find headings that suggest relationships
    const headingPattern = /^#{1,6}\s+(.+)/gm;
    const headings = [];

    while ((match = headingPattern.exec(content)) !== null) {
      headings.push(match[1]);
    }

    // Look for "Related" or "See also" sections
    if (headings.some(h => /related|see also/i.test(h))) {
      relationships.push({
        from: file,
        type: 'has_related',
        note: 'Contains related documentation section'
      });
    }
  }

  return relationships;
}

function buildDependencyGraph(deps) {
  const graph = {
    nodes: [],
    edges: []
  };

  const depGroups = deps.reduce((acc, dep) => {
    if (!acc[dep.type]) acc[dep.type] = [];
    acc[dep.type].push(dep);
    return acc;
  }, {});

  for (const [type, typeDeps] of Object.entries(depGroups)) {
    graph.nodes.push({
      id: type,
      label: type,
      type: 'dependency_group',
      count: typeDeps.length
    });

    for (const dep of typeDeps) {
      graph.nodes.push({
        id: dep.name,
        label: `${dep.name}@${dep.version}`,
        type: 'dependency'
      });

      graph.edges.push({
        from: type,
        to: dep.name
      });
    }
  }

  return graph;
}

function renderRelationships() {
  const projectType = detectProjectType();
  let dependencies = [];

  if (projectType === 'nodejs') {
    dependencies = extractNodeJSDependencies();
  } else if (projectType === 'python') {
    dependencies = extractPythonDependencies();
  }

  const docRelationships = extractDocumentationRelationships();
  const dependencyGraph = buildDependencyGraph(dependencies);

  const output = {
    generated: new Date().toISOString(),
    project_type: projectType,
    dependencies: {
      total: dependencies.length,
      production: dependencies.filter(d => d.type === 'production').length,
      development: dependencies.filter(d => d.type === 'development').length,
      list: dependencies
    },
    documentation_relationships: {
      total: docRelationships.length,
      relationships: docRelationships
    },
    dependency_graph: dependencyGraph
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`Generated RELATIONSHIPS.json (${dependencies.length} dependencies, ${docRelationships.length} doc relationships)`);
}

renderRelationships();
