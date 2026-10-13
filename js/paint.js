/* paint.js - Paint Studio (Year 1). A painting program with no levels: choose a picture (animals, farm, houses, vehicles, fun)
   or a blank sheet, choose and change the background, pick a colour and paint. Click a part of a picture to colour it;
   on the blank sheet, drag the brush. Paintings can be undone, saved and printed. Nothing is stored or sent anywhere.
   It uses the shared studio look (studio.js). */
(function () {
'use strict';
const CC = window.CC, PICS = CC.PAINT.PICS, CATS = CC.PAINT.CATS, PC = CC.PCOM, ST = CC.ST, el = ST.el;
const $stage = function () { return document.getElementById('stage-paint'); };
const $root = function () { return document.getElementById('pt-root'); };
const STYLE = '.r{stroke:#2b2540;stroke-width:3;stroke-linejoin:round}.ln{fill:none;stroke:#2b2540;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}';
const W = 960, H = 600;

const P = { cat: 'animals', pic: null, colour: '#ff3b4e', size: 14, tool: 'brush', view: 'choose', bg: 'white', solid: null, bgBox: null, canvas: null, svg: null, hist: ST.history(30) };

function thumb(pic) { return '<svg viewBox="0 0 480 300" xmlns="http://www.w3.org/2000/svg"><style>' + STYLE + '</style><rect width="480" height="300" fill="#fff"/>' + pic.svg + '</svg>'; }

/* ---------- choose something to paint ---------- */
function showChoose() {
  P.view = 'choose'; P.canvas = null; P.svg = null; CC.ui.close();
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
  w.appendChild(tabs); w.appendChild(grid); fill();
  const r = $root(); r.innerHTML = ''; r.appendChild(w); r.scrollTop = 0;
}

/* ---------- the painting screen (same layout as every painting program) ---------- */
function setBackground(id, solid) {
  const prev = [P.bg, P.solid], next = [id, solid];
  function set(v) { P.bg = v[0]; P.solid = v[1]; P.bgBox.innerHTML = PC.bgInner(P.bg, P.solid); }
  set(next); P.hist.push({ undo: function () { set(prev); }, redo: function () { set(next); } }); CC.sfx.pop();
}
function screen(kind) {
  P.hist.clear();
  const s = ST.shell($root(), { rail: kind === 'blank', hint: kind === 'pic' ? 'Pick a colour, then click a part of the picture!' : 'Pick a colour, then hold the mouse button down and drag to paint!' });
  ST.action(s.left, '🗂️', 'Pictures', showChoose);
  ST.action(s.left, '↩️', 'Undo', function () { if (P.hist.undo()) CC.sfx.tick(); });
  ST.action(s.left, '↪️', 'Redo', function () { if (P.hist.redo()) CC.sfx.tick(); });
  ST.action(s.left, '🧹', 'Start again', askClear);
  ST.action(s.right, '💾', 'Save', save, 'primary');
  ST.action(s.right, '🖨️', 'Print', function () { window.print(); });
  const col = ST.section(s.side, 'Colour'); ST.palette(col, P.colour, function (c) { P.colour = c; if (P.tool === 'eraser') { P.tool = 'brush'; ST.setTool(s.rail, 'brush'); } });
  return { s: s, col: col };
}
function backgroundSection(s) { const b = ST.section(s.side, 'Background'); ST.backgrounds(b, P.bg === 'solid' ? '' : P.bg, function (id) { setBackground(id, null); }); }

/* a picture to colour: click a part to fill it */
function openPic(pic) {
  P.view = 'pic'; P.pic = pic; P.canvas = null; const o = screen('pic'), s = o.s;
  backgroundSection(s);
  const stk = ST.stack(s.paper); P.bgBox = ST.bgLayer(stk, P.bg, P.solid);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('class', 'pt-art'); svg.setAttribute('viewBox', '0 0 480 300'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', pic.name + ' to colour');
  svg.innerHTML = '<style>' + STYLE + '</style>' + pic.svg; stk.appendChild(svg); P.svg = svg;
  svg.addEventListener('click', function (e) {
    const t = e.target.closest ? e.target.closest('.r') : null; if (!t || !svg.contains(t)) return;
    const prev = t.style.fill, next = P.colour; if (prev === next) return;
    t.style.fill = next; P.hist.push({ undo: function () { t.style.fill = prev; }, redo: function () { t.style.fill = next; } });
    CC.sfx.pop(); t.classList.remove('pop'); void t.getBoundingClientRect(); t.classList.add('pop');
  });
}

/* blank paper: drag to paint (the background sits behind, so the rubber shows it again) */
function openBlank() {
  P.view = 'blank'; P.pic = null; P.svg = null; const o = screen('blank'), s = o.s;
  ST.tool(s.rail, 'brush', '🖌️', 'Brush', function (id) { P.tool = id; }, P.tool === 'brush');
  ST.tool(s.rail, 'eraser', '🩹', 'Rubber', function (id) { P.tool = id; }, P.tool === 'eraser');
  ST.tool(s.rail, 'paper', '🪣', 'Fill paper', function (id) { P.tool = id; }, P.tool === 'paper');
  const sz = ST.section(s.side, 'Size'); ST.slider(sz, 'Brush size', 4, 50, P.size, function (v) { P.size = v; }, true);
  backgroundSection(s);
  const stk = ST.stack(s.paper); P.bgBox = ST.bgLayer(stk, P.bg, P.solid);
  const cv = ST.canvas(stk, W, H); P.canvas = cv; const ctx = cv.getContext('2d');
  ST.freehand(cv, {
    state: function () { return { colour: P.colour, size: P.size, tool: P.tool }; },
    enabled: function () { if (P.tool === 'paper') { return false; } return true; },
    before: function () { const e = ST.canvasEntry(ctx, W, H); P.hist.push(e); }
  });
  cv.addEventListener('pointerdown', function () { if (P.tool === 'paper') setBackground('solid', P.colour); });
}

/* ---------- start again, save ---------- */
function askClear() {
  ST.confirm($stage(), 'Start again?', 'This clears your painting.', function () { if (P.canvas) { const e = ST.canvasEntry(P.canvas.getContext('2d'), W, H); P.hist.push(e); P.canvas.getContext('2d').clearRect(0, 0, W, H); } else if (P.pic) openPic(P.pic); });
}
function save() {
  if (P.canvas) {
    const out = document.createElement('canvas'); out.width = W; out.height = H; const o = out.getContext('2d'), img = new Image();
    img.onload = function () { o.drawImage(img, 0, 0, W, H); o.drawImage(P.canvas, 0, 0); out.toBlob(function (b) { PC.download(b, 'my-painting.png'); }, 'image/png'); };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 300" width="960" height="600">' + PC.bgInner(P.bg, P.solid) + '</svg>');
    return;
  }
  if (!P.svg) return;
  PC.svgToBlob('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 300" width="1440" height="900"><style>' + STYLE + '</style>' + PC.bgInner(P.bg, P.solid) + P.svg.innerHTML.replace(/<style>.*?<\/style>/, '') + '</svg>', 1440, 900)
    .then(function (b) { PC.download(b, 'my-' + (P.pic ? P.pic.name.toLowerCase() : 'painting') + '.png'); });
}

/* ---------- plug into the hub ---------- */
CC.modes.paint = {
  makey: false,
  enter: function () { CC.audio.init(); CC.watchStage($stage()); P.hist.clear(); showChoose(); },
  exit: function () { CC.ui.close(); P.canvas = null; P.svg = null; P.bgBox = null; },
  onKeyDown: function (e) {
    if (!(e.ctrlKey || e.metaKey) || P.view === 'choose') return; const k = e.key.toLowerCase();
    if (k === 'z') { e.preventDefault(); if (e.shiftKey) P.hist.redo(); else P.hist.undo(); } else if (k === 'y') { e.preventDefault(); P.hist.redo(); }
  },
  /* test hooks */
  _P: P, _open: function (id) { const p = PICS.filter(function (x) { return x.id === id; })[0]; if (p) openPic(p); else openBlank(); }, _undo: function () { return P.hist.undo(); }, _redo: function () { return P.hist.redo(); }, _bg: function (id) { setBackground(id, null); }
};
})();
