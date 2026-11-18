// Accessibility tests for every page of the portfolio.
// Runs axe (WCAG 2.1 A/AA + best practices) on each page and view, plus checks
// for the project rules in CLAUDE.md that axe does not cover on its own.
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { HASH_VIEWS, targets, open } = require('./pages');

function axe(page) {
  return new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']);
}

function formatViolations(violations) {
  return violations
    .map((v) => `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.map((n) => n.target.join(' ')).join('\n  ')}`)
    .join('\n');
}

for (const { page: pagePath, hash, name } of targets) {
  test.describe(name, () => {
    test.beforeEach(async ({ page }) => {
      await open(page, pagePath + hash);
    });

    test('has no axe violations', async ({ page }) => {
      const { violations } = await axe(page).analyze();
      expect(violations, formatViolations(violations)).toEqual([]);
    });

    test('has visible header, labelled nav, main and footer landmarks', async ({ page }) => {
      await expect(page.locator('header:visible').first()).toBeVisible();
      await expect(page.locator('main')).toHaveCount(1);
      await expect(page.locator('footer:visible').first()).toBeVisible();
      const navs = page.locator('nav');
      const count = await navs.count();
      expect(count).toBeGreaterThan(0);
      for (let i = 0; i < count; i++) {
        const label = (await navs.nth(i).getAttribute('aria-label')) || (await navs.nth(i).getAttribute('aria-labelledby'));
        expect(label, 'every <nav> needs aria-label or aria-labelledby').toBeTruthy();
      }
    });

    test('has exactly one h1 and no skipped heading levels', async ({ page }) => {
      const levels = await page.evaluate(() =>
        [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')]
          .filter((h) => !h.closest('[hidden]') && getComputedStyle(h).display !== 'none' && !h.closest('[aria-hidden="true"]'))
          .filter((h) => h.getClientRects().length > 0 || h.classList.contains('visually-hidden'))
          .map((h) => Number(h.tagName[1]))
      );
      expect(levels.filter((l) => l === 1), `headings: ${levels.join(',')}`).toHaveLength(1);
      expect(levels[0], 'first heading must be the h1').toBe(1);
      for (let i = 1; i < levels.length; i++) {
        expect(levels[i] - levels[i - 1], `skipped level in ${levels.join(',')}`).toBeLessThanOrEqual(1);
      }
    });

    test('"Skip to content" is the first focusable element and moves focus to main', async ({ page }) => {
      await page.keyboard.press('Tab');
      const first = page.locator(':focus');
      await expect(first).toHaveText(/skip to content/i);
      await expect(first).toBeVisible();
      await page.keyboard.press('Enter');
      await expect(page.locator('main')).toBeFocused();
    });

    test('uses only tabindex 0 or -1', async ({ page }) => {
      const bad = await page.evaluate(() =>
        [...document.querySelectorAll('[tabindex]')]
          .filter((el) => !['0', '-1'].includes(el.getAttribute('tabindex')))
          .map((el) => el.outerHTML.slice(0, 80))
      );
      expect(bad).toEqual([]);
    });

    test('every image has an alt attribute', async ({ page }) => {
      const missing = await page.evaluate(() =>
        [...document.querySelectorAll('img')].filter((img) => !img.hasAttribute('alt')).map((img) => img.src)
      );
      expect(missing).toEqual([]);
    });

    test('keyboard focus is always visible', async ({ page }) => {
      const invisible = [];
      for (let i = 0; i < 25; i++) {
        await page.keyboard.press('Tab');
        const info = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return null;
          const s = getComputedStyle(el);
          const visible = (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || s.boxShadow !== 'none';
          return { visible, html: el.outerHTML.slice(0, 80) };
        });
        if (info && !info.visible) invisible.push(info.html);
      }
      expect(invisible, 'elements focused without a visible focus style').toEqual([]);
    });
  });
}

// Single-page views: the active nav link is marked with aria-current="page".
for (const hash of HASH_VIEWS['/']) {
  test(`nav marks ${hash} as the current page`, async ({ page }) => {
    await open(page, '/' + hash);
    const toggle = page.locator('.menu-toggle');
    if (await toggle.isVisible()) await toggle.click();
    await expect(page.locator(`nav a[href="${hash}"]`)).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('nav [aria-current="page"]')).toHaveCount(1);
  });
}

test('mobile menu is accessible when open and closes with Escape', async ({ page }) => {
  await open(page, '/#work');
  const toggle = page.locator('.menu-toggle');
  test.skip(!(await toggle.isVisible()), 'menu button only shows on smaller screens');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  // The menu fades in: measure contrast once the transition has finished, not mid-fade
  await page.waitForFunction(() => document.getAnimations().every((a) => a.playState === 'finished'));
  const { violations } = await axe(page).analyze();
  expect(violations, formatViolations(violations)).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();
});

// Work panel: the project copy must expose a single interactive element (the CTA).
// The heading and description are plain content: no click handlers, roles or tabindex on them.
test('project copy has only one interactive element and no click handlers on content', async ({ page }) => {
  await open(page, '/#work');
  const copies = page.locator('.project-copy:visible');
  const n = await copies.count();
  expect(n).toBeGreaterThan(0);
  for (let i = 0; i < n; i++) {
    const copy = copies.nth(i);
    const interactive = copy.locator('a[href], button, [role="button"], [role="link"], [tabindex], [onclick]');
    expect(await interactive.count()).toBeLessThanOrEqual(1);
    for (const sel of ['.display', '.lede']) {
      const el = copy.locator(sel);
      await expect(el).not.toHaveAttribute('role', /.+/);
      await expect(el).not.toHaveAttribute('onclick', /.*/);
    }
  }
  // No click listeners on the panel, its content or any ancestor up to <html>.
  const client = await page.context().newCDPSession(page).catch(() => null);
  test.skip(!client, 'listener check needs Chromium');
  const { result } = await client.send('Runtime.evaluate', {
    expression: `(() => { const out = []; let el = document.querySelector('.project-copy .display');
      while (el) { out.push(el); el = el.parentElement; }
      return out.concat([...document.querySelectorAll('.project-copy, .project-copy *')]); })()`,
  });
  const { result: props } = await client.send('Runtime.getProperties', { objectId: result.objectId, ownProperties: true });
  for (const p of props.filter((x) => /^\d+$/.test(x.name))) {
    const { listeners } = await client.send('DOMDebugger.getEventListeners', { objectId: p.value.objectId });
    const clicks = listeners.filter((l) => ['click', 'mousedown', 'mouseup', 'pointerdown', 'pointerup'].includes(l.type));
    expect(clicks, `click listener on ${p.value.description}`).toEqual([]);
  }
});

test('the whole first project copy opens its case study (stretched link)', async ({ page }) => {
  await open(page, '/#work');
  const copy = page.locator('.project-copy:visible').first();
  const link = copy.getByRole('link', { name: 'See case study' });
  await expect(link).toHaveAttribute('href', /case-studies\/order-sets\//);
  // Click the middle of the heading like a person would; the link's ::after sits on top of it.
  const box = await copy.locator('.display').boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page).toHaveURL(/case-studies\/order-sets\/$/);
});
