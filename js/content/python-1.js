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
        { type: 'type', q: 'Which string method joins a list of strings with a separator? (write the call on the separator, e.g. `sep.____(items)`; give just the method name)', accept: ['join'], why: '`", ".join(items)` glues the items together with the separator.' },
        { type: 'choice', q: 'What does `"hello"[::-1]` return?', options: ['"hello"', '"olleh"', '"h"', 'An error'], answer: 1, why: 'A step of -1 walks the string backwards.' },
      ],
    },
    {
      id: 'py-tuples-sets', title: 'Tuples & sets', skill: 'Data structures', xp: 25, diff: 2,
      read: `
# Tuples: fixed groups

A **tuple** is an immutable sequence, ideal for a small, fixed group of related values (a point, a (min, max) pair).

~~~python
point = (3, 4)
x, y = point            # unpacking
a, b = b, a             # swap, no temp variable needed
first, *rest = [1, 2, 3, 4]    # first=1, rest=[2, 3, 4]

def min_max(xs):
    return min(xs), max(xs)    # returns a tuple
lo, hi = min_max([4, 9, 1])
~~~

# Sets: unique, unordered, fast membership

~~~python
s = {1, 2, 3}
s.add(4); s.discard(9)       # discard never raises
{1, 2} | {2, 3}   # union        {1, 2, 3}
{1, 2} & {2, 3}   # intersection {2}
{1, 2} - {2, 3}   # difference   {1}
{1, 2} ^ {2, 3}   # symmetric difference {1, 3}
set()             # empty set ({} is an empty DICT!)
~~~

Checking \`x in some_set\` is **O(1)**; in a list it is O(n). Sets also deduplicate: \`list(set(xs))\` (order not guaranteed).

> [!tip] Key idea
> Need uniqueness or fast "have I seen this?" checks? Use a set. Need a fixed record? Use a tuple.
`,
      task: 'Write `min_max(nums)` returning a `(min, max)` tuple, `common(a, b)` returning a **sorted list** of items in both, and `first_dupe(xs)` returning the first item that has already appeared earlier in `xs` (or `None`) using a set.',
      starter: 'def min_max(nums):\n    pass\n\n\ndef common(a, b):\n    pass\n\n\ndef first_dupe(xs):\n    pass\n',
      harness: r`
assert min_max([4, 9, 1, 7]) == (1, 9), f"got {min_max([4, 9, 1, 7])!r}"
assert isinstance(min_max([1]), tuple), "return a tuple"
assert common([3, 1, 2, 3], [3, 4, 1]) == [1, 3], f"got {common([3, 1, 2, 3], [3, 4, 1])!r}"
assert common([1], [2]) == []
assert first_dupe([5, 2, 7, 2, 5]) == 2, "2 is the first value seen a second time"
assert first_dupe([1, 2, 3]) is None
assert first_dupe([]) is None
`,
      hints: ['`return min(nums), max(nums)` builds the tuple.', '`sorted(set(a) & set(b))`', 'Keep `seen = set()`; for each item, if it is already in `seen` return it, else add it.'],
      solution: 'def min_max(nums):\n    return min(nums), max(nums)\n\n\ndef common(a, b):\n    return sorted(set(a) & set(b))\n\n\ndef first_dupe(xs):\n    seen = set()\n    for x in xs:\n        if x in seen:\n            return x\n        seen.add(x)\n    return None',
      recall: [
        { type: 'choice', q: 'What type is `{}`?', options: ['An empty set', 'An empty dict', 'An empty tuple', 'An error'], answer: 1, why: 'Curly braces without items create a dict. Use `set()` for an empty set.' },
        { type: 'choice', q: 'What is `{1, 2, 3} & {2, 3, 4}`?', options: ['{1, 2, 3, 4}', '{2, 3}', '{1, 4}', '{1}'], answer: 1, why: '`&` is intersection: items in both.' },
        { type: 'choice', q: 'After `a, *rest = [10, 20, 30]` what is `rest`?', options: ['[20, 30]', '20', '[10, 20, 30]', '(20, 30)'], answer: 0, why: 'The starred name collects the remaining items as a list.' },
        { type: 'choice', q: 'Why is `x in my_set` faster than `x in my_list` for big collections?', options: ['Sets are sorted', 'Sets use hashing, so lookup is O(1) on average', 'Lists cannot be searched', 'It is not faster'], answer: 1, why: 'Hash lookups do not scan every item.' },
        { type: 'type', q: 'Which set method removes an item without raising an error if it is missing?', accept: ['discard', '.discard', 'discard()'], why: '`remove` raises KeyError for a missing item; `discard` does not.' },
      ],
    },
    {
      id: 'py-lambda', title: 'Lambda, sorting keys, map & filter', skill: 'Functions', xp: 25, diff: 2,
      read: `
# Functions as values

Functions are objects: you can store them, pass them around and return them. A **lambda** is a tiny anonymous function written inline.

~~~python
square = lambda x: x * x      # same as def square(x): return x * x
square(5)                     # 25
~~~

## key= functions

\`sorted\`, \`min\` and \`max\` accept a \`key\` function that says *what to compare by*:

~~~python
words = ["pear", "fig", "banana"]
sorted(words, key=len)                     # ['fig', 'pear', 'banana']
sorted(words, key=lambda w: w[-1])         # by last letter
max(words, key=len)                        # 'banana'
sorted(words, key=lambda w: (len(w), w))   # by length, then alphabetically
sorted(words, reverse=True)
~~~

## map and filter

~~~python
list(map(str.upper, words))                 # ['PEAR', 'FIG', 'BANANA']
list(filter(lambda w: len(w) > 3, words))   # ['pear', 'banana']
~~~

These return lazy iterators, so wrap them in \`list(...)\`. A list comprehension often reads better: \`[w.upper() for w in words]\`.

> [!tip] Key idea
> A tuple as a key sorts by the first element, then the second on ties.
`,
      task: 'Given list-of-dict `people` like `{"name": "Ada", "age": 36}`: write `by_age(people)` (sorted by age, then name), `oldest(people)` (the dict with the highest age) and `names_over(people, n)` (names of people older than n, in original order, using `filter` and `map`).',
      starter: 'def by_age(people):\n    pass\n\n\ndef oldest(people):\n    pass\n\n\ndef names_over(people, n):\n    pass\n',
      harness: r`
people = [{"name": "Grace", "age": 45}, {"name": "Ada", "age": 36}, {"name": "Linus", "age": 28}, {"name": "Alan", "age": 36}]
assert [p["name"] for p in by_age(people)] == ["Linus", "Ada", "Alan", "Grace"], "sort by age, ties by name"
assert people[0]["name"] == "Grace", "do not modify the original list"
assert oldest(people)["name"] == "Grace"
assert names_over(people, 30) == ["Grace", "Ada", "Alan"], f"got {names_over(people, 30)!r}"
assert names_over(people, 99) == []
`,
      must: [{ re: 'lambda', msg: 'Use a lambda for the key / filter.' }],
      hints: ['`sorted(people, key=lambda p: (p["age"], p["name"]))`', '`max(people, key=lambda p: p["age"])`', '`list(map(lambda p: p["name"], filter(lambda p: p["age"] > n, people)))`'],
      solution: 'def by_age(people):\n    return sorted(people, key=lambda p: (p["age"], p["name"]))\n\n\ndef oldest(people):\n    return max(people, key=lambda p: p["age"])\n\n\ndef names_over(people, n):\n    return list(map(lambda p: p["name"], filter(lambda p: p["age"] > n, people)))',
      recall: [
        { type: 'choice', q: 'What does `sorted(["bb", "a", "ccc"], key=len)` return?', options: ['["a", "bb", "ccc"]', '["ccc", "bb", "a"]', '["bb", "a", "ccc"]', '["a", "ccc", "bb"]'], answer: 0, why: 'key=len sorts by length: 1, 2, 3.' },
        { type: 'choice', q: 'What does `list(map(lambda x: x + 1, [1, 2]))` give?', options: ['[1, 2]', '[2, 3]', '[3]', 'A map object'], answer: 1, why: 'map applies the function to every item; list() consumes it.' },
        { type: 'choice', q: 'What does `sorted(xs, key=lambda t: (t[0], -t[1]))` do?', options: ['Sort by t[0] ascending then t[1] descending', 'Sort by t[1] only', 'Raises an error', 'Sort by t[0] descending'], answer: 0, why: 'Tuple keys compare element by element; negating a number reverses its order.' },
        { type: 'choice', q: 'Which best describes a lambda?', options: ['A class', 'A small anonymous function', 'A loop', 'A module'], answer: 1, why: '`lambda args: expression` creates an unnamed function.' },
        { type: 'type', q: 'Which argument of `sorted` reverses the order? (name only)', accept: ['reverse', 'reverse=true'], why: '`sorted(xs, reverse=True)`.' },
      ],
    },
    {
      id: 'py-iteration', title: 'Iteration tools & comprehensions', skill: 'Iteration', xp: 30, diff: 2,
      read: `
# Looping like a Pythonista

Avoid \`range(len(x))\`. Python has better tools:

~~~python
for i, item in enumerate(["a", "b"], start=1):
    print(i, item)             # 1 a / 2 b

for name, score in zip(["Ada", "Bo"], [90, 80]):
    print(name, score)

dict(zip(["x", "y"], [1, 2]))  # {'x': 1, 'y': 2}
list(reversed([1, 2, 3]))      # [3, 2, 1]
any(n > 5 for n in [1, 9])     # True
all(n > 0 for n in [1, 2])     # True
sum(n * n for n in range(4))   # 14  (generator expression)
~~~

\`zip\` stops at the shortest input. \`zip(*rows)\` **transposes** a table.

## All the comprehensions

~~~python
[x * 2 for x in xs if x > 0]            # list
{w: len(w) for w in words}              # dict
{len(w) for w in words}                 # set
[c for row in matrix for c in row]      # nested: read left to right like the loops
~~~

> [!tip] Key idea
> If you are building a collection from another one, a comprehension is usually clearer than \`append\` in a loop.
`,
      task: 'Write `numbered(items)` (`["a", "b"]` -> `["1. a", "2. b"]`), `to_dict(keys, values)` using `zip`, `invert(d)` (swap keys and values with a dict comprehension), `all_positive(nums)` using `all`, and `flatten(matrix)` (one level, nested comprehension).',
      starter: 'def numbered(items):\n    pass\n\n\ndef to_dict(keys, values):\n    pass\n\n\ndef invert(d):\n    pass\n\n\ndef all_positive(nums):\n    pass\n\n\ndef flatten(matrix):\n    pass\n',
      harness: r`
assert numbered(["a", "b", "c"]) == ["1. a", "2. b", "3. c"], f"got {numbered(['a', 'b', 'c'])!r}"
assert numbered([]) == []
assert to_dict(["x", "y"], [1, 2]) == {"x": 1, "y": 2}
assert to_dict(["x", "y", "z"], [1]) == {"x": 1}, "zip stops at the shortest"
assert invert({"a": 1, "b": 2}) == {1: "a", 2: "b"}
assert all_positive([1, 2, 3]) is True and all_positive([1, -2]) is False and all_positive([]) is True
assert flatten([[1, 2], [3], [], [4, 5]]) == [1, 2, 3, 4, 5]
`,
      must: [{ re: 'enumerate', msg: 'Use enumerate in numbered().' }, { re: '\\bzip\\b', msg: 'Use zip in to_dict().' }, { re: '\\ball\\(', msg: 'Use all() in all_positive().' }],
      hints: ['`[f"{i}. {x}" for i, x in enumerate(items, start=1)]`', '`dict(zip(keys, values))`', '`{v: k for k, v in d.items()}`', '`all(n > 0 for n in nums)`', '`[x for row in matrix for x in row]`'],
      solution: 'def numbered(items):\n    return [f"{i}. {x}" for i, x in enumerate(items, start=1)]\n\n\ndef to_dict(keys, values):\n    return dict(zip(keys, values))\n\n\ndef invert(d):\n    return {v: k for k, v in d.items()}\n\n\ndef all_positive(nums):\n    return all(n > 0 for n in nums)\n\n\ndef flatten(matrix):\n    return [x for row in matrix for x in row]',
      recall: [
        { type: 'choice', q: 'What does `list(zip([1, 2, 3], "ab"))` produce?', options: ['[(1, "a"), (2, "b")]', '[(1, "a"), (2, "b"), (3, None)]', '[1, 2, 3, "a", "b"]', 'An error'], answer: 0, why: 'zip pairs items up and stops at the shortest input.' },
        { type: 'choice', q: 'What is `all([])`?', options: ['False', 'True', 'None', 'An error'], answer: 1, why: 'all() is vacuously True for an empty iterable (there is no counterexample).' },
        { type: 'choice', q: 'What does `{x % 3 for x in range(10)}` evaluate to?', options: ['{0, 1, 2}', '[0, 1, 2]', '{0, 1, 2, 3}', '{1, 2}'], answer: 0, why: 'A set comprehension: the remainders are 0, 1 and 2, with duplicates removed.' },
        { type: 'type', q: 'Which built-in gives you (index, item) pairs when looping? (name only)', accept: ['enumerate'], why: '`for i, x in enumerate(items)`.' },
        { type: 'choice', q: 'What does `list(zip(*[[1, 2], [3, 4]]))` return?', options: ['[(1, 3), (2, 4)]', '[(1, 2), (3, 4)]', '[[1, 2], [3, 4]]', '[1, 2, 3, 4]'], answer: 0, why: 'zip(*rows) transposes: columns become rows.' },
      ],
    },
    {
      id: 'py-args', title: 'Arguments: *args, **kwargs & defaults', skill: 'Functions', xp: 30, diff: 3,
      read: `
# Flexible function signatures

~~~python
def total(*nums, start=0):           # *nums collects extra positionals into a tuple
    return start + sum(nums)

total(1, 2, 3)               # 6
total(1, 2, start=100)       # 103  (start is keyword-only)

def tag(name, **attrs):      # **attrs collects extra keywords into a dict
    return name, attrs
tag("a", href="x", id="y")   # ('a', {'href': 'x', 'id': 'y'})
~~~

You can also **unpack at the call site**:

~~~python
args = (1, 2, 3)
kwargs = {"start": 10}
total(*args, **kwargs)       # 16
~~~

Anything after a bare \`*\` is keyword-only; parameters before \`/\` are positional-only.

## The classic trap: mutable defaults

~~~python
def add(item, bucket=[]):    # the list is created ONCE, at def time
    bucket.append(item)
    return bucket
add(1); add(2)               # [1, 2]  <- surprise!

def add(item, bucket=None):  # fix
    if bucket is None:
        bucket = []
    bucket.append(item)
    return bucket
~~~

> [!warn] Never use a mutable object as a default value
> Use \`None\` as the default and create the list/dict inside the function.
`,
      task: 'Write `total(*nums, start=0)`, `build_tag(name, **attrs)` returning e.g. `<a href="x" id="y">` with attributes sorted by name (just `<br>` when none), and `safe_append(item, items=None)` that returns a **new** list (empty if `items` is None) and never shares state between calls.',
      starter: 'def total(*nums, start=0):\n    pass\n\n\ndef build_tag(name, **attrs):\n    pass\n\n\ndef safe_append(item, items=None):\n    pass\n',
      harness: r`
assert total() == 0 and total(1, 2, 3) == 6
assert total(1, 2, start=10) == 13, "start is a keyword argument"
assert build_tag("a", id="y", href="x") == '<a href="x" id="y">', f"got {build_tag('a', id='y', href='x')!r}"
assert build_tag("br") == "<br>"
assert safe_append(1) == [1]
assert safe_append(2) == [2], "calls must not share a list"
base = [1]
out = safe_append(2, base)
assert out == [1, 2] and base == [1], "do not mutate the list passed in"
`,
      hints: ['`return start + sum(nums)`', 'Sort with `sorted(attrs.items())` and build `key="value"` pairs.', 'Default `items=None`; then `return (items or []) + [item]` or copy first.'],
      solution: 'def total(*nums, start=0):\n    return start + sum(nums)\n\n\ndef build_tag(name, **attrs):\n    parts = "".join(f\' {k}="{v}"\' for k, v in sorted(attrs.items()))\n    return f"<{name}{parts}>"\n\n\ndef safe_append(item, items=None):\n    return list(items or []) + [item]',
      recall: [
        { type: 'choice', q: 'Inside `def f(*args, **kwargs)`, what are `args` and `kwargs`?', options: ['A list and a set', 'A tuple and a dict', 'Two lists', 'A string and a dict'], answer: 1, why: '*args is a tuple of extra positional arguments; **kwargs a dict of extra keywords.' },
        { type: 'choice', q: 'What does this print?\n\n~~~python\ndef add(x, bucket=[]):\n    bucket.append(x)\n    return bucket\nadd(1)\nprint(add(2))\n~~~', options: ['[2]', '[1, 2]', '[1]', 'An error'], answer: 1, why: 'The default list is created once and shared between calls.' },
        { type: 'choice', q: 'After a bare `*` in a signature (`def f(a, *, b)`), `b` is...', options: ['Positional-only', 'Keyword-only', 'Optional', 'A tuple'], answer: 1, why: 'Parameters after `*` can only be passed by name.' },
        { type: 'choice', q: 'What does `f(*[1, 2], **{"x": 3})` do?', options: ['Calls f(1, 2, x=3)', 'Calls f([1, 2], {"x": 3})', 'Raises a SyntaxError', 'Calls f(1, 2, 3)'], answer: 0, why: '* and ** unpack a sequence and a mapping into arguments.' },
        { type: 'type', q: 'What value should you use as the default for a parameter that should start as an empty list?', accept: ['none'], why: 'Use `None` and build the list inside the function.' },
      ],
    },
    {
      id: 'py-scope', title: 'Scope & closures', skill: 'Functions', xp: 30, diff: 3,
      read: `
# Where names live

Python looks a name up in this order, **LEGB**: **L**ocal, **E**nclosing function, **G**lobal, **B**uilt-in.

~~~python
x = "global"
def outer():
    x = "enclosing"
    def inner():
        return x          # finds the enclosing x
    return inner()
~~~

Assigning inside a function creates a **local** variable unless you declare otherwise (\`global x\` or \`nonlocal x\`).

## Closures

A function that remembers variables from the function that created it is a **closure**.

~~~python
def make_counter():
    count = 0
    def tick():
        nonlocal count     # rebind the enclosing variable
        count += 1
        return count
    return tick

c = make_counter()
c(); c()    # 1, 2
~~~

Each call of \`make_counter\` makes an independent \`count\`.

> [!warn] Late binding trap
> \`[lambda: i for i in range(3)]\` makes three functions that all see the *final* \`i\`. Capture the value with a default argument: \`lambda i=i: i\`.
`,
      task: 'Write `make_counter(start=0)` (each call returns start+1, start+2...), `make_multiplier(n)` (returns a function multiplying by n), `make_accumulator()` (function that adds its argument to a running total and returns it) and `adders()` returning 3 functions where `adders()[i](10) == 10 + i`.',
      starter: 'def make_counter(start=0):\n    pass\n\n\ndef make_multiplier(n):\n    pass\n\n\ndef make_accumulator():\n    pass\n\n\ndef adders():\n    pass\n',
      harness: r`
c = make_counter()
assert (c(), c(), c()) == (1, 2, 3), "counter should count 1, 2, 3"
d = make_counter(10)
assert d() == 11 and c() == 4, "counters are independent"
triple = make_multiplier(3)
assert triple(5) == 15 and make_multiplier(2)(5) == 10
acc = make_accumulator()
assert acc(5) == 5 and acc(10) == 15 and acc(-3) == 12, "running total"
assert make_accumulator()(1) == 1, "each accumulator has its own total"
fs = adders()
assert len(fs) == 3
assert [f(10) for f in fs] == [10, 11, 12], f"late-binding bug? got {[f(10) for f in fs]}"
`,
      hints: ['Keep the count in the enclosing function and use `nonlocal`.', 'The inner function can read `n` directly.', 'For adders: `lambda x, i=i: x + i` inside a comprehension.'],
      solution: 'def make_counter(start=0):\n    count = start\n    def tick():\n        nonlocal count\n        count += 1\n        return count\n    return tick\n\n\ndef make_multiplier(n):\n    return lambda x: x * n\n\n\ndef make_accumulator():\n    total = 0\n    def add(x):\n        nonlocal total\n        total += x\n        return total\n    return add\n\n\ndef adders():\n    return [lambda x, i=i: x + i for i in range(3)]',
      recall: [
        { type: 'choice', q: 'What does LEGB stand for?', options: ['Local, Enclosing, Global, Built-in', 'Loop, Exception, Global, Block', 'Local, External, Global, Base', 'Lambda, Enclosing, Generic, Built-in'], answer: 0, why: 'It is the order in which Python searches for a name.' },
        { type: 'choice', q: 'Which keyword lets an inner function rebind a variable of its enclosing function?', options: ['global', 'nonlocal', 'outer', 'static'], answer: 1, why: '`nonlocal` targets the nearest enclosing scope; `global` targets module level.' },
        { type: 'choice', q: 'What does this return?\n\n~~~python\nfs = [lambda: i for i in range(3)]\nprint(fs[0]())\n~~~', options: ['0', '2', '1', 'An error'], answer: 1, why: 'All three lambdas look up the same `i`, which ends at 2 (late binding).' },
        { type: 'choice', q: 'What is a closure?', options: ['A function that remembers variables from its enclosing scope', 'A function without arguments', 'A loop that ends early', 'A private class'], answer: 0, why: 'The inner function "closes over" the outer variables.' },
        { type: 'type', q: 'Which keyword declares that a name inside a function refers to the module-level variable?', accept: ['global'], why: '`global x` makes assignments to x affect the module-level name.' },
      ],
    },
    {
      id: 'py-mutability', title: 'Mutability & references', skill: 'Data structures', xp: 25, diff: 2,
      read: `
# Names are labels, not boxes

Variables hold **references** to objects. Assigning a list to another name does not copy it:

~~~python
a = [1, 2]
b = a            # same list, two names
b.append(3)
a                # [1, 2, 3]   <- a changed too!
a is b           # True        same object
a == [1, 2, 3]   # True        equal value
~~~

\`is\` asks "same object?"; \`==\` asks "equal value?".

## Copying

~~~python
c = a.copy()          # shallow copy (also list(a) or a[:])
import copy
d = copy.deepcopy(nested)   # copies inner objects too
~~~

A shallow copy of a list of lists still **shares the inner lists**.

## Mutable vs immutable

- Immutable: \`int float str tuple frozenset bool\`.
- Mutable: \`list dict set\` and most objects.

Functions receive references, so a function that mutates a list argument changes the caller's list.

> [!warn] Classic bug
> \`grid = [[0] * 3] * 3\` makes **three references to one row**. Build rows separately: \`[[0] * 3 for _ in range(3)]\`.
`,
      task: 'Write `add_item(lst, x)` returning a new list with x appended (original untouched), `deep_double(matrix)` returning a new matrix with every number doubled (original untouched), and `dedupe_in_place(lst)` that removes duplicates from `lst` itself, keeping first occurrences, and returns `None`.',
      starter: 'def add_item(lst, x):\n    pass\n\n\ndef deep_double(matrix):\n    pass\n\n\ndef dedupe_in_place(lst):\n    pass\n',
      harness: r`
orig = [1, 2]
new = add_item(orig, 3)
assert new == [1, 2, 3] and orig == [1, 2], "do not mutate the input"
assert new is not orig
m = [[1, 2], [3]]
out = deep_double(m)
assert out == [[2, 4], [6]] and m == [[1, 2], [3]], "original matrix must be unchanged"
assert out[0] is not m[0], "inner lists must be new objects"
data = [3, 1, 3, 2, 1]
same = data
assert dedupe_in_place(data) is None, "mutating functions conventionally return None"
assert data == [3, 1, 2] and same is data, "the SAME list must be modified"
`,
      hints: ['`return lst + [x]` builds a new list.', '`[[2 * v for v in row] for row in matrix]`', 'Build a list of unique items, then assign back with `lst[:] = unique`.'],
      solution: 'def add_item(lst, x):\n    return lst + [x]\n\n\ndef deep_double(matrix):\n    return [[2 * v for v in row] for row in matrix]\n\n\ndef dedupe_in_place(lst):\n    seen = set()\n    unique = []\n    for v in lst:\n        if v not in seen:\n            seen.add(v)\n            unique.append(v)\n    lst[:] = unique',
      recall: [
        { type: 'choice', q: 'After `a = [1]; b = a; b.append(2)`, what is `a`?', options: ['[1]', '[1, 2]', '[2]', 'An error'], answer: 1, why: 'a and b are two names for the same list.' },
        { type: 'choice', q: 'What is the difference between `is` and `==`?', options: ['None', '`is` checks identity (same object); `==` checks equal value', '`is` checks type', '`==` checks identity'], answer: 1, why: 'Two equal lists are different objects: `[1] == [1]` is True but `[1] is [1]` is False.' },
        { type: 'choice', q: 'What is wrong with `grid = [[0] * 3] * 3`?', options: ['It is a syntax error', 'All three rows are the same list object', 'It has the wrong size', 'Nothing'], answer: 1, why: 'The outer `*` repeats a reference to one inner list.' },
        { type: 'choice', q: 'Which of these is immutable?', options: ['list', 'dict', 'tuple', 'set'], answer: 2, why: 'Tuples cannot be changed after creation.' },
        { type: 'type', q: 'Which module provides `deepcopy`?', accept: ['copy'], why: '`import copy; copy.deepcopy(x)`.' },
      ],
    },
    {
      id: 'py-recursion', title: 'Recursion & memoization', skill: 'Functions', xp: 30, diff: 3,
      read: `
# A function that calls itself

Every recursive function needs a **base case** (stop) and a **recursive case** that moves toward it.

~~~python
def factorial(n):
    if n <= 1:                 # base case
        return 1
    return n * factorial(n - 1)   # recursive case
~~~

Each call waits on the **call stack**; forgetting the base case ends in \`RecursionError\` (the default limit is about 1000 frames).

## Memoization

Naive Fibonacci recomputes the same values exponentially many times. **Cache** results:

~~~python
def fib(n, memo={}):          # a dict default is shared on purpose here
    if n < 2:
        return n
    if n not in memo:
        memo[n] = fib(n - 1, memo) + fib(n - 2, memo)
    return memo[n]

from functools import lru_cache
@lru_cache(maxsize=None)
def fib2(n):
    return n if n < 2 else fib2(n - 1) + fib2(n - 2)
~~~

## Recursion on nested data

Nested structures (folders, JSON, trees) are naturally recursive: handle a leaf, otherwise recurse into the children.

> [!tip] Key idea
> Shrink the problem each call. If you cannot say how the input gets smaller, you have an infinite loop.
`,
      task: 'Write `sum_digits(n)` (recursive, no loops or strings), `fib(n)` fast enough for n = 80 (use memoization), and `flatten(nested)` that flattens lists nested to any depth.',
      starter: 'def sum_digits(n):\n    pass\n\n\ndef fib(n):\n    pass\n\n\ndef flatten(nested):\n    pass\n',
      harness: r`
assert sum_digits(0) == 0 and sum_digits(9) == 9 and sum_digits(4821) == 15
assert fib(0) == 0 and fib(1) == 1 and fib(10) == 55
assert fib(80) == 23416728348467685, "fib(80) must be fast: memoize!"
assert flatten([1, [2, [3, [4]], 5], [[6]]]) == [1, 2, 3, 4, 5, 6], f"got {flatten([1, [2, [3, [4]], 5], [[6]]])!r}"
assert flatten([]) == [] and flatten([[], [[]]]) == []
`,
      hints: ['Base case: `n < 10` returns `n`. Else `n % 10 + sum_digits(n // 10)`.', 'Use `functools.lru_cache` or a dict.', 'For each item: if it is a list, extend with `flatten(item)`, else append it.'],
      solution: 'from functools import lru_cache\n\n\ndef sum_digits(n):\n    if n < 10:\n        return n\n    return n % 10 + sum_digits(n // 10)\n\n\n@lru_cache(maxsize=None)\ndef fib(n):\n    return n if n < 2 else fib(n - 1) + fib(n - 2)\n\n\ndef flatten(nested):\n    out = []\n    for item in nested:\n        if isinstance(item, list):\n            out.extend(flatten(item))\n        else:\n            out.append(item)\n    return out',
      recall: [
        { type: 'choice', q: 'What happens if a recursive function has no base case?', options: ['It returns None', 'RecursionError once the stack limit is hit', 'It loops forever silently', 'Python adds one for you'], answer: 1, why: 'Frames pile up until the interpreter raises RecursionError.' },
        { type: 'choice', q: 'Why is naive recursive Fibonacci slow?', options: ['Python is slow', 'It recomputes the same subproblems exponentially many times', 'It uses too much memory per call', 'Integers are big'], answer: 1, why: 'fib(n-1) and fib(n-2) overlap enormously; memoization removes the repeats.' },
        { type: 'choice', q: 'What does `functools.lru_cache` do?', options: ['Limits recursion depth', 'Caches a function\'s results by arguments', 'Runs a function in a thread', 'Sorts a list'], answer: 1, why: 'Repeated calls with the same arguments return the cached result.' },
        { type: 'choice', q: 'What is `factorial(3)` with `factorial(n) = n * factorial(n - 1)` and `factorial(1) = 1`?', options: ['3', '6', '9', '1'], answer: 1, why: '3 * 2 * 1 = 6.' },
        { type: 'type', q: 'What is the part of a recursive function that stops the recursion called? (two words)', accept: ['base case', 'the base case'], why: 'Without a base case the recursion never ends.' },
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
      { title: 'Money format', task: 'Write `format_price(cents)` returning dollars with a thousands separator and 2 decimals: `123456` -> `"$1,234.56"`, `5` -> `"$0.05"`.', starter: 'def format_price(cents):\n    pass\n', harness: r`
assert format_price(123456) == "$1,234.56", f"got {format_price(123456)!r}"
assert format_price(5) == "$0.05"
assert format_price(100000000) == "$1,000,000.00"
assert format_price(0) == "$0.00"
`, hints: ['Divide by 100 and use an f-string with `:,.2f`.'], solution: 'def format_price(cents):\n    return f"${cents / 100:,.2f}"' },
      { title: 'Caesar cipher', task: 'Write `caesar(text, shift)` shifting letters by `shift` (wrapping a-z), preserving case and leaving other characters alone. `caesar("Hello, World!", 3)` -> `"Khoor, Zruog!"`.', starter: 'def caesar(text, shift):\n    pass\n', harness: r`
assert caesar("Hello, World!", 3) == "Khoor, Zruog!", f"got {caesar('Hello, World!', 3)!r}"
assert caesar("xyz", 3) == "abc"
assert caesar("abc", -1) == "zab"
assert caesar(caesar("Round Trip", 7), -7) == "Round Trip"
`, hints: ['Use `ord`/`chr`: for a lowercase letter, `chr((ord(ch) - 97 + shift) % 26 + 97)`; do the same with 65 for uppercase.'], solution: 'def caesar(text, shift):\n    out = []\n    for ch in text:\n        if ch.islower():\n            out.append(chr((ord(ch) - 97 + shift) % 26 + 97))\n        elif ch.isupper():\n            out.append(chr((ord(ch) - 65 + shift) % 26 + 65))\n        else:\n            out.append(ch)\n    return "".join(out)' },
    ],
    'py-tuples-sets': [
      { title: 'Swap pairs', task: 'Write `swap_pairs(pairs)`: `[(1, "a"), (2, "b")]` -> `[("a", 1), ("b", 2)]` (use unpacking).', starter: 'def swap_pairs(pairs):\n    pass\n', harness: r`
assert swap_pairs([(1, "a"), (2, "b")]) == [("a", 1), ("b", 2)]
assert swap_pairs([]) == []
`, hints: ['`[(b, a) for a, b in pairs]`'], solution: 'def swap_pairs(pairs):\n    return [(b, a) for a, b in pairs]' },
      { title: 'Exactly one', task: 'Write `exclusive(a, b)` returning a sorted list of the items that appear in exactly one of the two lists.', starter: 'def exclusive(a, b):\n    pass\n', harness: r`
assert exclusive([1, 2, 3], [2, 3, 4]) == [1, 4]
assert exclusive([1], [1]) == []
assert exclusive([], [5, 5, 6]) == [5, 6]
`, hints: ['Symmetric difference: `set(a) ^ set(b)`.'], solution: 'def exclusive(a, b):\n    return sorted(set(a) ^ set(b))' },
      { title: 'Head and tail', task: 'Write `head_tail(xs)` returning `(first, rest_list)` using star-unpacking; for an empty list return `(None, [])`.', starter: 'def head_tail(xs):\n    pass\n', harness: r`
assert head_tail([1, 2, 3]) == (1, [2, 3])
assert head_tail([9]) == (9, [])
assert head_tail([]) == (None, [])
`, hints: ['Guard the empty case first, then `first, *rest = xs`.'], solution: 'def head_tail(xs):\n    if not xs:\n        return None, []\n    first, *rest = xs\n    return first, rest' },
    ],
    'py-lambda': [
      { title: 'Longest first', task: 'Write `sort_by_length(words)`: longest words first, ties alphabetical.', starter: 'def sort_by_length(words):\n    pass\n', harness: r`
assert sort_by_length(["bb", "a", "ccc", "aa"]) == ["ccc", "aa", "bb", "a"], f"got {sort_by_length(['bb', 'a', 'ccc', 'aa'])!r}"
assert sort_by_length([]) == []
`, hints: ['Key `(-len(w), w)` sorts by descending length then alphabetically.'], solution: 'def sort_by_length(words):\n    return sorted(words, key=lambda w: (-len(w), w))' },
      { title: 'Apply all', task: 'Write `apply_all(fs, x)` returning `[f(x) for each f]`.', starter: 'def apply_all(fs, x):\n    pass\n', harness: r`
assert apply_all([lambda v: v + 1, lambda v: v * 2, str], 5) == [6, 10, "5"]
assert apply_all([], 1) == []
`, hints: ['A comprehension: `[f(x) for f in fs]`.'], solution: 'def apply_all(fs, x):\n    return [f(x) for f in fs]' },
      { title: 'Compose', task: 'Write `compose(f, g)` returning a new function `h` with `h(x) == f(g(x))`.', starter: 'def compose(f, g):\n    pass\n', harness: r`
inc = lambda v: v + 1
dbl = lambda v: v * 2
assert compose(inc, dbl)(5) == 11, "inc(dbl(5)) = 11"
assert compose(dbl, inc)(5) == 12, "dbl(inc(5)) = 12"
assert compose(str, len)("hello") == "5"
`, hints: ['Return a lambda (or inner def) that calls `g` first, then `f`.'], solution: 'def compose(f, g):\n    return lambda x: f(g(x))' },
    ],
    'py-iteration': [
      { title: 'Transpose', task: 'Write `transpose(matrix)` turning rows into columns, returning a list of lists. Use `zip`.', starter: 'def transpose(matrix):\n    pass\n', harness: r`
assert transpose([[1, 2, 3], [4, 5, 6]]) == [[1, 4], [2, 5], [3, 6]], f"got {transpose([[1, 2, 3], [4, 5, 6]])!r}"
assert transpose([[1]]) == [[1]]
`, hints: ['`[list(col) for col in zip(*matrix)]`'], solution: 'def transpose(matrix):\n    return [list(col) for col in zip(*matrix)]' },
      { title: 'Word lengths', task: 'Write `word_lengths(words)` returning `{word: length}` with a dict comprehension.', starter: 'def word_lengths(words):\n    pass\n', harness: r`
assert word_lengths(["hi", "hello"]) == {"hi": 2, "hello": 5}
assert word_lengths([]) == {}
`, hints: ['`{w: len(w) for w in words}`'], solution: 'def word_lengths(words):\n    return {w: len(w) for w in words}' },
      { title: 'Differences', task: 'Write `diffs(nums)` returning the difference between each item and the previous one: `[1, 4, 9, 16]` -> `[3, 5, 7]`.', starter: 'def diffs(nums):\n    pass\n', harness: r`
assert diffs([1, 4, 9, 16]) == [3, 5, 7]
assert diffs([5]) == [] and diffs([]) == []
assert diffs([10, 7]) == [-3]
`, hints: ['Pair each item with the next one: `zip(nums, nums[1:])`.'], solution: 'def diffs(nums):\n    return [b - a for a, b in zip(nums, nums[1:])]' },
    ],
    'py-args': [
      { title: 'Mean of anything', task: 'Write `mean(*nums)` returning the average, or `0` when called with no numbers.', starter: 'def mean(*nums):\n    pass\n', harness: r`
assert mean(2, 4, 6) == 4
assert mean() == 0
assert mean(5) == 5
`, hints: ['Guard the empty tuple before dividing.'], solution: 'def mean(*nums):\n    return sum(nums) / len(nums) if nums else 0' },
      { title: 'Merge dicts', task: 'Write `merge(*dicts)` combining any number of dicts; later dicts win on conflicts. Do not mutate the inputs.', starter: 'def merge(*dicts):\n    pass\n', harness: r`
a, b = {"x": 1, "y": 2}, {"y": 3}
assert merge(a, b, {"z": 4}) == {"x": 1, "y": 3, "z": 4}
assert a == {"x": 1, "y": 2}, "inputs must not change"
assert merge() == {}
`, hints: ['Start from `{}` and call `.update(d)` for each, or use `{**d1, **d2}`.'], solution: 'def merge(*dicts):\n    out = {}\n    for d in dicts:\n        out.update(d)\n    return out' },
      { title: 'Describe', task: 'Write `describe(**kw)` returning `"a=1, b=2"` with keys sorted; `describe()` returns `""`.', starter: 'def describe(**kw):\n    pass\n', harness: r`
assert describe(b=2, a=1) == "a=1, b=2", f"got {describe(b=2, a=1)!r}"
assert describe() == ""
assert describe(name="x") == "name=x"
`, hints: ['`", ".join(f"{k}={v}" for k, v in sorted(kw.items()))`'], solution: 'def describe(**kw):\n    return ", ".join(f"{k}={v}" for k, v in sorted(kw.items()))' },
    ],
    'py-scope': [
      { title: 'Greeter factory', task: 'Write `make_greeter(greeting)` returning a function `name -> f"{greeting}, {name}!"`.', starter: 'def make_greeter(greeting):\n    pass\n', harness: r`
hi = make_greeter("Hi")
assert hi("Ada") == "Hi, Ada!"
assert make_greeter("Yo")("Bo") == "Yo, Bo!"
assert hi("Cy") == "Hi, Cy!", "the first greeter keeps its greeting"
`, hints: ['The inner function can use `greeting` from the enclosing scope.'], solution: 'def make_greeter(greeting):\n    return lambda name: f"{greeting}, {name}!"' },
      { title: 'Call once', task: 'Write `once(f)` returning a function that calls `f` only the first time and afterwards returns the first result, ignoring its arguments.', starter: 'def once(f):\n    pass\n', harness: r`
calls = []
def work(x):
    calls.append(x)
    return x * 10
g = once(work)
assert g(1) == 10 and g(2) == 10 and g(3) == 10, "later calls return the cached result"
assert calls == [1], "work() must run exactly once"
`, hints: ['Use a closure holding a "done" flag and the stored result; update them with `nonlocal`.'], solution: 'def once(f):\n    done = False\n    result = None\n    def wrapper(*args, **kwargs):\n        nonlocal done, result\n        if not done:\n            result = f(*args, **kwargs)\n            done = True\n        return result\n    return wrapper' },
      { title: 'Stack closures', task: 'Write `make_stack()` returning three functions `(push, pop, size)` that share a private list.', starter: 'def make_stack():\n    pass\n', harness: r`
push, pop, size = make_stack()
push(1); push(2); push(3)
assert size() == 3
assert pop() == 3 and pop() == 2
assert size() == 1
p2, q2, s2 = make_stack()
assert s2() == 0, "each stack is independent"
`, hints: ['Create `items = []` in the outer function; the three inner functions close over it.'], solution: 'def make_stack():\n    items = []\n    def push(x):\n        items.append(x)\n    def pop():\n        return items.pop()\n    def size():\n        return len(items)\n    return push, pop, size' },
    ],
    'py-mutability': [
      { title: 'Swap in place', task: 'Write `swap_in_place(lst, i, j)` swapping two items of the list itself (return `None`).', starter: 'def swap_in_place(lst, i, j):\n    pass\n', harness: r`
xs = [1, 2, 3, 4]
ref = xs
assert swap_in_place(xs, 0, 3) is None
assert xs == [4, 2, 3, 1] and ref is xs
`, hints: ['Tuple assignment: `lst[i], lst[j] = lst[j], lst[i]`.'], solution: 'def swap_in_place(lst, i, j):\n    lst[i], lst[j] = lst[j], lst[i]' },
      { title: 'Snapshot', task: 'Write `snapshot(d)` returning a deep copy of a nested dict so that later changes to the original do not affect the copy.', starter: 'def snapshot(d):\n    pass\n', harness: r`
orig = {"a": [1, 2], "b": {"c": 3}}
snap = snapshot(orig)
orig["a"].append(99)
orig["b"]["c"] = 0
assert snap == {"a": [1, 2], "b": {"c": 3}}, f"snapshot changed: {snap!r}"
`, hints: ['`copy.deepcopy`, from the `copy` module.'], solution: 'import copy\n\n\ndef snapshot(d):\n    return copy.deepcopy(d)' },
      { title: 'Independent grid', task: 'Write `grid(rows, cols, fill)` returning a list of rows where changing one cell never changes another row.', starter: 'def grid(rows, cols, fill):\n    pass\n', harness: r`
g = grid(2, 3, 0)
assert g == [[0, 0, 0], [0, 0, 0]]
g[0][0] = 9
assert g[1][0] == 0, "rows must be independent lists"
assert grid(0, 3, 1) == []
`, hints: ['One comprehension per row: `[[fill] * cols for _ in range(rows)]`.'], solution: 'def grid(rows, cols, fill):\n    return [[fill] * cols for _ in range(rows)]' },
    ],
    'py-recursion': [
      { title: 'Reverse a string', task: 'Write `reverse_str(s)` recursively (no slicing with a step, no `reversed`).', starter: 'def reverse_str(s):\n    pass\n', harness: r`
assert reverse_str("") == "" and reverse_str("a") == "a"
assert reverse_str("hello") == "olleh"
assert reverse_str("ab" * 100) == "ba" * 100
`, hints: ['Base case: length 0 or 1. Otherwise `reverse_str(s[1:]) + s[0]`.'], solution: 'def reverse_str(s):\n    if len(s) <= 1:\n        return s\n    return reverse_str(s[1:]) + s[0]' },
      { title: 'Count leaves', task: 'Write `count_leaves(nested)` returning how many non-list items are inside lists nested to any depth.', starter: 'def count_leaves(nested):\n    pass\n', harness: r`
assert count_leaves([1, [2, 3], [[4], []]]) == 4
assert count_leaves([]) == 0
assert count_leaves(["a"]) == 1
`, hints: ['If an item is a list, add `count_leaves(item)`, else add 1.'], solution: 'def count_leaves(nested):\n    return sum(count_leaves(x) if isinstance(x, list) else 1 for x in nested)' },
      { title: 'Towers of Hanoi', task: 'Write `hanoi_moves(n)` returning the list of `(from_peg, to_peg)` moves that transfer n disks from `"A"` to `"C"` using `"B"` (smaller disks never on larger ones). It should have `2**n - 1` moves.', starter: 'def hanoi_moves(n, src="A", dst="C", via="B"):\n    pass\n', harness: r`
assert hanoi_moves(1) == [("A", "C")]
assert hanoi_moves(2) == [("A", "B"), ("A", "C"), ("B", "C")]
assert len(hanoi_moves(5)) == 31
pegs = {"A": list(range(4, 0, -1)), "B": [], "C": []}
for a, b in hanoi_moves(4):
    d = pegs[a].pop()
    assert not pegs[b] or pegs[b][-1] > d, "illegal move"
    pegs[b].append(d)
assert pegs["C"] == [4, 3, 2, 1]
`, hints: ['Move n-1 disks to `via`, move the biggest to `dst`, move n-1 from `via` to `dst`.'], solution: 'def hanoi_moves(n, src="A", dst="C", via="B"):\n    if n == 0:\n        return []\n    return hanoi_moves(n - 1, src, via, dst) + [(src, dst)] + hanoi_moves(n - 1, via, dst, src)' },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
