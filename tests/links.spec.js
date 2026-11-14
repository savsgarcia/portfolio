// Link tests: every internal link, image, stylesheet and script on every page exists.
// External links (LinkedIn, Google Fonts, mailto:) are not visited, so a third-party
// outage never fails a pull request.
const { test, expect } = require('@playwright/test');
const { targets, open } = require('./pages');

// Links don't change with screen size, so this only needs to run in one project.
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'links are the same at every size');
});

for (const { page: pagePath, hash, name } of targets) {
  test(`${name} has no broken links or missing files`, async ({ page, baseURL }) => {
    const origin = new URL(baseURL).origin;
    const broken = [];

    // 1. Everything the browser loads (including images added by JavaScript) must not fail.
    page.on('response', (res) => {
      if (res.url().startsWith(origin) && res.status() >= 400) broken.push(`${res.status()} ${res.url()}`);
    });
    page.on('requestfailed', (req) => {
      if (req.url().startsWith(origin)) broken.push(`failed ${req.url()}`);
    });

    await open(page, pagePath + hash);

    // 2. Every link and file reference on the page.
    const refs = await page.evaluate(() =>
      [...document.querySelectorAll('a[href], img[src], link[href], script[src], source[src]')].map((el) => ({
        attr: el.getAttribute('href') ?? el.getAttribute('src'),
        url: el.href || el.src,
        tag: el.tagName.toLowerCase(),
      }))
    );

    for (const { attr, url, tag } of refs) {
      const target = new URL(url);

      // Link to a section of the same page: the id or the hash view must exist.
      if (target.origin === origin && target.pathname === new URL(page.url()).pathname && attr.startsWith('#')) {
        const id = decodeURIComponent(attr.slice(1));
        const exists = await page.evaluate(
          (id) => !!document.getElementById(id) || !!document.querySelector(`.view[data-view="${CSS.escape(id)}"]`),
          id
        );
        if (!exists) broken.push(`missing section "${attr}" (${tag})`);
        continue;
      }

      // Internal page or file: it must load.
      if (target.origin === origin) {
        const res = await page.request.get(target.origin + target.pathname);
        if (res.status() >= 400) broken.push(`${res.status()} ${attr} (${tag})`);

        // Link to a section of another page: that page must have the id or view.
        if (target.hash && tag === 'a' && res.ok()) {
          const html = await res.text();
          const id = target.hash.slice(1);
          if (!html.includes(`id="${id}"`) && !html.includes(`data-view="${id}"`)) {
            broken.push(`missing section "${target.hash}" on ${target.pathname} (${attr})`);
          }
        }
      }
    }

    expect([...new Set(broken)], broken.join('\n')).toEqual([]);
  });
}
