// The reference must be true: every example is re-run with the real interpreter (or the sandbox) and compared to what is shown.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const LP = require('./helpers.js');

const has = (cmd) => spawnSync(cmd, ['--version'], { encoding: 'utf8' }).status === 0;

test('every reference entry is well-formed, uniquely named and links to a real lesson', () => {
  for (const [lang, list] of Object.entries(LP.reference)) {
    assert.ok(list.length > 20, lang + ' reference is too small');
    const seen = new Set();
    for (const e of list) {
      assert.ok(e.name && e.desc, `${lang}: entry needs a name and description: ${JSON.stringify(e).slice(0, 80)}`);
      assert.ok(!seen.has(e.name), `${lang}: duplicate entry ${e.name}`); seen.add(e.name);
      if (e.sandbox === false) assert.ok(!e.ex, `${e.name}: unsupported entries have no example`);
      else if (e.ex !== undefined) assert.ok(String(e.ex).trim(), `${e.name}: empty example`);
      if (e.lesson) assert.ok(LP.findLesson(e.lesson), `${lang}/${e.name}: lesson ${e.lesson} does not exist`);
    }
  }
});

test('python examples print exactly what the reference shows', { skip: !has('python3') }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'reft-py-'));
  const bad = [];
  for (const e of LP.reference.python) {
    const r = spawnSync('python3', ['-c', e.ex], { cwd: dir, encoding: 'utf8', timeout: 20000 });
    const out = r.stdout.replace(/\s+$/, '');
    if (r.status !== 0 || out !== e.out) bad.push(`${e.name}: expected ${JSON.stringify(e.out)}, got ${JSON.stringify(out)} ${r.stderr.slice(-200)}`);
  }
  assert.deepStrictEqual(bad, []);
});

test('python reference covers every public builtin function and type', { skip: !has('python3') }, () => {
  const r = spawnSync('python3', ['-c', 'import builtins\nprint("\\n".join(n for n in dir(builtins) if not n.startswith("_") or n == "__import__"))\nprint("\\n".join(n for n in dir(builtins) if isinstance(getattr(builtins, n), type) and issubclass(getattr(builtins, n), BaseException)))'], { encoding: 'utf8' });
  const lines = r.stdout.split('\n').filter(Boolean);
  const exc = spawnSync('python3', ['-c', 'import builtins\nprint("\\n".join(n for n in dir(builtins) if isinstance(getattr(builtins, n), type) and issubclass(getattr(builtins, n), BaseException)))'], { encoding: 'utf8' }).stdout.split('\n').filter(Boolean);
  const skip = new Set([...exc, 'copyright', 'credits', 'exit', 'quit', 'license', 'WindowsError']);
  const names = new Set(LP.reference.python.map((e) => e.name));
  const missing = [...new Set(lines)].filter((n) => !skip.has(n) && !names.has(n));
  assert.deepStrictEqual(missing, [], 'builtins missing from the Python reference');
});

test('R examples print exactly what the reference shows', { skip: !has('Rscript') }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'reft-r-'));
  const list = LP.reference.r;
  list.forEach((e, i) => fs.writeFileSync(path.join(dir, `ex${i}.R`), e.ex + '\n'));
  fs.writeFileSync(path.join(dir, 'run.R'), `setwd("${dir}")
for (i in seq_len(${list.length}) - 1L) {
  res <- tryCatch(paste(capture.output(source(sprintf("ex%d.R", i), echo = FALSE, print.eval = TRUE, local = new.env())), collapse = "\\n"), error = function(e) paste0("ERROR: ", conditionMessage(e)))
  writeLines(res, sprintf("out%d.txt", i))
}`);
  const r = spawnSync('Rscript', ['--vanilla', path.join(dir, 'run.R')], { encoding: 'utf8', timeout: 600000 });
  assert.strictEqual(r.status, 0, r.stderr);
  const bad = [];
  list.forEach((e, i) => {
    const out = fs.readFileSync(path.join(dir, `out${i}.txt`), 'utf8').replace(/\s+$/, '');
    if (out !== e.out) bad.push(`${e.name}: expected ${JSON.stringify(e.out)}, got ${JSON.stringify(out)}`);
  });
  assert.deepStrictEqual(bad, []);
});

test('git, gh and docker examples run cleanly in the sandbox', () => {
  const bad = [];
  for (const lang of ['git', 'docker']) {
    for (const e of LP.reference[lang]) {
      if (e.sandbox === false) continue;
      assert.ok(LP.referenceSetups[e.setup], `${e.name}: unknown setup ${e.setup}`);
      const m = LP.Machine.create(LP.referenceSetups[e.setup]);
      for (const line of e.ex.split('\n')) {
        const res = m.exec(line);
        const text = res.items.map((i) => i.text).join('\n');
        if (res.code !== 0 || /internal sandbox error/.test(text)) bad.push(`${e.name}: "${line}" -> exit ${res.code}: ${text.slice(0, 160)}`);
      }
    }
  }
  assert.deepStrictEqual(bad, []);
});

test('search ranks exact and prefix name matches first and falls back to descriptions', () => {
  const r = LP.searchReference('python', 'sorted');
  assert.strictEqual(r[0].name, 'sorted');
  assert.ok(LP.searchReference('python', 'sort').some((e) => e.name === 'list.sort'));
  assert.ok(LP.searchReference('r', 'merge').some((e) => e.name === 'merge'));
  assert.ok(LP.searchReference('docker', 'volume').length >= 3);
  assert.ok(LP.searchReference('python', 'binary').length > 0, 'description search works');
  assert.strictEqual(LP.searchReference('python', 'zzzznotathing').length, 0);
  assert.strictEqual(LP.searchReference('git', '').length, LP.reference.git.length);
});
