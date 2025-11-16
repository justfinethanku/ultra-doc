#!/usr/bin/env node

/**
 * autofix-linting.mjs
 *
 * Automatically fixes deterministic linting issues in documentation
 * - Heading structure
 * - Code block language tags
 * - Formatting consistency
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DOCS_DIR = path.join(process.cwd(), 'context_for_llms');

const fixes = {
  filesModified: [],
  totalFixes: 0,
  fixDetails: []
};

/**
 * Fix heading structure (add missing levels)
 */
function fixHeadingStructure(content) {
  const lines = content.split('\n');
  const fixedLines = [];
  let lastLevel = 0;
  let madeChanges = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];

      // Check if we skipped a level
      if (level > lastLevel + 1 && lastLevel > 0) {
        // Insert intermediate heading
        const intermediateLevel = lastLevel + 1;
        const intermediateLine = '#'.repeat(intermediateLevel) + ' ' + text + ' (Section)';

        fixes.fixDetails.push({
          type: 'heading-structure',
          line: i + 1,
          before: line,
          after: `${intermediateLine}\n${line}`,
          description: 'Added missing intermediate heading level'
        });

        fixedLines.push(intermediateLine);
        madeChanges = true;
      }

      lastLevel = level;
    }

    fixedLines.push(line);
  }

  return madeChanges ? fixedLines.join('\n') : content;
}

/**
 * Add missing language tags to code blocks
 */
function addCodeBlockLanguages(content) {
  let fixed = content;
  let madeChanges = false;

  // Find code blocks without language
  const pattern = /```\n([\s\S]*?)```/g;
  const matches = [];
  let match;

  while ((match = pattern.exec(content)) !== null) {
    matches.push({
      fullMatch: match[0],
      code: match[1],
      index: match.index
    });
  }

  // Process in reverse to maintain indices
  for (const m of matches.reverse()) {
    const detectedLang = detectLanguage(m.code);

    if (detectedLang) {
      const replacement = `\`\`\`${detectedLang}\n${m.code}\`\`\``;
      fixed = fixed.substring(0, m.index) + replacement + fixed.substring(m.index + m.fullMatch.length);

      fixes.fixDetails.push({
        type: 'code-block-language',
        description: `Added language tag: ${detectedLang}`,
        before: '```',
        after: `\`\`\`${detectedLang}`
      });

      madeChanges = true;
    }
  }

  return madeChanges ? fixed : content;
}

/**
 * Detect code language from content
 */
function detectLanguage(code) {
  // JavaScript/TypeScript patterns
  if (code.match(/\b(const|let|var|function|=>|import|require|export)\b/)) {
    if (code.includes('interface ') || code.includes(': ')) {
      return 'typescript';
    }
    return 'javascript';
  }

  // Python patterns
  if (code.match(/\b(def|class|import|from|if __name__|print\()\b/)) {
    return 'python';
  }

  // Shell/Bash patterns
  if (code.match(/^(npm|yarn|pnpm|git|cd|ls|mkdir|rm|cp|mv|chmod)/m)) {
    return 'bash';
  }

  // JSON pattern
  if (code.trim().startsWith('{') && code.includes('"')) {
    try {
      JSON.parse(code);
      return 'json';
    } catch {
      // Not valid JSON
    }
  }

  // YAML pattern
  if (code.match(/^\w+:\s*$/m) && !code.includes('{')) {
    return 'yaml';
  }

  // SQL patterns
  if (code.match(/\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|FROM|WHERE)\b/i)) {
    return 'sql';
  }

  return null;
}

/**
 * Fix trailing whitespace
 */
function fixTrailingWhitespace(content) {
  const fixed = content.replace(/[ \t]+$/gm, '');
  return fixed !== content ? fixed : content;
}

/**
 * Normalize list markers
 */
