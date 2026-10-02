(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  const r = String.raw;

  LP.addLessons('python', [
    {
      id: 'py-logging', title: 'Logging & debugging', skill: 'Reliability', xp: 45, diff: 2,
      read: `
# Make your programs tell you what happened

\`print()\` is fine for a quick look, but real programs run unattended (servers, scheduled jobs, containers). When something goes wrong at 3am, the only evidence is what the program **logged**.

~~~python
import logging
log = logging.getLogger("app")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

log.debug("loaded %d rows", 10)       # hidden at INFO level
log.info("started")                   # normal progress
log.warning("disk 90%% full")         # something odd, but still working
log.error("payment failed")           # an operation failed
log.critical("database is down")      # the app may not continue
~~~

| Level | Use it for |
|---|---|
| DEBUG | detail for developers |
| INFO | normal milestones |
| WARNING | unexpected but handled |
| ERROR | an operation failed |
| CRITICAL | the program is in trouble |

Pass values as arguments (\`log.info("user %s", name)\`), not an f-string: the formatting only happens if the level is enabled.

## Handlers and formatters

A **logger** creates messages; a **handler** decides where they go (console, file, a string); a **formatter** shapes each line.

~~~python
import io
stream = io.StringIO()
handler = logging.StreamHandler(stream)
handler.setFormatter(logging.Formatter("%(levelname)s:%(name)s:%(message)s"))
log.addHandler(handler)
~~~

Calling set-up code twice adds a second handler, and every message appears twice. Clear old handlers first.

## Reading a traceback

~~~python
import traceback
try:
    1 / 0
except ZeroDivisionError:
    print(traceback.format_exc().strip().splitlines()[-1])   # ZeroDivisionError: division by zero
    log.exception("calculation failed")                      # logs the message AND the traceback
~~~

Read tracebacks **bottom to top**: the last line says what went wrong, the lines above say where. A debugging routine: reproduce -> read the last line -> check the line it points to -> log the values involved -> fix -> keep a test. (In a real terminal, \`breakpoint()\` opens the \`pdb\` debugger at that line.)

> [!tip] Key idea
> Log **events and decisions** with enough context to reconstruct what happened, never secrets or passwords.
`,
      task: 'Write `make_logger(stream, level=logging.INFO)` returning the logger named `"app"`: it writes to `stream` in the format `LEVEL:name:message`, never duplicates handlers when called twice, and does not pass messages to the root logger. Write `parse_numbers(items, logger)` which converts each item with `int()`, logs `WARNING skipping <repr of item>` for bad ones, `DEBUG parsed <item>` for good ones, finishes with `INFO parsed X of Y items`, and returns the list of ints. Write `last_traceback_line(func)` that calls `func()` and returns the final line of the traceback text if it raised (for example `"ZeroDivisionError: division by zero"`), or `None` if it did not.',
      starter: 'import logging\nimport traceback\n\ndef make_logger(stream, level=logging.INFO):\n    pass\n\ndef parse_numbers(items, logger):\n    pass\n\ndef last_traceback_line(func):\n    pass\n',
      harness: r`
import io
s = io.StringIO()
lg = make_logger(s)
res = parse_numbers(["1", "x", "3"], lg)
assert res == [1, 3], f"parse_numbers should return [1, 3], got {res}"
assert s.getvalue().splitlines() == ["WARNING:app:skipping 'x'", "INFO:app:parsed 2 of 3 items"], f"log output was {s.getvalue().splitlines()}"
s2 = io.StringIO()
lg2 = make_logger(s2, logging.DEBUG)
parse_numbers(["5"], lg2)
assert s2.getvalue().splitlines() == ["DEBUG:app:parsed 5", "INFO:app:parsed 1 of 1 items"], f"debug level output was {s2.getvalue().splitlines()}"
s3 = io.StringIO()
make_logger(s3)
lg3 = make_logger(s3)
lg3.info("once")
assert s3.getvalue().count("once") == 1, "calling make_logger twice must not duplicate every message (clear old handlers)"
assert lg3.propagate is False, "set propagate = False so the root logger does not print it again"
assert last_traceback_line(lambda: 1 / 0) == "ZeroDivisionError: division by zero", "wrong traceback line"
assert last_traceback_line(lambda: int("x")) == "ValueError: invalid literal for int() with base 10: 'x'"
assert last_traceback_line(lambda: 5) is None, "return None when nothing was raised"
`,
      hints: ['In make_logger: `logger = logging.getLogger("app")`, `logger.handlers.clear()`, `logger.setLevel(level)`, then add a `StreamHandler(stream)` with a `Formatter("%(levelname)s:%(name)s:%(message)s")`.', 'Set `logger.propagate = False` and `return logger`.', 'parse_numbers: `try: nums.append(int(it))` / `except ValueError: logger.warning("skipping %r", it)` / `else: logger.debug("parsed %s", it)`; after the loop `logger.info("parsed %d of %d items", len(nums), len(items))`.', 'last_traceback_line: `try: func()` / `except Exception: return traceback.format_exc().strip().splitlines()[-1]` / `return None`.'],
      solution: 'import logging\nimport traceback\n\ndef make_logger(stream, level=logging.INFO):\n    logger = logging.getLogger("app")\n    logger.handlers.clear()\n    logger.setLevel(level)\n    handler = logging.StreamHandler(stream)\n    handler.setFormatter(logging.Formatter("%(levelname)s:%(name)s:%(message)s"))\n    logger.addHandler(handler)\n    logger.propagate = False\n    return logger\n\ndef parse_numbers(items, logger):\n    nums = []\n    for it in items:\n        try:\n            nums.append(int(it))\n        except ValueError:\n            logger.warning("skipping %r", it)\n        else:\n            logger.debug("parsed %s", it)\n    logger.info("parsed %d of %d items", len(nums), len(items))\n    return nums\n\ndef last_traceback_line(func):\n    try:\n        func()\n    except Exception:\n        return traceback.format_exc().strip().splitlines()[-1]\n    return None',
      recall: [
        { type: 'choice', q: 'A payment fails but the app keeps running. Which level fits best?', options: ['DEBUG', 'INFO', 'ERROR', 'CRITICAL'], answer: 2, why: 'ERROR means an operation failed; CRITICAL is for the program itself being in trouble.' },
        { type: 'choice', q: 'Why write `log.info("user %s", name)` instead of an f-string?', options: ['The text is only built if the level is enabled', 'f-strings are not allowed', 'It prints in colour', 'It sorts the output'], answer: 0, why: 'Lazy formatting avoids wasted work for hidden levels.' },
        { type: 'choice', q: 'In a traceback, which line tells you what went wrong?', options: ['The first line', 'The last line', 'The longest line', 'The blank line'], answer: 1, why: 'The final line is the exception type and message; lines above show where.' },
      ],
    },
    {
      id: 'py-scripts', title: 'Scripts, arguments & the environment', skill: 'Reliability', xp: 45, diff: 2,
      read: `
# Programs that run from a terminal, a cron job or a container

A script gets its inputs from three places: **arguments** (\`python report.py app.log --level ERROR\`), **environment variables** (\`APP_ENV=prod\`) and files. And it reports success or failure with an **exit code**: 0 means success, anything else means failure (schedulers and CI check this).

~~~python
import sys, os, argparse

print(sys.argv)                       # ['report.py', 'app.log', '--level', 'ERROR']
env = os.environ.get("APP_ENV", "dev")   # a default when it is not set

parser = argparse.ArgumentParser(description="Summarise a log file")
parser.add_argument("logfile")                                         # required positional
parser.add_argument("--level", choices=["INFO", "WARNING", "ERROR"], default="WARNING")
parser.add_argument("--top", type=int, default=3)                      # converted to int for you
args = parser.parse_args()            # reads sys.argv; pass a list in tests: parse_args(["app.log"])
~~~

\`argparse\` gives you \`--help\`, type conversion and clear errors for free; on bad input it prints usage and exits with code **2**.

~~~python
def main(argv=None):
    args = parser.parse_args(argv)
    ...
    return 0                          # exit code

if __name__ == "__main__":            # only when run as a script, not when imported
    sys.exit(main())
~~~

Accepting \`argv\` as a parameter makes \`main\` easy to test. For paths use \`pathlib\`: \`Path("logs") / "app.log"\`, \`.read_text()\`, \`.exists()\`.

## Running other programs

\`subprocess.run(["git", "status"], capture_output=True, text=True)\` runs a command and gives you \`.stdout\`, \`.stderr\` and \`.returncode\`. Always pass a **list**, not a string built from user input. It needs a real terminal, so it is not available in this in-browser Python; try it on your own machine.

> [!tip] Key idea
> Configuration comes from arguments and environment variables, never hard-coded; success or failure comes back as an exit code.
`,
      task: 'Write `build_parser()` returning an `argparse.ArgumentParser` with a positional `logfile`, `--level` (choices `INFO`, `WARNING`, `ERROR`, default `WARNING`) and `--top` (an `int`, default `3`). Write `get_config(argv, env)` that parses the list `argv` and returns a dict `{"logfile": ..., "level": ..., "top": ..., "env": ...}` where `env` is the value of `"APP_ENV"` in the dict `env`, defaulting to `"dev"`.',
      starter: 'import argparse\n\ndef build_parser():\n    pass\n\ndef get_config(argv, env):\n    pass\n',
      harness: r`
import contextlib, io
p = build_parser()
a = p.parse_args(["app.log"])
assert (a.logfile, a.level, a.top) == ("app.log", "WARNING", 3), f"defaults wrong: {a}"
a = p.parse_args(["x.log", "--level", "ERROR", "--top", "5"])
assert a.level == "ERROR" and a.top == 5 and isinstance(a.top, int), "--level/--top not parsed (top must be an int)"
bad = False
try:
    with contextlib.redirect_stderr(io.StringIO()):
        p.parse_args(["x.log", "--level", "LOUD"])
except SystemExit as e:
    bad = True
    assert e.code == 2, "argparse exits with code 2 on bad input"
assert bad, "an invalid --level should make argparse exit (use choices=)"
cfg = get_config(["a.log", "--top", "2"], {"APP_ENV": "prod"})
assert cfg == {"logfile": "a.log", "level": "WARNING", "top": 2, "env": "prod"}, f"get_config gave {cfg}"
assert get_config(["a.log"], {})["env"] == "dev", "env should default to dev"
`,
      hints: ['`parser = argparse.ArgumentParser()` then `parser.add_argument("logfile")`.', '`parser.add_argument("--level", choices=["INFO", "WARNING", "ERROR"], default="WARNING")` and `parser.add_argument("--top", type=int, default=3)`.', 'get_config: `args = build_parser().parse_args(argv)` then build the dict; use `env.get("APP_ENV", "dev")`.'],
      solution: 'import argparse\n\ndef build_parser():\n    parser = argparse.ArgumentParser(description="Summarise a log file")\n    parser.add_argument("logfile")\n    parser.add_argument("--level", choices=["INFO", "WARNING", "ERROR"], default="WARNING")\n    parser.add_argument("--top", type=int, default=3)\n    return parser\n\ndef get_config(argv, env):\n    args = build_parser().parse_args(argv)\n    return {"logfile": args.logfile, "level": args.level, "top": args.top, "env": env.get("APP_ENV", "dev")}',
      recall: [
        { type: 'choice', q: 'What does exit code 0 mean?', options: ['The program succeeded', 'The program crashed', 'No arguments were given', 'The output was empty'], answer: 0, why: 'Zero is success; schedulers and CI treat anything else as failure.' },
        { type: 'choice', q: 'Why make `main(argv=None)` accept the arguments as a parameter?', options: ['So tests can call it with a list', 'It runs faster', 'argparse requires it', 'To hide the arguments'], answer: 0, why: 'You can test it without touching the real command line.' },
        { type: 'choice', q: 'Where should an API key or a database URL come from?', options: ['An environment variable', 'A constant in the source code', 'The commit message', 'The log file'], answer: 0, why: 'Keeps secrets out of source control and lets each environment differ.' },
      ],
    },
    {
      id: 'py-capstone', title: 'Capstone: log analyser & health report', skill: 'Projects', xp: 150, diff: 3, capstone: true,
      read: `
# A real operations tool

Build the heart of a log-monitoring script: parse log lines, summarise them, decide whether a service is healthy and produce a report. It combines strings and regex, dicts, files, functions and error handling.

Log lines look like \`2024-05-01 12:00:03 ERROR db: timeout after 30s\`: a date, a time, a **level**, a **component** followed by a colon, then the message.

**1. \`parse_line(line)\`** returns \`{"time": "12:00:03", "level": "ERROR", "component": "db", "message": "timeout after 30s"}\` or \`None\` for a malformed line. Levels are DEBUG, INFO, WARNING, ERROR, CRITICAL.

**2. \`summarize(lines)\`** returns \`{"total": valid lines, "bad": malformed lines, "levels": {level: count}, "components": {component: number of ERROR or CRITICAL lines}}\`. Only components that have at least one error appear.

**3. \`health(summary, max_error_rate=0.2)\`** returns \`"DOWN"\` if any CRITICAL line exists, otherwise \`"DEGRADED"\` if (ERROR + CRITICAL) / total is **greater than** \`max_error_rate\`, otherwise \`"OK"\`. A summary with no valid lines is \`"OK"\`.

**4. \`report(summary)\`** returns a multi-line string:
~~~
Status: DEGRADED
Lines: 6 (1 malformed)
ERROR: 3
WARNING: 1
INFO: 2
Top error source: db (2)
~~~
Levels are listed from most to least severe and only if present. The top error source is the component with the most errors (ties: alphabetical), or \`none\`.

**5. \`analyze_file(path)\`** reads the text file at \`path\` with \`pathlib\` and returns \`summarize\` of its lines. If the file does not exist it returns \`None\`.

> [!tip] Build it in order
> Each function uses only the ones before it. Test \`parse_line\` on a few lines first.
`,
      task: 'Implement `parse_line`, `summarize`, `health`, `report` and `analyze_file` exactly as described in the reading.',
      starter: 'import re\nfrom pathlib import Path\n\ndef parse_line(line):\n    pass\n\ndef summarize(lines):\n    pass\n\ndef health(summary, max_error_rate=0.2):\n    pass\n\ndef report(summary):\n    pass\n\ndef analyze_file(path):\n    pass\n',
      harness: r`
LOG = """2024-05-01 12:00:01 INFO web: started
2024-05-01 12:00:02 INFO db: connected
2024-05-01 12:00:03 ERROR db: timeout after 30s
garbage line
2024-05-01 12:00:04 WARNING web: slow response
2024-05-01 12:00:05 ERROR db: connection refused
2024-05-01 12:00:06 ERROR web: 500 on /pay"""
assert parse_line("2024-05-01 12:00:03 ERROR db: timeout after 30s") == {"time": "12:00:03", "level": "ERROR", "component": "db", "message": "timeout after 30s"}, "parse_line wrong"
assert parse_line("garbage line") is None and parse_line("2024-05-01 12:00:03 LOUD db: x") is None and parse_line("") is None, "malformed lines give None"
s = summarize(LOG.splitlines())
assert s == {"total": 6, "bad": 1, "levels": {"INFO": 2, "ERROR": 3, "WARNING": 1}, "components": {"db": 2, "web": 1}}, f"summarize gave {s}"
assert health(s) == "DEGRADED", "3 of 6 lines are errors: DEGRADED"
assert health(s, max_error_rate=0.5) == "OK", "the rate must be greater than the maximum to be DEGRADED"
assert health({"total": 4, "bad": 0, "levels": {"INFO": 3, "CRITICAL": 1}, "components": {"db": 1}}) == "DOWN", "any CRITICAL means DOWN"
assert health({"total": 0, "bad": 2, "levels": {}, "components": {}}) == "OK", "no valid lines is OK"
expected = "Status: DEGRADED\nLines: 6 (1 malformed)\nERROR: 3\nWARNING: 1\nINFO: 2\nTop error source: db (2)"
assert report(s) == expected, f"report was:\n{report(s)}"
quiet = summarize(["2024-05-01 12:00:01 INFO web: ok", "2024-05-01 12:00:02 DEBUG web: detail"])
assert report(quiet) == "Status: OK\nLines: 2 (0 malformed)\nINFO: 1\nDEBUG: 1\nTop error source: none", f"quiet report was:\n{report(quiet)}"
tie = summarize(["2024-05-01 12:00:01 ERROR web: x", "2024-05-01 12:00:02 ERROR api: y"])
assert report(tie).splitlines()[-1] == "Top error source: api (1)", "ties are broken alphabetically"
with open("svc.log", "w") as f:
    f.write(LOG)
assert analyze_file("svc.log") == s, "analyze_file should summarize the file"
assert analyze_file("missing-file.log") is None, "a missing file gives None"
`,
      hints: ['parse_line: `m = re.match(r"^\\d{4}-\\d\\d-\\d\\d (\\d\\d:\\d\\d:\\d\\d) (DEBUG|INFO|WARNING|ERROR|CRITICAL) (\\w+): (.*)$", line)`; return None if `m` is falsy.', 'summarize: loop over lines, call parse_line, count bad ones, and use `dict.get(key, 0) + 1` for the counters. Only count components for ERROR and CRITICAL.', 'report: build a list of lines; iterate `["CRITICAL", "ERROR", "WARNING", "INFO", "DEBUG"]` and include a level only if it is in summary["levels"]. Top source: `sorted(components.items(), key=lambda kv: (-kv[1], kv[0]))[0]`.', 'analyze_file: `p = Path(path)`; `if not p.exists(): return None`; `return summarize(p.read_text().splitlines())`.'],
      solution: 'import re\nfrom pathlib import Path\n\nLINE = re.compile(r"^\\d{4}-\\d\\d-\\d\\d (\\d\\d:\\d\\d:\\d\\d) (DEBUG|INFO|WARNING|ERROR|CRITICAL) (\\w+): (.*)$")\nORDER = ["CRITICAL", "ERROR", "WARNING", "INFO", "DEBUG"]\n\ndef parse_line(line):\n    m = LINE.match(line)\n    if not m:\n        return None\n    return {"time": m.group(1), "level": m.group(2), "component": m.group(3), "message": m.group(4)}\n\ndef summarize(lines):\n    total = bad = 0\n    levels = {}\n    components = {}\n    for line in lines:\n        rec = parse_line(line)\n        if rec is None:\n            bad += 1\n            continue\n        total += 1\n        levels[rec["level"]] = levels.get(rec["level"], 0) + 1\n        if rec["level"] in ("ERROR", "CRITICAL"):\n            components[rec["component"]] = components.get(rec["component"], 0) + 1\n    return {"total": total, "bad": bad, "levels": levels, "components": components}\n\ndef health(summary, max_error_rate=0.2):\n    levels = summary["levels"]\n    if levels.get("CRITICAL", 0):\n        return "DOWN"\n    if not summary["total"]:\n        return "OK"\n    errors = levels.get("ERROR", 0) + levels.get("CRITICAL", 0)\n    return "DEGRADED" if errors / summary["total"] > max_error_rate else "OK"\n\ndef report(summary):\n    lines = [f"Status: {health(summary)}", f"Lines: {summary[\'total\']} ({summary[\'bad\']} malformed)"]\n    for level in ORDER:\n        if level in summary["levels"]:\n            lines.append(f"{level}: {summary[\'levels\'][level]}")\n    if summary["components"]:\n        name, n = sorted(summary["components"].items(), key=lambda kv: (-kv[1], kv[0]))[0]\n        lines.append(f"Top error source: {name} ({n})")\n    else:\n        lines.append("Top error source: none")\n    return "\\n".join(lines)\n\ndef analyze_file(path):\n    p = Path(path)\n    if not p.exists():\n        return None\n    return summarize(p.read_text().splitlines())',
      recall: [
        { type: 'choice', q: 'Why does `health` treat a summary with no valid lines as OK instead of dividing?', options: ['Dividing by zero would crash', 'Zero is a good number', 'Python skips it', 'It is a bug'], answer: 0, why: 'Guard the empty case before computing a rate.' },
        { type: 'choice', q: 'Why keep malformed lines in a `bad` counter instead of ignoring them?', options: ['A sudden rise in unparseable lines is itself a signal', 'To make the report longer', 'Python requires it', 'They are errors'], answer: 0, why: 'Monitoring should surface data you could not understand.' },
        { type: 'choice', q: 'What is a good first debugging step when `parse_line` returns None for a line you expect to work?', options: ['Test the regex on that exact line and read the mismatch', 'Rewrite the whole program', 'Delete the line', 'Add more logging to every function'], answer: 0, why: 'Reproduce the problem on the smallest input.' },
      ],
    },
  ]);

  LP.addDrills({
    'py-logging': [
      { title: 'Count the levels', task: 'Write `count_levels(lines)` that takes log lines like `"ERROR:app:boom"` and returns a dict of how many lines each level has, e.g. `{"ERROR": 2, "INFO": 1}`. Lines without a colon are ignored.', starter: 'def count_levels(lines):\n    pass\n', harness: r`assert count_levels(["ERROR:app:a", "INFO:app:b", "ERROR:app:c", "nonsense"]) == {"ERROR": 2, "INFO": 1}, "count_levels wrong"
assert count_levels([]) == {}`, hints: ['`level = line.split(":", 1)[0]` when `":" in line`; count with `d[level] = d.get(level, 0) + 1`.'], solution: 'def count_levels(lines):\n    counts = {}\n    for line in lines:\n        if ":" not in line:\n            continue\n        level = line.split(":", 1)[0]\n        counts[level] = counts.get(level, 0) + 1\n    return counts' },
    ],
    'py-scripts': [
      { title: 'Exit codes', task: 'Write `exit_code(status)` returning `0` for `"OK"`, `1` for `"DEGRADED"` and `2` for anything else (`"DOWN"` or unknown), the convention monitoring tools use.', starter: 'def exit_code(status):\n    pass\n', harness: r`assert exit_code("OK") == 0 and exit_code("DEGRADED") == 1 and exit_code("DOWN") == 2 and exit_code("???") == 2, "exit_code wrong"`, hints: ['A dict lookup with a default: `{"OK": 0, "DEGRADED": 1}.get(status, 2)`.'], solution: 'def exit_code(status):\n    return {"OK": 0, "DEGRADED": 1}.get(status, 2)' },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
