# Adversarial Review 2 — Spine after AD-8..AD-11

Reviewed: ARCHITECTURE-SPINE.md (updated 2026-10-09) vs PRD (FR-1..19, NFR-1..6). Read-only on the spine.

## Verdict

AD-8..AD-11 close the ownership holes (storage, history writer, identity, hook owners), but the wire shapes, the PUT/DELETE edge semantics and the "displayed" definition are still open, so two units that obey every AD can still build mismatched client and server.

## Status of prior review (review-adversarial.md)

| Prior | Status |
| --- | --- |
| F-1 persistence contradiction | Closed (AD-8, conventions row) |
| F-2 who records history | Owner closed (AD-9). Write-failure policy and StrictMode/abort double-record still OPEN (N-3) |
| F-3 identity | Closed (AD-10: upstream id) |
| F-4 favorites vs history | Closed (separate table) |
| F-5 storage location | Closed (DATA_FILE from package root) |
| F-6 atomicity | Partly closed (DELETE is one transaction; sync driver). Corrupt/unopenable file policy still OPEN |
| F-7 API surface | Routes named, bodies/errors NOT (N-1, N-2) |
| F-8 frontend split | Closed (AD-11); race rules OPEN (N-4) |
| F-9 ordering | Closed for history (entryId desc). Favorites order key OPEN (N-2) |
| F-11 store contract tests | Still OPEN: AD-7 has no contract-test rule shared by fake and sqlite store |

## Findings

### N-1 [HIGH] Response shapes for history and favorites are not Quote-shaped, and nobody owns the mapping

- AD-9 history row = `{ entryId, quoteId, quote, author, recordedAt }` (`quoteId`, not `id`). AD-2 says `Quote = {id, quote, author}`. `GET /api/favorites` says only "array"; element shape is not stated.
- Unit A (backend) returns favorites as `Quote[]` (`{id,...}`). Unit B (frontend, `useFavorites`) types them as `{quoteId, quote, author}` to match history rows, and calls `isFavorite(quoteId)` against `f.quoteId`. Every ADs holds; heart state is always false.
- `toggle(quote)` takes a `Quote` (`id`), but a history row has `quoteId`. A HistoryList author passes the row straight in: PUT body has no `id`, or `id` is `entryId` (the AD-2 passthrough break the prior review warned about).
- Fix: state the exact element type of both GET arrays, and say who converts a history row to a `Quote` (one `toQuote(row)` in the frontend, or make history rows carry `id`).

### N-2 [HIGH] PUT/DELETE edge semantics: id mismatch, body trust, ordering key, error codes

- `PUT /api/favorites/:id` has `:id` and a body `Quote` with its own `id`. Nothing says which wins or what happens on mismatch. Unit A keys on the route and stores the body snapshot under it; Unit B keys on `body.id`. Same request, different rows.
- Body is client-supplied text stored as the snapshot (a trust break of AD-2 "never transformed"). Not required to match history or upstream. No validation rule (missing fields, `:id` = "abc", float, negative). AD-3 defines only 502/500, so 400/404 are undefined; one unit returns 400 `{error}`, the other returns 500.
- "Idempotent" is undefined for repeat PUT: keep the first snapshot, or replace? Replace (`INSERT OR REPLACE`) also changes rowid and moves it to the top of "newest favorite first"; `DO NOTHING` does not. There is no `favoritedAt`/sequence defined, so the order after restart can differ between implementations (same class as prior F-9).
- `DELETE` is idempotent and also deletes history by `quoteId`, even when the quote is not a favorite. A stale client (heart shows on, server says off) wipes history rows the user never unfavorited. Rule says "removes the favorite and every history row"; it does not say it is conditional on the favorite existing.
- Fix: `:id` is authoritative and body `id` must equal it, else 400; define the AD-3 extension to 400/404; PUT = insert-if-absent keeping the original snapshot and order; add a `favoritedAt`/autoincrement key; decide whether DELETE of a non-favorite is a no-op for history.

### N-3 [HIGH] "Displayed" = "returned by GET" lets history diverge from what the user saw; write failure undefined

- Frontend `useQuote` can issue two GETs: React 19 StrictMode double effect in dev (FR-8), retry plus click, double click before the disabled re-render. Cleanup/abort does not stop the server from recording. Both are recorded, only one is shown (or out-of-order responses show the earlier one). History contains quotes never displayed, contradicting FR-13 even though AD-9's redefinition is technically met.
- AD-5 has no latest-wins/abort rule and AD-9 has no dedupe rule. Unit A guards with abort; Unit B does not. Demo shows two rows per page load.
- Recording failure: "records after successful getRandom and before responding" but not what happens if the store throws. Unit A lets it bubble (AD-3: 500, user sees an error for a quote that was fetched OK). Unit B catches and logs, returns the quote (history silently misses it, FR-13). Both obey AD-3/AD-9.
- Unrecorded-after-unfavorite: unfavoriting the quote on the card deletes its history row while it is still displayed. FR-13 and FR-17 conflict for the current card and the spine does not rule on it (stays deleted until fetched again?).
- Fix: pick one: accept duplicates and say so (PRD allows repeats), or add a client latest-wins/abort rule plus a rule that the response proves display. State the failure policy (recommend: log and still return the quote, or fail 500, but write it down). Rule on the current-card/FR-17 case.

