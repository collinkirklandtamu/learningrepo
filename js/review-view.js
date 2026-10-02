/* Spaced-repetition review: Leitner boxes, combos and critical hits. */
(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  LP.views = LP.views || {};
  const esc = (s) => LP.esc(String(s));
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const dots = (box) => `<span class="box-dots" title="Leitner box ${box} of 6" aria-label="Box ${box} of 6">${Array.from({ length: 6 }, (_, i) => `<i class="${i < box ? 'on' : ''}"></i>`).join('')}</span>`;
  const cardQ = (id) => {
    const [lid, idx] = id.split('#');
    const f = LP.findLesson(lid);
    return f ? { f, q: f.lesson.recall[+idx], id } : null;
  };

  LP.views.review = function (main) {
    const store = LP.store;
    const due = store.dueCards();
    const all = store.allCards();
    const nextIn = store.nextDueIn();

    function landing() {
      const none = !all.length;
      main.innerHTML = `<div class="review-wrap"><h1>🧠 Review</h1>
        <div class="card" style="margin-bottom:16px">
          <h3 style="margin-top:0">${none ? 'Your review deck is empty' : due.length ? `${due.length} card${due.length === 1 ? '' : 's'} due` : 'You are all caught up ✨'}</h3>
          <p class="muted">${none ? 'Every lesson you finish plants a card here. Complete one and come back.' : due.length ? 'Answer from memory. Right answers move a card to a longer interval; wrong ones go back to box 1.' : (nextIn === null ? '' : nextIn < 3600000 ? `Next card due in ${Math.ceil(nextIn / 60000)} min.` : `Next card due in about ${Math.round(nextIn / 3600000)} h.`)}</p>
          <div class="row">${due.length ? '<button type="button" class="btn primary" id="start">Start review →</button>' : ''}${all.length ? `<button type="button" class="btn ${due.length ? '' : 'primary'}" id="practice">Practice anyway (${Math.min(8, all.length)} random cards, 1 XP each)</button>` : '<a class="btn primary" href="#/">Pick a lesson</a>'}</div>
        </div>
        <div class="card"><h3 style="margin-top:0">How it works</h3>
          <p class="muted" style="margin-top:0">Memory fades unless you retrieve it. Spaced repetition schedules each question right before you would forget it.</p>
          <table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left">Box</th><th style="text-align:left">Review again after</th></tr></thead><tbody>${LP.INTERVALS.slice(1).map((d, i) => `<tr><td>${dots(i + 1)}</td><td>${d} day${d === 1 ? '' : 's'}</td></tr>`).join('')}</tbody></table>
          <ul class="muted"><li>Correct: up one box (longer wait).</li><li>Wrong: back to box 1, retry in 10 minutes.</li><li>Consecutive correct answers build a <b style="color:var(--gold)">combo</b> that boosts XP. Watch for critical hits!</li><li>Skills with long-overdue cards get marked <span class="pill rusty">⚠ rusty</span>.</li></ul></div></div>`;
      const s = main.querySelector('#start'), p = main.querySelector('#practice');
      if (s) s.addEventListener('click', () => session(due.slice(0, 12), false));
      if (p) p.addEventListener('click', () => session(shuffle(all).slice(0, 8), true));
    }

    function session(ids, practice) {
      const items = ids.map(cardQ).filter((x) => x && x.q);
      const st = { i: 0, combo: 0, best: 0, xp: 0, right: 0, total: 0, promoted: 0 };
      const next = () => {
        if (st.i >= items.length) return summary();
        const it = items[st.i];
        const c = it.f.course;
        const card = store.state.srs[it.id];
        main.innerHTML = `<div class="review-wrap" style="--course:${c.color}">
          <div class="row" style="justify-content:space-between;margin-bottom:8px"><a href="#/review" class="muted" style="text-decoration:none">✕ Quit</a><span class="muted">Card ${st.i + 1} of ${items.length}</span></div>
          <div class="bar" style="margin-bottom:14px"><i style="width:${(st.i / items.length) * 100}%"></i></div>
          <div class="combo"><span title="Consecutive correct answers">🔥 ${st.combo}</span><div class="meter"><i style="width:${Math.min(st.combo, 8) / 8 * 100}%"></i></div><span class="x">${practice ? '+1 XP' : '+' + (3 + Math.min(st.combo, 8)) + ' XP'}</span></div>
          <div class="card"><div class="row" style="justify-content:space-between;margin-bottom:6px"><span class="pill">${c.icon} ${esc(c.title)} · ${esc(it.f.lesson.skill)}</span>${card ? dots(card.box) : ''}</div><div id="qhost"></div><div id="after"></div></div></div>`;
        LP.renderQuestion(main.querySelector('#qhost'), it.q, (ok) => {
          const before = card ? card.box : 0;
          const r = store.answerCard(it.id, ok, st.combo, practice);
          st.total++;
          if (ok) { st.right++; st.combo++; st.best = Math.max(st.best, st.combo); st.xp += r.xp; if (r.box > before) st.promoted++; LP.xpPop((r.crit ? 'CRITICAL! ' : '+') + r.xp + ' XP', r.crit, main.querySelector('.combo .x')); }
          else st.combo = 0;
          LP.refreshHeader();
          if (r.levelUp) LP.toast('⬆ Level ' + r.levelUp + '!', 'ok');
          if (r.skillUp) LP.toast('🛠 ' + c.title + ' · ' + it.f.lesson.skill + ' is now ' + r.skillUp + '!', 'ok');
          r.badges.forEach((b) => LP.toast(`${b.icon} Badge: ${b.name}`, 'ok', 4500));
          const after = main.querySelector('#after');
          after.innerHTML = `<div class="row" style="justify-content:space-between;margin-top:12px"><span class="muted">${ok ? (practice ? 'Practice answers do not change the schedule.' : `Moved to box ${r.box}: back in ${r.nextDays} day${r.nextDays === 1 ? '' : 's'}.`) : 'Back to box 1: retry in 10 minutes.'}</span><button type="button" class="btn primary" id="nx" autofocus>${st.i + 1 >= items.length ? 'Finish' : 'Next →'}</button></div>`;
          const nx = after.querySelector('#nx');
          nx.focus();
          nx.addEventListener('click', () => { st.i++; next(); });
        });
      };
      function summary() {
        if (st.best >= 5) LP.confetti();
        const acc = st.total ? Math.round((st.right / st.total) * 100) : 0;
        const ni = store.nextDueIn();
        main.innerHTML = `<div class="review-wrap"><div class="card" style="text-align:center"><h1 style="margin-top:0">${acc === 100 ? 'Flawless! 🏆' : acc >= 70 ? 'Nice work 💪' : 'Keep at it 🌱'}</h1>
          <div class="reward"><div><span class="v">${acc}%</span><span class="k">accuracy</span></div><div><span class="v">+${st.xp}</span><span class="k">XP</span></div><div><span class="v">x${st.best}</span><span class="k">best combo</span></div><div><span class="v">${st.promoted}</span><span class="k">cards promoted</span></div></div>
          <p class="muted">${ni === null ? '' : ni < 3600000 ? 'Next card due in ' + Math.ceil(ni / 60000) + ' min.' : 'Next card due in about ' + Math.round(ni / 3600000) + ' h.'}</p>
          <div class="row" style="justify-content:center"><a class="btn" href="#/">Dashboard</a><a class="btn primary" href="#/review" id="again">Review more</a></div></div></div>`;
        main.querySelector('#again').addEventListener('click', () => setTimeout(() => LP.views.review(main), 0));
      }
      if (!items.length) { LP.toast('Nothing to review yet'); return landing(); }
      next();
    }
    landing();
  };
})(typeof window !== 'undefined' ? window : globalThis);
