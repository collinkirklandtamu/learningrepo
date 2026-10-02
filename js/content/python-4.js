(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  const r = String.raw;
  LP.addLessons('python', [
    {
      id: 'py-inheritance', title: 'Inheritance & super()', skill: 'Inheritance', xp: 40, diff: 3, arc: 'oop-python',
      read: `
# "Is-a" relationships

**Inheritance** lets a class reuse and specialise another. Use it when one thing *is a* kind of another: a \`Square\` **is a** \`Rectangle\`; a \`Dog\` **is an** \`Animal\`.

~~~python
class Animal:                       # the parent (base / super) class
    def __init__(self, name):
        self.name = name
    def speak(self):
        return "..."
    def intro(self):
        return f"{self.name} says {self.speak()}"

class Dog(Animal):                  # the child (derived / sub) class
    def speak(self):                # override: replace the parent's version
        return "Woof"

Dog("Rex").intro()                  # 'Rex says Woof'   (intro is inherited!)
~~~

Python found \`intro\` on \`Animal\`, but \`self.speak()\` still picked **Dog's** version, because the object really is a Dog. That is **polymorphism**.

## super(): reuse the parent's code

~~~python
class Puppy(Dog):
    def __init__(self, name, age):
        super().__init__(name)      # let the parent set up its part
        self.age = age
    def speak(self):
        return super().speak() + "!"   # extend rather than replace
~~~

Forget \`super().__init__()\` and the parent's attributes are never created.

## Checking types

~~~python
isinstance(Puppy("a", 1), Animal)   # True: a Puppy is an Animal
issubclass(Puppy, Dog)              # True
type(obj) is Dog                    # exact type only
~~~

> [!warn] Inherit for "is-a", not for code reuse alone
> If you only want to reuse code, prefer **composition** (next lessons). A deep inheritance tree is hard to follow.
`,
      task: 'Build a hierarchy: `Shape(name)` with `area()` raising `NotImplementedError` and `describe()` returning `"<name> with area <area to 2 decimals>"`; `Rectangle(w, h)`; `Square(side)` (a Rectangle whose `name` is `"square"`); `Circle(r)` (use `math.pi`). Reuse `super().__init__`.',
      starter: 'import math\n\n\nclass Shape:\n    pass\n\n\nclass Rectangle(Shape):\n    pass\n\n\nclass Square(Rectangle):\n    pass\n\n\nclass Circle(Shape):\n    pass\n',
      harness: r`
import math
try:
    Shape("blob").area()
except NotImplementedError:
    pass
else:
    raise AssertionError("Shape.area must raise NotImplementedError")
r = Rectangle(3, 4)
assert r.area() == 12 and r.name == "rectangle" and r.describe() == "rectangle with area 12.00", f"got {r.describe()!r}"
s = Square(5)
assert s.area() == 25 and s.name == "square" and s.describe() == "square with area 25.00"
assert (s.w, s.h) == (5, 5), "Square should reuse Rectangle's attributes"
c = Circle(1)
assert abs(c.area() - math.pi) < 1e-9 and c.describe() == "circle with area 3.14"
assert isinstance(s, Rectangle) and isinstance(s, Shape) and issubclass(Square, Shape) and not isinstance(c, Rectangle)
assert Square.__bases__ == (Rectangle,), "Square must inherit directly from Rectangle"
`,
      hints: ['In `Shape.__init__` store `self.name`. `describe` calls `self.area()`: it works for every subclass.', '`Rectangle.__init__(self, w, h)` calls `super().__init__("rectangle")`.', '`Square.__init__(self, side)` calls `super().__init__(side, side)`, then overwrites `self.name = "square"`.', 'Circle: `super().__init__("circle")` and `area` returns `math.pi * self.r ** 2`.'],
      solution: 'import math\n\n\nclass Shape:\n    def __init__(self, name):\n        self.name = name\n\n    def area(self):\n        raise NotImplementedError\n\n    def describe(self):\n        return f"{self.name} with area {self.area():.2f}"\n\n\nclass Rectangle(Shape):\n    def __init__(self, w, h):\n        super().__init__("rectangle")\n        self.w = w\n        self.h = h\n\n    def area(self):\n        return self.w * self.h\n\n\nclass Square(Rectangle):\n    def __init__(self, side):\n        super().__init__(side, side)\n        self.name = "square"\n\n\nclass Circle(Shape):\n    def __init__(self, r):\n        super().__init__("circle")\n        self.r = r\n\n    def area(self):\n        return math.pi * self.r ** 2',
      recall: [
        { type: 'choice', q: 'What does `super().__init__(name)` do inside a subclass?', options: ['Creates a new parent object', "Runs the parent class's __init__ on this same object", 'Deletes the parent', 'Calls the grandparent only'], answer: 1, why: 'It reuses the parent initialiser so inherited attributes get set up.' },
        { type: 'choice', q: 'What does this print?\n\n~~~python\nclass A:\n    def hi(self): return "A"\nclass B(A):\n    def hi(self): return "B"\nprint(B().hi())\n~~~', options: ['A', 'B', 'AB', 'An error'], answer: 1, why: 'B overrides hi, so Python uses B\'s version.' },
        { type: 'choice', q: 'If `class Dog(Animal)`, which is True for `d = Dog()`?', options: ['isinstance(d, Animal)', 'type(d) is Animal', 'issubclass(d, Animal)', 'Dog is an instance of Animal'], answer: 0, why: 'A Dog instance is also an instance of every ancestor class.' },
        { type: 'choice', q: 'When is inheritance the right tool?', options: ['To reuse a few lines of code', 'When the child truly "is a" specialised kind of the parent', 'Always instead of functions', 'Never'], answer: 1, why: 'Model is-a relationships with inheritance; has-a with composition.' },
        { type: 'type', q: 'What exception conventionally marks a method that subclasses must implement? (class name)', accept: ['NotImplementedError', 'notimplementederror'], why: 'Raise NotImplementedError in the base method (or use abc, a later lesson).' },
      ],
    },
    {
      id: 'py-polymorphism', title: 'Polymorphism & dunder methods', skill: 'Inheritance', xp: 40, diff: 3, arc: 'oop-python',
      read: `
# Many forms, one interface

**Polymorphism** means code written against a *behaviour* works for any object that provides it. Python is **duck-typed**: "if it walks like a duck and quacks like a duck...". No shared parent needed.

~~~python
def describe_all(things):
    return [t.speak() for t in things]     # works for anything with .speak()
~~~

## Dunder ("magic") methods

Special methods named \`__like_this__\` let your classes plug into Python's syntax:

| You write | Python calls |
|---|---|
| \`str(x)\`, \`print(x)\` | \`x.__str__()\` (friendly) |
| \`repr(x)\`, shell display | \`x.__repr__()\` (unambiguous, for developers) |
| \`a + b\`, \`a * 2\`, \`2 * a\` | \`__add__\`, \`__mul__\`, \`__rmul__\` |
| \`a == b\` | \`__eq__\` |
| \`a < b\` | \`__lt__\` |
| \`len(x)\`, \`x[i]\`, \`i in x\` | \`__len__\`, \`__getitem__\`, \`__contains__\` |
| \`for i in x\` | \`__iter__\` |
| \`if x:\` | \`__bool__\` (or \`__len__\`) |
| \`x()\` | \`__call__\` |

~~~python
from functools import total_ordering

@total_ordering                      # define __eq__ and ONE of < > <= >=; get the rest free
class Version:
    def __init__(self, text):
        self.parts = tuple(int(p) for p in text.split("."))
    def __eq__(self, other):
        return self.parts == other.parts
    def __lt__(self, other):
        return self.parts < other.parts
~~~

> [!warn] If you define __eq__, define __hash__
> Defining \`__eq__\` alone makes instances unhashable (unusable in sets/dict keys). Make equal objects share a hash: \`hash((self.x, self.y))\`.
`,
      task: 'Write `Vector(x, y)` with `__repr__` (`Vector(1, 2)`), `__str__` (`(1, 2)`), `__add__`, `__sub__`, `__mul__` and `__rmul__` by a number, `__eq__` + `__hash__`, `__abs__` (length), `__bool__` (False only for the zero vector) and `__iter__` (so `x, y = v` works). Then write `Version("1.2.10")` that sorts correctly (`1.2.10 > 1.2.9`) using `functools.total_ordering`.',
      starter: 'from functools import total_ordering\n\n\nclass Vector:\n    pass\n\n\nclass Version:\n    pass\n',
      harness: r`
v, w = Vector(1, 2), Vector(3, 4)
assert repr(v) == "Vector(1, 2)" and str(v) == "(1, 2)", f"{v!r} {str(v)!r}"
assert v + w == Vector(4, 6) and w - v == Vector(2, 2)
assert v * 3 == Vector(3, 6) and 3 * v == Vector(3, 6)
assert abs(w) == 5.0
assert bool(Vector(0, 0)) is False and bool(v) is True
x, y = w
assert (x, y) == (3, 4)
assert len({Vector(1, 2), Vector(1, 2), Vector(2, 1)}) == 2, "equal vectors must hash equal"
assert v != w
assert Version("1.2.10") > Version("1.2.9") and Version("1.10") > Version("1.9.9")
assert Version("2.0") >= Version("2.0") and Version("1.0") <= Version("1.0.1")
assert sorted([Version("1.10"), Version("1.2"), Version("1.9")]) == [Version("1.2"), Version("1.9"), Version("1.10")]
assert max([Version("0.9"), Version("0.10")]) == Version("0.10")
`,
      hints: ['`__repr__` returns `f"Vector({self.x}, {self.y})"`; `__iter__` can `yield self.x` then `yield self.y`.', '`__mul__` returns `Vector(self.x * k, self.y * k)`; set `__rmul__ = __mul__`.', '`__hash__` returns `hash((self.x, self.y))`; `__abs__` uses `math.hypot`.', 'Version: parse into a tuple of ints; implement `__eq__` and `__lt__`; decorate with `@total_ordering`.'],
      solution: 'import math\nfrom functools import total_ordering\n\n\nclass Vector:\n    def __init__(self, x, y):\n        self.x = x\n        self.y = y\n\n    def __repr__(self):\n        return f"Vector({self.x}, {self.y})"\n\n    def __str__(self):\n        return f"({self.x}, {self.y})"\n\n    def __add__(self, o):\n        return Vector(self.x + o.x, self.y + o.y)\n\n    def __sub__(self, o):\n        return Vector(self.x - o.x, self.y - o.y)\n\n    def __mul__(self, k):\n        return Vector(self.x * k, self.y * k)\n\n    __rmul__ = __mul__\n\n    def __eq__(self, o):\n        return isinstance(o, Vector) and (self.x, self.y) == (o.x, o.y)\n\n    def __hash__(self):\n        return hash((self.x, self.y))\n\n    def __abs__(self):\n        return math.hypot(self.x, self.y)\n\n    def __bool__(self):\n        return bool(self.x or self.y)\n\n    def __iter__(self):\n        yield self.x\n        yield self.y\n\n\n@total_ordering\nclass Version:\n    def __init__(self, text):\n        self.parts = tuple(int(p) for p in text.split("."))\n\n    def __eq__(self, other):\n        return self.parts == other.parts\n\n    def __lt__(self, other):\n        return self.parts < other.parts\n\n    def __hash__(self):\n        return hash(self.parts)',
      recall: [
        { type: 'choice', q: 'What is the difference between `__str__` and `__repr__`?', options: ['None', '__str__ is for readable display; __repr__ is unambiguous and meant for developers', '__repr__ is for users', '__str__ is only for numbers'], answer: 1, why: 'print() uses __str__; the interactive prompt and containers use __repr__.' },
        { type: 'choice', q: 'What does "duck typing" mean?', options: ['Objects must inherit from a common base', 'What matters is that an object has the needed methods, not its class', 'Types are checked at compile time', 'Only ducks can be subclassed'], answer: 1, why: 'Python checks behaviour at use time.' },
        { type: 'choice', q: 'Why does `2 * Vector(1, 2)` need `__rmul__`?', options: ['Python calls int.__mul__ first, which does not know Vector, so it tries Vector.__rmul__', 'It is faster', 'It is required for all operators', 'Because Vector is immutable'], answer: 0, why: 'The reflected method handles the case where the left operand cannot.' },
        { type: 'choice', q: 'What breaks if you define `__eq__` but not `__hash__`?', options: ['Nothing', 'Instances become unhashable (cannot go in sets or be dict keys)', 'Comparisons stop working', 'Python crashes'], answer: 1, why: 'Defining __eq__ sets __hash__ to None unless you define it too.' },
        { type: 'type', q: 'Which decorator fills in all the ordering methods from `__eq__` and one of `__lt__`...? (name only)', accept: ['total_ordering', '@total_ordering', 'functools.total_ordering'], why: '`functools.total_ordering`.' },
      ],
    },
    {
      id: 'py-composition', title: 'Composition, mixins & the MRO', skill: 'Inheritance', xp: 40, diff: 3, arc: 'oop-python',
      read: `
# Has-a beats is-a (often)

**Composition**: build objects *out of* other objects. A \`Car\` **has an** \`Engine\`; it does not inherit from one.

~~~python
class Engine:
    def start(self): return "engine on"

class Car:
    def __init__(self, name):
        self.name = name
        self.engine = Engine()          # composition
    def start(self):
        return f"{self.name}: {self.engine.start()}"   # delegation
~~~

You can swap the engine without touching Car, and tests can pass a fake. Prefer composition unless the relationship is genuinely is-a.

## Multiple inheritance and mixins

A class may have several parents. A **mixin** is a small parent that adds one capability and is not meant to stand alone.

~~~python
class JsonMixin:
    def to_json(self):
        import json
        return json.dumps(self.__dict__, sort_keys=True)

class User(JsonMixin):
    def __init__(self, name): self.name = name
~~~

## The MRO

With several parents Python must decide **which method wins**. It computes the **method resolution order** (C3 linearisation). \`super()\` means "the *next class in the MRO*", not simply "the parent".

~~~python
class A:
    def hello(self): return "A"
class B(A):
    def hello(self): return "B>" + super().hello()
class C(A):
    def hello(self): return "C>" + super().hello()
class D(B, C): pass

D.mro()        # [D, B, C, A, object]
D().hello()    # 'B>C>A'  <- B's super() goes to C, not straight to A
~~~

> [!tip] Key idea
> Cooperative \`super()\` calls let every class in a diamond run exactly once. Check \`Cls.__mro__\` whenever inheritance surprises you.
`,
      task: 'Write: `Engine.start()` -> `"engine on"` and `Car(name)` that **has an** engine and `start()` -> `"<name>: engine on"`; mixins `ReprMixin` (`__repr__` giving `ClassName(a=1, b=2)` with attributes sorted by name) and `JsonMixin` (`to_json()` = `json.dumps(self.__dict__, sort_keys=True)`) and `User(name, age)` using both; and the diamond `A`, `B(A)`, `C(A)`, `D(B, C)` where each `hello()` returns its letter + `>` + the next class\'s result, so `D().hello() == "B>C>A"`.',
      starter: 'import json\n\n\nclass Engine:\n    pass\n\n\nclass Car:\n    pass\n\n\nclass ReprMixin:\n    pass\n\n\nclass JsonMixin:\n    pass\n\n\nclass User:\n    pass\n\n\nclass A:\n    pass\n\n\nclass B:\n    pass\n\n\nclass C:\n    pass\n\n\nclass D:\n    pass\n',
      harness: r`
car = Car("Mini")
assert car.start() == "Mini: engine on" and isinstance(car.engine, Engine) and not isinstance(car, Engine)
car.engine = type("Electric", (), {"start": lambda self: "silent"})()
assert car.start() == "Mini: silent", "composition lets us swap the part"
u = User("Ada", 36)
assert repr(u) == "User(age=36, name='Ada')", f"got {repr(u)!r}"
assert u.to_json() == '{"age": 36, "name": "Ada"}', f"got {u.to_json()!r}"
assert [c.__name__ for c in User.__mro__] == ["User", "ReprMixin", "JsonMixin", "object"], "list ReprMixin first, then JsonMixin"
assert [c.__name__ for c in D.__mro__] == ["D", "B", "C", "A", "object"], f"got {[c.__name__ for c in D.__mro__]}"
assert D().hello() == "B>C>A" and B().hello() == "B>A" and A().hello() == "A" and C().hello() == "C>A"
`,
      hints: ['`Car.__init__` stores `self.engine = Engine()` and `start` delegates.', '`ReprMixin.__repr__`: `", ".join(f"{k}={v!r}" for k, v in sorted(vars(self).items()))`.', 'Class order matters: `class User(ReprMixin, JsonMixin)`.', 'In each class `hello` returns `"X>" + super().hello()`; A just returns "A". Declare `class D(B, C): pass`.'],
      solution: 'import json\n\n\nclass Engine:\n    def start(self):\n        return "engine on"\n\n\nclass Car:\n    def __init__(self, name):\n        self.name = name\n        self.engine = Engine()\n\n    def start(self):\n        return f"{self.name}: {self.engine.start()}"\n\n\nclass ReprMixin:\n    def __repr__(self):\n        attrs = ", ".join(f"{k}={v!r}" for k, v in sorted(vars(self).items()))\n        return f"{type(self).__name__}({attrs})"\n\n\nclass JsonMixin:\n    def to_json(self):\n        return json.dumps(self.__dict__, sort_keys=True)\n\n\nclass User(ReprMixin, JsonMixin):\n    def __init__(self, name, age):\n        self.name = name\n        self.age = age\n\n\nclass A:\n    def hello(self):\n        return "A"\n\n\nclass B(A):\n    def hello(self):\n        return "B>" + super().hello()\n\n\nclass C(A):\n    def hello(self):\n        return "C>" + super().hello()\n\n\nclass D(B, C):\n    pass',
      recall: [
        { type: 'choice', q: 'Which relationship does composition model?', options: ['is-a', 'has-a', 'was-a', 'uses-a only'], answer: 1, why: 'A Car has an Engine.' },
        { type: 'choice', q: 'What is the MRO?', options: ['The order Python searches classes for a method', 'A memory register', 'A module loader', 'A type of decorator'], answer: 0, why: 'Method Resolution Order: the linearised list of classes to search.' },
        { type: 'choice', q: 'In a diamond `D(B, C)` where B and C both inherit A, what does `super()` inside B refer to when called on a D object?', options: ['Always A', 'The next class after B in D\'s MRO, which is C', 'Always object', 'D'], answer: 1, why: 'super() follows the instance\'s MRO, not a fixed parent.' },
        { type: 'choice', q: 'What is a mixin?', options: ['A small class adding one capability, meant to be combined with others', 'A kind of dictionary', 'A built-in type', 'A decorator'], answer: 0, why: 'Mixins are reusable behaviour pieces, not standalone types.' },
        { type: 'choice', q: 'Why is "favour composition over inheritance" common advice?', options: ['It is faster', 'Parts can be swapped and tested separately; deep hierarchies get brittle', 'Python forbids inheritance', 'Composition needs no classes'], answer: 1, why: 'Loose coupling is easier to change.' },
      ],
    },
    {
      id: 'py-abc', title: 'Abstract base classes', skill: 'Inheritance', xp: 35, diff: 3, arc: 'oop-python',
      read: `
# Contracts that Python enforces

Raising \`NotImplementedError\` only fails when the method is *called*. An **abstract base class** (ABC) fails earlier: you cannot even create an instance until every abstract method is implemented.

~~~python
from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self): ...

    def describe(self):                 # concrete method using the abstract one
        return f"area={self.area()}"

Shape()            # TypeError: Can't instantiate abstract class Shape
class Sq(Shape):
    def __init__(self, s): self.s = s
    def area(self): return self.s ** 2
Sq(3).describe()   # 'area=9'
~~~

A subclass that forgets one abstract method is itself abstract; instantiating it raises \`TypeError\` right away.

## The template method pattern

The base class defines the *skeleton* of an algorithm and subclasses fill in the steps:

~~~python
class Exporter(ABC):
    def export(self, rows):                    # the fixed recipe
        return self.header() + "\\n" + "\\n".join(self.row(r) for r in rows)
    @abstractmethod
    def header(self): ...
    @abstractmethod
    def row(self, r): ...
~~~

\`abstractmethod\` can also decorate properties. Use \`inspect.isabstract(cls)\` to test whether a class is still abstract.

> [!tip] Key idea
> An ABC is an interface plus shared code. It documents exactly what subclasses must provide.
`,
      task: 'Write abstract `PaymentMethod(name)` with abstract `charge(amount) -> bool` and concrete `receipt(amount)` returning `"<name>: charged $<amount:.2f>"` if `charge` succeeds else `"<name>: declined"`. Implement `CreditCard(limit)` (succeeds when `amount <= limit`) and `Wallet(balance)` (succeeds and **reduces** the balance when funds are sufficient). Write `process(methods, amount)` returning the `name` of the first method that charges, or `None`.',
      starter: 'from abc import ABC, abstractmethod\n\n\nclass PaymentMethod(ABC):\n    pass\n\n\nclass CreditCard(PaymentMethod):\n    pass\n\n\nclass Wallet(PaymentMethod):\n    pass\n\n\ndef process(methods, amount):\n    pass\n',
      harness: r`
import inspect
try:
    PaymentMethod("x")
except TypeError:
    pass
else:
    raise AssertionError("PaymentMethod must be abstract (cannot be instantiated)")
class Broken(PaymentMethod):
    pass
try:
    Broken("b")
except TypeError:
    pass
else:
    raise AssertionError("a subclass missing charge() must not be instantiable")
assert inspect.isabstract(PaymentMethod) and not inspect.isabstract(CreditCard)
card, wallet = CreditCard(100), Wallet(30)
assert card.name == "credit card" and wallet.name == "wallet"
assert card.receipt(80) == "credit card: charged $80.00" and card.receipt(120) == "credit card: declined"
assert wallet.receipt(25) == "wallet: charged $25.00" and wallet.balance == 5
assert wallet.receipt(10) == "wallet: declined" and wallet.balance == 5, "declined charges must not change the balance"
assert process([CreditCard(10), Wallet(50)], 40) == "wallet"
assert process([CreditCard(100), Wallet(50)], 40) == "credit card"
assert process([CreditCard(1)], 40) is None
`,
      hints: ['`PaymentMethod.__init__(self, name)` stores the name; mark `charge` with `@abstractmethod`.', 'Subclasses call `super().__init__("credit card")` / `super().__init__("wallet")`.', '`receipt` calls `self.charge(amount)`; Wallet.charge subtracts only when it returns True.'],
      solution: 'from abc import ABC, abstractmethod\n\n\nclass PaymentMethod(ABC):\n    def __init__(self, name):\n        self.name = name\n\n    @abstractmethod\n    def charge(self, amount):\n        ...\n\n    def receipt(self, amount):\n        if self.charge(amount):\n            return f"{self.name}: charged ${amount:.2f}"\n        return f"{self.name}: declined"\n\n\nclass CreditCard(PaymentMethod):\n    def __init__(self, limit):\n        super().__init__("credit card")\n        self.limit = limit\n\n    def charge(self, amount):\n        return amount <= self.limit\n\n\nclass Wallet(PaymentMethod):\n    def __init__(self, balance):\n        super().__init__("wallet")\n        self.balance = balance\n\n    def charge(self, amount):\n        if amount <= self.balance:\n            self.balance -= amount\n            return True\n        return False\n\n\ndef process(methods, amount):\n    for m in methods:\n        if m.charge(amount):\n            return m.name\n    return None',
      recall: [
        { type: 'choice', q: 'What happens when you instantiate a class that still has an unimplemented `@abstractmethod`?', options: ['Nothing until the method is called', 'TypeError at instantiation', 'It returns None', 'The method is auto-generated'], answer: 1, why: 'ABCs enforce the contract at creation time.' },
        { type: 'choice', q: 'What is the template method pattern?', options: ['A base class defines the fixed algorithm and subclasses supply the steps', 'A way to generate HTML', 'Copying a class', 'A testing tool'], answer: 0, why: 'The skeleton lives in the parent; details are overridden.' },
        { type: 'choice', q: 'Which import gives you `abstractmethod`?', options: ['from abc import abstractmethod', 'from typing import abstractmethod', 'import abstract', 'from functools import abstractmethod'], answer: 0, why: 'The abc module.' },
        { type: 'choice', q: 'Can an ABC contain concrete (implemented) methods?', options: ['No', 'Yes, they are shared by subclasses', 'Only static ones', 'Only properties'], answer: 1, why: 'ABCs often mix abstract steps with ready-made behaviour.' },
        { type: 'type', q: 'Which `inspect` function tells you if a class is still abstract? (name only)', accept: ['isabstract', 'inspect.isabstract'], why: '`inspect.isabstract(cls)`.' },
      ],
    },
    {
      id: 'py-properties', title: 'Properties, classmethods & staticmethods', skill: 'OOP', xp: 35, diff: 3, arc: 'oop-python',
      read: `
# Controlled attributes and alternate constructors

## @property

A property looks like an attribute but runs code. Use it to validate, compute or protect values without changing how callers use the class.

~~~python
class Circle:
    def __init__(self, r):
        self.radius = r              # goes through the setter below

    @property
    def radius(self):                # getter: c.radius
        return self._radius

    @radius.setter
    def radius(self, value):         # setter: c.radius = 5
        if value <= 0:
            raise ValueError("radius must be positive")
        self._radius = value

    @property
    def area(self):                  # computed, read-only (no setter)
        return 3.14159 * self._radius ** 2
~~~

By convention \`_name\` means "internal, please don't touch".

## @classmethod and @staticmethod

~~~python
class Person:
    count = 0                        # class attribute: shared by every instance
    def __init__(self, name, age):
        self.name, self.age = name, age
        Person.count += 1

    @classmethod
    def from_string(cls, text):      # alternate constructor: receives the CLASS
        name, age = text.split(",")
        return cls(name, int(age))   # cls works for subclasses too

    @staticmethod
    def is_adult(age):               # no self, no cls: just a namespaced helper
        return age >= 18
~~~

> [!tip] Key idea
> \`@classmethod\` + \`cls(...)\` gives you **named constructors** (\`Date.today()\`, \`Person.from_string(...)\`) that also work in subclasses.
`,
      task: 'Write `Temperature` with a `celsius` property whose setter raises `ValueError("below absolute zero")` under -273.15, a `fahrenheit` property (computed; its setter converts back), a classmethod `from_fahrenheit(f)`, a staticmethod `is_valid(c)` and a class attribute `created` counting every instance made.',
      starter: 'class Temperature:\n    pass\n',
      harness: r`
before = Temperature.created if hasattr(Temperature, "created") else None
t = Temperature(100)
assert t.celsius == 100 and t.fahrenheit == 212.0
t.fahrenheit = 32
assert t.celsius == 0.0
t.celsius = 37
assert abs(t.fahrenheit - 98.6) < 1e-9
try:
    t.celsius = -300
except ValueError as e:
    assert str(e) == "below absolute zero" and t.celsius == 37, "failed set must not change the value"
else:
    raise AssertionError("expected ValueError")
try:
    Temperature(-500)
except ValueError:
    pass
else:
    raise AssertionError("the constructor must validate too")
f = Temperature.from_fahrenheit(212)
assert isinstance(f, Temperature) and f.celsius == 100.0
assert Temperature.is_valid(0) is True and Temperature.is_valid(-274) is False
assert isinstance(Temperature.__dict__["is_valid"], staticmethod) and isinstance(Temperature.__dict__["from_fahrenheit"], classmethod)
assert isinstance(Temperature.celsius, property)
assert Temperature.created - before >= 2, "created counts instances"
class Sub(Temperature):
    pass
assert type(Sub.from_fahrenheit(32)) is Sub, "classmethod must use cls"
`,
      hints: ['Store the value in `self._celsius`; validate in the setter and call it from `__init__` via `self.celsius = value`.', '`fahrenheit` getter: `self._celsius * 9 / 5 + 32`; setter: `self.celsius = (f - 32) * 5 / 9`.', 'Increment `Temperature.created` in `__init__` (after validation succeeds is fine).', '`@classmethod def from_fahrenheit(cls, f): return cls((f - 32) * 5 / 9)`'],
      solution: 'class Temperature:\n    created = 0\n\n    def __init__(self, celsius):\n        self.celsius = celsius\n        Temperature.created += 1\n\n    @property\n    def celsius(self):\n        return self._celsius\n\n    @celsius.setter\n    def celsius(self, value):\n        if not Temperature.is_valid(value):\n            raise ValueError("below absolute zero")\n        self._celsius = value\n\n    @property\n    def fahrenheit(self):\n        return self._celsius * 9 / 5 + 32\n\n    @fahrenheit.setter\n    def fahrenheit(self, f):\n        self.celsius = (f - 32) * 5 / 9\n\n    @classmethod\n    def from_fahrenheit(cls, f):\n        return cls((f - 32) * 5 / 9)\n\n    @staticmethod\n    def is_valid(c):\n        return c >= -273.15',
      recall: [
        { type: 'choice', q: 'Why use `@property` instead of a plain attribute?', options: ['It is faster', 'To run validation or computation while keeping attribute syntax', 'It hides the class', 'It makes the attribute static'], answer: 1, why: 'Callers keep writing obj.value; you gain control behind it.' },
        { type: 'choice', q: 'What is the first parameter of a `@classmethod`?', options: ['self', 'cls (the class)', 'The module', 'Nothing'], answer: 1, why: 'It receives the class, so it can build instances of subclasses too.' },
        { type: 'choice', q: 'A property with a getter but no setter is...', options: ['Write-only', 'Read-only (assigning raises AttributeError)', 'Deleted', 'Static'], answer: 1, why: 'Without a setter, assignment fails.' },
        { type: 'choice', q: 'When should a method be a `@staticmethod`?', options: ['It needs the instance', 'It needs neither the instance nor the class but belongs with the class', 'Always', 'When it is private'], answer: 1, why: 'It is just a function in the class namespace.' },
        { type: 'type', q: 'Which decorator turns a method into a read-only computed attribute? (name only, no @)', accept: ['property', '@property'], why: '`@property`.' },
      ],
    },
    {
      id: 'py-dataclasses', title: 'Dataclasses, enums & type hints', skill: 'OOP', xp: 35, diff: 3, arc: 'oop-python',
      read: `
# Less boilerplate

A **dataclass** generates \`__init__\`, \`__repr__\` and \`__eq__\` from annotated fields.

~~~python
from dataclasses import dataclass, field, asdict, replace

@dataclass
class Item:
    name: str
    price: float
    qty: int = 1                                  # default
    tags: list = field(default_factory=list)      # mutable defaults need a factory!

    def __post_init__(self):                      # runs after the generated __init__
        if self.price < 0:
            raise ValueError("price must be >= 0")

    @property
    def total(self):
        return self.price * self.qty

Item("pen", 1.5, 2)             # Item(name='pen', price=1.5, qty=2, tags=[])
asdict(Item("a", 1))            # plain dict
replace(Item("a", 1), qty=5)    # copy with a change
~~~

Options: \`@dataclass(frozen=True)\` makes instances immutable **and hashable**; \`order=True\` adds \`< <= > >=\` comparing fields in order.

## Enum: a fixed set of named values

~~~python
from enum import Enum, IntEnum, auto

class Color(Enum):
    RED = 1
    GREEN = 2
    BLUE = 3

Color.RED.name, Color.RED.value        # 'RED', 1
Color(2)                               # Color.GREEN  (lookup by value)
Color["BLUE"]                          # lookup by name
[c.name for c in Color]                # iterate members
~~~

\`IntEnum\` members also behave as integers (so they compare and sort). Annotations like \`list[int]\` or \`str | None\` document intent; Python does **not** enforce them at runtime.
`,
      task: 'Write dataclass `Item(name, price, qty=1, tags=[])` (use a factory for tags) with `__post_init__` raising `ValueError` for a negative price and a `total` property; `Color` enum (RED=1, GREEN=2, BLUE=3) with function `parse_color(name)` (case-insensitive lookup by name); and frozen, ordered dataclass `Version(major, minor, patch)`.',
      starter: 'from dataclasses import dataclass, field\nfrom enum import Enum\n\n\nclass Item:\n    pass\n\n\nclass Color(Enum):\n    pass\n\n\ndef parse_color(name):\n    pass\n\n\nclass Version:\n    pass\n',
      harness: r`
from dataclasses import is_dataclass, asdict, replace, fields
import dataclasses
assert is_dataclass(Item) and is_dataclass(Version)
a, b = Item("pen", 1.5, 2), Item("pen", 1.5, 2)
assert a == b and repr(a) == "Item(name='pen', price=1.5, qty=2, tags=[])", repr(a)
assert a.total == 3.0 and Item("x", 2).qty == 1
x, y = Item("a", 1), Item("b", 1)
x.tags.append("t")
assert y.tags == [], "tags must not be shared (default_factory)"
try:
    Item("bad", -1)
except ValueError:
    pass
else:
    raise AssertionError("negative price must raise")
assert asdict(a)["qty"] == 2 and replace(a, qty=9).qty == 9
assert [c.name for c in Color] == ["RED", "GREEN", "BLUE"] and Color.GREEN.value == 2 and Color(3) is Color.BLUE
assert parse_color("red") is Color.RED and parse_color("Blue") is Color.BLUE
try:
    parse_color("pink")
except KeyError:
    pass
else:
    raise AssertionError("unknown colour should raise KeyError")
v1, v2 = Version(1, 2, 3), Version(1, 10, 0)
assert v1 < v2 and sorted([v2, v1]) == [v1, v2] and v1 == Version(1, 2, 3)
assert len({v1, Version(1, 2, 3)}) == 1, "frozen dataclasses are hashable"
try:
    v1.major = 5
except dataclasses.FrozenInstanceError:
    pass
else:
    raise AssertionError("Version must be frozen")
`,
      hints: ['Decorate with `@dataclass`; fields are annotations like `name: str`.', '`tags: list = field(default_factory=list)`; validate in `__post_init__`.', '`Color[name.upper()]` looks up by name and raises KeyError when missing.', '`@dataclass(frozen=True, order=True)` for Version.'],
      solution: 'from dataclasses import dataclass, field\nfrom enum import Enum\n\n\n@dataclass\nclass Item:\n    name: str\n    price: float\n    qty: int = 1\n    tags: list = field(default_factory=list)\n\n    def __post_init__(self):\n        if self.price < 0:\n            raise ValueError("price must be >= 0")\n\n    @property\n    def total(self):\n        return self.price * self.qty\n\n\nclass Color(Enum):\n    RED = 1\n    GREEN = 2\n    BLUE = 3\n\n\ndef parse_color(name):\n    return Color[name.upper()]\n\n\n@dataclass(frozen=True, order=True)\nclass Version:\n    major: int\n    minor: int\n    patch: int',
      recall: [
        { type: 'choice', q: 'Which methods does `@dataclass` generate for you by default?', options: ['__init__, __repr__, __eq__', 'only __init__', '__str__ and __hash__', 'Nothing'], answer: 0, why: 'Plus ordering if order=True, hashing if frozen=True.' },
        { type: 'choice', q: 'Why `field(default_factory=list)` instead of `tags: list = []`?', options: ['A shared mutable default would be reused by every instance (dataclasses even reject it)', 'It is shorter', 'It makes a tuple', 'No reason'], answer: 0, why: 'A factory builds a fresh list per instance.' },
        { type: 'choice', q: 'What does `Color(2)` do for an Enum?', options: ['Creates a new colour', 'Looks up the member whose value is 2', 'Looks up by name', 'Raises always'], answer: 1, why: 'Call with a value to get the member; index with a name for lookup by name.' },
        { type: 'choice', q: 'Are type hints enforced at runtime by Python?', options: ['Yes', 'No, they are documentation for humans and tools', 'Only for classes', 'Only in functions'], answer: 1, why: 'Tools like mypy check them; the interpreter ignores them.' },
        { type: 'type', q: 'Which dataclass option makes instances immutable? (write it as `name=value`)', accept: ['frozen=True', 'frozen = True'], why: '`@dataclass(frozen=True)`.' },
      ],
    },
    {
      id: 'py-exceptions-custom', title: 'Custom exceptions & chaining', skill: 'Errors', xp: 35, diff: 3,
      read: `
# Exceptions are classes

Every exception inherits from \`BaseException\`; the ones you catch inherit from \`Exception\`. That means **inheritance decides what an \`except\` catches**: catching a parent also catches all its children.

~~~python
class AppError(Exception):
    """Base for everything this app raises."""

class ValidationError(AppError):
    def __init__(self, field, message):
        super().__init__(f"{field}: {message}")
        self.field = field

try:
    raise ValidationError("age", "must be positive")
except AppError as e:          # catches ValidationError too
    print(e, e.field)
~~~

Order \`except\` clauses from **most specific to most general**.

## Chaining and cleanup

~~~python
try:
    int("x")
except ValueError as e:
    raise AppError("bad input") from e     # keeps the original as __cause__

try:
    ...
except KeyError:
    ...
else:
    ...          # only runs if NO exception
finally:
    ...          # always runs
~~~

\`raise\` alone re-raises the current exception. \`assert cond, "message"\` raises \`AssertionError\` (for programmer errors, not user input).

> [!tip] Key idea
> Define one base error per library/app so callers can catch "anything from you" with a single \`except\`.
`,
      task: 'Define `AppError(Exception)`, `ValidationError(AppError)` (stores `.field`) and `NotFoundError(AppError)` (stores `.key`). Write `find_user(users, uid)` (dict lookup raising `NotFoundError`), `validate(user)` (raise `ValidationError("age", ...)` if age < 0), `handle(fn)` returning `("ok", result)`, `("validation", field)`, `("not_found", key)` or `("error", str(e))` for any other exception, and `load_config(text)` that parses JSON but re-raises bad JSON as `AppError("invalid config")` **chained from** the original `json.JSONDecodeError`.',
      starter: 'import json\n\n\nclass AppError(Exception):\n    pass\n\n\ndef find_user(users, uid):\n    pass\n\n\ndef validate(user):\n    pass\n\n\ndef handle(fn):\n    pass\n\n\ndef load_config(text):\n    pass\n',
      harness: r`
import json
assert issubclass(ValidationError, AppError) and issubclass(NotFoundError, AppError) and issubclass(AppError, Exception)
users = {1: {"name": "Ada", "age": 36}, 2: {"name": "Bo", "age": -1}}
assert find_user(users, 1)["name"] == "Ada"
try:
    find_user(users, 9)
except NotFoundError as e:
    assert e.key == 9
else:
    raise AssertionError("expected NotFoundError")
assert handle(lambda: validate(users[1])) == ("ok", None)
assert handle(lambda: validate(users[2])) == ("validation", "age")
assert handle(lambda: find_user(users, 7)) == ("not_found", 7)
assert handle(lambda: 1 / 0) == ("error", "division by zero")
assert handle(lambda: find_user(users, 1)["name"]) == ("ok", "Ada")
assert load_config('{"debug": true}') == {"debug": True}
try:
    load_config("{oops")
except AppError as e:
    assert str(e) == "invalid config"
    assert isinstance(e.__cause__, json.JSONDecodeError), "chain with 'raise ... from'"
else:
    raise AssertionError("expected AppError")
`,
      hints: ['Give each error class an `__init__` that stores its extra data and calls `super().__init__(message)`.', '`handle` catches `ValidationError`, then `NotFoundError`, then `Exception` (specific first).', '`raise AppError("invalid config") from e`'],
      solution: 'import json\n\n\nclass AppError(Exception):\n    pass\n\n\nclass ValidationError(AppError):\n    def __init__(self, field, message="invalid"):\n        super().__init__(f"{field}: {message}")\n        self.field = field\n\n\nclass NotFoundError(AppError):\n    def __init__(self, key):\n        super().__init__(f"not found: {key}")\n        self.key = key\n\n\ndef find_user(users, uid):\n    try:\n        return users[uid]\n    except KeyError:\n        raise NotFoundError(uid)\n\n\ndef validate(user):\n    if user["age"] < 0:\n        raise ValidationError("age", "must be >= 0")\n\n\ndef handle(fn):\n    try:\n        return ("ok", fn())\n    except ValidationError as e:\n        return ("validation", e.field)\n    except NotFoundError as e:\n        return ("not_found", e.key)\n    except Exception as e:\n        return ("error", str(e))\n\n\ndef load_config(text):\n    try:\n        return json.loads(text)\n    except json.JSONDecodeError as e:\n        raise AppError("invalid config") from e',
      recall: [
        { type: 'choice', q: 'If `class B(A)` and A, B are exceptions, what does `except A:` catch?', options: ['Only A', 'A and B (subclasses)', 'Only B', 'Neither'], answer: 1, why: 'An except clause matches the named class and all its subclasses.' },
        { type: 'choice', q: 'Why list `except` clauses from specific to general?', options: ['Style only', 'The first matching clause wins; a general one first would swallow specific ones', 'It is faster', 'Python requires alphabetical order'], answer: 1, why: 'Order matters.' },
        { type: 'choice', q: 'What does `raise X from e` do?', options: ['Hides e', 'Chains: e becomes X.__cause__ so the full story is shown', 'Retries', 'Deletes e'], answer: 1, why: 'Explicit chaining preserves the root cause.' },
        { type: 'choice', q: 'When does the `else` block of try/except run?', options: ['After an exception', 'When the try block raised nothing', 'Always', 'Never'], answer: 1, why: 'It is for code that should only run on success.' },
        { type: 'type', q: 'Which class do you normally subclass to create a custom exception?', accept: ['Exception', 'exception'], why: 'Subclass Exception (not BaseException).' },
      ],
    },
  ]);

  LP.addDrills({
    'py-inheritance': [
      { title: 'Manager pay', task: 'Write `Employee(name, base)` with `pay()` returning `base`, and `Manager(name, base, bonus)` whose `pay()` extends the parent\'s using `super()`.', starter: 'class Employee:\n    pass\n\n\nclass Manager(Employee):\n    pass\n', harness: r`
e, m = Employee("Ada", 100), Manager("Bo", 200, 50)
assert e.pay() == 100 and m.pay() == 250 and m.name == "Bo" and isinstance(m, Employee)
`, must: [{ re: 'super\\(\\)', msg: 'Use super() in Manager.' }], hints: ['`return super().pay() + self.bonus`'], solution: 'class Employee:\n    def __init__(self, name, base):\n        self.name = name\n        self.base = base\n\n    def pay(self):\n        return self.base\n\n\nclass Manager(Employee):\n    def __init__(self, name, base, bonus):\n        super().__init__(name, base)\n        self.bonus = bonus\n\n    def pay(self):\n        return super().pay() + self.bonus' },
      { title: 'Chorus', task: 'Write `Animal.speak()` -> `"..."`, `Dog` -> `"Woof"`, `Cat` -> `"Meow"`, and `chorus(animals)` returning every animal\'s sound as a list.', starter: 'class Animal:\n    pass\n\n\nclass Dog(Animal):\n    pass\n\n\nclass Cat(Animal):\n    pass\n\n\ndef chorus(animals):\n    pass\n', harness: r`
assert chorus([Dog(), Cat(), Animal()]) == ["Woof", "Meow", "..."] and chorus([]) == []
assert issubclass(Dog, Animal) and issubclass(Cat, Animal)
`, hints: ['Override `speak` in each subclass; `chorus` just calls `a.speak()`.'], solution: 'class Animal:\n    def speak(self):\n        return "..."\n\n\nclass Dog(Animal):\n    def speak(self):\n        return "Woof"\n\n\nclass Cat(Animal):\n    def speak(self):\n        return "Meow"\n\n\ndef chorus(animals):\n    return [a.speak() for a in animals]' },
      { title: 'Subclass a builtin', task: 'Write `Stack(list)` (subclassing `list`) with `push(x)`, `peek()` (last item without removing) and `is_empty()`; `pop()` comes free.', starter: 'class Stack(list):\n    pass\n', harness: r`
s = Stack()
assert s.is_empty()
s.push(1); s.push(2)
assert s.peek() == 2 and len(s) == 2 and s.pop() == 2 and s == [1] and not s.is_empty() and isinstance(s, list)
`, hints: ['`push = append`, `peek` returns `self[-1]`.'], solution: 'class Stack(list):\n    def push(self, x):\n        self.append(x)\n\n    def peek(self):\n        return self[-1]\n\n    def is_empty(self):\n        return len(self) == 0' },
    ],
    'py-polymorphism': [
      { title: 'Money', task: 'Write `Money(cents)` with `+`, `==`, `__str__` as dollars (`$1.50`) and `__repr__` `Money(150)`.', starter: 'class Money:\n    pass\n', harness: r`
a, b = Money(150), Money(275)
assert str(a) == "$1.50" and repr(a) == "Money(150)" and str(a + b) == "$4.25" and a == Money(150) and a != b and str(Money(5)) == "$0.05"
`, hints: ['`__add__` returns a new `Money`; format with `divmod(self.cents, 100)`.'], solution: 'class Money:\n    def __init__(self, cents):\n        self.cents = cents\n\n    def __add__(self, o):\n        return Money(self.cents + o.cents)\n\n    def __eq__(self, o):\n        return isinstance(o, Money) and self.cents == o.cents\n\n    def __hash__(self):\n        return hash(self.cents)\n\n    def __str__(self):\n        d, c = divmod(self.cents, 100)\n        return f"${d}.{c:02d}"\n\n    def __repr__(self):\n        return f"Money({self.cents})"' },
      { title: 'Countdown', task: 'Write an iterable class `Countdown(n)` yielding n, n-1, ..., 1 each time you loop over it (it must be reusable), with `len()` returning n.', starter: 'class Countdown:\n    pass\n', harness: r`
c = Countdown(3)
assert list(c) == [3, 2, 1] and list(c) == [3, 2, 1] and len(c) == 3 and list(Countdown(0)) == []
`, hints: ['`__iter__` can be a generator: `yield from range(self.n, 0, -1)`.'], solution: 'class Countdown:\n    def __init__(self, n):\n        self.n = n\n\n    def __iter__(self):\n        yield from range(self.n, 0, -1)\n\n    def __len__(self):\n        return self.n' },
      { title: 'Grid', task: 'Write `Grid(rows)` supporting `g[r, c]` (tuple index via `__getitem__`) and `value in g` (via `__contains__`).', starter: 'class Grid:\n    pass\n', harness: r`
g = Grid([[1, 2], [3, 4]])
assert g[0, 1] == 2 and g[1, 0] == 3 and 4 in g and 9 not in g
`, hints: ['`__getitem__(self, key)` receives the tuple `(r, c)`.'], solution: 'class Grid:\n    def __init__(self, rows):\n        self.rows = rows\n\n    def __getitem__(self, key):\n        r, c = key\n        return self.rows[r][c]\n\n    def __contains__(self, v):\n        return any(v in row for row in self.rows)' },
    ],
    'py-composition': [
      { title: 'Service with logger', task: 'Write `Logger` (stores `lines`, `log(msg)`) and `Service(logger)` whose `run()` logs `"start"` then `"end"` through the injected logger and returns `"done"`.', starter: 'class Logger:\n    pass\n\n\nclass Service:\n    pass\n', harness: r`
lg = Logger()
assert Service(lg).run() == "done" and lg.lines == ["start", "end"]
class Fake:
    def __init__(self): self.msgs = []
    def log(self, m): self.msgs.append(m)
f = Fake()
Service(f).run()
assert f.msgs == ["start", "end"], "Service must use the logger it was given"
`, hints: ['Store the logger in `__init__` and call `self.logger.log(...)`.'], solution: 'class Logger:\n    def __init__(self):\n        self.lines = []\n\n    def log(self, msg):\n        self.lines.append(msg)\n\n\nclass Service:\n    def __init__(self, logger):\n        self.logger = logger\n\n    def run(self):\n        self.logger.log("start")\n        self.logger.log("end")\n        return "done"' },
      { title: 'Dict mixin', task: 'Write `DictMixin.to_dict()` returning `vars(self)` as a new plain dict, and `Point(x, y)` using it.', starter: 'class DictMixin:\n    pass\n\n\nclass Point:\n    pass\n', harness: r`
p = Point(1, 2)
d = p.to_dict()
assert d == {"x": 1, "y": 2} and d is not p.__dict__
d["x"] = 99
assert p.x == 1, "to_dict must return a copy"
`, hints: ['`return dict(vars(self))`; `class Point(DictMixin)`.'], solution: 'class DictMixin:\n    def to_dict(self):\n        return dict(vars(self))\n\n\nclass Point(DictMixin):\n    def __init__(self, x, y):\n        self.x = x\n        self.y = y' },
      { title: 'Read the MRO', task: 'Write `mro_names(cls)` returning the names of the classes in the method resolution order, excluding `object`.', starter: 'def mro_names(cls):\n    pass\n', harness: r`
class A: pass
class B(A): pass
class C(A): pass
class D(B, C): pass
assert mro_names(D) == ["D", "B", "C", "A"] and mro_names(A) == ["A"] and mro_names(int) == ["int"]
`, hints: ['`cls.__mro__` is a tuple of classes.'], solution: 'def mro_names(cls):\n    return [c.__name__ for c in cls.__mro__ if c is not object]' },
    ],
    'py-abc': [
      { title: 'Shapes contract', task: 'Write abstract `Shape` with abstract `area()` and `perimeter()`, concrete `Square(side)`, and `total_area(shapes)`.', starter: 'from abc import ABC, abstractmethod\n\n\nclass Shape(ABC):\n    pass\n\n\nclass Square(Shape):\n    pass\n\n\ndef total_area(shapes):\n    pass\n', harness: r`
import inspect
assert inspect.isabstract(Shape) and set(Shape.__abstractmethods__) == {"area", "perimeter"}
s = Square(3)
assert (s.area(), s.perimeter()) == (9, 12) and total_area([Square(1), Square(2)]) == 5 and total_area([]) == 0
`, hints: ['Use `@abstractmethod` on both Shape methods.'], solution: 'from abc import ABC, abstractmethod\n\n\nclass Shape(ABC):\n    @abstractmethod\n    def area(self): ...\n\n    @abstractmethod\n    def perimeter(self): ...\n\n\nclass Square(Shape):\n    def __init__(self, side):\n        self.side = side\n\n    def area(self):\n        return self.side ** 2\n\n    def perimeter(self):\n        return 4 * self.side\n\n\ndef total_area(shapes):\n    return sum(s.area() for s in shapes)' },
      { title: 'Report template', task: 'Write abstract `Report` whose concrete `render()` returns `"== <title()> ==\\n<body()>\\n-- end --"`. `title()` and `body()` are abstract. Implement `Sales(Report)` returning title `"Sales"` and body `"42 units"`.', starter: 'from abc import ABC, abstractmethod\n\n\nclass Report(ABC):\n    pass\n\n\nclass Sales(Report):\n    pass\n', harness: r`
assert Sales().render() == "== Sales ==\n42 units\n-- end --"
try:
    Report()
except TypeError:
    pass
else:
    raise AssertionError("Report must be abstract")
`, hints: ['`render` calls `self.title()` and `self.body()`.'], solution: 'from abc import ABC, abstractmethod\n\n\nclass Report(ABC):\n    def render(self):\n        return f"== {self.title()} ==\\n{self.body()}\\n-- end --"\n\n    @abstractmethod\n    def title(self): ...\n\n    @abstractmethod\n    def body(self): ...\n\n\nclass Sales(Report):\n    def title(self):\n        return "Sales"\n\n    def body(self):\n        return "42 units"' },
      { title: 'Can I instantiate it?', task: 'Write `is_concrete(cls)` returning True when a class can be instantiated without abstract-method errors (use `inspect.isabstract`).', starter: 'import inspect\n\n\ndef is_concrete(cls):\n    pass\n', harness: r`
from abc import ABC, abstractmethod
class A(ABC):
    @abstractmethod
    def f(self): ...
class B(A):
    pass
class C(A):
    def f(self): return 1
assert is_concrete(A) is False and is_concrete(B) is False and is_concrete(C) is True and is_concrete(int) is True
`, hints: ['`not inspect.isabstract(cls)`'], solution: 'import inspect\n\n\ndef is_concrete(cls):\n    return not inspect.isabstract(cls)' },
    ],
    'py-properties': [
      { title: 'Validated circle', task: 'Write `Circle(radius)` with a validated `radius` property (positive, else `ValueError`) and a read-only `area` property.', starter: 'import math\n\n\nclass Circle:\n    pass\n', harness: r`
import math
c = Circle(2)
assert abs(c.area - 4 * math.pi) < 1e-9
c.radius = 3
assert abs(c.area - 9 * math.pi) < 1e-9
for bad in (0, -1):
    try:
        c.radius = bad
    except ValueError:
        pass
    else:
        raise AssertionError("must reject non-positive radius")
try:
    c.area = 5
except AttributeError:
    pass
else:
    raise AssertionError("area must be read-only")
`, hints: ['`area` property with no setter is read-only.'], solution: 'import math\n\n\nclass Circle:\n    def __init__(self, radius):\n        self.radius = radius\n\n    @property\n    def radius(self):\n        return self._radius\n\n    @radius.setter\n    def radius(self, v):\n        if v <= 0:\n            raise ValueError("radius must be positive")\n        self._radius = v\n\n    @property\n    def area(self):\n        return math.pi * self._radius ** 2' },
      { title: 'Alternate constructor', task: 'Write `Person(name, age)` and classmethod `Person.from_string("Ada Lovelace,36")` -> a Person with name `"Ada Lovelace"` and int age.', starter: 'class Person:\n    pass\n', harness: r`
p = Person.from_string("Ada Lovelace,36")
assert (p.name, p.age) == ("Ada Lovelace", 36) and isinstance(p, Person)
class Kid(Person): pass
assert type(Kid.from_string("Bo,5")) is Kid
`, hints: ['`name, age = text.rsplit(",", 1)` then `cls(name, int(age))`.'], solution: 'class Person:\n    def __init__(self, name, age):\n        self.name = name\n        self.age = age\n\n    @classmethod\n    def from_string(cls, text):\n        name, age = text.rsplit(",", 1)\n        return cls(name, int(age))' },
      { title: 'Registry', task: 'Write `Registry` with a **class-level** list `items` and classmethods `register(x)` / `count()`, so every use shares one list.', starter: 'class Registry:\n    pass\n', harness: r`
Registry.items.clear()
Registry.register("a"); Registry.register("b")
assert Registry.count() == 2 and Registry.items == ["a", "b"]
`, hints: ['Define `items = []` in the class body and use `cls.items`.'], solution: 'class Registry:\n    items = []\n\n    @classmethod\n    def register(cls, x):\n        cls.items.append(x)\n\n    @classmethod\n    def count(cls):\n        return len(cls.items)' },
    ],
    'py-dataclasses': [
      { title: 'Student', task: 'Write dataclass `Student(name, grades=[])` (safe default) with `average()` (0 for no grades).', starter: 'from dataclasses import dataclass, field\n\n\nclass Student:\n    pass\n', harness: r`
from dataclasses import is_dataclass
assert is_dataclass(Student)
s = Student("Ada", [90, 80])
assert s.average() == 85 and Student("Bo").average() == 0
a, b = Student("x"), Student("y")
a.grades.append(1)
assert b.grades == []
`, hints: ['`grades: list = field(default_factory=list)`'], solution: 'from dataclasses import dataclass, field\n\n\n@dataclass\nclass Student:\n    name: str\n    grades: list = field(default_factory=list)\n\n    def average(self):\n        return sum(self.grades) / len(self.grades) if self.grades else 0' },
      { title: 'Priorities', task: 'Define `Priority(IntEnum)` with LOW=1, MEDIUM=2, HIGH=3 and `urgent_first(tasks)` sorting `(name, Priority)` tuples by priority descending, then name.', starter: 'from enum import IntEnum\n\n\nclass Priority(IntEnum):\n    pass\n\n\ndef urgent_first(tasks):\n    pass\n', harness: r`
assert Priority.HIGH > Priority.LOW and Priority.MEDIUM == 2
assert urgent_first([("b", Priority.LOW), ("a", Priority.HIGH), ("c", Priority.HIGH)]) == [("a", Priority.HIGH), ("c", Priority.HIGH), ("b", Priority.LOW)]
`, hints: ['Key: `(-int(p), name)`.'], solution: 'from enum import IntEnum\n\n\nclass Priority(IntEnum):\n    LOW = 1\n    MEDIUM = 2\n    HIGH = 3\n\n\ndef urgent_first(tasks):\n    return sorted(tasks, key=lambda t: (-t[1], t[0]))' },
      { title: 'Immutable update', task: 'Given the frozen dataclass `Point`, write `move(p, dx, dy)` returning a **new** moved point using `dataclasses.replace` (the original must not change).', starter: 'from dataclasses import dataclass, replace\n\n\n@dataclass(frozen=True)\nclass Point:\n    x: int\n    y: int\n\n\ndef move(p, dx, dy):\n    pass\n', harness: r`
p = Point(1, 2)
q = move(p, 3, 4)
assert q == Point(4, 6) and p == Point(1, 2) and q is not p
`, must: [{ re: 'replace\\(', msg: 'Use dataclasses.replace.' }], hints: ['`replace(p, x=p.x + dx, y=p.y + dy)`'], solution: 'from dataclasses import dataclass, replace\n\n\n@dataclass(frozen=True)\nclass Point:\n    x: int\n    y: int\n\n\ndef move(p, dx, dy):\n    return replace(p, x=p.x + dx, y=p.y + dy)' },
    ],
    'py-exceptions-custom': [
      { title: 'Retry on type', task: 'Write `retry_on(exc_types, f, n)` calling `f()` up to n times, retrying **only** when it raises one of `exc_types` (a tuple); other exceptions propagate immediately.', starter: 'def retry_on(exc_types, f, n):\n    pass\n', harness: r`
calls = []
def f():
    calls.append(1)
    if len(calls) < 3:
        raise KeyError("k")
    return "ok"
assert retry_on((KeyError,), f, 5) == "ok" and len(calls) == 3
def g():
    raise ValueError("no retry")
try:
    retry_on((KeyError,), g, 3)
except ValueError:
    pass
else:
    raise AssertionError("ValueError must propagate immediately")
`, hints: ['`except exc_types:` accepts a tuple; re-raise on the last attempt.'], solution: 'def retry_on(exc_types, f, n):\n    for attempt in range(n):\n        try:\n            return f()\n        except exc_types:\n            if attempt == n - 1:\n                raise' },
      { title: 'HTTP errors', task: 'Write `HTTPError(Exception)` storing `status`, with a `retryable` property that is True for 429 and 500-599.', starter: 'class HTTPError(Exception):\n    pass\n', harness: r`
e = HTTPError(503)
assert e.status == 503 and e.retryable is True and HTTPError(429).retryable and not HTTPError(404).retryable and not HTTPError(200).retryable
assert issubclass(HTTPError, Exception) and "503" in str(e)
`, hints: ['Pass a message to `super().__init__` so `str(e)` includes the status.'], solution: 'class HTTPError(Exception):\n    def __init__(self, status):\n        super().__init__(f"HTTP {status}")\n        self.status = status\n\n    @property\n    def retryable(self):\n        return self.status == 429 or 500 <= self.status < 600' },
      { title: 'Finally always runs', task: 'Write `read_value(log, fn)`: append `"open"` to `log`, return `fn()`, and **always** append `"closed"` (even if `fn` raises, in which case the exception still propagates).', starter: 'def read_value(log, fn):\n    pass\n', harness: r`
log = []
assert read_value(log, lambda: 5) == 5 and log == ["open", "closed"]
log2 = []
def boom():
    raise RuntimeError("x")
try:
    read_value(log2, boom)
except RuntimeError:
    pass
else:
    raise AssertionError("exception must propagate")
assert log2 == ["open", "closed"]
`, hints: ['Put the cleanup in a `finally:` block.'], solution: 'def read_value(log, fn):\n    log.append("open")\n    try:\n        return fn()\n    finally:\n        log.append("closed")' },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
