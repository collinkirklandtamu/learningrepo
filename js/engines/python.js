/* Python in the browser via Pyodide. Student code and the lesson's hidden
 * checks run in one namespace; checks raise AssertionError with a hint. */
(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  const CFG = () => root.LP_CONFIG || {};

  const BOOT = `
import sys, io, json, contextlib, builtins

def _lp_guard(limit):
    state = {"n": 0}
    def tracer(frame, event, arg):
        state["n"] += 1
        if state["n"] > limit:
            raise TimeoutError("Your code ran for too long - is there an infinite loop?")
        return tracer
    return tracer

def _lp_fmt(e):
    tb, line = e.__traceback__, None
    while tb:
        if tb.tb_frame.f_code.co_filename == "<main>":
            line = tb.tb_lineno
        tb = tb.tb_next
    if isinstance(e, SyntaxError):
        line = e.lineno
        return "SyntaxError on line %s: %s" % (line, e.msg)
    where = (" on line %s" % line) if line else ""
    return "%s%s: %s" % (type(e).__name__, where, e)

def _lp_run(code, harness):
    ns = {"__name__": "__main__"}
    buf = io.StringIO()
    err = None
    def _no_input(prompt=""):
        raise RuntimeError("input() is not available in these lessons - use variables instead")
    ns["input"] = _no_input
    with contextlib.redirect_stdout(buf), contextlib.redirect_stderr(buf):
        try:
            compiled = compile(code, "<main>", "exec")
            sys.settrace(_lp_guard(3000000))
            try:
                exec(compiled, ns)
            finally:
                sys.settrace(None)
        except SystemExit:
            pass
        except BaseException as e:
            err = _lp_fmt(e)
    out = buf.getvalue()
    check = None
    if err is None and harness:
        ns["_out"] = out
        try:
            sys.settrace(_lp_guard(3000000))
            try:
                exec(compile(harness, "<check>", "exec"), ns)
            finally:
                sys.settrace(None)
            check = {"ok": True}
        except AssertionError as e:
            check = {"ok": False, "msg": str(e) or "A check failed"}
        except BaseException as e:
            check = {"ok": False, "msg": "Your code raised %s: %s" % (type(e).__name__, e)}
    return json.dumps({"out": out, "err": err, "check": check})
`;

  let loading = null;
  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = () => rej(new Error('Could not load ' + src));
      document.head.appendChild(s);
    });
  }
  const python = {
    id: 'python', label: 'Python', BOOT,
    load(onStatus) {
      if (loading) return loading;
      const base = CFG().pyodideBase || 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';
      loading = (async () => {
        onStatus && onStatus('Downloading Python (one-time, ~10 MB)…');
        if (!root.loadPyodide) await loadScript(base + 'pyodide.js');
        const py = await root.loadPyodide({ indexURL: base });
        await py.runPythonAsync(BOOT);
        onStatus && onStatus('');
        return py;
      })();
      loading.catch(() => { loading = null; });
      return loading;
    },
    async run(code, harness) {
      const py = await python.load();
      py.globals.set('_lp_code', code);
      py.globals.set('_lp_harness', harness || '');
      return JSON.parse(await py.runPythonAsync('_lp_run(_lp_code, _lp_harness)'));
    },
  };
  (LP.engines = LP.engines || {}).python = python;
  if (typeof module !== 'undefined') module.exports = python;
})(typeof window !== 'undefined' ? window : globalThis);
