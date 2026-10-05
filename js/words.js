/* words.js - Word Hunt (Session 1): a word search about computers. Find the hidden words!
   Drag across the letters (or click the first and last letter, or use the arrow keys + Enter).
   6 rounds that get bigger and trickier. Gentle by design: no timer, no penalty, free hints. */
(function () {
'use strict';

/* =============== TEACHER SETTINGS - edit the words and rounds here =============== */
const WORD_LIST = [                       // [WORD IN CAPITALS, picture]
  ['KEYBOARD', '⌨️'], ['MOUSE', '🖱️'], ['MONITOR', '🖥️'], ['SCREEN', '📺'], ['INTERNET', '🌐'], ['FOLDER', '📁'], ['FILE', '📄'],
  ['PRINTER', '🖨️'], ['SPEAKER', '🔊'], ['PASSWORD', '🔑'], ['BROWSER', '🧭'], ['EMAIL', '📧'], ['DOWNLOAD', '⬇️'], ['SAVE', '💾'],
  ['DELETE', '🗑️'], ['LAPTOP', '💻'], ['CLICK', '👆'], ['ROBOT', '🤖'], ['WIFI', '📶'], ['ICON', '🖼️'], ['CODE', '👩‍💻'], ['CURSOR', '↖️'], ['TABLET', '📱'], ['VIRUS', '🦠']
];
/* size = grid squares across/down, words = how many to find, dirs = which ways words can run:
   E = across, S = down, SE/NE = diagonals, W/N/SW/NW = backwards (the tricky ones!) */
const ROUNDS = [
  { size: 7,  words: 5,  dirs: ['E', 'S'] },
  { size: 8,  words: 6,  dirs: ['E', 'S'] },
  { size: 9,  words: 7,  dirs: ['E', 'S', 'SE'] },
  { size: 10, words: 8,  dirs: ['E', 'S', 'SE', 'NE'] },
  { size: 11, words: 9,  dirs: ['E', 'S', 'SE', 'NE', 'W', 'N'] },
  { size: 12, words: 10, dirs: ['E', 'S', 'SE', 'NE', 'W', 'N', 'SW', 'NW'] }
];
/* ================================================================================= */

const D = { E: [0, 1], W: [0, -1], S: [1, 0], N: [-1, 0], SE: [1, 1], NE: [-1, 1], SW: [1, -1], NW: [-1, -1] };
const COLORS = ['#ffb3c1', '#ffd9a0', '#fff3a0', '#b8f0b8', '#a0e8f0', '#c8b8ff', '#ffc8f0', '#d0f0a0', '#a0c8ff', '#f0d0b0'];
const $ = function (id) { return document.getElementById(id); };
let round = 0, grid = [], words = [], cellEls = [], found = {}, sel = null, cursor = null, firstClick = null, built = false, size = 7, stageEl = null, dragging = false;

function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

function generate(rd) {
  const n = rd.size;
  for (let attempt = 0; attempt < 60; attempt++) {
    const g = []; for (let r = 0; r < n; r++) { g.push([]); for (let c = 0; c < n; c++) g[r].push(''); }
    const pool = shuffle(WORD_LIST.filter(function (w) { return w[0].length <= n; })).slice(0, rd.words), placed = [];
    let ok = true;
    for (const w of pool) {
      let done = false;
      for (let t = 0; t < 120 && !done; t++) {
        const dn = rd.dirs[Math.floor(Math.random() * rd.dirs.length)], d = D[dn], len = w[0].length;
        const r0 = Math.floor(Math.random() * n), c0 = Math.floor(Math.random() * n);
        const r1 = r0 + d[0] * (len - 1), c1 = c0 + d[1] * (len - 1);
        if (r1 < 0 || c1 < 0 || r1 >= n || c1 >= n) continue;
        let fits = true; for (let i = 0; i < len; i++) { const ch = g[r0 + d[0] * i][c0 + d[1] * i]; if (ch && ch !== w[0][i]) { fits = false; break; } }
        if (!fits) continue;
        const cells = []; for (let i = 0; i < len; i++) { g[r0 + d[0] * i][c0 + d[1] * i] = w[0][i]; cells.push([r0 + d[0] * i, c0 + d[1] * i]); }
        placed.push({ word: w[0], icon: w[1], cells: cells, r: r0, c: c0, dn: dn }); done = true;
      }
      if (!done) { ok = false; break; }
    }
    if (!ok) continue;
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!g[r][c]) g[r][c] = letters[Math.floor(Math.random() * 26)];
    return { grid: g, words: placed };
  }
  return null;
}
function msgDots() { const box = $('wh-dots'); box.innerHTML = ''; ROUNDS.forEach(function (r, i) { const d = document.createElement('i'); if (i <= round) d.className = 'on'; box.appendChild(d); }); }
function render() {
  size = ROUNDS[round].size;
  const g = $('wh-grid'); g.innerHTML = ''; g.style.gridTemplateColumns = 'repeat(' + size + ', auto)'; cellEls = [];
  for (let r = 0; r < size; r++) { cellEls.push([]); for (let c = 0; c < size; c++) {
    const el = document.createElement('div'); el.className = 'ws-cell'; el.textContent = grid[r][c]; el.dataset.r = r; el.dataset.c = c; g.appendChild(el); cellEls[r].push(el);
  } }
  const ul = $('wh-list'); ul.innerHTML = '';
  words.forEach(function (w, i) { const li = document.createElement('li'); li.innerHTML = '<span class="e">' + w.icon + '</span><span>' + w.word + '</span>'; ul.appendChild(li); w.li = li; w.color = COLORS[i % COLORS.length]; });
  msgDots(); paint();
}
function paint() {
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) { const el = cellEls[r][c]; el.className = 'ws-cell'; el.style.background = ''; }
  words.forEach(function (w) { if (found[w.word]) w.cells.forEach(function (x) { const el = cellEls[x[0]][x[1]]; el.classList.add('found'); el.style.background = w.color; }); w.li.classList.toggle('done', !!found[w.word]); });
  if (sel) sel.forEach(function (x) { const el = cellEls[x[0]][x[1]]; el.classList.add('sel'); el.style.background = ''; });
  if (cursor) cellEls[cursor[0]][cursor[1]].classList.add('cur');
  if (firstClick) cellEls[firstClick[0]][firstClick[1]].classList.add('sel');
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
  if (w) {
    found[w.word] = true; CC.sfx.good(); CC.audio.tone(1175, { delay: 0.12, dur: 0.25, vol: 0.12 });
    const mid = cells[Math.floor(cells.length / 2)], el = cellEls[mid[0]][mid[1]], gr = $('wh-grid').getBoundingClientRect(), er = el.getBoundingClientRect();
    void gr; void er; sel = null; firstClick = null; paint();
    if (words.every(function (x) { return found[x.word]; })) setTimeout(roundDone, 600);
    return true;
  }
  return false;
}
function roundDone() {
  const last = round >= ROUNDS.length - 1;
  CC.sfx.levelComplete();
  CC.ui.show(stageEl, { emoji: last ? '🏆' : '🎉', stars: 3, title: last ? 'You found them all!' : 'Round ' + (round + 1) + ' done!',
    buttons: [last ? { icon: '🔁', label: 'Again', keys: ['Space', 'Enter'], primary: true, fn: function () { round = 0; newRound(); } }
      : { icon: '▶', label: 'Next', keys: ['Space', 'Enter'], primary: true, fn: function () { round++; newRound(); } },
    { icon: '🏠', label: 'Menu', fn: function () { CC.goMenu(); } }] });
}
function newRound() {
  CC.ui.close(); const p = generate(ROUNDS[round]); grid = p.grid; words = p.words; found = {}; sel = null; cursor = [0, 0]; firstClick = null; render();
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
      const g = $('wh-grid'); g.addEventListener('pointerdown', onDown); window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp);
      $('wh-hint').addEventListener('click', function () { this.blur(); hint(); });
      $('wh-new').addEventListener('click', function () { this.blur(); newRound(); });
    }
    round = 0; newRound();
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
  _state: function () { return { round: round, grid: grid, words: words.map(function (w) { return { word: w.word, cells: w.cells, dn: w.dn }; }), found: found }; }
};
})();
