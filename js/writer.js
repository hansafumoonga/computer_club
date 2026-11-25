/* writer.js - the stand-alone Word Processor: a page you type on, with formatting, pictures, tables, find and replace, and downloads
   (Word, web page, text, PDF through the print window). Work is kept on this computer for 3 hours after the last change (CC.keep).
   Safety: everything that comes in (paste, drop, pictures, the saved copy) goes through docsafe.js, and nothing a person types is ever
   put into the page as markup; names and messages are set as plain text. */
(function () {
'use strict';
const CC = window.CC, DF = CC.docfile, DS = CC.docsafe, KEY = 'writer', MAXSAVE = 1800000;
const FONT_LIST = ['Calibri', 'Arial', 'Georgia', 'Times New Roman', 'Verdana', 'Trebuchet MS', 'Comic Sans MS', 'Courier New', 'Tahoma', 'Cambria', 'Garamond', 'Consolas'];
const SIZE_LIST = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];
const PALETTE = ['#000000', '#434343', '#7f7f7f', '#bfbfbf', '#ffffff', '#c00000', '#ff0000', '#ff9900', '#ffc000', '#ffff00', '#92d050', '#00b050', '#00b0f0', '#0070c0', '#002060', '#7030a0', '#ff66cc', '#996633', '#66ccff', '#cc99ff'];
const SHADES = ['#e0e7ff', '#dcfce7', '#fef9c3', '#fee2e2', '#fce7f3', '#f3f4f6', '#bfdbfe', '#fed7aa', '#ffffff'];
const SYMBOLS = '© ® ™ € £ ¥ ¢ ° ± × ÷ ½ ¼ ¾ ≤ ≥ ≠ ≈ ∞ π √ ² ³ α β γ δ θ λ μ Σ Ω ← ↑ → ↓ ↔ ✓ ✗ ★ ☆ ♥ ☺ • … – — « » ¿ ¡ § ¶ † ‰ ℃ ℉ № ♪'.split(' ');
const SPACING = [1, 1.15, 1.5, 2, 2.5, 3];
const PAPER = { a4: { w: 794, h: 1123, name: 'A4' }, letter: { w: 816, h: 1056, name: 'Letter' } };
const STYLES = [['p', 'Normal'], ['title', 'Title'], ['subtitle', 'Subtitle'], ['h1', 'Heading 1'], ['h2', 'Heading 2'], ['h3', 'Heading 3'], ['quote', 'Quotation']];
const el = function (tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const MAX_UNDO = 80, MAX_UNDO_CHARS = 40000000;

function mount(host) {
  const S = { name: 'My document', paper: 'a4', pageNums: false, zoom: 100 };
  const undo = [], redo = []; let burst = false, burstTimer = 0, saveTimer = 0, saved = null, selImg = null, statusRaf = 0, internalDrag = false, openPop = null, tab = 'home';
  host.textContent = '';
  const root = el('div', 'wp'); host.appendChild(root);

  /* ---------- the parts of the screen ---------- */
  const bar = el('div', 'wp-bar'), nameIn = el('input', 'wp-name'), msg = el('span', 'wp-msg'), stateEl = el('span', 'wp-state');
  nameIn.type = 'text'; nameIn.maxLength = 60; nameIn.value = S.name; nameIn.setAttribute('aria-label', 'Document name'); nameIn.spellcheck = false;
  const btnNew = tbtn('📄 New', 'Start a new, empty document'), btnDl = tbtn('⬇ Download ▾', 'Download a copy of your document'), btnPrint = tbtn('🖨 Print', 'Print the document (Ctrl+P)');
  bar.appendChild(el('span', 'wp-logo', '📝')); bar.appendChild(nameIn); bar.appendChild(stateEl); bar.appendChild(msg); [btnNew, btnDl, btnPrint].forEach(function (b) { bar.appendChild(b); });
  const tabs = el('div', 'wp-tabs'); tabs.setAttribute('role', 'tablist'); const panels = el('div', 'wp-panels');
  const desk = el('div', 'wp-desk'), sheet = el('div', 'wp-sheet'), page = el('div', 'wp-page');
  page.contentEditable = 'true'; page.spellcheck = true; page.lang = 'en-GB'; page.setAttribute('role', 'textbox'); page.setAttribute('aria-multiline', 'true'); page.setAttribute('aria-label', 'Your document');
  sheet.appendChild(page); desk.appendChild(sheet);
  const stat = el('div', 'wp-stat'), statWords = el('span'), statPages = el('span'), zoomWrap = el('span', 'wp-zoom'), zoomOut = el('button', null, '−'), zoomIn = el('button', null, '+'), zoomLab = el('b', null, '100%');
  zoomOut.type = zoomIn.type = 'button'; zoomOut.setAttribute('aria-label', 'Zoom out'); zoomIn.setAttribute('aria-label', 'Zoom in'); zoomWrap.append(zoomOut, zoomLab, zoomIn); stat.append(statWords, statPages, zoomWrap);
  root.append(bar, tabs, panels, desk, stat);

  function tbtn(label, title, cls) { const b = el('button', 'wp-b' + (cls ? ' ' + cls : ''), label); b.type = 'button'; b.title = title; b.setAttribute('aria-label', title); return b; }
  function say(t, kind) { msg.textContent = t; msg.className = 'wp-msg' + (kind ? ' ' + kind : ''); clearTimeout(say.t); if (t) say.t = setTimeout(function () { msg.textContent = ''; }, 6000); }

  /* ---------- selection ---------- */
  const inPage = function (n) { return !!n && (n === page || page.contains(n)); };
  function sel() { const s = window.getSelection(); return s && s.rangeCount && inPage(s.anchorNode) ? s : null; }
  function remember() { const s = sel(); if (s) saved = s.getRangeAt(0).cloneRange(); }
  function restore() {                                          // back to the page, with the selection the person made (the live one if there is one, else the last one kept)
    const now = sel(), keep = now ? now.getRangeAt(0).cloneRange() : saved;
    try { page.focus({ preventScroll: true }); } catch (e) { page.focus(); }
    if (keep && inPage(keep.startContainer)) { const s = window.getSelection(); s.removeAllRanges(); s.addRange(keep); }
  }
  function ensureCaret() { if (!sel()) { page.focus(); const r = document.createRange(); r.selectNodeContents(page); r.collapse(false); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); remember(); } }
  function pathOf(n) { const p = []; while (n && n !== page) { const par = n.parentNode; if (!par) return null; p.unshift(Array.prototype.indexOf.call(par.childNodes, n)); n = par; } return n === page ? p : null; }
  function nodeAt(p) { let n = page; for (let i = 0; i < p.length && n; i++) n = n.childNodes[p[i]]; return n; }
  const lenOf = function (n) { return n.nodeType === 3 ? n.length : n.childNodes.length; };
  function selState() { const s = sel(); if (!s) return null; const r = s.getRangeAt(0), a = pathOf(r.startContainer), b = pathOf(r.endContainer); return a && b ? { a: a, ao: r.startOffset, b: b, bo: r.endOffset } : null; }
  function applySel(st) {
    if (!st) return; try { const a = nodeAt(st.a), b = nodeAt(st.b); if (!a || !b) return; const r = document.createRange(); r.setStart(a, Math.min(st.ao, lenOf(a))); r.setEnd(b, Math.min(st.bo, lenOf(b))); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); remember(); } catch (e) { }
  }

  /* ---------- undo and redo (the page is copied before each change, so tables, pictures and spacing can be undone too) ---------- */
  const snap = function () { return { h: page.innerHTML, s: selState() }; };
  function trim() { let n = 0; undo.forEach(function (u) { n += u.h.length; }); while (undo.length > MAX_UNDO || (n > MAX_UNDO_CHARS && undo.length > 1)) { n -= undo[0].h.length; undo.shift(); } }
  function begin(force) { if (force) burst = false; if (burst) return; undo.push(snap()); redo.length = 0; trim(); }
  function typing() { if (!burst) { undo.push(snap()); redo.length = 0; trim(); burst = true; } clearTimeout(burstTimer); burstTimer = setTimeout(function () { burst = false; }, 900); }
  function endChange() { burst = false; changed(); }
  function swap(from, to) { if (!from.length) return; burst = false; to.push(snap()); const s = from.pop(); page.innerHTML = s.h; applySel(s.s); selImg = null; page.focus(); changed(); }
  function doUndo() { swap(undo, redo); } function doRedo() { swap(redo, undo); }

  /* ---------- commands ---------- */
  function exec(name, val) {
    restore(); begin(true);
    try { document.execCommand('styleWithCSS', false, true); document.execCommand(name, false, val == null ? null : val); } catch (e) { }
    tidy(); remember(); endChange(); refresh();
  }
  function tidy() {                                             // the browser sometimes writes the old <font> tag: it becomes a plain span
    const fonts = page.querySelectorAll('font'), keep = fonts.length ? selState() : null;
    fonts.forEach(function (f) {
      const sp = document.createElement('span'), px = { 1: 8, 2: 10, 3: 12, 4: 14, 5: 18, 6: 24, 7: tidy.size || 12 }[f.getAttribute('size')];
      if (px) sp.style.fontSize = px + 'pt'; if (f.getAttribute('color')) sp.style.color = f.getAttribute('color'); if (f.getAttribute('face')) sp.style.fontFamily = f.getAttribute('face');
      while (f.firstChild) sp.appendChild(f.firstChild); f.replaceWith(sp);
    });
    if (keep) applySel(keep);
    page.querySelectorAll('span[style*="font-size"] span[style*="font-size"]').forEach(function (inner) { const o = inner.parentElement; if (o && o.childNodes.length === 1) o.style.fontSize = ''; });
  }
  function setSize(pt) {
    restore(); begin(true); tidy.size = pt;
    try { document.execCommand('styleWithCSS', false, false); document.execCommand('fontSize', false, '7'); document.execCommand('styleWithCSS', false, true); } catch (e) { }
    tidy(); remember(); endChange(); refresh();
  }
  const blockish = function (e) { const d = getComputedStyle(e).display; return d === 'block' || d === 'list-item' || d === 'table-cell' || d === 'flow-root'; };
  function leafBlocks() {                                        // the paragraphs (lines, headings, list items, table cells) the selection touches
    const s = sel(); if (!s) return []; const r = s.getRangeAt(0), out = [];
    const walk = function (e) {
      for (let n = e.firstChild; n; n = n.nextSibling) {
        if (n.nodeType !== 1 || !r.intersectsNode(n)) continue;
        if (/^(UL|OL|TABLE|TBODY|TR)$/.test(n.nodeName)) { walk(n); continue; }
        const inner = Array.prototype.some.call(n.children, function (c) { return blockish(c) || c.nodeName === 'UL' || c.nodeName === 'OL' || c.nodeName === 'TABLE'; });
        if (blockish(n) && !inner) out.push(n); else if (inner) walk(n);
      }
    };
    walk(page);
    if (!out.length) { let n = r.startContainer; while (n && n !== page && !(n.nodeType === 1 && blockish(n))) n = n.parentNode; if (n && n !== page) out.push(n); }
    return out;
  }
  function eachBlock(fn) { restore(); const bl = leafBlocks(); if (!bl.length) return; begin(true); bl.forEach(fn); remember(); endChange(); refresh(); }
  function setStyle(id) {
    restore(); begin(true);
    try {
      document.execCommand('styleWithCSS', false, true);
      if (id === 'p') document.execCommand('formatBlock', false, '<div>'); else if (id === 'title' || id === 'subtitle') document.execCommand('formatBlock', false, id === 'title' ? '<h1>' : '<div>');
      else if (id === 'quote') document.execCommand('formatBlock', false, '<blockquote>'); else document.execCommand('formatBlock', false, '<' + id + '>');
    } catch (e) { }
    leafBlocks().forEach(function (b) { b.removeAttribute('data-st'); b.removeAttribute('data-q'); if (id === 'title' || id === 'subtitle') b.setAttribute('data-st', id); const q = b.closest('blockquote'); if (q && id === 'quote') q.setAttribute('data-q', '1'); });
    remember(); endChange(); refresh();
  }
  function indent(dir) {
    restore(); const inList = !!(sel() && sel().anchorNode && (sel().anchorNode.nodeType === 1 ? sel().anchorNode : sel().anchorNode.parentElement).closest('li'));
    if (inList) { exec(dir > 0 ? 'indent' : 'outdent'); return; }
    eachBlock(function (b) { const cur = parseInt(b.style.marginLeft, 10) || 0, v = Math.max(0, Math.min(480, cur + dir * 48)); b.style.marginLeft = v ? v + 'px' : ''; });
  }

  /* ---------- insert: text pieces, pictures, tables, links ---------- */
  function insertHTML(html) { restore(); ensureCaret(); begin(true); try { document.execCommand('insertHTML', false, html); } catch (e) { } tidy(); remember(); endChange(); }
  function insertText(t) { restore(); ensureCaret(); begin(true); try { document.execCommand('insertText', false, t); } catch (e) { } remember(); endChange(); }
  const escAttr = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  function addPicture(src, w, h, alt) {
    const info = DF.parseDataImage(src, DS.LIM.imgChars); if (!info) { say('That picture cannot be added.', 'bad'); return; }
    if (page.querySelectorAll('img').length >= DS.LIM.images) { say('A document can hold up to ' + DS.LIM.images + ' pictures.', 'bad'); return; }
    const max = Math.min(480, PAPER[S.paper].w - 192); let pw = w, ph = h; if (pw > max) { ph = Math.round(ph * max / pw); pw = max; }
    insertHTML('<img src="' + src + '" width="' + pw + '" height="' + ph + '" alt="' + escAttr(alt || '') + '">'); say('Picture added. Click it to change its size.');
  }
  function pickComputer() {
    const f = el('input'); f.type = 'file'; f.accept = 'image/png,image/jpeg,image/gif,image/webp'; saved = saved || null;
    f.addEventListener('change', function () { const file = f.files && f.files[0]; if (file) importFile(file); }); f.click();
  }
  function importFile(file) { say('Adding the picture…'); DS.importImage(file).then(function (r) { addPicture(r.src, r.w, r.h, ''); }, function (e) { say(e.message || 'That picture cannot be added.', 'bad'); }); }
  function clipDialog() {
    const body = el('div', 'wp-clip'), cats = CC.clipart.cats(), tabsEl = el('div', 'wp-cliptabs'), grid = el('div', 'wp-clipgrid'); let cur = cats[0].id;
    body.append(tabsEl, grid);
    function draw() {
      tabsEl.textContent = ''; grid.textContent = '';
      cats.forEach(function (c) { const b = el('button', 'wp-b' + (c.id === cur ? ' on' : ''), c.icon + ' ' + c.name); b.type = 'button'; b.addEventListener('click', function () { cur = c.id; draw(); }); tabsEl.appendChild(b); });
      CC.clipart.items(cur).forEach(function (it) {
        const b = el('button', 'wp-clipitem'); b.type = 'button'; b.title = it.name; b.setAttribute('aria-label', it.name); const im = el('img'); im.alt = ''; im.width = im.height = 80; b.appendChild(im); b.appendChild(el('span', null, it.name)); grid.appendChild(b);
        CC.clipart.png(it.id, 160).then(function (p) { im.src = p.src; }, function () { });
        b.addEventListener('click', function () { CC.clipart.png(it.id, 360).then(function (p) { dlg.close(); addPicture(p.src, p.w, p.h, it.name); }, function (e) { say(e.message, 'bad'); }); });
      });
    }
    const dlg = dialog('🖼 Clip art', body, null); draw();
  }
  function tableHTML(rows, cols) { let tr = '<tr>' + '<td><br></td>'.repeat(cols) + '</tr>'; return '<table data-bd="grid"><tbody>' + tr.repeat(rows) + '</tbody></table><div><br></div>'; }
  function insertTable(rows, cols) {
    restore(); ensureCaret(); begin(true);
    let at = null; const s0 = sel(); if (s0) { at = s0.anchorNode; while (at && at.parentNode !== page) at = at.parentNode; }      // the line (or table) that holds the cursor: the new table goes after it
    const holder = document.createElement('div'); holder.innerHTML = tableHTML(rows, cols); const tbl = holder.firstChild, after = holder.lastChild;
    if (at && at !== page && at.parentNode) { at.parentNode.insertBefore(tbl, at.nextSibling); tbl.parentNode.insertBefore(after, tbl.nextSibling); } else { page.appendChild(tbl); page.appendChild(after); }
    putCaret(tbl.querySelector('td')); endChange(); say(rows + ' × ' + cols + ' table added. Press Tab to move to the next cell.');
  }
  function putCaret(node, atEnd) { const r = document.createRange(); r.selectNodeContents(node); r.collapse(!atEnd); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); remember(); page.focus(); }
  function validLink(v) {
    v = String(v || '').trim(); if (!v) return null; if (!/^[a-z][a-z0-9+.-]*:/i.test(v)) v = (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'mailto:' : 'https://') + v;
    return DS.href(v);
  }
  function linkDialog() {
    restore(); const s = sel(), picked = s && !s.isCollapsed ? s.toString() : '', body = el('div', 'wp-form');
    const t = field(body, 'Text to show', picked, 'text'), a = field(body, 'Web address', '', 'url'); a.placeholder = 'https://example.com or name@example.com';
    dialog('🔗 Add a link', body, function () {
      const url = validLink(a.value); if (!url) { say('That is not a web address. Use one that starts with http:// or https://, or an email address.', 'bad'); return false; }
      const label = t.value.trim() || url; restore(); ensureCaret(); begin(true);
      try { document.execCommand('insertHTML', false, '<a href="' + escAttr(url) + '">' + escAttr(label) + '</a>'); } catch (e) { } remember(); endChange(); return true;
    }); a.focus();
  }
  function field(parent, label, value, type, max) { const l = el('label'), i = el('input'); l.appendChild(document.createTextNode(label)); i.type = type || 'text'; i.value = value || ''; i.maxLength = max || 300; l.appendChild(i); parent.appendChild(l); return i; }
  function pageBreak() { insertHTML('<hr data-pb="1"><div><br></div>'); }
  function clearFormat() { restore(); begin(true); try { document.execCommand('removeFormat'); document.execCommand('formatBlock', false, '<div>'); } catch (e) { } leafBlocks().forEach(function (b) { b.removeAttribute('style'); b.removeAttribute('data-st'); }); remember(); endChange(); refresh(); }

  /* ---------- tables ---------- */
  function cellNow() { const s = sel(); if (!s) return null; const n = s.anchorNode; const e = n && n.nodeType === 1 ? n : n && n.parentElement; return e ? e.closest('td,th') : null; }
  function tableNow() { const c = cellNow(); return c ? c.closest('table') : null; }
  function cellsInSelection() { const s = sel(); if (!s) return []; const r = s.getRangeAt(0), t = tableNow(); if (!t) return []; const out = []; t.querySelectorAll('td,th').forEach(function (c) { if (r.intersectsNode(c)) out.push(c); }); return out.length ? out : [cellNow()]; }
  function emptyLike(c) { const n = document.createElement(c.nodeName.toLowerCase()); n.innerHTML = '<br>'; const st = c.getAttribute('style'); if (st && /background-color/.test(st)) n.setAttribute('style', st.split(';').filter(function (x) { return /background-color/.test(x); }).join(';')); return n; }
  function tableOp(op, arg) {
    const c = cellNow(); if (!c) return; const row = c.parentElement, t = c.closest('table'), rows = Array.prototype.slice.call(t.rows), ci = Array.prototype.indexOf.call(row.cells, c); begin(true);
    if (op === 'rowAbove' || op === 'rowBelow') { if (rows.length >= DS.LIM.rows) { say('That is the most rows a table can have.', 'bad'); return; } const nr = row.cloneNode(false); Array.prototype.forEach.call(row.cells, function (x) { const e = emptyLike(x); const cs = x.getAttribute('colspan'); if (cs) e.setAttribute('colspan', cs); nr.appendChild(e); }); row.parentNode.insertBefore(nr, op === 'rowAbove' ? row : row.nextSibling); putCaret(nr.cells[Math.min(ci, nr.cells.length - 1)]); }
    else if (op === 'colLeft' || op === 'colRight') { if (row.cells.length >= DS.LIM.cols) { say('That is the most columns a table can have.', 'bad'); return; } rows.forEach(function (r) { const ref = r.cells[Math.min(ci, r.cells.length - 1)]; if (!ref) return; const e = emptyLike(ref); e.removeAttribute('colspan'); r.insertBefore(e, op === 'colLeft' ? ref : ref.nextSibling); }); putCaret(row.cells[op === 'colLeft' ? ci : ci + 1]); }
    else if (op === 'delRow') { if (rows.length < 2) { t.remove(); ensureTail(); } else { const next = rows[rows.indexOf(row) + 1] || rows[rows.indexOf(row) - 1]; row.remove(); putCaret(next.cells[Math.min(ci, next.cells.length - 1)]); } }
    else if (op === 'delCol') { if (row.cells.length < 2) { t.remove(); ensureTail(); } else { rows.forEach(function (r) { const x = r.cells[Math.min(ci, r.cells.length - 1)]; if (x) x.remove(); }); putCaret(row.cells[Math.min(ci, row.cells.length - 1)]); } }
    else if (op === 'delTable') { t.remove(); ensureTail(); }
    else if (op === 'header') { const on = rows[0].cells[0].nodeName === 'TH'; Array.prototype.slice.call(rows[0].cells).forEach(function (x) { const n = document.createElement(on ? 'td' : 'th'); Array.prototype.slice.call(x.attributes).forEach(function (a) { n.setAttribute(a.name, a.value); }); while (x.firstChild) n.appendChild(x.firstChild); x.replaceWith(n); }); }
    else if (op === 'shade') { cellsInSelection().forEach(function (x) { if (arg) x.style.backgroundColor = arg; else x.style.backgroundColor = ''; if (!x.getAttribute('style')) x.removeAttribute('style'); }); }
    else if (op === 'borders') t.setAttribute('data-bd', arg);
    else if (op === 'align') cellsInSelection().forEach(function (x) { x.style.textAlign = arg; });
    else if (op === 'merge') { const next = c.nextElementSibling; if (!next) { say('There is no cell to the right to join.', 'bad'); return; } const span = (parseInt(c.getAttribute('colspan'), 10) || 1) + (parseInt(next.getAttribute('colspan'), 10) || 1); if (span > DS.LIM.cols) return; if (next.textContent.trim()) { c.appendChild(document.createElement('br')); while (next.firstChild) c.appendChild(next.firstChild); } next.remove(); c.setAttribute('colspan', String(span)); }
    endChange(); refresh();
  }
  function ensureTail() { if (!page.lastElementChild || /^(TABLE|HR)$/.test(page.lastElementChild.nodeName)) { const d = document.createElement('div'); d.innerHTML = '<br>'; page.appendChild(d); } if (!page.firstElementChild) page.innerHTML = '<div><br></div>'; putCaret(page.lastElementChild); }
  function nextCell(back) {
    const c = cellNow(); if (!c) return false; const cells = Array.prototype.slice.call(c.closest('table').querySelectorAll('td,th')), i = cells.indexOf(c);
    if (!back && i === cells.length - 1) { tableOp('rowBelow'); return true; }
    const n = cells[i + (back ? -1 : 1)]; if (n) putCaret(n); return true;
  }

  /* ---------- pictures already in the document ---------- */
  function selectPicture(img) { if (selImg && selImg !== img) selImg.classList.remove('wp-sel'); selImg = img; if (img) img.classList.add('wp-sel'); refresh(); }
  function pictureOp(op, arg) {
    if (!selImg || !inPage(selImg)) return; begin(true); const img = selImg, w = parseInt(img.getAttribute('width'), 10) || img.naturalWidth || 200, h = parseInt(img.getAttribute('height'), 10) || img.naturalHeight || 150, max = PAPER[S.paper].w - 192;
    const size = function (nw) { nw = Math.max(16, Math.min(max, Math.round(nw))); img.setAttribute('width', String(nw)); img.setAttribute('height', String(Math.max(1, Math.round(nw * h / w)))); img.style.width = nw + 'px'; img.style.height = Math.max(1, Math.round(nw * h / w)) + 'px'; };
    if (op === 'smaller') size(w * 0.8); else if (op === 'larger') size(w * 1.25); else if (op === 'fit') size(max * arg);
    else if (op === 'align') { let b = img.parentElement; while (b && b !== page && !blockish(b)) b = b.parentElement; if (b && b !== page) b.style.textAlign = arg; }
    else if (op === 'delete') { const p = img.parentNode; img.remove(); selImg = null; if (p && p !== page && !p.firstChild) p.appendChild(document.createElement('br')); }
    else if (op === 'alt') { img.setAttribute('alt', String(arg || '').slice(0, 300)); }
    endChange(); refresh();
  }
  function altDialog() {
    if (!selImg) return; const body = el('div', 'wp-form'), a = field(body, 'Describe the picture (for someone who cannot see it)', selImg.getAttribute('alt') || '', 'text', 300);
    dialog('🛈 Picture description', body, function () { pictureOp('alt', a.value); return true; }); a.focus();
  }

  /* ---------- find and replace ---------- */
  let findBox = null;
  function textNodes() { const out = [], w = document.createTreeWalker(page, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) out.push(n); return out; }
  function findAll(q, mc) {
    const hits = []; if (!q) return hits; const needle = mc ? q : q.toLowerCase();
    textNodes().forEach(function (n) { const t = mc ? n.nodeValue : n.nodeValue.toLowerCase(); let i = 0; while ((i = t.indexOf(needle, i)) >= 0 && hits.length < 5000) { hits.push({ n: n, i: i }); i += Math.max(1, needle.length); } });
    return hits;
  }
  function selectHit(h, len) { const r = document.createRange(); r.setStart(h.n, h.i); r.setEnd(h.n, h.i + len); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); remember(); const rect = r.getBoundingClientRect(), dk = desk.getBoundingClientRect(); if (rect.top < dk.top + 40 || rect.bottom > dk.bottom - 40) desk.scrollTop += rect.top - dk.top - dk.height / 3; }
  function findDialog(withReplace) {
    if (findBox) { findBox.remove(); findBox = null; }
    const box = el('div', 'wp-find'); findBox = box; const f = field(box, 'Find', '', 'text', 200), r = field(box, 'Replace with', '', 'text', 200), row = el('div', 'wp-row'), info = el('span', 'wp-hint');
    const mcL = el('label', 'wp-check'), mc = el('input'); mc.type = 'checkbox'; mcL.append(mc, document.createTextNode(' Match capitals')); box.appendChild(mcL);
    const s0 = sel(); if (s0 && !s0.isCollapsed && s0.toString().length < 100) f.value = s0.toString();
    const bNext = tbtn('Find next', 'Find the next match'), bRep = tbtn('Replace', 'Replace this match'), bAll = tbtn('Replace all', 'Replace every match'), bX = tbtn('✖', 'Close');
    row.append(bNext, bRep, bAll, bX); box.append(row, info); root.appendChild(box);
    if (!withReplace) { r.parentElement.hidden = true; bRep.hidden = bAll.hidden = true; }
    function next() { const hits = findAll(f.value, mc.checked); if (!hits.length) { info.textContent = 'Not found.'; return null; } const s = sel(); let i = 0; if (s && s.rangeCount) { const rg = s.getRangeAt(0); i = hits.findIndex(function (h) { const p = document.createRange(); p.setStart(h.n, h.i); return rg.compareBoundaryPoints(Range.START_TO_START, p) < 0 || (rg.collapsed && rg.compareBoundaryPoints(Range.START_TO_START, p) <= 0); }); if (i < 0) i = 0; } const h = hits[i]; selectHit(h, f.value.length); info.textContent = (i + 1) + ' of ' + hits.length; return h; }
    bNext.addEventListener('click', next); f.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); next(); } });
    bRep.addEventListener('click', function () { const s = sel(); if (s && !s.isCollapsed && (mc.checked ? s.toString() === f.value : s.toString().toLowerCase() === f.value.toLowerCase())) { page.focus(); begin(true); try { document.execCommand('insertText', false, r.value); } catch (e) { } remember(); endChange(); } next(); });
    bAll.addEventListener('click', function () {
      const hits = findAll(f.value, mc.checked); if (!hits.length) { info.textContent = 'Not found.'; return; } begin(true); let n = 0;
      for (let k = hits.length - 1; k >= 0; k--) { const h = hits[k]; if (!h.n.parentNode) continue; h.n.nodeValue = h.n.nodeValue.slice(0, h.i) + r.value + h.n.nodeValue.slice(h.i + f.value.length); n++; }
      endChange(); info.textContent = n + ' replaced.';
    });
    bX.addEventListener('click', function () { box.remove(); findBox = null; page.focus(); }); box.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.stopPropagation(); bX.click(); } }); f.focus(); f.select();
  }

  /* ---------- small windows ---------- */
  function dialog(title, body, onOk) {
    const ov = el('div', 'wp-ov'), box = el('div', 'wp-dlg'), h = el('h3', null, title), row = el('div', 'wp-row'); ov.appendChild(box); box.append(h, body); box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', title); box.setAttribute('aria-modal', 'true');
    const api = { close: function () { ov.remove(); page.focus(); } };
    if (onOk) { const ok = tbtn('OK', 'OK', 'primary'), no = tbtn('Cancel', 'Cancel'); ok.addEventListener('click', function () { if (onOk() !== false) api.close(); }); no.addEventListener('click', api.close); row.append(ok, no); box.appendChild(row); box.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); ok.click(); } }); }
    else { const no = tbtn('Close', 'Close'); no.addEventListener('click', api.close); row.appendChild(no); box.appendChild(row); }
    box.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.stopPropagation(); api.close(); } }); ov.addEventListener('mousedown', function (e) { if (e.target === ov) api.close(); });
    remember(); root.appendChild(ov); return api;
  }
  function closePop() { if (openPop) { openPop.remove(); openPop = null; } }
  function popover(anchor, build) {
    closePop(); const p = el('div', 'wp-pop'); build(p); root.appendChild(p); openPop = p;
    const a = anchor.getBoundingClientRect(), r = root.getBoundingClientRect(); p.style.left = Math.max(4, Math.min(a.left - r.left, r.width - p.offsetWidth - 6)) + 'px'; p.style.top = (a.bottom - r.top + 2) + 'px'; remember();
    return p;
  }
  function swatches(p, colours, pick, none) {
    const g = el('div', 'wp-sw'); colours.forEach(function (c) { const b = el('button', 'wp-swb'); b.type = 'button'; b.style.background = c; b.title = c; b.setAttribute('aria-label', 'colour ' + c); b.addEventListener('click', function () { closePop(); pick(c); }); g.appendChild(b); }); p.appendChild(g);
    if (none) { const n = tbtn(none, none); n.addEventListener('click', function () { closePop(); pick(null); }); p.appendChild(n); }
  }
  function pickTable(anchor) {
    popover(anchor, function (p) {
      const lab = el('div', 'wp-hint', 'Choose the size of the table'), g = el('div', 'wp-tgrid'), cells = []; p.append(lab, g);
      for (let r = 0; r < 8; r++) for (let c = 0; c < 10; c++) { const b = el('button', 'wp-tc'); b.type = 'button'; b.setAttribute('aria-label', (r + 1) + ' rows by ' + (c + 1) + ' columns'); b.dataset.r = r; b.dataset.c = c; g.appendChild(b); cells.push(b); }
      const show = function (r, c) { cells.forEach(function (b) { b.classList.toggle('on', +b.dataset.r <= r && +b.dataset.c <= c); }); lab.textContent = r < 0 ? 'Choose the size of the table' : (r + 1) + ' rows × ' + (c + 1) + ' columns'; };
      g.addEventListener('mouseover', function (e) { const b = e.target.closest('.wp-tc'); if (b) show(+b.dataset.r, +b.dataset.c); }); g.addEventListener('focusin', function (e) { const b = e.target.closest('.wp-tc'); if (b) show(+b.dataset.r, +b.dataset.c); });
      g.addEventListener('click', function (e) { const b = e.target.closest('.wp-tc'); if (b) { closePop(); insertTable(+b.dataset.r + 1, +b.dataset.c + 1); } });
    });
  }

  /* ---------- the ribbon ---------- */
  const ctl = {};                                               // the buttons whose look follows the text under the cursor
  function group(label) { const g = el('div', 'wp-grp'); g.appendChild(el('span', 'gl', label)); return g; }
  function btn(g, id, label, title, fn, cls) {
    const b = tbtn(label, title, cls); b.dataset.id = id; ctl[id] = b; b.addEventListener('click', function (e) { e.stopPropagation(); fn(b); }); g.insertBefore(b, g.querySelector('.gl')); return b;
  }
  function select(g, id, title, items, fn, cls) {
    const s = el('select', 'wp-sel-ctl ' + (cls || '')); s.title = title; s.setAttribute('aria-label', title); items.forEach(function (it) { const o = el('option', null, it[1]); o.value = it[0]; s.appendChild(o); }); ctl[id] = s; s.dataset.id = id;
    s.addEventListener('change', function () { fn(s.value); }); s.addEventListener('mousedown', remember); g.insertBefore(s, g.querySelector('.gl')); return s;
  }
  function panel(id, name, contextual) {
    const t = el('button', 'wp-tab' + (contextual ? ' ctx' : ''), name); t.type = 'button'; t.setAttribute('role', 'tab'); t.dataset.tab = id; tabs.appendChild(t); const p = el('div', 'wp-panel'); p.dataset.tab = id; p.setAttribute('role', 'tabpanel'); panels.appendChild(p);
    t.addEventListener('click', function () { showTab(id); }); return { t: t, p: p };
  }
  function showTab(id) { tab = id; tabs.querySelectorAll('.wp-tab').forEach(function (t) { const on = t.dataset.tab === id; t.classList.toggle('on', on); t.setAttribute('aria-selected', on ? 'true' : 'false'); }); panels.querySelectorAll('.wp-panel').forEach(function (p) { p.hidden = p.dataset.tab !== id; }); closePop(); }
  const mark = function (c) { return function () { exec(c); }; };

  const home = panel('home', 'Home'), ins = panel('insert', 'Insert'), lay = panel('layout', 'Layout'), tt = panel('table', 'Table tools', true), pt = panel('picture', 'Picture tools', true);
  let g = group('Edit'); home.p.appendChild(g);
  btn(g, 'undo', '↶', 'Undo (Ctrl+Z)', doUndo); btn(g, 'redo', '↷', 'Redo (Ctrl+Y)', doRedo); btn(g, 'clear', '⌫ Clear', 'Clear formatting: take off all styles from the selected text', clearFormat); btn(g, 'find', '🔍 Find', 'Find and replace (Ctrl+H)', function () { findDialog(true); });
  g = group('Font'); home.p.appendChild(g);
  select(g, 'font', 'Font', FONT_LIST.map(function (f) { return [f, f]; }), function (v) { exec('fontName', v); }, 'wp-font');
  select(g, 'size', 'Font size in points', SIZE_LIST.map(function (n) { return [String(n), String(n)]; }), function (v) { setSize(+v); }, 'wp-size');
  btn(g, 'grow', 'A▲', 'Make the text bigger', function () { stepSize(1); }); btn(g, 'shrink', 'A▼', 'Make the text smaller', function () { stepSize(-1); });
  g.insertBefore(el('span', 'brk'), g.querySelector('.gl'));
  btn(g, 'bold', 'B', 'Bold (Ctrl+B)', mark('bold'), 'bold'); btn(g, 'italic', 'I', 'Italic (Ctrl+I)', mark('italic'), 'italic'); btn(g, 'underline', 'U', 'Underline (Ctrl+U)', mark('underline'), 'underline'); btn(g, 'strike', 'S', 'Strikethrough', mark('strikeThrough'), 'strike');
  btn(g, 'sub', 'x₂', 'Subscript: small text below the line (as in H₂O)', mark('subscript')); btn(g, 'sup', 'x²', 'Superscript: small text above the line (as in m²)', mark('superscript'));
  btn(g, 'color', 'A', 'Text colour', function (b) { popover(b, function (p) { swatches(p, PALETTE, function (c) { exec('foreColor', c); }, null); }); }, 'colorbtn'); btn(g, 'hilite', '🖍', 'Highlight colour', function (b) { popover(b, function (p) { swatches(p, ['#ffff00', '#00ff00', '#00ffff', '#ff99cc', '#ffc000', '#ccccff'], function (c) { if (c) exec('hiliteColor', c); else exec('hiliteColor', 'transparent'); }, 'No highlight'); }); });
  g = group('Paragraph'); home.p.appendChild(g);
  btn(g, 'ul', '• List', 'Bulleted list', mark('insertUnorderedList')); btn(g, 'ol', '1. List', 'Numbered list', mark('insertOrderedList')); btn(g, 'outdent', '⇤', 'Decrease indent', function () { indent(-1); }); btn(g, 'indent', '⇥', 'Increase indent', function () { indent(1); });
  g.insertBefore(el('span', 'brk'), g.querySelector('.gl'));
  btn(g, 'left', '☰', 'Align left', mark('justifyLeft')); btn(g, 'center', '≡', 'Centre', mark('justifyCenter')); btn(g, 'right', '☷', 'Align right', mark('justifyRight')); btn(g, 'justify', '▤', 'Justify: straight edges on both sides', mark('justifyFull'));
  btn(g, 'spacing', '↕ Spacing ▾', 'Line spacing', function (b) { popover(b, function (p) { SPACING.forEach(function (v) { const x = tbtn(String(v), 'Line spacing ' + v); x.addEventListener('click', function () { closePop(); eachBlock(function (bl) { bl.style.lineHeight = v === 1 ? '' : String(v); }); }); p.appendChild(x); }); }); });
  g = group('Styles'); home.p.appendChild(g); select(g, 'style', 'Paragraph style', STYLES, function (v) { setStyle(v); }, 'wp-style');

  g = group('Pictures'); ins.p.appendChild(g); btn(g, 'picFile', '🖼 From computer', 'Add a picture from this computer', pickComputer); btn(g, 'picClip', '🎨 Clip art', 'Add a clip-art picture', clipDialog);
  g = group('Tables'); ins.p.appendChild(g); btn(g, 'table', '▦ Table ▾', 'Add a table', function (b) { pickTable(b); });
  g = group('Links and breaks'); ins.p.appendChild(g); btn(g, 'link', '🔗 Link', 'Add a link (Ctrl+K)', linkDialog); btn(g, 'pb', '⤓ Page break', 'Start a new page here (Ctrl+Enter)', pageBreak); btn(g, 'hr', '— Line', 'Add a straight line', function () { insertHTML('<hr><div><br></div>'); });
  g = group('Text'); ins.p.appendChild(g); btn(g, 'sym', 'Ω Symbol ▾', 'Add a symbol', function (b) { popover(b, function (p) { const gr = el('div', 'wp-symgrid'); SYMBOLS.forEach(function (s) { const x = el('button', 'wp-sym', s); x.type = 'button'; x.addEventListener('click', function () { closePop(); insertText(s); }); gr.appendChild(x); }); p.appendChild(gr); }); });
  btn(g, 'date', '📅 Date', 'Add today’s date', function () { insertText(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })); });

  g = group('Paper'); lay.p.appendChild(g); select(g, 'paper', 'Paper size', [['a4', 'A4'], ['letter', 'Letter']], function (v) { S.paper = v; paper(); scheduleSave(); });
  g = group('Page numbers'); lay.p.appendChild(g); btn(g, 'pnums', '# Page numbers', 'Print page numbers at the bottom of each page and in the Word file', function () { S.pageNums = !S.pageNums; refresh(); scheduleSave(); say(S.pageNums ? 'Page numbers will be added when you print or download.' : 'Page numbers are off.'); });
  g = group('Zoom'); lay.p.appendChild(g); btn(g, 'z-', '−', 'Zoom out', function () { zoom(-10); }); btn(g, 'z+', '+', 'Zoom in', function () { zoom(10); }); btn(g, 'z100', '100%', 'Normal size', function () { zoomTo(100); });

  g = group('Rows and columns'); tt.p.appendChild(g);
  btn(g, 'tRA', '⬆ Row above', 'Add a row above', function () { tableOp('rowAbove'); }); btn(g, 'tRB', '⬇ Row below', 'Add a row below', function () { tableOp('rowBelow'); }); btn(g, 'tCL', '⬅ Column left', 'Add a column to the left', function () { tableOp('colLeft'); }); btn(g, 'tCR', '➡ Column right', 'Add a column to the right', function () { tableOp('colRight'); });
  btn(g, 'tDR', '✖ Row', 'Delete this row', function () { tableOp('delRow'); }); btn(g, 'tDC', '✖ Column', 'Delete this column', function () { tableOp('delCol'); }); btn(g, 'tDT', '🗑 Table', 'Delete the whole table', function () { tableOp('delTable'); });
  g = group('Look'); tt.p.appendChild(g);
  btn(g, 'tH', 'Header row', 'Make the first row a heading row (bold)', function () { tableOp('header'); }); btn(g, 'tShade', '🎨 Shade', 'Colour the background of the cell', function (b) { popover(b, function (p) { swatches(p, SHADES, function (c) { tableOp('shade', c); }, 'No colour'); }); });
  select(g, 'tBd', 'Borders', [['grid', 'All borders'], ['box', 'Outside border'], ['none', 'No borders']], function (v) { tableOp('borders', v); });
  btn(g, 'tAl', '≡', 'Centre the text in the cell', function () { tableOp('align', 'center'); }); btn(g, 'tAl2', '☰', 'Align the text in the cell to the left', function () { tableOp('align', 'left'); }); btn(g, 'tAl3', '☷', 'Align the text in the cell to the right', function () { tableOp('align', 'right'); }); btn(g, 'tMg', '⇔ Join', 'Join this cell with the cell on its right', function () { tableOp('merge'); });

  g = group('Size'); pt.p.appendChild(g);
  btn(g, 'pSm', '− Smaller', 'Make the picture smaller', function () { pictureOp('smaller'); }); btn(g, 'pLg', '+ Larger', 'Make the picture larger', function () { pictureOp('larger'); });
  [['25%', 0.25], ['50%', 0.5], ['75%', 0.75], ['100%', 1]].forEach(function (x) { btn(g, 'p' + x[0], x[0], 'Make the picture ' + x[0] + ' of the width of the page', function () { pictureOp('fit', x[1]); }); });
  g = group('Position'); pt.p.appendChild(g); btn(g, 'pL', '☰', 'Picture on the left', function () { pictureOp('align', 'left'); }); btn(g, 'pC', '≡', 'Picture in the centre', function () { pictureOp('align', 'center'); }); btn(g, 'pR', '☷', 'Picture on the right', function () { pictureOp('align', 'right'); });
  g = group('More'); pt.p.appendChild(g); btn(g, 'pAlt', '🛈 Description', 'Describe the picture for someone who cannot see it', altDialog); btn(g, 'pDel', '🗑 Delete', 'Delete the picture', function () { pictureOp('delete'); });
  tt.t.hidden = pt.t.hidden = true; showTab('home');

  function stepSize(d) { const cur = currentSize(), i = SIZE_LIST.indexOf(SIZE_LIST.reduce(function (a, n) { return Math.abs(n - cur) < Math.abs(a - cur) ? n : a; }, 12)), n = SIZE_LIST[Math.max(0, Math.min(SIZE_LIST.length - 1, i + d))]; setSize(n); }
  function currentSize() { const s = sel(); if (!s) return 12; const n = s.focusNode && s.focusNode.nodeType === 1 ? s.focusNode : s.focusNode && s.focusNode.parentElement; return n ? Math.round(parseFloat(getComputedStyle(n).fontSize) * 0.75) : 12; }

  /* ---------- the buttons that show what the cursor is in ---------- */
  function refresh() {
    ['bold', 'italic', 'underline', 'strike', 'sub', 'sup', 'ul', 'ol', 'left', 'center', 'right', 'justify'].forEach(function (id) {
      const cmd = { bold: 'bold', italic: 'italic', underline: 'underline', strike: 'strikeThrough', sub: 'subscript', sup: 'superscript', ul: 'insertUnorderedList', ol: 'insertOrderedList', left: 'justifyLeft', center: 'justifyCenter', right: 'justifyRight', justify: 'justifyFull' }[id]; let on = false;
      try { on = !!sel() && document.queryCommandState(cmd); } catch (e) { } ctl[id].classList.toggle('on', on); ctl[id].setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    const s = sel(); if (s) {
      const n = s.focusNode && s.focusNode.nodeType === 1 ? s.focusNode : s.focusNode && s.focusNode.parentElement;
      if (n) { const cs = getComputedStyle(n), fam = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim(), f = FONT_LIST.filter(function (x) { return x.toLowerCase() === fam.toLowerCase(); })[0]; ctl.font.value = f || ''; ctl.size.value = String(Math.round(parseFloat(cs.fontSize) * 0.75)); const b = n.closest('h1,h2,h3,blockquote,[data-st]'); ctl.style.value = !b ? 'p' : b.getAttribute('data-st') || (b.nodeName === 'BLOCKQUOTE' ? 'quote' : b.nodeName.toLowerCase()); }
    }
    ctl.pnums.classList.toggle('on', S.pageNums); ctl.pnums.setAttribute('aria-pressed', S.pageNums ? 'true' : 'false'); ctl.paper.value = S.paper;
    ctl.undo.disabled = !undo.length; ctl.redo.disabled = !redo.length;
    const inTable = !!cellNow(), inPic = !!(selImg && inPage(selImg)); tt.t.hidden = !inTable; pt.t.hidden = !inPic;
    if (inTable) { const t = tableNow(); ctl.tBd.value = t.getAttribute('data-bd') || 'grid'; ctl.tH.classList.toggle('on', !!t.rows[0] && t.rows[0].cells[0] && t.rows[0].cells[0].nodeName === 'TH'); }
    if ((tab === 'table' && !inTable) || (tab === 'picture' && !inPic)) showTab('home');
  }

  /* ---------- paper, zoom, counts, saving ---------- */
  function paper() { const p = PAPER[S.paper]; sheet.style.width = p.w + 'px'; page.style.minHeight = p.h + 'px'; sheet.style.setProperty('--ph', p.h + 'px'); sheet.style.setProperty('--pw', p.w + 'px'); counts(); }
  function zoomTo(z) { S.zoom = Math.max(50, Math.min(200, z)); sheet.style.zoom = S.zoom / 100; zoomLab.textContent = S.zoom + '%'; }
  function zoom(d) { zoomTo(S.zoom + d); }
  function counts() {
    clearTimeout(statusRaf); statusRaf = setTimeout(function () {
      const t = page.innerText || '', words = (t.match(/\S+/g) || []).length, chars = t.replace(/\n/g, '').length, pages = Math.max(1, Math.ceil(page.scrollHeight / PAPER[S.paper].h));
      statWords.textContent = words + (words === 1 ? ' word' : ' words') + ' · ' + chars + ' characters'; statPages.textContent = pages + (pages === 1 ? ' page' : ' pages');
    }, 80);
  }
  function docHtml() { return DS.sanitize(page.innerHTML.replace(/ class="wp-sel"/g, '')); }
  function writeSave() {
    saveTimer = 0; let html; try { html = docHtml(); } catch (e) { return; }
    const data = { n: S.name, h: html, p: S.paper, pn: S.pageNums }, size = JSON.stringify(data).length;
    if (size > MAXSAVE) { stateEl.textContent = '⚠ Too big to keep automatically. Please download a copy.'; stateEl.className = 'wp-state bad'; return; }
    const ok = CC.keep.save(KEY, data); stateEl.textContent = ok ? '✔ Kept on this computer for ' + CC.keep.hours + ' hours' : '⚠ Could not keep a copy. Please download one.'; stateEl.className = 'wp-state' + (ok ? '' : ' bad');
  }
  function scheduleSave() { stateEl.textContent = 'Saving…'; stateEl.className = 'wp-state'; clearTimeout(saveTimer); saveTimer = setTimeout(writeSave, 700); }
  function flush() { if (saveTimer) { clearTimeout(saveTimer); writeSave(); } }
  function changed() { counts(); scheduleSave(); refresh(); }
  function load() {
    const d = CC.keep.load(KEY); let ok = false;
    if (d && typeof d === 'object' && typeof d.h === 'string') {
      const root0 = DS.fragment(d.h); page.innerHTML = root0.innerHTML || '<div><br></div>'; S.name = DF.safeName(typeof d.n === 'string' ? d.n : '', 'My document'); S.paper = d.p === 'letter' ? 'letter' : 'a4'; S.pageNums = d.pn === true; ok = true;
    } else page.innerHTML = '<div><br></div>';
    tail(); nameIn.value = S.name; paper(); zoomTo(100); return ok;
  }
  function tail() { const last = page.lastElementChild; if (!last || /^(TABLE|HR)$/.test(last.nodeName)) { const d = document.createElement('div'); d.appendChild(document.createElement('br')); page.appendChild(d); } }
  function newDoc() {
    const body = el('div', 'wp-form'); body.appendChild(el('p', null, 'This clears the page and removes the copy kept on this computer. Download your work first if you want to keep it.'));
    dialog('📄 Start a new document?', body, function () { begin(true); page.innerHTML = '<div><br></div>'; S.name = 'My document'; nameIn.value = S.name; selImg = null; undo.length = 0; redo.length = 0; CC.keep.drop(KEY); changed(); page.focus(); say('A new, empty document.'); return true; });
  }

  /* ---------- downloads and printing ---------- */
  function baseName() { S.name = DF.safeName(nameIn.value, 'My document'); return S.name; }
  function download(kind) {
    const name = baseName(), root0 = DS.fragment(docHtml());
    try {
      if (kind === 'docx') CC.docx.saveDocx(root0, name, { page: S.paper, pageNumbers: S.pageNums }).then(function () { say('Saved ' + name + '.docx in your Downloads folder.'); }, function () { say('The Word file could not be made.', 'bad'); });
      else if (kind === 'html') { CC.docx.saveHtml(root0, name); say('Saved ' + name + '.html in your Downloads folder.'); }
      else if (kind === 'txt') { CC.docx.saveText(root0, name); say('Saved ' + name + '.txt in your Downloads folder.'); }
      else if (kind === 'pdf') printDoc();
    } catch (e) { say('The file could not be made.', 'bad'); }
  }
  let printPage = null;
  function preparePrint() {
    cleanPrint(); const st = document.createElement('style'); st.id = 'wp-page-css'; st.textContent = '@media print{@page{size:' + (S.paper === 'a4' ? 'A4' : 'letter') + ';margin:2.54cm' + (S.pageNums ? ';@bottom-center{content:counter(page)}' : '') + '}}'; document.head.appendChild(st);
    printPage = el('div', 'wp-printpage'); printPage.appendChild(DS.fragment(docHtml())); document.body.appendChild(printPage); document.body.classList.add('wp-printing');
  }
  function cleanPrint() { document.body.classList.remove('wp-printing'); const st = document.getElementById('wp-page-css'); if (st) st.remove(); if (printPage) { printPage.remove(); printPage = null; } }
  function printDoc() { preparePrint(); say('In the print window, choose “Save as PDF” to make a PDF file.'); try { if (!DF.noDownload) window.print(); } catch (e) { } setTimeout(cleanPrint, DF.noDownload ? 200 : 60000); }

  /* ---------- everything arriving from outside goes through the cleaner ---------- */
  page.addEventListener('paste', function (e) {
    e.preventDefault(); remember(); const cd = e.clipboardData; if (!cd) return;
    const files = Array.prototype.filter.call(cd.files || [], function (f) { return /^image\//.test(f.type); });
    if (files.length) { importFile(files[0]); return; }
    const html = cd.getData('text/html'), text = cd.getData('text/plain');
    if (html) insertHTML(DS.sanitize(html)); else if (text) insertText(text.slice(0, 1000000));
  });
  page.addEventListener('dragstart', function () { internalDrag = true; });
  page.addEventListener('dragend', function () { internalDrag = false; });
  page.addEventListener('dragover', function (e) { e.preventDefault(); });
  page.addEventListener('drop', function (e) {
    if (internalDrag) { begin(true); setTimeout(endChange, 0); return; }                                // a move inside the page is the browser's own and holds only what the page already had
    e.preventDefault(); const dt = e.dataTransfer; if (!dt) return;
    let r = null; try { if (document.caretRangeFromPoint) r = document.caretRangeFromPoint(e.clientX, e.clientY); else if (document.caretPositionFromPoint) { const p = document.caretPositionFromPoint(e.clientX, e.clientY); r = document.createRange(); r.setStart(p.offsetNode, p.offset); } } catch (x) { }
    if (r && inPage(r.startContainer)) { const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); remember(); }
    const files = Array.prototype.filter.call(dt.files || [], function (f) { return /^image\//.test(f.type); });
    if (files.length) { importFile(files[0]); return; }
    const html = dt.getData('text/html'), text = dt.getData('text/plain'); if (html) insertHTML(DS.sanitize(html)); else if (text) insertText(text.slice(0, 1000000));
  });
  page.addEventListener('beforeinput', function (e) {
    if (e.inputType === 'historyUndo') { e.preventDefault(); doUndo(); return; } if (e.inputType === 'historyRedo') { e.preventDefault(); doRedo(); return; }
    if (e.inputType === 'insertFromPaste' || e.inputType === 'insertFromDrop') { return; }
    if (!e.isComposing) typing();
  });
  page.addEventListener('input', function () { tidy(); changed(); });
  page.addEventListener('click', function (e) { if (e.target.nodeName === 'IMG') { selectPicture(e.target); } else if (selImg) selectPicture(null); remember(); refresh(); });
  page.addEventListener('keyup', function () { remember(); });
  page.addEventListener('mouseup', function () { burst = false; remember(); });
  page.addEventListener('keydown', function (e) {
    const k = e.key, mod = e.ctrlKey || e.metaKey;
    if (mod && !e.altKey) {
      if (k === 'z' || k === 'Z') { e.preventDefault(); if (e.shiftKey) doRedo(); else doUndo(); return; }
      if (k === 'y' || k === 'Y') { e.preventDefault(); doRedo(); return; }
      if (k === 'k' || k === 'K') { e.preventDefault(); linkDialog(); return; }
      if (k === 'h' || k === 'H' || k === 'f' || k === 'F') { e.preventDefault(); findDialog(k === 'h' || k === 'H'); return; }
      if (k === 's' || k === 'S') { e.preventDefault(); btnDl.click(); return; }
      if (k === 'Enter') { e.preventDefault(); pageBreak(); return; }
    }
    if (k === 'Tab') {
      e.preventDefault(); const s1 = sel(), an = s1 && s1.anchorNode, ae = an && (an.nodeType === 1 ? an : an.parentElement);
      if (cellNow()) nextCell(e.shiftKey); else if (ae && ae.closest('li')) indent(e.shiftKey ? -1 : 1); else if (!e.shiftKey) insertText('	');
      return;
    }
    if (k === 'Escape') { const first = tabs.querySelector('.wp-tab.on'); if (first) first.focus(); return; }                          // leave the page with the keyboard
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].indexOf(k) >= 0) burst = false;
  });
  page.addEventListener('copy', function () { remember(); }); page.addEventListener('cut', function () { begin(true); setTimeout(endChange, 0); });
  root.addEventListener('mousedown', function (e) { if (e.target.closest('.wp-b') && !e.target.closest('.wp-dlg') ) e.preventDefault(); if (openPop && !e.target.closest('.wp-pop') && !e.target.closest('.wp-b')) closePop(); });
  root.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePop(); e.stopPropagation(); });
  document.addEventListener('selectionchange', onSelection);
  function onSelection() { if (host.hidden || !root.isConnected) return; if (sel()) { remember(); clearTimeout(onSelection.r); onSelection.r = setTimeout(refresh, 40); } }
  nameIn.addEventListener('input', function () { S.name = nameIn.value; scheduleSave(); }); nameIn.addEventListener('blur', function () { nameIn.value = DF.safeName(nameIn.value, 'My document'); S.name = nameIn.value; });
  btnNew.addEventListener('click', newDoc); btnPrint.addEventListener('click', printDoc);
  btnDl.addEventListener('click', function () {
    popover(btnDl, function (p) { [['docx', '📘 Word document (.docx)'], ['html', '🌐 Web page (.html)'], ['txt', '📄 Plain text (.txt)'], ['pdf', '📕 PDF (use the print window)']].forEach(function (x) { const b = tbtn(x[1], x[1]); b.classList.add('wide'); b.addEventListener('click', function () { closePop(); download(x[0]); }); p.appendChild(b); }); });
  });
  zoomOut.addEventListener('click', function () { zoom(-10); }); zoomIn.addEventListener('click', function () { zoom(10); });
  window.addEventListener('beforeprint', function () { if (!printPage && root.offsetParent !== null) preparePrint(); });      // Ctrl+P prints the document, not the whole site
  window.addEventListener('afterprint', cleanPrint);
  window.addEventListener('pagehide', flush); document.addEventListener('visibilitychange', function () { if (document.hidden) flush(); });

  try { document.execCommand('styleWithCSS', false, true); document.execCommand('defaultParagraphSeparator', false, 'div'); } catch (e) { }
  const restored = load(); counts(); refresh();
  if (restored) say('Your document from earlier is back. It is kept for ' + CC.keep.hours + ' hours after your last change.');
  return {
    show: function () { try { document.execCommand('styleWithCSS', false, true); document.execCommand('defaultParagraphSeparator', false, 'div'); } catch (e) { } counts(); setTimeout(function () { page.focus(); }, 0); },
    leave: function () { flush(); closePop(); },
    api: { page: page, S: S, getHtml: docHtml, setHtml: function (h) { begin(true); page.innerHTML = DS.fragment(h).innerHTML || '<div><br></div>'; endChange(); }, undo: doUndo, redo: doRedo, insertTable: insertTable, addPicture: addPicture, download: download, flush: flush, cmd: exec, setStyle: setStyle, tableOp: tableOp, pictureOp: pictureOp, selectPicture: selectPicture, importFile: importFile, find: findAll, state: function () { return { undo: undo.length, redo: redo.length }; } }
  };
}
CC.tools = CC.tools || {}; CC.tools.writerMount = mount;
})();
