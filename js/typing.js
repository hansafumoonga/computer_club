/* typing.js - Typing Club (Session 2, FULL keyboard). Three games that all train the same thing: accurate, steady typing.
     Typing Racer    - race a car by typing a passage; beat your own best "ghost"
     Word Blaster    - zap falling words by typing them
     Boss Sentences  - type sentences to beat a friendly boss
   Stars reward ACCURACY first (finish = 1, 90% = 2, 95% = 3); speed earns a separate medal. Nothing is saved or sent anywhere. */
(function () {
'use strict';
const CC = window.CC, D = CC.TYPING, LEVELS = D.LEVELS;
const $stage = function () { return document.getElementById('stage-typing'); };
const $root = function () { return document.getElementById('ty-root'); };
const clamp = CC.clamp;
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function rnd(a) { return a[Math.floor(Math.random() * a.length)]; }
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

const GAMES = [
  { id: 'racer', icon: '🏎️', name: 'Typing Racer', desc: 'Race your own best time', color: '#ff7a8a' },
  { id: 'blaster', icon: '🚀', name: 'Word Blaster', desc: 'Zap the falling words', color: '#5ac8ff' },
  { id: 'boss', icon: '🐲', name: 'Boss Sentences', desc: 'Type sentences to beat the boss', color: '#ffd23f' }
];
const BOSSES = ['🐙', '🦖', '🤖', '👾', '🦂', '🦑', '👻', '🐊', '🧌', '🐉'];

/* ---------- state for the whole visit (nothing is stored on disk) ---------- */
const S = { year: 4, name: '', view: 'home', game: 'racer', level: 1, guide: true, unlockAll: false, best: {}, ghost: {}, keys: {}, rounds: [], run: null, timers: [], loop: null, view2: null };
function target() { return D.TARGET_WPM[S.year]; }
function later(fn, ms) { const id = setTimeout(function () { const i = S.timers.indexOf(id); if (i >= 0) S.timers.splice(i, 1); fn(); }, ms); S.timers.push(id); return id; }
function clearTimers() { S.timers.forEach(clearTimeout); S.timers = []; }
function bestOf(g, lv) { return S.best[g + ':' + lv] || null; }
function isOpen(g, lv) { return S.unlockAll || lv === 1 || (bestOf(g, lv - 1) && bestOf(g, lv - 1).stars >= 1); }

/* ---------- the on-screen keyboard (finger guide) ---------- */
const FMAP = { LP: '1qaz', LR: '2wsx', LM: '3edc', LI: '4rfv5tgb', RI: '6yhn7ujm', RM: '8ik,', RR: '9ol.', RP: '0p;/-' };
const FNAME = { LP: 'left little finger', LR: 'left ring finger', LM: 'left middle finger', LI: 'left index finger', RI: 'right index finger', RM: 'right middle finger', RR: 'right ring finger', RP: 'right little finger', TH: 'thumb' };
const KF = {}; Object.keys(FMAP).forEach(function (f) { FMAP[f].split('').forEach(function (k) { KF[k] = f; }); }); KF[' '] = 'TH';
const ROWS = [['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-'], 'qwertyuiop'.split(''), 'asdfghjkl;'.split(''), ['ShiftL'].concat('zxcvbnm,./'.split(''), ['ShiftR']), [' ']];
let kbEls = {};
function info(ch) {
  if (ch === ' ') return { base: ' ', shift: false };
  if (/[A-Z]/.test(ch)) return { base: ch.toLowerCase(), shift: true };
  if (ch === '!') return { base: '1', shift: true };
  if (ch === '?') return { base: '/', shift: true };
  return { base: ch, shift: false };
}
function buildKeyboard() {
  kbEls = {}; const kb = el('div', 'ty-kb');
  ROWS.forEach(function (row) {
    const r = el('div', 'kr');
    row.forEach(function (k) {
      const isShift = k.indexOf('Shift') === 0, f = isShift ? (k === 'ShiftL' ? 'LP' : 'RP') : KF[k];
      const b = el('div', 'tk f-' + f + (k === ' ' ? ' space' : '') + (isShift ? ' shift' : ''), isShift ? 'Shift' : k === ' ' ? 'space' : k.toUpperCase());
      if (k === 'f' || k === 'j') b.classList.add('bump');
      r.appendChild(b); kbEls[k] = b;
    });
    kb.appendChild(r);
  });
  return kb;
}
function hlKey(ch) {
  Object.keys(kbEls).forEach(function (k) { kbEls[k].classList.remove('hl'); });
  const fl = S.run && S.run.ui && S.run.ui.finger; if (!ch) { if (fl) fl.textContent = ''; return; }
  const i = info(ch), k = kbEls[i.base]; if (k) k.classList.add('hl');
  let msg = 'Next: ' + (ch === ' ' ? 'SPACE' : ch.toUpperCase()) + ' with your ' + (FNAME[KF[i.base]] || 'finger');
  if (i.shift) { const right = 'RI RM RR RP'.indexOf(KF[i.base]) >= 0, sh = kbEls[right ? 'ShiftL' : 'ShiftR']; if (sh) sh.classList.add('hl'); msg += ' + ' + (right ? 'LEFT' : 'RIGHT') + ' Shift'; }
  if (fl) fl.textContent = msg;
}

/* ---------- what a round measures ---------- */
function wpm(R) { return R.started && R.t > 1 ? Math.round((R.correct / 5) / (R.t / 60) * 10) / 10 : 0; }
function acc(R) { const n = R.correct + R.errors; return n ? Math.round(R.correct / n * 1000) / 10 : 100; }
function noteKey(ch, ok, R) {
  const k = S.keys[ch] || (S.keys[ch] = { n: 0, err: 0, ms: 0, c: 0 });
  k.n++; if (!ok) k.err++;
  if (ok) { const dt = clamp(R.t - R.lastT, 0, 2); if (R.lastT > 0 || R.correct > 1) { k.ms += dt * 1000; k.c++; } R.lastT = R.t; }
}
function practiceKeys(max) {
  return Object.keys(S.keys).map(function (c) { const k = S.keys[c]; return { c: c, n: k.n, err: k.err, rate: k.n ? k.err / k.n : 0, slow: k.c ? k.ms / k.c : 0 }; })
    .filter(function (k) { return k.n >= 3 && c0(k.c) && (k.rate >= 0.12 || k.slow > 700); })
    .sort(function (a, b) { return (b.rate * 100 + b.slow / 40) - (a.rate * 100 + a.slow / 40); }).slice(0, max || 3);
}
function c0(c) { return c !== ' '; }
function medal(w) { const T = target(); return w >= T * 1.3 ? '🥇 Gold speed' : w >= T ? '🥈 Silver speed' : w >= T * 0.7 ? '🥉 Bronze speed' : ''; }

/* ---------- screens ---------- */
function setView(v, node) { S.view = v; const r = $root(); r.innerHTML = ''; r.appendChild(node); r.scrollTop = 0; }
function showHome() {
  stopRun(); CC.ui.close();
  const h = el('div', 'ty-home');
  h.appendChild(el('div', 'ty-title', '⌨️ Typing Club'));
  h.appendChild(el('p', 'ty-sub', 'You need a full keyboard for these games. Accuracy first, then speed!'));
  const setup = el('div', 'ty-setup');
  const yrs = el('div', 'ty-years'); yrs.appendChild(el('span', '', 'I am in Year'));
  [4, 5, 6].forEach(function (y) { const b = el('button', 'btn yr' + (S.year === y ? ' on' : ''), String(y)); b.type = 'button'; b.addEventListener('click', function () { b.blur(); S.year = y; yrs.querySelectorAll('.yr').forEach(function (x, i) { x.classList.toggle('on', i + 4 === y); }); goal.textContent = '🎯 My goal: ' + target() + ' words a minute'; }); yrs.appendChild(b); });
  setup.appendChild(yrs);
  const nm = el('input', 'ty-name'); nm.type = 'text'; nm.maxLength = 20; nm.placeholder = '✏️ My name'; nm.value = S.name; nm.setAttribute('aria-label', 'My name'); nm.addEventListener('input', function () { S.name = nm.value; });
  setup.appendChild(nm); h.appendChild(setup);
  const goal = el('p', 'ty-goal', '🎯 My goal: ' + target() + ' words a minute'); h.appendChild(goal);
  const cards = el('div', 'ty-games');
  GAMES.forEach(function (g) {
    const done = LEVELS.filter(function (l) { const b = bestOf(g.id, l.id); return b && b.stars >= 1; }).length;
    const c = el('button', 'ty-gcard'); c.type = 'button'; c.style.setProperty('--c', g.color);
    c.innerHTML = '<span class="gi">' + g.icon + '</span><span class="gn"></span><span class="gd"></span><span class="gp"></span>';
    c.querySelector('.gn').textContent = g.name; c.querySelector('.gd').textContent = g.desc; c.querySelector('.gp').textContent = done + ' / 10 levels';
    c.addEventListener('click', function () { c.blur(); CC.audio.init(); S.game = g.id; showMap(); }); cards.appendChild(c);
  });
  h.appendChild(cards);
  const row = el('div', 'ty-opts');
  const gd = el('button', 'btn' + (S.guide ? ' on' : ''), '🖐️ Finger guide'); gd.type = 'button'; gd.addEventListener('click', function () { gd.blur(); S.guide = !S.guide; gd.classList.toggle('on', S.guide); });
  const rp = el('button', 'btn', '📋 Teacher report'); rp.type = 'button'; rp.addEventListener('click', function () { rp.blur(); showReport(); });
  const ce = el('button', 'btn' + (certEarned() ? ' primary' : ''), '🎓 Certificate'); ce.type = 'button'; ce.disabled = !certEarned(); ce.title = certEarned() ? 'Print my certificate' : 'Finish all 10 levels of one game to unlock'; ce.addEventListener('click', function () { ce.blur(); showCertificate(); });
  const un = el('button', 'btn', S.unlockAll ? '🔒 Lock levels' : '🔓 Unlock all'); un.type = 'button'; un.addEventListener('click', function () { un.blur(); S.unlockAll = !S.unlockAll; showHome(); });
  [gd, ce, rp, un].forEach(function (b) { row.appendChild(b); }); h.appendChild(row);
  setView('home', h);
}
function showMap() {
  stopRun(); CC.ui.close();
  const g = GAMES.filter(function (x) { return x.id === S.game; })[0];
  const m = el('div', 'ty-map');
  const top = el('div', 'ty-maptop');
  const back = el('button', 'btn ico', '🏠'); back.type = 'button'; back.setAttribute('aria-label', 'back'); back.addEventListener('click', function () { back.blur(); showHome(); });
  top.appendChild(back); top.appendChild(el('h3', '', g.icon + ' ' + g.name)); top.appendChild(el('span', 'ty-goal2', '🎯 ' + target() + ' wpm'));
  m.appendChild(top);
  const grid = el('div', 'ty-levels');
  LEVELS.forEach(function (lv) {
    const open = isOpen(g.id, lv.id), b = bestOf(g.id, lv.id);
    const t = el('button', 'ty-tile' + (open ? '' : ' locked') + (b && b.stars ? ' done' : '')); t.type = 'button'; t.disabled = !open; t.dataset.theme = lv.theme;
    t.innerHTML = '<span class="n"></span><span class="ic"></span><span class="nm"></span><span class="st"></span>';
    t.querySelector('.n').textContent = lv.id; t.querySelector('.ic').textContent = open ? lv.icon : '🔒'; t.querySelector('.nm').textContent = lv.name;
    t.querySelector('.st').textContent = b ? (b.stars ? '⭐'.repeat(b.stars) : '·') + '  ' + b.wpm + ' wpm' : '';
    t.setAttribute('aria-label', 'Level ' + lv.id + ' ' + lv.name);
    t.addEventListener('click', function () { t.blur(); CC.audio.init(); S.level = lv.id; intro(); }); grid.appendChild(t);
  });
  m.appendChild(grid); setView('map', m);
}
function intro() {
  const lv = LEVELS[S.level - 1], g = GAMES.filter(function (x) { return x.id === S.game; })[0];
  CC.sfx.letsGo && CC.sfx.letsGo();
  CC.ui.show($stage(), { emoji: lv.icon, title: 'Level ' + lv.id + ': ' + lv.name, text: (lv.newKeys ? 'New keys: ' + lv.newKeys + '. ' : '') + lv.tip, buttons: [
    { icon: '▶', label: 'Go!', primary: true, keys: ['Enter', 'Space'], fn: function () { startRun(); } },
    { icon: '🗺️', label: '', fn: showMap }] });
  void g;
}

/* ---------- running a round ---------- */
function stopRun() { clearTimers(); if (S.run) S.run.phase = 'off'; S.run = null; }
function passageFor(lv) {
  const L = LEVELS[lv - 1], goal = [40, 50, 60, 75, 90, 100, 110, 120, 125, 0][lv - 1];
  if (lv === 10) return rnd(L.sentences);
  let out = [], len = 0, src = L.id <= 6 ? L.words : L.sentences, pool = shuffle(src), i = 0;
  while (len < goal) { if (i >= pool.length) { pool = shuffle(src); i = 0; } const w = pool[i++]; if (out.length && out[out.length - 1] === w) continue; out.push(w); len += w.length + 1; }
  return out.join(' ');
}
function startRun() {
  clearTimers(); CC.ui.close();
  const lv = LEVELS[S.level - 1];
  const R = { game: S.game, lv: S.level, L: lv, t: 0, started: false, correct: 0, errors: 0, lastT: 0, times: [], phase: 'count', ui: {} };
  S.run = R; buildPlay(R);
  const nums = ['3', '2', '1', 'GO!']; let i = 0;
  (function tick() { if (S.run !== R) return; R.ui.count.textContent = nums[i]; R.ui.count.classList.remove('pop'); void R.ui.count.offsetWidth; R.ui.count.classList.add('pop'); CC.sfx.tick && CC.sfx.tick();
    if (i === nums.length - 1) { later(function () { if (S.run !== R) return; R.ui.count.hidden = true; R.phase = 'play'; if (R.begin) R.begin(); }, 650); return; } i++; later(tick, 750); })();
}
function hud(R) {
  const bar = el('div', 'ty-hud');
  const map = el('button', 'btn ico', '🗺️'); map.type = 'button'; map.setAttribute('aria-label', 'level map'); map.addEventListener('click', function () { map.blur(); showMap(); });
  const chip = el('div', 'ty-chip'); chip.innerHTML = '<b></b> <span></span>'; chip.querySelector('b').textContent = R.lv; chip.querySelector('span').textContent = R.L.name;
  R.ui.wpm = el('div', 'ty-stat', '⚡ 0 wpm'); R.ui.acc = el('div', 'ty-stat', '🎯 100%'); R.ui.extra = el('div', 'ty-stat ty-extra');
  const gd = el('button', 'btn ico' + (S.guide ? '' : ' off'), '🖐️'); gd.type = 'button'; gd.setAttribute('aria-label', 'finger guide on or off'); gd.title = 'Finger guide';
  gd.addEventListener('click', function () { gd.blur(); S.guide = !S.guide; gd.classList.toggle('off', !S.guide); R.ui.kbwrap.hidden = !S.guide; });
  [map, chip, R.ui.wpm, R.ui.acc, R.ui.extra, gd].forEach(function (x) { bar.appendChild(x); });
  return bar;
}
function refresh(R) { if (!R.ui.wpm) return; R.ui.wpm.textContent = '⚡ ' + Math.round(wpm(R)) + ' wpm'; R.ui.acc.textContent = '🎯 ' + Math.round(acc(R)) + '%'; }
function buildPlay(R) {
  const p = el('div', 'ty-play ty-t-' + R.L.theme + ' g-' + R.game);
  p.appendChild(hud(R));
  const main = el('div', 'ty-main'); p.appendChild(main); R.ui.main = main;
  R.ui.count = el('div', 'ty-count', ''); main.appendChild(R.ui.count);
  R.ui.finger = el('div', 'ty-finger'); p.appendChild(R.ui.finger);
  R.ui.kbwrap = el('div', 'ty-kbwrap'); R.ui.kbwrap.appendChild(buildKeyboard()); R.ui.kbwrap.hidden = !S.guide; p.appendChild(R.ui.kbwrap);
  setView('play', p);
  ({ racer: setupRacer, blaster: setupBlaster, boss: setupBoss })[R.game](R);
}
function lineEl(text) { const d = el('div', 'ty-line'); text.split('').forEach(function (ch) { d.appendChild(el('span', 'c', ch)); }); return d; }
function markLine(line, i, bad) {
  const cs = line.children;
  for (let k = 0; k < cs.length; k++) cs[k].className = 'c' + (k < i ? ' ok' : k === i ? ' cur' + (bad ? ' bad' : '') : '');
}

/* ================= game 1: Typing Racer ================= */
function setupRacer(R) {
  R.text = passageFor(R.lv); R.i = 0;
  const key = 'racer:' + R.lv, gh = S.ghost[key] || null; R.ghostRec = gh; R.cps = target() * 5 / 60;
  const track = el('div', 'ty-track');
  function lane(label, emoji, cls) { const l = el('div', 'lane ' + cls), lab = el('div', 'lab', label), road = el('div', 'road'), car = el('div', 'car', emoji); road.appendChild(car); road.appendChild(el('div', 'flag', '🏁')); l.appendChild(lab); l.appendChild(road); track.appendChild(l); return car; }
  R.ui.you = lane('You', '🏎️', 'you'); R.ui.ghost = lane(gh ? 'Your best' : 'Pace car (' + target() + ' wpm)', gh ? '🚙' : '🐢', 'ghost');
  R.ui.main.appendChild(track);
  R.ui.line = lineEl(R.text); R.ui.main.appendChild(R.ui.line); markLine(R.ui.line, 0);
  R.ui.extra.textContent = '🏁 0%'; R.begin = function () { hlKey(R.text[0]); };
  hlKey(R.text[0]);
}
function racerChar(R, ch) {
  if (!R.started) { R.started = true; R.t = 0; R.lastT = 0; }
  const exp = R.text[R.i];
  if (ch === exp) { noteKey(exp, true, R); R.correct++; R.times.push(R.t); R.i++; CC.sfx.tick && CC.sfx.tick(); markLine(R.ui.line, R.i); R.ui.you.parentNode.classList.remove('wob');
    if (R.i >= R.text.length) { finishRun(R, true); return; } hlKey(R.text[R.i]); }
  else { noteKey(exp, false, R); R.errors++; CC.sfx.softMiss && CC.sfx.softMiss(); markLine(R.ui.line, R.i, true); wobble(R.ui.you); }
  racerPos(R); refresh(R);
}
function wobble(e) { e.classList.remove('wob'); void e.offsetWidth; e.classList.add('wob'); }
function racerPos(R) {
  const p = R.i / R.text.length; R.ui.you.style.left = (2 + p * 86) + '%'; R.ui.extra.textContent = '🏁 ' + Math.round(p * 100) + '%';
  let gp; if (R.ghostRec) { const tt = R.ghostRec.times, n = R.ghostRec.times.length; let k = R.gi || 0; while (k < n && tt[k] <= R.t) k++; R.gi = k; gp = k / n; }
  else gp = Math.min(1, (R.started ? R.t : 0) * R.cps / R.text.length);
  R.ui.ghost.style.left = (2 + gp * 86) + '%';
}
function racerUpdate(R, dt) { if (R.phase !== 'play') return; if (R.started) R.t += dt; racerPos(R); refresh(R); }

/* ================= game 2: Word Blaster ================= */
function setupBlaster(R) {
  const L = R.L; R.words = []; R.spawned = 0; R.N = Math.min(30, 12 + 2 * R.lv); R.shields = 3; R.score = 0; R.streak = 0; R.target = null; R.started = true; R.spawnT = 0.6;
  const pool = shuffle(L.words); R.queue = []; while (R.queue.length < R.N) R.queue = R.queue.concat(shuffle(pool)); R.queue = R.queue.slice(0, R.N);
  const cps = target() * 5 / 60, demand = clamp(0.5 + 0.05 * R.lv, 0.55, 1.0), avg = R.queue.reduce(function (a, w) { return a + w.length; }, 0) / R.N;
  R.interval = clamp((avg + 1) / (cps * demand), 1.8, 5.2); R.fallSecs = clamp(15 - R.lv * 0.7 - (S.year - 4) * 0.8, 6.5, 14);
  const f = el('div', 'ty-field'); R.ui.field = f; R.ui.main.appendChild(f);
  R.ui.ship = el('div', 'ship', '🚀'); f.appendChild(R.ui.ship); R.ui.beam = el('div', 'beam'); f.appendChild(R.ui.beam);
  R.ui.extra.textContent = '🛡️🛡️🛡️  ·  0'; R.begin = function () { R.spawnT = 0.3; };
  hlKey(null);
}
function blasterUI(R) { R.ui.extra.textContent = '🛡️'.repeat(Math.max(0, R.shields)) + '  ·  ⭐ ' + R.score + (R.streak >= 3 ? '  🔥x' + (1 + Math.floor(R.streak / 3)) : ''); }
function spawnWord(R) {
  const text = R.queue[R.spawned++], d = el('div', 'ty-word'); text.split('').forEach(function (ch) { d.appendChild(el('span', 'c', ch)); });
  const lanes = 5; let lane = Math.floor(Math.random() * lanes); if (lane === R.lastLane) lane = (lane + 2) % lanes; R.lastLane = lane;
  const w = { text: text, i: 0, y: -30, el: d, lane: lane }; d.style.left = (8 + lane * 18) + '%'; d.style.top = '-30px'; R.ui.field.appendChild(d); R.words.push(w);
}
function targetWord(R) { return R.target; }
function setTarget(R, w) { if (R.target) R.target.el.classList.remove('locked'); R.target = w; if (w) { w.el.classList.add('locked'); hlKey(w.text[w.i]); } else hlKey(null); }
function paintWord(w) { const cs = w.el.children; for (let k = 0; k < cs.length; k++) cs[k].className = 'c' + (k < w.i ? ' ok' : ''); }
function blasterChar(R, ch) {
  let w = R.target;
  if (!w) { const cands = R.words.filter(function (x) { return x.text[0] === ch; }).sort(function (a, b) { return b.y - a.y; }); if (!cands.length) { noteKey(ch, false, R); R.errors++; R.streak = 0; CC.sfx.softMiss && CC.sfx.softMiss(); wobble(R.ui.ship); refresh(R); blasterUI(R); return; } w = cands[0]; setTarget(R, w); }
  const exp = w.text[w.i];
  if (ch === exp) { noteKey(exp, true, R); R.correct++; w.i++; paintWord(w); CC.sfx.tick && CC.sfx.tick();
    if (w.i >= w.text.length) { R.correct++; zap(R, w); } else hlKey(w.text[w.i]); }
  else { noteKey(exp, false, R); R.errors++; R.streak = 0; CC.sfx.softMiss && CC.sfx.softMiss(); w.el.classList.remove('shake'); void w.el.offsetWidth; w.el.classList.add('shake'); }
  refresh(R); blasterUI(R);
}
function zap(R, w) {
  R.streak++; R.score += w.text.length * 10 * (1 + Math.min(4, Math.floor(R.streak / 3))); CC.sfx.pop && CC.sfx.pop();
  const f = R.ui.field, fw = f.clientWidth || 600, bx = fw / 2, wx = w.el.offsetLeft + w.el.offsetWidth / 2, wy = w.y + 12, dx = wx - bx, dy = (f.clientHeight || 340) - 50 - wy;
  R.ui.beam.style.cssText = 'left:' + bx + 'px;height:' + Math.hypot(dx, dy) + 'px;transform:rotate(' + Math.atan2(dx, dy) * -1 + 'rad);opacity:1';
  later(function () { R.ui.beam.style.opacity = '0'; }, 120);
  w.el.classList.add('boom'); R.words.splice(R.words.indexOf(w), 1); if (R.target === w) R.target = null; hlKey(null); later(function () { if (w.el.parentNode) w.el.parentNode.removeChild(w.el); }, 380);
  if (R.spawned >= R.N && !R.words.length) finishRun(R, true);
}
function blasterUpdate(R, dt) {
  if (R.phase !== 'play') return; R.t += dt;
  const H = R.ui.field.clientHeight || 340, v = (H - 50) / R.fallSecs;
  R.spawnT -= dt; if (R.spawnT <= 0 && R.spawned < R.N) { spawnWord(R); R.spawnT = R.interval * (0.85 + Math.random() * 0.3); }
  for (let i = R.words.length - 1; i >= 0; i--) {
    const w = R.words[i]; w.y += v * dt; w.el.style.top = w.y + 'px';
    if (w.y >= H - 56) {                              // reached the ship: a shield breaks (never a hard "game over" sound)
      R.shields--; R.streak = 0; if (R.target === w) { R.target = null; hlKey(null); } R.words.splice(i, 1); w.el.classList.add('hit'); later(function () { if (w.el.parentNode) w.el.parentNode.removeChild(w.el); }, 350); CC.sfx.softMiss && CC.sfx.softMiss(); wobble(R.ui.ship); blasterUI(R);
      if (R.shields <= 0) { finishRun(R, false); return; }
      if (R.spawned >= R.N && !R.words.length) { finishRun(R, true); return; }
    }
  }
  refresh(R);
}

/* ================= game 3: Boss Sentences ================= */
function setupBoss(R) {
  const L = R.L, count = [3, 3, 3, 4, 4, 4, 4, 4, 5, 2][R.lv - 1];
  R.sentences = shuffle(L.sentences).slice(0, count); R.si = 0; R.i = 0; R.hearts = 3; R.power = 0; R.hpMax = R.sentences.reduce(function (a, s) { return a + s.length; }, 0); R.dmg = 0;
  R.factor = 0.45 + 0.045 * R.lv; R.cps = target() * 5 / 60 * R.factor; R.boss = BOSSES[R.lv - 1];
  const b = el('div', 'ty-boss'); R.ui.boss = el('div', 'face', R.boss); const hpw = el('div', 'bar hp'); R.ui.hp = el('i'); hpw.appendChild(R.ui.hp); const pw = el('div', 'bar pw'); R.ui.pw = el('i'); pw.appendChild(R.ui.pw);
  const lab1 = el('div', 'lab', 'Boss health'), lab2 = el('div', 'lab', 'Boss power: type before it fills!');
  b.appendChild(R.ui.boss); b.appendChild(lab1); b.appendChild(hpw); b.appendChild(lab2); b.appendChild(pw); R.ui.main.appendChild(b);
  R.ui.num = el('div', 'ty-snum'); R.ui.main.appendChild(R.ui.num);
  R.ui.holder = el('div', 'ty-sholder'); R.ui.main.appendChild(R.ui.holder);
  nextSentence(R); hearts(R); R.begin = function () { hlKey(R.sentences[R.si][0]); };
}
function hearts(R) { R.ui.extra.textContent = '❤️'.repeat(Math.max(0, R.hearts)) + '🖤'.repeat(Math.max(0, 3 - R.hearts)); }
function nextSentence(R) {
  const s = R.sentences[R.si]; R.i = 0; R.allow = s.length / R.cps + 6; R.power = 0; R.ui.holder.innerHTML = ''; R.ui.line = lineEl(s); R.ui.holder.appendChild(R.ui.line); markLine(R.ui.line, 0);
  R.ui.num.textContent = 'Sentence ' + (R.si + 1) + ' of ' + R.sentences.length; R.ui.pw.style.width = '0%'; hlKey(s[0]);
}
function bossChar(R, ch) {
  if (!R.started) { R.started = true; R.t = 0; R.lastT = 0; }
  const s = R.sentences[R.si], exp = s[R.i];
  if (ch === exp) { noteKey(exp, true, R); R.correct++; R.dmg++; R.i++; CC.sfx.tick && CC.sfx.tick(); markLine(R.ui.line, R.i); R.ui.hp.style.width = Math.max(0, 100 - R.dmg / R.hpMax * 100) + '%'; R.ui.boss.classList.remove('hurt'); void R.ui.boss.offsetWidth; R.ui.boss.classList.add('hurt');
    if (R.i >= s.length) { CC.sfx.pop && CC.sfx.pop(); R.si++; if (R.si >= R.sentences.length) { finishRun(R, true); return; } nextSentence(R); } else hlKey(s[R.i]); }
  else { noteKey(exp, false, R); R.errors++; CC.sfx.softMiss && CC.sfx.softMiss(); markLine(R.ui.line, R.i, true); wobble(R.ui.line); }
  refresh(R);
}
function bossUpdate(R, dt) {
  if (R.phase !== 'play') return; if (R.started) R.t += dt; else { refresh(R); return; }
  R.power += dt / R.allow; R.ui.pw.style.width = Math.min(100, R.power * 100) + '%';
  if (R.power >= 1) { R.hearts--; R.power = 0.25; hearts(R); R.ui.boss.classList.add('roar'); later(function () { R.ui.boss.classList.remove('roar'); }, 500); CC.sfx.softMiss && CC.sfx.softMiss(); if (R.hearts <= 0) { finishRun(R, false); return; } }
  refresh(R);
}

/* ---------- shared: finishing, stars, results ---------- */
function onChar(ch) {
  const R = S.run; if (!R || R.phase !== 'play') return;
  if (R.game === 'racer') racerChar(R, ch); else if (R.game === 'blaster') blasterChar(R, ch); else bossChar(R, ch);
}
function update(dt) {
  const R = S.run; if (!R) return;
  if (R.game === 'racer') racerUpdate(R, dt); else if (R.game === 'blaster') blasterUpdate(R, dt); else bossUpdate(R, dt);
}
function finishRun(R, won) {
  if (R.phase !== 'play') return; R.phase = 'done'; hlKey(null);
  const w = wpm(R), a = acc(R), stars = won ? (a >= 95 ? 3 : a >= 90 ? 2 : 1) : 0, key = R.game + ':' + R.lv, old = S.best[key];
  S.best[key] = { stars: Math.max(old ? old.stars : 0, stars), wpm: Math.max(old ? old.wpm : 0, won ? w : 0) || (old ? old.wpm : w), acc: Math.max(old ? old.acc : 0, won ? a : 0) };
  let beat = false;
  if (R.game === 'racer' && won && R.times.length) { const g = S.ghost[key]; if (!g || R.t < g.finish) { beat = !!g; S.ghost[key] = { times: R.times.slice(), finish: R.t }; } }
  S.rounds.push({ game: R.game, lv: R.lv, wpm: w, acc: a, stars: stars, won: won, secs: Math.round(R.t) });
  const med = won && R.game !== 'blaster' ? medal(w) : '', prac = practiceKeys(3).map(function (k) { return k.c.toUpperCase(); });
  const titles = { racer: ['Race finished!', 'Nice try!'], blaster: ['Blasted them all!', 'Almost! The shields broke'], boss: ['Boss beaten!', 'The boss got away this time'] }[R.game];
  const bits = [Math.round(w) + ' words a minute', Math.round(a) + '% accurate']; if (med) bits.push(med); if (beat) bits.push('New personal best!');
  if (won && prac.length) bits.push('Practise: ' + prac.join(' '));
  if (!won) bits.push('Slow and steady is best. Try again!');
  CC.sfx.levelComplete && won && CC.sfx.levelComplete();
  const last = R.lv >= LEVELS.length;
  later(function () {
    CC.ui.show($stage(), { emoji: won ? '🏆' : '💪', stars: won ? stars : 0, title: titles[won ? 0 : 1], text: bits.join(' · '), buttons: [
      won && !last ? { icon: '▶', label: 'Next', primary: true, keys: ['Enter'], fn: function () { S.level = R.lv + 1; intro(); } } : { icon: '🔁', label: 'Again', primary: true, keys: ['Enter'], fn: function () { S.level = R.lv; startRun(); } },
      won && !last ? { icon: '🔁', label: '', fn: function () { S.level = R.lv; startRun(); } } : { icon: '📋', label: '', fn: showReport },
      { icon: '🗺️', label: '', fn: showMap }] });
  }, 700);
}

/* ---------- teacher report ---------- */
function reportText() {
  const L = ['Typing Club - learner report', 'Learner: ' + (S.name || '(no name)'), 'Year: ' + S.year + '   Goal: ' + target() + ' words per minute', 'Date: ' + new Date().toLocaleDateString(), ''];
  GAMES.forEach(function (g) { L.push(g.name + ':'); LEVELS.forEach(function (lv) { const b = bestOf(g.id, lv.id); if (b) L.push('  Level ' + lv.id + ' ' + lv.name + ': ' + (b.stars ? b.stars + ' stars' : 'not finished') + ', best ' + b.wpm + ' wpm'); }); });
  const r = S.rounds, won = r.filter(function (x) { return x.won; });
  L.push('', 'Rounds played: ' + r.length + ' (' + won.length + ' finished)');
  if (won.length) { const av = won.slice(-5).reduce(function (a, x) { return a + x.wpm; }, 0) / Math.min(5, won.length), ac = won.reduce(function (a, x) { return a + x.acc; }, 0) / won.length; L.push('Recent speed: ' + Math.round(av) + ' wpm   Average accuracy: ' + Math.round(ac) + '%   Best speed: ' + Math.max.apply(null, won.map(function (x) { return x.wpm; })) + ' wpm'); }
  L.push('Keys to practise: ' + (practiceKeys(5).map(function (k) { return k.c.toUpperCase() + ' (' + Math.round(k.rate * 100) + '% mistakes)'; }).join(', ') || 'none yet'));
  L.push('Suggestion: ' + advice());
  return L.join('\n');
}
function advice() {
  const won = S.rounds.filter(function (x) { return x.won; }); if (!won.length) return 'play a few rounds first.';
  const av = won.slice(-5).reduce(function (a, x) { return a + x.acc; }, 0) / Math.min(5, won.length), sp = won.slice(-5).reduce(function (a, x) { return a + x.wpm; }, 0) / Math.min(5, won.length);
  if (av < 90) return 'slow down and aim for accuracy first; speed follows.';
  if (sp < target() * 0.7) return 'accuracy is good. Keep practising the home row to build speed.';
  if (sp < target()) return 'nearly at the goal. Short daily rounds will get there.';
  return 'goal reached! Try the next level or a harder game.';
}
function showReport() {
  stopRun(); CC.ui.close();
  const w = el('div', 'ty-report'); w.appendChild(el('h3', '', '📋 ' + (S.name || 'Learner') + ' · Year ' + S.year + ' · goal ' + target() + ' wpm'));
  GAMES.forEach(function (g) {
    const card = el('div', 'rep-game'); card.appendChild(el('div', 'rg', g.icon + ' ' + g.name)); const row = el('div', 'rep-levels');
    LEVELS.forEach(function (lv) { const b = bestOf(g.id, lv.id), c = el('div', 'rl' + (b && b.stars ? ' ok' : b ? ' try' : ''), ''); c.innerHTML = '<b></b><span></span>'; c.querySelector('b').textContent = lv.id; c.querySelector('span').textContent = b ? (b.stars ? '⭐'.repeat(b.stars) : '·') + ' ' + b.wpm : '–'; row.appendChild(c); });
    card.appendChild(row); w.appendChild(card);
  });
  const pk = practiceKeys(5); const p = el('p', 'rep-p'); p.textContent = '🖐️ Keys to practise: ' + (pk.map(function (k) { return k.c.toUpperCase(); }).join('  ') || 'none yet'); w.appendChild(p);
  const a = el('p', 'rep-p'); a.textContent = '💡 ' + advice(); w.appendChild(a);
  const row = el('div', 'ty-opts');
  const dl = el('button', 'btn', '⬇ Download report'); dl.type = 'button'; dl.addEventListener('click', function () { dl.blur(); const aEl = document.createElement('a'); aEl.href = URL.createObjectURL(new Blob([reportText()], { type: 'text/plain' })); aEl.download = 'typing-report' + (S.name ? '-' + S.name.replace(/[^\w-]/g, '') : '') + '.txt'; document.body.appendChild(aEl); aEl.click(); setTimeout(function () { URL.revokeObjectURL(aEl.href); aEl.remove(); }, 500); });
  const pr = el('button', 'btn', '🖨 Print'); pr.type = 'button'; pr.addEventListener('click', function () { pr.blur(); window.print(); });
  const bk = el('button', 'btn primary', '🏠 Back'); bk.type = 'button'; bk.addEventListener('click', function () { bk.blur(); showHome(); });
  [dl, pr, bk].forEach(function (b) { row.appendChild(b); }); w.appendChild(row);
  w.appendChild(el('p', 'rep-note', 'This report is kept only while this page is open. Download it to keep it.'));
  setView('report', w);
}

/* ---------- certificate: earned by finishing all 10 levels of any one game. A4 landscape, printable, downloadable as a picture ---------- */
const KEYC = [['#ff5c72', '#d8334e'], ['#ff9f45', '#e07a1a'], ['#ffd23f', '#e0a800'], ['#6bcb77', '#3fa84f'], ['#22c6c6', '#139a9a']];
function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function starPath(cx, cy, R, r) { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, d = i % 2 ? r : R; p.push((cx + Math.cos(a) * d).toFixed(1) + ',' + (cy + Math.sin(a) * d).toFixed(1)); } return p.join(' '); }
function finishedGame() {
  return GAMES.filter(function (g) { return LEVELS.every(function (l) { const b = bestOf(g.id, l.id); return b && b.stars >= 1; }); })[0] || null;
}
function certEarned() { return !!finishedGame(); }
function certFacts() {
  const g = finishedGame(), won = S.rounds.filter(function (x) { return x.won; });
  const sp = won.filter(function (x) { return x.game !== 'blaster'; }).map(function (x) { return x.wpm; });
  const best = sp.length ? Math.round(Math.max.apply(null, sp)) : 0;
  const avg = won.length ? Math.round(won.reduce(function (a, x) { return a + x.acc; }, 0) / won.length) : 100;
  const stars = GAMES.reduce(function (t, gm) { return t + LEVELS.reduce(function (u, l) { const b = bestOf(gm.id, l.id); return u + (b ? b.stars : 0); }, 0); }, 0);
  const m = medal(best).replace(/^\S+\s/, '').replace(' speed', '');
  return { game: g, best: best, avg: avg, stars: stars, tier: m };
}
function certSvg(name) {
  const W = 1123, H = 794, n = (name || '').trim(), dt = new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }), f = certFacts();
  const serif = "Georgia,'Times New Roman',serif", sans = "'Trebuchet MS','Segoe UI',Arial,sans-serif", hand = "'Segoe Script','Brush Script MT','Lucida Handwriting',cursive", mid = W / 2;
  let g = '<rect width="' + W + '" height="' + H + '" fill="#fffaf0"/>';
  KEYC.forEach(function (c, i) { const o = 12 + i * 7; g += '<rect x="' + o + '" y="' + o + '" width="' + (W - 2 * o) + '" height="' + (H - 2 * o) + '" rx="' + (16 - i * 2) + '" fill="none" stroke="' + c[0] + '" stroke-width="7"/>'; });
  g += '<rect x="58" y="58" width="' + (W - 116) + '" height="' + (H - 116) + '" rx="6" fill="none" stroke="#15163a" stroke-width="2"/>';
  const club = CC.APP_NAME.toUpperCase(), nk = club.replace(/ /g, '').length, ks = nk > 12 ? 42 : 46, gap = 8, wgap = 28; let x = (W - (nk * ks + (nk - 2) * gap + wgap)) / 2, ci = 0;
  club.split('').forEach(function (ch) {
    if (ch === ' ') { x += wgap - gap; return; }
    const c = KEYC[ci++ % 5];
    g += '<rect x="' + x + '" y="89" width="' + ks + '" height="' + ks + '" rx="10" fill="' + c[1] + '"/><rect x="' + x + '" y="84" width="' + ks + '" height="' + ks + '" rx="10" fill="' + c[0] + '"/>' +
      '<text x="' + (x + ks / 2) + '" y="117" font-family="' + sans + '" font-size="28" font-weight="bold" fill="#fff" text-anchor="middle">' + ch + '</text>';
    x += ks + gap;
  });
  g += '<text x="' + mid + '" y="222" font-family="' + serif + '" font-size="56" font-weight="bold" fill="#15163a" text-anchor="middle">Certificate of Achievement</text>';
  g += '<text x="' + mid + '" y="266" font-family="' + serif + '" font-size="25" font-style="italic" fill="#555" text-anchor="middle">proudly presented to</text>';
  const fsz = n.length <= 14 ? 62 : n.length <= 20 ? 50 : 40;
  g += '<text x="' + mid + '" y="340" font-family="' + hand + '" font-size="' + fsz + '" fill="#d8334e" text-anchor="middle">' + esc(n) + '</text>';
  g += '<line x1="290" y1="356" x2="833" y2="356" stroke="#e0a800" stroke-width="3"/>';
  g += '<text x="' + mid + '" y="398" font-family="' + sans + '" font-size="23" fill="#333" text-anchor="middle">for finishing all ' + LEVELS.length + ' levels of</text>';
  g += '<text x="' + mid + '" y="448" font-family="' + sans + '" font-size="40" font-weight="bold" fill="#e07a1a" text-anchor="middle">Typing Club' + (f.game ? ' · ' + esc(f.game.name) : '') + '</text>';
  g += '<text x="' + mid + '" y="482" font-family="' + sans + '" font-size="21" fill="#333" text-anchor="middle">Typing skills · Year ' + S.year + '</text>';
  const facts = [];
  if (f.best) facts.push('Best speed: ' + f.best + ' words a minute');
  facts.push('Accuracy: ' + f.avg + '%');
  g += '<text x="' + mid + '" y="530" font-family="' + sans + '" font-size="20" fill="#555" text-anchor="middle">' + esc(facts.join('  •  ')) + '</text>';
  if (f.tier) g += '<text x="' + mid + '" y="562" font-family="' + sans + '" font-size="22" font-weight="bold" fill="#15163a" text-anchor="middle">' + esc(f.tier) + ' Typist Medal</text>';
  g += '<polygon points="' + starPath(mid - 90, 598, 12, 5) + '" fill="#ffc92e" stroke="#e0a800"/><text x="' + (mid - 70) + '" y="604" font-family="' + sans + '" font-size="19" font-weight="bold" fill="#15163a">Stars collected: ' + f.stars + '</text>';
  /* a keyboard on each side */
  [82, 849].forEach(function (x0, ki) {
    const y0 = 330;
    g += '<rect x="' + x0 + '" y="' + y0 + '" width="192" height="76" rx="9" fill="#eceeff" stroke="#15163a" stroke-width="3"/>';
    [[10, 0, 337], [9, 7, 351], [8, 14, 365]].forEach(function (r, ri) { for (let i = 0; i < r[0]; i++) { const c = KEYC[(i + ri + ki) % 5]; g += '<rect x="' + (x0 + 8 + r[1] + i * 17.6) + '" y="' + r[2] + '" width="14" height="10.5" rx="2.6" fill="' + c[0] + '" stroke="' + c[1] + '" stroke-width="1"/>'; } });
    g += '<rect x="' + (x0 + 40) + '" y="' + (y0 + 60) + '" width="112" height="10" rx="3" fill="#c9f0ff" stroke="#139a9a" stroke-width="1.2"/>';
  });
  g += '<polygon points="' + starPath(1010, 310, 8, 3.2) + '" fill="#ffd23f"/><polygon points="' + starPath(238, 440, 6, 2.4) + '" fill="#6bcb77"/><polygon points="' + starPath(78, 440, 7, 2.8) + '" fill="#ff5c72"/>';
  g += '<polygon points="536,690 516,752 541,740 555,757 561,694" fill="#ff5c72"/><polygon points="586,690 606,752 581,740 567,757 561,694" fill="#3b82f6"/>';
  g += '<circle cx="561" cy="668" r="46" fill="#ffd23f" stroke="#e0a800" stroke-width="4"/><circle cx="561" cy="668" r="36" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="4 4"/><polygon points="' + starPath(561, 668, 24, 10) + '" fill="#e07a1a"/>';
  g += '<text x="240" y="702" font-family="' + sans + '" font-size="20" fill="#15163a" text-anchor="middle">' + esc(dt) + '</text><line x1="120" y1="710" x2="360" y2="710" stroke="#15163a" stroke-width="1.5"/><text x="240" y="732" font-family="' + sans + '" font-size="16" fill="#555" text-anchor="middle">Date</text>';
  g += '<line x1="763" y1="710" x2="1003" y2="710" stroke="#15163a" stroke-width="1.5"/><text x="883" y="732" font-family="' + sans + '" font-size="16" fill="#555" text-anchor="middle">Teacher, ' + esc(CC.APP_NAME) + '</text>';
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '">' + g + '</svg>';
}
function showCertificate() {
  stopRun(); CC.ui.close();
  const w = el('div', 'ty-certwrap'), top = el('div', 'ty-opts');
  const nm = el('input', 'ty-name'); nm.type = 'text'; nm.maxLength = 28; nm.placeholder = '✏️ Name on the certificate'; nm.value = S.name; nm.setAttribute('aria-label', 'Name on the certificate');
  top.appendChild(nm);
  const paper = el('div', 'ty-cert'); paper.innerHTML = certSvg(S.name);
  nm.addEventListener('input', function () { S.name = nm.value; paper.innerHTML = certSvg(S.name); });
  const row = el('div', 'ty-opts');
  const dl = el('button', 'btn primary', '⬇ Download picture'); dl.type = 'button';
  dl.addEventListener('click', function () {
    dl.blur(); const img = new Image();
    img.onload = function () {
      const c = document.createElement('canvas'); c.width = 2246; c.height = 1588; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(function (b) { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'typing-certificate' + (S.name ? '-' + S.name.replace(/[^\w-]+/g, '-') : '') + '.png'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800); }, 'image/png');
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(certSvg(S.name));
  });
  const pr = el('button', 'btn', '🖨 Print'); pr.type = 'button'; pr.addEventListener('click', function () { pr.blur(); window.print(); });
  const bk = el('button', 'btn', '🏠 Back'); bk.type = 'button'; bk.addEventListener('click', function () { bk.blur(); showHome(); });
  [dl, pr, bk].forEach(function (x) { row.appendChild(x); });
  w.appendChild(top); w.appendChild(paper); w.appendChild(row);
  w.appendChild(el('p', 'rep-note', 'Tip: print on A4, landscape. Leave the name empty to write it by hand.'));
  setView('cert', w);
}

