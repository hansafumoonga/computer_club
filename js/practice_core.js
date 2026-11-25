/* practice_core.js - the typing engine behind Practice. Pure logic (no page access), so the maths can be tested on its own.
   Speed    = correct characters / 5 / minutes. A character is correct when it matches the expected one at that place in the final text;
              a space counts when the word before it is exactly right.
   Accuracy = correct key presses / all key presses (Backspace is not a key press, so a corrected mistake still lowers accuracy). */
(function () {
'use strict';
const CC = window.CC = window.CC || {};
const D = CC.PRACTICE_DATA;
const MAX_EXTRA = 8;                       // a word can be typed up to 8 characters too long

function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
/* ---------- making text: three levels ----------
   beginner = short everyday words (5 letters or fewer); medium = everyday words;
   pro      = longer and everyday words with capitals, commas, full stops, quotes, brackets and numbers */
function rint(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
function cap(w) { return w.charAt(0).toUpperCase() + w.slice(1); }
const SHORT = D.EVERYDAY.filter(function (w) { return w.length <= 5; });
function plain(count, p) {
  const out = []; let last = '';
  for (let i = 0; i < count; i++) { let w; do { w = pick(p); } while (w === last); last = w; out.push(w); }
  return out;
}
function numberToken() {
  const r = Math.random();
  if (r < 0.5) return String(rint(1, 9) * Math.pow(10, rint(0, 3)) + rint(0, 9));          // 7, 36, 405, 2013
  if (r < 0.65) return rint(1, 99) + '.' + rint(1, 99);                                    // 3.14
  if (r < 0.78) return rint(1, 9) + ',' + String(rint(100, 999));                          // 1,250
  if (r < 0.9) return rint(1, 12) + ':' + rint(0, 5) + rint(0, 9);                         // 7:45
  return rint(5, 95) + '%';                                                               // 40%
}
function proWords(count) {
  const out = []; let last = '', since = 0, next = rint(5, 11), start = true;
  for (let i = 0; i < count; i++) {
    let w, num = false;
    if (Math.random() < 0.12) { w = numberToken(); num = true; }
    else { do { w = pick(Math.random() < 0.5 ? D.LONG : D.EVERYDAY); } while (w === last); }
    last = w;
    if (start && !num) { w = cap(w); start = false; }          // a number at the start of a sentence leaves the capital for the next word
    since++;
    if (since >= next || i === count - 1) { w += pick(['.', '.', '.', '?', '!']); start = true; since = 0; next = rint(5, 11); }
    else { const r = Math.random(); if (r < 0.1) w += ','; else if (r < 0.14 && !num) w = '"' + w + '"'; else if (r < 0.17 && !num) w = '(' + w + ')'; }
    out.push(w);
  }
  return out;
}
/* `count` words for a level ('beginner', 'medium' or 'pro'), never the same word twice in a row */
function words(count, level) { return level === 'pro' ? proWords(count) : plain(count, level === 'beginner' ? SHORT : D.EVERYDAY); }
/* words that contain the keys a person missed most (at the level's difficulty) */
function weakWords(keys, count, level) {
  const ks = keys.filter(function (k) { return /^[a-z]$/.test(k.toLowerCase()); }).map(function (k) { return k.toLowerCase(); });
  const base = level === 'pro' ? D.EVERYDAY.concat(D.LONG) : level === 'beginner' ? SHORT : D.EVERYDAY;
  let ok = ks.length ? base.filter(function (w) { return ks.some(function (k) { return w.indexOf(k) >= 0; }); }) : base;
  if (!ok.length) ok = base;
  const out = []; for (let i = 0; i < count; i++) out.push(pick(ok)); return out;
}

/* ---------- one typing session ---------- */
function Session(wordList) {
  this.words = wordList.slice(); this.wi = 0; this.buf = ''; this.typed = [];
  this.keys = 0; this.good = 0; this.err = {};
  this.t0 = null; this.end = null; this.done = false;
}
Session.prototype.more = function (list) { Array.prototype.push.apply(this.words, list); };
/* a character was typed; now = milliseconds (any clock, as long as it is the same one for every call) */
Session.prototype.key = function (ch, now) {
  if (this.done) return false;
  const w = this.words[this.wi];
  if (ch === ' ') {
    if (this.buf === '') return false;                                  // a space before any letter is ignored
    if (this.t0 == null) this.t0 = now;
    const exact = this.buf.length === w.length;                         // pressing Space early or late is a mistake
    this.keys++; if (exact) this.good++; else this._miss(w.charAt(this.buf.length) || ' ');
    this.typed[this.wi] = this.buf; this.wi++; this.buf = '';
    if (this.wi >= this.words.length) this.finish(now);
    return true;
  }
  if (this.buf.length >= w.length + MAX_EXTRA) return false;
  if (this.t0 == null) this.t0 = now;
  const exp = w.charAt(this.buf.length);
  this.keys++; if (ch === exp) this.good++; else this._miss(exp);
  this.buf += ch;
  if (this.wi === this.words.length - 1 && this.buf.length >= w.length && this.endOnLast !== false) { this.typed[this.wi] = this.buf; this.wi++; this.buf = ''; this._byLast = true; this.finish(now); }
  return true;
};
Session.prototype._miss = function (expected) { const e = expected || '+'; this.err[e] = (this.err[e] || 0) + 1; };
Session.prototype.back = function (whole) {
  if (this.done) return;
  if (whole) { this.buf = ''; return; }
  if (this.buf.length) { this.buf = this.buf.slice(0, -1); return; }
  if (this.wi > 0 && this.typed[this.wi - 1] !== this.words[this.wi - 1]) { this.wi--; this.buf = this.typed[this.wi]; this.typed.length = this.wi; }   // a wrong word can be reopened
};
/* the correct characters at this moment */
Session.prototype.correct = function () {
  let correct = 0;
  for (let i = 0; i < this.typed.length; i++) {
    const t = this.typed[i], w = this.words[i], m = Math.min(t.length, w.length);
    for (let j = 0; j < m; j++) { if (t.charAt(j) === w.charAt(j)) correct++; }
    if (t === w && !(this._byLast && i === this.typed.length - 1)) correct++;   // the space (the last word of a fixed text ends without one)
  }
  if (this.wi < this.words.length) {                       // the word being typed (a finished fixed text has moved past its last word)
    const w = this.words[this.wi], b = this.buf, m = Math.min(b.length, w.length);
    for (let j = 0; j < m; j++) { if (b.charAt(j) === w.charAt(j)) correct++; }
  }
  return correct;
};
Session.prototype.elapsed = function (now) { return this.t0 == null ? 0 : Math.max(0, ((this.end != null ? this.end : now) - this.t0) / 1000); };
Session.prototype.stats = function (now) {
  const el = this.elapsed(now);
  return { elapsed: el, net: this.correct() / 5 / (Math.max(el, 0.001) / 60), acc: this.keys ? 100 * this.good / this.keys : 100 };
};
Session.prototype.finish = function (now) { if (this.done) return; this.end = now; this.done = true; };
/* the letters missed most: [{ key, errors }] worst first, at most n */
function weakKeys(errs, n) {
  const out = []; Object.keys(errs).forEach(function (k) { if (/^[A-Za-z]$/.test(k)) out.push({ key: k, errors: errs[k] }); });   // only letters: those are the keys a drill can practise
  out.sort(function (a, b) { return b.errors - a.errors || (a.key < b.key ? -1 : 1); });
  return out.slice(0, n || 5);
}
Session.prototype.result = function () {
  const st = this.stats(this.end);
  return { net: st.net, acc: st.acc, seconds: st.elapsed, weak: weakKeys(this.err) };
};

CC.practiceCore = { Session: Session, words: words, weakWords: weakWords, weakKeys: weakKeys, pick: pick, shuffle: shuffle };
})();
