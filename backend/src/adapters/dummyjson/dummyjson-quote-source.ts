import type { Quote } from '../../domain/quote.ts';
import type { QuoteSource } from '../../domain/quote-source.ts';
import { UpstreamError } from '../../domain/upstream-error.ts';

type Options = { url: string; timeoutMs: number; fetch?: typeof globalThis.fetch };

function toQuote(data: unknown): Quote {
  const d = data as Record<string, unknown> | null;
  if (!d || typeof d.id !== 'number' || typeof d.quote !== 'string' || typeof d.author !== 'string') {
    throw new UpstreamError('Upstream response is missing required fields');
  }
  return { id: d.id, quote: d.quote, author: d.author };
}

export function createDummyJsonQuoteSource({ url, timeoutMs, fetch = globalThis.fetch }: Options): QuoteSource {
  return {
    async getRandom() {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
        if (!res.ok) throw new UpstreamError(`Upstream responded with ${res.status}`);
        return toQuote(await res.json());
      } catch (error) {
        if (error instanceof UpstreamError) throw error;
        throw new UpstreamError('Upstream request failed', { cause: error });
      }
    },
  };
}
