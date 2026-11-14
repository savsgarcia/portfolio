(function () {
  'use strict';

  /* ---------- Project content ---------- */

  const chevron = '<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M8 5l5 5-5 5" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>';
  const lock = '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18 8h-1V6A5 5 0 0 0 7 6v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2zM9 6a3 3 0 0 1 6 0v2H9V6z"/></svg>';

  const projects = {
    'viu': {
      num: '01', name: 'Insurance profile', client: 'VIU by HUB',
      // <br> forces the line break after "Frankie"
      title: 'How Frankie<br>found clarity, and a better way to renew.',
      description: 'Designing VIU’s account space, where every policy lives in one place and HUB can help before each renewal.',
      // Case study not published yet: swap this for a link when it is ready,
      // e.g. '<a class="cta" href="viu/">See case study ' + chevron + '</a>'
      cta: '<span class="cta cta--soon" title="Case study coming soon">See case study ' + chevron + '</span>',
      bg: '#F8F5EC',
      image: 'assets/img/viu.webp', width: 1986, height: 1614,
      alt: 'VIU by HUB account screen: a personal dashboard greeting Frankie with all their policies and recommended coverage.'
    },
    'order-entry': {
      num: '02', name: 'AI-assisted order entry', client: 'Oracle',
      title: 'How Dr. Haven<br>got help ordering, only when he asked for it',
      description: 'Designing AI-assisted order entry for an EHR: when the assistant helps, and when it steps aside.',
      cta: '<span class="cta cta--locked">Available on request · NDA ' + lock + '</span>',
      bg: '#DCE8E1',
      image: 'assets/img/order-entry.webp', width: 1372, height: 784,
      alt: 'AI assistant panel inside an EHR suggesting a lisinopril order ready for review, with relevant chart context.'
    },
    'order-sets': {
      num: '03', name: 'Order sets', client: 'Oracle',
      title: 'How clinicians<br>ordered complex care plans without losing their place',
      description: 'Modernizing a legacy order sets experience for expert users, without breaking the workflows they rely on.',
      cta: '<span class="cta cta--locked">Available on request · NDA ' + lock + '</span>',
      bg: '#DCC3D2',
      image: 'assets/img/order-sets.webp', width: 2000, height: 1134,
      alt: 'Oncology regimen screen showing a patient summary next to a chemotherapy order set with pre-chemo metrics and pre-medications.'
    }
  };

  // Preload project images so switching feels instant
  Object.values(projects).forEach(function (p) { const i = new Image(); i.src = p.image; });

  /* ---------- Stacked use cases (tablet/phone) ---------- */

  const stack = document.getElementById('work-stack');
  Object.keys(projects).forEach(function (key) {
    const p = projects[key];
    const article = document.createElement('article');
    article.className = 'case';
    article.innerHTML =
      '<p class="case-eyebrow">' +
        '<span class="project-tab-num">' + p.num + '</span>' +
        '<span class="case-name">' + p.name + '</span>' +
        '<span class="case-client">' + p.client + '</span>' +
      '</p>' +
      '<div class="project-copy">' +
        '<h2 class="display">' + p.title + '</h2>' +
        '<p class="lede">' + p.description + '</p>' +
        '<p class="project-cta">' + p.cta + '</p>' +
      '</div>' +
      '<div class="case-visual" style="--panel-bg:' + p.bg + '">' +
        '<img class="project-image project-image--' + key + '" src="' + p.image + '" width="' + p.width + '" height="' + p.height + '" alt="" loading="lazy">' +
      '</div>';
    article.querySelector('img').alt = p.alt;
    stack.appendChild(article);
  });

  /* ---------- Views (Work / Experience / About) ---------- */

  const views = ['work', 'experience', 'about'];
  const titles = { work: 'Work', experience: 'Experience', about: 'About' };
  const navLinks = document.querySelectorAll('.nav-link');
  const main = document.getElementById('main');

  function currentView() {
    const v = location.hash.replace('#', '');
    return views.indexOf(v) > -1 ? v : 'work';
  }

  function showView(focus) {
    const v = currentView();
    views.forEach(function (name) {
      document.getElementById('view-' + name).hidden = name !== v;
    });
    navLinks.forEach(function (a) {
      if (a.dataset.view === v) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    document.title = titles[v] + ' · Saul García, Product designer';
    closeMenu();
    if (focus) {
      window.scrollTo(0, 0);
      main.focus({ preventScroll: true });
    }
  }

  window.addEventListener('hashchange', function () { showView(true); });

  /* ---------- Project switcher ---------- */

  const workView = document.getElementById('view-work');
  const tabs = Array.from(document.querySelectorAll('.project-tab'));
  const panel = document.getElementById('panel-project');
  const titleEl = panel.querySelector('[data-field="title"]');
  const descEl = panel.querySelector('[data-field="description"]');
  const ctaEl = panel.querySelector('[data-field="cta"]');
  const visual = document.querySelector('[data-field="visual"]');
  let switchTimer;

  function selectProject(tab, moveFocus) {
    const key = tab.dataset.project;
    const p = projects[key];
    if (!p || tab.getAttribute('aria-selected') === 'true') return;

    tabs.forEach(function (t) {
      const on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', tab.id);
    if (moveFocus) tab.focus();

    clearTimeout(switchTimer);
    workView.classList.add('is-switching');
    visual.style.setProperty('--panel-bg', p.bg);

    switchTimer = setTimeout(function () {
      titleEl.innerHTML = p.title;
      descEl.textContent = p.description;
      ctaEl.innerHTML = p.cta;
      const img = document.createElement('img');
      img.className = 'project-image project-image--' + key;
      img.src = p.image;
      img.width = p.width;
      img.height = p.height;
      img.alt = p.alt;
      visual.replaceChildren(img);
      requestAnimationFrame(function () { workView.classList.remove('is-switching'); });
    }, 180);
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { selectProject(tab, false); });
    tab.addEventListener('keydown', function (e) {
      let next = null;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === 'Home') next = tabs[0];
      else if (e.key === 'End') next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); selectProject(next, true); }
    });
  });

  /* ---------- Mobile menu ---------- */

  const toggle = document.querySelector('.menu-toggle');
  const toggleLabel = toggle.querySelector('.menu-toggle-label');

  function openMenu() {
    document.body.classList.add('menu-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggleLabel.textContent = 'close';
  }
  function closeMenu() {
    document.body.classList.remove('menu-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggleLabel.textContent = 'menu';
  }

  toggle.addEventListener('click', function () {
    if (document.body.classList.contains('menu-open')) closeMenu();
    else openMenu();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
      closeMenu();
      toggle.focus();
    }
  });
  navLinks.forEach(function (a) { a.addEventListener('click', closeMenu); });

  showView(false);
})();
