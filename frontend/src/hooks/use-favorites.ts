import { useCallback, useEffect, useRef, useState } from 'react';
import type { Quote } from '../domain/quote.ts';

export type FavoritesStatus = 'loading' | 'ready' | 'error';
export type ToggleResult = 'added' | 'removed' | 'failed' | 'ignored';

export function useFavorites(): {
  favorites: Quote[];
  isFavorite: (quoteId: number) => boolean;
  isPending: (quoteId: number) => boolean;
  toggle: (quote: Quote) => Promise<ToggleResult>;
  status: FavoritesStatus;
} {
  const [favorites, setFavorites] = useState<Quote[]>([]);
  const [status, setStatus] = useState<FavoritesStatus>('loading');
  const [pending, setPending] = useState<ReadonlySet<number>>(new Set());
  const pendingRef = useRef(new Set<number>());
  const favoritesRef = useRef<Quote[]>([]);
  favoritesRef.current = favorites;
  const statusRef = useRef<FavoritesStatus>('loading');
  statusRef.current = status;

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch('/api/favorites', { signal: ctrl.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setFavorites((await res.json()) as Quote[]);
        setStatus('ready');
      } catch (error) {
        if (ctrl.signal.aborted) return;
        console.error('Failed to load favorites', error);
        setStatus('error');
      }
    })();
    return () => ctrl.abort();
  }, []);

  const isFavorite = useCallback((quoteId: number) => favorites.some((f) => f.id === quoteId), [favorites]);
  // Hearts stay disabled until the favorites list has loaded; before that, "is this a favorite?" is unknown.
  const isPending = useCallback((quoteId: number) => status !== 'ready' || pending.has(quoteId), [pending, status]);

  const toggle = useCallback(async (quote: Quote): Promise<ToggleResult> => {
    if (statusRef.current !== 'ready' || pendingRef.current.has(quote.id)) return 'ignored';
    pendingRef.current.add(quote.id);
    setPending(new Set(pendingRef.current));
    const wasFavorite = favoritesRef.current.some((f) => f.id === quote.id);
    try {
      const res = await fetch(`/api/favorites/${quote.id}`, {
        method: wasFavorite ? 'DELETE' : 'PUT',
        ...(wasFavorite
          ? {}
          : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(quote) }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (wasFavorite) {
        setFavorites((prev) => prev.filter((f) => f.id !== quote.id));
        return 'removed';
      }
      setFavorites((prev) => (prev.some((f) => f.id === quote.id) ? prev : [quote, ...prev]));
      return 'added';
    } catch (error) {
      console.error('Failed to toggle favorite', error);
      return 'failed';
    } finally {
      pendingRef.current.delete(quote.id);
      setPending(new Set(pendingRef.current));
    }
  }, []);

  return { favorites, isFavorite, isPending, toggle, status };
}
