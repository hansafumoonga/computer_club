/* core.js - shared audio, particles, loop, overlay UI, key state.
   Everything lives on the global CC object (plain scripts, so it works from file://). */
(function () {
'use strict';
const CC = window.CC = { modes: {}, app: { session: null, mode: null }, held: {} };

/* ---------- Makey Makey 5-key map (KeyboardEvent.code) ---------- */
CC.APP_NAME = 'Tech Explorers';   // the club name: shown on the landing page, the certificate and the page title
CC.MAKEY_KEYS = ['ArrowLeft', 'ArrowUp', 'ArrowDown', 'ArrowRight', 'Space'];
CC.KEY_MAP = { ArrowLeft: 'C', ArrowUp: 'D', ArrowDown: 'E', ArrowRight: 'F', Space: 'G' };
CC.KEY_LABEL = { ArrowLeft: '←', ArrowUp: '↑', ArrowDown: '↓', ArrowRight: '→', Space: 'Space' };
CC.NOTES = ['C', 'D', 'E', 'F', 'G'];
CC.NOTE_FREQS = { C: 261.63, D: 293.66, E: 329.63, F: 349.23, G: 392.00 };
CC.NOTE_COLORS = { C: '#ff5c72', D: '#ff9f45', E: '#ffd23f', F: '#6bcb77', G: '#22c6c6' };
CC.NOTE_KEY = { C: 'ArrowLeft', D: 'ArrowUp', E: 'ArrowDown', F: 'ArrowRight', G: 'Space' };

/* ---------- Audio: one shared AudioContext, all synthesized ---------- */
const A = CC.audio = { ctx: null, master: null, recDest: null, noiseBuf: null };

A.init = function () {
  if (!A.ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    A.ctx = new AC();
    A.master = A.ctx.createGain();
    A.master.gain.value = 0.8;
    A.master.connect(A.ctx.destination);
    const len = A.ctx.sampleRate;
    A.noiseBuf = A.ctx.createBuffer(1, len, A.ctx.sampleRate);
    const d = A.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  if (A.ctx.state === 'suspended') A.ctx.resume();
};
/* Output used by recording: a MediaStreamDestination fed from the master gain (never the microphone). */
A.getRecordDest = function () {
  A.init();
  if (!A.recDest) { A.recDest = A.ctx.createMediaStreamDestination(); A.master.connect(A.recDest); }
  return A.recDest;
};

/* tone: o = {dur, type, vol, slideTo, delay, attack, release} */
A.tone = function (freq, o) {
  if (!A.ctx) return;
  o = o || {};
  const t0 = A.ctx.currentTime + (o.delay || 0), dur = o.dur || 0.25, vol = o.vol == null ? 0.2 : o.vol;
  const osc = A.ctx.createOscillator(), g = A.ctx.createGain();
  osc.type = o.type || 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + (o.attack || 0.01));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g); g.connect(A._out || A.master);
  osc.start(t0); osc.stop(t0 + dur + 0.05);
};
/* noise burst through a filter: o = {dur, type, freq, q, vol, delay} */
A.noise = function (o) {
  if (!A.ctx) return;
  const t0 = A.ctx.currentTime + (o.delay || 0), dur = o.dur || 0.1;
  const src = A.ctx.createBufferSource(); src.buffer = A.noiseBuf;
  const f = A.ctx.createBiquadFilter(); f.type = o.type || 'bandpass';
  f.frequency.value = o.freq || 1500; f.Q.value = o.q || 1;
  const g = A.ctx.createGain();
  g.gain.setValueAtTime(o.vol == null ? 0.2 : o.vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f); f.connect(g); g.connect(A._out || A.master);
  src.start(t0, Math.random() * 0.5); src.stop(t0 + dur + 0.05);
};

/* piano-ish note (fundamental + octave shimmer) */
CC.freqOf = function (n) { const semi = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }, oct = n.length > 1 ? +n.slice(1) : 4; return 440 * Math.pow(2, (12 * (oct + 1) + semi[n[0]] - 69) / 12); };
A.pianoNote = function (note, o) {
  o = o || {};
  const f = CC.NOTE_FREQS[note] || CC.freqOf(note), dur = o.dur || 0.7, vol = o.vol == null ? 0.28 : o.vol;
  A.tone(f, { type: 'triangle', dur: dur, vol: vol, delay: o.delay });
  A.tone(f * 2, { type: 'sine', dur: dur * 0.6, vol: vol * 0.35, delay: o.delay });
};

