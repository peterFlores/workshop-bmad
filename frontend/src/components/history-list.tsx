import { Card } from '@heroui/react';
import type { HistoryEntry } from '../domain/history-entry.ts';

type Props = { history: HistoryEntry[]; status: 'loading' | 'ready' | 'error' };

export function HistoryList({ history, status }: Props) {
  return (
    <Card className="w-full rounded-[20px] border border-border bg-surface p-[var(--card-padding)] shadow-none">
      <h2 className="mb-3 text-sm font-medium text-muted">History</h2>
      {history.length === 0 ? (
        <p className="text-sm text-muted">
          {status === 'loading' ? 'Loading history...' : status === 'error' ? "Couldn't load history." : 'No history yet.'}
        </p>
      ) : (
        <ul className="flex flex-col">
          {history.map((entry) => (
            <li key={entry.entryId} className="border-t border-border py-3 first:border-t-0 first:pt-0 last:pb-0">
              <p className="text-foreground">{entry.quote.quote}</p>
              <p className="text-sm text-muted">{`— ${entry.quote.author}`}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
