(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  const H = '/home/learner';
  const noMarkers = (t) => !/^(<{7}|={7}|>{7})/m.test(t || '');
  const clean = (m, dir) => { const s = m.gitStatus(dir); return !!s && !s.staged.length && !s.unstaged.length && !s.untracked.length && !s.unmerged.length; };
  const base = (m) => { m.configureIdentity(); m.globalConfig['init.defaultbranch'] = 'main'; };

  (LP.courses = LP.courses || []).push({
    id: 'git', title: 'Git', icon: '🌿', color: '#f0624d', engine: 'terminal',
    blurb: 'Track, branch, merge and undo. Practise in a sandboxed terminal where nothing can break.',
    skills: ['Basics', 'Branching', 'Collaboration', 'Undo'],
    lessons: [
      {
        id: 'git-setup', title: 'Configure Git & make a repo', skill: 'Basics', xp: 20, diff: 1, kind: 'terminal',
        read: `
# What Git is for

Git is a **time machine for your project**. Every *commit* is a snapshot you can return to, compare against, or branch from. It runs locally; GitHub (later in the course) is just one place to share the history.

## One-time setup

Git stamps every commit with who made it, so tell it who you are:

~~~bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
git config --global init.defaultBranch main
~~~

\`--global\` means "for every repo on this computer". \`main\` is the modern default branch name.

## Make a repository

~~~bash
mkdir hello-git     # make a folder
cd hello-git        # step into it
git init            # turn it into a repo (creates a hidden .git folder)
git status          # ask Git what it sees
~~~

> [!tip] Your best friend
> \`git status\` is safe and tells you what state everything is in plus what to do next. Run it constantly.

> [!tip] Try it
> Click any code block in this panel to paste it into the terminal. Press Enter to run.
`,
        task: 'Set your name, email and default branch, then create `~/hello-git`, initialise a repo in it and run `git status`.',
        intro: 'Welcome to your sandbox terminal. Nothing here can touch your real computer. Try: ls',
        setup(m) { /* empty home folder */ },
        checks: [
          { label: 'Set user.name', test: (m) => !!m.globalConfig['user.name'] },
          { label: 'Set user.email (it should contain an @)', test: (m) => /@/.test(m.globalConfig['user.email'] || '') },
          { label: 'Set init.defaultBranch to main', test: (m) => m.globalConfig['init.defaultbranch'] === 'main' },
          { label: 'Created a repository in ~/hello-git', test: (m) => !!m.repos[H + '/hello-git'] },
          { label: 'Ran git status inside the repo', test: (m) => m.ran(/^git status/) },
        ],
        hints: ['`git config --global user.name "Your Name"` (quotes around names with spaces).', 'Branch default: `git config --global init.defaultBranch main`.', '`mkdir hello-git`, then `cd hello-git`, then `git init`.'],
        solution: ['git config --global user.name "Learner"', 'git config --global user.email "learner@example.com"', 'git config --global init.defaultBranch main', 'mkdir hello-git', 'cd hello-git', 'git init', 'git status'],
        recall: [
          { type: 'type', q: 'Which command turns the current folder into a Git repository? (full command)', accept: ['git init'], why: '`git init` creates the hidden .git folder that stores history.' },
          { type: 'choice', q: 'What does `--global` do in `git config --global user.name ...`?', options: ['Shares the name on GitHub', 'Applies the setting to every repo on this computer', 'Makes the commit public', 'Only affects the current commit'], answer: 1, why: 'Without `--global`, the setting applies to the current repo only.' },
        ],
      },
      {
        id: 'git-commit', title: 'Your first commit', skill: 'Basics', xp: 25, diff: 1, kind: 'terminal',
        read: `
# The three areas

Git has three places your work can live:

~~~
 Working directory  --git add-->   Staging area   --git commit-->   Repository
 (files you edit)               (the next snapshot)              (permanent history)
~~~

Staging lets you decide **exactly** what goes in each commit, instead of saving everything at once.

~~~bash
echo "# Hello Git" > README.md   # create a file
git status                       # README.md is "untracked"
git add README.md                # stage it
git commit -m "Add README"       # snapshot it, with a message
~~~

## Good commit messages

- Start with a verb in the imperative: *"Add login form"*, *"Fix crash on empty list"*.
- Say **what changed and why**, in one short line.
- A commit should be one logical change.

> [!tip] Key idea
> \`git add\` = "include this in the next snapshot". \`git commit\` = "take the snapshot". Two steps on purpose.
`,
        task: 'In `~/hello-git`: create `README.md` containing `# Hello Git`, stage it and make your first commit.',
        intro: 'You are in ~/hello-git, a fresh, empty repository.',
        setup(m) { base(m); m.seedRepo('hello-git', []); m.cwd = H + '/hello-git'; },
        checks: [
          { label: 'README.md exists', test: (m) => m.read(H + '/hello-git/README.md') !== null },
          { label: 'README.md contains # Hello Git', test: (m) => /# Hello Git/.test(m.read(H + '/hello-git/README.md') || '') },
          { label: 'Exactly one commit exists', test: (m) => m.gitLog(H + '/hello-git').length === 1 },
          { label: 'The commit contains README.md', test: (m) => { const l = m.gitLog(H + '/hello-git'); return l.length > 0 && 'README.md' in l[0].tree; } },
          { label: 'Working tree is clean', test: (m) => clean(m, H + '/hello-git') },
        ],
        hints: ['`echo "# Hello Git" > README.md` writes the file.', '`git add README.md`, then `git commit -m "Add README"`.'],
        solution: ['echo "# Hello Git" > README.md', 'git status', 'git add README.md', 'git commit -m "Add README"'],
        recall: [
          { type: 'choice', q: 'What does `git add file.txt` do?', options: ['Saves a permanent snapshot', 'Stages the file for the next commit', 'Uploads it to GitHub', 'Creates the file'], answer: 1, why: 'It moves the change into the staging area. `git commit` takes the snapshot.' },
          { type: 'choice', q: 'Which commit message follows good practice?', options: ['stuff', 'Fixed things.', 'Fix crash when the cart is empty', 'asdf commit 2'], answer: 2, why: 'Imperative mood, specific, and short.' },
        ],
      },
      {
        id: 'git-inspect', title: 'See what changed', skill: 'Basics', xp: 25, diff: 1, kind: 'terminal',
        read: `
# Reading your history

Before you commit, look at what you are about to commit.

~~~bash
git diff               # unstaged changes (working dir vs staging)
git diff --staged      # staged changes (staging vs last commit)
git log                # full history
git log --oneline      # one compact line per commit
~~~

In a diff, lines starting with \`-\` were removed and lines with \`+\` were added.

A commit is identified by a short hash like \`a1b2c3d\`. \`HEAD\` points to the commit you are on, and the branch name moves forward with each new commit.

> [!tip] Habit
> \`git status\` -> \`git diff\` -> \`git add\` -> \`git diff --staged\` -> \`git commit\`. The two diffs catch accidents before they become history.
`,
        task: 'Append a line to `notes.txt` (for example `echo "Commits are snapshots." >> notes.txt`). Look at it with `git diff`, stage it, check it with `git diff --staged`, commit it and view the history with `git log --oneline`.',
        intro: 'You are in ~/notes, a repo with 2 commits.',
        setup(m) {
          base(m);
          m.seedRepo('notes', [{ msg: 'Add notes file', files: { 'notes.txt': 'Git tracks changes.\n' } }, { msg: 'Add todo', files: { 'todo.txt': 'learn git\n' } }]);
          m.cwd = H + '/notes';
        },
        checks: [
          { label: 'Viewed the unstaged diff (git diff)', test: (m) => m.ran(/^git diff(?!.*--(staged|cached))/) },
          { label: 'Viewed the staged diff (git diff --staged)', test: (m) => m.ran(/^git diff.*--(staged|cached)/) },
          { label: 'Made a third commit', test: (m) => m.gitLog(H + '/notes').length === 3 },
          { label: 'The new commit changed notes.txt', test: (m) => { const l = m.gitLog(H + '/notes'); return l.length === 3 && l[0].tree['notes.txt'] !== l[1].tree['notes.txt']; } },
          { label: 'Viewed the log (git log)', test: (m) => m.ran(/^git log/) },
        ],
        hints: ['`>>` appends to a file; `>` overwrites it.', 'Order: `git diff`, `git add notes.txt`, `git diff --staged`, `git commit -m "..."`.'],
        solution: ['echo "Commits are snapshots." >> notes.txt', 'git diff', 'git add notes.txt', 'git diff --staged', 'git commit -m "Explain snapshots"', 'git log --oneline'],
        recall: [
          { type: 'type', q: 'Which command shows changes that are already staged? (full command)', accept: ['git diff --staged', 'git diff --cached'], why: 'Plain `git diff` only shows *unstaged* changes.' },
          { type: 'choice', q: 'In a diff, what does a line beginning with `+` mean?', options: ['It was added', 'It was removed', 'It is a conflict', 'It is unchanged'], answer: 0, why: '`+` is an addition, `-` a removal.' },
        ],
      },
      {
        id: 'git-ignore', title: 'Ignoring files with .gitignore', skill: 'Basics', xp: 30, diff: 2, kind: 'terminal',
        read: `
# Not everything belongs in Git

Logs, build output, editor settings and especially **secrets** (API keys, passwords) should never be committed. A \`.gitignore\` file lists patterns Git should pretend don't exist.

~~~
# .gitignore
*.log          # any file ending in .log
secrets.env    # one specific file
build/         # a whole folder
~~~

Create it like any file, then commit it so your teammates ignore the same things:

~~~bash
echo "*.log" > .gitignore       # > creates / overwrites
echo "build/" >> .gitignore     # >> appends
git status                      # ignored files vanish from the list
~~~

> [!warn] Ignore *before* you commit
> \`.gitignore\` only affects **untracked** files. If a secret was already committed it stays in history, even if you ignore it later, so rotate that key.
`,
        task: 'The project has `app.py`, `debug.log`, `secrets.env` and a `build/` folder. Create a `.gitignore` that excludes the logs, the secrets and the build folder, then commit `app.py` and `.gitignore` only.',
        intro: 'You are in ~/app. Run git status to see the mess.',
        setup(m) {
          base(m);
          m.seedRepo('app', [{ msg: 'Initial commit', files: { 'README.md': '# app\n' } }]);
          m.write(H + '/app/app.py', 'print("hello")\n');
          m.write(H + '/app/debug.log', 'DEBUG started\n');
          m.write(H + '/app/secrets.env', 'API_KEY=abc123\n');
          m.write(H + '/app/build/out.bin', '01010101');
          m.cwd = H + '/app';
        },
        checks: [
          { label: '.gitignore ignores *.log', test: (m) => /^\*\.log\s*$/m.test(m.read(H + '/app/.gitignore') || '') },
          { label: '.gitignore ignores secrets.env', test: (m) => /^secrets\.env\s*$/m.test(m.read(H + '/app/.gitignore') || '') },
          { label: '.gitignore ignores the build folder', test: (m) => /^\/?build\/?\s*$/m.test(m.read(H + '/app/.gitignore') || '') },
          { label: 'app.py and .gitignore are committed', test: (m) => { const l = m.gitLog(H + '/app'); return l.length > 0 && 'app.py' in l[0].tree && '.gitignore' in l[0].tree; } },
          { label: 'No secret, log or build file ever entered history', test: (m) => m.gitLog(H + '/app').every((c) => !('secrets.env' in c.tree) && !('debug.log' in c.tree) && !('build/out.bin' in c.tree)) },
          { label: 'Git sees no leftover untracked files', test: (m) => clean(m, H + '/app') },
        ],
        hints: ['Create the file with `echo "*.log" > .gitignore`, then append with `>>`.', 'Patterns needed: `*.log`, `secrets.env`, `build/`.', 'After ignoring, `git add .` stages everything that is left.'],
        solution: ['git status', 'echo "*.log" > .gitignore', 'echo "secrets.env" >> .gitignore', 'echo "build/" >> .gitignore', 'git status', 'git add .', 'git commit -m "Add app and .gitignore"'],
        recall: [
          { type: 'choice', q: 'Which pattern ignores every `.log` file?', options: ['log', '*.log', '.log/', '#log'], answer: 1, why: '`*` matches any characters, so `*.log` matches debug.log, error.log, ...' },
          { type: 'choice', q: 'You committed `secrets.env` yesterday, then added it to `.gitignore`. Is the secret safe?', options: ['Yes, it is ignored now', 'No, it is still in history. Rotate the key', 'Yes, Git deletes it', 'Only on GitHub'], answer: 1, why: '`.gitignore` does not rewrite history. Treat leaked secrets as compromised.' },
        ],
      },
      {
        id: 'git-branch', title: 'Branches', skill: 'Branching', xp: 30, diff: 2, kind: 'terminal',
        read: `
# Branches: parallel universes

A **branch** is a movable label pointing at a commit. Creating one is instant and free, so use them for every feature or experiment, and keep \`main\` working.

~~~bash
git branch                       # list branches (* marks the current one)
git switch -c feature/score      # create AND switch to a new branch
git switch main                  # go back
git branch -d feature/score      # delete a merged branch
~~~

Commits you make go on the **current** branch only. When you switch branches Git rewrites your files to match, so a file created on one branch disappears on the other:

~~~bash
git switch -c feature/score
echo "score = 0" > score.py
git add score.py
git commit -m "Add score"
git switch main
ls                               # score.py is gone!
~~~

> [!tip] Key idea
> \`git switch\` (or the older \`git checkout\`) moves \`HEAD\`. Whatever branch \`HEAD\` points to is where your next commit lands.
`,
        task: 'Create a branch `feature/score`, add `score.py` and commit it there. Switch back to `main` and confirm `score.py` is not there (`ls`).',
        intro: 'You are on main in ~/game.',
        setup(m) {
          base(m);
          m.seedRepo('game', [{ msg: 'Start game', files: { 'game.py': 'print("play")\n' } }, { msg: 'Add README', files: { 'README.md': '# game\n' } }]);
          m.cwd = H + '/game';
        },
        checks: [
          { label: 'Branch feature/score exists', test: (m) => !!m.git(H + '/game').branches['feature/score'] },
          { label: 'score.py is committed on feature/score', test: (m) => { const r = m.git(H + '/game'); const id = r.branches['feature/score']; return !!id && 'score.py' in m.objects.get(id).tree; } },
          { label: 'main does not contain score.py', test: (m) => { const r = m.git(H + '/game'); return !('score.py' in m.objects.get(r.branches.main).tree); } },
          { label: 'You are back on main', test: (m) => m.git(H + '/game').head.ref === 'main' },
          { label: 'Checked the folder with ls on main', test: (m) => m.ran(/^ls/) && m.git(H + '/game').head.ref === 'main' },
        ],
        hints: ['`git switch -c feature/score` creates and moves you.', 'Create, add, commit the file, then `git switch main`.'],
        solution: ['git switch -c feature/score', 'echo "score = 0" > score.py', 'git add score.py', 'git commit -m "Add score"', 'git switch main', 'ls'],
        recall: [
          { type: 'type', q: 'Which command creates a branch called `fix` and switches to it? (full command)', accept: ['git switch -c fix', 'git checkout -b fix'], why: '`-c` means create. The older equivalent is `git checkout -b`.' },
          { type: 'choice', q: 'You commit on branch `feature`, then switch to `main`. Where is your commit?', options: ['On main too', 'Lost', 'Only on feature', 'In the staging area'], answer: 2, why: 'Commits belong to the branch they were made on until you merge them.' },
        ],
      },
      {
        id: 'git-merge', title: 'Merging branches', skill: 'Branching', xp: 35, diff: 2, kind: 'terminal',
        read: `
# Bringing work together

\`git merge <branch>\` brings that branch's commits into the one you are on. There are two flavours.

**Fast-forward**: \`main\` has not moved since the branch was created, so Git just slides the \`main\` label forward. No new commit.

~~~
A---B  main                A---B---C  main, feature
     \\                          
      C  feature    =>    
~~~

**Three-way merge**: both branches have new commits, so Git creates a **merge commit** with two parents.

~~~
A---B---D  main            A---B---D---E  main  (E = merge commit)
     \\                          \\     /
      C  feature    =>          C---+  
~~~

~~~bash
git switch main               # merge INTO the branch you are on
git merge feature/login
git log --oneline --graph     # draw the history
git branch -d feature/login   # tidy up
~~~

> [!tip] Key idea
> Always switch to the branch that should **receive** the changes first. The merge brings the other branch in.
`,
        task: 'You are on `main`. Merge `feature/login` (it fast-forwards), then merge `feature/help` (a real merge commit). Look at the graph, then delete the merged `feature/login` branch.',
        intro: 'You are on main in ~/site. Two feature branches are waiting. Run: git branch',
        setup(m) {
          base(m);
          m.seedRepo('site', [{ msg: 'Add homepage', files: { 'index.html': '<h1>Home</h1>\n' } }]);
          m.cwd = H + '/site';
          m.run(['git switch -c feature/login', 'echo "<form></form>" > login.html', 'git add login.html', 'git commit -m "Add login page"', 'git switch main', 'git switch -c feature/help', 'echo "# Help" > help.md', 'git add help.md', 'git commit -m "Add help page"', 'git switch main']);
        },
        checks: [
          { label: 'main contains login.html', test: (m) => { const r = m.git(H + '/site'); return 'login.html' in m.objects.get(r.branches.main).tree; } },
          { label: 'main contains help.md', test: (m) => { const r = m.git(H + '/site'); return 'help.md' in m.objects.get(r.branches.main).tree; } },
          { label: 'A merge commit exists on main', test: (m) => m.gitLog(H + '/site').some((c) => c.parents.length === 2) },
          { label: 'Viewed the history graph', test: (m) => m.ran(/^git log.*--graph/) },
          { label: 'Branch feature/login deleted', test: (m) => !m.git(H + '/site').branches['feature/login'] },
        ],
        hints: ['You are already on main. `git merge feature/login` first.', '`git merge feature/help` creates a merge commit automatically.', '`git branch -d feature/login` only works once it is merged.'],
        solution: ['git merge feature/login', 'git merge feature/help', 'git log --oneline --graph', 'git branch -d feature/login'],
        recall: [
          { type: 'choice', q: 'When does a merge create a new merge commit?', options: ['Always', 'When both branches have new commits (histories diverged)', 'Only with --force', 'Never; Git rewrites history'], answer: 1, why: 'If the target can simply move forward, it is a fast-forward and no merge commit is needed.' },
          { type: 'choice', q: 'You want `feature` merged into `main`. Which is right?', options: ['On feature: git merge main', 'On main: git merge feature', 'On any branch: git merge', 'git push feature main'], answer: 1, why: 'Merge pulls the named branch *into the one you are currently on*.' },
        ],
      },
      {
        id: 'git-conflict', title: 'Resolving merge conflicts', skill: 'Branching', xp: 45, diff: 3, kind: 'terminal',
        read: `
# Conflicts are normal

If two branches change **the same lines**, Git cannot decide which version wins, so it stops and asks you.

~~~bash
git merge spicy
# CONFLICT (content): Merge conflict in menu.txt
# Automatic merge failed; fix conflicts and then commit the result.
~~~

Open the file. Git marked both versions:

~~~
Coffee
<<<<<<< HEAD
Matcha            <- your branch (the one you are on)
=======
Chai              <- the incoming branch
>>>>>>> spicy
Cake
~~~

## Resolving

1. Edit the file to what it **should** be. Delete all three marker lines and keep whatever combination is right.
2. \`git add <file>\` to mark it resolved.
3. \`git commit\` to finish the merge.

~~~bash
nano menu.txt        # edit in the sandbox editor, then Save
git add menu.txt
git commit -m "Merge spicy: keep both drinks"
~~~

Changed your mind? \`git merge --abort\` rewinds to before the merge.

> [!tip] Key idea
> A conflict is not an error. It is Git asking a human to make a decision only a human can make. \`git status\` lists the files that still need your attention.
`,
        task: 'Merge `spicy` into `main`. It will conflict in `menu.txt`. Edit the file so it keeps **both** Chai and Matcha with no conflict markers, then `git add` it and commit the merge.',
        intro: 'You are on main in ~/cafe. Branch "spicy" disagrees with you about the menu.',
        setup(m) {
          base(m);
          m.seedRepo('cafe', [{ msg: 'Add menu', files: { 'menu.txt': 'Coffee\nTea\nCake\n' } }]);
          m.cwd = H + '/cafe';
          m.run(['git switch -c spicy']);
          m.write(H + '/cafe/menu.txt', 'Coffee\nChai\nCake\n');
          m.run(['git commit -am "Swap tea for chai"', 'git switch main']);
          m.write(H + '/cafe/menu.txt', 'Coffee\nMatcha\nCake\n');
          m.run(['git commit -am "Swap tea for matcha"']);
        },
        checks: [
          { label: 'Ran the merge and hit the conflict', test: (m) => m.cmds.some((c) => /^git merge spicy/.test(c.line) && !c.ok) },
          { label: 'menu.txt has no conflict markers', test: (m) => noMarkers(m.read(H + '/cafe/menu.txt')) && (m.read(H + '/cafe/menu.txt') || '').length > 0 },
          { label: 'menu.txt keeps both Chai and Matcha', test: (m) => /Chai/.test(m.read(H + '/cafe/menu.txt') || '') && /Matcha/.test(m.read(H + '/cafe/menu.txt') || '') },
          { label: 'The merge is committed (a commit with two parents)', test: (m) => { const l = m.gitLog(H + '/cafe'); return l.length > 0 && l[0].parents.length === 2; } },
          { label: 'Working tree is clean', test: (m) => clean(m, H + '/cafe') },
        ],
        hints: ['Run `git merge spicy`, then `git status` to see which file conflicted.', '`nano menu.txt`, delete the `<<<<<<<`, `=======` and `>>>>>>>` lines, keep Chai and Matcha, then Save.', 'Finish with `git add menu.txt` and `git commit -m "Merge spicy"`.'],
        solution: ['git merge spicy', { write: 'menu.txt', content: 'Coffee\nChai\nMatcha\nCake\n' }, 'git add menu.txt', 'git commit -m "Merge spicy: keep chai and matcha"'],
        recall: [
          { type: 'choice', q: 'What do the `<<<<<<<` / `=======` / `>>>>>>>` lines mean?', options: ['A syntax error', 'Git marking the two competing versions of a conflicted section', 'A comment', 'Deleted lines'], answer: 1, why: 'Everything between `<<<<<<<` and `=======` is yours; between `=======` and `>>>>>>>` is theirs. Edit the file and remove the markers.' },
          { type: 'type', q: 'Which command abandons a merge that went wrong? (full command)', accept: ['git merge --abort'], why: '`git merge --abort` restores the state from before you started the merge.' },
        ],
      },
      {
        id: 'git-undo', title: 'Undoing mistakes', skill: 'Undo', xp: 40, diff: 3, kind: 'terminal',
        read: `
# Everyone makes mistakes

The right undo depends on **where** the mistake is.

| Situation | Command |
|---|---|
| Edited a file, want the last committed version | \`git restore <file>\` |
| Staged a file by accident | \`git restore --staged <file>\` |
| A commit was a mistake, **safe** for shared history | \`git revert <commit>\` |
| Rewind your own *local* commits | \`git reset --soft HEAD~1\` (keeps changes staged) |

~~~bash
git restore notes.txt            # throw away uncommitted edits (cannot be undone!)
git restore --staged draft.txt   # unstage but keep the file
git revert HEAD --no-edit        # make a NEW commit that undoes the last one
~~~

\`revert\` is the safe one: it adds a commit that cancels an earlier one, so history is preserved and anyone who already has the old commit is not affected.

\`reset\` moves the branch backwards and *rewrites* history. Fine locally, dangerous once pushed.

> [!warn] \`git restore <file>\` is permanent
> Uncommitted work is not in any snapshot, so Git cannot bring it back. Be sure.

> [!tip] Order
> \`revert\` needs a clean tree. Clean up uncommitted changes first.
`,
        task: 'Fix three mistakes: (1) discard the junk typed into `notes.txt`, (2) unstage `draft.txt` but keep the file, (3) undo the bad last commit (`oops.txt`) safely with `git revert`.',
        intro: 'You are in ~/journal. Run git status and git log --oneline to survey the damage.',
        setup(m) {
          base(m);
          m.seedRepo('journal', [
            { msg: 'Add notes', files: { 'notes.txt': 'day one\n' } },
            { msg: 'Add todo', files: { 'todo.txt': 'ship it\n' } },
            { msg: 'Add oops.txt (mistake)', files: { 'oops.txt': 'oops\n' } },
          ]);
          m.cwd = H + '/journal';
          m.write(H + '/journal/notes.txt', 'day one\nGARBAGE TYPED BY MISTAKE\n');
          m.write(H + '/journal/draft.txt', 'half-baked idea\n');
          m.run(['git add draft.txt']);
        },
        checks: [
          { label: 'notes.txt is back to its committed text', test: (m) => m.read(H + '/journal/notes.txt') === 'day one\n' },
          { label: 'draft.txt is unstaged but the file still exists', test: (m) => { const r = m.git(H + '/journal'); return !r.index.has('draft.txt') && m.read(H + '/journal/draft.txt') !== null; } },
          { label: 'A Revert commit removed oops.txt', test: (m) => { const l = m.gitLog(H + '/journal'); return l.length > 0 && /^Revert/.test(l[0].msg) && !('oops.txt' in l[0].tree); } },
          { label: 'History was kept (4 commits)', test: (m) => m.gitLog(H + '/journal').length === 4 },
        ],
        hints: ['`git restore notes.txt` discards the edit.', '`git restore --staged draft.txt` unstages it.', '`git revert HEAD --no-edit` (do the two restores first, as revert needs a clean tree).'],
        solution: ['git status', 'git restore notes.txt', 'git restore --staged draft.txt', 'git revert HEAD --no-edit', 'git log --oneline'],
        recall: [
          { type: 'choice', q: 'Which undo is safest for a commit you already pushed?', options: ['git reset --hard HEAD~1', 'git revert <commit>', 'rm -rf .git', 'git restore .'], answer: 1, why: '`revert` adds a new commit that cancels the old one without rewriting shared history.' },
          { type: 'type', q: 'Which command unstages `file.txt` but keeps your edits? (full command)', accept: ['git restore --staged file.txt', 'git reset file.txt', 'git reset head file.txt'], why: '`git restore --staged <file>` removes it from the staging area only.' },
        ],
      },
      {
        id: 'git-stash', title: 'Stash: park unfinished work', skill: 'Undo', xp: 35, diff: 2, kind: 'terminal',
        read: `
# "Drop everything, there's a bug!"

You are halfway through a feature and need to fix something urgent. You are not ready to commit, and you cannot switch tasks with a dirty tree. **Stash** it.

~~~bash
git stash          # shelve all uncommitted changes; tree is clean again
# ...do the urgent fix, commit it...
git stash pop      # bring the shelved changes back (and remove from the stash)
git stash list     # see what is parked
~~~

Think of the stash as a clipboard for your working directory.

> [!tip] Key idea
> \`pop\` re-applies the changes and drops the entry. \`apply\` re-applies but keeps the entry. If you stash a lot, \`git stash list\` shows them newest first.
`,
        task: '`app.py` has unfinished changes. Stash them, commit a new file `hotfix.txt` while the tree is clean, then pop the stash so your half-finished work returns.',
        intro: 'You are in ~/app with uncommitted edits in app.py.',
        setup(m) {
          base(m);
          m.seedRepo('app', [{ msg: 'Initial app', files: { 'app.py': 'print("v1")\n' } }]);
          m.cwd = H + '/app';
          m.write(H + '/app/app.py', 'print("v1")\nprint("half-finished feature")\n');
        },
        checks: [
          { label: 'Stashed the work (git stash)', test: (m) => m.ran(/^git stash( push)?$/) },
          { label: 'hotfix.txt was committed', test: (m) => { const l = m.gitLog(H + '/app'); return l.length === 2 && 'hotfix.txt' in l[0].tree; } },
          { label: 'The hotfix commit did not include your unfinished app.py edit', test: (m) => { const l = m.gitLog(H + '/app'); return l.length > 0 && l[0].tree['app.py'] === 'print("v1")\n'; } },
          { label: 'Popped the stash (git stash pop)', test: (m) => m.ran(/^git stash pop/) },
          { label: 'Your half-finished feature is back in app.py', test: (m) => /half-finished feature/.test(m.read(H + '/app/app.py') || '') },
        ],
        hints: ['`git stash` first.', 'Create `hotfix.txt` (e.g. `echo "fixed" > hotfix.txt`), `git add`, `git commit`.', '`git stash pop` brings your edits back.'],
        solution: ['git stash', 'echo "fixed" > hotfix.txt', 'git add hotfix.txt', 'git commit -m "Hotfix"', 'git stash pop'],
        recall: [
          { type: 'type', q: 'Which command re-applies stashed changes and removes them from the stash? (full command)', accept: ['git stash pop'], why: '`pop` = apply + drop. `git stash apply` keeps the entry.' },
          { type: 'choice', q: 'What does `git stash` do to your working directory?', options: ['Deletes your changes forever', 'Shelves uncommitted changes and gives you a clean tree', 'Commits them', 'Pushes them to GitHub'], answer: 1, why: 'Changes are saved on a stack and can be brought back with pop/apply.' },
        ],
      },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
