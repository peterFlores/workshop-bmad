---
title: 'Heart a quote to save it as a favorite'
type: 'feature'
created: '2026-10-09'
status: 'done'
baseline_commit: '403e59ba19f92c2ace1c04f7600dc036f8a1c8e1'
route: 'dispatch'
review_loop_iteration: 0
story_key: '3-2-heart-a-quote-to-save-it-as-a-favorite'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-workshop-bmad-2026-10-08/ARCHITECTURE-SPINE.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-workshop-bmad-2026-10-08/EXPERIENCE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Users cannot save quotes they like. PRD FR-16..19 and NFR-6 require a heart on each quote, a favorites list, and favorites that survive a restart (Jira WS-9; builds on WS-8).

**Approach:** Wire the existing store's favorites methods to `GET`/`PUT`/`DELETE /api/favorites`, add one shared `HeartButton`, a `useFavorites` hook called once in `QuotePage`, and a Favorites list below History.

## Boundaries & Constraints

**Always:** Follow AD-10, AD-11, AD-6 amendment, UX-DR22..27. Identity is `quote.id`. `PUT /api/favorites/:id` needs path id equal to `body.id`, else 400; repeat PUT keeps the first snapshot, returns 204. `DELETE` returns 204; for a favorite, `removeFavoriteAndHistory` removes the favorite and every history row of that quote in one transaction; for a non-favorite nothing changes. `GET /api/favorites` returns `Quote[]` newest first. Heart: native icon-only button, name "Favorite this quote", `aria-pressed`, outline when off and filled accent when on, 44px touch target, accent focus ring. Toggle is confirm-then-update and ignored while that quote's request is pending; after a toggle that removes a favorite, `QuotePage` refreshes history. Heart is disabled while the card loads and hidden in the error state. When the focused row is removed, focus moves to the next row's heart, else the section heading. Inline SVG for the heart (no new dependency).

**Never:** Optimistic UI, undo toasts, confirmation dialogs, new dependencies, schema changes, history caps. Writing or running tests (user override for this run).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Favorite | `PUT /api/favorites/7` body `Quote` id 7 | 204; appears first in `GET /api/favorites` | N/A |
| Repeat PUT | same id, different text | 204; first snapshot kept | N/A |
| Id mismatch | path 7, body id 8, or invalid body | 400 `{ error }`, nothing stored | AD-3 shape |
| Unfavorite | `DELETE /api/favorites/7` on a favorite with 3 history rows | 204; favorite and all 3 rows gone; other quotes untouched | N/A |
| Not a favorite | `DELETE` on a non-favorite | 204; nothing changes | N/A |
| Toggle fails | PUT or DELETE request fails | heart keeps previous state; page usable | logged only |
| Restart | stop and start with same `DATA_FILE` | favorites list unchanged; displayed favorite shows filled heart | N/A |

</frozen-after-approval>

## Code Map

- `backend/src/domain/quote-store.ts`, `adapters/sqlite/sqlite-quote-store.ts` -- favorites methods already exist; reuse, do not change schema.
- `backend/src/service/record-history.ts` -- `parseQuote` is exported; reuse for the PUT body. Add `service/favorites.ts` (list, add, remove).
- `backend/src/http/app.ts` -- add favorites routes before the 404 handler; `mapError` already maps `ValidationError` to 400.
- `frontend/src/hooks/use-history.ts` -- pattern for a fetch hook with latest-wins; add `use-favorites.ts`.
- `frontend/src/components/history-list.tsx` -- add heart per row and focus handling; add `favorites-list.tsx`, `heart-button.tsx`.
- `frontend/src/components/quote-card.tsx`, `pages/quote-page.tsx` -- heart on the card (top right, not in error state), call `useFavorites` once, pass `isFavorite`/`onToggle` down, refresh history after an unfavorite.
- `README.md` -- document the favorites endpoints briefly.

## Tasks & Acceptance

