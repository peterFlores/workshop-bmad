---
title: 'Error state with retry, announcements, and run documentation'
type: 'feature'
created: '2026-10-08'
status: 'done'
route: 'dispatch'
baseline_commit: 'a4e16f224451bfda682258862c716210906eee96'
review_loop_iteration: 0
story_key: '2-2-error-state-with-retry-announcements-and-run-documentation'
context:
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-workshop-bmad-2026-10-08/ARCHITECTURE-SPINE.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-workshop-bmad-2026-10-08/DESIGN.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-workshop-bmad-2026-10-08/EXPERIENCE.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-2-1-new-quote-button-with-loading-state-and-fade.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `useQuote` already reports `'error'` and clears the quote, but `QuoteCard` renders the skeleton for any missing quote, so a failed first load or refetch shows a skeleton forever with no message and no way to recover. The repository also has no README, so the app cannot be started from documentation.

**Approach:** Render the error state in the existing card (exact message, danger color, `role="alert"`) with a "Try again" button that reuses the "New quote" behavior, verify reduced-motion and responsive behavior, and add a root README with the two run commands, environment variables, and test commands.

## Boundaries & Constraints

**Always:**
- Message is exactly "Couldn't load a quote. Please try again." with no code, emoji, exclamation mark, or text from the response `error` field (UX-DR13). It uses the `--danger` token only here (UX-DR7).
- The error message lives in a `role="alert"` element, separate from the persistent polite quote region, so it is not announced twice. Focus is never moved or lost (UX-DR17, UX-DR18).
- All failures (502, 500, non-JSON body, rejected fetch) remain one `'error'` status. Keep `useQuote`'s abort and stale-response guards; one `refetch` makes one request (AD-3, AD-5).
- "Try again" is the same native HeroUI `Button` (`primary`, accent focus ring, 44px minimum height) wired to `refetch`, enabled in error, `isPending` "Loading..." while retrying, label back to "New quote" on success (UX-DR12, FR9, FR10).
- The card keeps width, padding, and radius in every state; no layout jump, never blank (UX-DR11, FR11). Only opacity may animate, and nothing animates under `prefers-reduced-motion: reduce` (UX-DR15).
- Components under `components/` take props only. Strict TDD; tests stub `/api/quote` only (AD-7).
- README states real, verified commands and defaults from the architecture (NFR1, NFR4).

**Never:** Error codes or technical detail in the UI, auto-retry, backoff, toasts, a second error mechanism, new animation or UI libraries, backend changes, a README beyond what is listed.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| First load fails | `quote: null`, `'error'` | Error message and "Try again"; no skeleton | Stays until retry |
| Refetch fails | quote shown, then `'error'` | Quote replaced by the message; button "Try again", enabled | Quote cleared (AD-5) |
| Retry succeeds | `'error'` -> `'loading'` -> `'ready'` | "Loading..." pending, then quote; message removed; button "New quote"; focus unchanged | N/A |
| Retry fails again | `'error'` -> `'loading'` -> `'error'` | Error shown again, button re-enabled; repeatable | Same message |
| Failure kinds | 502, 500, non-JSON, rejected fetch | Identical `'error'` state | One status |
| Reduced motion | `reduce` set | Instant state swaps, no transition | N/A |

</frozen-after-approval>

## Code Map

- `frontend/src/components/quote-card.tsx` -- add error branch before the skeleton branch; hold `role="alert"` message
- `frontend/src/components/new-quote-button.tsx` -- label becomes "Try again" in error; props gain the status or a label
- `frontend/src/pages/quote-page.tsx` -- passes status to button; same `refetch`
- `frontend/src/hooks/use-quote.ts` -- unchanged expected; tests extend coverage of failure kinds
- `frontend/src/index.css` -- reduced-motion rule already present; responsive tokens already defined
- `README.md` -- new, repo root
- Tests colocated: `use-quote.test.ts`, `quote-card.test.tsx`, `new-quote-button.test.tsx`, `quote-page.test.tsx`, `fade-css.test.ts` (extend)

## Tasks & Acceptance

**Execution:**
- [x] `frontend/src/hooks/use-quote.test.ts` -- 502 with JSON, 500, non-JSON 200 body, and rejected fetch each give `'error'` and `quote: null`; retry after failure then success returns to `'ready'`; aborted/stale responses still ignored -- AD-3, AD-5
- [x] `frontend/src/components/quote-card.test.tsx` then `quote-card.tsx` -- `'error'` renders exact text, one `role="alert"`, no skeleton, no quote, no `!`; danger color class; loading-with-no-quote still shows skeleton; no `data-phase` fade runs into or out of error -- UX-DR11/12/13/17
- [x] `frontend/src/components/new-quote-button.test.tsx` then `new-quote-button.tsx` -- error shows enabled "Try again"; pending shows "Loading..."; still native `<button>` -- UX-DR12/18
- [x] `frontend/src/pages/quote-page.test.tsx` then `quote-page.tsx` -- first-load failure, failed refetch, retry success (focus stays on button, message gone, "New quote"), retry failing twice, request counts -- FR11, FR9/10
- [x] `frontend/src/fade-css.test.ts` -- reduced-motion rule covers every transition class; add responsive assertions (card padding 24px base, 40px at 640px; 640px max width) from `index.css` and `quote-page.tsx` classes -- UX-DR15/20
- [x] `README.md` -- document `npm install`; `npm run dev -w backend` (3001); `npm run dev -w frontend` (5173, open `http://localhost:5173`); `PORT`, `UPSTREAM_URL`, `UPSTREAM_TIMEOUT_MS` with defaults; `npm test -w backend` and `npm test -w frontend` -- NFR1, NFR4
- [x] `README.md` -- add a short "Verifying in a browser" note listing the deferred checks: card padding and radius overrides, fade-in, stable card height, accent focus ring, 12px radius, error state, and 1280px/390px layouts -- carries `deferred-work.md` items

