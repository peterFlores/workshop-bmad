# Rubric Review: ARCHITECTURE-SPINE vs updated PRD (2026-10-09)

**Verdict:** The spine is sound for the original F1/F2 scope but is stale against the updated PRD. It does not cover F3/F4 or NFR-5/6, and several of its statements are now false. It is not usable as a build substrate until persistence, the history/favorites contract, and frontend state ownership are decided.

## Findings

### 1. [CRITICAL] Persistence is asserted absent and deferred, but NFR-5, FR-15 and FR-19 require it
- Contradicted statements:
  - Conventions: "Backend stateless; no persistence".
  - Deferred: "Authentication, rate limiting, caching, persistence: not needed in v1".
  - Runtime envelope: "two processes" and no data location.
- Nothing is decided on:
  - storage technology (embedded SQLite via `node:sqlite` or a driver, or a JSON file; it must not need a DB server, and NFR-1 favors minimal dependencies);
  - data file path and env var (e.g. `DATA_PATH`; a relative path resolves differently under npm workspaces, so units will diverge);
  - schema creation and initialization on first start;
  - gitignore of the data file;
  - write atomicity and ordering (the "same order after restart" requirement);
  - behavior when storage is unavailable.
- This is a real divergence point, and "persistence" under Deferred could let two units pick different stores.
- Fix:
  - add an AD (e.g. "Persistence behind a `QuoteStore` port, embedded file-backed adapter");
  - add a driven adapter to the paradigm diagram and Structural Seed;
  - add the env var table row;
  - remove the "stateless" and "persistence" lines;
  - state the Node 24 built-in vs. driver choice with a verified-current version. I cannot verify that `node:sqlite` is stable on 24.21; confirm it.

### 2. [HIGH] Quote identity, history-entry identity, and the recording trigger are undefined
- AD-2 fixes `Quote = {id, quote, author}` as "identical fields" and "exact". History needs a distinct entry identity, because repeats are allowed and newest-first order needs a stable key.
  - Needed: `HistoryEntry` shape (entry id, timestamp or sequence, quote snapshot).
- Favorites are keyed by upstream `quote.id`. The spine does not say so.
  - It does not say whether favorites and history store a snapshot of text and author. They must, because upstream has no reliable lookup guarantee in the spine's design.
- FR-13 says "every quote displayed is recorded". The spine does not say who records it:
  - Option A: a side effect inside `GET /api/quote`. This is non-idempotent, and it double-records on React StrictMode double-fetch, retry and refetch.
  - Option B: an explicit client `POST`.
  - This is the largest behavioral divergence point between the backend and frontend units.
- The FR-17 cascade (unfavoriting deletes all history entries of that quote id) has no owner or atomicity rule. It must be a single service operation and a single transaction, not two client calls.
- AD-2 "defined once in each package" duplicates the types. This becomes more costly with more shapes. Consider a shared types location or a contract test.

### 3. [HIGH] No API contract for F3/F4, and AD-1/AD-3 do not cover the new surface
- Missing:
  - endpoints and verbs (history list, favorites list, add/remove favorite);
  - response shapes (the "no envelope" convention is fine, but list shapes are not stated);
  - status codes (404/204 on a missing favorite, idempotency of PUT/DELETE);
  - pagination or cap. History is uncapped (PRD assumption), so a list with no limit is unbounded. Decide it or defer it explicitly.
- AD-1 binds a single `QuoteSource` port. There is no repository port, so the service would reach storage directly or each unit would invent its own.
- AD-3 maps only `UpstreamError`. A storage failure is "any other" and maps to 500. That is acceptable but should be stated, and the frontend error behavior for failed history/favorite calls is unspecified (AD-3 only covers `useQuote`).
- The Capability map says "FR-1..FR-5 quote API", but FR-1 now includes extra backend capabilities.

