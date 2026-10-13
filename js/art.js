/* art.js - Art Studio (Years 2 and 3) and Design Studio (Years 4 to 6): the same program, the same look, more tools each step.
   Art Studio: pencil, marker, spray and rainbow brushes, shapes, stamps, a paint bucket, a mirror, undo and redo, backgrounds.
   Design Studio adds: soft brush, calligraphy pen, colour picker, text, opacity, symmetry (mirror, four-way, radial) and LAYERS.
   Paintings can be saved and printed. Nothing is stored or sent anywhere. */
(function () {
'use strict';
const CC = window.CC, PC = CC.PCOM, ST = CC.ST, el = ST.el, W = 960, H = 600;

const BASIC = [['pencil', '✏️', 'Pencil'], ['marker', '🖍️', 'Marker'], ['spray', '🌬️', 'Spray'], ['rainbow', '🌈', 'Rainbow'], ['fill', '🪣', 'Fill'], ['stamp', '⭐', 'Stamps'],
  ['line', '➖', 'Line'], ['rect', '⬜', 'Box'], ['circle', '⚪', 'Circle'], ['tri', '🔺', 'Triangle'], ['star', '🌟', 'Star'], ['eraser', '🩹', 'Rubber']];
const ADVANCED = [['pencil', '✏️', 'Pencil'], ['soft', '🖌️', 'Soft brush'], ['marker', '🖍️', 'Marker'], ['callig', '🖋️', 'Calligraphy'], ['spray', '🌬️', 'Spray'], ['rainbow', '🌈', 'Rainbow'],
  ['fill', '🪣', 'Fill'], ['pick', '💧', 'Picker'], ['text', '🔤', 'Text'], ['stamp', '⭐', 'Stamps'], ['line', '➖', 'Line'], ['rect', '⬜', 'Box'],
  ['circle', '⚪', 'Circle'], ['tri', '🔺', 'Triangle'], ['star', '🌟', 'Star'], ['eraser', '🩹', 'Rubber']];
const STAMPS = ['⭐', '❤️', '🌸', '🌈', '☀️', '🌙', '🐶', '🐱', '🦋', '🐟', '🚗', '🏠', '🌳', '🎈', '🍎', '🦄'];
const SYMS = [['off', 'Off'], ['mirror', 'Mirror'], ['quad', 'Four-way'], ['r6', 'Radial 6'], ['r8', 'Radial 8']];
const SHAPES = ['line', 'rect', 'circle', 'tri', 'star'];

function hexRGB(h) { if (h.charAt(0) === '#' && h.length === 4) h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3]; const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }

/* paint bucket: colours the area that is the same colour as the spot you clicked, up to the lines */
function floodFill(ctx, x, y, hex) {
  const img = ctx.getImageData(0, 0, W, H), d = img.data, sx = Math.round(x), sy = Math.round(y);
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
function shapePath(ctx, kind, x0, y0, x1, y1) {
  const l = Math.min(x0, x1), t = Math.min(y0, y1), w = Math.abs(x1 - x0), h = Math.abs(y1 - y0); ctx.beginPath();
  if (kind === 'line') { ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); }
  else if (kind === 'rect') ctx.rect(l, t, w, h);
  else if (kind === 'circle') ctx.ellipse(l + w / 2, t + h / 2, Math.max(1, w / 2), Math.max(1, h / 2), 0, 0, Math.PI * 2);
  else if (kind === 'tri') { ctx.moveTo(l + w / 2, t); ctx.lineTo(l + w, t + h); ctx.lineTo(l, t + h); ctx.closePath(); }
  else if (kind === 'star') { const cx = l + w / 2, cy = t + h / 2, R = Math.min(w, h) / 2; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? R * 0.42 : R; ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } ctx.closePath(); }
}

