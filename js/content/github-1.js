(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  const H = '/home/learner';
  const ME = 'collinkirklandtamu';
  const U = (n) => `https://github.com/${ME}/${n}`;
  const base = (m) => { m.configureIdentity(); m.globalConfig['init.defaultbranch'] = 'main'; };
  const TEAM = { name: 'Taylor', email: 'taylor@example.com' };
  const tree = (m, dir, br) => { const r = m.git(dir); const id = r && r.branches[br]; return id ? m.objects.get(id).tree : {}; };
  const trig = (o) => { const keys = Array.isArray(o) ? o : o && typeof o === 'object' ? Object.keys(o) : typeof o === 'string' ? [o] : []; return keys; };

  const MATRIX = `name: Test matrix

on: [push, pull_request]

jobs:
  test:
    runs-on: \${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest]
        python-version: ["3.11", "3.12"]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: \${{ matrix.python-version }}
          cache: pip
      - run: pip install -r requirements.txt
      - run: pytest
        env:
          API_KEY: \${{ secrets.API_KEY }}
`;
  const addPr = (m, url, pr) => { const rem = m.remote(url); const p = Object.assign({ number: rem.num++, body: '', state: 'OPEN', base: 'main', reviews: [], comments: [] }, pr); rem.prs.push(p); return p; };

  LP.addLessons('github', [
    {
      id: 'gh-review', title: 'Reviewing a pull request', skill: 'Pull requests', xp: 45, diff: 2, kind: 'terminal',
      read: `
# Code review is the point of a PR

When a teammate opens a PR you read the change, ask questions, and either **approve** or **request changes**. The CLI mirrors the web UI:

~~~bash
gh pr list                                   # open PRs
gh pr view 1                                 # title, description, reviews, comments
gh pr comment 1 --body "Could you add a test?"
gh pr review 1 --request-changes --body "Needs a test"
gh pr review 1 --approve --body "LGTM"       # "looks good to me"
gh pr merge 1 --squash                       # squash commits into one
~~~

**Good reviews** are specific, kind, and about the code, not the person. Say *why*. Distinguish blocking issues from nits.

| Merge style | Result |
|---|---|
| \`--merge\` | a merge commit, every commit kept |
| \`--squash\` | all commits squashed into one |
| \`--rebase\` | commits replayed, no merge commit |

> [!tip] Key idea
> Approving means "I would be comfortable shipping this". It is a signature, not a formality.
`,
      task: 'Taylor opened PR #1 in `team-app`. Read it with `gh pr view 1`, leave a comment asking for a docstring (`gh pr comment`), approve it with a review, then squash-merge it.',
      intro: 'You are in ~/team-app. Taylor wants to merge add-search into main.',
      setup(m) {
        base(m);
        m.seedRemote(U('team-app'), [{ msg: 'Initial app', files: { 'app.py': 'print("app")\n' } }]);
        m.remoteCommit(U('team-app'), 'add-search', { 'search.py': 'def search(q):\n    return q\n' }, 'Add search', TEAM);
        m.remoteBranchFrom(U('team-app'), 'add-search', 'add-search');
        m.cwd = H;
        m.run([`git clone ${U('team-app')}`, 'cd team-app']);
        addPr(m, U('team-app'), { title: 'Add search', body: 'Adds a simple search function.', head: 'add-search', author: 'taylor' });
      },
      checks: [
        { label: 'Read the PR (gh pr view)', test: (m) => m.ran(/^gh pr view/) },
        { label: 'Left a comment on the PR', test: (m) => (m.remote(U('team-app')).prs[0].comments || []).length >= 1 },
        { label: 'Approved the PR', test: (m) => (m.remote(U('team-app')).prs[0].reviews || []).some((r) => r.state === 'APPROVED' && r.author === m.ghUser) },
        { label: 'The PR is merged', test: (m) => m.remote(U('team-app')).prs[0].state === 'MERGED' },
        { label: 'Squash merged (a single non-merge commit on main)', test: (m) => { const rem = m.remote(U('team-app')); const c = m.objects.get(rem.branches.main); return c.parents.length === 1 && 'search.py' in c.tree; } },
      ],
      hints: ['`gh pr view 1` shows the details.', '`gh pr comment 1 --body "Please add a docstring"`', '`gh pr review 1 --approve --body "LGTM"`, then `gh pr merge 1 --squash`.'],
      solution: ['gh pr view 1', 'gh pr comment 1 --body "Please add a docstring"', 'gh pr review 1 --approve --body "LGTM"', 'gh pr merge 1 --squash'],
      recall: [
        { type: 'choice', q: 'Which review verdict blocks a merge on a protected branch?', options: ['Comment', 'Request changes', 'Approve', 'Reaction'], answer: 1, why: 'Requested changes must be resolved or re-reviewed.' },
        { type: 'choice', q: 'What does squash merging do?', options: ['Combines all PR commits into a single commit on the base branch', 'Deletes the branch', 'Rebases onto main', 'Keeps every commit'], answer: 0, why: 'It keeps main\'s history tidy.' },
        { type: 'type', q: 'Which flag approves a PR with `gh pr review`? (flag only)', accept: ['--approve', '-a'], why: '`gh pr review 1 --approve`.' },
        
      ],
    },
    {
      id: 'gh-protect', title: 'Protected branches', skill: 'Pull requests', xp: 45, diff: 3, kind: 'terminal',
      read: `
# Nobody pushes straight to main

Teams turn on **branch protection** for \`main\`: no direct pushes, changes must come through a PR, and a reviewer must approve it (plus passing CI checks). You set this in *Settings > Branches* on GitHub.

When you try anyway, GitHub refuses:

~~~
remote: error: GH006: Protected branch update failed for refs/heads/main.
 ! [remote rejected] main -> main (protected branch hook declined)
~~~

The fix is the normal workflow, not a workaround:

~~~bash
git switch -c fix-typo            # move your work to a branch
git push -u origin fix-typo
gh pr create --title "Fix typo" --body "..."
# a reviewer approves, then:  gh pr merge
~~~

If you already committed on \`main\` locally, branch from there and put \`main\` back with \`git switch main; git reset --hard origin/main\`.

> [!warn] Never force-push around it
> Protection exists so one tired late-night push cannot break everybody. Follow the process.
`,
      task: '`main` is protected. You committed `fix.txt` on local `main` and the push was rejected. Rescue the work: create branch `fix-typo` (from your current commit), push it, reset local `main` back to `origin/main`, and open a PR titled `Fix typo`. Try to merge it, read the error, and leave a comment asking for a review.',
      intro: 'You are on main in ~/docs-site with one unpushed commit. Try: git push',
      setup(m) {
        base(m);
        m.seedRemote(U('docs-site'), [{ msg: 'Start docs', files: { 'index.md': '# Docs\n' } }]);
        m.protectBranch(U('docs-site'), 'main', { approvals: 1 });
        m.cwd = H;
        m.run([`git clone ${U('docs-site')}`, 'cd docs-site', 'echo "typo fixed" > fix.txt', 'git add fix.txt', 'git commit -m "Fix typo"']);
      },
      checks: [
        { label: 'Direct push to main was rejected', test: (m) => m.cmds.some((c) => /^git push/.test(c.line) && !c.ok && !/fix-typo/.test(c.line)) },
        { label: 'Branch fix-typo is on GitHub with fix.txt', test: (m) => { const rem = m.remote(U('docs-site')); return !!rem.branches['fix-typo'] && 'fix.txt' in m.objects.get(rem.branches['fix-typo']).tree; } },
        { label: 'Local main is back at origin/main (no fix.txt)', test: (m) => { const r = m.git(H + '/docs-site'); return !('fix.txt' in m.objects.get(r.branches.main).tree); } },
        { label: 'PR "Fix typo" is open', test: (m) => m.remote(U('docs-site')).prs.some((p) => p.title === 'Fix typo' && p.state === 'OPEN') },
        { label: 'The merge was blocked (needs approval)', test: (m) => m.cmds.some((c) => /^gh pr merge/.test(c.line) && !c.ok) },
        { label: 'Commented asking for review', test: (m) => (m.remote(U('docs-site')).prs[0].comments || []).length >= 1 },
      ],
      hints: ['`git push` fails with GH006: that is expected.', '`git switch -c fix-typo`, `git push -u origin fix-typo`, `git switch main`, `git reset --hard origin/main`.', '`git switch fix-typo`, `gh pr create --title "Fix typo" --body "Fixes a typo"`, try `gh pr merge`, then `gh pr comment --body "Ready for review"`.'],
      solution: ['git push', 'git switch -c fix-typo', 'git push -u origin fix-typo', 'git switch main', 'git reset --hard origin/main', 'git switch fix-typo', 'gh pr create --title "Fix typo" --body "Fixes a typo"', 'gh pr merge', 'gh pr comment --body "Ready for review"'],
      recall: [
        { type: 'choice', q: 'What does branch protection typically require?', options: ['Changes through a reviewed pull request', 'Only that commits are signed', 'A tag for each commit', 'Nothing'], answer: 0, why: 'No direct pushes; PR plus approvals plus checks.' },
        { type: 'choice', q: 'Your push to a protected main is rejected. What should you do?', options: ['git push --force', 'Move the work to a branch and open a PR', 'Delete the remote', 'Disable protection'], answer: 1, why: 'Use the process.' },
        { type: 'choice', q: 'Where do you configure branch protection?', options: ['In .gitignore', 'GitHub repo Settings > Branches', 'git config', 'A tag'], answer: 1, why: 'It is a GitHub setting, not a Git feature.' },
        
      ],
    },

    {
      id: 'gh-matrix', title: 'Actions: matrix, cache & secrets', skill: 'Automation', xp: 55, diff: 3, kind: 'file',
      lang: 'yaml', file: '.github/workflows/matrix.yml',
      read: `
# Test on many setups at once

A **matrix** runs the same job for every combination of values: great for several Python versions and operating systems.

~~~yaml
jobs:
  test:
    runs-on: \${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest]
        python-version: ["3.11", "3.12"]    # 2 x 2 = 4 jobs
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: \${{ matrix.python-version }}
          cache: pip                        # reuse downloaded packages between runs
      - run: pytest
        env:
          API_KEY: \${{ secrets.API_KEY }}   # a secret stored in repo settings
~~~

- \`\${{ ... }}\` is an **expression**. \`matrix.x\` reads the current combination.
- **Secrets** (Settings > Secrets) are never written in the file. Reference them as \`secrets.NAME\`.
- \`cache: pip\` makes later runs faster.

> [!warn] Never commit a secret
> Anything in the YAML is public to everyone with read access. Put API keys in Secrets.
`,
      task: 'Write a workflow `Test matrix` (triggers: `push` and `pull_request`) with a job `test` that runs on `${{ matrix.os }}` for `ubuntu-latest` and `windows-latest` and Python `3.11` and `3.12`; checks out the code, sets up Python with the matrix version and `cache: pip`, installs `requirements.txt`, and runs `pytest` with the env var `API_KEY` taken from `secrets.API_KEY`.',
      starter: '# .github/workflows/matrix.yml\nname: \n\non:\n\njobs:\n',
      checks: [
        { label: 'Valid YAML named "Test matrix"', test: (t, c) => !!c.yaml && !c.error && c.yaml.name === 'Test matrix' },
        { label: 'Triggers on push and pull_request', test: (t, c) => { const k = trig(c.yaml && c.yaml.on); return k.includes('push') && k.includes('pull_request'); } },
        { label: 'Matrix of two operating systems', test: (t, c) => { const mt = c.yaml && c.yaml.jobs && c.yaml.jobs.test && c.yaml.jobs.test.strategy && c.yaml.jobs.test.strategy.matrix; return !!mt && Array.isArray(mt.os) && mt.os.includes('ubuntu-latest') && mt.os.includes('windows-latest'); } },
        { label: 'Matrix of Python 3.11 and 3.12', test: (t, c) => { const mt = c.yaml && c.yaml.jobs && c.yaml.jobs.test && c.yaml.jobs.test.strategy && c.yaml.jobs.test.strategy.matrix; const v = mt && (mt['python-version'] || []).map(String); return !!v && v.includes('3.11') && v.includes('3.12'); } },
        { label: 'runs-on uses the matrix os', test: (t, c) => /\$\{\{\s*matrix\.os\s*\}\}/.test(String(c.yaml && c.yaml.jobs && c.yaml.jobs.test && c.yaml.jobs.test['runs-on'])) },
        { label: 'setup-python uses matrix version and pip cache', test: (t, c) => (c.steps || []).some((s) => s && /^actions\/setup-python@v5/.test(s.uses || '') && s.with && /matrix\.python-version/.test(String(s.with['python-version'])) && s.with.cache === 'pip') },
        { label: 'Installs requirements and runs pytest', test: (t, c) => (c.steps || []).some((s) => /pip install.*requirements\.txt/.test((s && s.run) || '')) && (c.steps || []).some((s) => /^pytest/.test(((s && s.run) || '').trim())) },
        { label: 'API_KEY comes from secrets, not typed in', test: (t, c) => (c.steps || []).some((s) => s && s.env && /\$\{\{\s*secrets\.API_KEY\s*\}\}/.test(String(s.env.API_KEY))) },
      ],
      hints: ['`strategy:` then `matrix:` with `os:` and `python-version:` lists, all under the `test` job.', '`runs-on: ${{ matrix.os }}`', '`env:` goes inside the `pytest` step with `API_KEY: ${{ secrets.API_KEY }}`.'],
      solution: MATRIX,
      recall: [
        { type: 'choice', q: 'A matrix of 3 OSes and 2 Python versions creates how many jobs?', options: ['5', '6', '3', '2'], answer: 1, why: 'The Cartesian product: 3 x 2.' },
        { type: 'choice', q: 'Where should an API key for CI live?', options: ['In the workflow file', 'In repository Secrets, referenced as secrets.NAME', 'In README.md', 'In the commit message'], answer: 1, why: 'Workflow files are readable by anyone with repo access.' },
        { type: 'choice', q: 'What does `cache: pip` do?', options: ['Speeds up later runs by reusing downloaded packages', 'Installs pip', 'Deletes caches', 'Locks the version'], answer: 0, why: 'It restores the pip cache between runs.' },
        
      ],
    },
    
    {
      id: 'gh-capstone', title: 'Capstone: ship a contribution', skill: 'Projects', xp: 160, diff: 3, kind: 'terminal', capstone: true,
      read: `
# The full open-source cycle

You found a bug in someone else's project. Do everything a real contributor does:

1. **Fork** \`ada/mathlib\` so you own a copy, and **clone** your fork.
2. Create a **branch** \`fix-square\`.
3. Fix \`square.py\` so it returns \`n * n\` (it returns \`n + n\`), and **commit**.
4. **Push** the branch to your fork.
5. Open a **pull request** to the original project with a clear title and a body that says \`Fixes #1\`.
6. A maintainer asks for a change: leave a comment on the PR saying it is ready.

> [!tip] You are the contributor
> Forks let anyone propose changes to projects they cannot push to. The maintainers decide whether to merge.
`,
      task: 'Fork `ada/mathlib`, clone your fork, branch `fix-square`, fix `square.py` to return `n * n`, commit, push, open a PR titled `Fix square()` whose body contains `Fixes #1`, and comment `Ready for review` on it.',
      intro: 'You are in your home folder. Upstream: https://github.com/ada/mathlib. Start with: gh repo fork ada/mathlib --clone',
      setup(m) {
        base(m);
        m.seedRemote('https://github.com/ada/mathlib', [{ msg: 'Add square', files: { 'square.py': 'def square(n):\n    return n + n\n' } }]);
        m.remote('https://github.com/ada/mathlib').issues.push({ number: 1, title: 'square(3) returns 6', body: 'Should be 9', state: 'OPEN', author: 'ada' });
        m.remote('https://github.com/ada/mathlib').num = 2;
        m.cwd = H;
      },
      checks: [
        { label: 'You forked and cloned (mathlib folder exists)', test: (m) => !!m.git(H + '/mathlib') },
        { label: 'Fix pushed to your fork on branch fix-square', test: (m) => { const rem = m.remote(U('mathlib')); return !!rem && !!rem.branches['fix-square'] && /n \* n/.test(m.objects.get(rem.branches['fix-square']).tree['square.py'] || ''); } },
        { label: 'The fix is NOT on the original main', test: (m) => !/n \* n/.test(m.objects.get(m.remote('https://github.com/ada/mathlib').branches.main).tree['square.py'] || '') },
        { label: 'PR opened on ada/mathlib titled "Fix square()"', test: (m) => m.remote('https://github.com/ada/mathlib').prs.some((p) => p.title === 'Fix square()') },
        { label: 'PR body says Fixes #1', test: (m) => m.remote('https://github.com/ada/mathlib').prs.some((p) => /Fixes #1/i.test(p.body || '')) },
        { label: 'Left the "Ready for review" comment', test: (m) => m.remote('https://github.com/ada/mathlib').prs.some((p) => (p.comments || []).some((c) => /Ready for review/.test(c.body))) },
      ],
      hints: ['`gh repo fork ada/mathlib --clone` then `cd mathlib`.', 'Branch, `echo` the corrected function into square.py (`printf` may not be available: use two `echo` lines with `>` then `>>`), commit, `git push -u origin fix-square`.', '`gh pr create --repo ada/mathlib --title "Fix square()" --body "Fixes #1"` then `gh pr comment --body "Ready for review"`.'],
      solution: ['gh repo fork ada/mathlib --clone', 'cd mathlib', 'git switch -c fix-square', 'echo "def square(n):" > square.py', 'echo "    return n * n" >> square.py', 'git add square.py', 'git commit -m "Fix square()"', 'git push -u origin fix-square', 'gh pr create --title "Fix square()" --body "Fixes #1"', 'gh pr comment --body "Ready for review"'],
      recall: [
        { type: 'choice', q: 'Why fork a project instead of cloning it directly?', options: ['You cannot push to the original, but you can to your fork', 'Forks are faster', 'Clones delete history', 'Forks are private'], answer: 0, why: 'A fork is your own writable copy.' },
        { type: 'choice', q: 'What does "Fixes #1" in a PR body do?', options: ['Closes issue 1 when the PR merges', 'Tags version 1', 'Reverts a commit', 'Nothing'], answer: 0, why: 'Closing keywords link and auto-close.' },
        { type: 'choice', q: 'Where should you push your contribution?', options: ['A branch on your fork', 'main of the original project', 'A tag', 'Nowhere'], answer: 0, why: 'Then open a PR from it.' },

      ],
    },
  ]);
})(typeof window !== 'undefined' ? window : globalThis);
