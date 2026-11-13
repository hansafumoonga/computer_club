/* letter.js - Type a Letter (Years 3 to 6): a small word processor that works the way real ones do (Word, Google Docs, LibreOffice Writer).
     - a ribbon: clipboard, font (name, size, bold, italic, underline, colour, highlight), paragraph (bullets, numbers, left, centre, right, justify)
     - the usual keys: Ctrl+B / I / U, Ctrl+C / X / V, Ctrl+Z / Y, Ctrl+A, Ctrl+S (save), Ctrl+P (print)
     - a red wavy line under a spelling mistake; right-click it to choose the right spelling
     - Save really saves a file that opens in a word processor, and Print really prints the page
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
  body.innerHTML = '<div class="wl-wrap"><div class="wl-title"><span class="qa">' + b('save', '💾', 'Save (Ctrl+S)') + b('undo', '↶', 'Undo (Ctrl+Z)') + b('redo', '↷', 'Redo (Ctrl+Y)') + '</span><span class="nm">Document1</span><span class="app"> - Type a Letter</span></div>' +
    '<div class="wl-bar">' +
      '<div class="wl-grp">' + b('paste', '📋', 'Paste (Ctrl+V)') + b('cut', '✂️', 'Cut (Ctrl+X)') + b('copy', '📄', 'Copy (Ctrl+C)') + '<span class="gl">Clipboard</span></div>' +
      '<div class="wl-grp"><select class="wl-font" data-sel="font" title="Font" aria-label="font">' + FONTS.map(function (f) { return '<option value="' + f[0] + '" style="font-family:\'' + f[0] + '\'">' + f[1] + '</option>'; }).join('') + '</select><select class="wl-size" data-sel="size" title="Font size" aria-label="font size">' + SIZES.map(function (s) { return '<option value="' + s + '"' + (s === 12 ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select>' +
        b('bigger', 'A<sup>▲</sup>', 'Bigger letters') + b('smaller', 'A<sub>▼</sub>', 'Smaller letters') + '<i class="brk"></i>' + b('bold', '<b>B</b>', 'Bold (Ctrl+B)') + b('italic', '<i>I</i>', 'Italic (Ctrl+I)') + b('underline', '<u>U</u>', 'Underline (Ctrl+U)') + b('hilite', '<span class="hl">ab</span>', 'Highlight') +
        COLORS.map(function (c, i) { return b('c' + i, '<i style="background:' + c[0] + '"></i>', c[1] + ' letters', 'sw'); }).join('') + '<span class="gl">Font</span></div>' +
      '<div class="wl-grp">' + b('insertUnorderedList', '<span class="li ul"></span>', 'Bullets') + b('insertOrderedList', '<span class="li ol"></span>', 'Numbering') + '<i class="brk"></i>' + b('justifyLeft', '<span class="al l"></span>', 'Align left') + b('justifyCenter', '<span class="al c"></span>', 'Centre') + b('justifyRight', '<span class="al r"></span>', 'Align right') + b('justifyFull', '<span class="al j"></span>', 'Justify') + '<span class="gl">Paragraph</span></div>' +
      '<div class="wl-grp">' + b('print', '🖨️', 'Print (Ctrl+P)') + '<span class="gl">File</span></div>' +
    '</div><div class="wl-ruler" aria-hidden="true"></div>' +
    '<div class="wl-desk"><div class="wl-page" contenteditable="true" spellcheck="false" role="textbox" aria-multiline="true" aria-label="your page"></div></div>' +
    '<div class="wl-stat"><span>Page 1 of 1</span><span class="w"></span><span class="sv">Not saved</span><span class="zm"><button type="button" data-z="-1" aria-label="zoom out">−</button><b>100%</b><button type="button" data-z="1" aria-label="zoom in">+</button></span></div></div>';
  const q = function (s) { return body.querySelector(s); }, bar = q('.wl-wrap'), page = q('.wl-page'), stat = q('.wl-stat');
  page.innerHTML = lv.html || '<div><br></div>';
  try { document.execCommand('styleWithCSS', false, true); document.execCommand('defaultParagraphSeparator', false, 'div'); } catch (e) { }
  const st = { saved: false, name: '', zoom: 100, clip: null };
  const base = parseFloat(getComputedStyle(page).fontSize);   // this is "12 point" on the page

  /* ---------- reading the page (used by the steps) ---------- */
  const text = function () { return page.innerText.replace(/ /g, ' '); };
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
    center: function (c) { return c.textAlign === 'center'; }, right: function (c) { return c.textAlign === 'right' || c.textAlign === 'end'; },
    color: function (i) { const want = rgb(COLORS[i][0]); return function (c) { return c.color === want; }; },
    hilite: function (c, n) { return up(n, function (x) { const bg = getComputedStyle(x).backgroundColor; return !!bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent'; }); }
  };
  api.doc = { text: text, has: has, count: count, lines: lines, styled: styled, T: T, page: page, st: st, firstLine: function (test) { const l = lines()[0]; return !!l && styled(l.split(' ')[0], test); } };

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
  function grab() { const s = selIn(); if (!s || s.isCollapsed) return; const d = document.createElement('div'); d.appendChild(s.getRangeAt(0).cloneContents()); d.querySelectorAll('.wl-bad').forEach(function (n) { n.classList.remove('wl-bad'); }); st.clip = { html: d.innerHTML, text: s.toString() }; }
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

  /* ---------- save (a real file) and print (the real page) ---------- */
  function clean() { const d = document.createElement('div'); d.innerHTML = page.innerHTML; d.querySelectorAll('.wl-bad').forEach(function (n) { n.classList.remove('wl-bad'); }); return d.innerHTML; }
  function dialog(html) { const ov = L.el('div', 'wl-prev', html); body.appendChild(ov); return ov; }
  function saveDialog() {
    const ov = dialog('<div class="wl-dlg"><h4>💾 Save your document</h4><label>File name<input type="text" maxlength="30" value="' + L.esc(st.name || 'My letter') + '"></label><p>The file is saved in the Downloads folder. It opens in a word processor.</p><div class="row"><button type="button" class="btn primary" data-a="save">Save</button><button type="button" class="btn" data-a="x">Cancel</button></div></div>');
    const inp = ov.querySelector('input'); inp.focus(); inp.select();
    const done = function (ok) {
      if (ok) { st.name = (inp.value.trim() || 'My letter').replace(/[\\/:*?"<>|]+/g, ' '); st.saved = true; q('.wl-title .nm').textContent = st.name; stat.querySelector('.sv').textContent = 'Saved ✔';
        try { const doc = '<html><head><meta charset="utf-8"><title>' + L.esc(st.name) + '</title></head><body style="font-family:Georgia,serif;font-size:12pt;line-height:1.6">' + clean() + '</body></html>', a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿', doc], { type: 'application/msword' })); a.download = st.name + '.doc'; document.body.appendChild(a); if (!api.noDownload) a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800); } catch (e) { }
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
      const end = function () { document.body.classList.remove('wl-print'); pp.remove(); window.removeEventListener('afterprint', end); }; window.addEventListener('afterprint', end);
      try { if (!api.noDownload) window.print(); } catch (e) { } setTimeout(end, 1500); api.check({ t: 'print' });
    });
    ov.querySelector('[data-a="x"]').addEventListener('click', function () { ov.remove(); page.focus(); api.check({ t: 'preview' }); });
  }

  /* ---------- the ribbon ---------- */
  function run(cmd) {
    if (cmd === 'save') { saveDialog(); return; } if (cmd === 'print') { printDialog(); return; }
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
  const restore = function () { if (!saved) return; const s = window.getSelection(); s.removeAllRanges(); s.addRange(saved); };
  bar.querySelectorAll('select').forEach(function (s) { s.addEventListener('mousedown', remember); s.addEventListener('focus', remember); });
  stat.querySelectorAll('[data-z]').forEach(function (z) { z.addEventListener('click', function () { st.zoom = Math.max(60, Math.min(180, st.zoom + 20 * +z.dataset.z)); page.style.zoom = st.zoom / 100; stat.querySelector('.zm b').textContent = st.zoom + '%'; }); });

  function marks() {
    const inPage = !!selIn();
    ['bold', 'italic', 'underline', 'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull', 'insertUnorderedList', 'insertOrderedList'].forEach(function (c) { let on = false; try { on = inPage && document.queryCommandState(c); } catch (e) { } const x = bar.querySelector('[data-cmd="' + c + '"]'); if (x) x.classList.toggle('on', on); });
    if (inPage) { const s = selIn(), n = s.anchorNode.nodeType === 3 ? s.anchorNode.parentElement : s.anchorNode, c = getComputedStyle(n); q('.wl-size').value = String(nearest(nowPt())); const f = FONTS.filter(function (x) { return c.fontFamily.replace(/["']/g, '').toLowerCase().indexOf(x[0].toLowerCase()) === 0; })[0]; if (f) q('.wl-font').value = f[0]; bar.querySelector('[data-cmd="hilite"]').classList.toggle('on', T.hilite(null, n)); }
  }
  function changed() {
    page.querySelectorAll('.wl-bad').forEach(function (n) { if (n.textContent !== n.dataset.w) n.classList.remove('wl-bad'); });
    if (!page.firstChild) page.innerHTML = '<div><br></div>';
    const t = text().trim(), words = t ? t.split(/\s+/).length : 0; stat.querySelector('.w').textContent = words + (words === 1 ? ' word' : ' words');
    if (st.saved) { st.saved = false; stat.querySelector('.sv').textContent = 'Not saved'; }
    marks(); bar.querySelectorAll('.glow').forEach(function (n) { n.classList.remove('glow'); }); api.check({ t: 'edit' });
  }
  page.addEventListener('input', changed); page.addEventListener('keyup', marks); page.addEventListener('mouseup', function () { setTimeout(marks, 0); });
  page.addEventListener('keydown', function (e) {
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
  api.onStep = function () { bar.querySelectorAll('.glow').forEach(function (n) { n.classList.remove('glow'); }); setTimeout(function () { api.check({ t: 'step' }); }, 80); };
  api.doc.run = run; api.doc.setSize = setSize;
  changed(); st.saved = false; setTimeout(function () { if (page.isConnected && !lv.html) page.focus(); }, 100);
}

/* ---------- the levels: each one builds on the one before ----------
   1 typing   2 correcting mistakes   3 selecting words: bold, italic, underline   4 font, size and colour   5 lining up the page and lists
   6 copy, cut and paste   7 save and print   8 a whole letter alone */
const SELECT = ['Select the words: double-click a word, or press and drag across the words.', 'The words turn blue.'];
const bad = function (w, fix) { return '<span class="wl-bad" data-w="' + w + '" data-fix="' + fix + '">' + w + '</span>'; };
const d = function (api) { return api.doc; };
const LEVELS = [
  { id: 'type', title: 'Type a letter', icon: '✉️', min: 3, learned: 'You typed a letter with capital letters, a comma and new lines.',
    steps: [
      { say: 'Click on the page and type:  Dear Sam,', sub: 'Hold SHIFT for the capital letters', win: 'A good start!', tip: ['Click on the white page.', 'Hold SHIFT and press D for a capital D. Do the same for S.', 'The comma key is next to the M key.'], ok: function (e, a) { return d(a).has('dear sam,'); } },
      { say: 'Press ENTER to start a new line', win: 'A new line!', tip: ['Find the big ENTER key on the right of the keyboard.', 'Press it once.'], ok: function (e, a) { return d(a).has('dear sam') && d(a).page.children.length >= 2; } },
      { say: 'Type:  Thank you for the book.', sub: 'End the sentence with a full stop', win: 'A whole sentence!', tip: ['Start with a capital T: hold SHIFT and press T.', 'Press the long SPACE bar between words.', 'The full stop key is two keys right of M.'], ok: function (e, a) { return d(a).has('thank you for the book.'); } },
      { say: 'Start a new line. Type  From  and then your name.', win: 'Your letter is finished!', tip: ['Press ENTER for a new line.', 'Type From, press SPACE, then type your name.'], ok: function (e, a) { return /from\s+\S{2,}/i.test(d(a).lines().slice(-1)[0] || '') && d(a).lines().length >= 3; } }] },
  { id: 'fix', title: 'Fix the mistakes', icon: '🔧', min: 3, learned: 'A red wavy line means: check this spelling.',
    html: '<div>My ' + bad('scool', 'school') + ' has a big ' + bad('libary', 'library') + '.</div><div>We ' + bad('reed', 'read') + ' books every day day.</div>',
    steps: [
      { say: 'Fix the first red word. It should be  school', sub: 'Click after it, rub out with BACKSPACE, type it again', win: 'school is right!', tip: ['Click just after the red word scool.', 'Press BACKSPACE to rub out letters.', 'Type the right letters: school.'], ok: function (e, a) { return d(a).has('school') && !d(a).has('scool'); } },
      { say: 'Right-click the next red word and choose the right spelling', win: 'The computer helped you spell library!', tip: ['Put the pointer on the red word libary.', 'Press the RIGHT mouse button. A small menu opens.', 'Click the word library in the menu.'], ok: function (e, a) { return d(a).has('library') && !d(a).has('libary'); } },
      { say: 'Fix  reed . We  read  books.', win: 'read is right!', tip: ['Right-click the red word and choose read.', 'Or click after it, press BACKSPACE two times, and type ad.'], ok: function (e, a) { return /\bread\b/i.test(d(a).text()) && !d(a).has('reed'); } },
      { say: 'The word  day  is there twice. Delete one.', sub: 'Double-click a word to select it, then press DELETE', win: 'No more mistakes!', tip: ['Double-click the last word day. It turns blue.', 'Press the DELETE key.'], ok: function (e, a) { return d(a).count('day') === 1 && d(a).has('every day'); } }] },
  { id: 'style', title: 'Bold, italic, underline', icon: '🅱️', min: 3, learned: 'Select the words first. Then B makes them bold, I makes them lean, U draws a line under them.',
    html: '<div>My Pet</div><div>I have a dog. His name is Rex.</div><div>He is very fast.</div>',
    steps: [
      { say: 'Make the title  My Pet  bold', sub: 'Select the words, then click B', win: 'Bold! Titles stand out.', btn: 'bold', tip: SELECT.concat('Click the B button at the top.'), ok: function (e, a) { return d(a).styled('My Pet', d(a).T.bold); } },
      { say: 'Make the name  Rex  italic', sub: 'Select the word, then click I', win: 'Italic letters lean over.', btn: 'italic', tip: ['Double-click the word Rex. It turns blue.', 'Click the I button at the top.'], ok: function (e, a) { return d(a).styled('Rex', d(a).T.italic); } },
      { say: 'Underline the words  very fast', sub: 'Select them, then click U', win: 'Underlined!', btn: 'underline', tip: ['Press just before the word very and drag to the end of fast.', 'Both words turn blue.', 'Click the U button at the top.'], ok: function (e, a) { return d(a).styled('very fast', d(a).T.underline); } },
      { say: 'Now use the keyboard: select  dog  and press CTRL + B', win: 'Ctrl+B is the quick way to make words bold.', tip: ['Double-click the word dog.', 'Hold the CTRL key, tap B, then let go.'], ok: function (e, a) { return d(a).styled('dog', d(a).T.bold); } }] },
  { id: 'font', title: 'Font, size and colour', icon: '🎨', min: 3, learned: 'The font is the shape of the letters. Size is measured in points.',
    html: '<div>Party Time</div><div>Come to my party on Saturday.</div><div>It starts at two.</div><div>Bring a friend!</div>',
    steps: [
      { say: 'Select the title and change its size to 24', sub: 'The size list is next to the font name', win: 'A big title!', btn: 'size', tip: SELECT.concat('Click the size box (it says 12) and choose 24.'), ok: function (e, a) { return d(a).styled('Party Time', d(a).T.size(24)); } },
      { say: 'Change the title font to Comic Sans', win: 'A fun font for a party.', btn: 'font', tip: ['Select the title again if it is not blue.', 'Click the font box (it says Georgia).', 'Choose Comic Sans.'], ok: function (e, a) { return d(a).styled('Party Time', d(a).T.font(/comic/i)); } },
      { say: 'Make the word  Saturday  red', sub: 'Select it, then click the red circle', win: 'Red stands out!', btn: 'c1', tip: ['Double-click the word Saturday.', 'Click the red circle at the top.'], ok: function (e, a) { return d(a).styled('Saturday', d(a).T.color(1)); } },
      { say: 'Highlight  Bring a friend!  in yellow', sub: 'Select the words, then click the highlighter', win: 'Like a real highlighter pen.', btn: 'hilite', tip: ['Drag across Bring a friend! so it turns blue.', 'Click the yellow ab button.'], ok: function (e, a) { return d(a).styled('Bring friend', d(a).T.hilite); } }] },
  { id: 'layout', title: 'Line up the page', icon: '📐', min: 3, learned: 'Centre the title, keep the writing on the left, and use bullets for a list.',
    html: '<div>Party Time</div><div>Come to my party on Saturday.</div><div>Please bring:</div><div>A hat</div><div>A game</div><div>A big smile</div><div>From Alex</div>',
    steps: [
      { say: 'Put the title  Party Time  in the centre', sub: 'Click in the title, then click Centre', win: 'Centred!', btn: 'justifyCenter', tip: ['Click anywhere in the words Party Time.', 'Click the Centre button in the Paragraph group.'], ok: function (e, a) { return d(a).styled('Party Time', d(a).T.center); } },
      { say: 'Move  From Alex  to the right side', sub: 'Click in the line, then click Align right', win: 'A name goes well on the right.', btn: 'justifyRight', tip: ['Click anywhere in the words From Alex.', 'Click the Align right button.'], ok: function (e, a) { return d(a).styled('From Alex', d(a).T.right); } },
      { say: 'Turn the three things to bring into a bullet list', sub: 'Select the three lines, then click Bullets', win: 'A neat list!', btn: 'insertUnorderedList', tip: ['Press just before A hat and drag down to the end of A big smile.', 'All three lines turn blue.', 'Click the Bullets button in the Paragraph group.'], ok: function (e, a) { return d(a).page.querySelectorAll('ul li').length >= 3; } },
      { say: 'Change the bullets to numbers', sub: 'Select the list, then click Numbering', win: '1, 2, 3!', btn: 'insertOrderedList', tip: ['Select the three lines of the list again.', 'Click the Numbering button, next to Bullets.'], ok: function (e, a) { return d(a).page.querySelectorAll('ol li').length >= 3; } }] },
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
LEVELS.forEach(function (lv) { lv.build = function (body, api, year) { build(body, api, year, lv); }; });

CC.modes.letter = L.game({
  id: 'letter', icon: '📝', title: 'Type a Letter', color: '#ff7a45', cert: { hero: 'Word Wizard', art: 'letter', hue: 18 },
  sub: 'A real word processor: type, fix mistakes, and make your page look great.',
  stage: function () { return document.getElementById('stage-letter'); }, root: function () { return document.getElementById('letter-root'); },
  levels: function (y) { return LEVELS.filter(function (l) { return y >= l.min; }); }
});
})();
