/* builder.js - Builder Club (Session 1, Year 1-3).
     Type & Build   - type the word and a piece of the picture appears (a car, a house ... a whole city)
     Click & Build  - build the same pictures with the mouse: click, drag, double-click and right-click
   Very gentle: a wrong key is never a mistake, hints appear by themselves, and the game even helps if a child is stuck.
   Every picture ends with at least one star. Nothing is saved or sent anywhere. */
(function () {
'use strict';
const CC = window.CC, BUILDS = CC.BUILDER.BUILDS;
const $stage = function () { return document.getElementById('stage-builder'); };
const $root = function () { return document.getElementById('bd-root'); };
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

const S = { year: 2, name: '', door: 'type', level: 1, best: {}, run: null, timers: [], loop: null, view: 'home' };
function later(fn, ms) { const id = setTimeout(function () { const i = S.timers.indexOf(id); if (i >= 0) S.timers.splice(i, 1); fn(); }, ms); S.timers.push(id); return id; }
function clearTimers() { S.timers.forEach(clearTimeout); S.timers = []; }
function bestOf(door, lv) { return S.best[door + ':' + lv] || null; }
function doorDone(door) { return BUILDS.every(function (b) { const x = bestOf(door, b.id); return x && x.stars >= 1; }); }
function doneCount(door) { return BUILDS.filter(function (b) { const x = bestOf(door, b.id); return x && x.stars >= 1; }).length; }
function certEarned() { return doorDone('type') || doorDone('click'); }

/* which mouse skill each piece of a level asks for (the first levels are simply "click") */
const KINDS = [['click'], ['click'], ['drag'], ['drag'], ['dbl'], ['right'], ['click', 'drag', 'dbl'], ['drag', 'dbl', 'right'], ['click', 'drag', 'dbl', 'right'], ['click', 'drag', 'dbl', 'right']];
const TIPS = {
  click: '🖱️ Click the glowing piece!',
  drag: '✋ Drag the piece onto its spot!',
  dbl: '🖱️🖱️ Double-click the glowing piece: click twice, fast!',
  right: '👉 Right-click the glowing piece, then press Add!'
};

/* ---------- the small on-screen keyboard (the next letter lights up) ---------- */
let kbEls = {};
function buildKeyboard() {
  kbEls = {}; const kb = el('div', 'bd-kb');
  ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'].forEach(function (row) {
    const r = el('div', 'kr'); row.split('').forEach(function (ch) { const k = el('div', 'bk', ch.toUpperCase()); r.appendChild(k); kbEls[ch] = k; }); kb.appendChild(r);
  });
  return kb;
}
function hlKey(ch) { Object.keys(kbEls).forEach(function (k) { kbEls[k].classList.remove('hl'); }); if (ch && kbEls[ch]) kbEls[ch].classList.add('hl'); }

