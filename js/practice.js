/* practice.js - Practice: typing for everyone, in the same look as the rest of Tech Explorers. Three tabs: Drills, Speed Test and Word Rain.
   Nothing is saved: no scores, no names, no settings. A result card can be downloaded as a picture.
   Loaded the first time Practice is opened (see main.js), so the games open as fast as before. */
(function () {
'use strict';
const CC = window.CC, Core = CC.practiceCore;
const root = document.getElementById('pr-root');
function el(tag, cls, text, attrs) {
  const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text;
  if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
  return e;
}
function fmt(n) { return String(Math.round(n)); }
function pct(n) { return n >= 99.95 ? '100%' : n.toFixed(1) + '%'; }
function clock(s) { s = Math.round(s); return s < 60 ? s + ' s' : Math.floor(s / 60) + ' min ' + (s % 60 < 10 ? '0' : '') + (s % 60) + ' s'; }
const KEYCOL = ['#ff5c72', '#ff9f45', '#ffd23f', '#6bcb77', '#22c6c6'];            // the five key colours of the site

/* what is chosen on screen (kept only while the page is open) */
const st = {
  tab: 'drills',
  level: 'medium', minutes: 2,
  weak: [], area: null, rainCtl: null, built: false, host: null
};

/* ---------- the result card (a picture to download), in the site's colours ---------- */
function rrect(g, x, y, w, h, r) { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); }
function makeCard(res, meta, name) {
  const W = 1200, H = 630, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  const SANS = '"Trebuchet MS", "Segoe UI", system-ui, Arial, sans-serif';
  g.fillStyle = '#15163a'; g.fillRect(0, 0, W, H);
  g.strokeStyle = '#3a3e8a'; g.lineWidth = 10; rrect(g, 14, 14, W - 28, H - 28, 30); g.stroke();
  g.strokeStyle = '#ffd23f'; g.lineWidth = 2.5; rrect(g, 30, 30, W - 60, H - 60, 20); g.stroke();
  // TECH EXPLORERS in key caps, like the landing page
  const t = 'TECH EXPLORERS'; let x = 64, k = 0; g.textBaseline = 'middle'; g.textAlign = 'center';
  for (let i = 0; i < t.length; i++) {
    if (t[i] === ' ') { x += 18; continue; }
    g.fillStyle = 'rgba(0,0,0,.35)'; rrect(g, x, 62, 34, 34, 8); g.fill(); g.fillStyle = KEYCOL[k % 5]; rrect(g, x, 58, 34, 34, 8); g.fill();
    g.fillStyle = '#fff'; g.font = 'bold 20px ' + SANS; g.fillText(t[i], x + 17, 76); x += 38; k++;
  }
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.fillStyle = '#ffd23f'; g.font = 'bold 40px ' + SANS; g.fillText('Typing Practice', 64, 150);
  g.fillStyle = '#b7b8de'; g.font = '22px ' + SANS; g.fillText(meta.title, 64, 186);
  g.textAlign = 'right'; g.fillText(new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }), W - 64, 76);
  const who = (name || '').trim().slice(0, 30); if (who) { g.fillStyle = '#f5f4ff'; g.font = 'bold 34px ' + SANS; g.fillText(who, W - 64, 120); }
  g.textAlign = 'left';
  g.fillStyle = 'rgba(0,0,0,.4)'; g.font = 'bold 230px ' + SANS; g.fillText(fmt(res.net), 62, 486);
  g.fillStyle = '#ffd23f'; g.fillText(fmt(res.net), 56, 480);
  g.fillStyle = '#b7b8de'; g.font = '30px ' + SANS; g.fillText('words per minute', 64, 536);
  const tiles = [['Accuracy', pct(res.acc), '#22c6c6'], ['Time', clock(res.seconds), '#ff9f45']];
  tiles.forEach(function (tl, i) {
    const bx = 520 + i * 316, by = 300, tw = 300, th = 150;
    g.fillStyle = '#1f2150'; rrect(g, bx, by, tw, th, 24); g.fill(); g.strokeStyle = tl[2]; g.lineWidth = 5; g.stroke();
    g.fillStyle = '#b7b8de'; g.font = '24px ' + SANS; g.fillText(tl[0], bx + 24, by + 48);
    g.fillStyle = tl[2]; g.font = 'bold 52px ' + SANS; g.fillText(tl[1], bx + 24, by + 116);
  });
  return cv;
}
function downloadCard(res, meta, name) {
  const cv = makeCard(res, meta, name), who = (name || '').trim().replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24);
  cv.toBlob(function (b) { if (!b) return; const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'typing-result-' + fmt(res.net) + 'wpm' + (who ? '-' + who : '') + '.png'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800); }, 'image/png');
}

