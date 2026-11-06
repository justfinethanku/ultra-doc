import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync, spawn } from 'child_process';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scripts = path.join(repo, 'skills/ultra-doc/scripts');
const config = JSON.parse(fs.readFileSync(path.join(repo, 'hooks/hooks.json'), 'utf8'));
const handler = config.hooks.PostToolUse[0].hooks[0];
let passes = 0;
let failures = 0;

async function test(name, check) {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'ultra-doc-hooks-'));
  const root = path.join(fixture, 'user project');
  const launch = path.join(fixture, 'launch');
  fs.mkdirSync(root);
  fs.mkdirSync(launch);
  fs.mkdirSync(path.join(root, 'context_for_llms'));
  fs.writeFileSync(path.join(root, '.ultra-doc.config.json'), '{}');
  fs.writeFileSync(path.join(root, 'context_for_llms/guide.md'), '# Guide\n\n## Usage\n\nExample documentation.\n');
  try {
    await check(root, fixture, launch);
    passes++;
    console.log(`PASS ${name}`);
  } catch (error) {
    failures++;
    console.error(`FAIL ${name}: ${error.stack}`);
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
}

function event(root, tool = 'Write') {
  const file = path.join(root, 'context_for_llms/guide.md');
  return {
    session_id: 'hook-regression',
    transcript_path: path.join(root, 'transcript.jsonl'),
    cwd: root,
    permission_mode: 'default',
    hook_event_name: 'PostToolUse',
    tool_name: tool,
    tool_input: tool === 'Write' ? { file_path: file, content: '# Guide\n' } :
      { file_path: file, old_string: 'Example', new_string: 'Updated' },
    tool_response: { filePath: file, type: tool === 'Write' ? 'create' : 'update' },
    tool_use_id: 'toolu_hook_regression'
  };
}

function run(input, launch, plugin = repo) {
  // Execute the registered shell command verbatim, with Claude's plugin env.
  const result = spawnSync('sh', ['-c', handler.command], {
    cwd: launch,
    env: { ...process.env, CLAUDE_PLUGIN_ROOT: plugin },
    input: typeof input === 'string' ? input : JSON.stringify(input),
    encoding: 'utf8',
    timeout: 7000
  });
  assert.ifError(result.error);
  assert.strictEqual(result.status, 0, result.stderr);
  return result;
}

function warning(result, pattern) {
  assert.match(result.stderr, /Ultra-Doc hook warning:/);
  assert.match(result.stderr, pattern);
  assert.match(result.stderr, /Continuing without blocking/);
  assert.match(JSON.parse(result.stdout).systemMessage, pattern);
}

function fakeAnalyzer(fixture, source) {
  const plugin = path.join(fixture, 'plugin with spaces');
  const target = path.join(plugin, 'skills/ultra-doc/scripts');
  fs.mkdirSync(target, { recursive: true });
  for (const file of ['doc-health-hook.mjs', 'project-fs.mjs']) {
    fs.copyFileSync(path.join(scripts, file), path.join(target, file));
  }
  fs.writeFileSync(path.join(target, 'analyze-doc-state.mjs'), source);
  return plugin;
}

await test('default plugin layout registers only Edit|Write PostToolUse with a short non-blocking timeout', () => {
  assert.deepStrictEqual(Object.keys(config.hooks), ['PostToolUse']);
  assert.strictEqual(config.hooks.PostToolUse.length, 1);
  assert.strictEqual(config.hooks.PostToolUse[0].matcher, 'Edit|Write');
  assert.strictEqual(handler.type, 'command');
  assert.strictEqual(handler.timeout, 5);
  assert.strictEqual(handler.onFailure, 'continue');
  assert(!fs.existsSync(path.join(repo, 'hooks.json')));
});

for (const tool of ['Edit', 'Write']) {
  await test(`${tool} refreshes health state in payload cwd, preserving source Markdown`, (root, fixture, launch) => {
    const guide = fs.readFileSync(path.join(root, 'context_for_llms/guide.md'), 'utf8');
    const result = run(event(root, tool), launch);
    assert.strictEqual(result.stderr, '');
    const output = JSON.parse(result.stdout).hookSpecificOutput;
    assert.strictEqual(output.hookEventName, 'PostToolUse');
    assert.match(output.additionalContext, new RegExp(`after ${tool} of context_for_llms/guide.md`));
    const state = JSON.parse(fs.readFileSync(path.join(root, 'context_for_llms/DOC_STATE.json'), 'utf8'));
    assert.strictEqual(state.metrics.total_docs, 1);
    assert.strictEqual(state.files['context_for_llms/guide.md'].sectionCount, 2);
    assert.strictEqual(fs.readFileSync(path.join(root, 'context_for_llms/guide.md'), 'utf8'), guide);
    assert.deepStrictEqual(fs.readdirSync(launch), []);
    assert.deepStrictEqual(fs.readdirSync(path.join(root, 'context_for_llms')).sort(), ['DOC_STATE.json', 'guide.md']);
  });
}

