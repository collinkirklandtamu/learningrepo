(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  const r = String.raw;
  LP.addDrills({
    'r-hello': [
      { title: 'Greet by name', task: 'Write `greet(name)` returning `"Hello, <name>!"` using `paste0`.', starter: 'greet <- function(name) {\n  \n}\n', harness: r`check(identical(greet("Ada"), "Hello, Ada!") && identical(greet("R"), "Hello, R!"), "greet wrong")`, hints: ['`paste0("Hello, ", name, "!")`'], solution: 'greet <- function(name) paste0("Hello, ", name, "!")' },
      
    ],
    'r-vectors': [
      { title: 'Every other element', task: 'Write `odd_positions(x)` returning the elements at positions 1, 3, 5, ... (no loop).', starter: 'odd_positions <- function(x) {\n  \n}\n', harness: r`check(identical(odd_positions(c(10, 20, 30, 40, 50)), c(10, 30, 50)) && identical(odd_positions(1:2), 1L), "odd_positions wrong")`, hints: ['`x[seq(1, length(x), by = 2)]`'], solution: 'odd_positions <- function(x) x[seq(1, length(x), by = 2)]' },

    ],
    'r-stats': [
      { title: 'Coefficient of variation', task: 'Write `cv(x)`: standard deviation divided by mean.', starter: 'cv <- function(x) {\n  \n}\n', harness: r`check(isTRUE(all.equal(cv(c(2, 4, 6)), 2 / 4)) && isTRUE(all.equal(cv(c(10, 10, 10)), 0)), "cv wrong")`, hints: ['`sd(x) / mean(x)`'], solution: 'cv <- function(x) sd(x) / mean(x)' },

    ],
    'r-dataframes': [
      { title: 'Filter and select', task: 'Write `heavy_cars(n)` returning the `mpg` and `wt` columns of `mtcars` rows whose `wt` is above 4 (a data frame), ordered by decreasing `wt`, keeping only the first `n` rows.', starter: 'heavy_cars <- function(n) {\n  \n}\n', harness: r`
d <- heavy_cars(3)
check(is.data.frame(d) && identical(names(d), c("mpg", "wt")) && nrow(d) == 3 && all(d$wt > 4) && !is.unsorted(rev(d$wt)), "heavy_cars wrong")
`, hints: ['`d <- mtcars[mtcars$wt > 4, c("mpg", "wt")]`; `d <- d[order(-d$wt), ]`; `head(d, n)`'], solution: 'heavy_cars <- function(n) {\n  d <- mtcars[mtcars$wt > 4, c("mpg", "wt")]\n  d <- d[order(-d$wt), ]\n  head(d, n)\n}' },

    ],
    'r-functions': [
      { title: 'Default argument', task: 'Write `power(x, p = 2)` returning `x` raised to `p`.', starter: 'power <- function(x, p = 2) {\n  \n}\n', harness: r`check(power(3) == 9 && power(2, 10) == 1024 && power(p = 3, x = 2) == 8, "power wrong")`, hints: ['`x^p`'], solution: 'power <- function(x, p = 2) x^p' },

    ],
    'r-iteration': [
      { title: 'Sum with a loop', task: 'Write `total(x)` that sums a vector using a `for` loop (do not call `sum`).', starter: 'total <- function(x) {\n  \n}\n', harness: r`check(total(1:10) == 55 && total(numeric(0)) == 0 && !any(grepl("sum\\(", deparse(total))), "total wrong or uses sum()")`, hints: ['Start `s <- 0` and add each element.'], solution: 'total <- function(x) {\n  s <- 0\n  for (v in x) s <- s + v\n  s\n}' },

    ],
    'r-groups': [
      { title: 'Group means', task: 'Compute `mpg_by_cyl`: mean `mpg` for each `cyl` value in `mtcars` as a named numeric vector (use `tapply`).', starter: 'mpg_by_cyl <- \n', harness: r`check(isTRUE(all.equal(as.numeric(mpg_by_cyl), c(26.66364, 19.74286, 15.1), tolerance = 1e-5)) && identical(names(mpg_by_cyl), c("4", "6", "8")), "mpg_by_cyl wrong")`, hints: ['`tapply(mtcars$mpg, mtcars$cyl, mean)`'], solution: 'mpg_by_cyl <- tapply(mtcars$mpg, mtcars$cyl, mean)' },

    ],
    'r-lm': [
      { title: 'Predict', task: 'Fit `fit <- lm(mpg ~ wt, data = mtcars)` and compute `pred3`: the predicted mpg for a car weighing 3 (thousand lbs) as a plain number.', starter: 'fit <- \npred3 <- \n', harness: r`check(inherits(fit, "lm") && isTRUE(all.equal(pred3, 37.285126 - 5.344472 * 3, tolerance = 1e-5)) && is.null(names(pred3)), "pred3 wrong")`, hints: ['`unname(predict(fit, data.frame(wt = 3)))`'], solution: 'fit <- lm(mpg ~ wt, data = mtcars)\npred3 <- unname(predict(fit, data.frame(wt = 3)))' },

    ],
  });
  LP.addRecall({
    'r-hello': [
      { type: 'choice', q: 'Which operator assigns a value in idiomatic R?', options: ['<-', '==', ':=', '=>'], answer: 0, why: '`x <- 5` is the standard form.' },

    ],
    'r-vectors': [
      { type: 'choice', q: 'What is `c(1, 2, 3) * 2`?', options: ['6', 'c(2, 4, 6)', 'c(1, 2, 3, 2)', 'an error'], answer: 1, why: 'Arithmetic is vectorised.' },

    ],
    'r-stats': [
      { type: 'choice', q: 'Which is less affected by outliers?', options: ['mean', 'median', 'sum', 'range'], answer: 1, why: 'The median depends on order, not magnitude.' },

    ],
    'r-dataframes': [
      { type: 'choice', q: 'How do you get the column `mpg` of a data frame `d`?', options: ['d$mpg', 'd.mpg', 'd(mpg)', 'd->mpg'], answer: 0, why: '`$` or `d[["mpg"]]`.' },

    ],
    'r-functions': [
      { type: 'choice', q: 'What does an R function return if there is no `return()`?', options: ['NULL', 'The value of its last expression', 'Nothing, it errors', 'The first argument'], answer: 1, why: 'The last evaluated expression is returned.' },

    ],
    'r-iteration': [
      { type: 'choice', q: 'Why is `seq_len(n)` safer than `1:n` in loops?', options: ['It handles n = 0 correctly (empty sequence)', 'It is faster to type', 'It returns decimals', 'No difference'], answer: 0, why: '`1:0` is c(1, 0), a classic bug.' },

    ],
    'r-groups': [
      { type: 'choice', q: 'What does `table(x)` return?', options: ['Counts of each distinct value', 'A data frame copy', 'The unique values only', 'The sorted values'], answer: 0, why: 'A frequency table.' },

    ],
    'r-lm': [
      { type: 'choice', q: 'In `lm(y ~ x, data = d)` what is `y`?', options: ['The predictor', 'The response (outcome)', 'The intercept', 'The residual'], answer: 1, why: 'Left of the tilde is the response.' },

    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
