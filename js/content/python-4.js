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

      ],
    },

    
  ]);

  LP.addDrills({
    'py-inheritance': [
      { title: 'Manager pay', task: 'Write `Employee(name, base)` with `pay()` returning `base`, and `Manager(name, base, bonus)` whose `pay()` extends the parent\'s using `super()`.', starter: 'class Employee:\n    pass\n\n\nclass Manager(Employee):\n    pass\n', harness: r`
e, m = Employee("Ada", 100), Manager("Bo", 200, 50)
assert e.pay() == 100 and m.pay() == 250 and m.name == "Bo" and isinstance(m, Employee)
`, must: [{ re: 'super\\(\\)', msg: 'Use super() in Manager.' }], hints: ['`return super().pay() + self.bonus`'], solution: 'class Employee:\n    def __init__(self, name, base):\n        self.name = name\n        self.base = base\n\n    def pay(self):\n        return self.base\n\n\nclass Manager(Employee):\n    def __init__(self, name, base, bonus):\n        super().__init__(name, base)\n        self.bonus = bonus\n\n    def pay(self):\n        return super().pay() + self.bonus' },

    ],

    
  });
})(typeof window !== 'undefined' ? window : globalThis);
