(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  const r = String.raw;

  LP.addDrills({
    'py-hello': [
      { title: 'Two lines', task: 'Print `Hello` on one line and `World` on the next, using two `print` calls.', starter: '# two print calls\n', harness: r`assert _out == "Hello\nWorld\n", f"Expected two lines, got {_out!r}"`, hints: ['Each `print` adds its own newline.'], solution: 'print("Hello")\nprint("World")' },

    ],
    'py-variables': [
      { title: 'Swap', task: '`a` is 3 and `b` is 7. Swap their values (so `a == 7`, `b == 3`), then print `a=7 b=3` with an f-string.', starter: 'a = 3\nb = 7\n# swap them, then print\n', harness: r`
assert (a, b) == (7, 3), f"a and b should be swapped, got {(a, b)}"
assert _out.strip() == "a=7 b=3", f"got {_out.strip()!r}"
`, hints: ['`a, b = b, a`'], solution: 'a = 3\nb = 7\na, b = b, a\nprint(f"a={a} b={b}")' },

    ],
    
    'py-functions': [
      { title: 'Area', task: 'Write `area(w, h=None)`: a rectangle `w x h`, or a square when `h` is omitted.', starter: 'def area(w, h=None):\n    pass\n', harness: r`
assert area(3, 4) == 12 and area(5) == 25 and area(2, 0) == 0
`, hints: ['`if h is None: h = w` (note `h=0` is a real value, so test `is None`).'], solution: 'def area(w, h=None):\n    if h is None:\n        h = w\n    return w * h' },

    ],
    'py-conditions': [
      { title: 'Sign', task: 'Write `sign(n)` returning `-1`, `0` or `1`.', starter: 'def sign(n):\n    pass\n', harness: r`assert (sign(-5), sign(0), sign(9)) == (-1, 0, 1)`, hints: ['Use if / elif / else.'], solution: 'def sign(n):\n    if n < 0:\n        return -1\n    elif n > 0:\n        return 1\n    return 0' },

    ],
    'py-loops': [
      { title: 'Count vowels', task: 'Write `count_vowels(s)` (a, e, i, o, u, any case).', starter: 'def count_vowels(s):\n    pass\n', harness: r`assert count_vowels("Hello World") == 3 and count_vowels("xyz") == 0 and count_vowels("AEIOU") == 5`, hints: ['Loop over the string and test `ch.lower() in "aeiou"`.'], solution: 'def count_vowels(s):\n    total = 0\n    for ch in s:\n        if ch.lower() in "aeiou":\n            total += 1\n    return total' },

    ],
    'py-lists': [
      { title: 'Rotate', task: 'Write `rotate(xs, k)` returning a new list rotated right by k places (`[1,2,3,4,5], 2` -> `[4,5,1,2,3]`). k may exceed the length.', starter: 'def rotate(xs, k):\n    pass\n', harness: r`
assert rotate([1, 2, 3, 4, 5], 2) == [4, 5, 1, 2, 3] and rotate([1, 2, 3], 4) == [3, 1, 2] and rotate([], 3) == [] and rotate([1, 2], 0) == [1, 2]
`, hints: ['Reduce k with `%` first; then slice: `xs[-k:] + xs[:-k]` (careful when k is 0).'], solution: 'def rotate(xs, k):\n    if not xs:\n        return []\n    k %= len(xs)\n    return xs[len(xs) - k:] + xs[:len(xs) - k]' },

    ],
    'py-dicts': [
      { title: 'Group by length', task: 'Write `group_by_len(words)` returning `{length: [words...]}` in input order.', starter: 'def group_by_len(words):\n    pass\n', harness: r`
assert group_by_len(["a", "bb", "c", "dd", "eee"]) == {1: ["a", "c"], 2: ["bb", "dd"], 3: ["eee"]} and group_by_len([]) == {}
`, hints: ['`groups.setdefault(len(w), []).append(w)`'], solution: 'def group_by_len(words):\n    groups = {}\n    for w in words:\n        groups.setdefault(len(w), []).append(w)\n    return groups' },

    ],
    'py-errors': [
      { title: 'Parse age', task: 'Write `parse_age(s)` returning an int, raising `ValueError("Age must be 0-150")` for anything non-numeric or outside 0-150.', starter: 'def parse_age(s):\n    pass\n', harness: r`
assert parse_age("42") == 42 and parse_age("0") == 0 and parse_age("150") == 150
for bad in ["-1", "151", "abc", ""]:
    try:
        parse_age(bad)
    except ValueError as e:
        assert str(e) == "Age must be 0-150", f"wrong message for {bad!r}: {e}"
    else:
        raise AssertionError(f"{bad!r} should raise ValueError")
`, hints: ['Wrap `int(s)` in try/except ValueError and raise your own message.'], solution: 'def parse_age(s):\n    try:\n        n = int(s)\n    except ValueError:\n        raise ValueError("Age must be 0-150")\n    if not 0 <= n <= 150:\n        raise ValueError("Age must be 0-150")\n    return n' },

    ],
    'py-classes': [
      { title: 'Rectangle', task: 'Create `class Rectangle` with `w`, `h`, methods `area()` and `perimeter()`.', starter: 'class Rectangle:\n    pass\n', harness: r`
r = Rectangle(3, 4)
assert r.area() == 12 and r.perimeter() == 14 and (r.w, r.h) == (3, 4)
assert Rectangle(1, 1).area() == 1
`, hints: ['Store both in `__init__`.'], solution: 'class Rectangle:\n    def __init__(self, w, h):\n        self.w = w\n        self.h = h\n\n    def area(self):\n        return self.w * self.h\n\n    def perimeter(self):\n        return 2 * (self.w + self.h)' },

    ],
  });

  LP.addRecall({
    'py-hello': [
      { type: 'choice', q: 'What does this print?\n\n~~~python\nprint("a", "b", sep="-")\n~~~', options: ['a b', 'a-b', 'ab', '"a"-"b"'], answer: 1, why: '`sep` is placed between the arguments.' },

    ],
    'py-variables': [
      { type: 'choice', q: 'Which is a valid variable name?', options: ['2fast', 'my-var', 'my_var', 'class'], answer: 2, why: 'Names use letters, digits and underscores, cannot start with a digit, and cannot be keywords.' },

    ],
    
    'py-functions': [
      { type: 'choice', q: 'What does `print(f())` show if `def f(): pass`?', options: ['pass', 'None', '0', 'An error'], answer: 1, why: 'A function with no return gives back None.' },

    ],
    'py-conditions': [
      { type: 'choice', q: 'Which is falsy in Python?', options: ['"0"', '[0]', '[]', '" "'], answer: 2, why: 'Empty containers, 0, None and "" are falsy.' },

    ],
    'py-loops': [
      { type: 'choice', q: 'What does `for i in range(3): pass` leave in `i`?', options: ['0', '2', '3', 'It is undefined'], answer: 1, why: 'The loop variable keeps its last value, 2.' },

    ],
    'py-lists': [
      { type: 'choice', q: 'What does `xs.pop()` do on `[1, 2, 3]`?', options: ['Removes and returns 3', 'Removes and returns 1', 'Returns 3 without removing', 'Removes everything'], answer: 0, why: 'pop() removes the last item (or a given index) and returns it.' },

    ],
    'py-dicts': [
      { type: 'choice', q: 'What does `d.setdefault("k", [])` do?', options: ['Always replaces d["k"]', 'Returns d["k"], inserting [] first if the key is missing', 'Deletes the key', 'Raises KeyError'], answer: 1, why: 'It is the get-or-create idiom.' },

    ],
    'py-errors': [
      { type: 'choice', q: 'When does the `else` block of try/except run?', options: ['When an exception happened', 'When no exception happened', 'Always', 'Never'], answer: 1, why: 'try/except/else: else runs only if the try body finished without raising.' },

    ],
    'py-classes': [
      { type: 'choice', q: 'What is the difference between a class and an instance?', options: ['None', 'A class is the blueprint; an instance is one object built from it', 'An instance is the blueprint', 'Classes are only for numbers'], answer: 1, why: '`Dog` is the class; `Dog("Rex")` is an instance.' },

    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
