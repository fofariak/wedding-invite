/* Guest-side behaviour shared by every template except classic. A template provides window.INVITE (from tokens)
   and markup with these hooks:
   #scene (intro overlay, data-ms = how long the opening animation takes) containing #book (tap target)
   #opening (optional opening-blessing page, added by the engine), #front (first page) with [data-t] items (seconds)
   .rv (reveal on scroll), [data-depth] (gentle parallax), [data-cd=d|h|m|s] (countdown)
   .carousel > .track (+ .dots), #copy/#copied, #rsvp/#r-name/#thanks, #bgm/#music, #arrow, #tip */
(function () {
  'use strict';
  var I = window.INVITE || {}, T = I.t || {}, root = document.documentElement, body = document.body;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };
  function later(fn, ms) { return setTimeout(fn, reduce ? 0 : ms); }
  function fill(t, o) { return String(t || '').replace(/\{(\w+)\}/g, function (m, k) { return Object.prototype.hasOwnProperty.call(o, k) ? o[k] : m; }); }
  root.classList.add('js');

  /* ---------- music ---------- */
  var bgm = $('bgm'), mb = $('music'), playing = false;
  function setBtn() { if (!mb) return; mb.classList.toggle('on', playing); mb.setAttribute('aria-pressed', playing); mb.setAttribute('aria-label', playing ? T.pause : T.play); }
  function startMusic() { if (!bgm) return; var p = bgm.play(); playing = true; setBtn(); if (p && p.catch) p.catch(function () { playing = false; setBtn(); }); }
  if (mb) mb.addEventListener('click', function () { if (playing) { bgm.pause(); playing = false; setBtn(); } else startMusic(); });

  /* ---------- first page ---------- */
  var frontDone = false;
  function frontSequence() {
    if (frontDone) return; frontDone = true; root.classList.add('opened');
    var items = [].slice.call(document.querySelectorAll('#front [data-t]')), last = 0;
    items.forEach(function (el) { var t = +el.dataset.t * 1000; last = Math.max(last, t); later(function () { el.classList.add('on'); }, t); });
    later(function () { body.classList.remove('locked'); var a = $('arrow'); if (a) a.classList.add('on'); if (mb) mb.hidden = false; }, last + 700);
  }
  // With an opening-blessing page, the invitation opens onto it; the first page animates when scrolled into view.
  function afterOpen() {
    var op = $('opening');
    if (!op) { frontSequence(); return; }
    root.classList.add('opened'); op.classList.add('on');
    later(function () { var a = $('arrow'); if (a) a.classList.add('on'); body.classList.remove('locked'); if (mb) mb.hidden = false; }, 1400);
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); frontSequence(); } }, { threshold: .35 });
      io.observe($('front'));
    } else frontSequence();
  }
  addEventListener('scroll', function () { if (scrollY > 60) { var a = $('arrow'); if (a) a.classList.remove('on'); } }, { passive: true });

  /* ---------- intro: tap to open ---------- */
  var scene = $('scene'), book = $('book'), opened = false;
  function openInvite() {
    if (opened) return; opened = true; startMusic();
    var ms = scene ? +(scene.dataset.ms || 1800) : 0;
    root.classList.add('opening');
    later(function () { if (scene) scene.classList.add('gone'); afterOpen(); }, ms);
    later(function () { if (scene) scene.hidden = true; }, ms + 1000);
  }
  if (book) book.addEventListener('click', openInvite);
  if (scene) {
    body.classList.add('locked');
    var ready = function () { scene.classList.add('ready'); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(ready, 250); }); else setTimeout(ready, 400);
  } else afterOpen();

  /* ---------- reveal on scroll ---------- */
  var rv = [].slice.call(document.querySelectorAll('.rv'));
  if ('IntersectionObserver' in window && !reduce) {
    var ro = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('on'); ro.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    rv.forEach(function (el) { ro.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('on'); });

  /* ---------- gentle parallax ---------- */
  var depth = [].slice.call(document.querySelectorAll('[data-depth]'));
  if (depth.length && !reduce) {
    var ticking = false;
    var paint = function () { ticking = false; depth.forEach(function (el) { var r = el.parentNode.getBoundingClientRect(); el.style.transform = 'translate3d(0,' + (-r.top * +el.dataset.depth).toFixed(1) + 'px,0)'; }); };
    addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }, { passive: true });
    paint();
  }

  /* ---------- countdown ---------- */
  var cd = [].slice.call(document.querySelectorAll('[data-cd]')), target = Date.parse(I.target);
  function tick() {
    var s = Math.max(0, Math.floor((target - Date.now()) / 1000)), v = { d: Math.floor(s / 86400), h: Math.floor(s % 86400 / 3600), m: Math.floor(s % 3600 / 60), s: s % 60 };
    cd.forEach(function (el) { var n = v[el.dataset.cd]; el.textContent = (n < 10 && el.dataset.cd !== 'd' ? '0' : '') + n; });
  }
  if (cd.length && !isNaN(target)) { tick(); setInterval(tick, 1000); }
  var tip = $('tip'); if (tip && I.tip) tip.textContent = I.tip;

  /* ---------- swipeable cards ---------- */
  [].forEach.call(document.querySelectorAll('.carousel'), function (c) {
    var track = c.querySelector('.track'), dots = c.querySelector('.dots'); if (!track || !dots) return;
    var kids = [].slice.call(track.children);
    kids.forEach(function (k, i) { var d = document.createElement('i'); if (!i) d.className = 'on'; dots.appendChild(d); });
    track.addEventListener('scroll', function () {
      var mid = track.scrollLeft + track.clientWidth / 2, best = 0, dist = 1e9;
      kids.forEach(function (k, i) { var x = Math.abs(k.offsetLeft + k.offsetWidth / 2 - mid); if (x < dist) { dist = x; best = i; } });
      [].forEach.call(dots.children, function (d, i) { d.classList.toggle('on', i === best); });
    }, { passive: true });
  });

  /* ---------- venue: copy address ---------- */
  var copy = $('copy');
  if (copy) copy.addEventListener('click', function () {
    var o = $('copied'), a = I.addr || '';
    try { navigator.clipboard.writeText(a).then(function () { o.textContent = T.copied; }, function () { o.textContent = a; }); } catch (e) { o.textContent = a; }
  });

  /* ---------- replies on WhatsApp ---------- */
  var form = $('rsvp'), choice = 'yes';
  if (form) {
    [].forEach.call(form.querySelectorAll('button'), function (b) { b.addEventListener('click', function () { choice = b.dataset.a; }); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var g = $('r-name').value.trim(), n = g || T.dear_guest;
      if (I.wa) {
        var msg = fill(choice === 'yes' ? T.reply_yes : T.reply_no, { intro: g ? fill(T.reply_intro, { name: g }) : '', couple: I.couple });
        window.open('https://wa.me/' + I.wa + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
      }
      form.hidden = true;
      var t = $('thanks'); t.hidden = false; t.textContent = fill(choice === 'yes' ? T.thanks_yes : T.thanks_no, { name: n });
    });
  }
})();
