/* mouseclub.js - Mouse Club (Year 1). Six games, ten short stages each, and every game practises ONE mouse skill:
     Move (hover only), Click, Double-click, Right-click, Drag and drop, Scroll.
   Bo (the bear) says every instruction aloud and in words on the screen; a drawn mouse pointer shows what to do; slow music plays softly.
   Every stage is just a row of settings in GAMES below, so a teacher can change sizes, speeds and counts easily.
   Nothing is sent anywhere; progress is kept on this computer for a few hours (CC.keep) so an accidental refresh does not lose it. */
(function () {
'use strict';
const CC = window.CC, clamp = CC.clamp;
const $stage = function () { return document.getElementById('stage-mouseclub'); };
const $root = function () { return document.getElementById('mc-root'); };
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function rnd(a) { return a[Math.floor(Math.random() * a.length)]; }
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

/* ================= the games and their ten stages =================
   t = what kind of stage it is, n = how many to do, sz = size of the things (bigger = easier), speed = how fast they move. */
const GAMES = [
  { id: 'move', icon: '🐝', name: 'Move', color: '#22b8cf', desc: 'Move the mouse.', demo: 'Moving the mouse', stages: [
    { t: 'collect', n: 3, sz: 4.2, e: '⭐', icon: '⭐', title: 'Shiny stars', voice: 'Move the mouse onto each shining star.', text: 'Touch the stars.' },
    { t: 'collect', n: 4, sz: 3.4, e: '🌟', icon: '🌟', title: 'More stars', voice: 'Move the mouse onto every star.', text: 'Touch every star.' },
    { t: 'follow', sz: 3.8, e: '🦋', need: 7, speed: 0.5, icon: '🦋', title: 'Butterfly', voice: 'Follow the butterfly with the mouse. Stay close to it!', text: 'Follow the butterfly.' },
    { t: 'path', n: 6, sz: 3.1, amp: 0.2, e: '🌼', last: '🏠', icon: '🐝', title: 'Bee path', voice: 'Help the bee fly home. Touch each flower, one after the other.', text: 'Help the bee. Touch each flower.' },
    { t: 'drift', n: 6, sz: 3.6, speed: 0.09, e: '🫧', icon: '🫧', title: 'Bubbles', voice: 'Touch the bubbles with the mouse to pop them!', text: 'Pop the bubbles!' },
    { t: 'collect', n: 5, sz: 2.9, ordered: true, e: '🍎', icon: '🍎', title: 'In order', voice: 'Touch the apples in order: 1, 2, 3, 4, 5.', text: 'Touch the apples: 1, 2, 3, 4, 5.' },
    { t: 'wander', n: 5, sz: 3.3, speed: 0.14, e: '🐟', icon: '🐟', title: 'Catch the fish', voice: 'Catch the fish! Move the mouse onto it.', text: 'Catch the fish!' },
    { t: 'path', n: 8, sz: 2.5, amp: 0.28, e: '🌸', last: '🏡', icon: '🌸', title: 'Winding path', voice: 'Follow the winding path. Touch each flower in order.', text: 'Follow the flowers home.' },
    { t: 'drift', n: 10, sz: 3.1, speed: 0.15, e: '🫧', icon: '🎈', title: 'Bubble pop', voice: 'Pop ten bubbles by moving the mouse over them.', text: 'Pop ten bubbles!' },
    { t: 'path', n: 10, sz: 2.3, amp: 0.3, e: '⭐', last: '🏁', icon: '🏁', title: 'Star trail', voice: 'Follow the trail of stars to the flag!', text: 'Follow the stars to the flag.' } ] },
  { id: 'click', icon: '🎈', name: 'Click', color: '#ff7ac8', desc: 'Press the left button once.', demo: 'Clicking with the left button', stages: [
    { t: 'tap', n: 3, sz: 4.7, e: '🎈', icon: '🎈', title: 'Big balloon', voice: 'Click the big balloon. Press the left mouse button once.', text: 'Click the big balloon.' },
    { t: 'many', n: 3, sz: 3.9, e: '🎈', icon: '🎈', title: 'Three balloons', voice: 'Click each balloon to pop it.', text: 'Click each balloon.' },
    { t: 'tap', n: 5, sz: 3.3, e: '🍎', icon: '🍎', title: 'Apples', voice: 'Click the apple. Then the next one comes!', text: 'Click the apple.' },
    { t: 'many', n: 5, sz: 2.9, e: '🌸', icon: '🌸', title: 'Flowers', voice: 'Click all the flowers.', text: 'Click all the flowers.' },
    { t: 'order', n: 3, sz: 3.8, e: '🔵', icon: '1️⃣', title: 'Numbers', voice: 'Click the numbers in order: 1, then 2, then 3.', text: 'Click 1, then 2, then 3.' },
    { t: 'pick', rounds: 4, kind: 'colour', sz: 3.5, icon: '🎨', title: 'Colours', voice: 'Click the right colour.', text: 'Click the right colour.' },
    { t: 'moving', n: 5, sz: 3.5, speed: 0.07, e: '🎈', icon: '🎈', title: 'Floating', voice: 'The balloons are floating! Click them to pop them.', text: 'Pop the floating balloons!' },
    { t: 'order', n: 5, sz: 2.9, e: '🟠', icon: '5️⃣', title: 'Five numbers', voice: 'Click the numbers in order: 1, 2, 3, 4, 5.', text: 'Click 1, 2, 3, 4, 5.' },
    { t: 'pick', rounds: 5, kind: 'animal', sz: 3.1, icon: '🐶', title: 'Animals', voice: 'Click the right animal.', text: 'Click the right animal.' },
    { t: 'moving', n: 8, sz: 3.1, speed: 0.11, e: '⭐', icon: '🌟', title: 'Star shower', voice: 'Click the falling stars.', text: 'Click the falling stars!' } ] },
  { id: 'dbl', icon: '🥚', name: 'Double-click', color: '#ffb52e', desc: 'Click twice, quickly!', demo: 'Double-clicking', stages: [
    { t: 'dbl', n: 1, sz: 5.2, seq: true, e: '🥚', icon: '🥚', title: 'One egg', voice: 'Double-click the egg. Click twice, quickly: click-click!', text: 'Double-click the egg: click-click!' },
    { t: 'dbl', n: 2, sz: 4.3, seq: true, e: '🥚', icon: '🐣', title: 'Two eggs', voice: 'Double-click each egg to hatch it.', text: 'Double-click each egg.' },
    { t: 'dbl', n: 3, sz: 3.7, seq: true, e: '🥚', icon: '🐥', title: 'Three eggs', voice: 'Double-click each egg. Click-click!', text: 'Click-click each egg!' },
    { t: 'dbl', n: 3, sz: 3.7, e: '🥚', icon: '🥚', title: 'A nest', voice: 'Double-click all the eggs in the nest.', text: 'Double-click all the eggs.' },
    { t: 'dbl', n: 4, sz: 3.1, e: '🥚', icon: '🐤', title: 'Four eggs', voice: 'Double-click every egg.', text: 'Double-click every egg.' },
    { t: 'dblpick', rounds: 3, options: 3, sz: 3.5, icon: '✨', title: 'The glowing egg', voice: 'Double-click only the glowing egg.', text: 'Double-click the glowing egg.' },
    { t: 'dblmove', n: 3, sz: 3.7, speed: 0.045, e: '🥚', icon: '🌊', title: 'Floating eggs', voice: 'The eggs are floating slowly. Double-click them!', text: 'Double-click the floating eggs.' },
    { t: 'dbl', n: 5, sz: 2.8, e: '🥚', icon: '🐔', title: 'Five eggs', voice: 'Double-click all five eggs.', text: 'Double-click all five eggs.' },
    { t: 'dblpick', rounds: 4, options: 4, sz: 3.1, icon: '🌟', title: 'Glow hunt', voice: 'Double-click only the glowing egg.', text: 'Double-click the glowing egg.' },
    { t: 'dblmove', n: 5, sz: 3.1, speed: 0.08, e: '🥚', icon: '🏆', title: 'Egg parade', voice: 'Double-click the moving eggs.', text: 'Double-click the moving eggs.' } ] },
  { id: 'right', icon: '🎁', name: 'Right-click', color: '#a77bff', desc: 'Press the right button.', demo: 'Right-clicking', stages: [
    { t: 'rtap', n: 1, sz: 5.2, seq: true, e: '🎁', icon: '🎁', title: 'A present', voice: 'Press the RIGHT mouse button on the present. On a laptop, press with two fingers.', text: 'Right-click the present!' },
    { t: 'rtap', n: 3, sz: 4.2, seq: true, e: '🎁', icon: '🎀', title: 'Three presents', voice: 'Right-click each present to open it.', text: 'Right-click each present.' },
    { t: 'rtap', n: 4, sz: 3.3, e: '🎁', icon: '🎉', title: 'Presents', voice: 'Right-click all the presents.', text: 'Right-click all the presents.' },
    { t: 'hunt', n: 3, sz: 4.3, icon: '🐰', title: 'Hide and seek', voice: 'Animals are hiding in the bushes! Right-click a bush to find one.', text: 'Right-click a bush. Who is hiding?' },
    { t: 'menu', n: 1, sz: 4.6, correct: 0, options: ['✨ Open', '✖ Close'], e: '🧸', icon: '📋', title: 'A little menu', voice: 'Right-click the toy. A menu appears. Then click Open.', text: 'Right-click, then choose Open.' },
    { t: 'menu', n: 3, sz: 3.9, correct: 0, options: ['✨ Open', '✖ Close'], e: '🧸', icon: '📜', title: 'Menus', voice: 'Right-click each toy, then click Open.', text: 'Right-click, then Open.' },
    { t: 'lr', n: 4, sz: 4.1, icon: '🟢', title: 'Left or right?', voice: 'Green means the LEFT button. Orange means the RIGHT button.', text: 'Green = left. Orange = right.' },
    { t: 'hunt', n: 5, sz: 3.3, icon: '🦊', title: 'Find them all', voice: 'Right-click the bushes to find all the animals.', text: 'Find them all!' },
    { t: 'lr', n: 6, sz: 3.6, icon: '🟠', title: 'Left and right', voice: 'Look at the colour. Green is left, orange is right.', text: 'Green = left. Orange = right.' },
    { t: 'menu', n: 4, sz: 3.6, correct: 1, options: ['✖ Close', '🎉 Surprise', '↩ Back'], e: '📦', icon: '🏆', title: 'Surprise box', voice: 'Right-click the box, then click Surprise.', text: 'Right-click, then Surprise!' } ] },
  { id: 'drag', icon: '🧺', name: 'Drag and drop', color: '#6bcb77', desc: 'Pick up, move, let go.', demo: 'Dragging and dropping', stages: [
    { t: 'dragone', sz: 4.2, e: '🐱', zone: '🏠', icon: '🐱', title: 'Home', voice: 'Drag the cat to its house. Press and hold the left button, move, then let go.', text: 'Drag the cat home.' },
    { t: 'pairs', n: 2, sz: 3.7, icon: '🐶', title: 'Homes', voice: 'Drag each animal to its home.', text: 'Drag each animal home.' },
    { t: 'sort', n: 4, bins: 2, sz: 3.3, icon: '🧺', title: 'Sorting', voice: 'Drag the fruit into the fruit basket and the animals into the animal basket.', text: 'Fruit here, animals there.' },
    { t: 'order', n: 3, sz: 3.7, drag: true, icon: '🔢', title: 'Number boxes', voice: 'Drag the numbers into the boxes: 1, 2, 3.', text: 'Drag 1, 2, 3 into the boxes.' },
    { t: 'pairs', n: 3, sz: 3.3, icon: '🐟', title: 'More homes', voice: 'Drag each animal to where it lives.', text: 'Drag each animal home.' },
    { t: 'sort', n: 6, bins: 2, sz: 2.9, icon: '🍌', title: 'Big sort', voice: 'Sort everything into the right basket.', text: 'Sort into the baskets.' },
    { t: 'order', n: 4, sz: 3.3, drag: true, icon: '4️⃣', title: 'Four in a row', voice: 'Drag the numbers into the boxes in order.', text: 'Put 1, 2, 3, 4 in order.' },
    { t: 'pairs', n: 4, sz: 2.9, icon: '🐝', title: 'Four homes', voice: 'Match every animal with its home.', text: 'Match all the homes.' },
    { t: 'sort', n: 6, bins: 3, sz: 2.9, icon: '🚗', title: 'Three baskets', voice: 'Sort into three baskets: fruit, animals and vehicles.', text: 'Sort into three baskets.' },
    { t: 'order', n: 5, sz: 3.1, drag: true, icon: '🏆', title: 'Five in a row', voice: 'Put the numbers 1 to 5 in order in the boxes.', text: 'Put 1 to 5 in order.' } ] },
  { id: 'scroll', icon: '🎡', name: 'Scroll', color: '#ff7a45', desc: 'Turn the wheel, slide two fingers.', demo: 'Scrolling', stages: [
    { t: 'reach', pages: 2.2, icon: '🎁', title: 'Treasure', voice: 'Scroll down to find the treasure! Turn the mouse wheel. On a laptop, slide two fingers on the pad.', text: 'Scroll down to the treasure!' },
    { t: 'reach', pages: 3, icon: '🌳', title: 'Down, down', voice: 'Scroll all the way down to the bottom.', text: 'Scroll to the bottom.' },
    { t: 'meter', need: 900, icon: '🚀', title: 'Rocket', voice: 'Scroll the wheel to fill the rocket with fuel. Any way you scroll works!', text: 'Scroll to fill the rocket!' },
    { t: 'find', n: 2, pages: 3, icon: '🐱', title: 'Find the cats', voice: 'Cats are hiding! Scroll down and click each cat you find.', text: 'Scroll and click the cats.' },
    { t: 'updown', pages: 2.6, icon: '↕️', title: 'Down and up', voice: 'Scroll down to the bottom, then scroll back up to the top.', text: 'Scroll down, then back up.' },
    { t: 'meter', need: 1800, icon: '🚀', title: 'Big rocket', voice: 'Scroll to fill the big rocket with fuel.', text: 'Fill the big rocket!' },
    { t: 'find', n: 3, pages: 4, icon: '🐰', title: 'Hide and seek', voice: 'Scroll down and click the three hiding animals.', text: 'Find the hiding animals.' },
    { t: 'list', rounds: 3, rows: 14, icon: '🍌', title: 'The long list', voice: 'Scroll through the list and click the picture you are asked for.', text: 'Scroll and click the picture.' },
    { t: 'side', pages: 3, icon: '↔️', title: 'Sideways', voice: 'Scroll sideways to the flag. A mouse wheel works here too!', text: 'Scroll sideways to the flag.' },
    { t: 'find', n: 4, pages: 5, icon: '🏆', title: 'Big hunt', voice: 'Scroll and click the four hiding animals.', text: 'Find all four animals.' } ] }
];
const GAME = {}; GAMES.forEach(function (g) { GAME[g.id] = g; });

/* ================= state ================= */
const S = { name: '', view: 'home', game: 'move', stage: 1, voice: true, best: {}, seen: {}, run: null, timers: [], loop: null };
function later(fn, ms) { const id = setTimeout(function () { const i = S.timers.indexOf(id); if (i >= 0) S.timers.splice(i, 1); fn(); }, ms); S.timers.push(id); return id; }
function clearTimers() { S.timers.forEach(clearTimeout); S.timers = []; }
(function () { const k = CC.keep.load('mouseclub'); if (k) { S.best = k.best || {}; S.name = k.name || ''; } })();
function keepProgress() { CC.keep.save('mouseclub', { best: S.best, name: S.name }); }
function bestOf(g, i) { return S.best[g + ':' + i] || null; }
function doneCount(g) { let n = 0; for (let i = 1; i <= 10; i++) { const b = bestOf(g, i); if (b && b.stars >= 1) n++; } return n; }
function finalDone(g) { const b = bestOf(g, 10); return !!(b && b.stars >= 1); }
function certEarned() { return GAMES.some(function (g) { return finalDone(g.id); }); }

/* ================= Bo's voice (slow and clear; the music gets quieter while Bo talks) ================= */
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
const MAC_CHROME = /Mac/i.test(navigator.platform || '') && /Chrome\//.test(navigator.userAgent || '') && !/Edg\//.test(navigator.userAgent || '');   // Chrome on a Mac reads a little faster, so Bo goes a little slower there
function spoken(t) { return String(t).replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}⭐️]/gu, ' ').replace(/\s+/g, ' ').trim(); }
function setTalk(on) { document.querySelectorAll('.mc-av').forEach(function (a) { a.classList.toggle('talk', on); }); if (CC.music && CC.music.duck) CC.music.duck(on); }
function speak(text) {
  if (!S.voice || !window.speechSynthesis) return;
  const v = bestVoice(), clean = spoken(text); if (!v || !clean) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean); u.voice = v; u.rate = MAC_CHROME ? 0.72 : 0.8; u.pitch = 1.1; u.volume = 1;
    u.onstart = function () { setTalk(true); }; u.onend = function () { setTalk(false); }; u.onerror = function () { setTalk(false); };
    speechSynthesis.speak(u);
  } catch (e) { }
}
function hush() { setTalk(false); if (window.speechSynthesis) try { speechSynthesis.cancel(); } catch (e) { } }
function say(R, text, voiceText) { if (R && R.ui && R.ui.bt) R.ui.bt.textContent = text; speak(voiceText || text); }
function sayStage(R) { say(R, R.cfg.text, R.cfg.voice || R.cfg.text); }

