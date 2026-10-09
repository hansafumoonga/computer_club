/* typing.js - Typing Club (Session 2, FULL keyboard). Three games that all train the same thing: accurate, steady typing.
     Typing Racer    - race a car by typing a passage; beat your own best "ghost"
     Word Pop        - pop floating balloons by typing the word
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
  { id: 'blaster', icon: '🎈', name: 'Word Pop', desc: 'Pop the floating balloons', color: '#5ac8ff' },
  { id: 'boss', icon: '🐲', name: 'Boss Sentences', desc: 'Type sentences to beat the boss', color: '#ffd23f' }
];

/* ---------- state for the whole visit (nothing is stored on disk) ---------- */
const S = { year: 4, name: '', view: 'home', game: 'racer', level: 1, guide: true, voice: true, lessonSeen: false, lessonDone: {}, tipSeen: {}, lesson: null, lastCh: null, unlockAll: false, best: {}, ghost: {}, keys: {}, rounds: [], run: null, timers: [], loop: null, view2: null };
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
function markKey(ch) {
  const i = info(ch), k = kbEls[i.base]; if (k) k.classList.add('hl');
  if (i.shift) { const right = 'RI RM RR RP'.indexOf(KF[i.base]) >= 0, sh = kbEls[right ? 'ShiftL' : 'ShiftR']; if (sh) sh.classList.add('hl'); }
  return i;
}
function clearKeys() { Object.keys(kbEls).forEach(function (k) { kbEls[k].classList.remove('hl'); }); }
function hlKey(ch, flEl) {
  clearKeys();
  const fl = flEl || (S.run && S.run.ui && S.run.ui.fingerT), saying = !flEl && S.run && S.run.sayUntil > performance.now(); S.lastCh = ch;
  if (!ch) { if (fl && !saying) fl.textContent = ''; return; }
  const i = markKey(ch);
  let msg = 'Next: ' + (ch === ' ' ? 'SPACE' : ch.toUpperCase()) + ' with your ' + (FNAME[KF[i.base]] || 'finger');
  if (i.shift) { const right = 'RI RM RR RP'.indexOf(KF[i.base]) >= 0; msg += ' + ' + (right ? 'LEFT' : 'RIGHT') + ' Shift'; }
  if (fl && !saying) fl.textContent = msg;
}

/* ---------- Coach: a friendly guide with a calm voice. The voice is one already installed on this computer; nothing is sent anywhere. ---------- */
let voicePick = null;
function bestVoice() {
  if (!window.speechSynthesis) return null;
  const vs = speechSynthesis.getVoices().filter(function (v) { return v.localService && /^en/i.test(v.lang); });
  if (!vs.length) return null;
  if (voicePick && vs.indexOf(voicePick) >= 0) return voicePick;
  const prefs = [/aria|jenny|natural|neural/i, /zira|samantha|karen|moira|susan|hazel|libby|sonia|serena|tessa|fiona/i, /female/i];
  for (let i = 0; i < prefs.length; i++) { const f = vs.filter(function (v) { return prefs[i].test(v.name); })[0]; if (f) return (voicePick = f); }
  return (voicePick = vs[0]);
}
if (window.speechSynthesis) { try { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = function () { voicePick = null; }; } catch (e) { } }
function spoken(t) { return String(t).replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}⭐️]/gu, ' ').replace(/\s+/g, ' ').trim(); }
function setTalk(on) { document.querySelectorAll('.ty-coach-av').forEach(function (a) { a.classList.toggle('talk', on); }); }
function speak(text) {
  if (!S.voice || !window.speechSynthesis) return;
  const v = bestVoice(), clean = spoken(text); if (!v || !clean) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean); u.voice = v; u.rate = 0.9; u.pitch = 1.05; u.volume = 1;
    u.onstart = function () { setTalk(true); }; u.onend = function () { setTalk(false); }; u.onerror = function () { setTalk(false); };
    speechSynthesis.speak(u);
  } catch (e) { }
}
function hush() { setTalk(false); if (window.speechSynthesis) try { speechSynthesis.cancel(); } catch (e) { } }
/* a short line from Coach in the strip above the keyboard (and spoken); the finger guide comes back a moment later */
function coachSay(R, text, ms) {
  if (!R || S.run !== R || !R.ui.fingerT) return;
  ms = ms || 4200; R.sayUntil = performance.now() + ms; R.ui.fingerT.textContent = text; R.ui.fingerT.classList.add('say'); speak(text);
  later(function () { if (S.run === R && R.sayUntil <= performance.now() + 50) { R.ui.fingerT.classList.remove('say'); R.sayUntil = 0; hlKey(S.lastCh); } }, ms + 80);
}
function coachWatch(R, ok, ch) {
  if (!R || R.phase !== 'play') return;
  if (ok) { R.errRun = 0; return; }
  R.errRun = (R.errRun || 0) + 1;
  if (R.errRun >= 3 && R.t - (R.lastCoach === undefined ? -99 : R.lastCoach) > 10) {
    R.lastCoach = R.t; R.errRun = 0; const i = info(ch);
    coachSay(R, 'Slow down a little. Find the glowing key and use your ' + (FNAME[KF[i.base]] || 'finger') + '.');
  }
}

