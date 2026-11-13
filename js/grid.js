/* grid.js - Number Grid (Years 4 to 6): a small spreadsheet that works the way real ones do (Excel, Google Sheets, LibreOffice Calc).
     - click a cell and type; ENTER saves and moves down, TAB moves right, ESC cancels, F2 or a double-click edits what is there
     - drag (or SHIFT + arrows) to select a range; the bar at the bottom shows its Sum, Average and Count
     - formulas start with = and use cell names: =B2+B3, =B2*C2, =SUM(B2:B6), =AVERAGE( ), =MAX( ), =MIN( ), =COUNT( )
     - while typing a formula, click a cell (or drag over a range) to write its name
     - the small square at the corner of the selection is the fill handle: drag it to copy a formula down or across (the cell names move with it)
     - Ctrl+C / Ctrl+X / Ctrl+V copy, cut and paste; Ctrl+Z undoes; Ctrl+B is bold; DELETE clears
     - AutoSum writes the SUM formula for you; the chart buttons draw the table you have selected
   A level is a table to start from and a list of steps (see lab.js). */
(function () {
'use strict';
const CC = window.CC, L = CC.lab;
const COLS = ['A', 'B', 'C', 'D', 'E', 'F'], ROWS = 10, REF = /([A-F])(10|[1-9])(?!\d)/g;
const FN = {
  SUM: function (a) { return a.reduce(function (s, x) { return s + x; }, 0); }, AVERAGE: function (a) { return a.length ? a.reduce(function (s, x) { return s + x; }, 0) / a.length : NaN; },
  MAX: function (a) { return a.length ? Math.max.apply(null, a) : 0; }, MIN: function (a) { return a.length ? Math.min.apply(null, a) : 0; }, COUNT: function (a) { return a.length; }
};
const FNRE = /(SUM|AVERAGE|MAX|MIN|COUNT)\(([^()]*)\)/;
function isNum(s) { return s !== '' && s != null && !isNaN(Number(s)) && /\d/.test(String(s)); }
function at(c, r) { return COLS[c] + (r + 1); }
function pos(ref) { return { c: COLS.indexOf(ref[0]), r: +ref.slice(1) - 1 }; }
function rangeRefs(a, b) { const A = pos(a), B = pos(b), out = []; for (let r = Math.min(A.r, B.r); r <= Math.max(A.r, B.r); r++) for (let c = Math.min(A.c, B.c); c <= Math.max(A.c, B.c); c++) out.push(at(c, r)); return out; }
function round(v) { return Math.round(v * 100) / 100; }
/* a copied formula keeps pointing at "the cell two to the left", so every cell name moves with it */
function shift(raw, dc, dr) {
  if (String(raw)[0] !== '=') return raw; let bad = false;
  const out = raw.replace(REF, function (m, col, row) { const c = COLS.indexOf(col) + dc, r = +row - 1 + dr; if (c < 0 || c >= COLS.length || r < 0 || r >= ROWS) { bad = true; return m; } return at(c, r); });
  return bad ? '=#REF!' : out;
}

function build(body, api, year, lv) {
  const G = { cells: {}, fmt: {}, c: 0, r: 0, ac: 0, ar: 0, edit: null, point: null, clip: null, undo: [], chart: null, drag: null, blurT: 0 };
  Object.keys(lv.cells || {}).forEach(function (k) { G.cells[k] = String(lv.cells[k]); });
  (lv.bold || []).forEach(function (k) { G.fmt[k] = { b: 1 }; });

  /* ---------- working out what a cell shows ---------- */
  function value(ref, depth) {
    const raw = (G.cells[ref] || '').trim(); depth = depth || 0;
    if (raw[0] !== '=') return isNum(raw) ? Number(raw) : raw;
    if (depth > 24) return '#LOOP!';
    let x = raw.slice(1).toUpperCase().replace(/\s+/g, ''), err = '', guard = 0;
    if (x.indexOf('#REF!') >= 0) return '#REF!';
    const get = function (q) { const v = value(q, depth + 1); if (typeof v === 'string' && v[0] === '#') err = err || v; return v; };
    const nums = function (list) { const out = []; list.split(',').forEach(function (p) { if (!p) return; const m = p.match(/^([A-F](?:10|[1-9])):([A-F](?:10|[1-9]))$/); if (m) rangeRefs(m[1], m[2]).forEach(function (q) { const v = get(q); if (typeof v === 'number') out.push(v); }); else if (/^[A-F](10|[1-9])$/.test(p)) { const v = get(p); if (typeof v === 'number') out.push(v); } else if (isNum(p)) out.push(Number(p)); else err = err || '#NAME?'; }); return out; };
    while (FNRE.test(x) && guard++ < 12) x = x.replace(FNRE, function (m, f, args) { const v = FN[f](nums(args)); if (isNaN(v)) { err = err || '#DIV/0!'; return '(0)'; } return '(' + v + ')'; });
    x = x.replace(REF, function (m) { const v = get(m); if (v === '') return '(0)'; if (typeof v !== 'number') { err = err || '#VALUE!'; return '(0)'; } return '(' + v + ')'; });
    if (err) return err; if (!x || !/^[\d+\-*/().]+$/.test(x)) return '#NAME?';
    try { const v = Function('"use strict";return (' + x + ')')(); return typeof v !== 'number' || isNaN(v) ? '#VALUE!' : !isFinite(v) ? '#DIV/0!' : round(v); } catch (e) { return '#NAME?'; }
  }
  const isF = function (ref) { return (G.cells[ref] || '').trim()[0] === '='; };
  const ERRTEXT = { '#NAME?': 'has a spelling mistake. Check the function name and the brackets.', '#VALUE!': 'uses a cell with words in it. Formulas need numbers.', '#DIV/0!': 'is dividing by zero or by an empty cell.', '#LOOP!': 'uses its own cell, so it goes round in a circle.', '#REF!': 'points at a cell that does not exist.' };

  /* ---------- the window ---------- */
  const rb = function (cmd, label, title, cls) { return '<button type="button" class="ng-b' + (cls ? ' ' + cls : '') + '" data-cmd="' + cmd + '" title="' + title + '" aria-label="' + title + '">' + label + '</button>'; };
  body.innerHTML = '<div class="ng-wrap"><div class="ng-app"><div class="ng-title"><span class="dot"></span>' + L.esc(lv.file || 'Book1') + ' - Number Grid</div>' +
    '<div class="ng-ribbon">' +
      '<div class="ng-grp">' + rb('undo', '↶', 'Undo (Ctrl+Z)') + '<span class="gl">Undo</span></div>' +
      '<div class="ng-grp">' + rb('paste', '📋', 'Paste (Ctrl+V)') + rb('cut', '✂️', 'Cut (Ctrl+X)') + rb('copy', '📄', 'Copy (Ctrl+C)') + '<span class="gl">Clipboard</span></div>' +
      '<div class="ng-grp">' + rb('bold', '<b>B</b>', 'Bold (Ctrl+B)') + rb('italic', '<i>I</i>', 'Italic (Ctrl+I)') + rb('fill', '<span class="fillico">A</span>', 'Fill colour') + '<span class="gl">Font</span></div>' +
      '<div class="ng-grp">' + rb('left', '<span class="al l"></span>', 'Align left') + rb('center', '<span class="al c"></span>', 'Centre') + rb('right', '<span class="al r"></span>', 'Align right') + '<span class="gl">Alignment</span></div>' +
      '<div class="ng-grp">' + rb('sum', 'Σ AutoSum', 'AutoSum: add the numbers above', 'wide') + '<select class="ng-fn" aria-label="more functions" title="More functions"><option value="">ƒ More</option><option value="AVERAGE">Average</option><option value="MAX">Max</option><option value="MIN">Min</option><option value="COUNT">Count</option></select><span class="gl">Formulas</span></div>' +
      '<div class="ng-grp">' + rb('bar', '📊', 'Column chart') + rb('pie', '🥧', 'Pie chart') + rb('line', '📈', 'Line chart') + '<span class="gl">Charts</span></div>' +
    '</div>' +
    '<div class="ng-fx"><b class="ref">A1</b><button type="button" class="fxb x" data-cmd="cancel" title="Cancel (Esc)" aria-label="cancel">✕</button><button type="button" class="fxb ok" data-cmd="enter" title="Enter" aria-label="enter">✓</button><span class="fx">fx</span><input type="text" aria-label="formula bar" autocomplete="off" spellcheck="false"></div>' +
    '<div class="ng-scroll" tabindex="0"><table class="ng-table"><thead></thead><tbody></tbody></table></div>' +
    '<div class="ng-tabs"><span class="tab">Sheet1</span><span class="mode">Ready</span><span class="agg"></span></div></div>' +
    '<div class="ng-side"><div class="ng-chart"><h4>Chart</h4><div class="empty"></div></div><div class="ng-keys"><h5>💡 Remember</h5><ul>' + (lv.notes || []).map(function (x) { return '<li>' + L.esc(x) + '</li>'; }).join('') + '</ul></div></div></div>';
  const q = function (s) { return body.querySelector(s); };
  const sheet = q('.ng-scroll'), fx = q('.ng-fx input'), refEl = q('.ref'), thead = q('thead'), tbody = q('tbody'), chartBox = q('.ng-chart'), modeEl = q('.mode'), aggEl = q('.agg');
  const ed = document.createElement('input'); ed.type = 'text'; ed.className = 'ng-ed'; ed.autocomplete = 'off'; ed.spellcheck = false; ed.setAttribute('aria-label', 'cell');
  const handle = document.createElement('i'); handle.className = 'ng-fill'; handle.title = 'Drag to copy';
  thead.innerHTML = '<tr><th class="rh"></th>' + COLS.map(function (c) { return '<th data-c="' + c + '">' + c + '</th>'; }).join('') + '</tr>';
  let h = ''; for (let r = 0; r < ROWS; r++) h += '<tr><th class="rh" data-r="' + r + '">' + (r + 1) + '</th>' + COLS.map(function (c, ci) { return '<td data-ref="' + at(ci, r) + '"><span></span></td>'; }).join('') + '</tr>'; tbody.innerHTML = h;
  const td = function (ref) { return tbody.querySelector('[data-ref="' + ref + '"]'); };
  const cur = function () { return at(G.c, G.r); };
  const box = function () { return { c0: Math.min(G.c, G.ac), c1: Math.max(G.c, G.ac), r0: Math.min(G.r, G.ar), r1: Math.max(G.r, G.ar) }; };
  const selRefs = function () { const b = box(); return rangeRefs(at(b.c0, b.r0), at(b.c1, b.r1)); };
  const rangeStr = function () { const b = box(), a = at(b.c0, b.r0), z = at(b.c1, b.r1); return a === z ? a : a + ':' + z; };

  function paint() {
    const b = box(), fb = G.drag && G.drag.fill ? G.drag.fill : null, cl = G.clip;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS.length; c++) {
      const ref = at(c, r), n = td(ref), v = value(ref), f = G.fmt[ref] || {}, inSel = c >= b.c0 && c <= b.c1 && r >= b.r0 && r <= b.r1;
      n.firstChild.textContent = v === '' ? '' : String(v);
      n.className = (typeof v === 'number' ? 'num ' : '') + (typeof v === 'string' && v[0] === '#' ? 'err ' : '') + (f.b ? 'b ' : '') + (f.i ? 'i ' : '') + (f.al ? 'al-' + f.al + ' ' : '') + (f.fill ? 'fillc ' : '') +
        (inSel && (b.c0 !== b.c1 || b.r0 !== b.r1) ? 'rng ' : '') + (c === G.c && r === G.r ? 'sel ' : '') + (G.glow === ref ? 'glow ' : '') +
        (fb && c >= fb.c0 && c <= fb.c1 && r >= fb.r0 && r <= fb.r1 ? 'fillto ' : '') + (cl && c >= cl.c0 && c < cl.c0 + cl.w && r >= cl.r0 && r < cl.r0 + cl.h ? 'ants ' : '');
    }
    thead.querySelectorAll('th[data-c]').forEach(function (t, i) { t.classList.toggle('on', i >= b.c0 && i <= b.c1); }); tbody.querySelectorAll('th[data-r]').forEach(function (t, i) { t.classList.toggle('on', i >= b.r0 && i <= b.r1); });
    refEl.textContent = cur(); if (!G.edit) fx.value = G.cells[cur()] || '';
    const corner = td(at(b.c1, b.r1)); if (!G.edit) corner.appendChild(handle); else if (handle.parentNode) handle.remove();
    const f = G.fmt[cur()] || {}; [['bold', f.b], ['italic', f.i], ['fill', f.fill], ['left', f.al === 'left'], ['center', f.al === 'center'], ['right', f.al === 'right']].forEach(function (x) { q('[data-cmd="' + x[0] + '"]').classList.toggle('on', !!x[1]); });
    q('.ng-app').classList.toggle('editing', !!G.edit); modeEl.textContent = G.edit ? (G.edit.mode === 'enter' ? 'Enter' : 'Edit') : 'Ready';
    const ns = selRefs().map(function (x) { return value(x); }).filter(function (x) { return typeof x === 'number'; });
    aggEl.textContent = ns.length > 1 ? 'Average: ' + round(FN.AVERAGE(ns)) + '     Count: ' + ns.length + '     Sum: ' + round(FN.SUM(ns)) : '';
    drawChart();
  }

  /* ---------- charts: drawn from the table that was selected ---------- */
  function region() {   // one cell selected: use the whole block of filled cells around it, as a real spreadsheet does
    const b = box(); if (b.c0 !== b.c1 || b.r0 !== b.r1) return b;
    const full = function (c, r) { return c >= 0 && c < COLS.length && r >= 0 && r < ROWS && (G.cells[at(c, r)] || '') !== ''; }; let grew = true;
    while (grew) { grew = false;
      for (let c = b.c0 - 1; c <= b.c1 + 1 && !grew; c++) { if (full(c, b.r0 - 1)) { b.r0--; grew = true; } else if (full(c, b.r1 + 1)) { b.r1++; grew = true; } }
      for (let r = b.r0 - 1; r <= b.r1 + 1 && !grew; r++) { if (full(b.c0 - 1, r)) { b.c0--; grew = true; } else if (full(b.c1 + 1, r)) { b.c1++; grew = true; } } }
    return b;
  }
  function makeChart(type) {
    const b = region(), vc = b.c1, rows = []; let title = '';
    for (let r = b.r0; r <= b.r1; r++) { const v = value(at(vc, r)); if (typeof v === 'number') rows.push(r); else if (!rows.length && typeof v === 'string' && v) title = v; }
    if (!rows.length) { if (G.chart) { G.chart.type = type; return true; } return false; }
    const lc = b.c0 < vc ? b.c0 : -1;
    G.chart = { type: type, title: title || 'Chart', val: rows.map(function (r) { return at(vc, r); }), lab: rows.map(function (r) { return lc >= 0 ? at(lc, r) : null; }) };
    return true;
  }
  function drawChart() {
    const c = G.chart, old = chartBox.querySelector('svg, .empty'); if (old) old.remove(); chartBox.querySelector('h4').textContent = c ? c.title : 'Chart';
    if (!c) { chartBox.appendChild(L.el('div', 'empty', 'Select your table, then choose a chart: 📊 🥧 📈')); return; }
    const data = c.val.map(function (ref, i) { const v = value(ref), n = c.lab[i] ? String(value(c.lab[i])) : String(i + 1); return { n: n, v: typeof v === 'number' ? Math.max(0, v) : 0 }; });
    const max = Math.max(1, Math.max.apply(null, data.map(function (d) { return d.v; }))), W = 240, H = 200, pal = ['#4472c4', '#ed7d31', '#70ad47', '#ffc000', '#a77bff', '#22c6c6', '#ff5c72', '#8a8fc0'], step = (W - 40) / Math.max(1, data.length), bw = Math.min(40, step - 6);
    const X = function (i) { return 32 + i * step + (step - bw) / 2; }, Y = function (v) { return 150 - v / max * 120; }, lab = function (d, i) { return '<text x="' + (X(i) + bw / 2) + '" y="166" text-anchor="middle" font-size="' + (data.length > 5 ? 8 : 9.5) + '" fill="#1a1b3f">' + L.esc(d.n.slice(0, 8)) + '</text>'; };
    const axes = '<line x1="26" y1="150" x2="' + (W - 6) + '" y2="150" stroke="#55598f" stroke-width="2"/><line x1="26" y1="24" x2="26" y2="150" stroke="#55598f" stroke-width="2"/><text x="22" y="34" text-anchor="end" font-size="9" fill="#55598f">' + max + '</text><text x="22" y="153" text-anchor="end" font-size="9" fill="#55598f">0</text><line x1="26" y1="30" x2="' + (W - 6) + '" y2="30" stroke="#d6d9f0" stroke-dasharray="3 4"/>';
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">';
    if (c.type === 'pie') {
      const tot = data.reduce(function (t, d) { return t + d.v; }, 0) || 1; let ang = -Math.PI / 2;
      data.forEach(function (d, i) { const a2 = ang + d.v / tot * Math.PI * 2, big = a2 - ang > Math.PI ? 1 : 0, cx = 78, cy = 96, r = 64;
        s += d.v >= tot ? '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + pal[i % 8] + '"/>' : d.v > 0 ? '<path d="M' + cx + ' ' + cy + ' L' + (cx + r * Math.cos(ang)).toFixed(1) + ' ' + (cy + r * Math.sin(ang)).toFixed(1) + ' A' + r + ' ' + r + ' 0 ' + big + ' 1 ' + (cx + r * Math.cos(a2)).toFixed(1) + ' ' + (cy + r * Math.sin(a2)).toFixed(1) + ' Z" fill="' + pal[i % 8] + '" stroke="#fff" stroke-width="2"/>' : '';
        s += '<rect x="156" y="' + (34 + i * 20) + '" width="11" height="11" rx="2" fill="' + pal[i % 8] + '"/><text x="171" y="' + (43.5 + i * 20) + '" font-size="9.5" fill="#1a1b3f">' + L.esc(d.n.slice(0, 7)) + ' ' + Math.round(d.v / tot * 100) + '%</text>'; ang = a2; });
      s += '<text x="78" y="186" text-anchor="middle" font-size="9.5" fill="#55598f">Each slice is a share of the whole</text>';
    } else if (c.type === 'line') {
      s += axes + '<polyline points="' + data.map(function (d, i) { return (X(i) + bw / 2) + ',' + Y(d.v); }).join(' ') + '" fill="none" stroke="#4472c4" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>';
      data.forEach(function (d, i) { s += '<circle cx="' + (X(i) + bw / 2) + '" cy="' + Y(d.v) + '" r="4.5" fill="#fff" stroke="#4472c4" stroke-width="3"/><text x="' + (X(i) + bw / 2) + '" y="' + (Y(d.v) - 9) + '" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#1a1b3f">' + d.v + '</text>' + lab(d, i); });
      s += '<text x="' + W / 2 + '" y="186" text-anchor="middle" font-size="9.5" fill="#55598f">The line shows numbers going up and down</text>';
    } else {
      s += axes; data.forEach(function (d, i) { const bh = d.v / max * 120; s += '<rect x="' + X(i) + '" y="' + (150 - bh) + '" width="' + bw + '" height="' + bh + '" rx="2" fill="' + pal[i % 8] + '"/><text x="' + (X(i) + bw / 2) + '" y="' + (144 - bh) + '" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#1a1b3f">' + d.v + '</text>' + lab(d, i); });
      s += '<text x="' + W / 2 + '" y="186" text-anchor="middle" font-size="9.5" fill="#55598f">A taller bar means a bigger number</text>';
    }
    chartBox.appendChild(L.el('div', '', s + '</svg>').firstChild);
  }

  /* ---------- changing cells (every change can be undone) ---------- */
  function keep() { G.undo.push({ cells: JSON.stringify(G.cells), fmt: JSON.stringify(G.fmt) }); if (G.undo.length > 60) G.undo.shift(); }
  function undo() { if (G.edit) { cancel(); return; } const u = G.undo.pop(); if (!u) { api.note('There is nothing to undo yet.'); return; } G.cells = JSON.parse(u.cells); G.fmt = JSON.parse(u.fmt); G.clip = null; paint(); api.check({ t: 'undo' }); }
  function setCell(ref, raw) { raw = String(raw == null ? '' : raw).trim(); if (raw[0] === '=') { raw = raw.toUpperCase().replace(/\s+/g, ''); const open = (raw.match(/\(/g) || []).length - (raw.match(/\)/g) || []).length; for (let i = 0; i < open; i++) raw += ')'; } if (raw) G.cells[ref] = raw; else delete G.cells[ref]; }
  function select(c, r, extend, via) {
    if (G.edit) commit(); G.c = Math.max(0, Math.min(COLS.length - 1, c)); G.r = Math.max(0, Math.min(ROWS - 1, r)); if (!extend) { G.ac = G.c; G.ar = G.r; } G.glow = null; paint();
    const n = td(cur()); if (n && n.scrollIntoView) n.scrollIntoView({ block: 'nearest', inline: 'nearest' }); api.check({ t: 'select', ref: cur(), via: via });
  }
  function extendTo(c, r) { G.ac = Math.max(0, Math.min(COLS.length - 1, c)); G.ar = Math.max(0, Math.min(ROWS - 1, r)); }

  /* ---------- typing in a cell ---------- */
  function startEdit(mode, first, inBar) {
    clearTimeout(G.blurT); G.blurT = 0; G.ac = G.c; G.ar = G.r; G.edit = { mode: mode }; G.point = null; const v = first != null ? first : (G.cells[cur()] || '');
    ed.value = v; fx.value = v; td(cur()).appendChild(ed); paint(); const t = inBar ? fx : ed; t.focus(); t.setSelectionRange(v.length, v.length);
  }
  function endEdit() { G.edit = null; G.point = null; clearTimeout(G.blurT); G.blurT = 0; if (ed.parentNode) ed.remove(); }
  function commit() {
    if (!G.edit) return; const ref = cur(), raw = (document.activeElement === fx ? fx.value : ed.value); endEdit();
    if ((G.cells[ref] || '') !== raw.trim()) { keep(); setCell(ref, raw); }
    paint(); const v = value(ref);
    if (typeof v === 'string' && v[0] === '#') api.note('The formula in ' + ref + ' ' + (ERRTEXT[v] || 'has a mistake.'));
    api.check({ t: 'set', ref: ref, raw: G.cells[ref] || '' });
  }
  function cancel() { endEdit(); paint(); sheet.focus(); }
  function editKey(e) {
    e.stopPropagation(); const k = e.key, formula = e.target.value.trim()[0] === '=';
    if (k === 'Enter') { e.preventDefault(); commit(); sheet.focus(); select(G.c, G.r + (e.shiftKey ? -1 : 1), false, 'enter'); }
    else if (k === 'Tab') { e.preventDefault(); commit(); sheet.focus(); select(G.c + (e.shiftKey ? -1 : 1), G.r, false, 'enter'); }
    else if (k === 'Escape') { e.preventDefault(); cancel(); }
    else if (G.edit && G.edit.mode === 'enter' && !formula && e.target === ed && /^Arrow/.test(k)) { e.preventDefault(); commit(); sheet.focus(); select(G.c + (k === 'ArrowRight' ? 1 : k === 'ArrowLeft' ? -1 : 0), G.r + (k === 'ArrowDown' ? 1 : k === 'ArrowUp' ? -1 : 0), false, 'key'); }
    else if (k.length === 1 || k === 'Backspace' || k === 'Delete') G.point = null;
  }
  [ed, fx].forEach(function (inp) {
    inp.addEventListener('keydown', editKey); inp.addEventListener('keyup', function (e) { e.stopPropagation(); });
    inp.addEventListener('input', function () { if (!G.edit) { G.edit = { mode: 'edit' }; if (!ed.parentNode) td(cur()).appendChild(ed); paint(); } G.point = null; (inp === ed ? fx : ed).value = inp.value; api.touch(); });
    inp.addEventListener('blur', function () { if (!G.edit) return; clearTimeout(G.blurT); G.blurT = setTimeout(function () { G.blurT = 0; if (G.edit && document.activeElement !== ed && document.activeElement !== fx && body.isConnected) commit(); }, 200); });
    inp.addEventListener('focus', function () { clearTimeout(G.blurT); G.blurT = 0; });
  });
  fx.addEventListener('mousedown', function () { if (!G.edit) { G.ac = G.c; G.ar = G.r; G.edit = { mode: 'edit' }; ed.value = fx.value; td(cur()).appendChild(ed); paint(); } });
  /* while a formula is being typed, a click (or a drag) on the sheet writes the cell name (or the range) */
  function pointAt(ref, extend) {
    const inp = document.activeElement === fx ? fx : ed, v = inp.value; let p = G.point;
    if (!p || v.slice(p.at, p.at + p.len) !== p.txt || (!extend && inp.selectionStart !== p.at + p.len)) { const at0 = inp.selectionStart == null ? v.length : inp.selectionStart; p = G.point = { at: at0, len: 0, txt: '', a: ref }; }
    if (!extend) p.a = ref;
    const A = pos(p.a), B = pos(ref), txt = p.a === ref ? ref : at(Math.min(A.c, B.c), Math.min(A.r, B.r)) + ':' + at(Math.max(A.c, B.c), Math.max(A.r, B.r));
    inp.value = v.slice(0, p.at) + txt + v.slice(p.at + p.len); p.len = txt.length; p.txt = txt; (inp === ed ? fx : ed).value = inp.value; inp.focus(); inp.setSelectionRange(p.at + p.len, p.at + p.len);
  }

  /* ---------- the mouse on the sheet ---------- */
  const cellAt = function (e) { const n = document.elementFromPoint(e.clientX, e.clientY), t = n && n.closest ? n.closest('td[data-ref]') : null; return t && tbody.contains(t) ? t.dataset.ref : null; };
  tbody.addEventListener('mousedown', function (e) {
    if (api.st.locked || e.button !== 0 || e.target === ed) return;
    if (e.target === handle) { e.preventDefault(); G.drag = { kind: 'fill', src: box(), fill: null }; return; }
    const n = e.target.closest('td'); if (!n) return; const ref = n.dataset.ref, P = pos(ref);
    if ((G.edit || G.blurT) && (document.activeElement === fx ? fx : ed).value.trim()[0] === '=' && ref !== cur()) { e.preventDefault(); clearTimeout(G.blurT); G.blurT = 0; if (!G.edit) G.edit = { mode: 'edit' }; pointAt(ref, false); G.drag = { kind: 'point' }; return; }
    e.preventDefault(); if (G.blurT) { clearTimeout(G.blurT); G.blurT = 0; commit(); }
    if (e.shiftKey) { if (G.edit) commit(); extendTo(P.c, P.r); paint(); api.check({ t: 'range', range: rangeStr() }); } else select(P.c, P.r, false, 'click');
    G.drag = { kind: 'sel' }; sheet.focus();
  });
  const onMove = function (e) {
    const d = G.drag; if (!d) return; const ref = cellAt(e); if (!ref) return; const P = pos(ref);
    if (d.kind === 'point') pointAt(ref, true);
    else if (d.kind === 'sel') { if (P.c !== G.ac || P.r !== G.ar) { extendTo(P.c, P.r); paint(); } }
    else { const s = d.src; let f = null;   // the fill handle: down, right, up or left from the cells that were selected
      if (P.r > s.r1) f = { c0: s.c0, c1: s.c1, r0: s.r1 + 1, r1: P.r }; else if (P.c > s.c1) f = { c0: s.c1 + 1, c1: P.c, r0: s.r0, r1: s.r1 };
      else if (P.r < s.r0) f = { c0: s.c0, c1: s.c1, r0: P.r, r1: s.r0 - 1 }; else if (P.c < s.c0) f = { c0: P.c, c1: s.c0 - 1, r0: s.r0, r1: s.r1 };
      if (JSON.stringify(f) !== JSON.stringify(d.fill)) { d.fill = f; paint(); } }
  };
  const onUp = function () {
    const d = G.drag; G.drag = null; if (!d) return;
    if (d.kind === 'sel') { if (G.c !== G.ac || G.r !== G.ar) api.check({ t: 'range', range: rangeStr() }); return; }
    if (d.kind !== 'fill' || !d.fill) { paint(); return; }
    const s = d.src, f = d.fill, w = s.c1 - s.c0 + 1, hh = s.r1 - s.r0 + 1; keep();
    for (let r = f.r0; r <= f.r1; r++) for (let c = f.c0; c <= f.c1; c++) {
      const sc = s.c0 + ((c - s.c0) % w + w) % w, sr = s.r0 + ((r - s.r0) % hh + hh) % hh, from = at(sc, sr), to = at(c, r);
      setCell(to, shift(G.cells[from] || '', c - sc, r - sr)); if (G.fmt[from]) G.fmt[to] = JSON.parse(JSON.stringify(G.fmt[from])); else delete G.fmt[to];
    }
    G.c = Math.min(s.c0, f.c0); G.r = Math.min(s.r0, f.r0); G.ac = Math.max(s.c1, f.c1); G.ar = Math.max(s.r1, f.r1);
    L.sfx('pickup'); paint(); api.check({ t: 'fill', range: rangeStr() });
  };
  document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
  tbody.addEventListener('dblclick', function (e) { const n = e.target.closest('td'); if (n && !api.st.locked && e.target !== ed && e.target !== handle) { const P = pos(n.dataset.ref); if (G.edit) commit(); G.c = G.ac = P.c; G.r = G.ar = P.r; startEdit('edit'); } });

  /* ---------- copy, cut, paste, clear, format ---------- */
  function copy(cut) { if (G.edit) commit(); const b = box(), cells = []; for (let r = b.r0; r <= b.r1; r++) for (let c = b.c0; c <= b.c1; c++) { const ref = at(c, r); cells.push({ raw: G.cells[ref] || '', fmt: G.fmt[ref] ? JSON.parse(JSON.stringify(G.fmt[ref])) : null }); } G.clip = { cells: cells, w: b.c1 - b.c0 + 1, h: b.r1 - b.r0 + 1, c0: b.c0, r0: b.r0, cut: !!cut }; paint(); api.check({ t: cut ? 'cut' : 'copy', range: rangeStr() }); }
  function paste() {
    const cl = G.clip; if (!cl) { api.note('Copy or cut some cells first.'); return; } if (G.edit) commit(); keep(); const b = box();
    if (cl.cut) for (let r = 0; r < cl.h; r++) for (let c = 0; c < cl.w; c++) { const ref = at(cl.c0 + c, cl.r0 + r); delete G.cells[ref]; delete G.fmt[ref]; }
    for (let r = 0; r < cl.h; r++) for (let c = 0; c < cl.w; c++) { const tc = b.c0 + c, tr = b.r0 + r; if (tc >= COLS.length || tr >= ROWS) continue; const x = cl.cells[r * cl.w + c], to = at(tc, tr); setCell(to, cl.cut ? x.raw : shift(x.raw, tc - (cl.c0 + c), tr - (cl.r0 + r))); if (x.fmt) G.fmt[to] = JSON.parse(JSON.stringify(x.fmt)); else delete G.fmt[to]; }
    G.c = b.c0; G.r = b.r0; G.ac = Math.min(COLS.length - 1, b.c0 + cl.w - 1); G.ar = Math.min(ROWS - 1, b.r0 + cl.h - 1); if (cl.cut) G.clip = null; paint(); api.check({ t: 'paste', range: rangeStr() });
  }
  function clearSel() { const refs = selRefs().filter(function (x) { return G.cells[x] != null; }); if (!refs.length) return; keep(); refs.forEach(function (x) { delete G.cells[x]; }); paint(); api.check({ t: 'set', ref: cur(), raw: '' }); }
  function format(key, val) {
    if (G.edit) commit(); keep(); const refs = selRefs(), has = function (x) { const f = G.fmt[x] || {}; return val != null ? f[key] === val : !!f[key]; }, on = !refs.every(has);
    refs.forEach(function (x) { const f = G.fmt[x] = G.fmt[x] || {}; if (on) f[key] = val != null ? val : 1; else delete f[key]; }); paint(); api.check({ t: 'format', key: key });
  }
  function autoSum(fn) {   // writes the formula and waits for ENTER, as a real spreadsheet does
    if (G.edit) commit(); const b = box();
    if (b.c0 !== b.c1 || b.r0 !== b.r1) {   // a block of numbers is selected: the answers go in the row just below it (or to the right of a single row)
      if (!selRefs().some(function (x) { return typeof value(x) === 'number'; })) { api.note('Select some numbers first.'); return; }
      keep();
      if (b.r0 !== b.r1 && b.r1 + 1 < ROWS) { for (let c = b.c0; c <= b.c1; c++) if (typeof value(at(c, b.r1)) === 'number') setCell(at(c, b.r1 + 1), '=' + fn + '(' + at(c, b.r0) + ':' + at(c, b.r1) + ')'); }
      else if (b.c1 + 1 < COLS.length) { for (let r = b.r0; r <= b.r1; r++) setCell(at(b.c1 + 1, r), '=' + fn + '(' + at(b.c0, r) + ':' + at(b.c1, r) + ')'); }
      paint(); api.check({ t: 'set', ref: cur(), raw: '' }); return;
    }
    let r = G.r - 1; while (r >= 0 && typeof value(at(G.c, r)) === 'number') r--;
    if (r < G.r - 1) { startEdit('edit', '=' + fn + '(' + at(G.c, r + 1) + ':' + at(G.c, G.r - 1) + ')'); api.note('Check the formula, then press ENTER.'); return; }
    let c = G.c - 1; while (c >= 0 && typeof value(at(c, G.r)) === 'number') c--;
    if (c < G.c - 1) { startEdit('edit', '=' + fn + '(' + at(c + 1, G.r) + ':' + at(G.c - 1, G.r) + ')'); api.note('Check the formula, then press ENTER.'); return; }
    startEdit('edit', '=' + fn + '('); api.note('Now drag over the numbers you want, then press ENTER.');
  }
  function chart(type) { if (G.edit) commit(); if (!makeChart(type)) { api.note('Click a cell inside your table first, then choose a chart.'); return; } L.sfx('pop'); paint(); api.check({ t: 'chart', kind: type }); }
  const CMD = {
    undo: undo, copy: function () { copy(false); }, cut: function () { copy(true); }, paste: paste, bold: function () { format('b'); }, italic: function () { format('i'); }, fill: function () { format('fill'); },
    left: function () { format('al', 'left'); }, center: function () { format('al', 'center'); }, right: function () { format('al', 'right'); }, sum: function () { autoSum('SUM'); },
    bar: function () { chart('bar'); }, pie: function () { chart('pie'); }, line: function () { chart('line'); }, cancel: function () { if (G.edit) cancel(); }, enter: function () { if (G.edit) { commit(); sheet.focus(); } }
  };
  body.querySelectorAll('[data-cmd]').forEach(function (b) {
    b.addEventListener('mousedown', function (e) { e.preventDefault(); });
    b.addEventListener('click', function () { if (api.st.locked) return; b.classList.remove('glow'); CMD[b.dataset.cmd](); if (!G.edit) sheet.focus(); });
  });
  q('.ng-fn').addEventListener('change', function (e) { const f = e.target.value; e.target.value = ''; if (f && !api.st.locked) autoSum(f); });

  /* ---------- the keyboard on the sheet ---------- */
  sheet.addEventListener('keydown', function (e) {
    if (api.st.locked || e.target === ed || e.target === fx) return;
    const k = e.key, mod = e.ctrlKey || e.metaKey, mv = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[k];
    if (mv) { e.preventDefault(); if (e.shiftKey) { extendTo(G.ac + mv[0], G.ar + mv[1]); paint(); api.check({ t: 'range', range: rangeStr() }); } else select(G.c + mv[0], G.r + mv[1], false, 'key'); }
    else if (k === 'Tab') { e.preventDefault(); select(G.c + (e.shiftKey ? -1 : 1), G.r, false, 'key'); } else if (k === 'Enter') { e.preventDefault(); select(G.c, G.r + (e.shiftKey ? -1 : 1), false, 'key'); }
    else if (k === 'Home') { e.preventDefault(); select(0, mod ? 0 : G.r, false, 'key'); }
    else if (k === 'Delete' || k === 'Backspace') { e.preventDefault(); clearSel(); } else if (k === 'F2') { e.preventDefault(); startEdit('edit'); }
    else if (k === 'Escape') { if (G.clip) { G.clip = null; paint(); } }
    else if (mod && /^[acxvzbi]$/i.test(k)) { e.preventDefault(); const c = k.toLowerCase(); if (c === 'a') { G.c = 0; G.r = 0; G.ac = COLS.length - 1; G.ar = ROWS - 1; paint(); api.check({ t: 'range', range: rangeStr() }); } else CMD[{ c: 'copy', x: 'cut', v: 'paste', z: 'undo', b: 'bold', i: 'italic' }[c]](); }
    else if (k.length === 1 && !mod && !e.altKey) { e.preventDefault(); startEdit('enter', k); }
  });

  api.onTip = function (s) { G.glow = s.cell || null; body.querySelectorAll('.ng-b.glow').forEach(function (b) { b.classList.remove('glow'); }); if (s.btn) [].concat(s.btn).forEach(function (c) { const b = q('[data-cmd="' + c + '"]'); if (b) b.classList.add('glow'); }); paint(); };
  api.onStep = function () { G.glow = null; body.querySelectorAll('.ng-b.glow').forEach(function (b) { b.classList.remove('glow'); }); paint(); setTimeout(function () { api.check({ t: 'step' }); }, 80); };
  const baseStop = api.stop; api.stop = function () { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); baseStop(); };
  api.g = { val: value, isF: isF, raw: function (r) { return (G.cells[r] || '').trim(); }, sel: cur, range: rangeStr, fmt: function (r) { return G.fmt[r] || {}; }, editing: function () { return !!G.edit; }, chart: function () { return G.chart; }, G: G,
    select: function (ref) { const P = pos(ref); select(P.c, P.r, false, 'click'); }, selectRange: function (a, b) { const A = pos(a), B = pos(b); if (G.edit) commit(); G.c = A.c; G.r = A.r; G.ac = B.c; G.ar = B.r; paint(); api.check({ t: 'range', range: rangeStr() }); },
    set: function (ref, raw) { const P = pos(ref); if (G.edit) commit(); G.c = G.ac = P.c; G.r = G.ar = P.r; G.edit = { mode: 'enter' }; ed.value = raw; fx.value = raw; commit(); }, cmd: function (c) { CMD[c](); }, shift: shift,
    fill: function (a, b) { const A = pos(a), B = pos(b); G.c = G.ac = A.c; G.r = G.ar = A.r; G.drag = { kind: 'fill', src: box(), fill: B.r > A.r ? { c0: A.c, c1: A.c, r0: A.r + 1, r1: B.r } : { c0: A.c + 1, c1: B.c, r0: A.r, r1: A.r } }; onUp(); } };
  paint(); setTimeout(function () { if (sheet.isConnected) sheet.focus(); }, 100);
}

