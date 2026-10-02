(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  const r = String.raw;
  LP.addLessons('python', [

    {
      id: 'py-testing', title: 'Testing with unittest', skill: 'Reliability', xp: 40, diff: 3,
      read: `
# Code you can trust

A **test** is code that checks other code. Run them constantly: they catch regressions the moment you break something.

~~~python
import unittest

class TestMath(unittest.TestCase):
    def test_add(self):
        self.assertEqual(1 + 1, 2)

    def test_error(self):
        with self.assertRaises(ZeroDivisionError):
            1 / 0

    def test_many_inputs(self):
        for text, expected in [("a", 1), ("bb", 2)]:
            with self.subTest(text=text):           # reports each case separately
                self.assertEqual(len(text), expected)
~~~

Useful assertions: \`assertEqual assertTrue assertIsNone assertIn assertAlmostEqual assertRaises\`. \`setUp\` runs before every test to build fresh fixtures.

## What makes a *good* test suite?

A suite that passes proves little: it must **fail when the code is wrong**. Think of boundaries and the behaviours your function promises: normal input, empty input, extremes, error cases. A trick: **mutation testing** deliberately introduces bugs ("mutants") and checks that your tests notice.

## doctest

Examples in docstrings double as tests: \`>>> double(2)\` followed by \`4\`.

> [!tip] Key idea
> Test behaviour, not implementation. One reason to fail per test; descriptive names (\`test_strips_leading_hyphens\`).
`,
      task: 'A working `slugify(text)` is provided (lowercase, runs of non-alphanumerics become one `-`, no leading/trailing `-`). Write the `TestSlugify` class with **at least 4 test methods** that pass for the real function **and catch three hidden bugs** (a version that forgets to lowercase, one that forgets to collapse repeated separators, one that forgets to trim edge hyphens). Your tests will be run against those broken versions.',
      starter: 'import re\nimport unittest\n\n\ndef slugify(text):\n    text = text.strip().lower()\n    text = re.sub(r"[^a-z0-9]+", "-", text)\n    return text.strip("-")\n\n\nclass TestSlugify(unittest.TestCase):\n    pass\n',
      harness: r`
import io, re, unittest
def run_suite():
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(TestSlugify)
    res = unittest.TextTestRunner(stream=io.StringIO(), verbosity=0).run(suite)
    return suite.countTestCases(), res
good = globals()["slugify"]
n, res = run_suite()
assert n >= 4, f"write at least 4 test methods (found {n})"
assert res.wasSuccessful(), "your tests fail on the CORRECT slugify: " + ((res.failures + res.errors)[0][1].strip().splitlines()[-1] if res.failures + res.errors else "")
def no_lower(text):
    text = text.strip()
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text)
    return text.strip("-")
def no_collapse(text):
    text = text.strip().lower()
    text = re.sub(r"[^a-z0-9]", "-", text)
    return text.strip("-")
def no_trim(text):
    text = text.strip().lower()
    return re.sub(r"[^a-z0-9]+", "-", text)
for name, bug in {"forgets to lowercase": no_lower, "does not collapse repeated separators": no_collapse, "does not trim leading/trailing hyphens": no_trim}.items():
    globals()["slugify"] = bug
    try:
        n2, res2 = run_suite()
    finally:
        globals()["slugify"] = good
    assert not res2.wasSuccessful(), f"your tests did not catch this bug: slugify {name}"
`,
      hints: ['One behaviour per test: lowercase, separators collapse ("a  b" and "a--b"), edges trimmed ("--a--" and " a "), basic words.', 'To catch "no lowercase" assert on an input with capitals: `slugify("Hello World") == "hello-world"`.', 'To catch "no trim" use input that starts/ends with punctuation, e.g. `"!Hi!"`.', 'To catch "no collapse" use input with repeated separators, e.g. `"a   b"` or `"a, b"`.'],
      solution: 'import re\nimport unittest\n\n\ndef slugify(text):\n    text = text.strip().lower()\n    text = re.sub(r"[^a-z0-9]+", "-", text)\n    return text.strip("-")\n\n\nclass TestSlugify(unittest.TestCase):\n    def test_basic(self):\n        self.assertEqual(slugify("hello world"), "hello-world")\n\n    def test_lowercases(self):\n        self.assertEqual(slugify("Hello WORLD"), "hello-world")\n\n    def test_collapses_repeated_separators(self):\n        self.assertEqual(slugify("a   b"), "a-b")\n        self.assertEqual(slugify("a, b"), "a-b")\n\n    def test_trims_edges(self):\n        self.assertEqual(slugify("  !Hi! "), "hi")\n        self.assertEqual(slugify("--a--"), "a")\n\n    def test_keeps_digits(self):\n        self.assertEqual(slugify("Python 3 rocks"), "python-3-rocks")\n\n    def test_empty(self):\n        self.assertEqual(slugify(""), "")',
      recall: [
        { type: 'choice', q: 'Why is a passing test suite not enough on its own?', options: ['It might not fail when the code is wrong (weak assertions)', 'Passing tests are slow', 'Tests never prove anything', 'It must also be fast'], answer: 0, why: 'A test only has value if it can fail. Mutation testing checks that.' },
        { type: 'choice', q: 'What does `self.assertRaises(ValueError)` as a context manager check?', options: ['That the block raises ValueError', 'That no error occurs', 'That the error message is empty', 'That ValueError exists'], answer: 0, why: 'The test fails if the block does not raise it.' },
        { type: 'choice', q: 'What is `setUp` for?', options: ['Install packages', 'Build fresh fixtures before every test method', 'Run once after all tests', 'Skip tests'], answer: 1, why: 'Each test starts from the same clean state.' },

      ],
    },

  ]);

  LP.addDrills({

    'py-testing': [
      { title: 'Test a stack', task: 'A correct `Stack` class is provided. Write `TestStack` (4+ tests) that passes for it and catches three hidden bugs: `pop` removing from the wrong end, `size` off by one, and `peek` removing the item.', starter: 'import unittest\n\n\nclass Stack:\n    def __init__(self):\n        self.items = []\n\n    def push(self, x):\n        self.items.append(x)\n\n    def pop(self):\n        return self.items.pop()\n\n    def peek(self):\n        return self.items[-1]\n\n    def size(self):\n        return len(self.items)\n\n\nclass TestStack(unittest.TestCase):\n    pass\n', harness: r`
import io, unittest
def run_suite():
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(TestStack)
    return suite.countTestCases(), unittest.TextTestRunner(stream=io.StringIO()).run(suite)
n, res = run_suite()
assert n >= 4, f"write at least 4 tests (found {n})"
assert res.wasSuccessful(), "tests fail on the correct Stack"
good = globals()["Stack"]
class PopFront(good):
    def pop(self): return self.items.pop(0)
class SizeOff(good):
    def size(self): return len(self.items) + 1
class PeekPops(good):
    def peek(self): return self.items.pop()
for name, bug in {"pop from the wrong end": PopFront, "size off by one": SizeOff, "peek removes the item": PeekPops}.items():
    globals()["Stack"] = bug
    try:
        _, r2 = run_suite()
    finally:
        globals()["Stack"] = good
    assert not r2.wasSuccessful(), f"your tests did not catch: {name}"
`, hints: ['Push 1, 2, 3 and assert `pop()` returns 3 (LIFO).', 'After `peek()`, assert `size()` is unchanged.', 'Assert `size()` on an empty stack is 0 and after two pushes is 2.'], solution: 'import unittest\n\n\nclass Stack:\n    def __init__(self):\n        self.items = []\n\n    def push(self, x):\n        self.items.append(x)\n\n    def pop(self):\n        return self.items.pop()\n\n    def peek(self):\n        return self.items[-1]\n\n    def size(self):\n        return len(self.items)\n\n\nclass TestStack(unittest.TestCase):\n    def test_lifo(self):\n        s = Stack()\n        for i in (1, 2, 3):\n            s.push(i)\n        self.assertEqual([s.pop(), s.pop(), s.pop()], [3, 2, 1])\n\n    def test_size(self):\n        s = Stack()\n        self.assertEqual(s.size(), 0)\n        s.push(1)\n        s.push(2)\n        self.assertEqual(s.size(), 2)\n\n    def test_peek_does_not_remove(self):\n        s = Stack()\n        s.push("a")\n        self.assertEqual(s.peek(), "a")\n        self.assertEqual(s.size(), 1)\n\n    def test_pop_empty_raises(self):\n        with self.assertRaises(IndexError):\n            Stack().pop()' },

    ],

    
  });
})(typeof window !== 'undefined' ? window : globalThis);