### 4. [HIGH] Frontend state ownership and structure do not cover F3/F4
- AD-5 says "all fetch state lives in `useQuote`". With history and favorites, there are now several fetch resources.
- Undecided:
  - hook names and ownership (`useHistory`, `useFavorites`);
  - the single source of truth for favorite status, which both the main card heart and the history-list hearts (FR-16/17) must read. Two copies will diverge;
  - post-unfavorite refresh of the history list (FR-17 cascade);
  - how "view history" and "view favorites in one place" are presented (routes, tabs, drawer). The seed has one `QuotePage` and no routing decision;
  - the interaction between `useQuote.refetch` and recording history.
- The Structural Seed lacks a `HistoryList`, `FavoritesList` and `FavoriteButton` component, or a decision on how they are named.
- AD-6 lists only `Card`, `Button` and `Skeleton`. It should name the HeroUI toggle/icon-button choice for the heart.

### 5. [MEDIUM] Binds frontmatter and traceability are stale; NFR-6 is unowned
- `binds` stops at FR-12 and NFR-4. It lacks FR-13..FR-19, NFR-5 and NFR-6.
- `updated: 2026-10-08` and `status: final` are stale against the PRD update of 2026-10-09.
- The Capability to Architecture map has no rows for F3, F4, NFR-5 or NFR-6.
- NFR-6 (heart accessible name, visible focus, on/off state exposed beyond color, e.g. `aria-pressed`) has no rule. AD-5 and AD-6 cover only NFR-3, and the heart is a new interactive element that the spine does not know about.
- The `sources` list shows a UX doc. Check whether EXPERIENCE.md/DESIGN.md were updated for the heart and the history/favorites views; the spine delegates `aria-live` to it.

### 6. [MEDIUM] Operational and environmental envelope is incomplete
- Missing because of persistence:
  - the data file location (see finding 1) and its lifecycle;
  - reset or clean procedure for demo day (the presenter needs a way to start empty);
  - concurrent-write behavior. Single user is a PRD assumption, so the spine should state "single process, serialized writes" and be done;
  - an NFR-4 check: still "one command per part", with no native-module build step or install friction if a driver is chosen.
- AD-7 (test at the port) needs an extension: store tests use an in-memory or temp-file store, and restart persistence needs one test that reopens the store. Without this, FR-15/FR-19 are untestable by the stated rule.
- AD-4 and the Vite proxy: if new routes live under `/api/*`, no change is needed. This is fine, but say so.

### 7. [LOW] Deferred and stack hygiene
- Deferred "caching... persistence" must be split. Persistence moves into decisions. Add explicit deferrals for history cap and pagination, and for multi-user scoping (PRD: one shared list per install), so they cannot be decided differently by two units.
- Stack versions (TypeScript 7.0.2, Vitest 5.0.3, Vite 8.3.4, React 19.3.0, HeroUI 3.2.6, Tailwind 4.3.3, Express 5.2.1, Node 24.21.0) are beyond what I can independently verify offline. The spine itself flags TypeScript 7 as a latest-at-authoring risk. Re-verify when the storage dependency is added, and add its version row.

## Checklist summary

| Check | Result |
| --- | --- |
| Fixes the real divergence points, misses none | Fail: persistence, history recording trigger, entry identity, F3/F4 API contract, favorite-state source of truth |
| Every AD Rule enforceable and prevents its divergence | Mostly pass for AD-1..AD-7 as written; AD-2 and AD-5 are now too narrow |
| Nothing in Deferred lets units diverge | Fail: persistence, history cap |
| Named tech verified-current | Unverified (no persistence tech named at all) |
| Covers the PRD's capabilities (FR/NFR, `binds`) | Fail: FR-13..19, NFR-5, NFR-6 absent; FR-1 to FR-12 and NFR-1..4 covered |
| Altitude dimensions decided, deferred, or open | Fail: operational envelope (data location, reset, test restart) |

## Spine statements now contradicted by the PRD
- "Backend stateless; no persistence" (Conventions)
- "persistence: not needed in v1" (Deferred)
- "two processes" with no store (runtime envelope), and the diagram with a single upstream dependency
- `Quote` as the only domain shape (AD-2); no entry or favorite identity
- "All fetch state lives in `useQuote`" (AD-5)
- Single-endpoint assumption (`GET /api/quote` only in `http`, Structural Seed, Capability map)
- `scope: Express backend plus React page` (frontmatter) omits storage
