import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync, spawnSync } from 'child_process';

// Override only for running these same regressions against an archived baseline.
const scripts = process.env.ULTRA_DOC_TEST_SCRIPTS || path.resolve(
  path.dirname(fileURLToPath(import.meta.url)), '../skills/ultra-doc/scripts');
const sentinel = '# Outside sentinel  \n\nLast Updated: 2000-01-01\n\n### Keep me  \n';
const state = JSON.stringify({ files: { 'context_for_llms/guide.md': { status: 'current' } } });
let failures = 0;
let passes = 0;

function test(name, check) {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'ultra-doc-containment-'));
  const root = path.join(fixture, 'repo');
  const outside = path.join(fixture, 'outside');
  try {
    fs.mkdirSync(root);
    fs.mkdirSync(outside);
    for (const dir of ['context_for_llms', 'context_for_humans', 'reports', 'src']) {
      fs.mkdirSync(path.join(root, dir));
    }
    fs.writeFileSync(path.join(root, 'context_for_llms/guide.md'), '# Guide  \n\n### Usage  \n\nUse `src/module.js`.  \n');
    fs.writeFileSync(path.join(root, 'src/module.js'), 'export const value = 1;\n');
    fs.writeFileSync(path.join(root, '.ultra-doc.config.json'), '{}');
    check(root, outside);
    passes++;
    console.log(`PASS ${name}`);
  } catch (error) {
    failures++;
    console.error(`FAIL ${name}: ${error.message}`);
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
}

function run(script, root, env = {}) {
  const result = spawnSync(process.execPath, [path.join(scripts, script)], {
    cwd: root, encoding: 'utf8', timeout: 15000,
    env: { ...process.env, GIT_CEILING_DIRECTORIES: os.tmpdir(), ...env }
  });
  assert.ifError(result.error);
  assert.strictEqual(result.signal, null, 'script must finish without a timeout');
  return result;
}

function success(result) {
  assert.strictEqual(result.status, 0, result.stderr);
}

function refused(result) {
  assert.notStrictEqual(result.status, 0, 'unsafe output must fail');
  assert.match(result.stderr, /Unsafe project path:.*(symlink|outside project root)/s);
}

