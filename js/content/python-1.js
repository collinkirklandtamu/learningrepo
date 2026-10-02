(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  const r = String.raw;
  LP.addLessons('python', [
    {
      id: 'py-strings', title: 'Strings in depth', skill: 'Strings', xp: 25, diff: 2,
      read: `
# Working with text

Strings are **sequences of characters**: you can index and slice them exactly like lists, but they are **immutable** (every "change" builds a new string).

~~~python
s = "  Hello, World  "
s.strip()              # 'Hello, World'
s.strip().lower()      # 'hello, world'
"a,b,c".split(",")     # ['a', 'b', 'c']
"-".join(["a", "b"])   # 'a-b'
"hello"[1:4]           # 'ell'
"hello"[::-1]          # 'olleh'  (step -1 reverses)
~~~

Handy methods: \`.upper() .title() .replace(old, new) .find(sub) .count(sub) .startswith() .endswith() .isdigit() .isalpha() .isalnum()\`. The \`in\` operator tests for substrings: \`"ell" in "hello"\`.

## Formatting numbers

~~~python
f"{3.14159:.2f}"   # '3.14'
f"{1234567:,}"     # '1,234,567'
f"{'hi':>6}"       # '    hi'  right-align in width 6
f"{7:03d}"         # '007'
~~~

> [!warn] Strings never change in place
> \`s.upper()\` returns a **new** string. Writing just \`s.upper()\` on its own line does nothing useful: assign the result.
`,
      task: 'Write `clean_title(raw)` (strip, collapse inner whitespace to single spaces, Title Case), `mask(card)` (replace all but the last 4 characters with `*`) and `is_palindrome(s)` (ignore case and anything that is not a letter or digit).',
      starter: 'def clean_title(raw):\n    pass\n\n\ndef mask(card):\n    pass\n\n\ndef is_palindrome(s):\n    pass\n',
      harness: r`
assert clean_title("  the   quick  brown fox ") == "The Quick Brown Fox", f"got {clean_title('  the   quick  brown fox ')!r}"
assert clean_title("PYTHON") == "Python", "title-case should lower the rest"
assert mask("1234567812345678") == "************5678", f"got {mask('1234567812345678')!r}"
assert mask("1234") == "1234", "nothing to mask when length <= 4"
assert is_palindrome("A man, a plan, a canal: Panama") is True, "punctuation and case are ignored"
assert is_palindrome("hello") is False
assert is_palindrome("") is True
`,
      hints: ['Whitespace trick: `" ".join(raw.split())` splits on any run of whitespace.', 'Then `.title()`.', '`"*" * (len(card) - 4) + card[-4:]`, but watch short cards (`max(0, ...)`).', 'Build `clean = [ch.lower() for ch in s if ch.isalnum()]` and compare with its reverse.'],
      solution: 'def clean_title(raw):\n    return " ".join(raw.split()).title()\n\n\ndef mask(card):\n    return "*" * max(0, len(card) - 4) + card[-4:]\n\n\ndef is_palindrome(s):\n    clean = [ch.lower() for ch in s if ch.isalnum()]\n    return clean == clean[::-1]',
      recall: [
        { type: 'choice', q: 'What is `"hello"[1:4]`?', options: ['"hel"', '"ell"', '"ello"', '"hell"'], answer: 1, why: 'Index 1 is "e"; the slice stops before index 4, giving "ell".' },
        { type: 'choice', q: 'After `s = "abc"` and `s.upper()` on its own line, what is `s`?', options: ['"ABC"', '"abc"', 'An error', 'None'], answer: 1, why: 'Strings are immutable. `upper()` returns a new string that you must assign.' },
        { type: 'choice', q: 'What does `"{:,}".format(1234567)` give?', options: ['1234567', '1,234,567', '1.234.567', '1 234 567'], answer: 1, why: 'The `,` format option inserts thousands separators.' },

      ],
    },

    
    
  ]);

  // ---------------- drills ----------------
  LP.addDrills({
    'py-strings': [
      { title: 'Initials', task: 'Write `initials(name)`: `"ada lovelace"` -> `"A.L."`, `"alan mathison turing"` -> `"A.M.T."`.', starter: 'def initials(name):\n    pass\n', harness: r`
assert initials("ada lovelace") == "A.L.", f"got {initials('ada lovelace')!r}"
assert initials("alan mathison turing") == "A.M.T."
assert initials("  grace   hopper ") == "G.H."
assert initials("plato") == "P."
`, hints: ['`name.split()` handles extra spaces; take `w[0].upper()` of each word.'], solution: 'def initials(name):\n    return "".join(w[0].upper() + "." for w in name.split())' },

    ],

    
    
  });
})(typeof window !== 'undefined' ? window : globalThis);
