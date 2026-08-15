# UI Stack — component strategy

Distinct from `design-system.md`: that file owns the tokens, this file owns *how components get
built*. Given `CLAUDE.md` rule 1 (UI/UX is the top priority), treat every rule below as load-bearing,
not a suggestion.

## Foundation

- **shadcn/ui** (Radix UI primitives + Tailwind) is the component foundation — accessible by
  default (focus management, keyboard nav, ARIA), unstyled enough to fully retheme.
- **Framer Motion** for lower-frequency animations: screen transitions (test → results), dialogs/
  sheets entering/exiting, anything that benefits from spring physics. **Per-keystroke-frequency UI
  (the caret, the live stat readout's fade, the mode controls' fade during a run) uses a plain CSS
  `transition` on an inline style instead** — decided while building the Test UI feature, where a
  React state value (verified correct via direct inspection) wasn't reliably reaching the DOM
  through Framer Motion's `animate` prop on rapid, high-frequency updates in this project's dev
  setup. A native CSS transition, driven directly by the same state, is simpler, has no library
  layer to debug, and is a better fit for the hottest code path in the app anyway.
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
- The caret is a separate absolutely-positioned element, positioned by measuring the target
  character span's `getBoundingClientRect()` in a `useLayoutEffect` and applying the result as an
  inline `transform: translate(x, y)` with a plain CSS `transition` (see "Foundation" above) —
  never re-render the caret as part of the character list.
- Keystroke handling is a single `keydown` listener on a hidden, always-focused input (mobile needs
  a real input element to summon the on-screen keyboard) — never `contentEditable`.
