import { useCallback, useEffect, useState } from 'react';
import type { Quote } from '../domain/quote.ts';

export type QuoteStatus = 'loading' | 'ready' | 'error';

export function useQuote(): { quote: Quote | null; status: QuoteStatus; refetch: () => void } {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [status, setStatus] = useState<QuoteStatus>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    (async () => {
      try {
        const res = await fetch('/api/quote', { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as Quote;
        if (controller.signal.aborted) return;
        setQuote(data);
        setStatus('ready');
      } catch {
        if (controller.signal.aborted) return;
        setQuote(null);
        setStatus('error');
      }
    })();
    return () => controller.abort();
  }, [attempt]);

  const refetch = useCallback(() => setAttempt((n) => n + 1), []);

  return { quote, status, refetch };
}
