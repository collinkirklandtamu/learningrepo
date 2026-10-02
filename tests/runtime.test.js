// Runs every Python solution in REAL Pyodide and every R solution in REAL WebR (from node_modules), the
// same engines that ship to the browser. Catches things that differ from CPython / Rscript.
// Needs `npm install`. Skipped automatically when the packages are missing.
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const LP = require('./helpers.js');

let pyodide, webr;
try { pyodide = require('pyodide'); } catch (e) { /* not installed */ }
try { webr = require('webr'); } catch (e) { /* not installed */ }

const only = process.env.RUNTIME_ONLY; // 'python' | 'r'
const cases = (engine) => LP.courses.filter((c) => c.engine === engine).flatMap((c) => c.lessons.map((l) => [c, l]));

test('Pyodide: every Python lesson solution passes and starter fails', { skip: !pyodide || (only && only !== 'python') ? 'pyodide not installed / filtered' : false, timeout: 900000 }, async () => {
  const py = await pyodide.loadPyodide({ indexURL: path.dirname(require.resolve('pyodide')) + '/' });
  await py.runPythonAsync(LP.engines.python.BOOT);
  const run = async (code, harness) => {
    py.globals.set('_lp_code', code);
    py.globals.set('_lp_harness', harness);
    return JSON.parse(await py.runPythonAsync('_lp_run(_lp_code, _lp_harness)'));
  };
  const failures = [];
  for (const [, l] of cases('python')) {
    const good = await run(l.solution, l.harness);
    if (good.err || !(good.check && good.check.ok)) failures.push(`${l.id}: solution failed in Pyodide: ${good.err || (good.check && good.check.msg)}`);
    const bad = await run(l.starter, l.harness);
    if (!(bad.err || (bad.check && !bad.check.ok))) failures.push(`${l.id}: starter unexpectedly passes in Pyodide`);
  }
  assert.deepStrictEqual(failures, []);
});

test('WebR: every R lesson solution passes and starter fails', { skip: !webr || (only && only !== 'r') ? 'webr not installed / filtered' : false, timeout: 1800000 }, async () => {
  const webR = new webr.WebR({ baseUrl: path.join(path.dirname(require.resolve('webr')), '/') + '', interactive: false });
  await webR.init();
  await webR.evalRVoid(LP.engines.r.BOOT);
  const SEP = '\u001f';
  const run = async (code, harness) => {
    const raw = await webR.evalRString(`.lp_run(${JSON.stringify(code)}, ${JSON.stringify(harness)})`);
    const [out = '', err = '', chk = ''] = raw.split(SEP);
    return { out, err, chk };
  };
  const failures = [];
  for (const [, l] of cases('r')) {
    const good = await run(l.solution, l.harness);
    if (good.err || good.chk !== 'OK') failures.push(`${l.id}: solution failed in WebR: ${good.err || good.chk}`);
    const bad = await run(l.starter, l.harness);
    if (!(bad.err || bad.chk.startsWith('FAIL'))) failures.push(`${l.id}: starter unexpectedly passes in WebR`);
  }
  await webR.close();
  assert.deepStrictEqual(failures, []);
});
