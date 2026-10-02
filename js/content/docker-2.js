(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  const H = '/home/learner';
  const dk = (m) => m.dockerState();
  const d = (title, task, intro, setup, checks, solution, hints) => ({ title, task, intro, setup, checks, solution, hints: hints || ['Re-read the lesson reading; each step is one command.'] });
  const f = (title, task, starter, checks, solution, hints) => ({ title, task, starter, checks, solution, hints: hints || ['Follow the structure shown in the reading.'] });
  const app = (dir, extra) => (m) => { m.write(H + '/' + dir + '/app.py', 'print("hi from ' + dir + '")\n'); m.write(H + '/' + dir + '/Dockerfile', 'FROM python:3.12-slim\nWORKDIR /app\nCOPY app.py .\nCMD ["python", "app.py"]\n'); m.cwd = H + '/' + dir; if (extra) extra(m); };
  const first = (c) => c.steps.find((s) => s.ins === 'FROM');

  LP.addDrills({
    'dk-hello': [
      d('Run alpine', 'Run `alpine` with the command `echo hi from alpine` (it exits after printing) and then list **all** containers.', 'Fresh Docker engine.', () => {},
        [{ label: 'An alpine container printed the message', test: (m) => dk(m).containers.some((c) => /alpine/.test(c.image) && c.logs.includes('hi from alpine')) }, { label: 'Listed all containers (-a)', test: (m) => m.ran(/^docker ps -a/) }],
        ['docker run alpine echo hi from alpine', 'docker ps -a']),
      
    ],
    'dk-ports': [
      d('Redis, detached', 'Pull `redis` and run it detached as `cache`, publishing host port `6380` to container port `6379`.', 'Fresh Docker engine.', () => {},
        [{ label: 'cache running with 6380 -> 6379', test: (m) => { const c = m.container('cache'); return !!c && c.status === 'running' && c.ports.some((p) => p.host === 6380 && p.container === 6379); } }],
        ['docker pull redis', 'docker run -d --name cache -p 6380:6379 redis']),
      
    ],
    'dk-lifecycle': [
      d('Stop and remove', 'Stop the running container `tmp`, then remove it, and confirm with `docker ps -a`.', 'A container named tmp is running.',
        (m) => { m.run(['docker run -d --name tmp nginx']); },
        [{ label: 'tmp is gone', test: (m) => !m.container('tmp') }, { label: 'Stopped before removing', test: (m) => m.ran(/^docker stop tmp/) }, { label: 'Confirmed with ps -a', test: (m) => m.ran(/^docker ps -a/) }],
        ['docker stop tmp', 'docker rm tmp', 'docker ps -a']),
      
    ],
    'dk-env-volumes': [
      d('Pass a variable', 'Run `alpine` with `-e GREETING=hello` and the command `env`, to see the variable inside.', 'Fresh Docker engine.', () => {},
        [{ label: 'Variable set and printed', test: (m) => dk(m).containers.some((c) => c.env.GREETING === 'hello' && c.logs.some((l) => /GREETING=hello/.test(l))) }],
        ['docker run -e GREETING=hello alpine env']),
      
    ],
    
    'dk-dockerfile': [
      f('Node app', 'Write a Dockerfile: `FROM node:20-alpine`, `WORKDIR /app`, `COPY server.js .`, `CMD ["node", "server.js"]`.', '# Dockerfile\n',
        [{ label: 'FROM node:20-alpine', test: (t, c) => !!first(c) && first(c).arg.trim() === 'node:20-alpine' }, { label: 'WORKDIR /app', test: (t, c) => c.steps.some((s) => s.ins === 'WORKDIR' && s.arg.trim() === '/app') }, { label: 'COPY server.js', test: (t, c) => c.steps.some((s) => s.ins === 'COPY' && /server\.js/.test(s.arg)) }, { label: 'CMD in exec form', test: (t, c) => { const s = c.steps.find((x) => x.ins === 'CMD'); try { const a = JSON.parse(s.arg); return a[0] === 'node' && a[1] === 'server.js'; } catch (e) { return false; } } }],
        'FROM node:20-alpine\nWORKDIR /app\nCOPY server.js .\nCMD ["node", "server.js"]\n'),
      
    ],
    'dk-build': [
      d('Build and run', 'Build `hello:1.0` from the Dockerfile here and run it to see its output.', 'A working Dockerfile is in ~/hello.', app('hello'),
        [{ label: 'hello:1.0 built', test: (m) => !!dk(m).images['hello:1.0'] }, { label: 'Ran it and saw the output', test: (m) => dk(m).containers.some((c) => c.image === 'hello:1.0' && c.logs.includes('hi from hello')) }],
        ['docker build -t hello:1.0 .', 'docker run hello:1.0']),
      
    ],

    'dk-health': [
      f('Check a different port', 'Add `HEALTHCHECK --interval=10s --retries=2 CMD curl -f http://localhost:5000/health || exit 1` before the `CMD` of this Dockerfile.', 'FROM python:3.12-slim\nWORKDIR /app\nCOPY app.py .\nEXPOSE 5000\nCMD ["python", "app.py"]\n',
        [{ label: 'HEALTHCHECK exists before CMD', test: (t, c) => { const h = c.steps.findIndex((s) => s.ins === 'HEALTHCHECK'); const m = c.steps.findIndex((s) => s.ins === 'CMD'); return h >= 0 && m > h; } }, { label: 'interval 10s, retries 2', test: (t, c) => c.steps.some((s) => s.ins === 'HEALTHCHECK' && /--interval=10s/.test(s.arg) && /--retries=2/.test(s.arg)) }, { label: 'curl -f :5000/health || exit 1', test: (t, c) => c.steps.some((s) => s.ins === 'HEALTHCHECK' && /curl -f http:\/\/localhost:5000\/health/.test(s.arg) && /\|\|\s*exit 1/.test(s.arg)) }],
        'FROM python:3.12-slim\nWORKDIR /app\nCOPY app.py .\nEXPOSE 5000\nHEALTHCHECK --interval=10s --retries=2 CMD curl -f http://localhost:5000/health || exit 1\nCMD ["python", "app.py"]\n'),
      
    ],
    'dk-network': [
      d('Create and inspect', 'Create network `backend`, list networks and inspect `backend`.', 'Fresh Docker engine.', () => {},
        [{ label: 'backend exists', test: (m) => dk(m).networks.includes('backend') }, { label: 'Listed and inspected', test: (m) => m.ran(/^docker network ls/) && m.ran(/^docker network inspect backend/) }],
        ['docker network create backend', 'docker network ls', 'docker network inspect backend']),
      
    ],
    'dk-debug': [
      d('Exit codes', 'The container `job` ended unexpectedly. Find its status with `docker ps -a` and read `docker logs job` (it has no `DB_URL`). Then remove `job`.', 'job exited with an error.',
        (m) => { m.write(H + '/job/app.py', 'import os\nurl = os.environ["DB_URL"]\n'); m.write(H + '/job/Dockerfile', 'FROM python:3.12-slim\nWORKDIR /app\nCOPY app.py .\nCMD ["python", "app.py"]\n'); m.cwd = H + '/job'; m.run(['docker build -t jobimg .', 'docker run --name job jobimg']); },
        [{ label: 'Checked ps -a and logs', test: (m) => m.ran(/^docker ps -a/) && m.ran(/^docker logs job/) }, { label: 'job removed', test: (m) => !m.container('job') }],
        ['docker ps -a', 'docker logs job', 'docker rm job']),
      
    ],
    'dk-limits': [
      d('Memory only', 'Run `alpine` detached as `capped` with a `128m` memory limit and `sleep 300`.', 'Fresh Docker engine.', () => {},
        [{ label: 'capped has 128m', test: (m) => { const c = m.container('capped'); return !!c && /^128m$/i.test(c.memory || ''); } }],
        ['docker run -d --name capped --memory 128m alpine sleep 300']),
      
    ],
    
    'dk-compose': [
      d('Compose down', 'Bring the running stack down with Compose and confirm no containers remain (`docker ps`).', 'A stack is running in ~/web.',
        (m) => { m.write(H + '/web/docker-compose.yml', 'services:\n  web:\n    image: nginx:alpine\n    ports:\n      - "8082:80"\n'); m.cwd = H + '/web'; m.run(['docker compose up -d']); },
        [{ label: 'Compose down was run', test: (m) => m.ran(/^docker compose down/) }, { label: 'No containers left', test: (m) => dk(m).containers.length === 0 }],
        ['docker compose down', 'docker ps']),
      
    ],
    
  });

  LP.addRecall({
    'dk-hello': [
      { type: 'choice', q: 'What is an image?', options: ['A read-only template used to create containers', 'A running process', 'A volume', 'A network'], answer: 0, why: 'Containers are running instances of images.' },
      
    ],
    'dk-ports': [
      { type: 'choice', q: 'In `-p 8080:80`, which number is the host side?', options: ['8080', '80', 'Both', 'Neither'], answer: 0, why: 'host:container.' },
      
    ],
    'dk-lifecycle': [
      { type: 'choice', q: 'What does `docker rm` do to a running container?', options: ['Refuses unless you stop it first or use -f', 'Pauses it', 'Restarts it', 'Nothing'], answer: 0, why: 'Stop first, or `docker rm -f`.' },
      
    ],
    'dk-env-volumes': [
      { type: 'choice', q: 'What happens to data in the container filesystem when you `docker rm` it?', options: ['It is deleted', 'It is kept', 'It moves to a volume', 'It is zipped'], answer: 0, why: 'Use volumes for persistence.' },
      
    ],
    'dk-dockerfile': [
      { type: 'choice', q: 'Why copy `requirements.txt` and install **before** copying your code?', options: ['Docker caches the install layer until requirements change', 'It is required', 'Smaller images only', 'No reason'], answer: 0, why: 'Layer caching.' },
      
    ],
    'dk-build': [
      { type: 'type', q: 'Which flag names the image you build? (flag only)', accept: ['-t', '--tag'], why: '`docker build -t name:tag .`.' },
      
    ],
    'dk-compose': [
      { type: 'choice', q: 'What names does Compose give containers?', options: ['<project>-<service>-1', 'random names', 'service only', 'image names'], answer: 0, why: 'Project is the folder name.' },
      
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
