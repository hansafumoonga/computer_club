/* fruit.js - Slice & Pop (Session 1). Press the letter on a falling fruit, balloon or bug to slice / pop / squash it.
   10 levels you can pick from: Level 1 is super slow with just a few letters, then everything gets quicker and the letters spread over the keyboard.
   A gentle practice game: no lives, no game over, no timer - a missed one just fades away. */
(function () {
'use strict';

/* =============== TEACHER SETTINGS - easy numbers to nudge =============== */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', DIGITS = '1234567890';
/* One line per level.  theme = fruit | balloon | bug | mix (a bit of everything)
   letters = which keys can appear,   fall = SECONDS for one to fall all the way down (BIGGER = SLOWER),
   every = seconds between new ones,  max = most on screen at once,   goal = how many to get to finish the level. */
const SLICE_LEVELS = [
  { theme: 'fruit',   letters: 'FJDK',                       fall: 34, every: 7.0, max: 2, goal: 8 },     // 1: super slow, just 4 letters
  { theme: 'fruit',   letters: 'ASDFJKL',                    fall: 28, every: 6.0, max: 2, goal: 10 },
  { theme: 'balloon', letters: 'ASDFGHJKL',                  fall: 24, every: 5.0, max: 3, goal: 12 },
  { theme: 'fruit',   letters: 'QWERUIOP',                   fall: 20, every: 4.5, max: 3, goal: 14 },
  { theme: 'bug',     letters: 'ASDFGHJKLQWERTYUIOP',        fall: 17, every: 4.0, max: 4, goal: 16 },
  { theme: 'balloon', letters: 'ZXCVBNM',                    fall: 14, every: 3.5, max: 4, goal: 18 },
  { theme: 'fruit',   letters: ALPHABET,                     fall: 12, every: 3.0, max: 5, goal: 20 },
  { theme: 'bug',     letters: ALPHABET,                     fall: 10, every: 2.6, max: 5, goal: 22 },
  { theme: 'mix',     letters: ALPHABET + DIGITS,            fall: 8.5, every: 2.2, max: 6, goal: 25 },
  { theme: 'mix',     letters: ALPHABET + DIGITS,            fall: 7.0, every: 1.8, max: 7, goal: 30 }   // 10: fast and everywhere
];
const GOLDEN_CHANCE = 0.12;             // chance a new one is golden (popping it clears everything on screen!). 0 = never
/* ======================================================================= */

const SP = CC.sprites, A = CC.audio, W = 800, H = 450, ROWS = ['1234567890', 'QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
const ICON = { fruit: '🍉', balloon: '🎈', bug: '🐞', mix: '🎉' };
const CONFETTI = ['#ff5c72', '#ff9f45', '#ffd23f', '#6bcb77', '#22c6c6', '#a77bff', '#ff9ae0'];
let stage, ctx, loop, built = false, t = 0, particles, items, halves, spawnIn, popped, missed, bubble, bubbleT, lvIdx = 0, state = 'choose', streak, spawned, hintT, kbdCells = {}, lastKind = '', chooserSel = 0;
const best = {};                         // stars earned this visit (nothing is saved)

function build() {
  if (built) return; built = true;
  stage = document.getElementById('stage-fruit'); ctx = stage.querySelector('canvas').getContext('2d');
  CC.watchStage(stage); particles = new CC.Particles(); loop = CC.createLoop(update, draw);
  const kb = document.getElementById('fruit-kbd');
  ROWS.forEach(function (row) { const r = document.createElement('div'); r.className = 'kr'; row.split('').forEach(function (ch) { const k = document.createElement('div'); k.className = 'kc'; k.textContent = ch; r.appendChild(k); kbdCells[ch] = k; }); kb.appendChild(r); });
  document.getElementById('fruit-levels').addEventListener('click', function () { this.blur(); CC.audio.init(); chooser(); });
}

/* ---------------- level chooser ---------------- */
function chooser() {
  state = 'choose'; CC.ui.close();
  const ov = CC.ui.show(stage, {
    emoji: '🎯', title: 'Pick a level',
    buttons: [{ icon: '▶', label: 'Play', keys: ['Space', 'Enter'], primary: true, fn: function () { startLevel(chooserSel); } }, { icon: '🏠', label: 'Menu', fn: function () { CC.goMenu(); } }],
    onKey: function (code) {
      const mv = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -5, ArrowDown: 5 }[code]; if (mv === undefined) return false;
      chooserSel = CC.clamp(chooserSel + mv, 0, SLICE_LEVELS.length - 1); markSel(ov.el); CC.sfx.tick(); return true;
    }
  });
  const grid = document.createElement('div'); grid.className = 'lvl-grid';
  SLICE_LEVELS.forEach(function (lv, i) {
    const b = document.createElement('button'); b.className = 'lvl-btn'; b.dataset.i = i;
    const sp = best[i] ? '⭐'.repeat(best[i]) : '·';
    b.innerHTML = '<span class="li">' + ICON[lv.theme] + '</span><span class="ln">' + (i + 1) + '</span><span class="ls">' + sp + '</span>';
    b.addEventListener('click', function () { b.blur(); CC.audio.init(); startLevel(i); });
    grid.appendChild(b);
  });
  ov.el.insertBefore(grid, ov.el.querySelector('.o-btns')); markSel(ov.el);
}
function markSel(el) { el.querySelectorAll('.lvl-btn').forEach(function (b) { b.classList.toggle('cur', +b.dataset.i === chooserSel); }); }

/* ---------------- playing ---------------- */
function startLevel(i) {
  CC.ui.close(); lvIdx = i; chooserSel = i; items = []; halves = []; particles.clear(); popped = 0; missed = 0; streak = 0; spawned = 0; spawnIn = 0.4; bubbleT = 0; hintT = 0; state = 'play'; highlight();
  CC.sfx.letsGo();
}
function radius(theme) { return theme === 'balloon' ? 40 : theme === 'bug' ? 38 : 44; }
function spawn() {
  const lv = SLICE_LEVELS[lvIdx], used = items.map(function (f) { return f.ch; });
  const pool = lv.letters.split('').filter(function (ch) { return used.indexOf(ch) < 0; });
  if (!pool.length) return;
  const ch = pool[Math.floor(Math.random() * pool.length)];
  const theme = lv.theme === 'mix' ? ['fruit', 'balloon', 'bug'][Math.floor(Math.random() * 3)] : lv.theme, r = radius(theme);
  let kind; if (theme === 'fruit') { do { kind = SP.FRUIT_KINDS[Math.floor(Math.random() * SP.FRUIT_KINDS.length)]; } while (kind === lastKind); lastKind = kind; } else kind = Math.floor(Math.random() * 7);
  let x, tries = 0;
  do { x = CC.rand(r + 30, W - r - 30); tries++; } while (tries < 12 && items.some(function (f) { return Math.abs(f.bx - x) < r * 2.6 && f.y < 220; }));
  const golden = lvIdx >= 1 && spawned > 2 && Math.random() < GOLDEN_CHANCE && !items.some(function (f) { return f.golden; });
  items.push({ ch: ch, theme: theme, kind: kind, r: r, bx: x, x: x, y: -r - 14, ph: Math.random() * 6, fade: 1, missed: false, golden: golden, rot: Math.random() * 0.4 - 0.2 }); spawned++;
}
function say(txt) { bubble = txt; bubbleT = 2.4; }
function highlight() {
  Object.keys(kbdCells).forEach(function (k) { kbdCells[k].classList.remove('hl'); });
  const live = (items || []).filter(function (f) { return !f.missed; }).sort(function (a, b) { return b.y - a.y; });
  if (live[0] && kbdCells[live[0].ch]) kbdCells[live[0].ch].classList.add('hl');
}
function popFx(f) {                       // the fun part: every kind pops in its own way
  if (f.theme === 'fruit') {
    const j = SP.FRUIT_JUICE[f.kind];
    particles.burst(f.x, f.y, j.concat(['#ffffff']), 26, { speed: 240, size: 7, life: .8, grav: 420 });
    [-1, 1].forEach(function (s) { halves.push({ kind: f.kind, x: f.x, y: f.y, r: f.r, s: s, vx: s * 90, vy: -60, rot: 0, vr: s * 2.2, life: 0 }); }); CC.sfx.slice();
  } else if (f.theme === 'balloon') {
    particles.burst(f.x, f.y, CONFETTI, 30, { speed: 280, size: 6, life: 1.0, grav: 260 });
    particles.burst(f.x, f.y, ['#ffffff', SP.BALLOON_COLORS[f.kind][0]], 10, { speed: 170, size: 9, life: 0.4, grav: 0 });
    A.noise({ dur: 0.09, type: 'highpass', freq: 2500, vol: 0.2 }); A.tone(900, { dur: 0.1, type: 'triangle', slideTo: 260, vol: 0.18 }); A.tone(1400, { delay: 0.05, dur: 0.12, vol: 0.1 });
  } else {
    particles.burst(f.x, f.y, ['#ffd23f', '#ffffff', '#ff9aa8', '#8affea'], 22, { speed: 230, size: 6, life: 0.7, grav: 120 });
    A.tone(320, { dur: 0.14, type: 'triangle', slideTo: 120, vol: 0.2 }); A.noise({ dur: 0.07, type: 'lowpass', freq: 700, vol: 0.14 }); A.tone(800, { delay: 0.1, dur: 0.14, vol: 0.12 });
  }
}
function pop(f, fromGolden) {
  popFx(f); items.splice(items.indexOf(f), 1); popped++; if (!fromGolden) streak++;
  if (f.golden && !fromGolden) {          // golden one: everything on screen pops with it!
    particles.burst(f.x, f.y, ['#ffd23f', '#fff6a0', '#ffffff'], 40, { speed: 340, size: 8, life: 1.0, grav: 100 });
    items.slice().forEach(function (o) { if (!o.missed) pop(o, true); }); say('✨ Golden! ✨'); CC.sfx.levelComplete();
  } else if (!fromGolden) {
    if (streak === 5 || streak === 10 || streak === 20) { say('🔥 ' + streak + ' in a row!'); CC.sfx.pickup(); particles.burst(W / 2, 90, CONFETTI, 24, { speed: 260, size: 6, life: 1.0 }); }
    else say({ fruit: ['Yum! 🍓', 'Tasty!', 'Juicy!', 'Nice slice!'], balloon: ['Pop!', 'Boing! 🎈', 'Nice pop!', 'Pop pop!'], bug: ['Squashed!', 'Got it! 🐞', 'Bug gone!', 'Nice one!'] }[f.theme][popped % 4]);
  }
  highlight();
  if (popped >= SLICE_LEVELS[lvIdx].goal && state === 'play') { state = 'done'; setTimeout(levelDone, 900); }
}
function levelDone() {
  const st = missed <= 1 ? 3 : missed <= 4 ? 2 : 1; best[lvIdx] = Math.max(best[lvIdx] || 0, st);
  const last = lvIdx >= SLICE_LEVELS.length - 1;
  CC.ui.levelComplete(stage, { level: lvIdx + 1, total: SLICE_LEVELS.length, stars: st,
    onNext: function () { startLevel(lvIdx + 1); }, onReplay: function () { startLevel(lvIdx); }, onRestartAll: function () { chooserSel = 0; chooser(); }, onMenu: function () { CC.goMenu(); } });
}
function update(dt) {
  t += dt; particles.update(dt); if (bubbleT > 0) bubbleT -= dt; hintT += dt;
  for (let i = halves.length - 1; i >= 0; i--) { const h = halves[i]; h.life += dt; h.vy += 500 * dt; h.x += h.vx * dt; h.y += h.vy * dt; h.rot += h.vr * dt; if (h.life > 1) halves.splice(i, 1); }
  if (state !== 'play') { if (state === 'done') items.forEach(function (f) { f.fade = Math.max(0, f.fade - dt); }); return; }
  const lv = SLICE_LEVELS[lvIdx];
  spawnIn -= dt;
  if (spawnIn <= 0 && spawned < 9999 && items.filter(function (f) { return !f.missed; }).length < lv.max) { spawn(); spawnIn = lv.every; highlight(); }
  for (let i = items.length - 1; i >= 0; i--) {
    const f = items[i], speed = (H + f.r * 2) / lv.fall * (f.golden ? 1.25 : 1);
    if (!f.missed) {
      f.y += speed * dt; f.ph += dt; f.x = f.bx + Math.sin(f.ph * (f.theme === 'balloon' ? 1.2 : 0.8)) * (f.theme === 'balloon' ? 22 : 14);
      if (f.y > H - f.r * 0.4) { f.missed = true; missed++; streak = 0; CC.sfx.softMiss(); say("That's ok, try the next one! 😊"); highlight(); }
    } else { f.fade -= dt * 1.2; f.y += 10 * dt; if (f.fade <= 0) items.splice(i, 1); }
  }
}
function drawItem(c, f) {
  c.save(); c.globalAlpha = Math.max(0, f.fade); c.translate(f.x, f.y);
  if (f.golden) { const g = c.createRadialGradient(0, 0, f.r * 0.5, 0, 0, f.r * 1.9); g.addColorStop(0, 'rgba(255,230,100,.85)'); g.addColorStop(1, 'rgba(255,230,100,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, f.r * 1.9, 0, 6.283); c.fill();
    for (let i = 0; i < 4; i++) { const a = t * 2 + i * 1.57; c.fillStyle = '#fff6a0'; c.beginPath(); c.arc(Math.cos(a) * f.r * 1.4, Math.sin(a) * f.r * 1.4, 4, 0, 6.283); c.fill(); } }
  c.rotate(f.rot + Math.sin(f.ph) * 0.06);
  if (f.theme === 'fruit') { SP.fruit(c, f.kind, 0, 0, f.r, t); SP.fruitLetter(c, f.ch, 0, 2, f.r); }
  else if (f.theme === 'balloon') { SP.balloon(c, f.kind, 0, 0, f.r, t); SP.fruitLetter(c, f.ch, 0, -4, f.r * 0.9); }
  else { SP.bug(c, f.kind, 0, 0, f.r, t); SP.fruitLetter(c, f.ch, 0, 4, f.r * 0.85); }
  c.restore();
}
function draw() {
  const c = ctx, lv = SLICE_LEVELS[lvIdx] || SLICE_LEVELS[0], th = lv.theme;
  const bg = c.createLinearGradient(0, 0, 0, H);
  if (th === 'balloon') { bg.addColorStop(0, '#5ab0ff'); bg.addColorStop(1, '#c8ecff'); } else if (th === 'bug') { bg.addColorStop(0, '#2f7a4a'); bg.addColorStop(1, '#7fcf6a'); } else if (th === 'mix') { bg.addColorStop(0, '#3a2a7a'); bg.addColorStop(1, '#a05ac8'); } else { bg.addColorStop(0, '#1d2060'); bg.addColorStop(1, '#4a3f9a'); }
  c.fillStyle = bg; c.fillRect(0, 0, W, H);
  if (th === 'fruit' || th === 'mix') { for (let i = 0; i < 20; i++) { c.globalAlpha = 0.3 + 0.2 * Math.sin(t * 0.6 + i); c.fillStyle = '#fff'; c.fillRect((i * 131) % W, (i * 67) % H, 2, 2); } c.globalAlpha = 1; }
  if (th === 'balloon') { c.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 4; i++) { const cx = ((i * 260 + t * 8) % (W + 200)) - 100, cy = 70 + (i % 2) * 60; c.beginPath(); c.ellipse(cx, cy, 60, 18, 0, 0, 6.283); c.ellipse(cx + 30, cy - 10, 36, 16, 0, 0, 6.283); c.fill(); } }
  if (th === 'bug') { c.fillStyle = 'rgba(30,100,50,.5)'; for (let i = 0; i < 14; i++) { c.beginPath(); c.moveTo(i * 60, H); c.lineTo(i * 60 + 14, H - 40 - (i % 3) * 14); c.lineTo(i * 60 + 28, H); c.fill(); } }
  c.fillStyle = th === 'balloon' ? '#7ad06a' : th === 'bug' ? '#3f8a3a' : '#7a5ac8'; c.fillRect(0, H - 14, W, 14); c.fillStyle = th === 'balloon' ? '#9ae88a' : th === 'bug' ? '#6ad65a' : '#9a7ae8'; c.fillRect(0, H - 14, W, 4);
  for (const h of halves) {
    c.save(); c.globalAlpha = Math.max(0, 1 - h.life); c.translate(h.x, h.y); c.rotate(h.rot);
    c.beginPath(); c.rect(h.s < 0 ? -h.r * 2 : 0, -h.r * 2, h.r * 2, h.r * 4); c.clip(); SP.fruit(c, h.kind, 0, 0, h.r, t); c.restore();
  }
  c.globalAlpha = 1;
  if (items) for (const f of items) drawItem(c, f);
  particles.draw(c);
  // HUD: icon + level number, progress bar, streak
  c.fillStyle = 'rgba(26,27,63,.6)'; hrr(c, 12, 10, 98, 44, 14); c.fill(); c.font = '26px sans-serif'; c.textAlign = 'left'; c.fillStyle = '#fff'; c.fillText(ICON[th], 20, 41); CC.outlineText(c, String(lvIdx + 1), 66, 42, 28, '#ffd23f');
  const bx = W / 2 - 110, frac = state === 'choose' ? 0 : Math.min(1, popped / lv.goal);
  c.fillStyle = 'rgba(26,27,63,.6)'; hrr(c, bx - 10, 12, 244, 26, 12); c.fill(); c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(bx, 21, 220, 8); c.fillStyle = '#ffd23f'; c.fillRect(bx, 21, 220 * frac, 8); c.font = '16px sans-serif'; c.fillStyle = '#fff'; c.fillText('🏁', bx + 224, 34);
  if (streak >= 3 && state === 'play') CC.outlineText(c, '🔥 ' + streak, W - 20, 42, 28, '#ffb347', 'right');
  if (hintT < 9 && lvIdx === 0 && popped === 0 && state === 'play') CC.outlineText(c, 'Find the letter on your keyboard and press it!', W / 2, 410, 24, '#ffffff', 'center');
  if (bubbleT > 0) { c.globalAlpha = Math.min(1, bubbleT); CC.outlineText(c, bubble, W / 2, 84, 30, '#ffffff', 'center'); c.globalAlpha = 1; }
}
function hrr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

CC.modes.fruit = {
  makey: false,
  enter: function () {
    CC.audio.init(); build(); items = []; halves = []; popped = 0; missed = 0; streak = 0; particles.clear(); bubbleT = 0; hintT = 0; highlight();
    loop.start(); chooser();
  },
  exit: function () { if (built) loop.stop(); CC.ui.close(); },
  onKeyDown: function (e) {
    if (state !== 'play' || e.repeat || e.ctrlKey || e.metaKey || e.altKey || !e.key || e.key.length !== 1) return;
    const ch = e.key.toUpperCase(); if (!/[A-Z0-9]/.test(ch)) return;
    const hits = items.filter(function (f) { return f.ch === ch && !f.missed; }).sort(function (a, b) { return b.y - a.y; });
    if (hits.length) pop(hits[0]); else CC.sfx.tick();    // a letter that is not on screen is just a tiny tick - no penalty
  },
  _state: function () { return { level: lvIdx, state: state, popped: popped, missed: missed, goal: SLICE_LEVELS[lvIdx].goal, items: (items || []).map(function (f) { return { ch: f.ch, theme: f.theme, y: f.y, missed: f.missed, golden: f.golden }; }) }; },
  _levels: SLICE_LEVELS, _start: function (i) { startLevel(i); }, _golden: function () { spawn(); items[items.length - 1].golden = true; }
};
})();
