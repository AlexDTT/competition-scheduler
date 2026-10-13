import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults} from '../shared/competition.js';
import {loadCompetition, saveCompetition, readLegacyCompetition} from '../src/services/competitionApi.js';

test('JavaScript client loads and saves state through the JSON API', async context => {
  const record = {schemaVersion: 1, revision: 3, state: defaults()};
  context.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/competition');
    if (options.method) {
      assert.equal(options.method, 'PUT'); assert.equal(options.headers['Content-Type'], 'application/json');
      assert.deepEqual(JSON.parse(options.body), {state: record.state, revision: 3});
    }
    return {ok: true, json: async () => record};
  });
  assert.deepEqual(await loadCompetition(), record);
  assert.deepEqual(await saveCompetition(record.state, 3), record);
});
test('client exposes stale-write and connection failures instead of claiming a save', async context => {
  context.mock.method(globalThis, 'fetch', async () => ({ok: false, status: 409, json: async () => ({error: 'Reload before editing.'})}));
  await assert.rejects(saveCompetition(defaults(), 0), error => error.status === 409);
  globalThis.fetch = async () => {throw new Error('offline');};
  await assert.rejects(loadCompetition(), /Cannot reach the server/);
});
test('legacy browser data is read only for explicit import and rejects malformed data', () => {
  const previous = globalThis.localStorage;
  try {
    globalThis.localStorage = {getItem: () => JSON.stringify(defaults())};
    assert.deepEqual(readLegacyCompetition(), defaults());
    globalThis.localStorage = {getItem: () => '{broken'};
    assert.equal(readLegacyCompetition(), null);
  } finally {if (previous === undefined) delete globalThis.localStorage; else globalThis.localStorage = previous;}
});
