document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  var cta = document.querySelector('.nav-cta');
  if (!toggle || !links) return;

  // Mobile menu: copy the contact button into the menu panel
  if (cta && !links.querySelector('.nav-links-cta')) {
    var c = cta.cloneNode(true);
    c.className = 'nav-links-cta';
    links.appendChild(c);
  }
  links.id = links.id || 'site-menu';
  toggle.setAttribute('aria-controls', links.id);
  toggle.setAttribute('aria-expanded', 'false');

  function setOpen(open) {
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニュー');
  }

  toggle.addEventListener('click', function () {
    setOpen(!document.body.classList.contains('menu-open'));
  });
  links.addEventListener('click', function (e) {
    if (e.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setOpen(false);
  });
  window.matchMedia('(min-width:901px)').addEventListener('change', function (e) {
    if (e.matches) setOpen(false);
  });
});
