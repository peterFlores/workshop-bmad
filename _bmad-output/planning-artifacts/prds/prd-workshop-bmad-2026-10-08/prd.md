---
title: Random Quote Generator
status: final
created: 2026-10-08
updated: 2026-10-08
---

# PRD: Random Quote Generator

## Vision

A small, polished demo app that shows a random quote on a clean web page. It is the baseline for a live workshop with a mixed technical audience: the app is deliberately simple, so the audience can follow the full BMad workflow (PRD, architecture, stories, build) without domain overhead. During the workshop, a new spec is added live to show how a spec-driven change lands on an existing product.

## Users and Context

- **Presenter (Peter):** runs the app locally on stage and later extends it live.
- **Workshop audience:** technical and non-technical attendees who watch the app and the workflow.
- Form factor: web page served locally, desktop browser first. No auth, no deployment target. [ASSUMPTION]

## Scope

**In scope (v1):** one backend endpoint, one React page.

**Out of scope (v1):** favorites or history, quote text normalization, authentication, deployment, i18n.

## Features and Requirements

### F1: Random quote API

- **FR-1:** The backend exposes exactly one endpoint, `GET /api/quote`, that returns one random quote.
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

## Non-Functional Requirements

- **NFR-1 (Simplicity):** Minimal dependencies and a small, readable codebase, since attendees will read it live.
- **NFR-2 (Responsiveness):** A new quote appears within about 2 seconds under normal network conditions.
- **NFR-3 (Accessibility):** Quote and author are real text (not images); the button is keyboard-operable with a visible focus state; loading and error states are announced to assistive tech.
- **NFR-4 (Demo reliability):** The app starts locally with one documented command per part (backend, frontend).

## Success Criteria

- The presenter can start both parts and show a new quote on every click, with no errors, in front of the audience.
- The codebase is simple enough that adding a new spec live is a believable, bounded change.
- Counter-metric: the page must not grow features (history, sharing, themes) that make the live spec harder to follow.

## Open Items

- [ASSUMPTION] Node + TypeScript + Express for the backend (confirmed by presenter).
- [ASSUMPTION] No deployment; local only.
- [NOTE FOR PM] Title Case text looks odd (`That'S`). Left as-is on purpose; revisit only if the presenter wants it as a future spec.
