# Epic 1 Context: See a random quote

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

A user opens the page and sees a random quote with its author on a polished dark card, with no action required. The epic delivers the full vertical slice: the project scaffold, a single backend endpoint that proxies a random quote from an upstream service, and the styled React quote card that fetches and displays it on first load. It is a workshop demo, so the codebase must stay small and readable.

## Stories

- Story 1.1: Backend GET /api/quote
- Story 1.2: Frontend scaffold and first quote

## Requirements & Constraints

- Backend exposes exactly one endpoint, `GET /api/quote`, returning JSON `{ id: number, quote: string, author: string }` with no envelope. No other routes.
- Each request calls the upstream `https://dummyjson.com/quotes/random` (no auth). Quote text is passed through byte-for-byte (upstream is Title Case, e.g. `That'S`); never normalize case in code or CSS.
- Upstream failure, timeout, bad status, invalid JSON, or missing fields yields a non-2xx JSON `{ "error": string }`; the process must not crash.
- Dev-time access from the page works via a Vite `/api` proxy; the backend adds no CORS middleware.
- Page shows one quote card (quote + author), fetches automatically on mount, and is visually polished and usable on desktop and phone widths.
- NFRs: minimal dependencies and small readable code; a quote appears within about 2 seconds; quote and author are real selectable text, and the quote region is announced to assistive tech; one documented start command per part.
- Out of scope: deployment, auth, rate limiting, caching, persistence, structured logging, favorites/history, i18n. Local only, two processes.

## Technical Decisions

- Scaffold: npm workspaces (`backend`, `frontend`), root `engines.node >=24`. Backend layout `backend/src/{domain,service,adapters,http}` with `main.ts` as composition root; frontend `frontend/src/{components,hooks,pages}` with `main.tsx`.
- Stack: Node 24, TypeScript 7 (fall back to latest 5.x if tooling friction), Express 5, Vite 8 with `@vitejs/plugin-react`, React 19, `@heroui/react` + `@heroui/styles` 3.x, Tailwind CSS 4 with `@tailwindcss/vite`, Vitest 5 in both packages.
- Ports: backend 3001, Vite 5173. Commands: `npm run dev -w backend`, `npm run dev -w frontend`, `npm test -w <workspace>`. Env read once at startup in `main.ts`: `PORT` (3001), `UPSTREAM_URL` (dummyjson default), `UPSTREAM_TIMEOUT_MS` (5000).
- Hexagonal backend: `http` (driving adapter) calls `service`, which depends only on the port `QuoteSource.getRandom(): Promise<Quote>`; `adapters/dummyjson` implements it and alone knows the URL, timeout, and wire format. `service` and the port never import Express, `fetch`, or adapters. Adapter strips extra upstream fields and throws `UpstreamError` for every failure (including the abort-based timeout); no raw fetch/parse error escapes.
- Error mapping happens at the HTTP edge: `UpstreamError` -> 502, anything else -> 500, both `{ "error": string }`.
- `Quote` is defined once per package with identical fields, never transformed.
- Frontend calls only relative `/api/*`. `useQuote` owns all fetch state and returns `{ quote, status: 'loading' | 'ready' | 'error', refetch }`; components under `components/` take props only and never call `fetch`.
- UI system is HeroUI v3 (`Card`, `Button`, `Skeleton`) with dark theme only, no provider needed; no other UI library.
- Strict TDD: tests first, colocated `*.test.ts(x)`. Service/HTTP tests use a fake `QuoteSource`; the adapter uses a stubbed `fetch`; frontend tests stub the `/api/quote` response. Tests never touch the network or dummyjson.com.
- Conventions: `kebab-case` files, `PascalCase` components, JSON only, `console` logging only, stateless backend.

## UX & Interaction Patterns

- Dark theme token overrides: background `#0E1116`, surface `#161B22`, surface-border `#262D38`, foreground `#E6EAF0`, muted `#9AA4B2`, accent `#8FB3AE`, accent-foreground `#0E1116`, danger `#E58B8B`; other tokens inherit HeroUI dark defaults. Text pairs must meet WCAG AA (4.5:1), verified by an automated test.
- Quote typography: serif (Georgia, "Times New Roman", serif), 28px, weight 400, line-height 1.4, letter-spacing -0.005em; 22px below 640px. Author: inherited sans, 14px, weight 500, letter-spacing 0.04em, muted color, on its own line below, prefixed with an em dash.
- Card: HeroUI `Card`, surface fill, hairline surface-border, 20px radius, 40px padding (24px on phones), no shadow. Single centered column, card max 640px, centered vertically and horizontally, 24px gaps. No title, tagline, icons, navigation, or decoration.
- First load shows a `Skeleton` at the footprint of a typical quote inside the card; the card is never blank or broken and its footprint stays constant.
- Quote region is `aria-live="polite"` and announces the arriving quote.
- Phones (under 640px): card fills width minus 16px margins, no horizontal scroll.
- Banned: auto-refresh/auto-advance, sound, confetti, swipe/gestures, custom keyboard shortcuts.

## Cross-Story Dependencies

- Story 1.2 depends on Story 1.1: the frontend workspace is added to the existing npm workspace root, and it consumes the `GET /api/quote` contract through the Vite `/api` proxy to port 3001.
- Epic 2 builds on this epic: it adds the "New quote" button, loading/disabled state, fade transition, and error/retry state on top of `useQuote` (`refetch`, `status`) and `QuoteCard`, so those interfaces must stay stable.
