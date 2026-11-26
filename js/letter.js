/* letter.js - Type a Letter (Years 2 to 6): a small word processor that works the way real ones do (Word, Google Docs, LibreOffice Writer).
   The LEVELS at the bottom are for Years 4 to 6; Years 2 and 3 have their own gentler lessons in letter_young.js.
     - a ribbon: clipboard, font (name, size, bold, italic, underline, colour, highlight), paragraph (bullets, numbers, left, centre, right, justify)
     - the usual keys: Ctrl+B / I / U, Ctrl+C / X / V, Ctrl+Z / Y, Ctrl+A, Ctrl+S (save), Ctrl+P (print)
     - a red wavy line under a spelling mistake; right-click it to choose the right spelling
     - Insert: clip-art pictures (made bigger or smaller, centred, deleted) and tables (TAB moves between cells; rows and columns can be added)
     - Save really saves a Word file (.docx) that opens in a word processor, and Print really prints the page
     - the page only takes plain text from outside (paste and drop); the pictures come from this site's own clip art
   The page is a normal editable box. A level is a list of steps (see lab.js). */
(function () {
'use strict';
const CC = window.CC, L = CC.lab;
const COLORS = [['#1a1b3f', 'Black'], ['#e02f44', 'Red'], ['#1f6fe0', 'Blue'], ['#1f8a4a', 'Green'], ['#8a2be2', 'Purple']];
const FONTS = [['Georgia', 'Georgia'], ['Arial', 'Arial'], ['Comic Sans MS', 'Comic Sans'], ['Courier New', 'Courier New'], ['Verdana', 'Verdana']];
const SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 36, 48];
const HILITE = '#fff27a';

function build(body, api, year, lv) {
  const b = function (cmd, label, title, cls) { return '<button type="button" class="wl-b' + (cls ? ' ' + cls : '') + '" data-cmd="' + cmd + '" title="' + title + '" aria-label="' + title + '">' + label + '</button>'; };
  body.innerHTML = '<div class="wl-wrap' + (lv.ribbon ? ' wl-' + lv.ribbon : '') + '"><div class="wl-title"><span class="qa">' + b('save', '💾', 'Save (Ctrl+S)') + b('undo', '↶', 'Undo (Ctrl+Z)') + b('redo', '↷', 'Redo (Ctrl+Y)') + '</span><span class="nm">Document1</span><span class="app"> - Type a Letter</span></div>' +
    '<div class="wl-bar">' +
      '<div class="wl-grp clip">' + b('paste', '📋', 'Paste (Ctrl+V)') + b('cut', '✂️', 'Cut (Ctrl+X)') + b('copy', '📄', 'Copy (Ctrl+C)') + '<span class="gl">Clipboard</span></div>' +
      '<div class="wl-grp fnt"><select class="wl-font" data-sel="font" title="Font" aria-label="font">' + FONTS.map(function (f) { return '<option value="' + f[0] + '" style="font-family:\'' + f[0] + '\'">' + f[1] + '</option>'; }).join('') + '</select><select class="wl-size" data-sel="size" title="Font size" aria-label="font size">' + SIZES.map(function (s) { return '<option value="' + s + '"' + (s === 12 ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select>' +
        b('bigger', 'A<sup>▲</sup>', 'Bigger letters') + b('smaller', 'A<sub>▼</sub>', 'Smaller letters') + '<i class="brk"></i>' + b('bold', '<b>B</b>', 'Bold (Ctrl+B)') + b('italic', '<i>I</i>', 'Italic (Ctrl+I)') + b('underline', '<u>U</u>', 'Underline (Ctrl+U)') + b('hilite', '<span class="hl">ab</span>', 'Highlight') +
        COLORS.map(function (c, i) { return b('c' + i, '<i style="background:' + c[0] + '"></i>', c[1] + ' letters', 'sw'); }).join('') + '<span class="gl">Font</span></div>' +
      '<div class="wl-grp par">' + b('insertUnorderedList', '<span class="li ul"></span>', 'Bullets') + b('insertOrderedList', '<span class="li ol"></span>', 'Numbering') + '<i class="brk"></i>' + b('justifyLeft', '<span class="al l"></span>', 'Align left') + b('justifyCenter', '<span class="al c"></span>', 'Centre') + b('justifyRight', '<span class="al r"></span>', 'Align right') + b('justifyFull', '<span class="al j"></span>', 'Justify') + '<span class="gl">Paragraph</span></div>' +
      '<div class="wl-grp ins">' + b('picture', '🖼️', 'Insert a picture') + b('table', '▦', 'Insert a table') + '<i class="brk"></i>' + b('picSmaller', '➖', 'Make the picture smaller') + b('picLarger', '➕', 'Make the picture larger') + b('picDelete', '🗑️', 'Delete the picture') + '<span class="gl">Insert</span></div>' +
      '<div class="wl-grp tbl">' + b('rowAdd', '＋ Row', 'Add a row to the table', 'tx') + b('colAdd', '＋ Column', 'Add a column to the table', 'tx') + '<i class="brk"></i>' + b('tableDelete', '🗑️ Delete table', 'Delete the table', 'tx') + '<span class="gl">Table</span></div>' +
      '<div class="wl-grp file">' + b('print', '🖨️', 'Print (Ctrl+P)') + '<span class="gl">File</span></div>' +
    '</div><div class="wl-ruler" aria-hidden="true"></div>' +
    '<div class="wl-desk"><div class="wl-page" contenteditable="true" spellcheck="false" role="textbox" aria-multiline="true" aria-label="your page"></div></div>' +
    '<div class="wl-stat"><span>Page 1 of 1</span><span class="w"></span><span class="sv">Not saved</span><span class="zm"><button type="button" data-z="-1" aria-label="zoom out">−</button><b>100%</b><button type="button" data-z="1" aria-label="zoom in">+</button></span></div></div>';
  const q = function (s) { return body.querySelector(s); }, bar = q('.wl-wrap'), page = q('.wl-page'), stat = q('.wl-stat');
  page.innerHTML = lv.html || '<div><br></div>';
  try { document.execCommand('styleWithCSS', false, true); document.execCommand('defaultParagraphSeparator', false, 'div'); } catch (e) { }
  const st = { saved: false, name: '', zoom: 100, clip: null };
  const base = parseFloat(getComputedStyle(page).fontSize);   // this is "12 point" on the page

  /* ---------- reading the page (used by the steps) ---------- */
  const text = function () { return page.innerText.replace(/\u00A0/g, ' '); };
  const has = function (t) { return text().toLowerCase().replace(/\s+/g, ' ').indexOf(t.toLowerCase()) >= 0; };
  const count = function (t) { return text().toLowerCase().split(t.toLowerCase()).length - 1; };
  const lines = function () { return text().split('\n').map(function (x) { return x.trim(); }).filter(function (x) { return x; }); };
  function nodeOf(word) { const w = document.createTreeWalker(page, NodeFilter.SHOW_TEXT), lw = word.toLowerCase(); let n; while ((n = w.nextNode())) if (n.nodeValue.toLowerCase().indexOf(lw) >= 0) return n.parentElement; return null; }
  function styled(phrase, test) { const ws = phrase.split(' '), a = nodeOf(ws[0]), z = nodeOf(ws[ws.length - 1]); return !!a && !!z && test(getComputedStyle(a), a) && test(getComputedStyle(z), z); }
  const up = function (n, f) { while (n && n !== page) { if (f(n)) return true; n = n.parentElement; } return false; };   // some styles do not pass down to the letters: look up the tree
  const rgb = function (hex) { const d = document.createElement('i'); d.style.color = hex; document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; };
  const T = {
    bold: function (c) { return parseInt(c.fontWeight, 10) >= 600 || c.fontWeight === 'bold'; }, italic: function (c) { return c.fontStyle === 'italic'; },
    underline: function (c, n) { return up(n, function (x) { return /underline/.test(getComputedStyle(x).textDecorationLine || '') || x.tagName === 'U'; }); },
    size: function (pt) { return function (c) { return parseFloat(c.fontSize) >= base * pt / 12 - 0.6; }; }, font: function (re) { return function (c) { return re.test(c.fontFamily); }; },
    center: function (c) { return c.textAlign === 'center'; }, right: function (c) { return c.textAlign === 'right' || c.textAlign === 'end'; }, left: function (c) { return c.textAlign === 'left' || c.textAlign === 'start'; },
    color: function (i) { const want = rgb(COLORS[i][0]); return function (c) { return c.color === want; }; },
    hilite: function (c, n) { return up(n, function (x) { const bg = getComputedStyle(x).backgroundColor; return !!bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent'; }); }
  };
  api.doc = { text: text, has: has, count: count, lines: lines, styled: styled, T: T, page: page, st: st, given: lines(), firstLine: function (test) { const l = lines()[0]; return !!l && styled(l.split(' ')[0], test); } };

  /* ---------- the selection ---------- */
  const selIn = function () { const s = window.getSelection(); return s && s.rangeCount && page.contains(s.anchorNode) ? s : null; };
  const needSel = function () { const s = selIn(); if (!s || s.isCollapsed) { api.note('Select the words first: drag across them, or double-click a word.'); return false; } return true; };
  /* letter size: the selected words are marked, then given the new size (in points, like a real word processor) */
  function setSize(pt) {
    const s = selIn(); if (!s || s.isCollapsed) return; const px = Math.round(base * pt / 12 * 10) / 10;
    document.execCommand('styleWithCSS', false, false); document.execCommand('fontSize', false, '7'); document.execCommand('styleWithCSS', false, true);
    page.querySelectorAll('font[size="7"]').forEach(function (f) { f.removeAttribute('size'); f.style.fontSize = px + 'px'; f.style.lineHeight = '1.35'; f.querySelectorAll('[style*="font-size"]').forEach(function (n) { n.style.fontSize = ''; }); });
  }
  const nowPt = function () { const s = selIn(); if (!s) return 12; const n = s.anchorNode.nodeType === 3 ? s.anchorNode.parentElement : s.anchorNode; return Math.round(parseFloat(getComputedStyle(n).fontSize) / base * 12); };
  const nearest = function (pt) { return SIZES.reduce(function (a, x) { return Math.abs(x - pt) < Math.abs(a - pt) ? x : a; }, 12); };

  /* ---------- clipboard: the browser does the real copy; a copy is also kept here so the Paste button always works ---------- */
  function grab() { const s = selIn(); if (!s || s.isCollapsed) return; const d = document.createElement('div'); d.appendChild(s.getRangeAt(0).cloneContents()); d.querySelectorAll('.wl-bad').forEach(function (n) { n.classList.remove('wl-bad'); }); d.querySelectorAll('.wl-sel').forEach(function (n) { n.classList.remove('wl-sel'); }); st.clip = { html: d.innerHTML, text: s.toString() }; }
  page.addEventListener('copy', function () { grab(); setTimeout(function () { api.check({ t: 'copy' }); }, 0); });
  page.addEventListener('cut', function () { grab(); setTimeout(function () { changed(); api.check({ t: 'cut' }); }, 0); });
  page.addEventListener('paste', function (e) {
    e.preventDefault(); const t = (e.clipboardData || window.clipboardData).getData('text/plain');
    try { if (st.clip && st.clip.text === t) document.execCommand('insertHTML', false, st.clip.html); else document.execCommand('insertText', false, t); } catch (x) { }
    setTimeout(function () { api.check({ t: 'paste' }); }, 0);
  });
  function pasteBtn() {
    page.focus();
    if (st.clip) { document.execCommand('insertHTML', false, st.clip.html); changed(); api.check({ t: 'paste' }); return; }
    if (navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then(function (t) { if (t) { page.focus(); document.execCommand('insertText', false, t); changed(); api.check({ t: 'paste' }); } else api.note('Copy or cut some words first.'); }, function () { api.note('Copy or cut some words first, or press Ctrl+V.'); });
    else api.note('Copy or cut some words first.');
  }

  /* ---------- pictures and tables ---------- */
  const MAXPICS = 6; let selImg = null, internalDrag = false;
  /* the picture library and the Word file maker are fetched the first time they are needed (the levels that use them fetch them before they start) */
  function withFiles(then) {
    if (CC.clipart && CC.docfile && CC.docsafe && CC.docx) { then(); return; }
    if (!CC.loadFiles) { api.note('That could not be loaded. Please reload the page and try again.'); return; }
    api.note('Getting ready...');
    CC.loadFiles(NEEDS).then(function () { if (page.isConnected) { api.note(''); then(); } }, function (e) { console.error(e); api.note('That could not be loaded. Check the connection and try again.'); });
  }
  const selectNode = function (n) { const r = document.createRange(); r.selectNode(n); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); };
  const caretIn = function (n) { const r = document.createRange(); r.selectNodeContents(n); r.collapse(true); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); page.focus(); };
  const imgHtml = function (src, w, h, alt, w0) { return '<img src="' + src + '" width="' + w + '" height="' + h + '" alt="' + L.esc(alt) + '" data-w0="' + w0 + '">'; };
  function insertPicture(p, name) {
    if (!CC.docfile.parseDataImage(p.src)) return;                       // only a real PNG, made by this site's own clip-art library
    const w = Math.min(p.w, 240), h = Math.max(1, Math.round(p.h * w / p.w)); page.focus(); restore();
    document.execCommand('insertHTML', false, imgHtml(p.src, w, h, name, w)); changed(); api.check({ t: 'picture' });
  }
  function pictureDialog() {
    if (body.querySelector('.wl-prev')) return; remember();
    withFiles(function () {
      if (page.querySelectorAll('img').length >= MAXPICS) { api.note('This page can hold up to ' + MAXPICS + ' pictures.'); return; }
      const cats = CC.clipart.cats(); let cur = cats[0].id, busy = false;
      const ov = dialog('<div class="wl-dlg wl-clip" role="dialog" aria-modal="true" aria-label="Choose a picture"><h4>🖼️ Choose a picture</h4><div class="wl-ctabs"></div><div class="wl-cgrid"></div><div class="row"><button type="button" class="btn" data-a="x">Cancel</button></div></div>');
      const tabs = ov.querySelector('.wl-ctabs'), grid = ov.querySelector('.wl-cgrid'), close = function () { ov.remove(); page.focus(); };
      function draw() {
        tabs.textContent = ''; grid.textContent = '';
        cats.forEach(function (c) { const b = L.el('button', 'btn' + (c.id === cur ? ' primary' : '')); b.type = 'button'; b.textContent = c.icon + ' ' + c.name; b.addEventListener('click', function () { cur = c.id; draw(); const on = tabs.querySelector('.primary'); if (on) on.focus(); }); tabs.appendChild(b); });
        CC.clipart.items(cur).forEach(function (it) {
          const b = L.el('button', 'wl-cit'), im = document.createElement('img'), sp = document.createElement('span'); b.type = 'button'; b.title = it.name; b.setAttribute('aria-label', it.name); im.alt = ''; sp.textContent = it.name; b.append(im, sp); grid.appendChild(b);
          CC.clipart.png(it.id, 120).then(function (p) { im.src = p.src; }, function () { });
          b.addEventListener('click', function () { if (busy) return; busy = true; CC.clipart.png(it.id, 300).then(function (p) { ov.remove(); insertPicture(p, it.name); }, function () { busy = false; api.note('That picture could not be added.'); }); });
        });
      }
      draw(); ov.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } });
      ov.querySelector('[data-a="x"]').addEventListener('click', close); const first = tabs.querySelector('button'); if (first) first.focus();
    });
  }
  function pictureOp(cmd) {
    const img = selImg && page.contains(selImg) ? selImg : null;
    if (!img) { api.note('Click the picture first. Then use the size buttons.'); return; }
    const src = img.getAttribute('src'), at = Array.prototype.indexOf.call(page.querySelectorAll('img'), img);
    if (!CC.docfile || !CC.docfile.parseDataImage(src)) return;
    page.focus(); selectNode(img);                                       // the browser's own editing commands are used, so Undo takes the change back
    if (cmd === 'picDelete') { document.execCommand('delete', false, null); selImg = null; }
    else {
      const w = parseInt(img.getAttribute('width'), 10) || 120, h = parseInt(img.getAttribute('height'), 10) || 120, w0 = parseInt(img.getAttribute('data-w0'), 10) || w;
      const nw = Math.max(40, Math.min(560, Math.round(w * (cmd === 'picLarger' ? 1.25 : 0.8)))), nh = Math.max(1, Math.round(h * nw / w));
      document.execCommand('insertHTML', false, imgHtml(src, nw, nh, img.alt, w0));
      const now = page.querySelectorAll('img')[at]; selImg = now || null; if (now) now.classList.add('wl-sel');
    }
    changed(); api.check({ t: 'picture' });
  }
  page.addEventListener('click', function (e) { if (selImg) selImg.classList.remove('wl-sel'); selImg = e.target && e.target.nodeName === 'IMG' ? e.target : null; if (selImg) selImg.classList.add('wl-sel'); });

  function tableDialog() {
    if (body.querySelector('.wl-prev')) return; remember();
    const ov = dialog('<div class="wl-dlg" role="dialog" aria-modal="true" aria-label="Choose the size of the table"><h4>▦ Choose the size of the table</h4><div class="wl-tpick"></div><p class="wl-tlab">Move over the squares</p><div class="row"><button type="button" class="btn" data-a="x">Cancel</button></div></div>');
    const g = ov.querySelector('.wl-tpick'), lab = ov.querySelector('.wl-tlab'), close = function () { ov.remove(); page.focus(); };
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) { const b = L.el('button', 'wl-tc'); b.type = 'button'; b.dataset.r = r; b.dataset.c = c; b.setAttribute('aria-label', (c + 1) + ' columns and ' + (r + 1) + ' rows'); g.appendChild(b); }
    const show = function (r, c) { g.querySelectorAll('.wl-tc').forEach(function (b) { b.classList.toggle('on', +b.dataset.r <= r && +b.dataset.c <= c); }); lab.textContent = (c + 1) + ' columns × ' + (r + 1) + ' rows'; };
    ['mouseover', 'focusin'].forEach(function (ev) { g.addEventListener(ev, function (e) { const b = e.target.closest('.wl-tc'); if (b) show(+b.dataset.r, +b.dataset.c); }); });
    g.addEventListener('click', function (e) { const b = e.target.closest('.wl-tc'); if (b) { ov.remove(); insertTable(+b.dataset.r + 1, +b.dataset.c + 1); } });
    ov.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } });
    ov.querySelector('[data-a="x"]').addEventListener('click', close); g.firstChild.focus();
  }
  function insertTable(rows, cols) {
    page.focus(); restore(); const sl = selIn(); let at = sl ? sl.anchorNode : null; while (at && at.parentNode !== page) at = at.parentNode;       // the table goes after the line (or table) that holds the cursor
    const t = document.createElement('table'), tb = document.createElement('tbody'), tail = document.createElement('div'); t.setAttribute('data-bd', 'grid'); t.appendChild(tb); tail.appendChild(document.createElement('br'));
    for (let r = 0; r < rows; r++) { const tr = document.createElement('tr'); for (let c = 0; c < cols; c++) { const td = document.createElement('td'); td.appendChild(document.createElement('br')); tr.appendChild(td); } tb.appendChild(tr); }
    if (at) { page.insertBefore(t, at.nextSibling); page.insertBefore(tail, t.nextSibling); } else { page.appendChild(t); page.appendChild(tail); }
    caretIn(t.querySelector('td')); changed(); api.check({ t: 'table' });
  }
  const cellNow = function () { const sl = selIn(); if (!sl) return null; const n = sl.anchorNode, e = n.nodeType === 1 ? n : n.parentElement; return e ? e.closest('td') : null; };
  function tableOp(cmd, toFirst) {
    const c = cellNow(); if (!c) { api.note('Click inside the table first.'); return; }
    const row = c.parentElement, t = c.closest('table'), idx = Array.prototype.indexOf.call(row.cells, c), blank = function () { const td = document.createElement('td'); td.appendChild(document.createElement('br')); return td; };
    if (cmd === 'rowAdd') { if (t.rows.length >= 20) { api.note('A table here can have up to 20 rows.'); return; } const nr = document.createElement('tr'); for (let i = 0; i < row.cells.length; i++) nr.appendChild(blank()); row.parentNode.insertBefore(nr, row.nextSibling); caretIn(nr.cells[toFirst ? 0 : idx]); }
    else if (cmd === 'colAdd') { if (row.cells.length >= 8) { api.note('A table here can have up to 8 columns.'); return; } Array.prototype.forEach.call(t.rows, function (r) { r.insertBefore(blank(), r.cells[idx + 1] || null); }); caretIn(row.cells[idx + 1]); }
    else { t.remove(); if (!page.firstElementChild) page.innerHTML = '<div><br></div>'; page.focus(); }
    changed(); api.check({ t: 'table' });
  }
  function tabIn(c, back) {                               // TAB: the next cell. SHIFT + TAB: the cell before. TAB in the last cell adds a row.
    const cells = Array.prototype.slice.call(c.closest('table').querySelectorAll('td')), i = cells.indexOf(c);
    if (!back && i === cells.length - 1) { tableOp('rowAdd', true); return; }
    const n = cells[i + (back ? -1 : 1)]; if (n) caretIn(n);
  }
  /* the page takes plain text from outside; moving something inside the page is the browser's own job */
  page.addEventListener('dragstart', function () { internalDrag = true; }); page.addEventListener('dragend', function () { internalDrag = false; });
  page.addEventListener('drop', function (e) { if (internalDrag) { setTimeout(changed, 0); return; } e.preventDefault(); const t = e.dataTransfer && e.dataTransfer.getData('text/plain'); if (t) { try { document.execCommand('insertText', false, t.slice(0, 5000)); } catch (x) { } changed(); } });

  /* ---------- save (a real file) and print (the real page) ---------- */
  function clean() {                                      // a copy of the page without the editing marks (the red wavy lines, the blue picture frame)
    const t = document.createElement('template'); t.innerHTML = page.innerHTML;
    t.content.querySelectorAll('.wl-bad').forEach(function (n) { n.classList.remove('wl-bad'); }); t.content.querySelectorAll('.wl-sel').forEach(function (n) { n.classList.remove('wl-sel'); });
    const d = document.createElement('div'); d.appendChild(t.content); return d.innerHTML;
  }
  function forFile() {                                    // the page as a file: sizes in points, and the page's own font for text that has none
    const t = document.createElement('template'); t.innerHTML = clean();
    t.content.querySelectorAll('[style*="font-size"]').forEach(function (n) { const m = /^([\d.]+)px$/.exec(n.style.fontSize); if (m) n.style.fontSize = Math.round(parseFloat(m[1]) / base * 24) / 2 + 'pt'; });
    t.content.querySelectorAll(':scope > *, td').forEach(function (n) { if (!n.style.fontFamily) n.style.fontFamily = 'Georgia'; });
    const d = document.createElement('div'); d.appendChild(t.content); return d.innerHTML;
  }
  function saveFile(name) {                               // a real Word file (.docx), made from the cleaned copy of the page
    const DFl = CC.docfile, prev = DFl.noDownload; if (api.noDownload) DFl.noDownload = true;
    const end = function (ok) { DFl.noDownload = prev; if (!ok) api.note('The file could not be saved.'); };
    try { CC.docx.saveDocx(CC.docsafe.fragment(forFile()), name, { page: 'a4' }).then(function () { end(true); }, function () { end(false); }); } catch (e) { end(false); }
  }
  function dialog(html) { const ov = L.el('div', 'wl-prev', html); body.appendChild(ov); return ov; }
  function saveDialog() {
    const ov = dialog('<div class="wl-dlg"><h4>💾 Save your document</h4><label>File name<input type="text" maxlength="30" value="' + L.esc(st.name || 'My letter') + '"></label><p>The file is saved in the Downloads folder as a Word document (.docx). It opens in Word, LibreOffice Writer and Google Docs.</p><div class="row"><button type="button" class="btn primary" data-a="save">Save</button><button type="button" class="btn" data-a="x">Cancel</button></div></div>');
    const inp = ov.querySelector('input'); inp.focus(); inp.select();
    const done = function (ok) {
      if (ok) { st.name = (inp.value.trim() || 'My letter').replace(/[\\/:*?"<>|]+/g, ' '); st.saved = true; q('.wl-title .nm').textContent = st.name; stat.querySelector('.sv').textContent = 'Saved ✔';
        withFiles(function () { saveFile(st.name); });
        L.sfx('good'); }
      ov.remove(); page.focus(); if (ok) api.check({ t: 'save' });
    };
    inp.addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Enter') done(true); else if (e.key === 'Escape') done(false); });
    ov.querySelector('[data-a="save"]').addEventListener('click', function () { done(true); }); ov.querySelector('[data-a="x"]').addEventListener('click', function () { done(false); });
  }
  function printDialog() {
    const ov = dialog('<div class="pg"></div><div class="row"><button type="button" class="btn primary" data-a="print">🖨 Print</button><button type="button" class="btn" data-a="x">✖ Close</button></div>');
    ov.querySelector('.pg').innerHTML = clean();
    ov.querySelector('[data-a="print"]').addEventListener('click', function () {
      const pp = L.el('div', 'wl-printpage', clean()); document.body.appendChild(pp); document.body.classList.add('wl-print');
      const sheetCss = L.el('style'); sheetCss.textContent = '@media print{@page{size:A4 portrait;margin:0}}'; document.head.appendChild(sheetCss);
      const end = function () { document.body.classList.remove('wl-print'); pp.remove(); sheetCss.remove(); window.removeEventListener('afterprint', end); }; window.addEventListener('afterprint', end);
      try { if (!api.noDownload) window.print(); } catch (e) { } setTimeout(end, 1500); api.check({ t: 'print' });
    });
    ov.querySelector('[data-a="x"]').addEventListener('click', function () { ov.remove(); page.focus(); api.check({ t: 'preview' }); });
  }

  /* ---------- the ribbon ---------- */
  function run(cmd) {
    if (cmd === 'save') { saveDialog(); return; } if (cmd === 'print') { printDialog(); return; }
    if (cmd === 'picture') { pictureDialog(); return; } if (cmd === 'table') { tableDialog(); return; }
    if (cmd === 'picSmaller' || cmd === 'picLarger' || cmd === 'picDelete') { pictureOp(cmd); return; }
    if (cmd === 'rowAdd' || cmd === 'colAdd' || cmd === 'tableDelete') { tableOp(cmd); return; }
    if (cmd === 'paste') { pasteBtn(); return; }
    page.focus();
    try {
      if (/^c\d$/.test(cmd)) { if (needSel()) document.execCommand('foreColor', false, COLORS[+cmd[1]][0]); }
      else if (cmd === 'hilite') { if (needSel()) { const s = selIn(), n = s.anchorNode.nodeType === 3 ? s.anchorNode.parentElement : s.anchorNode, on = T.hilite(null, n); if (!document.execCommand('hiliteColor', false, on ? 'transparent' : HILITE)) document.execCommand('backColor', false, on ? 'transparent' : HILITE); } }
      else if (cmd === 'bigger' || cmd === 'smaller') { if (needSel()) { const i = SIZES.indexOf(nearest(nowPt())); setSize(SIZES[Math.max(0, Math.min(SIZES.length - 1, i + (cmd === 'bigger' ? 1 : -1)))]); } }
      else if (cmd === 'bold' || cmd === 'italic' || cmd === 'underline') { if (needSel()) document.execCommand(cmd, false, null); }
      else if (cmd === 'copy' || cmd === 'cut') { if (needSel() && !document.execCommand(cmd, false, null)) { grab(); if (cmd === 'cut') document.execCommand('delete', false, null); changed(); api.check({ t: cmd }); return; } }   /* a browser that blocks the clipboard still copies inside this page */
      else document.execCommand(cmd, false, null);
    } catch (e) { }
    changed(); if (cmd === 'undo' || cmd === 'redo') api.check({ t: cmd });
  }
  bar.querySelectorAll('[data-cmd]').forEach(function (btn) {
    btn.addEventListener('mousedown', function (e) { e.preventDefault(); });   // keeps the words selected
    btn.addEventListener('click', function () { if (!api.st.locked) run(btn.dataset.cmd); });
  });
  q('.wl-font').addEventListener('change', function (e) { if (api.st.locked) return; page.focus(); restore(); if (needSel()) { document.execCommand('fontName', false, e.target.value); changed(); } });
  q('.wl-size').addEventListener('change', function (e) { if (api.st.locked) return; page.focus(); restore(); if (needSel()) { setSize(+e.target.value); changed(); } });
  /* a list box takes the selection away from the page: remember it, and put it back */
  let saved = null; const remember = function () { const s = selIn(); if (s) saved = s.getRangeAt(0).cloneRange(); };
  const restore = function () { if (!saved || !page.contains(saved.commonAncestorContainer)) return; const s = window.getSelection(); s.removeAllRanges(); s.addRange(saved); };
  bar.querySelectorAll('select').forEach(function (s) { s.addEventListener('mousedown', remember); s.addEventListener('focus', remember); });
  stat.querySelectorAll('[data-z]').forEach(function (z) { z.addEventListener('click', function () { st.zoom = Math.max(60, Math.min(180, st.zoom + 20 * +z.dataset.z)); page.style.zoom = st.zoom / 100; stat.querySelector('.zm b').textContent = st.zoom + '%'; }); });

  function marks() {
    const inPage = !!selIn();
    ['bold', 'italic', 'underline', 'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull', 'insertUnorderedList', 'insertOrderedList'].forEach(function (c) { let on = false; try { on = inPage && document.queryCommandState(c); } catch (e) { } const x = bar.querySelector('[data-cmd="' + c + '"]'); if (x) x.classList.toggle('on', on); });
    if (inPage) { const s = selIn(), n = s.anchorNode.nodeType === 3 ? s.anchorNode.parentElement : s.anchorNode, c = getComputedStyle(n); q('.wl-size').value = String(nearest(nowPt())); const f = FONTS.filter(function (x) { return c.fontFamily.replace(/["']/g, '').toLowerCase().indexOf(x[0].toLowerCase()) === 0; })[0]; if (f) q('.wl-font').value = f[0]; bar.querySelector('[data-cmd="hilite"]').classList.toggle('on', T.hilite(null, n)); }
  }
  function changed() {
    if (api.st.locked) ahead = true; else typed = true;
    page.querySelectorAll('.wl-bad').forEach(function (n) { if (n.textContent !== n.dataset.w) n.classList.remove('wl-bad'); });
    if (!page.firstChild) page.innerHTML = '<div><br></div>';
    const t = text().trim(), words = t ? t.split(/\s+/).length : 0; stat.querySelector('.w').textContent = words + (words === 1 ? ' word' : ' words');
    if (st.saved) { st.saved = false; stat.querySelector('.sv').textContent = 'Not saved'; }
    marks(); bar.querySelectorAll('.glow').forEach(function (n) { n.classList.remove('glow'); }); api.check({ t: 'edit' }); pauseSoon();
  }
  /* The Year 2 and 3 lessons: when typing stops for a moment, a step that waits for the learner's own words (free) is checked,
     and then a step with a coach() may give one gentle, specific hint (read aloud in Year 2). A hint is only about this step's
     typing: none shows until the learner has typed in the step (or typed ahead while the step before was finishing). */
  let settleT = 0, hintT = 0, hinted = false, spoken = '', typed = false, ahead = false;
  function pauseSoon() {
    clearTimeout(settleT); clearTimeout(hintT);
    const s = api.step ? api.step() : null; if (!s || !(s.free || s.coach) || api.st.locked) return;
    if (hinted) { hinted = false; api.note(s.sub || ''); }                           // typing again: the step's own line comes back
    const live = function () { return page.isConnected && !api.st.dead && !api.st.locked && api.step() === s && !CC.ui.active; };
    const settle = s.settle || 1800;
    if (s.free) settleT = setTimeout(function () { if (live()) api.check({ t: 'pause' }); }, settle);   // (also while the save window is open: a quick CTRL + S must not leave the step waiting)
    if (s.coach && typed) hintT = setTimeout(function () {
      if (!live() || body.querySelector('.wl-prev')) return; let msg = ''; try { msg = s.coach(api) || ''; } catch (e) { console.error(e); }
      if (!msg) return; hinted = true; api.hint(msg); if (year <= 2 && msg !== spoken) { spoken = msg; L.say(msg); }
    }, Math.max(s.coachAfter || 2800, settle + 1000));
  }
  page.addEventListener('input', changed); page.addEventListener('keyup', marks); page.addEventListener('mouseup', function () { setTimeout(marks, 0); });
  page.addEventListener('keydown', function (e) {
    if (e.key === 'Tab') { const c = cellNow(); if (c) { e.preventDefault(); tabIn(c, e.shiftKey); return; } }
    const k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey; if (!mod) return;
    if (k === 's') { e.preventDefault(); saveDialog(); } else if (k === 'p') { e.preventDefault(); printDialog(); }
    else if (k === 'z' || k === 'y') setTimeout(function () { changed(); api.check({ t: k === 'z' && !e.shiftKey ? 'undo' : 'redo' }); }, 0);
  });
  /* a spelling mistake: right-click it for the right spelling, as in a real word processor */
  let menu = null; const closeMenu = function () { if (menu) { menu.remove(); menu = null; } };
  page.addEventListener('contextmenu', function (e) {
    const w = e.target.closest ? e.target.closest('.wl-bad') : null; if (!w) return; e.preventDefault(); closeMenu();
    menu = L.el('div', 'wl-menu', '<button type="button" data-a="fix"><b>' + L.esc(w.dataset.fix) + '</b></button><button type="button" data-a="skip">Ignore</button>'); const r = body.getBoundingClientRect();
    menu.style.left = Math.min(r.width - 150, e.clientX - r.left) + 'px'; menu.style.top = (e.clientY - r.top + 6) + 'px'; body.appendChild(menu);
    menu.addEventListener('mousedown', function (x) { x.preventDefault(); });
    menu.querySelector('[data-a="fix"]').addEventListener('click', function () { const rg = document.createRange(); rg.selectNodeContents(w); const s = window.getSelection(); s.removeAllRanges(); s.addRange(rg); page.focus(); document.execCommand('insertText', false, w.dataset.fix); closeMenu(); changed(); });
    menu.querySelector('[data-a="skip"]').addEventListener('click', function () { w.classList.remove('wl-bad'); closeMenu(); });
  });
  body.addEventListener('mousedown', function (e) { if (menu && !menu.contains(e.target)) closeMenu(); });

  api.onTip = function (s) { bar.querySelectorAll('.glow').forEach(function (n) { n.classList.remove('glow'); }); if (s.btn) [].concat(s.btn).forEach(function (c) { const x = bar.querySelector('[data-cmd="' + c + '"], [data-sel="' + c + '"]'); if (x) x.classList.add('glow'); }); };
  api.onStep = function () { bar.querySelectorAll('.glow').forEach(function (n) { n.classList.remove('glow'); }); hinted = false; spoken = ''; typed = ahead; ahead = false; setTimeout(function () { api.check({ t: 'step' }); pauseSoon(); }, 80); };
  api.doc.run = run; api.doc.setSize = setSize;
  /* what the steps look at: pictures and tables */
  const D = api.doc, firstCell = function (r, c) { const t = page.querySelector('table'); return t && t.rows[r] && t.rows[r].cells[c] ? t.rows[r].cells[c] : null; };
  D.pics = function () { return Array.prototype.slice.call(page.querySelectorAll('img')); };
  D.table = function () { return page.querySelector('table'); };
  D.cellText = function (r, c) { const x = firstCell(r, c); return x ? x.textContent.replace(/\s+/g, ' ').trim() : ''; };
  D.rowsFilled = function (n) { const t = page.querySelector('table'); if (!t || t.rows.length < n) return false; return Array.prototype.every.call(t.rows, function (row) { return row.cells.length >= 2 && row.cells[0].textContent.trim() !== '' && row.cells[1].textContent.trim() !== ''; }); };
  D.cellStyled = function (r, c, test) { const x = firstCell(r, c); if (!x) return false; const n = document.createTreeWalker(x, NodeFilter.SHOW_TEXT).nextNode(); return !!n && test(getComputedStyle(n.parentElement), n.parentElement); };
  D.picGrew = function () { return D.pics().some(function (im) { const w0 = parseInt(im.getAttribute('data-w0'), 10); return w0 > 0 && (parseInt(im.getAttribute('width'), 10) || 0) >= w0 * 1.2; }); };
  D.picBlock = function () { const p = page.querySelector('img'); let b = p ? p.parentElement : null; while (b && b !== page && getComputedStyle(b).display === 'inline') b = b.parentElement; return b && b !== page ? b : null; };
  D.picCentred = function () { const b = D.picBlock(); return !!b && getComputedStyle(b).textAlign === 'center'; };
  D.afterPicWords = function () { const p = page.querySelector('img'); if (!p || !page.lastChild) return 0; const r = document.createRange(); r.setStartAfter(p); r.setEndAfter(page.lastChild); const t = r.toString().replace(/\s+/g, ' ').trim(); return t ? t.split(' ').length : 0; };
  changed(); st.saved = false; setTimeout(function () { if (page.isConnected && !lv.html) page.focus(); }, 100);
}

/* ---------- the lessons (shown before each level) ---------- */
const keysArt = function (list) { return '<div class="ls-row">' + list.map(function (k) { return '<div class="ls-card"><span class="ls-key">' + k[0] + '</span>' + k[1] + '</div>'; }).join('') + '</div>'; };
const cards = function (list) { return '<div class="ls-row">' + list.map(function (k) { return '<div class="ls-card"><span class="ic">' + k[0] + '</span>' + k[1] + '</div>'; }).join('') + '</div>'; };
const pageArt = function (html) { return '<div class="ls-page">' + html + '</div>'; };
const slide = function (h, p, art, say) { return { h: h, p: p, art: art, say: say ? h + '. ' + say : '' }; };   // say: what is read aloud, when the written lines hold symbols
const TEACH = {
  type: [slide('What is a word processor?', ['A word processor is a program for creating text documents.', 'Documents include letters, reports and posters.', 'The text can be edited, saved and printed.'], pageArt('<p>Dear Sam,</p><p>Thank you for the book.</p><p>From Tom<i class="cur"></i></p>')),
    slide('The cursor', ['The thin blinking line is the cursor, also called the insertion point.', 'Typed characters appear at the position of the cursor.', 'Click in the text to move the cursor there.'], pageArt('<p>Dear Sa<i class="cur"></i></p>')),
    slide('Four essential keys', ['SHIFT with a letter key produces a capital letter.', 'The SPACE bar inserts a space between words.', 'ENTER starts a new line. BACKSPACE deletes the character to its left.'], keysArt([['Shift', 'capital letter'], ['Space', 'a space'], ['Enter', 'new line'], ['⌫', 'delete left']]))],
  fix: [slide('Correcting mistakes', ['Click beside the mistake to place the cursor there.', 'BACKSPACE deletes the character BEFORE (to the left of) the cursor.', 'DELETE deletes the character AFTER (to the right of) the cursor.'], keysArt([['⌫', 'character before'], ['Delete', 'character after']])),
    slide('Spelling check', ['A red wavy underline marks a possible spelling error.', 'Right-click the word to see suggested corrections.', 'Click the correct spelling to replace the word.'], pageArt('<p>My <u class="bad">scool</u> is big.</p>'))],
  style: [slide('Select, then format', ['To format text, select it first.', 'Double-click selects one word. Press and drag to select several words.', 'Selected text is highlighted in blue.'], pageArt('<p>My <mark>Pet</mark></p><p>I have a dog.</p>')),
    slide('Bold, italic, underline', ['B applies bold: thicker, darker characters.', 'I applies italic: slanted characters.', 'U applies underline: a line beneath the characters.'], pageArt('<p><b>Bold</b> &nbsp; <i>Italic</i> &nbsp; <u>Underline</u></p>'))],
  font: [slide('Font and size', ['A font is the design of the letters.', 'Size is measured in points. 12 pt is a standard body size and 24 pt is large.', 'Select the text first, then choose the font or size.'], pageArt('<p style="font-family:Comic Sans MS;font-size:1.7em">Party Time</p><p style="font-size:.8em">small</p>')),
    slide('Colour and highlight', ['Font colour changes the colour of the letters themselves.', 'Highlight colours the background behind the letters, like a highlighter pen.', 'Use both sparingly, to draw attention to key words.'], pageArt('<p>on <span style="color:#e02f44">Saturday</span></p><p><span style="background:#fff27a">Bring a friend!</span></p>'))],
  layout: [slide('Alignment', ['Left alignment is the standard for body text.', 'Centre alignment suits titles.', 'Right alignment suits a name or a date.'], pageArt('<p style="text-align:center"><b>Title</b></p><p>Writing on the left.</p><p style="text-align:right">From Alex</p>')),
    slide('Lists', ['Bullets present items that have no set order.', 'Numbers present items in a sequence: 1, 2, 3.', 'Select the lines, then click the list button.'], pageArt('<ul><li>A hat</li><li>A game</li><li>A big smile</li></ul>'))],
  copy: [slide('Copy, cut and paste', ['COPY duplicates the selection. The original stays in place.', 'CUT removes the selection so that it can be moved.', 'PASTE inserts the copied or cut text at the cursor.'], keysArt([['Ctrl+C', 'copy'], ['Ctrl+X', 'cut'], ['Ctrl+V', 'paste']])),
    slide('The clipboard and undo', ['Copied or cut text is held temporarily on the clipboard.', 'The clipboard cannot be seen, but it stores the selection until it is replaced.', 'Ctrl+Z undoes the last action. Use it to reverse a mistake.', 'On a Mac, press the Command key instead of Ctrl.'], keysArt([['Ctrl+Z', 'undo'], ['Ctrl+Y', 'redo']]))],
  save: [slide('Why save?', ['Until it is saved, your work is held only in temporary memory and can be lost.', 'Saving stores it as a file with a name.', 'Save regularly: Ctrl+S.'], cards([['💾', 'Save'], ['📁', 'a named file']])),
    slide('Print preview', ['Print preview shows how the page will look on paper.', 'Check it before printing to avoid wasting paper and ink.', 'Ctrl+P opens it.'], cards([['🖨️', 'Print'], ['👀', 'preview']]))],
  picture: [slide('Pictures in a document', ['A picture can be inserted into a document to illustrate the text.', 'Clip art is a collection of ready-made pictures that can be inserted without drawing them.', 'Click where the picture should go, then choose it from the collection.'], cards([['🖼️', 'insert a picture'], ['🎨', 'clip art']])),
    slide('Size and position', ['An inserted picture sits in the line of text, like one very large character.', 'To change its size, click the picture to select it, then use the size buttons. The proportions are kept, so the picture is not stretched.', 'The alignment buttons place the picture on the left, in the centre or on the right.'], pageArt('<p style="text-align:center"><span class="ls-pic">🐱</span></p><p style="text-align:center"><i>centred</i></p>')),
    slide('Captions', ['A caption is a short line of text that explains a picture.', 'It is usually placed directly below the picture.', 'Press ENTER after the picture, then type the caption.'], pageArt('<p style="text-align:center"><span class="ls-pic">🐱</span></p><p style="text-align:center"><i>A cat asleep in the sun</i></p>'))],
  table: [slide('What is a table?', ['A table arranges information in rows and columns.', 'A row runs across the page. A column runs down the page.', 'Each box where a row and a column meet is a cell, and each cell holds its own text.'], pageArt('<table><tr><td><b>Pet</b></td><td><b>Name</b></td></tr><tr><td>Cat</td><td>Mia</td></tr></table>')),
    slide('Working in a table', ['Click a cell to place the cursor in it, then type.', 'The TAB key moves the cursor to the next cell. In the last cell, TAB adds a new row.', 'The Table buttons add a row or a column, or delete the table.'], keysArt([['Tab', 'next cell'], ['Shift+Tab', 'previous cell']])),
    slide('Headings in a table', ['The first row usually holds headings that describe each column.', 'Making the headings bold helps the reader to find information quickly.'], pageArt('<table><tr><td><b>Pet</b></td><td><b>Name</b></td></tr><tr><td>Cat</td><td>Mia</td></tr><tr><td>Dog</td><td>Rex</td></tr></table>'))],
  own: [slide('The structure of a letter', ['A title at the top.', 'A greeting: Dear, a name and a comma.', 'The body text, then a closing: From and your name.'], pageArt('<p style="text-align:center"><b>My News</b></p><p>Dear Sam,</p><p>I have a new bike. It is red.</p><p style="text-align:right">From Tom</p>'))]
};
/* ---------- the levels for Years 4 to 6: each one builds on the one before ----------
   1 typing   2 correcting mistakes   3 selecting words: bold, italic, underline   4 font, size and colour   5 lining up the page and lists
   6 pictures   7 tables   8 copy, cut and paste   9 save and print   10 a whole letter alone */
const SELECT = ['Select the words: double-click a word, or press and drag across the words.', 'The words turn blue.'];
const bad = function (w, fix) { return '<span class="wl-bad" data-w="' + w + '" data-fix="' + fix + '">' + w + '</span>'; };
const d = function (api) { return api.doc; };
/* the picture library and the Word file maker: the levels that use them fetch them before they start; any other level fetches them if they are needed */
const NEEDS = ['js/docfile.js', 'js/docsafe.js', 'js/clipart.js', 'js/docx.js'], NEEDS_BY = ['picture', 'save', 'own'];
const LEVELS = [
  { id: 'type', title: 'Type a letter', icon: '✉️', min: 4, learned: 'You typed a letter with capital letters, a comma and new lines.',
    steps: [
      { say: 'Click on the page and type:  Dear Sam,', sub: 'Hold SHIFT for the capital letters', win: 'A good start!', tip: ['Click on the white page.', 'Hold SHIFT and press D for a capital D. Do the same for S.', 'The comma key is next to the M key.'], ok: function (e, a) { return d(a).has('dear sam,'); } },
      { say: 'Press ENTER to start a new line', win: 'A new line!', tip: ['Find the big ENTER key on the right of the keyboard.', 'Press it once.'], ok: function (e, a) { return d(a).has('dear sam') && d(a).page.children.length >= 2; } },
      { say: 'Type:  Thank you for the book.', sub: 'End the sentence with a full stop', win: 'A whole sentence!', tip: ['Start with a capital T: hold SHIFT and press T.', 'Press the long SPACE bar between words.', 'The full stop key is two keys right of M.'], ok: function (e, a) { return d(a).has('thank you for the book.'); } },
      { say: 'Start a new line. Type  From  and then your name.', win: 'Your letter is finished!', tip: ['Press ENTER for a new line.', 'Type From, press SPACE, then type your name.'], ok: function (e, a) { return /from\s+\S{2,}/i.test(d(a).lines().slice(-1)[0] || '') && d(a).lines().length >= 3; } }] },
  { id: 'fix', title: 'Fix the mistakes', icon: '🔧', min: 4, learned: 'A red wavy line means: check this spelling.',
    html: '<div>My ' + bad('scool', 'school') + ' has a big ' + bad('libary', 'library') + '.</div><div>We ' + bad('reed', 'read') + ' books every day day.</div>',
    steps: [
      { say: 'Fix the first red word. It should be  school', sub: 'Click after it, delete it with BACKSPACE, type it again', win: 'school is right!', tip: ['Click just after the red word scool.', 'Press BACKSPACE to delete letters.', 'Type the right letters: school.'], ok: function (e, a) { return d(a).has('school') && !d(a).has('scool'); } },
      { say: 'Right-click the next red word and choose the right spelling', win: 'The computer helped you spell library!', tip: ['Put the pointer on the red word libary.', 'Press the RIGHT mouse button. A small menu opens.', 'Click the word library in the menu.'], ok: function (e, a) { return d(a).has('library') && !d(a).has('libary'); } },
      { say: 'Fix  reed . We  read  books.', win: 'read is right!', tip: ['Right-click the red word and choose read.', 'Or click after it, press BACKSPACE two times, and type ad.'], ok: function (e, a) { return /\bread\b/i.test(d(a).text()) && !d(a).has('reed'); } },
      { say: 'The word  day  is there twice. Delete one.', sub: 'Double-click a word to select it, then press DELETE', win: 'No more mistakes!', tip: ['Double-click the last word day. It turns blue.', 'Press the DELETE key.'], ok: function (e, a) { return d(a).count('day') === 1 && d(a).has('every day'); } }] },
  { id: 'style', title: 'Bold, italic, underline', icon: '🅱️', min: 4, learned: 'Select the words first. Then B makes them bold, I makes them lean, U draws a line under them.',
    html: '<div>My Pet</div><div>I have a dog. His name is Rex.</div><div>He is very fast.</div>',
    steps: [
      { say: 'Make the title  My Pet  bold', sub: 'Select the words, then click B', win: 'Bold! Titles stand out.', btn: 'bold', tip: SELECT.concat('Click the B button at the top.'), ok: function (e, a) { return d(a).styled('My Pet', d(a).T.bold); } },
      { say: 'Make the name  Rex  italic', sub: 'Select the word, then click I', win: 'Italic letters lean over.', btn: 'italic', tip: ['Double-click the word Rex. It turns blue.', 'Click the I button at the top.'], ok: function (e, a) { return d(a).styled('Rex', d(a).T.italic); } },
      { say: 'Underline the words  very fast', sub: 'Select them, then click U', win: 'Underlined!', btn: 'underline', tip: ['Press just before the word very and drag to the end of fast.', 'Both words turn blue.', 'Click the U button at the top.'], ok: function (e, a) { return d(a).styled('very fast', d(a).T.underline); } },
      { say: 'Now use the keyboard: select  dog  and press CTRL + B', win: 'Ctrl+B is the quick way to make words bold.', tip: ['Double-click the word dog.', 'Hold the CTRL key, tap B, then let go.'], ok: function (e, a) { return d(a).styled('dog', d(a).T.bold); } }] },
  { id: 'font', title: 'Font, size and colour', icon: '🎨', min: 4, learned: 'The font is the shape of the letters. Size is measured in points.',
    html: '<div>Party Time</div><div>Come to my party on Saturday.</div><div>It starts at two.</div><div>Bring a friend!</div>',
    steps: [
      { say: 'Select the title and change its size to 24', sub: 'The size list is next to the font name', win: 'A big title!', btn: 'size', tip: SELECT.concat('Click the size box (it says 12) and choose 24.'), ok: function (e, a) { return d(a).styled('Party Time', d(a).T.size(24)); } },
      { say: 'Change the title font to Comic Sans', win: 'A fun font for a party.', btn: 'font', tip: ['Select the title again if it is not blue.', 'Click the font box (it says Georgia).', 'Choose Comic Sans.'], ok: function (e, a) { return d(a).styled('Party Time', d(a).T.font(/comic/i)); } },
      { say: 'Make the word  Saturday  red', sub: 'Select it, then click the red circle', win: 'Red stands out!', btn: 'c1', tip: ['Double-click the word Saturday.', 'Click the red circle at the top.'], ok: function (e, a) { return d(a).styled('Saturday', d(a).T.color(1)); } },
      { say: 'Highlight  Bring a friend!  in yellow', sub: 'Select the words, then click the highlighter', win: 'Like a real highlighter pen.', btn: 'hilite', tip: ['Drag across Bring a friend! so it turns blue.', 'Click the yellow ab button.'], ok: function (e, a) { return d(a).styled('Bring friend', d(a).T.hilite); } }] },
  { id: 'layout', title: 'Line up the page', icon: '📐', min: 4, learned: 'Centre the title, keep the writing on the left, and use bullets for a list.',
    html: '<div>Party Time</div><div>Come to my party on Saturday.</div><div>Please bring:</div><div>A hat</div><div>A game</div><div>A big smile</div><div>From Alex</div>',
    steps: [
      { say: 'Put the title  Party Time  in the centre', sub: 'Click in the title, then click Centre', win: 'Centred!', btn: 'justifyCenter', tip: ['Click anywhere in the words Party Time.', 'Click the Centre button in the Paragraph group.'], ok: function (e, a) { return d(a).styled('Party Time', d(a).T.center); } },
      { say: 'Move  From Alex  to the right side', sub: 'Click in the line, then click Align right', win: 'A name goes well on the right.', btn: 'justifyRight', tip: ['Click anywhere in the words From Alex.', 'Click the Align right button.'], ok: function (e, a) { return d(a).styled('From Alex', d(a).T.right); } },
      { say: 'Turn the three items to bring into a bullet list', sub: 'Select the three lines, then click Bullets', win: 'A neat list!', btn: 'insertUnorderedList', tip: ['Press just before A hat and drag down to the end of A big smile.', 'All three lines turn blue.', 'Click the Bullets button in the Paragraph group.'], ok: function (e, a) { return d(a).page.querySelectorAll('ul li').length >= 3; } },
      { say: 'Change the bullets to numbers', sub: 'Select the list, then click Numbering', win: '1, 2, 3!', btn: 'insertOrderedList', tip: ['Select the three lines of the list again.', 'Click the Numbering button, next to Bullets.'], ok: function (e, a) { return d(a).page.querySelectorAll('ol li').length >= 3; } }] },
  { id: 'picture', title: 'Add a picture', icon: '🖼️', min: 4, learned: 'A picture can be inserted, made larger or smaller, and centred. A caption below it explains what it shows.',
    html: '<div>My Pet Cat</div><div>Our cat sleeps in the sun all day.</div><div><br></div>',
    steps: [
      { say: 'Insert a picture on the empty line', sub: 'Click the empty line, click 🖼️, then choose a picture', win: 'The picture is in the document!', btn: 'picture', tip: ['Click on the empty line at the bottom of the page.', 'Click the 🖼️ Picture button in the Insert group.', 'Click any picture in the window.'], ok: function (e, a) { return d(a).pics().length >= 1; } },
      { say: 'Make the picture larger', sub: 'Click the picture, then click ➕', win: 'Larger, and not stretched.', btn: 'picLarger', tip: ['Click the picture. A blue frame appears around it.', 'Click the ➕ button in the Insert group.'], ok: function (e, a) { return d(a).picGrew(); } },
      { say: 'Centre the picture', sub: 'Click the picture, then click Centre', win: 'Centred, as in a book.', btn: 'justifyCenter', tip: ['Click the picture to select it.', 'Click the Centre button in the Paragraph group.'], ok: function (e, a) { return d(a).picCentred(); } },
      { say: 'Write a caption below the picture', sub: 'Press ENTER after the picture, then type at least three words', win: 'The caption tells the reader what the picture shows.', start: function (a) { d(a).st.capBase = d(a).afterPicWords(); }, tip: ['Click just after the picture, then press ENTER.', 'Type a short caption, for example: My cat asleep in the sun.'], ok: function (e, a) { return d(a).afterPicWords() >= (d(a).st.capBase || 0) + 3; } }] },
  { id: 'table', title: 'Make a table', icon: '▦', min: 5, learned: 'A table arranges information in rows and columns. TAB moves from cell to cell.',
    html: '<div>Class Pets</div><div><br></div>',
    steps: [
      { say: 'Insert a table with 2 columns and 3 rows', sub: 'Click ▦, move over the squares, then click', win: 'A table with rows and columns!', btn: 'table', tip: ['Click on the empty line under the title.', 'Click the ▦ Table button in the Insert group.', 'Move over the squares to choose 2 columns and 3 rows, then click.'], ok: function (e, a) { const t = d(a).table(); return !!t && t.rows.length >= 3 && t.rows[0].cells.length >= 2; } },
      { say: 'In the first cell type  Pet , press TAB, then type  Name', sub: 'TAB moves the cursor to the next cell', win: 'TAB moves from cell to cell.', tip: ['Click the first cell if the cursor is not in it.', 'Type Pet, then press the TAB key.', 'Type Name.'], ok: function (e, a) { return d(a).cellText(0, 0).toLowerCase() === 'pet' && d(a).cellText(0, 1).toLowerCase() === 'name'; } },
      { say: 'Fill the next two rows with a pet and its name', sub: 'Type a pet, press TAB, then type its name', win: 'Two rows are complete.', tip: ['Click the first cell of the second row.', 'Type a pet, press TAB, then type its name.', 'Do the same in the third row.'], ok: function (e, a) { return d(a).rowsFilled(3); } },
      { say: 'Add a fourth row and fill it in', sub: 'Click ＋ Row, or press TAB in the last cell', win: 'A new row!', btn: 'rowAdd', tip: ['Click in the last row.', 'Click the ＋ Row button in the Table group. Or press TAB in the last cell.', 'Type a pet, press TAB, and type its name.'], ok: function (e, a) { return d(a).rowsFilled(4); } },
      { say: 'Make the headings  Pet  and  Name  bold', sub: 'Select the word in each heading, then click B', win: 'Bold headings help the reader.', btn: 'bold', tip: ['Double-click the word Pet in the first row, then click B.', 'Double-click the word Name, then click B.'], ok: function (e, a) { return d(a).cellStyled(0, 0, d(a).T.bold) && d(a).cellStyled(0, 1, d(a).T.bold); } }] },
  { id: 'copy', title: 'Copy, cut and paste', icon: '📋', min: 4, learned: 'Copy makes another one. Cut moves it. Paste puts it down. Undo takes back a mistake.',
    html: '<div>Shopping list</div><div>Milk</div><div>Bread</div><div>Buy more: </div>',
    steps: [
      { say: 'Select the word  Milk  and copy it', sub: 'CTRL + C, or the Copy button', win: 'Copied! It is waiting on the clipboard.', btn: 'copy', tip: ['Double-click the word Milk.', 'Hold CTRL and tap C. Or click the Copy button.'], ok: function (e) { return e.t === 'copy'; } },
      { say: 'Click at the end of  Buy more:  and paste', sub: 'CTRL + V, or the Paste button', win: 'Now there are two Milks.', btn: 'paste', tip: ['Click just after the words Buy more:', 'Hold CTRL and tap V. Or click the Paste button.'], ok: function (e, a) { return d(a).count('milk') >= 2; } },
      { say: 'Select the word  Bread  and cut it', sub: 'CTRL + X, or the Cut button', win: 'Cut! Bread is on the clipboard now.', btn: 'cut', tip: ['Double-click the word Bread.', 'Hold CTRL and tap X. Or click the Cut button ✂️.'], ok: function (e, a) { return e.t === 'cut' && !d(a).has('bread'); } },
      { say: 'Click after  Shopping list  and paste the Bread there', win: 'You moved a word!', btn: 'paste', tip: ['Click at the end of the words Shopping list.', 'Hold CTRL and tap V.'], ok: function (e, a) { return d(a).has('bread'); } },
      { say: 'Press CTRL + Z to undo that', sub: 'Undo takes back your last change', win: 'Undo is your best friend.', btn: 'undo', tip: ['Hold the CTRL key, tap Z, then let go.', 'Or click the ↶ button at the very top.'], ok: function (e) { return e.t === 'undo'; } }] },
  { id: 'save', title: 'Save and print', icon: '💾', min: 4, learned: 'Save your work often. Check the page before you print.',
    html: '<div>My Holiday</div><div>I went to the lake with my family.</div>',
    steps: [
      { say: 'Add one more sentence about the holiday', win: 'Good writing!', tip: ['Click at the end of the last line.', 'Press SPACE and type a sentence. End with a full stop.'], ok: function (e, a) { return (d(a).text().match(/[.!?]/g) || []).length >= 2 && d(a).text().trim().split(/\s+/).length >= 13; } },
      { say: 'Save your work: press CTRL + S', sub: 'Give it a name, then click Save', win: 'Saved! The name is at the top now.', btn: 'save', tip: ['Hold CTRL and tap S. Or click the 💾 button at the very top.', 'Type a name for your file.', 'Click Save.'], ok: function (e) { return e.t === 'save'; } },
      { say: 'Open the print preview with the 🖨️ button', sub: 'Look at the page, then close it', win: 'Always check the page before you print.', btn: 'print', tip: ['Click the 🖨️ button in the File group. Or press CTRL + P.', 'Look at your page.', 'Click Close. (Click Print only if your teacher says so.)'], ok: function (e) { return e.t === 'preview' || e.t === 'print'; } }] },
  { id: 'own', title: 'Write your own letter', icon: '📝', min: 4, learned: 'You wrote, formatted, checked and saved a whole letter!',
    steps: [
      { say: 'Type a title for your letter. Make it bold and centred.', win: 'A proper title!', btn: ['bold', 'justifyCenter'], tip: ['Type the title on the first line.', 'Select it, then click B.', 'Click Centre.'], ok: function (e, a) { return d(a).firstLine(function (c) { return d(a).T.bold(c) && d(a).T.center(c); }); } },
      { say: 'Start with  Dear ...  then write at least 3 sentences', sub: 'Each sentence ends with a full stop', win: 'A real letter!', btn: 'justifyLeft', tip: ['Press ENTER for a new line. Click Align left and switch B off.', 'Type Dear and a name, then a comma.', 'Write 3 sentences. End each one with a full stop.'], ok: function (e, a) { const t = d(a).text(); return /dear\s+\S+/i.test(t) && (t.match(/[.!?](\s|$)/g) || []).length >= 3 && t.trim().split(/\s+/).length >= 14; } },
      { say: 'Finish with  From  and your name on the right side', win: 'Signed!', btn: 'justifyRight', tip: ['Press ENTER for a new line.', 'Type From and your name.', 'Click Align right.'], ok: function (e, a) { const l = d(a).lines().slice(-1)[0] || ''; return /^from\s+\S{2,}/i.test(l) && d(a).styled(l.split(/\s+/)[1] || 'From', d(a).T.right); } },
      { say: 'Save your letter', sub: 'CTRL + S', win: 'Saved and finished!', btn: 'save', tip: ['Hold CTRL and tap S. Or click the 💾 button at the very top.', 'Type a name and click Save.'], ok: function (e) { return e.t === 'save'; } }] }
];
LEVELS.forEach(function (lv) { lv.teach = TEACH[lv.id]; if (NEEDS_BY.indexOf(lv.id) >= 0) lv.needs = NEEDS; lv.build = function (body, api, year) { build(body, api, year, lv); }; });

/* the pieces that the Year 2 and 3 lessons (letter_young.js, loaded next) are built from */
CC.letterKit = { build: build, slide: slide, pageArt: pageArt, keysArt: keysArt, cards: cards, bad: bad, NEEDS: NEEDS };
const young = function (y) { return CC.letterYoung && CC.letterYoung[y]; };

CC.modes.letter = L.game({
  id: 'letter', icon: '📝', title: 'Type a Letter', color: '#ff7a45', cert: { hero: 'Word Wizard', art: 'letter', hue: 18 },
  sub: function (y) { return young(y) ? young(y).sub : 'A real word processor: type, fix mistakes, and make your page look great.'; },
  speak: function (y) { return y <= 2; }, voiceButton: function (y) { return y === 3; },
  stage: function () { return document.getElementById('stage-letter'); }, root: function () { return document.getElementById('letter-root'); },
  levels: function (y) { return young(y) ? young(y).levels : LEVELS.filter(function (l) { return y >= l.min; }); }
});
})();
