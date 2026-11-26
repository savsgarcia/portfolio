// Phone frames: the screen scrolls inside the frame. Its bottom button steps aside while the
// screen is scrolling and comes back when scrolling stops or the end is reached.
(function () {
  'use strict';
  document.querySelectorAll('.vo-phone').forEach((phone) => {
    const screen = phone.querySelector('.vo-phone__screen');
    if (!screen || !phone.querySelector('.vo-phone__cta')) return;
    let timer;
    screen.addEventListener('scroll', () => {
      const atEnd = screen.scrollTop + screen.clientHeight >= screen.scrollHeight - 2;
      clearTimeout(timer);
      phone.classList.toggle('is-scrolling', !atEnd);
      if (!atEnd) timer = setTimeout(() => phone.classList.remove('is-scrolling'), 400);
    }, { passive: true });
  });
})();

// Decision 01: Lender / Associate switch. Without JavaScript both phones show, one after the other.
(function () {
  'use strict';
  document.querySelectorAll('.vo-roles').forEach((fig) => {
    const buttons = Array.from(fig.querySelectorAll('.cs-segmented button[data-role]'));
    const views = Array.from(fig.querySelectorAll('.vo-roles__view'));
    const show = (role) => {
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.role === role)));
      views.forEach((v) => { v.hidden = v.dataset.role !== role; });
    };
    buttons.forEach((b) => b.addEventListener('click', () => show(b.dataset.role)));
    fig.classList.add('is-switchable');
    show('lender');
  });
})();
