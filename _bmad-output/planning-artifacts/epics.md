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

FR1: The backend exposes `GET /api/quote`, which returns one random quote. Additional backend capabilities for history and favorites are specified in FR13 to FR19.
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
FR13: Every quote displayed to the user is recorded in a history.
FR14: The user can view the history, listed newest first, showing each quote's text and author.
FR15: The history is still present, in the same order, after the app is restarted.
FR16: Each displayed quote (on the main card and in the history list) has a heart button that saves it as a favorite.
FR17: The heart shows whether the quote is currently a favorite, and pressing it on a favorite removes it from favorites. Removing a favorite also removes every entry of that quote from the history.
FR18: The user can view all favorites in one place.
FR19: Favorites are still present after the app is restarted.

### NonFunctional Requirements

NFR1: Simplicity. Minimal dependencies and a small, readable codebase, since attendees will read it live.
NFR2: Responsiveness. A new quote appears within about 2 seconds under normal network conditions.
NFR3: Accessibility. Quote and author are real text (not images); the button is keyboard-operable with a visible focus state; loading and error states are announced to assistive tech.
NFR4: Demo reliability. The app starts locally with one documented command per part (backend, frontend).
NFR5: Persistence. History and favorites survive an app restart. Storage must not require a separate database server process; the app stays runnable with the NFR4 commands only.
NFR6: Accessibility of the heart. The heart button is keyboard-operable with a visible focus state, has an accessible name, and exposes its on/off state to assistive tech, not by color alone.

### Additional Requirements

