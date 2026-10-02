/* R in the browser via WebR. */
(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  const CFG = () => root.LP_CONFIG || {};
  const SEP = '\u001f';

  const BOOT = `
.lp_cleanup <- function() {
  # Learner code runs in the global environment, like a normal R script (so S3 methods and S4 classes
  # are visible to R's own code). Reset it before and after every run so nothing leaks between runs
  # or lessons: S4/Reference classes first (they also register in a global table), then all objects.
  g <- globalenv()
  suppressMessages(suppressWarnings({
    for (cl in tryCatch(getClasses(g), error = function(e) character(0))) try(removeClass(cl, where = g), silent = TRUE)
    for (f in tryCatch(getGenerics(g)@.Data, error = function(e) character(0))) try(removeMethods(f, where = g), silent = TRUE)
    all <- ls(g, all.names = TRUE)
    rm(list = all[!grepl("^\\\\.lp_", all)], envir = g)
  }))
  invisible(NULL)
}
.lp_run <- function(code, harness) {
  force(code); force(harness)   # arguments are lazy: read them before the cleanup wipes globals
  .lp_cleanup()
  on.exit(.lp_cleanup(), add = TRUE)
  env <- globalenv()
  err <- ""
  try(setTimeLimit(elapsed = 8, transient = TRUE), silent = TRUE)
  out <- paste(utils::capture.output({
    withCallingHandlers(
      tryCatch({
        for (e in parse(text = code)) {
          r <- withVisible(eval(e, env))
          if (r$visible) print(r$value)
        }
      }, error = function(e) err <<- conditionMessage(e)),
      warning = function(w) { cat("Warning message:\\n", conditionMessage(w), "\\n", sep = ""); invokeRestart("muffleWarning") },
      message = function(m) { cat(conditionMessage(m)); invokeRestart("muffleMessage") })
  }), collapse = "\\n")
  try(setTimeLimit(elapsed = Inf), silent = TRUE)
  chk <- ""
  if (err == "" && nzchar(harness)) {
    env$.out <- out
    env$check <- function(cond, msg) if (!isTRUE(cond)) stop(msg, call. = FALSE)
    chk <- tryCatch({ eval(parse(text = harness), env); "OK" }, error = function(e) paste0("FAIL:", conditionMessage(e)))
  }
  paste(c(out, err, chk), collapse = "\\037")
}
`;
  let loading = null;
  const lit = (s) => JSON.stringify(s);

  const r = {
    id: 'r', label: 'R', BOOT,
    load(onStatus) {
      if (loading) return loading;
      const url = CFG().webrModule || 'https://webr.r-wasm.org/v0.4.4/webr.mjs';
      loading = (async () => {
        onStatus && onStatus('Downloading R (one-time, ~30 MB)…');
        const mod = await import(/* webpackIgnore: true */ url);
        // PostMessage channel works on any static host (no COOP/COEP headers or service worker needed)
        const webR = new mod.WebR(Object.assign({ channelType: mod.ChannelType.PostMessage }, CFG().webrOptions || {}));
        await webR.init();
        await webR.evalRVoid(BOOT);
        onStatus && onStatus('');
        return webR;
      })();
      loading.catch(() => { loading = null; });
      return loading;
    },
    async run(code, harness) {
      const webR = await r.load();
      const raw = await webR.evalRString(`.lp_run(${lit(code)}, ${lit(harness || '')})`);
      const [out = '', err = '', chk = ''] = raw.split(SEP);
      let check = null;
      if (chk === 'OK') check = { ok: true };
      else if (chk.startsWith('FAIL:')) check = { ok: false, msg: chk.slice(5) || 'A check failed' };
      return { out, err: err ? 'Error: ' + err : null, check };
    },
  };
  (LP.engines = LP.engines || {}).r = r;
  if (typeof module !== 'undefined') module.exports = r;
})(typeof window !== 'undefined' ? window : globalThis);
