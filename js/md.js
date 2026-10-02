/* Tiny markdown renderer: headings, paragraphs, lists, tables, fenced code,
 * callouts (> [!tip] / [!warn]) and inline code/bold/italic/links. */
(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function inline(raw) {
    const codes = [];
    let s = esc(raw).replace(/`([^`]+)`/g, (m, c) => { codes.push(c); return '\u0000' + (codes.length - 1) + '\u0000'; });
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?![*\w])/g, '$1<em>$2</em>');
    s = s.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    return s.replace(/\u0000(\d+)\u0000/g, (m, i) => '<code>' + codes[i] + '</code>');
  }

  const TRY = { python: 1, r: 1 };
  function codeBlock(lang, lines) {
    const body = esc(lines.join('\n'));
    const l = (lang || '').toLowerCase();
    let acts = '';
    if (l) {
      acts += '<button type="button" data-act="copy">Copy</button>';
      if (TRY[l]) acts += '<button type="button" data-act="try">▶ Try it</button>';
      if (l === 'bash' || l === 'sh' || l === 'shell') acts += '<button type="button" data-act="paste">⏎ Paste next</button>';
    }
    return `<div class="code" data-lang="${esc(l)}"><div class="code-head"><span>${esc(l || 'text')}</span><span class="acts">${acts}</span></div><pre><code>${body}</code></pre></div>`;
  }

  function render(src) {
    const lines = String(src).replace(/\r/g, '').trim().split('\n');
    const out = [];
    let i = 0;
    const isBlockStart = (ln) => /^(```|~~~|#{1,3}\s|>|\s*[-*]\s|\s*\d+\.\s|\|)/.test(ln);
    while (i < lines.length) {
      const ln = lines[i];
      if (!ln.trim()) { i++; continue; }
      let m;
      if ((m = /^(```|~~~)\s*([\w+-]*)/.exec(ln))) {
        const fence = m[1], buf = [];
        i++;
        while (i < lines.length && !lines[i].startsWith(fence)) buf.push(lines[i++]);
        i++;
        out.push(codeBlock(m[2], buf));
      } else if ((m = /^(#{1,3})\s+(.*)$/.exec(ln))) {
        out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`);
        i++;
      } else if (/^\|/.test(ln) && /^\|[\s:|-]+\|?\s*$/.test(lines[i + 1] || '')) {
        const cells = (r) => r.replace(/^\||\|\s*$/g, '').split('|').map((c) => c.trim());
        const head = cells(ln);
        i += 2;
        const rows = [];
        while (i < lines.length && /^\|/.test(lines[i])) rows.push(cells(lines[i++]));
        out.push(`<table><thead><tr>${head.map((h) => `<th>${inline(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
      } else if (/^>/.test(ln)) {
        const buf = [];
        while (i < lines.length && /^>/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
        const tag = /^\[!(tip|warn)\]\s*(.*)$/i.exec(buf[0]);
        if (tag) {
          const kind = tag[1].toLowerCase();
          const title = tag[2] || (kind === 'warn' ? 'Careful' : 'Tip');
          out.push(`<div class="callout ${kind}"><span class="ct">${kind === 'warn' ? '⚠ ' : '💡 '}${inline(title)}</span>${render(buf.slice(1).join('\n'))}</div>`);
        } else out.push(`<blockquote>${render(buf.join('\n'))}</blockquote>`);
      } else if (/^\s*([-*])\s/.test(ln) || /^\s*\d+\.\s/.test(ln)) {
        const ordered = /^\s*\d+\.\s/.test(ln);
        const items = [];
        while (i < lines.length && (ordered ? /^\s*\d+\.\s/.test(lines[i]) : /^\s*[-*]\s/.test(lines[i]))) {
          items.push(lines[i++].replace(ordered ? /^\s*\d+\.\s+/ : /^\s*[-*]\s+/, ''));
        }
        const tag = ordered ? 'ol' : 'ul';
        out.push(`<${tag}>${items.map((t) => `<li>${inline(t)}</li>`).join('')}</${tag}>`);
      } else {
        const buf = [];
        while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) buf.push(lines[i++]);
        if (!buf.length) { buf.push(lines[i++]); }
        out.push(`<p>${inline(buf.join(' '))}</p>`);
      }
    }
    return out.join('\n');
  }
  LP.md = render;
  LP.mdInline = inline;
  LP.esc = esc;
  if (typeof module !== 'undefined') module.exports = LP;
})(typeof window !== 'undefined' ? window : globalThis);
