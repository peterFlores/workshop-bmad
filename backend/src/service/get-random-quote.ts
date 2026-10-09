import type { Quote } from '../domain/quote.ts';
import type { QuoteSource } from '../domain/quote-source.ts';

export function getRandomQuote(source: QuoteSource): Promise<Quote> {
  return source.getRandom();
}
