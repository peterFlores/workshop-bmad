import type { HistoryEntry } from '../domain/history-entry.ts';
import type { QuoteStore } from '../domain/quote-store.ts';

export async function listHistory(store: QuoteStore): Promise<HistoryEntry[]> {
  return store.listHistory();
}