/* ---------- screens ---------- */
function setView(v, node) { S.view = v; const r = $root(); r.innerHTML = ''; r.appendChild(node); r.scrollTop = 0; }
function stopRun() { clearTimers(); closeMenu(); if (S.run) { S.run.phase = 'off'; if (S.run.float && S.run.float.parentNode) S.run.float.parentNode.removeChild(S.run.float); } S.run = null; }
function showHome() {
  stopRun(); CC.ui.close();
  const h = el('div', 'bd-home');
  h.appendChild(el('div', 'bd-title', '🏗️ Builder Club'));
  h.appendChild(el('p', 'bd-sub', 'Build a car, a house, a rocket ... and a whole city!'));
  const setup = el('div', 'bd-setup'); const yrs = el('div', 'bd-years'); yrs.appendChild(el('span', '', 'I am in Year'));
  [1, 2, 3].forEach(function (y) { const b = el('button', 'btn yr' + (S.year === y ? ' on' : ''), String(y)); b.type = 'button'; b.addEventListener('click', function () { b.blur(); S.year = y; yrs.querySelectorAll('.yr').forEach(function (x, i) { x.classList.toggle('on', i + 1 === y); }); }); yrs.appendChild(b); });
  setup.appendChild(yrs);
  const nm = el('input', 'bd-name'); nm.type = 'text'; nm.maxLength = 20; nm.placeholder = '✏️ My name'; nm.value = S.name; nm.setAttribute('aria-label', 'My name'); nm.addEventListener('input', function () { S.name = nm.value; }); setup.appendChild(nm);
  h.appendChild(setup);
  const doors = el('div', 'bd-doors');
  [{ id: 'type', icon: '⌨️', name: 'Type & Build', desc: 'Type the word to build it', c: '#ff7a45' }, { id: 'click', icon: '🖱️', name: 'Click & Build', desc: 'Click, drag and build', c: '#22b8cf' }].forEach(function (d) {
    const c = el('button', 'bd-door'); c.type = 'button'; c.style.setProperty('--c', d.c);
    c.innerHTML = '<span class="di"></span><span class="dn"></span><span class="dd"></span><span class="dp"></span>';
    c.querySelector('.di').textContent = d.icon; c.querySelector('.dn').textContent = d.name; c.querySelector('.dd').textContent = d.desc; c.querySelector('.dp').textContent = doneCount(d.id) + ' / 10 built';
    c.addEventListener('click', function () { c.blur(); CC.audio.init(); S.door = d.id; showMap(); }); doors.appendChild(c);
  });
  h.appendChild(doors);
  const row = el('div', 'bd-opts');
  const ce = el('button', 'btn' + (certEarned() ? ' primary' : ''), '🎓 My certificate'); ce.type = 'button'; ce.disabled = !certEarned(); ce.title = certEarned() ? 'Print my certificate' : 'Build all 10 pictures in one game to unlock';
  ce.addEventListener('click', function () { ce.blur(); showCertificate(); }); row.appendChild(ce); h.appendChild(row);
  setView('home', h);
}
function showMap() {
  stopRun(); CC.ui.close();
  const m = el('div', 'bd-map'), top = el('div', 'bd-maptop');
  const back = el('button', 'btn ico', '🏠'); back.type = 'button'; back.setAttribute('aria-label', 'back'); back.addEventListener('click', function () { back.blur(); showHome(); });
  top.appendChild(back); top.appendChild(el('h3', '', S.door === 'type' ? '⌨️ Type & Build' : '🖱️ Click & Build')); top.appendChild(el('span', 'bd-spacer')); m.appendChild(top);
  const grid = el('div', 'bd-levels');
  BUILDS.forEach(function (b) {
    const x = bestOf(S.door, b.id), t = el('button', 'bd-tile' + (x && x.stars ? ' done' : '')); t.type = 'button';
    t.innerHTML = '<span class="n"></span><span class="ic"></span><span class="nm"></span><span class="st"></span>';
    t.querySelector('.n').textContent = b.id; t.querySelector('.ic').textContent = b.icon; t.querySelector('.nm').textContent = b.name; t.querySelector('.st').textContent = x ? '⭐'.repeat(x.stars) : '';
    t.setAttribute('aria-label', 'Level ' + b.id + ' ' + b.name);
    t.addEventListener('click', function () { t.blur(); CC.audio.init(); S.level = b.id; intro(); }); grid.appendChild(t);
  });
  m.appendChild(grid); setView('map', m);
}
function intro() {
  const b = BUILDS[S.level - 1];
  CC.sfx.letsGo();
  CC.ui.show($stage(), { emoji: b.icon, title: b.intro, text: S.door === 'type' ? 'Type each word to add a piece.' : 'Use the mouse to add each piece.', buttons: [
    { icon: '▶', label: 'Go!', primary: true, keys: ['Enter', 'Space'], fn: startRun },
    { icon: '🗺️', label: '', fn: showMap }] });
}

