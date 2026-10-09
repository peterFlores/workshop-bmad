import { expect, it } from 'vitest';
import type { QuoteSource } from '../domain/quote-source.ts';
import { getRandomQuote } from './get-random-quote.ts';

it('returns the source quote unchanged', async () => {
  const quote = {
    id: 88,
    quote: "That'S The Real Trouble With The World, Too Many People Grow Up",
    author: 'Walt Disney',
  };
  const source: QuoteSource = { getRandom: async () => quote };
  expect(await getRandomQuote(source)).toEqual(quote);
});