**Acceptance Criteria:**
- Given a stubbed 502 `{error}`, when `useQuote` fetches, then `status` is `'error'` and `quote` is cleared; given 500, non-JSON body, or rejected fetch, then the same single status (AD-3, AD-5)
- Given `'error'`, when the card renders, then it shows exactly "Couldn't load a quote. Please try again." in danger color, replacing any previous quote, with no exclamation mark, emoji, code, or `error` field text, and the card footprint is unchanged and never blank (UX-DR11, UX-DR12, UX-DR13, FR11)
- Given `'error'`, then the message is inside `role="alert"` and focus is neither moved nor lost (UX-DR17, UX-DR18, NFR3)
- Given `'error'`, then a native, enabled primary "Try again" button is shown, operable by `Tab`, `Enter`, `Space`, with the accent focus ring (UX-DR12, UX-DR18)
- Given error and a stub now returning a quote, when "Try again" is activated, then loading and disabled "Loading..." show, the new quote appears, focus stays on the button, the message is removed, and the label is "New quote" (FR9, FR10)
- Given error and a stub failing again, when "Try again" is activated, then error shows again with the button enabled, repeatable (FR11)
- Given the first load fails, then the error state appears instead of the skeleton with no stale or empty quote (FR11, UX-DR11)
- Given `prefers-reduced-motion: reduce`, when state changes between loading, quote, and error, then no animation runs (UX-DR15)
- Given a viewport under 640px, when quote, loading, and error are checked, then the card fills the width minus 16px margins, the button is full width and at least 44px high, and there is no horizontal scroll; at 640px and up the card is 640px max with 40px padding (UX-DR20, FR12)
- Given the README, when followed, then it documents the commands, ports, env variables, and test commands above, and running the two dev commands yields a working app on `http://localhost:5173` (NFR1, NFR4)

## Implementation Notes

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| Button label precedence test passes isError={false} | medium | patch | Reordering the ternary in new-quote-button.tsx would pass every test; no test renders isLoading and isError together. |
| Error state shrinks the card (single-line alert vs about 164px skeleton) | medium | patch | The story AC and UX-DR11 require a stable footprint; the error branch has no height reservation. Smallest fix is a shared min-height class. |
| Implementer wrote tests and code together, never saw tests fail first | low | noted | Strict TDD was not followed for this story; the verification-gap pass found gaps only in the button precedence test, and the patches were written test-first. |
| Real-browser checks (layout, color, motion, card height across states) | maybe-false | defer | Covered by the README "Verifying in a browser" checklist and deferred-work.md; jsdom cannot see them. |
| Empty aria-live region left mounted in error | low | rejected | An empty container adds no height or announcement. |
| Response shape cast, not validated | low | rejected | Backend adapter validates the shape (Story 1.1); same rejection as the Story 1.2 triage. |
| Fake timers not restored | false | rejected | `afterEach` in quote-card.test.tsx restores real timers. |
| Stale-response and abort tests missing | false | rejected | Added in the Story 1.2 patches; use-quote.test.ts covers them. |
| fade-css regexes, class-grep responsive tests, README gaps, logging, redundant tests, danger-token resolution | low | rejected | Cosmetic or taste; fixes add complexity. The manual checklist covers layout. |

## Design Notes

The 2.1 review deferred this exact gap (failed refetch shows a skeleton with no message). Because `QuoteCard` treats `quote === null` as "skeleton", the error branch must test `status === 'error'` first. Keep the alert element separate from the `aria-live="polite"` region (nested live regions announce twice). The card's fade effect keys on `quote` identity; clearing to `null` already swaps instantly, so it needs no new animation path.

jsdom with `css: false` cannot observe layout, color, or transitions: assert danger via class or token reference, read `index.css` as text for media rules (as `fade-css.test.ts` does), and leave real layout to the README browser checks.

Size: roughly 1,750 tokens, slightly above the 1,600 target, because nine Story 2.2 ACs are kept as one cohesive file.

## Verification

**Commands:**
- `npm test -w frontend` -- expected: all tests pass, no network or backend
- `npm test -w backend` -- expected: unchanged, passing
- `npm run typecheck -w frontend` -- expected: no type errors

**Manual checks (if no CLI):**
- Run `npm run dev -w backend` and `npm run dev -w frontend`; open `http://localhost:5173`. Stop the backend, load or click: the error message and "Try again" appear in place, no skeleton. Restart the backend, click "Try again": quote returns, "New quote" label. Check 1280px and 390px, and with OS reduced motion on.
