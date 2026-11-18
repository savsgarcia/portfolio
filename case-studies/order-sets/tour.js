// Feature walkthrough: one screen at a time, like a product tour. A pink hotspot marks where
// Dr. Reyes clicks; clicking it (or Next) moves to the next screen, and the note explains
// what changed. Without JavaScript the steps stay as a numbered list of screens and captions.
(function () {
  'use strict';
  document.querySelectorAll('.os-tour').forEach((tour) => {
    const steps = Array.from(tour.querySelectorAll('.os-tour__step'));
    if (steps.length < 2) return;
    const pad = (n) => String(n).padStart(2, '0');
    let current = 0;

    // Chapters (from data-chapter): buttons above the screen that jump to each chapter's first step
    const chapters = [];
    steps.forEach((st, i) => {
      const name = st.dataset.chapter;
      if (name && !chapters.some((c) => c.name === name)) chapters.push({ name, first: i });
    });
    let chapterButtons = [];
    if (chapters.length > 1) {
      const nav = document.createElement('div');
      nav.className = 'os-tour__chapters';
      nav.setAttribute('role', 'group');
      nav.setAttribute('aria-label', 'Chapters');
      chapterButtons = chapters.map((c, k) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.innerHTML = '<span class="os-tour__chapter-num" aria-hidden="true">' + pad(k + 1) + '</span>' + c.name;
        b.addEventListener('click', () => go(c.first));
        nav.appendChild(b);
        return b;
      });
      tour.prepend(nav);
    }

    // Controls under the screen: Back, the step count and Next
    const controls = document.createElement('div');
    controls.className = 'os-tour__controls';
    controls.innerHTML =
      '<button type="button" class="cs-btn" data-go="prev">Back</button>' +
      '<p class="os-tour__count" aria-hidden="true"></p>' +
      '<button type="button" class="cs-btn os-tour__zoom-toggle" aria-pressed="true">Zoom</button>' +
      '<button type="button" class="cs-btn" data-go="next">Next</button>';
    const live = document.createElement('p');
    live.className = 'visually-hidden';
    live.setAttribute('aria-live', 'polite');
    tour.append(controls, live);
    const prev = controls.querySelector('[data-go="prev"]');
    const next = controls.querySelector('[data-go="next"]');
    const count = controls.querySelector('.os-tour__count');
    // Zoom: on by default, so the part of the screen that matters is readable
    const zoomToggle = controls.querySelector('.os-tour__zoom-toggle');
    tour.classList.add('is-zoomed');
    zoomToggle.addEventListener('click', () => {
      const on = zoomToggle.getAttribute('aria-pressed') !== 'true';
      zoomToggle.setAttribute('aria-pressed', String(on));
      tour.classList.toggle('is-zoomed', on);
    });

    // Each screen gets a frame for its hotspot; the caption becomes the floating note
    steps.forEach((step, i) => {
      const fig = step.querySelector('figure');
      const img = fig.querySelector('img');
      const frame = document.createElement('div');
      frame.className = 'os-tour__frame';
      const zoom = document.createElement('div'); // scales toward the hotspot when zoom is on
      zoom.className = 'os-tour__zoom';
      img.replaceWith(frame);
      frame.appendChild(zoom);
      zoom.appendChild(img);
      zoom.style.setProperty('--s', step.dataset.zoom || '1.6');
      if (!step.dataset.x) return;
      const x = parseFloat(step.dataset.x), y = parseFloat(step.dataset.y);
      fig.classList.add('has-note');
      fig.style.setProperty('--x', x + '%');
      fig.style.setProperty('--y', y + '%');
      zoom.style.transformOrigin = x + '% ' + y + '%'; // the hotspot stays put, so its note stays next to it
      fig.style.setProperty('--ny', (step.dataset.ny || y) + '%'); // the note can sit lower than the hotspot
      if (x > 55) fig.classList.add('is-left');   // note opens to the left of the hotspot
      if (y > 60) fig.classList.add('is-up');     // and above it near the bottom
      if (step.dataset.hotspot === 'none') return; // the result screen: a note, no click
      const hot = document.createElement('button');
      hot.type = 'button';
      hot.className = 'os-tour__hotspot';
      // A pink touch target with a cursor, like the prototype's
      hot.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 3l10 6.5-4.4 1L8.2 15z"/></svg>' +
        '<span class="visually-hidden">' + step.dataset.action + ', next step</span>';
      hot.addEventListener('click', () => go(i + 1, true));
      zoom.appendChild(hot);
    });

    function go(i, focusHotspot) {
      current = i;
      steps.forEach((s, k) => { s.hidden = k !== i; });
      const last = i === steps.length - 1;
      prev.disabled = i === 0;
      next.textContent = last ? 'Start over' : 'Next';
      count.textContent = pad(i + 1) + ' / ' + pad(steps.length);
      const chapter = steps[i].dataset.chapter;
      chapterButtons.forEach((b, k) => b.setAttribute('aria-pressed', String(chapters[k].name === chapter)));
      live.textContent = (steps[i].dataset.chapter ? steps[i].dataset.chapter + '. ' : '') + 'Step ' + (i + 1) + ' of ' + steps.length + '. ' + steps[i].querySelector('figcaption').textContent;
      if (focusHotspot) {
        const target = steps[i].querySelector('.os-tour__hotspot') || next;
        target.focus({ preventScroll: true });
      }
    }

    prev.addEventListener('click', () => { if (current > 0) go(current - 1); });
    next.addEventListener('click', () => go(current === steps.length - 1 ? 0 : current + 1));
    tour.classList.add('is-tour');
    go(0);
  });
})();