/* ---------- the lesson before each level: posture, the new keys and which finger types them, then a warm-up ---------- */
const GTIPS = {
  racer: 'In Typing Racer you type the line to drive your car. The more you type, the faster you go. Try to beat your own best time!',
  blaster: 'In Word Pop, balloons float up. Type the word on a balloon to pop it. Do not let them float away!',
  boss: 'In Boss Sentences, type each sentence to hurt the boss. Finish it before the boss power bar fills up.'
};
const SAYKEY = { '.': 'full stop', ',': 'comma', '?': 'question mark', '!': 'exclamation mark', '-': 'dash', ';': 'semicolon' };
function keyTokens(str) { return String(str || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean); }
function fingerLine(tokens, forSpeech) {
  const g = {}, order = [];
  tokens.forEach(function (t) {
    const f = t === 'Shift' ? 'SH' : (KF[info(/^[A-Za-z]$/.test(t) ? t.toLowerCase() : t).base] || 'LP');
    if (!g[f]) { g[f] = []; order.push(f); }
    g[f].push(t === 'Shift' ? t : forSpeech ? (SAYKEY[t] || t.toUpperCase()) : t.toUpperCase());
  });
  return order.map(function (f) { return f === 'SH' ? 'Shift is pressed with your little finger on the other hand' : g[f].join(forSpeech ? ', ' : ' ') + ' with your ' + FNAME[f]; }).join('. ') + '.';
}
function drillFor(lv) {
  const nt = keyTokens(lv.newKeys).filter(function (t) { return /^[A-Za-z0-9]$/.test(t); }).map(function (t) { return t.toLowerCase(); });
  if ((lv.id <= 4 || lv.id === 9) && nt.length) { const a = []; for (let k = 0; k < Math.min(8, Math.max(6, nt.length * 2)); k++) a.push(nt[k % nt.length]); return a.join(' '); }
  const pool = lv.sentences.filter(function (s) { return s.length <= 30; }).sort(function (a, b) { return a.length - b.length; });
  return pool.length ? pool[0] : lv.words.slice(0, 3).join(' ');
}
function lessonSteps(lv) {
  const st = [], first = !S.lessonSeen, nt = keyTokens(lv.newKeys);
  if (first) st.push({ text: 'Hi! I am Coach. Sit up tall, keep your feet flat on the floor and your wrists relaxed.', keys: [] });
  if (first && lv.id !== 1) st.push({ text: 'Rest your fingers on the home row: A S D F on the left and J K L ; on the right. Feel the bumps on F and J.', say: 'Rest your fingers on the home row. A, S, D, F on the left. J, K, L and semicolon on the right. Feel the little bumps on F and J.', keys: keyTokens('a s d f j k l ;') });
  if (nt.length) st.push({ text: 'New keys: ' + nt.join(' ') + '. ' + fingerLine(nt), say: 'In this level you learn these keys. ' + fingerLine(nt, true), keys: nt });
  if (!S.tipSeen[S.game]) st.push({ text: GTIPS[S.game], keys: [] });
  st.push({ text: lv.tip, keys: [] });
  st.push({ text: 'Warm-up! Type this line slowly. Follow the glowing key.', say: 'Now you try. Type this line slowly and follow the glowing key.', keys: [], warm: drillFor(lv) });
  return st;
}
function lessonDone() { S.lessonSeen = true; S.tipSeen[S.game] = true; S.lessonDone[S.level] = true; S.lesson = null; hush(); startRun(); }
function showLesson() {
  stopRun(); CC.ui.close();
  const lv = LEVELS[S.level - 1], steps = lessonSteps(lv), L = S.lesson = { steps: steps, i: 0, warm: null };
  CC.sfx.letsGo && CC.sfx.letsGo();
  const w = el('div', 'ty-lesson'), top = el('div', 'ty-ltop');
  const mp = el('button', 'btn ico', '🗺️'); mp.type = 'button'; mp.setAttribute('aria-label', 'level map'); mp.addEventListener('click', function () { mp.blur(); S.lesson = null; hush(); showMap(); });
  const vc = el('button', 'btn ico' + (S.voice ? '' : ' off'), '🗣️'); vc.type = 'button'; vc.setAttribute('aria-label', 'coach voice on or off'); vc.title = 'Coach voice';
  vc.addEventListener('click', function () { vc.blur(); S.voice = !S.voice; vc.classList.toggle('off', !S.voice); if (S.voice) speak(L.say); else hush(); });
  top.appendChild(mp); top.appendChild(el('h3', '', lv.icon + ' Level ' + lv.id + ': ' + lv.name)); top.appendChild(vc); w.appendChild(top);
  const row = el('div', 'ty-lrow'), av = el('div', 'ty-coach-av big', '🦊'), bub = el('div', 'ty-bubble'), btxt = el('div', 'bt'), bfin = el('div', 'ty-lfinger');
  bub.appendChild(btxt); bub.appendChild(bfin); row.appendChild(av); row.appendChild(bub); w.appendChild(row);
  const warm = el('div', 'ty-lwarm'); w.appendChild(warm);
  const dots = el('div', 'ty-ldots'); steps.forEach(function () { dots.appendChild(el('i')); }); w.appendChild(dots);
  const kbw = el('div', 'ty-kbwrap'); kbw.appendChild(buildKeyboard()); w.appendChild(kbw);
  const nav = el('div', 'ty-opts');
  const back = el('button', 'btn', '◀ Back'); back.type = 'button';
  const again = el('button', 'btn', '🔊 Again'); again.type = 'button';
  const next = el('button', 'btn primary', 'Next ▶'); next.type = 'button';
  const skip = el('button', 'btn', '⏭ Skip lesson'); skip.type = 'button';
  [back, again, next, skip].forEach(function (b) { nav.appendChild(b); }); w.appendChild(nav);
  function render() {
    const st = steps[L.i]; L.say = st.say || st.text; L.warm = null; btxt.textContent = st.text; bfin.textContent = ''; warm.innerHTML = '';
    [].forEach.call(dots.children, function (d, k) { d.className = k < L.i ? 'on' : k === L.i ? 'cur' : ''; });
    clearKeys(); st.keys.forEach(function (t) { markKey(/^[A-Za-z]$/.test(t) ? t.toLowerCase() : t === 'Shift' ? 'A' : t); });
    if (st.keys.indexOf('Shift') >= 0) { kbEls.ShiftL.classList.add('hl'); kbEls.ShiftR.classList.add('hl'); }
    back.disabled = L.i === 0; next.textContent = L.i === steps.length - 1 ? 'Start ▶' : 'Next ▶'; next.disabled = false;
    if (st.warm) { const line = lineEl(st.warm); warm.appendChild(line); L.warm = { text: st.warm, i: 0, line: line, bfin: bfin }; markLine(line, 0); hlKey(st.warm[0], bfin); next.disabled = true; next.classList.remove('primary'); } else next.classList.add('primary');
    speak(L.say);
  }
  L.render = render; L.next = function () { if (next.disabled) return; if (L.i >= steps.length - 1) lessonDone(); else { L.i++; render(); } };
  L.back = function () { if (L.i > 0) { L.i--; render(); } };
  L.finishWarm = function () { next.disabled = false; next.classList.add('primary'); bfin.textContent = ''; clearKeys(); btxt.textContent = 'Brilliant! You are ready. Press Start.'; speak('Brilliant! You are ready. Press start.'); CC.sfx.pop && CC.sfx.pop(); };
  next.addEventListener('click', function () { next.blur(); L.next(); }); back.addEventListener('click', function () { back.blur(); L.back(); });
  again.addEventListener('click', function () { again.blur(); speak(L.say); }); skip.addEventListener('click', function () { skip.blur(); lessonDone(); });
  setView('lesson', w); render();
}
function lessonKey(e) {
  const L = S.lesson; if (!L) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const w = L.warm;
  if (w && e.key.length === 1) {
    e.preventDefault(); if (e.repeat) return;
    if (e.key === w.text[w.i]) { CC.sfx.tick && CC.sfx.tick(); w.i++; markLine(w.line, w.i); if (w.i >= w.text.length) { w.warm = null; L.warm = null; L.finishWarm(); } else hlKey(w.text[w.i], w.bfin); }
    else { CC.sfx.step && CC.sfx.step(); markLine(w.line, w.i, true); }
    return;
  }
  if (e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); L.next(); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); L.back(); }
}

