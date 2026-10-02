(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  const H = '/home/learner';
  const base = (m) => { m.configureIdentity(); m.globalConfig['init.defaultbranch'] = 'main'; };
  const clean = (m, dir) => { const s = m.gitStatus(dir); return !!s && !s.staged.length && !s.unstaged.length && !s.untracked.length && !s.unmerged.length; };

  LP.addLessons('git', [
    
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
        
      ],
    },

    {
      id: 'git-capstone', title: 'Capstone: rescue the broken repo', skill: 'Projects', xp: 150, diff: 3, kind: 'terminal', capstone: true,
      read: `
# Everything at once

A teammate left this repo in a mess. Use what you have learned to fix it, in this order:

1. **Recover lost work.** Someone ran \`git reset --hard\` and dropped a commit that added \`billing.py\`. Find it with \`git reflog\` and restore it.
2. **Linear history.** Branch \`docs\` has two documentation commits that branched off earlier. **Rebase** it onto \`main\`, then fast-forward \`main\`.
3. **Keep junk out.** An untracked \`debug.log\` clutters \`git status\`. Add a \`.gitignore\` for \`*.log\` and commit it.

> [!tip] Check as you go
> \`git status\`, \`git log --oneline --graph --all\` and \`git reflog\` tell you where you are after each step.
`,
      task: 'Recover `billing.py` from the reflog, rebase `docs` onto `main` and fast-forward, then ignore `*.log` with a committed `.gitignore`. Finish with a clean working tree.',
      intro: 'You are on main in ~/rescue. Run: git log --oneline --all --graph',
      setup(m) {
        base(m);
        m.seedRepo('rescue', [{ msg: 'Initial app', files: { 'app.py': 'print("app")\n' } }]);
        m.cwd = H + '/rescue';
        m.run(['git switch -c docs', 'echo "# guide" > guide.md', 'git add guide.md', 'git commit -m "Add guide"', 'echo "# faq" > faq.md', 'git add faq.md', 'git commit -m "Add FAQ"', 'git switch main']);
        m.run(['echo "# billing" > billing.py', 'git add billing.py', 'git commit -m "Add billing"', 'git reset --hard HEAD~1']);
        m.write(H + '/rescue/debug.log', 'noise\n');
      },
      checks: [
        { label: 'Used git reflog', test: (m) => m.ran(/^git reflog/) },
        { label: 'billing.py is back on main', test: (m) => 'billing.py' in m.objects.get(m.git(H + '/rescue').branches.main).tree },
        { label: 'Used git rebase', test: (m) => m.ran(/^git rebase/) },
        { label: 'Both docs files are on main (docs rebased and fast-forwarded)', test: (m) => { const t = m.objects.get(m.git(H + '/rescue').branches.main).tree; return 'guide.md' in t && 'faq.md' in t; } },
        { label: 'History on main is linear (no merge commits)', test: (m) => m.gitLog(H + '/rescue').every((c) => c.parents.length <= 1) },
        { label: '.gitignore with *.log is committed on main', test: (m) => { const t = m.objects.get(m.git(H + '/rescue').branches.main).tree; return /\*\.log/.test(t['.gitignore'] || ''); } },
        { label: 'Working tree is clean (debug.log is ignored)', test: (m) => clean(m, H + '/rescue') },
      ],
      hints: ['`git reflog`: the entry before "reset: moving to HEAD~1" is where billing was. `git reset --hard HEAD@{1}`.', 'Rebase: `git switch docs`, `git rebase main`, `git switch main`, `git merge docs`.', '`echo "*.log" > .gitignore`, `git add .gitignore`, `git commit -m "Ignore logs"`.'],
      solution: ['git reflog', 'git reset --hard HEAD@{1}', 'git switch docs', 'git rebase main', 'git switch main', 'git merge docs', 'echo "*.log" > .gitignore', 'git add .gitignore', 'git commit -m "Ignore logs"'],
      recall: [
        { type: 'choice', q: 'Which tool finds a commit that no branch points to any more?', options: ['git log', 'git reflog', 'git status', 'git blame'], answer: 1, why: 'The reflog records HEAD\'s history.' },
        { type: 'choice', q: 'What makes a history "linear"?', options: ['No merge commits', 'Only one branch ever', 'One author', 'No tags'], answer: 0, why: 'Every commit has a single parent.' },
        { type: 'choice', q: 'Will `.gitignore` hide a file that is already committed?', options: ['No, only untracked files', 'Yes', 'Only on GitHub', 'Only on main'], answer: 0, why: 'Tracked files stay tracked.' },
      ],
    },
  ]);
})(typeof window !== 'undefined' ? window : globalThis);
