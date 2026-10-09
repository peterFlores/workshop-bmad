---
status: final
stepsCompleted: [1, 2, 3]
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-workshop-bmad-2026-10-08/prd.md
  - _bmad-output/planning-artifacts/architecture/architecture-workshop-bmad-2026-10-08/ARCHITECTURE-SPINE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-workshop-bmad-2026-10-08/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-workshop-bmad-2026-10-08/EXPERIENCE.md
---

# workshop-bmad - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for workshop-bmad (Random Quote Generator), decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: The backend exposes exactly one endpoint, `GET /api/quote`, that returns one random quote.
FR2: The backend obtains the quote by calling `GET https://dummyjson.com/quotes/random` (no authentication) on each request.
FR3: The response body is JSON with `id` (number), `quote` (string), and `author` (string), matching the upstream contract, for example `{"id":88,"quote":"That'S The Real Trouble With The World, Too Many People Grow Up","author":"Walt Disney"}`.
FR4: The quote text is returned as received, with no case normalization (the upstream sends Title Case).
FR5: If the upstream call fails or times out, the backend responds with a non-2xx status and a JSON error message instead of crashing.
FR6: The backend allows the React page to call it during local development (CORS or dev proxy).
FR7: The page, built with React and HeroUI, shows a single quote card with the quote text and the author's name.
FR8: On first load, the page fetches and displays a quote automatically.
FR9: A "New quote" button fetches and displays a different random quote.
FR10: While a quote is loading, the page shows a loading state and the button is disabled.
FR11: If fetching fails, the page shows a friendly error message and a retry action; it never shows a blank or broken card.
FR12: The page is visually polished ("beautiful"): clear typographic hierarchy for the quote and the author, comfortable spacing, and usable on both desktop and phone widths.

### NonFunctional Requirements

NFR1: Simplicity. Minimal dependencies and a small, readable codebase, since attendees will read it live.
NFR2: Responsiveness. A new quote appears within about 2 seconds under normal network conditions.
NFR3: Accessibility. Quote and author are real text (not images); the button is keyboard-operable with a visible focus state; loading and error states are announced to assistive tech.
NFR4: Demo reliability. The app starts locally with one documented command per part (backend, frontend).

### Additional Requirements

- No starter template applies. The repository needs a manual scaffold using npm workspaces (root `package.json` with workspaces `backend` and `frontend`); this scaffold belongs in Epic 1 Story 1.
- Repository layout (structural seed): `backend/src/{domain,service,adapters,http}` plus `main.ts` as composition root; `frontend/src/{components,hooks,pages}` plus `main.tsx`; `frontend/vite.config.ts` with the react and tailwind plugins and the `/api` proxy.
- Pinned stack: Node.js 24.21.0 (engines `>=24`), TypeScript 7.0.2, Express 5.2.1, Vite 8.3.4, @vitejs/plugin-react 6.1.2, React and React DOM 19.3.0, @heroui/react and @heroui/styles 3.2.6, Tailwind CSS and @tailwindcss/vite 4.3.3, Vitest 5.0.3.
- TypeScript pin fallback: if tooling friction appears with TypeScript 7.x, downgrade to the latest 5.x.
- Runtime envelope: local only, two processes (Express on port 3001, Vite dev server on port 5173), no deployment, CI, containers, or hosting.
- Documented start commands: `npm run dev -w backend` and `npm run dev -w frontend` (one command per part).
- Backend environment variables, read once at startup with defaults: `PORT` (3001), `UPSTREAM_URL` (`https://dummyjson.com/quotes/random`), `UPSTREAM_TIMEOUT_MS` (5000).
- AD-1: The service depends only on the port `QuoteSource.getRandom(): Promise<Quote>`. Only `adapters/dummyjson` knows the upstream URL, timeout, and wire format. Adapters throw `UpstreamError`; no other module catches raw fetch errors. `service` and the port never import Express, `fetch`, or adapter code (inward-only dependency rule).
- AD-2: `Quote = { id: number; quote: string; author: string }` is defined once in each package with identical fields. Text is never transformed on either side.
- AD-3: `UpstreamError` (including the 5 s timeout) maps to HTTP 502 with `{ "error": string }`; any other failure maps to HTTP 500 with the same shape. Mapping happens at the HTTP edge. `useQuote` treats any non-2xx or network failure as a single `error` state.
- AD-4: The frontend calls only relative `/api/*`; the Vite dev server proxies `/api` to the backend port; the backend adds no CORS middleware.
- AD-5: `useQuote` owns all fetch state and returns `{ quote, status: 'loading' | 'ready' | 'error', refetch }`. The button is disabled while `status` is `loading`. Components under `components/` receive props only (container/presentational split).
- AD-6: HeroUI v3 components (`Card`, `Button`, `Skeleton`) with the dark theme are the only UI system; design deltas come only from DESIGN.md tokens. No provider is needed in HeroUI v3; Tailwind CSS 4 is required. No other UI library.
- AD-7: Strict TDD with Vitest in both packages, tests written first and colocated as `*.test.ts(x)`. Service and HTTP tests use a fake `QuoteSource`; the adapter is tested against a stubbed `fetch`; frontend tests stub the `/api/quote` response. Tests never hit dummyjson.com.
- Conventions: files in `kebab-case.ts(x)`, React components in `PascalCase`; JSON only; errors shaped `{ "error": string }`; no envelope on success; backend is stateless with no persistence; logging via `console` only.
- Hexagonal backend layering: `http` (driving adapter) calls `service`, which depends on the `QuoteSource` port; `dummyjson` (driven adapter) implements it; `main.ts` wires the composition root.
- Deferred and out of scope for v1: deployment, authentication, rate limiting, caching, persistence, structured logging and metrics, production serving of the built frontend, favorites or history, quote text normalization, i18n.

