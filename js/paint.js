/* paint.js - Paint Studio (Year 1). A painting program with no levels: choose a picture (animals, farm, houses, vehicles, fun)
   or a blank sheet, choose and change the background, pick a colour and paint. Click a part of a picture to colour it;
   on the blank sheet, drag the brush. Paintings can be saved and printed. Nothing is stored or sent anywhere. */
(function () {
'use strict';
const CC = window.CC, PICS = CC.PAINT.PICS, CATS = CC.PAINT.CATS, PC = CC.PCOM;
const $stage = function () { return document.getElementById('stage-paint'); };
const $root = function () { return document.getElementById('pt-root'); };
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
const STYLE = '.r{stroke:#2b2540;stroke-width:3;stroke-linejoin:round}.ln{fill:none;stroke:#2b2540;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}';

const P = { cat: 'animals', pic: null, colour: '#ff3b4e', size: 14, tool: 'brush', undo: [], canvas: null, view: 'choose', bg: 'white', solid: null, bgEl: null, bgBox: null };

function setView(v, node) { P.view = v; const r = $root(); r.innerHTML = ''; r.appendChild(node); r.scrollTop = 0; }
function thumb(pic) { return '<svg viewBox="0 0 480 300" xmlns="http://www.w3.org/2000/svg"><style>' + STYLE + '</style><rect width="480" height="300" fill="#fff"/>' + pic.svg + '</svg>'; }

/* ---------- choose something to paint ---------- */
function showChoose() {
  P.canvas = null; CC.ui.close();
  const w = el('div', 'pt-choose');
  w.appendChild(el('div', 'pt-title', '🎨 Paint Studio'));
  w.appendChild(el('p', 'pt-sub', 'Choose something to paint!'));
  const tabs = el('div', 'pt-tabs'), grid = el('div', 'pt-grid');
  function fill() {
    grid.innerHTML = '';
    if (P.cat === 'blank') {
      const b = el('button', 'pt-card blank'); b.type = 'button'; b.innerHTML = '<span class="pv"><i>✏️</i></span><span class="nm">Blank paper</span>'; b.addEventListener('click', function () { b.blur(); openBlank(); }); grid.appendChild(b); return;
    }
    PICS.filter(function (p) { return p.cat === P.cat; }).forEach(function (p) {
      const b = el('button', 'pt-card'); b.type = 'button'; b.setAttribute('aria-label', p.name);
      b.innerHTML = '<span class="pv">' + thumb(p) + '</span><span class="nm"></span>'; b.querySelector('.nm').textContent = p.name;
      b.addEventListener('click', function () { b.blur(); CC.audio.init(); openPic(p); }); grid.appendChild(b);
    });
  }
  CATS.concat([{ id: 'blank', icon: '✏️', name: 'Blank paper' }]).forEach(function (c) {
    const t = el('button', 'pt-tab' + (P.cat === c.id ? ' on' : '')); t.type = 'button'; t.innerHTML = '<span>' + c.icon + '</span> ' + c.name;
    t.addEventListener('click', function () { t.blur(); P.cat = c.id; tabs.querySelectorAll('.pt-tab').forEach(function (x) { x.classList.remove('on'); }); t.classList.add('on'); fill(); });
    tabs.appendChild(t);
  });
  w.appendChild(tabs); w.appendChild(grid); fill(); setView('choose', w);
}

/* ---------- the painting screen (shared) ---------- */
let toolBtns = {};
function setTool(t) { P.tool = t; Object.keys(toolBtns).forEach(function (k) { toolBtns[k].classList.toggle('on', k === t); }); }
function screen(kind) {
  const w = el('div', 'pt-paint'), bar = el('div', 'pt-bar');
  function btn(icon, label, fn, cls) { const b = el('button', 'btn' + (cls ? ' ' + cls : ''), icon + ' ' + label); b.type = 'button'; b.addEventListener('click', function () { b.blur(); fn(); }); bar.appendChild(b); return b; }
  btn('🗂️', 'Pictures', showChoose);
  btn('↩️', 'Undo', undo);
  btn('🧹', 'Start again', askClear);
  const bgb = btn('🖼️', 'Background', function () { bgPanel.hidden = !bgPanel.hidden; bgb.classList.toggle('on', !bgPanel.hidden); });
  btn('💾', 'Save', save, 'primary');
  btn('🖨️', 'Print', function () { window.print(); });
  w.appendChild(bar);
  const bgPanel = PC.backgroundPicker(P.bg, function (id) { setBackground(id, null); }); bgPanel.hidden = true; w.appendChild(bgPanel);
  const paper = el('div', 'pt-paper'); w.appendChild(paper);
  const tools = el('div', 'pt-tools'); w.appendChild(tools);
  w.appendChild(PC.palette(P.colour, function (c) { P.colour = c; if (P.tool === 'eraser') setTool('brush'); }));
  w.appendChild(el('p', 'pt-hint', kind === 'pic' ? 'Pick a colour, then click a part of the picture!' : 'Pick a colour, then hold the mouse button down and drag to paint!'));
  return { w: w, paper: paper, tools: tools };
}
/* choose or change the background (can be undone) */
function setBackground(id, solid) {
  const prev = [P.bg, P.solid]; P.bg = id; P.solid = solid;
  if (P.bgBox) P.bgBox.innerHTML = PC.bgInner(P.bg, P.solid);
  P.undo.push(function () { P.bg = prev[0]; P.solid = prev[1]; if (P.bgBox) P.bgBox.innerHTML = PC.bgInner(P.bg, P.solid); });
  CC.sfx.pop();
}

/* ---------- a picture to colour: click a part to fill it ---------- */
function openPic(pic) {
  P.pic = pic; P.undo = []; P.canvas = null; const s = screen('pic');
  s.paper.innerHTML = '<svg class="pt-art" viewBox="0 0 480 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + pic.name + ' to colour"><g class="bgl"></g>' + pic.svg + '</svg>';
  const svg = s.paper.firstChild; P.bgBox = svg.querySelector('.bgl'); P.bgBox.innerHTML = PC.bgInner(P.bg, P.solid);
  svg.addEventListener('click', function (e) {
    const t = e.target.closest ? e.target.closest('.r') : null; if (!t || !svg.contains(t)) return;
    const prev = t.style.fill; P.undo.push(function () { t.style.fill = prev; }); if (P.undo.length > 200) P.undo.shift();
    t.style.fill = P.colour; CC.sfx.pop(); t.classList.remove('pop'); void t.getBoundingClientRect(); t.classList.add('pop');
  });
  s.tools.hidden = true; toolBtns = {};
  setView('pic', s.w);
}

/* ---------- blank paper: drag to paint (the background sits behind, so the rubber shows it again) ---------- */
function openBlank() {
  P.pic = null; P.undo = []; const s = screen('blank');
  const stack = el('div', 'pt-stack'); s.paper.appendChild(stack);
  const bgBox = document.createElement('div'); bgBox.className = 'pt-bgbox'; bgBox.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 300" preserveAspectRatio="none"><g></g></svg>'; stack.appendChild(bgBox);
  P.bgBox = bgBox.querySelector('g'); P.bgBox.innerHTML = PC.bgInner(P.bg, P.solid);
  const cv = document.createElement('canvas'); cv.width = 960; cv.height = 600; cv.className = 'pt-canvas'; stack.appendChild(cv); P.canvas = cv;
  const ctx = cv.getContext('2d'); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  toolBtns = {};
  function tb(id, icon, label) { const b = el('button', 'btn tool' + (P.tool === id ? ' on' : ''), icon + ' ' + label); b.type = 'button'; b.addEventListener('click', function () { b.blur(); setTool(id); }); s.tools.appendChild(b); toolBtns[id] = b; }
  tb('brush', '🖌️', 'Brush'); tb('eraser', '🩹', 'Rubber'); tb('paper', '🪣', 'Fill paper');
  const sizes = el('div', 'pt-sizes'); [[6, 'Thin'], [14, 'Medium'], [30, 'Thick']].forEach(function (z) {
    const b = el('button', 'pt-size' + (P.size === z[0] ? ' on' : '')); b.type = 'button'; b.setAttribute('aria-label', z[1] + ' brush'); b.title = z[1]; const d = el('i'); d.style.width = d.style.height = (6 + z[0] * 0.7) + 'px'; b.appendChild(d);
    b.addEventListener('click', function () { b.blur(); P.size = z[0]; sizes.querySelectorAll('.pt-size').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); }); sizes.appendChild(b);
  });
  s.tools.appendChild(sizes); s.tools.hidden = false;
  let drawing = false, last = null;
  function pos(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; }
  function snap() { const d = ctx.getImageData(0, 0, cv.width, cv.height); P.undo.push(function () { ctx.putImageData(d, 0, 0); }); if (P.undo.length > 12) P.undo.shift(); }
  function stroke(a, b) {
    ctx.globalCompositeOperation = P.tool === 'eraser' ? 'destination-out' : 'source-over'; ctx.strokeStyle = P.colour;
    ctx.lineWidth = P.tool === 'eraser' ? P.size * 1.6 : P.size; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0] + 0.01, b[1]); ctx.stroke();
  }
  cv.addEventListener('pointerdown', function (e) {
    e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (x) { }
    if (P.tool === 'paper') { setBackground('solid', P.colour); return; }
    drawing = true; snap(); last = pos(e); stroke(last, last);
  });
  cv.addEventListener('pointermove', function (e) { if (!drawing) return; const p = pos(e); stroke(last, p); last = p; });
  function end() { drawing = false; last = null; }
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  setView('blank', s.w);
}

