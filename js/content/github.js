(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  const H = '/home/learner';
  const ME = 'collinkirklandtamu';
  const U = (n) => `https://github.com/${ME}/${n}`;
  const base = (m) => { m.configureIdentity(); m.globalConfig['init.defaultbranch'] = 'main'; };
  const tree = (m, dir, br) => { const r = m.git(dir); const id = r && r.branches[br]; return id ? m.objects.get(id).tree : {}; };

  const CI = `name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: pip install pytest
      - run: pytest
`;

  (LP.courses = LP.courses || []).push({
    id: 'github', title: 'GitHub', icon: '🐙', color: '#9b7fe6', engine: 'terminal',
    blurb: 'Push, pull, open pull requests, close issues, fork projects and automate tests with Actions.',
    skills: ['Remotes', 'Collaboration', 'Pull requests', 'Automation'],
    lessons: [
      {
        id: 'gh-remote', title: 'Connect a repo to GitHub', skill: 'Remotes', xp: 25, diff: 1, kind: 'terminal',
        read: `
# Local vs remote

Git works fully offline. **GitHub** hosts a copy so you can back it up, share it and collaborate. A **remote** is a named bookmark for the URL of that copy; by convention the main one is called \`origin\`.

~~~bash
git remote add origin https://github.com/${ME}/portfolio
git remote -v                  # list remotes
git push -u origin main        # upload main and remember the link
~~~

\`-u\` (*set upstream*) links your local \`main\` to \`origin/main\`. After that, plain \`git push\` and \`git pull\` know where to go, and \`git status\` tells you if you are ahead or behind.

> [!tip] Key idea
> Pushing sends your **commits**, not your working files. Anything uncommitted stays on your machine.

In this course your GitHub handle is \`${ME}\`, so URLs look like \`https://github.com/${ME}/<repo>\`.
`,
        task: `The repo \`~/portfolio\` has two commits. An empty GitHub repository already exists at \`${U('portfolio')}\`. Add it as \`origin\`, check with \`git remote -v\` and push \`main\`, setting the upstream.`,
        intro: 'You are on main in ~/portfolio.',
        setup(m) {
          base(m);
          m.seedRepo('portfolio', [{ msg: 'Add index page', files: { 'index.html': '<h1>Hi</h1>\n' } }, { msg: 'Add styles', files: { 'style.css': 'h1 { color: maroon; }\n' } }]);
          m.seedRemote(U('portfolio'), []);
          m.cwd = H + '/portfolio';
        },
        checks: [
          { label: 'Remote origin points at your portfolio repo', test: (m) => /collinkirklandtamu\/portfolio/.test((m.git(H + '/portfolio').remotes.origin || '')) },
          { label: 'Listed remotes with git remote -v', test: (m) => m.ran(/^git remote -v/) },
          { label: 'main was pushed to GitHub', test: (m) => { const r = m.remote(U('portfolio')); const l = m.git(H + '/portfolio'); return !!r.branches.main && r.branches.main === l.branches.main; } },
          { label: 'Upstream tracking is set for main', test: (m) => !!m.git(H + '/portfolio').upstream.main },
        ],
        hints: [`\`git remote add origin ${U('portfolio')}\``, '`git push -u origin main`'],
        solution: [`git remote add origin ${U('portfolio')}`, 'git remote -v', 'git push -u origin main'],
        recall: [
          { type: 'choice', q: 'What is `origin`?', options: ['A special branch', 'The conventional name for your main remote', 'The first commit', 'A GitHub setting'], answer: 1, why: 'A remote is just a name for a URL. `origin` is the default name for the one you cloned from or pushed to first.' },
          { type: 'choice', q: 'What does `-u` do in `git push -u origin main`?', options: ['Forces the push', 'Links local main to origin/main so later pushes and pulls need no arguments', 'Uploads untracked files', 'Updates GitHub settings'], answer: 1, why: '`-u` sets the upstream (tracking) branch.' },
        ],
      },
      {
        id: 'gh-clone', title: 'Clone and pull', skill: 'Collaboration', xp: 30, diff: 1, kind: 'terminal',
        read: `
# Getting a copy, staying current

\`git clone <url>\` downloads a repo (all its history) into a new folder and sets up \`origin\` for you.

~~~bash
git clone https://github.com/${ME}/study-notes
cd study-notes
~~~

When others push, your copy does not change by itself. Two commands bring updates in:

~~~bash
git fetch      # download new commits, but do NOT touch your files
git pull       # fetch + merge into your current branch
~~~

\`git status\` only knows what you have fetched, so it can say "up to date" while GitHub has moved on. Fetch or pull to refresh.

> [!tip] Key idea
> \`git pull\` is \`git fetch\` followed by \`git merge\`. If you want to look before merging, fetch first.
`,
        task: `Clone \`${U('study-notes')}\` and \`cd\` into it. Heads-up: a teammate is about to push something new. Bring it into your clone.`,
        intro: 'Your home folder is empty. Clone away.',
        setup(m) {
          base(m);
          m.seedRemote(U('study-notes'), [{ msg: 'Add syllabus', files: { 'syllabus.md': '# Syllabus\n' } }, { msg: 'Add week 1', files: { 'week1.md': 'Intro\n' } }]);
          m.hook((x) => !!x.repos[H + '/study-notes'], (x) => x.remoteCommit(U('study-notes'), 'main', { 'week2.md': 'Loops\n' }, 'Add week 2', { name: 'Teammate', email: 'team@example.com' }), '📬 A teammate just pushed "Add week 2" to GitHub. Your clone does not have it yet...');
          m.cwd = H;
        },
        checks: [
          { label: 'Cloned study-notes', test: (m) => !!m.repos[H + '/study-notes'] },
          { label: 'Pulled: week2.md is in your folder', test: (m) => m.read(H + '/study-notes/week2.md') !== null },
          { label: 'Your main matches origin/main on GitHub', test: (m) => { const r = m.remote(U('study-notes')); const l = m.git(H + '/study-notes'); return !!l && r.branches.main === l.branches.main; } },
        ],
        hints: [`\`git clone ${U('study-notes')}\` then \`cd study-notes\`.`, 'Run `git pull` to download and merge the new commit.'],
        solution: [`git clone ${U('study-notes')}`, 'cd study-notes', 'git status', 'git pull', 'ls'],
        recall: [
          { type: 'choice', q: 'What is the difference between `git fetch` and `git pull`?', options: ['None', 'fetch downloads only; pull downloads and merges', 'pull downloads only; fetch merges', 'fetch is for tags'], answer: 1, why: '`git pull` = `git fetch` + `git merge`.' },
          { type: 'type', q: 'Which command copies a remote repository to your computer? (just the subcommand after git)', accept: ['clone', 'git clone'], why: '`git clone <url>` creates a local copy and configures `origin`.' },
        ],
      },
      {
        id: 'gh-rejected', title: 'When your push is rejected', skill: 'Collaboration', xp: 40, diff: 2, kind: 'terminal',
        read: `
# "Updates were rejected"

You commit, you push, and Git refuses:

~~~
 ! [rejected]  main -> main (fetch first)
error: failed to push some refs
~~~

It is not broken. Someone else pushed first, and the remote has commits you do not. Git will not let you overwrite their work.

The fix is always: **integrate their work, then push again**.

~~~bash
git pull       # fetch their commits and merge with yours
git push       # now your branch is ahead, so the push is accepted
~~~

If you both edited the same lines, \`git pull\` will stop with a merge conflict. Resolve it exactly as in the merge-conflict lesson.

> [!warn] Never "fix" this with --force
> \`git push --force\` overwrites the remote with your version and *deletes your teammates' commits*. Pull instead.
`,
        task: 'You committed `mine.md` locally, but a teammate pushed to the same branch first. Try `git push` and read the rejection. Then pull and push again.',
        intro: 'You are in ~/team-app. You have 1 local commit that GitHub has not seen.',
        setup(m) {
          base(m);
          m.seedRemote(U('team-app'), [{ msg: 'Initial app', files: { 'app.py': 'print("app")\n' } }]);
          m.cwd = H;
          m.run([`git clone ${U('team-app')}`, 'cd team-app']);
          m.remoteCommit(U('team-app'), 'main', { 'team.md': '# Team notes\n' }, 'Add team notes', { name: 'Teammate', email: 'team@example.com' });
          m.write(H + '/team-app/mine.md', 'my feature\n');
          m.run(['git add mine.md', 'git commit -m "Add my feature"']);
        },
        checks: [
          { label: 'Tried to push and was rejected', test: (m) => m.cmds.some((c) => /^git push/.test(c.line) && !c.ok) },
          { label: 'Pulled the teammate\'s work (team.md is here)', test: (m) => m.read(H + '/team-app/team.md') !== null },
          { label: 'Your own commit is still there (mine.md)', test: (m) => m.read(H + '/team-app/mine.md') !== null },
          { label: 'Push succeeded: GitHub main == your main', test: (m) => { const r = m.remote(U('team-app')); const l = m.git(H + '/team-app'); return r.branches.main === l.branches.main; } },
        ],
        hints: ['First just run `git push` and read what Git says.', '`git pull` merges the teammate\'s commit with yours.', 'Then `git push` again.'],
        solution: ['git push', 'git pull', 'git push'],
        recall: [
          { type: 'choice', q: 'Your push is rejected with "fetch first". What should you do?', options: ['git push --force', 'git pull, then git push', 'Delete the repo and re-clone', 'Wait an hour'], answer: 1, why: 'Integrate the remote work first. Forcing would destroy your teammates\' commits.' },
          { type: 'choice', q: 'Why does Git reject the push?', options: ['GitHub is down', 'The remote has commits you do not have locally', 'Your commit message is bad', 'You forgot git add'], answer: 1, why: 'Pushing would discard those commits, so Git refuses.' },
        ],
      },
      {
        id: 'gh-pr', title: 'Your first pull request', skill: 'Pull requests', xp: 45, diff: 2, kind: 'terminal',
        read: `
# The pull request workflow

Professional teams rarely push straight to \`main\`. Instead:

1. Branch off \`main\`.
2. Commit your change on the branch.
3. Push the branch to GitHub.
4. Open a **pull request (PR)**: a proposal to merge your branch, where teammates review and discuss it.
5. Merge the PR, then update your local \`main\`.

The GitHub CLI, \`gh\`, does steps 4-5 from the terminal:

~~~bash
git switch -c add-footer
echo "<footer>Made with Git</footer>" > footer.html
git add footer.html
git commit -m "Add footer"
git push -u origin add-footer
gh pr create --title "Add footer" --body "Adds a site footer"
gh pr merge --merge
git switch main
git pull                      # download the merged result
~~~

> [!tip] Key idea
> A PR is not a Git feature. It is a GitHub feature layered on top of branches, giving you review, discussion and CI before code reaches \`main\`.
`,
        task: 'In `~/web-app` (cloned from your GitHub repo): create branch `add-footer`, commit `footer.html`, push the branch, open a PR titled `Add footer`, merge it, then update local `main`.',
        intro: 'You are on main in ~/web-app, a clone of your repo. gh is logged in.',
        setup(m) {
          base(m);
          m.seedRemote(U('web-app'), [{ msg: 'Add homepage', files: { 'index.html': '<h1>Web app</h1>\n' } }]);
          m.cwd = H;
          m.run([`git clone ${U('web-app')}`, 'cd web-app']);
        },
        checks: [
          { label: 'Branch add-footer was pushed to GitHub', test: (m) => m.cmds.some((c) => /^git push.*add-footer/.test(c.line) && c.ok) },
          { label: 'A pull request was opened and merged', test: (m) => m.remote(U('web-app')).prs.some((p) => p.state === 'MERGED' && p.head === 'add-footer') },
          { label: 'You are back on main', test: (m) => m.git(H + '/web-app').head.ref === 'main' },
          { label: 'Local main now has footer.html', test: (m) => 'footer.html' in tree(m, H + '/web-app', 'main') },
        ],
        hints: ['`git switch -c add-footer`, then create, add and commit `footer.html`.', '`git push -u origin add-footer`', '`gh pr create --title "Add footer" --body "Adds a site footer"` then `gh pr merge --merge`.', 'Finish with `git switch main` and `git pull`.'],
        solution: ['git switch -c add-footer', 'echo "<footer>Made with Git</footer>" > footer.html', 'git add footer.html', 'git commit -m "Add footer"', 'git push -u origin add-footer', 'gh pr create --title "Add footer" --body "Adds a site footer"', 'gh pr merge --merge', 'git switch main', 'git pull'],
        recall: [
          { type: 'choice', q: 'What is a pull request?', options: ['A command that downloads commits', 'A proposal to merge a branch, with review and discussion', 'A kind of branch', 'A backup'], answer: 1, why: 'PRs are a GitHub feature: ask for your branch to be merged, and let others review it.' },
          { type: 'type', q: 'After the PR is merged on GitHub, which command updates your local main? (full command, run on main)', accept: ['git pull'], why: 'The merge happened on GitHub, so pull to download it.' },
        ],
      },
      {
        id: 'gh-issues', title: 'Issues that close themselves', skill: 'Pull requests', xp: 40, diff: 2, kind: 'terminal',
        read: `
# Issues

An **issue** is a tracked task, bug report or idea. They have numbers (\`#1\`, \`#2\`...) that share a counter with pull requests.

~~~bash
gh issue create --title "Fix typo in README" --body "README says Teh"
gh issue list
~~~

## Closing keywords

Put a keyword and the issue number in your PR description, and GitHub **closes the issue automatically when the PR is merged**:

~~~
Closes #1      Fixes #1      Resolves #1
~~~

~~~bash
gh pr create --title "Fix typo" --body "Closes #1"
~~~

This links the work to the reason for it and keeps the issue list tidy without anyone remembering to close tickets.

> [!tip] Key idea
> Good PRs link to an issue. Anyone reading the issue later can follow it to the exact change that fixed it.
`,
        task: 'The README in `~/docs` says "Teh docs". File an issue about it, fix it on a branch `fix-typo`, open a PR whose body **closes the issue**, merge it and pull `main`.',
        intro: 'You are on main in ~/docs.',
        setup(m) {
          base(m);
          m.seedRemote(U('docs'), [{ msg: 'Add README', files: { 'README.md': 'Teh docs\n' } }]);
          m.cwd = H;
          m.run([`git clone ${U('docs')}`, 'cd docs']);
        },
        checks: [
          { label: 'Issue #1 exists', test: (m) => m.remote(U('docs')).issues.some((i) => i.number === 1) },
          { label: 'A PR body contains a closing keyword for #1', test: (m) => m.remote(U('docs')).prs.some((p) => /\b(close[sd]?|fix(e[sd])?|resolve[sd]?)\s+#1\b/i.test(p.body)) },
          { label: 'The PR is merged and issue #1 closed itself', test: (m) => { const r = m.remote(U('docs')); const i = r.issues.find((x) => x.number === 1); return !!i && i.state === 'CLOSED' && !!i.closedBy; } },
          { label: 'Local main has the fixed README', test: (m) => { const t = tree(m, H + '/docs', 'main'); return typeof t['README.md'] === 'string' && !/Teh/.test(t['README.md']); } },
        ],
        hints: ['`gh issue create --title "..." --body "..."` gives you issue #1.', 'Fix on a branch: `echo "The docs" > README.md`, commit, push `-u origin fix-typo`.', 'PR body: `--body "Closes #1"`, then `gh pr merge --merge`, `git switch main`, `git pull`.'],
        solution: ['gh issue create --title "Fix typo in README" --body "README says Teh instead of The"', 'git switch -c fix-typo', 'echo "The docs" > README.md', 'git commit -am "Fix typo in README"', 'git push -u origin fix-typo', 'gh pr create --title "Fix typo" --body "Closes #1"', 'gh pr merge --merge', 'git switch main', 'git pull'],
        recall: [
          { type: 'choice', q: 'Which PR description closes issue #7 when merged?', options: ['See #7', 'Related to 7', 'Closes #7', 'issue 7'], answer: 2, why: 'Keywords like Closes, Fixes and Resolves followed by #number trigger auto-closing.' },
          { type: 'choice', q: 'Issue and PR numbers...', options: ['Have separate counters', 'Share one counter in a repo', 'Are random', 'Reset daily'], answer: 1, why: 'The first issue is #1, the next PR is #2, and so on.' },
        ],
      },
      {
        id: 'gh-fork', title: 'Fork & contribute', skill: 'Collaboration', xp: 50, diff: 3, kind: 'terminal',
        read: `
# Contributing to someone else's project

You cannot push to a repo you do not own. The open-source workflow is: **fork** it (your own copy on GitHub), clone *your fork*, change it, and propose the change back with a PR.

~~~bash
gh repo fork octocat/hello-world --clone   # fork on GitHub + clone locally
cd hello-world
git remote -v
~~~

You end up with two remotes:

- \`origin\` -> **your fork** (you can push here)
- \`upstream\` -> the **original** project (read-only for you)

Work on a branch, push it to \`origin\`, then open a PR. Meanwhile the original keeps moving, so sync your \`main\`:

~~~bash
git fetch upstream            # get the original's new commits
git switch main
git merge upstream/main       # bring them into your main
~~~

> [!tip] Key idea
> Keep \`main\` in your fork a clean mirror of \`upstream/main\` and do all your own work on branches.
`,
        task: 'Fork `octocat/hello-world` and clone it. Make a branch `fix-readme`, fix the typo ("Helo"), commit and push it to **your fork**. Then fetch `upstream` and merge `upstream/main` into your `main`.',
        intro: 'Run: gh repo fork octocat/hello-world --clone',
        setup(m) {
          base(m);
          m.seedRemote('https://github.com/octocat/hello-world', [{ msg: 'Initial commit', files: { 'README.md': '# Hello World\nHelo there\n' } }]);
          m.hook((x) => x.ran(/^git push/), (x) => x.remoteCommit('https://github.com/octocat/hello-world', 'main', { 'CONTRIBUTING.md': 'Be kind\n' }, 'Add contributing guide', { name: 'Octocat', email: 'octo@example.com' }), '🔔 The original octocat/hello-world just got a new commit on main...');
          m.cwd = H;
        },
        checks: [
          { label: 'Forked octocat/hello-world to your account', test: (m) => !!m.remote(U('hello-world')) },
          { label: 'Clone has origin = your fork and upstream = octocat', test: (m) => { const r = m.git(H + '/hello-world'); return !!r && /collinkirklandtamu/.test(r.remotes.origin || '') && /octocat/.test(r.remotes.upstream || ''); } },
          { label: 'Branch fix-readme is on your fork', test: (m) => { const f = m.remote(U('hello-world')); return !!f && !!f.branches['fix-readme']; } },
          { label: 'Your main includes the original\'s new CONTRIBUTING.md', test: (m) => 'CONTRIBUTING.md' in tree(m, H + '/hello-world', 'main') },
        ],
        hints: ['`gh repo fork octocat/hello-world --clone` then `cd hello-world`.', 'Branch, `echo "Hello there" > README.md`, `git commit -am "..."`, `git push -u origin fix-readme`.', 'Then `git switch main`, `git fetch upstream`, `git merge upstream/main`.'],
        solution: ['gh repo fork octocat/hello-world --clone', 'cd hello-world', 'git remote -v', 'git switch -c fix-readme', 'echo "Hello there" > README.md', 'git commit -am "Fix typo in README"', 'git push -u origin fix-readme', 'git switch main', 'git fetch upstream', 'git merge upstream/main'],
        recall: [
          { type: 'choice', q: 'In a fork workflow, what does `upstream` usually point to?', options: ['Your fork', 'The original project', 'Your local folder', 'GitHub Pages'], answer: 1, why: '`origin` is your fork; `upstream` is the original repo you forked from.' },
          { type: 'choice', q: 'Why fork instead of cloning the original directly?', options: ['It is faster', 'You may not have permission to push to the original', 'Clones cannot be edited', 'Forks are private'], answer: 1, why: 'A fork is a copy you own, so you can push to it and open a PR back.' },
        ],
      },
      {
        id: 'gh-actions', title: 'Automate tests with Actions', skill: 'Automation', xp: 55, diff: 3, kind: 'file',
        lang: 'yaml', file: '.github/workflows/ci.yml',
        read: `
# Continuous integration

**GitHub Actions** runs commands for you on GitHub's servers whenever something happens, e.g. running your tests on every push and PR so broken code is caught before merging.

A workflow is a YAML file in \`.github/workflows/\`:

~~~yaml
name: CI                      # shown in the Actions tab

on: [push, pull_request]      # triggers

jobs:
  build:                      # a job id (you choose it)
    runs-on: ubuntu-latest    # the machine
    steps:
      - uses: actions/checkout@v4     # reuse a ready-made step
      - run: echo "hello"             # or run a shell command
~~~

- **\`on\`** says *when* to run.
- **\`jobs\`** are independent groups of steps. Each gets a fresh machine.
- **\`steps\`** run in order: \`uses:\` pulls a reusable action; \`run:\` runs a command.
- \`actions/setup-python@v5\` installs Python; configure it with \`with:\`.

~~~yaml
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
~~~

> [!warn] YAML is picky
> Indent with **spaces** (2 per level), never tabs. A single wrong indent changes the meaning or breaks the file.
`,
        task: 'Write the workflow: name it `CI`, trigger on `push` and `pull_request`, one job called `test` on `ubuntu-latest` that checks out the code (`actions/checkout@v4`), sets up Python 3.12 (`actions/setup-python@v5`), installs pytest (`pip install pytest`) and runs `pytest`. Use single-line `run:` commands.',
        starter: '# .github/workflows/ci.yml\nname: \n\non:\n\njobs:\n',
        checks: [
          { label: 'File is valid YAML', test: (t, c) => !!c.yaml && !c.error },
          { label: 'Workflow is named CI', test: (t, c) => !!c.yaml && c.yaml.name === 'CI' },
          { label: 'Triggers on push and pull_request', test: (t, c) => { const o = c.yaml && c.yaml.on; const keys = Array.isArray(o) ? o : o && typeof o === 'object' ? Object.keys(o) : typeof o === 'string' ? [o] : []; return keys.includes('push') && keys.includes('pull_request'); } },
          { label: 'Job "test" runs on ubuntu-latest', test: (t, c) => !!(c.yaml && c.yaml.jobs && c.yaml.jobs.test && c.yaml.jobs.test['runs-on'] === 'ubuntu-latest') },
          { label: 'Checks out the code with actions/checkout@v4', test: (t, c) => (c.steps || []).some((s) => s && s.uses === 'actions/checkout@v4') },
          { label: 'Sets up Python 3.12 with actions/setup-python@v5', test: (t, c) => (c.steps || []).some((s) => s && /^actions\/setup-python@v5/.test(s.uses || '') && s.with && /3\.12/.test(String(s.with['python-version']))) },
          { label: 'Installs pytest with pip', test: (t, c) => (c.steps || []).some((s) => s && /pip install.*pytest/.test(s.run || '')) },
          { label: 'Runs pytest', test: (t, c) => (c.steps || []).some((s) => s && /^(python -m )?pytest\b/.test((s.run || '').trim())) },
        ],
        hints: ['`on: [push, pull_request]` is the shortest trigger syntax.', 'Steps are a list under `steps:`. Each starts with `- uses:` or `- run:`.', '`with:` is indented under its `uses:` line, and `python-version: "3.12"` goes inside it.'],
        solution: CI,
        recall: [
          { type: 'choice', q: 'In a workflow, what does `on:` define?', options: ['The operating system', 'The events that trigger the workflow', 'The job name', 'The Python version'], answer: 1, why: '`on` lists triggers such as push, pull_request or a schedule.' },
          { type: 'choice', q: 'What does `uses: actions/checkout@v4` do?', options: ['Runs your tests', 'Clones your repository onto the runner so later steps can use it', 'Deploys the site', 'Checks the syntax'], answer: 1, why: 'A fresh runner is empty. Checkout downloads your code first.' },
        ],
      },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