/* ---------- a round ---------- */
function svgFor(b) {
  return '<svg class="bd-svg" viewBox="0 0 480 300" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"><g class="bg">' + b.bg + '</g>' +
    b.pieces.map(function (p, i) { return '<g class="pc pend" data-i="' + i + '">' + p.s + '</g>'; }).join('') + '</svg>';
}
function startRun() {
  clearTimers(); CC.ui.close(); closeMenu();
  const b = BUILDS[S.level - 1], R = { door: S.door, lv: S.level, b: b, i: 0, n: b.pieces.length, assists: 0, misses: 0, wrongRun: 0, idle: 0, hint: false, phase: 'play', ui: {} };
  S.run = R;
  const p = el('div', 'bd-play');
  const hud = el('div', 'bd-hud');
  const map = el('button', 'btn ico', '🗺️'); map.type = 'button'; map.setAttribute('aria-label', 'level map'); map.addEventListener('click', function () { map.blur(); showMap(); });
  const chip = el('div', 'bd-chip'); chip.innerHTML = '<b></b> <span></span>'; chip.querySelector('b').textContent = b.id; chip.querySelector('span').textContent = b.icon + ' ' + b.name;
  R.ui.dots = el('div', 'bd-dots'); b.pieces.forEach(function () { R.ui.dots.appendChild(el('i')); });
  hud.appendChild(map); hud.appendChild(chip); hud.appendChild(R.ui.dots);
  if (S.door === 'type') { const hb = el('button', 'btn ico', '💡'); hb.type = 'button'; hb.setAttribute('aria-label', 'show me the key'); hb.title = 'Show me the key'; hb.addEventListener('click', function () { hb.blur(); showHint(R); }); hud.appendChild(hb); }
  p.appendChild(hud);
  const scene = el('div', 'bd-scene'); scene.innerHTML = svgFor(b); p.appendChild(scene); R.svg = scene.firstChild;
  R.ui.bottom = el('div', 'bd-bottom'); p.appendChild(R.ui.bottom); R.play = p;
  setView('play', p);
  R.pcs = Array.prototype.slice.call(R.svg.querySelectorAll('.pc')); R.hits = []; R.bb = [];
  R.pcs.forEach(function (g) { const bb = g.getBBox(), h = document.createElementNS('http://www.w3.org/2000/svg', 'rect'); h.setAttribute('class', 'hit'); h.setAttribute('x', bb.x - 6); h.setAttribute('y', bb.y - 6); h.setAttribute('width', bb.width + 12); h.setAttribute('height', bb.height + 12); h.setAttribute('fill', 'transparent'); g.appendChild(h); R.hits.push(h); R.bb.push(bb); });
  if (S.door === 'type') {
    R.ui.word = el('div', 'bd-word'); R.ui.bottom.appendChild(R.ui.word);
    R.ui.kbwrap = el('div', 'bd-kbwrap'); R.ui.kbwrap.appendChild(buildKeyboard()); R.ui.bottom.appendChild(R.ui.kbwrap); R.ui.kbwrap.classList.toggle('faint', S.year === 3);
  } else {
    R.ui.tip = el('div', 'bd-tip'); R.ui.bottom.appendChild(R.ui.tip); R.ui.tray = el('div', 'bd-tray'); R.ui.bottom.appendChild(R.ui.tray);
    R.svg.addEventListener('click', function (e) { if (R.phase !== 'play' || (e.target.classList && e.target.classList.contains('hit'))) return; R.misses++; pulse(R); });
    R.svg.addEventListener('contextmenu', function (e) { if (S.run === R) e.preventDefault(); });
  }
  setCur(R);
}
function pulse(R) { const g = R.pcs[R.i]; if (!g) return; g.classList.remove('pulse'); void g.getBoundingClientRect(); g.classList.add('pulse'); }
function setCur(R) {
  const g = R.pcs[R.i]; g.classList.add('cur'); R.idle = 0; R.hint = false; R.wrongRun = 0;
  [].forEach.call(R.ui.dots.children, function (d, k) { d.className = k < R.i ? 'on' : k === R.i ? 'cur' : ''; });
  if (R.door === 'type') {
    R.pos = 0; R.word = R.b.pieces[R.i].w; R.ui.word.innerHTML = '';
    R.word.split('').forEach(function (ch) { R.ui.word.appendChild(el('span', 'lt', ch.toUpperCase())); });
    paintWord(R);
  } else { setupTask(R); }
}
function paintWord(R) {
  const ts = R.ui.word.children; for (let k = 0; k < ts.length; k++) ts[k].className = 'lt' + (k < R.pos ? ' ok' : k === R.pos ? ' next' : '');
  const nx = R.word[R.pos]; if (S.year < 3 || R.hint) hlKey(nx); else hlKey(null);
}
function showHint(R) { if (!R || R.phase !== 'play' || R.door !== 'type') return; R.hint = true; R.ui.kbwrap.classList.remove('faint'); hlKey(R.word[R.pos]); }

