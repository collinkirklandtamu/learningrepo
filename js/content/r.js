(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  const r = String.raw;
  (LP.courses = LP.courses || []).push({
    id: 'r', title: 'R', icon: '📊', color: '#4f8fd6', engine: 'r',
    blurb: 'Vectors, data frames and statistics in base R: the language built for data analysis.',
    skills: ['Basics', 'Vectors', 'Data frames', 'Functions', 'Iteration', 'Statistics'],
    lessons: [
      {
        id: 'r-hello', title: 'Hello, R', skill: 'Basics', xp: 15, diff: 1,
        read: `
# R in one minute

R was made for statistics and data. You assign with \`<-\` (an arrow pointing the value into the name) and you call functions with parentheses.

~~~r
greeting <- "Hello"
print(greeting)
x <- 3 * 4        # comments start with #
x                 # typing a name on its own prints it
~~~

The \`[1]\` you see in output means "element number 1". R has no plain numbers: everything is a **vector**, and a single value is just a vector of length one.

Useful for exploring: \`class(x)\` tells you the type, \`length(x)\` the size, and \`cat("text\\n")\` prints raw text without the \`[1]\`.

> [!tip] Key idea
> \`<-\` is the idiomatic assignment. \`=\` also works at top level but R programmers reserve it for function arguments.
`,
        task: 'Create a variable `greeting` holding the text `Hello, R!` and print it.',
        starter: '# your code here\n',
        harness: r`
check(exists("greeting"), "Create a variable called greeting")
check(identical(greeting, "Hello, R!"), paste0('greeting should be "Hello, R!" but is ', deparse(greeting)))
check(grepl("Hello, R!", .out, fixed = TRUE), "Print greeting (for example with print(greeting))")
`,
        hints: ['`greeting <- "Hello, R!"`', 'Then `print(greeting)`.'],
        solution: 'greeting <- "Hello, R!"\nprint(greeting)',
        recall: [
          { type: 'choice', q: 'Which is the idiomatic way to assign in R?', options: ['x := 5', 'x <- 5', 'let x = 5', 'x == 5'], answer: 1, why: '`<-` is the standard R assignment operator.' },
          { type: 'choice', q: 'What does the `[1]` in R output mean?', options: ['The value is 1', 'It is the first element of a vector', 'There was one error', 'It is a list'], answer: 1, why: 'R labels each line of output with the index of its first element.' },
        ],
      },
      {
        id: 'r-vectors', title: 'Vectors', skill: 'Vectors', xp: 25, diff: 2,
        read: `
# Vectors: R's core idea

Build one with \`c()\` (combine):

~~~r
scores <- c(72, 85, 90)
scores + 5          # 77 90 95   -> math applies to every element
scores > 80         # FALSE TRUE TRUE
~~~

This is **vectorisation**: no loop needed. Compare a vector to a number and you get a logical vector back.

## Indexing (starts at 1!)

~~~r
scores[1]            # 72
scores[2:3]          # 85 90
scores[-1]           # drops the first element
scores[scores > 80]  # keep only the ones where the condition is TRUE
~~~

The last form, **logical indexing**, is how you filter data in R. Also handy: \`length()\`, \`sum()\`, \`seq(1, 10, by = 3)\`, \`rev()\`, \`sort()\`.

> [!warn] 1-based
> R counts from **1**, not 0 like Python.
`,
        task: 'Using the given `scores`: create `curved` (every score plus 5), `high` (the curved scores that are at least 80) and `n_high` (how many of those there are).',
        starter: 'scores <- c(72, 85, 90, 64, 78)\n\ncurved <- \nhigh <- \nn_high <- \n',
        harness: r`
check(isTRUE(all.equal(scores, c(72, 85, 90, 64, 78))), "Leave scores as it was")
check(isTRUE(all.equal(curved, c(77, 90, 95, 69, 83))), paste0("curved should be scores + 5, but is ", paste(curved, collapse = ", ")))
check(isTRUE(all.equal(high, c(90, 95, 83))), paste0("high should keep curved values >= 80 (90, 95, 83) but is ", paste(high, collapse = ", ")))
check(n_high == 3, "n_high should be 3 (use length())")
`,
        hints: ['`curved <- scores + 5`', '`high <- curved[curved >= 80]`', '`n_high <- length(high)`'],
        solution: 'scores <- c(72, 85, 90, 64, 78)\n\ncurved <- scores + 5\nhigh <- curved[curved >= 80]\nn_high <- length(high)',
        recall: [
          { type: 'choice', q: 'What does `c(1, 2, 3) * 2` return?', options: ['6', 'c(2, 4, 6)', 'c(1, 2, 3, 1, 2, 3)', 'An error'], answer: 1, why: 'Arithmetic is vectorised: it applies to every element.' },
          { type: 'choice', q: 'What is `c(10, 20, 30)[2]`?', options: ['10', '20', '30', 'NA'], answer: 1, why: 'R indexes from 1, so [2] is the second element.' },
        ],
      },
      {
        id: 'r-stats', title: 'Summary statistics', skill: 'Statistics', xp: 25, diff: 2,
        read: `
# Describing data

R ships with the statistics you reach for first:

~~~r
x <- c(4, 8, 6, 5, 3, 7)
mean(x)      # 5.5
median(x)    # 5.5
sd(x)        # standard deviation
var(x)       # variance
min(x); max(x)
range(x)
quantile(x, 0.9)
summary(x)   # min, quartiles, mean, max in one go
~~~

\`round(value, digits)\` tidies the output: \`round(sd(x), 2)\`.

## Counting with logicals

\`TRUE\` counts as 1 and \`FALSE\` as 0, so \`sum()\` of a logical vector counts how many are true, and \`mean()\` of it gives the *proportion*:

~~~r
sum(x > 5)    # how many values exceed 5
mean(x > 5)   # what fraction
~~~

> [!warn] Missing data
> One \`NA\` makes \`mean(x)\` return \`NA\`. Use \`mean(x, na.rm = TRUE)\` to ignore missing values.
`,
        task: 'For `heights`, compute `avg` (the mean), `spread` (the standard deviation rounded to 2 decimals) and `n_tall` (how many heights are **above** the mean).',
        starter: 'heights <- c(150, 160, 165, 172, 168, 181, 155, 177)\n\navg <- \nspread <- \nn_tall <- \n',
        harness: r`
check(isTRUE(all.equal(heights, c(150, 160, 165, 172, 168, 181, 155, 177))), "Leave heights as it was")
check(isTRUE(all.equal(avg, 166)), paste0("avg should be the mean (166) but is ", avg))
check(isTRUE(all.equal(spread, 10.69)), paste0("spread should be round(sd(heights), 2) = 10.69 but is ", spread))
check(n_tall == 4, paste0("n_tall should be 4 but is ", n_tall))
`,
        hints: ['`avg <- mean(heights)`', '`spread <- round(sd(heights), 2)`', '`n_tall <- sum(heights > avg)`'],
        solution: 'heights <- c(150, 160, 165, 172, 168, 181, 155, 177)\n\navg <- mean(heights)\nspread <- round(sd(heights), 2)\nn_tall <- sum(heights > avg)',
        recall: [
          { type: 'choice', q: 'What does `sum(c(1, 5, 9) > 4)` return?', options: ['2', '15', 'c(FALSE, TRUE, TRUE)', '3'], answer: 0, why: 'The comparison gives FALSE TRUE TRUE; TRUE counts as 1, so the sum is 2.' },
          { type: 'type', q: 'Which argument makes `mean()` ignore missing values? (write it as `name = value`)', accept: ['na.rm = TRUE', 'na.rm=TRUE', 'na.rm = T', 'na.rm=T'], why: '`mean(x, na.rm = TRUE)` removes NAs first.' },
        ],
      },
      {
        id: 'r-dataframes', title: 'Data frames', skill: 'Data frames', xp: 35, diff: 2,
        read: `
# Data frames

A **data frame** is a table: each column is a vector, each row an observation.

~~~r
people <- data.frame(
  name = c("Ada", "Grace", "Linus"),
  age  = c(36, 45, 28)
)
people$age            # a column
nrow(people); ncol(people)
people$senior <- people$age > 40    # add a column
people[people$age > 30, ]           # filter rows (note the comma!)
people[, "name"]                    # pick columns
head(people); str(people); summary(people)
~~~

The pattern \`df[rows, columns]\` is the whole game. Leave one side empty to mean "all".

> [!tip] Key idea
> \`df[df$age > 30, ]\` is logical indexing from the vectors lesson, applied to rows.
`,
        task: 'Build `df` with columns `name` (Ada, Grace, Linus, Margaret) and `score` (88, 95, 72, 91). Add a logical column `passed` (score at least 75). Then create `top`: only the rows with a score of 90 or more.',
        starter: 'df <- data.frame(\n  # name = ...,\n  # score = ...\n)\n\n# add the passed column\n\ntop <- \n',
        harness: r`
check(is.data.frame(df), "df should be a data frame (use data.frame())")
check(identical(as.character(df$name), c("Ada", "Grace", "Linus", "Margaret")), "name column should be Ada, Grace, Linus, Margaret")
check(isTRUE(all.equal(df$score, c(88, 95, 72, 91))), "score column should be 88, 95, 72, 91")
check("passed" %in% names(df), "Add a column called passed")
check(identical(as.logical(df$passed), c(TRUE, TRUE, FALSE, TRUE)), "passed should be TRUE when score >= 75")
check(is.data.frame(top) && nrow(top) == 2, "top should be a data frame with the 2 rows scoring 90+")
check(identical(as.character(top$name), c("Grace", "Margaret")), "top should contain Grace and Margaret")
`,
        hints: ['`df <- data.frame(name = c(...), score = c(...))`', '`df$passed <- df$score >= 75`', '`top <- df[df$score >= 90, ]`  (keep the comma)'],
        solution: 'df <- data.frame(\n  name = c("Ada", "Grace", "Linus", "Margaret"),\n  score = c(88, 95, 72, 91)\n)\n\ndf$passed <- df$score >= 75\n\ntop <- df[df$score >= 90, ]',
        recall: [
          { type: 'choice', q: 'Which keeps only the rows where `age` is over 30?', options: ['df[df$age > 30]', 'df[df$age > 30, ]', 'df[, df$age > 30]', 'df$age[30]'], answer: 1, why: 'Rows go before the comma, columns after. Leave the columns empty to keep all.' },
          { type: 'type', q: 'Which operator extracts a column, e.g. `df ? age`? (give the single symbol)', accept: ['$'], why: '`df$age` pulls out the age column as a vector.' },
        ],
      },
      {
        id: 'r-functions', title: 'Functions & conditions', skill: 'Functions', xp: 35, diff: 3,
        read: `
# Writing functions

~~~r
square <- function(x) {
  x^2          # the last expression is the return value
}
square(4)      # 16
~~~

Arguments can have defaults: \`function(x, power = 2)\`. R returns the **last value** evaluated, so \`return()\` is optional.

## Conditions

For **one** value use \`if\` / \`else\`:

~~~r
sign_word <- function(n) {
  if (n > 0) {
    "positive"
  } else if (n < 0) {
    "negative"
  } else {
    "zero"
  }
}
~~~

For a **whole vector** use \`ifelse(test, yes, no)\`, which decides element by element:

~~~r
ifelse(c(5, -2, 9) > 0, "up", "down")   # "up" "down" "up"
~~~

> [!warn] Common bug
> \`if\` expects a single TRUE/FALSE. Passing it a vector gives an error (or only uses the first element). Reach for \`ifelse\` for vectors.
`,
        task: 'Write `zscore(x)` returning `(x - mean(x)) / sd(x)`, `label(x)` returning `"high"` where a value is at or above the mean and `"low"` otherwise (vectorised), and `sign_word(n)` returning `"positive"`, `"negative"` or `"zero"` for a single number.',
        starter: 'zscore <- function(x) {\n  \n}\n\nlabel <- function(x) {\n  \n}\n\nsign_word <- function(n) {\n  \n}\n',
        harness: r`
check(is.function(zscore), "zscore should be a function")
check(isTRUE(all.equal(zscore(c(1, 2, 3)), c(-1, 0, 1))), "zscore(c(1, 2, 3)) should be -1 0 1")
check(identical(label(c(1, 2, 3)), c("low", "high", "high")), "label(c(1, 2, 3)) should be low high high (2 is equal to the mean so it is high)")
check(identical(label(c(10, 0)), c("high", "low")), "label should work element by element, use ifelse()")
check(identical(sign_word(5), "positive") && identical(sign_word(-2), "negative") && identical(sign_word(0), "zero"), "sign_word should give positive, negative or zero")
`,
        hints: ['`(x - mean(x)) / sd(x)` as the last line of zscore.', '`ifelse(x >= mean(x), "high", "low")`', 'Use `if (n > 0) ... else if (n < 0) ... else ...`'],
        solution: 'zscore <- function(x) {\n  (x - mean(x)) / sd(x)\n}\n\nlabel <- function(x) {\n  ifelse(x >= mean(x), "high", "low")\n}\n\nsign_word <- function(n) {\n  if (n > 0) {\n    "positive"\n  } else if (n < 0) {\n    "negative"\n  } else {\n    "zero"\n  }\n}',
        recall: [
          { type: 'choice', q: 'What does an R function return if there is no `return()`?', options: ['NULL always', 'The last expression it evaluated', 'The first argument', 'Nothing'], answer: 1, why: 'The value of the last evaluated expression is returned.' },
          { type: 'choice', q: 'Which handles a whole vector, deciding element by element?', options: ['if', 'ifelse', 'else', 'switch'], answer: 1, why: '`ifelse(test, yes, no)` is vectorised; `if` handles a single condition.' },
        ],
      },
      {
        id: 'r-iteration', title: 'Loops & apply', skill: 'Iteration', xp: 35, diff: 3,
        read: `
# Repeating work

R has loops:

~~~r
total <- 0
for (i in 1:5) {
  total <- total + i
}
total   # 15
~~~

But idiomatic R usually avoids explicit loops with the **apply family**, which runs a function on each element and collects the results:

~~~r
sapply(1:3, function(i) i^2)            # 1 4 9
sapply(mtcars[, c("mpg", "hp")], mean)  # mean of each column
lapply(1:2, function(i) i * 10)         # always returns a list
~~~

\`sapply\` *simplifies* the result into a vector when it can; \`lapply\` always returns a list.

\`mtcars\` is a built-in dataset of 32 cars. Try \`head(mtcars)\` and \`str(mtcars)\` to explore it.

> [!tip] Rule of thumb
> If a vectorised function exists (\`sum\`, \`mean\`, \`+\`), use it. If you need a custom function per element, use \`sapply\`. Use \`for\` when each step depends on the previous one.
`,
        task: 'Use a `for` loop to set `total` to the sum of 1 to 10. Use `sapply` to build `squares` (1^2 to 5^2). Use `sapply` over the `mpg`, `hp` and `wt` columns of `mtcars` to build `col_means`.',
        starter: 'total <- 0\n# for loop here\n\nsquares <- \n\ncol_means <- \n',
        harness: r`
check(total == 55, paste0("total should be 55 but is ", total))
check(isTRUE(all.equal(as.numeric(squares), c(1, 4, 9, 16, 25))), "squares should be 1 4 9 16 25")
check(isTRUE(all.equal(unname(col_means), unname(colMeans(mtcars[, c("mpg", "hp", "wt")])))), "col_means should hold the mean of mpg, hp and wt")
check(identical(names(col_means), c("mpg", "hp", "wt")), "col_means should keep the column names (sapply over a data frame does this)")
`,
        must: [{ re: '\\bfor\\b', msg: 'Use a for loop for total.' }, { re: 'sapply', msg: 'Use sapply for squares and col_means.' }],
        hints: ['`for (i in 1:10) { total <- total + i }`', '`squares <- sapply(1:5, function(i) i^2)`', '`col_means <- sapply(mtcars[, c("mpg", "hp", "wt")], mean)`'],
        solution: 'total <- 0\nfor (i in 1:10) {\n  total <- total + i\n}\n\nsquares <- sapply(1:5, function(i) i^2)\n\ncol_means <- sapply(mtcars[, c("mpg", "hp", "wt")], mean)',
        recall: [
          { type: 'choice', q: 'Which always returns a list?', options: ['sapply', 'lapply', 'sum', 'c'], answer: 1, why: '`lapply` never simplifies; `sapply` tries to return a vector.' },
          { type: 'choice', q: 'What is `1:4`?', options: ['The vector 1 2 3 4', 'A ratio of 1 to 4', 'A list of 4 items', 'An error'], answer: 0, why: 'The colon builds an integer sequence.' },
        ],
      },
      {
        id: 'r-groups', title: 'Grouping & counting', skill: 'Data frames', xp: 40, diff: 3,
        read: `
# Split, apply, combine

Real analysis constantly asks "...by group". Base R has several tools:

~~~r
tapply(mtcars$mpg, mtcars$cyl, mean)        # mean mpg for each cylinder count
table(mtcars$cyl)                           # how many cars of each kind
aggregate(mpg ~ gear, data = mtcars, FUN = mean)   # same idea, returns a data frame
~~~

- \`tapply(values, groups, fun)\` returns a named vector.
- \`table(x)\` counts each distinct value.
- \`aggregate(y ~ group, data, FUN)\` uses a **formula**: "y explained by group".

Index a named result with double brackets or the name: \`result[["4"]]\`.

> [!tip] Key idea
> This split-apply-combine pattern is the foundation of packages like dplyr (\`group_by()\` + \`summarise()\`). Learn it here in base R and the packages will make instant sense.
`,
        task: 'With `mtcars`: build `avg_mpg` (average `mpg` for each `cyl` value, with `tapply`), `cyl_counts` (how many cars for each `cyl`, with `table`), and `by_gear` (average `mpg` per `gear` as a data frame with `aggregate`).',
        starter: 'avg_mpg <- \n\ncyl_counts <- \n\nby_gear <- \n',
        harness: r`
check(isTRUE(all.equal(round(avg_mpg[["4"]], 2), 26.66)), "avg_mpg should be the mean mpg for each cyl (4 cyl is 26.66)")
check(length(avg_mpg) == 3, "avg_mpg should have one value per cyl group (4, 6, 8)")
check(inherits(cyl_counts, "table"), "cyl_counts should come from table()")
check(cyl_counts[["8"]] == 14, "There are 14 eight-cylinder cars")
check(is.data.frame(by_gear), "by_gear should be a data frame (use aggregate)")
check(nrow(by_gear) == 3, "by_gear should have one row per gear value")
check(all(c("gear", "mpg") %in% names(by_gear)), "by_gear needs gear and mpg columns")
`,
        hints: ['`tapply(mtcars$mpg, mtcars$cyl, mean)`', '`table(mtcars$cyl)`', '`aggregate(mpg ~ gear, data = mtcars, FUN = mean)`'],
        solution: 'avg_mpg <- tapply(mtcars$mpg, mtcars$cyl, mean)\n\ncyl_counts <- table(mtcars$cyl)\n\nby_gear <- aggregate(mpg ~ gear, data = mtcars, FUN = mean)',
        recall: [
          { type: 'choice', q: 'Which counts how many times each distinct value appears?', options: ['tapply()', 'table()', 'sum()', 'unique()'], answer: 1, why: '`table(x)` tabulates the counts of each value.' },
          { type: 'choice', q: 'In `aggregate(mpg ~ gear, ...)`, what does `~` express?', options: ['mpg minus gear', 'mpg explained by gear (a formula)', 'a comment', 'mpg equals gear'], answer: 1, why: 'The tilde builds a formula: left side is the outcome, right side the grouping/explanatory variable.' },
        ],
      },
      {
        id: 'r-lm', title: 'Your first model', skill: 'Statistics', xp: 50, diff: 3,
        read: `
# Linear regression with lm()

Does heavier mean thirstier? Fit a straight line to find out. \`lm()\` takes a **formula** and a data frame:

~~~r
fit <- lm(mpg ~ wt, data = mtcars)
coef(fit)               # intercept and slope
summary(fit)            # coefficients, p-values, R-squared
summary(fit)$r.squared  # just the R-squared
predict(fit, data.frame(wt = 3))   # predict for a 3,000 lb car
~~~

Read the slope as: *"each extra 1000 lbs of weight changes expected mpg by this much"*. R-squared says how much of the variation in mpg the line explains (0 to 1).

> [!tip] Key idea
> A model is just an object. You can pull numbers out of it (\`coef\`, \`residuals\`, \`fitted\`) and feed them to the next step of your analysis, which is why R scripts compose so well.
`,
        task: 'Fit `fit <- lm(mpg ~ wt, data = mtcars)`. Then store the slope for `wt` in `slope`, the R-squared rounded to 3 decimals in `r2`, and the predicted mpg for a 3 (thousand lb) car in `predicted`.',
        starter: 'fit <- \n\nslope <- \nr2 <- \npredicted <- \n',
        harness: r`
check(inherits(fit, "lm"), "fit should be a model made by lm()")
check(isTRUE(all.equal(unname(slope), -5.344472, tolerance = 1e-4)), "slope should be the wt coefficient (about -5.344)")
check(isTRUE(all.equal(r2, 0.753)), paste0("r2 should be 0.753 (rounded to 3 decimals) but is ", r2))
check(isTRUE(all.equal(unname(predicted), 21.25171, tolerance = 1e-4)), "predicted should be the prediction for wt = 3 (about 21.25)")
`,
        hints: ['`fit <- lm(mpg ~ wt, data = mtcars)`', '`slope <- coef(fit)[["wt"]]`', '`r2 <- round(summary(fit)$r.squared, 3)`', '`predicted <- predict(fit, data.frame(wt = 3))`'],
        solution: 'fit <- lm(mpg ~ wt, data = mtcars)\n\nslope <- coef(fit)[["wt"]]\nr2 <- round(summary(fit)$r.squared, 3)\npredicted <- predict(fit, data.frame(wt = 3))',
        recall: [
          { type: 'choice', q: 'In `lm(y ~ x, data = d)` what is `y`?', options: ['The predictor', 'The outcome being explained', 'The intercept', 'The residual'], answer: 1, why: 'The left side of `~` is the response variable.' },
          { type: 'choice', q: 'An R-squared of 0.75 means...', options: ['75% of predictions are exactly right', 'The model explains about 75% of the variation in y', 'The slope is 0.75', 'There is a 75% chance the model is wrong'], answer: 1, why: 'R-squared is the share of variance in the outcome explained by the model.' },
        ],
      },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
