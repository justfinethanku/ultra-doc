import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const scripts = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../skills/ultra-doc/scripts');
let failures = 0;

function test(name, check) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ultra-doc-sync-'));
  try {
    fs.mkdirSync(path.join(root, 'context_for_llms'));
    fs.mkdirSync(path.join(root, 'reports'));
    fs.writeFileSync(path.join(root, 'context_for_llms/guide.md'), '# Guide  \n\n### Usage  \n\nUse this guide.  \n');
    check(root);
    console.log(`PASS ${name}`);
  } catch (error) {
    failures++;
    console.error(`FAIL ${name}: ${error.message}`);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function run(script, root, env = {}) {
  const result = spawnSync(process.execPath, [script], {
    cwd: root, encoding: 'utf8', timeout: 20000, env: { ...process.env, ...env }
  });
  assert.ifError(result.error);
  return result;
}

function install(root) {
  const target = path.join(root, 'plugin');
  fs.mkdirSync(target);
  for (const file of fs.readdirSync(scripts).filter(file => file.endsWith('.mjs'))) {
    fs.copyFileSync(path.join(scripts, file), path.join(target, file));
  }
  return target;
}

test('one sync indexes the final autofixed content and new lint digest', root => {
  const result = run(path.join(scripts, 'sync-doc-metadata.mjs'), root);
  assert.strictEqual(result.status, 0, result.stderr);
  const docs = path.join(root, 'context_for_llms');
  const guide = fs.readFileSync(path.join(docs, 'guide.md'), 'utf8');
  assert(guide.includes('## Usage'), 'fixture must exercise heading autofix');
  const overlay = JSON.parse(fs.readFileSync(path.join(docs, 'SECTIONS.json')));
  for (const file of ['guide.md', 'LINT_WARNINGS.md']) {
    const content = fs.readFileSync(path.join(docs, file), 'utf8');
    const sections = overlay.sections.filter(section => section.file === file);
    assert(sections.length > 0, `${file} must be indexed during its first sync`);
    for (const section of sections) {
      const source = content.split('\n').slice(section.line - 1, section.line - 1 + section.lines).join('\n').trim();
      assert.strictEqual(section.content, source, `${file}: overlay must match final content and line numbers`);
    }
  }
  const index = fs.readFileSync(path.join(docs, 'INDEX.md'), 'utf8');
  assert(index.includes('### LINT_WARNINGS.md'), 'navigation must include new digest');
  assert(index.includes('### CODE_POINTERS.json'), 'navigation must include overlays generated this run');
});

test('a failed generator stops sync and propagates through the orchestrator', root => {
  const target = install(root);
  fs.writeFileSync(path.join(target, 'generate-section-index.mjs'), 'process.exit(23);\n');
  fs.writeFileSync(path.join(root, '.ultra-doc.config.json'), '{}');
  const result = run(path.join(target, 'orchestrator.mjs'), root, { ULTRA_DOC_AUTO_ACTION: 'sync' });
  assert.notStrictEqual(result.status, 0, 'child failure must reach caller');
  assert(!result.stdout.includes('Sync Complete'), 'failed sync must not claim success');
  assert(!fs.existsSync(path.join(root, 'reports/ultra-doc-summary.md')), 'reporting must not run after failed prerequisites');
});

test('a missing required generator fails the standalone sync', root => {
  const target = install(root);
  fs.unlinkSync(path.join(target, 'generate-section-index.mjs'));
  const result = run(path.join(target, 'sync-doc-metadata.mjs'), root);
  assert.notStrictEqual(result.status, 0, 'missing script must fail sync');
  assert(!result.stdout.includes('Sync Complete'));
});

if (failures) process.exitCode = 1;
