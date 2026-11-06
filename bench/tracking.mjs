// Run: node bench/tracking.mjs [baseline-script.mjs] [samples=5]
// Builds local Git fixtures; never touches the caller's repository or docs.
import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { performance } from 'perf_hooks';
import { fileURLToPath } from 'url';

const current = fileURLToPath(new URL('../skills/ultra-doc/scripts/track-code-changes.mjs', import.meta.url));
const scripts = process.argv[2] ? [path.resolve(process.argv[2]), current] : [current];
const samples = Number(process.argv[3] || 5);
assert(Number.isInteger(samples) && samples > 0);
const results = [];
for (const size of [100, 1000, 3000]) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ultra-doc-bench-'));
  const git = (...args) => execFileSync('git', args, { cwd: root, stdio: 'pipe' });
  try {
    fs.mkdirSync(path.join(root, 'src'));
    fs.mkdirSync(path.join(root, 'context_for_llms'));
    const pointers = {};
    for (let i = 0; i < size; i++) {
      fs.writeFileSync(path.join(root, `src/changed-${i}.js`), 'const value = 1;\n');
      // Only two changed files are documented: avoid letting Git diff subprocess
      // time hide the cost of looking up every other change in a large overlay.
      pointers[`guide-${i % 100}.md#Section-${i}`] = {
        files: [`src/stable-${i}.js`, ...(i < 2 ? [`src/changed-${i}.js`] : [])]
      };
    }
    git('init', '-q');
    git('config', 'user.name', 'Jonathan Edwards');
    git('config', 'user.email', '191722084+justfinethanku@users.noreply.github.com');
    git('add', '--', 'src');
    git('commit', '-qm', 'Changed source corpus');
    fs.writeFileSync(path.join(root, 'context_for_llms/CODE_POINTERS.json'), JSON.stringify({ pointers }));
    const initialState = { files: {
      'context_for_llms/guide-0.md': { status: 'current', validationNeeded: false },
      'context_for_llms/guide-1.md': { status: 'current', validationNeeded: false }
    } };
    let expected;
    const times = scripts.map(() => []);
    const run = script => {
      fs.writeFileSync(path.join(root, 'context_for_llms/DOC_STATE.json'), JSON.stringify(initialState));
      const start = performance.now();
      execFileSync(process.execPath, [script], { cwd: root, stdio: 'pipe', timeout: 60000 });
      const elapsed = performance.now() - start;
      const report = JSON.parse(fs.readFileSync(path.join(root, 'context_for_llms/CODE_CHANGES.json'), 'utf8'));
      const state = JSON.parse(fs.readFileSync(path.join(root, 'context_for_llms/DOC_STATE.json'), 'utf8'));
      delete report.generated;
      assert.strictEqual(report.total_code_changes, size);
      assert.strictEqual(report.affected_docs.length, 2);
      if (expected) assert.deepStrictEqual({ report, state }, expected, 'tracking output changed');
      else expected = { report, state };
      return elapsed;
    };
    for (const script of scripts) run(script); // Warmup, including Git's filesystem cache.
    for (let sample = 0; sample < samples; sample++) {
      // Alternate execution order so a later variant does not always get warmer caches.
      const order = scripts.map((_, i) => i);
      if (sample % 2) order.reverse();
      for (const i of order) times[i].push(run(scripts[i]));
    }
    results.push({ changed_files: size, pointer_sections: size, documented_changed_files: 2,
      output_equivalent: true, variants: scripts.map((script, i) => ({ script, samples_ms: times[i],
        median_ms: [...times[i]].sort((a, b) => a - b)[Math.floor(samples / 2)] })) });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}
console.log(JSON.stringify({ node: process.version, platform: `${process.platform}/${process.arch}`, results }, null, 2));
