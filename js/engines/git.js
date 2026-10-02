/* A small but real Git model: commits, index, branches, merges (3-way, with
 * conflicts), stash, tags, remotes. Used by the Git and GitHub courses. */
(function (root) {
  'use strict';
  const LP = root.LP || (typeof require !== 'undefined' ? require('./shell.js') : null);
  const { sha, splitLines, joinLines, plural, diffOps, lcsMap, merge3, dirname, basename } = LP.util;
  const M = LP.Machine;
  const C = M.commands;
  const short = (id) => id.slice(0, 7);
  const esc = (s) => s.replace(/[.+^${}()|[\]\\]/g, '\\$&');

  // ---------- repository helpers ----------
  M.prototype.repoAt = function (dir) {
    let d = dir || this.cwd;
    for (;;) {
      if (this.repos[d]) return this.repos[d];
      if (d === '/') return null;
      d = dirname(d);
    }
  };
  function newRepo(m, rootDir, branch) {
    const repo = {
      root: rootDir, branches: {}, head: { ref: branch || 'main' }, index: new Map(), config: {},
      remotes: {}, remoteRefs: {}, upstream: {}, tags: {}, tagMeta: {}, reflog: [], stash: [], merging: null, unmerged: new Set(), bisect: null,
    };
    m.repos[rootDir] = repo;
    m.mkdirp(rootDir + '/.git');
    return repo;
  }
  const treeOf = (m, id) => (id ? m.objects.get(id).tree : {});
  const headId = (repo) => (repo.head.ref ? repo.branches[repo.head.ref] || null : repo.head.id);
  function logHead(repo, note) { const id = headId(repo); if (id) repo.reflog.unshift({ id, note: note || repo._act || 'update' }); }
  function setHead(repo, id, note) { if (repo.head.ref) repo.branches[repo.head.ref] = id; else repo.head.id = id; logHead(repo, note); }
  function ancestors(m, id) {
    const seen = new Set(), stack = id ? [id] : [];
    while (stack.length) {
      const x = stack.pop();
      if (seen.has(x)) continue;
      seen.add(x);
      stack.push(...m.objects.get(x).parents);
    }
    return seen;
  }
  const isAncestor = (m, a, b) => ancestors(m, b).has(a);
  function mergeBase(m, a, b) {
    const A = ancestors(m, a), B = ancestors(m, b);
    const common = [...A].filter((x) => B.has(x));
    const best = common.filter((c) => !common.some((o) => o !== c && ancestors(m, o).has(c)));
    return best.sort((x, y) => m.objects.get(y).time - m.objects.get(x).time)[0] || null;
  }
  function identity(m, repo) {
    const n = repo.config['user.name'] || m.globalConfig['user.name'];
    const e = repo.config['user.email'] || m.globalConfig['user.email'];
    return n && e ? { name: n, email: e } : null;
  }
  function newCommit(m, msg, parents, tree, author) {
    const time = m.tick();
    const id = sha(JSON.stringify([msg, parents, tree, time, author]));
    m.objects.set(id, { id, parents, msg, tree, author, time });
    return id;
  }
  function worktree(m, repo) {
    const out = new Map(), pre = repo.root === '/' ? '/' : repo.root + '/';
    for (const [p, c] of m.files) if (p.startsWith(pre)) out.set(p.slice(pre.length), c);
    return out;
  }
  function ignored(m, repo, rel) {
    const gi = m.files.get(repo.root + '/.gitignore');
    if (!gi) return false;
    const parts = rel.split('/');
    for (let pat of splitLines(gi).map((l) => l.trim()).filter((l) => l && !l.startsWith('#') && !l.startsWith('!'))) {
      const dirOnly = pat.endsWith('/');
      pat = pat.replace(/\/$/, '');
      const anchored = pat.startsWith('/') || pat.includes('/');
      pat = pat.replace(/^\//, '');
      const re = new RegExp('^' + pat.split('*').map(esc).join('[^/]*') + '$');
      if (anchored) {
        for (let n = 1; n <= parts.length; n++) {
          if (re.test(parts.slice(0, n).join('/')) && (!dirOnly || n < parts.length)) return true;
        }
      } else {
        for (let n = 0; n < parts.length; n++) {
          if (re.test(parts[n]) && (!dirOnly || n < parts.length - 1)) return true;
        }
      }
    }
    return false;
  }
  function status(m, repo) {
    const head = treeOf(m, headId(repo)), wt = worktree(m, repo), idx = repo.index;
    const un = repo.unmerged;
    const staged = [], unstaged = [], untracked = [];
    for (const [p, c] of idx) {
      if (un.has(p)) continue;
      if (!(p in head)) staged.push({ p, k: 'new file' });
      else if (head[p] !== c) staged.push({ p, k: 'modified' });
    }
    for (const p of Object.keys(head)) if (!idx.has(p)) staged.push({ p, k: 'deleted' });
    for (const [p, c] of idx) {
      if (un.has(p)) continue;
      if (!wt.has(p)) unstaged.push({ p, k: 'deleted' });
      else if (wt.get(p) !== c) unstaged.push({ p, k: 'modified' });
    }
    for (const p of wt.keys()) if (!idx.has(p) && !ignored(m, repo, p)) untracked.push(p);
    const byName = (a, b) => (a.p || a).localeCompare(b.p || b);
    staged.sort(byName); unstaged.sort(byName); untracked.sort(byName);
    return { staged, unstaged, untracked, unmerged: [...un].sort() };
  }
  const dirtyPaths = (m, repo) => {
    const s = status(m, repo);
    return new Set([...s.staged, ...s.unstaged].map((x) => x.p).concat(s.unmerged));
  };

  // ---------- refs ----------
  function resolveRef(m, repo, name) {
    const rl = /^(HEAD|@)@\{(\d+)\}$/.exec(name);
    if (rl) { const e = repo.reflog[parseInt(rl[2], 10)]; return e ? e.id : null; }
    const mm = /^([^~^]+)((?:[~^]\d*)+)?$/.exec(name);
    if (!mm) return null;
    const base = mm[1];
    let id = null;
    if (base === 'HEAD' || base === '@') id = headId(repo);
    else if (repo.branches[base]) id = repo.branches[base];
    else if (repo.tags[base]) id = repo.tags[base];
    else if (repo.remoteRefs[base]) id = repo.remoteRefs[base];
    else if (/^[0-9a-f]{4,40}$/.test(base)) {
      const hits = [...m.objects.keys()].filter((k) => k.startsWith(base));
      if (hits.length === 1) id = hits[0];
    }
    if (!id) return null;
    for (const part of (mm[2] || '').match(/[~^]\d*/g) || []) {
      const n = part.length > 1 ? parseInt(part.slice(1), 10) : 1;
      const c = m.objects.get(id);
      if (part[0] === '~') { for (let i = 0; i < n; i++) { const cc = m.objects.get(id); if (!cc.parents.length) return null; id = cc.parents[0]; } }
      else { id = c.parents[n - 1]; if (!id) return null; }
    }
    return id;
  }

  // ---------- diff formatting ----------
  function fileDiff(p, oldC, newC) {
    const out = [`diff --git a/${p} b/${p}`];
    if (oldC === undefined) out.push('new file mode 100644');
    if (newC === undefined) out.push('deleted file mode 100644');
    const a = splitLines(oldC || ''), b = splitLines(newC || '');
    out.push(`index ${short(sha('a' + (oldC || '')))}..${short(sha('b' + (newC || '')))}${oldC !== undefined && newC !== undefined ? ' 100644' : ''}`);
    out.push(oldC === undefined ? '--- /dev/null' : `--- a/${p}`);
    out.push(newC === undefined ? '+++ /dev/null' : `+++ b/${p}`);
    const ops = diffOps(a, b);
    const changes = [];
    ops.forEach((o, i) => { if (o[0] !== '=') changes.push(i); });
    if (!changes.length) return [];
    const ctx = 3;
    const ranges = [];
    for (const i of changes) {
      const lo = Math.max(0, i - ctx), hi = Math.min(ops.length - 1, i + ctx);
      if (ranges.length && lo <= ranges[ranges.length - 1][1] + 1) ranges[ranges.length - 1][1] = hi;
      else ranges.push([lo, hi]);
    }
    for (const [lo, hi] of ranges) {
      let ai = 1, bi = 1;
      for (let i = 0; i < lo; i++) { if (ops[i][0] !== '+') ai++; if (ops[i][0] !== '-') bi++; }
      let ac = 0, bc = 0;
      const body = [];
      for (let i = lo; i <= hi; i++) {
        const [k, line] = ops[i];
        if (k !== '+') ac++;
        if (k !== '-') bc++;
        body.push((k === '=' ? ' ' : k) + line);
      }
      const rng = (st, n) => (n === 1 ? `${st}` : `${st},${n}`);
      out.push(`@@ -${rng(ac ? ai : ai - 1, ac)} +${rng(bc ? bi : bi - 1, bc)} @@`, ...body);
    }
    return out;
  }
  function treeDiff(oldTree, newTree, only) {
    const out = [];
    for (const p of [...new Set([...Object.keys(oldTree), ...Object.keys(newTree)])].sort()) {
      if (only && !only(p)) continue;
      if (oldTree[p] !== newTree[p]) out.push(...fileDiff(p, oldTree[p], newTree[p]));
    }
    return out;
  }
  function statOf(oldTree, newTree) {
    const files = [];
    let add = 0, del = 0;
    for (const p of [...new Set([...Object.keys(oldTree), ...Object.keys(newTree)])].sort()) {
      if (oldTree[p] === newTree[p]) continue;
      const ops = diffOps(splitLines(oldTree[p] || ''), splitLines(newTree[p] || ''));
      const a = ops.filter((o) => o[0] === '+').length, d = ops.filter((o) => o[0] === '-').length;
      files.push({ p, a, d, kind: oldTree[p] === undefined ? 'create' : newTree[p] === undefined ? 'delete' : 'mod' });
      add += a; del += d;
    }
    return { files, add, del };
  }
  function statLines(st, modes) {
    const out = [];
    const w = Math.max(0, ...st.files.map((f) => f.p.length));
    for (const f of st.files) out.push(` ${f.p.padEnd(w)} | ${f.a + f.d} ${'+'.repeat(Math.min(f.a, 20))}${'-'.repeat(Math.min(f.d, 20))}`.replace(/ +$/, ''));
    let s = ` ${plural(st.files.length, 'file')} changed`;
    if (st.add || !st.del) s += `, ${plural(st.add, 'insertion')}(+)`;
    if (st.del) s += `, ${plural(st.del, 'deletion')}(-)`;
    out.push(s);
    if (modes) for (const f of st.files) { if (f.kind === 'create') out.push(` create mode 100644 ${f.p}`); if (f.kind === 'delete') out.push(` delete mode 100644 ${f.p}`); }
    return out;
  }
  const fmtDate = (t) => {
    const d = new Date(t * 1000);
    const D = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], Mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const p = (n) => String(n).padStart(2, '0');
    return `${D[d.getUTCDay()]} ${Mo[d.getUTCMonth()]} ${d.getUTCDate()} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())} ${d.getUTCFullYear()} +0000`;
  };

  // ---------- worktree updates ----------
  function applyTree(m, repo, tree, oldTree) {
    for (const p of Object.keys(oldTree || {})) if (!(p in tree)) m.files.delete(repo.root + '/' + p);
    for (const [p, c] of Object.entries(tree)) m.write(repo.root + '/' + p, c);
    repo.index = new Map(Object.entries(tree));
  }
  function guardOverwrite(m, repo, targetTree, io, verb) {
    const cur = treeOf(m, headId(repo));
    const dirty = dirtyPaths(m, repo);
    const bad = [...dirty].filter((p) => cur[p] !== targetTree[p]);
    const wt = worktree(m, repo);
    const untracked = Object.keys(targetTree).filter((p) => !(p in cur) && wt.has(p) && !repo.index.has(p));
    if (bad.length) {
      io.err(`error: Your local changes to the following files would be overwritten by ${verb}:\n${bad.sort().map((p) => '\t' + p).join('\n')}\nPlease commit your changes or stash them before you ${verb === 'merge' ? 'merge' : 'switch branches'}.\nAborting`);
      return false;
    }
    if (untracked.length) {
      io.err(`error: The following untracked working tree files would be overwritten by ${verb}:\n${untracked.map((p) => '\t' + p).join('\n')}\nPlease move or remove them before you ${verb === 'merge' ? 'merge' : 'switch branches'}.\nAborting`);
      return false;
    }
    return true;
  }

  const NOT_REPO = 'fatal: not a git repository (or any of the parent directories): .git';

  // ---------- 3-way tree merge ----------
  function mergeTrees(base, ours, theirs, oursName, theirsName) {
    const tree = {}, conflicts = [], notes = [];
    for (const p of new Set([...Object.keys(base), ...Object.keys(ours), ...Object.keys(theirs)])) {
      const b = base[p], o = ours[p], t = theirs[p];
      let res;
      if (o === t) res = o;
      else if (o === b) res = t;
      else if (t === b) res = o;
      else if (o === undefined || t === undefined) { conflicts.push(p); notes.push(`CONFLICT (modify/delete): ${p} deleted in ${o === undefined ? oursName : theirsName} and modified in ${o === undefined ? theirsName : oursName}.  Version ${o === undefined ? theirsName : oursName} of ${p} left in tree.`); res = o === undefined ? t : o; }
      else {
        notes.push(`Auto-merging ${p}`);
        const r = merge3(splitLines(b || ''), splitLines(o), splitLines(t), oursName, theirsName);
        res = joinLines(r.lines);
        if (r.conflict) { conflicts.push(p); notes.push(`CONFLICT (${b === undefined ? 'add/add' : 'content'}): Merge conflict in ${p}`); }
      }
      if (res !== undefined) tree[p] = res;
    }
    return { tree, conflicts, notes };
  }

  // merge commit `targetId` into current branch. returns 'uptodate'|'ff'|'merged'|'conflict'|'error'
  function mergeInto(m, repo, io, targetId, o) {
    const cur = headId(repo);
    if (!cur) { io.err('fatal: cannot merge into a branch with no commits'); return 'error'; }
    if (cur === targetId || isAncestor(m, targetId, cur)) { io.out('Already up to date.'); return 'uptodate'; }
    const curTree = treeOf(m, cur), tgtTree = treeOf(m, targetId);
    if (!guardOverwrite(m, repo, tgtTree, io, 'merge')) return 'error';
    if (isAncestor(m, cur, targetId) && !o.noFf) {
      io.out(`Updating ${short(cur)}..${short(targetId)}\nFast-forward`);
      io.out(statLines(statOf(curTree, tgtTree)).join('\n'));
      applyTree(m, repo, tgtTree, curTree);
      setHead(repo, targetId, `merge ${o.label}: Fast-forward`);
      return 'ff';
    }
    const baseId = mergeBase(m, cur, targetId);
    const res = mergeTrees(treeOf(m, baseId), curTree, tgtTree, 'HEAD', o.label);
    if (res.notes.length) io.out(res.notes.join('\n'));
    applyTree(m, repo, res.tree, curTree);
    if (res.conflicts.length) {
      // write conflicted versions into worktree only
      repo.unmerged = new Set(res.conflicts);
      repo.merging = { id: targetId, msg: o.message };
      io.out('Automatic merge failed; fix conflicts and then commit the result.');
      return 'conflict';
    }
    const author = identity(m, repo) || { name: 'Learner', email: 'learner@example.com' };
    const id = newCommit(m, o.message, [cur, targetId], res.tree, author);
    setHead(repo, id, `merge ${o.label}: Merge made by the 'ort' strategy.`);
    io.out(`Merge made by the 'ort' strategy.`);
    io.out(statLines(statOf(curTree, res.tree)).join('\n'));
    return 'merged';
  }

  // ---------- remotes ----------
  const urlKey = (u) => u.replace(/^https?:\/\//, '').replace(/^git@github\.com:/, 'github.com/').replace(/\.git$/, '').replace(/\/+$/, '').toLowerCase();
  const findRemote = (m, url) => m.remotes[urlKey(url)] || null;
  M.prototype.seedRemote = function (url, commits, opts) {
    opts = opts || {};
    const key = urlKey(url);
    const [, owner, name] = key.split('/');
    const r = (this.remotes[key] = { key, owner, name, url: 'https://' + key, branches: {}, defaultBranch: opts.defaultBranch || 'main', issues: [], prs: [], num: 1, forkOf: opts.forkOf || null });
    let prev = null, tree = {};
    for (const c of commits || []) {
      tree = Object.assign({}, tree);
      for (const [p, v] of Object.entries(c.files || {})) { if (v === null) delete tree[p]; else tree[p] = v; }
      prev = newCommit(this, c.msg, prev ? [prev] : [], tree, c.author || { name: 'Teammate', email: 'teammate@example.com' });
    }
    if (prev) r.branches[r.defaultBranch] = prev;
    return r;
  };
  M.prototype.remoteCommit = function (url, branch, files, msg, author) {
    const r = findRemote(this, url);
    const prev = r.branches[branch];
    const tree = Object.assign({}, treeOf(this, prev));
    for (const [p, v] of Object.entries(files)) { if (v === null) delete tree[p]; else tree[p] = v; }
    r.branches[branch] = newCommit(this, msg, prev ? [prev] : [], tree, author || { name: 'Teammate', email: 'teammate@example.com' });
    return r.branches[branch];
  };
  M.prototype.remoteBranchFrom = function (url, branch, from) { const r = findRemote(this, url); r.branches[branch] = r.branches[from]; };
  M.prototype.seedRepo = function (dir, commits, opts) {
    opts = opts || {};
    const rootDir = this.abs(dir);
    this.mkdirp(rootDir);
    const repo = newRepo(this, rootDir, opts.branch || 'main');
    let tree = {}, prev = null;
    for (const c of commits || []) {
      tree = Object.assign({}, tree);
      for (const [p, v] of Object.entries(c.files || {})) { if (v === null) delete tree[p]; else tree[p] = v; }
      prev = newCommit(this, c.msg, prev ? [prev] : [], tree, c.author || { name: 'Learner', email: 'learner@example.com' });
      repo.reflog.unshift({ id: prev, note: `commit${repo.reflog.length ? '' : ' (initial)'}: ${c.msg.split('\n')[0]}` });
    }
    if (prev) repo.branches[repo.head.ref] = prev;
    applyTree(this, repo, tree, {});
    return repo;
  };
  M.prototype.configureIdentity = function () {
    this.globalConfig['user.name'] = 'Learner';
    this.globalConfig['user.email'] = 'learner@example.com';
  };
  M.prototype.git = function (dir) { return this.repoAt(dir ? this.abs(dir) : this.cwd); };
  // convenience for lesson checks
  M.prototype.gitStatus = function (dir) { const r = this.git(dir); return r ? status(this, r) : null; };
  M.prototype.gitLog = function (dir, ref) {
    const r = this.git(dir);
    if (!r) return [];
    const id = ref ? resolveRef(this, r, ref) : headId(r);
    return [...ancestors(this, id)].map((x) => this.objects.get(x)).sort((a, b) => b.time - a.time);
  };
  M.prototype.remote = function (url) { return findRemote(this, url); };

  function formatStatus(m, repo, io, short_) {
    const s = status(m, repo);
    const lines = [];
    if (short_) {
      const map = { 'new file': 'A', modified: 'M', deleted: 'D' };
      const rows = new Map();
      for (const x of s.staged) rows.set(x.p, [map[x.k], ' ']);
      for (const x of s.unstaged) rows.set(x.p, [rows.has(x.p) ? rows.get(x.p)[0] : ' ', map[x.k]]);
      for (const p of s.unmerged) rows.set(p, ['U', 'U']);
      for (const p of [...rows.keys()].sort()) lines.push(rows.get(p).join('') + ' ' + p);
      for (const p of s.untracked) lines.push('?? ' + p);
      if (lines.length) io.out(lines.join('\n'));
      return;
    }
    lines.push(repo.head.ref ? `On branch ${repo.head.ref}` : `HEAD detached at ${short(repo.head.id)}`);
    const up = repo.head.ref && repo.upstream[repo.head.ref];
    if (up) {
      const ref = repo.remoteRefs[up.remote + '/' + up.branch];
      const name = `${up.remote}/${up.branch}`;
      const mine = headId(repo);
      if (!ref) lines.push(`Your branch is based on '${name}', but the upstream is gone.`);
      else if (ref === mine) lines.push(`Your branch is up to date with '${name}'.`);
      else {
        const ahead = [...ancestors(m, mine)].filter((x) => !ancestors(m, ref).has(x)).length;
        const behind = [...ancestors(m, ref)].filter((x) => !ancestors(m, mine).has(x)).length;
        if (ahead && behind) lines.push(`Your branch and '${name}' have diverged,\nand have ${ahead} and ${behind} different commits each, respectively.\n  (use "git pull" if you want to integrate the remote branch with yours)`);
        else if (ahead) lines.push(`Your branch is ahead of '${name}' by ${plural(ahead, 'commit')}.\n  (use "git push" to publish your local commits)`);
        else lines.push(`Your branch is behind '${name}' by ${plural(behind, 'commit')}, and can be fast-forwarded.\n  (use "git pull" to update your local branch)`);
      }
    }
    if (!headId(repo)) lines.push('\nNo commits yet');
    if (repo.merging) {
      if (s.unmerged.length) lines.push('\nYou have unmerged paths.\n  (fix conflicts and run "git commit")\n  (use "git merge --abort" to abort the merge)');
      else lines.push('\nAll conflicts fixed but you are still merging.\n  (use "git commit" to conclude merge)');
    }
    if (s.staged.length) {
      lines.push('\nChanges to be committed:\n  (use "git restore --staged <file>..." to unstage)');
      for (const x of s.staged) lines.push(`\t${(x.k + ':').padEnd(12)} ${x.p}`);
    }
    if (s.unmerged.length) {
      lines.push('\nUnmerged paths:\n  (use "git add <file>..." to mark resolution)');
      for (const p of s.unmerged) lines.push(`\tboth modified:   ${p}`);
    }
    if (s.unstaged.length) {
      lines.push('\nChanges not staged for commit:\n  (use "git add <file>..." to update what will be committed)\n  (use "git restore <file>..." to discard changes in working directory)');
      for (const x of s.unstaged) lines.push(`\t${(x.k + ':').padEnd(12)} ${x.p}`);
    }
    if (s.untracked.length) {
      lines.push('\nUntracked files:\n  (use "git add <file>..." to include in what will be committed)');
      const shown = new Set();
      for (const p of s.untracked) {
        const top = p.split('/')[0];
        const label = p.includes('/') && ![...repo.index.keys()].some((k) => k.startsWith(top + '/')) ? top + '/' : p;
        if (!shown.has(label)) { shown.add(label); lines.push('\t' + label); }
      }
    }
    lines.push('');
    if (s.staged.length || s.unmerged.length) { /* nothing */ }
    else if (s.unstaged.length) lines.push('no changes added to commit (use "git add" and/or "git commit -a")');
    else if (s.untracked.length) lines.push('nothing added to commit but untracked files present (use "git add" to track)');
    else if (!headId(repo)) lines.push('nothing to commit (create/copy files and use "git add" to track)');
    else lines.push('nothing to commit, working tree clean');
    io.out(lines.join('\n').replace(/\n\n$/, '\n'));
  }

  function decorations(m, repo) {
    const d = {};
    const add = (id, l) => { if (id) (d[id] = d[id] || []).push(l); };
    const h = headId(repo);
    for (const [b, id] of Object.entries(repo.branches)) { if (repo.head.ref === b) continue; add(id, b); }
    for (const [b, id] of Object.entries(repo.remoteRefs)) add(id, b);
    for (const [t, id] of Object.entries(repo.tags)) add(id, 'tag: ' + t);
    const out = {};
    for (const [id, l] of Object.entries(d)) out[id] = l;
    if (h) out[h] = [repo.head.ref ? 'HEAD -> ' + repo.head.ref : 'HEAD'].concat(out[h] || []);
    return out;
  }

  function checkoutRef(m, repo, io, name, opts) {
    if (repo.merging) { io.err('error: you need to resolve your current index first'); return 1; }
    const isBranch = repo.branches[name] !== undefined;
    let id = null, newHead;
    if (isBranch) { id = repo.branches[name]; newHead = { ref: name }; }
    else if (repo.remoteRefs['origin/' + name] && !opts.detach) {
      id = repo.remoteRefs['origin/' + name];
      repo.branches[name] = id; repo.upstream[name] = { remote: 'origin', branch: name };
      newHead = { ref: name };
      io.out(`branch '${name}' set up to track 'origin/${name}'.`);
    } else { id = resolveRef(m, repo, name); newHead = { id }; }
    if (!id) {
      io.err(`error: pathspec '${name}' did not match any file(s) known to git`);
      return 1;
    }
    if (repo.head.ref === name && isBranch) { io.out(`Already on '${name}'`); return 0; }
    if (!guardOverwrite(m, repo, treeOf(m, id), io, 'checkout')) return 1;
    const fromName = repo.head.ref || short(repo.head.id);
    applyTree(m, repo, treeOf(m, id), treeOf(m, headId(repo)));
    repo.head = newHead;
    logHead(repo, `checkout: moving from ${fromName} to ${name}`);
    if (newHead.ref) io.out(`Switched to branch '${name}'`);
    else io.out(`Note: switching to '${name}'.\n\nYou are in 'detached HEAD' state. You can look around, make experimental\nchanges and commit them, and you can discard any commits you make in this\nstate without impacting any branches by switching back to a branch.`);
    return 0;
  }

  function createBranch(m, repo, io, name, startId) {
    if (!/^[\w][\w./-]*$/.test(name)) { io.err(`fatal: '${name}' is not a valid branch name`); return 1; }
    if (repo.branches[name]) { io.err(`fatal: a branch named '${name}' already exists`); return 128; }
    if (!startId) { io.err('fatal: not a valid object name: \'' + (repo.head.ref || 'HEAD') + '\''); return 128; }
    repo.branches[name] = startId;
    return 0;
  }

  function restorePaths(m, repo, io, paths, opts) {
    const cur = treeOf(m, headId(repo));
    const srcTree = opts.source ? treeOf(m, resolveRef(m, repo, opts.source)) : null;
    const all = new Set([...Object.keys(cur), ...repo.index.keys(), ...worktree(m, repo).keys()]);
    let code = 0;
    for (const raw of paths) {
      const abs = m.abs(raw);
      const rel = abs === repo.root ? '' : abs.slice(repo.root.length + 1);
      const matched = [...all].filter((p) => rel === '' || p === rel || p.startsWith(rel + '/'));
      if (!matched.length) { io.err(`error: pathspec '${raw}' did not match any file(s) known to git`); code = 1; continue; }
      for (const p of matched) {
        if (opts.staged) {
          const from = srcTree || cur;
          if (p in from) repo.index.set(p, from[p]); else repo.index.delete(p);
        } else {
          const v = srcTree ? srcTree[p] : repo.index.get(p);
          if (v === undefined) m.files.delete(repo.root + '/' + p); else m.write(repo.root + '/' + p, v);
          if (srcTree && !opts.worktreeOnly) { /* worktree only by default */ }
        }
      }
    }
    return code;
  }

  function addPaths(m, repo, io, paths, flags) {
    const wt = worktree(m, repo);
    if (flags.all) paths = ['.'];
    if (!paths.length) { io.err('Nothing specified, nothing added.\nhint: Maybe you wanted to say \'git add .\'?'); return 0; }
    let code = 0;
    for (const raw of paths) {
      const abs = m.abs(raw);
      const rel = abs === repo.root ? '' : abs.slice(repo.root.length + 1);
      const pathMatches = (p) => rel === '' || p === rel || p.startsWith(rel + '/');
      const hits = [...wt.keys()].filter((p) => pathMatches(p) && (flags.force || !ignored(m, repo, p)));
      const gone = [...repo.index.keys()].filter((p) => pathMatches(p) && !wt.has(p));
      if (!hits.length && !gone.length) {
        if (rel && wt.size >= 0 && [...wt.keys()].some((p) => pathMatches(p))) { io.err(`The following paths are ignored by one of your .gitignore files:\n${raw}\nhint: Use -f if you really want to add them.`); code = 1; continue; }
        io.err(`fatal: pathspec '${raw}' did not match any files`); code = 128; continue;
      }
      for (const p of hits) { if (flags.update && !repo.index.has(p)) continue; repo.index.set(p, wt.get(p)); repo.unmerged.delete(p); }
      for (const p of gone) { repo.index.delete(p); repo.unmerged.delete(p); }
    }
    return code;
  }

  function doCommit(m, repo, io, msg, o) {
    const id = identity(m, repo);
    if (!id) {
      io.err('Author identity unknown\n\n*** Please tell me who you are.\n\nRun\n\n  git config --global user.email "you@example.com"\n  git config --global user.name "Your Name"\n\nto set your account\'s default identity.\n\nfatal: unable to auto-detect email address');
      return 128;
    }
    if (repo.unmerged.size) { io.err('error: Committing is not possible because you have unmerged files.\nhint: Fix them up in the work tree, and then use \'git add/rm <file>\'\nhint: as appropriate to mark resolution and make a commit.\nfatal: Exiting because of an unresolved conflict.'); return 128; }
    if (o.all) {
      const wt = worktree(m, repo);
      for (const p of [...repo.index.keys()]) { if (wt.has(p)) repo.index.set(p, wt.get(p)); else repo.index.delete(p); }
    }
    const headTree = treeOf(m, headId(repo));
    const tree = Object.fromEntries(repo.index);
    const same = JSON.stringify(Object.entries(tree).sort()) === JSON.stringify(Object.entries(headTree).sort());
    if (!o.amend && !repo.merging && same) {
      const s = status(m, repo);
      let out = repo.head.ref ? `On branch ${repo.head.ref}\n` : '';
      if (s.unstaged.length || s.untracked.length) {
        out += s.unstaged.length ? 'Changes not staged for commit:\n' + s.unstaged.map((x) => `\t${x.k}:   ${x.p}`).join('\n') + '\n' : '';
        out += s.untracked.length ? 'Untracked files:\n' + s.untracked.map((p) => `\t${p}`).join('\n') + '\n' : '';
        out += s.unstaged.length ? '\nno changes added to commit (use "git add" and/or "git commit -a")' : '\nnothing added to commit but untracked files present (use "git add" to track)';
      } else out += 'nothing to commit, working tree clean';
      io.out(out);
      return 1;
    }
    let parents = headId(repo) ? [headId(repo)] : [];
    let prevTree = headTree;
    if (o.amend) {
      const old = m.objects.get(headId(repo));
      parents = old.parents.slice();
      msg = msg || old.msg;
      prevTree = treeOf(m, parents[0]);
    }
    if (repo.merging) { parents = repo.merging.cherry ? [headId(repo)] : [headId(repo), repo.merging.id]; msg = msg || repo.merging.msg; }
    if (!msg) { io.err('Aborting commit due to empty commit message.'); return 1; }
    const cid = newCommit(m, msg, parents, tree, id);
    const wasRoot = !headId(repo);
    setHead(repo, cid, `commit${wasRoot ? ' (initial)' : o.amend ? ' (amend)' : repo.merging && !repo.merging.cherry ? ' (merge)' : ''}: ${msg.split('\n')[0]}`);
    repo.merging = null;
    const st = statOf(prevTree, tree);
    io.out(`[${repo.head.ref || 'detached HEAD'}${wasRoot ? ' (root-commit)' : ''} ${short(cid)}] ${msg.split('\n')[0]}`);
    if (st.files.length) io.out(statLines(st, true).join('\n'));
    return 0;
  }

  function fetchRemote(m, repo, name, io, quiet) {
    const url = repo.remotes[name];
    const rem = url && findRemote(m, url);
    if (!rem) { io.err(`fatal: '${name}' does not appear to be a git repository\nfatal: Could not read from remote repository.\n\nPlease make sure you have the correct access rights\nand the repository exists.`); return null; }
    const updates = [];
    for (const [b, id] of Object.entries(rem.branches)) {
      const key = name + '/' + b;
      if (repo.remoteRefs[key] !== id) {
        updates.push(repo.remoteRefs[key] ? `   ${short(repo.remoteRefs[key])}..${short(id)}  ${b.padEnd(10)} -> ${key}` : ` * [new branch]      ${b.padEnd(10)} -> ${key}`);
        repo.remoteRefs[key] = id;
      }
    }
    for (const key of Object.keys(repo.remoteRefs)) if (key.startsWith(name + '/') && !(key.slice(name.length + 1) in rem.branches)) delete repo.remoteRefs[key];
    for (const [t, id] of Object.entries(rem.tags || {})) if (!repo.tags[t]) { repo.tags[t] = id; updates.push(` * [new tag]         ${t.padEnd(10)} -> ${t}`); }
    if (updates.length && !quiet) io.out(`From ${url.replace(/\.git$/, '')}\n${updates.join('\n')}`);
    return rem;
  }

  // ---------- the git command ----------
  C.git = function (m, args, io) {
    const sub = args[0];
    const rest = args.slice(1);
    if (!sub || sub === '--help' || sub === 'help') {
      io.out('usage: git <command> [<args>]\n\nstart a working area:   clone, init\nwork on the current change:   add, restore, rm, mv\nexamine history and state:   diff, log, show, status\ngrow and tweak history:   branch, commit, merge, rebase, reset, switch, tag, stash\ncollaborate:   fetch, pull, push, remote');
      return 0;
    }
    if (sub === '--version' || sub === 'version') { io.out('git version 2.43.0'); return 0; }
    if (sub === 'init') {
      const flagB = rest.indexOf('-b') >= 0 ? rest[rest.indexOf('-b') + 1] : (rest.find((a) => a.startsWith('--initial-branch=')) || '').split('=')[1];
      const dirArg = rest.filter((a, i) => !a.startsWith('-') && rest[i - 1] !== '-b')[0];
      const dir = m.abs(dirArg || '.');
      m.mkdirp(dir);
      if (m.repos[dir]) { io.out(`Reinitialized existing Git repository in ${dir}/.git/`); return 0; }
      const configured = flagB || m.globalConfig['init.defaultbranch'];
      newRepo(m, dir, configured || 'master');
      if (!configured) io.out("hint: Using 'master' as the name for the initial branch. This default branch name\nhint: is subject to change. To configure the initial branch name to use in all\nhint: of your new repositories, which will suppress this warning, call:\nhint:\nhint: \tgit config --global init.defaultBranch <name>");
      io.out(`Initialized empty Git repository in ${dir}/.git/`);
      return 0;
    }
    if (sub === 'config') {
      const glob = rest.includes('--global');
      const p = rest.filter((a) => !a.startsWith('-'));
      const repo = m.repoAt(m.cwd);
      if (rest.includes('--list') || rest.includes('-l')) {
        const all = Object.assign({}, m.globalConfig, repo ? repo.config : {});
        Object.entries(all).forEach(([k, v]) => io.out(`${k}=${v}`));
        return 0;
      }
      const key = (p[0] || '').toLowerCase();
      if (rest.includes('--get') || (p.length === 1 && !rest.includes('--unset'))) {
        const v = (repo && repo.config[key]) || m.globalConfig[key];
        if (v === undefined) return 1;
        io.out(v); return 0;
      }
      if (p.length < 2) { io.err('error: wrong number of arguments, should be 2'); return 129; }
      if (!/^[a-z0-9]+\.[a-z0-9.-]+$/i.test(key)) { io.err(`error: key does not contain a section: ${p[0]}`); return 1; }
      if (!glob && !repo) { io.err('fatal: --local can only be used inside a git repository'); return 128; }
      (glob ? m.globalConfig : repo.config)[key] = p[1];
      return 0;
    }
    if (sub === 'clone') {
      const p = rest.filter((a) => !a.startsWith('-'));
      if (!p[0]) { io.err('fatal: You must specify a repository to clone.'); return 129; }
      const name = (p[1] || basename(p[0]).replace(/\.git$/, ''));
      io.out(`Cloning into '${name}'...`);
      return cloneInto(m, io, p[0], m.abs(name), name) ? 0 : 128;
    }
    const repo = m.repoAt(m.cwd);
    if (!repo) { io.err(NOT_REPO); return 128; }
    const handler = SUB[sub];
    if (!handler) { io.err(`git: '${sub}' is not a git command. See 'git --help'.`); return 1; }
    repo._act = sub + (rest.length ? ': ' + rest.join(' ') : '');
    return handler(m, repo, rest, io) || 0;
  };

  function cloneInto(m, io, url, dest, name) {
    const rem = findRemote(m, url);
    if (!rem) { io.err(`fatal: repository '${url}' not found`); return false; }
    if (m.exists(dest) && (m.isFile(dest) || m.children(dest).length)) { io.err(`fatal: destination path '${name}' already exists and is not an empty directory.`); return false; }
    const repo = newRepo(m, dest, rem.defaultBranch);
    repo.remotes.origin = url;
    for (const [b, id] of Object.entries(rem.branches)) repo.remoteRefs['origin/' + b] = id;
    const id = rem.branches[rem.defaultBranch];
    if (id) {
      repo.branches[rem.defaultBranch] = id;
      repo.upstream[rem.defaultBranch] = { remote: 'origin', branch: rem.defaultBranch };
      applyTree(m, repo, treeOf(m, id), {});
    } else io.err('warning: You appear to have cloned an empty repository.');
    return true;
  }

  const SUB = {};
  SUB.status = (m, repo, a, io) => formatStatus(m, repo, io, a.includes('-s') || a.includes('--short') || a.includes('--porcelain'));
  SUB.add = (m, repo, a, io) => {
    const flags = { all: a.includes('-A') || a.includes('--all'), update: a.includes('-u') || a.includes('--update'), force: a.includes('-f') || a.includes('--force') };
    return addPaths(m, repo, io, a.filter((x) => !x.startsWith('-')), flags);
  };
  SUB.rm = (m, repo, a, io) => {
    const cached = a.includes('--cached');
    for (const raw of a.filter((x) => !x.startsWith('-'))) {
      const rel = m.abs(raw).slice(repo.root.length + 1);
      if (!repo.index.has(rel)) { io.err(`fatal: pathspec '${raw}' did not match any files`); return 128; }
      repo.index.delete(rel);
      if (!cached) m.files.delete(repo.root + '/' + rel);
      io.out(`rm '${rel}'`);
    }
  };
  SUB.mv = (m, repo, a, io) => {
    const [s, d] = a.filter((x) => !x.startsWith('-'));
    const rs = m.abs(s).slice(repo.root.length + 1), rd = m.abs(d).slice(repo.root.length + 1);
    if (!repo.index.has(rs)) { io.err(`fatal: not under version control, source=${s}, destination=${d}`); return 128; }
    const c = m.files.get(repo.root + '/' + rs);
    m.files.delete(repo.root + '/' + rs); m.write(repo.root + '/' + rd, c);
    repo.index.delete(rs); repo.index.set(rd, c);
  };
  SUB.commit = (m, repo, a, io) => {
    let msg = null, all = false;
    for (let i = 0; i < a.length; i++) {
      const x = a[i];
      if (x === '-m' || x === '--message') msg = a[++i];
      else if (x === '-am' || x === '-ma') { all = true; msg = a[++i]; }
      else if (x === '-a' || x === '--all') all = true;
      else if (x.startsWith('--message=')) msg = x.slice(10);
    }
    if (msg === null && !a.includes('--amend') && !repo.merging) {
      io.err('Aborting commit due to empty commit message.\nhint: this sandbox has no text editor for commit messages - use: git commit -m "your message"');
      return 1;
    }
    return doCommit(m, repo, io, msg, { all, amend: a.includes('--amend') });
  };
  SUB.diff = (m, repo, a, io) => {
    const staged = a.includes('--staged') || a.includes('--cached');
    const paths = a.filter((x) => !x.startsWith('-') && !resolveRef(m, repo, x)).map((x) => m.abs(x).slice(repo.root.length + 1));
    const only = paths.length ? (p) => paths.some((q) => p === q || p.startsWith(q + '/')) : null;
    const refs = a.filter((x) => !x.startsWith('-') && resolveRef(m, repo, x));
    let from, to;
    if (refs.length) { from = treeOf(m, resolveRef(m, repo, refs[0])); to = refs[1] ? treeOf(m, resolveRef(m, repo, refs[1])) : Object.fromEntries(worktree(m, repo)); }
    else if (staged) { from = treeOf(m, headId(repo)); to = Object.fromEntries(repo.index); }
    else {
      from = Object.fromEntries(repo.index);
      const wt = worktree(m, repo);
      to = {};
      for (const p of repo.index.keys()) if (wt.has(p)) to[p] = wt.get(p);
    }
    const out = treeDiff(from, to, only);
    if (out.length) io.out(out.join('\n'));
  };
  SUB.show = (m, repo, a, io) => {
    const ref = a.find((x) => !x.startsWith('-')) || 'HEAD';
    const id = resolveRef(m, repo, ref);
    const tm = repo.tagMeta[ref];
    if (tm && id) io.out(`tag ${ref}\nTagger: ${tm.tagger.name} <${tm.tagger.email}>\nDate:   ${fmtDate(tm.time)}\n\n${tm.msg}\n`);
    if (!id) { io.err(`fatal: ambiguous argument '${ref}': unknown revision or path not in the working tree.`); return 128; }
    const c = m.objects.get(id);
    const lines = [`commit ${id}`, `Author: ${c.author.name} <${c.author.email}>`, `Date:   ${fmtDate(c.time)}`, '', ...c.msg.split('\n').map((l) => '    ' + l), ''];
    lines.push(...treeDiff(treeOf(m, c.parents[0]), c.tree));
    io.out(lines.join('\n').replace(/\n+$/, ''));
  };
  SUB.log = (m, repo, a, io) => {
    const start = headId(repo);
    if (!start) { io.err(`fatal: your current branch '${repo.head.ref}' does not have any commits yet`); return 128; }
    const oneline = a.includes('--oneline') || a.some((x) => x.startsWith('--pretty=oneline') || x === '--format=oneline');
    const graph = a.includes('--graph');
    const patch = a.includes('-p') || a.includes('--patch');
    const stat = a.includes('--stat');
    let limit = Infinity;
    const ni = a.findIndex((x) => /^-n$/.test(x));
    if (ni >= 0) limit = parseInt(a[ni + 1], 10);
    for (const x of a) if (/^-\d+$/.test(x)) limit = -parseInt(x, 10);
    const opt = (n) => { const x = a.find((y) => y.startsWith(n + '=')); return x ? x.slice(n.length + 1) : null; };
    const author = opt('--author'), grep = opt('--grep');
    const dd = a.indexOf('--');
    const pathArgs = dd >= 0 ? a.slice(dd + 1) : a.filter((x) => !x.startsWith('-') && !resolveRef(m, repo, x) && !x.includes('..') && m.exists(m.abs(x)));
    const rels = pathArgs.map((x) => m.abs(x).slice(repo.root.length + 1));
    const revArgs = a.filter((x, i) => !x.startsWith('-') && !pathArgs.includes(x) && !(ni >= 0 && i === ni + 1) && (dd < 0 || i < dd));
    let set;
    const range = revArgs.find((x) => x.includes('..'));
    if (range) {
      const [lo, hi] = range.split('..');
      const l = resolveRef(m, repo, lo || 'HEAD'), h = resolveRef(m, repo, hi || 'HEAD');
      if (!l || !h) { io.err(`fatal: ambiguous argument '${range}': unknown revision or path not in the working tree.`); return 128; }
      const have = ancestors(m, l);
      set = [...ancestors(m, h)].filter((x) => !have.has(x));
    } else {
      const target = revArgs.find((x) => resolveRef(m, repo, x));
      const from = target ? resolveRef(m, repo, target) : start;
      set = a.includes('--all') ? Object.values(repo.branches).flatMap((b) => [...ancestors(m, b)]) : [...ancestors(m, from)];
    }
    let ids = [...new Set(set)].map((x) => m.objects.get(x)).sort((x, y) => y.time - x.time);
    if (author) ids = ids.filter((c) => c.author.name.includes(author) || c.author.email.includes(author));
    if (grep) ids = ids.filter((c) => c.msg.includes(grep));
    if (rels.length) ids = ids.filter((c) => rels.some((r) => (c.tree[r]) !== ((c.parents.length ? m.objects.get(c.parents[0]).tree : {})[r])));
    if (a.includes('--reverse')) ids.reverse();
    ids = ids.slice(0, limit);
    const deco = decorations(m, repo);
    const lines = [];
    for (const c of ids) {
      const d = deco[c.id] ? ` (${deco[c.id].join(', ')})` : '';
      if (oneline) lines.push(`${graph ? '* ' : ''}${short(c.id)}${d} ${c.msg.split('\n')[0]}`);
      else {
        lines.push(`commit ${c.id}${d}`);
        if (c.parents.length > 1) lines.push(`Merge: ${c.parents.map(short).join(' ')}`);
        lines.push(`Author: ${c.author.name} <${c.author.email}>`, `Date:   ${fmtDate(c.time)}`, '', ...c.msg.split('\n').map((l) => '    ' + l), '');
        const pt = c.parents.length ? m.objects.get(c.parents[0]).tree : {};
        if (stat) lines.push(...statLines(statOf(pt, c.tree)), '');
        if (patch) lines.push(...treeDiff(pt, c.tree, rels.length ? (p) => rels.includes(p) : null), '');
      }
    }
    io.out(lines.join('\n').replace(/\n+$/, ''));
  };
  SUB.branch = (m, repo, a, io) => {
    const flags = a.filter((x) => x.startsWith('-'));
    const p = a.filter((x) => !x.startsWith('-'));
    if (flags.includes('-d') || flags.includes('-D') || flags.includes('--delete')) {
      let code = 0;
      for (const b of p) {
        if (!repo.branches[b]) { io.err(`error: branch '${b}' not found.`); code = 1; continue; }
        if (repo.head.ref === b) { io.err(`error: Cannot delete branch '${b}' checked out at '${repo.root}'`); code = 1; continue; }
        if (!flags.includes('-D') && !isAncestor(m, repo.branches[b], headId(repo))) { io.err(`error: the branch '${b}' is not fully merged.\nIf you are sure you want to delete it, run 'git branch -D ${b}'.`); code = 1; continue; }
        io.out(`Deleted branch ${b} (was ${short(repo.branches[b])}).`);
        delete repo.branches[b]; delete repo.upstream[b];
      }
      return code;
    }
    if (flags.includes('-m') || flags.includes('-M')) {
      const [from, to] = p.length === 2 ? p : [repo.head.ref, p[0]];
      if (!repo.branches[from]) { io.err(`error: refname refs/heads/${from} not found`); return 1; }
      repo.branches[to] = repo.branches[from]; delete repo.branches[from];
      if (repo.head.ref === from) repo.head.ref = to;
      return 0;
    }
    if (flags.includes('--set-upstream-to') || a.some((x) => x.startsWith('--set-upstream-to=')) || flags.includes('-u')) {
      const spec = (a.find((x) => x.startsWith('--set-upstream-to=')) || '').split('=')[1] || p[0];
      const [remote, ...b] = (spec || '').split('/');
      repo.upstream[repo.head.ref] = { remote, branch: b.join('/') };
      io.out(`branch '${repo.head.ref}' set up to track '${spec}'.`);
      return 0;
    }
    if (!p.length) {
      const names = flags.includes('-r') ? Object.keys(repo.remoteRefs) : Object.keys(repo.branches).concat(flags.includes('-a') || flags.includes('--all') ? Object.keys(repo.remoteRefs).map((r) => 'remotes/' + r) : []);
      if (!repo.head.ref && !flags.includes('-r')) io.out(`* (HEAD detached at ${short(repo.head.id)})`);
      names.sort().forEach((n) => io.out((n === repo.head.ref ? '* ' : '  ') + n));
      return 0;
    }
    const start = p[1] ? resolveRef(m, repo, p[1]) : headId(repo);
    return createBranch(m, repo, io, p[0], start);
  };
  SUB.switch = (m, repo, a, io) => {
    const ci = a.findIndex((x) => x === '-c' || x === '--create');
    if (ci >= 0) {
      const name = a[ci + 1];
      const start = a[ci + 2] ? resolveRef(m, repo, a[ci + 2]) : headId(repo);
      const code = createBranch(m, repo, io, name, start);
      if (code) return code;
      const fromName = repo.head.ref || short(repo.head.id);
      repo.head = { ref: name };
      logHead(repo, `checkout: moving from ${fromName} to ${name}`);
      io.out(`Switched to a new branch '${name}'`);
      return 0;
    }
    if (a.includes('--detach')) return checkoutRef(m, repo, io, a.find((x) => !x.startsWith('-')), { detach: true });
    const name = a.find((x) => !x.startsWith('-'));
    if (!name) { io.err('fatal: missing branch or commit argument'); return 128; }
    if (!repo.branches[name] && !repo.remoteRefs['origin/' + name]) { io.err(`fatal: invalid reference: ${name}`); return 128; }
    return checkoutRef(m, repo, io, name, {});
  };
  SUB.checkout = (m, repo, a, io) => {
    const bi = a.findIndex((x) => x === '-b' || x === '-B');
    if (bi >= 0) {
      const name = a[bi + 1];
      const start = a[bi + 2] ? resolveRef(m, repo, a[bi + 2]) : headId(repo);
      if (a[bi] === '-B' && repo.branches[name]) delete repo.branches[name];
      const code = createBranch(m, repo, io, name, start);
      if (code) return code;
      const fromName = repo.head.ref || short(repo.head.id);
      repo.head = { ref: name };
      logHead(repo, `checkout: moving from ${fromName} to ${name}`);
      io.out(`Switched to a new branch '${name}'`);
      return 0;
    }
    const dd = a.indexOf('--');
    if (dd >= 0) return restorePaths(m, repo, io, a.slice(dd + 1), {});
    const name = a.find((x) => !x.startsWith('-'));
    if (!name) { io.err('error: you must specify a branch or commit'); return 1; }
    if (!repo.branches[name] && !repo.remoteRefs['origin/' + name] && !resolveRef(m, repo, name)) {
      if (m.exists(m.abs(name))) return restorePaths(m, repo, io, [name], {});
      io.err(`error: pathspec '${name}' did not match any file(s) known to git`);
      return 1;
    }
    return checkoutRef(m, repo, io, name, {});
  };
  SUB.restore = (m, repo, a, io) => {
    const staged = a.includes('--staged') || a.includes('-S');
    const si = a.findIndex((x) => x === '--source' || x === '-s');
    const source = si >= 0 ? a[si + 1] : (a.find((x) => x.startsWith('--source=')) || '').split('=')[1];
    const paths = a.filter((x, i) => !x.startsWith('-') && a[i - 1] !== '--source' && a[i - 1] !== '-s');
    if (!paths.length) { io.err('fatal: you must specify path(s) to restore'); return 128; }
    return restorePaths(m, repo, io, paths, { staged, source });
  };
  const abortMerge = (m, repo, io) => {
    if (!repo.merging) { io.err('fatal: There is no merge to abort (MERGE_HEAD missing).'); return 128; }
    const t = treeOf(m, headId(repo));
    const wt = worktree(m, repo);
    for (const p of wt.keys()) if (!(p in t) && repo.index.has(p)) m.files.delete(repo.root + '/' + p);
    applyTree(m, repo, t, t);
    repo.merging = null; repo.unmerged = new Set();
    return 0;
  };
  SUB.merge = (m, repo, a, io) => {
    if (a.includes('--abort')) return abortMerge(m, repo, io);
    if (a.includes('--continue')) return doCommit(m, repo, io, null, {});
    if (repo.merging) { io.err('error: Merging is not possible because you have unmerged files.\nhint: Fix them up in the work tree, and then use \'git add/rm <file>\'\nhint: as appropriate to mark resolution and make a commit.\nfatal: Exiting because of an unresolved conflict.'); return 128; }
    const name = a.find((x, i) => !x.startsWith('-') && a[i - 1] !== '-m');
    if (!name) { io.err('fatal: No remote for the current branch.'); return 128; }
    const id = resolveRef(m, repo, name);
    if (!id) { io.err(`merge: ${name} - not something we can merge`); return 1; }
    const mi = a.indexOf('-m');
    const label = name;
    const message = mi >= 0 ? a[mi + 1] : `Merge branch '${name}'`;
    if (a.includes('--squash')) {
      const cur = treeOf(m, headId(repo));
      const res = mergeTrees(treeOf(m, mergeBase(m, headId(repo), id)), cur, treeOf(m, id), 'HEAD', label);
      applyTree(m, repo, res.tree, cur);
      io.out('Squash commit -- not updating HEAD');
      return res.conflicts.length ? 1 : 0;
    }
    const r = mergeInto(m, repo, io, id, { label, message, noFf: a.includes('--no-ff') });
    return r === 'conflict' || r === 'error' ? 1 : 0;
  };
  SUB.reset = (m, repo, a, io) => {
    const mode = a.includes('--hard') ? 'hard' : a.includes('--soft') ? 'soft' : 'mixed';
    const args = a.filter((x) => !x.startsWith('-'));
    const refName = args.find((x) => resolveRef(m, repo, x));
    const paths = args.filter((x) => x !== refName);
    const bad = paths.find((x) => !m.exists(m.abs(x)) && !repo.index.has(m.abs(x).slice(repo.root.length + 1)) && !(m.abs(x).slice(repo.root.length + 1) in treeOf(m, headId(repo))));
    if (bad) { io.err(`fatal: ambiguous argument '${bad}': unknown revision or path not in the working tree.`); return 128; }
    if (paths.length) return restorePaths(m, repo, io, paths, { staged: true, source: refName });
    const id = refName ? resolveRef(m, repo, refName) : headId(repo);
    if (!id) { io.err(`fatal: ambiguous argument '${args[0]}': unknown revision or path not in the working tree.`); return 128; }
    const oldTree = treeOf(m, headId(repo));
    setHead(repo, id, `reset: moving to ${refName || 'HEAD'}`);
    if (mode !== 'soft') repo.index = new Map(Object.entries(treeOf(m, id)));
    if (mode === 'hard') {
      applyTree(m, repo, treeOf(m, id), oldTree);
      for (const p of [...worktree(m, repo).keys()]) if (!repo.index.has(p) && (p in oldTree)) m.files.delete(repo.root + '/' + p);
      repo.merging = null; repo.unmerged = new Set();
      io.out(`HEAD is now at ${short(id)} ${m.objects.get(id).msg.split('\n')[0]}`);
    }
  };
  SUB.revert = (m, repo, a, io) => {
    const ref = a.find((x) => !x.startsWith('-'));
    const id = ref && resolveRef(m, repo, ref);
    if (!id) { io.err(`fatal: bad revision '${ref || ''}'`); return 128; }
    const c = m.objects.get(id);
    const cur = treeOf(m, headId(repo));
    if (dirtyPaths(m, repo).size) { io.err('error: Your local changes would be overwritten by revert.\nhint: Commit your changes or stash them to proceed.\nfatal: revert failed'); return 128; }
    const res = mergeTrees(c.tree, cur, treeOf(m, c.parents[0]), 'HEAD', `parent of ${short(id)}`);
    if (res.conflicts.length) { io.err(`error: could not revert ${short(id)}... ${c.msg}\n${res.notes.join('\n')}`); applyTree(m, repo, cur, cur); return 1; }
    applyTree(m, repo, res.tree, cur);
    return doCommit(m, repo, io, `Revert "${c.msg.split('\n')[0]}"\n\nThis reverts commit ${id}.`, {});
  };
  SUB.tag = (m, repo, a, io) => {
    if (a.includes('-d')) { const t = a[a.indexOf('-d') + 1]; if (!repo.tags[t]) { io.err(`error: tag '${t}' not found.`); return 1; } delete repo.tags[t]; delete repo.tagMeta[t]; io.out(`Deleted tag '${t}'`); return 0; }
    const mi = a.findIndex((x) => x === '-m');
    const annotated = a.includes('-a') || mi >= 0;
    const p = a.filter((x, i) => !x.startsWith('-') && a[i - 1] !== '-m');
    const listing = a.includes('-l') || a.includes('--list') || !p.length || (a.includes('-n') && !annotated);
    if (listing) {
      const pat = p[0] ? new RegExp('^' + p[0].split('*').map(esc).join('.*') + '$') : null;
      Object.keys(repo.tags).sort().filter((t) => !pat || pat.test(t)).forEach((t) => io.out(a.some((x) => /^-n/.test(x)) ? `${t.padEnd(15)}${(repo.tagMeta[t] && repo.tagMeta[t].msg) || m.objects.get(repo.tags[t]).msg.split('\n')[0]}` : t));
      return 0;
    }
    if (repo.tags[p[0]]) { io.err(`fatal: tag '${p[0]}' already exists`); return 128; }
    const id = p[1] ? resolveRef(m, repo, p[1]) : headId(repo);
    if (!id) { io.err('fatal: Failed to resolve \'HEAD\' as a valid ref.'); return 128; }
    if (annotated) {
      if (mi < 0) { io.err('fatal: no tag message? (the sandbox has no editor: use git tag -a <name> -m "message")'); return 128; }
      const who = identity(m, repo) || { name: 'Learner', email: 'learner@example.com' };
      repo.tagMeta[p[0]] = { msg: a[mi + 1], tagger: who, time: m.tick() };
    }
    repo.tags[p[0]] = id;
  };
  SUB.stash = (m, repo, a, io) => {
    const op = a[0] && !a[0].startsWith('-') ? a[0] : 'push';
    if (op === 'list') { repo.stash.forEach((s, i) => io.out(`stash@{${i}}: WIP on ${s.branch}: ${s.desc}`)); return 0; }
    if (op === 'drop') { repo.stash.shift(); return 0; }
    if (op === 'pop' || op === 'apply') {
      const s = repo.stash[0];
      if (!s) { io.err('No stash entries found.'); return 1; }
      const dirty = dirtyPaths(m, repo);
      const clash = Object.keys(s.changes).filter((p) => dirty.has(p));
      if (clash.length) { io.err(`error: Your local changes to the following files would be overwritten by merge:\n${clash.map((p) => '\t' + p).join('\n')}\nPlease commit your changes or stash them before you merge.\nAborting`); return 1; }
      for (const [p, v] of Object.entries(s.changes)) { if (v === null) m.files.delete(repo.root + '/' + p); else m.write(repo.root + '/' + p, v); }
      if (op === 'pop') { repo.stash.shift(); }
      formatStatus(m, repo, io, false);
      if (op === 'pop') io.out(`Dropped refs/stash@{0} (${short(sha('stash' + s.desc))})`);
      return 0;
    }
    const s = status(m, repo);
    if (!s.staged.length && !s.unstaged.length) { io.out('No local changes to save'); return 0; }
    const head = treeOf(m, headId(repo)), wt = worktree(m, repo);
    const changes = {};
    for (const p of new Set([...s.staged, ...s.unstaged].map((x) => x.p))) changes[p] = wt.has(p) ? wt.get(p) : null;
    const hc = m.objects.get(headId(repo));
    repo.stash.unshift({ changes, branch: repo.head.ref, desc: `${short(hc.id)} ${hc.msg.split('\n')[0]}` });
    applyTree(m, repo, head, head);
    for (const p of Object.keys(changes)) if (!(p in head)) m.files.delete(repo.root + '/' + p);
    io.out(`Saved working directory and index state WIP on ${repo.head.ref}: ${repo.stash[0].desc}`);
  };
  SUB.rebase = (m, repo, a, io) => {
    const name = a.find((x) => !x.startsWith('-'));
    const up = name && resolveRef(m, repo, name);
    if (!up) { io.err(`fatal: invalid upstream '${name || ''}'`); return 128; }
    const cur = headId(repo);
    if (dirtyPaths(m, repo).size) { io.err('error: cannot rebase: You have unstaged changes.\nerror: Please commit or stash them.'); return 1; }
    if (isAncestor(m, up, cur)) { io.out(`Current branch ${repo.head.ref} is up to date.`); return 0; }
    const base = mergeBase(m, cur, up);
    const mine = [];
    for (let x = cur; x !== base;) { mine.unshift(x); x = m.objects.get(x).parents[0]; }
    let tip = up, tipTree = treeOf(m, up);
    for (const id of mine) {
      const c = m.objects.get(id);
      const res = mergeTrees(treeOf(m, c.parents[0]), tipTree, c.tree, 'HEAD', short(id));
      if (res.conflicts.length) { io.err(`CONFLICT while replaying "${c.msg}"\nThe sandbox cannot pause a rebase for manual conflict resolution, so it has been aborted. Try "git merge ${name}" instead.`); return 1; }
      tip = newCommit(m, c.msg, [tip], res.tree, c.author);
      tipTree = res.tree;
    }
    applyTree(m, repo, tipTree, treeOf(m, cur));
    setHead(repo, tip, `rebase (finish): ${repo.head.ref} onto ${short(up)}`);
    io.out(`Successfully rebased and updated refs/heads/${repo.head.ref}.`);
  };

  SUB['cherry-pick'] = (m, repo, a, io) => {
    if (a.includes('--abort')) return abortMerge(m, repo, io);
    if (a.includes('--continue')) return doCommit(m, repo, io, null, {});
    const refs = a.filter((x) => !x.startsWith('-'));
    if (!refs.length) { io.err('error: you must specify a commit to cherry-pick'); return 128; }
    if (repo.merging) { io.err('error: cherry-picking is not possible because you have unmerged files.'); return 128; }
    if (dirtyPaths(m, repo).size) { io.err('error: your local changes would be overwritten by cherry-pick.\nhint: commit your changes or stash them to proceed.\nfatal: cherry-pick failed'); return 128; }
    for (const ref of refs) {
      const id = resolveRef(m, repo, ref);
      if (!id) { io.err(`fatal: bad revision '${ref}'`); return 128; }
      const c = m.objects.get(id);
      if (!c.parents.length) { io.err('error: cherry-picking a root commit is not supported in the sandbox'); return 128; }
      const cur = headId(repo), curTree = treeOf(m, cur);
      const res = mergeTrees(treeOf(m, c.parents[0]), curTree, c.tree, 'HEAD', `${short(id)} (${c.msg.split('\n')[0]})`);
      if (res.conflicts.length) {
        applyTree(m, repo, res.tree, curTree);
        repo.unmerged = new Set(res.conflicts);
        repo.merging = { id, msg: c.msg, cherry: true };
        io.err(`error: could not apply ${short(id)}... ${c.msg.split('\n')[0]}\nhint: After resolving the conflicts, mark them with "git add <file>"\nhint: and run "git cherry-pick --continue".\nhint: Or abort with "git cherry-pick --abort".\n${res.notes.join('\n')}`);
        return 1;
      }
      const same = JSON.stringify(Object.entries(res.tree).sort()) === JSON.stringify(Object.entries(curTree).sort());
      if (same) { io.err('The previous cherry-pick is now empty, possibly due to conflict resolution.'); return 1; }
      applyTree(m, repo, res.tree, curTree);
      const nid = newCommit(m, c.msg, [cur], res.tree, c.author);
      setHead(repo, nid, `cherry-pick: ${c.msg.split('\n')[0]}`);
      io.out(`[${repo.head.ref || 'detached HEAD'} ${short(nid)}] ${c.msg.split('\n')[0]}\n${statLines(statOf(curTree, res.tree), true).join('\n')}`);
    }
    return 0;
  };
  SUB.reflog = (m, repo, a, io) => {
    if (!repo.reflog.length) { io.out(''); return 0; }
    repo.reflog.forEach((e, i) => io.out(`${short(e.id)} HEAD@{${i}}: ${e.note}`));
  };
  SUB.bisect = (m, repo, a, io) => {
    const op = a[0];
    if (op === 'start') {
      if (!headId(repo)) { io.err('fatal: no commits yet'); return 128; }
      repo.bisect = { orig: Object.assign({}, repo.head), origId: headId(repo), good: null, bad: null };
      io.out('status: waiting for both good and bad commits');
      return 0;
    }
    const b = repo.bisect;
    if (!b) { io.err('You need to start by "git bisect start"'); return 1; }
    if (op === 'reset') {
      const cur = treeOf(m, headId(repo));
      applyTree(m, repo, treeOf(m, b.origId), cur);
      repo.head = b.orig; repo.bisect = null;
      io.out(`Previous HEAD position was ${short(headId(repo) || b.origId)}\n${b.orig.ref ? `Switched to branch '${b.orig.ref}'` : 'HEAD is now at ' + short(b.origId)}`);
      return 0;
    }
    if (op === 'log') { io.out(`# bad: ${b.bad || 'none'}\n# good: ${b.good || 'none'}`); return 0; }
    if (!['good', 'bad', 'new', 'old'].includes(op)) { io.err(`error: unknown bisect command '${op}'`); return 1; }
    const isGood = op === 'good' || op === 'old';
    const id = a[1] ? resolveRef(m, repo, a[1]) : headId(repo);
    if (!id) { io.err(`error: Bad rev input: ${a[1]}`); return 1; }
    if (isGood) b.good = id; else b.bad = id;
    if (!b.good || !b.bad) { io.out(`status: waiting for ${!b.good ? 'a good' : 'a bad'} commit`); return 0; }
    if (!isAncestor(m, b.good, b.bad)) { io.err('The good commit must be an ancestor of the bad commit.'); return 1; }
    const chain = [];
    for (let x = b.bad; x && x !== b.good;) { chain.push(x); x = m.objects.get(x).parents[0]; }
    const unknown = chain.slice(1);
    if (!unknown.length) {
      const c = m.objects.get(b.bad);
      io.out(`${b.bad} is the first bad commit\ncommit ${b.bad}\nAuthor: ${c.author.name} <${c.author.email}>\nDate:   ${fmtDate(c.time)}\n\n    ${c.msg.split('\n')[0]}`);
      return 0;
    }
    const mid = unknown[Math.floor(unknown.length / 2)];
    const cur = treeOf(m, headId(repo));
    if (!guardOverwrite(m, repo, treeOf(m, mid), io, 'checkout')) return 1;
    applyTree(m, repo, treeOf(m, mid), cur);
    repo.head = { id: mid };
    logHead(repo, `checkout: moving to ${short(mid)}`);
    const left = unknown.length - 1;
    io.out(`Bisecting: ${plural(left, 'revision')} left to test after this (roughly ${Math.max(1, Math.ceil(Math.log2(unknown.length + 1)))} step${unknown.length > 1 ? 's' : ''})\n[${mid}] ${m.objects.get(mid).msg.split('\n')[0]}`);
    return 0;
  };
  SUB.blame = (m, repo, a, io) => {
    const f = a.find((x) => !x.startsWith('-'));
    const rel = f && m.abs(f).slice(repo.root.length + 1);
    const head = headId(repo);
    if (!f || !head || !(rel in treeOf(m, head))) { io.err(`fatal: no such path '${f || ''}' in HEAD`); return 128; }
    const lines = splitLines(treeOf(m, head)[rel]);
    const owner = new Array(lines.length).fill(null);
    let track = lines.map((_, i) => i);          // line index in the version of the commit we are looking at
    let cid = head;
    let cur = lines;
    while (cid && track.some((t, i) => owner[i] === null && t >= 0)) {
      const c = m.objects.get(cid);
      const pv = c.parents.length ? splitLines((treeOf(m, c.parents[0]))[rel] || '') : [];
      const map = lcsMap(pv, cur);                // parent idx -> child idx
      const back = new Array(cur.length).fill(-1);
      map.forEach((ci, pi) => { if (ci >= 0) back[ci] = pi; });
      track = track.map((t, i) => {
        if (owner[i] !== null || t < 0) return t;
        if (back[t] < 0) { owner[i] = cid; return -1; }
        return back[t];
      });
      cur = pv; cid = c.parents[0];
    }
    const w = Math.max(...lines.map((_, i) => String(i + 1).length));
    lines.forEach((l, i) => {
      const c = m.objects.get(owner[i] || head);
      const d = new Date(c.time * 1000).toISOString().slice(0, 10);
      io.out(`${short(c.id)} (${c.author.name.padEnd(8)} ${d} ${String(i + 1).padStart(w)}) ${l}`);
    });
  };
  SUB.shortlog = (m, repo, a, io) => {
    const counts = {};
    const by = {};
    [...ancestors(m, headId(repo))].map((x) => m.objects.get(x)).sort((x, y) => y.time - x.time).forEach((c) => { counts[c.author.name] = (counts[c.author.name] || 0) + 1; (by[c.author.name] = by[c.author.name] || []).push(c.msg.split('\n')[0]); });
    const names = Object.keys(counts);
    if (a.some((x) => /^-[a-z]*n/.test(x))) names.sort((x, y) => counts[y] - counts[x] || x.localeCompare(y));
    else names.sort();
    names.forEach((n) => {
      if (a.some((x) => /^-[a-z]*s/.test(x))) io.out(`${String(counts[n]).padStart(6)}\t${n}`);
      else io.out(`${n} (${counts[n]}):\n${by[n].map((x) => '      ' + x).join('\n')}\n`);
    });
  };
  SUB.clean = (m, repo, a, io) => {
    const flags = a.filter((x) => x.startsWith('-')).join('');
    const dry = flags.includes('n') || a.includes('--dry-run');
    if (!dry && !flags.includes('f') && !a.includes('--force')) { io.err('fatal: clean.requireForce defaults to true and neither -i, -n, nor -f given; refusing to clean'); return 128; }
    const s = status(m, repo);
    const withDirs = flags.includes('d');
    const targets = s.untracked.filter((p) => withDirs || !p.includes('/'));
    const skipped = s.untracked.filter((p) => !withDirs && p.includes('/'));
    if (flags.includes('x')) { /* ignored files would be included too */ }
    for (const p of targets) { io.out(`${dry ? 'Would remove' : 'Removing'} ${p}`); if (!dry) m.files.delete(repo.root + '/' + p); }
    if (skipped.length) io.out(`${dry ? 'Would skip' : 'Skipping'} repository ${[...new Set(skipped.map((p) => p.split('/')[0] + '/'))].join(', ')}`);
  };
  SUB.remote = (m, repo, a, io) => {
    const op = a[0] && !a[0].startsWith('-') ? a[0] : 'list';
    if (op === 'add') {
      if (!a[1] || !a[2]) { io.err('usage: git remote add <name> <url>'); return 129; }
      if (repo.remotes[a[1]]) { io.err(`error: remote ${a[1]} already exists.`); return 3; }
      repo.remotes[a[1]] = a[2]; return 0;
    }
    if (op === 'remove' || op === 'rm') {
      if (!repo.remotes[a[1]]) { io.err(`error: No such remote: '${a[1]}'`); return 2; }
      delete repo.remotes[a[1]];
      for (const k of Object.keys(repo.remoteRefs)) if (k.startsWith(a[1] + '/')) delete repo.remoteRefs[k];
      return 0;
    }
    if (op === 'get-url') { if (!repo.remotes[a[1]]) { io.err(`error: No such remote '${a[1]}'`); return 2; } io.out(repo.remotes[a[1]]); return 0; }
    if (op === 'set-url') { if (!repo.remotes[a[1]]) { io.err(`error: No such remote '${a[1]}'`); return 2; } repo.remotes[a[1]] = a[2]; return 0; }
    for (const [n, u] of Object.entries(repo.remotes)) {
      if (a.includes('-v') || a.includes('--verbose')) io.out(`${n}\t${u} (fetch)\n${n}\t${u} (push)`); else io.out(n);
    }
  };
  SUB.fetch = (m, repo, a, io) => {
    const name = a.find((x) => !x.startsWith('-')) || (repo.upstream[repo.head.ref] || {}).remote || 'origin';
    return fetchRemote(m, repo, name, io) ? 0 : 128;
  };
  SUB.pull = (m, repo, a, io) => {
    const p = a.filter((x) => !x.startsWith('-'));
    let up = repo.upstream[repo.head.ref];
    if (p[0]) up = { remote: p[0], branch: p[1] || repo.head.ref };
    if (!up) {
      io.err(`There is no tracking information for the current branch.\nPlease specify which branch you want to merge with.\nSee git-pull(1) for details.\n\n    git pull <remote> <branch>\n\nIf you wish to set tracking information for this branch you can do so with:\n\n    git branch --set-upstream-to=origin/<branch> ${repo.head.ref}`);
      return 1;
    }
    if (!repo.remotes[up.remote]) { io.err(`fatal: '${up.remote}' does not appear to be a git repository`); return 128; }
    const rem = fetchRemote(m, repo, up.remote, io);
    if (!rem) return 128;
    const target = repo.remoteRefs[up.remote + '/' + up.branch];
    if (!target) { io.err(`fatal: couldn't find remote ref ${up.branch}`); return 128; }
    if (a.includes('--rebase')) return SUB.rebase(m, repo, [up.remote + '/' + up.branch], io);
    const r = mergeInto(m, repo, io, target, { label: `${up.remote}/${up.branch}`, message: `Merge branch '${up.branch}' of ${repo.remotes[up.remote].replace(/\.git$/, '')}`, noFf: false });
    return r === 'conflict' || r === 'error' ? 1 : 0;
  };
  SUB.push = (m, repo, a, io) => {
    const setUp = a.includes('-u') || a.includes('--set-upstream');
    const force = a.includes('-f') || a.includes('--force') || a.includes('--force-with-lease');
    const del = a.includes('--delete') || a.includes('-d');
    const p = a.filter((x) => !x.startsWith('-'));
    if (!Object.keys(repo.remotes).length && !p.length) {
      io.err('fatal: No configured push destination.\nEither specify the URL from the command-line or configure a remote repository using\n\n    git remote add <name> <url>\n\nand then push using the remote name\n\n    git push <name>\n');
      return 128;
    }
    const cur = repo.head.ref;
    const up = cur && repo.upstream[cur];
    const remoteName = p[0] || (up && up.remote) || 'origin';
    if (!p.length && !up) {
      if (!cur) { io.err('fatal: You are not currently on a branch.'); return 128; }
      io.err(`fatal: The current branch ${cur} has no upstream branch.\nTo push the current branch and set the remote as upstream, use\n\n    git push --set-upstream ${remoteName} ${cur}\n\nTo have this happen automatically for branches without a tracking\nupstream, see 'push.autoSetupRemote' in 'git help config'.\n`);
      return 128;
    }
    const url = repo.remotes[remoteName] || (findRemote(m, remoteName) ? remoteName : null);
    if (!url) { io.err(`fatal: '${remoteName}' does not appear to be a git repository\nfatal: Could not read from remote repository.\n\nPlease make sure you have the correct access rights\nand the repository exists.`); return 128; }
    const rem = findRemote(m, url);
    if (!rem) { io.err(`remote: Repository not found.\nfatal: repository '${url}/' not found`); return 128; }
    if (a.includes('--tags') || (p[1] && repo.tags[p[1]] && !repo.branches[p[1]])) {
      rem.tags = rem.tags || {};
      const names = a.includes('--tags') ? Object.keys(repo.tags) : [p[1]];
      const fresh = names.filter((t) => rem.tags[t] !== repo.tags[t]);
      fresh.forEach((t) => { rem.tags[t] = repo.tags[t]; });
      io.out(fresh.length ? `To ${url}\n${fresh.map((t) => ` * [new tag]         ${t} -> ${t}`).join('\n')}` : 'Everything up-to-date');
      return 0;
    }
    let branch = p[1] || (up && up.branch) || cur;
    if (branch === 'HEAD') branch = cur;
    if (del) {
      if (!rem.branches[branch]) { io.err(`error: unable to delete '${branch}': remote ref does not exist`); return 1; }
      delete rem.branches[branch]; delete repo.remoteRefs[remoteName + '/' + branch];
      io.out(`To ${url}\n - [deleted]         ${branch}`);
      return 0;
    }
    const src = branch.includes(':') ? branch.split(':')[0] : branch;
    const dst = branch.includes(':') ? branch.split(':')[1] : branch;
    const localId = repo.branches[src];
    if (!localId) { io.err(`error: src refspec ${src} does not match any\nerror: failed to push some refs to '${url}'`); return 1; }
    const remoteId = rem.branches[dst];
    if (rem.protect && rem.protect[dst] && remoteId !== localId) {
      io.err(`remote: error: GH006: Protected branch update failed for refs/heads/${dst}.\nremote: error: Changes must be made through a pull request.\nTo ${url}\n ! [remote rejected] ${src} -> ${dst} (protected branch hook declined)\nerror: failed to push some refs to '${url}'`);
      return 1;
    }
    if (remoteId === localId) { io.out('Everything up-to-date'); }
    else {
      if (remoteId && !force && !isAncestor(m, remoteId, localId)) {
        const known = repo.remoteRefs[remoteName + '/' + dst] === remoteId;
        io.err(`To ${url}\n ! [rejected]        ${src} -> ${dst} (${known ? 'non-fast-forward' : 'fetch first'})\nerror: failed to push some refs to '${url}'\nhint: Updates were rejected because the ${known ? 'tip of your current branch is behind' : 'remote contains work that you do not'}\nhint: ${known ? 'its remote counterpart' : 'have locally'}. If you want to integrate the remote changes, use 'git pull'\nhint: before pushing again.`);
        return 1;
      }
      rem.branches[dst] = localId;
      repo.remoteRefs[remoteName + '/' + dst] = localId;
      io.out(`To ${url}\n${remoteId ? `   ${short(remoteId)}..${short(localId)}  ${src} -> ${dst}` : ` * [new branch]      ${src} -> ${dst}`}`);
    }
    if (setUp) { repo.upstream[src] = { remote: remoteName, branch: dst }; io.out(`branch '${src}' set up to track '${remoteName}/${dst}'.`); }
    return 0;
  };

  LP.G = { logHead, fmtDate, status, treeOf, headId, resolveRef, ancestors, isAncestor, mergeBase, mergeTrees, findRemote, urlKey, newCommit, applyTree, setHead, identity, cloneInto, fetchRemote, mergeInto, doCommit, worktree, short, newRepo };
})(typeof window !== 'undefined' ? window : globalThis);