/* ---- typing door ---- */
function typed(R, ch) {
  if (R.phase !== 'play' || R.door !== 'type') return;
  if (ch === R.word[R.pos]) { R.idle = 0; R.wrongRun = 0; CC.sfx.tick(); advance(R); }
  else { R.wrongRun++; CC.sfx.step(); const t = R.ui.word.children[R.pos]; if (t) { t.classList.remove('shake'); void t.offsetWidth; t.classList.add('shake'); } if (R.wrongRun >= 3) showHint(R); }
}
function advance(R) {
  R.pos++;
  if (R.pos >= R.word.length) { place(R); return; }
  paintWord(R);
}
function assist(R) { R.assists++; R.idle = 8; CC.sfx.clink(); advance(R); }

/* ---- shared: a piece is placed ---- */
function place(R) {
  if (R.phase !== 'play') return; closeMenu();
  const g = R.pcs[R.i]; g.classList.remove('pend', 'cur', 'act', 'pulse'); g.classList.add('on');
  sparkle(R, R.bb[R.i]); CC.sfx.pickup();
  if (R.ui.tray) R.ui.tray.innerHTML = '';
  R.hits[R.i].style.pointerEvents = 'none'; R.picked = false; R.i++; hlKey(null);
  if (R.i >= R.n) { finish(R); return; }
  later(function () { if (S.run === R) setCur(R); }, 380);
}
function sparkle(R, bb) {
  const ns = 'http://www.w3.org/2000/svg', g = document.createElementNS(ns, 'g'); g.setAttribute('class', 'spk'); g.setAttribute('transform', 'translate(' + (bb.x + bb.width / 2) + ',' + (bb.y + bb.height / 2) + ')');
  for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2, p = document.createElementNS(ns, 'polygon'); p.setAttribute('points', '0,-9 3,-3 9,0 3,3 0,9 -3,3 -9,0 -3,-3'); p.setAttribute('fill', ['#ffd23f', '#ff8ad8', '#7fd4ff', '#fff'][k % 4]); p.style.setProperty('--dx', (Math.cos(a) * Math.max(30, bb.width * 0.45)).toFixed(0) + 'px'); p.style.setProperty('--dy', (Math.sin(a) * Math.max(30, bb.height * 0.5)).toFixed(0) + 'px'); g.appendChild(p); }
  R.svg.appendChild(g); later(function () { if (g.parentNode) g.parentNode.removeChild(g); }, 800);
}

