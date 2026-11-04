/* v272 — "Skyline Depth" parallax. Moves the three silhouette layers of #pk-sky upward by a few px while scrolling, each at its own speed.
   transform only (no layout), one passive scroll listener, one requestAnimationFrame per frame. Self-contained: needs only #pk-sky from index.html.
   Stays still (CSS-only look) with prefers-reduced-motion, Save-Data, or low-end phones (<=2 GB RAM / <=2 cores). */
(function () {
    'use strict';
    var root = document.getElementById('pk-sky');
    if (!root) return;
    var layers = root.querySelectorAll('i');
    if (layers.length < 3) return;
    try {
        var mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
        var conn = navigator.connection || {};
        var weak = (navigator.deviceMemory && navigator.deviceMemory <= 2) ||
                   (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) || conn.saveData;
        if ((mq && mq.matches) || weak) { root.setAttribute('data-static', '1'); return; }
    } catch (e) {}
    var SPEED = [0.02, 0.045, 0.08];   // far, middle, near
    var CAP   = [10, 22, 40];          // max px each layer may rise (layers extend below the screen, so no gap shows)
    var queued = false, last = -1;
    function paint() {
        queued = false;
        var y = window.pageYOffset || document.documentElement.scrollTop || 0;
        if (y === last) return;
        last = y;
        for (var i = 0; i < 3; i++) {
            var t = Math.min(y * SPEED[i], CAP[i]);
            layers[i].style.transform = 'translate3d(0,' + (-t).toFixed(1) + 'px,0)';
        }
    }
    function onScroll() { if (!queued) { queued = true; window.requestAnimationFrame(paint); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    paint();
})();
