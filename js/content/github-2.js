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
      
    ],
    'gh-clone': [
      d('Clone into a folder name', 'Clone `starter-kit` into a folder called `kit` (`git clone <url> kit`) and show the log.', 'You are in your home folder.',
        (m) => { base(m); m.seedRemote(U('starter-kit'), [{ msg: 'Init kit', files: { 'kit.txt': '1\n' } }]); m.cwd = H; },
        [{ label: 'Folder kit exists as a repo', test: (m) => !!m.git(H + '/kit') }, { label: 'Viewed the log', test: (m) => m.ran(/^git log/) }],
        [`git clone ${U('starter-kit')} kit`, 'cd kit', 'git log --oneline']),
      
    ],
    'gh-rejected': [
      d('Pull before pushing', 'Your push would be rejected because the remote moved. Pull first, then push, and confirm with `git status`.', 'origin has a commit you do not have.',
        (m) => { base(m); m.seedRemote(U('shared'), [{ msg: 'Start', files: { 'a.txt': '1\n' } }]); m.cwd = H; m.run([`git clone ${U('shared')}`, 'cd shared']); m.remoteCommit(U('shared'), 'main', { 't.txt': 't\n' }, 'Teammate change', TEAM); m.write(H + '/shared/me.txt', 'm\n'); m.run(['git add me.txt', 'git commit -m "My change"']); },
        [{ label: 'GitHub main == local main', test: (m) => m.remote(U('shared')).branches.main === m.git(H + '/shared').branches.main }, { label: 'Both changes present', test: (m) => m.read(H + '/shared/t.txt') !== null && m.read(H + '/shared/me.txt') !== null }, { label: 'Ran git status', test: (m) => m.ran(/^git status/) }],
        ['git pull', 'git push', 'git status']),
      
    ],
    'gh-pr': [
      d('List and view', 'List the open PRs, then view PR #1.', 'PR #1 is open.',
        withPr('lv'), [{ label: 'Listed PRs', test: (m) => m.ran(/^gh pr list/) }, { label: 'Viewed PR 1', test: (m) => m.ran(/^gh pr view/) }], ['gh pr list', 'gh pr view 1']),
      
    ],
    'gh-review': [
      d('Request changes', 'Review Taylor\'s PR and **request changes** with the message `Please add tests`. Do not merge.', 'PR #1 by Taylor is open.',
        (m) => { withPr('rv', (mm) => { mm.remote(U('rv')).prs[0].author = 'taylor'; })(m); },
        [{ label: 'Requested changes with a body', test: (m) => (m.remote(U('rv')).prs[0].reviews || []).some((r) => r.state === 'CHANGES_REQUESTED' && /tests/i.test(r.body)) }, { label: 'Not merged', test: (m) => m.remote(U('rv')).prs[0].state === 'OPEN' }],
        ['gh pr review 1 --request-changes --body "Please add tests"']),
      
    ],
    'gh-issues': [
      d('File an issue', 'Create an issue titled `Add dark mode` and list the open issues.', 'You are in a cloned repo.',
        (m) => { base(m); m.seedRemote(U('ui'), [{ msg: 'Start', files: { 'a': '1\n' } }]); m.cwd = H; m.run([`git clone ${U('ui')}`, 'cd ui']); },
        [{ label: 'Issue created', test: (m) => m.remote(U('ui')).issues.some((i) => /dark mode/i.test(i.title)) }, { label: 'Listed issues', test: (m) => m.ran(/^gh issue list/) }],
        ['gh issue create --title "Add dark mode" --body "Users want it"', 'gh issue list']),
      
    ],
    'gh-protect': [
      d('Read the rejection', 'Try pushing a commit made on `main` to the protected remote; the push must fail. Then run `git status` to see you are ahead of `origin/main`.', 'main is protected on GitHub.',
        (m) => { base(m); m.seedRemote(U('pr'), [{ msg: 'Start', files: { 'a': '1\n' } }]); m.protectBranch(U('pr'), 'main', { approvals: 1 }); m.cwd = H; m.run([`git clone ${U('pr')}`, 'cd pr', 'echo x > x.txt', 'git add x.txt', 'git commit -m "Direct"']); },
        [{ label: 'Push was rejected', test: (m) => m.cmds.some((c) => /^git push/.test(c.line) && !c.ok) }, { label: 'Ran git status', test: (m) => m.ran(/^git status/) }],
        ['git push', 'git status']),
      
    ],
    
    'gh-fork': [
      d('Fork without cloning', 'Fork `ada/tiny` but do **not** clone; confirm it exists with `gh repo view <you>/tiny`.', 'No local copy yet.',
        (m) => { base(m); m.seedRemote('https://github.com/ada/tiny', [{ msg: 'Start', files: { a: '1\n' } }]); m.cwd = H; },
        [{ label: 'Fork exists', test: (m) => !!m.remote(U('tiny')) }, { label: 'Viewed it', test: (m) => m.ran(/^gh repo view/) }],
        ['gh repo fork ada/tiny', `gh repo view ${ME}/tiny`]),
      
    ],
    
    'gh-actions': [
      f('Lint workflow', 'Write a workflow `Lint` triggered on `pull_request` with one job `lint` on `ubuntu-latest` that checks out the code and runs `echo lint`.', '# .github/workflows/ci.yml\nname: \n',
        [{ label: 'Valid, named Lint', test: (t, c) => !!c.yaml && !c.error && c.yaml.name === 'Lint' }, { label: 'Triggers on pull_request', test: (t, c) => { const o = c.yaml && c.yaml.on; const k = Array.isArray(o) ? o : o && typeof o === 'object' ? Object.keys(o) : [o]; return k.includes('pull_request'); } }, { label: 'Job lint on ubuntu-latest', test: (t, c) => !!(c.yaml && c.yaml.jobs && c.yaml.jobs.lint && c.yaml.jobs.lint['runs-on'] === 'ubuntu-latest') }, { label: 'Checks out and runs echo lint', test: (t, c) => (c.steps || []).some((s) => s && s.uses === 'actions/checkout@v4') && (c.steps || []).some((s) => s && /echo lint/.test(s.run || '')) }],
        'name: Lint\n\non: pull_request\n\njobs:\n  lint:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: echo lint\n'),
      
    ],
    'gh-matrix': [
      f('Node matrix', 'Write a workflow `Node CI` on `push` with job `test` using a matrix of `node-version` `[18, 20]` on `ubuntu-latest`, checking out the code and running `npm test`.', '# .github/workflows/matrix.yml\nname: \n',
        [{ label: 'Valid, named Node CI', test: (t, c) => !!c.yaml && !c.error && c.yaml.name === 'Node CI' }, { label: 'Matrix node-version has 18 and 20', test: (t, c) => { const j = c.yaml && c.yaml.jobs && c.yaml.jobs.test; const v = j && j.strategy && j.strategy.matrix && (j.strategy.matrix['node-version'] || []).map(String); return !!v && v.includes('18') && v.includes('20'); } }, { label: 'Runs npm test', test: (t, c) => (c.steps || []).some((s) => s && /npm test/.test(s.run || '')) }],
        'name: Node CI\n\non: push\n\njobs:\n  test:\n    runs-on: ubuntu-latest\n    strategy:\n      matrix:\n        node-version: [18, 20]\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm test\n'),
      
    ],

  });

  LP.addRecall({
    'gh-remote': [
      { type: 'choice', q: 'What is `origin`?', options: ['The conventional name of your main remote', 'A branch', 'A Git command', 'A tag'], answer: 0, why: 'Just a default nickname for a URL.' },
      
    ],
    'gh-clone': [
      { type: 'choice', q: 'What does `git clone` set up automatically?', options: ['The origin remote and a local main tracking it', 'Nothing', 'A new GitHub repo', 'A fork'], answer: 0, why: 'You get history, origin, and tracking.' },
      
    ],
    'gh-rejected': [
      { type: 'choice', q: 'Why was `git push` rejected as "non-fast-forward"?', options: ['The remote has commits you do not have', 'Your commit message is bad', 'Wrong branch name', 'No internet'], answer: 0, why: 'You must integrate first.' },
      
    ],
    'gh-pr': [
      { type: 'choice', q: 'What should a PR description explain?', options: ['What changed and why', 'Only the file names', 'Nothing', 'Your commit hashes'], answer: 0, why: 'Reviewers need context.' },
      
    ],
    'gh-issues': [
      { type: 'choice', q: 'Which word in a PR body closes issue 4 on merge?', options: ['Fixes #4', 'See 4', 'About issue 4', 'Issue four'], answer: 0, why: 'Closing keywords: closes, fixes, resolves.' },
      
    ],
    'gh-fork': [
      { type: 'choice', q: 'What is a fork?', options: ['Your own copy of someone else\'s repo on GitHub', 'A branch', 'A local clone', 'A tag'], answer: 0, why: 'A server-side copy you can write to.' },
      
    ],
    'gh-actions': [
      { type: 'choice', q: 'Where must workflow files live?', options: ['.github/workflows/', 'workflows/', '.git/', 'src/'], answer: 0, why: 'GitHub only looks there.' },
      
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
