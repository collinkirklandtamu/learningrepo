(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  const H = '/home/learner';
  const dk = (m) => m.dockerState();
  const ME = 'collinkirklandtamu';
  const d = (title, task, intro, setup, checks, solution, hints) => ({ title, task, intro, setup, checks, solution, hints: hints || ['Re-read the lesson reading; each step is one command.'] });
  const f = (title, task, starter, checks, solution, hints) => ({ title, task, starter, checks, solution, hints: hints || ['Follow the structure shown in the reading.'] });
  const app = (dir, extra) => (m) => { m.write(H + '/' + dir + '/app.py', 'print("hi from ' + dir + '")\n'); m.write(H + '/' + dir + '/Dockerfile', 'FROM python:3.12-slim\nWORKDIR /app\nCOPY app.py .\nCMD ["python", "app.py"]\n'); m.cwd = H + '/' + dir; if (extra) extra(m); };
  const first = (c) => c.steps.find((s) => s.ins === 'FROM');

  LP.addDrills({
    'dk-hello': [
      d('Run alpine', 'Run `alpine` with the command `echo hi from alpine` (it exits after printing) and then list **all** containers.', 'Fresh Docker engine.', () => {},
        [{ label: 'An alpine container printed the message', test: (m) => dk(m).containers.some((c) => /alpine/.test(c.image) && c.logs.includes('hi from alpine')) }, { label: 'Listed all containers (-a)', test: (m) => m.ran(/^docker ps -a/) }],
        ['docker run alpine echo hi from alpine', 'docker ps -a']),
      d('Check the version', 'Show the Docker client version and then run `hello-world`.', 'Fresh Docker engine.', () => {},
        [{ label: 'Ran docker --version or version', test: (m) => m.ran(/^docker (--version|version)/) }, { label: 'hello-world ran', test: (m) => dk(m).containers.some((c) => /hello-world/.test(c.image)) }],
        ['docker --version', 'docker run hello-world']),
    ],
    'dk-ports': [
      d('Redis, detached', 'Pull `redis` and run it detached as `cache`, publishing host port `6380` to container port `6379`.', 'Fresh Docker engine.', () => {},
        [{ label: 'cache running with 6380 -> 6379', test: (m) => { const c = m.container('cache'); return !!c && c.status === 'running' && c.ports.some((p) => p.host === 6380 && p.container === 6379); } }],
        ['docker pull redis', 'docker run -d --name cache -p 6380:6379 redis']),
      d('A different host port', 'Run nginx detached as `site` on host port `9000` (container port 80) and fetch it with curl.', 'Fresh Docker engine.', () => {},
        [{ label: 'site on 9000 -> 80', test: (m) => { const c = m.container('site'); return !!c && c.ports.some((p) => p.host === 9000 && p.container === 80); } }, { label: 'curl worked', test: (m) => m.ran(/^curl .*9000/) }],
        ['docker run -d --name site -p 9000:80 nginx', 'curl localhost:9000']),
    ],
    'dk-lifecycle': [
      d('Stop and remove', 'Stop the running container `tmp`, then remove it, and confirm with `docker ps -a`.', 'A container named tmp is running.',
        (m) => { m.run(['docker run -d --name tmp nginx']); },
        [{ label: 'tmp is gone', test: (m) => !m.container('tmp') }, { label: 'Stopped before removing', test: (m) => m.ran(/^docker stop tmp/) }, { label: 'Confirmed with ps -a', test: (m) => m.ran(/^docker ps -a/) }],
        ['docker stop tmp', 'docker rm tmp', 'docker ps -a']),
      d('Restart it', 'Restart the stopped container `app` and check that it is running.', 'app is stopped.',
        (m) => { m.run(['docker run -d --name app nginx', 'docker stop app']); },
        [{ label: 'app is running again', test: (m) => { const c = m.container('app'); return !!c && c.status === 'running'; } }],
        ['docker start app', 'docker ps']),
    ],
    'dk-env-volumes': [
      d('Pass a variable', 'Run `alpine` with `-e GREETING=hello` and the command `env`, to see the variable inside.', 'Fresh Docker engine.', () => {},
        [{ label: 'Variable set and printed', test: (m) => dk(m).containers.some((c) => c.env.GREETING === 'hello' && c.logs.some((l) => /GREETING=hello/.test(l))) }],
        ['docker run -e GREETING=hello alpine env']),
      d('Create a volume', 'Create a named volume `notes-data`, list volumes, then run a detached `redis` container `store` that mounts it at `/data`.', 'Fresh Docker engine.', () => {},
        [{ label: 'Volume exists', test: (m) => dk(m).volumes.includes('notes-data') }, { label: 'store mounts notes-data at /data', test: (m) => { const c = m.container('store'); return !!c && c.volumes.includes('notes-data:/data'); } }, { label: 'Listed volumes', test: (m) => m.ran(/^docker volume ls/) }],
        ['docker volume create notes-data', 'docker volume ls', 'docker run -d --name store -v notes-data:/data redis']),
    ],
    'dk-mounts': [
      d('Read-only bind mount', 'Serve `~/page` with nginx as `ro-site` on port 8081, bind-mounted **read-only** at `/usr/share/nginx/html`.', 'index.html is in ~/page.',
        (m) => { m.write(H + '/page/index.html', '<h1>RO</h1>\n'); m.cwd = H + '/page'; },
        [{ label: 'Mounted read-only', test: (m) => { const c = m.container('ro-site'); return !!c && c.volumes.some((v) => /\/usr\/share\/nginx\/html:ro$/.test(v)); } }, { label: 'Serving on 8081', test: (m) => /RO/.test(m.httpGet('http://localhost:8081') || '') }],
        ['docker run -d --name ro-site -p 8081:80 -v /home/learner/page:/usr/share/nginx/html:ro nginx']),
      d('Named volume for data', 'Run `postgres` detached as `pg` with password `pw` and the named volume `pgstore` at `/var/lib/postgresql/data`.', 'Fresh Docker engine.', () => {},
        [{ label: 'pg running with the volume and password', test: (m) => { const c = m.container('pg'); return !!c && c.status === 'running' && c.env.POSTGRES_PASSWORD === 'pw' && c.volumes.includes('pgstore:/var/lib/postgresql/data'); } }],
        ['docker run -d --name pg -e POSTGRES_PASSWORD=pw -v pgstore:/var/lib/postgresql/data postgres']),
    ],
    'dk-dockerfile': [
      f('Node app', 'Write a Dockerfile: `FROM node:20-alpine`, `WORKDIR /app`, `COPY server.js .`, `CMD ["node", "server.js"]`.', '# Dockerfile\n',
        [{ label: 'FROM node:20-alpine', test: (t, c) => !!first(c) && first(c).arg.trim() === 'node:20-alpine' }, { label: 'WORKDIR /app', test: (t, c) => c.steps.some((s) => s.ins === 'WORKDIR' && s.arg.trim() === '/app') }, { label: 'COPY server.js', test: (t, c) => c.steps.some((s) => s.ins === 'COPY' && /server\.js/.test(s.arg)) }, { label: 'CMD in exec form', test: (t, c) => { const s = c.steps.find((x) => x.ins === 'CMD'); try { const a = JSON.parse(s.arg); return a[0] === 'node' && a[1] === 'server.js'; } catch (e) { return false; } } }],
        'FROM node:20-alpine\nWORKDIR /app\nCOPY server.js .\nCMD ["node", "server.js"]\n'),
      f('Install dependencies first', 'Write a Python Dockerfile that copies `requirements.txt` and runs `pip install -r requirements.txt` **before** copying `app.py` (for layer caching). End with `CMD ["python", "app.py"]`.', '# Dockerfile\nFROM python:3.12-slim\nWORKDIR /app\n',
        [{ label: 'Installs requirements', test: (t, c) => c.steps.some((s) => s.ins === 'RUN' && /pip install.*-r requirements\.txt/.test(s.arg)) }, { label: 'requirements are copied before the install', test: (t, c) => { const cp = c.steps.findIndex((s) => s.ins === 'COPY' && /requirements\.txt/.test(s.arg)); const run = c.steps.findIndex((s) => s.ins === 'RUN' && /pip install/.test(s.arg)); return cp >= 0 && run > cp; } }, { label: 'app.py is copied AFTER the install (cache friendly)', test: (t, c) => { const run = c.steps.findIndex((s) => s.ins === 'RUN' && /pip install/.test(s.arg)); const cp = c.steps.findIndex((s) => s.ins === 'COPY' && /app\.py/.test(s.arg)); return run >= 0 && cp > run; } }, { label: 'CMD python app.py', test: (t, c) => c.steps.some((s) => s.ins === 'CMD' && /python/.test(s.arg) && /app\.py/.test(s.arg)) }],
        'FROM python:3.12-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install -r requirements.txt\nCOPY app.py .\nCMD ["python", "app.py"]\n'),
    ],
    'dk-build': [
      d('Build and run', 'Build `hello:1.0` from the Dockerfile here and run it to see its output.', 'A working Dockerfile is in ~/hello.', app('hello'),
        [{ label: 'hello:1.0 built', test: (m) => !!dk(m).images['hello:1.0'] }, { label: 'Ran it and saw the output', test: (m) => dk(m).containers.some((c) => c.image === 'hello:1.0' && c.logs.includes('hi from hello')) }],
        ['docker build -t hello:1.0 .', 'docker run hello:1.0']),
      d('Fix a typo', 'The build fails because the Dockerfile copies `app.pyy`. Fix it (`echo` a corrected Dockerfile) and build `fixed:1.0`.', 'The Dockerfile has a typo.',
        (m) => { m.write(H + '/typo/app.py', 'print("ok")\n'); m.write(H + '/typo/Dockerfile', 'FROM python:3.12-slim\nWORKDIR /app\nCOPY app.pyy .\nCMD ["python", "app.py"]\n'); m.cwd = H + '/typo'; },
        [{ label: 'First build failed', test: (m) => m.cmds.some((c) => /^docker build/.test(c.line) && !c.ok) }, { label: 'fixed:1.0 built', test: (m) => !!dk(m).images['fixed:1.0'] }],
        ['docker build -t fixed:1.0 .', 'echo "FROM python:3.12-slim" > Dockerfile', 'echo "WORKDIR /app" >> Dockerfile', 'echo "COPY app.py ." >> Dockerfile', 'echo "CMD [\\"python\\", \\"app.py\\"]" >> Dockerfile', 'docker build -t fixed:1.0 .']),
    ],
    'dk-ignore': [
      d('Ignore the data folder', 'Write a `.dockerignore` that excludes the `data/` folder and `*.csv`, then build `lean:1.0`. The image must contain `app.py` but not `data/big.csv`.', 'A project with a large data folder.',
        (m) => { m.write(H + '/lean/app.py', 'print("lean")\n'); m.write(H + '/lean/data/big.csv', 'a,b\n'); m.write(H + '/lean/Dockerfile', 'FROM python:3.12-slim\nWORKDIR /app\nCOPY . .\nCMD ["python", "app.py"]\n'); m.cwd = H + '/lean'; },
        [{ label: 'Built lean:1.0', test: (m) => !!dk(m).images['lean:1.0'] }, { label: 'app.py inside, data excluded', test: (m) => { const i = dk(m).images['lean:1.0']; const k = i && i.built ? Object.keys(i.built.files) : []; return k.some((x) => /app\.py$/.test(x)) && !k.some((x) => /big\.csv$|\/data\//.test(x)); } }],
        ['echo "data/" > .dockerignore', 'echo "*.csv" >> .dockerignore', 'docker build -t lean:1.0 .']),
      d('Keep git out', 'Add `.git/` to a `.dockerignore` (create it) and rebuild `repo:1.0`.', 'A project that also holds a .git folder.',
        (m) => { m.write(H + '/repo/app.py', 'print("r")\n'); m.write(H + '/repo/.git/config', '[core]\n'); m.write(H + '/repo/Dockerfile', 'FROM python:3.12-slim\nWORKDIR /app\nCOPY . .\nCMD ["python", "app.py"]\n'); m.cwd = H + '/repo'; },
        [{ label: '.dockerignore has .git', test: (m) => /\.git/.test(m.read(H + '/repo/.dockerignore') || '') }, { label: 'Image has no .git files', test: (m) => { const i = dk(m).images['repo:1.0']; return !!(i && i.built) && !Object.keys(i.built.files).some((x) => /\.git\//.test(x)); } }],
        ['echo ".git/" > .dockerignore', 'docker build -t repo:1.0 .']),
    ],
    'dk-multistage': [
      f('Go-style two stages', 'Write a Dockerfile with a first stage `FROM golang:1.22 AS builder` that runs `go build -o /out/app .` and a final stage `FROM alpine` that copies `/out/app` `--from=builder` to `/usr/local/bin/app`, with `CMD ["app"]`.', '# Dockerfile\n',
        [{ label: 'Stage named builder', test: (t, c) => !!first(c) && /^golang:1\.22\s+AS\s+builder$/i.test(first(c).arg.trim()) }, { label: 'go build step', test: (t, c) => c.steps.some((s) => s.ins === 'RUN' && /go build/.test(s.arg)) }, { label: 'Final stage alpine', test: (t, c) => { const f2 = c.steps.filter((s) => s.ins === 'FROM'); return f2.length === 2 && f2[1].arg.trim() === 'alpine'; } }, { label: 'COPY --from=builder', test: (t, c) => c.steps.some((s) => s.ins === 'COPY' && /--from=builder/.test(s.arg) && /\/usr\/local\/bin\/app/.test(s.arg)) }, { label: 'CMD ["app"]', test: (t, c) => c.steps.some((s) => s.ins === 'CMD' && /app/.test(s.arg)) }],
        'FROM golang:1.22 AS builder\nWORKDIR /src\nCOPY . .\nRUN go build -o /out/app .\n\nFROM alpine\nCOPY --from=builder /out/app /usr/local/bin/app\nCMD ["app"]\n'),
      f('Name the stages', 'Write a Dockerfile with two stages: `FROM python:3.12 AS deps` (runs `pip install --target /deps flask`) and a final `FROM python:3.12-slim` that copies `/deps` from `deps` into `/usr/lib/python3/site-packages`.', '# Dockerfile\n',
        [{ label: 'deps stage', test: (t, c) => !!first(c) && /^python:3\.12\s+AS\s+deps$/i.test(first(c).arg.trim()) }, { label: 'pip install into /deps', test: (t, c) => c.steps.some((s) => s.ins === 'RUN' && /pip install.*\/deps/.test(s.arg)) }, { label: 'Final slim stage copies from deps', test: (t, c) => { const f2 = c.steps.filter((s) => s.ins === 'FROM'); return f2.length === 2 && /python:3\.12-slim/.test(f2[1].arg) && c.steps.some((s) => s.ins === 'COPY' && /--from=deps/.test(s.arg)); } }],
        'FROM python:3.12 AS deps\nRUN pip install --target /deps flask\n\nFROM python:3.12-slim\nCOPY --from=deps /deps /usr/lib/python3/site-packages\n'),
    ],
    'dk-health': [
      f('Check a different port', 'Add `HEALTHCHECK --interval=10s --retries=2 CMD curl -f http://localhost:5000/health || exit 1` before the `CMD` of this Dockerfile.', 'FROM python:3.12-slim\nWORKDIR /app\nCOPY app.py .\nEXPOSE 5000\nCMD ["python", "app.py"]\n',
        [{ label: 'HEALTHCHECK exists before CMD', test: (t, c) => { const h = c.steps.findIndex((s) => s.ins === 'HEALTHCHECK'); const m = c.steps.findIndex((s) => s.ins === 'CMD'); return h >= 0 && m > h; } }, { label: 'interval 10s, retries 2', test: (t, c) => c.steps.some((s) => s.ins === 'HEALTHCHECK' && /--interval=10s/.test(s.arg) && /--retries=2/.test(s.arg)) }, { label: 'curl -f :5000/health || exit 1', test: (t, c) => c.steps.some((s) => s.ins === 'HEALTHCHECK' && /curl -f http:\/\/localhost:5000\/health/.test(s.arg) && /\|\|\s*exit 1/.test(s.arg)) }],
        'FROM python:3.12-slim\nWORKDIR /app\nCOPY app.py .\nEXPOSE 5000\nHEALTHCHECK --interval=10s --retries=2 CMD curl -f http://localhost:5000/health || exit 1\nCMD ["python", "app.py"]\n'),
      f('Slow starter', 'Add a `HEALTHCHECK` with `--start-period=20s`, `--interval=15s` that runs `curl -f http://localhost:8000/ || exit 1`.', 'FROM python:3.12-slim\nWORKDIR /app\nCOPY app.py .\nCMD ["python", "app.py"]\n',
        [{ label: 'Has a HEALTHCHECK', test: (t, c) => c.steps.some((s) => s.ins === 'HEALTHCHECK') }, { label: 'start-period 20s and interval 15s', test: (t, c) => c.steps.some((s) => s.ins === 'HEALTHCHECK' && /--start-period=20s/.test(s.arg) && /--interval=15s/.test(s.arg)) }, { label: 'curl on port 8000', test: (t, c) => c.steps.some((s) => s.ins === 'HEALTHCHECK' && /localhost:8000/.test(s.arg)) }],
        'FROM python:3.12-slim\nWORKDIR /app\nCOPY app.py .\nHEALTHCHECK --start-period=20s --interval=15s CMD curl -f http://localhost:8000/ || exit 1\nCMD ["python", "app.py"]\n'),
    ],
    'dk-network': [
      d('Create and inspect', 'Create network `backend`, list networks and inspect `backend`.', 'Fresh Docker engine.', () => {},
        [{ label: 'backend exists', test: (m) => dk(m).networks.includes('backend') }, { label: 'Listed and inspected', test: (m) => m.ran(/^docker network ls/) && m.ran(/^docker network inspect backend/) }],
        ['docker network create backend', 'docker network ls', 'docker network inspect backend']),
      d('Join at start', 'Run nginx as `front` and alpine `probe` (`sleep 300`) both with `--network lan`, create it first, then `docker exec probe curl front`.', 'Fresh Docker engine.', () => {},
        [{ label: 'Both on lan', test: (m) => { const a = m.container('front'), b = m.container('probe'); return !!a && !!b && a.network === 'lan' && b.network === 'lan'; } }, { label: 'probe reached front by name', test: (m) => m.cmds.some((c) => /^docker exec probe curl front/.test(c.line) && c.ok) }],
        ['docker network create lan', 'docker run -d --name front --network lan nginx', 'docker run -d --name probe --network lan alpine sleep 300', 'docker exec probe curl front']),
    ],
    'dk-debug': [
      d('Exit codes', 'The container `job` ended unexpectedly. Find its status with `docker ps -a` and read `docker logs job` (it has no `DB_URL`). Then remove `job`.', 'job exited with an error.',
        (m) => { m.write(H + '/job/app.py', 'import os\nurl = os.environ["DB_URL"]\n'); m.write(H + '/job/Dockerfile', 'FROM python:3.12-slim\nWORKDIR /app\nCOPY app.py .\nCMD ["python", "app.py"]\n'); m.cwd = H + '/job'; m.run(['docker build -t jobimg .', 'docker run --name job jobimg']); },
        [{ label: 'Checked ps -a and logs', test: (m) => m.ran(/^docker ps -a/) && m.ran(/^docker logs job/) }, { label: 'job removed', test: (m) => !m.container('job') }],
        ['docker ps -a', 'docker logs job', 'docker rm job']),
      d('Look inside', 'Use `docker exec` to list the files in `/app` of the running container `web2`.', 'web2 is running a built image.',
        (m) => { m.write(H + '/w2/app.py', 'from http.server import HTTPServer\nprint("web")\n'); m.write(H + '/w2/Dockerfile', 'FROM python:3.12-slim\nWORKDIR /app\nCOPY app.py .\nCMD ["python", "app.py"]\n'); m.cwd = H + '/w2'; m.run(['docker build -t w2img .', 'docker run -d --name web2 w2img']); },
        [{ label: 'Listed /app inside the container', test: (m) => m.ran(/^docker exec web2 ls .*\/app/) }],
        ['docker exec web2 ls /app']),
    ],
    'dk-limits': [
      d('Memory only', 'Run `alpine` detached as `capped` with a `128m` memory limit and `sleep 300`.', 'Fresh Docker engine.', () => {},
        [{ label: 'capped has 128m', test: (m) => { const c = m.container('capped'); return !!c && /^128m$/i.test(c.memory || ''); } }],
        ['docker run -d --name capped --memory 128m alpine sleep 300']),
      d('Always restart', 'Run `redis` as `kv` detached with `--restart unless-stopped`.', 'Fresh Docker engine.', () => {},
        [{ label: 'kv restart policy', test: (m) => { const c = m.container('kv'); return !!c && c.restart === 'unless-stopped'; } }],
        ['docker run -d --name kv --restart unless-stopped redis']),
    ],
    'dk-registry': [
      d('Version tags', 'Build `svc:1.0`, then give it a second tag `svc:latest`.', 'A project with a Dockerfile.', app('svc'),
        [{ label: 'svc:1.0 and svc:latest exist', test: (m) => !!dk(m).images['svc:1.0'] && !!dk(m).images['svc:latest'] }],
        ['docker build -t svc:1.0 .', 'docker tag svc:1.0 svc:latest']),
      d('Push as yourself', `Build \`tool:2.0\`, tag it \`${ME}/tool:2.0\`, log in as \`${ME}\` and push.`, 'A project with a Dockerfile.', app('tool'),
        [{ label: 'In the registry', test: (m) => !!dk(m).registry[`${ME}/tool:2.0`] }],
        ['docker build -t tool:2.0 .', `docker tag tool:2.0 ${ME}/tool:2.0`, `docker login -u ${ME} -p x`, `docker push ${ME}/tool:2.0`]),
    ],
    'dk-compose': [
      d('Compose down', 'Bring the running stack down with Compose and confirm no containers remain (`docker ps`).', 'A stack is running in ~/web.',
        (m) => { m.write(H + '/web/docker-compose.yml', 'services:\n  web:\n    image: nginx:alpine\n    ports:\n      - "8082:80"\n'); m.cwd = H + '/web'; m.run(['docker compose up -d']); },
        [{ label: 'Compose down was run', test: (m) => m.ran(/^docker compose down/) }, { label: 'No containers left', test: (m) => dk(m).containers.length === 0 }],
        ['docker compose down', 'docker ps']),
      d('Add redis', 'Edit `docker-compose.yml` to add a `cache` service (`redis:alpine`) next to `web`, then `docker compose up -d`.', 'A compose file with one service.',
        (m) => { m.write(H + '/web/docker-compose.yml', 'services:\n  web:\n    image: nginx:alpine\n'); m.cwd = H + '/web'; },
        [{ label: 'web-cache-1 is running', test: (m) => { const c = m.container('web-cache-1'); return !!c && c.status === 'running'; } }, { label: 'web-web-1 is running', test: (m) => { const c = m.container('web-web-1'); return !!c && c.status === 'running'; } }],
        [{ write: 'docker-compose.yml', content: 'services:\n  web:\n    image: nginx:alpine\n  cache:\n    image: redis:alpine\n' }, 'docker compose up -d']),
    ],
    'dk-compose-adv': [
      d('Env file', 'Write a compose file with one service `db` (`postgres:16`) that reads `env_file: db.env`, and start it. The password must come from the file.', 'db.env holds the password.',
        (m) => { m.write(H + '/s2/db.env', 'POSTGRES_PASSWORD=filepw\n'); m.cwd = H + '/s2'; },
        [{ label: 'db has the file password', test: (m) => { const c = m.container('s2-db-1'); return !!c && c.env.POSTGRES_PASSWORD === 'filepw'; } }],
        [{ write: 'docker-compose.yml', content: 'services:\n  db:\n    image: postgres:16\n    env_file:\n      - db.env\n' }, 'docker compose up -d']),
      d('Profile only', 'A service `tools` (alpine, `sleep 300`) is in the `tools` profile. Start the stack so that **only** `tools` and `web` run.', 'The compose file already has the profile.',
        (m) => { m.write(H + '/s3/docker-compose.yml', 'services:\n  web:\n    image: nginx:alpine\n  tools:\n    image: alpine\n    command: sleep 300\n    profiles: [tools]\n'); m.cwd = H + '/s3'; },
        [{ label: 'web and tools running', test: (m) => { const a = m.container('s3-web-1'), b = m.container('s3-tools-1'); return !!a && !!b && a.status === 'running' && b.status === 'running'; } }],
        ['docker compose --profile tools up -d']),
    ],
  });

  LP.addRecall({
    'dk-hello': [
      { type: 'choice', q: 'What is an image?', options: ['A read-only template used to create containers', 'A running process', 'A volume', 'A network'], answer: 0, why: 'Containers are running instances of images.' },
      { type: 'type', q: 'Which command lists running containers? (command)', accept: ['docker ps'], why: '`docker ps` (add `-a` for stopped ones).' },
    ],
    'dk-ports': [
      { type: 'choice', q: 'In `-p 8080:80`, which number is the host side?', options: ['8080', '80', 'Both', 'Neither'], answer: 0, why: 'host:container.' },
      { type: 'choice', q: 'What does `-d` do?', options: ['Runs the container in the background (detached)', 'Deletes it', 'Debugs it', 'Downloads the image'], answer: 0, why: 'Frees your terminal.' },
    ],
    'dk-lifecycle': [
      { type: 'choice', q: 'What does `docker rm` do to a running container?', options: ['Refuses unless you stop it first or use -f', 'Pauses it', 'Restarts it', 'Nothing'], answer: 0, why: 'Stop first, or `docker rm -f`.' },
      { type: 'choice', q: 'Which command shows stopped containers too?', options: ['docker ps -a', 'docker ps', 'docker stop', 'docker images'], answer: 0, why: '`-a` lists all.' },
    ],
    'dk-env-volumes': [
      { type: 'choice', q: 'What happens to data in the container filesystem when you `docker rm` it?', options: ['It is deleted', 'It is kept', 'It moves to a volume', 'It is zipped'], answer: 0, why: 'Use volumes for persistence.' },
      { type: 'type', q: 'Which command lists volumes? (command)', accept: ['docker volume ls'], why: '`docker volume ls`.' },
    ],
    'dk-dockerfile': [
      { type: 'choice', q: 'Why copy `requirements.txt` and install **before** copying your code?', options: ['Docker caches the install layer until requirements change', 'It is required', 'Smaller images only', 'No reason'], answer: 0, why: 'Layer caching.' },
      { type: 'choice', q: 'What does `EXPOSE 8000` do?', options: ['Documents the port; it does not publish it', 'Publishes port 8000', 'Opens the firewall', 'Starts a server'], answer: 0, why: 'You still need `-p`.' },
    ],
    'dk-build': [
      { type: 'type', q: 'Which flag names the image you build? (flag only)', accept: ['-t', '--tag'], why: '`docker build -t name:tag .`.' },
      { type: 'choice', q: 'What does the `.` in `docker build -t app .` mean?', options: ['The build context is the current folder', 'The image name', 'The tag', 'The Dockerfile'], answer: 0, why: 'It is the context path.' },
    ],
    'dk-compose': [
      { type: 'choice', q: 'What names does Compose give containers?', options: ['<project>-<service>-1', 'random names', 'service only', 'image names'], answer: 0, why: 'Project is the folder name.' },
      { type: 'type', q: 'Which command lists the services of this project? (full command)', accept: ['docker compose ps'], why: '`docker compose ps`.' },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
