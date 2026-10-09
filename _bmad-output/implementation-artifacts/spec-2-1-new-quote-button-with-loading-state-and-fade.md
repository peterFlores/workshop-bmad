---
title: 'New quote button with loading state and fade'
type: 'feature'
created: '2026-10-08'
status: 'done'
route: 'dispatch'
baseline_commit: 'efdc6720eaa2db36e7e5b3ae4bcebd54049703bd'
review_loop_iteration: 0
story_key: '2-1-new-quote-button-with-loading-state-and-fade'
context:
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-workshop-bmad-2026-10-08/ARCHITECTURE-SPINE.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-workshop-bmad-2026-10-08/DESIGN.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-workshop-bmad-2026-10-08/EXPERIENCE.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-1-2-frontend-scaffold-and-first-quote.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The page shows one quote and cannot fetch another. `useQuote.refetch` exists but nothing calls it, and `QuoteCard` shows the skeleton for every status other than `'ready'`, which would blank the quote on a repeat load.

**Approach:** Add a HeroUI "New quote" button that calls `refetch`, shows a pending "Loading..." state, and keeps the previous quote visible (no skeleton) until the new one arrives, then swaps it with an opacity-only fade (150 ms out, 250 ms in; instant under reduced motion). The skeleton remains for the first load only.

## Boundaries & Constraints

**Always:**
- Decision (focus ring): keep HeroUI's default focus ring offset (against the page background), since the button sits below the card on the page background; this departs from the literal "surface" wording of the AC on purpose.
- Decision (announcements): use `isPending` and accept React Aria's built-in pending announcement alongside the polite live-region message; do not hand-roll `aria-disabled`.
- Components under `components/` take props only and never call `fetch`; `useQuote` owns fetch state (AD-5). Keep its abort and stale-response behavior; one `refetch` makes exactly one request.
- Quote and author render byte-for-byte, Title Case preserved (UX-DR19). Colors come from tokens; accent only on the button and its focus ring (UX-DR7).
- Only opacity animates; the card never resizes or moves (UX-DR11, UX-DR14). `prefers-reduced-motion: reduce` gives an instant swap with no transition (UX-DR15).
- The loading button stays focusable and in tab order, and focus is never moved (UX-DR18). The quote region stays one persistent `aria-live="polite"` region (UX-DR16).
- Strict TDD; tests stub `/api/quote` only (AD-7).

**Never:** Error UI, retry button, error announcements, or README (Story 2.2). Auto-refresh, swipe or gestures, custom shortcuts (UX-DR21). Another UI or animation library. Touch `backend/`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| First load | `quote: null`, `'loading'` | Skeleton; button "Loading..." pending; region announces "Loading a new quote" | N/A |
| Repeat load | `quote` set, `'loading'` | Previous quote visible, no skeleton, same footprint; button "Loading..." | N/A |
| Repeat click while loading | Second click/Enter | No extra request | N/A |
| New quote arrives | `'ready'`, different quote | Old text fades out 150 ms, new fades in 250 ms; button "New quote", enabled, focus unchanged; region announces new quote | N/A |
| Reduced motion | Same, `reduce` set | Instant swap, no transition | N/A |
| Same quote twice | Identical body | Shown again, loading completes normally | N/A |

</frozen-after-approval>

## Code Map

- `frontend/src/components/quote-card.tsx` -- skeleton only when no quote; add fade phase and live-region loading text
- `frontend/src/components/new-quote-button.tsx` -- new; wraps HeroUI `Button`, props `{ isLoading, onPress }`
- `frontend/src/pages/quote-page.tsx` -- container; wires `refetch` to the button, button below the card in the 24px-gap column
- `frontend/src/hooks/use-quote.ts` -- unchanged unless a test shows `refetch` can double-fire while loading
- `frontend/src/index.css` -- fade classes and the reduced-motion override (opacity only)
- Tests colocated: `quote-card.test.tsx` (extend), `new-quote-button.test.tsx` (new), `quote-page.test.tsx` (extend), `fade-css.test.ts` (new, reads `index.css`)

## Tasks & Acceptance

**Execution:**
- [x] `new-quote-button.test.tsx` then `new-quote-button.tsx` -- idle "New quote" enabled; pending shows "Loading...", keeps focusability, `aria-disabled="true"`, press ignored; Enter and Space activate when idle -- UX-DR7/10/13/18
- [x] `quote-card.test.tsx` then `quote-card.tsx` -- `'loading'` with a quote shows it and no `.skeleton`; first load keeps the skeleton; region announces "Loading a new quote" while loading; swap uses fade phases (fake timers, `matchMedia` stubbed) and swaps immediately under reduce; text byte-exact -- UX-DR9/11/14/15/16/19
- [x] `fade-css.test.ts` then `index.css` -- assert durations 150ms/250ms, only `opacity` transitioned, `prefers-reduced-motion` rule sets `transition: none` (vitest runs `css: false`, so read the file) -- UX-DR14/15
- [x] `quote-page.test.tsx` then `quote-page.tsx` -- deferred second response: one click gives exactly two fetches in total, double click still two, old quote visible while pending, new quote and "New quote" after; identical second quote and no timers/handlers beyond the click -- FR9/10, UX-DR21
- [x] `use-quote.ts` -- only if the page test exposes a double request; keep existing abort tests green -- AD-5