/* ---------- what a round measures ---------- */
function wpm(R) { return R.started && R.t > 1 ? Math.round((R.correct / 5) / (R.t / 60) * 10) / 10 : 0; }
function acc(R) { const n = R.correct + R.errors; return n ? Math.round(R.correct / n * 1000) / 10 : 100; }
function noteKey(ch, ok, R) {
  const k = S.keys[ch] || (S.keys[ch] = { n: 0, err: 0, ms: 0, c: 0 });
  k.n++; if (!ok) k.err++; coachWatch(R, ok, ch);
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
  const setup = el('div', 'ty-setup');
  const yrs = el('div', 'ty-years'); yrs.appendChild(el('span', '', 'I am in Year'));
  [4, 5, 6].forEach(function (y) { const b = el('button', 'btn yr' + (S.year === y ? ' on' : ''), String(y)); b.type = 'button'; b.addEventListener('click', function () { b.blur(); S.year = y; yrs.querySelectorAll('.yr').forEach(function (x, i) { x.classList.toggle('on', i + 4 === y); }); }); yrs.appendChild(b); });
  setup.appendChild(yrs);
  const nm = el('input', 'ty-name'); nm.type = 'text'; nm.maxLength = 20; nm.placeholder = '✏️ My name'; nm.value = S.name; nm.setAttribute('aria-label', 'My name'); nm.addEventListener('input', function () { S.name = nm.value; });
  setup.appendChild(nm); h.appendChild(setup);
  const cards = el('div', 'ty-games');
  GAMES.forEach(function (g) {
    const done = LEVELS.filter(function (l) { const b = bestOf(g.id, l.id); return b && b.stars >= 1; }).length;
    const c = el('button', 'ty-gcard'); c.type = 'button'; c.style.setProperty('--c', g.color);
    c.innerHTML = '<span class="gi">' + g.icon + '</span><span class="gn"></span><span class="gp"></span>';
    c.querySelector('.gn').textContent = g.name; c.querySelector('.gp').textContent = done + ' / 10 levels';
    c.addEventListener('click', function () { c.blur(); CC.audio.init(); S.game = g.id; showMap(); }); cards.appendChild(c);
  });
  h.appendChild(cards);
  const row = el('div', 'ty-opts');
  const gd = el('button', 'btn' + (S.guide ? ' on' : ''), '🖐️ Finger guide'); gd.type = 'button'; gd.addEventListener('click', function () { gd.blur(); S.guide = !S.guide; gd.classList.toggle('on', S.guide); });
  const vc = el('button', 'btn' + (S.voice ? ' on' : ''), '🗣️ Coach voice'); vc.type = 'button'; vc.addEventListener('click', function () { vc.blur(); S.voice = !S.voice; vc.classList.toggle('on', S.voice); if (S.voice) speak('Hello! I am Coach. Let us learn to type together.'); else hush(); });
  const rp = el('button', 'btn', '📋 Teacher report'); rp.type = 'button'; rp.addEventListener('click', function () { rp.blur(); showReport(); });
  const ce = el('button', 'btn' + (certEarned() ? ' primary' : ''), certEarned() ? '🎓 Certificate' : '🔒 Certificate'); ce.type = 'button'; ce.disabled = !certEarned(); ce.title = certEarned() ? 'Print my certificate' : 'Finish all 10 levels of one game to unlock'; ce.addEventListener('click', function () { ce.blur(); showCertificate(); });
  const un = el('button', 'btn', S.unlockAll ? '🔒 Lock levels' : '🔓 Unlock all'); un.type = 'button'; un.addEventListener('click', function () { un.blur(); S.unlockAll = !S.unlockAll; showHome(); });
  [gd, vc, ce, rp, un].forEach(function (b) { row.appendChild(b); }); h.appendChild(row);
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
function intro() { if (S.lessonDone[S.level]) { CC.sfx.letsGo && CC.sfx.letsGo(); startRun(); } else showLesson(); }

/* ---------- running a round ---------- */
function stopRun() { clearTimers(); hush(); if (S.run) S.run.phase = 'off'; S.run = null; }
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
    if (i === nums.length - 1) { later(function () { if (S.run !== R) return; R.ui.count.hidden = true; R.phase = 'play'; if (R.begin) R.begin(); if ((S.goSaid = (S.goSaid || 0) + 1) <= 3) coachSay(R, 'Go! Accuracy first, speed will follow.'); }, 650); return; } i++; later(tick, 750); })();
}
function hud(R) {
  const bar = el('div', 'ty-hud');
  const map = el('button', 'btn ico', '🗺️'); map.type = 'button'; map.setAttribute('aria-label', 'level map'); map.addEventListener('click', function () { map.blur(); showMap(); });
  const chip = el('div', 'ty-chip'); chip.innerHTML = '<b></b> <span></span>'; chip.querySelector('b').textContent = R.lv; chip.querySelector('span').textContent = R.L.name;
  R.ui.wpm = el('div', 'ty-stat', '⚡ 0 wpm'); R.ui.acc = el('div', 'ty-stat', '🎯 100%'); R.ui.extra = el('div', 'ty-stat ty-extra');
  const gd = el('button', 'btn ico' + (S.guide ? '' : ' off'), '🖐️'); gd.type = 'button'; gd.setAttribute('aria-label', 'finger guide on or off'); gd.title = 'Finger guide';
  gd.addEventListener('click', function () { gd.blur(); S.guide = !S.guide; gd.classList.toggle('off', !S.guide); R.ui.kbwrap.hidden = !S.guide; });
  const vc = el('button', 'btn ico' + (S.voice ? '' : ' off'), '🗣️'); vc.type = 'button'; vc.setAttribute('aria-label', 'coach voice on or off'); vc.title = 'Coach voice';
  vc.addEventListener('click', function () { vc.blur(); S.voice = !S.voice; vc.classList.toggle('off', !S.voice); if (!S.voice) hush(); });
  [map, chip, R.ui.wpm, R.ui.acc, R.ui.extra, vc, gd].forEach(function (x) { bar.appendChild(x); });
  return bar;
}
function refresh(R) { if (!R.ui.wpm) return; R.ui.wpm.textContent = '⚡ ' + Math.round(wpm(R)) + ' wpm'; R.ui.acc.textContent = '🎯 ' + Math.round(acc(R)) + '%'; }
function buildPlay(R) {
  const p = el('div', 'ty-play ty-t-' + R.L.theme + ' g-' + R.game);
  addBg(p, R.L.theme, R.game === 'blaster' ? 4 : 12);
  p.appendChild(hud(R));
  const main = el('div', 'ty-main'); p.appendChild(main); R.ui.main = main;
  R.ui.count = el('div', 'ty-count', ''); main.appendChild(R.ui.count);
  R.ui.finger = el('div', 'ty-finger'); R.ui.finger.innerHTML = '<span class="ty-coach-av">🦊</span><span class="t"></span>'; R.ui.fingerT = R.ui.finger.querySelector('.t'); p.appendChild(R.ui.finger);
  R.ui.kbwrap = el('div', 'ty-kbwrap'); R.ui.kbwrap.appendChild(buildKeyboard()); R.ui.kbwrap.hidden = !S.guide; p.appendChild(R.ui.kbwrap);
  setView('play', p);
  ({ racer: setupRacer, blaster: setupBlaster, boss: setupBoss })[R.game](R);
}
function lineEl(text) { const d = el('div', 'ty-line'); text.split('').forEach(function (ch) { d.appendChild(el('span', 'c', ch)); }); return d; }
function markLine(line, i, bad) {
  const cs = line.children;
  for (let k = 0; k < cs.length; k++) cs[k].className = 'c' + (k < i ? ' ok' : k === i ? ' cur' + (bad ? ' bad' : '') : '');
}

