import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults, orientations, schedule} from '../shared/competition.js';
import {REST_MS, fromLocalInput, toLocalInput, weeklyRoundDates, defaultRoundDates, restViolations} from '../shared/calendar.js';
import {validateState} from '../shared/validation.js';

test('defaults start next Saturday at 15:00 Lisbon, with five weekly kickoffs', () => {
  const dates = defaultRoundDates(new Date('2026-10-13T12:00:00Z'));
  assert.equal(toLocalInput(dates[0]), '2026-10-17T15:00');
  assert.equal(toLocalInput(dates[1]), '2026-10-24T15:00');
  assert.equal(toLocalInput(dates[2]), '2026-10-31T15:00');
  assert.equal(dates.length, 5);
  assert.equal(dates[0], '2026-10-17T14:00:00.000Z');
  assert.equal(dates[2], '2026-10-31T15:00:00.000Z');
});
test('Lisbon input conversion handles daylight saving and rejects nonexistent dates and times', () => {
  assert.equal(fromLocalInput('2026-07-04T15:00'), '2026-07-04T14:00:00.000Z');
  assert.equal(fromLocalInput('2026-12-05T15:00'), '2026-12-05T15:00:00.000Z');
  assert.throws(() => fromLocalInput('2026-03-29T01:30'), /does not exist/);
  assert.throws(() => fromLocalInput('2026-02-30T15:00'), /does not exist/);
});
test('automatic makeups preserve all matches and have at least 72 hours of rest', () => {
  const state = defaults(); state.resolve = true; state.unavailable[0][1] = true;
  const data = schedule(state, orientations(state.teams).baseline);
  assert.equal(data.matches.length, 15); assert.equal(data.makeup.length, 1);
  assert.equal(Date.parse(data.makeup[0][0].kickoff) - Date.parse(state.roundDates[4]), REST_MS);
  assert.deepEqual(restViolations(data.matches), []);
  state.unavailable = Array.from({length: 6}, () => Array(5).fill(true));
  const allPostponed = schedule(state, {mask: 0});
  assert.equal(allPostponed.makeup.length, 5); assert.deepEqual(restViolations(allPostponed.matches), []);
});
test('manual makeup edits require rest before and after, accepting exactly 72 hours', () => {
  const state = defaults(); state.resolve = true; state.unavailable[0][1] = true;
  const match = schedule(state, {mask: 0}).makeup[0][0];
  state.makeupDates[match.id] = new Date(Date.parse(state.roundDates[2]) - REST_MS).toISOString();
  assert.doesNotThrow(() => validateState(state));
  state.makeupDates[match.id] = new Date(Date.parse(state.roundDates[2]) - REST_MS + 60000).toISOString();
  assert.throws(() => validateState(state), /at least 72 hours/);
  state.makeupDates[match.id] = new Date(Date.parse(state.roundDates[0]) + REST_MS - 60000).toISOString();
  assert.throws(() => validateState(state), /at least 72 hours/);
});
test('rescheduling an original game cannot violate a postponed game’s rest window', () => {
  const state = defaults(); state.resolve = true; state.unavailable[0][1] = true;
  const initial = schedule(state, {mask: 0});
  const postponed = initial.makeup[0][0];
  state.makeupDates[postponed.id] = postponed.kickoff;
  const other = initial.original[4].find(match => match.a === 0 || match.b === 0);
  state.matchDates[other.id] = new Date(Date.parse(postponed.kickoff) - 24 * 3600000).toISOString();
  assert.throws(() => validateState(state), /at least 72 hours/);
});
test('clearing unavailability restores original dates, and legacy JSON acquires dates', () => {
  const state = defaults(); const originalDates = weeklyRoundDates(fromLocalInput('2027-01-02T15:00'));
  state.roundDates = originalDates; state.resolve = true; state.unavailable[0][1] = true;
  assert.equal(schedule(state, {mask: 0}).makeup.length, 1);
  state.unavailable[0][1] = false;
  const restored = schedule(state, {mask: 0});
  assert.equal(restored.makeup.length, 0); assert.equal(restored.original[1][0].kickoff, originalDates[1]);
  delete state.roundDates; delete state.matchDates; delete state.makeupDates;
  const migrated = validateState(state); assert.equal(migrated.roundDates.length, 5); assert.deepEqual(migrated.makeupDates, {});
});
