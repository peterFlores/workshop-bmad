import { Card, Skeleton } from '@heroui/react';
import type { Quote } from '../domain/quote.ts';
import type { QuoteStatus } from '../hooks/use-quote.ts';

type Props = { quote: Quote | null; status: QuoteStatus };

export function QuoteCard({ quote, status }: Props) {
  return (
    <Card className="w-full rounded-[20px] border border-border bg-surface p-[var(--card-padding)] shadow-none">
      <div data-testid="quote-region" aria-live="polite" className="flex flex-col gap-6">
        {status === 'ready' && quote ? (
          <>
            <p className="quote-text text-foreground">{quote.quote}</p>
            <p className="quote-author">{`— ${quote.author}`}</p>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              <Skeleton className="h-8 w-full rounded-lg" />
              <Skeleton className="h-8 w-11/12 rounded-lg" />
              <Skeleton className="h-8 w-2/3 rounded-lg" />
            </div>
            <Skeleton className="h-5 w-1/3 rounded-lg" />
          </>
        )}
      </div>
    </Card>
  );
}
