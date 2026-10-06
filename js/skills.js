/* skills.js - Computer Skills Adventure: the reusable engine.
   One "activity" per task type (move / pick / drag / connect / dbl / right / type ...), all sharing the same
   teaching loop: say -> demonstrate -> highlight -> wait -> detect -> gentle feedback -> celebrate -> next.
   Content lives in skills_levels.js. Progress is kept in memory for this visit (no storage, no network). */
(function () {
'use strict';
const CC = window.CC, DATA = CC.SKILLS, LEVELS = DATA.LEVELS, WORLD = DATA.WORLD;
const $root = function () { return document.getElementById('sk-root'); };
const U = function (n) { return 'calc(var(--u)*' + n + ')'; };
const clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
const dist = function (a, b) { return Math.hypot(a.x - b.x, a.y - b.y); };
const pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };

/* ---------- skills shown in the teacher report ---------- */
const SKILLS = [
  { id: 'move', name: 'Mouse Movement', icon: '🖱️' }, { id: 'click', name: 'Left Click', icon: '👆' },
  { id: 'drag', name: 'Drag & Drop', icon: '✋' }, { id: 'connect', name: 'Connecting', icon: '🔗' },
  { id: 'dbl', name: 'Double Click', icon: '👆👆' }, { id: 'right', name: 'Right Click', icon: '📋' },
  { id: 'keys', name: 'Keyboard Letters', icon: '🔤' }, { id: 'caps', name: 'CAPS LOCK / Big & Small', icon: '🔠' },
  { id: 'words', name: 'Typing Words', icon: '⌨️' }, { id: 'special', name: 'Space, Backspace, Enter', icon: '↩️' }
];
const DEFAULT_SKILL = { move: 'move', pick: 'click', drag: 'drag', connect: 'connect', dbl: 'dbl', right: 'right', type: 'keys', capsstate: 'caps', enter: 'special' };

/* ---------- state (lives for the whole visit) ---------- */
const S = {
  year: 2, name: '', view: 'home',
  opt: { sound: true, voice: false, contrast: false, slow: false, clickPlace: false },
  done: {}, stars: {}, unlockAll: false,
  stats: {}, seen: {}, badges: {},
  level: null, tasks: [], ti: 0, t: null, act: null,
  mistakes: 0, fails: 0, adaptK: 1, slowA: false,
  locked: false, paused: false, finished: false, timers: [], idleTimer: 0, demoTok: 0, ptr: null, caps: false, lastSay: ''
};
SKILLS.forEach(function (s) { S.stats[s.id] = { ok: 0, bad: 0 }; });

/* ---------- small helpers ---------- */
const E = { stage: null, items: null, svg: null, say: null, sub: null, buddy: null, dots: null, cursor: null, mouse: null, typeBox: null, kb: null, caps: null, overlay: null };
function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
function later(fn, ms) { const id = setTimeout(function () { const i = S.timers.indexOf(id); if (i >= 0) S.timers.splice(i, 1); fn(); }, ms); S.timers.push(id); return id; }
function clearTimers() { S.timers.forEach(clearTimeout); S.timers = []; clearInterval(S.tick); S.tick = 0; cancelAnimationFrame(S.raf); clearTimeout(S.idleTimer); }
function speedMul() { return (S.opt.slow ? 1.7 : 1) * (S.slowA ? 1.4 : 1); }
function kScale() { return ({ 1: 1.3, 2: 1.1, 3: 1 })[S.year] * S.adaptK; }
function toU(e) { const r = E.stage.getBoundingClientRect(); return { x: (e.clientX - r.left) / (r.width / 100), y: (e.clientY - r.top) / (r.width / 100) }; }
function stageH() { return E.stage.classList.contains('typing') ? 37.5 : 56.25; }
function setSfxGain() { if (CC.audio.master) CC.audio.master.gain.value = S.opt.sound ? 0.8 : 0; }
function sfx(n) { if (S.opt.sound && CC.sfx[n]) CC.sfx[n](); }
function skillOf(t) { return t.skill || DEFAULT_SKILL[t.type]; }
function rec(skill, ok) { const s = S.stats[skill]; if (s) { if (ok) s.ok++; else s.bad++; } }

/* ---------- optional spoken help: only uses voices that live on this computer (no network) ---------- */
function speak(text) {
  if (!S.opt.voice || !window.speechSynthesis) return;
  try {
    const vs = speechSynthesis.getVoices().filter(function (v) { return v.localService && /^en/i.test(v.lang); });
    if (!vs.length) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[^\w\s.,!?'-]/g, ' ').replace(/\s+/g, ' ').trim());
    u.voice = vs[0]; u.rate = 0.85; u.pitch = 1.15; speechSynthesis.speak(u);
  } catch (err) { /* voice is only a bonus */ }
}

/* ---------- Buddy: the friendly guide. Always a short line, never "wrong". ---------- */
const MOODS = { hi: '🐶', think: '🤔', cheer: '🥳', watch: '👀', calm: '🐶' };
function say(text, mood, sub) {
  S.lastSay = text;
  if (!E.say) return;
  E.say.textContent = text;
  E.buddy.textContent = MOODS[mood || 'calm'];
  E.buddy.className = 'sk-buddy m-' + (mood || 'calm');
  E.sub.textContent = sub || '';
  speak(text + (sub ? '. ' + sub : ''));
}
const PRAISE = ['Great job!', 'Excellent! ⭐', 'Perfect!', 'Well done!', 'Super! 🌟', 'Brilliant!'];
const NICE_TRY = ['Almost! Try again.', "You're close!", 'Nearly there! Try again.', 'Good try! Have another go.'];

function confetti(n) {
  if (!E.stage) return;
  const cols = ['#ff5c72', '#ff9f45', '#ffd23f', '#6bcb77', '#22c6c6', '#a77bff'];
  for (let i = 0; i < (n || 22); i++) {
    const c = el('i', 'sk-conf'); c.style.left = (Math.random() * 100) + '%'; c.style.background = cols[i % cols.length];
    c.style.setProperty('--dx', (Math.random() * 20 - 10) + 'u'); c.style.animationDelay = (Math.random() * 0.3) + 's';
    c.style.animationDuration = (1.2 + Math.random() * 0.8) + 's';
    E.stage.appendChild(c); setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, 2400);
  }
}

/* ---------- the animated cursor + mouse diagram used for demonstrations ---------- */
const CURSOR_SVG = '<svg viewBox="0 0 24 30" aria-hidden="true"><path d="M2 2 L2 24 L8 18.5 L12.2 28 L16 26.4 L11.8 17 L20 17 Z" fill="#fff" stroke="#15163a" stroke-width="2" stroke-linejoin="round"/></svg><b class="ring"></b>';
function curSet(x, y, ms) { E.cursor.style.transitionDuration = (ms || 0) + 'ms'; E.cursor.style.left = U(x); E.cursor.style.top = U(y); }
function wait(ms) { const tok = S.demoTok; return new Promise(function (r) { setTimeout(function () { r(tok === S.demoTok); }, ms * speedMul()); }); }
function setMouse(btn) { if (E.mouse) E.mouse.dataset.btn = btn || 'none'; }
async function curMove(x, y, ms) { curSet(x, y, ms * speedMul()); return wait(ms + 60); }
async function curClick(kind) {   /* kind: left | right */
  setMouse(kind || 'left'); E.cursor.classList.add('click'); sfx('clink');
  const ok = await wait(260); E.cursor.classList.remove('click'); setMouse('none'); return ok;
}
function curHide() { E.cursor.hidden = true; E.cursor.classList.remove('click', 'down'); setMouse('none'); }
function curShow(x, y) { E.cursor.hidden = false; E.cursor.classList.remove('click', 'down'); curSet(x, y, 0); }

/* ---------- level flow ---------- */
const ACT = {};
function tasksFor(lv) { return lv.tasks.filter(function (t) { return !t.min || S.year >= t.min; }); }
function isOpen(id) { return S.unlockAll || id === 1 || S.done[id - 1]; }

function startLevel(id) {
  clearTimers(); CC.ui.close();
  S.level = LEVELS[id - 1]; S.tasks = tasksFor(S.level); S.ti = 0; S.mistakes = 0; S.fails = 0; S.finished = false; S.paused = false;
  S.adaptK = 1; S.slowA = false; S.act = null; S.t = null; S.simplified = false; S.hintLevel = 0;
  S.tasks.forEach(function (t) { t.demo = t.demo && t._demo0 !== false; t._demo0 = !!t.demo; });
  renderPlay();
  const lv = S.level;
  say(lv.intro, 'hi');
  CC.sfx.letsGo && sfx('letsGo');
  CC.ui.show(E.stage, { emoji: lv.icon, title: lv.title, text: lv.intro, buttons: [
    { icon: '▶', label: 'Go!', primary: true, keys: ['Enter', 'Space'], fn: function () { beginTask(0); } },
    { icon: '🗺️', label: '', fn: showHome }] });
}

function beginTask(i, noDemo) {
  clearTimers(); S.demoTok++; curHide();
  if (S.act && S.act.destroy) S.act.destroy();
  S.ti = i; S.t = S.tasks[i]; S.fails = 0; S.finished = false; S.locked = false; S.ptr = null; S.idleDemo = false;
  E.items.innerHTML = ''; E.svg.innerHTML = ''; E.typeBox.innerHTML = ''; E.typeBox.hidden = true;
  E.stage.classList.toggle('typing', !!S.level.kb); E.stage.parentNode.classList.toggle('typing', !!S.level.kb);
  E.kb.hidden = !S.level.kb; E.caps.hidden = !S.level.kb;
  E.stage.dataset.type = S.t.type;
  const needsMouse = ['move', 'pick', 'drag', 'connect', 'dbl', 'right'].indexOf(S.t.type) >= 0;
  E.mouse.hidden = !needsMouse; setMouse('none');
  S.act = ACT[S.t.type](S.t);
  renderDots();
  say(S.t.say, 'calm', '');
  const seenKey = skillOf(S.t) + ':' + S.t.type;
  const demoWanted = !noDemo && S.act.demo && (S.t.demo || !S.seen[seenKey]);
  S.seen[seenKey] = true;
  if (demoWanted) runDemo(); else ready();
}
async function runDemo() {
  S.locked = true; const tok = ++S.demoTok;
  say(S.t.say, 'watch', '👀 Watch me!');
  await wait(450);
  if (tok !== S.demoTok) return;
  try { await S.act.demo(); } catch (err) { /* a cancelled demo just ends */ }
  if (tok !== S.demoTok) return;
  curHide(); if (S.act.resetDemo) S.act.resetDemo();
  ready();
}
function skipDemo() { S.demoTok++; curHide(); if (S.act.resetDemo) S.act.resetDemo(); ready(); }
function ready() {
  S.locked = false;
  say(S.t.say, 'calm', S.t.type === 'type' || S.t.type === 'enter' || S.t.type === 'capsstate' ? '' : '👆 Your turn!');
  if (S.act.hl) S.act.hl(true);
  armIdle();
}
function armIdle() {
  clearTimeout(S.idleTimer);
  S.idleTimer = setTimeout(function () {
    if (S.paused || S.locked || S.finished || CC.ui.active) { armIdle(); return; }
    if (S.act.hl) S.act.hl(true);
    say(S.t.say, 'think', 'Need help? Watch Buddy! 👀');
    if (!S.idleDemo && S.act.demo) { S.idleDemo = true; later(function () { if (!S.finished && !S.paused) runDemo(); }, 900); }
    else armIdle();
  }, 14000 * speedMul());
}
function touch() { if (S.act && !S.finished) armIdle(); }

/* success / gentle miss shared by every activity */
function good(msg) {
  if (S.finished) return; S.finished = true; S.locked = true; clearTimeout(S.idleTimer);
  rec(skillOf(S.t), true); sfx('good'); confetti(14);
  say(msg || S.t.win || pick(PRAISE), 'cheer', '');
  markDot(S.ti);
  later(function () { if (S.ti + 1 >= S.tasks.length) finishLevel(); else beginTask(S.ti + 1); }, 1700 * speedMul());
}
function oops(msg, noCount) {
  if (S.finished) return;
  if (!noCount) { S.fails++; S.mistakes++; rec(skillOf(S.t), false); }
  sfx('softMiss'); say(msg || pick(NICE_TRY), 'think', ''); armIdle();
  if (S.fails >= 3) helpTogether();
}
/* adaptive help: bigger, slower, fewer things, then show the demo again */
function helpTogether() {
  S.fails = 0; S.adaptK = Math.min(1.3, S.adaptK + 0.15); S.slowA = true;
  S.locked = true; S.demoTok++;
  say("Let's try together! Watch the mouse. 👀", 'watch', '');
  S.hintLevel = (S.hintLevel || 0) + 1;
  later(function () { if (!S.finished) { S.simplified = true; S.tasks[S.ti].demo = true; beginTask(S.ti, false); } }, 1500 * speedMul());
}

function finishLevel() {
  clearTimers(); S.locked = true;
  const lv = S.level, m = S.mistakes, stars = m <= 1 ? 3 : m <= 4 ? 2 : 1;
  S.done[lv.id] = true; S.stars[lv.id] = Math.max(S.stars[lv.id] || 0, stars); S.badges[lv.id] = lv.badge;
  confetti(40); sfx('levelComplete'); say('You did it! 🎉', 'cheer', '');
  const last = lv.id >= LEVELS.length;
  CC.ui.show(E.stage, { emoji: '🏆', stars: stars, title: 'You completed Level ' + lv.id + '!', text: 'New badge: ' + lv.badge + ' 🏆',
    buttons: [
      last ? { icon: '📋', label: 'Report', primary: true, keys: ['Enter', 'Space'], fn: showReport } : { icon: '▶', label: 'Next', primary: true, keys: ['Enter', 'Space'], fn: function () { startLevel(lv.id + 1); } },
      { icon: '🔁', label: '', fn: function () { startLevel(lv.id); } }, { icon: '🗺️', label: '', fn: showHome }] });
}

/* ---------- toolbar actions ---------- */
function repeatHelp() { if (!S.act || S.finished || CC.ui.active) return; S.idleDemo = true; if (S.act.demo) runDemo(); else { say(S.t.say, 'calm', ''); if (S.act.hl) S.act.hl(true); speak(S.t.say); } }
function restartTask() { if (!S.level || CC.ui.active) return; S.paused = false; beginTask(S.ti, true); }
function togglePause() {
  if (!S.level || S.view !== 'play') return;
  if (S.paused) { S.paused = false; CC.ui.close(); return; }
  if (CC.ui.active) return;
  S.paused = true;
  CC.ui.show(E.stage, { emoji: '⏸️', title: 'Paused', buttons: [{ icon: '▶', label: 'Play', primary: true, keys: ['Enter', 'Space'], fn: function () { S.paused = false; } },
    { icon: '🗺️', label: '', fn: function () { S.paused = false; showHome(); } }] });
}

/* =====================================================================
   ACTIVITIES.  Each returns { demo, hl, down, move, up, ctx, key, caps, simplify, destroy, resetDemo }
   ===================================================================== */
function mkItem(def, o) {
  o = o || {}; const k = o.k || 1;
  let w = (def.w || def.s || 12) * k, h = (def.h || def.s || 12) * k;
  const b = el('div', 'sk-item' + (def.cls ? ' ' + def.cls : '') + (o.cls ? ' ' + o.cls : ''));
  const bound = (!o.free);
  let x = def.x, y = def.y;
  if (bound) { x = clamp(x, w / 2 + 1, 99 - w / 2); y = clamp(y, h / 2 + 1, stageH() - 1 - h / 2); }
  b.style.width = U(w); b.style.height = U(h); b.style.left = U(x); b.style.top = U(y);
  b.style.fontSize = U(Math.min(w, h) * 0.78);
  if (def.svg) b.innerHTML = def.svg;
  else if (def.c) { b.classList.add('balloon'); b.style.setProperty('--c', def.c); if (def.t) b.innerHTML = '<span>' + def.t + '</span>'; else b.innerHTML = '<i></i>'; }
  else b.textContent = def.e || '';
  if (def.shadow) b.classList.add('shadow');
  if (def.id != null) b.dataset.id = def.id;
  b._def = def; b._x = x; b._y = y; b._w = w; b._h = h;
  return b;
}
function place(b, x, y) { b._x = x; b._y = y; b.style.left = U(x); b.style.top = U(y); }
function wiggle(b) { b.classList.remove('wig'); void b.offsetWidth; b.classList.add('wig'); }

/* ---- MOVE: reach a target (it can drift for the "follow" game) ---- */
ACT.move = function (t) {
  const def = t.items[0], k = kScale(), b = mkItem(def, { k: k, cls: 'tgt', free: !!def.move }); E.items.appendChild(b);
  const mv = def.move; let inside = 0, need = t.dwell || (S.year === 1 ? 350 : 500), ph = 0, last = performance.now();
  const r = function () { return Math.max(b._w, b._h) / 2; };
  S.tick = setInterval(function () {
    const now = performance.now(), dt = now - last; last = now;
    if (mv && !S.locked && !S.paused) { ph += dt / 1000 * mv.sp * (S.slowA ? 0.7 : 1); place(b, def.x + mv.rx * Math.sin(ph), def.y + mv.ry * Math.sin(ph * 2)); }
    if (S.paused || S.locked || S.finished || CC.ui.active) return;
    const p = S.ptr, hit = p && dist(p, { x: b._x, y: b._y }) <= r();
    inside = hit ? inside + dt : Math.max(0, inside - dt * 0.6);
    b.style.setProperty('--p', Math.min(1, inside / need));
    b.classList.toggle('near', !!hit);
    if (inside >= need) good();
  }, 40);
  return {
    hl: function (on) { b.classList.toggle('hl', on); },
    move: function (e) { S.ptr = toU(e); touch(); },
    async demo() {
      const from = { x: def.x > 50 ? 14 : 86, y: def.y > 30 ? 12 : 44 };
      curShow(from.x, from.y); await wait(350);
      await curMove(def.x + (mv ? 4 : 0), def.y, 1300);
      await wait(500);
    },
    simplify: function () { }
  };
};

/* ---- PICK: click the right thing(s): one, several in any order, or in a set order ---- */
ACT.pick = function (t) {
  const k = kScale(), found = {}; let step = 0;
  const targets = t.answer, ordered = !t.any;
  const nodes = {};
  t.items.forEach(function (d) {
    if (S.simplified && d.d && S.hintLevel > 0) return;      // fewer things on screen after a struggle
    const b = mkItem(d, { k: k * (t.needLook && S.hintLevel ? 1.9 : 1) }); E.items.appendChild(b); nodes[d.id] = b;
  });
  const nameOf = function (id) { const d = t.items.filter(function (i) { return i.id === id; })[0]; return d ? d.n : 'one'; };
  const cur = function () { return ordered ? [targets[step]] : targets.filter(function (i) { return !found[i]; }); };
  function showSay() { say(t.says && t.says[step] ? t.says[step] : t.say, 'calm', '👆 Your turn!'); }
  return {
    hl: function (on) { Object.keys(nodes).forEach(function (id) { nodes[id].classList.remove('hl'); });
      if (!on || (t.needLook && !S.hintLevel)) return;
      cur().forEach(function (id) { if (nodes[id]) nodes[id].classList.add('hl'); }); },
    down: function (e) {
      if (S.locked || S.paused) return; touch();
      if (e.button !== 0) { oops('Use the LEFT mouse button to click.', true); return; }
      const b = e.target.closest('.sk-item'); const id = b && b.dataset.id;
      if (!b || !nodes[id]) { oops('Almost! Click the picture, not the background.'); return; }
      if (found[id]) return;
      const ok = ordered ? id === targets[step] : targets.indexOf(id) >= 0;
      if (!ok) { wiggle(b); oops('That is the ' + nameOf(id) + '. Look for the ' + nameOf(cur()[0]) + '. 🔎'); return; }
      found[id] = true; b.classList.remove('hl'); b.classList.add('got'); sfx('pop'); rec(skillOf(t), true);
      step++;
      const left = ordered ? targets.length - step : targets.filter(function (i) { return !found[i]; }).length;
      if (!left) { good(); return; }
      say(pick(['Nice!', 'Yes! Keep going!', 'You got it!']), 'cheer', '');
      later(function () { if (!S.finished) { showSay(); if (S.act.hl) S.act.hl(true); } }, 600);
    },
    contextmenu: function () { oops('Use the LEFT mouse button to click.', true); },
    async demo() {
      const id = targets[0], b = nodes[id]; if (!b) return;
      curShow(b._x > 50 ? 12 : 88, 46); await wait(300);
      await curMove(b._x, b._y, 1200); setMouse('left'); await curClick('left'); b.classList.add('wig');
      await wait(500); b.classList.remove('wig');
    }
  };
};

/* ---- DRAG: pieces to zones with the mouse; click-then-click and keyboard work too ---- */
ACT.drag = function (t) {
  const pieces = t.pieces.filter(function (p) { return !p.min || S.year >= p.min; });
  const zones = t.zones.filter(function (z) { const p = pieces.filter(function (q) { return q.id === z.for; })[0]; return p && (!z.min || S.year >= z.min); });
  const placed = {}; let sel = null, drag = null, count = 0;
  (t.base || []).forEach(function (d) { const b = mkItem(d, { free: true, cls: 'base' }); E.items.appendChild(b); });
  const pNode = {}, zNode = [];
  const kind = function (p) { return p.kind || p.id; };
  const size = function (p) { return { w: p.w || p.s, h: p.h || p.s }; };
  zones.forEach(function (z, i) {
    const p = pieces.filter(function (q) { return q.id === z.for; })[0], sz = size(p);
    const zn = mkItem({ x: z.x, y: z.y, w: z.s || sz.w, h: z.s || sz.h, svg: z.e ? null : p.svg, e: z.e || p.e, id: 'z' + i }, { free: true, cls: 'zone' + (z.e ? ' art' : '') });
    zn._zone = z; zn._kind = kind(p); zn._filled = false; zn.setAttribute('role', 'button'); zn.tabIndex = 0;
    zn.setAttribute('aria-label', 'drop spot ' + kind(p));
    E.items.appendChild(zn); zNode.push(zn);
  });
  /* trays: loose pieces wait in two clear lanes at the sides (x < 25 and x > 75); the build area is the middle.
     Rows are spaced so pieces never touch each other, and they start below the mouse picture in the top-right corner. */
  const side = [[], []];
  pieces.forEach(function (p, i) { side[i % 2].push(p); });
  side.forEach(function (arr, s) {
    if (arr.length) { const tray = el('div', 'sk-tray'); tray.style.left = U(s === 0 ? 1.5 : 75.5); tray.style.top = U(13); tray.style.width = U(23); tray.style.height = U(41.5); E.items.insertBefore(tray, E.items.firstChild); }
    const cols = arr.length > 3 ? 2 : 1, rows = Math.ceil(arr.length / cols), cell = rows >= 4 ? 9 : 11;
    arr.forEach(function (p, i) {
      const sz = size(p), c = i % cols, r = Math.floor(i / cols);
      const x = cols === 1 ? (s === 0 ? 13 : 87) : (s === 0 ? 7.5 + c * 11 : 81.5 + c * 11);
      const y = rows === 1 ? 33 : 19.5 + r * (28 / (rows - 1));
      const b = mkItem({ id: p.id, x: x, y: y, w: sz.w, h: sz.h, svg: p.svg, e: p.e }, { free: true, cls: 'piece' });
      b._p = p; b._kind = kind(p); b._home = { x: x, y: y }; b._sc = clamp(cell / Math.max(sz.w, sz.h), 0.2, 1); b.style.setProperty('--sc', b._sc); b.style.zIndex = 10 + (p.z || 0);
      b.setAttribute('role', 'button'); b.tabIndex = 0; b.setAttribute('aria-label', 'piece ' + kind(p));
      E.items.appendChild(b); pNode[p.id] = b;
    });
  });
  const radius = function (zn) { return Math.max(zn._w, zn._h) / 2 + 5 + 2.5 * (S.hintLevel || 0); };
  function freeZoneFor(pn, near) {
    let best = null, bd = 1e9;
    zNode.forEach(function (zn) { if (zn._filled || zn._kind !== pn._kind) return; const d = near ? dist(near, { x: zn._x, y: zn._y }) : 0; if (d < bd) { bd = d; best = zn; } });
    return best;
  }
  function putPiece(pn, zn) {
    zn._filled = true; zn.classList.add('filled'); placed[pn._p.id] = true; pn._placed = true; count++;
    pn.classList.remove('held', 'sel', 'back', 'hl'); pn.classList.add('placed'); pn.style.setProperty('--sc', 1);
    pn.style.zIndex = 5 + (pn._p.z || 0);
    place(pn, zn._x, zn._y); sfx('clink'); sfx('pop');
    clearSel(); setMouse('none');
    if (count >= pieces.length) good(t.win);
    else { say(pick(['Nice! Next piece.', 'Yes! Keep going!', 'Great! Another one!']), 'cheer', ''); later(function () { if (!S.finished) { say(t.say, 'calm', '👆 Your turn!'); hl(true); } }, 700); }
  }
  function clearSel() { if (sel) sel.classList.remove('sel'); sel = null; zNode.forEach(function (z) { z.classList.remove('hl'); }); }
  function select(pn) {
    clearSel(); sel = pn; pn.classList.add('sel');
    zNode.forEach(function (z) { z.classList.toggle('hl', !z._filled && z._kind === pn._kind); });
  }
  function sendHome(pn) { pn.style.zIndex = 10 + (pn._p.z || 0); pn.classList.add('back'); pn.classList.remove('held'); pn.style.setProperty('--sc', pn._sc); place(pn, pn._home.x, pn._home.y); }
  function hl(on) {
    Object.keys(pNode).forEach(function (id) { pNode[id].classList.remove('hl'); });
    zNode.forEach(function (z) { z.classList.remove('hl'); });
    if (!on) return;
    const first = pieces.filter(function (p) { return !placed[p.id]; })[0]; if (!first) return;
    pNode[first.id].classList.add('hl'); const z = freeZoneFor(pNode[first.id]); if (z) z.classList.add('hl');
  }
  function tryPlaceByClick(zn) {
    if (!sel || zn._filled) return false;
    if (zn._kind === sel._kind) { putPiece(sel, zn); return true; }
    oops('Almost! That piece goes in a different spot. Look for the glowing one.'); return true;
  }
  function onItemKey(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault(); e.stopPropagation(); if (S.locked || S.paused) return;
    const n = e.currentTarget;
    if (n.classList.contains('piece') && !n._placed) select(n); else if (n.classList.contains('zone')) tryPlaceByClick(n);
  }
  Object.keys(pNode).forEach(function (id) { pNode[id].addEventListener('keydown', onItemKey); });
  zNode.forEach(function (z) { z.addEventListener('keydown', onItemKey); });
  return {
    hl: hl,
    down: function (e) {
      if (S.locked || S.paused) return; touch();
      if (e.button !== 0) { oops('Use the LEFT mouse button.', true); return; }
      const n = e.target.closest('.sk-item');
      if (n && n.classList.contains('zone') && sel) { tryPlaceByClick(n); return; }
      if (!n || !n.classList.contains('piece') || n._placed) { if (sel) clearSel(); return; }
      const p = toU(e); drag = { n: n, sx: p.x, sy: p.y, moved: false };
      n.classList.add('held'); n.classList.remove('back'); n.style.setProperty('--sc', 1); n.style.zIndex = 100; setMouse('hold'); sfx('pickup');
      try { E.stage.setPointerCapture(e.pointerId); } catch (err) { }
      zNode.forEach(function (z) { z.classList.toggle('hl', !z._filled && z._kind === n._kind); });
    },
    move: function (e) {
      S.ptr = toU(e); if (!drag) return; touch();
      const p = S.ptr; if (!drag.moved && dist(p, { x: drag.sx, y: drag.sy }) > 1.2) drag.moved = true;
      if (drag.moved) place(drag.n, p.x, p.y);
    },
    up: function (e) {
      if (!drag) return; const d = drag; drag = null; const n = d.n; const p = toU(e);
      try { E.stage.releasePointerCapture(e.pointerId); } catch (err) { }
      setMouse('none'); n.classList.remove('held');
      if (!d.moved) {                       /* a click without dragging: teach, but also allow click-to-place */
        sendHome(n); select(n); n.classList.remove('back');
        if (!S.opt.clickPlace) oops('Hold the mouse button while you move! (Or click the glowing spot.)'); else say('Now click the glowing spot.', 'calm', '');
        return;
      }
      let target = null, near = null;
      zNode.forEach(function (z) { if (z._filled) return; const dd = dist(p, { x: z._x, y: z._y }); if (dd <= radius(z)) { if (z._kind === n._kind && (!target || dd < dist(p, { x: target._x, y: target._y }))) target = z; else if (z._kind !== n._kind) near = z; } });
      if (target) { putPiece(n, target); return; }
      sendHome(n);
      if (near) oops('Almost! That piece goes somewhere else. Look for the glowing spot.');
      else oops('Keep holding until you reach the ' + (t.drop || 'spot') + '! Then let go.');
    },
    cancel: function () { if (drag) { sendHome(drag.n); drag = null; setMouse('none'); } },
    async demo() {
      const pn = pNode[pieces[0].id], zn = freeZoneFor(pn); if (!pn || !zn) return;
      curShow(pn._home.x + 14, pn._home.y + 10); await wait(300);
      await curMove(pn._home.x, pn._home.y, 1000);
      E.cursor.classList.add('down'); setMouse('hold'); say(t.say, 'watch', '✋ Hold the button…'); pn.classList.add('held'); pn.style.setProperty('--sc', 1); sfx('pickup'); await wait(500);
      curSet(zn._x, zn._y, 1600 * speedMul()); pn.style.transitionDuration = (1600 * speedMul()) + 'ms'; place(pn, zn._x, zn._y); say(t.say, 'watch', '➡️ Drag it over…');
      await wait(1700); say(t.say, 'watch', '👐 …and let go!'); E.cursor.classList.remove('down'); setMouse('none'); sfx('clink'); await wait(700);
    },
    resetDemo: function () { const pn = pNode[pieces[0].id]; if (pn && !pn._placed) { pn.style.transitionDuration = ''; pn.classList.remove('held'); sendHome(pn); } curHide(); },
    destroy: function () { }
  };
};

/* ---- CONNECT: drag (or click, then click) a line from a picture to its partner ---- */
ACT.connect = function (t) {
  const L = t.left, R = t.right, H = stageH(), done = {}; let line = null, from = null, sel = null;
  const nodes = { L: {}, R: {} };
  const ys = function (n) { const top = 12, bot = H - 9; return function (i) { return n === 1 ? (top + bot) / 2 : top + i * (bot - top) / (n - 1); }; };
  const yl = ys(L.length), yr = ys(R.length), s = L.length > 3 ? 11 : 13;
  L.forEach(function (d, i) { const b = mkItem({ id: d.id, e: d.e, x: 24, y: yl(i), s: s, shadow: d.shadow }, { free: true, cls: 'cn left' }); b._side = 'L'; b._name = d.n; E.items.appendChild(b); nodes.L[d.id] = b; b.tabIndex = 0; b.setAttribute('role', 'button'); });
  R.forEach(function (d, i) { const b = mkItem({ id: d.id, e: d.e, x: 76, y: yr(i), s: s, shadow: d.shadow }, { free: true, cls: 'cn right' }); b._side = 'R'; b._name = d.n; E.items.appendChild(b); nodes.R[d.id] = b; b.tabIndex = 0; b.setAttribute('role', 'button'); });
  const colors = ['#ff5c72', '#ff9f45', '#22c6c6', '#a77bff', '#6bcb77'];
  const NS = 'http://www.w3.org/2000/svg';
  E.svg.setAttribute('viewBox', '0 0 100 ' + H);
  function mkLine(a, ci) { const l = document.createElementNS(NS, 'line'); l.setAttribute('x1', a._x); l.setAttribute('y1', a._y); l.setAttribute('x2', a._x); l.setAttribute('y2', a._y);
    l.setAttribute('stroke', colors[ci % colors.length]); l.setAttribute('stroke-width', '1.4'); l.setAttribute('stroke-linecap', 'round'); E.svg.appendChild(l); return l; }
  let made = 0, total = L.length;
  function link(a, b) {
    done[a._id] = true; a.classList.add('linked'); b.classList.add('linked');
    const l = line || mkLine(a, made); l.setAttribute('x2', b._x); l.setAttribute('y2', b._y); l.setAttribute('stroke', colors[made % colors.length]);
    line = null; made++; sfx('pop'); setMouse('none');
    if (made >= total) good(); else { say(pick(['Nice link!', 'Yes! Another one!', 'You joined them!']), 'cheer', ''); later(function () { if (!S.finished) { say(t.say, 'calm', '👆 Your turn!'); hl(true); } }, 600); }
  }
  function drop(a, b) {
    if (!b || b._side !== 'R') return false;
    if (t.pairs[a._id] === b._id) { link(a, b); return true; }
    return 'bad';
  }
  Object.keys(nodes.L).forEach(function (id) { nodes.L[id]._id = id; }); Object.keys(nodes.R).forEach(function (id) { nodes.R[id]._id = id; });
  function hl(on) {
    Object.keys(nodes.L).forEach(function (id) { nodes.L[id].classList.remove('hl'); }); Object.keys(nodes.R).forEach(function (id) { nodes.R[id].classList.remove('hl'); });
    if (!on) return;
    const id = Object.keys(nodes.L).filter(function (i) { return !done[i]; })[0]; if (!id) return;
    nodes.L[id].classList.add('hl'); nodes.R[t.pairs[id]].classList.add('hl');
  }
  function bad(a, b) { if (b) wiggle(b); oops('Almost! ' + (a._name ? 'Where does the ' + a._name + ' belong?' : 'Try another one.') + ' 🤔'); }
  function selKey(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return; e.preventDefault(); e.stopPropagation(); if (S.locked || S.paused) return;
    const n = e.currentTarget; if (n._side === 'L' && !done[n._id]) { if (sel) sel.classList.remove('sel'); sel = n; n.classList.add('sel'); }
    else if (n._side === 'R' && sel) { const r = drop(sel, n); sel.classList.remove('sel'); const a = sel; sel = null; if (r === 'bad') bad(a, n); }
  }
  Object.keys(nodes.L).forEach(function (i) { nodes.L[i].addEventListener('keydown', selKey); }); Object.keys(nodes.R).forEach(function (i) { nodes.R[i].addEventListener('keydown', selKey); });
  return {
    hl: hl,
    down: function (e) {
      if (S.locked || S.paused) return; touch();
      if (e.button !== 0) { oops('Use the LEFT mouse button.', true); return; }
      const n = e.target.closest('.cn');
      if (n && n._side === 'R' && sel) { const r = drop(sel, n); sel.classList.remove('sel'); const a = sel; sel = null; if (r === 'bad') bad(a, n); return; }
      if (!n || n._side !== 'L' || done[n._id]) return;
      from = n; line = mkLine(n, made); from.moved = false; setMouse('hold'); sfx('pickup');
      try { E.stage.setPointerCapture(e.pointerId); } catch (err) { }
    },
    move: function (e) { S.ptr = toU(e); if (!from || !line) return; touch(); const p = S.ptr; if (dist(p, { x: from._x, y: from._y }) > 1.5) from.moved = true; line.setAttribute('x2', p.x); line.setAttribute('y2', p.y); },
    up: function (e) {
      if (!from) return; const a = from; from = null; setMouse('none');
      try { E.stage.releasePointerCapture(e.pointerId); } catch (err) { }
      if (!a.moved) {                         /* click without dragging: allow click-click, and teach holding */
        if (line && line.parentNode) E.svg.removeChild(line); line = null;
        if (sel) sel.classList.remove('sel'); sel = a; a.classList.add('sel');
        if (!S.opt.clickPlace) oops('Hold the mouse button and drag a line! (Or click its partner now.)'); return;
      }
      const under = document.elementFromPoint(e.clientX, e.clientY), b = under && under.closest ? under.closest('.cn') : null;
      const r = drop(a, b);
      if (r === true) return;
      if (line && line.parentNode) E.svg.removeChild(line); line = null;
      if (r === 'bad') bad(a, b); else oops('Keep holding until you reach its partner! Then let go.');
    },
    cancel: function () { if (from) { if (line && line.parentNode) E.svg.removeChild(line); line = null; from = null; setMouse('none'); } },
    async demo() {
      const id = Object.keys(nodes.L)[0], a = nodes.L[id], b = nodes.R[t.pairs[id]];
      curShow(a._x - 12, a._y + 12); await wait(300); await curMove(a._x, a._y, 900);
      E.cursor.classList.add('down'); setMouse('hold'); sfx('pickup'); const l = mkLine(a, 0); await wait(300);
      const steps = 24; for (let i = 1; i <= steps; i++) { const x = a._x + (b._x - a._x) * i / steps, y = a._y + (b._y - a._y) * i / steps; curSet(x, y, 70); l.setAttribute('x2', x); l.setAttribute('y2', y); if (!(await wait(60))) { if (l.parentNode) E.svg.removeChild(l); return; } }
      E.cursor.classList.remove('down'); setMouse('none'); sfx('clink'); await wait(600); if (l.parentNode) E.svg.removeChild(l);
    },
    resetDemo: function () { E.svg.innerHTML = ''; }
  };
};

/* ---- DOUBLE-CLICK and RIGHT-CLICK ---- */
ACT.dbl = function (t) {
  const k = kScale(), b = mkItem(t.item, { k: k, cls: 'tgt' }); E.items.appendChild(b);
  let last = null; const gap = function () { return (S.year === 1 ? 800 : 600) * (S.slowA ? 1.4 : 1) * (S.opt.slow ? 1.3 : 1); };
  return {
    hl: function (on) { b.classList.toggle('hl', on); },
    down: function (e) {
      if (S.locked || S.paused) return; touch();
      if (e.button !== 0) { oops('Use the LEFT mouse button. Click, click!', true); return; }
      const n = e.target.closest('.sk-item'); if (!n) { oops('Almost! Click the treasure box.'); last = null; return; }
      const now = performance.now(), p = toU(e);
      if (last && now - last.t <= gap() && dist(p, last.p) < 8) { last = null; open(); return; }
      if (last && now - last.t > gap()) { oops('A little faster! Click, click! 🐰'); }
      else say('Good! One more click, quickly!', 'calm', '👆👆 Click, click!');
      last = { t: now, p: p }; wiggle(b); sfx('clink');
      later(function () { if (last && !S.finished) { last = null; oops('Click TWICE, quickly. Click, click! 🐰'); } }, gap() + 150);
    },
    contextmenu: function () { oops('That was the RIGHT button. Use the LEFT one: click, click!', true); },
    async demo() {
      curShow(b._x > 50 ? 14 : 86, 46); await wait(300); await curMove(b._x, b._y, 1100);
      say(t.say, 'watch', '👆 Click…'); await curClick('left'); wiggle(b); await wait(150);
      say(t.say, 'watch', '👆 …click! Fast!'); await curClick('left'); open(true); await wait(800); close();
    },
    resetDemo: close
  };
  function open(demo) { b.classList.add('open'); b.textContent = t.reveal; b.classList.add('pop'); sfx('pickup'); if (!demo) good(); }
  function close() { b.classList.remove('open', 'pop'); b.textContent = t.item.e; }
};

ACT.right = function (t) {
  const k = kScale(), b = mkItem(t.item, { k: k, cls: 'tgt' }); E.items.appendChild(b); let menu = null;
  function closeMenu() { if (menu && menu.parentNode) menu.parentNode.removeChild(menu); menu = null; }
  function openMenu(x, y) {
    closeMenu(); menu = el('div', 'sk-menu'); menu.style.left = U(clamp(x, 2, 70)); menu.style.top = U(clamp(y, 2, stageH() - 22));
    [['🎁', 'Open'], ['✨', 'Sparkle'], ['🎈', 'Balloons']].forEach(function (o) { const it = el('button', '', '<span>' + o[0] + '</span> ' + o[1]); it.type = 'button'; it.dataset.m = o[1]; menu.appendChild(it); });
    E.items.appendChild(menu); sfx('pickup'); say('A magic menu! Now click one with the LEFT button.', 'cheer', '👆 Left button');
  }
  return {
    hl: function (on) { b.classList.toggle('hl', on); },
    contextmenu: function (e) {
      if (S.locked || S.paused) return; touch();
      const n = e.target.closest('.sk-item'); if (!n || n.classList.contains('sk-menu')) { return; }
      setMouse('right'); later(function () { setMouse('none'); }, 500);
      openMenu(toU(e).x, toU(e).y);
    },
    down: function (e) {
      if (S.locked || S.paused) return; touch();
      const m = e.target.closest('.sk-menu button');
      if (m) { if (e.button !== 0) return; b.textContent = t.reveal; b.classList.add('pop'); closeMenu(); good(); return; }
      if (menu) { closeMenu(); }
      if (e.button === 0) { oops('Your mouse has TWO buttons. Try the RIGHT one! 👉', false); setMouse('right'); later(function () { setMouse('none'); }, 900); }
    },
    async demo() {
      say(t.say, 'watch', '🖱️ The mouse has a LEFT and a RIGHT button');
      curShow(b._x > 50 ? 14 : 86, 46); await wait(900); await curMove(b._x, b._y, 1100);
      say(t.say, 'watch', '👉 Press the RIGHT button…'); await curClick('right'); openMenu(b._x + 4, b._y + 2); await wait(1400); closeMenu(); setMouse('none');
    },
    resetDemo: closeMenu, destroy: closeMenu
  };
};

/* ---- TYPING: find letters, type letters/words, small vs BIG, SPACE, BACKSPACE, ENTER, CAPS LOCK ---- */
const KB_ROWS = [['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'Backspace'], ['CapsLock', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Enter'], ['Z', 'X', 'C', 'V', 'B', 'N', 'M'], ['Space']];
const KB_LABEL = { Backspace: '⌫', CapsLock: 'CAPS', Enter: '⏎', Space: 'SPACE' };
function codeOf(ch) { return ch === ' ' ? 'Space' : /[a-z]/i.test(ch) ? 'Key' + ch.toUpperCase() : ''; }
function buildKeyboard() {
  E.kb.innerHTML = '';
  KB_ROWS.forEach(function (row) {
    const r = el('div', 'kr');
    row.forEach(function (k) { const b = el('button', 'sk-key k-' + k, KB_LABEL[k] || k); b.type = 'button'; b.dataset.k = k; b.tabIndex = -1; b.setAttribute('aria-label', k === 'Space' ? 'space bar' : k); r.appendChild(b); });
    E.kb.appendChild(r);
  });
}
function kbKey(code) { if (!code) return null; const k = code.indexOf('Key') === 0 ? code.slice(3) : code; return E.kb.querySelector('[data-k="' + k + '"]'); }
function kbHl(code) {
  E.kb.querySelectorAll('.hl').forEach(function (b) { b.classList.remove('hl'); });
  const k = kbKey(code); if (k) k.classList.add('hl');
}
function kbFlash(code) { const k = kbKey(code); if (!k) return; k.classList.add('press'); setTimeout(function () { k.classList.remove('press'); }, 160); }
function updateCapsUi() {
  if (!E.caps) return;
  E.caps.classList.toggle('on', S.caps); E.caps.querySelector('b').textContent = S.caps ? 'ON' : 'OFF';
  const k = kbKey('CapsLock'); if (k) k.classList.toggle('lit', S.caps);
}
function setCaps(v, fromKey) {
  v = !!v; if (v === S.caps) return; S.caps = v; updateCapsUi();
  if (S.act && S.act.caps && !S.locked && !S.paused && !S.finished) S.act.caps(v);
}

ACT.type = function (t) {
  const exact = !!t.exact, strict = t.prefill == null, target = t.target;
  let buf = t.prefill || '', usedBack = false;
  E.typeBox.hidden = false;
  const same = function (a, b) { return exact ? a === b : a.toLowerCase() === b.toLowerCase(); };
  function nextCode() { const ch = target[buf.length]; return ch == null ? 'Backspace' : codeOf(ch); }
  function showHint() {
    const code = (!strict && !(buf.length <= target.length && same(buf, target.slice(0, buf.length)))) ? 'Backspace' : nextCode();
    const hintOn = S.year === 1 || S.fails >= 1 || (S.hintLevel || 0) > 0 || t.prefill != null;
    kbHl(hintOn ? code : '');
  }
  function render() {
    E.typeBox.innerHTML = '';
    if (t.show) E.typeBox.appendChild(el('div', 'sk-show', '<small>' + (t.show === t.show.toUpperCase() ? 'BIG' : 'small') + '</small>' + t.show));
    const row = el('div', 'sk-slots'); const n = Math.max(buf.length, target.length);
    for (let i = 0; i < n; i++) {
      const ch = i < buf.length ? buf[i] : target[i], filled = i < buf.length, ok = filled && i < target.length && same(buf[i], target[i]);
      const s = el('div', 'slot' + (filled ? (ok ? ' ok' : ' bad') : ' ghost') + (i === buf.length && strict ? ' cur' : '') + (ch === ' ' ? ' sp' : ''), ch === ' ' ? '␣' : ch);
      row.appendChild(s);
    }
    E.typeBox.appendChild(row);
    showHint();
  }
  function check() {
    if (buf === target && (strict || usedBack)) { good(t.win); return; }
    if (buf === target && !strict && !usedBack) { /* cannot happen: prefill differs from target */ }
  }
  function char(ch) {
    if (S.finished) return; touch(); kbFlash(codeOf(ch));
    if (!strict) { buf += ch; sfx('tick'); render();
      if (buf.length > target.length || !same(buf, target.slice(0, buf.length))) say('Oops! We have ' + (buf.length > target.length ? 'an extra letter' : 'a wrong letter') + '. Use BACKSPACE ⌫', 'think', '');
      check(); return; }
    const exp = target[buf.length];
    if (exp == null) return;
    if (same(ch, exp)) { buf += exp; sfx('tick'); render(); say(t.say, 'calm', ''); check(); return; }
    if (exact && ch.toLowerCase() === exp.toLowerCase()) {
      oops(exp === exp.toUpperCase() ? 'That was small. For a BIG letter press CAPS LOCK (or hold SHIFT)! 🔠'
        : S.caps ? 'That was BIG. For a small letter turn CAPS LOCK off! 🔡' : 'That was BIG. For a small letter do not hold SHIFT! 🔡');
      if (S.caps || exp === exp.toUpperCase()) kbHl('CapsLock'); return;
    }
    oops('Gently try again. We need ' + (exp === ' ' ? 'SPACE ␣' : exp.toUpperCase()) + '.'); showHint();
    const cc = codeOf(exp), kk = kbKey(cc); if (kk) { kk.classList.add('wiggle'); setTimeout(function () { kk.classList.remove('wiggle'); }, 500); }
  }
  function back() {
    if (S.finished) return; touch(); kbFlash('Backspace');
    if (buf.length) { buf = buf.slice(0, -1); usedBack = true; sfx('tick'); render(); check(); }
  }
  render();
  return {
    char: char, back: back, enter: function () { kbFlash('Enter'); },
    hl: function (on) { showHint(); if (t.find && !kbKey(nextCode())) return; },
    caps: function () { },
    demo: null
  };
};

ACT.capsstate = function (t) {
  let startOpp = S.caps !== t.want, seenOpp = startOpp;
  E.typeBox.hidden = false;
  E.typeBox.innerHTML = '<div class="sk-capsbig"><i></i><span>CAPS LOCK</span><b>' + (S.caps ? 'ON' : 'OFF') + '</b></div>';
  const upd = function () { const b = E.typeBox.querySelector('.sk-capsbig'); if (!b) return; b.classList.toggle('on', S.caps); b.querySelector('b').textContent = S.caps ? 'ON' : 'OFF'; };
  kbHl('CapsLock');
  if (!startOpp) say(t.want ? 'CAPS LOCK is already ON. Press it to turn it OFF, then ON again.' : 'CAPS LOCK is already OFF. Press it to turn it ON, then OFF again.', 'calm', '');
  return {
    caps: function (v) { upd(); if (v !== t.want) { seenOpp = true; if (!startOpp) say(t.say, 'calm', ''); return; } if (seenOpp) good(t.win); },
    hl: function () { kbHl('CapsLock'); upd(); }, char: function (ch) { kbFlash(codeOf(ch)); oops('Find the CAPS LOCK key on the left, then press it. 💡', false); },
    back: function () { }, enter: function () { }
  };
};

ACT.enter = function (t) {
  E.typeBox.hidden = false; E.typeBox.innerHTML = '<div class="sk-enter"><span>🚀</span><div class="enter-key">ENTER ⏎</div></div>';
  kbHl('Enter');
  return {
    hl: function () { kbHl('Enter'); },
    enter: function () { kbFlash('Enter'); good(t.win); },
    char: function (ch) { kbFlash(codeOf(ch)); oops('Not that one! Press the big ENTER key ⏎', false); }, back: function () { }, caps: function () { }
  };
};

/* typed input from the physical keyboard AND the on-screen one all arrive here */
function virtualPress(k) {
  if (S.view !== 'play' || S.locked || S.paused || !S.act || CC.ui.active) return;
  if (k === 'CapsLock') { setCaps(!S.caps); sfx('tick'); return; }
  if (k === 'Backspace') { S.act.back && S.act.back(); return; }
  if (k === 'Enter') { S.act.enter && S.act.enter(); return; }
  const ch = k === 'Space' ? ' ' : (S.caps ? k : k.toLowerCase());
  S.act.char && S.act.char(ch);
}
function physicalKey(e) {
  if (e.getModifierState) { const c = e.getModifierState('CapsLock'); if (e.code === 'CapsLock' || c !== S.caps) setCaps(c, true); }
  if (S.view !== 'play' || S.locked || S.paused || !S.act || CC.ui.active) return false;
  if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return false;
  if (e.ctrlKey || e.metaKey || e.altKey) return false;
  const typing = S.act.char || S.act.enter; if (!typing) return false;
  if (e.code === 'CapsLock') return true;
  if (e.key === 'Backspace') { S.act.back && S.act.back(); return true; }
  if (e.key === 'Enter') { if (!e.repeat) S.act.enter && S.act.enter(); return true; }
  if (e.key === ' ') { if (!e.repeat) S.act.char && S.act.char(' '); return true; }
  if (e.key.length === 1 && /[a-z0-9.,!?'-]/i.test(e.key)) { if (!e.repeat && /[a-z]/i.test(e.key)) S.act.char && S.act.char(e.key); return true; }
  return false;
}

/* =====================================================================
   VIEWS: home (pick year + level map), play, report
   ===================================================================== */
function renderDots() {
  E.dots.innerHTML = '';
  S.tasks.forEach(function (_, i) { E.dots.appendChild(el('i', i < S.ti ? 'd done' : i === S.ti ? 'd cur' : 'd')); });
}
function markDot(i) { const d = E.dots.children[i]; if (d) d.className = 'd done'; }

function applyTheme() {
  const r = $root(); r.classList.toggle('hc', S.opt.contrast);
  setSfxGain();
}
function toggleBtn(label, key, icon) {
  const b = el('button', 'btn sk-tog' + (S.opt[key] ? ' on' : ''), '<span>' + icon + '</span> ' + label); b.type = 'button';
  b.addEventListener('click', function () { b.blur(); S.opt[key] = !S.opt[key]; b.classList.toggle('on', S.opt[key]); applyTheme(); if (key === 'voice' && S.opt.voice) speak('Hello! I am Buddy.'); });
  return b;
}

function showHome() {
  clearTimers(); CC.ui.close(); S.view = 'home'; S.paused = false; S.level = null; S.act = null; S.locked = true;
  if (window.speechSynthesis) try { speechSynthesis.cancel(); } catch (e) { }
  const r = $root(); r.innerHTML = ''; applyTheme();
  const home = el('div', 'sk-home');
  const hello = el('div', 'sk-hello', '<div class="sk-buddy big">🐶</div><div class="sk-bubble">Hi! I am Buddy! 👋<br><b>Computer Skills Adventure</b></div>');
  home.appendChild(hello);
  const bar = el('div', 'sk-setup');
  const yrs = el('div', 'sk-years', '<span>I am in Year</span>');
  [1, 2, 3].forEach(function (y) { const b = el('button', 'btn yr' + (S.year === y ? ' on' : ''), String(y)); b.type = 'button'; b.setAttribute('aria-label', 'Year ' + y);
    b.addEventListener('click', function () { b.blur(); S.year = y; yrs.querySelectorAll('.yr').forEach(function (x, i) { x.classList.toggle('on', i + 1 === y); }); }); yrs.appendChild(b); });
  bar.appendChild(yrs);
  const nm = el('input', 'sk-name'); nm.type = 'text'; nm.maxLength = 20; nm.placeholder = '✏️ My name'; nm.value = S.name; nm.setAttribute('aria-label', 'My name');
  nm.addEventListener('input', function () { S.name = nm.value; }); bar.appendChild(nm);
  home.appendChild(bar);
  const map = el('div', 'sk-map');
  LEVELS.forEach(function (lv) {
    const open = isOpen(lv.id), w = WORLD[lv.world];
    const b = el('button', 'sk-tile' + (open ? '' : ' locked') + (S.done[lv.id] ? ' done' : ''), '<span class="n">' + lv.id + '</span><span class="ic">' + (open ? w.icon : '🔒') + '</span><span class="nm">' + lv.title + '</span><span class="st">' + (S.done[lv.id] ? '⭐'.repeat(S.stars[lv.id]) : '') + '</span>');
    b.type = 'button'; b.dataset.world = lv.world; b.disabled = !open; b.setAttribute('aria-label', 'Level ' + lv.id + ' ' + lv.title);
    b.addEventListener('click', function () { b.blur(); CC.audio.init(); setSfxGain(); startLevel(lv.id); });
    map.appendChild(b);
  });
  home.appendChild(map);
  const opts = el('div', 'sk-opts');
  opts.appendChild(toggleBtn('Sound', 'sound', '🔊')); opts.appendChild(toggleBtn('Voice', 'voice', '🗣️')); opts.appendChild(toggleBtn('High contrast', 'contrast', '🌓'));
  opts.appendChild(toggleBtn('Slow', 'slow', '🐢')); opts.appendChild(toggleBtn('Click to place', 'clickPlace', '♿'));
  const rep = el('button', 'btn', '📋 Teacher report'); rep.type = 'button'; rep.addEventListener('click', function () { rep.blur(); showReport(); });
  const un = el('button', 'btn', S.unlockAll ? '🔒 Lock levels' : '🔓 Unlock all'); un.type = 'button'; un.addEventListener('click', function () { un.blur(); S.unlockAll = !S.unlockAll; showHome(); });
  opts.appendChild(rep); opts.appendChild(un);
  home.appendChild(opts);
  const go = el('button', 'btn big primary sk-go', '<span class="bi">▶</span><span class="bl">Play</span>'); go.type = 'button';
  go.addEventListener('click', function () { go.blur(); CC.audio.init(); setSfxGain(); startLevel(nextLevel()); });
  home.appendChild(go);
  r.appendChild(home);
}
function nextLevel() { for (let i = 1; i <= LEVELS.length; i++) { if (!S.done[i]) return i; } return 1; }

function renderPlay() {
  S.view = 'play';
  const lv = S.level, r = $root(); r.innerHTML = ''; applyTheme();
  const wrap = el('div', 'sk-play' + (lv.kb ? ' typing' : ''));
  const bar = el('div', 'sk-bar');
  const map = el('button', 'btn ico', '🗺️'); map.type = 'button'; map.setAttribute('aria-label', 'level map'); map.addEventListener('click', function () { map.blur(); showHome(); });
  const chip = el('div', 'sk-chip', '<b>' + lv.id + '</b> ' + lv.title);
  E.dots = el('div', 'sk-dots');
  const rep = el('button', 'btn ico', '🔁'); rep.type = 'button'; rep.setAttribute('aria-label', 'say it again'); rep.title = 'Show me again'; rep.addEventListener('click', function () { rep.blur(); repeatHelp(); });
  const res = el('button', 'btn ico', '↻'); res.type = 'button'; res.setAttribute('aria-label', 'restart this activity'); res.title = 'Start this part again'; res.addEventListener('click', function () { res.blur(); restartTask(); });
  const pau = el('button', 'btn ico', '⏸️'); pau.type = 'button'; pau.setAttribute('aria-label', 'pause'); pau.addEventListener('click', function () { pau.blur(); togglePause(); });
  const snd = el('button', 'btn ico', S.opt.sound ? '🔊' : '🔇'); snd.type = 'button'; snd.setAttribute('aria-label', 'sound on or off');
  snd.addEventListener('click', function () { snd.blur(); S.opt.sound = !S.opt.sound; snd.textContent = S.opt.sound ? '🔊' : '🔇'; setSfxGain(); });
  [map, chip, E.dots, rep, res, pau, snd].forEach(function (x) { bar.appendChild(x); });
  wrap.appendChild(bar);
  const sayRow = el('div', 'sk-sayrow');
  E.buddy = el('div', 'sk-buddy', '🐶'); E.say = el('div', 'sk-say'); E.sub = el('div', 'sk-sub');
  const bub = el('div', 'sk-bubble'); bub.appendChild(E.say); bub.appendChild(E.sub);
  sayRow.appendChild(E.buddy); sayRow.appendChild(bub);
  wrap.appendChild(sayRow);
  E.stage = el('div', 'sk-stage w-' + lv.world + (lv.kb ? ' typing' : ''));
  E.stage.appendChild(el('div', 'sk-deco')); const dc = E.stage.firstChild;
  WORLD[lv.world].deco.forEach(function (d) { const e = el('i', '', d[0]); e.style.left = U(d[1]); e.style.top = U(d[2]); e.style.fontSize = U(d[3]); dc.appendChild(e); });
  E.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); E.svg.setAttribute('class', 'sk-lines'); E.svg.setAttribute('viewBox', '0 0 100 56.25'); E.svg.setAttribute('preserveAspectRatio', 'none');
  E.items = el('div', 'sk-items'); E.typeBox = el('div', 'sk-type'); E.typeBox.hidden = true;
  E.cursor = el('div', 'sk-cursor', CURSOR_SVG); E.cursor.hidden = true;
  E.mouse = el('div', 'sk-mouse', '<i class="l"></i><i class="r"></i><em>L</em><em>R</em>'); E.mouse.dataset.btn = 'none'; E.mouse.hidden = true;
  const ovr = el('div', 'overlay-root');
  [E.items, E.svg, E.typeBox, E.mouse, E.cursor, ovr].forEach(function (x) { E.stage.appendChild(x); });
  wrap.appendChild(E.stage);
  E.caps = el('div', 'sk-caps', '<i></i> CAPS LOCK <b>OFF</b>'); E.caps.hidden = true;
  E.kb = el('div', 'sk-kb'); E.kb.hidden = true; buildKeyboard();
  E.stage.appendChild(E.caps); wrap.appendChild(E.kb);
  r.appendChild(wrap);
  CC.watchStage(E.stage);
  updateCapsUi();
  wireStage();
  E.kb.addEventListener('pointerdown', function (e) { const b = e.target.closest('.sk-key'); if (!b) return; e.preventDefault(); virtualPress(b.dataset.k); });
}
function wireStage() {
  const st = E.stage;
  st.addEventListener('pointerdown', function (e) {
    if (S.view !== 'play') return;
    if (S.locked && S.act && S.act.demo && !S.finished && !CC.ui.active && E.cursor && !E.cursor.hidden) { skipDemo(); e.preventDefault(); return; }
    if (S.act && S.act.down) S.act.down(e);
  });
  st.addEventListener('pointermove', function (e) { if (S.act && S.act.move && !CC.ui.active) S.act.move(e); });
  st.addEventListener('pointerup', function (e) { if (S.act && S.act.up) S.act.up(e); });
  st.addEventListener('pointercancel', function () { if (S.act && S.act.cancel) S.act.cancel(); });
  st.addEventListener('contextmenu', function (e) { e.preventDefault(); if (S.act && S.act.contextmenu && !CC.ui.active) S.act.contextmenu(e); else if (S.act && S.act.down && !S.locked && ['move', 'type', 'enter', 'capsstate'].indexOf(S.t.type) < 0) { /* explain, don't open the browser menu */ oops('The RIGHT button is for special menus. Use the LEFT button here.', true); } });
}

/* ---------- teacher report ---------- */
function starsFor(id) {
  const s = S.stats[id], n = s.ok + s.bad; if (!n) return 0;
  const a = s.ok / n; return a >= 0.9 ? 5 : a >= 0.75 ? 4 : a >= 0.6 ? 3 : a >= 0.4 ? 2 : 1;
}
function reportText() {
  const lines = ['Computer Skills Adventure - learner report', 'Learner: ' + (S.name || '(no name)'), 'Year: ' + S.year, 'Date: ' + new Date().toLocaleDateString(), ''];
  lines.push('Levels completed: ' + Object.keys(S.done).length + ' of ' + LEVELS.length, '');
  SKILLS.forEach(function (k) { const n = starsFor(k.id), st = S.stats[k.id]; lines.push(k.name + ': ' + (n ? '*'.repeat(n) + '-'.repeat(5 - n) : 'not tried yet') + (n ? '  (' + st.ok + ' right, ' + st.bad + ' tries to fix)' : '')); });
  lines.push('', 'Recommended practice: ' + (recommend().join(', ') || 'none - great work!'));
  Object.keys(S.badges).forEach(function (k, i) { if (!i) lines.push('', 'Badges:'); lines.push(' - ' + S.badges[k]); });
  return lines.join('\n');
}
function recommend() {
  return SKILLS.filter(function (k) { const n = starsFor(k.id); return n && n <= 3; }).sort(function (a, b) { return starsFor(a.id) - starsFor(b.id); }).map(function (k) { return k.name; });
}
function showReport() {
  clearTimers(); CC.ui.close(); S.view = 'report'; S.act = null; S.locked = true;
  const r = $root(); r.innerHTML = ''; applyTheme();
  const w = el('div', 'sk-report');
  w.appendChild(el('h3', '', '📋 Learner: ' + (S.name ? S.name.replace(/[<>&]/g, '') : 'Me') + ' · Year ' + S.year));
  const tb = el('div', 'rep-rows');
  SKILLS.forEach(function (k) {
    const n = starsFor(k.id), st = S.stats[k.id];
    tb.appendChild(el('div', 'rep-row', '<span class="ri">' + k.icon + '</span><span class="rn">' + k.name + '</span><span class="rs">' + (n ? '⭐'.repeat(n) + '<span class="dim">' + '⭐'.repeat(5 - n) + '</span>' : '<span class="nt">not tried yet</span>') + '</span><span class="rc">' + (n ? st.ok + ' ✔ · ' + st.bad + ' tries' : '') + '</span>'));
  });
  w.appendChild(tb);
  const rec = recommend();
  w.appendChild(el('p', 'rep-rec', '💡 Recommended practice: <b>' + (rec.join(', ') || 'none yet') + '</b>'));
  const bd = Object.keys(S.badges).map(function (k) { return '🏆 ' + S.badges[k]; }).join('  ');
  w.appendChild(el('p', 'rep-badges', bd || 'Finish a level to earn a badge!'));
  const row = el('div', 'row');
  const dl = el('button', 'btn', '⬇ Download report'); dl.type = 'button';
  dl.addEventListener('click', function () { dl.blur(); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([reportText()], { type: 'text/plain' })); a.download = 'skills-report' + (S.name ? '-' + S.name.replace(/[^\w-]/g, '') : '') + '.txt'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); });
  const pr = el('button', 'btn', '🖨 Print'); pr.type = 'button'; pr.addEventListener('click', function () { pr.blur(); window.print(); });
  const bk = el('button', 'btn primary', '🗺️ Back'); bk.type = 'button'; bk.addEventListener('click', function () { bk.blur(); showHome(); });
  [dl, pr, bk].forEach(function (x) { row.appendChild(x); }); w.appendChild(row);
  w.appendChild(el('p', 'rep-note', 'This report is kept only while this page is open. Download it to keep it.'));
  r.appendChild(w);
}