/* ---------- undo, start again, save ---------- */
function undo() { if (!P.undo.length) { CC.sfx.step && CC.sfx.step(); return; } P.undo.pop()(); CC.sfx.tick(); }
function askClear() {
  CC.ui.show($stage(), { emoji: '🧹', title: 'Start again?', text: 'This clears your painting.', buttons: [
    { icon: '✅', label: 'Yes', primary: true, keys: ['Enter'], fn: function () { if (P.canvas) { const c = P.canvas.getContext('2d'); c.clearRect(0, 0, P.canvas.width, P.canvas.height); P.undo = []; } else if (P.pic) openPic(P.pic); } },
    { icon: '✖️', label: 'No', fn: function () { } }] });
}
function save() {
  if (P.canvas) {
    const out = document.createElement('canvas'); out.width = 960; out.height = 600; const o = out.getContext('2d'), img = new Image();
    img.onload = function () { o.drawImage(img, 0, 0, 960, 600); o.drawImage(P.canvas, 0, 0); out.toBlob(function (b) { PC.download(b, 'my-painting.png'); }, 'image/png'); };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 300" width="960" height="600">' + PC.bgInner(P.bg, P.solid) + '</svg>');
    return;
  }
  const svg = $root().querySelector('.pt-art'); if (!svg) return;
  PC.svgToBlob('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 300" width="1440" height="900"><style>' + STYLE + '</style>' + svg.innerHTML + '</svg>', 1440, 900).then(function (b) { PC.download(b, 'my-' + (P.pic ? P.pic.name.toLowerCase() : 'painting') + '.png'); });
}

/* ---------- plug into the hub ---------- */
CC.modes.paint = {
  makey: false,
  enter: function () { CC.audio.init(); CC.watchStage($stage()); P.undo = []; showChoose(); },
  exit: function () { CC.ui.close(); P.canvas = null; P.bgBox = null; },
  onKeyDown: function (e) { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && P.view !== 'choose') { e.preventDefault(); undo(); } },
  /* test hooks */
  _P: P, _open: function (id) { const p = PICS.filter(function (x) { return x.id === id; })[0]; if (p) openPic(p); else openBlank(); }, _undo: undo, _bg: function (id) { setBackground(id, null); }
};
})();
