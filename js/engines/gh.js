/* A tiny `gh` (GitHub CLI) simulation: repos, forks, pull requests, issues. */
(function (root) {
  'use strict';
  const LP = root.LP || (typeof require !== 'undefined' ? require('./shell.js') : null);
  if (typeof require !== 'undefined' && !LP.G) require('./git.js');
  const G = LP.G;
  const { basename } = LP.util;
  const M = LP.Machine;
  const C = M.commands;
  const short = G.short;

  function flag(a, ...names) {
    for (let i = 0; i < a.length; i++) {
      for (const n of names) {
        if (a[i] === n) return a[i + 1] === undefined ? true : a[i + 1];
        if (a[i].startsWith(n + '=')) return a[i].slice(n.length + 1);
      }
    }
    return undefined;
  }
  const positional = (a, valueFlags) => a.filter((x, i) => !x.startsWith('-') && !valueFlags.includes(a[i - 1]));

  function originRemote(m, repo, io) {
    const url = repo && (repo.remotes.origin || Object.values(repo.remotes)[0]);
    const rem = url && G.findRemote(m, url);
    if (!rem) { io.err(repo && url ? `error: could not resolve ${url} on GitHub` : 'no git remotes found'); return null; }
    return rem;
  }
  function createRemote(m, owner, name, opts) {
    const key = `github.com/${owner}/${name}`.toLowerCase();
    if (m.remotes[key]) return null;
    return (m.remotes[key] = { key, owner, name, url: 'https://github.com/' + owner + '/' + name, branches: {}, defaultBranch: 'main', issues: [], prs: [], num: 1, forkOf: opts.forkOf || null, isPrivate: !!opts.isPrivate });
  }

  M.prototype.addReview = function (url, number, review) {
    const rem = G.findRemote(this, url);
    const pr = rem.prs.find((x) => x.number === number);
    (pr.reviews = pr.reviews || []).push(review);
  };
  M.prototype.protectBranch = function (url, branch, opts) { const rem = G.findRemote(this, url); rem.protect = rem.protect || {}; rem.protect[branch] = opts || { approvals: 1 }; };

  function ghRelease(m, op, a, io, repo) {
    const rem = originRemote(m, repo, io);
    if (!rem) return 1;
    rem.releases = rem.releases || [];
    rem.tags = rem.tags || {};
    if (op === 'create') {
      const tag = a.find((x) => !x.startsWith('-'));
      if (!tag) { io.err('tag argument required when not running interactively'); return 1; }
      if (rem.releases.some((r) => r.tag === tag)) { io.err(`HTTP 422: a release with the tag ${tag} already exists`); return 1; }
      const title = flag(a, '--title', '-t'), notes = flag(a, '--notes', '-n');
      if (typeof title !== 'string' && typeof notes !== 'string' && !a.includes('--generate-notes')) { io.err('must provide `--title` and `--notes` (or `--generate-notes`) when not running interactively'); return 1; }
      if (!rem.tags[tag]) rem.tags[tag] = rem.branches[rem.defaultBranch];
      rem.releases.push({ tag, title: typeof title === 'string' ? title : tag, notes: typeof notes === 'string' ? notes : '' });
      io.out(`${rem.url}/releases/tag/${tag}`);
      return 0;
    }
    if (op === 'list') { if (!rem.releases.length) { io.err('no releases found'); return 0; } rem.releases.forEach((r) => io.out(`${r.title}\tLatest\t${r.tag}`)); return 0; }
    io.err(`unknown command "${op}" for "gh release"`);
    return 1;
  }

  C.gh = function (m, a, io) {
    const [area, op, ...rest] = a;
    if (!area || area === '--help') { io.out('Work seamlessly with GitHub from the command line.\n\nCORE COMMANDS\n  auth, issue, pr, repo'); return 0; }
    if (area === '--version') { io.out('gh version 2.62.0'); return 0; }
    if (area === 'auth') {
      if (op === 'status') io.out(`github.com\n  ✓ Logged in to github.com account ${m.ghUser} (keyring)\n  - Active account: true`);
      else io.out('✓ Logged in (the sandbox is already authenticated)');
      return 0;
    }
    const repo = m.repoAt(m.cwd);
    if (area === 'repo') return ghRepo(m, op, rest, io, repo);
    if (!repo) { io.err('fatal: not a git repository (or any of the parent directories): .git'); return 128; }
    if (area === 'pr') return ghPr(m, op, rest, io, repo);
    if (area === 'issue') return ghIssue(m, op, rest, io, repo);
    if (area === 'release') return ghRelease(m, op, rest, io, repo);
    io.err(`unknown command "${area}" for "gh"`);
    return 1;
  };

  function ghRepo(m, op, a, io, repo) {
    const vf = ['--source', '--remote', '--description', '-d'];
    const p = positional(a, vf);
    if (op === 'create') {
      let name = p[0];
      const src = flag(a, '--source');
      if (!name && src) name = basename(m.abs(src));
      if (!name) { io.err('must specify a repository name when not running interactively'); return 1; }
      let owner = m.ghUser;
      if (name.includes('/')) [owner, name] = name.split('/');
      if (!a.includes('--public') && !a.includes('--private') && !a.includes('--internal')) { io.err('`--public`, `--private`, or `--internal` required when not running interactively'); return 1; }
      const rem = createRemote(m, owner, name, { isPrivate: a.includes('--private') });
      if (!rem) { io.err(`GraphQL: Name already exists on this account (createRepository)`); return 1; }
      io.out(`✓ Created repository ${owner}/${name} on GitHub\n  ${rem.url}`);
      if (src) {
        const r = m.repoAt(m.abs(src));
        if (!r) { io.err('fatal: not a git repository'); return 128; }
        const rname = flag(a, '--remote') || 'origin';
        r.remotes[rname] = rem.url;
        io.out(`✓ Added remote ${rem.url}`);
        if (a.includes('--push')) {
          const br = r.head.ref;
          if (G.headId(r)) {
            rem.branches[br] = r.branches[br]; rem.defaultBranch = br;
            r.remoteRefs[rname + '/' + br] = r.branches[br]; r.upstream[br] = { remote: rname, branch: br };
            io.out(`✓ Pushed commits to ${rem.url}`);
          }
        }
      }
      return 0;
    }
    if (op === 'clone') {
      if (!p[0]) { io.err('specify a repository to clone'); return 1; }
      const spec = p[0].includes('github.com') ? p[0] : `https://github.com/${p[0].includes('/') ? p[0] : m.ghUser + '/' + p[0]}`;
      const name = basename(spec).replace(/\.git$/, '');
      io.out(`Cloning into '${name}'...`);
      return G.cloneInto(m, io, spec, m.abs(p[1] || name), name) ? 0 : 1;
    }
    if (op === 'fork') {
      let spec = p[0];
      if (!spec) {
        if (!repo || !repo.remotes.origin) { io.err('unable to determine repository to fork'); return 1; }
        spec = repo.remotes.origin;
      }
      const src = G.findRemote(m, spec.includes('github.com') ? spec : 'https://github.com/' + spec);
      if (!src) { io.err(`GraphQL: Could not resolve to a Repository with the name '${spec}'. (repository)`); return 1; }
      const fork = createRemote(m, m.ghUser, src.name, { forkOf: src.key });
      if (!fork) { io.err(`${m.ghUser}/${src.name} already exists`); return 1; }
      Object.assign(fork.branches, src.branches);
      fork.defaultBranch = src.defaultBranch;
      io.out(`✓ Created fork ${m.ghUser}/${src.name}`);
      if (a.includes('--clone')) {
        io.out(`Cloning into '${src.name}'...`);
        if (!G.cloneInto(m, io, fork.url, m.abs(src.name), src.name)) return 1;
        const r = m.repoAt(m.abs(src.name));
        r.remotes.upstream = src.url;
        for (const [b, id] of Object.entries(src.branches)) r.remoteRefs['upstream/' + b] = id;
        io.out(`✓ Cloned fork`);
        io.out(`✓ Added remote upstream`);
      }
      return 0;
    }
    if (op === 'view') {
      const argRepo = a.find((x) => !x.startsWith('-'));
      const rem = argRepo ? m.remotes['github.com/' + argRepo.toLowerCase()] || (io.err(`GraphQL: Could not resolve to a Repository with the name '${argRepo}'.`), null) : originRemote(m, repo, io);
      if (!rem) return 1;
      io.out(`${rem.owner}/${rem.name}\n${rem.forkOf ? 'Fork of ' + rem.forkOf.replace('github.com/', '') + '\n' : ''}\nView this repository on GitHub: ${rem.url}`);
      return 0;
    }
    io.err(`unknown command "${op}" for "gh repo"`);
    return 1;
  }

  function currentPr(rem, repo) {
    return rem.prs.find((x) => x.head === repo.head.ref && x.state === 'OPEN');
  }
  // a fork's PRs live on the upstream repo (like real gh, which targets the parent by default)
  function upstreamOf(m, rem) { return rem.forkOf ? m.remotes[rem.forkOf] || null : null; }

  function ghPr(m, op, a, io, repo) {
    const rem = originRemote(m, repo, io);
    if (!rem) return 1;
    const vf = ['--title', '-t', '--body', '-b', '--base', '-B', '--head', '-H', '--state', '-s'];
    const p = positional(a, vf);
    const up = upstreamOf(m, rem);
    if (op === 'create' && up) {
      const head = flag(a, '--head', '-H') || repo.head.ref;
      const base = flag(a, '--base', '-B') || up.defaultBranch;
      const pushed = rem.branches[head];
      if (!pushed) { io.err('aborted: you must first push the current branch to a remote, or use the --head flag'); return 1; }
      const title = flag(a, '--title', '-t');
      const body = flag(a, '--body', '-b');
      if (typeof title !== 'string') { io.err('must provide `--title` and `--body` (or `--fill`) when not running interactively'); return 1; }
      if (G.isAncestor(m, pushed, up.branches[base])) { io.err(`pull request create failed: GraphQL: No commits between ${base} and ${head} (createPullRequest)`); return 1; }
      const pr = { number: up.num++, title, body: typeof body === 'string' ? body : '', head, base, state: 'OPEN', author: m.ghUser, reviews: [], comments: [], headRepo: rem.key };
      up.prs.push(pr);
      io.out(`\nCreating pull request for ${rem.owner}:${head} into ${base} in ${up.owner}/${up.name}\n\n${up.url}/pull/${pr.number}`);
      return 0;
    }
    if (op === 'create') {
      const head = flag(a, '--head', '-H') || repo.head.ref;
      const base = flag(a, '--base', '-B') || rem.defaultBranch;
      const pushed = rem.branches[head];
      if (!pushed) { io.err(`aborted: you must first push the current branch to a remote, or use the --head flag`); return 1; }
      let title = flag(a, '--title', '-t');
      let body = flag(a, '--body', '-b');
      if (a.includes('--fill')) { const c = m.objects.get(pushed); title = title || c.msg.split('\n')[0]; body = body || ''; }
      if (typeof title !== 'string') { io.err('must provide `--title` and `--body` (or `--fill`) when not running interactively'); return 1; }
      if (typeof body !== 'string') body = '';
      if (head === base) { io.err(`head branch "${head}" is the same as base branch "${base}", cannot create a pull request`); return 1; }
      if (!rem.branches[base]) { io.err(`base branch "${base}" does not exist`); return 1; }
      if (G.isAncestor(m, pushed, rem.branches[base])) { io.err(`pull request create failed: GraphQL: No commits between ${base} and ${head} (createPullRequest)`); return 1; }
      if (rem.prs.some((x) => x.head === head && x.base === base && x.state === 'OPEN')) { io.err(`a pull request for branch "${head}" into branch "${base}" already exists`); return 1; }
      const pr = { number: rem.num++, title, body, head, base, state: 'OPEN', author: m.ghUser, reviews: [], comments: [] };
      rem.prs.push(pr);
      io.out(`\nCreating pull request for ${head} into ${base} in ${rem.owner}/${rem.name}\n\n${rem.url}/pull/${pr.number}`);
      return 0;
    }
    if (op === 'list') {
      const st = (flag(a, '--state', '-s') || 'open').toUpperCase();
      const rows = rem.prs.filter((x) => st === 'ALL' || x.state === st);
      if (!rows.length) { io.err(`no ${st.toLowerCase()} pull requests in ${rem.owner}/${rem.name}`); return 0; }
      io.out(`\nShowing ${rows.length} of ${rows.length} ${st.toLowerCase()} pull request${rows.length === 1 ? '' : 's'} in ${rem.owner}/${rem.name}\n`);
      rows.forEach((x) => io.out(`#${x.number}\t${x.title}\t${x.head}\t${x.state}`));
      return 0;
    }
    const find = () => {
      if (p[0]) return rem.prs.find((x) => String(x.number) === p[0].replace('#', '') || x.head === p[0]) || (up && up.prs.find((x) => String(x.number) === p[0].replace('#', '')));
      return currentPr(rem, repo) || (up && up.prs.find((x) => x.headRepo === rem.key && x.head === repo.head.ref && x.state === 'OPEN'));
    };
    if (op === 'view') {
      const pr = find();
      if (!pr) { io.err('no pull requests found for branch "' + repo.head.ref + '"'); return 1; }
      const rv = (pr.reviews || []).map((r) => `\n${r.author} ${r.state.toLowerCase().replace('_', ' ')}${r.body ? ': ' + r.body : ''}`).join('');
      const cm = (pr.comments || []).map((c) => `\n${c.author} commented: ${c.body}`).join('');
      io.out(`${pr.title} #${pr.number}\n${pr.state} • ${pr.author} wants to merge ${pr.head} into ${pr.base}\n\n${pr.body || 'No description provided'}${rv ? '\n\nReviews:' + rv : ''}${cm ? '\n\nComments:' + cm : ''}\n\nView this pull request on GitHub: ${rem.url}/pull/${pr.number}`);
      return 0;
    }
    if (op === 'comment' || op === 'review') {
      const pr = find();
      if (!pr) { io.err(`no pull requests found for branch "${repo.head.ref}"`); return 1; }
      const body = flag(a, '--body', '-b');
      if (op === 'comment') {
        if (typeof body !== 'string') { io.err('flag needs an argument: --body (-b)'); return 1; }
        pr.comments.push({ author: m.ghUser, body });
        io.out(`${rem.url}/pull/${pr.number}#issuecomment-1`);
        return 0;
      }
      const kind = a.includes('--approve') || a.includes('-a') ? 'APPROVED' : a.includes('--request-changes') || a.includes('-r') ? 'CHANGES_REQUESTED' : a.includes('--comment') || a.includes('-c') ? 'COMMENTED' : null;
      if (!kind) { io.err('--approve, --request-changes, or --comment required when not running interactively'); return 1; }
      if (kind !== 'COMMENTED' && pr.author === m.ghUser) { io.err('failed to create review: GraphQL: Review Can not ' + (kind === 'APPROVED' ? 'approve' : 'request changes on') + ' your own pull request (addPullRequestReview)'); return 1; }
      pr.reviews.push({ author: m.ghUser, state: kind, body: typeof body === 'string' ? body : '' });
      io.out(`✓ ${kind === 'APPROVED' ? 'Approved' : kind === 'COMMENTED' ? 'Reviewed' : 'Requested changes on'} pull request #${pr.number}`);
      return 0;
    }
    if (op === 'close') {
      const pr = find();
      if (!pr) { io.err('no pull request found'); return 1; }
      pr.state = 'CLOSED';
      io.out(`✓ Closed pull request #${pr.number} (${pr.title})`);
      return 0;
    }
    if (op === 'checkout') {
      const pr = find();
      if (!pr) { io.err('no pull request found'); return 1; }
      io.err('gh pr checkout is not supported in the sandbox. Use: git fetch && git switch ' + pr.head);
      return 1;
    }
    if (op === 'merge') {
      const pr = find();
      if (!pr) { io.err(`no pull requests found for branch "${repo.head.ref}"`); return 1; }
      if (pr.state !== 'OPEN') { io.err(`X Pull request #${pr.number} (${pr.title}) can't be merged because it was already ${pr.state.toLowerCase()}`); return 1; }
      const prot = rem.protect && rem.protect[pr.base];
      if (prot) {
        const latest = {};
        (pr.reviews || []).forEach((r) => { if (r.state !== 'COMMENTED') latest[r.author] = r.state; });
        const approvals = Object.values(latest).filter((x) => x === 'APPROVED').length;
        const blocked = Object.values(latest).includes('CHANGES_REQUESTED');
        if (blocked) { io.err(`X Pull request #${pr.number} is not mergeable: changes were requested.\nTo have the pull request merged after the requested changes are addressed, get a new approval.`); return 1; }
        if (approvals < (prot.approvals || 0)) { io.err(`X Pull request #${pr.number} is not mergeable: the base branch policy prohibits the merge.\n${prot.approvals} approving review${prot.approvals === 1 ? ' is' : 's are'} required (you have ${approvals}).`); return 1; }
      }
      const baseId = rem.branches[pr.base], headId = rem.branches[pr.head];
      const squash = a.includes('--squash') || a.includes('-s'), rebase = a.includes('--rebase') || a.includes('-r');
      let newId;
      if (G.isAncestor(m, headId, baseId)) newId = baseId;
      else if (rebase && G.isAncestor(m, baseId, headId)) newId = headId;
      else {
        const res = G.mergeTrees(G.treeOf(m, G.mergeBase(m, baseId, headId)), G.treeOf(m, baseId), G.treeOf(m, headId), pr.base, pr.head);
        if (res.conflicts.length) { io.err(`X Pull request #${pr.number} is not mergeable: the merge commit cannot be cleanly created.\nTo have the pull request merged after all conflicts are resolved, update the pull request branch.`); return 1; }
        const author = { name: m.ghUser, email: m.ghUser + '@users.noreply.github.com' };
        newId = G.newCommit(m, squash ? `${pr.title} (#${pr.number})` : `Merge pull request #${pr.number} from ${rem.owner}/${pr.head}\n\n${pr.title}`, squash ? [baseId] : [baseId, headId], res.tree, author);
      }
      rem.branches[pr.base] = newId;
      pr.state = 'MERGED';
      io.out(`✓ ${squash ? 'Squashed and merged' : rebase ? 'Rebased and merged' : 'Merged'} pull request #${pr.number} (${pr.title})`);
      const closes = [...(pr.body || '').matchAll(/\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)/gi)].map((x) => +x[1]);
      for (const n of closes) {
        const is = rem.issues.find((i) => i.number === n && i.state === 'OPEN');
        if (is) { is.state = 'CLOSED'; is.closedBy = pr.number; }
      }
      if (a.includes('--delete-branch') || a.includes('-d')) {
        delete rem.branches[pr.head];
        delete repo.remoteRefs['origin/' + pr.head];
        io.out(`✓ Deleted branch ${pr.head}${repo.branches[pr.head] ? ' and switched branch to ' + pr.base : ''}`);
        if (repo.branches[pr.head]) {
          if (repo.head.ref === pr.head && repo.branches[pr.base]) { G.applyTree(m, repo, G.treeOf(m, repo.branches[pr.base]), G.treeOf(m, G.headId(repo))); repo.head = { ref: pr.base }; }
          delete repo.branches[pr.head]; delete repo.upstream[pr.head];
        }
      }
      return 0;
    }
    io.err(`unknown command "${op}" for "gh pr"`);
    return 1;
  }

  function ghIssue(m, op, a, io, repo) {
    const rem = originRemote(m, repo, io);
    if (!rem) return 1;
    const p = positional(a, ['--title', '-t', '--body', '-b', '--label', '-l', '--state', '-s']);
    if (op === 'create') {
      const title = flag(a, '--title', '-t'), body = flag(a, '--body', '-b');
      if (typeof title !== 'string') { io.err('must provide `--title` and `--body` (or `--fill`) when not running interactively'); return 1; }
      const is = { number: rem.num++, title, body: typeof body === 'string' ? body : '', state: 'OPEN', labels: [].concat(flag(a, '--label', '-l') || []) };
      rem.issues.push(is);
      io.out(`\nCreating issue in ${rem.owner}/${rem.name}\n\n${rem.url}/issues/${is.number}`);
      return 0;
    }
    if (op === 'list') {
      const st = (flag(a, '--state', '-s') || 'open').toUpperCase();
      const rows = rem.issues.filter((x) => st === 'ALL' || x.state === st);
      if (!rows.length) { io.err(`no ${st.toLowerCase()} issues in ${rem.owner}/${rem.name}`); return 0; }
      io.out(`\nShowing ${rows.length} of ${rows.length} ${st.toLowerCase()} issue${rows.length === 1 ? '' : 's'} in ${rem.owner}/${rem.name}\n`);
      rows.forEach((x) => io.out(`#${x.number}\t${x.state}\t${x.title}`));
      return 0;
    }
    const is = rem.issues.find((x) => String(x.number) === String(p[0] || '').replace('#', ''));
    if (op === 'view' || op === 'close') {
      if (!is) { io.err(`GraphQL: Could not resolve to an issue or pull request with the number of ${p[0]}. (repository.issue)`); return 1; }
      if (op === 'close') { is.state = 'CLOSED'; io.out(`✓ Closed issue #${is.number} (${is.title})`); return 0; }
      io.out(`${is.title} #${is.number}\n${is.state}\n\n${is.body || 'No description provided'}\n\nView this issue on GitHub: ${rem.url}/issues/${is.number}`);
      return 0;
    }
    io.err(`unknown command "${op}" for "gh issue"`);
    return 1;
  }
  void short;
})(typeof window !== 'undefined' ? window : globalThis);
