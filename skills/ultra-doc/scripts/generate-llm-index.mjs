#!/usr/bin/env node

/**
 * Generate LLM Index
 * Creates llms.txt and INDEX.md for AI assistant navigation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTEXT_DIR = path.join(process.cwd(), 'context_for_llms');
const LLMS_TXT = path.join(CONTEXT_DIR, 'llms.txt');
const INDEX_MD = path.join(CONTEXT_DIR, 'INDEX.md');

function getFileStats(filePath) {
  const stats = fs.statSync(filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').length;
  const chars = content.length;

  return { lines, chars, modified: stats.mtime };
}

function generateLlmsTxt() {
  const files = fs.readdirSync(CONTEXT_DIR).filter(f =>
    f.endsWith('.md') && f !== 'INDEX.md'
  );

  const content = `# AI Assistant Navigation Guide

## Getting Started

Welcome! This directory contains LLM-optimized documentation for this project.

### Quick Start

1. **Read CLAUDE.md first** - This is the main entry point with project overview and navigation guide
2. **Use INDEX.md** - File inventory and quick reference
3. **Check JSON overlays** for efficient context fetching:
   - SECTIONS.json - Token-optimized content sections
   - CODE_POINTERS.json - Documentation to source code mappings
   - RELATIONSHIPS.json - Dependency and relationship graph

### Best Practices for AI Assistants

- **Start with CLAUDE.md** to understand project structure and documentation layout
- **Use SECTIONS.json** to fetch specific sections instead of entire files (saves tokens)
- **Check CODE_POINTERS.json** to find relevant source files for a documentation topic
- **Reference RELATIONSHIPS.json** to understand dependencies and relationships
- **Prefer INDEX.md** for quick file lookup

### Available Files

${files.map(f => `- ${f}`).join('\n')}

### JSON Overlays

- SECTIONS.json - Tokenized content sections with metadata
- CODE_POINTERS.json - Mappings from documentation to source code
- RELATIONSHIPS.json - Project dependencies and documentation relationships

## Navigation Tips

- Documentation is organized by topic, not by source code structure
- Each markdown file focuses on a specific aspect of the project
- JSON overlays provide structured, queryable metadata
- All documentation is kept up-to-date with automated scripts

## For Human Readers

This documentation is designed to be useful for both AI assistants and humans.
Start with CLAUDE.md for an overview, then explore the topic-specific documents.
`;

  fs.writeFileSync(LLMS_TXT, content, 'utf-8');
  console.log('Generated llms.txt');
}

function generateIndexMd() {
  const files = fs.readdirSync(CONTEXT_DIR).filter(f =>
    f.endsWith('.md') && f !== 'INDEX.md'
  );

  const jsonFiles = fs.readdirSync(CONTEXT_DIR).filter(f => f.endsWith('.json'));

  let content = `# Documentation Index

Last Updated: ${new Date().toISOString().split('T')[0]}

## Overview

This directory contains AI-optimized documentation for navigating and understanding this project.

## Core Documentation Files

`;

  for (const file of files.sort()) {
    const filePath = path.join(CONTEXT_DIR, file);
    const stats = getFileStats(filePath);
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Extract first heading as description
    const headingMatch = fileContent.match(/^#\s+(.+)/m);
    const description = headingMatch ? headingMatch[1] : 'Documentation file';

    content += `### ${file}\n\n`;
    content += `**Description:** ${description}\n\n`;
    content += `**Stats:** ${stats.lines} lines, ${stats.chars} characters\n\n`;
    content += `**Modified:** ${stats.modified.toISOString().split('T')[0]}\n\n`;
  }

  content += `## JSON Overlays\n\n`;
  content += `These files provide structured, queryable metadata for efficient AI assistant navigation.\n\n`;

  for (const file of jsonFiles.sort()) {
    const filePath = path.join(CONTEXT_DIR, file);
    const stats = getFileStats(filePath);

    let description = '';
    if (file === 'SECTIONS.json') {
      description = 'Token-optimized content sections from markdown files';
    } else if (file === 'CODE_POINTERS.json') {
      description = 'Mappings from documentation topics to source code files';
    } else if (file === 'RELATIONSHIPS.json') {
      description = 'Project dependencies and documentation relationships';
    } else {
      description = 'JSON metadata file';
    }

    content += `### ${file}\n\n`;
    content += `**Description:** ${description}\n\n`;
    content += `**Stats:** ${stats.chars} characters\n\n`;
    content += `**Modified:** ${stats.modified.toISOString().split('T')[0]}\n\n`;
  }

  content += `## Usage for AI Assistants\n\n`;
  content += `1. Start by reading CLAUDE.md for project overview\n`;
  content += `2. Use this INDEX.md for quick file lookup\n`;
  content += `3. Query SECTIONS.json to fetch specific content sections (token-efficient)\n`;
  content += `4. Check CODE_POINTERS.json to find relevant source files\n`;
  content += `5. Reference RELATIONSHIPS.json to understand dependencies\n\n`;

  content += `## File Organization\n\n`;
  content += `- **Core docs** (.md files): Human-readable documentation\n`;
  content += `- **JSON overlays**: Structured metadata for AI assistants\n`;
  content += `- **llms.txt**: Navigation guide for AI tools\n\n`;

  fs.writeFileSync(INDEX_MD, content, 'utf-8');
  console.log('Generated INDEX.md');
}

function generateLlmIndex() {
  if (!fs.existsSync(CONTEXT_DIR)) {
    console.error('Error: context_for_llms directory not found');
    process.exit(1);
  }

  generateLlmsTxt();
  generateIndexMd();
}

generateLlmIndex();
