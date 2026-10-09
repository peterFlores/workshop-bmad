import { Card } from '@heroui/react';
import type { HistoryEntry } from '../domain/history-entry.ts';
import type { Quote } from '../domain/quote.ts';
import type { ToggleResult } from '../hooks/use-favorites.ts';
import { useFocusHandoff } from '../hooks/use-focus-handoff.ts';
import { HeartButton } from './heart-button.tsx';

type Props = {
  history: HistoryEntry[];
  status: 'loading' | 'ready' | 'error';
  isFavorite: (quoteId: number) => boolean;
  isPending: (quoteId: number) => boolean;
  onToggle: (quote: Quote) => Promise<ToggleResult>;
};

export function HistoryList({ history, status, isFavorite, isPending, onToggle }: Props) {
  const { headingRef, listRef, run } = useFocusHandoff(history);
  return (
    <Card className="w-full rounded-[20px] border border-border bg-surface p-[var(--card-padding)] shadow-none">
      <h2 ref={headingRef} tabIndex={-1} className="mb-3 text-sm font-medium text-muted outline-none focus-visible:ring-2 focus-visible:ring-accent">
        History
      </h2>
      {history.length === 0 ? (
        <p className="text-sm text-muted">
          {status === 'loading' ? 'Loading history...' : status === 'error' ? "Couldn't load history." : 'No history yet.'}
        </p>
      ) : (
        <ul ref={listRef} className="flex flex-col">
          {history.map((entry, index) => {
            // Unfavoriting removes every row of this quote, so the next surviving row is the first with another id.
            const next = history.slice(index + 1).find((e) => e.quote.id !== entry.quote.id);
            return (
              <li
                key={entry.entryId}
                data-row-key={entry.entryId}
                className="flex items-start justify-between gap-3 border-t border-border py-3 first:border-t-0 first:pt-0 last:pb-0"
              >
                <div>
                  <p id={`history-quote-${entry.entryId}`} className="text-foreground">{entry.quote.quote}</p>
                  <p className="text-sm text-muted">{`— ${entry.quote.author}`}</p>
                </div>
                <HeartButton
                  isFavorite={isFavorite(entry.quote.id)}
                  isDisabled={isPending(entry.quote.id)}
                  describedBy={`history-quote-${entry.entryId}`}
                  onToggle={() =>
                    void run(String(entry.entryId), next ? String(next.entryId) : null, () => onToggle(entry.quote))
                  }
                />
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
