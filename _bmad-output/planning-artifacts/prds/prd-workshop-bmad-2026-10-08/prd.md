---
title: Random Quote Generator
status: final
created: 2026-10-08
updated: 2026-10-09
---

# PRD: Random Quote Generator

## Vision

A small, polished demo app that shows a random quote on a clean web page. It is the baseline for a live workshop with a mixed technical audience: the app is deliberately simple, so the audience can follow the full BMad workflow (PRD, architecture, stories, build) without domain overhead. During the workshop, a new spec is added live to show how a spec-driven change lands on an existing product.

## Users and Context

- **Presenter (Peter):** runs the app locally on stage and later extends it live.
- **Workshop audience:** technical and non-technical attendees who watch the app and the workflow.
- Form factor: web page served locally, desktop browser first. No auth, no deployment target. [ASSUMPTION]

## Scope

**In scope:** a backend that serves random quotes and stores history and favorites, one React page.

**Out of scope:** quote text normalization, authentication, deployment, i18n, sharing, themes.

## Features and Requirements

### F1: Random quote API

- **FR-1:** The backend exposes `GET /api/quote`, which returns one random quote. Additional backend capabilities for history and favorites are specified in F3 and F4.
- **FR-2:** The backend obtains the quote by calling `GET https://dummyjson.com/quotes/random` (no authentication) on each request.
- **FR-3:** The response body is JSON with `id` (number), `quote` (string), and `author` (string), matching the upstream contract, for example `{"id":88,"quote":"That'S The Real Trouble With The World, Too Many People Grow Up","author":"Walt Disney"}`.
- **FR-4:** The quote text is returned as received, with no case normalization (the upstream sends Title Case).
- **FR-5:** If the upstream call fails or times out, the backend responds with a non-2xx status and a JSON error message instead of crashing.
- **FR-6:** The backend allows the React page to call it during local development (CORS or dev proxy).

### F2: Quote page

- **FR-7:** The page, built with React and HeroUI, shows a single quote card with the quote text and the author's name.
- **FR-8:** On first load, the page fetches and displays a quote automatically.
- **FR-9:** A "New quote" button fetches and displays a different random quote.
- **FR-10:** While a quote is loading, the page shows a loading state and the button is disabled.
- **FR-11:** If fetching fails, the page shows a friendly error message and a retry action; it never shows a blank or broken card.
- **FR-12:** The page is visually polished ("beautiful"): clear typographic hierarchy for the quote and the author, comfortable spacing, and usable on both desktop and phone widths.

### F3: Quote history

- **FR-13:** Every quote displayed to the user is recorded in a history.
- **FR-14:** The user can view the history, listed newest first, showing each quote's text and author.
- **FR-15:** The history is still present, in the same order, after the app is restarted.

### F4: Favorites

- **FR-16:** Each displayed quote (on the main card and in the history list) has a heart button that saves it as a favorite.
- **FR-17:** The heart shows whether the quote is currently a favorite, and pressing it on a favorite removes it from favorites. Removing a favorite also removes every entry of that quote from the history.
- **FR-18:** The user can view all favorites in one place.
- **FR-19:** Favorites are still present after the app is restarted.

## Non-Functional Requirements

- **NFR-1 (Simplicity):** Minimal dependencies and a small, readable codebase, since attendees will read it live.
- **NFR-2 (Responsiveness):** A new quote appears within about 2 seconds under normal network conditions.
- **NFR-3 (Accessibility):** Quote and author are real text (not images); the button is keyboard-operable with a visible focus state; loading and error states are announced to assistive tech.
- **NFR-4 (Demo reliability):** The app starts locally with one documented command per part (backend, frontend).
- **NFR-5 (Persistence):** History and favorites survive an app restart. Storage must not require a separate database server process; the app stays runnable with the NFR-4 commands only.
- **NFR-6 (Accessibility, heart):** The heart button is keyboard-operable with a visible focus state, has an accessible name, and exposes its on/off state to assistive tech, not by color alone.

## Success Criteria

- The presenter can start both parts and show a new quote on every click, with no errors, in front of the audience.
- The codebase is simple enough that adding a new spec live is a believable, bounded change.
- A quote marked as favorite and a quote shown earlier are both still there after stopping and restarting the app.
- Counter-metric: the page must not grow beyond history and favorites (no sharing, themes, accounts) so the workflow stays easy to follow.

## Open Items

- [ASSUMPTION] Node + TypeScript + Express for the backend (confirmed by presenter).
- [ASSUMPTION] No deployment; local only.
- [ASSUMPTION] History records every displayed quote, no size cap, repeats allowed. Confirm or set a cap.
- [ASSUMPTION] Single user, no accounts: one shared history and favorites list per app install.
- [NOTE FOR PM] Title Case text looks odd (`That'S`). Left as-is on purpose; revisit only if the presenter wants it as a future spec.
