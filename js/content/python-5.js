(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  const r = String.raw;
  LP.addLessons('python', [
    {
      id: 'py-generators', title: 'Iterators & generators', skill: 'Iteration', xp: 35, diff: 3,
      read: `
# Producing values lazily

An **iterator** is any object with \`__next__\` (and \`__iter__\` returning itself). A **generator function** is the easy way to write one: it contains \`yield\`, and each \`yield\` pauses the function and hands back a value.

~~~python
def countdown(n):
    while n > 0:
        yield n          # pause here, resume on the next request
        n -= 1

list(countdown(3))       # [3, 2, 1]
g = countdown(2)
next(g); next(g)         # 2, 1
next(g, "done")          # 'done'  (a default avoids StopIteration)
~~~

Generators are **lazy**: nothing runs until you ask, and values are not stored. That makes infinite sequences and huge files cheap:

~~~python
def naturals():
    n = 0
    while True:
        yield n
        n += 1

from itertools import islice
list(islice(naturals(), 5))    # [0, 1, 2, 3, 4]
~~~

\`yield from other\` delegates to another iterable (great for recursion). A generator expression \`(x * x for x in xs)\` is a one-line generator.

## The protocol by hand

~~~python
class Squares:
    def __init__(self, n): self.i, self.n = 0, n
    def __iter__(self): return self
    def __next__(self):
        if self.i >= self.n: raise StopIteration
        self.i += 1
        return self.i ** 2
~~~

> [!warn] A generator can only be consumed once
> After \`list(g)\` the generator is empty. Create a new one to iterate again.
`,
      task: 'Write generator functions `countdown(n)`, infinite `fib_gen()` (0, 1, 1, 2, ...), `chunked(iterable, n)` (yields lists of n, last one shorter; must work lazily on infinite input), `walk(nested)` (yield every non-list leaf of arbitrarily nested lists using `yield from`), a helper `take(n, iterable)` returning a list, and an iterator **class** `Squares(n)` yielding the first n squares.',
      starter: 'def countdown(n):\n    pass\n\n\ndef fib_gen():\n    pass\n\n\ndef take(n, iterable):\n    pass\n\n\ndef chunked(iterable, n):\n    pass\n\n\ndef walk(nested):\n    pass\n\n\nclass Squares:\n    pass\n',
      harness: r`
import inspect
from itertools import count, islice
assert inspect.isgeneratorfunction(countdown) and inspect.isgeneratorfunction(fib_gen)
assert list(countdown(3)) == [3, 2, 1] and list(countdown(0)) == []
g = fib_gen()
assert [next(g) for _ in range(10)] == [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
assert take(4, fib_gen()) == [0, 1, 1, 2] and take(5, [1, 2]) == [1, 2]
assert list(chunked(range(7), 3)) == [[0, 1, 2], [3, 4, 5], [6]] and list(chunked([], 2)) == []
first = next(chunked(count(), 3))
assert first == [0, 1, 2], "chunked must be lazy (infinite input!)"
assert list(walk([1, [2, [3, 4]], [], [[5]]])) == [1, 2, 3, 4, 5]
assert inspect.isgeneratorfunction(walk)
s = Squares(4)
assert list(s) == [1, 4, 9, 16] and list(s) == [], "an iterator is exhausted after one pass"
assert iter(Squares(2)) is not None and next(Squares(3)) == 1
it = Squares(1); iter(it); next(it)
try:
    next(it)
except StopIteration:
    pass
else:
    raise AssertionError("must raise StopIteration at the end")
`,
      hints: ['`while n > 0: yield n; n -= 1`', 'Keep two variables `a, b = 0, 1` and `yield a; a, b = b, a + b` forever.', 'For chunked: `it = iter(iterable)`; loop with `list(islice(it, n))` until it returns `[]`.', '`yield from walk(item)` for lists, `yield item` otherwise.', 'Squares: `__iter__` returns self; `__next__` raises StopIteration when done.'],
      solution: 'from itertools import islice\n\n\ndef countdown(n):\n    while n > 0:\n        yield n\n        n -= 1\n\n\ndef fib_gen():\n    a, b = 0, 1\n    while True:\n        yield a\n        a, b = b, a + b\n\n\ndef take(n, iterable):\n    return list(islice(iterable, n))\n\n\ndef chunked(iterable, n):\n    it = iter(iterable)\n    while True:\n        chunk = list(islice(it, n))\n        if not chunk:\n            return\n        yield chunk\n\n\ndef walk(nested):\n    for item in nested:\n        if isinstance(item, list):\n            yield from walk(item)\n        else:\n            yield item\n\n\nclass Squares:\n    def __init__(self, n):\n        self.i = 0\n        self.n = n\n\n    def __iter__(self):\n        return self\n\n    def __next__(self):\n        if self.i >= self.n:\n            raise StopIteration\n        self.i += 1\n        return self.i ** 2',
      recall: [
        { type: 'choice', q: 'What does `yield` do?', options: ['Ends the function', 'Pauses the function and produces a value; it resumes on the next request', 'Prints a value', 'Raises StopIteration immediately'], answer: 1, why: 'Generators keep their local state between yields.' },
        { type: 'choice', q: 'What is `list(g)` the second time for the same generator `g`?', options: ['The same values again', '[] (a generator is exhausted after one pass)', 'An error', 'None'], answer: 1, why: 'Generators cannot rewind.' },
        { type: 'choice', q: 'What is the memory advantage of a generator?', options: ['It compresses data', 'Values are produced one at a time instead of stored in a list', 'It uses the disk', 'There is none'], answer: 1, why: 'Lazy evaluation keeps memory flat even for huge or infinite sequences.' },
        { type: 'choice', q: 'What does `next(g, "done")` do when g is empty?', options: ['Raises StopIteration', 'Returns "done"', 'Returns None', 'Restarts g'], answer: 1, why: 'The second argument is the default.' },
        { type: 'type', q: 'Which keyword delegates to another iterable inside a generator? (two words)', accept: ['yield from'], why: '`yield from sub()` yields everything from sub.' },
      ],
    },
    {
      id: 'py-decorators', title: 'Decorators', skill: 'Advanced', xp: 40, diff: 3,
      read: `
# Functions that wrap functions

A **decorator** takes a function and returns a (usually enhanced) function. \`@name\` above a \`def\` is shorthand for \`f = name(f)\`.

~~~python
from functools import wraps

def shout(f):
    @wraps(f)                         # keep f's __name__ and __doc__
    def wrapper(*args, **kwargs):
        return f(*args, **kwargs).upper()
    return wrapper

@shout
def greet(name):
    """Say hi."""
    return f"hi {name}"

greet("ada")        # 'HI ADA'
greet.__name__      # 'greet'  (thanks to @wraps)
~~~

## Decorators with arguments

You need one more level: a function that returns the decorator.

~~~python
def repeat(n):
    def decorator(f):
        @wraps(f)
        def wrapper(*a, **k):
            for _ in range(n):
                result = f(*a, **k)
            return result
        return wrapper
    return decorator

@repeat(3)
def ping(): print("ping")
~~~

State can live on the wrapper itself (\`wrapper.calls = []\`) or in a closure. Stacked decorators apply from the bottom up. This is how \`@property\`, \`@classmethod\`, \`@lru_cache\` and web-framework routes work.

> [!tip] Key idea
> Always use \`*args, **kwargs\` in the wrapper so it works for any signature, and always \`@wraps(f)\`.
`,
      task: 'Write decorators `trace` (records each call as `(args, kwargs)` in `wrapper.calls`, preserves name and docstring), `memoize` (caches results by positional args), `repeat(n)` (decorator factory: calls the function n times, returns the last result) and `validate_positive` (raises `ValueError("arguments must be positive")` if any positional argument is <= 0).',
      starter: 'from functools import wraps\n\n\ndef trace(f):\n    pass\n\n\ndef memoize(f):\n    pass\n\n\ndef repeat(n):\n    pass\n\n\ndef validate_positive(f):\n    pass\n',
      harness: r`
@trace
def add(a, b=0):
    """Add numbers."""
    return a + b
assert add(1, b=2) == 3 and add(5) == 5
assert add.calls == [((1,), {"b": 2}), ((5,), {})], f"got {add.calls!r}"
assert add.__name__ == "add" and add.__doc__ == "Add numbers."
n = {"c": 0}
@memoize
def slow(x):
    n["c"] += 1
    return x * 2
assert slow(2) == 4 and slow(2) == 4 and slow(3) == 6 and n["c"] == 2, "second call with the same args must be cached"
hits = []
@repeat(3)
def ping(tag):
    hits.append(tag)
    return len(hits)
assert ping("x") == 3 and hits == ["x", "x", "x"]
@validate_positive
def area(w, h):
    return w * h
assert area(2, 3) == 6
for bad in [(0, 1), (1, -2)]:
    try:
        area(*bad)
    except ValueError as e:
        assert str(e) == "arguments must be positive"
    else:
        raise AssertionError(f"{bad} should be rejected")
@trace
@validate_positive
def vol(a, b, c):
    return a * b * c
assert vol(1, 2, 3) == 6 and len(vol.calls) == 1
`,
      hints: ['Create `wrapper(*args, **kwargs)`, append to `wrapper.calls`, call `f`. Decorate wrapper with `@wraps(f)` and initialise `wrapper.calls = []`.', 'Use a dict cache keyed by `args`.', '`repeat(n)` returns a decorator, which returns a wrapper.', 'Check `all(a > 0 for a in args)` before calling.'],
      solution: 'from functools import wraps\n\n\ndef trace(f):\n    @wraps(f)\n    def wrapper(*args, **kwargs):\n        wrapper.calls.append((args, kwargs))\n        return f(*args, **kwargs)\n    wrapper.calls = []\n    return wrapper\n\n\ndef memoize(f):\n    cache = {}\n    @wraps(f)\n    def wrapper(*args):\n        if args not in cache:\n            cache[args] = f(*args)\n        return cache[args]\n    return wrapper\n\n\ndef repeat(n):\n    def decorator(f):\n        @wraps(f)\n        def wrapper(*args, **kwargs):\n            result = None\n            for _ in range(n):\n                result = f(*args, **kwargs)\n            return result\n        return wrapper\n    return decorator\n\n\ndef validate_positive(f):\n    @wraps(f)\n    def wrapper(*args, **kwargs):\n        if not all(a > 0 for a in args):\n            raise ValueError("arguments must be positive")\n        return f(*args, **kwargs)\n    return wrapper',
      recall: [
        { type: 'choice', q: 'What does `@deco` above `def f` mean?', options: ['f = deco(f)', 'deco = f(deco)', 'deco(f()) is called', 'f is deleted'], answer: 0, why: 'The decorator is called with the function and its result replaces the name.' },
        { type: 'choice', q: 'Why use `@functools.wraps(f)` in a wrapper?', options: ['It speeds the function up', 'It copies f\'s name, docstring and metadata to the wrapper', 'It makes the function private', 'It adds logging'], answer: 1, why: 'Without it, help() and debuggers show "wrapper".' },
        { type: 'choice', q: 'How many nested functions does a decorator **with arguments** need?', options: ['One', 'Two', 'Three (factory, decorator, wrapper)', 'Four'], answer: 2, why: 'factory(args) -> decorator(f) -> wrapper(*a, **k).' },
        { type: 'choice', q: 'In `@a` over `@b` over `def f`, which is applied first?', options: ['a', 'b (closest to the function)', 'Both together', 'Neither'], answer: 1, why: 'Decorators apply bottom-up: f = a(b(f)).' },
        { type: 'type', q: 'Which two names does a wrapper take so it works with any function signature? (write them as `*x, **y`)', accept: ['*args, **kwargs', '*args,**kwargs'], why: '`*args, **kwargs` forward everything.' },
      ],
    },
    {
      id: 'py-context', title: 'Context managers', skill: 'Advanced', xp: 35, diff: 3,
      read: `
# What \`with\` really does

\`with\` guarantees *setup and teardown* around a block. Any object with \`__enter__\` and \`__exit__\` is a context manager.

~~~python
class Recorder:
    def __init__(self): self.events = []
    def __enter__(self):
        self.events.append("enter")
        return self                       # becomes the 'as' variable
    def __exit__(self, exc_type, exc, tb):
        self.events.append("exit")
        return False                      # False/None: let exceptions propagate
                                          # True: swallow the exception

with Recorder() as r:
    ...
~~~

\`__exit__\` runs **even if the block raised**; it receives the exception details (all \`None\` on success).

## The easy way: contextlib

~~~python
from contextlib import contextmanager, suppress, redirect_stdout
import io

@contextmanager
def temp_value(d, key, value):
    old = d.get(key)
    d[key] = value
    try:
        yield d                  # the block runs here
    finally:
        d[key] = old             # always restore

with suppress(FileNotFoundError):        # ignore one specific error
    open("/nope").read()

buf = io.StringIO()
with redirect_stdout(buf):               # capture print output
    print("hidden")
buf.getvalue()                           # 'hidden\\n'
~~~

> [!tip] Key idea
> Anything that must be undone (files, locks, temporary settings, transactions) belongs in a context manager.
`,
      task: 'Write class `Recorder(suppress=False)` (events list; `__enter__` records `"enter"`, `__exit__` records `"exit"` and, when `suppress=True`, swallows `ValueError`s only), a `@contextmanager` named `temp_item(d, key, value)` (sets then restores/removes the key, even on error) and `captured(fn)` returning everything `fn()` printed (use `redirect_stdout`).',
      starter: 'from contextlib import contextmanager, redirect_stdout\nimport io\n\n\nclass Recorder:\n    pass\n\n\ndef temp_item(d, key, value):\n    pass\n\n\ndef captured(fn):\n    pass\n',
      harness: r`
with Recorder() as rec:
    pass
assert rec.events == ["enter", "exit"]
with Recorder(suppress=True) as rec2:
    raise ValueError("swallowed")
assert rec2.events == ["enter", "exit"], "the ValueError must be suppressed"
try:
    with Recorder(suppress=True):
        raise KeyError("not suppressed")
except KeyError:
    pass
else:
    raise AssertionError("only ValueError is suppressed")
try:
    with Recorder() as rec3:
        raise ValueError("propagates")
except ValueError:
    assert rec3.events == ["enter", "exit"]
else:
    raise AssertionError("without suppress the error must propagate")
d = {"a": 1}
with temp_item(d, "a", 2):
    assert d["a"] == 2
assert d == {"a": 1}
with temp_item(d, "b", 5):
    assert d == {"a": 1, "b": 5}
assert d == {"a": 1}, "new keys must be removed again"
try:
    with temp_item(d, "a", 9):
        raise RuntimeError
except RuntimeError:
    pass
assert d == {"a": 1}, "restore even when the block fails"
assert captured(lambda: print("hi", 1)) == "hi 1\n" and captured(lambda: None) == ""
`,
      hints: ['`__exit__(self, exc_type, exc, tb)`: return `True` only if `self.suppress and exc_type is ValueError`.', 'A `@contextmanager` generator: save old state, `try: yield finally:` restore (delete the key if it did not exist before).', '`buf = io.StringIO(); with redirect_stdout(buf): fn()`'],
      solution: 'from contextlib import contextmanager, redirect_stdout\nimport io\n\n\nclass Recorder:\n    def __init__(self, suppress=False):\n        self.suppress = suppress\n        self.events = []\n\n    def __enter__(self):\n        self.events.append("enter")\n        return self\n\n    def __exit__(self, exc_type, exc, tb):\n        self.events.append("exit")\n        return self.suppress and exc_type is not None and issubclass(exc_type, ValueError)\n\n\n@contextmanager\ndef temp_item(d, key, value):\n    missing = key not in d\n    old = d.get(key)\n    d[key] = value\n    try:\n        yield d\n    finally:\n        if missing:\n            del d[key]\n        else:\n            d[key] = old\n\n\ndef captured(fn):\n    buf = io.StringIO()\n    with redirect_stdout(buf):\n        fn()\n    return buf.getvalue()',
      recall: [
        { type: 'choice', q: 'When does `__exit__` run?', options: ['Only on success', 'Always when leaving the with block, even after an exception', 'Only on error', 'Never automatically'], answer: 1, why: 'That is the whole point of a context manager.' },
        { type: 'choice', q: 'What does returning `True` from `__exit__` do?', options: ['Re-raises the exception', 'Suppresses the exception', 'Restarts the block', 'Nothing'], answer: 1, why: 'A truthy return value swallows the exception.' },
        { type: 'choice', q: 'In a `@contextmanager` function, where does the `with` block\'s code run?', options: ['Before the function', 'At the `yield`', 'After the function', 'In a new thread'], answer: 1, why: 'Everything before yield is setup; everything after is teardown.' },
        { type: 'choice', q: 'Which tool ignores one specific exception type inside a block?', options: ['contextlib.suppress', 'contextlib.ignore', 'try/else', 'assert'], answer: 0, why: '`with suppress(KeyError): ...`' },
        { type: 'type', q: 'Which `contextlib` function captures `print` output into a file-like object? (name only)', accept: ['redirect_stdout'], why: '`with redirect_stdout(buf): print(...)`.' },
      ],
    },
    {
      id: 'py-testing', title: 'Testing with unittest', skill: 'Advanced', xp: 40, diff: 3,
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
        { type: 'choice', q: 'What is a good test name?', options: ['test1', 'test_strips_leading_hyphens', 'check', 'it_works'], answer: 1, why: 'A failing test name should tell you what broke.' },
        { type: 'type', q: 'Which assertion method compares two values for equality? (name only)', accept: ['assertEqual', 'assertequal', 'self.assertEqual'], why: '`self.assertEqual(actual, expected)`.' },
      ],
    },
    {
      id: 'py-typing', title: 'Type hints & protocols', skill: 'Advanced', xp: 35, diff: 3,
      read: `
# Describing your code to humans and tools

Type hints are **annotations**. Python stores them but does **not** enforce them; tools like editors and \`mypy\` use them to catch mistakes early.

~~~python
from typing import Optional, Callable, TypedDict, Protocol, runtime_checkable, get_type_hints

def greet(name: str, times: int = 1) -> str:
    return (f"hi {name} " * times).strip()

def first(xs: list[int]) -> Optional[int]:      # same as int | None
    return xs[0] if xs else None

def apply(f: Callable[[int], int], x: int) -> int:
    return f(x)

get_type_hints(greet)     # {'name': str, 'times': int, 'return': str}
~~~

## TypedDict and Protocol

~~~python
class Movie(TypedDict):          # a dict with known keys and value types
    title: str
    year: int

@runtime_checkable
class SupportsGreet(Protocol):   # structural typing: formalised duck typing
    def greet(self) -> str: ...

class Dog:                       # no inheritance needed!
    def greet(self): return "woof"

isinstance(Dog(), SupportsGreet)     # True
~~~

Because hints are data, you can **read them at runtime** and build tools: validators, serializers, CLI generators, API frameworks.

> [!tip] Key idea
> A Protocol says "anything with these methods works". It is duck typing that a type checker can verify.
`,
      task: 'Write the decorator `typed` that reads the function\'s hints with `get_type_hints` and raises `TypeError(f"{param}: expected {type}, got {actual}")` (using `.__name__`) when a **positional** argument has the wrong type, and checks the return value against `return` (message `"return: expected ..., got ..."`). Define a runtime-checkable `Protocol` `SupportsGreet` (method `greet() -> str`) and `welcome(x)` returning `"Welcome, " + x.greet()` or raising `TypeError("cannot greet")` when x does not conform. Define `TypedDict` `Movie` (`title: str`, `year: int`).',
      starter: 'from typing import Protocol, TypedDict, get_type_hints, runtime_checkable\nimport inspect\nfrom functools import wraps\n\n\ndef typed(fn):\n    pass\n\n\nclass SupportsGreet:\n    pass\n\n\ndef welcome(x):\n    pass\n\n\nclass Movie:\n    pass\n',
      harness: r`
from typing import get_type_hints
@typed
def repeat(s: str, n: int) -> str:
    return s * n
assert repeat("ab", 2) == "abab"
for args, msg in [((1, 2), "s: expected str, got int"), (("a", "b"), "n: expected int, got str")]:
    try:
        repeat(*args)
    except TypeError as e:
        assert str(e) == msg, f"got {str(e)!r}, wanted {msg!r}"
    else:
        raise AssertionError(f"{args} should raise TypeError")
@typed
def bad() -> int:
    return "x"
try:
    bad()
except TypeError as e:
    assert str(e) == "return: expected int, got str", str(e)
else:
    raise AssertionError("return type must be checked")
assert repeat.__name__ == "repeat"
@typed
def untyped(a, b):
    return a + b
assert untyped(1, 2) == 3, "parameters without hints are not checked"
class Dog:
    def greet(self): return "woof"
class Rock:
    pass
assert isinstance(Dog(), SupportsGreet) and not isinstance(Rock(), SupportsGreet)
assert welcome(Dog()) == "Welcome, woof"
try:
    welcome(Rock())
except TypeError as e:
    assert str(e) == "cannot greet"
else:
    raise AssertionError("expected TypeError")
m: Movie = {"title": "Alien", "year": 1979}
assert get_type_hints(Movie) == {"title": str, "year": int} and m["year"] == 1979
`,
      hints: ['Inside `typed`: `hints = get_type_hints(fn)` and `names = list(inspect.signature(fn).parameters)`; zip names with the positional args.', 'Only check when the name is in `hints`. Use `isinstance(value, hints[name])`.', 'Decorate the Protocol class with `@runtime_checkable`; `class SupportsGreet(Protocol): def greet(self) -> str: ...`', '`class Movie(TypedDict): title: str; year: int`'],
      solution: 'from typing import Protocol, TypedDict, get_type_hints, runtime_checkable\nimport inspect\nfrom functools import wraps\n\n\ndef typed(fn):\n    hints = get_type_hints(fn)\n    names = list(inspect.signature(fn).parameters)\n\n    @wraps(fn)\n    def wrapper(*args, **kwargs):\n        for name, value in zip(names, args):\n            want = hints.get(name)\n            if want is not None and not isinstance(value, want):\n                raise TypeError(f"{name}: expected {want.__name__}, got {type(value).__name__}")\n        result = fn(*args, **kwargs)\n        want = hints.get("return")\n        if want is not None and not isinstance(result, want):\n            raise TypeError(f"return: expected {want.__name__}, got {type(result).__name__}")\n        return result\n    return wrapper\n\n\n@runtime_checkable\nclass SupportsGreet(Protocol):\n    def greet(self) -> str: ...\n\n\ndef welcome(x):\n    if not isinstance(x, SupportsGreet):\n        raise TypeError("cannot greet")\n    return "Welcome, " + x.greet()\n\n\nclass Movie(TypedDict):\n    title: str\n    year: int',
      recall: [
        { type: 'choice', q: 'Does Python enforce type hints at runtime?', options: ['Yes, always', 'No; they are metadata for tools and humans', 'Only for classes', 'Only in strict mode'], answer: 1, why: 'The interpreter stores annotations but ignores them.' },
        { type: 'choice', q: 'What does `Optional[int]` mean?', options: ['An int that is optional to import', 'int or None', 'A list of ints', 'Any number'], answer: 1, why: 'It is shorthand for `int | None`.' },
        { type: 'choice', q: 'What is a `Protocol`?', options: ['A network protocol', 'A set of methods an object must have, checked structurally rather than by inheritance', 'A kind of dataclass', 'A decorator'], answer: 1, why: 'Protocols formalise duck typing.' },
        { type: 'choice', q: 'Which function reads a function\'s hints at runtime?', options: ['typing.get_type_hints', 'typing.read', 'inspect.hints', 'dir'], answer: 0, why: '`get_type_hints(fn)` returns a dict.' },
        { type: 'type', q: 'Which `typing` class describes a dict with known string keys and typed values? (name only)', accept: ['TypedDict', 'typeddict'], why: '`class Movie(TypedDict): title: str; year: int`.' },
      ],
    },
    {
      id: 'py-search-sort', title: 'Searching, sorting & Big-O', skill: 'Algorithms', xp: 40, diff: 3,
      read: `
# How fast is fast enough?

**Big-O** describes how work grows with input size n.

| Class | Example | n = 1,000,000 |
|---|---|---|
| O(1) | dict lookup | 1 step |
| O(log n) | binary search | ~20 steps |
| O(n) | scan a list | 1,000,000 |
| O(n log n) | good sorting | ~20,000,000 |
| O(n²) | nested loops | 1,000,000,000,000 |

## Binary search: halve the problem

On a **sorted** list, compare with the middle and discard half each time.

~~~python
def binary_search(xs, target):
    lo, hi = 0, len(xs) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if xs[mid] == target: return mid
        if xs[mid] < target: lo = mid + 1
        else: hi = mid - 1
    return -1
~~~

## Sorting

- **Insertion sort**: grow a sorted prefix by inserting each item into place. O(n²), but stable and great for tiny or nearly sorted data.
- **Merge sort**: split in half, sort each recursively, **merge** two sorted lists. O(n log n).

~~~python
def merge(a, b):                  # a, b sorted
    out, i, j = [], 0, 0
    while i < len(a) and j < len(b):
        if a[i] <= b[j]: out.append(a[i]); i += 1    # <= keeps it stable
        else:            out.append(b[j]); j += 1
    return out + a[i:] + b[j:]
~~~

In real code use \`sorted()\` (Timsort, O(n log n)) and \`bisect\`. You implement these once to understand them.

> [!tip] Key idea
> Choosing the right algorithm or data structure usually beats micro-optimising code.
`,
      task: 'Without using `sorted()` or `.sort()`: write `binary_search(xs, target)` (index or -1; must read only O(log n) items), `insertion_sort(xs, key=None)` (returns a new **stable** sorted list; optional key function) and `merge_sort(xs)` (recursive, returns a new list, input unchanged).',
      starter: 'def binary_search(xs, target):\n    pass\n\n\ndef insertion_sort(xs, key=None):\n    pass\n\n\ndef merge_sort(xs):\n    pass\n',
      harness: r`
class Counting(list):
    reads = 0
    def __getitem__(self, i):
        Counting.reads += 1
        return super().__getitem__(i)
big = Counting(range(0, 200000, 2))
Counting.reads = 0
assert binary_search(big, 123456) == 61728
assert Counting.reads <= 50, f"binary search read {Counting.reads} items; it should halve the range each time (a linear scan reads ~60,000)"
assert binary_search(big, 7) == -1 and binary_search([], 1) == -1 and binary_search([5], 5) == 0
assert insertion_sort([3, 1, 2]) == [1, 2, 3] and insertion_sort([]) == []
recs = [(1, "a"), (0, "b"), (1, "c"), (0, "d")]
assert insertion_sort(recs, key=lambda t: t[0]) == [(0, "b"), (0, "d"), (1, "a"), (1, "c")], "must be stable"
data = [5, 2, 9, 1, 5, 6]
assert merge_sort(data) == [1, 2, 5, 5, 6, 9] and data == [5, 2, 9, 1, 5, 6], "do not modify the input"
import random
rng = random.Random(1)
xs = [rng.randint(0, 999) for _ in range(500)]
assert merge_sort(xs) == sorted(xs) and insertion_sort(xs) == sorted(xs)
`,
      forbid: [{ re: '\\bsorted\\(|\\.sort\\(', msg: 'Do not use sorted() or .sort(); write the algorithms yourself.' }],
      hints: ['Binary search: keep `lo`/`hi` and compute `mid = (lo + hi) // 2` in a loop.', 'Insertion sort: for each item find its place by walking left while the previous key is **greater** (strictly) so equal items keep order.', 'Merge sort: base case `len(xs) <= 1`; split with slices; merge with the two-pointer loop using `<=`.'],
      solution: 'def binary_search(xs, target):\n    lo, hi = 0, len(xs) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if xs[mid] == target:\n            return mid\n        if xs[mid] < target:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return -1\n\n\ndef insertion_sort(xs, key=None):\n    key = key or (lambda v: v)\n    out = []\n    for item in xs:\n        i = len(out)\n        while i > 0 and key(out[i - 1]) > key(item):\n            i -= 1\n        out.insert(i, item)\n    return out\n\n\ndef merge_sort(xs):\n    if len(xs) <= 1:\n        return list(xs)\n    mid = len(xs) // 2\n    a, b = merge_sort(xs[:mid]), merge_sort(xs[mid:])\n    out, i, j = [], 0, 0\n    while i < len(a) and j < len(b):\n        if a[i] <= b[j]:\n            out.append(a[i])\n            i += 1\n        else:\n            out.append(b[j])\n            j += 1\n    return out + a[i:] + b[j:]',
      recall: [
        { type: 'choice', q: 'What precondition does binary search need?', options: ['A small list', 'A sorted sequence', 'Unique items', 'A dictionary'], answer: 1, why: 'Halving only works if order tells you which half to discard.' },
        { type: 'choice', q: 'Roughly how many steps does binary search take for 1,000,000 items?', options: ['20', '1,000', '500,000', '1,000,000'], answer: 0, why: 'log2(1,000,000) is about 20.' },
        { type: 'choice', q: 'What does "stable sort" mean?', options: ['It never crashes', 'Equal items keep their original relative order', 'It sorts in place', 'It is O(n)'], answer: 1, why: 'Stability matters when sorting by one key after another.' },
        { type: 'choice', q: 'What is the time complexity of merge sort?', options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'], answer: 1, why: 'log n levels of splitting, n work to merge at each level.' },
        { type: 'type', q: 'What is the Big-O of looking up a key in a dict, on average? (e.g. O(n))', accept: ['O(1)', 'o(1)', 'constant'], why: 'Hash lookups take constant time.' },
      ],
    },
    {
      id: 'py-datastructs', title: 'Stacks, queues, heaps & graphs', skill: 'Algorithms', xp: 40, diff: 3,
      read: `
# Choosing the right container

| Structure | Python tool | Great for |
|---|---|---|
| Stack (LIFO) | \`list\` (append/pop) | undo, parsing brackets, DFS |
| Queue (FIFO) | \`collections.deque\` | task lines, BFS |
| Priority queue | \`heapq\` | "give me the smallest/most urgent next" |
| Sorted list | \`bisect.insort\` | keep order while inserting |
| Graph | \`dict\` of neighbour lists | maps, dependencies, networks |

## Stack: balanced brackets

~~~python
pairs = {")": "(", "]": "["}
stack = []
for ch in text:
    if ch in "([": stack.append(ch)
    elif ch in pairs:
        if not stack or stack.pop() != pairs[ch]: return False
return not stack
~~~

## heapq: a min-heap in a list

~~~python
import heapq
h = []
heapq.heappush(h, (2, "write")); heapq.heappush(h, (1, "plan"))
heapq.heappop(h)              # (1, 'plan')   smallest first, O(log n)
heapq.nsmallest(2, [5, 1, 4]); heapq.nlargest(2, [5, 1, 4])
list(heapq.merge([1, 4], [2, 3]))     # merge sorted inputs lazily
~~~

## Breadth-first search

BFS explores a graph level by level using a **queue**, so the first time it reaches a node is via a shortest path (fewest edges).

~~~python
from collections import deque
graph = {"a": ["b", "c"], "b": ["d"], "c": ["d"], "d": []}
queue, seen = deque(["a"]), {"a"}
while queue:
    node = queue.popleft()
    for nxt in graph[node]:
        if nxt not in seen:
            seen.add(nxt); queue.append(nxt)
~~~
`,
      task: 'Write `balanced(s)` (brackets `()[]{}` properly nested, ignore other characters), `bfs_shortest(graph, start, goal)` (a shortest path as a list of nodes, or `None`), `top_k(nums, k)` (k largest, descending, with `heapq`) and `merge_sorted(*lists)` (one sorted list using `heapq.merge`).',
      starter: 'import heapq\nfrom collections import deque\n\n\ndef balanced(s):\n    pass\n\n\ndef bfs_shortest(graph, start, goal):\n    pass\n\n\ndef top_k(nums, k):\n    pass\n\n\ndef merge_sorted(*lists):\n    pass\n',
      harness: r`
assert balanced("([]{})") and balanced("a(b)c") and balanced("") and not balanced("(]") and not balanced("((") and not balanced("())") and not balanced("}{")
g = {"a": ["b", "c"], "b": ["d"], "c": ["d", "e"], "d": ["f"], "e": ["f"], "f": [], "z": []}
p = bfs_shortest(g, "a", "f")
assert p[0] == "a" and p[-1] == "f" and len(p) == 4, f"got {p!r}"
assert bfs_shortest(g, "a", "a") == ["a"] and bfs_shortest(g, "a", "z") is None
assert bfs_shortest({"x": ["y"], "y": ["x"]}, "x", "y") == ["x", "y"], "cycles must not loop forever"
assert top_k([5, 1, 9, 3, 7], 3) == [9, 7, 5] and top_k([1], 5) == [1] and top_k([], 2) == []
assert merge_sorted([1, 4, 9], [2, 3], [0, 10]) == [0, 1, 2, 3, 4, 9, 10] and merge_sorted() == []
`,
      must: [{ re: 'heapq', msg: 'Use heapq for top_k / merge_sorted.' }, { re: 'deque', msg: 'Use a deque for the BFS queue.' }],
      hints: ['Push openers on a list; when a closer arrives the top of the stack must be its partner.', 'BFS: store each node\'s parent (or the whole path) in a dict as you discover it; stop when you reach the goal.', '`heapq.nlargest(k, nums)` returns descending order.', '`list(heapq.merge(*lists))`'],
      solution: 'import heapq\nfrom collections import deque\n\n\ndef balanced(s):\n    pairs = {")": "(", "]": "[", "}": "{"}\n    stack = []\n    for ch in s:\n        if ch in "([{":\n            stack.append(ch)\n        elif ch in pairs:\n            if not stack or stack.pop() != pairs[ch]:\n                return False\n    return not stack\n\n\ndef bfs_shortest(graph, start, goal):\n    queue = deque([start])\n    parent = {start: None}\n    while queue:\n        node = queue.popleft()\n        if node == goal:\n            path = []\n            while node is not None:\n                path.append(node)\n                node = parent[node]\n            return path[::-1]\n        for nxt in graph.get(node, []):\n            if nxt not in parent:\n                parent[nxt] = node\n                queue.append(nxt)\n    return None\n\n\ndef top_k(nums, k):\n    return heapq.nlargest(k, nums)\n\n\ndef merge_sorted(*lists):\n    return list(heapq.merge(*lists))',
      recall: [
        { type: 'choice', q: 'Which structure does BFS use to explore a graph?', options: ['Stack', 'Queue', 'Heap', 'Set only'], answer: 1, why: 'A FIFO queue explores level by level.' },
        { type: 'choice', q: 'What does `heapq.heappop(h)` return from a min-heap?', options: ['The largest item', 'The smallest item', 'The last item pushed', 'A random item'], answer: 1, why: 'A min-heap always pops the smallest.' },
        { type: 'choice', q: 'Why use `deque.popleft()` instead of `list.pop(0)`?', options: ['It looks nicer', 'popleft is O(1); pop(0) is O(n)', 'pop(0) is deprecated', 'No difference'], answer: 1, why: 'Removing from the front of a list shifts everything.' },
        { type: 'choice', q: 'A stack is...', options: ['First in, first out', 'Last in, first out', 'Sorted', 'Random access only'], answer: 1, why: 'LIFO: the most recently added item leaves first.' },
        { type: 'type', q: 'Which module provides a priority queue / heap? (name only)', accept: ['heapq'], why: '`heapq`.' },
      ],
    },
    {
      id: 'py-advanced', title: 'Advanced objects: descriptors, __slots__ & hooks', skill: 'Advanced', xp: 40, diff: 3,
      read: `
# Under the hood

Python lets objects customise attribute access, class creation and memory layout.

## __getattr__ (fallback lookup)

~~~python
class Config:
    def __init__(self, **values): self._values = values
    def __getattr__(self, name):         # only called when normal lookup FAILS
        try: return self._values[name]
        except KeyError: raise AttributeError(name) from None
~~~

## Descriptors

An object with \`__get__\`/\`__set__\` placed on a class controls how an attribute behaves (this is how \`property\` itself works). \`__set_name__\` tells it the attribute's name.

~~~python
class Positive:
    def __set_name__(self, owner, name): self.name = "_" + name
    def __get__(self, obj, objtype=None):
        return self if obj is None else getattr(obj, self.name)
    def __set__(self, obj, value):
        if value <= 0: raise ValueError("must be positive")
        setattr(obj, self.name, value)

class Order:
    qty = Positive()       # one descriptor object shared by all Orders
~~~

## __init_subclass__ (a registry for free)

~~~python
class Plugin:
    registry = {}
    def __init_subclass__(cls, **kw):    # runs when a subclass is DEFINED
        super().__init_subclass__(**kw)
        Plugin.registry[cls.__name__.lower()] = cls
~~~

## __slots__ and cached_property

~~~python
class Point:
    __slots__ = ("x", "y")       # no per-instance __dict__: less memory, no stray attributes

from functools import cached_property
class Report:
    @cached_property
    def data(self):               # computed once, then stored on the instance
        return expensive()
~~~

> [!warn] Use sparingly
> These are power tools for libraries and frameworks. Reach for plain classes first.
`,
      task: 'Write `Config(**values)` (read access via attributes with `__getattr__`, missing names raise `AttributeError`), descriptor `Positive` + `Order` with `qty` and `price` positive attributes (error message `"<name> must be positive"`), base class `Plugin` whose `__init_subclass__` registers every subclass in `Plugin.registry` under its lowercase class name, `Point` with `__slots__ = ("x", "y")`, and `Report` with a `cached_property` named `data` that calls `self.compute()` only once.',
      starter: 'from functools import cached_property\n\n\nclass Config:\n    pass\n\n\nclass Positive:\n    pass\n\n\nclass Order:\n    pass\n\n\nclass Plugin:\n    pass\n\n\nclass Point:\n    pass\n\n\nclass Report:\n    pass\n',
      harness: r`
c = Config(host="x", port=80)
assert c.host == "x" and c.port == 80
try:
    c.missing
except AttributeError:
    pass
else:
    raise AssertionError("missing setting must raise AttributeError")
assert getattr(c, "nope", "dflt") == "dflt", "getattr default must work (needs AttributeError)"
o = Order(2, 9.5)
assert (o.qty, o.price) == (2, 9.5)
for attr in ("qty", "price"):
    try:
        setattr(o, attr, 0)
    except ValueError as e:
        assert str(e) == f"{attr} must be positive", str(e)
    else:
        raise AssertionError(f"{attr} must be validated")
try:
    Order(-1, 5)
except ValueError:
    pass
else:
    raise AssertionError("constructor must validate")
o2 = Order(7, 1)
assert o.qty == 2 and o2.qty == 7, "values are per instance"
assert isinstance(Order.__dict__["qty"], Positive)
class Csv(Plugin):
    pass
class Json(Plugin):
    pass
assert Plugin.registry == {"csv": Csv, "json": Json}, f"got {Plugin.registry!r}"
p = Point(1, 2)
assert (p.x, p.y) == (1, 2) and not hasattr(p, "__dict__")
try:
    p.z = 3
except AttributeError:
    pass
else:
    raise AssertionError("slots must forbid new attributes")
calls = []
class R2(Report):
    def compute(self):
        calls.append(1)
        return [1, 2, 3]
rep = R2()
assert rep.data == [1, 2, 3] and rep.data == [1, 2, 3] and calls == [1], "compute must run once"
assert isinstance(Report.__dict__["data"], cached_property)
`,
      hints: ['`__getattr__` receives the missing name; look in `self._values` (careful: set it via `self.__dict__` / normal assignment in `__init__`).', 'Descriptor: `__set_name__` saves the name; `__set__` validates then stores on the instance under a different key like `_qty`.', '`__init_subclass__(cls, **kw)` adds `Plugin.registry[cls.__name__.lower()] = cls`; define `registry = {}` on Plugin.', '`@cached_property def data(self): return self.compute()`'],
      solution: 'from functools import cached_property\n\n\nclass Config:\n    def __init__(self, **values):\n        self._values = values\n\n    def __getattr__(self, name):\n        if name == "_values":\n            raise AttributeError(name)\n        try:\n            return self._values[name]\n        except KeyError:\n            raise AttributeError(f"no setting {name!r}") from None\n\n\nclass Positive:\n    def __set_name__(self, owner, name):\n        self.public = name\n        self.private = "_" + name\n\n    def __get__(self, obj, objtype=None):\n        if obj is None:\n            return self\n        return getattr(obj, self.private)\n\n    def __set__(self, obj, value):\n        if value <= 0:\n            raise ValueError(f"{self.public} must be positive")\n        setattr(obj, self.private, value)\n\n\nclass Order:\n    qty = Positive()\n    price = Positive()\n\n    def __init__(self, qty, price):\n        self.qty = qty\n        self.price = price\n\n\nclass Plugin:\n    registry = {}\n\n    def __init_subclass__(cls, **kwargs):\n        super().__init_subclass__(**kwargs)\n        Plugin.registry[cls.__name__.lower()] = cls\n\n\nclass Point:\n    __slots__ = ("x", "y")\n\n    def __init__(self, x, y):\n        self.x = x\n        self.y = y\n\n\nclass Report:\n    @cached_property\n    def data(self):\n        return self.compute()',
      recall: [
        { type: 'choice', q: 'When is `__getattr__` called?', options: ['On every attribute access', 'Only when normal lookup fails', 'Only for methods', 'When an attribute is set'], answer: 1, why: '`__getattribute__` handles every access; `__getattr__` is the fallback.' },
        { type: 'choice', q: 'What is a descriptor?', options: ['A docstring', 'An object with __get__/__set__ placed on a class to control attribute access', 'A comment style', 'A test helper'], answer: 1, why: '`property` is implemented as a descriptor.' },
        { type: 'choice', q: 'What does `__slots__` do?', options: ['Adds threads', 'Removes the per-instance __dict__, saving memory and forbidding new attributes', 'Makes methods private', 'Speeds up imports'], answer: 1, why: 'Instances only get the named slots.' },
        { type: 'choice', q: 'When does `__init_subclass__` run?', options: ['When an instance is created', 'When a subclass is defined', 'At import of the parent only', 'Never automatically'], answer: 1, why: 'It is a hook called on the parent at class-definition time.' },
        { type: 'type', q: 'Which `functools` decorator computes a property once and caches it on the instance? (name only)', accept: ['cached_property'], why: '`@cached_property`.' },
      ],
    },
    {
      id: 'py-capstone', title: 'Capstone: Dungeon Battle', skill: 'Projects', xp: 150, diff: 3, capstone: true,
      read: `
# Build a small game engine

Time to combine everything: **inheritance**, **polymorphism**, **properties**, **JSON persistence**, **seeded randomness**, **sorting with keys** and **testing by invariants**.

## The design

~~~
Entity            name, hp, attack, alive, take_damage(), attack_power(turn)
 ├─ Player        level, xp, potions, max_hp; gain_xp(), use_potion()
 └─ Monster       xp_reward
     ├─ Goblin    30 hp,  attack 6,  rewards 40 xp
     └─ Dragon    120 hp, attack 14, rewards 150 xp; hits DOUBLE every 3rd turn
~~~

**Rules**

- \`take_damage(n)\` never takes hp below 0. \`alive\` is a property (hp > 0).
- A new \`Player(name)\` has 100 hp, attack 10, \`max_hp\` 100, level 1, xp 0, 2 potions.
- \`gain_xp(n)\` adds xp; every 100 xp is a level-up (**xp rolls over**): level +1, attack +2, max_hp +10, hp refilled to max_hp. It returns how many levels were gained.
- \`use_potion()\`: if the player is alive and has a potion, spend it and heal 30 (never above max_hp) and return \`True\`; otherwise \`False\`.
- \`attack_power(turn=1)\` returns \`attack\`; a Dragon returns double on every turn divisible by 3.

**battle(player, monster, seed)** uses \`rng = random.Random(seed)\` and loops over turns starting at 1:

1. If the player's hp is 20 or less, they \`use_potion()\` first (if they can).
2. The player hits for \`attack_power(turn) + rng.randint(0, 3)\`.
3. If the monster is still alive it hits back for \`attack_power(turn) + rng.randint(0, 2)\`.
4. Repeat until someone is dead. Return \`{"winner": "player" | "monster", "turns": n}\`. If the player wins they gain the monster's \`xp_reward\`.

**Persistence:** \`save_game(player, path)\` writes JSON; \`load_game(path)\` returns an equivalent \`Player\`. **leaderboard(players)** returns names ordered by level, then xp (both descending), then name.

> [!tip] Plan it
> Start with \`Entity\`, get its tests passing, then each subclass. Run often, and use the hints if you get stuck.
`,
      task: 'Implement the whole engine described in the reading: `Entity`, `Player`, `Monster`, `Goblin`, `Dragon`, `battle(player, monster, seed)`, `save_game`, `load_game` and `leaderboard`.',
      starter: 'import json\nimport random\n\n\nclass Entity:\n    pass\n\n\nclass Player(Entity):\n    pass\n\n\nclass Monster(Entity):\n    xp_reward = 0\n\n\nclass Goblin(Monster):\n    pass\n\n\nclass Dragon(Monster):\n    pass\n\n\ndef battle(player, monster, seed):\n    pass\n\n\ndef save_game(player, path):\n    pass\n\n\ndef load_game(path):\n    pass\n\n\ndef leaderboard(players):\n    pass\n',
      harness: r`
import json, os, tempfile
# --- Entity basics and inheritance
assert issubclass(Player, Entity) and issubclass(Monster, Entity) and issubclass(Goblin, Monster) and issubclass(Dragon, Monster)
e = Entity("Rock", 10, 1)
assert e.alive is True and str(e) == "Rock (10 HP)"
e.take_damage(4); assert e.hp == 6
e.take_damage(99); assert e.hp == 0 and e.alive is False
# --- Player
p = Player("Ada")
assert (p.hp, p.attack, p.max_hp, p.level, p.xp, p.potions) == (100, 10, 100, 1, 0, 2)
assert p.gain_xp(50) == 0 and p.xp == 50 and p.level == 1
assert p.gain_xp(250) == 3 and p.level == 4 and p.xp == 0 and p.attack == 16 and p.max_hp == 130 and p.hp == 130
q = Player("Bo"); q.take_damage(70)
assert q.use_potion() is True and q.hp == 60 and q.potions == 1
q.use_potion(); assert q.potions == 0 and q.use_potion() is False
r = Player("Cy"); r.take_damage(10); r.use_potion(); assert r.hp == 100, "healing is capped at max_hp"
dead = Player("D"); dead.take_damage(1000); assert dead.use_potion() is False
# --- Monsters
g, d = Goblin(), Dragon()
assert (g.name, g.hp, g.attack, g.xp_reward) == ("Goblin", 30, 6, 40) and (d.name, d.hp, d.attack, d.xp_reward) == ("Dragon", 120, 14, 150)
assert d.attack_power(1) == 14 and d.attack_power(3) == 28 and d.attack_power(6) == 28 and g.attack_power(3) == 6 and g.attack_power() == 6
# --- Battle: reproducible, valid, and sensible
def fight(seed, monster, hp=100, attack=10):
    pl = Player("T"); pl.hp = hp; pl.attack = attack
    res = battle(pl, monster, seed)
    return pl, monster, res
p1, m1, r1 = fight(5, Goblin())
p2, m2, r2 = fight(5, Goblin())
assert r1 == r2 and (p1.hp, m1.hp) == (p2.hp, m2.hp), "same seed must give the same battle"
assert r1["winner"] in ("player", "monster") and r1["turns"] >= 1 and p1.hp >= 0 and m1.hp >= 0
assert not (p1.alive and m1.alive), "someone must have died"
ps, ms, rs = fight(1, Dragon(), attack=1000)
assert rs == {"winner": "player", "turns": 1} and ps.xp == 50 and ps.level == 2 and not ms.alive, f"got {rs} xp={ps.xp} level={ps.level} (150 xp = one level-up plus 50 left over)"
pw, mw, rw = fight(1, Dragon(), hp=1, attack=1)
assert rw["winner"] == "monster" and not pw.alive and mw.alive and pw.xp == 0
assert pw.potions == 0, "a dying player should have used the potions"
# --- Persistence
hero = Player("Ada"); hero.gain_xp(130); hero.take_damage(10); hero.potions = 1
path = os.path.join(tempfile.mkdtemp(), "save.json")
save_game(hero, path)
data = json.load(open(path))
assert data["name"] == "Ada", "save file must be real JSON containing the name"
back = load_game(path)
assert isinstance(back, Player) and back is not hero
for f in ("name", "hp", "attack", "max_hp", "level", "xp", "potions"):
    assert getattr(back, f) == getattr(hero, f), f"{f} was not saved/loaded correctly"
# --- Leaderboard
a, b, c, dd = Player("Zed"), Player("Amy"), Player("Bob"), Player("Cat")
a.gain_xp(100); b.gain_xp(50); c.gain_xp(100); dd.gain_xp(150)
assert leaderboard([a, b, c, dd]) == ["Cat", "Bob", "Zed", "Amy"], f"got {leaderboard([a, b, c, dd])!r}"
assert leaderboard([]) == []
`,
      hints: ['Start with `Entity.__init__(self, name, hp, attack)`, an `alive` property, and `__str__` -> `"Name (hp HP)"`.', 'Player: call `super().__init__(name, 100, 10)` then set `max_hp`, `level`, `xp`, `potions`. In `gain_xp` use a `while self.xp >= 100` loop and count levels.', 'Dragon: `def attack_power(self, turn=1): return self.attack * (2 if turn % 3 == 0 else 1)`. Give Monster subclasses their own `__init__` calling `super().__init__("Goblin", 30, 6)`.', 'battle: write the loop exactly as the numbered rules say; the potion check comes *before* the player\'s attack each turn.', 'save: `json.dump({...fields...}, f)`; load: build `Player(data["name"])` and set every field.', 'leaderboard: `[p.name for p in sorted(players, key=lambda p: (-p.level, -p.xp, p.name))]`'],
      solution: 'import json\nimport random\n\n\nclass Entity:\n    def __init__(self, name, hp, attack):\n        self.name = name\n        self.hp = hp\n        self.attack = attack\n\n    @property\n    def alive(self):\n        return self.hp > 0\n\n    def take_damage(self, n):\n        self.hp = max(0, self.hp - n)\n\n    def attack_power(self, turn=1):\n        return self.attack\n\n    def __str__(self):\n        return f"{self.name} ({self.hp} HP)"\n\n\nclass Player(Entity):\n    def __init__(self, name):\n        super().__init__(name, 100, 10)\n        self.max_hp = 100\n        self.level = 1\n        self.xp = 0\n        self.potions = 2\n\n    def gain_xp(self, n):\n        self.xp += n\n        gained = 0\n        while self.xp >= 100:\n            self.xp -= 100\n            self.level += 1\n            self.attack += 2\n            self.max_hp += 10\n            self.hp = self.max_hp\n            gained += 1\n        return gained\n\n    def use_potion(self):\n        if not self.alive or self.potions <= 0:\n            return False\n        self.potions -= 1\n        self.hp = min(self.max_hp, self.hp + 30)\n        return True\n\n\nclass Monster(Entity):\n    xp_reward = 0\n\n\nclass Goblin(Monster):\n    xp_reward = 40\n\n    def __init__(self):\n        super().__init__("Goblin", 30, 6)\n\n\nclass Dragon(Monster):\n    xp_reward = 150\n\n    def __init__(self):\n        super().__init__("Dragon", 120, 14)\n\n    def attack_power(self, turn=1):\n        return self.attack * (2 if turn % 3 == 0 else 1)\n\n\ndef battle(player, monster, seed):\n    rng = random.Random(seed)\n    turn = 1\n    while player.alive and monster.alive:\n        if player.hp <= 20:\n            player.use_potion()\n        monster.take_damage(player.attack_power(turn) + rng.randint(0, 3))\n        if monster.alive:\n            player.take_damage(monster.attack_power(turn) + rng.randint(0, 2))\n        turn += 1\n    winner = "player" if player.alive else "monster"\n    if winner == "player":\n        player.gain_xp(monster.xp_reward)\n    return {"winner": winner, "turns": turn - 1}\n\n\nFIELDS = ("name", "hp", "attack", "max_hp", "level", "xp", "potions")\n\n\ndef save_game(player, path):\n    with open(path, "w") as f:\n        json.dump({k: getattr(player, k) for k in FIELDS}, f)\n\n\ndef load_game(path):\n    with open(path) as f:\n        data = json.load(f)\n    p = Player(data["name"])\n    for k in FIELDS:\n        setattr(p, k, data[k])\n    return p\n\n\ndef leaderboard(players):\n    return [p.name for p in sorted(players, key=lambda p: (-p.level, -p.xp, p.name))]',
      recall: [
        { type: 'choice', q: 'Why does `Dragon` override `attack_power` instead of `battle` special-casing dragons?', options: ['Polymorphism: battle works for any Monster without knowing its type', 'It is shorter', 'battle cannot call methods', 'Dragons are not Entities'], answer: 0, why: 'Adding a new monster type needs no change to battle().' },
        { type: 'choice', q: 'Why pass a `seed` to `battle` instead of calling `random.randint` directly?', options: ['Speed', 'So a fight can be reproduced exactly (tests, replays, bug reports)', 'Seeds make it fairer', 'It is required by random'], answer: 1, why: 'Determinism makes randomness testable.' },
        { type: 'choice', q: 'Which design choice lets you save a Player without a database?', options: ['Pickling the class', 'Serialising its fields to JSON', 'Using globals', 'Subclassing dict'], answer: 1, why: 'JSON is a simple, portable text format.' },
        { type: 'choice', q: 'What does `sorted(players, key=lambda p: (-p.level, -p.xp, p.name))` do?', options: ['Sorts only by name', 'Level desc, then xp desc, then name ascending', 'Raises an error', 'Sorts ascending by level'], answer: 1, why: 'Negating numbers reverses their order inside a tuple key.' },
        { type: 'choice', q: 'Where should the shared setup (`name`, `hp`, `attack`) live?', options: ['Duplicated in every subclass', 'In Entity.__init__, called via super() from subclasses', 'In global variables', 'In battle()'], answer: 1, why: 'Inheritance exists to share exactly this.' },
      ],
    },
  ]);

  LP.addDrills({
    'py-generators': [
      { title: 'Evens forever', task: 'Write an infinite generator `evens()` producing 0, 2, 4, ...', starter: 'def evens():\n    pass\n', harness: r`
from itertools import islice
import inspect
assert inspect.isgeneratorfunction(evens) and list(islice(evens(), 5)) == [0, 2, 4, 6, 8]
`, hints: ['`n = 0` then `while True: yield n; n += 2`.'], solution: 'def evens():\n    n = 0\n    while True:\n        yield n\n        n += 2' },
      { title: 'Lazy pipeline', task: 'Write `pipeline(nums)` returning a list of the squares of the **positive** numbers, built from generator expressions chained lazily (no intermediate list).', starter: 'def pipeline(nums):\n    pass\n', harness: r`
assert pipeline([3, -1, 0, 4]) == [9, 16] and pipeline([]) == []
`, must: [{ re: '\\(.+for .+ in ', msg: 'Use generator expressions (parentheses).' }], hints: ['`positives = (n for n in nums if n > 0)`; `squares = (n * n for n in positives)`; `list(squares)`.'], solution: 'def pipeline(nums):\n    positives = (n for n in nums if n > 0)\n    squares = (n * n for n in positives)\n    return list(squares)' },
      { title: 'Pairwise', task: 'Write generator `pairwise(iterable)` yielding consecutive pairs `(a, b)`; it must work on any iterator (no indexing).', starter: 'def pairwise(iterable):\n    pass\n', harness: r`
import inspect
assert inspect.isgeneratorfunction(pairwise)
assert list(pairwise([1, 2, 3, 4])) == [(1, 2), (2, 3), (3, 4)] and list(pairwise([1])) == [] and list(pairwise(iter("abc"))) == [("a", "b"), ("b", "c")]
`, hints: ['`it = iter(iterable)`; remember `prev = next(it, None)`...'], solution: 'def pairwise(iterable):\n    it = iter(iterable)\n    try:\n        prev = next(it)\n    except StopIteration:\n        return\n    for cur in it:\n        yield prev, cur\n        prev = cur' },
    ],
    'py-decorators': [
      { title: 'Shouting', task: 'Write decorator `uppercase` that upper-cases a function\'s string result.', starter: 'from functools import wraps\n\n\ndef uppercase(f):\n    pass\n', harness: r`
@uppercase
def hi(name):
    """greets"""
    return "hi " + name
assert hi("ada") == "HI ADA" and hi.__name__ == "hi" and hi.__doc__ == "greets"
`, hints: ['Wrapper calls `f(*args, **kwargs).upper()`; use `@wraps`.'], solution: 'from functools import wraps\n\n\ndef uppercase(f):\n    @wraps(f)\n    def wrapper(*args, **kwargs):\n        return f(*args, **kwargs).upper()\n    return wrapper' },
      { title: 'Call counter', task: 'Write decorator `count_calls` exposing the number of calls as `wrapper.count`.', starter: 'from functools import wraps\n\n\ndef count_calls(f):\n    pass\n', harness: r`
@count_calls
def f(): return 1
assert f.count == 0
f(); f(); f()
assert f.count == 3
@count_calls
def g(): pass
g()
assert g.count == 1 and f.count == 3
`, hints: ['Initialise `wrapper.count = 0` after defining the wrapper; increment inside.'], solution: 'from functools import wraps\n\n\ndef count_calls(f):\n    @wraps(f)\n    def wrapper(*args, **kwargs):\n        wrapper.count += 1\n        return f(*args, **kwargs)\n    wrapper.count = 0\n    return wrapper' },
      { title: 'Retry decorator', task: 'Write decorator factory `retry(times)`: call the function up to `times` times until it succeeds; re-raise the last exception if all attempts fail.', starter: 'from functools import wraps\n\n\ndef retry(times):\n    pass\n', harness: r`
n = {"c": 0}
@retry(3)
def flaky():
    n["c"] += 1
    if n["c"] < 3:
        raise RuntimeError("no")
    return "yes"
assert flaky() == "yes" and n["c"] == 3
m = {"c": 0}
@retry(2)
def hopeless():
    m["c"] += 1
    raise ValueError("always")
try:
    hopeless()
except ValueError:
    assert m["c"] == 2
else:
    raise AssertionError("should re-raise")
`, hints: ['Three levels: `retry(times)` -> `decorator(f)` -> `wrapper(*a, **k)`.'], solution: 'from functools import wraps\n\n\ndef retry(times):\n    def decorator(f):\n        @wraps(f)\n        def wrapper(*args, **kwargs):\n            for attempt in range(times):\n                try:\n                    return f(*args, **kwargs)\n                except Exception:\n                    if attempt == times - 1:\n                        raise\n        return wrapper\n    return decorator' },
    ],
    'py-context': [
      { title: 'Ignore a missing key', task: 'Write `lookup(d, key)` returning `d[key]` or `None`, using `contextlib.suppress` (no `get`, no `in`).', starter: 'from contextlib import suppress\n\n\ndef lookup(d, key):\n    pass\n', harness: r`
assert lookup({"a": 1}, "a") == 1 and lookup({}, "x") is None
`, must: [{ re: 'suppress', msg: 'Use contextlib.suppress.' }], hints: ['`with suppress(KeyError): return d[key]` then `return None` after the block.'], solution: 'from contextlib import suppress\n\n\ndef lookup(d, key):\n    with suppress(KeyError):\n        return d[key]\n    return None' },
      { title: 'Temporarily appended', task: 'Write `@contextmanager` `appended(lst, item)`: the item is in the list inside the block and removed afterwards, even on error.', starter: 'from contextlib import contextmanager\n\n\ndef appended(lst, item):\n    pass\n', harness: r`
xs = [1]
with appended(xs, 2):
    assert xs == [1, 2]
assert xs == [1]
try:
    with appended(xs, 9):
        raise RuntimeError
except RuntimeError:
    pass
assert xs == [1]
`, hints: ['`lst.append(item)`, `try: yield finally: lst.remove(item)`.'], solution: 'from contextlib import contextmanager\n\n\n@contextmanager\ndef appended(lst, item):\n    lst.append(item)\n    try:\n        yield lst\n    finally:\n        lst.remove(item)' },
      { title: 'Transaction', task: 'Write class `Transaction` as a context manager: `committed` becomes True on a clean exit; on an exception `rolled_back` becomes True and the exception **still propagates**.', starter: 'class Transaction:\n    pass\n', harness: r`
with Transaction() as t:
    pass
assert t.committed is True and t.rolled_back is False
try:
    with Transaction() as t2:
        raise ValueError("x")
except ValueError:
    assert t2.rolled_back is True and t2.committed is False
else:
    raise AssertionError("must propagate")
`, hints: ['`__exit__` checks `exc_type is None`; return `False` so errors propagate.'], solution: 'class Transaction:\n    def __init__(self):\n        self.committed = False\n        self.rolled_back = False\n\n    def __enter__(self):\n        return self\n\n    def __exit__(self, exc_type, exc, tb):\n        if exc_type is None:\n            self.committed = True\n        else:\n            self.rolled_back = True\n        return False' },
    ],
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
      { title: 'Doctests', task: 'Write `double(x)` with a docstring containing **at least two** `>>>` examples (correct ones). They will be executed.', starter: 'def double(x):\n    pass\n', harness: r`
import doctest
tests = doctest.DocTestFinder().find(double, "double", module=False, globs=globals())
examples = sum(len(t.examples) for t in tests)
assert examples >= 2, f"found {examples} doctest example(s); write at least 2"
runner = doctest.DocTestRunner(verbose=False)
import io, contextlib
with contextlib.redirect_stdout(io.StringIO()):
    for t in tests:
        runner.run(t)
assert runner.failures == 0, "a doctest example in your docstring failed"
assert double(4) == 8
`, hints: ['Docstring lines like `>>> double(2)` followed by `4`.'], solution: 'def double(x):\n    """Double a number.\n\n    >>> double(2)\n    4\n    >>> double(-1.5)\n    -3.0\n    """\n    return x * 2' },
      { title: 'Your own assertRaises', task: 'Write context manager `raises(exc_type)`: passes silently if the block raises `exc_type`; raises `AssertionError("did not raise ...")` if nothing is raised; lets other exceptions propagate.', starter: 'from contextlib import contextmanager\n\n\ndef raises(exc_type):\n    pass\n', harness: r`
with raises(ValueError):
    int("x")
try:
    with raises(ValueError):
        pass
except AssertionError as e:
    assert "did not raise" in str(e)
else:
    raise AssertionError("must complain when nothing is raised")
try:
    with raises(ValueError):
        {}["k"]
except KeyError:
    pass
else:
    raise AssertionError("other exceptions must propagate")
`, hints: ['With `@contextmanager`: `try: yield except exc_type: return else: raise AssertionError(...)`.'], solution: 'from contextlib import contextmanager\n\n\n@contextmanager\ndef raises(exc_type):\n    try:\n        yield\n    except exc_type:\n        return\n    raise AssertionError(f"did not raise {exc_type.__name__}")' },
    ],
    'py-typing': [
      { title: 'Optional return', task: 'Write `first(xs: list[int]) -> int | None` returning the first item or `None`, with exactly those annotations.', starter: 'def first(xs):\n    pass\n', harness: r`
from typing import get_type_hints
assert first([3, 4]) == 3 and first([]) is None
h = get_type_hints(first)
assert h == {"xs": list[int], "return": int | None}, f"annotations are {h!r}"
`, hints: ['`def first(xs: list[int]) -> int | None:`'], solution: 'def first(xs: list[int]) -> int | None:\n    return xs[0] if xs else None' },
      { title: 'Callable', task: 'Write `apply_twice(f, x)` typed with `Callable[[int], int]` for `f`, `int` for `x` and `int` for the result.', starter: 'from typing import Callable\n\n\ndef apply_twice(f, x):\n    pass\n', harness: r`
from typing import get_type_hints, Callable
assert apply_twice(lambda v: v + 3, 1) == 7
assert get_type_hints(apply_twice) == {"f": Callable[[int], int], "x": int, "return": int}
`, hints: ['`def apply_twice(f: Callable[[int], int], x: int) -> int: return f(f(x))`'], solution: 'from typing import Callable\n\n\ndef apply_twice(f: Callable[[int], int], x: int) -> int:\n    return f(f(x))' },
      { title: 'Generic box', task: 'Write `Box(Generic[T])` holding one value (`.value`), with `map(f)` returning a new `Box` of the transformed value.', starter: 'from typing import Generic, TypeVar\n\nT = TypeVar("T")\n\n\nclass Box:\n    pass\n', harness: r`
from typing import Generic
assert Generic in Box.__mro__ or Generic in getattr(Box, "__orig_bases__", ()) or any(getattr(b, "__origin__", None) is Generic for b in getattr(Box, "__orig_bases__", ()))
b = Box(3)
assert b.value == 3 and b.map(lambda v: v * 2).value == 6 and Box("a").map(str.upper).value == "A"
assert isinstance(b.map(str), Box)
Box[int]
`, hints: ['`class Box(Generic[T]):` and `map` returns `Box(f(self.value))`.'], solution: 'from typing import Generic, TypeVar\n\nT = TypeVar("T")\n\n\nclass Box(Generic[T]):\n    def __init__(self, value: T):\n        self.value = value\n\n    def map(self, f):\n        return Box(f(self.value))' },
    ],
    'py-search-sort': [
      { title: 'Lower bound', task: 'Write `lower_bound(xs, x)`: the first index `i` with `xs[i] >= x` in a sorted list (`len(xs)` if none), using binary search.', starter: 'def lower_bound(xs, x):\n    pass\n', harness: r`
xs = [1, 3, 3, 5, 8]
assert [lower_bound(xs, v) for v in (0, 1, 2, 3, 4, 8, 9)] == [0, 0, 1, 1, 3, 4, 5] and lower_bound([], 1) == 0
`, hints: ['Keep `lo, hi = 0, len(xs)` and move `hi = mid` when `xs[mid] >= x`, else `lo = mid + 1`.'], solution: 'def lower_bound(xs, x):\n    lo, hi = 0, len(xs)\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if xs[mid] >= x:\n            hi = mid\n        else:\n            lo = mid + 1\n    return lo' },
      { title: 'Two sum (sorted)', task: 'Write `two_sum_sorted(xs, target)`: in a sorted list return the indices `(i, j)` with `i < j` and `xs[i] + xs[j] == target`, or `None`. Use two pointers (O(n)).', starter: 'def two_sum_sorted(xs, target):\n    pass\n', harness: r`
assert two_sum_sorted([1, 2, 4, 7, 11], 9) == (1, 3) and two_sum_sorted([1, 2, 3], 7) is None and two_sum_sorted([5], 10) is None
big = list(range(1, 100001))
assert two_sum_sorted(big, 199999) == (99998, 99999)
`, hints: ['Start with `i=0, j=len-1`; if the sum is too big move `j` left, too small move `i` right.'], solution: 'def two_sum_sorted(xs, target):\n    i, j = 0, len(xs) - 1\n    while i < j:\n        s = xs[i] + xs[j]\n        if s == target:\n            return i, j\n        if s < target:\n            i += 1\n        else:\n            j -= 1\n    return None' },
      { title: 'Bubble swaps', task: 'Write `bubble_swaps(xs)` returning how many adjacent swaps bubble sort performs to sort the list (do not modify the input).', starter: 'def bubble_swaps(xs):\n    pass\n', harness: r`
data = [3, 2, 1]
assert bubble_swaps(data) == 3 and data == [3, 2, 1]
assert bubble_swaps([1, 2, 3]) == 0 and bubble_swaps([2, 1, 4, 3]) == 2 and bubble_swaps([]) == 0
`, forbid: [{ re: '\\bsorted\\(|\\.sort\\(', msg: 'Do it with the bubble sort loops, not sorted().' }], hints: ['Copy the list; repeat passes comparing neighbours and count each swap.'], solution: 'def bubble_swaps(xs):\n    a = list(xs)\n    swaps = 0\n    for i in range(len(a)):\n        for j in range(len(a) - 1 - i):\n            if a[j] > a[j + 1]:\n                a[j], a[j + 1] = a[j + 1], a[j]\n                swaps += 1\n    return swaps' },
    ],
    'py-datastructs': [
      { title: 'Reverse Polish', task: 'Write `eval_rpn(tokens)` evaluating a Reverse Polish expression with `+ - * /` (true division) using a stack: `["2", "3", "+", "4", "*"]` -> `20.0`... return a float or int result as computed.', starter: 'def eval_rpn(tokens):\n    pass\n', harness: r`
assert eval_rpn(["2", "3", "+", "4", "*"]) == 20 and eval_rpn(["10", "2", "/"]) == 5 and eval_rpn(["5", "1", "2", "+", "4", "*", "+", "3", "-"]) == 14 and eval_rpn(["7"]) == 7
`, hints: ['Numbers go on the stack; an operator pops `b` then `a` and pushes `a op b`.'], solution: 'def eval_rpn(tokens):\n    stack = []\n    for t in tokens:\n        if t in "+-*/" and len(t) == 1:\n            b, a = stack.pop(), stack.pop()\n            stack.append({"+": a + b, "-": a - b, "*": a * b, "/": a / b}[t])\n        else:\n            stack.append(float(t) if "." in t else int(t))\n    return stack[0]' },
      { title: 'Scheduler', task: 'Write `run_order(tasks)` where tasks are `(priority, name)` and **lower priority number runs first** (ties by name); return the names in run order using a heap.', starter: 'import heapq\n\n\ndef run_order(tasks):\n    pass\n', harness: r`
assert run_order([(2, "write"), (1, "plan"), (2, "test"), (3, "ship")]) == ["plan", "test", "write", "ship"] and run_order([]) == []
`, must: [{ re: 'heap', msg: 'Use heapq.' }], hints: ['`heapify` the list, then `heappop` repeatedly.'], solution: 'import heapq\n\n\ndef run_order(tasks):\n    h = list(tasks)\n    heapq.heapify(h)\n    out = []\n    while h:\n        out.append(heapq.heappop(h)[1])\n    return out' },
      { title: 'Reverse a linked list', task: 'With the `Node` class provided, write `reverse(head)` returning the new head of the reversed singly linked list (reverse the links in place).', starter: 'class Node:\n    def __init__(self, val, next=None):\n        self.val = val\n        self.next = next\n\n\ndef reverse(head):\n    pass\n', harness: r`
def build(xs):
    head = None
    for v in reversed(xs):
        head = Node(v, head)
    return head
def to_list(h):
    out = []
    while h:
        out.append(h.val); h = h.next
    return out
assert to_list(reverse(build([1, 2, 3, 4]))) == [4, 3, 2, 1] and reverse(None) is None and to_list(reverse(build([9]))) == [9]
`, hints: ['Walk the list keeping `prev`; for each node: save `nxt = node.next`, point `node.next = prev`, advance.'], solution: 'class Node:\n    def __init__(self, val, next=None):\n        self.val = val\n        self.next = next\n\n\ndef reverse(head):\n    prev = None\n    while head:\n        nxt = head.next\n        head.next = prev\n        prev = head\n        head = nxt\n    return prev' },
    ],
    'py-advanced': [
      { title: 'Callable object', task: 'Write class `Multiplier(n)` whose instances are callable: `Multiplier(3)(5) == 15`. Also expose `.n`.', starter: 'class Multiplier:\n    pass\n', harness: r`
t = Multiplier(3)
assert t(5) == 15 and t.n == 3 and callable(t) and list(map(Multiplier(2), [1, 2, 3])) == [2, 4, 6]
`, hints: ['Define `__call__(self, x)`.'], solution: 'class Multiplier:\n    def __init__(self, n):\n        self.n = n\n\n    def __call__(self, x):\n        return x * self.n' },
      { title: 'Typed descriptor', task: 'Write descriptor `Typed(kind)` that raises `TypeError(f"{name} must be {kind.__name__}")` on a wrong type, and use it in `Person` for `name` (str) and `age` (int).', starter: 'class Typed:\n    pass\n\n\nclass Person:\n    pass\n', harness: r`
p = Person("Ada", 36)
assert (p.name, p.age) == ("Ada", 36)
for attr, bad, msg in [("name", 5, "name must be str"), ("age", "x", "age must be int")]:
    try:
        setattr(p, attr, bad)
    except TypeError as e:
        assert str(e) == msg, str(e)
    else:
        raise AssertionError("expected TypeError")
assert Person("Bo", 1).name == "Bo" and p.name == "Ada"
`, hints: ['`__set_name__` stores names; store the value under `"_" + name` on the instance.'], solution: 'class Typed:\n    def __init__(self, kind):\n        self.kind = kind\n\n    def __set_name__(self, owner, name):\n        self.name = name\n        self.private = "_" + name\n\n    def __get__(self, obj, objtype=None):\n        return self if obj is None else getattr(obj, self.private)\n\n    def __set__(self, obj, value):\n        if not isinstance(value, self.kind):\n            raise TypeError(f"{self.name} must be {self.kind.__name__}")\n        setattr(obj, self.private, value)\n\n\nclass Person:\n    name = Typed(str)\n    age = Typed(int)\n\n    def __init__(self, name, age):\n        self.name = name\n        self.age = age' },
      { title: 'Compute once', task: 'Write `Dataset` with a `cached_property` `total` that sums `self.values` once and stores a `computed` counter (class attribute `computes` counts how many times).', starter: 'from functools import cached_property\n\n\nclass Dataset:\n    pass\n', harness: r`
Dataset.computes = 0
d = Dataset([1, 2, 3])
assert d.total == 6 and d.total == 6 and Dataset.computes == 1
d2 = Dataset([10])
assert d2.total == 10 and Dataset.computes == 2
`, hints: ['Increment `Dataset.computes` inside the property body.'], solution: 'from functools import cached_property\n\n\nclass Dataset:\n    computes = 0\n\n    def __init__(self, values):\n        self.values = values\n\n    @cached_property\n    def total(self):\n        Dataset.computes += 1\n        return sum(self.values)' },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
