// Closes the mobile menu on an outside click and on Escape.
(function () {
  function openMenus() { return document.querySelectorAll('details.menu[open]'); }
  document.addEventListener('click', function (e) {
    openMenus().forEach(function (d) { if (!d.contains(e.target)) d.removeAttribute('open'); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    openMenus().forEach(function (d) { d.removeAttribute('open'); d.querySelector('summary').focus(); });
  });
})();
