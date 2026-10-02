/* Shared lesson helpers: lookups, check evaluation, solution playback.
 * Used by the UI and by the Node test-suite. */
(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});

  LP.course = (id) => LP.courses.find((c) => c.id === id) || null;
  LP.findLesson = (id) => {
    for (const c of LP.courses) {
      const i = c.lessons.findIndex((l) => l.id === id);
      if (i >= 0) return { course: c, lesson: c.lessons[i], index: i, next: c.lessons[i + 1] || null, prev: c.lessons[i - 1] || null };
    }
    return null;
  };
  LP.courseProgress = (store, course) => {
    const mains = course.lessons.filter((l) => !l.drill), drills = course.lessons.filter((l) => l.drill);
    const done = mains.filter((l) => store.isDone(l.id)).length;
    const drillsDone = drills.filter((l) => store.isDone(l.id)).length;
    const xp = course.lessons.reduce((a, l) => a + ((store.lesson(l.id) || {}).xp || 0), 0);
    const maxXp = course.lessons.reduce((a, l) => a + Math.round((l.xp || 20) * 1.25), 0);
    return { done, total: mains.length, pct: mains.length ? done / mains.length : 0, drillsDone, drillsTotal: drills.length, xp, maxXp };
  };
  // drills that belong to a main lesson, in order
  LP.drillsOf = (course, lessonId) => course.lessons.filter((l) => l.drill && l.parent === lessonId);
  // next lesson to suggest: continue the most recently touched course, else the first unfinished one
  // the next thing to do inside one course (drills right after the last finished lesson first, then the next lesson)
  LP.nextInCourse = (store, c) => {
    const arr = c.lessons;
    let lastMain = -1;
    arr.forEach((l, i) => { if (!l.drill && store.isDone(l.id)) lastMain = i; });
    for (let i = lastMain + 1; i < arr.length && arr[i].drill; i++) if (!store.isDone(arr[i].id)) return arr[i];
    return arr.find((x, i) => i > lastMain && !x.drill && !store.isDone(x.id)) || arr.find((x) => !x.drill && !store.isDone(x.id)) || null;
  };
  LP.nextLesson = (store) => {
    const recs = Object.entries(store.state.lessons).filter(([, r]) => r.done).sort((a, b) => (b[1].at || 0) - (a[1].at || 0));
    const order = [];
    if (recs.length) { const c = LP.course(recs[0][1].course); if (c) order.push(c); }
    LP.courses.forEach((c) => { if (!order.includes(c)) order.push(c); });
    for (const c of order) { const l = LP.nextInCourse(store, c); if (l) return { course: c, lesson: l }; }
    return null;
  };
  LP.kindOf = (lesson, course) => lesson.kind || (course.engine === 'terminal' ? 'terminal' : 'code');

  // Context handed to checks of file-editor lessons
  LP.fileContext = (lesson, text) => {
    const ctx = {};
    if (lesson.lang === 'yaml') {
      try {
        ctx.yaml = LP.Docker.parseYaml(text);
        ctx.steps = [];
        const jobs = (ctx.yaml && ctx.yaml.jobs) || {};
        for (const j of Object.values(jobs)) if (j && Array.isArray(j.steps)) ctx.steps.push(...j.steps);
      } catch (e) { ctx.error = e.message; ctx.steps = []; }
    } else if (lesson.lang === 'dockerfile') ctx.steps = LP.Docker.parseDockerfile(text);
    return ctx;
  };

  // [{label, ok}] for terminal (machine) and file (text) lessons
  LP.evalChecks = (lesson, subject) => {
    const ctx = typeof subject === 'string' ? LP.fileContext(lesson, subject) : null;
    return (lesson.checks || []).map((c) => {
      let ok = false;
      try { ok = !!(ctx ? c.test(subject, ctx) : c.test(subject)); } catch (e) { ok = false; }
      return { label: c.label, ok };
    });
  };

  // Apply a solution (array of commands/{write,content}) to a machine
  LP.playSolution = (lesson, m) => {
    const sol = Array.isArray(lesson.solution) ? lesson.solution : [];
    const out = [];
    for (const step of sol) {
      if (typeof step === 'string') out.push({ cmd: step, res: m.exec(step) });
      else m.write(step.write, step.content);
    }
    return out;
  };
  LP.solutionText = (lesson) => {
    if (typeof lesson.solution === 'string') return lesson.solution;
    return lesson.solution.map((s) => (typeof s === 'string' ? '$ ' + s : `(edit ${s.write} so that it contains)\n${s.content.replace(/\n$/, '')}`)).join('\n');
  };
  if (typeof module !== 'undefined') module.exports = LP;
})(typeof window !== 'undefined' ? window : globalThis);
