#!/usr/bin/env node

/**
 * Generate Code Pointers
 * Scans machine docs for inline file references and maps them to doc sections.
 * Produces CODE_POINTERS.json consumed by analyze-doc-state + validate-accuracy.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = process.cwd();
const LLM_DIR = path.join(ROOT_DIR, 'context_for_llms');
const OUTPUT_FILE = path.join(LLM_DIR, 'CODE_POINTERS.json');

const FILE_REGEX = /`([^`]+\.(?:mjs|js|ts|md|json))`/g;

function extractSections(content) {
    const lines = content.split('\n');
    const sections = [];
    let current = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(/^(#{1,6})\s+(.*)$/);
        if (match) {
            if (current) sections.push(current);
            current = {
                heading: match[2].trim(),
                level: match[1].length,
                lines: [],
                startLine: i + 1
            };
        } else if (current) {
            current.lines.push(line);
        }
    }

    if (current) sections.push(current);
    return sections;
}

function extractFileReferences(text) {
    const refs = [];
    let match;
    while ((match = FILE_REGEX.exec(text)) !== null) {
        refs.push(match[1]);
    }
    return [...new Set(refs)];
}

function generatePointers() {
    if (!fs.existsSync(LLM_DIR)) {
        console.error('❌ context_for_llms directory not found');
        process.exit(1);
    }

    const docFiles = fs.readdirSync(LLM_DIR).filter(f => f.endsWith('.md') && f !== 'INDEX.md');
    const pointers = {};

    for (const file of docFiles) {
        const content = fs.readFileSync(path.join(LLM_DIR, file), 'utf-8');
        const sections = extractSections(content);

        for (const section of sections) {
            const body = section.lines.join('\n');
            const refs = extractFileReferences(body);
            if (refs.length === 0) continue;

            const key = `${file}#${section.heading}`;
            pointers[key] = {
                files: refs.map(ref => ref.startsWith('skills/') ? ref : path.normalize(ref)),
                lastValidated: new Date().toISOString(),
                sections: [section.heading],
                startLine: section.startLine
            };
        }
    }

    const output = {
        generated: new Date().toISOString(),
        total_entries: Object.keys(pointers).length,
        pointers
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
    console.log(`📌 Generated CODE_POINTERS.json with ${output.total_entries} entries.`);
}

generatePointers();
