import test from 'node:test';
import assert from 'node:assert/strict';
import { recommendTasks, defaultMinutesFor } from './workload.js';
import { todayStr, addDays } from './dates.js';

let n = 0;
const task = (over) => ({ id: `t${n++}`, title: 'T', type: 'assignment', completed: false, estimatedMinutes: 30, ...over });
const ids = (rows) => rows.map((r) => r.id);

test('ranks overdue > today > tomorrow > major exam soon > everything else', () => {
  const overdue = task({ dueDate: addDays(todayStr(), -2) });
  const today = task({ dueDate: todayStr() });
  const tomorrow = task({ dueDate: addDays(todayStr(), 1) });
  const examSoon = task({ type: 'exam', dueDate: addDays(todayStr(), 8) });
  const later = task({ dueDate: addDays(todayStr(), 5) });
  const out = recommendTasks([later, examSoon, tomorrow, today, overdue], 120);
  assert.deepEqual(ids(out), [overdue.id, today.id, tomorrow.id, examSoon.id, later.id]);
});

test('within a tier, earlier due date comes first', () => {
  const a = task({ dueDate: addDays(todayStr(), 9) });
  const b = task({ dueDate: addDays(todayStr(), 4) });
  assert.deepEqual(ids(recommendTasks([a, b], 60)), [b.id, a.id]);
});

test('completed tasks and tasks without a due date are ignored', () => {
  const done = task({ dueDate: todayStr(), completed: true });
  const undated = task({ dueDate: null });
  assert.equal(recommendTasks([done, undated], 60).length, 0);
});

test('prefers tasks that fit the time budget (+15 min slack)', () => {
  const long = task({ dueDate: todayStr(), estimatedMinutes: 120 });
  const short = task({ dueDate: addDays(todayStr(), 3), estimatedMinutes: 30 });
  assert.deepEqual(ids(recommendTasks([long, short], 30)), [short.id]);
});

test('falls back to everything when nothing fits, so urgent work is never hidden', () => {
  const long = task({ dueDate: todayStr(), estimatedMinutes: 180 });
  assert.deepEqual(ids(recommendTasks([long], 30)), [long.id]);
});

test('returns at most 5 tasks', () => {
  const many = Array.from({ length: 9 }, () => task({ dueDate: todayStr() }));
  assert.equal(recommendTasks(many, 60).length, 5);
});

test('uses per-type default minutes when a task has no estimate', () => {
  const exam = task({ type: 'exam', dueDate: todayStr(), estimatedMinutes: undefined });
  assert.equal(recommendTasks([exam], 200)[0]._est, defaultMinutesFor('exam'));
  assert.equal(defaultMinutesFor('exam'), 120);
  assert.equal(defaultMinutesFor('mystery'), 45);
});

test('each recommendation carries a plain-English reason', () => {
  const t = task({ dueDate: addDays(todayStr(), 1) });
  assert.equal(recommendTasks([t], 60)[0]._reason, 'Due tomorrow');
});
