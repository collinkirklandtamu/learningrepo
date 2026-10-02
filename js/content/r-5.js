(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  const r = String.raw;
  LP.addDrills({
    'r-hello': [
      { title: 'Greet by name', task: 'Write `greet(name)` returning `"Hello, <name>!"` using `paste0`.', starter: 'greet <- function(name) {\n  \n}\n', harness: r`check(identical(greet("Ada"), "Hello, Ada!") && identical(greet("R"), "Hello, R!"), "greet wrong")`, hints: ['`paste0("Hello, ", name, "!")`'], solution: 'greet <- function(name) paste0("Hello, ", name, "!")' },
      { title: 'Circle area', task: 'Write `circle_area(r)` using the built-in `pi`.', starter: 'circle_area <- function(r) {\n  \n}\n', harness: r`check(isTRUE(all.equal(circle_area(1), pi)) && isTRUE(all.equal(circle_area(2), 4 * pi)), "circle_area wrong")`, hints: ['`pi * r^2`'], solution: 'circle_area <- function(r) pi * r^2' },
    ],
    'r-vectors': [
      { title: 'Every other element', task: 'Write `odd_positions(x)` returning the elements at positions 1, 3, 5, ... (no loop).', starter: 'odd_positions <- function(x) {\n  \n}\n', harness: r`check(identical(odd_positions(c(10, 20, 30, 40, 50)), c(10, 30, 50)) && identical(odd_positions(1:2), 1L), "odd_positions wrong")`, hints: ['`x[seq(1, length(x), by = 2)]`'], solution: 'odd_positions <- function(x) x[seq(1, length(x), by = 2)]' },
      { title: 'Normalise', task: 'Write `rescale(x)` mapping a numeric vector to the range 0..1 (min becomes 0, max becomes 1).', starter: 'rescale <- function(x) {\n  \n}\n', harness: r`check(isTRUE(all.equal(rescale(c(2, 4, 6)), c(0, 0.5, 1))) && isTRUE(all.equal(rescale(c(-1, 0, 1)), c(0, .5, 1))), "rescale wrong")`, hints: ['`(x - min(x)) / (max(x) - min(x))`'], solution: 'rescale <- function(x) (x - min(x)) / (max(x) - min(x))' },
      { title: 'Count the matches', task: 'Write `count_above(x, t)` returning how many values are strictly greater than `t`.', starter: 'count_above <- function(x, t) {\n  \n}\n', harness: r`check(count_above(c(1, 5, 9), 4) == 2 && count_above(1:3, 10) == 0, "count_above wrong")`, hints: ['`sum(x > t)`: TRUE counts as 1.'], solution: 'count_above <- function(x, t) sum(x > t)' },
    ],
    'r-stats': [
      { title: 'Coefficient of variation', task: 'Write `cv(x)`: standard deviation divided by mean.', starter: 'cv <- function(x) {\n  \n}\n', harness: r`check(isTRUE(all.equal(cv(c(2, 4, 6)), 2 / 4)) && isTRUE(all.equal(cv(c(10, 10, 10)), 0)), "cv wrong")`, hints: ['`sd(x) / mean(x)`'], solution: 'cv <- function(x) sd(x) / mean(x)' },
      { title: 'Interquartile range', task: 'Write `spread(x)` returning the interquartile range (Q3 - Q1) as a plain number (no names).', starter: 'spread <- function(x) {\n  \n}\n', harness: r`check(isTRUE(all.equal(spread(1:9), 4)) && is.null(names(spread(1:9))), "spread should be 4 for 1:9 and unnamed")`, hints: ['`IQR(x)` or `diff(unname(quantile(x, c(.25, .75))))`'], solution: 'spread <- function(x) IQR(x)' },
      { title: 'Mode', task: 'Write `most_common(x)` returning the most frequent value (the first, if tied).', starter: 'most_common <- function(x) {\n  \n}\n', harness: r`check(most_common(c(1, 2, 2, 3)) == 2 && most_common(c("a", "b", "b", "a")) == "a" && most_common(5) == 5, "most_common wrong")`, hints: ['`names(which.max(table(x)))` is text; convert back with `x[match(..., as.character(x))]`'], solution: 'most_common <- function(x) {\n  t <- table(x)\n  x[match(names(t)[which.max(t)], as.character(x))]\n}' },
    ],
    'r-dataframes': [
      { title: 'Filter and select', task: 'Write `heavy_cars(n)` returning the `mpg` and `wt` columns of `mtcars` rows whose `wt` is above 4 (a data frame), ordered by decreasing `wt`, keeping only the first `n` rows.', starter: 'heavy_cars <- function(n) {\n  \n}\n', harness: r`
d <- heavy_cars(3)
check(is.data.frame(d) && identical(names(d), c("mpg", "wt")) && nrow(d) == 3 && all(d$wt > 4) && !is.unsorted(rev(d$wt)), "heavy_cars wrong")
`, hints: ['`d <- mtcars[mtcars$wt > 4, c("mpg", "wt")]`; `d <- d[order(-d$wt), ]`; `head(d, n)`'], solution: 'heavy_cars <- function(n) {\n  d <- mtcars[mtcars$wt > 4, c("mpg", "wt")]\n  d <- d[order(-d$wt), ]\n  head(d, n)\n}' },
      { title: 'Add a column', task: 'Write `add_ratio(df)` returning `df` with a new column `ratio` equal to `mpg / wt`.', starter: 'add_ratio <- function(df) {\n  \n}\n', harness: r`d <- add_ratio(mtcars); check("ratio" %in% names(d) && isTRUE(all.equal(d$ratio, mtcars$mpg / mtcars$wt)) && ncol(d) == ncol(mtcars) + 1, "add_ratio wrong")`, hints: ['`df$ratio <- df$mpg / df$wt`'], solution: 'add_ratio <- function(df) {\n  df$ratio <- df$mpg / df$wt\n  df\n}' },
      { title: 'Missing values', task: 'Write `complete_share(df)` returning the proportion of rows with **no** missing values.', starter: 'complete_share <- function(df) {\n  \n}\n', harness: r`check(isTRUE(all.equal(complete_share(data.frame(a = c(1, NA, 3, 4), b = c(1, 2, NA, 4))), 0.5)) && complete_share(mtcars) == 1, "complete_share wrong")`, hints: ['`mean(complete.cases(df))`'], solution: 'complete_share <- function(df) mean(complete.cases(df))' },
    ],
    'r-functions': [
      { title: 'Default argument', task: 'Write `power(x, p = 2)` returning `x` raised to `p`.', starter: 'power <- function(x, p = 2) {\n  \n}\n', harness: r`check(power(3) == 9 && power(2, 10) == 1024 && power(p = 3, x = 2) == 8, "power wrong")`, hints: ['`x^p`'], solution: 'power <- function(x, p = 2) x^p' },
      { title: 'Grade bands', task: 'Write `grade(score)` returning `"A"` for 90+, `"B"` for 80-89, `"C"` for 70-79, otherwise `"F"`. It must work on a single number.', starter: 'grade <- function(score) {\n  \n}\n', harness: r`check(identical(grade(95), "A") && identical(grade(80), "B") && identical(grade(79.9), "C") && identical(grade(10), "F"), "grade wrong")`, hints: ['Use an `if / else if` chain from highest to lowest.'], solution: 'grade <- function(score) {\n  if (score >= 90) "A" else if (score >= 80) "B" else if (score >= 70) "C" else "F"\n}' },
      { title: 'Return two things', task: 'Write `min_max(x)` returning a named list with `lo` and `hi`.', starter: 'min_max <- function(x) {\n  \n}\n', harness: r`m <- min_max(c(3, 9, 1)); check(is.list(m) && identical(names(m), c("lo", "hi")) && m$lo == 1 && m$hi == 9, "min_max wrong")`, hints: ['`list(lo = min(x), hi = max(x))`'], solution: 'min_max <- function(x) list(lo = min(x), hi = max(x))' },
    ],
    'r-iteration': [
      { title: 'Sum with a loop', task: 'Write `total(x)` that sums a vector using a `for` loop (do not call `sum`).', starter: 'total <- function(x) {\n  \n}\n', harness: r`check(total(1:10) == 55 && total(numeric(0)) == 0 && !any(grepl("sum\\(", deparse(total))), "total wrong or uses sum()")`, hints: ['Start `s <- 0` and add each element.'], solution: 'total <- function(x) {\n  s <- 0\n  for (v in x) s <- s + v\n  s\n}' },
      { title: 'sapply lengths', task: 'Write `word_lengths(words)` returning the number of characters in each word as an integer vector using `sapply` (or `vapply`).', starter: 'word_lengths <- function(words) {\n  \n}\n', harness: r`check(identical(as.integer(word_lengths(c("a", "abc", ""))), c(1L, 3L, 0L)), "word_lengths wrong")`, hints: ['`sapply(words, nchar)`; add `USE.NAMES = FALSE`.'], solution: 'word_lengths <- function(words) sapply(words, nchar, USE.NAMES = FALSE)' },
      { title: 'While loop', task: 'Write `halvings(n)` returning how many times `n` can be halved (integer division by 2) before reaching 1 or less, using a `while` loop. `halvings(8)` is 3.', starter: 'halvings <- function(n) {\n  \n}\n', harness: r`check(halvings(8) == 3 && halvings(1) == 0 && halvings(100) == 6, "halvings wrong")`, hints: ['`while (n > 1) { n <- n %/% 2; k <- k + 1 }`'], solution: 'halvings <- function(n) {\n  k <- 0\n  while (n > 1) {\n    n <- n %/% 2\n    k <- k + 1\n  }\n  k\n}' },
    ],
    'r-groups': [
      { title: 'Group means', task: 'Compute `mpg_by_cyl`: mean `mpg` for each `cyl` value in `mtcars` as a named numeric vector (use `tapply`).', starter: 'mpg_by_cyl <- \n', harness: r`check(isTRUE(all.equal(as.numeric(mpg_by_cyl), c(26.66364, 19.74286, 15.1), tolerance = 1e-5)) && identical(names(mpg_by_cyl), c("4", "6", "8")), "mpg_by_cyl wrong")`, hints: ['`tapply(mtcars$mpg, mtcars$cyl, mean)`'], solution: 'mpg_by_cyl <- tapply(mtcars$mpg, mtcars$cyl, mean)' },
      { title: 'Most common group', task: 'Compute `top_cyl`: the `cyl` value that occurs most often in `mtcars` (as a character string, from `table`).', starter: 'top_cyl <- \n', harness: r`check(identical(top_cyl, "8"), "top_cyl should be \"8\"")`, hints: ['`names(which.max(table(mtcars$cyl)))`'], solution: 'top_cyl <- names(which.max(table(mtcars$cyl)))' },
      { title: 'Aggregate', task: 'Compute `agg`: `aggregate(hp ~ gear, data = mtcars, FUN = max)` (max horsepower per gear).', starter: 'agg <- \n', harness: r`check(is.data.frame(agg) && identical(names(agg), c("gear", "hp")) && agg$hp[agg$gear == 5] == 335, "agg wrong")`, hints: ['`aggregate(hp ~ gear, data = mtcars, FUN = max)`'], solution: 'agg <- aggregate(hp ~ gear, data = mtcars, FUN = max)' },
    ],
    'r-lm': [
      { title: 'Predict', task: 'Fit `fit <- lm(mpg ~ wt, data = mtcars)` and compute `pred3`: the predicted mpg for a car weighing 3 (thousand lbs) as a plain number.', starter: 'fit <- \npred3 <- \n', harness: r`check(inherits(fit, "lm") && isTRUE(all.equal(pred3, 37.285126 - 5.344472 * 3, tolerance = 1e-5)) && is.null(names(pred3)), "pred3 wrong")`, hints: ['`unname(predict(fit, data.frame(wt = 3)))`'], solution: 'fit <- lm(mpg ~ wt, data = mtcars)\npred3 <- unname(predict(fit, data.frame(wt = 3)))' },
      { title: 'R-squared', task: 'Compute `r2`: the R-squared of `lm(mpg ~ wt + hp, data = mtcars)` as a plain number.', starter: 'r2 <- \n', harness: r`check(isTRUE(all.equal(r2, 0.8267855, tolerance = 1e-5)) && is.null(names(r2)), "r2 wrong")`, hints: ['`summary(lm(...))$r.squared`'], solution: 'r2 <- summary(lm(mpg ~ wt + hp, data = mtcars))$r.squared' },
      { title: 'Residual size', task: 'Compute `rmse`: root mean squared residual of `lm(mpg ~ wt, data = mtcars)`.', starter: 'rmse <- \n', harness: r`check(isTRUE(all.equal(rmse, sqrt(mean(residuals(lm(mpg ~ wt, mtcars))^2)))) && abs(rmse - 2.949) < 0.01, "rmse wrong")`, hints: ['`sqrt(mean(residuals(fit)^2))`'], solution: 'rmse <- sqrt(mean(residuals(lm(mpg ~ wt, data = mtcars))^2))' },
    ],
  });
  LP.addRecall({
    'r-hello': [
      { type: 'choice', q: 'Which operator assigns a value in idiomatic R?', options: ['<-', '==', ':=', '=>'], answer: 0, why: '`x <- 5` is the standard form.' },
      { type: 'choice', q: 'What does `print(paste("a", "b"))` show?', options: ['ab', 'a b', '"a b"', 'a, b'], answer: 2, why: 'paste joins with a space; print shows the string with quotes.' },
      { type: 'type', q: 'Which function shows help for `mean`? (full call)', accept: ['?mean', 'help(mean)', 'help("mean")'], why: '`?mean` or `help(mean)`.' },
    ],
    'r-vectors': [
      { type: 'choice', q: 'What is `c(1, 2, 3) * 2`?', options: ['6', 'c(2, 4, 6)', 'c(1, 2, 3, 2)', 'an error'], answer: 1, why: 'Arithmetic is vectorised.' },
      { type: 'choice', q: 'What does `x[-1]` return?', options: ['The last element', 'Everything except the first element', 'The first element negated', 'An error'], answer: 1, why: 'Negative indices drop elements.' },
      { type: 'choice', q: 'What is `sum(c(TRUE, FALSE, TRUE))`?', options: ['2', '3', 'TRUE', '0'], answer: 0, why: 'TRUE is 1 and FALSE is 0.' },
      { type: 'type', q: 'Which function returns the number of elements in a vector? (name only)', accept: ['length', 'length()'], why: '`length(x)`.' },
    ],
    'r-stats': [
      { type: 'choice', q: 'Which is less affected by outliers?', options: ['mean', 'median', 'sum', 'range'], answer: 1, why: 'The median depends on order, not magnitude.' },
      { type: 'choice', q: 'What does `mean(c(1, NA, 3))` return?', options: ['2', 'NA', '0', 'an error'], answer: 1, why: 'Missing values propagate unless `na.rm = TRUE`.' },
      { type: 'choice', q: 'What does `quantile(x, 0.5)` give?', options: ['The median', 'The mean', 'The maximum', 'The mode'], answer: 0, why: 'The 50th percentile is the median.' },
      { type: 'type', q: 'Which argument tells `mean` to ignore missing values? (argument = value)', accept: ['na.rm = TRUE', 'na.rm=TRUE'], why: '`mean(x, na.rm = TRUE)`.' },
    ],
    'r-dataframes': [
      { type: 'choice', q: 'How do you get the column `mpg` of a data frame `d`?', options: ['d$mpg', 'd.mpg', 'd(mpg)', 'd->mpg'], answer: 0, why: '`$` or `d[["mpg"]]`.' },
      { type: 'choice', q: 'What does `d[d$wt > 4, ]` do?', options: ['Selects columns with wt > 4', 'Selects rows where wt > 4', 'Sorts by wt', 'Errors'], answer: 1, why: 'A logical row index before the comma.' },
      { type: 'choice', q: 'Which returns the number of rows?', options: ['length(d)', 'nrow(d)', 'ncol(d)', 'size(d)'], answer: 1, why: '`length` of a data frame is its number of columns.' },
      { type: 'type', q: 'Which function shows the first six rows? (name only)', accept: ['head', 'head()'], why: '`head(d)`.' },
    ],
    'r-functions': [
      { type: 'choice', q: 'What does an R function return if there is no `return()`?', options: ['NULL', 'The value of its last expression', 'Nothing, it errors', 'The first argument'], answer: 1, why: 'The last evaluated expression is returned.' },
      { type: 'choice', q: 'What happens to variables created inside a function?', options: ['They stay local', 'They become global', 'They are saved to disk', 'They override built-ins'], answer: 0, why: 'Function scope is local by default.' },
      { type: 'choice', q: 'What does `f <- function(x, p = 2) x^p; f(3)` return?', options: ['9', '6', '3', 'an error'], answer: 0, why: 'The default `p = 2` is used.' },
      { type: 'type', q: 'Which keyword handles the other case after an `if`? (one word)', accept: ['else'], why: '`if (...) ... else ...`.' },
    ],
    'r-iteration': [
      { type: 'choice', q: 'Why is `seq_len(n)` safer than `1:n` in loops?', options: ['It handles n = 0 correctly (empty sequence)', 'It is faster to type', 'It returns decimals', 'No difference'], answer: 0, why: '`1:0` is c(1, 0), a classic bug.' },
      { type: 'choice', q: 'What does `sapply(1:3, function(i) i^2)` return?', options: ['c(1, 4, 9)', 'a list', '14', 'an error'], answer: 0, why: 'sapply simplifies to a vector.' },
      { type: 'choice', q: 'Which statement skips to the next loop iteration?', options: ['next', 'continue', 'skip', 'pass'], answer: 0, why: 'R uses `next` (and `break`).' },
      { type: 'type', q: 'Which family function always returns a list? (name only)', accept: ['lapply', 'lapply()'], why: '`lapply` never simplifies.' },
    ],
    'r-groups': [
      { type: 'choice', q: 'What does `table(x)` return?', options: ['Counts of each distinct value', 'A data frame copy', 'The unique values only', 'The sorted values'], answer: 0, why: 'A frequency table.' },
      { type: 'choice', q: 'Which computes a mean per group?', options: ['tapply(v, g, mean)', 'mean(v, g)', 'sum(v, g)', 'group(v)'], answer: 0, why: 'tapply applies a function within groups.' },
      { type: 'choice', q: 'What does `aggregate(y ~ g, data = d, FUN = mean)` return?', options: ['A data frame with one row per group', 'A single number', 'A list of plots', 'A matrix of counts'], answer: 0, why: 'One row per level of g.' },
      { type: 'type', q: 'Which function splits a vector or data frame into a list by group? (name only)', accept: ['split', 'split()'], why: '`split(x, f)`.' },
    ],
    'r-lm': [
      { type: 'choice', q: 'In `lm(y ~ x, data = d)` what is `y`?', options: ['The predictor', 'The response (outcome)', 'The intercept', 'The residual'], answer: 1, why: 'Left of the tilde is the response.' },
      { type: 'choice', q: 'What does R-squared measure?', options: ['The share of variance in y explained by the model', 'The p-value', 'The slope', 'The sample size'], answer: 0, why: 'Between 0 and 1.' },
      { type: 'choice', q: 'A residual is...', options: ['observed minus fitted value', 'fitted minus mean', 'the slope squared', 'the intercept'], answer: 0, why: 'What the model failed to explain.' },
      { type: 'type', q: 'Which function returns model predictions for new data? (name only)', accept: ['predict', 'predict()'], why: '`predict(fit, newdata)`.' },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
