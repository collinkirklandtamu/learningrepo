(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  const H = '/home/learner';
  const ME = 'collinkirklandtamu';
  const U = (n) => `https://github.com/${ME}/${n}`;
  const base = (m) => { m.configureIdentity(); m.globalConfig['init.defaultbranch'] = 'main'; };
  const clean = (m, dir) => { const s = m.gitStatus(dir); return !!s && !s.staged.length && !s.unstaged.length && !s.untracked.length && !s.unmerged.length; };
  const SAM = { name: 'Sam', email: 'sam@example.com' };
  const AVA = { name: 'Ava', email: 'ava@example.com' };

  LP.addLessons('git', [
    {
      id: 'git-log-filters', title: 'Searching history', skill: 'History', xp: 35, diff: 2, kind: 'terminal',
      read: `
# Ask history questions

Real projects have thousands of commits. \`git log\` can filter them.

~~~bash
git log --oneline --author=Sam        # commits by one person
git log --oneline --grep=fix          # commit messages containing "fix"
git log --oneline -- app.py           # commits that touched a file
git log -p -1                         # the last commit with its full patch
git log --stat                        # which files changed, and how much
git log -3 --oneline                  # only the latest three
git shortlog -sn                      # commits per author, most active first
~~~

Because the sandbox terminal supports redirection you can save an answer: \`git log --oneline --author=Sam > sam.txt\`.

> [!tip] Key idea
> History is a database. \`--author\`, \`--grep\` and a path filter are the WHERE clauses; \`-p\` shows the details.
`,
      task: 'Save the one-line log of the commits **by Sam** to `sam.txt`, save the commits whose message mentions `fix` to `fixes.txt`, and run `git shortlog -sn` to see who contributed most.',
      intro: 'You are in ~/project with 6 commits from two authors.',
      setup(m) {
        base(m);
        m.seedRepo('project', [
          { msg: 'Add app skeleton', files: { 'app.py': 'print("hi")\n' }, author: AVA },
          { msg: 'Add login page', files: { 'login.py': '# login\n' }, author: SAM },
          { msg: 'Fix typo in app', files: { 'app.py': 'print("hello")\n' }, author: AVA },
          { msg: 'Add search', files: { 'search.py': '# search\n' }, author: SAM },
          { msg: 'Fix crash on empty search', files: { 'search.py': '# search v2\n' }, author: AVA },
          { msg: 'Add docs', files: { 'README.md': '# Docs\n' }, author: AVA },
        ]);
        m.cwd = H + '/project';
      },
      checks: [
        { label: 'sam.txt lists exactly Sam\'s 2 commits', test: (m) => { const t = (m.read(H + '/project/sam.txt') || '').trim().split('\n').filter(Boolean); return t.length === 2 && t.every((l) => /login|search/i.test(l)) && !t.some((l) => /crash/.test(l)); } },
        { label: 'fixes.txt lists exactly the 2 "fix" commits', test: (m) => { const t = (m.read(H + '/project/fixes.txt') || '').trim().split('\n').filter(Boolean); return t.length === 2 && t.every((l) => /fix/i.test(l)); } },
        { label: 'Used --author', test: (m) => m.ran(/git log.*--author/) },
        { label: 'Used --grep', test: (m) => m.ran(/git log.*--grep/) },
        { label: 'Ran git shortlog', test: (m) => m.ran(/^git shortlog/) },
      ],
      hints: ['`git log --oneline --author=Sam > sam.txt`', '`git log --oneline --grep=Fix > fixes.txt` (grep is case-sensitive unless you add `-i`).', '`git shortlog -sn` prints commits per author.'],
      solution: ['git log --oneline --author=Sam > sam.txt', 'git log --oneline --grep=Fix > fixes.txt', 'git shortlog -sn'],
      recall: [
        { type: 'type', q: 'Which log flag shows the full patch for each commit? (flag only)', accept: ['-p', '--patch'], why: '`git log -p` appends the diff of every commit.' },
        { type: 'choice', q: 'How do you list only commits that touched `app.py`?', options: ['git log app.py', 'git log -- app.py', 'git file app.py', 'git log --file app.py'], answer: 1, why: 'Everything after `--` is a path filter.' },
        { type: 'choice', q: 'What does `git shortlog -sn` show?', options: ['Short hashes', 'A commit count per author, sorted', 'The newest commits', 'Branch names'], answer: 1, why: '-s summarises, -n sorts by number.' },
        { type: 'choice', q: 'What does `git log --grep=crash` search?', options: ['File contents', 'Commit messages', 'Author names', 'Branch names'], answer: 1, why: '--grep matches the message text.' },
      ],
    },
    {
      id: 'git-reflog', title: 'Recovering lost commits with reflog', skill: 'History', xp: 45, diff: 3, kind: 'terminal',
      read: `
# Git almost never loses anything

\`git reset --hard\` moves your branch backwards and throws away working changes. The commits are no longer on any branch, so \`git log\` cannot see them, but Git still remembers them for a while.

\`git reflog\` is a diary of **every place HEAD has been**:

~~~bash
git reflog
# 3f2a1bc HEAD@{0}: reset: moving to HEAD~2
# 9d8e7f6 HEAD@{1}: commit: Add payment code
# 1a2b3c4 HEAD@{2}: commit: Add cart
~~~

Find the commit you lost and point your branch back at it:

~~~bash
git reset --hard HEAD@{1}      # or the hash: git reset --hard 9d8e7f6
~~~

> [!warn] It is local and temporary
> The reflog lives only on your machine and expires after a few months. Recover quickly, and commit often so there is something to recover.
`,
      task: 'You ran `git reset --hard HEAD~2` by mistake and lost two commits. Use `git reflog` to find where you were, and restore the branch so all 3 commits and the files `cart.py` and `pay.py` are back.',
      intro: 'You are in ~/shop. The last two commits seem to be gone.',
      setup(m) {
        base(m);
        m.seedRepo('shop', [
          { msg: 'Add catalog', files: { 'catalog.py': '# catalog\n' } },
          { msg: 'Add cart', files: { 'cart.py': '# cart\n' } },
          { msg: 'Add payments', files: { 'pay.py': '# pay\n' } },
        ]);
        m.cwd = H + '/shop';
        m.run(['git reset --hard HEAD~2']);
      },
      checks: [
        { label: 'Looked at the reflog', test: (m) => m.ran(/^git reflog/) },
        { label: 'All 3 commits are back on the branch', test: (m) => m.gitLog(H + '/shop').length === 3 },
        { label: 'cart.py and pay.py exist again', test: (m) => m.read(H + '/shop/cart.py') !== null && m.read(H + '/shop/pay.py') !== null },
        { label: 'Working tree is clean', test: (m) => clean(m, H + '/shop') },
      ],
      hints: ['`git log --oneline` shows only one commit. Run `git reflog` instead.', 'Find the entry just before the reset, e.g. `HEAD@{1}`.', '`git reset --hard HEAD@{1}`'],
      solution: ['git log --oneline', 'git reflog', 'git reset --hard HEAD@{1}'],
      recall: [
        { type: 'choice', q: 'What does `git reflog` record?', options: ['Only pushed commits', 'Every position HEAD has moved to locally', 'Remote branches', 'Staged files'], answer: 1, why: 'It is a local journal of HEAD movements.' },
        { type: 'choice', q: 'After a mistaken `git reset --hard`, what is the best first step?', options: ['Re-clone the repo', 'Run git reflog to find the lost commit', 'Delete .git', 'Rewrite the files by hand'], answer: 1, why: 'The commits still exist; reflog tells you their hashes.' },
        { type: 'choice', q: 'Does the reflog travel when you push?', options: ['Yes, to GitHub', 'No, it is local only', 'Only for tags', 'Only on main'], answer: 1, why: 'It lives in your local .git folder.' },
        { type: 'type', q: 'Write the expression for "where HEAD was one move ago". (e.g. HEAD@...)', accept: ['HEAD@{1}'], why: '`HEAD@{1}`.' },
      ],
    },
    {
      id: 'git-cherry-pick', title: 'Cherry-pick one commit', skill: 'History', xp: 40, diff: 3, kind: 'terminal',
      read: `
# Take just one commit

Sometimes a branch has one commit you need now (a bug fix) but other commits you are **not** ready to merge. \`git cherry-pick\` copies a single commit onto the branch you are on.

~~~bash
git switch main
git log --oneline feature          # find the commit's hash
git cherry-pick 4f3a9b2            # apply that one commit here
git cherry-pick feature~1          # you can also use a relative name
~~~

Git creates a **new commit** with the same change and message but a different hash (its parent differs). If the change conflicts, resolve it, \`git add\`, then \`git cherry-pick --continue\` (or \`--abort\` to cancel).

> [!tip] Key idea
> Merge brings a whole branch. Cherry-pick brings one commit. Use it for hotfixes and backports.
`,
      task: 'The `experiment` branch has three commits, and only the middle one (`Fix rounding bug`) is ready. Switch to `main` and cherry-pick **only that commit**. `main` must end up with `fix.py`, and must not contain `wip.py` or `idea.py`.',
      intro: 'You are on main in ~/calc. The experiment branch is unfinished except for one fix.',
      setup(m) {
        base(m);
        m.seedRepo('calc', [{ msg: 'Add calculator', files: { 'calc.py': '# calc\n' } }]);
        m.cwd = H + '/calc';
        m.run(['git switch -c experiment', 'echo "# wip" > wip.py', 'git add wip.py', 'git commit -m "WIP new engine"', 'echo "# fixed" > fix.py', 'git add fix.py', 'git commit -m "Fix rounding bug"', 'echo "# idea" > idea.py', 'git add idea.py', 'git commit -m "Try a crazy idea"', 'git switch main']);
      },
      checks: [
        { label: 'main now contains fix.py', test: (m) => { const r = m.git(H + '/calc'); return 'fix.py' in m.objects.get(r.branches.main).tree; } },
        { label: 'main does NOT contain wip.py or idea.py', test: (m) => { const t = m.objects.get(m.git(H + '/calc').branches.main).tree; return !('wip.py' in t) && !('idea.py' in t); } },
        { label: 'main has exactly one new commit (no merge commit)', test: (m) => { const l = m.gitLog(H + '/calc'); return l.length === 2 && l[0].parents.length === 1 && /Fix rounding bug/.test(l[0].msg); } },
        { label: 'Used git cherry-pick', test: (m) => m.ran(/^git cherry-pick/) },
        { label: 'The experiment branch is untouched (3 extra commits)', test: (m) => m.gitLog(H + '/calc', 'experiment').length === 4 },
      ],
      hints: ['Look at the commits: `git log --oneline experiment`.', 'The fix is the second-newest commit on experiment: `experiment~1`.', '`git cherry-pick experiment~1` (you are already on main).'],
      solution: ['git log --oneline experiment', 'git cherry-pick experiment~1'],
      recall: [
        { type: 'choice', q: 'What does `git cherry-pick <hash>` do?', options: ['Merges a whole branch', 'Copies one commit onto the current branch as a new commit', 'Deletes a commit', 'Pushes a commit'], answer: 1, why: 'It re-applies a single commit\'s change.' },
        { type: 'choice', q: 'Why does the cherry-picked commit have a different hash?', options: ['Git is random', 'It has a different parent (and timestamp)', 'The message changes', 'It does not'], answer: 1, why: 'A commit hash includes its parent.' },
        { type: 'type', q: 'Which flag cancels a cherry-pick that hit conflicts? (flag only)', accept: ['--abort'], why: '`git cherry-pick --abort`.' },
        { type: 'choice', q: 'A good use of cherry-pick is...', options: ['Backporting a hotfix to a release branch', 'Cloning a repo', 'Creating a new repo', 'Renaming files'], answer: 0, why: 'Take one fix without the rest of the branch.' },
      ],
    },
    {
      id: 'git-rebase', title: 'Rebase for a linear history', skill: 'History', xp: 45, diff: 3, kind: 'terminal',
      read: `
# Rewrite where a branch starts

A merge ties two histories together with a merge commit. **Rebase** instead replays your commits on top of the latest \`main\`, as if you had started from there. The history stays a straight line.

~~~
before:     A---B---C  main            after rebase:  A---B---C  main
                 \\                                              \\
                  D---E  feature                                 D'---E'  feature
~~~

~~~bash
git switch feature
git rebase main          # replay D and E on top of C
git switch main
git merge feature        # now a simple fast-forward: no merge commit
~~~

Rebased commits get **new hashes** (D' and E'), so the golden rule applies:

> [!warn] Never rebase commits you have already shared
> Rewriting public history forces teammates to untangle it. Rebase your own local, unpublished branches; merge shared ones.
`,
      task: 'The `feature` branch started before `main` got a new commit. Rebase `feature` onto `main`, then fast-forward `main` to include it. Result: one straight line, no merge commits.',
      intro: 'You are on feature in ~/site. main has moved on since you branched.',
      setup(m) {
        base(m);
        m.seedRepo('site', [{ msg: 'Add homepage', files: { 'index.html': '<h1>Home</h1>\n' } }]);
        m.cwd = H + '/site';
        m.run(['git switch -c feature', 'echo "about" > about.html', 'git add about.html', 'git commit -m "Add about page"', 'echo "contact" > contact.html', 'git add contact.html', 'git commit -m "Add contact page"', 'git switch main', 'echo "body{}" > style.css', 'git add style.css', 'git commit -m "Add stylesheet"', 'git switch feature']);
      },
      checks: [
        { label: 'Ran git rebase main', test: (m) => m.ran(/^git rebase main/) },
        { label: 'main contains all four files', test: (m) => { const t = m.objects.get(m.git(H + '/site').branches.main).tree; return ['index.html', 'style.css', 'about.html', 'contact.html'].every((f) => f in t); } },
        { label: 'History is linear: no merge commits', test: (m) => m.gitLog(H + '/site').every((c) => c.parents.length <= 1) },
        { label: 'main and feature point at the same commit', test: (m) => { const r = m.git(H + '/site'); return r.branches.main === r.branches.feature; } },
        { label: 'Four commits in total', test: (m) => m.gitLog(H + '/site').length === 4 },
      ],
      hints: ['You are on feature. `git rebase main` replays your two commits.', 'Then `git switch main`.', '`git merge feature` is now a fast-forward.'],
      solution: ['git rebase main', 'git switch main', 'git merge feature', 'git log --oneline --graph'],
      recall: [
        { type: 'choice', q: 'What does `git rebase main` do while on `feature`?', options: ['Merges main into feature with a merge commit', 'Replays feature\'s commits on top of main', 'Deletes feature', 'Pushes feature'], answer: 1, why: 'It re-bases the branch on the new tip.' },
        { type: 'choice', q: 'Why shouldn\'t you rebase commits already pushed and shared?', options: ['It is slow', 'It rewrites hashes, which breaks teammates\' history', 'Git forbids it', 'It deletes the remote'], answer: 1, why: 'Rebased commits are new commits.' },
        { type: 'choice', q: 'After a rebase, merging the feature into main is usually...', options: ['A fast-forward', 'A conflict', 'Impossible', 'A force-push'], answer: 0, why: 'The feature already contains main\'s tip.' },
        { type: 'choice', q: 'Which gives a straight-line history?', options: ['merge', 'rebase then fast-forward merge', 'revert', 'stash'], answer: 1, why: 'No merge commit is created.' },
      ],
    },
    {
      id: 'git-bisect', title: 'Bisect: find the bad commit', skill: 'History', xp: 50, diff: 3, kind: 'terminal',
      read: `
# Binary search through history

A bug appeared sometime in the last 50 commits. Checking each is slow. **\`git bisect\`** does a binary search: you tell it one commit that is **good** and one that is **bad**, and it checks out the commit in the middle for you to test. Each answer halves the range: 50 commits need about 6 tests.

~~~bash
git bisect start
git bisect bad                 # the current commit has the bug
git bisect good HEAD~7         # this older commit was fine
# Git checks out a middle commit. Test it (run the app, cat the file...)
git bisect good                # or: git bisect bad
# ...repeat until Git names "the first bad commit"
git bisect reset               # return to where you started
~~~

> [!tip] Key idea
> Bisect turns "I don't know when it broke" into a handful of yes/no questions. With a test script, \`git bisect run ./test.sh\` automates the whole thing (real Git; the sandbox is manual).
`,
      task: 'Somewhere between the first commit and now, `app.py` started containing the word `BUG`. Use `git bisect` (current commit is bad, `HEAD~7` is good) and `cat app.py` at each step to find the first bad commit. Write its commit message into `culprit.txt` and finish with `git bisect reset`.',
      intro: 'You are in ~/engine, 8 commits long. The latest is broken; the first was fine.',
      setup(m) {
        base(m);
        const c = (msg, body) => ({ msg, files: { 'app.py': body } });
        m.seedRepo('engine', [
          c('Initial engine', 'print("v1")\n'), c('Add logging', 'print("v1")\nlog()\n'), c('Rename vars', 'print("v1")\nlog2()\n'), c('Add cache', 'print("v1")\nlog2()\ncache()\n'),
          c('Optimise parser', 'print("v1")\nlog2()\ncache()\n# BUG here\n'), c('Update docs', 'print("v1")\nlog2()\ncache()\n# BUG here\n# docs\n'), c('Tidy imports', 'print("v1")\nlog2()\ncache()\n# BUG here\n# docs\n# tidy\n'), c('Bump version', 'print("v2")\nlog2()\ncache()\n# BUG here\n# docs\n# tidy\n'),
        ]);
        m.cwd = H + '/engine';
      },
      checks: [
        { label: 'Started a bisect and marked good and bad', test: (m) => m.ran(/^git bisect start/) && m.ran(/^git bisect bad/) && m.ran(/^git bisect good/) },
        { label: 'Inspected app.py during the search', test: (m) => m.ran(/^cat app\.py/) },
        { label: 'culprit.txt names the guilty commit', test: (m) => /Optimise parser/.test(m.read(H + '/engine/culprit.txt') || '') },
        { label: 'Ran git bisect reset', test: (m) => m.ran(/^git bisect reset/) },
        { label: 'Back on the latest commit (BUG visible, tree clean apart from culprit.txt)', test: (m) => { const s = m.gitStatus(H + '/engine'); return /BUG/.test(m.read(H + '/engine/app.py') || '') && s && !s.staged.length && !s.unstaged.length; } },
      ],
      hints: ['`git bisect start`, then `git bisect bad`, then `git bisect good HEAD~7`.', 'Git checks out a middle commit: run `cat app.py`. BUG present = `git bisect bad`, absent = `git bisect good`.', 'When Git prints "is the first bad commit", note its message, then `git bisect reset`.'],
      solution: ['git bisect start', 'git bisect bad', 'git bisect good HEAD~7', 'cat app.py', 'git bisect good', 'cat app.py', 'git bisect bad', 'cat app.py', 'git bisect bad', 'echo "Optimise parser" > culprit.txt', 'git bisect reset'],
      recall: [
        { type: 'choice', q: 'What algorithm does `git bisect` use?', options: ['Linear scan', 'Binary search', 'Random sampling', 'Hashing'], answer: 1, why: 'Each answer halves the remaining range.' },
        { type: 'choice', q: 'What must you give bisect to start?', options: ['A good commit and a bad commit', 'A branch name', 'A tag', 'Nothing'], answer: 0, why: 'It searches between a known-good and known-bad commit.' },
        { type: 'type', q: 'Which command ends a bisect and returns you to where you began? (full command)', accept: ['git bisect reset'], why: '`git bisect reset`.' },
        { type: 'choice', q: 'Roughly how many tests to bisect 1000 commits?', options: ['About 10', 'About 100', 'About 500', '1000'], answer: 0, why: 'log2(1000) is about 10.' },
      ],
    },
    {
      id: 'git-tags', title: 'Tags and releases', skill: 'History', xp: 35, diff: 2, kind: 'terminal',
      read: `
# Name a moment in history

A **tag** is a permanent label on a commit, typically a release like \`v1.0.0\`. Branches move; tags do not.

~~~bash
git tag v0.1                          # lightweight tag: just a name
git tag -a v1.0 -m "First release"    # annotated tag: stores tagger, date and message (preferred)
git tag                               # list tags
git show v1.0                         # see the tag message and commit
git tag -a v0.9 HEAD~2 -m "Beta"      # tag an older commit
git push origin v1.0                  # tags are NOT pushed by default
git push origin --tags                # push them all
~~~

Version numbers usually follow **semantic versioning**: \`MAJOR.MINOR.PATCH\` (breaking change . new feature . bug fix).

> [!tip] Key idea
> Use annotated tags for releases. GitHub turns pushed tags into release pages.
`,
      task: 'Create an annotated tag `v1.0` (message `First release`) on the latest commit, an annotated tag `v0.9` (message `Beta`) on the commit **two before** it (`HEAD~2`), and push `v1.0` to `origin`.',
      intro: 'You are in ~/lib, cloned from GitHub, with 4 commits.',
      setup(m) {
        base(m);
        m.seedRemote(U('lib'), [{ msg: 'Start lib', files: { 'lib.py': '# lib\n' } }, { msg: 'Add parser', files: { 'parse.py': '# parse\n' } }, { msg: 'Add tests', files: { 'test.py': '# test\n' } }, { msg: 'Polish docs', files: { 'README.md': '# lib\n' } }]);
        m.cwd = H;
        m.run([`git clone ${U('lib')}`, 'cd lib']);
      },
      checks: [
        { label: 'v1.0 exists on the latest commit', test: (m) => { const r = m.git(H + '/lib'); return !!r.tags['v1.0'] && r.tags['v1.0'] === r.branches.main; } },
        { label: 'v1.0 is annotated with "First release"', test: (m) => { const r = m.git(H + '/lib'); return !!(r.tagMeta['v1.0'] && /First release/.test(r.tagMeta['v1.0'].msg)); } },
        { label: 'v0.9 is annotated and points two commits back', test: (m) => { const r = m.git(H + '/lib'); const l = m.gitLog(H + '/lib'); return !!r.tagMeta['v0.9'] && l.length === 4 && r.tags['v0.9'] === l[2].id; } },
        { label: 'v1.0 is on GitHub', test: (m) => { const rem = m.remote(U('lib')); return !!(rem && rem.tags && rem.tags['v1.0']); } },
        { label: 'v0.9 was NOT pushed (only v1.0)', test: (m) => { const rem = m.remote(U('lib')); return !!(rem && rem.tags && !rem.tags['v0.9']); } },
      ],
      hints: ['`git tag -a v1.0 -m "First release"` tags the current commit.', '`git tag -a v0.9 HEAD~2 -m "Beta"`.', '`git push origin v1.0` pushes just that tag.'],
      solution: ['git tag -a v1.0 -m "First release"', 'git tag -a v0.9 HEAD~2 -m "Beta"', 'git tag', 'git push origin v1.0'],
      recall: [
        { type: 'choice', q: 'Why prefer annotated tags for releases?', options: ['They store a message, tagger and date', 'They are faster', 'They push automatically', 'They are required'], answer: 0, why: 'Lightweight tags are only a name.' },
        { type: 'choice', q: 'Does `git push` also push your tags?', options: ['Yes, always', 'No, you must push tags explicitly', 'Only annotated ones', 'Only on main'], answer: 1, why: 'Use `git push origin v1.0` or `--tags`.' },
        { type: 'choice', q: 'Semantic version 2.4.1 -> 3.0.0 signals...', options: ['A breaking change', 'A bug fix', 'A new feature', 'Nothing'], answer: 0, why: 'The MAJOR number changes for breaking changes.' },
        { type: 'type', q: 'Which command creates an annotated tag called v2.0? (full command with -m "x")', accept: ['git tag -a v2.0 -m "x"', "git tag -a v2.0 -m 'x'", 'git tag -a v2.0 -m x'], why: '`git tag -a v2.0 -m "message"`.' },
      ],
    },
    {
      id: 'git-clean', title: 'Cleaning the working directory', skill: 'Undo', xp: 30, diff: 2, kind: 'terminal',
      read: `
# Remove files Git doesn't track

Builds and experiments leave **untracked** clutter. \`git clean\` deletes it, and because deletion is permanent (these files are not in history!) it demands care.

~~~bash
git clean -n          # dry run: show what WOULD be removed
git clean -f          # really remove untracked files
git clean -fd         # also remove untracked directories
git restore .         # discard edits to tracked files
~~~

**Always dry-run first.** Notes you meant to keep will vanish forever with \`-f\`.

> [!warn] No undo
> Tracked files can be recovered from history. Untracked files cannot: there is no reflog for them.
`,
      task: 'The folder has build junk. Do a dry run with `git clean -n`, then really delete the untracked files with `git clean -f`, and discard the unwanted edit to `app.py` with `git restore app.py`.',
      intro: 'You are in ~/tool. There are stray files and an unwanted edit.',
      setup(m) {
        base(m);
        m.seedRepo('tool', [{ msg: 'Add tool', files: { 'app.py': 'print("tool")\n', 'README.md': '# tool\n' } }]);
        m.cwd = H + '/tool';
        m.write(H + '/tool/debug.log', 'noise\n');
        m.write(H + '/tool/scratch.txt', 'tmp\n');
        m.write(H + '/tool/app.py', 'print("oops")\n');
      },
      checks: [
        { label: 'Did a dry run first (git clean -n)', test: (m) => m.ran(/^git clean -n/) },
        { label: 'Untracked files are gone', test: (m) => m.read(H + '/tool/debug.log') === null && m.read(H + '/tool/scratch.txt') === null },
        { label: 'app.py is restored', test: (m) => m.read(H + '/tool/app.py') === 'print("tool")\n' },
        { label: 'Tracked files survived and the tree is clean', test: (m) => m.read(H + '/tool/README.md') !== null && clean(m, H + '/tool') },
      ],
      hints: ['`git clean -n` only lists; it never deletes.', '`git clean -f` deletes the untracked files.', '`git restore app.py` throws away the edit.'],
      solution: ['git status', 'git clean -n', 'git clean -f', 'git restore app.py'],
      recall: [
        { type: 'choice', q: 'What does `git clean -n` do?', options: ['Deletes everything', 'Shows what would be deleted (dry run)', 'Cleans the .git folder', 'Nothing'], answer: 1, why: '-n is "no action".' },
        { type: 'choice', q: 'Why is `git clean -f` dangerous?', options: ['Untracked files are not in history, so they cannot be recovered', 'It deletes commits', 'It rewrites history', 'It is slow'], answer: 0, why: 'Git has never recorded them.' },
        { type: 'choice', q: 'Which removes untracked **directories** too?', options: ['git clean -f', 'git clean -fd', 'git clean -n', 'git rm -r'], answer: 1, why: '-d includes directories.' },
        { type: 'type', q: 'Which command discards unstaged edits to `app.py`? (full command)', accept: ['git restore app.py', 'git checkout -- app.py', 'git checkout app.py'], why: '`git restore app.py`.' },
      ],
    },
    {
      id: 'git-capstone', title: 'Capstone: rescue the broken repo', skill: 'Projects', xp: 150, diff: 3, kind: 'terminal', capstone: true,
      read: `
# Everything at once

A teammate left this repo in a mess. Use what you have learned to fix it, in this order:

1. **Recover lost work.** Someone ran \`git reset --hard\` and dropped a commit that added \`billing.py\`. Find it with \`git reflog\` and restore it.
2. **Take only the fix.** Branch \`risky\` has a commit \`Fix off-by-one\` (\`fix.py\`) buried among unfinished work. **Cherry-pick** just that commit onto \`main\`.
3. **Linear history.** Branch \`docs\` has two documentation commits that branched earlier. **Rebase** it onto \`main\` and fast-forward \`main\`.
4. **Clean up.** Remove the untracked \`debug.log\`.
5. **Release.** Tag the result with an annotated tag \`v1.0\` (message \`Rescued\`).

> [!tip] Check as you go
> \`git status\`, \`git log --oneline --graph --all\` and \`git reflog\` tell you where you are after each step.
`,
      task: 'Recover `billing.py` from the reflog, cherry-pick the fix commit from `risky`, rebase `docs` onto `main` and fast-forward, remove `debug.log`, and tag `v1.0` (annotated, message `Rescued`).',
      intro: 'You are on main in ~/rescue. It is not a pretty sight. Run: git log --oneline --all --graph',
      setup(m) {
        base(m);
        m.seedRepo('rescue', [{ msg: 'Initial app', files: { 'app.py': 'print("app")\n' } }]);
        m.cwd = H + '/rescue';
        m.run(['git switch -c risky', 'echo "# wip" > wip.py', 'git add wip.py', 'git commit -m "WIP risky thing"', 'echo "# fix" > fix.py', 'git add fix.py', 'git commit -m "Fix off-by-one"', 'echo "# idea" > idea.py', 'git add idea.py', 'git commit -m "Another idea"', 'git switch main']);
        m.run(['git switch -c docs', 'echo "# guide" > guide.md', 'git add guide.md', 'git commit -m "Add guide"', 'echo "# faq" > faq.md', 'git add faq.md', 'git commit -m "Add FAQ"', 'git switch main']);
        m.run(['echo "# billing" > billing.py', 'git add billing.py', 'git commit -m "Add billing"', 'git reset --hard HEAD~1']);
        m.write(H + '/rescue/debug.log', 'noise\n');
      },
      checks: [
        { label: 'billing.py is back on main', test: (m) => 'billing.py' in m.objects.get(m.git(H + '/rescue').branches.main).tree },
        { label: 'fix.py is on main, but wip.py and idea.py are not', test: (m) => { const t = m.objects.get(m.git(H + '/rescue').branches.main).tree; return 'fix.py' in t && !('wip.py' in t) && !('idea.py' in t); } },
        { label: 'Used reflog and cherry-pick', test: (m) => m.ran(/^git reflog/) && m.ran(/^git cherry-pick/) },
        { label: 'Both docs files are on main (docs rebased and fast-forwarded)', test: (m) => { const t = m.objects.get(m.git(H + '/rescue').branches.main).tree; return 'guide.md' in t && 'faq.md' in t; } },
        { label: 'Used git rebase', test: (m) => m.ran(/^git rebase/) },
        { label: 'debug.log removed', test: (m) => m.read(H + '/rescue/debug.log') === null },
        { label: 'Annotated tag v1.0 "Rescued" on main', test: (m) => { const r = m.git(H + '/rescue'); return r.tags['v1.0'] === r.branches.main && !!(r.tagMeta['v1.0'] && /Rescued/.test(r.tagMeta['v1.0'].msg)); } },
        { label: 'History on main is linear (no merge commits)', test: (m) => m.gitLog(H + '/rescue').every((c) => c.parents.length <= 1) },
        { label: 'Working tree is clean', test: (m) => clean(m, H + '/rescue') },
      ],
      hints: ['`git reflog`: the entry before "reset: moving to HEAD~1" is where billing was.', '`git reset --hard HEAD@{1}`, then `git cherry-pick risky~1`.', 'Rebase: `git switch docs`, `git rebase main`, `git switch main`, `git merge docs`. Then `git clean -f` and `git tag -a v1.0 -m "Rescued"`.'],
      solution: ['git reflog', 'git reset --hard HEAD@{1}', 'git cherry-pick risky~1', 'git switch docs', 'git rebase main', 'git switch main', 'git merge docs', 'git clean -f', 'git tag -a v1.0 -m "Rescued"'],
      recall: [
        { type: 'choice', q: 'Which tool finds a commit that no branch points to any more?', options: ['git log', 'git reflog', 'git status', 'git blame'], answer: 1, why: 'The reflog records HEAD\'s history.' },
        { type: 'choice', q: 'You want one commit from another branch. Which command?', options: ['git merge', 'git cherry-pick', 'git rebase', 'git stash'], answer: 1, why: 'Cherry-pick copies a single commit.' },
        { type: 'choice', q: 'Before deleting untracked files you should...', options: ['Run git clean -n', 'Run git push', 'Commit them', 'Reset hard'], answer: 0, why: 'Dry-run first.' },
        { type: 'choice', q: 'Which is the best tag for a release?', options: ['A lightweight tag', 'An annotated tag', 'A branch', 'A stash'], answer: 1, why: 'Annotated tags record who and why.' },
        { type: 'choice', q: 'What makes a history "linear"?', options: ['No merge commits', 'Only one branch ever', 'One author', 'No tags'], answer: 0, why: 'Every commit has a single parent.' },
      ],
    },
  ]);
})(typeof window !== 'undefined' ? window : globalThis);
