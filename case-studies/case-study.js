// Case study pages: contents index, Tested/Final control, annotations switch,
// annotation markers and the raw data dialog.
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Contents index ---------- */

  const indexLinks = Array.from(document.querySelectorAll('.cs-index a[href^="#"]'));
  const headings = indexLinks
    .map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1))))
    .filter(Boolean);

  // Index links move focus to the target heading (tabindex="-1"); scroll-margin-top keeps it clear of the top edge.
  indexLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
      target.focus({ preventScroll: true });
      history.replaceState(null, '', link.hash);
      setCurrent(target.id);
    });
  });

  // The active section is marked with aria-current="true".
  function setCurrent(id) {
    indexLinks.forEach((a) => {
      if (a.hash === '#' + id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }

  if ('IntersectionObserver' in window && headings.length) {
    const sections = headings.map((h) => h.closest('section') || h);
    const visible = new Map();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => visible.set(e.target, e.isIntersecting));
      // The first section (in page order) that is on screen is the current one.
      const current = sections.find((s) => visible.get(s));
      if (current) setCurrent(headings[sections.indexOf(current)].id);
    }, { rootMargin: '-20% 0px -60% 0px' });
    sections.forEach((s) => observer.observe(s));
  }
  if (headings[0]) setCurrent(location.hash ? location.hash.slice(1) : headings[0].id);

  /* ---------- Back header (tablet/phone) ---------- */

  // Below 1100px "Back" is fixed top-left. It only gets its blurred box once the page has
  // scrolled, so at the top it sits directly on the hero band.
  const side = document.querySelector('.cs-side');
  if (side) {
    const onTop = () => side.classList.toggle('is-scrolled', window.scrollY > 0);
    window.addEventListener('scroll', onTop, { passive: true });
    onTop();
  }

  /* ---------- Hero band ---------- */

  // The hero's gradient band ends halfway down the Overview card at every screen size.
  const main = document.querySelector('.cs-main');
  const overview = document.querySelector('.cs-overview');
  if (main && overview) {
    const setBand = () => {
      const top = overview.getBoundingClientRect().top - main.getBoundingClientRect().top;
      main.style.setProperty('--cs-band', Math.round(top + overview.offsetHeight / 2) + 'px');
    };
    if ('ResizeObserver' in window) new ResizeObserver(setBand).observe(main);
    else window.addEventListener('resize', setBand);
    setBand();
  }

  /* ---------- Validation controls docked to the bottom (tablet/phone) ---------- */

  // Below 1100px the controls live in a bar fixed to the bottom edge. It slides in once the
  // first screenshot enters the screen and slides out when the Validation section ends.
  const controls = document.querySelector('.cs-controls');
  const validation = controls && controls.closest('section');
  if (controls && validation) {
    const small = window.matchMedia('(max-width: 1099px)');
    let ticking = false;

    const update = () => {
      ticking = false;
      const firstShot = validation.querySelector('.cs-version:not([hidden]) .cs-shot');
      const start = firstShot ? firstShot.getBoundingClientRect().top : validation.getBoundingClientRect().top;
      const end = validation.getBoundingClientRect().bottom;
      const show = small.matches && start < window.innerHeight && end > window.innerHeight - controls.offsetHeight;
      controls.classList.toggle('is-docked', show);
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* ---------- Annotation markers (decorative, numbered to match the notes) ---------- */

  // Markers sit on a wrapper around the image, so their positions are relative to the
  // image even when the notes are listed below it on smaller screens.
  document.querySelectorAll('.cs-shot__frame').forEach((frame) => {
    const img = frame.querySelector('img');
    const wrap = document.createElement('div');
    wrap.className = 'cs-shot__img';
    img.replaceWith(wrap);
    wrap.appendChild(img);
    frame.querySelectorAll('.cs-notes li').forEach((note, i) => {
      const marker = document.createElement('span');
      marker.className = 'cs-marker';
      marker.setAttribute('aria-hidden', 'true');
      marker.textContent = String(i + 1);
      marker.style.setProperty('--x', note.style.getPropertyValue('--x'));
      marker.style.setProperty('--y', note.style.getPropertyValue('--y'));
      wrap.appendChild(marker);
    });
  });

  /* ---------- Tested / Final ---------- */

  const versionButtons = Array.from(document.querySelectorAll('.cs-segmented button[data-version]'));
  const versions = Array.from(document.querySelectorAll('.cs-version[data-version]'));
  const hint = document.getElementById('annotations-hint');
  const HINTS = {
    tested: 'Notes show paraphrased user feedback',
    final: 'Notes explain what changed and why',
  };

  versionButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const version = button.dataset.version;
      if (button.getAttribute('aria-pressed') === 'true') return;

      // Keep the reader at the same spot: the Tested and Final screenshots have different
      // heights, so remember how far through the current screenshot the top of the screen
      // is, and restore that point on the matching screenshot after switching.
      const current = versions.find((v) => !v.hidden);
      const shots = current ? Array.from(current.querySelectorAll('.cs-shot')) : [];
      const index = shots.findIndex((f) => f.getBoundingClientRect().bottom > 0);
      let progress = null;
      if (index > -1) {
        const r = shots[index].getBoundingClientRect();
        progress = r.top < 0 ? -r.top / r.height : null; // null: screenshot starts below the top edge
      }

      versionButtons.forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
      versions.forEach((v) => { v.hidden = v.dataset.version !== version; });
      if (hint) hint.textContent = HINTS[version];

      if (progress !== null) {
        const next = versions.find((v) => !v.hidden).querySelectorAll('.cs-shot')[index];
        if (next) {
          const r = next.getBoundingClientRect();
          window.scrollTo({ top: window.scrollY + r.top + progress * r.height, behavior: 'instant' });
        }
      }
    });
  });

  /* ---------- Annotations switch ---------- */

  const annotationSwitch = document.getElementById('annotations-switch');
  if (annotationSwitch) {
    annotationSwitch.addEventListener('click', () => {
      const on = annotationSwitch.getAttribute('aria-checked') !== 'true';
      annotationSwitch.setAttribute('aria-checked', String(on));
      document.querySelectorAll('.cs-validation .cs-notes').forEach((list) => { list.hidden = !on; });
    });
  }

  /* ---------- Raw data dialog ---------- */

  const dialog = document.getElementById('raw-dialog');
  const opener = document.getElementById('raw-open');
  if (dialog && opener) {
    opener.addEventListener('click', () => dialog.showModal());

    dialog.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => dialog.close()));

    // Click on the backdrop closes the dialog.
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });

    // Keep Tab and Shift+Tab inside the dialog. Esc closes it natively.
    dialog.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab') return;
      const focusable = Array.from(dialog.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])'))
        .filter((el) => !el.disabled && el.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });

    // Return focus to the button that opened it.
    dialog.addEventListener('close', () => opener.focus());
  }
  /* ---------- Motion: blocks settle in as they enter, numbers count up ---------- */

  // Skipped entirely with prefers-reduced-motion: everything shows at once, numbers at their value.
  if (!reduceMotion.matches && 'IntersectionObserver' in window) {
    // Reveal: each block fades in and rises a few pixels the first time it reaches the screen.
    // Fixed, sticky and modal elements stay out (a transform would change how they're placed).
    const skip = '.cs-controls, dialog, .cs-hero, script';
    const blocks = Array.from(document.querySelectorAll('.cs-section > *'))
      .filter((el) => !el.matches(skip) && !el.querySelector('.cs-controls'));
    // Checked on scroll (not only on intersection), so blocks above the screen after a jump,
    // like a Contents link, are shown too.
    let pending = [];
    const check = () => {
      const limit = window.innerHeight * 0.92;
      pending = pending.filter((el) => {
        if (el.getBoundingClientRect().top < limit) { el.classList.add('is-in'); return false; }
        return true;
      });
      if (!pending.length) window.removeEventListener('scroll', onRevealScroll);
    };
    let queued = false;
    const onRevealScroll = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; check(); }); } };
    blocks.forEach((el) => {
      // Already on screen when the page opens: show it as is
      if (el.getBoundingClientRect().top < window.innerHeight) return;
      el.classList.add('cs-reveal');
      pending.push(el);
    });
    if (pending.length) window.addEventListener('scroll', onRevealScroll, { passive: true });

    // Count up: impact numbers run from 0 to their value once, when they come into view.
    // Screen readers get the final number only; the moving digits are hidden from them.
    const stats = Array.from(document.querySelectorAll('.cs-stat'));
    const count = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        count.unobserve(e.target);
        const num = e.target.querySelector('.cs-stat__num');
        const { target, prefix, comma } = num.dataset;
        const end = Number(target), start = performance.now(), dur = 900;
        const fmt = (n) => prefix + (comma ? n.toLocaleString('en-US') : String(n));
        const tick = (t) => {
          const p = Math.min(1, (t - start) / dur);
          num.textContent = fmt(Math.round(end * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.6 });
    stats.forEach((stat) => {
      const text = stat.firstChild;
      if (!text || text.nodeType !== 3) return;
      const m = text.textContent.trim().match(/^(\+?)([\d,]+)$/);
      if (!m) return;
      const final = text.textContent.trim();
      const shown = document.createElement('span');
      shown.className = 'cs-stat__num';
      shown.setAttribute('aria-hidden', 'true');
      shown.dataset.target = m[2].replace(/,/g, '');
      shown.dataset.prefix = m[1];
      if (m[2].includes(',')) shown.dataset.comma = '1';
      shown.textContent = m[1] + '0';
      const read = document.createElement('span');
      read.className = 'visually-hidden';
      read.textContent = final;
      text.replaceWith(shown, read);
      count.observe(stat);
    });
  }
})();
