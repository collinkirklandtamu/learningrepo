/* Authoring helpers shared by the course files.
 *
 *   LP.withDrills(lesson, [drill, drill, ...]) -> [lesson, ...drills]
 *
 * A drill is a small extra exercise after a lesson. It is a normal lesson object (same fields:
 * task, starter, harness / checks, solution, hints) that inherits skill, difficulty and kind from
 * its parent, so every existing mechanic (XP, skill points, tests) works on it unchanged.
 */
(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  LP.withDrills = function (parent, drills) {
    const out = [parent];
    drills.forEach((d, i) => {
      const base = {
        id: `${parent.id}-d${i + 1}`, drill: true, parent: parent.id, skill: parent.skill, diff: parent.diff,
        xp: Math.max(6, Math.round((parent.xp || 20) * 0.4)),
        read: 'Same idea, new twist. There is no new reading: apply what the lesson taught.',
        recall: [],
      };
      if (parent.kind) base.kind = parent.kind;
      if (parent.lang) base.lang = parent.lang;
      if (parent.file) base.file = parent.file;
      out.push(Object.assign(base, d));
    });
    return out;
  };
  if (typeof module !== 'undefined') module.exports = LP;
})(typeof window !== 'undefined' ? window : globalThis);

/* Course assembly. Content can be spread over many files:
 *   LP.addLessons('python', [lesson, ...])      new main lessons
 *   LP.addDrills({ 'py-hello': [drill, ...] })  practice drills, keyed by parent lesson id
 *   LP.addRecall({ 'py-hello': [question] })    extra review questions appended to a lesson
 *   LP.assemble('python', ['py-hello', ...], skills)   the last file for a course: fixes the order
 */
(function (root) {
  'use strict';
  const LP = (root.LP = root.LP || {});
  const store = (LP._bank = LP._bank || { lessons: {}, drills: {}, recall: {} });
  LP.addLessons = (courseId, list) => { list.forEach((l) => { if (store.lessons[l.id]) throw new Error('duplicate lesson ' + l.id); store.lessons[l.id] = Object.assign({ _course: courseId }, l); }); };
  LP.addDrills = (map) => { Object.entries(map).forEach(([id, ds]) => { store.drills[id] = (store.drills[id] || []).concat(ds); }); };
  LP.addRecall = (map) => { Object.entries(map).forEach(([id, qs]) => { store.recall[id] = (store.recall[id] || []).concat(qs); }); };
  LP.assemble = (courseId, order, skills) => {
    const course = LP.courses.find((c) => c.id === courseId);
    const existing = {};
    course.lessons.forEach((l) => { existing[l.id] = l; });
    const used = new Set();
    const out = [];
    for (const id of order) {
      const main = existing[id] || store.lessons[id];
      if (!main) throw new Error(`assemble(${courseId}): unknown lesson "${id}"`);
      if (used.has(id)) throw new Error(`assemble(${courseId}): "${id}" listed twice`);
      used.add(id);
      const m = Object.assign({}, main);
      delete m._course;
      m.recall = (m.recall || []).concat(store.recall[id] || []);
      out.push(...LP.withDrills(m, store.drills[id] || []));
    }
    Object.keys(store.lessons).filter((id) => store.lessons[id]._course === courseId && !used.has(id)).forEach((id) => { throw new Error(`assemble(${courseId}): lesson "${id}" is registered but not in the order list`); });
    Object.keys(existing).filter((id) => !used.has(id)).forEach((id) => { throw new Error(`assemble(${courseId}): existing lesson "${id}" missing from the order list`); });
    Object.keys(store.drills).filter((id) => (existing[id] || (store.lessons[id] && store.lessons[id]._course === courseId)) && !used.has(id)).forEach((id) => { throw new Error(`drills registered for unused lesson ${id}`); });
    course.lessons = out;
    if (skills) course.skills = skills;
  };
})(typeof window !== 'undefined' ? window : globalThis);
