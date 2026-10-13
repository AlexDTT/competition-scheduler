import express from 'express';
import {resolve} from 'node:path';

export function createApp(store, {distDirectory} = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use('/api', (_request, response, next) => {response.set('Cache-Control', 'no-store'); next();});
  app.use(express.json({limit: '32kb'}));
  app.get('/api/competition', async (_request, response) => response.json(await store.get()));
  app.put('/api/competition', async (request, response) => {
    response.json(await store.save(request.body?.state, request.body?.revision));
  });
  app.use('/api', (_request, response) => response.status(404).json({error: 'API route not found.'}));
  if (distDirectory) {
    app.use(express.static(distDirectory));
    app.get('/', (_request, response) => response.sendFile(resolve(distDirectory, 'index.html')));
  }
  app.use((error, _request, response, _next) => {
    const status = error.status || 500;
    if (status === 500) console.error(error);
    const message = error.type === 'entity.parse.failed' ? 'Request body must be valid JSON.' :
      status === 413 ? 'Request body is too large.' :
      error.status ? error.message : 'Could not access the competition file. Check the server logs.';
    response.status(status).json({error: message});
  });
  return app;
}