**Acceptance Criteria:**
- Given `'ready'`, when the page renders, then a native `<button>` "New quote" is below the card, built with HeroUI `Button` (`variant="primary"`), accent fill, accent-foreground text, 12px radius, and accent is used nowhere else (UX-DR7, UX-DR13)
- Given keyboard focus on the button, when `Tab` arrives, then a 2px accent ring with 2px offset shows, `Enter` and `Space` activate it, and focus stays on it afterward (UX-DR8, UX-DR18, NFR3)
- Given a stubbed delayed second quote, when "New quote" is clicked, then exactly one new request is issued, status is `'loading'`, the button has reduced opacity, reads "Loading...", stays in tab order, and a second click adds no request (FR9, FR10, AD-5, UX-DR10)
- Given a repeat load, when the card renders, then the previous quote stays visible, no `Skeleton` appears, and card footprint is unchanged (UX-DR9, UX-DR11)
- Given loading starts, when the live region updates, then it announces "Loading a new quote", and then the new quote when it arrives (UX-DR16, NFR3)
- Given the new quote arrives, when the transition runs, then old text fades out in ~150 ms and new text in ~250 ms, opacity only, no resize or movement, and the button returns to enabled "New quote" (UX-DR14)
- Given `prefers-reduced-motion: reduce`, when a quote arrives, then it swaps instantly with no transition (UX-DR15)
- Given the same quote twice, then it is shown again without error; given `That'S`-style Title Case, then text is exactly as received (UX-DR19)
- Given the page, then there is no auto-refresh, gesture handling, or custom shortcut (UX-DR21); on a normal network the new quote shows within ~2 s (NFR2, manual)
- Given the first load, then the skeleton still appears (UX-DR9)

## Implementation Notes

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| Card stuck at opacity 0 on quote A -> B -> A during fade-out | low | patch | quote-card.tsx:19 early return leaves phase 'out' after the cleanup cleared the timer. Fix is one line. |
| A -> B -> C during fade-out untested | low | patch | Folded into the same patch as a test. |
| Failed refetch shows skeleton with no message or announcement | medium | rejected | Error UI, retry and announcements are Story 2.2 (FR11); a test pinning current behavior would churn when 2.2 lands. |
| Fade-in may be skipped (phase and text swap in one render) | maybe-false | defer | Same DOM node, opacity moves 0 -> 1 across the style change, so it should transition; needs a real-browser check. |
| Card height may change between quotes of different length | maybe-false | defer | Text is swapped in place with no reserved height; needs a browser check with long and short quotes. |
| act() callback return type may break typecheck | false | rejected | `npm run typecheck -w frontend` exits 0. |
| Double press in the same tick sends two requests | false | rejected | Page test shows a double click yields one extra request; React flushes discrete events between presses and isPending blocks presses. |
| prefers-reduced-motion read once | false | rejected | It is read inside the effect on every swap, and the CSS rule covers the media query separately. |
| Easing direction, 'Loading...' ASCII dots, arbitrary min-h value, fade-css regex brittleness, accessible-name pinning | low | rejected | Cosmetic or taste; fixes add complexity. |
| Duplicate loading announcements | low | rejected | Accepted in the spec's frozen decisions. |

## Design Notes

HeroUI `Button` verified from installed `@heroui/react@3.2.6`, `@heroui/styles@3.2.6`, and `react-aria-components@1.22.0` (types and dist CSS/JS):
- `Button` wraps the React Aria `Button`; props extend RAC's plus `variant`, `size`, `fullWidth`, `isIconOnly`, `isDisabled`. There is no `disabled` prop; use `isDisabled` or RAC's `isPending`, and `onPress` rather than `onClick`.
- Variants: `primary | secondary | tertiary | ghost | outline | danger | danger-soft`. `primary` is the accent button (`--button-bg: var(--accent)`, `--button-fg: var(--accent-foreground)`).
- `isDisabled` renders native `disabled`, which drops the button from tab order, so it violates UX-DR10. `isPending` sets `aria-disabled="true"` and `data-pending`, blocks presses, and keeps focus. HeroUI CSS applies `status-disabled` (opacity `var(--disabled-opacity)` = 0.5, `pointer-events: none`) to `[aria-disabled="true"]`, which gives the default reduced opacity.
- Focus ring: `:focus-visible` applies `ring-2 ring-focus ring-offset-background`, `--ring-offset-width: 2px`, and `--focus` equals `--accent`. So the ring is already accent, 2px, offset 2px (offset decision recorded in Boundaries).
- Default radius is `rounded-3xl` and the size is 36/40px high; set 12px radius (`rounded-xl`) and full width below 640px (`fullWidth` or class) with at least 44px height on phones via `className`.
- Decision recorded in Boundaries: RAC announces a pending message assertively when a focused button becomes pending.

Fade approach (implementer's choice within boundaries): `QuoteCard` holds the displayed quote and a phase (`idle | out | in`) set on the text wrapper as a data attribute; CSS transitions opacity only. Check `matchMedia('(prefers-reduced-motion: reduce)')` in JS to skip the delay. `Quote` object identity, not text, triggers the swap, so a repeated quote still completes. The card renders the skeleton only when `quote === null`; on `'error'` the hook clears the quote, so Story 2.2 owns that view.

Size note: about 2,000 tokens, above the 1,600 target. Cause: 10 Story 2.1 ACs, the Button API facts, and two open questions; kept as one cohesive file.

## Verification

**Commands:**
- `npm test -w frontend` -- expected: all tests pass, no network or backend
- `npm run typecheck -w frontend` -- expected: no type errors

**Manual checks (if no CLI):**
- Run both dev servers; click "New quote": old quote stays, button dims to "Loading...", then a soft fade swaps text with no layout shift. Tab shows the accent ring; Enter and Space work. With OS reduced motion on, the swap is instant. Check 1280px and 390px widths.
