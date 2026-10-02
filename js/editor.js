/* Code editor wrapper: CodeMirror 5 when its CDN script loaded, otherwise a
 * plain <textarea> with the same tiny API. */
(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  const MODES = { python: 'python', r: 'r', yaml: 'yaml', dockerfile: 'dockerfile', bash: 'shell' };

  LP.createEditor = function (host, opts) {
    const lang = opts.lang || 'text';
    const indent = lang === 'yaml' || lang === 'r' || lang === 'dockerfile' ? 2 : 4;
    const handlers = { change: opts.onChange || (() => {}), run: opts.onRun || (() => {}), submit: opts.onSubmit || (() => {}) };
    if (root.CodeMirror) {
      const cm = root.CodeMirror(host, {
        value: opts.value || '', mode: MODES[lang] || null, theme: 'forge', lineNumbers: true, indentUnit: indent, tabSize: indent,
        indentWithTabs: false, lineWrapping: false, autofocus: false, styleActiveLine: false,
        extraKeys: {
          'Ctrl-Enter': () => handlers.run(), 'Cmd-Enter': () => handlers.run(),
          'Shift-Ctrl-Enter': () => handlers.submit(), 'Shift-Cmd-Enter': () => handlers.submit(),
          Tab: (c) => { if (c.somethingSelected()) c.indentSelected('add'); else c.replaceSelection(' '.repeat(indent), 'end'); },
          'Shift-Tab': (c) => c.indentSelected('subtract'),
        },
      });
      cm.on('change', () => handlers.change(cm.getValue()));
      return { getValue: () => cm.getValue(), setValue: (v) => cm.setValue(v), focus: () => cm.focus(), refresh: () => cm.refresh(), destroy: () => { host.innerHTML = ''; } };
    }
    const ta = document.createElement('textarea');
    ta.className = 'fallback'; ta.spellcheck = false; ta.value = opts.value || '';
    ta.setAttribute('aria-label', 'Code editor'); ta.setAttribute('autocapitalize', 'off'); ta.setAttribute('autocorrect', 'off');
    ta.addEventListener('input', () => handlers.change(ta.value));
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); (e.shiftKey ? handlers.submit : handlers.run)(); return; }
      if (e.key === 'Tab') {
        e.preventDefault();
        const s = ta.selectionStart, en = ta.selectionEnd, pad = ' '.repeat(indent);
        ta.value = ta.value.slice(0, s) + pad + ta.value.slice(en);
        ta.selectionStart = ta.selectionEnd = s + indent;
        handlers.change(ta.value);
      }
    });
    host.appendChild(ta);
    return { getValue: () => ta.value, setValue: (v) => { ta.value = v; }, focus: () => ta.focus(), refresh() {}, destroy: () => { host.innerHTML = ''; } };
  };
  if (typeof module !== 'undefined') module.exports = LP;
})(typeof window !== 'undefined' ? window : globalThis);
