(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  const r = String.raw;
  LP.addLessons('r', [
    {
      id: 'r-s3', title: 'S3 classes: generics, methods & inheritance', skill: 'Inheritance', xp: 40, diff: 3, arc: 'oop-r',
      read: `
# The simplest object system in R

An **S3 object** is just an R object with a \`class\` attribute. A **generic function** looks at that class and dispatches to the right **method**, named \`generic.class\`.

~~~r
new_dog <- function(name) {
  structure(list(name = name), class = c("dog", "animal"))   # a VECTOR of classes = inheritance
}

speak <- function(x, ...) UseMethod("speak")        # the generic
speak.animal  <- function(x, ...) paste(x$name, "makes a sound")
speak.dog     <- function(x, ...) paste0(NextMethod(), " (woof!)")   # NextMethod = super()
speak.default <- function(x, ...) "…silence"

d <- new_dog("Rex")
speak(d)        # "Rex makes a sound (woof!)"
speak(42)       # "…silence" (no class match -> default method)
~~~

## How dispatch works

\`class(d)\` is \`c("dog", "animal")\`. R tries \`speak.dog\`, then \`speak.animal\`, then \`speak.default\`. \`NextMethod()\` continues down that chain, so a child can **extend** its parent's behaviour.

~~~r
inherits(d, "animal")          # TRUE
class(d)[1]                    # most specific class
unclass(d)                     # strip the class, see the raw list
~~~

## Printing and the constructor pattern

You have already used generics: \`print\`, \`format\`, \`summary\`, \`length\`. Give your class a \`print\` method and typing the object's name uses it:

~~~r
print.animal <- function(x, ...) { cat("<", class(x)[1], ": ", x$name, ">\\n", sep = ""); invisible(x) }
~~~

Good S3 style: a **constructor** (\`new_x()\`) that sets the class, plus a **validator** that checks inputs.

> [!warn] S3 has no enforcement
> Nothing stops \`class(x) <- "dog"\` on any object. S3 trusts you: validate in constructors.
`,
      task: 'Write constructor `new_animal(name, sound = "...", subclass = character())` (class vector `c(subclass, "animal")`; stop with `"name must be a single string"` for bad names), `new_dog(name)` (sound "Woof", subclass "dog"), `new_cat(name)` (sound "Meow", subclass "cat"); generic `speak` with methods: animal -> `"<name> says <sound>"`, dog -> same text plus `"!"` using `NextMethod()`; generic `describe` with an animal method (`"a <class> named <name>"`) and a default (`"unknown thing"`); and `print.animal` printing `<dog: Rex>` (class then name) and returning the object invisibly.',
      starter: 'new_animal <- function(name, sound = "...", subclass = character()) {\n  \n}\n\nnew_dog <- function(name) {\n  \n}\n\nnew_cat <- function(name) {\n  \n}\n\nspeak <- function(x, ...) {\n  \n}\n\ndescribe <- function(x, ...) {\n  \n}\n',
      harness: r`
d <- new_dog("Rex"); k <- new_cat("Tom"); a <- new_animal("Generic")
check(identical(class(d), c("dog", "animal")) && identical(class(k), c("cat", "animal")) && identical(class(a), "animal"), "classes should be c('dog','animal'), c('cat','animal') and 'animal'")
check(identical(speak(a), "Generic says ..."), paste("speak(animal) gave", speak(a)))
check(identical(speak(d), "Rex says Woof!"), paste("speak(dog) gave", speak(d), "- dog should extend the animal method with NextMethod()"))
check(identical(speak(k), "Tom says Meow"), "cats use the animal method unchanged")
check(identical(describe(d), "a dog named Rex") && identical(describe(a), "a animal named Generic") && identical(describe(42), "unknown thing"), "describe is wrong")
check(identical(capture.output(print(d)), "<dog: Rex>"), paste("print gave:", paste(capture.output(print(d)), collapse = "|")))
res <- withVisible(print(d))
check(!res$visible && identical(res$value, d), "print methods should return the object invisibly")
msg <- tryCatch(new_animal(c("a", "b")), error = function(e) conditionMessage(e))
check(identical(msg, "name must be a single string") && identical(tryCatch(new_animal(1), error = function(e) conditionMessage(e)), "name must be a single string"), "bad names must stop with 'name must be a single string'")
check(inherits(d, "animal") && !inherits(k, "dog") && identical(unclass(d)$sound, "Woof"), "inheritance checks failed")
`,
      hints: ['`structure(list(name = name, sound = sound), class = c(subclass, "animal"))`; validate first with `if (!is.character(name) || length(name) != 1) stop(...)`.', '`new_dog <- function(name) new_animal(name, "Woof", "dog")`', '`speak <- function(x, ...) UseMethod("speak")` then define `speak.animal` and `speak.dog` (`paste0(NextMethod(), "!")`).', 'Define `describe.animal` and `describe.default`; `print.animal` should `cat(sprintf(...))` and `invisible(x)`.'],
      solution: 'new_animal <- function(name, sound = "...", subclass = character()) {\n  if (!is.character(name) || length(name) != 1) stop("name must be a single string")\n  structure(list(name = name, sound = sound), class = c(subclass, "animal"))\n}\n\nnew_dog <- function(name) new_animal(name, "Woof", "dog")\nnew_cat <- function(name) new_animal(name, "Meow", "cat")\n\nspeak <- function(x, ...) UseMethod("speak")\nspeak.animal <- function(x, ...) paste(x$name, "says", x$sound)\nspeak.dog <- function(x, ...) paste0(NextMethod(), "!")\n\ndescribe <- function(x, ...) UseMethod("describe")\ndescribe.animal <- function(x, ...) paste("a", class(x)[1], "named", x$name)\ndescribe.default <- function(x, ...) "unknown thing"\n\nprint.animal <- function(x, ...) {\n  cat(sprintf("<%s: %s>\\n", class(x)[1], x$name))\n  invisible(x)\n}',
      recall: [
        { type: 'choice', q: 'How does an S3 object get its class?', options: ['Through a class definition block', 'By setting its `class` attribute (e.g. with structure())', 'By inheriting from a parent file', 'Automatically from its name'], answer: 1, why: 'S3 is informal: a class is just a label attribute.' },
        { type: 'choice', q: 'With `class(x) <- c("dog", "animal")`, in which order does R search for `speak` methods?', options: ['speak.animal, then speak.dog', 'speak.dog, then speak.animal, then speak.default', 'Only speak.dog', 'Alphabetical'], answer: 1, why: 'The class vector is searched left to right, then default.' },
        { type: 'choice', q: 'What does `NextMethod()` do?', options: ['Calls the next method in the class chain (like super())', 'Restarts the generic', 'Returns NULL', 'Deletes the class'], answer: 0, why: 'It lets a method extend the parent class\'s behaviour.' },
        { type: 'choice', q: 'What does a generic function contain?', options: ['A call to UseMethod("name")', 'A list of classes', 'A loop', 'Nothing'], answer: 0, why: '`f <- function(x, ...) UseMethod("f")`.' },
        { type: 'type', q: 'Which function tests whether an object inherits from a class? (name only)', accept: ['inherits', 'inherits()'], why: '`inherits(x, "animal")`.' },
      ],
    },
    {
      id: 'r-s3-ops', title: 'S3 in depth: operators, formatting & group generics', skill: 'Inheritance', xp: 40, diff: 3, arc: 'oop-r',
      read: `
# Make your class behave like a built-in type

Operators and many functions are generics, so your class can overload them.

~~~r
money <- function(x, currency = "USD") structure(x, currency = currency, class = "money")

format.money <- function(x, ...) sprintf("$%.2f", unclass(x))
print.money  <- function(x, ...) { print(noquote(format(x))); invisible(x) }
~~~

## Group generics

Instead of writing \`"+.money"\`, \`"-.money"\`, ... separately, define the whole group once:

| Group | Covers |
|---|---|
| \`Ops\` | arithmetic and comparison: \`+ - * / == < > ...\` |
| \`Math\` | \`abs round floor sqrt exp ...\` |
| \`Summary\` | \`sum min max range any all\` |

Inside a group method, \`.Generic\` holds the name of the operation actually called.

~~~r
Ops.money <- function(e1, e2) {
  v1 <- as.numeric(unclass(e1)); v2 <- as.numeric(unclass(e2))
  switch(.Generic,
    "+" = , "-" = money(get(.Generic)(v1, v2)),
    "*" = money(v1 * v2),
    "==" = , "<" = , ">" = get(.Generic)(v1, v2),
    stop("unsupported operation: ", .Generic))
}
Summary.money <- function(..., na.rm = FALSE) {
  money(get(.Generic)(unlist(lapply(list(...), unclass)), na.rm = na.rm))
}
~~~

## Subsetting must keep the class

\`x[i]\` drops attributes by default. Provide \`[.money\` so subsets and \`sort()\` still return money:

~~~r
"[.money" <- function(x, i) money(unclass(x)[i], attr(x, "currency"))
~~~

> [!tip] Key idea
> \`sort\`, \`rev\`, \`unique\` and friends work on your class automatically once \`[\`, \`length\` and comparison work.
`,
      task: 'Implement S3 class `money`: constructor `money(x, currency = "USD")`; `format.money` (`"$12.50"`, vectorised); `print.money` (prints like `[1] $12.50 $3.00`, no quotes, returns invisibly); group method `Ops.money` (`+` and `-` on two money values and `*` with a plain number (either side) return money; `== != < > <= >=` return plain logicals; anything else stops with `"unsupported operation: <op>"`); `"[.money"` (keeps the class and currency); `Summary.money` (`sum`/`max`/`min` return money).',
      starter: 'money <- function(x, currency = "USD") {\n  \n}\n\nformat.money <- function(x, ...) {\n  \n}\n\nprint.money <- function(x, ...) {\n  \n}\n\nOps.money <- function(e1, e2) {\n  \n}\n\n`[.money` <- function(x, i) {\n  \n}\n\nSummary.money <- function(..., na.rm = FALSE) {\n  \n}\n',
      harness: r`
a <- money(c(12.5, 3)); b <- money(c(1, 2))
check(identical(format(a), c("$12.50", "$3.00")), "format(money) should be c('$12.50', '$3.00')")
check(identical(trimws(capture.output(print(a))), "[1] $12.50 $3.00"), paste("print gave:", paste(capture.output(print(a)), collapse = "|")))
s <- a + b
check(inherits(s, "money") && identical(as.numeric(s), c(13.5, 5)), "money + money should be money")
check(identical(as.numeric(a - b), c(11.5, 1)) && inherits(a - b, "money"), "money - money should be money")
check(identical(as.numeric(a * 2), c(25, 6)) && inherits(a * 2, "money") && inherits(2 * a, "money") && identical(as.numeric(2 * a), c(25, 6)), "multiplying by a number should work on either side")
check(identical(a > b, c(TRUE, TRUE)) && identical(a == a, c(TRUE, TRUE)) && !inherits(a < b, "money") && identical(a != b, c(TRUE, TRUE)), "comparisons should give plain logicals")
msg <- tryCatch(a / b, error = function(e) conditionMessage(e))
check(identical(msg, "unsupported operation: /"), paste("a / b gave:", msg))
check(inherits(a[1], "money") && identical(format(a[2]), "$3.00") && identical(attr(a[1], "currency"), "USD"), "subsetting must keep the money class")
tot <- sum(a)
check(inherits(tot, "money") && as.numeric(tot) == 15.5 && identical(trimws(capture.output(print(max(a)))), "[1] $12.50") && as.numeric(min(a)) == 3, "sum/max/min should return money")
check(inherits(sort(a), "money") && identical(as.numeric(sort(a)), c(3, 12.5)), "sort() should work and keep the class (needs [ and comparison)")
check(identical(attr(money(1, "EUR"), "currency"), "EUR"), "currency attribute should be stored")
`,
      hints: ['`structure(x, currency = currency, class = "money")`', '`format.money`: `sprintf("$%.2f", unclass(x))`; `print.money`: `print(noquote(format(x)))`.', 'In `Ops.money` strip classes with `as.numeric(unclass(e1))`, then `switch(.Generic, ...)`. Use `get(.Generic)(v1, v2)` to run the operator.', '`"[.money" <- function(x, i) money(unclass(x)[i], attr(x, "currency"))`', '`Summary.money`: flatten the inputs, `get(.Generic)(vals, na.rm = na.rm)`, wrap with `money()`.'],
      solution: 'money <- function(x, currency = "USD") {\n  structure(x, currency = currency, class = "money")\n}\n\nformat.money <- function(x, ...) {\n  sprintf("$%.2f", as.numeric(unclass(x)))\n}\n\nprint.money <- function(x, ...) {\n  print(noquote(format(x)))\n  invisible(x)\n}\n\nOps.money <- function(e1, e2) {\n  v1 <- as.numeric(unclass(e1))\n  v2 <- as.numeric(unclass(e2))\n  switch(.Generic,\n    "+" = , "-" = money(get(.Generic)(v1, v2)),\n    "*" = money(v1 * v2),\n    "==" = , "!=" = , "<" = , ">" = , "<=" = , ">=" = get(.Generic)(v1, v2),\n    stop("unsupported operation: ", .Generic))\n}\n\n`[.money` <- function(x, i) {\n  money(as.numeric(unclass(x))[i], attr(x, "currency"))\n}\n\nSummary.money <- function(..., na.rm = FALSE) {\n  vals <- unlist(lapply(list(...), function(v) as.numeric(unclass(v))))\n  money(get(.Generic)(vals, na.rm = na.rm))\n}',
      recall: [
        { type: 'choice', q: 'What is `.Generic` inside an `Ops.myclass` method?', options: ['The class name', 'The name of the operator actually being called (e.g. "+")', 'The first argument', 'NULL'], answer: 1, why: 'It lets one method handle the whole group.' },
        { type: 'choice', q: 'Why define `"[.myclass"`?', options: ['Subsetting drops attributes/class by default; the method keeps them', 'It is required for print', 'It speeds up loops', 'It enables sorting only'], answer: 0, why: 'Otherwise a subset of your object loses its class.' },
        { type: 'choice', q: 'Which group generic covers `sum`, `max` and `min`?', options: ['Ops', 'Math', 'Summary', 'Group'], answer: 2, why: 'Summary handles sum, min, max, range, any, all, prod.' },
        { type: 'choice', q: 'What does `print(noquote(c("a", "b")))` do?', options: ['Prints without quotation marks', 'Prints twice', 'Errors', 'Prints the class'], answer: 0, why: 'noquote suppresses the quotes.' },
        { type: 'type', q: 'Which function removes the class attribute so you see the underlying data? (name only)', accept: ['unclass', 'unclass()'], why: '`unclass(x)`.' },
      ],
    },
    {
      id: 'r-s4', title: 'S4 classes: formal objects & inheritance', skill: 'Inheritance', xp: 45, diff: 3, arc: 'oop-r',
      read: `
# Formal classes with checked slots

**S4** is R's strict object system: classes declare their **slots** (fields) with types, objects are created with \`new()\`, and methods are attached to **generics** for specific classes.

~~~r
setClass("Person", representation(name = "character", age = "numeric"))
p <- new("Person", name = "Ada", age = 36)
p@name                 # slot access uses @
is(p, "Person"); isVirtualClass("Person")
~~~

## Validity

~~~r
setClass("Person", representation(name = "character", age = "numeric"),
  validity = function(object) if (object@age < 0) "age must be >= 0" else TRUE)
new("Person", name = "X", age = -1)     # error: invalid class "Person" object: age must be >= 0
~~~

## Generics and methods

~~~r
setGeneric("greet", function(obj, ...) standardGeneric("greet"))
setMethod("greet", "Person", function(obj, ...) paste("Hi,", obj@name))
setMethod("show", "Person", function(object) cat("<Person ", object@name, ">\\n", sep = ""))
~~~

\`setGeneric\` prints its name (\`[1] "greet"\`): that is normal.

## Inheritance with contains

~~~r
setClass("Student", contains = "Person", representation(school = "character"))
setMethod("greet", "Student", function(obj, ...) paste(callNextMethod(), "from", obj@school))
~~~

\`callNextMethod()\` calls the parent's method (S4's \`super()\`). A **virtual class** (\`representation("VIRTUAL")\`) cannot be instantiated: it defines a shared interface.

> [!tip] S3 vs S4
> S3: informal, quick, flexible. S4: slot types, validity, multiple dispatch, formal inheritance, used by Bioconductor.
`,
      task: 'Define a **virtual** class `Shape` with slot `name`; `Circle` (slot `r`, default name "circle", validity: `"radius must be non-negative"` when r < 0), `Rect` (slots `w`, `h`, default name "rect") and `Square` extending `Rect` (default name "square") plus helper `Square(side)`. Generic `area(shape)` with methods for Circle and Rect. Generic `describe(shape, ...)` with a method on `Shape` (`"<name> with area <2 decimals>"`) and a method on `Square` that adds `" (a square)"` using `callNextMethod()`. A `show` method for `Shape` printing `<circle>`-style (`<name>`).',
      starter: 'setClass("Shape", representation("VIRTUAL", name = "character"))\n\n# Circle, Rect, Square\n\nSquare <- function(side) {\n  \n}\n\n# generics and methods: area, describe, show\n',
      harness: r`
check(isVirtualClass("Shape"), "Shape should be a virtual class")
check(inherits(tryCatch(new("Shape"), error = function(e) e), "error"), "a virtual class cannot be instantiated")
c1 <- new("Circle", r = 1); r1 <- new("Rect", w = 3, h = 4); sq <- Square(5)
check(isTRUE(all.equal(area(c1), pi)) && area(r1) == 12 && area(sq) == 25, "area wrong for Circle/Rect/Square")
msg <- tryCatch(new("Circle", r = -1), error = function(e) conditionMessage(e))
check(grepl("radius must be non-negative", msg), paste("validity message was:", msg))
check(is(sq, "Rect") && is(sq, "Shape") && is(c1, "Shape") && !is(c1, "Rect"), "inheritance relationships are wrong")
check(identical(c1@name, "circle") && identical(r1@name, "rect") && identical(sq@name, "square") && sq@w == 5 && sq@h == 5, "default names and Square(side) are wrong")
check(identical(describe(c1), "circle with area 3.14") && identical(describe(r1), "rect with area 12.00"), "describe(Shape) is wrong")
check(identical(describe(sq), "square with area 25.00 (a square)"), paste("describe(Square) gave:", describe(sq), "- use callNextMethod()"))
check(identical(capture.output(print(c1)), "<circle>") && identical(capture.output(sq), "<square>"), "show should print <name>")
`,
      hints: ['`setClass("Circle", contains = "Shape", representation(r = "numeric"), prototype(name = "circle"), validity = function(object) ...)`', 'The validity function returns `TRUE` or a character message.', '`Square <- function(side) new("Square", w = side, h = side)`', '`setGeneric("area", function(shape) standardGeneric("area"))` then `setMethod("area", "Circle", function(shape) ...)`.', 'Square describe: `paste(callNextMethod(), "(a square)")`. show: `cat("<", object@name, ">\\n", sep = "")`.'],
      solution: 'setClass("Shape", representation("VIRTUAL", name = "character"))\n\nsetClass("Circle", contains = "Shape", representation(r = "numeric"), prototype(name = "circle"),\n  validity = function(object) if (length(object@r) != 1 || object@r < 0) "radius must be non-negative" else TRUE)\nsetClass("Rect", contains = "Shape", representation(w = "numeric", h = "numeric"), prototype(name = "rect"))\nsetClass("Square", contains = "Rect", prototype = prototype(name = "square"))\n\nSquare <- function(side) {\n  new("Square", w = side, h = side)\n}\n\nsetGeneric("area", function(shape) standardGeneric("area"))\nsetMethod("area", "Circle", function(shape) pi * shape@r^2)\nsetMethod("area", "Rect", function(shape) shape@w * shape@h)\n\nsetGeneric("describe", function(shape, ...) standardGeneric("describe"))\nsetMethod("describe", "Shape", function(shape, ...) sprintf("%s with area %.2f", shape@name, area(shape)))\nsetMethod("describe", "Square", function(shape, ...) paste(callNextMethod(), "(a square)"))\n\nsetMethod("show", "Shape", function(object) cat("<", object@name, ">\\n", sep = ""))',
      recall: [
        { type: 'choice', q: 'How do you read a slot of an S4 object `p`?', options: ['p$name', 'p@name', 'p[["name"]]', 'slot.name(p)'], answer: 1, why: 'The @ operator accesses slots (or slot(p, "name")).' },
        { type: 'choice', q: 'What does a virtual class do?', options: ['Cannot be instantiated; defines a shared interface for subclasses', 'Runs faster', 'Is only for numbers', 'Is deleted after use'], answer: 0, why: 'new() on a virtual class is an error.' },
        { type: 'choice', q: 'What does the `validity` function return when the object is fine?', options: ['FALSE', 'TRUE', 'NULL always', 'The object'], answer: 1, why: 'Return TRUE, or one or more character strings describing the problems.' },
        { type: 'choice', q: 'What is `callNextMethod()` in S4?', options: ['Calls the method of the parent class (like super())', 'Calls the generic again', 'Deletes the method', 'Prints the class'], answer: 0, why: 'It continues dispatch to the next method up the inheritance chain.' },
        { type: 'type', q: 'Which function creates an object of an S4 class? (name only)', accept: ['new', 'new()'], why: '`new("Person", name = "Ada")`.' },
      ],
    },
    {
      id: 'r-r5', title: 'Reference classes: mutable objects', skill: 'Inheritance', xp: 45, diff: 3, arc: 'oop-r',
      read: `
# Objects that change in place

Most R objects are **copied** when modified. **Reference classes** (R5, \`setRefClass\`) behave like objects in Python or Java: methods modify the object itself.

~~~r
Account <- setRefClass("Account",
  fields  = list(owner = "character", balance = "numeric"),
  methods = list(
    deposit = function(x) {
      balance <<- balance + x       # <<- modifies the field
      invisible(.self)              # return the object so calls can chain
    },
    show = function() cat("Account<", owner, ">\\n", sep = "")
  ))

a <- Account$new(owner = "Ada", balance = 100)
a$deposit(50)$deposit(25)           # method chaining
a$balance                           # 175
~~~

## Reference semantics

~~~r
b <- a                 # NOT a copy: b and a are the same object
b$deposit(10)
a$balance              # 185
c <- a$copy()          # an independent copy
~~~

## Inheritance

~~~r
Savings <- setRefClass("Savings", contains = "Account",
  fields  = list(rate = "numeric"),
  methods = list(
    deposit = function(x) {
      callSuper(x)                  # run the parent's deposit
      invisible(.self)
    },
    add_interest = function() {
      balance <<- balance * (1 + rate)
      invisible(.self)
    }))
~~~

\`callSuper(...)\` is R5's \`super()\`. Override \`initialize\` to customise construction (call \`callSuper(...)\` or \`initFields(...)\`).

> [!tip] Which object system?
> **S3** for quick, lightweight classes; **S4** for validated, formal designs; **Reference classes** when you need mutable state shared by reference (simulations, caches, GUIs).
`,
      task: 'Define Reference class `Account` (fields `owner` character, `balance` numeric; methods `deposit(x)` and `withdraw(x)` both returning the object invisibly so they chain; `withdraw` stops with `"insufficient funds"` when x exceeds the balance; `show()` printing `Account<Ada: 130>` style, owner then balance) and `Savings` (contains Account; fields `rate` numeric and `deposits` numeric starting at 0; `deposit` that counts deposits and calls `callSuper`; `add_interest()` multiplying the balance by `1 + rate`).',
      starter: 'Account <- setRefClass("Account")\n\nSavings <- setRefClass("Savings")\n',
      harness: r`
a <- Account$new(owner = "Ada", balance = 100)
a$deposit(50)$withdraw(30)
check(a$balance == 120, "chained deposit/withdraw should leave 120 (methods must return the object invisibly)")
b <- a; b$deposit(10)
check(a$balance == 130, "b <- a is NOT a copy: both names refer to the same object")
c2 <- a$copy(); c2$deposit(1000)
check(a$balance == 130 && c2$balance == 1130, "copy() should make an independent object")
msg <- tryCatch(a$withdraw(1e6), error = function(e) conditionMessage(e))
check(identical(msg, "insufficient funds") && a$balance == 130, "overdraft should fail with 'insufficient funds' and leave the balance")
check(identical(capture.output(print(a)), "Account<Ada: 130>"), paste("show printed:", paste(capture.output(print(a)), collapse = "|")))
s <- Savings$new(owner = "Bo", balance = 100, rate = 0.1)
s$deposit(100); s$deposit(50)
check(s$balance == 250 && s$deposits == 2, paste("balance", s$balance, "deposits", s$deposits))
s$add_interest()
check(isTRUE(all.equal(s$balance, 275)), "add_interest should multiply the balance by 1.1")
check(is(s, "Account") && inherits(tryCatch(s$withdraw(1e6), error = function(e) e), "error"), "Savings must inherit Account (including withdraw)")
check(Account$new(owner = "X", balance = 1)$balance == 1 && Savings$new(owner = "Y", balance = 2, rate = 0)$deposits == 0, "new objects should start cleanly")
`,
      hints: ['`setRefClass("Account", fields = list(owner = "character", balance = "numeric"), methods = list(...))`', 'Modify fields with `<<-` and end methods with `invisible(.self)` so they chain.', 'Savings: `contains = "Account"`; override `deposit` with `deposits <<- deposits + 1; callSuper(x)`.', 'Give `deposits` an initial value by overriding `initialize = function(...) { callSuper(...); if (length(deposits) == 0) deposits <<- 0 }`.'],
      solution: 'Account <- setRefClass("Account",\n  fields = list(owner = "character", balance = "numeric"),\n  methods = list(\n    deposit = function(x) {\n      balance <<- balance + x\n      invisible(.self)\n    },\n    withdraw = function(x) {\n      if (x > balance) stop("insufficient funds")\n      balance <<- balance - x\n      invisible(.self)\n    },\n    show = function() {\n      cat(sprintf("Account<%s: %s>\\n", owner, balance))\n    }\n  ))\n\nSavings <- setRefClass("Savings", contains = "Account",\n  fields = list(rate = "numeric", deposits = "numeric"),\n  methods = list(\n    initialize = function(...) {\n      callSuper(...)\n      if (length(deposits) == 0) deposits <<- 0\n      invisible(.self)\n    },\n    deposit = function(x) {\n      deposits <<- deposits + 1\n      callSuper(x)\n      invisible(.self)\n    },\n    add_interest = function() {\n      balance <<- balance * (1 + rate)\n      invisible(.self)\n    }\n  ))',
      recall: [
        { type: 'choice', q: 'What does `b <- a` do for a Reference class object `a`?', options: ['Copies it', 'Makes b another name for the same object', 'Errors', 'Resets a'], answer: 1, why: 'Reference semantics: both names point at one object. Use a$copy() for a real copy.' },
        { type: 'choice', q: 'Why do R5 methods end with `invisible(.self)`?', options: ['It is required', 'So method calls can be chained: a$deposit(1)$deposit(2)', 'It prevents errors', 'It speeds up code'], answer: 1, why: 'Returning the object (invisibly) enables chaining without printing.' },
        { type: 'choice', q: 'Inside a method, how do you modify a field?', options: ['balance <- balance + x', 'balance <<- balance + x', 'self.balance += x', 'this$balance <- x'], answer: 1, why: '`<<-` assigns to the field in the object\'s environment.' },
        { type: 'choice', q: 'What is `callSuper(...)`?', options: ['Calls the parent class\'s version of the method', 'Calls the child', 'Prints the class', 'Starts a new session'], answer: 0, why: 'It is the R5 equivalent of super().' },
        { type: 'type', q: 'Which function defines a Reference class? (name only)', accept: ['setRefClass', 'setrefclass', 'setRefClass()'], why: '`setRefClass("Name", fields = ..., methods = ...)`.' },
      ],
    },
  ]);

  LP.addDrills({
    'r-s3': [
      { title: 'Area generic', task: 'Create S3 classes `circle` (field `r`) and `square` (field `side`) with constructors `new_circle(r)` / `new_square(side)`, a generic `area(x, ...)` with methods for both, and a default method that stops with `"no area for this object"`.', starter: 'new_circle <- function(r) {\n  \n}\n\nnew_square <- function(side) {\n  \n}\n\narea <- function(x, ...) {\n  \n}\n', harness: r`
check(isTRUE(all.equal(area(new_circle(1)), pi)) && area(new_square(3)) == 9, "area wrong")
check(identical(tryCatch(area(42), error = function(e) conditionMessage(e)), "no area for this object"), "default method should stop with the message")
check(identical(class(new_circle(2)), "circle") && identical(class(new_square(2)), "square"), "classes wrong")
`, hints: ['`structure(list(r = r), class = "circle")` and `area.circle`, `area.square`, `area.default`.'], solution: 'new_circle <- function(r) structure(list(r = r), class = "circle")\nnew_square <- function(side) structure(list(side = side), class = "square")\n\narea <- function(x, ...) UseMethod("area")\narea.circle <- function(x, ...) pi * x$r^2\narea.square <- function(x, ...) x$side^2\narea.default <- function(x, ...) stop("no area for this object")' },
      { title: 'Print a contact', task: 'Create class `contact` with `new_contact(name, age)` and a `print` method showing `Ada (36)` (no quotes, returns invisibly) plus a `format` method returning the same text as a string.', starter: 'new_contact <- function(name, age) {\n  \n}\n\nformat.contact <- function(x, ...) {\n  \n}\n\nprint.contact <- function(x, ...) {\n  \n}\n', harness: r`
p <- new_contact("Ada", 36)
check(identical(format(p), "Ada (36)") && identical(capture.output(print(p)), "Ada (36)") && identical(capture.output(p), "Ada (36)"), "format/print should show 'Ada (36)'")
check(!withVisible(print(p))$visible, "print should return invisibly")
`, hints: ['`print.contact <- function(x, ...) { cat(format(x), "\\n", sep = ""); invisible(x) }`'], solution: 'new_contact <- function(name, age) structure(list(name = name, age = age), class = "contact")\n\nformat.contact <- function(x, ...) sprintf("%s (%s)", x$name, x$age)\n\nprint.contact <- function(x, ...) {\n  cat(format(x), "\\n", sep = "")\n  invisible(x)\n}' },
      { title: 'Extend with NextMethod', task: 'Write `new_contact(name)` (class `contact`), `new_student(name, school)` (class `c("student", "contact")`), generic `describe` with a contact method (`"<name>"`) and a student method that **extends** it with `NextMethod()` to give `"<name> at <school>"`.', starter: 'new_contact <- function(name) {\n  \n}\n\nnew_student <- function(name, school) {\n  \n}\n\ndescribe <- function(x, ...) {\n  \n}\n', harness: r`
check(identical(describe(new_contact("Ada")), "Ada") && identical(describe(new_student("Bo", "TAMU")), "Bo at TAMU"), "describe wrong")
check(identical(class(new_student("B", "S")), c("student", "contact")), "student class vector wrong")
check(grepl("NextMethod", paste(deparse(getS3method("describe", "student")), collapse = " ")), "use NextMethod()")
`, hints: ['`describe.student <- function(x, ...) paste(NextMethod(), "at", x$school)`'], solution: 'new_contact <- function(name) structure(list(name = name), class = "contact")\nnew_student <- function(name, school) structure(list(name = name, school = school), class = c("student", "contact"))\n\ndescribe <- function(x, ...) UseMethod("describe")\ndescribe.contact <- function(x, ...) x$name\ndescribe.student <- function(x, ...) paste(NextMethod(), "at", x$school)' },
    ],
    'r-s3-ops': [
      { title: 'Temperature compare', task: 'Create class `temp` (numeric with class), `format.temp` giving e.g. `"21.5°C"`, and comparisons `<` `>` `==` via `Ops.temp` returning plain logicals (other operators stop with `"unsupported"`); `sort` should work.', starter: 'temp <- function(x) {\n  \n}\n\nformat.temp <- function(x, ...) {\n  \n}\n\nOps.temp <- function(e1, e2) {\n  \n}\n\n`[.temp` <- function(x, i) {\n  \n}\n', harness: r`
t <- temp(c(21.5, 18))
check(identical(format(t), c("21.5°C", "18.0°C")) || identical(format(t), c("21.5°C", "18°C")), paste("format gave", paste(format(t), collapse = ",")))
check(identical(t > temp(20), c(TRUE, FALSE)) && identical(t == t, c(TRUE, TRUE)) && identical(t < temp(20), c(FALSE, TRUE)), "comparisons should work")
check(identical(as.numeric(sort(t)), c(18, 21.5)) && inherits(sort(t), "temp"), "sort should keep the class")
check(inherits(tryCatch(t + t, error = function(e) e), "error"), "arithmetic should stop")
`, hints: ['`structure(x, class = "temp")`; `format.temp`: `paste0(format(unclass(x), nsmall = 1), "°C")`.', 'In `Ops.temp` allow only `<`, `>`, `==`, `<=`, `>=`, `!=`.'], solution: 'temp <- function(x) structure(x, class = "temp")\n\nformat.temp <- function(x, ...) paste0(formatC(as.numeric(unclass(x)), format = "f", digits = 1), "°C")\n\nOps.temp <- function(e1, e2) {\n  if (!.Generic %in% c("<", ">", "==", "!=", "<=", ">=")) stop("unsupported")\n  get(.Generic)(as.numeric(unclass(e1)), as.numeric(unclass(e2)))\n}\n\n`[.temp` <- function(x, i) temp(as.numeric(unclass(x))[i])' },
      { title: 'A bag with length', task: 'Create class `bag` wrapping a list in `$items`; give it a `length` method (number of items), a `rev` method returning a reversed bag, and `as.character` giving the items joined by `", "`.', starter: 'bag <- function(...) {\n  \n}\n\nlength.bag <- function(x) {\n  \n}\n\nrev.bag <- function(x) {\n  \n}\n\nas.character.bag <- function(x, ...) {\n  \n}\n', harness: r`
b <- bag("a", "b", "c")
check(length(b) == 3 && length(bag()) == 0, "length.bag wrong")
check(inherits(rev(b), "bag") && identical(as.character(rev(b)), "c, b, a") && identical(as.character(b), "a, b, c"), "rev/as.character wrong")
`, hints: ['Store `structure(list(items = list(...)), class = "bag")`.'], solution: 'bag <- function(...) structure(list(items = list(...)), class = "bag")\n\nlength.bag <- function(x) length(x$items)\n\nrev.bag <- function(x) {\n  x$items <- rev(x$items)\n  x\n}\n\nas.character.bag <- function(x, ...) paste(unlist(x$items), collapse = ", ")' },
      { title: 'Point equality', task: 'Create class `point` with `new_point(x, y)`, an `==` method (via `"==.point"`) comparing both coordinates, and a `toString` method returning `"(1, 2)"`.', starter: 'new_point <- function(x, y) {\n  \n}\n\n`==.point` <- function(e1, e2) {\n  \n}\n\ntoString.point <- function(x, ...) {\n  \n}\n', harness: r`
check(new_point(1, 2) == new_point(1, 2) && !(new_point(1, 2) == new_point(2, 1)), "== wrong")
check(identical(toString(new_point(1, 2)), "(1, 2)"), "toString wrong")
`, hints: ['`"==.point"` receives both points; compare `e1$x == e2$x && e1$y == e2$y`.'], solution: 'new_point <- function(x, y) structure(list(x = x, y = y), class = "point")\n\n`==.point` <- function(e1, e2) e1$x == e2$x && e1$y == e2$y\n\ntoString.point <- function(x, ...) sprintf("(%s, %s)", x$x, x$y)' },
    ],
    'r-s4': [
      { title: 'Immutable account', task: 'Define S4 class `Account` (slot `balance` numeric, validity: balance must be >= 0 with message `"balance must be non-negative"`), generic `deposit(acc, x)` returning a **new** Account, and generic `balance_of(acc)`.', starter: 'setClass("Account", representation(balance = "numeric"))\n\n# validity, generics, methods\n', harness: r`
a <- new("Account", balance = 10)
b <- deposit(a, 5)
check(balance_of(b) == 15 && balance_of(a) == 10 && is(b, "Account"), "deposit should return a new Account and leave the original")
check(grepl("balance must be non-negative", tryCatch(new("Account", balance = -1), error = function(e) conditionMessage(e))), "validity message wrong")
`, hints: ['Use `setValidity("Account", function(object) ...)` or the validity argument.', '`setMethod("deposit", "Account", function(acc, x) new("Account", balance = acc@balance + x))`'], solution: 'setClass("Account", representation(balance = "numeric"),\n  validity = function(object) if (object@balance < 0) "balance must be non-negative" else TRUE)\n\nsetGeneric("deposit", function(acc, x) standardGeneric("deposit"))\nsetMethod("deposit", "Account", function(acc, x) new("Account", balance = acc@balance + x))\n\nsetGeneric("balance_of", function(acc) standardGeneric("balance_of"))\nsetMethod("balance_of", "Account", function(acc) acc@balance)' },
      { title: 'Custom initialize', task: 'Define S4 class `Person` (slots `name` character, `age` numeric). Write an `initialize` method so `new("Person", name = "Ada")` gets `age` **0** when none is given, using `callNextMethod`.', starter: 'setClass("Person", representation(name = "character", age = "numeric"))\n\n# initialize method\n', harness: r`
p <- new("Person", name = "Ada"); q <- new("Person", name = "Bo", age = 5)
check(p@age == 0 && q@age == 5 && p@name == "Ada", "age should default to 0 but keep explicit values")
`, hints: ['`setMethod("initialize", "Person", function(.Object, ..., age = 0) { .Object <- callNextMethod(.Object, ..., age = age); .Object })`'], solution: 'setClass("Person", representation(name = "character", age = "numeric"))\n\nsetMethod("initialize", "Person", function(.Object, ..., age = 0) {\n  .Object <- callNextMethod(.Object, ..., age = age)\n  .Object\n})' },
      { title: 'Which classes?', task: 'Define virtual `Animal`, concrete `Dog` and `Cat` extending it, and a generic `noise(x)` implemented **once** on `Animal` (returning `"..."`) and overridden for `Dog` (`"Woof"`). Then set `is_animal` to `is(Cat_obj, "Animal")` for `Cat_obj <- new("Cat")`.', starter: 'setClass("Animal", representation("VIRTUAL"))\n\nCat_obj <- NULL\nis_animal <- NULL\n', harness: r`
check(noise(new("Dog")) == "Woof" && noise(new("Cat")) == "..." && isTRUE(is_animal) && isVirtualClass("Animal"), "noise / inheritance wrong")
`, hints: ['`setClass("Dog", contains = "Animal")`; `setMethod("noise", "Animal", ...)` and `setMethod("noise", "Dog", ...)`.'], solution: 'setClass("Animal", representation("VIRTUAL"))\nsetClass("Dog", contains = "Animal")\nsetClass("Cat", contains = "Animal")\n\nsetGeneric("noise", function(x) standardGeneric("noise"))\nsetMethod("noise", "Animal", function(x) "...")\nsetMethod("noise", "Dog", function(x) "Woof")\n\nCat_obj <- new("Cat")\nis_animal <- is(Cat_obj, "Animal")' },
    ],
    'r-r5': [
      { title: 'Chainable counter', task: 'Define Reference class `Counter` with numeric field `value` (starting at 0) and methods `increment(by = 1)` (chainable) and `reset()`.', starter: 'Counter <- setRefClass("Counter")\n', harness: r`
c1 <- Counter$new()
c1$increment()$increment(5)$increment()
check(c1$value == 7, paste("value is", c1$value))
c1$reset(); check(c1$value == 0, "reset should set value to 0")
d <- Counter$new(); d$increment(2); check(d$value == 2 && c1$value == 0, "counters are independent")
`, hints: ['Give `value` a default in `initialize`, or `fields = list(value = "numeric")` plus `initialize = function(...) { value <<- 0; callSuper(...) }`.'], solution: 'Counter <- setRefClass("Counter",\n  fields = list(value = "numeric"),\n  methods = list(\n    initialize = function(...) {\n      value <<- 0\n      callSuper(...)\n    },\n    increment = function(by = 1) {\n      value <<- value + by\n      invisible(.self)\n    },\n    reset = function() {\n      value <<- 0\n      invisible(.self)\n    }\n  ))' },
      { title: 'Stack', task: 'Define Reference class `Stack` with a list field `items` and methods `push(x)`, `pop()` (returns the top value and removes it), `size()` and `peek()`.', starter: 'Stack <- setRefClass("Stack")\n', harness: r`
s <- Stack$new()
s$push(1); s$push("two"); s$push(3)
check(s$size() == 3 && s$peek() == 3 && s$pop() == 3 && s$pop() == "two" && s$size() == 1, "push/pop/peek/size wrong")
t <- Stack$new(); check(t$size() == 0, "new stacks are empty")
`, hints: ['`items[[length(items) + 1]] <<- x`; pop: save the last element then `items[[length(items)]] <<- NULL`.'], solution: 'Stack <- setRefClass("Stack",\n  fields = list(items = "list"),\n  methods = list(\n    push = function(x) {\n      items[[length(items) + 1]] <<- x\n      invisible(.self)\n    },\n    pop = function() {\n      top <- items[[length(items)]]\n      items[[length(items)]] <<- NULL\n      top\n    },\n    peek = function() items[[length(items)]],\n    size = function() length(items)\n  ))' },
      { title: 'Logger with defaults', task: 'Define Reference class `Logger` with fields `level` (character) and `lines` (character). `Logger$new()` must default `level` to `"INFO"`; `log(msg)` appends `"[LEVEL] msg"` to `lines` (chainable).', starter: 'Logger <- setRefClass("Logger")\n', harness: r`
l <- Logger$new(); l$log("start")$log("end")
check(identical(l$lines, c("[INFO] start", "[INFO] end")), paste("lines:", paste(l$lines, collapse = "|")))
w <- Logger$new(level = "WARN"); w$log("x")
check(identical(w$lines, "[WARN] x") && identical(Logger$new()$lines, character(0)), "explicit level and empty start wrong")
`, hints: ['Override `initialize = function(..., level = "INFO") { callSuper(..., level = level) }`.'], solution: 'Logger <- setRefClass("Logger",\n  fields = list(level = "character", lines = "character"),\n  methods = list(\n    initialize = function(..., level = "INFO") {\n      callSuper(..., level = level)\n    },\n    log = function(msg) {\n      lines <<- c(lines, sprintf("[%s] %s", level, msg))\n      invisible(.self)\n    }\n  ))' },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