### UX Design Requirements

UX-DR1: Define the dark-theme color tokens as HeroUI overrides: background `#0E1116`, surface `#161B22`, surface-border `#262D38`, foreground `#E6EAF0`, muted `#9AA4B2`, accent `#8FB3AE`, accent-foreground `#0E1116`, danger `#E58B8B`; all other tokens inherit HeroUI dark defaults.
UX-DR2: Text color pairs (foreground and muted on surface, accent-foreground on accent, danger on surface) meet WCAG AA contrast of at least 4.5:1, verified by a test or documented check.
UX-DR3: The quote text uses the serif typography token (Georgia, "Times New Roman", serif; 28px; weight 400; line-height 1.4; letter-spacing -0.005em), switching to the `quote-sm` token (22px) below 640px.
UX-DR4: The author line uses the author token (inherited sans, 14px, weight 500, line-height 1.5, letter-spacing 0.04em) in the muted color, displayed below the quote and prefixed with an em dash.
UX-DR5: The quote card is a HeroUI `Card` with surface fill, surface-border hairline border, 20px radius, 40px padding (24px on phones), and no shadow (flat elevation).
UX-DR6: The layout is a single centered column with the card at a maximum width of 640px, centered vertically and horizontally in the viewport, with a 24px gap between quote, author, and button. The page contains only the card and the button: no title, tagline, icons, navigation, or decoration.
UX-DR7: The "New quote" button is a HeroUI `Button`, solid, accent fill with accent-foreground text and 12px radius; the accent color is used only for the primary button and the focus ring.
UX-DR8: The button focus ring uses the accent color with a 2px offset against the surface color and is visible on keyboard focus.
UX-DR9: Loading on first load renders a HeroUI `Skeleton` at the same footprint as a typical quote; on repeat loads the previous quote stays visible until the new one is ready (no skeleton).
UX-DR10: While loading, the button is disabled with HeroUI's default reduced opacity, its label changes to "Loading...", and it keeps its position in the tab order.
UX-DR11: The card footprint stays constant across loading, loaded, and error states; the layout never jumps between states and the card is never blank or broken.
UX-DR12: The error state replaces any previous quote with the message "Couldn't load a quote. Please try again." in the danger color, plus a primary-style "Try again" button that re-runs the fetch with the same behavior as "New quote"; the button is re-enabled.
UX-DR13: Copy follows the voice table exactly: "New quote", "Loading...", "Loading a new quote" (announced), "Couldn't load a quote. Please try again.", "Try again"; no exclamation marks, emoji, or technical error codes.
UX-DR14: When a new quote arrives, the old text fades out in about 150 ms and the new text fades in in about 250 ms; only opacity animates and the card does not resize or move.
UX-DR15: When `prefers-reduced-motion: reduce` is set, the fade is replaced by an instant swap with no animation of any kind.
UX-DR16: The quote region is an `aria-live="polite"` region that announces "Loading a new quote" when loading starts and the new quote when it arrives.
UX-DR17: The error message sits in a `role="alert"` (assertive) region so failure is announced immediately; focus stays on the retry button.
UX-DR18: Quote and author are real, selectable text nodes (not images); the button is a native `<button>`, keyboard-operable with `Tab` and `Enter` or `Space`; focus is never moved or lost when state changes; tab order follows reading order.
UX-DR19: Quote text is rendered exactly as received (Title Case, for example `That'S`) with no case transforms in CSS or code.
UX-DR20: Desktop (640px and up) shows the card at 640px max width with the quote token and 40px padding. Phone (under 640px) shows the card filling the width minus 16px page margins, the `quote-sm` token, 24px padding, a full-width button with a touch target at least 44px high, and no horizontal scroll.
UX-DR21: Banned behaviors: auto-refresh timers, auto-advancing quotes, sound, confetti or celebratory effects, swipe or gesture interactions, and custom keyboard shortcuts.

