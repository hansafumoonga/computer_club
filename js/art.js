/* art.js - Art Studio (Year 2). A fuller painting program: pencil, marker, spray and rainbow brushes, shapes, stamps, a paint bucket,
   a mirror mode, undo and redo, and a background you can choose and change. Paintings can be saved and printed.
   Nothing is stored or sent anywhere. */
(function () {
'use strict';
const CC = window.CC, PC = CC.PCOM, W = 960, H = 600;
const $stage = function () { return document.getElementById('stage-art'); };
const $root = function () { return document.getElementById('art-root'); };
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

const TOOLS = [['pencil', '✏️', 'Pencil'], ['marker', '🖍️', 'Marker'], ['spray', '🌬️', 'Spray'], ['rainbow', '🌈', 'Rainbow'], ['fill', '🪣', 'Fill'], ['stamp', '⭐', 'Stamps'],
  ['line', '➖', 'Line'], ['rect', '⬜', 'Box'], ['circle', '⚪', 'Circle'], ['tri', '🔺', 'Triangle'], ['star', '🌟', 'Star'], ['eraser', '🩹', 'Rubber']];
const STAMPS = ['⭐', '❤️', '🌸', '🌈', '☀️', '🌙', '🐶', '🐱', '🦋', '🐟', '🚗', '🏠', '🌳', '🎈', '🍎', '🦄'];
const A = { tool: 'pencil', colour: '#2f6bff', size: 10, filled: true, mirror: false, stamp: '⭐', bg: 'white', solid: null, undo: [], redo: [], cv: null, ctx: null, pv: null, pctx: null, bgBox: null, hue: 0 };

function snapNow() { return A.ctx.getImageData(0, 0, W, H); }
function pushUndo() { A.undo.push(snapNow()); if (A.undo.length > 15) A.undo.shift(); A.redo = []; }
function undo() { if (!A.undo.length) { CC.sfx.step && CC.sfx.step(); return; } A.redo.push(snapNow()); A.ctx.putImageData(A.undo.pop(), 0, 0); CC.sfx.tick(); }
function redo() { if (!A.redo.length) { CC.sfx.step && CC.sfx.step(); return; } A.undo.push(snapNow()); A.ctx.putImageData(A.redo.pop(), 0, 0); CC.sfx.tick(); }

/* paint bucket: colours the area that is the same colour as the spot you clicked, up to the lines */
function floodFill(x, y, hex) {
  const ctx = A.ctx, img = ctx.getImageData(0, 0, W, H), d = img.data, sx = Math.round(x), sy = Math.round(y);
  if (sx < 0 || sy < 0 || sx >= W || sy >= H) return;
  const n = hexRGB(hex), i0 = (sy * W + sx) * 4, t = [d[i0], d[i0 + 1], d[i0 + 2], d[i0 + 3]];
  if (t[3] === 255 && Math.abs(t[0] - n[0]) + Math.abs(t[1] - n[1]) + Math.abs(t[2] - n[2]) < 6) return;
  function near(i) { return Math.abs(d[i] - t[0]) + Math.abs(d[i + 1] - t[1]) + Math.abs(d[i + 2] - t[2]) + Math.abs(d[i + 3] - t[3]) <= 90; }
  const seen = new Uint8Array(W * H), stack = [sx, sy];
  while (stack.length) {
    const cy = stack.pop(), cx = stack.pop(); let lx = cx;
    while (lx >= 0 && !seen[cy * W + lx] && near((cy * W + lx) * 4)) lx--; lx++;
    let up = false, down = false;
    for (let px = lx; px < W && !seen[cy * W + px] && near((cy * W + px) * 4); px++) {
      const k = cy * W + px; seen[k] = 1; d[k * 4] = n[0]; d[k * 4 + 1] = n[1]; d[k * 4 + 2] = n[2]; d[k * 4 + 3] = 255;
      if (cy > 0) { const u = (cy - 1) * W + px; if (!seen[u] && near(u * 4)) { if (!up) { stack.push(px, cy - 1); up = true; } } else up = false; }
      if (cy < H - 1) { const dn = (cy + 1) * W + px; if (!seen[dn] && near(dn * 4)) { if (!down) { stack.push(px, cy + 1); down = true; } } else down = false; }
    }
  }
  ctx.putImageData(img, 0, 0);
}
function hexRGB(h) { if (h.charAt(0) === '#' && h.length === 4) h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3]; const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }

/* shapes, drawn inside the box from (x0,y0) to (x1,y1) */
function shapePath(ctx, kind, x0, y0, x1, y1) {
  const l = Math.min(x0, x1), t = Math.min(y0, y1), w = Math.abs(x1 - x0), h = Math.abs(y1 - y0); ctx.beginPath();
  if (kind === 'line') { ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); }
  else if (kind === 'rect') ctx.rect(l, t, w, h);
  else if (kind === 'circle') ctx.ellipse(l + w / 2, t + h / 2, Math.max(1, w / 2), Math.max(1, h / 2), 0, 0, Math.PI * 2);
  else if (kind === 'tri') { ctx.moveTo(l + w / 2, t); ctx.lineTo(l + w, t + h); ctx.lineTo(l, t + h); ctx.closePath(); }
  else if (kind === 'star') { const cx = l + w / 2, cy = t + h / 2, R = Math.min(w, h) / 2; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? R * 0.42 : R; ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } ctx.closePath(); }
}
function drawShape(ctx, kind, a, b) {
  shapePath(ctx, kind, a[0], a[1], b[0], b[1]); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(2, A.size * 0.6); ctx.strokeStyle = A.colour; ctx.fillStyle = A.colour;
  if (A.filled && kind !== 'line') ctx.fill(); ctx.stroke();
}

