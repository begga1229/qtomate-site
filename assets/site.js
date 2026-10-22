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

// Plays muted videos marked data-autoplay while they are on screen. Skipped when the
// visitor prefers reduced motion; a video the visitor paused stays paused.
(function () {
  var videos = document.querySelectorAll('video[data-autoplay]');
  if (!videos.length || !('IntersectionObserver' in window)) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) {
        if (v.dataset.userPaused) return;
        var p = v.play();
        if (p && p.catch) p.catch(function () {});
      } else if (!v.paused) {
        v.dataset.autoPause = '1';
        v.pause();
      }
    });
  }, { threshold: 0.5 });
  videos.forEach(function (v) {
    v.addEventListener('pause', function () {
      if (v.dataset.autoPause) delete v.dataset.autoPause;
      else v.dataset.userPaused = '1';
    });
    v.addEventListener('play', function () { delete v.dataset.userPaused; });
    io.observe(v);
  });
})();
