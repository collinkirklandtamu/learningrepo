/* Sandboxed terminal: virtual filesystem + shell builtins.
 * git.js, gh.js and docker.js register more commands on top of this.
 * Pure JS, no DOM, so it can be unit-tested in Node. */
(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});

  // ---------- utilities shared by the command modules ----------
  function sha(str) {
    let out = '';
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let round = 0; out.length < 40; round++) {
      for (let i = 0; i < str.length; i++) {
        const c = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ c, 2654435761);
        h2 = Math.imul(h2 ^ c, 1597334677);
      }
      h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
      h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
      out += (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
      str += round;
    }
    return out.slice(0, 40);
  }

  const splitLines = (s) => (s === '' || s == null ? [] : s.endsWith('\n') ? s.slice(0, -1).split('\n') : s.split('\n'));
  const joinLines = (a) => (a.length ? a.join('\n') + '\n' : '');
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

  // LCS table based diff over arrays of lines
  function lcsTable(a, b) {
    const n = a.length, m = b.length;
    const t = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
    for (let i = n - 1; i >= 0; i--)
      for (let j = m - 1; j >= 0; j--)
        t[i][j] = a[i] === b[j] ? t[i + 1][j + 1] + 1 : Math.max(t[i + 1][j], t[i][j + 1]);
    return t;
  }
  function diffOps(a, b) {
    const t = lcsTable(a, b);
    const ops = [];
    let i = 0, j = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { ops.push(['=', a[i]]); i++; j++; }
      else if (t[i + 1][j] >= t[i][j + 1]) ops.push(['-', a[i++]]);
      else ops.push(['+', b[j++]]);
    }
    while (i < a.length) ops.push(['-', a[i++]]);
    while (j < b.length) ops.push(['+', b[j++]]);
    return ops;
  }
  // map base index -> index in other (or -1) for lines in the LCS
  function lcsMap(base, other) {
    const t = lcsTable(base, other);
    const map = new Array(base.length).fill(-1);
    let i = 0, j = 0;
    while (i < base.length && j < other.length) {
      if (base[i] === other[j]) { map[i] = j; i++; j++; }
      else if (t[i + 1][j] >= t[i][j + 1]) i++;
      else j++;
    }
    return map;
  }
  const same = (x, y) => x.length === y.length && x.every((v, i) => v === y[i]);

  // three-way line merge. returns {lines, conflict}
  function merge3(base, ours, theirs, oursName, theirsName) {
    const ma = lcsMap(base, ours), mb = lcsMap(base, theirs);
    const sync = [];
    for (let i = 0; i < base.length; i++) if (ma[i] >= 0 && mb[i] >= 0) sync.push(i);
    sync.push(base.length);
    const out = [];
    let conflict = false, ib = 0, ia = 0, it = 0;
    for (const s of sync) {
      const sa = s === base.length ? ours.length : ma[s];
      const st = s === base.length ? theirs.length : mb[s];
      const rb = base.slice(ib, s), ra = ours.slice(ia, sa), rt = theirs.slice(it, st);
      if (same(ra, rb)) out.push(...rt);
      else if (same(rt, rb) || same(ra, rt)) out.push(...ra);
      else {
        conflict = true;
        out.push('<<<<<<< ' + oursName, ...ra, '=======', ...rt, '>>>>>>> ' + theirsName);
      }
      if (s < base.length) out.push(base[s]);
      ib = s + 1; ia = sa + 1; it = st + 1;
    }
    return { lines: out, conflict };
  }

  function tokenize(line) {
    const toks = [];
    let cur = '', has = false, q = null;
    const push = () => { if (has) toks.push({ t: 'word', v: cur }); cur = ''; has = false; };
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (q) {
        if (c === q) q = null;
        else if (c === '\\' && q === '"' && i + 1 < line.length && '"\\$'.includes(line[i + 1])) cur += line[++i];
        else cur += c;
      } else if (c === '"' || c === "'") { q = c; has = true; }
      else if (c === '\\' && i + 1 < line.length) { cur += line[++i]; has = true; }
      else if (/\s/.test(c)) push();
      else if (c === '&' && line[i + 1] === '&') { push(); toks.push({ t: 'op', v: '&&' }); i++; }
      else if (c === '|' ) { push(); toks.push({ t: 'op', v: '|' }); }
      else if (c === '>') {
        push();
        if (line[i + 1] === '>') { toks.push({ t: 'op', v: '>>' }); i++; } else toks.push({ t: 'op', v: '>' });
      } else { cur += c; has = true; }
    }
    if (q) throw new Error('unterminated quote');
    push();
    return toks;
  }

  const dirname = (p) => (p === '/' ? '/' : p.replace(/\/[^/]*$/, '') || '/');
  const basename = (p) => p.replace(/\/+$/, '').split('/').pop();

  class Machine {
    constructor() {
      this.home = '/home/learner';
      this.cwd = this.home;
      this.files = new Map();
      this.dirs = new Set(['/', '/home', this.home]);
      this.cmds = [];      // every executed simple command {line, argv, ok}
      this.history = [];   // raw lines typed
      this.clock = 1700000000;
      this.env = { HOME: this.home, USER: 'learner' };
      this.globalConfig = {};
      this.repos = {};
      this.objects = new Map();
      this.remotes = {};
      this.ghUser = 'collinkirklandtamu';
      this.docker = null;
      this.hooks = [];
    }

    // ----- paths & files
    abs(p, cwd) {
      cwd = cwd || this.cwd;
      p = String(p).replace(/\$\{?HOME\}?/g, this.home);
      if (p === '~' || p.startsWith('~/')) p = this.home + p.slice(1);
      if (!p.startsWith('/')) p = cwd + '/' + p;
      const out = [];
      for (const seg of p.split('/')) {
        if (!seg || seg === '.') continue;
        if (seg === '..') out.pop(); else out.push(seg);
      }
      return '/' + out.join('/');
    }
    isDir(p) { return this.dirs.has(p); }
    isFile(p) { return this.files.has(p); }
    exists(p) { return this.isDir(p) || this.isFile(p); }
    mkdirp(p) {
      let cur = '';
      for (const seg of p.split('/').filter(Boolean)) { cur += '/' + seg; this.dirs.add(cur); }
    }
    write(p, content) {
      p = this.abs(p);
      this.mkdirp(dirname(p));
      this.files.set(p, content);
    }
    read(p) {
      const v = this.files.get(this.abs(p));
      return v === undefined ? null : v;
    }
    children(dir) {
      const names = new Set();
      const pre = dir === '/' ? '/' : dir + '/';
      for (const f of this.files.keys()) if (f.startsWith(pre) && !f.slice(pre.length).includes('/')) names.add(f.slice(pre.length));
      for (const d of this.dirs) if (d !== dir && d.startsWith(pre) && !d.slice(pre.length).includes('/')) names.add(d.slice(pre.length));
      return [...names].sort();
    }
    remove(p) {
      this.files.delete(p);
      const pre = p + '/';
      for (const f of [...this.files.keys()]) if (f.startsWith(pre)) this.files.delete(f);
      for (const d of [...this.dirs]) if (d === p || d.startsWith(pre)) this.dirs.delete(d);
      for (const r of Object.keys(this.repos)) if (r === p || r.startsWith(pre) || r + '/.git' === p) delete this.repos[r];
    }
    tick(n) { this.clock += n || 600; return this.clock; }

    // ----- checks used by lessons
    ran(re) { return this.cmds.some((c) => c.ok && re.test(c.line)); }
    lastOutput() { return this._last || ''; }

    prompt() {
      let p = this.cwd === this.home ? '~' : this.cwd.startsWith(this.home + '/') ? '~' + this.cwd.slice(this.home.length) : this.cwd;
      const repo = this.repoAt && this.repoAt(this.cwd);
      if (repo) p += ' (' + (repo.head.ref || 'detached') + ')';
      return p + ' $';
    }

    // ----- execution
    exec(line) {
      const res = { items: [], code: 0, clear: false, editor: null };
      line = line.trim();
      if (!line) return res;
      this.history.push(line);
      let toks;
      try { toks = tokenize(line); } catch (e) {
        res.items.push({ t: 'err', text: 'bash: unexpected EOF while looking for matching quote' });
        res.code = 2; return res;
      }
      const groups = [[]];
      for (const t of toks) { if (t.t === 'op' && t.v === '&&') groups.push([]); else groups[groups.length - 1].push(t); }
      for (const g of groups) {
        // split into pipeline stages on |
        const stages = [[]];
        for (const t of g) { if (t.t === 'op' && t.v === '|') stages.push([]); else stages[stages.length - 1].push(t); }
        let stdin = null, code = 0;
        for (let si = 0; si < stages.length; si++) {
          const st = stages[si];
          let redirect = null;
          const argv = [];
          for (let i = 0; i < st.length; i++) {
            if (st[i].t === 'op') {
              const target = st[i + 1];
              if (!target || target.t !== 'word') { res.items.push({ t: 'err', text: 'bash: syntax error near unexpected token `newline\'' }); res.code = 2; return res; }
              redirect = { mode: st[i].v, path: target.v }; i++;
            } else argv.push(st[i].v);
          }
          if (!argv.length) { if (stages.length > 1) { res.items.push({ t: 'err', text: 'bash: syntax error near unexpected token `|\'' }); res.code = 2; return res; } continue; }
          const io = { stdin, chunks: [], out: (x) => io.chunks.push({ t: 'out', text: String(x) }), err: (x) => io.chunks.push({ t: 'err', text: String(x) }) };
          const handler = Machine.commands[argv[0]];
          if (!handler) { io.err(`bash: ${argv[0]}: command not found`); code = 127; }
          else {
            try { code = handler(this, argv.slice(1), io, res) || 0; }
            catch (e) { if (typeof console !== 'undefined' && root.LP_DEBUG) console.error(e); io.err('internal sandbox error: ' + e.message); code = 1; }
          }
          let chunks = io.chunks;
          if (redirect) {
            const target = this.abs(redirect.path);
            const text = chunks.filter((c) => c.t === 'out').map((c) => c.text + '\n').join('');
            chunks = chunks.filter((c) => c.t === 'err');
            if (this.isDir(target)) { chunks.push({ t: 'err', text: `bash: ${redirect.path}: Is a directory` }); code = 1; }
            else this.write(target, (redirect.mode === '>>' ? this.read(target) || '' : '') + text);
          }
          this.cmds.push({ line: argv.join(' '), argv, ok: code === 0 });
          if (si < stages.length - 1) {
            stdin = chunks.filter((c) => c.t === 'out').map((c) => c.text).join('\n');
            res.items.push(...chunks.filter((c) => c.t === 'err'));
          } else res.items.push(...chunks);
        }
        res.code = code;
        if (code !== 0) break;
      }
      for (const h of this.hooks) {
        if (!h.done && h.when(this)) {
          h.done = true;
          h.run(this);
          if (h.msg) res.items.push({ t: 'sys', text: h.msg });
        }
      }
      this._last = res.items.map((i) => i.text).join('\n');
      return res;
    }

    // run a list of commands (used by tests and "show solution")
    run(cmds) { return cmds.map((c) => this.exec(c)); }

    // one-shot event: when(m) becomes true after any command, run(m) fires and msg is shown
    hook(when, run, msg) { this.hooks.push({ when, run, msg, done: false }); }
  }
  // Build a machine for a lesson: setup may run commands; their traces are wiped afterwards
  Machine.create = function (setup) {
    const m = new Machine();
    if (setup) setup(m);
    m.cmds.length = 0; m.history.length = 0; m._last = '';
    return m;
  };
  Machine.commands = {};
  const C = Machine.commands;

  // ----- builtins
  C.pwd = (m, a, io) => io.out(m.cwd);
  C.whoami = (m, a, io) => io.out('learner');
  C.clear = (m, a, io, res) => { res.clear = true; };
  C.echo = (m, a, io) => {
    let nl = true;
    if (a[0] === '-n') { nl = false; a = a.slice(1); }
    const text = a.join(' ').replace(/\$USER/g, 'learner').replace(/\$\{?HOME\}?/g, m.home);
    io.out(text);
    void nl;
  };
  C.cd = (m, a, io) => {
    const t = m.abs(a[0] || '~');
    if (!m.isDir(t)) { io.err(`bash: cd: ${a[0]}: ${m.isFile(t) ? 'Not a directory' : 'No such file or directory'}`); return 1; }
    m.cwd = t;
  };
  C.mkdir = (m, a, io) => {
    let p = false, code = 0;
    for (const x of a) {
      if (x === '-p') { p = true; continue; }
      const t = m.abs(x);
      if (m.exists(t) && !p) { io.err(`mkdir: cannot create directory '${x}': File exists`); code = 1; continue; }
      if (!p && !m.isDir(dirname(t))) { io.err(`mkdir: cannot create directory '${x}': No such file or directory`); code = 1; continue; }
      m.mkdirp(t);
    }
    return code;
  };
  C.touch = (m, a, io) => {
    for (const x of a) {
      const t = m.abs(x);
      if (!m.isDir(dirname(t))) { io.err(`touch: cannot touch '${x}': No such file or directory`); return 1; }
      if (!m.isFile(t) && !m.isDir(t)) m.write(t, '');
    }
  };
  C.cat = (m, a, io) => {
    let code = 0;
    for (const x of a) {
      const v = m.read(x);
      if (v === null) { io.err(`cat: ${x}: ${m.isDir(m.abs(x)) ? 'Is a directory' : 'No such file or directory'}`); code = 1; }
      else io.out(v.replace(/\n$/, ''));
    }
    return code;
  };
  C.ls = (m, a, io) => {
    const flags = a.filter((x) => x.startsWith('-')).join('');
    const paths = a.filter((x) => !x.startsWith('-'));
    const all = flags.includes('a'), long = flags.includes('l');
    const target = m.abs(paths[0] || '.');
    if (m.isFile(target)) { io.out(basename(target)); return; }
    if (!m.isDir(target)) { io.err(`ls: cannot access '${paths[0]}': No such file or directory`); return 1; }
    let names = m.children(target).filter((n) => all || !n.startsWith('.'));
    if (all) names = ['.', '..', ...names];
    const label = (n) => (n === '.' || n === '..' || m.isDir(target.replace(/\/$/, '') + '/' + n) ? n + '/' : n);
    if (long) {
      for (const n of names) {
        const full = target.replace(/\/$/, '') + '/' + n;
        const dir = n === '.' || n === '..' || m.isDir(full);
        const size = dir ? 4096 : (m.files.get(full) || '').length;
        io.out(`${dir ? 'drwxr-xr-x' : '-rw-r--r--'} 1 learner learner ${String(size).padStart(5)} Jan  1 09:00 ${label(n)}`);
      }
    } else if (names.length) io.out(names.map(label).join('  '));
  };
  C.rm = (m, a, io) => {
    const flags = a.filter((x) => x.startsWith('-')).join('');
    const rec = /[rR]/.test(flags), force = flags.includes('f');
    let code = 0;
    for (const x of a.filter((y) => !y.startsWith('-'))) {
      const t = m.abs(x);
      if (!m.exists(t)) { if (!force) { io.err(`rm: cannot remove '${x}': No such file or directory`); code = 1; } continue; }
      if (m.isDir(t) && !rec) { io.err(`rm: cannot remove '${x}': Is a directory`); code = 1; continue; }
      m.remove(t);
    }
    return code;
  };
  C.mv = (m, a, io) => {
    if (a.length < 2) { io.err('mv: missing file operand'); return 1; }
    const src = m.abs(a[0]);
    let dst = m.abs(a[1]);
    if (!m.exists(src)) { io.err(`mv: cannot stat '${a[0]}': No such file or directory`); return 1; }
    if (m.isDir(dst)) dst += '/' + basename(src);
    if (m.isFile(src)) { m.write(dst, m.files.get(src)); m.files.delete(src); }
    else {
      for (const [f, v] of [...m.files]) if (f.startsWith(src + '/')) { m.write(dst + f.slice(src.length), v); m.files.delete(f); }
      m.mkdirp(dst); m.remove(src);
    }
  };
  C.cp = (m, a, io) => {
    const rec = a.includes('-r') || a.includes('-R');
    const p = a.filter((x) => !x.startsWith('-'));
    if (p.length < 2) { io.err('cp: missing file operand'); return 1; }
    const src = m.abs(p[0]);
    let dst = m.abs(p[1]);
    if (!m.exists(src)) { io.err(`cp: cannot stat '${p[0]}': No such file or directory`); return 1; }
    if (m.isDir(dst)) dst += '/' + basename(src);
    if (m.isFile(src)) m.write(dst, m.files.get(src));
    else if (!rec) { io.err(`cp: -r not specified; omitting directory '${p[0]}'`); return 1; }
    else { m.mkdirp(dst); for (const [f, v] of [...m.files]) if (f.startsWith(src + '/')) m.write(dst + f.slice(src.length), v); }
  };
  const editor = (m, a, io, res) => {
    if (!a[0]) { io.err('usage: nano <file>'); return 1; }
    const t = m.abs(a[0]);
    if (m.isDir(t)) { io.err(`nano: ${a[0]} is a directory`); return 1; }
    res.editor = { path: t, name: a[0], content: m.files.get(t) || '' };
    m.cmdsEditing = t;
  };
  C.nano = C.vim = C.vi = C.edit = editor;
  C.history = (m, a, io) => m.history.slice(0, -1).forEach((h, i) => io.out(String(i + 1).padStart(4) + '  ' + h));
  C.help = (m, a, io) => {
    io.out('Sandbox commands: ls cd pwd mkdir touch cat echo rm mv cp nano clear history curl');
    io.out('Tools available in this sandbox: ' + Object.keys(Machine.commands).filter((c) => ['git', 'gh', 'docker'].includes(c)).join(', '));
    io.out('Tip: use ↑/↓ for history, Tab to autocomplete. "echo hi > file" writes to a file.');
  };
  C.curl = (m, a, io) => {
    const url = a.filter((x) => !x.startsWith('-')).pop();
    if (!url) { io.err('curl: try \'curl --help\' for more information'); return 2; }
    const r = m.httpGet ? m.httpGet(url) : null;
    if (!r) { io.err(`curl: (7) Failed to connect to ${url.replace(/^https?:\/\//, '')} Couldn't connect to server`); return 7; }
    io.out(r);
  };
  // ---- text filters (work with files or piped stdin)
  const inputLines = (m, a, io, files) => {
    if (files.length) {
      const out = [];
      for (const f of files) { const v = m.read(f); if (v === null) { io.err(`${C._name || 'cmd'}: ${f}: No such file or directory`); return null; } out.push(...splitLines(v)); }
      return out;
    }
    return io.stdin == null ? [] : io.stdin.split('\n').filter((l, i, arr) => !(i === arr.length - 1 && l === ''));
  };
  C.grep = (m, a, io) => {
    const flags = a.filter((x) => /^-[a-zA-Z]+$/.test(x)).join('');
    const rest = a.filter((x) => !/^-[a-zA-Z]+$/.test(x));
    if (!rest.length) { io.err('Usage: grep [OPTION]... PATTERNS [FILE]...'); return 2; }
    let re;
    try { re = new RegExp(rest[0], flags.includes('i') ? 'i' : ''); } catch (e) { io.err('grep: Invalid regular expression'); return 2; }
    const lines = inputLines(m, a, io, rest.slice(1));
    if (lines === null) return 2;
    const hit = lines.map((l, i) => [l, i + 1]).filter(([l]) => re.test(l) !== flags.includes('v'));
    if (flags.includes('c')) { io.out(String(hit.length)); return hit.length ? 0 : 1; }
    hit.forEach(([l, n]) => io.out((flags.includes('n') ? n + ':' : '') + l));
    return hit.length ? 0 : 1;
  };
  const nArg = (a) => { const i = a.indexOf('-n'); if (i >= 0) return [parseInt(a[i + 1], 10), a.filter((x, j) => j !== i && j !== i + 1)]; const d = a.find((x) => /^-\d+$/.test(x)); return d ? [-parseInt(d, 10), a.filter((x) => x !== d)] : [10, a]; };
  C.head = (m, a, io) => { const [n, rest] = nArg(a); const l = inputLines(m, a, io, rest.filter((x) => !x.startsWith('-'))); if (l === null) return 1; l.slice(0, n).forEach((x) => io.out(x)); };
  C.tail = (m, a, io) => { const [n, rest] = nArg(a); const l = inputLines(m, a, io, rest.filter((x) => !x.startsWith('-'))); if (l === null) return 1; l.slice(-n).forEach((x) => io.out(x)); };
  C.wc = (m, a, io) => { const l = inputLines(m, a, io, a.filter((x) => !x.startsWith('-'))); if (l === null) return 1; io.out(a.includes('-l') ? String(l.length) : `${l.length} ${l.join(' ').split(/\s+/).filter(Boolean).length} ${l.join('\n').length}`); };
  C.sort = (m, a, io) => { const l = inputLines(m, a, io, a.filter((x) => !x.startsWith('-'))); if (l === null) return 1; l.sort(); if (a.includes('-r')) l.reverse(); l.forEach((x) => io.out(x)); };
  C.uniq = (m, a, io) => { const l = inputLines(m, a, io, a.filter((x) => !x.startsWith('-'))); if (l === null) return 1; l.filter((x, i) => i === 0 || x !== l[i - 1]).forEach((x) => io.out(x)); };
  C.exit = (m, a, io) => io.out('(This is a sandbox - there is nothing to exit. Keep going!)');

  LP.Machine = Machine;
  LP.util = { sha, splitLines, joinLines, plural, diffOps, lcsMap, merge3, tokenize, dirname, basename };
  if (typeof module !== 'undefined') module.exports = LP;
})(typeof window !== 'undefined' ? window : globalThis);
