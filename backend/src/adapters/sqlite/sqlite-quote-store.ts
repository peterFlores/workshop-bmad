import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';
import type { HistoryEntry } from '../../domain/history-entry.ts';
import type { Quote } from '../../domain/quote.ts';
import type { QuoteStore } from '../../domain/quote-store.ts';

export type SqliteQuoteStore = QuoteStore & { close(): void };

type HistoryRow = { entry_id: number; quote_id: number; quote: string; author: string; recorded_at: string };
type FavoriteRow = { quote_id: number; quote: string; author: string };

const SCHEMA = `
CREATE TABLE IF NOT EXISTS history (
  entry_id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_id INTEGER NOT NULL,
  quote TEXT NOT NULL,
  author TEXT NOT NULL,
  recorded_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS history_quote_id ON history (quote_id);
CREATE TABLE IF NOT EXISTS favorites (
  quote_id INTEGER PRIMARY KEY,
  quote TEXT NOT NULL,
  author TEXT NOT NULL,
  favorited_at TEXT NOT NULL
);
`;

export function openSqliteQuoteStore(file: string): SqliteQuoteStore {
  if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
  const db = new Database(file);
  try {
    db.pragma('journal_mode = DELETE');
    db.pragma('synchronous = FULL');
    db.exec(SCHEMA);
  } catch (error) {
    db.close();
    throw error;
  }

  const insertHistory = db.prepare('INSERT INTO history (quote_id, quote, author, recorded_at) VALUES (?, ?, ?, ?)');
  const selectHistory = db.prepare('SELECT entry_id, quote_id, quote, author, recorded_at FROM history ORDER BY entry_id DESC');
  const selectFavorites = db.prepare('SELECT quote_id, quote, author FROM favorites ORDER BY favorited_at DESC, rowid DESC');
  const insertFavorite = db.prepare('INSERT OR IGNORE INTO favorites (quote_id, quote, author, favorited_at) VALUES (?, ?, ?, ?)');
  const deleteFavorite = db.prepare('DELETE FROM favorites WHERE quote_id = ?');
  const deleteHistory = db.prepare('DELETE FROM history WHERE quote_id = ?');

  const removeTx = db.transaction((quoteId: number) => {
    const removed = deleteFavorite.run(quoteId);
    if (removed.changes > 0) deleteHistory.run(quoteId);
  });

  return {
    addHistory(quote: Quote, recordedAt: string): HistoryEntry {
      const result = insertHistory.run(quote.id, quote.quote, quote.author, recordedAt);
      return { entryId: Number(result.lastInsertRowid), quote: { ...quote }, recordedAt };
    },
    listHistory() {
      return (selectHistory.all() as HistoryRow[]).map((r) => ({
        entryId: r.entry_id,
        quote: { id: r.quote_id, quote: r.quote, author: r.author },
        recordedAt: r.recorded_at,
      }));
    },
    listFavorites() {
      return (selectFavorites.all() as FavoriteRow[]).map((r) => ({ id: r.quote_id, quote: r.quote, author: r.author }));
    },
    addFavorite(quote, favoritedAt) {
      insertFavorite.run(quote.id, quote.quote, quote.author, favoritedAt);
    },
    removeFavoriteAndHistory(quoteId) {
      removeTx(quoteId);
    },
    close() {
      db.close();
    },
  };
}
