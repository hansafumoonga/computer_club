/* scene.js - Scene Maker (Year 3). A canvas with things down the left side. Drag them onto the picture, move and arrange them,
   make them bigger or smaller, turn, flip and layer them, paint them any colour, choose a background, and draw freehand on top.
   Pictures can be saved and printed. Nothing is stored or sent anywhere. */
(function () {
'use strict';
const CC = window.CC, PC = CC.PCOM, ITEMS = CC.SCENE.ITEMS, W = 960, H = 600;
const $stage = function () { return document.getElementById('stage-scene'); };
const $root = function () { return document.getElementById('scene-root'); };
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
const STYLE = '.r{stroke:#2b2540;stroke-width:3;stroke-linejoin:round}';
const NS = 'http://www.w3.org/2000/svg';

const S = { mode: 'arrange', colour: '#ff3b4e', size: 14, tool: 'brush', bg: 'grass', solid: null, items: [], sel: null, undo: [], uid: 0, cv: null, ctx: null, layer: null, bgBox: null, stack: null, selBar: null };

function pushUndo(fn) { S.undo.push(fn); if (S.undo.length > 60) S.undo.shift(); }
function undo() { if (!S.undo.length) { CC.sfx.step && CC.sfx.step(); return; } S.undo.pop()(); CC.sfx.tick(); }
function itemDef(key) { return ITEMS.filter(function (i) { return i.id === key; })[0]; }
function apply(it) { it.g.setAttribute('transform', 'translate(' + it.x.toFixed(1) + ',' + it.y.toFixed(1) + ') rotate(' + it.rot + ') scale(' + (it.flip * it.s).toFixed(3) + ',' + it.s.toFixed(3) + ')'); }
function toStage(e) { const r = S.stack.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; }

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
  const it = makeItem(key, Math.max(40, Math.min(W - 40, x)), Math.max(40, Math.min(H - 40, y))); S.items.push(it); select(it);
  pushUndo(function () { removeItem(it, true); }); CC.sfx.pop(); return it;
}
function removeItem(it, quiet) {
  const i = S.items.indexOf(it); if (i < 0) return; const next = it.g.nextSibling;
  S.items.splice(i, 1); if (it.g.parentNode) it.g.parentNode.removeChild(it.g); if (S.sel === it) select(null);
  if (!quiet) pushUndo(function () { S.layer.insertBefore(it.g, next); S.items.splice(i, 0, it); select(it); });
}
function select(it) {
  S.sel = it; S.items.forEach(function (x) { x.g.classList.toggle('selected', x === it); });
  if (S.selBar) S.selBar.classList.toggle('on', !!it);
}
/* change something about the chosen item, so that it can be undone */
function change(fn) {
  const it = S.sel; if (!it) return; const before = { x: it.x, y: it.y, s: it.s, rot: it.rot, flip: it.flip };
  fn(it); pushUndo(function () { Object.assign(it, before); apply(it); }); apply(it); CC.sfx.tick();
}
function order(front) {
  const it = S.sel; if (!it) return; const next = it.g.nextSibling;
  if (front) S.layer.appendChild(it.g); else S.layer.insertBefore(it.g, S.layer.firstChild);
  pushUndo(function () { S.layer.insertBefore(it.g, next); }); CC.sfx.tick();
}
function duplicate() {
  const it = S.sel; if (!it) return; const n = addItem(it.key, it.x + 30, it.y + 30); n.s = it.s; n.rot = it.rot; n.flip = it.flip; apply(n);
  // keep the colours of the original
  const a = it.g.querySelectorAll('.r'), b = n.g.querySelectorAll('.r'); for (let i = 0; i < a.length; i++) if (a[i].style.fill) b[i].style.fill = a[i].style.fill;
}
function clearAll() {
  const saved = S.items.slice(), d = S.ctx.getImageData(0, 0, W, H);
  S.items.slice().forEach(function (it) { removeItem(it, true); }); S.ctx.clearRect(0, 0, W, H);
  pushUndo(function () { saved.forEach(function (it) { S.layer.appendChild(it.g); S.items.push(it); }); S.ctx.putImageData(d, 0, 0); });
}
function setBackground(id, solid) {
  const prev = [S.bg, S.solid]; S.bg = id; S.solid = solid; S.bgBox.innerHTML = PC.bgInner(S.bg, S.solid);
  pushUndo(function () { S.bg = prev[0]; S.solid = prev[1]; S.bgBox.innerHTML = PC.bgInner(S.bg, S.solid); }); CC.sfx.pop();
}

/* ---------- the screen ---------- */
function build() {
  CC.ui.close(); S.items = []; S.sel = null; S.undo = [];
  const w = el('div', 'pt-paint sc'), bar = el('div', 'pt-bar');
  function btn(icon, label, fn, cls) { const b = el('button', 'btn' + (cls ? ' ' + cls : ''), icon + ' ' + label); b.type = 'button'; b.addEventListener('click', function () { b.blur(); fn(b); }); bar.appendChild(b); return b; }
  btn('↩️', 'Undo', undo); btn('🧹', 'Start again', askClear);
  btn('🖼️', 'Background', function (b) { bgPanel.hidden = !bgPanel.hidden; b.classList.toggle('on', !bgPanel.hidden); });
  btn('💾', 'Save', save, 'primary'); btn('🖨️', 'Print', function () { select(null); window.print(); });
  w.appendChild(bar);
  const bgPanel = PC.backgroundPicker(S.bg, function (id) { setBackground(id, null); }); bgPanel.hidden = true; w.appendChild(bgPanel);

  const main = el('div', 'sc-main'); w.appendChild(main);
  // left: the things to drag
  const panel = el('div', 'sc-panel'); panel.appendChild(el('div', 'sc-ptitle', 'Drag onto the picture ➜'));
  const grid = el('div', 'sc-grid'); panel.appendChild(grid); main.appendChild(panel);
  ITEMS.forEach(function (d) {
    const b = el('button', 'sc-item'); b.type = 'button'; b.setAttribute('aria-label', d.name); b.title = d.name;
    b.innerHTML = '<svg viewBox="-66 -66 132 132" xmlns="http://www.w3.org/2000/svg"><style>' + STYLE + '</style>' + d.svg + '</svg><span>' + d.name + '</span>';
    b.addEventListener('pointerdown', function (e) { dragFromPanel(e, b, d); });
    grid.appendChild(b);
  });
  // centre
  const centre = el('div', 'sc-centre'); main.appendChild(centre);
  const modes = el('div', 'sc-modes'), mb = {};
  [['arrange', '🖐️', 'Move things'], ['colour', '🎨', 'Paint things'], ['draw', '✏️', 'Draw']].forEach(function (m) {
    const b = el('button', 'btn tool' + (S.mode === m[0] ? ' on' : ''), m[1] + ' ' + m[2]); b.type = 'button'; b.addEventListener('click', function () { b.blur(); setMode(m[0]); }); modes.appendChild(b); mb[m[0]] = b;
  });
  // what can be done with the chosen thing
  S.selBar = el('div', 'sc-selbar');
  [['➕', 'Bigger', function () { change(function (it) { it.s = Math.min(4, it.s * 1.18); }); }], ['➖', 'Smaller', function () { change(function (it) { it.s = Math.max(0.3, it.s / 1.18); }); }],
   ['↻', 'Turn', function () { change(function (it) { it.rot = (it.rot + 15) % 360; }); }], ['↔️', 'Flip', function () { change(function (it) { it.flip *= -1; }); }],
   ['⬆️', 'Front', function () { order(true); }], ['⬇️', 'Back', function () { order(false); }], ['⧉', 'Copy', duplicate], ['🗑️', 'Delete', function () { if (S.sel) removeItem(S.sel); }]].forEach(function (a) {
    const b = el('button', 'btn sm', a[0] + ' ' + a[1]); b.type = 'button'; b.addEventListener('click', function () { b.blur(); a[2](); }); S.selBar.appendChild(b);
  });
  const top = el('div', 'sc-top'); top.appendChild(modes); top.appendChild(S.selBar); centre.appendChild(top);
  const paper = el('div', 'pt-paper'); centre.appendChild(paper);
  const stack = el('div', 'pt-stack sc-stack'); stack.dataset.mode = S.mode; paper.appendChild(stack); S.stack = stack;
  const bgBox = el('div', 'pt-bgbox'); bgBox.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 300" preserveAspectRatio="none"><g></g></svg>'; stack.appendChild(bgBox);
  S.bgBox = bgBox.querySelector('g'); S.bgBox.innerHTML = PC.bgInner(S.bg, S.solid);
  const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'sc-svg'); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.innerHTML = '<g class="sc-layer"></g>'; stack.appendChild(svg); S.layer = svg.querySelector('.sc-layer');
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.className = 'pt-canvas'; stack.appendChild(cv); S.cv = cv; S.ctx = cv.getContext('2d');
  // drawing tools (only in draw mode)
  const dt = el('div', 'pt-tools sc-draw'); dt.hidden = S.mode !== 'draw';
  const tb = {}; [['brush', '🖌️', 'Brush'], ['eraser', '🩹', 'Rubber']].forEach(function (t) { const b = el('button', 'btn tool' + (S.tool === t[0] ? ' on' : ''), t[1] + ' ' + t[2]); b.type = 'button'; b.addEventListener('click', function () { b.blur(); S.tool = t[0]; Object.keys(tb).forEach(function (k) { tb[k].classList.toggle('on', k === t[0]); }); }); dt.appendChild(b); tb[t[0]] = b; });
  const sizes = el('div', 'pt-sizes'); [[6, 'Thin'], [14, 'Medium'], [30, 'Thick']].forEach(function (z) { const b = el('button', 'pt-size' + (S.size === z[0] ? ' on' : '')); b.type = 'button'; b.setAttribute('aria-label', z[1] + ' brush'); const d = el('i'); d.style.width = d.style.height = (6 + z[0] * 0.7) + 'px'; b.appendChild(d); b.addEventListener('click', function () { b.blur(); S.size = z[0]; sizes.querySelectorAll('.pt-size').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); }); sizes.appendChild(b); });
  dt.appendChild(sizes); centre.appendChild(dt); S.drawBar = dt;
  centre.appendChild(PC.palette(S.colour, function (c) { S.colour = c; if (S.mode === 'draw' && S.tool === 'eraser') { S.tool = 'brush'; Object.keys(tb).forEach(function (k) { tb[k].classList.toggle('on', k === 'brush'); }); } }));
  S.hint = el('p', 'pt-hint', ''); centre.appendChild(S.hint);
  S.modeBtns = mb; setMode(S.mode);

  // moving things on the picture, and painting them
  let drag = null;
  svg.addEventListener('pointerdown', function (e) {
    const g = e.target.closest ? e.target.closest('.it') : null;
    if (S.mode === 'colour') { const t = e.target.closest ? e.target.closest('.r') : null; if (t && g) { const prev = t.style.fill; pushUndo(function () { t.style.fill = prev; }); t.style.fill = S.colour; CC.sfx.pop(); select(g._it); } return; }
    if (S.mode !== 'arrange') return;
    if (!g) { select(null); return; }
    e.preventDefault(); const it = g._it; select(it); const p = toStage(e); drag = { it: it, dx: it.x - p[0], dy: it.y - p[1], x0: it.x, y0: it.y, moved: false };
    S.layer.appendChild(g);                                               // the one you pick up comes to the front
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', drop);
  });
  function move(e) { if (!drag) return; const p = toStage(e); drag.it.x = Math.max(0, Math.min(W, p[0] + drag.dx)); drag.it.y = Math.max(0, Math.min(H, p[1] + drag.dy)); drag.moved = true; apply(drag.it); }
  function drop() { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', drop); if (drag && drag.moved) { const d = drag; pushUndo(function () { d.it.x = d.x0; d.it.y = d.y0; apply(d.it); }); } drag = null; }
  // freehand drawing on top
  const ctx = S.ctx; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; let drawing = false, last = null;
  function pos(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; }
  function stroke(a, b) { ctx.globalCompositeOperation = S.tool === 'eraser' ? 'destination-out' : 'source-over'; ctx.strokeStyle = S.colour; ctx.lineWidth = S.tool === 'eraser' ? S.size * 1.6 : S.size; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0] + 0.01, b[1]); ctx.stroke(); }
  cv.addEventListener('pointerdown', function (e) { e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (x) { } const d = ctx.getImageData(0, 0, W, H); pushUndo(function () { ctx.putImageData(d, 0, 0); }); drawing = true; last = pos(e); stroke(last, last); });
  cv.addEventListener('pointermove', function (e) { if (!drawing) return; const p = pos(e); stroke(last, p); last = p; });
  const end = function () { drawing = false; last = null; }; cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  const r = $root(); r.innerHTML = ''; r.appendChild(w);
}
function setMode(m) {
  S.mode = m; if (S.stack) S.stack.dataset.mode = m; Object.keys(S.modeBtns).forEach(function (k) { S.modeBtns[k].classList.toggle('on', k === m); });
  S.drawBar.hidden = m !== 'draw'; if (m !== 'arrange') { if (S.selBar) S.selBar.classList.remove('on'); } else if (S.sel) S.selBar.classList.add('on');
  S.hint.textContent = m === 'arrange' ? 'Drag things onto the picture. Click one to move it, make it bigger, turn it or delete it.' : m === 'colour' ? 'Pick a colour, then click a part of a thing to paint it.' : 'Pick a colour, then hold the mouse button down and drag to draw.';
}
/* drag a thing from the left onto the picture (or just click it to add it) */
function dragFromPanel(e, btn, d) {
  e.preventDefault(); const f = el('div', 'sc-float'); f.innerHTML = btn.querySelector('svg').outerHTML; document.body.appendChild(f);
  let moved = false; const x0 = e.clientX, y0 = e.clientY;
  function pos(ev) { f.style.left = (ev.clientX - 45) + 'px'; f.style.top = (ev.clientY - 45) + 'px'; }
  pos(e);
  function mv(ev) { if (Math.abs(ev.clientX - x0) + Math.abs(ev.clientY - y0) > 8) moved = true; pos(ev); }
  function up(ev) {
    window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); if (f.parentNode) f.parentNode.removeChild(f);
    if (S.mode !== 'arrange') setMode('arrange');
    if (!moved) { addItem(d.id, W / 2 + (Math.random() - 0.5) * 160, H / 2 + (Math.random() - 0.5) * 100); return; }
    const r = S.stack.getBoundingClientRect();
    if (ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom) { const p = toStage(ev); addItem(d.id, p[0], p[1]); }
  }
  window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
}
function askClear() {
  CC.ui.show($stage(), { emoji: '🧹', title: 'Start again?', text: 'This clears your picture.', buttons: [
    { icon: '✅', label: 'Yes', primary: true, keys: ['Enter'], fn: clearAll }, { icon: '✖️', label: 'No', fn: function () { } }] });
}
function save() {
  const was = S.sel; select(null);
  const items = S.layer.innerHTML, text = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '"><style>' + STYLE + '.sel{display:none}</style><g transform="scale(2)">' + PC.bgInner(S.bg, S.solid) + '</g>' + items + '</svg>';
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
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
    else if ((e.key === 'Delete' || e.key === 'Backspace') && S.sel) { e.preventDefault(); removeItem(S.sel); }
  },
  /* test hooks */
  _S: S, _add: addItem, _undo: undo, _select: select, _change: change, _mode: setMode
};
})();
