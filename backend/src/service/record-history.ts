import type { HistoryEntry } from '../domain/history-entry.ts';
import type { Quote } from '../domain/quote.ts';
import type { QuoteStore } from '../domain/quote-store.ts';
import { ValidationError } from '../domain/validation-error.ts';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

export function parseQuote(body: unknown): Quote {
  const b = body as Record<string, unknown> | null | undefined;
  if (
    typeof b !== 'object' ||
    b === null ||
    typeof b.id !== 'number' ||
    !Number.isSafeInteger(b.id) ||
    !isNonEmptyString(b.quote) ||
    !isNonEmptyString(b.author)
  ) {
    throw new ValidationError('Invalid quote');
  }
  return { id: b.id, quote: b.quote, author: b.author };
}

export async function recordHistory(store: QuoteStore, body: unknown, now: () => Date = () => new Date()): Promise<HistoryEntry> {
  const quote = parseQuote(body);
  return store.addHistory(quote, now().toISOString());
}
