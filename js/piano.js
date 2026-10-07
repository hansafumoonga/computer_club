/* piano.js - Session 2: a 5-pad piano (the five Makey Makey keys), songs, Free/Listen/Learn modes,
   synthesized backing beat, and recording of the app's own sound (never the microphone).

   Songs are written with real notes (letter + octave, e.g. 'G3' 'C4' 'E5'). The pads always play C D E F G in Free Play.
   In Listen and Learn mode every song is played with its REAL notes: in Learn mode the five pads act like game buttons -
   the glowing pad is the one to press, and the pad shows which note it will play. When the tune climbs or drops out of the
   five-note range, the pads quietly "slide" up or down, so any carol can be learned with only five keys. */
(function () {
'use strict';
const A = CC.audio;

/* ---- songs: [note, beats]. beat = which backing beat style. xmas = shown with a tree ---- */
const SONGS = {
  jingle: { name: '🔔 Jingle Bells', xmas: true, bpm: 124, beat: 'bells', notes: [
    ['E4',1],['E4',1],['E4',2],['E4',1],['E4',1],['E4',2],['E4',1],['G4',1],['C4',1.5],['D4',.5],['E4',4],
    ['F4',1],['F4',1],['F4',1.5],['F4',.5],['F4',1],['E4',1],['E4',1],['E4',.5],['E4',.5],['E4',1],['D4',1],['D4',1],['E4',1],['D4',2],['G4',2],
    ['E4',1],['E4',1],['E4',2],['E4',1],['E4',1],['E4',2],['E4',1],['G4',1],['C4',1.5],['D4',.5],['E4',4],
    ['F4',1],['F4',1],['F4',1],['F4',1],['F4',1],['E4',1],['E4',1],['E4',.5],['E4',.5],['G4',1],['G4',1],['F4',1],['D4',1],['C4',4]] },
  silent: { name: '🌟 Silent Night', xmas: true, bpm: 66, beat: 'waltz', soft: true, notes: [   // 3/4. The pads slide so the real tune can be played.
    ['G4',1.5],['A4',.5],['G4',1],['E4',3],['G4',1.5],['A4',.5],['G4',1],['E4',3],
    ['D5',2],['D5',1],['B4',3],['C5',2],['C5',1],['G4',3],
    ['A4',2],['A4',1],['C5',1.5],['B4',.5],['A4',1],['G4',1.5],['A4',.5],['G4',1],['E4',3],
    ['A4',2],['A4',1],['C5',1.5],['B4',.5],['A4',1],['G4',1.5],['A4',.5],['G4',1],['E4',3],
    ['D5',2],['D5',1],['F5',1.5],['D5',.5],['B4',1],['C5',3],['E5',2],['C5',1],['G4',1.5],['E4',.5],['G4',1],['F4',2],['D4',1],['C4',3]] },
  wish: { name: '🎅 Merry Christmas', xmas: true, bpm: 126, beat: 'waltz', notes: [
    ['G3',1],
    ['C4',1],['C4',.5],['D4',.5],['C4',.5],['B3',.5],['A3',1],['A3',1],['A3',1],
    ['D4',1],['D4',.5],['E4',.5],['D4',.5],['C4',.5],['B3',1],['G3',1],['G3',1],
    ['E4',1],['E4',.5],['F4',.5],['E4',.5],['D4',.5],['C4',1],['A3',1],['G3',1],
    ['G3',1],['A3',1],['D4',1],['B3',1],['C4',2]] },
  birthday: { name: '🎂 Happy Birthday', bpm: 100, beat: 'waltz', notes: [   // 3/4 waltz; high phrases capped at G
    ['C4',.75],['C4',.25],['D4',1],['C4',1],['F4',1],['E4',2],
    ['C4',.75],['C4',.25],['D4',1],['C4',1],['G4',1],['F4',2],
    ['G4',.75],['G4',.25],['G4',1],['E4',1],['F4',1],['E4',1],['D4',2],
    ['F4',.75],['F4',.25],['E4',1],['C4',1],['D4',1],['C4',3]] },
  ode: { name: '🎶 Ode to Joy', bpm: 112, beat: 'standard', notes: [
    ['E4',1],['E4',1],['F4',1],['G4',1],['G4',1],['F4',1],['E4',1],['D4',1],['C4',1],['C4',1],['D4',1],['E4',1],['E4',1.5],['D4',.5],['D4',2],
    ['E4',1],['E4',1],['F4',1],['G4',1],['G4',1],['F4',1],['E4',1],['D4',1],['C4',1],['C4',1],['D4',1],['E4',1],['D4',1.5],['C4',.5],['C4',2]] }
};
/* ---- backing beats: steps are 8th notes. k=kick s=snare h=hat b=bell shimmer ---- */
const BEATS = {
  standard: { steps: 8, k: [0, 4], s: [2, 6], h: [0, 1, 2, 3, 4, 5, 6, 7] },
  bells:    { steps: 8, k: [0, 4], s: [2, 6], h: [1, 3, 5, 7], b: [0, 2, 4, 6] },
  waltz:    { steps: 6, k: [0], s: [2, 4], h: [1, 3, 5] }
};

/* ---- note helpers: 'G4' -> frequency and a scale position (C4 = 0, D4 = 1 ... C5 = 7) ---- */
const LETTER = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 }, SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function degOf(n) { return (+n.slice(1) - 4) * 7 + LETTER[n[0]]; }
const NAME_AT = 'CDEFGAB';
/* Work out, for every note of a song, which of the five pads to press. The "window" of five notes slides when the tune leaves it. */
function plan(s) {
  if (s._plan) return s._plan;
  const degs = s.notes.map(function (x) { return degOf(x[0]); });
  let lo = Infinity; degs.slice(0, 12).forEach(function (d) { lo = Math.min(lo, d); });
  let start = lo; const out = [];
  degs.forEach(function (d, i) {
    if (d < start) start = d; if (d > start + 4) start = d - 4;
    out.push({ pad: CC.NOTES[d - start], note: s.notes[i][0], letter: s.notes[i][0][0] });
  });
  return (s._plan = out);
}

let built = false, song = 'jingle', mode = 'free', beatOn = false, beatTimer = 0, beatStep = 0, beatNext = 0;
let listenTimers = [], learnIdx = 0, pressedKeys = {};
let rec = null, recChunks = [], recBlob = null, recUrl = null, mediaType = '';
const $ = function (id) { return document.getElementById(id); };
const keyEls = {};

function build() {
  if (built) return; built = true;
  const piano = $('piano');
  CC.NOTES.forEach(function (n) {
    const k = document.createElement('div'); k.className = 'key'; k.dataset.note = n;
    k.innerHTML = '<span class="note">' + n + '</span><span class="kk">' + CC.KEY_LABEL[CC.NOTE_KEY[n]] + '</span>';
    k.addEventListener('pointerdown', function (e) { e.preventDefault(); press(n); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { k.addEventListener(ev, function () { release(n); }); });
    piano.appendChild(k); keyEls[n] = k;
  });
  [20, 40, 80].forEach(function (p) { const b = document.createElement('div'); b.className = 'black'; b.style.left = p + '%'; piano.appendChild(b); });  // none between E-F
  const songsRow = $('piano-songs');
  Object.keys(SONGS).forEach(function (id) {
    const b = document.createElement('button'); b.className = 'btn' + (SONGS[id].xmas ? ' xmas' : ''); b.textContent = SONGS[id].name; b.dataset.song = id;
    b.addEventListener('click', function () { b.blur(); setSong(id); });
    songsRow.appendChild(b);
  });
  const modesRow = $('piano-modes');
  [['free', '🎹 Free Play'], ['listen', '👂 Listen'], ['learn', '💡 Learn']].forEach(function (m) {
    const b = document.createElement('button'); b.className = 'btn'; b.textContent = m[1]; b.dataset.mode = m[0];
    b.addEventListener('click', function () { b.blur(); setMode(m[0]); });
    modesRow.appendChild(b);
  });
  const beat = document.createElement('button'); beat.className = 'btn'; beat.id = 'piano-beat'; beat.textContent = '🥁 Beat: Off';
  beat.addEventListener('click', function () { beat.blur(); setBeat(!beatOn); }); modesRow.appendChild(beat);
  $('rec-start').addEventListener('click', function () { this.blur(); recStart(); });
  $('rec-stop').addEventListener('click', function () { this.blur(); recStop(); });
  $('rec-play').addEventListener('click', function () { this.blur(); const a = $('rec-audio'); a.currentTime = 0; a.play(); });
}

function msg(t) { $('piano-msg').textContent = t; }
function refreshButtons() {
  document.querySelectorAll('#piano-songs .btn').forEach(function (b) { b.classList.toggle('on', b.dataset.song === song); });
  document.querySelectorAll('#piano-modes .btn[data-mode]').forEach(function (b) { b.classList.toggle('on', b.dataset.mode === mode); });
  const bb = $('piano-beat'); bb.classList.toggle('on', beatOn); bb.textContent = '🥁 Beat: ' + (beatOn ? 'On' : 'Off');
}
function padLabels(real) {          // the letter shown on each pad: C D E F G normally, the real note while following a tune
  CC.NOTES.forEach(function (n) { keyEls[n].querySelector('.note').textContent = n; });
  if (real) keyEls[real.pad].querySelector('.note').textContent = real.letter;
}
function clearGuide() { CC.NOTES.forEach(function (n) { keyEls[n].classList.remove('guide'); }); padLabels(null); }
function stopListen() { listenTimers.forEach(clearTimeout); listenTimers = []; }
function title() { return SONGS[song].name.replace(/^\S+\s/, ''); }

function setSong(id) { song = id; stopListen(); if (beatOn) { stopBeat(); startBeat(); } setMode(mode === 'free' ? 'free' : mode); }
function setMode(m) {
  stopListen(); clearGuide(); mode = m; learnIdx = 0;
  if (m === 'free') msg('Free Play: touch the pads and make some music!');
  if (m === 'listen') startListen();
  if (m === 'learn') { msg('Learn: press the glowing key to play ' + title() + '!'); showGuide(); }
  refreshButtons();
}
function showGuide() {
  clearGuide(); const p = plan(SONGS[song])[learnIdx];
  if (p) { keyEls[p.pad].classList.add('guide'); padLabels(p); }
}

/* ---- sound + visual for one pad press ---- */
function press(n) {
  A.init();
  if (pressedKeys[n]) return; pressedKeys[n] = true;
  keyEls[n].classList.add('active');
  const want = mode === 'learn' ? plan(SONGS[song])[learnIdx] : null;
  if (want && want.pad === n) A.pianoNote(want.note);          // the real note of the tune
  else A.pianoNote(n + '4');
  if (mode === 'learn') {
    if (want && want.pad === n) {
      learnIdx++;
      if (learnIdx >= SONGS[song].notes.length) { clearGuide(); msg('🎉 Wow! You played the whole song!'); CC.sfx.levelComplete(); setTimeout(function () { if (mode === 'learn') { learnIdx = 0; msg('Want to play it again? Follow the lights!'); showGuide(); } }, 3500); }
      else { msg('Nice! Keep going…'); showGuide(); }
    } else if (want) msg('Almost! Try the glowing key.');
  }
}
function release(n) { pressedKeys[n] = false; keyEls[n].classList.remove('active'); }
function flash(n, ms) { keyEls[n].classList.add('active'); setTimeout(function () { keyEls[n].classList.remove('active'); }, ms); }

/* ---- Listen mode ---- */
function startListen() {
  const s = SONGS[song], spb = 60 / s.bpm, pl = plan(s); let t = 0.4;
  msg('Listen to ' + title() + '…');
  const wasBeat = beatOn; if (!beatOn && !s.soft) setBeat(true);
  s.notes.forEach(function (nb, i) {
    const dur = nb[1] * spb, p = pl[i];
    listenTimers.push(setTimeout(function () { A.pianoNote(p.note, { dur: Math.max(0.35, dur * 1.1) }); padLabels(p); flash(p.pad, Math.min(300, dur * 900)); }, t * 1000));
    t += dur;
  });
  listenTimers.push(setTimeout(function () {
    padLabels(null); if (!wasBeat && beatOn) setBeat(false);
    msg('That was ' + title() + '! Now try Learn mode, or play it yourself!');
  }, (t + 0.5) * 1000));
}

/* ---- backing beat (lookahead scheduler) ---- */
function setBeat(on) { beatOn = on; if (on) startBeat(); else stopBeat(); refreshButtons(); }
function startBeat() {
  A.init(); stopBeat();
  beatStep = 0; beatNext = A.ctx.currentTime + 0.1;
  beatTimer = setInterval(beatTick, 30);
}
function stopBeat() { clearInterval(beatTimer); beatTimer = 0; }
function beatTick() {
  if (!A.ctx) return;
  const s = SONGS[song], pat = BEATS[s.beat], stepDur = 60 / s.bpm / 2;
  while (beatNext < A.ctx.currentTime + 0.15) {
    const i = beatStep % pat.steps, rel = beatNext - A.ctx.currentTime;
    if (pat.k.indexOf(i) >= 0) A.kick(rel, s.beat === 'bells' ? 0.4 : s.soft ? 0.3 : 0.55);
    if (pat.s.indexOf(i) >= 0) A.snare(rel, s.beat === 'waltz' ? 0.18 : 0.26);
    if (pat.h.indexOf(i) >= 0) A.hat(rel, i % 2 ? 0.08 : 0.13);
    if (pat.b && pat.b.indexOf(i) >= 0) A.bell(rel, 0.05);
    beatNext += stepDur; beatStep++;
  }
}

/* ---- recording: our own synthesized audio only (no microphone, no permission prompt) ---- */
function recStart() {
  if (!window.MediaRecorder) { msg('Sorry, recording does not work in this browser.'); return; }
  const dest = A.getRecordDest();
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
  mediaType = ''; for (let i = 0; i < types.length; i++) if (MediaRecorder.isTypeSupported(types[i])) { mediaType = types[i]; break; }
  recChunks = []; recBlob = null;
  rec = new MediaRecorder(dest.stream, mediaType ? { mimeType: mediaType } : {});
  rec.ondataavailable = function (e) { if (e.data && e.data.size) recChunks.push(e.data); };
  rec.onstop = function () {
    recBlob = new Blob(recChunks, { type: rec.mimeType || mediaType || 'audio/webm' });
    if (recUrl) URL.revokeObjectURL(recUrl);
    recUrl = URL.createObjectURL(recBlob);
    $('rec-audio').src = recUrl;
    const dl = $('rec-download'); dl.href = recUrl; dl.hidden = false;
    dl.download = 'my-song.' + (/ogg/.test(recBlob.type) ? 'ogg' : /mp4/.test(recBlob.type) ? 'm4a' : 'webm');
    $('rec-play').disabled = false;
    msg('Recording saved! Press Play to hear it.');
  };
  rec.start(200);
  $('rec-start').classList.add('recording'); $('rec-start').disabled = true; $('rec-stop').disabled = false; $('rec-play').disabled = true; $('rec-download').hidden = true;
  msg('● Recording… play something!');
}
function recStop() {
  if (rec && rec.state !== 'inactive') rec.stop();
  $('rec-start').classList.remove('recording'); $('rec-start').disabled = false; $('rec-stop').disabled = true;
}

CC.modes.piano = {
  makey: true,
  enter: function () {
    A.init(); build();
    song = 'jingle'; mode = 'free'; learnIdx = 0; pressedKeys = {};
    setBeat(false); clearGuide(); refreshButtons(); msg('Free Play: touch the pads and make some music!');
  },
  exit: function () {
    stopListen(); stopBeat(); beatOn = false; clearGuide(); recStop();
    CC.NOTES.forEach(function (n) { release(n); });
  },
  onKeyDown: function (e) { if (e.repeat) return; const n = CC.KEY_MAP[e.code]; if (n) press(n); },
  onKeyUp: function (e) { const n = CC.KEY_MAP[e.code]; if (n) release(n); },
  lastRecording: function () { return recBlob; },
  _state: function () { return { song: song, mode: mode, learnIdx: learnIdx, beatOn: beatOn }; },
  _songs: SONGS, _plan: plan
};
})();