await test('source code, generated indexes, nested docs and outside paths do no work', (root, fixture, launch) => {
  for (const file of ['README.md', 'src/example.js', 'context_for_llms/INDEX.md',
    'context_for_llms/DOC_STATE.json', 'context_for_llms/nested/guide.md', '../outside.md']) {
    const payload = event(root);
    payload.tool_input.file_path = path.resolve(root, file);
    const result = run(payload, launch);
    assert.strictEqual(result.stdout + result.stderr, '');
  }
  assert(!fs.existsSync(path.join(root, 'context_for_llms/DOC_STATE.json')));
});

await test('unsupported events and tools do no work', (root, fixture, launch) => {
  for (const payload of [{ ...event(root), hook_event_name: 'SessionStart' }, event(root, 'Bash')]) {
    const result = run(payload, launch);
    assert.strictEqual(result.stdout + result.stderr, '');
  }
});

await test('projects without Ultra-Doc configuration stay untouched', (root, fixture, launch) => {
  fs.unlinkSync(path.join(root, '.ultra-doc.config.json'));
  const result = run(event(root), launch);
  assert.strictEqual(result.stdout + result.stderr, '');
  assert.deepStrictEqual(fs.readdirSync(path.join(root, 'context_for_llms')), ['guide.md']);
});

await test('malformed JSON and missing event fields warn and exit zero', (root, fixture, launch) => {
  for (const payload of ['{bad JSON', '', 'null', '{}']) {
    warning(run(payload, launch), /JSON|hook_event_name/);
  }
});

await test('missing or relative documented paths warn and exit zero', (root, fixture, launch) => {
  for (const payload of [{ ...event(root), cwd: '.' }, { ...event(root), tool_input: {} },
    { ...event(root), tool_input: { file_path: 'context_for_llms/guide.md' } }]) {
    warning(run(payload, launch), /absolute cwd and tool_input.file_path/);
  }
});

await test('a failing script preserves its exit code and diagnostic in a zero-exit warning', (root, fixture, launch) => {
  const plugin = fakeAnalyzer(fixture, 'console.error("fixture analyzer failure"); process.exit(23);\n');
  warning(run(event(root), launch, plugin), /health check failed \(exit 23\): fixture analyzer failure/);
});

await test('a real analyzer failure on corrupt overlays warns and exits zero', (root, fixture, launch) => {
  fs.writeFileSync(path.join(root, 'context_for_llms/CODE_POINTERS.json'), '{broken');
  warning(run(event(root), launch), /health check failed \(exit 1\).*Error analyzing documentation state/);
  assert(!fs.existsSync(path.join(root, 'context_for_llms/DOC_STATE.json')));
});

await test('a stalled analyzer is killed after two seconds with a zero-exit warning', (root, fixture, launch) => {
  const plugin = fakeAnalyzer(fixture, 'setInterval(() => {}, 1000);\n');
  warning(run(event(root), launch, plugin), /health check timed out after 2000 ms/);
});

await test('oversized hook input warns and exits zero', (root, fixture, launch) => {
  warning(run('x'.repeat(1024 * 1024 + 1), launch), /1 MiB input limit/);
});

await test('stdin without EOF times out with a zero-exit warning', async (root, fixture, launch) => {
  const child = spawn(process.execPath, [path.join(scripts, 'doc-health-hook.mjs')], { cwd: launch });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', data => { stdout += data; });
  child.stderr.on('data', data => { stderr += data; });
  const timer = setTimeout(() => child.kill('SIGKILL'), 5000);
  try {
    const status = await new Promise((resolve, reject) => {
      child.on('error', reject);
      child.on('close', resolve);
    });
    assert.strictEqual(status, 0, stderr);
    warning({ stdout, stderr }, /timed out waiting for hook JSON/);
  } finally {
    clearTimeout(timer);
    child.stdin.destroy();
  }
});

console.log(`Hook tests: ${passes} passed, ${failures} failed`);
if (failures) process.exitCode = 1;
