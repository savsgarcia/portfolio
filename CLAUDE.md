# Portfolio — Saul García

Static personal portfolio: plain HTML, CSS and JavaScript, no build step.

- `index.html` — structure and content (Work, Experience, About views, switched by URL hash)
- `styles.css` — design tokens and layout (desktop ≥1100px, small desktop 900–1099px, tablet 700–899px, phone <700px)
- `script.js` — view routing, project switcher, stacked use cases on smaller screens, mobile menu
- `assets/img/` — project images and portrait (exported from Figma)
- `tests/` — Playwright tests, run on every `.html` page:
  - `a11y.spec.js` — axe + the accessibility rules below, at desktop, tablet and phone sizes
  - `layout.spec.js` — no horizontal scroll at 360, 390, 834, 1024, 1100, 1280, 1440 and 1920px
  - `links.spec.js` — every internal link, image, stylesheet, script and `#section` link exists (external links are not visited)
  - `pages.js` — shared helpers: finds every page and hash view, opens a page

Design source: Figma file "Portfolio", page "Moodboard". Fonts: Fraunces (display), Inter (text), IBM Plex Mono (labels).

## Running the tests

```bash
npm install
npx playwright install chromium
npm run test:a11y
```

The tests serve the site on port 4173, open every page (and every hash view of `index.html`) at desktop, tablet and phone sizes, and fail on any axe violation (WCAG 2.1 A/AA + best practices) or any break of the rules below. New `.html` pages are picked up automatically. The same tests run on every pull request through GitHub Actions (`.github/workflows/a11y.yml`).

## Accessibility (required in every PR)

- Semantic landmarks: header, nav (with aria-label), main, footer.
- One h1 per page; sections use h2 in order. No skipped heading levels.
- "Skip to content" link as the first focusable element.
- Active nav item uses aria-current="page"; active case section uses aria-current="true".
- Never remove focus outlines without a visible :focus-visible replacement.
- No custom tabindex values other than 0 or -1.
- Index links move focus to the target heading (tabindex="-1") and use scroll-margin-top.
- Tested/Final control: buttons with aria-pressed. Annotations switch: role="switch" with aria-checked.
- Dialogs: native <dialog>, trap focus, close with Esc, return focus to the trigger.
- Auto-advancing gallery: pause button, pauses on hover/focus, respects prefers-reduced-motion.
- Every image has meaningful alt text; decorative images use alt="".
- Text contrast at least 4.5:1 (3:1 for large text and UI components).

### How the current site meets these rules

- Landmarks: `<header class="site-header">` wraps the top bar and the sidebar (it uses `display: contents`, so it does not change the layout). `<footer class="site-footer">` holds "Last update"; on desktop it is fixed to the bottom of the sidebar.
- Headings: each view has one `h1` (visually hidden "Work" and "Experience"; the About headline). Project titles and job titles are `h2`.
- The project copy (title, description, CTA) has a single interactive element: the "See case study" link. The whole block is clickable through the stretched-link pattern (`.cta--stretched::after` covers `.project-copy`). Never add click handlers, `role`, or `tabindex` to headings, paragraphs or container divs to make an area clickable; use a real `<a href>` with a stretched `::after` instead. A test checks for click listeners on the panel and its ancestors.
- Case studies live in `case-studies/<name>/index.html` and share `case-studies/case-study.css` and `case-studies/case-study.js`:
  - Sidebar on desktop with Back and a Contents index. About (project, client, team, timeline) is the first block of the Overview, above "01. Overview": a row of label/value pairs with labels in the eyebrow's mono style above each value. Below 1100px only "Back" stays in the header, fixed top-left with a blurred background; the Contents index is hidden (no section navigation on tablet and phone). Index links move focus to the section heading (`tabindex="-1"`, `scroll-margin-top`); the section on screen gets `aria-current="true"`.
  - Validation controls: sticky at the top on desktop; below 1100px they scroll with the page and, once scrolled past, dock to the bottom edge (`.is-docked`, toggled by `case-study.js` with a spacer) until the section ends.
  - Validation: Tested/Final buttons with `aria-pressed`; "Show annotations" is `role="switch"` with `aria-checked`. Notes are an ordered list after each screenshot: floating over it from 1280px, a numbered list below it on smaller screens. Note and marker positions come from Figma as percentages (`--x/--y` marker, `--nx/--ny` note, optional `--w` width).
  - "See raw data" opens a native `<dialog>` (focus trapped, Esc closes, focus returns to the button). Below 700px it opens as a bottom sheet.
- The project switcher on desktop is a tablist (`role="tab"` + `aria-selected`, roving tabindex 0/-1, arrow keys).
- Inactive project numbers use `--num-idle: #93918A`, the lightest warm grey that meets 3:1 at 24px.
- The index links, Tested/Final control, annotations switch, dialogs and gallery rules apply to the case study pages when they are built.
