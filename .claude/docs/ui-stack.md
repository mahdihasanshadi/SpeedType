# UI Stack — component strategy

Distinct from `design-system.md`: that file owns the tokens, this file owns *how components get
built*. Given `CLAUDE.md` rule 1 (UI/UX is the top priority), treat every rule below as load-bearing,
not a suggestion.

## Foundation

- **shadcn/ui** (Radix UI primitives + Tailwind) is the component foundation — accessible by
  default (focus management, keyboard nav, ARIA), unstyled enough to fully retheme.
- **Framer Motion** for every animation: the caret, character-correctness transitions, screen
  transitions (test → results), the theme toggle, dialogs/sheets entering/exiting. Never a raw CSS
  `transition` for anything the user's eye tracks during interaction — Framer Motion's spring
  physics is what makes the app feel alive instead of merely functional.
- **Recharts** for the speed-curve chart and any premium analytics charts (accuracy trend,
  weak-key heatmap). Retheme every chart to the design tokens — axis lines `--border`, data line
  `--accent`, tooltips styled as a themed card, never library-default colors.
- **Zustand** for the typing engine's real-time client state (current index, keystroke log, timer,
  WPM running calc) — this state updates on every keystroke and must not go through React context
  re-render overhead or a heavier state library.
- A dedicated **shadcn MCP server** is wired in `.mcp.json` — use it to pull real, current
  component source (`Button`, `Input`, `Dialog`, `Card`, `Sheet`, `Tabs`, `Toast`, `Skeleton`,
  `Avatar`, `DropdownMenu`) instead of hallucinating props or writing components from memory.

## The two hard rules

1. **Every pulled shadcn component gets re-themed to the tokens in `design-system.md` before it
   ships.** Nothing ships with shadcn's default zinc palette or default radius — swap CSS variables
   at the Tailwind config / globals.css level so the whole library inherits the SpeedType tokens in
   one place, then spot-check each component actually picked it up.
2. **Additional libraries for a specific surface are pulled lazily, per screen, not all upfront at
   scaffold time.** Don't install a confetti library, a heatmap library, or a rich-text editor
   during initial scaffold "just in case" — pull it in the feature step that actually needs it, and
   note the addition in `infrastructure.md`'s decisions table.

## The typing test surface specifically

This is the one component worth naming conventions for up front, since Phase 1's whole first
build pass centers on it:

- Render the passage as a sequence of per-character `<span>`s (not one text blob) so each
  character can independently carry a `pending` / `correct` / `incorrect` state class — this is
  what makes live highlighting possible without re-rendering the whole passage on every keystroke.
- The caret is a separate absolutely-positioned element animated via Framer Motion `layout` /
  `animate` between character positions — never re-render the caret as part of the character list.
- Keystroke handling is a single `keydown` listener on a hidden, always-focused input (mobile needs
  a real input element to summon the on-screen keyboard) — never `contentEditable`.
