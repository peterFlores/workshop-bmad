import { describe, expect, it, vi } from 'vitest';
import { UpstreamError } from '../../domain/upstream-error.ts';
import { createDummyJsonQuoteSource } from './dummyjson-quote-source.ts';

const url = 'https://example.test/quotes/random';
const wire = { id: 88, quote: "That'S The Real Trouble", author: 'Walt Disney' };
const json = (body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), init);
const make = (fetch: typeof globalThis.fetch, timeoutMs = 1000) =>
  createDummyJsonQuoteSource({ url, timeoutMs, fetch });

describe('dummyjson quote source', () => {
  it('requests the url once and strips extra fields, keeping text byte-exact', async () => {
    const fetch = vi.fn(async () => json({ ...wire, extra: 'x', tags: [] }));
    const result = await make(fetch as unknown as typeof globalThis.fetch).getRandom();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect((fetch.mock.calls[0] as unknown[])[0]).toBe(url);
    expect(result).toEqual(wire);
    expect(Object.keys(result).sort()).toEqual(['author', 'id', 'quote']);
  });

  it('aborts and throws UpstreamError on timeout', async () => {
    const fetch = vi.fn(
      (_url: unknown, init?: RequestInit) =>
        new Promise<Response>((_, reject) => {
          init?.signal?.addEventListener('abort', () => reject(init.signal?.reason));
        }),
    );
    await expect(make(fetch as unknown as typeof globalThis.fetch, 20).getRandom()).rejects.toBeInstanceOf(UpstreamError);
  });

  it('throws UpstreamError when fetch rejects', async () => {
    const fetch = async () => {
      throw new TypeError('network');
    };
    await expect(make(fetch).getRandom()).rejects.toBeInstanceOf(UpstreamError);
  });

  it('throws UpstreamError on non-2xx', async () => {
    const fetch = async () => json(wire, { status: 503 });
    await expect(make(fetch).getRandom()).rejects.toBeInstanceOf(UpstreamError);
  });

  it('throws UpstreamError on invalid JSON', async () => {
    const fetch = async () => new Response('<html>', { status: 200 });
    await expect(make(fetch).getRandom()).rejects.toBeInstanceOf(UpstreamError);
  });

  it.each(['id', 'quote', 'author'])('throws UpstreamError when %s is missing', async (field) => {
    const body: Record<string, unknown> = { ...wire };
    delete body[field];
    const fetch = async () => json(body);
    await expect(make(fetch).getRandom()).rejects.toBeInstanceOf(UpstreamError);
  });

  it.each([{ id: '88' }, { quote: 5 }, { author: null }])('throws UpstreamError on wrong field types %j', async (patch) => {
    const fetch = async () => json({ ...wire, ...patch });
    await expect(make(fetch).getRandom()).rejects.toBeInstanceOf(UpstreamError);
  });

  it.each([null, 'text', 42, []])('throws UpstreamError when body is %j', async (body) => {
    const fetch = async () => json(body);
    await expect(make(fetch).getRandom()).rejects.toBeInstanceOf(UpstreamError);
  });
});
