import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createProjectFs } from '../skills/ultra-doc/scripts/project-fs.mjs';

let failures = 0;
let passes = 0;
function test(name, check) {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'ultra-doc-project-fs-'));
  const root = path.join(fixture, 'repo');
  const outside = path.join(fixture, 'repo-sibling');
  fs.mkdirSync(root);
  fs.mkdirSync(outside);
  const sentinel = path.join(outside, 'sentinel');
  fs.writeFileSync(sentinel, 'unchanged');
  try {
    check(createProjectFs(root), root, outside, sentinel);
    assert.strictEqual(fs.readFileSync(sentinel, 'utf8'), 'unchanged');
    passes++;
    console.log(`PASS ${name}`);
  } catch (error) {
    failures++;
    console.error(`FAIL ${name}: ${error.message}`);
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
}

function unsafe(action) {
  assert.throws(action, error => error.code === 'UNSAFE_PROJECT_PATH');
}

test('absolute and relative sibling-prefix escapes are refused', (io, root, outside, sentinel) => {
  unsafe(() => io.writeFileSync(sentinel, 'changed'));
  unsafe(() => io.writeFileSync('../repo-sibling/sentinel', 'changed'));
  unsafe(() => io.readFileSync(sentinel));
  unsafe(() => io.mkdirSync(path.join(outside, 'new'), { recursive: true }));
  assert.deepStrictEqual(fs.readdirSync(outside), ['sentinel']);
});

test('in-root symlink targets are refused for reads, overwrites and appends', (io, root) => {
  fs.writeFileSync(path.join(root, 'target'), 'keep');
  fs.symlinkSync('target', path.join(root, 'link'));
  unsafe(() => io.readFileSync('link'));
  unsafe(() => io.writeFileSync('link', 'changed'));
  unsafe(() => io.appendFileSync('link', 'changed'));
  assert.strictEqual(fs.readFileSync(path.join(root, 'target'), 'utf8'), 'keep');
});

test('nested existing parents are checked before creating a missing suffix', (io, root, outside) => {
  fs.mkdirSync(path.join(root, 'nested'));
  fs.symlinkSync(outside, path.join(root, 'nested/link'));
  unsafe(() => io.mkdirSync('nested/link/missing/deep', { recursive: true }));
  unsafe(() => io.writeFileSync('nested/link/new', 'changed'));
  assert.deepStrictEqual(fs.readdirSync(outside), ['sentinel']);
});

test('append revalidates a target replaced since the earlier write', (io, root, outside, sentinel) => {
  io.writeFileSync('report.md', 'initial');
  fs.unlinkSync(path.join(root, 'report.md'));
  fs.symlinkSync(sentinel, path.join(root, 'report.md'));
  unsafe(() => io.appendFileSync('report.md', 'appended'));
});

test('a final symlink inserted immediately before open cannot truncate its target', (io, root, outside, sentinel) => {
  const target = path.join(root, 'report.md');
  fs.writeFileSync(target, 'initial');
  const originalOpen = fs.openSync;
  let flagsSeen;
  fs.openSync = function (file, flags, ...args) {
    if (file === target) {
      flagsSeen = flags;
      fs.unlinkSync(target);
      fs.symlinkSync(sentinel, target);
    }
    return originalOpen.call(fs, file, flags, ...args);
  };
  try {
    assert.throws(() => io.writeFileSync('report.md', 'changed'));
    if (fs.constants.O_NOFOLLOW) assert(flagsSeen & fs.constants.O_NOFOLLOW);
  } finally {
    fs.openSync = originalOpen;
  }
});

test('ordinary nested creation, read, overwrite and append preserve expected content', io => {
  io.mkdirSync('nested/deep', { recursive: true });
  io.writeFileSync('nested/deep/report.md', 'long original');
  io.writeFileSync('nested/deep/report.md', 'new');
  io.appendFileSync('nested/deep/report.md', ' content');
  assert.strictEqual(io.readFileSync('nested/deep/report.md', 'utf8'), 'new content');
});

console.log(`Project filesystem tests: ${passes} passed, ${failures} failed`);
if (failures) process.exitCode = 1;