/* ---------- drawing with the brushes (also on the mirror side when mirror is on) ---------- */
function seg(ctx, a, b, kind) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (kind === 'spray') {
    ctx.fillStyle = A.colour; const R = A.size * 1.8; for (let i = 0; i < 14; i++) { const ang = Math.random() * 6.283, r = Math.sqrt(Math.random()) * R; ctx.globalAlpha = 0.5; ctx.fillRect(b[0] + Math.cos(ang) * r, b[1] + Math.sin(ang) * r, 2.4, 2.4); } ctx.globalAlpha = 1; return;
  }
  ctx.strokeStyle = kind === 'rainbow' ? 'hsl(' + (A.hue % 360) + ',90%,55%)' : A.colour;
  ctx.lineWidth = kind === 'marker' ? A.size * 1.7 : kind === 'eraser' ? A.size * 1.8 : kind === 'rainbow' ? A.size * 1.2 : Math.max(2, A.size * 0.5);
  ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0] + 0.01, b[1]); ctx.stroke();
}
function both(fn) { fn(false); if (A.mirror) fn(true); }
function mir(p, m) { return m ? [W - p[0], p[1]] : p; }

function stage() {
  const w = el('div', 'pt-paint'), bar = el('div', 'pt-bar');
  function btn(icon, label, fn, cls) { const b = el('button', 'btn' + (cls ? ' ' + cls : ''), icon + ' ' + label); b.type = 'button'; b.addEventListener('click', function () { b.blur(); fn(b); }); bar.appendChild(b); return b; }
  btn('↩️', 'Undo', undo); btn('↪️', 'Redo', redo);
  btn('🧹', 'Start again', askClear);
  const mb = btn('🪞', 'Mirror', function (b) { A.mirror = !A.mirror; b.classList.toggle('on', A.mirror); }); mb.classList.toggle('on', A.mirror);
  const fb = btn('🎨', 'Shapes filled', function (b) { A.filled = !A.filled; b.textContent = (A.filled ? '🎨 Shapes filled' : '🔲 Shapes outline'); }); fb.textContent = A.filled ? '🎨 Shapes filled' : '🔲 Shapes outline';
  const bgb = btn('🖼️', 'Background', function (b) { bgPanel.hidden = !bgPanel.hidden; b.classList.toggle('on', !bgPanel.hidden); });
  btn('💾', 'Save', save, 'primary'); btn('🖨️', 'Print', function () { window.print(); });
  w.appendChild(bar);
  const bgPanel = PC.backgroundPicker(A.bg, function (id) { A.bg = id; A.solid = null; A.bgBox.innerHTML = PC.bgInner(A.bg, A.solid); CC.sfx.pop(); }); bgPanel.hidden = true; w.appendChild(bgPanel);
  // the tools
  const tools = el('div', 'ar-tools'), tbtn = {};
  TOOLS.forEach(function (t) { const b = el('button', 'ar-tool' + (A.tool === t[0] ? ' on' : '')); b.type = 'button'; b.title = t[2]; b.setAttribute('aria-label', t[2]); b.innerHTML = '<span>' + t[1] + '</span><small>' + t[2] + '</small>';
    b.addEventListener('click', function () { b.blur(); A.tool = t[0]; Object.keys(tbtn).forEach(function (k) { tbtn[k].classList.toggle('on', k === t[0]); }); stampRow.hidden = t[0] !== 'stamp'; }); tools.appendChild(b); tbtn[t[0]] = b; });
  w.appendChild(tools);
  const stampRow = el('div', 'ar-stamps'); stampRow.hidden = A.tool !== 'stamp';
  STAMPS.forEach(function (s) { const b = el('button', 'ar-stamp' + (s === A.stamp ? ' on' : ''), s); b.type = 'button'; b.addEventListener('click', function () { b.blur(); A.stamp = s; stampRow.querySelectorAll('.ar-stamp').forEach(function (x) { x.classList.toggle('on', x === b); }); }); stampRow.appendChild(b); });
  w.appendChild(stampRow);
  // the paper: background, painting, and a preview layer for shapes and the marker
  const paper = el('div', 'pt-paper'); w.appendChild(paper);
  const stack = el('div', 'pt-stack'); paper.appendChild(stack);
  const bgBox = el('div', 'pt-bgbox'); bgBox.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 300" preserveAspectRatio="none"><g></g></svg>'; stack.appendChild(bgBox);
  A.bgBox = bgBox.querySelector('g'); A.bgBox.innerHTML = PC.bgInner(A.bg, A.solid);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.className = 'pt-canvas'; stack.appendChild(cv); A.cv = cv; A.ctx = cv.getContext('2d');
  const pv = document.createElement('canvas'); pv.width = W; pv.height = H; pv.className = 'pt-canvas ar-preview'; pv.style.pointerEvents = 'none'; stack.appendChild(pv); A.pv = pv; A.pctx = pv.getContext('2d');
  // size and colour
  const opt = el('div', 'pt-tools'); opt.appendChild(el('span', 'ar-lab', 'Size'));
  const sl = document.createElement('input'); sl.type = 'range'; sl.min = 3; sl.max = 50; sl.value = A.size; sl.className = 'ar-size'; sl.setAttribute('aria-label', 'brush size'); sl.addEventListener('input', function () { A.size = +sl.value; }); opt.appendChild(sl);
  w.appendChild(opt);
  w.appendChild(PC.palette(A.colour, function (c) { A.colour = c; if (A.tool === 'eraser') { A.tool = 'pencil'; Object.keys(tbtn).forEach(function (k) { tbtn[k].classList.toggle('on', k === 'pencil'); }); } }, true));
  // pointer handling
  let drawing = false, last = null, start = null, pts = null;
  function pos(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; }
  cv.addEventListener('pointerdown', function (e) {
    e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (x) { }
    const p = pos(e), t = A.tool;
    if (t === 'fill') { pushUndo(); floodFill(p[0], p[1], A.colour); if (A.mirror) floodFill(W - p[0], p[1], A.colour); CC.sfx.pop(); return; }
    if (t === 'stamp') { pushUndo(); const c = A.ctx; c.font = (A.size * 4 + 28) + 'px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; both(function (m) { const q = mir(p, m); c.fillText(A.stamp, q[0], q[1]); }); CC.sfx.pop(); return; }
    drawing = true; pushUndo(); last = p; start = p; A.hue = 0;
    if (t === 'marker') { pts = [p]; A.pctx.clearRect(0, 0, W, H); pv.style.opacity = '.55'; }
    if (['pencil', 'spray', 'rainbow', 'eraser'].indexOf(t) >= 0) both(function (m) { seg(A.ctx, mir(p, m), mir(p, m), t === 'eraser' ? 'eraser' : t); });
  });
  cv.addEventListener('pointermove', function (e) {
    if (!drawing) return; const p = pos(e), t = A.tool; A.hue += 6;
    if (t === 'marker') { both(function (m) { A.pctx.globalCompositeOperation = 'source-over'; seg(A.pctx, mir(last, m), mir(p, m), 'marker'); }); }
    else if (['pencil', 'spray', 'rainbow'].indexOf(t) >= 0) both(function (m) { A.ctx.globalCompositeOperation = 'source-over'; seg(A.ctx, mir(last, m), mir(p, m), t); });
    else if (t === 'eraser') both(function (m) { A.ctx.globalCompositeOperation = 'destination-out'; seg(A.ctx, mir(last, m), mir(p, m), 'eraser'); A.ctx.globalCompositeOperation = 'source-over'; });
    else { A.pctx.clearRect(0, 0, W, H); pv.style.opacity = '1'; both(function (m) { drawShape(A.pctx, t, mir(start, m), mir(p, m)); }); }
    last = p;
  });
  function end(e) {
    if (!drawing) return; drawing = false; const t = A.tool;
    if (t === 'marker') { A.ctx.globalAlpha = 0.55; A.ctx.drawImage(pv, 0, 0); A.ctx.globalAlpha = 1; A.pctx.clearRect(0, 0, W, H); }
    else if (['line', 'rect', 'circle', 'tri', 'star'].indexOf(t) >= 0) { A.ctx.drawImage(pv, 0, 0); A.pctx.clearRect(0, 0, W, H); }
    A.ctx.globalCompositeOperation = 'source-over'; last = null; start = null;
  }
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  const r = $root(); r.innerHTML = ''; r.appendChild(w);
}
function askClear() {
  CC.ui.show($stage(), { emoji: '🧹', title: 'Start again?', text: 'This clears your painting.', buttons: [
    { icon: '✅', label: 'Yes', primary: true, keys: ['Enter'], fn: function () { pushUndo(); A.ctx.clearRect(0, 0, W, H); } }, { icon: '✖️', label: 'No', fn: function () { } }] });
}
function save() {
  const out = document.createElement('canvas'); out.width = W; out.height = H; const o = out.getContext('2d'), img = new Image();
  img.onload = function () { o.drawImage(img, 0, 0, W, H); o.drawImage(A.cv, 0, 0); out.toBlob(function (b) { PC.download(b, 'my-art.png'); }, 'image/png'); };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 300" width="' + W + '" height="' + H + '">' + PC.bgInner(A.bg, A.solid) + '</svg>');
}

CC.modes.art = {
  makey: false,
  enter: function () { CC.audio.init(); CC.watchStage($stage()); A.undo = []; A.redo = []; stage(); },
  exit: function () { CC.ui.close(); },
  onKeyDown: function (e) { if (e.ctrlKey || e.metaKey) { const k = e.key.toLowerCase(); if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); } else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); redo(); } } },
  /* test hooks */
  _A: A, _undo: undo, _redo: redo, _fill: floodFill
};
})();