/* ---- mouse door ---- */
function setupTask(R) {
  const kind = KINDS[R.lv - 1][R.i % KINDS[R.lv - 1].length], g = R.pcs[R.i], hit = R.hits[R.i]; R.kind = kind; R.picked = false; R.dropMiss = 0; R.ui.tip.textContent = TIPS[kind]; R.ui.tray.innerHTML = '';
  hit.style.pointerEvents = ''; g.classList.add('act'); g.classList.toggle('dragkind', kind === 'drag');
  const fresh = hit.cloneNode(false); hit.parentNode.replaceChild(fresh, hit); R.hits[R.i] = fresh;     // drop old listeners
  if (kind === 'click') fresh.addEventListener('click', function () { place(R); });
  else if (kind === 'dbl') {
    fresh.addEventListener('dblclick', function (e) { e.preventDefault(); place(R); });
    fresh.addEventListener('click', function (e) { if (e.detail === 1) { R.ui.tip.textContent = 'Nearly! Click twice, quickly: click-click!'; pulse(R); later(function () { if (S.run === R && R.kind === 'dbl') R.ui.tip.textContent = TIPS.dbl; }, 2200); } });
  } else if (kind === 'right') {
    fresh.addEventListener('contextmenu', function (e) { e.preventDefault(); e.stopPropagation(); openMenu(R, e.clientX, e.clientY); });
    fresh.addEventListener('click', function () { R.ui.tip.textContent = 'That was the LEFT button. Try the RIGHT button!'; pulse(R); later(function () { if (S.run === R && R.kind === 'right') R.ui.tip.textContent = TIPS.right; }, 2400); });
  } else if (kind === 'drag') {
    fresh.addEventListener('click', function () { if (R.picked) place(R); else { R.ui.tip.textContent = 'Pick up the piece below first!'; R.misses++; } });
    setupDrag(R);
  }
}
function openMenu(R, x, y) {
  closeMenu(); const pr = R.play.getBoundingClientRect(), m = el('div', 'bd-menu');
  const add = el('button', 'mi', '✨ Add'); add.type = 'button'; add.addEventListener('click', function (e) { e.stopPropagation(); place(R); });
  const no = el('button', 'mi dim', '✖ Close'); no.type = 'button'; no.addEventListener('click', function (e) { e.stopPropagation(); closeMenu(); });
  m.appendChild(add); m.appendChild(no); R.play.appendChild(m);
  m.style.left = Math.max(4, Math.min(x - pr.left, pr.width - 150)) + 'px'; m.style.top = Math.max(4, Math.min(y - pr.top, pr.height - 110)) + 'px'; R.menu = m;
  R.ui.tip.textContent = 'A menu opened! Press ✨ Add.';
}
function closeMenu() { const R = S.run; if (R && R.menu) { if (R.menu.parentNode) R.menu.parentNode.removeChild(R.menu); R.menu = null; } }
function setupDrag(R) {
  const bb = R.bb[R.i], idx = R.i, tray = R.ui.tray, sc0 = Math.min(150 / bb.width, 84 / bb.height, 1.2);
  const mini = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); mini.setAttribute('class', 'bd-mini'); mini.setAttribute('viewBox', bb.x + ' ' + bb.y + ' ' + bb.width + ' ' + bb.height);
  mini.setAttribute('width', Math.max(30, bb.width * sc0)); mini.setAttribute('height', Math.max(30, bb.height * sc0)); mini.innerHTML = '<g class="pc on">' + R.b.pieces[idx].s + '</g>';
  tray.appendChild(mini); tray.appendChild(el('span', 'bd-trayhint', '⬆ drag me up to the dotted spot'));
  let st = null;
  function moveFloat(e) { if (!R.float) return; R.float.style.left = (e.clientX - R.float.offsetWidth / 2) + 'px'; R.float.style.top = (e.clientY - R.float.offsetHeight / 2) + 'px'; }
  mini.addEventListener('pointerdown', function (e) {
    if (R.phase !== 'play' || R.i !== idx) return; e.preventDefault(); try { mini.setPointerCapture(e.pointerId); } catch (x) { }
    const sr = R.svg.getBoundingClientRect(), sc = Math.min(sr.width / 480, sr.height / 300), f = el('div', 'bd-float');
    const clone = mini.cloneNode(true); clone.setAttribute('width', bb.width * sc); clone.setAttribute('height', bb.height * sc); f.appendChild(clone); document.body.appendChild(f); R.float = f;
    st = { x: e.clientX, y: e.clientY, moved: false }; mini.classList.add('lifted'); moveFloat(e);
  });
  mini.addEventListener('pointermove', function (e) { if (!st) return; if (Math.abs(e.clientX - st.x) + Math.abs(e.clientY - st.y) > 8) st.moved = true; moveFloat(e); });
  function end(e, cancelled) {
    if (!st) return; const s = st; st = null; mini.classList.remove('lifted'); if (R.float && R.float.parentNode) R.float.parentNode.removeChild(R.float); R.float = null;
    if (cancelled || S.run !== R || R.i !== idx) return;
    if (!s.moved) { R.picked = !R.picked; mini.classList.toggle('picked', R.picked); R.ui.tip.textContent = R.picked ? 'Now click the dotted spot!' : TIPS.drag; return; }
    const h = R.hits[idx].getBoundingClientRect(), mg = 26 + 30 * R.dropMiss;
    if (e.clientX >= h.left - mg && e.clientX <= h.right + mg && e.clientY >= h.top - mg && e.clientY <= h.bottom + mg) place(R);
    else { R.dropMiss++; R.misses++; CC.sfx.step(); R.ui.tip.textContent = 'Almost! Drop it on the dotted spot.'; pulse(R); }
  }
  mini.addEventListener('pointerup', function (e) { end(e, false); });
  mini.addEventListener('pointercancel', function (e) { end(e, true); });
}

