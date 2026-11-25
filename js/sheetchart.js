/* sheetchart.js - draws a chart (columns, bars, a line or a pie) from a table of numbers as an SVG picture.
   Everything is built with DOM calls and plain text values, never written as markup, so a title or a label from a cell cannot add anything to the page. */
(function () {
'use strict';
const CC = window.CC = window.CC || {};
const NS = 'http://www.w3.org/2000/svg', COLORS = ['#4f46e5', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#a855f7', '#84cc16', '#ec4899'], MAXCAT = 100, MAXSER = 12;
const TYPES = [['col', 'Columns'], ['bar', 'Bars'], ['line', 'Line'], ['pie', 'Pie']];
function s(tag, attrs, text) { const e = document.createElementNS(NS, tag); if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, String(attrs[k])); }); if (text != null) e.textContent = text; return e; }
const clip = function (t, n) { t = String(t); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
function nice(min, max, ticks) {
  const span = max - min || 1, raw = span / ticks, mag = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / mag, step = (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * mag;
  return { lo: Math.floor(min / step) * step, hi: Math.ceil(max / step) * step, step: step };
}
function label(v) { const a = Math.abs(v); return a >= 1e6 ? (v / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M' : a >= 1e4 ? (v / 1e3).toFixed(0) + 'k' : String(Math.round(v * 100) / 100); }
/* spec: { type, title, w, h }  data: { cats: [text], series: [{ name, vals: [number or null] }] } -> an <svg> element */
function draw(spec, data) {
  const w = spec.w, h = spec.h, svg = s('svg', { viewBox: '0 0 ' + w + ' ' + h, width: w, height: h, role: 'img', 'aria-label': (spec.title || 'Chart') + ': a ' + (TYPES.filter(function (t) { return t[0] === spec.type; })[0] || TYPES[0])[1].toLowerCase() + ' chart' });
  svg.appendChild(s('rect', { x: 0, y: 0, width: w, height: h, fill: '#ffffff' }));
  const T = spec.title ? 34 : 12; if (spec.title) svg.appendChild(s('text', { x: w / 2, y: 22, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 'bold', fill: '#1a1b3f', 'font-family': 'Segoe UI, Arial, sans-serif' }, clip(spec.title, 70)));
  const series = data.series.slice(0, MAXSER), cats = data.cats.slice(0, MAXCAT), n = cats.length;
  const msg = function (t) { svg.appendChild(s('text', { x: w / 2, y: h / 2, 'text-anchor': 'middle', 'font-size': 14, fill: '#6a6f96', 'font-family': 'Segoe UI, Arial, sans-serif' }, t)); return svg; };
  if (!n || !series.length) return msg('Select numbers to draw a chart.');
  const legend = series.length > 1 || spec.type === 'pie';
  if (spec.type === 'pie') return pie(svg, spec, series[0], cats, T, msg);
  let min = 0, max = 0; series.forEach(function (sr) { sr.vals.slice(0, n).forEach(function (v) { if (typeof v === 'number') { if (v < min) min = v; if (v > max) max = v; } }); });
  if (min === 0 && max === 0) max = 1;
  const sc = nice(min, max, 5), L = spec.type === 'bar' ? 90 : 52, R = 16, B = (spec.type === 'bar' ? 24 : 40) + (legend ? 24 : 0), x0 = L, x1 = w - R, y0 = T, y1 = h - B, pw = x1 - x0, ph = y1 - y0, font = 'Segoe UI, Arial, sans-serif';
  if (pw < 40 || ph < 40) return msg('This chart is too small.');
  const horizontal = spec.type === 'bar', val = function (v) { return horizontal ? x0 + (v - sc.lo) / (sc.hi - sc.lo) * pw : y1 - (v - sc.lo) / (sc.hi - sc.lo) * ph; };
  for (let v = sc.lo; v <= sc.hi + sc.step / 2; v += sc.step) {                                         // grid lines and the numbers beside them
    const p = val(v); svg.appendChild(horizontal ? s('line', { x1: p, y1: y0, x2: p, y2: y1, stroke: '#e3e5f1' }) : s('line', { x1: x0, y1: p, x2: x1, y2: p, stroke: '#e3e5f1' }));
    svg.appendChild(horizontal ? s('text', { x: p, y: y1 + 15, 'text-anchor': 'middle', 'font-size': 11, fill: '#55598f', 'font-family': font }, label(v)) : s('text', { x: x0 - 6, y: p + 4, 'text-anchor': 'end', 'font-size': 11, fill: '#55598f', 'font-family': font }, label(v)));
  }
  const slot = (horizontal ? ph : pw) / n, zero = val(0);
  svg.appendChild(horizontal ? s('line', { x1: zero, y1: y0, x2: zero, y2: y1, stroke: '#8a8fb8' }) : s('line', { x1: x0, y1: zero, x2: x1, y2: zero, stroke: '#8a8fb8' }));
  const rotate = !horizontal && slot < clip(cats.reduce(function (a, b) { return b.length > a.length ? b : a; }, ''), 10).length * 6.5;
  cats.forEach(function (c, i) {
    const mid = (horizontal ? y0 : x0) + slot * (i + 0.5), txt = clip(c, horizontal ? 14 : 10);
    if (horizontal) svg.appendChild(s('text', { x: x0 - 6, y: mid + 4, 'text-anchor': 'end', 'font-size': 11, fill: '#1a1b3f', 'font-family': font }, txt));
    else svg.appendChild(rotate ? s('text', { x: mid, y: y1 + 14, 'text-anchor': 'end', 'font-size': 11, fill: '#1a1b3f', 'font-family': font, transform: 'rotate(-35 ' + mid + ' ' + (y1 + 14) + ')' }, txt) : s('text', { x: mid, y: y1 + 15, 'text-anchor': 'middle', 'font-size': 11, fill: '#1a1b3f', 'font-family': font }, txt));
  });
  series.forEach(function (sr, k) {
    const col = COLORS[k % COLORS.length];
    if (spec.type === 'line') {
      let d = ''; sr.vals.slice(0, n).forEach(function (v, i) { if (typeof v === 'number') { d += (d && d.slice(-1) !== 'M' ? 'L' : 'M') + (x0 + slot * (i + 0.5)).toFixed(1) + ' ' + val(v).toFixed(1) + ' '; } else d += d ? 'M' : ''; });
      d = d.replace(/M\s*$/, ''); if (d) svg.appendChild(s('path', { d: d.replace(/M ?M/g, 'M'), fill: 'none', stroke: col, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
      sr.vals.slice(0, n).forEach(function (v, i) { if (typeof v === 'number') { const c = s('circle', { cx: x0 + slot * (i + 0.5), cy: val(v), r: 3.5, fill: col }); c.appendChild(s('title', null, sr.name + ', ' + cats[i] + ': ' + v)); svg.appendChild(c); } });
    } else sr.vals.slice(0, n).forEach(function (v, i) {
      if (typeof v !== 'number') return; const gw = slot * 0.74 / series.length, off = slot * 0.13 + gw * k, a = val(v), b = zero;
      const r = horizontal ? s('rect', { x: Math.min(a, b), y: y0 + slot * i + off, width: Math.max(1, Math.abs(a - b)), height: gw, fill: col }) : s('rect', { x: x0 + slot * i + off, y: Math.min(a, b), width: gw, height: Math.max(1, Math.abs(a - b)), fill: col });
      r.appendChild(s('title', null, sr.name + ', ' + cats[i] + ': ' + v)); svg.appendChild(r);
    });
  });
  if (legend) key(svg, series.map(function (sr, k) { return [sr.name, COLORS[k % COLORS.length]]; }), w, h, font);
  return svg;
}
function key(svg, items, w, h, font) {
  let x = 14; items.forEach(function (it) { svg.appendChild(s('rect', { x: x, y: h - 20, width: 11, height: 11, fill: it[1], rx: 2 })); const t = clip(it[0], 14); svg.appendChild(s('text', { x: x + 16, y: h - 10.5, 'font-size': 11, fill: '#1a1b3f', 'font-family': font }, t)); x += 30 + t.length * 6.2; });
}
function pie(svg, spec, sr, cats, T, msg) {
  const w = spec.w, h = spec.h, vals = sr.vals.slice(0, cats.length).map(function (v) { return typeof v === 'number' ? v : 0; }), total = vals.reduce(function (a, b) { return a + b; }, 0), font = 'Segoe UI, Arial, sans-serif';
  if (vals.some(function (v) { return v < 0; }) || total <= 0) return msg('A pie chart needs numbers that are not negative.');
  const cx = w / 2, cy = T + (h - T - 34) / 2, r = Math.max(30, Math.min(w / 2 - 70, (h - T - 50) / 2)); let a = -Math.PI / 2;
  vals.forEach(function (v, i) {
    if (v <= 0) return; const frac = v / total, b = a + frac * 2 * Math.PI, big = frac > 0.5 ? 1 : 0, col = COLORS[i % COLORS.length];
    const p = frac >= 0.9999 ? s('circle', { cx: cx, cy: cy, r: r, fill: col }) : s('path', { d: 'M' + cx + ' ' + cy + ' L' + (cx + r * Math.cos(a)).toFixed(2) + ' ' + (cy + r * Math.sin(a)).toFixed(2) + ' A' + r + ' ' + r + ' 0 ' + big + ' 1 ' + (cx + r * Math.cos(b)).toFixed(2) + ' ' + (cy + r * Math.sin(b)).toFixed(2) + ' Z', fill: col, stroke: '#fff', 'stroke-width': 2 });
    p.appendChild(s('title', null, cats[i] + ': ' + v + ' (' + Math.round(frac * 100) + '%)')); svg.appendChild(p);
    if (frac >= 0.04) { const m = (a + b) / 2; svg.appendChild(s('text', { x: cx + (r + 14) * Math.cos(m), y: cy + (r + 14) * Math.sin(m) + 4, 'text-anchor': Math.cos(m) >= 0 ? 'start' : 'end', 'font-size': 11, fill: '#1a1b3f', 'font-family': font }, clip(cats[i], 12) + ' ' + Math.round(frac * 100) + '%')); }
    a = b;
  });
  return svg;
}
/* read the numbers of a chart from the sheet. ch: { r1, c1, r2, c2, hdr (the first row holds names), lab (the first column holds labels) } */
function read(book, si, ch) {
  const rows = []; for (let r = ch.r1; r <= Math.min(ch.r2, ch.r1 + MAXCAT); r++) { const row = []; for (let c = ch.c1; c <= Math.min(ch.c2, ch.c1 + MAXSER); c++) row.push(book.get(si, r, c)); rows.push(row); }
  const r0 = ch.hdr ? 1 : 0, c0 = ch.lab ? 1 : 0, txt = function (r, c) { return book.display(si, ch.r1 + r, ch.c1 + c); };
  const cats = []; for (let i = r0; i < rows.length; i++) cats.push(ch.lab ? txt(i, 0) : String(i - r0 + 1));
  const series = []; for (let j = c0; j < (rows[0] || []).length; j++) { const vals = []; for (let i = r0; i < rows.length; i++) vals.push(typeof rows[i][j] === 'number' ? rows[i][j] : null); series.push({ name: ch.hdr ? txt(0, j) : 'Series ' + (j - c0 + 1), vals: vals }); }
  return { cats: cats, series: series };
}
/* a good first guess: is the top row names, and is the first column labels? */
function detect(book, si, r1, c1, r2, c2) {
  const isNum = function (r, c) { return typeof book.get(si, r, c) === 'number'; }, many = c2 > c1;
  let textTop = 0, numTop = 0; for (let c = c1 + 1; c <= c2; c++) { if (isNum(r1, c)) numTop++; else if (!book.isEmptyAt(si, r1, c)) textTop++; }
  let textLeft = 0, numLeft = 0; for (let r = r1; r <= r2; r++) { if (isNum(r, c1)) numLeft++; else if (!book.isEmptyAt(si, r, c1)) textLeft++; }
  return { hdr: r2 > r1 && (many ? textTop >= numTop && textTop > 0 : !isNum(r1, c1)), lab: many && textLeft > numLeft };
}
function toPng(svg, w, h) {
  return new Promise(function (ok, no) {
    const xml = new XMLSerializer().serializeToString(svg), im = new Image();
    im.onload = function () { try { const cv = document.createElement('canvas'); cv.width = w * 2; cv.height = h * 2; const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(im, 0, 0, cv.width, cv.height); cv.toBlob(function (b) { b ? ok(b) : no(new Error('The picture could not be made.')); }, 'image/png'); } catch (e) { no(e); } };
    im.onerror = function () { no(new Error('The picture could not be made.')); }; im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
  });
}
CC.sheetchart = { draw: draw, read: read, detect: detect, toPng: toPng, TYPES: TYPES };
})();
