import { fileURLToPath } from 'node:url';
import { createDummyJsonQuoteSource } from './adapters/dummyjson/dummyjson-quote-source.ts';
import { openSqliteQuoteStore } from './adapters/sqlite/sqlite-quote-store.ts';
import type { SqliteQuoteStore } from './adapters/sqlite/sqlite-quote-store.ts';
import { createApp } from './http/app.ts';

// Env defaults (read once, here):
//   PORT                 3001
//   UPSTREAM_URL         https://dummyjson.com/quotes/random
//   UPSTREAM_TIMEOUT_MS  5000
//   DATA_FILE            <backend package root>/data/quotes.db
const port = Number(process.env.PORT ?? 3001);
const url = process.env.UPSTREAM_URL ?? 'https://dummyjson.com/quotes/random';
const timeoutMs = Number(process.env.UPSTREAM_TIMEOUT_MS ?? 5000);
const dataFile = process.env.DATA_FILE || fileURLToPath(new URL('../data/quotes.db', import.meta.url));

let store: SqliteQuoteStore;
try {
  store = openSqliteQuoteStore(dataFile);
} catch (error) {
  console.error(`Cannot open data file at ${dataFile}. It may be corrupt or locked; it was not modified or deleted.`);
  console.error(error);
  process.exit(1);
}

const app = createApp(createDummyJsonQuoteSource({ url, timeoutMs }), store);
app.listen(port, (error?: Error) => {
  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log(`Backend listening on http://localhost:${port}`);
});
