(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  const r = String.raw;
  LP.addLessons('r', [
    
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

      ],
    },

  ]);

  LP.addDrills({
    
    'r-strings': [
      { title: 'Initials', task: 'Write `initials(name)` so `"ada lovelace"` gives `"A.L."` (any number of words).', starter: 'initials <- function(name) {\n  \n}\n', harness: r`check(identical(initials("ada lovelace"), "A.L.") && identical(initials("alan mathison turing"), "A.M.T.") && identical(initials("plato"), "P."), "initials should uppercase the first letter of each word and add a dot")`, hints: ['Split into words, take `substr(w, 1, 1)`, uppercase, `paste0(..., ".", collapse = "")`.'], solution: 'initials <- function(name) {\n  words <- strsplit(trimws(name), "[[:space:]]+")[[1]]\n  paste0(toupper(substr(words, 1, 1)), ".", collapse = "")\n}' },

    ],

  });
})(typeof window !== 'undefined' ? window : globalThis);
