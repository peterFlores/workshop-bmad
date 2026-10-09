import type { AddressInfo } from 'node:net';
import { afterEach, expect, it } from 'vitest';
import type { QuoteSource } from '../domain/quote-source.ts';
import { UpstreamError } from '../domain/upstream-error.ts';
import { createApp } from './app.ts';

const quote = { id: 1, quote: "That'S Title Case", author: 'Someone' };
let close: (() => void) | undefined;

async function start(source: QuoteSource) {
  const server = createApp(source).listen(0);
  await new Promise((r) => server.once('listening', r));
  close = () => server.close();
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

afterEach(() => close?.());

it('returns the bare quote with 200, repeats allowed', async () => {
  const base = await start({ getRandom: async () => quote });
  for (let i = 0; i < 2; i++) {
    const res = await fetch(`${base}/api/quote`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(quote);
  }
});

it('maps UpstreamError to 502', async () => {
  const base = await start({
    getRandom: async () => {
      throw new UpstreamError('down');
    },
  });
  const res = await fetch(`${base}/api/quote`);
  expect(res.status).toBe(502);
  expect(typeof (await res.json()).error).toBe('string');
});

it('maps other errors to 500 and keeps serving', async () => {
  let calls = 0;
  const base = await start({
    getRandom: async () => {
      if (calls++ === 0) throw new Error('boom');
      return quote;
    },
  });
  const bad = await fetch(`${base}/api/quote`);
  expect(bad.status).toBe(500);
  expect(typeof (await bad.json()).error).toBe('string');
  const ok = await fetch(`${base}/api/quote`);
  expect(ok.status).toBe(200);
});

it('serves no other route and sends no CORS headers', async () => {
  const base = await start({ getRandom: async () => quote });
  const other = await fetch(`${base}/api/other`);
  expect(other.status).toBe(404);
  expect(await other.json()).toEqual({ error: 'Not found' });
  const post = await fetch(`${base}/api/quote`, { method: 'POST' });
  expect(post.status).toBe(404);
  expect(await post.json()).toEqual({ error: 'Not found' });
  const res = await fetch(`${base}/api/quote`, { headers: { Origin: 'http://x.test' } });
  expect(res.headers.get('access-control-allow-origin')).toBeNull();
});