### FR Coverage Map

FR1: Epic 1 - Single `GET /api/quote` endpoint
FR2: Epic 1 - Backend calls the dummyjson random-quote upstream on each request
FR3: Epic 1 - Response shape `{ id, quote, author }` matching the upstream contract
FR4: Epic 1 - Quote text passed through unchanged (no case normalization)
FR5: Epic 1 - Upstream failure or timeout returns non-2xx with JSON `{ error }`
FR6: Epic 1 - Dev-time access from the React page via the `/api` proxy
FR7: Epic 1 - Single HeroUI quote card with quote text and author
FR8: Epic 1 - Quote fetched and displayed automatically on first load
FR9: Epic 2 - "New quote" button fetches and displays another quote
FR10: Epic 2 - Loading state with the button disabled while fetching
FR11: Epic 2 - Friendly error message with retry; never a blank or broken card
FR12: Epic 1 - Polished visual design, responsive on desktop and phone

NFR1-NFR4 apply across both epics: simplicity (minimal dependencies, small readable code), responsiveness (new quote in about 2 seconds), accessibility (real text, keyboard-operable button, announced states), and demo reliability (one documented start command per part).

## Epic List

### Epic 1: See a random quote

A user opens the page and sees a quote with its author. Delivers the full vertical slice from the `GET /api/quote` endpoint to the styled quote card, including the project scaffold.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR12

### Epic 2: Get new quotes and recover from failures

A user can request another quote with a smooth fade, and failures degrade gracefully with a clear message and a retry action.
**FRs covered:** FR9, FR10, FR11

## Epic 1: See a random quote

A user opens the page and sees a quote with its author. Delivers the full vertical slice from the `GET /api/quote` endpoint to the styled quote card, including the project scaffold.

### Story 1.1: Backend GET /api/quote

As a frontend developer,
I want a backend endpoint `GET /api/quote` that returns one random quote from the upstream service,
So that the page has a single, stable, well-shaped source of quotes and failures are reported in a predictable way.

**Fulfills:** FR1, FR2, FR3, FR4, FR5, FR6 (via AD-4: no CORS middleware, proxy handled in Story 1.2); NFR1, NFR4 (backend start command); AD-1, AD-2, AD-3, AD-7.

**Acceptance Criteria:**

**Given** the repository has no code yet
**When** the scaffold is created
**Then** the root `package.json` declares npm workspaces `backend` and `frontend` and `engines.node >=24`
**And** `backend/` contains `src/{domain,service,adapters,http}` and `main.ts` as the composition root, with TypeScript and Vitest configured
**And** `npm run dev -w backend` starts Express on port 3001 (overridable through `PORT`) and `npm test -w backend` runs Vitest

**Given** the domain layer
**When** `Quote` and `UpstreamError` are defined
**Then** `Quote` is `{ id: number; quote: string; author: string }` and `UpstreamError` is a distinct error class (AD-2, AD-3)
**And** the port `QuoteSource.getRandom(): Promise<Quote>` exists, and `service` and the port import neither Express, `fetch`, nor adapter code (AD-1)

**Given** a fake `QuoteSource` that resolves `{ id: 88, quote: "That'S The Real Trouble With The World, Too Many People Grow Up", author: "Walt Disney" }`
**When** the quote service is called
**Then** it returns that quote unchanged (tests written first, mocking only at the port)

**Given** a stubbed `fetch` returning upstream JSON with extra fields besides `id`, `quote`, `author`
**When** the dummyjson adapter's `getRandom()` is called
**Then** it requests `UPSTREAM_URL` (default `https://dummyjson.com/quotes/random`, no authentication) exactly once per call
**And** it returns an object with only `id` (number), `quote` (string), and `author` (string)
**And** the `quote` text is returned byte-for-byte as received, including Title Case such as `That'S` (FR4)

