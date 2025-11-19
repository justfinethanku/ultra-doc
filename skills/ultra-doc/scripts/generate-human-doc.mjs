#!/usr/bin/env node

/**
 * Generate Human Doc
 * Translates machine-optimized documentation (context_for_llms)
 * into human-readable documentation (context_for_humans).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LLM_DIR = path.join(process.cwd(), 'context_for_llms');
const HUMAN_DIR = path.join(process.cwd(), 'context_for_humans');
const DEBUG_DIR = path.join(__dirname, '../../logs');

if (!fs.existsSync(HUMAN_DIR)) {
    fs.mkdirSync(HUMAN_DIR, { recursive: true });
}
if (!fs.existsSync(DEBUG_DIR)) {
    fs.mkdirSync(DEBUG_DIR, { recursive: true });
}

function getTimestamp(filePath) {
    if (!fs.existsSync(filePath)) return 0;
    return fs.statSync(filePath).mtimeMs;
}

function extractSections(content) {
    const lines = content.split('\n');
    const sections = [];
    let current = null;

    for (const line of lines) {
        const match = line.match(/^(#{1,6})\s+(.*)$/);
        if (match) {
            if (current) sections.push(current);
            current = { level: match[1].length, heading: match[2].trim(), body: [] };
        } else if (current) {
            current.body.push(line);
        }
    }

    if (current) sections.push(current);
    return sections;
}

function stripMarkdown(text) {
    return text
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\*\*/g, '')
        .replace(/[_*]/g, '')
        .replace(/!\[[^\]]*]\([^)]+\)/g, '')
        .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
        .replace(/-{3,}/g, '')
        .replace(/^\s*-\s+/gm, '')
        .replace(/^\s*\d+\.\s+/gm, '')
        .trim();
}

function extractCodeMentions(text) {
    const matches = text.match(/`([^`]+\.(?:mjs|js|ts|md|json))`/g) || [];
    return [...new Set(matches.map(m => m.replace(/`/g, '')))];
}

function humanizeParagraph(text) {
    const cleaned = stripMarkdown(text);
    if (!cleaned) return '';
    return cleaned.replace(/\s+/g, ' ').trim();
}

function humanizeSection(section) {
    const raw = section.body.join('\n');
    const paragraphs = raw.split(/\n{2,}/).map(humanizeParagraph).filter(Boolean);
    if (paragraphs.length === 0) {
        paragraphs.push('This section summarizes the underlying automation without extra context.');
    }
    const mentionList = extractCodeMentions(raw);
    const callout = mentionList.length > 0
        ? `\n\n**Key files referenced:** ${mentionList.map(f => `\`${f}\``).join(', ')}`
        : '';

    return `## ${section.heading}\n\n${paragraphs.join(' ')}${callout}`;
}

function translateContent(content, filename) {
    const sections = extractSections(content);
    if (sections.length === 0) return content;

    const titleSection = sections[0];
    const bodySections = sections.filter(s => s.level >= 2);
    const summarySource = stripMarkdown(titleSection.body.join(' ')) || 'This document explains how Ultra-Doc operates.';
    const summary = summarySource.length > 220 ? `${summarySource.slice(0, 220)}…` : summarySource;
    const humanBody = bodySections.map(humanizeSection).join('\n\n');

    return `---
source_file: ${filename}
generated_at: ${new Date().toISOString()}
translation_engine: ultra-doc-v2-humanizer
---

# ${titleSection.heading} – Human Overview

> ${summary}

${humanBody}
`;
}

function logPrompt(filename, content) {
    const prompt = `You are an expert technical writer. Convert this machine doc into a narrative, human-focused version.

- Tone: friendly senior engineer.
- Explain why the described workflow matters.
- Highlight referenced files.
- Output valid Markdown.

Source (${filename}):
${content}
`;
    fs.writeFileSync(path.join(DEBUG_DIR, `prompt-${filename}.txt`), prompt);
}

function verifyParity(files) {
    const issues = [];
    for (const file of files) {
        const llmPath = path.join(LLM_DIR, file);
        const humanPath = path.join(HUMAN_DIR, file);
        if (!fs.existsSync(humanPath)) {
            issues.push(`Missing human translation for ${file}`);
            continue;
        }
        const llmTime = getTimestamp(llmPath);
        const humanTime = getTimestamp(humanPath);
        if (humanTime < llmTime) {
            issues.push(`Human doc ${file} is older than machine doc (run /ultra-doc to regenerate).`);
        }
    }

    if (issues.length > 0) {
        issues.forEach(issue => console.error(`❌ ${issue}`));
        throw new Error('Human doc parity failed.');
    }
}

function generateHumanDocs() {
    console.log('👥 Generating Human-Readable Documentation (aka "Mike Dion" files)...\n');

    if (!fs.existsSync(LLM_DIR)) {
        console.error('❌ context_for_llms directory not found');
        process.exit(1);
    }

    const files = fs.readdirSync(LLM_DIR).filter(f => f.endsWith('.md') && f !== 'INDEX.md');
    let updatedCount = 0;

    for (const file of files) {
        const llmPath = path.join(LLM_DIR, file);
        const humanPath = path.join(HUMAN_DIR, file);

        const llmTime = getTimestamp(llmPath);
        const humanTime = getTimestamp(humanPath);

        if (llmTime > humanTime) {
            console.log(`  Translating: ${file}`);
            const content = fs.readFileSync(llmPath, 'utf-8');
            logPrompt(file, content);
            const humanContent = translateContent(content, file);
            fs.writeFileSync(humanPath, humanContent, 'utf-8');
            updatedCount++;
        }
    }

    verifyParity(files);

    if (updatedCount === 0) {
        console.log('  ✓ All human docs are up to date.');
    } else {
        console.log(`\n  ✓ Updated ${updatedCount} human documentation files.`);
    }
}

generateHumanDocs();
