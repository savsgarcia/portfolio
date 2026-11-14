## What changed

<!-- A short description of the change, and screenshots for visual changes (desktop and phone). -->

## Accessibility checklist

All rules are in [CLAUDE.md](../CLAUDE.md). Check each one that applies, and mark the rest as not applicable.

- [ ] Landmarks: `header`, `nav` (with `aria-label`), `main` and `footer` are present.
- [ ] One `h1` per page; sections use `h2` in order, with no skipped heading levels.
- [ ] "Skip to content" is still the first focusable element.
- [ ] Active nav item has `aria-current="page"`; active case section has `aria-current="true"`.
- [ ] Focus is visible on every interactive element (no outline removed without a `:focus-visible` replacement).
- [ ] No `tabindex` values other than `0` or `-1`.
- [ ] Index links move focus to the target heading (`tabindex="-1"`) and use `scroll-margin-top`.
- [ ] Tested/Final control uses buttons with `aria-pressed`; annotations switch uses `role="switch"` with `aria-checked`.
- [ ] Dialogs use native `<dialog>`, trap focus, close with Esc and return focus to the trigger.
- [ ] Auto-advancing gallery has a pause button, pauses on hover/focus and respects `prefers-reduced-motion`.
- [ ] Every image has meaningful `alt` text; decorative images use `alt=""`.
- [ ] Text contrast is at least 4.5:1 (3:1 for large text and UI components).
- [ ] Checked with the keyboard only (Tab, Shift+Tab, Enter, Space, Esc, arrow keys).
- [ ] `npm run test:a11y` passes locally (it also runs automatically on this PR).