/* ---- finishing ---- */
function finish(R) {
  R.phase = 'done'; CC.sfx.levelComplete();
  R.svg.classList.add('party'); R.pcs.forEach(function (g, k) { g.style.animationDelay = (k * 70) + 'ms'; });
  const stars = R.door === 'type' ? (R.assists === 0 ? 3 : R.assists <= 2 ? 2 : 1) : (R.misses <= 3 ? 3 : R.misses <= 8 ? 2 : 1), key = R.door + ':' + R.lv, old = S.best[key];
  S.best[key] = { stars: Math.max(old ? old.stars : 0, stars) };
  const last = R.lv >= BUILDS.length, earned = certEarned();
  later(function () {
    const btns = [];
    if (last && earned) btns.push({ icon: '🎓', label: 'Certificate', primary: true, keys: ['Enter'], fn: showCertificate });
    else if (!last) btns.push({ icon: '▶', label: 'Next', primary: true, keys: ['Enter'], fn: function () { S.level = R.lv + 1; intro(); } });
    else btns.push({ icon: '🔁', label: 'Again', primary: true, keys: ['Enter'], fn: function () { startRun(); } });
    btns.push({ icon: '🔁', label: '', fn: startRun }); btns.push({ icon: '🗺️', label: '', fn: showMap });
    CC.ui.show($stage(), { emoji: R.b.icon, stars: stars, title: 'Your ' + R.b.name.toLowerCase() + ' is ready!', text: last ? 'You built a whole city!' : 'Amazing building!', buttons: btns });
  }, 1500);
}
function update(dt) {
  const R = S.run; if (!R || R.phase !== 'play' || R.door !== 'type') return;
  R.idle += dt; const hintAt = S.year === 3 ? 8 : 5, autoAt = S.year === 1 ? 13 : 18;
  if (R.idle > hintAt && !R.hint) showHint(R);
  if (R.idle > autoAt) assist(R);
}

