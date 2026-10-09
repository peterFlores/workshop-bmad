---
name: Random Quote Generator
description: Calm, minimal dark theme for a single quote card. HeroUI (dark theme) is the UI system; this DESIGN.md specifies only the deltas.
status: final
created: 2026-10-08
updated: 2026-10-09
colors:
  # Unlisted HeroUI tokens (divider, focus, success, warning, etc.) inherit HeroUI dark defaults.
  background: '#0E1116'
  surface: '#161B22'
  surface-border: '#262D38'
  foreground: '#E6EAF0'
  muted: '#9AA4B2'
  accent: '#8FB3AE'
  accent-foreground: '#0E1116'
  danger: '#E58B8B'
typography:
  # Body and button inherit HeroUI sans (Inter). Only the quote role is overridden.
  quote:
    fontFamily: 'Georgia, "Times New Roman", serif'
    fontSize: 28px
    fontWeight: '400'
    lineHeight: '1.4'
    letterSpacing: -0.005em
  quote-sm:
    fontFamily: 'Georgia, "Times New Roman", serif'
    fontSize: 22px
    fontWeight: '400'
    lineHeight: '1.4'
  author:
    fontFamily: 'inherit'
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.5'
    letterSpacing: 0.04em
  body:
    fontFamily: 'inherit'
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
rounded:
  md: 12px
  lg: 20px
spacing:
  # HeroUI / Tailwind 4px scale inherited; named tokens below are the only additions.
  card-padding: 40px
  card-padding-mobile: 24px
  stack-gap: 24px
  page-margin-mobile: 16px
components:
  page:
    background: '{colors.background}'
    foreground: '{colors.foreground}'
  quote-card:
    background: '{colors.surface}'
    border: '{colors.surface-border}'
    radius: '{rounded.lg}'
    padding: '{spacing.card-padding}'
  quote-text:
    foreground: '{colors.foreground}'
    typography: '{typography.quote}'
  quote-author:
    foreground: '{colors.muted}'
    typography: '{typography.author}'
  button-primary:
    background: '{colors.accent}'
    foreground: '{colors.accent-foreground}'
    radius: '{rounded.md}'
  error-message:
    foreground: '{colors.danger}'
    typography: '{typography.body}'
  heart-button:
    foreground: '{colors.muted}'
    foreground-active: '{colors.accent}'
    radius: '{rounded.md}'
  list-card:
    background: '{colors.surface}'
    border: '{colors.surface-border}'
    radius: '{rounded.lg}'
    padding: '{spacing.card-padding-mobile}'
  list-row:
    border: '{colors.surface-border}'
    text-typography: '{typography.body}'
    author-typography: '{typography.author}'
---

## Brand & Style

Calm and minimal, in a dark theme. The page holds one quote card and one button, followed by two plain lists (History and Favorites) with a heart on each quote: no title, no tagline, no decoration. The quote is the only thing that asks for attention; the lists stay quiet below it. HeroUI's dark theme is the base; this file records only the deltas.

## Colors

- **Background `{colors.background}`** is a near-black blue-grey, not pure black, which keeps the card readable without glare.
- **Surface `{colors.surface}`** with **`{colors.surface-border}`** forms the card. Separation comes from a hairline border and a small tonal step, not shadow.
- **Foreground `{colors.foreground}`** for the quote text; **Muted `{colors.muted}`** for the author line and secondary text.
- **Accent `{colors.accent}`** is a muted sage-teal [ASSUMPTION: no accent was specified]. It is used only for the primary button, the focus ring, and the filled (favorited) heart. Never for text links, borders, or decoration.
- **Danger `{colors.danger}`** is a soft red used only for the error message.
- All other tokens inherit HeroUI dark defaults. Text pairs (`foreground` and `muted` on `surface`, `accent-foreground` on `accent`, `danger` on `surface`) are chosen to meet WCAG AA (4.5:1).

## Typography

Body and button text inherit HeroUI's sans. The quote is set in a system serif (`{typography.quote}`, 28px; `{typography.quote-sm}`, 22px below 640px), which gives the single focal element a literary tone without adding a font dependency. The author uses `{typography.author}` in `{colors.muted}`, so the hierarchy reads quote first, author second. Quote text is rendered exactly as received (Title Case); no case transforms.

## Layout & Spacing

One centered column, card max width 640px, vertically and horizontally centered in the viewport. Card padding is `{spacing.card-padding}` (`{spacing.card-padding-mobile}` on phones); gap between quote, author, and button is `{spacing.stack-gap}`. Page margin on phones is `{spacing.page-margin-mobile}`. The History and Favorites sections sit below the quote card in the same column and width, separated by `{spacing.stack-gap}`.

## Elevation & Depth

Flat. No shadows. Depth comes from the tonal step between `{colors.background}` and `{colors.surface}` plus the hairline border.

## Shapes

`{rounded.lg}` (20px) on the card, `{rounded.md}` (12px) on the button. Soft but not pill-shaped.

## Components

- **Quote card** is a HeroUI `Card` with `{colors.surface}` fill, `{colors.surface-border}` border, `{rounded.lg}`, and no shadow.
- **Quote text and author** sit inside the card: quote in `{typography.quote}` / `{colors.foreground}`, author below in `{typography.author}` / `{colors.muted}`, prefixed with an em dash.
- **Button "New quote"** is a HeroUI `Button`, solid, `{colors.accent}` fill with `{colors.accent-foreground}` text, `{rounded.md}`. Disabled state uses HeroUI's default reduced opacity. Focus ring uses `{colors.accent}` with a 2px offset against `{colors.surface}`.
- **Loading** is a HeroUI `Skeleton` (or `Spinner` inside the button) in muted surface tones; same card footprint as the loaded state.
- **Error message** is plain text in `{colors.danger}` with a retry button using the primary style.
- **Heart button** is an icon-only HeroUI `Button`, ghost style, at least 44px square on phones. Not favorite: outline heart in `{colors.muted}`. Favorite: filled heart in `{colors.accent}`. Focus ring as for the primary button. It sits at the top right of the quote card and at the right of each list row. [ASSUMPTION]
- **List section** (History, Favorites) is a HeroUI `Card` styled as `{components.list-card}` with a small heading in `{typography.body}` / `{colors.foreground}` (weight 500), followed by rows separated by a hairline `{colors.surface-border}`.
- **List row** shows the quote in `{typography.body}` / `{colors.foreground}`, the author below in `{typography.author}` / `{colors.muted}` with an em dash, and the heart button at the right. No quote-size serif in lists.
- **Empty list** shows one line of `{colors.muted}` body text.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Keep the page to the card, the button, and the two lists | Add a title, tagline, decorative icons, or art (the heart is the only icon) |
| Use `{colors.accent}` for the button, focus ring, and filled heart only | Spread the accent onto text, borders, or backgrounds |
| Show quote text exactly as received | Re-case or "fix" the text (for example `That'S`) |
| Inherit HeroUI defaults for anything not listed here | Add custom shadows, gradients, or extra fonts |
| Keep the card the same size across loading, loaded, and error states | Let the layout jump between states |
