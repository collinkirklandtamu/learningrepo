(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  const r = String.raw;
  LP.addLessons('r', [
    {
      id: 'r-functions-adv', title: 'Advanced functions', skill: 'Functions', xp: 35, diff: 3,
      read: `
# More power from functions

~~~r
total <- function(..., na.rm = FALSE) {     # ... collects any number of arguments
  args <- list(...)
  sum(unlist(args), na.rm = na.rm)
}
total(1, 2, 3)         # 6
~~~

## Arguments

~~~r
f <- function(x, type = c("range", "z")) {
  type <- match.arg(type)          # validates; uses the first choice by default
  ...
}
g <- function(a, b) if (missing(b)) "no b" else "has b"
stopifnot(is.numeric(x), x > 0)    # concise input checks (errors if any is FALSE)
~~~

Default arguments are **lazy**: they are evaluated when first used, and can refer to other arguments.

## Cleanup and control

~~~r
f <- function() {
  con <- open_something()
  on.exit(close(con), add = TRUE)   # runs when the function exits, even on error
  ...
}
fact <- function(n) if (n <= 1) 1 else n * Recall(n - 1)    # Recall = call myself
invisible(x)                         # return a value without printing it
~~~

## Calling functions programmatically

~~~r
do.call(paste, list("a", "b", sep = "-"))     # "a-b": call with a LIST of args
vlen <- Vectorize(function(s, n) substr(s, 1, n))
sapply(1:3, \\(i) i^2)                         # \\(x) is shorthand for function(x)
c(4, 9, 16) |> sqrt() |> sum()               # native pipe: 9
~~~

> [!tip] Key idea
> \`x |> f(y)\` means \`f(x, y)\`. Pipes make a chain of steps read left-to-right.
`,
      task: 'Write `total(..., na.rm = FALSE)` (sum of all arguments), `scale_by(x, type = c("range", "z"))` (use `match.arg`: "range" -> `(x-min)/(max-min)`, "z" -> `(x-mean)/sd`), `safe_div(a, b)` (use `stopifnot` to require numbers; return `NA_real_` when b is 0), `cleanup(env)` (sets `env$open <- TRUE`, then uses `on.exit` so that `env$open` is `FALSE` afterwards **even if the function errors**) and compute `piped` as `c(4, 9, 16) |> sqrt() |> sum()`.',
      starter: 'total <- function(..., na.rm = FALSE) {\n  \n}\n\nscale_by <- function(x, type = c("range", "z")) {\n  \n}\n\nsafe_div <- function(a, b) {\n  \n}\n\ncleanup <- function(env, fail = FALSE) {\n  \n}\n\npiped <- \n',
      harness: r`
check(total(1, 2, 3) == 6 && total() == 0 && total(1, NA, 3, na.rm = TRUE) == 4 && is.na(total(1, NA)), "total should sum all its arguments")
check(isTRUE(all.equal(scale_by(c(2, 4, 6)), c(0, 0.5, 1))), "scale_by default (range) should map to 0..1")
check(isTRUE(all.equal(scale_by(c(1, 2, 3), "z"), c(-1, 0, 1))), "scale_by(type = 'z') should standardise")
check(inherits(tryCatch(scale_by(1:3, "bogus"), error = function(e) e), "error"), "an invalid type should be an error (match.arg)")
check(safe_div(6, 3) == 2 && is.na(safe_div(1, 0)), "safe_div wrong")
check(inherits(tryCatch(safe_div("a", 1), error = function(e) e), "error"), "safe_div should reject non-numbers with stopifnot")
e <- new.env()
cleanup(e)
check(identical(e$open, FALSE), "after a normal call env$open should be FALSE")
e2 <- new.env()
try(cleanup(e2, fail = TRUE), silent = TRUE)
check(identical(e2$open, FALSE), "on.exit must run even when the function fails")
check(identical(piped, 9), "piped should be 9")
`,
      hints: ['`sum(unlist(list(...)), na.rm = na.rm)`', 'Start `scale_by` with `type <- match.arg(type)` then branch.', 'Check `stopifnot(is.numeric(a), is.numeric(b))` before the `b == 0` test.', '`on.exit(env$open <- FALSE, add = TRUE)` right after setting it TRUE; `if (fail) stop("boom")`.'],
      solution: 'total <- function(..., na.rm = FALSE) {\n  sum(unlist(list(...)), na.rm = na.rm)\n}\n\nscale_by <- function(x, type = c("range", "z")) {\n  type <- match.arg(type)\n  if (type == "range") (x - min(x)) / (max(x) - min(x)) else (x - mean(x)) / sd(x)\n}\n\nsafe_div <- function(a, b) {\n  stopifnot(is.numeric(a), is.numeric(b))\n  if (b == 0) return(NA_real_)\n  a / b\n}\n\ncleanup <- function(env, fail = FALSE) {\n  env$open <- TRUE\n  on.exit(env$open <- FALSE, add = TRUE)\n  if (fail) stop("boom")\n  invisible(NULL)\n}\n\npiped <- c(4, 9, 16) |> sqrt() |> sum()',
      recall: [
        { type: 'choice', q: 'What does `...` in a function signature do?', options: ['Marks optional code', 'Accepts any number of extra arguments', 'Repeats the function', 'Comments out the rest'], answer: 1, why: 'Extra arguments are collected and can be forwarded or read with list(...).' },
        { type: 'choice', q: 'What does `match.arg(type)` do?', options: ['Checks that `type` is one of the allowed choices in the signature', 'Matches a regular expression', 'Coerces to numeric', 'Returns the argument names'], answer: 0, why: 'It validates against the default vector and picks the first by default.' },
        { type: 'choice', q: 'When does `on.exit()` code run?', options: ['Immediately', 'When the function exits, including on error', 'Only on success', 'At the end of the session'], answer: 1, why: 'Great for closing files and restoring state.' },
        { type: 'choice', q: 'What does `x |> f(y)` mean?', options: ['f(y, x)', 'f(x, y)', 'f(x)(y)', 'x(f, y)'], answer: 1, why: 'The left side becomes the first argument.' },
        { type: 'type', q: 'Which function calls another function with a **list** of arguments? (name only)', accept: ['do.call', 'do.call()'], why: '`do.call(f, list(1, 2))`.' },
      ],
    },
    {
      id: 'r-functional', title: 'Functional programming: Map, Filter, Reduce', skill: 'Iteration', xp: 35, diff: 3,
      read: `
# Functions as building blocks

Functions are ordinary values: pass them to other functions.

~~~r
Map(function(a, b) a * b, 1:3, 4:6)        # list(4, 10, 18): like zip + apply
Filter(function(x) x %% 2 == 0, 1:10)      # keep items where the test is TRUE
Reduce(\`+\`, 1:5)                           # 15: fold left
Reduce(\`+\`, 1:5, accumulate = TRUE)        # 1 3 6 10 15: running totals
Find(function(x) x > 3, c(1, 5, 2, 8))     # 5   first match
Position(function(x) x > 3, c(1, 5, 2, 8)) # 2   its index
~~~

## Type-safe apply

\`sapply\` guesses its output type; \`vapply\` **declares** it, so surprises become errors:

~~~r
vapply(c("a", "bb"), nchar, integer(1))     # named integer vector
mapply(function(x, y) x + y, 1:3, c(10, 20, 30))   # multiple inputs at once
~~~

## Combining results

~~~r
rows <- lapply(1:3, function(i) data.frame(id = i, sq = i^2))
do.call(rbind, rows)           # stack a list of data frames into one
~~~

Operators are functions too: \`\`+\`\`, \`\`[\`\`, \`\`==\`\`. \`sapply(lst, "[[", "name")\` extracts one field from every element.

> [!tip] Key idea
> Prefer \`vapply\` to \`sapply\` in packages and scripts you rely on: it fails loudly instead of returning a surprising type.
`,
      task: 'Compute: `prods` = `Map` over `1:3` and `4:6` multiplying pairs, `evens` = `Filter` of 1:10, `fact5` = `Reduce` product of 1:5, `running` = running totals of 1:5 using `Reduce(accumulate = TRUE)`, `lens` = `vapply` nchar of `c("a", "bb", "ccc")` (integer), `sums` = `mapply` adding `1:3` and `c(10, 20, 30)`, `first_big` = first value above 3 in `c(1, 5, 2, 8)` using `Find`, and `stacked` = a data frame with columns `id` and `sq` for ids 1-3 built by `do.call(rbind, lapply(...))`.',
      starter: 'prods <- \nevens <- \nfact5 <- \nrunning <- \nlens <- \nsums <- \nfirst_big <- \nstacked <- \n',
      harness: r`
check(is.list(prods) && identical(unlist(prods), c(4L, 10L, 18L)), "prods should be Map(function(a, b) a * b, 1:3, 4:6)")
check(identical(as.integer(evens), c(2L, 4L, 6L, 8L, 10L)), "evens should be 2 4 6 8 10")
check(fact5 == 120, "fact5 should be the product 1*2*3*4*5")
check(identical(as.numeric(running), c(1, 3, 6, 10, 15)), "running should be c(1, 3, 6, 10, 15)")
check(identical(unname(lens), c(1L, 2L, 3L)) && is.integer(lens), "lens should be an integer vector from vapply")
check(identical(as.numeric(sums), c(11, 22, 33)), "sums should be 11 22 33")
check(first_big == 5, "first_big should be 5")
check(is.data.frame(stacked) && identical(names(stacked), c("id", "sq")) && nrow(stacked) == 3 && identical(as.numeric(stacked$sq), c(1, 4, 9)), "stacked should be a 3-row data frame with id and sq")
`,
      hints: ['`Map(function(a, b) a * b, 1:3, 4:6)`', '`Reduce("*", 1:5)` or ``Reduce(`*`, 1:5)``', '`Reduce("+", 1:5, accumulate = TRUE)`', '`vapply(c("a", "bb", "ccc"), nchar, integer(1))`', '`do.call(rbind, lapply(1:3, function(i) data.frame(id = i, sq = i^2)))`'],
      solution: 'prods <- Map(function(a, b) a * b, 1:3, 4:6)\nevens <- Filter(function(x) x %% 2 == 0, 1:10)\nfact5 <- Reduce(`*`, 1:5)\nrunning <- Reduce(`+`, 1:5, accumulate = TRUE)\nlens <- vapply(c("a", "bb", "ccc"), nchar, integer(1))\nsums <- mapply(function(x, y) x + y, 1:3, c(10, 20, 30))\nfirst_big <- Find(function(x) x > 3, c(1, 5, 2, 8))\nstacked <- do.call(rbind, lapply(1:3, function(i) data.frame(id = i, sq = i^2)))',
      recall: [
        { type: 'choice', q: 'What does `Reduce("+", 1:4, accumulate = TRUE)` return?', options: ['10', 'c(1, 3, 6, 10)', 'c(1, 2, 3, 4)', 'An error'], answer: 1, why: 'accumulate = TRUE keeps every intermediate result.' },
        { type: 'choice', q: 'Why prefer `vapply` over `sapply`?', options: ['It is shorter', 'You declare the output type, so surprises become errors', 'It is the only one that works on lists', 'It runs in parallel'], answer: 1, why: 'sapply can silently return a list or matrix.' },
        { type: 'choice', q: 'What does `Filter(f, x)` return?', options: ['f applied to every element', 'The elements of x for which f is TRUE', 'The first element', 'A logical vector'], answer: 1, why: 'Filter keeps matching elements.' },
        { type: 'choice', q: 'How do you stack a list of data frames into one?', options: ['do.call(rbind, list_of_dfs)', 'cbind(list_of_dfs)', 'merge(list_of_dfs)', 'unlist(list_of_dfs)'], answer: 0, why: 'do.call passes the list elements as separate arguments to rbind.' },
        { type: 'type', q: 'Which function applies a function to several vectors in parallel, like Python\'s zip + map? (name only)', accept: ['mapply', 'Map', 'map'], why: '`mapply` / `Map`.' },
      ],
    },
    {
      id: 'r-environments', title: 'Environments & closures', skill: 'Advanced', xp: 40, diff: 3,
      read: `
# Where R keeps variables

An **environment** is a bag of name-value pairs with a parent. Every function call creates one, and R looks names up in the current environment, then the parent, and so on (**lexical scoping**).

~~~r
x <- 10
f <- function() { x <- 1; g <- function() x; g() }   # g sees f's x (1), not the global one
f()    # 1
~~~

## Closures: functions that remember

~~~r
make_counter <- function() {
  n <- 0
  function() {
    n <<- n + 1     # <<- modifies n in the ENCLOSING environment
    n
  }
}
c1 <- make_counter(); c1(); c1()    # 1, 2
~~~

\`<-\` always creates/modifies a *local* variable; \`<<-\` searches up the enclosing environments and modifies the first match.

## Environments as mutable objects

Unlike most R objects, environments are **modified by reference**:

~~~r
e <- new.env()
assign("k", 5, envir = e)
get("k", envir = e); exists("k", envir = e); ls(e); mget(c("k"), envir = e)
e$k <- 6        # also works
modify <- function(env) env$count <- 1   # changes the caller's environment!
~~~

This is perfect for caches (memoization) and counters.

~~~r
count_calls <- local({ n <- 0; function() { n <<- n + 1; n } })   # private state without a function factory
~~~

> [!tip] Key idea
> A closure = function + the environment it was created in. That environment is its private memory.
`,
      task: 'Write `make_counter(start = 0)` (each call returns the next integer), `make_bank(balance)` (returns a list of closures `deposit(x)`, `withdraw(x)` and `balance()` sharing one private balance; `withdraw` stops with an error `"insufficient funds"` if x is too large), `memo_fib()` (returns a function computing Fibonacci numbers with a cache environment, fast for n = 60) and `add_item(env, key, value)` (stores into the environment you pass in).',
      starter: 'make_counter <- function(start = 0) {\n  \n}\n\nmake_bank <- function(balance) {\n  \n}\n\nmemo_fib <- function() {\n  \n}\n\nadd_item <- function(env, key, value) {\n  \n}\n',
      harness: r`
c1 <- make_counter(); c2 <- make_counter(10)
check(c1() == 1 && c1() == 2 && c2() == 11 && c1() == 3, "counters should count independently")
b <- make_bank(100)
b$deposit(50); b$withdraw(30)
check(b$balance() == 120, "balance should be 120 after +50 -30")
res <- tryCatch(b$withdraw(1000), error = function(e) conditionMessage(e))
check(identical(res, "insufficient funds") && b$balance() == 120, "an over-large withdrawal must fail with 'insufficient funds' and leave the balance alone")
b2 <- make_bank(5)
check(b2$balance() == 5, "each bank has its own balance")
fib <- memo_fib()
check(fib(10) == 55 && fib(60) == 1548008755920, "memo_fib should be correct and fast")
e <- new.env()
add_item(e, "a", 1); add_item(e, "b", 2)
check(identical(sort(ls(e)), c("a", "b")) && get("b", envir = e) == 2, "add_item must modify the environment that was passed in")
`,
      hints: ['Keep `n <- start` in the enclosing function and update with `<<-`.', 'Create the private `balance` in `make_bank`; return `list(deposit = function(x) {...}, ...)` using `<<-`.', 'Inside `memo_fib` create `cache <- new.env()` and key it by `as.character(n)`.', '`assign(key, value, envir = env)`'],
      solution: 'make_counter <- function(start = 0) {\n  n <- start\n  function() {\n    n <<- n + 1\n    n\n  }\n}\n\nmake_bank <- function(balance) {\n  list(\n    deposit = function(x) {\n      balance <<- balance + x\n      invisible(balance)\n    },\n    withdraw = function(x) {\n      if (x > balance) stop("insufficient funds")\n      balance <<- balance - x\n      invisible(balance)\n    },\n    balance = function() balance\n  )\n}\n\nmemo_fib <- function() {\n  cache <- new.env()\n  fib <- function(n) {\n    key <- as.character(n)\n    if (!is.null(cache[[key]])) return(cache[[key]])\n    val <- if (n < 2) n else fib(n - 1) + fib(n - 2)\n    assign(key, val, envir = cache)\n    val\n  }\n  fib\n}\n\nadd_item <- function(env, key, value) {\n  assign(key, value, envir = env)\n  invisible(env)\n}',
      recall: [
        { type: 'choice', q: 'What is the difference between `<-` and `<<-` inside a function?', options: ['None', '<- makes a local variable; <<- modifies a variable in an enclosing environment', '<<- is faster', '<- is only for numbers'], answer: 1, why: '`<<-` searches parent environments for the name.' },
        { type: 'choice', q: 'What is a closure?', options: ['A function plus the environment it was created in', 'A loop that ends early', 'A kind of vector', 'A package'], answer: 0, why: 'The environment holds its private state.' },
        { type: 'choice', q: 'Why do functions that change an *environment* argument affect the caller?', options: ['Environments are modified by reference', 'R is call-by-name', 'It is a bug', 'Only global variables can change'], answer: 0, why: 'Most R objects are copied on modify; environments are not.' },
        { type: 'choice', q: 'How does R look up a variable name?', options: ['Only in the global environment', 'Current environment, then its parents (lexical scoping)', 'Alphabetically', 'Randomly'], answer: 1, why: 'Lexical scoping follows where the function was defined.' },
        { type: 'type', q: 'Which function creates a new empty environment? (full call)', accept: ['new.env()', 'new.env'], why: '`e <- new.env()`.' },
      ],
    },
    {
      id: 'r-errors', title: 'Conditions & error handling', skill: 'Errors', xp: 35, diff: 3,
      read: `
# Errors, warnings and messages are all "conditions"

~~~r
stop("fatal")        # error: stops execution
warning("hmm")       # warning: reported, execution continues
message("fyi")       # message: informational (to stderr)
~~~

## tryCatch: handle and move on

~~~r
res <- tryCatch({
  as.numeric("x")                      # warns: NAs introduced by coercion
}, warning = function(w) NA,
   error   = function(e) -1,
   finally = cat("always runs\\n"))
conditionMessage(e)                    # the text of a condition
~~~

The first matching handler wins and **unwinds** the call (the expression is abandoned). To *log a warning but keep going*, use \`withCallingHandlers\` and muffle it:

~~~r
withCallingHandlers(
  expr,
  warning = function(w) { log <<- c(log, conditionMessage(w)); invokeRestart("muffleWarning") })
~~~

## Your own condition classes

~~~r
validation_error <- function(field, msg) {
  structure(class = c("validation_error", "error", "condition"),
            list(message = msg, call = NULL, field = field))
}
tryCatch(stop(validation_error("age", "must be >= 0")),
         validation_error = function(e) e$field)     # "age"
~~~

\`try(expr, silent = TRUE)\` returns an object of class \`"try-error"\` instead of failing. \`stopifnot()\` and \`tryCatch\` together make defensive code readable.

> [!tip] Key idea
> Handlers are matched by **class**. A custom class lets callers handle *your* errors without string-matching messages.
`,
      task: 'Write `parse_num(s)` (number from text, `NA` for bad input, **without** a visible warning), `validate_age(age)` (stop with a custom `validation_error` condition carrying `$field = "age"` when age is negative), `classify(expr)` (evaluates a quoted-by-promise expression and returns `"ok"`, `"validation"` for a validation_error or `"other"` for any other error), `collect_warnings(f)` (run `f()`; return a list with `value` and `warnings` (character vector of the warning messages), without letting the warnings print) and `with_flag(env, fail = FALSE)` (sets `env$done <- TRUE` in a `finally` block, whether or not the body errors).',
      starter: 'parse_num <- function(s) {\n  \n}\n\nvalidate_age <- function(age) {\n  \n}\n\nclassify <- function(expr) {\n  \n}\n\ncollect_warnings <- function(f) {\n  \n}\n\nwith_flag <- function(env, fail = FALSE) {\n  \n}\n',
      harness: r`
w <- NULL
v <- withCallingHandlers(parse_num("abc"), warning = function(x) { w <<- c(w, "warned"); invokeRestart("muffleWarning") })
check(is.na(v) && is.null(w), "parse_num('abc') should be NA and must not emit a warning")
check(parse_num("3.5") == 3.5, "parse_num('3.5') should be 3.5")
err <- tryCatch(validate_age(-1), error = function(e) e)
check(inherits(err, "validation_error") && inherits(err, "error") && identical(err$field, "age"), "validate_age(-1) should signal a validation_error with $field == 'age'")
check(is.null(validate_age(5)) || identical(validate_age(5), TRUE) || is.numeric(validate_age(5)), "validate_age(5) should not fail")
check(identical(classify(5), "ok") && identical(classify(validate_age(-3)), "validation") && identical(classify(stop("x")), "other") && identical(classify(log(-1:1)[1]), "ok"), "classify is wrong")
cw <- collect_warnings(function() { warning("a"); warning("b"); 42 })
check(identical(cw$value, 42) && identical(cw$warnings, c("a", "b")), "collect_warnings should return the value and both warning messages")
check(identical(collect_warnings(function() 1)$warnings, character(0)), "no warnings should give character(0)")
e <- new.env(); with_flag(e); check(isTRUE(e$done), "done flag must be set on success")
e2 <- new.env(); try(with_flag(e2, fail = TRUE), silent = TRUE); check(isTRUE(e2$done), "finally must run even when the body errors")
`,
      hints: ['`tryCatch(as.numeric(s), warning = function(w) NA_real_)`', 'Build the condition with `structure(class = c("validation_error", "error", "condition"), list(message = ..., call = NULL, field = "age"))` and `stop(cond)`.', '`tryCatch({ expr; "ok" }, validation_error = function(e) "validation", error = function(e) "other")`. Specific handler first.', 'Use `withCallingHandlers` and `invokeRestart("muffleWarning")`.', '`tryCatch({ if (fail) stop("x"); env$x }, finally = env$done <- TRUE)`'],
      solution: 'parse_num <- function(s) {\n  tryCatch(as.numeric(s), warning = function(w) NA_real_)\n}\n\nvalidate_age <- function(age) {\n  if (age < 0) {\n    stop(structure(class = c("validation_error", "error", "condition"),\n                   list(message = "age must be >= 0", call = NULL, field = "age")))\n  }\n  invisible(TRUE)\n}\n\nclassify <- function(expr) {\n  tryCatch({\n    expr\n    "ok"\n  }, validation_error = function(e) "validation",\n     error = function(e) "other")\n}\n\ncollect_warnings <- function(f) {\n  msgs <- character(0)\n  value <- withCallingHandlers(\n    f(),\n    warning = function(w) {\n      msgs <<- c(msgs, conditionMessage(w))\n      invokeRestart("muffleWarning")\n    }\n  )\n  list(value = value, warnings = msgs)\n}\n\nwith_flag <- function(env, fail = FALSE) {\n  tryCatch({\n    if (fail) stop("body failed")\n    invisible(NULL)\n  }, finally = {\n    env$done <- TRUE\n  })\n}',
      recall: [
        { type: 'choice', q: 'What is the difference between `warning()` and `stop()`?', options: ['None', 'A warning lets execution continue; stop() signals an error that halts it unless handled', 'stop() is for numbers', 'warning() halts execution'], answer: 1, why: 'Warnings are non-fatal; errors abort the call.' },
        { type: 'choice', q: 'In `tryCatch(expr, error = f, finally = g)` when does `g` run?', options: ['Only on error', 'Only on success', 'Always', 'Never'], answer: 2, why: '`finally` always runs, like Python\'s finally.' },
        { type: 'choice', q: 'How do handlers choose which condition to catch?', options: ['By the order of the arguments only', 'By the condition\'s class (e.g. error, warning, custom classes)', 'By the message text', 'Randomly'], answer: 1, why: 'Condition classes drive handler matching.' },
        { type: 'choice', q: 'Which lets you log a warning but **continue** the computation?', options: ['tryCatch(warning = ...)', 'withCallingHandlers with invokeRestart("muffleWarning")', 'stop()', 'try()'], answer: 1, why: 'Calling handlers run without unwinding; tryCatch handlers abandon the expression.' },
        { type: 'type', q: 'Which function extracts the text of a condition object? (name only)', accept: ['conditionMessage', 'conditionMessage()'], why: '`conditionMessage(e)`.' },
      ],
    },
    {
      id: 'r-datamanip', title: 'Data manipulation: merge, order, subset, split', skill: 'Data frames', xp: 40, diff: 3,
      read: `
# Wrangling data frames in base R

~~~r
emp  <- data.frame(id = 1:4, name = c("Ada", "Bo", "Cy", "Di"), dept_id = c(1, 2, 1, 3), salary = c(70, 55, 90, 60))
dept <- data.frame(dept_id = 1:3, dept = c("Eng", "Ops", "HR"))

merge(emp, dept, by = "dept_id")                  # inner join
merge(emp, dept, by = "dept_id", all.x = TRUE)    # left join (keeps unmatched rows with NA)

emp[order(-emp$salary), ]                         # sort descending (use -x for numbers)
emp[order(emp$dept_id, -emp$salary), ]            # by several keys
subset(emp, salary > 60, select = c(name, salary))
transform(emp, bonus = salary * 0.1)              # add columns
within(emp, { band <- ifelse(salary >= 70, "high", "normal") })
with(emp, tapply(salary, dept_id, mean))
~~~

## Split-apply-combine

~~~r
parts <- split(emp, emp$dept_id)                  # list of data frames, one per group
do.call(rbind, lapply(parts, function(d) d[which.max(d$salary), ]))   # top earner per dept
sapply(split(emp$salary, emp$dept_id), mean)      # mean per group
~~~

## Other staples

\`unique(x)\`, \`duplicated(x)\` (TRUE for repeats), \`cumsum()\`, \`rev()\`, \`head(df, n)\`, \`nrow()\`, \`colnames<-\`, \`table(a, b)\` for two-way counts, \`complete.cases(df)\` (rows without NA), \`rowSums\`/\`colMeans\`.

> [!tip] Key idea
> Row filters go **before** the comma (\`df[cond, ]\`); \`subset()\` is the readable shortcut for interactive work.
`,
      task: 'With the provided `emp` and `dept`: `joined` = inner merge on `dept_id`; `ranked` = `joined` sorted by salary descending; `high` = names and dept of people earning over 60 (columns `name`, `dept`; use `subset`); add a `band` column to `joined` ("high" for salary >= 70 else "normal"); `by_dept` = mean salary per dept as a **named numeric vector** (use `split` + `sapply`); `top_per_dept` = the highest-paid row of each dept stacked into one data frame; `cum` = cumulative salary of `ranked`.',
      starter: 'emp <- data.frame(id = 1:5, name = c("Ada", "Bo", "Cy", "Di", "Ed"), dept_id = c(1, 2, 1, 3, 2), salary = c(70, 55, 90, 60, 65))\ndept <- data.frame(dept_id = 1:3, dept = c("Eng", "Ops", "HR"))\n\njoined <- \nranked <- \nhigh <- \n# add joined$band here\nby_dept <- \ntop_per_dept <- \ncum <- \n',
      harness: r`
check(nrow(joined) == 5 && "dept" %in% names(joined) && "dept_id" %in% names(joined), "joined should merge emp with dept by dept_id")
check(identical(ranked$name, c("Cy", "Ada", "Ed", "Di", "Bo")), paste("ranked order is", paste(ranked$name, collapse = ",")))
check(identical(names(high), c("name", "dept")) && setequal(high$name, c("Ada", "Cy", "Ed")), "high should have name and dept for salary > 60")
check("band" %in% names(joined) && identical(joined$band[joined$name == "Ada"], "high") && identical(joined$band[joined$name == "Bo"], "normal"), "joined$band should be high for salary >= 70")
check(isTRUE(all.equal(by_dept[["Eng"]], 80)) && isTRUE(all.equal(by_dept[["Ops"]], 60)) && isTRUE(all.equal(by_dept[["HR"]], 60)) && is.numeric(by_dept) && !is.null(names(by_dept)), "by_dept should be a named numeric vector of mean salaries")
check(is.data.frame(top_per_dept) && nrow(top_per_dept) == 3 && setequal(top_per_dept$name, c("Cy", "Ed", "Di")), "top_per_dept should hold the best-paid person of each department")
check(isTRUE(all.equal(as.numeric(cum), cumsum(ranked$salary))), "cum should be cumsum of the ranked salaries")
`,
      hints: ['`merge(emp, dept, by = "dept_id")`', '`joined[order(-joined$salary), ]`', '`subset(joined, salary > 60, select = c(name, dept))`', '`joined$band <- ifelse(joined$salary >= 70, "high", "normal")`', '`sapply(split(joined$salary, joined$dept), mean)`', '`do.call(rbind, lapply(split(joined, joined$dept), function(d) d[which.max(d$salary), ]))`'],
      solution: 'emp <- data.frame(id = 1:5, name = c("Ada", "Bo", "Cy", "Di", "Ed"), dept_id = c(1, 2, 1, 3, 2), salary = c(70, 55, 90, 60, 65))\ndept <- data.frame(dept_id = 1:3, dept = c("Eng", "Ops", "HR"))\n\njoined <- merge(emp, dept, by = "dept_id")\nranked <- joined[order(-joined$salary), ]\nhigh <- subset(joined, salary > 60, select = c(name, dept))\njoined$band <- ifelse(joined$salary >= 70, "high", "normal")\nby_dept <- sapply(split(joined$salary, joined$dept), mean)\ntop_per_dept <- do.call(rbind, lapply(split(joined, joined$dept), function(d) d[which.max(d$salary), ]))\ncum <- cumsum(ranked$salary)',
      recall: [
        { type: 'choice', q: 'Which merge keeps rows of the left table that have no match?', options: ['merge(a, b)', 'merge(a, b, all.x = TRUE)', 'merge(a, b, by = NULL)', 'rbind(a, b)'], answer: 1, why: 'all.x = TRUE makes it a left join.' },
        { type: 'choice', q: 'How do you sort a data frame by salary, highest first?', options: ['df[order(df$salary), ]', 'df[order(-df$salary), ]', 'sort(df$salary)', 'df[rev(df$salary), ]'], answer: 1, why: 'Negating a numeric key reverses the order.' },
        { type: 'choice', q: 'What does `split(df, df$g)` return?', options: ['A data frame', 'A list of data frames, one per group', 'A matrix', 'A factor'], answer: 1, why: 'It is the "split" step of split-apply-combine.' },
        { type: 'choice', q: 'What does `duplicated(c("a", "b", "a"))` return?', options: ['FALSE FALSE TRUE', 'TRUE FALSE TRUE', 'FALSE TRUE FALSE', 'c("a")'], answer: 0, why: 'It marks the second and later occurrences.' },
        { type: 'type', q: 'Which function returns only the rows with no missing values? (name only)', accept: ['complete.cases', 'complete.cases()', 'na.omit'], why: '`df[complete.cases(df), ]` or `na.omit(df)`.' },
      ],
    },
    {
      id: 'r-dates', title: 'Dates & times', skill: 'Dates & IO', xp: 30, diff: 2,
      read: `
# Working with dates

~~~r
d <- as.Date("2024-03-15")                     # ISO format parses directly
as.Date("15 March 2024", format = "%d %B %Y")  # otherwise give the format
format(d, "%d/%m/%Y")                          # "15/03/2024"
weekdays(d); months(d)                         # "Friday" "March"
d + 30                                         # dates are numbers of days
as.Date("2024-12-25") - d                      # Time difference of 285 days
as.numeric(as.Date("2024-12-25") - d)          # 285
seq(d, by = "month", length.out = 3)           # monthly sequence
~~~

Format codes: \`%Y\` year, \`%m\` month number, \`%d\` day, \`%B\` month name, \`%b\` abbreviated, \`%A\` weekday, \`%H:%M:%S\` time.

## Date-times

~~~r
t <- as.POSIXct("2024-03-15 14:30:00", tz = "UTC")
format(t, "%H:%M")
t + 3600                                       # add seconds
difftime(t2, t1, units = "hours")
~~~

> [!warn] Always set the time zone for date-times
> \`as.POSIXct\` without \`tz\` uses your machine's zone; results then differ between computers.

\`cut(dates, "month")\` groups dates into months; \`format(d, "%Y-%m")\` gives a year-month key for \`table\`/\`tapply\`.
`,
      task: 'With `d <- as.Date("2024-03-15")`: `days_to_xmas` (numeric days until 2024-12-25), `next3` (the date `d` and the same day in the next two months), `wd` (weekday name), `fmt` (`"15/03/2024"` style), `parsed` (from `"15 March 2024"`) and write `age_on(birth, on)` returning full years between two Dates.',
      starter: 'd <- as.Date("2024-03-15")\n\ndays_to_xmas <- \nnext3 <- \nwd <- \nfmt <- \nparsed <- \n\nage_on <- function(birth, on) {\n  \n}\n',
      harness: r`
check(days_to_xmas == 285 && is.numeric(days_to_xmas) && !inherits(days_to_xmas, "difftime"), "days_to_xmas should be the plain number 285")
check(identical(next3, as.Date(c("2024-03-15", "2024-04-15", "2024-05-15"))), "next3 should be three monthly dates")
check(identical(wd, "Friday"), "2024-03-15 was a Friday")
check(identical(fmt, "15/03/2024"), "fmt should be day/month/year")
check(identical(parsed, as.Date("2024-03-15")), "parsed should equal 2024-03-15")
check(age_on(as.Date("2000-05-17"), as.Date("2024-05-16")) == 23 && age_on(as.Date("2000-05-17"), as.Date("2024-05-17")) == 24 && age_on(as.Date("2000-02-29"), as.Date("2001-02-28")) == 0, "age_on should count completed years only")
`,
      hints: ['`as.numeric(as.Date("2024-12-25") - d)`', '`seq(d, by = "month", length.out = 3)`', '`format(d, "%d/%m/%Y")`', '`as.Date("15 March 2024", format = "%d %B %Y")`', 'Years = difference of years minus 1 if the birthday has not happened yet (compare `format(x, "%m%d")` strings).'],
      solution: 'd <- as.Date("2024-03-15")\n\ndays_to_xmas <- as.numeric(as.Date("2024-12-25") - d)\nnext3 <- seq(d, by = "month", length.out = 3)\nwd <- weekdays(d)\nfmt <- format(d, "%d/%m/%Y")\nparsed <- as.Date("15 March 2024", format = "%d %B %Y")\n\nage_on <- function(birth, on) {\n  years <- as.integer(format(on, "%Y")) - as.integer(format(birth, "%Y"))\n  if (format(on, "%m%d") < format(birth, "%m%d")) years <- years - 1\n  years\n}',
      recall: [
        { type: 'choice', q: 'What does `as.Date("2024-03-15") + 30` give?', options: ['An error', 'A date 30 days later', 'The number 30', 'A date 30 months later'], answer: 1, why: 'Dates count in days.' },
        { type: 'choice', q: 'Which format code gives the full month name?', options: ['%m', '%B', '%b', '%M'], answer: 1, why: '%B = "March", %b = "Mar", %m = "03".' },
        { type: 'choice', q: 'Why pass `tz = "UTC"` to `as.POSIXct`?', options: ['It is required', 'Otherwise results depend on the computer\'s time zone', 'It speeds things up', 'It rounds to the hour'], answer: 1, why: 'Explicit zones make code reproducible.' },
        { type: 'choice', q: 'How do you get the number of days between two Dates as a plain number?', options: ['a - b', 'as.numeric(a - b)', 'diff(a, b)', 'a %% b'], answer: 1, why: 'a - b is a difftime object; as.numeric strips it.' },
        { type: 'type', q: 'Which function returns the name of the day of the week? (name only)', accept: ['weekdays', 'weekdays()'], why: '`weekdays(d)`.' },
      ],
    },
    {
      id: 'r-io', title: 'Reading & writing data', skill: 'Dates & IO', xp: 35, diff: 3,
      read: `
# Getting data in and out

~~~r
csv <- "name,score\\nAda,90\\nBo,85"
df <- read.csv(text = csv)               # read from a string (or a file path / URL)
str(df)                                  # types are guessed: name chr, score int

path <- tempfile(fileext = ".csv")       # a safe temporary file name
write.csv(df, path, row.names = FALSE)   # row.names = FALSE avoids an extra index column
read.csv(path)
file.exists(path); unlink(path)
~~~

## Plain text

~~~r
writeLines(c("one", "two"), path)        # write a character vector, one line each
readLines(path)                          # read lines back
cat("a", "b", sep = "\\n")                # print raw text
scan(text = "1 2 3", quiet = TRUE)       # numbers from text: c(1, 2, 3)
capture.output(print(1:3))               # capture printed output as text
~~~

## Saving R objects exactly

~~~r
saveRDS(df, path); identical(readRDS(path), df)    # binary, preserves types
dput(df)                                            # print code that recreates the object
~~~

\`stringsAsFactors = FALSE\` is the default since R 4.0. Use \`colClasses\` to force column types, \`na.strings\` to define missing markers, and \`file.path("dir", "file.csv")\` to build paths portably.

> [!tip] Key idea
> CSV is text (types are re-guessed on read); RDS is R's own format (types preserved exactly).
`,
      task: 'Write `save_df(df, path)` and `load_df(path)` (CSV without row names), `count_lines(path)` (number of lines in a text file), `rds_roundtrip(obj)` (save to a temp file with `saveRDS` and return what `readRDS` gives back) and `csv_text(df)` (return the CSV text of a data frame, without row names, as ONE string with `\\n` between lines and no trailing newline). Also read `nums` from the text `"3 1 4 1 5"` with `scan`.',
      starter: 'save_df <- function(df, path) {\n  \n}\n\nload_df <- function(path) {\n  \n}\n\ncount_lines <- function(path) {\n  \n}\n\nrds_roundtrip <- function(obj) {\n  \n}\n\ncsv_text <- function(df) {\n  \n}\n\nnums <- \n',
      harness: r`
df <- data.frame(name = c("Ada", "Bo"), score = c(90L, 85L))
p <- tempfile(fileext = ".csv")
save_df(df, p)
check(file.exists(p), "save_df should create the file")
check(identical(readLines(p)[1], '"name","score"'), "the CSV needs a header and no row-names column")
check(identical(load_df(p), df), "load_df(save_df(df)) should equal df")
tx <- tempfile(); writeLines(c("a", "b", "c"), tx)
check(count_lines(tx) == 3, "count_lines should count 3 lines")
obj <- list(x = 1:3, f = factor(c("u", "v")), d = as.Date("2024-01-01"))
check(identical(rds_roundtrip(obj), obj), "rds_roundtrip should preserve the object exactly")
check(identical(csv_text(df), '"name","score"\n"Ada",90\n"Bo",85'), paste0("csv_text gave: ", csv_text(df)))
check(identical(nums, c(3, 1, 4, 1, 5)), "nums should be scan(text = '3 1 4 1 5', quiet = TRUE)")
`,
      hints: ['`write.csv(df, path, row.names = FALSE)` and `read.csv(path)`.', '`length(readLines(path))`', '`f <- tempfile(); saveRDS(obj, f); readRDS(f)`', '`paste(capture.output(write.csv(df, row.names = FALSE)), collapse = "\\n")`', '`scan(text = "3 1 4 1 5", quiet = TRUE)`'],
      solution: 'save_df <- function(df, path) {\n  write.csv(df, path, row.names = FALSE)\n}\n\nload_df <- function(path) {\n  read.csv(path)\n}\n\ncount_lines <- function(path) {\n  length(readLines(path))\n}\n\nrds_roundtrip <- function(obj) {\n  f <- tempfile(fileext = ".rds")\n  on.exit(unlink(f))\n  saveRDS(obj, f)\n  readRDS(f)\n}\n\ncsv_text <- function(df) {\n  paste(capture.output(write.csv(df, row.names = FALSE)), collapse = "\\n")\n}\n\nnums <- scan(text = "3 1 4 1 5", quiet = TRUE)',
      recall: [
        { type: 'choice', q: 'Why use `row.names = FALSE` with `write.csv`?', options: ['To save space', 'Otherwise an unwanted index column is written', 'It is required', 'To sort rows'], answer: 1, why: 'The default writes row names as an extra first column.' },
        { type: 'choice', q: 'What is the advantage of RDS over CSV?', options: ['Human-readable', 'It preserves R types (factors, dates, lists) exactly', 'Smaller always', 'Works in Excel'], answer: 1, why: 'CSV loses type information.' },
        { type: 'choice', q: 'What does `readLines(path)` return?', options: ['A data frame', 'A character vector, one element per line', 'One long string', 'A list'], answer: 1, why: 'One string per line.' },
        { type: 'choice', q: 'What does `tempfile()` give you?', options: ['An open file', 'A unique temporary file path (the file is not created yet)', 'The working directory', 'A URL'], answer: 1, why: 'It only returns a path.' },
        { type: 'type', q: 'Which function reads a CSV file into a data frame? (name only)', accept: ['read.csv', 'read.csv()', 'read.table'], why: '`read.csv(path)`.' },
      ],
    },
  ]);

  LP.addDrills({
    'r-functions-adv': [
      { title: 'Compose', task: 'Write `compose(f, g)` returning a function that applies `g` first and then `f`.', starter: 'compose <- function(f, g) {\n  \n}\n', harness: r`
inc <- function(x) x + 1; dbl <- function(x) x * 2
check(compose(inc, dbl)(5) == 11 && compose(dbl, inc)(5) == 12 && compose(toupper, paste0)("a", "b") == "AB", "compose(f, g)(x) should be f(g(x))")
`, hints: ['`function(...) f(g(...))`'], solution: 'compose <- function(f, g) {\n  function(...) f(g(...))\n}' },
      { title: 'Power factory', task: 'Write `make_power(n)` returning a function that raises its argument to the power n; then `cube <- make_power(3)`.', starter: 'make_power <- function(n) {\n  \n}\n\ncube <- \n', harness: r`check(cube(2) == 8 && make_power(2)(5) == 25 && identical(cube(c(1, 2)), c(1, 8)), "make_power(n)(x) should be x^n")`, hints: ['The inner function can use `n` from the enclosing call; use `force(n)`.'], solution: 'make_power <- function(n) {\n  force(n)\n  function(x) x^n\n}\n\ncube <- make_power(3)' },
      { title: 'Vectorize it', task: 'Write `first_n` that takes a string and a count and returns the first `n` characters; make a **vectorised** version `first_n_vec` that works for vectors of both arguments using `Vectorize`.', starter: 'first_n <- function(s, n) {\n  substr(s, 1, n)\n}\n\nfirst_n_vec <- \n', harness: r`check(identical(unname(first_n_vec(c("hello", "world"), c(2, 3))), c("he", "wor")), "first_n_vec should work element by element")`, hints: ['`Vectorize(first_n)`'], solution: 'first_n <- function(s, n) {\n  substr(s, 1, n)\n}\n\nfirst_n_vec <- Vectorize(first_n)' },
    ],
    'r-functional': [
      { title: 'Compose many', task: 'Write `compose_all(...)` taking any number of functions and returning one that applies them left to right (use `Reduce`).', starter: 'compose_all <- function(...) {\n  \n}\n', harness: r`
f <- compose_all(function(x) x + 1, function(x) x * 2, sqrt)
check(f(7) == 4 && compose_all(toupper)("a") == "A", "compose_all(f, g, h)(x) should be h(g(f(x)))")
`, must: [{ re: 'Reduce', msg: 'Use Reduce.' }], hints: ['`fs <- list(...)`; `function(x) Reduce(function(acc, f) f(acc), fs, x)`'], solution: 'compose_all <- function(...) {\n  fs <- list(...)\n  function(x) Reduce(function(acc, f) f(acc), fs, x)\n}' },
      { title: 'Stack data frames', task: 'Write `stack_rows(lst)` that takes a **named list of numeric vectors** and returns a data frame with columns `name` and `total` (the sum of each vector).', starter: 'stack_rows <- function(lst) {\n  \n}\n', harness: r`
out <- stack_rows(list(a = 1:3, b = c(10, 20)))
check(is.data.frame(out) && identical(names(out), c("name", "total")) && identical(out$name, c("a", "b")) && identical(as.numeric(out$total), c(6, 30)), "stack_rows should build a name/total data frame")
`, hints: ['`do.call(rbind, lapply(names(lst), function(n) data.frame(name = n, total = sum(lst[[n]]))))`'], solution: 'stack_rows <- function(lst) {\n  do.call(rbind, lapply(names(lst), function(n) data.frame(name = n, total = sum(lst[[n]]))))\n}' },
      { title: 'Count if', task: 'Write `count_if(x, pred)` returning how many elements satisfy the predicate using `vapply` (declare the type).', starter: 'count_if <- function(x, pred) {\n  \n}\n', harness: r`
check(count_if(1:10, function(v) v %% 2 == 0) == 5 && count_if(c("a", "bb", "cc"), function(s) nchar(s) == 2) == 2 && count_if(integer(0), function(v) TRUE) == 0, "count_if wrong")
check(grepl("vapply", paste(deparse(count_if), collapse = " ")), "use vapply")
`, hints: ['`sum(vapply(x, pred, logical(1)))`'], solution: 'count_if <- function(x, pred) {\n  sum(vapply(x, pred, logical(1)))\n}' },
    ],
    'r-environments': [
      { title: 'Accumulator', task: 'Write `make_accumulator()` returning a function that adds its argument to a running total and returns the total.', starter: 'make_accumulator <- function() {\n  \n}\n', harness: r`
a <- make_accumulator(); b <- make_accumulator()
check(a(5) == 5 && a(10) == 15 && b(1) == 1 && a(-3) == 12, "each accumulator has its own running total")
`, hints: ['`total <- 0` outside, `total <<- total + x` inside.'], solution: 'make_accumulator <- function() {\n  total <- 0\n  function(x) {\n    total <<- total + x\n    total\n  }\n}' },
      { title: 'Environment keys', task: 'Write `env_keys(env)` returning the **sorted** names stored in an environment, including names starting with a dot.', starter: 'env_keys <- function(env) {\n  \n}\n', harness: r`
e <- new.env(); assign("b", 1, e); assign("a", 2, e); assign(".hidden", 3, e)
check(identical(env_keys(e), c(".hidden", "a", "b")) && identical(env_keys(new.env()), character(0)), "env_keys wrong")
`, hints: ['`sort(ls(env, all.names = TRUE))`'], solution: 'env_keys <- function(env) {\n  sort(ls(env, all.names = TRUE))\n}' },
      { title: 'Generic memoize', task: 'Write `memoize(f)` for a one-argument function: results are cached by argument so `f` runs once per distinct input.', starter: 'memoize <- function(f) {\n  \n}\n', harness: r`
calls <- 0
slow <- function(x) { calls <<- calls + 1; x * 2 }
m <- memoize(slow)
check(m(2) == 4 && m(2) == 4 && m(3) == 6 && calls == 2, "slow() must run once per distinct argument")
`, hints: ['Cache in an environment keyed by `as.character(x)`.'], solution: 'memoize <- function(f) {\n  cache <- new.env()\n  function(x) {\n    key <- as.character(x)\n    if (!exists(key, envir = cache, inherits = FALSE)) assign(key, f(x), envir = cache)\n    get(key, envir = cache)\n  }\n}' },
    ],
    'r-errors': [
      { title: 'Try a number', task: 'Write `try_num(s)` returning the number, or `NA` for text that cannot be parsed, using `suppressWarnings`.', starter: 'try_num <- function(s) {\n  \n}\n', harness: r`
check(try_num("12") == 12 && is.na(try_num("x")) && identical(try_num(c("1", "b")), c(1, NA)), "try_num wrong")
check(grepl("suppressWarnings", paste(deparse(try_num), collapse = " ")), "use suppressWarnings")
`, hints: ['`suppressWarnings(as.numeric(s))`'], solution: 'try_num <- function(s) {\n  suppressWarnings(as.numeric(s))\n}' },
      { title: 'First success', task: 'Write `first_success(fs)` calling each function in the list in order and returning the value of the first one that does **not** error (or `NULL` if all fail).', starter: 'first_success <- function(fs) {\n  \n}\n', harness: r`
check(first_success(list(function() stop("a"), function() 2, function() 3)) == 2 && is.null(first_success(list(function() stop("a")))) && is.null(first_success(list())), "first_success wrong")
`, hints: ['Loop with `tryCatch(f(), error = function(e) NULL)`; stop at the first non-NULL result.'], solution: 'first_success <- function(fs) {\n  for (f in fs) {\n    res <- tryCatch(list(value = f()), error = function(e) NULL)\n    if (!is.null(res)) return(res$value)\n  }\n  NULL\n}' },
      { title: 'Count warnings', task: 'Write `warn_count(f)` returning the number of warnings raised while running `f()` (and not printing them).', starter: 'warn_count <- function(f) {\n  \n}\n', harness: r`
check(warn_count(function() { warning("a"); warning("b"); 1 }) == 2 && warn_count(function() 5) == 0, "warn_count wrong")
`, hints: ['`withCallingHandlers` with a counter and `invokeRestart("muffleWarning")`.'], solution: 'warn_count <- function(f) {\n  n <- 0\n  withCallingHandlers(f(), warning = function(w) {\n    n <<- n + 1\n    invokeRestart("muffleWarning")\n  })\n  n\n}' },
    ],
    'r-datamanip': [
      { title: 'Top n', task: 'Write `top_n(df, col, n)` returning the n rows with the largest values in column `col` (a string), in descending order.', starter: 'top_n <- function(df, col, n) {\n  \n}\n', harness: r`
d <- data.frame(k = c("a", "b", "c", "d"), v = c(5, 9, 1, 7))
out <- top_n(d, "v", 2)
check(identical(out$k, c("b", "d")) && nrow(out) == 2 && nrow(top_n(d, "v", 10)) == 4, "top_n wrong")
`, hints: ['`head(df[order(-df[[col]]), ], n)`'], solution: 'top_n <- function(df, col, n) {\n  head(df[order(-df[[col]]), ], n)\n}' },
      { title: 'Unmatched rows', task: 'Write `count_unmatched(a, b, by)` returning how many rows of `a` have no match in `b` on key column `by` (use a left merge and count `NA`s).', starter: 'count_unmatched <- function(a, b, by) {\n  \n}\n', harness: r`
a <- data.frame(id = 1:4, x = letters[1:4]); b <- data.frame(id = c(1, 3), y = c("p", "q"))
check(count_unmatched(a, b, "id") == 2 && count_unmatched(a, a, "id") == 0, "count_unmatched wrong")
`, hints: ['`m <- merge(a, b, by = by, all.x = TRUE)`; count rows where a column from `b` is NA.'], solution: 'count_unmatched <- function(a, b, by) {\n  m <- merge(a, b, by = by, all.x = TRUE)\n  other <- setdiff(names(b), by)[1]\n  sum(is.na(m[[other]]))\n}' },
      { title: 'Deduplicate', task: 'Write `dedupe(df, col)` keeping only the **first** row for each distinct value of column `col`.', starter: 'dedupe <- function(df, col) {\n  \n}\n', harness: r`
d <- data.frame(id = c(1, 2, 1, 3, 2), n = c("a", "b", "c", "d", "e"))
out <- dedupe(d, "id")
check(identical(out$n, c("a", "b", "d")) && nrow(out) == 3, "dedupe should keep the first row per id")
`, hints: ['`df[!duplicated(df[[col]]), ]`'], solution: 'dedupe <- function(df, col) {\n  df[!duplicated(df[[col]]), ]\n}' },
    ],
    'r-dates': [
      { title: 'Weekend?', task: 'Write `is_weekend(dates)` returning a logical vector (Saturday/Sunday) for a vector of Dates.', starter: 'is_weekend <- function(dates) {\n  \n}\n', harness: r`
check(identical(is_weekend(as.Date(c("2024-03-15", "2024-03-16", "2024-03-17"))), c(FALSE, TRUE, TRUE)), "is_weekend wrong")
`, hints: ['`weekdays(dates) %in% c("Saturday", "Sunday")`'], solution: 'is_weekend <- function(dates) {\n  weekdays(dates) %in% c("Saturday", "Sunday")\n}' },
      { title: 'Days in a month', task: 'Write `days_in_month(year, month)` (leap years included).', starter: 'days_in_month <- function(year, month) {\n  \n}\n', harness: r`
check(days_in_month(2024, 2) == 29 && days_in_month(2023, 2) == 28 && days_in_month(2024, 12) == 31 && days_in_month(2024, 4) == 30, "days_in_month wrong")
`, hints: ['First of this month and first of the next month: subtract the two Dates.'], solution: 'days_in_month <- function(year, month) {\n  first <- as.Date(sprintf("%d-%02d-01", year, month))\n  nxt <- seq(first, by = "month", length.out = 2)[2]\n  as.numeric(nxt - first)\n}' },
      { title: 'Quarter', task: 'Write `quarter(d)` returning 1-4 for a Date (vectorised).', starter: 'quarter <- function(d) {\n  \n}\n', harness: r`
check(identical(quarter(as.Date(c("2024-01-31", "2024-04-01", "2024-09-30", "2024-12-25"))), c(1, 2, 3, 4)), "quarter wrong")
`, hints: ['`(as.integer(format(d, "%m")) - 1) %/% 3 + 1`'], solution: 'quarter <- function(d) {\n  (as.integer(format(d, "%m")) - 1) %/% 3 + 1\n}' },
    ],
    'r-io': [
      { title: 'Parse key=value', task: 'Write `parse_kv(lines)` turning `c("a=1", "b=two")` into the named list `list(a = "1", b = "two")`.', starter: 'parse_kv <- function(lines) {\n  \n}\n', harness: r`
check(identical(parse_kv(c("a=1", "b=two")), list(a = "1", b = "two")) && length(parse_kv(character(0))) == 0, "parse_kv wrong")
`, hints: ['Split each line on the first `=`: `sub("=.*", "", x)` and `sub("^[^=]*=", "", x)`; then `setNames(as.list(values), keys)`.'], solution: 'parse_kv <- function(lines) {\n  keys <- sub("=.*", "", lines)\n  vals <- sub("^[^=]*=", "", lines)\n  setNames(as.list(vals), keys)\n}' },
      { title: 'Numbers from text', task: 'Write `read_numbers(text)` parsing numbers separated by commas and/or whitespace: `"1, 2.5 3"` -> `c(1, 2.5, 3)`.', starter: 'read_numbers <- function(text) {\n  \n}\n', harness: r`
check(identical(read_numbers("1, 2.5 3"), c(1, 2.5, 3)) && identical(read_numbers("7"), 7), "read_numbers wrong")
`, hints: ['`scan(text = text, sep = ",", quiet = TRUE)` handles commas; or replace commas with spaces first.'], solution: 'read_numbers <- function(text) {\n  scan(text = gsub(",", " ", text), quiet = TRUE)\n}' },
      { title: 'Round-trip CSV', task: 'Write `roundtrip_csv(df)` writing the data frame to a temp CSV (no row names) and reading it back.', starter: 'roundtrip_csv <- function(df) {\n  \n}\n', harness: r`
d <- data.frame(a = 1:3, b = c("x", "y", "z"))
check(identical(roundtrip_csv(d), d), "a round trip through CSV should give an identical data frame")
`, hints: ['`tempfile(fileext = ".csv")`, `write.csv(..., row.names = FALSE)`, `read.csv`.'], solution: 'roundtrip_csv <- function(df) {\n  p <- tempfile(fileext = ".csv")\n  on.exit(unlink(p))\n  write.csv(df, p, row.names = FALSE)\n  read.csv(p)\n}' },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