- No starter template applies. The repository needs a manual scaffold using npm workspaces (root `package.json` with workspaces `backend` and `frontend`); this scaffold belongs in Epic 1 Story 1.
- Repository layout (structural seed): `backend/src/{domain,service,adapters,http}` plus `main.ts` as composition root; `frontend/src/{components,hooks,pages}` plus `main.tsx`; `frontend/vite.config.ts` with the react and tailwind plugins and the `/api` proxy.
- Pinned stack (updated 2026-10-09): Node.js 24.21.0 (engines `^24`, `.nvmrc` 24.21.0; Vitest 5.0.3 does not support Node 25), TypeScript 7.0.2, Express 5.3.0, better-sqlite3 13.0.3 with @types/better-sqlite3 9.6.0 (native addon with prebuilt binaries), @types/node 24.19.1, tsx 4.23.15, the HeroUI peer dependencies (react-aria-components, react-aria, @react-aria/ssr, @react-aria/utils, @internationalized/date), Vite 8.3.4, @vitejs/plugin-react 6.1.2, React and React DOM 19.3.0, @heroui/react and @heroui/styles 3.2.6, Tailwind CSS and @tailwindcss/vite 4.3.3, Vitest 5.0.3.
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
- AD-8: Persistence sits behind the synchronous `QuoteStore` port, implemented only by `adapters/sqlite` on better-sqlite3. The database is a single file at `DATA_FILE` (default `backend/data/quotes.db`, resolved from the backend package root, gitignored). Schema is created at startup if missing; WAL off, synchronous writes. A corrupt or locked file fails startup fast with a clear console error and non-zero exit, and is never auto-deleted. Port methods: `addHistory(quote, recordedAt): HistoryEntry`, `listHistory(): HistoryEntry[]`, `listFavorites(): Quote[]`, `addFavorite(quote, favoritedAt): void` (insert-or-ignore), `removeFavoriteAndHistory(quoteId): void` (one transaction, the only delete). One shared contract test suite runs against the in-memory fake and the sqlite adapter.
- AD-9: `GET /api/quote` records nothing. The frontend calls `POST /api/history` (body `Quote`) exactly once per quote rendered in `ready` state; `QuotePage` guards with a ref keyed on the quote object (StrictMode-safe). The service validates the body, sets `recordedAt`, and returns 201 with `HistoryEntry = { entryId: number, quote: Quote, recordedAt: string }` (ISO-8601 UTC). `entryId` is `INTEGER PRIMARY KEY AUTOINCREMENT` and defines order. `GET /api/history` returns `HistoryEntry[]` newest first, no cap, no envelope. A failed record never blocks or hides the displayed quote; it is logged to `console` only.
- AD-10: Quote identity is the upstream `quote.id`. Favorites are a separate table keyed by `quote.id` with a snapshot of quote and author and a `favoritedAt` column. `GET /api/favorites` returns `Quote[]` newest favorite first. `PUT /api/favorites/:id` takes a `Quote` body, path id must equal `body.id` else 400, repeat PUT keeps the first snapshot, returns 204. `DELETE /api/favorites/:id` returns 204; if the quote is a favorite, one transaction removes the favorite and every history row with that `quote.id`; if not a favorite, nothing changes. Invalid bodies or ids return 400 in the AD-3 error shape.
- AD-11: `useFavorites` returns `{ favorites, isFavorite(quoteId), toggle(quote), status }`, is the only source of heart state, and is called once in `QuotePage`; every `HeartButton` receives the same `onToggle` (history rows call it with `entry.quote`). `toggle` is confirm-then-update and ignores calls for a quote id whose request is pending. `useHistory` returns `{ history, status, refresh }`; `refresh` is latest-wins. `QuotePage` calls `refresh` after each successful history POST and after each toggle that removes a favorite. Components never call `fetch`.
- AD-3 amendment: invalid request bodies or ids map to HTTP 400 with `{ "error": string }`.
- AD-6 amendment: one shared presentational `HeartButton` (HeroUI `Button`, icon only) takes `{ isFavorite, onToggle }`, has an accessible name, and exposes state via `aria-pressed`, never by color alone.
- AD-7 amendment: service and HTTP tests use an in-memory fake `QuoteStore`; the sqlite adapter is tested against a real better-sqlite3 database (`:memory:`, plus one temp-file test that closes and reopens it to prove restart persistence); frontend tests stub `/api/*`.
- New backend environment variable: `DATA_FILE` (default `backend/data/quotes.db`). Demo reset: stop the backend and delete the file at `DATA_FILE`.
- Frontend `tsconfig` must include `types: ["vite/client"]` (TypeScript 7 rejects bare CSS imports otherwise). The Vite proxy targets `http://localhost:${PORT ?? 3001}`.
- Conventions: files in `kebab-case.ts(x)`, React components in `PascalCase`; JSON only; errors shaped `{ "error": string }`; no envelope on success; all persistent state lives in the SQLite file behind `QuoteStore`, no other backend state; logging via `console` only.
- Hexagonal backend layering: `http` (driving adapter) calls `service`, which depends on the `QuoteSource` port; `dummyjson` (driven adapter) implements it; `main.ts` wires the composition root.
- Deferred and out of scope: deployment, authentication, rate limiting, caching, structured logging and metrics, production serving of the built frontend, quote text normalization, i18n, sharing, themes, accounts (single user, one shared history and favorites set per install), history size cap, pagination, and schema migrations beyond create-if-missing.

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
UX-DR21: Banned behaviors: auto-refresh timers, auto-advancing quotes, sound, confetti or celebratory effects, swipe or gesture interactions, custom keyboard shortcuts, and undo toasts.
UX-DR22: The heart is an icon-only HeroUI `Button`, ghost style, at least 44px square on phones; not favorite is an outline heart in the muted color, favorite is a filled heart in the accent color. It sits at the top right of the quote card and at the right of each list row. The accent color is used only for the primary button, the focus ring, and the filled heart.
UX-DR23: History and Favorites are two stacked sections below the quote card in the same column and width (History first), each a HeroUI `Card` with a small heading ("History", "Favorites") and rows separated by a hairline surface-border. Each row shows the quote in body typography and the author below in the author token with an em dash, and the heart at the right. Empty lists show one muted line ("No history yet." / "No favorites yet.") under the heading.
UX-DR24: Heart behavior: it reflects favorite state via `aria-pressed`, updates only after the server confirms, is disabled while its own request is pending (on the card also while a quote is loading), and is not shown in the error state. The currently shown quote appears at the top of History once displayed.
UX-DR25: Heart accessibility: native `<button>` with the constant accessible name "Favorite this quote" and `aria-pressed` true or false; state is shown by outline versus filled shape, not by color alone; visible focus ring in the accent color; touch target at least 44px on phones.
UX-DR26: Each list is a real list (`<ul>`/`<li>`) under a heading; each row's quote text is associated with its heart via `aria-describedby`. Tab order is card content, heart, "New quote" button (or retry), History rows, Favorites rows.
UX-DR27: When unfavoriting removes the focused row (from History or Favorites), focus moves to the next row's heart, or to the section heading if none remain.

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

FR13: Epic 3 (Story 3.1) - Every displayed quote is recorded via `POST /api/history`
FR14: Epic 3 (Story 3.1) - History list, newest first, with text and author
FR15: Epic 3 (Story 3.1) - History survives an app restart
FR16: Epic 3 (Story 3.2) - Heart button on the card and on each list row
FR17: Epic 3 (Story 3.2) - Heart toggles favorite; unfavoriting removes all history entries of that quote
FR18: Epic 3 (Story 3.2) - Favorites list
FR19: Epic 3 (Story 3.2) - Favorites survive an app restart

NFR1-NFR4 apply across all epics: simplicity (minimal dependencies, small readable code), responsiveness (new quote in about 2 seconds), accessibility (real text, keyboard-operable button, announced states), and demo reliability (one documented start command per part). NFR5 (persistence without a database server) is delivered in Story 3.1 and relied on by Story 3.2; NFR6 (heart accessibility) is delivered in Story 3.2.

