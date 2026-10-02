(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  const H = '/home/learner';
  const base = (m) => { m.configureIdentity(); m.globalConfig['init.defaultbranch'] = 'main'; };
  const clean = (m, dir) => { const s = m.gitStatus(dir); return !!s && !s.staged.length && !s.unstaged.length && !s.untracked.length && !s.unmerged.length; };
  const seed = (name, commits) => (m) => { base(m); m.seedRepo(name, commits); m.cwd = H + '/' + name; };
  const run = (m, cmds) => m.run(cmds);
  const d = (title, task, intro, setup, checks, solution, hints) => ({ title, task, intro, setup, checks, solution, hints: hints || ['Re-read the lesson reading if you are stuck; each step is one command.'] });
  const files = (m, name) => { const r = m.git(H + '/' + name); return m.objects.get(r.branches[r.head.ref || 'main']).tree; };

  LP.addDrills({
    'git-setup': [
      d('Name and email', 'Set your global `user.name` to `Ada Lovelace` and `user.email` to `ada@example.com`, then show the config with `git config --list`.', 'A fresh machine with no Git identity.',
        (m) => { m.globalConfig['init.defaultbranch'] = 'main'; },
        [{ label: 'user.name set', test: (m) => m.globalConfig['user.name'] === 'Ada Lovelace' }, { label: 'user.email set', test: (m) => m.globalConfig['user.email'] === 'ada@example.com' }, { label: 'Listed the config', test: (m) => m.ran(/^git config (--list|-l)/) }],
        ['git config --global user.name "Ada Lovelace"', 'git config --global user.email "ada@example.com"', 'git config --list']),
      d('Init a project', 'Create a folder `journal`, enter it and run `git init`. Check it with `git status`.', 'You are in your home folder.',
        (m) => { base(m); m.cwd = H; },
        [{ label: 'journal is a repo', test: (m) => !!m.git(H + '/journal') }, { label: 'Ran git status', test: (m) => m.ran(/^git status/) }],
        ['mkdir journal', 'cd journal', 'git init', 'git status']),
    ],
    'git-commit': [
      d('Two commits', 'Create `a.txt` and commit it as `Add a`; then create `b.txt` and commit it as `Add b`. You need exactly two commits.', 'An empty repo in ~/work.',
        (m) => { base(m); m.seedRepo('work', []); m.cwd = H + '/work'; },
        [{ label: 'Two commits', test: (m) => m.gitLog(H + '/work').length === 2 }, { label: 'Latest commit adds b.txt', test: (m) => { const l = m.gitLog(H + '/work'); return l.length > 0 && 'b.txt' in l[0].tree && /Add b/.test(l[0].msg); } }, { label: 'Clean tree', test: (m) => clean(m, H + '/work') }],
        ['echo a > a.txt', 'git add a.txt', 'git commit -m "Add a"', 'echo b > b.txt', 'git add b.txt', 'git commit -m "Add b"']),
      d('Commit only one file', 'Two files changed: `one.txt` and `two.txt`. Commit **only** `one.txt` (message `Update one`). `two.txt` must stay uncommitted.', 'Both files are modified.',
        (m) => { base(m); m.seedRepo('work', [{ msg: 'Start', files: { 'one.txt': '1\n', 'two.txt': '2\n' } }]); m.cwd = H + '/work'; m.write(H + '/work/one.txt', '1 edited\n'); m.write(H + '/work/two.txt', '2 edited\n'); },
        [{ label: 'New commit contains the one.txt edit', test: (m) => { const l = m.gitLog(H + '/work'); return l.length === 2 && l[0].tree['one.txt'] === '1 edited\n'; } }, { label: 'two.txt edit not committed', test: (m) => { const l = m.gitLog(H + '/work'); return l.length > 0 && l[0].tree['two.txt'] === '2\n'; } }, { label: 'two.txt still modified', test: (m) => m.read(H + '/work/two.txt') === '2 edited\n' }],
        ['git add one.txt', 'git commit -m "Update one"']),
    ],
    'git-inspect': [
      d('Read the staged diff', 'Stage the change to `notes.txt`, then run `git diff --staged` and `git log --oneline` before committing as `Update notes`.', 'notes.txt has an edit.',
        (m) => { base(m); m.seedRepo('work', [{ msg: 'Start', files: { 'notes.txt': 'one\n' } }]); m.cwd = H + '/work'; m.write(H + '/work/notes.txt', 'one\ntwo\n'); },
        [{ label: 'Ran git diff --staged', test: (m) => m.ran(/^git diff (--staged|--cached)/) }, { label: 'Ran git log --oneline', test: (m) => m.ran(/^git log --oneline/) }, { label: 'Committed', test: (m) => m.gitLog(H + '/work').length === 2 }],
        ['git add notes.txt', 'git diff --staged', 'git commit -m "Update notes"', 'git log --oneline']),
      d('Show a commit', 'Use `git show HEAD~1` to look at the previous commit, then save its one-line summary in `prev.txt` with `git log --oneline -1 HEAD~1 > prev.txt`.', 'A repo with 3 commits.',
        seed('work', [{ msg: 'First', files: { 'a': '1\n' } }, { msg: 'Second', files: { 'a': '2\n' } }, { msg: 'Third', files: { 'a': '3\n' } }]),
        [{ label: 'Ran git show', test: (m) => m.ran(/^git show/) }, { label: 'prev.txt holds "Second"', test: (m) => /Second/.test(m.read(H + '/work/prev.txt') || '') }],
        ['git show HEAD~1', 'git log --oneline -1 HEAD~1 > prev.txt']),
    ],
    'git-log-filters': [
      d('Recent only', 'Save only the **two newest** commits (one line each) to `latest.txt`.', 'A repo with 5 commits.',
        seed('work', [1, 2, 3, 4, 5].map((i) => ({ msg: 'Change ' + i, files: { f: i + '\n' } }))),
        [{ label: 'latest.txt has exactly 2 lines', test: (m) => (m.read(H + '/work/latest.txt') || '').trim().split('\n').length === 2 }, { label: 'They are Change 5 and Change 4', test: (m) => /Change 5/.test(m.read(H + '/work/latest.txt') || '') && /Change 4/.test(m.read(H + '/work/latest.txt') || '') }],
        ['git log --oneline -2 > latest.txt']),
      d('Who touched the file', 'Save the one-line history of **only** `db.py` to `db-history.txt`.', 'Several files, several commits.',
        seed('work', [{ msg: 'Add db', files: { 'db.py': '1\n' } }, { msg: 'Add ui', files: { 'ui.py': '1\n' } }, { msg: 'Tune db', files: { 'db.py': '2\n' } }, { msg: 'Tune ui', files: { 'ui.py': '2\n' } }]),
        [{ label: 'db-history.txt lists the 2 db commits', test: (m) => { const t = (m.read(H + '/work/db-history.txt') || '').trim().split('\n').filter(Boolean); return t.length === 2 && t.every((l) => /db/.test(l)); } }, { label: 'Used a path filter', test: (m) => m.ran(/git log.*-- db\.py/) }],
        ['git log --oneline -- db.py > db-history.txt']),
    ],
    'git-ignore': [
      d('Ignore a folder', 'Ignore the `build/` folder and all `*.tmp` files with a `.gitignore`, then commit the `.gitignore`.', 'A repo with junk lying around.',
        (m) => { base(m); m.seedRepo('work', [{ msg: 'Start', files: { 'app.py': '1\n' } }]); m.cwd = H + '/work'; m.write(H + '/work/build/out.bin', 'x'); m.write(H + '/work/cache.tmp', 'x'); },
        [{ label: '.gitignore committed', test: (m) => { const l = m.gitLog(H + '/work'); return l.length === 2 && '.gitignore' in l[0].tree; } }, { label: 'Ignores build/ and *.tmp', test: (m) => { const t = m.read(H + '/work/.gitignore') || ''; return /build\/?/.test(t) && /\*\.tmp/.test(t); } }, { label: 'Tree is clean (junk ignored)', test: (m) => clean(m, H + '/work') }],
        ['echo "build/" > .gitignore', 'echo "*.tmp" >> .gitignore', 'git add .gitignore', 'git commit -m "Add gitignore"']),
      d('Keep secrets out', 'Ignore `secrets.env` **before** it is committed, commit only `app.py` and `.gitignore`.', 'secrets.env sits next to app.py, untracked.',
        (m) => { base(m); m.seedRepo('work', []); m.cwd = H + '/work'; m.write(H + '/work/app.py', 'print(1)\n'); m.write(H + '/work/secrets.env', 'KEY=abc\n'); },
        [{ label: 'secrets.env never committed', test: (m) => m.gitLog(H + '/work').every((c) => !('secrets.env' in c.tree)) }, { label: 'app.py and .gitignore committed', test: (m) => { const l = m.gitLog(H + '/work'); return l.length > 0 && 'app.py' in l[0].tree && '.gitignore' in l[0].tree; } }, { label: 'Clean tree', test: (m) => clean(m, H + '/work') }],
        ['echo "secrets.env" > .gitignore', 'git add app.py .gitignore', 'git commit -m "Add app"']),
    ],
    'git-branch': [
      d('Make and switch', 'Create a branch `feature/search`, switch to it and commit a new file `search.py` there. `main` must not get the file.', 'You are on main in ~/work.',
        seed('work', [{ msg: 'Start', files: { 'app.py': '1\n' } }]),
        [{ label: 'On feature/search', test: (m) => m.git(H + '/work').head.ref === 'feature/search' }, { label: 'search.py only on the branch', test: (m) => { const r = m.git(H + '/work'); return 'search.py' in m.objects.get(r.branches['feature/search']).tree && !('search.py' in m.objects.get(r.branches.main).tree); } }],
        ['git switch -c feature/search', 'echo "# s" > search.py', 'git add search.py', 'git commit -m "Add search"']),
      d('Rename and delete', 'Rename branch `old-name` to `better-name` (`git branch -m`) and delete the already-merged branch `done`.', 'Two extra branches exist.',
        (m) => { base(m); m.seedRepo('work', [{ msg: 'Start', files: { 'a': '1\n' } }]); m.cwd = H + '/work'; run(m, ['git branch old-name', 'git branch done']); },
        [{ label: 'better-name exists, old-name gone', test: (m) => { const b = m.git(H + '/work').branches; return !!b['better-name'] && !b['old-name']; } }, { label: 'done deleted', test: (m) => !m.git(H + '/work').branches.done }],
        ['git branch -m old-name better-name', 'git branch -d done']),
    ],
    'git-merge': [
      d('Merge a feature', 'Merge `feature` into `main` and check the graph with `git log --oneline --graph`.', 'main and feature have diverged.',
        (m) => { base(m); m.seedRepo('work', [{ msg: 'Start', files: { 'a.txt': '1\n' } }]); m.cwd = H + '/work'; run(m, ['git switch -c feature', 'echo f > f.txt', 'git add f.txt', 'git commit -m "Add f"', 'git switch main', 'echo m > m.txt', 'git add m.txt', 'git commit -m "Add m"']); },
        [{ label: 'main has f.txt and m.txt', test: (m) => { const t = files(m, 'work'); return 'f.txt' in t && 'm.txt' in t; } }, { label: 'A merge commit exists', test: (m) => m.gitLog(H + '/work').some((c) => c.parents.length === 2) }, { label: 'Viewed the graph', test: (m) => m.ran(/--graph/) }],
        ['git merge feature', 'git log --oneline --graph']),
      d('Fast-forward', 'Merge `quick` into `main`. It should fast-forward: no merge commit.', 'quick is directly ahead of main.',
        (m) => { base(m); m.seedRepo('work', [{ msg: 'Start', files: { 'a.txt': '1\n' } }]); m.cwd = H + '/work'; run(m, ['git switch -c quick', 'echo q > q.txt', 'git add q.txt', 'git commit -m "Add q"', 'git switch main']); },
        [{ label: 'main has q.txt', test: (m) => 'q.txt' in files(m, 'work') }, { label: 'No merge commit', test: (m) => m.gitLog(H + '/work').every((c) => c.parents.length <= 1) }],
        ['git merge quick']),
    ],
    'git-conflict': [
      d('Pick the incoming change', 'Merge `theirs` into `main`. Both changed `title.txt`. Resolve the conflict by keeping the line `Theirs wins`, then commit the merge.', 'A guaranteed conflict in title.txt.',
        (m) => { base(m); m.seedRepo('work', [{ msg: 'Start', files: { 'title.txt': 'Original\n' } }]); m.cwd = H + '/work'; run(m, ['git switch -c theirs', 'echo "Theirs wins" > title.txt', 'git commit -am "Their title"', 'git switch main', 'echo "Mine wins" > title.txt', 'git commit -am "My title"']); },
        [{ label: 'title.txt is exactly the chosen line, no markers', test: (m) => m.read(H + '/work/title.txt') === 'Theirs wins\n' }, { label: 'Merge commit created', test: (m) => m.gitLog(H + '/work').some((c) => c.parents.length === 2) }, { label: 'Clean tree', test: (m) => clean(m, H + '/work') }],
        ['git merge theirs', 'echo "Theirs wins" > title.txt', 'git add title.txt', 'git commit -m "Merge theirs"']),
      d('Abort a merge', 'Start merging `theirs`, see the conflict, then **abort** with `git merge --abort`. Your file must be back to its original content.', 'The same conflict, but you change your mind.',
        (m) => { base(m); m.seedRepo('work', [{ msg: 'Start', files: { 'title.txt': 'Original\n' } }]); m.cwd = H + '/work'; run(m, ['git switch -c theirs', 'echo "Theirs" > title.txt', 'git commit -am "Their title"', 'git switch main', 'echo "Mine" > title.txt', 'git commit -am "My title"']); },
        [{ label: 'Ran git merge then --abort', test: (m) => m.cmds.some((c) => /^git merge theirs/.test(c.line)) && m.ran(/^git merge --abort/) }, { label: 'title.txt is Mine again', test: (m) => m.read(H + '/work/title.txt') === 'Mine\n' }, { label: 'Clean tree, no merge in progress', test: (m) => clean(m, H + '/work') }],
        ['git merge theirs', 'git merge --abort']),
    ],
    'git-rebase': [
      d('Rebase a topic', 'You are on `topic`. Rebase it onto `main` so that `topic` contains `main.txt`. Do not merge.', 'main moved after topic branched.',
        (m) => { base(m); m.seedRepo('work', [{ msg: 'Start', files: { 'a.txt': '1\n' } }]); m.cwd = H + '/work'; run(m, ['git switch -c topic', 'echo t > t.txt', 'git add t.txt', 'git commit -m "Add t"', 'git switch main', 'echo m > main.txt', 'git add main.txt', 'git commit -m "Add main"', 'git switch topic']); },
        [{ label: 'topic contains main.txt and t.txt', test: (m) => { const t = m.objects.get(m.git(H + '/work').branches.topic).tree; return 'main.txt' in t && 't.txt' in t; } }, { label: 'No merge commits', test: (m) => m.gitLog(H + '/work', 'topic').every((c) => c.parents.length <= 1) }],
        ['git rebase main']),
      d('Pull with rebase', 'Run `git pull --rebase` to bring in the teammate\'s commit while keeping history linear.', 'origin has a new commit you do not have, and you have a local commit.',
        (m) => { base(m); m.seedRemote('https://github.com/collinkirklandtamu/rb', [{ msg: 'Start', files: { 'a.txt': '1\n' } }]); m.cwd = H; run(m, ['git clone https://github.com/collinkirklandtamu/rb', 'cd rb']); m.remoteCommit('https://github.com/collinkirklandtamu/rb', 'main', { 'team.txt': 't\n' }, 'Team change'); m.write(H + '/rb/mine.txt', 'm\n'); run(m, ['git add mine.txt', 'git commit -m "My change"']); },
        [{ label: 'Both changes present', test: (m) => m.read(H + '/rb/team.txt') !== null && m.read(H + '/rb/mine.txt') !== null }, { label: 'Linear history (no merge commit)', test: (m) => m.gitLog(H + '/rb').every((c) => c.parents.length <= 1) }, { label: 'Used --rebase', test: (m) => m.ran(/^git pull --rebase/) }],
        ['git pull --rebase']),
    ],
    'git-cherry-pick': [
      d('Backport a fix', 'Copy the commit `Fix login` from `dev` onto `release` with cherry-pick.', 'You are on release.',
        (m) => { base(m); m.seedRepo('work', [{ msg: 'Start', files: { 'app.py': '1\n' } }]); m.cwd = H + '/work'; run(m, ['git switch -c dev', 'echo f > login.py', 'git add login.py', 'git commit -m "Fix login"', 'echo g > extra.py', 'git add extra.py', 'git commit -m "Extra"', 'git switch main', 'git switch -c release']); },
        [{ label: 'release has login.py but not extra.py', test: (m) => { const t = m.objects.get(m.git(H + '/work').branches.release).tree; return 'login.py' in t && !('extra.py' in t); } }, { label: 'Used cherry-pick', test: (m) => m.ran(/^git cherry-pick/) }],
        ['git cherry-pick dev~1']),
      d('Pick two commits', 'Cherry-pick **both** commits `Add a` and `Add b` from `spare` onto `main`, skipping `Add c`.', 'spare has three commits: a, b, c.',
        (m) => { base(m); m.seedRepo('work', [{ msg: 'Start', files: { 's.txt': '1\n' } }]); m.cwd = H + '/work'; run(m, ['git switch -c spare', 'echo a > a.txt', 'git add a.txt', 'git commit -m "Add a"', 'echo b > b.txt', 'git add b.txt', 'git commit -m "Add b"', 'echo c > c.txt', 'git add c.txt', 'git commit -m "Add c"', 'git switch main']); },
        [{ label: 'main has a.txt and b.txt, not c.txt', test: (m) => { const t = files(m, 'work'); return 'a.txt' in t && 'b.txt' in t && !('c.txt' in t); } }],
        ['git cherry-pick spare~2 spare~1']),
    ],
    'git-undo': [
      d('Unstage a file', 'You staged `secret.txt` by mistake. Unstage it (`git restore --staged`) without deleting the file.', 'secret.txt is staged.',
        (m) => { base(m); m.seedRepo('work', [{ msg: 'Start', files: { 'a': '1\n' } }]); m.cwd = H + '/work'; m.write(H + '/work/secret.txt', 'pw\n'); run(m, ['git add secret.txt']); },
        [{ label: 'Nothing staged', test: (m) => m.gitStatus(H + '/work').staged.length === 0 }, { label: 'File still exists', test: (m) => m.read(H + '/work/secret.txt') === 'pw\n' }],
        ['git restore --staged secret.txt']),
      d('Revert a commit', 'Undo the commit `Break things` **safely** with `git revert HEAD` (history keeps both commits).', 'The latest commit is bad.',
        (m) => { base(m); m.seedRepo('work', [{ msg: 'Good', files: { 'a.txt': 'good\n' } }, { msg: 'Break things', files: { 'a.txt': 'broken\n' } }]); m.cwd = H + '/work'; },
        [{ label: 'a.txt is good again', test: (m) => m.read(H + '/work/a.txt') === 'good\n' }, { label: 'Three commits: history preserved', test: (m) => m.gitLog(H + '/work').length === 3 }, { label: 'Used git revert', test: (m) => m.ran(/^git revert/) }],
        ['git revert HEAD --no-edit']),
    ],
    'git-clean': [
      d('Dry run only', 'Preview what `git clean` would delete using the dry-run flag, and **do not** actually delete anything.', 'There are untracked files.',
        (m) => { base(m); m.seedRepo('work', [{ msg: 'Start', files: { 'a': '1\n' } }]); m.cwd = H + '/work'; m.write(H + '/work/x.log', 'x'); m.write(H + '/work/y.log', 'y'); },
        [{ label: 'Ran git clean -n', test: (m) => m.ran(/^git clean -n/) }, { label: 'Files are still there', test: (m) => m.read(H + '/work/x.log') !== null && m.read(H + '/work/y.log') !== null }],
        ['git clean -n']),
      d('Remove folders too', 'Remove untracked files **and** the untracked `tmp/` folder.', 'An untracked folder plus a file.',
        (m) => { base(m); m.seedRepo('work', [{ msg: 'Start', files: { 'a': '1\n' } }]); m.cwd = H + '/work'; m.write(H + '/work/tmp/z.txt', 'z'); m.write(H + '/work/junk.txt', 'j'); },
        [{ label: 'tmp/z.txt and junk.txt are gone', test: (m) => m.read(H + '/work/tmp/z.txt') === null && m.read(H + '/work/junk.txt') === null }, { label: 'Tracked file kept', test: (m) => m.read(H + '/work/a') !== null }],
        ['git clean -fd']),
    ],
    'git-stash': [
      d('Stash and switch', 'You have uncommitted work on `main`. Stash it, switch to `other`, then switch back and pop the stash.', 'Dirty tree on main; branch other exists.',
        (m) => { base(m); m.seedRepo('work', [{ msg: 'Start', files: { 'a.txt': '1\n' } }]); m.cwd = H + '/work'; run(m, ['git branch other']); m.write(H + '/work/a.txt', '1 edited\n'); },
        [{ label: 'Stashed and popped', test: (m) => m.ran(/^git stash( push)?$/) && m.ran(/^git stash pop/) }, { label: 'Back on main with edit restored', test: (m) => m.git(H + '/work').head.ref === 'main' && m.read(H + '/work/a.txt') === '1 edited\n' }],
        ['git stash', 'git switch other', 'git switch main', 'git stash pop']),
      d('Stash list', 'Stash your edit with the message `wip search`, then look at `git stash list`.', 'Uncommitted edit.',
        (m) => { base(m); m.seedRepo('work', [{ msg: 'Start', files: { 'a.txt': '1\n' } }]); m.cwd = H + '/work'; m.write(H + '/work/a.txt', 'edit\n'); },
        [{ label: 'Stashed with a message', test: (m) => m.ran(/^git stash (push )?-m ["']?wip search/) }, { label: 'Listed the stash', test: (m) => m.ran(/^git stash list/) }, { label: 'Tree clean', test: (m) => clean(m, H + '/work') }],
        ['git stash push -m "wip search"', 'git stash list']),
    ],
    'git-reflog': [
      d('Undo an amend', 'You amended a commit and regretted it. Use `git reflog` to find the pre-amend commit and `git reset --hard` back to it.', 'The last commit was amended.',
        (m) => { base(m); m.seedRepo('work', [{ msg: 'Start', files: { 'a.txt': '1\n' } }]); m.cwd = H + '/work'; run(m, ['echo orig > b.txt', 'git add b.txt', 'git commit -m "Add b"', 'echo new > c.txt', 'git add c.txt', 'git commit --amend -m "Add b and c"']); },
        [{ label: 'Used reflog', test: (m) => m.ran(/^git reflog/) }, { label: 'HEAD has b.txt but no c.txt', test: (m) => { const t = files(m, 'work'); return 'b.txt' in t && !('c.txt' in t); } }, { label: 'Message is "Add b"', test: (m) => /^Add b$/.test(m.gitLog(H + '/work')[0].msg.trim()) }],
        ['git reflog', 'git reset --hard HEAD@{1}']),
      d('Restore a deleted branch', 'The branch `feature` was deleted with `git branch -D feature`. Recover it: find its tip in the reflog and recreate the branch with `git branch feature <hash>`.', 'feature is gone but its commit is in the reflog.',
        (m) => { base(m); m.seedRepo('work', [{ msg: 'Start', files: { 'a.txt': '1\n' } }]); m.cwd = H + '/work'; run(m, ['git switch -c feature', 'echo f > f.txt', 'git add f.txt', 'git commit -m "Feature work"', 'git switch main', 'git branch -D feature']); },
        [{ label: 'Looked at the reflog', test: (m) => m.ran(/^git reflog/) }, { label: 'feature branch exists again with its commit', test: (m) => { const r = m.git(H + '/work'); return !!r.branches.feature && 'f.txt' in m.objects.get(r.branches.feature).tree; } }],
        ['git reflog', 'git branch feature HEAD@{1}'], ['`git reflog` lists "checkout: moving from feature to main"; the entry before it is the feature tip.', 'Try `git branch feature HEAD@{1}`.']),
    ],
    'git-bisect': [
      d('Two-step bisect', 'Use `git bisect` between `v1` (good) and the current commit (bad) to find the commit that broke `status.txt` (it says `BROKEN`). Put its message in `bad.txt` and reset.', '5 commits; tag v1 marks a good commit.',
        (m) => { base(m); m.seedRepo('work', [{ msg: 'One', files: { 'status.txt': 'ok\n' } }, { msg: 'Two', files: { 'status.txt': 'ok\n', 'x': '1\n' } }, { msg: 'Three breaks it', files: { 'status.txt': 'BROKEN\n' } }, { msg: 'Four', files: { 'y': '1\n' } }, { msg: 'Five', files: { 'z': '1\n' } }]); m.cwd = H + '/work'; run(m, ['git tag v1 HEAD~4']); },
        [{ label: 'bad.txt says "Three breaks it"', test: (m) => /Three breaks it/.test(m.read(H + '/work/bad.txt') || '') }, { label: 'Used bisect good/bad', test: (m) => m.ran(/^git bisect good/) && m.ran(/^git bisect bad/) }, { label: 'Reset the bisect', test: (m) => m.ran(/^git bisect reset/) }],
        ['git bisect start', 'git bisect bad', 'git bisect good v1', 'cat status.txt', 'git bisect bad', 'cat status.txt', 'git bisect good', 'echo "Three breaks it" > bad.txt', 'git bisect reset']),
      d('Bisect log', 'Start a bisect, mark `HEAD` bad and `HEAD~3` good, look at `git bisect log`, then `git bisect reset`.', 'Four commits.',
        seed('work', [1, 2, 3, 4].map((i) => ({ msg: 'C' + i, files: { f: i + '\n' } }))),
        [{ label: 'Started and marked both', test: (m) => m.ran(/^git bisect start/) && m.ran(/^git bisect bad/) && m.ran(/^git bisect good/) }, { label: 'Looked at the log', test: (m) => m.ran(/^git bisect log/) }, { label: 'Reset', test: (m) => m.ran(/^git bisect reset/) }],
        ['git bisect start', 'git bisect bad', 'git bisect good HEAD~3', 'git bisect log', 'git bisect reset']),
    ],
    'git-tags': [
      d('Lightweight tag', 'Create a lightweight tag `snapshot` on the current commit and list tags.', 'A repo with commits.',
        seed('work', [{ msg: 'A', files: { a: '1\n' } }, { msg: 'B', files: { a: '2\n' } }]),
        [{ label: 'snapshot points at HEAD', test: (m) => { const r = m.git(H + '/work'); return r.tags.snapshot === r.branches.main; } }, { label: 'Listed tags', test: (m) => m.ran(/^git tag$/) }],
        ['git tag snapshot', 'git tag']),
      d('Inspect and delete', 'Show tag `v0.1` with `git show v0.1`, then delete it with `git tag -d v0.1`.', 'A tag v0.1 exists.',
        (m) => { base(m); m.seedRepo('work', [{ msg: 'A', files: { a: '1\n' } }]); m.cwd = H + '/work'; run(m, ['git tag -a v0.1 -m "pre"']); },
        [{ label: 'Showed the tag', test: (m) => m.ran(/^git show v0\.1/) }, { label: 'Tag deleted', test: (m) => !m.git(H + '/work').tags['v0.1'] }],
        ['git show v0.1', 'git tag -d v0.1']),
    ],
  });

  LP.addRecall({
    'git-setup': [
      { type: 'choice', q: 'Where does `git init` store history?', options: ['A hidden .git folder', 'A file called history.txt', 'GitHub', 'Your home folder'], answer: 0, why: 'The .git directory is the repository.' },
      { type: 'type', q: 'Which command shows your current Git settings? (full command)', accept: ['git config --list', 'git config -l'], why: '`git config --list`.' },
    ],
    'git-commit': [
      { type: 'choice', q: 'What does `git status` show for a brand-new file?', options: ['Untracked', 'Committed', 'Ignored', 'Staged'], answer: 0, why: 'Git has not been told to track it yet.' },
      { type: 'type', q: 'Which command stages every change in the folder? (full command)', accept: ['git add .', 'git add -A'], why: '`git add .` stages everything.' },
    ],
    'git-inspect': [
      { type: 'choice', q: 'Which command compares staged changes with the last commit?', options: ['git diff', 'git diff --staged', 'git log', 'git status'], answer: 1, why: 'Plain `git diff` only shows unstaged edits.' },
      { type: 'choice', q: 'In a diff, a line starting with `+` means...', options: ['Added', 'Removed', 'Renamed', 'Ignored'], answer: 0, why: '`+` added, `-` removed.' },
    ],
    'git-ignore': [
      { type: 'choice', q: 'Will `.gitignore` hide a file that is already committed?', options: ['Yes', 'No, only untracked files', 'Only on GitHub', 'Only on main'], answer: 1, why: 'Tracked files must be removed with `git rm --cached`.' },
      { type: 'choice', q: 'Which pattern ignores every `.log` file?', options: ['*.log', 'log', '.log/', '*log*/'], answer: 0, why: '`*.log` matches by extension.' },
    ],
    'git-branch': [
      { type: 'type', q: 'Which command creates AND switches to a new branch `x`? (full command)', accept: ['git switch -c x', 'git checkout -b x'], why: '`git switch -c x`.' },
      { type: 'choice', q: 'What is a branch in Git?', options: ['A movable pointer to a commit', 'A copy of all files', 'A remote server', 'A tag'], answer: 0, why: 'Branches are cheap pointers.' },
    ],
    'git-merge': [
      { type: 'choice', q: 'Which flag draws the history as a graph?', options: ['--graph', '--tree', '--draw', '--branches'], answer: 0, why: '`git log --oneline --graph`.' },
      { type: 'choice', q: 'After merging a branch you no longer need, you should...', options: ['Delete it with git branch -d', 'Leave it forever', 'Rename it', 'Reset it'], answer: 0, why: 'The commits remain in history.' },
    ],
    'git-conflict': [
      { type: 'choice', q: 'What do the `<<<<<<<` and `>>>>>>>` lines mark?', options: ['The conflicting versions to resolve', 'Comments', 'Tags', 'Deleted lines'], answer: 0, why: 'You must edit them out.' },
      { type: 'type', q: 'Which flag cancels a merge in progress? (flag only)', accept: ['--abort'], why: '`git merge --abort`.' },
    ],
    'git-undo': [
      { type: 'choice', q: 'Which undo is safe for **shared** history?', options: ['git revert', 'git reset --hard', 'git push --force', 'git clean -f'], answer: 0, why: 'Revert adds a new commit instead of rewriting history.' },
      { type: 'choice', q: 'What does `git restore --staged f` do?', options: ['Unstages f, keeping your edits', 'Deletes f', 'Commits f', 'Discards edits'], answer: 0, why: 'It moves the file back out of the staging area.' },
    ],
    'git-stash': [
      { type: 'choice', q: 'What is the difference between `stash pop` and `stash apply`?', options: ['pop also removes the entry', 'apply also removes it', 'None', 'pop pushes to GitHub'], answer: 0, why: 'apply keeps the stash entry.' },
      { type: 'type', q: 'Which command lists your stashes? (full command)', accept: ['git stash list'], why: '`git stash list`.' },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
