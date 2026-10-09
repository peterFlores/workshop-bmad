# Adversarial Review — Architecture Spine vs Updated PRD (FR-13..19, NFR-5/6)

Reviewed: ARCHITECTURE-SPINE.md (updated 2026-10-08, binds FR-1..12, NFR-1..4) against PRD updated 2026-10-09.

## Verdict

The spine does not cover the new features at all, and worse, its current rules actively contradict them (stateless backend, no persistence, `useQuote` owns ALL state); every history/favorites decision below is open, so two compliant teams will diverge.

## Method

For each hole: Unit A and Unit B, both obeying every existing AD literally, build incompatible things.

## Findings

### F-1 [CRITICAL] Spine contradicts the PRD: "Backend stateless; no persistence" and "persistence: not needed in v1"

- Conventions table: "Backend stateless; no persistence". Deferred: "persistence: not needed in v1". `binds` omits FR-13..19, NFR-5, NFR-6. Capability map has no row for them.
- Pair: Unit A (history) adds a JSON file and cites the PRD. Unit B (favorites) reads the convention literally and keeps favorites in an in-memory `Map` in `service` ("backend stateless" is violated either way, but B can argue NFR-5 is unbound). Both are "compliant" with some AD. Restart loses B's data, FR-19 fails.
- Fix: update the convention row; add `binds` for FR-13..19, NFR-5/6; delete the persistence line from Deferred.

### F-2 [CRITICAL] Who records history is undecided; double or zero recording