## Epic List

### Epic 1: See a random quote

A user opens the page and sees a quote with its author. Delivers the full vertical slice from the `GET /api/quote` endpoint to the styled quote card, including the project scaffold.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR12

### Epic 2: Get new quotes and recover from failures

A user can request another quote with a smooth fade, and failures degrade gracefully with a clear message and a retry action.
**FRs covered:** FR9, FR10, FR11

### Epic 3: Remember and favorite quotes

A user sees the quotes they have already been shown and can heart the ones they like; both survive restarting the app, with no separate database server.
**FRs covered:** FR13, FR14, FR15, FR16, FR17, FR18, FR19 (plus NFR5, NFR6)

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

## Epic 3: Remember and favorite quotes

A user sees the quotes they have already been shown and can heart the ones they like; both survive restarting the app, with no separate database server.

### Story 3.1: Quote history that survives restarts

As a presenter showing the app,
I want every quote the page displays to be saved in a history list that is still there after I restart the app,
So that I can show what was displayed earlier, without running a separate database server.

**Fulfills:** FR13, FR14, FR15; NFR5; AD-8, AD-9, AD-3 amendment, AD-7 amendment; UX-DR23 (History section and empty state). Depends on Epics 1 and 2 (done).

**Acceptance Criteria:**

**Given** the backend workspace
**When** better-sqlite3 13.0.3 and `@types/better-sqlite3` 9.6.0 are added and the pins in the architecture are applied (Express 5.3.0, `engines.node ^24`, `.nvmrc` 24.21.0, `@types/node` 24.x, `tsx`)
**Then** `npm install` and `npm test -w backend` succeed on Node 24 without any database server running (NFR5)
**And** `backend/data/` is gitignored

**Given** the domain layer
**When** `HistoryEntry = { entryId: number; quote: Quote; recordedAt: string }` and the synchronous `QuoteStore` port are defined
**Then** the port has `addHistory`, `listHistory`, `listFavorites`, `addFavorite`, and `removeFavoriteAndHistory` as in AD-8, and `service` and the port import neither Express, `fetch`, nor `better-sqlite3` (AD-1, AD-8)

**Given** a shared `QuoteStore` contract test suite
**When** it runs against the in-memory fake and against the sqlite adapter on `:memory:`
**Then** both pass the same cases: `addHistory` assigns an increasing `entryId`, `listHistory` returns newest first, and repeated quotes create separate entries (written first, AD-7)

**Given** a sqlite database created in a temporary file with two history entries
**When** the database is closed and reopened through the adapter
**Then** `listHistory()` returns the same two entries in the same order (FR15, NFR5)
**And** the schema is created at startup only if missing, and `entryId` is `INTEGER PRIMARY KEY AUTOINCREMENT` so ids are never reused after deletes

**Given** `DATA_FILE` is unset
**When** the backend starts from any working directory
**Then** the database file is `backend/data/quotes.db` resolved from the backend package root, and `DATA_FILE` overrides it
**And** if the file is corrupt or locked, startup fails fast with a clear console error and a non-zero exit, and the file is not deleted

**Given** a fake `QuoteStore`
**When** `POST /api/history` receives a valid `Quote` body
**Then** the service sets `recordedAt` (ISO-8601 UTC), stores it, and the endpoint returns 201 with the `HistoryEntry`
**And** a body with a non-number `id` or an empty `quote` or `author` returns 400 with `{ "error": string }` (AD-3 amendment)

**Given** stored history entries
**When** `GET /api/history` is called
**Then** it returns a JSON array of `HistoryEntry` newest first, with no cap and no envelope; an empty history returns `[]`

**Given** `GET /api/quote` succeeds
**When** the response is returned
**Then** nothing is written to the store (AD-9)

**Given** the frontend with stubbed `/api/*` responses
**When** a quote reaches `ready` state, including under React StrictMode's double effect run
**Then** `POST /api/history` is called exactly once for that quote object, and a failed POST never hides or replaces the displayed quote (AD-9)

**Given** the page
**When** `useHistory` loads
**Then** a History section renders below the quote card as a HeroUI `Card` with the heading "History", rows newest first showing the quote and the author with an em dash, and the empty line "No history yet." when there are none (FR14, UX-DR23)
**And** `refresh` is latest-wins, so a response from an older request is discarded, and it runs after each successful history POST

**Given** the History section
**When** a screen reader user explores it
**Then** it is a real `<ul>` list under a heading and the layout has no horizontal scroll under 640px (UX-DR26)