/* ---------- the levels: each one builds on the one before ----------
   1 cells and moving   2 typing a table   3 selecting and formatting   4 formulas   5 copying a formula (the fill handle)
   6 SUM and AutoSum    7 charts           8 totals and averages        9 a whole working sheet */
const typeTip = function (cell, what) { return ['Find column ' + cell[0] + ' at the top and row ' + cell.slice(1) + ' at the side.', 'Click cell ' + cell + '. It is glowing.', 'Type ' + what + ' and press ENTER.']; };
const num = function (cell, n) { return function (e, a) { return a.g.val(cell) === n && !a.g.editing(); }; };
const formula = function (cell, n, must) { return function (e, a) { return a.g.isF(cell) && a.g.val(cell) === (typeof n === 'function' ? n(a) : n) && (!must || must.test(a.g.raw(cell))) && !a.g.editing(); }; };
const allF = function (cells, vals) { return function (e, a) { return !a.g.editing() && cells.every(function (c, i) { return a.g.isF(c) && a.g.val(c) === vals[i]; }); }; };
const FILL = ['Click the cell with the formula.', 'Find the small square at its bottom right corner.', 'Press on the square, drag to the last cell, and let go.'];
const LEVELS = [
  { id: 'cells', title: 'Cells and moving', icon: '🔤', min: 4, learned: 'Every cell has a name: its column letter and its row number.',
    notes: ['A cell is one box in the grid.', 'Its name is the column letter, then the row number: B2.', 'The name of the cell you are in shows in the box at the top left.', 'ENTER saves and moves down. TAB saves and moves right.'],
    steps: [
      { say: 'Click cell B2', sub: 'Column B, row 2', win: 'That is B2!', cell: 'B2', tip: ['Columns have letters across the top: A, B, C.', 'Rows have numbers down the side: 1, 2, 3.', 'Go to column B, then down to row 2. Click that box.'], ok: function (e, a) { return a.g.sel() === 'B2'; } },
      { say: 'Type 7 and press ENTER', win: 'B2 holds the number 7.', cell: 'B2', tip: typeTip('B2', '7'), ok: num('B2', 7) },
      { say: 'Click cell A1 and type your name. Press ENTER.', win: 'Cells hold words too!', cell: 'A1', tip: typeTip('A1', 'your name'), ok: function (e, a) { const v = a.g.val('A1'); return typeof v === 'string' && v.length >= 2 && !a.g.editing(); } },
      { say: 'Use the ARROW keys to move to cell D4', win: 'You can move with the keyboard!', cell: 'D4', tip: ['Look at the green box. That is the cell you are in.', 'Press the arrow keys ← ↑ ↓ → to move it.', 'Stop when the box at the top left says D4.'], ok: function (e, a) { return a.g.sel() === 'D4'; } },
      { say: 'Type 25 in D4 and press TAB', sub: 'TAB saves and moves you to the right', win: 'TAB moves across. ENTER moves down.', cell: 'D4', tip: ['Type 25.', 'Press the TAB key, on the left of the keyboard above CAPS LOCK.'], ok: function (e, a) { return a.g.val('D4') === 25 && a.g.sel() === 'E4'; } },
      { say: 'Go back to D4 and press DELETE to empty it', win: 'DELETE empties a cell.', cell: 'D4', tip: ['Click D4, or press the ← arrow.', 'Press the DELETE key.'], ok: function (e, a) { return a.g.val('D4') === '' && a.g.sel() === 'D4'; } }] },
  { id: 'table', title: 'Type a table', icon: '📋', min: 4, learned: 'A table has headings in row 1 and one thing in each row.', file: 'Fruit',
    cells: { A1: 'Fruit', B1: 'Number', A2: 'Apples', A3: 'Bananas', A4: 'Oranges', A5: 'Grapes' },
    notes: ['A table keeps facts in rows and columns.', 'Row 1 holds the headings.', 'To change a cell, click it and type over it.', 'To change part of a cell, double-click it (or press F2).'],
    steps: [
      { say: '5 children like apples. Type 5 in B2.', win: '5 apples!', cell: 'B2', tip: typeTip('B2', '5'), ok: num('B2', 5) },
      { say: 'Type 8 for bananas, 3 for oranges and 6 for grapes', sub: 'ENTER moves you down to the next cell', win: 'The table is full!', cell: 'B3', tip: ['Click B3. Type 8 and press ENTER.', 'You are now in B4. Type 3 and press ENTER.', 'You are now in B5. Type 6 and press ENTER.'], ok: function (e, a) { return a.g.val('B3') === 8 && a.g.val('B4') === 3 && a.g.val('B5') === 6 && !a.g.editing(); } },
      { say: 'Oops, 12 children like bananas. Click B3 and type 12.', sub: 'Typing over a cell replaces what was there', win: 'Changed!', cell: 'B3', tip: typeTip('B3', '12'), ok: num('B3', 12) },
      { say: 'Double-click A5 and change Grapes to Green grapes', sub: 'A double-click lets you edit inside the cell', win: 'You edited inside a cell!', cell: 'A5', tip: ['Double-click cell A5. A cursor appears inside it.', 'Press the HOME key to go to the start.', 'Type Green and a space, then press ENTER.'], ok: function (e, a) { return /^green\s+grapes$/i.test(String(a.g.val('A5'))) && !a.g.editing(); } },
      { say: 'In A6 type Total', win: 'Ready for a total later!', cell: 'A6', tip: typeTip('A6', 'Total'), ok: function (e, a) { return /^total$/i.test(String(a.g.val('A6'))) && !a.g.editing(); } }] },
  { id: 'format', title: 'Select and format', icon: '🎨', min: 4, learned: 'Select first, then choose what to do.', file: 'Fruit',
    cells: { A1: 'Fruit', B1: 'Number', A2: 'Apples', B2: 5, A3: 'Bananas', B3: 12, A4: 'Oranges', B4: 3, A5: 'Grapes', B5: 6 },
    notes: ['Drag across cells to select them all. This is called a range.', 'A1:B1 means from A1 to B1.', 'Select first, then click a button.', 'Ctrl+Z undoes your last change.'],
    steps: [
      { say: 'Drag from A1 to B1 to select both headings', win: 'You selected the range A1:B1.', cell: 'A1', tip: ['Press on cell A1 and hold the button down.', 'Slide to cell B1.', 'Let go. Both cells are inside the green box.'], ok: function (e, a) { return a.g.range() === 'A1:B1'; } },
      { say: 'Click B to make the headings bold', win: 'Bold headings stand out.', btn: 'bold', tip: ['Keep A1 and B1 selected.', 'Click the B button at the top.'], ok: function (e, a) { return !!a.g.fmt('A1').b && !!a.g.fmt('B1').b; } },
      { say: 'Give the headings a fill colour', win: 'Now the heading row is easy to see.', btn: 'fill', tip: ['Keep A1 and B1 selected.', 'Click the button with the yellow A, in the Font group.'], ok: function (e, a) { return !!a.g.fmt('A1').fill && !!a.g.fmt('B1').fill; } },
      { say: 'Select B2 to B5, then click Centre', sub: 'Look at the bar at the bottom: it adds the numbers for you', win: 'Centred. Did you see Sum: 26 at the bottom?', cell: 'B2', btn: 'center', tip: ['Press on B2, drag down to B5 and let go.', 'Click the Centre button in the Alignment group.'], ok: function (e, a) { return ['B2', 'B3', 'B4', 'B5'].every(function (c) { return a.g.fmt(c).al === 'center'; }); } },
      { say: 'Press CTRL + Z to undo the centring', win: 'Undo takes back your last change.', btn: 'undo', tip: ['Hold the CTRL key, tap Z, then let go.', 'Or click the ↶ Undo button.'], ok: function (e, a) { return e.t === 'undo' && !a.g.fmt('B2').al; } }] },
  { id: 'add', title: 'Formulas', icon: '➕', min: 4, learned: 'A formula starts with = and does the sum for you.', file: 'Shop',
    cells: { A1: 'Item', B1: 'Price', A2: 'Pencil', B2: 2, A3: 'Ruler', B3: 3, A4: 'Book', B4: 5, A5: 'Total' }, bold: ['A1', 'B1', 'A5'],
    notes: ['A formula is a sum the computer works out for you.', 'It always starts with =', '+ add   - take away   * times   / divide', 'Use cell names, not the numbers. Then the answer updates by itself.', 'While typing a formula you can click a cell to write its name.'],
    steps: [
      { say: 'Click B5 and type  =B2+B3+B4  then press ENTER', sub: 'A formula always starts with =', win: 'The computer added it: 10!', cell: 'B5', tip: ['Click cell B5.', 'Type the equals sign = first. It tells the computer: work this out.', 'Type B2+B3+B4 and press ENTER.'], ok: formula('B5', function (a) { return a.g.val('B2') + a.g.val('B3') + a.g.val('B4'); }) },
      { say: 'The book now costs 7. Change B4 to 7.', sub: 'Watch the total', win: 'The total changed by itself!', cell: 'B4', tip: typeTip('B4', '7'), ok: function (e, a) { return a.g.val('B4') === 7 && a.g.isF('B5') && a.g.val('B5') === 12 && !a.g.editing(); } },
      { say: 'In C2 type  =B2*2  for the price of two pencils', sub: '* means times', win: 'Formulas can multiply too!', cell: 'C2', tip: ['Click cell C2.', 'Type =B2*2. The star * is SHIFT and 8.', 'Press ENTER.'], ok: formula('C2', function (a) { return a.g.val('B2') * 2; }) },
      { say: 'Click B5 and look at the formula bar at the top', sub: 'The cell shows the answer. The bar shows the formula.', win: 'The answer is in the cell. The formula is in the bar.', cell: 'B5', tip: ['Click cell B5.', 'Look at the long white box next to fx.'], ok: function (e, a) { return a.g.sel() === 'B5' && a.g.isF('B5'); } }] },
  { id: 'fill', title: 'Copy a formula', icon: '⤵️', min: 4, learned: 'The fill handle copies a formula, and the cell names move with it.', file: 'Shop',
    cells: { A1: 'Item', B1: 'Price', C1: 'Bought', D1: 'Cost', A2: 'Pencil', B2: 2, C2: 4, A3: 'Ruler', B3: 3, C3: 2, A4: 'Book', B4: 7, C4: 1, A5: 'Pen', B5: 4, C5: 3 }, bold: ['A1', 'B1', 'C1', 'D1'],
    notes: ['The small square at the corner of the selected cell is the fill handle.', 'Drag it to copy the cell down or across.', 'A copied formula changes its cell names: =B2*C2 becomes =B3*C3.', 'Copy and Paste (Ctrl+C, Ctrl+V) do the same job.'],
    steps: [
      { say: 'In D2 type  =B2*C2  for the cost of the pencils', win: '4 pencils cost 8.', cell: 'D2', tip: ['Click cell D2.', 'Type =B2*C2 and press ENTER.'], ok: formula('D2', 8) },
      { say: 'Click D2. Drag the small square at its corner down to D5.', sub: 'This copies the formula to every row', win: 'One formula, copied to every row!', cell: 'D2', tip: FILL, ok: allF(['D3', 'D4', 'D5'], [6, 7, 12]) },
      { say: 'Click D4 and look at its formula', sub: 'The cell names moved down with it', win: '=B4*C4. The names changed by themselves.', cell: 'D4', tip: ['Click cell D4.', 'Read the formula bar at the top.'], ok: function (e, a) { return a.g.sel() === 'D4' && a.g.isF('D4'); } },
      { say: 'Copy D5, then paste it in D6', sub: 'Ctrl+C to copy, click D6, Ctrl+V to paste', win: 'Copy and paste work on formulas too.', cell: 'D5', btn: ['copy', 'paste'], tip: ['Click D5. Hold CTRL and tap C. Moving dashes go round the cell.', 'Click D6.', 'Hold CTRL and tap V.'], ok: function (e, a) { return a.g.isF('D6') && !a.g.editing(); } },
      { say: 'D6 is not needed. Click it and press DELETE.', win: 'Tidy!', cell: 'D6', tip: ['Click cell D6.', 'Press the DELETE key.'], ok: function (e, a) { return a.g.raw('D6') === '' && a.g.isF('D5'); } }] },
  { id: 'sum', title: 'SUM and AutoSum', icon: 'Σ', min: 4, learned: 'SUM adds a whole range. AutoSum writes it for you.', file: 'Steps',
    cells: { A1: 'Day', B1: 'Steps', A2: 'Mon', B2: 40, A3: 'Tue', B3: 65, A4: 'Wed', B4: 30, A5: 'Thu', B5: 80, A6: 'Fri', B6: 55, A7: 'Total', A8: 'Biggest', A9: 'Smallest' }, bold: ['A1', 'B1', 'A7', 'A8', 'A9'],
    notes: ['=SUM(B2:B6) adds every cell from B2 down to B6.', 'B2:B6 is a range. The : means "to".', 'Σ AutoSum finds the numbers above and writes the formula. Press ENTER to accept it.', '=MAX( ) finds the biggest number. =MIN( ) finds the smallest.'],
    steps: [
      { say: 'Click B7 and type  =SUM(B2:B6)  then press ENTER', sub: 'B2:B6 means every cell from B2 to B6', win: 'SUM added all five: 270.', cell: 'B7', tip: ['Click cell B7, the empty cell under the numbers.', 'Type =SUM(B2:B6). It means: add every cell from B2 to B6.', 'Press ENTER.'], ok: formula('B7', 270, /SUM/) },
      { say: 'Now the quick way. Delete B7, then click Σ AutoSum and press ENTER.', win: 'AutoSum wrote the formula for you!', cell: 'B7', btn: 'sum', tip: ['Click B7 and press DELETE.', 'Click the Σ AutoSum button. It writes =SUM(B2:B6).', 'Press ENTER to accept it.'], seen: false,
        start: function () { this.seen = false; }, ok: function (e, a) { if (a.g.raw('B7') === '') this.seen = true; return this.seen && a.g.isF('B7') && a.g.val('B7') === 270 && !a.g.editing(); } },
      { say: 'In B8 type  =MAX(B2:B6)  to find the biggest number', win: 'MAX found the best day: 80.', cell: 'B8', tip: ['Click cell B8.', 'Type =MAX(B2:B6) and press ENTER.'], ok: formula('B8', 80, /MAX/) },
      { say: 'In B9 find the smallest number with MIN', win: 'MIN found the quietest day: 30.', cell: 'B9', tip: ['Click cell B9.', 'Type =MIN(B2:B6) and press ENTER.'], ok: formula('B9', 30, /MIN/) }] },
  { id: 'chart', title: 'Charts', icon: '📊', min: 4, learned: 'A chart turns a table into a picture.', file: 'Steps',
    cells: { A1: 'Day', B1: 'Steps', A2: 'Mon', B2: 40, A3: 'Tue', B3: 65, A4: 'Wed', B4: 30, A5: 'Thu', B5: 80, A6: 'Fri', B6: 55 }, bold: ['A1', 'B1'],
    notes: ['Select the table first, then choose a chart.', 'A column chart compares sizes: a taller bar is a bigger number.', 'A pie chart shows each share of the whole.', 'A line chart shows change over time.', 'The chart is joined to the table. Change a number and it redraws.'],
    steps: [
      { say: 'Drag from A1 to B6 to select the whole table', win: 'The table is selected.', cell: 'A1', tip: ['Press on cell A1 and hold.', 'Slide down and right to B6.', 'Let go.'], ok: function (e, a) { return a.g.range() === 'A1:B6'; } },
      { say: 'Click 📊 to draw a column chart', win: 'A column chart! Thursday has the tallest bar.', btn: 'bar', tip: ['Keep the table selected.', 'Click the 📊 button in the Charts group.'], ok: function (e, a) { const c = a.g.chart(); return !!c && c.type === 'bar'; } },
      { say: 'Wednesday was really 90 steps. Change B4 to 90.', sub: 'Watch the chart', win: 'The chart changed by itself!', cell: 'B4', tip: typeTip('B4', '90'), ok: function (e, a) { return a.g.val('B4') === 90 && !!a.g.chart() && !a.g.editing(); } },
      { say: 'Click 📈 to see the steps as a line chart', win: 'A line chart shows change from day to day.', btn: 'line', tip: ['Click any cell in the table.', 'Click the 📈 button in the Charts group.'], ok: function (e, a) { const c = a.g.chart(); return !!c && c.type === 'line'; } },
      { say: 'Click 🥧 to see each day as a slice', win: 'A pie chart shows each share of the whole.', btn: 'pie', tip: ['Click any cell in the table.', 'Click the 🥧 button in the Charts group.'], ok: function (e, a) { const c = a.g.chart(); return !!c && c.type === 'pie'; } }] },
  { id: 'avg', title: 'Totals and averages', icon: '🧮', min: 5, learned: 'AVERAGE shares the total out equally.', file: 'Marks',
    cells: { A1: 'Name', B1: 'Maths', C1: 'English', D1: 'Total', A2: 'Amina', B2: 8, C2: 6, A3: 'Ben', B3: 5, C3: 9, A4: 'Chipo', B4: 10, C4: 7, A6: 'Average' }, bold: ['A1', 'B1', 'C1', 'D1', 'A6'],
    notes: ['The average is the total shared out equally.', '=AVERAGE(B2:B4) adds the cells, then divides by how many there are.', 'Write a formula once, then copy it with the fill handle.', 'ƒ More has Average, Max, Min and Count ready to use.'],
    steps: [
      { say: 'In D2 type  =B2+C2  for Amina\'s total', win: 'Amina has 14.', cell: 'D2', tip: ['Click cell D2.', 'Type =B2+C2 and press ENTER.'], ok: formula('D2', 14) },
      { say: 'Copy the formula down to D3 and D4 with the fill handle', win: 'All three totals!', cell: 'D2', tip: FILL, ok: allF(['D3', 'D4'], [14, 17]) },
      { say: 'In B6 type  =AVERAGE(B2:B4)  for the Maths average', win: 'The Maths average is 7.67.', cell: 'B6', tip: ['Click cell B6.', 'Type =AVERAGE(B2:B4) and press ENTER.'], ok: formula('B6', 7.67, /AVERAGE/) },
      { say: 'Drag the fill handle of B6 across to C6', sub: 'The fill handle works sideways too', win: 'The English average is 7.33.', cell: 'B6', tip: ['Click cell B6.', 'Press on the small square at its corner.', 'Drag right to C6 and let go.'], ok: formula('C6', 7.33, /AVERAGE/) },
      { say: 'Drag from A1 to D4, then click 📊', sub: 'The chart uses the first and the last column: the names and the totals', win: 'Chipo has the most marks.', cell: 'A1', btn: 'bar', tip: ['Press on A1, drag to D4 and let go.', 'Click the 📊 button in the Charts group.'], ok: function (e, a) { return !!a.g.chart(); } }] },
  { id: 'shop', title: 'Run the tuck shop', icon: '🛒', min: 6, learned: 'You built a real working spreadsheet!', file: 'Tuck shop',
    cells: { A1: 'Item', B1: 'Price', C1: 'Sold', D1: 'Money', A2: 'Juice', B2: 4, C2: 12, A3: 'Crisps', B3: 3, C3: 20, A4: 'Fruit', B4: 2, C4: 15, A6: 'Total', A7: 'Costs', D7: 60, A8: 'Profit' }, bold: ['A6', 'A8'],
    notes: ['Money = price × number sold.', 'Profit = money in − costs.', 'Because you used cell names, every answer updates when a number changes.'],
    steps: [
      { say: 'Work out the money from juice in D2', sub: 'Price times the number sold', win: 'Juice made 48.', cell: 'D2', tip: ['Click cell D2.', 'Type =B2*C2 and press ENTER.'], ok: formula('D2', 48) },
      { say: 'Copy the formula for crisps and fruit', win: 'Every item is worked out.', cell: 'D2', tip: FILL, ok: allF(['D3', 'D4'], [60, 30]) },
      { say: 'Add up all the money in D6', win: 'The shop took 138.', cell: 'D6', btn: 'sum', tip: ['Click cell D6.', 'Type =SUM(D2:D4) and press ENTER.'], ok: formula('D6', 138) },
      { say: 'Profit is the total take away the costs. Work it out in D8.', win: 'A profit of 78!', cell: 'D8', tip: ['Click cell D8.', 'Type =D6-D7 and press ENTER.'], ok: formula('D8', function (a) { return a.g.val('D6') - a.g.val('D7'); }) },
      { say: 'The shop sold 30 crisps, not 20. Fix C3 and check the profit.', win: 'Every formula updated by itself. That is the power of a spreadsheet!', cell: 'C3', tip: typeTip('C3', '30'), ok: function (e, a) { return a.g.val('C3') === 30 && a.g.val('D8') === 108 && !a.g.editing(); } },
      { say: 'Make the headings bold with a fill colour, then draw a chart of the money', win: 'A finished report!', btn: ['bold', 'fill', 'bar'], tip: ['Drag from A1 to D1. Click B, then the fill colour button.', 'Drag from A1 to D4, then click 📊.'], ok: function (e, a) { return !!a.g.chart() && !!a.g.fmt('A1').fill && !!a.g.fmt('A1').b; } }] }
];
LEVELS.forEach(function (lv) { lv.build = function (body, api, year) { build(body, api, year, lv); }; });

CC.modes.grid = L.game({
  id: 'grid', icon: '🔢', title: 'Number Grid', color: '#3fa84f', cert: { hero: 'Spreadsheet Star', art: 'grid', hue: 140 },
  sub: 'A real spreadsheet: fill in tables, let formulas do the sums, and draw charts.',
  stage: function () { return document.getElementById('stage-grid'); }, root: function () { return document.getElementById('grid-root'); },
  levels: function (y) { return LEVELS.filter(function (l) { return y >= l.min; }); }
});
})();
