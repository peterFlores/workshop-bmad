---
name: Random Quote Generator
status: final
sources:
  - _bmad-output/planning-artifacts/prds/prd-workshop-bmad-2026-10-08/prd.md
created: 2026-10-08
updated: 2026-10-09
---

# Random Quote Generator: Experience Spine

## Foundation

Single-surface web page, desktop first, usable at phone widths. React with HeroUI (dark theme) as the UI system. `DESIGN.md` is the visual identity reference and extends HeroUI defaults; this spine specifies behavior only. The page contains the quote card with a "New quote" button and a heart, followed by two simple lists: History and Favorites. No title, no tagline, no navigation.

## Information Architecture

| Surface | Reached from | Purpose |
|---|---|---|
| Quote page (single card) | App open (`/`) | Show one random quote and its author; fetch another on demand |
| History list | Below the quote card on `/` | Past quotes shown, newest first (FR-13, FR-14) |
| Favorites list | Below the History list on `/` | Quotes the user hearted, newest favorite first (FR-18) |

One screen. The card contains, top to bottom: quote text, author, "New quote" button; the heart sits at the card's top right. Below it, the History section, then the Favorites section, stacked in the same column. The page has no other routes, dialogs, or menus. (FR-7) [ASSUMPTION: stacked sections; no tabs or drawer]

## Voice and Tone

Short, plain, friendly. No exclamation marks, no emoji, no jokes at the user's expense. Quote and author text are shown as received (Title Case), never edited.

| Element | Copy |
|---|---|
| Button (idle) | "New quote" |
| Button (loading) | "Loading..." |
| Loading text (announced) | "Loading a new quote" |
| Error message | "Couldn't load a quote. Please try again." |
| Retry action | "Try again" |
| Heart accessible name (always the same) | "Favorite this quote" |
| History heading | "History" |
| Favorites heading | "Favorites" |
| Empty history | "No history yet." |
| Empty favorites | "No favorites yet." |

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
| Heart button (`{components.heart-button}`) | One shared control on the card and on every list row. Pressing it toggles favorite for that quote. Reflects favorite state (`aria-pressed`). Disabled while its own request is pending; on the card also disabled while a quote is loading; not shown in the error state. Updates only after the server confirms. (FR-16, FR-17) |
| History list (`{components.list-card}`, `{components.list-row}`) | Rows newest first, each with quote, author, and heart. The currently shown quote appears at the top once it is displayed. No cap or pagination. Unfavoriting any quote removes all of its rows here. (FR-13, FR-14, FR-17) |
| Favorites list (`{components.list-card}`, `{components.list-row}`) | Rows newest favorite first, each with quote, author, and heart. Unfavoriting removes the row. (FR-18) |
| Empty list | One muted line ("No history yet." / "No favorites yet."); the heading stays. |

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
- **Heart:** click, tap, `Enter`, or `Space` toggles. No animation on the heart beyond the HeroUI default pressed state.
- **Focus after removal:** when a toggle removes the focused row (unfavoriting from History or Favorites), focus moves to the next row's heart, or to the section heading if none remain.
- **Banned:** auto-refresh timers, auto-advancing quotes, sound, confetti or celebratory effects, undo toasts.

## Accessibility Floor

Behavioral. Visual contrast lives in `DESIGN.md` Colors (AA pairs). Maps to NFR-3.

- Quote and author are real text nodes, not images.
- The quote region is an `aria-live="polite"` region: it announces "Loading a new quote" when loading starts and the new quote when it arrives.
- The error message sits in a `role="alert"` (assertive) region so failure is announced immediately.
- The button is a native `<button>`, keyboard-operable, with a visible focus ring in `{colors.accent}`.
- While loading, the button uses `disabled`/`aria-disabled` and stays in the tab order position; focus is not moved or lost when the state changes.
- The heart is a native `<button>` with the constant accessible name "Favorite this quote" and `aria-pressed` set to true or false; the name never changes, so the state is not announced twice. State is shown by outline versus filled shape, not by color alone. Visible focus ring, touch target at least 44px on phones. (NFR-6)
- Each list is a real list (`<ul>`/`<li>`) under a heading. Each row's heart is reachable in order; to tell rows apart, the row's quote text is associated with its heart via `aria-describedby`.
- `Tab` order is the reading order: card content, heart, "New quote" button (or retry), then History rows, then Favorites rows.
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

### Flow 3: Saving a favorite (Lucia, after the demo)

1. Lucia sees a quote she likes on the card and presses the heart. It fills with the accent color.
2. She presses "New quote" twice more. Each earlier quote appears at the top of History, newest first.
3. **Climax:** the page is restarted by the presenter; Lucia reloads and finds both the History rows and her hearted quote in Favorites, unchanged.
4. She presses the heart on the favorited quote in the list. The quote disappears from Favorites and from History.

Failure: the heart request fails. The heart keeps its previous state and the page stays usable; no blank list.

## Requirement Mapping

| Requirement | Where addressed |
|---|---|
| FR-7 | Information Architecture; Component Patterns (quote card) |
| FR-8 | State Patterns (loading on first load) |
| FR-9 | Component Patterns ("New quote" button); Key Flow 1 |
| FR-10 | State Patterns (loading); button disabled |
| FR-11 | State Patterns (error); Voice and Tone; retry action |
| FR-12 | `DESIGN.md` Typography and Layout; Responsive & Platform |
| FR-13, FR-14 | Information Architecture; Component Patterns (History list); Key Flow 3 |
| FR-15, FR-19 | Key Flow 3 (data persists across restart; behavior owned by architecture AD-8) |
| FR-16, FR-17 | Component Patterns (Heart button); Interaction Primitives; Key Flow 3 |
| FR-18 | Information Architecture; Component Patterns (Favorites list) |
| NFR-3 | Accessibility Floor |
| NFR-6 | Accessibility Floor (heart) |
