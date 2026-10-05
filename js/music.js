/* music.js - background music for every game, all synthesized in the browser (no audio files).
   Each game has its OWN tune: chord progression + bass + drums + arpeggio + lead melody.
   Tracks are plain data below, so a teacher can tweak tempo (bpm), key, or volume (vol). */
(function () {
'use strict';
const A = CC.audio;
const QUAL = { M: [0, 4, 7, 12], m: [0, 3, 7, 12], 7: [0, 4, 7, 10], d: [0, 3, 6, 9], s: [0, 5, 7, 12] };
const mtof = function (m) { return 440 * Math.pow(2, (m - 69) / 12); };

/* ---- the tunes ----
   key = tonic as a MIDI note (60 = middle C).  prog = one chord per bar: r = semitones above the key, q = chord type (M major, m minor, 7, d diminished, s suspended).
   bass / arp = 16 steps per bar:  bass letters r=root f=fifth o=octave;  arp digits 0-3 = chord note (4-7 = same note an octave higher).
   k / s / h / c = kick / snare / hi-hat / clap hits (x = hit, . = rest).
   lead = one list per bar of [step, semitones above key, length in steps].  vol = overall loudness of that tune. */
const TRACKS = {
  /* hub + menu: friendly and bouncy */
  menu: { bpm: 100, key: 60, vol: 0.9, lt: 'triangle',
    prog: [{ r: 0, q: 'M' }, { r: 9, q: 'm' }, { r: 5, q: 'M' }, { r: 7, q: 'M' }],
    bass: 'r.......f.......', arp: '0.1.2.1.0.1.2.3.', k: 'x.......x.......', s: '', h: '..x...x...x...x.', c: '',
    lead: [[[0, 16, 4], [4, 14, 4], [8, 12, 4], [12, 14, 4]], [[0, 21, 4], [4, 19, 4], [8, 16, 8]], [[0, 17, 4], [4, 16, 4], [8, 12, 4], [12, 9, 4]], [[0, 14, 4], [4, 19, 4], [8, 16, 6], [14, 14, 2]]] },

  /* Jump Over!: bright running chiptune */
  jump: { bpm: 148, key: 60, vol: 1, lt: 'square',
    prog: [{ r: 0, q: 'M' }, { r: 7, q: 'M' }, { r: 9, q: 'm' }, { r: 5, q: 'M' }],
    bass: 'r.r.o.r.r.r.o.f.', arp: '4.5.6.5.4.5.6.7.', k: 'x...x...x...x...', s: '....x.......x...', h: '..x...x...x...x.', c: '',
    lead: [[[0, 12, 2], [2, 16, 2], [4, 19, 4], [8, 16, 2], [10, 19, 2], [12, 24, 4]], [[0, 23, 2], [2, 19, 2], [4, 14, 4], [8, 19, 2], [10, 23, 2], [12, 26, 4]],
      [[0, 21, 2], [2, 24, 2], [4, 21, 4], [8, 16, 2], [10, 21, 2], [12, 24, 4]], [[0, 17, 2], [2, 21, 2], [4, 24, 4], [8, 21, 2], [10, 17, 2], [12, 19, 4]]] },

  /* Star Blaster: driving space arpeggios (A minor) */
  blaster: { bpm: 136, key: 57, vol: 1, lt: 'sawtooth',
    prog: [{ r: 0, q: 'm' }, { r: 8, q: 'M' }, { r: 3, q: 'M' }, { r: 10, q: 'M' }, { r: 0, q: 'm' }, { r: 5, q: 'm' }, { r: 8, q: 'M' }, { r: 7, q: 'M' }],
    bass: 'r..rr..rr..rr.o.', arp: '0123432101234321', k: 'x.....x.x.......', s: '....x.......x...', h: 'x.x.x.x.x.x.x.xx', c: '',
    lead: [[[0, 24, 6], [8, 28, 4], [12, 27, 4]], [[0, 24, 8], [8, 23, 8]], [[0, 24, 4], [4, 31, 4], [8, 28, 8]], [[0, 26, 8], [8, 23, 4], [12, 26, 4]]] },
  blasterBoss: { bpm: 156, key: 52, vol: 1.05, lt: 'sawtooth',
    prog: [{ r: 0, q: 'm' }, { r: 0, q: 'm' }, { r: 1, q: 'M' }, { r: 0, q: 'm' }, { r: 0, q: 'm' }, { r: 6, q: 'M' }, { r: 5, q: 'M' }, { r: 7, q: 'M' }],
    bass: 'rrr.rrr.rr.rr.o.', arp: '0.2.0.2.0.2.3.2.', k: 'x..xx..xx..xx.x.', s: '....x.......x..x', h: 'xxxxxxxxxxxxxxxx', c: '....x.......x...',
    lead: [[[0, 24, 3], [4, 24, 3], [8, 27, 4], [12, 26, 4]], [[0, 24, 3], [4, 24, 3], [8, 31, 4], [12, 29, 4]]] },

  /* Commando Run: fast, heavy action riffs (changes key every stage) */
  commando: { bpm: 154, key: 52, vol: 1.05, lt: 'sawtooth',
    prog: [{ r: 0, q: 'm' }, { r: 0, q: 'm' }, { r: 8, q: 'M' }, { r: 7, q: 'M' }, { r: 0, q: 'm' }, { r: 0, q: 'm' }, { r: 5, q: 'M' }, { r: 6, q: 'M' }],
    bass: 'rr.rr.o.rr.rr.f.', arp: '0.1.2.1.0.1.2.3.', k: 'x..x..x.x..x..x.', s: '....x.......x...', h: 'xxxxxxxxxxxxxxxx', c: '',
    lead: [[[0, 24, 2], [3, 24, 2], [6, 27, 2], [8, 26, 4], [12, 24, 2], [14, 23, 2]], [[0, 24, 2], [3, 24, 2], [6, 29, 2], [8, 27, 4], [12, 26, 4]],
      [[0, 27, 4], [4, 26, 2], [6, 24, 2], [8, 23, 4], [12, 24, 4]], [[0, 24, 2], [2, 26, 2], [4, 27, 2], [6, 29, 2], [8, 31, 8]]] },
  commandoBoss: { bpm: 170, key: 50, vol: 1.1, lt: 'sawtooth',
    prog: [{ r: 0, q: 'm' }, { r: 1, q: 'M' }, { r: 0, q: 'm' }, { r: 6, q: 'd' }, { r: 0, q: 'm' }, { r: 8, q: 'M' }, { r: 7, q: 'M' }, { r: 6, q: 'd' }],
    bass: 'rrrrrrrrrrrrrrof', arp: '0.2.0.2.0.2.0.3.', k: 'x.x.x.x.x.x.x.xx', s: '....x.......x.x.', h: 'xxxxxxxxxxxxxxxx', c: '....x.......x...',
    lead: [[[0, 24, 2], [2, 24, 2], [4, 25, 2], [6, 24, 2], [8, 27, 4], [12, 25, 4]], [[0, 24, 2], [2, 24, 2], [4, 30, 2], [6, 29, 2], [8, 27, 4], [12, 26, 2], [14, 25, 2]]] },

  /* Pattern Pop: soft and playful (kept quiet so the pad tones stand out) */
  pattern: { bpm: 108, key: 48, vol: 0.55, lt: 'triangle',
    prog: [{ r: 0, q: 'M' }, { r: 5, q: 'M' }, { r: 0, q: 'M' }, { r: 7, q: 'M' }],
    bass: 'r.......r.......', arp: '', k: 'x.......x.......', s: '', h: '..x...x...x...x.', c: '', lead: [] },

  /* Fruit Slice: relaxed marimba and ukulele (F major) */
  fruit: { bpm: 104, key: 53, vol: 0.9, lt: 'triangle',
    prog: [{ r: 0, q: 'M' }, { r: 0, q: 'M' }, { r: 7, q: 'M' }, { r: 5, q: 'M' }, { r: 2, q: 'm' }, { r: 7, q: 'M' }, { r: 0, q: 'M' }, { r: 7, q: '7' }],
    bass: 'r.....f.r.....f.', arp: '..1...2...1...3.', k: 'x.......x.......', s: '', h: '..x...x...x...x.', c: '',
    lead: [[[0, 24, 3], [4, 28, 3], [8, 31, 3], [12, 28, 3]], [[0, 29, 3], [4, 28, 3], [8, 24, 6]], [[0, 26, 3], [4, 31, 3], [8, 29, 3], [12, 26, 3]], [[0, 28, 3], [4, 26, 3], [8, 24, 6]]] },

  /* Word Hunt: calm "thinking" music (D major) */
  words: { bpm: 84, key: 50, vol: 0.85, lt: 'sine',
    prog: [{ r: 0, q: 'M' }, { r: 7, q: 'M' }, { r: 9, q: 'm' }, { r: 5, q: 'M' }],
    bass: 'r...............', arp: '0.1.2.3.2.1.0.1.', k: '', s: '', h: '....x.......x...', c: '',
    lead: [[[0, 21, 8], [8, 19, 8]], [[0, 18, 8], [8, 21, 8]], [[0, 24, 12]], [[0, 23, 8], [8, 21, 8]]] }
};

const M = CC.music = { muted: false, duckOn: false, bus: null, cur: null, key: '' };
let timer = 0, nextT = 0, step = 0;

function ensureBus() {
  if (!A.ctx || M.bus) return;
  M.bus = A.ctx.createGain(); M.bus.gain.value = 0; M.bus.connect(A.master);
}
function applyGain(fast) {
  if (!M.bus) return; const target = M.muted ? 0 : (M.duckOn ? 0.14 : 0.5);
  M.bus.gain.cancelScheduledValues(A.ctx.currentTime); M.bus.gain.setTargetAtTime(target, A.ctx.currentTime, fast ? 0.03 : 0.25);
}
function stepDur(tr) { return 60 / (tr.bpm * (tr.mul || 1)) / 4; }
function schedule(tr, st, t) {
  const bar = Math.floor(st / 16), s = st % 16, ch = tr.prog[bar % tr.prog.length], tones = QUAL[ch.q], root = tr.key + ch.r, dly = t - A.ctx.currentTime, sd = stepDur(tr), v = tr.vol;
  A._out = M.bus;
  const bc = tr.bass.charAt(s);
  if (bc && bc !== '.') A.tone(mtof(root - 12 + (bc === 'f' ? 7 : bc === 'o' ? 12 : 0)), { delay: dly, dur: sd * 1.7, type: 'triangle', vol: 0.34 * v, attack: 0.01 });
  const ac = tr.arp.charAt(s);
  if (ac && ac !== '.') { const i = +ac; A.tone(mtof(root + 12 + tones[i % 4] + (i > 3 ? 12 : 0)), { delay: dly, dur: sd * 1.6, type: tr.lt === 'sine' ? 'sine' : 'triangle', vol: 0.12 * v }); }
  if (s === 0 && tr.lt !== 'square') { tones.slice(0, 3).forEach(function (n, i) { A.tone(mtof(root + n + (i ? 0 : 0)), { delay: dly, dur: sd * 15, type: 'sine', vol: 0.07 * v, attack: 0.25 }); }); }
  if (tr.k.charAt(s) === 'x') A.kick(dly, 0.55 * v);
  if (tr.s.charAt(s) === 'x') A.snare(dly, 0.2 * v);
  if (tr.c.charAt(s) === 'x') A.snare(dly, 0.14 * v);
  if (tr.h.charAt(s) === 'x') A.hat(dly, (s % 4 === 2 ? 0.1 : 0.06) * v);
  if (tr.lead.length) { const evs = tr.lead[bar % tr.lead.length]; for (let i = 0; i < evs.length; i++) if (evs[i][0] === s) A.tone(mtof(tr.key + evs[i][1]), { delay: dly, dur: sd * evs[i][2] * 0.95, type: tr.lt, vol: (tr.lt === 'sawtooth' ? 0.1 : 0.15) * v, attack: 0.012 }); }
  A._out = null;
}
function tick() {
  if (!A.ctx || !M.cur) return;
  while (nextT < A.ctx.currentTime + 0.25) { schedule(M.cur, step, nextT); step++; nextT += stepDur(M.cur); }
}
/* play(trackName, {transpose: semitones, tempo: speed multiplier}) - restarts only if something changed */
M.play = function (name, o) {
  o = o || {}; const base = TRACKS[name]; if (!base) return;
  const key = name + '|' + (o.transpose || 0) + '|' + (o.tempo || 1);
  if (M.key === key && M.cur) return;
  A.init(); if (!A.ctx) return; ensureBus();
  M.key = key; M.cur = Object.assign({}, base, { key: base.key + (o.transpose || 0), mul: o.tempo || 1 });
  step = 0; nextT = A.ctx.currentTime + 0.1; clearInterval(timer); timer = setInterval(tick, 40); applyGain(true); tick();
};
M.stop = function () { clearInterval(timer); timer = 0; M.cur = null; M.key = ''; if (M.bus && A.ctx) M.bus.gain.setTargetAtTime(0, A.ctx.currentTime, 0.05); };
M.duck = function (on) { M.duckOn = !!on; applyGain(false); };
M.toggleMute = function () { M.muted = !M.muted; applyGain(true); document.querySelectorAll('.music-btn').forEach(function (b) { b.textContent = M.muted ? '🔇' : '🎵'; }); return M.muted; };
M.tracks = TRACKS;
})();
