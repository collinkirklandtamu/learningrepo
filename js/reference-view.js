/* Searchable function / command reference. Data: LP.reference[lang] = [{ name, sig, desc, ex, out, lesson, group }]. */
(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  LP.views = LP.views || {};
  const esc = (s) => LP.esc(String(s));
  const TABS = [['python', 'Python'], ['r', 'R'], ['git', 'Git & gh'], ['docker', 'Docker']];
  const PAGE = 40;

  // entries matching a query (name matches rank first)
  LP.searchReference = function (lang, q) {
    const list = (LP.reference && LP.reference[lang]) || [];
    const needle = String(q || '').trim().toLowerCase();
    if (!needle) return list;
    const score = (e) => {
      const n = e.name.toLowerCase();
      if (n === needle) return 0;
      if (n.startsWith(needle)) return 1;
      if (n.includes(needle)) return 2;
      if ((e.sig || '').toLowerCase().includes(needle) || (e.group || '').toLowerCase().includes(needle)) return 3;
      if ((e.desc || '').toLowerCase().includes(needle)) return 4;
      return 9;
    };
    return list.map((e) => [score(e), e]).filter((x) => x[0] < 9).sort((a, b) => a[0] - b[0] || a[1].name.localeCompare(b[1].name)).map((x) => x[1]);
  };

  LP.views.reference = function (main, arg) {
    const store = LP.store;
    const tab = TABS.some((t) => t[0] === arg) ? arg : 'python';
    let q = '', shown = PAGE;
    const total = (l) => ((LP.reference && LP.reference[l]) || []).length;

    function entry(e) {
      const learned = e.lesson && store && store.isDone(e.lesson);
      const lf = e.lesson ? LP.findLesson(e.lesson) : null;
      const code = e.ex ? `<pre class="ref-ex"><code>${esc(e.ex)}</code></pre>${e.out ? `<pre class="ref-out" aria-label="Output"><code>${esc(e.out)}</code></pre>` : ''}` : '';
      return `<details class="ref-item"><summary><code class="ref-name">${esc(e.name)}</code><span class="ref-desc">${esc(e.desc)}</span>${e.group ? `<span class="ref-group">${esc(e.group)}</span>` : ''}${learned ? '<span class="ref-learned" title="You finished the lesson that teaches this">✓</span>' : ''}${e.sandbox === false ? '<span class="ref-group" title="Not available in the Forge sandbox">real tool only</span>' : ''}</summary>
        <div class="ref-body">${e.sig ? `<p class="ref-sig"><code>${esc(e.sig)}</code></p>` : ''}${code}${lf ? `<p class="ref-link"><a href="#/lesson/${esc(lf.lesson.id)}">Learn it: ${esc(lf.lesson.title)} →</a></p>` : ''}</div></details>`;
    }

    function paint() {
      const res = LP.searchReference(tab, q);
      const list = res.slice(0, shown);
      main.querySelector('#ref-list').innerHTML = list.length ? list.map(entry).join('') : '<p class="muted">Nothing matches. Try a shorter word, or another tab.</p>';
      const more = main.querySelector('#ref-more');
      more.hidden = res.length <= shown;
      more.textContent = `Show more (${res.length - shown} left)`;
      main.querySelector('#ref-count').textContent = `${res.length} of ${total(tab)} entries`;
    }

    main.innerHTML = `<div class="ref-wrap"><h1>📚 Reference</h1>
      <p class="muted" style="margin-top:-4px">Look up what a function or command does, with a runnable example. Examples are verified by the test suite.</p>
      <div class="ref-tabs" role="tablist">${TABS.map((t) => `<a role="tab" href="#/reference/${t[0]}" ${t[0] === tab ? 'aria-selected="true"' : ''}>${t[1]} <span class="muted">${total(t[0])}</span></a>`).join('')}</div>
      <div class="ref-search"><input id="ref-q" type="search" placeholder="Search ${esc((TABS.find((t) => t[0] === tab) || [])[1] || '')} (try: sort, split, merge, volume)" aria-label="Search the reference" autocomplete="off"><span id="ref-count" class="muted"></span></div>
      <div id="ref-list"></div><button type="button" class="btn" id="ref-more" hidden></button></div>`;
    const input = main.querySelector('#ref-q');
    input.addEventListener('input', () => { q = input.value; shown = PAGE; paint(); });
    main.querySelector('#ref-more').addEventListener('click', () => { shown += PAGE * 2; paint(); });
    paint();
    if (!LP.__refNoFocus) input.focus();
  };
})(typeof window !== 'undefined' ? window : globalThis);
