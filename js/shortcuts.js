/* shortcuts.js - Shortcut Lab (Years 4 to 6). 34 real keyboard shortcuts in four groups.
     Edit, Text, Page: a small notes program where the shortcuts really work (Ctrl+C copies, Ctrl+Z undoes, Home and End move, and so on).
     Computer: shortcuts for the computer itself (Windows key, Alt+Tab, zoom, full screen ...). These happen for real on the computer, so the lab
     notices them when it can, and the child can also tick "I did it". Each task is one row of TASKS below.
   Almost no words: a big picture of the keys to press, and a very short message. Nothing is stored or sent anywhere. */
(function () {
'use strict';
const CC = window.CC;
const $stage = function () { return document.getElementById('stage-shortcuts'); };
const $root = function () { return document.getElementById('sh-root'); };
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

const IS_MAC = /Mac|iPhone|iPad/i.test(navigator.platform || '') && !/Windows/i.test(navigator.userAgent || '');
const TEXT = 'Computer shortcuts help me work faster. The quick brown fox jumps over the lazy dog. Practise makes perfect! Try the keys on this text and watch what happens.';
const CATS = [['edit', '✏️', 'Edit'], ['text', '🔤', 'Text'], ['page', '📄', 'Page'], ['pc', '💻', 'Computer']];

/* ---------- the shortcuts ----------
   win / mac = the keys to show.  ok = the short message when it works.  real = happens on the computer itself (not inside the notes).
   need = which key the lab looks for when the computer takes over the shortcut (the window loses focus). A task with no mac list is hidden on a Mac. */
const TASKS = [
  { id: 'all', cat: 'edit', title: 'Select all', win: ['Ctrl', 'A'], mac: ['⌘', 'A'], ok: 'Selected everything' },
  { id: 'copy', cat: 'edit', title: 'Copy', win: ['Ctrl', 'C'], mac: ['⌘', 'C'], ok: 'Copied' },
  { id: 'paste', cat: 'edit', title: 'Paste', win: ['Ctrl', 'V'], mac: ['⌘', 'V'], ok: 'Pasted' },
  { id: 'cut', cat: 'edit', title: 'Cut', win: ['Ctrl', 'X'], mac: ['⌘', 'X'], ok: 'Cut' },
  { id: 'undo', cat: 'edit', title: 'Undo', win: ['Ctrl', 'Z'], mac: ['⌘', 'Z'], ok: 'Undone' },
  { id: 'redo', cat: 'edit', title: 'Redo', win: ['Ctrl', 'Y'], mac: ['⌘', 'Shift', 'Z'], ok: 'Redone' },
  { id: 'delword', cat: 'edit', title: 'Delete a word', win: ['Ctrl', 'Backspace'], mac: ['⌥', 'Delete'], ok: 'Word deleted' },
  { id: 'bold', cat: 'text', title: 'Bold', win: ['Ctrl', 'B'], mac: ['⌘', 'B'], ok: 'Bold' },
  { id: 'italic', cat: 'text', title: 'Italic', win: ['Ctrl', 'I'], mac: ['⌘', 'I'], ok: 'Italic' },
  { id: 'under', cat: 'text', title: 'Underline', win: ['Ctrl', 'U'], mac: ['⌘', 'U'], ok: 'Underlined' },
  { id: 'wordR', cat: 'text', title: 'Next word', win: ['Ctrl', '→'], mac: ['⌥', '→'], ok: 'Next word' },
  { id: 'wordL', cat: 'text', title: 'Last word', win: ['Ctrl', '←'], mac: ['⌥', '←'], ok: 'Last word' },
  { id: 'home', cat: 'text', title: 'Start of line', win: ['Home'], mac: ['⌘', '←'], ok: 'Start of line' },
  { id: 'end', cat: 'text', title: 'End of line', win: ['End'], mac: ['⌘', '→'], ok: 'End of line' },
  { id: 'top', cat: 'text', title: 'Very top', win: ['Ctrl', 'Home'], mac: ['⌘', '↑'], ok: 'Top' },
  { id: 'bottom', cat: 'text', title: 'Very bottom', win: ['Ctrl', 'End'], mac: ['⌘', '↓'], ok: 'Bottom' },
  { id: 'selword', cat: 'text', title: 'Select a word', win: ['Ctrl', 'Shift', '→'], mac: ['⌥', 'Shift', '→'], ok: 'Word selected' },
  { id: 'find', cat: 'page', title: 'Find', win: ['Ctrl', 'F'], mac: ['⌘', 'F'], ok: 'Find opened' },
  { id: 'save', cat: 'page', title: 'Save', win: ['Ctrl', 'S'], mac: ['⌘', 'S'], ok: 'Saved' },
  { id: 'print', cat: 'page', title: 'Print preview', win: ['Ctrl', 'P'], mac: ['⌘', 'P'], ok: 'Print preview' },
  { id: 'start', cat: 'pc', real: true, title: 'Start menu', win: ['⊞ Win'], mac: ['⌘', 'Space'], need: 'meta', ok: 'Nice!' },
  { id: 'desktop', cat: 'pc', real: true, title: 'Show desktop', win: ['⊞ Win', 'D'], need: 'meta', ok: 'Nice!' },
  { id: 'explorer', cat: 'pc', real: true, title: 'Open files', win: ['⊞ Win', 'E'], need: 'meta', ok: 'Nice!' },
  { id: 'snip', cat: 'pc', real: true, title: 'Screenshot', win: ['⊞ Win', 'Shift', 'S'], mac: ['⌘', 'Shift', '4'], need: 'meta', ok: 'Nice!' },
  { id: 'clip', cat: 'pc', real: true, title: 'Clipboard list', win: ['⊞ Win', 'V'], need: 'meta', ok: 'Nice!' },
  { id: 'emoji', cat: 'pc', real: true, title: 'Emoji', win: ['⊞ Win', '.'], mac: ['Ctrl', '⌘', 'Space'], need: 'meta', ok: 'Nice!' },
  { id: 'switch', cat: 'pc', real: true, title: 'Switch window', win: ['Alt', 'Tab'], mac: ['⌘', 'Tab'], need: 'alt', needMac: 'meta', ok: 'Nice!' },
  { id: 'taskview', cat: 'pc', real: true, title: 'All windows', win: ['⊞ Win', 'Tab'], mac: ['Ctrl', '↑'], need: 'meta', needMac: 'ctrl', ok: 'Nice!' },
  { id: 'taskman', cat: 'pc', real: true, title: 'Task Manager', win: ['Ctrl', 'Shift', 'Esc'], mac: ['⌘', '⌥', 'Esc'], need: 'ctrl', needMac: 'meta', ok: 'Nice!' },
  { id: 'newtab', cat: 'pc', real: true, title: 'New tab', win: ['Ctrl', 'T'], mac: ['⌘', 'T'], need: 'ctrl', needMac: 'meta', ok: 'Nice!' },
  { id: 'zoomin', cat: 'pc', real: true, title: 'Zoom in', win: ['Ctrl', '+'], mac: ['⌘', '+'], ok: 'Zoomed in' },
  { id: 'zoomout', cat: 'pc', real: true, title: 'Zoom out', win: ['Ctrl', '-'], mac: ['⌘', '-'], ok: 'Zoomed out' },
  { id: 'zoom0', cat: 'pc', real: true, title: 'Normal size', win: ['Ctrl', '0'], mac: ['⌘', '0'], ok: 'Normal size' },
  { id: 'full', cat: 'pc', real: true, title: 'Full screen', win: ['F11'], mac: ['Ctrl', '⌘', 'F'], ok: 'Full screen' }
];
const BYID = {}; TASKS.forEach(function (t) { BYID[t.id] = t; });

const S = { os: IS_MAC ? 'mac' : 'win', cat: 'edit', active: null, doc: [], clip: [], undo: [], redo: [], done: {}, saved: true, el: {}, find: '', caret: 0, anchor: 0, mod: null, rewarded: false };
function keysOf(t) { return (S.os === 'mac' ? t.mac : t.win) || null; }
function visible() { return TASKS.filter(function (t) { return keysOf(t); }); }
function core() { return TASKS.filter(function (t) { return !t.real; }); }
function fresh() { return TEXT.split('').map(function (c) { return { c: c, b: 0, i: 0, u: 0 }; }); }
function copyDoc(d) { return d.map(function (x) { return { c: x.c, b: x.b, i: x.i, u: x.u }; }); }

/* ---------- the notes document ---------- */
function render() {
  const box = S.el.doc, q = S.find.toLowerCase(), hits = {};
  if (q) { const t = S.doc.map(function (x) { return x.c; }).join('').toLowerCase(); let k = t.indexOf(q); while (k >= 0) { for (let j = 0; j < q.length; j++) hits[k + j] = 1; k = t.indexOf(q, k + q.length); } }
  box.innerHTML = S.doc.map(function (x, i) { return '<span data-i="' + i + '" class="' + (x.b ? 'b ' : '') + (x.i ? 'i ' : '') + (x.u ? 'u ' : '') + (hits[i] ? 'hit' : '') + '">' + esc(x.c) + '</span>'; }).join('');
  S.el.count.textContent = S.doc.length + ' letters';
  S.el.title.textContent = 'notes.txt' + (S.saved ? '' : ' *');
  S.el.clipText.textContent = S.clip.length ? '“' + S.clip.map(function (x) { return x.c; }).join('') + '”' : 'empty';
  S.el.clipBox.classList.toggle('full', !!S.clip.length);
  drawCaret();
}
function drawCaret() {
  const sp = S.el.doc.children; for (let k = 0; k < sp.length; k++) sp[k].classList.remove('car', 'car-end');
  if (!sp.length) return; const i = Math.min(S.caret, S.doc.length);
  if (i >= sp.length) sp[sp.length - 1].classList.add('car-end'); else sp[i].classList.add('car');
}
function idxOf(node, off) {
  const n = node.nodeType === 3 ? node.parentNode : node;
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
  if (!sp.length) return;
  if (a === b) { r.setStart(box, Math.min(a, sp.length)); r.collapse(true); }
  else { r.setStart(sp[a].firstChild, 0); r.setEnd(sp[b - 1].firstChild, 1); }
  s.removeAllRanges(); s.addRange(r);
}
/* the caret: moving it (and, with Shift, selecting) is what the arrow, Home and End shortcuts do */
function place(i, extend, eol) {   // eol: the caret sits at the end of its line (after End), so it still belongs to that line
  i = Math.max(0, Math.min(S.doc.length, i)); if (!extend) S.anchor = i; S.caret = i; S.eol = !!eol;
  setSel(Math.min(S.anchor, S.caret), Math.max(S.anchor, S.caret)); drawCaret();
}
function nextWord(i) { const d = S.doc; let j = i; while (j < d.length && /\S/.test(d[j].c)) j++; while (j < d.length && /\s/.test(d[j].c)) j++; return j; }
function prevWord(i) { const d = S.doc; let j = i; while (j > 0 && /\s/.test(d[j - 1].c)) j--; while (j > 0 && /\S/.test(d[j - 1].c)) j--; return j; }
function lineBounds(i) {   // the first and last place on the line the caret is on (measured from how the text wraps on screen)
  const sp = S.el.doc.children; if (!sp.length) return [0, 0];
  const at = S.eol && i > 0 ? i - 1 : i, ref = sp[Math.min(at, sp.length - 1)], top = ref.offsetTop; let a = Math.min(at, sp.length - 1), b = a;
  while (a > 0 && sp[a - 1].offsetTop === top) a--;
  while (b < sp.length - 1 && sp[b + 1].offsetTop === top) b++;
  return [a, i >= sp.length ? sp.length : b + 1];
}
function keep() { S.undo.push({ d: copyDoc(S.doc), s: getSel() }); if (S.undo.length > 40) S.undo.shift(); S.redo = []; S.saved = false; }

/* ---------- messages and finishing a task ---------- */
function say(text, good) { S.el.msg.textContent = text; S.el.msg.className = 'sh-msg' + (good ? ' good' : ''); }
function finish(id) {
  const t = BYID[id]; if (!t) return;
  if (!S.done[id]) { S.done[id] = true; CC.sfx.good(); }
  say('✅ ' + t.ok, true);
  if (S.active === id) nextActive();
  refresh();
  if (!S.rewarded && core().every(function (x) { return S.done[x.id]; })) {
    S.rewarded = true;
    setTimeout(function () { CC.sfx.levelComplete(); say('🏆 Shortcut Hero!', true); if (CC.rewards && CC.rewards.earn('shortcuts')) setTimeout(rewardScreen, 1200); }, 500);
  }
}
function nextActive() {   // move on to the next task in this group that is not done yet
  const list = visible().filter(function (t) { return t.cat === S.cat; }), i = list.findIndex(function (t) { return t.id === S.active; });
  const order = list.slice(i + 1).concat(list.slice(0, i + 1)), nxt = order.filter(function (t) { return !S.done[t.id]; })[0];
  if (nxt) S.active = nxt.id;
}
function rewardScreen() {   // every notes shortcut used: offer the reward picture
  const again = function () { CC.ui.show($stage(), { emoji: '🏆', title: 'Shortcut Hero!', text: '',
    buttons: [{ icon: '🏆', label: 'Reward', keys: ['Enter'], primary: true, fn: function () { CC.rewards.show('shortcuts', again); } }, { icon: '⌨️', label: 'Keep practising', fn: function () { CC.ui.close(); } }] }); };
  again();
}
function clipFlash() { S.el.clipBox.classList.remove('flash'); void S.el.clipBox.offsetWidth; S.el.clipBox.classList.add('flash'); }

/* ---------- what each shortcut really does in the notes ---------- */
function needSel() { say('Select a word first (double-click it)'); }
const OPS = {
  all: function () { S.anchor = 0; S.caret = S.doc.length; setSel(0, S.doc.length); drawCaret(); finish('all'); },
  copy: function () { const s = getSel(); if (!s || s.a === s.b) { needSel(); return; } S.clip = copyDoc(S.doc.slice(s.a, s.b)); render(); setSel(s.a, s.b); clipFlash(); finish('copy'); },
  cut: function () { const s = getSel(); if (!s || s.a === s.b) { needSel(); return; } keep(); S.clip = copyDoc(S.doc.slice(s.a, s.b)); S.doc.splice(s.a, s.b - s.a); S.caret = S.anchor = s.a; render(); setSel(s.a, s.a); clipFlash(); finish('cut'); },
  paste: function () {
    if (!S.clip.length) { say('Copy or cut something first'); return; }
    const s = getSel() || { a: S.doc.length, b: S.doc.length }; keep(); const add = copyDoc(S.clip); S.doc.splice.apply(S.doc, [s.a, s.b - s.a].concat(add));
    S.caret = S.anchor = s.a + add.length; render(); setSel(S.caret, S.caret); finish('paste');
  },
  undo: function () { if (!S.undo.length) { say('Change something first'); return; } S.redo.push({ d: copyDoc(S.doc), s: getSel() }); const u = S.undo.pop(); S.doc = u.d; S.caret = S.anchor = u.s ? Math.min(u.s.a, S.doc.length) : 0; render(); if (u.s) setSel(Math.min(u.s.a, S.doc.length), Math.min(u.s.b, S.doc.length)); finish('undo'); },
  redo: function () { if (!S.redo.length) { say('Undo first, then redo'); return; } S.undo.push({ d: copyDoc(S.doc), s: getSel() }); const r = S.redo.pop(); S.doc = r.d; render(); finish('redo'); },
  delword: function () {
    const s = getSel(); let a, b; if (s && s.a !== s.b) { a = s.a; b = s.b; } else { b = s ? s.b : S.caret; a = prevWord(b); }
    if (a === b) { say('Click in the text first'); return; }
    keep(); S.doc.splice(a, b - a); S.caret = S.anchor = a; render(); setSel(a, a); finish('delword');
  },
  wordR: function () { place(nextWord(S.caret), false); finish('wordR'); },
  wordL: function () { place(prevWord(S.caret), false); finish('wordL'); },
  home: function () { place(lineBounds(S.caret)[0], false); finish('home'); },
  end: function () { place(lineBounds(S.caret)[1], false, true); finish('end'); },
  top: function () { place(0, false); finish('top'); },
  bottom: function () { place(S.doc.length, false); finish('bottom'); },
  selword: function () { place(nextWord(S.caret), true); finish('selword'); },
  find: function () { S.el.findbar.hidden = false; S.el.findin.focus(); S.el.findin.select(); say('Type a word to find'); finish('find'); },
  save: function () { S.saved = true; render(); S.el.saved.textContent = '💾 Saved!'; S.el.saved.classList.remove('flash'); void S.el.saved.offsetWidth; S.el.saved.classList.add('flash'); finish('save'); },
  print: function () { showPrint(); finish('print'); }
};
function format(prop, id) {
  const s = getSel(); if (!s || s.a === s.b) { needSel(); return; }
  keep(); const on = S.doc.slice(s.a, s.b).every(function (x) { return x[prop]; }); for (let k = s.a; k < s.b; k++) S.doc[k][prop] = on ? 0 : 1; render(); setSel(s.a, s.b); finish(id);
}
OPS.bold = function () { format('b', 'bold'); }; OPS.italic = function () { format('i', 'italic'); }; OPS.under = function () { format('u', 'under'); };
const KEYMAP = { a: 'all', c: 'copy', x: 'cut', v: 'paste', z: 'undo', y: 'redo', b: 'bold', i: 'italic', u: 'under', f: 'find', s: 'save', p: 'print' };

function showPrint() {
  const ov = el('div', 'sh-print'); ov.innerHTML = '<div class="pg"><h4>notes.txt</h4><p>' + S.el.doc.innerHTML + '</p></div><button class="btn primary" type="button">✖ Close</button>';
  ov.querySelector('button').addEventListener('click', function () { ov.remove(); S.el.print = null; }); S.el.win.appendChild(ov); S.el.print = ov;
}

/* ---------- keys ---------- */
function pressedCaps(e) {
  const k = []; if (e.ctrlKey) k.push('Ctrl'); if (e.metaKey) k.push(S.os === 'mac' ? '⌘' : '⊞ Win'); if (e.altKey) k.push(S.os === 'mac' ? '⌥' : 'Alt'); if (e.shiftKey) k.push('Shift');
  const names = { ArrowRight: '→', ArrowLeft: '←', ArrowUp: '↑', ArrowDown: '↓', ' ': 'Space', Escape: 'Esc' }, key = names[e.key] || (e.key.length === 1 ? e.key.toUpperCase() : e.key);
  if (['Control', 'Shift', 'Alt', 'Meta'].indexOf(e.key) < 0) k.push(key); return k;
}
function showKeys(keys, ok) {
  S.el.keys.innerHTML = keys.length ? keys.map(function (k) { return '<b class="kc">' + esc(k) + '</b>'; }).join('<i>+</i>') : '<span>…</span>'; S.el.keys.className = 'sh-keys' + (ok ? ' ok' : '');
}
/* the shortcut in the notes that this key press is, if any */
function notesShortcut(e) {
  const cmd = e.ctrlKey || e.metaKey, alt = e.altKey, k = e.key;
  if (cmd && !alt) {
    if (k === 'Backspace') return 'delword';
    if (k === 'Home') return 'top'; if (k === 'End') return 'bottom';
    if (k === 'ArrowRight') return e.shiftKey ? 'selword' : (S.os === 'mac' ? 'end' : 'wordR');
    if (k === 'ArrowLeft') return e.shiftKey ? null : (S.os === 'mac' ? 'home' : 'wordL');
    if (k === 'ArrowUp' && S.os === 'mac') return 'top'; if (k === 'ArrowDown' && S.os === 'mac') return 'bottom';
    const id = KEYMAP[k.toLowerCase()]; if (!id) return null;
    return id === 'undo' && e.shiftKey ? 'redo' : id;
  }
  if (alt && !cmd) {   // Mac: Option + arrows / Delete
    if (k === 'ArrowRight') return e.shiftKey ? 'selword' : 'wordR'; if (k === 'ArrowLeft') return 'wordL'; if (k === 'Backspace') return 'delword';
  }
  if (!cmd && !alt) { if (k === 'Home') return 'home'; if (k === 'End') return 'end'; }
  return null;
}
/* shortcuts of the computer itself that the page can see directly */
function pcDirect(e) {
  const cmd = e.ctrlKey || e.metaKey, k = e.key;
  if (cmd && (k === '+' || k === '=')) return 'zoomin'; if (cmd && (k === '-' || k === '_')) return 'zoomout'; if (cmd && k === '0') return 'zoom0';
  if (k === 'F11' || (e.ctrlKey && e.metaKey && k.toLowerCase() === 'f')) return 'full';
  if (k === 'Meta' && S.os === 'win') return 'start';
  return null;
}
function onKey(e) {
  const mode = document.getElementById('mode-shortcuts'); if (!S.el.wrap || !mode || mode.hidden) return;
  if (document.querySelector('.rw-screen')) return;
  if (e.key === 'Escape') {
    if (S.el.print && S.el.print.parentNode) { S.el.print.remove(); S.el.print = null; return; }
    if (!S.el.findbar.hidden) { S.el.findbar.hidden = true; S.find = ''; S.el.findin.value = ''; render(); }
    return;
  }
  const caps = pressedCaps(e), typing = e.target === S.el.findin;
  if (e.key === 'Control' || e.key === 'Meta' || e.key === 'Alt') { S.mod = { k: e.key === 'Control' ? 'ctrl' : e.key === 'Meta' ? 'meta' : 'alt', t: performance.now() }; showKeys(caps, false); }
  if (S.cat === 'pc') {   // not stopped: a zoom or full screen really happens
    const direct = pcDirect(e); if (direct && keysOf(BYID[direct])) { showKeys(caps, true); finish(direct); return; }
    if (e.key.length > 1 || e.ctrlKey || e.metaKey || e.altKey) showKeys(caps, false);
    return;
  }
  if (typing && !(e.key.toLowerCase() === 'f' && (e.ctrlKey || e.metaKey))) return;                 // the find box behaves like a normal text box
  if (['Control', 'Meta', 'Shift', 'Alt'].indexOf(e.key) >= 0) { showKeys(caps, false); return; }
  const id = notesShortcut(e);
  if (!id) { if (e.ctrlKey || e.metaKey || e.altKey || e.key === 'Home' || e.key === 'End') showKeys(caps, false); return; }
  e.preventDefault(); showKeys(caps, true); OPS[id]();
}
/* when the computer takes over a shortcut (the Windows key, Alt+Tab ...) this window loses focus: that is how the lab knows it happened */
function lost() {
  const m = S.mod; if (!m || performance.now() - m.t > 2400 || S.cat !== 'pc') return;
  const t = BYID[S.active]; if (!t || !t.real || !t.need || S.done[t.id]) return;
  if ((S.os === 'mac' ? t.needMac || t.need : t.need) === m.k) finish(t.id);
}

/* ---------- the screen ---------- */
function keycaps(arr, big) { return '<span class="caps' + (big ? ' big' : '') + '">' + arr.map(function (k) { return '<b class="kc' + (/^[→←↑↓]$/.test(k) ? ' arr' : '') + '">' + esc(k) + '</b>'; }).join('<i>+</i>') + '</span>'; }
function refresh() {
  const vis = visible(), here = vis.filter(function (t) { return t.cat === S.cat; });
  if (!BYID[S.active] || !keysOf(BYID[S.active]) || BYID[S.active].cat !== S.cat) { const f = here.filter(function (t) { return !S.done[t.id]; })[0] || here[0]; S.active = f ? f.id : null; }
  S.el.tabs.innerHTML = '';
  CATS.forEach(function (c) {
    const mine = vis.filter(function (t) { return t.cat === c[0]; }), n = mine.filter(function (t) { return S.done[t.id]; }).length;
    const b = el('button', 'sh-tab' + (S.cat === c[0] ? ' on' : '') + (n === mine.length && mine.length ? ' full' : '')); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', S.cat === c[0] ? 'true' : 'false');
    b.innerHTML = '<span class="ti">' + c[1] + '</span><span class="tn">' + c[2] + '</span><span class="tc">' + n + '/' + mine.length + '</span>';
    b.addEventListener('click', function () { b.blur(); S.cat = c[0]; S.active = null; refresh(); });
    S.el.tabs.appendChild(b);
  });
  const done = vis.filter(function (t) { return S.done[t.id]; }).length; S.el.prog.textContent = done + ' / ' + vis.length; S.el.bar.style.width = (done / vis.length * 100) + '%';
  S.el.list.innerHTML = '';
  here.forEach(function (t) {
    const li = el('li', (S.done[t.id] ? 'done ' : '') + (S.active === t.id ? 'act' : '')); li.tabIndex = 0;
    li.innerHTML = '<span class="tick">' + (S.done[t.id] ? '✓' : '') + '</span><b></b>' + keycaps(keysOf(t));
    li.querySelector('b').textContent = t.title;
    const pick = function () { S.active = t.id; refresh(); };
    li.addEventListener('click', pick); li.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); pick(); } });
    S.el.list.appendChild(li);
  });
  const at = BYID[S.active];
  S.el.prompt.innerHTML = at ? '<span class="pt">' + esc(at.title) + '</span>' + keycaps(keysOf(at), true) : '<span class="pt">All done here! 🎉</span>';
  S.el.prompt.classList.toggle('done', !!(at && S.done[at.id]));
  const pc = S.cat === 'pc'; S.el.win.hidden = pc; S.el.live.hidden = !pc;
  if (pc) {
    S.el.live.innerHTML = '<div class="lv-ic">' + (at && at.id === 'full' ? '🖥️' : at && /zoom/.test(at.id) ? '🔍' : '💻') + '</div>' + (at ? '<div class="lv-t">Press the keys</div>' : '') + (at && !S.done[at.id] ? '<button class="btn primary" type="button">✓ I did it</button>' : '');
    const b = S.el.live.querySelector('button'); if (b) b.addEventListener('click', function () { b.blur(); finish(at.id); });
  }
}
function show() {
  CC.ui.close(); S.doc = fresh(); S.clip = []; S.undo = []; S.redo = []; S.done = {}; S.saved = true; S.find = ''; S.caret = 0; S.anchor = 0; S.rewarded = false; S.cat = 'edit'; S.active = null; S.mod = null;
  const w = el('div', 'sh-wrap'); S.el.wrap = w;
  const top = el('div', 'sh-top'); w.appendChild(top);
  top.innerHTML = '<div class="sh-tabs" role="tablist"></div><div class="sh-os" role="group" aria-label="Windows or Mac"></div><div class="sh-pgw"><div class="sh-pg"><i></i></div><span class="n"></span></div>';
  S.el.tabs = top.querySelector('.sh-tabs'); S.el.bar = top.querySelector('.sh-pg i'); S.el.prog = top.querySelector('.n');
  const osb = top.querySelector('.sh-os'); [['win', 'Windows'], ['mac', 'Mac']].forEach(function (o) {
    const b = el('button', 'sh-osb' + (S.os === o[0] ? ' on' : ''), o[1]); b.type = 'button';
    b.addEventListener('click', function () { b.blur(); S.os = o[0]; [].forEach.call(osb.children, function (x, i) { x.classList.toggle('on', ['win', 'mac'][i] === S.os); }); S.active = null; refresh(); }); osb.appendChild(b);
  });
  const body = el('div', 'sh-body'); w.appendChild(body);
  S.el.list = el('ol', 'sh-list'); body.appendChild(S.el.list);
  const main = el('div', 'sh-main'); body.appendChild(main);
  S.el.prompt = el('div', 'sh-prompt'); main.appendChild(S.el.prompt);
  const win = el('div', 'sh-win'); S.el.win = win; main.appendChild(win);
  win.innerHTML = '<div class="tb"><span class="dots"><i></i><i></i><i></i></span><b class="ttl">notes.txt</b><span class="sv"></span></div><div class="fb" hidden><span>🔍</span><input type="text" aria-label="find a word" placeholder="Type a word"><button class="btn" type="button">✖</button></div><div class="doc" tabindex="0"></div><div class="stat"><span class="cnt"></span></div>';
  S.el.live = el('div', 'sh-live'); S.el.live.hidden = true; main.appendChild(S.el.live);
  S.el.title = win.querySelector('.ttl'); S.el.saved = win.querySelector('.sv'); S.el.doc = win.querySelector('.doc'); S.el.count = win.querySelector('.cnt'); S.el.findbar = win.querySelector('.fb'); S.el.findin = win.querySelector('input');
  S.el.findbar.querySelector('button').addEventListener('click', function () { S.el.findbar.hidden = true; S.find = ''; S.el.findin.value = ''; render(); });
  S.el.findin.addEventListener('input', function () { S.find = S.el.findin.value; render(); });
  S.el.doc.addEventListener('mouseup', function () { setTimeout(function () { const s = getSel(); if (s) { S.anchor = s.a; S.caret = s.b; drawCaret(); } }, 0); });
  const under = el('div', 'sh-under'); main.appendChild(under);
  S.el.keys = el('div', 'sh-keys'); S.el.keys.innerHTML = '<span>…</span>'; under.appendChild(S.el.keys);
  S.el.clipBox = el('div', 'sh-clip'); S.el.clipBox.innerHTML = '<span>📋</span> <b class="ct">empty</b>'; S.el.clipText = S.el.clipBox.querySelector('.ct'); under.appendChild(S.el.clipBox);
  S.el.msg = el('div', 'sh-msg', 'Double-click a word, then try a shortcut'); main.appendChild(S.el.msg);
  const r = $root(); r.innerHTML = ''; r.appendChild(w); render(); refresh();
}

let visListener = null;
CC.modes.shortcuts = {
  makey: false,
  enter: function () {
    CC.audio.init(); CC.watchStage($stage()); show(); window.addEventListener('keydown', onKey, true); window.addEventListener('blur', lost);
    visListener = function () { if (document.hidden) lost(); }; document.addEventListener('visibilitychange', visListener);
  },
  exit: function () { window.removeEventListener('keydown', onKey, true); window.removeEventListener('blur', lost); if (visListener) document.removeEventListener('visibilitychange', visListener); visListener = null; CC.ui.close(); },
  onKeyDown: function () { },
  /* test hooks (used only by the automated checks) */
  _S: S, _ops: OPS, _tasks: TASKS, _setSel: setSel, _getSel: getSel, _render: render, _finish: finish, _key: onKey, _lost: lost
};
})();
