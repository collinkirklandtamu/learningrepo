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
      
    ],
    'git-commit': [
      d('Two commits', 'Create `a.txt` and commit it as `Add a`; then create `b.txt` and commit it as `Add b`. You need exactly two commits.', 'An empty repo in ~/work.',
        (m) => { base(m); m.seedRepo('work', []); m.cwd = H + '/work'; },
        [{ label: 'Two commits', test: (m) => m.gitLog(H + '/work').length === 2 }, { label: 'Latest commit adds b.txt', test: (m) => { const l = m.gitLog(H + '/work'); return l.length > 0 && 'b.txt' in l[0].tree && /Add b/.test(l[0].msg); } }, { label: 'Clean tree', test: (m) => clean(m, H + '/work') }],
        ['echo a > a.txt', 'git add a.txt', 'git commit -m "Add a"', 'echo b > b.txt', 'git add b.txt', 'git commit -m "Add b"']),
      
    ],
    'git-inspect': [
      d('Read the staged diff', 'Stage the change to `notes.txt`, then run `git diff --staged` and `git log --oneline` before committing as `Update notes`.', 'notes.txt has an edit.',
        (m) => { base(m); m.seedRepo('work', [{ msg: 'Start', files: { 'notes.txt': 'one\n' } }]); m.cwd = H + '/work'; m.write(H + '/work/notes.txt', 'one\ntwo\n'); },
        [{ label: 'Ran git diff --staged', test: (m) => m.ran(/^git diff (--staged|--cached)/) }, { label: 'Ran git log --oneline', test: (m) => m.ran(/^git log --oneline/) }, { label: 'Committed', test: (m) => m.gitLog(H + '/work').length === 2 }],
        ['git add notes.txt', 'git diff --staged', 'git commit -m "Update notes"', 'git log --oneline']),
      
    ],
    
    'git-ignore': [
      d('Ignore a folder', 'Ignore the `build/` folder and all `*.tmp` files with a `.gitignore`, then commit the `.gitignore`.', 'A repo with junk lying around.',
        (m) => { base(m); m.seedRepo('work', [{ msg: 'Start', files: { 'app.py': '1\n' } }]); m.cwd = H + '/work'; m.write(H + '/work/build/out.bin', 'x'); m.write(H + '/work/cache.tmp', 'x'); },
        [{ label: '.gitignore committed', test: (m) => { const l = m.gitLog(H + '/work'); return l.length === 2 && '.gitignore' in l[0].tree; } }, { label: 'Ignores build/ and *.tmp', test: (m) => { const t = m.read(H + '/work/.gitignore') || ''; return /build\/?/.test(t) && /\*\.tmp/.test(t); } }, { label: 'Tree is clean (junk ignored)', test: (m) => clean(m, H + '/work') }],
        ['echo "build/" > .gitignore', 'echo "*.tmp" >> .gitignore', 'git add .gitignore', 'git commit -m "Add gitignore"']),
      
    ],
    'git-branch': [
      d('Make and switch', 'Create a branch `feature/search`, switch to it and commit a new file `search.py` there. `main` must not get the file.', 'You are on main in ~/work.',
        seed('work', [{ msg: 'Start', files: { 'app.py': '1\n' } }]),
        [{ label: 'On feature/search', test: (m) => m.git(H + '/work').head.ref === 'feature/search' }, { label: 'search.py only on the branch', test: (m) => { const r = m.git(H + '/work'); return 'search.py' in m.objects.get(r.branches['feature/search']).tree && !('search.py' in m.objects.get(r.branches.main).tree); } }],
        ['git switch -c feature/search', 'echo "# s" > search.py', 'git add search.py', 'git commit -m "Add search"']),
      
    ],
    'git-merge': [
      d('Merge a feature', 'Merge `feature` into `main` and check the graph with `git log --oneline --graph`.', 'main and feature have diverged.',
        (m) => { base(m); m.seedRepo('work', [{ msg: 'Start', files: { 'a.txt': '1\n' } }]); m.cwd = H + '/work'; run(m, ['git switch -c feature', 'echo f > f.txt', 'git add f.txt', 'git commit -m "Add f"', 'git switch main', 'echo m > m.txt', 'git add m.txt', 'git commit -m "Add m"']); },
        [{ label: 'main has f.txt and m.txt', test: (m) => { const t = files(m, 'work'); return 'f.txt' in t && 'm.txt' in t; } }, { label: 'A merge commit exists', test: (m) => m.gitLog(H + '/work').some((c) => c.parents.length === 2) }, { label: 'Viewed the graph', test: (m) => m.ran(/--graph/) }],
        ['git merge feature', 'git log --oneline --graph']),
      
    ],
    'git-conflict': [
      d('Pick the incoming change', 'Merge `theirs` into `main`. Both changed `title.txt`. Resolve the conflict by keeping the line `Theirs wins`, then commit the merge.', 'A guaranteed conflict in title.txt.',
        (m) => { base(m); m.seedRepo('work', [{ msg: 'Start', files: { 'title.txt': 'Original\n' } }]); m.cwd = H + '/work'; run(m, ['git switch -c theirs', 'echo "Theirs wins" > title.txt', 'git commit -am "Their title"', 'git switch main', 'echo "Mine wins" > title.txt', 'git commit -am "My title"']); },
        [{ label: 'title.txt is exactly the chosen line, no markers', test: (m) => m.read(H + '/work/title.txt') === 'Theirs wins\n' }, { label: 'Merge commit created', test: (m) => m.gitLog(H + '/work').some((c) => c.parents.length === 2) }, { label: 'Clean tree', test: (m) => clean(m, H + '/work') }],
        ['git merge theirs', 'echo "Theirs wins" > title.txt', 'git add title.txt', 'git commit -m "Merge theirs"']),
      
    ],
    'git-rebase': [
      d('Rebase a topic', 'You are on `topic`. Rebase it onto `main` so that `topic` contains `main.txt`. Do not merge.', 'main moved after topic branched.',
        (m) => { base(m); m.seedRepo('work', [{ msg: 'Start', files: { 'a.txt': '1\n' } }]); m.cwd = H + '/work'; run(m, ['git switch -c topic', 'echo t > t.txt', 'git add t.txt', 'git commit -m "Add t"', 'git switch main', 'echo m > main.txt', 'git add main.txt', 'git commit -m "Add main"', 'git switch topic']); },
        [{ label: 'topic contains main.txt and t.txt', test: (m) => { const t = m.objects.get(m.git(H + '/work').branches.topic).tree; return 'main.txt' in t && 't.txt' in t; } }, { label: 'No merge commits', test: (m) => m.gitLog(H + '/work', 'topic').every((c) => c.parents.length <= 1) }],
        ['git rebase main']),
      
    ],
    
    'git-undo': [
      d('Unstage a file', 'You staged `secret.txt` by mistake. Unstage it (`git restore --staged`) without deleting the file.', 'secret.txt is staged.',
        (m) => { base(m); m.seedRepo('work', [{ msg: 'Start', files: { 'a': '1\n' } }]); m.cwd = H + '/work'; m.write(H + '/work/secret.txt', 'pw\n'); run(m, ['git add secret.txt']); },
        [{ label: 'Nothing staged', test: (m) => m.gitStatus(H + '/work').staged.length === 0 }, { label: 'File still exists', test: (m) => m.read(H + '/work/secret.txt') === 'pw\n' }],
        ['git restore --staged secret.txt']),
      
    ],
    
    'git-stash': [
      d('Stash and switch', 'You have uncommitted work on `main`. Stash it, switch to `other`, then switch back and pop the stash.', 'Dirty tree on main; branch other exists.',
        (m) => { base(m); m.seedRepo('work', [{ msg: 'Start', files: { 'a.txt': '1\n' } }]); m.cwd = H + '/work'; run(m, ['git branch other']); m.write(H + '/work/a.txt', '1 edited\n'); },
        [{ label: 'Stashed and popped', test: (m) => m.ran(/^git stash( push)?$/) && m.ran(/^git stash pop/) }, { label: 'Back on main with edit restored', test: (m) => m.git(H + '/work').head.ref === 'main' && m.read(H + '/work/a.txt') === '1 edited\n' }],
        ['git stash', 'git switch other', 'git switch main', 'git stash pop']),
      
    ],
    'git-reflog': [
      d('Undo an amend', 'You amended a commit and regretted it. Use `git reflog` to find the pre-amend commit and `git reset --hard` back to it.', 'The last commit was amended.',
        (m) => { base(m); m.seedRepo('work', [{ msg: 'Start', files: { 'a.txt': '1\n' } }]); m.cwd = H + '/work'; run(m, ['echo orig > b.txt', 'git add b.txt', 'git commit -m "Add b"', 'echo new > c.txt', 'git add c.txt', 'git commit --amend -m "Add b and c"']); },
        [{ label: 'Used reflog', test: (m) => m.ran(/^git reflog/) }, { label: 'HEAD has b.txt but no c.txt', test: (m) => { const t = files(m, 'work'); return 'b.txt' in t && !('c.txt' in t); } }, { label: 'Message is "Add b"', test: (m) => /^Add b$/.test(m.gitLog(H + '/work')[0].msg.trim()) }],
        ['git reflog', 'git reset --hard HEAD@{1}']),
      
    ],

  });

  LP.addRecall({
    'git-setup': [
      { type: 'choice', q: 'Where does `git init` store history?', options: ['A hidden .git folder', 'A file called history.txt', 'GitHub', 'Your home folder'], answer: 0, why: 'The .git directory is the repository.' },
      
    ],
    'git-commit': [
      { type: 'choice', q: 'What does `git status` show for a brand-new file?', options: ['Untracked', 'Committed', 'Ignored', 'Staged'], answer: 0, why: 'Git has not been told to track it yet.' },
      
    ],
    'git-inspect': [
      { type: 'choice', q: 'Which command compares staged changes with the last commit?', options: ['git diff', 'git diff --staged', 'git log', 'git status'], answer: 1, why: 'Plain `git diff` only shows unstaged edits.' },
      
    ],
    'git-ignore': [
      { type: 'choice', q: 'Will `.gitignore` hide a file that is already committed?', options: ['Yes', 'No, only untracked files', 'Only on GitHub', 'Only on main'], answer: 1, why: 'Tracked files must be removed with `git rm --cached`.' },
      
    ],
    'git-branch': [
      { type: 'type', q: 'Which command creates AND switches to a new branch `x`? (full command)', accept: ['git switch -c x', 'git checkout -b x'], why: '`git switch -c x`.' },
      
    ],
    'git-merge': [
      { type: 'choice', q: 'Which flag draws the history as a graph?', options: ['--graph', '--tree', '--draw', '--branches'], answer: 0, why: '`git log --oneline --graph`.' },
      
    ],
    'git-conflict': [
      { type: 'choice', q: 'What do the `<<<<<<<` and `>>>>>>>` lines mark?', options: ['The conflicting versions to resolve', 'Comments', 'Tags', 'Deleted lines'], answer: 0, why: 'You must edit them out.' },
      
    ],
    'git-undo': [
      { type: 'choice', q: 'Which undo is safe for **shared** history?', options: ['git revert', 'git reset --hard', 'git push --force', 'git clean -f'], answer: 0, why: 'Revert adds a new commit instead of rewriting history.' },
      
    ],
    'git-stash': [
      { type: 'choice', q: 'What is the difference between `stash pop` and `stash apply`?', options: ['pop also removes the entry', 'apply also removes it', 'None', 'pop pushes to GitHub'], answer: 0, why: 'apply keeps the stash entry.' },
      
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
