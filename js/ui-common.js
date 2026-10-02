/* Shared UI helpers: DOM, toasts, modal, confetti, XP pops, question widget. */
(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  const esc = (s) => LP.esc(String(s));
  LP.$ = (sel, el) => (el || document).querySelector(sel);
  LP.$$ = (sel, el) => [...(el || document).querySelectorAll(sel)];
  LP.h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  LP.stars = (n, max) => { max = max || 3; return `<span class="stars" aria-label="${n} of ${max} stars">${'★'.repeat(n)}<span class="off">${'★'.repeat(max - n)}</span></span>`; };
  LP.drafts = {
    get(id) { try { return localStorage.getItem('forge.draft.' + id); } catch (e) { return null; } },
    set(id, v) { try { localStorage.setItem('forge.draft.' + id, v); } catch (e) { /* ignore */ } },
    clear(id) { try { localStorage.removeItem('forge.draft.' + id); } catch (e) { /* ignore */ } },
  };

  LP.toast = (msg, kind, ms) => {
    const host = document.getElementById('toasts');
    if (!host) return;
    const t = LP.h(`<div class="toast ${kind || ''}" role="status">${esc(msg)}</div>`);
    host.appendChild(t);
    setTimeout(() => t.remove(), ms || 3200);
  };

  LP.modal = (html, opts) => {
    opts = opts || {};
    const ov = LP.h(`<div class="overlay"><div class="modal ${opts.wide ? 'wide' : ''}" role="dialog" aria-modal="true"></div></div>`);
    const box = ov.firstElementChild;
    if (typeof html === 'string') box.innerHTML = html; else box.appendChild(html);
    const prev = document.activeElement;
    const api = {
      el: box,
      set(h) { box.innerHTML = h; },
      close() { ov.remove(); document.removeEventListener('keydown', onKey); if (prev && prev.focus) prev.focus(); opts.onClose && opts.onClose(); },
    };
    const onKey = (e) => { if (e.key === 'Escape' && !opts.sticky) api.close(); };
    document.addEventListener('keydown', onKey);
    if (!opts.sticky) ov.addEventListener('mousedown', (e) => { if (e.target === ov) api.close(); });
    document.body.appendChild(ov);
    const first = box.querySelector('[autofocus], button, input, textarea');
    if (first) first.focus();
    return api;
  };

  LP.confetti = () => {
    if (root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cv = document.createElement('canvas');
    cv.className = 'confetti';
    document.body.appendChild(cv);
    const ctx = cv.getContext('2d');
    const W = (cv.width = root.innerWidth), Hh = (cv.height = root.innerHeight);
    const cols = ['#e9b949', '#b5303f', '#3fb97b', '#7cc4ff', '#c9a3f5', '#ff8a5c'];
    const ps = Array.from({ length: 140 }, () => ({ x: W / 2 + (Math.random() - 0.5) * 120, y: Hh * 0.35, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 14 - 4, r: Math.random() * 6 + 3, c: cols[(Math.random() * cols.length) | 0], a: Math.random() * 6, va: (Math.random() - 0.5) * 0.4 }));
    let f = 0;
    (function tick() {
      ctx.clearRect(0, 0, W, Hh);
      for (const p of ps) { p.vy += 0.38; p.x += p.vx; p.y += p.vy; p.a += p.va; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); ctx.restore(); }
      if (++f < 120) requestAnimationFrame(tick); else cv.remove();
    })();
  };

  LP.xpPop = (text, crit, anchor) => {
    const r = anchor ? anchor.getBoundingClientRect() : { left: root.innerWidth / 2, top: root.innerHeight / 3, width: 0 };
    const el = LP.h(`<div class="xp-pop ${crit ? 'crit' : ''}">${esc(text)}</div>`);
    el.style.left = r.left + r.width / 2 - 20 + 'px';
    el.style.top = r.top - 10 + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  };

  const norm = (s) => String(s).toLowerCase().trim().replace(/^["'`]+|["'`.]+$/g, '').replace(/\s+/g, ' ');
  LP.checkAnswer = (q, value) => {
    if (q.type === 'choice') return value === q.answer;
    const v = norm(value);
    return q.accept.some((a) => norm(a) === v);
  };

  /* Render a question into `host`. onAnswered(correct) fires once. Returns nothing. */
  LP.renderQuestion = (host, q, onAnswered) => {
    host.innerHTML = `<div class="q md">${LP.md(q.q)}</div>`;
    let answered = false;
    const finish = (ok, node) => {
      if (answered) return;
      answered = true;
      const fb = LP.h(`<div class="feedback ${ok ? 'ok' : 'bad'}" role="status"><b>${ok ? '✓ Correct.' : '✗ Not quite.'}</b> ${LP.mdInline(q.why || '')}${!ok && q.type === 'type' ? `<br>Answer: <code>${esc(q.accept[0])}</code>` : ''}</div>`);
      host.appendChild(fb);
      onAnswered(ok);
      return node;
    };
    if (q.type === 'choice') {
      const opts = LP.h('<div class="opts"></div>');
      q.options.forEach((o, i) => {
        const b = LP.h(`<button type="button" class="opt">${LP.mdInline(o)}</button>`);
        b.addEventListener('click', () => {
          if (answered) return;
          const ok = i === q.answer;
          b.classList.add(ok ? 'right' : 'wrong');
          if (!ok) opts.children[q.answer].classList.add('right');
          [...opts.children].forEach((x) => { x.disabled = true; });
          finish(ok);
        });
        opts.appendChild(b);
      });
      host.appendChild(opts);
    } else {
      const box = LP.h('<div class="typebox"><input type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Your answer" placeholder="Type your answer"><button type="button" class="btn primary">Check</button></div>');
      const input = box.querySelector('input'), btn = box.querySelector('button');
      const go = () => { if (answered || !input.value.trim()) return; const ok = LP.checkAnswer(q, input.value); input.disabled = true; btn.disabled = true; input.style.borderColor = ok ? 'var(--ok)' : 'var(--bad)'; finish(ok); };
      btn.addEventListener('click', go);
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
      host.appendChild(box);
      input.focus();
    }
  };
  if (typeof module !== 'undefined') module.exports = LP;
})(typeof window !== 'undefined' ? window : globalThis);
