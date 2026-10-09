---
name: Random Quote Generator
status: final
sources:
  - _bmad-output/planning-artifacts/prds/prd-workshop-bmad-2026-10-08/prd.md
created: 2026-10-08
updated: 2026-10-08
---

# Random Quote Generator: Experience Spine

## Foundation

Single-surface web page, desktop first, usable at phone widths. React with HeroUI (dark theme) as the UI system. `DESIGN.md` is the visual identity reference and extends HeroUI defaults; this spine specifies behavior only. The page contains the quote card and a "New quote" button. No title, no tagline, no navigation.

## Information Architecture

| Surface | Reached from | Purpose |
|---|---|---|
| Quote page (single card) | App open (`/`) | Show one random quote and its author; fetch another on demand |

One screen, one card. The card contains, top to bottom: quote text, author, "New quote" button. The page has no other routes, dialogs, or menus. (FR-7)

## Voice and Tone

Short, plain, friendly. No exclamation marks, no emoji, no jokes at the user's expense. Quote and author text are shown as received (Title Case), never edited.

| Element | Copy |
|---|---|
| Button (idle) | "New quote" |
| Button (loading) | "Loading..." |
| Loading text (announced) | "Loading a new quote" |
| Error message | "Couldn't load a quote. Please try again." |
| Retry action | "Try again" |

| Do | Don't |
|---|---|
| "Couldn't load a quote. Please try again." | "Error 502: upstream failure!" |
| "New quote" | "Inspire me!" |

## Component Patterns

Behavioral. Visual specs live in `DESIGN.md` Components.

| Component | Behavioral rules |
|---|---|
| Quote card (`{components.quote-card}`) | Always present; never blank or broken. Holds exactly one of: loading, quote, or error content. Footprint stays constant across states. (FR-7, FR-11) |
| Quote text and author (`{components.quote-text}`, `{components.quote-author}`) | Real text, selectable. Author shown below the quote, prefixed with an em dash. Text rendered as received. (FR-7, NFR-3) |
| "New quote" button (`{components.button-primary}`) | Fetches and displays a different random quote on activation. Disabled while a request is in flight. Label changes to "Loading..." while disabled. (FR-9, FR-10) |
| Retry action (`{components.error-message}` plus button) | Shown only in the error state. Re-runs the fetch. Same behavior as "New quote". (FR-11) |

## State Patterns

| State | Treatment |
|---|---|
| Loading (first load or after click) | Card shows a skeleton at the same size as a typical quote. Button disabled with "Loading..." label. The region announces "Loading a new quote" via `aria-live`. On repeat loads, the previous quote stays visible until the new one is ready, then fades; the skeleton appears only on first load. (FR-8, FR-10) |
| Loaded | Quote text and author visible. Button enabled, label "New quote". Focus remains on the button. (FR-7, FR-9) |
| Error | Card shows "Couldn't load a quote. Please try again." in `{colors.danger}` with a "Try again" button. No blank or broken card; if a previous quote exists it is replaced by the error message. Announced via `aria-live`. Button re-enabled. (FR-11, NFR-3) |

## Interaction Primitives

- **Fade transition between quotes:** when a new quote arrives, the old text fades out (about 150 ms) and the new text fades in (about 250 ms). Only opacity animates; the card does not resize or move.
- **prefers-reduced-motion:** when set to `reduce`, the fade is replaced by an instant swap. No animation of any kind.
- **Mouse and touch:** click or tap the button to fetch. No swipe, no gestures.
- **Keyboard:** `Tab` reaches the button; `Enter` or `Space` activates it. No custom shortcuts.
- **Banned:** auto-refresh timers, auto-advancing quotes, sound, confetti or celebratory effects.

## Accessibility Floor

Behavioral. Visual contrast lives in `DESIGN.md` Colors (AA pairs). Maps to NFR-3.

- Quote and author are real text nodes, not images.
- The quote region is an `aria-live="polite"` region: it announces "Loading a new quote" when loading starts and the new quote when it arrives.
- The error message sits in a `role="alert"` (assertive) region so failure is announced immediately.
- The button is a native `<button>`, keyboard-operable, with a visible focus ring in `{colors.accent}`.
- While loading, the button uses `disabled`/`aria-disabled` and stays in the tab order position; focus is not moved or lost when the state changes.
- `Tab` order is the reading order: card content, then button (or retry).
- Respect `prefers-reduced-motion` (see Interaction Primitives).

## Responsive & Platform

| Breakpoint | Behavior |
|---|---|
| Desktop (640px and up) | Card centered, max width 640px, `{typography.quote}` size, `{spacing.card-padding}` padding. |
| Phone (under 640px) | Card fills the width minus `{spacing.page-margin-mobile}` margins, `{typography.quote-sm}` size, `{spacing.card-padding-mobile}` padding. Button full width with a touch target of at least 44px high. |

Desktop browser is the primary target; phone widths must be usable, with no horizontal scroll. (FR-12)

## Key Flows

### Flow 1: Workshop demo (Lucia, workshop attendee, front row)

1. Lucia watches the presenter open the page on the projector. The card appears with a skeleton and "Loading..." on the button.
2. A quote fades in with the author below it. The button reads "New quote".
3. Someone in the audience asks, "Does it give a different one every time?" The presenter clicks the button.
4. The button dims to "Loading..." for a moment; the old quote stays in place.
5. **Climax:** the old quote fades out and a different one fades in, in the same card, without the layout moving. Lucia sees that one click produces one new quote, and nothing else on the page changes.

Failure: the upstream call fails. The card shows "Couldn't load a quote. Please try again." with a "Try again" button; the presenter clicks it and a quote appears. No blank card at any point.

### Flow 2: Keyboard and screen reader (Marcus, attendee using a screen reader)

1. Marcus opens the page. His screen reader announces "Loading a new quote", then the quote and author.
2. He presses `Tab`; focus lands on "New quote" with a visible accent ring.
3. He presses `Enter`. The reader announces "Loading a new quote" and the button is disabled.
4. **Climax:** the new quote is read aloud automatically, and focus is still on the button, so he can press `Enter` again right away.

Failure: the fetch fails. The reader immediately announces "Couldn't load a quote. Please try again." and focus stays on the retry button.

## Requirement Mapping

| Requirement | Where addressed |
|---|---|
| FR-7 | Information Architecture; Component Patterns (quote card) |
| FR-8 | State Patterns (loading on first load) |
| FR-9 | Component Patterns ("New quote" button); Key Flow 1 |
| FR-10 | State Patterns (loading); button disabled |
| FR-11 | State Patterns (error); Voice and Tone; retry action |
| FR-12 | `DESIGN.md` Typography and Layout; Responsive & Platform |
| NFR-3 | Accessibility Floor |