/* ================= screens: home, map ================= */
function setView(v, node) { S.view = v; const r = $root(); r.innerHTML = ''; r.appendChild(node); r.scrollTop = 0; }
function stopRun() { clearTimers(); hush(); if (S.run) { demoCancel(S.run); S.run.phase = 'off'; if (S.run.ro) try { S.run.ro.disconnect(); } catch (e) { } } S.run = null; }
function pips(g) { let h = ''; for (let i = 1; i <= 10; i++) { const b = bestOf(g, i); h += '<i class="' + (b && b.stars ? 'on' : '') + '"></i>'; } return h; }
function showHome() {
  stopRun(); CC.ui.close();
  const h = el('div', 'mc-home');
  h.appendChild(el('div', 'mc-title', '🖱️ Mouse Club'));
  const grid = el('div', 'mc-games');
  GAMES.forEach(function (g) {
    const c = el('button', 'mc-gcard'); c.type = 'button'; c.style.setProperty('--c', g.color); c.setAttribute('aria-label', g.name + ', ' + doneCount(g.id) + ' of 10 stages done');
    c.innerHTML = '<span class="gi"></span><span class="gn"></span><span class="gp"></span>';
    c.querySelector('.gi').textContent = g.icon; c.querySelector('.gn').textContent = g.name; c.querySelector('.gp').innerHTML = pips(g.id);
    c.addEventListener('click', function () { c.blur(); CC.audio.init(); S.game = g.id; showMap(); }); grid.appendChild(c);
  });
  h.appendChild(grid);
  const row = el('div', 'mc-opts');
  const nm = el('input', 'mc-name'); nm.type = 'text'; nm.maxLength = 20; nm.placeholder = '✏️ My name'; nm.value = S.name; nm.setAttribute('aria-label', 'My name');
  nm.addEventListener('input', function () { S.name = nm.value; keepProgress(); });
  const vc = el('button', 'btn ico' + (S.voice ? ' on' : ''), '🗣️'); vc.type = 'button'; vc.title = 'Bo talks'; vc.setAttribute('aria-label', 'Bo voice on or off');
  vc.addEventListener('click', function () { vc.blur(); S.voice = !S.voice; vc.classList.toggle('on', S.voice); if (S.voice) speak('Hello! I am Bo.'); else hush(); });
  const ce = el('button', 'btn ico' + (certEarned() ? ' primary' : ''), certEarned() ? '🎓' : '🔒'); ce.type = 'button'; ce.disabled = !certEarned(); ce.setAttribute('aria-label', 'certificate');
  ce.title = certEarned() ? 'My certificate' : 'Finish stage 10 of a game'; ce.addEventListener('click', function () { ce.blur(); showCertificate(); });
  row.appendChild(nm); row.appendChild(vc); row.appendChild(ce); h.appendChild(row);
  setView('home', h);
}
function showMap() {
  stopRun(); CC.ui.close();
  const g = GAME[S.game], m = el('div', 'mc-map'), top = el('div', 'mc-maptop');
  const back = el('button', 'btn ico', '🏠'); back.type = 'button'; back.setAttribute('aria-label', 'back'); back.addEventListener('click', function () { back.blur(); showHome(); });
  top.appendChild(back); top.appendChild(el('h3', '', g.icon + ' ' + g.name));
  const cb = el('button', 'btn ico' + (certEarned() ? ' primary' : ''), certEarned() ? '🎓' : '🔒'); cb.type = 'button'; cb.disabled = !certEarned(); cb.setAttribute('aria-label', 'certificate'); cb.addEventListener('click', function () { cb.blur(); showCertificate(); });
  top.appendChild(cb); m.appendChild(top);
  const grid = el('div', 'mc-levels');
  g.stages.forEach(function (st, k) {
    const b = bestOf(g.id, k + 1), t = el('button', 'mc-tile' + (b && b.stars ? ' done' : '')); t.type = 'button'; t.style.setProperty('--c', g.color);
    t.innerHTML = '<span class="n"></span><span class="ic"></span><span class="st"></span>';
    t.querySelector('.n').textContent = k + 1; t.querySelector('.ic').textContent = st.icon; t.querySelector('.st').textContent = b ? '⭐'.repeat(b.stars) : '';
    t.setAttribute('aria-label', 'Stage ' + (k + 1) + ', ' + st.title);
    t.addEventListener('click', function () { t.blur(); CC.audio.init(); startStage(g.id, k + 1); }); grid.appendChild(t);
  });
  m.appendChild(grid);
  setView('map', m);
}