**Given** the app is stopped and started again with the same `DATA_FILE`
**When** the page loads
**Then** the earlier quotes are listed in the same order (FR15)

**Given** the README
**When** a developer follows it
**Then** it documents `DATA_FILE`, the demo reset (stop the backend and delete the file), and the Node 24 requirement (NFR4)

**Given** the tests for this story
**When** they run
**Then** they were written first, use the fake `QuoteStore` for service and HTTP tests and a real better-sqlite3 database for the adapter, and never hit dummyjson.com (AD-7)

### Story 3.2: Heart a quote to save it as a favorite

As a user reading quotes,
I want to press a heart on any quote to save it as a favorite and see all my favorites in one place,
So that the quotes I like are still there after the app restarts.

**Fulfills:** FR16, FR17, FR18, FR19; NFR5, NFR6; AD-6 amendment, AD-10, AD-11; UX-DR22 to UX-DR27. Depends on Story 3.1.

**Acceptance Criteria:**

**Given** a fake `QuoteStore` and the favorites routes
**When** `PUT /api/favorites/:id` receives a valid `Quote` whose `id` equals the path id
**Then** it stores the favorite and returns 204
**And** a repeat PUT keeps the first stored snapshot and still returns 204

**Given** a PUT where the path id differs from `body.id`, or the body is not a valid `Quote`
**When** the endpoint is called
**Then** it returns 400 with `{ "error": string }` and stores nothing (AD-10)

**Given** stored favorites
**When** `GET /api/favorites` is called
**Then** it returns a `Quote[]` newest favorite first, and `[]` when there are none

**Given** a quote that is a favorite and has three entries in the history
**When** `DELETE /api/favorites/:id` is called
**Then** it returns 204, the favorite is gone, and all three history entries of that quote are gone, in one transaction (FR17, AD-10)
**And** history entries of other quotes are untouched

**Given** a quote that is not a favorite
**When** `DELETE /api/favorites/:id` is called
**Then** it returns 204 and neither favorites nor history change

**Given** the store contract tests (fake and sqlite)
**When** `removeFavoriteAndHistory` runs
**Then** both implementations pass the same cases, and a forced failure mid-operation leaves both tables unchanged (atomicity, AD-8)

**Given** a favorite saved in a temporary-file database
**When** the database is closed and reopened
**Then** `listFavorites()` still returns it with its snapshot (FR19, NFR5)

**Given** the shared `HeartButton` with `{ isFavorite, onToggle }`
**When** it renders
**Then** it is a native icon-only `<button>` with the accessible name "Favorite this quote" and `aria-pressed` matching `isFavorite`; outline when off, filled in the accent color when on, so state is not conveyed by color alone; at least 44px square on phones (UX-DR22, UX-DR25, NFR6)
**And** it is keyboard-operable with `Enter` and `Space` and shows the accent focus ring

**Given** `useFavorites` is called once in `QuotePage`
**When** the card heart, a History row heart, and a Favorites row heart show the same quote
**Then** all three show the same state, because they receive the same `isFavorite` and `onToggle` (AD-11)

**Given** a quote in `ready` state that is not a favorite
**When** the user presses the card heart
**Then** the heart is disabled while the PUT is pending, the state changes to favorite only after the server confirms, and the quote appears at the top of Favorites (FR16, UX-DR24)
**And** if the request fails, the heart keeps its previous state and the page stays usable

**Given** the card is loading, or in the error state
**When** the page renders
**Then** the card heart is disabled while loading and not shown in the error state (UX-DR24)

**Given** a favorite shown on the card and in History
**When** the user presses the heart to unfavorite it
**Then** DELETE is called, the quote disappears from Favorites, all of its rows disappear from History, and the card heart returns to the outline state (FR17)
**And** history is refreshed after the toggle with the latest-wins rule, so a stale response cannot bring a removed row back (AD-11)

**Given** the user unfavorites from a History or Favorites row that has focus
**When** the row is removed
**Then** focus moves to the next row's heart, or to the section heading if no rows remain (UX-DR27)

**Given** the Favorites section
**When** it renders below History
**Then** it is a HeroUI `Card` with the heading "Favorites", a real `<ul>` list of rows (quote, author with an em dash, heart), and the empty line "No favorites yet." when there are none (FR18, UX-DR23, UX-DR26)
**And** each row's quote text is associated with its heart via `aria-describedby`, and tab order is card content, heart, "New quote", History rows, Favorites rows

**Given** the app is stopped and started again
**When** the page loads
**Then** the favorites list shows the same favorites and the heart on a displayed favorite quote is filled (FR19)

**Given** the tests for this story
**When** they run
**Then** they were written first, stub `/api/*` on the frontend, use the fake `QuoteStore` for service and HTTP tests and a real better-sqlite3 database for the adapter (AD-7)
