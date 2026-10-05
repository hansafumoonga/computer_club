/* piano.js - Session 2: 5-note piano (C D E F G), songs, Free/Listen/Learn modes,
   synthesized backing beat, and recording of the app's own sound (never the microphone). */
(function () {
'use strict';
const A = CC.audio;

/* ---- songs: [note, beats]. Everything stays inside C D E F G. beat = which backing beat style ---- */
const SONGS = {
  jingle: { name: '🔔 Jingle Bells', bpm: 124, beat: 'bells', notes: [
    ['E',1],['E',1],['E',2],['E',1],['E',1],['E',2],['E',1],['G',1],['C',1.5],['D',.5],['E',4],
    ['F',1],['F',1],['F',1.5],['F',.5],['F',1],['E',1],['E',1],['E',.5],['E',.5],['E',1],['D',1],['D',1],['E',1],['D',2],['G',2],
    ['E',1],['E',1],['E',2],['E',1],['E',1],['E',2],['E',1],['G',1],['C',1.5],['D',.5],['E',4],
    ['F',1],['F',1],['F',1],['F',1],['F',1],['E',1],['E',1],['E',.5],['E',.5],['G',1],['G',1],['F',1],['D',1],['C',4]] },
  birthday: { name: '🎂 Happy Birthday', bpm: 100, beat: 'waltz', notes: [   // 3/4 waltz; high phrases capped at G
    ['C',.75],['C',.25],['D',1],['C',1],['F',1],['E',2],
    ['C',.75],['C',.25],['D',1],['C',1],['G',1],['F',2],
    ['G',.75],['G',.25],['G',1],['E',1],['F',1],['E',1],['D',2],
    ['F',.75],['F',.25],['E',1],['C',1],['D',1],['C',3]] },
  ode: { name: '🎶 Ode to Joy', bpm: 112, beat: 'standard', notes: [
    ['E',1],['E',1],['F',1],['G',1],['G',1],['F',1],['E',1],['D',1],['C',1],['C',1],['D',1],['E',1],['E',1.5],['D',.5],['D',2],
    ['E',1],['E',1],['F',1],['G',1],['G',1],['F',1],['E',1],['D',1],['C',1],['C',1],['D',1],['E',1],['D',1.5],['C',.5],['C',2]] }
};
/* ---- backing beats: steps are 8th notes. k=kick s=snare h=hat b=bell shimmer ---- */
const BEATS = {
  standard: { steps: 8, k: [0, 4], s: [2, 6], h: [0, 1, 2, 3, 4, 5, 6, 7] },
  bells:    { steps: 8, k: [0, 4], s: [2, 6], h: [1, 3, 5, 7], b: [0, 2, 4, 6] },
  waltz:    { steps: 6, k: [0], s: [2, 4], h: [1, 3, 5] }
};

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
    const b = document.createElement('button'); b.className = 'btn'; b.textContent = SONGS[id].name; b.dataset.song = id;
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
function clearGuide() { CC.NOTES.forEach(function (n) { keyEls[n].classList.remove('guide'); }); }
function stopListen() { listenTimers.forEach(clearTimeout); listenTimers = []; }

function setSong(id) { song = id; stopListen(); if (beatOn) { stopBeat(); startBeat(); } setMode(mode === 'free' ? 'free' : mode); }
function setMode(m) {
  stopListen(); clearGuide(); mode = m; learnIdx = 0;
  if (m === 'free') msg('Free Play: touch the pads and make some music!');
  if (m === 'listen') startListen();
  if (m === 'learn') { msg('Learn: press the glowing key to play ' + SONGS[song].name.slice(3) + '!'); showGuide(); }
  refreshButtons();
}
function showGuide() { clearGuide(); const n = SONGS[song].notes[learnIdx]; if (n) keyEls[n[0]].classList.add('guide'); }

/* ---- sound + visual for one note ---- */
function press(n) {
  A.init();
  if (pressedKeys[n]) return; pressedKeys[n] = true;
  keyEls[n].classList.add('active'); A.pianoNote(n);
  if (mode === 'learn') {
    const want = SONGS[song].notes[learnIdx];
    if (want && want[0] === n) {
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
  const s = SONGS[song], spb = 60 / s.bpm; let t = 0.4;
  msg('Listen to ' + s.name.slice(3) + '…');
  const wasBeat = beatOn; if (!beatOn) setBeat(true);
  s.notes.forEach(function (nb) {
    const n = nb[0], dur = nb[1] * spb;
    listenTimers.push(setTimeout(function () { A.pianoNote(n, { dur: Math.max(0.35, dur * 1.1) }); flash(n, Math.min(300, dur * 900)); }, t * 1000));
    t += dur;
  });
  listenTimers.push(setTimeout(function () {
    if (!wasBeat) setBeat(false);
    msg('That was ' + s.name.slice(3) + '! Now try Learn mode, or play it yourself!');
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
    if (pat.k.indexOf(i) >= 0) A.kick(rel, s.beat === 'bells' ? 0.4 : 0.55);
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
    setBeat(false); refreshButtons(); msg('Free Play: touch the pads and make some music!');
  },
  exit: function () {
    stopListen(); stopBeat(); beatOn = false; clearGuide(); recStop();
    CC.NOTES.forEach(function (n) { release(n); });
  },
  onKeyDown: function (e) { if (e.repeat) return; const n = CC.KEY_MAP[e.code]; if (n) press(n); },
  onKeyUp: function (e) { const n = CC.KEY_MAP[e.code]; if (n) release(n); },
  lastRecording: function () { return recBlob; },
  _state: function () { return { song: song, mode: mode, learnIdx: learnIdx, beatOn: beatOn }; }
};
})();
