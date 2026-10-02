(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  const r = String.raw;
  LP.addLessons('r', [

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

      ],
    },
  ]);

  LP.addDrills({

    'r-errors': [
      { title: 'Try a number', task: 'Write `try_num(s)` returning the number, or `NA` for text that cannot be parsed, using `suppressWarnings`.', starter: 'try_num <- function(s) {\n  \n}\n', harness: r`
check(try_num("12") == 12 && is.na(try_num("x")) && identical(try_num(c("1", "b")), c(1, NA)), "try_num wrong")
check(grepl("suppressWarnings", paste(deparse(try_num), collapse = " ")), "use suppressWarnings")
`, hints: ['`suppressWarnings(as.numeric(s))`'], solution: 'try_num <- function(s) {\n  suppressWarnings(as.numeric(s))\n}' },

    ],

    'r-io': [
      { title: 'Parse key=value', task: 'Write `parse_kv(lines)` turning `c("a=1", "b=two")` into the named list `list(a = "1", b = "two")`.', starter: 'parse_kv <- function(lines) {\n  \n}\n', harness: r`
check(identical(parse_kv(c("a=1", "b=two")), list(a = "1", b = "two")) && length(parse_kv(character(0))) == 0, "parse_kv wrong")
`, hints: ['Split each line on the first `=`: `sub("=.*", "", x)` and `sub("^[^=]*=", "", x)`; then `setNames(as.list(values), keys)`.'], solution: 'parse_kv <- function(lines) {\n  keys <- sub("=.*", "", lines)\n  vals <- sub("^[^=]*=", "", lines)\n  setNames(as.list(vals), keys)\n}' },

    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
