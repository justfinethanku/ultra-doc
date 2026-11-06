import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync, spawnSync } from 'child_process';

const scripts = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../skills/ultra-doc/scripts');
let failures = 0;

function test(name, check) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ultra-doc-security-'));
  try {
    check(root);
    console.log(`PASS ${name}`);
  } catch (error) {
    failures++;
    console.error(`FAIL ${name}: ${error.message}`);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function init(cwd) {
  git(cwd, 'init', '-q');
  git(cwd, 'config', 'user.name', 'Jonathan Edwards');
  git(cwd, 'config', 'user.email', '191722084+justfinethanku@users.noreply.github.com');
  fs.mkdirSync(path.join(cwd, 'context_for_llms'));
}

function run(script, cwd, env = {}) {
  const result = spawnSync(process.execPath, [script], {
    cwd, encoding: 'utf8', timeout: 20000,
    env: { ...process.env, ...env }
  });
  assert.ifError(result.error);
  return result;
}

test('tracked command substitutions remain literal filenames', root => {
  init(root);
  const filename = 'src/$(touch TRACKER_MARKER).js';
  fs.mkdirSync(path.join(root, 'src'));
  fs.writeFileSync(path.join(root, filename), 'export const answer = 1;\n');
  fs.writeFileSync(path.join(root, 'context_for_llms/CODE_POINTERS.json'), JSON.stringify({
    'guide.md#answer': { files: [filename] }
  }));
  git(root, 'add', '--', filename, 'context_for_llms/CODE_POINTERS.json');
  git(root, 'commit', '-qm', 'Document the answer');
  fs.writeFileSync(path.join(root, filename), 'export const answer = 2;\n');
  git(root, 'add', '--', filename);
  git(root, 'commit', '-qm', 'Update the answer');
  const result = run(path.join(scripts, 'track-code-changes.mjs'), root);
  assert.strictEqual(result.status, 0, result.stderr);
  assert.strictEqual(fs.existsSync(path.join(root, 'TRACKER_MARKER')), false, 'repository filename executed a shell command');
  const report = JSON.parse(fs.readFileSync(path.join(root, 'context_for_llms/CODE_CHANGES.json')));
  assert.strictEqual(report.affected_docs.length, 1);
  assert.strictEqual(report.affected_docs[0].code_file, filename);
  assert.strictEqual(report.affected_docs[0].lines_changed, 2, 'literal source file must still be analyzed');
});

test('git history preserves quotes, pipes, whitespace, newlines and Unicode in paths', root => {
  init(root);
  const filenames = ['src/normal.js', 'src/a|b.js', 'src/quote".js', 'src/line\nbreak.js', 'src/日本語.js', 'src/ padded .js', '\nleading.js', ':(glob)*.js', '--option.js'];
  fs.mkdirSync(path.join(root, 'src'));
  for (const filename of filenames) fs.writeFileSync(path.join(root, filename), 'const value = 1;\n');
  fs.writeFileSync(path.join(root, 'context_for_llms/CODE_POINTERS.json'), JSON.stringify({
    'guide.md#files': { files: filenames }
  }));
  git(root, '--literal-pathspecs', 'add', '--', ...filenames, 'context_for_llms/CODE_POINTERS.json');
  git(root, 'commit', '-qm', 'First | subject');
  for (const filename of filenames) fs.writeFileSync(path.join(root, filename), 'const value = 2;\n');
  git(root, '--literal-pathspecs', 'add', '--', ...filenames);
  git(root, 'commit', '-qm', 'Second | subject');
  git(root, 'commit', '--allow-empty', '-qm', 'Empty commit');
  const result = run(path.join(scripts, 'track-code-changes.mjs'), root);
  assert.strictEqual(result.status, 0, result.stderr);
  const report = JSON.parse(fs.readFileSync(path.join(root, 'context_for_llms/CODE_CHANGES.json')));
  assert.deepStrictEqual(report.affected_docs.map(doc => doc.code_file).sort(), filenames.sort());
  for (const doc of report.affected_docs) {
    assert.strictEqual(doc.lines_changed, 2, doc.code_file);
    assert.strictEqual(doc.most_recent_commit.message, 'Second | subject');
  }
});

for (const script of ['orchestrator.mjs', 'sync-doc-metadata.mjs']) {
  test(`${script} launches scripts from a literal install path`, root => {
    const install = path.join(root, 'plugin $(touch INSTALL_MARKER)', 'skills/ultra-doc/scripts');
    fs.mkdirSync(install, { recursive: true });
    for (const filename of fs.readdirSync(scripts)) {
      if (filename.endsWith('.mjs')) fs.copyFileSync(path.join(scripts, filename), path.join(install, filename));
    }
    fs.mkdirSync(path.join(root, 'context_for_llms'));
    fs.mkdirSync(path.join(root, 'reports'));
    fs.writeFileSync(path.join(root, '.ultra-doc.config.json'), '{}');
    const result = run(path.join(install, script), root, { ULTRA_DOC_AUTO_ACTION: 'summary' });
    assert.strictEqual(fs.existsSync(path.join(root, 'INSTALL_MARKER')), false, 'install path executed a shell command');
    assert.strictEqual(result.status, 0, result.stderr);
    assert(fs.existsSync(path.join(root, 'reports/ultra-doc-summary.md')), 'workflow must produce its summary');
  });
}

if (failures) process.exitCode = 1;
