// Every Python / R lesson: the reference solution must pass the hidden checks
// and the starter code must NOT pass. Uses real python3 / Rscript with the
// exact bootstrap code that ships to the browser.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const LP = require('./helpers.js');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lp-'));
const have = (cmd) => spawnSync(cmd, ['--version']).status === 0;

function runPython(code, harness) {
  const boot = path.join(tmp, 'boot.py');
  fs.writeFileSync(boot, LP.engines.python.BOOT + '\nimport json, sys\nd = json.load(open(sys.argv[1]))\nprint(_lp_run(d["code"], d["harness"]))\n');
  const inp = path.join(tmp, 'in.json');
  fs.writeFileSync(inp, JSON.stringify({ code, harness }));
  const r = spawnSync('python3', [boot, inp], { encoding: 'utf8', timeout: 30000 });
  assert.strictEqual(r.status, 0, r.stderr);
  return JSON.parse(r.stdout);
}
function runR(code, harness) {
  const script = path.join(tmp, 'run.R');
  fs.writeFileSync(script, LP.engines.r.BOOT + '\nargs <- commandArgs(TRUE)\ncode <- paste(readLines(args[1], warn = FALSE), collapse = "\\n")\nh <- paste(readLines(args[2], warn = FALSE), collapse = "\\n")\ncat(.lp_run(code, h))\n');
  fs.writeFileSync(path.join(tmp, 'c.R'), code);
  fs.writeFileSync(path.join(tmp, 'h.R'), harness);
  const r = spawnSync('Rscript', [script, path.join(tmp, 'c.R'), path.join(tmp, 'h.R')], { encoding: 'utf8', timeout: 60000 });
  assert.strictEqual(r.status, 0, r.stderr);
  const [out = '', err = '', chk = ''] = r.stdout.split('\u001f');
  return { out, err: err || null, check: chk === 'OK' ? { ok: true } : chk.startsWith('FAIL:') ? { ok: false, msg: chk.slice(5) } : null };
}

for (const course of LP.courses.filter((c) => c.engine === 'python' || c.engine === 'r')) {
  const run = course.engine === 'python' ? runPython : runR;
  const ok = have(course.engine === 'python' ? 'python3' : 'Rscript');
  for (const lesson of course.lessons) {
    test(`${lesson.id}: solution passes, starter fails`, { skip: !ok && `${course.engine} not installed` }, () => {
      const good = run(lesson.solution, lesson.harness);
      assert.strictEqual(good.err, null, `solution errored: ${good.err}`);
      assert.ok(good.check && good.check.ok, `solution failed: ${good.check && good.check.msg}\n--- output:\n${good.out}`);
      for (const m of lesson.must || []) assert.ok(new RegExp(m.re).test(lesson.solution), `solution violates must: ${m.msg}`);
      const bad = run(lesson.starter, lesson.harness);
      assert.ok(bad.err || (bad.check && !bad.check.ok), 'starter code should not already pass');
    });
  }
}
