/* Progress + reinforcement engine.
 *
 *  XP            – rewards finishing lessons; scaled by how cleanly you did it
 *                  (first try / no hints => perfect bonus; failures & hints cost XP).
 *  Skill points  – per-skill mastery. Earned on lessons and again on every
 *                  correct review answer, so skills only stay "hot" if you use them.
 *  Spaced review – every lesson plants recall cards in a Leitner box system.
 *                  Right answers push a card to a longer interval, wrong answers
 *                  send it back to box 1. Overdue cards mark a skill as "rusty".
 *  Combos        – consecutive correct review answers multiply the reward, with a
 *                  small chance of a critical hit, i.e. a variable reward schedule.
 */
(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  const DAY = 86400000;
  const KEY = 'learnplatform.v1';
  const INTERVALS = [0, 1, 2, 4, 8, 16, 32]; // days per Leitner box
  const SKILL_LEVELS = [
    { name: 'Novice', at: 0 }, { name: 'Apprentice', at: 4 }, { name: 'Adept', at: 10 },
    { name: 'Expert', at: 20 }, { name: 'Master', at: 35 },
  ];
  const TITLES = ['Rookie', 'Tinkerer', 'Scripter', 'Builder', 'Hacker', 'Engineer', 'Architect', 'Wizard', 'Legend'];

  const BADGES = [
    { id: 'first', icon: '🚀', name: 'Liftoff', desc: 'Complete your first lesson', test: (s) => doneCount(s) >= 1 },
    { id: 'five', icon: '🔥', name: 'On a roll', desc: 'Complete 5 lessons', test: (s) => doneCount(s) >= 5 },
    { id: 'twenty', icon: '🏔️', name: 'Summit', desc: 'Complete 20 lessons', test: (s) => doneCount(s) >= 20 },
    { id: 'perfect3', icon: '🎯', name: 'Sharpshooter', desc: '3 perfect lessons (first try, no hints)', test: (s) => Object.values(s.lessons).filter((l) => l.perfect && !l.drill).length >= 3 },
    { id: 'perfect10', icon: '💎', name: 'Flawless', desc: '10 perfect lessons', test: (s) => Object.values(s.lessons).filter((l) => l.perfect && !l.drill).length >= 10 },
    { id: 'streak3', icon: '📅', name: 'Habit forming', desc: '3-day streak', test: (s) => s.streak.best >= 3 },
    { id: 'streak7', icon: '🗓️', name: 'Week warrior', desc: '7-day streak', test: (s) => s.streak.best >= 7 },
    { id: 'poly', icon: '🌐', name: 'Polyglot', desc: 'Complete lessons in 3 different courses', test: (s) => new Set(Object.values(s.lessons).filter((l) => l.done).map((l) => l.course)).size >= 3 },
    { id: 'combo5', icon: '⚡', name: 'Combo x5', desc: 'Get 5 review answers right in a row', test: (s) => s.stats.bestCombo >= 5 },
    { id: 'review25', icon: '🧠', name: 'Memory palace', desc: 'Answer 25 review cards correctly', test: (s) => s.stats.reviewsCorrect >= 25 },
    { id: 'level5', icon: '⭐', name: 'Level 5', desc: 'Reach level 5', test: (s) => levelOf(s.xp) >= 5 },
    { id: 'level10', icon: '🌟', name: 'Level 10', desc: 'Reach level 10', test: (s) => levelOf(s.xp) >= 10 },
    { id: 'drill25', icon: '🏋️', name: 'Reps', desc: 'Complete 25 practice drills', test: (s) => drillsDone(s) >= 25 },
    { id: 'drill100', icon: '🦾', name: 'Iron discipline', desc: 'Complete 100 practice drills', test: (s) => drillsDone(s) >= 100 },
    { id: 'capstone', icon: '🏗️', name: 'Builder', desc: 'Finish a capstone project', test: (s) => Object.values(s.lessons).some((l) => l.done && l.capstone) },
    { id: 'capstone3', icon: '🏛️', name: 'Architect', desc: 'Finish three capstone projects', test: (s) => Object.values(s.lessons).filter((l) => l.done && l.capstone).length >= 3 },
    { id: 'oop-py', icon: '🧬', name: 'Inheritance (Python)', desc: 'Finish the Python object-oriented arc', test: (s) => arcDone(s, 'oop-python') },
    { id: 'oop-r', icon: '🧬', name: 'Inheritance (R)', desc: 'Finish the R S3 / S4 / Reference-class arc', test: (s) => arcDone(s, 'oop-r') },
    { id: 'master', icon: '👑', name: 'Skill master', desc: 'Master any skill', test: (s) => Object.values(s.skills).some((p) => p >= SKILL_LEVELS[4].at) },
  ];
  const doneCount = (s) => Object.values(s.lessons).filter((l) => l.done && !l.drill).length;
  const drillsDone = (s) => Object.values(s.lessons).filter((l) => l.done && l.drill).length;
  // lessons tagged `arc: 'name'` form a learning arc; the badge needs every one of them
  const arcDone = (s, arc) => {
    const all = ((root.LP && root.LP.courses) || []).flatMap((c) => c.lessons).filter((l) => l.arc === arc);
    return all.length > 0 && all.every((l) => s.lessons[l.id] && s.lessons[l.id].done);
  };
  const levelOf = (xp) => Math.floor(Math.sqrt(xp / 40)) + 1;
  const xpForLevel = (l) => 40 * (l - 1) * (l - 1);
  const dayStr = (t) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

  function fresh() {
    return {
      v: 1, created: Date.now(), xp: 0,
      streak: { count: 0, best: 0, last: null },
      daily: { date: null, xp: 0 },
      lessons: {}, skills: {}, srs: {}, badges: {},
      stats: { reviewsTotal: 0, reviewsCorrect: 0, bestCombo: 0, runs: 0 },
      settings: { name: 'Collin', dailyGoal: 60, fontSize: 15 },
    };
  }

  function createStore(storage, opts) {
    opts = opts || {};
    const now = opts.now || (() => Date.now());
    const rng = opts.rng || Math.random;
    let state = fresh();
    const listeners = [];
    try {
      const raw = storage && storage.getItem(KEY);
      if (raw) state = Object.assign(fresh(), JSON.parse(raw));
      for (const k of ['streak', 'daily', 'stats', 'settings']) state[k] = Object.assign(fresh()[k], state[k]);
    } catch (e) { /* storage unavailable or corrupt: start fresh */ }

    const store = {
      get state() { return state; },
      subscribe(fn) { listeners.push(fn); },
      emit(ev) { listeners.forEach((fn) => fn(ev)); },
      save() { try { storage && storage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } },

      level() { return levelOf(state.xp); },
      levelProgress() {
        const l = levelOf(state.xp), lo = xpForLevel(l), hi = xpForLevel(l + 1);
        return { level: l, into: state.xp - lo, span: hi - lo, pct: (state.xp - lo) / (hi - lo), title: TITLES[Math.min(TITLES.length - 1, Math.floor((l - 1) / 2))] };
      },
      today() { const t = dayStr(now()); if (state.daily.date !== t) state.daily = { date: t, xp: 0 }; return state.daily; },
      streakNow() {
        const s = state.streak;
        if (!s.last) return 0;
        const t = dayStr(now()), y = dayStr(now() - DAY);
        return s.last === t || s.last === y ? s.count : 0;
      },
      touchDay() {
        const t = dayStr(now()), y = dayStr(now() - DAY), s = state.streak;
        if (s.last === t) return false;
        s.count = s.last === y ? s.count + 1 : 1;
        s.last = t;
        s.best = Math.max(s.best, s.count);
        return true;
      },

      lesson(id) { return state.lessons[id] || null; },
      isDone(id) { return !!(state.lessons[id] && state.lessons[id].done); },

      addXp(n) {
        const before = levelOf(state.xp);
        state.xp += n;
        store.today().xp += n;
        store.touchDay();
        const after = levelOf(state.xp);
        return after > before ? after : 0;
      },
      addSkill(courseId, skill, pts) {
        const key = courseId + ':' + skill;
        const before = store.skillInfo(courseId, skill).level;
        state.skills[key] = (state.skills[key] || 0) + pts;
        const after = store.skillInfo(courseId, skill).level;
        return after > before ? SKILL_LEVELS[after].name : null;
      },
      skillInfo(courseId, skill) {
        const pts = state.skills[courseId + ':' + skill] || 0;
        let level = 0;
        SKILL_LEVELS.forEach((l, i) => { if (pts >= l.at) level = i; });
        const next = SKILL_LEVELS[level + 1];
        const cur = SKILL_LEVELS[level];
        return { points: pts, level, name: cur.name, next: next ? next.name : null, toNext: next ? next.at - pts : 0, pct: next ? (pts - cur.at) / (next.at - cur.at) : 1, rusty: store.rustyCount(courseId, skill) };
      },
      rustyCount(courseId, skill) {
        const cutoff = now() - 2 * DAY;
        return Object.values(state.srs).filter((c) => c.course === courseId && c.skill === skill && c.due < cutoff).length;
      },

      /* Award a finished lesson. info: {attempts (failed submits), hints, revealed} */
      completeLesson(lesson, course, info) {
        const rec = state.lessons[lesson.id] || (state.lessons[lesson.id] = { course: course.id, done: false, fails: 0, hints: 0, xp: 0, runs: 0, drill: !!lesson.drill, capstone: !!lesson.capstone });
        const first = !rec.done;
        const fails = info.fails || 0, hints = info.hints || 0, revealed = !!info.revealed;
        const perfect = !revealed && fails === 0 && hints === 0;
        const out = { first, xp: 0, sp: 0, perfect, stars: 0, levelUp: 0, skillUp: null, badges: [], revealed };
        if (first) {
          const base = lesson.xp || 20;
          const mult = revealed ? 0 : Math.max(0.4, 1 - 0.15 * fails - 0.1 * hints) * (perfect ? 1.25 : 1);
          out.xp = Math.round(base * mult);
          out.stars = revealed ? 0 : perfect ? 3 : fails <= 1 && hints <= 1 ? 2 : 1;
          out.sp = out.stars * (lesson.diff || 1);
          rec.done = true; rec.perfect = perfect; rec.stars = out.stars; rec.xp = out.xp; rec.at = now();
          out.levelUp = store.addXp(out.xp);
          store.touchDay();
          if (out.sp) out.skillUp = store.addSkill(course.id, lesson.skill, out.sp);
          store.plantCards(lesson, course);
        } else { store.touchDay(); }
        rec.fails += fails; rec.hints += hints; rec.runs++;
        out.badges = store.checkBadges();
        store.save();
        store.emit({ type: 'lesson', out });
        return out;
      },

      plantCards(lesson, course) {
        (lesson.recall || []).forEach((q, i) => {
          const id = `${lesson.id}#${i}`;
          if (!state.srs[id]) state.srs[id] = { lesson: lesson.id, idx: i, course: course.id, skill: lesson.skill, box: 1, due: now() + DAY, seen: 0, lapses: 0 };
        });
      },
      dueCards() { const t = now(); return Object.entries(state.srs).filter(([, c]) => c.due <= t).sort((a, b) => a[1].due - b[1].due).map(([id]) => id); },
      allCards() { return Object.keys(state.srs); },
      nextDueIn() {
        const t = now();
        const future = Object.values(state.srs).map((c) => c.due).filter((d) => d > t);
        return future.length ? Math.min(...future) - t : null;
      },

      /* correct: bool, combo: current streak of correct answers BEFORE this one, practice: not-due card */
      answerCard(id, correct, combo, practice) {
        const c = state.srs[id];
        const out = { xp: 0, crit: false, box: c ? c.box : 0, skillUp: null, levelUp: 0, badges: [], nextDays: 0 };
        if (!c) return out;
        c.seen++;
        state.stats.reviewsTotal++;
        if (correct) {
          state.stats.reviewsCorrect++;
          const newCombo = combo + 1;
          state.stats.bestCombo = Math.max(state.stats.bestCombo, newCombo);
          if (!practice) c.box = Math.min(INTERVALS.length - 1, c.box + 1);
          c.due = practice ? c.due : now() + INTERVALS[c.box] * DAY;
          let xp = practice ? 1 : 3 + Math.min(combo, 8);
          if (rng() < 0.1) { xp *= 2; out.crit = true; }
          out.xp = xp;
          out.levelUp = store.addXp(xp);
          out.skillUp = store.addSkill(c.course, c.skill, practice ? 0.25 : 1);
          out.nextDays = INTERVALS[c.box];
        } else {
          c.lapses++;
          if (!practice) { c.box = 1; c.due = now() + 10 * 60000; }
          out.nextDays = 0;
        }
        out.box = c.box;
        out.badges = store.checkBadges();
        store.save();
        store.emit({ type: 'review', out });
        return out;
      },

      /* The "lock it in" question asked right after a lesson. Correct promotes the card
         straight to box 2; wrong leaves it due now so it shows up in the next review. */
      answerRecall(id, correct) {
        const c = state.srs[id];
        const out = { xp: 0, levelUp: 0, badges: [] };
        if (!c) return out;
        c.seen++;
        if (correct) {
          c.box = 2; c.due = now() + INTERVALS[2] * DAY;
          out.xp = 5;
          out.levelUp = store.addXp(5);
          store.addSkill(c.course, c.skill, 0.5);
        } else { c.lapses++; c.box = 1; c.due = now(); }
        out.badges = store.checkBadges();
        store.save();
        store.emit({ type: 'recall', out });
        return out;
      },

      checkBadges() {
        const got = [];
        for (const b of BADGES) if (!state.badges[b.id] && b.test(state)) { state.badges[b.id] = now(); got.push(b); }
        return got;
      },
      noteRun() { state.stats.runs++; },
      setSetting(k, v) { state.settings[k] = v; store.save(); store.emit({ type: 'settings' }); },
      export() { return JSON.stringify(state, null, 2); },
      import(text) { const s = JSON.parse(text); if (!s || s.v !== 1) throw new Error('Not a valid progress file'); state = Object.assign(fresh(), s); store.save(); store.emit({ type: 'import' }); },
      reset() { state = fresh(); store.save(); store.emit({ type: 'import' }); },
    };
    return store;
  }

  LP.createStore = createStore;
  LP.BADGES = BADGES;
  LP.SKILL_LEVELS = SKILL_LEVELS;
  LP.INTERVALS = INTERVALS;
  LP.levelOf = levelOf;
  LP.xpForLevel = xpForLevel;
  if (typeof module !== 'undefined') module.exports = LP;
})(typeof window !== 'undefined' ? window : globalThis);
