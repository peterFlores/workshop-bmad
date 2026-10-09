---
title: 'Frontend scaffold and first quote'
type: 'feature'
created: '2026-10-08'
status: 'done'
route: 'dispatch'
baseline_commit: '716cf4760a293e0e89610d2bdc8da0054741d462'
review_loop_iteration: 0
story_key: '1-2-frontend-scaffold-and-first-quote'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-workshop-bmad-2026-10-08/ARCHITECTURE-SPINE.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-workshop-bmad-2026-10-08/DESIGN.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-workshop-bmad-2026-10-08/EXPERIENCE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The backend serves `GET /api/quote` (Story 1.1), but there is no frontend: a user opening the page sees nothing.

**Approach:** Add the `frontend` workspace (Vite 8, React 19, Tailwind 4, HeroUI v3, dark theme only). A `useQuote` hook fetches `/api/quote` once on mount; `QuoteCard` renders a `Skeleton` while loading and the quote with its author when ready; `QuotePage` centers the card.

## Boundaries & Constraints

**Always:**
- Frontend calls only relative `/api/*`; `vite.config.ts` proxies `/api` to `http://localhost:3001` (AD-4). No CORS code anywhere.
- `useQuote` owns all fetch state and returns `{ quote, status: 'loading' | 'ready' | 'error', refetch }` (AD-5). `status` becomes `'error'` on any failure (rejected fetch, non-2xx, invalid JSON); no error UI is built. `refetch` exists and re-runs the request, but nothing calls it yet.
- Components under `components/` take props only and never call `fetch`.
- Quote text and author are rendered byte-for-byte: no `text-transform`, no case change in CSS or code (FR4, UX-DR19). `Quote` has the same fields as the backend (`id`, `quote`, `author`).
- Only HeroUI v3 (`Card`, `Skeleton`) and Tailwind; colors come from DESIGN.md tokens, none hardcoded in components (AD-6). Dark theme only.
- Strict TDD: each test is written and seen failing before its implementation. Tests stub the `/api/quote` response only; they never need the backend or dummyjson.com (AD-7).

**Never:** Build the "New quote" button, loading/disabled state, fade transition, or error/retry UI (Stories 2.1/2.2). Add a title, tagline, icon, navigation, decoration, auto-refresh, sound, confetti, gestures, or keyboard shortcuts. Add a state library, router, or any other UI library. Touch `backend/`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| First load | Mount, request pending | `status: 'loading'`, `quote: null`; card shows `Skeleton` | N/A |
| Success | 200 `{ id: 88, quote: "That'S The Real Trouble With The World, Too Many People Grow Up", author: "Walt Disney" }` | One request; `status: 'ready'`, `quote` equals body; text unchanged | N/A |
| HTTP failure | 502/500 `{ "error": string }` | `status: 'error'`, no throw | Minimal; no UI yet |
| Network or parse failure | fetch rejects or body is not JSON | `status: 'error'`, no throw | Minimal; no UI yet |

</frozen-after-approval>

## Code Map

Backend and root already exist; `frontend/` is new. Root `package.json` already lists the `frontend` workspace and `tsconfig.base.json` exists (strict, ESM, `erasableSyntaxOnly`, `NodeNext`, `types: ["node"]`; the frontend must override `module`/`moduleResolution` to `ESNext`/`Bundler`, `jsx: "react-jsx"`, `lib` with DOM; tests import from `vitest` explicitly, no globals).

- `backend/package.json`, `backend/vitest.config.ts`, `backend/tsconfig.json` -- convention to mirror (`typecheck` script, exact pins, `vitest run`)
- `frontend/package.json` -- `"type": "module"`; scripts `dev` (`vite`), `test` (`vitest run`), `typecheck`; deps `react@19.3.0`, `react-dom@19.3.0`, `@heroui/react@3.2.6`, `@heroui/styles@3.2.6`, `tailwindcss@4.3.3`; devDeps `vite@8.3.4`, `@vitejs/plugin-react@6.1.2`, `@tailwindcss/vite@4.3.3`, `typescript@7.0.2`, `vitest@5.0.3`, `jsdom`, `@testing-library/react`, `@testing-library/dom`, `@testing-library/jest-dom`, `@types/react`, `@types/react-dom`; plus the HeroUI peers (see Design Notes)
- `frontend/tsconfig.json`, `frontend/vite.config.ts`, `frontend/vitest.config.ts` -- extend base; react + tailwind plugins and `/api` proxy; jsdom, setup file
- `frontend/index.html` -- `<html class="dark">`, root div, module script
- `frontend/src/main.tsx` -- mounts `QuotePage` in `StrictMode`, imports `index.css`
- `frontend/src/index.css` -- `@import "@heroui/styles"` and the token overrides
- `frontend/src/domain/quote.ts` -- `Quote` type (same fields as backend)
- `frontend/src/hooks/use-quote.ts` -- fetch state
- `frontend/src/components/quote-card.tsx` -- presentational card (props only)
- `frontend/src/pages/quote-page.tsx` -- calls `useQuote`, lays out the column
- Tests colocated: `use-quote.test.ts`, `quote-card.test.tsx`, `quote-page.test.tsx`, `theme-contrast.test.ts`