function git(root, ...args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function initGit(root) {
  git(root, 'init', '-q');
  git(root, 'config', 'user.name', 'Jonathan Edwards');
  git(root, 'config', 'user.email', 'justfinethanku@gmail.com');
  git(root, 'add', '--', 'src/module.js', 'context_for_llms/guide.md');
  git(root, 'commit', '-qm', 'Fixture');
}

function linkFile(root, outside, relative, content = sentinel) {
  const target = path.join(outside, 'sentinel');
  fs.writeFileSync(target, content);
  const old = new Date('2000-01-01T00:00:00Z');
  fs.utimesSync(target, old, old);
  const link = path.join(root, relative);
  fs.mkdirSync(path.dirname(link), { recursive: true });
  fs.rmSync(link, { force: true });
  fs.symlinkSync(path.relative(path.dirname(link), target), link);
  return () => assert.strictEqual(fs.readFileSync(target, 'utf8'), content, 'outside sentinel was modified');
}

for (const script of ['update-timestamps.mjs', 'autofix-linting.mjs', 'generate-human-doc.mjs']) {
  test(`${script} skips a symlinked document`, (root, outside) => {
    const unchanged = linkFile(root, outside, 'context_for_llms/linked.md');
    const result = run(script, root);
    unchanged();
    success(result);
    assert.match(result.stderr, /Skipping unsafe project entry.*linked\.md.*symlink/);
    assert(!fs.existsSync(path.join(root, 'context_for_humans/linked.md')), 'linked input must not be translated');
  });
}

test('Git-selected metadata update refuses a symlinked document', (root, outside) => {
  initGit(root);
  const unchanged = linkFile(root, outside, 'context_for_llms/guide.md');
  const result = run('sync-doc-metadata.mjs', root);
  unchanged();
  refused(result);
});

test('orchestrator quick sync skips a symlinked document', (root, outside) => {
  const unchanged = linkFile(root, outside, 'context_for_llms/linked.md');
  const result = run('orchestrator.mjs', root, { ULTRA_DOC_AUTO_ACTION: 'quick' });
  unchanged();
  success(result);
  assert.match(result.stdout, /quick sync/);
  assert.match(result.stderr, /Skipping unsafe project entry.*linked\.md.*symlink/);
});

// Each JSON/report/document output gets its own fixture. Existing JSON state is
// valid so the old code actually reaches its read-modify-write operation.
const outputs = [
  ['analyze-doc-state.mjs', 'context_for_llms/DOC_STATE.json'],
  ['analyze-coverage.mjs', 'context_for_llms/COVERAGE.json'],
  ['validate-accuracy.mjs', 'context_for_llms/VALIDATION.json'],
  ['autofix-linting.mjs', 'context_for_llms/AUTOFIX_REPORT.json'],
  ['generate-section-index.mjs', 'context_for_llms/SECTIONS.json'],
  ['generate-code-pointers.mjs', 'context_for_llms/CODE_POINTERS.json'],
  ['add-code-pointers.mjs', 'context_for_llms/CODE_POINTERS.json'],
  ['render-relationships.mjs', 'context_for_llms/RELATIONSHIPS.json'],
  ['generate-llm-index.mjs', 'context_for_llms/llms.txt'],
  ['generate-llm-index.mjs', 'context_for_llms/INDEX.md'],
  ['lint-documentation.mjs', 'context_for_llms/LINT_WARNINGS.md'],
  ['generate-human-doc.mjs', 'context_for_humans/guide.md'],
  ['generate-human-doc.mjs', 'logs/ultra-doc/prompt-guide.md.txt'],
  ['generate-changelog.mjs', `changelog/docs-${new Date().toISOString().split('T')[0]}.md`],
  ['generate-report.mjs', 'reports/ultra-doc-summary.md'],
  ['track-code-changes.mjs', 'context_for_llms/CODE_CHANGES.json'],
  ['track-code-changes.mjs', 'context_for_llms/DOC_STATE.json', state]
];

for (const [script, output, content] of outputs) {
  test(`${script} refuses symlinked output ${output}`, (root, outside) => {
    initGit(root);
    fs.appendFileSync(path.join(root, 'context_for_llms/guide.md'), '\nChanged for changelog.\n');
    const unchanged = linkFile(root, outside, output, content);
    const result = run(script, root);
    unchanged();
    refused(result);
  });
}

for (const [script, directory] of [
  ['update-timestamps.mjs', 'context_for_llms'],
  ['generate-section-index.mjs', 'context_for_llms'],
  ['generate-human-doc.mjs', 'context_for_humans'],
  ['generate-human-doc.mjs', 'logs'],
  ['generate-changelog.mjs', 'changelog'],
  ['generate-report.mjs', 'reports']
]) {
  test(`${script} refuses symlinked directory ${directory}`, (root, outside) => {
    initGit(root);
    fs.appendFileSync(path.join(root, 'context_for_llms/guide.md'), '\nChanged.\n');
    fs.writeFileSync(path.join(outside, 'guide.md'), sentinel);
    fs.writeFileSync(path.join(outside, 'ultra-doc-summary.md'), sentinel);
    fs.writeFileSync(path.join(outside, `docs-${new Date().toISOString().split('T')[0]}.md`), sentinel);
    const before = fs.readdirSync(outside).map(name => [name, fs.readFileSync(path.join(outside, name), 'utf8')]);
    fs.rmSync(path.join(root, directory), { recursive: true, force: true });
    fs.symlinkSync(outside, path.join(root, directory));
    const result = run(script, root);
    const after = fs.readdirSync(outside).map(name => [name, fs.readFileSync(path.join(outside, name), 'utf8')]);
    assert.deepStrictEqual(after, before, 'outside directory contents changed');
    refused(result);
  });
}

for (const script of ['render-relationships.mjs', 'analyze-coverage.mjs', 'add-code-pointers.mjs']) {
  test(`${script} skips directory cycles and outside source links`, (root, outside) => {
    fs.symlinkSync('.', path.join(root, 'src/cycle'));
    const unchanged = linkFile(root, outside, 'src/linked.js', 'export const outside = 1;\n');
    const result = run(script, root);
    unchanged();
    success(result);
    assert.match(result.stderr, /Skipping unsafe project entry.*cycle.*symlink/);
    if (script === 'render-relationships.mjs') {
      const graph = JSON.parse(fs.readFileSync(path.join(root, 'context_for_llms/RELATIONSHIPS.json')));
      assert.deepStrictEqual(graph.nodes.map(node => node.id), ['src/module.js']);
    }
  });
}

test('Git source enumeration skips tracked symlinks', (root, outside) => {
  initGit(root);
  const unchanged = linkFile(root, outside, 'src/linked.js', 'export const outside = 1;\n');
  git(root, 'add', '--', 'src/linked.js');
  for (const script of ['analyze-coverage.mjs', 'add-code-pointers.mjs']) {
    const result = run(script, root);
    success(result);
    assert.match(result.stderr, /Skipping unsafe project entry.*linked\.js.*symlink/);
  }
  unchanged();
  const coverage = JSON.parse(fs.readFileSync(path.join(root, 'context_for_llms/COVERAGE.json')));
  assert.strictEqual(coverage.coverage_stats.total_files, 1);
});

test('dangling output symlink does not create an outside file', (root, outside) => {
  const target = path.join(outside, 'not-created');
  fs.symlinkSync(target, path.join(root, 'context_for_llms/SECTIONS.json'));
  const result = run('generate-section-index.mjs', root);
  assert(!fs.existsSync(target), 'outside target was created');
  refused(result);
});

test('ordinary metadata sync still updates in-root documents and outputs', root => {
  initGit(root);
  fs.appendFileSync(path.join(root, 'context_for_llms/guide.md'), '\nChanged.\n');
  success(run('sync-doc-metadata.mjs', root));
  const guide = fs.readFileSync(path.join(root, 'context_for_llms/guide.md'), 'utf8');
  assert(guide.includes(`Last Updated: ${new Date().toISOString().split('T')[0]}`));
  assert(guide.includes('## Usage'), 'heading must be autofixed');
  for (const output of ['context_for_llms/SECTIONS.json', 'context_for_llms/INDEX.md',
    'context_for_humans/guide.md', 'reports/ultra-doc-summary.md']) {
    assert(fs.lstatSync(path.join(root, output)).isFile(), `${output} must be generated`);
  }
});

console.log(`Containment tests: ${passes} passed, ${failures} failed`);
if (failures) process.exitCode = 1;
