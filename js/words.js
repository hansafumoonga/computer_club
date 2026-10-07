/* words.js - Word Hunt (Session 1): a word search about computers. 10 levels, easy words first, bigger and trickier each time.
   Drag across the letters (or tap the first and last letter, or use the arrow keys + Enter). No timer, no penalty, free hints. */
(function () {
'use strict';

/* =============== TEACHER SETTINGS - edit the words and levels here =============== */
/* [WORD IN CAPITALS, picture, tier]  tier 1 = easiest ... 5 = hardest. A level picks most of its words from its own tier and the rest from easier tiers. */
const WORD_LIST = [
  ['MOUSE', '🖱️', 1], ['FILE', '📄', 1], ['SAVE', '💾', 1], ['ICON', '🖼️', 1], ['WIFI', '📶', 1], ['CODE', '👩‍💻', 1], ['TYPE', '⌨️', 1], ['CLICK', '👆', 1],
  ['ROBOT', '🤖', 1], ['GAME', '🎮', 1], ['DATA', '📊', 1], ['LINK', '🔗', 1], ['MENU', '📋', 1], ['WEB', '🕸️', 1], ['APP', '📱', 1], ['PLAY', '▶️', 1], ['EDIT', '✏️', 1],
  ['SCREEN', '📺', 2], ['FOLDER', '📁', 2], ['LAPTOP', '💻', 2], ['TABLET', '📱', 2], ['CURSOR', '↖️', 2], ['EMAIL', '📧', 2], ['VIRUS', '🦠', 2], ['PRINT', '🖨️', 2],
  ['DELETE', '🗑️', 2], ['ONLINE', '🌐', 2], ['PHOTO', '📷', 2], ['VIDEO', '🎬', 2], ['MUSIC', '🎵', 2], ['SHARE', '📤', 2], ['WINDOW', '🪟', 2], ['SEARCH', '🔍', 2],
  ['PRINTER', '🖨️', 3], ['SPEAKER', '🔊', 3], ['MONITOR', '🖥️', 3], ['BROWSER', '🧭', 3], ['UPLOAD', '⬆️', 3], ['SCROLL', '📜', 3], ['CAMERA', '📸', 3], ['WEBSITE', '🌍', 3],
  ['PROGRAM', '📝', 3], ['NETWORK', '📡', 3], ['HEADSET', '🎧', 3], ['DESKTOP', '🖥️', 3],
  ['KEYBOARD', '⌨️', 4], ['INTERNET', '🌐', 4], ['PASSWORD', '🔑', 4], ['DOWNLOAD', '⬇️', 4], ['SOFTWARE', '💿', 4], ['HARDWARE', '🔧', 4], ['DOCUMENT', '📃', 4],
  ['PRIVACY', '🔒', 4], ['MEMORY', '🧠', 4], ['GRAPHICS', '🎨', 4], ['SETTINGS', '⚙️', 4], ['FIREWALL', '🧱', 4], ['BACKUP', '💽', 4],
  ['ALGORITHM', '🧮', 5], ['DATABASE', '🗄️', 5], ['BLUETOOTH', '🔵', 5], ['SECURITY', '🛡️', 5], ['SCREENSHOT', '🖼️', 5], ['TOUCHSCREEN', '🖐️', 5], ['ANIMATION', '🎞️', 5], ['PROCESSOR', '🔲', 5]
];
/* One line per level. size = grid squares across/down, words = how many to find, tier = how hard the words are,
   dirs = which ways words can run (E across, S down, SE/NE diagonals, W/N/SW/NW backwards = the tricky ones),
   hide = how many words only show their picture and number of letters (a mystery word!). */
const ALL8 = ['E', 'S', 'SE', 'NE', 'W', 'N', 'SW', 'NW'];
const LEVELS = [
  { size: 6,  words: 4,  tier: 1, dirs: ['E', 'S'],                          hide: 0 },
  { size: 7,  words: 5,  tier: 1, dirs: ['E', 'S'],                          hide: 0 },
  { size: 7,  words: 6,  tier: 2, dirs: ['E', 'S'],                          hide: 0 },
  { size: 8,  words: 6,  tier: 2, dirs: ['E', 'S', 'SE'],                    hide: 0 },
  { size: 9,  words: 7,  tier: 3, dirs: ['E', 'S', 'SE'],                    hide: 0 },
  { size: 10, words: 8,  tier: 3, dirs: ['E', 'S', 'SE', 'NE'],              hide: 0 },
  { size: 10, words: 9,  tier: 4, dirs: ['E', 'S', 'SE', 'NE', 'W', 'N'],    hide: 0 },
  { size: 11, words: 10, tier: 4, dirs: ALL8,                                 hide: 0 },
  { size: 12, words: 10, tier: 5, dirs: ALL8,                                 hide: 4 },
  { size: 12, words: 12, tier: 5, dirs: ALL8,                                 hide: 6 }
];
/* ================================================================================= */

const D = { E: [0, 1], W: [0, -1], S: [1, 0], N: [-1, 0], SE: [1, 1], NE: [-1, 1], SW: [1, -1], NW: [-1, -1] };
const COLORS = ['#ff8fa8', '#ffc070', '#ffe666', '#7ee08a', '#6adcec', '#a898ff', '#ff9ae0', '#b8e060', '#78a8ff', '#e8b080', '#60d8b0', '#ff8870'];
const GAP = 8, PAD = 18;
const $ = function (id) { return document.getElementById(id); };
let level = 0, grid = [], words = [], cellEls = [], found = {}, sel = null, cursor = null, firstClick = null, built = false, size = 7, stageEl = null, dragging = false, cell = 44;
const stars = {};                         // stars earned this visit (not saved anywhere)

function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

function pickWords(lv) {
  const fit = function (w) { return w[0].length <= lv.size; };
  const mine = shuffle(WORD_LIST.filter(function (w) { return w[2] === lv.tier && fit(w); }));
  const easier = shuffle(WORD_LIST.filter(function (w) { return w[2] < lv.tier && fit(w); }));
  const nMine = Math.min(mine.length, Math.ceil(lv.words * (lv.tier === 1 ? 1 : 0.6)));
  let pool = mine.slice(0, nMine).concat(easier.slice(0, lv.words - nMine));
  if (pool.length < lv.words) pool = pool.concat(mine.slice(nMine, nMine + lv.words - pool.length));
  return shuffle(pool).slice(0, lv.words);
}
function generate(lv) {
  const n = lv.size;
  for (let attempt = 0; attempt < 80; attempt++) {
    const g = []; for (let r = 0; r < n; r++) { g.push([]); for (let c = 0; c < n; c++) g[r].push(''); }
    const pool = pickWords(lv).sort(function (a, b) { return b[0].length - a[0].length; }), placed = [];
    let ok = true;
    for (const w of pool) {
      let done = false;
      for (let t = 0; t < 150 && !done; t++) {
        const dn = lv.dirs[Math.floor(Math.random() * lv.dirs.length)], d = D[dn], len = w[0].length;
        const r0 = Math.floor(Math.random() * n), c0 = Math.floor(Math.random() * n);
        const r1 = r0 + d[0] * (len - 1), c1 = c0 + d[1] * (len - 1);
        if (r1 < 0 || c1 < 0 || r1 >= n || c1 >= n) continue;
        let fits = true; for (let i = 0; i < len; i++) { const ch = g[r0 + d[0] * i][c0 + d[1] * i]; if (ch && ch !== w[0][i]) { fits = false; break; } }
        if (!fits) continue;
        const cells = []; for (let i = 0; i < len; i++) { g[r0 + d[0] * i][c0 + d[1] * i] = w[0][i]; cells.push([r0 + d[0] * i, c0 + d[1] * i]); }
        placed.push({ word: w[0], icon: w[1], cells: cells, dn: dn }); done = true;
      }
      if (!done) { ok = false; break; }
    }
    if (!ok) continue;
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!g[r][c]) g[r][c] = letters[Math.floor(Math.random() * 26)];
    shuffle(placed).slice(0, lv.hide).forEach(function (w) { w.hidden = true; });
    placed.sort(function (a, b) { return a.word.length - b.word.length || (a.word < b.word ? -1 : 1); });
    return { grid: g, words: placed };
  }
  return null;
}

/* ---- layout: cells shrink to fit the window so the board always looks tidy ---- */
function fit() {
  const availH = Math.max(260, window.innerHeight - 262), availW = Math.max(260, Math.min(window.innerWidth, 1100) - (window.innerWidth < 800 ? 40 : 400));
  cell = Math.max(28, Math.min(64, Math.floor(Math.min(availH, availW) / size) - GAP));
  $('stage-words').style.setProperty('--cell', cell + 'px');
  const px = size * (cell + GAP) - GAP + PAD * 2, svg = $('wh-svg'); svg.setAttribute('width', px); svg.setAttribute('height', px); svg.setAttribute('viewBox', '0 0 ' + px + ' ' + px);
  const board = $('wh-board'); board.style.width = px + 'px'; board.style.height = px + 'px';
}
function center(r, c) { return [PAD + c * (cell + GAP) + cell / 2, PAD + r * (cell + GAP) + cell / 2]; }
function capsule(cells, color, op) {
  const a = center(cells[0][0], cells[0][1]), b = center(cells[cells.length - 1][0], cells[cells.length - 1][1]);
  return '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '" stroke="' + color + '" stroke-width="' + (cell * 0.82) + '" stroke-linecap="round" opacity="' + op + '"/>';
}
function paintSvg() {
  let h = '';
  words.forEach(function (w) { if (found[w.word]) h += capsule(w.cells, w.color, 0.62); });
  if (sel && sel.length > 1) h += capsule(sel, '#ffd23f', 0.75);
  $('wh-svg').innerHTML = h;
}
function renderLevels() {
  const box = $('wh-levels'); box.innerHTML = '';
  LEVELS.forEach(function (lv, i) {
    const b = document.createElement('button'); b.className = 'wh-lvl' + (i === level ? ' cur' : '') + (stars[i] ? ' done' : ''); b.textContent = i + 1; b.setAttribute('aria-label', 'level ' + (i + 1));
    if (stars[i]) { const s = document.createElement('i'); s.textContent = '⭐'; b.appendChild(s); }
    b.addEventListener('click', function () { b.blur(); CC.audio.init(); level = i; newRound(); });
    box.appendChild(b);
  });
}
function render() {
  size = LEVELS[level].size; fit();
  const g = $('wh-grid'); g.innerHTML = ''; g.style.gridTemplateColumns = 'repeat(' + size + ', var(--cell))'; cellEls = [];
  for (let r = 0; r < size; r++) { cellEls.push([]); for (let c = 0; c < size; c++) {
    const el = document.createElement('div'); el.className = 'ws-cell'; el.textContent = grid[r][c]; el.dataset.r = r; el.dataset.c = c; g.appendChild(el); cellEls[r].push(el);
  } }
  const ul = $('wh-list'); ul.innerHTML = ''; ul.classList.toggle('dense', words.length > 8);
  words.forEach(function (w, i) { w.color = COLORS[i % COLORS.length]; const li = document.createElement('li'); li.innerHTML = '<span class="e">' + w.icon + '</span><span class="t"></span><span class="ck">✔</span>'; ul.appendChild(li); w.li = li; });
  renderLevels(); paint();
}
function paint() {
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) cellEls[r][c].className = 'ws-cell';
  words.forEach(function (w) {
    const done = !!found[w.word];
    w.li.classList.toggle('done', done); w.li.style.setProperty('--wc', w.color);
    w.li.querySelector('.t').textContent = w.hidden && !done ? w.word.split('').map(function () { return '_'; }).join(' ') : w.word;
  });
  if (sel) sel.forEach(function (x) { cellEls[x[0]][x[1]].classList.add('sel'); });
  if (cursor) cellEls[cursor[0]][cursor[1]].classList.add('cur');
  if (firstClick) cellEls[firstClick[0]][firstClick[1]].classList.add('sel');
  paintSvg();
}
/* straight line of cells from a to b (null if they are not in a straight line) */
function line(a, b) {
  const dr = b[0] - a[0], dc = b[1] - a[1], n = Math.max(Math.abs(dr), Math.abs(dc));
  if (n === 0) return [a]; if (!(dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc))) return null;
  const sr = Math.sign(dr), sc = Math.sign(dc), out = []; for (let i = 0; i <= n; i++) out.push([a[0] + sr * i, a[1] + sc * i]); return out;
}
function check(cells) {
  const s = cells.map(function (x) { return grid[x[0]][x[1]]; }).join(''), rs = s.split('').reverse().join('');
  const w = words.filter(function (x) { return !found[x.word] && (x.word === s || x.word === rs); })[0];
  if (!w) return false;
  found[w.word] = true; CC.sfx.good(); CC.audio.tone(1175, { delay: 0.12, dur: 0.25, vol: 0.12 });
  sel = null; firstClick = null; paint();
  if (words.every(function (x) { return found[x.word]; })) setTimeout(levelDone, 700);
  return true;
}
function levelDone() {
  const last = level >= LEVELS.length - 1; stars[level] = Math.max(stars[level] || 0, 1); renderLevels();
  CC.ui.show(stageEl, { emoji: last ? '🏆' : '🎉', stars: 3, title: last ? 'You found them all!' : 'Level ' + (level + 1) + ' done!',
    buttons: [last ? { icon: '🔁', label: 'Again', keys: ['Space', 'Enter'], primary: true, fn: function () { level = 0; newRound(); } }
      : { icon: '▶', label: 'Next', keys: ['Space', 'Enter'], primary: true, fn: function () { level++; newRound(); } },
    { icon: '↻', label: 'Replay', keys: ['ArrowUp'], fn: function () { newRound(); } }, { icon: '🏠', label: 'Menu', fn: function () { CC.goMenu(); } }] });
}
function newRound() {
  CC.ui.close(); const p = generate(LEVELS[level]); grid = p.grid; words = p.words; found = {}; sel = null; cursor = [0, 0]; firstClick = null; render();
}
/* ---- pointer: drag a line across letters, or tap first + last letter ---- */
function cellAt(x, y) { const el = document.elementFromPoint(x, y); if (el && el.classList.contains('ws-cell')) return [+el.dataset.r, +el.dataset.c]; return null; }
function onDown(e) { const c = cellAt(e.clientX, e.clientY); if (!c) return; CC.audio.init(); dragging = true; sel = [c]; cursor = c; paint(); e.preventDefault(); }
function onMove(e) {
  if (!dragging) return; const c = cellAt(e.clientX, e.clientY); if (!c) return;
  const l = line(sel[0], c); if (l) { sel = l; paint(); }
}
function onUp() {
  if (!dragging) return; dragging = false;
  if (sel && sel.length > 1) { if (!check(sel)) { sel = null; firstClick = null; CC.sfx.tick(); paint(); } }
  else if (sel) {                     // a single tap: remember the first letter, second tap = last letter
    const c = sel[0];
    if (firstClick) { const l = line(firstClick, c); sel = null; if (l && l.length > 1 && check(l)) { firstClick = null; } else { firstClick = c; } }
    else { firstClick = c; sel = null; }
    paint();
  }
}
function hint() {
  CC.audio.init(); const w = words.filter(function (x) { return !found[x.word]; })[0]; if (!w) return;
  const el = cellEls[w.cells[0][0]][w.cells[0][1]]; el.classList.remove('hint'); void el.offsetWidth; el.classList.add('hint'); CC.sfx.pickup();
}
CC.modes.words = {
  makey: false,
  enter: function () {
    CC.audio.init();
    if (!built) {
      built = true; stageEl = $('stage-words'); CC.watchStage(stageEl);
      $('wh-grid').addEventListener('pointerdown', onDown); window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp);
      window.addEventListener('resize', function () { if (grid.length && !$('mode-words').hidden) { fit(); paint(); } });
      $('wh-hint').addEventListener('click', function () { this.blur(); hint(); });
      $('wh-new').addEventListener('click', function () { this.blur(); newRound(); });
    }
    level = 0; newRound();
  },
  exit: function () { CC.ui.close(); },
  onKeyDown: function (e) {
    if (!grid.length || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key, mv = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[k];
    if (mv) { e.preventDefault(); cursor = cursor || [0, 0]; cursor = [CC.clamp(cursor[0] + mv[0], 0, size - 1), CC.clamp(cursor[1] + mv[1], 0, size - 1)]; if (firstClick) { const l = line(firstClick, cursor); sel = l; } paint(); }
    else if (k === 'Enter' || k === ' ') {
      e.preventDefault(); cursor = cursor || [0, 0];
      if (!firstClick) { firstClick = cursor.slice(); sel = [firstClick]; CC.sfx.tick(); }
      else { const l = line(firstClick, cursor); if (l && l.length > 1 && check(l)) { firstClick = null; } else { firstClick = null; sel = null; CC.sfx.tick(); } }
      paint();
    } else if (k === 'Escape') { firstClick = null; sel = null; paint(); }
  },
  _state: function () { return { level: level, size: size, grid: grid, words: words.map(function (w) { return { word: w.word, cells: w.cells, dn: w.dn, hidden: !!w.hidden }; }), found: found }; },
  _levels: LEVELS, _words: WORD_LIST
};
})();
