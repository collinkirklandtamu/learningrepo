# ⚒ Forge: learn by doing

An interactive learning platform in the style of [boot.dev](https://boot.dev): short reading on the left, a real workspace on the right, instant feedback, XP and skill points, and spaced-repetition review so what you learn actually sticks.

**Courses: 119 lessons, 295 practice drills, 5 capstones, 550+ recall cards.**

| Course | Lessons | Drills | Highlights |
|---|---|---|---|
| Python | 39 | 114 | strings, collections, closures, generators, decorators, files/JSON, stdlib, **classes → inheritance → polymorphism → composition → ABCs → properties → dataclasses**, typing, testing, algorithms, `asyncio`; capstone: text-adventure engine |
| R (base R) | 31 | 89 | vectors to data frames, regex, dates, functional tools, environments, error handling, **S3 → S4 → Reference-class inheritance**, simulation, hypothesis tests, ANOVA, `glm`, `optim`, metaprogramming; capstone: survey-analysis pipeline with an S4 report |
| Git | 17 | 32 | branches, merge & conflicts, **rebase, cherry-pick, reflog recovery, bisect**, tags, clean, stash; capstone: rescue a broken repo |
| GitHub | 15 | 28 | remotes, PRs, **code review, branch protection, conflicting PRs**, forks, releases, Actions (matrix/cache/secrets), Dependabot, CODEOWNERS; capstone: ship a contribution |
| Docker | 17 | 32 | containers, volumes & bind mounts, Dockerfiles, **`.dockerignore`, multi-stage builds, healthchecks, networking & DNS, registries, debugging crash loops, resource limits**, Compose (env files, profiles, healthy dependencies); capstone: a two-service stack |

Plus a searchable **Reference** page (see below).

It is a **static site with no build step**: HTML, CSS and plain JavaScript.

## Run it

```bash
python3 -m http.server 8000     # or: npm start
# then open http://localhost:8000 in your browser
```

> The server prints `http://0.0.0.0:8000`. Don't click that: some browsers refuse `0.0.0.0`. Type **localhost:8000** (or `127.0.0.1:8000`) yourself. If the port is busy, use `python3 -m http.server 8080` and open `localhost:8080`.

Any static host works (GitHub Pages: *Settings → Pages → Deploy from branch → `/ (root)`*). Progress is stored in your browser's `localStorage`; export or import a backup from the **Profile** page.

The first Python / R lesson downloads its runtime from a CDN once (Pyodide ≈ 10 MB, WebR ≈ 30 MB; versions are pinned to the ones the tests run against), so that first run needs internet. Syntax highlighting (CodeMirror) also comes from a CDN and silently falls back to a plain textarea.

## How it teaches

| Mechanic | What it does |
|---|---|
| **Read, then do** | Each lesson is a short reading and a task. Code blocks in the reading have **▶ Try it** (Python/R, runs inline) or **⏎ Paste next** (terminal, steps through commands one at a time). |
| **Hidden tests** | Python/R lessons run your code against hidden checks and tell you *what* is wrong. Terminal and file lessons show a **live checklist** that ticks as you work. |
| **XP with a performance multiplier** | A perfect first try with no hints earns **+25%**. Each failed submit costs 15% and each hint 10% (floor 40%). Revealing the solution forfeits the lesson's XP. XP is only awarded on first completion, so grinding replays does nothing. |
| **Skill points & mastery** | Every lesson trains a skill (Basics, Control flow, Branching, Compose…). 1-3 ★ × difficulty skill points are awarded, and skills climb Novice → Apprentice → Adept → Expert → Master. |
| **Practice drills** | Every lesson is followed by 2-3 short **drills**: variations on what you just learned (different data, a new constraint, "now without a loop"). They earn smaller XP, count as practice, and the *Next* button walks you through them. Skip any you like. |
| **Capstones** | Each course ends with a larger project that combines the whole course. |
| **Lock it in** | Right after a lesson you answer one retrieval question for a bonus. Retrieval beats re-reading. |
| **Spaced repetition** | Every lesson plants recall cards in a Leitner system (1, 2, 4, 8, 16, 32 day boxes). Right answers promote a card; wrong answers send it back to box 1. |
| **Combos & crits** | Consecutive correct review answers raise the XP per card (up to +8) and each answer has a 10% chance of a critical hit (×2): a variable-reward schedule that makes reviews feel like a game. |
| **Rusty skills** | If a skill's cards are long overdue it is flagged ⚠ on the dashboard until you review. |
| **Streaks, daily goal, badges** | A daily XP goal ring, day streaks and 19 badges (including Practice, Capstone and Inheritance). |

## Reference page

`#/reference` is a searchable look-up for **258 Python** (every public builtin plus `str`/`list`/`dict`/`set`/`tuple` methods and the commonly used stdlib), **320 base-R** functions (base, stats, utils, methods), and **62 Git/`gh` and 47 Docker** commands and Dockerfile instructions, each with a runnable example, its real output and a link to the lesson that teaches it (✓ once you have finished it).

Honest scope: "every function" is unbounded, so the promise is: **all of Python's builtins** (a test compares the page against `dir(builtins)`), a **curated set of the most-used base-R functions** (not all of base R), and **every command the sandbox supports** (things it cannot run are listed and marked *real tool only*). The Python and R examples are executed by the real interpreters in the test suite, and the recorded output must match; Git/Docker examples run in the sandbox.

To add entries edit `tools/reference-src/python.js` or `r.js` (`[name, signature, description, example, lessonId]`), then run `node tools/build-reference.js` to record the outputs. Git/Docker entries live in `js/content/reference-cli.js`.

## What is real and what is simulated

- **Python** runs on real CPython via [Pyodide](https://pyodide.org). An instruction-count guard stops infinite loops. `input()` is disabled by design.
- **R** runs on real R via [WebR](https://docs.r-wasm.org/webr/latest/) (base R and the built-in datasets such as `mtcars`; no package installs, no graphics).
- **Git, `gh` and Docker are simulations written for this project** (`js/engines/`). They are real *models*, not canned replies: Git has an index, commits, three-way merges with conflict markers, stash, rebase, tags, remotes and rejected pushes. The Docker model parses Dockerfiles and Compose YAML, and produces the errors you really hit (port already allocated, name conflicts, missing env vars, `COPY` source not found). They cover the commands the lessons teach and are not a complete reimplementation, so very exotic flags will say they are unsupported. Nothing in the sandbox touches your machine.

## Adding a lesson

Content lives in `js/content/<course>.js`. A new lesson is one object in a course's `lessons` array. To add a course, create a new file that pushes onto `LP.courses` and add a `<script>` tag for it in `index.html`.

```js
{
  id: 'py-sets', title: 'Sets', skill: 'Data structures', xp: 25, diff: 2,   // diff 1-3
  read: `# Sets\n\nMarkdown: tables, callouts (> [!tip] Title), fenced code (~~~python)...`,
  task: 'Write `unique(xs)` returning the distinct items, sorted.',
  starter: 'def unique(xs):\n    pass\n',
  harness: String.raw`assert unique([3, 1, 3]) == [1, 3], "unique([3, 1, 3]) should be [1, 3]"`,  // hidden test; _out is stdout
  must: [{ re: 'set\\(', msg: 'Use a set.' }],            // optional source checks
  hints: ['Think about `set(xs)`.', '`return sorted(set(xs))`'],
  solution: 'def unique(xs):\n    return sorted(set(xs))',
  recall: [{ type: 'choice', q: 'What does `{1, 1, 2}` contain?', options: ['1, 1, 2', '1, 2', '2'], answer: 1, why: 'Sets drop duplicates.' }],
}
```

- **Drills** are small lessons attached to a parent: `LP.addDrills({ 'py-sets': [{ title, task, starter, harness, hints, solution }] })`. They inherit skill, difficulty and kind, and get their own ids (`py-sets-d1`...). A **capstone** is a normal lesson with `capstone: true` and a larger `xp`. Lessons that teach inheritance carry `arc: 'oop-python' | 'oop-r'` (completing the arc earns a badge). Extra recall cards: `LP.addRecall({ 'py-sets': [...] })`. A course's final `*-order.js` file calls `LP.assemble(course, [ids...], skills)` to fix the order.
- **R** lessons use `harness` written in R with `check(cond, "message")` and `.out` for stdout.
- **Terminal** lessons add `kind: 'terminal'` (default for the Git/GitHub/Docker courses), a `setup(m)` that builds the starting sandbox, and `checks: [{ label, test: (m) => bool }]`. `solution` is a list of commands (or `{ write, content }` file edits). Handy sandbox helpers: `m.seedRepo`, `m.seedRemote`, `m.remoteCommit`, `m.hook(when, run, message)` for "a teammate just pushed" moments, `m.ran(/regex/)`, `m.gitLog()`, `m.container(name)`.
- **File** lessons use `kind: 'file'`, `lang: 'yaml' | 'dockerfile'` and `checks: [{ label, test: (text, ctx) => bool }]`.

The test suite refuses a lesson whose starter already passes or whose reference solution fails, so new lessons are verified automatically.

## Tests

```bash
npm test            # ~470 tests: every lesson and drill's solution vs. real python3/Rscript, the sandbox engines, XP/SRS rules, the reference examples, and a content-quality gate (2+ drills and 4+ recall cards per lesson, a capstone per course)
RUNTIME_ONLY=python node --test tests/runtime.test.js   # all Python solutions in REAL Pyodide (also: =r for WebR)
npm install && npm run test:e2e   # Chromium end-to-end run using the REAL Pyodide and WebR from node_modules
```

`npm test` skips the Python/R lesson checks if `python3` / `Rscript` are not installed. The e2e run needs no internet: it points the page at the runtimes in `node_modules`, then plays through lessons, fails and succeeds at submits, uses tab completion, resolves a merge conflict, runs a review session and checks the mobile layout.

## Layout

```
index.html              app shell (script tags = module list)
css/style.css           design tokens, dark/light theme, layout
js/store.js             XP, skills, spaced repetition, streaks, badges (pure logic)
js/lessons.js           lesson lookup, check evaluation, solution playback
js/engines/             python.js, r.js (WASM runtimes) · shell.js, git.js, gh.js, docker.js (sandbox)
js/content/             the five courses (<course>.js, <course>-N.js chunks, <course>-order.js) and reference-*.js
js/reference-view.js    the searchable reference page
tools/                  build-reference.js + reference-src/ (records example output with the real interpreters)
js/views.js, lesson-view.js, review-view.js, app.js, ui-common.js, terminal.js, editor.js, md.js
tests/                  node:test suites + tests/e2e (Playwright)
```

Your GitHub handle appears in the GitHub course's example URLs (`ME` at the top of `js/content/github.js`), and the display name defaults to "Collin"; both are easy to change (Profile page for the name).
