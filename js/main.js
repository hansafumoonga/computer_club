/* main.js - the hub: pick a year, pick a game, route keys. Just show/hide - no reloads. */
(function () {
'use strict';
const app = CC.app;

const MODES = {
  skills:   { icon: '🖱️', name: 'Click & Type Quest', desc: 'Learn the mouse and keyboard', tag: 'Mouse + keyboard', color: '#ff7ac8' },
  fruit:    { icon: '🍉', name: 'Slice & Pop',   desc: 'Press the letter to slice or pop!', tag: 'Keyboard', color: '#ff6b86' },
  words:    { icon: '🔤', name: 'Word Hunt',     desc: 'Computer words crossword',        tag: 'Mouse', color: '#22c6c6' },
  jump:     { icon: '🏃', name: 'Jump Over!',    desc: 'Hop over things, duck under bees', tag: 'Arrow keys or Makey Makey', color: '#ffd23f' },
  blaster:  { icon: '🚀', name: 'Star Blaster',  desc: 'Pop the friendly space rocks',    tag: 'Arrow keys or Makey Makey', color: '#6bcb77' },
  piano:    { icon: '🎹', name: 'Piano',         desc: 'Play songs on 5 keys',            tag: 'Arrow keys or Makey Makey', color: '#ff9f45' },
  commando: { icon: '🤖', name: 'Commando Run',  desc: 'Run, jump and blast the bots',    tag: 'Arrow keys or Makey Makey', color: '#a77bff' },
  pattern:  { icon: '🎵', name: 'Pattern Pop!',  desc: 'Watch, listen and copy',          tag: 'Arrow keys or Makey Makey', color: '#22c6c6' },
  /* Builder Club has two doors; each year gets the one that suits it (the same game, opened on the right door) */
  buildclick: { icon: '🏗️', name: 'Click & Build', desc: 'Click, drag and build a car, a house, a city!', tag: 'Mouse', color: '#22b8cf', mode: 'builder', args: { door: 'click' } },
  buildtype:  { icon: '🏗️', name: 'Type & Build',  desc: 'Type the word to build a car, a house, a city!', tag: 'Keyboard', color: '#ff7a45', mode: 'builder', args: { door: 'type' } },
  typing:   { icon: '⌨️', name: 'Typing Club',   desc: 'Race, pop balloons, beat the boss', tag: 'Full keyboard', color: '#5ac8ff' }
};
/* what each year can play, easiest and most suitable first. Jump Over! is for everyone. */
const YEARS = {
  '1': { modes: ['buildclick', 'skills', 'fruit', 'jump', 'piano'] },
  '2': { modes: ['buildtype', 'skills', 'fruit', 'words', 'jump', 'blaster', 'piano'] },
  '3': { modes: ['skills', 'words', 'fruit', 'blaster', 'jump', 'pattern', 'piano'] },
  '4': { modes: ['typing', 'commando', 'jump', 'blaster', 'pattern', 'words', 'piano'] },
  '5': { modes: ['typing', 'commando', 'jump', 'blaster', 'pattern', 'words', 'piano'] },
  '6': { modes: ['typing', 'commando', 'jump', 'blaster', 'pattern', 'piano'] }
};
const YEAR_COLORS = ['#ff5c72', '#ff9f45', '#ffd23f', '#6bcb77', '#22c6c6', '#a77bff'];
const $ = function (id) { return document.getElementById(id); };
/* which music plays where (the piano has none: you ARE the music). Level games pick their own stage tune on top of this. */
const MUSIC = { skills: null, fruit: 'fruit', words: 'words', jump: 'jump', blaster: 'blaster', commando: 'commando', pattern: 'pattern', piano: null, typing: null, buildclick: 'words', buildtype: 'words' };

function showOnly(el) {
  document.querySelectorAll('.screen, .mode').forEach(function (s) { s.hidden = true; });
  el.hidden = false;
}
function leaveMode() {
  const m = CC.modes[app.mode];
  if (m && m.exit) m.exit();
  CC.paused = false; if (CC.audio.ctx) CC.audio.ctx.resume(); CC.ui.close(); CC.held = {}; app.mode = null; CC.music.stop();
  document.querySelectorAll('.pause-btn').forEach(function (b) { b.textContent = '⏸'; b.classList.remove('on'); });
}
function showSessions() { leaveMode(); app.session = null; showOnly($('screen-session')); }
function showMenu() {
  if (!app.session) { showSessions(); return; }
  leaveMode();
  const y = YEARS[app.session];
  $('menu-title').textContent = 'Year ' + app.session;
  const box = $('mode-cards'); box.innerHTML = '';
  y.modes.forEach(function (id) {
    const m = MODES[id], b = document.createElement('button');
    b.className = 'mode-card'; b.style.setProperty('--c', m.color); b.dataset.mode = id;
    b.innerHTML = '<span class="ic">' + m.icon + '</span><span class="nm">' + m.name + '</span><span class="ds">' + m.desc + '</span><span class="tg">' + m.tag + '</span>';
    b.addEventListener('click', function () { startMode(id); });
    box.appendChild(b);
  });
  showOnly($('screen-menu'));
  CC.music.play('menu');
}
function startMode(id) {
  CC.audio.init();                      // the click that got us here is the user gesture
  leaveMode();
  const m = MODES[id], real = m.mode || id;       // an entry can open another game on a chosen door (Builder Club)
  app.mode = real; CC.held = {};
  showOnly($('mode-' + real));
  if (MUSIC[id]) CC.music.play(MUSIC[id]);
  CC.modes[real].enter(Object.assign({ year: Number(app.session) }, m.args || {}));
}
CC.goMenu = showMenu;

/* the landing page: one card per year */
(function buildYearCards() {
  const box = $('year-cards');
  Object.keys(YEARS).forEach(function (n, i) {
    const b = document.createElement('button'); b.className = 'year-card'; b.style.setProperty('--c', YEAR_COLORS[i]); b.dataset.year = n; b.setAttribute('aria-label', 'Year ' + n);
    b.innerHTML = '<span class="yk">' + n + '</span><span class="yn">Year ' + n + '</span>';
    b.addEventListener('click', function () { CC.audio.init(); app.session = n; CC.sfx.good(); showMenu(); });
    box.appendChild(b);
  });
})();
/* the Home / About menu on the landing page */
document.querySelectorAll('[data-nav]').forEach(function (b) {
  b.addEventListener('click', function () {
    b.blur(); CC.audio.init();
    if (b.dataset.nav === 'home') showSessions(); else { leaveMode(); app.session = null; showOnly($('screen-' + b.dataset.nav)); }
  });
});
$('btn-change-session').addEventListener('click', function () { this.blur(); showSessions(); });
document.querySelectorAll('[data-action="menu"]').forEach(function (b) { b.addEventListener('click', function () { b.blur(); showMenu(); }); });

/* ---- a pause button in the top bar of every game (not the free-play piano or the skills lessons, which have their own) ---- */
document.querySelectorAll('.mode > .topbar').forEach(function (tb) {
  const id = tb.parentNode.id.replace('mode-', ''); if (!CC.pausable[id]) return;
  const p = document.createElement('button'); p.className = 'btn pause-btn'; p.textContent = '⏸'; p.setAttribute('aria-label', 'pause'); p.title = 'Pause';
  p.addEventListener('click', function () { p.blur(); CC.togglePause(id); }); tb.insertBefore(p, tb.lastElementChild);
});

/* ---- music on/off button in every top bar ---- */
document.querySelectorAll('.topbar').forEach(function (tb) {
  const b = document.createElement('button'); b.className = 'btn music-btn'; b.textContent = '🎵'; b.setAttribute('aria-label', 'music on or off');
  b.addEventListener('click', function () { b.blur(); CC.music.toggleMute(); });
  const last = tb.lastElementChild; if (last && last.tagName === 'SPAN' && !last.textContent.trim() && !last.id) tb.replaceChild(b, last); else tb.insertBefore(b, last);
});

/* ---- keyboard routing ---- */
window.addEventListener('keydown', function (e) {
  CC.held[e.code] = true;
  if (CC.audio.ctx && CC.audio.ctx.state === 'suspended') CC.audio.ctx.resume();
  if (CC.ui.handleKey(e)) return;
  if (e.code === 'Escape' && !e.repeat && CC.pausable[app.mode] && ['jump', 'blaster', 'commando', 'pattern', 'typing'].indexOf(app.mode) >= 0) { CC.togglePause(app.mode); return; }
  const m = CC.modes[app.mode]; if (!m) return;
  // Only the 5 Makey Makey keys are blocked, and only in the Makey modes. Full-keyboard modes keep normal key behaviour.
  if (m.makey && CC.MAKEY_KEYS.indexOf(e.code) >= 0) e.preventDefault();
  if (m.onKeyDown) m.onKeyDown(e);
});
window.addEventListener('keyup', function (e) {
  CC.held[e.code] = false;
  const m = CC.modes[app.mode]; if (!m) return;
  if (m.makey && CC.MAKEY_KEYS.indexOf(e.code) >= 0) e.preventDefault();
  else if ((app.mode === 'jump' || app.mode === 'blaster') && (e.code === 'Space')) e.preventDefault();   // stops a focused button "clicking" on Space
  if (m.onKeyUp) m.onKeyUp(e);
});
window.addEventListener('blur', function () { CC.held = {}; });
document.addEventListener('visibilitychange', function () {
  if (document.hidden) CC.held = {};
  if (CC.audio.ctx) { if (document.hidden) CC.audio.ctx.suspend(); else if (!CC.paused) CC.audio.ctx.resume(); }   // no music in a hidden tab
});

/* ---- landing page art: keycap logo and the drifting keys in the background ---- */
(function buildLanding() {
  const pal = [['#ff5c72', '#d8334e'], ['#ff9f45', '#e07a1a'], ['#ffd23f', '#e0a800'], ['#6bcb77', '#3fa84f'], ['#22c6c6', '#139a9a']];
  function row(id, word, off) {
    const box = $(id); word.split('').forEach(function (ch, i) {
      const k = document.createElement('span'), p = pal[(i + off) % 5]; k.className = 'kcl'; k.textContent = ch;
      k.style.setProperty('--c', p[0]); k.style.setProperty('--c2', p[1]); k.style.setProperty('--i', (i * 0.25) + 's'); box.appendChild(k);
    });
  }
  row('logo1', 'TECH', 0); row('logo2', 'EXPLORERS', 2);
  const dr = $('drift'), chars = 'ABCDEFGHJKLMNOPRSTUW←↑↓→';
  for (let i = 0; i < 16; i++) { const e = document.createElement('i'); e.textContent = chars[(i * 7) % chars.length]; e.style.left = (i * 6.3 + (i % 3) * 2) + '%';
    e.style.setProperty('--c', pal[i % 5][0]); e.style.setProperty('--d', (16 + (i % 5) * 4) + 's'); e.style.setProperty('--w', (-i * 2.3) + 's'); dr.appendChild(e); }
})();

showOnly($('screen-session'));
})();
