import {mkdir, readFile, writeFile, rename, rm} from 'node:fs/promises';
import {dirname} from 'node:path';
import {randomUUID} from 'node:crypto';
import {defaults} from '../shared/competition.js';
import {validateState} from '../shared/validation.js';

export class StoreError extends Error {
  constructor(message, status) {super(message); this.status = status;}
}

export function createStore(filePath) {
  let queue = Promise.resolve();
  const serial = operation => {
    const result = queue.then(operation);
    queue = result.catch(() => {});
    return result;
  };
  async function atomicWrite(record) {
    await mkdir(dirname(filePath), {recursive: true});
    const temporary = `${filePath}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporary, JSON.stringify(record, null, 2) + '\n', {flag: 'wx'});
      await rename(temporary, filePath);
    } finally {await rm(temporary, {force: true});}
  }
  async function read() {
    let text;
    try {text = await readFile(filePath, 'utf8');}
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      const initial = {schemaVersion: 1, revision: 0, state: defaults()};
      await atomicWrite(initial);
      return initial;
    }
    try {
      const record = JSON.parse(text);
      if (record.schemaVersion !== 1 || !Number.isSafeInteger(record.revision) || record.revision < 0) throw new Error();
      const normalized = {...record, state: validateState(record.state)};
      if (record.state.roundDates === undefined || record.state.results === undefined) await atomicWrite(normalized);
      return normalized;
    } catch {
      throw new StoreError('The competition JSON file is invalid. Restore a valid backup; it has not been overwritten.', 500);
    }
  }
  return {
    get: () => serial(read),
    save: (state, revision) => serial(async () => {
      let validated;
      try {validated = validateState(state);}
      catch (error) {throw new StoreError(error.message, 400);}
      if (!Number.isSafeInteger(revision) || revision < 0) throw new StoreError('A valid revision is required.', 400);
      const current = await read();
      if (revision !== current.revision) throw new StoreError('This competition changed in another tab. Reload before editing again.', 409);
      const next = {schemaVersion: 1, revision: current.revision + 1, state: validated};
      await atomicWrite(next);
      return next;
    }),
  };
}