- AD-1 says `service` depends only on `QuoteSource.getRandom()`. FR-13 says "every quote displayed" is recorded. AD-5 says all fetch state is in `useQuote`.
- Pair: Unit A (backend) records in `getRandomQuote` on each `GET /api/quote`. Unit B (frontend) calls a new `POST /api/history` from `useQuote` after `status` becomes `ready`. Result: every quote recorded twice. Alternatively, each assumes the other does it: zero recorded.
- Divergent semantics even if only one records: backend-on-GET records quotes that were fetched but never displayed (browser aborted, React StrictMode double-invoke of the first-load effect in dev yields two fetches, two history rows for one displayed quote; FR-8 + React 19 StrictMode). Frontend-recording records exactly "displayed" but fails when the POST fails (NFR-5/FR-13 silent loss), and retries can double-post.
- Also AD-3 says non-2xx on GET maps to error state; if GET now writes and the write fails (disk), does GET return 500 and hide a quote the user could have seen? Undefined.
- Fix (new AD-8): single owner of history writes = backend `service.getRandomQuote` on successful upstream fetch (the only place that is idempotent-by-request and atomic with the response). Define "displayed" = "successfully returned by GET /api/quote". Write failure policy: log and still return the quote (or fail 500; pick one). Frontend never writes history. Dev StrictMode double-fetch must be addressed (guard in `useQuote` effect, or accept duplicates per the PRD's "repeats allowed" and say so).

### F-3 [CRITICAL] Quote identity and "remove every entry of that quote" (FR-17) have no keying rule

- AD-2 fixes `Quote = {id, quote, author}` but never says `id` is the identity. Upstream ids are dummyjson's (1..~1454), global, numeric.
- Pair: Unit A keys favorites by `id`. Unit B keys history entries by an own generated `entryId` and matches "every entry of that quote" by `(quote, author)` text. Same quote text with different upstream ids (dummyjson contains near-duplicate quotes) or ids reused after an upstream data change: unfavoriting one removes the other's entries, or leaves entries behind. Unit B also may overwrite `id` with its own entry id, breaking AD-2 passthrough on the history list.
- Heart state in the history list needs a join key; if history items carry `id` = upstream id and favorites keyed by upstream id, join works; any other choice breaks FR-17's "heart shows whether currently favorite".
- Fix (new AD-9): quote identity = upstream `id` only. History entry = `{ entryId: string|number (storage-internal, never exposed as `id`), quote: Quote, viewedAt: ISO string }` or flatten as agreed in one shape. Favorites = set of quote ids with a stored snapshot of `Quote` (snapshot required because upstream cannot be re-queried by id cheaply and text must not drift; AD-2). Unfavorite deletes by `quote.id` from history.

### F-4 [CRITICAL] Two owners of one entity: favorite state and quote snapshot

- Favorite state can be derived (history rows carry `isFavorite`) or stored (separate favorites collection). Not stated.
- Pair: Unit A stores `isFavorite` flag on each history entry and makes the favorites page `filter(isFavorite)` over history. Unit B stores a separate favorites list. FR-17 removes ALL history entries on unfavorite, so Unit A's favorites view would lose the favorite itself (data deleted with the history). Unit B's works. Mixed together: heart says favorite but favorites page empty, or the reverse.
- Also frontend: `useQuote` returns the current quote; a new `useFavorites` holds the favorite set client-side (optimistic) while the backend holds truth. Two sources of truth for the heart on the main card.
- Fix (new AD): favorites are an independent collection; backend is the only source of truth; responses that list quotes (`GET /api/quote`, history) carry no `isFavorite` unless decided here. Decide explicitly: heart state is derived in the frontend from one `useFavorites` id-set; or the API embeds `favorite: boolean`. Choose one.

### F-5 [HIGH] Storage ownership, location, and port placement

- AD-1 has one port, `QuoteSource`. Persistence needs a driven port too (`HistoryStore`/`FavoritesStore`); nothing says whether it is one port or two, nor where the file lives.
- Pair: Unit A adds `HistoryRepository` port + JSON adapter writing `./data/history.json` relative to `process.cwd()`. Unit B adds `FavoritesRepository` writing `~/.rqg/favorites.json`, or uses `node:sqlite` in `backend/quotes.db`. Run from repo root (`npm run dev -w backend` sets cwd to `backend/`, but `node dist/main.js` from root differs): history is found/not found depending on cwd, FR-15/19 break non-deterministically ("history gone after restart" on stage).
- Two files, two formats, two failure modes. NFR-1 minimal deps: `better-sqlite3` (native build) vs `node:sqlite` (Node 24 built-in, experimental flag state to verify) vs JSON file; unspecified.
- Env var table lacks a data path.
- Fix (new AD): one `Storage` port per aggregate or one combined; one adapter; one file; path from env `DATA_FILE` default resolved relative to the backend package root (not cwd), gitignored; format version field. Name the engine (recommend JSON file for NFR-1, or node:sqlite) in Stack.

### F-6 [HIGH] Atomicity and concurrent mutation

- Unfavorite = delete favorite + delete N history entries (FR-17). Record history = append. With a JSON file, read-modify-write.
- Pair: Unit A implements each as read-file, mutate, write-file (non-atomic, no lock). Two near-simultaneous requests (StrictMode double fetch + user click; unfavorite racing an append) lose an update: unfavorited quote reappears in history, or a recorded entry vanishes. Unit B uses an in-process mutex plus write-temp-then-rename. Crash mid-write (demo kill with Ctrl-C) truncates Unit A's file, startup throws, app unrunnable (NFR-4).
- Unfavorite across two collections (if F-4 separate) is not a single transaction: favorite removed, history delete fails, half-applied.
- Fix (new AD): all mutations go through one serialized in-process write queue; writes are temp-file + atomic rename; unfavorite is one store operation (`removeFavorite(id)` deleting both), never two service calls; corrupt/missing file on startup = empty store with a console warning, not a crash.

### F-7 [HIGH] API surface for history/favorites is unspecified; AD-2/AD-3 stretched in incompatible ways

- FR-1 only names `GET /api/quote`. No routes, verbs, or shapes for FR-14, 16, 17, 18.
- Pair: Unit A: `GET /api/history` returns bare `Quote[]`; `POST /api/favorites` body `{id}`; `DELETE /api/favorites/:id` returns 204. Unit B (frontend): calls `POST /api/favorites/:id/toggle`, expects `{favorite: boolean}`, and `GET /api/history` expecting `{items: [...]}`. Conventions say "no envelope on success", so B violates it, but A's bare array hides entries lacking `viewedAt`, and which one wins is arbitrary.
- Unfavorite is idempotent? Favoriting an already-favorite quote: 200, 409? Unfavorite non-existent: 404 vs 204 (the frontend `useQuote`-style "any non-2xx = error" rule from AD-3 turns a harmless double-click race into an error banner).
- Needs request-body trust: the favorites POST needs the quote snapshot from the client (`{id, quote, author}`) or only `id` (then backend needs the quote: from history). Client-supplied text violates "text never transformed" trust and allows forging; id-only requires the quote to be in history (but history is deleted on unfavorite, so re-favorite from the main card of a fresh quote works only if GET already recorded it, tying back to F-2).
- Fix: add an API table to the spine (routes, verbs, status codes, bodies) and state idempotency; extend AD-3's error rule to 404/400 with the same `{error}` shape.

### F-8 [HIGH] Frontend state split between `useQuote` and new hooks violates AD-5 as written

- AD-5: "All fetch state lives in `useQuote`", return type `{quote, status, refetch}`. FR-17 needs heart toggles on card and history rows; FR-14/18 need list fetches.
- Pair: Unit A extends `useQuote` to also return `history`, `favorites`, `toggleFavorite` (literal AD-5). Unit B creates `useHistory` and `useFavorites` each with their own fetch state and status. Now the main card heart (A: state in `useQuote`) and history-row heart (B: `useFavorites`) disagree after a toggle; history list is stale after "New quote" (nothing refreshes it) or after unfavorite (entries must disappear).
- Unfavorite from the main card removes the current quote's history entry; the current card still shows the quote (it is "displayed") but it is no longer in history; is it re-recorded on re-favorite? Undefined.
- Loading/error contract: AD-5 button-disabled rule only covers `loading` of the quote; heart toggle in flight, history load error, favorites load error have no status/aria-live rules (NFR-3/NFR-6).
- Fix (amend AD-5): `useQuote` remains solely the quote fetch. Add `useFavorites` (owns favorite id-set + toggle; the single source for every heart) and `useHistory` (owns list + refresh). Cross-hook invalidation rule: after `toggleFavorite(remove)` call `history.refresh()`; after a successful quote fetch call `history.refresh()` (or mutate locally, pick one). Shared state held in a context/provider or lifted into `QuotePage`; name which. Presentational `HeartButton` props: `{ isFavorite, onToggle, pending, label }`; `aria-pressed` per NFR-6.

### F-9 [MEDIUM] "Newest first" ordering and restart ordering unspecified

- Pair: Unit A stores append-order and the frontend reverses it. Unit B stores prepend-order and the backend returns as stored. A mix-up reverses the list; sorting by timestamp ties (same ms) produce unstable order after restart (FR-15 "same order").
- Fix: state that the backend returns newest first; order by monotonic sequence number, not wall-clock time.

### F-10 [MEDIUM] Unbounded growth and duplicate display in the history list

- PRD: no cap, repeats allowed (ASSUMPTION). Whole-file rewrite on each GET makes the write cost O(n) and the file unbounded; with F-6's atomic-rename that is a full rewrite per quote.
- Fix: record the decision in the spine (no cap, accepted); note the O(n) trade-off or pick append-only log (JSON Lines) so appends are O(1) and unfavorite is the only rewrite.

### F-11 [MEDIUM] AD-7 test strategy gaps

- Tests "mock at the port": a fake `QuoteSource` only. Store port has no test double rule; Unit A tests with a real temp file, Unit B with an in-memory fake; neither tests atomicity/restart (FR-15/19, NFR-5), which is the actual risk.
- Fix: extend AD-7: store port tested with a contract test run against both fake and file adapters, including a restart test (new adapter instance over same file) and corrupt-file test.

### F-12 [LOW] Stale spine metadata

- `updated: 2026-10-08` precedes the PRD change (2026-10-09), `status: final` is no longer true; Mermaid, Structural Seed (`domain/`, `service/getRandomQuote`, `hooks/useQuote`), runtime envelope ("two processes", fine), and Capability map omit the new modules; "Runtime envelope: Express :3001" unaffected.

## Proposed new/changed ADs (summary)

| ID | Rule |
| --- | --- |
| AD-8 | Backend `service.getRandomQuote` is the only history writer; "displayed" = returned by successful GET; frontend never writes history; write-failure policy stated |
| AD-9 | Quote identity = upstream `id`; history entry has its own internal entry key never exposed as `id`; unfavorite deletes by `quote.id` |
| AD-10 | Favorites are an independent collection with a `Quote` snapshot; backend is sole source of truth; `isFavorite` is not a stored field on history |
| AD-11 | One `Store` port (history + favorites), one file adapter, path from `DATA_FILE` resolved from the backend package root, serialized writes + atomic rename, unfavorite = single store op, corrupt file = empty store |
| AD-12 | API table (routes, verbs, status codes, shapes, idempotency); errors keep `{error}` |
| AD-5 (amend) | `useQuote` = quote only; `useFavorites` owns heart state; `useHistory` owns the list; cross-refresh rules; heart button a11y props |
| AD-7 (amend) | Store contract tests incl. restart and corrupt file |
| Conventions | Replace "stateless; no persistence" |
