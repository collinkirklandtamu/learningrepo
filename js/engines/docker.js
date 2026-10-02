/* Docker simulation: images, containers, ports, env, volumes, Dockerfile
 * builds and docker compose. Behaviour is modelled closely enough that the
 * mistakes learners make (forgotten -p, port clash, missing env var) produce
 * the same kind of error real Docker would. */
(function (root) {
  'use strict';
  const LP = root.LP || (typeof require !== 'undefined' ? require('./shell.js') : null);
  const { sha, splitLines, basename } = LP.util;
  const M = LP.Machine;
  const C = M.commands;

  // ---------- mini YAML (maps, lists, scalars, inline lists) ----------
  function parseYaml(text) {
    const lines = [];
    text.split('\n').forEach((raw, n) => {
      if (/^\s*\t/.test(raw)) throw new Error(`yaml: line ${n + 1}: found character '\\t' that cannot start any token (use spaces, not tabs)`);
      const t = raw.replace(/\s+#.*$/, '').trim();
      if (!t || t.startsWith('#')) return;
      lines.push({ n: n + 1, indent: raw.match(/^ */)[0].length, text: t });
    });
    let i = 0;
    const scalar = (s) => {
      s = s.trim();
      if (/^\[.*\]$/.test(s)) return s.slice(1, -1).split(',').map((x) => scalar(x)).filter((x) => x !== '');
      if (/^(['"]).*\1$/.test(s)) return s.slice(1, -1);
      return s;
    };
    function block(indent) {
      if (lines[i].text === '-' || lines[i].text.startsWith('- ')) {
        const arr = [];
        while (i < lines.length && lines[i].indent === indent && (lines[i].text === '-' || lines[i].text.startsWith('- '))) {
          const item = lines[i].text.slice(1).trim();
          i++;
          const kv = /^([\w.-]+):(?:\s+(.*))?$/.exec(item);
          if (kv) {
            const o = {};
            if (kv[2]) o[kv[1]] = scalar(kv[2]);
            else if (i < lines.length && lines[i].indent > indent) o[kv[1]] = block(lines[i].indent);
            while (i < lines.length && lines[i].indent > indent && !lines[i].text.startsWith('- ')) Object.assign(o, block(lines[i].indent));
            arr.push(o);
          } else arr.push(scalar(item));
        }
        return arr;
      }
      const obj = {};
      while (i < lines.length && lines[i].indent === indent) {
        const L = lines[i];
        const mm = /^([^:]+?):(?:\s+(.*))?$/.exec(L.text);
        if (!mm) throw new Error(`yaml: line ${L.n}: did not find expected key (is a ":" missing?)`);
        i++;
        const key = mm[1].replace(/^["']|["']$/g, '');
        if (mm[2] !== undefined && mm[2] !== '') obj[key] = scalar(mm[2]);
        else if (i < lines.length && lines[i].indent > indent) obj[key] = block(lines[i].indent);
        else if (i < lines.length && lines[i].indent === indent && lines[i].text.startsWith('- ')) obj[key] = block(indent);
        else obj[key] = null;
      }
      if (i < lines.length && lines[i].indent > indent) throw new Error(`yaml: line ${lines[i].n}: mapping values are not allowed here (check your indentation)`);
      return obj;
    }
    if (!lines.length) return {};
    const res = block(lines[0].indent);
    if (i < lines.length) throw new Error(`yaml: line ${lines[i].n}: did not find expected key (check your indentation)`);
    return res;
  }

  // ---------- registry ----------
  const REGISTRY = {
    'hello-world': { size: '13.3kB', tag: /^latest$/ },
    alpine: { size: '8.83MB', tag: /^(latest|3(\.\d+)*)$/ },
    busybox: { size: '4.26MB', tag: /^(latest|1(\.\d+)*)$/ },
    ubuntu: { size: '101MB', tag: /^(latest|\d\d\.\d\d)$/ },
    nginx: { size: '192MB', tag: /^(latest|alpine|stable|1(\.\d+)*(-alpine)?)$/ },
    python: { size: '1.02GB', tag: /^(latest|3(\.\d+)*(-slim|-alpine)?|slim|alpine)$/ },
    node: { size: '1.1GB', tag: /^(latest|\d+(\.\d+)*(-slim|-alpine)?|slim|alpine|lts)$/ },
    redis: { size: '117MB', tag: /^(latest|\d+(\.\d+)*(-alpine)?|alpine)$/ },
    postgres: { size: '438MB', tag: /^(latest|\d+(\.\d+)*(-alpine)?|alpine)$/ },
    'r-base': { size: '842MB', tag: /^(latest|\d+(\.\d+)*)$/ },
    'rocker/r-ver': { size: '842MB', tag: /^(latest|\d+(\.\d+)*)$/ },
  };
  const NAMES = ['quirky_turing', 'happy_hopper', 'brave_lovelace', 'eager_knuth', 'sleepy_ritchie', 'bold_hamilton', 'calm_ritchie', 'gentle_dijkstra'];
  const hex = (s, n) => sha(s).slice(0, n);

  function dk(m) {
    if (!m.dk) m.dk = { images: {}, containers: [], volumes: [], networks: ['bridge', 'host', 'none'], seq: 0, t: 0 };
    return m.dk;
  }
  M.prototype.dockerState = function () { return dk(this); };
  const parseRef = (r) => { const i = r.lastIndexOf(':'); return i > 0 && !r.slice(i).includes('/') ? { name: r.slice(0, i), tag: r.slice(i + 1) } : { name: r, tag: 'latest' }; };
  const refStr = (r) => `${r.name}:${r.tag}`;
  const ago = (s) => (s < 5 ? 'Less than a second' : s < 60 ? `${s} seconds` : s < 3600 ? `${Math.round(s / 60)} minutes` : `${Math.round(s / 3600)} hours`);
  const findImage = (m, ref) => { const r = parseRef(ref); return dk(m).images[refStr(r)] || null; };

  function pullImage(m, ref, io, quiet) {
    const r = parseRef(ref);
    const key = refStr(r);
    const d = dk(m);
    if (d.images[key]) return d.images[key];
    const entry = REGISTRY[r.name] || REGISTRY['library/' + r.name];
    if (!entry) {
      io.err(`Error response from daemon: pull access denied for ${r.name}, repository does not exist or may require 'docker login': denied: requested access to the resource is denied`);
      return null;
    }
    if (!entry.tag.test(r.tag)) { io.err(`Error response from daemon: manifest for ${key} not found: manifest unknown: manifest unknown`); return null; }
    if (!quiet) {
      io.out(`${r.tag}: Pulling from ${r.name.includes('/') ? r.name : 'library/' + r.name}\n${hex(key + 'a', 12)}: Pull complete\n${hex(key + 'b', 12)}: Pull complete\nDigest: sha256:${hex(key, 64)}\nStatus: Downloaded newer image for ${key}\ndocker.io/${r.name.includes('/') ? r.name : 'library/' + r.name}:${r.tag}`);
    }
    d.images[key] = { name: r.name, tag: r.tag, id: hex(key, 12), size: entry.size, t: d.t, kind: r.name };
    return d.images[key];
  }

  // ---------- what do programs inside containers print? ----------
  function litPrints(src) {
    const out = [];
    for (const mm of src.matchAll(/print\(\s*f?(["'])(.*?)\1\s*\)/g)) out.push(mm[2]);
    return out;
  }
  const isWebApp = (src) => /http\.server|flask|Flask|FastAPI|uvicorn|serve_forever|app\.run|express|listen\(/.test(src);

  // tiny read-only view of a built image's filesystem (absolute paths -> content)
  function mkfs(files, cwd) {
    if (!files) return null;
    const norm = (p) => {
      if (!p.startsWith('/')) p = (cwd === '/' ? '' : cwd) + '/' + p;
      const out = [];
      for (const seg of p.split('/')) { if (!seg || seg === '.') continue; if (seg === '..') out.pop(); else out.push(seg); }
      return '/' + out.join('/');
    };
    return {
      get: (p) => files[norm(p)],
      ls: (p) => {
        const d = norm(p || '.'), pre = d === '/' ? '/' : d + '/';
        return [...new Set(Object.keys(files).filter((f) => f.startsWith(pre)).map((f) => f.slice(pre.length).split('/')[0]))].sort();
      },
    };
  }

  // returns {out: [lines], exit, long, web:{body}}
  function runProgram(m, img, argv, env, cwd, files) {
    const res = { out: [], exit: 0, long: false };
    if (!argv.length) return res;
    const [prog, ...args] = argv[0] === 'sh' && argv[1] === '-c' ? (argv[2] || '').split(/\s+/) : argv;
    const joined = args.join(' ');
    const stripQ = (s) => s.replace(/^["']|["']$/g, '');
    switch (prog) {
      case 'echo': res.out.push(stripQ(args.join(' '))); return res;
      case 'pwd': res.out.push(cwd || '/'); return res;
      case 'hostname': res.out.push(hex('host' + argv.join(), 12)); return res;
      case 'whoami': res.out.push('root'); return res;
      case 'env': Object.entries(env).forEach(([k, v]) => res.out.push(`${k}=${v}`)); return res;
      case 'ls': {
        const names = files ? files.ls(args[0]) : ['bin', 'dev', 'etc', 'home', 'lib', 'proc', 'root', 'tmp', 'usr', 'var'];
        if (names.length) res.out.push(names.join('  '));
        return res;
      }
      case 'cat': {
        const f = args[0];
        if (f === '/etc/os-release') { res.out.push(img.kind === 'ubuntu' ? 'PRETTY_NAME="Ubuntu 24.04 LTS"' : 'PRETTY_NAME="Alpine Linux v3.20"'); return res; }
        const body = files && f ? files.get(f) : undefined;
        if (body !== undefined) { res.out.push(body.replace(/\n$/, '')); return res; }
        res.out.push(`cat: can't open '${f}': No such file or directory`); res.exit = 1; return res;
      }
      case 'sleep': res.long = true; return res;
      case 'tail': if (/-f/.test(joined)) { res.long = true; return res; } break;
      case 'python': case 'python3': {
        if (args[0] === '--version' || args[0] === '-V') { res.out.push('Python 3.12.7'); return res; }
        if (args[0] === '-c') { const mm = /print\(\s*(["'])(.*)\1\s*\)/.exec(args.slice(1).join(' ')); if (mm) res.out.push(mm[2]); return res; }
        if (args[0] && files) {
          const src = files.get(args[0]);
          if (src === undefined) { res.out.push(`python: can't open file '${args[0]}': [Errno 2] No such file or directory`); res.exit = 2; return res; }
          if (isWebApp(src)) { res.long = true; res.web = { body: (/return\s+["'](.*?)["']/.exec(src) || /["'](Hello[^"']*)["']/.exec(src) || [])[1] || `Hello from ${img.name}!` }; res.out.push('Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...'); return res; }
          litPrints(src).forEach((l) => res.out.push(l.replace(/\{(\w+)\}/g, (x, k) => (env[k] !== undefined ? env[k] : x))));
          return res;
        }
        return res;
      }
      case 'node': {
        if (args[0] === '-v' || args[0] === '--version') { res.out.push('v20.18.0'); return res; }
        const mm = /console\.log\(\s*(["'])(.*)\1\s*\)/.exec(joined); if (mm) res.out.push(mm[2]);
        return res;
      }
      case 'Rscript': case 'R': {
        if (args[0] === '--version') { res.out.push('R version 4.4.1 (2024-06-14) -- "Race for Your Life"'); return res; }
        const mm = /(?:cat|print)\(\s*(["'])(.*?)\1/.exec(joined); if (mm) res.out.push(mm[2].replace(/\\n$/, ''));
        return res;
      }
      case 'uname': res.out.push('Linux'); return res;
      default: break;
    }
    res.out.push(`exec: "${prog}": executable file not found in $PATH`);
    res.exit = 127;
    return res;
  }

  // default behaviour for each public image: {long, out}
  function bootImage(m, img, name, argv, env, files) {
    const d = dk(m);
    void d;
    if (img.built) {
      const prog = argv.length ? argv : (img.built.entry || []).concat(img.built.cmd || []);
      const merged = Object.assign({}, img.built.env, env);
      return runProgram(m, img, prog, merged, img.built.workdir, mkfs(img.built.files, img.built.workdir));
    }
    switch (img.kind) {
      case 'hello-world':
        return { out: ['', 'Hello from Docker!', 'This message shows that your installation appears to be working correctly.', '', 'To generate this message, Docker took the following steps:', ' 1. The Docker client contacted the Docker daemon.', ' 2. The Docker daemon pulled the "hello-world" image from the Docker Hub.', ' 3. The Docker daemon created a new container from that image which runs the', '    executable that produces the output you are currently reading.', ' 4. The Docker daemon streamed that output to the Docker client, which sent it', '    to your terminal.'], exit: 0 };
      case 'nginx':
        if (argv.length) return runProgram(m, img, argv, env);
        return { out: ['/docker-entrypoint.sh: Configuration complete; ready for start up', '2024/10/02 10:00:00 [notice] 1#1: nginx/1.27.2', '2024/10/02 10:00:00 [notice] 1#1: start worker processes'], long: true, web: { body: '<!DOCTYPE html>\n<html>\n<head><title>Welcome to nginx!</title></head>\n<body>\n<h1>Welcome to nginx!</h1>\n</body>\n</html>' } };
      case 'redis':
        if (argv.length) return runProgram(m, img, argv, env);
        return { out: ['1:C 02 Oct 2024 10:00:00.000 * oO0OoO0OoO0Oo Redis is starting oO0OoO0OoO0Oo', '1:M 02 Oct 2024 10:00:00.001 * Server initialized', '1:M 02 Oct 2024 10:00:00.001 * Ready to accept connections tcp'], long: true };
      case 'postgres':
        if (argv.length) return runProgram(m, img, argv, env);
        if (!env.POSTGRES_PASSWORD) return { out: ['Error: Database is uninitialized and superuser password is not specified.', '       You must specify POSTGRES_PASSWORD to a non-empty value for the', '       superuser. For example, "-e POSTGRES_PASSWORD=password" on "docker run".'], exit: 1 };
        return { out: ['PostgreSQL init process complete; ready for start up.', 'LOG:  database system is ready to accept connections'], long: true };
      default:
        return runProgram(m, img, argv, env);
    }
  }

  // ---------- containers ----------
  function newName(d) { return NAMES[d.seq % NAMES.length]; }
  function portStr(c) {
    return c.ports.map((p) => `0.0.0.0:${p.host}->${p.container}/tcp`).join(', ');
  }
  function create(m, io, ref, argv, o) {
    const d = dk(m);
    const img = pullImageForRun(m, ref, io);
    if (!img) return null;
    if (o.name && d.containers.some((c) => c.name === o.name)) {
      const other = d.containers.find((c) => c.name === o.name);
      io.err(`docker: Error response from daemon: Conflict. The container name "/${o.name}" is already in use by container "${hex(other.id, 64)}". You have to remove (or rename) that container to be able to reuse that name.`);
      return null;
    }
    for (const p of o.ports) {
      const clash = d.containers.find((c) => c.status === 'running' && c.ports.some((q) => q.host === p.host));
      if (clash) {
        io.err(`docker: Error response from daemon: driver failed programming external connectivity on endpoint ${o.name || newName(d)} (${hex('ep' + p.host, 64)}): Bind for 0.0.0.0:${p.host} failed: port is already allocated.`);
        return null;
      }
    }
    for (const v of o.volumes) {
      const src = v.split(':')[0];
      if (src && !/^[/.~]/.test(src) && !d.volumes.includes(src)) d.volumes.push(src);
    }
    d.seq++;
    const env = Object.assign({ PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin' }, img.built ? img.built.env : {}, o.env);
    const boot = bootImage(m, img, o.name, argv, env);
    const c = {
      id: hex('c' + d.seq + ref + d.t, 12), name: o.name || newName(d), image: refStr(parseRef(ref)), command: argv.length ? argv.join(' ') : img.built ? [].concat(img.built.entry || [], img.built.cmd || []).join(' ') : defaultCmd(img),
      ports: o.ports, env: o.env, volumes: o.volumes, logs: boot.out, status: 'running', exit: 0, created: d.t, started: d.t, web: boot.web, long: !!boot.long, network: o.network || 'bridge', files: img.built ? img.built.files : null, workdir: img.built && img.built.workdir, img,
    };
    if (!boot.long) { c.status = 'exited'; c.exit = boot.exit || 0; c.finished = d.t; }
    else if (boot.exit) { c.status = 'exited'; c.exit = boot.exit; }
    if (boot.exit) { c.status = 'exited'; c.exit = boot.exit; c.long = false; }
    d.containers.push(c);
    return c;
  }
  const defaultCmd = (img) => ({ nginx: '"/docker-entrypoint.…"', redis: '"docker-entrypoint.s…"', postgres: '"docker-entrypoint.s…"', 'hello-world': '"/hello"', alpine: '"/bin/sh"', ubuntu: '"/bin/bash"', python: '"python3"', node: '"docker-entrypoint.s…"' }[img.kind] || '"/bin/sh"');
  function pullImageForRun(m, ref, io) {
    const existing = findImage(m, ref);
    if (existing) return existing;
    io.out(`Unable to find image '${refStr(parseRef(ref))}' locally`);
    const tmp = { chunks: [], out: (t) => io.out(t), err: (t) => tmp.chunks.push(t) };
    const img = pullImage(m, ref, tmp, false);
    if (!img) tmp.chunks.forEach((t) => io.err('docker: ' + t));
    return img;
  }

  const VALUE_FLAGS = new Set(['-p', '--publish', '-e', '--env', '-v', '--volume', '--name', '-w', '--workdir', '--network', '--net', '--restart', '-u', '--user', '--entrypoint', '-m', '--memory', '--env-file', '-h', '--hostname', '-l', '--label']);
  function parseRun(a) {
    const o = { detach: false, rm: false, it: false, name: null, ports: [], env: {}, volumes: [], workdir: null, network: null };
    let i = 0;
    for (; i < a.length; i++) {
      let x = a[i];
      if (!x.startsWith('-')) break;
      let val = null;
      if (x.startsWith('--') && x.includes('=')) { val = x.slice(x.indexOf('=') + 1); x = x.slice(0, x.indexOf('=')); }
      if (/^-[dit]+$/.test(x) && x.length > 1) { if (x.includes('d')) o.detach = true; if (x.includes('i') || x.includes('t')) o.it = true; continue; }
      if (x === '-d' || x === '--detach') { o.detach = true; continue; }
      if (x === '--rm') { o.rm = true; continue; }
      if (x === '-P' || x === '--init') continue;
      if (VALUE_FLAGS.has(x)) {
        if (val === null) val = a[++i];
        if (val === undefined) return { error: `docker: flag needs an argument: '${x}' in ${x}` };
        if (x === '-p' || x === '--publish') {
          const parts = val.split(':');
          const [host, cont] = parts.length === 3 ? [parts[1], parts[2]] : parts.length === 2 ? parts : [null, parts[0]];
          if (!/^\d+$/.test(cont || '') || (host !== null && !/^\d+$/.test(host))) return { error: `docker: Error response from daemon: invalid containerPort: ${val}` };
          o.ports.push({ host: +(host || cont), container: +cont });
        } else if (x === '-e' || x === '--env') { const [k, ...v] = val.split('='); o.env[k] = v.length ? v.join('=') : ''; }
        else if (x === '-v' || x === '--volume') o.volumes.push(val);
        else if (x === '--name') o.name = val;
        else if (x === '-w' || x === '--workdir') o.workdir = val;
        else if (x === '--network' || x === '--net') o.network = val;
        continue;
      }
      return { error: `unknown flag: ${x}\nSee 'docker run --help'.` };
    }
    return { o, image: a[i], cmd: a.slice(i + 1) };
  }

  function lookup(m, ref) {
    const d = dk(m);
    return d.containers.find((c) => c.name === ref || c.id === ref || (ref.length >= 3 && c.id.startsWith(ref))) || null;
  }
  const NOSUCH = (r) => `Error response from daemon: No such container: ${r}`;

  function table(rows) {
    const widths = rows[0].map((_, i) => Math.max(...rows.map((r) => String(r[i]).length)));
    return rows.map((r) => r.map((c, i) => (i === r.length - 1 ? String(c) : String(c).padEnd(widths[i] + 3))).join('')).join('\n');
  }

  // ---------- Dockerfile build ----------
  function parseDockerfile(text) {
    const out = [];
    const raw = text.split('\n');
    for (let i = 0; i < raw.length; i++) {
      let line = raw[i].trim();
      if (!line || line.startsWith('#')) continue;
      const startLine = i + 1;
      while (line.endsWith('\\') && i + 1 < raw.length) line = line.slice(0, -1).trim() + ' ' + raw[++i].trim();
      const mm = /^(\w+)\s*(.*)$/.exec(line);
      out.push({ n: startLine, ins: mm ? mm[1].toUpperCase() : line, arg: mm ? mm[2] : '' });
    }
    return out;
  }
  const execForm = (s) => { s = s.trim(); if (s.startsWith('[')) { try { return JSON.parse(s); } catch (e) { return null; } } return ['sh', '-c', s]; };
  const KNOWN = new Set(['FROM', 'RUN', 'CMD', 'LABEL', 'EXPOSE', 'ENV', 'ADD', 'COPY', 'ENTRYPOINT', 'VOLUME', 'USER', 'WORKDIR', 'ARG', 'ONBUILD', 'STOPSIGNAL', 'HEALTHCHECK', 'SHELL', 'MAINTAINER']);

  M.prototype.buildImage = function (io, tag, ctxDir, dockerfilePath) {
    const m = this;
    const d = dk(m);
    const dfPath = dockerfilePath ? m.abs(dockerfilePath) : ctxDir + '/Dockerfile';
    const text = m.files.get(dfPath);
    if (text === undefined) { io.err(`ERROR: failed to solve: failed to read dockerfile: open ${basename(dfPath)}: no such file or directory`); return null; }
    const steps = parseDockerfile(text);
    if (!steps.length) { io.err('ERROR: failed to solve: the Dockerfile cannot be empty'); return null; }
    const first = steps.find((s) => s.ins !== 'ARG');
    if (!first || first.ins !== 'FROM') {
      const bad = steps.find((s) => !KNOWN.has(s.ins));
      if (bad) { io.err(`ERROR: failed to solve: dockerfile parse error on line ${bad.n}: unknown instruction: ${bad.ins.toLowerCase()}`); return null; }
      io.err(`ERROR: failed to solve: no build stage in current context`);
      return null;
    }
    const ctxFiles = {};
    const pre = ctxDir === '/' ? '/' : ctxDir + '/';
    for (const [p, c] of m.files) if (p.startsWith(pre)) ctxFiles[p.slice(pre.length)] = c;
    const ignore = ctxFiles['.dockerignore'] ? splitLines(ctxFiles['.dockerignore']).map((x) => x.trim()).filter((x) => x && !x.startsWith('#')) : [];
    const state = { env: {}, workdir: '/', files: {}, cmd: null, entry: null, expose: [], base: null };
    const n = steps.filter((s) => !['ARG'].includes(s.ins)).length;
    const lines = [`[+] Building 2.4s (${n + 2}/${n + 2}) FINISHED`, ' => [internal] load build definition from Dockerfile'];
    let k = 0;
    for (const s of steps) {
      if (!KNOWN.has(s.ins)) { io.err(`ERROR: failed to solve: dockerfile parse error on line ${s.n}: unknown instruction: ${s.ins.toLowerCase()}`); return null; }
      if (s.ins === 'ARG') continue;
      k++;
      const tagStep = `[${k}/${n}]`;
      switch (s.ins) {
        case 'FROM': {
          const ref = s.arg.replace(/--platform=\S+\s*/, '').split(/\s+/)[0];
          if (!ref) { io.err(`ERROR: failed to solve: dockerfile parse error on line ${s.n}: FROM requires either one or three arguments`); return null; }
          const r = parseRef(ref);
          const entry = REGISTRY[r.name];
          if (!entry || !entry.tag.test(r.tag)) { io.err(`ERROR: failed to solve: ${ref}: failed to resolve source metadata for docker.io/library/${ref}: docker.io/library/${ref}: not found`); return null; }
          pullImage(m, ref, io, true);
          state.base = ref;
          lines.push(` => ${tagStep} FROM docker.io/library/${ref}`);
          break;
        }
        case 'WORKDIR': state.workdir = s.arg.startsWith('/') ? s.arg : (state.workdir === '/' ? '' : state.workdir) + '/' + s.arg; lines.push(` => ${tagStep} WORKDIR ${state.workdir}`); break;
        case 'ENV': {
          const parts = s.arg.includes('=') ? [...s.arg.matchAll(/(\w+)=("[^"]*"|\S*)/g)].map((x) => [x[1], x[2].replace(/^"|"$/g, '')]) : [[s.arg.split(/\s+/)[0], s.arg.split(/\s+/).slice(1).join(' ')]];
          parts.forEach(([a, b]) => { state.env[a] = b; });
          lines.push(` => ${tagStep} ENV ${s.arg}`); break;
        }
        case 'EXPOSE': state.expose.push(...s.arg.split(/\s+/).map((x) => parseInt(x, 10))); lines.push(` => ${tagStep} EXPOSE ${s.arg}`); break;
        case 'CMD': { const f = execForm(s.arg); if (!f) { io.err(`ERROR: failed to solve: dockerfile parse error on line ${s.n}: CMD is not valid JSON (use double quotes in exec form)`); return null; } state.cmd = f; lines.push(` => ${tagStep} CMD ${s.arg}`.slice(0, 60)); break; }
        case 'ENTRYPOINT': { const f = execForm(s.arg); if (!f) { io.err(`ERROR: failed to solve: dockerfile parse error on line ${s.n}: ENTRYPOINT is not valid JSON`); return null; } state.entry = f; lines.push(` => ${tagStep} ENTRYPOINT ${s.arg}`); break; }
        case 'COPY': case 'ADD': {
          const parts = s.arg.replace(/--\S+\s*/g, '').split(/\s+/).filter(Boolean);
          if (parts.length < 2) { io.err(`ERROR: failed to solve: dockerfile parse error on line ${s.n}: ${s.ins} requires at least two arguments`); return null; }
          const dest = parts.pop();
          const normAbs = (p) => { const out = []; for (const seg of p.split('/')) { if (!seg || seg === '.') continue; if (seg === '..') out.pop(); else out.push(seg); } return '/' + out.join('/'); };
          const destAbs = normAbs(dest.startsWith('/') ? dest : state.workdir + '/' + dest);
          const destIsDir = dest.endsWith('/') || dest === '.' || parts.length > 1;
          const ignored = (f) => ignore.some((ig) => { const g = ig.replace(/\/$/, ''); return f === g || f.startsWith(g + '/') || (g.startsWith('*.') && f.endsWith(g.slice(1))); });
          for (const src of parts) {
            const cleaned = src.replace(/^\.\//, '').replace(/\/$/, '');
            const whole = cleaned === '.' || cleaned === '';
            const hits = Object.keys(ctxFiles).filter((f) => f !== 'Dockerfile' && f !== '.dockerignore' && !ignored(f) && (whole || f === cleaned || f.startsWith(cleaned + '/')));
            if (!hits.length) { io.err(`ERROR: failed to solve: failed to compute cache key: failed to calculate checksum of ref: "/${cleaned}": not found`); return null; }
            for (const f of hits) {
              const isDirCopy = whole || f !== cleaned;
              const rel = whole ? f : f.slice(cleaned.length + 1);
              const target = isDirCopy ? destAbs + '/' + rel : destIsDir ? destAbs + '/' + basename(f) : destAbs;
              state.files[normAbs(target)] = ctxFiles[f];
            }
          }
          lines.push(` => ${tagStep} ${s.ins} ${s.arg}`); break;
        }
        case 'RUN': lines.push(` => ${tagStep} RUN ${s.arg}`.slice(0, 70)); break;
        default: lines.push(` => ${tagStep} ${s.ins} ${s.arg}`.slice(0, 70));
      }
    }
    if (steps.find((s) => s.ins !== 'ARG').ins !== 'FROM') return null;
    const r = parseRef(tag || 'none:latest');
    const key = refStr(r);
    const id = hex(text + key + d.t, 12);
    d.images[key] = { name: r.name, tag: r.tag, id, size: '142MB', t: d.t, kind: 'built', built: { cmd: state.cmd, entry: state.entry, env: state.env, workdir: state.workdir, files: state.files, expose: state.expose, base: state.base } };
    lines.push(' => exporting to image', ` => => naming to docker.io/library/${key}`);
    io.out(lines.join('\n'));
    return d.images[key];
  };

  // ---------- compose ----------
  const composeFile = (m, cwd) => ['compose.yaml', 'compose.yml', 'docker-compose.yml', 'docker-compose.yaml'].find((f) => m.files.has(cwd + '/' + f));
  function composeCmd(m, a, io) {
    const d = dk(m);
    const op = a.find((x) => !x.startsWith('-')) || '';
    const file = composeFile(m, m.cwd);
    if (!file) { io.err('no configuration file provided: not found'); return 1; }
    let cfg;
    try { cfg = parseYaml(m.files.get(m.cwd + '/' + file)); } catch (e) { io.err(`yaml: ${e.message.replace(/^yaml: /, '')}`); return 1; }
    const proj = basename(m.cwd).toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const svcs = cfg.services;
    if (!svcs || typeof svcs !== 'object' || Array.isArray(svcs)) { io.err('services must be a mapping'); return 1; }
    const names = Object.keys(svcs);
    const order = [];
    const visit = (n, stack) => {
      if (order.includes(n)) return;
      if (stack.includes(n)) throw new Error(`dependency cycle detected: ${[...stack, n].join(' -> ')}`);
      const dep = svcs[n] && svcs[n].depends_on;
      (Array.isArray(dep) ? dep : dep ? Object.keys(dep) : []).forEach((x) => { if (!svcs[x]) throw new Error(`service "${n}" depends on undefined service "${x}": invalid compose project`); visit(x, [...stack, n]); });
      order.push(n);
    };
    try { names.forEach((n) => visit(n, [])); } catch (e) { io.err(e.message); return 1; }
    const cname = (s) => `${proj}-${s}-1`;
    if (op === 'down') {
      const lines = [];
      for (const s of order.slice().reverse()) {
        const c = d.containers.find((x) => x.name === cname(s));
        if (c) { d.containers = d.containers.filter((x) => x !== c); lines.push(` ✔ Container ${cname(s)}  Removed`); }
      }
      if (d.networks.includes(proj + '_default')) { d.networks = d.networks.filter((x) => x !== proj + '_default'); lines.push(` ✔ Network ${proj}_default  Removed`); }
      io.out(`[+] Running ${lines.length}/${lines.length}\n${lines.join('\n')}`);
      return 0;
    }
    if (op === 'ps') {
      const rows = [['NAME', 'IMAGE', 'COMMAND', 'SERVICE', 'STATUS', 'PORTS']];
      for (const s of order) { const c = d.containers.find((x) => x.name === cname(s)); if (c) rows.push([c.name, c.image, c.command, s, c.status === 'running' ? 'Up ' + ago(d.t - c.started) : `Exited (${c.exit})`, portStr(c)]); }
      io.out(table(rows)); return 0;
    }
    if (op === 'logs') { for (const s of order) { const c = d.containers.find((x) => x.name === cname(s)); if (c) c.logs.forEach((l) => io.out(`${c.name}  | ${l}`)); } return 0; }
    if (op !== 'up') { io.err(`docker compose: '${op}' is not supported in the sandbox (try up, down, ps, logs)`); return 1; }
    const lines = [];
    if (!d.networks.includes(proj + '_default')) { d.networks.push(proj + '_default'); lines.push(` ✔ Network ${proj}_default  Created`); }
    for (const s of order) {
      const def = svcs[s] || {};
      let ref;
      if (def.build !== undefined && def.build !== null) {
        const ctx = m.abs(typeof def.build === 'string' ? def.build : def.build.context || '.');
        ref = `${proj}-${s}:latest`;
        const bio = { chunks: [], out: () => {}, err: (t) => bio.chunks.push(t) };
        if (!findImage(m, ref) || a.includes('--build')) {
          if (!m.buildImage(bio, ref, ctx, null)) { io.err(bio.chunks.join('\n') || 'build failed'); return 1; }
        }
      } else if (def.image) ref = def.image;
      else { io.err(`service "${s}" has neither an image nor a build context specified: invalid compose project`); return 1; }
      const old = d.containers.find((x) => x.name === cname(s));
      if (old && old.status === 'running') { lines.push(` ✔ Container ${cname(s)}  Running`); continue; }
      if (old) d.containers = d.containers.filter((x) => x !== old);
      const pio = { chunks: [], out: () => {}, err: (t) => pio.chunks.push(t) };
      if (!findImage(m, ref) && !pullImage(m, ref, pio, true)) { io.err(pio.chunks.join('\n')); return 1; }
      const env = {};
      if (Array.isArray(def.environment)) def.environment.forEach((e) => { const [k, ...v] = String(e).split('='); env[k] = v.join('='); });
      else if (def.environment && typeof def.environment === 'object') Object.entries(def.environment).forEach(([k, v]) => { env[k] = v == null ? '' : String(v); });
      const ports = (def.ports || []).map((p) => { const parts = String(p).replace(/["']/g, '').split(':'); return { host: +parts[parts.length - 2 >= 0 && parts.length > 1 ? parts.length - 2 : 0], container: +parts[parts.length - 1] }; });
      const eio = { chunks: [], out: () => {}, err: (t) => eio.chunks.push(t) };
      const c = create(m, eio, ref, [], { name: cname(s), ports, env, volumes: def.volumes || [], network: proj + '_default' });
      if (!c) { io.err(eio.chunks.join('\n').replace(/^docker: /, '')); return 1; }
      lines.push(c.status === 'running' ? ` ✔ Container ${cname(s)}  Started` : ` ✘ Container ${cname(s)}  Exited (${c.exit})`);
    }
    io.out(`[+] Running ${lines.length}/${lines.length}\n${lines.join('\n')}`);
    if (!a.includes('-d') && !a.includes('--detach')) io.out('(Attached mode would stream logs here. The sandbox returns control - use "docker compose logs".)');
    return 0;
  }

  // ---------- command ----------
  C.docker = function (m, a, io) {
    const d = dk(m);
    d.t += 5;
    let [cmd, ...r] = a;
    if (!cmd || cmd === '--help' || cmd === 'help') { io.out('Usage:  docker [OPTIONS] COMMAND\n\nCommon Commands:\n  run         Create and run a new container from an image\n  exec        Execute a command in a running container\n  ps          List containers\n  build       Build an image from a Dockerfile\n  pull        Download an image from a registry\n  images      List images\n  logs        Fetch the logs of a container\n  compose     Run multi-container apps'); return 0; }
    if (cmd === '--version' || cmd === '-v') { io.out('Docker version 27.3.1, build ce12230'); return 0; }
    if (cmd === 'version') { io.out('Client:\n Version:           27.3.1\n API version:       1.47\nServer: Docker Engine - Community\n Engine:\n  Version:          27.3.1'); return 0; }
    if (cmd === 'info') { io.out(`Containers: ${d.containers.length}\n Running: ${d.containers.filter((c) => c.status === 'running').length}\nImages: ${Object.keys(d.images).length}\nServer Version: 27.3.1`); return 0; }
    if (cmd === 'compose') return composeCmd(m, r, io);
    if (cmd === 'container' || cmd === 'image') {
      const sub = r.shift();
      cmd = { ls: cmd === 'image' ? 'images' : 'ps', list: cmd === 'image' ? 'images' : 'ps', rm: cmd === 'image' ? 'rmi' : 'rm', remove: cmd === 'image' ? 'rmi' : 'rm', prune: 'prune' }[sub] || sub;
    }
    if (cmd === 'volume' || cmd === 'network') {
      const sub = r.shift();
      const list = cmd === 'volume' ? d.volumes : d.networks;
      if (sub === 'create') { if (!r[0]) { io.err(`"docker ${cmd} create" requires at most 1 argument.`); return 1; } if (!list.includes(r[0])) list.push(r[0]); io.out(r[0]); return 0; }
      if (sub === 'ls' || sub === 'list') { io.out(table([cmd === 'volume' ? ['DRIVER', 'VOLUME NAME'] : ['NETWORK ID', 'NAME', 'DRIVER', 'SCOPE'], ...list.map((n) => (cmd === 'volume' ? ['local', n] : [hex('net' + n, 12), n, n === 'host' || n === 'none' ? n : 'bridge', 'local']))])); return 0; }
      if (sub === 'rm') { const i = list.indexOf(r[0]); if (i < 0) { io.err(`Error response from daemon: ${cmd === 'volume' ? 'get ' + r[0] + ': no such volume' : 'network ' + r[0] + ' not found'}`); return 1; } list.splice(i, 1); io.out(r[0]); return 0; }
      io.err(`docker ${cmd}: unsupported subcommand`); return 1;
    }
    switch (cmd) {
      case 'pull': {
        if (!r[0]) { io.err('"docker pull" requires exactly 1 argument.'); return 1; }
        if (!/:/.test(r[0].replace(/\/[^/]*$/, '/')) && !r[0].includes(':')) io.out('Using default tag: latest');
        return pullImage(m, r[0], io) ? 0 : 1;
      }
      case 'images': {
        const rows = [['REPOSITORY', 'TAG', 'IMAGE ID', 'CREATED', 'SIZE']];
        Object.values(d.images).forEach((i) => rows.push([i.name, i.tag, i.id, i.built ? 'Less than a second ago' : '3 weeks ago', i.size]));
        io.out(table(rows)); return 0;
      }
      case 'rmi': {
        let code = 0;
        for (const ref of r.filter((x) => !x.startsWith('-'))) {
          const key = refStr(parseRef(ref));
          const img = d.images[key];
          if (!img) { io.err(`Error response from daemon: No such image: ${ref}`); code = 1; continue; }
          const user = d.containers.find((c) => c.image === key);
          if (user && !r.includes('-f')) { io.err(`Error response from daemon: conflict: unable to remove repository reference "${key}" (must force) - container ${user.id} is using its referenced image ${img.id}`); code = 1; continue; }
          delete d.images[key];
          io.out(`Untagged: ${key}\nDeleted: sha256:${hex(key, 64)}`);
        }
        return code;
      }
      case 'run': {
        const p = parseRun(r);
        if (p.error) { io.err(p.error); return 125; }
        if (!p.image) { io.err('docker: "docker run" requires at least 1 argument.\nSee \'docker run --help\'.'); return 125; }
        if (p.o.name && !/^[a-zA-Z0-9][a-zA-Z0-9_.-]+$/.test(p.o.name)) { io.err(`docker: Error response from daemon: Invalid container name (${p.o.name}), only [a-zA-Z0-9][a-zA-Z0-9_.-] are allowed.`); return 125; }
        const c = create(m, io, p.image, p.cmd, p.o);
        if (!c) return 125;
        if (p.o.detach) { io.out(hex(c.id, 64)); }
        else {
          c.logs.forEach((l) => io.out(l));
          if (c.status === 'running') {
            io.out('^C\n(The container runs in the foreground, so a real terminal would be blocked here. The sandbox pressed Ctrl+C for you - add -d to run it in the background.)');
            c.status = 'exited'; c.exit = 0; c.long = false; c.web = null;
          }
          if (p.o.rm) d.containers = d.containers.filter((x) => x !== c);
        }
        if (p.o.rm && c.status === 'exited') d.containers = d.containers.filter((x) => x !== c);
        return p.o.detach ? 0 : c.exit;
      }
      case 'ps': {
        const all = r.includes('-a') || r.includes('--all');
        const rows = [['CONTAINER ID', 'IMAGE', 'COMMAND', 'CREATED', 'STATUS', 'PORTS', 'NAMES']];
        for (const c of d.containers) {
          if (!all && c.status !== 'running') continue;
          rows.push([c.id, c.image, c.command.length > 22 ? c.command.slice(0, 21) + '…' : c.command, ago(d.t - c.created) + ' ago', c.status === 'running' ? 'Up ' + ago(d.t - c.started) : `Exited (${c.exit}) ${ago(d.t - (c.finished || c.created))} ago`, portStr(c) || (c.img && c.img.built && c.img.built.expose.length && c.status === 'running' ? c.img.built.expose.map((p) => p + '/tcp').join(', ') : ''), c.name]);
        }
        io.out(table(rows)); return 0;
      }
      case 'stop': case 'kill': case 'start': case 'restart': case 'pause': {
        let code = 0;
        for (const ref of r.filter((x) => !x.startsWith('-') && !/^\d+$/.test(x))) {
          const c = lookup(m, ref);
          if (!c) { io.err(NOSUCH(ref)); code = 1; continue; }
          if (cmd === 'stop' || cmd === 'kill') { c.status = 'exited'; c.exit = cmd === 'stop' ? 0 : 137; c.finished = d.t; }
          else if (c.exit === 0 || c.long || cmd === 'restart') {
            const clash = c.ports.find((p) => d.containers.some((x) => x !== c && x.status === 'running' && x.ports.some((q) => q.host === p.host)));
            if (clash) { io.err(`Error response from daemon: driver failed programming external connectivity on endpoint ${c.name}: Bind for 0.0.0.0:${clash.host} failed: port is already allocated`); code = 1; continue; }
            c.status = c.long || c.web || c.img.kind === 'nginx' || c.img.kind === 'redis' || c.img.kind === 'postgres' ? 'running' : 'exited'; c.started = d.t;
          } else { io.err(`Error: failed to start containers: ${ref}`); code = 1; continue; }
          io.out(c.name);
        }
        return code;
      }
      case 'rm': {
        let code = 0;
        const force = r.includes('-f') || r.includes('--force');
        for (const ref of r.filter((x) => !x.startsWith('-'))) {
          const c = lookup(m, ref);
          if (!c) { io.err(NOSUCH(ref)); code = 1; continue; }
          if (c.status === 'running' && !force) { io.err(`Error response from daemon: cannot remove container "/${c.name}": container is running: stop the container before removing or force remove`); code = 1; continue; }
          d.containers = d.containers.filter((x) => x !== c);
          io.out(ref);
        }
        return code;
      }
      case 'prune': { const gone = d.containers.filter((c) => c.status !== 'running'); d.containers = d.containers.filter((c) => c.status === 'running'); io.out(`Deleted Containers:\n${gone.map((c) => c.id).join('\n')}`); return 0; }
      case 'logs': {
        const ref = r.filter((x) => !x.startsWith('-')).pop();
        const c = ref && lookup(m, ref);
        if (!c) { io.err(NOSUCH(ref || '')); return 1; }
        if (c.logs.length) io.out(c.logs.join('\n'));
        return 0;
      }
      case 'exec': {
        const p = r.filter((x) => !/^-[it]+$/.test(x) && x !== '--interactive' && x !== '--tty');
        const c = p[0] && lookup(m, p[0]);
        if (!c) { io.err(NOSUCH(p[0] || '')); return 1; }
        if (c.status !== 'running') { io.err(`Error response from daemon: container ${hex(c.id, 64)} is not running`); return 1; }
        const argv = p.slice(1);
        if (!argv.length) { io.err('"docker exec" requires at least 2 arguments.'); return 1; }
        if (['sh', 'bash', 'ash'].includes(argv[0]) && argv.length === 1) { io.out('(An interactive shell is not available in the sandbox. Run one-off commands instead, e.g. docker exec ' + c.name + ' ls)'); return 0; }
        const env = Object.assign({}, c.img.built ? c.img.built.env : {}, c.env);
        const res = runProgram(m, c.img, argv, env, c.workdir, mkfs(c.files, c.workdir || '/'));
        res.out.forEach((l) => io.out(l));
        return res.exit;
      }
      case 'build': {
        const tI = r.findIndex((x) => x === '-t' || x === '--tag');
        const fI = r.findIndex((x) => x === '-f' || x === '--file');
        const tag = tI >= 0 ? r[tI + 1] : null;
        const ctxArg = r.filter((x, i) => !x.startsWith('-') && r[i - 1] !== '-t' && r[i - 1] !== '--tag' && r[i - 1] !== '-f' && r[i - 1] !== '--file').pop();
        if (!ctxArg) { io.err('ERROR: "docker buildx build" requires exactly 1 argument.'); return 1; }
        if (!tag) { io.out('(Tip: name your image with -t, e.g. -t myapp:1.0)'); }
        const img = m.buildImage(io, tag || 'none', m.abs(ctxArg), fI >= 0 ? r[fI + 1] : null);
        return img ? 0 : 1;
      }
      case 'inspect': {
        const c = r[0] && lookup(m, r[0]);
        if (!c) { io.err(`Error: No such object: ${r[0] || ''}`); return 1; }
        io.out(JSON.stringify([{ Id: hex(c.id, 64), Name: '/' + c.name, State: { Status: c.status, ExitCode: c.exit }, Config: { Image: c.image, Env: Object.entries(c.env).map(([k, v]) => `${k}=${v}`) }, HostConfig: { PortBindings: Object.fromEntries(c.ports.map((p) => [p.container + '/tcp', [{ HostPort: String(p.host) }]])) } }], null, 2));
        return 0;
      }
      case 'tag': { const img = r[0] && findImage(m, r[0]); if (!img) { io.err(`Error response from daemon: No such image: ${r[0]}`); return 1; } const t = parseRef(r[1]); d.images[refStr(t)] = Object.assign({}, img, { name: t.name, tag: t.tag }); return 0; }
      default:
        io.err(`docker: '${cmd}' is not a docker command.\nSee 'docker --help'`);
        return 1;
    }
  };

  M.prototype.httpGet = function (url) {
    const mm = /^(?:https?:\/\/)?(?:localhost|127\.0\.0\.1|0\.0\.0\.0):(\d+)/.exec(url);
    if (!mm || !this.dk) return null;
    const port = +mm[1];
    const c = this.dk.containers.find((x) => x.status === 'running' && x.ports.some((p) => p.host === port));
    return c && c.web ? c.web.body : null;
  };
  M.prototype.container = function (name) { return this.dk ? this.dk.containers.find((c) => c.name === name) || null : null; };

  LP.Docker = { parseYaml, parseDockerfile, REGISTRY };
})(typeof window !== 'undefined' ? window : globalThis);
