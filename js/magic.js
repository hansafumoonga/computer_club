/* magic.js - Magic Mix (Years 1 to 3). Press the magic button and watch a painting make itself: pools of colour grow and overlap, so
   you can SEE them mix (blue + yellow = green ...), then a shape is drawn and filled with mixing colours. When it finishes the child can
   paint on it, undo, save or print. Nothing is stored or sent anywhere. */
(function () {
'use strict';
const CC = window.CC, PC = CC.PCOM, ST = CC.ST, el = ST.el, W = 960, H = 600;
const $stage = function () { return document.getElementById('stage-magic'); };
const $root = function () { return document.getElementById('mg-root'); };
function rnd(a, b) { return a + Math.random() * (b - a); }
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function clamp(v) { return Math.max(0, Math.min(1, v)); }
function ease(t) { t = clamp(t); return 1 - Math.pow(1 - t, 3); }
function rgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
function rgba(h, a) { const c = rgb(h); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
function mulHex(a, b) { const x = rgb(a), y = rgb(b); return '#' + [0, 1, 2].map(function (i) { return Math.round(x[i] * y[i] / 255).toString(16).padStart(2, '0'); }).join(''); }
function lerpHex(a, b, t) { const x = rgb(a), y = rgb(b); return 'rgb(' + [0, 1, 2].map(function (i) { return Math.round(x[i] + (y[i] - x[i]) * t); }).join(',') + ')'; }

/* two sets of base colours; mixing them (multiplying) gives the colour in the sentence */
const PALS = [
  { n: ['Blue', 'Pink', 'Yellow'], c: ['#5cd0ff', '#ff86bd', '#ffe96b'] },
  { n: ['Red', 'Yellow', 'Blue'], c: ['#ff7b7b', '#ffe56b', '#72b4ff'] }
];
const MIXED = { 'Blue+Yellow': 'Green', 'Pink+Yellow': 'Orange', 'Blue+Pink': 'Purple', 'Red+Yellow': 'Orange', 'Blue+Red': 'Purple' };
function mixName(a, b) { return MIXED[a + '+' + b] || MIXED[b + '+' + a] || 'a new colour'; }

/* shapes, as a closed line of points around the middle of the paper */
const SHAPES = {
  star: function () { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 90 : 215; p.push([W / 2 + Math.cos(a) * r, H / 2 + 12 + Math.sin(a) * r]); } return p; },
  heart: function () { const p = []; for (let i = 0; i < 90; i++) { const t = i / 90 * Math.PI * 2; p.push([W / 2 + 14 * 16 * Math.pow(Math.sin(t), 3), H / 2 - 4 - 14 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]); } return p; },
  flower: function () { const p = []; for (let i = 0; i < 140; i++) { const t = i / 140 * Math.PI * 2, r = 210 * (0.62 + 0.38 * Math.cos(5 * t)); p.push([W / 2 + Math.cos(t) * r, H / 2 + Math.sin(t) * r]); } return p; },
  sun: function () { const p = []; for (let i = 0; i < 32; i++) { const a = i / 32 * Math.PI * 2, r = i % 2 ? 150 : 225; p.push([W / 2 + Math.cos(a) * r, H / 2 + Math.sin(a) * r]); } return p; },
  moon: function () { const p = []; for (let i = 0; i <= 60; i++) { const a = Math.PI * 0.3 + i / 60 * Math.PI * 1.4; p.push([W / 2 + Math.cos(a) * 200, H / 2 + Math.sin(a) * 200]); } for (let i = 60; i >= 0; i--) { const a = Math.PI * 0.3 + i / 60 * Math.PI * 1.4; p.push([W / 2 + 70 + Math.cos(a) * 150, H / 2 + Math.sin(a) * 160]); } return p; }
};
const SHAPE_NAMES = { star: 'a star', heart: 'a heart', flower: 'a flower', sun: 'a sun', moon: 'a moon' };

const M = { colour: '#ff3b4e', size: 14, tool: 'brush', hist: ST.history(20), running: false, G: null, raf: 0, cv: null, ctx: null, ui: {} };
const DUR = { pools: 4.6, outline: 3.0, fill: 3.2, spark: 1.2 };

/* ---------- build a new random painting plan ---------- */
function plan() {
  const pal = pick(PALS), j = function () { return rnd(-45, 45); };
  const anchors = [[380 + j(), 240 + j()], [580 + j(), 240 + j()], [480 + j(), 385 + j()]];
  const blobs = anchors.map(function (a, i) { return { x: a[0], y: a[1], R: rnd(190, 235), c: pal.c[i], t0: i * 0.5, d: 3.0, anchor: i }; });
  for (let k = 0; k < 3; k++) blobs.push({ x: rnd(80, W - 80), y: rnd(80, H - 80), R: rnd(120, 190), c: pick(pal.c), t0: rnd(1.4, 2.8), d: 2.2, anchor: -1 });
  // a soft wash of colour over the WHOLE paper (a grid of big blobs plus the four corners), so no part is left white
  const wash = [[0, 0], [W, 0], [0, H], [W, H]];
  for (let gx = 0; gx < 4; gx++) for (let gy = 0; gy < 3; gy++) wash.push([120 + gx * 240 + rnd(-40, 40), 100 + gy * 200 + rnd(-40, 40)]);
  wash.forEach(function (p) { blobs.push({ x: p[0], y: p[1], R: rnd(260, 320), c: pick(pal.c), t0: rnd(0.8, 3.4), d: 2.4, base: true, anchor: -1 }); });
  const shape = pick(Object.keys(SHAPES)), pts = SHAPES[shape](), path = new Path2D(); pts.forEach(function (p, i) { if (i) path.lineTo(p[0], p[1]); else path.moveTo(p[0], p[1]); }); path.closePath();
  const pi = Math.floor(Math.random() * 3), pj = (pi + 1 + Math.floor(Math.random() * 2)) % 3;       // two colours only, so the mix inside the shape stays bright
  const fill = [{ x: W / 2 - 80, y: H / 2 + rnd(-30, 30), R: rnd(190, 240), c: pal.c[pi], t0: 0, d: 2.0 }, { x: W / 2 + 80, y: H / 2 + rnd(-30, 30), R: rnd(190, 240), c: pal.c[pj], t0: 0.6, d: 2.0 }, { x: W / 2, y: H / 2 + 90, R: rnd(120, 160), c: pal.c[pi], t0: 1.2, d: 1.6 }];
  return { pal: pal, blobs: blobs, shape: shape, pts: pts, path: path, fill: fill, seen: {}, said: null, sparks: [], t: 0 };
}
function blob(ctx, b, f, k) {
  const r = b.R * ease(f); if (r < 2) return; k = k || 1;
  const g = ctx.createRadialGradient(b.x, b.y, r * 0.05, b.x, b.y, r);
  g.addColorStop(0, rgba(b.c, 0.85 * k)); g.addColorStop(0.62, rgba(b.c, 0.68 * k)); g.addColorStop(1, rgba(b.c, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, Math.PI * 2); ctx.fill();
}
function outline(ctx, G, p) {
  const n = G.pts.length, upto = Math.max(1, Math.floor(p * n));
  function trace(to) { ctx.beginPath(); ctx.moveTo(G.pts[0][0], G.pts[0][1]); for (let i = 1; i <= to; i++) ctx.lineTo(G.pts[i % n][0], G.pts[i % n][1]); }
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  trace(upto); ctx.strokeStyle = 'rgba(255,255,255,.92)'; ctx.lineWidth = 30; ctx.stroke();
  for (let i = 1; i <= upto; i++) { ctx.beginPath(); ctx.moveTo(G.pts[i - 1][0], G.pts[i - 1][1]); ctx.lineTo(G.pts[i % n][0], G.pts[i % n][1]); ctx.strokeStyle = lerpHex(G.pal.c[0], G.pal.c[1], (i / n)); ctx.lineWidth = 16; ctx.stroke(); }
}

/* ---------- draw the picture for time t (seconds). Everything is drawn again each frame, so mixing is always clean. ---------- */
function render(t) {
  const G = M.G, ctx = M.ctx, T1 = DUR.pools, T2 = T1 + DUR.outline, T3 = T2 + DUR.fill;
  ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';
  G.blobs.forEach(function (b) { if (b.base && t > b.t0) blob(ctx, b, (t - b.t0) / b.d, 0.62); });        // the wash over the whole paper
  ctx.globalCompositeOperation = 'multiply';
  G.blobs.forEach(function (b) { if (!b.base && t > b.t0) blob(ctx, b, (t - b.t0) / b.d); });          // the pools that overlap and mix
  ctx.globalCompositeOperation = 'source-over';
  if (t > T2) {
    const f = clamp((t - T2) / DUR.fill);
    ctx.save(); ctx.clip(G.path); ctx.fillStyle = 'rgba(255,255,255,' + ease(f * 3).toFixed(2) + ')'; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'multiply'; G.fill.forEach(function (b) { const ff = (t - T2 - b.t0) / b.d; if (ff > 0) blob(ctx, b, ff, 0.8); });
    ctx.restore(); ctx.globalCompositeOperation = 'source-over';
  }
  if (t > T1) outline(ctx, G, clamp((t - T1) / DUR.outline));
  if (t > T3 && t < T3 + DUR.spark) {                      // a little sparkle at the end
    ctx.fillStyle = '#fff'; G.sparks.forEach(function (s, i) { const a = Math.abs(Math.sin((t - T3) * 7 + i)); if (a > 0.3) { ctx.save(); ctx.translate(s[0], s[1]); ctx.rotate(i); ctx.globalAlpha = a; ctx.fillRect(-2, -14, 4, 28); ctx.fillRect(-14, -2, 28, 4); ctx.restore(); } });
  }
}
/* the sentence under the picture while colours mix */
function say(html, mood) { M.ui.say.innerHTML = html; M.ui.say.className = 'st-say' + (mood ? ' ' + mood : ''); }
function swatch(c) { return '<span class="sw" style="background:' + c + '"></span>'; }
function announce(G, t) {
  const T1 = DUR.pools, T2 = T1 + DUR.outline, T3 = T2 + DUR.fill;
  if (t < T1) {
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
      const key = i + '-' + j; if (G.seen[key]) continue; const a = G.blobs[i], b = G.blobs[j];
      const ra = a.R * ease((t - a.t0) / a.d), rb = b.R * ease((t - b.t0) / b.d), d = Math.hypot(a.x - b.x, a.y - b.y);
      if (t - (G.said ? G.said.t : -9) > 1.2 && ra + rb > d * 1.15 && ra > 5 && rb > 5) {
        G.seen[key] = true; G.said = { t: t }; const na = G.pal.n[i], nb = G.pal.n[j];
        say(swatch(G.pal.c[i]) + ' + ' + swatch(G.pal.c[j]) + ' = ' + swatch(mulHex(G.pal.c[i], G.pal.c[j])) + ' <b>' + na + ' + ' + nb + ' = ' + mixName(na, nb) + '!</b>', 'mix'); CC.sfx.pop();
      }
    }
    if (!G.said && t < 0.2) say('✨ Pouring paint… watch the colours mix!');
  } else if (t < T2) { if (G.stage !== 2) { G.stage = 2; say('✏️ Now I am drawing ' + SHAPE_NAMES[G.shape] + '…'); } }
  else if (t < T3) { if (G.stage !== 3) { G.stage = 3; say('🎨 Filling it with mixing colours…'); } }
}

/* ---------- run the magic ---------- */
function start() {
  if (M.running) return;
  M.hist.push(ST.canvasEntry(M.ctx, W, H));
  M.G = plan(); M.G.sparks = M.G.pts.filter(function (p, i) { return i % Math.max(1, Math.floor(M.G.pts.length / 18)) === 0; });
  M.running = true; M.t0 = performance.now(); M.t = 0; setRunning(true); CC.sfx.letsGo && CC.sfx.letsGo();
  announce(M.G, 0); render(0); loop();
}
function total() { return DUR.pools + DUR.outline + DUR.fill + DUR.spark; }
function loop() {
  cancelAnimationFrame(M.raf);
  function frame(now) {
    if (!M.running) return;
    M.t = (now - M.t0) / 1000;
    if (now - (M.lastDraw || 0) >= 30) { M.lastDraw = now; step(); }          // about 30 pictures a second is plenty and kind to older computers
    if (M.running) M.raf = requestAnimationFrame(frame);
  }
  M.raf = requestAnimationFrame(frame);
  M.timer = setTimeout(function guard() { if (M.running) { M.t = (performance.now() - M.t0) / 1000; step(); if (M.running) M.timer = setTimeout(guard, 120); } }, 250);   // keeps going even if the page is not being drawn
}
function step() {
  const t = Math.min(M.t, total()); announce(M.G, t); render(t);
  M.ui.prog.style.width = (t / total() * 100).toFixed(0) + '%';
  if (M.t >= total()) finish();
}
function finish() {
  if (!M.running) return; M.running = false; cancelAnimationFrame(M.raf); clearTimeout(M.timer);
  render(total() + 5);                                      // the finished picture, without the sparkles
  M.ui.prog.style.width = '100%'; setRunning(false); CC.sfx.levelComplete();
  say('🎉 Ta-da! Your painting is ready. You can paint on it too!', 'done');
}
function skip() { if (!M.running) return; M.t = total(); step(); }
function setRunning(on) {
  M.ui.root.classList.toggle('running', on);
  M.ui.magic.hidden = on; M.ui.skip.hidden = !on; M.ui.canvas.style.pointerEvents = on ? 'none' : '';
}

/* ---------- the screen: the same layout as every painting program ---------- */
function show() {
  CC.ui.close(); M.hist.clear();
  const s = ST.shell($root(), { hint: 'Press Magic! and watch the colours mix. Then paint on it if you like.' }); M.ui.root = s.wrap;
  ST.action(s.left, '↩️', 'Undo', function () { if (!M.running && M.hist.undo()) CC.sfx.tick(); });
  ST.action(s.left, '↪️', 'Redo', function () { if (!M.running && M.hist.redo()) CC.sfx.tick(); });
  ST.action(s.left, '🧹', 'Start again', function () { if (!M.running) ST.confirm($stage(), 'Start again?', 'This clears your painting.', function () { M.hist.push(ST.canvasEntry(M.ctx, W, H)); M.ctx.fillStyle = '#fff'; M.ctx.fillRect(0, 0, W, H); say('Press Magic! to make a painting. Watch the colours mix!'); }); });
  ST.action(s.right, '💾', 'Save', save, 'primary'); ST.action(s.right, '🖨️', 'Print', function () { window.print(); });
  ST.tool(s.rail, 'brush', '🖌️', 'Brush', function (id) { M.tool = id; }, true); ST.tool(s.rail, 'eraser', '🩹', 'Rubber', function (id) { M.tool = id; }, false);
  const mk = ST.section(s.side, 'Make magic');
  M.ui.magic = ST.action(mk, '✨', 'Magic!', start, 'primary magic'); M.ui.skip = ST.action(mk, '⏩', 'Finish now', skip); M.ui.skip.hidden = true;
  const pg = el('div', 'st-prog'); M.ui.prog = el('i'); pg.appendChild(M.ui.prog); mk.appendChild(pg);
  mk.appendChild(el('p', 'st-note', 'Pools of colour grow and mix, then a shape is drawn and filled.'));
  const col = ST.section(s.side, 'Colour'); col.classList.add('st-lockable'); ST.palette(col, M.colour, function (c) { M.colour = c; M.tool = 'brush'; ST.setTool(s.rail, 'brush'); });
  const sz = ST.section(s.side, 'Size'); ST.slider(sz, 'Brush size', 4, 50, M.size, function (v) { M.size = v; }, true);
  const stk = ST.stack(s.paper); const cv = ST.canvas(stk, W, H, 'solid'); M.cv = cv; M.ctx = cv.getContext('2d'); M.ui.canvas = cv; M.ctx.fillStyle = '#fff'; M.ctx.fillRect(0, 0, W, H);
  M.ui.say = el('div', 'st-say', ''); stk.appendChild(M.ui.say); say('Press Magic! to make a painting. Watch the colours mix!');
  ST.freehand(cv, { state: function () { return { colour: M.colour, size: M.size, tool: M.tool }; }, enabled: function () { return !M.running; }, before: function () { M.hist.push(ST.canvasEntry(M.ctx, W, H)); }, eraserPaints: '#ffffff' });
}
function save() { M.cv.toBlob(function (b) { PC.download(b, 'my-magic-painting.png'); }, 'image/png'); }

CC.modes.magic = {
  makey: false,
  enter: function () { CC.audio.init(); CC.watchStage($stage()); M.running = false; show(); },
  exit: function () { M.running = false; cancelAnimationFrame(M.raf); clearTimeout(M.timer); CC.ui.close(); },
  onKeyDown: function (e) {
    if (e.ctrlKey || e.metaKey) { const k = e.key.toLowerCase(); if (k === 'z' && !M.running) { e.preventDefault(); if (e.shiftKey) M.hist.redo(); else M.hist.undo(); } else if (k === 'y' && !M.running) { e.preventDefault(); M.hist.redo(); } }
    else if ((e.key === 'Enter' || e.key === ' ') && !M.running && e.target === document.body) { e.preventDefault(); start(); }
  },
  /* test hooks */
  _M: M, _start: start, _finish: skip, _at: function (t) { if (!M.G) { M.G = plan(); M.G.sparks = []; } announce(M.G, t); render(t); }
};
})();
