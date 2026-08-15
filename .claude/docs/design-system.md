# Design System — the styling authority

This file is the source of truth for every visual decision. If `ui-stack.md` or a pulled shadcn
component's default styling disagrees with a token here, **this file wins** — retheme the
component, don't adopt its defaults. UI/UX is SpeedType's top product priority (see
`CLAUDE.md` rule 1) — nothing ships against these tokens "just to get it working."

## Fonts (exactly two, each with one job)

| Font | Role | Where it's used |
|---|---|---|
| **Geist Sans** (variable, 400/500/600/700) | UI chrome | Nav, buttons, headings, body copy, marketing/landing page, settings, dialogs |
| **Geist Mono** (variable, tabular-nums) | Data & the test itself | The typing passage text, live WPM/accuracy/timer readouts, results screen numbers, custom code-snippet mode |

Load both via `next/font` (self-hosted, zero layout shift from web-font swap — critical, since a
font-swap reflow during an active test would violate rule 1). Never introduce a third typeface.

## Type scale

| Token | Size / line-height | Weight | Font | Use |
|---|---|---|---|---|
| `text-display` | 3.5rem / 1.1 | 700 | Sans | Landing hero only |
| `text-h1` | 2.25rem / 1.2 | 700 | Sans | Page titles |
| `text-h2` | 1.5rem / 1.3 | 600 | Sans | Section headings |
| `text-h3` | 1.125rem / 1.4 | 600 | Sans | Card/subsection headings |
| `text-body-lg` | 1.125rem / 1.6 | 400 | Mono | **The typing passage itself** — must stay large and easy to track at speed |
| `text-body` | 1rem / 1.5 | 400 | Sans | Default UI copy |
| `text-small` | 0.875rem / 1.4 | 400 | Sans | Secondary/help text |
| `text-stat` | 2.5rem / 1 | 600 | Mono, tabular-nums | The live WPM/accuracy/timer numbers |
| `text-stat-label` | 0.75rem / 1 | 500, uppercase, tracking 0.08em | Sans | Label above a stat (e.g. "WPM") |

## Spacing & radius scale

Spacing (4px base): `space-1..16` = `4 8 12 16 24 32 48 64 96 128` px — use Tailwind's default
scale directly, don't invent a parallel one.

Radius: `radius-sm` 6px (inputs, small buttons) · `radius-md` 10px (cards, dialogs) ·
`radius-lg` 16px (the test container, the results card) · `radius-full` 9999px (pills, badges,
the theme toggle).

## Color tokens

Dark is the **default first-run theme** (typing/coding audience) — light is fully supported and
the toggle persists per-user; system preference decides only on first visit with no saved choice.
Toggling is **class-based** (`.dark` on `<html>`, the shadcn/Tailwind v4 convention already wired
in `app/globals.css` via `@custom-variant dark (&:is(.dark *))`) — not a `data-theme` attribute.

```css
:root {
  /* light */
  --bg: #FAFAFA;
  --surface: #FFFFFF;
  --surface-2: #F1F1F3;
  --border: #E4E4E7;
  --fg: #18181B;
  --fg-muted: #71717A;
  --fg-faint: #A1A1AA;      /* pending/untyped characters */
  --accent-color: #6C5CE7;   /* the one brand color — CTAs, links, focus ring, caret. Named
                                 --accent-color (not --accent) to avoid colliding with shadcn's
                                 own --accent token, which means "subtle hover background" and is
                                 mapped to --surface-2 instead — see globals.css. */
  --accent-fg: #FFFFFF;
  --success: #16A34A;
  --error: #E11D48;
  --warning: #D97706;
}

.dark {
  --bg: #0B0D10;
  --surface: #121418;
  --surface-2: #1B1E24;
  --border: #262A31;
  --fg: #F4F4F5;
  --fg-muted: #9BA1AA;
  --fg-faint: #4B5058;
  --accent-color: #8B7CF6;
  --accent-fg: #0B0D10;
  --success: #22C55E;
  --error: #FB4864;
  --warning: #F59E0B;
}

/* Typing-engine semantic tokens — exposed as Tailwind utilities (bg-type-caret, text-type-correct,
   etc.) via @theme inline in globals.css. Never hardcode a raw hex in engine components. */
--color-type-pending: var(--fg-faint);      /* not yet reached */
--color-type-correct: var(--fg);            /* typed correctly — reward is "crisp", not flashy */
--color-type-incorrect: var(--error);       /* typed wrong — underline + bg-error at 10% opacity */
--color-type-caret: var(--accent-color);    /* 2px wide, blinks 530ms, slides between chars */
```

The full token set is already wired in `app/globals.css`, mapped onto shadcn's semantic variable
names (`--primary` → `--accent-color`, `--card`/`--popover` → `--surface`, `--muted` → `--surface-2`,
etc.) so every shadcn component inherits these automatically — see that file for the exact mapping.
The type scale table above is also live as Tailwind utilities (`text-display`, `text-stat`, …).

## Visual tone rules

- **The typing passage is the visual centerpiece of every screen it appears on.** Largest content
  region, highest contrast. Nav and stats bar recede to `--fg-muted` while a test is in progress.
- **Exactly one accent color.** Violet (`--accent`) is used for every interactive/CTA/focus/caret
  moment. Never add a second "brand" color for a specific feature (e.g. no separate premium-gold).
  Premium surfaces get a small badge/icon treatment, not a whole second palette.
- **Live-updating numbers (WPM, timer, accuracy) always render in Mono with `font-variant-numeric:
  tabular-nums`.** Digit width must never shift and cause visible jitter while counting up.
- **No gray-box skeleton screens.** Loading states mirror the real layout shape with a subtle
  shimmer. The test page in particular never shows a bare spinner on a blank screen.
- **Motion is fast and purposeful, never decorative.** 80–150ms for micro-interactions (caret
  slide, key-press feedback, button press), 200–300ms for screen transitions (test → results),
  spring/ease-out easing over linear. See `ui-stack.md` for the Framer Motion conventions.
- **Dark mode default, light mode is a first-class citizen** — every screen gets designed and
  reviewed in both, not dark-only with light as an afterthought inversion.
