// Sign / start rules, redrawn from the original flowchart as one interactive chart.
// Two lanes leave the regimen draft: sign the regimen on its own (top), or start a cycle and
// sign both together (bottom). The reader picks a lane by pressing its action, and answers each
// check by pressing Yes or No on the chart; the chosen path lights up and the outcome is written
// below. It opens fitted to the card (100%); + and − zoom in, and the board pans by dragging
// (mouse) or scrolling (touch, trackpad).
(function () {
  'use strict';
  const root = document.getElementById('flow');
  if (!root) return;
  const svg = root.querySelector('svg');
  const stage = root.querySelector('.fl-stage');
  const canvas = root.querySelector('.fl-canvas');
  const zoomLabel = root.querySelector('.fl-zoom');
  const out = root.querySelector('.fl-outcome');
  const NS = 'http://www.w3.org/2000/svg';
  // The drawing's coordinates; the view crops the empty margins around it
  const VX = 20, VY = 110, W = 1580, H = 630;
  svg.setAttribute('viewBox', `${VX} ${VY} ${W} ${H}`);

  // kind: start | action | step | decision | block | end
  const nodes = {
    A:  { x: 90,   y: 345, kind: 'start',    t: ['Regimen', 'draft'], w: 120 },
    // Top lane: sign the regimen on its own
    U3: { x: 280,  y: 170, kind: 'action',   t: ['Clicks', '“Sign regimen”'], w: 150, lane: 'sign' },
    D1: { x: 500,  y: 170, kind: 'decision', t: ['Regimen attributes', 'complete?'], dw: 190 },
    B1: { x: 500,  y: 330, kind: 'block',    t: ['Blocked: complete', 'the attributes'], w: 170, h: 52 },
    D2: { x: 760,  y: 170, kind: 'decision', t: ['A cycle', 'already started?'], dw: 180 },
    R1: { x: 1020, y: 170, kind: 'end',      t: ['Regimen signed,', 'cycles stay unsigned'], w: 200 },
    E2: { x: 760,  y: 330, kind: 'end',      t: ['Regimen and that', 'cycle signed together'], w: 200 },
    // Bottom lane: start a cycle, then sign both
    U1: { x: 280,  y: 520, kind: 'action',   t: ['Clicks', '“Start”'], w: 130, lane: 'start' },
    D3: { x: 500,  y: 520, kind: 'decision', t: ['Cycle draft', 'already exists?'], dw: 180 },
    O1: { x: 500,  y: 705, kind: 'step',     t: ['Resumes that draft'], w: 170, h: 44 },
    D4: { x: 760,  y: 520, kind: 'decision', t: ['Regimen attributes', 'complete?'], dw: 190 },
    B2: { x: 760,  y: 650, kind: 'block',    t: ['Blocked: complete', 'the attributes'], w: 170, h: 52 },
    C2: { x: 1000, y: 520, kind: 'step',     t: ['Draft cycle:', 'review and edit'], w: 150 },
    U2: { x: 1160, y: 520, kind: 'action',   t: ['Clicks', '“Sign”'], w: 110 },
    D5: { x: 1320, y: 520, kind: 'decision', t: ['Any critical', 'alerts?'], dw: 160 },
    B3: { x: 1320, y: 660, kind: 'block',    t: ['Blocked: resolve', 'the alert'], w: 160, h: 52 },
    E:  { x: 1520, y: 520, kind: 'end',      t: ['Regimen and', 'cycle signed'], w: 130 },
  };
  // [path, answer button: [decision, value, x, y]] or [path, label text, x, y]
  const edges = {
    a_u3:  ['M150 335 H175 V170 H203'],
    a_u1:  ['M150 355 H175 V520 H213'],
    u3_d1: ['M355 170 H403'],
    d1_d2: ['M595 170 H668', ['D1', 'yes', 632, 170]],
    d1_b1: ['M500 220 V302', ['D1', 'no', 500, 262]],
    d2_r1: ['M850 170 H918', ['D2', 'no', 885, 170]],
    d2_e2: ['M760 220 V300', ['D2', 'yes', 760, 262]],
    u1_d3: ['M345 520 H408'],
    d3_d4: ['M590 520 H663', ['D3', 'no', 627, 520]],
    d3_o1: ['M500 570 V681', ['D3', 'yes', 500, 626]],
    d4_c2: ['M855 520 H923', ['D4', 'yes', 890, 520]],
    d4_b2: ['M760 570 V622', ['D4', 'no', 760, 597]],
    o1_c2: ['M585 705 H985 V550'],
    c2_u2: ['M1075 520 H1103'],
    u2_d5: ['M1215 520 H1238'],
    d5_e:  ['M1400 520 H1453', ['D5', 'no', 1427, 520]],
    d5_b3: ['M1320 570 V632', ['D5', 'yes', 1320, 601]],
    b3_c2: ['M1240 660 H1015 V550', 'Back to the draft', 1130, 650],
  };
  const QUESTIONS = {
    D1: 'Regimen attributes complete?', D2: 'A cycle already started?', D3: 'Cycle draft already exists?',
    D4: 'Regimen attributes complete?', D5: 'Any critical alerts?',
  };

  // The happy path is chosen to begin with, so the chart never opens empty
  const state = { lane: 'start', D1: 'yes', D2: 'no', D3: 'no', D4: 'yes', D5: 'no' };

  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };

  // ---- Draw ----
  const gE = el('g', {}, svg), gN = el('g', {}, svg);
  const edgeEls = {}, nodeEls = {};
  for (const id in edges) {
    const [d, extra, lx, ly] = edges[id];
    const g = el('g', { class: 'fl-edge' }, gE);
    el('path', { d, 'marker-end': 'url(#fl-arrow)' }, g);
    if (typeof extra === 'string') { const t = el('text', { x: lx, y: ly, class: 'fl-label', 'text-anchor': 'middle' }, g); t.textContent = extra; }
    edgeEls[id] = g;
  }
  for (const id in nodes) {
    const n = nodes[id];
    const g = el('g', { class: 'fl-node fl-' + n.kind }, gN);
    if (n.kind === 'decision') {
      const w = n.dw || 160, h = 100;
      el('polygon', { points: `${n.x},${n.y - h / 2} ${n.x + w / 2},${n.y} ${n.x},${n.y + h / 2} ${n.x - w / 2},${n.y}` }, g);
    } else {
      const w = n.w || 130, h = n.h || 56;
      const r = n.kind === 'action' ? h / 2 : (n.kind === 'start' || n.kind === 'end') ? 14 : 8;
      el('rect', { x: n.x - w / 2, y: n.y - h / 2, width: w, height: h, rx: r }, g);
    }
    n.t.forEach((line, i) => {
      const t = el('text', { x: n.x, y: n.y + (i - (n.t.length - 1) / 2) * 18 + 5, 'text-anchor': 'middle' }, g);
      t.textContent = line;
    });
    nodeEls[id] = g;
  }

  // ---- Buttons on the chart: real buttons over the drawing, so keyboards and screen readers can use them ----
  const pct = (v, total) => (v / total * 100) + '%';
  const laneButtons = [], answerButtons = [];
  for (const id in nodes) {
    const n = nodes[id];
    if (!n.lane) continue;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'fl-pick';
    b.style.left = pct(n.x - n.w / 2 - VX, W); b.style.top = pct(n.y - 28 - VY, H);
    b.style.width = pct(n.w, W); b.style.height = pct(56, H);
    b.innerHTML = '<span class="visually-hidden">' + (n.lane === 'sign' ? 'Path: sign the regimen on its own' : 'Path: start a cycle and sign both') + '</span>';
    b.dataset.lane = n.lane;
    b.addEventListener('click', () => { state.lane = n.lane; render(); });
    stage.appendChild(b);
    laneButtons.push(b);
  }
  for (const id in edges) {
    const extra = edges[id][1];
    if (!Array.isArray(extra)) continue;
    const [dec, val, x, y] = extra;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'fl-answer';
    b.style.left = pct(x - VX, W); b.style.top = pct(y - VY, H);
    b.textContent = val === 'yes' ? 'Yes' : 'No';
    b.setAttribute('aria-label', QUESTIONS[dec] + ' ' + b.textContent);
    b.dataset.dec = dec; b.dataset.val = val;
    b.addEventListener('click', () => choose(dec, val));
    stage.appendChild(b);
    answerButtons.push(b);
  }

  // Answering a check also makes sure the path reaches it (its lane, and the answers before it)
  function choose(dec, val) {
    state.lane = dec === 'D1' || dec === 'D2' ? 'sign' : 'start';
    if (dec === 'D2') state.D1 = 'yes';
    if (dec === 'D4') state.D3 = 'no';
    if (dec === 'D5' && state.D3 === 'no') state.D4 = 'yes';
    state[dec] = val;
    render();
  }

  function route() {
    if (state.lane === 'sign') {
      const p = ['A', 'a_u3', 'U3', 'u3_d1', 'D1'];
      if (state.D1 === 'no') return { p: p.concat('d1_b1', 'B1'), out: 'Signing is blocked until the regimen attributes are complete, like intent or line of therapy.', tone: 'block' };
      p.push('d1_d2', 'D2');
      if (state.D2 === 'no') return { p: p.concat('d2_r1', 'R1'), out: 'The regimen is signed on its own. Its cycles stay unsigned until she starts and signs each one.', tone: 'end' };
      return { p: p.concat('d2_e2', 'E2'), out: 'A cycle was already started, so the regimen and that cycle are signed together.', tone: 'end' };
    }
    const p = ['A', 'a_u1', 'U1', 'u1_d3', 'D3'];
    let lead = '';
    if (state.D3 === 'yes') {
      p.push('d3_o1', 'O1', 'o1_c2', 'C2');
      lead = 'She picks up the cycle draft she left earlier, instead of creating a second one. ';
    } else {
      p.push('d3_d4', 'D4');
      if (state.D4 === 'no') return { p: p.concat('d4_b2', 'B2'), out: 'She can’t start a cycle until the regimen attributes are complete. No draft is created.', tone: 'block' };
      p.push('d4_c2', 'C2');
      lead = 'A new cycle draft opens. ';
    }
    p.push('c2_u2', 'U2', 'u2_d5', 'D5');
    if (state.D5 === 'yes') return { p: p.concat('d5_b3', 'B3', 'b3_c2'), out: lead + 'A critical alert blocks signing and sends her back to the draft. Pending alerts don’t block.', tone: 'block' };
    return { p: p.concat('d5_e', 'E'), out: lead + 'Signing the cycle signs the regimen too: one signature for both.', tone: 'end' };
  }

  function render() {
    const r = route();
    const on = new Set(r.p);
    for (const id in nodeEls) nodeEls[id].classList.toggle('is-on', on.has(id));
    for (const id in edgeEls) edgeEls[id].classList.toggle('is-on', on.has(id));
    svg.classList.add('has-path');
    laneButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lane === state.lane)));
    answerButtons.forEach((b) => {
      b.setAttribute('aria-pressed', String(state[b.dataset.dec] === b.dataset.val));
      b.classList.toggle('is-off-path', !on.has(b.dataset.dec));
    });
    out.textContent = r.out;
    out.dataset.tone = r.tone;
  }

  // ---- Zoom and pan: opens fitted to the card (100%); + and − zoom in and out from there ----
  const PAD = 16;
  let fit = 1, zoom = 1;
  function size(keepCentre) {
    const cx = (canvas.scrollLeft + canvas.clientWidth / 2) / (stage.offsetWidth || 1);
    const cy = (canvas.scrollTop + canvas.clientHeight / 2) / (stage.offsetHeight || 1);
    stage.style.width = Math.round(W * zoom) + 'px';
    stage.style.height = Math.round(H * zoom) + 'px';
    zoomLabel.textContent = Math.round(zoom / fit * 100) + '%';
    if (keepCentre) {
      canvas.scrollLeft = cx * stage.offsetWidth - canvas.clientWidth / 2;
      canvas.scrollTop = cy * stage.offsetHeight - canvas.clientHeight / 2;
    }
  }
  function fitToCard() {
    // Fitted to the card; on phones that would be too small to read, so it starts at 0.65 and scrolls sideways
    fit = zoom = Math.max(0.65, (canvas.clientWidth - PAD * 2) / W);
    canvas.style.height = Math.round(H * fit + PAD * 2) + 'px'; // the board keeps this height when zoomed in
    size(false);
    canvas.scrollLeft = 0; canvas.scrollTop = 0;
  }
  root.querySelectorAll('[data-zoom]').forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.zoom;
    if (k === 'fit') return fitToCard();
    zoom = Math.min(fit * 3, Math.max(fit, zoom * (k === 'in' ? 1.25 : 1 / 1.25)));
    size(true);
  }));
  let lastWidth = 0;
  const onResize = () => { if (canvas.clientWidth !== lastWidth) { lastWidth = canvas.clientWidth; fitToCard(); } };
  if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(canvas); else window.addEventListener('resize', onResize);

  // Drag to pan with a mouse (not when pressing a button on the chart); touch uses native scrolling
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('button')) return;
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

  render();
  onResize();
})();
