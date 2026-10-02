(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  const H = '/home/learner';
  const dk = (m) => m.dockerState();
  const ME = 'collinkirklandtamu';
  const APP = 'from http.server import HTTPServer\n# tiny web app\nprint("serving")\ndef home():\n    return "Hello from shop"\n';
  const MULTI = `FROM node:20 AS build
WORKDIR /app
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
`;
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
  const COMPOSE_ADV = `services:
  db:
    image: postgres:16
    env_file:
      - db.env
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "postgres"]
      interval: 5s
  api:
    image: python:3.12-slim
    command: python app.py
    depends_on:
      db:
        condition: service_healthy
  debug:
    image: alpine
    command: sleep 300
    profiles:
      - debug
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
        { type: 'type', q: 'Which command creates a network called `backend`? (full command)', accept: ['docker network create backend'], why: '`docker network create backend`.' },
      ],
    },
    {
      id: 'dk-multistage', title: 'Multi-stage builds', skill: 'Images', xp: 50, diff: 3, kind: 'file',
      lang: 'dockerfile', file: 'Dockerfile',
      read: `
# Build in one image, ship another

Compilers and build tools are big and useless at runtime. A **multi-stage build** uses one stage to build and a second, tiny stage to run, copying only the result across.

~~~dockerfile
FROM node:20 AS build            # stage 1: big image with npm
WORKDIR /app
COPY . .
RUN npm run build                # produces /app/dist

FROM nginx:alpine                # stage 2: small final image
COPY --from=build /app/dist /usr/share/nginx/html
~~~

- \`AS build\` names a stage.
- \`COPY --from=build\` takes files from that stage.
- Only the **last** stage becomes the final image, so the Node toolchain never ships.
- \`docker build --target build .\` stops at a named stage (handy for debugging).

> [!tip] Key idea
> Smaller images download faster, start faster and expose less attack surface.
`,
      task: 'Write a two-stage Dockerfile: stage `build` from `node:20` (WORKDIR `/app`, `COPY . .`, `RUN npm run build`), then a final stage `FROM nginx:alpine` that copies `/app/dist` from the build stage into `/usr/share/nginx/html` and `EXPOSE 80`.',
      starter: '# Stage 1: build the site\n\n# Stage 2: serve it\n',
      checks: [
        { label: 'First stage is node:20 named build', test: (t, c) => c.steps.length > 0 && c.steps[0].ins === 'FROM' && /^node:20\s+AS\s+build$/i.test(c.steps[0].arg.trim()) },
        { label: 'Build stage runs npm run build', test: (t, c) => c.steps.some((s) => s.ins === 'RUN' && /npm run build/.test(s.arg)) },
        { label: 'Two FROM instructions', test: (t, c) => c.steps.filter((s) => s.ins === 'FROM').length === 2 },
        { label: 'Final stage is nginx:alpine', test: (t, c) => { const f = c.steps.filter((s) => s.ins === 'FROM'); return f.length === 2 && /^nginx:alpine$/.test(f[1].arg.trim()); } },
        { label: 'Copies /app/dist --from=build into the nginx html folder', test: (t, c) => c.steps.some((s) => s.ins === 'COPY' && /--from=build/.test(s.arg) && /\/app\/dist/.test(s.arg) && /\/usr\/share\/nginx\/html/.test(s.arg)) },
        { label: 'Exposes port 80', test: (t, c) => c.steps.some((s) => s.ins === 'EXPOSE' && /\b80\b/.test(s.arg)) },
      ],
      hints: ['Start with `FROM node:20 AS build`.', 'The second `FROM nginx:alpine` begins the final stage.', '`COPY --from=build /app/dist /usr/share/nginx/html`'],
      solution: MULTI,
      recall: [
        { type: 'choice', q: 'Why use a multi-stage build?', options: ['Smaller final images without build tools', 'Faster typing', 'To run two containers', 'To use two registries'], answer: 0, why: 'Only the last stage ships.' },
        { type: 'choice', q: 'What does `COPY --from=build` do?', options: ['Copies files from a previous build stage', 'Copies from GitHub', 'Copies from the host root', 'Downloads a URL'], answer: 0, why: 'It takes artifacts from the named stage.' },
        { type: 'choice', q: 'Which stage becomes the final image?', options: ['The last one', 'The first one', 'The biggest', 'All of them'], answer: 0, why: 'By default the final FROM wins.' },
        { type: 'type', q: 'Which flag builds only up to a named stage? (flag only)', accept: ['--target'], why: '`docker build --target build .`.' },
      ],
    },
    {
      id: 'dk-ignore', title: '.dockerignore & lean builds', skill: 'Images', xp: 40, diff: 2, kind: 'terminal',
      read: `
# Don't send everything to the build

\`docker build .\` sends the whole folder (the **build context**) to Docker. \`COPY . .\` then copies it all into the image, including things that should never ship: \`.git\`, \`node_modules\`, local \`.env\` secrets, logs.

A **\`.dockerignore\`** file (like \`.gitignore\`) excludes paths from the context:

~~~
node_modules/
.git/
.env
*.log
~~~

Benefits: faster builds, smaller images, and **no secrets baked into layers** (anyone who pulls the image can read its files).

> [!warn] Secrets in images are forever
> Deleting a file in a later layer does not remove it from the earlier layer. Keep secrets out with \`.dockerignore\`, and pass them at runtime with \`-e\`.
`,
      task: 'The Dockerfile uses `COPY . .`, but the folder also holds `.env` (secrets), `debug.log` and a `node_modules/` folder. Create a `.dockerignore` that excludes all three, then build the image as `shop:1.0`. The image must contain `app.py` but none of the excluded files.',
      intro: 'You are in ~/shop. Look around with ls -a.',
      setup(m) {
        m.write(H + '/shop/app.py', 'print("shop")\n');
        m.write(H + '/shop/.env', 'API_KEY=supersecret\n');
        m.write(H + '/shop/debug.log', 'noise\n');
        m.write(H + '/shop/node_modules/lib/index.js', '// big\n');
        m.write(H + '/shop/Dockerfile', 'FROM python:3.12-slim\nWORKDIR /app\nCOPY . .\nCMD ["python", "app.py"]\n');
        m.cwd = H + '/shop';
      },
      checks: [
        { label: '.dockerignore lists .env, *.log (or debug.log) and node_modules', test: (m) => { const t = m.read(H + '/shop/.dockerignore') || ''; return /\.env/.test(t) && /(\*\.log|debug\.log)/.test(t) && /node_modules/.test(t); } },
        { label: 'Image shop:1.0 was built', test: (m) => !!dk(m).images['shop:1.0'] },
        { label: 'Image contains app.py', test: (m) => { const i = dk(m).images['shop:1.0']; return !!(i && i.built && Object.keys(i.built.files).some((f) => /app\.py$/.test(f))); } },
        { label: 'Image does NOT contain .env, debug.log or node_modules', test: (m) => { const i = dk(m).images['shop:1.0']; return !!(i && i.built) && !Object.keys(i.built.files).some((f) => /\.env$|debug\.log$|node_modules/.test(f)); } },
      ],
      hints: ['`echo ".env" > .dockerignore`, then append the others with `>>`.', 'Patterns: `.env`, `*.log`, `node_modules/`.', '`docker build -t shop:1.0 .`'],
      solution: ['ls -a', 'echo ".env" > .dockerignore', 'echo "*.log" >> .dockerignore', 'echo "node_modules/" >> .dockerignore', 'docker build -t shop:1.0 .'],
      recall: [
        { type: 'choice', q: 'What is the "build context"?', options: ['The folder sent to Docker for the build', 'The base image', 'The running container', 'The registry'], answer: 0, why: '`docker build .` uploads that directory.' },
        { type: 'choice', q: 'Why keep `.env` out of the image?', options: ['Anyone who pulls the image can read its files', 'It is too large', 'Docker cannot read it', 'It slows startup'], answer: 0, why: 'Image layers are not private.' },
        { type: 'choice', q: 'How should you provide secrets to a running container?', options: ['At runtime with -e or secrets', 'COPY them into the image', 'In the Dockerfile', 'In the image tag'], answer: 0, why: 'Inject at runtime.' },
        { type: 'type', q: 'What is the name of the ignore file for Docker builds? (file name)', accept: ['.dockerignore', 'dockerignore'], why: '`.dockerignore` in the context root.' },
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
        { type: 'choice', q: 'What can wait for "healthy" in Compose?', options: ['depends_on with condition: service_healthy', 'ports', 'volumes', 'image'], answer: 0, why: 'Start order that waits for readiness.' },
      ],
    },
    {
      id: 'dk-registry', title: 'Tag, login & push to a registry', skill: 'Images', xp: 45, diff: 3, kind: 'terminal',
      read: `
# Share an image

A **registry** (Docker Hub, GHCR) stores images so others can \`docker pull\` them. An image name has the shape:

~~~
[registry/]namespace/repository:tag
collinkirklandtamu/myapp:1.0
~~~

The **namespace** must be your username (or organisation) to push. So give your local image a second name with \`docker tag\`, log in, and push:

~~~bash
docker build -t myapp:1.0 .
docker tag myapp:1.0 collinkirklandtamu/myapp:1.0
docker login -u collinkirklandtamu
docker push collinkirklandtamu/myapp:1.0
~~~

Always use **explicit version tags** (\`1.0\`), not just \`latest\`: \`latest\` is only a default name and moves.

> [!warn] No tag = latest
> \`docker pull myapp\` means \`myapp:latest\`. Pin versions in production so deployments are repeatable.
`,
      task: `Build the image as \`myapp:1.0\`, tag it \`${ME}/myapp:1.0\`, log in as \`${ME}\` (\`docker login -u ${ME} -p x\`) and push it. Try pushing **before** logging in first to read the error.`,
      intro: 'You are in ~/myapp, which has a Dockerfile.',
      setup(m) { m.write(H + '/myapp/app.py', 'print("myapp")\n'); m.write(H + '/myapp/Dockerfile', 'FROM python:3.12-slim\nWORKDIR /app\nCOPY app.py .\nCMD ["python", "app.py"]\n'); m.cwd = H + '/myapp'; },
      checks: [
        { label: 'myapp:1.0 built', test: (m) => !!dk(m).images['myapp:1.0'] },
        { label: `${ME}/myapp:1.0 tagged`, test: (m) => !!dk(m).images[`${ME}/myapp:1.0`] },
        { label: 'A push was denied before login', test: (m) => m.cmds.some((c) => /^docker push/.test(c.line) && !c.ok) },
        { label: 'Logged in', test: (m) => dk(m).user === ME },
        { label: 'Image is in the registry', test: (m) => !!dk(m).registry[`${ME}/myapp:1.0`] },
      ],
      hints: ['`docker build -t myapp:1.0 .` then `docker tag myapp:1.0 ' + ME + '/myapp:1.0`.', 'A push before login is denied: that is the lesson.', '`docker login -u ' + ME + ' -p x`, then push again.'],
      solution: ['docker build -t myapp:1.0 .', `docker tag myapp:1.0 ${ME}/myapp:1.0`, `docker push ${ME}/myapp:1.0`, `docker login -u ${ME} -p x`, `docker push ${ME}/myapp:1.0`],
      recall: [
        { type: 'choice', q: 'Why must the image name start with your username to push to Docker Hub?', options: ['The namespace identifies who owns the repository', 'It is a style choice', 'For speed', 'It is optional'], answer: 0, why: 'You can only push to your own namespace.' },
        { type: 'choice', q: 'What does `docker tag a b` do?', options: ['Gives image a a second name b (no copy)', 'Renames a container', 'Uploads a', 'Deletes a'], answer: 0, why: 'A tag is another name for the same image ID.' },
        { type: 'choice', q: 'Why avoid relying on `latest`?', options: ['It moves over time, so builds are not repeatable', 'It is slower', 'It is illegal', 'It does not exist'], answer: 0, why: 'Pin explicit versions.' },
        { type: 'type', q: 'Which command uploads an image to a registry? (command)', accept: ['docker push'], why: '`docker push name:tag`.' },
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
        { type: 'choice', q: 'How do you change the environment of an existing container?', options: ['You cannot: remove and re-run it with new flags', 'docker env set', 'docker edit', 'Restart it'], answer: 0, why: 'Containers are disposable and immutable.' },
        { type: 'type', q: 'Which command copies a file out of a container? (start of command)', accept: ['docker cp'], why: '`docker cp api:/app/app.py .`.' },
      ],
    },
    {
      id: 'dk-mounts', title: 'Bind mounts vs named volumes', skill: 'Data', xp: 45, diff: 3, kind: 'terminal',
      read: `
# Two ways to share files with a container

| | Named volume | Bind mount |
|---|---|---|
| Syntax | \`-v pgdata:/var/lib/postgresql/data\` | \`-v /home/learner/site:/usr/share/nginx/html\` |
| Managed by | Docker | you (a host folder) |
| Good for | databases, persistent app data | live-editing source or config during development |

A **bind mount** maps a real folder from your computer into the container. Edit a file on the host and the container sees it **immediately**: no rebuild.

~~~bash
docker run -d --name site -p 8080:80 \\
  -v /home/learner/site:/usr/share/nginx/html nginx
curl localhost:8080          # shows the host's index.html
~~~

Add \`:ro\` (\`...:/usr/share/nginx/html:ro\`) to make the mount **read-only** inside the container, a good habit for config.

> [!tip] Key idea
> Bind mounts for development, named volumes for data you want Docker to look after.
`,
      task: 'Serve the local folder `~/site` with nginx: run detached container `site` publishing `8080:80` and bind-mount `/home/learner/site` to `/usr/share/nginx/html`. Check with `curl localhost:8080`, then edit `index.html` on the host (`echo "<h1>Version 2</h1>" > index.html`) and `curl` again to see it change without restarting.',
      intro: 'You are in ~/site, which contains index.html.',
      setup(m) { m.write(H + '/site/index.html', '<h1>Version 1</h1>\n'); m.cwd = H + '/site'; },
      checks: [
        { label: 'site is running with port 8080 -> 80', test: (m) => { const c = m.container('site'); return !!c && c.status === 'running' && c.ports.some((p) => p.host === 8080 && p.container === 80); } },
        { label: 'Bind mount of /home/learner/site onto /usr/share/nginx/html', test: (m) => { const c = m.container('site'); return !!c && c.volumes.some((v) => v.startsWith('/home/learner/site:/usr/share/nginx/html')); } },
        { label: 'index.html was edited on the host', test: (m) => /Version 2/.test(m.read(H + '/site/index.html') || '') },
        { label: 'The live container now serves Version 2', test: (m) => /Version 2/.test(m.httpGet('http://localhost:8080') || '') },
        { label: 'Fetched the page with curl', test: (m) => m.ran(/^curl .*8080/) },
      ],
      hints: ['`docker run -d --name site -p 8080:80 -v /home/learner/site:/usr/share/nginx/html nginx`', 'Absolute host path on the left of the colon.', 'No restart needed after editing the file.'],
      solution: ['docker run -d --name site -p 8080:80 -v /home/learner/site:/usr/share/nginx/html nginx', 'curl localhost:8080', 'echo "<h1>Version 2</h1>" > index.html', 'curl localhost:8080'],
      recall: [
        { type: 'choice', q: 'Which is best for live-editing source code in development?', options: ['A bind mount', 'A named volume', 'COPY in the Dockerfile', 'An env var'], answer: 0, why: 'Host edits appear instantly.' },
        { type: 'choice', q: 'Which is best for a database\'s data directory?', options: ['A named volume', 'A bind mount of /tmp', 'The container filesystem', 'An image layer'], answer: 0, why: 'Docker manages it and it survives rm.' },
        { type: 'choice', q: 'What does `:ro` after a mount do?', options: ['Makes it read-only inside the container', 'Removes it', 'Runs as root', 'Rotates logs'], answer: 0, why: 'Protects host files.' },
        { type: 'choice', q: 'How can you tell a bind mount from a named volume in `-v`?', options: ['A bind mount starts with a path (/ or ./)', 'It has a colon', 'It has :ro', 'You cannot'], answer: 0, why: 'A bare name means a named volume.' },
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
        { type: 'choice', q: 'Why set limits in production?', options: ['One runaway container cannot starve the others', 'It makes images smaller', 'It is required by Docker', 'It speeds up pulls'], answer: 0, why: 'Isolation of resource usage.' },
      ],
    },
    {
      id: 'dk-compose-adv', title: 'Compose: env files, profiles & health', skill: 'Compose', xp: 60, diff: 3, kind: 'terminal',
      read: `
# A production-shaped Compose file

Three features make real stacks manageable:

**\`env_file\`** keeps settings out of the YAML:
~~~yaml
db:
  image: postgres:16
  env_file:
    - db.env            # POSTGRES_PASSWORD=secret  (don't commit real secrets!)
~~~

**\`healthcheck\` + \`depends_on: condition: service_healthy\`** so the API only starts when the database is actually ready, not merely started:
~~~yaml
  healthcheck:
    test: ["CMD", "pg_isready", "-U", "postgres"]
    interval: 5s
api:
  depends_on:
    db:
      condition: service_healthy
~~~

**\`profiles\`** make a service optional: it only starts when you ask.
~~~yaml
debug:
  image: alpine
  profiles: [debug]     # docker compose --profile debug up -d
~~~

> [!tip] Key idea
> Config in env files, readiness via healthchecks, optional tools via profiles. Same file for development and production.
`,
      task: 'In `~/stack` write `docker-compose.yml` with `db` (`postgres:16`, `env_file: db.env`, a `pg_isready` healthcheck), `api` (`python:3.12-slim`, command `python app.py`, depends on `db` being **healthy**) and `debug` (`alpine`, `sleep 300`, only in the `debug` profile). Start the stack. `db` and `api` must run; `debug` must **not**. Then start the debug profile too.',
      intro: 'You are in ~/stack. db.env already holds POSTGRES_PASSWORD.',
      setup(m) { m.write(H + '/stack/db.env', 'POSTGRES_PASSWORD=secret\n'); m.write(H + '/stack/docker-compose.yml', '# define services\n'); m.write(H + '/stack/app.py', 'print("api up")\n'); m.cwd = H + '/stack'; },
      checks: [
        { label: 'stack-db-1 running with the password from db.env', test: (m) => { const c = m.container('stack-db-1'); return !!c && c.status === 'running' && c.env.POSTGRES_PASSWORD === 'secret'; } },
        { label: 'stack-api-1 started', test: (m) => { const c = m.container('stack-api-1'); return !!c; } },
        { label: 'The debug service uses a profile', test: (m) => /profiles/.test(m.read(H + '/stack/docker-compose.yml') || '') },
        { label: 'api waits for a healthy db', test: (m) => /service_healthy/.test(m.read(H + '/stack/docker-compose.yml') || '') },
        { label: 'stack-debug-1 is running (profile enabled)', test: (m) => { const c = m.container('stack-debug-1'); return !!c && c.status === 'running'; } },
        { label: 'Ran compose with --profile debug', test: (m) => m.ran(/^docker compose --profile debug up/) },
      ],
      hints: ['`nano docker-compose.yml`. Use `env_file`, `healthcheck.test`, `depends_on.db.condition`, `profiles`.', '`docker compose up -d` starts everything except profiled services.', '`docker compose --profile debug up -d` adds the debug service.'],
      solution: [{ write: 'docker-compose.yml', content: COMPOSE_ADV }, 'docker compose up -d', 'docker compose ps', 'docker compose --profile debug up -d'],
      recall: [
        { type: 'choice', q: 'What does `depends_on` with `condition: service_healthy` wait for?', options: ['The dependency\'s healthcheck to pass', 'The container to exist', 'The image to build', 'The port to publish'], answer: 0, why: 'Ready, not merely started.' },
        { type: 'choice', q: 'A service with `profiles: [debug]` starts when...', options: ['You pass --profile debug', 'Always', 'Never', 'The db is healthy'], answer: 0, why: 'Profiled services are opt-in.' },
        { type: 'choice', q: 'Why use `env_file`?', options: ['Keep settings/secrets out of the YAML and out of git', 'It runs faster', 'It is required', 'It creates volumes'], answer: 0, why: 'Separate config from definition.' },
        { type: 'type', q: 'Which command stops and removes the whole Compose stack? (full command)', accept: ['docker compose down'], why: '`docker compose down`.' },
      ],
    },
    {
      id: 'dk-capstone', title: 'Capstone: ship a two-service stack', skill: 'Projects', xp: 170, diff: 3, kind: 'terminal', capstone: true,
      read: `
# Containerise a small shop

You are handed a project folder with a web API in \`api/\` and no Docker setup beyond a basic Dockerfile. Make it production-shaped:

1. **Ignore** junk: create \`api/.dockerignore\` excluding \`.env\` and \`*.log\`.
2. **Build** the image from \`api/\` as \`shop-api:1.0\` (it must not contain \`.env\`).
3. **Compose** a stack in \`~/shop/docker-compose.yml\` with:
   - \`api\`: built from \`./api\`, published on host port \`5000\` -> container \`8000\`, starting only when \`db\` is healthy.
   - \`db\`: \`postgres:16\`, \`POSTGRES_PASSWORD: secret\`, a **named volume** \`pgdata\` for its data, and a \`pg_isready\` **healthcheck**.
4. **Start** it, check \`docker compose ps\`, and \`curl localhost:5000\`.
5. **Tag and push** \`shop-api:1.0\` as \`${ME}/shop-api:1.0\` after logging in.

> [!tip] Work incrementally
> Get the build working first, then compose, then curl, then the registry. \`docker ps -a\` and \`docker logs\` are your friends.
`,
      task: 'Create `api/.dockerignore`, build `shop-api:1.0`, write the compose stack (api + healthy db with a named volume), bring it up, curl the API on port 5000, then log in and push `' + ME + '/shop-api:1.0`.',
      intro: 'You are in ~/shop. Run: ls -a api',
      setup(m) {
        m.write(H + '/shop/api/app.py', APP);
        m.write(H + '/shop/api/.env', 'API_KEY=secret\n');
        m.write(H + '/shop/api/server.log', 'noise\n');
        m.write(H + '/shop/api/Dockerfile', 'FROM python:3.12-slim\nWORKDIR /app\nCOPY . .\nEXPOSE 8000\nCMD ["python", "app.py"]\n');
        m.cwd = H + '/shop';
      },
      checks: [
        { label: 'api/.dockerignore excludes .env and logs', test: (m) => { const t = m.read(H + '/shop/api/.dockerignore') || ''; return /\.env/.test(t) && /(\*\.log|server\.log)/.test(t); } },
        { label: 'shop-api:1.0 built without .env', test: (m) => { const i = dk(m).images['shop-api:1.0']; return !!(i && i.built) && !Object.keys(i.built.files).some((f) => /\.env$/.test(f)); } },
        { label: 'shop-api-1 -> use compose names: shop-api-1 is running on 5000 -> 8000', test: (m) => { const c = m.container('shop-api-1'); return !!c && c.status === 'running' && c.ports.some((p) => p.host === 5000 && p.container === 8000); } },
        { label: 'shop-db-1 runs with POSTGRES_PASSWORD and the pgdata volume', test: (m) => { const c = m.container('shop-db-1'); return !!c && c.status === 'running' && !!c.env.POSTGRES_PASSWORD && c.volumes.some((v) => /pgdata:\/var\/lib\/postgresql\/data/.test(v)); } },
        { label: 'Compose file has a healthcheck and service_healthy', test: (m) => { const t = m.read(H + '/shop/docker-compose.yml') || ''; return /healthcheck/.test(t) && /service_healthy/.test(t); } },
        { label: 'Fetched the API with curl localhost:5000', test: (m) => m.ran(/^curl .*:5000/) },
        { label: `${ME}/shop-api:1.0 is in the registry`, test: (m) => !!dk(m).registry[`${ME}/shop-api:1.0`] },
      ],
      hints: ['`echo ".env" > api/.dockerignore`, then `echo "*.log" >> api/.dockerignore`, then `docker build -t shop-api:1.0 api`.', 'Compose services are named `<folder>-<service>-1`: here `shop-api-1`, `shop-db-1`.', 'After `docker compose up -d`: `curl localhost:5000`. Then `docker tag`, `docker login -u ' + ME + ' -p x`, `docker push`.'],
      solution: ['ls -a api', 'echo ".env" > api/.dockerignore', 'echo "*.log" >> api/.dockerignore', 'docker build -t shop-api:1.0 api', { write: 'docker-compose.yml', content: STACK }, 'docker compose up -d', 'docker compose ps', 'curl localhost:5000', `docker tag shop-api:1.0 ${ME}/shop-api:1.0`, `docker login -u ${ME} -p x`, `docker push ${ME}/shop-api:1.0`],
      recall: [
        { type: 'choice', q: 'Why does the API wait for `service_healthy` on the db?', options: ['Postgres takes time to accept connections after starting', 'Compose requires it', 'To save memory', 'For port mapping'], answer: 0, why: 'Started is not ready.' },
        { type: 'choice', q: 'Which keeps database files after `docker compose down`?', options: ['A named volume', 'The container layer', 'An image layer', 'A tag'], answer: 0, why: 'Volumes outlive containers (unless `down -v`).' },
        { type: 'choice', q: '`ports: ["5000:8000"]` means...', options: ['Host 5000 forwards to container 8000', 'Container 5000 -> host 8000', 'Two ports', 'A range'], answer: 0, why: 'host:container.' },
        { type: 'choice', q: 'What keeps secrets out of the built image?', options: ['.dockerignore', 'EXPOSE', 'A tag', 'depends_on'], answer: 0, why: 'Excluded files never enter the context.' },
        { type: 'choice', q: 'Which tag should you deploy from?', options: ['A pinned version like 1.0', 'latest only', 'none', 'test'], answer: 0, why: 'Repeatable deployments.' },
      ],
    },
  ]);
})(typeof window !== 'undefined' ? window : globalThis);
