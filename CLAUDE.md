# Portfolio — Saul García

Static personal portfolio: plain HTML, CSS and JavaScript, no build step.

- `index.html` — structure and content (Work, Experience, About views, switched by URL hash)
- `styles.css` — design tokens and layout (desktop ≥1240px with the sidebar, small desktop 1025–1239px, tablet 700–1024px, phone <700px; below 1240px the sidebar becomes the top bar and hamburger menu). Work shows the stacked use cases at 1024px and below. From 700 to 1024px content sits in a centered 720px column (`--gutter` grows with the screen), while the image panel spans the full width with the image aligned to the text edges; the top bar and open menu stay full width with 40px side margins. From 1240px the Work title follows one fluid scale, `clamp(40px, min(4vw, 6.8vh), 96px)`: it grows with the window's width, is held back by its height, and reaches 96px only on large screens. Small desktop keeps the Work tabs layout with the hamburger menu (the sidebar would leave the tabs too little room to fit one row). At 1024px and below the Work project titles use the case study title style (40/44px tablet, 36/40px phone, `text-wrap: balance`). Work has four projects: 01 Order sets, 02 VIU, 03 Volana, 04 AI-assisted order entry (under NDA, always last). Each project shows its industry as a tag above the title (`.project-tag`, `tag` in `script.js`): Healthcare, Insurance, Fintech, Healthcare. From 1240px the tabs are a one-row grid; long titles wrap when the row is tight
- `script.js` — view routing, project switcher, stacked use cases on smaller screens, mobile menu
- `assets/img/` — project images and portrait (exported from Figma)
- `assets/og/` — 1200×630 share images (Open Graph / Twitter tags in each page's `<head>`, absolute URLs on savsgarcia.github.io/portfolio); `assets/cv/` — resume PDFs (EN, ES), linked from the sidebar and About
- `tests/` — Playwright tests, run on every `.html` page:
  - `a11y.spec.js` — axe + the accessibility rules below, at desktop, tablet and phone sizes
  - `layout.spec.js` — no horizontal scroll at 360, 390, 834, 1024, 1100, 1280, 1440 and 1920px
  - `links.spec.js` — every internal link, image, stylesheet, script and `#section` link exists (external links are not visited)
  - `pages.js` — shared helpers: finds every page and hash view, opens a page

Analytics: Umami Cloud (no cookies, no personal data, so no cookie banner). The script is in the `<head>` of every page with `data-domains="savsgarcia.github.io"`, so local runs, tests and previews are not counted. Clicks are tracked with `data-umami-event="Name"` (plus `data-umami-event-<key>="value"` for details) on the link or button itself; new pages need the same script tag. Events: Nav, Resume (`lang`: en / es), Project tab (`project`), See case study, Email, LinkedIn (`from: experience` for the link below the last job on tablet and phone), Back to work, Contents, Validation version, Annotations switch, See raw data.

Motion: one language, set in `styles.css` (`--ease`, `--dur-short` 150ms, `--dur-medium` 250ms, `--dur-long` 500ms). Views fade in when switched (`view-in`); a case study page rises in from below when it opens (`cs-page-in` on `.cs-main`, 700ms); case study blocks settle in as they reach the screen (`.cs-reveal`, `case-study.js`); impact numbers (`.cs-stat`) count up once, with the final value in a visually hidden span; the Order sets tour changes screens without animation. With `prefers-reduced-motion` nothing moves: the JS effects don't start and every transition or animation is near-instant. Tests run with reduced motion, so pages are checked at rest.

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
  - Sidebar on desktop with Back and a Contents index. About (project, client, team, timeline) is the first block of the Overview, above "01. Overview": a row of label/value pairs with labels in the eyebrow's mono style above each value. Below 1100px only "Back" stays in the header, fixed top-left; it gets a blurred background only once the page scrolls (`.is-scrolled`); the Contents index is hidden (no section navigation on tablet and phone). Index links move focus to the section heading (`tabindex="-1"`, `scroll-margin-top`); the section on screen gets `aria-current="true"`.
  - Start of every case study: the hero image (a teaser: its bottom fades out into the band, the same in every case study, flat screenshots included) sits 40px below the top (72px below 1100px, under Back) on a full-width band fading from `#F8F5EC` to the page background that ends halfway down the Overview card (`--cs-band`, set by `case-study.js`), and the Overview card has a 2px yellow (`#E4DF4F`) accent line fading in and out across its top-left 30% (`.cs-overview::before`).
  - Content column: 1040px (12 columns, centered) for images, screenshots and grids; paragraphs are capped at 640px (`.cs-section p`), titles at 14em.
  - Validation controls: sticky at the top on desktop. Below 1100px they are a bar fixed to the bottom edge that slides in (`.is-docked`, toggled by `case-study.js`) from when the first screenshot enters the screen until the section ends, and whenever a control has keyboard focus.
  - Validation: Tested/Final buttons with `aria-pressed`; "Show annotations" is `role="switch"` with `aria-checked`. Notes are an ordered list after each screenshot: floating over it from 1280px, a numbered list below it on smaller screens. Note and marker positions come from Figma as percentages (`--x/--y` marker, `--nx/--ny` note, optional `--w` width).
  - "See raw data" opens a native `<dialog>` (focus trapped, Esc closes, focus returns to the button). Below 700px it opens as a bottom sheet with the screenshot first.
  - Per case study: `--cs-hero-bg` (the top band, a very light tint of the project's color; Order sets `#F6EEF2`), `--cs-accent-line` (the Overview line, in the project's color from Work) and `--cs-hero-fade` (where the hero fades; 82% for device mockups). Order sets is the exception: its hero is the full screen at full opacity, no fade, at most the content column and at least 40px from each side.
  - Order sets (`case-studies/order-sets/`) adds `tour.js` (a click-through walkthrough: one screen at a time, chapters, a 44px green hotspot button per step, notes in the Final note style, Back/Next, a native `<dialog>` for the before/after) and `flow.js` (one interactive flowchart: lanes and Yes/No are real buttons with `aria-pressed`, the outcome is written below in an `aria-live` paragraph; opens fitted, zooms with + / −). Screens come from the uploaded 3840px PNGs, converted to 2880px WebP.
- Volana (`case-studies/volana/`) is a short case study: no validation module. It adds `volana.css` (Volana's blue, phone-sized screens, the customer journey: stages as columns aligned with subgrid on desktop and cards below 1100px, feelings as an emoji plus the word on one dashed horizontal line). Screens are recreations of the 2019 designs, rendered from HTML, shown in phone frames (`.vo-phone`): the status bar and a tab bar or main button stay fixed (the button 40px above the bottom, in the 375px scale), the screen scrolls inside (a focusable region), and `volana.js` hides the button while the screen scrolls and brings it back when scrolling stops or the end is reached. Decision 01 shows one phone with a Lender / Associate segmented control (`aria-pressed`). "03. Process" has three steps with photos (focus group, workshops, testing; faces blurred) and the workshop whiteboard.
- The project switcher on desktop is a tablist (`role="tab"` + `aria-selected`, roving tabindex 0/-1, arrow keys).
- Inactive project numbers use `--num-idle: #93918A`, the lightest warm grey that meets 3:1 at 24px.
- The index links, Tested/Final control, annotations switch, dialogs and gallery rules apply to the case study pages when they are built.
