/* shortcuts.js - Shortcut Lab (Years 4 to 6). A small notes program where keyboard shortcuts really work: Ctrl+A selects, Ctrl+C and Ctrl+V
   copy and paste (the clipboard is shown), Ctrl+Z undoes, Ctrl+B makes bold, Ctrl+F finds, Ctrl+S saves, Ctrl+P shows a print preview ...
   Each challenge is ticked when the real shortcut is used. Nothing is stored or sent anywhere. */
(function () {
'use strict';
const CC = window.CC;
const $stage = function () { return document.getElementById('stage-shortcuts'); };
const $root = function () { return document.getElementById('sh-root'); };
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

const TEXT = 'Computer shortcuts help me work faster. The quick brown fox jumps over the lazy dog. Practise makes perfect!';
const TASKS = [
  { id: 'all', keys: ['Ctrl', 'A'], title: 'Select everything', how: 'Press Ctrl + A', what: 'Ctrl + A selects everything in the document.' },
  { id: 'copy', keys: ['Ctrl', 'C'], title: 'Copy a word', how: 'Double-click a word, then press Ctrl + C', what: 'Ctrl + C copies what is selected. It waits in the clipboard.' },
  { id: 'paste', keys: ['Ctrl', 'V'], title: 'Paste it', how: 'Click where you want it, then press Ctrl + V', what: 'Ctrl + V pastes what is in the clipboard.' },
  { id: 'cut', keys: ['Ctrl', 'X'], title: 'Cut a word', how: 'Double-click a word, then press Ctrl + X', what: 'Ctrl + X cuts: it removes the selection and keeps a copy in the clipboard.' },
  { id: 'undo', keys: ['Ctrl', 'Z'], title: 'Undo a change', how: 'Press Ctrl + Z', what: 'Ctrl + Z undoes the last change. Everyone makes mistakes!' },
  { id: 'redo', keys: ['Ctrl', 'Y'], title: 'Redo it again', how: 'Press Ctrl + Y', what: 'Ctrl + Y does the change again, after an undo.' },
  { id: 'bold', keys: ['Ctrl', 'B'], title: 'Make a word bold', how: 'Double-click a word, then press Ctrl + B', what: 'Ctrl + B makes the selection bold.' },
  { id: 'italic', keys: ['Ctrl', 'I'], title: 'Make a word italic', how: 'Double-click a word, then press Ctrl + I', what: 'Ctrl + I makes the selection slanted (italic).' },
  { id: 'under', keys: ['Ctrl', 'U'], title: 'Underline a word', how: 'Double-click a word, then press Ctrl + U', what: 'Ctrl + U underlines the selection.' },
  { id: 'find', keys: ['Ctrl', 'F'], title: 'Find a word', how: 'Press Ctrl + F, then type a word to find', what: 'Ctrl + F opens Find. It highlights every match.' },
  { id: 'save', keys: ['Ctrl', 'S'], title: 'Save your work', how: 'Press Ctrl + S', what: 'Ctrl + S saves your work. Do it often!' },
  { id: 'print', keys: ['Ctrl', 'P'], title: 'See the print preview', how: 'Press Ctrl + P', what: 'Ctrl + P shows how the page will print.' }
];
/* shortcuts that work in real programs but cannot be practised safely inside a web page */
const CHEAT = [
  ['Alt + Tab', 'Switch to the last window you used'], ['Ctrl + T', 'Open a new browser tab'], ['Ctrl + W', 'Close the current tab'], ['Ctrl + Shift + T', 'Bring back a tab you closed'],
  ['Windows + D', 'Show the desktop'], ['Windows + L', 'Lock the computer'], ['Windows + Shift + S', 'Take a screenshot'], ['Ctrl + Shift + Esc', 'Open Task Manager'],
  ['F11', 'Full screen on or off'], ['Ctrl + + and Ctrl + -', 'Zoom in and out'], ['Ctrl + N', 'Open a new window'], ['Ctrl + Home / End', 'Jump to the start / the end']
];

const S = { doc: [], clip: [], undo: [], redo: [], done: {}, saved: true, el: {}, find: '' };
function fresh() { return TEXT.split('').map(function (c) { return { c: c, b: 0, i: 0, u: 0 }; }); }
function copyDoc(d) { return d.map(function (x) { return { c: x.c, b: x.b, i: x.i, u: x.u }; }); }

/* ---------- the document ---------- */
function render() {
  const box = S.el.doc, q = S.find.toLowerCase(), hits = {};
  if (q) { const t = S.doc.map(function (x) { return x.c; }).join('').toLowerCase(); let k = t.indexOf(q); while (k >= 0) { for (let j = 0; j < q.length; j++) hits[k + j] = 1; k = t.indexOf(q, k + q.length); } }
  box.innerHTML = S.doc.map(function (x, i) { return '<span data-i="' + i + '" class="' + (x.b ? 'b ' : '') + (x.i ? 'i ' : '') + (x.u ? 'u ' : '') + (hits[i] ? 'hit' : '') + '">' + esc(x.c) + '</span>'; }).join('');
  S.el.count.textContent = S.doc.length + ' letters';
  S.el.title.textContent = 'notes.txt' + (S.saved ? '' : ' *');
  S.el.clipText.textContent = S.clip.length ? '“' + S.clip.map(function (x) { return x.c; }).join('') + '”' : 'empty';
  S.el.clipBox.classList.toggle('full', !!S.clip.length);
}
function idxOf(node, off) {
  let n = node.nodeType === 3 ? node.parentNode : node;
  if (n === S.el.doc) return Math.min(off, S.doc.length);
  const sp = n.closest ? n.closest('[data-i]') : null; if (!sp) return null;
  return +sp.dataset.i + (node.nodeType === 3 && off > 0 ? 1 : 0);
}
function getSel() {
  const s = window.getSelection(); if (!s || !s.rangeCount || !S.el.doc.contains(s.anchorNode) || !S.el.doc.contains(s.focusNode)) return null;
  const a = idxOf(s.anchorNode, s.anchorOffset), b = idxOf(s.focusNode, s.focusOffset); if (a == null || b == null) return null;
  return { a: Math.min(a, b), b: Math.max(a, b) };
}
function setSel(a, b) {
  const s = window.getSelection(), r = document.createRange(), box = S.el.doc, sp = box.children;
  if (a === b) { r.setStart(box, Math.min(a, sp.length)); r.collapse(true); }
  else { r.setStart(sp[a].firstChild, 0); r.setEnd(sp[b - 1].firstChild, 1); }
  s.removeAllRanges(); s.addRange(r);
}
function keep() { S.undo.push({ d: copyDoc(S.doc), s: getSel() }); if (S.undo.length > 40) S.undo.shift(); S.redo = []; S.saved = false; }

/* ---------- what each shortcut really does ---------- */
function say(text, good) { S.el.msg.textContent = text; S.el.msg.className = 'sh-msg' + (good ? ' good' : ''); }
function finish(id) {
  if (S.done[id]) return; S.done[id] = true; const t = TASKS.filter(function (x) { return x.id === id; })[0];
  say('✅ ' + t.what, true); CC.sfx.good(); updateList();
  if (Object.keys(S.done).length === TASKS.length) { setTimeout(function () { CC.sfx.levelComplete(); say('🏆 Shortcut Star! You used every shortcut. Now use them in your own work!', true); }, 600); }
}
const OPS = {
  all: function () { setSel(0, S.doc.length); finish('all'); },
  copy: function () { const s = getSel(); if (!s || s.a === s.b) { say('Select something first: double-click a word, then press Ctrl + C.'); return; } S.clip = copyDoc(S.doc.slice(s.a, s.b)); render(); setSel(s.a, s.b); S.el.clipBox.classList.remove('flash'); void S.el.clipBox.offsetWidth; S.el.clipBox.classList.add('flash'); finish('copy'); },
  cut: function () { const s = getSel(); if (!s || s.a === s.b) { say('Select something first: double-click a word, then press Ctrl + X.'); return; } keep(); S.clip = copyDoc(S.doc.slice(s.a, s.b)); S.doc.splice(s.a, s.b - s.a); render(); setSel(s.a, s.a); S.el.clipBox.classList.remove('flash'); void S.el.clipBox.offsetWidth; S.el.clipBox.classList.add('flash'); finish('cut'); },
  paste: function () { if (!S.clip.length) { say('The clipboard is empty. Copy or cut something first (Ctrl + C or Ctrl + X).'); return; } const s = getSel() || { a: S.doc.length, b: S.doc.length }; keep(); const add = copyDoc(S.clip); S.doc.splice.apply(S.doc, [s.a, s.b - s.a].concat(add)); render(); setSel(s.a + add.length, s.a + add.length); finish('paste'); },
  undo: function () { if (!S.undo.length) { say('Nothing to undo yet. Make a change first, like cutting or pasting a word.'); return; } S.redo.push({ d: copyDoc(S.doc), s: getSel() }); const u = S.undo.pop(); S.doc = u.d; render(); if (u.s) setSel(Math.min(u.s.a, S.doc.length), Math.min(u.s.b, S.doc.length)); finish('undo'); },
  redo: function () { if (!S.redo.length) { say('Nothing to redo yet. Press Ctrl + Z first, then Ctrl + Y.'); return; } S.undo.push({ d: copyDoc(S.doc), s: getSel() }); const r = S.redo.pop(); S.doc = r.d; render(); finish('redo'); },
  find: function () { S.el.findbar.hidden = false; S.el.findin.focus(); S.el.findin.select(); say('Find is open. Type a word to find. Every match is highlighted.'); finish('find'); },
  save: function () { S.saved = true; render(); S.el.saved.textContent = '💾 Saved!'; S.el.saved.classList.remove('flash'); void S.el.saved.offsetWidth; S.el.saved.classList.add('flash'); finish('save'); },
  print: function () { showPrint(); finish('print'); }
};
function format(prop, id) {
  const s = getSel(); if (!s || s.a === s.b) { say('Select something first: double-click a word, then use the shortcut.'); return; }
  keep(); const on = S.doc.slice(s.a, s.b).every(function (x) { return x[prop]; }); for (let k = s.a; k < s.b; k++) S.doc[k][prop] = on ? 0 : 1; render(); setSel(s.a, s.b); finish(id);
}
OPS.bold = function () { format('b', 'bold'); }; OPS.italic = function () { format('i', 'italic'); }; OPS.under = function () { format('u', 'under'); };
const KEYMAP = { a: 'all', c: 'copy', x: 'cut', v: 'paste', z: 'undo', y: 'redo', b: 'bold', i: 'italic', u: 'under', f: 'find', s: 'save', p: 'print' };

function showPrint() {
  const ov = el('div', 'sh-print'); ov.innerHTML = '<div class="pg"><h4>notes.txt</h4><p>' + S.el.doc.innerHTML + '</p></div><button class="btn primary" type="button">✖ Close (Esc)</button>';
  ov.querySelector('button').addEventListener('click', function () { ov.remove(); }); S.el.win.appendChild(ov); S.el.print = ov;
}

/* ---------- keys ---------- */
function pressedCaps(e) { const k = []; if (e.ctrlKey) k.push('Ctrl'); if (e.metaKey) k.push('⌘'); if (e.altKey) k.push('Alt'); if (e.shiftKey) k.push('Shift'); const key = e.key.length === 1 ? e.key.toUpperCase() : e.key; if (['Control', 'Shift', 'Alt', 'Meta'].indexOf(key) < 0) k.push(key); return k; }
function showKeys(keys, ok) {
  S.el.keys.innerHTML = keys.map(function (k) { return '<b class="kc">' + esc(k) + '</b>'; }).join('<i>+</i>'); S.el.keys.className = 'sh-keys' + (ok ? ' ok' : '');
}
function onKey(e) {
  if (e.key === 'Escape') {
    if (S.el.print && S.el.print.parentNode) { S.el.print.remove(); S.el.print = null; return; }
    if (!S.el.findbar.hidden) { S.el.findbar.hidden = true; S.find = ''; S.el.findin.value = ''; render(); }
    return;
  }
  if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
  const caps = pressedCaps(e);
  if (['Control', 'Meta', 'Shift', 'Alt'].indexOf(e.key) >= 0) { showKeys(caps, false); return; }
  let id = KEYMAP[e.key.toLowerCase()];
  if (!id) { showKeys(caps, false); say('That shortcut works in other programs. See "More shortcuts to know".'); return; }
  if (id === 'undo' && e.shiftKey) id = 'redo';
  if (e.target === S.el.findin && id !== 'find') return;                 // the find box behaves like a normal text box
  e.preventDefault(); showKeys(caps, true); OPS[id]();
}

/* ---------- the screen ---------- */
function updateList() {
  S.el.list.innerHTML = '';
  TASKS.forEach(function (t, n) {
    const li = el('li', S.done[t.id] ? 'done' : ''); li.innerHTML = '<span class="tick">' + (S.done[t.id] ? '✅' : (n + 1)) + '</span><div><b></b><small></small><span class="caps"></span></div>';
    li.querySelector('b').textContent = t.title; li.querySelector('small').textContent = t.how; li.querySelector('.caps').innerHTML = t.keys.map(function (k) { return '<b class="kc">' + k + '</b>'; }).join('<i>+</i>');
    S.el.list.appendChild(li);
  });
  const n = Object.keys(S.done).length; S.el.prog.textContent = n + ' / ' + TASKS.length; S.el.bar.style.width = (n / TASKS.length * 100) + '%';
}
function show() {
  CC.ui.close(); S.doc = fresh(); S.clip = []; S.undo = []; S.redo = []; S.done = {}; S.saved = true; S.find = '';
  const w = el('div', 'sh-wrap'); S.el.wrap = w;
  const side = el('div', 'sh-side');
  side.innerHTML = '<div class="sh-head"><h3>⌨️ Shortcut Lab</h3><p>Use the real shortcuts on the notes. Mac: use ⌘ instead of Ctrl.</p><div class="sh-pg"><i></i></div><span class="n"></span></div>';
  S.el.bar = side.querySelector('.sh-pg i'); S.el.prog = side.querySelector('.n'); S.el.list = el('ol', 'sh-list'); side.appendChild(S.el.list);
  const cheat = el('details', 'sh-cheat'); cheat.innerHTML = '<summary>📖 More shortcuts to know</summary><ul>' + CHEAT.map(function (c) { return '<li><b class="kc2">' + esc(c[0]) + '</b> ' + esc(c[1]) + '</li>'; }).join('') + '</ul><p>These work on your computer in other programs, so try them there.</p>'; side.appendChild(cheat);
  w.appendChild(side);
  const main = el('div', 'sh-main'); w.appendChild(main);
  const win = el('div', 'sh-win'); S.el.win = win; main.appendChild(win);
  win.innerHTML = '<div class="tb"><span class="dots"><i></i><i></i><i></i></span><b class="ttl">notes.txt</b><span class="sv"></span></div><div class="menu"></div><div class="fb" hidden><span>🔍 Find:</span><input type="text" aria-label="find a word" placeholder="type a word"><button type="button" class="btn sm">✖</button></div><div class="doc" tabindex="0"></div><div class="stat"><span class="cnt"></span><span class="hint">Tip: the buttons above use the mouse. The shortcuts are faster!</span></div>';
  S.el.title = win.querySelector('.ttl'); S.el.saved = win.querySelector('.sv'); S.el.doc = win.querySelector('.doc'); S.el.count = win.querySelector('.cnt'); S.el.findbar = win.querySelector('.fb'); S.el.findin = win.querySelector('input');
  S.el.findbar.querySelector('button').addEventListener('click', function () { S.el.findbar.hidden = true; S.find = ''; S.el.findin.value = ''; render(); });
  S.el.findin.addEventListener('input', function () { S.find = S.el.findin.value; render(); });
  // the same actions with the mouse (they work, but do not count: the point is the shortcut)
  const menu = win.querySelector('.menu');
  [['Copy', 'copy', 'Ctrl + C'], ['Cut', 'cut', 'Ctrl + X'], ['Paste', 'paste', 'Ctrl + V'], ['Undo', 'undo', 'Ctrl + Z'], ['Redo', 'redo', 'Ctrl + Y'], ['B', 'bold', 'Ctrl + B'], ['I', 'italic', 'Ctrl + I'], ['U', 'under', 'Ctrl + U'], ['Find', 'find', 'Ctrl + F'], ['Save', 'save', 'Ctrl + S'], ['Print', 'print', 'Ctrl + P']].forEach(function (m) {
    const b = el('button', 'mb', m[0]); b.type = 'button'; b.title = 'Faster: ' + m[2];
    b.addEventListener('mousedown', function (e) { e.preventDefault(); });          // keep the selection
    b.addEventListener('click', function () { const done = S.done[m[1]]; OPS[m[1]](); if (!done) { delete S.done[m[1]]; updateList(); } say('That worked with the mouse. The faster way is ' + m[2] + '. Try it!'); });
    menu.appendChild(b);
  });
  const under = el('div', 'sh-under'); main.appendChild(under);
  S.el.keys = el('div', 'sh-keys'); S.el.keys.innerHTML = '<span>Press a shortcut…</span>'; under.appendChild(S.el.keys);
  S.el.clipBox = el('div', 'sh-clip'); S.el.clipBox.innerHTML = '<span>📋 Clipboard:</span> <b class="ct">empty</b>'; S.el.clipText = S.el.clipBox.querySelector('.ct'); under.appendChild(S.el.clipBox);
  S.el.msg = el('div', 'sh-msg', 'Pick any challenge on the left. Double-click a word to select it.'); main.appendChild(S.el.msg);
  const r = $root(); r.innerHTML = ''; r.appendChild(w); render(); updateList();
}

CC.modes.shortcuts = {
  makey: false,
  enter: function () { CC.audio.init(); CC.watchStage($stage()); show(); window.addEventListener('keydown', onKey, true); },
  exit: function () { window.removeEventListener('keydown', onKey, true); CC.ui.close(); },
  onKeyDown: function () { },
  /* test hooks */
  _S: S, _ops: OPS, _setSel: setSel, _getSel: getSel, _render: render
};
})();