/* ---------- the result screen ---------- */
function showResult(host, res, meta, acts) {
  host.innerHTML = ''; acts = acts || {};
  const box = el('div', 'pr-result'); host.appendChild(box);
  const h = el('h2', 'pr-h2', 'Result', { tabindex: '-1' }); box.appendChild(h);
  box.appendChild(el('p', 'pr-meta', meta.title));
  box.appendChild(el('p', 'pr-sr', 'Result: ' + fmt(res.net) + ' words per minute, ' + pct(res.acc) + ' accuracy.', { role: 'status' }));
  const tiles = el('div', 'pr-tiles'); box.appendChild(tiles);
  function tile(label, value, colour, big) { const t = el('div', 'pr-tile' + (big ? ' big' : '')); t.style.setProperty('--c', colour); t.appendChild(el('div', 'pr-tl', label)); t.appendChild(el('div', 'pr-tv', value)); tiles.appendChild(t); }
  tile('Speed', fmt(res.net) + ' wpm', '#ffd23f', true); tile('Accuracy', pct(res.acc), '#22c6c6'); tile('Time', clock(res.seconds), '#ff9f45');
  if (res.weak && res.weak.length) {
    const wk = el('div', 'pr-weak'); wk.appendChild(el('h3', 'pr-h3', 'Keys to practise'));
    const ul = el('ul', 'pr-weaklist'); res.weak.forEach(function (x) { const li = el('li'); li.appendChild(el('kbd', null, x.key)); li.appendChild(document.createTextNode(x.errors + (x.errors === 1 ? ' mistake' : ' mistakes'))); ul.appendChild(li); });
    wk.appendChild(ul);
    if (acts.weak) { const b = el('button', 'btn', 'Practise these keys', { type: 'button' }); b.addEventListener('click', function () { b.blur(); st.weak = res.weak.map(function (x) { return x.key; }); acts.weak(); }); wk.appendChild(b); }
    box.appendChild(wk);
  }
  const card = el('div', 'pr-cardrow'); const lab = el('label', 'pr-lab', 'Name on the card (optional)'); const inp = el('input', 'pr-input', null, { type: 'text', maxlength: '30', autocomplete: 'off', placeholder: 'Your name' }); lab.appendChild(inp);
  const dl = el('button', 'btn primary', 'Download result card', { type: 'button' }); dl.addEventListener('click', function () { dl.blur(); downloadCard(res, meta, inp.value); });
  card.appendChild(lab); card.appendChild(dl); box.appendChild(card);
  const row = el('div', 'pr-actions');
  if (acts.again) { const b = el('button', 'btn primary', acts.againLabel || 'Try again', { type: 'button' }); b.addEventListener('click', function () { b.blur(); acts.again(); }); row.appendChild(b); }
  if (acts.more) { const b = el('button', 'btn', acts.moreLabel || 'Back', { type: 'button' }); b.addEventListener('click', function () { b.blur(); acts.more(); }); row.appendChild(b); }
  box.appendChild(row);
  h.focus({ preventScroll: false });
}

