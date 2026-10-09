import type { Quote } from '../domain/quote.ts';
import type { QuoteStore } from '../domain/quote-store.ts';
import { ValidationError } from '../domain/validation-error.ts';
import { parseQuote } from './record-history.ts';

function parseId(raw: string): number {
  const id = Number(raw);
  if (!/^-?\d+$/.test(raw) || !Number.isSafeInteger(id)) throw new ValidationError('Invalid id');
  return id;
}

export async function listFavorites(store: QuoteStore): Promise<Quote[]> {
  return store.listFavorites();
}

export async function addFavorite(
  store: QuoteStore,
  rawId: string,
  body: unknown,
  now: () => Date = () => new Date(),
): Promise<void> {
  const id = parseId(rawId);
  const quote = parseQuote(body);
  if (quote.id !== id) throw new ValidationError('Id mismatch');
  store.addFavorite(quote, now().toISOString());
}

export async function removeFavorite(store: QuoteStore, rawId: string): Promise<void> {
  store.removeFavoriteAndHistory(parseId(rawId));
}