**Execution:**
- [x] `backend/src/service/favorites.ts`, `backend/src/http/app.ts` -- list/add/remove services and the three routes -- AD-10
- [x] `frontend/src/components/heart-button.tsx` -- shared icon-only button with `aria-pressed`, outline/filled SVG, 44px target -- UX-DR22, UX-DR25
- [x] `frontend/src/hooks/use-favorites.ts` -- `{ favorites, isFavorite, toggle, status }`, confirm-then-update, per-id pending guard -- AD-11
- [x] `frontend/src/components/favorites-list.tsx`, `history-list.tsx` -- rows with heart, empty line "No favorites yet.", real `<ul>`, `aria-describedby`, focus handoff on removal -- UX-DR23, UX-DR26, UX-DR27
- [x] `frontend/src/components/quote-card.tsx`, `pages/quote-page.tsx` -- card heart, wiring, history refresh after unfavorite -- FR-16, FR-17
- [x] `README.md` -- favorites endpoints

**Acceptance Criteria:**
- Given a quote on the card, when the heart is pressed, then it fills only after the server confirms and the quote appears at the top of Favorites.
- Given a favorite shown in History and on the card, when it is unfavorited, then it leaves Favorites, all its History rows disappear, and the card heart is outline.
- Given a restart, when the page loads, then favorites persist and the card heart is filled for a favorite quote.
- Given the card is loading or in error, then the card heart is disabled or hidden respectively.

## Implementation Notes

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| Heart pressable before favorites load; toggle derives `wasFavorite` from an unloaded list; initial GET can overwrite a toggle (edge x3, blind) | medium | patch (fixed) | `isPending` is true and `toggle` returns `ignored` until status is `ready` |
| No tests for favorites routes, store, hooks, components; focus handoff (blind, gap x2, edge) | false | rejected | User override excludes tests |
| 7 existing frontend tests fail, now with more fetches and hearts (gap) | medium | defer | Same root cause as WS-8; fixing needs tests; logged |
| Store layer, schema, `parseQuote` missing from diff (blind) | false | rejected | Added in Story 3.1; multi-row cascade verified live (3 rows removed, other quote kept) |
| Async handlers hang on Express 4 (blind) | false | rejected | Express 5.3.0; a `ValidationError` returned 400 in live runs |
| Sync store wrapped in async service (blind) | false | rejected | Port is sync by AD-8 |
| Unfavorite erases history, no confirmation (blind, edge) | false | rejected | Decision FR-17; UX bans confirmations and undo |
| Failed toggle gives no UI feedback (blind, edge) | low | rejected | Spec matrix: failure is logged only; heart keeps previous state |
| Card heart has no description; labels identical per row (blind, edge) | low | rejected | UX-DR25 mandates the constant name; rows use `aria-describedby` |
| Heart toggles outgoing quote during fade (blind, edge) | false | rejected | `displayed` is the visible quote, so the heart acts on what the user sees |
| `pr-10` may not clear the heart (edge) | false | rejected | Card padding plus `pr-10` leaves more than the 52 px the heart needs |
| Focus goes to heading when only earlier rows survive (edge) | false | rejected | Spec: next row's heart, else the heading |
| Ignored second press clears focus target (edge) | low | rejected | Heart is disabled while pending, so the case cannot occur |
| Refresh failure leaves removed rows visible (edge, gap) | low | rejected | Needs a failing refresh after a successful delete; fix adds local filtering |
| Non-array payloads, negative or non-canonical ids, repeat PUT text mismatch (blind, edge) | low | rejected | Own backend; dummyjson ids are positive integers; first snapshot kept by decision |
| Card quote absent from History after its unfavorite (edge) | false | rejected | Required by FR-17 |
| Not a bare native `<button>` (edge) | false | rejected | HeroUI `Button` renders a native `<button>` |
| Duplicated list markup, O(n²) `isFavorite`, `querySelector` fragility, README gaps (blind) | low | rejected | Cosmetic or design preference; no named harm |

## Verification

**Commands:**
- `npm run typecheck -w backend && npm run typecheck -w frontend` -- expected: exit 0 (tests skipped by user override)
- `npm run dev -w backend` with a temp `DATA_FILE`, then `curl` PUT/GET/DELETE `/api/favorites` and `GET /api/history` -- expected: matrix rows above, including history rows removed on DELETE and persistence across a backend restart

**Manual checks (if no CLI):**
- Open `http://localhost:5173`: heart fills on press, appears in Favorites, survives reload; Tab reaches each heart with a visible focus ring.