## Tasks & Acceptance

**Execution:**
- [x] `frontend/package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `index.html`, `src/test-setup.ts` -- scaffold, `npm install` at root, confirm `npm test -w frontend` runs -- toolchain before tests
- [x] `frontend/src/domain/quote.ts` -- `Quote` type -- shared vocabulary, no test needed
- [x] `frontend/src/theme-contrast.test.ts` then `src/index.css` (+ `src/theme-tokens.ts` exporting the hex values the test reads, if needed) -- compute WCAG ratios, then add the overrides -- UX-DR1/DR2
- [x] `frontend/src/hooks/use-quote.test.ts` then `use-quote.ts` -- stubbed `fetch`: one call on mount (also under StrictMode double-invoke handled by abort/ignore), loading then ready, byte-exact text, errors give `'error'`, `refetch` re-requests -- AD-5
- [x] `frontend/src/components/quote-card.test.tsx` then `quote-card.tsx` -- props `{ quote, status }`: skeleton when loading, text nodes plus em-dash author when ready, no `text-transform`, `aria-live="polite"` region present in both states, no `fetch` -- UX-DR3/4/5/9/11/16/18/19
- [x] `frontend/src/pages/quote-page.test.tsx` then `quote-page.tsx` -- stubbed `/api/quote`: skeleton first, then quote; centered column with 640px max card; no title or extra controls -- UX-DR6/DR21
- [x] `frontend/src/main.tsx` -- mount and CSS import -- entry point

**Acceptance Criteria:**
- Given the backend exists, when scaffolded, then `frontend/` has Vite 8, React 19, Tailwind 4, HeroUI, TypeScript, Vitest, `src/{components,hooks,pages}` and `main.tsx`; `npm run dev -w frontend` serves on 5173; `npm test -w frontend` runs Vitest; `/api` proxies to `http://localhost:3001` and only relative `/api/*` URLs are used (AD-4)
- Given DESIGN.md, when the theme is configured, then dark overrides are background `#0E1116`, surface `#161B22`, surface-border `#262D38`, foreground `#E6EAF0`, muted `#9AA4B2`, accent `#8FB3AE`, accent-foreground `#0E1116`, danger `#E58B8B`, all else inherited from HeroUI dark (UX-DR1); and an automated test shows foreground/surface, muted/surface, accent-foreground/accent, danger/surface each at least 4.5:1 (UX-DR2)
- Given the stubbed 200 response, when `useQuote` first renders, then it fetches `/api/quote` exactly once without user action and moves `'loading'` to `'ready'` with `quote` equal to the body; tests precede the hook and stub only the network (FR8, AD-5, AD-7)
- Given the first request is pending, when the page renders, then a HeroUI `Skeleton` fills the footprint of a typical quote inside the card and the card is never blank (UX-DR9, DR11)
- Given `status: 'ready'`, when `QuoteCard` renders, then quote and author are selectable text nodes, author on its own line prefixed with an em dash, the text is exactly `That'S The Real Trouble With The World, Too Many People Grow Up`, and the component receives props only (UX-DR4, DR18, DR19, AD-5)
- Given the card is rendered, then it is a HeroUI `Card` with surface fill, surface-border hairline, 20px radius, 40px padding (24px below 640px), no shadow; quote in Georgia/"Times New Roman"/serif 28px, weight 400, line-height 1.4, letter-spacing -0.005em, 22px below 640px; author 14px, weight 500, line-height 1.5, letter-spacing 0.04em, muted color (UX-DR3, DR4, DR5)
- Given the page, then it is one centered column, card max 640px, centered vertically and horizontally, 24px gaps, with no title, tagline, icon, navigation, decoration, timer, sound, or confetti (UX-DR6, DR21)
- Given a viewport under 640px, then the card fills the width minus 16px margins with 24px padding and no horizontal scroll (UX-DR20)
- Given the quote region, when a quote arrives, then the region is `aria-live="polite"` and announces the quote and author (UX-DR16, NFR3)
- Given a running backend and normal network, when the page loads, then the quote shows within about 2 seconds (NFR2, manual check)
- Given the project tests, when run with no backend or network, then they pass (AD-7)

