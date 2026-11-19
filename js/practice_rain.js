/* practice_rain.js - Word Rain for Practice: the same game and look as Year 6 (balloon words, storm sky, clouds, lightning, thunder, combos).
   The pictures and animations come from the Word Rain classes in css/typing.css. Words are chosen from the Practice word lists. */
(function () {
'use strict';
const CC = window.CC, D = CC.PRACTICE_DATA, Core = CC.practiceCore;
const SPEEDS = [   // seconds for a balloon to cross the screen (at the start and the end), the gap between balloons, and the biggest combo allowed
  { name: 'Very slow', ico: '🐌', fall: [30, 26], gap: [5.0, 4.0], maxCombo: 3 }, { name: 'Slow', ico: '🐢', fall: [23, 19], gap: [3.8, 2.8], maxCombo: 4 },
  { name: 'Medium', ico: '🚶', fall: [17, 13], gap: [3.0, 2.0], maxCombo: 5 }, { name: 'Fast', ico: '🏃', fall: [13, 9.5], gap: [2.3, 1.4], maxCombo: 5 },
  { name: 'Fastest', ico: '⚡', fall: [10, 7], gap: [1.8, 1.0], maxCombo: 5 }];
const BAL = ['#ff5c72', '#ff9f45', '#ffd23f', '#6bcb77', '#22c6c6', '#4f9bff', '#a77bff', '#ff8ad8'];
const COMBO_NAME = ['', '', 'DOUBLE', 'TRIPLE', 'QUAD', 'MEGA x5'];
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function shade(hex, f) {   // f > 0 lightens, f < 0 darkens
  const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(function (v) { return Math.round(f > 0 ? v + (255 - v) * f : v * (1 + f)); });
  return 'rgb(' + c.join(',') + ')';
}
function clockText(secs) { secs = Math.max(0, Math.ceil(secs)); return Math.floor(secs / 60) + ':' + ('0' + (secs % 60)).slice(-2); }

function start(host, cfg, api) {
  const el = api.el, sp = SPEEDS[2], timers = [];   // Medium speed, 2 minutes
  function later(fn, ms) { const id = setTimeout(function () { const i = timers.indexOf(id); if (i >= 0) timers.splice(i, 1); fn(); }, ms); timers.push(id); return id; }
  host.innerHTML = '';
  const play = el('div', 'pr-rainplay'); host.appendChild(play);
  /* the top bar, like the Typing Club one */
  const hud = el('div', 'pr-hud'); play.appendChild(hud);
  const chip = el('div', 'ty-chip'); chip.innerHTML = '<b>🌧️</b> <span>Word Rain</span>'; hud.appendChild(chip);
  const sWpm = el('div', 'ty-stat', '⚡ 0 wpm'), sAcc = el('div', 'ty-stat', '🎯 100%'), sExtra = el('div', 'ty-stat pr-extra'); [sWpm, sAcc, sExtra].forEach(function (x) { hud.appendChild(x); });
  const bPause = el('button', 'btn ico', '⏸', { type: 'button', 'aria-label': 'pause', title: 'Pause (Esc)' }), bSnd = el('button', 'btn ico' + (cfg.sound ? '' : ' off'), '🔊', { type: 'button', 'aria-label': 'sound', title: 'Sound' }), bEnd = el('button', 'btn ico', '🏁', { type: 'button', 'aria-label': 'end the game', title: 'End the game' });
  [bPause, bSnd, bEnd].forEach(function (b) { hud.appendChild(b); });
  /* the sky */
  const f = el('div', 'ty-field rain-sky pr-rainfield'); play.appendChild(f);
  f.appendChild(el('div', 'rain-streaks'));
  const bg = el('div', 'ty-bg'); for (let i = 0; i < 5; i++) { const s = el('span', 'bgi fall', i % 2 ? '☁️' : '💧'); s.style.fontSize = (14 + Math.random() * 22) + 'px'; s.style.animationDuration = (14 + Math.random() * 16) + 's'; s.style.animationDelay = (-Math.random() * 28) + 's'; s.style.left = (Math.random() * 94) + '%'; bg.appendChild(s); } f.appendChild(bg);
  f.appendChild(el('div', 'rain-clouds'));
  const tbar = el('div', 'rain-time'); tbar.appendChild(el('i')); f.appendChild(tbar);
  f.appendChild(el('div', 'rain-water'));
  const banner = el('div', 'rain-banner'); banner.hidden = true; f.appendChild(banner);

  const R = { phase: 'count', t: 0, dur: 120, words: [], caught: 0, bonus: 0, popped: 0, missed: 0, combos: 0, streak: 0, best: 0, target: null, good: 0, errors: 0, err: {}, spawnT: 0.2, comboT: (12 + Math.random() * 5) * clamp(sp.gap[0] / 2, 0.9, 2.2), comboWait: 0, comboN: 0, lastLane: -1, skyT: 6 + Math.random() * 4, lastFlash: -9, series: [], sec: 0, keysPrev: 0, errPrev: 0, snd: null, sndOn: !!cfg.sound, paused: false };
  let raf = 0, last = 0, stopped = false;

  /* ---- sound (optional) ---- */
  function sfx(name, a) { if (R.sndOn && CC.sfx && CC.sfx[name]) { try { CC.sfx[name](a); } catch (e) {} } }
  function sndStart() { if (!R.sndOn || R.snd) return; try { CC.audio.init(); CC.audio.loadSample && CC.audio.loadSample('thunder', 'sounds/thunder.mp3'); R.snd = CC.audio.rainStart ? CC.audio.rainStart() : null; } catch (e) { R.snd = null; } }
  function sndStop() { if (R.snd) { try { R.snd.stop(); } catch (e) {} R.snd = null; } }
  try { CC.audio.init(); CC.audio.loadSample && CC.audio.loadSample('thunder', 'sounds/thunder.mp3'); } catch (e) {}

  /* ---- numbers ---- */
  function keys() { return R.good + R.errors; }
  function chars() { return R.good + R.popped; }                                    // key presses that were right, plus one for each word (its space)
  function wpm() { return R.t > 1 ? chars() / 5 / (R.t / 60) : 0; }
  function acc() { return keys() ? 100 * R.good / keys() : 100; }
  function score() { return R.caught + R.bonus; }
  function refresh() {
    sWpm.textContent = '⚡ ' + api.fmt(wpm()) + ' wpm'; sAcc.textContent = '🎯 ' + api.fmt(acc()) + '%';
    sExtra.textContent = '⏱ ' + clockText(R.dur - R.t) + '  ·  🌧️ ' + score() + (R.streak >= 3 ? '  🔥 ' + R.streak : '');
  }

  /* ---- balloons ---- */
  function lanes() { return clamp(Math.floor((f.clientWidth || 700) / 185), 3, 6); }
  function freeLanes(n) { const out = []; for (let l = 0; l < n; l++) { if (!R.words.some(function (w) { return w.lanes.indexOf(l) >= 0 && w.y < 0; })) out.push(l); } return out; }
  function pickWord(maxLen) {
    const used = {}, act = {}; R.words.forEach(function (w) { used[w.text[0]] = 1; act[w.text] = 1; });
    const all = Core.shuffle(D.EVERYDAY).filter(function (w) { return !used[w[0]] && !act[w]; });
    const fit = all.filter(function (w) { return w.length <= Math.min(7, maxLen + 2); });
    return fit[0] || all.sort(function (a, b) { return a.length - b.length; })[0] || null;
  }
  function makeDrop(text, color, n) {
    const d = el('div', 'ty-drop' + (n > 1 ? ' combo' : '')), sw = el('div', 'sw'), bb = el('div', 'bb');
    d.style.setProperty('--c', color); d.style.setProperty('--l', shade(color, 0.55)); d.style.setProperty('--d', shade(color, -0.32)); d.col = color;
    text.split('').forEach(function (ch) { bb.appendChild(el('span', 'c', ch)); });
    if (n > 1) bb.appendChild(el('span', 'xn', 'x' + n));
    sw.appendChild(bb); sw.insertAdjacentHTML('beforeend', '<svg class="bs" viewBox="0 0 16 50" aria-hidden="true"><path d="M8 0 C 1 11, 15 20, 8 31 S 3 44, 9 50" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="1.7" stroke-linecap="round"/></svg>');
    d.appendChild(sw); d.bb = bb; return d;
  }
  function spawn(n) {   // n = how many copies fall together (1 for a single balloon, 2 to 5 for a combo)
    const ln = lanes(), free = freeLanes(ln), p = R.t / R.dur;
    if (free.length < n) return false;
    const text = pickWord(n > 1 ? 5 : p < 0.3 ? 4 : p < 0.65 ? 5 : 7); if (!text) return false;
    let chosen; if (n > 1) chosen = Core.shuffle(free).slice(0, n); else { const opts = free.filter(function (l) { return Math.abs(l - R.lastLane) > 1; }); chosen = [Core.pick(opts.length ? opts : free)]; R.lastLane = chosen[0]; }
    const col = Core.pick(BAL), W = f.clientWidth || 700, e = { text: text, i: 0, y: -130, lanes: chosen, n: chosen.length, els: [] };
    chosen.forEach(function (l) { const d = makeDrop(text, col, n); d.style.left = ((l + 0.5) * W / ln) + 'px'; d.style.top = '-130px'; f.appendChild(d); e.els.push(d); });
    R.words.push(e); return true;
  }
  function comboSize(ln) {
    const p = R.t / R.dur, r = Math.random(); let n;
    if (p < 0.3) n = r < 0.75 ? 2 : 3; else if (p < 0.65) n = r < 0.3 ? 2 : r < 0.75 ? 3 : 4; else n = r < 0.3 ? 3 : r < 0.7 ? 4 : 5;
    return Math.min(n, ln, sp.maxCombo);
  }
  function setTarget(e) { if (R.target) R.target.els.forEach(function (d) { d.classList.remove('locked'); }); R.target = e; if (e) e.els.forEach(function (d) { d.classList.add('locked'); }); }
  function paint(e) { e.els.forEach(function (d) { const cs = d.bb.children; for (let k = 0; k < cs.length; k++) cs[k].className = 'c' + (k < e.i ? ' ok' : ''); }); }

  /* ---- effects ---- */
  function say(text) { banner.textContent = text; banner.hidden = false; banner.classList.remove('pop'); void banner.offsetWidth; banner.classList.add('pop'); later(function () { banner.hidden = true; }, 1700); }
  function floatText(x, y, text) { const s = el('div', 'rain-plus', text); s.style.left = x + 'px'; s.style.top = y + 'px'; f.appendChild(s); later(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 950); }
  function flash(soft) {
    if (R.t - R.lastFlash < 0.5) return; R.lastFlash = R.t;
    const s = el('div', 'rain-flash' + (soft ? ' soft' : '')); f.appendChild(s); later(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 320);
  }
  function bolt(x, y) {   // a jagged bolt from the clouds down to the balloon, with one small fork
    const W = f.clientWidth || 700, H = f.clientHeight || 340, pts = [[x + (Math.random() - 0.5) * 170, 0]], n = 7;
    for (let i = 1; i < n; i++) { const k = i / n; pts.push([pts[0][0] + (x - pts[0][0]) * k + (Math.random() - 0.5) * 64, y * k + (Math.random() - 0.5) * 12]); }
    pts.push([x, y]);
    const path = function (a) { return 'M' + a.map(function (p) { return Math.round(p[0]) + ' ' + Math.round(p[1]); }).join(' L'); }, m = pts[3], dir = Math.random() < 0.5 ? -1 : 1;
    const fork = [m, [m[0] + dir * 34, m[1] + y * 0.12], [m[0] + dir * 62, m[1] + y * 0.26]], d = path(pts) + ' ' + path(fork), s = el('div', 'rain-bolt');
    s.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true"><path class="g" d="' + d + '"/><path class="c" d="' + d + '"/></svg>';
    f.appendChild(s); later(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 420);
  }
  function burst(x, y, col) {
    const add = function (cls, css, ms) { const s = el('i', cls); s.style.cssText = css; f.appendChild(s); later(function () { if (s.parentNode) s.parentNode.removeChild(s); }, ms); };
    add('rp-flash', 'left:' + x + 'px;top:' + y + 'px', 300); add('rp-ring', 'left:' + x + 'px;top:' + y + 'px', 400);
    for (let k = 0; k < 11; k++) { const a = Math.random() * 6.283, r = 40 + Math.random() * 70; add('rp-shard', 'left:' + x + 'px;top:' + y + 'px;--c:' + col + ';--dx:' + (Math.cos(a) * r).toFixed(0) + 'px;--dy:' + (Math.sin(a) * r + 30).toFixed(0) + 'px;--r:' + Math.round(Math.random() * 540 - 270) + 'deg;width:' + (8 + Math.random() * 8).toFixed(0) + 'px', 800); }
    for (let k = 0; k < 7; k++) { const a = -Math.PI * (0.15 + Math.random() * 0.7), r = 50 + Math.random() * 60; add('rp-drop', 'left:' + x + 'px;top:' + y + 'px;--dx:' + (Math.cos(a) * r).toFixed(0) + 'px;--dy:' + (Math.sin(a) * r + 55).toFixed(0) + 'px', 800); }
  }
  function pop(e) {
    R.words.splice(R.words.indexOf(e), 1); if (R.target === e) R.target = null;
    R.caught += e.n; R.popped++; R.streak++; R.best = Math.max(R.best, R.streak);
    const big = e.n > 1; sfx('zap', big); if (big) sfx('thunder', e.n); flash(false);
    e.els.forEach(function (d, i) {   // lightning strikes each balloon (a combo one after another), then it bursts
      later(function () { const x = parseFloat(d.style.left), y = e.y + 38; bolt(x, y); if (i) sfx('zap', false); d.classList.add('zapped');
        later(function () { burst(x, y, d.col); d.style.visibility = 'hidden'; sfx('pop'); later(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 60); }, 80); }, i * 110);
    });
    if (e.n > 1) { R.bonus += e.n; R.combos++; say(COMBO_NAME[e.n] + '! +' + e.n + ' BONUS'); sfx('levelComplete'); floatText(parseFloat(e.els[Math.floor(e.n / 2)].style.left), e.y, '+' + e.n * 2); }
    else floatText(parseFloat(e.els[0].style.left), e.y, '+1');
  }
  function miss(e, quiet) {
    R.words.splice(R.words.indexOf(e), 1); if (R.target === e) R.target = null;
    if (!quiet) { R.missed++; R.streak = 0; sfx('softMiss'); }
    e.els.forEach(function (d) { const s = el('div', 'rain-splash'); s.style.left = d.style.left; f.appendChild(s); later(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 650); d.classList.add('sink'); later(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 600); });
  }

  /* ---- keys ---- */
  function bad(expected) { R.errors++; if (expected) R.err[expected] = (R.err[expected] || 0) + 1; R.streak = 0; sfx('softMiss'); }
  function onChar(ch) {
    let e = R.target;
    if (!e) {
      const c = R.words.filter(function (x) { return x.text[0] === ch; }).sort(function (a, b) { return b.y - a.y; });
      if (!c.length) { bad(null); return; }
      e = c[0]; setTarget(e);
    }
    const exp = e.text[e.i];
    if (ch === exp) { R.good++; e.i++; paint(e); sfx('tick'); if (e.i >= e.text.length) pop(e); }
    else { bad(exp); e.els.forEach(function (d) { d.bb.classList.remove('shake'); void d.bb.offsetWidth; d.bb.classList.add('shake'); }); }
  }
  function onKey(e) {
    if (stopped || R.phase === 'done') return;
    if (e.key === 'Escape') { e.preventDefault(); togglePause(); return; }
    if (R.phase !== 'play' || R.paused) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key.length !== 1) return;
    e.preventDefault(); if (e.key === ' ') return;
    onChar(e.key); refresh();
  }
  document.addEventListener('keydown', onKey, true);

  /* ---- pause, end ---- */
  const over = el('div', 'pr-rainover'); over.hidden = true; f.appendChild(over);
  function togglePause() {
    if (R.phase !== 'play') return; R.paused = !R.paused;
    if (R.paused) { sndStop(); over.innerHTML = ''; const m = el('div', 'pr-rainmsg'); m.appendChild(el('div', 'pr-rainbig', 'Paused')); const b = el('button', 'btn primary pr-go', '▶ Resume', { type: 'button' }); b.addEventListener('click', function () { b.blur(); togglePause(); }); m.appendChild(b); over.appendChild(m); over.hidden = false; }
    else { over.hidden = true; if (R.sndOn) sndStart(); last = performance.now(); }
    bPause.textContent = R.paused ? '▶' : '⏸';
  }
  bPause.addEventListener('click', function () { bPause.blur(); togglePause(); });
  bSnd.addEventListener('click', function () { bSnd.blur(); R.sndOn = !R.sndOn; bSnd.classList.toggle('off', !R.sndOn); if (R.sndOn && R.phase === 'play' && !R.paused) sndStart(); else sndStop(); });
  bEnd.addEventListener('click', function () { bEnd.blur(); finish(); });
  function onVis() { if (document.hidden && R.phase === 'play' && !R.paused) togglePause(); }
  document.addEventListener('visibilitychange', onVis);
  function stop() { stopped = true; cancelAnimationFrame(raf); document.removeEventListener('keydown', onKey, true); document.removeEventListener('visibilitychange', onVis); timers.forEach(clearTimeout); timers.length = 0; sndStop(); }
  function sample(final) {
    const t = final ? R.t : R.sec, c = chars(), min = Math.max(R.t, 0.001) / 60, k = keys();
    R.series.push({ t: t, net: c / 5 / min, raw: k / 5 / min, inst: (k - R.keysPrev) / 5 * 60 / (final ? Math.max(R.t - Math.floor(R.t), 0.5) : 1), errs: R.errors - R.errPrev });
    R.keysPrev = k; R.errPrev = R.errors;
  }
  function finish() {
    if (R.phase === 'done') return; R.phase = 'done';
    if (R.t - R.sec >= 0.5) sample(true);
    stop(); sfx('levelComplete');
    const sec = Math.max(R.t, 1), min = sec / 60, weak = Object.keys(R.err).map(function (k) { return { key: k, errors: R.err[k] }; }).sort(function (a, b) { return b.errors - a.errors; }).slice(0, 5);
    const res = { net: chars() / 5 / min, raw: keys() / 5 / min, acc: acc(), seconds: sec, correct: R.good, wrong: R.errors, extra: 0, missed: R.missed, words: R.popped, series: R.series, weak: weak };
    const meta = { title: 'Word Rain - 2 minutes', extra: [{ label: 'Caught', value: String(score()) }, { label: 'Missed', value: String(R.missed) }, { label: 'Combos', value: String(R.combos) }] };
    api.done(res, meta);
  }

  /* ---- each frame ---- */
  function update(dt) {
    R.t += dt; while (R.sec + 1 <= R.t) { R.sec++; sample(false); }
    const H = f.clientHeight || 340, p = Math.min(1, R.t / R.dur), q = Math.pow(p, 1.2), v = (H - 60) / (sp.fall[0] - (sp.fall[0] - sp.fall[1]) * q);   // the rain speeds up only a little during the round
    R.skyT -= dt; if (R.skyT <= 0) { R.skyT = 8 + Math.random() * 7; flash(true); sfx('thunder', 0); }
    R.spawnT -= dt; if (R.spawnT <= 0 && R.dur - R.t > 3) { if (R.comboWait > 0) R.spawnT = 0.15; else R.spawnT = spawn(1) ? (sp.gap[0] - (sp.gap[0] - sp.gap[1]) * q) * (0.85 + Math.random() * 0.3) : 0.15; }
    R.comboT -= dt; if (R.comboT <= 0 && R.dur - R.t > 12) {   // a combo is due: pause the single balloons for a moment so there is room for it
      const n = R.comboN || (R.comboN = comboSize(lanes()));
      if (spawn(n)) { say(COMBO_NAME[n] + ' RAIN! Type it once'); R.comboT = (13 + Math.random() * 8) * clamp(sp.gap[0] / 2, 0.9, 2.2); R.comboWait = 0; R.comboN = 0; }
      else { R.comboT = 0.25; R.comboWait += 0.25; if (R.comboWait > 7) { R.comboN = Math.max(2, n - 1); R.comboWait = 0; } }
    }
    for (let i = R.words.length - 1; i >= 0; i--) { const e = R.words[i]; e.y += v * dt; e.els.forEach(function (d) { d.style.top = e.y + 'px'; }); if (e.y > H - 122) miss(e, false); }
    const left = R.dur - R.t; tbar.firstChild.style.width = Math.max(0, left / R.dur * 100) + '%'; tbar.classList.toggle('low', left <= 10);
    refresh();
    if (left <= 0) { R.words.slice().forEach(function (e) { miss(e, true); }); finish(); }
  }
  /* the 3-2-1 before the rain */
  let count = 3;
  function counting() {
    if (stopped) return;
    const c = el('div', 'ty-count pop', count > 0 ? String(count) : 'Go!'); f.appendChild(c); later(function () { if (c.parentNode) c.parentNode.removeChild(c); }, 750);
    if (count > 0) { count--; later(counting, 900); } else { R.phase = 'play'; sndStart(); last = performance.now(); }
  }
  function frame(now) {
    if (stopped) return;
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
    if (R.phase === 'play' && !R.paused) update(dt);
    if (!stopped) raf = requestAnimationFrame(frame);
  }
  refresh(); last = performance.now(); raf = requestAnimationFrame(frame); play.scrollIntoView({ block: 'start' }); later(counting, 200);
  return { stop: stop, _R: R };
}

CC.practiceRain = { start: start };
})();
