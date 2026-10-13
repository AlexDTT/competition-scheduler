import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults, schedule} from '../shared/competition.js';
import {calendarEvents} from '../src/lib/calendarEvents.js';
test('unresolved calendar games explicitly say Unavailable', () => {
  const state = defaults(); state.unavailable[0][1] = true;
  const events = calendarEvents(state, schedule(state, {mask: 0}).matches);
  assert.equal(events.length, 15); assert.equal(events.filter(event => event.title.startsWith('Unavailable')).length, 1);
});
test('makeup calendar retains unavailable original slots alongside dated makeup games', () => {
  const state = defaults(); state.unavailable[0][1] = true; state.resolve = true;
  const events = calendarEvents(state, schedule(state, {mask: 0}).matches);
  assert.equal(events.length, 16);
  const marker = events.find(event => event.extendedProps.kind === 'unavailable');
  assert.equal(marker.title, 'Unavailable · Atlas'); assert.equal(marker.start, state.roundDates[1]); assert.equal(marker.editable, false);
  const makeup = events.find(event => event.title.startsWith('Makeup'));
  assert.notEqual(makeup.start, marker.start); assert.equal(makeup.extendedProps.matchId, marker.extendedProps.matchId);
});