/* ---------- plug into the Computer Club hub ---------- */
CC.modes.typing = {
  makey: false,
  enter: function () {
    CC.audio.init(); CC.watchStage($stage()); stopRun();
    if (!S.loop) S.loop = CC.createLoop(update, function () { });
    S.loop.start(); showHome();
  },
  exit: function () { stopRun(); if (S.loop) S.loop.stop(); S.view = 'home'; },
  onKeyDown: function (e) {
    const R = S.run; if (S.view !== 'play' || !R) return;
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Backspace') { e.preventDefault(); if (R.game === 'blaster' && R.target && R.phase === 'play') { R.target.i = 0; paintWord(R.target); hlKey(R.target.text[0]); setTarget(R, null); } return; }
    if (e.key.length === 1) { e.preventDefault(); if (!e.repeat) onChar(e.key); }
  },
  /* test hooks (used only by the automated checks) */
  _S: S, _sim: function (secs) { const n = Math.round(secs * 60); for (let i = 0; i < n; i++) { if (!S.run || S.run.phase === 'done' || S.run.phase === 'off') break; update(1 / 60); } },
  _start: function (game, lv) { S.game = game; S.level = lv; startRun(); }, _go: function () { const R = S.run; if (R && R.phase === 'count') { clearTimers(); R.ui.count.hidden = true; R.phase = 'play'; if (R.begin) R.begin(); } },
  _chars: onChar, _report: reportText, _cert: showCertificate, _earned: certEarned
};
})();
