/* fruit.js - Fruit Slice (Session 1). Press the letter shown on a falling fruit to slice it.
   A gentle practice tool: no lives, no game over, no timer, no penalties. */
(function () {
'use strict';

/* =============== TEACHER SETTINGS - easy numbers to nudge =============== */
const FRUIT_FALL_SECONDS = 18;          // seconds for a fruit to fall all the way down. Make it BIGGER to slow things down.
const FRUIT_LETTERS = 'ASDFJKL';        // which letters can appear. Try 'ASDFGHJKL' (home row) or 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.
const FRUIT_SPAWN_SECONDS = 4.5;        // a new fruit appears this often (bigger = fewer fruits at once)
const FRUIT_MAX_ON_SCREEN = 3;          // never more than this many fruits at once
const FRUIT_RADIUS = 44;                // size of the fruit (pixels, out of 800 wide)
/* ======================================================================= */

const SP = CC.sprites, W = 800, H = 450;
const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
let stage, ctx, loop, built = false, t = 0, particles, fruits, halves, spawnIn, sliced, bubble, bubbleT, lastKind, hintT, kbdCells = {};

function build() {
  if (built) return; built = true;
  stage = document.getElementById('stage-fruit'); ctx = stage.querySelector('canvas').getContext('2d');
  CC.watchStage(stage); particles = new CC.Particles(); loop = CC.createLoop(update, draw);
  const kb = document.getElementById('fruit-kbd');
  ROWS.forEach(function (row) {
    const r = document.createElement('div'); r.className = 'kr';
    row.split('').forEach(function (ch) { const k = document.createElement('div'); k.className = 'kc'; k.textContent = ch; r.appendChild(k); kbdCells[ch] = k; });
    kb.appendChild(r);
  });
}
function spawn() {
  const used = fruits.map(function (f) { return f.ch; });
  const pool = FRUIT_LETTERS.split('').filter(function (ch) { return used.indexOf(ch) < 0; });
  if (!pool.length) return;
  const ch = pool[Math.floor(Math.random() * pool.length)];
  let kind; do { kind = SP.FRUIT_KINDS[Math.floor(Math.random() * SP.FRUIT_KINDS.length)]; } while (kind === lastKind); lastKind = kind;
  // pick a lane that is not right under another fruit that has only just appeared
  let x, tries = 0;
  do { x = CC.rand(FRUIT_RADIUS + 30, W - FRUIT_RADIUS - 30); tries++; }
  while (tries < 12 && fruits.some(function (f) { return Math.abs(f.bx - x) < FRUIT_RADIUS * 2.6 && f.y < 200; }));
  fruits.push({ ch: ch, kind: kind, bx: x, x: x, y: -FRUIT_RADIUS, ph: Math.random() * 6, fade: 1, missed: false, rot: Math.random() * 0.4 - 0.2 });
}
function sayBubble(txt) { bubble = txt; bubbleT = 2.6; }
function highlight() {
  Object.keys(kbdCells).forEach(function (k) { kbdCells[k].classList.remove('hl'); });
  const live = fruits.filter(function (f) { return !f.missed; }).sort(function (a, b) { return b.y - a.y; });
  if (live[0] && kbdCells[live[0].ch]) kbdCells[live[0].ch].classList.add('hl');
}
function slice(f) {
  const j = SP.FRUIT_JUICE[f.kind];
  particles.burst(f.x, f.y, j.concat(['#ffffff']), 26, { speed: 240, size: 7, life: .8, grav: 420 });
  [-1, 1].forEach(function (s) { halves.push({ kind: f.kind, x: f.x, y: f.y, s: s, vx: s * 90, vy: -60, rot: 0, vr: s * 2.2, life: 0 }); });
  fruits.splice(fruits.indexOf(f), 1); sliced++; CC.sfx.slice();
  sayBubble(sliced % 5 === 0 ? 'Wow, ' + sliced + ' fruits! Brilliant! 🌟' : ['Yum! 🍓', 'Great job!', 'Super!', 'You found it!'][sliced % 4]);
  highlight();
}
function update(dt) {
  t += dt; particles.update(dt); hintT += dt;
  const speed = (H + FRUIT_RADIUS * 2) / FRUIT_FALL_SECONDS;
  spawnIn -= dt;
  if (spawnIn <= 0 && fruits.filter(function (f) { return !f.missed; }).length < FRUIT_MAX_ON_SCREEN) { spawn(); spawnIn = FRUIT_SPAWN_SECONDS; highlight(); }
  for (let i = fruits.length - 1; i >= 0; i--) {
    const f = fruits[i];
    if (!f.missed) {
      f.y += speed * dt; f.ph += dt; f.x = f.bx + Math.sin(f.ph * 0.8) * 14;
      if (f.y > H - FRUIT_RADIUS * 0.4) { f.missed = true; CC.sfx.softMiss(); sayBubble("That's ok, try the next one! 😊"); highlight(); }
    } else { f.fade -= dt * 1.2; f.y += 10 * dt; if (f.fade <= 0) fruits.splice(i, 1); }
  }
  for (let i = halves.length - 1; i >= 0; i--) { const h = halves[i]; h.life += dt; h.vy += 500 * dt; h.x += h.vx * dt; h.y += h.vy * dt; h.rot += h.vr * dt; if (h.life > 1) halves.splice(i, 1); }
  if (bubbleT > 0) bubbleT -= dt;
}
function draw() {
  const c = ctx, bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#1d2060'); bg.addColorStop(1, '#4a3f9a');
  c.fillStyle = bg; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 20; i++) { c.globalAlpha = 0.3 + 0.2 * Math.sin(t * 0.6 + i); c.fillStyle = '#fff'; c.fillRect((i * 131) % W, (i * 67) % H, 2, 2); }
  c.globalAlpha = 1;
  // soft table at the bottom
  c.fillStyle = '#7a5ac8'; c.fillRect(0, H - 14, W, 14); c.fillStyle = '#9a7ae8'; c.fillRect(0, H - 14, W, 4);
  for (const h of halves) {
    c.save(); c.globalAlpha = Math.max(0, 1 - h.life); c.translate(h.x, h.y); c.rotate(h.rot);
    c.beginPath(); c.rect(h.s < 0 ? -FRUIT_RADIUS * 2 : 0, -FRUIT_RADIUS * 2, FRUIT_RADIUS * 2, FRUIT_RADIUS * 4); c.clip();
    SP.fruit(c, h.kind, 0, 0, FRUIT_RADIUS, t); c.restore();
  }
  c.globalAlpha = 1;
  for (const f of fruits) {
    c.save(); c.globalAlpha = Math.max(0, f.fade); c.translate(f.x, f.y); c.rotate(f.rot + Math.sin(f.ph) * 0.06);
    SP.fruit(c, f.kind, 0, 0, FRUIT_RADIUS, t); SP.fruitLetter(c, f.ch, 0, 2, FRUIT_RADIUS); c.restore();
  }
  c.globalAlpha = 1;
  particles.draw(c);
  CC.outlineText(c, 'Fruits sliced: ' + sliced + ' ⭐', 18, 36, 26, '#ffd23f');
  if (hintT < 9 && sliced === 0) CC.outlineText(c, 'Find the letter on your keyboard and press it!', W / 2, 410, 24, '#ffffff', 'center');
  if (bubbleT > 0) { c.globalAlpha = Math.min(1, bubbleT); CC.outlineText(c, bubble, W / 2, 80, 30, '#ffffff', 'center'); c.globalAlpha = 1; }
}
CC.modes.fruit = {
  makey: false,
  enter: function () {
    CC.audio.init(); build(); fruits = []; halves = []; sliced = 0; spawnIn = 0.3; bubbleT = 0; hintT = 0; lastKind = ''; particles.clear();
    loop.start(); highlight();
  },
  exit: function () { if (built) loop.stop(); },
  onKeyDown: function (e) {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || !e.key || e.key.length !== 1) return;
    const ch = e.key.toUpperCase(); if (!/[A-Z]/.test(ch)) return;
    const hits = fruits.filter(function (f) { return f.ch === ch && !f.missed; }).sort(function (a, b) { return b.y - a.y; });
    if (hits.length) slice(hits[0]); else CC.sfx.tick();    // a wrong/unused letter is just a tiny tick - no penalty
  },
  _state: function () { return { fruits: fruits.map(function (f) { return { ch: f.ch, y: f.y, missed: f.missed }; }), sliced: sliced }; }
};
})();