**Given** a stubbed `fetch` that does not respond within `UPSTREAM_TIMEOUT_MS` (default 5000)
**When** the adapter is called
**Then** the request is aborted and the adapter throws `UpstreamError`

**Given** a stubbed `fetch` that rejects, returns a non-2xx status, or returns a body that is not valid JSON or lacks `id`, `quote`, or `author`
**When** the adapter is called
**Then** it throws `UpstreamError` and no raw fetch or parse error escapes the adapter (AD-1)

**Given** the HTTP layer wired with a fake `QuoteSource` that resolves a quote
**When** `GET /api/quote` is requested
**Then** the response is 200 with a JSON body `{ id, quote, author }` and no envelope
**And** two consecutive calls that receive the same quote from the source both return it (a repeated quote is acceptable)

**Given** the HTTP layer wired with a fake `QuoteSource` that rejects with `UpstreamError`
**When** `GET /api/quote` is requested
**Then** the response is 502 with JSON `{ "error": string }`

**Given** the HTTP layer wired with a fake `QuoteSource` that rejects with any other error
**When** `GET /api/quote` is requested
**Then** the response is 500 with JSON `{ "error": string }`
**And** the process keeps running and serves the next request

**Given** the backend is running
**When** any route other than `GET /api/quote` is requested
**Then** the backend exposes no other endpoint (FR1) and registers no CORS middleware (AD-4)

**Given** the full backend test suite
**When** it runs
**Then** it passes without network access, never contacting dummyjson.com (AD-7)
**And** `PORT`, `UPSTREAM_URL`, and `UPSTREAM_TIMEOUT_MS` are read once at startup in `main.ts` with the documented defaults

### Story 1.2: Frontend scaffold and first quote

As a user,
I want to open the page and immediately see a random quote with its author on a polished dark card,
So that I get a pleasant, readable quote without any action.

**Fulfills:** FR6 (dev proxy), FR7, FR8, FR12; NFR1, NFR2, NFR3, NFR4 (frontend start command); AD-2, AD-4, AD-5, AD-6, AD-7; UX-DR1, UX-DR2, UX-DR3, UX-DR4, UX-DR5, UX-DR6, UX-DR9, UX-DR11, UX-DR16 (quote region, arrival announcement), UX-DR18, UX-DR19, UX-DR20, UX-DR21.

**Acceptance Criteria:**

**Given** the backend workspace from Story 1.1 exists
**When** the frontend workspace is scaffolded
**Then** `frontend/` contains Vite 8, React 19, Tailwind CSS 4 (`@tailwindcss/vite`), `@heroui/react` and `@heroui/styles`, TypeScript, and Vitest with `src/{components,hooks,pages}` and `main.tsx`
**And** `npm run dev -w frontend` serves the app on port 5173 and `npm test -w frontend` runs Vitest
**And** `vite.config.ts` proxies `/api` to `http://localhost:3001` and the frontend only calls relative `/api/*` URLs (AD-4)

**Given** the design tokens in DESIGN.md
**When** the theme is configured
**Then** the dark theme overrides background `#0E1116`, surface `#161B22`, surface-border `#262D38`, foreground `#E6EAF0`, muted `#9AA4B2`, accent `#8FB3AE`, accent-foreground `#0E1116`, and danger `#E58B8B`, with all other tokens inheriting HeroUI dark defaults (UX-DR1)
**And** an automated test computes the WCAG contrast of foreground on surface, muted on surface, accent-foreground on accent, and danger on surface, and each ratio is at least 4.5:1 (UX-DR2)

**Given** a stubbed `/api/quote` that returns 200 with `{ id: 88, quote: "That'S The Real Trouble With The World, Too Many People Grow Up", author: "Walt Disney" }`
**When** `useQuote` is first rendered
**Then** it fetches `/api/quote` exactly once on mount without any user action (FR8)
**And** it returns `{ quote, status, refetch }` with `status` moving from `'loading'` to `'ready'` and `quote` equal to the response (AD-5)
**And** the tests are written before the hook and stub the network response only (AD-7)

**Given** the first request has not yet resolved
**When** the page renders
**Then** a HeroUI `Skeleton` is shown at the same footprint as a typical quote inside the card (UX-DR9)
**And** the card is never blank or broken (UX-DR11)