function make(adv) {
  const stageId = adv ? 'stage-design' : 'stage-art', rootId = adv ? 'design-root' : 'art-root';
  const $stage = function () { return document.getElementById(stageId); }, $root = function () { return document.getElementById(rootId); };
  const A = { tool: 'pencil', colour: '#2f6bff', size: 10, opacity: 100, filled: true, sym: 'off', stamp: '⭐', bg: 'white', solid: null, layers: [], active: 0, hist: ST.history(25), hue: 0, bgBox: null, pv: null, pctx: null, stk: null, ui: {}, cur: null };

  /* the points a stroke is repeated at, for the chosen symmetry */
  function variants(p, forShape) {
    const s = A.sym; if (s === 'off') return [p];
    if (s === 'mirror') return [p, [W - p[0], p[1]]];
    if (s === 'quad') return [p, [W - p[0], p[1]], [p[0], H - p[1]], [W - p[0], H - p[1]]];
    if (forShape) return [p];
    const n = s === 'r6' ? 6 : 8, cx = W / 2, cy = H / 2, dx = p[0] - cx, dy = p[1] - cy, out = [];
    for (let k = 0; k < n; k++) { const a = k * Math.PI * 2 / n, c = Math.cos(a), sn = Math.sin(a); out.push([cx + dx * c - dy * sn, cy + dx * sn + dy * c]); }
    return out;
  }
  function active() { return A.layers[A.active]; }
  function entry() { const L = active(); A.hist.push(ST.canvasEntry(L.ctx, W, H)); }

  /* ---- drawing with the brushes ---- */
  function seg(ctx, a, b, kind, direct) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (kind === 'spray') {
      ctx.fillStyle = A.colour; const R = A.size * 1.8; ctx.globalAlpha = 0.5 * (direct ? A.opacity / 100 : 1);
      for (let i = 0; i < 14; i++) { const ang = Math.random() * 6.283, r = Math.sqrt(Math.random()) * R; ctx.fillRect(b[0] + Math.cos(ang) * r, b[1] + Math.sin(ang) * r, 2.4, 2.4); } ctx.globalAlpha = 1; return;
    }
    if (kind === 'soft') {
      const dist = Math.hypot(b[0] - a[0], b[1] - a[1]), step = Math.max(2, A.size / 4), n = Math.max(1, Math.ceil(dist / step)), r = A.size;
      for (let i = 1; i <= n; i++) { const x = a[0] + (b[0] - a[0]) * i / n, y = a[1] + (b[1] - a[1]) * i / n, g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, hexA(A.colour, 0.28)); g.addColorStop(1, hexA(A.colour, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill(); }
      return;
    }
    if (kind === 'callig') {
      const dist = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(dist / 2)); ctx.fillStyle = A.colour;
      for (let i = 1; i <= n; i++) { const x = a[0] + (b[0] - a[0]) * i / n, y = a[1] + (b[1] - a[1]) * i / n; ctx.save(); ctx.translate(x, y); ctx.rotate(-Math.PI / 4); ctx.fillRect(-A.size * 0.6, -A.size * 0.12, A.size * 1.2, A.size * 0.24); ctx.restore(); }
      return;
    }
    ctx.strokeStyle = kind === 'rainbow' ? 'hsl(' + (A.hue % 360) + ',90%,55%)' : A.colour;
    ctx.lineWidth = kind === 'marker' ? A.size * 1.7 : kind === 'eraser' ? A.size * 1.8 : kind === 'rainbow' ? A.size * 1.2 : Math.max(2, A.size * 0.5);
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0] + 0.01, b[1]); ctx.stroke();
  }
  function hexA(h, a) { const c = hexRGB(h); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function drawShape(ctx, kind, a, b) {
    shapePath(ctx, kind, a[0], a[1], b[0], b[1]); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(2, A.size * 0.6); ctx.strokeStyle = A.colour; ctx.fillStyle = A.colour;
    if (A.filled && kind !== 'line') ctx.fill(); ctx.stroke();
  }

  /* ---- the screen ---- */
  function build() {
    CC.ui.close(); A.hist.clear(); A.layers = []; A.active = 0;
    const tools = adv ? ADVANCED : BASIC;
    const s = ST.shell($root(), { hint: adv ? 'Ctrl+Z undo · Ctrl+Y redo · pick a tool on the left, a colour on the right.' : 'Pick a tool on the left and a colour on the right, then paint!' });
    s.rail.classList.add('cols2'); A.ui.shell = s;
    ST.action(s.left, '↩️', 'Undo', function () { if (A.hist.undo()) CC.sfx.tick(); });
    ST.action(s.left, '↪️', 'Redo', function () { if (A.hist.redo()) CC.sfx.tick(); });
    ST.action(s.left, '🧹', 'Start again', function () { ST.confirm($stage(), 'Start again?', 'This clears your painting.', function () { const es = A.layers.map(function (L) { return ST.canvasEntry(L.ctx, W, H); }); A.hist.push(ST.groupEntry(es)); A.layers.forEach(function (L) { L.ctx.clearRect(0, 0, W, H); }); }); });
    ST.action(s.right, '💾', 'Save', save, 'primary'); ST.action(s.right, '🖨️', 'Print', function () { window.print(); });
    tools.forEach(function (t) { ST.tool(s.rail, t[0], t[1], t[2], function (id) { A.tool = id; context(); }, A.tool === t[0]); });
    // side panel
    const col = ST.section(s.side, 'Colour'); A.ui.pal = ST.palette(col, A.colour, function (c) { A.colour = c; if (A.tool === 'eraser') { A.tool = 'pencil'; ST.setTool(s.rail, 'pencil'); context(); } }, true);
    const sz = ST.section(s.side, 'Size'); ST.slider(sz, 'Size', 3, 60, A.size, function (v) { A.size = v; }, true);
    if (adv) ST.slider(sz, 'Opacity %', 10, 100, A.opacity, function (v) { A.opacity = v; }, false);
    const op = ST.section(s.side, adv ? 'Symmetry' : 'Mirror');
    if (adv) ST.choice(op, SYMS, A.sym, function (id) { A.sym = id; }); else ST.toggle(op, 'Mirror my painting', A.sym === 'mirror', function (on) { A.sym = on ? 'mirror' : 'off'; });
    if (adv) { A.ui.layerSec = ST.section(s.side, 'Layers'); }
    const bgs = ST.section(s.side, 'Background'); ST.backgrounds(bgs, A.bg, function (id) { const prev = [A.bg, A.solid]; A.bg = id; A.solid = null; A.bgBox.innerHTML = PC.bgInner(A.bg, null); A.hist.push({ undo: function () { A.bg = prev[0]; A.solid = prev[1]; A.bgBox.innerHTML = PC.bgInner(A.bg, A.solid); }, redo: function () { A.bg = id; A.solid = null; A.bgBox.innerHTML = PC.bgInner(id, null); } }); CC.sfx.pop(); });
    // the paper
    const stk = ST.stack(s.paper); A.stk = stk; A.bgBox = ST.bgLayer(stk, A.bg, A.solid);
    addLayer(true);
    const pv = ST.canvas(stk, W, H, 'st-preview'); pv.style.pointerEvents = 'none'; A.pv = pv; A.pctx = pv.getContext('2d');
    const top = ST.canvas(stk, W, H, 'st-top'); top.style.background = 'transparent'; A.ui.top = top;          // catches the mouse above every layer
    if (adv) renderLayers();
    context(); wire(top);
  }
  /* the strip above the paper: stamps, shape fill, or a hint for the text tool */
  function context() {
    const c = A.ui.shell.ctx; c.innerHTML = ''; c.hidden = true;
    if (A.tool === 'stamp') { c.hidden = false; STAMPS.forEach(function (s) { const b = el('button', 'st-stampbtn' + (s === A.stamp ? ' on' : ''), s); b.type = 'button'; b.addEventListener('click', function () { b.blur(); A.stamp = s; c.querySelectorAll('.st-stampbtn').forEach(function (x) { x.classList.toggle('on', x === b); }); }); c.appendChild(b); }); }
    else if (SHAPES.indexOf(A.tool) >= 0) { c.hidden = false; c.appendChild(el('span', 'st-ctxlab', 'Shape:')); ST.choice(c, [['f', 'Filled'], ['o', 'Outline']], A.filled ? 'f' : 'o', function (id) { A.filled = id === 'f'; }); }
    else if (A.tool === 'text') { c.hidden = false; c.appendChild(el('span', 'st-ctxlab', 'Click on the paper and type. Press Enter to place the text. Size sets how big.')); }
    else if (A.tool === 'pick') { c.hidden = false; c.appendChild(el('span', 'st-ctxlab', 'Click on your painting to pick up a colour.')); }
  }
  /* layers (Design Studio) */
  function addLayer(first) {
    const cv = ST.canvas(A.stk, W, H, 'st-layer'); cv.style.pointerEvents = 'none'; A.layers.push({ cv: cv, ctx: cv.getContext('2d'), visible: true, opacity: 100, name: 'Layer ' + (A.layers.length + 1) });
    A.active = A.layers.length - 1; if (A.pv && !first) { A.stk.insertBefore(cv, A.pv); }
  }
  function renderLayers() {
    const b = A.ui.layerSec; b.innerHTML = '';
    for (let i = A.layers.length - 1; i >= 0; i--) {
      const L = A.layers[i], row = el('div', 'st-layer-row' + (i === A.active ? ' on' : ''));
      const nm = el('button', 'nm', L.name); nm.type = 'button'; nm.addEventListener('click', function () { A.active = i; renderLayers(); });
      const eye = el('button', 'ic', L.visible ? '👁️' : '🚫'); eye.type = 'button'; eye.title = 'Show or hide'; eye.addEventListener('click', function () { L.visible = !L.visible; L.cv.style.display = L.visible ? '' : 'none'; renderLayers(); });
      const up = el('button', 'ic', '▲'); up.type = 'button'; up.title = 'Move up'; up.disabled = i === A.layers.length - 1; up.addEventListener('click', function () { moveLayer(i, 1); });
      const dn = el('button', 'ic', '▼'); dn.type = 'button'; dn.title = 'Move down'; dn.disabled = i === 0; dn.addEventListener('click', function () { moveLayer(i, -1); });
      const del = el('button', 'ic', '🗑️'); del.type = 'button'; del.title = 'Delete layer'; del.disabled = A.layers.length < 2; del.addEventListener('click', function () { removeLayer(i); });
      [nm, eye, up, dn, del].forEach(function (x) { row.appendChild(x); }); b.appendChild(row);
    }
    const add = el('button', 'st-chip', '＋ Add layer'); add.type = 'button'; add.disabled = A.layers.length >= 4; add.addEventListener('click', function () { addLayer(false); renderLayers(); }); b.appendChild(add);
    const lo = ST.slider(b, 'Layer opacity %', 10, 100, active().opacity, function (v) { active().opacity = v; active().cv.style.opacity = v / 100; }, false); void lo;
  }
  function moveLayer(i, d) {
    const j = i + d; if (j < 0 || j >= A.layers.length) return; const a = A.layers[i], b = A.layers[j]; A.layers[i] = b; A.layers[j] = a;
    if (d > 0) A.stk.insertBefore(b.cv, a.cv); else A.stk.insertBefore(a.cv, b.cv); if (A.active === i) A.active = j; else if (A.active === j) A.active = i; renderLayers();
  }
  function removeLayer(i) { const L = A.layers[i]; if (A.layers.length < 2) return; L.cv.remove(); A.layers.splice(i, 1); A.active = Math.min(A.active, A.layers.length - 1); renderLayers(); }

  /* the mouse */
  function wire(top) {
    let drawing = false, last = null, start = null, inp = null;
    function pos(e) { const r = top.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; }
    function composite() { const t = document.createElement('canvas'); t.width = W; t.height = H; const c = t.getContext('2d'); A.layers.forEach(function (L) { if (L.visible) { c.globalAlpha = L.opacity / 100; c.drawImage(L.cv, 0, 0); } }); return c; }
    function commitText(p, text) {
      if (!text) return; entry(); const c = active().ctx; c.save(); c.globalAlpha = A.opacity / 100; c.fillStyle = A.colour; c.font = 'bold ' + (A.size * 1.6 + 14) + 'px "Trebuchet MS",Arial,sans-serif'; c.textBaseline = 'middle';
      variants(p).forEach(function (q) { c.fillText(text, q[0], q[1]); }); c.restore(); CC.sfx.pop();
    }
    top.addEventListener('pointerdown', function (e) {
      if (inp) { inp.blur(); }
      e.preventDefault(); try { top.setPointerCapture(e.pointerId); } catch (x) { }
      const p = pos(e), t = A.tool, L = active();
      if (t === 'fill') { entry(); variants(p).forEach(function (q) { floodFill(L.ctx, q[0], q[1], A.colour); }); CC.sfx.pop(); return; }
      if (t === 'pick') { const c = composite(), d = c.getImageData(Math.round(p[0]), Math.round(p[1]), 1, 1).data; if (d[3] > 0) { const hex = '#' + [d[0], d[1], d[2]].map(function (v) { return v.toString(16).padStart(2, '0'); }).join(''); A.colour = hex; const cu = A.ui.pal.querySelector('.custom'); A.ui.pal.querySelectorAll('.st-sw').forEach(function (x) { x.classList.remove('on'); }); if (cu) { cu.style.setProperty('--c', hex); cu.classList.add('on'); } CC.sfx.pop(); A.ui.shell.foot.textContent = 'Picked ' + hex; } return; }
      if (t === 'text') {
        const box = top.getBoundingClientRect(), pr = A.stk.getBoundingClientRect(); inp = document.createElement('input'); inp.type = 'text'; inp.className = 'st-textin'; inp.placeholder = 'type…'; inp.maxLength = 40;
        inp.style.left = (e.clientX - pr.left) + 'px'; inp.style.top = (e.clientY - pr.top - 16) + 'px'; inp.style.color = A.colour; A.stk.appendChild(inp); void box;
        let done = false; const fin = function (ok) { if (done) return; done = true; const v = inp.value; inp.remove(); inp = null; if (ok) commitText(p, v); };
        inp.addEventListener('keydown', function (ev) { ev.stopPropagation(); if (ev.key === 'Enter') fin(true); else if (ev.key === 'Escape') fin(false); });
        inp.addEventListener('blur', function () { fin(inp && inp.value); }); setTimeout(function () { if (inp) inp.focus(); }, 0); return;
      }
      if (t === 'stamp') { entry(); const c = L.ctx; c.save(); c.globalAlpha = A.opacity / 100; c.font = (A.size * 4 + 28) + 'px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; variants(p).forEach(function (q) { c.fillText(A.stamp, q[0], q[1]); }); c.restore(); CC.sfx.pop(); return; }
      drawing = true; entry(); last = p; start = p; A.hue = 0;
      if (t === 'eraser') { variants(p).forEach(function (q) { L.ctx.globalCompositeOperation = 'destination-out'; seg(L.ctx, q, q, 'eraser'); }); L.ctx.globalCompositeOperation = 'source-over'; }
      else if (t === 'spray') variants(p).forEach(function (q) { seg(L.ctx, q, q, 'spray', true); });
      else if (SHAPES.indexOf(t) < 0) { A.pctx.clearRect(0, 0, W, H); A.pv.style.opacity = (A.opacity / 100) * (t === 'marker' ? 0.55 : 1); variants(p).forEach(function (q) { seg(A.pctx, q, q, t); }); }
    });
    top.addEventListener('pointermove', function (e) {
      if (!drawing) return; const p = pos(e), t = A.tool, L = active(); A.hue += 6;
      if (t === 'eraser') variants(p).forEach(function (q, i) { const l = variants(last)[i]; L.ctx.globalCompositeOperation = 'destination-out'; seg(L.ctx, l, q, 'eraser'); L.ctx.globalCompositeOperation = 'source-over'; });
      else if (t === 'spray') variants(p).forEach(function (q) { seg(L.ctx, q, q, 'spray', true); });
      else if (SHAPES.indexOf(t) >= 0) { A.pctx.clearRect(0, 0, W, H); A.pv.style.opacity = A.opacity / 100; const s1 = variants(start, true), p1 = variants(p, true); s1.forEach(function (q, i) { drawShape(A.pctx, t, q, p1[i]); }); }
      else { const l = variants(last); variants(p).forEach(function (q, i) { seg(A.pctx, l[i], q, t); }); }
      last = p;
    });
    function end() {
      if (!drawing) return; drawing = false; const t = A.tool, L = active();
      if (t !== 'eraser' && t !== 'spray') { L.ctx.globalAlpha = (A.opacity / 100) * (t === 'marker' ? 0.55 : 1); L.ctx.drawImage(A.pv, 0, 0); L.ctx.globalAlpha = 1; A.pctx.clearRect(0, 0, W, H); }
      L.ctx.globalCompositeOperation = 'source-over'; last = null; start = null;
    }
    top.addEventListener('pointerup', end); top.addEventListener('pointercancel', end);
  }

  function save() {
    const out = document.createElement('canvas'); out.width = W; out.height = H; const o = out.getContext('2d'), img = new Image();
    img.onload = function () { o.drawImage(img, 0, 0, W, H); A.layers.forEach(function (L) { if (L.visible) { o.globalAlpha = L.opacity / 100; o.drawImage(L.cv, 0, 0); } }); o.globalAlpha = 1; out.toBlob(function (b) { PC.download(b, adv ? 'my-design.png' : 'my-art.png'); }, 'image/png'); };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 300" width="' + W + '" height="' + H + '">' + PC.bgInner(A.bg, A.solid) + '</svg>');
  }

  return {
    makey: false,
    enter: function () { CC.audio.init(); CC.watchStage($stage()); build(); },
    exit: function () { CC.ui.close(); },
    onKeyDown: function (e) {
      if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
      if (e.ctrlKey || e.metaKey) { const k = e.key.toLowerCase(); if (k === 'z' && !e.shiftKey) { e.preventDefault(); A.hist.undo(); } else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); A.hist.redo(); } }
    },
    /* test hooks */
    _A: A, _undo: function () { return A.hist.undo(); }, _redo: function () { return A.hist.redo(); }, _addLayer: function () { addLayer(false); if (adv) renderLayers(); }
  };
}
CC.modes.art = make(false);
CC.modes.design = make(true);
})();
