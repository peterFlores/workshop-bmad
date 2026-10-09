import { useCallback, useEffect, useRef } from 'react';
import { FavoritesList } from '../components/favorites-list.tsx';
import { HistoryList } from '../components/history-list.tsx';
import { NewQuoteButton } from '../components/new-quote-button.tsx';
import { QuoteCard } from '../components/quote-card.tsx';
import type { Quote } from '../domain/quote.ts';
import { useFavorites } from '../hooks/use-favorites.ts';
import { useHistory } from '../hooks/use-history.ts';
import { useQuote } from '../hooks/use-quote.ts';

export function QuotePage() {
  const { quote, status, refetch } = useQuote();
  const { history, status: historyStatus, refresh } = useHistory();
  const { favorites, isFavorite, isPending, toggle, status: favoritesStatus } = useFavorites();
  const recorded = useRef<Quote | null>(null);

  const onToggle = useCallback(
    async (q: Quote) => {
      const result = await toggle(q);
      if (result === 'removed') refresh();
      return result;
    },
    [toggle, refresh],
  );

  useEffect(() => {
    if (status !== 'ready' || quote === null || recorded.current === quote) return;
    recorded.current = quote;
    (async () => {
      try {
        const res = await fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(quote),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        refresh();
      } catch (error) {
        console.error('Failed to record history', error);
      }
    })();
  }, [quote, status, refresh]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-6 text-foreground sm:px-6">
      <div className="flex w-full max-w-[640px] flex-col gap-6">
        <QuoteCard quote={quote} status={status} isFavorite={isFavorite} isPending={isPending} onToggle={(q) => void onToggle(q)} />
        <NewQuoteButton isLoading={status === 'loading'} isError={status === 'error'} onPress={refetch} />
        <HistoryList history={history} status={historyStatus} isFavorite={isFavorite} isPending={isPending} onToggle={onToggle} />
        <FavoritesList favorites={favorites} status={favoritesStatus} isFavorite={isFavorite} isPending={isPending} onToggle={onToggle} />
      </div>
    </main>
  );
}