### N-4 [MEDIUM-HIGH] Cross-hook refresh and toggle races are unspecified

- AD-11: after a removing toggle and after every successful `useQuote` fetch, `QuotePage` calls `refresh`. No rule for out-of-order responses: a refresh started by a fetch can resolve after one started by a toggle and bring back stale rows (an unfavorited quote reappears until the next refresh).
- Toggle in flight is unspecified: no pending state, no disabling. Rapid on/off sends PUT then DELETE (or reversed arrival; the browser does not guarantee completion order across separate requests). Final server state may not match the heart.
- Optimistic vs confirm-then-update is not decided. Unit A updates the heart optimistically; Unit B waits for 204 and then refetches `GET /api/favorites`. A failed PUT leaves A out of sync (no rollback rule) and B flickers.
- Adding a favorite does not trigger a refresh by rule, but history is unaffected; favorites list refetch rule after a toggle is not stated.
- The refresh call is made by `QuotePage` "after toggle", but nothing forces the row/card heart handler to be the wrapped one. A HistoryList wired to raw `useFavorites.toggle` skips the refresh and meets every other line.
- `history.status` during refresh: loading flash vs keep stale data; aria-live rules for history/favorites errors (NFR-3/6) not stated.
- Fix: one sequence guard (latest request wins) in `useHistory`; a single `onToggle` created in `QuotePage`; state optimistic or not, and rollback on failure; serialize toggles per quoteId.

### N-5 [MEDIUM] `QuoteStore` port is named but not defined: sync vs async, operations, schema

- better-sqlite3 is synchronous; `QuoteSource.getRandom()` is `Promise`. AD-8 does not say whether `QuoteStore` methods are sync or return `Promise`. Unit A writes a sync port (matches the driver); Unit B writes an async port plus an async in-memory fake (matches AD-7 and future adapters). Service and adapter do not compile together.
- Operation names, signatures, and return types are unspecified (`recordHistory`, `listHistory`, `putFavorite`, `deleteFavoriteAndHistory`...), and where `recordedAt` is generated (service clock vs SQL) is open, so fakes and the adapter will disagree.
- "Autoincrement integer" for `entryId`: with plain `INTEGER PRIMARY KEY` the max rowid is reused after the newest rows are deleted (unfavorite deletes the latest entries); `AUTOINCREMENT` does not reuse. Reuse breaks React keys across a stale list and any cached `entryId`. Say `AUTOINCREMENT`.
- Schema not pinned (columns, PK on `quoteId`, index on `quoteId` for the cascade delete, types); `quoteId` as INTEGER vs TEXT mismatches route string `:id`; "WAL off and synchronous writes" is ambiguous (journal_mode DELETE + `synchronous=FULL`?).
- Sync calls in async handlers are safe for atomicity (no interleave within a statement) but there is no transaction across the `await getRandom()` and the record step, so interleaving between upstream return and record is possible; harmless here, but unstated.
- Fix: declare the port sync or `Promise`, list its methods, and a shared contract test for fake and sqlite adapters (restart and cascade) in AD-7.

### N-6 [MEDIUM] Startup and process lifecycle

- Corrupt, locked, or unopenable DB file at startup: crash or recreate empty? Not stated (prior F-6 half-open). A dev file watcher (`tsx` restart) briefly overlaps two processes on one file; `busy_timeout` unspecified so one gets SQLITE_BUSY mapped to 500 with no log rule. No close-on-shutdown rule (restart test closes explicitly, the app does not).
- Native addon install failure (stated in Stack) is an NFR-4 risk with no fallback.
- Fix: one line on open/corrupt policy, close on SIGINT, busy_timeout.

### N-7 [LOW] Smaller gaps

- Same quote in history N times: `quoteId` repeats are allowed, but the favorites heart per history row is derived from one id-set; no unique key for React rows other than `entryId` (fine if N-1 fixed).
- Favorites view placement (page vs section) delegated to EXPERIENCE.md, which the spine lists only in `sources` as UX; confirm the document exists and agrees.
- `status: final` while holes remain.

## Pair constructions (summary)

| Pair | Unit A | Unit B | Result |
| --- | --- | --- | --- |
| Shapes (N-1) | favorites as `Quote[]` | reads `quoteId` | hearts never on |
| PUT identity (N-2) | key = route `:id` | key = `body.id` | different rows for one request |
| Recording (N-3) | abort + bubble store error | no abort + swallow | one vs two rows; 500 vs silent miss |
| Refresh (N-4) | optimistic, page-wrapped toggle | confirm then refetch, raw toggle in rows | stale or flickering history |
| Port (N-5) | sync port | async port | do not compile together |
