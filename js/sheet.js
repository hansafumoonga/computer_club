/* sheet.js - the stand-alone Number Grid: a spreadsheet with up to 52 columns and 1000 rows, formulas and about 120 functions, formatting,
   sorting, charts, several sheets, find and replace, and downloads (Excel, CSV, print). Work is kept on this computer for 3 hours after
   the last change (CC.keep). Safety: formulas are read by our own parser and never run as code; every cell's text, every name and every
   chart label is put on the page as plain text; a saved copy is checked value by value when it is loaded. */
(function () {
'use strict';
const CC = window.CC, P = CC.sheetparse, Fm = CC.sheetfmt, SB = CC.sheetbook, Book = SB.Book, BL = SB.BL, DF = CC.docfile, DOC = CC.sheetdoc, CH = CC.sheetchart, LIM = P.LIM, Err = CC.sheetcalc.Err;
const KEY = 'sheet', MAXSAVE = 1800000, MAX_UNDO = 60, MAX_UNDO_CHARS = 60000000;
const FONT_CSS = { 'Calibri': 'Calibri, Carlito, "Segoe UI", Arial, sans-serif', 'Arial': 'Arial, Helvetica, sans-serif', 'Times New Roman': '"Times New Roman", Times, serif', 'Courier New': '"Courier New", monospace', 'Verdana': 'Verdana, sans-serif', 'Georgia': 'Georgia, serif', 'Comic Sans MS': '"Comic Sans MS", cursive', 'Trebuchet MS': '"Trebuchet MS", sans-serif', 'Tahoma': 'Tahoma, sans-serif' };
const SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36, 48, 72];
const PALETTE = ['#000000', '#434343', '#7f7f7f', '#bfbfbf', '#ffffff', '#c00000', '#ff0000', '#ff9900', '#ffc000', '#ffff00', '#92d050', '#00b050', '#00b0f0', '#0070c0', '#002060', '#7030a0', '#ff66cc', '#996633', '#66ccff', '#cc99ff'];
const FILLS = ['#ffffff', '#e0e7ff', '#dcfce7', '#fef9c3', '#fee2e2', '#fce7f3', '#f3f4f6', '#bfdbfe', '#fed7aa', '#ffff00', '#92d050', '#00b0f0'];
const RULES = [['gt', 'is greater than'], ['lt', 'is less than'], ['ge', 'is greater than or equal to'], ['le', 'is less than or equal to'], ['eq', 'is equal to'], ['ne', 'is not equal to'], ['between', 'is between'], ['text', 'contains the text']];
const LOOKS = [['Light red fill with dark red text', '#ffc7ce', '#9c0006'], ['Yellow fill with dark yellow text', '#ffeb9c', '#9c5700'], ['Green fill with dark green text', '#c6efce', '#006100'], ['Light blue fill', '#bdd7ee', '#1f3864'], ['Red text', null, '#c00000'], ['Green text', null, '#007a33']];
const el = function (tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const clamp = function (v, lo, hi) { return Math.max(lo, Math.min(hi, v)); };

function mount(host) {
  const S = { book: new Book(), name: 'My spreadsheet', zoom: 100, grid: true };
  let sel = { r0: 0, c0: 0, r1: 0, c1: 0 }, undo = [], redo = [], editing = null, clipInfo = null, dragSel = null, dragFill = null, dragCol = null, dragChart = null, openPop = null, saveTimer = 0, renderQueued = false, hintItems = [], hintAt = 0;
  const views = {}, chartEls = new Map(), ctl = {};
  host.textContent = ''; const root = el('div', 'sh'); host.appendChild(root);
  const bk = function () { return S.book; }, SI = function () { return S.book.active; }, SH = function () { return S.book.sheets[S.book.active]; }, Z = function () { return S.zoom / 100; };

  /* ---------- the parts of the screen ---------- */
  const bar = el('div', 'sh-bar'), nameIn = el('input', 'sh-name'), msg = el('span', 'sh-msg'), stateEl = el('span', 'sh-state');
  nameIn.type = 'text'; nameIn.maxLength = 60; nameIn.value = S.name; nameIn.spellcheck = false; nameIn.setAttribute('aria-label', 'Spreadsheet name');
  const btnNew = tbtn('📄 New', 'Start a new, empty spreadsheet'), btnDl = tbtn('⬇ Download ▾', 'Download a copy of your spreadsheet'), btnPrint = tbtn('🖨 Print', 'Print the sheet (Ctrl+P)');
  bar.append(el('span', 'sh-logo', '📊'), nameIn, stateEl, msg, btnNew, btnDl, btnPrint);
  const tabs = el('div', 'sh-tabs'), panels = el('div', 'sh-panels');
  const fx = el('div', 'sh-fx'), nameBox = el('input', 'sh-ref'), fxBtn = tbtn('ƒx', 'Insert a function', 'fxb'), fxIn = el('input', 'sh-fxin'), fxOk = tbtn('✓', 'Accept (Enter)', 'fxb ok'), fxNo = tbtn('✗', 'Cancel (Esc)', 'fxb no');
  nameBox.type = 'text'; nameBox.setAttribute('aria-label', 'Cell address: type one to go there'); nameBox.spellcheck = false; fxIn.type = 'text'; fxIn.setAttribute('aria-label', 'Formula bar'); fxIn.spellcheck = false; fxIn.autocomplete = 'off'; fxIn.maxLength = LIM.formula;
  fx.append(nameBox, fxNo, fxOk, fxBtn, fxIn);
  const main = el('div', 'sh-main'), corner = el('div', 'sh-corner'), colh = el('div', 'sh-colh'), rowh = el('div', 'sh-rowh'), scroll = el('div', 'sh-scroll'), sizer = el('div', 'sh-sizer'), view = el('div', 'sh-view');
  scroll.appendChild(sizer); scroll.setAttribute('role', 'grid');
  const sink = el('textarea', 'sh-sink'); sink.setAttribute('aria-label', 'Spreadsheet cells. Use the arrow keys to move between cells and type to enter something.'); sink.spellcheck = false; sink.autocomplete = 'off';      // keys, copy and paste are received here while no cell is being edited
  function focusGrid() { try { sink.focus({ preventScroll: true }); } catch (e) { sink.focus(); } }
  const cellsL = el('div', 'sh-cells'), chartsL = el('div', 'sh-charts'), selBox = el('div', 'sh-selbox'), actBox = el('div', 'sh-actbox'), fillH = el('div', 'sh-fill'), clipBox = el('div', 'sh-clipbox'), fillPrev = el('div', 'sh-fillprev');
  const ed = el('textarea', 'sh-edit'); ed.rows = 1; ed.spellcheck = false; ed.autocomplete = 'off'; ed.hidden = true; ed.setAttribute('aria-label', 'Edit the cell');
  const hint = el('div', 'sh-hint'); hint.hidden = true;
  view.append(cellsL, chartsL, clipBox, selBox, fillPrev, actBox, fillH, ed, hint); main.append(scroll, view, colh, rowh, corner, sink);
  const foot = el('div', 'sh-foot'), sheetTabs = el('div', 'sh-sheets'), addBtn = tbtn('＋', 'Add a sheet', 'sh-add'), sum = el('span', 'sh-sum'), zoomWrap = el('span', 'sh-zoom'), zOut = el('button', null, '−'), zIn = el('button', null, '+'), zLab = el('b', null, '100%');
  zOut.type = zIn.type = 'button'; zOut.setAttribute('aria-label', 'Zoom out'); zIn.setAttribute('aria-label', 'Zoom in'); zoomWrap.append(zOut, zLab, zIn); foot.append(sheetTabs, addBtn, sum, zoomWrap);
  root.append(bar, tabs, panels, fx, main, foot);
  function tbtn(label, title, cls) { const b = el('button', 'sh-b' + (cls ? ' ' + cls : ''), label); b.type = 'button'; b.title = title; b.setAttribute('aria-label', title); return b; }
  function say(t, kind) { msg.textContent = t; msg.className = 'sh-msg' + (kind ? ' ' + kind : ''); clearTimeout(say.t); if (t) say.t = setTimeout(function () { msg.textContent = ''; }, 7000); }

  /* ---------- sizes and positions ---------- */
  let X = [0], Y = [0];
  const colW = function (c) { return Math.round((SH().cw[c] || BL.cw) * Z()); }, rowHt = function (r) { return Math.round((SH().rh[r] || BL.rh) * Z()); };
  function layout() { X = [0]; Y = [0]; for (let c = 0; c < LIM.cols; c++) X.push(X[c] + colW(c)); for (let r = 0; r < LIM.rows; r++) Y.push(Y[r] + rowHt(r)); sizer.style.width = X[LIM.cols] + 'px'; sizer.style.height = Y[LIM.rows] + 'px'; }
  function findIdx(arr, off) { let lo = 0, hi = arr.length - 2; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (arr[m] <= off) lo = m; else hi = m - 1; } return lo; }
  const frozen = function () { const f = SH().freeze; return { r: f.r, c: f.c, w: X[f.c] || 0, h: Y[f.r] || 0 }; };
  const viewW = function () { return scroll.clientWidth; }, viewH = function () { return scroll.clientHeight; };
  function mergeAt(r, c) { const m = SH().merges; for (let i = 0; i < m.length; i++) if (r >= m[i].r1 && r <= m[i].r2 && c >= m[i].c1 && c <= m[i].c2) return m[i]; return null; }
  function box(r1, c1, r2, c2) { return { x: X[c1], y: Y[r1], w: X[c2 + 1] - X[c1], h: Y[r2 + 1] - Y[r1] }; }
  function toScreen(b, r, c) { const f = frozen(), sx = scroll.scrollLeft, sy = scroll.scrollTop; return { x: c < f.c ? b.x : b.x - sx, y: r < f.r ? b.y : b.y - sy, w: b.w, h: b.h }; }
  function hitCell(clientX, clientY) {
    const rc = scroll.getBoundingClientRect(), f = frozen(); let x = clientX - rc.left, y = clientY - rc.top; x = x < f.w ? x : x + scroll.scrollLeft; y = y < f.h ? y : y + scroll.scrollTop;
    return { r: clamp(findIdx(Y, Math.max(0, y)), 0, LIM.rows - 1), c: clamp(findIdx(X, Math.max(0, x)), 0, LIM.cols - 1) };
  }

  /* ---------- drawing ---------- */
  function schedule() { if (renderQueued) return; renderQueued = true; Promise.resolve().then(function () { renderQueued = false; render(); }); }
  function textFor(v, r, c, w, fpx) {
    const st = bk().styleAt(SI(), r, c); let t = bk().display(SI(), r, c); const fit = Math.max(1, Math.floor((w - 6) / (fpx * 0.56)));
    if (typeof v === 'number' && t.length > fit) t = st.fmt ? '#'.repeat(fit) : Fm.fitGeneral(v, fit);
    return t;
  }
  function render() {
    if (host.hidden) return; view.style.width = scroll.clientWidth + 'px'; view.style.height = scroll.clientHeight + 'px';       // the cells cover the scrolling area, but not its scroll bars
    const b = bk(), si = SI(), sh = SH(), f = frozen(), z = Z(), sx = scroll.scrollLeft, sy = scroll.scrollTop, W = viewW(), H = viewH();
    const c0 = Math.max(f.c, findIdx(X, sx + f.w)), c1 = Math.min(LIM.cols - 1, findIdx(X, sx + W)), r0 = Math.max(f.r, findIdx(Y, sy + f.h)), r1 = Math.min(LIM.rows - 1, findIdx(Y, sy + H));
    const cols = [], rows = []; for (let c = 0; c < f.c; c++) cols.push(c); for (let c = c0; c <= c1; c++) cols.push(c); for (let r = 0; r < f.r; r++) rows.push(r); for (let r = r0; r <= r1; r++) rows.push(r);
    cellsL.textContent = ''; const covered = Object.create(null), frag = document.createDocumentFragment(), drawn = [];
    sh.merges.forEach(function (m) { if (m.r2 < rows[0] || m.r1 > rows[rows.length - 1] || m.c2 < cols[0] || m.c1 > cols[cols.length - 1]) return; for (let r = m.r1; r <= m.r2; r++) for (let c = m.c1; c <= m.c2; c++) covered[r * 64 + c] = true; delete covered[m.r1 * 64 + m.c1]; drawn.push(m); });
    function put(r, c, rr1, cc1, rr2, cc2) {
      const bb = box(r, c, rr2, cc2), p = toScreen(bb, r, c), v = b.get(si, r, c), st = b.styleAt(si, r, c), rule = sh.cf.length ? b.ruleStyle(si, r, c) : null, d = el('div', 'sh-c'), fpx = Math.round((st.sz || 11) * 4 / 3 * z * 10) / 10;
      d.style.left = p.x + 'px'; d.style.top = p.y + 'px'; d.style.width = p.w + 'px'; d.style.height = p.h + 'px'; d.dataset.r = r; d.dataset.c = c;
      if (!S.grid) d.classList.add('ng');
      if (st.ff) d.style.fontFamily = FONT_CSS[st.ff] || ''; d.style.fontSize = fpx + 'px'; if (st.b) d.style.fontWeight = 'bold'; if (st.i) d.style.fontStyle = 'italic';
      const deco = (st.u ? 'underline ' : '') + (st.s ? 'line-through' : ''); if (deco) d.style.textDecoration = deco.trim();
      const col = rule && rule.col || st.col, bg = rule && rule.bg || st.bg; if (col) d.style.color = col; if (bg) d.style.background = bg;
      const isErr = v instanceof Err, kind = isErr ? 'err' : typeof v === 'number' ? 'num' : typeof v === 'boolean' ? 'bool' : 'txt'; d.classList.add('k-' + kind);
      let al = st.al || (kind === 'num' ? 'r' : kind === 'txt' ? 'l' : 'c'); const span = el('span', 'sh-t'); span.style.textAlign = { l: 'left', c: 'center', r: 'right' }[al];
      if (st.wr) { d.classList.add('wr'); } const vt = st.va; d.style.alignItems = vt === 't' ? 'flex-start' : vt === 'm' ? 'center' : 'flex-end';
      if (v !== null) {
        span.textContent = textFor(v, r, c, p.w, fpx); let spill = 0;                                           // text runs on into empty cells next to it
        if (kind === 'txt' && !st.wr && al === 'l') { for (let k = cc2 + 1; k < LIM.cols && spill < 1200 && b.isEmptyAt(si, r, k) && !mergeAt(r, k); k++) spill += colW(k); if (spill) span.style.width = (p.w + spill) + 'px'; }
        if (isErr) d.title = v.code + ': ' + (DOC.errors[v.code] || '');
        d.appendChild(span);
      }
      const nb = function (rr, cc, side) { return rr >= 0 && cc >= 0 && rr < LIM.rows && cc < LIM.cols && (b.styleAt(si, rr, cc).bd || '').indexOf(side) >= 0; }, own = st.bd || '';
      if (own.indexOf('t') >= 0 && !nb(r - 1, c, 'b')) d.style.borderTop = '1px solid #222'; if (own.indexOf('l') >= 0 && !nb(r, c - 1, 'r')) d.style.borderLeft = '1px solid #222';
      if (own.indexOf('r') >= 0 || nb(r, cc2 + 1, 'l')) d.style.borderRight = '1px solid #222'; if (own.indexOf('b') >= 0 || nb(rr2 + 1, c, 't')) d.style.borderBottom = '1px solid #222';
      frag.appendChild(d); void rr1; void cc1;
    }
    rows.forEach(function (r) { cols.forEach(function (c) { if (!covered[r * 64 + c]) { const m = mergeAt(r, c); if (m && m.r1 === r && m.c1 === c) return; put(r, c, r, c, r, c); } }); });
    drawn.forEach(function (m) { put(m.r1, m.c1, m.r1, m.c1, m.r2, m.c2); });
    cellsL.appendChild(frag);
    // the number and letter headings
    colh.textContent = ''; rowh.textContent = ''; const hc = document.createDocumentFragment(), hr = document.createDocumentFragment(), s = ordered(); const wholeCols = s.r1 === 0 && s.r2 === LIM.rows - 1, wholeRows = s.c1 === 0 && s.c2 === LIM.cols - 1;
    cols.forEach(function (c) { const d = el('div', 'sh-h', P.colName(c)), x = c < f.c ? X[c] : X[c] - sx; d.style.left = x + 'px'; d.style.width = colW(c) + 'px'; d.dataset.c = c; if (c >= s.c1 && c <= s.c2) d.classList.add(wholeCols ? 'all' : 'on'); hc.appendChild(d); const g = el('div', 'sh-grip'); g.style.left = (x + colW(c) - 3) + 'px'; g.dataset.c = c; hc.appendChild(g); });
    rows.forEach(function (r) { const d = el('div', 'sh-h', String(r + 1)), y = r < f.r ? Y[r] : Y[r] - sy; d.style.top = y + 'px'; d.style.height = rowHt(r) + 'px'; d.dataset.r = r; if (r >= s.r1 && r <= s.r2) d.classList.add(wholeRows ? 'all' : 'on'); hr.appendChild(d); const g = el('div', 'sh-grip row'); g.style.top = (y + rowHt(r) - 3) + 'px'; g.dataset.r = r; hr.appendChild(g); });
    colh.appendChild(hc); rowh.appendChild(hr);
    drawSel(); drawCharts(); drawTabs();
  }
  const ordered = function () { return { r1: Math.min(sel.r0, sel.r1), r2: Math.max(sel.r0, sel.r1), c1: Math.min(sel.c0, sel.c1), c2: Math.max(sel.c0, sel.c1) }; };
  function grown(s) {                                                  // the selection, made bigger so that it holds whole merged cells
    let g = { r1: s.r1, r2: s.r2, c1: s.c1, c2: s.c2 }, again = true;
    while (again) { again = false; SH().merges.forEach(function (m) { if (m.r1 <= g.r2 && m.r2 >= g.r1 && m.c1 <= g.c2 && m.c2 >= g.c1 && (m.r1 < g.r1 || m.r2 > g.r2 || m.c1 < g.c1 || m.c2 > g.c2)) { g = { r1: Math.min(g.r1, m.r1), r2: Math.max(g.r2, m.r2), c1: Math.min(g.c1, m.c1), c2: Math.max(g.c2, m.c2) }; again = true; } }); }
    return g;
  }
  function place(div, g, withFrozen) { const bb = box(g.r1, g.c1, g.r2, g.c2), p = toScreen(bb, g.r1, g.c1); div.style.left = p.x + 'px'; div.style.top = p.y + 'px'; div.style.width = Math.max(0, p.w) + 'px'; div.style.height = Math.max(0, p.h) + 'px'; void withFrozen; }
  function drawSel() {
    const g = grown(ordered()), ar = sel.r0, ac = sel.c0, m = mergeAt(ar, ac), a = m ? { r1: m.r1, r2: m.r2, c1: m.c1, c2: m.c2 } : { r1: ar, r2: ar, c1: ac, c2: ac };
    place(selBox, g); selBox.hidden = g.r1 === g.r2 && g.c1 === g.c2 && !m; place(actBox, a); const bb = box(g.r1, g.c1, g.r2, g.c2), p = toScreen(bb, g.r2, g.c2);
    fillH.style.left = (p.x + p.w - 4) + 'px'; fillH.style.top = (p.y + p.h - 4) + 'px'; fillH.hidden = !!editing;
    if (clipInfo) { place(clipBox, clipInfo.g); clipBox.hidden = false; clipBox.className = 'sh-clipbox' + (clipInfo.cut ? ' cut' : ''); } else clipBox.hidden = true;
    nameBox.value = g.r1 === g.r2 && g.c1 === g.c2 ? P.cellName(ar, ac) : P.cellName(g.r1, g.c1) + ':' + P.cellName(g.r2, g.c2);
    if (!editing) fxIn.value = bk().editText(SI(), ar, ac);
    const upd = function () { sumUp(g); }; upd();
  }
  function sumUp(g) {
    let n = 0, total = 0, cnt = 0; const b = bk(), si = SI(); if ((g.r2 - g.r1 + 1) * (g.c2 - g.c1 + 1) > 20000) { sum.textContent = ''; return; }
    for (let r = g.r1; r <= g.r2; r++) for (let c = g.c1; c <= g.c2; c++) { const v = b.get(si, r, c); if (v !== null) cnt++; if (typeof v === 'number') { n++; total += v; } }
    sum.textContent = cnt > 1 && n ? 'Average: ' + Fm.general(total / n) + '   Count: ' + cnt + '   Sum: ' + Fm.general(total) : cnt > 1 ? 'Count: ' + cnt : '';
  }

  /* ---------- sheets (the tabs along the bottom) ---------- */
  let renaming = false;
  function drawTabs() {
    if (renaming) return; sheetTabs.textContent = '';
    bk().sheets.forEach(function (sh, i) {
      const t = el('button', 'sh-sheet' + (i === SI() ? ' on' : ''), sh.name); t.type = 'button'; t.setAttribute('role', 'tab'); t.setAttribute('aria-selected', i === SI() ? 'true' : 'false');
      t.addEventListener('click', function () { switchSheet(i); }); t.addEventListener('dblclick', function () { renameSheet(i, t); }); t.addEventListener('contextmenu', function (e) { e.preventDefault(); switchSheet(i); sheetMenu(t); });
      sheetTabs.appendChild(t);
    });
    const more = tbtn('⋮', 'Sheet options: rename, copy, move or delete this sheet', 'sh-more'); more.addEventListener('click', function () { sheetMenu(more); }); sheetTabs.appendChild(more);
  }
  function switchSheet(i) { commitEdit(); views[SI()] = { sel: Object.assign({}, sel), sx: scroll.scrollLeft, sy: scroll.scrollTop }; bk().active = i; const v = views[i]; sel = v ? Object.assign({}, v.sel) : { r0: 0, c0: 0, r1: 0, c1: 0 }; layout(); scroll.scrollLeft = v ? v.sx : 0; scroll.scrollTop = v ? v.sy : 0; chartEls.clear(); render(); scheduleSave(); focusGrid(); }
  function renameSheet(i, tabEl) {
    renaming = true; const inp = el('input', 'sh-sheetin'); inp.type = 'text'; inp.maxLength = LIM.name; inp.value = bk().sheets[i].name; sheetTabs.replaceChild(inp, tabEl); inp.focus(); inp.select();
    const done = function (ok) { if (!renaming) return; renaming = false; if (ok) { act(function () { const r = bk().renameSheet(i, inp.value); if (!r.ok) say(r.msg, 'bad'); }); } drawTabs(); focusGrid(); };
    inp.addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Enter') done(true); else if (e.key === 'Escape') done(false); }); inp.addEventListener('blur', function () { done(true); });
  }
  function sheetMenu(anchor) {
    popover(anchor, function (p) {
      const items = [['Rename', function () { const t = sheetTabs.querySelector('.sh-sheet.on'); if (t) renameSheet(SI(), t); }], ['Make a copy', function () { act(function () { const r = bk().duplicateSheet(SI()); if (r.ok) bk().active = r.index; else say(r.msg, 'bad'); }); resetView(); }],
        ['Move left', function () { if (SI() > 0) act(function () { bk().moveSheet(SI(), SI() - 1); }); }], ['Move right', function () { if (SI() < bk().sheets.length - 1) act(function () { bk().moveSheet(SI(), SI() + 1); }); }],
        ['Delete', function () { if (bk().sheets.length < 2) { say('A spreadsheet needs at least one sheet.', 'bad'); return; } confirmBox('Delete the sheet “' + SH().name + '”?', 'This cannot be undone with the Undo button once you leave this spreadsheet.', function () { act(function () { bk().deleteSheet(SI()); }); resetView(); }); }]];
      items.forEach(function (it) { const b = tbtn(it[0], it[0]); b.classList.add('wide'); b.addEventListener('click', function () { closePop(); it[1](); }); p.appendChild(b); });
    }, true);
  }
  function resetView() { sel = { r0: 0, c0: 0, r1: 0, c1: 0 }; layout(); chartEls.clear(); scroll.scrollLeft = 0; scroll.scrollTop = 0; render(); }
  addBtn.addEventListener('click', function () { act(function () { const r = bk().addSheet(); if (r.ok) bk().active = r.index; else say(r.msg, 'bad'); }); resetView(); });

  /* ---------- undo and redo (the whole workbook is copied before each change) ---------- */
  function snap() { return { s: bk().snapshot(), sel: Object.assign({}, sel) }; }
  function trimUndo() { let n = 0; undo.forEach(function (u) { n += u.s.length; }); while (undo.length > MAX_UNDO || (n > MAX_UNDO_CHARS && undo.length > 1)) { n -= undo[0].s.length; undo.shift(); } }
  function act(fn) { const before = snap(); fn(); undo.push(before); redo.length = 0; trimUndo(); changed(); }
  function restoreSnap(s) { const b = Book.fromSnapshot(s.s); if (!b) { say('That step could not be restored.', 'bad'); return; } S.book = b; sel = Object.assign({}, s.sel); layout(); chartEls.clear(); render(); scheduleSave(); refresh(); }
  function doUndo() { commitEdit(); if (!undo.length) return; redo.push(snap()); restoreSnap(undo.pop()); }
  function doRedo() { commitEdit(); if (!redo.length) return; undo.push(snap()); restoreSnap(redo.pop()); }
  function changed() { layout(); schedule(); scheduleSave(); refresh(); }

  /* ---------- moving about ---------- */
  function reveal(r, c) {
    const f = frozen(), bb = box(r, c, r, c); let sx = scroll.scrollLeft, sy = scroll.scrollTop;
    if (c >= f.c) { if (bb.x < sx + f.w) sx = bb.x - f.w; else if (bb.x + bb.w > sx + viewW()) sx = bb.x + bb.w - viewW(); }
    if (r >= f.r) { if (bb.y < sy + f.h) sy = bb.y - f.h; else if (bb.y + bb.h > sy + viewH()) sy = bb.y + bb.h - viewH(); }
    scroll.scrollLeft = Math.max(0, sx); scroll.scrollTop = Math.max(0, sy);
  }
  function moveTo(r, c, extend) {
    r = clamp(r, 0, LIM.rows - 1); c = clamp(c, 0, LIM.cols - 1); if (extend) { sel.r1 = r; sel.c1 = c; } else sel = { r0: r, c0: c, r1: r, c1: c }; reveal(r, c); drawSel(); schedule(); refresh();
  }
  function ctrlMove(dr, dc) {
    const b = bk(), si = SI(); let r = sel.r1, c = sel.c1; const empty = function (rr, cc) { return b.isEmptyAt(si, rr, cc); }, inb = function (rr, cc) { return rr >= 0 && cc >= 0 && rr < LIM.rows && cc < LIM.cols; };
    if (inb(r + dr, c + dc) && !empty(r, c) && !empty(r + dr, c + dc)) { while (inb(r + dr, c + dc) && !empty(r + dr, c + dc)) { r += dr; c += dc; } }
    else { do { r += dr; c += dc; } while (inb(r, c) && empty(r, c)); if (!inb(r, c)) { r = clamp(r - dr, 0, LIM.rows - 1); c = clamp(c - dc, 0, LIM.cols - 1); if (dr) r = dr > 0 ? LIM.rows - 1 : 0; if (dc) c = dc > 0 ? LIM.cols - 1 : 0; } }
    return { r: r, c: c };
  }
  function region(r, c) {                                              // the block of filled cells around a cell
    const b = bk(), si = SI(); let r1 = r, r2 = r, c1 = c, c2 = c, grew = true; const any = function (ra, rb, ca, cb) { for (let i = ra; i <= rb; i++) for (let j = ca; j <= cb; j++) if (i >= 0 && j >= 0 && i < LIM.rows && j < LIM.cols && !b.isEmptyAt(si, i, j)) return true; return false; };
    if (b.isEmptyAt(si, r, c) && !any(r - 1, r + 1, c - 1, c + 1)) return { r1: r, r2: r, c1: c, c2: c };
    while (grew) { grew = false; if (any(r1 - 1, r1 - 1, c1 - 1, c2 + 1) && r1 > 0) { r1--; grew = true; } if (any(r2 + 1, r2 + 1, c1 - 1, c2 + 1) && r2 < LIM.rows - 1) { r2++; grew = true; } if (any(r1, r2, c1 - 1, c1 - 1) && c1 > 0) { c1--; grew = true; } if (any(r1, r2, c2 + 1, c2 + 1) && c2 < LIM.cols - 1) { c2++; grew = true; } }
    return { r1: r1, r2: r2, c1: c1, c2: c2 };
  }
  const usedEnd = function () { const u = bk().usedRange(SI()); return { r: Math.max(0, u.r2), c: Math.max(0, u.c2) }; };

  /* ---------- editing a cell ---------- */
  function startEdit(mode, first, fromBar) {
    if (editing) return; const r = sel.r0, c = sel.c0, m = mergeAt(r, c), er = m ? m.r1 : r, ec = m ? m.c1 : c;
    editing = { r: er, c: ec, mode: mode, bar: !!fromBar, orig: bk().editText(SI(), er, ec), last: null }; const text = first != null ? first : editing.orig;
    const st = bk().styleAt(SI(), er, ec); ed.value = text; fxIn.value = text; if (!fromBar) { ed.hidden = false; positionEditor(); ed.style.fontSize = Math.round((st.sz || 11) * 4 / 3 * Z()) + 'px'; ed.style.fontFamily = FONT_CSS[st.ff] || ''; ed.focus(); const n = ed.value.length; ed.setSelectionRange(n, n); } else fxIn.focus();
    root.classList.add('editing'); hintUpdate(); drawSel();
  }
  function positionEditor() {
    if (!editing) return; const m = mergeAt(editing.r, editing.c), bb = m ? box(m.r1, m.c1, m.r2, m.c2) : box(editing.r, editing.c, editing.r, editing.c), p = toScreen(bb, editing.r, editing.c);
    ed.style.left = p.x + 'px'; ed.style.top = p.y + 'px'; ed.style.minWidth = p.w + 'px'; ed.style.height = p.h + 'px'; ed.style.width = Math.max(p.w, Math.min(viewW() - p.x - 8, 120 + ed.value.length * 8)) + 'px';
  }
  const editText = function () { return editing ? (editing.bar ? fxIn.value : ed.value) : ''; };
  function commitEdit(move) {                                          // returns false if the formula has a mistake (the cell stays open)
    if (!editing) return true; const e = editing, text = editText(); hide();
    if (text !== e.orig) {
      const before = snap(), res = bk().setEntry(SI(), e.r, e.c, text);
      if (!res.ok) { editing = e; ed.hidden = e.bar; ed.value = text; say(res.msg, 'bad'); (e.bar ? fxIn : ed).focus(); root.classList.add('editing'); return false; }
      undo.push(before); redo.length = 0; trimUndo(); changed();
    }
    editing = null; if (move) moveTo(sel.r0 + move[0], sel.c0 + move[1]); else drawSel(); focusGrid(); return true;
    function hide() { ed.hidden = true; hint.hidden = true; root.classList.remove('editing'); editing = null; }
  }
  function cancelEdit() { if (!editing) return; ed.hidden = true; hint.hidden = true; root.classList.remove('editing'); editing = null; drawSel(); focusGrid(); }
  const POINTING = /[=+\-*\/^&(,<>:;]\s*$/;
  function pointing() { if (!editing || editText().charAt(0) !== '=') return false; const inp = editing.bar ? fxIn : ed; return !!editing.last || POINTING.test(inp.value.slice(0, inp.selectionStart)); }
  function pointAt(r, c, r2, c2) {                                      // a cell clicked while writing a formula: its address goes into the formula (a second click replaces the first)
    const inp = editing.bar ? fxIn : ed, v = inp.value; let ref = P.cellName(r, c); if (r2 != null && (r2 !== r || c2 !== c)) ref += ':' + P.cellName(r2, c2);
    let at, end; if (editing.last) { at = editing.last.at; end = at + editing.last.len; } else { at = inp.selectionStart; end = inp.selectionEnd; }
    const text = v.slice(0, at) + ref + v.slice(end); inp.value = text; editing.last = { at: at, len: ref.length };
    const pos = at + ref.length; inp.setSelectionRange(pos, pos); fxIn.value = text; if (!editing.bar) ed.value = text; inp.focus(); hintUpdate();
  }

  /* ---------- hints while a formula is typed ---------- */
  function hintUpdate() {
    if (!editing) { hint.hidden = true; return; } const inp = editing.bar ? fxIn : ed, t = inp.value, pos = inp.selectionStart;
    if (t.charAt(0) !== '=') { hint.hidden = true; return; }
    const before = t.slice(0, pos), m = /(^|[=+\-*\/^&(,<>;\s])([A-Za-z][A-Za-z0-9.]*)$/.exec(before);
    hint.textContent = ''; hintItems = []; hintAt = 0;
    if (m && !/^[A-Za-z]{1,3}\d+$/.test(m[2]) && t.charAt(pos) !== '(') { const q = m[2].toUpperCase(); hintItems = DOC.list().filter(function (d) { return d.name.indexOf(q) === 0 && d.name !== q; }).slice(0, 8); }
    if (hintItems.length) {
      hintItems.forEach(function (d, i) { const b = el('button', 'sh-hi' + (i === 0 ? ' on' : '')); b.type = 'button'; b.appendChild(el('b', null, d.name)); b.appendChild(document.createTextNode('  ' + d.text.slice(0, 54))); b.addEventListener('mousedown', function (e) { e.preventDefault(); acceptHint(i); }); hint.appendChild(b); });
      placeHint(); return;
    }
    const sig = signature(before); if (sig) { const d = DOC.doc(sig.name); if (d) { const parts = d.syntax.replace(/^[A-Z0-9.]+\(/, '').replace(/\)$/, '').split(/,\s*/); const line = el('div', 'sh-sig'); line.appendChild(document.createTextNode(d.name + '(')); parts.forEach(function (p, i) { const s = el('span', i === Math.min(sig.arg, parts.length - 1) ? 'cur' : null, p); line.appendChild(s); if (i < parts.length - 1) line.appendChild(document.createTextNode(', ')); }); line.appendChild(document.createTextNode(')')); hint.appendChild(line); hint.appendChild(el('div', 'sh-sigd', d.text)); placeHint(); return; } }
    hint.hidden = true;
  }
  function signature(s) {                                              // the function whose brackets the cursor is inside, and which value of it
    const st = []; let q = false, word = '';
    for (let i = 0; i < s.length; i++) {
      const ch = s.charAt(i); if (ch === '"') { q = !q; continue; } if (q) continue;
      if (ch === '(') { const m = /([A-Za-z][A-Za-z0-9.]*)$/.exec(s.slice(0, i)); st.push({ name: m ? m[1].toUpperCase() : '', arg: 0 }); } else if (ch === ')') st.pop(); else if (ch === ',' && st.length) st[st.length - 1].arg++;
      word = ch;
    }
    void word; for (let k = st.length - 1; k >= 0; k--) if (st[k].name && DOC.doc(st[k].name)) return st[k]; return null;
  }
  function placeHint() { hint.hidden = false; const e = editing.bar ? fxIn.getBoundingClientRect() : ed.getBoundingClientRect(), v = view.getBoundingClientRect(); hint.style.left = Math.max(0, e.left - v.left) + 'px'; hint.style.top = (e.bottom - v.top + 2) + 'px'; }
  function acceptHint(i) { const d = hintItems[i]; if (!d) return; const inp = editing.bar ? fxIn : ed, pos = inp.selectionStart, before = inp.value.slice(0, pos), m = /([A-Za-z][A-Za-z0-9.]*)$/.exec(before); const text = before.slice(0, before.length - m[1].length) + d.name + '(' + inp.value.slice(pos); inp.value = text; const np = pos - m[1].length + d.name.length + 1; inp.setSelectionRange(np, np); fxIn.value = text; if (!editing.bar) ed.value = text; hintUpdate(); inp.focus(); }

  /* ---------- changing cells ---------- */
  const rangeNow = function () { return grown(ordered()); };
  function style(patch) { const g = rangeNow(); act(function () { if (!bk().applyStyle(SI(), g.r1, g.c1, g.r2, g.c2, patch)) say('There are too many different formats in this spreadsheet.', 'bad'); }); }
  function toggle(key) { const g = rangeNow(), on = !!bk().styleAt(SI(), g.r1, g.c1)[key], o = {}; o[key] = on ? 0 : 1; style(o); }
  function clearWhat(what) {
    const g = rangeNow(); act(function () { if (what === 'all') bk().clearAll(SI(), g.r1, g.c1, g.r2, g.c2); else if (what === 'contents') bk().clearContents(SI(), g.r1, g.c1, g.r2, g.c2); else bk().applyStyle(SI(), g.r1, g.c1, g.r2, g.c2, function () { return { b: 0, i: 0, u: 0, s: 0, col: null, bg: null, al: null, va: null, wr: 0, fmt: '', sz: 0, ff: '', bd: '' }; }); });
  }
  function fillDir(dir) { const g = rangeNow(); if (dir === 'down' && g.r2 > g.r1) act(function () { bk().fill(SI(), g.r1, g.c1, g.r1, g.c2, 'down', g.r2); }); else if (dir === 'right' && g.c2 > g.c1) act(function () { bk().fill(SI(), g.r1, g.c1, g.r2, g.c1, 'right', g.c2); }); else say('Select the cell to copy and the cells below it (or to its right), then choose Fill.'); }
  function autoSum(fn) {                                               // the answer goes under the numbers chosen, or under (or beside) the numbers above (or to the left of) the cell
    commitEdit(); const g = rangeNow(), b = bk(), si = SI(), f = fn || 'SUM';
    if (g.r1 !== g.r2 || g.c1 !== g.c2) { act(function () { for (let c = g.c1; c <= g.c2; c++) b.setEntry(si, g.r2 + 1, c, '=' + f + '(' + P.cellName(g.r1, c) + ':' + P.cellName(g.r2, c) + ')'); }); moveTo(g.r2 + 1, g.c1); return; }
    const r = g.r1, c = g.c1; let r1 = r - 1; while (r1 >= 0 && typeof b.get(si, r1, c) === 'number') r1--; r1++;
    if (r1 < r) { act(function () { b.setEntry(si, r, c, '=' + f + '(' + P.cellName(r1, c) + ':' + P.cellName(r - 1, c) + ')'); }); return; }
    let c1 = c - 1; while (c1 >= 0 && typeof b.get(si, r, c1) === 'number') c1--; c1++;
    if (c1 < c) { act(function () { b.setEntry(si, r, c, '=' + f + '(' + P.cellName(r, c1) + ':' + P.cellName(r, c - 1) + ')'); }); return; }
    startEdit('edit', '=' + f + '('); say('Now select the cells to use, then press Enter.');
  }
  function sortNow(asc) {
    let g = rangeNow(); if (g.r1 === g.r2 && g.c1 === g.c2) g = region(g.r1, g.c1); if (g.r2 <= g.r1) { say('Select a few cells in a column of your data first.', 'bad'); return; }
    const b = bk(), si = SI(), col = clamp(sel.c0, g.c1, g.c2), textRow = function (r) { let t = 0, n = 0; for (let c = g.c1; c <= g.c2; c++) { const v = b.get(si, r, c); if (typeof v === 'string') t++; else if (typeof v === 'number') n++; } return { t: t, n: n }; };
    const top = textRow(g.r1), next = textRow(g.r1 + 1), header = top.t > 0 && top.n === 0 && next.n > 0, from = header ? g.r1 + 1 : g.r1; let res = { ok: true };
    act(function () { res = b.sortRange(si, from, g.c1, g.r2, g.c2, col, asc); }); if (!res.ok) { undo.pop(); say(res.msg, 'bad'); } else say('Sorted by column ' + P.colName(col) + (header ? ', keeping the first row as the heading.' : '.'));
  }
  function merge(on) {
    const g = rangeNow(); if (on && g.r1 === g.r2 && g.c1 === g.c2) return; const sh = SH();
    act(function () { sh.merges = sh.merges.filter(function (m) { return !(m.r1 <= g.r2 && m.r2 >= g.r1 && m.c1 <= g.c2 && m.c2 >= g.c1); }); if (on) { for (let r = g.r1; r <= g.r2; r++) for (let c = g.c1; c <= g.c2; c++) if (r !== g.r1 || c !== g.c1) bk().clearContents(SI(), r, c, r, c); sh.merges.push({ r1: g.r1, c1: g.c1, r2: g.r2, c2: g.c2 }); bk().applyStyle(SI(), g.r1, g.c1, g.r1, g.c1, { al: 'c' }); } bk().touch(); });
  }
  function freeze(kind) { act(function () { SH().freeze = kind === 'row' ? { r: 1, c: 0 } : kind === 'col' ? { r: 0, c: 1 } : kind === 'both' ? { r: Math.max(1, sel.r0), c: Math.max(1, sel.c0) } : { r: 0, c: 0 }; }); }
  function structureOp(op) {
    const g = rangeNow(), n = op[0] === 'r' ? g.r2 - g.r1 + 1 : g.c2 - g.c1 + 1; let res = { ok: true };
    act(function () { const b = bk(), si = SI(); res = op === 'rowIns' ? b.insertRows(si, g.r1, n) : op === 'rowDel' ? b.deleteRows(si, g.r1, n) : op === 'colIns' ? b.insertCols(si, g.c1, n) : b.deleteCols(si, g.c1, n); });
    if (!res.ok) { undo.pop(); say(res.msg, 'bad'); }
  }

  /* ---------- copy, cut and paste ---------- */
  function copy(cut) { commitEdit(); const g = rangeNow(); clipInfo = { g: g, cut: !!cut, data: bk().copy(SI(), g.r1, g.c1, g.r2, g.c2), text: bk().clipText(SI(), g.r1, g.c1, g.r2, g.c2), si: SI() }; drawSel(); return clipInfo; }
  function writeClip(e, cut) { const ci = copy(cut); if (e && e.clipboardData) { e.clipboardData.setData('text/plain', ci.text); e.preventDefault(); } else if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ci.text).catch(function () { }); }
  function pasteFrom(text, mode) {
    const g = rangeNow(); let used = false;
    if (clipInfo && (text == null || text === clipInfo.text)) {
      used = true; const ci = clipInfo;
      act(function () {
        if (ci.cut && ci.si === SI() && mode === 'all') { const r = bk().move(SI(), ci.g.r1, ci.g.c1, ci.g.r2, ci.g.c2, g.r1, g.c1); if (r.ok) { sel = { r0: g.r1, c0: g.c1, r1: g.r1 + (ci.g.r2 - ci.g.r1), c1: g.c1 + (ci.g.c2 - ci.g.c1) }; } }
        else { const n = bk().paste(SI(), g.r1, g.c1, ci.data, mode); if (n < 0) say('There are too many different formats in this spreadsheet.', 'bad'); sel = { r0: g.r1, c0: g.c1, r1: Math.min(LIM.rows - 1, g.r1 + ci.data.h - 1), c1: Math.min(LIM.cols - 1, g.c1 + ci.data.w - 1) }; if (ci.cut) bk().clearAll(ci.si, ci.g.r1, ci.g.c1, ci.g.r2, ci.g.c2); }
      });
      if (ci.cut) clipInfo = null;
    }
    if (!used && text) { act(function () { const n = bk().pasteText(SI(), g.r1, g.c1, text.slice(0, 2000000)); say(n + (n === 1 ? ' cell pasted.' : ' cells pasted.')); }); }
    drawSel();
  }
  function pasteButton(mode) { if (clipInfo) { pasteFrom(null, mode); return; } if (navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then(function (t) { if (t) pasteFrom(t, 'all'); else say('Copy some cells first.'); }, function () { say('Copy some cells first, then press Ctrl+V.'); }); else say('Copy some cells first, then press Ctrl+V.'); }

  /* ---------- small windows ---------- */
  function closePop() { if (openPop) { openPop.remove(); openPop = null; } }
  function popover(anchor, build, up) {
    closePop(); const p = el('div', 'sh-pop'); build(p); root.appendChild(p); openPop = p; const a = anchor.getBoundingClientRect(), r = root.getBoundingClientRect();
    p.style.left = Math.max(4, Math.min(a.left - r.left, r.width - p.offsetWidth - 6)) + 'px'; p.style.top = up ? Math.max(4, a.top - r.top - p.offsetHeight - 2) + 'px' : (a.bottom - r.top + 2) + 'px'; return p;
  }
  function swatches(p, colours, pick, none) {
    const g = el('div', 'sh-sw'); colours.forEach(function (c) { const b = el('button', 'sh-swb'); b.type = 'button'; b.style.background = c; b.title = c; b.setAttribute('aria-label', 'colour ' + c); b.addEventListener('click', function () { closePop(); pick(c); }); g.appendChild(b); }); p.appendChild(g);
    if (none) { const n = tbtn(none, none); n.classList.add('wide'); n.addEventListener('click', function () { closePop(); pick(null); }); p.appendChild(n); }
  }
  function dialog(title, body, onOk, okLabel) {
    const ov = el('div', 'sh-ov'), bx = el('div', 'sh-dlg'), row = el('div', 'sh-row'); ov.appendChild(bx); bx.append(el('h3', null, title), body); bx.setAttribute('role', 'dialog'); bx.setAttribute('aria-label', title); bx.setAttribute('aria-modal', 'true');
    const api = { close: function () { ov.remove(); focusGrid(); }, box: bx };
    if (onOk) { const ok = tbtn(okLabel || 'OK', okLabel || 'OK', 'primary'), no = tbtn('Cancel', 'Cancel'); ok.addEventListener('click', function () { if (onOk() !== false) api.close(); }); no.addEventListener('click', api.close); row.append(ok, no); bx.appendChild(row); bx.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); ok.click(); } }); }
    else { const no = tbtn('Close', 'Close'); no.addEventListener('click', api.close); row.appendChild(no); bx.appendChild(row); }
    bx.addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Escape') api.close(); }); ov.addEventListener('mousedown', function (e) { if (e.target === ov) api.close(); }); root.appendChild(ov); const f = bx.querySelector('input,select'); if (f) f.focus(); return api;
  }
  function confirmBox(title, text, yes) { const b = el('div', 'sh-form'); b.appendChild(el('p', null, text)); dialog(title, b, function () { yes(); return true; }, 'Yes'); }
  function field(parent, label, value, type, max) { const l = el('label'), i = el('input'); l.appendChild(document.createTextNode(label)); i.type = type || 'text'; i.value = value == null ? '' : value; i.maxLength = max || 200; l.appendChild(i); parent.appendChild(l); return i; }
  function selectField(parent, label, items, value) { const l = el('label'), s = el('select'); l.appendChild(document.createTextNode(label)); items.forEach(function (it) { const o = el('option', null, it[1]); o.value = it[0]; s.appendChild(o); }); if (value != null) s.value = value; l.appendChild(s); parent.appendChild(l); return s; }

  function functionDialog() {
    const body = el('div', 'sh-form sh-fn'), q = field(body, 'Search for a function', '', 'text', 30), cat = selectField(body, 'Or choose a group', [['', 'All']].concat(DOC.categories().map(function (c) { return [c, c]; })), ''), list = el('div', 'sh-fnlist'), info = el('div', 'sh-fninfo'); body.append(list, info); let chosen = null;
    function draw() { list.textContent = ''; const s = q.value.trim().toUpperCase(); DOC.list().filter(function (d) { return (!cat.value || d.cat === cat.value) && (!s || d.name.indexOf(s) >= 0 || d.text.toUpperCase().indexOf(s) >= 0); }).slice(0, 80).forEach(function (d) { const b = el('button', 'sh-fnitem', d.name); b.type = 'button'; b.addEventListener('click', function () { chosen = d; show(); list.querySelectorAll('.on').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); }); b.addEventListener('dblclick', function () { chosen = d; dlg.box.querySelector('.primary').click(); }); list.appendChild(b); }); }
    function show() { info.textContent = ''; if (!chosen) return; info.appendChild(el('b', null, chosen.syntax)); info.appendChild(el('p', null, chosen.text)); }
    q.addEventListener('input', draw); cat.addEventListener('change', draw);
    const dlg = dialog('ƒx Insert a function', body, function () { if (!chosen) { say('Choose a function from the list.', 'bad'); return false; } const d = chosen; setTimeout(function () { insertFn(d); }, 0); return true; }, 'Use this function'); draw();
  }
  function insertFn(d) {
    if (!editing) { startEdit('edit', '=' + d.name + '(', false); } else { const inp = editing.bar ? fxIn : ed, pos = inp.selectionStart, add = (inp.value.charAt(0) === '=' ? '' : '=') + d.name + '('; inp.value = inp.value.slice(0, pos) + add + inp.value.slice(inp.selectionEnd); fxIn.value = inp.value; if (!editing.bar) ed.value = inp.value; inp.focus(); }
    hintUpdate();
  }
  function formatDialog() {
    const body = el('div', 'sh-form'), g = rangeNow(), cur = bk().styleAt(SI(), g.r1, g.c1).fmt || '', code = field(body, 'Number format code', cur, 'text', 80); const ex = el('div', 'sh-hint'); ex.textContent = 'Examples: 0.00 shows two decimals; #,##0 adds thousands commas; "K"#,##0.00 puts K in front; 0% shows a percentage; dd/mm/yyyy shows a date.'; body.appendChild(ex);
    const live = el('div', 'sh-hint'); body.appendChild(live); const upd = function () { const v = bk().get(SI(), g.r1, g.c1); live.textContent = 'Preview: ' + (typeof v === 'number' ? Fm.format(v, code.value.trim() || 'General') : '(the first cell is not a number)'); }; code.addEventListener('input', upd); upd();
    dialog('Number format', body, function () { style({ fmt: code.value.trim() || 'General' }); return true; });
  }
  function ruleDialog() {
    const body = el('div', 'sh-form'), op = selectField(body, 'Highlight cells where the value', RULES, 'gt'), a = field(body, 'This value', '', 'text', 100), b2 = field(body, 'And this value (for “is between”)', '', 'text', 100), look = selectField(body, 'Show them with', LOOKS.map(function (l, i) { return [String(i), l[0]]; }), '0');
    const g = rangeNow(); body.appendChild(el('div', 'sh-hint', 'Applies to ' + (g.r1 === g.r2 && g.c1 === g.c2 ? P.cellName(g.r1, g.c1) : P.cellName(g.r1, g.c1) + ':' + P.cellName(g.r2, g.c2)) + '.'));
    dialog('Highlight cells by their value', body, function () {
      const num = function (t) { const n = Fm.parseNumber(t); return n === null ? t : n; }, L = LOOKS[+look.value]; if (a.value.trim() === '') { say('Type the value to compare with.', 'bad'); return false; }
      if (SH().cf.length >= BL.cf) { say('That is the most rules a sheet can have.', 'bad'); return false; }
      act(function () { const rule = { r1: g.r1, c1: g.c1, r2: g.r2, c2: g.c2, op: op.value, a: op.value === 'text' ? a.value.trim() : num(a.value.trim()) }; if (op.value === 'between') rule.b = num(b2.value.trim()); if (L[1]) rule.bg = L[1]; if (L[2]) rule.col = L[2]; SH().cf.unshift(rule); bk().touch(); }); return true;
    });
  }
  function clearRules(all) { const g = rangeNow(); act(function () { SH().cf = all ? [] : SH().cf.filter(function (q) { return !(q.r1 <= g.r2 && q.r2 >= g.r1 && q.c1 <= g.c2 && q.c2 >= g.c1); }); bk().touch(); }); }
  function findDialog(withReplace) {
    const body = el('div', 'sh-form'), f = field(body, 'Find', '', 'text', 100), r = field(body, 'Replace with', '', 'text', 100), mcL = el('label', 'sh-check'), mc = el('input'), whL = el('label', 'sh-check'), wh = el('input'), allL = el('label', 'sh-check'), all = el('input'), fmL = el('label', 'sh-check'), fm = el('input');
    [[mcL, mc, ' Match capitals'], [whL, wh, ' Match the whole cell'], [fmL, fm, ' Look inside formulas'], [allL, all, ' Look in every sheet']].forEach(function (x) { x[1].type = 'checkbox'; x[0].append(x[1], document.createTextNode(x[2])); body.appendChild(x[0]); }); const info = el('div', 'sh-hint'); body.appendChild(info); let hits = [], at = -1;
    if (!withReplace) r.parentElement.hidden = true;
    function search() { hits = bk().find(f.value, SI(), { matchCase: mc.checked, whole: wh.checked, formulas: fm.checked, all: all.checked }); at = -1; info.textContent = f.value ? hits.length + (hits.length === 1 ? ' cell found.' : ' cells found.') : ''; }
    function go() { if (!hits.length) search(); if (!hits.length) return; at = (at + 1) % hits.length; const h = hits[at]; if (h.si !== SI()) { switchSheet(h.si); } moveTo(h.r, h.c); info.textContent = (at + 1) + ' of ' + hits.length; }
    const next = tbtn('Find next', 'Find the next match'); next.addEventListener('click', go); [f, mc, wh, fm, all].forEach(function (x) { x.addEventListener('input', search); x.addEventListener('change', search); }); f.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); go(); } });
    const dlg = dialog(withReplace ? 'Find and replace' : 'Find', body, function () {
      if (!withReplace) return true; search(); if (!hits.length) { info.textContent = 'Nothing to replace.'; return false; }
      const q = f.value, rep = r.value, re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), mc.checked ? 'g' : 'gi'); let n = 0;
      act(function () { hits.forEach(function (h) { const cell = bk().getCell(h.si, h.r, h.c); if (!cell) return; const old = fm.checked && cell.f !== undefined ? cell.f : bk().editText(h.si, h.r, h.c), nt = wh.checked ? rep : old.replace(re, function () { return rep; }); if (nt !== old && bk().setEntry(h.si, h.r, h.c, nt).ok) n++; }); }); say(n + ' replaced.'); return true;
    }, 'Replace all'); dlg.box.querySelector('.sh-row').insertBefore(next, dlg.box.querySelector('.sh-row').firstChild);
  }
  function csvDialog() {
    const f = el('input'); f.type = 'file'; f.accept = '.csv,.tsv,.txt,text/csv,text/plain';
    f.addEventListener('change', function () {
      const file = f.files && f.files[0]; if (!file) return; if (file.size > 2000000) { say('That file is too big. The limit is 2 MB.', 'bad'); return; }
      file.text().then(function (t) { const p = DF.parseDelimited(t, /\t/.test(t.split('\n')[0]) && t.split('\n')[0].indexOf(',') < 0 ? '\t' : ',', { rows: LIM.rows, cols: LIM.cols }); if (p.error) { say('That file is too big.', 'bad'); return; }
        const g = rangeNow(); act(function () { p.rows.forEach(function (row, i) { row.forEach(function (v, j) { if (g.r1 + i < LIM.rows && g.c1 + j < LIM.cols) bk().setEntry(SI(), g.r1 + i, g.c1 + j, v.charAt(0) === '=' ? "'" + v : v); }); }); }); say('Added ' + p.rows.length + ' rows' + (p.truncated ? ' (the file was cut short to fit)' : '') + '.'); }, function () { say('That file could not be read.', 'bad'); });
    }); f.click();
  }

  /* ---------- charts ---------- */
  function makeChart(type) {
    let g = rangeNow(); if (g.r1 === g.r2 && g.c1 === g.c2) g = region(g.r1, g.c1); if (g.r2 === g.r1 && g.c2 === g.c1) { say('Select the numbers (and their labels) you want to draw first.', 'bad'); return; }
    if (SH().charts.length >= BL.charts) { say('A sheet can hold up to ' + BL.charts + ' charts.', 'bad'); return; }
    const d = CH.detect(bk(), SI(), g.r1, g.c1, g.r2, g.c2), f = frozen();
    act(function () { SH().charts.push({ type: type, title: '', r1: g.r1, c1: g.c1, r2: g.r2, c2: g.c2, x: scroll.scrollLeft + f.w + 40 + SH().charts.length * 24, y: scroll.scrollTop + f.h + 30 + SH().charts.length * 24, w: 480, h: 300, hdr: d.hdr, lab: d.lab }); });
  }
  function drawCharts() {
    const sh = SH(), keep = new Set(); chartsL.textContent = '';
    sh.charts.forEach(function (ch) {
      keep.add(ch); const data = CH.read(bk(), SI(), ch), sig = JSON.stringify([ch.type, ch.title, ch.w, ch.h, data]); let rec = chartEls.get(ch);
      if (!rec || rec.sig !== sig) { rec = { sig: sig, svg: CH.draw({ type: ch.type, title: ch.title, w: ch.w, h: ch.h - 28 }, data) }; chartEls.set(ch, rec); }
      const panel = el('div', 'sh-chart'), head = el('div', 'sh-chhead'), body = el('div', 'sh-chbody'), grip = el('div', 'sh-chgrip');
      panel.style.left = (ch.x - scroll.scrollLeft) + 'px'; panel.style.top = (ch.y - scroll.scrollTop) + 'px'; panel.style.width = ch.w + 'px'; panel.style.height = ch.h + 'px';
      const ty = el('select', 'sh-chtype'); ty.setAttribute('aria-label', 'Chart type'); CH.TYPES.forEach(function (t) { const o = el('option', null, t[1]); o.value = t[0]; ty.appendChild(o); }); ty.value = ch.type; ty.addEventListener('change', function () { act(function () { ch.type = ty.value; }); });
      const ttl = el('button', 'sh-b', '✎'); ttl.type = 'button'; ttl.title = 'Change the chart title'; ttl.setAttribute('aria-label', 'Change the chart title'); ttl.addEventListener('click', function () { const bx = el('div', 'sh-form'), t = field(bx, 'Chart title', ch.title, 'text', 80); dialog('Chart title', bx, function () { act(function () { ch.title = t.value.trim(); }); return true; }); });
      const png = el('button', 'sh-b', '⬇'); png.type = 'button'; png.title = 'Download the chart as a picture'; png.setAttribute('aria-label', 'Download the chart as a picture'); png.addEventListener('click', function () { CH.toPng(rec.svg, ch.w, ch.h - 28).then(function (b) { DF.download(b, DF.safeName(ch.title || 'chart', 'chart') + '.png', 'image/png'); say('Saved the chart picture in your Downloads folder.'); }, function (e) { say(e.message, 'bad'); }); });
      const del = el('button', 'sh-b', '✖'); del.type = 'button'; del.title = 'Delete the chart'; del.setAttribute('aria-label', 'Delete the chart'); del.addEventListener('click', function () { act(function () { sh.charts.splice(sh.charts.indexOf(ch), 1); chartEls.delete(ch); }); });
      head.append(el('span', 'sh-chname', ch.title || 'Chart'), ty, ttl, png, del); body.appendChild(rec.svg); panel.append(head, body, grip); chartsL.appendChild(panel);
      head.addEventListener('mousedown', function (e) { if (e.target.closest('select,button')) return; e.preventDefault(); dragChart = { ch: ch, mode: 'move', sx: e.clientX, sy: e.clientY, x: ch.x, y: ch.y, w: ch.w, h: ch.h, before: snap() }; });
      grip.addEventListener('mousedown', function (e) { e.preventDefault(); e.stopPropagation(); dragChart = { ch: ch, mode: 'size', sx: e.clientX, sy: e.clientY, x: ch.x, y: ch.y, w: ch.w, h: ch.h, before: snap() }; });
    });
    chartEls.forEach(function (v, k) { if (!keep.has(k)) chartEls.delete(k); });
  }

  /* ---------- the ribbon ---------- */
  function group(label) { const g = el('div', 'sh-grp'); g.appendChild(el('span', 'gl', label)); return g; }
  function btn(g, id, label, title, fn, cls) { const b = tbtn(label, title, cls); b.dataset.id = id; ctl[id] = b; b.addEventListener('click', function (e) { e.stopPropagation(); fn(b); }); g.insertBefore(b, g.querySelector('.gl')); return b; }
  function selectCtl(g, id, title, items, fn, cls) { const s = el('select', 'sh-sel ' + (cls || '')); s.title = title; s.setAttribute('aria-label', title); items.forEach(function (it) { const o = el('option', null, it[1]); o.value = it[0]; s.appendChild(o); }); ctl[id] = s; s.dataset.id = id; s.addEventListener('change', function () { fn(s.value); focusGrid(); }); g.insertBefore(s, g.querySelector('.gl')); return s; }
  function panel(id, name) { const t = el('button', 'sh-tab', name); t.type = 'button'; t.setAttribute('role', 'tab'); t.dataset.tab = id; tabs.appendChild(t); const p = el('div', 'sh-panel'); p.dataset.tab = id; p.setAttribute('role', 'tabpanel'); panels.appendChild(p); t.addEventListener('click', function () { showTab(id); }); return p; }
  function showTab(id) { tabs.querySelectorAll('.sh-tab').forEach(function (t) { const on = t.dataset.tab === id; t.classList.toggle('on', on); t.setAttribute('aria-selected', on ? 'true' : 'false'); }); panels.querySelectorAll('.sh-panel').forEach(function (p) { p.hidden = p.dataset.tab !== id; }); closePop(); }
  function menu(g, id, label, title, items) { return btn(g, id, label, title, function (b) { popover(b, function (p) { items.forEach(function (it) { const x = tbtn(it[0], it[0]); x.classList.add('wide'); x.addEventListener('click', function () { closePop(); it[1](); }); p.appendChild(x); }); }); }); }
  const home = panel('home', 'Home'), ins = panel('insert', 'Insert'), dat = panel('data', 'Data'), vw = panel('view', 'View');
  let g = group('Clipboard'); home.appendChild(g);
  menu(g, 'paste', '📋 Paste ▾', 'Paste', [['Paste everything', function () { pasteButton('all'); }], ['Paste values only', function () { pasteButton('values'); }], ['Paste formulas only', function () { pasteButton('formulas'); }], ['Paste formatting only', function () { pasteButton('formats'); }]]);
  btn(g, 'cut', '✂ Cut', 'Cut (Ctrl+X)', function () { writeClip(null, true); }); btn(g, 'copy', '⧉ Copy', 'Copy (Ctrl+C)', function () { writeClip(null, false); }); btn(g, 'undo', '↶', 'Undo (Ctrl+Z)', doUndo); btn(g, 'redo', '↷', 'Redo (Ctrl+Y)', doRedo);
  g = group('Font'); home.appendChild(g);
  selectCtl(g, 'font', 'Font', SB.FONTS.map(function (f) { return [f, f]; }), function (v) { style({ ff: v }); }, 'sh-font'); selectCtl(g, 'size', 'Font size in points', SIZES.map(function (n) { return [String(n), String(n)]; }), function (v) { style({ sz: +v }); }, 'sh-size');
  g.insertBefore(el('span', 'brk'), g.querySelector('.gl'));
  btn(g, 'b', 'B', 'Bold (Ctrl+B)', function () { toggle('b'); }, 'bold'); btn(g, 'i', 'I', 'Italic (Ctrl+I)', function () { toggle('i'); }, 'italic'); btn(g, 'u', 'U', 'Underline (Ctrl+U)', function () { toggle('u'); }, 'underline'); btn(g, 's', 'S', 'Strikethrough', function () { toggle('s'); }, 'strike');
  menu(g, 'borders', '▦ Borders ▾', 'Borders', [['All borders', function () { border('all'); }], ['Outside borders', function () { border('outside'); }], ['Bottom border', function () { border('bottom'); }], ['Top border', function () { border('top'); }], ['Left border', function () { border('left'); }], ['Right border', function () { border('right'); }], ['No borders', function () { border('none'); }]]);
  btn(g, 'fill', '🪣', 'Fill colour: colour the background of the cells', function (b) { popover(b, function (p) { swatches(p, FILLS.concat(PALETTE.slice(5, 14)), function (c) { style({ bg: c || '' }); }, 'No fill'); }); }); btn(g, 'color', 'A', 'Text colour', function (b) { popover(b, function (p) { swatches(p, PALETTE, function (c) { style({ col: c || '' }); }, 'Automatic (black)'); }); }, 'colorbtn');
  g = group('Alignment'); home.appendChild(g);
  btn(g, 'al', '☰', 'Align left', function () { style({ al: 'l' }); }); btn(g, 'ac', '≡', 'Centre', function () { style({ al: 'c' }); }); btn(g, 'ar', '☷', 'Align right', function () { style({ al: 'r' }); }); btn(g, 'vt', '⤒', 'Align to the top of the cell', function () { style({ va: 't' }); }); btn(g, 'vm', '↕', 'Align to the middle of the cell', function () { style({ va: 'm' }); }); btn(g, 'vb', '⤓', 'Align to the bottom of the cell', function () { style({ va: '' }); });
  btn(g, 'wrap', '↵ Wrap', 'Wrap text: show long text on several lines in the cell', function () { toggle('wr'); }); menu(g, 'merge', '⇔ Merge ▾', 'Merge cells', [['Merge and centre', function () { merge(true); }], ['Unmerge', function () { merge(false); }]]);
  g = group('Number'); home.appendChild(g);
  selectCtl(g, 'fmt', 'Number format', Fm.PRESETS.map(function (p) { return [p[1], p[0]]; }).concat([['__more', 'More formats…']]), function (v) { if (v === '__more') formatDialog(); else style({ fmt: v === 'General' ? '' : v }); }, 'sh-fmt');
  g.insertBefore(el('span', 'brk'), g.querySelector('.gl'));
  btn(g, 'cur', '$', 'Currency format', function () { style({ fmt: '"$"#,##0.00' }); }); btn(g, 'pct', '%', 'Percentage format', function () { style({ fmt: '0%' }); }); btn(g, 'com', ',', 'Thousands separator', function () { style({ fmt: '#,##0.00' }); });
  btn(g, 'dec+', '.0→', 'More decimal places', function () { const g1 = rangeNow(); style(function (st) { return { fmt: Fm.moreDecimals(st.fmt || 'General', bk().get(SI(), g1.r1, g1.c1)) }; }); }); btn(g, 'dec-', '←.0', 'Fewer decimal places', function () { const g1 = rangeNow(); style(function (st) { return { fmt: Fm.fewerDecimals(st.fmt || 'General', bk().get(SI(), g1.r1, g1.c1)) }; }); });
  g = group('Editing'); home.appendChild(g);
  menu(g, 'sum', 'Σ AutoSum ▾', 'AutoSum', [['Sum', function () { autoSum('SUM'); }], ['Average', function () { autoSum('AVERAGE'); }], ['Count numbers', function () { autoSum('COUNT'); }], ['Largest (Max)', function () { autoSum('MAX'); }], ['Smallest (Min)', function () { autoSum('MIN'); }]]);
  menu(g, 'filld', '⬇ Fill ▾', 'Fill', [['Fill down (Ctrl+D)', function () { fillDir('down'); }], ['Fill right (Ctrl+R)', function () { fillDir('right'); }]]);
  menu(g, 'clear', '⌫ Clear ▾', 'Clear', [['Clear everything', function () { clearWhat('all'); }], ['Clear contents only (Delete)', function () { clearWhat('contents'); }], ['Clear formatting only', function () { clearWhat('formats'); }]]);
  btn(g, 'sortA', 'A→Z', 'Sort A to Z (smallest first) by the column of the cell you are in', function () { sortNow(true); }); btn(g, 'sortZ', 'Z→A', 'Sort Z to A (largest first)', function () { sortNow(false); }); btn(g, 'find', '🔍 Find', 'Find and replace (Ctrl+H)', function () { findDialog(true); });
  g = group('Cells'); ins.appendChild(g); btn(g, 'rowIns', '＋ Row', 'Insert rows above the selection', function () { structureOp('rowIns'); }); btn(g, 'colIns', '＋ Column', 'Insert columns to the left of the selection', function () { structureOp('colIns'); }); btn(g, 'rowDel', '✖ Row', 'Delete the selected rows', function () { structureOp('rowDel'); }); btn(g, 'colDel', '✖ Column', 'Delete the selected columns', function () { structureOp('colDel'); });
  g = group('Functions'); ins.appendChild(g); btn(g, 'fn', 'ƒx Function', 'Choose a function from a list, with a description of each', functionDialog);
  g = group('Charts'); ins.appendChild(g); CH.TYPES.forEach(function (t) { btn(g, 'ch-' + t[0], { col: '📊 Columns', bar: '📶 Bars', line: '📈 Line', pie: '🥧 Pie' }[t[0]], 'Draw a ' + t[1].toLowerCase() + ' chart from the selected cells', function () { makeChart(t[0]); }); });
  g = group('Sheets and files'); ins.appendChild(g); btn(g, 'addSheet', '＋ Sheet', 'Add a new sheet', function () { addBtn.click(); }); btn(g, 'csv', '📂 Open CSV', 'Put the contents of a CSV file into the sheet, starting at the selected cell', csvDialog);
  g = group('Sort'); dat.appendChild(g); btn(g, 'sortA2', 'A→Z', 'Sort A to Z by the column of the cell you are in', function () { sortNow(true); }); btn(g, 'sortZ2', 'Z→A', 'Sort Z to A by the column of the cell you are in', function () { sortNow(false); });
  g = group('Highlight'); dat.appendChild(g); btn(g, 'cf', '🎨 Highlight cells', 'Colour cells that meet a rule, such as “greater than 50”', ruleDialog); menu(g, 'cfClear', 'Clear rules ▾', 'Clear highlight rules', [['In the selected cells', function () { clearRules(false); }], ['In the whole sheet', function () { clearRules(true); }]]);
  g = group('Freeze'); dat.appendChild(g); menu(g, 'frz', '❄ Freeze ▾', 'Keep rows or columns in view while scrolling', [['Freeze the top row', function () { freeze('row'); }], ['Freeze the first column', function () { freeze('col'); }], ['Freeze above and left of the selected cell', function () { freeze('both'); }], ['Unfreeze', function () { freeze('none'); }]]);
  g = group('Show'); vw.appendChild(g); btn(g, 'grid', '▦ Gridlines', 'Show or hide the grid lines', function () { S.grid = !S.grid; scheduleSave(); schedule(); refresh(); });
  g = group('Zoom'); vw.appendChild(g); btn(g, 'z-', '−', 'Zoom out', function () { zoomBy(-10); }); btn(g, 'z+', '+', 'Zoom in', function () { zoomBy(10); }); btn(g, 'z100', '100%', 'Normal size', function () { zoomTo(100); });
  showTab('home');
  function border(mode) { const g1 = rangeNow(); act(function () { bk().applyBorder(SI(), g1.r1, g1.c1, g1.r2, g1.c2, mode); }); }
  function zoomTo(z) { S.zoom = clamp(z, 50, 200); zLab.textContent = S.zoom + '%'; const fr = scroll.scrollLeft / Math.max(1, X[LIM.cols]); layout(); void fr; render(); scheduleSave(); }
  function zoomBy(d) { zoomTo(S.zoom + d); }
  function refresh() {
    const g1 = rangeNow(), st = bk().styleAt(SI(), g1.r1, g1.c1);
    ['b', 'i', 'u', 's'].forEach(function (k) { ctl[k].classList.toggle('on', !!st[k]); ctl[k].setAttribute('aria-pressed', st[k] ? 'true' : 'false'); }); ctl.wrap.classList.toggle('on', !!st.wr);
    ['al', 'ac', 'ar'].forEach(function (k, i) { ctl[k].classList.toggle('on', st.al === 'lcr'.charAt(i)); }); ctl.grid.classList.toggle('on', S.grid);
    ctl.font.value = st.ff || 'Calibri'; ctl.size.value = String(st.sz || 11); const f = st.fmt || 'General'; ctl.fmt.value = Fm.PRESETS.some(function (p) { return p[1] === f; }) ? f : 'General';
    ctl.undo.disabled = !undo.length; ctl.redo.disabled = !redo.length; zLab.textContent = S.zoom + '%';
  }

  /* ---------- saving, downloads, printing ---------- */
  function writeSave() {
    saveTimer = 0; let data; try { data = { n: S.name, b: bk().toJSON(), z: S.zoom, g: S.grid }; } catch (e) { return; }
    const size = JSON.stringify(data).length; if (size > MAXSAVE) { stateEl.textContent = '⚠ Too big to keep automatically. Please download a copy.'; stateEl.className = 'sh-state bad'; return; }
    const ok = CC.keep.save(KEY, data); stateEl.textContent = ok ? '✔ Kept on this computer for ' + CC.keep.hours + ' hours' : '⚠ Could not keep a copy. Please download one.'; stateEl.className = 'sh-state' + (ok ? '' : ' bad');
  }
  function scheduleSave() { stateEl.textContent = 'Saving…'; stateEl.className = 'sh-state'; clearTimeout(saveTimer); saveTimer = setTimeout(writeSave, 700); }
  function flush() { commitEdit(); if (saveTimer) { clearTimeout(saveTimer); writeSave(); } }
  function load() {
    const d = CC.keep.load(KEY); let ok = false;
    if (d && typeof d === 'object' && d.b) { const b = Book.fromJSON(d.b); if (b) { S.book = b; S.name = DF.safeName(typeof d.n === 'string' ? d.n : '', 'My spreadsheet'); S.zoom = typeof d.z === 'number' ? clamp(Math.round(d.z), 50, 200) : 100; S.grid = d.g !== false; ok = true; } }
    nameIn.value = S.name; return ok;
  }
  function newBook() { dialog('📄 Start a new spreadsheet?', (function () { const b = el('div', 'sh-form'); b.appendChild(el('p', null, 'This clears every sheet and removes the copy kept on this computer. Download your work first if you want to keep it.')); return b; })(), function () { S.book = new Book(); S.name = 'My spreadsheet'; nameIn.value = S.name; undo.length = 0; redo.length = 0; clipInfo = null; Object.keys(views).forEach(function (k) { delete views[k]; }); CC.keep.drop(KEY); resetView(); changed(); say('A new, empty spreadsheet.'); return true; }); }
  function download(kind) {
    commitEdit(); S.name = DF.safeName(nameIn.value, 'My spreadsheet'); nameIn.value = S.name;
    try { if (kind === 'xlsx') { CC.xlsx.saveXlsx(bk(), S.name); say('Saved ' + S.name + '.xlsx in your Downloads folder.'); } else if (kind === 'csv') { CC.xlsx.saveCsv(bk(), SI(), S.name); say('Saved ' + S.name + '.csv in your Downloads folder (this sheet only).'); } else printSheet(); } catch (e) { say('The file could not be made.', 'bad'); }
  }
  let printPage = null;
  function cleanPrint() { document.body.classList.remove('sh-printing'); const st = document.getElementById('sh-page-css'); if (st) st.remove(); if (printPage) { printPage.remove(); printPage = null; } }
  function preparePrint() {
    cleanPrint(); const b = bk(), si = SI(), u = b.usedRange(si); printPage = el('div', 'sh-printpage'); const t = el('table'), thead = el('thead'), hr = el('tr'); hr.appendChild(el('th')); for (let c = 0; c <= Math.max(0, u.c2); c++) hr.appendChild(el('th', null, P.colName(c))); thead.appendChild(hr); t.appendChild(thead);
    const tb = el('tbody'); for (let r = 0; r <= Math.min(u.r2, 999); r++) { const tr = el('tr'); tr.appendChild(el('th', null, String(r + 1))); for (let c = 0; c <= u.c2; c++) { const td = el('td', null, b.display(si, r, c)), v = b.get(si, r, c), st = b.styleAt(si, r, c); if (st.b) td.style.fontWeight = 'bold'; if (st.i) td.style.fontStyle = 'italic'; if (st.u) td.style.textDecoration = 'underline'; if (st.col) td.style.color = st.col; if (st.bg) td.style.background = st.bg; td.style.textAlign = { l: 'left', c: 'center', r: 'right' }[st.al || (typeof v === 'number' ? 'r' : 'l')]; if (st.bd) td.style.border = '1px solid #000'; tr.appendChild(td); } tb.appendChild(tr); }
    t.appendChild(tb); printPage.appendChild(t); document.body.appendChild(printPage); document.body.classList.add('sh-printing');
    const css = document.createElement('style'); css.id = 'sh-page-css'; css.textContent = '@media print{@page{size:' + (u.c2 > 7 ? 'A4 landscape' : 'A4') + ';margin:1.5cm}}'; document.head.appendChild(css);
  }
  function printSheet() { preparePrint(); say('In the print window, choose “Save as PDF” to make a PDF file.'); try { if (!DF.noDownload) window.print(); } catch (e) { } setTimeout(cleanPrint, DF.noDownload ? 200 : 60000); }

  /* ---------- the mouse ---------- */
  scroll.addEventListener('scroll', function () { if (editing) positionEditor(); schedule(); });
  scroll.addEventListener('mousedown', function (e) {
    if (e.button !== 0) return; closePop(); const h = hitCell(e.clientX, e.clientY);
    if (pointing()) { e.preventDefault(); pointAt(h.r, h.c); dragSel = { pt: true, r: h.r, c: h.c }; return; }
    if (editing && !commitEdit()) { e.preventDefault(); return; }
    focusGrid(); const m = mergeAt(h.r, h.c), r = m ? m.r1 : h.r, c = m ? m.c1 : h.c;
    if (e.shiftKey) { sel.r1 = h.r; sel.c1 = h.c; } else sel = { r0: r, c0: c, r1: r, c1: c }; dragSel = { r: h.r, c: h.c }; drawSel(); schedule(); refresh(); e.preventDefault();
  });
  scroll.addEventListener('dblclick', function (e) { const h = hitCell(e.clientX, e.clientY); if (!editing) { sel = { r0: h.r, c0: h.c, r1: h.r, c1: h.c }; startEdit('edit'); } });
  scroll.addEventListener('contextmenu', function (e) {
    e.preventDefault(); const h = hitCell(e.clientX, e.clientY), g1 = rangeNow(); if (!(h.r >= g1.r1 && h.r <= g1.r2 && h.c >= g1.c1 && h.c <= g1.c2)) { sel = { r0: h.r, c0: h.c, r1: h.r, c1: h.c }; drawSel(); }
    const a = el('span'); a.style.cssText = 'position:fixed;left:' + e.clientX + 'px;top:' + e.clientY + 'px;width:1px;height:1px'; root.appendChild(a);
    popover(a, function (p) { [['Cut', function () { writeClip(null, true); }], ['Copy', function () { writeClip(null, false); }], ['Paste', function () { pasteButton('all'); }], ['Insert row', function () { structureOp('rowIns'); }], ['Insert column', function () { structureOp('colIns'); }], ['Delete row', function () { structureOp('rowDel'); }], ['Delete column', function () { structureOp('colDel'); }], ['Clear contents', function () { clearWhat('contents'); }]].forEach(function (it) { const x = tbtn(it[0], it[0]); x.classList.add('wide'); x.addEventListener('click', function () { closePop(); it[1](); }); p.appendChild(x); }); }); a.remove();
  });
  document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
  function onMove(e) {
    if (dragSel) { const rc = scroll.getBoundingClientRect(); if (e.clientY > rc.bottom - 12) scroll.scrollTop += 24; else if (e.clientY < rc.top + 12) scroll.scrollTop -= 24; if (e.clientX > rc.right - 12) scroll.scrollLeft += 24; else if (e.clientX < rc.left + 12) scroll.scrollLeft -= 24; const h = hitCell(e.clientX, e.clientY); if (dragSel.pt) { if (editing) pointAt(dragSel.r, dragSel.c, h.r, h.c); } else { sel.r1 = h.r; sel.c1 = h.c; drawSel(); schedule(); } }
    if (dragCol) { const d = e.clientX - dragCol.x0, w = clamp(Math.round((dragCol.w0 + d) / Z()), BL.colW[0], BL.colW[1]); if (dragCol.col != null) SH().cw[dragCol.col] = w; else SH().rh[dragCol.row] = clamp(Math.round((dragCol.w0 + (e.clientY - dragCol.y0)) / Z()), BL.rowH[0], BL.rowH[1]); layout(); schedule(); }
    if (dragFill) { const h = hitCell(e.clientX, e.clientY), g1 = dragFill.g, dr = h.r > g1.r2 ? h.r - g1.r2 : h.r < g1.r1 ? h.r - g1.r1 : 0, dc = h.c > g1.c2 ? h.c - g1.c2 : h.c < g1.c1 ? h.c - g1.c1 : 0; dragFill.h = h; dragFill.dir = Math.abs(dr) >= Math.abs(dc) ? (dr > 0 ? 'down' : dr < 0 ? 'up' : null) : (dc > 0 ? 'right' : 'left');
      const t = dragFill.dir; if (t) { const to = t === 'down' ? { r1: g1.r1, r2: h.r, c1: g1.c1, c2: g1.c2 } : t === 'up' ? { r1: h.r, r2: g1.r2, c1: g1.c1, c2: g1.c2 } : t === 'right' ? { r1: g1.r1, r2: g1.r2, c1: g1.c1, c2: h.c } : { r1: g1.r1, r2: g1.r2, c1: h.c, c2: g1.c2 }; place(fillPrev, to); fillPrev.hidden = false; } else fillPrev.hidden = true; }
    if (dragChart) { const ch = dragChart.ch, dx = e.clientX - dragChart.sx, dy = e.clientY - dragChart.sy; if (dragChart.mode === 'move') { ch.x = Math.max(0, dragChart.x + dx); ch.y = Math.max(0, dragChart.y + dy); } else { ch.w = clamp(dragChart.w + dx, 200, 1200); ch.h = clamp(dragChart.h + dy, 140, 900); } schedule(); }
  }
  function onUp() {
    if (dragSel) { const pointed = dragSel.pt; dragSel = null; if (pointed && editing) (editing.bar ? fxIn : ed).focus(); else focusGrid(); }       // after pointing at a cell the typing carries on in the formula
    if (dragCol) { const d = dragCol; dragCol = null; undo.push(d.before); redo.length = 0; trimUndo(); changed(); }
    if (dragFill) { const d = dragFill; dragFill = null; fillPrev.hidden = true; if (d.dir && d.h) { const g1 = d.g, to = d.dir === 'down' || d.dir === 'up' ? d.h.r : d.h.c; act(function () { const r = d.dir === 'down' ? bk().fill(SI(), g1.r1, g1.c1, g1.r2, g1.c2, 'down', to) : d.dir === 'up' ? bk().fill(SI(), g1.r1, g1.c1, g1.r2, g1.c2, 'up', to) : d.dir === 'right' ? bk().fill(SI(), g1.r1, g1.c1, g1.r2, g1.c2, 'right', to) : bk().fill(SI(), g1.r1, g1.c1, g1.r2, g1.c2, 'left', to); if (r.ok) sel = { r0: Math.min(g1.r1, d.h.r), c0: Math.min(g1.c1, d.h.c), r1: Math.max(g1.r2, d.dir === 'down' ? d.h.r : g1.r2), c1: Math.max(g1.c2, d.dir === 'right' ? d.h.c : g1.c2) }; }); } }
    if (dragChart) { const d = dragChart; dragChart = null; undo.push(d.before); redo.length = 0; trimUndo(); changed(); }
  }
  fillH.addEventListener('mousedown', function (e) { e.preventDefault(); e.stopPropagation(); commitEdit(); dragFill = { g: rangeNow(), dir: null, h: null }; });
  function headDown(e, isCol) {
    if (e.button !== 0) return; const t = e.target, idx = +(t.dataset.c != null ? t.dataset.c : t.dataset.r); if (isNaN(idx)) return; commitEdit();
    if (t.classList.contains('sh-grip')) { e.preventDefault(); const before = snap(); dragCol = isCol ? { col: idx, x0: e.clientX, w0: colW(idx), before: before } : { row: idx, y0: e.clientY, w0: rowHt(idx), before: before }; return; }
    e.preventDefault(); focusGrid(); if (isCol) sel = e.shiftKey ? { r0: 0, c0: sel.c0, r1: LIM.rows - 1, c1: idx } : { r0: 0, c0: idx, r1: LIM.rows - 1, c1: idx }; else sel = e.shiftKey ? { r0: sel.r0, c0: 0, r1: idx, c1: LIM.cols - 1 } : { r0: idx, c0: 0, r1: idx, c1: LIM.cols - 1 }; drawSel(); schedule(); refresh();
  }
  colh.addEventListener('mousedown', function (e) { headDown(e, true); }); rowh.addEventListener('mousedown', function (e) { headDown(e, false); });
  colh.addEventListener('dblclick', function (e) { if (e.target.classList.contains('sh-grip')) { const c = +e.target.dataset.c; autoFit(c); } });
  corner.addEventListener('mousedown', function (e) { e.preventDefault(); commitEdit(); sel = { r0: 0, c0: 0, r1: LIM.rows - 1, c1: LIM.cols - 1 }; drawSel(); schedule(); focusGrid(); });
  function autoFit(c) { const b = bk(), si = SI(); let w = 40; const cv = document.createElement('canvas').getContext('2d'); for (let r = 0; r < LIM.rows; r++) { if (b.isEmptyAt(si, r, c)) continue; const st = b.styleAt(si, r, c); cv.font = (st.b ? 'bold ' : '') + (st.i ? 'italic ' : '') + Math.round((st.sz || 11) * 4 / 3) + 'px ' + (FONT_CSS[st.ff] || FONT_CSS.Calibri); w = Math.max(w, cv.measureText(b.display(si, r, c)).width + 14); if (r > 400) break; } act(function () { SH().cw[c] = clamp(Math.round(w), BL.colW[0], BL.colW[1]); }); }

  /* ---------- the keyboard ---------- */
  sink.addEventListener('keydown', function (e) {
    const k = e.key, mod = e.ctrlKey || e.metaKey, shift = e.shiftKey; if (editing) return;
    const go = function (r, c) { e.preventDefault(); moveTo(r, c, shift); };
    if (mod && !e.altKey) {
      const lk = k.toLowerCase();
      if (lk === 'z') { e.preventDefault(); if (shift) doRedo(); else doUndo(); return; } if (lk === 'y') { e.preventDefault(); doRedo(); return; }
      if (lk === 'c' || lk === 'x' || lk === 'v') return;                                           // the copy, cut and paste events do these
      if (lk === 'a') { e.preventDefault(); const rg = region(sel.r0, sel.c0); sel = (ordered().r1 === rg.r1 && ordered().r2 === rg.r2 && ordered().c1 === rg.c1 && ordered().c2 === rg.c2) || (ordered().r1 === 0 && ordered().r2 === LIM.rows - 1) ? { r0: 0, c0: 0, r1: LIM.rows - 1, c1: LIM.cols - 1 } : { r0: rg.r1, c0: rg.c1, r1: rg.r2, c1: rg.c2 }; drawSel(); schedule(); return; }
      if (lk === 'b') { e.preventDefault(); toggle('b'); return; } if (lk === 'i') { e.preventDefault(); toggle('i'); return; } if (lk === 'u') { e.preventDefault(); toggle('u'); return; }
      if (lk === 'd') { e.preventDefault(); fillDir('down'); return; } if (lk === 'r') { e.preventDefault(); fillDir('right'); return; }
      if (lk === 'f' || lk === 'h') { e.preventDefault(); findDialog(lk === 'h'); return; } if (lk === 's') { e.preventDefault(); btnDl.click(); return; }
      if (k === ';') { e.preventDefault(); act(function () { const d = new Date(); bk().setEntry(SI(), sel.r0, sel.c0, d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear()); }); return; }
      if (k === 'Home') return go(0, 0); if (k === 'End') { const u = usedEnd(); return go(u.r, u.c); }
      if (k === 'ArrowUp' || k === 'ArrowDown' || k === 'ArrowLeft' || k === 'ArrowRight') { const d = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[k], t = ctrlMove(d[0], d[1]); return go(t.r, t.c); }
      return;
    }
    switch (k) {
      case 'ArrowUp': return go(sel.r1 - 1, sel.c1); case 'ArrowDown': return go(sel.r1 + 1, sel.c1); case 'ArrowLeft': return go(sel.r1, sel.c1 - 1); case 'ArrowRight': return go(sel.r1, sel.c1 + 1);
      case 'PageDown': return go(sel.r1 + Math.max(1, Math.floor(viewH() / (BL.rh * Z()))), sel.c1); case 'PageUp': return go(sel.r1 - Math.max(1, Math.floor(viewH() / (BL.rh * Z()))), sel.c1);
      case 'Home': return go(sel.r1, 0); case 'End': { const u = usedEnd(); return go(sel.r1, u.c); }
      case 'Enter': e.preventDefault(); return moveTo(sel.r0 + (shift ? -1 : 1), sel.c0);
      case 'Tab': e.preventDefault(); return moveTo(sel.r0, sel.c0 + (shift ? -1 : 1));
      case 'F2': e.preventDefault(); return startEdit('edit');
      case 'Delete': case 'Backspace': e.preventDefault(); return clearWhat('contents');
      case 'Escape': if (clipInfo) { clipInfo = null; drawSel(); } return;
      case ' ': if (mod || shift) { e.preventDefault(); const g1 = ordered(); sel = shift && !mod ? { r0: g1.r1, c0: 0, r1: g1.r2, c1: LIM.cols - 1 } : { r0: 0, c0: g1.c1, r1: LIM.rows - 1, c1: g1.c2 }; drawSel(); schedule(); return; } break;
    }
    if (k.length === 1 && !e.altKey && !mod) { e.preventDefault(); startEdit('enter', k); }
  });
  sink.addEventListener('paste', function (e) { e.preventDefault(); const t = e.clipboardData && e.clipboardData.getData('text/plain'); if (t != null) pasteFrom(t, 'all'); });
  sink.addEventListener('copy', function (e) { writeClip(e, false); }); sink.addEventListener('cut', function (e) { writeClip(e, true); });
  sink.addEventListener('input', function () { const t = sink.value; sink.value = ''; if (t && !editing) startEdit('enter', t); });                  // a key the browser typed itself (an accent, for example) starts an entry
  ed.addEventListener('keydown', function (e) {
    e.stopPropagation(); const k = e.key;
    if (hintItems.length && !hint.hidden) { if (k === 'ArrowDown' || k === 'ArrowUp') { e.preventDefault(); hintAt = (hintAt + (k === 'ArrowDown' ? 1 : -1) + hintItems.length) % hintItems.length; hint.querySelectorAll('.sh-hi').forEach(function (b, i) { b.classList.toggle('on', i === hintAt); }); return; } if (k === 'Tab') { e.preventDefault(); acceptHint(hintAt); return; } }
    if (k === 'Enter' && !e.altKey) { e.preventDefault(); commitEdit([e.shiftKey ? -1 : 1, 0]); return; } if (k === 'Enter' && e.altKey) { e.preventDefault(); const p = ed.selectionStart; ed.value = ed.value.slice(0, p) + '\n' + ed.value.slice(ed.selectionEnd); ed.setSelectionRange(p + 1, p + 1); return; }
    if (k === 'Tab') { e.preventDefault(); commitEdit([0, e.shiftKey ? -1 : 1]); return; } if (k === 'Escape') { e.preventDefault(); cancelEdit(); return; }
    if (editing && editing.mode === 'enter' && (k === 'ArrowUp' || k === 'ArrowDown' || k === 'ArrowLeft' || k === 'ArrowRight') && ed.value.charAt(0) !== '=') { e.preventDefault(); const d = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[k]; commitEdit(d); return; }
    if (k === 'F2') { e.preventDefault(); if (editing) editing.mode = 'edit'; return; }
  });
  ed.addEventListener('input', function () { if (editing) { fxIn.value = ed.value; positionEditor(); hintUpdate(); editing.last = null; } });
  ed.addEventListener('click', hintUpdate); ed.addEventListener('keyup', function (e) { if (!/^(Arrow|Home|End)/.test(e.key)) return; hintUpdate(); });
  ed.addEventListener('blur', function () { setTimeout(function () { if (editing && !editing.bar && document.activeElement !== ed && document.activeElement !== fxIn && !openPop && !root.querySelector('.sh-ov')) commitEdit(); }, 0); });
  fxIn.addEventListener('focus', function () { if (!editing) startEdit('edit', null, true); else if (!editing.bar) { editing.bar = true; ed.hidden = true; fxIn.value = ed.value; } });
  fxIn.addEventListener('keydown', function (e) { e.stopPropagation(); if (!editing) return; if (e.key === 'Enter') { e.preventDefault(); commitEdit([1, 0]); } else if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); } else if (e.key === 'Tab' && hintItems.length && !hint.hidden) { e.preventDefault(); acceptHint(hintAt); } });
  fxIn.addEventListener('input', function () { if (editing) { if (!editing.bar) { editing.bar = true; ed.hidden = true; } hintUpdate(); editing.last = null; } else { startEdit('edit', fxIn.value, true); } });
  fxIn.addEventListener('blur', function () { setTimeout(function () { if (editing && editing.bar && document.activeElement !== fxIn && !openPop && !root.querySelector('.sh-ov')) commitEdit(); }, 0); });
  fxOk.addEventListener('click', function () { if (editing) commitEdit([1, 0]); }); fxNo.addEventListener('click', function () { cancelEdit(); }); fxBtn.addEventListener('click', functionDialog);
  nameBox.addEventListener('keydown', function (e) {
    e.stopPropagation(); if (e.key !== 'Enter') return; e.preventDefault(); const t = nameBox.value.trim().toUpperCase(), parts = t.split(':'), a = P.parseCellName(parts[0]), b2 = parts[1] ? P.parseCellName(parts[1]) : a;
    if (!a || !b2 || a.r >= LIM.rows || a.c >= LIM.cols || b2.r >= LIM.rows || b2.c >= LIM.cols) { say('That is not a cell on this sheet. Try something like B7 or A1:C5.', 'bad'); return; } sel = { r0: a.r, c0: a.c, r1: b2.r, c1: b2.c }; reveal(a.r, a.c); drawSel(); schedule(); focusGrid();
  });
  root.addEventListener('mousedown', function (e) { if (e.target.closest('.sh-b') && !e.target.closest('.sh-dlg') && !e.target.closest('.sh-chhead')) e.preventDefault(); if (openPop && !e.target.closest('.sh-pop') && !e.target.closest('.sh-b')) closePop(); });
  root.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePop(); e.stopPropagation(); });
  nameIn.addEventListener('input', function () { S.name = nameIn.value; scheduleSave(); }); nameIn.addEventListener('blur', function () { nameIn.value = DF.safeName(nameIn.value, 'My spreadsheet'); S.name = nameIn.value; });
  btnNew.addEventListener('click', newBook); btnPrint.addEventListener('click', printSheet);
  btnDl.addEventListener('click', function () { popover(btnDl, function (p) { [['xlsx', '📗 Excel workbook (.xlsx)'], ['csv', '📄 This sheet as CSV (.csv)'], ['pdf', '📕 PDF (use the print window)']].forEach(function (x) { const b = tbtn(x[1], x[1]); b.classList.add('wide'); b.addEventListener('click', function () { closePop(); download(x[0]); }); p.appendChild(b); }); }); });
  zOut.addEventListener('click', function () { zoomBy(-10); }); zIn.addEventListener('click', function () { zoomBy(10); });
  window.addEventListener('beforeprint', function () { if (!printPage && root.offsetParent !== null) preparePrint(); }); window.addEventListener('afterprint', cleanPrint);
  window.addEventListener('pagehide', flush); document.addEventListener('visibilitychange', function () { if (document.hidden) flush(); });
  if (window.ResizeObserver) new ResizeObserver(function () { if (!host.hidden) { if (editing) positionEditor(); schedule(); } }).observe(scroll);

  const restored = load(); layout(); render(); refresh();
  if (restored) say('Your spreadsheet from earlier is back. It is kept for ' + CC.keep.hours + ' hours after your last change.');
  return {
    show: function () { layout(); render(); setTimeout(function () { focusGrid(); }, 0); },
    leave: function () { flush(); closePop(); },
    api: { S: S, book: bk, sel: function () { return Object.assign({}, sel); }, setSel: function (r0, c0, r1, c1) { sel = { r0: r0, c0: c0, r1: r1 == null ? r0 : r1, c1: c1 == null ? c0 : c1 }; drawSel(); schedule(); }, type: function (text) { commitEdit(); startEdit('enter', text); return commitEdit(); },
      enter: function (r, c, text) { sel = { r0: r, c0: c, r1: r, c1: c }; startEdit('enter', text); return commitEdit(); }, undo: doUndo, redo: doRedo, copy: copy, pasteFrom: pasteFrom, style: style, sort: sortNow, makeChart: makeChart, download: download, flush: flush, render: render, merge: merge, autoSum: autoSum, structure: structureOp, fillDir: fillDir, region: region, zoom: zoomTo, state: function () { return { undo: undo.length, redo: redo.length, editing: !!editing }; } }
  };
}
CC.tools = CC.tools || {}; CC.tools.sheetMount = mount;
})();
