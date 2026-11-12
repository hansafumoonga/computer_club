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

const COUNT = { close: 1, min: 1, max: 1, unmax: 1, delete: 1, empty: 1, restoreBin: 1, newfolder: 1, open: 1, pick: 1, uninstall: 1, blocked: 1 };   // deliberate actions that count as a slip when they are not the goal
const CHEERS = ['Great!', 'Well done!', 'Yes!', 'Super!', 'You did it!'];
const TEXT = { d1: 'Once upon a time there was a happy robot who loved to learn.', d2: 'My homework: 2 + 2 = 4.' };

const S = { year: 1, view: 'home', lv: null, tasks: [], ti: 0, os: null, snap: null, locked: false, miss: 0, levelMiss: 0, hintOn: false, timer: 0, done: {}, stars: {}, nid: 0, lastIco: null, lastTitle: null };

/* ---------- progress kept for a few hours ---------- */
(function () { const k = CC.keep.load('desktop'); if (k) { S.done = k.done || {}; S.stars = k.stars || {}; } })();
function keepProgress() { CC.keep.save('desktop', { done: S.done, stars: S.stars }); }

/* ---------- the pretend computer: files, windows, and what is selected ---------- */
function newOS() { return { files: {}, order: [], wins: [], z: 0, sel: null, sels: [], anchor: null, edit: null, clip: null, cut: false, target: null, undo: [], rec: null, shots: 0 }; }
function area() { const a = $root().querySelector('.dk-area'); return { w: (a && a.clientWidth) || 900, h: (a && a.clientHeight) || 460 }; }
function fileOf(id) { return S.os.files[id] || null; }
function kids(parent) { return S.os.order.map(function (i) { return S.os.files[i]; }).filter(function (f) { return f && f.parent === parent; }); }
function inBin(f) { let n = 0; while (f && n++ < 20) { if (f.parent === 'bin') return true; if (f.parent === 'desk') return false; f = S.os.files[f.parent]; } return false; }
function inside(id, anc) { let f = S.os.files[id], n = 0; while (f && n++ < 20) { if (f.parent === anc) return true; f = S.os.files[f.parent]; } return false; }
function winOf(ref) { for (let i = 0; i < S.os.wins.length; i++) if (S.os.wins[i].ref === ref) return S.os.wins[i]; return null; }
function front() { let b = null; S.os.wins.forEach(function (w) { if (!w.min && (!b || w.z > b.z)) b = w; }); return b; }
function addFile(f) { S.os.files[f.id] = { id: f.id, name: f.name, ico: f.ico, kind: f.kind, parent: f.parent || 'desk', size: f.size || 0 }; if (S.os.order.indexOf(f.id) < 0) S.os.order.push(f.id); }
function placeWin(ref, g, flags) {
  const A = area(), w = { ref: ref, kind: ref.charAt(0), id: ref.slice(2), x: 0, y: 0, w: 0, h: 0, min: false, max: false, z: ++S.os.z, sv: null };
  const n = S.os.wins.length % 5; g = g || [0.1 + n * 0.04, 0.06 + n * 0.05, 0.5, 0.6];
  w.x = Math.round(g[0] * A.w); w.y = Math.round(g[1] * A.h); w.w = Math.round(g[2] * A.w); w.h = Math.round(g[3] * A.h);
  /* small screens: never smaller than a usable window, never poking out of the desktop */
  w.w = Math.min(A.w, Math.max(w.w, 190)); w.h = Math.min(A.h, Math.max(w.h, 150)); w.x = clamp(w.x, 0, A.w - w.w); w.y = clamp(w.y, 0, A.h - w.h);
  if (flags && flags.min) w.min = true; if (flags && flags.max) { w.max = true; w.sv = { x: w.x, y: w.y, w: w.w, h: w.h }; }
  S.os.wins.push(w); return w;
}
function loadScene(sc) {
  S.os = newOS(); S.nid = 0;
  (sc.files || []).forEach(addFile);
  (sc.wins || []).forEach(function (w) { placeWin(w.ref, w.g, w); });
  S.os.target = sc.target || null; S.os.edit = sc.edit || null; if (sc.edit) { S.os.sel = sc.edit; S.os.sels = [sc.edit]; }
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
  return '<div class="dk-ico ' + f.kind + (S.os.sels.indexOf(f.id) >= 0 ? ' sel' : '') + '" data-id="' + f.id + '"><span class="ig">' + f.ico + '</span>' +
    (edit ? '<input class="dk-edit" type="text" maxlength="16" value="' + esc(f.name) + '" aria-label="name">' : '<span class="nm">' + esc(f.name) + '</span>') + '</div>';
}
function winTitle(w) { if (w.kind === 'b') return 'Recycle Bin'; if (w.kind === 'a') return 'Settings › Apps'; const f = fileOf(w.id); return f ? f.name : '?'; }
function winIcon(w) { if (w.kind === 'b') return '🗑️'; if (w.kind === 'a') return '⚙️'; const f = fileOf(w.id); return f ? f.ico : ''; }
function winHtml(w) {
  const f = w.kind === 'b' || w.kind === 'a' ? null : fileOf(w.id), title = winTitle(w);
  let body = '';
  if (w.kind === 'f' || w.kind === 'b') {
    const parent = w.kind === 'b' ? 'bin' : w.id, list = kids(parent);
    let tools = '';
    if (w.kind === 'b') tools = '<div class="dk-tools"><button type="button" class="tool-restore">♻ Put back</button><button type="button" class="tool-empty">🔥 Empty bin</button></div>';
    else if (S.year === 1) tools = '<div class="dk-tools"><button type="button" class="tool-new">➕ New folder</button><button type="button" class="tool-del">🗑️ Delete</button></div>';
    body = tools + '<div class="dk-files" data-folder="' + parent + '">' + (list.length ? list.map(function (k) { return icoHtml(k, true); }).join('') : '<span class="dk-empty">' + (w.kind === 'b' ? 'The bin is empty' : 'Empty folder') + '</span>') + '</div>';
  } else if (w.kind === 'a') {
    const apps = S.os.order.map(function (i) { return S.os.files[i]; }).filter(function (x) { return x && x.kind === 'app'; });
    body = '<div class="dk-apps"><div class="ap-h">Installed apps</div>' + (apps.length ? apps.map(function (a) { return '<div class="ap-row"><span class="ig">' + a.ico + '</span><b>' + esc(a.name) + '</b><i>' + (a.size ? a.size + ' MB' : '') + '</i><button type="button" class="app-un" data-id="' + a.id + '">Uninstall</button></div>'; }).join('') : '<div class="dk-empty">No apps left</div>') + '</div>';
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
  const pro = !!(S.lv && S.lv.pro);
  tb.innerHTML = (pro ? '<button type="button" class="tb-start" aria-label="Start menu" title="Start">🪟</button>' : '<span class="tb-start" aria-hidden="true">🪟</span>') + S.os.wins.map(function (w) {
    return '<button type="button" class="dk-tb' + (fr === w ? ' on' : '') + (w.min ? ' min' : '') + '" data-w="' + w.ref + '"><span>' + winIcon(w) + '</span> ' + esc(winTitle(w)) + '</button>';
  }).join('') + (pro ? '<span class="tb-sp"></span><button type="button" class="dk-tool tb-search" aria-label="Search" title="Search">🔍</button><button type="button" class="dk-tool tb-snip" aria-label="Snipping tool" title="Snipping tool">✂️</button><button type="button" class="dk-tool tb-rec' + (S.os.rec ? ' on' : '') + '" aria-label="Screen recorder" title="Screen recorder">⏺<i>' + (S.os.rec ? recText() : '') + '</i></button>' : '');
  if (S.os.rec) startRecTimer();
  const ed = R.querySelector('.dk-edit'); if (ed) { ed.focus(); ed.select(); }
  applyHint();
}
function proHidden() { return S.year >= 6 && !!(S.lv && S.lv.pro); }   /* Year 6 gets no glowing hints on the pro levels */
function applyHint() {
  const R = $root(); if (!R) return;
  R.querySelectorAll('.dk-hl').forEach(function (n) { n.classList.remove('dk-hl'); });
  const t = S.tasks[S.ti]; if (!t || !S.hintOn || S.locked || !t.hint || proHidden()) return;
  [].concat(t.hint).forEach(function (sel) { let ns = []; try { ns = R.querySelectorAll(sel); } catch (e) { ns = []; } [].forEach.call(ns, function (n) { n.classList.add('dk-hl'); }); });
}
function markSel() { const R = $root(); R.querySelectorAll('.dk-ico').forEach(function (n) { n.classList.toggle('sel', S.os.sels.indexOf(n.dataset.id) >= 0); }); }
function applyZ() { const R = $root(); R.querySelectorAll('.dk-win').forEach(function (n) { const w = winOf(n.dataset.w); if (w) n.style.zIndex = 10 + w.z; }); const fr = front(); R.querySelectorAll('.dk-tb').forEach(function (b) { b.classList.toggle('on', winOf(b.dataset.w) === fr); }); }

/* ---------- events: what the learner did ---------- */
function emit(ev) {
  if (S.view !== 'play' || S.locked) return;
  const t = S.tasks[S.ti]; if (!t) return;
  let ok = false; try { ok = t.goal ? !!t.goal(ev, api()) : (ev.t === 'pick' && ev.value === t.answer); } catch (e) { ok = false; }
  if (ok) { good(); return; }
  if (COUNT[ev.t]) {
    S.miss++; S.levelMiss++;
    const m = t.oops ? t.oops(ev, api()) : (ev.t === 'pick' ? (t.wrong || 'Not that one. Think about the keys!') : ev.t === 'blocked' ? 'Apps are not deleted. They are UNINSTALLED!' : '');
    sfx('softMiss'); flash(m || (S.miss >= 3 ? 'Try the glowing thing, or press ↺ to start again.' : 'Not quite. Try again!'), 'bad');
    if (S.miss >= 2 && !S.hintOn && !proHidden()) { S.hintOn = true; applyHint(); }
  } else if (t.oops && ev.t === 'rename') { const m = t.oops(ev, api()); if (m) { S.miss++; flash(m, 'bad'); } }
}
function flash(text, cls) { const m = $root().querySelector('.dk-msg'); if (!m) return; m.classList.remove('good', 'bad'); if (cls) m.classList.add(cls); m.querySelector('.say').textContent = text; m.querySelector('.sub').textContent = ''; clearTimeout(S.flashT); S.flashT = setTimeout(function () { showTask(); }, 1800); }
function showTask() {
  const m = $root().querySelector('.dk-msg'), t = S.tasks[S.ti]; if (!m || !t) return;
  const x = S.year >= 6 && t.y6 ? t.y6 : t;   /* Year 6 gets a shorter line that does not name the keys */
  m.classList.remove('good', 'bad'); m.querySelector('.say').textContent = x.say; m.querySelector('.sub').textContent = x.sub || '';
  renderQuiz(t);
}
/* a keys quiz: the keys that cannot be caught in a web page (Windows key shortcuts, screenshots) are chosen from keycaps */
function kbdHtml(label) { return label.split(' + ').map(function (k) { return '<kbd>' + esc(k) + '</kbd>'; }).join('<b>+</b>'); }
function renderQuiz(t) {
  const area = $root().querySelector('.dk-area'); if (!area) return; const old = area.querySelector('.dk-quiz'); if (old) old.remove();
  if (!t || !t.choices) return;
  const q = el('div', 'dk-quiz'), opts = t.choices.map(function (c, i) { return { c: c, r: Math.random() + i * 0 }; }).sort(function (a, b) { return a.r - b.r; });
  opts.forEach(function (o) { const b = el('button', 'qz', kbdHtml(o.c)); b.type = 'button'; b.dataset.v = o.c; b.setAttribute('aria-label', o.c); q.appendChild(b); });
  area.appendChild(q);
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
  placeWin(ref); if (S.os.rec) S.os.rec.opened++; render(); emit({ t: 'open', id: id, ref: ref, via: via });
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
function setSel(ids, via, quiet) { S.os.sels = ids.filter(function (i) { return !!fileOf(i); }); S.os.sel = S.os.sels.length ? S.os.sels[S.os.sels.length - 1] : null; markSel(); if (!quiet) emit({ t: 'select', ids: S.os.sels.slice(), via: via || 'click' }); }
function select(id) { S.os.anchor = id; setSel([id], 'click'); }
function sameBox(id) { const f = fileOf(id); return f ? f.parent : null; }
function toggleSel(id) {
  const cur = S.os.sels.filter(function (i) { return sameBox(i) === sameBox(id); }), k = cur.indexOf(id);
  if (k >= 0) cur.splice(k, 1); else cur.push(id);
  S.os.anchor = id; setSel(cur, 'ctrl');
}
function selectRange(id) {
  const list = kids(sameBox(id)).map(function (f) { return f.id; }), anc = list.indexOf(S.os.anchor) >= 0 ? S.os.anchor : (list.indexOf(S.os.sel) >= 0 ? S.os.sel : id);
  const i = list.indexOf(anc), j = list.indexOf(id); setSel(list.slice(Math.min(i, j), Math.max(i, j) + 1), 'shift');
}
function selectAll(via) { const fr = front(), box = fr && fr.kind === 'f' ? fr.id : 'desk', ids = kids(box).map(function (f) { return f.id; }); setSel(ids, via || 'key'); }
function pushUndo() { S.os.undo.push(JSON.stringify({ files: S.os.files, order: S.os.order })); if (S.os.undo.length > 20) S.os.undo.shift(); }
function doUndo(via) {
  const u = S.os.undo.pop(); if (!u) { flash('Nothing to undo', 'bad'); return; }
  const o = JSON.parse(u); S.os.files = o.files; S.os.order = o.order; S.os.sels = []; S.os.sel = null; render(); sfx('pickup'); emit({ t: 'undo', via: via });
}
/* one file moves (to a folder, the desktop or the bin); the event comes back so a group can be announced as ONE action */
function moveOne(id, to, via) {
  const f = fileOf(id); if (!f || f.parent === to) return null;
  if (f.kind === 'folder' && (to === id || inside(to, id))) return null;
  if (f.kind === 'app' && to === 'bin') return { t: 'blocked', id: id };
  const from = f.parent; f.parent = to;
  if (to === 'bin') { f.was = from; S.os.wins = S.os.wins.filter(function (w) { return !(w.id === id && w.kind !== 'b'); }); S.os.sels = S.os.sels.filter(function (x) { return x !== id; }); if (S.os.sel === id) S.os.sel = S.os.sels[S.os.sels.length - 1] || null; }
  return { t: to === 'bin' ? 'delete' : from === 'bin' ? 'restoreBin' : 'drop', id: id, to: to, from: from, via: via };
}
function moveFiles(ids, to, via) {
  pushUndo(); const evs = []; let blocked = null;
  ids.forEach(function (i) { const e = moveOne(i, to, via); if (e && e.t === 'blocked') blocked = e; else if (e) evs.push(e); });
  if (!evs.length) { S.os.undo.pop(); if (blocked) emit(blocked); return false; }
  render();
  const first = evs[0]; if (first.t === 'delete') sfx('pop'); else if (first.t === 'restoreBin') sfx('pickup'); else sfx('clink');
  emit(Object.assign({}, first, { ids: evs.map(function (e) { return e.id; }) }));
  return true;
}
function moveFile(id, to, via) { return moveFiles([id], to, via); }
function deleteFile(id, via) { const f = fileOf(id); if (!f || f.parent === 'bin') return; moveFiles([id], 'bin', via); }
function deleteSel(via) { const ids = S.os.sels.filter(function (i) { const f = fileOf(i); return f && f.parent !== 'bin'; }); if (ids.length) moveFiles(ids, 'bin', via); }
function putBack(id, via) { const f = fileOf(id); if (!f || f.parent !== 'bin') return; const to = f.was && fileOf(f.was) && !inBin(fileOf(f.was)) ? f.was : 'desk'; moveFiles([id], to, via); }
function emptyBin(via) { const list = kids('bin'); if (!list.length) return; list.forEach(function (f) { delete S.os.files[f.id]; S.os.order = S.os.order.filter(function (i) { return i !== f.id; }); }); S.os.sels = []; S.os.sel = null; render(); sfx('zap'); emit({ t: 'empty', via: via }); }
function newFolder(parent, via) {
  pushUndo(); const id = 'n' + (++S.nid); addFile({ id: id, name: 'New folder', ico: '📁', kind: 'folder', parent: parent });
  S.os.edit = id; S.os.sel = id; S.os.sels = [id]; render(); sfx('pickup'); emit({ t: 'newfolder', id: id, parent: parent, via: via });
}
function startEdit(id) { const f = fileOf(id); if (!f || f.parent === 'bin') return; S.os.edit = id; S.os.sel = id; S.os.sels = [id]; render(); }
function finishEdit(id, text, commit) {
  const f = fileOf(id); if (!f || S.os.edit !== id) return;
  S.os.edit = null; if (!commit) { render(); return; }
  const name = String(text).trim().slice(0, 16) || f.name; if (name !== f.name) pushUndo(); f.name = name; render(); sfx('tick'); emit({ t: 'rename', id: id, name: name });
}
function copyFiles(ids, via, cut) {
  ids = ids.filter(function (i) { const f = fileOf(i); return f && f.parent !== 'bin'; }); if (!ids.length) return;
  S.os.clip = ids.slice(); S.os.cut = !!cut; sfx('clink'); flash((cut ? 'Cut ' : 'Copied ') + (ids.length > 1 ? ids.length + ' files' : fileOf(ids[0]).name), 'good'); emit({ t: cut ? 'cut' : 'copy', id: ids[0], ids: ids, via: via });
}
function copyFile(id, via) { copyFiles([id], via, false); }
function pasteInto(to, via) {
  const ids = (S.os.clip || []).filter(function (i) { return !!fileOf(i); }); if (!ids.length) { flash('Copy something first!', 'bad'); return; }
  pushUndo();
  if (S.os.cut) {
    const evs = []; ids.forEach(function (i) { const e = moveOne(i, to, via); if (e && e.t !== 'blocked') evs.push(e); }); S.os.clip = null; S.os.cut = false;
    if (!evs.length) { S.os.undo.pop(); return; }
    render(); sfx('pickup'); emit({ t: 'paste', id: evs[0].id, ids: evs.map(function (e) { return e.id; }), src: evs[0].id, to: to, via: via, cut: true }); return;
  }
  const made = []; ids.forEach(function (sid) {
    const src = fileOf(sid), id = 'n' + (++S.nid), same = kids(to).some(function (k) { return k.name === src.name; });
    addFile({ id: id, name: same ? src.name + ' 2' : src.name, ico: src.ico, kind: src.kind, parent: to, size: src.size }); made.push(id);
  });
  S.os.sels = made.slice(); S.os.sel = made[made.length - 1]; render(); sfx('pickup'); emit({ t: 'paste', id: made[0], ids: made, src: ids[0], srcs: ids, to: to, via: via, cut: false });
}
/* apps are removed with Uninstall, never with the bin */
function askConfirm(text, yes) {
  closeMenu(); const scr = $root().querySelector('.dk-screen'), c = el('div', 'dk-confirm'); c.setAttribute('role', 'dialog');
  c.innerHTML = '<div class="cf-box"><b>' + esc(text) + '</b><div class="cf-row"><button type="button" class="cf-yes">Uninstall</button><button type="button" class="cf-no">Cancel</button></div></div>';
  c.querySelector('.cf-yes').addEventListener('click', function () { c.remove(); yes(); }); c.querySelector('.cf-no').addEventListener('click', function () { c.remove(); });
  scr.appendChild(c);
}
function uninstall(id, via, now) {
  const f = fileOf(id); if (!f || f.kind !== 'app') return;
  const go = function () { const nm = f.name; delete S.os.files[id]; S.os.order = S.os.order.filter(function (i) { return i !== id; }); S.os.sels = S.os.sels.filter(function (x) { return x !== id; }); S.os.wins = S.os.wins.filter(function (w) { return w.id !== id; }); render(); sfx('zap'); emit({ t: 'uninstall', id: id, name: nm, via: via }); };
  if (now) go(); else askConfirm('Uninstall ' + f.name + '?', go);
}
/* ---- the pro tools on the bar: search, snipping, recording, the Start menu ---- */
function closePanels() { const R = $root(); if (!R) return; ['.dk-search', '.dk-confirm', '.dk-snapveil', '.dk-start'].forEach(function (q) { const n = R.querySelector(q); if (n) n.remove(); }); }
function folderName(f) { if (f.parent === 'desk') return 'Desktop'; const p = fileOf(f.parent); return p ? p.name : 'Desktop'; }
function openSearch(via) {
  const R = $root(), scr = R.querySelector('.dk-screen'); closePanels(); closeMenu();
  const box = el('div', 'dk-search'); box.innerHTML = '<div class="sr-top"><span>🔍</span><input class="dk-sq" type="text" placeholder="Search files and folders..." aria-label="search" autocomplete="off"><button type="button" class="sr-x" aria-label="close search">✕</button></div><div class="dk-sr"></div>';
  scr.appendChild(box); const inp = box.querySelector('.dk-sq'), out = box.querySelector('.dk-sr');
  function results() {
    const q = inp.value.trim().toLowerCase(); out.innerHTML = '';
    if (!q) { out.innerHTML = '<div class="sr-hint">Type a name</div>'; return; }
    const hit = S.os.order.map(function (i) { return S.os.files[i]; }).filter(function (f) { return f && f.parent !== 'bin' && !inBin(f) && f.name.toLowerCase().indexOf(q) >= 0; }).slice(0, 6);
    if (!hit.length) { out.innerHTML = '<div class="sr-hint">Nothing found</div>'; return; }
    hit.forEach(function (f) { const b = el('button', 'sr-row', '<span class="ig">' + f.ico + '</span><b>' + esc(f.name) + '</b><i>in ' + esc(folderName(f)) + '</i>'); b.type = 'button'; b.dataset.id = f.id; out.appendChild(b); });
  }
  inp.addEventListener('input', function () { results(); emit({ t: 'search', q: inp.value }); });
  inp.addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Escape') { e.preventDefault(); closePanels(); } else if (e.key === 'Enter') { const r = out.querySelector('.sr-row'); if (r) searchPick(r.dataset.id, inp.value); } });
  box.addEventListener('click', function (e) { const r = e.target.closest('.sr-row'); if (r) searchPick(r.dataset.id, inp.value); else if (e.target.closest('.sr-x')) closePanels(); });
  results(); inp.focus(); emit({ t: 'searchopen', via: via });
}
function searchPick(id, q) {
  const f = fileOf(id); if (!f) return; closePanels();
  if (f.parent !== 'desk' && f.parent !== 'bin') { const pr = 'f:' + f.parent; let w = winOf(pr); if (!w) { placeWin(pr); } else if (w.min) w.min = false; }
  if (f.kind === 'folder' && !winOf('f:' + id)) placeWin('f:' + id); S.os.anchor = id; S.os.sels = [id]; S.os.sel = id;
  render(); sfx('pickup'); emit({ t: 'searchpick', id: id, q: q });
}
function makeShot(kind, name, ico) { const id = 'n' + (++S.nid); S.os.shots++; addFile({ id: id, name: name + ' ' + S.os.shots, ico: ico, kind: kind, parent: 'desk' }); return id; }
function visibleRefs() { return S.os.wins.filter(function (w) { return !w.min; }).map(function (w) { return w.ref; }); }
function fullShot(via) {
  if (S.view !== 'play' || S.locked || CC.ui.active) return;
  const id = makeShot('pic', 'Screenshot', '🖼️'); render(); sfx('pickup'); flash('📸 Saved on your desktop', 'good'); emit({ t: 'snip', full: true, over: visibleRefs(), id: id, via: via });
}
function startSnip() {
  const scr = $root().querySelector('.dk-screen'); closePanels(); closeMenu();
  const veil = el('div', 'dk-snapveil', '<span class="sv-msg">Drag a box around what you want. Esc to cancel.</span><div class="sv-box" hidden></div>'); scr.appendChild(veil);
  const box = veil.querySelector('.sv-box'); let sx = 0, sy = 0, drag = false; const sr = scr.getBoundingClientRect();
  veil.addEventListener('pointerdown', function (e) { e.preventDefault(); drag = true; sx = e.clientX; sy = e.clientY; box.hidden = false; box.style.left = (sx - sr.left) + 'px'; box.style.top = (sy - sr.top) + 'px'; box.style.width = '0px'; box.style.height = '0px'; });
  veil.addEventListener('pointermove', function (e) { if (!drag) return; const x = Math.min(sx, e.clientX), y = Math.min(sy, e.clientY); box.style.left = (x - sr.left) + 'px'; box.style.top = (y - sr.top) + 'px'; box.style.width = Math.abs(e.clientX - sx) + 'px'; box.style.height = Math.abs(e.clientY - sy) + 'px'; });
  veil.addEventListener('pointerup', function (e) {
    if (!drag) return; drag = false; const x0 = Math.min(sx, e.clientX), y0 = Math.min(sy, e.clientY), x1 = Math.max(sx, e.clientX), y1 = Math.max(sy, e.clientY); veil.remove();
    if (x1 - x0 < 14 || y1 - y0 < 14) { flash('Drag a bigger box', 'bad'); return; }
    shotRect({ x0: x0, y0: y0, x1: x1, y1: y1 });
  });
}
function shotRect(r) {
  const ar = $root().querySelector('.dk-area').getBoundingClientRect(), over = [];
  $root().querySelectorAll('.dk-win').forEach(function (n) {
    const w = winOf(n.dataset.w); if (!w || w.min) return; const b = n.getBoundingClientRect(), iw = Math.max(0, Math.min(b.right, r.x1) - Math.max(b.left, r.x0)), ih = Math.max(0, Math.min(b.bottom, r.y1) - Math.max(b.top, r.y0));
    if (iw * ih >= 0.7 * b.width * b.height) over.push(w.ref);
  });
  const full = (r.x1 - r.x0) * (r.y1 - r.y0) >= 0.8 * ar.width * ar.height, id = makeShot('pic', 'Screenshot', '🖼️'); render(); sfx('pickup'); flash('📸 Saved on your desktop', 'good');
  emit({ t: 'snip', full: full, over: over, id: id, via: 'tool' });
}
function recText() { const n = S.os.rec ? Math.floor((Date.now() - S.os.rec.t0) / 1000) : 0; return ' ' + String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0'); }
function startRecTimer() { clearInterval(S.recT); S.recT = setInterval(function () { const i = $root() && $root().querySelector('.tb-rec i'); if (!S.os || !S.os.rec) { clearInterval(S.recT); return; } if (i) i.textContent = recText(); }, 500); }
function toggleRec() {
  if (S.view !== 'play' || S.locked) return;
  if (!S.os.rec) { S.os.rec = { t0: Date.now(), opened: 0 }; sfx('pop'); flash('⏺ Recording... press ⏺ again to stop', 'good'); render(); emit({ t: 'record', on: true }); return; }
  const secs = Math.floor((Date.now() - S.os.rec.t0) / 1000), opened = S.os.rec.opened; S.os.rec = null; clearInterval(S.recT);
  const id = makeShot('video', 'Recording', '🎬'); render(); sfx('pickup'); flash('🎬 Recording saved on your desktop', 'good'); emit({ t: 'recordstop', secs: secs, opened: opened, id: id });
}
function openStart() {
  const R = $root(), scr = R.querySelector('.dk-screen'), had = R.querySelector('.dk-start'); closePanels(); closeMenu(); if (had) return;
  const m = el('div', 'dk-start'); m.setAttribute('role', 'menu');
  [['⚙️', 'Settings', function () { openSettings('start'); }], ['🔍', 'Search', function () { openSearch('start'); }], ['✂️', 'Snipping tool', startSnip], ['⏺', 'Screen recorder', toggleRec], ['🗑️', 'Recycle Bin', function () { openBin('start'); }]].forEach(function (it) {
    const b = el('button', 'mi', '<span>' + it[0] + '</span> ' + it[1]); b.type = 'button'; b.setAttribute('role', 'menuitem'); b.addEventListener('click', function () { closePanels(); it[2](); }); m.appendChild(b);
  });
  scr.appendChild(m);
}
function openSettings(via) { const ex = winOf('a:apps'); if (ex) { if (ex.min) restoreWin('a:apps', via); else raise('a:apps', via); return; } placeWin('a:apps', [0.2, 0.05, 0.58, 0.82]); render(); emit({ t: 'settings', via: via }); }
function openFolderOfFocus() { const fr = front(); return fr && fr.kind === 'f' ? fr.id : 'desk'; }

/* ---------- the right-click menu ---------- */
function closeMenu() { const m = $root() && $root().querySelector('.dk-menu'); if (m) m.remove(); const c = $root() && $root().querySelector('.dk-start'); if (c) c.remove(); }
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
    const id = ico.dataset.id; if (S.os.sels.indexOf(id) < 0) select(id); else { S.os.sel = id; }
    const grp = S.os.sels.length > 1 && S.os.sels.indexOf(id) >= 0 ? S.os.sels.slice() : [id], many = grp.length > 1;
    if (fileOf(id).parent === 'bin') openMenu(e.clientX, e.clientY, [{ ico: '♻', label: 'Put back', fn: function () { putBack(id, 'menu'); } }]);
    else if (fileOf(id).kind === 'app') openMenu(e.clientX, e.clientY, [{ ico: '📂', label: 'Open', fn: function () { flash('The app opens...', 'good'); } }, { ico: '🧹', label: 'Uninstall', fn: function () { uninstall(id, 'menu'); } }]);
    else openMenu(e.clientX, e.clientY, (many ? [] : [{ ico: '📂', label: 'Open', fn: function () { openFile(id, 'menu'); } }]).concat([{ ico: '✂️', label: 'Cut', fn: function () { copyFiles(grp, 'menu', true); } }, { ico: '📋', label: 'Copy', fn: function () { copyFiles(grp, 'menu', false); } }]).concat(many ? [] : [{ ico: '✏️', label: 'Rename', fn: function () { startEdit(id); } }]).concat([{ ico: '🗑️', label: many ? 'Delete ' + grp.length + ' files' : 'Delete', fn: function () { moveFiles(grp, 'bin', 'menu'); } }]));
    return;
  }
  if (win && (win.dataset.w.charAt(0) === 'b' || win.dataset.w.charAt(0) === 'a')) return;
  let to = null;
  if (files) to = files.dataset.folder; else if (win && win.dataset.w.charAt(0) === 'f') to = win.dataset.w.slice(2); else if (!win && t.closest('.dk-area')) to = 'desk';
  if (!to) return;
  openMenu(e.clientX, e.clientY, [{ ico: '📁', label: 'New folder', fn: function () { newFolder(to, 'menu'); } }, { ico: '📥', label: 'Paste', dis: !(S.os.clip && S.os.clip.length), fn: function () { pasteInto(to, 'menu'); } }, { ico: '☑️', label: 'Select all', fn: function () { const ids = kids(to).map(function (f) { return f.id; }); setSel(ids, 'menu'); } }]);
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
  const id = node.dataset.id, f = fileOf(id); if (!f) return;
  if (e.ctrlKey || e.metaKey) { toggleSel(id); return; }
  if (e.shiftKey) { selectRange(id); return; }
  const was = S.os.sels.length > 1 && S.os.sels.indexOf(id) >= 0; if (!was) select(id); else S.os.sel = id;
  const group = S.os.sels.slice(), sx = e.clientX, sy = e.clientY; let drag = false, ghost = null, over = null;
  function mv(ev) {
    if (!drag && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return;
    if (!drag) { drag = true; ghost = el('div', 'dk-ghost', '<span class="ig">' + f.ico + '</span>' + (group.length > 1 ? '<b class="gn">' + group.length + '</b>' : '')); $root().querySelector('.dk-screen').appendChild(ghost); group.forEach(function (g) { const n = $root().querySelector('.dk-ico[data-id="' + g + '"]'); if (n) n.classList.add('dragging'); }); }
    ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px';
    const d = dropAt(ev.clientX, ev.clientY, id); if (over && (!d || d.el !== over)) { over.classList.remove('dk-over'); over = null; } if (d && d.to !== f.parent) { over = d.el; over.classList.add('dk-over'); }
  }
  function up(ev) {
    window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
    if (drag) {
      if (ghost) ghost.remove(); if (over) over.classList.remove('dk-over'); $root().querySelectorAll('.dk-ico.dragging').forEach(function (n) { n.classList.remove('dragging'); });
      const d = ev.type === 'pointerup' ? dropAt(ev.clientX, ev.clientY, id) : null; if (d) moveFiles(group.filter(function (g) { return g !== d.to; }), d.to, 'drag'); return;
    }
    if (was) select(id);
    const now = Date.now();
    if (S.lastIco && S.lastIco.id === id && now - S.lastIco.t < 500) { S.lastIco = null; if (f.parent !== 'bin') openFile(id, 'dbl'); } else S.lastIco = { id: id, t: now };
  }
  window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
}
/* dragging a box over empty space selects the icons it touches */
function startBand(e, box) {
  const scr = $root().querySelector('.dk-screen'), sr = scr.getBoundingClientRect(), sx = e.clientX, sy = e.clientY; let band = null, moved = false;
  const icons = [].slice.call(box.querySelectorAll('.dk-ico'));
  function mv(ev) {
    if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return;
    if (!band) { moved = true; band = el('div', 'dk-band'); scr.appendChild(band); }
    const x0 = Math.min(sx, ev.clientX), y0 = Math.min(sy, ev.clientY), x1 = Math.max(sx, ev.clientX), y1 = Math.max(sy, ev.clientY);
    band.style.left = (x0 - sr.left) + 'px'; band.style.top = (y0 - sr.top) + 'px'; band.style.width = (x1 - x0) + 'px'; band.style.height = (y1 - y0) + 'px';
    const ids = icons.filter(function (n) { const b = n.getBoundingClientRect(); const iw = Math.min(b.right, x1) - Math.max(b.left, x0), ih = Math.min(b.bottom, y1) - Math.max(b.top, y0); return iw > 0 && ih > 0 && iw * ih >= 0.3 * b.width * b.height; }).map(function (n) { return n.dataset.id; });
    S.os.sels = ids; S.os.sel = ids.length ? ids[ids.length - 1] : null; markSel();
  }
  function up() {
    window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
    if (band) band.remove(); if (moved) emit({ t: 'select', ids: S.os.sels.slice(), via: 'box' });
  }
  window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  if (!e.ctrlKey && !e.shiftKey && (S.os.sels.length)) { S.os.sels = []; S.os.sel = null; markSel(); }
}
function startMove(e, node) {
  const ref = node.dataset.w, w = winOf(ref); if (!w) return;
  const now = Date.now();
  if (S.lastTitle && S.lastTitle.ref === ref && now - S.lastTitle.t < 450) { S.lastTitle = null; toggleMax(ref, 'title'); return; }
  S.lastTitle = { ref: ref, t: now };
  if (w.max) return;
  const sx = e.clientX, sy = e.clientY, ox = w.x, oy = w.y, A = area(), ar = $root().querySelector('.dk-area'); let moved = false, side = null;
  function mv(ev) {
    const dx = ev.clientX - sx, dy = ev.clientY - sy; if (!moved && Math.hypot(dx, dy) < 4) return;
    moved = true; node.classList.add('lift'); w.x = clamp(ox + dx, 60 - w.w, A.w - 60); w.y = clamp(oy + dy, 0, A.h - 30); node.style.left = w.x + 'px'; node.style.top = w.y + 'px';
    const r = ar.getBoundingClientRect(); side = ev.clientX <= r.left + 14 ? 'left' : ev.clientX >= r.right - 14 ? 'right' : ev.clientY <= r.top + 8 ? 'top' : null;
    ar.classList.toggle('snap-left', side === 'left'); ar.classList.toggle('snap-right', side === 'right'); ar.classList.toggle('snap-top', side === 'top');
  }
  function up() {
    window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
    node.classList.remove('lift'); ar.classList.remove('snap-left', 'snap-right', 'snap-top');
    if (moved && side) { S.lastTitle = null; snapWin(ref, side); return; }
    if (moved) { S.lastTitle = null; emit({ t: 'move', ref: ref, x: w.x, y: w.y }); }
  }
  window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
}
/* drag a window to the left or right edge: it fills half the screen; to the top edge: it fills the whole screen */
function snapWin(ref, side) {
  const w = winOf(ref); if (!w) return; const A = area();
  if (side === 'top') { if (!w.max) { w.sv = { x: w.x, y: w.y, w: w.w, h: w.h }; w.max = true; w.z = ++S.os.z; } render(); sfx('pickup'); emit({ t: 'snap', ref: ref, side: 'top' }); return; }
  w.max = false; w.x = side === 'left' ? 0 : Math.round(A.w / 2); w.y = 0; w.w = Math.round(A.w / 2); w.h = A.h; w.z = ++S.os.z; render(); sfx('pickup'); emit({ t: 'snap', ref: ref, side: side });
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
  if (t.closest('.dk-menu, .dk-start, .dk-confirm, .dk-search, .dk-snapveil, .dk-quiz')) return;
  if (!t.closest('.tb-start')) closeMenu();
  if (t.closest('.dk-edit')) return;
  if (S.os.edit) { const ed = $root().querySelector('.dk-edit'); if (ed) finishEdit(S.os.edit, ed.value, true); }
  const win = t.closest('.dk-win'), ico = t.closest('.dk-ico');
  if (win) raise(win.dataset.w);
  if (t.closest('.wbtn, .dk-tools button, .dk-tb, .dk-tool, .tb-start, .app-un')) return;
  if (t.closest('.dk-bin')) { const now = Date.now(); if (S.lastIco && S.lastIco.id === 'bin' && now - S.lastIco.t < 500) { S.lastIco = null; openBin('dbl'); } else S.lastIco = { id: 'bin', t: now }; return; }
  if (win && t.closest('.dk-grip')) { e.preventDefault(); startResize(e, win); return; }
  if (ico) { e.preventDefault(); startIcon(e, ico); return; }
  if (win && t.closest('.dk-title')) { e.preventDefault(); startMove(e, win); return; }
  const files = t.closest('.dk-files');
  if (files && win && win.dataset.w.charAt(0) === 'f') { e.preventDefault(); startBand(e, files); return; }
  if (!win && t.closest('.dk-area') && !t.closest('.dk-bin')) { startBand(e, $root().querySelector('.dk-icons')); return; }
  if (S.os.sel) { S.os.sels = []; S.os.sel = null; markSel(); }
}
function onClick(e) {
  if (S.view !== 'play' || CC.ui.active) return;
  const t = e.target, win = t.closest('.dk-win'), b = t.closest('button'); if (!b) return;
  if (b.classList.contains('qz')) { const v = b.dataset.v; b.classList.add(S.tasks[S.ti] && v === S.tasks[S.ti].answer ? 'ok' : 'no'); emit({ t: 'pick', value: v }); return; }
  if (b.classList.contains('tb-start')) { openStart(); return; }
  if (b.classList.contains('tb-search')) { openSearch('bar'); return; }
  if (b.classList.contains('tb-snip')) { startSnip(); return; }
  if (b.classList.contains('tb-rec')) { toggleRec(); return; }
  if (b.classList.contains('app-un')) { uninstall(b.dataset.id, 'settings'); return; }
  if (b.classList.contains('dk-tb')) {
    const ref = b.dataset.w, w = winOf(ref); if (!w) return;
    if (w.min) restoreWin(ref, 'bar'); else if (front() !== w) { raise(ref, 'bar'); } else minWin(ref, 'bar'); return;
  }
  if (!win) return; const ref = win.dataset.w, folder = ref.slice(2);
  if (b.classList.contains('b-cls')) closeWin(ref, 'btn');
  else if (b.classList.contains('b-min')) minWin(ref, 'btn');
  else if (b.classList.contains('b-max')) toggleMax(ref, 'btn');
  else if (b.classList.contains('tool-new')) newFolder(folder, 'btn');
  else if (b.classList.contains('tool-del')) { if (S.os.sel && fileOf(S.os.sel) && fileOf(S.os.sel).parent === folder) deleteSel('btn'); else flash('Click a file first', 'bad'); }
  else if (b.classList.contains('tool-restore')) { if (S.os.sel && fileOf(S.os.sel) && fileOf(S.os.sel).parent === 'bin') putBack(S.os.sel, 'btn'); else flash('Click a file first', 'bad'); }
  else if (b.classList.contains('tool-empty')) emptyBin('btn');
}
function onEditKey(e) {
  const ed = e.target.closest && e.target.closest('.dk-edit'); if (!ed) return;
  e.stopPropagation();
  if (e.key === 'Enter') { e.preventDefault(); finishEdit(S.os.edit, ed.value, true); }
  else if (e.key === 'Escape') { e.preventDefault(); finishEdit(S.os.edit, ed.value, false); }
}
function shotKey(e) { const now = Date.now(); if (S.psAt && now - S.psAt < 600) return; S.psAt = now; fullShot('key'); }
function onKeyDown(e) {
  if (S.view !== 'play' || CC.ui.active || S.locked) return;
  if (e.key === 'PrintScreen') { e.preventDefault(); shotKey(e); return; }
  const tg = e.target && e.target.tagName; if (tg === 'INPUT' || tg === 'TEXTAREA') return;
  const mod = e.ctrlKey || e.metaKey, id = S.os.sel, k = String(e.key).toLowerCase(), sels = S.os.sels.length ? S.os.sels : (id ? [id] : []);
  if (e.key === 'Escape') { closeMenu(); closePanels(); return; }
  if (mod && k === 'a') { e.preventDefault(); selectAll('key'); return; }
  if (mod && k === 'z' && !e.shiftKey) { e.preventDefault(); doUndo('key'); return; }
  if (mod && k === 'f' && S.lv && S.lv.pro) { e.preventDefault(); openSearch('key'); return; }
  if (mod && k === 'x') { e.preventDefault(); copyFiles(sels, 'key', true); return; }
  if (mod && k === 'c') { e.preventDefault(); copyFiles(sels, 'key', false); return; }
  if (mod && k === 'v') { e.preventDefault(); pasteInto(openFolderOfFocus(), 'key'); return; }
  if ((e.key === 'Delete' || e.key === 'Backspace') && sels.length) { e.preventDefault(); const ids = sels.filter(function (i) { return fileOf(i); }); if (ids.length) moveFiles(ids, 'bin', 'key'); }
  else if (e.key === 'F2' && id) { e.preventDefault(); startEdit(id); }
  else if (e.key === 'Enter' && id && fileOf(id) && fileOf(id).parent !== 'bin') { e.preventDefault(); openFile(id, 'key'); }
}
function onKeyUp(e) { if (S.view === 'play' && e.key === 'PrintScreen' && !S.locked && !CC.ui.active) shotKey(e); }

/* ---------- tasks and levels ---------- */
function levelsFor() { return LEVELS.filter(function (l) { return !l.min || S.year >= l.min; }); }
function allDone() { return levelsFor().every(function (l) { return S.done[l.id]; }); }
function tasksFor(lv) { return lv.tasks.filter(function (t) { return (!t.min || S.year >= t.min) && (!t.max || S.year <= t.max); }); }
function clearTimers() { clearTimeout(S.timer); clearTimeout(S.flashT); }
function beginTask(i, again) {
  clearTimers(); S.ti = i; S.locked = false; S.miss = 0; closeMenu(); closePanels();
  const t = S.tasks[i];
  if (again && S.snap) S.os = JSON.parse(JSON.stringify(S.snap));
  else { if (t.scene) loadScene(t.scene); S.snap = JSON.parse(JSON.stringify(S.os)); }
  S.hintOn = S.year === 1 || (S.year === 4 && !!S.lv.pro) || !!again && S.hintOn;   /* Year 4 gets glowing hints from the start on the pro levels, Year 5 can ask for them, Year 6 gets none */
  if (S.os.rec && !again) { S.os.rec = null; clearInterval(S.recT); }
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
/* the certificate (a gold medal on A4 portrait) comes only when EVERY level for this year is done; CC.rewards draws it (name box, print, save as a picture) */
function certSkills() {
  const a = ['Open and close windows', 'Hide and show', 'Move and resize', 'Make folders', 'Sort files', 'The Recycle Bin'];
  if (S.year >= 2) a.splice(2, 0, 'Right-click menus');
  if (S.year >= 3) a.push('Rename', 'Copy and paste');
  if (S.year >= 4) a.push('Select many files', 'Split windows', 'Search', 'Shortcuts', 'Screenshots', 'Uninstall apps');
  return a;
}
function showCertificate(back) {
  if (!allDone()) return;
  CC.rewards.show({ cert: 'desktop', portrait: true, title: 'Desktop Skills certificate', game: DATA.NAME, year: S.year, levels: levelsFor().length, skills: certSkills() }, back || showHome);
}
function levelDone(lv, stars) {
  const vis = levelsFor(), idx = vis.indexOf(lv), last = idx === vis.length - 1, all = allDone();
  const next = !last && idx >= 0 ? vis[idx + 1] : null;
  CC.ui.show($stage(), { emoji: '<span class="gem-pop">' + gemSvg(lv, 150) + '</span>', stars: stars, title: all ? 'You are a Desktop Hero!' : 'You completed Level ' + lv.id + '!', text: all ? 'All ' + vis.length + ' levels done! Your medal is ready.' : 'New gem: ' + gemName(lv),
    buttons: [
      all ? { icon: '🎓', label: 'My medal', primary: true, keys: ['Enter', 'Space'], fn: function () { showCertificate(function () { levelDone(lv, stars); }); } } : next ? { icon: '▶', label: 'Next', primary: true, keys: ['Enter', 'Space'], fn: function () { startLevel(next.id); } } : { icon: '🗺️', label: 'Levels', primary: true, keys: ['Enter', 'Space'], fn: showHome },
      { icon: '💎', label: 'My gem', fn: function () { viewGem(lv, function () { levelDone(lv, stars); }); } },
      { icon: '🔁', label: '', fn: function () { startLevel(lv.id); } }, { icon: '🗺️', label: '', fn: showHome }] });
}
function viewGem(lv, back) { CC.rewards.gem(lv.gem, { title: gemName(lv), game: 'Level ' + lv.id + ' · ' + DATA.NAME }, back); }
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
  if (proHidden()) p.querySelector('.dk-hint').style.display = 'none';   /* Year 6: no hints on the pro levels */
}
function startLevel(id) {
  CC.ui.close(); clearTimers(); S.lv = LEVELS[id - 1]; S.tasks = tasksFor(S.lv); S.levelMiss = 0; S.view = 'play'; S.os = newOS();
  buildPlay(); beginTask(0);
}
function showHome() {
  CC.ui.close(); clearTimers(); closeMenu(); S.view = 'home'; S.lv = null;
  const R = $root(); R.innerHTML = '';
  const h = el('div', 'dk-home');
  h.innerHTML = '<div class="dk-h1">🪟 Desktop Skills</div><p class="dk-h2">' + (S.year >= 4 ? 'Be a real computer pro! Win a gem for every level, then your medal.' : 'Windows, folders and files, just like a real computer. Win a gem for every level!') + '</p><div class="dk-map"></div><div class="dk-certrow"></div>';
  const map = h.querySelector('.dk-map');
  levelsFor().forEach(function (lv) {
    const done = !!S.done[lv.id], n = tasksFor(lv).length;
    const b = el('button', 'dk-tile' + (done ? ' done' : ''), '<span class="n">' + lv.id + '</span><span class="ic">' + (done ? gemSvg(lv, 64) : lv.icon) + '</span><span class="nm">' + esc(lv.title) + '</span><span class="st">' + (done ? '⭐'.repeat(S.stars[lv.id] || 1) : n + (n === 1 ? ' step' : ' steps')) + '</span>');
    b.type = 'button'; b.addEventListener('click', function () { b.blur(); startLevel(lv.id); });
    if (done) { const pr = el('span', 'pr', '💎'); pr.setAttribute('role', 'button'); pr.setAttribute('tabindex', '0'); pr.title = 'See my ' + gemName(lv); pr.setAttribute('aria-label', 'see my ' + gemName(lv));
      const go = function (e) { e.stopPropagation(); e.preventDefault(); viewGem(lv, null); }; pr.addEventListener('click', go); pr.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') go(e); }); b.appendChild(pr); }
    map.appendChild(b);
  });
  const cr = h.querySelector('.dk-certrow'), ok = allDone(), cb = el('button', 'btn' + (ok ? ' primary' : ''), ok ? '🎓 My medal' : '🔒 Medal: win all ' + levelsFor().length + ' gems');
  cb.type = 'button'; cb.disabled = !ok; cb.addEventListener('click', function () { cb.blur(); showCertificate(); }); cr.appendChild(cb);
  R.appendChild(h);
}

CC.modes.desktop = {
  makey: false,
  enter: function (o) {
    S.year = Math.max(1, Math.min(6, Number(o && o.year) || 1)); CC.audio.init(); CC.watchStage($stage()); showHome();
  },
  exit: function () { clearInterval(S.recT); clearTimers(); closeMenu(); CC.ui.close(); S.view = 'home'; },
  onKeyDown: onKeyDown,
  onKeyUp: onKeyUp,
  /* test hooks (used only by the automated checks) */
  _S: S, _emit: emit, _begin: beginTask, _start: startLevel, _home: showHome, _api: api, _ops: { openFile: openFile, closeWin: closeWin, minWin: minWin, restoreWin: restoreWin, toggleMax: toggleMax, moveFile: moveFile, newFolder: newFolder, finishEdit: finishEdit, deleteFile: deleteFile, putBack: putBack, emptyBin: emptyBin, copyFile: copyFile, pasteInto: pasteInto, openBin: openBin, raise: raise, moveFiles: moveFiles, copyFiles: copyFiles, selectAll: selectAll, setSel: setSel, toggleSel: toggleSel, selectRange: selectRange, doUndo: doUndo, uninstall: uninstall, openSearch: openSearch, searchPick: searchPick, snapWin: snapWin, shotRect: shotRect, fullShot: fullShot, toggleRec: toggleRec, openSettings: openSettings, deleteSel: deleteSel }
};
})();
