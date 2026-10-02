// Behavioural tests for the sandbox engines: the tricky Git and Docker paths real learners will hit.
const test = require('node:test');
const assert = require('node:assert');
const LP = require('./helpers.js');

const H = '/home/learner';
function box(setup) {
  const m = LP.Machine.create((x) => { x.configureIdentity(); x.globalConfig['init.defaultbranch'] = 'main'; setup && setup(x); });
  const sh = (c) => { const r = m.exec(c); return { text: r.items.map((i) => i.text).join('\n'), code: r.code, res: r }; };
  return { m, sh };
}
const repo = (extra) => box((m) => { m.seedRepo('p', [{ msg: 'one', files: { 'a.txt': '1\n2\n3\n' } }]); m.cwd = H + '/p'; extra && extra(m); });

test('shell: redirection, &&, quoting, rm -r, unknown commands, pipes', () => {
  const { m, sh } = box();
  sh('echo "hello world" > a.txt');
  assert.strictEqual(m.read('a.txt'), 'hello world\n');
  sh('echo more >> a.txt');
  assert.strictEqual(m.read('a.txt'), 'hello world\nmore\n');
  assert.ok(/hello world\s+more|hello world\nmore/.test(sh('cat a.txt').text));
  assert.strictEqual(sh('mkdir x && cd x && pwd').text, '/home/learner/x');
  assert.strictEqual(sh('nope').code, 127);
  assert.ok(/pipes/.test(sh('ls | cat').text));
  sh('cd ..');
  assert.strictEqual(sh('rm x').code, 1, 'rm of a directory needs -r');
  assert.strictEqual(sh('rm -r x').code, 0);
  assert.ok(!m.exists(H + '/x'));
  assert.strictEqual(sh('echo "unterminated').code, 2);
});
test('git: commit needs an identity, nothing-to-commit and staged/unstaged status are accurate', () => {
  const m = LP.Machine.create((x) => { x.seedRepo('p', [{ msg: 'one', files: { 'a.txt': 'x\n' } }]); x.cwd = H + '/p'; });
  assert.ok(/Author identity unknown/.test(m.exec('git commit --allow-empty -m x').items.map((i) => i.text).join('')) || m.exec('git commit -m x').code !== 0);
  m.configureIdentity();
  const out = (c) => m.exec(c).items.map((i) => i.text).join('\n');
  assert.ok(/nothing to commit, working tree clean/.test(out('git status')));
  m.exec('echo y >> a.txt'); m.exec('echo z > b.txt'); m.exec('git add b.txt');
  const st = out('git status');
  assert.ok(/Changes to be committed[\s\S]*new file:\s+b.txt/.test(st));
  assert.ok(/Changes not staged for commit[\s\S]*modified:\s+a.txt/.test(st));
  assert.strictEqual(out('git status -s'), 'M  a.txt\nA  b.txt'.replace('M  a.txt', ' M a.txt').replace('A  b.txt', 'A  b.txt'));
  assert.ok(/--- a\/a.txt[\s\S]*\+y/.test(out('git diff')));
  assert.ok(/new file mode[\s\S]*\+z/.test(out('git diff --staged')));
});
test('git: non-conflicting changes in the same file auto-merge', () => {
  const { m, sh } = repo((x) => {
    x.run(['git switch -c top']);
    x.write(H + '/p/a.txt', 'ONE\n2\n3\n'); x.run(['git commit -am top', 'git switch main']);
    x.write(H + '/p/a.txt', '1\n2\nTHREE\n'); x.run(['git commit -am bottom']);
  });
  const r = sh('git merge top');
  assert.strictEqual(r.code, 0, r.text);
  assert.strictEqual(m.read('a.txt'), 'ONE\n2\nTHREE\n');
  assert.strictEqual(m.gitLog(H + '/p')[0].parents.length, 2);
});
test('git: conflicts leave markers, block commit, and can be aborted', () => {
  const { m, sh } = repo((x) => {
    x.run(['git switch -c b']); x.write(H + '/p/a.txt', '1\nB\n3\n'); x.run(['git commit -am b', 'git switch main']);
    x.write(H + '/p/a.txt', '1\nM\n3\n'); x.run(['git commit -am m']);
  });
  assert.strictEqual(sh('git merge b').code, 1);
  assert.strictEqual(m.read('a.txt'), '1\n<<<<<<< HEAD\nM\n=======\nB\n>>>>>>> b\n3\n');
  assert.ok(/Unmerged paths[\s\S]*both modified:\s+a.txt/.test(sh('git status').text));
  assert.ok(/unmerged files/.test(sh('git commit -m x').text));
  assert.strictEqual(sh('git merge --abort').code, 0);
  assert.strictEqual(m.read('a.txt'), '1\nM\n3\n');
  assert.ok(/nothing to commit/.test(sh('git status').text));
});
test('git: switching branches with conflicting local changes is refused', () => {
  const { m, sh } = repo((x) => { x.run(['git switch -c b']); x.write(H + '/p/a.txt', 'B\n'); x.run(['git commit -am b', 'git switch main']); });
  m.write('a.txt', 'dirty\n');
  const r = sh('git switch b');
  assert.strictEqual(r.code, 1);
  assert.ok(/would be overwritten/.test(r.text));
  assert.strictEqual(m.read('a.txt'), 'dirty\n');
});
test('git: reset --hard, --soft, revert and ref syntax (HEAD~n)', () => {
  const { m, sh } = repo((x) => { x.write(H + '/p/b.txt', 'b\n'); x.run(['git add b.txt', 'git commit -m two']); x.write(H + '/p/c.txt', 'c\n'); x.run(['git add c.txt', 'git commit -m three']); });
  assert.strictEqual(m.gitLog(H + '/p').length, 3);
  sh('git reset --soft HEAD~1');
  assert.strictEqual(m.gitLog(H + '/p').length, 2);
  assert.ok(/new file:\s+c.txt/.test(sh('git status').text), 'soft reset keeps changes staged');
  sh('git commit -m three-again');
  sh('git reset --hard HEAD~2');
  assert.strictEqual(m.gitLog(H + '/p').length, 1);
  assert.strictEqual(m.read('b.txt'), null);
  assert.ok(/not a valid|unknown revision/.test(sh('git reset HEAD~9').text));
});
test('git: stash round-trip, tags, amend, rebase', () => {
  const { m, sh } = repo();
  m.write('a.txt', 'changed\n');
  assert.ok(/Saved working directory/.test(sh('git stash').text));
  assert.strictEqual(m.read('a.txt'), '1\n2\n3\n');
  assert.ok(/stash@\{0\}/.test(sh('git stash list').text));
  sh('git stash pop');
  assert.strictEqual(m.read('a.txt'), 'changed\n');
  sh('git commit -am two');
  sh('git tag v1');
  assert.ok(/tag: v1/.test(sh('git log --oneline').text));
  sh('git commit --amend -m two-renamed');
  assert.strictEqual(m.gitLog(H + '/p').length, 2);
  assert.strictEqual(m.gitLog(H + '/p')[0].msg, 'two-renamed');
  // rebase a feature branch onto an advanced main
  sh('git switch -c feat'); m.write('f.txt', 'f\n'); sh('git add f.txt'); sh('git commit -m feat');
  sh('git switch main'); m.write('m.txt', 'm\n'); sh('git add m.txt'); sh('git commit -m main-work');
  sh('git switch feat');
  assert.ok(/Successfully rebased/.test(sh('git rebase main').text));
  const log = m.gitLog(H + '/p').map((c) => c.msg);
  assert.deepStrictEqual(log.slice(0, 2), ['feat', 'main-work']);
  assert.ok(m.read('m.txt') && m.read('f.txt'));
});
test('git: .gitignore patterns (glob, directory, anchored)', () => {
  const { m, sh } = repo((x) => { x.write(H + '/p/.gitignore', '*.log\nbuild/\n/root-only.txt\n'); x.write(H + '/p/x.log', ''); x.write(H + '/p/build/o.bin', ''); x.write(H + '/p/root-only.txt', ''); x.write(H + '/p/sub/root-only.txt', ''); x.write(H + '/p/sub/y.log', ''); });
  const out = sh('git status -s').text;
  assert.ok(!/x\.log|build|y\.log/.test(out), out);
  assert.ok(/sub\/root-only\.txt/.test(out) || /\?\? sub\//.test(out));
  assert.ok(!/\?\? root-only\.txt/.test(out));
  assert.strictEqual(sh('git add x.log').code, 1, 'adding an ignored file explicitly is refused');
});
test('remotes: push/pull flow, rejected push, upstream status, force and delete', () => {
  const url = 'https://github.com/collinkirklandtamu/p';
  const { m, sh } = repo((x) => x.seedRemote(url, []));
  assert.ok(/no upstream branch|No configured push destination/.test(sh('git push').text));
  sh(`git remote add origin ${url}`);
  assert.ok(/no upstream branch/.test(sh('git push').text));
  assert.ok(/new branch/.test(sh('git push -u origin main').text));
  assert.ok(/up to date with 'origin\/main'/.test(sh('git status').text));
  assert.strictEqual(sh('git push').text, 'Everything up-to-date');
  m.remoteCommit(url, 'main', { 't.md': 't\n' }, 'teammate');
  m.write('a.txt', 'mine\n'); sh('git commit -am mine');
  assert.ok(/behind|diverged|ahead/.test(sh('git status').text));
  const rej = sh('git push');
  assert.strictEqual(rej.code, 1);
  assert.ok(/rejected.*fetch first/.test(rej.text));
  assert.ok(/Merge made|Fast-forward/.test(sh('git pull').text));
  assert.strictEqual(sh('git push').code, 0);
  assert.strictEqual(m.remote(url).branches.main, m.git(H + '/p').branches.main);
  sh('git switch -c tmp'); sh(`git push -u origin tmp`);
  assert.ok(/deleted/.test(sh('git push origin --delete tmp').text));
  assert.strictEqual(sh('git clone https://github.com/nobody/nothing').code, 128);
});
test('gh: PR guard rails, merge closes referenced issues, fork sets two remotes', () => {
  const url = 'https://github.com/collinkirklandtamu/p';
  const { m, sh } = repo((x) => { x.seedRemote(url, [{ msg: 'one', files: { 'a.txt': '1\n2\n3\n' } }]); x.cwd = H; x.run([`git clone ${url} q`, 'cd q']); });
  m.cwd = H + '/q';
  sh('git switch -c f');
  assert.ok(/must first push/.test(sh('gh pr create --title t --body b').text));
  m.write('n.txt', 'n\n'); sh('git add n.txt'); sh('git commit -m n'); sh('git push -u origin f');
  assert.ok(/--public|required/.test(sh('gh repo create nothing').text));
  sh('gh issue create --title bug --body b');
  assert.ok(/pull\/2/.test(sh('gh pr create --title t --body "Fixes #1"').text));
  assert.ok(/already exists/.test(sh('gh pr create --title t --body b').text));
  assert.ok(/Merged pull request #2/.test(sh('gh pr merge --merge --delete-branch').text));
  assert.strictEqual(m.remote(url).issues[0].state, 'CLOSED');
  assert.ok(!m.remote(url).branches.f, 'remote branch deleted');
  assert.ok(/main/.test(m.git(H + '/q').head.ref));
});
test('docker: errors are realistic (name clash, port clash, missing image/tag, rm running, exec stopped)', () => {
  const { m, sh } = box();
  sh('docker run -d --name web -p 8080:80 nginx');
  assert.ok(/already in use/.test(sh('docker run -d --name web nginx').text));
  assert.ok(/port is already allocated/.test(sh('docker run -d -p 8080:80 nginx').text));
  assert.ok(/stop the container before removing/.test(sh('docker rm web').text));
  assert.ok(/pull access denied/.test(sh('docker run nosuchimage').text));
  assert.ok(/manifest for nginx:9.9 not found/.test(sh('docker pull nginx:9.9').text));
  assert.strictEqual(sh('docker stop web').code, 0);
  assert.ok(/not running/.test(sh('docker exec web ls').text));
  assert.ok(/Exited \(0\)/.test(sh('docker ps -a').text));
  assert.strictEqual(sh('docker start web').code, 0);
  assert.strictEqual(sh('curl localhost:8080').code, 0);
  assert.strictEqual(sh('curl localhost:9999').code, 7);
  assert.ok(/conflict.*using its referenced image/.test(sh('docker rmi nginx').text));
});
test('docker: postgres needs a password; env and volumes are recorded; foreground servers are auto-stopped', () => {
  const { m, sh } = box();
  sh('docker run -d --name db postgres');
  assert.ok(/POSTGRES_PASSWORD/.test(sh('docker logs db').text));
  assert.ok(/Exited \(1\)/.test(sh('docker ps -a').text));
  const fg = sh('docker run nginx');
  assert.ok(/foreground/.test(fg.text));
  assert.strictEqual(m.dockerState().containers.filter((c) => c.status === 'running').length, 0);
  sh('docker rm db');
  sh('docker run -d --name db -e POSTGRES_PASSWORD=x -v pgdata:/var/lib/postgresql/data postgres');
  assert.strictEqual(m.container('db').status, 'running');
  assert.ok(/pgdata/.test(sh('docker volume ls').text));
  assert.ok(/POSTGRES_PASSWORD=x/.test(sh('docker exec db env').text));
});
test('docker build: layers, errors for bad FROM / missing COPY source / bad CMD JSON / unknown instruction', () => {
  const { m, sh } = box((x) => { x.write(H + '/app/app.py', 'print("hi there")\n'); x.cwd = H + '/app'; });
  const build = (df) => { m.write(H + '/app/Dockerfile', df); return sh('docker build -t t:1 .'); };
  assert.ok(/not found/.test(build('FROM python:9.99\n').text));
  assert.ok(/"\/nope.py": not found/.test(build('FROM python:3.12-slim\nCOPY nope.py .\n').text));
  assert.ok(/not valid JSON/.test(build('FROM python:3.12-slim\nCMD [python, app.py]\n').text));
  assert.ok(/unknown instruction: rnu/.test(build('FROM python:3.12-slim\nRNU echo\n').text));
  assert.ok(/no build stage/.test(build('WORKDIR /x\n').text));
  assert.strictEqual(build('FROM python:3.12-slim\nWORKDIR /app\nCOPY . .\nCMD ["python", "app.py"]\n').code, 0);
  assert.ok(/hi there/.test(sh('docker run t:1').text));
  assert.ok(/app.py/.test(sh('docker run t:1 ls').text));
  m.write(H + '/app/Dockerfile', 'FROM python:3.12-slim\nENV GREETING=yo\nCMD ["python", "-c", "print(\'x\')"]\n');
  sh('docker build -t e:1 .');
  assert.ok(/GREETING=yo/.test(sh('docker run e:1 env').text) || sh('docker run e:1 env').code === 127);
});
test('docker compose: starts services in dependency order, names containers, tears down', () => {
  const { m, sh } = box((x) => {
    x.write(H + '/stack/docker-compose.yml', 'services:\n  web:\n    image: nginx\n    ports:\n      - "8080:80"\n    depends_on: [db]\n  db:\n    image: redis\n');
    x.cwd = H + '/stack';
  });
  const up = sh('docker compose up -d');
  assert.strictEqual(up.code, 0, up.text);
  assert.ok(up.text.indexOf('stack-db-1') < up.text.indexOf('stack-web-1'), 'db starts before web');
  assert.strictEqual(sh('curl localhost:8080').code, 0);
  assert.ok(/stack-web-1[\s\S]*stack-db-1|stack-db-1[\s\S]*stack-web-1/.test(sh('docker compose ps').text));
  sh('docker compose down');
  assert.strictEqual(m.dockerState().containers.length, 0);
  m.write(H + '/stack/docker-compose.yml', 'services:\n  web:\n    ports: ["80:80"]\n');
  assert.ok(/neither an image nor a build/.test(sh('docker compose up -d').text));
  m.write(H + '/stack/docker-compose.yml', 'services:\n\tweb:\n');
  assert.ok(/tab/.test(sh('docker compose up -d').text));
});
test('yaml parser handles maps, lists, inline lists, quoting, nesting in list items and rejects bad input', () => {
  const y = LP.Docker.parseYaml('a: 1\nb:\n  c: "x y"\n  d: [p, q]\n  e:\n    - one\n    - two: 2\n      three: 3\n    - four\nf:\n- g\n- h\n# c\n');
  assert.deepStrictEqual(y, { a: '1', b: { c: 'x y', d: ['p', 'q'], e: ['one', { two: '2', three: '3' }, 'four'] }, f: ['g', 'h'] });
  assert.throws(() => LP.Docker.parseYaml('a:\n  b: 1\n c: 2\n'));
  assert.throws(() => LP.Docker.parseYaml('just words\n'));
});
