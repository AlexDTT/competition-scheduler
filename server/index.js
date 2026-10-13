import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {createStore} from './store.js';
import {createApp} from './app.js';

const dataFile = process.env.COMPETITION_DATA_FILE
  ? resolve(process.env.COMPETITION_DATA_FILE)
  : fileURLToPath(new URL('../data/competition.json', import.meta.url));
const store = createStore(dataFile);
await store.get();
const distDirectory = fileURLToPath(new URL('../dist', import.meta.url));
const app = createApp(store, {distDirectory});
const port = Number(process.env.PORT || 3001);
const server = app.listen(port, '127.0.0.1', () => {
  console.log(`Roundhouse API: http://127.0.0.1:${port}`);
  console.log(`Competition data: ${dataFile}`);
});
server.on('error', error => {console.error(`Could not start API: ${error.message}`); process.exitCode = 1;});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
