(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  const r = String.raw;

  LP.addDrills({
    'py-hello': [
      { title: 'Two lines', task: 'Print `Hello` on one line and `World` on the next, using two `print` calls.', starter: '# two print calls\n', harness: r`assert _out == "Hello\nWorld\n", f"Expected two lines, got {_out!r}"`, hints: ['Each `print` adds its own newline.'], solution: 'print("Hello")\nprint("World")' },
      { title: 'Separators', task: 'Print `2024-01-31` by passing three numbers to **one** `print` and using its `sep` argument.', starter: '# print(2024, 1, 31, ...)\n', harness: r`assert _out.strip() == "2024-01-31", f"got {_out.strip()!r}"`, must: [{ re: 'sep\\s*=', msg: 'Use the sep= argument of print().' }], hints: ['`print(a, b, c, sep="-")`'], solution: 'print(2024, "01", 31, sep="-")' },
      { title: 'A banner', task: 'Print a line of exactly 20 `=` characters without typing them all: use string multiplication.', starter: '# hint: "=" * n\n', harness: r`assert _out.strip() == "=" * 20, f"got {_out.strip()!r}"`, must: [{ re: '\\*\\s*20|20\\s*\\*', msg: 'Multiply a string by 20.' }], hints: ['`"=" * 20`'], solution: 'print("=" * 20)' },
    ],
    'py-variables': [
      { title: 'Swap', task: '`a` is 3 and `b` is 7. Swap their values (so `a == 7`, `b == 3`), then print `a=7 b=3` with an f-string.', starter: 'a = 3\nb = 7\n# swap them, then print\n', harness: r`
assert (a, b) == (7, 3), f"a and b should be swapped, got {(a, b)}"
assert _out.strip() == "a=7 b=3", f"got {_out.strip()!r}"
`, hints: ['`a, b = b, a`'], solution: 'a = 3\nb = 7\na, b = b, a\nprint(f"a={a} b={b}")' },
      { title: 'Receipt', task: 'With `price = 19.99` and `qty = 3`, compute `total` and print it to 2 decimals: `59.97`.', starter: 'price = 19.99\nqty = 3\n', harness: r`
assert abs(total - 59.97) < 1e-9, "total should be price * qty"
assert _out.strip() == "59.97", f"got {_out.strip()!r}"
`, hints: ['f-string format: `{total:.2f}`'], solution: 'price = 19.99\nqty = 3\ntotal = price * qty\nprint(f"{total:.2f}")' },
      { title: 'Type names', task: 'Build the list `kinds` holding the **type name as a string** of each value in `values`: `["int", "float", "str", "bool", "NoneType"]`.', starter: 'values = (1, 2.0, "s", True, None)\nkinds = []\n', harness: r`assert kinds == ["int", "float", "str", "bool", "NoneType"], f"got {kinds!r}"`, hints: ['`type(v).__name__` gives the name; use a list comprehension.'], solution: 'values = (1, 2.0, "s", True, None)\nkinds = [type(v).__name__ for v in values]' },
    ],
    'py-numbers': [
      { title: 'Digit sum', task: 'With `n = 4821`, compute `digit_sum` (4+8+2+1) using only `//` and `%` in a loop.', starter: 'n = 4821\ndigit_sum = 0\n', harness: r`assert digit_sum == 15, f"got {digit_sum!r}"`, must: [{ re: '%', msg: 'Use % to peel off the last digit.' }], hints: ['`while n > 0:` add `n % 10`, then `n //= 10`.'], solution: 'n = 4821\ndigit_sum = 0\nwhile n > 0:\n    digit_sum += n % 10\n    n //= 10' },
      { title: 'Make change', task: 'Given `amount = 87` cents, set `quarters`, `dimes`, `nickels`, `pennies` using `//` and `%` so the fewest coins are used.', starter: 'amount = 87\n', harness: r`assert (quarters, dimes, nickels, pennies) == (3, 1, 0, 2), f"got {(quarters, dimes, nickels, pennies)}"`, hints: ['`quarters = amount // 25`, then `amount % 25` is what is left.'], solution: 'amount = 87\nquarters, rest = divmod(amount, 25)\ndimes, rest = divmod(rest, 10)\nnickels, pennies = divmod(rest, 5)' },
      { title: 'BMI', task: 'With `weight = 70` (kg) and `height = 1.75` (m) compute `bmi = weight / height ** 2` and print it with one decimal: `22.9`.', starter: 'weight = 70\nheight = 1.75\n', harness: r`
assert abs(bmi - 22.857142857142858) < 1e-9
assert _out.strip() == "22.9", f"got {_out.strip()!r}"
`, hints: ['`**` binds tighter than `/`, so no parentheses are needed. Print with `{bmi:.1f}`.'], solution: 'weight = 70\nheight = 1.75\nbmi = weight / height ** 2\nprint(f"{bmi:.1f}")' },
    ],
    'py-functions': [
      { title: 'Area', task: 'Write `area(w, h=None)`: a rectangle `w x h`, or a square when `h` is omitted.', starter: 'def area(w, h=None):\n    pass\n', harness: r`
assert area(3, 4) == 12 and area(5) == 25 and area(2, 0) == 0
`, hints: ['`if h is None: h = w` (note `h=0` is a real value, so test `is None`).'], solution: 'def area(w, h=None):\n    if h is None:\n        h = w\n    return w * h' },
      { title: 'Is even', task: 'Write `is_even(n)` returning a bool. No `if` needed.', starter: 'def is_even(n):\n    pass\n', harness: r`
assert is_even(4) is True and is_even(7) is False and is_even(0) is True and is_even(-2) is True
`, hints: ['A comparison already is a bool: `n % 2 == 0`.'], solution: 'def is_even(n):\n    return n % 2 == 0' },
      { title: 'Temperature', task: 'Write `to_fahrenheit(c)` and `to_celsius(f)`, both rounded to 1 decimal.', starter: 'def to_fahrenheit(c):\n    pass\n\n\ndef to_celsius(f):\n    pass\n', harness: r`
assert to_fahrenheit(100) == 212.0 and to_fahrenheit(-40) == -40.0 and to_fahrenheit(37) == 98.6
assert to_celsius(212) == 100.0 and to_celsius(98.6) == 37.0
`, hints: ['F = C * 9/5 + 32. Use `round(x, 1)`.'], solution: 'def to_fahrenheit(c):\n    return round(c * 9 / 5 + 32, 1)\n\n\ndef to_celsius(f):\n    return round((f - 32) * 5 / 9, 1)' },
    ],
    'py-conditions': [
      { title: 'Sign', task: 'Write `sign(n)` returning `-1`, `0` or `1`.', starter: 'def sign(n):\n    pass\n', harness: r`assert (sign(-5), sign(0), sign(9)) == (-1, 0, 1)`, hints: ['Use if / elif / else.'], solution: 'def sign(n):\n    if n < 0:\n        return -1\n    elif n > 0:\n        return 1\n    return 0' },
      { title: 'Leap year', task: 'Write `is_leap(year)`: divisible by 4, except centuries, unless divisible by 400.', starter: 'def is_leap(year):\n    pass\n', harness: r`
for y, want in {2024: True, 2023: False, 1900: False, 2000: True, 2100: False, 1996: True}.items():
    assert is_leap(y) is want, f"is_leap({y}) should be {want}"
`, hints: ['`(y % 4 == 0 and y % 100 != 0) or y % 400 == 0`'], solution: 'def is_leap(year):\n    return (year % 4 == 0 and year % 100 != 0) or year % 400 == 0' },
      { title: 'Triangle', task: 'Write `triangle(a, b, c)` returning `"invalid"` (a side is <= 0 or the two shorter sides do not exceed the longest), else `"equilateral"`, `"isosceles"` or `"scalene"`.', starter: 'def triangle(a, b, c):\n    pass\n', harness: r`
assert triangle(3, 3, 3) == "equilateral" and triangle(3, 3, 4) == "isosceles" and triangle(3, 4, 5) == "scalene"
assert triangle(1, 2, 3) == "invalid" and triangle(0, 1, 1) == "invalid" and triangle(1, 1, 10) == "invalid"
`, hints: ['Sort the sides first: `a, b, c = sorted((a, b, c))`; then valid means `a > 0 and a + b > c`.'], solution: 'def triangle(a, b, c):\n    a, b, c = sorted((a, b, c))\n    if a <= 0 or a + b <= c:\n        return "invalid"\n    if a == b == c:\n        return "equilateral"\n    if a == b or b == c:\n        return "isosceles"\n    return "scalene"' },
    ],
    'py-loops': [
      { title: 'Count vowels', task: 'Write `count_vowels(s)` (a, e, i, o, u, any case).', starter: 'def count_vowels(s):\n    pass\n', harness: r`assert count_vowels("Hello World") == 3 and count_vowels("xyz") == 0 and count_vowels("AEIOU") == 5`, hints: ['Loop over the string and test `ch.lower() in "aeiou"`.'], solution: 'def count_vowels(s):\n    total = 0\n    for ch in s:\n        if ch.lower() in "aeiou":\n            total += 1\n    return total' },
      { title: 'Collatz', task: 'Write `collatz_steps(n)`: repeatedly halve even numbers or turn odd n into 3n+1 until reaching 1; return the number of steps (`collatz_steps(6)` is 8).', starter: 'def collatz_steps(n):\n    pass\n', harness: r`assert collatz_steps(1) == 0 and collatz_steps(6) == 8 and collatz_steps(27) == 111`, hints: ['A `while n != 1` loop with a counter.'], solution: 'def collatz_steps(n):\n    steps = 0\n    while n != 1:\n        n = n // 2 if n % 2 == 0 else 3 * n + 1\n        steps += 1\n    return steps' },
      { title: 'Primes', task: 'Write `primes_upto(n)` returning all primes <= n.', starter: 'def primes_upto(n):\n    pass\n', harness: r`assert primes_upto(1) == [] and primes_upto(2) == [2] and primes_upto(30) == [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]`, hints: ['Test divisors from 2 up to `int(k ** 0.5)`.'], solution: 'def primes_upto(n):\n    out = []\n    for k in range(2, n + 1):\n        if all(k % d for d in range(2, int(k ** 0.5) + 1)):\n            out.append(k)\n    return out' },
    ],
    'py-lists': [
      { title: 'Rotate', task: 'Write `rotate(xs, k)` returning a new list rotated right by k places (`[1,2,3,4,5], 2` -> `[4,5,1,2,3]`). k may exceed the length.', starter: 'def rotate(xs, k):\n    pass\n', harness: r`
assert rotate([1, 2, 3, 4, 5], 2) == [4, 5, 1, 2, 3] and rotate([1, 2, 3], 4) == [3, 1, 2] and rotate([], 3) == [] and rotate([1, 2], 0) == [1, 2]
`, hints: ['Reduce k with `%` first; then slice: `xs[-k:] + xs[:-k]` (careful when k is 0).'], solution: 'def rotate(xs, k):\n    if not xs:\n        return []\n    k %= len(xs)\n    return xs[len(xs) - k:] + xs[:len(xs) - k]' },
      { title: 'Moving average', task: 'Write `moving_avg(xs, k)` returning the average of each window of k consecutive items.', starter: 'def moving_avg(xs, k):\n    pass\n', harness: r`
assert moving_avg([1, 2, 3, 4, 5], 3) == [2.0, 3.0, 4.0] and moving_avg([4], 1) == [4.0] and moving_avg([1, 2], 3) == []
`, hints: ['Slice each window `xs[i:i + k]` for `i` in `range(len(xs) - k + 1)`.'], solution: 'def moving_avg(xs, k):\n    return [sum(xs[i:i + k]) / k for i in range(len(xs) - k + 1)]' },
      { title: 'Second largest', task: 'Write `second_largest(xs)`: the second-largest **distinct** value, or `None` if there is no such value.', starter: 'def second_largest(xs):\n    pass\n', harness: r`
assert second_largest([3, 1, 4, 4, 2]) == 3 and second_largest([5, 5]) is None and second_largest([]) is None and second_largest([1, 2]) == 1
`, hints: ['`sorted(set(xs))` is ascending and unique.'], solution: 'def second_largest(xs):\n    u = sorted(set(xs))\n    return u[-2] if len(u) >= 2 else None' },
    ],
    'py-dicts': [
      { title: 'Group by length', task: 'Write `group_by_len(words)` returning `{length: [words...]}` in input order.', starter: 'def group_by_len(words):\n    pass\n', harness: r`
assert group_by_len(["a", "bb", "c", "dd", "eee"]) == {1: ["a", "c"], 2: ["bb", "dd"], 3: ["eee"]} and group_by_len([]) == {}
`, hints: ['`groups.setdefault(len(w), []).append(w)`'], solution: 'def group_by_len(words):\n    groups = {}\n    for w in words:\n        groups.setdefault(len(w), []).append(w)\n    return groups' },
      { title: 'Merge counts', task: 'Write `merge_counts(a, b)` adding up the values of two count dicts (keys in either).', starter: 'def merge_counts(a, b):\n    pass\n', harness: r`
x, y = {"a": 1, "b": 2}, {"b": 3, "c": 4}
assert merge_counts(x, y) == {"a": 1, "b": 5, "c": 4} and x == {"a": 1, "b": 2}
`, hints: ['Copy `a`, then `out[k] = out.get(k, 0) + v` for each item of `b`.'], solution: 'def merge_counts(a, b):\n    out = dict(a)\n    for k, v in b.items():\n        out[k] = out.get(k, 0) + v\n    return out' },
      { title: 'Most common word', task: 'Write `most_common_word(text)`: the most frequent lowercase word (split on whitespace); ties go to the alphabetically first.', starter: 'def most_common_word(text):\n    pass\n', harness: r`
assert most_common_word("the cat the dog the end") == "the" and most_common_word("b a b a") == "a" and most_common_word("Solo") == "solo"
`, hints: ['Count first, then `min(counts, key=lambda w: (-counts[w], w))`.'], solution: 'def most_common_word(text):\n    counts = {}\n    for w in text.lower().split():\n        counts[w] = counts.get(w, 0) + 1\n    return min(counts, key=lambda w: (-counts[w], w))' },
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
      { title: 'Retry', task: 'Write `retry(f, times)` calling `f()` up to `times` times until it does not raise; return its result, or re-raise the last exception.', starter: 'def retry(f, times):\n    pass\n', harness: r`
n = {"c": 0}
def flaky():
    n["c"] += 1
    if n["c"] < 3:
        raise RuntimeError("boom")
    return "ok"
assert retry(flaky, 5) == "ok" and n["c"] == 3
m = {"c": 0}
def bad():
    m["c"] += 1
    raise KeyError("always")
try:
    retry(bad, 2)
except KeyError:
    assert m["c"] == 2
else:
    raise AssertionError("should re-raise")
`, hints: ['Loop `times` times; catch Exception, remember it; after the loop `raise last`.'], solution: 'def retry(f, times):\n    last = None\n    for _ in range(times):\n        try:\n            return f()\n        except Exception as e:\n            last = e\n    raise last' },
      { title: 'Safe lookup', task: 'Write `safe_get(d, *path)` walking nested dicts/lists by keys/indexes, returning `None` if any step is missing or invalid.', starter: 'def safe_get(d, *path):\n    pass\n', harness: r`
data = {"user": {"tags": ["a", "b"], "name": "Ada"}}
assert safe_get(data, "user", "name") == "Ada" and safe_get(data, "user", "tags", 1) == "b"
assert safe_get(data, "user", "age") is None and safe_get(data, "nope", "x") is None and safe_get(data, "user", "tags", 9) is None
assert safe_get(data, "user", "name", "x") is None
`, hints: ['Loop over the path inside `try:` and catch `(KeyError, IndexError, TypeError)`.'], solution: 'def safe_get(d, *path):\n    cur = d\n    try:\n        for key in path:\n            cur = cur[key]\n    except (KeyError, IndexError, TypeError):\n        return None\n    return cur' },
    ],
    'py-classes': [
      { title: 'Rectangle', task: 'Create `class Rectangle` with `w`, `h`, methods `area()` and `perimeter()`.', starter: 'class Rectangle:\n    pass\n', harness: r`
r = Rectangle(3, 4)
assert r.area() == 12 and r.perimeter() == 14 and (r.w, r.h) == (3, 4)
assert Rectangle(1, 1).area() == 1
`, hints: ['Store both in `__init__`.'], solution: 'class Rectangle:\n    def __init__(self, w, h):\n        self.w = w\n        self.h = h\n\n    def area(self):\n        return self.w * self.h\n\n    def perimeter(self):\n        return 2 * (self.w + self.h)' },
      { title: 'Bank account', task: 'Create `BankAccount(owner, balance=0)` with `deposit(x)` and `withdraw(x)`. `withdraw` raises `ValueError("Insufficient funds")` when x > balance; both return the new balance.', starter: 'class BankAccount:\n    pass\n', harness: r`
a = BankAccount("Ada", 100)
assert a.deposit(50) == 150 and a.withdraw(30) == 120 and a.balance == 120 and a.owner == "Ada"
try:
    a.withdraw(1000)
except ValueError as e:
    assert str(e) == "Insufficient funds" and a.balance == 120
else:
    raise AssertionError("expected ValueError")
assert BankAccount("Bo").balance == 0
`, hints: ['Check the balance before subtracting.'], solution: 'class BankAccount:\n    def __init__(self, owner, balance=0):\n        self.owner = owner\n        self.balance = balance\n\n    def deposit(self, x):\n        self.balance += x\n        return self.balance\n\n    def withdraw(self, x):\n        if x > self.balance:\n            raise ValueError("Insufficient funds")\n        self.balance -= x\n        return self.balance' },
      { title: 'Tally', task: 'Create `Tally` with a `count` attribute starting at 0, `add(n=1)`, `reset()`, and `history` — a list recording the count after every `add`.', starter: 'class Tally:\n    pass\n', harness: r`
t = Tally()
t.add(); t.add(5); t.add(2)
assert t.count == 8 and t.history == [1, 6, 8], f"{t.count} {t.history}"
t.reset()
assert t.count == 0
u = Tally()
assert u.history == [], "histories must not be shared between instances"
`, hints: ['Create `self.history = []` in `__init__`, never as a class attribute.'], solution: 'class Tally:\n    def __init__(self):\n        self.count = 0\n        self.history = []\n\n    def add(self, n=1):\n        self.count += n\n        self.history.append(self.count)\n\n    def reset(self):\n        self.count = 0' },
    ],
  });

  LP.addRecall({
    'py-hello': [
      { type: 'choice', q: 'What does this print?\n\n~~~python\nprint("a", "b", sep="-")\n~~~', options: ['a b', 'a-b', 'ab', '"a"-"b"'], answer: 1, why: '`sep` is placed between the arguments.' },
      { type: 'choice', q: 'Which of these is a syntax error?', options: ['print("hi")', "print('hi')", 'print("hi\')', 'print("hi", "there")'], answer: 2, why: 'The opening and closing quote must match.' },
      { type: 'choice', q: 'What does `print("ha" * 3)` show?', options: ['ha3', 'hahaha', '3ha', 'An error'], answer: 1, why: 'Multiplying a string repeats it.' },
    ],
    'py-variables': [
      { type: 'choice', q: 'Which is a valid variable name?', options: ['2fast', 'my-var', 'my_var', 'class'], answer: 2, why: 'Names use letters, digits and underscores, cannot start with a digit, and cannot be keywords.' },
      { type: 'choice', q: 'What does `f"{2 + 3}"` evaluate to?', options: ['"2 + 3"', '"5"', '5', 'An error'], answer: 1, why: 'The expression inside braces is evaluated and inserted as text.' },
      { type: 'choice', q: 'What are the values after `a, b = 1, 2` then `a, b = b, a`?', options: ['a=1, b=2', 'a=2, b=1', 'a=2, b=2', 'a=1, b=1'], answer: 1, why: 'The right side is evaluated first, so the values swap.' },
    ],
    'py-numbers': [
      { type: 'choice', q: 'What is `2 ** 10`?', options: ['20', '100', '1024', '512'], answer: 2, why: '`**` is exponentiation.' },
      { type: 'choice', q: 'What does `round(2.675, 2)` often give, and why?', options: ['2.68 always', '2.67, because floats cannot store 2.675 exactly', 'An error', '3'], answer: 1, why: 'Binary floating point cannot represent most decimals exactly.' },
      { type: 'choice', q: 'What is `-7 // 2`?', options: ['-3', '-4', '3', '-3.5'], answer: 1, why: 'Floor division rounds toward negative infinity.' },
    ],
    'py-functions': [
      { type: 'choice', q: 'What does `print(f())` show if `def f(): pass`?', options: ['pass', 'None', '0', 'An error'], answer: 1, why: 'A function with no return gives back None.' },
      { type: 'choice', q: 'Given `def f(a, b=2)`, which call is invalid?', options: ['f(1)', 'f(1, 3)', 'f(b=3)', 'f(a=1, b=3)'], answer: 2, why: '`a` has no default, so it must be provided.' },
      { type: 'choice', q: 'Where does a value created inside a function live after it returns?', options: ['It is available globally', 'It is gone unless returned or stored elsewhere', 'In a file', 'On the stack forever'], answer: 1, why: 'Local variables disappear when the call ends.' },
    ],
    'py-conditions': [
      { type: 'choice', q: 'Which is falsy in Python?', options: ['"0"', '[0]', '[]', '" "'], answer: 2, why: 'Empty containers, 0, None and "" are falsy.' },
      { type: 'choice', q: 'What is `True and not False or False`?', options: ['True', 'False', 'None', 'An error'], answer: 0, why: '`not` binds first, `and` before `or`: (True and True) or False -> True.' },
      { type: 'choice', q: 'What does `x = 5 if cond else 9` do?', options: ['Always sets 5', 'Sets 5 when cond is truthy, otherwise 9 (a conditional expression)', 'Is a syntax error', 'Sets x to cond'], answer: 1, why: 'A one-line conditional expression.' },
    ],
    'py-loops': [
      { type: 'choice', q: 'What does `for i in range(3): pass` leave in `i`?', options: ['0', '2', '3', 'It is undefined'], answer: 1, why: 'The loop variable keeps its last value, 2.' },
      { type: 'choice', q: 'What does `continue` do?', options: ['Exits the loop', 'Skips the rest of this lap and starts the next', 'Pauses the program', 'Restarts the loop from the beginning'], answer: 1, why: '`break` leaves the loop; `continue` goes to the next iteration.' },
      { type: 'choice', q: 'How many times does the body run?\n\n~~~python\nn = 5\nwhile n > 0:\n    n -= 2\n~~~', options: ['2', '3', '5', 'Forever'], answer: 1, why: 'n goes 5 -> 3 -> 1 -> -1: three laps.' },
    ],
    'py-lists': [
      { type: 'choice', q: 'What does `xs.pop()` do on `[1, 2, 3]`?', options: ['Removes and returns 3', 'Removes and returns 1', 'Returns 3 without removing', 'Removes everything'], answer: 0, why: 'pop() removes the last item (or a given index) and returns it.' },
      { type: 'choice', q: 'What is `[1, 2, 3][-2]`?', options: ['1', '2', '3', 'An error'], answer: 1, why: 'Negative indexes count from the end.' },
      { type: 'choice', q: 'Which makes `a` sorted in place?', options: ['sorted(a)', 'a.sort()', 'a = a.sort()', 'sort(a)'], answer: 1, why: '`sorted` returns a new list; `.sort()` mutates and returns None.' },
    ],
    'py-dicts': [
      { type: 'choice', q: 'What does `d.setdefault("k", [])` do?', options: ['Always replaces d["k"]', 'Returns d["k"], inserting [] first if the key is missing', 'Deletes the key', 'Raises KeyError'], answer: 1, why: 'It is the get-or-create idiom.' },
      { type: 'choice', q: 'Which can be a dict key?', options: ['A list', 'A dict', 'A tuple of numbers', 'A set'], answer: 2, why: 'Keys must be hashable (immutable): tuples are fine, lists are not.' },
      { type: 'choice', q: 'What does `list({"a": 1, "b": 2})` return?', options: ['[1, 2]', '["a", "b"]', '[("a", 1), ("b", 2)]', 'An error'], answer: 1, why: 'Iterating a dict yields its keys.' },
    ],
    'py-errors': [
      { type: 'choice', q: 'When does the `else` block of try/except run?', options: ['When an exception happened', 'When no exception happened', 'Always', 'Never'], answer: 1, why: 'try/except/else: else runs only if the try body finished without raising.' },
      { type: 'choice', q: 'Which block runs whether or not an exception occurred?', options: ['else', 'finally', 'except', 'raise'], answer: 1, why: '`finally` is for cleanup.' },
      { type: 'choice', q: 'Why prefer `except ValueError:` over a bare `except:`?', options: ['It is faster', 'A bare except also hides unrelated bugs (even Ctrl+C)', 'It is required', 'No reason'], answer: 1, why: 'Catch only what you can handle.' },
    ],
    'py-classes': [
      { type: 'choice', q: 'What is the difference between a class and an instance?', options: ['None', 'A class is the blueprint; an instance is one object built from it', 'An instance is the blueprint', 'Classes are only for numbers'], answer: 1, why: '`Dog` is the class; `Dog("Rex")` is an instance.' },
      { type: 'choice', q: 'What happens if you forget `self` in a method definition and call it on an object?', options: ['It works', 'TypeError: the instance is still passed as the first argument', 'It silently does nothing', 'It becomes a static method'], answer: 1, why: 'Python always passes the instance first.' },
      { type: 'choice', q: 'Where are attributes shared by all instances stored?', options: ['In __init__ with self', 'As class attributes in the class body', 'In globals only', 'They cannot be shared'], answer: 1, why: 'Class attributes live on the class, e.g. `species = "dog"`.' },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
