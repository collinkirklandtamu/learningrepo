(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  const r = String.raw;
  LP.addLessons('r', [
    
    {
      id: 'r-inference', title: 'Hypothesis tests', skill: 'Statistics', xp: 40, diff: 3,
      read: `
# Is the difference real?

A **hypothesis test** asks how surprising your data would be if there were *no effect* (the null hypothesis). The **p-value** is the probability of results at least as extreme as yours under that null. Small p (conventionally < 0.05) is evidence against it.

~~~r
t.test(extra ~ group, data = sleep)              # two-sample (Welch) t-test with a formula
t.test(x, y, paired = TRUE)                       # paired samples
t.test(x, mu = 5)                                 # one sample vs a hypothesised mean
cor.test(mtcars$mpg, mtcars$wt)                   # is the correlation non-zero?
chisq.test(table(mtcars$cyl, mtcars$am))          # association between two categorical variables
prop.test(45, 100)                                # test a proportion against 0.5
wilcox.test(mpg ~ am, data = mtcars)              # rank-based alternative to the t-test
shapiro.test(mtcars$mpg)                          # normality check
~~~

The result is a list-like object. Pull out what you need:

~~~r
res <- t.test(extra ~ group, data = sleep)
res$p.value        # 0.0794
res$statistic      # t
res$parameter      # degrees of freedom
res$conf.int       # 95% confidence interval
res$estimate       # the group means
~~~

> [!warn] Read the p-value carefully
> It is **not** the probability that the null is true, and "not significant" is not proof of no effect. Report the effect size and the confidence interval too.

Tests make assumptions (independence, roughly normal data for t-tests, large expected counts for chi-squared). R warns when an approximation may be poor.
`,
      task: 'Using the built-in `sleep` and `mtcars` data: `welch` (Welch t-test of `extra` by `group`), `p_welch` (its p-value), `df_welch` (its degrees of freedom as a plain number), `p_paired` (p-value of the **paired** t-test comparing the two groups\' `extra` values), `r_wt` (the correlation between `mpg` and `wt` as a plain number), `p_chisq` (p-value of the chi-squared test on `table(mtcars$cyl, mtcars$am)`) and `sig` (a named logical vector `c(welch = ..., paired = ..., chisq = ...)` saying which p-values are below 0.05).',
      starter: 'welch <- \np_welch <- \ndf_welch <- \np_paired <- \nr_wt <- \np_chisq <- \nsig <- \n',
      harness: r`
check(inherits(welch, "htest") && grepl("Welch", welch$method), "welch should be the Welch two-sample t.test result")
check(isTRUE(all.equal(p_welch, 0.07939414019)), "p_welch should be about 0.0794")
check(isTRUE(all.equal(df_welch, 17.77647352)) && is.null(names(df_welch)), "df_welch should be the plain number 17.776")
check(isTRUE(all.equal(p_paired, 0.002832890197)), "p_paired should be about 0.0028 (paired = TRUE)")
check(isTRUE(all.equal(r_wt, -0.8676593765)) && is.null(names(r_wt)), "r_wt should be the correlation -0.868 as a plain number")
check(isTRUE(all.equal(p_chisq, 0.01264660505)), "p_chisq should be about 0.0126")
check(identical(sig, c(welch = FALSE, paired = TRUE, chisq = TRUE)), paste("sig is", paste(names(sig), sig, collapse = ", ")))
`,
      hints: ['`welch <- t.test(extra ~ group, data = sleep)`; `welch$p.value`; `unname(welch$parameter)`', 'Paired test: `with(sleep, t.test(extra[group == 1], extra[group == 2], paired = TRUE))$p.value`', '`unname(cor.test(mtcars$mpg, mtcars$wt)$estimate)`', '`chisq.test(table(mtcars$cyl, mtcars$am))$p.value` (R may warn: that is fine)', '`c(welch = p_welch < 0.05, paired = p_paired < 0.05, chisq = p_chisq < 0.05)`'],
      solution: 'welch <- t.test(extra ~ group, data = sleep)\np_welch <- welch$p.value\ndf_welch <- unname(welch$parameter)\np_paired <- with(sleep, t.test(extra[group == 1], extra[group == 2], paired = TRUE))$p.value\nr_wt <- unname(cor.test(mtcars$mpg, mtcars$wt)$estimate)\np_chisq <- suppressWarnings(chisq.test(table(mtcars$cyl, mtcars$am)))$p.value\nsig <- c(welch = p_welch < 0.05, paired = p_paired < 0.05, chisq = p_chisq < 0.05)',
      recall: [
        { type: 'choice', q: 'What does a p-value of 0.03 mean?', options: ['There is a 3% chance the null is true', 'If the null were true, results this extreme would occur about 3% of the time', 'The effect is large', 'The result is proven'], answer: 1, why: 'A p-value is computed assuming the null hypothesis.' },
        { type: 'choice', q: 'When should you use a **paired** t-test?', options: ['Two independent groups', 'Two measurements on the same subjects (before/after)', 'Three or more groups', 'Categorical data'], answer: 1, why: 'Pairing removes between-subject variation.' },
        { type: 'choice', q: 'Which test examines association between two categorical variables?', options: ['t.test', 'chisq.test', 'cor.test', 'shapiro.test'], answer: 1, why: 'Chi-squared test of independence on a contingency table.' },

      ],
    },

    
    {
      id: 'r-capstone', title: 'Capstone: survey analysis pipeline', skill: 'Projects', xp: 150, diff: 3, capstone: true,
      read: `
# From messy data to a reproducible report

You will build a small analysis toolkit that **cleans** raw survey data, **simulates** experiments, **analyses** them with a hypothesis test, and wraps the result in a formal **S4 report object**. It combines string handling, data frames, simulation, statistics, error checking and object-oriented design.

## The pieces

**1. \`clean_survey(df)\`**: input columns \`id\`, \`group\` (messy text), \`score\` (text). Return a data frame where: group is trimmed and lower-case; score is numeric (unparseable values become \`NA\` and those rows are **dropped**); only the **first** row per \`id\` is kept; row names are reset to 1..n.

**2. \`simulate_survey(n_per_group, effect, seed)\`**: reproducible fake data with columns \`id\` (1..2n), \`group\` (\`"a"\` then \`"b"\`, \`n\` each) and \`score\` (group a ~ Normal(50, 10), group b ~ Normal(50 + effect, 10)).

**3. S4 class \`SurveyReport\`**: slots \`data\` (data.frame), \`means\` (named numeric: mean score per group) and \`p_value\` (numeric). Validity: the data must contain \`group\` and \`score\` columns (message \`"data needs group and score columns"\`).

**4. \`analyze(df)\`** returns a \`SurveyReport\` using group means and the Welch t-test p-value. A generic \`summarize_report(object)\` returns text like \`Groups: a, b | means: a=50.3, b=61.2 | p=0.0012\` and \`show\` prints that text.

**5. \`power_estimate(effect, n_per_group, reps, seed)\`**: simulate \`reps\` experiments and return the **proportion** whose p-value is below 0.05 (the statistical power; with no real effect it should be near 0.05).

> [!tip] Plan it
> Build and test one piece at a time: clean -> simulate -> class -> analyze -> power. Each depends only on the earlier ones.
`,
      task: 'Implement `clean_survey`, `simulate_survey`, the S4 class `SurveyReport` (with validity), `analyze`, the generic `summarize_report` and a `show` method, and `power_estimate` exactly as described in the reading.',
      starter: 'clean_survey <- function(df) {\n  \n}\n\nsimulate_survey <- function(n_per_group, effect, seed) {\n  \n}\n\nsetClass("SurveyReport")\n\nanalyze <- function(df) {\n  \n}\n\n# generic summarize_report + show method\n\npower_estimate <- function(effect, n_per_group, reps, seed) {\n  \n}\n',
      harness: r`
raw <- data.frame(id = c(1, 2, 2, 3, 4, 5), group = c(" A", "b", "b", "B ", "a", "A"), score = c("10", "20", "20", "x", "30", "40"), stringsAsFactors = FALSE)
cl <- clean_survey(raw)
check(identical(as.numeric(cl$id), c(1, 2, 4, 5)), paste("clean_survey kept ids", paste(cl$id, collapse = ",")))
check(identical(cl$group, c("a", "b", "a", "a")), paste("groups were", paste(cl$group, collapse = ",")))
check(is.numeric(cl$score) && identical(as.numeric(cl$score), c(10, 20, 30, 40)), "score should be numeric 10, 20, 30, 40")
check(identical(rownames(cl), as.character(1:4)), "row names should be reset to 1..n")
s1 <- simulate_survey(40, 10, 1)
check(identical(s1, simulate_survey(40, 10, 1)) && !identical(s1$score, simulate_survey(40, 10, 2)$score), "simulate_survey must be reproducible for a seed")
check(nrow(s1) == 80 && identical(as.numeric(s1$id), as.numeric(1:80)) && identical(s1$group, rep(c("a", "b"), each = 40)), "simulate_survey layout is wrong")
big <- simulate_survey(500, 100, 7)
check(abs(mean(big$score[big$group == "b"]) - mean(big$score[big$group == "a"]) - 100) < 3 && abs(mean(big$score[big$group == "a"]) - 50) < 2, "group a should average about 50 and group b about 50 + effect")
rep1 <- analyze(s1)
check(is(rep1, "SurveyReport") && identical(names(rep1@means), c("a", "b")), "analyze should return a SurveyReport with named group means")
check(isTRUE(all.equal(unname(rep1@means), c(mean(s1$score[s1$group == "a"]), mean(s1$score[s1$group == "b"])))), "means are wrong")
check(isTRUE(all.equal(rep1@p_value, t.test(score ~ group, data = s1)$p.value)), "p_value should come from the Welch t-test")
txt <- summarize_report(rep1)
check(is.character(txt) && length(txt) == 1 && grepl("^Groups: a, b \\| means: a=[0-9.]+, b=[0-9.]+ \\| p=[0-9.e-]+$", txt), paste("summarize_report gave:", txt))
check(identical(capture.output(rep1), txt), "show should print exactly the summary text")
msg <- tryCatch(new("SurveyReport", data = data.frame(x = 1), means = c(a = 1), p_value = 0.5), error = function(e) conditionMessage(e))
check(grepl("data needs group and score columns", msg), paste("validity message was:", msg))
p0 <- power_estimate(0, 30, 200, 42)
p15 <- power_estimate(15, 30, 100, 42)
check(p0 >= 0 && p0 < 0.15 && p15 > 0.9 && p15 <= 1, paste("power with no effect:", p0, "- with a large effect:", p15))
check(identical(power_estimate(5, 20, 50, 9), power_estimate(5, 20, 50, 9)), "power_estimate must be reproducible for a seed")
`,
      hints: ['clean: `df$group <- tolower(trimws(df$group))`; `df$score <- suppressWarnings(as.numeric(df$score))`; drop `NA` scores, then `df[!duplicated(df$id), ]`, then `rownames(df) <- NULL`.', 'simulate: `set.seed(seed)`; build the data frame with `rep(c("a", "b"), each = n)` and `c(rnorm(n, 50, 10), rnorm(n, 50 + effect, 10))` (draw group a first).', 'setClass with `representation(data = "data.frame", means = "numeric", p_value = "numeric")` and a `validity` function checking `names(object@data)`.', 'analyze: `means <- sapply(split(df$score, df$group), mean)`; `p <- t.test(score ~ group, data = df)$p.value`; `new("SurveyReport", data = df, means = means, p_value = p)`.', 'Summary text: `sprintf("Groups: %s | means: %s | p=%.4f", paste(names(m), collapse = ", "), paste(sprintf("%s=%.1f", names(m), m), collapse = ", "), p)`. `show` calls `cat(text, "\\n", sep = "")`.', 'power_estimate: `set.seed(seed)`; `mean(replicate(reps, analyze(simulate_survey(n, effect, sample.int(1e6, 1)))@p_value < 0.05))`.'],
      solution: 'clean_survey <- function(df) {\n  df$group <- tolower(trimws(df$group))\n  df$score <- suppressWarnings(as.numeric(df$score))\n  df <- df[!is.na(df$score), ]\n  df <- df[!duplicated(df$id), ]\n  rownames(df) <- NULL\n  df\n}\n\nsimulate_survey <- function(n_per_group, effect, seed) {\n  set.seed(seed)\n  a <- rnorm(n_per_group, 50, 10)\n  b <- rnorm(n_per_group, 50 + effect, 10)\n  data.frame(id = seq_len(2 * n_per_group), group = rep(c("a", "b"), each = n_per_group), score = c(a, b), stringsAsFactors = FALSE)\n}\n\nsetClass("SurveyReport",\n  representation(data = "data.frame", means = "numeric", p_value = "numeric"),\n  validity = function(object) {\n    if (!all(c("group", "score") %in% names(object@data))) "data needs group and score columns" else TRUE\n  })\n\nanalyze <- function(df) {\n  means <- sapply(split(df$score, df$group), mean)\n  p <- t.test(score ~ group, data = df)$p.value\n  new("SurveyReport", data = df, means = means, p_value = p)\n}\n\nsetGeneric("summarize_report", function(object) standardGeneric("summarize_report"))\nsetMethod("summarize_report", "SurveyReport", function(object) {\n  m <- object@means\n  sprintf("Groups: %s | means: %s | p=%.4f",\n          paste(names(m), collapse = ", "),\n          paste(sprintf("%s=%.1f", names(m), m), collapse = ", "),\n          object@p_value)\n})\nsetMethod("show", "SurveyReport", function(object) cat(summarize_report(object), "\\n", sep = ""))\n\npower_estimate <- function(effect, n_per_group, reps, seed) {\n  set.seed(seed)\n  mean(replicate(reps, analyze(simulate_survey(n_per_group, effect, sample.int(1e6, 1)))@p_value < 0.05))\n}',
      recall: [
        { type: 'choice', q: 'Why is `simulate_survey` given a `seed`?', options: ['So the "random" data can be reproduced exactly', 'It makes the data more random', 'R requires it', 'It speeds up rnorm'], answer: 0, why: 'Reproducibility is essential for analysis you want to trust.' },
        { type: 'choice', q: 'What does statistical **power** measure?', options: ['The chance of detecting a real effect of a given size', 'The size of the p-value', 'The sample mean', 'Whether data are normal'], answer: 0, why: 'Power = P(reject the null | the effect is real).' },
        { type: 'choice', q: 'With no true effect, what proportion of tests at alpha = 0.05 should be "significant" over many simulations?', options: ['About 5%', 'About 50%', '0%', '100%'], answer: 0, why: 'That is exactly what the 5% false-positive rate means.' },

      ],
    },
  ]);

  LP.addDrills({
    
    'r-inference': [
      { title: 'Proportion test', task: 'Compute `p_prop`: the p-value of `prop.test(45, 100)` (is 45 successes in 100 consistent with p = 0.5?).', starter: 'p_prop <- \n', harness: r`check(isTRUE(all.equal(p_prop, 0.3681202507)), "p_prop should be about 0.368")`, hints: ['`prop.test(45, 100)$p.value`'], solution: 'p_prop <- prop.test(45, 100)$p.value' },

    ],

    
  });
})(typeof window !== 'undefined' ? window : globalThis);
