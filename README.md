# Saul García — Portfolio

Personal portfolio site. Plain HTML, CSS and JavaScript — no build step.

- `index.html` — page structure and content (Work, Experience, About)
- `styles.css` — design (colors, fonts and layout from Figma)
- `script.js` — project switcher, section navigation and mobile menu
- `assets/img/` — project images and portrait

To preview locally, open `index.html` in a browser.

## Accessibility tests

Every page is checked with axe and Playwright on each pull request (`.github/workflows/a11y.yml`). To run them locally:

```bash
npm install
npx playwright install chromium
npm run test:a11y
```

The accessibility rules every change must follow are in `CLAUDE.md`.
