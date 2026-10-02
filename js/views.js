/* Dashboard, course and profile views. */
(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  LP.views = LP.views || {};
  const { $, $$, h, esc } = Object.assign({}, LP, { esc: (s) => LP.esc(String(s)) });

  const dueText = (ms) => {
    if (ms === null) return 'No cards yet. Finish a lesson to start building your deck.';
    const mins = Math.round(ms / 60000);
    if (mins < 60) return `Next card due in ${mins} min`;
    const hrs = Math.round(mins / 60);
    return hrs < 36 ? `Next card due in ${hrs} h` : `Next card due in ${Math.round(hrs / 24)} days`;
  };
  const greet = () => { const hr = new Date().getHours(); return hr < 5 ? 'Burning the midnight oil' : hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening'; };
  const ring = (pct, big, small) => {
    const R = 34, C = 2 * Math.PI * R;
    return `<div class="ring"><svg width="84" height="84" viewBox="0 0 84 84" aria-hidden="true"><circle cx="42" cy="42" r="${R}" fill="none" stroke="var(--panel-2)" stroke-width="9"/><circle cx="42" cy="42" r="${R}" fill="none" stroke="var(--gold)" stroke-width="9" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - Math.min(1, pct))}"/></svg><div class="num"><span>${big}<small>${small}</small></span></div></div>`;
  };

  LP.views.dashboard = function (main) {
    const store = LP.store, s = store.state;
    const lp = store.levelProgress(), today = store.today(), goal = s.settings.dailyGoal;
    const due = store.dueCards().length, nxt = LP.nextLesson(store), streak = store.streakNow();
    const total = LP.courses.reduce((a, c) => a + c.lessons.filter((l) => !l.drill).length, 0);
    const drillsDone = LP.courses.reduce((a, c) => a + LP.courseProgress(store, c).drillsDone, 0);
    const done = LP.courses.reduce((a, c) => a + LP.courseProgress(store, c).done, 0);
    main.innerHTML = `<div class="wrap">
      <div class="hero"><div><h1>${greet()}, ${esc(s.settings.name)} 👋</h1>
        <p class="muted">Level ${lp.level} · ${esc(lp.title)} · ${s.xp} XP · ${done}/${total} lessons · ${drillsDone} drills</p></div></div>
      <div class="cta-grid">
        <div class="card cta">${ring(today.xp / goal, today.xp, '/ ' + goal + ' XP')}<div><h3>${streak ? '🔥 ' + streak + '-day streak' : 'Start a streak'}</h3><p class="muted" style="margin:0">${today.xp >= goal ? 'Daily goal hit. Anything more is a bonus!' : `Earn ${goal - today.xp} more XP today to hit your goal.`}</p></div></div>
        <div class="card cta" style="--course:${nxt ? nxt.course.color : 'var(--accent)'}"><div style="font-size:2.4rem">${nxt ? nxt.course.icon : '🏆'}</div><div style="flex:1"><h3>${nxt ? 'Continue: ' + esc(nxt.lesson.title) : 'Everything complete!'}</h3><p class="muted" style="margin:0 0 8px">${nxt ? esc(nxt.course.title) + ' · +' + (nxt.lesson.xp || 20) + ' XP' : 'Review keeps your skills sharp.'}</p>${nxt ? `<a class="btn primary" href="#/lesson/${nxt.lesson.id}">Start lesson →</a>` : ''}</div></div>
        <div class="card cta"><div style="font-size:2.4rem">🧠</div><div style="flex:1"><h3>${due ? due + ' card' + (due === 1 ? '' : 's') + ' due for review' : 'Review queue clear'}</h3><p class="muted" style="margin:0 0 8px">${due ? 'Spaced repetition: answer now to push each card to a longer interval.' : esc(dueText(store.nextDueIn()))}</p><a class="btn ${due ? 'primary' : ''}" href="#/review">${due ? 'Start review →' : store.allCards().length ? 'Practice anyway' : 'How it works'}</a></div></div>
      </div>
      <h2 class="section">Courses</h2>
      <div class="courses">${LP.courses.map((c) => {
        const p = LP.courseProgress(store, c);
        const lv = c.skills.map((sk) => store.skillInfo(c.id, sk));
        const rusty = lv.reduce((a, x) => a + (x.rusty ? 1 : 0), 0);
        return `<a class="card course-card" style="--course:${c.color}" href="#/course/${c.id}"><div class="top"><div class="emoji">${c.icon}</div><div><h3>${esc(c.title)}</h3><span class="muted" style="font-size:.85rem">${p.done}/${p.total} lessons · ${p.xp} XP</span></div></div><p class="muted" style="margin:0;font-size:.85rem">${esc(LP.paceText(c))}</p><p class="muted" style="margin:0">${esc(c.blurb)}</p><div class="bar" role="progressbar" aria-valuenow="${Math.round(p.pct * 100)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${p.pct * 100}%"></i></div><div class="skills-line">${c.skills.map((sk, i) => `<span class="pill ${lv[i].rusty ? 'rusty' : ''}" title="${lv[i].points} skill points">${esc(sk)} · ${lv[i].name}${lv[i].rusty ? ' ⚠' : ''}</span>`).join('')}</div>${rusty ? '<span class="muted" style="font-size:.8rem">⚠ Some skills are rusty: review to polish them.</span>' : ''}</a>`;
      }).join('')}</div>
      ${Object.keys(s.badges).length ? `<h2 class="section">Latest badges</h2><div class="badges">${LP.BADGES.filter((b) => s.badges[b.id]).slice(-4).map((b) => `<div class="card bdg"><span class="ic">${b.icon}</span><div><b>${esc(b.name)}</b><span class="muted" style="font-size:.82rem">${esc(b.desc)}</span></div></div>`).join('')}</div>` : ''}
    </div>`;
  };

  LP.views.course = function (main, id) {
    const c = LP.course(id);
    if (!c) { main.innerHTML = '<div class="wrap"><p>Course not found. <a href="#/">Back home</a></p></div>'; return; }
    const store = LP.store, p = LP.courseProgress(store, c);
    const nxt = LP.nextInCourse(store, c);
    main.innerHTML = `<div class="wrap" style="--course:${c.color}">
      <div class="crumbs"><a href="#/">Home</a> › ${esc(c.title)}</div>
      <div class="course-head"><div class="emoji">${c.icon}</div><div style="flex:1"><h1 style="margin:0">${esc(c.title)}</h1><p class="muted" style="margin:2px 0 8px">${esc(c.blurb)}</p><div class="bar" style="max-width:420px"><i style="width:${p.pct * 100}%"></i></div><span class="muted" style="font-size:.85rem">${p.done} of ${p.total} lessons · ${p.xp} XP earned · ${esc(LP.paceText(c))}</span></div>${nxt ? `<a class="btn primary" href="#/lesson/${nxt.id}">${p.done ? 'Continue' : 'Start'} →</a>` : '<span class="pill" style="color:var(--ok)">Course complete 🎉</span>'}</div>
      <h2 class="section">Skills</h2>
      <div class="skilltree">${c.skills.map((sk) => { const i = store.skillInfo(c.id, sk); return `<div class="card skill"><div class="name"><span>${esc(sk)}</span><span class="lvl">${i.name}</span></div><div class="bar" style="margin-top:8px"><i style="width:${i.pct * 100}%"></i></div><div class="meta"><span>${Math.round(i.points * 10) / 10} SP${i.next ? ' · ' + Math.ceil(i.toNext) + ' to ' + i.next : ' · max'}</span>${i.rusty ? `<span style="color:var(--warn)">⚠ ${i.rusty} overdue</span>` : ''}</div></div>`; }).join('')}</div>
      <h2 class="section">Lessons</h2>
      <div class="path">${c.lessons.filter((l) => !l.drill).map((l, n) => {
        const r = store.lesson(l.id), isDone = store.isDone(l.id), isNext = nxt && (nxt.id === l.id);
        const ds = LP.drillsOf(c, l.id);
        const dDone = ds.filter((d) => store.isDone(d.id)).length;
        const kindLbl = LP.kindOf(l, c) === 'code' ? 'Code' : LP.kindOf(l, c) === 'file' ? 'Write a file' : 'Terminal';
        return `<div class="node-wrap"><a class="card node ${isDone ? 'done' : ''} ${isNext ? 'next' : ''} ${l.capstone ? 'capstone' : ''}" href="#/lesson/${l.id}"><div class="num">${isDone ? '✓' : l.capstone ? '🏗' : n + 1}</div><div><div class="t">${esc(l.title)}${l.capstone ? ' <span class="pill">Capstone</span>' : ''}</div><div class="s">${esc(l.skill)} · ${kindLbl} · difficulty ${'●'.repeat(l.diff || 1)}${'○'.repeat(3 - (l.diff || 1))}</div></div><div style="text-align:right">${isDone ? LP.stars(r.stars || 0) + `<div class="muted" style="font-size:.78rem">+${r.xp} XP</div>` : `<span class="pill">+${l.xp || 20} XP</span>`}</div></a>${ds.length ? `<div class="drills" aria-label="Practice drills for ${esc(l.title)}"><span class="muted">Optional practice ${dDone}/${ds.length}</span>${ds.map((d, i) => `<a class="dchip ${store.isDone(d.id) ? 'done' : ''} ${nxt && nxt.id === d.id ? 'next' : ''}" href="#/lesson/${d.id}" title="${esc(d.title)}">${store.isDone(d.id) ? '✓' : i + 1}<span class="sr-only"> ${esc(d.title)}</span></a>`).join('')}</div>` : ''}</div>`;
      }).join('')}</div></div>`;
  };

  LP.views.profile = function (main) {
    const store = LP.store, s = store.state, lp = store.levelProgress();
    const done = Object.values(s.lessons).filter((l) => l.done).length;
    const perfect = Object.values(s.lessons).filter((l) => l.perfect).length;
    const acc = s.stats.reviewsTotal ? Math.round((s.stats.reviewsCorrect / s.stats.reviewsTotal) * 100) + '%' : '-';
    const theme = (() => { try { return localStorage.getItem('forge.theme') || 'auto'; } catch (e) { return 'auto'; } })();
    main.innerHTML = `<div class="wrap">
      <h1>Profile</h1>
      <div class="stat-grid">
        ${[['Level', lp.level], ['Title', lp.title], ['Total XP', s.xp], ['Lessons', done], ['Perfect', perfect], ['Best streak', s.streak.best + ' d'], ['Review accuracy', acc], ['Best combo', 'x' + s.stats.bestCombo]].map(([k, v]) => `<div class="card stat"><span class="v">${esc(v)}</span><span class="k">${k}</span></div>`).join('')}
      </div>
      <h2 class="section">Badges</h2>
      <div class="badges">${LP.BADGES.map((b) => `<div class="card bdg ${s.badges[b.id] ? '' : 'locked'}"><span class="ic">${b.icon}</span><div><b>${esc(b.name)}</b><span class="muted" style="font-size:.82rem">${esc(b.desc)}</span></div></div>`).join('')}</div>
      <h2 class="section">Skills</h2>
      <div class="skilltree">${LP.courses.flatMap((c) => c.skills.map((sk) => ({ c, sk, i: store.skillInfo(c.id, sk) }))).map(({ c, sk, i }) => `<div class="card skill" style="--course:${c.color}"><div class="name"><span>${c.icon} ${esc(sk)}</span><span class="lvl">${i.name}</span></div><div class="bar" style="margin-top:8px"><i style="width:${i.pct * 100}%"></i></div><div class="meta"><span>${esc(c.title)}</span><span>${Math.round(i.points * 10) / 10} SP</span></div></div>`).join('')}</div>
      <h2 class="section">Settings</h2>
      <div class="card">
        <div class="form-row"><label for="set-name">Display name</label><input id="set-name" type="text" value="${esc(s.settings.name)}" maxlength="30"></div>
        <div class="form-row"><label for="set-goal">Daily XP goal</label><input id="set-goal" type="number" min="10" max="500" step="10" value="${s.settings.dailyGoal}"></div>
        <div class="form-row"><label for="set-font">Reading size</label><input id="set-font" type="range" min="13" max="20" value="${s.settings.fontSize}"> <span class="muted" id="font-val">${s.settings.fontSize}px</span></div>
        <div class="form-row"><label>Theme</label><div class="row">${['auto', 'light', 'dark'].map((t) => `<button type="button" class="btn small ${theme === t ? 'primary' : ''}" data-theme="${t}">${t[0].toUpperCase() + t.slice(1)}</button>`).join('')}</div></div>
      </div>
      <h2 class="section">Your data</h2>
      <div class="card"><p class="muted" style="margin-top:0">Progress lives in this browser only. Export a backup to move it between devices.</p>
        <div class="row"><button type="button" class="btn" id="exp">⬇ Export progress</button><label class="btn" for="imp" style="cursor:pointer">⬆ Import</label><input id="imp" type="file" accept="application/json" class="sr-only"><button type="button" class="btn ghost" id="reset" style="color:var(--bad)">Reset everything</button></div></div>
    </div>`;
    $('#set-name', main).addEventListener('change', (e) => { store.setSetting('name', e.target.value.trim() || 'Learner'); });
    $('#set-goal', main).addEventListener('change', (e) => { store.setSetting('dailyGoal', Math.max(10, +e.target.value || 60)); LP.refreshHeader(); });
    $('#set-font', main).addEventListener('input', (e) => { store.setSetting('fontSize', +e.target.value); $('#font-val', main).textContent = e.target.value + 'px'; });
    $$('[data-theme]', main).forEach((b) => b.addEventListener('click', () => { LP.setTheme(b.dataset.theme); LP.views.profile(main); }));
    $('#exp', main).addEventListener('click', () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([store.export()], { type: 'application/json' }));
      a.download = 'forge-progress.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
    $('#imp', main).addEventListener('change', (e) => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then((t) => { store.import(t); LP.toast('Progress imported', 'ok'); LP.refreshHeader(); LP.views.profile(main); }).catch((err) => LP.toast('Import failed: ' + err.message, 'bad'));
    });
    $('#reset', main).addEventListener('click', () => {
      const m = LP.modal(`<h2>Reset everything?</h2><p class="muted">This deletes all XP, skill points, streaks, review cards and badges from this browser. Export a backup first if unsure.</p><div class="row" style="justify-content:flex-end"><button class="btn" data-x="no" autofocus>Cancel</button><button class="btn primary" data-x="yes" style="background:var(--bad);border-color:var(--bad)">Delete all progress</button></div>`);
      m.el.addEventListener('click', (e) => { const b = e.target.closest('[data-x]'); if (!b) return; if (b.dataset.x === 'yes') { store.reset(); LP.refreshHeader(); LP.views.profile(main); LP.toast('Progress reset'); } m.close(); });
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);
