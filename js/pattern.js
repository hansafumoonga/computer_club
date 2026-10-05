/* pattern.js - Pattern Pop! (Session 2). A Simon-Says memory game on the Makey Makey's 5 keys.
   Pad tones are the piano's exact C D E F G frequencies. */
(function () {
'use strict';

/* =============== TEACHER SETTINGS =============== */
const PATTERN_START_LENGTH = 1;      // how many pads in the first round
const PATTERN_LIT_SECONDS = 0.55;    // how long each pad glows while watching (bigger = slower, easier)
const PATTERN_GAP_SECONDS = 0.3;     // pause between pads while watching
const PATTERN_GRACE_RETRIES = 3;     // "that was close!" second chances before the game ends
/* ================================================= */

const SP = CC.sprites, W = 800, H = 450;
const PAD_W = 130, PAD_H = 170, PAD_GAP = 18, PAD_X0 = (W - (5 * PAD_W + 4 * PAD_GAP)) / 2, PAD_Y = 150;
const ORDER = ['ArrowLeft', 'ArrowUp', 'ArrowDown', 'ArrowRight', 'Space'];   // pad 0..4 left to right
let stage, ctx, loop, built = false, t = 0;
let state, seq, idx, lit, litT, stepI, stepT, showing, timer, graceLeft, message, round, particles;

function build() {
  if (built) return; built = true;
  stage = document.getElementById('stage-pattern'); ctx = stage.querySelector('canvas').getContext('2d');
  CC.watchStage(stage); particles = new CC.Particles();
  loop = CC.createLoop(update, draw);
  stage.querySelector('canvas').addEventListener('pointerdown', function (e) {
    const r = e.target.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H;
    for (let i = 0; i < 5; i++) { const px = PAD_X0 + i * (PAD_W + PAD_GAP); if (x >= px && x <= px + PAD_W && y >= PAD_Y && y <= PAD_Y + PAD_H) press(i); }
  });
}
function note(i) { return CC.NOTES[i]; }
function lightUp(i, secs) { lit = i; litT = secs; CC.audio.pianoNote(note(i), { dur: 0.6 }); }

function intro() {
  state = 'intro'; message = 'Press any pad to start!';
  CC.ui.show(stage, { emoji: '🎵', title: 'Pattern Pop!',
    buttons: [{ icon: '▶', label: 'Play', keys: CC.MAKEY_KEYS.concat(['Enter']), primary: true, fn: newGame }, { icon: '🏠', label: 'Menu', fn: function () { CC.goMenu(); } }] });
}
function newGame() {
  CC.ui.close(); seq = []; round = 0; graceLeft = PATTERN_GRACE_RETRIES; lit = -1; nextRound();
}
function nextRound() {
  round++;
  while (seq.length < PATTERN_START_LENGTH + round - 1) seq.push(Math.floor(Math.random() * 5));
  startWatch('Round ' + round + ' — watch!', 1.0);
}
function startWatch(msg, delay) {
  state = 'watch'; message = msg; stepI = 0; showing = false; stepT = delay; idx = 0;
}
function update(dt) {
  t += dt; particles.update(dt);
  if (litT > 0) { litT -= dt; if (litT <= 0) lit = -1; }
  if (state === 'watch') {
    stepT -= dt;
    if (stepT <= 0) {
      if (!showing) {
        if (stepI >= seq.length) { state = 'input'; message = 'Your turn! Copy the pattern.'; idx = 0; return; }
        lightUp(seq[stepI], PATTERN_LIT_SECONDS); showing = true; stepT = PATTERN_LIT_SECONDS;
      } else { showing = false; stepI++; stepT = PATTERN_GAP_SECONDS; }
    }
  } else if (state === 'wait') {
    timer -= dt; if (timer <= 0) { timer = 0; if (after) after(); }
  }
}
let after = null;
function later(sec, fn) { state = 'wait'; timer = sec; after = fn; }
function press(i) {
  if (state !== 'input') return;
  lightUp(i, 0.3);
  const px = PAD_X0 + i * (PAD_W + PAD_GAP) + PAD_W / 2;
  if (seq[idx] === i) {
    particles.burst(px, PAD_Y + 20, [CC.NOTE_COLORS[note(i)], '#ffffff'], 8, { speed: 130, size: 5, up: 80 });
    idx++;
    if (idx >= seq.length) {
      message = 'Great memory! ⭐'; CC.sfx.good(); particles.burst(W / 2, 110, ['#ffd23f', '#ffffff', '#6bcb77'], 20, { speed: 200, size: 6, up: 120 });
      later(1.3, nextRound);
    }
  } else if (graceLeft > 0) {
    graceLeft--; message = 'That was close! Watch again.'; CC.sfx.softMiss();
    later(1.2, function () { startWatch('Watch again…', 0.4); });
  } else {
    state = 'over'; CC.sfx.softMiss();
    later(0.6, function () {
      state = 'over';
      CC.ui.show(stage, { emoji: '🌈', title: 'Nice try!', text: seq.length > 2 ? '⭐ ' + (seq.length - 1) : '',
        buttons: [{ icon: '▶', label: 'Again', keys: CC.MAKEY_KEYS.concat(['Enter']), primary: true, fn: newGame }, { icon: '🏠', label: 'Menu', fn: function () { CC.goMenu(); } }] });
    });
  }
}
function draw() {
  const c = ctx, bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#15163a'); bg.addColorStop(1, '#2d2f78');
  c.fillStyle = bg; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 24; i++) { c.globalAlpha = 0.35 + 0.2 * Math.sin(t * 0.7 + i); c.fillStyle = '#fff'; c.fillRect((i * 97) % W, (i * 53) % 120, 2, 2); }
  c.globalAlpha = 1;
  for (let i = 0; i < 5; i++) {
    const n = note(i);
    SP.pad(c, PAD_X0 + i * (PAD_W + PAD_GAP), PAD_Y, PAD_W, PAD_H, CC.NOTE_COLORS[n], lit === i, n, CC.KEY_LABEL[ORDER[i]], t);
  }
  CC.outlineText(c, state === 'intro' ? 'Pattern Pop!' : 'Round ' + round, W / 2, 62, 40, '#ffd23f', 'center');
  CC.outlineText(c, message || '', W / 2, 118, 26, '#ffffff', 'center');
  // second-chance hearts
  if (state !== 'intro') { CC.outlineText(c, 'Second chances', 18, 424, 18, '#b7b8de'); for (let i = 0; i < PATTERN_GRACE_RETRIES; i++) SP.heart(c, 190 + i * 28, 418, 22, i < graceLeft); }
  // progress dots for the pattern
  if (seq && seq.length && state !== 'intro') {
    const n = seq.length, x0 = W / 2 - (n - 1) * 12;
    for (let i = 0; i < n; i++) { c.beginPath(); c.arc(x0 + i * 24, 392, 7, 0, 6.283); c.fillStyle = (state === 'input' || state === 'wait') && i < idx ? '#6bcb77' : 'rgba(255,255,255,.3)'; c.fill(); }
  }
  particles.draw(c);
}
CC.modes.pattern = {
  makey: true,
  enter: function () { CC.audio.init(); build(); lit = -1; litT = 0; seq = []; idx = 0; round = 0; graceLeft = PATTERN_GRACE_RETRIES; particles.clear(); loop.start(); intro(); },
  exit: function () { if (!built) return; loop.stop(); CC.ui.close(); after = null; state = 'intro'; },
  onKeyDown: function (e) { if (e.repeat) return; const i = ORDER.indexOf(e.code); if (i >= 0) press(i); },
  _state: function () { return { state: state, seq: seq, idx: idx, round: round, graceLeft: graceLeft }; }
};
})();