/* ---------- animated backgrounds: clouds, bubbles, snow, embers ... drift behind every game ---------- */
const BGK = { jungle: ['🍃', '🦋', 'fall'], beach: ['☁️', '🐦', 'drift'], volcano: ['🔥', '✨', 'rise'], ocean: ['🫧', '🐟', 'rise'], desert: ['☁️', '🌵', 'drift'], snow: ['❄️', '❄️', 'fall'], city: ['☁️', '🌟', 'drift'], lab: ['💾', '✨', 'rise'], candy: ['🍬', '🍭', 'fall'], sky: ['☁️', '🎈', 'drift'], clouds: ['☁️', '☁️', 'drift'] };
function addBg(host, theme, n) {
  const k = BGK[theme] || BGK.sky, bg = el('div', 'ty-bg');
  for (let i = 0; i < (n || 12); i++) {
    const s = el('span', 'bgi ' + k[2], k[i % 2]);
    s.style.fontSize = (14 + Math.random() * 22) + 'px'; s.style.animationDuration = (14 + Math.random() * 16) + 's'; s.style.animationDelay = (-Math.random() * 28) + 's';
    if (k[2] === 'drift') s.style.top = (Math.random() * 70) + '%'; else s.style.left = (Math.random() * 94) + '%';
    bg.appendChild(s);
  }
  host.insertBefore(bg, host.firstChild); return bg;
}
let svgId = 0;
function confetti(host, x, y, n) {
  for (let k = 0; k < (n || 10); k++) {
    const s = el('i', 'cf'), a = Math.random() * 6.283, r = 36 + Math.random() * 50;
    s.style.cssText = 'left:' + x + 'px;top:' + y + 'px;background:' + BAL[k % BAL.length] + ';--dx:' + (Math.cos(a) * r).toFixed(0) + 'px;--dy:' + (Math.sin(a) * r - 18).toFixed(0) + 'px';
    host.appendChild(s); later(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 750);
  }
}

