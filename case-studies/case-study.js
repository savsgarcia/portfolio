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

  /* ---------- Validation controls docked to the bottom (tablet/phone) ---------- */

  // Below 1100px the controls scroll with the page. Once they leave the screen at the
  // top, they dock to the bottom edge until the Validation section ends. A spacer keeps
  // the page from jumping when the bar leaves the flow.
  const controls = document.querySelector('.cs-controls');
  const validation = controls && controls.closest('section');
  if (controls && validation) {
    const spacer = document.createElement('div');
    spacer.className = 'cs-controls-spacer';
    spacer.setAttribute('aria-hidden', 'true');
    controls.before(spacer);
    const small = window.matchMedia('(max-width: 1099px)');
    let ticking = false;

    const update = () => {
      ticking = false;
      const docked = controls.classList.contains('is-docked');
      const anchor = (docked ? spacer : controls).getBoundingClientRect();
      const barHeight = docked ? controls.offsetHeight : anchor.height;
      const sectionEnd = validation.getBoundingClientRect().bottom;
      const shouldDock = small.matches && anchor.bottom < 0 && sectionEnd > window.innerHeight - barHeight;
      if (shouldDock === docked) return;
      if (shouldDock) spacer.style.height = anchor.height + 'px';
      else spacer.style.height = '';
      controls.classList.toggle('is-docked', shouldDock);
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
      versionButtons.forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
      versions.forEach((v) => { v.hidden = v.dataset.version !== version; });
      if (hint) hint.textContent = HINTS[version];
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
})();
