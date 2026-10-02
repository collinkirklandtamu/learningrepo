const test = require('node:test');
const assert = require('node:assert');
const LP = require('./helpers.js');

const DAY = 86400000;
function mk(start) {
  let t = start || Date.UTC(2026, 0, 10, 12);
  const mem = {};
  const storage = { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = v; } };
  const store = LP.createStore(storage, { now: () => t, rng: () => 0.5 });
  return { store, storage, mem, advance: (ms) => { t += ms; }, now: () => t };
}
const py = LP.course('python');
const lesson = py.lessons[0];

test('perfect first-try lesson earns +25% XP, 3 stars and skill points', () => {
  const { store } = mk();
  const out = store.completeLesson(lesson, py, { fails: 0, hints: 0 });
  assert.strictEqual(out.xp, Math.round(lesson.xp * 1.25));
  assert.strictEqual(out.stars, 3);
  assert.ok(out.perfect);
  assert.strictEqual(store.state.skills['python:Basics'], 3 * lesson.diff);
});
test('failed submits and hints reduce XP (floor of 40%)', () => {
  const { store } = mk();
  assert.strictEqual(store.completeLesson(lesson, py, { fails: 2, hints: 1 }).xp, Math.round(lesson.xp * (1 - 0.3 - 0.1)));
  const b = mk();
  assert.strictEqual(b.store.completeLesson(lesson, py, { fails: 20, hints: 5 }).xp, Math.round(lesson.xp * 0.4));
});
test('revealing the solution earns no XP but still completes the lesson', () => {
  const { store } = mk();
  const out = store.completeLesson(lesson, py, { revealed: true });
  assert.strictEqual(out.xp, 0);
  assert.strictEqual(out.stars, 0);
  assert.ok(store.isDone(lesson.id));
});
test('replaying a finished lesson gives no extra XP', () => {
  const { store } = mk();
  store.completeLesson(lesson, py, {});
  const xp = store.state.xp;
  const again = store.completeLesson(lesson, py, {});
  assert.strictEqual(again.first, false);
  assert.strictEqual(store.state.xp, xp);
});
test('levels follow the XP curve and level-ups are reported', () => {
  const { store } = mk();
  assert.strictEqual(store.level(), 1);
  assert.strictEqual(store.addXp(40), 2);
  assert.strictEqual(store.addXp(1), 0);
  assert.strictEqual(LP.levelOf(160), 3);
  assert.strictEqual(LP.xpForLevel(3), 160);
});
test('streak counts consecutive days, resets after a gap, and tracks the best', () => {
  const m = mk();
  m.store.addXp(5);
  assert.strictEqual(m.store.streakNow(), 1);
  m.advance(DAY); m.store.addXp(5);
  m.advance(DAY); m.store.addXp(5);
  assert.strictEqual(m.store.streakNow(), 3);
  m.advance(3 * DAY);
  assert.strictEqual(m.store.streakNow(), 0, 'streak is broken after skipping days');
  m.store.addXp(5);
  assert.strictEqual(m.store.state.streak.count, 1);
  assert.strictEqual(m.store.state.streak.best, 3);
});
test('daily XP resets on a new day', () => {
  const m = mk();
  m.store.addXp(30);
  assert.strictEqual(m.store.today().xp, 30);
  m.advance(DAY);
  assert.strictEqual(m.store.today().xp, 0);
});
test('completing a lesson plants spaced-repetition cards due in a day', () => {
  const m = mk();
  m.store.completeLesson(lesson, py, {});
  assert.strictEqual(m.store.allCards().length, lesson.recall.length);
  assert.strictEqual(m.store.dueCards().length, 0);
  m.advance(DAY + 1000);
  assert.strictEqual(m.store.dueCards().length, lesson.recall.length);
});
test('Leitner boxes: correct promotes with growing intervals, wrong resets to box 1', () => {
  const m = mk();
  m.store.completeLesson(lesson, py, {});
  const id = m.store.allCards()[0];
  m.advance(2 * DAY);
  let r = m.store.answerCard(id, true, 0, false);
  assert.strictEqual(r.box, 2);
  assert.strictEqual(r.nextDays, 2);
  m.advance(3 * DAY);
  r = m.store.answerCard(id, true, 1, false);
  assert.strictEqual(r.box, 3);
  assert.strictEqual(r.nextDays, 4);
  m.advance(5 * DAY);
  r = m.store.answerCard(id, false, 2, false);
  assert.strictEqual(r.box, 1);
  assert.strictEqual(m.store.state.srs[id].lapses, 1);
  assert.strictEqual(m.store.dueCards().includes(id), false, 'lapsed card returns after ~10 minutes, not instantly');
  m.advance(11 * 60000);
  assert.ok(m.store.dueCards().includes(id));
});
test('review combo raises XP, criticals double it, practice mode is worth 1 XP', () => {
  const m = mk();
  m.store.completeLesson(lesson, py, {});
  const id = m.store.allCards()[0];
  m.advance(2 * DAY);
  const before = m.store.state.xp;
  assert.strictEqual(m.store.answerCard(id, true, 0, false).xp, 3);
  assert.strictEqual(m.store.answerCard(id, true, 5, false).xp, 8);
  assert.strictEqual(m.store.answerCard(id, true, 50, false).xp, 11, 'combo bonus caps at +8');
  assert.strictEqual(m.store.answerCard(id, true, 0, true).xp, 1);
  assert.strictEqual(m.store.state.xp, before + 3 + 8 + 11 + 1);
  const crit = LP.createStore(null, { now: () => 0, rng: () => 0.01 });
  crit.completeLesson(lesson, py, {});
  const cid = crit.allCards()[0];
  const r = crit.answerCard(cid, true, 0, false);
  assert.ok(r.crit);
  assert.strictEqual(r.xp, 6);
});
test('skills level up and go rusty when their cards are long overdue', () => {
  const m = mk();
  m.store.addSkill('python', 'Basics', 4);
  assert.strictEqual(m.store.skillInfo('python', 'Basics').name, 'Apprentice');
  m.store.completeLesson(lesson, py, {});
  m.advance(10 * DAY);
  assert.ok(m.store.skillInfo('python', 'Basics').rusty >= 1);
});
test('recall answer: correct skips to box 2 with a bonus; wrong is due right away', () => {
  const m = mk();
  m.store.completeLesson(lesson, py, {});
  const [a, b] = m.store.allCards();
  const xp = m.store.state.xp;
  assert.strictEqual(m.store.answerRecall(a, true).xp, 5);
  assert.strictEqual(m.store.state.xp, xp + 5);
  assert.strictEqual(m.store.state.srs[a].box, 2);
  m.store.answerRecall(b, false);
  assert.ok(m.store.dueCards().includes(b));
});
test('badges unlock once and persist; export/import/reset round-trip', () => {
  const m = mk();
  const out = m.store.completeLesson(lesson, py, {});
  assert.ok(out.badges.some((b) => b.id === 'first'));
  assert.strictEqual(m.store.completeLesson(py.lessons[1], py, {}).badges.some((b) => b.id === 'first'), false);
  const dump = m.store.export();
  const m2 = mk();
  m2.store.import(dump);
  assert.strictEqual(m2.store.state.xp, m.store.state.xp);
  assert.throws(() => m2.store.import('{"v":2}'));
  m2.store.reset();
  assert.strictEqual(m2.store.state.xp, 0);
});
test('state persists through storage and survives corrupt data', () => {
  const m = mk();
  m.store.completeLesson(lesson, py, {});
  const again = LP.createStore(m.storage, { now: m.now });
  assert.strictEqual(again.state.xp, m.store.state.xp);
  const broken = LP.createStore({ getItem: () => '{not json', setItem() {} });
  assert.strictEqual(broken.state.xp, 0);
  const nostore = LP.createStore(null);
  nostore.addXp(3);
  assert.strictEqual(nostore.state.xp, 3);
});
test('answer matching is forgiving about case, quotes and trailing periods', () => {
  const q = { type: 'type', accept: ['git init'] };
  for (const a of ['git init', 'Git Init', '  git   init ', '`git init`', 'git init.']) assert.ok(LP.checkAnswer(q, a), a);
  assert.ok(!LP.checkAnswer(q, 'git status'));
  assert.ok(LP.checkAnswer({ type: 'choice', answer: 2 }, 2));
});
test('every lesson has the fields the UI relies on', () => {
  const ids = new Set();
  for (const c of LP.courses) {
    assert.ok(c.skills.length && c.color && c.icon);
    for (const l of c.lessons) {
      assert.ok(!ids.has(l.id), 'duplicate id ' + l.id); ids.add(l.id);
      assert.ok(c.skills.includes(l.skill), `${l.id}: skill "${l.skill}" is not declared on the course`);
      assert.ok(l.read && l.task && l.hints && l.hints.length >= 2, `${l.id}: needs reading, task and 2+ hints`);
      assert.ok(l.recall && l.recall.length >= 1, `${l.id}: needs recall questions`);
      for (const q of l.recall) {
        if (q.type === 'choice') { assert.ok(q.options.length >= 3 && q.answer >= 0 && q.answer < q.options.length, `${l.id}: bad choice question`); }
        else { assert.ok(q.accept && q.accept.length, `${l.id}: type question needs accept[]`); }
        assert.ok(q.why, `${l.id}: every question explains its answer`);
      }
      const kind = LP.kindOf(l, c);
      if (kind === 'code') assert.ok(l.harness && typeof l.solution === 'string' && l.starter !== undefined);
      else assert.ok(l.checks && l.checks.length && l.solution, `${l.id}: checks + solution required`);
    }
  }
});