/* ================= a stage ================= */
const CURSOR_SVG = '<svg viewBox="0 0 24 30" aria-hidden="true"><path d="M2 2 L2 24 L8 18.5 L12.2 28 L16 26.4 L11.8 17 L20 17 Z" fill="#fff" stroke="#15163a" stroke-width="2" stroke-linejoin="round"/></svg><b class="ring"></b>';
function startStage(game, i) {
  stopRun(); CC.ui.close();
  const G = GAME[game], cfg = G.stages[i - 1];
  const R = { game: game, i: i, G: G, cfg: cfg, misses: 0, done: 0, goal: 1, idle: 0, phase: 'play', locked: false, items: [], ui: {}, hd: {}, demoTok: 0, t: 0, onResize: [], hintT: 0, helps: 0 };
  S.run = R; S.game = game; S.stage = i;
  const p = el('div', 'mc-play'); R.play = p;
  const hud = el('div', 'mc-hud');
  const map = el('button', 'btn ico', '🗺️'); map.type = 'button'; map.setAttribute('aria-label', 'stages'); map.addEventListener('click', function () { map.blur(); showMap(); });
  const chip = el('div', 'mc-chip'); chip.innerHTML = '<b></b> <span></span>'; chip.querySelector('b').textContent = i; chip.querySelector('span').textContent = G.icon + ' ' + cfg.title;
  R.ui.dots = el('div', 'mc-dots'); hud.appendChild(map); hud.appendChild(chip); hud.appendChild(R.ui.dots);
  const sm = el('button', 'btn ico', '🖱️'); sm.type = 'button'; sm.setAttribute('aria-label', 'show me with the mouse'); sm.title = 'Show me'; sm.addEventListener('click', function () { sm.blur(); showMe(R, true); });
  const ag = el('button', 'btn ico', '🔊'); ag.type = 'button'; ag.setAttribute('aria-label', 'say it again'); ag.title = 'Say it again'; ag.addEventListener('click', function () { ag.blur(); sayStage(R); });
  const vb = el('button', 'btn ico' + (S.voice ? '' : ' off'), '🗣️'); vb.type = 'button'; vb.setAttribute('aria-label', 'voice on or off'); vb.title = 'Bo voice';
  vb.addEventListener('click', function () { vb.blur(); S.voice = !S.voice; vb.classList.toggle('off', !S.voice); if (!S.voice) hush(); });
  [sm, ag, vb].forEach(function (b) { hud.appendChild(b); }); p.appendChild(hud);
  R.area = el('div', 'mc-area mc-bg-' + game); p.appendChild(R.area);
  R.ui.bar = el('div', 'mc-bar'); R.ui.bar.appendChild(el('i')); R.ui.bar.hidden = true; R.area.appendChild(R.ui.bar);
  const coach = el('div', 'mc-coach'); coach.innerHTML = '<span class="mc-av">🐻</span><span class="bt"></span>'; R.ui.bt = coach.querySelector('.bt'); R.ui.bt.textContent = cfg.text;
  coach.addEventListener('click', function () { sayStage(R); }); p.appendChild(coach);
  R.ui.cur = el('div', 'mc-cursor'); R.ui.cur.innerHTML = CURSOR_SVG; R.ui.cur.hidden = true;
  R.ui.mouse = el('div', 'mc-mouse'); R.ui.mouse.innerHTML = '<i class="l"></i><i class="r"></i>'; R.ui.mouse.dataset.btn = 'none'; R.ui.mouse.hidden = true;
  p.appendChild(R.ui.mouse); p.appendChild(R.ui.cur);
  setView('play', p);
  measure(R);
  if (window.ResizeObserver) { R.ro = new ResizeObserver(function () { measure(R); R.items.forEach(function (it) { layout(R, it); }); R.onResize.forEach(function (f) { f(); }); }); R.ro.observe(R.area); }
  /* events on the play area */
  R.area.addEventListener('pointermove', function (e) { if (R.locked || !R.hd.move) return; const q = pt(R, e); R.hd.move(q.x, q.y); });
  R.area.addEventListener('wheel', function (e) { R.idle = 0; if (R.hd.wheel) R.hd.wheel(e); }, { passive: false });
  R.area.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  R.area.addEventListener('pointerdown', function () { R.idle = 0; demoCancel(R); }, true);
  R.area.addEventListener('click', function (e) { if (R.locked || e.target !== R.area && !e.target.classList.contains('mc-bgfill')) return; if (R.hd.bgclick) R.hd.bgclick(e); });
  TYPES[cfg.t](R, cfg);
  paintDots(R); guideNow(R);
  /* Bo says the instruction; the pointer shows it the first time this kind of stage appears, and again after a quiet moment */
  later(function () { if (S.run !== R) return; sayStage(R); }, 500);
  if (!S.seen[cfg.t] || i === 1) { S.seen[cfg.t] = true; later(function () { if (S.run === R) showMe(R, false); }, 3400); }
}
function measure(R) { R.W = R.area.clientWidth || 800; R.H = R.area.clientHeight || 400; R.u = Math.min(R.W, R.H * 1.7) / 14; }
function pt(R, e) { const r = R.area.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
function paintDots(R) {
  R.ui.dots.innerHTML = ''; if (R.useBar) { R.ui.dots.hidden = true; return; }
  for (let k = 0; k < R.goal; k++) R.ui.dots.appendChild(el('i', k < R.done ? 'on' : k === R.done ? 'cur' : ''));
}
function setBar(R, f) { R.ui.bar.hidden = false; R.ui.bar.firstChild.style.width = (clamp(f, 0, 1) * 100) + '%'; }

/* ---- things on the stage: an emoji in a round hit area, placed by fractions of the stage so it keeps its place when the window changes ---- */
function newItem(R, emoji, sz, x, y, o) {
  const it = Object.assign({ el: el('div', 'mc-t', emoji), x: x, y: y, sz: sz, e: emoji, alive: true }, o || {});
  R.area.appendChild(it.el); R.items.push(it); layout(R, it); return it;
}
function layout(R, it) {
  const s = it.sz * R.u; it.el.style.width = s + 'px'; it.el.style.height = s + 'px'; it.el.style.fontSize = (s * 0.76) + 'px';
  it.el.style.left = (it.x * R.W) + 'px'; it.el.style.top = (it.y * R.H) + 'px';
}
function placeN(R, n, sz, avoid) {   /* random places that do not overlap; if the stage is crowded the spacing relaxes a little at a time */
  const out = [], mx = (sz * R.u * 0.58) / R.W, my = (sz * R.u * 0.58) / R.H; let dmin = sz * R.u * 1.15, tries = 0;
  function ok(px, py) { return out.every(function (o) { return Math.hypot(o.x * R.W - px, o.y * R.H - py) >= dmin; }) && (!avoid || avoid.every(function (o) { return Math.hypot(o.x * R.W - px, o.y * R.H - py) >= dmin; })); }
  while (out.length < n && tries < 1500) { tries++; if (tries % 150 === 0) dmin *= 0.88; const x = mx + Math.random() * (1 - 2 * mx), y = my + Math.random() * (1 - 2 * my); if (ok(x * R.W, y * R.H)) out.push({ x: x, y: y }); }
  while (out.length < n) out.push({ x: mx + Math.random() * (1 - 2 * mx), y: my + Math.random() * (1 - 2 * my) });
  return out;
}
function hit(R, it, px, py, k) { return Math.hypot(it.x * R.W - px, it.y * R.H - py) <= it.sz * R.u * (k || 0.55); }
function sparkle(R, it) {
  const x = it.x * R.W, y = it.y * R.H;
  for (let k = 0; k < 9; k++) { const s = el('i', 'mc-sp'), a = k / 9 * 6.283, r = 30 + Math.random() * 40; s.style.cssText = 'left:' + x + 'px;top:' + y + 'px;--dx:' + (Math.cos(a) * r).toFixed(0) + 'px;--dy:' + (Math.sin(a) * r - 16).toFixed(0) + 'px;background:' + ['#ffd23f', '#ff8ad8', '#7fd4ff', '#fff', '#6bcb77'][k % 5]; R.area.appendChild(s); later(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 700); }
}
function win(R, it, sfx, keep) {   /* one thing done; keep = leave it on the stage (a chick, an animal, a placed piece) instead of popping it away */
  if (R.locked) return; it.alive = false; sparkle(R, it); (CC.sfx[sfx || 'pickup'] || CC.sfx.pickup)();
  if (keep) { it.el.classList.add('done'); it.el.classList.remove('cur', 'dim', 'lift', 'picked'); void it.el.offsetWidth; it.el.classList.add('bounce'); } else { it.el.classList.add('pop'); later(function () { if (it.el.parentNode) it.el.parentNode.removeChild(it.el); }, 420); }
  R.done++; R.idle = 0; paintDots(R);
  if (R.done >= R.goal) finishStage(R); else if (R.hd.after) R.hd.after(it);
  later(function () { if (S.run === R) guideNow(R); }, 60);
}
function wobble(it) { it.el.classList.remove('wob'); void it.el.offsetWidth; it.el.classList.add('wob'); }
function hint(R, text) {   /* a gentle hint in Bo's bar (never a failure) */
  R.misses++; R.ui.bt.textContent = text; clearTimeout(R.hintT); R.hintT = later(function () { if (S.run === R) R.ui.bt.textContent = R.cfg.text; }, 3200); CC.sfx.step && CC.sfx.step();
}
/* ---- the guide: ONE dotted ring at a time, on the thing to use next (or, while dragging, on the place to drop it) ---- */
function guideNow(R) {
  if (R.phase !== 'play' || R.locked) return;
  const pool = R.finds || R.items, ok = function (i) { const c = i.el.classList; return i.alive && i.el.isConnected && !c.contains('zone') && !c.contains('slot') && !c.contains('zoneitem'); }, live = pool.filter(ok);
  let g = R.dragGuide || null;
  if (!g) g = live.filter(function (i) { return i.el.classList.contains('cur'); })[0] || null;
  if (!g && R.cfg.t === 'pick') g = R.helped ? live.filter(function (i) { return i.isTarget; })[0] || null : null;   /* choosing the right one is the skill, so the ring only appears when a child needs help */
  if (!g && live.length && R.cfg.t !== 'pick') {
    if (live[0].ph != null) g = live.filter(function (i) { return i.y > 0.02; }).sort(function (a, b) { return b.y - a.y; })[0] || null;   /* floating things: the lowest one */
    else if (live[0].k != null && live[0].el.classList.contains('numtile')) g = live.slice().sort(function (a, b) { return a.k - b.k; })[0];   /* number tiles: 1 first */
    else g = live[0];
  }
  if (g === R.guideEl) return; R.guideEl = g;
  R.items.concat(R.zones || [], R.finds || []).forEach(function (i) { i.el.classList.toggle('guide', i === g); });
}
function markCur(R, cur) { R.items.forEach(function (it) { it.el.classList.toggle('cur', it === cur); it.el.classList.toggle('dim', !!cur && it !== cur && it.alive); }); }

/* ---- finishing a stage ---- */
function finishStage(R) {
  if (R.locked) return; R.locked = true; R.phase = 'done'; demoCancel(R); CC.sfx.levelComplete();
  const stars = R.misses <= 2 ? 3 : R.misses <= 6 ? 2 : 1, key = R.game + ':' + R.i, old = S.best[key];
  S.best[key] = { stars: Math.max(old ? old.stars : 0, stars) }; keepProgress();
  R.area.classList.add('party'); speak(rnd(['Well done!', 'Great job!', 'Fantastic!', 'You did it!', 'Super!']));
  const last = R.i >= 10, G = R.G;
  later(function () {
    if (S.run !== R) return;
    const btns = [];
    if (!last) btns.push({ icon: '▶', label: 'Next', primary: true, keys: ['Enter', 'Space'], fn: function () { startStage(R.game, R.i + 1); } });
    else if (certEarned()) btns.push({ icon: '🎓', label: 'Certificate', primary: true, keys: ['Enter'], fn: showCertificate });
    else btns.push({ icon: '🔁', label: 'Again', primary: true, keys: ['Enter'], fn: function () { startStage(R.game, R.i); } });
    btns.push({ icon: '🔁', label: '', fn: function () { startStage(R.game, R.i); } }); btns.push({ icon: '🗺️', label: '', fn: showMap });
    CC.ui.show($stage(), { emoji: G.icon, stars: stars, title: last ? 'You finished ' + G.name + '!' : 'Stage ' + R.i + ' done!', text: last ? 'Great job!' : '', buttons: btns });
  }, 1000);
}

/* ================= the animated pointer: shows exactly what to do ================= */
function demoCancel(R) {
  if (!R) return; R.demoTok++; R.demoing = false;
  if (R.ui.cur) { R.ui.cur.hidden = true; R.ui.cur.classList.remove('down', 'click', 'orange'); }
  if (R.ui.mouse) { R.ui.mouse.hidden = true; R.ui.mouse.dataset.btn = 'none'; }
  if (R.ui.ghost) { if (R.ui.ghost.parentNode) R.ui.ghost.parentNode.removeChild(R.ui.ghost); R.ui.ghost = null; }
  if (R.ui.dmenu) { if (R.ui.dmenu.parentNode) R.ui.dmenu.parentNode.removeChild(R.ui.dmenu); R.ui.dmenu = null; }
  R.items.forEach(function (i) { i.el.classList.remove('demo-dim'); });
}
function showMe(R, withVoice) {
  if (!R || S.run !== R || R.phase !== 'play' || R.demoing || R.locked || !R.hd.demo) return;
  demoCancel(R); const tok = R.demoTok; R.demoing = true; if (withVoice) say(R, R.cfg.text, 'Watch the mouse. ' + (R.cfg.voice || R.cfg.text));
  const play = R.play.getBoundingClientRect(), ar = R.area.getBoundingClientRect(), off = { x: ar.left - play.left, y: ar.top - play.top }, cur = R.ui.cur;
  const alive = function () { return tok === R.demoTok && S.run === R && R.phase === 'play'; };
  const D = {
    off: off, alive: alive,
    at: function (x, y) { R.cx = x + off.x; R.cy = y + off.y; cur.style.left = R.cx + 'px'; cur.style.top = R.cy + 'px'; if (R.ui.ghost) { R.ui.ghost.style.left = (R.cx - R.ghw / 2 + 6) + 'px'; R.ui.ghost.style.top = (R.cy - R.ghh / 2 + 10) + 'px'; } },
    show: function (label) { cur.hidden = false; R.ui.mouse.hidden = false; R.ui.mouse.dataset.btn = label || 'none'; },
    wait: function (ms) { return new Promise(function (res) { setTimeout(function () { res(alive()); }, ms); }); },
    go: function (x, y, ms) {
      const a = { x: R.cx - off.x, y: R.cy - off.y }, t0 = performance.now();
      return new Promise(function (res) {
        (function f(now) {
          if (!alive()) { res(false); return; }
          const u = Math.min(1, (now - t0) / ms), e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; D.at(a.x + (x - a.x) * e, a.y + (y - a.y) * e);
          if (u >= 1) { res(true); return; }
          let fired = false; const tid = setTimeout(function () { if (!fired) { fired = true; f(performance.now()); } }, 90);   // a timer takes over if the browser pauses frames
          requestAnimationFrame(function (t) { if (fired) return; fired = true; clearTimeout(tid); f(t); });
        })(t0);
      });
    },
    press: function (btn) { R.ui.mouse.dataset.btn = btn; cur.classList.remove('click'); void cur.offsetWidth; cur.classList.toggle('orange', btn === 'right'); cur.classList.add('click'); CC.sfx.clink && CC.sfx.clink(); },
    release: function () { R.ui.mouse.dataset.btn = 'none'; cur.classList.remove('click', 'down'); },
    tween: function (ms, fn) {
      const t0 = performance.now();
      return new Promise(function (res) { (function f(now) { if (!alive()) { res(false); return; } const u = Math.min(1, (now - t0) / ms), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; fn(e); if (u >= 1) { res(true); return; }
        let fired = false; const tid = setTimeout(function () { if (!fired) { fired = true; f(performance.now()); } }, 90); requestAnimationFrame(function (t) { if (fired) return; fired = true; clearTimeout(tid); f(t); }); })(t0); });
    },
    pos: function (it) { return { x: it.x * R.W, y: it.y * R.H }; },
    ctr: function (node) { const r = node.getBoundingClientRect(); return { x: r.left + r.width / 2 - ar.left, y: r.top + r.height / 2 - ar.top }; }
  };
  R.hd.demo(D).then(function () { if (tok === R.demoTok) demoCancel(R); }, function () { demoCancel(R); });
}

/* ================= the kinds of stage ================= */
const TYPES = {};
function nextAlive(R) { return R.items.filter(function (i) { return i.alive; })[0]; }

/* ---- MOVE: only moving the mouse onto things (no clicking at all) ---- */
function demoMoveTo(R, pick) {
  return async function (D) {
    const a = pick(); if (!a) return; D.at(R.W * 0.8, R.H * 0.85); D.show('move');
    if (!(await D.wait(300))) return; const p = D.pos(a); await D.go(p.x, p.y, 1300); await D.wait(500);
  };
}
TYPES.collect = function (R, c) {
  R.goal = c.n; placeN(R, c.n, c.sz).forEach(function (p, i) { const it = newItem(R, c.e, c.sz, p.x, p.y, { k: i }); if (c.ordered) it.el.appendChild(el('b', 'mc-num', String(i + 1))); });
  R.next = 0; const upd = function () { if (c.ordered) markCur(R, R.items.filter(function (i) { return i.k === R.next; })[0]); }; upd();
  R.hd.move = function (px, py) { R.items.forEach(function (it) { if (it.alive && (!c.ordered || it.k === R.next) && hit(R, it, px, py)) { if (c.ordered) R.next++; win(R, it); upd(); } }); };
  R.hd.demo = demoMoveTo(R, function () { return c.ordered ? R.items.filter(function (i) { return i.k === R.next; })[0] : nextAlive(R); });
};
TYPES.follow = function (R, c) {
  R.goal = 1; R.useBar = true; R.need = c.need; R.prog = 0; const it = newItem(R, c.e, c.sz, 0.5, 0.5); setBar(R, 0);
  R.hd.move = function (px, py) { R.px = px; R.py = py; };
  R.hd.update = function (dt) {
    if (R.locked) return; R.t += dt; it.x = 0.5 + 0.32 * Math.sin(R.t * c.speed + 0.5); it.y = 0.5 + 0.26 * Math.sin(R.t * c.speed * 1.37); layout(R, it);
    const near = R.px != null && Math.hypot(it.x * R.W - R.px, it.y * R.H - R.py) < it.sz * R.u * 0.95; it.el.classList.toggle('near', near);
    if (near) { R.prog += dt; R.idle = 0; setBar(R, R.prog / R.need); if (R.prog >= R.need) win(R, it, 'levelComplete', true); }
  };
  R.hd.demo = async function (D) { D.at(R.W * 0.85, R.H * 0.85); D.show('move'); if (!(await D.wait(300))) return; for (let k = 0; k < 4; k++) { const p = D.pos(it); if (!(await D.go(p.x, p.y, 700))) return; } };
};
TYPES.path = function (R, c) {
  R.goal = c.n; const pts = [];
  for (let i = 0; i < c.n; i++) { const f = c.n === 1 ? 0 : i / (c.n - 1); pts.push({ x: 0.08 + 0.84 * f, y: clamp(0.5 + c.amp * Math.sin(f * Math.PI * 2.2 + 0.3), 0.14, 0.86) }); }
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('class', 'mc-trail'); R.area.insertBefore(svg, R.area.firstChild);
  const drawTrail = function () { svg.setAttribute('viewBox', '0 0 ' + R.W + ' ' + R.H); svg.innerHTML = '<polyline points="' + pts.map(function (p) { return (p.x * R.W).toFixed(0) + ',' + (p.y * R.H).toFixed(0); }).join(' ') + '" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="' + Math.max(6, c.sz * R.u * 0.5) + '" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2 ' + Math.max(14, c.sz * R.u * 0.55) + '"/>'; };
  drawTrail(); R.onResize.push(drawTrail);
  pts.forEach(function (p, i) { newItem(R, i === c.n - 1 ? c.last : c.e, i === c.n - 1 ? c.sz * 1.25 : c.sz, p.x, p.y, { k: i }); });
  R.next = 0; const upd = function () { markCur(R, R.items.filter(function (i) { return i.k === R.next; })[0]); }; upd();
  R.hd.move = function (px, py) { const it = R.items.filter(function (i) { return i.k === R.next && i.alive; })[0]; if (it && hit(R, it, px, py, 0.62)) { R.next++; win(R, it); upd(); } };
  R.hd.demo = async function (D) { D.at(R.W * 0.04, R.H * 0.9); D.show('move'); if (!(await D.wait(300))) return; for (let k = R.next; k < Math.min(R.next + 3, c.n); k++) { const a = R.items.filter(function (i) { return i.k === k; })[0]; if (!a) break; const p = D.pos(a); if (!(await D.go(p.x, p.y, 900))) return; } };
};
TYPES.drift = function (R, c) {
  R.goal = c.n; R.spawn = 0;
  const spawn = function () { const x = 0.1 + Math.random() * 0.8; newItem(R, c.e, c.sz, x, 1.1, { x0: x, ph: Math.random() * 6, drift: true }); };
  R.hd.update = function (dt) {
    if (R.locked) return; R.t += dt; R.spawn -= dt; const live = R.items.filter(function (i) { return i.alive; });
    if (R.spawn <= 0 && live.length < 4) { spawn(); R.spawn = 1.2; }
    live.forEach(function (it) { it.y -= c.speed * dt; it.x = it.x0 + 0.03 * Math.sin(R.t * 1.2 + it.ph); layout(R, it); if (it.y < -0.12) { it.alive = false; if (it.el.parentNode) it.el.parentNode.removeChild(it.el); } });
    R.items = R.items.filter(function (i) { return i.alive || i.el.parentNode; });
  };
  R.hd.move = function (px, py) { R.items.forEach(function (it) { if (it.alive && hit(R, it, px, py, 0.6)) win(R, it, 'pop'); }); };
  R.hd.demo = async function (D) { D.at(R.W * 0.85, R.H * 0.9); D.show('move'); if (!(await D.wait(500))) return; let a = nextAlive(R); for (let k = 0; k < 12 && !a; k++) { if (!(await D.wait(250))) return; a = nextAlive(R); } if (!a) return; const p = D.pos(a); await D.go(p.x, Math.max(40, p.y - 20), 1300); await D.wait(400); };
};
TYPES.wander = function (R, c) {
  R.goal = c.n; const it = newItem(R, c.e, c.sz, 0.5, 0.5); const dest = function () { it.tx = 0.12 + Math.random() * 0.76; it.ty = 0.15 + Math.random() * 0.7; }; dest();
  R.hd.update = function (dt) {
    if (R.locked || !it.alive) return; const dx = it.tx - it.x, dy = it.ty - it.y, d = Math.hypot(dx, dy); if (d < 0.02) dest(); else { it.x += dx / d * c.speed * dt; it.y += dy / d * c.speed * dt; } layout(R, it);
  };
  R.hd.move = function (px, py) { if (it.alive && hit(R, it, px, py, 0.6)) win(R, it, 'pop'); };
  R.hd.after = function () { later(function () { if (S.run !== R) return; it.alive = true; it.el.classList.remove('pop'); it.x = 0.1 + Math.random() * 0.8; it.y = 0.15 + Math.random() * 0.7; dest(); R.area.appendChild(it.el); layout(R, it); }, 600); };
  R.hd.demo = async function (D) { D.at(R.W * 0.9, R.H * 0.9); D.show('move'); if (!(await D.wait(300))) return; for (let k = 0; k < 3; k++) { const p = D.pos(it); if (!(await D.go(p.x, p.y, 800))) return; } };
};

/* ---- CLICK ---- */
function demoClick(R, btn, pick, times) {
  return async function (D) {
    let a = pick(); D.at(R.W * 0.82, R.H * 0.85); D.show('none'); for (let k = 0; k < 12 && !a; k++) { if (!(await D.wait(250))) return; a = pick(); }   /* floating things may not have appeared yet */
    if (!a || !(await D.wait(300))) return;
    const p = D.pos(a); if (!(await D.go(p.x, p.y, 1100))) return;
    for (let k = 0; k < (times || 1); k++) { D.press(btn); if (!(await D.wait(times > 1 ? 160 : 380))) return; D.release(); if (!(await D.wait(times > 1 ? 120 : 200))) return; }
    await D.wait(400);
  };
}
function clickOn(R, it, fn) { it.el.addEventListener('click', function (e) { e.stopPropagation(); if (R.locked || !it.alive) return; fn(it, e); }); }
function bgHint(R, text) { let n = 0; R.hd.bgclick = function () { n++; if (n % 2 === 1) hint(R, text); }; }
TYPES.tap = function (R, c) {
  R.goal = c.n; let cur = null;
  const spawn = function () { const p = placeN(R, 1, c.sz, cur ? [cur] : null)[0]; cur = newItem(R, c.e, c.sz, p.x, p.y); markCur(R, cur); clickOn(R, cur, function (it) { win(R, it); }); };
  spawn(); R.hd.after = function () { later(function () { if (S.run === R && !R.locked) spawn(); }, 380); }; bgHint(R, 'Click the glowing one.');
  R.hd.demo = demoClick(R, 'left', function () { return cur && cur.alive ? cur : null; });
};
TYPES.many = function (R, c) {
  R.goal = c.n; placeN(R, c.n, c.sz).forEach(function (p) { const it = newItem(R, c.e, c.sz, p.x, p.y); clickOn(R, it, function (x) { win(R, x); }); });
  bgHint(R, 'Click a ' + (c.e === '🎈' ? 'balloon' : 'picture') + '.'); R.hd.demo = demoClick(R, 'left', function () { return nextAlive(R); });
};
const COLOURS = [['🔴', 'red', '#ff5c72'], ['🔵', 'blue', '#4f9bff'], ['🟢', 'green', '#4fbf5f'], ['🟡', 'yellow', '#ffd23f'], ['🟣', 'purple', '#a77bff'], ['🟠', 'orange', '#ff9f45']];
const ANIMALS = [['🐶', 'dog'], ['🐱', 'cat'], ['🐭', 'mouse'], ['🐸', 'frog'], ['🐵', 'monkey'], ['🐰', 'rabbit'], ['🐻', 'bear'], ['🐼', 'panda']];
TYPES.pick = function (R, c) {
  R.goal = c.rounds; const pool = c.kind === 'colour' ? COLOURS : ANIMALS; let target = null;
  const round = function () {
    R.items.forEach(function (i) { if (i.el.parentNode) i.el.parentNode.removeChild(i.el); }); R.items = [];
    const opts = shuffle(pool).slice(0, 3); target = rnd(opts); R.helped = false; const pos = placeN(R, 3, c.sz);
    opts.forEach(function (o, k) { const it = newItem(R, o[0], c.sz, pos[k].x, pos[k].y, { opt: o, isTarget: o === target }); clickOn(R, it, function (x) { if (x.opt === target) win(R, x); else { wobble(x); hint(R, 'That is ' + x.opt[1] + '. Find ' + target[1] + '!'); } }); });
    const msg = 'Click ' + (c.kind === 'colour' ? 'the ' + target[1].toUpperCase() + ' one' : 'the ' + target[1]) + '.'; R.cfg = Object.assign({}, R.cfg, { text: msg, voice: msg }); R.ui.bt.textContent = msg; if (R.done > 0) speak(msg);
  };
  round(); R.hd.after = function () { later(function () { if (S.run === R && !R.locked) round(); }, 450); };
  R.hd.demo = demoClick(R, 'left', function () { return R.items.filter(function (i) { return i.opt === target && i.alive; })[0]; });
};
function floatItems(R, c, onClick, emoji) {   /* things that float up the stage; used by the Click and Double-click games */
  R.spawn = 0; R.t = 0;
  R.hd.update = function (dt) {
    if (R.locked) return; R.t += dt; R.spawn -= dt; const live = R.items.filter(function (i) { return i.alive; });
    if (R.spawn <= 0 && live.length < Math.min(4, R.goal - R.done)) { const x = 0.12 + Math.random() * 0.76, it = newItem(R, emoji, c.sz, x, 1.1, { x0: x, ph: Math.random() * 6 }); onClick(it); R.spawn = 1.8; }
    live.forEach(function (it) { it.y -= c.speed * dt; it.x = it.x0 + 0.03 * Math.sin(R.t * 1.1 + it.ph); layout(R, it); if (it.y < -0.12) { it.y = 1.1; } });
  };
}
TYPES.moving = function (R, c) {
  R.goal = c.n; floatItems(R, c, function (it) { clickOn(R, it, function (x) { win(R, x); }); }, c.e);
  bgHint(R, 'Click a floating ' + (c.e === '🎈' ? 'balloon' : 'star') + '.'); R.hd.demo = demoClick(R, 'left', function () { return nextAlive(R); });
};

/* ---- DOUBLE-CLICK: two quick clicks (a little more forgiving than the computer's own double-click speed) ---- */
function dblOn(R, it, onHatch, c) {
  it.last = 0;
  it.el.addEventListener('click', function (e) {
    e.stopPropagation(); if (R.locked || !it.alive) return; const now = performance.now();
    if (it.last && now - it.last < 750) { it.last = 0; onHatch(it); }
    else { it.last = now; it.el.classList.remove('wob'); void it.el.offsetWidth; it.el.classList.add('wob'); R.idle = 0; R.ui.bt.textContent = 'Click again, fast!'; clearTimeout(R.hintT); R.hintT = later(function () { if (S.run === R) R.ui.bt.textContent = R.cfg.text; }, 2200); }
  });
}
function hatch(R, it) { it.el.textContent = '🐥'; win(R, it, 'good', true); }
TYPES.dbl = function (R, c) {
  R.goal = c.n; const pos = placeN(R, c.n, c.sz); let shown = 0;
  const add = function () { const p = pos[shown++]; const it = newItem(R, c.e, c.sz, p.x, p.y); dblOn(R, it, function (x) { hatch(R, x); }, c); markCur(R, it); };
  if (c.seq) { add(); R.hd.after = function () { later(function () { if (S.run === R && !R.locked && shown < c.n) add(); }, 450); }; } else { for (let k = 0; k < c.n; k++) add(); markCur(R, null); }
  bgHint(R, 'Click twice, fast!'); R.hd.demo = demoClick(R, 'dbl', function () { return nextAlive(R); }, 2);
};
TYPES.dblpick = function (R, c) {
  R.goal = c.rounds; let target = null;
  const round = function () {
    R.items.forEach(function (i) { if (i.el.parentNode) i.el.parentNode.removeChild(i.el); }); R.items = []; const pos = placeN(R, c.options, c.sz), ti = Math.floor(Math.random() * c.options);
    pos.forEach(function (p, k) { const it = newItem(R, '🥚', c.sz, p.x, p.y, { k: k }); if (k === ti) target = it; dblOn(R, it, function (x) { if (x === target) hatch(R, x); else { wobble(x); hint(R, 'Try the glowing egg.'); } }, c); });
    markCur(R, target); R.items.forEach(function (i) { i.el.classList.remove('dim'); });
  };
  round(); R.hd.after = function () { later(function () { if (S.run === R && !R.locked) round(); }, 450); }; R.hd.demo = demoClick(R, 'dbl', function () { return target && target.alive ? target : null; }, 2);
};
TYPES.dblmove = function (R, c) {
  R.goal = c.n; floatItems(R, c, function (it) { dblOn(R, it, function (x) { hatch(R, x); }, c); }, '🥚'); bgHint(R, 'Double-click an egg.'); R.hd.demo = demoClick(R, 'dbl', function () { return nextAlive(R); }, 2);
};

/* ---- RIGHT-CLICK ---- */
function rightOn(R, it, onRight, leftHint) {
  it.el.addEventListener('contextmenu', function (e) { e.preventDefault(); e.stopPropagation(); if (R.locked || !it.alive) return; onRight(it, e); });
  it.el.addEventListener('click', function (e) { e.stopPropagation(); if (R.locked || !it.alive) return; wobble(it); hint(R, leftHint || 'Use the RIGHT button.'); flashBtn(R, 'right'); });
}
function flashBtn(R, btn) { if (!R.ui.mouse) return; R.ui.mouse.hidden = false; R.ui.mouse.dataset.btn = btn; later(function () { if (S.run === R && !R.demoing) { R.ui.mouse.hidden = true; R.ui.mouse.dataset.btn = 'none'; } }, 1800); }
TYPES.rtap = function (R, c) {
  R.goal = c.n; const pos = placeN(R, c.n, c.sz); let shown = 0;
  const add = function () { const p = pos[shown++], it = newItem(R, c.e, c.sz, p.x, p.y); rightOn(R, it, function (x) { x.el.textContent = '🎉'; win(R, x, 'good', true); }); markCur(R, it); };
  if (c.seq) { add(); R.hd.after = function () { later(function () { if (S.run === R && !R.locked && shown < c.n) add(); }, 450); }; } else for (let k = 0; k < c.n; k++) add();
  R.hd.demo = demoClick(R, 'right', function () { return nextAlive(R); });
};
TYPES.hunt = function (R, c) {
  R.goal = c.n; const animals = shuffle(['🐰', '🦊', '🐻', '🐼', '🐸', '🐵']);
  placeN(R, c.n, c.sz).forEach(function (p, i) { const it = newItem(R, '🌳', c.sz, p.x, p.y); it.an = animals[i % animals.length]; rightOn(R, it, function (x) { x.el.textContent = x.an; win(R, x, 'good', true); }, 'Use the RIGHT button.'); });
  R.hd.demo = demoClick(R, 'right', function () { return nextAlive(R); });
};
function closeMenu(R) { if (R.menu) { if (R.menu.parentNode) R.menu.parentNode.removeChild(R.menu); R.menu = null; } }
TYPES.menu = function (R, c) {
  R.goal = c.n; let cur = null;
  const spawn = function () {
    const p = placeN(R, 1, c.sz)[0]; cur = newItem(R, c.e, c.sz, p.x, Math.min(0.6, p.y)); markCur(R, cur);
    rightOn(R, cur, function (it, e) {
      closeMenu(R); const m = el('div', 'mc-menu'), q = pt(R, e);
      c.options.forEach(function (label, k) { const b = el('button', 'mi' + (k === c.correct ? '' : ' dim'), label); b.type = 'button'; b.addEventListener('click', function (ev) { ev.stopPropagation(); if (k === c.correct) { closeMenu(R); it.el.textContent = '🎉'; win(R, it, 'good', true); } else { b.classList.add('wob'); hint(R, 'Click "' + c.options[c.correct].replace(/^\S+\s/, '') + '".'); } }); m.appendChild(b); });
      R.area.appendChild(m); R.menu = m; m.style.left = clamp(q.x, 6, R.W - 170) + 'px'; m.style.top = clamp(q.y, 6, R.H - 40 * c.options.length - 16) + 'px'; R.ui.bt.textContent = 'Now click "' + c.options[c.correct].replace(/^\S+\s/, '') + '".';
    }, 'Use the RIGHT button.');
  };
  spawn(); R.hd.after = function () { closeMenu(R); later(function () { if (S.run === R && !R.locked) spawn(); }, 450); };
  R.hd.bgclick = function () { closeMenu(R); };
  R.hd.demo = async function (D) {
    const a = cur && cur.alive ? cur : null; if (!a) return; D.at(R.W * 0.82, R.H * 0.85); D.show('none'); if (!(await D.wait(300))) return;
    const p = D.pos(a); if (!(await D.go(p.x, p.y, 1100))) return; D.press('right'); if (!(await D.wait(350))) return; D.release();
    const m = el('div', 'mc-menu demo'); c.options.forEach(function (label, k) { m.appendChild(el('div', 'mi' + (k === c.correct ? '' : ' dim'), label)); }); R.area.appendChild(m); R.ui.dmenu = m; m.style.left = clamp(p.x, 6, R.W - 170) + 'px'; m.style.top = clamp(p.y, 6, R.H - 120) + 'px';
    if (!(await D.wait(600))) return; const q = D.ctr(m.children[c.correct]); if (!(await D.go(q.x - 20, q.y, 800))) return; D.press('left'); await D.wait(450);
  };
};
TYPES.lr = function (R, c) {
  R.goal = c.n; let cur = null;
  const spawn = function () {
    const p = placeN(R, 1, c.sz)[0], right = Math.random() < 0.5; cur = newItem(R, right ? '🟠' : '🟢', c.sz, p.x, p.y, { need: right ? 'right' : 'left' }); markCur(R, cur);
    cur.el.appendChild(el('b', 'mc-tag ' + cur.need, cur.need === 'right' ? 'RIGHT' : 'LEFT'));
    const ok = function (x) { x.el.textContent = '✅'; win(R, x, 'good', true); };
    cur.el.addEventListener('click', function (e) { e.stopPropagation(); if (R.locked || !cur.alive) return; if (cur.need === 'left') ok(cur); else { wobble(cur); hint(R, 'Orange = RIGHT button.'); flashBtn(R, 'right'); } });
    cur.el.addEventListener('contextmenu', function (e) { e.preventDefault(); e.stopPropagation(); if (R.locked || !cur.alive) return; if (cur.need === 'right') ok(cur); else { wobble(cur); hint(R, 'Green = LEFT button.'); flashBtn(R, 'left'); } });
  };
  spawn(); R.hd.after = function () { later(function () { if (S.run === R && !R.locked) spawn(); }, 450); };
  R.hd.demo = function (D) { return demoClick(R, cur && cur.need === 'right' ? 'right' : 'left', function () { return cur && cur.alive ? cur : null; })(D); };
};

/* ---- DRAG AND DROP: press, move, let go. A single click on a piece then a click on the place also works. ---- */
const HOMES = [['🐶', '🏠'], ['🐟', '🌊'], ['🐝', '🍯'], ['🐦', '🌳'], ['🐰', '🥕'], ['🐒', '🍌']];
const BINS = [{ n: 'Fruit', e: '🧺', set: ['🍎', '🍌', '🍓', '🍇', '🍊'] }, { n: 'Animals', e: '🐾', set: ['🐶', '🐱', '🐟', '🐸', '🐰'] }, { n: 'Vehicles', e: '🚦', set: ['🚗', '🚲', '🚌', '🚂', '✈️'] }];
function dragSetup(R, c, accepts) {
  R.zones = []; R.picked = null; let drag = null;
  function dropOn(it, px, py) {
    const z = R.zones.filter(function (zz) { return Math.hypot(zz.x * R.W - px, zz.y * R.H - py) <= zz.sz * R.u * 0.62; }).sort(function (a, b) { return Math.hypot(a.x * R.W - px, a.y * R.H - py) - Math.hypot(b.x * R.W - px, b.y * R.H - py); })[0];
    if (!z) return false;
    if (!accepts(it, z)) { wobble(it); hint(R, z.wrong || 'Try another place.'); return false; }
    z.count = (z.count || 0) + 1; const n = z.count - 1; it.x = z.x + (z.stack ? ((n % 3) - 1) * 0.05 : 0); it.y = z.y + (z.stack ? Math.floor(n / 3) * 0.07 + 0.02 : 0); it.sz = z.stack ? it.sz * 0.7 : it.sz; it.el.classList.remove('lift'); layout(R, it); win(R, it, 'good', true); return true;
  }
  R.hd.addPiece = function (it) {
    it.el.classList.add('drag'); it.hx = it.x; it.hy = it.y;
    it.el.addEventListener('pointerdown', function (e) {
      if (R.locked || !it.alive) return; e.preventDefault(); e.stopPropagation(); try { it.el.setPointerCapture(e.pointerId); } catch (x) { }
      drag = { it: it, sx: e.clientX, sy: e.clientY, moved: false }; it.el.classList.add('lift'); R.idle = 0; R.dragGuide = R.zones.filter(function (z) { return accepts(it, z); })[0] || null; guideNow(R);
    });
    it.el.addEventListener('pointermove', function (e) { if (!drag || drag.it !== it) return; if (Math.abs(e.clientX - drag.sx) + Math.abs(e.clientY - drag.sy) > 8) drag.moved = true; const q = pt(R, e); it.x = q.x / R.W; it.y = q.y / R.H; layout(R, it); });
    function end(e, cancel) {
      if (!drag || drag.it !== it) return; const d = drag; drag = null; it.el.classList.remove('lift'); R.dragGuide = null;
      if (cancel || R.locked) { it.x = it.hx; it.y = it.hy; layout(R, it); return; }
      const q = pt(R, e);
      if (!d.moved) { it.x = it.hx; it.y = it.hy; layout(R, it); if (R.picked === it) { R.picked = null; it.el.classList.remove('picked'); R.dragGuide = null; } else { if (R.picked) R.picked.el.classList.remove('picked'); R.picked = it; it.el.classList.add('picked'); R.ui.bt.textContent = 'Now click where it goes.'; R.dragGuide = R.zones.filter(function (z) { return accepts(it, z); })[0] || null; } return; }
      if (!dropOn(it, q.x, q.y)) { it.x = it.hx; it.y = it.hy; it.el.classList.add('back'); layout(R, it); later(function () { it.el.classList.remove('back'); }, 400); }
    }
    it.el.addEventListener('pointerup', function (e) { end(e, false); }); it.el.addEventListener('pointercancel', function (e) { end(e, true); });
  };
  R.hd.addZone = function (z) { z.el.classList.add('zone'); z.el.addEventListener('click', function (e) { e.stopPropagation(); if (R.locked || !R.picked) return; const it = R.picked; R.picked = null; R.dragGuide = null; it.el.classList.remove('picked'); if (!dropOn(it, z.x * R.W, z.y * R.H)) { it.x = it.hx; it.y = it.hy; layout(R, it); } }); R.zones.push(z); };
  R.hd.demo = async function (D) {
    const it = R.items.filter(function (i) { return i.alive && i.el.classList.contains('drag'); })[0]; if (!it) return;
    const z = R.zones.filter(function (zz) { return accepts(it, zz); })[0]; if (!z) return; const from = D.pos(it), to = { x: z.x * R.W, y: z.y * R.H };
    D.at(R.W * 0.5, R.H * 0.9); D.show('none'); if (!(await D.wait(300))) return; if (!(await D.go(from.x, from.y, 1000))) return;
    R.ui.cur.classList.add('down'); R.ui.mouse.dataset.btn = 'hold'; CC.sfx.pickup && CC.sfx.pickup();
    const g = it.el.cloneNode(true); g.className = 'mc-t ghost'; g.style.left = '0'; g.style.top = '0'; R.play.appendChild(g); R.ui.ghost = g; R.ghw = it.sz * R.u; R.ghh = it.sz * R.u; D.at(from.x, from.y);
    it.el.classList.add('demo-dim'); if (!(await D.wait(500))) return; if (!(await D.go(to.x, to.y, 1500))) return; D.release(); R.ui.cur.classList.add('click'); if (!(await D.wait(500))) return; it.el.classList.remove('demo-dim');
  };
}
TYPES.dragone = function (R, c) {
  R.goal = 1; dragSetup(R, c, function () { return true; });
  const z = newItem(R, c.zone, c.sz * 1.15, 0.78, 0.5); z.el.classList.add('zoneitem'); R.hd.addZone(z);
  const it = newItem(R, c.e, c.sz, 0.2, 0.5); R.hd.addPiece(it); it.el.classList.add('cur');
};
TYPES.pairs = function (R, c) {
  R.goal = c.n; const homes = shuffle(HOMES).slice(0, c.n);
  dragSetup(R, c, function (it, z) { return it.k === z.k; });
  const zs = homes.map(function (h, k) { const z = newItem(R, h[1], c.sz, 0.5, 0.26, { k: k }); z.wrong = 'Try another home.'; R.hd.addZone(z); return z; });
  homes.forEach(function (h, k) { R.hd.addPiece(newItem(R, h[0], c.sz, 0.5, 0.8, { k: k })); });
  spreadRow(R, zs, 0.26); spreadBottom(R);
};
function spreadRow(R, list, y) {   /* place things in an even row; they shrink a little if the row is crowded so the dotted rings never touch */
  const n = list.length, span = 0.9, cap = Math.min(span * R.W / n * 0.8, R.H * 0.3) / R.u;
  list.forEach(function (it, k) { it.sz = Math.min(it.sz, cap); it.x = 0.05 + span * (k + 0.5) / n; it.y = y; it.hx = it.x; it.hy = it.y; layout(R, it); });
}
function spreadBottom(R) { spreadRow(R, shuffle(R.items.filter(function (i) { return i.el.classList.contains('drag'); })), 0.8); }
TYPES.sort = function (R, c) {
  R.goal = c.n; const bins = BINS.slice(0, c.bins);
  dragSetup(R, c, function (it, z) { return it.bin === z.bin; });
  const zs = bins.map(function (b, k) { const z = newItem(R, b.e, c.sz * 1.25, 0.5, 0.28, { bin: k }); z.stack = true; z.wrong = 'Try the other basket.'; z.el.appendChild(el('b', 'mc-label', b.n)); R.hd.addZone(z); return z; });
  spreadRow(R, zs, 0.28);
  const list = []; for (let i = 0; i < c.n; i++) { const bi = i % c.bins; list.push({ bin: bi, e: bins[bi].set[Math.floor(i / c.bins) % bins[bi].set.length] }); }
  shuffle(list).forEach(function (o) { const it = newItem(R, o.e, c.sz, 0.5, 0.78, { bin: o.bin }); R.hd.addPiece(it); }); spreadBottom(R);
};
TYPES.order = function (R, c) {   /* the same kind of stage is used by the Click game (click in order) and the Drag game (drag numbers into boxes) */
  if (!c.drag) return TYPES.clickorder(R, c);
  R.goal = c.n; dragSetup(R, c, function (it, z) { return it.k === z.k; });
  const zs = []; for (let k = 0; k < c.n; k++) { const z = newItem(R, '', c.sz, 0.5, 0.26, { k: k }); z.el.classList.add('slot'); z.el.appendChild(el('b', 'mc-slotn', String(k + 1))); z.wrong = 'Try another box.'; R.hd.addZone(z); zs.push(z); }
  for (let k = 0; k < c.n; k++) { const it = newItem(R, String(k + 1), c.sz, 0.5, 0.8, { k: k }); it.el.classList.add('numtile'); R.hd.addPiece(it); } spreadRow(R, zs, 0.26); spreadBottom(R);
};

/* ---- SCROLL: wheel, two fingers, or the little arrow buttons ---- */
function scrollerSetup(R, c, horizontal) {
  const sc = el('div', 'mc-scroller' + (horizontal ? ' horiz' : '')); R.area.appendChild(sc); R.sc = sc;
  const inner = el('div', 'mc-tall'); sc.appendChild(inner); R.inner = inner;
  const size = function () { if (horizontal) { inner.style.width = (R.W * c.pages) + 'px'; inner.style.height = '100%'; } else { inner.style.height = (R.H * c.pages) + 'px'; } };
  size(); R.onResize.push(size);
  const bar = el('div', 'mc-sbtns'); [['▲', -1], ['▼', 1]].forEach(function (b) { const x = el('button', 'btn ico', horizontal ? (b[1] < 0 ? '◀' : '▶') : b[0]); x.type = 'button'; x.setAttribute('aria-label', b[1] < 0 ? 'scroll back' : 'scroll on'); x.title = 'Scroll'; x.addEventListener('click', function (e) { e.stopPropagation(); R.idle = 0; if (horizontal) sc.scrollBy({ left: b[1] * R.W * 0.4, behavior: 'smooth' }); else sc.scrollBy({ top: b[1] * R.H * 0.4, behavior: 'smooth' }); }); bar.appendChild(x); });
  R.area.appendChild(bar);
  if (horizontal) R.hd.wheel = function (e) { e.preventDefault(); sc.scrollLeft += (e.deltaY || 0) + (e.deltaX || 0); };
  else R.hd.wheel = function (e) { e.preventDefault(); sc.scrollTop += e.deltaMode === 1 ? e.deltaY * 40 : e.deltaY; };
  return sc;
}
function atEnd(sc, horizontal) { return horizontal ? sc.scrollLeft + sc.clientWidth >= sc.scrollWidth - 6 : sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 6; }
function demoScroll(R, sc, horizontal, back) {
  return async function (D) {
    D.at(R.W * 0.6, R.H * 0.55); D.show('wheel'); if (!(await D.wait(500))) return;
    const start = horizontal ? sc.scrollLeft : sc.scrollTop, span = (horizontal ? sc.scrollWidth - sc.clientWidth : sc.scrollHeight - sc.clientHeight), to = Math.min(span, start + R.H * 0.9 * (back ? -1 : 1));
    const set = function (v) { if (horizontal) sc.scrollLeft = v; else sc.scrollTop = v; };
    if (!(await D.tween(1600, function (e) { set(start + (to - start) * e); }))) return; await D.wait(500); if (!(await D.tween(1100, function (e) { set(to + (start - to) * e); }))) return; await D.wait(300);
  };
}
function decorate(R, c, pages) {
  const cls = ['☁️', '🌳', '🌷', '🦋', '🌻', '🐞']; for (let k = 0; k < Math.round(pages * 7); k++) { const d = el('span', 'mc-deco', rnd(cls)); d.style.left = (Math.random() * 92) + '%'; d.style.top = (Math.random() * 98) + '%'; d.style.fontSize = (1.6 + Math.random() * 1.6) + 'rem'; R.inner.appendChild(d); }
}
TYPES.reach = function (R, c) {
  R.goal = 1; R.useBar = true; const sc = scrollerSetup(R, c, false); decorate(R, c, c.pages); setBar(R, 0);
  const t = el('div', 'mc-treasure', '🎁'); R.inner.appendChild(t);
  sc.addEventListener('scroll', function () { if (R.locked) return; R.idle = 0; setBar(R, sc.scrollTop / Math.max(1, sc.scrollHeight - sc.clientHeight)); if (atEnd(sc, false)) { t.textContent = '🎉'; win(R, { x: 0.5, y: 0.5, el: t, alive: true }, 'levelComplete', true); } });
  R.hd.demo = demoScroll(R, sc, false);
};
TYPES.updown = function (R, c) {
  R.goal = 2; const sc = scrollerSetup(R, c, false); decorate(R, c, c.pages); let phase = 0;
  const b = el('div', 'mc-treasure', '⭐'); R.inner.appendChild(b); const top = el('div', 'mc-topmark', '🏠'); R.inner.appendChild(top);
  sc.addEventListener('scroll', function () { if (R.locked) return; R.idle = 0;
    if (phase === 0 && atEnd(sc, false)) { phase = 1; R.done = 1; paintDots(R); CC.sfx.pickup(); R.ui.bt.textContent = 'Now scroll back up!'; R.cfg = Object.assign({}, R.cfg, { text: 'Now scroll back up!', voice: 'Now scroll back up to the top!' }); speak('Now scroll back up to the top!'); }
    else if (phase === 1 && sc.scrollTop <= 4) { phase = 2; win(R, { x: 0.5, y: 0.5, el: top, alive: true }, 'levelComplete', true); } });
  R.hd.demo = demoScroll(R, sc, false, phase === 1);
};
TYPES.meter = function (R, c) {
  R.goal = 1; R.useBar = true; R.acc = 0; setBar(R, 0); R.area.classList.add('mc-night');
  const rocket = el('div', 'mc-rocket', '🚀'); R.area.appendChild(rocket); const place = function (f) { rocket.style.bottom = (6 + f * 72) + '%'; }; place(0);
  R.hd.wheel = function (e) { e.preventDefault(); if (R.locked) return; const d = Math.abs(e.deltaY) + Math.abs(e.deltaX); R.acc += e.deltaMode === 1 ? d * 40 : d; R.idle = 0; const f = Math.min(1, R.acc / c.need); setBar(R, f); place(f); rocket.classList.add('shake'); later(function () { rocket.classList.remove('shake'); }, 120); if (f >= 1) { rocket.textContent = '🚀'; win(R, { x: 0.5, y: 0.3, el: rocket, alive: true }, 'levelComplete', true); } };
  const bar = el('div', 'mc-sbtns'); const b = el('button', 'btn', '⛽'); b.type = 'button'; b.title = 'Add fuel'; b.setAttribute('aria-label', 'add fuel'); b.addEventListener('click', function (e) { e.stopPropagation(); R.hd.wheel({ preventDefault: function () { }, deltaY: 120, deltaX: 0, deltaMode: 0 }); }); bar.appendChild(b); R.area.appendChild(bar);
  R.hd.demo = async function (D) { D.at(R.W * 0.6, R.H * 0.55); D.show('wheel'); if (!(await D.wait(500))) return; for (let k = 0; k < 4; k++) { rocket.classList.add('shake'); if (!(await D.wait(350))) return; rocket.classList.remove('shake'); if (!(await D.wait(250))) return; } };
};
TYPES.find = function (R, c) {
  R.goal = c.n; const sc = scrollerSetup(R, c, false); decorate(R, c, c.pages); const an = shuffle(['🐱', '🐰', '🦊', '🐼', '🐸', '🐵']);
  for (let k = 0; k < c.n; k++) {
    const slot = (k + 1) / (c.n + 0.4), it = { x: 0.1 + Math.random() * 0.8, y: 0, sz: 2.8, alive: true, el: el('div', 'mc-t found', an[k % an.length]) };
    R.finds = R.finds || []; R.finds.push(it); it.el.style.fontSize = '3rem'; it.el.style.width = it.el.style.height = '4rem'; it.el.style.left = (it.x * 100) + '%'; it.el.style.top = (slot * 100) + '%'; R.inner.appendChild(it.el);
    it.el.addEventListener('click', function (e) { e.stopPropagation(); if (R.locked || !it.alive) return; it.alive = false; it.el.classList.add('pop'); sparkleAt(R, it.el); CC.sfx.pickup(); R.done++; R.idle = 0; paintDots(R); if (R.done >= R.goal) finishStage(R); });
  }
  R.hd.demo = demoScroll(R, sc, false);
};
function sparkleAt(R, node) { const r = node.getBoundingClientRect(), ar = R.area.getBoundingClientRect(); sparkle(R, { x: (r.left + r.width / 2 - ar.left) / R.W, y: (r.top + r.height / 2 - ar.top) / R.H }); }
TYPES.list = function (R, c) {
  R.goal = c.rounds; const sc = scrollerSetup(R, Object.assign({}, c, { pages: 1 }), false); R.inner.style.height = 'auto'; R.inner.classList.add('mc-list'); let target = null;
  const pool = ['🍎', '🍌', '🍓', '🍇', '🍊', '🐶', '🐱', '🐟', '🚗', '🚲', '🌳', '⭐', '🏠', '🎈'];
  const build = function () {
    R.inner.innerHTML = ''; const rows = shuffle(pool).slice(0, c.rows); target = rnd(rows.slice(Math.floor(c.rows / 2)));
    rows.forEach(function (e) { const r = el('button', 'mc-row', e); r.type = 'button'; r.addEventListener('click', function (ev) { ev.stopPropagation(); if (R.locked) return; if (e === target) { r.classList.add('pop'); sparkleAt(R, r); CC.sfx.pickup(); R.done++; R.idle = 0; paintDots(R); if (R.done >= R.goal) finishStage(R); else later(function () { if (S.run === R && !R.locked) { build(); sc.scrollTop = 0; } }, 450); } else { r.classList.add('wob'); hint(R, 'Keep looking!'); } }); R.inner.appendChild(r); });
    const msg = 'Find ' + target + ' and click it.'; R.ui.bt.textContent = msg; R.cfg = Object.assign({}, R.cfg, { text: msg, voice: 'Scroll down and click the ' + target + '.' }); if (R.done > 0) speak('Find the next picture.');
  };
  build(); R.hd.demo = demoScroll(R, sc, false);
};
TYPES.side = function (R, c) {
  R.goal = 1; R.useBar = true; const sc = scrollerSetup(R, c, true); setBar(R, 0); decorate(R, c, c.pages);
  const t = el('div', 'mc-treasure side', '🏁'); R.inner.appendChild(t);
  sc.addEventListener('scroll', function () { if (R.locked) return; R.idle = 0; setBar(R, sc.scrollLeft / Math.max(1, sc.scrollWidth - sc.clientWidth)); if (atEnd(sc, true)) { t.textContent = '🎉'; win(R, { x: 0.5, y: 0.5, el: t, alive: true }, 'levelComplete'); } });
  R.hd.demo = demoScroll(R, sc, true);
};
/* the Click game's numbered stage lives here so TYPES.order can hand over to it */
TYPES.clickorder = function (R, c) {
  R.goal = c.n; placeN(R, c.n, c.sz).forEach(function (p, i) { const it = newItem(R, c.e, c.sz, p.x, p.y, { k: i }); it.el.appendChild(el('b', 'mc-num big', String(i + 1))); clickOn(R, it, function (x) { if (x.k === R.next) { R.next++; win(R, x); upd(); } else { wobble(x); hint(R, 'Click number ' + (R.next + 1) + ' first.'); } }); });
  R.next = 0; const upd = function () { markCur(R, R.items.filter(function (i) { return i.k === R.next; })[0]); }; upd(); bgHint(R, 'Start with number 1.');
  R.hd.demo = demoClick(R, 'left', function () { return R.items.filter(function (i) { return i.k === R.next; })[0]; });
};

/* ================= the idle helper: after a quiet moment the pointer shows it again ================= */
function update(dt) {
  const R = S.run; if (!R || R.phase !== 'play') return;
  if (R.hd.update) R.hd.update(dt);
  R.gt = (R.gt || 0) - dt; if (R.gt <= 0) { R.gt = 0.2; guideNow(R); }
  R.idle += dt;
  if (R.idle > 11 && !R.demoing && !R.locked && !R.picked && !(R.menu)) { R.idle = 0; R.helps++; R.helped = true; R.items.forEach(function (i) { if (i.alive) { i.el.classList.remove('help'); void i.el.offsetWidth; i.el.classList.add('help'); } }); showMe(R, R.helps % 2 === 1); }
}

/* ================= the certificate ================= */
function certSvg(name) {
  const W = 1123, H = 794, mid = W / 2, n = (name || '').trim(), dt = new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
  const done = GAMES.filter(function (g) { return finalDone(g.id); }), all = done.length === GAMES.length;
  const stars = GAMES.reduce(function (t, g) { for (let i = 1; i <= 10; i++) { const b = bestOf(g.id, i); if (b) t += b.stars; } return t; }, 0);
  const serif = "Georgia,'Palatino Linotype','Book Antiqua',serif", script = "'Segoe Script','Brush Script MT','Apple Chancery','Comic Sans MS',cursive", plum = '#4a1d7a';
  let g = '<defs>' +
    '<linearGradient id="gd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3b0"/><stop offset=".28" stop-color="#f5c542"/><stop offset=".55" stop-color="#b8860b"/><stop offset=".78" stop-color="#f7d46a"/><stop offset="1" stop-color="#d9a21b"/></linearGradient>' +
    '<linearGradient id="gv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe98a"/><stop offset=".5" stop-color="#e5a91a"/><stop offset="1" stop-color="#a8760a"/></linearGradient>' +
    '<radialGradient id="iv" cx=".5" cy=".42" r=".75"><stop offset="0" stop-color="#fffdf5"/><stop offset="1" stop-color="#f7ecd2"/></radialGradient>' +
    '<linearGradient id="pl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7b3fb5"/><stop offset="1" stop-color="#3a1566"/></linearGradient></defs>';
  g += '<rect width="' + W + '" height="' + H + '" fill="url(#iv)"/>';
  /* a golden frame with a plum line inside it, and ornaments in the corners */
  g += '<rect x="24" y="24" width="' + (W - 48) + '" height="' + (H - 48) + '" rx="22" fill="none" stroke="url(#gd)" stroke-width="16"/>';
  g += '<rect x="48" y="48" width="' + (W - 96) + '" height="' + (H - 96) + '" rx="12" fill="none" stroke="' + plum + '" stroke-width="3"/>';
  g += '<rect x="58" y="58" width="' + (W - 116) + '" height="' + (H - 116) + '" rx="8" fill="none" stroke="url(#gd)" stroke-width="2" stroke-dasharray="2 9" stroke-linecap="round"/>';
  [[48, 48], [W - 48, 48], [48, H - 48], [W - 48, H - 48]].forEach(function (c) { g += '<g transform="translate(' + c[0] + ' ' + c[1] + ') rotate(45)"><rect x="-17" y="-17" width="34" height="34" rx="6" fill="url(#gd)" stroke="#8a5a00" stroke-width="2"/><rect x="-8" y="-8" width="16" height="16" rx="3" fill="' + plum + '"/></g>'; });
  g += CC.keycapsSvg(CC.APP_NAME, mid, 70, 29);
  /* the title, in gold */
  const title = all ? 'Mouse Master!' : 'Mouse Club Star!';
  g += '<text x="' + (mid + 3) + '" y="203" font-family="' + serif + '" font-size="90" font-style="italic" font-weight="bold" fill="rgba(74,29,122,.22)" text-anchor="middle">' + title + '</text>';
  g += '<text x="' + mid + '" y="200" font-family="' + serif + '" font-size="90" font-style="italic" font-weight="bold" fill="url(#gv)" stroke="#8a5a00" stroke-width="2.5" paint-order="stroke" stroke-linejoin="round" text-anchor="middle">' + title + '</text>';
  g += '<text x="' + mid + '" y="252" font-family="' + serif + '" font-size="24" font-weight="bold" letter-spacing="7" fill="' + plum + '" text-anchor="middle">CERTIFICATE OF ACHIEVEMENT</text>';
  g += '<text x="' + mid + '" y="298" font-family="' + serif + '" font-size="21" font-style="italic" fill="#6b5a7a" text-anchor="middle">proudly presented to</text>';
  const fsz = n.length <= 14 ? 70 : n.length <= 20 ? 56 : 44;
  g += '<text x="' + mid + '" y="372" font-family="' + script + '" font-size="' + fsz + '" font-weight="bold" fill="' + plum + '" text-anchor="middle">' + esc(n) + '</text>';
  g += '<path d="M250 392 H' + (mid - 14) + ' M' + (mid + 14) + ' 392 H873" stroke="url(#gd)" stroke-width="4" stroke-linecap="round"/><polygon points="' + (mid) + ',382 ' + (mid + 11) + ',392 ' + mid + ',402 ' + (mid - 11) + ',392" fill="url(#gd)" stroke="#8a5a00" stroke-width="1.5"/>';
  g += '<text x="' + mid + '" y="438" font-family="' + serif + '" font-size="21" fill="#4a3a5a" text-anchor="middle">for learning to use the mouse' + (all ? ' really well' : '') + '</text>';
  /* the games finished, as little golden labels */
  let rows = [[]], rw = 0; done.forEach(function (x) { const w = 34 + x.name.length * 10.5; if (rw + w > 820 && rows[rows.length - 1].length) { rows.push([]); rw = 0; } rows[rows.length - 1].push({ n: x.name, w: w }); rw += w + 12; });
  rows.forEach(function (row, ri) { const tot = row.reduce(function (t, c) { return t + c.w + 12; }, -12); let x = mid - tot / 2; row.forEach(function (c) { g += '<rect x="' + x.toFixed(0) + '" y="' + (462 + ri * 44) + '" width="' + c.w.toFixed(0) + '" height="34" rx="17" fill="#fff8e0" stroke="url(#gd)" stroke-width="3"/><text x="' + (x + c.w / 2).toFixed(0) + '" y="' + (485 + ri * 44) + '" font-family="' + serif + '" font-size="17" font-weight="bold" fill="' + plum + '" text-anchor="middle">' + esc(c.n) + '</text>'; x += c.w + 12; }); });
  /* a golden rosette with ribbons, and a friendly mouse in the middle */
  const cy = 626;
  g += '<path d="M' + (mid - 44) + ' ' + (cy + 40) + ' L' + (mid - 70) + ' ' + (cy + 118) + ' L' + (mid - 40) + ' ' + (cy + 100) + ' L' + (mid - 18) + ' ' + (cy + 124) + ' L' + (mid - 6) + ' ' + (cy + 52) + ' Z" fill="url(#pl)" stroke="#2a0f4a" stroke-width="2"/>';
  g += '<path d="M' + (mid + 44) + ' ' + (cy + 40) + ' L' + (mid + 70) + ' ' + (cy + 118) + ' L' + (mid + 40) + ' ' + (cy + 100) + ' L' + (mid + 18) + ' ' + (cy + 124) + ' L' + (mid + 6) + ' ' + (cy + 52) + ' Z" fill="url(#pl)" stroke="#2a0f4a" stroke-width="2"/>';
  let sc = ''; for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; sc += '<circle cx="' + (mid + Math.cos(a) * 66).toFixed(1) + '" cy="' + (cy + Math.sin(a) * 66).toFixed(1) + '" r="13" fill="url(#gd)" stroke="#8a5a00" stroke-width="1.5"/>'; }
  g += sc + '<circle cx="' + mid + '" cy="' + cy + '" r="62" fill="url(#gd)" stroke="#8a5a00" stroke-width="2.5"/><circle cx="' + mid + '" cy="' + cy + '" r="50" fill="url(#pl)" stroke="#fff3b0" stroke-width="3"/>';
  g += '<g transform="translate(' + (mid - 24) + ' ' + (cy - 36) + ') scale(.27)" stroke="#2a0f4a" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"><path d="M90 20 C 150 20 168 70 168 130 C 168 200 130 232 90 232 C 50 232 12 200 12 130 C 12 70 30 20 90 20 Z" fill="#fff8e0"/><path d="M12 112 H168 M90 20 V112" fill="none"/><path d="M90 20 C 62 20 40 40 34 112 H90 Z" fill="#ffd23f"/><path d="M90 20 C 118 20 140 40 146 112 H90 Z" fill="#f5a623"/><rect x="80" y="52" width="20" height="38" rx="10" fill="#b57bff"/></g>';
  /* date, stars and the teacher's line */
  g += '<text x="190" y="722" font-family="' + serif + '" font-size="20" fill="#2a1a3a" text-anchor="middle">' + esc(dt) + '</text><line x1="80" y1="732" x2="300" y2="732" stroke="' + plum + '" stroke-width="1.8"/><text x="190" y="754" font-family="' + serif + '" font-size="15" font-style="italic" fill="#6b5a7a" text-anchor="middle">Date</text>';
  g += '<line x1="823" y1="732" x2="1043" y2="732" stroke="' + plum + '" stroke-width="1.8"/><text x="933" y="754" font-family="' + serif + '" font-size="15" font-style="italic" fill="#6b5a7a" text-anchor="middle">Teacher</text>';
  g += '<polygon points="' + starPts(362, 640, 34, 14) + '" fill="url(#gv)" stroke="#8a5a00" stroke-width="2.5"/><text x="362" y="702" font-family="' + serif + '" font-size="17" font-weight="bold" fill="' + plum + '" text-anchor="middle">' + stars + ' stars</text>';
  g += '<polygon points="' + starPts(760, 640, 34, 14) + '" fill="url(#gv)" stroke="#8a5a00" stroke-width="2.5"/><text x="760" y="702" font-family="' + serif + '" font-size="17" font-weight="bold" fill="' + plum + '" text-anchor="middle">Well done!</text>';
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '">' + g + '</svg>';
}
function starPts(cx, cy, R, r) { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, d = i % 2 ? r : R; p.push((cx + Math.cos(a) * d).toFixed(1) + ',' + (cy + Math.sin(a) * d).toFixed(1)); } return p.join(' '); }
function showCertificate() {
  stopRun(); CC.ui.close();
  const w = el('div', 'mc-certwrap'), top = el('div', 'mc-opts');
  const nm = el('input', 'mc-name'); nm.type = 'text'; nm.maxLength = 28; nm.placeholder = '✏️ Name on the certificate'; nm.value = S.name; nm.setAttribute('aria-label', 'Name on the certificate'); top.appendChild(nm);
  const paper = el('div', 'mc-cert'); paper.innerHTML = certSvg(S.name);
  nm.addEventListener('input', function () { S.name = nm.value; keepProgress(); paper.innerHTML = certSvg(S.name); });
  const row = el('div', 'mc-opts');
  const dl = el('button', 'btn primary', '⬇ Download picture'); dl.type = 'button';
  dl.addEventListener('click', function () {
    dl.blur(); const img = new Image();
    img.onload = function () { const c = document.createElement('canvas'); c.width = 2246; c.height = 1588; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); c.toBlob(function (b) { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'mouse-club-certificate' + (S.name ? '-' + S.name.replace(/[^\w-]+/g, '-') : '') + '.png'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800); }, 'image/png'); };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(certSvg(S.name));
  });
  const pr = el('button', 'btn', '🖨 Print'); pr.type = 'button'; pr.addEventListener('click', function () { pr.blur(); window.print(); });
  const bk = el('button', 'btn', '🏠 Back'); bk.type = 'button'; bk.addEventListener('click', function () { bk.blur(); showHome(); });
  [dl, pr, bk].forEach(function (x) { row.appendChild(x); });
  w.appendChild(top); w.appendChild(paper); w.appendChild(row); w.appendChild(el('p', 'mc-note', 'Tip: print on A4, landscape. Leave the name empty to write it by hand.'));
  setView('cert', w);
}

/* ================= plug into the hub ================= */
CC.modes.mouseclub = {
  makey: false,
  enter: function () { CC.audio.init(); CC.watchStage($stage()); stopRun(); if (!S.loop) S.loop = CC.createLoop(update, function () { }); S.loop.start(); showHome(); },
  exit: function () { stopRun(); hush(); if (S.loop) S.loop.stop(); S.view = 'home'; },
  onKeyDown: function () { },
  /* test hooks (used only by the automated checks) */
  _S: S, _GAMES: GAMES, _start: function (g, i) { startStage(g, i); }, _sim: function (secs) { const n = Math.round(secs * 60); for (let i = 0; i < n; i++) update(1 / 60); }, _cert: showCertificate, _earned: certEarned
};
})();