/* real synthesized drum kit (noise buffers + sine sweeps). t = seconds from now */
A.kick = function (t, vol) {
  if (!A.ctx) return; vol = vol || 0.6;
  const t0 = A.ctx.currentTime + (t || 0);
  const osc = A.ctx.createOscillator(), g = A.ctx.createGain();
  osc.frequency.setValueAtTime(150, t0); osc.frequency.exponentialRampToValueAtTime(42, t0 + 0.14);
  g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.25);
  osc.connect(g); g.connect(A._out || A.master); osc.start(t0); osc.stop(t0 + 0.3);
};
A.snare = function (t, vol) {
  vol = vol || 0.35;
  A.noise({ delay: t, dur: 0.16, type: 'bandpass', freq: 1800, q: 0.8, vol: vol });
  A.tone(190, { delay: t, dur: 0.1, type: 'triangle', vol: vol * 0.5, slideTo: 120 });
};
A.hat = function (t, vol) { A.noise({ delay: t, dur: 0.05, type: 'highpass', freq: 7000, q: 0.5, vol: vol || 0.12 }); };
A.bell = function (t, vol) {
  vol = vol || 0.07;
  [2200, 2800, 3300].forEach(function (f, i) { A.tone(f + i * 17, { delay: t, dur: 0.35, vol: vol, type: 'sine' }); });
};

/* ---------- named sound effects (soft and warm) ---------- */
const S = CC.sfx = {};
S.jump = function () { A.tone(330, { dur: 0.16, type: 'triangle', slideTo: 660, vol: 0.2 }); };
S.duck = function () { A.tone(300, { dur: 0.13, type: 'triangle', slideTo: 170, vol: 0.18 }); };
S.bump = function () { A.tone(210, { dur: 0.25, type: 'sine', slideTo: 130, vol: 0.25 }); A.noise({ dur: .08, freq: 400, vol: .08 }); };
S.lifeLost = function () { S.bump(); A.tone(392, { delay: .1, dur: .2, vol: .12 }); A.tone(330, { delay: .25, dur: .3, vol: .12 }); };
S.shoot = function (kind) {
  if (kind === 'rapid') A.tone(1000, { dur: .06, type: 'triangle', slideTo: 700, vol: .1 });
  else if (kind === 'spread') { A.tone(700, { dur: .12, type: 'sine', slideTo: 400, vol: .1 }); A.tone(900, { dur: .1, type: 'sine', slideTo: 520, vol: .07 }); }
  else if (kind === 'big') { A.tone(260, { dur: .28, type: 'sine', slideTo: 90, vol: .22 }); A.noise({ dur: .12, freq: 500, vol: .07 }); }
  else A.tone(880, { dur: .1, type: 'sine', slideTo: 480, vol: .13 });
};
S.pop = function () { A.noise({ dur: .12, freq: 1200, q: 1.2, vol: .14 }); A.tone(520, { dur: .12, type: 'sine', slideTo: 900, vol: .14 }); };
S.clink = function () { A.tone(900, { dur: .06, type: 'triangle', vol: .08 }); };
S.pickup = function () { A.tone(660, { dur: .12, vol: .16 }); A.tone(990, { delay: .09, dur: .18, vol: .16 }); A.tone(1320, { delay: .18, dur: .25, vol: .12 }); };
S.slice = function () { A.noise({ dur: .14, type: 'highpass', freq: 3000, vol: .13 }); A.tone(700, { dur: .18, type: 'triangle', slideTo: 1200, vol: .2 }); A.tone(1050, { delay: .08, dur: .18, vol: .12 }); };
S.softMiss = function () { A.tone(330, { dur: .3, vol: .12 }); A.tone(262, { delay: .15, dur: .35, vol: .1 }); };
S.step = function () { A.noise({ dur: .04, type: 'lowpass', freq: 500, vol: .07 }); };
S.good = function () { A.tone(660, { dur: .15, vol: .15 }); A.tone(880, { delay: .1, dur: .2, vol: .15 }); };
S.tick = function () { A.tone(500, { dur: .05, vol: .06 }); };
S.warn = function () { A.tone(440, { dur: .25, type: 'sine', slideTo: 520, vol: .08 }); };
S.levelComplete = function () {
  [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach(function (f, i) {
    A.tone(f, { delay: i * 0.13, dur: 0.35, type: 'triangle', vol: .2 });
    A.tone(f * 2, { delay: i * 0.13, dur: 0.2, vol: .05 });
  });
  A.tone(1046.5, { delay: .7, dur: .8, type: 'triangle', vol: .12 });
};
S.letsGo = function () { A.tone(392, { dur: .15, vol: .14 }); A.tone(523, { delay: .12, dur: .25, vol: .14 }); };

/* ---------- Particles (harmless puffs / juice splashes) ---------- */
CC.Particles = function () { this.list = []; };
CC.Particles.prototype.burst = function (x, y, color, n, o) {
  o = o || {};
  for (let i = 0; i < (n || 12); i++) {
    const a = Math.random() * Math.PI * 2, sp = (o.speed || 160) * (0.35 + Math.random() * 0.8);
    this.list.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.up || 0), life: 0, max: (o.life || 0.6) * (0.7 + Math.random() * 0.6),
      size: (o.size || 6) * (0.6 + Math.random() * 0.8), color: Array.isArray(color) ? color[i % color.length] : color, grav: o.grav == null ? 300 : o.grav, star: !!o.star });
  }
};
CC.Particles.prototype.update = function (dt) {
  for (let i = this.list.length - 1; i >= 0; i--) {
    const p = this.list[i]; p.life += dt; p.vy += p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.life >= p.max) this.list.splice(i, 1);
  }
};
CC.Particles.prototype.draw = function (ctx) {
  for (const p of this.list) {
    const k = 1 - p.life / p.max;
    ctx.globalAlpha = Math.max(0, k); ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.5, p.size * (0.4 + k * 0.6)), 0, 6.283); ctx.fill();
  }
  ctx.globalAlpha = 1;
};
CC.Particles.prototype.clear = function () { this.list.length = 0; };

