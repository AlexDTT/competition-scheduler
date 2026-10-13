import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults, orientations, schedule} from '../shared/competition.js';
import {standings} from '../shared/results.js';
import {validateState} from '../shared/validation.js';
test('home and away scores produce correct win, draw, loss, and standings points', () => {
  const state = defaults();
  const rows = standings(state.teams, {
    0: {homeTeam: 0, awayTeam: 5, homeScore: 2, awayScore: 1},
    1: {homeTeam: 1, awayTeam: 4, homeScore: 0, awayScore: 0},
    2: {homeTeam: 2, awayTeam: 3, homeScore: 0, awayScore: 3},
  });
  const atlas = rows.find(row => row.id === 0), phoenix = rows.find(row => row.id === 5), harbor = rows.find(row => row.id === 1);
  assert.equal(atlas.points, 3); assert.equal(atlas.homePlayed, 1); assert.equal(atlas.goalsFor, 2);
  assert.equal(phoenix.points, 0); assert.equal(phoenix.awayPlayed, 1); assert.equal(phoenix.lost, 1);
  assert.equal(harbor.points, 1); assert.equal(harbor.drawn, 1);
  assert.equal(rows[0].id, 3);
});
test('travel optimization preserves recorded home/away assignments and remains balanced', () => {
  const state = defaults(), initial = orientations(state.teams).baseline;
  const match = schedule(state, initial).matches[0];
  state.results[match.id] = {homeTeam: match.home, awayTeam: match.away, homeScore: 1, awayScore: 0};
  assert.doesNotThrow(() => validateState(state));
  const best = orientations(state.teams, state.results).best;
  assert.equal(schedule(state, best).matches[0].home, match.home);
  assert.ok(best.homeCounts.every(count => count === 2 || count === 3));
});
test('results reject invalid scores or teams and support legacy records without scores', () => {
  const state = defaults();
  state.results[0] = {homeTeam: 0, awayTeam: 5, homeScore: -1, awayScore: 0};
  assert.throws(() => validateState(state), /whole numbers/);
  state.results[0] = {homeTeam: 0, awayTeam: 4, homeScore: 1, awayScore: 0};
  assert.throws(() => validateState(state), /actual home and away teams/);
  delete state.results; assert.deepEqual(validateState(state).results, {});
});
