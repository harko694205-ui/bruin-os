import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSyllabus } from './syllabusParser.js';

const opts = { referenceYear: 2026, termStart: '2026-09-24' };
const parse = (text, o = opts) => parseSyllabus(text, o);
const pick = (rows) => rows.map((r) => [r.date, r.type, r.title]);

test('month-name date with a type keyword', () => {
  assert.deepEqual(pick(parse('September 24 — Problem Set 1 due')), [['2026-09-24', 'homework', 'Problem Set 1 due']]);
});

test('numeric slash date with 2-digit year', () => {
  const [r] = parse('10/15/26 - Quiz 2');
  assert.equal(r.date, '2026-10-15');
  assert.equal(r.type, 'quiz');
});

test('"Week N" resolves from the term start; week 1 is the start date', () => {
  assert.equal(parse('Week 1 - Homework 1')[0].date, '2026-09-24');
  assert.equal(parse('Week 5 — Midterm exam')[0].date, '2026-10-22');
});

test('"Week N" is skipped when no term start is set', () => {
  assert.equal(parse('Week 5 — Midterm exam', { referenceYear: 2026 }).length, 0);
});

test('keyword order: "final project proposal" is a project, not an exam', () => {
  assert.equal(parse('10/15 — Final project proposal due')[0].type, 'project');
  assert.equal(parse('Final exam December 10')[0].type, 'exam');
});

test('page and chapter ranges are not dates', () => {
  assert.equal(parse('Read pages 12-15 before class').length, 0);
  assert.equal(parse('Chapters 3-4 reading').length, 0);
  assert.equal(parse('Problems 2/5 on the worksheet').length, 0);
});

test('time ranges are not dates', () => {
  assert.equal(parse('Office hours: Tues 2-3 pm').length, 0);
  assert.equal(parse('Section meets 2/3 pm').length, 0);
});

test('hyphenated numeric date still works when it has a year', () => {
  assert.equal(parse('9-24-26 Problem set due')[0].date, '2026-09-24');
});

test('a line with two dates yields two events', () => {
  const rows = parse('Quiz on 9/28 and 10/5');
  assert.deepEqual(rows.map((r) => r.date), ['2026-09-28', '2026-10-05']);
});

test('a date range yields one event on the end date', () => {
  const rows = parse('Oct 5 - Oct 9: Project milestone');
  assert.deepEqual(rows.map((r) => r.date), ['2026-10-09']);
  assert.equal(rows[0].title, 'Project milestone');
});

test('impossible calendar dates are rejected', () => {
  assert.equal(parse('Feb 31 - Paper due').length, 0);
});

test('results are sorted by date and duplicates are removed', () => {
  const rows = parse('Dec 10 Final exam\nSep 30 Quiz 1\nDec 10 Final exam');
  assert.deepEqual(rows.map((r) => r.date), ['2026-09-30', '2026-12-10']);
});

test('weekday prefix is stripped from the title', () => {
  assert.equal(parse('Monday, November 2 - Essay draft due')[0].title, 'Essay draft due');
});

test('a line with no date produces nothing', () => {
  assert.equal(parse('Welcome to the course!').length, 0);
});