/* ---------- Game loop helper (dt clamped; pauses with the tab) ---------- */
CC.createLoop = function (update, draw) {
  let raf = 0, last = 0, running = false;
  function frame(ts) {
    if (!running) return;
    const dt = Math.min(0.05, Math.max(0, (ts - last) / 1000)); last = ts;
    if (!CC.paused) update(dt);          // paused: the picture stays, nothing moves
    draw();
    raf = requestAnimationFrame(frame);
  }
  return {
    start: function () { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); },
    stop: function () { running = false; cancelAnimationFrame(raf); }
  };
};

/* ---------- Stage helper: --u scales overlay text with the stage width ---------- */
CC.watchStage = function (stage) {
  function set() { stage.style.setProperty('--u', (stage.clientWidth / 100) + 'px'); }
  set();
  if (window.ResizeObserver) new ResizeObserver(set).observe(stage);
  window.addEventListener('resize', set);
};

/* ---------- Overlays: the shared level-complete / try-again / intro screens (icons first, very few words) ---------- */
const UI = CC.ui = { active: null };
const KEYHINT = { Space: 'Space', Enter: 'Enter', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→' };

/* opts = {emoji, title, text, stars:n, controls:[{keys:[..], icon}], buttons:[{icon, label, keys:[codes], primary, fn}], levels:{count,current,onPick}} */
UI.show = function (stage, opts) {
  UI.close();
  const root = stage.querySelector('.overlay-root');
  const el = document.createElement('div'); el.className = 'overlay';
  let h = '';
  if (opts.emoji) h += '<div class="o-emoji">' + opts.emoji + '</div>';
  if (opts.stars) h += '<div class="stars">' + [1, 2, 3].map(function (i) { return '<span class="' + (i <= opts.stars ? '' : 'dim') + '">⭐</span>'; }).join('') + '</div>';
  h += '<div class="o-title"></div>';
  if (opts.text) h += '<div class="o-text"></div>';
  if (opts.controls) h += '<div class="o-controls">' + opts.controls.map(function (c) { return '<span class="cg">' + c.keys.map(function (k) { return '<b class="kc">' + k + '</b>'; }).join('') + '<i>' + c.icon + '</i></span>'; }).join('') + '</div>';
  h += '<div class="o-btns"></div>';
  if (opts.levels) h += '<div class="o-levels"></div>';
  el.innerHTML = h;
  el.querySelector('.o-title').textContent = opts.title || '';
  if (opts.text) el.querySelector('.o-text').textContent = opts.text;
  const bx = el.querySelector('.o-btns');
  const ov = { el: el, keys: {}, at: performance.now(), stage: stage, onKey: opts.onKey };
  (opts.buttons || []).forEach(function (b) {
    const btn = document.createElement('button');
    btn.className = 'btn big' + (b.primary ? ' primary' : '');
    btn.innerHTML = '<span class="bi">' + (b.icon || '') + '</span>' + (b.label ? '<span class="bl">' + b.label + '</span>' : '');
    btn.setAttribute('aria-label', b.label || '');
    btn.addEventListener('click', function () { btn.blur(); UI.fire(ov, b.fn); });
    bx.appendChild(btn);
    (b.keys || []).forEach(function (k) { ov.keys[k] = b.fn; });
  });
  if (opts.levels) {
    const lv = el.querySelector('.o-levels');
    for (let i = 1; i <= opts.levels.count; i++) {
      const b = document.createElement('button'); b.textContent = i;
      if (i === opts.levels.current) b.className = 'cur';
      b.addEventListener('click', function () { b.blur(); opts.levels.onPick(i); });
      lv.appendChild(b);
    }
  }
  root.appendChild(el); UI.fit(el);
  UI.active = ov; if (CC.music) CC.music.duck(true);
  return ov;
};
/* if the picture, title and buttons are taller than the stage (small windows, phones), shrink them together until everything fits */
UI.fit = function (el) {
  el = el || (UI.active && UI.active.el); if (!el) return;
  el.style.removeProperty('--u');
  let u = parseFloat(getComputedStyle(el).getPropertyValue('--u')) || 8;
  for (let i = 0; i < 5 && el.clientHeight > 0 && el.scrollHeight > el.clientHeight + 1; i++) { u *= Math.max(0.5, (el.clientHeight - 2) / el.scrollHeight); el.style.setProperty('--u', u.toFixed(2) + 'px'); }
};
window.addEventListener('resize', function () { UI.fit(); });
/* ---------- Pause (every game except the free-play piano) ---------- */
CC.paused = false;
CC.pausable = { jump: 1, blaster: 1, commando: 1, pattern: 1, fruit: 1, words: 1, typing: 1, builder: 1 };
function syncPauseBtn() { document.querySelectorAll('.pause-btn').forEach(function (b) { b.textContent = CC.paused ? '▶' : '⏸'; b.classList.toggle('on', CC.paused); }); }
CC.resume = function () { if (!CC.paused) return; CC.paused = false; if (CC.audio.ctx) CC.audio.ctx.resume(); UI.close(); syncPauseBtn(); };
CC.togglePause = function (mode) {
  mode = mode || CC.app.mode;
  if (CC.paused) { CC.resume(); return false; }
  if (!CC.pausable[mode] || UI.active) return false;               // an intro / level-complete screen is already showing
  const m = CC.modes[mode], g = m && m.game ? m.game() : null;
  if (g && g.state !== 'play') return false;
  CC.paused = true; CC.held = {}; if (CC.audio.ctx) CC.audio.ctx.suspend();
  UI.show(document.getElementById('stage-' + mode), { emoji: '⏸️', title: 'Paused', buttons: [
    { icon: '▶', label: 'Play', primary: true, keys: ['Enter', 'Space', 'Escape'], fn: function () { CC.paused = false; if (CC.audio.ctx) CC.audio.ctx.resume(); syncPauseBtn(); } },
    { icon: '🏠', label: 'Menu', fn: function () { CC.paused = false; if (CC.audio.ctx) CC.audio.ctx.resume(); syncPauseBtn(); CC.goMenu(); } }] });
  syncPauseBtn(); return true;
};
UI.fire = function (ov, fn) { if (UI.active === ov) { UI.close(); } fn && fn(); };
UI.close = function () {
  if (UI.active) { if (UI.active.el.parentNode) UI.active.el.parentNode.removeChild(UI.active.el); UI.active = null; if (CC.music) CC.music.duck(false); }
};
/* keyboard routing for overlays: returns true if the key was consumed.
   A short delay stops a key that was still being held from instantly pressing a button. */
UI.handleKey = function (e) {
  const ov = UI.active; if (!ov) return false;
  if (CC.MAKEY_KEYS.indexOf(e.code) >= 0 || e.code === 'Enter') e.preventDefault();
  if (e.repeat || performance.now() - ov.at < 450) return true;
  if (ov.onKey && ov.onKey(e.code)) return true;       // extra keys that do not close the screen (e.g. choosing a level)
  const fn = ov.keys[e.code];
  if (fn) UI.fire(ov, fn);
  return true;
};

/* Shared "Level Complete!" moment (Jump Over!, Star Blaster, Commando Run all use this) */
UI.levelComplete = function (stage, o) {
  CC.sfx.levelComplete();
  const last = o.level >= o.total;
  const buttons = [];
  if (last) buttons.push({ icon: '🔁', label: 'Again', keys: ['Space', 'Enter'], primary: true, fn: o.onRestartAll });
  else buttons.push({ icon: '▶', label: 'Next', keys: ['Space', 'Enter'], primary: true, fn: o.onNext });
  buttons.push({ icon: '↻', label: 'Replay', keys: ['ArrowUp'], fn: o.onReplay });
  buttons.push({ icon: '🏠', label: 'Menu', fn: o.onMenu });
  return UI.show(stage, { emoji: last ? '🏆' : '🎉', stars: o.stars || 3, title: last ? 'You did it all!' : 'Level ' + o.level + ' done!', buttons: buttons });
};
/* Gentle "try again" screen: one key / click and you're straight back in */
UI.tryAgain = function (stage, o) {
  CC.sfx.letsGo();
  return UI.show(stage, { emoji: '🌈', title: 'Nice try!', text: o.text || '',
    buttons: [{ icon: '▶', label: 'Again', keys: ['Space', 'Enter'], primary: true, fn: o.onRetry }, { icon: '🏠', label: 'Menu', fn: o.onMenu }] });
};
/* Level intro: big picture, the keys as pictures, big Play button, small level picker */
UI.intro = function (stage, o) {
  return UI.show(stage, { emoji: o.emoji || '⭐', title: o.title, text: o.text || '', controls: o.controls,
    buttons: [{ icon: '▶', label: 'Play', keys: ['Space', 'Enter'], primary: true, fn: o.onStart }, { icon: '🏠', label: 'Menu', fn: o.onMenu }],
    levels: o.levels });
};

/* ---------- Shared scaffold for the level-based action games ----------
   cfg = {stageId, title, emoji, total, controls, levelIcon(lv), reset(g, levelIndex, fromCheckpoint), update(g, dt), draw(g), idle(g, dt)}
   The game calls g.complete() when the level is won and g.over() when out of hearts.
   g.state: 'intro' | 'play' | 'done' | 'over' */
CC.makeLevelGame = function (cfg) {
  let built = false, g = null, loop = null;
  function build() {
    if (built) return; built = true;
    const stage = document.getElementById(cfg.stageId), canvas = stage.querySelector('canvas');
    CC.watchStage(stage);
    g = { stage: stage, canvas: canvas, ctx: canvas.getContext('2d'), W: canvas.width, H: canvas.height, level: 0, state: 'intro', t: 0, banner: 0, stars: 3,
      particles: new CC.Particles(), pending: null };
    loop = CC.createLoop(function (dt) {
      g.t += dt; g.particles.update(dt); if (g.banner > 0) g.banner -= dt;
      if (g.state === 'play') cfg.update(g, dt); else if (cfg.idle) cfg.idle(g, dt);
    }, function () { cfg.draw(g); if (g.banner > 0) drawBanner(); });
    function drawBanner() {
      const c = g.ctx, a = Math.min(1, g.banner, (2 - g.banner) * 3 + 0.2), ic = cfg.levelIcon ? cfg.levelIcon(g.level) : cfg.emoji;
      c.save(); c.globalAlpha = Math.max(0, Math.min(1, a)); c.textAlign = 'center'; c.font = 'bold 54px "Trebuchet MS",sans-serif';
      const txt = ic + '  ' + (g.level + 1);
      c.lineWidth = 8; c.strokeStyle = '#1a1b3f'; c.lineJoin = 'round'; c.strokeText(txt, g.W / 2, 150); c.fillStyle = '#ffd23f'; c.fillText(txt, g.W / 2, 150);
      c.restore();
    }
    g.start = function () { UI.close(); g.state = 'play'; g.banner = 2; };
    g.goto = function (lv, immediate, fromCp) {
      clearTimeout(g.pending); UI.close(); g.level = lv; g.particles.clear(); g.stars = 3; cfg.reset(g, lv, !!fromCp);
      if (immediate) g.start(); else {
        g.state = 'intro';
        UI.intro(g.stage, { emoji: cfg.levelIcon ? cfg.levelIcon(lv) : cfg.emoji, title: cfg.title + ' ' + (lv + 1), controls: cfg.controls,
          onStart: g.start, onMenu: function () { CC.goMenu(); },
          levels: { count: cfg.total, current: lv + 1, onPick: function (i) { g.goto(i - 1, false); } } });
      }
    };
    g.complete = function () {
      if (g.state !== 'play') return; g.state = 'done'; const lv = g.level;
      g.pending = setTimeout(function () {
        UI.levelComplete(g.stage, { level: lv + 1, total: cfg.total, stars: g.stars,
          onNext: function () { g.goto(lv + 1, true); }, onReplay: function () { g.goto(lv, true); },
          onRestartAll: function () { g.goto(0, true); }, onMenu: function () { CC.goMenu(); } });
      }, 800);
    };
    g.over = function () {
      if (g.state !== 'play') return; g.state = 'over'; const lv = g.level;
      g.pending = setTimeout(function () {
        UI.tryAgain(g.stage, { onRetry: function () { g.goto(lv, true, true); }, onMenu: function () { CC.goMenu(); } });
      }, 700);
    };
  }
  return {
    enter: function () { CC.audio.init(); build(); loop.start(); g.goto(0, false); },
    exit: function () { if (!built) return; clearTimeout(g.pending); loop.stop(); UI.close(); g.state = 'intro'; },
    onKeyDown: function (e) { cfg.onKeyDown && cfg.onKeyDown(g, e); },
    onKeyUp: function (e) { cfg.onKeyUp && cfg.onKeyUp(g, e); },
    game: function () { return g; },
    /* test hook: run the game faster than real time (used by the automated checks) */
    _sim: function (secs, bot) { const n = Math.round(secs * 60); let i = 0; for (; i < n; i++) { if (g.state !== 'play') break; if (bot) bot(g); g.t += 1 / 60; g.particles.update(1 / 60); if (g.banner > 0) g.banner -= 1 / 60; cfg.update(g, 1 / 60); } return i / 60; },
    makey: !!cfg.makey
  };
};

/* little key-caps along the bottom of a game: they light up while you press them (helps learn the keys / see the Makey Makey pads) */
CC.drawKeys = function (c, W, H, codes) {
  const w = 42, gap = 6, label = { ArrowLeft: '←', ArrowUp: '↑', ArrowDown: '↓', ArrowRight: '→', Space: 'Space' };
  const widths = codes.map(function (k) { return k === 'Space' ? 78 : w; });
  let tot = -gap; widths.forEach(function (x) { tot += x + gap; });
  let x = W / 2 - tot / 2; const y = H - 40;
  c.save(); c.textAlign = 'center'; c.font = 'bold 18px "Trebuchet MS",sans-serif';
  codes.forEach(function (k, i) {
    const on = !!CC.held[k], col = CC.NOTE_COLORS[CC.KEY_MAP[k]], ww = widths[i], dy = on ? 3 : 0;
    c.globalAlpha = on ? 1 : 0.62; c.fillStyle = on ? col : 'rgba(26,27,63,.7)'; c.strokeStyle = on ? '#fff' : col; c.lineWidth = 3;
    c.beginPath(); if (c.roundRect) c.roundRect(x, y + dy, ww, 30, 8); else c.rect(x, y + dy, ww, 30); c.fill(); c.stroke();
    c.fillStyle = on ? '#1a1b3f' : '#fff'; c.fillText(label[k], x + ww / 2, y + 22 + dy); x += ww + gap;
  });
  c.restore();
};
/* ---------- small shared helpers ---------- */
/* text with a dark outline so it reads on any background (used in canvas HUDs) */
CC.outlineText = function (ctx, txt, x, y, size, color, align) {
  ctx.save(); ctx.font = 'bold ' + size + 'px "Trebuchet MS",sans-serif'; ctx.textAlign = align || 'left'; ctx.textBaseline = 'alphabetic';
  ctx.lineWidth = size / 5; ctx.lineJoin = 'round'; ctx.strokeStyle = '#1a1b3f'; ctx.strokeText(txt, x, y); ctx.fillStyle = color || '#fff'; ctx.fillText(txt, x, y); ctx.restore();
};
CC.rand = function (a, b) { return a + Math.random() * (b - a); };
CC.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
CC.overlap = function (a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; };
/* box shrunk by pad on every side - used for forgiving hitboxes */
CC.shrink = function (x, y, w, h, pad) { return { x: x + pad, y: y + pad, w: Math.max(2, w - pad * 2), h: Math.max(2, h - pad * 2) }; };
})();
