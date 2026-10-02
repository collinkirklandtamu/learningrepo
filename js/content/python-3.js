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

## Also worth knowing: context managers

\`with open(path) as f:\` guarantees the file is closed even if an error happens. Any object with \`__enter__\`/\`__exit__\` works in a \`with\` block, which is how locks, database connections and temporary directories clean up after themselves.
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

    ],
    'py-stdlib': [
      { title: 'Nearly equal', task: 'Write `nearly_equal(a, b)` returning whether two floats are equal within a tiny relative tolerance (`0.1 + 0.2` vs `0.3` must be True).', starter: 'import math\n\n\ndef nearly_equal(a, b):\n    pass\n', harness: r`
assert nearly_equal(0.1 + 0.2, 0.3) is True and nearly_equal(1.0, 1.1) is False and nearly_equal(5, 5) is True
`, hints: ['`math.isclose`'], solution: 'import math\n\n\ndef nearly_equal(a, b):\n    return math.isclose(a, b)' },

    ],

  });
})(typeof window !== 'undefined' ? window : globalThis);