/* ---------- certificate (all 10 pictures of one game): A4 landscape, teal and sunshine ---------- */
function certSvg(name) {
  const W = 1123, H = 794, n = (name || '').trim(), dt = new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
  const both = doorDone('type') && doorDone('click'), what = both ? 'the keyboard and the mouse' : doorDone('type') ? 'typing words' : 'the mouse';
  const stars = ['type', 'click'].reduce(function (t, d) { return t + BUILDS.reduce(function (u, b) { const x = bestOf(d, b.id); return u + (x ? x.stars : 0); }, 0); }, 0);
  const rnd = "'Comic Sans MS','Chalkboard SE','Trebuchet MS',sans-serif", sans = "'Trebuchet MS','Segoe UI',Arial,sans-serif", mid = W / 2, city = BUILDS[9];
  let g = '<style>.bdc rect,.bdc circle,.bdc ellipse,.bdc polygon,.bdc path{stroke:#3a2f5a;stroke-width:2.5;stroke-linejoin:round;stroke-linecap:round}.bdc .ns{stroke:none}.bdc .bg *{stroke:none}</style>';
  g += '<defs><linearGradient id="bk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9f6ff"/><stop offset="1" stop-color="#fff7de"/></linearGradient><clipPath id="pic"><rect x="' + (mid - 175) + '" y="458" width="350" height="219" rx="18"/></clipPath></defs>';
  g += '<rect width="' + W + '" height="' + H + '" fill="url(#bk)"/>';
  g += '<rect x="20" y="20" width="' + (W - 40) + '" height="' + (H - 40) + '" rx="34" fill="none" stroke="#1fb6a6" stroke-width="14"/><rect x="42" y="42" width="' + (W - 84) + '" height="' + (H - 84) + '" rx="22" fill="none" stroke="#ff9f45" stroke-width="4" stroke-dasharray="3 12" stroke-linecap="round"/>';
  /* confetti */
  [[110, 120, '#ff5c72'], [180, 90, '#ffd23f'], [950, 110, '#a77bff'], [1010, 150, '#ff8ad8'], [90, 340, '#4f9bff'], [1030, 360, '#6bcb77'], [250, 70, '#ff9f45'], [860, 80, '#22c6c6']].forEach(function (c, i) { g += '<rect x="' + c[0] + '" y="' + c[1] + '" width="18" height="18" rx="4" fill="' + c[2] + '" transform="rotate(' + (i * 25) + ' ' + c[0] + ' ' + c[1] + ')"/>'; });
  g += '<text x="' + mid + '" y="150" font-family="' + rnd + '" font-size="82" font-weight="bold" fill="#ff7a45" stroke="#fff" stroke-width="14" paint-order="stroke" stroke-linejoin="round" text-anchor="middle">Super Builder!</text>';
  g += '<text x="' + mid + '" y="200" font-family="' + sans + '" font-size="26" font-weight="bold" letter-spacing="4" fill="#1d8f8f" text-anchor="middle">CERTIFICATE OF ACHIEVEMENT</text>';
  g += '<text x="' + mid + '" y="250" font-family="' + sans + '" font-size="22" fill="#555" text-anchor="middle">proudly presented to</text>';
  const fsz = n.length <= 14 ? 64 : n.length <= 20 ? 52 : 42;
  g += '<text x="' + mid + '" y="324" font-family="' + rnd + '" font-size="' + fsz + '" font-weight="bold" fill="#ff5c72" text-anchor="middle">' + esc(n) + '</text>';
  g += '<line x1="260" y1="342" x2="863" y2="342" stroke="#ffc92e" stroke-width="4" stroke-linecap="round"/>';
  g += '<text x="' + mid + '" y="382" font-family="' + sans + '" font-size="22" fill="#333" text-anchor="middle">for building 10 amazing things with ' + esc(what) + ':</text>';
  g += '<text x="' + mid + '" y="414" font-family="' + sans + '" font-size="19" fill="#1d8f8f" font-weight="bold" text-anchor="middle">a car, a house, a rocket, a farm, a castle, a robot, a boat, a garden, an airport and a whole city!</text>';
  /* the finished city, drawn from the game's own pieces */
  g += '<rect x="' + (mid - 181) + '" y="452" width="362" height="231" rx="22" fill="#fff" stroke="#1fb6a6" stroke-width="5"/>';
  g += '<g clip-path="url(#pic)"><g class="bdc" transform="translate(' + (mid - 175) + ' 458) scale(0.729)">' + '<g class="bg">' + city.bg + '</g>' + city.pieces.map(function (p) { return '<g>' + p.s + '</g>'; }).join('') + '</g></g>';
  [[200, 560], [880, 560]].forEach(function (p, i) { g += '<polygon points="' + starPts(p[0], p[1], 38, 16) + '" fill="#ffd23f" stroke="#e0a800" stroke-width="3"/>'; });
  g += '<text x="200" y="660" font-family="' + sans + '" font-size="18" font-weight="bold" fill="#333" text-anchor="middle">' + stars + ' stars</text><text x="880" y="660" font-family="' + sans + '" font-size="18" font-weight="bold" fill="#333" text-anchor="middle">Well done!</text>';
  g += '<text x="190" y="728" font-family="' + sans + '" font-size="19" fill="#15163a" text-anchor="middle">' + esc(dt) + '</text><line x1="80" y1="736" x2="300" y2="736" stroke="#15163a" stroke-width="1.5"/><text x="190" y="758" font-family="' + sans + '" font-size="14" fill="#555" text-anchor="middle">Date</text>';
  g += '<line x1="823" y1="736" x2="1043" y2="736" stroke="#15163a" stroke-width="1.5"/><text x="933" y="758" font-family="' + sans + '" font-size="14" fill="#555" text-anchor="middle">Teacher, ' + esc(CC.APP_NAME) + '</text>';
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '">' + g + '</svg>';
}
function starPts(cx, cy, R, r) { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, d = i % 2 ? r : R; p.push((cx + Math.cos(a) * d).toFixed(1) + ',' + (cy + Math.sin(a) * d).toFixed(1)); } return p.join(' '); }
function showCertificate() {
  stopRun(); CC.ui.close();
  const w = el('div', 'bd-certwrap'), top = el('div', 'bd-opts');
  const nm = el('input', 'bd-name'); nm.type = 'text'; nm.maxLength = 28; nm.placeholder = '✏️ Name on the certificate'; nm.value = S.name; nm.setAttribute('aria-label', 'Name on the certificate'); top.appendChild(nm);
  const paper = el('div', 'bd-cert'); paper.innerHTML = certSvg(S.name);
  nm.addEventListener('input', function () { S.name = nm.value; paper.innerHTML = certSvg(S.name); });
  const row = el('div', 'bd-opts');
  const dl = el('button', 'btn primary', '⬇ Download picture'); dl.type = 'button';
  dl.addEventListener('click', function () {
    dl.blur(); const img = new Image();
    img.onload = function () {
      const c = document.createElement('canvas'); c.width = 2246; c.height = 1588; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(function (b) { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'builder-certificate' + (S.name ? '-' + S.name.replace(/[^\w-]+/g, '-') : '') + '.png'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800); }, 'image/png');
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(certSvg(S.name));
  });
  const pr = el('button', 'btn', '🖨 Print'); pr.type = 'button'; pr.addEventListener('click', function () { pr.blur(); window.print(); });
  const bk = el('button', 'btn', '🏠 Back'); bk.type = 'button'; bk.addEventListener('click', function () { bk.blur(); showHome(); });
  [dl, pr, bk].forEach(function (x) { row.appendChild(x); });
  w.appendChild(top); w.appendChild(paper); w.appendChild(row); w.appendChild(el('p', 'bd-note', 'Tip: print on A4, landscape. Leave the name empty to write it by hand.'));
  setView('cert', w);
}

/* ---------- plug into the hub ---------- */
CC.modes.builder = {
  makey: false,
  enter: function () { CC.audio.init(); CC.watchStage($stage()); stopRun(); if (!S.loop) S.loop = CC.createLoop(update, function () { }); S.loop.start(); showHome(); },
  exit: function () { stopRun(); if (S.loop) S.loop.stop(); S.view = 'home'; },
  onKeyDown: function (e) {
    const R = S.run; if (S.view !== 'play' || !R || R.door !== 'type') return;
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key.length === 1) { if (e.key !== ' ') e.preventDefault(); if (!e.repeat && /[a-zA-Z]/.test(e.key)) typed(R, e.key.toLowerCase()); }
  },
  /* test hooks */
  _S: S, _start: function (door, lv) { S.door = door; S.level = lv; startRun(); }, _typed: function (ch) { if (S.run) typed(S.run, ch); },
  _sim: function (secs) { const n = Math.round(secs * 60); for (let i = 0; i < n; i++) update(1 / 60); },
  _cert: showCertificate, _earned: certEarned, _place: function () { if (S.run) place(S.run); }
};
})();
