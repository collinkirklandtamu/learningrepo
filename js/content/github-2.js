(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  const H = '/home/learner';
  const ME = 'collinkirklandtamu';
  const U = (n) => `https://github.com/${ME}/${n}`;
  const base = (m) => { m.configureIdentity(); m.globalConfig['init.defaultbranch'] = 'main'; };
  const TEAM = { name: 'Taylor', email: 'taylor@example.com' };
  const d = (title, task, intro, setup, checks, solution, hints) => ({ title, task, intro, setup, checks, solution, hints: hints || ['Re-read the lesson; each step is one command.'] });
  const f = (title, task, starter, checks, solution, hints) => ({ title, task, starter, checks, solution, hints: hints || ['Follow the structure shown in the reading.'] });
  // a cloned repo with a branch pushed and PR #1 open
  const withPr = (name, extra) => (m) => {
    base(m);
    m.seedRemote(U(name), [{ msg: 'Start', files: { 'a.txt': '1\n' } }]);
    m.cwd = H;
    m.run([`git clone ${U(name)}`, 'cd ' + name, 'git switch -c topic', 'echo t > t.txt', 'git add t.txt', 'git commit -m "Add t"', 'git push -u origin topic', 'gh pr create --title "Add t" --body "Adds t"']);
    if (extra) extra(m);
  };

  LP.addDrills({
    'gh-remote': [
      d('Wire up a new repo', 'The local repo `~/notes` has a commit. Add `origin` pointing at your empty GitHub repo `notes` and push `main` with upstream tracking.', 'An empty GitHub repo exists, and your local repo has a commit.',
        (m) => { base(m); m.seedRemote(U('notes'), []); m.seedRepo('notes', [{ msg: 'Start notes', files: { 'n.md': '# notes\n' } }]); m.cwd = H + '/notes'; },
        [{ label: 'origin is set', test: (m) => (m.git(H + '/notes').remotes.origin || '').includes('notes') }, { label: 'GitHub main matches local main', test: (m) => { const r = m.remote(U('notes')); return !!r.branches.main && r.branches.main === m.git(H + '/notes').branches.main; } }, { label: 'Upstream is set (-u)', test: (m) => !!m.git(H + '/notes').upstream.main }],
        [`git remote add origin ${U('notes')}`, 'git push -u origin main']),
      d('Fix a wrong URL', 'The remote `origin` points to a typo\'d URL. Correct it with `git remote set-url` to the right repo, then `git remote -v` to confirm.', 'origin currently has a wrong URL.',
        (m) => { base(m); m.seedRemote(U('site'), [{ msg: 'Start', files: { a: '1\n' } }]); m.seedRepo('site', [{ msg: 'Local', files: { a: '1\n' } }]); m.cwd = H + '/site'; m.run([`git remote add origin ${U('sitee')}`]); },
        [{ label: 'origin URL is correct', test: (m) => (m.git(H + '/site').remotes.origin || '').endsWith('/site') }, { label: 'Ran git remote -v', test: (m) => m.ran(/^git remote -v/) }],
        [`git remote set-url origin ${U('site')}`, 'git remote -v']),
    ],
    'gh-clone': [
      d('Clone into a folder name', 'Clone `starter-kit` into a folder called `kit` (`git clone <url> kit`) and show the log.', 'You are in your home folder.',
        (m) => { base(m); m.seedRemote(U('starter-kit'), [{ msg: 'Init kit', files: { 'kit.txt': '1\n' } }]); m.cwd = H; },
        [{ label: 'Folder kit exists as a repo', test: (m) => !!m.git(H + '/kit') }, { label: 'Viewed the log', test: (m) => m.ran(/^git log/) }],
        [`git clone ${U('starter-kit')} kit`, 'cd kit', 'git log --oneline']),
      d('Fetch vs pull', 'A teammate pushed. First `git fetch` and look at `git log origin/main --oneline`, then `git pull` to bring it in.', 'origin has one new commit.',
        (m) => { base(m); m.seedRemote(U('club'), [{ msg: 'Start', files: { 'a.txt': '1\n' } }]); m.cwd = H; m.run([`git clone ${U('club')}`, 'cd club']); m.remoteCommit(U('club'), 'main', { 'b.txt': '2\n' }, 'Teammate adds b', TEAM); },
        [{ label: 'Fetched first', test: (m) => m.ran(/^git fetch/) }, { label: 'Looked at origin/main', test: (m) => m.ran(/^git log origin\/main/) }, { label: 'b.txt arrived (pull)', test: (m) => m.read(H + '/club/b.txt') !== null }],
        ['git fetch', 'git log origin/main --oneline', 'git pull']),
    ],
    'gh-rejected': [
      d('Pull before pushing', 'Your push would be rejected because the remote moved. Pull first, then push, and confirm with `git status`.', 'origin has a commit you do not have.',
        (m) => { base(m); m.seedRemote(U('shared'), [{ msg: 'Start', files: { 'a.txt': '1\n' } }]); m.cwd = H; m.run([`git clone ${U('shared')}`, 'cd shared']); m.remoteCommit(U('shared'), 'main', { 't.txt': 't\n' }, 'Teammate change', TEAM); m.write(H + '/shared/me.txt', 'm\n'); m.run(['git add me.txt', 'git commit -m "My change"']); },
        [{ label: 'GitHub main == local main', test: (m) => m.remote(U('shared')).branches.main === m.git(H + '/shared').branches.main }, { label: 'Both changes present', test: (m) => m.read(H + '/shared/t.txt') !== null && m.read(H + '/shared/me.txt') !== null }, { label: 'Ran git status', test: (m) => m.ran(/^git status/) }],
        ['git pull', 'git push', 'git status']),
      d('Ahead and behind', 'Run `git fetch`, then `git status` and read whether you are ahead/behind. Then `git pull` so you are no longer behind.', 'origin is one commit ahead of you.',
        (m) => { base(m); m.seedRemote(U('ab'), [{ msg: 'Start', files: { 'a.txt': '1\n' } }]); m.cwd = H; m.run([`git clone ${U('ab')}`, 'cd ab']); m.remoteCommit(U('ab'), 'main', { 'b.txt': '2\n' }, 'Remote moves', TEAM); },
        [{ label: 'Fetched and checked status', test: (m) => m.ran(/^git fetch/) && m.ran(/^git status/) }, { label: 'Pulled: up to date', test: (m) => m.read(H + '/ab/b.txt') !== null }],
        ['git fetch', 'git status', 'git pull']),
    ],
    'gh-pr': [
      d('List and view', 'List the open PRs, then view PR #1.', 'PR #1 is open.',
        withPr('lv'), [{ label: 'Listed PRs', test: (m) => m.ran(/^gh pr list/) }, { label: 'Viewed PR 1', test: (m) => m.ran(/^gh pr view/) }], ['gh pr list', 'gh pr view 1']),
      d('Rebase merge', 'Merge PR #1 with a **rebase** merge, then pull main.', 'PR #1 is open.',
        withPr('rb'), [{ label: 'PR merged', test: (m) => m.remote(U('rb')).prs[0].state === 'MERGED' }, { label: 'Used --rebase', test: (m) => m.ran(/^gh pr merge.*--rebase/) }, { label: 'Local main has t.txt', test: (m) => m.read(H + '/rb/t.txt') !== null }],
        ['gh pr merge 1 --rebase', 'git switch main', 'git pull']),
    ],
    'gh-review': [
      d('Request changes', 'Review Taylor\'s PR and **request changes** with the message `Please add tests`. Do not merge.', 'PR #1 by Taylor is open.',
        (m) => { withPr('rv', (mm) => { mm.remote(U('rv')).prs[0].author = 'taylor'; })(m); },
        [{ label: 'Requested changes with a body', test: (m) => (m.remote(U('rv')).prs[0].reviews || []).some((r) => r.state === 'CHANGES_REQUESTED' && /tests/i.test(r.body)) }, { label: 'Not merged', test: (m) => m.remote(U('rv')).prs[0].state === 'OPEN' }],
        ['gh pr review 1 --request-changes --body "Please add tests"']),
      d('Comment, then close', 'Comment `Superseded by #2` on the PR and then close it.', 'PR #1 is stale.',
        withPr('cl'), [{ label: 'Commented', test: (m) => (m.remote(U('cl')).prs[0].comments || []).some((c) => /Superseded/.test(c.body)) }, { label: 'PR closed', test: (m) => m.remote(U('cl')).prs[0].state === 'CLOSED' }],
        ['gh pr comment 1 --body "Superseded by #2"', 'gh pr close 1']),
    ],
    'gh-issues': [
      d('File an issue', 'Create an issue titled `Add dark mode` and list the open issues.', 'You are in a cloned repo.',
        (m) => { base(m); m.seedRemote(U('ui'), [{ msg: 'Start', files: { 'a': '1\n' } }]); m.cwd = H; m.run([`git clone ${U('ui')}`, 'cd ui']); },
        [{ label: 'Issue created', test: (m) => m.remote(U('ui')).issues.some((i) => /dark mode/i.test(i.title)) }, { label: 'Listed issues', test: (m) => m.ran(/^gh issue list/) }],
        ['gh issue create --title "Add dark mode" --body "Users want it"', 'gh issue list']),
      d('Close an issue', 'Close issue #1 from the terminal.', 'Issue #1 is open.',
        (m) => { base(m); m.seedRemote(U('ui2'), [{ msg: 'Start', files: { 'a': '1\n' } }]); m.cwd = H; m.run([`git clone ${U('ui2')}`, 'cd ui2', 'gh issue create --title "Old bug" --body "fixed already"']); },
        [{ label: 'Issue 1 closed', test: (m) => m.remote(U('ui2')).issues.some((i) => i.number === 1 && i.state === 'CLOSED') }],
        ['gh issue close 1']),
    ],
    'gh-protect': [
      d('Read the rejection', 'Try pushing a commit made on `main` to the protected remote; the push must fail. Then run `git status` to see you are ahead of `origin/main`.', 'main is protected on GitHub.',
        (m) => { base(m); m.seedRemote(U('pr'), [{ msg: 'Start', files: { 'a': '1\n' } }]); m.protectBranch(U('pr'), 'main', { approvals: 1 }); m.cwd = H; m.run([`git clone ${U('pr')}`, 'cd pr', 'echo x > x.txt', 'git add x.txt', 'git commit -m "Direct"']); },
        [{ label: 'Push was rejected', test: (m) => m.cmds.some((c) => /^git push/.test(c.line) && !c.ok) }, { label: 'Ran git status', test: (m) => m.ran(/^git status/) }],
        ['git push', 'git status']),
      d('Open the PR properly', 'Push your branch `feature` and open a PR titled `Add feature` against the protected main.', 'The commit is on branch feature already.',
        (m) => { base(m); m.seedRemote(U('pr2'), [{ msg: 'Start', files: { 'a': '1\n' } }]); m.protectBranch(U('pr2'), 'main', { approvals: 1 }); m.cwd = H; m.run([`git clone ${U('pr2')}`, 'cd pr2', 'git switch -c feature', 'echo f > f.txt', 'git add f.txt', 'git commit -m "Feature"']); },
        [{ label: 'feature is on GitHub', test: (m) => !!m.remote(U('pr2')).branches.feature }, { label: 'PR open', test: (m) => m.remote(U('pr2')).prs.some((p) => p.title === 'Add feature' && p.state === 'OPEN') }],
        ['git push -u origin feature', 'gh pr create --title "Add feature" --body "New feature"']),
    ],
    'gh-pr-conflict': [
      d('Spot the conflict', 'Try `gh pr merge` on the conflicting PR and read the error; do not fix it yet. Then fetch and run `git merge origin/main` to see the markers in `title.txt`.', 'PR #1 conflicts with main.',
        (m) => { base(m); m.seedRemote(U('cf'), [{ msg: 'Start', files: { 'title.txt': 'Hello\n' } }]); m.cwd = H; m.run([`git clone ${U('cf')}`, 'cd cf', 'git switch -c topic', 'echo mine > title.txt', 'git commit -am "Mine"', 'git push -u origin topic', 'gh pr create --title "Mine" --body "x"']); m.remoteCommit(U('cf'), 'main', { 'title.txt': 'theirs\n' }, 'Theirs', TEAM); },
        [{ label: 'Tried to merge and failed', test: (m) => m.cmds.some((c) => /^gh pr merge/.test(c.line) && !c.ok) }, { label: 'title.txt contains markers', test: (m) => /^<{7}/m.test(m.read(H + '/cf/title.txt') || '') }],
        ['gh pr merge 1', 'git fetch', 'git merge origin/main']),
      d('Abort and rethink', 'Start the conflicting merge from `origin/main`, then abort it with `git merge --abort`.', 'The same situation.',
        (m) => { base(m); m.seedRemote(U('cf2'), [{ msg: 'Start', files: { 'title.txt': 'Hello\n' } }]); m.cwd = H; m.run([`git clone ${U('cf2')}`, 'cd cf2', 'git switch -c topic', 'echo mine > title.txt', 'git commit -am "Mine"', 'git push -u origin topic']); m.remoteCommit(U('cf2'), 'main', { 'title.txt': 'theirs\n' }, 'Theirs', TEAM); },
        [{ label: 'Merged then aborted', test: (m) => m.cmds.some((c) => /^git merge origin\/main/.test(c.line)) && m.ran(/^git merge --abort/) }, { label: 'title.txt is mine again', test: (m) => m.read(H + '/cf2/title.txt') === 'mine\n' }],
        ['git fetch', 'git merge origin/main', 'git merge --abort']),
    ],
    'gh-fork': [
      d('Fork without cloning', 'Fork `ada/tiny` but do **not** clone; confirm it exists with `gh repo view <you>/tiny`.', 'No local copy yet.',
        (m) => { base(m); m.seedRemote('https://github.com/ada/tiny', [{ msg: 'Start', files: { a: '1\n' } }]); m.cwd = H; },
        [{ label: 'Fork exists', test: (m) => !!m.remote(U('tiny')) }, { label: 'Viewed it', test: (m) => m.ran(/^gh repo view/) }],
        ['gh repo fork ada/tiny', `gh repo view ${ME}/tiny`]),
      d('Fork and clone', 'Fork `ada/tiny` and clone your fork in one command. Show `git remote -v`.', 'Home folder.',
        (m) => { base(m); m.seedRemote('https://github.com/ada/tiny', [{ msg: 'Start', files: { a: '1\n' } }]); m.cwd = H; },
        [{ label: 'Cloned fork', test: (m) => !!m.git(H + '/tiny') }, { label: 'Showed remotes', test: (m) => m.ran(/^git remote -v/) }],
        ['gh repo fork ada/tiny --clone', 'cd tiny', 'git remote -v']),
    ],
    'gh-release': [
      d('Release list', 'Create a release `v0.1.0` titled `Preview` with notes, then list releases.', 'A cloned repo.',
        (m) => { base(m); m.seedRemote(U('rl'), [{ msg: 'Start', files: { a: '1\n' } }]); m.cwd = H; m.run([`git clone ${U('rl')}`, 'cd rl']); },
        [{ label: 'Release v0.1.0 exists', test: (m) => (m.remote(U('rl')).releases || []).some((r) => r.tag === 'v0.1.0' && r.title === 'Preview') }, { label: 'Listed releases', test: (m) => m.ran(/^gh release list/) }],
        ['gh release create v0.1.0 --title "Preview" --notes "Early preview"', 'gh release list']),
      d('Generated notes', 'Publish release `v2.0.0` with `--generate-notes` and the title `Big release`.', 'A cloned repo.',
        (m) => { base(m); m.seedRemote(U('rl2'), [{ msg: 'Start', files: { a: '1\n' } }]); m.cwd = H; m.run([`git clone ${U('rl2')}`, 'cd rl2']); },
        [{ label: 'Release v2.0.0 titled Big release', test: (m) => (m.remote(U('rl2')).releases || []).some((r) => r.tag === 'v2.0.0' && r.title === 'Big release') }],
        ['gh release create v2.0.0 --title "Big release" --generate-notes']),
    ],
    'gh-actions': [
      f('Lint workflow', 'Write a workflow `Lint` triggered on `pull_request` with one job `lint` on `ubuntu-latest` that checks out the code and runs `echo lint`.', '# .github/workflows/ci.yml\nname: \n',
        [{ label: 'Valid, named Lint', test: (t, c) => !!c.yaml && !c.error && c.yaml.name === 'Lint' }, { label: 'Triggers on pull_request', test: (t, c) => { const o = c.yaml && c.yaml.on; const k = Array.isArray(o) ? o : o && typeof o === 'object' ? Object.keys(o) : [o]; return k.includes('pull_request'); } }, { label: 'Job lint on ubuntu-latest', test: (t, c) => !!(c.yaml && c.yaml.jobs && c.yaml.jobs.lint && c.yaml.jobs.lint['runs-on'] === 'ubuntu-latest') }, { label: 'Checks out and runs echo lint', test: (t, c) => (c.steps || []).some((s) => s && s.uses === 'actions/checkout@v4') && (c.steps || []).some((s) => s && /echo lint/.test(s.run || '')) }],
        'name: Lint\n\non: pull_request\n\njobs:\n  lint:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: echo lint\n'),
      f('Scheduled job', 'Write a workflow `Nightly` that runs on a `schedule` with cron `0 3 * * *` (3am daily) and on manual `workflow_dispatch`. One job `report` on `ubuntu-latest` running `echo report`.', '# .github/workflows/ci.yml\nname: \n',
        [{ label: 'Valid, named Nightly', test: (t, c) => !!c.yaml && !c.error && c.yaml.name === 'Nightly' }, { label: 'Has schedule cron 0 3 * * *', test: (t, c) => { const o = c.yaml && c.yaml.on; return !!(o && o.schedule && JSON.stringify(o.schedule).includes('0 3 * * *')); } }, { label: 'Has workflow_dispatch', test: (t, c) => !!(c.yaml && c.yaml.on && typeof c.yaml.on === 'object' && 'workflow_dispatch' in c.yaml.on) }, { label: 'Job report runs echo report', test: (t, c) => !!(c.yaml && c.yaml.jobs && c.yaml.jobs.report) && (c.steps || []).some((s) => s && /echo report/.test(s.run || '')) }],
        'name: Nightly\n\non:\n  schedule:\n    - cron: "0 3 * * *"\n  workflow_dispatch:\n\njobs:\n  report:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo report\n'),
    ],
    'gh-matrix': [
      f('Node matrix', 'Write a workflow `Node CI` on `push` with job `test` using a matrix of `node-version` `[18, 20]` on `ubuntu-latest`, checking out the code and running `npm test`.', '# .github/workflows/matrix.yml\nname: \n',
        [{ label: 'Valid, named Node CI', test: (t, c) => !!c.yaml && !c.error && c.yaml.name === 'Node CI' }, { label: 'Matrix node-version has 18 and 20', test: (t, c) => { const j = c.yaml && c.yaml.jobs && c.yaml.jobs.test; const v = j && j.strategy && j.strategy.matrix && (j.strategy.matrix['node-version'] || []).map(String); return !!v && v.includes('18') && v.includes('20'); } }, { label: 'Runs npm test', test: (t, c) => (c.steps || []).some((s) => s && /npm test/.test(s.run || '')) }],
        'name: Node CI\n\non: push\n\njobs:\n  test:\n    runs-on: ubuntu-latest\n    strategy:\n      matrix:\n        node-version: [18, 20]\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm test\n'),
      f('Use a secret', 'Write workflow `Deploy` on `push` with job `deploy` on `ubuntu-latest` with a step that runs `./deploy.sh` and receives `TOKEN` from `secrets.DEPLOY_TOKEN` (never typed in).', '# .github/workflows/deploy.yml\nname: \n',
        [{ label: 'Valid, named Deploy', test: (t, c) => !!c.yaml && !c.error && c.yaml.name === 'Deploy' }, { label: 'TOKEN comes from secrets.DEPLOY_TOKEN', test: (t, c) => (c.steps || []).some((s) => s && s.env && /\$\{\{\s*secrets\.DEPLOY_TOKEN\s*\}\}/.test(String(s.env.TOKEN))) }, { label: 'Runs ./deploy.sh', test: (t, c) => (c.steps || []).some((s) => s && /deploy\.sh/.test(s.run || '')) }],
        'name: Deploy\n\non: push\n\njobs:\n  deploy:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: ./deploy.sh\n        env:\n          TOKEN: ${{ secrets.DEPLOY_TOKEN }}\n'),
    ],
    'gh-dependabot': [
      f('npm updates', 'Configure Dependabot (`version: 2`) to update `npm` in `/` daily.', 'version: \nupdates:\n',
        [{ label: 'Valid, version 2', test: (t, c) => !!c.yaml && !c.error && Number(c.yaml.version) === 2 }, { label: 'npm / daily', test: (t, c) => !!c.yaml && (c.yaml.updates || []).some((u) => u && u['package-ecosystem'] === 'npm' && u.directory === '/' && u.schedule && u.schedule.interval === 'daily') }],
        'version: 2\nupdates:\n  - package-ecosystem: npm\n    directory: "/"\n    schedule:\n      interval: daily\n'),
      f('Docker updates', 'Configure Dependabot to update `docker` base images in `/` weekly and `pip` in `/api` monthly.', 'version: \nupdates:\n',
        [{ label: 'Valid, version 2', test: (t, c) => !!c.yaml && !c.error && Number(c.yaml.version) === 2 }, { label: 'docker / weekly', test: (t, c) => !!c.yaml && (c.yaml.updates || []).some((u) => u && u['package-ecosystem'] === 'docker' && u.directory === '/' && u.schedule && u.schedule.interval === 'weekly') }, { label: 'pip in /api monthly', test: (t, c) => !!c.yaml && (c.yaml.updates || []).some((u) => u && u['package-ecosystem'] === 'pip' && u.directory === '/api' && u.schedule && u.schedule.interval === 'monthly') }],
        'version: 2\nupdates:\n  - package-ecosystem: docker\n    directory: "/"\n    schedule:\n      interval: weekly\n  - package-ecosystem: pip\n    directory: "/api"\n    schedule:\n      interval: monthly\n'),
    ],
    'gh-codeowners': [
      f('Team ownership', 'Write CODEOWNERS: `@lead` owns everything (`*`); `/api/` is owned by `@backend-team`; `*.css` by `@design-team`.', '# CODEOWNERS\n',
        [{ label: '* is @lead', test: (t) => /^\*\s+@lead\s*$/m.test(t) }, { label: '/api/ is @backend-team', test: (t) => /^\/api\/\s+@backend-team\s*$/m.test(t) }, { label: '*.css is @design-team', test: (t) => /^\*\.css\s+@design-team\s*$/m.test(t) }],
        '* @lead\n/api/ @backend-team\n*.css @design-team\n'),
      f('Shared ownership', 'Write CODEOWNERS where `/infra/` is owned by both `@ops` and `@sre`, and a docs path `docs/*.md` is owned by `@writers`.', '# CODEOWNERS\n',
        [{ label: '/infra/ has @ops and @sre', test: (t) => /^\/infra\/\s+(@ops\s+@sre|@sre\s+@ops)\s*$/m.test(t) }, { label: 'docs/*.md owned by @writers', test: (t) => /^docs\/\*\.md\s+@writers\s*$/m.test(t) }],
        '/infra/ @ops @sre\ndocs/*.md @writers\n'),
    ],
  });

  LP.addRecall({
    'gh-remote': [
      { type: 'choice', q: 'What is `origin`?', options: ['The conventional name of your main remote', 'A branch', 'A Git command', 'A tag'], answer: 0, why: 'Just a default nickname for a URL.' },
      { type: 'type', q: 'Which flag links your local branch to the remote one when pushing? (flag only)', accept: ['-u', '--set-upstream'], why: '`git push -u origin main`.' },
    ],
    'gh-clone': [
      { type: 'choice', q: 'What does `git clone` set up automatically?', options: ['The origin remote and a local main tracking it', 'Nothing', 'A new GitHub repo', 'A fork'], answer: 0, why: 'You get history, origin, and tracking.' },
      { type: 'choice', q: 'How does `git fetch` differ from `git pull`?', options: ['fetch only downloads; pull downloads and merges', 'They are identical', 'pull only downloads', 'fetch pushes'], answer: 0, why: 'pull = fetch + merge.' },
    ],
    'gh-rejected': [
      { type: 'choice', q: 'Why was `git push` rejected as "non-fast-forward"?', options: ['The remote has commits you do not have', 'Your commit message is bad', 'Wrong branch name', 'No internet'], answer: 0, why: 'You must integrate first.' },
      { type: 'choice', q: 'Why is `git push --force` risky on a shared branch?', options: ['It can erase teammates\' commits', 'It is slow', 'It needs a tag', 'It deletes your local repo'], answer: 0, why: 'It overwrites remote history.' },
    ],
    'gh-pr': [
      { type: 'choice', q: 'What should a PR description explain?', options: ['What changed and why', 'Only the file names', 'Nothing', 'Your commit hashes'], answer: 0, why: 'Reviewers need context.' },
      { type: 'type', q: 'Which command opens a PR from the terminal? (start of the command)', accept: ['gh pr create'], why: '`gh pr create --title ... --body ...`.' },
    ],
    'gh-issues': [
      { type: 'choice', q: 'Which word in a PR body closes issue 4 on merge?', options: ['Fixes #4', 'See 4', 'About issue 4', 'Issue four'], answer: 0, why: 'Closing keywords: closes, fixes, resolves.' },
      { type: 'type', q: 'Which command creates an issue? (start of the command)', accept: ['gh issue create'], why: '`gh issue create --title ...`.' },
    ],
    'gh-fork': [
      { type: 'choice', q: 'What is a fork?', options: ['Your own copy of someone else\'s repo on GitHub', 'A branch', 'A local clone', 'A tag'], answer: 0, why: 'A server-side copy you can write to.' },
      { type: 'choice', q: 'In a fork workflow, what is `upstream`?', options: ['The original project', 'Your fork', 'A branch', 'A tag'], answer: 0, why: 'By convention, `upstream` is the original repo.' },
    ],
    'gh-actions': [
      { type: 'choice', q: 'Where must workflow files live?', options: ['.github/workflows/', 'workflows/', '.git/', 'src/'], answer: 0, why: 'GitHub only looks there.' },
      { type: 'choice', q: 'What does `runs-on: ubuntu-latest` choose?', options: ['The virtual machine type for the job', 'The branch', 'The language', 'The trigger'], answer: 0, why: 'The runner image.' },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
