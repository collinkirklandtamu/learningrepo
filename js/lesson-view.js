/* The lesson page: reading on the left, workspace on the right. */
(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  LP.views = LP.views || {};
  const esc = (s) => LP.esc(String(s));

  LP.views.lesson = function (main, id) {
    const found = LP.findLesson(id);
    if (!found) { main.innerHTML = '<div class="wrap"><p>Lesson not found. <a href="#/">Back home</a></p></div>'; return; }
    const { course, lesson, next, prev } = found;
    const parentLesson = lesson.drill ? course.lessons.find((l) => l.id === lesson.parent) : null;
    const store = LP.store;
    const kind = LP.kindOf(lesson, course);
    const S = { fails: 0, hints: 0, revealed: false, solved: false, wasDone: store.isDone(id), allPassedNotified: false };
    const engine = kind === 'code' ? LP.engines[course.engine] : null;
    const diff = lesson.diff || 1;

    main.innerHTML = `<div class="lesson" data-tab="read" style="--course:${course.color}">
      <div class="lesson-tabs" role="tablist"><button type="button" role="tab" data-tab="read" aria-selected="true">📖 Read</button><button type="button" role="tab" data-tab="do" aria-selected="false">${kind === 'terminal' ? '⌨ Terminal' : '✍ Code'}</button></div>
      <section class="pane left" aria-label="Lesson">
        <div class="crumbs"><a href="#/">Home</a> › <a href="#/course/${course.id}">${esc(course.title)}</a>${parentLesson ? ` › <a href="#/lesson/${parentLesson.id}">${esc(parentLesson.title)}</a>` : ''}</div>
        <h1 class="lesson-title">${lesson.drill ? 'Practice: ' : ''}${esc(lesson.title)}</h1>
        <div class="meta-row">${lesson.drill ? '<span class="pill">🏋 Practice drill</span>' : ''}${lesson.capstone ? '<span class="pill">🏗 Capstone project</span>' : ''}<span class="pill">${esc(lesson.skill)}</span><span class="pill">+${lesson.xp || 20} XP</span><span class="pill">difficulty ${'●'.repeat(diff)}${'○'.repeat(3 - diff)}</span>${S.wasDone ? '<span class="pill" style="color:var(--ok)">✓ completed</span>' : ''}</div>
        <div class="md" id="reading">${LP.md(lesson.read)}</div>
        <div class="task-box"><h3>Your task</h3><div class="md">${LP.md(lesson.task)}</div></div>
        <div id="hintarea"></div><div id="solarea"></div>
        <div class="row" style="margin-top:28px;justify-content:space-between">${prev ? `<a class="btn ghost" href="#/lesson/${prev.id}">← ${esc(prev.title)}</a>` : '<span></span>'}${next ? `<a class="btn ${S.wasDone ? 'primary' : 'ghost'}" href="#/lesson/${next.id}">${esc(next.title)} →</a>` : `<a class="btn ghost" href="#/course/${course.id}">Course page</a>`}</div>
      </section>
      <section class="pane right" aria-label="Workspace"></section></div>`;

    const $ = (s) => main.querySelector(s);
    const left = $('.pane.left'), right = $('.pane.right'), lessonEl = $('.lesson');
    main.querySelectorAll('.lesson-tabs button').forEach((b) => b.addEventListener('click', () => {
      lessonEl.dataset.tab = b.dataset.tab;
      main.querySelectorAll('.lesson-tabs button').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
      if (editor) editor.refresh();
    }));

    // ---------- workspace ----------
    const bar = `<div class="rbar">${kind === 'code' ? '<button type="button" class="btn small" id="run" title="Ctrl/Cmd + Enter">▶ Run</button>' : ''}<button type="button" class="btn small ok" id="submit" title="${kind === 'code' ? 'Ctrl/Cmd + Shift + Enter' : ''}">✓ Submit</button>${kind === 'file' ? `<span class="pill">${esc(lesson.file)}</span>` : ''}<span class="sp"></span><button type="button" class="btn small ghost" id="hint">💡 Hint</button><button type="button" class="btn small ghost" id="sol">Solution</button><button type="button" class="btn small ghost" id="reset">↺ Reset</button></div>`;
    let editor = null, terminal = null, machine = null;

    if (kind === 'code') {
      right.innerHTML = `${bar}<div class="editor-wrap" id="editor"></div><div class="console"><div class="ch"><span>Output</span><span id="status"></span></div><div class="cb" id="out" aria-live="polite"><span class="muted">Press Run to execute your code. Press Submit to check it against the lesson's tests.</span></div></div>`;
    } else if (kind === 'file') {
      right.innerHTML = `${bar}<div class="editor-wrap" id="editor"></div><ul class="checklist" id="checks" style="max-height:45%"></ul>`;
    } else {
      right.innerHTML = `${bar}<ul class="checklist" id="checks"></ul><div id="term" style="flex:1;display:flex;flex-direction:column;min-height:0"></div>`;
    }

    const draftKey = id;
    const draft = LP.drafts.get(draftKey);
    const startText = lesson.starter || '';

    if (kind === 'code' || kind === 'file') {
      let t = null;
      editor = LP.createEditor($('#editor'), {
        lang: kind === 'file' ? lesson.lang : course.engine, value: draft !== null && !S.wasDone ? draft : startText,
        onChange: (v) => { clearTimeout(t); t = setTimeout(() => { LP.drafts.set(draftKey, v); if (kind === 'file') renderChecks(); }, 250); },
        onRun: () => run(false), onSubmit: () => submit(),
      });
      setTimeout(() => editor.refresh(), 50);
    }

    function newMachine() { return LP.Machine.create(lesson.setup); }
    if (kind === 'terminal') {
      machine = newMachine();
      terminal = LP.createTerminal($('#term'), machine, {
        intro: lesson.intro,
        onAfter: () => { renderChecks(); },
        onEditor: (ed, done) => {
          const m = LP.modal(`<h2>${esc(ed.name)}</h2><p class="muted" style="margin:0 0 8px">Sandbox editor. Edit the text, then Save.</p><textarea spellcheck="false" aria-label="File contents"></textarea><div class="row" style="justify-content:flex-end;margin-top:12px"><button type="button" class="btn" data-x="cancel">Cancel</button><button type="button" class="btn primary" data-x="save">Save</button></div>`, { wide: true, sticky: true });
          const ta = m.el.querySelector('textarea');
          ta.value = ed.content; ta.focus();
          ta.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') { e.preventDefault(); const s = ta.selectionStart; ta.value = ta.value.slice(0, s) + '  ' + ta.value.slice(ta.selectionEnd); ta.selectionStart = ta.selectionEnd = s + 2; }
            if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); m.close(); done(ta.value); }
          });
          m.el.addEventListener('click', (e) => { const b = e.target.closest('[data-x]'); if (!b) return; m.close(); done(b.dataset.x === 'save' ? ta.value : null); });
        },
      });
      setTimeout(() => terminal.focus(), 60);
    }

    function currentResults() {
      return kind === 'terminal' ? LP.evalChecks(lesson, machine) : kind === 'file' ? LP.evalChecks(lesson, editor.getValue()) : [];
    }
    function renderChecks() {
      const box = $('#checks');
      if (!box) return;
      const res = currentResults();
      box.innerHTML = res.map((c) => `<li class="${c.ok ? 'ok' : ''}"><span class="mk" aria-hidden="true">${c.ok ? '✓' : ''}</span><span><span class="sr-only">${c.ok ? 'Done: ' : 'To do: '}</span>${LP.mdInline(c.label)}</span></li>`).join('');
      const all = res.length && res.every((c) => c.ok);
      $('#submit').classList.toggle('pulse', !!all && !S.solved);
      if (all && !S.allPassedNotified && !S.solved) { S.allPassedNotified = true; LP.toast('All checks pass. Hit Submit to claim your XP!', 'ok'); }
      if (!all) S.allPassedNotified = false;
    }
    if (kind !== 'code') renderChecks();

    // ---------- code running ----------
    const outEl = $('#out'), statusEl = $('#status');
    const setStatus = (t) => { if (statusEl) statusEl.textContent = t || ''; };
    if (engine) engine.load(setStatus).catch(() => setStatus('Runtime unavailable'));

    function showResult(res, extra) {
      let html = '';
      if (res.out) html += esc(res.out);
      if (res.err) html += `${res.out ? '\n' : ''}<span class="err-text">${esc(res.err)}</span>`;
      if (!res.out && !res.err) html += '<span class="muted">(no output)</span>';
      outEl.innerHTML = html + (extra || '');
    }
    async function exec(withChecks) {
      const code = editor.getValue();
      outEl.innerHTML = '<span class="muted">Running…</span>';
      try {
        store.noteRun();
        return await engine.run(code, withChecks ? lesson.harness : '');
      } catch (e) {
        console.error('runtime load failed', e);
        outEl.innerHTML = `<span class="err-text">Could not load the ${esc(course.title)} runtime: ${esc(e.message)}\n\nThis needs to reach ${course.engine === 'python' ? 'cdn.jsdelivr.net' : 'webr.r-wasm.org'}. Ad blockers, VPNs and school/work networks sometimes block it; try another network or disable the blocker for this page.\n\nThe in-browser ${esc(course.title)} engine is downloaded from a CDN the first time (about 10-30 MB), so it needs an internet connection once. Check your connection and try again.</span>`;
        setStatus('Runtime unavailable');
        return null;
      }
    }
    async function run() { const b = $('#run'); b.disabled = true; try { const r = await exec(false); if (r) showResult(r); } finally { b.disabled = false; } }

    function failed(msg) {
      S.fails++;
      LP.toast(S.fails >= 2 && lesson.hints && S.hints < lesson.hints.length ? 'Stuck? Try 💡 Hint (costs 10% XP).' : 'Not yet. Keep going!', 'bad');
      return msg;
    }

    async function submit() {
      const sb = $('#submit');
      if (sb.disabled) return;
      sb.disabled = true;
      try {
        if (kind === 'code') {
          const code = editor.getValue();
          for (const m of lesson.must || []) {
            if (!new RegExp(m.re).test(code)) { showResult({ out: '', err: null }, `<div class="res bad"><b>Almost.</b> ${esc(m.msg)}</div>`); failed(); return; }
          }
          for (const m of lesson.forbid || []) {
            if (new RegExp(m.re).test(code)) { showResult({ out: '', err: null }, `<div class="res bad"><b>Almost.</b> ${esc(m.msg)}</div>`); failed(); return; }
          }
          const r = await exec(true);
          if (!r) return;
          if (r.err) { showResult(r, '<div class="res bad"><b>Your code raised an error.</b> Fix it and submit again.</div>'); failed(); return; }
          if (r.check && r.check.ok) { showResult(r, '<div class="res ok">✓ All checks passed.</div>'); success(); }
          else { showResult(r, `<div class="res bad"><b>Not quite.</b> ${esc((r.check && r.check.msg) || 'A check failed.')}</div>`); failed(); }
        } else {
          const res = currentResults();
          const missing = res.filter((c) => !c.ok);
          if (!missing.length) success();
          else { failed(); LP.toast(`${missing.length} check${missing.length === 1 ? '' : 's'} still to do`, 'bad'); }
        }
      } finally { sb.disabled = false; }
    }

    // ---------- reward flow ----------
    function success() {
      if (S.solved) return;
      S.solved = true;
      $('#submit').classList.remove('pulse');
      const out = store.completeLesson(lesson, course, { fails: S.fails, hints: S.hints, revealed: S.revealed });
      LP.refreshHeader();
      if (!out.first) { LP.toast('✓ Passed again. No new XP, but practice makes permanent.', 'ok', 4200); S.solved = false; return; }
      LP.confetti();
      const streak = store.streakNow();
      const why = out.revealed ? 'You revealed the solution, so no XP this time. Replay the lesson later for practice.'
        : out.perfect ? 'Perfect run: first try, no hints. +25% bonus!'
          : `${S.fails} failed submit${S.fails === 1 ? '' : 's'} and ${S.hints} hint${S.hints === 1 ? '' : 's'} reduced the XP.`;
      const badges = out.badges.map((b) => `<div class="earned"><span class="ic">${b.icon}</span><div><b>Badge: ${esc(b.name)}</b><br><span class="muted" style="font-size:.85rem">${esc(b.desc)}</span></div></div>`).join('');
      const m = LP.modal(`<h2 style="text-align:center">Lesson complete! 🎉</h2><div class="bigstars">${LP.stars(out.stars)}</div><p class="muted" style="text-align:center;margin-top:0">${esc(why)}</p>
        <div class="reward"><div><span class="v">+${out.xp}</span><span class="k">XP</span></div><div><span class="v">+${out.sp}</span><span class="k">${esc(lesson.skill)} skill pts</span></div><div><span class="v">🔥 ${streak}</span><span class="k">day streak</span></div></div>
        ${out.levelUp ? `<div class="levelup">⬆ Level ${out.levelUp} reached!</div>` : ''}${out.skillUp ? `<div class="levelup">🛠 ${esc(course.title)} · ${esc(lesson.skill)} is now ${esc(out.skillUp)}!</div>` : ''}${badges}
        <div class="row" style="justify-content:flex-end;margin-top:16px">${(lesson.recall || [])[0] ? '<button type="button" class="btn ghost" data-x="skip">Skip</button><button type="button" class="btn primary" data-x="lock" autofocus>Lock it in: 1 quick question →</button>' : `<a class="btn" href="#/course/${course.id}" data-x="close">Course</a>${next ? `<a class="btn primary" href="#/lesson/${next.id}" data-x="close" autofocus>Next: ${esc(next.title)} →</a>` : ''}`}</div>`, { sticky: true });
      const q = (lesson.recall || [])[0];
      const finish = () => {
        const nav = next ? `<a class="btn primary" href="#/lesson/${next.id}" data-x="close">Next: ${esc(next.title)} →</a>` : `<a class="btn primary" href="#/course/${course.id}" data-x="close">Back to course</a>`;
        m.el.querySelector('.after') && (m.el.querySelector('.after').innerHTML = `<div class="row" style="justify-content:flex-end;margin-top:16px"><a class="btn" href="#/review" data-x="close">Review deck</a>${nav}</div>`);
      };
      m.el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-x]');
        if (!b) return;
        if (b.dataset.x === 'close') { m.close(); return; }
        if (b.dataset.x === 'skip' || !q) { m.close(); return; }
        if (b.dataset.x === 'lock') {
          m.el.innerHTML = `<h2>Lock it in 🧠</h2><p class="muted" style="margin-top:0">Recalling what you just learned is what makes it stick.</p><div id="qhost"></div><div class="after"></div>`;
          LP.renderQuestion(m.el.querySelector('#qhost'), q, (ok) => {
            const r = store.answerRecall(`${lesson.id}#0`, ok);
            LP.refreshHeader();
            if (ok) { LP.xpPop('+' + r.xp + ' XP', false); m.el.querySelector('#qhost').insertAdjacentHTML('beforeend', `<p class="muted">+${r.xp} XP retrieval bonus. This card returns in a few days for spaced review.</p>`); }
            else m.el.querySelector('#qhost').insertAdjacentHTML('beforeend', '<p class="muted">No worries. This card is in your review queue so you will see it again soon.</p>');
            finish();
          });
        }
      });
    }

    // ---------- hints, solution, reset ----------
    $('#hint').addEventListener('click', () => {
      const hs = lesson.hints || [];
      if (S.hints >= hs.length) { LP.toast(hs.length ? 'No more hints. The Solution button is the last resort.' : 'No hints for this lesson.'); return; }
      const hint = hs[S.hints++];
      if (!S.wasDone && S.hints === 1) LP.toast('Hints cost 10% XP each on a first completion.', '', 3800);
      $('#hintarea').insertAdjacentHTML('beforeend', `<div class="hintbox"><b>Hint ${S.hints} of ${hs.length}:</b> ${LP.mdInline(hint)}</div>`);
      left.scrollTo({ top: left.scrollHeight, behavior: 'smooth' });
      lessonEl.dataset.tab = 'read';
      main.querySelectorAll('.lesson-tabs button').forEach((x) => x.setAttribute('aria-selected', String(x.dataset.tab === 'read')));
    });
    function revealSolution() {
      S.revealed = true;
      const text = LP.solutionText(lesson);
      $('#solarea').innerHTML = `<div class="solution-box"><b>Solution</b>${kind === 'terminal' ? '<span class="muted"> (type these commands yourself so the checks can see them)</span>' : ''}<pre>${esc(text)}</pre>${kind !== 'terminal' ? '<button type="button" class="btn small" id="paste-sol">Paste into editor</button>' : ''}</div>`;
      const ps = $('#paste-sol');
      if (ps) ps.addEventListener('click', () => { editor.setValue(text); });
      lessonEl.dataset.tab = 'read';
      left.scrollTo({ top: left.scrollHeight, behavior: 'smooth' });
    }
    $('#sol').addEventListener('click', () => {
      if (S.revealed || S.wasDone) { revealSolution(); return; }
      const m = LP.modal(`<h2>Reveal the solution?</h2><p class="muted">You will still be able to finish the lesson, but it will earn <b>0 XP</b>. Try a hint first: they only cost 10% each.</p><div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-x="no" autofocus>Keep trying</button><button type="button" class="btn primary" data-x="yes">Show solution</button></div>`);
      m.el.addEventListener('click', (e) => { const b = e.target.closest('[data-x]'); if (!b) return; m.close(); if (b.dataset.x === 'yes') revealSolution(); });
    });
    $('#reset').addEventListener('click', () => {
      if (kind === 'terminal') { machine = newMachine(); terminal.setMachine(machine, lesson.intro); renderChecks(); LP.toast('Terminal reset to the start of the lesson'); }
      else { editor.setValue(startText); LP.drafts.clear(draftKey); LP.toast('Editor reset'); }
    });
    if (kind === 'code') { $('#run').addEventListener('click', () => run()); }
    $('#submit').addEventListener('click', () => submit());

    // ---------- code-block actions in the reading ----------
    left.addEventListener('click', async (e) => {
      const b = e.target.closest('button[data-act]');
      if (!b) return;
      const block = b.closest('.code');
      const code = block.querySelector('code').textContent;
      if (b.dataset.act === 'copy') {
        try { await navigator.clipboard.writeText(code); LP.toast('Copied', 'ok', 1400); } catch (err) { LP.toast('Select the text and copy manually'); }
      } else if (b.dataset.act === 'paste') {
        if (!terminal) { LP.toast('Open a terminal lesson to use this'); return; }
        const cmds = [];
        let acc = '';
        for (const raw of code.split('\n')) {
          const ln = raw.replace(/\s+#\s.*$/, '').trimEnd();
          if (!ln.trim() || ln.trim().startsWith('#')) continue;
          if (ln.endsWith('\\')) { acc += ln.slice(0, -1).trim() + ' '; continue; }
          cmds.push((acc + ln.trim()).trim()); acc = '';
        }
        const i = +(block.dataset.cursor || 0) % Math.max(1, cmds.length);
        terminal.paste(cmds[i] || '');
        block.dataset.cursor = i + 1;
        lessonEl.dataset.tab = 'do';
        main.querySelectorAll('.lesson-tabs button').forEach((x) => x.setAttribute('aria-selected', String(x.dataset.tab === 'do')));
        LP.toast(`Command ${i + 1} of ${cmds.length} pasted. Press Enter.`, '', 1800);
      } else if (b.dataset.act === 'try') {
        const eng = LP.engines[block.dataset.lang === 'r' ? 'r' : 'python'];
        const prev = block.querySelector('.try-out');
        if (prev) prev.remove();
        const o = LP.h('<div class="try-out muted">Running…</div>');
        block.appendChild(o);
        try {
          const r = await eng.run(code, '');
          o.className = 'try-out' + (r.err ? ' err' : '');
          o.textContent = r.err || r.out || '(ran with no output)';
        } catch (err) { o.className = 'try-out err'; o.textContent = 'Runtime unavailable: ' + err.message; }
      }
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);
