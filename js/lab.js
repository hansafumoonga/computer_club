/* lab.js - shared pieces for the "Computers and apps" games (Parts of a Computer, Network Builder, Type a Letter, Number Grid).
     CC.lab.home()    the level map of a game
     CC.lab.play()    one level: a top bar, the instruction, a "how to do it" box and the game's own area. The level is a list of steps;
                      each step has say (the instruction), tip (how to do it, shown after two slips, a long wait, or the lightbulb) and ok() (true when done).
     CC.lab.say()     reads a line out loud (used for the youngest years)
   Progress is kept with CC.keep (about 3 hours, on this computer only). Nothing is sent anywhere. */
(function () {
'use strict';
const CC = window.CC;
const L = CC.lab = {};
L.el = function (tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
L.esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
L.sfx = function (n) { try { CC.sfx[n] && CC.sfx[n](); } catch (e) { } };
L.tone = function (f, o) { try { CC.audio.tone(f, o || { dur: .15, vol: .12 }); } catch (e) { } };

/* ---------- voice ---------- */
let pick = null;
function voice() {
  if (!window.speechSynthesis) return null;
  const vs = speechSynthesis.getVoices().filter(function (v) { return v.localService && /^en/i.test(v.lang); });
  if (!vs.length) return null; if (pick && vs.indexOf(pick) >= 0) return pick;
  const prefs = [/aria|jenny|natural|neural/i, /zira|samantha|karen|moira|susan|hazel|libby|sonia|serena|tessa|fiona/i, /female/i];
  for (let i = 0; i < prefs.length; i++) { const f = vs.filter(function (v) { return prefs[i].test(v.name); })[0]; if (f) return (pick = f); }
  return (pick = vs[0]);
}
L.voiceOn = true;
L.hush = function () { if (window.speechSynthesis) try { speechSynthesis.cancel(); } catch (e) { } };
L.say = function (text) {
  if (!L.voiceOn || !window.speechSynthesis) return;
  const v = voice(), clean = String(text).replace(/[\u{1F000}-\u{1FFFF}\u{2190}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/gu, ' ').replace(/\s+/g, ' ').trim(); if (!v || !clean) return;
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(clean); u.voice = v; u.rate = 0.82; u.pitch = 1.1; speechSynthesis.speak(u); } catch (e) { }
};

/* ---------- progress ---------- */
L.load = function (id, year) { return CC.keep.load(id + '_y' + year) || { done: {}, stars: {} }; };
L.save = function (id, year, p) { CC.keep.save(id + '_y' + year, p); };

/* ---------- the level map ---------- */
L.home = function (cfg) {   // { root, icon, title, sub, levels: [{ id, title, icon }], prog, onPick }
  L.hush(); CC.ui.close();
  const h = L.el('div', 'lb-home'); h.style.setProperty('--c', cfg.color || '#4d8dff');
  h.innerHTML = '<div class="lb-h1">' + cfg.icon + ' ' + L.esc(cfg.title) + '</div><p class="lb-h2">' + L.esc(cfg.sub || '') + '</p><div class="lb-map"></div>';
  const map = h.querySelector('.lb-map');
  cfg.levels.forEach(function (lv, i) {
    const done = !!cfg.prog.done[lv.id], st = cfg.prog.stars[lv.id] || 0, b = L.el('button', 'lb-card' + (done ? ' done' : ''));
    b.type = 'button'; b.dataset.lv = lv.id;
    b.innerHTML = '<span class="n">' + (i + 1) + '</span><span class="ic">' + lv.icon + '</span><span class="nm">' + L.esc(lv.title) + '</span><span class="st">' + [1, 2, 3].map(function (k) { return '<i class="' + (k <= st ? 'on' : '') + '">★</i>'; }).join('') + '</span>';
    b.addEventListener('click', function () { L.sfx('good'); cfg.onPick(lv); });
    map.appendChild(b);
  });
  if (cfg.cert) { const row = L.el('div', 'lb-certrow'), all = cfg.levels.every(function (lv) { return cfg.prog.done[lv.id]; }), b = L.el('button', 'btn big' + (all ? ' primary' : ''), all ? '🎓 My certificate' : '🔒 Finish every level to win your certificate'); b.type = 'button'; b.disabled = !all; if (all) b.addEventListener('click', function () { b.blur(); cfg.cert(); }); row.appendChild(b); h.appendChild(row); }
  cfg.root.innerHTML = ''; cfg.root.appendChild(h);
};

/* ---------- one level ---------- */
const IDLE_MS = 25000;
L.play = function (cfg) {   // { root, stage, lv: { id, title, steps }, n (level number), speak, build(body, api), onHome, onDone(stars) }
  L.hush(); CC.ui.close();
  const steps = cfg.lv.steps, p = L.el('div', 'lb-play');
  p.innerHTML = '<div class="lb-top"><button type="button" class="btn lb-back" title="Levels" aria-label="levels">🗺️</button><b class="lb-lv"></b><span class="lb-dots"></span>' +
    (cfg.speak ? '<button type="button" class="btn lb-voice" title="Say it again" aria-label="say it again">🔊</button>' : '') +
    '<button type="button" class="btn lb-again" title="Start this level again" aria-label="start this level again">↺</button><button type="button" class="btn lb-tipb" title="How do I do it?" aria-label="how do I do it">💡</button></div>' +
    '<div class="lb-msg"><b class="say"></b><i class="sub"></i></div><div class="lb-help" hidden></div><div class="lb-body"></div>';
  cfg.root.innerHTML = ''; cfg.root.appendChild(p);
  const q = function (s) { return p.querySelector(s); }, msg = q('.lb-msg'), help = q('.lb-help');
  q('.lb-lv').textContent = 'Level ' + cfg.n + ' · ' + cfg.lv.title;
  const st = { i: 0, miss: 0, tips: 0, locked: false, dead: false, idle: 0, flash: 0, timer: 0 };
  const cur = function () { return steps[st.i]; };
  function dots() { q('.lb-dots').innerHTML = steps.map(function (x, k) { return '<i class="' + (k < st.i ? 'd' : k === st.i ? 'c' : '') + '"></i>'; }).join(''); }
  function show() { const s = cur(); if (!s) return; msg.classList.remove('good', 'bad'); msg.querySelector('.say').textContent = s.say; msg.querySelector('.sub').textContent = s.sub || ''; }
  function arm() { clearTimeout(st.idle); st.idle = setTimeout(function () { if (!st.dead && !st.locked && !CC.ui.active && !document.hidden && p.isConnected) tip(true); arm(); }, IDLE_MS); }
  function tip(auto) {
    const s = cur(); if (!s || st.locked) return;
    const lines = [].concat(s.tip || []); if (!lines.length) return;
    if (help.hidden) st.tips++;
    help.innerHTML = '<span class="hl">💡 How to do it</span><ol>' + lines.map(function (x) { return '<li>' + L.esc(x) + '</li>'; }).join('') + '</ol>';
    help.hidden = false; if (cfg.speak) L.say(lines.join(' ')); if (api.onTip) api.onTip(s, !!auto);
  }
  function begin(i) {
    st.i = i; st.miss = 0; st.locked = false; help.hidden = true; dots(); show(); arm();
    const s = cur(); if (s && s.start) s.start(api);
    if (cfg.speak && s) L.say(s.voice || s.say);
    if (api.onStep) api.onStep(s, i);
  }
  function good() {
    const s = cur(); st.locked = true; clearTimeout(st.idle); clearTimeout(st.flash); help.hidden = true; L.sfx('good');
    msg.classList.remove('bad'); msg.classList.add('good'); msg.querySelector('.say').textContent = '✔ ' + (s.win || 'Well done!'); msg.querySelector('.sub').textContent = '';
    if (cfg.speak) L.say(s.win || 'Well done!');
    const d = q('.lb-dots').children[st.i]; if (d) d.className = 'd';
    const last = st.i >= steps.length - 1;
    st.timer = setTimeout(function () {
      if (st.dead) return;
      if (!last) { begin(st.i + 1); return; }
      const stars = st.tips + Math.floor(st.missAll / 3) <= 1 ? 3 : st.tips + Math.floor(st.missAll / 3) <= 4 ? 2 : 1;
      L.sfx('levelComplete'); cfg.onDone(stars);
    }, s.wait || (cfg.speak ? 2200 : 1300));
  }
  st.missAll = 0;
  const api = {
    body: q('.lb-body'), st: st,
    step: cur,
    /* call after anything changes: the step is finished when its ok() says so */
    check: function (ev) { if (st.dead || st.locked) return false; const s = cur(); arm(); let ok = false; try { ok = !!(s && s.ok && s.ok(ev || {}, api)); } catch (e) { ok = false; } if (ok) good(); return ok; },
    /* a slip: a short message, and after two slips the steps appear */
    miss: function (text) {
      if (st.dead || st.locked) return; st.miss++; st.missAll++; L.sfx('softMiss'); arm();
      msg.classList.remove('good'); msg.classList.add('bad'); msg.querySelector('.say').textContent = text || 'Not quite. Try again!'; msg.querySelector('.sub').textContent = '';
      if (cfg.speak) L.say(text || 'Not quite. Try again!');
      clearTimeout(st.flash); st.flash = setTimeout(function () { if (!st.locked && !st.dead) show(); }, 2400);
      if (st.miss >= 2) tip(true);
    },
    note: function (text) { if (st.locked) return; msg.classList.remove('good', 'bad'); msg.querySelector('.sub').textContent = text; },
    tip: tip, touch: arm,
    stop: function () { st.dead = true; clearTimeout(st.idle); clearTimeout(st.flash); clearTimeout(st.timer); L.hush(); }
  };
  q('.lb-back').addEventListener('click', function (e) { e.currentTarget.blur(); api.stop(); cfg.onHome(); });
  q('.lb-again').addEventListener('click', function (e) { e.currentTarget.blur(); if (CC.ui.active) return; api.stop(); L.play(cfg); });
  q('.lb-tipb').addEventListener('click', function (e) { e.currentTarget.blur(); if (help.hidden) tip(false); else help.hidden = true; });
  const vb = q('.lb-voice'); if (vb) vb.addEventListener('click', function () { vb.blur(); const s = cur(); if (s) L.say(s.voice || s.say); });
  p.addEventListener('pointerdown', arm); p.addEventListener('keydown', arm);
  cfg.build(api.body, api);
  begin(0);
  return api;
};

/* ---------- the "level complete" screen ---------- */
L.done = function (cfg) {   // { stage, stars, title, text, emoji, next, again, home, cert }
  const b = [];
  if (cfg.cert) b.push({ icon: '🎓', label: 'My certificate', primary: true, keys: ['Enter'], fn: cfg.cert });
  if (cfg.next) b.push({ icon: '▶', label: 'Next', primary: !cfg.cert, keys: cfg.cert ? [] : ['Enter'], fn: cfg.next }); else b.push({ icon: '🗺️', label: 'Levels', primary: !cfg.cert, keys: cfg.cert ? [] : ['Enter'], fn: cfg.home });
  b.push({ icon: '🔁', label: '', fn: cfg.again }); if (cfg.next) b.push({ icon: '🗺️', label: '', fn: cfg.home });
  CC.ui.show(cfg.stage, { emoji: cfg.emoji || '🏆', stars: cfg.stars, title: cfg.title, text: cfg.text || '', buttons: b });
};

/* ---------- a whole game from a list of levels: the map, playing, stars, the next level ---------- */
L.game = function (g) {   // { id, icon, title, sub, color, stage(), root(), levels(year) -> [{ id, title, icon, steps, build }], speak(year) }
  const S = { year: 1, api: null, prog: null, lv: null };
  function levels() { return g.levels(S.year); }
  function home() { if (S.api) S.api.stop(); S.api = null; S.lv = null; L.home({ root: g.root(), icon: g.icon, title: g.title, sub: typeof g.sub === 'function' ? g.sub(S.year) : g.sub, color: g.color, levels: levels(), prog: S.prog, onPick: start, cert: g.cert ? function () { cert(home); } : null }); }
  /* the certificate: a gold medal on A4 portrait, only when every level for this year is done (CC.rewards draws it: name box, print, save as a picture) */
  function allDone() { return levels().every(function (x) { return S.prog.done[x.id]; }); }
  function cert(back) { if (!allDone() || !CC.rewards) return; CC.rewards.show({ cert: g.id, portrait: true, art: g.cert.art, hue: g.cert.hue, ring: g.title, hero: g.cert.hero, title: g.cert.hero + ' certificate', game: g.title, year: S.year, levels: levels().length }, back); }
  function start(lv) {
    const list = levels(), n = list.findIndex(function (x) { return x.id === lv.id; }) + 1; S.lv = lv;
    if (S.api) S.api.stop();
    S.api = L.play({ root: g.root(), stage: g.stage(), lv: lv, n: n, speak: g.speak ? g.speak(S.year) : false, build: function (body, api) { lv.build(body, api, S.year); }, onHome: home,
      onDone: function (stars) {
        S.prog.done[lv.id] = true; S.prog.stars[lv.id] = Math.max(S.prog.stars[lv.id] || 0, stars); L.save(g.id, S.year, S.prog);
        const next = list[n] || null, all = allDone();
        const again = function () { L.done({ stage: g.stage(), stars: stars, emoji: lv.icon, title: all ? 'You finished ' + g.title + '!' : 'Level ' + n + ' complete!', text: all && g.cert ? 'Every level is done. Your certificate is ready!' : (lv.learned || ''),
          next: next ? function () { start(next); } : null, again: function () { start(lv); }, home: home, cert: all && g.cert ? function () { cert(again); } : null }); };
        again();
      } });
  }
  return {
    makey: false,
    enter: function (o) { CC.audio.init(); CC.watchStage(g.stage()); S.year = (o && o.year) || 1; S.prog = L.load(g.id, S.year); home(); },
    exit: function () { if (S.api) S.api.stop(); S.api = null; L.hush(); CC.ui.close(); g.root().innerHTML = ''; },
    onKeyDown: function () { },
    _S: S, _start: function (i) { start(levels()[i]); }, _home: home, _levels: levels, _cert: cert
  };
};
})();
