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

    ],
    
    'r-s4': [
      { title: 'Immutable account', task: 'Define S4 class `Account` (slot `balance` numeric, validity: balance must be >= 0 with message `"balance must be non-negative"`), generic `deposit(acc, x)` returning a **new** Account, and generic `balance_of(acc)`.', starter: 'setClass("Account", representation(balance = "numeric"))\n\n# validity, generics, methods\n', harness: r`
a <- new("Account", balance = 10)
b <- deposit(a, 5)
check(balance_of(b) == 15 && balance_of(a) == 10 && is(b, "Account"), "deposit should return a new Account and leave the original")
check(grepl("balance must be non-negative", tryCatch(new("Account", balance = -1), error = function(e) conditionMessage(e))), "validity message wrong")
`, hints: ['Use `setValidity("Account", function(object) ...)` or the validity argument.', '`setMethod("deposit", "Account", function(acc, x) new("Account", balance = acc@balance + x))`'], solution: 'setClass("Account", representation(balance = "numeric"),\n  validity = function(object) if (object@balance < 0) "balance must be non-negative" else TRUE)\n\nsetGeneric("deposit", function(acc, x) standardGeneric("deposit"))\nsetMethod("deposit", "Account", function(acc, x) new("Account", balance = acc@balance + x))\n\nsetGeneric("balance_of", function(acc) standardGeneric("balance_of"))\nsetMethod("balance_of", "Account", function(acc) acc@balance)' },

    ],
    
  });
})(typeof window !== 'undefined' ? window : globalThis);
