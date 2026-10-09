import type { Quote } from './quote.ts';

export type HistoryEntry = { entryId: number; quote: Quote; recordedAt: string };
