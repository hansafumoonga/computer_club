/* desktop.js - Desktop Skills (Years 1 to 6): a pretend computer desktop that really works with the mouse.
   Windows (hide, big, small, move, resize, front, close), folders and files (open, make, rename, drag, copy, paste, delete, bin).
   The levels are plain data in desktop_levels.js. Each task starts from a little scene (some files and windows) and waits for a goal,
   such as "a window was closed" or "the Dog is in the Pictures folder". Younger years get fewer, simpler tasks and glowing hints;
   older years use the real ways: right-click menus and keyboard keys. Nothing is stored or sent anywhere except a short progress copy (CC.keep). */
(function () {
'use strict';
const CC = window.CC, DATA = CC.DESKTOP, LEVELS = DATA.LEVELS;
const $root = function () { return document.getElementById('dk-root'); };
const $stage = function () { return document.getElementById('stage-desktop'); };
function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function sfx(n) { try { CC.sfx[n] && CC.sfx[n](); } catch (e) { } }

const COUNT = { close: 1, min: 1, max: 1, unmax: 1, delete: 1, empty: 1, restoreBin: 1, newfolder: 1, open: 1 };   // deliberate actions that count as a slip when they are not the goal
const CHEERS = ['Great!', 'Well done!', 'Yes!', 'Super!', 'You did it!'];
const TEXT = { d1: 'Once upon a time there was a happy robot who loved to learn.', d2: 'My homework: 2 + 2 = 4.' };

const S = { year: 1, view: 'home', lv: null, tasks: [], ti: 0, os: null, snap: null, locked: false, miss: 0, levelMiss: 0, hintOn: false, timer: 0, done: {}, stars: {}, nid: 0, lastIco: null, lastTitle: null, edit: null };

/* ---------- progress kept for a few hours ---------- */
(function () { const k = CC.keep.load('desktop'); if (k) { S.done = k.done || {}; S.stars = k.stars || {}; } })();
function keepProgress() { CC.keep.save('desktop', { done: S.done, stars: S.stars }); }

/* ---------- the pretend computer: files, windows, and what is selected ---------- */
function newOS() { return { files: {}, order: [], wins: [], z: 0, sel: null, edit: null, clip: null, target: null }; }
function area() { const a = $root().querySelector('.dk-area'); return { w: (a && a.clientWidth) || 900, h: (a && a.clientHeight) || 460 }; }
function fileOf(id) { return S.os.files[id] || null; }
function kids(parent) { return S.os.order.map(function (i) { return S.os.files[i]; }).filter(function (f) { return f && f.parent === parent; }); }
function inBin(f) { let n = 0; while (f && n++ < 20) { if (f.parent === 'bin') return true; if (f.parent === 'desk') return false; f = S.os.files[f.parent]; } return false; }
function inside(id, anc) { let f = S.os.files[id], n = 0; while (f && n++ < 20) { if (f.parent === anc) return true; f = S.os.files[f.parent]; } return false; }
function winOf(ref) { for (let i = 0; i < S.os.wins.length; i++) if (S.os.wins[i].ref === ref) return S.os.wins[i]; return null; }
function front() { let b = null; S.os.wins.forEach(function (w) { if (!w.min && (!b || w.z > b.z)) b = w; }); return b; }
function addFile(f) { S.os.files[f.id] = { id: f.id, name: f.name, ico: f.ico, kind: f.kind, parent: f.parent || 'desk' }; if (S.os.order.indexOf(f.id) < 0) S.os.order.push(f.id); }
function placeWin(ref, g, flags) {
  const A = area(), w = { ref: ref, kind: ref.charAt(0), id: ref.slice(2), x: 0, y: 0, w: 0, h: 0, min: false, max: false, z: ++S.os.z, sv: null };
  const n = S.os.wins.length % 5; g = g || [0.1 + n * 0.04, 0.06 + n * 0.05, 0.5, 0.6];
  w.x = Math.round(g[0] * A.w); w.y = Math.round(g[1] * A.h); w.w = Math.round(g[2] * A.w); w.h = Math.round(g[3] * A.h);
  if (flags && flags.min) w.min = true; if (flags && flags.max) { w.max = true; w.sv = { x: w.x, y: w.y, w: w.w, h: w.h }; }
  S.os.wins.push(w); return w;
}
function loadScene(sc) {
  S.os = newOS(); S.nid = 0;
  (sc.files || []).forEach(addFile);
  (sc.wins || []).forEach(function (w) { placeWin(w.ref, w.g, w); });
  S.os.target = sc.target || null; S.os.edit = sc.edit || null; if (sc.edit) S.os.sel = sc.edit;
  (sc.files || []).forEach(function (f) { const m = /^n(\d+)$/.exec(f.id); if (m) S.nid = Math.max(S.nid, Number(m[1])); });
}
function api() {
  return {
    file: fileOf, kids: kids, wins: function () { return S.os.wins.slice(); }, win: winOf,
    all: function (ids, parent) { return ids.every(function (i) { const f = fileOf(i); return f && f.parent === parent; }); },
    centerIn: function (ref, g) { const w = winOf(ref), A = area(); if (!w) return false; const cx = w.x + w.w / 2, cy = w.y + w.h / 2; return cx >= g[0] * A.w && cx <= (g[0] + g[2]) * A.w && cy >= g[1] * A.h && cy <= (g[1] + g[3]) * A.h; },
    near: function (ref, g) { const w = winOf(ref), A = area(); if (!w) return false; return Math.abs(w.x - g[0] * A.w) <= 0.07 * A.w && Math.abs(w.y - g[1] * A.h) <= 0.1 * A.h && Math.abs(w.w - g[2] * A.w) <= 0.1 * A.w && Math.abs(w.h - g[3] * A.h) <= 0.13 * A.h; }
  };
}

/* ---------- drawing the desktop ---------- */
function icoHtml(f, inWin) {
  const edit = S.os.edit === f.id;
  return '<div class="dk-ico ' + f.kind + (S.os.sel === f.id ? ' sel' : '') + '" data-id="' + f.id + '"><span class="ig">' + f.ico + '</span>' +
    (edit ? '<input class="dk-edit" type="text" maxlength="16" value="' + esc(f.name) + '" aria-label="name">' : '<span class="nm">' + esc(f.name) + '</span>') + '</div>';
}
function winTitle(w) { if (w.kind === 'b') return 'Recycle Bin'; const f = fileOf(w.id); return f ? f.name : '?'; }
function winIcon(w) { if (w.kind === 'b') return '🗑️'; const f = fileOf(w.id); return f ? f.ico : ''; }
function winHtml(w) {
  const f = w.kind === 'b' ? null : fileOf(w.id), title = winTitle(w);
  let body = '';
  if (w.kind === 'f' || w.kind === 'b') {
    const parent = w.kind === 'b' ? 'bin' : w.id, list = kids(parent);
    let tools = '';
    if (w.kind === 'b') tools = '<div class="dk-tools"><button type="button" class="tool-restore">♻ Put back</button><button type="button" class="tool-empty">🔥 Empty bin</button></div>';
    else if (S.year === 1) tools = '<div class="dk-tools"><button type="button" class="tool-new">➕ New folder</button><button type="button" class="tool-del">🗑️ Delete</button></div>';
    body = tools + '<div class="dk-files" data-folder="' + parent + '">' + (list.length ? list.map(function (k) { return icoHtml(k, true); }).join('') : '<span class="dk-empty">' + (w.kind === 'b' ? 'The bin is empty' : 'Empty folder') + '</span>') + '</div>';
  } else if (f) {
    body = '<div class="dk-view ' + f.kind + '">' + (f.kind === 'doc' ? '<p>' + esc(TEXT[f.id] || 'Hello! This is a page of writing.') + '</p>' : '<span class="big">' + f.ico + '</span>') + '</div>';
  }
  return '<div class="dk-win' + (w.max ? ' max' : '') + (w.min ? ' mini' : '') + '" data-w="' + w.ref + '" style="' + (w.max ? '' : 'left:' + w.x + 'px;top:' + w.y + 'px;width:' + w.w + 'px;height:' + w.h + 'px;') + 'z-index:' + (10 + w.z) + '">' +
    '<div class="dk-title"><span class="ti">' + winIcon(w) + '</span><span class="tt">' + esc(title) + '</span>' +
    '<button type="button" class="wbtn b-min" aria-label="hide the window" title="Hide">—</button><button type="button" class="wbtn b-max" aria-label="' + (w.max ? 'make the window small' : 'make the window big') + '" title="' + (w.max ? 'Small' : 'Big') + '">' + (w.max ? '❐' : '▢') + '</button><button type="button" class="wbtn b-cls" aria-label="close the window" title="Close">✕</button></div>' +
    body + '<div class="dk-grip" aria-hidden="true"></div></div>';
}
function render() {
  const R = $root(); if (!R || S.view !== 'play') return;
  const ic = R.querySelector('.dk-icons'), wins = R.querySelector('.dk-wins'), tb = R.querySelector('.dk-taskbar'), bin = R.querySelector('.dk-bin'), tg = R.querySelector('.dk-target');
  ic.innerHTML = kids('desk').map(function (k) { return icoHtml(k, false); }).join('');
  const binFull = kids('bin').length > 0; bin.innerHTML = '<span class="ig">' + (binFull ? '🗑️' : '🗑️') + '</span><span class="nm">Bin' + (binFull ? ' (' + kids('bin').length + ')' : '') + '</span>'; bin.classList.toggle('full', binFull);
  const A = area();
  if (S.os.target) { const g = S.os.target; tg.hidden = false; tg.style.left = g[0] * A.w + 'px'; tg.style.top = g[1] * A.h + 'px'; tg.style.width = g[2] * A.w + 'px'; tg.style.height = g[3] * A.h + 'px'; } else tg.hidden = true;
  wins.innerHTML = S.os.wins.map(winHtml).join('');
  const fr = front();
  tb.innerHTML = '<span class="tb-start" aria-hidden="true">🪟</span>' + S.os.wins.map(function (w) {
    return '<button type="button" class="dk-tb' + (fr === w ? ' on' : '') + (w.min ? ' min' : '') + '" data-w="' + w.ref + '"><span>' + winIcon(w) + '</span> ' + esc(winTitle(w)) + '</button>';
  }).join('');
  const ed = R.querySelector('.dk-edit'); if (ed) { ed.focus(); ed.select(); }
  applyHint();
}
function applyHint() {
  const R = $root(); if (!R) return;
  R.querySelectorAll('.dk-hl').forEach(function (n) { n.classList.remove('dk-hl'); });
  const t = S.tasks[S.ti]; if (!t || !S.hintOn || S.locked || !t.hint) return;
  [].concat(t.hint).forEach(function (sel) { let ns = []; try { ns = R.querySelectorAll(sel); } catch (e) { ns = []; } [].forEach.call(ns, function (n) { n.classList.add('dk-hl'); }); });
}
function markSel() { const R = $root(); R.querySelectorAll('.dk-ico').forEach(function (n) { n.classList.toggle('sel', n.dataset.id === S.os.sel); }); }
function applyZ() { const R = $root(); R.querySelectorAll('.dk-win').forEach(function (n) { const w = winOf(n.dataset.w); if (w) n.style.zIndex = 10 + w.z; }); const fr = front(); R.querySelectorAll('.dk-tb').forEach(function (b) { b.classList.toggle('on', winOf(b.dataset.w) === fr); }); }

/* ---------- events: what the learner did ---------- */
function emit(ev) {
  if (S.view !== 'play' || S.locked) return;
  const t = S.tasks[S.ti]; if (!t) return;
  let ok = false; try { ok = !!t.goal(ev, api()); } catch (e) { ok = false; }
  if (ok) { good(); return; }
  if (COUNT[ev.t]) {
    S.miss++; S.levelMiss++;
    const m = t.oops ? t.oops(ev, api()) : '';
    sfx('softMiss'); flash(m || (S.miss >= 3 ? 'Try the glowing thing, or press ↺ to start again.' : 'Not quite. Try again!'), 'bad');
    if (S.miss >= 2 && !S.hintOn) { S.hintOn = true; applyHint(); }
  } else if (t.oops && ev.t === 'rename') { const m = t.oops(ev, api()); if (m) { S.miss++; flash(m, 'bad'); } }
}
function flash(text, cls) { const m = $root().querySelector('.dk-msg'); if (!m) return; m.classList.remove('good', 'bad'); if (cls) m.classList.add(cls); m.querySelector('.say').textContent = text; m.querySelector('.sub').textContent = ''; clearTimeout(S.flashT); S.flashT = setTimeout(function () { showTask(); }, 1800); }
function showTask() {
  const m = $root().querySelector('.dk-msg'), t = S.tasks[S.ti]; if (!m || !t) return;
  m.classList.remove('good', 'bad'); m.querySelector('.say').textContent = t.say; m.querySelector('.sub').textContent = t.sub || '';
}

/* ---------- windows ---------- */
function raise(ref, via) {
  const w = winOf(ref); if (!w || w.min) return; if (front() === w) return;
  w.z = ++S.os.z; applyZ(); emit({ t: 'front', ref: ref, via: via || 'click' });
}
function openFile(id, via) {
  const f = fileOf(id); if (!f) return;
  const ref = (f.kind === 'folder' ? 'f:' : 'v:') + id, ex = winOf(ref);
  if (ex) { if (ex.min) restoreWin(ref, via); else raise(ref, via); return; }
  placeWin(ref); render(); emit({ t: 'open', id: id, ref: ref, via: via });
}
function openBin(via) { const ex = winOf('b:bin'); if (ex) { if (ex.min) restoreWin('b:bin', via); else raise('b:bin', via); return; } placeWin('b:bin', [0.3, 0.1, 0.44, 0.6]); render(); emit({ t: 'open', id: 'bin', ref: 'b:bin', via: via }); }
function closeWin(ref, via) { const i = S.os.wins.indexOf(winOf(ref)); if (i < 0) return; S.os.wins.splice(i, 1); if (S.os.edit && !fileOf(S.os.edit)) S.os.edit = null; render(); sfx('clink'); emit({ t: 'close', ref: ref, via: via }); }
function minWin(ref, via) { const w = winOf(ref); if (!w || w.min) return; w.min = true; render(); sfx('pop'); emit({ t: 'min', ref: ref, via: via }); }
function restoreWin(ref, via) { const w = winOf(ref); if (!w) return; w.min = false; w.z = ++S.os.z; render(); sfx('pickup'); emit({ t: 'restore', ref: ref, via: via }); }
function toggleMax(ref, via) {
  const w = winOf(ref); if (!w) return;
  if (w.max) { w.max = false; if (w.sv) { w.x = w.sv.x; w.y = w.sv.y; w.w = w.sv.w; w.h = w.sv.h; } render(); sfx('clink'); emit({ t: 'unmax', ref: ref, via: via }); }
  else { w.sv = { x: w.x, y: w.y, w: w.w, h: w.h }; w.max = true; w.z = ++S.os.z; render(); sfx('pickup'); emit({ t: 'max', ref: ref, via: via }); }
}

/* ---------- files ---------- */
function select(id) { S.os.sel = id; markSel(); }
function moveFile(id, to, via) {
  const f = fileOf(id); if (!f || f.parent === to) return false;
  if (f.kind === 'folder' && (to === id || inside(to, id))) return false;
  const from = f.parent; f.parent = to;
  if (to === 'bin') { f.was = from; S.os.wins = S.os.wins.filter(function (w) { return !(w.id === id && w.kind !== 'b'); }); if (S.os.sel === id) S.os.sel = null; }
  render();
  if (to === 'bin') { sfx('pop'); emit({ t: 'delete', id: id, via: via, from: from }); }
  else if (from === 'bin') { sfx('pickup'); emit({ t: 'restoreBin', id: id, via: via, to: to }); }
  else { sfx('clink'); emit({ t: 'drop', id: id, to: to, from: from, via: via }); }
  return true;
}
function deleteFile(id, via) { const f = fileOf(id); if (!f || f.parent === 'bin') return; moveFile(id, 'bin', via); }
function putBack(id, via) { const f = fileOf(id); if (!f || f.parent !== 'bin') return; const to = f.was && fileOf(f.was) && !inBin(fileOf(f.was)) ? f.was : 'desk'; moveFile(id, to, via); }
function emptyBin(via) { const list = kids('bin'); if (!list.length) return; list.forEach(function (f) { delete S.os.files[f.id]; S.os.order = S.os.order.filter(function (i) { return i !== f.id; }); }); S.os.sel = null; render(); sfx('zap'); emit({ t: 'empty', via: via }); }
function newFolder(parent, via) {
  const id = 'n' + (++S.nid); addFile({ id: id, name: 'New folder', ico: '📁', kind: 'folder', parent: parent });
  S.os.edit = id; S.os.sel = id; render(); sfx('pickup'); emit({ t: 'newfolder', id: id, parent: parent, via: via });
}
function startEdit(id) { const f = fileOf(id); if (!f || f.parent === 'bin') return; S.os.edit = id; S.os.sel = id; render(); }
function finishEdit(id, text, commit) {
  const f = fileOf(id); if (!f || S.os.edit !== id) return;
  S.os.edit = null; if (!commit) { render(); return; }
  const name = String(text).trim().slice(0, 16) || f.name; f.name = name; render(); sfx('tick'); emit({ t: 'rename', id: id, name: name });
}
function copyFile(id, via) { const f = fileOf(id); if (!f || f.parent === 'bin') return; S.os.clip = id; sfx('clink'); flash('Copied ' + f.name, 'good'); emit({ t: 'copy', id: id, via: via }); }
function pasteInto(to, via) {
  const src = fileOf(S.os.clip); if (!src) { flash('Copy something first!', 'bad'); return; }
  const id = 'n' + (++S.nid), same = kids(to).some(function (k) { return k.name === src.name; });
  addFile({ id: id, name: same ? src.name + ' 2' : src.name, ico: src.ico, kind: src.kind, parent: to }); S.os.sel = id; render(); sfx('pickup'); emit({ t: 'paste', id: id, src: src.id, to: to, via: via });
}
function openFolderOfFocus() { const fr = front(); return fr && fr.kind === 'f' ? fr.id : 'desk'; }

/* ---------- the right-click menu ---------- */
function closeMenu() { const m = $root() && $root().querySelector('.dk-menu'); if (m) m.remove(); }
function openMenu(x, y, items) {
  closeMenu(); const scr = $root().querySelector('.dk-screen'), r = scr.getBoundingClientRect();
  const m = el('div', 'dk-menu'); m.setAttribute('role', 'menu');
  items.forEach(function (it) {
    const b = el('button', 'mi', '<span>' + it.ico + '</span> ' + esc(it.label)); b.type = 'button'; b.setAttribute('role', 'menuitem'); if (it.dis) b.disabled = true;
    b.addEventListener('click', function () { closeMenu(); it.fn(); }); m.appendChild(b);
  });
  scr.appendChild(m); m.style.left = clamp(x - r.left, 0, Math.max(0, r.width - 170)) + 'px'; m.style.top = clamp(y - r.top, 0, Math.max(0, r.height - items.length * 38 - 10)) + 'px';
}
function onMenu(e) {
  if (S.view !== 'play' || S.locked || CC.ui.active) { e.preventDefault(); return; }
  e.preventDefault(); const t = e.target, ico = t.closest('.dk-ico'), files = t.closest('.dk-files'), win = t.closest('.dk-win');
  if (win) raise(win.dataset.w);
  if (ico) {
    const id = ico.dataset.id; select(id);
    if (fileOf(id).parent === 'bin') openMenu(e.clientX, e.clientY, [{ ico: '♻', label: 'Put back', fn: function () { putBack(id, 'menu'); } }]);
    else openMenu(e.clientX, e.clientY, [{ ico: '📂', label: 'Open', fn: function () { openFile(id, 'menu'); } }, { ico: '📋', label: 'Copy', fn: function () { copyFile(id, 'menu'); } }, { ico: '✏️', label: 'Rename', fn: function () { startEdit(id); } }, { ico: '🗑️', label: 'Delete', fn: function () { deleteFile(id, 'menu'); } }]);
    return;
  }
  if (win && win.dataset.w.charAt(0) === 'b') return;
  let to = null;
  if (files) to = files.dataset.folder; else if (win && win.dataset.w.charAt(0) === 'f') to = win.dataset.w.slice(2); else if (!win && t.closest('.dk-area')) to = 'desk';
  if (!to) return;
  openMenu(e.clientX, e.clientY, [{ ico: '📁', label: 'New folder', fn: function () { newFolder(to, 'menu'); } }, { ico: '📥', label: 'Paste', dis: !S.os.clip, fn: function () { pasteInto(to, 'menu'); } }]);
}

/* ---------- the mouse: windows, icons, the bar ---------- */
function dropAt(x, y, id) {
  const n = document.elementFromPoint(x, y); if (!n) return null;
  const ic = n.closest('.dk-ico.folder'); if (ic && ic.dataset.id !== id) return { to: ic.dataset.id, el: ic };
  const bin = n.closest('.dk-bin'); if (bin) return { to: 'bin', el: bin };
  const win = n.closest('.dk-win');
  if (win) { const k = win.dataset.w.charAt(0); if (k === 'b') return { to: 'bin', el: win }; if (k === 'f') return { to: win.dataset.w.slice(2), el: win }; return null; }
  const ar = n.closest('.dk-area'); if (ar) return { to: 'desk', el: ar };
  return null;
}
function startIcon(e, node) {
  const id = node.dataset.id, f = fileOf(id); if (!f) return; select(id);
  const sx = e.clientX, sy = e.clientY; let drag = false, ghost = null, over = null;
  function mv(ev) {
    if (!drag && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return;
    if (!drag) { drag = true; ghost = el('div', 'dk-ghost', '<span class="ig">' + f.ico + '</span>'); $root().querySelector('.dk-screen').appendChild(ghost); node.classList.add('dragging'); }
    ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px';
    const d = dropAt(ev.clientX, ev.clientY, id); if (over && (!d || d.el !== over)) { over.classList.remove('dk-over'); over = null; } if (d && d.to !== f.parent) { over = d.el; over.classList.add('dk-over'); }
  }
  function up(ev) {
    window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
    if (drag) { if (ghost) ghost.remove(); if (over) over.classList.remove('dk-over'); node.classList.remove('dragging'); const d = ev.type === 'pointerup' ? dropAt(ev.clientX, ev.clientY, id) : null; if (d) moveFile(id, d.to, 'drag'); return; }
    const now = Date.now();
    if (S.lastIco && S.lastIco.id === id && now - S.lastIco.t < 500) { S.lastIco = null; if (f.parent !== 'bin') openFile(id, 'dbl'); } else S.lastIco = { id: id, t: now };
  }
  window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
}
function startMove(e, node) {
  const ref = node.dataset.w, w = winOf(ref); if (!w) return;
  const now = Date.now();
  if (S.lastTitle && S.lastTitle.ref === ref && now - S.lastTitle.t < 450) { S.lastTitle = null; toggleMax(ref, 'title'); return; }
  S.lastTitle = { ref: ref, t: now };
  if (w.max) return;
  const sx = e.clientX, sy = e.clientY, ox = w.x, oy = w.y, A = area(); let moved = false;
  function mv(ev) {
    const dx = ev.clientX - sx, dy = ev.clientY - sy; if (!moved && Math.hypot(dx, dy) < 4) return;
    moved = true; node.classList.add('lift'); w.x = clamp(ox + dx, 60 - w.w, A.w - 60); w.y = clamp(oy + dy, 0, A.h - 30); node.style.left = w.x + 'px'; node.style.top = w.y + 'px';
  }
  function up() {
    window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
    node.classList.remove('lift'); if (moved) { S.lastTitle = null; emit({ t: 'move', ref: ref, x: w.x, y: w.y }); }
  }
  window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
}
function startResize(e, node) {
  const ref = node.dataset.w, w = winOf(ref); if (!w || w.max) return;
  const sx = e.clientX, sy = e.clientY, w0 = w.w, h0 = w.h, A = area(); let moved = false;
  function mv(ev) {
    const nw = clamp(w0 + ev.clientX - sx, 190, A.w - w.x), nh = clamp(h0 + ev.clientY - sy, 140, A.h - w.y); if (!moved && Math.hypot(nw - w0, nh - h0) < 4) return;
    moved = true; node.classList.add('lift'); w.w = nw; w.h = nh; node.style.width = nw + 'px'; node.style.height = nh + 'px';
  }
  function up() {
    window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
    node.classList.remove('lift'); if (moved) emit({ t: 'resize', ref: ref, w: w.w, h: w.h, w0: w0, h0: h0 });
  }
  window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
}
function onDown(e) {
  if (S.view !== 'play' || CC.ui.active || e.button === 2) return;
  const t = e.target;
  if (t.closest('.dk-menu')) return; closeMenu();
  if (t.closest('.dk-edit')) return;
  if (S.os.edit) { const ed = $root().querySelector('.dk-edit'); if (ed) finishEdit(S.os.edit, ed.value, true); }
  const win = t.closest('.dk-win'), ico = t.closest('.dk-ico');
  if (win) raise(win.dataset.w);
  if (t.closest('.wbtn, .dk-tools button, .dk-tb')) return;
  if (t.closest('.dk-bin')) { const now = Date.now(); if (S.lastIco && S.lastIco.id === 'bin' && now - S.lastIco.t < 500) { S.lastIco = null; openBin('dbl'); } else S.lastIco = { id: 'bin', t: now }; return; }
  if (win && t.closest('.dk-grip')) { e.preventDefault(); startResize(e, win); return; }
  if (ico) { e.preventDefault(); startIcon(e, ico); return; }
  if (win && t.closest('.dk-title')) { e.preventDefault(); startMove(e, win); return; }
  if (S.os.sel) { S.os.sel = null; markSel(); }
}
function onClick(e) {
  if (S.view !== 'play' || CC.ui.active) return;
  const t = e.target, win = t.closest('.dk-win'), b = t.closest('button'); if (!b) return;
  if (b.classList.contains('dk-tb')) {
    const ref = b.dataset.w, w = winOf(ref); if (!w) return;
    if (w.min) restoreWin(ref, 'bar'); else if (front() !== w) { raise(ref, 'bar'); } else minWin(ref, 'bar'); return;
  }
  if (!win) return; const ref = win.dataset.w, folder = ref.slice(2);
  if (b.classList.contains('b-cls')) closeWin(ref, 'btn');
  else if (b.classList.contains('b-min')) minWin(ref, 'btn');
  else if (b.classList.contains('b-max')) toggleMax(ref, 'btn');
  else if (b.classList.contains('tool-new')) newFolder(folder, 'btn');
  else if (b.classList.contains('tool-del')) { if (S.os.sel && fileOf(S.os.sel) && fileOf(S.os.sel).parent === folder) deleteFile(S.os.sel, 'btn'); else flash('Click a file first', 'bad'); }
  else if (b.classList.contains('tool-restore')) { if (S.os.sel && fileOf(S.os.sel) && fileOf(S.os.sel).parent === 'bin') putBack(S.os.sel, 'btn'); else flash('Click a file first', 'bad'); }
  else if (b.classList.contains('tool-empty')) emptyBin('btn');
}
function onEditKey(e) {
  const ed = e.target.closest && e.target.closest('.dk-edit'); if (!ed) return;
  e.stopPropagation();
  if (e.key === 'Enter') { e.preventDefault(); finishEdit(S.os.edit, ed.value, true); }
  else if (e.key === 'Escape') { e.preventDefault(); finishEdit(S.os.edit, ed.value, false); }
}
function onKeyDown(e) {
  if (S.view !== 'play' || CC.ui.active || S.locked) return;
  const tg = e.target && e.target.tagName; if (tg === 'INPUT' || tg === 'TEXTAREA') return;
  const mod = e.ctrlKey || e.metaKey, id = S.os.sel;
  if (e.key === 'Escape') { closeMenu(); return; }
  if ((e.key === 'Delete' || e.key === 'Backspace') && id && fileOf(id)) { e.preventDefault(); deleteFile(id, 'key'); }
  else if (e.key === 'F2' && id) { e.preventDefault(); startEdit(id); }
  else if (e.key === 'Enter' && id && fileOf(id) && fileOf(id).parent !== 'bin') { e.preventDefault(); openFile(id, 'key'); }
  else if (mod && (e.key === 'c' || e.key === 'C') && id) { e.preventDefault(); copyFile(id, 'key'); }
  else if (mod && (e.key === 'v' || e.key === 'V')) { e.preventDefault(); pasteInto(openFolderOfFocus(), 'key'); }
}

/* ---------- tasks and levels ---------- */
function tasksFor(lv) { return lv.tasks.filter(function (t) { return (!t.min || S.year >= t.min) && (!t.max || S.year <= t.max); }); }
function clearTimers() { clearTimeout(S.timer); clearTimeout(S.flashT); }
function beginTask(i, again) {
  clearTimers(); S.ti = i; S.locked = false; S.miss = 0; closeMenu();
  const t = S.tasks[i];
  if (again && S.snap) S.os = JSON.parse(JSON.stringify(S.snap));
  else { if (t.scene) loadScene(t.scene); S.snap = JSON.parse(JSON.stringify(S.os)); }
  S.hintOn = S.year === 1 || !!again && S.hintOn;
  const dots = $root().querySelector('.dk-dots'); dots.innerHTML = S.tasks.map(function (x, k) { return '<i class="' + (k < i ? 'd' : k === i ? 'c' : '') + '"></i>'; }).join('');
  showTask(); render();
}
function good() {
  const t = S.tasks[S.ti]; S.locked = true; sfx('good'); applyHint();
  const m = $root().querySelector('.dk-msg'); m.classList.remove('bad'); m.classList.add('good'); m.querySelector('.say').textContent = '✔ ' + (t.win || CHEERS[S.ti % CHEERS.length]); m.querySelector('.sub').textContent = '';
  const dots = $root().querySelector('.dk-dots'); if (dots.children[S.ti]) dots.children[S.ti].className = 'd';
  const last = S.ti >= S.tasks.length - 1;
  S.timer = setTimeout(function () { if (last) finishLevel(); else beginTask(S.ti + 1); }, last ? 1000 : 1100);
}
function gemSvg(lv, px) { return CC.SKILLS && CC.SKILLS.gem ? CC.SKILLS.gem(lv.gem, px) : '🏆'; }
function gemName(lv) { return CC.SKILLS.gemName(lv.gem); }
function finishLevel() {
  clearTimers(); S.locked = true; const lv = S.lv, m = S.levelMiss, stars = m <= 2 ? 3 : m <= 6 ? 2 : 1;
  S.done[lv.id] = true; S.stars[lv.id] = Math.max(S.stars[lv.id] || 0, stars); keepProgress();
  sfx('levelComplete'); levelDone(lv, stars);
}
function viewGem(lv, back) { CC.rewards.gem(lv.gem, { title: gemName(lv), game: 'Level ' + lv.id + ' · ' + DATA.NAME }, back); }
/* the certificate comes with the last gem: it is drawn by CC.rewards (name box, print on A4, save as a picture) */
function certSkills() {
  const a = ['Open and close windows', 'Hide and show', 'Move and resize', 'Make folders', 'Sort files', 'The Recycle Bin'];
  if (S.year >= 2) a.splice(2, 0, 'Right-click menus');
  if (S.year >= 3) a.push('Rename', 'Copy and paste');
  if (S.year >= 4) a.push('Keyboard keys', 'Many windows');
  return a;
}
function allDone() { return LEVELS.every(function (l) { return S.done[l.id]; }); }
function showCertificate(back) { CC.rewards.show({ cert: 'desktop', title: 'Desktop Skills certificate', game: DATA.NAME, year: S.year, gems: LEVELS.map(function (l) { return l.gem; }), skills: certSkills() }, back || showHome); }
function levelDone(lv, stars) {
  const last = lv.id >= LEVELS.length, all = LEVELS.every(function (l) { return S.done[l.id]; });
  CC.ui.show($stage(), { emoji: '<span class="gem-pop">' + gemSvg(lv, 150) + '</span>', stars: stars, title: all && last ? 'You are a Desktop Hero!' : 'You completed Level ' + lv.id + '!', text: 'New gem: ' + gemName(lv),
    buttons: [
      all && last ? { icon: '🎓', label: 'Certificate', primary: true, keys: ['Enter', 'Space'], fn: function () { showCertificate(function () { levelDone(lv, stars); }); } } : last ? { icon: '🗺️', label: 'Levels', primary: true, keys: ['Enter', 'Space'], fn: showHome } : { icon: '▶', label: 'Next', primary: true, keys: ['Enter', 'Space'], fn: function () { startLevel(lv.id + 1); } },
      { icon: '💎', label: 'My gem', fn: function () { viewGem(lv, function () { levelDone(lv, stars); }); } },
      { icon: '🔁', label: '', fn: function () { startLevel(lv.id); } }, last ? { icon: '🏠', label: '', fn: function () { CC.goMenu(); } } : { icon: '🗺️', label: '', fn: showHome }] });
}
function buildPlay() {
  const R = $root(); R.innerHTML = '';
  const p = el('div', 'dk-play');
  p.innerHTML = '<div class="dk-top"><button type="button" class="btn dk-back" aria-label="levels">🗺️</button><b class="dk-lv"></b><span class="dk-dots"></span><button type="button" class="btn dk-again" title="Start this step again" aria-label="start this step again">↺</button><button type="button" class="btn dk-hint" title="Show me" aria-label="show me">💡</button></div>' +
    '<div class="dk-msg"><b class="say"></b><i class="sub"></i></div>' +
    '<div class="dk-screen"><div class="dk-area"><div class="dk-icons"></div><div class="dk-bin" aria-label="Recycle Bin"></div><div class="dk-target" hidden></div><div class="dk-wins"></div></div><div class="dk-taskbar"></div></div>';
  R.appendChild(p);
  const scr = p.querySelector('.dk-screen');
  scr.addEventListener('pointerdown', onDown); scr.addEventListener('click', onClick); scr.addEventListener('contextmenu', onMenu); scr.addEventListener('keydown', onEditKey, true);
  scr.addEventListener('focusout', function (e) { if (e.target.classList && e.target.classList.contains('dk-edit') && S.os.edit && !S.locked) { const ed = e.target; setTimeout(function () { if (S.os.edit && $root().contains(ed) && ed === $root().querySelector('.dk-edit') && document.activeElement !== ed) finishEdit(S.os.edit, ed.value, true); }, 0); } });
  p.querySelector('.dk-back').addEventListener('click', function (e) { e.currentTarget.blur(); showHome(); });
  p.querySelector('.dk-again').addEventListener('click', function (e) { e.currentTarget.blur(); if (!CC.ui.active) beginTask(S.ti, true); });
  p.querySelector('.dk-hint').addEventListener('click', function (e) { e.currentTarget.blur(); S.hintOn = !S.hintOn; applyHint(); });
  p.querySelector('.dk-lv').textContent = 'Level ' + S.lv.id + ' · ' + S.lv.title;
}
function startLevel(id) {
  CC.ui.close(); clearTimers(); S.lv = LEVELS[id - 1]; S.tasks = tasksFor(S.lv); S.levelMiss = 0; S.view = 'play'; S.os = newOS();
  buildPlay(); beginTask(0);
}
function showHome() {
  CC.ui.close(); clearTimers(); closeMenu(); S.view = 'home'; S.lv = null;
  const R = $root(); R.innerHTML = '';
  const h = el('div', 'dk-home');
  h.innerHTML = '<div class="dk-h1">🪟 Desktop Skills</div><p class="dk-h2">Windows, folders and files, just like a real computer. Win a gem for every level!</p><div class="dk-map"></div><div class="dk-certrow"></div>';
  const map = h.querySelector('.dk-map');
  LEVELS.forEach(function (lv) {
    const done = !!S.done[lv.id], n = tasksFor(lv).length;
    const b = el('button', 'dk-tile' + (done ? ' done' : ''), '<span class="n">' + lv.id + '</span><span class="ic">' + (done ? gemSvg(lv, 64) : lv.icon) + '</span><span class="nm">' + esc(lv.title) + '</span><span class="st">' + (done ? '⭐'.repeat(S.stars[lv.id] || 1) : n + (n === 1 ? ' step' : ' steps')) + '</span>');
    b.type = 'button'; b.addEventListener('click', function () { b.blur(); startLevel(lv.id); });
    if (done) { const pr = el('span', 'pr', '💎'); pr.setAttribute('role', 'button'); pr.setAttribute('tabindex', '0'); pr.title = 'See my ' + gemName(lv); pr.setAttribute('aria-label', 'see my ' + gemName(lv));
      const go = function (e) { e.stopPropagation(); e.preventDefault(); viewGem(lv, null); }; pr.addEventListener('click', go); pr.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') go(e); }); b.appendChild(pr); }
    map.appendChild(b);
  });
  const cr = h.querySelector('.dk-certrow'), ok = allDone(), cb = el('button', 'btn' + (ok ? ' primary' : ''), ok ? '🎓 My certificate' : '🔒 Certificate: win all 8 gems');
  cb.type = 'button'; cb.disabled = !ok; cb.addEventListener('click', function () { cb.blur(); showCertificate(); }); cr.appendChild(cb);
  R.appendChild(h);
}

CC.modes.desktop = {
  makey: false,
  enter: function (o) {
    S.year = Math.max(1, Math.min(6, Number(o && o.year) || 1)); CC.audio.init(); CC.watchStage($stage()); showHome();
  },
  exit: function () { clearTimers(); closeMenu(); CC.ui.close(); S.view = 'home'; },
  onKeyDown: onKeyDown,
  /* test hooks (used only by the automated checks) */
  _S: S, _emit: emit, _start: startLevel, _home: showHome, _api: api, _ops: { openFile: openFile, closeWin: closeWin, minWin: minWin, restoreWin: restoreWin, toggleMax: toggleMax, moveFile: moveFile, newFolder: newFolder, finishEdit: finishEdit, deleteFile: deleteFile, putBack: putBack, emptyBin: emptyBin, copyFile: copyFile, pasteInto: pasteInto, openBin: openBin, raise: raise }
};
})();
