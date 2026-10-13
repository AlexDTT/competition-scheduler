import test from 'node:test';
import assert from 'node:assert/strict';
import {Duplex} from 'node:stream';
import {IncomingMessage, ServerResponse} from 'node:http';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createApp} from '../server/app.js';
import {createStore} from '../server/store.js';
import {defaults, schedule} from '../shared/competition.js';

// Exercise Express and its JSON middleware without opening sockets in the sandbox.
function request(app, {method = 'GET', path = '/api/competition', body, rawBody} = {}) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const socket = new Duplex({read() {}, write(chunk, _encoding, callback) {chunks.push(Buffer.from(chunk)); callback();}});
    const incoming = new IncomingMessage(socket);
    const text = rawBody ?? (body === undefined ? '' : JSON.stringify(body));
    incoming.method = method; incoming.url = path;
    incoming.httpVersion = '1.1'; incoming.httpVersionMajor = 1; incoming.httpVersionMinor = 1;
    incoming.headers = text ? {'content-type': 'application/json', 'content-length': Buffer.byteLength(text)} : {};
    const response = new ServerResponse(incoming); response.assignSocket(socket);
    response.on('finish', () => {
      try {
        const raw = Buffer.concat(chunks).toString();
        const payload = raw.slice(raw.indexOf('\r\n\r\n') + 4);
        resolve({status: response.statusCode, body: JSON.parse(payload)});
      } catch (error) {reject(error);}
      finally {socket.destroy();}
    });
    app(incoming, response);
    if (text) incoming.push(text);
    incoming.complete = true;
    incoming.push(null);
  });
}

test('Express JSON API persists results, rejects stale writes, and enforces rest windows', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'roundhouse-api-'));
  try {
    const store = createStore(join(directory, 'competition.json'));
    const app = createApp(store);
    const initial = await request(app); assert.equal(initial.status, 200);
    const state = defaults(); state.resolve = true; state.unavailable[0][1] = true;
    // Use a balanced fixture orientation when recording a result.
    const {orientations} = await import('../shared/competition.js');
    const balanced = schedule(state, orientations(state.teams).baseline).matches[0];
    state.results[balanced.id] = {homeTeam: balanced.home, awayTeam: balanced.away, homeScore: 2, awayScore: 1};
    const saved = await request(app, {method: 'PUT', body: {state, revision: 0}});
    assert.equal(saved.status, 200); assert.equal(saved.body.revision, 1);
    assert.equal(saved.body.state.results[balanced.id].homeScore, 2);
    const stale = await request(app, {method: 'PUT', body: {state, revision: 0}}); assert.equal(stale.status, 409);
    const postponed = schedule(state, {mask: 0}).makeup[0][0];
    state.makeupDates[postponed.id] = new Date(Date.parse(state.roundDates[4]) + 3600000).toISOString();
    const invalid = await request(app, {method: 'PUT', body: {state, revision: 1}});
    assert.equal(invalid.status, 400); assert.match(invalid.body.error, /at least 72 hours/);
    assert.equal((await store.get()).revision, 1);
    assert.equal((await request(app, {method: 'PUT', rawBody: '{broken'})).status, 400);
    assert.equal((await request(app, {path: '/api/missing'})).status, 404);
  } finally {await rm(directory, {recursive: true, force: true});}
});
