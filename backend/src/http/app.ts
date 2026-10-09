import express from 'express';
import type { ErrorRequestHandler } from 'express';
import type { QuoteSource } from '../domain/quote-source.ts';
import { UpstreamError } from '../domain/upstream-error.ts';
import { getRandomQuote } from '../service/get-random-quote.ts';

const mapError: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof UpstreamError) {
    res.status(502).json({ error: 'Quote service unavailable' });
    return;
  }
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
};

export function createApp(source: QuoteSource) {
  const app = express();
  app.get('/api/quote', async (_req, res) => {
    res.json(await getRandomQuote(source));
  });
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
  app.use(mapError);
  return app;
}
