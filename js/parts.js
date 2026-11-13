/* parts.js - Parts of a Computer (Years 1 to 4).
     Find the parts, learn what each one does, sort input and output (Years 3 and 4), then plug in every cable and press the power button
     to watch the computer start. The picture is one SVG; every part is a group with data-part. Levels are plain lists of steps (see lab.js). */
(function () {
'use strict';
const CC = window.CC, L = CC.lab, el = L.el;
const NS = 'http://www.w3.org/2000/svg';

const PARTS = {
  monitor:  { name: 'MONITOR',     look: 'The monitor is the big screen. It looks like a TV.',            job: 'Which part SHOWS you the pictures?',        fact: 'Yes! The monitor is the screen. It shows your work.', at: [360, 52] },
  keyboard: { name: 'KEYBOARD',    look: 'The keyboard has lots of small keys with letters on them.',     job: 'Which part do you TYPE letters with?',      fact: 'Yes! You type letters and numbers on the keyboard.', at: [360, 388] },
  mouse:    { name: 'MOUSE',       look: 'The mouse is small and round. It fits under your hand.',        job: 'Which part moves the POINTER?',             fact: 'Yes! The mouse moves the pointer and clicks things.', at: [512, 398] },
  unit:     { name: 'SYSTEM UNIT', look: 'The system unit is the tall box. It has the power button.',     job: 'Which part is the BRAIN of the computer?',  fact: 'Yes! The system unit does all the thinking.', at: [605, 92] },
  speakers: { name: 'SPEAKERS',    look: 'The speakers are the two boxes with round circles.',            job: 'Which part plays the SOUND?',               fact: 'Yes! Music and sounds come out of the speakers.', at: [203, 182] },
  printer:  { name: 'PRINTER',     look: 'The printer has paper sticking out of the top.',                job: 'Which part puts your work on PAPER?',       fact: 'Yes! The printer prints your work on paper.', at: [100, 188] }
};
const ORDER = ['monitor', 'keyboard', 'mouse', 'unit', 'speakers', 'printer'];

/* ---------- the picture ---------- */
function keysSvg() { let s = ''; for (let r = 0; r < 3; r++) for (let c = 0; c < 13; c++) { if (r === 2 && c > 2 && c < 9) { if (c === 3) s += '<rect x="' + (263 + c * 15) + '" y="' + (328 + r * 11) + '" width="88" height="8" rx="2"/>'; continue; } s += '<rect x="' + (263 + c * 15) + '" y="' + (328 + r * 11) + '" width="12" height="8" rx="2"/>'; } return s; }
function sceneSvg(connect) {
  const spk = function (x) { return '<rect x="' + x + '" y="200" width="46" height="95" rx="8" fill="#3a3e8a" stroke="#15163a" stroke-width="3"/><circle cx="' + (x + 23) + '" cy="228" r="9" fill="#15163a" stroke="#8f95e0" stroke-width="2"/><circle class="cone" cx="' + (x + 23) + '" cy="265" r="15" fill="#15163a" stroke="#8f95e0" stroke-width="3"/>'; };
  return '<svg class="pc-svg" viewBox="0 0 800 450" xmlns="' + NS + '" role="img" aria-label="A computer on a desk">' +
    '<defs><linearGradient id="pcWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe6ff"/><stop offset="1" stop-color="#e9f7ff"/></linearGradient><linearGradient id="pcDesk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9a066"/><stop offset="1" stop-color="#b9793f"/></linearGradient><linearGradient id="pcWp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4d8dff"/><stop offset="1" stop-color="#22c6c6"/></linearGradient></defs>' +
    '<rect width="800" height="300" fill="url(#pcWall)"/><rect y="296" width="800" height="154" fill="url(#pcDesk)"/><rect y="296" width="800" height="8" fill="#8a5527" opacity=".5"/>' +
    '<g class="pc-cables"></g>' +
    '<g class="pc-part" data-part="printer"><rect x="62" y="203" width="76" height="40" fill="#fff" stroke="#15163a" stroke-width="3"/><g class="sheet"><rect x="62" y="203" width="76" height="40" fill="#fff" stroke="#15163a" stroke-width="3"/><path d="M72 214 H128 M72 222 H128 M72 230 H110" stroke="#9aa0d8" stroke-width="3"/></g><rect x="40" y="235" width="120" height="60" rx="9" fill="#e9ebf5" stroke="#15163a" stroke-width="3"/><rect x="55" y="282" width="90" height="9" rx="3" fill="#15163a"/><circle cx="142" cy="252" r="5" fill="#6bcb77" stroke="#15163a" stroke-width="2"/><rect x="54" y="248" width="46" height="8" rx="3" fill="#9aa0d8"/></g>' +
    '<g class="pc-part" data-part="speakers">' + spk(180) + spk(484) + '<g class="notes" opacity="0"><text x="150" y="190" font-size="30">🎵</text><text x="528" y="186" font-size="30">🎶</text></g></g>' +
    '<g class="pc-part" data-part="monitor"><rect x="348" y="218" width="24" height="44" fill="#55598f" stroke="#15163a" stroke-width="3"/><rect x="305" y="258" width="110" height="14" rx="7" fill="#55598f" stroke="#15163a" stroke-width="3"/><rect x="250" y="70" width="220" height="152" rx="11" fill="#2b2f5e" stroke="#15163a" stroke-width="3"/><rect class="scr" x="262" y="82" width="196" height="124" rx="4" fill="#0b0c1f"/><g class="pc-screen"></g><circle class="mled" cx="456" cy="214" r="3.5" fill="#55598f"/></g>' +
    '<g class="pc-part" data-part="unit"><rect x="560" y="110" width="90" height="190" rx="9" fill="#dfe3f7" stroke="#15163a" stroke-width="3"/><rect x="572" y="124" width="66" height="10" rx="3" fill="#9aa0d8"/><rect x="572" y="140" width="66" height="6" rx="3" fill="#b9bfe6"/><g class="pc-power"><circle cx="605" cy="172" r="13" fill="#fff" stroke="#15163a" stroke-width="3"/><path d="M605 163 V172 M599.5 166.5 A7.5 7.5 0 1 0 610.5 166.5" fill="none" stroke="#15163a" stroke-width="2.6" stroke-linecap="round"/></g><circle class="led" cx="605" cy="199" r="4.5" fill="#9aa0d8" stroke="#15163a" stroke-width="1.5"/><circle cx="605" cy="252" r="24" fill="#c7cbee" stroke="#15163a" stroke-width="3"/><g class="fan"><path d="M605 252 L605 232 A20 20 0 0 1 622 242 Z M605 252 L622 262 A20 20 0 0 1 605 272 Z M605 252 L588 262 A20 20 0 0 1 588 242 Z" fill="#55598f"/></g><circle cx="605" cy="252" r="4" fill="#15163a"/></g>' +
    '<g class="pc-part" data-part="keyboard"><rect x="255" y="321" width="210" height="46" rx="8" fill="#f5f4ff" stroke="#15163a" stroke-width="3"/><g class="keys" fill="#b9bfe6">' + keysSvg() + '</g></g>' +
    '<g class="pc-part" data-part="mouse"><ellipse cx="512" cy="350" rx="18" ry="27" fill="#f5f4ff" stroke="#15163a" stroke-width="3"/><path d="M494 343 H530 M512 323 V343" stroke="#15163a" stroke-width="2.5"/><rect class="whl" x="509" y="328" width="6" height="11" rx="3" fill="#9aa0d8"/></g>' +
    (connect ?
      '<path d="M650 150 L672 110 M650 280 L672 300" stroke="#15163a" stroke-width="2" stroke-dasharray="5 5" fill="none" opacity=".6"/>' +
      '<g class="pc-panel"><rect x="672" y="66" width="118" height="238" rx="12" fill="#2b2f5e" stroke="#15163a" stroke-width="3"/><text x="731" y="86" text-anchor="middle" font-size="11" font-weight="bold" fill="#fff">BACK OF THE BOX</text>' +
        '<g class="pc-port" data-port="video" transform="translate(712 118)"><path d="M-20,-12 H20 L15,12 H-15 Z" fill="#0b0c1f" stroke="#4d8dff" stroke-width="4"/><text x="34" y="6" font-size="18">🖥️</text></g>' +
        '<g class="pc-port" data-port="usb1" transform="translate(712 166)"><rect x="-17" y="-10" width="34" height="20" rx="3" fill="#0b0c1f" stroke="#c9a6ff" stroke-width="4"/><text x="34" y="6" font-size="12" font-weight="bold" fill="#fff">USB</text></g>' +
        '<g class="pc-port" data-port="usb2" transform="translate(712 212)"><rect x="-17" y="-10" width="34" height="20" rx="3" fill="#0b0c1f" stroke="#c9a6ff" stroke-width="4"/><text x="34" y="6" font-size="12" font-weight="bold" fill="#fff">USB</text></g>' +
        '<g class="pc-port" data-port="audio" transform="translate(712 262)"><circle r="12" fill="#0b0c1f" stroke="#6bcb77" stroke-width="4"/><text x="34" y="6" font-size="18">🔊</text></g></g>' +
      '<g class="pc-port" data-port="power" transform="translate(735 382)"><rect x="-44" y="-30" width="88" height="60" rx="10" fill="#fff" stroke="#15163a" stroke-width="3"/><rect x="-22" y="-16" width="44" height="32" rx="6" fill="#0b0c1f" stroke="#ff9f45" stroke-width="4"/><text x="0" y="-36" text-anchor="middle" font-size="12" font-weight="bold" fill="#15163a">POWER</text><text x="0" y="6" text-anchor="middle" font-size="14">⚡</text></g>' +
      '<g class="pc-plugs"></g>' : '') +
    '<g class="pc-tags"></g></svg>';
}
function tag(svg, id) {
  const p = PARTS[id], g = document.createElementNS(NS, 'g'), w = p.name.length * 9.5 + 22; g.setAttribute('class', 'pc-tag');
  g.innerHTML = '<rect x="' + (p.at[0] - w / 2) + '" y="' + (p.at[1] - 15) + '" width="' + w + '" height="24" rx="12" fill="#15163a"/><text x="' + p.at[0] + '" y="' + (p.at[1] + 3) + '" text-anchor="middle" font-size="14" font-weight="bold" fill="#ffe14d">' + p.name + '</text>';
  svg.querySelector('.pc-tags').appendChild(g);
}
function glow(svg, id, on) { const n = svg.querySelector('[data-part="' + id + '"]'); if (n) n.classList.toggle('glow', on); }

/* ---------- levels 1 and 2: click the right part ---------- */
function findLevel(kind) {
  return function (body, api) {
    body.innerHTML = '<div class="pc-wrap">' + sceneSvg(false) + '</div>';
    const svg = body.querySelector('svg');
    svg.classList.add('pick');
    svg.addEventListener('click', function (e) {
      const g = e.target.closest('.pc-part'), s = api.step(); if (!g || !s || api.st.locked) return;
      const id = g.dataset.part;
      if (id === s.part) { ORDER.forEach(function (x) { glow(svg, x, false); }); if (!svg.querySelector('.pc-tag[data-id="' + id + '"]')) { tag(svg, id); svg.querySelector('.pc-tags').lastChild.dataset.id = id; } g.classList.add('found'); api.check({ part: id }); }
      else api.miss('That is the ' + PARTS[id].name + '. ' + (kind === 'find' ? 'Find the ' + PARTS[s.part].name + '.' : 'Try another part.'));
    });
    api.onTip = function (s) { glow(svg, s.part, true); };
    api.onStep = function () { ORDER.forEach(function (x) { glow(svg, x, false); }); };
  };
}
function findSteps(kind) {
  return ORDER.map(function (id) {
    const p = PARTS[id];
    return kind === 'find'
      ? { part: id, say: 'Click the ' + p.name, win: 'That is the ' + p.name.toLowerCase() + '!', tip: [p.look, 'It is glowing now. Click it once.'], ok: function (ev) { return ev.part === id; } }
      : { part: id, say: p.job, win: p.fact, tip: ['Think: ' + p.look, 'The right part is glowing now. Click it once.'], ok: function (ev) { return ev.part === id; } };
  });
}

/* ---------- level: input or output ---------- */
const IO = [['⌨️', 'Keyboard', 'in', 'You press the keys. Letters go IN to the computer.'], ['🖥️', 'Monitor', 'out', 'Pictures come OUT of the computer for you to see.'], ['🖱️', 'Mouse', 'in', 'You move it. Your moves go IN to the computer.'],
  ['🔊', 'Speakers', 'out', 'Sound comes OUT of the computer for you to hear.'], ['🖨️', 'Printer', 'out', 'Your work comes OUT on paper.'], ['🎤', 'Microphone', 'in', 'Your voice goes IN to the computer.'], ['📷', 'Webcam', 'in', 'Your picture goes IN to the computer.'], ['🎧', 'Headphones', 'out', 'Sound comes OUT for your ears only.']];
function ioBuild(body, api) {
  body.innerHTML = '<div class="pc-io"><button type="button" class="pc-bin in" data-v="in"><b>⬇ INPUT</b><span>goes IN to the computer</span><div class="got"></div></button><div class="pc-dev"><span class="ic"></span><b class="nm"></b></div><button type="button" class="pc-bin out" data-v="out"><b>OUTPUT ⬆</b><span>comes OUT of the computer</span><div class="got"></div></button></div>';
  const dev = body.querySelector('.pc-dev');
  api.onStep = function (s) { dev.querySelector('.ic').textContent = s.dev[0]; dev.querySelector('.nm').textContent = s.dev[1]; dev.classList.remove('pop'); void dev.offsetWidth; dev.classList.add('pop'); body.querySelectorAll('.pc-bin').forEach(function (b) { b.classList.remove('glow'); }); };
  api.onTip = function (s) { body.querySelector('.pc-bin.' + s.dev[2]).classList.add('glow'); };
  body.querySelectorAll('.pc-bin').forEach(function (b) {
    b.addEventListener('click', function () {
      b.blur(); const s = api.step(); if (!s || api.st.locked) return;
      if (b.dataset.v === s.dev[2]) { const i = el('i', '', s.dev[0]); b.querySelector('.got').appendChild(i); api.check({ v: b.dataset.v }); }
      else api.miss('Not that one. ' + s.dev[3]);
    });
  });
}
const ioSteps = IO.map(function (d) { return { dev: d, say: 'Is the ' + d[1].toLowerCase() + ' INPUT or OUTPUT?', win: d[3], tip: ['INPUT sends something IN to the computer. OUTPUT brings something OUT to you.', d[3]], ok: function (ev) { return ev.v === d[2]; } }; });

/* ---------- level: plug in the cables, then power on ---------- */
const CABLES = [
  { id: 'monitor',  from: [360, 268], home: [318, 412], port: ['video'], color: '#4d8dff', shape: '<path d="M-16,-9 H16 L12,9 H-12 Z" fill="#4d8dff" stroke="#15163a" stroke-width="2.5"/>' },
  { id: 'keyboard', from: [300, 366], home: [404, 418], port: ['usb1', 'usb2'], color: '#c9a6ff', shape: '<rect x="-13" y="-7" width="26" height="14" rx="2" fill="#c9a6ff" stroke="#15163a" stroke-width="2.5"/><text y="-11" text-anchor="middle" font-size="13">⌨️</text>' },
  { id: 'mouse',    from: [512, 324], home: [560, 420], port: ['usb1', 'usb2'], color: '#c9a6ff', shape: '<rect x="-13" y="-7" width="26" height="14" rx="2" fill="#c9a6ff" stroke="#15163a" stroke-width="2.5"/><text y="-11" text-anchor="middle" font-size="13">🖱️</text>' },
  { id: 'speakers', from: [203, 296], home: [215, 412], port: ['audio'], color: '#6bcb77', shape: '<circle r="9" fill="#6bcb77" stroke="#15163a" stroke-width="2.5"/><circle r="3" fill="#15163a"/>' },
  { id: 'power',    from: [628, 300], home: [640, 420], port: ['power'], color: '#ff9f45', shape: '<rect x="-17" y="-12" width="34" height="24" rx="5" fill="#ff9f45" stroke="#15163a" stroke-width="2.5"/><path d="M-7 -4 V4 M7 -4 V4 M0 2 V8" stroke="#15163a" stroke-width="3" stroke-linecap="round"/>' }
];
const PORT_AT = { video: [712, 118], usb1: [712, 166], usb2: [712, 212], audio: [712, 262], power: [735, 382] };
const PLUG_NAME = { monitor: 'monitor cable', keyboard: 'keyboard cable', mouse: 'mouse cable', speakers: 'speaker cable', power: 'power cable' };
function connectBuild(body, api) {
  body.innerHTML = '<div class="pc-wrap">' + sceneSvg(true) + '</div>';
  const svg = body.querySelector('svg'), cabG = svg.querySelector('.pc-cables'), plugG = svg.querySelector('.pc-plugs'), st = { in: {}, used: {}, on: false, booting: false };
  const pt = function (e) { const m = svg.getScreenCTM().inverse(); return { x: e.clientX * m.a + e.clientY * m.c + m.e, y: e.clientX * m.b + e.clientY * m.d + m.f }; };
  const plugs = {};
  CABLES.forEach(function (c) {
    const path = document.createElementNS(NS, 'path'); path.setAttribute('class', 'pc-cable'); path.setAttribute('stroke', c.color); cabG.appendChild(path);
    const g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'pc-plug'); g.dataset.id = c.id; g.innerHTML = '<circle r="24" fill="transparent"/>' + c.shape; plugG.appendChild(g);
    const P = plugs[c.id] = { c: c, g: g, path: path, x: c.home[0], y: c.home[1] };
    const place = function (x, y) { P.x = x; P.y = y; g.setAttribute('transform', 'translate(' + x + ' ' + y + ')'); const mx = (c.from[0] + x) / 2, my = Math.max(c.from[1], y) + 40; path.setAttribute('d', 'M' + c.from[0] + ' ' + c.from[1] + ' Q' + mx + ' ' + my + ' ' + x + ' ' + y); };
    P.place = place; place(P.x, P.y);
    let drag = null;
    g.addEventListener('pointerdown', function (e) { if (st.in[c.id] || st.booting) return; e.preventDefault(); try { g.setPointerCapture(e.pointerId); } catch (x) { } const p = pt(e); drag = { dx: P.x - p.x, dy: P.y - p.y }; g.classList.add('drag'); L.sfx('clink'); });
    g.addEventListener('pointermove', function (e) { if (!drag) return; const p = pt(e); place(Math.max(15, Math.min(785, p.x + drag.dx)), Math.max(60, Math.min(435, p.y + drag.dy))); });
    const up = function () {
      if (!drag) return; drag = null; g.classList.remove('drag');
      let best = null, bd = 46; Object.keys(PORT_AT).forEach(function (k) { const a = PORT_AT[k], d = Math.hypot(a[0] - P.x, a[1] - P.y); if (d < bd) { bd = d; best = k; } });
      if (best && c.port.indexOf(best) >= 0 && !st.used[best]) {
        st.in[c.id] = best; st.used[best] = c.id; place(PORT_AT[best][0], PORT_AT[best][1]); g.classList.add('in'); svg.querySelectorAll('.glow').forEach(function (n) { n.classList.remove('glow'); }); L.sfx('pickup'); api.check({ plug: c.id });
        if (!api.st.locked) api.note('The ' + PLUG_NAME[c.id] + ' is in!');
      } else {
        place(c.home[0], c.home[1]);
        if (best) api.miss(st.used[best] && c.port.indexOf(best) >= 0 ? 'That socket is full. Try the other one.' : 'The ' + PLUG_NAME[c.id] + ' does not fit there. Match the colour and the shape.');
      }
    };
    g.addEventListener('pointerup', up); g.addEventListener('pointercancel', up);
  });
  api.onTip = function (s) {
    svg.querySelectorAll('.glow').forEach(function (n) { n.classList.remove('glow'); });
    if (s.plug) { plugs[s.plug].g.classList.add('glow'); plugs[s.plug].c.port.forEach(function (k) { if (!st.used[k]) svg.querySelector('[data-port="' + k + '"]').classList.add('glow'); }); }
    else svg.querySelector('.pc-power').classList.add('glow');
  };
  api.onStep = function (s) { svg.querySelectorAll('.glow').forEach(function (n) { n.classList.remove('glow'); }); if (!s.plug) svg.querySelector('.pc-power').classList.add('ready'); setTimeout(function () { api.check({}); }, 50); };
  api.plugged = function (id) { return !!st.in[id]; };
  svg.querySelector('.pc-power').addEventListener('click', function () {
    if (st.booting || st.on) return;
    const missing = CABLES.filter(function (c) { return !st.in[c.id]; });
    if (missing.length) { api.miss(missing.some(function (c) { return c.id === 'power'; }) ? 'Nothing happens! The power cable is not plugged in yet.' : 'Not yet. Plug in every cable first.'); return; }
    st.booting = true; boot(svg, function () { st.on = true; st.booting = false; api.check({ power: true }); });
  });
  api.isOn = function () { return st.on; };
}
/* the computer starts: the light, the fan, the start-up words, the loading bar, then the desktop and a little tune */
function boot(svg, done) {
  const scr = svg.querySelector('.pc-screen'), t = function (ms, f) { setTimeout(function () { if (svg.isConnected) f(); }, ms); };
  svg.classList.add('on'); svg.querySelector('.led').setAttribute('fill', '#6bcb77'); svg.querySelector('.mled').setAttribute('fill', '#6bcb77'); L.tone(120, { dur: .5, type: 'sawtooth', vol: .05 }); L.tone(660, { dur: .1, vol: .1 });
  const line = function (y, txt, fill) { return '<text x="270" y="' + y + '" font-size="9" font-family="monospace" fill="' + (fill || '#8fe39a') + '">' + txt + '</text>'; };
  t(500, function () { scr.innerHTML = line(98, 'Tech Explorers PC'); L.sfx('tick'); });
  t(1000, function () { scr.innerHTML += line(112, 'Keyboard ....... found'); L.sfx('tick'); svg.querySelector('.keys').classList.add('lit'); });
  t(1500, function () { scr.innerHTML += line(126, 'Mouse .......... found'); L.sfx('tick'); svg.querySelector('.whl').setAttribute('fill', '#ff5c72'); });
  t(2000, function () { scr.innerHTML += line(140, 'Speakers ....... found'); L.sfx('tick'); });
  t(2500, function () { scr.innerHTML += line(154, 'Memory ......... OK') + line(176, 'Starting up ...', '#fff'); L.sfx('tick'); });
  t(3200, function () { scr.innerHTML = '<circle cx="360" cy="128" r="18" fill="none" stroke="#4d8dff" stroke-width="5" stroke-dasharray="80 40" class="spin"/><rect x="300" y="170" width="120" height="9" rx="4.5" fill="#2b2f5e"/><rect class="bar" x="300" y="170" width="0" height="9" rx="4.5" fill="#6bcb77"/><text x="360" y="196" text-anchor="middle" font-size="9" fill="#fff">Loading ...</text>'; });
  for (let k = 1; k <= 10; k++) t(3200 + k * 180, function () { const b = scr.querySelector('.bar'); if (b) b.setAttribute('width', k * 12); });
  t(5300, function () {
    scr.innerHTML = '<rect x="262" y="82" width="196" height="124" rx="4" fill="url(#pcWp)"/><circle cx="420" cy="112" r="16" fill="#ffe14d" opacity=".9"/><path d="M262 180 Q320 140 372 172 T458 160 V196 H262 Z" fill="#3fa84f" opacity=".85"/>' +
      [0, 1, 2].map(function (i) { return '<text x="270" y="' + (104 + i * 26) + '" font-size="16">' + ['📁', '🎨', '🌐'][i] + '</text>'; }).join('') +
      '<rect x="262" y="194" width="196" height="12" fill="#15163a" opacity=".85"/><rect x="266" y="197" width="8" height="6" rx="1.5" fill="#4d8dff"/><text x="452" y="203" text-anchor="end" font-size="7" fill="#fff">' + new Date().getHours() + ':' + ('0' + new Date().getMinutes()).slice(-2) + '</text><text class="hello" x="360" y="150" text-anchor="middle" font-size="18" font-weight="bold" fill="#fff" stroke="#15163a" stroke-width=".6">Hello!</text>';
    svg.querySelector('.notes').setAttribute('opacity', '1'); svg.classList.add('booted');
    [523, 659, 784, 1047].forEach(function (f, i) { L.tone(f, { delay: i * .16, dur: .28, vol: .14 }); });
  });
  t(6600, done);
}
const connectSteps = [
  { plug: 'monitor', say: 'Drag the BLUE monitor plug to the blue socket', win: 'The monitor is connected!', tip: ['Find the blue plug at the front of the desk.', 'Press and hold it, then slide it to the blue socket on the right.', 'Let go. It clicks in.'] },
  { plug: 'keyboard', say: 'Plug in the keyboard ⌨️', sub: 'It uses a USB socket', win: 'The keyboard is connected!', tip: ['Find the plug with the keyboard picture.', 'Drag it to a socket that says USB.', 'Let go.'] },
  { plug: 'mouse', say: 'Plug in the mouse 🖱️', sub: 'It uses the other USB socket', win: 'The mouse is connected!', tip: ['Find the plug with the mouse picture.', 'Drag it to the empty USB socket.', 'Let go.'] },
  { plug: 'speakers', say: 'Plug in the speakers', sub: 'The round green plug', win: 'The speakers are connected!', tip: ['Find the round green plug.', 'Drag it to the round green socket.', 'Let go.'] },
  { plug: 'power', say: 'Plug the power cable into the wall ⚡', win: 'The computer has power!', tip: ['Find the orange plug under the system unit.', 'Drag it to the POWER socket on the right.', 'Let go.'] },
  { say: 'Now press the power button ⏻', sub: 'It is on the system unit', win: 'The computer is ON! Well done!', wait: 2600, tip: ['Look at the tall box, the system unit.', 'Find the round button with the ⏻ sign. It is glowing.', 'Click it once.'], ok: function (ev, api) { return api.isOn(); } }
];
connectSteps.forEach(function (s) { if (s.plug) s.ok = function (ev, api) { return api.plugged(s.plug); }; });

CC.modes.parts = L.game({
  id: 'parts', icon: '🖥️', title: 'Parts of a Computer', color: '#4d8dff', cert: { hero: 'Computer Builder', art: 'parts', hue: 216 },
  sub: function (y) { return y <= 2 ? 'Find the parts, plug them in and switch the computer on!' : 'Name the parts, sort input and output, then build and start the computer.'; },
  stage: function () { return document.getElementById('stage-parts'); }, root: function () { return document.getElementById('parts-root'); },
  speak: function (y) { return y <= 2; },
  levels: function (y) {
    const a = [
      { id: 'find', title: 'Find the parts', icon: '🔎', steps: findSteps('find'), build: findLevel('find'), learned: 'You know the name of every part!' },
      { id: 'jobs', title: 'What does it do?', icon: '💡', steps: findSteps('jobs'), build: findLevel('jobs'), learned: 'You know what every part does!' }];
    if (y >= 3) a.push({ id: 'io', title: 'Input or output?', icon: '🔁', steps: ioSteps, build: ioBuild, learned: 'Input goes IN. Output comes OUT.' });
    a.push({ id: 'connect', title: 'Plug in and power on', icon: '🔌', steps: connectSteps, build: connectBuild, learned: 'You built a computer and switched it on!' });
    return a;
  }
});
})();
