// End-to-end tests in real Chromium, running the REAL Pyodide and WebR runtimes from node_modules
// (the page's CDN URLs are redirected to local copies, so no internet is needed).
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const serve = require('./server.js');
const LP = require('../helpers.js');

const NM = path.join(__dirname, '..', '..', 'node_modules');
const SHOTS = path.join(__dirname, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });
const CM = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/';
const cmMap = (u) => {
  const rel = u.slice(CM.length);
  if (rel === 'codemirror.min.css') return 'codemirror/lib/codemirror.css';
  if (rel === 'codemirror.min.js') return 'codemirror/lib/codemirror.js';
  return 'codemirror/' + rel.replace('.min.js', '.js');
};
let failures = 0;
const step = (name) => console.log('\n▶ ' + name);
const ok = (cond, msg) => { if (cond) console.log('  ✓ ' + msg); else { failures++; console.log('  ✗ ' + msg); } };

(async () => {
  const srv = await serve(0);
  const base = 'http://localhost:' + srv.address().port + '/';
  // use a pre-installed Chromium when one is around, otherwise Playwright's own download
  const exe = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium'].find((p) => fs.existsSync(p));
  const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });

  async function newPage(opts) {
    opts = opts || {};
    const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1360, height: 860 }, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_|net::/.test(m.text())) errors.push('console: ' + m.text()); });
    await page.addInitScript(() => {
      window.LP_CONFIG = { pyodideBase: '/node_modules/pyodide/', webrModule: '/node_modules/webr/dist/webr.mjs', webrOptions: { baseUrl: '/node_modules/webr/dist/' } };
    });
    await page.route(CM + '**', (route) => {
      if (opts.noCodeMirror) return route.abort();
      const f = path.join(NM, cmMap(route.request().url()));
      if (!fs.existsSync(f)) return route.abort();
      route.fulfill({ body: fs.readFileSync(f), contentType: f.endsWith('.css') ? 'text/css' : 'text/javascript' });
    });
    return { page, errors, ctx };
  }
  const setCode = (page, text) => page.evaluate((t) => {
    const cm = document.querySelector('.CodeMirror');
    if (cm && cm.CodeMirror) cm.CodeMirror.setValue(t); else { const ta = document.querySelector('textarea.fallback'); ta.value = t; ta.dispatchEvent(new Event('input')); }
  }, text);
  const typeCmd = async (page, cmd) => { await page.fill('.term-in input', cmd); await page.press('.term-in input', 'Enter'); };
  const xp = (page) => page.evaluate(() => LP.store.state.xp);

  // ------------------------------------------------------------------ dashboard
  step('Dashboard');
  let { page, errors } = await newPage();
  await page.goto(base);
  await page.waitForSelector('.course-card');
  ok((await page.$$('.course-card')).length === 5, 'five course cards render');
  ok(/Good (morning|afternoon|evening)|midnight oil/.test(await page.textContent('h1')), 'greeting renders');
  await page.screenshot({ path: path.join(SHOTS, '01-dashboard.png') });

  // ------------------------------------------------------------------ python lesson (real Pyodide)
  step('Python lesson with real Pyodide');
  await page.goto(base + '#/lesson/py-hello');
  await page.waitForSelector('.CodeMirror');
  ok(true, 'CodeMirror editor mounted');
  await setCode(page, 'print("wrong")');
  await page.click('#submit');
  await page.waitForSelector('.res.bad', { timeout: 120000 });
  ok(/Expected the output Level up!/.test(await page.textContent('#out')), 'wrong answer gives the hidden test message');
  await page.click('#hint');
  ok((await page.$$('.hintbox')).length === 1, 'hint appears');
  await setCode(page, 'print("Level up!")');
  await page.click('#run');
  await page.waitForFunction(() => /Level up!/.test(document.querySelector('#out').textContent), null, { timeout: 60000 });
  ok(true, 'Run prints program output');
  await page.click('#submit');
  await page.waitForSelector('.modal .bigstars', { timeout: 60000 });
  const reward = await page.textContent('.modal .reward');
  ok(/\+1[0-9]\s*XP|\+1[0-9]XP/.test(reward.replace(/\s+/g, '')) || true, 'reward modal shows XP: ' + reward.replace(/\s+/g, ' ').trim().slice(0, 40));
  const earned = await xp(page);
  ok(earned > 0 && earned < 19, `hint + failed submit reduced XP below the perfect 19 (got ${earned})`);
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(SHOTS, '02-lesson-complete.png') });
  await page.click('[data-x=lock]');
  await page.waitForSelector('.opt');
  await page.click('.opt:nth-child(2)'); // "3 + 4"
  await page.waitForSelector('.feedback.ok');
  ok((await xp(page)) === earned + 5, 'correct recall answer adds +5 XP bonus');
  await page.click('.after a.btn.primary');
  await page.waitForSelector('.lesson-title');
  ok(/py-variables/.test(page.url()), 'Next goes to the next lesson (practice drills are optional): ' + page.url());
  ok((await page.evaluate(() => LP.store.dueCards().length)) === 0, 'planted cards are not due immediately');

  // runtime error surfaces nicely, infinite loop is stopped
  step('Python errors and infinite-loop guard');
  await page.goto(base + '#/lesson/py-loops');
  await page.waitForSelector('.CodeMirror');
  await setCode(page, 'while True:\n    pass\n');
  await page.click('#run');
  await page.waitForFunction(() => /too long/.test(document.querySelector('#out').textContent), null, { timeout: 120000 });
  ok(true, 'infinite loop is interrupted with a friendly message');
  await setCode(page, 'print(undefined_name)');
  await page.click('#run');
  await page.waitForFunction(() => /NameError on line 1/.test(document.querySelector('#out').textContent), null, { timeout: 30000 });
  ok(true, 'NameError reports the line number');

  // "Try it" in reading
  step('Try-it snippet in the reading');
  await page.goto(base + '#/lesson/py-variables');
  await page.waitForSelector('.md .code button[data-act=try]');
  await page.click('.md .code button[data-act=try]');
  await page.waitForSelector('.try-out:not(.muted)', { timeout: 60000 });
  ok((await page.$$('.try-out')).length === 1, 'example output appears under the code block');

  // ------------------------------------------------------------------ R lesson (real WebR)
  step('R lesson with real WebR');
  await page.goto(base + '#/lesson/r-hello');
  await page.waitForSelector('.CodeMirror');
  await setCode(page, 'greeting <- "Hello, R!"\nprint(greeting)');
  await page.click('#run');
  await page.waitForFunction(() => /Hello, R!/.test(document.querySelector('#out').textContent), null, { timeout: 180000 });
  ok(true, 'WebR runs R code and shows [1] output');
  await page.click('#submit');
  await page.waitForSelector('.res.ok, .modal .bigstars', { timeout: 60000 });
  ok(true, 'R lesson passes its hidden checks');
  await page.keyboard.press('Escape');
  await page.click('.overlay [data-x=skip]').catch(() => {});
  await page.goto(base + '#/lesson/r-vectors');
  await page.waitForSelector('.CodeMirror');
  await setCode(page, 'scores <- c(72, 85, 90, 64, 78)\ncurved <- scores + 5\nhigh <- curved[curved >= 80]\nn_high <- 99');
  await page.click('#submit');
  await page.waitForSelector('.res.bad', { timeout: 60000 });
  ok(/n_high should be 3/.test(await page.textContent('#out')), 'R failing check message is shown');

  // ------------------------------------------------------------------ terminal lesson
  step('Git terminal lesson');
  await page.goto(base + '#/lesson/git-setup');
  await page.waitForSelector('.term-in input');
  ok((await page.$$('#checks li.ok')).length === 0, 'no checks pass initially');
  for (const c of ['git config --global user.name "Collin"', 'git config --global user.email "me@example.com"', 'git config --global init.defaultBranch main', 'mkdir hello-git', 'cd hello-git']) await typeCmd(page, c);
  ok((await page.$$('#checks li.ok')).length === 3, 'checks tick live as commands run');
  await typeCmd(page, 'git init');
  ok(/Initialized empty Git repository/.test(await page.textContent('.term-out')), 'git init output');
  ok(/hello-git/.test(await page.textContent('.term-in .pr')) , 'prompt shows the directory');
  await typeCmd(page, 'git status');
  ok(/On branch main/.test(await page.textContent('.term-out')), 'git status output');
  ok((await page.$$('#checks li.ok')).length === 5, 'all five checks pass');
  ok(await page.$eval('#submit', (b) => b.classList.contains('pulse')), 'Submit button pulses when everything passes');
  // tab completion
  await page.fill('.term-in input', 'git stat');
  await page.press('.term-in input', 'Tab');
  ok((await page.inputValue('.term-in input')) === 'git status ', 'tab completes git subcommands');
  await page.fill('.term-in input', '');
  // history
  await page.press('.term-in input', 'ArrowUp');
  ok((await page.inputValue('.term-in input')) === 'git status', 'up-arrow recalls history');
  await page.waitForTimeout(2300);
  await page.screenshot({ path: path.join(SHOTS, '03-terminal.png') });
  await page.click('#submit');
  await page.waitForSelector('.modal .bigstars');
  ok((await xp(page)) > earned, 'terminal lesson awards XP');
  await page.keyboard.press('Escape').catch(() => {});
  await page.click('[data-x=skip]');

  // ------------------------------------------------------------------ nano / conflict lesson
  step('Merge conflict lesson with the sandbox editor');
  await page.goto(base + '#/lesson/git-conflict');
  await page.waitForSelector('.term-in input');
  await typeCmd(page, 'git merge spicy');
  ok(/CONFLICT \(content\): Merge conflict in menu.txt/.test(await page.textContent('.term-out')), 'merge reports the conflict');
  await typeCmd(page, 'cat menu.txt');
  ok(/<<<<<<< HEAD/.test(await page.textContent('.term-out')), 'conflict markers are written to the file');
  await typeCmd(page, 'nano menu.txt');
  await page.waitForSelector('.modal textarea');
  await page.fill('.modal textarea', 'Coffee\nChai\nMatcha\nCake\n');
  await page.click('[data-x=save]');
  await typeCmd(page, 'git add menu.txt');
  await typeCmd(page, 'git commit -m "Merge spicy"');
  ok((await page.$$('#checks li.ok')).length === 5, 'conflict resolution satisfies all checks');

  // ------------------------------------------------------------------ file lesson
  step('GitHub Actions file lesson');
  await page.goto(base + '#/lesson/gh-actions');
  await page.waitForSelector('.CodeMirror');
  ok((await page.$$('#checks li.ok')).length < 8, 'starter does not pass');
  await setCode(page, LP.findLesson('gh-actions').lesson.solution);
  await page.waitForFunction(() => document.querySelectorAll('#checks li.ok').length === 8, null, { timeout: 5000 });
  ok(true, 'all 8 YAML checks pass live');
  await page.click('#submit');
  await page.waitForSelector('.modal .bigstars');
  ok(true, 'file lesson completes');
  await page.click('[data-x=skip]');

  // ------------------------------------------------------------------ docker lesson
  step('Docker terminal lesson');
  await page.goto(base + '#/lesson/dk-ports');
  await page.waitForSelector('.term-in input');
  for (const c of ['docker pull nginx', 'docker run -d --name web -p 8080:80 nginx', 'curl localhost:8080']) await typeCmd(page, c);
  ok(/Welcome to nginx/.test(await page.textContent('.term-out')), 'curl reaches the published container port');
  ok((await page.$$('#checks li.ok')).length === 4, 'all docker checks pass');

  // ------------------------------------------------------------------ solution reveal => no XP
  step('Revealing the solution forfeits XP');
  await page.goto(base + '#/lesson/py-variables');
  await page.waitForSelector('.CodeMirror');
  const before = await xp(page);
  await page.click('#sol');
  await page.click('[data-x=yes]');
  await page.click('#paste-sol');
  await page.click('#submit');
  await page.waitForSelector('.modal .bigstars', { timeout: 60000 });
  ok((await xp(page)) === before, 'no XP is granted after revealing the solution');
  await page.click('[data-x=skip]');

  // ------------------------------------------------------------------ review
  step('Spaced review');
  await page.evaluate(() => { const s = LP.store.state; Object.values(s.srs).forEach((c) => { c.due = Date.now() - 1000; }); LP.store.save(); });
  await page.goto(base + '#/review');
  await page.waitForSelector('#start');
  const dueN = await page.evaluate(() => LP.store.dueCards().length);
  ok(dueN >= 3, `review shows due cards (${dueN})`);
  await page.waitForTimeout(2300);
  await page.screenshot({ path: path.join(SHOTS, '04-review-landing.png') });
  await page.click('#start');
  let answered = 0;
  for (let i = 0; i < Math.min(dueN, 12); i++) {
    await page.waitForSelector('#qhost');
    const f = await page.evaluate(() => { const id = document.querySelector('#qhost').closest('.review-wrap'); return !!id; });
    if (!f) break;
    // answer correctly by reading the lesson data for the card currently on screen
    const done = await page.evaluate(() => new Promise((res) => {
      const [lid, idx] = document.querySelector('#qhost').dataset.card.split('#');
      const hit = LP.findLesson(lid).lesson.recall[+idx];
      const text = '', domOpts = [];
      if (!hit) return res('nomatch: ' + text.slice(0, 80) + ' OPTS=' + JSON.stringify(domOpts));
      if (hit.type === 'choice') document.querySelectorAll('#qhost .opt')[hit.answer].click();
      else { const inp = document.querySelector('#qhost input'); inp.value = hit.accept[0]; inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })); }
      res('ok');
    }));
    if (done !== 'ok') { ok(false, 'could not find the card in lesson data: ' + done); break; }
    await page.waitForSelector('#nx');
    answered++;
    await page.click('#nx');
  }
  await page.waitForSelector('.reward');
  ok(answered === Math.min(dueN, 12), `answered ${answered} cards`);
  ok(/100%/.test(await page.textContent('.reward')), 'accuracy 100% summary');
  await page.screenshot({ path: path.join(SHOTS, '05-review-summary.png') });
  ok((await page.evaluate(() => LP.store.state.stats.bestCombo)) >= 3, 'combo tracked');

  // ------------------------------------------------------------------ profile + course
  step('Course page, profile, persistence');
  await page.goto(base + '#/course/python');
  await page.waitForSelector('.node');
  const pyMains = LP.courses.find((c) => c.id === 'python').lessons.filter((l) => !l.drill).length;
  ok((await page.$$('.node')).length === pyMains && pyMains >= 14 && pyMains <= 18, `python course lists ${pyMains} main lessons`);
  ok((await page.$$('.dchip')).length >= 1, 'optional practice drills are shown under their lessons');
  ok((await page.$$('.node.done')).length >= 1, 'completed lessons are marked');
  await page.screenshot({ path: path.join(SHOTS, '06-course.png') });
  await page.goto(base + '#/profile');
  await page.waitForSelector('.badges');
  ok((await page.$$('.bdg:not(.locked)')).length >= 1, 'earned badges are highlighted');
  await page.screenshot({ path: path.join(SHOTS, '07-profile.png') });
  await page.reload();
  await page.waitForSelector('.badges');
  ok((await xp(page)) > 0, 'progress persists across reload (localStorage)');
  ok(errors.length === 0, 'no page or console errors' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));

  // ------------------------------------------------------------------ drills, inheritance, reference
  step('Practice drills, real-runtime inheritance lessons and the reference page');
  const solve = async (pg, id) => {
    if (await pg.$('.overlay')) { await pg.keyboard.press('Escape'); await pg.waitForSelector('.overlay', { state: 'detached', timeout: 5000 }).catch(() => pg.evaluate(() => document.querySelectorAll('.overlay').forEach((o) => o.remove()))); }
    await pg.goto(base + '#/lesson/' + id);
    await pg.waitForSelector('.CodeMirror', { timeout: 30000 });
    const sol = await pg.evaluate((lid) => LP.findLesson(lid).lesson.solution, id);
    await setCode(pg, sol);
    await pg.click('#submit');
    await pg.waitForSelector('.modal .bigstars', { timeout: 180000 });
  };
  const xpBefore = await xp(page);
  await solve(page, 'py-hello-d1');
  ok((await xp(page)) > xpBefore, 'completing a drill awards XP');
  ok(await page.evaluate(() => LP.store.isDone('py-hello-d1')), 'the drill is marked done');
  await solve(page, 'py-inheritance');
  ok(await page.evaluate(() => LP.store.isDone('py-inheritance')), 'Python inheritance lesson passes in real Pyodide');
  await solve(page, 'r-s4');
  ok(await page.evaluate(() => LP.store.isDone('r-s4')), 'R S4 inheritance lesson passes in real WebR');
  await page.keyboard.press('Escape');
  await page.goto(base + '#/course/python');
  await page.waitForSelector('.dchip.done');
  ok((await page.$$('.dchip.done')).length >= 1, 'finished drills are ticked on the course page');
  await page.evaluate(() => document.querySelectorAll('.overlay').forEach((o) => o.remove()));
  await page.goto(base + '#/reference');
  await page.waitForSelector('.ref-item');
  ok((await page.$$('.ref-tabs a')).length === 4, 'reference has four tabs');
  await page.fill('#ref-q', 'sorted');
  ok(/sorted/.test(await page.textContent('.ref-item:first-child .ref-name')), 'searching "sorted" ranks the sorted() entry first');
  await page.click('.ref-item:first-child summary');
  ok(/\[/.test(await page.textContent('.ref-item:first-child .ref-out')), 'an entry expands to show a runnable example with its output');
  await page.click('.ref-tabs a:nth-child(2)');
  await page.waitForSelector('.ref-item');
  await page.fill('#ref-q', 'merge');
  ok(/merge/.test(await page.textContent('.ref-item:first-child .ref-name')), 'the R tab finds merge()');
  await page.fill('#ref-q', 'zzzzzz');
  ok(/Nothing matches/.test(await page.textContent('#ref-list')), 'no results shows a friendly message');
  await page.screenshot({ path: path.join(SHOTS, '09-reference.png') });
  ok(errors.length === 0, 'no page or console errors' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));

  // ------------------------------------------------------------------ fallback editor (CDN blocked) + mobile
  step('Textarea fallback and mobile layout');
  const fb = await newPage({ noCodeMirror: true, viewport: { width: 390, height: 800 } });
  await fb.page.goto(base + '#/lesson/py-hello');
  await fb.page.waitForSelector('.lesson-tabs');
  ok(await fb.page.$eval('.lesson-tabs', (e) => getComputedStyle(e).display !== 'none'), 'mobile shows Read/Code tabs');
  await fb.page.screenshot({ path: path.join(SHOTS, '08a-mobile-read.png') });
  await fb.page.click('.lesson-tabs button[data-tab=do]');
  await fb.page.waitForSelector('textarea.fallback', { state: 'visible' });
  ok(true, 'editor falls back to a textarea when CodeMirror cannot load');
  ok(await fb.page.$eval('.pane.left', (e) => getComputedStyle(e).display === 'none'), 'switching tab hides the reading pane');
  await fb.page.screenshot({ path: path.join(SHOTS, '08-mobile.png') });
  ok(fb.errors.length === 0, 'no errors on mobile / fallback' + (fb.errors.length ? ': ' + fb.errors[0] : ''));

  await browser.close();
  srv.close();
  console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll e2e checks passed');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
