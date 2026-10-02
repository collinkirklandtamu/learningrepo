(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  const r = String.raw;
  (LP.courses = LP.courses || []).push({
    id: 'python', title: 'Python', icon: '🐍', color: '#4b8bbe', engine: 'python',
    blurb: 'From print() to classes. Write real code, get instant feedback from hidden tests.',
    skills: ['Basics', 'Strings', 'Control flow', 'Functions', 'Data structures', 'Errors', 'Files & Data', 'Modules', 'OOP', 'Inheritance', 'Reliability', 'Projects'],
    lessons: [
      {
        id: 'py-hello', title: 'Hello, world', skill: 'Basics', xp: 15, diff: 1,
        read: `
# Your first program

A program is a list of instructions that run **top to bottom**. \`print()\` is a *function* that shows something on the screen.

~~~python
print("Hello, world!")
~~~

Text inside quotes is a **string**. Single \`'quotes'\` and double \`"quotes"\` both work, as long as you open and close with the same kind.

> [!tip] How these lessons work
> Read a little, then do the task on the right. Typing code beats nodding along. Hit **Run** to experiment as often as you like, and **Submit** when you think you're done.
`,
        task: 'Print exactly `Level up!` (capital L, with the exclamation mark).',
        starter: '# Write your code below\n',
        harness: r`assert _out.strip() == "Level up!", f"Expected the output Level up! but your program printed {_out.strip()!r}"`,
        hints: ['Call `print()` with a string inside the parentheses.', 'Strings need quotes: `print("...")`.'],
        solution: 'print("Level up!")',
        recall: [
          { type: 'choice', q: 'What does `print("3 + 4")` display?', options: ['7', '3 + 4', 'An error', '"3 + 4"'], answer: 1, why: 'Anything inside quotes is a string, so Python shows it as-is. No math happens.' },
          { type: 'type', q: 'Which built-in function shows text on screen? (name only, no parentheses)', accept: ['print'], why: '`print()` writes its arguments to the output.' },
        ],
      },
      {
        id: 'py-variables', title: 'Variables & f-strings', skill: 'Basics', xp: 20, diff: 1,
        read: `
# Variables

A **variable** is a name attached to a value. Create one with \`=\`.

~~~python
name = "Ada"
hp = 100
damage = 30
remaining = hp - damage   # 70
~~~

The four types you'll use constantly:

| Type | Example | Notes |
|---|---|---|
| \`str\` | \`"hi"\` | text |
| \`int\` | \`42\` | whole numbers |
| \`float\` | \`3.14\` | decimals |
| \`bool\` | \`True\` | \`True\` / \`False\`, capitalised |

## f-strings

Put an \`f\` before the quotes to drop variables straight into text with \`{}\`:

~~~python
print(f"{name} has {remaining} HP left")
~~~

> [!tip] Key idea
> \`=\` means *assign*, not "equals". Read \`x = x + 1\` as "take x, add 1, store it back in x".
`,
        task: 'Create `name = "Ada"`, `hp = 100` and `damage = 30`. Compute `remaining` (hp minus damage) and print an f-string: `Ada has 70 HP left`.',
        starter: '# 1. create name, hp and damage\n\n# 2. compute remaining\n\n# 3. print: Ada has 70 HP left\n',
        harness: r`
assert name == "Ada", 'name should be the string "Ada"'
assert hp == 100, "hp should be 100"
assert damage == 30, "damage should be 30"
assert remaining == 70, "remaining should be hp - damage (70)"
assert _out.strip() == "Ada has 70 HP left", f"Expected 'Ada has 70 HP left' but got {_out.strip()!r}"
`,
        must: [{ re: 'print\\(\\s*f["\']', msg: 'Use an f-string inside print(), like print(f"... {name} ...")' }],
        hints: ['Variables first, then `remaining = hp - damage`.', 'f-string: `print(f"{name} has {remaining} HP left")`'],
        solution: 'name = "Ada"\nhp = 100\ndamage = 30\nremaining = hp - damage\nprint(f"{name} has {remaining} HP left")',
        recall: [
          { type: 'choice', q: 'After `x = 5` then `x = x + 2`, what is `x`?', options: ['5', '2', '7', 'An error'], answer: 2, why: 'The right side is evaluated first (5 + 2), then stored back into x.' },
          { type: 'choice', q: 'What type is the value `3.0`?', options: ['int', 'float', 'str', 'bool'], answer: 1, why: 'A number with a decimal point is a float, even when it is a whole value.' },
        ],
      },
      
      {
        id: 'py-functions', title: 'Functions', skill: 'Functions', xp: 25, diff: 2,
        read: `
# Functions

A function packages code so you can reuse it. Define one with \`def\`, give it **parameters**, and hand a result back with \`return\`.

~~~python
def double(n):
    return n * 2

print(double(4))   # 8
~~~

The body is **indented** (4 spaces). Python uses indentation, not braces, to group code.

## Default parameters

~~~python
def power(base, exp=2):
    return base ** exp

power(3)      # 9    (exp defaults to 2)
power(3, 3)   # 27
~~~

> [!warn] return is not print
> \`print()\` shows a value to a human. \`return\` gives a value back to the *caller* so more code can use it. A function without \`return\` gives back \`None\`.

## Also worth knowing: flexible arguments and lambdas

\`def total(*nums)\` collects extra positional arguments into a tuple and \`def configure(**options)\` collects keyword arguments into a dict; \`f(*items)\` and \`f(**opts)\` spread them back out. A **lambda** is a tiny unnamed function, handy as a sort key: \`sorted(words, key=lambda w: len(w))\`.
`,
        task: 'Write `greet(name, punctuation="!")` that **returns** (not prints) a greeting: `greet("Ada")` gives `Hello, Ada!` and `greet("Ada", ".")` gives `Hello, Ada.`',
        starter: 'def greet(name, punctuation="!"):\n    pass\n',
        harness: r`
assert greet("Ada") == "Hello, Ada!", f'greet("Ada") should return "Hello, Ada!" but returned {greet("Ada")!r}'
assert greet("Grace", ".") == "Hello, Grace.", 'greet("Grace", ".") should return "Hello, Grace."'
assert greet("Linus", "?") == "Hello, Linus?", "The punctuation parameter should be used"
`,
        hints: ['Use `return` with an f-string.', '`return f"Hello, {name}{punctuation}"`'],
        solution: 'def greet(name, punctuation="!"):\n    return f"Hello, {name}{punctuation}"',
        recall: [
          { type: 'choice', q: 'What does a function return if it has no `return` statement?', options: ['0', 'An empty string', 'None', 'It raises an error'], answer: 2, why: 'Falling off the end of a function returns `None`.' },
          { type: 'type', q: 'Which keyword defines a function?', accept: ['def'], why: '`def name(params):` starts a function definition.' },
        ],
      },
      {
        id: 'py-conditions', title: 'Making decisions', skill: 'Control flow', xp: 25, diff: 2,
        read: `
# Conditionals

\`if\` runs code only when a condition is true. Chain more cases with \`elif\`, and catch everything else with \`else\`.

~~~python
def describe(temp):
    if temp >= 30:
        return "hot"
    elif temp >= 15:
        return "mild"
    else:
        return "cold"
~~~

Conditions come from comparisons: \`==\` \`!=\` \`<\` \`<=\` \`>\` \`>=\`. Combine them with \`and\`, \`or\`, \`not\`.

> [!tip] Order matters
> Python checks branches top to bottom and stops at the first match. Put the **strictest** condition first.

> [!warn] Common bug
> \`=\` assigns, \`==\` compares. \`if x = 3:\` is a syntax error.
`,
        task: 'Write `grade(score)` returning `"A"` for 90 and above, `"B"` for 80-89, `"C"` for 70-79 and `"F"` for anything lower.',
        starter: 'def grade(score):\n    pass\n',
        harness: r`
cases = {100: "A", 90: "A", 89: "B", 80: "B", 79: "C", 70: "C", 69: "F", 0: "F"}
for score, want in cases.items():
    got = grade(score)
    assert got == want, f"grade({score}) should be {want!r} but returned {got!r}"
`,
        must: [{ re: '\\bif\\b', msg: 'Use an if/elif/else chain.' }],
        hints: ['Start with `if score >= 90: return "A"`.', 'Then `elif score >= 80:` and `elif score >= 70:`, finishing with `else: return "F"`.'],
        solution: 'def grade(score):\n    if score >= 90:\n        return "A"\n    elif score >= 80:\n        return "B"\n    elif score >= 70:\n        return "C"\n    else:\n        return "F"',
        recall: [
          { type: 'choice', q: 'Which operator checks equality?', options: ['=', '==', '=>', '!='], answer: 1, why: '`==` compares; `=` assigns.' },
          { type: 'choice', q: 'With `x = 15`, which branch runs?\n\n~~~python\nif x > 10:\n    print("A")\nelif x > 5:\n    print("B")\n~~~', options: ['A', 'B', 'Both', 'Neither'], answer: 0, why: 'The first true branch wins; the `elif` is skipped.' },
        ],
      },
      {
        id: 'py-loops', title: 'Loops', skill: 'Control flow', xp: 30, diff: 2,
        read: `
# Loops

\`for\` repeats code once per item. \`range(n)\` gives the numbers 0 to n-1.

~~~python
for i in range(3):
    print(i)        # 0 1 2

for letter in "hey":
    print(letter)   # h e y
~~~

\`range(start, stop, step)\` fine-tunes it: \`range(2, 10, 2)\` is 2, 4, 6, 8.

\`while\` repeats while a condition stays true:

~~~python
n = 3
while n > 0:
    print(n)
    n -= 1
~~~

## Accumulating

A classic pattern: start with an empty result, update it each lap.

~~~python
total = 0
for x in [4, 5, 6]:
    total += x    # total is 15
~~~

> [!tip] Tools
> \`break\` leaves the loop early; \`continue\` skips to the next lap.
`,
        task: 'Write `sum_evens(n)` returning the sum of the even numbers from 0 to n **inclusive**, and `fizzbuzz(n)` returning a list for 1..n: `"Fizz"` for multiples of 3, `"Buzz"` for 5, `"FizzBuzz"` for both, otherwise the number itself as a string.',
        starter: 'def sum_evens(n):\n    pass\n\n\ndef fizzbuzz(n):\n    pass\n',
        harness: r`
assert sum_evens(10) == 30, f"sum_evens(10) should be 30, got {sum_evens(10)!r}"
assert sum_evens(7) == 12, f"sum_evens(7) should be 12 (0+2+4+6), got {sum_evens(7)!r}"
assert sum_evens(0) == 0, "sum_evens(0) should be 0"
assert fizzbuzz(5) == ["1", "2", "Fizz", "4", "Buzz"], f"fizzbuzz(5) wrong: {fizzbuzz(5)!r}"
fb = fizzbuzz(15)
assert fb[14] == "FizzBuzz", "15 should be FizzBuzz"
assert fb[2] == "Fizz" and fb[9] == "Buzz", "check multiples of 3 and 5"
assert len(fb) == 15, "fizzbuzz(15) should have 15 items"
`,
        must: [{ re: '\\bfor\\b|\\bwhile\\b', msg: 'Use a loop (for or while).' }],
        hints: ['Accumulate: `total = 0`, then `for i in range(n + 1):` and add when `i % 2 == 0`.', 'For FizzBuzz check "divisible by both" (`i % 15 == 0`) *first*.', 'Build a list: `result = []` then `result.append(...)`.'],
        solution: 'def sum_evens(n):\n    total = 0\n    for i in range(n + 1):\n        if i % 2 == 0:\n            total += i\n    return total\n\n\ndef fizzbuzz(n):\n    result = []\n    for i in range(1, n + 1):\n        if i % 15 == 0:\n            result.append("FizzBuzz")\n        elif i % 3 == 0:\n            result.append("Fizz")\n        elif i % 5 == 0:\n            result.append("Buzz")\n        else:\n            result.append(str(i))\n    return result',
        recall: [
          { type: 'choice', q: 'What does `list(range(2, 8, 2))` produce?', options: ['[2, 4, 6]', '[2, 4, 6, 8]', '[2, 3, 4, 5, 6, 7]', '[4, 6, 8]'], answer: 0, why: 'range stops *before* the stop value: 2, 4, 6.' },
          { type: 'type', q: 'Which keyword exits a loop immediately?', accept: ['break'], why: '`break` leaves the nearest enclosing loop.' },
        ],
      },
      {
        id: 'py-lists', title: 'Lists & comprehensions', skill: 'Data structures', xp: 30, diff: 2,
        read: `
# Lists

A **list** holds an ordered collection. Indexing starts at 0 and negative indexes count from the end.

~~~python
xs = [10, 20, 30, 40]
xs[0]      # 10
xs[-1]     # 40
xs[1:3]    # [20, 30]  slice: start inclusive, stop exclusive
xs.append(50)
len(xs)    # 5
~~~

Handy built-ins: \`sorted(xs)\`, \`sorted(xs, reverse=True)\`, \`sum(xs)\`, \`max(xs)\`, \`min(xs)\`.

## List comprehensions

A compact way to build a new list from an old one:

~~~python
[x * 2 for x in xs]            # transform
[x for x in xs if x > 15]      # filter
[x ** 2 for x in xs if x % 20] # both
~~~

Read it as: *"give me \`expression\` for each \`x\` in \`xs\` (if \`condition\`)"*.

## Also worth knowing: tuples and unpacking

A **tuple** is an immutable list written with parentheses: \`point = (3, 4)\`. You can **unpack** any sequence into names: \`x, y = point\`, \`first, *rest = [1, 2, 3]\`, and swap values with \`a, b = b, a\`. Use tuples for fixed groups of values and \`set(...)\` when you only need unique items.
`,
        task: 'Write `squares_of_odds(nums)` returning the squares of the odd numbers, in original order, using a **list comprehension**. Write `top_three(scores)` returning the 3 highest scores, highest first.',
        starter: 'def squares_of_odds(nums):\n    pass\n\n\ndef top_three(scores):\n    pass\n',
        harness: r`
assert squares_of_odds([1, 2, 3, 4, 5]) == [1, 9, 25], f"got {squares_of_odds([1, 2, 3, 4, 5])!r}"
assert squares_of_odds([2, 4]) == [], "no odd numbers should give an empty list"
assert squares_of_odds([7, 3]) == [49, 9], "keep the original order"
assert top_three([50, 90, 70, 85, 60]) == [90, 85, 70], f"got {top_three([50, 90, 70, 85, 60])!r}"
assert top_three([5, 1]) == [5, 1], "top_three should cope with fewer than 3 scores"
`,
        must: [{ re: '\\[[^\\]]*\\bfor\\b[^\\]]*\\bin\\b', msg: 'Use a list comprehension: [ ... for x in nums if ... ]' }],
        hints: ['`[n * n for n in nums if n % 2 == 1]`', '`sorted(scores, reverse=True)` then slice the first three with `[:3]`.'],
        solution: 'def squares_of_odds(nums):\n    return [n * n for n in nums if n % 2 == 1]\n\n\ndef top_three(scores):\n    return sorted(scores, reverse=True)[:3]',
        recall: [
          { type: 'choice', q: 'What is `[10, 20, 30, 40][1:3]`?', options: ['[10, 20, 30]', '[20, 30]', '[20, 30, 40]', '[10, 20]'], answer: 1, why: 'Slices include the start index and exclude the stop index.' },
          { type: 'choice', q: 'What is `[x + 1 for x in [1, 2, 3]]`?', options: ['[1, 2, 3]', '[2, 3, 4]', '9', '[1, 3, 5]'], answer: 1, why: 'The expression runs for each item and the results form a new list.' },
        ],
      },
      {
        id: 'py-dicts', title: 'Dictionaries', skill: 'Data structures', xp: 35, diff: 2,
        read: `
# Dictionaries

A **dict** maps keys to values: look things up by name instead of position.

~~~python
player = {"name": "Ada", "hp": 100}
player["hp"]            # 100
player["xp"] = 0        # add or update
player.get("mana", 0)   # 0  (safe lookup with a default)
"hp" in player          # True
~~~

Loop over pairs with \`.items()\`:

~~~python
for key, value in player.items():
    print(key, value)
~~~

## Counting pattern

Dicts are perfect for counting how many times things appear:

~~~python
counts = {}
for ch in "hello":
    counts[ch] = counts.get(ch, 0) + 1
# {'h': 1, 'e': 1, 'l': 2, 'o': 1}
~~~

> [!tip] Key idea
> \`.get(key, default)\` avoids a \`KeyError\` when the key might not exist yet.
`,
        task: 'Write `word_count(text)` returning a dict of each **lowercase** word to how many times it appears. Words are separated by whitespace (`text.split()`).',
        starter: 'def word_count(text):\n    pass\n',
        harness: r`
assert word_count("the cat the hat") == {"the": 2, "cat": 1, "hat": 1}, f"got {word_count('the cat the hat')!r}"
assert word_count("The the THE") == {"the": 3}, "Counting should ignore case"
assert word_count("") == {}, "An empty string should give an empty dict"
assert isinstance(word_count("a"), dict), "Return a dict"
`,
        hints: ['Start with `counts = {}` and loop over `text.lower().split()`.', '`counts[word] = counts.get(word, 0) + 1`'],
        solution: 'def word_count(text):\n    counts = {}\n    for word in text.lower().split():\n        counts[word] = counts.get(word, 0) + 1\n    return counts',
        recall: [
          { type: 'choice', q: 'What does `{"a": 1}.get("b", 0)` return?', options: ['None', '0', 'A KeyError', '1'], answer: 1, why: '`.get` returns the default (0) when the key is missing, no error.' },
          { type: 'choice', q: 'Which loops over both keys and values?', options: ['for k in d:', 'for k, v in d.items():', 'for v in d.values():', 'for k, v in d:'], answer: 1, why: '`.items()` yields (key, value) pairs.' },
        ],
      },
      {
        id: 'py-errors', title: 'Handling errors', skill: 'Errors', xp: 35, diff: 3,
        read: `
# Errors are information

When Python hits a problem it **raises an exception**. Left alone, the program stops. You can catch it with \`try\` / \`except\`.

~~~python
try:
    n = int("forty-two")
except ValueError:
    n = 0
~~~

Only catch the errors you expect (\`ValueError\`, \`KeyError\`, \`ZeroDivisionError\`...). A bare \`except:\` hides real bugs.

## Raising your own

~~~python
def withdraw(balance, amount):
    if amount > balance:
        raise ValueError("Insufficient funds")
    return balance - amount
~~~

\`finally:\` runs no matter what, which is handy for cleanup.

> [!tip] Reading a traceback
> Read from the **bottom**: the last line says what went wrong and where. The lines above show how you got there.
`,
        task: 'Write `safe_int(text, default=0)` returning `int(text)`, or `default` when it cannot be converted. Write `divide(a, b)` returning `a / b` but **raising** `ValueError("Cannot divide by zero")` when `b` is 0.',
        starter: 'def safe_int(text, default=0):\n    pass\n\n\ndef divide(a, b):\n    pass\n',
        harness: r`
assert safe_int("42") == 42, "safe_int('42') should be 42"
assert safe_int("nope") == 0, "bad input should give the default (0)"
assert safe_int("x", default=-1) == -1, "a custom default should be returned"
assert safe_int("") == 0, "empty string is not a number"
assert divide(10, 4) == 2.5, "divide(10, 4) should be 2.5"
try:
    divide(1, 0)
except ValueError as e:
    assert str(e) == "Cannot divide by zero", f"Wrong message: {e}"
else:
    raise AssertionError("divide(1, 0) should raise ValueError")
`,
        must: [{ re: '\\btry\\b[\\s\\S]*\\bexcept\\b', msg: 'Use try/except in safe_int.' }, { re: '\\braise\\b', msg: 'Use raise in divide.' }],
        hints: ['Wrap `int(text)` in `try:` and catch `ValueError`.', '`if b == 0: raise ValueError("Cannot divide by zero")`'],
        solution: 'def safe_int(text, default=0):\n    try:\n        return int(text)\n    except ValueError:\n        return default\n\n\ndef divide(a, b):\n    if b == 0:\n        raise ValueError("Cannot divide by zero")\n    return a / b',
        recall: [
          { type: 'choice', q: 'Which exception does `int("abc")` raise?', options: ['TypeError', 'ValueError', 'KeyError', 'IndexError'], answer: 1, why: 'The type is right (a str) but the value cannot be parsed, so ValueError.' },
          { type: 'type', q: 'Which keyword creates your own exception?', accept: ['raise'], why: '`raise ValueError("...")` throws an exception.' },
        ],
      },
      {
        id: 'py-classes', title: 'Classes & objects', skill: 'OOP', xp: 45, diff: 3, arc: 'oop-python',
        read: `
# Classes

A **class** is a blueprint; an **object** is one thing built from it. Classes bundle *data* (attributes) with *behaviour* (methods).

~~~python
class Dog:
    def __init__(self, name):
        self.name = name
        self.tricks = []

    def learn(self, trick):
        self.tricks.append(trick)

rex = Dog("Rex")
rex.learn("sit")
print(rex.name, rex.tricks)   # Rex ['sit']
~~~

- \`__init__\` runs when you create an object. It sets up the starting state.
- \`self\` is the object the method was called on. Every method takes it first.
- Each object keeps its **own** attributes.

> [!tip] When to use one
> Reach for a class when you have data and the functions that change it belong together, e.g. a player and what damages or heals them.
`,
        task: 'Create `class Player` with `__init__(self, name, hp=100)` storing both. Add `take_damage(self, amount)` that lowers `hp` but never below 0, and `is_alive(self)` returning `True` while `hp > 0`.',
        starter: 'class Player:\n    pass\n',
        harness: r`
p = Player("Ada")
assert p.name == "Ada" and p.hp == 100, "Player('Ada') should start with 100 hp"
assert Player("Bo", 50).hp == 50, "hp should be configurable"
p.take_damage(30)
assert p.hp == 70, f"hp should be 70 after 30 damage, got {p.hp}"
assert p.is_alive() is True, "70 hp is alive"
p.take_damage(500)
assert p.hp == 0, f"hp should stop at 0, got {p.hp}"
assert p.is_alive() is False, "0 hp is not alive"
a, b = Player("A"), Player("B")
a.take_damage(10)
assert b.hp == 100, "Each Player should have its own hp"
`,
        hints: ['Store attributes in `__init__`: `self.name = name`, `self.hp = hp`.', 'Clamp with `self.hp = max(0, self.hp - amount)`.', '`return self.hp > 0`'],
        solution: 'class Player:\n    def __init__(self, name, hp=100):\n        self.name = name\n        self.hp = hp\n\n    def take_damage(self, amount):\n        self.hp = max(0, self.hp - amount)\n\n    def is_alive(self):\n        return self.hp > 0',
        recall: [
          { type: 'choice', q: 'What is `self` inside a method?', options: ['The class itself', 'The object the method was called on', 'A reserved word that can be left out', 'The parent class'], answer: 1, why: '`rex.learn("sit")` passes `rex` in as `self`.' },
          { type: 'type', q: 'What is the special method that runs when an object is created? (include the underscores)', accept: ['__init__', 'init'], why: '`__init__` initialises new objects.' },
        ],
      },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
