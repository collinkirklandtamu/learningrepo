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
  const DEPENDABOT = `version: 2
updates:
  - package-ecosystem: pip
    directory: "/"
    schedule:
      interval: weekly
  - package-ecosystem: github-actions
    directory: "/"
    schedule:
      interval: monthly
`;
  const CODEOWNERS = `# Default owner for everything
*           @${ME}

# Docs are owned by the docs team
/docs/      @docs-team

# Python files need a Python reviewer
*.py        @python-team @${ME}
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
        { type: 'choice', q: 'Which is the better review comment?', options: ['"This is bad."', '"This loops over the list twice; a dict would make it O(n). Want to try that?"', '"Fix it."', '"lol"'], answer: 1, why: 'Specific, constructive, explains why.' },
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
        { type: 'choice', q: 'Besides reviews, what else can block a merge?', options: ['Required status checks (CI) failing', 'The commit count', 'The author\'s name', 'The time of day'], answer: 0, why: 'Passing CI is commonly required.' },
      ],
    },
    {
      id: 'gh-release', title: 'Publishing a release', skill: 'Automation', xp: 40, diff: 2, kind: 'terminal',
      read: `
# Releases package a version

A **release** is a tag plus a page on GitHub with notes and downloadable files. Users read it to learn what changed.

~~~bash
git tag -a v1.2.0 -m "Version 1.2.0"
git push origin v1.2.0
gh release create v1.2.0 --title "Version 1.2.0" --notes "Adds search, fixes two bugs"
gh release list
~~~

