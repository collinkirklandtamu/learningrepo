/* Terminal UI around a sandbox Machine: history, tab completion, nano modal. */
(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  const SUBS = {
    git: ['add', 'branch', 'checkout', 'clone', 'commit', 'config', 'diff', 'fetch', 'init', 'log', 'merge', 'mv', 'pull', 'push', 'rebase', 'remote', 'reset', 'restore', 'revert', 'rm', 'show', 'stash', 'status', 'switch', 'tag'],
    gh: ['auth', 'issue', 'pr', 'repo'],
    docker: ['build', 'compose', 'exec', 'images', 'inspect', 'logs', 'network', 'ps', 'pull', 'restart', 'rm', 'rmi', 'run', 'start', 'stop', 'volume'],
    'docker compose': ['down', 'logs', 'ps', 'up'],
  };
  const common = (arr) => arr.reduce((a, b) => { let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++; return a.slice(0, i); });

  LP.createTerminal = function (host, machine, opts) {
    opts = opts || {};
    let m = machine;
    const hist = [];
    let hi = 0;
    host.innerHTML = '<div class="term"><div class="term-out" role="log" aria-live="polite"></div><label class="term-in"><span class="pr"></span><span class="sr-only">Terminal input</span><input type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Terminal input"></label></div>';
    const out = host.querySelector('.term-out');
    const input = host.querySelector('input');
    const pr = host.querySelector('.term-in .pr');
    const esc = LP.esc;

    const scroll = () => { out.scrollTop = out.scrollHeight; };
    const line = (text, cls) => { const d = document.createElement('div'); d.className = 'ln ' + (cls || ''); d.textContent = text; out.appendChild(d); };
    const refreshPrompt = () => { pr.textContent = m.prompt() + ' '; };
    const echoCmd = (cmd) => {
      const d = document.createElement('div');
      d.className = 'ln';
      const p = m.prompt();
      d.innerHTML = `<span class="pr"><b>${esc(p.replace(/ \$$/, ''))}</b> $</span> ${esc(cmd)}`;
      out.appendChild(d);
    };

    function run(cmd) {
      echoCmd(cmd);
      if (cmd.trim()) { hist.push(cmd); hi = hist.length; }
      const res = m.exec(cmd);
      if (res.clear) out.innerHTML = '';
      for (const it of res.items) if (it.text !== '' || it.t !== 'out') line(it.text, it.t === 'err' ? 'err' : it.t === 'sys' ? 'sys' : '');
      if (res.editor && opts.onEditor) {
        opts.onEditor(res.editor, (saved) => {
          if (saved !== null) { m.write(res.editor.path, saved); line(`Saved ${res.editor.name}`, 'dim'); }
          refreshPrompt(); scroll(); opts.onAfter && opts.onAfter(res);
        });
      }
      refreshPrompt(); scroll();
      opts.onAfter && opts.onAfter(res);
    }

    function complete() {
      const v = input.value, caret = input.selectionStart;
      const before = v.slice(0, caret);
      const tokens = before.split(/\s+/);
      if (/^\s+$/.test(before)) tokens.length = 1;
      const idx = tokens.length - 1, cur = tokens[idx];
      let cands = [];
      const head = tokens[0];
      if (idx === 0) cands = Object.keys(LP.Machine.commands);
      else if (idx === 1 && SUBS[head]) cands = SUBS[head];
      else if (idx === 2 && head === 'docker' && tokens[1] === 'compose') cands = SUBS['docker compose'];
      else {
        const slash = cur.lastIndexOf('/');
        const dirPart = slash >= 0 ? cur.slice(0, slash + 1) : '';
        const dir = m.abs(dirPart || '.');
        cands = m.children(dir).map((n) => dirPart + n + (m.isDir(dir + '/' + n) ? '/' : ''));
        const repo = m.repoAt && m.repoAt(m.cwd);
        if (repo && head === 'git' && /^(switch|checkout|merge|branch|rebase|diff|log)$/.test(tokens[1] || '')) cands = cands.concat(Object.keys(repo.branches), Object.keys(repo.remoteRefs));
        if (head === 'docker' && m.dk && /^(stop|start|rm|logs|exec|restart|inspect)$/.test(tokens[1] || '')) cands = cands.concat(m.dk.containers.map((c) => c.name));
        if (head === 'docker' && m.dk && /^(rmi|run)$/.test(tokens[1] || '')) cands = cands.concat(Object.values(m.dk.images).map((i) => (i.tag === 'latest' ? i.name : i.name + ':' + i.tag)));
      }
      cands = [...new Set(cands)].filter((c) => c.startsWith(cur)).sort();
      if (!cands.length) return;
      const pre = common(cands);
      const rest = v.slice(caret);
      if (cands.length === 1) {
        const add = cands[0].endsWith('/') ? '' : ' ';
        input.value = before.slice(0, before.length - cur.length) + cands[0] + add + rest;
      } else {
        if (pre.length > cur.length) input.value = before.slice(0, before.length - cur.length) + pre + rest;
        else { echoCmd(v); line(cands.join('  '), 'dim'); scroll(); }
      }
    }

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { const c = input.value; input.value = ''; run(c); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (hi > 0) { hi--; input.value = hist[hi]; } }
      else if (e.key === 'ArrowDown') { e.preventDefault(); if (hi < hist.length - 1) { hi++; input.value = hist[hi]; } else { hi = hist.length; input.value = ''; } }
      else if (e.key === 'Tab') { e.preventDefault(); complete(); }
      else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); out.innerHTML = ''; }
    });
    host.addEventListener('click', (e) => { if (!window.getSelection().toString() && !e.target.closest('button')) input.focus(); });

    if (opts.intro) line(opts.intro, 'dim');
    refreshPrompt();
    return {
      paste(text) { input.value = text; input.focus(); },
      focus() { input.focus(); },
      run,
      setMachine(nm, intro) { m = nm; out.innerHTML = ''; if (intro) line(intro, 'dim'); refreshPrompt(); },
    };
  };
  if (typeof module !== 'undefined') module.exports = LP;
})(typeof window !== 'undefined' ? window : globalThis);
