(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  const r = String.raw;
  LP.addLessons('r', [
    {
      id: 'r-prob', title: 'Probability, distributions & simulation', skill: 'Statistics', xp: 40, diff: 3,
      read: `
# Four functions for every distribution

For a distribution named \`norm\`, \`binom\`, \`pois\`, \`unif\`, \`exp\`, ... R provides four functions, distinguished by a prefix:

| Prefix | Meaning | Example |
|---|---|---|
| \`d\` | density / probability **mass** at x | \`dbinom(3, 10, 0.5)\` = P(X = 3) |
| \`p\` | **cumulative** probability P(X ≤ x) | \`pnorm(1.96)\` = 0.975 |
| \`q\` | **quantile** (inverse of p) | \`qnorm(0.975)\` = 1.96 |
| \`r\` | **random** draws | \`rnorm(5, mean = 100, sd = 15)\` |

~~~r
1 - pbinom(7, 10, 0.5)              # P(X >= 8)  (or pbinom(7, 10, .5, lower.tail = FALSE))
sum(dbinom(3:5, 10, 0.5))           # P(3 <= X <= 5)
ppois(2, lambda = 3)                # P(X <= 2) for a Poisson
~~~

## Simulation

\`set.seed()\` makes random numbers reproducible. \`sample()\` draws from a vector; \`replicate()\` repeats an experiment.

~~~r
set.seed(42)
sample(1:6, 10, replace = TRUE)               # ten dice rolls
mean(replicate(1000, sum(sample(1:6, 2, TRUE)) == 7))   # ~ 1/6
x <- runif(10000); y <- runif(10000)
4 * mean(x^2 + y^2 <= 1)                      # Monte Carlo estimate of pi
~~~

## Bootstrap

Resample your data **with replacement** many times to see how much a statistic varies:

~~~r
boot_means <- replicate(2000, mean(sample(x, replace = TRUE)))
quantile(boot_means, c(0.025, 0.975))         # a 95% bootstrap confidence interval
~~~

> [!tip] Key idea
> If you can simulate a process, you can estimate almost any probability: run it many times and count.
`,
      task: 'Compute with the distribution functions: `p1` = P(Z ≤ 1.96) for a standard normal, `q1` = the 97.5% quantile, `d1` = P(X = 3) for Binomial(10, 0.5), `p8` = P(X ≥ 8) for the same binomial, `ppois2` = P(X ≤ 2) for a Poisson with rate 3. Then write simulations: `estimate_pi(n, seed)` (Monte Carlo), `prob_sum7(n, seed)` (probability two dice sum to 7) and `boot_ci(x, seed, B = 2000)` (95% bootstrap CI of the mean as an unnamed numeric of length 2).',
      starter: 'p1 <- \nq1 <- \nd1 <- \np8 <- \nppois2 <- \n\nestimate_pi <- function(n, seed) {\n  \n}\n\nprob_sum7 <- function(n, seed) {\n  \n}\n\nboot_ci <- function(x, seed, B = 2000) {\n  \n}\n',
      harness: r`
check(isTRUE(all.equal(p1, 0.9750021049)) && isTRUE(all.equal(q1, 1.959963985)), "p1 should be pnorm(1.96) and q1 qnorm(0.975)")
check(isTRUE(all.equal(d1, 0.1171875)), "d1 should be dbinom(3, 10, 0.5)")
check(isTRUE(all.equal(p8, 0.0546875)), "p8 should be P(X >= 8) = 1 - pbinom(7, 10, 0.5)")
check(isTRUE(all.equal(ppois2, 0.4231900811)), "ppois2 should be ppois(2, 3)")
e1 <- estimate_pi(50000, 1)
check(abs(e1 - pi) < 0.05 && identical(e1, estimate_pi(50000, 1)), "estimate_pi should be close to pi and reproducible for the same seed")
check(!identical(e1, estimate_pi(50000, 2)), "different seeds should give different estimates")
s7 <- prob_sum7(20000, 5)
check(abs(s7 - 1/6) < 0.03 && identical(s7, prob_sum7(20000, 5)), "prob_sum7 should be about 1/6 and reproducible")
x <- c(2, 4, 4, 5, 7, 9, 10, 12)
ci <- boot_ci(x, 3)
check(is.numeric(ci) && length(ci) == 2 && is.null(names(ci)), "boot_ci should return an unnamed numeric vector of length 2")
check(ci[1] < mean(x) && mean(x) < ci[2] && diff(ci) < 8 && diff(ci) > 1, paste("boot_ci gave", paste(round(ci, 2), collapse = " to ")))
check(identical(ci, boot_ci(x, 3)), "boot_ci must be reproducible for a fixed seed")
`,
      hints: ['`pnorm(1.96)`, `qnorm(0.975)`, `dbinom(3, 10, 0.5)`, `1 - pbinom(7, 10, 0.5)`, `ppois(2, 3)`', 'estimate_pi: `set.seed(seed)`, draw `x <- runif(n)`, `y <- runif(n)`, return `4 * mean(x^2 + y^2 <= 1)`.', 'prob_sum7: sample two dice with `sample(1:6, n, replace = TRUE)` and take `mean(d1 + d2 == 7)`.', 'boot_ci: `set.seed(seed)`; `m <- replicate(B, mean(sample(x, replace = TRUE)))`; `unname(quantile(m, c(0.025, 0.975)))`.'],
      solution: 'p1 <- pnorm(1.96)\nq1 <- qnorm(0.975)\nd1 <- dbinom(3, 10, 0.5)\np8 <- 1 - pbinom(7, 10, 0.5)\nppois2 <- ppois(2, 3)\n\nestimate_pi <- function(n, seed) {\n  set.seed(seed)\n  x <- runif(n)\n  y <- runif(n)\n  4 * mean(x^2 + y^2 <= 1)\n}\n\nprob_sum7 <- function(n, seed) {\n  set.seed(seed)\n  d1 <- sample(1:6, n, replace = TRUE)\n  d2 <- sample(1:6, n, replace = TRUE)\n  mean(d1 + d2 == 7)\n}\n\nboot_ci <- function(x, seed, B = 2000) {\n  set.seed(seed)\n  m <- replicate(B, mean(sample(x, replace = TRUE)))\n  unname(quantile(m, c(0.025, 0.975)))\n}',
      recall: [
        { type: 'choice', q: 'What does `qnorm(0.975)` return?', options: ['0.975', 'The value with 97.5% of the standard normal below it (about 1.96)', 'A random normal draw', 'The density at 0.975'], answer: 1, why: 'q = quantile: the inverse of the cumulative p function.' },
        { type: 'choice', q: 'Which function gives P(X = 3) for a binomial?', options: ['pbinom', 'dbinom', 'qbinom', 'rbinom'], answer: 1, why: 'd = density/mass function at a point.' },
        { type: 'choice', q: 'Why call `set.seed()` before random simulation?', options: ['It makes the code faster', 'It makes the random numbers reproducible', 'It makes them more random', 'It is required by sample()'], answer: 1, why: 'The same seed gives the same sequence.' },
        { type: 'choice', q: 'What makes a bootstrap resample different from the original data?', options: ['It samples with replacement', 'It sorts the data', 'It removes outliers', 'It uses a different seed only'], answer: 0, why: 'Drawing with replacement mimics repeating the study.' },
        { type: 'type', q: 'Which function repeats an expression many times and collects the results? (name only)', accept: ['replicate', 'replicate()'], why: '`replicate(1000, expr)`.' },
      ],
    },
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
        { type: 'choice', q: 'How do you get the confidence interval out of `res <- t.test(x)`?', options: ['res$conf.int', 'res$ci()', 'ci(res)', 'res[1]'], answer: 0, why: 'htest objects store it in $conf.int.' },
        { type: 'type', q: 'Which function is a rank-based alternative to the two-sample t-test? (name only)', accept: ['wilcox.test', 'wilcox.test()'], why: '`wilcox.test` makes fewer distributional assumptions.' },
      ],
    },
    {
      id: 'r-anova', title: 'Comparing groups: ANOVA & model comparison', skill: 'Statistics', xp: 40, diff: 3,
      read: `
# More than two groups

Running many t-tests inflates false positives. **ANOVA** tests "are all group means equal?" in one go.

~~~r
fit <- aov(weight ~ group, data = PlantGrowth)    # response ~ factor
summary(fit)                                      # F statistic and p-value
~~~

\`summary(fit)[[1]]\` is a data-frame-like table; pull out values with \`[["F value"]]\` and \`[["Pr(>F)"]]\`.

## Which groups differ? Post-hoc tests

A significant ANOVA does not say *where*. Use Tukey's honest significant differences (it adjusts for multiple comparisons):

~~~r
tk <- TukeyHSD(fit)
tk$group                       # diff, lwr, upr, p adj for every pair
rownames(tk$group)[tk$group[, "p adj"] < 0.05]
~~~

## When the assumptions fail

~~~r
kruskal.test(weight ~ group, data = PlantGrowth)   # rank-based ANOVA alternative
p.adjust(c(0.01, 0.02, 0.04), method = "bonferroni")   # correct a set of p-values
~~~

## Comparing nested models

\`anova(model1, model2)\` tests whether adding predictors improves a regression significantly:

~~~r
m1 <- lm(mpg ~ wt, data = mtcars)
m2 <- lm(mpg ~ wt + hp, data = mtcars)
anova(m1, m2)                  # F test; small p => the bigger model helps
~~~

> [!tip] Key idea
> ANOVA is just a linear model with a categorical predictor: \`aov(y ~ g)\` and \`lm(y ~ g)\` fit the same thing.
`,
      task: 'With the built-in `PlantGrowth` and `mtcars`: `fit` = one-way ANOVA of `weight` by `group`; `f_stat` and `p_val` (the F value and its p-value as plain numbers); `sig_pairs` (character vector naming the group pairs whose Tukey adjusted p-value is below 0.05); `kw_p` (p-value of the Kruskal-Wallis test) and `model_p` (the p-value from `anova()` comparing `mpg ~ wt` with `mpg ~ wt + hp`).',
      starter: 'fit <- \nf_stat <- \np_val <- \nsig_pairs <- \nkw_p <- \nmodel_p <- \n',
      harness: r`
check(inherits(fit, "aov"), "fit should come from aov()")
check(isTRUE(all.equal(f_stat, 4.846087862)) && is.numeric(f_stat) && length(f_stat) == 1, "f_stat should be the single F value 4.846")
check(isTRUE(all.equal(p_val, 0.01590995833)) && length(p_val) == 1, "p_val should be the ANOVA p-value 0.0159")
check(identical(sig_pairs, "trt2-trt1"), paste("sig_pairs is", paste(sig_pairs, collapse = ", ")))
check(isTRUE(all.equal(kw_p, 0.01842375573)), "kw_p should be the Kruskal-Wallis p-value 0.0184")
check(isTRUE(all.equal(model_p, 0.001451228532)) && length(model_p) == 1, "model_p should be the p-value from anova(m1, m2): about 0.00145")
`,
      hints: ['`fit <- aov(weight ~ group, data = PlantGrowth)`; `tab <- summary(fit)[[1]]`; `tab[["F value"]][1]`, `tab[["Pr(>F)"]][1]`', '`tk <- TukeyHSD(fit)`; `rownames(tk$group)[tk$group[, "p adj"] < 0.05]`', '`kruskal.test(weight ~ group, data = PlantGrowth)$p.value`', '`anova(lm(mpg ~ wt, mtcars), lm(mpg ~ wt + hp, mtcars))[["Pr(>F)"]][2]`'],
      solution: 'fit <- aov(weight ~ group, data = PlantGrowth)\ntab <- summary(fit)[[1]]\nf_stat <- tab[["F value"]][1]\np_val <- tab[["Pr(>F)"]][1]\ntk <- TukeyHSD(fit)\nsig_pairs <- rownames(tk$group)[tk$group[, "p adj"] < 0.05]\nkw_p <- kruskal.test(weight ~ group, data = PlantGrowth)$p.value\nmodel_p <- anova(lm(mpg ~ wt, data = mtcars), lm(mpg ~ wt + hp, data = mtcars))[["Pr(>F)"]][2]',
      recall: [
        { type: 'choice', q: 'Why use ANOVA instead of many pairwise t-tests?', options: ['It is faster to type', 'Many tests inflate the false-positive rate', 'T-tests cannot compare groups', 'ANOVA gives effect sizes'], answer: 1, why: 'Each extra test adds chances of a false positive.' },
        { type: 'choice', q: 'After a significant ANOVA, what tells you which pairs differ?', options: ['summary(fit)', 'A post-hoc test like TukeyHSD', 'mean()', 'str(fit)'], answer: 1, why: 'ANOVA says "somewhere"; Tukey says "where".' },
        { type: 'choice', q: 'What does `anova(m1, m2)` test?', options: ['Whether the larger nested model fits significantly better', 'Whether m1 is normal', 'The residuals only', 'Group means'], answer: 0, why: 'It is an F-test comparing nested models.' },
        { type: 'choice', q: 'Which is the non-parametric alternative to one-way ANOVA?', options: ['kruskal.test', 'cor.test', 'prop.test', 'shapiro.test'], answer: 0, why: 'Kruskal-Wallis uses ranks.' },
        { type: 'type', q: 'Which function adjusts a vector of p-values for multiple testing? (name only)', accept: ['p.adjust', 'p.adjust()'], why: '`p.adjust(p, method = "bonferroni")`.' },
      ],
    },
    {
      id: 'r-glm', title: 'Generalised linear models', skill: 'Statistics', xp: 45, diff: 3,
      read: `
# When the outcome is not a number on a line

\`lm\` assumes a continuous outcome with constant variance. For yes/no outcomes or counts use a **GLM**: \`glm(formula, family = ..., data = ...)\`.

| Outcome | Family | Link |
|---|---|---|
| 0/1 (binary) | \`binomial\` | logit |
| counts | \`poisson\` | log |
| continuous | \`gaussian\` | identity (same as lm) |

## Logistic regression

~~~r
fit <- glm(am ~ wt, data = mtcars, family = binomial)    # transmission (0/1) vs weight
coef(fit)                 # on the log-odds scale
exp(coef(fit))            # odds ratios: the multiplicative change in odds per unit
predict(fit, data.frame(wt = 2), type = "response")      # a PROBABILITY
fitted(fit)               # fitted probabilities for the data
mean((fitted(fit) > 0.5) == mtcars$am)                   # classification accuracy
AIC(fit); deviance(fit)   # model fit measures (lower AIC = better trade-off)
~~~

\`type = "response"\` converts predictions back from the link scale to probabilities; the default gives log-odds.

## Poisson regression for counts

~~~r
gp <- glm(count ~ spray, data = InsectSprays, family = poisson)
exp(coef(gp)[1])          # baseline expected count (the first spray group)
~~~

> [!warn] Interpreting coefficients
> In logistic regression a coefficient of -4 does **not** mean a 4-point drop in probability. It means the *log-odds* fall by 4 per unit; \`exp()\` turns that into an odds multiplier.
`,
      task: 'Fit `fit <- glm(am ~ wt, data = mtcars, family = binomial)`. Then compute `odds_ratio` (the odds ratio for `wt` as a plain number), `p_light` (predicted probability of a manual transmission, `am = 1`, for a car with `wt = 2`, as a plain number), `accuracy` (proportion of cars correctly classified with a 0.5 cut-off) and `aic`. Also fit the Poisson model of `count` by `spray` on `InsectSprays` and store the baseline expected count in `baseline`.',
      starter: 'fit <- \nodds_ratio <- \np_light <- \naccuracy <- \naic <- \n\nbaseline <- \n',
      harness: r`
check(inherits(fit, "glm") && fit$family$family == "binomial", "fit should be a binomial glm")
check(isTRUE(all.equal(odds_ratio, 0.01788183403)) && is.null(names(odds_ratio)), "odds_ratio should be exp(coef)[['wt']], about 0.0179, as a plain number")
check(isTRUE(all.equal(p_light, 0.9818795904)) && is.null(names(p_light)), "p_light should be the predicted probability 0.982 (use type = 'response')")
check(isTRUE(all.equal(accuracy, 0.90625)), "accuracy should be 0.90625")
check(isTRUE(all.equal(aic, 23.17608481)), "aic should be AIC(fit)")
check(isTRUE(all.equal(baseline, 14.5)) && is.null(names(baseline)), "baseline should be exp of the Poisson intercept (14.5)")
`,
      hints: ['`exp(coef(fit))[["wt"]]`', '`unname(predict(fit, data.frame(wt = 2), type = "response"))`', '`mean((fitted(fit) > 0.5) == mtcars$am)`', '`gp <- glm(count ~ spray, data = InsectSprays, family = poisson)`; `unname(exp(coef(gp)[1]))`'],
      solution: 'fit <- glm(am ~ wt, data = mtcars, family = binomial)\nodds_ratio <- exp(coef(fit))[["wt"]]\np_light <- unname(predict(fit, data.frame(wt = 2), type = "response"))\naccuracy <- mean((fitted(fit) > 0.5) == mtcars$am)\naic <- AIC(fit)\n\ngp <- glm(count ~ spray, data = InsectSprays, family = poisson)\nbaseline <- unname(exp(coef(gp)[1]))',
      recall: [
        { type: 'choice', q: 'Which family models a 0/1 outcome?', options: ['gaussian', 'binomial', 'poisson', 'Gamma'], answer: 1, why: 'binomial with a logit link gives logistic regression.' },
        { type: 'choice', q: 'What does `exp(coef(fit))` give in logistic regression?', options: ['Probabilities', 'Odds ratios', 'Residuals', 'P-values'], answer: 1, why: 'Coefficients are log-odds; exponentiating gives odds multipliers.' },
        { type: 'choice', q: 'What does `predict(fit, newdata, type = "response")` return?', options: ['Log-odds', 'Predicted probabilities (or expected counts)', 'Residuals', 'Coefficients'], answer: 1, why: 'It back-transforms from the link scale.' },
        { type: 'choice', q: 'Which family suits count data (0, 1, 2, ...)?', options: ['binomial', 'poisson', 'gaussian', 'quasi'], answer: 1, why: 'Poisson regression with a log link.' },
        { type: 'type', q: 'Which function returns the Akaike information criterion of a fitted model? (name only)', accept: ['AIC', 'AIC()', 'aic'], why: '`AIC(fit)`: lower is better when comparing models.' },
      ],
    },
    {
      id: 'r-optim', title: 'Optimisation, root-finding & integration', skill: 'Advanced', xp: 40, diff: 3,
      read: `
# Numerical tools in base R

~~~r
optimize(function(x) (x - 3)^2 + 1, interval = c(0, 10))$minimum   # 1-D minimum: ~3
uniroot(function(x) x^3 - 2, c(0, 2))$root                          # solve f(x) = 0: ~1.26
integrate(dnorm, -1.96, 1.96)$value                                 # area under a curve: ~0.95
integrate(function(x) x * dexp(x, 2), 0, Inf)$value                 # expected value: 0.5
~~~

## Many parameters: optim

\`optim(start, fn)\` minimises a function of a **vector** of parameters. BFGS is accurate for smooth problems; the default Nelder-Mead needs no derivatives.

~~~r
f <- function(p) (p[1] - 1)^2 + (p[2] + 2)^2
optim(c(0, 0), f, method = "BFGS")$par          # c(1, -2)
~~~

## Maximum likelihood by hand

Maximising a likelihood = minimising the **negative log-likelihood**:

~~~r
x <- c(4.1, 5.3, 6.2, 4.8, 5.5)
nll <- function(p) -sum(dnorm(x, mean = p[1], sd = exp(p[2]), log = TRUE))   # exp() keeps sd positive
est <- optim(c(0, 0), nll, method = "BFGS")$par
c(mean = est[1], sd = exp(est[2]))
~~~

## Derivatives

\`D(expression(x^2 + 3*x), "x")\` differentiates symbolically (returns \`2 * x + 3\`); evaluate with \`eval(d, list(x = 2))\`.

> [!tip] Key idea
> Reparameterise (e.g. log of a standard deviation) so the optimiser can't wander into impossible values.
`,
      task: 'Compute `best_x` (minimiser of `(x - 3)^2 + 1` on `[0, 10]`), `root` (positive root of `x^3 - 2` between 0 and 2), `central_area` (integral of the standard normal density from -1.96 to 1.96), `params` (BFGS minimiser of `(p[1] - 1)^2 + (p[2] + 2)^2` starting from `c(0, 0)`), `slope_at_2` (derivative of `x^2 + 3*x` at 2 using `D`) and a function `mle_normal(x)` returning the **maximum likelihood** estimates `c(mean = ..., sd = ...)` via `optim` on the negative log-likelihood.',
      starter: 'best_x <- \nroot <- \ncentral_area <- \nparams <- \nslope_at_2 <- \n\nmle_normal <- function(x) {\n  \n}\n',
      harness: r`
check(abs(best_x - 3) < 1e-3, paste("best_x is", best_x))
check(abs(root - 2^(1/3)) < 1e-3, paste("root is", root))
check(abs(central_area - 0.9500042097) < 1e-6, "central_area should be about 0.95")
check(length(params) == 2 && abs(params[1] - 1) < 1e-3 && abs(params[2] + 2) < 1e-3, paste("params are", paste(round(params, 4), collapse = ", ")))
check(isTRUE(all.equal(as.numeric(slope_at_2), 7)), "the derivative of x^2 + 3x at 2 is 7")
set.seed(1); x <- rnorm(20, 5, 2)
est <- mle_normal(x)
check(identical(names(est), c("mean", "sd")), "mle_normal should return c(mean = , sd = )")
check(abs(est[["mean"]] - mean(x)) < 1e-3 && abs(est[["sd"]] - sqrt(mean((x - mean(x))^2))) < 1e-3, paste("mle gave", paste(round(est, 4), collapse = ", "), "- the MLE sd divides by n, not n - 1"))
`,
      hints: ['`optimize(function(x) (x - 3)^2 + 1, c(0, 10))$minimum`', '`uniroot(function(x) x^3 - 2, c(0, 2))$root`', '`integrate(dnorm, -1.96, 1.96)$value`', '`optim(c(0, 0), function(p) (p[1] - 1)^2 + (p[2] + 2)^2, method = "BFGS")$par`', '`eval(D(expression(x^2 + 3*x), "x"), list(x = 2))`', 'In `mle_normal`: `nll <- function(p) -sum(dnorm(x, p[1], exp(p[2]), log = TRUE))`, optimise, return `c(mean = est[1], sd = exp(est[2]))` (use `unname` on pieces).'],
      solution: 'best_x <- optimize(function(x) (x - 3)^2 + 1, c(0, 10))$minimum\nroot <- uniroot(function(x) x^3 - 2, c(0, 2), tol = 1e-9)$root\ncentral_area <- integrate(dnorm, -1.96, 1.96)$value\nparams <- optim(c(0, 0), function(p) (p[1] - 1)^2 + (p[2] + 2)^2, method = "BFGS")$par\nslope_at_2 <- eval(D(expression(x^2 + 3 * x), "x"), list(x = 2))\n\nmle_normal <- function(x) {\n  nll <- function(p) -sum(dnorm(x, mean = p[1], sd = exp(p[2]), log = TRUE))\n  est <- optim(c(mean(x), log(sd(x))), nll, method = "BFGS", control = list(reltol = 1e-12))$par\n  c(mean = unname(est[1]), sd = exp(unname(est[2])))\n}',
      recall: [
        { type: 'choice', q: 'Which function finds where `f(x) = 0`?', options: ['optimize', 'uniroot', 'integrate', 'optim'], answer: 1, why: 'uniroot does root-finding on an interval.' },
        { type: 'choice', q: 'Why minimise the **negative** log-likelihood?', options: ['optim only minimises, so maximising the likelihood = minimising its negative', 'It is faster', 'Likelihoods are negative', 'No reason'], answer: 0, why: 'optim minimises by default.' },
        { type: 'choice', q: 'Why parameterise the standard deviation as `exp(p[2])`?', options: ['It guarantees sd > 0 whatever value the optimiser tries', 'It is a convention only', 'It speeds up dnorm', 'It rounds sd'], answer: 0, why: 'exp() maps any real number to a positive one.' },
        { type: 'choice', q: 'What does `integrate(dnorm, -Inf, Inf)$value` approximately equal?', options: ['0', '1', '0.5', 'Inf'], answer: 1, why: 'A density integrates to 1.' },
        { type: 'type', q: 'Which function differentiates an expression symbolically? (name only)', accept: ['D', 'D()', 'deriv'], why: '`D(expression(x^2), "x")` gives `2 * x`.' },
      ],
    },
    {
      id: 'r-perf', title: 'Vectorisation & metaprogramming', skill: 'Advanced', xp: 35, diff: 3,
      read: `
# Writing fast, flexible R

## Think in vectors

Loops in R are fine for small jobs, but built-in vectorised functions run in compiled code and are shorter:

~~~r
sum((1:1000)^2)                       # vectorised
total <- 0; for (i in 1:1000) total <- total + i^2    # same, slower
~~~

**Preallocate** results instead of growing them one element at a time:

~~~r
out <- numeric(n)                     # allocate once
for (i in seq_len(n)) out[i] <- i^2
# NOT: out <- c(out, i^2)   (copies the vector every iteration)
~~~

Useful vectorised tools: \`cumsum\`, \`rowSums\`, \`ifelse\`, \`which\`, \`%in%\`, \`outer\`, \`vapply\`. Measure with \`system.time(expr)\`.

## Code is data

R lets you capture code instead of evaluating it:

~~~r
f <- function(x) deparse(substitute(x))   # the text the caller typed
f(a + b)                                   # "a + b"

e <- quote(x + 1)                          # an unevaluated call
eval(e, list(x = 5))                       # 6
n <- 10
bquote(x + .(n))                           # x + 10   (.() inserts a value)

formals(function(a, b = 2) NULL)           # the arguments;  body(f)  the code
~~~

This is how \`plot(x, y)\` knows the axis labels, how \`subset(df, cond)\` and \`lm(y ~ x)\` work, and the foundation of tidyverse-style packages.

> [!tip] Key idea
> \`substitute()\` captures what the caller wrote; \`eval()\` runs it later in a chosen environment.
`,
      task: 'Write `sum_sq_vec(n)` (sum of squares 1..n, **vectorised, no loop**), `squares_prealloc(n)` (a loop that **preallocates** with `numeric(n)` and fills it), `arg_text(x)` (returns the code the caller typed for `x`, as a string), `add_n_expr(n)` (returns the **unevaluated** expression `x + <n>` built with `bquote`) and `n_args(f)` (number of formal arguments of a function).',
      starter: 'sum_sq_vec <- function(n) {\n  \n}\n\nsquares_prealloc <- function(n) {\n  \n}\n\narg_text <- function(x) {\n  \n}\n\nadd_n_expr <- function(n) {\n  \n}\n\nn_args <- function(f) {\n  \n}\n',
      harness: r`
check(sum_sq_vec(1000) == 333833500 && sum_sq_vec(1) == 1 && sum_sq_vec(0) == 0, "sum_sq_vec(1000) should be 333833500")
check(!any(grepl("\\bfor\\b|\\bwhile\\b|\\brepeat\\b", deparse(sum_sq_vec))), "sum_sq_vec must be vectorised (no loops)")
check(identical(squares_prealloc(5), c(1, 4, 9, 16, 25)) && length(squares_prealloc(0)) == 0, "squares_prealloc(5) should be 1 4 9 16 25")
check(any(grepl("numeric\\(", deparse(squares_prealloc))), "preallocate with numeric(n)")
check(identical(arg_text(a + b), "a + b") && identical(arg_text(mean(1:3)), "mean(1:3)"), "arg_text should return the typed code")
e <- add_n_expr(10)
check(is.call(e) && eval(e, list(x = 5)) == 15 && identical(deparse(e), "x + 10"), paste("add_n_expr(10) gave", paste(deparse(e), collapse = " ")))
check(n_args(function(a, b = 2, ...) NULL) == 3 && n_args(function() 1) == 0 && n_args(paste) >= 3, "n_args wrong")
`,
      hints: ['`sum((1:n)^2)` but watch `n = 0`: `seq_len(n)` makes it safe.', '`out <- numeric(n); for (i in seq_len(n)) out[i] <- i^2; out`', '`deparse(substitute(x))`', '`bquote(x + .(n))`', '`length(formals(f))`'],
      solution: 'sum_sq_vec <- function(n) {\n  sum(seq_len(n)^2)\n}\n\nsquares_prealloc <- function(n) {\n  out <- numeric(n)\n  for (i in seq_len(n)) out[i] <- i^2\n  out\n}\n\narg_text <- function(x) {\n  deparse(substitute(x))\n}\n\nadd_n_expr <- function(n) {\n  bquote(x + .(n))\n}\n\nn_args <- function(f) {\n  length(formals(f))\n}',
      recall: [
        { type: 'choice', q: 'Why preallocate with `numeric(n)` before filling in a loop?', options: ['Growing a vector with c() copies it every iteration', 'It is required syntax', 'It makes numbers more precise', 'It sorts the result'], answer: 0, why: 'Allocation once is far cheaper than repeated copying.' },
        { type: 'choice', q: 'What does `deparse(substitute(x))` return inside a function?', options: ['The value of x', 'The code the caller wrote for x, as text', 'The class of x', 'NULL'], answer: 1, why: 'substitute captures the unevaluated argument expression.' },
        { type: 'choice', q: 'What does `bquote(x + .(n))` do?', options: ['Evaluates x + n', 'Builds the expression x + <value of n> without evaluating it', 'Quotes the whole string', 'Errors'], answer: 1, why: '.() splices a value into a quoted expression.' },
        { type: 'choice', q: 'Which usually runs faster for large inputs?', options: ['A for loop adding numbers one by one', 'A built-in vectorised function like sum()', 'Both are identical', 'Recursion'], answer: 1, why: 'Vectorised built-ins run compiled code.' },
        { type: 'type', q: 'Which function measures how long an expression takes to run? (name only)', accept: ['system.time', 'system.time()'], why: '`system.time(expr)`.' },
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
        { type: 'choice', q: 'Why check `validity` in the S4 class?', options: ['To reject malformed objects at creation time', 'To speed up code', 'To print nicer output', 'It is required by new()'], answer: 0, why: 'Invalid data is caught immediately instead of failing later.' },
        { type: 'choice', q: 'Which step should happen **first** in a real analysis pipeline?', options: ['Cleaning and validating the data', 'Fitting models', 'Making plots', 'Writing the report'], answer: 0, why: 'Garbage in, garbage out.' },
      ],
    },
  ]);

  LP.addDrills({
    'r-prob': [
      { title: 'Range probability', task: 'Write `p_between(a, b)` returning P(a ≤ X ≤ b) for X ~ Binomial(10, 0.5) using `dbinom` (sum the probabilities).', starter: 'p_between <- function(a, b) {\n  \n}\n', harness: r`check(isTRUE(all.equal(p_between(3, 5), 0.568359375)) && isTRUE(all.equal(p_between(0, 10), 1)) && p_between(6, 5) == 0, "p_between wrong")`, hints: ['`sum(dbinom(a:b, 10, 0.5))`; guard `a > b`.'], solution: 'p_between <- function(a, b) {\n  if (a > b) return(0)\n  sum(dbinom(a:b, 10, 0.5))\n}' },
      { title: 'Tail probability', task: 'Write `p_above(x, mean, sd)` returning P(X > x) for a normal distribution using the upper tail.', starter: 'p_above <- function(x, mean, sd) {\n  \n}\n', harness: r`check(isTRUE(all.equal(p_above(110, 100, 15), 0.2524925375)) && isTRUE(all.equal(p_above(0, 0, 1), 0.5)), "p_above wrong")`, hints: ['`pnorm(x, mean, sd, lower.tail = FALSE)`'], solution: 'p_above <- function(x, mean, sd) {\n  pnorm(x, mean, sd, lower.tail = FALSE)\n}' },
      { title: 'Two heads', task: 'Write `prob_two_heads(n, seed)` estimating by simulation the probability that two fair coin flips are both heads (about 0.25).', starter: 'prob_two_heads <- function(n, seed) {\n  \n}\n', harness: r`
e <- prob_two_heads(40000, 11)
check(abs(e - 0.25) < 0.02 && identical(e, prob_two_heads(40000, 11)), paste("estimate", e))
`, hints: ['Simulate two `rbinom(n, 1, 0.5)` vectors and take `mean(a == 1 & b == 1)`.'], solution: 'prob_two_heads <- function(n, seed) {\n  set.seed(seed)\n  a <- rbinom(n, 1, 0.5)\n  b <- rbinom(n, 1, 0.5)\n  mean(a == 1 & b == 1)\n}' },
    ],
    'r-inference': [
      { title: 'Proportion test', task: 'Compute `p_prop`: the p-value of `prop.test(45, 100)` (is 45 successes in 100 consistent with p = 0.5?).', starter: 'p_prop <- \n', harness: r`check(isTRUE(all.equal(p_prop, 0.3681202507)), "p_prop should be about 0.368")`, hints: ['`prop.test(45, 100)$p.value`'], solution: 'p_prop <- prop.test(45, 100)$p.value' },
      { title: 'Normality check', task: 'Compute `p_normal`: the Shapiro-Wilk p-value for `mtcars$mpg`, and `looks_normal` (TRUE when p > 0.05).', starter: 'p_normal <- \nlooks_normal <- \n', harness: r`check(isTRUE(all.equal(p_normal, 0.1228813585)) && identical(looks_normal, TRUE), "p_normal should be about 0.123")`, hints: ['`shapiro.test(mtcars$mpg)$p.value`'], solution: 'p_normal <- shapiro.test(mtcars$mpg)$p.value\nlooks_normal <- p_normal > 0.05' },
      { title: 'Rank test', task: 'Compute `p_rank`: the p-value of the Wilcoxon rank-sum test of `mpg` by `am` in `mtcars` (use `exact = FALSE` to allow ties).', starter: 'p_rank <- \n', harness: r`check(isTRUE(all.equal(p_rank, 0.001871391333)), "p_rank should be about 0.00187")`, hints: ['`wilcox.test(mpg ~ am, data = mtcars, exact = FALSE)$p.value`'], solution: 'p_rank <- wilcox.test(mpg ~ am, data = mtcars, exact = FALSE)$p.value' },
    ],
    'r-anova': [
      { title: 'Group means', task: 'Compute `grp_means`: the mean `weight` for each `group` of `PlantGrowth` as a named numeric vector.', starter: 'grp_means <- \n', harness: r`check(isTRUE(all.equal(grp_means[["ctrl"]], 5.032)) && isTRUE(all.equal(grp_means[["trt1"]], 4.661)) && isTRUE(all.equal(grp_means[["trt2"]], 5.526)), "grp_means wrong")`, hints: ['`tapply(PlantGrowth$weight, PlantGrowth$group, mean)`'], solution: 'grp_means <- tapply(PlantGrowth$weight, PlantGrowth$group, mean)' },
      { title: 'Effect size', task: 'Compute `eta_sq`: the share of total variance explained by `group` in the ANOVA (sum of squares between / total).', starter: 'eta_sq <- \n', harness: r`check(isTRUE(all.equal(eta_sq, 3.76634 / 14.25843, tolerance = 1e-5)), "eta_sq should be about 0.264")`, hints: ['Take `ss <- summary(aov(...))[[1]][["Sum Sq"]]`; `ss[1] / sum(ss)`.'], solution: 'ss <- summary(aov(weight ~ group, data = PlantGrowth))[[1]][["Sum Sq"]]\neta_sq <- ss[1] / sum(ss)' },
      { title: 'Adjust p-values', task: 'Given `p <- c(0.01, 0.02, 0.04)` compute `p_bonf` with a Bonferroni adjustment and `n_sig` (how many stay below 0.05).', starter: 'p <- c(0.01, 0.02, 0.04)\np_bonf <- \nn_sig <- \n', harness: r`check(isTRUE(all.equal(p_bonf, c(0.03, 0.06, 0.12))) && n_sig == 1, "Bonferroni multiplies by the number of tests (capped at 1)")`, hints: ['`p.adjust(p, method = "bonferroni")` and `sum(p_bonf < 0.05)`.'], solution: 'p <- c(0.01, 0.02, 0.04)\np_bonf <- p.adjust(p, method = "bonferroni")\nn_sig <- sum(p_bonf < 0.05)' },
    ],
    'r-glm': [
      { title: 'Logistic function', task: 'Write `inv_logit(x)` (the logistic function `1 / (1 + exp(-x))`) and `logit(p)` (its inverse, `log(p / (1 - p))`).', starter: 'inv_logit <- function(x) {\n  \n}\n\nlogit <- function(p) {\n  \n}\n', harness: r`check(isTRUE(all.equal(inv_logit(0), 0.5)) && isTRUE(all.equal(logit(0.5), 0)) && isTRUE(all.equal(logit(inv_logit(1.3)), 1.3)) && isTRUE(all.equal(inv_logit(c(-Inf, Inf)), c(0, 1))), "inv_logit/logit wrong")`, hints: ['Both are one-liners.'], solution: 'inv_logit <- function(x) 1 / (1 + exp(-x))\n\nlogit <- function(p) log(p / (1 - p))' },
      { title: 'Confusion matrix', task: 'With the logistic model for `am ~ wt` write `conf_matrix <- table(predicted = ..., actual = ...)` using a 0.5 cut-off.', starter: 'fit <- glm(am ~ wt, data = mtcars, family = binomial)\nconf_matrix <- \n', harness: r`
check(identical(dim(conf_matrix), c(2L, 2L)) && sum(diag(conf_matrix)) == 29 && sum(conf_matrix) == 32, "29 of 32 cars should be classified correctly")
check(identical(names(dimnames(conf_matrix)), c("predicted", "actual")), "name the dimensions predicted and actual")
`, hints: ['`table(predicted = as.integer(fitted(fit) > 0.5), actual = mtcars$am)`'], solution: 'fit <- glm(am ~ wt, data = mtcars, family = binomial)\nconf_matrix <- table(predicted = as.integer(fitted(fit) > 0.5), actual = mtcars$am)' },
      { title: 'Poisson rate ratio', task: 'Fit the Poisson model of `count` by `spray` and store in `rate_ratio_C` the rate of spray `C` **relative to** spray `A` (an exp of a coefficient; a plain number).', starter: 'rate_ratio_C <- \n', harness: r`check(isTRUE(all.equal(rate_ratio_C, mean(InsectSprays$count[InsectSprays$spray == "C"]) / mean(InsectSprays$count[InsectSprays$spray == "A"]))) && is.null(names(rate_ratio_C)), "the rate ratio of C to A equals the ratio of their mean counts (about 0.144)")`, hints: ['`exp(coef(glm(count ~ spray, InsectSprays, poisson))[["sprayC"]])`'], solution: 'rate_ratio_C <- exp(coef(glm(count ~ spray, data = InsectSprays, family = poisson))[["sprayC"]])' },
    ],
    'r-optim': [
      { title: 'Quadratic root', task: 'Write `solve_quad(a, b, c)` returning the **larger** real root of `a x^2 + b x + c` using `uniroot` over a sensible interval. (Assume real roots exist.)', starter: 'solve_quad <- function(a, b, c) {\n  \n}\n', harness: r`
check(abs(solve_quad(1, -3, 2) - 2) < 1e-4 && abs(solve_quad(1, 0, -9) - 3) < 1e-4 && abs(solve_quad(2, -4, -6) - 3) < 1e-4, "solve_quad should find the larger root")
`, hints: ['The vertex is at `-b/(2a)`; the larger root lies to its right (for a > 0). Search from the vertex to a big value.'], solution: 'solve_quad <- function(a, b, c) {\n  f <- function(x) a * x^2 + b * x + c\n  v <- -b / (2 * a)\n  uniroot(f, c(v, v + 1000), tol = 1e-10, extendInt = "yes")$root\n}' },
      { title: 'Expected value', task: 'Compute `e_exp`: the mean of an exponential distribution with rate 2 by integrating `x * dexp(x, 2)` from 0 to infinity.', starter: 'e_exp <- \n', harness: r`check(abs(e_exp - 0.5) < 1e-6, "the mean of Exp(2) is 0.5")`, hints: ['`integrate(function(x) x * dexp(x, 2), 0, Inf)$value`'], solution: 'e_exp <- integrate(function(x) x * dexp(x, 2), 0, Inf)$value' },
      { title: 'Fit a line by optim', task: 'Write `fit_line(x, y)` returning `c(intercept, slope)` by minimising the sum of squared errors with `optim` (BFGS). It should match `lm`.', starter: 'fit_line <- function(x, y) {\n  \n}\n', harness: r`
x <- c(1, 2, 3, 4, 5); y <- c(2.1, 3.9, 6.2, 7.8, 10.1)
est <- fit_line(x, y)
check(length(est) == 2 && all(abs(est - unname(coef(lm(y ~ x)))) < 1e-3), paste("fit_line gave", paste(round(est, 4), collapse = ", ")))
`, hints: ['`sse <- function(p) sum((y - (p[1] + p[2] * x))^2)`; `optim(c(0, 0), sse, method = "BFGS")$par`.'], solution: 'fit_line <- function(x, y) {\n  sse <- function(p) sum((y - (p[1] + p[2] * x))^2)\n  optim(c(0, 0), sse, method = "BFGS", control = list(reltol = 1e-14))$par\n}' },
    ],
    'r-perf': [
      { title: 'Which are big?', task: 'Write `which_big(x, t)` returning the **positions** of values above `t`, vectorised.', starter: 'which_big <- function(x, t) {\n  \n}\n', harness: r`check(identical(which_big(c(1, 9, 3, 7), 5), c(2L, 4L)) && length(which_big(1:3, 10)) == 0, "which_big wrong")`, hints: ['`which(x > t)`'], solution: 'which_big <- function(x, t) {\n  which(x > t)\n}' },
      { title: 'Running maximum', task: 'Write `running_max(x)` returning the running (cumulative) maximum without a loop.', starter: 'running_max <- function(x) {\n  \n}\n', harness: r`
check(identical(running_max(c(1, 3, 2, 5, 4)), c(1, 3, 3, 5, 5)) && !any(grepl("\\bfor\\b|\\bwhile\\b", deparse(running_max))), "running_max wrong / uses a loop")
`, hints: ['`cummax(x)`'], solution: 'running_max <- function(x) {\n  cummax(x)\n}' },
      { title: 'Show the expression', task: 'Write `show_expr(expr)` returning the typed expression as a string **and** its value: a list `list(text = "...", value = ...)` where the expression is evaluated once.', starter: 'show_expr <- function(expr) {\n  \n}\n', harness: r`
out <- show_expr(2 * 3 + 1)
check(identical(out$text, "2 * 3 + 1") && out$value == 7, "show_expr should give the text and the value")
`, hints: ['`list(text = deparse(substitute(expr)), value = expr)`'], solution: 'show_expr <- function(expr) {\n  list(text = deparse(substitute(expr)), value = expr)\n}' },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
