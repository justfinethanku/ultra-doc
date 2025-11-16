#!/usr/bin/env node

/**
 * Update Timestamps
 * Updates "Last Updated" timestamps in documentation files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTEXT_DIR = path.join(process.cwd(), 'context_for_llms');
const TIMESTAMP_PATTERN = /^(Last Updated|Updated):\s*.*/m;

function updateTimestamps() {
  if (!fs.existsSync(CONTEXT_DIR)) {
    console.log('No context_for_llms directory found. Skipping timestamp updates.');
    return;
  }

  const files = fs.readdirSync(CONTEXT_DIR).filter(f => f.endsWith('.md'));
  const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  let updatedCount = 0;

  for (const file of files) {
    const filePath = path.join(CONTEXT_DIR, file);
    let content = fs.readFileSync(filePath, 'utf-8');

    if (TIMESTAMP_PATTERN.test(content)) {
      // Update existing timestamp
      content = content.replace(TIMESTAMP_PATTERN, `Last Updated: ${now}`);
      updatedCount++;
    } else {
      // Add timestamp at the top of the file (after frontmatter if present)
      const lines = content.split('\n');
      let insertIndex = 0;

      // Skip frontmatter if present
      if (lines[0] === '---') {
        const endIndex = lines.findIndex((line, i) => i > 0 && line === '---');
        insertIndex = endIndex >= 0 ? endIndex + 1 : 0;
      }

      lines.splice(insertIndex, 0, `Last Updated: ${now}`, '');
      content = lines.join('\n');
      updatedCount++;
    }

    fs.writeFileSync(filePath, content, 'utf-8');
  }

  console.log(`Updated timestamps in ${updatedCount} file(s)`);
}

updateTimestamps();
