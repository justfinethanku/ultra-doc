#!/usr/bin/env node

/**
 * Lint Documentation
 * Checks documentation quality and consistency
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTEXT_DIR = path.join(process.cwd(), 'context_for_llms');

const RULES = {
  'heading-structure': {
    description: 'Headings should follow hierarchical structure',
    check: (content) => {
      const headings = [];
      const lines = content.split('\n');
      const issues = [];

      for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(/^(#{1,6})\s+(.+)/);
        if (match) {
          const level = match[1].length;
          const text = match[2];

          if (headings.length > 0) {
            const prevLevel = headings[headings.length - 1].level;
            if (level > prevLevel + 1) {
              issues.push({
                line: i + 1,
                message: `Heading level skipped: h${prevLevel} to h${level}`,
                severity: 'warning'
              });
            }
          }

          headings.push({ level, text, line: i + 1 });
        }
      }

      return issues;
    }
  },

  'code-block-language': {
    description: 'Code blocks should specify language',
    check: (content) => {
      const issues = [];
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('```') && lines[i].trim() === '```') {
          issues.push({
            line: i + 1,
            message: 'Code block missing language identifier',
            severity: 'info'
          });
        }
      }

      return issues;
    }
  },

  'broken-internal-links': {
    description: 'Check for broken internal links',
    check: (content, filename) => {
      const issues = [];
      const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
      let match;

      while ((match = linkPattern.exec(content)) !== null) {
        const url = match[2];

        // Check internal .md links
        if (url.endsWith('.md') && !url.startsWith('http')) {
          const targetPath = path.join(CONTEXT_DIR, url);
          if (!fs.existsSync(targetPath)) {
            issues.push({
              line: content.substring(0, match.index).split('\n').length,
              message: `Broken internal link: ${url}`,
              severity: 'error'
            });
          }
        }
      }

      return issues;
    }
  },

  'line-length': {
    description: 'Lines should not be excessively long',
    check: (content) => {
      const issues = [];
      const lines = content.split('\n');
      const MAX_LENGTH = 120;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Skip code blocks and links
        if (line.trim().startsWith('```') || line.includes('](http')) {
          continue;
        }

        if (line.length > MAX_LENGTH) {
          issues.push({
            line: i + 1,
            message: `Line too long: ${line.length} characters (max ${MAX_LENGTH})`,
            severity: 'info'
          });
        }
      }

      return issues;
    }
  },

  'empty-headings': {
    description: 'Headings should not be empty',
    check: (content) => {
      const issues = [];
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(/^(#{1,6})\s*$/);
        if (match) {
          issues.push({
            line: i + 1,
            message: 'Empty heading found',
            severity: 'error'
          });
        }
      }

      return issues;
    }
  },

  'duplicate-headings': {
    description: 'Avoid duplicate headings in same file',
    check: (content) => {
      const issues = [];
      const headings = new Map();
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(/^#{1,6}\s+(.+)/);
        if (match) {
          const text = match[1].toLowerCase().trim();
          if (headings.has(text)) {
            issues.push({
              line: i + 1,
              message: `Duplicate heading: "${match[1]}" (first seen at line ${headings.get(text)})`,
              severity: 'warning'
            });
          } else {
            headings.set(text, i + 1);
          }
        }
      }

      return issues;
    }
  }
};

function lintFile(filename) {
  const filePath = path.join(CONTEXT_DIR, filename);
  const content = fs.readFileSync(filePath, 'utf-8');
  const allIssues = [];

  for (const [ruleName, rule] of Object.entries(RULES)) {
    const issues = rule.check(content, filename);
    for (const issue of issues) {
      allIssues.push({
        rule: ruleName,
        ...issue
      });
    }
  }

  return allIssues;
}

function lintDocumentation() {
  if (!fs.existsSync(CONTEXT_DIR)) {
    console.error('Error: context_for_llms directory not found');
    process.exit(1);
  }

  const files = fs.readdirSync(CONTEXT_DIR).filter(f => f.endsWith('.md'));
  const results = {};
  let totalIssues = 0;
  let errorCount = 0;
  let warningCount = 0;
  let infoCount = 0;

  for (const file of files) {
    const issues = lintFile(file);
    if (issues.length > 0) {
      results[file] = issues;
      totalIssues += issues.length;

      for (const issue of issues) {
        if (issue.severity === 'error') errorCount++;
        else if (issue.severity === 'warning') warningCount++;
        else infoCount++;
      }
    }
  }

  // Print results
  console.log(`\n📋 Documentation Lint Results\n`);

  if (totalIssues === 0) {
    console.log('✓ No issues found!');
  } else {
    console.log(`Found ${totalIssues} issue(s):`);
    console.log(`  - ${errorCount} error(s)`);
    console.log(`  - ${warningCount} warning(s)`);
    console.log(`  - ${infoCount} info\n`);

    for (const [file, issues] of Object.entries(results)) {
      console.log(`\n${file}:`);
      for (const issue of issues) {
        const icon = issue.severity === 'error' ? '✗' :
          issue.severity === 'warning' ? '⚠' : 'ℹ';
        console.log(`  ${icon} Line ${issue.line}: ${issue.message} [${issue.rule}]`);
      }
    }
  }

  // Generate and save warning digest
  generateWarningDigest(results, warningCount + errorCount);

  // Check dual docs consistency
  const dualDocsIssues = checkDualDocsConsistency();
  if (dualDocsIssues.length > 0) {
    console.log('\n👥 Dual Documentation Consistency Checks:');
    for (const issue of dualDocsIssues) {
      const icon = issue.severity === 'error' ? '✗' : '⚠';
      console.log(`  ${icon} ${issue.message}`);
      if (issue.severity === 'error') errorCount++;
      else warningCount++;
    }
  }

  // Exit with error code if there are errors
  if (errorCount > 0) {
    console.log('\n❌ Linting failed with errors');
    process.exit(1);
  } else if (warningCount > 0 || infoCount > 0) {
    console.log('\n⚠ Linting completed with warnings/suggestions');
  } else {
    console.log('\n✓ Linting passed');
  }
}

function checkDualDocsConsistency() {
  const HUMAN_DIR = path.join(process.cwd(), 'context_for_humans');
  const issues = [];

  if (!fs.existsSync(HUMAN_DIR)) {
    return [{
      message: 'context_for_humans directory missing',
      severity: 'warning'
    }];
  }

  const llmFiles = fs.readdirSync(CONTEXT_DIR).filter(f => f.endsWith('.md') && f !== 'INDEX.md');

  for (const file of llmFiles) {
    const humanPath = path.join(HUMAN_DIR, file);

    if (!fs.existsSync(humanPath)) {
      issues.push({
        message: `Missing human documentation for: ${file}`,
        severity: 'warning'
      });
    } else {
      // Check timestamps if possible
      // For now, just existence is a good start.
      // We could compare mtime, but generate-human-doc.mjs handles that.
      // If we want to be strict, we could check if human doc is OLDER than machine doc.
      const llmStats = fs.statSync(path.join(CONTEXT_DIR, file));
      const humanStats = fs.statSync(humanPath);

      // Allow some buffer (e.g. 1 second) for file system operations
      if (humanStats.mtimeMs < llmStats.mtimeMs - 1000) {
        issues.push({
          message: `Human documentation outdated for: ${file}`,
          severity: 'warning'
        });
      }
    }
  }

  return issues;
}

function generateWarningDigest(results, issueCount) {
  const digestLines = [];
  const allWarnings = [];

  // Collect all warnings/errors
  for (const [file, issues] of Object.entries(results)) {
    for (const issue of issues) {
      if (issue.severity === 'warning' || issue.severity === 'error') {
        allWarnings.push({ file, ...issue });
      }
    }
  }

  // Sort by severity (error first) then file
  allWarnings.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'error' ? -1 : 1;
    return a.file.localeCompare(b.file);
  });

  // Create Markdown content
  let mdContent = '# Documentation Lint Warnings\n\n';

  if (allWarnings.length === 0) {
    mdContent += 'No warnings or errors found.\n';
  } else {
    mdContent += `Found ${allWarnings.length} issues that need attention.\n\n`;

    // Add top issues to markdown
    for (const w of allWarnings) {
      const icon = w.severity === 'error' ? '🔴' : '⚠️';
      mdContent += `- ${icon} **${w.file}** (Line ${w.line}): ${w.message} [${w.rule}]\n`;
    }
  }

  const digestPath = path.join(CONTEXT_DIR, 'LINT_WARNINGS.md');
  fs.writeFileSync(digestPath, mdContent);
  console.log(`\n📝 Warning digest saved to: ${path.relative(process.cwd(), digestPath)}`);

  // Print top 5 to console
  if (allWarnings.length > 0) {
    console.log('\n👀 Top Actionable Warnings:');
    const top5 = allWarnings.slice(0, 5);
    for (const w of top5) {
      const icon = w.severity === 'error' ? '✗' : '⚠';
      console.log(`  ${icon} ${w.file}:${w.line} - ${w.message}`);
    }
    if (allWarnings.length > 5) {
      console.log(`  ...and ${allWarnings.length - 5} more (see LINT_WARNINGS.md)`);
    }
  }
}

lintDocumentation();
