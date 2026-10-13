/* studio.js - the shared look of every painting program (Paint Studio, Magic Mix, Art Studio, Scene Maker, Magic Lab, Design Studio).
   They all use the same layout: an action bar on top, a tool rail on the left, the paper in the middle and a side panel on the right
   (colour, size, options, background). Only what the tools can DO grows from year to year; the interface stays the same.
   Plain DOM helpers, no libraries. */
(function () {
'use strict';
const CC = window.CC, PC = CC.PCOM;
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

/* the page: bar, rail, context strip, paper, side panel, hint */
function shell(root, o) {
  o = o || {};
  const wrap = el('div', 'st-wrap'), bar = el('div', 'st-bar'), body = el('div', 'st-body'), rail = el('div', 'st-rail'), main = el('div', 'st-main'), side = el('div', 'st-side');
  const left = el('div', 'st-g'), right = el('div', 'st-g right'); bar.appendChild(left); bar.appendChild(right);
  const ctx = el('div', 'st-context'); ctx.hidden = true; const paper = el('div', 'st-paper'); main.appendChild(ctx); main.appendChild(paper);
  const foot = el('p', 'st-foot', o.hint || ''); rail.hidden = o.rail === false; if (o.rail === false) wrap.classList.add('norail');
  body.appendChild(rail); body.appendChild(main); body.appendChild(side); wrap.appendChild(bar); wrap.appendChild(body); wrap.appendChild(foot);
  root.innerHTML = ''; root.appendChild(wrap);
  return { wrap: wrap, bar: bar, left: left, right: right, rail: rail, main: main, ctx: ctx, paper: paper, side: side, foot: foot };
}
function action(group, icon, label, fn, cls) {
  const b = el('button', 'st-act' + (cls ? ' ' + cls : '')); b.type = 'button'; b.innerHTML = '<span class="i"></span><span class="t"></span>';
  b.querySelector('.i').textContent = icon; b.querySelector('.t').textContent = label; b.setAttribute('aria-label', label);
  b.addEventListener('click', function () { b.blur(); fn(b); }); group.appendChild(b); return b;
}
/* the tool rail: one tool is chosen at a time */
function tool(rail, id, icon, label, onPick, active) {
  const b = el('button', 'st-tool' + (active ? ' on' : '')); b.type = 'button'; b.dataset.tool = id; b.title = label; b.setAttribute('aria-label', label);
  b.innerHTML = '<span class="i"></span><small></small>'; b.querySelector('.i').textContent = icon; b.querySelector('small').textContent = label;
  b.addEventListener('click', function () { b.blur(); setTool(rail, id); onPick(id); }); rail.appendChild(b); return b;
}
function setTool(rail, id) { rail.querySelectorAll('.st-tool').forEach(function (t) { t.classList.toggle('on', t.dataset.tool === id); }); }
/* a titled card in the side panel; returns the body to put things in */
function section(side, title) { const s = el('section', 'st-sec'); s.appendChild(el('h4', '', title)); const b = el('div', 'st-secbody'); s.appendChild(b); side.appendChild(s); b._sec = s; return b; }
function palette(body, current, onPick, custom) {
  const pal = el('div', 'st-pal');
  PC.COLOURS.forEach(function (c) {
    const b = el('button', 'st-sw' + (c[1] === current ? ' on' : '')); b.type = 'button'; b.style.setProperty('--c', c[1]); b.setAttribute('aria-label', c[0]); b.title = c[0];
    b.addEventListener('click', function () { b.blur(); pal.querySelectorAll('.st-sw').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); onPick(c[1]); CC.sfx.tick(); }); pal.appendChild(b);
  });
  if (custom) {
    const l = el('label', 'st-sw custom'); l.title = 'Any colour'; l.innerHTML = '<span>＋</span>'; const i = document.createElement('input'); i.type = 'color'; i.value = '#ff3b4e'; i.setAttribute('aria-label', 'choose any colour');
    i.addEventListener('input', function () { pal.querySelectorAll('.st-sw').forEach(function (x) { x.classList.remove('on'); }); l.classList.add('on'); l.style.setProperty('--c', i.value); onPick(i.value); });
    l.appendChild(i); pal.appendChild(l);
  }
  body.appendChild(pal); return pal;
}
/* a labelled slider that also shows a round preview of the size */
function slider(body, label, min, max, value, onChange, preview) {
  const row = el('div', 'st-slide'), lab = el('label', '', label), val = el('b', '', String(value)), inp = document.createElement('input');
  inp.type = 'range'; inp.min = min; inp.max = max; inp.value = value; inp.setAttribute('aria-label', label);
  inp.addEventListener('input', function () { val.textContent = inp.value; onChange(+inp.value); if (dot) dot.style.setProperty('--d', Math.min(34, 5 + inp.value * 0.7) + 'px'); });
  const head = el('div', 'st-slidehead'); head.appendChild(lab); head.appendChild(val); row.appendChild(head);
  let dot = null; if (preview) { const line = el('div', 'st-slidebody'); dot = el('i', 'st-dot'); dot.style.setProperty('--d', Math.min(34, 5 + value * 0.7) + 'px'); line.appendChild(inp); line.appendChild(dot); row.appendChild(line); } else row.appendChild(inp);
  body.appendChild(row); return { input: inp, set: function (v) { inp.value = v; val.textContent = v; } };
}
function toggle(body, label, state, onChange) {
  const b = el('button', 'st-toggle' + (state ? ' on' : '')); b.type = 'button'; b.setAttribute('role', 'switch'); b.setAttribute('aria-checked', state ? 'true' : 'false');
  b.innerHTML = '<span class="sw"><i></i></span><span class="t"></span>'; b.querySelector('.t').textContent = label;
  b.addEventListener('click', function () { b.blur(); state = !state; b.classList.toggle('on', state); b.setAttribute('aria-checked', state ? 'true' : 'false'); onChange(state); }); body.appendChild(b); return b;
}
/* a row of buttons where one is chosen: [[id,label]] */
function choice(body, items, current, onPick) {
  const row = el('div', 'st-choice');
  items.forEach(function (it) {
    const b = el('button', 'st-chip' + (it[0] === current ? ' on' : '')); b.type = 'button'; b.textContent = it[1]; b.dataset.id = it[0];
    b.addEventListener('click', function () { b.blur(); row.querySelectorAll('.st-chip').forEach(function (x) { x.classList.toggle('on', x === b); }); onPick(it[0]); }); row.appendChild(b);
  });
  body.appendChild(row); return row;
}
function backgrounds(body, current, onPick) {
  const grid = el('div', 'st-bgs');
  PC.BACKGROUNDS.forEach(function (b) {
    const t = el('button', 'st-bg' + (b.id === current ? ' on' : '')); t.type = 'button'; t.title = b.name; t.setAttribute('aria-label', b.name + ' background');
    t.innerHTML = PC.bgSvg(b.id);
    t.addEventListener('click', function () { t.blur(); grid.querySelectorAll('.st-bg').forEach(function (x) { x.classList.remove('on'); }); t.classList.add('on'); onPick(b.id); }); grid.appendChild(t);
  });
  body.appendChild(grid); return grid;
}
/* the paper: a box with a fixed shape, so everything inside lines up whatever the window size */
function stack(paper, ratio) { const s = el('div', 'st-stack'); s.style.setProperty('--ar', ratio || '480/300'); paper.appendChild(s); return s; }
function bgLayer(stk, id, solid) {
  const box = el('div', 'st-bgbox'); box.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 300" preserveAspectRatio="none"><g></g></svg>'; stk.appendChild(box);
  const g = box.querySelector('g'); g.innerHTML = PC.bgInner(id, solid); return g;
}
function canvas(stk, w, h, cls) { const c = document.createElement('canvas'); c.width = w; c.height = h; c.className = 'st-canvas' + (cls ? ' ' + cls : ''); stk.appendChild(c); return c; }

/* undo and redo: every entry knows how to go back and how to go forward again */
function history(limit) {
  const u = [], r = [];
  return {
    push: function (e) { u.push(e); if (u.length > (limit || 30)) u.shift(); r.length = 0; },
    undo: function () { const e = u.pop(); if (!e) return false; e.undo(); r.push(e); return true; },
    redo: function () { const e = r.pop(); if (!e) return false; e.redo(); u.push(e); return true; },
    clear: function () { u.length = 0; r.length = 0; },
    size: function () { return u.length; }, redoSize: function () { return r.length; }
  };
}
/* an entry for a canvas: call it BEFORE you change the canvas */
function canvasEntry(ctx, w, h) {
  const before = ctx.getImageData(0, 0, w, h); let after = null;
  return { undo: function () { after = ctx.getImageData(0, 0, w, h); ctx.putImageData(before, 0, 0); }, redo: function () { ctx.putImageData(after, 0, 0); } };
}
/* several entries that undo and redo together (for example Start again on every layer) */
function groupEntry(list) { return { undo: function () { list.slice().reverse().forEach(function (e) { e.undo(); }); }, redo: function () { list.forEach(function (e) { e.redo(); }); } }; }
/* freehand brush and rubber on a canvas. o.state() gives { colour, size, tool }, o.enabled() says whether drawing is allowed, o.before() is called at the start of each stroke */
function freehand(cv, o) {
  const ctx = cv.getContext('2d'), W = cv.width, H = cv.height; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; let drawing = false, last = null;
  function pos(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; }
  function stroke(a, b) {
    const s = o.state(); ctx.globalCompositeOperation = s.tool === 'eraser' && !o.eraserPaints ? 'destination-out' : 'source-over';
    ctx.strokeStyle = s.tool === 'eraser' && o.eraserPaints ? (typeof o.eraserPaints === 'function' ? o.eraserPaints() : o.eraserPaints) : s.colour; ctx.lineWidth = s.tool === 'eraser' ? s.size * 1.6 : s.size; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0] + 0.01, b[1]); ctx.stroke();
  }
  cv.addEventListener('pointerdown', function (e) { if (o.enabled && !o.enabled()) return; e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (x) { } if (o.before) o.before(); drawing = true; last = pos(e); stroke(last, last); });
  cv.addEventListener('pointermove', function (e) { if (!drawing) return; const p = pos(e); stroke(last, p); last = p; });
  const end = function () { drawing = false; last = null; ctx.globalCompositeOperation = 'source-over'; }; cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
}
function confirm(stageEl, title, text, yes) {
  CC.ui.show(stageEl, { emoji: '🧹', title: title, text: text, buttons: [{ icon: '✅', label: 'Yes', primary: true, keys: ['Enter'], fn: yes }, { icon: '✖️', label: 'No', fn: function () { } }] });
}
CC.ST = { el: el, shell: shell, action: action, tool: tool, setTool: setTool, section: section, palette: palette, slider: slider, toggle: toggle, choice: choice, backgrounds: backgrounds, stack: stack, bgLayer: bgLayer, canvas: canvas, history: history, canvasEntry: canvasEntry, groupEntry: groupEntry, freehand: freehand, confirm: confirm };
})();
