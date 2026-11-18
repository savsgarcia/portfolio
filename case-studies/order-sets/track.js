// Dose calculations: as the page scrolls down, the whole section (title, intro and screens)
// stays put and the row of screens moves sideways. The page keeps scrolling normally
// (nothing is blocked): the section is pinned while its extra height is scrolled, and that
// vertical distance moves the row. The screens run past the column: behind the Contents
// sidebar on the left and out to the window edge on the right.
// - Phones (<700px): a native swipe row with snap points instead.
// - prefers-reduced-motion, a window too short to fit a readable screen, or no JavaScript:
//   the screens stay stacked vertically.
(function () {
  'use strict';
  const section = document.querySelector('.os-calc');
  if (!section) return;
  const run = section.querySelector('.os-run');
  const pin = section.querySelector('.os-pin');
  const track = section.querySelector('.os-track');
  const list = track.querySelector('.os-track__list');
  const items = Array.from(list.children);
  const now = track.querySelector('.os-track__now');
  const wide = window.matchMedia('(min-width: 700px)');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const MIN_CARD = 520; // narrower than this, the screens are too small to read: stack them
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

  function reset() {
    section.classList.remove('is-pinned');
    run.style.height = '';
    pin.style.top = '';
    list.style.transform = '';
    items.forEach((li) => { li.style.width = ''; });
  }

  function layout() {
    reset();
    section.classList.toggle('is-swipe', !wide.matches);
    pinned = false;
    if (!wide.matches || reduce.matches) {
      scrollable(!wide.matches && list.scrollWidth > list.clientWidth + 1);
      return;
    }
    scrollable(false);

    // Size the screens so the whole pinned block (title, intro, screen, caption) fits the window
    const col = track.clientWidth;
    const minTop = window.innerWidth < 1100 ? 72 : 24; // clear of the fixed Back button
    section.classList.add('is-pinned');
    let card = Math.round(col * 0.86);
    items.forEach((li) => { li.style.width = card + 'px'; });
    const other = pin.offsetHeight - card * 9 / 16; // everything in the block except the image
    card = Math.round(Math.min(card, (window.innerHeight - minTop - 24 - other) * 16 / 9));
    if (card < MIN_CARD) { reset(); return; }
    items.forEach((li) => { li.style.width = card + 'px'; });
    pinned = true;

    // One card width per step, so each screen lines up with the column's left edge in turn
    const step = card + parseFloat(getComputedStyle(list).columnGap || 0);
    dist = Math.round(step * (items.length - 1));
    top = Math.max(minTop, Math.round((window.innerHeight - pin.offsetHeight) / 2));
    pin.style.top = top + 'px';
    run.style.height = (pin.offsetHeight + dist) + 'px';
    update();
  }

  function update() {
    ticking = false;
    if (!pinned) return;
    const p = dist > 0 ? Math.min(1, Math.max(0, (top - run.getBoundingClientRect().top) / dist)) : 0;
    list.style.transform = `translate3d(${-Math.round(p * dist)}px, 0, 0)`;
    now.textContent = String(Math.round(p * (items.length - 1)) + 1).padStart(2, '0');
  }

  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', layout);
  wide.addEventListener('change', layout);
  reduce.addEventListener('change', layout);
  // Re-measure once the screens and fonts have loaded (they set the block's height)
  items.forEach((li) => { const img = li.querySelector('img'); if (img && !img.complete) img.addEventListener('load', layout, { once: true }); });
  if (document.fonts) document.fonts.ready.then(layout);
  layout();
})();
