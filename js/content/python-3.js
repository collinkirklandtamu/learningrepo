(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  const r = String.raw;
  LP.addLessons('python', [
    {
      id: 'py-files', title: 'Files, JSON & paths', skill: 'Files & Data', xp: 30, diff: 2,
      read: `
# Reading and writing files

Always open files with a **\`with\` block**: it closes the file for you, even if an error happens.

~~~python
with open("/tmp/notes.txt", "w") as f:       # "w" overwrite, "a" append, "r" read (default)
    f.write("first\\n")
    f.write("second\\n")

with open("/tmp/notes.txt") as f:
    text = f.read()                           # whole file as one string
with open("/tmp/notes.txt") as f:
    for line in f:                            # lazy: one line at a time
        print(line.rstrip("\\n"))
~~~

> [!tip] Where do files live here?
> Your code runs in the browser, so files go to a private in-memory disk. Use paths under \`/tmp/\`.

## JSON: data you can save

~~~python
import json
s = json.dumps({"a": [1, 2], "b": None}, indent=2, sort_keys=True)
back = json.loads(s)
with open("/tmp/data.json", "w") as f:
    json.dump(back, f)
with open("/tmp/data.json") as f:
    obj = json.load(f)
~~~

JSON maps to Python like so: object -> dict, array -> list, string -> str, number -> int/float, true/false -> True/False, null -> None. Dict keys always become strings.

## CSV and pathlib

~~~python
import csv, io
rows = list(csv.DictReader(io.StringIO("name,age\\nAda,36\\n")))   # [{'name': 'Ada', 'age': '36'}]

from pathlib import Path
p = Path("/tmp/demo")
p.mkdir(exist_ok=True)
(p / "a.txt").write_text("hi")
(p / "a.txt").read_text(), (p / "a.txt").suffix, p.exists()
~~~
`,
      task: 'Write `write_lines(path, lines)` (one line each, newline-terminated), `read_lines(path)` (list without newlines), `save_json(path, obj)`, `load_json(path)` and `count_words(path)` (total words in the file).',
      starter: 'import json\n\n\ndef write_lines(path, lines):\n    pass\n\n\ndef read_lines(path):\n    pass\n\n\ndef save_json(path, obj):\n    pass\n\n\ndef load_json(path):\n    pass\n\n\ndef count_words(path):\n    pass\n',
      harness: r`
import tempfile, os
d = tempfile.mkdtemp()
p = os.path.join(d, "a.txt")
write_lines(p, ["hello world", "foo bar baz"])
assert open(p).read() == "hello world\nfoo bar baz\n", f"file contents were {open(p).read()!r}"
assert read_lines(p) == ["hello world", "foo bar baz"]
assert count_words(p) == 5
j = os.path.join(d, "x.json")
save_json(j, {"a": [1, 2], "b": None, "c": {"d": True}})
assert load_json(j) == {"a": [1, 2], "b": None, "c": {"d": True}}
assert json.loads(open(j).read())["a"] == [1, 2], "file must contain real JSON"
`,
      hints: ['`with open(path, "w") as f:` then `f.write(line + "\\n")` for each line.', '`[line.rstrip("\\n") for line in f]` or `f.read().splitlines()`.', '`json.dump(obj, f)` / `json.load(f)`.', '`len(f.read().split())` counts words.'],
      solution: 'import json\n\n\ndef write_lines(path, lines):\n    with open(path, "w") as f:\n        for line in lines:\n            f.write(line + "\\n")\n\n\ndef read_lines(path):\n    with open(path) as f:\n        return f.read().splitlines()\n\n\ndef save_json(path, obj):\n    with open(path, "w") as f:\n        json.dump(obj, f)\n\n\ndef load_json(path):\n    with open(path) as f:\n        return json.load(f)\n\n\ndef count_words(path):\n    with open(path) as f:\n        return len(f.read().split())',
      recall: [
        { type: 'choice', q: 'Why use `with open(...) as f`?', options: ['It is faster', 'The file is closed automatically, even if an error occurs', 'It makes the file read-only', 'It creates the file'], answer: 1, why: 'The context manager guarantees cleanup.' },
        { type: 'choice', q: 'Which mode appends to the end of a file instead of overwriting it?', options: ['"r"', '"w"', '"a"', '"x"'], answer: 2, why: '"w" truncates the file; "a" appends.' },
        { type: 'choice', q: 'What does `json.loads("{\\"a\\": null}")` return?', options: ['{"a": "null"}', '{"a": None}', 'An error', '["a", None]'], answer: 1, why: 'JSON null becomes Python None.' },
        { type: 'choice', q: 'What happens to a dict key `1` after `json.dumps` / `json.loads`?', options: ['It stays 1', 'It becomes the string "1"', 'It raises', 'It becomes 1.0'], answer: 1, why: 'JSON object keys are always strings.' },
        { type: 'type', q: 'Which `pathlib.Path` method reads a whole file into a string? (method name only)', accept: ['read_text', 'read_text()', '.read_text'], why: '`Path("f.txt").read_text()`.' },
      ],
    },
    {
      id: 'py-stdlib', title: 'The standard library toolbox', skill: 'Modules', xp: 30, diff: 2,
      read: `
# Batteries included

Python ships with hundreds of modules. Import one, then use its names:

~~~python
import math
from statistics import mean, median
import datetime as dt          # alias
~~~

## math

~~~python
math.sqrt(16); math.hypot(3, 4)        # 4.0, 5.0
math.ceil(2.1); math.floor(2.9)        # 3, 2
math.gcd(12, 18); math.pi; math.isclose(0.1 + 0.2, 0.3)
~~~

## random (use a seed to make runs repeatable)

~~~python
import random
rng = random.Random(42)        # own generator, reproducible
rng.randint(1, 6); rng.choice("abc"); rng.sample(range(10), 3)
items = [1, 2, 3]; rng.shuffle(items)    # shuffles in place
~~~

## statistics and datetime

~~~python
import statistics as st
st.mean([1, 2, 3, 4]); st.median([1, 3, 2]); st.stdev([2, 4, 4, 4, 5, 5, 7, 9])

from datetime import date, timedelta, datetime
d = date.fromisoformat("2024-02-28")
d + timedelta(days=2)            # date(2024, 3, 1)
(date(2024, 3, 1) - d).days      # 2
d.weekday()                      # 0 = Monday
d.strftime("%A %d %B %Y")        # 'Wednesday 28 February 2024'
datetime.strptime("2024-03-15 10:30", "%Y-%m-%d %H:%M")
~~~

> [!tip] Key idea
> Before writing a helper, search the standard library. \`import this\` is a joke; \`help(module)\` is real.
`,
      task: 'Write `distance(p, q)` (Euclidean, points are `(x, y)`), `roll_dice(n, seed)` (n rolls of a six-sided die from a **seeded** `random.Random`, reproducible), `summary(nums)` (dict with `mean`, `median`, `stdev`, each rounded to 2 decimals) and `days_between(a, b)` (days from ISO date `a` to ISO date `b`) and `add_days(iso, n)` (ISO string n days later).',
      starter: 'def distance(p, q):\n    pass\n\n\ndef roll_dice(n, seed):\n    pass\n\n\ndef summary(nums):\n    pass\n\n\ndef days_between(a, b):\n    pass\n\n\ndef add_days(iso, n):\n    pass\n',
      harness: r`
assert distance((0, 0), (3, 4)) == 5.0 and distance((1, 1), (1, 1)) == 0
r1, r2 = roll_dice(20, 7), roll_dice(20, 7)
assert r1 == r2, "same seed must give the same rolls"
assert len(r1) == 20 and all(1 <= x <= 6 for x in r1), "rolls are 1..6"
assert roll_dice(20, 7) != roll_dice(20, 8), "different seeds should differ"
assert summary([2, 4, 4, 4, 5, 5, 7, 9]) == {"mean": 5.0, "median": 4.5, "stdev": 2.14}, f"got {summary([2, 4, 4, 4, 5, 5, 7, 9])!r}"
assert days_between("2024-02-28", "2024-03-01") == 2 and days_between("2024-03-01", "2024-02-28") == -2
assert add_days("2024-02-28", 2) == "2024-03-01" and add_days("2023-12-31", 1) == "2024-01-01"
`,
      hints: ['`math.hypot(dx, dy)` computes the distance.', '`rng = random.Random(seed)` then `[rng.randint(1, 6) for _ in range(n)]`.', '`statistics.mean/median/stdev` and `round(x, 2)`.', '`date.fromisoformat(a)` and subtracting two dates gives a timedelta (`.days`).'],
      solution: 'import math\nimport random\nimport statistics\nfrom datetime import date, timedelta\n\n\ndef distance(p, q):\n    return math.hypot(p[0] - q[0], p[1] - q[1])\n\n\ndef roll_dice(n, seed):\n    rng = random.Random(seed)\n    return [rng.randint(1, 6) for _ in range(n)]\n\n\ndef summary(nums):\n    return {\n        "mean": round(statistics.mean(nums), 2),\n        "median": round(statistics.median(nums), 2),\n        "stdev": round(statistics.stdev(nums), 2),\n    }\n\n\ndef days_between(a, b):\n    return (date.fromisoformat(b) - date.fromisoformat(a)).days\n\n\ndef add_days(iso, n):\n    return (date.fromisoformat(iso) + timedelta(days=n)).isoformat()',
      recall: [
        { type: 'choice', q: 'Why seed a random generator?', options: ['To make it faster', 'To make results reproducible', 'To make it more random', 'It is required'], answer: 1, why: 'The same seed gives the same sequence: great for tests and experiments.' },
        { type: 'choice', q: 'What is `(date(2024, 3, 1) - date(2024, 2, 28)).days`?', options: ['1', '2', '3', '29'], answer: 1, why: '2024 is a leap year: Feb 28, Feb 29, Mar 1.' },
        { type: 'choice', q: 'What does `import statistics as st` do?', options: ['Installs the module', 'Imports the module under the shorter name st', 'Renames the file', 'Imports only some names'], answer: 1, why: '`as` creates an alias.' },
        { type: 'choice', q: 'What is `math.ceil(-1.5)`?', options: ['-2', '-1', '1', '-1.5'], answer: 1, why: 'ceil rounds toward +infinity: -1.' },
        { type: 'type', q: 'Which `datetime` class represents a calendar date without a time? (class name)', accept: ['date', 'datetime.date'], why: '`datetime.date` holds year, month and day.' },
      ],
    },
    {
      id: 'py-collections', title: 'collections: Counter, defaultdict, deque, namedtuple', skill: 'Modules', xp: 30, diff: 2,
      read: `
# Specialised containers

~~~python
from collections import Counter, defaultdict, deque, namedtuple

Counter("banana")               # Counter({'a': 3, 'n': 2, 'b': 1})
Counter("banana").most_common(1)    # [('a', 3)]
Counter("ab") + Counter("bc")   # Counter({'b': 2, 'a': 1, 'c': 1})

groups = defaultdict(list)      # missing keys start as []
groups["x"].append(1)

q = deque(maxlen=3)             # fixed-size window; old items fall off the left
for i in range(5): q.append(i)  # deque([2, 3, 4])
q.appendleft(9); q.popleft()    # O(1) at both ends

Point = namedtuple("Point", ["x", "y"])
p = Point(1, y=2)
p.x, p[1], p._asdict()          # 1, 2, {'x': 1, 'y': 2}
~~~

- **Counter** counts hashable things; missing keys count as 0.
- **defaultdict(factory)** removes the "if key not in d" dance.
- **deque** is a queue/stack with fast ends (lists are slow at the front).
- **namedtuple** gives tuples readable field names while staying immutable.

> [!tip] Key idea
> \`Counter.most_common()\` breaks ties by first-seen order. When you need a specific tie-break, sort explicitly with a key.
`,
      task: 'Write `top_words(text, n)` (n most common lowercase words as `(word, count)` tuples; ties alphabetical), `group_anagrams(words)` (a sorted list of sorted groups, using `defaultdict`), `last_n(items, n)` (last n items using a `deque(maxlen=n)`) and define `Point` as a **namedtuple** with fields `x` and `y`.',
      starter: 'from collections import Counter, defaultdict, deque, namedtuple\n\n\ndef top_words(text, n):\n    pass\n\n\ndef group_anagrams(words):\n    pass\n\n\ndef last_n(items, n):\n    pass\n\n\nPoint = None\n',
      harness: r`
assert top_words("the cat the dog the end a cat", 2) == [("the", 3), ("cat", 2)], f"got {top_words('the cat the dog the end a cat', 2)!r}"
assert top_words("b a b a c", 2) == [("a", 2), ("b", 2)], "ties are alphabetical"
assert group_anagrams(["listen", "silent", "enlist", "google", "gogole", "cat"]) == [["cat"], ["enlist", "listen", "silent"], ["gogole", "google"]], f"got {group_anagrams(['listen', 'silent', 'enlist', 'google', 'gogole', 'cat'])!r}"
assert last_n(range(10), 3) == [7, 8, 9] and last_n([1], 3) == [1]
p = Point(1, y=2)
assert (p.x, p.y) == (1, 2) and p == (1, 2) and Point._fields == ("x", "y")
`,
      hints: ['Count with `Counter(text.lower().split())`, then `sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))[:n]`.', 'Key each word by `"".join(sorted(word))`; collect into `defaultdict(list)`; return `sorted(sorted(g) for g in groups.values())`.', '`list(deque(items, maxlen=n))`', '`namedtuple("Point", ["x", "y"])`'],
      solution: 'from collections import Counter, defaultdict, deque, namedtuple\n\n\ndef top_words(text, n):\n    counts = Counter(text.lower().split())\n    return sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))[:n]\n\n\ndef group_anagrams(words):\n    groups = defaultdict(list)\n    for w in words:\n        groups["".join(sorted(w))].append(w)\n    return sorted(sorted(g) for g in groups.values())\n\n\ndef last_n(items, n):\n    return list(deque(items, maxlen=n))\n\n\nPoint = namedtuple("Point", ["x", "y"])',
      recall: [
        { type: 'choice', q: 'What does `Counter("hello")["z"]` return?', options: ['KeyError', '0', 'None', '-1'], answer: 1, why: 'Counter returns 0 for missing keys.' },
        { type: 'choice', q: 'What does `defaultdict(int)["k"] += 1` do for a new key?', options: ['Raises KeyError', 'Creates the key with 0 then adds 1', 'Does nothing', 'Creates None'], answer: 1, why: 'int() is 0, the default factory value.' },
        { type: 'choice', q: 'Why use `deque` instead of a list for a queue?', options: ['It is shorter to type', 'Popping from the left is O(1) rather than O(n)', 'Lists cannot be queues', 'It sorts items'], answer: 1, why: 'list.pop(0) shifts every element.' },
        { type: 'choice', q: 'What is `deque([1, 2, 3], maxlen=2)`?', options: ['deque([1, 2, 3])', 'deque([2, 3], maxlen=2)', 'deque([1, 2], maxlen=2)', 'An error'], answer: 1, why: 'Oldest items fall off when the deque is full.' },
        { type: 'type', q: 'Which collections function creates a tuple class with named fields?', accept: ['namedtuple', 'collections.namedtuple'], why: '`namedtuple("Point", ["x", "y"])`.' },
      ],
    },
    {
      id: 'py-itertools', title: 'itertools & functools', skill: 'Modules', xp: 30, diff: 3,
      read: `
# Functional building blocks

\`itertools\` builds iterators lazily (no giant lists in memory).

~~~python
from itertools import chain, product, permutations, combinations, accumulate, groupby, islice, count, cycle

list(chain([1, 2], "ab"))              # [1, 2, 'a', 'b']
list(product("ab", [1, 2]))            # [('a',1),('a',2),('b',1),('b',2)]
list(permutations("abc", 2))           # ordered pairs, no repeats of the same item
list(combinations("abc", 2))           # [('a','b'),('a','c'),('b','c')]
list(accumulate([1, 2, 3, 4]))         # running sum: [1, 3, 6, 10]
list(islice(count(1), 3))              # first 3 of an infinite counter: [1, 2, 3]
[(k, len(list(g))) for k, g in groupby("aaabcc")]   # [('a',3),('b',1),('c',2)]
~~~

> [!warn] groupby only groups *adjacent* equal items
> Sort first if you want all equal items together.

## functools

~~~python
from functools import reduce, partial, lru_cache, wraps
reduce(lambda a, b: a * b, [1, 2, 3, 4])   # 24
int_from_binary = partial(int, base=2)     # fix some arguments
int_from_binary("1010")                    # 10
~~~
`,
      task: 'Write `pairs(xs)` (all unordered pairs as tuples), `grid_points(w, h)` (every `(x, y)` with `0 <= x < w`, `0 <= y < h`, row by row in x order), `running_total(nums)`, `chunks(xs, n)` (consecutive lists of up to n items) , `product_of(nums)` (use `reduce`; 1 for empty) and `runs(s)` (run-length encoding with `groupby`: `"aaabcc"` -> `[("a", 3), ("b", 1), ("c", 2)]`).',
      starter: 'def pairs(xs):\n    pass\n\n\ndef grid_points(w, h):\n    pass\n\n\ndef running_total(nums):\n    pass\n\n\ndef chunks(xs, n):\n    pass\n\n\ndef product_of(nums):\n    pass\n\n\ndef runs(s):\n    pass\n',
      harness: r`
assert pairs([1, 2, 3]) == [(1, 2), (1, 3), (2, 3)] and pairs([1]) == []
assert grid_points(2, 2) == [(0, 0), (0, 1), (1, 0), (1, 1)], f"got {grid_points(2, 2)!r}"
assert running_total([1, 2, 3, 4]) == [1, 3, 6, 10] and running_total([]) == []
assert chunks([1, 2, 3, 4, 5], 2) == [[1, 2], [3, 4], [5]] and chunks([], 3) == []
assert product_of([1, 2, 3, 4]) == 24 and product_of([]) == 1
assert runs("aaabcc") == [("a", 3), ("b", 1), ("c", 2)] and runs("") == []
`,
      must: [{ re: 'reduce', msg: 'Use functools.reduce in product_of.' }, { re: 'groupby', msg: 'Use itertools.groupby in runs.' }],
      hints: ['`list(combinations(xs, 2))`', '`list(product(range(w), range(h)))`', '`list(accumulate(nums))`', 'Slice in steps: `[xs[i:i + n] for i in range(0, len(xs), n)]`.', '`reduce(lambda a, b: a * b, nums, 1)`', '`[(k, len(list(g))) for k, g in groupby(s)]`'],
      solution: 'from functools import reduce\nfrom itertools import accumulate, combinations, groupby, product\n\n\ndef pairs(xs):\n    return list(combinations(xs, 2))\n\n\ndef grid_points(w, h):\n    return list(product(range(w), range(h)))\n\n\ndef running_total(nums):\n    return list(accumulate(nums))\n\n\ndef chunks(xs, n):\n    return [xs[i:i + n] for i in range(0, len(xs), n)]\n\n\ndef product_of(nums):\n    return reduce(lambda a, b: a * b, nums, 1)\n\n\ndef runs(s):\n    return [(k, len(list(g))) for k, g in groupby(s)]',
      recall: [
        { type: 'choice', q: 'What does `list(combinations("abc", 2))` return?', options: ['[("a","b"),("a","c"),("b","c")]', '[("a","b"),("b","a"),...]', '["ab","ac","bc"]', '[("a","a"),("b","b"),("c","c")]'], answer: 0, why: 'combinations ignores order and never repeats an item.' },
        { type: 'choice', q: 'What does `groupby("aabaa")` produce groups for?', options: ['a, b', 'a, b, a (adjacent runs)', 'aaaa, b', 'It raises'], answer: 1, why: 'groupby groups consecutive equal items only.' },
        { type: 'choice', q: 'What is `partial(pow, 2)(5)`?', options: ['25', '32', '10', '7'], answer: 1, why: 'partial fixes the first argument: pow(2, 5) = 32.' },
        { type: 'choice', q: 'Why use `islice(count(1), 5)`?', options: ['To slice a list', 'To take the first 5 items of an infinite iterator', 'To count to 5 backwards', 'To sort'], answer: 1, why: 'islice slices any iterator lazily.' },
        { type: 'type', q: 'Which functools function folds a sequence into one value with a two-argument function? (name only)', accept: ['reduce'], why: '`reduce(f, items, initial)`.' },
      ],
    },
    {
      id: 'py-regex', title: 'Regular expressions', skill: 'Modules', xp: 30, diff: 3,
      read: `
# Pattern matching with re

A **regular expression** describes a pattern of text. Always write patterns as **raw strings** (\`r"..."\`) so backslashes survive.

~~~python
import re
re.search(r"\\d+", "order 66")          # first match anywhere -> Match or None
re.fullmatch(r"\\d{3}", "123")          # the whole string must match
re.findall(r"[a-z]+", "ab1cd")         # ['ab', 'cd']
re.sub(r"\\s+", " ", "a   b\\tc")        # 'a b c'
re.split(r"[,;]\\s*", "a, b;c")         # ['a', 'b', 'c']
~~~

| Pattern | Meaning |
|---|---|
| \`.\` \`\\d\` \`\\w\` \`\\s\` | any char, digit, word char, whitespace |
| \`* + ? {n,m}\` | 0+, 1+, 0-1, n to m repeats |
| \`^ $\` | start, end |
| \`[abc]\` \`[^abc]\` | one of / none of |
| \`(...)\` \`(?P<name>...)\` | capture group / named group |
| \`a|b\` | alternation |

~~~python
m = re.search(r"(?P<y>\\d{4})-(?P<m>\\d{2})", "on 2024-03-15")
m.group("y"), m.groupdict()       # '2024', {'y': '2024', 'm': '03'}
re.sub(r"(\\w+), (\\w+)", r"\\2 \\1", "Lovelace, Ada")   # 'Ada Lovelace'
re.findall(r"<.+?>", "<a><b>")     # lazy: ['<a>', '<b>']  (greedy .+ would grab everything)
~~~

> [!warn] Do not parse HTML or emails perfectly with regex
> Use it for simple, well-defined patterns and validate the rest another way.
`,
      task: 'Write `extract_emails(text)` (simple pattern `name@domain.tld`), `parse_date(s)` (`"2024-03-15"` -> `{"y": 2024, "m": 3, "d": 15}` or `None` when the whole string is not a date), `redact_digits(s)` (each digit becomes `#`), `snake_case(name)` (`"parseHTTPRequest"` -> `"parse_http_request"`) and `valid_phone(s)` (`555-123-4567` or `(555) 123-4567` only).',
      starter: 'import re\n\n\ndef extract_emails(text):\n    pass\n\n\ndef parse_date(s):\n    pass\n\n\ndef redact_digits(s):\n    pass\n\n\ndef snake_case(name):\n    pass\n\n\ndef valid_phone(s):\n    pass\n',
      harness: r`
assert extract_emails("mail ada@math.org or bo.k@x.co.uk, not @nope") == ["ada@math.org", "bo.k@x.co.uk"], f"got {extract_emails('mail ada@math.org or bo.k@x.co.uk, not @nope')!r}"
assert extract_emails("none here") == []
assert parse_date("2024-03-15") == {"y": 2024, "m": 3, "d": 15}
assert parse_date("2024-3-15") is None and parse_date("on 2024-03-15") is None
assert redact_digits("Call 555-1234 now") == "Call ###-#### now"
assert snake_case("parseHTTPRequest") == "parse_http_request", f"got {snake_case('parseHTTPRequest')!r}"
assert snake_case("camelCase") == "camel_case" and snake_case("already") == "already"
assert valid_phone("555-123-4567") and valid_phone("(555) 123-4567")
assert not valid_phone("5551234567") and not valid_phone("555-123-45678") and not valid_phone("call 555-123-4567")
`,
      hints: ['Email: `[\\w.+-]+@[\\w-]+(?:\\.[\\w-]+)+`.', 'Named groups with `re.fullmatch` and convert with `int(...)`.', '`re.sub(r"\\d", "#", s)`', 'Insert `_` before an uppercase letter that follows a lowercase letter, or that starts a word before a lowercase: two `re.sub` calls, then `.lower()`.', 'Use `re.fullmatch` with an alternation of the two formats.'],
      solution: 'import re\n\n\ndef extract_emails(text):\n    return re.findall(r"[\\w.+-]+@[\\w-]+(?:\\.[\\w-]+)+", text)\n\n\ndef parse_date(s):\n    m = re.fullmatch(r"(?P<y>\\d{4})-(?P<m>\\d{2})-(?P<d>\\d{2})", s)\n    if not m:\n        return None\n    return {k: int(v) for k, v in m.groupdict().items()}\n\n\ndef redact_digits(s):\n    return re.sub(r"\\d", "#", s)\n\n\ndef snake_case(name):\n    s = re.sub(r"(.)([A-Z][a-z]+)", r"\\1_\\2", name)\n    s = re.sub(r"([a-z0-9])([A-Z])", r"\\1_\\2", s)\n    return s.lower()\n\n\ndef valid_phone(s):\n    return re.fullmatch(r"\\d{3}-\\d{3}-\\d{4}|\\(\\d{3}\\) \\d{3}-\\d{4}", s) is not None',
      recall: [
        { type: 'choice', q: 'Why write regex patterns as raw strings `r"..."`?', options: ['They run faster', 'So backslashes like \\d reach the regex engine unchanged', 'They are required by re', 'They support Unicode'], answer: 1, why: 'Without r, "\\n" or "\\b" would be interpreted by Python first.' },
        { type: 'choice', q: 'What does `re.findall(r"<.+?>", "<a><b>")` return?', options: ['["<a><b>"]', '["<a>", "<b>"]', '[]', '["a", "b"]'], answer: 1, why: '`+?` is lazy: it matches as little as possible.' },
        { type: 'choice', q: 'What is the difference between `re.search` and `re.fullmatch`?', options: ['None', 'search finds a match anywhere; fullmatch requires the entire string to match', 'fullmatch is faster', 'search needs a compiled pattern'], answer: 1, why: 'Use fullmatch for validation.' },
        { type: 'choice', q: 'In `re.sub(r"(\\w+) (\\w+)", r"\\2 \\1", "ab cd")` the result is...', options: ['"ab cd"', '"cd ab"', '"cdab"', 'An error'], answer: 1, why: '\\1 and \\2 refer to the captured groups.' },
        { type: 'type', q: 'Which quantifier means "one or more"? (single character)', accept: ['+'], why: '`\\d+` matches one or more digits.' },
      ],
    },
  ]);

  LP.addDrills({
    'py-files': [
      { title: 'Append', task: 'Write `append_line(path, text)` adding `text` plus a newline to the end of the file (creating it if needed).', starter: 'def append_line(path, text):\n    pass\n', harness: r`
import tempfile, os
p = os.path.join(tempfile.mkdtemp(), "log.txt")
append_line(p, "one"); append_line(p, "two")
assert open(p).read() == "one\ntwo\n", f"got {open(p).read()!r}"
`, hints: ['Open with mode `"a"`.'], solution: 'def append_line(path, text):\n    with open(path, "a") as f:\n        f.write(text + "\\n")' },
      { title: 'CSV to dicts', task: 'Write `read_csv_rows(text)` returning a list of dicts from CSV text with a header row (use `csv.DictReader` and `io.StringIO`).', starter: 'import csv, io\n\n\ndef read_csv_rows(text):\n    pass\n', harness: r`
assert read_csv_rows("name,age\nAda,36\nBo,28\n") == [{"name": "Ada", "age": "36"}, {"name": "Bo", "age": "28"}]
assert read_csv_rows("a,b\n") == []
assert read_csv_rows('q\n"x,y"\n') == [{"q": "x,y"}], "quoted commas must survive"
`, hints: ['`list(csv.DictReader(io.StringIO(text)))`'], solution: 'import csv, io\n\n\ndef read_csv_rows(text):\n    return [dict(r) for r in csv.DictReader(io.StringIO(text))]' },
      { title: 'Pretty JSON', task: 'Write `pretty(obj)` returning JSON text with 2-space indentation and keys sorted.', starter: 'import json\n\n\ndef pretty(obj):\n    pass\n', harness: r`
assert pretty({"b": 1, "a": [1, 2]}) == '{\n  "a": [\n    1,\n    2\n  ],\n  "b": 1\n}', f"got {pretty({'b': 1, 'a': [1, 2]})!r}"
assert pretty({}) == "{}"
`, hints: ['`json.dumps(obj, indent=2, sort_keys=True)`'], solution: 'import json\n\n\ndef pretty(obj):\n    return json.dumps(obj, indent=2, sort_keys=True)' },
    ],
    'py-stdlib': [
      { title: 'Nearly equal', task: 'Write `nearly_equal(a, b)` returning whether two floats are equal within a tiny relative tolerance (`0.1 + 0.2` vs `0.3` must be True).', starter: 'import math\n\n\ndef nearly_equal(a, b):\n    pass\n', harness: r`
assert nearly_equal(0.1 + 0.2, 0.3) is True and nearly_equal(1.0, 1.1) is False and nearly_equal(5, 5) is True
`, hints: ['`math.isclose`'], solution: 'import math\n\n\ndef nearly_equal(a, b):\n    return math.isclose(a, b)' },
      { title: 'Age on a date', task: 'Write `age_on(birth, on)` giving full years between two ISO dates.', starter: 'from datetime import date\n\n\ndef age_on(birth, on):\n    pass\n', harness: r`
assert age_on("2000-05-17", "2024-05-16") == 23 and age_on("2000-05-17", "2024-05-17") == 24 and age_on("2000-02-29", "2001-02-28") == 0 and age_on("2000-02-29", "2001-03-01") == 1
`, hints: ['`on.year - birth.year`, minus 1 if `(on.month, on.day) < (birth.month, birth.day)`.'], solution: 'from datetime import date\n\n\ndef age_on(birth, on):\n    b, o = date.fromisoformat(birth), date.fromisoformat(on)\n    return o.year - b.year - ((o.month, o.day) < (b.month, b.day))' },
      { title: 'Seeded shuffle', task: 'Write `shuffled(xs, seed)` returning a shuffled **copy** (input unchanged); the same seed gives the same order.', starter: 'import random\n\n\ndef shuffled(xs, seed):\n    pass\n', harness: r`
orig = list(range(10))
a, b = shuffled(orig, 3), shuffled(orig, 3)
assert a == b and sorted(a) == orig and a != orig and orig == list(range(10))
assert shuffled(orig, 4) != a
`, hints: ['Copy first; `random.Random(seed).shuffle(copy)`.'], solution: 'import random\n\n\ndef shuffled(xs, seed):\n    out = list(xs)\n    random.Random(seed).shuffle(out)\n    return out' },
    ],
    'py-collections': [
      { title: 'Character frequency', task: 'Write `char_freq(s)` returning a plain dict of letter counts, ignoring case and anything that is not a letter, sorted by key.', starter: 'from collections import Counter\n\n\ndef char_freq(s):\n    pass\n', harness: r`
out = char_freq("Hello, World!")
assert out == {"d": 1, "e": 1, "h": 1, "l": 3, "o": 2, "r": 1, "w": 1} and list(out) == sorted(out) and type(out) is dict
`, hints: ['Count `ch.lower()` for each `ch.isalpha()`; build the result with `sorted`.'], solution: 'from collections import Counter\n\n\ndef char_freq(s):\n    c = Counter(ch.lower() for ch in s if ch.isalpha())\n    return {k: c[k] for k in sorted(c)}' },
      { title: 'Index by letter', task: 'Write `index_words(words)` returning `{first_letter: [words]}` with a `defaultdict`, returned as a plain `dict`.', starter: 'from collections import defaultdict\n\n\ndef index_words(words):\n    pass\n', harness: r`
out = index_words(["apple", "avocado", "banana", "blueberry", "cherry"])
assert out == {"a": ["apple", "avocado"], "b": ["banana", "blueberry"], "c": ["cherry"]} and type(out) is dict
`, hints: ['`groups[w[0]].append(w)` then `dict(groups)`.'], solution: 'from collections import defaultdict\n\n\ndef index_words(words):\n    groups = defaultdict(list)\n    for w in words:\n        groups[w[0]].append(w)\n    return dict(groups)' },
      { title: 'Window sums', task: 'Write `window_sums(nums, k)` returning the sum of each window of k items using a `deque(maxlen=k)`.', starter: 'from collections import deque\n\n\ndef window_sums(nums, k):\n    pass\n', harness: r`
assert window_sums([1, 2, 3, 4, 5], 3) == [6, 9, 12] and window_sums([5], 1) == [5] and window_sums([1, 2], 3) == []
`, hints: ['Append each number; once the deque is full (`len(w) == k`) record `sum(w)`.'], solution: 'from collections import deque\n\n\ndef window_sums(nums, k):\n    w = deque(maxlen=k)\n    out = []\n    for n in nums:\n        w.append(n)\n        if len(w) == k:\n            out.append(sum(w))\n    return out' },
    ],
    'py-itertools': [
      { title: 'All orderings', task: 'Write `orderings(xs)` returning a sorted list of all permutations of `xs` as tuples.', starter: 'from itertools import permutations\n\n\ndef orderings(xs):\n    pass\n', harness: r`
assert orderings([2, 1]) == [(1, 2), (2, 1)] and len(orderings([1, 2, 3, 4])) == 24 and orderings([]) == [()]
`, hints: ['`sorted(permutations(xs))`'], solution: 'from itertools import permutations\n\n\ndef orderings(xs):\n    return sorted(permutations(xs))' },
      { title: 'Base converter', task: 'Write `parser(base)` returning a function that converts strings to ints in that base, built with `functools.partial`.', starter: 'from functools import partial\n\n\ndef parser(base):\n    pass\n', harness: r`
assert parser(2)("1010") == 10 and parser(16)("ff") == 255 and parser(8)("17") == 15
`, hints: ['`partial(int, base=base)`'], solution: 'from functools import partial\n\n\ndef parser(base):\n    return partial(int, base=base)' },
      { title: 'First squares', task: 'Write `first_squares(n)` returning the first n perfect squares starting at 1, using `islice` over an infinite generator expression (no `range(n)` or `n`-bounded loop).', starter: 'from itertools import count, islice\n\n\ndef first_squares(n):\n    pass\n', harness: r`
assert first_squares(5) == [1, 4, 9, 16, 25] and first_squares(0) == []
`, must: [{ re: 'islice', msg: 'Use islice.' }], hints: ['`islice((x * x for x in count(1)), n)`'], solution: 'from itertools import count, islice\n\n\ndef first_squares(n):\n    return list(islice((x * x for x in count(1)), n))' },
    ],
    'py-regex': [
      { title: 'Hashtags', task: 'Write `hashtags(text)` returning the lowercase tags (without `#`) in order: `"Loving #Python and #Data_Science!"` -> `["python", "data_science"]`.', starter: 'import re\n\n\ndef hashtags(text):\n    pass\n', harness: r`
assert hashtags("Loving #Python and #Data_Science!") == ["python", "data_science"] and hashtags("no tags # here") == []
`, hints: ['`re.findall(r"#(\\w+)", text)` then lowercase.'], solution: 'import re\n\n\ndef hashtags(text):\n    return [t.lower() for t in re.findall(r"#(\\w+)", text)]' },
      { title: 'Swap names', task: 'Write `swap_names(s)` turning every `Last, First` into `First Last` in a longer string.', starter: 'import re\n\n\ndef swap_names(s):\n    pass\n', harness: r`
assert swap_names("Lovelace, Ada") == "Ada Lovelace" and swap_names("A: Turing, Alan; B: Hopper, Grace") == "A: Alan Turing; B: Grace Hopper"
`, hints: ['`re.sub(r"(\\w+), (\\w+)", r"\\2 \\1", s)`'], solution: 'import re\n\n\ndef swap_names(s):\n    return re.sub(r"(\\w+), (\\w+)", r"\\2 \\1", s)' },
      { title: 'Double letters', task: 'Write `double_letter_words(text)` returning the words that contain the same letter twice in a row (use a back-reference).', starter: 'import re\n\n\ndef double_letter_words(text):\n    pass\n', harness: r`
assert double_letter_words("hello book tea moon cat") == ["hello", "book", "moon"] and double_letter_words("a b c") == []
`, hints: ['The pattern `(\\w)\\1` matches a repeated character; test each word with `re.search`.'], solution: 'import re\n\n\ndef double_letter_words(text):\n    return [w for w in text.split() if re.search(r"(\\w)\\1", w)]' },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
