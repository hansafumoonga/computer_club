/* main.js - the hub: pick a year, pick a game, route keys. Just show/hide - no reloads. */
(function () {
'use strict';
const app = CC.app;

const MODES = {
  skills:   { icon: '🗺️', name: 'Click & Type Quest', desc: 'Learn the mouse and keyboard', color: '#ff7ac8', cert: true },
  fruit:    { icon: '🍉', name: 'Slice & Pop',   desc: 'Press the letter to slice or pop!', color: '#ff6b86' },
  words:    { icon: '🔤', name: 'Word Hunt',     desc: 'Find the computer words', color: '#22c6c6' },
  jump:     { icon: '🏃', name: 'Jump Over!',    desc: 'Jump over obstacles, duck under bees', color: '#ffd23f' },
  blaster:  { icon: '🚀', name: 'Star Blaster',  desc: 'Pop the friendly asteroids', color: '#6bcb77' },
  piano:    { icon: '🎹', name: 'Piano',         desc: 'Play songs on 5 keys', color: '#ff9f45' },
  commando: { icon: '🤖', name: 'Commando Run',  desc: 'Run, jump and blast the bots', color: '#a77bff' },
  pattern:  { icon: '🎵', name: 'Pattern Pop!',  desc: 'Watch, listen and copy', color: '#22c6c6' },
  /* Builder Club has two doors; each year gets the one that suits it (the same game, opened on the right door) */
  mouseclub: { icon: '🖱️', name: 'Mouse Club', desc: 'Move, click, drag and scroll, one skill at a time', color: '#22b8cf', cert: true },
  buildclick: { icon: '🏗️', name: 'Click & Build', desc: 'Click, drag and build a car, a house, a city!', color: '#22b8cf', cert: true, mode: 'builder', args: { door: 'click' } },
  buildtype:  { icon: '🏗️', name: 'Type & Build',  desc: 'Type the word to build a car, a house, a city!', color: '#ff7a45', cert: true, mode: 'builder', args: { door: 'type' } },
  magic:    { icon: '✨', name: 'Magic Mix',     desc: 'Watch colours mix and paint a picture', color: '#ffb52e' },
  art:      { icon: '🖌️', name: 'Art Studio',    desc: 'Brushes, shapes, stamps and more', color: '#ff7a45' },
  scene:    { icon: '🖼️', name: 'Scene Maker',   desc: 'Drag, arrange and paint a scene', color: '#22b8cf' },
  design:   { icon: '🎛️', name: 'Design Studio', desc: 'Layers, text, symmetry and more tools', color: '#ff7a45' },
  magiclab: { icon: '🔮', name: 'Magic Lab',     desc: 'Kaleidoscopes, spirals and colour harmony', color: '#a77bff' },
  shortcuts:{ icon: '⚡', name: 'Shortcut Lab',  desc: 'Learn keyboard shortcuts that really work', color: '#a77bff' },
  desktop:  { icon: '🪟', name: 'Desktop Skills', desc: 'Windows, folders and files, like a real computer', color: '#4d8dff', cert: true },
  paint:    { icon: '🎨', name: 'Paint Studio',  desc: 'Colour animals, houses, cars and more', color: '#ff7ac8' },
  parts:    { icon: '🖥️', name: 'Parts of a Computer', desc: 'Name the parts, plug them in and power on', color: '#4d8dff', cert: true },
  letter:   { icon: '📝', name: 'Type a Letter', desc: 'A real word processor', color: '#ff7a45', cert: true },
  grid:     { icon: '🔢', name: 'Number Grid',   desc: 'A real spreadsheet with formulas and charts', color: '#3fa84f', cert: true },
  network:  { icon: '🌐', name: 'Network Builder', desc: 'Join computers with a switch and a router', color: '#22c6c6', cert: true },
  typing:   { icon: '⌨️', name: 'Typing Club',   desc: 'Race, pop balloons, beat the boss, catch the rain', color: '#5ac8ff', cert: true }
};
/* THE LEARNING PATH: every game in the order a learner needs the skills, from the very first one to the hardest.
   Each game builds on the ones before it, so each year's menu is this list with only that year's games in it, numbered 1, 2, 3 ...
     1 the mouse (move, click, drag, scroll)        2 clicking and dragging to build        3 what the parts of a computer are
     4 mouse and keyboard together (the Quest)      5 single letter keys                    6 typing whole words
     7 computer words                               8 proper typing                         9 windows, folders and files
    10 keyboard shortcuts                          11 writing a letter                     12 numbers and spreadsheets
    13 networks                                     then painting and design (easy to hard), then the arrow-key games (one key, five keys, keys in order, moving and firing). */
const PATH = ['mouseclub', 'buildclick', 'parts', 'skills', 'fruit', 'buildtype', 'words', 'typing', 'desktop', 'shortcuts', 'letter', 'grid', 'network',
  'paint', 'magic', 'art', 'scene', 'design', 'magiclab', 'jump', 'piano', 'pattern', 'blaster', 'commando'];
/* which games each year gets (the ORDER comes from PATH, so a game is placed once, in one place) */
const YEAR_SETS = {
  '1': ['mouseclub', 'buildclick', 'skills', 'fruit', 'desktop', 'parts', 'paint', 'magic', 'jump', 'piano'],
  '2': ['skills', 'fruit', 'buildtype', 'words', 'desktop', 'parts', 'magic', 'art', 'jump', 'piano', 'blaster'],
  '3': ['skills', 'fruit', 'words', 'desktop', 'parts', 'letter', 'network', 'magic', 'art', 'scene', 'jump', 'piano', 'pattern', 'blaster'],
  '4': ['typing', 'words', 'shortcuts', 'desktop', 'parts', 'letter', 'grid', 'network', 'design', 'magiclab', 'jump', 'piano', 'pattern', 'blaster', 'commando'],
  '5': ['typing', 'words', 'shortcuts', 'desktop', 'letter', 'grid', 'network', 'design', 'magiclab', 'jump', 'piano', 'pattern', 'blaster', 'commando'],
  '6': ['typing', 'shortcuts', 'desktop', 'letter', 'grid', 'network', 'design', 'magiclab', 'jump', 'piano', 'pattern', 'blaster', 'commando']
};
const YEARS = {}; Object.keys(YEAR_SETS).forEach(function (n) { YEARS[n] = { modes: PATH.filter(function (id) { return YEAR_SETS[n].indexOf(id) >= 0; }) }; });
/* the tabs in every year menu are LEVELS of difficulty, easiest first. A year only shows the levels that have a game for it, and opens on the level of its first game. */
const TIERS = [['b', '🌱', 'Beginner', ['mouseclub', 'buildclick', 'parts', 'paint', 'magic', 'skills']],
  ['m', '⭐', 'Medium', ['buildtype', 'words', 'art', 'scene', 'typing', 'desktop']],
  ['a', '🚀', 'Advanced', ['shortcuts', 'letter', 'design', 'grid']],
  ['p', '🏆', 'Advanced Pro', ['network', 'magiclab']],
  ['g', '⚡', 'Skill Games', ['fruit', 'jump', 'piano', 'pattern', 'blaster', 'commando']]];
const TIER_OF = {}; TIERS.forEach(function (t) { t[3].forEach(function (id) { TIER_OF[id] = t[0]; }); });
/* the level of each game FOR EACH YEAR: b = Beginner, m = Medium, a = Advanced, p = Advanced Pro (the arcade games always go in Skill Games) */
const YEAR_LEVELS = {
  '1': { b: ['mouseclub', 'buildclick', 'paint', 'magic'], m: ['parts', 'skills', 'desktop'] },
  '2': { b: ['parts', 'skills', 'magic'], m: ['buildtype', 'words', 'desktop', 'art'] },
  '3': { b: ['parts', 'skills', 'magic'], m: ['words', 'desktop', 'art', 'scene'], a: ['letter', 'network'] },
  '4': { b: ['parts', 'desktop'], m: ['words', 'typing', 'letter'], a: ['shortcuts', 'design', 'grid'], p: ['network', 'magiclab'] },
  '5': { b: ['words', 'desktop'], m: ['typing', 'letter', 'design'], a: ['shortcuts', 'grid'], p: ['network', 'magiclab'] },
  '6': { b: ['typing', 'desktop'], m: ['letter', 'design'], a: ['shortcuts', 'grid'], p: ['network', 'magiclab'] }
};
const YEAR_COLORS = ['#ff5c72', '#ff9f45', '#ffd23f', '#6bcb77', '#22c6c6', '#a77bff'];
const $ = function (id) { return document.getElementById(id); };
/* which music plays where (the piano has none: you ARE the music). Level games pick their own stage tune on top of this. */
const MUSIC = { mouseclub: 'gentle', skills: null, desktop: 'gentle', fruit: 'fruit', words: 'words', jump: 'jump', blaster: 'blaster', commando: 'commando', pattern: 'pattern', piano: null, typing: null, shortcuts: null, magiclab: 'words', design: 'words', magic: 'words', art: 'words', scene: 'words', paint: 'words', buildclick: 'words', buildtype: 'words', parts: 'gentle', network: 'gentle', letter: null, grid: null };

function showOnly(el) {
  document.querySelectorAll('.screen, .mode').forEach(function (s) { s.hidden = true; });
  el.hidden = false;
}
function leaveMode() {
  const m = CC.modes[app.mode];
  if (m && m.exit) m.exit();
  CC.paused = false; if (CC.audio.ctx) CC.audio.ctx.resume(); CC.ui.close(); CC.held = {}; app.mode = null; CC.music.stop();
  if (CC.practice) CC.practice.leave();                       // Practice (typing for everyone) stops its clock and sounds when you leave it
  document.querySelectorAll('.pause-btn').forEach(function (b) { b.textContent = '⏸'; b.classList.remove('on'); });
}
/* the drawn picture of a game (js/icons.js, which every page loads), or null for a game that has none yet (it then keeps its emoji from MODES) */
function gamePicture(id) { return CC.icons.has(id) ? CC.icons.el(CC.icons.game(id)) : null; }
Object.keys(MODES).forEach(function (id) { CC.icons.colour[id] = MODES[id].color; });
/* every game's heading shows its drawn picture in place of the emoji */
document.querySelectorAll('section.mode').forEach(function (s) {
  const id = s.id.replace('mode-', ''), pic = gamePicture(id === 'builder' ? 'buildclick' : id), h = s.querySelector('.topbar h2');
  if (pic && h) { const name = h.textContent.replace(/^\S+\s+/, ''); h.textContent = ''; h.appendChild(pic); h.appendChild(document.createTextNode(' ' + name)); }
});
function showSessions() { leaveMode(); app.session = null; showOnly($('screen-session')); }
function showMenu() {
  if (!app.session) { showSessions(); return; }
  leaveMode();
  const y = YEARS[app.session], tabs = $('group-tabs'), box = $('mode-cards');
  $('menu-title').textContent = 'Year ' + app.session;
  /* every year sorts its own games into levels, so each year has a Beginner, Medium... tab suited to that age */
  const tof = {}, cnt = {}, lvl = YEAR_LEVELS[app.session] || {};
  y.modes.forEach(function (id) {
    let t = TIER_OF[id] === 'g' ? 'g' : null;
    Object.keys(lvl).forEach(function (k) { if (lvl[k].indexOf(id) >= 0) t = k; });
    tof[id] = t || TIER_OF[id]; cnt[tof[id]] = (cnt[tof[id]] || 0) + 1;
  });
  const shown = TIERS.filter(function (g) { return cnt[g[0]] > 0; });
  if (!app.group || !shown.some(function (g) { return g[0] === app.group; })) app.group = tof[y.modes[0]];
  function draw() {
    tabs.innerHTML = ''; box.innerHTML = '';
    shown.forEach(function (g) {
      const n = cnt[g[0]], t = document.createElement('button');
      t.type = 'button'; t.className = 'group-tab' + (app.group === g[0] ? ' on' : ''); t.setAttribute('role', 'tab'); t.setAttribute('aria-selected', app.group === g[0] ? 'true' : 'false');
      t.innerHTML = '<span class="gi">' + g[1] + '</span><span class="gn">' + g[2] + '</span><span class="gc">' + n + '</span>';
      const tabPic = CC.icons.tab(g[0]); if (tabPic) { const gi = t.querySelector('.gi'); gi.textContent = ''; gi.appendChild(CC.icons.el(tabPic)); }       // the drawn tab picture
      t.tabIndex = app.group === g[0] ? 0 : -1;
      t.addEventListener('click', function () { app.group = g[0]; draw(); });
      /* the arrow keys move between the level tabs (Home and End jump to the first and last) */
      t.addEventListener('keydown', function (e) {
        const at = shown.indexOf(g), to = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? at + 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? at - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? shown.length - 1 : null;
        if (to === null) return;
        e.preventDefault(); app.group = shown[(to + shown.length) % shown.length][0]; draw(); tabs.querySelector('.group-tab.on').focus();
      });
      tabs.appendChild(t);
    });
    y.modes.filter(function (id) { return tof[id] === app.group; }).forEach(function (id) {
      const m = MODES[id], b = document.createElement('button'), step = y.modes.indexOf(id) + 1;
      b.className = 'mode-card'; b.style.setProperty('--c', m.color); b.dataset.mode = id;
      b.innerHTML = '<span class="ic">' + m.icon + '</span><span class="nm">' + m.name + '</span><span class="ds">' + m.desc + '</span>' + (step === 1 ? '<span class="tg start">▶ Start here</span>' : '') + (m.cert ? '<span class="tg cert">🎓 Certificate</span>' : '');
      const pic = gamePicture(id); if (pic) { const sp = b.querySelector('.ic'); sp.textContent = ''; sp.appendChild(pic); }       // the drawn picture (a game without one keeps its emoji)
      if (CC.rewards && CC.rewards.has(id)) { const tr = document.createElement('span'); tr.className = 'rw-badge'; tr.setAttribute('role', 'button'); tr.setAttribute('tabindex', '0'); tr.setAttribute('aria-label', 'my reward'); tr.title = 'My reward'; tr.textContent = '🏆'; tr.addEventListener('click', function (e) { e.stopPropagation(); CC.rewards.show(id); }); tr.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); CC.rewards.show(id); } }); b.appendChild(tr); }
      b.addEventListener('click', function () { startMode(id); });
      box.appendChild(b);
    });
  }
  draw();
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
    b.addEventListener('click', function () { CC.audio.init(); app.session = n; app.group = null; CC.sfx.good(); showMenu(); });
    box.appendChild(b);
  });
})();
/* Practice: typing for everyone. Its files are fetched the first time it is opened, so the games open as fast as they always did. */
const BUILD = (function () { const s = document.querySelector('script[src*="js/main.js"]'), v = s && s.getAttribute('src').match(/\?v=\d+/); return v ? v[0] : ''; })();
let practiceLoading = null;
function loadPractice() {
  if (CC.practice) return Promise.resolve();
  if (practiceLoading) return practiceLoading;
  function file(tag, url) { return new Promise(function (ok, no) { const e = document.createElement(tag); if (tag === 'link') { e.rel = 'stylesheet'; e.href = url + BUILD; } else { e.src = url + BUILD; } e.onload = ok; e.onerror = function () { no(new Error(url)); }; document.head.appendChild(e); }); }
  practiceLoading = file('link', 'css/practice.css').then(function () { return file('script', 'js/practice_data.js'); }).then(function () { return file('script', 'js/practice_core.js'); })
    .then(function () { return file('script', 'js/practice_rain.js'); }).then(function () { return file('script', 'js/practice.js'); })
    .then(function () { if (!CC.practice) throw new Error('practice.js did not start'); })
    .catch(function (e) { practiceLoading = null; throw e; });       // a failed or half-loaded attempt can be tried again
  return practiceLoading;
}
function openPractice() {
  leaveMode(); app.session = null; showOnly($('screen-practice'));
  const root = $('pr-root');
  loadPractice().then(function () { if (!$('screen-practice').hidden) CC.practice.open(); })
    .catch(function (e) { console.error(e); root.innerHTML = ''; const p = document.createElement('p'); p.style.margin = '24px 0'; p.textContent = 'Practice could not be loaded. Please check your connection and try again.'; root.appendChild(p); });
}
/* the Home / About menu on the landing page */
document.querySelectorAll('[data-nav]').forEach(function (b) {
  b.addEventListener('click', function () {
    b.blur(); CC.audio.init();
    if (b.dataset.nav === 'home') showSessions(); else if (b.dataset.nav === 'practice') openPractice(); else { leaveMode(); app.session = null; showOnly($('screen-' + b.dataset.nav)); }
  });
});
/* the QR code buttons (the top menu and the How to use page): one click downloads the printable QR code and the blank certificate tracker */
document.querySelectorAll('.qr-btn').forEach(function (b) {
  b.addEventListener('click', function (e) {
    e.preventDefault(); b.blur();
    ['tech-explorers-qr.pdf', 'downloads/Tech-Explorers-Certificate-Tracker.xlsx'].forEach(function (url, i) {
      setTimeout(function () { const a = document.createElement('a'); a.href = url; a.download = url.split('/').pop(); document.body.appendChild(a); a.click(); a.remove(); }, i * 400);
    });
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
  b.title = 'Music on or off';
  const last = tb.lastElementChild; if (last && last.tagName === 'SPAN' && !last.textContent.trim() && !last.id) tb.replaceChild(b, last); else tb.insertBefore(b, last);
  /* everything after the title goes in one group on the right, so the title stays in the middle */
  const right = document.createElement('span'); right.className = 'tb-right'; const h = tb.querySelector('h2');
  while (h && h.nextSibling) right.appendChild(h.nextSibling);
  tb.appendChild(right);
  const home = tb.firstElementChild; if (home && home.tagName === 'BUTTON') { home.title = home.id === 'btn-change-session' ? 'Choose a year' : 'Back to the games'; home.setAttribute('aria-label', home.title); }
});

/* ---- keyboard routing ---- */
window.addEventListener('keydown', function (e) {
  CC.held[e.code] = true;
  if (CC.audio.ctx && CC.audio.ctx.state === 'suspended') CC.audio.ctx.resume();
  if (CC.ui.handleKey(e)) return;
  if (e.code === 'Escape' && !e.repeat && CC.pausable[app.mode] && !(e.target && e.target.closest && e.target.closest('input, textarea'))) { CC.togglePause(app.mode); return; }
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
