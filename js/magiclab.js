/* magiclab.js - Magic Lab (Years 4 to 6). The advanced magic painter: same look as Magic Mix, with more control.
   Choose a style (Kaleidoscope, Spirograph, Flow Waves, Colour Pools), a colour harmony (complementary, analogous, triad, mono) and a base colour,
   then set the symmetry, the detail and the speed, and watch the picture draw itself. Then paint on it, undo, save or print.
   Nothing is stored or sent anywhere. */
(function () {
'use strict';
const CC = window.CC, PC = CC.PCOM, ST = CC.ST, el = ST.el, W = 960, H = 600, CX = W / 2, CY = H / 2, TAU = Math.PI * 2;
const $stage = function () { return document.getElementById('stage-magiclab'); };
const $root = function () { return document.getElementById('lab-root'); };
function rnd(a, b) { return a + Math.random() * (b - a); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function hsl(h, s, l) { return 'hsl(' + (((h % 360) + 360) % 360).toFixed(0) + ',' + s + '%,' + l + '%)'; }

const STYLES = [['kaleido', 'Kaleidoscope'], ['spiro', 'Spirograph'], ['flow', 'Flow Waves'], ['pools', 'Colour Pools']];
const HARMONIES = [['comp', 'Complementary'], ['analog', 'Analogous'], ['triad', 'Triad'], ['mono', 'Mono']];
const HINTS = {
  comp: 'Complementary: two colours opposite each other on the colour wheel. They make strong contrast, and mix to a neutral grey.',
  analog: 'Analogous: colours next to each other on the wheel. They feel calm and flow into each other.',
  triad: 'Triad: three colours spread evenly round the wheel. Lively and balanced.',
  mono: 'Mono: one colour in light and dark shades. Clean and simple.'
};
const NOTES = {
  kaleido: 'Each line is copied round the centre and mirrored: that is symmetry.',
  spiro: 'A small wheel rolls inside a big wheel, with a pen in the small wheel.',
  flow: 'Invisible wind pushes thousands of tiny pens along curving paths.',
  pools: 'Soft pools of your colours grow and overlap. Watch what the overlaps become.'
};

/* the colours for a harmony: five of them, light to dark */
function paletteFor(harmony, hue) {
  const h = hue;
  if (harmony === 'comp') return [hsl(h, 85, 60), hsl(h, 70, 78), hsl(h + 180, 85, 58), hsl(h + 180, 70, 76), hsl(h + 180, 65, 38)];
  if (harmony === 'analog') return [hsl(h - 30, 85, 60), hsl(h - 15, 85, 66), hsl(h, 85, 58), hsl(h + 15, 85, 66), hsl(h + 30, 85, 60)];
  if (harmony === 'triad') return [hsl(h, 85, 60), hsl(h + 120, 85, 58), hsl(h + 240, 85, 62), hsl(h, 70, 78), hsl(h + 120, 70, 76)];
  return [hsl(h, 80, 82), hsl(h, 82, 68), hsl(h, 85, 55), hsl(h, 80, 42), hsl(h, 75, 28)];
}

const L = { style: 'kaleido', harmony: 'comp', hue: 210, sym: 8, detail: 3, speed: 3, paper: 'dark', colour: '#ffffff', size: 10, tool: 'brush', hist: ST.history(20), running: false, raf: 0, timer: 0, cv: null, ctx: null, ui: {}, eng: null, p: 0, t0: 0, last: 0 };
function paperColour() { return L.paper === 'dark' ? '#10122e' : '#fbf7ee'; }
function duration() { return 34 - L.speed * 5; }                              // seconds: 29 (slow) down to 9 (fast)

/* ---------- the four painters. Each one adds a little more to the picture every time it is asked to step. ---------- */
function kaleido(ctx, pal) {
  const N = L.sym, walkers = [];
  for (let i = 0; i < L.detail + 1; i++) walkers.push({ r: rnd(40, 260), a: rnd(0, TAU), vr: rnd(-1, 1), va: rnd(-0.03, 0.03), c: i, w: rnd(1.2, 3.4) });
  return { step: function (p, steps) {
    ctx.lineCap = 'round';
    for (let s = 0; s < steps; s++) walkers.forEach(function (w) {
      const pr = w.r, pa = w.a; w.vr = clamp(w.vr + rnd(-0.4, 0.4), -3.2, 3.2); w.va = clamp(w.va + rnd(-0.005, 0.005), -0.07, 0.07); w.r += w.vr; w.a += w.va;
      if (w.r < 20 || w.r > 285) { w.vr *= -1; w.r = clamp(w.r, 20, 285); }
      ctx.strokeStyle = pal[(w.c + Math.floor(p * pal.length * 2)) % pal.length]; ctx.lineWidth = w.w * (1 - p * 0.35);
      for (let k = 0; k < N; k++) for (let m = -1; m <= 1; m += 2) { const a0 = pa * m + k * TAU / N, a1 = w.a * m + k * TAU / N; ctx.beginPath(); ctx.moveTo(CX + Math.cos(a0) * pr, CY + Math.sin(a0) * pr); ctx.lineTo(CX + Math.cos(a1) * w.r, CY + Math.sin(a1) * w.r); ctx.stroke(); }
    });
  } };
}
function spiro(ctx, pal) {
  const curves = [], n = Math.max(1, L.detail);
  for (let i = 0; i < n; i++) { const R = rnd(170, 250), r = Math.floor(rnd(30, 120)), d = rnd(40, 150); curves.push({ R: R, r: r, d: d, t: rnd(0, 6), c: i, rot: rnd(0, TAU) }); }
  const sym = Math.max(1, Math.min(L.sym, 12));
  function pt(c, t) { const k = (c.R - c.r) / c.r; return [(c.R - c.r) * Math.cos(t) + c.d * Math.cos(k * t), (c.R - c.r) * Math.sin(t) - c.d * Math.sin(k * t)]; }
  return { step: function (p, steps) {
    ctx.lineCap = 'round'; ctx.lineWidth = 2.2;
    for (let s = 0; s < steps; s++) curves.forEach(function (c) {
      const a = pt(c, c.t), b = pt(c, c.t + 0.04); c.t += 0.04; ctx.strokeStyle = pal[(c.c + Math.floor(c.t * 0.9)) % pal.length];
      for (let k = 0; k < sym; k++) { const ang = c.rot + k * TAU / sym, ca = Math.cos(ang), sa = Math.sin(ang); ctx.beginPath(); ctx.moveTo(CX + a[0] * ca - a[1] * sa, CY + a[0] * sa + a[1] * ca); ctx.lineTo(CX + b[0] * ca - b[1] * sa, CY + b[0] * sa + b[1] * ca); ctx.stroke(); }
    });
  } };
}
function flow(ctx, pal) {
  const parts = [], count = 90 + L.detail * 70, ph = [rnd(0, 6), rnd(0, 6), rnd(0, 6)], sc = rnd(0.0035, 0.006);
  function ang(x, y) { return (Math.sin(x * sc + ph[0]) + Math.cos(y * sc * 1.3 + ph[1]) + Math.sin((x + y) * sc * 0.7 + ph[2])) * 1.6; }
  function spawn() { return { x: rnd(0, W), y: rnd(0, H), life: rnd(60, 220) }; }
  for (let i = 0; i < count; i++) parts.push(spawn());
  return { step: function (p, steps) {
    ctx.lineCap = 'round'; ctx.lineWidth = 1.5; ctx.globalCompositeOperation = L.paper === 'dark' ? 'lighter' : 'source-over';        // glowing light on dark paper
    for (let s = 0; s < steps; s++) parts.forEach(function (q, i) {
      const a = ang(q.x, q.y), nx = q.x + Math.cos(a) * 2.4, ny = q.y + Math.sin(a) * 2.4;
      ctx.globalAlpha = 0.28; ctx.strokeStyle = pal[Math.floor(((a % TAU) + TAU) % TAU / TAU * pal.length) % pal.length]; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(nx, ny); ctx.stroke(); ctx.globalAlpha = 1;
      q.x = nx; q.y = ny; q.life--; if (q.life < 0 || nx < -10 || nx > W + 10 || ny < -10 || ny > H + 10) parts[i] = spawn();
    });
    ctx.globalCompositeOperation = 'source-over';
  } };
}
function pools(ctx, pal) {
  const blobs = [], n = 5 + L.detail; const mixable = pal.map(function (c) { return c; });
  for (let i = 0; i < n; i++) blobs.push({ x: rnd(120, W - 120), y: rnd(100, H - 100), R: rnd(150, 250), c: mixable[i % mixable.length], t0: i / n * 0.7 });
  return { full: true, render: function (p) {
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = L.paper === 'dark' ? '#f2f2f2' : '#ffffff'; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'multiply';
    blobs.forEach(function (b) { const f = clamp((p - b.t0) / 0.3, 0, 1), r = b.R * (1 - Math.pow(1 - f, 3)); if (r < 2) return; const g = ctx.createRadialGradient(b.x, b.y, r * 0.05, b.x, b.y, r); g.addColorStop(0, b.c); g.addColorStop(0.7, b.c); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.globalAlpha = 0.75; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; });
    ctx.globalCompositeOperation = 'source-over';
  } };
}

/* ---------- running ---------- */
function say(html, done) { L.ui.say.innerHTML = html; L.ui.say.className = 'st-say' + (done ? ' done' : ''); }
function swatches(pal) { return pal.map(function (c) { return '<span class="sw" style="background:' + c + '"></span>'; }).join(''); }
function start() {
  if (L.running) return;
  L.hist.push(ST.canvasEntry(L.ctx, W, H));
  const ctx = L.ctx, pal = paletteFor(L.harmony, L.hue);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.fillStyle = paperColour(); ctx.fillRect(0, 0, W, H);
  L.eng = L.style === 'kaleido' ? kaleido(ctx, pal) : L.style === 'spiro' ? spiro(ctx, pal) : L.style === 'flow' ? flow(ctx, pal) : pools(ctx, pal);
  L.p = 0; L.running = true; L.t0 = performance.now(); L.last = L.t0; setRunning(true); CC.sfx.letsGo && CC.sfx.letsGo();
  say(swatches(pal) + ' <b>' + STYLES.filter(function (s) { return s[0] === L.style; })[0][1] + '</b> · ' + NOTES[L.style]);
  frame(L.t0); loop();
}
function advance(dt) {
  // dt seconds of drawing; the painters add detail in small steps
  L.p = clamp(L.p + dt / duration(), 0, 1);
  if (L.eng.full) L.eng.render(L.p); else L.eng.step(L.p, Math.max(2, Math.round(dt * 95)));
  L.ui.prog.style.width = (L.p * 100).toFixed(0) + '%';
  if (L.p >= 1) finish();
}
function frame(now) { const dt = Math.min(0.1, (now - L.last) / 1000); L.last = now; advance(dt); }
function loop() {
  cancelAnimationFrame(L.raf); clearTimeout(L.timer);
  function f(now) { if (!L.running) return; if (now - L.last >= 30) frame(now); if (L.running) L.raf = requestAnimationFrame(f); }
  L.raf = requestAnimationFrame(f);
  L.timer = setTimeout(function g() { if (L.running) { frame(performance.now()); if (L.running) L.timer = setTimeout(g, 120); } }, 300);      // keeps going even if the page is not being drawn
}
function finish() {
  if (!L.running) return; L.running = false; cancelAnimationFrame(L.raf); clearTimeout(L.timer); L.ui.prog.style.width = '100%'; setRunning(false); CC.sfx.levelComplete();
  say('🎉 Finished! Paint on it, or change the settings and press Create again.', true);
}
function skip() { if (!L.running) return; let g = 0; while (L.running && g++ < 4000) advance(duration() / 200); if (L.running) finish(); }
function setRunning(on) { L.ui.root.classList.toggle('running', on); L.ui.go.hidden = on; L.ui.skip.hidden = !on; L.ui.canvas.style.pointerEvents = on ? 'none' : ''; }

/* ---------- the screen: the same layout as every painting program ---------- */
function show() {
  CC.ui.close(); L.hist.clear(); L.running = false;
  const s = ST.shell($root(), { hint: 'Choose a style and colours on the right, then press Create. Then paint on it if you like.' }); L.ui.root = s.wrap;
  ST.action(s.left, '↩️', 'Undo', function () { if (!L.running && L.hist.undo()) CC.sfx.tick(); });
  ST.action(s.left, '↪️', 'Redo', function () { if (!L.running && L.hist.redo()) CC.sfx.tick(); });
  ST.action(s.left, '🧹', 'Start again', function () { if (!L.running) ST.confirm($stage(), 'Start again?', 'This clears your painting.', function () { L.hist.push(ST.canvasEntry(L.ctx, W, H)); L.ctx.fillStyle = paperColour(); L.ctx.fillRect(0, 0, W, H); say('Press Create to make a painting.'); }); });
  ST.action(s.right, '💾', 'Save', save, 'primary'); ST.action(s.right, '🖨️', 'Print', function () { window.print(); });
  ST.tool(s.rail, 'brush', '🖌️', 'Brush', function (id) { L.tool = id; }, true); ST.tool(s.rail, 'eraser', '🩹', 'Rubber', function (id) { L.tool = id; }, false);
  // create
  const mk = ST.section(s.side, 'Create');
  ST.choice(mk, STYLES, L.style, function (id) { L.style = id; note.textContent = NOTES[id]; });
  const note = el('p', 'st-note', NOTES[L.style]); mk.appendChild(note);
  L.ui.go = ST.action(mk, '✨', 'Create', start, 'primary magic'); L.ui.skip = ST.action(mk, '⏩', 'Finish now', skip); L.ui.skip.hidden = true;
  const pg = el('div', 'st-prog'); L.ui.prog = el('i'); pg.appendChild(L.ui.prog); mk.appendChild(pg);
  // colour harmony
  const hs = ST.section(s.side, 'Colour harmony'); hs.classList.add('st-lockable');
  const prev = el('div', 'st-harm'); const hint = el('p', 'st-note', HINTS[L.harmony]);
  function showPal() { prev.innerHTML = swatches(paletteFor(L.harmony, L.hue)); hint.textContent = HINTS[L.harmony]; }
  ST.choice(hs, HARMONIES, L.harmony, function (id) { L.harmony = id; showPal(); });
  hs.appendChild(prev); showPal();
  const hue = ST.slider(hs, 'Base colour', 0, 359, L.hue, function (v) { L.hue = v; showPal(); }, false); hue.input.classList.add('st-hue');
  const dice = ST.action(hs, '🎲', 'Random colours', function () { L.hue = Math.floor(Math.random() * 360); hue.set(L.hue); L.harmony = HARMONIES[Math.floor(Math.random() * 4)][0]; hs.querySelectorAll('.st-chip').forEach(function (c) { c.classList.toggle('on', c.dataset.id === L.harmony); }); showPal(); }); dice.classList.add('wide');
  hs.appendChild(hint);
  // settings
  const st = ST.section(s.side, 'Settings'); st.classList.add('st-lockable');
  ST.slider(st, 'Symmetry', 1, 12, L.sym, function (v) { L.sym = v; }, false);
  ST.slider(st, 'Detail', 1, 5, L.detail, function (v) { L.detail = v; }, false);
  ST.slider(st, 'Speed', 1, 5, L.speed, function (v) { L.speed = v; }, false);
  const pp = el('div', 'st-sub', 'Paper'); st.appendChild(pp); ST.choice(st, [['dark', 'Dark'], ['light', 'Light']], L.paper, function (id) { L.paper = id; });
  // editing after it finishes
  const col = ST.section(s.side, 'Colour'); col.classList.add('st-lockable'); ST.palette(col, L.colour, function (c) { L.colour = c; L.tool = 'brush'; ST.setTool(s.rail, 'brush'); }, true);
  const sz = ST.section(s.side, 'Size'); ST.slider(sz, 'Brush size', 4, 50, L.size, function (v) { L.size = v; }, true);
  const stk = ST.stack(s.paper); const cv = ST.canvas(stk, W, H, 'solid'); L.cv = cv; L.ctx = cv.getContext('2d'); L.ui.canvas = cv; L.ctx.fillStyle = paperColour(); L.ctx.fillRect(0, 0, W, H);
  L.ui.say = el('div', 'st-say', ''); stk.appendChild(L.ui.say); say('Choose a style and colours, then press Create.');
  ST.freehand(cv, { state: function () { return { colour: L.colour, size: L.size, tool: L.tool }; }, enabled: function () { return !L.running; }, before: function () { L.hist.push(ST.canvasEntry(L.ctx, W, H)); }, eraserPaints: paperColour });
}
function save() { L.cv.toBlob(function (b) { PC.download(b, 'my-magic-lab.png'); }, 'image/png'); }

CC.modes.magiclab = {
  makey: false,
  enter: function () { CC.audio.init(); CC.watchStage($stage()); show(); },
  exit: function () { L.running = false; cancelAnimationFrame(L.raf); clearTimeout(L.timer); CC.ui.close(); },
  onKeyDown: function (e) {
    if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
    if (e.ctrlKey || e.metaKey) { const k = e.key.toLowerCase(); if (k === 'z' && !L.running) { e.preventDefault(); if (e.shiftKey) L.hist.redo(); else L.hist.undo(); } else if (k === 'y' && !L.running) { e.preventDefault(); L.hist.redo(); } }
  },
  /* test hooks */
  _L: L, _start: start, _finish: skip, _palette: paletteFor
};
})();
