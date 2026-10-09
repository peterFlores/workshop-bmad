import type { HistoryEntry } from './history-entry.ts';
import type { Quote } from './quote.ts';

export interface QuoteStore {
  addHistory(quote: Quote, recordedAt: string): HistoryEntry;
  listHistory(): HistoryEntry[];
  listFavorites(): Quote[];
  addFavorite(quote: Quote, favoritedAt: string): void;
  removeFavoriteAndHistory(quoteId: number): void;
}