function normalizeListMarkers(content) {
  const lines = content.split('\n');
  let madeChanges = false;

  // Count which marker is more common
  const dashCount = lines.filter(l => l.trim().match(/^-\s+/)).length;
  const asteriskCount = lines.filter(l => l.trim().match(/^\*\s+/)).length;

  const preferredMarker = dashCount >= asteriskCount ? '-' : '*';
  const otherMarker = preferredMarker === '-' ? '\\*' : '-';

  const pattern = new RegExp(`^(\\s*)${otherMarker}\\s+`, 'gm');

  if (content.match(pattern)) {
    const fixed = content.replace(pattern, `$1${preferredMarker} `);

    if (fixed !== content) {
      fixes.fixDetails.push({
        type: 'list-markers',
        description: `Normalized list markers to ${preferredMarker}`,
        count: (content.match(pattern) || []).length
      });
      madeChanges = true;
      return fixed;
    }
  }

  return content;
}

/**
 * Fix heading spacing (ensure blank line before headings)
 */
function fixHeadingSpacing(content) {
  // Ensure blank line before headings (except at start of file or after another heading)
  const fixed = content.replace(/([^\n])\n(#{1,6}\s+)/g, '$1\n\n$2');
  return fixed !== content ? fixed : content;
}

/**
 * Process a single markdown file
 */
function processFile(filePath) {
  console.log(`Processing: ${path.basename(filePath)}`);

  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;
  let fileFixCount = 0;

  // Apply fixes
  const fixedHeadingStructure = fixHeadingStructure(content);
  if (fixedHeadingStructure !== content) {
    content = fixedHeadingStructure;
    fileFixCount++;
  }

  const fixedCodeBlocks = addCodeBlockLanguages(content);
  if (fixedCodeBlocks !== content) {
    content = fixedCodeBlocks;
    fileFixCount++;
  }

  const fixedWhitespace = fixTrailingWhitespace(content);
  if (fixedWhitespace !== content) {
    content = fixedWhitespace;
    fileFixCount++;
  }

  const fixedLists = normalizeListMarkers(content);
  if (fixedLists !== content) {
    content = fixedLists;
    fileFixCount++;
  }

  const fixedSpacing = fixHeadingSpacing(content);
  if (fixedSpacing !== content) {
    content = fixedSpacing;
    fileFixCount++;
  }

  // Write if changed
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    fixes.filesModified.push(path.relative(process.cwd(), filePath));
    fixes.totalFixes += fileFixCount;
    console.log(`  ✓ Fixed ${fileFixCount} issues`);
  } else {
    console.log(`  ✓ No fixes needed`);
  }
}

/**
 * Main auto-fix function
 */
function autofixLinting() {
  console.log('🔧 Auto-fixing documentation linting issues...\n');

  // Check if docs directory exists
  if (!fs.existsSync(DOCS_DIR)) {
    console.error(`❌ Documentation directory not found: ${DOCS_DIR}`);
    process.exit(1);
  }

  // Get all markdown files
  const files = fs.readdirSync(DOCS_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(DOCS_DIR, f));

  if (files.length === 0) {
    console.log('No markdown files found to fix.');
    return;
  }

  // Process each file
  for (const file of files) {
    processFile(file);
  }

  // Report results
  console.log(`\n✓ Auto-fix Complete:`);
  console.log(`  Files modified: ${fixes.filesModified.length}`);
  console.log(`  Total fixes applied: ${fixes.totalFixes}`);

  if (fixes.filesModified.length > 0) {
    console.log(`\n  Modified files:`);
    for (const file of fixes.filesModified) {
      console.log(`    - ${file}`);
    }
  }

  // Save fix report
  const reportPath = path.join(DOCS_DIR, 'AUTOFIX_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(fixes, null, 2));
  console.log(`\n✓ Fix report saved: ${reportPath}`);
}

// Run auto-fix
try {
  autofixLinting();
} catch (error) {
  console.error('❌ Error during auto-fix:', error.message);
  process.exit(1);
}
