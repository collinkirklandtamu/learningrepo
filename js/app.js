/* App shell: header, theme, hash router. */
(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  const esc = (s) => LP.esc(String(s));
  const safeStorage = () => { try { const s = root.localStorage; s.getItem('x'); return s; } catch (e) { return null; } };

  LP.setTheme = (t) => {
    try { localStorage.setItem('forge.theme', t); } catch (e) { /* ignore */ }
    if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.dataset.theme = t;
  };
  LP.refreshHeader = () => {
    const store = LP.store, el = document.getElementById('chips');
    if (!el) return;
    const lp = store.levelProgress(), today = store.today(), goal = store.state.settings.dailyGoal;
    const due = store.dueCards().length;
    el.innerHTML = `<span class="chip" title="Daily streak">🔥 ${store.streakNow()}</span><span class="chip" title="Level ${lp.level}: ${esc(lp.title)}">⭐ <span>Lv ${lp.level}</span><span class="lvl-bar" role="progressbar" aria-valuenow="${Math.round(lp.pct * 100)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${lp.pct * 100}%"></i></span></span><span class="chip hide-sm" title="XP earned today vs your daily goal">${today.xp}<small>/ ${goal} XP today</small></span>`;
    const badge = document.getElementById('due-badge');
    if (badge) { badge.textContent = due; badge.hidden = !due; }
    document.documentElement.style.setProperty('--fs', store.state.settings.fontSize + 'px');
  };

  function route() {
    const main = document.getElementById('main');
    const hash = location.hash.replace(/^#\/?/, '');
    const [view, arg] = hash.split('/');
    const name = view || 'dashboard';
    document.querySelectorAll('.nav a').forEach((a) => { if (a.dataset.nav === (name === 'lesson' || name === 'course' ? 'dashboard' : name)) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    root.scrollTo(0, 0);
    try {
      if (name === 'dashboard') { document.title = 'Forge: learn by doing'; LP.views.dashboard(main); }
      else if (name === 'course') { const c = LP.course(arg); document.title = (c ? c.title : 'Course') + ' · Forge'; LP.views.course(main, arg); }
      else if (name === 'lesson') { const f = LP.findLesson(arg); document.title = (f ? f.lesson.title : 'Lesson') + ' · Forge'; LP.views.lesson(main, arg); }
      else if (name === 'review') { document.title = 'Review · Forge'; LP.views.review(main); }
      else if (name === 'profile') { document.title = 'Profile · Forge'; LP.views.profile(main); }
      else { location.hash = '#/'; return; }
    } catch (e) {
      console.error(e);
      main.innerHTML = `<div class="wrap"><div class="card"><h2>Something went wrong</h2><p class="muted">${esc(e.message)}</p><a class="btn" href="#/">Back home</a></div></div>`;
    }
    LP.refreshHeader();
    const h1 = main.querySelector('h1');
    if (h1) { h1.setAttribute('tabindex', '-1'); }
  }

  document.addEventListener('DOMContentLoaded', () => {
    LP.store = LP.createStore(safeStorage());
    try { const t = localStorage.getItem('forge.theme'); if (t && t !== 'auto') document.documentElement.dataset.theme = t; } catch (e) { /* ignore */ }
    document.getElementById('app').innerHTML = `<header class="topbar"><a class="brand" href="#/"><span class="logo">⚒</span><span class="name">Forge</span></a>
      <nav class="nav" aria-label="Main"><a href="#/" data-nav="dashboard">Learn</a><a href="#/review" data-nav="review">Review<span class="badge-dot" id="due-badge" hidden>0</span></a><a href="#/profile" data-nav="profile">Profile</a></nav>
      <span class="spacer"></span><div class="chips" id="chips"></div></header><main id="main"></main>`;
    LP.store.subscribe(() => LP.refreshHeader());
    root.addEventListener('hashchange', route);
    route();
  });
})(typeof window !== 'undefined' ? window : globalThis);
