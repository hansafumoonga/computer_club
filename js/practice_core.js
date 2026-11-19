/* practice_core.js - the typing engine behind Practice. Pure logic (no page access), so the maths can be tested on its own.
   How it measures (the same words are printed on the page):
     Net speed   = correct characters / 5 / minutes. A character is correct when it matches the expected one at that place in the final text.
                   A space counts when the word before it is exactly right.
     Raw speed   = every character typed / 5 / minutes.
     Accuracy    = correct key presses / all key presses (Backspace is not a key press, so corrected mistakes still lower accuracy).
     Consistency = 100% minus how much the second-by-second speed varies (standard deviation / mean). */
(function () {
'use strict';
const CC = window.CC = window.CC || {};
const D = CC.PRACTICE_DATA;
const MAX_EXTRA = 8;                       // a word can be typed up to 8 characters too long

function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
/* ---------- making text ---------- */
/* `count` everyday words, never the same word twice in a row */
function words(count) {
  const p = D.EVERYDAY, out = []; let last = '';
  for (let i = 0; i < count; i++) { let w; do { w = pick(p); } while (w === last); last = w; out.push(w); }
  return out;
}
/* words that contain the keys a person missed most */
function weakWords(keys, count) {
  const ks = keys.filter(function (k) { return /^[a-z]$/.test(k.toLowerCase()); }).map(function (k) { return k.toLowerCase(); });
  let ok = ks.length ? D.EVERYDAY.filter(function (w) { return ks.some(function (k) { return w.indexOf(k) >= 0; }); }) : D.EVERYDAY;
  if (!ok.length) ok = D.EVERYDAY;
  const out = []; for (let i = 0; i < count; i++) out.push(pick(ok)); return out;
}

/* ---------- one typing session ---------- */
function Session(wordList, o) {
  o = o || {};
  this.words = wordList.slice(); this.wi = 0; this.buf = ''; this.typed = [];
  this.keys = 0; this.good = 0; this.att = {}; this.err = {};
  this.t0 = null; this.end = null; this.done = false; this.series = []; this._allPrev = 0; this._errPrev = 0; this._errs = 0;
}
Session.prototype.more = function (list) { Array.prototype.push.apply(this.words, list); };
Session.prototype.cur = function () { return this.words[this.wi]; };
/* a character was typed; now = milliseconds (any clock, as long as it is the same one for every call) */
Session.prototype.key = function (ch, now) {
  if (this.done) return false;
  const w = this.words[this.wi];
  if (ch === ' ') {
    if (this.buf === '') return false;                                  // a space before any letter is ignored
    if (this.t0 == null) this.t0 = now;
    const exact = this.buf.length === w.length;                         // pressing Space early or late is a mistake
    this.keys++; if (exact) this.good++; else this._miss(w.charAt(this.buf.length) || ' ', ' ');
    this.typed[this.wi] = this.buf; this.wi++; this.buf = '';
    if (this.wi >= this.words.length) { this.finish(now); }
    return true;
  }
  if (this.buf.length >= w.length + MAX_EXTRA) return false;
  if (this.t0 == null) this.t0 = now;
  const exp = w.charAt(this.buf.length), ok = ch === exp;
  this.keys++; if (ok) this.good++; else this._miss(exp, ch);
  this.buf += ch;
  if (this.wi === this.words.length - 1 && this.buf.length >= w.length && this.endOnLast !== false) { this.typed[this.wi] = this.buf; this.wi++; this.buf = ''; this._byLast = true; this.finish(now); }
  return true;
};
Session.prototype._miss = function (expected, typedCh) { this._errs++; const e = expected || '+'; this.err[e] = (this.err[e] || 0) + 1; };
Session.prototype.back = function (whole) {
  if (this.done) return;
  if (whole) { this.buf = ''; return; }
  if (this.buf.length) { this.buf = this.buf.slice(0, -1); return; }
  if (this.wi > 0 && this.typed[this.wi - 1] !== this.words[this.wi - 1]) { this.wi--; this.buf = this.typed[this.wi]; this.typed.length = this.wi; }   // a wrong word can be reopened
};
/* the counts at this moment */
Session.prototype.counts = function () {
  let correct = 0, wrong = 0, extra = 0, missed = 0, all = 0, okWords = 0;
  for (let i = 0; i < this.typed.length; i++) {
    const t = this.typed[i], w = this.words[i], m = Math.min(t.length, w.length);
    for (let j = 0; j < m; j++) { if (t.charAt(j) === w.charAt(j)) correct++; else wrong++; }
    if (t.length > w.length) extra += t.length - w.length; else missed += w.length - t.length;
    const space = !(this._byLast && i === this.typed.length - 1);   // the last word of a fixed text ends without a space
    if (t === w) { okWords++; if (space) correct++; }
    all += t.length + (space ? 1 : 0);
  }
  if (!this.done && this.wi < this.words.length) {
    const w = this.words[this.wi], b = this.buf, m = Math.min(b.length, w.length);
    for (let j = 0; j < m; j++) { if (b.charAt(j) === w.charAt(j)) correct++; else wrong++; }
    if (b.length > w.length) extra += b.length - w.length;
    all += b.length;
  }
  return { correct: correct, wrong: wrong, extra: extra, missed: missed, all: all, words: okWords };
};
Session.prototype.elapsed = function (now) { return this.t0 == null ? 0 : Math.max(0, ((this.end != null ? this.end : now) - this.t0) / 1000); };
Session.prototype.stats = function (now) {
  const c = this.counts(), el = this.elapsed(now), min = Math.max(el, 0.001) / 60;
  return { elapsed: el, net: c.correct / 5 / min, raw: c.all / 5 / min, acc: this.keys ? 100 * this.good / this.keys : 100, c: c };
};
/* call about ten times a second: it keeps one sample for every full second */
Session.prototype.tick = function (now) {
  if (this.t0 == null || this.done) return;
  const s = Math.floor((now - this.t0) / 1000);
  while (this.series.length < s) {
    const i = this.series.length + 1, c = this.counts(), min = i / 60;
    this.series.push({ t: i, net: c.correct / 5 / min, raw: c.all / 5 / min, inst: (c.all - this._allPrev) / 5 * 60, errs: this._errs - this._errPrev });
    this._allPrev = c.all; this._errPrev = this._errs;
  }
};
Session.prototype.finish = function (now) {
  if (this.done) return; this.tick(now); this.end = now; this.done = true;
  const el = this.elapsed(now), last = this.series.length ? this.series[this.series.length - 1].t : 0;
  if (el - last >= 0.5) { const c = this.counts(), min = el / 60; this.series.push({ t: el, net: c.correct / 5 / min, raw: c.all / 5 / min, inst: (c.all - this._allPrev) / 5 / ((el - last) / 60), errs: this._errs - this._errPrev }); }
};
/* standard deviation / mean of the per-second speed, shown as a percentage (needs at least 5 seconds) */
function consistency(series) {
  const v = series.filter(function (s) { return Math.abs(s.t - Math.round(s.t)) < 1e-9; }).map(function (s) { return s.inst; });
  if (v.length < 5) return null;
  const m = v.reduce(function (a, b) { return a + b; }, 0) / v.length; if (m <= 0) return 0;
  const sd = Math.sqrt(v.reduce(function (a, b) { return a + (b - m) * (b - m); }, 0) / v.length);
  return Math.max(0, Math.min(100, Math.round(100 * (1 - sd / m))));
}
/* the keys missed most: [{ key, errors, tries }] worst first, at most n */
function weakKeys(S, n) {
  const out = []; Object.keys(S.err).forEach(function (k) { out.push({ key: k, errors: S.err[k] }); });
  out.sort(function (a, b) { return b.errors - a.errors || (a.key < b.key ? -1 : 1); });
  return out.slice(0, n || 5);
}
Session.prototype.result = function () {
  const st = this.stats(this.end), c = st.c;
  return { net: st.net, raw: st.raw, acc: st.acc, seconds: st.elapsed, correct: c.correct, wrong: c.wrong, extra: c.extra, missed: c.missed, words: c.words, series: this.series.slice(), consistency: consistency(this.series), weak: weakKeys(this) };
};

CC.practiceCore = { Session: Session, words: words, weakWords: weakWords, consistency: consistency, weakKeys: weakKeys, pick: pick, shuffle: shuffle, MAX_EXTRA: MAX_EXTRA };
})();