Use \`--generate-notes\` to let GitHub write the notes from merged PRs. Releases follow **semantic versioning**: bump MAJOR for breaking changes, MINOR for new features, PATCH for fixes.

> [!tip] Key idea
> Tag the commit, push the tag, then announce it with a release. Anyone can reproduce exactly that version later.
`,
      task: 'Tag the latest commit `v1.0.0` (annotated, message `First stable release`), push the tag, and publish a GitHub release for it with the title `Version 1.0.0` and some notes.',
      intro: 'You are in ~/toolkit on main, up to date with GitHub.',
      setup(m) {
        base(m);
        m.seedRemote(U('toolkit'), [{ msg: 'Add toolkit', files: { 'tool.py': '# tool\n' } }, { msg: 'Add docs', files: { 'README.md': '# toolkit\n' } }]);
        m.cwd = H;
        m.run([`git clone ${U('toolkit')}`, 'cd toolkit']);
      },
      checks: [
        { label: 'Annotated tag v1.0.0 exists locally', test: (m) => { const r = m.git(H + '/toolkit'); return !!r.tags['v1.0.0'] && !!r.tagMeta['v1.0.0']; } },
        { label: 'Tag was pushed to GitHub', test: (m) => { const rem = m.remote(U('toolkit')); return !!(rem.tags && rem.tags['v1.0.0']); } },
        { label: 'A release for v1.0.0 exists', test: (m) => (m.remote(U('toolkit')).releases || []).some((r) => r.tag === 'v1.0.0') },
        { label: 'Release is titled "Version 1.0.0" and has notes', test: (m) => (m.remote(U('toolkit')).releases || []).some((r) => r.title === 'Version 1.0.0' && r.notes.trim().length > 3) },
      ],
      hints: ['`git tag -a v1.0.0 -m "First stable release"`', '`git push origin v1.0.0`', '`gh release create v1.0.0 --title "Version 1.0.0" --notes "First stable release"`'],
      solution: ['git tag -a v1.0.0 -m "First stable release"', 'git push origin v1.0.0', 'gh release create v1.0.0 --title "Version 1.0.0" --notes "First stable release with the core tools"', 'gh release list'],
      recall: [
        { type: 'choice', q: 'A GitHub release is built on top of what Git object?', options: ['A tag', 'A branch', 'A stash', 'A remote'], answer: 0, why: 'A release is a tag with notes and assets.' },
        { type: 'choice', q: 'You fix a bug without changing the API. Version 1.4.2 becomes...', options: ['1.4.3', '1.5.0', '2.0.0', '1.4.2.1'], answer: 0, why: 'Patch bump.' },
        { type: 'type', q: 'Which command publishes a release for tag v2.0.0? (start of the command)', accept: ['gh release create v2.0.0'], why: '`gh release create v2.0.0 --title ... --notes ...`.' },
        { type: 'choice', q: 'What does `--generate-notes` do?', options: ['Auto-writes notes from merged PRs', 'Generates a tag', 'Signs the commit', 'Uploads binaries'], answer: 0, why: 'GitHub assembles the changelog.' },
      ],
    },
    {
      id: 'gh-pr-conflict', title: 'Fixing a PR that conflicts', skill: 'Pull requests', xp: 55, diff: 3, kind: 'terminal',
      read: `
# "This branch has conflicts that must be resolved"

While your PR waited for review, someone changed the **same lines** on \`main\`. GitHub cannot merge it automatically. You fix it **locally**, in your branch, then push:

~~~bash
git fetch origin
git switch my-branch
git merge origin/main        # conflict! edit the files, remove the markers
git add file.txt
git commit                   # finish the merge commit
git push                     # the PR updates automatically
gh pr merge --merge
~~~

Merging \`main\` into your branch (rather than the other way round) keeps the fix inside the PR so reviewers can see it.

> [!tip] Key idea
> You never resolve conflicts on GitHub's side of a PR from the terminal: bring \`main\` into **your branch**, resolve, push.
`,
      task: 'Your PR `update-title` conflicts with `main` on `title.txt`. Merge `origin/main` into your branch, resolve the conflict so `title.txt` contains `Hello from both`, push, and merge the PR.',
      intro: 'You are on update-title in ~/landing. PR #1 is open but cannot be merged.',
      setup(m) {
        base(m);
        m.seedRemote(U('landing'), [{ msg: 'Start', files: { 'title.txt': 'Hello\n' } }]);
        m.cwd = H;
        m.run([`git clone ${U('landing')}`, 'cd landing', 'git switch -c update-title', 'echo "Hello from me" > title.txt', 'git commit -am "Update title"', 'git push -u origin update-title', 'gh pr create --title "Update title" --body "New title"']);
        m.remoteCommit(U('landing'), 'main', { 'title.txt': 'Hello from the team\n' }, 'Team title', TEAM);
      },
      checks: [
        { label: 'The PR is merged', test: (m) => m.remote(U('landing')).prs.some((p) => p.state === 'MERGED') },
        { label: 'main has the resolved title.txt', test: (m) => { const rem = m.remote(U('landing')); return m.objects.get(rem.branches.main).tree['title.txt'] === 'Hello from both\n'; } },
        { label: 'No conflict markers on main', test: (m) => !/^(<{7}|={7}|>{7})/m.test(m.objects.get(m.remote(U('landing')).branches.main).tree['title.txt'] || '') },
        { label: 'You merged origin/main into your branch', test: (m) => m.cmds.some((c) => /^git merge origin\/main/.test(c.line)) },
      ],
      hints: ['`git fetch`, then `git merge origin/main` on your branch: Git reports a conflict.', 'Overwrite the file: `echo "Hello from both" > title.txt`, `git add title.txt`, `git commit -m "Merge main"`.', '`git push`, then `gh pr merge --merge`.'],
      solution: ['git fetch', 'git merge origin/main', 'echo "Hello from both" > title.txt', 'git add title.txt', 'git commit -m "Merge main into update-title"', 'git push', 'gh pr merge --merge'],
      recall: [
        { type: 'choice', q: 'To fix a conflicting PR you should...', options: ['Merge main into your branch, resolve, push', 'Delete main', 'Force-push main', 'Close and forget it'], answer: 0, why: 'The resolution lives in your PR branch.' },
        { type: 'choice', q: 'After you push the fix, the PR...', options: ['Updates automatically', 'Must be recreated', 'Is deleted', 'Needs a new title'], answer: 0, why: 'A PR tracks its branch.' },
        { type: 'choice', q: 'Why does a conflict happen?', options: ['Two branches changed the same lines differently', 'Too many commits', 'A typo in the branch name', 'GitHub is down'], answer: 0, why: 'Git cannot choose between competing edits.' },
        { type: 'type', q: 'Which command downloads remote changes without merging them? (full command)', accept: ['git fetch'], why: '`git fetch` updates origin/* only.' },
      ],
    },
    {
      id: 'gh-codeowners', title: 'CODEOWNERS: automatic reviewers', skill: 'Automation', xp: 35, diff: 2, kind: 'file',
      lang: 'text', file: '.github/CODEOWNERS',
      read: `
# Who must review what?

A **CODEOWNERS** file maps paths to the people or teams who must be asked to review changes. When a PR touches those paths, GitHub requests their review automatically (and with branch protection it can *require* it).

~~~
# .github/CODEOWNERS
*            @alice                 # default owner
/docs/       @docs-team             # a folder
*.js         @frontend-team @bob    # a file pattern, several owners
~~~

- Patterns work like \`.gitignore\`.
- **Later lines win**, so put specific rules after general ones.
- Owners are \`@user\` or \`@org/team\`.

> [!tip] Key idea
> CODEOWNERS turns "someone should look at this" into "the right person is asked automatically".
`,
      task: `Write a CODEOWNERS file: \`@${ME}\` owns everything by default (\`*\`), \`@docs-team\` owns the \`/docs/\` folder, and Python files (\`*.py\`) are owned by both \`@python-team\` and \`@${ME}\`.`,
      starter: '# .github/CODEOWNERS\n',
      checks: [
        { label: 'Default owner for * is you', test: (t) => new RegExp('^\\*\\s+@' + ME + '\\s*$', 'm').test(t) },
        { label: '/docs/ is owned by @docs-team', test: (t) => /^\/docs\/\s+@docs-team\s*$/m.test(t) },
        { label: '*.py owned by @python-team and you', test: (t) => new RegExp('^\\*\\.py\\s+(@python-team\\s+@' + ME + '|@' + ME + '\\s+@python-team)\\s*$', 'm').test(t) },
        { label: 'Default rule comes first (later lines win)', test: (t) => { const lines = t.split('\n').filter((l) => l.trim() && !l.trim().startsWith('#')); return /^\*\s/.test(lines[0] || ''); } },
      ],
      hints: ['One rule per line: `pattern  @owner [@owner...]`.', 'Put `*` first, then the specific rules.'],
      solution: CODEOWNERS,
      recall: [
        { type: 'choice', q: 'In CODEOWNERS, which rule wins when several match?', options: ['The last matching line', 'The first matching line', 'All of them are ignored', 'The longest'], answer: 0, why: 'Order matters: specific rules go last.' },
        { type: 'choice', q: 'Where does the file live?', options: ['.github/CODEOWNERS', 'src/owners.txt', 'README.md', '.git/CODEOWNERS'], answer: 0, why: 'Also allowed: repo root or docs/.' },
        { type: 'choice', q: 'What does CODEOWNERS do on a PR?', options: ['Automatically requests review from the owners of changed files', 'Blocks all pushes', 'Runs tests', 'Closes the PR'], answer: 0, why: 'It routes review requests.' },
        { type: 'type', q: 'How do you refer to a team called "docs" in organisation "acme"? (owner syntax)', accept: ['@acme/docs'], why: '`@org/team`.' },
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
        { type: 'choice', q: 'How do you read the current matrix value of `os`?', options: ['${{ matrix.os }}', '$os', '{{os}}', 'env.os'], answer: 0, why: 'Expressions use `${{ ... }}`.' },
      ],
    },
    {
      id: 'gh-dependabot', title: 'Dependabot: automatic updates', skill: 'Automation', xp: 35, diff: 2, kind: 'file',
      lang: 'yaml', file: '.github/dependabot.yml',
      read: `
# Keep dependencies fresh and safe

Old libraries have known security holes. **Dependabot** opens PRs that bump your dependencies, so updates arrive as small reviewable changes (and your CI tests them).

~~~yaml
version: 2
updates:
  - package-ecosystem: pip          # python packages
    directory: "/"                  # where requirements.txt lives
    schedule:
      interval: weekly              # daily, weekly or monthly
~~~

Common ecosystems: \`pip\`, \`npm\`, \`docker\`, \`github-actions\`, \`gomod\`, \`cargo\`. Add one entry per ecosystem.

> [!tip] Key idea
> Updating weekly in small steps is far easier than one terrifying jump after two years.
`,
      task: 'Configure Dependabot (`version: 2`) to update `pip` packages in `/` weekly, and the versions of your `github-actions` in `/` monthly.',
      starter: '# .github/dependabot.yml\nversion: \nupdates:\n',
      checks: [
        { label: 'Valid YAML with version 2', test: (t, c) => !!c.yaml && !c.error && Number(c.yaml.version) === 2 },
        { label: 'Has an updates list', test: (t, c) => !!c.yaml && Array.isArray(c.yaml.updates) && c.yaml.updates.length >= 2 },
        { label: 'pip: directory "/", weekly', test: (t, c) => !!c.yaml && (c.yaml.updates || []).some((u) => u && u['package-ecosystem'] === 'pip' && u.directory === '/' && u.schedule && u.schedule.interval === 'weekly') },
        { label: 'github-actions: directory "/", monthly', test: (t, c) => !!c.yaml && (c.yaml.updates || []).some((u) => u && u['package-ecosystem'] === 'github-actions' && u.directory === '/' && u.schedule && u.schedule.interval === 'monthly') },
      ],
      hints: ['Each entry starts with `- package-ecosystem:` and has `directory` and `schedule.interval`.', 'Two entries: one for `pip` (weekly) and one for `github-actions` (monthly). Quote the directory: `directory: "/"`.'],
      solution: DEPENDABOT,
      recall: [
        { type: 'choice', q: 'What does Dependabot create?', options: ['Pull requests that bump dependencies', 'New repositories', 'Issues about typos', 'Releases'], answer: 0, why: 'One PR per update.' },
        { type: 'choice', q: 'Why update dependencies regularly?', options: ['Security fixes and smaller, easier upgrades', 'Only for new features', 'GitHub requires it', 'To change licence'], answer: 0, why: 'Small steps beat big jumps.' },
        { type: 'type', q: 'Which key names the kind of package manager (pip, npm...)? (key name)', accept: ['package-ecosystem'], why: '`package-ecosystem: pip`.' },
        { type: 'choice', q: 'Where does the Dependabot config live?', options: ['.github/dependabot.yml', 'dependabot.json at the root', '.git/config', 'requirements.txt'], answer: 0, why: 'In the .github folder.' },
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
        { type: 'choice', q: 'Why use a branch rather than main in your fork?', options: ['Keeps main clean to sync with upstream', 'Required by Git', 'Branches are faster', 'To hide commits'], answer: 0, why: 'Each contribution gets its own branch.' },
        { type: 'choice', q: 'Who decides if your PR is merged?', options: ['The project maintainers', 'GitHub automatically', 'You', 'The fork owner only'], answer: 0, why: 'They review and merge.' },
      ],
    },
  ]);
})(typeof window !== 'undefined' ? window : globalThis);
