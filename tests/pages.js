// Shared helpers for every test file: which pages exist and how to open one.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const IGNORED_DIRS = new Set(['node_modules', 'tests', 'test-results', 'playwright-report', '.git', '.github']);

// Every .html file in the repo is a page. New pages (e.g. case studies) are picked up automatically.
function findPages(dir = ROOT) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) return IGNORED_DIRS.has(entry.name) ? [] : findPages(path.join(dir, entry.name));
    if (!entry.name.endsWith('.html')) return [];
    const rel = path.relative(ROOT, path.join(dir, entry.name)).split(path.sep).join('/');
    return ['/' + rel.replace(/(^|\/)index\.html$/, '$1')];
  });
}

// Views that live on the same page behind a hash.
const HASH_VIEWS = { '/': ['#work', '#experience', '#about'] };

// One entry per page and view, e.g. "/#work", "/case-studies/viu/".
const targets = findPages().flatMap((page) =>
  (HASH_VIEWS[page] || ['']).map((hash) => ({ page, hash, name: `${page}${hash}` }))
);

async function open(page, url) {
  // Check the page at rest: with reduced motion, nothing fades in or counts up while axe measures
  // contrast, and every block is visible without scrolling.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  // Analytics (Umami) is blocked in tests: no third-party dependency and no fake visits.
  await page.route('https://cloud.umami.is/**', (route) => route.abort());
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  // Let view transitions finish so the page is measured at rest.
  await page.waitForTimeout(500);
}

module.exports = { findPages, HASH_VIEWS, targets, open };
