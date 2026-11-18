// Dose calculations screens: as the page scrolls down, the screens move sideways.
// The page keeps scrolling normally (nothing is blocked): the section is pinned while its
// extra height is scrolled, and that vertical distance moves the row of screens.
// - Phones (<700px): a native swipe row with snap points instead.
// - prefers-reduced-motion, or no JavaScript: the screens stay stacked vertically.
(function () {
  'use strict';
  const track = document.querySelector('.os-track');
  if (!track) return;
  const list = track.querySelector('.os-track__list');
  const items = Array.from(list.children);
  const sticky = track.querySelector('.os-track__sticky');
  const now = track.querySelector('.os-track__now');
  const wide = window.matchMedia('(min-width: 700px)');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  let pinned = false, dist = 0, top = 0, ticking = false;

  // A row that scrolls sideways must be reachable with the keyboard.
  function scrollable(on) {
    if (on) {
      list.tabIndex = 0;
      list.setAttribute('aria-label', 'Dose calculations screens. Scroll sideways to see all five.');
    } else {
      list.removeAttribute('tabindex');
      list.removeAttribute('aria-label');
    }
  }

  function layout() {
    pinned = wide.matches && !reduce.matches;
    track.classList.toggle('is-pinned', pinned);
    track.classList.toggle('is-swipe', !wide.matches);
    if (!pinned) {
      track.style.height = '';
      sticky.style.top = '';
      list.style.transform = '';
      items.forEach((li) => { li.style.width = ''; });
      scrollable(!wide.matches && list.scrollWidth > list.clientWidth + 1);
      return;
    }
    scrollable(false);
    const col = track.clientWidth;
    // Each screen is 86% of the column (the next one peeks in) and short enough to fit the window
    const card = Math.round(Math.min(col * 0.86, (window.innerHeight - 220) * 16 / 9));
    items.forEach((li) => { li.style.width = card + 'px'; });
    // One card width per step, so each screen lines up with the column's left edge in turn
    const step = card + parseFloat(getComputedStyle(list).columnGap || 0);
    dist = Math.round(step * (items.length - 1));
    // The block pins centred in the window, and the track is only as tall as it needs to be
    top = Math.max(0, Math.round((window.innerHeight - sticky.offsetHeight) / 2));
    sticky.style.top = top + 'px';
    track.style.height = (sticky.offsetHeight + dist) + 'px';
    update();
  }

  function update() {
    ticking = false;
    if (!pinned) return;
    const r = track.getBoundingClientRect();
    const p = dist > 0 ? Math.min(1, Math.max(0, (top - r.top) / dist)) : 0;
    list.style.transform = `translate3d(${-Math.round(p * dist)}px, 0, 0)`;
    now.textContent = String(Math.round(p * (items.length - 1)) + 1).padStart(2, '0');
  }

  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', layout);
  wide.addEventListener('change', layout);
  reduce.addEventListener('change', layout);
  // Re-measure once the screens have loaded (their height sets the row width)
  items.forEach((li) => { const img = li.querySelector('img'); if (img && !img.complete) img.addEventListener('load', layout, { once: true }); });
  layout();
})();
