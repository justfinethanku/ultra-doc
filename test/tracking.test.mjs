import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const script = fileURLToPath(new URL('../skills/ultra-doc/scripts/track-code-changes.mjs', import.meta.url));
for (const format of ['generated', 'legacy']) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ultra-doc-tracking-'));
  const git = (...args) => execFileSync('git', args, { cwd: root, stdio: 'pipe' });
  try {
    fs.mkdirSync(path.join(root, 'src'));
    fs.mkdirSync(path.join(root, 'context_for_llms'));
    for (const name of ['shared.js', 'other.js', 'unreferenced.js']) {
      fs.writeFileSync(path.join(root, 'src', name), 'const value = 1;\n');
    }
    git('init', '-q');
    git('config', 'user.name', 'Jonathan Edwards');
    git('config', 'user.email', '191722084+justfinethanku@users.noreply.github.com');
    git('add', '--', 'src');
    git('commit', '-qm', 'Initial sources');
    fs.writeFileSync(path.join(root, 'src/shared.js'), 'const value = 2;\n');
    git('add', '--', 'src/shared.js');
    git('commit', '-qm', 'Update shared behavior');

    const pointers = {
      'z.md#First': { files: ['src/shared.js', 'src/shared.js'] },
      'a.md#Second': { files: ['src/shared.js', 'src/other.js'] },
      'z.md#Third': { files: ['src/shared.js'] },
      'unrelated.md#Untouched': { files: ['src/unchanged.js'] },
      'metadata.md#NoSources': {}
    };
    fs.writeFileSync(path.join(root, 'context_for_llms/CODE_POINTERS.json'),
      JSON.stringify(format === 'generated' ? { pointers } : pointers));
    const current = { status: 'current', validationNeeded: false };
    fs.writeFileSync(path.join(root, 'context_for_llms/DOC_STATE.json'), JSON.stringify({ files: {
      'context_for_llms/z.md': { ...current },
      'context_for_llms/a.md': { ...current },
      'context_for_llms/unrelated.md': { ...current }
    } }));
    execFileSync(process.execPath, [script], { cwd: root, stdio: 'pipe' });
    const read = name => JSON.parse(fs.readFileSync(path.join(root, 'context_for_llms', name), 'utf8'));
    const report = read('CODE_CHANGES.json');
    assert.strictEqual(report.total_code_changes, 3);
    assert.strictEqual(report.affected_docs.length, 2);
    const shared = report.affected_docs.find(item => item.code_file === 'src/shared.js');
    assert.deepStrictEqual(shared.affected_documentation, ['z.md', 'a.md']);
    assert.strictEqual(shared.lines_changed, 2);
    assert.strictEqual(shared.most_recent_commit.message, 'Update shared behavior');
    assert.deepStrictEqual(report.affected_docs.find(item => item.code_file === 'src/other.js').affected_documentation, ['a.md']);
    const state = read('DOC_STATE.json');
    for (const name of ['z.md', 'a.md']) {
      assert.strictEqual(state.files[`context_for_llms/${name}`].status, 'stale');
      assert.strictEqual(state.files[`context_for_llms/${name}`].validationNeeded, true);
    }
    assert.deepStrictEqual(state.files['context_for_llms/unrelated.md'], current);
    console.log(`PASS ${format} tracking preserves many-to-many links, order, deduplication and unrelated state`);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}
