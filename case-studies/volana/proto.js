// "Add a member to your circle": a working prototype of the search in Volana's loan offer.
// Fictional members; search filters as you type, a member opens with their track record,
// and "Agregar al círculo" adds them. Focus moves with the view and comes back to the list.
(function () {
  'use strict';
  const root = document.querySelector('.vo-proto');
  if (!root) return;

  const members = [
    ['Julieta García', 4, 5, 5, 'Agosto 2019'],
    ['Juana de Arco', 4, 3, 3, 'Julio 2019'],
    ['María Hernández', 5, 6, 6, 'Septiembre 2019'],
    ['José Luis Martínez', 3, 4, 3, 'Junio 2019'],
    ['Guadalupe Sánchez', 5, 2, 2, 'Agosto 2019'],
    ['Rosa María López', 4, 4, 4, 'Mayo 2019'],
    ['Francisco Ramírez', 2, 3, 1, 'Abril 2019'],
    ['Ana Karen Flores', 5, 1, 1, 'Septiembre 2019'],
    ['Miguel Ángel Torres', 4, 2, 2, 'Julio 2019'],
    ['Verónica Díaz', 3, 3, 2, 'Junio 2019'],
    ['Alejandra Cruz', 5, 4, 4, 'Agosto 2019'],
    ['Jorge Morales', 4, 2, 2, 'Mayo 2019'],
  ].map(([name, stars, loans, ontime, last]) => ({ name, stars, loans, ontime, last, added: false }));

  const plain = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const starText = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);
  const views = { search: root.querySelector('[data-view="search"]'), member: root.querySelector('[data-view="member"]') };
  const input = root.querySelector('#vo-search');
  const list = root.querySelector('.vo-proto__list');
  const count = root.querySelector('.vo-proto__count');
  const toast = root.querySelector('.vo-proto__toast');
  const add = root.querySelector('[data-add]');
  const field = (k) => root.querySelector('[data-' + k + ']');
  let current = null;

  function render() {
    const q = plain(input.value.trim());
    const found = members.filter((m) => !q || plain(m.name).includes(q));
    list.innerHTML = '';
    found.forEach((m) => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'vo-proto__item';
      b.dataset.name = m.name;
      b.innerHTML = '<span class="vo-proto__name"></span>' +
        '<span class="vo-proto__meta"><span class="vo-proto__stars-sm" aria-hidden="true">' + starText(m.stars) + '</span>' +
        '<span class="visually-hidden">' + m.stars + ' de 5 estrellas. </span>' +
        (m.added ? '<span class="vo-proto__badge">En tu círculo</span>' : m.ontime + ' de ' + m.loans + ' a tiempo') + '</span>';
      b.querySelector('.vo-proto__name').textContent = m.name;
      b.addEventListener('click', () => open(m));
      li.appendChild(b);
      list.appendChild(li);
    });
    count.textContent = q ? found.length + (found.length === 1 ? ' persona' : ' personas') : 'Personas a las que ya les prestaste';
  }

  function show(name) {
    Object.entries(views).forEach(([k, v]) => { v.hidden = k !== name; });
  }

  function open(m) {
    current = m;
    field('mname').textContent = m.name;
    field('stars').innerHTML = '<span aria-hidden="true">' + starText(m.stars) + '</span><span class="visually-hidden">' + m.stars + ' de 5 estrellas</span>';
    field('loans').textContent = m.loans;
    field('ontime').textContent = m.ontime + ' de ' + m.loans;
    field('last').textContent = m.last;
    const good = m.ontime === m.loans;
    field('note').textContent = good ? m.name.split(' ')[0] + ' se ha comportado bien en otros préstamos.' : 'Tuvo pagos tarde. Considera un monto menor.';
    field('note').classList.toggle('is-warn', !good);
    add.disabled = m.added;
    add.textContent = m.added ? 'Ya está en tu círculo' : 'Agregar al círculo';
    toast.textContent = '';
    show('member');
    field('mname').focus();
  }

  function back() {
    show('search');
    render();
    const again = current && list.querySelector('[data-name="' + current.name + '"]');
    (again || input).focus();
  }

  add.addEventListener('click', () => {
    if (!current || current.added) return;
    current.added = true;
    toast.textContent = current.name + ' ya está en tu círculo.';
    back();
  });
  root.querySelector('.vo-proto__back').addEventListener('click', back);
  root.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !views.member.hidden) back(); });
  input.addEventListener('input', () => { toast.textContent = ''; render(); });
  render();
})();
