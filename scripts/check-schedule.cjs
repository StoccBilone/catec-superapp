const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
function load(source) {
  const filename = path.resolve(__dirname, '..', source);
  const loadedModule = new Module(filename, module);
  loadedModule.paths = Module._nodeModulePaths(path.dirname(filename));
  loadedModule._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, filename);
  return loadedModule.exports;
}
const { IMPORTED_LESSONS: lessons } = load('src/data/importedSchedule.ts');
const { BELL_TIMES, collegeClock, scheduleStatus } = load('src/services/scheduleClock.ts');
assert.equal(lessons.length, 208);
assert.equal(new Set(lessons.map(item => item.group)).size, 12);
assert.equal(new Set(lessons.map(item => item.id)).size, lessons.length);
for (const lesson of lessons) {
  const bell = BELL_TIMES[lesson.pairNumber];
  assert.equal(lesson.timeStart, bell.start);
  assert.equal(lesson.timeEnd, bell.end);
  assert.ok(lesson.subject && lesson.room && lesson.sourceRange);
  assert.ok(!lesson.variant || lesson.variant === 1 || lesson.variant === 2);
}
const group = lessons.filter(item => item.group === 'П4 А');
// Thursday in Almaty: no class until pair 1. Times are half-open, including the
// start of a class and excluding its end. This also checks the timezone offset.
let state = scheduleStatus(group, new Date('2026-10-08T07:49:59Z'));
assert.equal(state.current.length, 0);
assert.equal(state.wait, 1);
assert.equal(state.next[0].pairNumber, 1);
state = scheduleStatus(group, new Date('2026-10-08T07:50:00Z'));
assert.equal(state.current[0].pairNumber, 1);
assert.equal(state.remaining, 80 * 60);
state = scheduleStatus(group, new Date('2026-10-08T09:10:00Z'));
assert.equal(state.current.length, 0);
assert.equal(state.wait, 10 * 60);
assert.equal(state.next.length, 2);
const subgroup2 = group.filter(item => !item.variant || item.variant === 2);
state = scheduleStatus(subgroup2, new Date('2026-10-08T09:20:00Z'));
assert.equal(state.current.length, 1);
assert.equal(state.current[0].teacher, 'Сабитжанқызы Ғ.');
assert.equal(state.current[0].room, 'Библиотека');
state = scheduleStatus(group, new Date('2026-10-09T13:40:00Z'));
assert.equal(state.current.length, 0);
assert.equal(state.next[0].dayOfWeek, 1);
assert.equal(state.wait, (2 * 24 + 16) * 3600 + 20 * 60);
assert.equal(collegeClock(new Date('2026-10-08T19:00:00Z')).day, 5);
assert.equal(collegeClock(new Date('2026-10-08T19:00:00Z')).seconds, 0);
assert.equal(scheduleStatus([], new Date()).next.length, 0);
const p4k2 = lessons.filter(item => item.group === 'П4 К' && (!item.variant || item.variant === 2));
const p4k1 = lessons.filter(item => item.group === 'П4 К' && (!item.variant || item.variant === 1));
assert.ok(p4k2.some(item => item.dayOfWeek === 5 && item.pairNumber === 3));
assert.ok(!p4k1.some(item => item.dayOfWeek === 5 && item.pairNumber === 3));
console.log('208 classes, 12 groups: bell times, subgroups, class boundaries, weekends and Almaty midnight passed.');
