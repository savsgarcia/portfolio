// Layout tests: nothing on any page makes the screen scroll sideways.
const { test, expect } = require('@playwright/test');
const { targets, open } = require('./pages');

// Common screen widths, plus 1100px where the layout switches to the desktop sidebar.
const WIDTHS = [360, 390, 834, 1024, 1100, 1280, 1440, 1920];

// This test sets its own widths, so it only needs to run in one project.
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'widths are set inside the test');
});

for (const { page: pagePath, hash, name } of targets) {
  test(`${name} has no horizontal scroll at any width`, async ({ page }) => {
    const problems = [];
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await open(page, pagePath + hash);

      const result = await page.evaluate(() => {
        const viewport = document.documentElement.clientWidth;
        const content = document.documentElement.scrollWidth;
        if (content <= viewport) return null;

        // Find the elements that stick out past the right edge. Ignore anything inside a
        // container that clips its content (e.g. the cropped project images), since that
        // never causes page scroll.
        const clipped = (el) => {
          for (let p = el.parentElement; p; p = p.parentElement) {
            const o = getComputedStyle(p);
            if (['hidden', 'clip'].includes(o.overflowX)) return true;
          }
          return false;
        };
        const culprits = [...document.body.querySelectorAll('*')]
          .filter((el) => el.getBoundingClientRect().right > viewport + 1 && !clipped(el))
          .slice(0, 5)
          .map((el) => el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''));
        return { viewport, content, culprits };
      });

      if (result) {
        problems.push(`${width}px: content is ${result.content}px wide (screen ${result.viewport}px). Sticks out: ${result.culprits.join(', ') || 'unknown'}`);
      }
    }
    expect(problems, problems.join('\n')).toEqual([]);
  });
}
