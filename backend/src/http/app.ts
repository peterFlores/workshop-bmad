import express from 'express';
import type { ErrorRequestHandler } from 'express';
import type { QuoteSource } from '../domain/quote-source.ts';
import type { QuoteStore } from '../domain/quote-store.ts';
import { UpstreamError } from '../domain/upstream-error.ts';
import { ValidationError } from '../domain/validation-error.ts';
import { addFavorite, listFavorites, removeFavorite } from '../service/favorites.ts';
import { getRandomQuote } from '../service/get-random-quote.ts';
import { listHistory } from '../service/list-history.ts';
import { recordHistory } from '../service/record-history.ts';

const mapError: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof UpstreamError) {
    res.status(502).json({ error: 'Quote service unavailable' });
    return;
  }
  if (error instanceof ValidationError) {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }
  const status = (error as { status?: unknown } | null)?.status;
  if (typeof status === 'number' && status >= 400 && status < 500) {
    res.status(status).json({ error: 'Invalid request body' });
    return;
  }
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
};

export function createApp(source: QuoteSource, store: QuoteStore) {
  const app = express();
  app.use(express.json());
  app.get('/api/quote', async (_req, res) => {
    res.json(await getRandomQuote(source));
  });
  app.post('/api/history', async (req, res) => {
    res.status(201).json(await recordHistory(store, req.body));
  });
  app.get('/api/history', async (_req, res) => {
    res.json(await listHistory(store));
  });
  app.get('/api/favorites', async (_req, res) => {
    res.json(await listFavorites(store));
  });
  app.put('/api/favorites/:id', async (req, res) => {
    await addFavorite(store, req.params.id, req.body);
    res.status(204).end();
  });
  app.delete('/api/favorites/:id', async (req, res) => {
    await removeFavorite(store, req.params.id);
    res.status(204).end();
  });
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
  app.use(mapError);
  return app;
}
