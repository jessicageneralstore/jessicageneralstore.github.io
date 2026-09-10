/* JESSICA GENERAL STORE — site.js (motion after DESIGN LOCK; no layout changes) */
(function () {
  'use strict';
  var d = document, w = window;
  var reduce = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cfg = w.__JGS || {};

  /* ---------- attribution capture (sourcePlatform / content / campaign) ---------- */
  try {
    var q = new URLSearchParams(location.search);
    var keys = ['src', 'cid', 'track', 'pk', 'camp', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
    var attr = {};
    var got = false;
    keys.forEach(function (k) { var v = q.get(k); if (v) { attr[k] = v.slice(0, 80); got = true; } });
    if (got) { attr.at = Date.now(); attr.landing = location.pathname; sessionStorage.setItem('jgs_attr', JSON.stringify(attr)); }
  } catch (e) {}

  function attribution() { try { return JSON.parse(sessionStorage.getItem('jgs_attr') || '{}'); } catch (e) { return {}; } }
  w.jgsTrack = function (name, params) {
    var p = Object.assign({}, attribution(), params || {});
    try { if (w.gtag) w.gtag('event', name, p); } catch (e) {}
    try {
      if (cfg.beaconUrl && navigator.sendBeacon) {
        navigator.sendBeacon(cfg.beaconUrl, JSON.stringify({ e: name, p: p, t: Date.now(), path: location.pathname }));
      }
    } catch (e) {}
  };

  /* ---------- menu ---------- */
  var menu = d.getElementById('menu');
  d.querySelectorAll('[data-menu-open]').forEach(function (b) { b.addEventListener('click', function () { menu.setAttribute('data-open', '1'); }); });
  d.querySelectorAll('[data-menu-close]').forEach(function (b) { b.addEventListener('click', function () { menu.removeAttribute('data-open'); }); });

  /* ---------- hero reveal: still -> slight expand -> video ---------- */
  var hero = d.querySelector('.hero');
  if (hero) {
    var vid = hero.querySelector('video');
    var canVideo = !reduce && vid && !(navigator.connection && navigator.connection.saveData);
    if (canVideo) {
      var armed = false;
      var arm = function () {
        if (armed) return; armed = true;
        vid.addEventListener('canplay', function () { vid.setAttribute('data-ready', '1'); });
        /* breathing loop: play once, fade back to the still, then replay (no hard loop pop) */
        vid.removeAttribute('loop');
        vid.addEventListener('ended', function () {
          vid.removeAttribute('data-ready');
          setTimeout(function () { try { vid.currentTime = 0; } catch (e) {} var p2 = vid.play(); if (p2 && p2.catch) p2.catch(function () {}); vid.setAttribute('data-ready', '1'); }, 1400);
        });
        vid.load();
        var p = vid.play(); if (p && p.catch) p.catch(function () {});
      };
      var onScroll = function () {
        var y = w.scrollY || 0;
        if (y > 24) { hero.setAttribute('data-reveal', '1'); arm(); }
        else if (y < 4) { hero.removeAttribute('data-reveal'); }
      };
      w.addEventListener('scroll', onScroll, { passive: true });
      setTimeout(function () { if ((w.scrollY || 0) < 24) { hero.setAttribute('data-reveal', '1'); arm(); } }, 2600);
    } else if (vid) { vid.remove(); }
  }

  /* ---------- card entrance ---------- */
  if ('IntersectionObserver' in w && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.setAttribute('data-in', '1'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    d.querySelectorAll('.card, .sec-head, .vcard, .about, .rcard').forEach(function (c) { io.observe(c); });
  } else { d.documentElement.classList.add('no-io'); }

  /* ---------- category chips ---------- */
  var chips = d.querySelectorAll('.chip[data-cat]');
  if (chips.length) {
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        chips.forEach(function (x) { x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); });
        var cat = c.getAttribute('data-cat');
        d.querySelectorAll('.card[data-cat]').forEach(function (k) {
          var show = cat === 'ALL' || k.getAttribute('data-cat') === cat;
          k.hidden = !show; if (show) k.setAttribute('data-in', '1');
        });
        w.jgsTrack('pick_filter', { cat: cat });
      });
    });
  }

  /* ---------- outbound affiliate clicks ---------- */
  d.querySelectorAll('a[data-go]').forEach(function (a) {
    a.addEventListener('click', function () { w.jgsTrack('affiliate_click', { productKey: a.getAttribute('data-go'), place: a.getAttribute('data-place') || '' }); });
  });

  /* ---------- go page redirect ---------- */
  var go = d.querySelector('[data-go-url]');
  if (go) {
    var url = go.getAttribute('data-go-url');
    w.jgsTrack('affiliate_out', { productKey: go.getAttribute('data-go-key') });
    setTimeout(function () { location.replace(url); }, 350);
  }

  /* ---------- product page view ---------- */
  var pv = d.querySelector('[data-product-view]');
  if (pv) w.jgsTrack('product_view', { productKey: pv.getAttribute('data-product-view') });
  var vv = d.querySelectorAll('video[data-video-id]');
  vv.forEach(function (v) { v.addEventListener('play', function () { w.jgsTrack('video_view', { videoId: v.getAttribute('data-video-id') }); }, { once: true }); });
})();
