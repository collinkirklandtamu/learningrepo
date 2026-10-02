(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  const H = '/home/learner';
  const dk = (m) => m.dockerState();
  const APP = 'from http.server import HTTPServer\n# tiny web app\nprint("serving")\ndef home():\n    return "Hello from shop"\n';
  const HEALTH = `FROM python:3.12-slim
WORKDIR /app
COPY app.py .
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD curl -f http://localhost:8000/ || exit 1
CMD ["python", "app.py"]
`;
  const STACK = `services:
  api:
    build: ./api
    ports:
      - "5000:8000"
    depends_on:
      db:
        condition: service_healthy
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "postgres"]
      interval: 5s
volumes:
  pgdata:
`;

  LP.addLessons('docker', [
    {
      id: 'dk-network', title: 'Container networking & DNS', skill: 'Networking', xp: 45, diff: 3, kind: 'terminal',
      read: `
# How containers talk to each other

Each container has its own network namespace, so \`localhost\` inside a container means **itself**. To let containers reach each other, put them on the same **user-defined network**. Docker then gives each container a **DNS name**: its container name.

~~~bash
docker network create appnet
docker run -d --name web --network appnet nginx
docker run -d --name client --network appnet alpine sleep 300
docker exec client curl web            # resolves "web" via Docker's DNS
~~~

Containers on the default \`bridge\` network are **not** reachable by name. Attach an existing container with \`docker network connect appnet web\`. List networks with \`docker network ls\`, inspect with \`docker network inspect appnet\`.

> [!tip] Key idea
> Publishing a port (\`-p\`) is for traffic from **outside** (your browser). Container-to-container traffic uses a shared network and the **container name**, with no \`-p\` needed.
`,
      task: '`web` (nginx) and `client` (alpine) are running on the default bridge, so `docker exec client curl web` fails. Create a network `appnet`, connect **both** containers to it, and make `docker exec client curl web` succeed.',
      intro: 'Two containers are running. Try: docker exec client curl web',
      setup(m) { m.run(['docker run -d --name web nginx', 'docker run -d --name client alpine sleep 300']); },
      checks: [
        { label: 'Saw the failure first', test: (m) => m.cmds.some((c) => /^docker exec client curl web/.test(c.line) && !c.ok) },
        { label: 'Network appnet exists', test: (m) => dk(m).networks.includes('appnet') },
        { label: 'Both containers are on appnet', test: (m) => { const w = m.container('web'), c = m.container('client'); return !!w && !!c && w.network === 'appnet' && c.network === 'appnet'; } },
        { label: 'curl web from client now works', test: (m) => m.cmds.some((c) => /^docker exec client curl web/.test(c.line) && c.ok) },
      ],
      hints: ['`docker network create appnet`', '`docker network connect appnet web` and the same for `client`.', 'Then repeat `docker exec client curl web`.'],
      solution: ['docker exec client curl web', 'docker network create appnet', 'docker network connect appnet web', 'docker network connect appnet client', 'docker exec client curl web'],
      recall: [
        { type: 'choice', q: 'Inside a container, what does `localhost` refer to?', options: ['The container itself', 'Your laptop', 'The Docker host', 'Every container'], answer: 0, why: 'Each container has its own network namespace.' },
        { type: 'choice', q: 'On a user-defined network, how do containers find each other?', options: ['By container name via Docker DNS', 'By IP only', 'By port number', 'They cannot'], answer: 0, why: 'Docker runs an embedded DNS server.' },
        { type: 'choice', q: 'Do containers on the same network need `-p` to talk to each other?', options: ['No', 'Yes', 'Only for databases', 'Only on Linux'], answer: 0, why: '`-p` publishes to the host only.' },
        
      ],
    },

    {
      id: 'dk-health', title: 'Health checks', skill: 'Images', xp: 40, diff: 3, kind: 'file',
      lang: 'dockerfile', file: 'Dockerfile',
      read: `
# "Running" is not the same as "working"

A container can be running while the app inside is deadlocked. A **HEALTHCHECK** tells Docker how to test the app, and \`docker ps\` then shows \`(healthy)\` or \`(unhealthy)\`.

~~~dockerfile
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \\
  CMD curl -f http://localhost:8000/ || exit 1
~~~

- Exit code **0** = healthy, **1** = unhealthy.
- \`--interval\` how often to test, \`--timeout\` how long one test may take, \`--retries\` failures before "unhealthy".
- Orchestrators (and Compose \`depends_on: condition: service_healthy\`) can wait for it.

> [!tip] Key idea
> Test the real thing: request an HTTP endpoint or run a query, don't just check the process exists.
`,
      task: 'Extend this web-app Dockerfile (python:3.12-slim, WORKDIR /app, COPY app.py, EXPOSE 8000, CMD python app.py) with a `HEALTHCHECK` every `30s`, timeout `3s`, `3` retries, that runs `curl -f http://localhost:8000/ || exit 1`. Put it before `CMD`.',
      starter: 'FROM python:3.12-slim\nWORKDIR /app\nCOPY app.py .\nEXPOSE 8000\n\nCMD ["python", "app.py"]\n',
      checks: [
        { label: 'Has a HEALTHCHECK instruction', test: (t, c) => c.steps.some((s) => s.ins === 'HEALTHCHECK') },
        { label: 'Interval 30s, timeout 3s, retries 3', test: (t, c) => c.steps.some((s) => s.ins === 'HEALTHCHECK' && /--interval=30s/.test(s.arg) && /--timeout=3s/.test(s.arg) && /--retries=3/.test(s.arg)) },
        { label: 'Checks http://localhost:8000/ with curl -f', test: (t, c) => c.steps.some((s) => s.ins === 'HEALTHCHECK' && /CMD\s+curl\s+-f\s+http:\/\/localhost:8000\/?/.test(s.arg)) },
        { label: 'Exits 1 on failure (|| exit 1)', test: (t, c) => c.steps.some((s) => s.ins === 'HEALTHCHECK' && /\|\|\s*exit 1/.test(s.arg)) },
        { label: 'HEALTHCHECK comes before CMD', test: (t, c) => { const h = c.steps.findIndex((s) => s.ins === 'HEALTHCHECK'); const m = c.steps.findIndex((s) => s.ins === 'CMD'); return h >= 0 && m > h; } },
      ],
      hints: ['`HEALTHCHECK` flags go before `CMD`: `HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD ...`', 'The command is `curl -f http://localhost:8000/ || exit 1`.'],
      solution: HEALTH,
      recall: [
        { type: 'choice', q: 'What exit code means "unhealthy" in a HEALTHCHECK?', options: ['1', '0', '200', '404'], answer: 0, why: '0 = healthy, 1 = unhealthy.' },
        { type: 'choice', q: 'What can a running container be, besides running?', options: ['unhealthy: the app inside is not responding', 'frozen by Docker', 'secure', 'cached'], answer: 0, why: 'Health is separate from the process state.' },
        { type: 'choice', q: 'What does `--retries=3` mean?', options: ['3 consecutive failures before the container is marked unhealthy', 'The container restarts 3 times', 'Three checks per second', 'Three containers'], answer: 0, why: 'It avoids flapping on a single blip.' },
        
      ],
    },
    
    {
      id: 'dk-debug', title: 'Debugging a crash-looping container', skill: 'Containers', xp: 55, diff: 3, kind: 'terminal',
      read: `
# When a container won't stay up

A **restart policy** (\`--restart always\`) tells Docker to restart a container that exits. If the app crashes at startup, you get a **crash loop**: \`docker ps\` shows \`Restarting (1) 5 seconds ago\`.

A debugging routine:

~~~bash
docker ps -a                 # status: Restarting / Exited (code)
docker logs api              # why did it die? read the LAST lines
docker inspect api           # config: env, restart policy, mounts
docker exec api ls /app      # look inside a RUNNING container
docker cp api:/app/app.py .  # copy a file out to read it
~~~

Read the **exit code**: 1 = app error, 137 = killed (out of memory), 127 = command not found. A \`KeyError: 'DB_URL'\` in the logs means a required environment variable is missing.

> [!tip] Key idea
> Logs first. Then compare what the app expects (env, files, ports) with what \`docker run\` provided.
`,
      task: 'Container `api` keeps restarting. Find the cause with `docker ps` and `docker logs api`, then remove it and run it again (same image `myapi`, detached, `--restart always`) with the missing variable set: `DB_URL=postgres://db/shop`.',
      intro: 'You are in ~/api-debug. Run: docker ps',
      setup(m) {
        m.write(H + '/api-debug/app.py', 'import os\nfrom http.server import HTTPServer\nurl = os.environ["DB_URL"]\nprint("connected to", url)\n# HTTPServer(("", 8000), None).serve_forever()\n');
        m.write(H + '/api-debug/Dockerfile', 'FROM python:3.12-slim\nWORKDIR /app\nCOPY app.py .\nCMD ["python", "app.py"]\n');
        m.cwd = H + '/api-debug';
        m.run(['docker build -t myapi .', 'docker run -d --restart always --name api myapi']);
      },
      checks: [
        { label: 'Looked at the container list', test: (m) => m.ran(/^docker ps/) },
        { label: 'Read the logs (docker logs api)', test: (m) => m.ran(/^docker logs api/) },
        { label: 'api now has DB_URL set', test: (m) => { const c = m.container('api'); return !!c && c.env.DB_URL === 'postgres://db/shop'; } },
        { label: 'api keeps its restart policy', test: (m) => { const c = m.container('api'); return !!c && c.restart === 'always'; } },
        { label: 'api is no longer crashing', test: (m) => { const c = m.container('api'); return !!c && c.status !== 'restarting' && c.exit === 0; } },
      ],
      hints: ['`docker ps` shows `Restarting`. `docker logs api` shows a `KeyError`.', 'Containers are immutable: `docker rm -f api`, then run again with `-e`.', '`docker run -d --restart always --name api -e DB_URL=postgres://db/shop myapi`'],
      solution: ['docker ps', 'docker logs api', 'docker rm -f api', 'docker run -d --restart always --name api -e DB_URL=postgres://db/shop myapi', 'docker ps'],
      recall: [
        { type: 'choice', q: 'What does `Restarting (1)` in `docker ps` mean?', options: ['The app exits with code 1 and Docker keeps restarting it', 'Docker is updating', 'The image is rebuilding', 'The port is busy'], answer: 0, why: 'A crash loop under a restart policy.' },
        { type: 'choice', q: 'What is the **first** place to look when a container dies?', options: ['docker logs', 'The Dockerfile', 'Docker Hub', 'The host BIOS'], answer: 0, why: 'The app\'s own error message is there.' },
        { type: 'choice', q: 'Exit code 137 usually means...', options: ['The process was killed (often out of memory)', 'Success', 'Typo in the command', 'File not found'], answer: 0, why: '128 + 9 (SIGKILL).' },

      ],
    },
    
    {
      id: 'dk-limits', title: 'Resource limits', skill: 'Containers', xp: 35, diff: 2, kind: 'terminal',
      read: `
# Don't let one container eat the machine

By default a container may use as much CPU and memory as the host has. A runaway process can starve everything else. Set limits at run time:

~~~bash
docker run -d --name worker --memory 256m --cpus 0.5 alpine sleep 300
docker stats --no-stream        # live CPU / memory use per container
docker inspect worker           # see the configured limits
~~~

- \`--memory 256m\` hard memory cap. Exceed it and the kernel **kills** the process (exit code **137**, "OOMKilled").
- \`--cpus 0.5\` at most half of one CPU core.
- Combine with \`--restart on-failure:3\` to retry a few times only.

> [!tip] Key idea
> Limits turn a runaway into a contained, visible failure instead of a host-wide outage.
`,
      task: 'Run `alpine` detached as `worker` with `sleep 300`, limited to `256m` of memory and `0.5` CPUs, and restart policy `on-failure:3`. Then look at its usage with `docker stats --no-stream`.',
      intro: 'Fresh Docker engine.',
      setup(m) { /* nothing */ },
      checks: [
        { label: 'worker is running', test: (m) => { const c = m.container('worker'); return !!c && c.status === 'running'; } },
        { label: 'Memory limit 256m', test: (m) => { const c = m.container('worker'); return !!c && /^256m$/i.test(c.memory || ''); } },
        { label: 'CPU limit 0.5', test: (m) => { const c = m.container('worker'); return !!c && String(c.cpus) === '0.5'; } },
        { label: 'Restart policy on-failure:3', test: (m) => { const c = m.container('worker'); return !!c && c.restart === 'on-failure:3'; } },
        { label: 'Checked docker stats', test: (m) => m.ran(/^docker stats/) },
      ],
      hints: ['`docker run -d --name worker --memory 256m --cpus 0.5 --restart on-failure:3 alpine sleep 300`', '`docker stats --no-stream`'],
      solution: ['docker run -d --name worker --memory 256m --cpus 0.5 --restart on-failure:3 alpine sleep 300', 'docker stats --no-stream'],
      recall: [
        { type: 'choice', q: 'What happens when a container exceeds `--memory`?', options: ['The kernel kills the process (OOM, exit 137)', 'It slows down gracefully', 'Docker adds memory', 'Nothing'], answer: 0, why: 'Memory limits are hard.' },
        { type: 'choice', q: 'What does `--cpus 0.5` mean?', options: ['At most half of one core', '50 processes', 'Half the host\'s cores', '0.5 seconds'], answer: 0, why: 'A CPU quota.' },
        { type: 'type', q: 'Which command shows live resource usage? (command)', accept: ['docker stats', 'docker stats --no-stream'], why: '`docker stats`.' },
        
      ],
    },
    
    {
      id: 'dk-capstone', title: 'Capstone: ship and monitor a two-service stack', skill: 'Projects', xp: 150, diff: 3, kind: 'terminal', capstone: true,
      read: `
# Containerise a small shop, then check on it

You are handed a project folder with a web API in \`api/\` and a basic Dockerfile. Make it production-shaped and monitor it:

1. **Build** the image from \`api/\` as \`shop-api:1.0\`.
2. **Compose** a stack in \`~/shop/docker-compose.yml\` with:
   - \`api\`: built from \`./api\`, published on host port \`5000\` -> container \`8000\`, starting only when \`db\` is healthy.
   - \`db\`: \`postgres:16\`, \`POSTGRES_PASSWORD: secret\`, a **named volume** \`pgdata\` for its data, and a \`pg_isready\` **healthcheck**.
3. **Start** it and \`curl localhost:5000\`.
4. **Monitor**: look at the containers with \`docker compose ps\`, read the database output with \`docker logs shop-db-1\`, and check resource use with \`docker stats --no-stream\`.

> [!tip] Work incrementally
> Get the build working first, then compose, then curl, then the monitoring commands.
`,
      task: 'Build `shop-api:1.0`, write the compose stack (api + healthy db with a named volume), bring it up, curl the API on port 5000, then run `docker compose ps`, `docker logs shop-db-1` and `docker stats --no-stream`.',
      intro: 'You are in ~/shop. Run: ls api',
      setup(m) {
        m.write(H + '/shop/api/app.py', APP);
        m.write(H + '/shop/api/Dockerfile', 'FROM python:3.12-slim\nWORKDIR /app\nCOPY . .\nEXPOSE 8000\nCMD ["python", "app.py"]\n');
        m.cwd = H + '/shop';
      },
      checks: [
        { label: 'shop-api:1.0 was built', test: (m) => !!dk(m).images['shop-api:1.0'] },
        { label: 'shop-api-1 runs with port 5000 -> 8000', test: (m) => { const c = m.container('shop-api-1'); return !!c && c.status === 'running' && c.ports.some((p) => p.host === 5000 && p.container === 8000); } },
        { label: 'shop-db-1 runs with POSTGRES_PASSWORD and the pgdata volume', test: (m) => { const c = m.container('shop-db-1'); return !!c && c.status === 'running' && !!c.env.POSTGRES_PASSWORD && c.volumes.some((v) => /pgdata:\/var\/lib\/postgresql\/data/.test(v)); } },
        { label: 'Compose file has a healthcheck and service_healthy', test: (m) => { const t = m.read(H + '/shop/docker-compose.yml') || ''; return /healthcheck/.test(t) && /service_healthy/.test(t); } },
        { label: 'Fetched the API with curl localhost:5000', test: (m) => m.ran(/^curl .*:5000/) },
        { label: 'Checked status, logs and resource use', test: (m) => m.ran(/^docker compose ps/) && m.ran(/^docker logs shop-db-1/) && m.ran(/^docker stats/) },
      ],
      hints: ['`docker build -t shop-api:1.0 api` first.', 'Compose services are named `<folder>-<service>-1`: here `shop-api-1`, `shop-db-1`. The `api` service needs `build: ./api`, `ports`, and `depends_on: db: condition: service_healthy`.', 'After `docker compose up -d`: `curl localhost:5000`, `docker compose ps`, `docker logs shop-db-1`, `docker stats --no-stream`.'],
      solution: ['ls api', 'docker build -t shop-api:1.0 api', { write: 'docker-compose.yml', content: STACK }, 'docker compose up -d', 'docker compose ps', 'curl localhost:5000', 'docker logs shop-db-1', 'docker stats --no-stream'],
      recall: [
        { type: 'choice', q: 'Why does the API wait for `service_healthy` on the db?', options: ['Postgres takes time to accept connections after starting', 'Compose requires it', 'To save memory', 'For port mapping'], answer: 0, why: 'Started is not the same as ready.' },
        { type: 'choice', q: 'Which keeps database files after `docker compose down`?', options: ['A named volume', 'The container layer', 'An image layer', 'A tag'], answer: 0, why: 'Volumes outlive containers (unless `down -v`).' },
        { type: 'choice', q: '`ports: ["5000:8000"]` means...', options: ['Host 5000 forwards to container 8000', 'Container 5000 -> host 8000', 'Two ports', 'A range'], answer: 0, why: 'host:container.' },
      ],
    },
  ]);
})(typeof window !== 'undefined' ? window : globalThis);