/* ---------- plug into the Computer Club hub ---------- */
CC.modes.skills = {
  makey: false,
  enter: function () { applyTheme(); showHome(); },
  exit: function () { clearTimers(); S.view = 'home'; S.act = null; if (window.speechSynthesis) try { speechSynthesis.cancel(); } catch (e) { } if (CC.audio.master) CC.audio.master.gain.value = 0.8; },
  onKeyDown: function (e) {
    if (S.view === 'home' && e.key === 'Enter' && !(e.target && /^(INPUT|BUTTON)$/.test(e.target.tagName))) { e.preventDefault(); CC.audio.init(); startLevel(nextLevel()); return; }
    if (physicalKey(e)) e.preventDefault();
    else if (S.view === 'play' && (e.code === 'Space') && e.target && e.target.tagName === 'BUTTON') e.preventDefault();
  },
  onKeyUp: function (e) { if (e.getModifierState) { const c = e.getModifierState('CapsLock'); if (c !== S.caps) setCaps(c, true); } if (S.view === 'play' && S.act && (S.act.char || S.act.enter) && (e.key === ' ' || e.key === 'Enter')) e.preventDefault(); },
  _S: S, _go: function (id) { startLevel(id); }, _task: function (i) { CC.ui.close(); beginTask(i, true); }
};
})();
