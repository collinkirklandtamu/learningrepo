// Every terminal / file lesson: not already solved at the start, fully solved by the reference solution,
// and the sandbox never throws internal errors while doing it.
const test = require('node:test');
const assert = require('node:assert');
const LP = require('./helpers.js');

for (const course of LP.courses) {
  for (const lesson of course.lessons) {
    const kind = LP.kindOf(lesson, course);
    if (kind === 'terminal') {
      test(`${lesson.id}: terminal solution satisfies every check`, () => {
        const m = LP.Machine.create(lesson.setup);
        const before = LP.evalChecks(lesson, m);
        assert.ok(before.some((c) => !c.ok), 'lesson must not be solved before the learner does anything');
        const played = LP.playSolution(lesson, m);
        for (const p of played) {
          const text = p.res.items.map((i) => i.text).join('\n');
          assert.ok(!/internal sandbox error/.test(text), `${p.cmd} -> ${text}`);
        }
        const after = LP.evalChecks(lesson, m);
        const failed = after.filter((c) => !c.ok).map((c) => c.label);
        assert.deepStrictEqual(failed, [], 'failed checks: ' + failed.join(' | ') + '\n' + played.map((p) => '$ ' + p.cmd + '\n' + p.res.items.map((i) => i.text).join('\n')).join('\n'));
      });
    } else if (kind === 'file') {
      test(`${lesson.id}: file solution satisfies every check, starter satisfies none`, () => {
        const starter = LP.evalChecks(lesson, lesson.starter);
        assert.ok(starter.some((c) => !c.ok), 'starter should not already pass');
        const res = LP.evalChecks(lesson, lesson.solution);
        const failed = res.filter((c) => !c.ok).map((c) => c.label);
        assert.deepStrictEqual(failed, []);
      });
    }
  }
}
