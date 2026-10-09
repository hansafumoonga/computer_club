/* main.js - the hub: pick a session, pick a mode, route keys. Just show/hide - no reloads. */
(function () {
'use strict';
const app = CC.app;

const MODES = {
  skills:   { icon: '🖱️', name: 'Click & Type Quest', desc: 'Learn the mouse and keyboard', color: '#ff7ac8' },
  fruit:    { icon: '🍉', name: 'Slice & Pop',   desc: 'Press the letter to slice or pop!', color: '#ff6b86' },
  words:    { icon: '🔤', name: 'Word Hunt',     desc: 'Computer words crossword',        color: '#22c6c6' },
  jump:     { icon: '🏃', name: 'Jump Over!',    desc: 'Hop over things, duck under bees', color: '#ffd23f' },
  blaster:  { icon: '🚀', name: 'Star Blaster',  desc: 'Pop the friendly space rocks',    color: '#6bcb77' },
  piano:    { icon: '🎹', name: 'Piano',         desc: 'Play songs on 5 keys',            color: '#ff9f45' },
  commando: { icon: '🤖', name: 'Commando Run',  desc: 'Run, jump and blast the bots',    color: '#a77bff' },
  pattern:  { icon: '🎵', name: 'Pattern Pop!',  desc: 'Watch, listen and copy',          color: '#22c6c6' },
  typing:   { icon: '⌨️', name: 'Typing Club',   desc: 'Full keyboard: race, blast, beat the boss', color: '#5ac8ff' }
};
const SESSIONS = {
  '1': { title: 'Session 1 · Year 1, 2 & 3', modes: ['skills', 'fruit', 'words', 'jump', 'blaster'] },
  '2': { title: 'Session 2 · Year 4, 5 & 6', modes: ['piano', 'jump', 'blaster', 'commando', 'pattern', 'typing'] }
};
const $ = function (id) { return document.getElementById(id); };
/* which music plays where (the piano has none: you ARE the music). Level games pick their own stage tune on top of this. */
const MUSIC = { skills: null, fruit: 'fruit', words: 'words', jump: 'jump', blaster: 'blaster', commando: 'commando', pattern: 'pattern', piano: null, typing: null };

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
  const s = SESSIONS[app.session];
  $('menu-title').textContent = s.title;
  const box = $('mode-cards'); box.innerHTML = '';
  s.modes.forEach(function (id) {
    const m = MODES[id], b = document.createElement('button');
    b.className = 'mode-card'; b.style.setProperty('--c', m.color); b.dataset.mode = id;
    b.innerHTML = '<span class="ic">' + m.icon + '</span><span class="nm">' + m.name + '</span><span class="ds">' + m.desc + '</span>';
    b.addEventListener('click', function () { startMode(id); });
    box.appendChild(b);
  });
  showOnly($('screen-menu'));
  CC.music.play('menu');
}
function startMode(id) {
  CC.audio.init();                      // the click that got us here is the user gesture
  leaveMode();
  app.mode = id; CC.held = {};
  showOnly($('mode-' + id));
  if (MUSIC[id]) CC.music.play(MUSIC[id]);
  CC.modes[id].enter();
}
CC.goMenu = showMenu;

document.querySelectorAll('.session-card').forEach(function (b) {
  b.addEventListener('click', function () {
    CC.audio.init(); app.session = b.dataset.session; CC.sfx.good(); showMenu();
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

/* ---- landing page art: keycap logo, mini keyboard, drifting keys ---- */
(function buildLanding() {
  const pal = [['#ff5c72', '#d8334e'], ['#ff9f45', '#e07a1a'], ['#ffd23f', '#e0a800'], ['#6bcb77', '#3fa84f'], ['#22c6c6', '#139a9a']];
  function row(id, word, off) {
    const box = $(id); word.split('').forEach(function (ch, i) {
      const k = document.createElement('span'), p = pal[(i + off) % 5]; k.className = 'kcl'; k.textContent = ch;
      k.style.setProperty('--c', p[0]); k.style.setProperty('--c2', p[1]); k.style.setProperty('--i', (i * 0.25) + 's'); box.appendChild(k);
    });
  }
  row('logo1', 'TECH', 0); row('logo2', 'EXPLORERS', 2);
  const kb = $('mini-kb'), rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'], hi = 'ASDFJKL';
  rows.forEach(function (r) { const d = document.createElement('div'); d.className = 'r'; r.split('').forEach(function (ch, i) { const k = document.createElement('span'); k.className = 'k'; k.textContent = ch;
    if (hi.indexOf(ch) >= 0) { k.classList.add('h'); k.style.setProperty('--c', pal[hi.indexOf(ch) % 5][0]); k.style.setProperty('--i', (i * 0.2) + 's'); } d.appendChild(k); }); kb.appendChild(d); });
  const sp = document.createElement('div'); sp.className = 'r'; const s2 = document.createElement('span'); s2.className = 'k sp'; sp.appendChild(s2); kb.appendChild(sp);
  const dr = $('drift'), chars = 'ABCDEFGHJKLMNOPRSTUW←↑↓→';
  for (let i = 0; i < 16; i++) { const e = document.createElement('i'); e.textContent = chars[(i * 7) % chars.length]; e.style.left = (i * 6.3 + (i % 3) * 2) + '%';
    e.style.setProperty('--c', pal[i % 5][0]); e.style.setProperty('--d', (16 + (i % 5) * 4) + 's'); e.style.setProperty('--w', (-i * 2.3) + 's'); dr.appendChild(e); }
})();

showOnly($('screen-session'));
})();
