#!/usr/bin/env node

// Claude Code PostToolUse input arrives as JSON on stdin, not command arguments.
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { createProjectFs } from './project-fs.mjs';

const scripts = path.dirname(fileURLToPath(import.meta.url));
const MAX_INPUT_BYTES = 1024 * 1024;
const CHECK_TIMEOUT_MS = 2000;

function warn(reason) {
  const message = `Ultra-Doc hook warning: ${reason}. Continuing without blocking the user action.`;
  console.error(message);
  // Exit-zero stderr is only logged by Claude Code; systemMessage surfaces it.
  console.log(JSON.stringify({ systemMessage: message }));
}

function check(input) {
  const event = JSON.parse(input);
  if (!event || typeof event !== 'object' || typeof event.hook_event_name !== 'string') {
    throw new Error('expected a hook event object with hook_event_name');
  }
  if (event.hook_event_name !== 'PostToolUse' || !['Edit', 'Write'].includes(event.tool_name)) return;
  if (typeof event.cwd !== 'string' || !path.isAbsolute(event.cwd) ||
      typeof event.tool_input?.file_path !== 'string' || !path.isAbsolute(event.tool_input.file_path)) {
    throw new Error('PostToolUse requires absolute cwd and tool_input.file_path paths');
  }

  // The analyzer supports top-level source Markdown only. Ignore generated
  // indexes, nested docs, source code and files outside this working directory.
  const relative = path.relative(event.cwd, event.tool_input.file_path);
  if (path.dirname(relative) !== 'context_for_llms' ||
      !relative.endsWith('.md') || path.basename(relative) === 'INDEX.md') return;

  const projectFs = createProjectFs(event.cwd);
  try {
    if (!projectFs.statSync('.ultra-doc.config.json').isFile()) return;
  } catch (error) {
    if (error.code === 'ENOENT') return; // Installation never initializes projects.
    throw error;
  }
  if (!projectFs.statSync(relative).isFile()) throw new Error(`${relative} is not a regular file`);

  // Run the existing lightweight health analyzer, never the interactive/full
  // sync orchestrator. Its project I/O also goes through project-fs.mjs.
  const result = spawnSync(process.execPath, [path.join(scripts, 'analyze-doc-state.mjs')], {
    cwd: event.cwd,
    encoding: 'utf8',
    timeout: CHECK_TIMEOUT_MS,
    killSignal: 'SIGKILL',
    maxBuffer: 64 * 1024
  });
  if (result.error?.code === 'ETIMEDOUT') throw new Error(`health check timed out after ${CHECK_TIMEOUT_MS} ms`);
  if (result.error || result.status !== 0) {
    const detail = (result.stderr || result.error?.message || `signal ${result.signal}`).trim().slice(0, 2000);
    throw new Error(`health check failed (exit ${result.status}): ${detail}`);
  }
  if (result.stderr.trim()) warn(`health check completed with warnings: ${result.stderr.trim().slice(0, 2000)}`);
  else console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: `Ultra-Doc: refreshed context_for_llms/DOC_STATE.json after ${event.tool_name} of ${relative}.`
    }
  }));
}

let input = '';
let bytes = 0;
let finished = false;
function finish(error) {
  if (finished) return;
  finished = true;
  clearTimeout(inputTimer);
  process.stdin.pause();
  if (error) warn(error.message);
  else {
    try { check(input); }
    catch (failure) { warn(failure.message); }
  }
  // All handled errors intentionally leave exit status zero.
}
const inputTimer = setTimeout(() => finish(new Error('timed out waiting for hook JSON on stdin after 1000 ms')), 1000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  bytes += Buffer.byteLength(chunk);
  if (bytes > MAX_INPUT_BYTES) finish(new Error('hook JSON exceeds the 1 MiB input limit'));
  else input += chunk;
});
process.stdin.on('end', () => finish());
process.stdin.on('error', error => finish(error));
