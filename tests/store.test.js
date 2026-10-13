import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, writeFile, readdir, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createStore} from '../server/store.js';
import {defaults} from '../shared/competition.js';

async function withStore(run) {
  const directory = await mkdtemp(join(tmpdir(), 'roundhouse-'));
  const file = join(directory, 'competition.json');
  try {await run(createStore(file), file, directory);}
  finally {await rm(directory, {recursive: true, force: true});}
}
test('file storage initializes defaults, persists edits, and survives a new store instance', () => withStore(async (store, file) => {
  const initial = await store.get();
  assert.equal(initial.revision, 0);
  const state = defaults(); state.teams[0].name = 'Atlas United'; state.unavailable[0][1] = true;
  const saved = await store.save(state, initial.revision);
  assert.equal(saved.revision, 1);
  assert.deepEqual(JSON.parse(await readFile(file, 'utf8')), saved);
  assert.deepEqual(await createStore(file).get(), saved);
}));
test('concurrent stale writes are rejected and do not overwrite the successful edit', () => withStore(async (store, file, directory) => {
  await store.get();
  const first = defaults(), second = defaults(); first.teams[0].name = 'First'; second.teams[0].name = 'Second';
  const outcomes = await Promise.allSettled([store.save(first, 0), store.save(second, 0)]);
  assert.equal(outcomes[0].status, 'fulfilled'); assert.equal(outcomes[1].reason.status, 409);
  assert.equal((await store.get()).state.teams[0].name, 'First');
  assert.deepEqual(await readdir(directory), ['competition.json']);
}));
test('invalid state and revisions are rejected without modifying the saved file', () => withStore(async (store, file) => {
  const initial = await store.get();
  const wrong = defaults(); wrong.teams[0].id = 9;
  await assert.rejects(store.save(wrong, 0), error => error.status === 400);
  await assert.rejects(store.save(defaults(), null), error => error.status === 400);
  const wrongAvailability = defaults(); wrongAvailability.unavailable[0][0] = 'true';
  await assert.rejects(store.save(wrongAvailability, 0), error => error.status === 400);
  assert.deepEqual(JSON.parse(await readFile(file, 'utf8')), initial);
}));
test('a corrupt data file is reported and preserved', () => withStore(async (store, file) => {
  await writeFile(file, '{broken json');
  await assert.rejects(store.get(), error => error.status === 500 && /not been overwritten/.test(error.message));
  await assert.rejects(store.save(defaults(), 0), error => error.status === 500);
  assert.equal(await readFile(file, 'utf8'), '{broken json');
}));
test('incomplete venue edits remain persistable while travel validation is separate', () => withStore(async store => {
  await store.get(); const state = defaults(); state.teams[0].lat = null; state.teams[1].lon = 181;
  const saved = await store.save(state, 0); assert.equal(saved.state.teams[0].lat, null); assert.equal(saved.state.teams[1].lon, 181);
}));
