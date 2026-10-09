# Epic 3 Context: Remember and favorite quotes

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Let a user see the quotes already shown to them (History) and heart the ones they like (Favorites). Both survive an app restart, with no separate database server, so the presenter can stop and restart the demo and find everything intact. Epics 1 and 2 (quote fetch, New quote button, error state) are done and this builds on them.

## Stories

- Story 3.1: Quote history that survives restarts
- Story 3.2: Heart a quote to save it as a favorite

## Requirements & Constraints

- Every quote displayed is recorded in history; history lists newest first with text and author, no cap, repeats allowed.
- Each displayed quote (card and list rows) has a heart that toggles favorite. Unfavoriting also removes every history entry of that quote. A favorites view shows all favorites.
- History and favorites persist across restarts in the same order. Storage needs no database server; the app still runs with one command per part.
- Heart is keyboard-operable, has an accessible name, and exposes state without relying on color alone.
- Single user: one shared history and favorites set per install. Out of scope: history cap, pagination, schema migrations beyond create-if-missing, sharing, accounts.
- Strict TDD: tests first, colocated `*.test.ts(x)`; tests never hit dummyjson.com.

## Technical Decisions

- Backend is hexagonal: a synchronous `QuoteStore` port, implemented only by `adapters/sqlite` on better-sqlite3 13.0.3. `service` and the port never import Express, `fetch`, or `better-sqlite3`.
- Port methods: `addHistory(quote, recordedAt): HistoryEntry`, `listHistory()`, `listFavorites()`, `addFavorite(quote, favoritedAt)` (insert-or-ignore), `removeFavoriteAndHistory(quoteId)` (single transaction, the only delete).
- Storage: one file at `DATA_FILE` (default `backend/data/quotes.db`, resolved from the backend package root, not the cwd, gitignored). Schema created if missing; WAL off, synchronous writes. A corrupt or locked file fails startup fast with a console error and non-zero exit, and is never deleted. Demo reset: stop the backend and delete the file.
- Pins: Node 24.21.0 (engines `^24`, `.nvmrc`), Express 5.3.0, `@types/better-sqlite3` 9.6.0, `@types/node` 24.x, tsx.
- `HistoryEntry = { entryId: number; quote: Quote; recordedAt: string }`. `entryId` is `INTEGER PRIMARY KEY AUTOINCREMENT` and defines order. `recordedAt` is ISO-8601 UTC, set by the service.
- `GET /api/quote` records nothing. The frontend calls `POST /api/history` (body `Quote`) exactly once per quote rendered in `ready` state. `QuotePage` guards with a ref keyed on the quote object (StrictMode-safe). It returns 201 with the entry; the body is validated (`id` number, non-empty `quote` and `author`). A failed record is only logged to `console` and never hides the quote.
- `GET /api/history` returns `HistoryEntry[]` newest first, no envelope, `[]` when empty.
- Quote identity is the upstream `quote.id`. Favorites are a separate table keyed by `quote.id`, holding a snapshot of quote and author plus `favoritedAt`.
  - `GET /api/favorites` returns `Quote[]`, newest favorite first.
  - `PUT /api/favorites/:id` takes a `Quote` body. The path id must equal `body.id`, else 400. A repeat PUT keeps the first snapshot. Returns 204.
  - `DELETE /api/favorites/:id` returns 204. If the quote is a favorite, one transaction removes the favorite and all its history rows. If not, nothing changes.
- Invalid bodies or ids return 400 `{ "error": string }` (same shape as 502/500 errors; no success envelope).
- Frontend: `useFavorites` returns `{ favorites, isFavorite(quoteId), toggle(quote), status }`. It is called once in `QuotePage` and is the only source of heart state. `toggle` is confirm-then-update (no optimistic UI) and ignores calls for an id whose request is pending. `useHistory` returns `{ history, status, refresh }`, with `refresh` latest-wins. `QuotePage` calls `refresh` after each successful history POST and after each toggle that removes a favorite.
- Components under `components/` take props only and never call `fetch`. New presentational components: `HeartButton` (`{ isFavorite, onToggle }`, HeroUI `Button`, icon only), `HistoryList`, `FavoritesList`. Every heart receives the same `onToggle`; history rows call it with `entry.quote`.
- Test strategy: one shared `QuoteStore` contract suite runs against the in-memory fake and the sqlite adapter (`:memory:`). One temp-file test closes and reopens the database to prove restart persistence. It also covers atomicity of `removeFavoriteAndHistory` on forced failure. Service and HTTP tests use the fake store. Frontend tests stub `/api/*`.
- Conventions: kebab-case files, PascalCase components, JSON only, logging via `console` only. Frontend calls only relative `/api/*` (Vite proxy, no CORS).

## UX & Interaction Patterns

- Page layout: quote card, then History card, then Favorites card, stacked in the same 640px column with a 24px gap. No tabs, drawer, title, or other icons (the heart is the only icon).
- Heart: icon-only ghost HeroUI `Button`, at least 44px square on phones. Outline in muted color when off, filled in accent color when on. Top right of the quote card and right side of each list row. Accent is used only for the primary button, the focus ring, and the filled heart.
- Heart behavior: native `<button>` with constant accessible name "Favorite this quote" and `aria-pressed` true or false. Updates only after server confirmation. Disabled while its own request is pending (on the card also while a quote is loading). Not shown in the error state. On failure it keeps its previous state and the page stays usable. No animation beyond the HeroUI pressed state.
- List sections: HeroUI `Card` with a small heading ("History", "Favorites"). Real `<ul>`/`<li>` rows separated by a hairline surface-border. Each row shows the quote in body typography, the author below in the author token with an em dash, and the heart at the right (no serif quote size in lists). Each row's quote text is linked to its heart via `aria-describedby`. Empty lists show one muted line ("No history yet." / "No favorites yet.") under the heading. The currently shown quote appears at the top of History once displayed.
- Tab order: card content, heart, "New quote" (or retry), History rows, Favorites rows.
- Focus after removal: when unfavoriting removes the focused row, focus moves to the next row's heart, or to the section heading if none remain.
- Banned: undo toasts, sound, confetti, gestures, auto-refresh.
- No horizontal scroll under 640px.

## Cross-Story Dependencies

- Story 3.2 depends on Story 3.1: it reuses the `QuoteStore` port, sqlite adapter, in-memory fake, contract suite, `useHistory`, and the History section, and extends them with favorites methods and routes.
- Story 3.1 introduces the `better-sqlite3` and Node 24 pin changes and the README additions (`DATA_FILE`, demo reset, Node 24 requirement).
- Both build on the Epic 1 and 2 `QuotePage`, `useQuote`, and `QuoteCard`; the card heart must respect `useQuote` loading and error status.
