import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync, spawnSync } from 'child_process';

const scripts = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../skills/ultra-doc/scripts');
let failures = 0;

function test(name, check) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ultra-doc-pointers-'));
  try {
    fs.mkdirSync(path.join(root, 'context_for_llms'));
    fs.mkdirSync(path.join(root, 'src'));
    fs.writeFileSync(path.join(root, 'src/module.mjs'), 'export const answer = 1;\n');
    fs.writeFileSync(path.join(root, 'src/settings.json'), '{"enabled":true}\n');
    fs.writeFileSync(path.join(root, 'context_for_llms/guide.md'),
      '# Guide\n\nSee `src/module.mjs` and `src/settings.json`.\n');
    check(root);
    console.log(`PASS ${name}`);
  } catch (error) {
    failures++;
    console.error(`FAIL ${name}: ${error.message}`);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function run(script, root) {
  const result = spawnSync(process.execPath, [path.join(scripts, script)], {
    cwd: root, encoding: 'utf8', timeout: 20000,
    // Fixtures must not discover a repository above their temporary root.
    env: { ...process.env, GIT_CEILING_DIRECTORIES: os.tmpdir() }
  });
  assert.ifError(result.error);
  assert.notStrictEqual(result.signal, 'SIGTERM', 'child timed out');
  return result;
}

function successful(script, root) {
  const result = run(script, root);
  assert.strictEqual(result.status, 0, result.stderr);
}

function read(root, name) {
  return JSON.parse(fs.readFileSync(path.join(root, 'context_for_llms', name), 'utf8'));
}

function write(root, name, value) {
  fs.writeFileSync(path.join(root, 'context_for_llms', name), JSON.stringify(value));
}

function generate(root, format) {
  successful('generate-code-pointers.mjs', root);
  const overlay = read(root, 'CODE_POINTERS.json');
  assert.strictEqual(overlay.total_entries, 1);
  assert.deepStrictEqual(overlay.pointers['guide.md#Guide'].files,
    ['src/module.mjs', 'src/settings.json']);
  if (format === 'legacy') write(root, 'CODE_POINTERS.json', overlay.pointers);
}

function git(root, ...args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

test('generated pointers to existing files validate successfully without modifying sources', root => {
  generate(root, 'generated');
  const source = fs.readFileSync(path.join(root, 'src/module.mjs'), 'utf8');
  successful('validate-accuracy.mjs', root);
  const validation = read(root, 'VALIDATION.json');
  assert.deepStrictEqual(validation.errors, []);
  assert.deepStrictEqual(validation.warnings, []);
  assert.strictEqual(validation.validation_results.accuracy_score, 1);
  assert.strictEqual(fs.readFileSync(path.join(root, 'src/module.mjs'), 'utf8'), source);
});

test('inline and pointer diagnostics for the same document count as one failed check', root => {
  generate(root, 'generated');
  fs.appendFileSync(path.join(root, 'context_for_llms/guide.md'), '\nSee `src/missing.js`.\n');
  fs.unlinkSync(path.join(root, 'src/module.mjs'));
  assert.strictEqual(run('validate-accuracy.mjs', root).status, 1);
  const validation = read(root, 'VALIDATION.json');
  assert.deepStrictEqual(validation.errors.map(error => [error.type, error.docFile]).sort(), [
    ['broken_code_link', 'guide.md'], ['broken_reference', 'context_for_llms/guide.md']
  ]);
  assert.deepStrictEqual(validation.validation_results, {
    total_checks: 1, passed: 0, failed: 1, warnings: 0, accuracy_score: 0
  });
});

for (const format of ['generated', 'legacy']) {
  test(`${format} pointers report missing module and configuration references`, root => {
    generate(root, format);
    fs.unlinkSync(path.join(root, 'src/module.mjs'));
    fs.unlinkSync(path.join(root, 'src/settings.json'));
    fs.writeFileSync(path.join(root, 'context_for_llms/healthy.md'), '# Healthy\n\nNo broken references.\n');
    const result = run('validate-accuracy.mjs', root);
    assert.strictEqual(result.status, 1, 'broken generated links must fail validation');
    const validation = read(root, 'VALIDATION.json');
    assert.deepStrictEqual(validation.errors.map(error => [error.type, error.docFile, error.codeFile]).sort(), [
      ['broken_code_link', 'guide.md', 'src/module.mjs'],
      ['broken_code_link', 'guide.md', 'src/settings.json']
    ]);
    assert(!result.stdout.includes('Accuracy: 100%'), 'broken links must not appear fully accurate');
    assert.deepStrictEqual(validation.validation_results, {
      total_checks: 2, passed: 1, failed: 1, warnings: 0, accuracy_score: 0.5
    }, 'multiple errors in one document must not fail a healthy document or produce negative accuracy');
    fs.unlinkSync(path.join(root, 'context_for_llms/guide.md'));
    fs.unlinkSync(path.join(root, 'context_for_llms/healthy.md'));
    assert.strictEqual(run('validate-accuracy.mjs', root).status, 1);
    assert.deepStrictEqual(read(root, 'VALIDATION.json').validation_results, {
      total_checks: 1, passed: 0, failed: 1, warnings: 0, accuracy_score: 0
    }, 'pointer-only broken references must still be counted when Markdown is absent');
  });

  test(`${format} pointers preserve freshness warning and error details`, root => {
    generate(root, format);
    const overlay = read(root, 'CODE_POINTERS.json');
    const pointers = overlay.pointers || overlay;
    pointers['guide.md#Guide'].lastValidated = '2020-01-01T00:00:00.000Z';
    write(root, 'CODE_POINTERS.json', overlay);
    const recent = new Date('2020-01-02T00:00:00.000Z');
    const old = new Date('2020-01-10T00:00:00.000Z');
    fs.utimesSync(path.join(root, 'src/module.mjs'), recent, recent);
    fs.utimesSync(path.join(root, 'src/settings.json'), old, old);
    const result = run('validate-accuracy.mjs', root);
    assert.strictEqual(result.status, 1, 'code changed beyond the error threshold');
    const validation = read(root, 'VALIDATION.json');
    assert.strictEqual(validation.warnings.length, 1);
    assert.strictEqual(validation.errors.length, 1);
    const warning = validation.warnings[0];
    const error = validation.errors[0];
    for (const finding of [warning, error]) {
      assert.strictEqual(finding.type, 'stale_documentation');
      assert.strictEqual(finding.docFile, 'guide.md');
      assert.strictEqual(finding.section, 'Guide');
      assert.strictEqual(finding.lastValidated, '2020-01-01T00:00:00.000Z');
      assert.strictEqual(finding.requiresAIReview, true);
    }
    assert.strictEqual(warning.codeFile, 'src/module.mjs');
    assert.strictEqual(warning.codeModified, recent.toISOString());
    assert.strictEqual(error.codeFile, 'src/settings.json');
    assert.strictEqual(error.codeModified, old.toISOString());
  });

  test(`${format} pointers connect Git source changes to the affected documentation`, root => {
    git(root, 'init', '-q');
    git(root, 'config', 'user.name', 'Jonathan Edwards');
    git(root, 'config', 'user.email', '191722084+justfinethanku@users.noreply.github.com');
    git(root, 'add', '--', 'src', 'context_for_llms/guide.md');
    git(root, 'commit', '-qm', 'Initial source and guide');
    fs.writeFileSync(path.join(root, 'src/module.mjs'), 'export const answer = 2;\n');
    git(root, 'add', '--', 'src/module.mjs');
    git(root, 'commit', '-qm', 'Update module contract');
    const head = git(root, 'rev-parse', '--short=7', 'HEAD').trim();
    generate(root, format);
    // Keep source timestamps older than docs so only Git detects this change.
    const old = new Date('2020-01-01T00:00:00.000Z');
    for (const file of ['src/module.mjs', 'src/settings.json']) fs.utimesSync(path.join(root, file), old, old);
    successful('analyze-doc-state.mjs', root);
    assert.strictEqual(read(root, 'DOC_STATE.json').files['context_for_llms/guide.md'].status, 'current');
    successful('track-code-changes.mjs', root);
    const report = read(root, 'CODE_CHANGES.json');
    const change = report.affected_docs.find(item => item.code_file === 'src/module.mjs');
    assert(change, 'generated pointer must connect the changed source to its guide');
    assert.deepStrictEqual(change.affected_documentation, ['guide.md']);
    assert.strictEqual(change.lines_changed, 2);
    assert.strictEqual(change.most_recent_commit.hash, head);
    assert.strictEqual(change.most_recent_commit.message, 'Update module contract');
    const state = read(root, 'DOC_STATE.json').files['context_for_llms/guide.md'];
    assert.strictEqual(state.status, 'stale');
    assert.strictEqual(state.validationNeeded, true);
    assert.strictEqual(state.lastCodeChange, change.most_recent_commit.timestamp);
  });

  test(`${format} pointers track source modification times outside Git`, root => {
    generate(root, format);
    const before = new Date('2020-01-01T00:00:00.000Z');
    const after = new Date('2020-02-01T00:00:00.000Z');
    fs.utimesSync(path.join(root, 'context_for_llms/guide.md'), before, before);
    fs.utimesSync(path.join(root, 'src/module.mjs'), after, after);
    fs.utimesSync(path.join(root, 'src/settings.json'), before, before);
    write(root, 'DOC_STATE.json', { files: {
      'context_for_llms/guide.md': { status: 'current', validationNeeded: false },
      'context_for_llms/unrelated.md': { status: 'current', validationNeeded: false }
    } });
    successful('track-code-changes.mjs', root);
    const state = read(root, 'DOC_STATE.json');
    assert.strictEqual(state.files['context_for_llms/guide.md'].status, 'stale');
    assert.strictEqual(state.files['context_for_llms/guide.md'].validationNeeded, true);
    assert.strictEqual(state.files['context_for_llms/guide.md'].lastCodeChange, after.toISOString());
    assert.deepStrictEqual(state.files['context_for_llms/unrelated.md'], { status: 'current', validationNeeded: false });
    assert(!fs.existsSync(path.join(root, 'context_for_llms/CODE_CHANGES.json')), 'fixture must use the non-Git path');
  });
}

if (failures) process.exitCode = 1;
