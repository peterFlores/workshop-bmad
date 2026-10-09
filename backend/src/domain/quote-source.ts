import type { Quote } from './quote.ts';

export interface QuoteSource {
  getRandom(): Promise<Quote>;
}
