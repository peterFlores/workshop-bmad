# Rubric Review 2: ARCHITECTURE-SPINE vs updated PRD (2026-10-09)

**Verdict:** The spine now covers FR-1..19 and NFR-1..6 and closes every critical and high finding from review 1; it is close to buildable. Four gaps remain that let units diverge: the `QuoteStore` port is undefined, the F3/F4 UI placement points at a UX doc that does not cover it, the history-recording trigger is not StrictMode-safe, and the favorites/history wire shapes and errors are incomplete.

## Prior findings status

| Prior # | Topic | Status |
| --- | --- | --- |
| 1 | Persistence asserted absent | Closed (AD-8, env var `DATA_FILE`, seed, diagram, demo reset, stale lines removed) |
| 2 | Identity, recording trigger, cascade | Mostly closed (AD-9, AD-10). Double-record on StrictMode refetch not addressed (see F3) |
| 3 | F3/F4 API contract | Mostly closed (routes, 204, idempotency, order). Gaps in F4 below |
| 4 | Frontend state ownership | Closed (AD-11, `useHistory`, `useFavorites`, `HeartButton`). Placement unresolved (see F2) |
| 5 | Binds, NFR-6, map | Closed (binds FR-1..19, NFR-1..6; map rows; AD-6 covers NFR-6) |
| 6 | Operational envelope | Closed (data path, reset, restart test in AD-7) |
| 7 | Deferred, stack | Closed. Versions re-checked against npm: all pins match latest except `@types/node` (24.19.1 deliberately matches Node 24; acceptable) |

## Findings

### 1. [HIGH] `QuoteStore` port is never defined
AD-1 fixes `QuoteSource.getRandom(): Promise<Quote>`, but AD-8..AD-10 never give the `QuoteStore` method set (record history, list history, add/remove favorite, list favorites). The service unit and the sqlite adapter unit will each invent the signature. The FR-17 cascade must be one store transaction (AD-10), so the port needs a single named operation such as `removeFavoriteAndHistory(quoteId)`; otherwise service could orchestrate two calls and break atomicity. Also not stated: sync vs async port methods (better-sqlite3 is synchronous; the fake store must match). Fix: add the port signature to AD-8 or AD-10.

### 2. [HIGH] F3/F4 presentation is delegated to a UX doc that does not cover it
AD-11 says "the container decides placement per EXPERIENCE.md". `ux-designs/.../EXPERIENCE.md` (updated 2026-10-08) and `DESIGN.md` contain zero mentions of history, favorites, or heart. FR-14, FR-16, FR-18 (view history, heart on card and rows, "view favorites in one place") therefore have no placement decision anywhere (same page vs tabs vs route). The seed also has no `FavoritesList` component although AD-11 says favorites render as a presentational list, and the diagram's presentational node lists only `QuoteCard, HistoryList`. Fix: decide placement in the spine (single page, two sections is simplest) or update EXPERIENCE.md/DESIGN.md first; add `FavoritesList` to seed and diagram.

### 3. [MEDIUM] History recording is not safe against duplicate fetches
AD-9 records on every successful `GET /api/quote`. React StrictMode in dev double-invokes the FR-8 first-load effect, so two quotes are recorded and only one is displayed, violating "displayed" = "returned" in practice and FR-13/14 for the demo's first screen. Retry also records. Fix: add a rule to AD-5 (effect guarded or aborted so one request is committed) or accept and state it; also state that a store-write failure after a successful upstream call returns 500 and shows the error state.

### 4. [MEDIUM] Favorites/history wire shapes and error cases incomplete
- `GET /api/favorites` item shape is unstated (`Quote`? with a timestamp?). Order is "newest favorite first" but no ordering key is named (needs a `favoritedAt` or autoincrement).
- `PUT /api/favorites/:id` has both path id and body `Quote.id`; mismatch and invalid body behavior is undefined. AD-3 maps "any other failure" to 500, so a malformed body would be a 500, not a 400.
- History rows use `quoteId`, but `useFavorites.toggle(quote)` takes a `Quote` with `id`; the row-to-`Quote` mapping is unspecified.
- `recordedAt` format (ISO string vs epoch) is unstated; AD-2's "defined once in each package" covers only `Quote`, not `HistoryEntry`.
- AD-3 binds only `useQuote`; error/loading handling for `useHistory`/`useFavorites` (including a failed toggle) is undefined, and `status` value sets are not given for them.

### 5. [LOW] Smaller consistency and rationale gaps
- AD-8 chooses native addon better-sqlite3 over Node 24's built-in `node:sqlite` without recording the tradeoff against NFR-1 (minimal deps) and NFR-4 (install friction: prebuilt binary or toolchain). Add one line of rationale.
- Vite proxy target is fixed to :3001 while `PORT` is configurable; state that the proxy reads the same value or that `PORT` changes require editing `vite.config.ts`.
- Frontmatter `scope` still omits storage ("Express backend plus React page").
- NFR-1 and NFR-2 have no governing AD (map says "whole repo"); acceptable, but the 5 s upstream timeout exceeds the 2 s NFR-2 target and that is not acknowledged.

## Checklist summary

| Check | Result |
| --- | --- |
| Fixes real divergence points | Mostly pass; fail on store port, UI placement, duplicate recording |
| AD Rules enforceable | Pass for AD-1..AD-8; AD-9, AD-10, AD-11 need the gaps above closed |
| Deferred cannot cause divergence | Pass (history cap, migrations, pagination, single user explicitly deferred) |
| Tech verified-current | Pass (npm registry matches all pins) |
| Covers FR-1..19, NFR-1..6, binds | Pass |
| No stale statements | Pass except frontmatter `scope` and the EXPERIENCE.md reference |
| Operational envelope | Pass (env table, data path, reset, restart test) |
| Internal consistency | Minor: `FavoritesList` missing from seed/diagram; proxy port vs `PORT` |