/* ---------- the typing area (used by the Speed Test and the Drills): the Typing Racer text line, with a yellow block on the next key ---------- */
function makeArea(o) {
  const S = new Core.Session(o.words); if (o.mode === 'time') S.endOnLast = false;
  const wrap = el('div', 'pr-area');
  const live = el('div', 'pr-live'); const tLeft = el('span', 'pr-stat timer'), tWpm = el('span', 'pr-stat'), tAcc = el('span', 'pr-stat'); live.appendChild(tLeft); live.appendChild(tWpm); live.appendChild(tAcc);
  const hint = el('div', 'pr-starthint', o.hint || 'Start typing to begin  \u00b7  Esc to restart');
  const box = el('div', 'pr-textbox'), view = el('div', 'pr-view'), inner = el('div', 'pr-text');
  const cap = el('input', 'pr-capture', null, { type: 'text', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', 'aria-label': 'Typing area. The test starts when you begin typing.' });
  const focusMsg = el('div', 'pr-focusmsg', 'Click here to continue typing');
  view.appendChild(inner); box.appendChild(view); box.appendChild(focusMsg); box.appendChild(cap);
  wrap.appendChild(live); wrap.appendChild(box); wrap.appendChild(hint);
  const els = []; let timer = 0, finished = false;
  function addWord(i) {
    const w = S.words[i], we = { w: el('span', 'w'), chars: [], extras: [], sp: el('span', 'sp', ' ') };
    for (let j = 0; j < w.length; j++) { const c = el('span', 'c', w.charAt(j)); we.w.appendChild(c); we.chars.push(c); }
    els[i] = we; inner.appendChild(we.w); inner.appendChild(we.sp);
  }
  for (let i = 0; i < S.words.length; i++) addWord(i);
  function paint(i) {
    const we = els[i]; if (!we) return; const w = S.words[i], t = i < S.wi ? S.typed[i] : i === S.wi ? S.buf : '', here = i === S.wi && !S.done;
    for (let j = 0; j < w.length; j++) we.chars[j].className = 'c' + (j < t.length ? (t.charAt(j) === w.charAt(j) ? ' ok' : ' bad') : '') + (here && j === t.length ? ' cur' : '');
    while (we.extras.length > Math.max(0, t.length - w.length)) we.w.removeChild(we.extras.pop());
    while (we.extras.length < t.length - w.length) { const x = el('span', 'c bad x', t.charAt(w.length + we.extras.length)); we.w.appendChild(x); we.extras.push(x); }
    we.sp.className = 'sp' + (here && t.length >= w.length ? ' cur' : '');
    we.w.className = 'w' + (i < S.wi && S.typed[i] !== w ? ' wrong' : '');
  }
  function place() {                                    // keep the line you are typing on the second of the three visible lines
    const i = Math.min(S.wi, els.length - 1), we = els[i]; if (!we) return;
    const cur = S.buf.length < we.chars.length ? we.chars[S.buf.length] : we.sp, y = cur.offsetTop, lh = els[0].w.offsetHeight || 40;
    inner.style.transform = 'translateY(' + (-Math.max(0, Math.round(y / lh) - 1) * lh) + 'px)';
  }
  function topUp() { if (o.more && S.words.length - S.wi < 60) { const from = S.words.length, add = o.more(60); S.more(add); for (let i = from; i < S.words.length; i++) addWord(i); } }
  function hud() {
    const now = performance.now(), s = S.stats(now);
    if (o.mode === 'time') { const left = Math.max(0, Math.ceil(o.time - (S.t0 == null ? 0 : s.elapsed))); tLeft.textContent = '⏱ ' + Math.floor(left / 60) + ':' + ('0' + (left % 60)).slice(-2); } else tLeft.textContent = Math.min(S.wi, S.words.length) + ' / ' + S.words.length + ' words';
    tWpm.textContent = S.t0 != null && s.elapsed >= 3 ? '⚡ ' + fmt(s.net) + ' wpm' : ''; tWpm.hidden = !tWpm.textContent;
    tAcc.textContent = S.keys ? '🎯 ' + pct(s.acc) : ''; tAcc.hidden = !tAcc.textContent;
  }
  function end() {
    if (finished) return; finished = true; clearInterval(timer); cap.blur(); wrap.classList.add('done');
    for (let i = 0; i < els.length; i++) paint(i);
    o.onDone(S.result(), S);
  }
  function loop() {
    const now = performance.now();
    if (o.mode === 'time' && S.t0 != null && (now - S.t0) / 1000 >= o.time) { S.finish(S.t0 + o.time * 1000); end(); return; }
    if (S.done) { end(); return; }
    hud();
  }
  cap.addEventListener('keydown', function (e) {
    if (finished || e.isComposing) return;
    if (e.key === 'Escape') { e.preventDefault(); o.onRestart && o.onRestart(); return; }
    if (e.key === 'Tab' || e.key === 'Enter') { if (e.key === 'Enter') e.preventDefault(); return; }
    const altGr = e.altKey && e.getModifierState && e.getModifierState('AltGraph');
    if (e.key === 'Backspace') { e.preventDefault(); const p = S.wi; S.back(e.ctrlKey || e.altKey); paint(p); paint(S.wi); place(); hud(); return; }
    if ((e.ctrlKey || e.metaKey || e.altKey) && !altGr) return;
    if (e.key.length !== 1) return;
    e.preventDefault();
    if (S.t0 == null) { hint.hidden = true; }
    const p = S.wi; if (!S.key(e.key, performance.now())) return;
    paint(p); paint(S.wi); if (S.wi + 1 < els.length) paint(S.wi + 1); topUp(); place(); hud();
    if (S.done) end();
  });
  cap.addEventListener('focus', function () { wrap.classList.remove('blurred'); }); cap.addEventListener('blur', function () { if (!finished) wrap.classList.add('blurred'); });
  box.addEventListener('mousedown', function () { setTimeout(function () { cap.focus(); }, 0); });
  function relayout() { if (!finished) place(); }
  paint(0); hud(); wrap.classList.add('blurred');
  requestAnimationFrame(function () { place(); });
  timer = setInterval(loop, 100);
  return { el: wrap, focus: function () { cap.focus(); place(); }, destroy: function () { finished = true; clearInterval(timer); }, relayout: relayout, session: S };
}

/* ---------- small controls (the site's own pill buttons) ---------- */
function chip(label, on, fn, disabled, key) {
  const b = el('button', 'btn pr-chip' + (on ? ' on' : ''), label, { type: 'button', 'aria-pressed': on ? 'true' : 'false' }); if (disabled) b.disabled = true; if (key) b.dataset.key = key;
  b.addEventListener('click', fn); return b;
}
function group(label, options, get, set, o) {
  o = o || {}; const g = el('div', 'pr-group'); g.appendChild(el('span', 'pr-glabel', label)); const row = el('div', 'pr-chips', null, { role: 'group', 'aria-label': label }); g.appendChild(row);
  options.forEach(function (op) { row.appendChild(chip(op.label, get() === op.value, function () { set(op.value); }, o.disabled, op.key)); });
  return g;
}

function destroyActive() {
  if (st.area) { st.area.destroy(); st.area = null; }
  if (st.rainCtl) { st.rainCtl.stop(); st.rainCtl = null; }
}

/* ---------- the two choices on every tab: the level and the time ---------- */
const LEVELS = [{ id: 'beginner', label: 'Beginner', ic: 'b' }, { id: 'medium', label: 'Medium', ic: 'm' }, { id: 'pro', label: 'Pro', ic: 'p' }];
function levelName() { return LEVELS.filter(function (l) { return l.id === st.level; })[0].label; }
function controls(rebuild) {
  function redo(key) { rebuild(); const again = st.host.querySelector('[data-key="' + key + '"]'); if (again) again.focus(); }   // the panel is rebuilt, so keyboard focus goes back to the choice that was made
  const box = el('div', 'pr-controls'), g = el('div', 'pr-group');
  g.appendChild(el('span', 'pr-glabel', 'Level'));
  const row = el('div', 'group-tabs pr-levels', null, { role: 'group', 'aria-label': 'Level' });
  LEVELS.forEach(function (l) {
    const on = st.level === l.id, b = el('button', 'group-tab' + (on ? ' on' : ''), null, { type: 'button', 'aria-pressed': on ? 'true' : 'false' }), gi = el('span', 'gi'), pic = CC.icons && CC.icons.tab(l.ic);
    if (pic) gi.appendChild(CC.icons.el(pic)); b.appendChild(gi); b.appendChild(el('span', 'gn', l.label));
    b.dataset.key = 'level-' + l.id; b.addEventListener('click', function () { st.level = l.id; redo(b.dataset.key); }); row.appendChild(b);
  });
  g.appendChild(row); box.appendChild(g);
  box.appendChild(group('Time', [1, 2, 3].map(function (m) { return { label: '⏱️ ' + m + ' min', value: m, key: 'time-' + m }; }), function () { return st.minutes; }, function (v) { st.minutes = v; redo('time-' + v); }));
  return box;
}
function runTitle(name) { return name + ' - ' + levelName() + ' - ' + st.minutes + ' min'; }

/* ---------- tab: Speed Test ---------- */
function renderTest(host) {
  destroyActive(); host.innerHTML = '';
  host.appendChild(controls(function () { renderTest(host); }));
  const stage = el('div', 'pr-stage'); host.appendChild(stage);
  function start() {
    if (st.area) st.area.destroy(); st.area = null; stage.innerHTML = '';
    const lv = st.level, area = makeArea({
      words: Core.words(120, lv), mode: 'time', time: st.minutes * 60, more: function (n) { return Core.words(n, lv); }, onRestart: start,
      onDone: function (res) {
        st.weak = res.weak.map(function (x) { return x.key; });
        showResult(stage, res, { title: runTitle('Speed Test') }, { again: start, weak: function () { setTab('drills', 'weak'); } });
      }
    });
    st.area = area; stage.appendChild(area.el); area.focus();
  }
  start();
}

/* ---------- tab: Drills (your weak keys if you have some, otherwise a warm-up) ---------- */
function renderDrills(host, arg) {
  destroyActive(); host.innerHTML = '';
  const ctl = controls(function () { renderDrills(host); }); host.appendChild(ctl);
  const stage = el('div', 'pr-stage'); host.appendChild(stage);
  function go() {
    destroyActive(); stage.innerHTML = ''; ctl.hidden = true;               // the choices step aside while you practise
    const weak = st.weak.length > 0, lv = st.level, name = weak ? 'Your weak keys' : 'Warm-up';
    function make(n) { return weak ? Core.weakWords(st.weak, n, lv) : Core.words(n, lv); }
    const area = makeArea({
      words: make(120), mode: 'time', time: st.minutes * 60, more: make, onRestart: go,
      onDone: function (res) { st.weak = res.weak.map(function (x) { return x.key; }); showResult(stage, res, { title: runTitle(name) }, { again: go, againLabel: 'Practise again', more: function () { renderDrills(host); }, moreLabel: '⚙️ Change level', weak: function () { renderDrills(host, 'weak'); } }); }
    });
    st.area = area; stage.appendChild(area.el); area.focus();
  }
  if (arg === 'weak' && st.weak.length) { go(); return; }
  const card = el('div', 'pr-startcard'); card.appendChild(el('div', 'pr-bigicon', st.weak.length ? '\ud83c\udfaf' : '\ud83d\udd25'));
  card.appendChild(el('h2', 'pr-h2', st.weak.length ? 'Your weak keys' : 'Warm-up'));
  if (st.weak.length) card.appendChild(el('p', 'pr-small', st.weak.slice(0, 5).join('  ')));
  const b = el('button', 'btn primary pr-go', '\u25b6 Start', { type: 'button' }); b.addEventListener('click', function () { b.blur(); go(); }); card.appendChild(b); stage.appendChild(card); b.focus();
}

/* ---------- tab: Word Rain (the same game and look as Year 6) ---------- */
function renderRain(host) {
  destroyActive(); host.innerHTML = '';
  if (!CC.practiceRain) { host.appendChild(el('p', 'pr-lead', 'Word Rain could not be loaded. Please reload the page and try again.')); return; }
  const ctl = controls(function () { renderRain(host); }); host.appendChild(ctl);
  const stage = el('div', 'pr-stage'); host.appendChild(stage);
  function begin() {
    destroyActive(); stage.innerHTML = ''; ctl.hidden = true;
    st.rainCtl = CC.practiceRain.start(stage, { level: st.level, label: levelName(), minutes: st.minutes, sound: true }, {
      el: el, fmt: fmt,
      done: function (res, meta) {
        st.rainCtl = null; st.weak = (res.weak || []).map(function (x) { return x.key; });
        showResult(stage, res, meta, { again: begin, againLabel: '\ud83d\udd01 Play again', more: function () { renderRain(host); }, moreLabel: '⚙️ Change level', weak: function () { setTab('drills', 'weak'); } });
      }
    });
  }
  const card = el('div', 'pr-startcard'); card.appendChild(el('div', 'pr-bigicon', '\ud83c\udf27\ufe0f')); card.appendChild(el('h2', 'pr-h2', 'Word Rain'));
  card.appendChild(el('p', 'pr-small', 'Type the falling words to pop them!'));
  const go = el('button', 'btn primary pr-go', '\u25b6 Go!', { type: 'button' }); go.addEventListener('click', function () { go.blur(); begin(); }); card.appendChild(go); stage.appendChild(card); go.focus();
}

/* ---------- the frame: heading, tabs ---------- */
const TABS = [{ id: 'drills', icon: '🎯', label: 'Drills' }, { id: 'test', icon: '⚡', label: 'Speed Test' }, { id: 'rain', icon: '🌧️', label: 'Word Rain' }];
function setTab(id, arg) { st.tab = id; renderTab(arg); }
function renderTab(arg) {
  destroyActive(); if (!st.host) return;
  root.querySelectorAll('[role=tab]').forEach(function (b) { const on = b.dataset.tab === st.tab; b.setAttribute('aria-selected', on ? 'true' : 'false'); b.classList.toggle('on', on); b.tabIndex = on ? 0 : -1; });
  st.host.setAttribute('aria-labelledby', 'pr-tab-' + st.tab);
  ({ test: renderTest, drills: renderDrills, rain: renderRain })[st.tab](st.host, arg);
}
function build() {
  root.innerHTML = ''; root.className = 'pr';
  root.appendChild(el('h1', 'pr-title', '⌨️ Practice')); root.appendChild(el('p', 'pr-sub', 'Typing for everyone'));
  if ((window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || window.innerWidth < 700) root.appendChild(el('p', 'pr-note', 'Best on a computer with a keyboard.', { role: 'note' }));
  const tabs = el('div', 'group-tabs pr-tabs', null, { role: 'tablist', 'aria-label': 'Practice' });
  TABS.forEach(function (x) {
    const b = el('button', 'group-tab', null, { type: 'button', role: 'tab', id: 'pr-tab-' + x.id, 'aria-controls': 'pr-panel' }); b.dataset.tab = x.id;
    b.appendChild(el('span', 'gi', x.icon)); b.appendChild(el('span', 'gn', x.label));
    b.addEventListener('click', function () { b.blur(); setTab(x.id); });
    b.addEventListener('keydown', function (e) {
      const i = TABS.findIndex(function (y) { return y.id === st.tab; }), to = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? TABS.length - 1 : null;
      if (to === null) return; e.preventDefault(); setTab(TABS[(to + TABS.length) % TABS.length].id); root.querySelector('[role=tab][aria-selected=true]').focus();
    });
    tabs.appendChild(b);
  });
  root.appendChild(tabs);
  st.host = el('div', 'pr-panel', null, { role: 'tabpanel', id: 'pr-panel' }); root.appendChild(st.host);
  window.addEventListener('resize', function () { if (st.area) st.area.relayout(); });
  st.built = true;
}

CC.practice = {
  open: function () { if (!st.built) build(); st.tab = st.tab || 'test'; renderTab(); },
  leave: function () { destroyActive(); },
  _st: st, _makeCard: makeCard
};
})();
