import { Card, Skeleton } from '@heroui/react';
import { useEffect, useState } from 'react';
import type { Quote } from '../domain/quote.ts';
import type { QuoteStatus } from '../hooks/use-quote.ts';

type Props = { quote: Quote | null; status: QuoteStatus };

const FADE_OUT_MS = 150;

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function QuoteCard({ quote, status }: Props) {
  const [displayed, setDisplayed] = useState<Quote | null>(quote);
  const [phase, setPhase] = useState<'idle' | 'out'>('idle');

  useEffect(() => {
    if (quote === displayed) {
      setPhase('idle');
      return;
    }
    if (quote === null || displayed === null || prefersReducedMotion()) {
      setDisplayed(quote);
      setPhase('idle');
      return;
    }
    setPhase('out');
    const timer = setTimeout(() => {
      setDisplayed(quote);
      setPhase('idle');
    }, FADE_OUT_MS);
    return () => clearTimeout(timer);
  }, [quote, displayed]);

  return (
    <Card className="w-full rounded-[20px] border border-border bg-surface p-[var(--card-padding)] shadow-none">
      <div data-testid="card-content" className="flex min-h-[164px] flex-col gap-6">
        {status === 'error' && (
          <p role="alert" className="text-danger">
            Couldn't load a quote. Please try again.
          </p>
        )}
        <div data-testid="quote-region" aria-live="polite" className="flex flex-col gap-6">
          {status === 'loading' && <p className="sr-only">Loading a new quote</p>}
          {status === 'error' ? null : displayed ? (
            <div data-testid="quote-fade" data-phase={phase} className="quote-fade flex flex-col gap-6">
              <p className="quote-text text-foreground">{displayed.quote}</p>
              <p className="quote-author">{`— ${displayed.author}`}</p>
            </div>
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
      </div>
    </Card>
  );
}
