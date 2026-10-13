/* scene.js - Scene Maker (Year 3). A canvas with things down the side. Drag them onto the picture, move and arrange them,
   make them bigger or smaller, turn, flip and layer them, paint them any colour, choose a background, and draw freehand on top.
   It uses the shared studio look (studio.js). Pictures can be saved and printed. Nothing is stored or sent anywhere. */
(function () {
'use strict';
const CC = window.CC, PC = CC.PCOM, ST = CC.ST, el = ST.el, ITEMS = CC.SCENE.ITEMS, W = 960, H = 600;
const $stage = function () { return document.getElementById('stage-scene'); };
const $root = function () { return document.getElementById('scene-root'); };
const STYLE = '.r{stroke:#2b2540;stroke-width:3;stroke-linejoin:round}';
const NS = 'http://www.w3.org/2000/svg';

const S = { mode: 'arrange', colour: '#ff3b4e', size: 14, bg: 'grass', solid: null, items: [], sel: null, uid: 0, cv: null, ctx: null, layer: null, bgBox: null, stack: null, ctxBar: null, rail: null, hist: ST.history(25), ink: null, inkDirty: true };

function itemDef(key) { return ITEMS.filter(function (i) { return i.id === key; })[0]; }
function apply(it) { it.g.setAttribute('transform', 'translate(' + it.x.toFixed(1) + ',' + it.y.toFixed(1) + ') rotate(' + it.rot + ') scale(' + (it.flip * it.s).toFixed(3) + ',' + it.s.toFixed(3) + ')'); }
function toStage(e) { const r = S.stack.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; }

/* ---------- history: the whole scene is saved before each change, so undo and redo are always exact ---------- */
function order() { return Array.prototype.map.call(S.layer.children, function (g) { return g._it; }); }
function snap() {
  if (S.inkDirty || !S.ink) { S.ink = S.ctx.getImageData(0, 0, W, H); S.inkDirty = false; }
  return { items: order().map(function (it) { return { key: it.key, x: it.x, y: it.y, s: it.s, rot: it.rot, flip: it.flip, fills: Array.prototype.map.call(it.g.querySelectorAll('.r'), function (r) { return r.style.fill; }) }; }), bg: S.bg, solid: S.solid, ink: S.ink };
}
function restore(sn) {
  S.layer.innerHTML = ''; S.items = []; S.sel = null;
  sn.items.forEach(function (d) { const it = makeItem(d.key, d.x, d.y); it.s = d.s; it.rot = d.rot; it.flip = d.flip; apply(it); Array.prototype.forEach.call(it.g.querySelectorAll('.r'), function (r, i) { if (d.fills[i]) r.style.fill = d.fills[i]; }); S.items.push(it); });
  S.bg = sn.bg; S.solid = sn.solid; S.bgBox.innerHTML = PC.bgInner(S.bg, S.solid); S.ctx.putImageData(sn.ink, 0, 0); S.ink = sn.ink; S.inkDirty = false; select(null);
}
function checkpoint() { const before = snap(); let after = null; S.hist.push({ undo: function () { after = snap(); restore(before); }, redo: function () { restore(after); } }); }

/* ---------- the things on the picture ---------- */
function makeItem(key, x, y) {
  const def = itemDef(key), g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'it');
  g.innerHTML = '<g class="in">' + def.svg + '</g><rect class="sel"></rect>';
  const it = { uid: ++S.uid, key: key, x: x, y: y, s: 1.4, rot: 0, flip: 1, g: g };
  S.layer.appendChild(g); const bb = g.querySelector('.in').getBBox(), r = g.querySelector('.sel');
  r.setAttribute('x', bb.x - 6); r.setAttribute('y', bb.y - 6); r.setAttribute('width', bb.width + 12); r.setAttribute('height', bb.height + 12); r.setAttribute('rx', 8);
  g._it = it; apply(it); return it;
}
function addItem(key, x, y) {
  checkpoint(); const it = makeItem(key, Math.max(40, Math.min(W - 40, x)), Math.max(40, Math.min(H - 40, y))); S.items.push(it); select(it); CC.sfx.pop(); return it;
}
function removeItem(it) { const i = S.items.indexOf(it); if (i < 0) return; checkpoint(); S.items.splice(i, 1); it.g.remove(); if (S.sel === it) select(null); }
function select(it) {
  S.sel = it; S.items.forEach(function (x) { x.g.classList.toggle('selected', x === it); }); contextBar();
}
/* change something about the chosen item (a checkpoint is saved first, so it can be undone) */
function change(fn) { const it = S.sel; if (!it) return; checkpoint(); fn(it); apply(it); CC.sfx.tick(); }
function layerOrder(front) { const it = S.sel; if (!it) return; checkpoint(); if (front) S.layer.appendChild(it.g); else S.layer.insertBefore(it.g, S.layer.firstChild); CC.sfx.tick(); }
function duplicate() {
  const it = S.sel; if (!it) return; const fills = Array.prototype.map.call(it.g.querySelectorAll('.r'), function (r) { return r.style.fill; });
  const n = addItem(it.key, it.x + 30, it.y + 30); n.s = it.s; n.rot = it.rot; n.flip = it.flip; apply(n);
  Array.prototype.forEach.call(n.g.querySelectorAll('.r'), function (r, i) { if (fills[i]) r.style.fill = fills[i]; });
}
function setBackground(id, solid) { checkpoint(); S.bg = id; S.solid = solid; S.bgBox.innerHTML = PC.bgInner(S.bg, S.solid); CC.sfx.pop(); }

/* the strip above the paper: what you can do with the chosen thing */
function contextBar() {
  const c = S.ctxBar; if (!c) return; c.innerHTML = ''; c.hidden = !(S.sel && S.mode === 'arrange');
  if (c.hidden) return;
  [['➕', 'Bigger', function () { change(function (it) { it.s = Math.min(4, it.s * 1.18); }); }], ['➖', 'Smaller', function () { change(function (it) { it.s = Math.max(0.3, it.s / 1.18); }); }],
   ['↻', 'Turn', function () { change(function (it) { it.rot = (it.rot + 15) % 360; }); }], ['↔️', 'Flip', function () { change(function (it) { it.flip *= -1; }); }],
   ['⬆️', 'Front', function () { layerOrder(true); }], ['⬇️', 'Back', function () { layerOrder(false); }], ['⧉', 'Copy', duplicate], ['🗑️', 'Delete', function () { if (S.sel) removeItem(S.sel); }]].forEach(function (a) { ST.action(c, a[0], a[1], a[2]); });
}

/* ---------- the screen ---------- */
function build() {
  CC.ui.close(); S.items = []; S.sel = null; S.hist.clear(); S.ink = null; S.inkDirty = true;
  const s = ST.shell($root(), { hint: 'Drag things onto the picture. Click one to move it, make it bigger, turn it or delete it.' }); S.ctxBar = s.ctx; S.rail = s.rail;
  ST.action(s.left, '↩️', 'Undo', function () { if (S.hist.undo()) CC.sfx.tick(); });
  ST.action(s.left, '↪️', 'Redo', function () { if (S.hist.redo()) CC.sfx.tick(); });
  ST.action(s.left, '🧹', 'Start again', function () { ST.confirm($stage(), 'Start again?', 'This clears your picture.', function () { checkpoint(); S.layer.innerHTML = ''; S.items = []; S.ctx.clearRect(0, 0, W, H); S.inkDirty = true; select(null); }); });
  ST.action(s.right, '💾', 'Save', save, 'primary'); ST.action(s.right, '🖨️', 'Print', function () { select(null); window.print(); });
  [['arrange', '🖐️', 'Move things'], ['colour', '🎨', 'Paint things'], ['brush', '✏️', 'Draw'], ['eraser', '🩹', 'Rubber']].forEach(function (t) { ST.tool(s.rail, t[0], t[1], t[2], function (id) { setMode(id); }, S.mode === t[0]); });
  // the things to drag
  const lib = ST.section(s.side, 'Things  ·  drag them across'); lib.classList.add('st-lib');
  const grid = el('div', 'st-grid'); lib.appendChild(grid);
  ITEMS.forEach(function (d) {
    const b = el('button', 'st-item'); b.type = 'button'; b.setAttribute('aria-label', d.name); b.title = d.name;
    b.innerHTML = '<svg viewBox="-66 -66 132 132" xmlns="http://www.w3.org/2000/svg"><style>' + STYLE + '</style>' + d.svg + '</svg>';
    b.addEventListener('pointerdown', function (e) { dragFromPanel(e, b, d); }); grid.appendChild(b);
  });
  const col = ST.section(s.side, 'Colour'); ST.palette(col, S.colour, function (c) { S.colour = c; if (S.mode === 'eraser') setMode('brush'); }, true);
  const sz = ST.section(s.side, 'Size'); ST.slider(sz, 'Brush size', 4, 50, S.size, function (v) { S.size = v; }, true); S.sizeSec = sz._sec; sz._sec.hidden = true;
  const bgs = ST.section(s.side, 'Background'); ST.backgrounds(bgs, S.bg, function (id) { setBackground(id, null); });
  // the paper: background, the things, and freehand drawing on top
  const stack = ST.stack(s.paper); S.stack = stack; stack.classList.add('sc-stack'); stack.dataset.mode = 'arrange'; S.bgBox = ST.bgLayer(stack, S.bg, S.solid);
  const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'sc-svg'); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.innerHTML = '<g class="sc-layer"></g>'; stack.appendChild(svg); S.layer = svg.querySelector('.sc-layer');
  const cv = ST.canvas(stack, W, H); S.cv = cv; S.ctx = cv.getContext('2d'); S.mode = 'arrange'; setMode('arrange');
  // moving things on the picture, and painting them
  let drag = null;
  svg.addEventListener('pointerdown', function (e) {
    const g = e.target.closest ? e.target.closest('.it') : null;
    if (S.mode === 'colour') { const t = e.target.closest ? e.target.closest('.r') : null; if (t && g) { checkpoint(); t.style.fill = S.colour; CC.sfx.pop(); select(g._it); } return; }
    if (S.mode !== 'arrange') return;
    if (!g) { select(null); return; }
    e.preventDefault(); const it = g._it; select(it); checkpoint(); const p = toStage(e); drag = { it: it, dx: it.x - p[0], dy: it.y - p[1] };
    S.layer.appendChild(g);                                               // the one you pick up comes to the front
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', drop);
  });
  function move(e) { if (!drag) return; const p = toStage(e); drag.it.x = Math.max(0, Math.min(W, p[0] + drag.dx)); drag.it.y = Math.max(0, Math.min(H, p[1] + drag.dy)); apply(drag.it); }
  function drop() { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', drop); drag = null; }
  ST.freehand(cv, { state: function () { return { colour: S.colour, size: S.size, tool: S.mode === 'eraser' ? 'eraser' : 'brush' }; }, enabled: function () { return S.mode === 'brush' || S.mode === 'eraser'; }, before: function () { checkpoint(); S.inkDirty = true; } });
  cv.addEventListener('pointerup', function () { S.inkDirty = true; });
}
function setMode(m) {
  S.mode = m; if (S.stack) S.stack.dataset.mode = (m === 'brush' || m === 'eraser') ? 'draw' : m; if (S.rail) ST.setTool(S.rail, m);
  if (S.sizeSec) S.sizeSec.hidden = !(m === 'brush' || m === 'eraser'); contextBar();
  const foot = S.stack && S.stack.closest('.st-wrap').querySelector('.st-foot');
  if (foot) foot.textContent = m === 'arrange' ? 'Drag things onto the picture. Click one to move it, make it bigger, turn it or delete it.' : m === 'colour' ? 'Pick a colour, then click a part of a thing to paint it.' : 'Pick a colour, then hold the mouse button down and drag to draw.';
}
/* drag a thing from the side onto the picture (or just click it to add it) */
function dragFromPanel(e, btn, d) {
  e.preventDefault(); const f = el('div', 'st-float'); f.innerHTML = btn.querySelector('svg').outerHTML; document.body.appendChild(f);
  let moved = false; const x0 = e.clientX, y0 = e.clientY;
  function pos(ev) { f.style.left = (ev.clientX - 45) + 'px'; f.style.top = (ev.clientY - 45) + 'px'; }
  pos(e);
  function mv(ev) { if (Math.abs(ev.clientX - x0) + Math.abs(ev.clientY - y0) > 8) moved = true; pos(ev); }
  function up(ev) {
    window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); f.remove();
    if (S.mode !== 'arrange') setMode('arrange');
    if (!moved) { addItem(d.id, W / 2 + (Math.random() - 0.5) * 160, H / 2 + (Math.random() - 0.5) * 100); return; }
    const r = S.stack.getBoundingClientRect();
    if (ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom) { const p = toStage(ev); addItem(d.id, p[0], p[1]); }
  }
  window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
}
function save() {
  const was = S.sel; select(null);
  const text = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '"><style>' + STYLE + '.sel{display:none}</style><g transform="scale(2)">' + PC.bgInner(S.bg, S.solid) + '</g>' + S.layer.innerHTML + '</svg>';
  select(was);
  const out = document.createElement('canvas'); out.width = W; out.height = H; const o = out.getContext('2d'), img = new Image();
  img.onload = function () { o.drawImage(img, 0, 0, W, H); o.drawImage(S.cv, 0, 0); out.toBlob(function (b) { PC.download(b, 'my-scene.png'); }, 'image/png'); };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(text);
}

CC.modes.scene = {
  makey: false,
  enter: function () { CC.audio.init(); CC.watchStage($stage()); build(); },
  exit: function () { CC.ui.close(); },
  onKeyDown: function (e) {
    if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
    if (e.ctrlKey || e.metaKey) { const k = e.key.toLowerCase(); if (k === 'z' && !e.shiftKey) { e.preventDefault(); S.hist.undo(); } else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); S.hist.redo(); } }
    else if ((e.key === 'Delete' || e.key === 'Backspace') && S.sel) { e.preventDefault(); removeItem(S.sel); }
  },
  /* test hooks */
  _S: S, _add: addItem, _undo: function () { return S.hist.undo(); }, _redo: function () { return S.hist.redo(); }, _select: select, _change: change, _mode: setMode
};
})();
