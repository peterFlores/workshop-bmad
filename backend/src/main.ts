import { createDummyJsonQuoteSource } from './adapters/dummyjson/dummyjson-quote-source.ts';
import { createApp } from './http/app.ts';

// Env defaults (read once, here):
//   PORT                 3001
//   UPSTREAM_URL         https://dummyjson.com/quotes/random
//   UPSTREAM_TIMEOUT_MS  5000
const port = Number(process.env.PORT ?? 3001);
const url = process.env.UPSTREAM_URL ?? 'https://dummyjson.com/quotes/random';
const timeoutMs = Number(process.env.UPSTREAM_TIMEOUT_MS ?? 5000);

const app = createApp(createDummyJsonQuoteSource({ url, timeoutMs }));
app.listen(port, (error?: Error) => {
  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log(`Backend listening on http://localhost:${port}`);
});
