// Interactive "Sign regimen / Start a cycle" flows, redrawn from the original flowchart.
// Each flow reads left to right: the happy path stays on one row, exceptions drop below.
(function () {
  'use strict';
  const root = document.getElementById('flow');
  if (!root) return;
  const svg = root.querySelector('svg');
  const NS = 'http://www.w3.org/2000/svg';

  // kind: start | action | step | decision | block | end
  const FLOWS = {
    start: {
      box: '0 0 1240 310',
      nodes: {
        A:  { x: 75,   y: 90,  kind: 'start',    t: ['Regimen', 'draft'], w: 110 },
        U1: { x: 210,  y: 90,  kind: 'action',   t: ['Clicks', '“Start”'], w: 104 },
        D3: { x: 370,  y: 90,  kind: 'decision', t: ['Cycle draft', 'already exists?'] },
        D4: { x: 545,  y: 90,  kind: 'decision', t: ['Regimen attributes', 'complete?'], dw: 170 },
        B2: { x: 545,  y: 200, kind: 'block',    t: ['Blocked: complete', 'the attributes'], w: 150, h: 46 },
        O1: { x: 370,  y: 270, kind: 'step',     t: ['Resumes that draft'], w: 150, h: 40 },
        C2: { x: 725,  y: 90,  kind: 'step',     t: ['Draft cycle:', 'review and edit'], w: 140 },
        U2: { x: 875,  y: 90,  kind: 'action',   t: ['Clicks', '“Sign”'], w: 96 },
        D5: { x: 1020, y: 90,  kind: 'decision', t: ['Any critical', 'alerts?'] },
        B3: { x: 1020, y: 200, kind: 'block',    t: ['Blocked: resolve', 'the alert'], w: 140, h: 46 },
        E:  { x: 1170, y: 90,  kind: 'end',      t: ['Regimen and', 'cycle signed'], w: 120 },
      },
      edges: {
        a_u1:  ['M130 90 H152'],
        u1_d3: ['M262 90 H289'],
        d3_d4: ['M445 90 H452', 'No', 446, 80],
        d3_o1: ['M370 138 V244', 'Yes', 380, 166],
        d4_b2: ['M545 138 V171', 'No', 555, 160],
        d4_c2: ['M630 90 H649', 'Yes', 628, 80],
        o1_c2: ['M445 270 H705 V122'],
        c2_u2: ['M795 90 H821'],
        u2_d5: ['M923 90 H939'],
        d5_b3: ['M1020 138 V171', 'Yes', 1030, 160],
        b3_c2: ['M950 200 H745 V122', 'Back to the draft', 790, 192],
        d5_e:  ['M1095 90 H1104', 'No', 1094, 80],
      },
    },
    sign: {
      box: '0 0 960 260',
      nodes: {
        A:  { x: 75,  y: 90,  kind: 'start',    t: ['Regimen', 'draft'], w: 110 },
        U3: { x: 225, y: 90,  kind: 'action',   t: ['Clicks', '“Sign regimen”'], w: 130 },
        D1: { x: 405, y: 90,  kind: 'decision', t: ['Regimen attributes', 'complete?'], dw: 170 },
        B1: { x: 405, y: 205, kind: 'block',    t: ['Blocked: complete', 'the attributes'], w: 150, h: 46 },
        D2: { x: 600, y: 90,  kind: 'decision', t: ['A cycle already', 'started?'] },
        R1: { x: 815, y: 90,  kind: 'end',      t: ['Regimen signed,', 'cycles stay unsigned'], w: 180 },
        E2: { x: 600, y: 205, kind: 'end',      t: ['Regimen and that', 'cycle signed together'], w: 180, h: 50 },
      },
      edges: {
        a_u3:  ['M130 90 H157'],
        u3_d1: ['M290 90 H317'],
        d1_b1: ['M405 138 V176', 'No', 415, 162],
        d1_d2: ['M490 90 H518', 'Yes', 494, 80],
        d2_r1: ['M675 90 H718', 'No', 682, 80],
        d2_e2: ['M600 138 V174', 'Yes', 610, 162],
      },
    },
  };

  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };

  const layers = {};
  for (const key in FLOWS) {
    const f = FLOWS[key];
    const g = el('g', { class: 'fl-flow-' + key }, svg);
    const gE = el('g', {}, g), gN = el('g', {}, g);
    f.edgeEls = {}; f.nodeEls = {};
    for (const id in f.edges) {
      const [d, label, lx, ly] = f.edges[id];
      const ge = el('g', { class: 'fl-edge' }, gE);
      el('path', { d, 'marker-end': 'url(#fl-arrow)' }, ge);
      if (label) { const t = el('text', { x: lx, y: ly, class: 'fl-label' }, ge); t.textContent = label; }
      f.edgeEls[id] = ge;
    }
    for (const id in f.nodes) {
      const n = f.nodes[id];
      const gn = el('g', { class: 'fl-node fl-' + n.kind }, gN);
      if (n.kind === 'decision') {
        const w = n.dw || 150, h = 96;
        el('polygon', { points: `${n.x},${n.y - h / 2} ${n.x + w / 2},${n.y} ${n.x},${n.y + h / 2} ${n.x - w / 2},${n.y}` }, gn);
      } else {
        const w = n.w || 130, h = n.h || 56;
        const r = n.kind === 'action' ? h / 2 : (n.kind === 'start' || n.kind === 'end') ? 14 : 8;
        el('rect', { x: n.x - w / 2, y: n.y - h / 2, width: w, height: h, rx: r }, gn);
      }
      n.t.forEach((line, i) => {
        const t = el('text', { x: n.x, y: n.y + (i - (n.t.length - 1) / 2) * 15 + 4, 'text-anchor': 'middle' }, gn);
        t.textContent = line;
      });
      f.nodeEls[id] = gn;
    }
    layers[key] = g;
  }

  // ---- Canvas: fixed board, zoom, and pan (drag with a mouse, native scroll on touch) ----
  const canvas = root.querySelector('.fl-canvas');
  const zoomLabel = root.querySelector('.fl-zoom');
  const BASE = 1.3;      // the zoom shown as 100%
  // Below 0.75 the labels get too small to read: fit no smaller than that and let the board scroll
  const MIN_FIT = 0.75;
  let zoom = BASE, currentBox = '', userZoomed = false;
  const pad = () => 20;
  function size(reset) {
    const [, , w, h] = currentBox.split(' ').map(Number);
    const sw = w * zoom, sh = h * zoom, p = pad();
    svg.style.width = Math.round(sw) + 'px';
    svg.style.height = Math.round(sh) + 'px';
    const mx = Math.max(p, (canvas.clientWidth - sw) / 2), my = Math.max(p / 2, (canvas.clientHeight - sh) / 2);
    svg.style.margin = `${Math.round(my)}px ${Math.round(mx)}px`;
    zoomLabel.textContent = Math.round(zoom / BASE * 100) + '%';
    if (reset) { canvas.scrollLeft = 0; canvas.scrollTop = 0; }
  }
  // Fit the whole flow on the board (up to 100%)
  function fit() {
    const [, , w, h] = currentBox.split(' ').map(Number);
    const p = pad();
    zoom = Math.max(MIN_FIT, Math.min(BASE, (canvas.clientWidth - p * 2) / w));
    // The board is as tall as the fitted flow (plus room for the zoom tools and the hint), up to 480px
    canvas.style.height = Math.min(480, Math.round(h * zoom + 120)) + 'px';
    size(true);
  }
  root.querySelectorAll('[data-zoom]').forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.zoom;
    if (k === 'fit') { userZoomed = false; return fit(); }
    userZoomed = true;
    zoom = Math.min(2.6, Math.max(0.5, zoom * (k === 'in' ? 1.2 : 1 / 1.2)));
    size(false);
  }));
  // Refit when the board changes size, unless the reader picked a zoom
  if ('ResizeObserver' in window) {
    let lastW = 0;
    new ResizeObserver(() => {
      if (canvas.clientWidth === lastW) return;
      lastW = canvas.clientWidth;
      if (currentBox) (userZoomed ? size(false) : fit());
    }).observe(canvas);
  }
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return; // touch and pen use native scrolling
    drag = { x: e.clientX, y: e.clientY, l: canvas.scrollLeft, t: canvas.scrollTop };
    canvas.classList.add('is-dragging');
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    canvas.scrollLeft = drag.l - (e.clientX - drag.x);
    canvas.scrollTop = drag.t - (e.clientY - drag.y);
  });
  const end = () => { drag = null; canvas.classList.remove('is-dragging'); };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);

  const state = { action: 'start', attrs: true, started: false, draft: false, critical: false };

  function route() {
    if (state.action === 'sign') {
      const p = ['A', 'a_u3', 'U3', 'u3_d1', 'D1'];
      if (!state.attrs) return { p: p.concat('d1_b1', 'B1'), out: 'Signing is blocked until the regimen attributes are complete, like intent or line of therapy.', tone: 'block' };
      p.push('d1_d2', 'D2');
      if (!state.started) return { p: p.concat('d2_r1', 'R1'), out: 'The regimen is signed on its own. Its cycles stay unsigned until she starts and signs each one.', tone: 'end' };
      return { p: p.concat('d2_e2', 'E2'), out: 'A cycle was already started, so the regimen and that cycle are signed together.', tone: 'end' };
    }
    const p = ['A', 'a_u1', 'U1', 'u1_d3', 'D3'];
    let lead = '';
    if (state.draft) {
      p.push('d3_o1', 'O1', 'o1_c2', 'C2');
      lead = 'She picks up the cycle draft she left earlier, instead of creating a second one. ';
    } else {
      p.push('d3_d4', 'D4');
      if (!state.attrs) return { p: p.concat('d4_b2', 'B2'), out: 'She can’t start a cycle until the regimen attributes are complete. No draft is created.', tone: 'block' };
      p.push('d4_c2', 'C2');
      lead = 'A new cycle draft opens. ';
    }
    p.push('c2_u2', 'U2', 'u2_d5', 'D5');
    if (state.critical) return { p: p.concat('d5_b3', 'B3', 'b3_c2'), out: lead + 'A critical alert blocks signing and sends her back to the draft. Pending alerts don’t block.', tone: 'block' };
    return { p: p.concat('d5_e', 'E'), out: lead + 'Signing the cycle signs the regimen too: one signature for both.', tone: 'end' };
  }

  const out = root.querySelector('.fl-outcome');
  const toggles = root.querySelectorAll('[data-toggle]');
  const radios = root.querySelectorAll('input[name="fl-flow"]');

  function render() {
    const r = route();
    const on = new Set(r.p);
    for (const key in FLOWS) {
      const f = FLOWS[key];
      const active = key === state.action;
      layers[key].style.display = active ? '' : 'none';
      if (!active) continue;
      svg.setAttribute('viewBox', f.box);
      if (f.box !== currentBox) { currentBox = f.box; userZoomed ? size(true) : fit(); }
      for (const id in f.nodeEls) f.nodeEls[id].classList.toggle('is-on', on.has(id));
      for (const id in f.edgeEls) f.edgeEls[id].classList.toggle('is-on', on.has(id));
    }
    svg.classList.add('has-path');
    out.textContent = r.out;
    out.dataset.tone = r.tone;
    radios.forEach((x) => { x.checked = x.value === state.action; });
    toggles.forEach((b) => {
      const k = b.dataset.toggle;
      b.setAttribute('aria-checked', String(state[k]));
      const scope = b.dataset.scope;
      let hide = !!scope && scope !== state.action;
      if (k === 'attrs' && state.action === 'start' && state.draft) hide = true; // a resumed draft skips this check
      b.hidden = hide;
    });
  }

  radios.forEach((x) => x.addEventListener('change', () => { if (x.checked) { state.action = x.value; render(); } }));
  toggles.forEach((b) => b.addEventListener('click', () => { state[b.dataset.toggle] = !state[b.dataset.toggle]; render(); }));
  render();
})();
