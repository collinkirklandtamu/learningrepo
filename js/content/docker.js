(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  const H = '/home/learner';
  const dk = (m) => m.dockerState();

  const DOCKERFILE = `FROM python:3.12-slim
WORKDIR /app
COPY app.py .
CMD ["python", "app.py"]
`;
  const FIXED = `FROM python:3.12-slim
WORKDIR /app
COPY main.py .
CMD ["python", "main.py"]
`;
  const COMPOSE = `services:
  web:
    image: nginx:alpine
    ports:
      - "8080:80"
    depends_on:
      - db
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
`;

  (LP.courses = LP.courses || []).push({
    id: 'docker', title: 'Docker', icon: '🐳', color: '#3aa0f0', engine: 'terminal',
    blurb: 'Run, build and compose containers in a simulated Docker engine. Mistakes give realistic errors.',
    skills: ['Containers', 'Images', 'Data', 'Compose'],
    lessons: [
      {
        id: 'dk-hello', title: 'Hello, containers', skill: 'Containers', xp: 20, diff: 1, kind: 'terminal',
        read: `
# Why containers?

"It works on my machine" is the oldest bug in software. A **container** packages an app with everything it needs (runtime, libraries, config) so it runs the same anywhere.

Two words to keep straight:

- **Image**: a read-only *template* (like a recipe or a class).
- **Container**: a *running instance* of an image (like a dish, or an object).

You can start many containers from one image.

~~~bash
docker --version               # is Docker installed?
docker run hello-world         # pull the image if needed, then run it
docker ps -a                   # list ALL containers (including stopped)
~~~

\`docker run\` does three things: pulls the image from a **registry** (Docker Hub) if you do not have it, creates a container, and starts it.

> [!tip] Key idea
> A container lives only as long as its main process. \`hello-world\` prints a message and exits, so the container stops, but it still shows in \`docker ps -a\`.
`,
        task: 'Check the Docker version, run the `hello-world` image, and list all containers.',
        intro: 'This sandbox simulates a Docker engine. Try: docker --version',
        setup(m) { /* nothing */ },
        checks: [
          { label: 'Ran docker --version', test: (m) => m.ran(/^docker (--version|version)/) },
          { label: 'Ran the hello-world image', test: (m) => m.ran(/^docker run .*hello-world/) },
          { label: 'Listed all containers with docker ps -a', test: (m) => m.ran(/^docker (container ls|ps) .*(-a|--all)/) },
        ],
        hints: ['`docker --version`', '`docker run hello-world`', '`docker ps -a`; the `-a` includes stopped containers.'],
        solution: ['docker --version', 'docker run hello-world', 'docker ps -a'],
        recall: [
          { type: 'choice', q: 'What is the relationship between an image and a container?', options: ['They are the same thing', 'A container is a running instance of an image', 'An image is a running container', 'Images are for Windows only'], answer: 1, why: 'Image = template. Container = running instance of it.' },
          { type: 'type', q: 'Which flag shows stopped containers too in `docker ps`?', accept: ['-a', '--all', 'a', 'all'], why: '`docker ps -a` lists all containers; plain `docker ps` shows only running ones.' },
        ],
      },
      {
        id: 'dk-ports', title: 'Images, ports & the web', skill: 'Containers', xp: 30, diff: 2, kind: 'terminal',
        read: `
# Running a web server

~~~bash
docker pull nginx                              # download an image
docker run -d --name web -p 8080:80 nginx      # run it in the background
curl localhost:8080                            # visit it
~~~

Flags worth knowing:

| Flag | Meaning |
|---|---|
| \`-d\` | **d**etached: run in the background |
| \`--name web\` | give the container a friendly name |
| \`-p 8080:80\` | publish: **host** port 8080 -> **container** port 80 |
| \`--rm\` | delete the container when it stops |

The container has its own network. Without \`-p\`, nothing outside can reach it. Format is always \`HOST:CONTAINER\`.

~~~bash
docker ps              # running containers
~~~

> [!warn] Port already allocated
> Two containers cannot publish the same host port. Pick a different left-hand number, e.g. \`-p 8081:80\`.
`,
        task: 'Pull `nginx`, then run it detached as a container named `web`, publishing your port 8080 to the container\'s port 80. Fetch the page with `curl`.',
        intro: 'No images yet. Run docker images to see.',
        setup(m) { /* nothing */ },
        checks: [
          { label: 'Pulled the nginx image', test: (m) => !!dk(m).images['nginx:latest'] },
          { label: 'A container named web is running', test: (m) => { const c = m.container('web'); return !!c && c.status === 'running'; } },
          { label: 'Host port 8080 maps to container port 80', test: (m) => { const c = m.container('web'); return !!c && c.ports.some((p) => p.host === 8080 && p.container === 80); } },
          { label: 'Fetched the page with curl localhost:8080', test: (m) => m.ran(/^curl .*(localhost|127\.0\.0\.1):8080/) },
        ],
        hints: ['`docker pull nginx`', '`docker run -d --name web -p 8080:80 nginx`', '`curl localhost:8080`'],
        solution: ['docker pull nginx', 'docker run -d --name web -p 8080:80 nginx', 'docker ps', 'curl localhost:8080'],
        recall: [
          { type: 'choice', q: 'In `-p 8080:80`, which side is the container?', options: ['8080', '80', 'Both', 'Neither'], answer: 1, why: 'The format is HOST:CONTAINER. Traffic to host port 8080 goes to container port 80.' },
          { type: 'choice', q: 'What does `-d` do in `docker run -d ...`?', options: ['Deletes the image', 'Runs the container in the background (detached)', 'Enables debug mode', 'Downloads only'], answer: 1, why: 'Detached mode returns your terminal immediately.' },
        ],
      },
      {
        id: 'dk-lifecycle', title: 'Container lifecycle', skill: 'Containers', xp: 30, diff: 2, kind: 'terminal',
        read: `
# Start, stop, inspect, clean up

Containers are cheap and disposable. These are the commands you will use daily:

~~~bash
docker ps -a                 # what exists?
docker logs <name>           # what has it printed?
docker stop <name>           # graceful stop
docker start <name>          # start a stopped container again
docker rm <name>             # delete a STOPPED container
docker rm -f <name>          # stop + delete in one go
~~~

You can refer to a container by **name** or by the first few characters of its **ID**.

A running container cannot be removed without \`-f\`; Docker makes you stop it first on purpose.

~~~bash
docker rmi nginx             # remove an IMAGE (no container may still use it)
docker container prune       # remove all stopped containers
~~~

> [!tip] Key idea
> Stopping is not deleting. A stopped container keeps its filesystem until you \`docker rm\` it, which is why old ones pile up in \`docker ps -a\`.
`,
        task: 'Three containers exist: `api` (running), `cache` (running) and `old-job` (exited). Read the logs of `cache`, remove `old-job`, and stop and remove `api`. Leave `cache` running.',
        intro: 'Containers api, cache and old-job already exist. Start with: docker ps -a',
        setup(m) { m.run(['docker run -d --name api -p 8081:80 nginx', 'docker run -d --name cache redis', 'docker run --name old-job hello-world']); },
        checks: [
          { label: 'Listed containers (docker ps)', test: (m) => m.ran(/^docker (ps|container ls)/) },
          { label: 'Read the logs of cache', test: (m) => m.ran(/^docker logs .*cache/) },
          { label: 'old-job is removed', test: (m) => !m.container('old-job') },
          { label: 'api is stopped and removed', test: (m) => !m.container('api') },
          { label: 'cache is still running', test: (m) => { const c = m.container('cache'); return !!c && c.status === 'running'; } },
        ],
        hints: ['`docker ps -a`, then `docker logs cache`.', '`docker rm old-job` works because it already exited.', 'For api: `docker stop api` then `docker rm api` (or `docker rm -f api`).'],
        solution: ['docker ps -a', 'docker logs cache', 'docker stop api', 'docker rm api', 'docker rm old-job'],
        recall: [
          { type: 'choice', q: 'You run `docker rm web` on a running container. What happens?', options: ['It is deleted', 'Docker refuses until you stop it (or use -f)', 'It restarts', 'The image is deleted'], answer: 1, why: 'Removing a running container requires `docker stop` first, or `docker rm -f`.' },
          { type: 'type', q: 'Which command prints what a container has output? (e.g. for container web)', accept: ['docker logs web', 'logs'], why: '`docker logs <container>` shows its stdout and stderr.' },
        ],
      },
      {
        id: 'dk-env-volumes', title: 'Config & data: env vars and volumes', skill: 'Data', xp: 40, diff: 3, kind: 'terminal',
        read: `
# Configuring containers, keeping their data

**Environment variables** configure a container at start with \`-e\`:

~~~bash
docker run -e POSTGRES_PASSWORD=secret postgres
~~~

Many images refuse to start without required variables. The error appears in the **logs**, so check them first when something exits unexpectedly.

**Volumes** keep data outside the container. Containers are disposable, so anything written inside vanishes when the container is removed, unless it lives on a volume.

~~~bash
docker run -d --name db \\
  -e POSTGRES_PASSWORD=secret \\
  -v pgdata:/var/lib/postgresql/data \\
  postgres
docker volume ls
~~~

\`-v name:/path\` mounts the **named volume** \`name\` at \`/path\` inside the container.

> [!tip] Debugging recipe
> Container exited? \`docker ps -a\` (is it Exited?) -> \`docker logs <name>\` (why?) -> fix the \`docker run\` flags -> \`docker rm\` the old one -> run again.
`,
        task: 'Run `postgres` detached as container `db` with **no** settings. Watch it die (`docker ps -a`) and find out why with `docker logs db`. Remove it, then run it again properly: set `POSTGRES_PASSWORD=secret` and mount the named volume `pgdata` at `/var/lib/postgresql/data`. Finish with `docker volume ls`.',
        intro: 'Fresh Docker engine. Try: docker run -d --name db postgres',
        setup(m) { /* nothing */ },
        checks: [
          { label: 'Investigated with docker logs db', test: (m) => m.ran(/^docker logs db/) },
          { label: 'db is running with POSTGRES_PASSWORD set', test: (m) => { const c = m.container('db'); return !!c && c.status === 'running' && !!c.env.POSTGRES_PASSWORD; } },
          { label: 'Volume pgdata is mounted at /var/lib/postgresql/data', test: (m) => { const c = m.container('db'); return !!c && c.volumes.includes('pgdata:/var/lib/postgresql/data'); } },
          { label: 'Listed volumes with docker volume ls', test: (m) => m.ran(/^docker volume ls/) && dk(m).volumes.includes('pgdata') },
        ],
        hints: ['`docker run -d --name db postgres` exits immediately. Check `docker logs db`.', 'You must `docker rm db` before reusing the name.', '`docker run -d --name db -e POSTGRES_PASSWORD=secret -v pgdata:/var/lib/postgresql/data postgres`'],
        solution: ['docker run -d --name db postgres', 'docker ps -a', 'docker logs db', 'docker rm db', 'docker run -d --name db -e POSTGRES_PASSWORD=secret -v pgdata:/var/lib/postgresql/data postgres', 'docker volume ls'],
        recall: [
          { type: 'type', q: 'Which flag sets an environment variable for a container?', accept: ['-e', '--env', 'e'], why: '`-e NAME=value` (or `--env`) passes a variable in.' },
          { type: 'choice', q: 'Why use a volume for a database?', options: ['It is faster to type', 'Data survives when the container is deleted', 'It opens a port', 'Containers cannot write files otherwise'], answer: 1, why: 'Container filesystems are disposable; a volume lives independently.' },
        ],
      },
      {
        id: 'dk-dockerfile', title: 'Write a Dockerfile', skill: 'Images', xp: 40, diff: 2, kind: 'file',
        lang: 'dockerfile', file: 'Dockerfile',
        read: `
# Building your own image

A **Dockerfile** is a recipe: each instruction adds a layer to the image.

~~~dockerfile
FROM python:3.12-slim      # start from an existing image
WORKDIR /app               # cd into /app (created if needed)
COPY app.py .              # copy from your folder into the image
CMD ["python", "app.py"]   # what runs when a container starts
~~~

| Instruction | Purpose |
|---|---|
| \`FROM\` | base image (always first) |
| \`WORKDIR\` | working directory for the instructions after it |
| \`COPY src dest\` | copy files from your project into the image |
| \`RUN\` | run a command **while building** (e.g. install packages) |
| \`CMD\` | the default command **when the container starts** |
| \`EXPOSE\` | documents which port the app listens on |

Prefer the **exec form** for \`CMD\`, a JSON list with **double quotes**: \`["python", "app.py"]\`.

> [!tip] Key idea
> \`RUN\` happens once at build time; \`CMD\` happens every time a container starts. Docker caches layers, so put rarely-changing steps (like installing dependencies) *before* frequently-changing ones (your code).
`,
        task: 'Write a Dockerfile that starts `FROM python:3.12-slim`, sets `WORKDIR /app`, copies `app.py` in, and runs it with `CMD ["python", "app.py"]` (exec form).',
        starter: '# Package a tiny Python app.\n# app.py prints a message when it runs.\n\n',
        checks: [
          { label: 'Starts FROM python:3.12-slim (or python:3.12)', test: (t, c) => c.steps.length > 0 && c.steps[0].ins === 'FROM' && /^python:3\.12(-slim)?$/.test(c.steps[0].arg.trim()) },
          { label: 'Sets WORKDIR /app', test: (t, c) => c.steps.some((s) => s.ins === 'WORKDIR' && s.arg.trim() === '/app') },
          { label: 'Copies app.py into the image', test: (t, c) => c.steps.some((s) => s.ins === 'COPY' && /\bapp\.py\b/.test(s.arg)) },
          { label: 'COPY comes after WORKDIR', test: (t, c) => { const w = c.steps.findIndex((s) => s.ins === 'WORKDIR'); const p = c.steps.findIndex((s) => s.ins === 'COPY'); return w >= 0 && p > w; } },
          { label: 'CMD uses exec form: ["python", "app.py"]', test: (t, c) => { const s = c.steps.find((x) => x.ins === 'CMD'); if (!s) return false; try { const a = JSON.parse(s.arg); return a.length === 2 && a[0] === 'python' && a[1] === 'app.py'; } catch (e) { return false; } } },
        ],
        hints: ['Order: `FROM`, `WORKDIR`, `COPY`, `CMD`.', '`COPY app.py .` (the dot means the current WORKDIR).', 'Exec form needs double quotes: `CMD ["python", "app.py"]`.'],
        solution: DOCKERFILE,
        recall: [
          { type: 'choice', q: 'What is the difference between `RUN` and `CMD`?', options: ['None', 'RUN executes at build time; CMD sets what runs when a container starts', 'CMD executes at build time; RUN at start', 'RUN is for Windows'], answer: 1, why: 'RUN bakes results into a layer; CMD is the startup command.' },
          { type: 'type', q: 'Which instruction must come first in a Dockerfile (after optional ARGs)?', accept: ['from', 'FROM'], why: '`FROM` picks the base image everything else builds on.' },
        ],
      },
      {
        id: 'dk-build', title: 'Build, break, fix, run', skill: 'Images', xp: 45, diff: 3, kind: 'terminal',
        read: `
# docker build

~~~bash
docker build -t hello-app:1.0 .
~~~

- \`-t name:tag\` names (**t**ags) the image. Always tag your builds.
- \`.\` is the **build context**: the folder whose files \`COPY\` can see.

Then run it like any image:

~~~bash
docker run hello-app:1.0
docker images
~~~

## Reading build errors

Builds fail, and the message is your friend. The classic one:

~~~
ERROR: ... "/app.py": not found
~~~

It means \`COPY app.py .\` found no file called \`app.py\` in the context. Check the file name, then fix the Dockerfile and rebuild. Docker reuses cached layers, so rebuilds are quick.

Edit a file in the sandbox with \`nano Dockerfile\` (a small editor opens; click Save when done).

> [!tip] Key idea
> Build fails -> read the **last lines** of the error -> fix the Dockerfile or the files -> rebuild. Tight loops beat guessing.
`,
        task: 'The project in `~/hello-app` has a Dockerfile, but the build fails. Run the build, read the error, fix the Dockerfile with `nano`, rebuild as `hello-app:1.0`, and run the container to see its message.',
        intro: 'You are in ~/hello-app. Run ls and cat Dockerfile, then build.',
        setup(m) {
          m.write(H + '/hello-app/main.py', 'print("Hello from my container!")\n');
          m.write(H + '/hello-app/Dockerfile', DOCKERFILE);
          m.cwd = H + '/hello-app';
        },
        checks: [
          { label: 'First build failed (and you read the error)', test: (m) => m.cmds.some((c) => /^docker build/.test(c.line) && !c.ok) },
          { label: 'Image hello-app:1.0 exists', test: (m) => !!dk(m).images['hello-app:1.0'] },
          { label: 'Ran the container and saw "Hello from my container!"', test: (m) => m.ran(/^docker run .*hello-app:1\.0/) && dk(m).containers.some((c) => c.image === 'hello-app:1.0' && c.logs.includes('Hello from my container!')) },
        ],
        hints: ['`docker build -t hello-app:1.0 .` fails: there is no app.py.', 'The real file is `main.py`. Edit both the `COPY` line and the `CMD` line.', 'Then rebuild and `docker run hello-app:1.0`.'],
        solution: ['docker build -t hello-app:1.0 .', { write: 'Dockerfile', content: FIXED }, 'docker build -t hello-app:1.0 .', 'docker run hello-app:1.0'],
        recall: [
          { type: 'choice', q: 'In `docker build -t app:1.0 .`, what is the final `.`?', options: ['The tag', 'The build context (current folder)', 'The image name', 'A flag'], answer: 1, why: 'The context is the folder whose files the Dockerfile can COPY.' },
          { type: 'choice', q: '`COPY app.py .` fails with "not found". What is the most likely cause?', options: ['Docker is offline', 'No file named app.py in the build context', 'The base image is too old', 'Missing -t flag'], answer: 1, why: 'COPY can only see files inside the build context, and the name must match exactly.' },
        ],
      },
      {
        id: 'dk-compose', title: 'Docker Compose', skill: 'Compose', xp: 55, diff: 3, kind: 'terminal',
        read: `
# Many containers, one file

Real apps need several services (a web server, a database, a cache). Starting each with a long \`docker run\` is error-prone. **Compose** describes them all in one YAML file and starts everything with one command.

~~~yaml
services:
  web:
    image: nginx:alpine
    ports:
      - "8080:80"
    depends_on:
      - db
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
~~~

Every \`docker run\` flag has a Compose key: \`-p\` -> \`ports\`, \`-e\` -> \`environment\`, \`-v\` -> \`volumes\`. \`depends_on\` controls start order.

~~~bash
docker compose up -d      # create + start everything in the background
docker compose ps         # status of this project's services
docker compose down       # stop and remove it all
~~~

Containers are named \`<folder>-<service>-1\`, so in a folder called \`stack\` you get \`stack-web-1\`.

> [!warn] YAML indentation
> Use spaces, never tabs. Lists use \`- \` dashes, maps use \`key: value\`.
`,
        task: 'In `~/stack`, edit `docker-compose.yml` to define two services: `web` (`nginx:alpine`, port 8080:80, depends on `db`) and `db` (`postgres:16`, `POSTGRES_PASSWORD: secret`, named volume `pgdata` at `/var/lib/postgresql/data`). Start it detached, check `docker compose ps`, and `curl localhost:8080`.',
        intro: 'You are in ~/stack. Open the file with: nano docker-compose.yml',
        setup(m) { m.write(H + '/stack/docker-compose.yml', '# define your services here\n'); m.cwd = H + '/stack'; },
        checks: [
          { label: 'Container stack-web-1 is running', test: (m) => { const c = m.container('stack-web-1'); return !!c && c.status === 'running'; } },
          { label: 'Container stack-db-1 is running', test: (m) => { const c = m.container('stack-db-1'); return !!c && c.status === 'running'; } },
          { label: 'web publishes port 8080 -> 80', test: (m) => { const c = m.container('stack-web-1'); return !!c && c.ports.some((p) => p.host === 8080 && p.container === 80); } },
          { label: 'db has POSTGRES_PASSWORD and the pgdata volume', test: (m) => { const c = m.container('stack-db-1'); return !!c && !!c.env.POSTGRES_PASSWORD && c.volumes.some((v) => /pgdata:\/var\/lib\/postgresql\/data/.test(v)); } },
          { label: 'Checked status with docker compose ps', test: (m) => m.ran(/^docker compose ps/) },
          { label: 'Fetched the page with curl localhost:8080', test: (m) => m.ran(/^curl .*:8080/) },
        ],
        hints: ['`nano docker-compose.yml` and type the services, 2-space indents.', 'Ports and volumes are YAML lists (lines starting with `- `).', '`docker compose up -d`, then `docker compose ps`, then `curl localhost:8080`.'],
        solution: [{ write: 'docker-compose.yml', content: COMPOSE }, 'docker compose up -d', 'docker compose ps', 'curl localhost:8080'],
        recall: [
          { type: 'choice', q: 'Which Compose key replaces `docker run -p 8080:80`?', options: ['volumes', 'ports', 'environment', 'expose'], answer: 1, why: '`ports: ["8080:80"]`.' },
          { type: 'type', q: 'Which command starts every service in the compose file in the background? (full command)', accept: ['docker compose up -d', 'docker-compose up -d'], why: '`up` creates and starts; `-d` detaches.' },
        ],
      },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