## Implementation Notes

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| useQuote abort / stale-response guard unverified | medium | patch | Removing both abort guards still passes all hook tests; no deferred or out-of-order test exists. |
| No-text-transform test cannot observe CSS | medium | patch | vitest uses css:false, so a `text-transform` added to `.quote-text` in index.css would not fail any test. |
| Theme test reads `src/index.css` relative to cwd | low | patch | Fails when vitest runs from another directory; use import.meta.url. |
| Card padding/radius may not override HeroUI defaults (p-4, radius) | maybe-false | defer | Needs a visual check in a browser; unit tests cannot observe it. |
| Error status renders skeleton forever | low | rejected | Error UI is Story 2.2 (FR11); epics.md assigns it there. The hook already reports 'error'. |
| Response shape cast, not validated | low | rejected | Backend adapter validates the shape (Story 1.1); fix adds a validation layer. |
| Stalled request never settles | low | rejected | Backend enforces a 5 s upstream timeout and returns 502. |
| Stale quote retained while loading | false | rejected | Intentional: UX-DR9 keeps the previous quote visible on repeat loads (Story 2.1). |
| tsconfig types omit node for node:fs in a test | false | rejected | `npm run typecheck -w frontend` passes clean. |
| Tokens only defined under .dark | low | rejected | index.html sets class="dark" and the app is dark-only by design. |
| aria-live replaced wholesale, skeleton unlabeled, no h1 | low | rejected | Loading and error announcements land in Stories 2.1 and 2.2; UX-DR21 forbids a title. |
| Missing #root guard, dependency pins, build script, meta tags, README | low | rejected | Cosmetic for a demo; README lands in Story 2.2. |

## Design Notes

HeroUI setup verified by inspecting the published `@heroui/react@3.2.6` and `@heroui/styles@3.2.6` tarballs (package.json, README, `dist/` CSS and `.d.ts`), not community sources:
- No provider: the React README states no `<Provider>` is needed. Import `Card` and `Skeleton` from `@heroui/react`; `Card` is compound (`Card.Header`, `Card.Title`, `Card.Description`, `Card.Content`, `Card.Footer`) and takes `variant` and `className`. `Skeleton` takes `animationType` and `className`.
- CSS: a single `@import "@heroui/styles";` in the main CSS file pulls Tailwind, `tw-animate-css`, base, component styles, default theme, and utilities (it already runs `@import "tailwindcss"`, so do not duplicate it). The Vite entry must be `@tailwindcss/vite`.
- Dark mode: variables are scoped to `.dark` or `[data-theme="dark"]`; set `<html class="dark">` in `index.html`. Dark mode already sets `--surface-shadow` to none.
- Token overrides use plain CSS variables, applied after the HeroUI import and scoped to the same selector, e.g. `.dark { --background: #0E1116; --surface: #161B22; --border: #262D38; --foreground: #E6EAF0; --muted: #9AA4B2; --accent: #8FB3AE; --accent-foreground: #0E1116; --danger: #E58B8B; }`. HeroUI has no `surface-border` token; its border variable is `--border`, so `surface-border` maps to `--border`. HeroUI has no `quote`/`author` typography tokens either; define them in `index.css` (custom properties or `@theme`) per DESIGN.md.
- `Card` defaults to `p-4`, `shadow-surface` and a radius of `min(32px, var(--radius-3xl))`, so the 20px radius and 40px/24px padding must be set explicitly through `className` or an override.
- Peer dependencies of `@heroui/react@3.2.6` to install explicitly: `react-aria@^3.52.1`, `react-aria-components@^1.21.1`, `@internationalized/date@^3.12.4`, `@react-aria/ssr@^3.10.1`, `@react-aria/utils@^3.34.1`.
- Not yet run: rendering of these components under jsdom, and whether Vitest needs `server.deps.inline` for `@heroui/react`. If so, record it in Implementation Notes. If TypeScript 7 causes friction with the frontend toolchain, fall back to 5.x as the architecture allows.

Other: the quote region is a persistent `aria-live="polite"` container that exists from the first render (skeleton inside), so the arriving quote is announced. Contrast is tested from the same token values `index.css` declares, so they cannot drift.

Size note: this spec is above the 1600-token target (about 2,900 tokens) because Story 1.2 carries 11 ACs across scaffold, theme, hook, and UI; it stays one cohesive file.

## Verification

**Commands:**
- `npm install` -- expected: succeeds with both workspaces
- `npm test -w frontend` -- expected: all tests pass, no network, backend not running
- `npm run typecheck -w frontend` -- expected: no type errors
- `npm run build -w frontend` is not required; `npm run dev -w backend` and `npm run dev -w frontend` together -- expected: http://localhost:5173 shows a quote card

**Manual checks (if no CLI):**
- At 1280px and 390px widths: card centered, 640px max on desktop, 16px margins on phone, no horizontal scroll, quote text selectable and unchanged in case.
