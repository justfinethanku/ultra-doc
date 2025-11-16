#!/usr/bin/env node

/**
 * Generate Section Index
 * Creates SECTIONS.json with token-optimized content sections from markdown files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTEXT_DIR = path.join(process.cwd(), 'context_for_llms');
const OUTPUT_FILE = path.join(CONTEXT_DIR, 'SECTIONS.json');

function estimateTokens(text) {
  // Rough estimate: ~4 characters per token
  return Math.ceil(text.length / 4);
}

function extractSections(content, filename) {
  const sections = [];
  const lines = content.split('\n');
  let currentSection = null;
  let currentContent = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect markdown headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);

    if (headingMatch) {
      // Save previous section if exists
      if (currentSection) {
        const sectionText = currentContent.join('\n').trim();
        sections.push({
          ...currentSection,
          content: sectionText,
          tokens: estimateTokens(sectionText),
          lines: currentContent.length
        });
      }

      // Start new section
      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();

      currentSection = {
        file: filename,
        heading: title,
        level: level,
        line: i + 1
      };
      currentContent = [line];
    } else if (currentSection) {
      currentContent.push(line);
    }
  }

  // Save final section
  if (currentSection) {
    const sectionText = currentContent.join('\n').trim();
    sections.push({
      ...currentSection,
      content: sectionText,
      tokens: estimateTokens(sectionText),
      lines: currentContent.length
    });
  }

  return sections;
}

function generateSectionIndex() {
  if (!fs.existsSync(CONTEXT_DIR)) {
    console.error('Error: context_for_llms directory not found');
    process.exit(1);
  }

  const files = fs.readdirSync(CONTEXT_DIR).filter(f =>
    f.endsWith('.md') && f !== 'INDEX.md'
  );

  const allSections = [];

  for (const file of files) {
    const filePath = path.join(CONTEXT_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const sections = extractSections(content, file);
    allSections.push(...sections);
  }

  const output = {
    generated: new Date().toISOString(),
    total_sections: allSections.length,
    total_tokens: allSections.reduce((sum, s) => sum + s.tokens, 0),
    sections: allSections
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`Generated SECTIONS.json with ${allSections.length} sections (${output.total_tokens} estimated tokens)`);
}

generateSectionIndex();
