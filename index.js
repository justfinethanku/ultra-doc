#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const orchestratorPath = path.join(__dirname, 'skills/ultra-doc/scripts/orchestrator.mjs');

const child = spawn('node', [orchestratorPath], { stdio: 'inherit' });

child.on('close', (code) => {
    process.exit(code);
});