**Given** `useQuote` returns `status: 'ready'`
**When** `QuoteCard` renders
**Then** the quote text and author appear as real, selectable text nodes, with the author on its own line below the quote prefixed with an em dash (UX-DR4, UX-DR18)
**And** the text is exactly `That'S The Real Trouble With The World, Too Many People Grow Up`, with no `text-transform` or case change in CSS or code (FR4, UX-DR19)
**And** `QuoteCard` and other components under `components/` receive props only and do not call `fetch` (AD-5)

**Given** the card is rendered
**When** its styles are inspected
**Then** it is a HeroUI `Card` with surface fill, surface-border hairline border, 20px radius, 40px padding (24px below 640px), and no shadow (UX-DR5)
**And** the quote uses the serif token (Georgia, "Times New Roman", serif; 28px; weight 400; line-height 1.4; letter-spacing -0.005em) and `quote-sm` (22px) below 640px (UX-DR3)
**And** the author uses the author token (14px, weight 500, line-height 1.5, letter-spacing 0.04em) in the muted color (UX-DR4)

**Given** the page is rendered
**When** the layout is inspected
**Then** it is a single centered column with the card at a maximum width of 640px, centered vertically and horizontally, and a 24px gap between elements (UX-DR6)
**And** the page contains no title, tagline, icon, navigation, decoration, auto-refresh timer, sound, or confetti (UX-DR6, UX-DR21)

**Given** a viewport under 640px wide
**When** the page renders
**Then** the card fills the width minus 16px page margins with 24px padding and the `quote-sm` token, and the page has no horizontal scroll (UX-DR20)

**Given** the quote region
**When** a quote arrives
**Then** the region is `aria-live="polite"` and the new quote and author are announced to assistive technology (UX-DR16, NFR3)

**Given** a normal network and a running backend
**When** the page loads
**Then** the quote is displayed within about 2 seconds (NFR2)

**Given** the project tests
**When** they run
**Then** they pass without the backend or dummyjson.com being available (AD-7)

## Epic 2: Get new quotes and recover from failures

A user can request another quote with a smooth fade, and failures degrade gracefully with a clear message and a retry action.

### Story 2.1: New quote button with loading state and fade

As a user,
I want a "New quote" button that loads another quote with a gentle transition,
So that I can keep reading quotes without the page jumping or flashing.

**Fulfills:** FR9, FR10; NFR2, NFR3; AD-5, AD-6, AD-7; UX-DR7, UX-DR8, UX-DR9 (repeat loads), UX-DR10, UX-DR11, UX-DR13, UX-DR14, UX-DR15, UX-DR16, UX-DR18, UX-DR21.

**Acceptance Criteria:**

**Given** the first quote is displayed (`status: 'ready'`)
**When** the page renders
**Then** a native `<button>` labelled "New quote" appears below the card, built with a HeroUI `Button`, solid, accent fill, accent-foreground text, 12px radius (UX-DR7, UX-DR13)
**And** the accent color is used only for this button and its focus ring (UX-DR7)

**Given** the button is focused with the keyboard
**When** `Tab` brings focus to it
**Then** a 2px accent focus ring offset by 2px against the surface color is visible (UX-DR8, NFR3)
**And** `Enter` and `Space` both activate it and focus stays on the button after activation (UX-DR18)

**Given** a stubbed `/api/quote` that resolves a second, different quote after a delay
**When** the user clicks "New quote"
**Then** `useQuote.refetch()` issues exactly one new request and `status` becomes `'loading'` (FR9, AD-5)
**And** the button is disabled with HeroUI default reduced opacity, its label is "Loading...", and it stays in the tab order (FR10, UX-DR10, UX-DR13)
**And** a second click while loading triggers no additional request

**Given** `status` is `'loading'` after a repeat request
**When** the card renders
**Then** the previous quote stays visible and no `Skeleton` is shown (UX-DR9)
**And** the card footprint does not change size or position (UX-DR11)

**Given** loading starts
**When** the live region updates
**Then** it announces "Loading a new quote", and when the new quote arrives it announces the new quote (UX-DR16, UX-DR13, NFR3)

**Given** the new quote has arrived
**When** the transition runs
**Then** the old text fades out in about 150 ms and the new text fades in in about 250 ms, animating opacity only (UX-DR14)
**And** the card does not resize or move
**And** the button returns to "New quote" and is enabled

**Given** `prefers-reduced-motion: reduce` is set
**When** a new quote arrives
**Then** the text swaps instantly with no animation or transition of any kind (UX-DR15)

