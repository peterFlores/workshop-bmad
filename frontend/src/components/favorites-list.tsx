import { Card } from '@heroui/react';
import type { Quote } from '../domain/quote.ts';
import type { FavoritesStatus, ToggleResult } from '../hooks/use-favorites.ts';
import { useFocusHandoff } from '../hooks/use-focus-handoff.ts';
import { HeartButton } from './heart-button.tsx';

type Props = {
  favorites: Quote[];
  status: FavoritesStatus;
  isFavorite: (quoteId: number) => boolean;
  isPending: (quoteId: number) => boolean;
  onToggle: (quote: Quote) => Promise<ToggleResult>;
};

export function FavoritesList({ favorites, status, isFavorite, isPending, onToggle }: Props) {
  const { headingRef, listRef, run } = useFocusHandoff(favorites);
  return (
    <Card className="w-full rounded-[20px] border border-border bg-surface p-[var(--card-padding)] shadow-none">
      <h2 ref={headingRef} tabIndex={-1} className="mb-3 text-sm font-medium text-muted outline-none focus-visible:ring-2 focus-visible:ring-accent">
        Favorites
      </h2>
      {favorites.length === 0 ? (
        <p className="text-sm text-muted">
          {status === 'loading' ? 'Loading favorites...' : status === 'error' ? "Couldn't load favorites." : 'No favorites yet.'}
        </p>
      ) : (
        <ul ref={listRef} className="flex flex-col">
          {favorites.map((quote, index) => {
            const next = favorites[index + 1];
            return (
              <li
                key={quote.id}
                data-row-key={quote.id}
                className="flex items-start justify-between gap-3 border-t border-border py-3 first:border-t-0 first:pt-0 last:pb-0"
              >
                <div>
                  <p id={`favorite-quote-${quote.id}`} className="text-foreground">{quote.quote}</p>
                  <p className="text-sm text-muted">{`— ${quote.author}`}</p>
                </div>
                <HeartButton
                  isFavorite={isFavorite(quote.id)}
                  isDisabled={isPending(quote.id)}
                  describedBy={`favorite-quote-${quote.id}`}
                  onToggle={() => void run(String(quote.id), next ? String(next.id) : null, () => onToggle(quote))}
                />
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
