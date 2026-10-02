/* Git, GitHub CLI and Docker reference. Examples are run in the sandbox by tests/reference.test.js.
 * Entry: { name, sig, desc, ex (shell lines), setup, group, lesson, sandbox:false when the sandbox cannot run it }. */
(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  const H = '/home/learner';
  const ME = 'collinkirklandtamu';
  const URL = `https://github.com/${ME}/proj`;
  const base = (m) => { m.configureIdentity(); m.globalConfig['init.defaultbranch'] = 'main'; };
  const repo = (m) => {
    base(m);
    m.seedRepo('proj', [{ msg: 'Add app', files: { 'app.py': 'print("v1")\n' } }, { msg: 'Add readme', files: { 'README.md': '# proj\n' } }, { msg: 'Fix typo', files: { 'README.md': '# project\n' } }]);
    m.cwd = H + '/proj';
    m.run(['git switch -c feature', 'echo f > f.txt', 'git add f.txt', 'git commit -m "Add f"', 'git switch main']);
  };
  const remote = (m) => {
    base(m);
    m.seedRemote(URL, [{ msg: 'Add app', files: { 'app.py': 'print("v1")\n' } }, { msg: 'Add readme', files: { 'README.md': '# proj\n' } }]);
    m.cwd = H;
    m.run([`git clone ${URL}`, 'cd proj']);
  };
  const topic = (m) => {
    remote(m);
    m.run(['git switch -c topic', 'echo t > t.txt', 'git add t.txt', 'git commit -m "Add t"', 'git push -u origin topic', 'gh pr create --title "Add t" --body "Adds t"']);
  };
  const dirty = (m) => { repo(m); m.write(H + '/proj/app.py', 'print("v2")\n'); m.write(H + '/proj/new.txt', 'new\n'); };
  const staged = (m) => { repo(m); m.write(H + '/proj/app.py', 'print("v2")\n'); m.run(['git add app.py']); };
  const bare = () => {};
  const web = (m) => {
    m.write(H + '/app/app.py', 'print("app")\n');
    m.write(H + '/app/Dockerfile', 'FROM python:3.12-slim\nWORKDIR /app\nCOPY app.py .\nCMD ["python", "app.py"]\n');
    m.write(H + '/site/index.html', '<h1>hi</h1>\n');
    m.cwd = H + '/app';
    m.run(['docker run -d --name web -p 8080:80 nginx', 'docker run --name old alpine echo done', 'docker build -t app:1.0 .', 'docker volume create data', 'docker network create appnet']);
  };
  const upstream = (m) => { base(m); m.seedRemote('https://github.com/ada/tools', [{ msg: 'Start', files: { 'a.txt': '1\n' } }]); m.cwd = H; };
  LP.referenceSetups = { upstream, repo, remote, topic, dirty, staged, docker: bare, web };

  const G = (group, rows) => rows.map(([name, sig, desc, ex, setup, lesson]) => ({ name, sig, desc, ex, setup: setup || 'repo', group, lesson }));
  const NO = (group, rows) => rows.map(([name, sig, desc]) => ({ name, sig, desc, group, sandbox: false }));

  const git = [].concat(
    G('Start', [
      ['git init', 'git init [dir]', 'Turn a folder into a repository.', 'mkdir fresh\ncd fresh\ngit init', 'docker', 'git-setup'],
      ['git config', 'git config [--global] key value', 'Read or set configuration (name, email, aliases).', 'git config user.name "Ada"\ngit config user.name', 'repo', 'git-setup'],
      ['git clone', 'git clone <url> [dir]', 'Copy a remote repository.', `cd ..\ngit clone ${URL} copy`, 'remote', 'gh-clone'],
    ]),
    G('Snapshot', [
      ['git status', 'git status [-s]', 'What changed, what is staged.', 'git status', 'dirty', 'git-commit'],
      ['git add', 'git add <paths> | .', 'Stage changes for the next commit.', 'git add app.py\ngit status -s', 'dirty', 'git-commit'],
      ['git commit', 'git commit -m "msg" [-a] [--amend]', 'Record a snapshot.', 'git commit -m "Update app"', 'staged', 'git-commit'],
      ['git commit --amend', 'git commit --amend -m "msg"', 'Replace the last commit (only unpublished ones!).', 'git commit --amend -m "Better message"', 'repo', 'git-undo'],
      ['git diff', 'git diff [--staged] [a b]', 'Show changes (unstaged by default).', 'git diff', 'dirty', 'git-inspect'],
      ['git rm', 'git rm <file>', 'Delete a tracked file and stage the deletion.', 'git rm app.py', 'repo', 'git-commit'],
      ['git mv', 'git mv <old> <new>', 'Rename or move a tracked file.', 'git mv app.py main.py', 'repo', 'git-commit'],
      ['git restore', 'git restore [--staged] <paths>', 'Discard edits, or unstage.', 'git restore app.py', 'dirty', 'git-undo'],
      ['git clean', 'git clean -n | -f [-d]', 'Delete untracked files (dry-run with -n first).', 'git clean -n', 'dirty', 'git-undo'],
      ['.gitignore', 'echo "*.log" >> .gitignore', 'Patterns Git should not track (not a command; a file).', 'echo "*.log" > .gitignore\necho x > a.log\ngit status -s', 'repo', 'git-ignore'],
    ]),
    G('History', [
      ['git log', 'git log [--oneline] [--graph] [-n]', 'Show commit history.', 'git log --oneline', 'repo', 'git-inspect'],
      ['git log --graph', 'git log --oneline --graph --all', 'Draw the branch structure.', 'git log --oneline --graph --all', 'repo', 'git-merge'],
      ['git log --author', 'git log --author=<name>', 'Filter by author.', 'git log --oneline --author=Learner', 'repo', 'git-inspect'],
      ['git log --grep', 'git log --grep=<text>', 'Filter by message.', 'git log --oneline --grep=typo', 'repo', 'git-inspect'],
      ['git log -p', 'git log -p [-n] [-- path]', 'Show the patch of each commit.', 'git log -p -1', 'repo', 'git-inspect'],
      ['git log --stat', 'git log --stat', 'Files changed per commit.', 'git log --stat -2', 'repo', 'git-inspect'],
      ['git show', 'git show <rev>', 'Show one commit (or tag).', 'git show HEAD', 'repo', 'git-inspect'],
      ['git shortlog', 'git shortlog -sn', 'Commits per author.', 'git shortlog -sn', 'repo', 'git-inspect'],
      ['git blame', 'git blame <file>', 'Who last changed each line.', 'git blame README.md', 'repo', 'git-inspect'],
      ['git reflog', 'git reflog', 'Journal of where HEAD has been (rescue lost commits).', 'git reflog', 'repo', 'git-reflog'],
      ['git bisect', 'git bisect start|good|bad|reset', 'Binary-search history for a bad commit.', 'git bisect start\ngit bisect bad\ngit bisect good HEAD~2\ngit bisect reset', 'repo', 'git-reflog'],
    ]),
    G('Branches & merging', [
      ['git branch', 'git branch [-d|-m] [name]', 'List, create, rename or delete branches.', 'git branch', 'repo', 'git-branch'],
      ['git switch', 'git switch [-c] <branch>', 'Move to (or create) a branch.', 'git switch feature', 'repo', 'git-branch'],
      ['git checkout', 'git checkout <branch|commit|-- file>', 'Older all-in-one: switch branches or restore files.', 'git checkout feature', 'repo', 'git-branch'],
      ['git merge', 'git merge <branch> [--no-ff|--abort]', 'Bring another branch into this one.', 'git merge feature', 'repo', 'git-merge'],
      ['git rebase', 'git rebase <base>', 'Replay your commits on top of another base (linear history).', 'git switch feature\ngit rebase main', 'repo', 'git-rebase'],
      ['git cherry-pick', 'git cherry-pick <commit>', 'Copy one commit onto this branch.', 'git cherry-pick feature', 'repo', 'git-merge'],
      ['git stash', 'git stash [push|pop|list|apply]', 'Shelve uncommitted work.', 'git stash\ngit stash list\ngit stash pop', 'dirty', 'git-stash'],
      ['git tag', 'git tag [-a name -m msg]', 'Name a commit (releases).', 'git tag -a v1.0 -m "First"\ngit tag', 'repo', 'git-inspect'],
    ]),
    G('Undo', [
      ['git reset', 'git reset [--soft|--mixed|--hard] <rev>', 'Move the branch; --hard also discards changes.', 'git reset --hard HEAD~1', 'repo', 'git-undo'],
      ['git reset --soft', 'git reset --soft HEAD~1', 'Undo the commit but keep its changes staged.', 'git reset --soft HEAD~1\ngit status -s', 'repo', 'git-undo'],
      ['git revert', 'git revert <commit>', 'Add a new commit that undoes an old one (safe for shared history).', 'git revert HEAD --no-edit', 'repo', 'git-undo'],
    ]),
    G('Remotes', [
      ['git remote', 'git remote [-v|add|remove|set-url]', 'Manage named remotes.', 'git remote -v', 'remote', 'gh-remote'],
      ['git fetch', 'git fetch [remote]', 'Download remote changes without merging.', 'git fetch', 'remote', 'gh-clone'],
      ['git pull', 'git pull [--rebase]', 'Fetch and integrate remote changes.', 'git pull', 'remote', 'gh-clone'],
      ['git push', 'git push [-u] [remote] [branch]', 'Upload commits.', 'git push', 'remote', 'gh-rejected'],
      ['git push -u', 'git push -u origin <branch>', 'Push and remember the upstream branch.', 'git switch -c work\necho w > w.txt\ngit add w.txt\ngit commit -m "Work"\ngit push -u origin work', 'remote', 'gh-remote'],
      ['git push --tags', 'git push origin <tag> | --tags', 'Upload tags (not pushed by default).', 'git tag -a v1.0 -m "First"\ngit push origin v1.0', 'remote', 'git-inspect'],
    ]),
    G('GitHub CLI (gh)', [
      ['gh repo create', 'gh repo create <name> [--public] [--source . --push]', 'Create a GitHub repository.', 'gh repo create newrepo --public', 'remote', 'gh-remote'],
      ['gh repo fork', 'gh repo fork <owner/repo> [--clone]', 'Fork someone else\'s repository.', 'gh repo fork ada/tools', 'upstream', 'gh-fork'],
      ['gh repo view', 'gh repo view [owner/repo]', 'Show repository details.', 'gh repo view', 'remote', 'gh-fork'],
      ['gh pr create', 'gh pr create --title t --body b', 'Open a pull request for the current branch.', 'git switch -c add-x\necho x > x.txt\ngit add x.txt\ngit commit -m "Add x"\ngit push -u origin add-x\ngh pr create --title "Add x" --body "Adds x"', 'remote', 'gh-pr'],
      ['gh pr list', 'gh pr list [--state all]', 'List pull requests.', 'gh pr list', 'topic', 'gh-pr'],
      ['gh pr view', 'gh pr view [number]', 'Read a pull request.', 'gh pr view 1', 'topic', 'gh-review'],
      ['gh pr comment', 'gh pr comment [n] --body text', 'Comment on a pull request.', 'gh pr comment 1 --body "Looks good"', 'topic', 'gh-review'],
      ['gh pr review', 'gh pr review [n] --approve|--request-changes|--comment', 'Review a pull request.', 'gh pr review 1 --comment --body "Nice"', 'topic', 'gh-review'],
      ['gh pr merge', 'gh pr merge [n] [--merge|--squash|--rebase]', 'Merge a pull request.', 'gh pr merge 1 --squash', 'topic', 'gh-pr'],
      ['gh pr close', 'gh pr close [n]', 'Close without merging.', 'gh pr close 1', 'topic', 'gh-review'],
      ['gh issue create', 'gh issue create --title t --body b', 'File an issue.', 'gh issue create --title "Bug" --body "It breaks"', 'remote', 'gh-issues'],
      ['gh issue list', 'gh issue list', 'List open issues.', 'gh issue create --title "Bug" --body "x"\ngh issue list', 'remote', 'gh-issues'],
      ['gh issue close', 'gh issue close <n>', 'Close an issue.', 'gh issue create --title "Bug" --body "x"\ngh issue close 1', 'remote', 'gh-issues'],
      ['gh release create', 'gh release create <tag> --title t --notes n', 'Publish a release for a tag.', 'gh release create v1.0.0 --title "One" --notes "First"', 'remote', 'gh-pr'],
      ['gh release list', 'gh release list', 'List releases.', 'gh release create v1.0.0 --title "One" --notes "First"\ngh release list', 'remote', 'gh-pr'],
    ]),
    NO('Not in the sandbox (real Git only)', [
      ['git submodule', 'git submodule add <url>', 'Nest another repository inside this one.'],
      ['git worktree', 'git worktree add <path> <branch>', 'Check out several branches at once in separate folders.'],
      ['git rebase -i', 'git rebase -i HEAD~3', 'Interactively reorder, squash and edit commits (opens an editor).'],
      ['git bisect run', 'git bisect run <script>', 'Automate bisect with a test script.'],
      ['git filter-repo', 'git filter-repo --path ...', 'Rewrite the whole history (remove a file everywhere).'],
      ['gh run list', 'gh run list / gh run view', 'Inspect GitHub Actions runs.'],
    ]),
  );

  const D = (group, rows) => rows.map(([name, sig, desc, ex, setup, lesson]) => ({ name, sig, desc, ex, setup: setup || 'docker', group, lesson }));
  const dockerRef = [].concat(
    D('Containers', [
      ['docker run', 'docker run [-d] [--name n] [-p h:c] [-e K=V] [-v v:/p] image [cmd]', 'Create and start a container.', 'docker run -d --name demo -p 9090:80 nginx', 'docker', 'dk-hello'],
      ['docker run --rm', 'docker run --rm image cmd', 'Run once and delete the container afterwards.', 'docker run --rm alpine echo hello', 'docker', 'dk-lifecycle'],
      ['docker ps', 'docker ps [-a]', 'List running (or all) containers.', 'docker ps -a', 'web', 'dk-lifecycle'],
      ['docker stop', 'docker stop <name>', 'Stop gracefully.', 'docker stop web', 'web', 'dk-lifecycle'],
      ['docker start', 'docker start <name>', 'Start a stopped container.', 'docker start old', 'web', 'dk-lifecycle'],
      ['docker restart', 'docker restart <name>', 'Stop then start.', 'docker restart web', 'web', 'dk-lifecycle'],
      ['docker kill', 'docker kill <name>', 'Stop immediately (SIGKILL).', 'docker kill web', 'web', 'dk-lifecycle'],
      ['docker rm', 'docker rm [-f] <name>', 'Delete a container.', 'docker rm old', 'web', 'dk-lifecycle'],
      ['docker logs', 'docker logs [-f] <name>', 'Show a container\'s output.', 'docker logs old', 'web', 'dk-debug'],
      ['docker exec', 'docker exec <name> cmd', 'Run a command inside a running container.', 'docker exec web ls /usr/share/nginx/html', 'web', 'dk-debug'],
      ['docker inspect', 'docker inspect <name|image>', 'Full configuration as JSON.', 'docker inspect web', 'web', 'dk-debug'],
      ['docker cp', 'docker cp <container:path> <dest>', 'Copy files between host and container.', 'docker cp web:/usr/share/nginx/html/index.html .', 'web', 'dk-debug'],
      ['docker stats', 'docker stats [--no-stream]', 'Live CPU/memory per container.', 'docker stats --no-stream', 'web', 'dk-limits'],
      ['docker run --restart', 'docker run --restart always|on-failure:3 ...', 'Restart policy after a crash or reboot.', 'docker run -d --restart always --name keep nginx', 'docker', 'dk-debug'],
      ['docker run --memory', 'docker run --memory 256m --cpus 0.5 ...', 'Resource limits.', 'docker run -d --memory 256m --cpus 0.5 --name capped alpine sleep 300', 'docker', 'dk-limits'],
      ['docker container prune', 'docker container prune', 'Remove all stopped containers.', 'docker container prune', 'web', 'dk-lifecycle'],
    ]),
    D('Images', [
      ['docker pull', 'docker pull image[:tag]', 'Download an image.', 'docker pull redis', 'docker', 'dk-hello'],
      ['docker images', 'docker images', 'List local images.', 'docker images', 'web', 'dk-hello'],
      ['docker build', 'docker build -t name:tag [-f file] [--target stage] <context>', 'Build an image from a Dockerfile.', 'docker build -t app:2.0 .', 'web', 'dk-build'],
      ['docker rmi', 'docker rmi <image>', 'Delete an image.', 'docker rmi app:1.0', 'web', 'dk-build'],
      ['docker tag', 'docker tag <src> <dest>', 'Give an image another name.', 'docker tag app:1.0 collinkirklandtamu/app:1.0', 'web', 'dk-build'],
      ['docker login', 'docker login -u <user>', 'Authenticate to a registry.', 'docker login -u collinkirklandtamu -p x', 'docker', 'dk-build'],
      ['docker push', 'docker push <user/name:tag>', 'Upload an image to a registry.', 'docker tag app:1.0 collinkirklandtamu/app:1.0\ndocker login -u collinkirklandtamu -p x\ndocker push collinkirklandtamu/app:1.0', 'web', 'dk-build'],
    ]),
    D('Volumes & networks', [
      ['docker volume create', 'docker volume create <name>', 'Create a named volume.', 'docker volume create notes', 'docker', 'dk-env-volumes'],
      ['docker volume ls', 'docker volume ls', 'List volumes.', 'docker volume ls', 'web', 'dk-env-volumes'],
      ['docker volume rm', 'docker volume rm <name>', 'Delete a volume.', 'docker volume rm data', 'web', 'dk-env-volumes'],
      ['docker run -v', 'docker run -v <volume|/host/path>:/container/path[:ro]', 'Mount a volume or a host folder.', 'docker run -d --name store -v data:/data redis', 'web', 'dk-env-volumes'],
      ['docker network create', 'docker network create <name>', 'Create a user-defined network (container DNS).', 'docker network create backend', 'docker', 'dk-network'],
      ['docker network ls', 'docker network ls', 'List networks.', 'docker network ls', 'web', 'dk-network'],
      ['docker network connect', 'docker network connect <net> <container>', 'Attach a container to a network.', 'docker network connect appnet web', 'web', 'dk-network'],
      ['docker network inspect', 'docker network inspect <net>', 'Show a network and its containers.', 'docker network inspect appnet', 'web', 'dk-network'],
    ]),
    D('Compose', [
      ['docker compose up', 'docker compose up [-d] [--build] [--profile p]', 'Create and start all services.', 'cd ../site\necho "services:" > docker-compose.yml\necho "  web:" >> docker-compose.yml\necho "    image: nginx:alpine" >> docker-compose.yml\ndocker compose up -d', 'web', 'dk-compose'],
      ['docker compose ps', 'docker compose ps', 'Status of this project\'s services.', 'cd ../site\necho "services:" > docker-compose.yml\necho "  web:" >> docker-compose.yml\necho "    image: nginx:alpine" >> docker-compose.yml\ndocker compose up -d\ndocker compose ps', 'web', 'dk-compose'],
      ['docker compose down', 'docker compose down [-v]', 'Stop and remove the project (and volumes with -v).', 'cd ../site\necho "services:" > docker-compose.yml\necho "  web:" >> docker-compose.yml\necho "    image: nginx:alpine" >> docker-compose.yml\ndocker compose up -d\ndocker compose down', 'web', 'dk-compose'],
    ]),
    D('Dockerfile instructions', [
      ['FROM', 'FROM image[:tag] [AS stage]', 'Base image (first instruction); AS names a stage.', 'cat Dockerfile', 'web', 'dk-dockerfile'],
      ['WORKDIR', 'WORKDIR /app', 'Working directory for later instructions.', 'cat Dockerfile', 'web', 'dk-dockerfile'],
      ['COPY', 'COPY [--from=stage] src dest', 'Copy files into the image.', 'cat Dockerfile', 'web', 'dk-dockerfile'],
      ['RUN', 'RUN command', 'Run a command at build time (adds a layer).', 'cat Dockerfile', 'web', 'dk-dockerfile'],
      ['CMD', 'CMD ["exe", "arg"]', 'Default command when a container starts.', 'cat Dockerfile', 'web', 'dk-dockerfile'],
      ['ENV', 'ENV KEY=value', 'Set an environment variable in the image.', 'cat Dockerfile', 'web', 'dk-dockerfile'],
      ['EXPOSE', 'EXPOSE 8000', 'Document the port the app listens on.', 'cat Dockerfile', 'web', 'dk-dockerfile'],
      ['HEALTHCHECK', 'HEALTHCHECK --interval=30s CMD curl -f http://localhost/ || exit 1', 'How Docker tests that the app works.', 'cat Dockerfile', 'web', 'dk-health'],
      ['.dockerignore', 'node_modules/\n.env', 'Files excluded from the build context.', 'cat Dockerfile', 'web', 'dk-build'],
    ]),
    NO('Not in the sandbox (real Docker only)', [
      ['docker swarm', 'docker swarm init', 'Cluster mode orchestration.'],
      ['docker buildx', 'docker buildx build --platform ...', 'Multi-platform builds.'],
      ['docker system prune', 'docker system prune -a', 'Remove unused data of every kind.'],
      ['docker compose logs -f', 'docker compose logs -f', 'Stream service logs (the sandbox returns control instead).'],
    ]),
  );

  (LP.reference = LP.reference || {}).git = git;
  LP.reference.docker = dockerRef;
})(typeof window !== 'undefined' ? window : globalThis);
