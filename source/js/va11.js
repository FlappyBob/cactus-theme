/* VA-11 Hall-A fan skin for the blog: header rain, CRT toggle, jukebox. */
(function () {
  'use strict';

  var root = document.documentElement;
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) {} }
  };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- CRT scanlines ---------- */
  function crtOn() { return !root.classList.contains('va11-crt-off'); }
  function syncCrtButtons() {
    var on = String(crtOn());
    document.querySelectorAll('[data-va11-crt]').forEach(function (b) { b.setAttribute('aria-pressed', on); });
  }
  document.querySelectorAll('[data-va11-crt]').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.preventDefault();
      var next = !crtOn();
      root.classList.toggle('va11-crt-off', !next);
      store.set('va11-crt', next ? 'on' : 'off');
      syncCrtButtons();
    });
  });
  syncCrtButtons();

  /* ---------- Rain behind the page header ---------- */
  function startRain() {
    var wrap = document.querySelector('.va11-rain');
    var canvas = wrap && wrap.querySelector('canvas');
    var ctx = canvas && canvas.getContext && canvas.getContext('2d');
    if (!ctx) return;

    var drops = [], w = 0, h = 0, raf = 0, last = 0, visible = true;

    function drop(anywhere) {
      return {
        x: Math.random() * (w + 60),
        y: anywhere ? Math.random() * h : -20 - Math.random() * 40,
        len: 8 + Math.random() * 14,
        speed: 220 + Math.random() * 180,
        alpha: 0.10 + Math.random() * 0.22,
        cyan: Math.random() < 0.35
      };
    }
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = wrap.clientWidth; h = wrap.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drops = [];
      for (var i = 0, n = Math.round(w / 14); i < n; i++) drops.push(drop(true));
    }
    function frame(t) {
      raf = 0;
      if (!visible || document.hidden) { last = 0; return; }
      var dt = last ? Math.min((t - last) / 1000, 0.05) : 0.016;
      last = t;
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      for (var i = 0; i < drops.length; i++) {
        var d = drops[i];
        d.y += d.speed * dt;
        d.x -= d.speed * dt * 0.12;
        if (d.y - d.len > h || d.x < -20) { drops[i] = drop(false); continue; }
        ctx.strokeStyle = d.cyan ? 'rgba(63,224,208,' + d.alpha + ')' : 'rgba(249,70,149,' + d.alpha + ')';
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.len * 0.12, d.y - d.len);
        ctx.stroke();
      }
      schedule();
    }
    function schedule() { if (!raf) raf = window.requestAnimationFrame(frame); }

    resize();
    var resizeTimer = 0;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) schedule();
      }).observe(wrap);
    }
    document.addEventListener('visibilitychange', function () { if (!document.hidden) schedule(); });
    schedule();
  }
  if (!reduceMotion) startRain();

  /* ---------- Jukebox (tracks hosted for /bar/, shared here) ---------- */
  var TRACKS = [
    { file: 'every-day-is-night', title: 'Every Day Is Night' },
    { file: 'dusk', title: 'Dusk' },
    { file: 'glitch-city', title: 'Glitch City' },
    { file: 'drive-me-wild', title: 'Drive Me Wild' },
    { file: 'your-love-is-a-drug', title: 'Your Love Is A Drug' }
  ];
  var KEY = 'va11-jukebox';

  var dock = document.getElementById('va11-dock');
  if (!dock) return;
  var panel = document.getElementById('va11-panel');
  var toggle = document.getElementById('va11-dock-toggle');
  var titleEl = document.getElementById('va11-track-title');
  var seek = document.getElementById('va11-seek');
  var playBtn = document.getElementById('va11-play');

  var state = { i: 0, t: 0, playing: false };
  try {
    var saved = JSON.parse(store.get(KEY) || '{}');
    if (typeof saved.i === 'number' && saved.i >= 0 && saved.i < TRACKS.length) state.i = saved.i;
    if (typeof saved.t === 'number' && saved.t > 0) state.t = saved.t;
    state.playing = saved.playing === true;
  } catch (e) {}

  var audio = new Audio();
  audio.preload = 'none';
  audio.volume = 0.7;
  var pendingSeek = 0, seeking = false, lastSave = 0, waitingForGesture = false;

  function save() {
    if (audio.src) state.t = audio.currentTime || state.t;
    store.set(KEY, JSON.stringify(state));
  }
  function render() {
    var playing = !audio.paused;
    titleEl.textContent = TRACKS[state.i].title;
    playBtn.setAttribute('aria-label', playing ? '暂停' : '播放');
    playBtn.innerHTML = playing
      ? '<i class="fa-solid fa-pause" aria-hidden="true"></i>'
      : '<i class="fa-solid fa-play" aria-hidden="true"></i>';
    dock.classList.toggle('is-playing', playing);
    dock.classList.toggle('is-waiting', waitingForGesture && !playing);
    toggle.title = waitingForGesture && !playing ? '点一下继续播放 ' + TRACKS[state.i].title : '点唱机';
  }
  function load(i, t) {
    state.i = (i + TRACKS.length) % TRACKS.length;
    state.t = t || 0;
    pendingSeek = state.t;
    audio.src = '/bar/audio/' + TRACKS[state.i].file + '.mp3';
    seek.value = 0;
    render();
  }
  function play() {
    if (!audio.src) load(state.i, state.t);
    var p = audio.play();
    if (p && p.then) {
      p.then(function () {
        waitingForGesture = false; state.playing = true; save(); render();
      }).catch(function () {
        waitingForGesture = true; render();
      });
    }
  }
  function pause() {
    audio.pause();
    waitingForGesture = false; state.playing = false; save(); render();
  }
  function skip(step) {
    var wasPlaying = !audio.paused || state.playing;
    load(state.i + step, 0);
    if (wasPlaying) play(); else save();
  }

  audio.addEventListener('loadedmetadata', function () {
    if (pendingSeek && pendingSeek < audio.duration) { try { audio.currentTime = pendingSeek; } catch (e) {} }
    pendingSeek = 0;
  });
  audio.addEventListener('timeupdate', function () {
    if (!seeking && audio.duration) seek.value = Math.round(audio.currentTime / audio.duration * 1000);
    var now = Date.now();
    if (now - lastSave > 1000) { lastSave = now; save(); }
  });
  audio.addEventListener('play', render);
  audio.addEventListener('pause', render);
  audio.addEventListener('ended', function () { load(state.i + 1, 0); play(); });

  seek.addEventListener('input', function () { seeking = true; });
  seek.addEventListener('change', function () {
    seeking = false;
    if (!audio.src) load(state.i, 0);
    if (audio.duration) audio.currentTime = seek.value / 1000 * audio.duration;
    else pendingSeek = 0;
    save();
  });
  playBtn.addEventListener('click', function () { if (audio.paused) play(); else pause(); });
  document.getElementById('va11-prev').addEventListener('click', function () { skip(-1); });
  document.getElementById('va11-next').addEventListener('click', function () { skip(1); });

  function setOpen(open) {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    dock.classList.toggle('is-open', open);
  }
  toggle.addEventListener('click', function () {
    if (waitingForGesture && audio.paused) { play(); return; }
    setOpen(panel.hidden);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.hidden) { setOpen(false); toggle.focus(); }
  });
  window.addEventListener('pagehide', save);

  // Resume where the previous page left off. Browsers may block audio until the
  // reader interacts with this page; in that case the first click or key resumes it.
  load(state.i, state.t);
  if (state.playing) {
    play();
    var resumeOnGesture = function (e) {
      if (!waitingForGesture || !audio.paused) return cleanup();
      if (e && e.target && e.target.closest && e.target.closest('#va11-dock')) return cleanup();
      play();
      cleanup();
    };
    var cleanup = function () {
      document.removeEventListener('pointerdown', resumeOnGesture, true);
      document.removeEventListener('keydown', resumeOnGesture, true);
    };
    document.addEventListener('pointerdown', resumeOnGesture, true);
    document.addEventListener('keydown', resumeOnGesture, true);
  }
})();
