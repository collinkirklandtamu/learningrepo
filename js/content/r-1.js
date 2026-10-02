(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  const r = String.raw;
  LP.addLessons('r', [
    {
      id: 'r-factors', title: 'Factors & categories', skill: 'Vectors', xp: 30, diff: 2,
      read: `
# Categorical data

A **factor** stores categories as integer codes plus a set of **levels** (the labels). Statistics functions treat factors as groups.

~~~r
size <- factor(c("M", "S", "L", "M"), levels = c("S", "M", "L"))
levels(size)        # "S" "M" "L"
as.integer(size)    # 2 1 3 2   <- the CODES, not the labels
table(size)         # counts per level, including empty ones
~~~

## Ordered factors

~~~r
size <- factor(c("M", "S", "L"), levels = c("S", "M", "L"), ordered = TRUE)
size >= "M"          # FALSE TRUE TRUE  (comparisons make sense now)
~~~

## Turning numbers into categories

~~~r
ages <- c(5, 17, 18, 40, 65)
cut(ages, breaks = c(0, 17, 64, Inf), labels = c("child", "adult", "senior"))
~~~

\`cut\` makes intervals like (0,17], (17,64], (64,Inf]: right-closed by default (\`right = FALSE\` flips that).

> [!warn] Classic trap
> A factor of numeric-looking text, e.g. \`factor(c("10", "20"))\`, gives codes 1 and 2 under \`as.numeric()\`. Convert **through character**: \`as.numeric(as.character(f))\`.

Handy: \`droplevels(f)\` removes unused levels; \`relevel(f, ref = "c")\` changes the baseline level (important in regression).
`,
      task: 'Create the **ordered** factor `f` from `sizes` with levels S < M < L, `counts <- table(f)`, logical `big` (is each size at least "M"), the age categories `group` (child 0-17, adult 18-64, senior 65+ using `cut`) and `true_nums`, the real numbers 10, 20, 10 recovered from the factor `nums`.',
      starter: 'sizes <- c("M", "S", "L", "M", "S", "M")\nf <- \ncounts <- \nbig <- \n\nages <- c(5, 17, 18, 40, 65, 90)\ngroup <- \n\nnums <- factor(c("10", "20", "10"))\ntrue_nums <- \n',
      harness: r`
check(is.ordered(f), "f should be an ordered factor (ordered = TRUE)")
check(identical(levels(f), c("S", "M", "L")), "levels must be S, M, L in that order")
check(identical(as.integer(counts), c(2L, 3L, 1L)) && identical(names(counts), c("S", "M", "L")), "counts should be table(f): S=2 M=3 L=1")
check(identical(as.logical(big), c(TRUE, FALSE, TRUE, TRUE, FALSE, TRUE)), "big should be TRUE where the size is M or L")
check(is.factor(group) && identical(as.character(group), c("child", "child", "adult", "adult", "senior", "senior")), paste("group is", paste(as.character(group), collapse = ", ")))
check(isTRUE(all.equal(true_nums, c(10, 20, 10))), "true_nums should be 10 20 10: convert via as.character first")
`,
      hints: ['`factor(sizes, levels = c("S", "M", "L"), ordered = TRUE)`', '`big <- f >= "M"`', '`cut(ages, breaks = c(0, 17, 64, Inf), labels = c("child", "adult", "senior"))`', '`as.numeric(as.character(nums))`'],
      solution: 'sizes <- c("M", "S", "L", "M", "S", "M")\nf <- factor(sizes, levels = c("S", "M", "L"), ordered = TRUE)\ncounts <- table(f)\nbig <- f >= "M"\n\nages <- c(5, 17, 18, 40, 65, 90)\ngroup <- cut(ages, breaks = c(0, 17, 64, Inf), labels = c("child", "adult", "senior"))\n\nnums <- factor(c("10", "20", "10"))\ntrue_nums <- as.numeric(as.character(nums))',
      recall: [
        { type: 'choice', q: 'What does `as.numeric(factor(c("10", "20", "10")))` return?', options: ['10 20 10', '1 2 1 (the internal codes)', 'An error', '"10" "20" "10"'], answer: 1, why: 'as.numeric on a factor gives the integer codes. Go through as.character first.' },
        { type: 'choice', q: 'What is the advantage of an *ordered* factor?', options: ['It is faster', 'You can compare levels with < and >', 'It uses less memory', 'It removes duplicates'], answer: 1, why: 'Ordered factors know that S < M < L.' },
        { type: 'choice', q: 'What does `cut(x, breaks = c(0, 10, 20))` create by default?', options: ['Intervals (0,10] and (10,20]', 'Intervals [0,10) and [10,20)', 'A numeric vector', 'Three groups'], answer: 0, why: 'cut is right-closed by default; use right = FALSE to flip.' },
        { type: 'type', q: 'Which function removes unused levels from a factor? (name only)', accept: ['droplevels', 'droplevels()'], why: '`droplevels(f)`.' },
        { type: 'choice', q: 'Why does `relevel()` matter in a regression?', options: ['It speeds up fitting', 'It chooses the baseline category that other levels are compared with', 'It sorts the data', 'It removes NA'], answer: 1, why: 'The first level is the reference in lm/glm contrasts.' },
      ],
    },
    {
      id: 'r-strings', title: 'Strings & regular expressions', skill: 'Strings', xp: 35, diff: 2,
      read: `
# Text in R

~~~r
paste("a", "b")                 # "a b"
paste0("a", "b")                # "ab"
paste(c("x", "y"), collapse = "-")   # "x-y"   collapse joins a vector into one string
nchar("hello")                  # 5
toupper("abc"); tolower("ABC"); trimws("  hi  ")
substr("abcdef", 2, 4)          # "bcd"
strsplit("a,b,c", ",")[[1]]     # "a" "b" "c"   (strsplit returns a LIST)
rev(strsplit("abc", "")[[1]])   # "c" "b" "a"
~~~

## sprintf and format

~~~r
sprintf("%s has %d items costing %.2f", "cart", 3L, 9.5)   # vectorised!
sprintf("ID-%04d", 42)                  # "ID-0042"
format(1234567.891, big.mark = ",", nsmall = 2)   # "1,234,568" (rounds to 7 digits) -> use nsmall carefully
format(Sys.Date(), "%Y")                # formatting dates too
~~~

## Regular expressions

~~~r
grepl("^a", c("apple", "banana"))       # TRUE FALSE
sub("a", "A", "banana")                 # replace the first match
gsub("a", "A", "banana")                # replace all matches
gsub("\\\\s+", " ", "a   b")              # in R strings, escape the backslash: \\\\s
regmatches(x, gregexpr("[0-9]+", x))    # extract all matches (a list)
gsub(".", "-", "a.b", fixed = TRUE)     # fixed = TRUE: treat the pattern literally
~~~

> [!warn] Backslashes
> Regex \`\\s\` must be written \`"\\\\s"\` inside an R string. Character classes like \`[[:space:]]\` or \`[[:digit:]]\` avoid the doubling.
`,
      task: 'Write `shout(s)` (uppercase + "!"), `rev_str(s)` (reverse one string), `count_char(s, ch)` (how many times `ch` occurs), `squish(s)` (trim, collapse runs of spaces to one, lowercase), `emails(text)` (all `name@domain.tld` addresses in a string, as a character vector) and `pad_id(n)` (e.g. `7` -> `"ID-0007"`, vectorised).',
      starter: 'shout <- function(s) {\n  \n}\n\nrev_str <- function(s) {\n  \n}\n\ncount_char <- function(s, ch) {\n  \n}\n\nsquish <- function(s) {\n  \n}\n\nemails <- function(text) {\n  \n}\n\npad_id <- function(n) {\n  \n}\n',
      harness: r`
check(identical(shout("hey"), "HEY!") && identical(shout(c("a", "b")), c("A!", "B!")), "shout should uppercase and add ! (and be vectorised)")
check(identical(rev_str("stressed"), "desserts") && identical(rev_str(""), ""), "rev_str('stressed') should be 'desserts'")
check(count_char("banana", "a") == 3 && count_char("banana", "z") == 0, "count_char('banana', 'a') should be 3")
check(identical(squish("  The   QUICK  fox "), "the quick fox"), paste0("squish gave '", squish("  The   QUICK  fox "), "'"))
check(identical(emails("write ada@math.org or bo.k@x.co.uk, not @nope"), c("ada@math.org", "bo.k@x.co.uk")), paste("emails gave", paste(emails("write ada@math.org or bo.k@x.co.uk, not @nope"), collapse = " | ")))
check(length(emails("nothing here")) == 0, "no addresses should give an empty result")
check(identical(pad_id(7), "ID-0007") && identical(pad_id(c(1, 123)), c("ID-0001", "ID-0123")), "pad_id should zero-pad to 4 digits")
`,
      hints: ['`paste0(toupper(s), "!")` is already vectorised.', '`paste(rev(strsplit(s, "")[[1]]), collapse = "")` (watch the empty string).', 'Count with `lengths(regmatches(s, gregexpr(ch, s, fixed = TRUE)))` or `sum(strsplit(s, "")[[1]] == ch)`.', '`tolower(gsub("[[:space:]]+", " ", trimws(s)))`', '`regmatches(text, gregexpr("[[:alnum:]._+-]+@[[:alnum:].-]+\\\\.[[:alpha:]]+", text))[[1]]`', '`sprintf("ID-%04d", as.integer(n))`'],
      solution: 'shout <- function(s) {\n  paste0(toupper(s), "!")\n}\n\nrev_str <- function(s) {\n  paste(rev(strsplit(s, "")[[1]]), collapse = "")\n}\n\ncount_char <- function(s, ch) {\n  sum(strsplit(s, "")[[1]] == ch)\n}\n\nsquish <- function(s) {\n  tolower(gsub("[[:space:]]+", " ", trimws(s)))\n}\n\nemails <- function(text) {\n  regmatches(text, gregexpr("[[:alnum:]._+-]+@[[:alnum:].-]+\\\\.[[:alpha:]]+", text))[[1]]\n}\n\npad_id <- function(n) {\n  sprintf("ID-%04d", as.integer(n))\n}',
      recall: [
        { type: 'choice', q: 'What does `paste0("a", 1:2)` return?', options: ['"a1" "a2"', '"a 1" "a 2"', '"a12"', 'An error'], answer: 0, why: 'paste0 has no separator and is vectorised.' },
        { type: 'choice', q: 'What does `strsplit("a,b", ",")` return?', options: ['A character vector c("a", "b")', 'A list containing c("a", "b")', 'A matrix', 'A data frame'], answer: 1, why: 'strsplit returns a list (one element per input string); use [[1]] for a single string.' },
        { type: 'choice', q: 'Which replaces **every** match?', options: ['sub', 'gsub', 'regexpr', 'grepl'], answer: 1, why: 'sub = first match; gsub = global.' },
        { type: 'choice', q: 'How do you write the regex `\\d+` in an R string?', options: ['"\\d+"', '"\\\\d+"', '"/d+"', '"d+"'], answer: 1, why: 'The backslash must itself be escaped: "\\\\d+" (or use [[:digit:]]+).' },
        { type: 'type', q: 'Which `paste` argument joins the elements of a vector into one string?', accept: ['collapse', 'collapse='], why: '`paste(x, collapse = ", ")`.' },
      ],
    },
    {
      id: 'r-lists', title: 'Lists', skill: 'Data structures', xp: 30, diff: 2,
      read: `
# Lists hold anything

A **list** is a vector whose elements can be different types, including other lists. Data frames are lists of columns.

~~~r
person <- list(name = "Ada", langs = c("R", "Python"), address = list(city = "Austin"))
person$name                # "Ada"
person[["langs"]]          # c("R", "Python")   (extract the element itself)
person["name"]             # a list of length 1 (still wrapped!)
person$address$city        # nested access
person$age <- 36           # add
person$address <- NULL     # remove
names(person); length(person)
str(person)                # compact structure display
~~~

**[[ ]] vs [ ]**: \`[[\` pulls an element **out**; \`[\` returns a smaller list.

~~~r
nums <- list(a = 1:3, b = 4:6)
sapply(nums, sum)          # c(a = 6, b = 15)
lapply(nums, rev)          # list of reversed vectors
unlist(list(1, list(2, 3)))  # 1 2 3  (flatten)
modifyList(person, list(age = 37))
~~~

> [!tip] Key idea
> If you need "a bag of named things" or ragged data, use a list; if every item has the same type and length, a vector or data frame is better.
`,
      task: 'Build `person` as a list with `name = "Ada"`, `langs = c("R", "Python")` and `address = list(city = "Austin", zip = "78701")`. Then extract `city`, **add** `age = 36`, **append** `"Git"` to the languages, **remove** the `address` element, and compute `n_langs`. Also: `totals` = the sums of each element of `nums <- list(a = 1:3, b = 4:6)`, and `flat` = `unlist(list(1, list(2, 3)))`.',
      starter: 'person <- list()\ncity <- \n# add age, append "Git" to langs, drop address\nn_langs <- \n\nnums <- list(a = 1:3, b = 4:6)\ntotals <- \nflat <- \n',
      harness: r`
check(identical(names(person), c("name", "langs", "age")), paste("names(person) is", paste(names(person), collapse = ", "), "- expected name, langs, age"))
check(identical(person$name, "Ada") && identical(person$age, 36) && identical(person$langs, c("R", "Python", "Git")), "person fields are wrong")
check(is.null(person$address), "the address element should be removed")
check(identical(city, "Austin"), "city should be extracted before address is removed")
check(n_langs == 3, "n_langs should count the languages after appending Git")
check(identical(totals, c(a = 6L, b = 15L)), "totals should be sapply(nums, sum)")
check(identical(flat, c(1, 2, 3)), "flat should be c(1, 2, 3)")
`,
      hints: ['`person <- list(name = "Ada", langs = c("R", "Python"), address = list(city = "Austin", zip = "78701"))`', '`city <- person$address$city`', '`person$langs <- c(person$langs, "Git")` and `person$address <- NULL`', '`sapply(nums, sum)`'],
      solution: 'person <- list(name = "Ada", langs = c("R", "Python"), address = list(city = "Austin", zip = "78701"))\ncity <- person$address$city\nperson$age <- 36\nperson$langs <- c(person$langs, "Git")\nperson$address <- NULL\nn_langs <- length(person$langs)\n\nnums <- list(a = 1:3, b = 4:6)\ntotals <- sapply(nums, sum)\nflat <- unlist(list(1, list(2, 3)))',
      recall: [
        { type: 'choice', q: 'What does `x[["a"]]` do for a list `x`?', options: ['Returns a list containing a', 'Extracts the element named a itself', 'Deletes a', 'Errors'], answer: 1, why: '`[[` extracts; `[` returns a sub-list.' },
        { type: 'choice', q: 'How do you remove the element `b` from a list `x`?', options: ['x$b <- NULL', 'x$b <- NA', 'rm(x$b)', 'x - "b"'], answer: 0, why: 'Assigning NULL deletes the element.' },
        { type: 'choice', q: 'What does `unlist(list(1, list(2, 3)))` give?', options: ['A list', 'c(1, 2, 3)', 'c(1, 2)', 'An error'], answer: 1, why: 'unlist flattens recursively into a vector.' },
        { type: 'choice', q: 'A data frame is really...', options: ['A matrix', 'A list of equal-length columns', 'A string', 'A factor'], answer: 1, why: 'Columns are list elements, which is why $ works the same way.' },
        { type: 'type', q: 'Which function prints the compact structure of any R object? (name only)', accept: ['str', 'str()'], why: '`str(x)`.' },
      ],
    },
    {
      id: 'r-matrices', title: 'Matrices & linear algebra', skill: 'Data structures', xp: 35, diff: 3,
      read: `
# Two-dimensional data

A **matrix** is a vector with a \`dim\` attribute; every element has the same type. R fills it **column by column**.

~~~r
m <- matrix(1:6, nrow = 2)       # 2 rows, 3 columns
m[2, 3]; m[, 2]; m[1, ]           # element, column 2, row 1
dim(m); nrow(m); ncol(m)
t(m)                              # transpose
rbind(m, 7:9); cbind(m, c(0, 0))  # stack rows / columns
dimnames(m) <- list(c("a", "b"), c("x", "y", "z"))
~~~

## Linear algebra

~~~r
A <- matrix(c(2, 1, 1, 3), 2)
A %*% A                # matrix product (NOT A * A, which is element-wise)
solve(A)               # inverse
solve(A, c(1, 2))      # solve A x = b  (preferred over solve(A) %*% b)
diag(2)                # identity;  diag(A) extracts the diagonal
det(A)
outer(1:3, 1:3)        # multiplication table
~~~

## apply: do something to every row or column

~~~r
apply(m, 1, sum)       # MARGIN 1 = rows, 2 = columns
rowSums(m); colMeans(m)   # fast built-ins
~~~

> [!warn] Element-wise vs matrix multiplication
> \`*\` multiplies matching elements. \`%*%\` is the linear-algebra product and needs compatible dimensions.
`,
      task: 'Given `A` and `b`, compute `x` (the solution of `A x = b`), `At` (the transpose of A), `prod` (the matrix product `A %*% A`) and `row_totals` (row sums of `M`). Build `table3` as the 3x3 multiplication table with `outer`.',
      starter: 'A <- matrix(c(2, 1, 1, 3), nrow = 2)\nb <- c(1, 2)\nM <- matrix(1:6, nrow = 2)\n\nx <- \nAt <- \nprod <- \nrow_totals <- \ntable3 <- \n',
      harness: r`
check(isTRUE(all.equal(as.numeric(A %*% x), b)), "x should satisfy A %*% x == b (use solve(A, b))")
check(isTRUE(all.equal(At, t(A))), "At should be t(A)")
check(isTRUE(all.equal(prod, matrix(c(5, 5, 5, 10), 2))), "prod should be the matrix product A %*% A (not A * A)")
check(isTRUE(all.equal(as.numeric(row_totals), c(9, 12))), "row_totals should be the row sums of M")
check(identical(dim(table3), c(3L, 3L)) && table3[3, 3] == 9 && table3[2, 3] == 6, "table3 should be outer(1:3, 1:3)")
`,
      hints: ['`solve(A, b)`', '`t(A)` and `A %*% A`', '`rowSums(M)` (or `apply(M, 1, sum)`)', '`outer(1:3, 1:3)`'],
      solution: 'A <- matrix(c(2, 1, 1, 3), nrow = 2)\nb <- c(1, 2)\nM <- matrix(1:6, nrow = 2)\n\nx <- solve(A, b)\nAt <- t(A)\nprod <- A %*% A\nrow_totals <- rowSums(M)\ntable3 <- outer(1:3, 1:3)',
      recall: [
        { type: 'choice', q: 'In which order does `matrix(1:6, nrow = 2)` fill the cells?', options: ['Row by row', 'Column by column', 'Randomly', 'Diagonally'], answer: 1, why: 'R is column-major unless byrow = TRUE.' },
        { type: 'choice', q: 'What is the difference between `A * B` and `A %*% B`?', options: ['None', '* is element-wise; %*% is the matrix product', '%*% is element-wise', '* needs square matrices'], answer: 1, why: 'Different operations entirely.' },
        { type: 'choice', q: 'What does `apply(m, 2, sum)` compute?', options: ['Row sums', 'Column sums', 'The total', 'The transpose'], answer: 1, why: 'MARGIN = 2 means columns.' },
        { type: 'choice', q: 'Which is the better way to solve `A x = b`?', options: ['solve(A) %*% b', 'solve(A, b)', 'A / b', 'b %*% A'], answer: 1, why: 'solve(A, b) is faster and numerically more stable than forming the inverse.' },
        { type: 'type', q: 'Which function builds a matrix from the outer product of two vectors? (name only)', accept: ['outer', 'outer()'], why: '`outer(x, y)`.' },
      ],
    },
    {
      id: 'r-control', title: 'Control flow', skill: 'Control flow', xp: 30, diff: 2,
      read: `
# Making decisions and repeating

~~~r
if (x > 0) {
  "positive"
} else if (x < 0) {
  "negative"
} else {
  "zero"
}

for (i in seq_len(n)) { if (i %% 2 == 0) next; total <- total + i }   # next skips, break exits
while (cond) { ... }
repeat { ...; if (done) break }          # loop until you break out
~~~

**switch** picks by value (fall-through with empty arms):

~~~r
day_type <- function(d) switch(d,
  Sat = , Sun = "weekend",     # empty arm falls through to the next
  "weekday")                    # unnamed last argument is the default
~~~

> [!warn] Use seq_len, not 1:n
> \`1:0\` is \`c(1, 0)\`, so \`for (i in 1:length(x))\` misbehaves when \`x\` is empty. \`seq_len(length(x))\` / \`seq_along(x)\` give an empty loop.

\`if\` needs a **single** TRUE/FALSE. For whole vectors use \`ifelse(test, yes, no)\` or \`cut\`. \`&&\` and \`||\` are the scalar, short-circuit versions of \`&\` and \`|\`.
`,
      task: 'Write `fizzbuzz(n)` (character vector `"1" "2" "Fizz" ...` for 1..n, with `FizzBuzz` for multiples of 15; `n = 0` gives an empty vector), `collatz(n)` (steps to reach 1 using `while`), `first_prime_above(n)` (smallest prime greater than n, using `repeat`) and `day_type(d)` (`"weekend"` for Sat/Sun using `switch`, else `"weekday"`).',
      starter: 'fizzbuzz <- function(n) {\n  \n}\n\ncollatz <- function(n) {\n  \n}\n\nfirst_prime_above <- function(n) {\n  \n}\n\nday_type <- function(d) {\n  \n}\n',
      harness: r`
check(identical(fizzbuzz(15)[c(3, 5, 15)], c("Fizz", "Buzz", "FizzBuzz")) && fizzbuzz(4)[4] == "4" && length(fizzbuzz(15)) == 15, "fizzbuzz(15) is wrong")
check(length(fizzbuzz(0)) == 0, "fizzbuzz(0) should be empty (use seq_len)")
check(collatz(1) == 0 && collatz(6) == 8 && collatz(27) == 111, "collatz(6) should be 8 steps")
check(first_prime_above(10) == 11 && first_prime_above(13) == 17 && first_prime_above(1) == 2, "first_prime_above is wrong")
check(day_type("Sat") == "weekend" && day_type("Sun") == "weekend" && day_type("Mon") == "weekday", "day_type is wrong")
check(grepl("switch", paste(deparse(day_type), collapse = " ")), "use switch() in day_type")
`,
      hints: ['Build `out <- character(n)` with `for (i in seq_len(n))` and test `i %% 15 == 0` first.', '`while (n != 1) { n <- if (n %% 2 == 0) n / 2 else 3 * n + 1; steps <- steps + 1 }`', 'Inside `repeat`: `n <- n + 1`; test primality with `n > 1 && all(n %% 2:floor(sqrt(n)) != 0)` carefully for small n.', '`switch(d, Sat = , Sun = "weekend", "weekday")`'],
      solution: 'fizzbuzz <- function(n) {\n  out <- character(n)\n  for (i in seq_len(n)) {\n    out[i] <- if (i %% 15 == 0) "FizzBuzz" else if (i %% 3 == 0) "Fizz" else if (i %% 5 == 0) "Buzz" else as.character(i)\n  }\n  out\n}\n\ncollatz <- function(n) {\n  steps <- 0\n  while (n != 1) {\n    n <- if (n %% 2 == 0) n / 2 else 3 * n + 1\n    steps <- steps + 1\n  }\n  steps\n}\n\nis_prime <- function(k) {\n  if (k < 2) return(FALSE)\n  if (k < 4) return(TRUE)\n  all(k %% 2:floor(sqrt(k)) != 0)\n}\n\nfirst_prime_above <- function(n) {\n  repeat {\n    n <- n + 1\n    if (is_prime(n)) break\n  }\n  n\n}\n\nday_type <- function(d) {\n  switch(d, Sat = , Sun = "weekend", "weekday")\n}',
      recall: [
        { type: 'choice', q: 'What does `1:0` produce?', options: ['An empty vector', 'c(1, 0)', 'An error', '0'], answer: 1, why: 'The colon counts downwards too. Use seq_len(0) for an empty sequence.' },
        { type: 'choice', q: 'Which is the scalar short-circuit AND?', options: ['&', '&&', 'and', 'AND'], answer: 1, why: '`&&` evaluates left to right and stops early; `&` is vectorised.' },
        { type: 'choice', q: 'What does `next` do in a loop?', options: ['Ends the loop', 'Skips to the next iteration', 'Restarts the loop', 'Returns a value'], answer: 1, why: '`break` exits; `next` continues with the following iteration.' },
        { type: 'choice', q: 'For an element-wise choice over a vector, use...', options: ['if', 'ifelse', 'switch', 'repeat'], answer: 1, why: '`if` takes a single condition; `ifelse` is vectorised.' },
        { type: 'type', q: 'Which loop keyword repeats until you call `break`? (one word)', accept: ['repeat'], why: '`repeat { ... if (done) break }`.' },
      ],
    },
  ]);

  LP.addDrills({
    'r-factors': [
      { title: 'Change the baseline', task: 'Create `f` from `c("b", "a", "c", "a")` and make `"c"` the first (reference) level, keeping the others in their original sorted order.', starter: 'f <- factor(c("b", "a", "c", "a"))\n', harness: r`check(identical(levels(f), c("c", "a", "b")), paste("levels are", paste(levels(f), collapse = ", ")))`, hints: ['`relevel(f, ref = "c")`'], solution: 'f <- factor(c("b", "a", "c", "a"))\nf <- relevel(f, ref = "c")' },
      { title: 'Drop unused', task: 'The factor `x` has levels a, b, c but only a and b are present. Create `y` with the unused level removed and `n_levels` with its count.', starter: 'x <- factor(c("a", "b", "a"), levels = c("a", "b", "c"))\n', harness: r`
check(identical(levels(y), c("a", "b")), "y should have only the levels that occur")
check(n_levels == 2, "n_levels should be 2")
`, hints: ['`droplevels(x)` and `nlevels(y)`.'], solution: 'x <- factor(c("a", "b", "a"), levels = c("a", "b", "c"))\ny <- droplevels(x)\nn_levels <- nlevels(y)' },
      { title: 'Most common level', task: 'Write `top_level(f)` returning the **name** of the most frequent level of a factor (first one on ties).', starter: 'top_level <- function(f) {\n  \n}\n', harness: r`
check(identical(top_level(factor(c("x", "y", "y", "z"))), "y") && identical(top_level(factor(c("b", "a"))), "a"), "top_level should return the most frequent level name")
`, hints: ['`names(which.max(table(f)))`'], solution: 'top_level <- function(f) {\n  names(which.max(table(f)))\n}' },
    ],
    'r-strings': [
      { title: 'Initials', task: 'Write `initials(name)` so `"ada lovelace"` gives `"A.L."` (any number of words).', starter: 'initials <- function(name) {\n  \n}\n', harness: r`check(identical(initials("ada lovelace"), "A.L.") && identical(initials("alan mathison turing"), "A.M.T.") && identical(initials("plato"), "P."), "initials should uppercase the first letter of each word and add a dot")`, hints: ['Split into words, take `substr(w, 1, 1)`, uppercase, `paste0(..., ".", collapse = "")`.'], solution: 'initials <- function(name) {\n  words <- strsplit(trimws(name), "[[:space:]]+")[[1]]\n  paste0(toupper(substr(words, 1, 1)), ".", collapse = "")\n}' },
      { title: 'Palindrome', task: 'Write `is_palindrome(s)` ignoring case and anything that is not a letter or digit.', starter: 'is_palindrome <- function(s) {\n  \n}\n', harness: r`check(is_palindrome("A man, a plan, a canal: Panama") && !is_palindrome("hello") && is_palindrome(""), "is_palindrome is wrong")`, hints: ['Clean with `gsub("[^[:alnum:]]", "", tolower(s))`, then compare with its reverse.'], solution: 'is_palindrome <- function(s) {\n  clean <- gsub("[^[:alnum:]]", "", tolower(s))\n  identical(clean, paste(rev(strsplit(clean, "")[[1]]), collapse = ""))\n}' },
      { title: 'Money format', task: 'Write `money(x)` returning dollars with thousands separators and 2 decimals: `1234.5` -> `"$1,234.50"`.', starter: 'money <- function(x) {\n  \n}\n', harness: r`check(identical(money(1234.5), "$1,234.50") && identical(money(5), "$5.00") && identical(money(1000000), "$1,000,000.00"), paste("money(1234.5) gave", money(1234.5)))`, hints: ['`paste0("$", formatC(x, format = "f", digits = 2, big.mark = ","))`'], solution: 'money <- function(x) {\n  paste0("$", formatC(x, format = "f", digits = 2, big.mark = ","))\n}' },
    ],
    'r-lists': [
      { title: 'Deep get', task: 'Write `get_path(lst, path)` where `path` is a character vector like `c("a", "b")` returning `lst$a$b` (or `NULL` if any step is missing).', starter: 'get_path <- function(lst, path) {\n  \n}\n', harness: r`
d <- list(a = list(b = list(c = 42)), x = 1)
check(identical(get_path(d, c("a", "b", "c")), 42) && identical(get_path(d, "x"), 1), "get_path should follow the path")
check(is.null(get_path(d, c("a", "zzz"))) && is.null(get_path(d, c("q", "b"))), "a missing step should give NULL")
`, hints: ['Loop over the path; stop with `NULL` when `cur[[key]]` is `NULL` or `cur` is not a list.'], solution: 'get_path <- function(lst, path) {\n  cur <- lst\n  for (key in path) {\n    if (!is.list(cur) || is.null(cur[[key]])) return(NULL)\n    cur <- cur[[key]]\n  }\n  cur\n}' },
      { title: 'Swap keys', task: 'Write `lengths_of(lst)` returning a **named integer vector** of each element\'s length (like `lengths()`, but implemented with `sapply`).', starter: 'lengths_of <- function(lst) {\n  \n}\n', harness: r`check(identical(lengths_of(list(a = 1:3, b = "x", c = NULL)), c(a = 3L, b = 1L, c = 0L)), "lengths_of should be a named integer vector")`, hints: ['`sapply(lst, length)`'], solution: 'lengths_of <- function(lst) {\n  sapply(lst, length)\n}' },
      { title: 'Compact', task: 'Write `compact(lst)` removing every `NULL` element from a list.', starter: 'compact <- function(lst) {\n  \n}\n', harness: r`
out <- compact(list(a = 1, b = NULL, c = "z", d = NULL))
check(identical(out, list(a = 1, c = "z")), "compact should drop the NULL elements and keep names")
check(identical(compact(list()), list()), "empty in, empty out")
`, hints: ['`Filter(Negate(is.null), lst)`'], solution: 'compact <- function(lst) {\n  Filter(Negate(is.null), lst)\n}' },
    ],
    'r-matrices': [
      { title: 'Identity', task: 'Write `identity_n(n)` returning the n x n identity matrix without calling `diag(n)` directly on an integer: build it with `matrix` and `diag<-` or `outer`.', starter: 'identity_n <- function(n) {\n  \n}\n', harness: r`
check(isTRUE(all.equal(identity_n(3), diag(3))) && identical(dim(identity_n(1)), c(1L, 1L)), "identity_n(3) should be the 3x3 identity")
`, hints: ['`outer(seq_len(n), seq_len(n), "==") * 1`'], solution: 'identity_n <- function(n) {\n  outer(seq_len(n), seq_len(n), "==") * 1\n}' },
      { title: 'Row maxima', task: 'Write `row_max(m)` returning the maximum of every row using `apply`.', starter: 'row_max <- function(m) {\n  \n}\n', harness: r`check(identical(as.numeric(row_max(matrix(c(1, 9, 3, 4, 5, 6), 2))), c(5, 9)), "row_max should apply max over rows")`, hints: ['`apply(m, 1, max)`'], solution: 'row_max <- function(m) {\n  apply(m, 1, max)\n}' },
      { title: 'Trace', task: 'Write `trace_sum(m)` returning the sum of the main diagonal of a square matrix.', starter: 'trace_sum <- function(m) {\n  \n}\n', harness: r`check(trace_sum(matrix(1:9, 3)) == 15 && trace_sum(matrix(7)) == 7, "trace of matrix(1:9, 3) is 1 + 5 + 9")`, hints: ['`sum(diag(m))`'], solution: 'trace_sum <- function(m) {\n  sum(diag(m))\n}' },
    ],
    'r-control': [
      { title: 'Sum of odds', task: 'Write `sum_odds(n)` using a `for` loop with `next` to skip even numbers: the sum of odd numbers from 1 to n.', starter: 'sum_odds <- function(n) {\n  \n}\n', harness: r`
check(sum_odds(10) == 25 && sum_odds(1) == 1 && sum_odds(0) == 0, "sum_odds(10) should be 25")
check(grepl("next", paste(deparse(sum_odds), collapse = " ")), "use next to skip even numbers")
`, hints: ['`for (i in seq_len(n)) { if (i %% 2 == 0) next; total <- total + i }`'], solution: 'sum_odds <- function(n) {\n  total <- 0\n  for (i in seq_len(n)) {\n    if (i %% 2 == 0) next\n    total <- total + i\n  }\n  total\n}' },
      { title: 'Count digits', task: 'Write `count_digits(n)` for a positive integer using a `while` loop and integer division (`%/%`).', starter: 'count_digits <- function(n) {\n  \n}\n', harness: r`check(count_digits(5) == 1 && count_digits(4821) == 4 && count_digits(1000000) == 7, "count_digits is wrong")`, hints: ['Divide by 10 with `n %/% 10` until it reaches 0, counting steps.'], solution: 'count_digits <- function(n) {\n  steps <- 0\n  while (n > 0) {\n    n <- n %/% 10\n    steps <- steps + 1\n  }\n  steps\n}' },
      { title: 'Grades', task: 'Write `grade(score)` returning `"A"` (90+), `"B"` (80-89), `"C"` (70-79), else `"F"`, **vectorised** (works on a vector of scores) without a loop.', starter: 'grade <- function(score) {\n  \n}\n', harness: r`
check(identical(grade(c(95, 85, 72, 10, 90, 80, 70, 69)), c("A", "B", "C", "F", "A", "B", "C", "F")), "grade should be vectorised with the right boundaries")
`, hints: ['Nested `ifelse` or `cut(score, c(-Inf, 70, 80, 90, Inf), labels = c("F","C","B","A"), right = FALSE)` (convert with `as.character`).'], solution: 'grade <- function(score) {\n  as.character(cut(score, c(-Inf, 70, 80, 90, Inf), labels = c("F", "C", "B", "A"), right = FALSE))\n}' },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