/* ================= game 1: Typing Racer ================= */
function wheelSvg(cx) {
  return '<circle cx="' + cx + '" cy="64" r="19" fill="#0d0d18"/><g class="wh"><circle cx="' + cx + '" cy="64" r="15" fill="#23233a" stroke="#0d0d18" stroke-width="2"/><circle cx="' + cx + '" cy="64" r="9" fill="#d5d9ee"/>' +
    '<path d="M' + cx + ',55 V73 M' + (cx - 9) + ',64 H' + (cx + 9) + ' M' + (cx - 6.4) + ',57.6 L' + (cx + 6.4) + ',70.4 M' + (cx + 6.4) + ',57.6 L' + (cx - 6.4) + ',70.4" stroke="#8a90ac" stroke-width="2"/><circle cx="' + cx + '" cy="64" r="3" fill="#1d1d33"/></g>';
}
function carSvg(c1, c2) {
  const id = 'cg' + (svgId++), ink = '#1d1d33';
  return '<svg viewBox="0 0 210 86" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient>' +
    '<linearGradient id="' + id + 'g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cdeeff"/><stop offset="1" stop-color="#2d4f86"/></linearGradient></defs>' +
    '<ellipse cx="105" cy="80" rx="92" ry="5" fill="#000" opacity=".28"/>' +
    '<path d="M4,46 L2,28 L34,28 L34,33 L12,35 L12,46 Z" fill="' + ink + '"/>' +
    '<path d="M6,62 L6,48 Q6,42 20,40 L48,38 Q56,36 62,22 Q66,15 78,14 L108,14 Q126,15 140,26 L164,38 L190,42 Q204,45 204,54 L204,62 Q204,66 198,66 L12,66 Q6,66 6,62 Z" fill="url(#' + id + ')" stroke="' + ink + '" stroke-width="2.5" stroke-linejoin="round"/>' +
    '<path d="M66,34 L70,23 Q73,19 80,19 L104,19 L104,34 Z" fill="url(#' + id + 'g)" stroke="' + ink + '" stroke-width="2"/><path d="M110,19 L120,19 Q132,21 144,34 L110,34 Z" fill="url(#' + id + 'g)" stroke="' + ink + '" stroke-width="2"/>' +
    '<path d="M107,34 V62" stroke="' + ink + '" stroke-width="2" opacity=".5"/><rect x="112" y="46" width="12" height="3.5" rx="1.7" fill="#fff" opacity=".85"/><path d="M12,56 L196,56" stroke="#fff" stroke-width="2.5" opacity=".35"/>' +
    '<rect x="6" y="46" width="9" height="7" rx="2" fill="#ff9aa8"/><ellipse cx="198" cy="48" rx="7" ry="5" fill="#fff6b0" stroke="' + ink + '" stroke-width="1.5"/>' + wheelSvg(54) + wheelSvg(156) + '</svg>';
}
const SCENE = { jungle: ['#4fae6a', '#2f8a4a'], beach: ['#e8d9a0', '#c9b878'], volcano: ['#8a4a4a', '#5a2a2a'], ocean: ['#5aa0c8', '#3a7aa8'], desert: ['#e0b878', '#c09050'], snow: ['#e8f2fa', '#b9d0e6'], city: ['#8a8fb5', '#6a6f95'], lab: ['#6aa8a8', '#4a8888'], candy: ['#f2a0c8', '#d870a8'], sky: ['#bcd6f5', '#8fb4e0'] };
function tile(svg) { return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")'; }
function farTile(c) { return tile('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="100" viewBox="0 0 600 100"><path d="M0,100 V62 Q75,8 150,56 T300,48 T450,38 T600,62 V100Z" fill="' + c + '"/></svg>'); }
function nearTile(c) { let p = ''; for (let x = 20; x < 400; x += 70) p += '<path d="M' + (x - 16) + ',80 L' + x + ',22 L' + (x + 16) + ',80Z" fill="' + c + '"/><rect x="' + (x - 3) + '" y="78" width="6" height="2" fill="' + c + '"/>'; return tile('<svg xmlns="http://www.w3.org/2000/svg" width="420" height="80" viewBox="0 0 420 80">' + p + '</svg>'); }
function setupRacer(R) {
  R.text = passageFor(R.lv); R.i = 0; R.lastOk = -9;
  const key = 'racer:' + R.lv, gh = S.ghost[key] || null; R.ghostRec = gh; R.cps = target() * 5 / 60;
  const sc = SCENE[R.L.theme] || SCENE.sky, track = el('div', 'ty-track'); R.ui.track = track;
  const scn = el('div', 'scn'); R.ui.far = el('div', 'l far'); R.ui.near = el('div', 'l near'); R.ui.tint = el('div', 'l tint');
  R.ui.far.style.backgroundImage = farTile(sc[0]); R.ui.near.style.backgroundImage = nearTile(sc[1]); scn.appendChild(R.ui.far); scn.appendChild(R.ui.near); scn.appendChild(R.ui.tint); track.appendChild(scn);
  function lane(label, c1, c2, cls) { const l = el('div', 'lane ' + cls), car = el('div', 'car'); car.innerHTML = carSvg(c1, c2); l.appendChild(el('div', 'tag', label)); l.appendChild(car); l.appendChild(el('div', 'flag')); track.appendChild(l); return car; }
  R.ui.you = lane('You', '#ff5c72', '#c4223c', 'you');
  R.ui.ghost = gh ? lane('Your best', '#6aa8ff', '#2f5fc8', 'ghost') : lane('Pace car (' + target() + ' wpm)', '#ffd23f', '#d89a00', 'ghost');
  R.ui.main.appendChild(track);
  R.ui.line = lineEl(R.text); R.ui.main.appendChild(R.ui.line); markLine(R.ui.line, 0);
  R.ui.extra.textContent = '🏁 0%'; R.begin = function () { hlKey(R.text[0]); };
  hlKey(R.text[0]);
}
function racerChar(R, ch) {
  if (!R.started) { R.started = true; R.t = 0; R.lastT = 0; }
  const exp = R.text[R.i];
  if (ch === exp) { noteKey(exp, true, R); R.correct++; R.times.push(R.t); R.i++; R.lastOk = R.t; CC.sfx.tick && CC.sfx.tick(); markLine(R.ui.line, R.i);
    if (R.i >= R.text.length) { finishRun(R, true); return; } hlKey(R.text[R.i]); }
  else { noteKey(exp, false, R); R.errors++; CC.sfx.softMiss && CC.sfx.softMiss(); markLine(R.ui.line, R.i, true); wobble(R.ui.you); }
  racerPos(R); refresh(R);
}
function wobble(e) { e.classList.remove('wob'); void e.offsetWidth; e.classList.add('wob'); }
function racerPos(R) {
  const p = R.i / R.text.length; R.ui.you.style.left = (2 + p * 81) + '%'; R.ui.extra.textContent = '🏁 ' + Math.round(p * 100) + '%';
  let gp; if (R.ghostRec) { const tt = R.ghostRec.times, n = R.ghostRec.times.length; let k = R.gi || 0; while (k < n && tt[k] <= R.t) k++; R.gi = k; gp = k / n; }
  else gp = Math.min(1, (R.started ? R.t : 0) * R.cps / R.text.length);
  R.ui.ghost.style.left = (2 + gp * 81) + '%';
  R.ui.far.style.backgroundPositionX = (-p * 520) + 'px'; R.ui.near.style.backgroundPositionX = (-p * 1400) + 'px'; R.ui.tint.style.opacity = (p * 0.4).toFixed(2);   // the day slowly turns to evening
  R.ui.track.classList.toggle('go', R.started && R.t - R.lastOk < 1.2);                                                                                      // the wheels and road move while you type
}
function racerUpdate(R, dt) { if (R.phase !== 'play') return; if (R.started) R.t += dt; racerPos(R); refresh(R); if (!R.half && R.i >= R.text.length / 2) { R.half = true; coachSay(R, 'Halfway there! Keep it smooth and steady.'); } }

/* ================= game 2: Word Blaster (balloons float up; type a word to pop it) ================= */
const BAL = ['#ff5c72', '#ff9f45', '#ffd23f', '#6bcb77', '#22c6c6', '#4f9bff', '#a77bff', '#ff8ad8'];
function setupBlaster(R) {
  const L = R.L; R.words = []; R.spawned = 0; R.N = Math.min(30, 12 + 2 * R.lv); R.shields = 3; R.score = 0; R.streak = 0; R.target = null; R.started = true; R.spawnT = 0.6; R.skyStage = -1;
  const pool = shuffle(L.words); R.queue = []; while (R.queue.length < R.N) R.queue = R.queue.concat(shuffle(pool)); R.queue = R.queue.slice(0, R.N);
  const cps = target() * 5 / 60, demand = clamp(0.5 + 0.05 * R.lv, 0.55, 1.0), avg = R.queue.reduce(function (a, w) { return a + w.length; }, 0) / R.N;
  R.interval = clamp((avg + 1) / (cps * demand), 1.8, 5.2); R.fallSecs = clamp(15 - R.lv * 0.7 - (S.year - 4) * 0.8, 6.5, 14);
  const f = el('div', 'ty-field'); R.ui.field = f; R.ui.main.appendChild(f);
  R.ui.sky = ['d', 's', 'n'].map(function (c) { const l = el('div', 'sk ' + c); f.appendChild(l); return l; });
  addBg(f, 'clouds', 6);
  R.ui.ship = el('div', 'ship', '🧚'); f.appendChild(R.ui.ship); R.ui.beam = el('div', 'beam'); f.appendChild(R.ui.beam);
  setSky(R, 0); blasterUI(R); R.begin = function () { R.spawnT = 0.3; };
  hlKey(null);
}
function setSky(R, k) { if (R.skyStage === k) return; R.skyStage = k; R.ui.sky.forEach(function (l, i) { l.classList.toggle('on', i === k); }); }   // day, then sunset, then a starry night
function blasterUI(R) { R.ui.extra.textContent = '❤️'.repeat(Math.max(0, R.shields)) + '🖤'.repeat(Math.max(0, 3 - R.shields)) + '  ·  ⭐ ' + R.score + (R.streak >= 3 ? '  🔥x' + (1 + Math.floor(R.streak / 3)) : ''); }
function spawnWord(R) {
  const text = R.queue[R.spawned++], d = el('div', 'ty-bal'); d.style.setProperty('--c', BAL[Math.floor(Math.random() * BAL.length)]);
  const bb = el('div', 'bb'); text.split('').forEach(function (ch) { bb.appendChild(el('span', 'c', ch)); }); d.appendChild(bb); d.appendChild(el('i', 'kn')); d.appendChild(el('i', 'sg'));
  const lanes = 5; let lane = Math.floor(Math.random() * lanes); if (lane === R.lastLane) lane = (lane + 2) % lanes; R.lastLane = lane;
  const H = R.ui.field.clientHeight || 340, w = { text: text, i: 0, y: H, el: d, bb: bb, lane: lane }; d.style.left = (6 + lane * 18) + '%'; d.style.top = H + 'px'; R.ui.field.appendChild(d); R.words.push(w);
  setSky(R, Math.min(2, Math.floor(R.spawned / R.N * 3)));
}
function setTarget(R, w) { if (R.target) R.target.el.classList.remove('locked'); R.target = w; if (w) { w.el.classList.add('locked'); hlKey(w.text[w.i]); } else hlKey(null); }
function paintWord(w) { const cs = w.bb.children; for (let k = 0; k < cs.length; k++) cs[k].className = 'c' + (k < w.i ? ' ok' : ''); }
function blasterChar(R, ch) {
  let w = R.target;
  if (!w) { const cands = R.words.filter(function (x) { return x.text[0] === ch; }).sort(function (a, b) { return a.y - b.y; }); if (!cands.length) { noteKey(ch, false, R); R.errors++; R.streak = 0; CC.sfx.softMiss && CC.sfx.softMiss(); wobble(R.ui.ship); refresh(R); blasterUI(R); return; } w = cands[0]; setTarget(R, w); }
  const exp = w.text[w.i];
  if (ch === exp) { noteKey(exp, true, R); R.correct++; w.i++; paintWord(w); CC.sfx.tick && CC.sfx.tick();
    if (w.i >= w.text.length) { R.correct++; zap(R, w); } else hlKey(w.text[w.i]); }
  else { noteKey(exp, false, R); R.errors++; R.streak = 0; CC.sfx.softMiss && CC.sfx.softMiss(); w.el.classList.remove('shake'); void w.el.offsetWidth; w.el.classList.add('shake'); }
  refresh(R); blasterUI(R);
}
function zap(R, w) {
  R.streak++; if (R.streak === 5 || R.streak === 10) coachSay(R, 'Great streak! Keep it up.'); R.score += w.text.length * 10 * (1 + Math.min(4, Math.floor(R.streak / 3))); CC.sfx.pop && CC.sfx.pop();
  const f = R.ui.field, H = f.clientHeight || 340, bx = (f.clientWidth || 600) / 2, wx = w.el.offsetLeft + w.el.offsetWidth / 2, wy = w.y + 26, dx = wx - bx, dy = H - 46 - wy;
  R.ui.beam.style.cssText = 'left:' + bx + 'px;height:' + Math.max(10, Math.hypot(dx, dy)) + 'px;transform:rotate(' + Math.atan2(dx, dy) + 'rad);opacity:1';
  later(function () { R.ui.beam.style.opacity = '0'; }, 140);
  confetti(f, wx, wy, 12);
  w.el.classList.add('boom'); R.words.splice(R.words.indexOf(w), 1); if (R.target === w) R.target = null; hlKey(null); later(function () { if (w.el.parentNode) w.el.parentNode.removeChild(w.el); }, 220);
  if (R.spawned >= R.N && !R.words.length) finishRun(R, true);
}
function blasterUpdate(R, dt) {
  if (R.phase !== 'play') return; R.t += dt;
  const H = R.ui.field.clientHeight || 340, v = (H + 70) / R.fallSecs;
  R.spawnT -= dt; if (R.spawnT <= 0 && R.spawned < R.N) { spawnWord(R); R.spawnT = R.interval * (0.85 + Math.random() * 0.3); }
  for (let i = R.words.length - 1; i >= 0; i--) {
    const w = R.words[i]; w.y -= v * dt; w.el.style.top = w.y + 'px';
    if (w.y <= -64) {                                  // a balloon floated away: a heart is lost (never a hard "game over" sound)
      R.shields--; R.streak = 0; if (R.target === w) { R.target = null; hlKey(null); } R.words.splice(i, 1); w.el.classList.add('hit'); later(function () { if (w.el.parentNode) w.el.parentNode.removeChild(w.el); }, 600); CC.sfx.softMiss && CC.sfx.softMiss(); wobble(R.ui.ship); blasterUI(R);
      if (R.shields <= 0) { finishRun(R, false); return; }
      if (R.spawned >= R.N && !R.words.length) { finishRun(R, true); return; }
    }
  }
  refresh(R);
}

/* ================= game 3: Boss Sentences ================= */
/* each level has its own monster: [body colour, shade, eyes, horns ('horn' | 'spike' | ''), wings, antenna, belly colour] */
const MON = [['#6bcb77', '#2f9f4f', 2, 'horn', 0, 0, '#d9f7c9'], ['#ff9f45', '#d9701a', 1, '', 0, 1, '#ffe3b8'], ['#ff6b6b', '#c93a3a', 2, 'horn', 1, 0, '#ffd0c0'], ['#4f9bff', '#2a5fc0', 3, 'spike', 0, 0, '#cfe4ff'], ['#e0b060', '#b07a2a', 2, 'spike', 0, 0, '#fff0c8'],
  ['#d6ecff', '#8fb8e0', 2, 'horn', 0, 0, '#ffffff'], ['#a77bff', '#6a40c8', 2, 'horn', 1, 0, '#e6dcff'], ['#22c6c6', '#128a8a', 3, '', 0, 1, '#c8f5f5'], ['#ff8ad8', '#d04aa0', 1, 'spike', 0, 0, '#ffd8f2'], ['#ffd23f', '#e08a00', 3, 'horn', 1, 1, '#fff3b8']];
function monsterSvg(lv) {
  const m = MON[lv - 1], id = 'mg' + (svgId++), A = m[0], B = m[1], ink = '#2b2540', st = ' stroke="' + ink + '" stroke-width="3" stroke-linejoin="round"';
  let s = '<svg class="mon" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="' + id + '" cx=".4" cy=".3" r=".9"><stop offset="0" stop-color="' + A + '"/><stop offset="1" stop-color="' + B + '"/></radialGradient></defs>';
  s += '<ellipse cx="100" cy="193" rx="64" ry="6" fill="#000" opacity=".25"/>';
  if (m[4]) { const w = '<path d="M54,104 Q6,64 12,16 Q40,38 58,70 Q42,60 34,52 Q44,82 62,98 Z" fill="' + B + '"' + st + '/>'; s += w + '<g transform="translate(200,0) scale(-1,1)">' + w + '</g>'; }
  s += '<ellipse cx="68" cy="184" rx="25" ry="11" fill="' + B + '"' + st + '/><ellipse cx="132" cy="184" rx="25" ry="11" fill="' + B + '"' + st + '/>';
  s += '<ellipse cx="36" cy="126" rx="13" ry="26" transform="rotate(25 36 126)" fill="' + A + '"' + st + '/><ellipse cx="164" cy="126" rx="13" ry="26" transform="rotate(-25 164 126)" fill="' + A + '"' + st + '/>';
  if (m[3] === 'horn') s += '<polygon points="58,66 44,20 86,52" fill="#ffe6a8"' + st + '/><polygon points="142,66 156,20 114,52" fill="#ffe6a8"' + st + '/>';
  if (m[3] === 'spike') s += '<polygon points="66,54 78,22 92,50" fill="' + B + '"' + st + '/><polygon points="88,48 100,12 112,48" fill="' + B + '"' + st + '/><polygon points="108,50 122,22 134,54" fill="' + B + '"' + st + '/>';
  if (m[5]) s += '<path d="M100,52 V22" stroke="' + ink + '" stroke-width="4" stroke-linecap="round"/><circle cx="100" cy="17" r="8" fill="#ff5c72"' + st + '/>';
  s += '<ellipse cx="100" cy="120" rx="68" ry="70" fill="url(#' + id + ')"' + st + '/><ellipse cx="100" cy="146" rx="40" ry="38" fill="' + m[6] + '" opacity=".9"/>';
  s += '<circle cx="64" cy="100" r="6" fill="' + B + '" opacity=".35"/><circle cx="142" cy="92" r="5" fill="' + B + '" opacity=".35"/><circle cx="150" cy="118" r="7" fill="' + B + '" opacity=".3"/>';
  s += '<g class="ey">';
  if (m[2] === 1) s += '<circle cx="100" cy="92" r="23" fill="#fff"' + st + '/><circle cx="100" cy="95" r="11" fill="' + ink + '"/><circle cx="95" cy="89" r="4" fill="#fff"/>';
  else { s += '<circle cx="76" cy="92" r="17" fill="#fff"' + st + '/><circle cx="124" cy="92" r="17" fill="#fff"' + st + '/><circle cx="78" cy="95" r="8" fill="' + ink + '"/><circle cx="122" cy="95" r="8" fill="' + ink + '"/><circle cx="75" cy="91" r="3" fill="#fff"/><circle cx="119" cy="91" r="3" fill="#fff"/>';
    if (m[2] === 3) s += '<circle cx="100" cy="66" r="10" fill="#fff"' + st + '/><circle cx="100" cy="68" r="5" fill="' + ink + '"/>';
    s += '<path d="M54,70 L92,80 M146,70 L108,80" stroke="' + ink + '" stroke-width="5" stroke-linecap="round"/>'; }
  s += '</g><ellipse cx="58" cy="118" rx="9" ry="6" fill="#ff8aa0" opacity=".5"/><ellipse cx="142" cy="118" rx="9" ry="6" fill="#ff8aa0" opacity=".5"/>';
  s += '<g class="mo"><path d="M64,124 Q100,178 136,124 Q100,136 64,124 Z" fill="#5a1530"' + st + '/><ellipse cx="100" cy="150" rx="15" ry="7" fill="#ff7a9a"/><polygon points="74,127 82,141 90,130" fill="#fff"/><polygon points="94,131 100,144 106,131" fill="#fff"/><polygon points="110,130 118,141 126,127" fill="#fff"/></g></svg>';
  return s;
}
function setupBoss(R) {
  const L = R.L, count = [3, 3, 3, 4, 4, 4, 4, 4, 5, 2][R.lv - 1];
  R.sentences = shuffle(L.sentences).slice(0, count); R.si = 0; R.i = 0; R.hearts = 3; R.power = 0; R.hpMax = R.sentences.reduce(function (a, s) { return a + s.length; }, 0); R.dmg = 0;
  R.factor = 0.45 + 0.045 * R.lv; R.cps = target() * 5 / 60 * R.factor;
  const b = el('div', 'ty-boss'); R.ui.boss = el('div', 'face'); R.ui.boss.innerHTML = monsterSvg(R.lv); const hpw = el('div', 'bar hp'); R.ui.hp = el('i'); hpw.appendChild(R.ui.hp); const pw = el('div', 'bar pw'); R.ui.pw = el('i'); pw.appendChild(R.ui.pw);
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
    if (R.i >= s.length) { CC.sfx.pop && CC.sfx.pop(); R.si++; if (R.si >= R.sentences.length) { finishRun(R, true); return; } nextSentence(R); coachSay(R, rnd(['Great hit!', 'Nice typing!', 'Keep going, the boss is wobbling!'])); } else hlKey(s[R.i]); }
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
  later(function () { speak(won ? titles[0] + ' You typed ' + Math.round(w) + ' words a minute with ' + Math.round(a) + ' percent accuracy.' + (beat ? ' A new personal best!' : '') + (med ? ' ' + med.replace(/^\S+\s/, '') + '.' : '') + (prac.length ? ' Practise the keys ' + prac.join(', ') + '.' : '') : titles[1] + ' Slow and steady wins. Let us try again.'); }, 800);
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
  const sans = "'Trebuchet MS','Segoe UI',Arial,sans-serif", mid = W / 2, INK = '#14163a', SOFT = '#6b6f93';
  const tc = { Gold: ['#ffd84a', '#e39a14'], Silver: ['#eef1f8', '#8f98b0'], Bronze: ['#f0b384', '#a85f2c'] }[f.tier] || ['#ffd84a', '#e39a14'];
  const T = target(), frac = Math.max(0.02, Math.min(1, f.best / (T * 1.6))), tfrac = 1 / 1.6;
  function pt(cx, cy, r, fr) { const a = Math.PI + fr * Math.PI; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
  function arc(cx, cy, r, f0, f1) { const a = pt(cx, cy, r, f0), b = pt(cx, cy, r, f1); return 'M' + a[0].toFixed(1) + ',' + a[1].toFixed(1) + ' A' + r + ',' + r + ' 0 0 1 ' + b[0].toFixed(1) + ',' + b[1].toFixed(1); }
  let g = '<defs><linearGradient id="hd" x1="0" y1="0" x2="1" y2="0.4"><stop offset="0" stop-color="#5b3df5"/><stop offset="0.55" stop-color="#8a3df5"/><stop offset="1" stop-color="#14b8e6"/></linearGradient>' +
    '<linearGradient id="ac" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#14b8e6"/><stop offset="1" stop-color="#8a3df5"/></linearGradient>' +
    '<linearGradient id="td" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + tc[0] + '"/><stop offset="1" stop-color="' + tc[1] + '"/></linearGradient></defs>';
  g += '<rect width="' + W + '" height="' + H + '" fill="#ffffff"/>';
  g += '<path d="M0,0 H' + W + ' V186 L0,262 Z" fill="url(#hd)"/>';
  /* keycap pattern in the banner */
  for (let r = 0; r < 3; r++) for (let c = 0; c < 17; c++) { const x = 20 + c * 68 + (r % 2) * 34, y = 16 + r * 62; if (y + 50 < 200 - c * 2.4 + 40) g += '<rect x="' + x + '" y="' + y + '" width="54" height="50" rx="10" fill="#fff" fill-opacity=".09"/>'; }
  g += CC.keycapsSvg(CC.APP_NAME, mid, 30, 40);
  g += '<text x="' + mid + '" y="150" font-family="' + sans + '" font-size="68" font-weight="bold" letter-spacing="3" fill="#fff" text-anchor="middle">TYPING CERTIFICATE</text>';
  g += '<text x="' + mid + '" y="318" font-family="' + sans + '" font-size="17" font-weight="bold" letter-spacing="8" fill="' + SOFT + '" text-anchor="middle">AWARDED TO</text>';
  const fsz = n.length <= 14 ? 64 : n.length <= 20 ? 52 : 42;
  g += '<text x="' + mid + '" y="384" font-family="' + sans + '" font-size="' + fsz + '" font-weight="bold" fill="' + INK + '" text-anchor="middle">' + esc(n) + '</text>';
  g += '<rect x="' + (mid - 170) + '" y="398" width="340" height="5" rx="2.5" fill="url(#ac)"/>';
  g += '<text x="' + mid + '" y="440" font-family="' + sans + '" font-size="20" fill="#44486b" text-anchor="middle">for finishing all ' + LEVELS.length + ' levels of <tspan font-weight="bold">' + esc(f.game ? f.game.name : 'Typing Club') + '</tspan> with speed, focus and accuracy</text>';
  g += '<text x="' + mid + '" y="468" font-family="' + sans + '" font-size="17" fill="' + SOFT + '" text-anchor="middle">Year ' + S.year + '  ·  Typing goal ' + T + ' words a minute</text>';
  /* speedometer */
  const gx = 215, gy = 600, gr = 104;
  g += '<path d="' + arc(gx, gy, gr, 0, 1) + '" fill="none" stroke="#e8eafa" stroke-width="24" stroke-linecap="round"/>';
  g += '<path d="' + arc(gx, gy, gr, 0, frac) + '" fill="none" stroke="url(#ac)" stroke-width="24" stroke-linecap="round"/>';
  const t0 = pt(gx, gy, gr - 20, tfrac), t1 = pt(gx, gy, gr + 20, tfrac);
  g += '<line x1="' + t0[0].toFixed(1) + '" y1="' + t0[1].toFixed(1) + '" x2="' + t1[0].toFixed(1) + '" y2="' + t1[1].toFixed(1) + '" stroke="' + INK + '" stroke-width="3" stroke-dasharray="4 3"/>';
  const nd = pt(gx, gy, gr - 30, frac);
  g += '<line x1="' + gx + '" y1="' + gy + '" x2="' + nd[0].toFixed(1) + '" y2="' + nd[1].toFixed(1) + '" stroke="' + INK + '" stroke-width="5" stroke-linecap="round"/><circle cx="' + gx + '" cy="' + gy + '" r="9" fill="' + INK + '"/>';
  g += '<text x="' + gx + '" y="' + (gy + 58) + '" font-family="' + sans + '" font-size="46" font-weight="bold" fill="' + INK + '" text-anchor="middle">' + (f.best || '–') + '</text>';
  g += '<text x="' + gx + '" y="' + (gy + 82) + '" font-family="' + sans + '" font-size="13" font-weight="bold" letter-spacing="3" fill="' + SOFT + '" text-anchor="middle">WORDS A MINUTE</text>';
  /* accuracy ring */
  const rx = mid, ry = 590, rr = 74, circ = 2 * Math.PI * rr;
  g += '<circle cx="' + rx + '" cy="' + ry + '" r="' + rr + '" fill="none" stroke="#e8eafa" stroke-width="18"/>';
  g += '<circle cx="' + rx + '" cy="' + ry + '" r="' + rr + '" fill="none" stroke="url(#ac)" stroke-width="18" stroke-linecap="round" stroke-dasharray="' + (circ * f.avg / 100).toFixed(1) + ' ' + circ.toFixed(1) + '" transform="rotate(-90 ' + rx + ' ' + ry + ')"/>';
  g += '<text x="' + rx + '" y="' + (ry + 16) + '" font-family="' + sans + '" font-size="44" font-weight="bold" fill="' + INK + '" text-anchor="middle">' + f.avg + '%</text>';
  g += '<text x="' + rx + '" y="' + (ry + 120) + '" font-family="' + sans + '" font-size="13" font-weight="bold" letter-spacing="3" fill="' + SOFT + '" text-anchor="middle">ACCURACY</text>';
  /* medal */
  const mx = 908, my = 584;
  g += '<polygon points="' + (mx - 34) + ',' + (my + 36) + ' ' + (mx - 56) + ',' + (my + 112) + ' ' + (mx - 28) + ',' + (my + 98) + ' ' + (mx - 12) + ',' + (my + 118) + ' ' + (mx - 4) + ',' + (my + 44) + '" fill="#5b3df5"/>';
  g += '<polygon points="' + (mx + 34) + ',' + (my + 36) + ' ' + (mx + 56) + ',' + (my + 112) + ' ' + (mx + 28) + ',' + (my + 98) + ' ' + (mx + 12) + ',' + (my + 118) + ' ' + (mx + 4) + ',' + (my + 44) + '" fill="#14b8e6"/>';
  g += '<circle cx="' + mx + '" cy="' + my + '" r="64" fill="url(#td)" stroke="' + INK + '" stroke-width="4"/><circle cx="' + mx + '" cy="' + my + '" r="51" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="3" stroke-dasharray="3 5"/>';
  g += '<polygon points="' + starPath(mx, my, 32, 13) + '" fill="' + INK + '"/>';
  g += '<text x="' + mx + '" y="' + (my + 150) + '" font-family="' + sans + '" font-size="13" font-weight="bold" letter-spacing="3" fill="' + SOFT + '" text-anchor="middle">' + (f.tier ? esc(f.tier.toUpperCase()) + ' SPEED  ·  ' : '') + f.stars + ' STARS</text>';
  /* date + teacher */
  g += '<text x="150" y="738" font-family="' + sans + '" font-size="18" fill="' + INK + '" text-anchor="middle">' + esc(dt) + '</text><line x1="60" y1="748" x2="240" y2="748" stroke="' + INK + '" stroke-width="1.5"/><text x="150" y="768" font-family="' + sans + '" font-size="12" letter-spacing="3" fill="' + SOFT + '" text-anchor="middle">DATE</text>';
  g += '<line x1="883" y1="748" x2="1063" y2="748" stroke="' + INK + '" stroke-width="1.5"/><text x="973" y="768" font-family="' + sans + '" font-size="12" letter-spacing="3" fill="' + SOFT + '" text-anchor="middle">TEACHER</text>';
  g += '<rect x="0" y="' + (H - 12) + '" width="' + W + '" height="12" fill="url(#hd)"/>';
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
    if (!S.loop) S.loop = CC.createLoop(update, function () { const pl = document.querySelector('#ty-root .ty-play'); if (pl) pl.classList.toggle('still', CC.paused || !S.run || S.run.phase !== 'play'); if (CC.paused && !S.hushed) { hush(); S.hushed = true; } else if (!CC.paused) S.hushed = false; });
    S.loop.start(); showHome();
  },
  exit: function () { stopRun(); S.lesson = null; hush(); if (S.loop) S.loop.stop(); S.view = 'home'; },
  onKeyDown: function (e) {
    if (S.view === 'lesson') { lessonKey(e); return; }
    const R = S.run; if (S.view !== 'play' || !R) return;
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Backspace') { e.preventDefault(); if (R.game === 'blaster' && R.target && R.phase === 'play') { R.target.i = 0; paintWord(R.target); hlKey(R.target.text[0]); setTarget(R, null); } return; }
    if (e.key.length === 1) { e.preventDefault(); if (!e.repeat) onChar(e.key); }
  },
  /* test hooks (used only by the automated checks) */
  _S: S, _sim: function (secs) { const n = Math.round(secs * 60); for (let i = 0; i < n; i++) { if (!S.run || S.run.phase === 'done' || S.run.phase === 'off') break; update(1 / 60); } },
  _start: function (game, lv) { S.game = game; S.level = lv; startRun(); }, _go: function () { const R = S.run; if (R && R.phase === 'count') { clearTimers(); R.ui.count.hidden = true; R.phase = 'play'; if (R.begin) R.begin(); } },
  _chars: onChar, _report: reportText, _cert: showCertificate, _earned: certEarned, _lesson: showLesson, _steps: function () { return lessonSteps(LEVELS[S.level - 1]); }
};
})();
