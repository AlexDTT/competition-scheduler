import test from 'node:test';
import assert from 'node:assert/strict';
import {orientations, schedule} from '../shared/competition.js';
import {demoState} from '../src/lib/demo.js';

test('guided demo preserves all fixtures while showing and resolving one conflict', () => {
  const baseline = orientations(demoState(0).teams).baseline;
  assert.equal(demoState(0).teams[0].name, 'Atlas United');
  assert.equal(schedule(demoState(1), baseline).unresolved, 1);
  const resolved = schedule(demoState(2), baseline);
  assert.equal(resolved.unresolved, 0); assert.equal(resolved.makeup.length, 1);
  assert.equal(resolved.original.flat().length + resolved.makeup.flat().length, 15);
  assert.equal(demoState(3).optimized, true);
});