**Given** the upstream returns the same quote twice in a row
**When** the second response arrives
**Then** the quote is displayed again without error and the loading state completes normally (a repeated quote is acceptable)

**Given** the quote text has Title Case such as `That'S`
**When** it is shown after a fade
**Then** it is rendered exactly as received (UX-DR19 preserved)

**Given** the page
**When** it is inspected for banned behaviors
**Then** there is no auto-refresh, auto-advance, swipe or gesture handling, or custom keyboard shortcut (UX-DR21)

**Given** a normal network
**When** the user clicks "New quote"
**Then** the new quote is displayed within about 2 seconds (NFR2)

**Given** the tests for this story
**When** they run
**Then** they were written first, stub only the `/api/quote` response, and use fake timers or media-query mocks for the fade and reduced-motion cases (AD-7)

### Story 2.2: Error state with retry, announcements, and run documentation

As a user,
I want a clear message and a "Try again" button when a quote cannot be loaded,
So that I can recover without reloading the page or seeing a broken card.

**Fulfills:** FR11, FR12 (responsive polish); NFR1, NFR3, NFR4; AD-3, AD-5, AD-7; UX-DR11, UX-DR12, UX-DR13, UX-DR15, UX-DR17, UX-DR18, UX-DR20.

**Acceptance Criteria:**

**Given** a stubbed `/api/quote` that returns 502 `{ "error": "..." }`
**When** `useQuote` fetches
**Then** `status` becomes `'error'` and `quote` is cleared (AD-3, AD-5)

**Given** a stubbed `/api/quote` that returns 500 `{ "error": "..." }`, a non-JSON body, or a network failure (rejected fetch)
**When** `useQuote` fetches
**Then** each case yields the same single `'error'` status (AD-3)

**Given** `status` is `'error'`
**When** the card renders
**Then** it shows exactly "Couldn't load a quote. Please try again." in the danger color, replacing any previous quote (UX-DR12, UX-DR13)
**And** the message contains no exclamation mark, emoji, status code, or technical detail from the `error` field (UX-DR13)
**And** the card keeps its footprint with no layout jump and is never blank or broken (UX-DR11, FR11)

**Given** `status` is `'error'`
**When** the message is rendered
**Then** it sits in a `role="alert"` region so the failure is announced immediately (UX-DR17, NFR3)
**And** keyboard focus is not moved or lost when the state changes (UX-DR17, UX-DR18)

**Given** `status` is `'error'`
**When** the button area renders
**Then** a primary-style button labelled "Try again" is shown and is enabled (UX-DR12, UX-DR13)
**And** it is a native `<button>`, keyboard-operable with `Tab`, `Enter`, and `Space`, with the same accent focus ring as "New quote" (UX-DR18)

**Given** the error state and a stub that now returns a quote
**When** the user activates "Try again"
**Then** `refetch()` runs with the same behavior as "New quote": loading state, disabled button labelled "Loading...", then the new quote (UX-DR12, FR9, FR10)
**And** focus stays on the button, the error message is removed, and the button returns to "New quote"

**Given** the error state and a stub that fails again
**When** the user activates "Try again"
**Then** the error state is shown again with the button re-enabled, and the user can retry repeatedly

**Given** the first load fails
**When** the page renders
**Then** the error state appears instead of the skeleton and no stale or empty quote is visible (FR11, UX-DR11)

**Given** `prefers-reduced-motion: reduce` is set
**When** the state changes between loading, quote, and error
**Then** no animation of any kind runs (UX-DR15)

**Given** a viewport under 640px wide
**When** the quote, loading, and error states are each checked
**Then** the card fills the width minus 16px margins, the button is full width with a touch target at least 44px high, and there is no horizontal scroll (UX-DR20, FR12)
**And** at 640px and wider the card is 640px max width with 40px padding (UX-DR20)

**Given** the repository README
**When** a developer follows it
**Then** it documents `npm install`, `npm run dev -w backend` (port 3001), and `npm run dev -w frontend` (port 5173) as one command per part, plus the `PORT`, `UPSTREAM_URL`, and `UPSTREAM_TIMEOUT_MS` environment variables and the `npm test -w <workspace>` commands (NFR4, NFR1)
**And** running the two documented commands yields a working app on `http://localhost:5173`

**Given** the tests for this story
**When** they run
**Then** they were written first and stub only the `/api/quote` response (AD-7)
