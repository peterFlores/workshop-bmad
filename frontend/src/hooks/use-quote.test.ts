import { act, renderHook, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useQuote } from './use-quote.ts';

const body = { id: 88, quote: "That'S The Real Trouble With The World, Too Many People Grow Up", author: 'Walt Disney' };
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });

afterEach(() => vi.unstubAllGlobals());

describe('useQuote', () => {
  it('fetches /api/quote once on mount and moves loading to ready', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(body));
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useQuote());
    expect(result.current.status).toBe('loading');
    expect(result.current.quote).toBeNull();
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.quote).toEqual(body);
    expect(result.current.quote?.quote).toBe("That'S The Real Trouble With The World, Too Many People Grow Up");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/quote');
  });

  it('stays at one effective result under StrictMode double-invoke', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(json(body)));
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useQuote(), { wrapper: StrictMode });
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.quote).toEqual(body);
  });

  it('gives error on HTTP failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ error: 'bad' }, 502)));
    const { result } = renderHook(() => useQuote());
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.quote).toBeNull();
  });

  it('gives error when fetch rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network')));
    const { result } = renderHook(() => useQuote());
    await waitFor(() => expect(result.current.status).toBe('error'));
  });

  it('gives error when body is not JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>', { status: 200 })));
    const { result } = renderHook(() => useQuote());
    await waitFor(() => expect(result.current.status).toBe('error'));
  });

  it('refetch re-requests', async () => {
    const next = { id: 2, quote: 'Other', author: 'Someone' };
    const fetchMock = vi.fn().mockResolvedValueOnce(json(body)).mockResolvedValueOnce(json(next));
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useQuote());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    act(() => result.current.refetch());
    await waitFor(() => expect(result.current.quote).toEqual(next));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  describe('abort and stale-response guard', () => {
    const deferred = () => {
      let resolve!: (r: Response) => void;
      let reject!: (e: unknown) => void;
      const promise = new Promise<Response>((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve, reject };
    };
    const newer = { id: 2, quote: 'Newer', author: 'B' };

    it('aborts the previous request signal on refetch', async () => {
      const first = deferred();
      const second = deferred();
      const fetchMock = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
      vi.stubGlobal('fetch', fetchMock);
      const { result } = renderHook(() => useQuote());
      const signal = fetchMock.mock.calls[0][1].signal as AbortSignal;
      expect(signal.aborted).toBe(false);
      act(() => result.current.refetch());
      expect(signal.aborted).toBe(true);
      second.resolve(json(newer));
      await waitFor(() => expect(result.current.status).toBe('ready'));
    });

    it('ignores an older response that resolves after the newer one', async () => {
      const first = deferred();
      const second = deferred();
      vi.stubGlobal('fetch', vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise));
      const { result } = renderHook(() => useQuote());
      act(() => result.current.refetch());
      second.resolve(json(newer));
      await waitFor(() => expect(result.current.quote).toEqual(newer));
      await act(async () => {
        first.resolve(json(body));
        await first.promise;
      });
      expect(result.current.quote).toEqual(newer);
    });

    it('does not set error when an aborted request rejects', async () => {
      const first = deferred();
      const second = deferred();
      vi.stubGlobal('fetch', vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise));
      const { result } = renderHook(() => useQuote());
      act(() => result.current.refetch());
      second.resolve(json(newer));
      await waitFor(() => expect(result.current.status).toBe('ready'));
      await act(async () => {
        first.reject(new DOMException('aborted', 'AbortError'));
        await first.promise.catch(() => {});
      });
      expect(result.current.status).toBe('ready');
      expect(result.current.quote).toEqual(newer);
    });
  });
});
