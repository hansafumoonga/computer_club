/* parts.js - Parts of a Computer (Years 1 to 4).
     Every level teaches first (a short lesson with pictures, read out loud for Years 1 and 2), then asks.
       1 Meet the parts      the guide names a part and says what it does, the part glows, the child clicks it
       2 Find the parts      the same parts, with no glow
       3 What does it do?    match the job to the part
       4 Kinds of computer   desktop, all-in-one (no system unit to see), laptop, iPad or tablet, iPhone or phone
       5 Input or output?    Years 3 and 4
       6 Plug in and power on        a desktop: five cables, then the power button, and the computer starts
       7 Set up an all-in-one        fewer cables: the computer is inside the screen
   The picture is one SVG; every part is a group with data-part. Levels are plain lists of steps (see lab.js). */
(function () {
'use strict';
const CC = window.CC, L = CC.lab, el = L.el;
const NS = 'http://www.w3.org/2000/svg';

const PARTS = {
  monitor:  { name: 'MONITOR',     look: 'The monitor is the screen. It displays the output of the computer.',        does: 'It displays pictures and text.',            job: 'Which component DISPLAYS pictures and text?',       fact: 'Yes! The monitor displays the pictures and text.', at: [360, 50], box: [232, 56, 256, 232] },
  keyboard: { name: 'KEYBOARD',    look: 'The keyboard is a set of keys marked with letters, numbers and symbols.', does: 'You press its keys to enter letters and numbers.',     job: 'Which component do you use to TYPE letters?',     fact: 'Yes! The keyboard is used to type letters and numbers.', at: [360, 392], box: [240, 306, 240, 76] },
  mouse:    { name: 'MOUSE',       look: 'The mouse is a small, curved device. It fits under your hand.',    does: 'You move it to move the pointer, and press its buttons to click.',      job: 'Which component moves the POINTER?',            fact: 'Yes! The mouse moves the pointer and clicks on items on the screen.', at: [512, 402], box: [470, 306, 86, 86] },
  unit:     { name: 'SYSTEM UNIT', look: 'The system unit is the tall case. It has the power button.', does: 'The processor, which carries out instructions, is inside it.',       job: 'Which component contains the PROCESSOR?', fact: 'Yes! The processor is inside the system unit.', at: [606, 88], box: [540, 96, 134, 220] },
  speakers: { name: 'SPEAKERS',    look: 'The speakers are the two boxes with round cones.',        does: 'They produce music and other sounds.',                  job: 'Which component produces the SOUND?',              fact: 'Yes! The speakers produce music and other sounds.', at: [203, 180], box: [166, 186, 76, 118] },
  printer:  { name: 'PRINTER',     look: 'The printer has paper coming out of the top.',            does: 'It prints your work on paper.',                         job: 'Which component prints your work on PAPER?',      fact: 'Yes! The printer prints your work on paper.', at: [98, 186], box: [26, 190, 146, 116] }
};
const ORDER = ['monitor', 'keyboard', 'mouse', 'unit', 'speakers', 'printer'];

/* ---------- the picture ---------- */
const DEFS = '<defs>' +
  '<linearGradient id="pcWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfeaff"/><stop offset="1" stop-color="#eef8ff"/></linearGradient>' +
  '<linearGradient id="pcDesk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2ad74"/><stop offset="1" stop-color="#b9793f"/></linearGradient>' +
  '<linearGradient id="pcWp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4d8dff"/><stop offset="1" stop-color="#22c6c6"/></linearGradient>' +
  '<linearGradient id="pcDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#454a85"/><stop offset="1" stop-color="#23264f"/></linearGradient>' +
  '<linearGradient id="pcLight" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#e3e6f6"/><stop offset="1" stop-color="#c3c8e6"/></linearGradient>' +
  '<linearGradient id="pcMetal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9dcec"/><stop offset="1" stop-color="#9ea4c8"/></linearGradient>' +
  '<linearGradient id="pcGlass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1c2050"/><stop offset="1" stop-color="#090a1c"/></linearGradient>' +
  '<radialGradient id="pcCone" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#6a70c0"/><stop offset="1" stop-color="#15163a"/></radialGradient>' +
  '<linearGradient id="pcBezel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3d49"/><stop offset=".5" stop-color="#1f212b"/><stop offset="1" stop-color="#101117"/></linearGradient>' +
  '<linearGradient id="pcCase" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f6f7fb"/><stop offset=".55" stop-color="#e1e4ef"/><stop offset="1" stop-color="#bcc1d8"/></linearGradient>' +
  '<linearGradient id="pcSide" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b3b9d4"/><stop offset="1" stop-color="#8b92b6"/></linearGradient>' +
  '<radialGradient id="pcMouse" cx=".35" cy=".25" r=".9"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#e6e9f6"/><stop offset="1" stop-color="#b6bcd8"/></radialGradient>' +
  '<linearGradient id="pcCab" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a4e66"/><stop offset=".5" stop-color="#2e3146"/><stop offset="1" stop-color="#1b1d2e"/></linearGradient>' +
  '<linearGradient id="pcGlossy" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".24"/><stop offset=".5" stop-color="#fff" stop-opacity=".05"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
  '<filter id="pcSh" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#3a2408" flood-opacity=".35"/></filter></defs>';
const S3 = 'stroke="#15163a" stroke-width="3" stroke-linejoin="round"';
const S1 = 'stroke="#1b1d33" stroke-opacity=".6" stroke-width="1.4" stroke-linejoin="round"';
/* a full keyboard: function row, number row, three letter rows and the space row. Each key is a cap over a darker edge. */
function keysSvg() {
  const ones = function (n) { return new Array(n).fill(1); }, U = 13.7, X0 = 257.5;
  const rows = [[319.2, 4.4, ones(15)], [325.6, 6.2, ones(13).concat([2])], [333, 6.2, [1.5].concat(ones(12), [1.5])], [340.4, 6.2, [1.75].concat(ones(11), [2.25])], [347.8, 6.2, [2.25].concat(ones(10), [2.75])], [355.2, 6.2, [1.25, 1.25, 1.25, 6.25, 1.25, 1.25, 1.25, 1.25]]];
  let caps = '', edge = '';
  rows.forEach(function (r) { let x = X0; r[2].forEach(function (u) { const w = (u * U - 1.8).toFixed(1), xx = (x + 0.9).toFixed(1); caps += '<rect x="' + xx + '" y="' + r[0] + '" width="' + w + '" height="' + r[1] + '" rx="1.4"/>'; edge += '<rect x="' + xx + '" y="' + (r[0] + 1.1).toFixed(1) + '" width="' + w + '" height="' + r[1] + '" rx="1.4"/>'; x += u * U; }); });
  return '<g fill="#8e95bd">' + edge + '</g><g class="keys" fill="#fbfbff">' + caps + '</g>';
}
function monitorSvg(aio) {
  const bh = aio ? 170 : 150, nk = aio ? 224 : 210;
  return '<g class="pc-part" data-part="monitor" filter="url(#pcSh)">' +
    '<ellipse cx="360" cy="277" rx="66" ry="7" fill="#3a2408" opacity=".22"/><ellipse cx="360" cy="270" rx="56" ry="8" fill="url(#pcMetal)" ' + S1 + '/><ellipse cx="360" cy="268" rx="44" ry="3.5" fill="#fff" opacity=".4"/>' +
    '<path d="M345 ' + nk + ' h30 l6 ' + (270 - nk) + ' h-42 z" fill="url(#pcMetal)" ' + S1 + '/>' +
    '<rect x="250" y="70" width="220" height="' + bh + '" rx="9" fill="url(#pcBezel)" ' + S1 + '/><path d="M259 71.5 h202" stroke="#fff" stroke-opacity=".22"/>' +
    '<rect class="scr" x="262" y="82" width="196" height="124" rx="3" fill="url(#pcGlass)"/><rect x="262" y="82" width="196" height="124" rx="3" fill="none" stroke="#000" stroke-opacity=".7"/><g class="pc-screen"></g>' +
    '<path class="shine" d="M262 82 h118 l-72 124 h-46 z" fill="url(#pcGlossy)" pointer-events="none"/>' +
    (aio ? '<circle cx="360" cy="76" r="2.2" fill="#05060f"/><rect x="338" y="222" width="44" height="3" rx="1.5" fill="#7a7f9a"/><g class="pc-power"><circle cx="452" cy="223" r="10" fill="#fff" stroke="#15163a" stroke-width="2.5"/><path d="M452 217 V223 M448 219 A5.6 5.6 0 1 0 456 219" fill="none" stroke="#15163a" stroke-width="2.2" stroke-linecap="round"/></g><circle class="led" cx="430" cy="223" r="3.5" fill="#6f75b5"/><circle class="mled" cx="-10" cy="-10" r="1"/>'
         : '<rect x="344" y="211" width="32" height="3" rx="1.5" fill="#7a7f9a"/><circle class="mled" cx="456" cy="213" r="2.6" fill="#6f75b5"/>') + '</g>';
}
function sceneSvg(kind, connect, view) {
  const aio = kind === 'aio', full = !connect && !aio;
  const spk = function (x) {   // a speaker: cabinet, small tweeter above, big woofer cone below
    const c = x + 24;
    return '<rect x="' + x + '" y="198" width="48" height="98" rx="8" fill="url(#pcCab)" ' + S1 + '/><rect x="' + (x + 2) + '" y="200" width="44" height="94" rx="6.5" fill="none" stroke="#fff" stroke-opacity=".14" stroke-width="1.5"/>' +
      '<circle cx="' + c + '" cy="217" r="8" fill="#12131f" stroke="#8d93b8" stroke-width="1.5"/><circle cx="' + c + '" cy="217" r="4" fill="#3a3e66"/>' +
      '<circle cx="' + c + '" cy="258" r="21" fill="#12131f" stroke="#6f75a8" stroke-width="1.5"/><circle class="cone" cx="' + c + '" cy="258" r="17" fill="url(#pcCone)" stroke="#8f95e0" stroke-width="2"/><circle cx="' + c + '" cy="258" r="6" fill="#23264f" stroke="#8f95e0" stroke-width="1.5"/>' +
      '<rect x="' + (c - 10) + '" y="286" width="20" height="2" rx="1" fill="#8f95e0" opacity=".6"/><rect x="' + (x + 5) + '" y="296" width="10" height="3" rx="1.5" fill="#15163a"/><rect x="' + (x + 33) + '" y="296" width="10" height="3" rx="1.5" fill="#15163a"/>';
  };
  const port = function (id, x, y, shape, label) { return '<g transform="translate(' + x + ' ' + y + ')"><g class="pc-port" data-port="' + id + '">' + shape + '<text x="34" y="5" font-size="12" font-weight="bold" fill="#fff">' + label + '</text></g></g>'; };   /* the glow animation uses transform, so the position sits on an outer group */
  const USB = '<rect x="-19" y="-11" width="38" height="22" rx="4" fill="#cfd3ea" stroke="#15163a" stroke-width="2.5"/><rect x="-14" y="-6" width="28" height="12" rx="1.5" fill="#0b0c1f"/><rect x="-11" y="-1" width="22" height="4" fill="#4d8dff"/>';
  let pins = ''; for (let k = 0; k < 5; k++) pins += '<circle cx="' + (-9 + k * 4.5) + '" cy="-3" r="1.2"/>'; for (let k = 0; k < 4; k++) pins += '<circle cx="' + (-6.75 + k * 4.5) + '" cy="2" r="1.2"/>';
  const VGA = '<path d="M-21,-12 H21 L16,12 H-16 Z" fill="#4d8dff" stroke="#15163a" stroke-width="2.5"/><path d="M-15,-6 H15 L12,6 H-12 Z" fill="#0b0c1f"/><g fill="#cfd3ea">' + pins + '</g>';
  const printer = '<g class="pc-part" data-part="printer" filter="url(#pcSh)">' +
    '<path d="M62 196 H138 L142 238 H58 Z" fill="#fff" ' + S1 + '/><path d="M70 207 H130 M69 215 H131 M68 223 H116" stroke="#b7bde0" stroke-width="2.4" stroke-linecap="round"/>' +
    '<rect x="36" y="228" width="128" height="68" rx="9" fill="url(#pcLight)" ' + S1 + '/><path d="M34 240 a10 10 0 0 1 10 -12 h112 a10 10 0 0 1 10 12 z" fill="#d3d7ec" ' + S1 + '/><path d="M42 231.5 H158" stroke="#fff" stroke-opacity=".7" stroke-width="1.5"/>' +
    '<rect x="46" y="246" width="44" height="14" rx="3" fill="#2a2d45"/><rect x="49" y="249" width="22" height="8" rx="1.5" fill="#6fdcd0"/><circle cx="79" cy="253" r="2.2" fill="#ffd23f"/>' +
    '<circle cx="104" cy="253" r="3.4" fill="#aab0d4" ' + S1 + '/><circle cx="117" cy="253" r="3.4" fill="#aab0d4" ' + S1 + '/><circle cx="130" cy="253" r="3.4" fill="#aab0d4" ' + S1 + '/><circle cx="148" cy="253" r="2.4" fill="#6bcb77"/>' +
    '<rect x="50" y="266" width="100" height="9" rx="3" fill="#15163a"/><path d="M58 272 H142 L146 298 H54 Z" fill="#fff" ' + S1 + '/><path d="M68 281 H132 M67 288 H122" stroke="#9aa0d8" stroke-width="2.4" stroke-linecap="round"/><rect x="44" y="296" width="112" height="5" rx="2.5" fill="#9ea4c8" ' + S1 + '/></g>';
  const unit = '<g class="pc-part" data-part="unit" filter="url(#pcSh)">' +
    '<path d="M650 112 l14 -8 v192 l-14 10 z" fill="url(#pcSide)" ' + S1 + '/><rect x="560" y="106" width="90" height="200" rx="7" fill="url(#pcCase)" ' + S1 + '/>' +
    '<rect x="568" y="115" width="74" height="19" rx="2.5" fill="#cdd1e4" ' + S1 + '/><rect x="573" y="122" width="52" height="3.2" rx="1.6" fill="#2a2d45"/><rect x="630" y="121" width="8" height="5" rx="1.2" fill="#9aa0c4"/><circle cx="627.5" cy="129.5" r="1.4" fill="#6bcb77"/>' +
    '<rect x="568" y="138" width="74" height="12" rx="2.5" fill="#d9dcec" ' + S1 + '/><rect x="574" y="143" width="40" height="2.6" rx="1.3" fill="#2a2d45"/>' +
    '<g class="pc-power"><circle cx="605" cy="172" r="14" fill="#fff" stroke="#15163a" stroke-width="3"/><path d="M605 163 V172 M599 166.5 A8 8 0 1 0 611 166.5" fill="none" stroke="#15163a" stroke-width="2.8" stroke-linecap="round"/></g><circle class="led" cx="605" cy="195" r="4" fill="#9aa0d8" stroke="#15163a" stroke-width="1.5"/>' +
    '<rect x="580" y="208" width="14" height="6" rx="1.5" fill="#15163a"/><rect x="583" y="210" width="8" height="2" fill="#4d8dff"/><rect x="600" y="208" width="14" height="6" rx="1.5" fill="#15163a"/><rect x="603" y="210" width="8" height="2" fill="#4d8dff"/><circle cx="626" cy="211" r="3.6" fill="#6bcb77" stroke="#15163a" stroke-width="1.5"/><circle cx="637" cy="211" r="3.6" fill="#ff9ac8" stroke="#15163a" stroke-width="1.5"/>' +
    '<circle cx="605" cy="262" r="29" fill="#cfd3e8" ' + S1 + '/><circle cx="605" cy="262" r="25" fill="#23264f"/><g class="fan"><path d="M605 262 L605 241 A21 21 0 0 1 623 251 Z M605 262 L623 273 A21 21 0 0 1 605 283 Z M605 262 L587 273 A21 21 0 0 1 587 251 Z" fill="#6f75b5"/></g><circle cx="605" cy="262" r="5" fill="#15163a"/>' +
    '<g fill="none" stroke="#aab0d4" stroke-opacity=".55" stroke-width="1"><circle cx="605" cy="262" r="9"/><circle cx="605" cy="262" r="16"/><circle cx="605" cy="262" r="23"/><path d="M605 238 V286 M581 262 H629 M588 245 L622 279 M622 245 L588 279"/></g>' +
    '<rect x="590" y="154" width="30" height="3" rx="1.5" fill="#aab0d4"/><rect x="566" y="306" width="16" height="5" rx="1.5" fill="#15163a"/><rect x="628" y="306" width="16" height="5" rx="1.5" fill="#15163a"/></g>';
  const keyboard = '<g class="pc-part" data-part="keyboard" filter="url(#pcSh)"><rect x="252" y="313" width="216" height="55" rx="6" fill="#aeb4d4" ' + S1 + '/><rect x="252" y="313" width="216" height="51" rx="6" fill="#eceef8" ' + S1 + '/>' + keysSvg() + '</g>';
  const mouse = '<g class="pc-part" data-part="mouse" filter="url(#pcSh)"><path d="M512 322 c-15 0 -22 13 -22 30 v8 c0 18 10 32 22 32 s22 -14 22 -32 v-8 c0 -17 -7 -30 -22 -30 z" fill="url(#pcMouse)" ' + S1 + '/><path d="M512 322.5 V350 M491 351 Q512 356 533 351" fill="none" stroke="#1b1d33" stroke-opacity=".55" stroke-width="1.3"/><rect class="whl" x="508.8" y="331" width="6.4" height="13" rx="3.2" fill="#8d93b8" stroke="#1b1d33" stroke-opacity=".7" stroke-width="1"/><ellipse cx="502" cy="342" rx="3.6" ry="9" fill="#fff" opacity=".55"/></g>';
  return '<svg class="pc-svg" viewBox="' + (view || '0 0 800 450') + '" xmlns="' + NS + '" role="img" aria-label="A computer on a desk">' + DEFS +
    '<rect width="800" height="300" fill="url(#pcWall)"/><rect x="0" y="286" width="800" height="14" fill="#fff" opacity=".5"/>' +
    '<rect y="298" width="800" height="152" fill="url(#pcDesk)"/><rect y="298" width="800" height="7" fill="#8a5527" opacity=".45"/><path d="M0 350 H800 M0 404 H800 M130 305 V350 M420 350 V404 M660 305 V350 M250 404 V450 M560 404 V450" stroke="#8a5527" stroke-width="1.5" opacity=".28"/>' +
    '<g class="pc-cables"></g>' +
    (full ? printer : '') +
    (aio ? '' : '<g class="pc-part" data-part="speakers" filter="url(#pcSh)">' + spk(179) + spk(483) + '<g class="notes" opacity="0"><text x="148" y="188" font-size="30">🎵</text><text x="528" y="184" font-size="30">🎶</text></g></g>') +
    monitorSvg(aio) +
    (aio ? '' : unit) + keyboard + mouse +
    (connect ?
      (aio ? '<path d="M472 100 L668 84 M472 220 L668 236" stroke="#15163a" stroke-width="2" stroke-dasharray="5 5" fill="none" opacity=".5"/>' : '<path d="M664 150 L672 110 M664 280 L672 300" stroke="#15163a" stroke-width="2" stroke-dasharray="5 5" fill="none" opacity=".5"/>') +
      '<g class="pc-panel" filter="url(#pcSh)"><rect x="668" y="' + (aio ? 72 : 58) + '" width="124" height="' + (aio ? 176 : 250) + '" rx="12" fill="url(#pcDark)" ' + S3 + '/><rect x="676" y="' + (aio ? 80 : 66) + '" width="108" height="20" rx="6" fill="#15163a" opacity=".55"/><text x="730" y="' + (aio ? 94 : 80) + '" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffe14d">' + (aio ? 'BACK OF THE SCREEN' : 'BACK OF THE BOX') + '</text>' +
        (aio ? '' : port('video', 708, 118, VGA, 'SCREEN')) +
        port('usb1', 708, aio ? 134 : 168, USB, 'USB') + port('usb2', 708, aio ? 190 : 214, USB, 'USB') +
        (aio ? '' : port('audio', 708, 264, '<circle r="13" fill="#cfd3ea" stroke="#15163a" stroke-width="2.5"/><circle r="8" fill="#6bcb77"/><circle r="3.5" fill="#0b0c1f"/>', 'SOUND')) + '</g>' +
      '<g transform="translate(735 382)"><g class="pc-port" data-port="power" filter="url(#pcSh)"><rect x="-52" y="-34" width="104" height="68" rx="12" fill="#fff" ' + S3 + '/><rect x="-24" y="-18" width="48" height="36" rx="7" fill="#eef0fb" stroke="#15163a" stroke-width="2.5"/><path d="M-9 -6 V6 M9 -6 V6 M0 4 V11" stroke="#15163a" stroke-width="4" stroke-linecap="round"/><circle cx="38" cy="-20" r="5" fill="#ff5c72" stroke="#15163a" stroke-width="1.5"/><text x="0" y="-40" text-anchor="middle" font-size="12" font-weight="bold" fill="#15163a">POWER ⚡</text></g></g>' +
      '<g class="pc-plugs"></g>' : '') +
    '<g class="pc-tags"></g></svg>';
}
function partArt(id) { const b = PARTS[id].box; return sceneSvg('desktop', false, b.join(' ')); }
function tag(svg, id) {
  const p = PARTS[id], g = document.createElementNS(NS, 'g'), w = p.name.length * 9.5 + 22; g.setAttribute('class', 'pc-tag'); g.dataset.id = id;
  g.innerHTML = '<rect x="' + (p.at[0] - w / 2) + '" y="' + (p.at[1] - 15) + '" width="' + w + '" height="24" rx="12" fill="#15163a"/><text x="' + p.at[0] + '" y="' + (p.at[1] + 3) + '" text-anchor="middle" font-size="14" font-weight="bold" fill="#ffe14d">' + p.name + '</text>';
  svg.querySelector('.pc-tags').appendChild(g);
}
/* a glowing part gets a bright pulsing halo, and a big arrow bounces above it so it cannot be missed */
function glow(svg, id, on) {
  const n = svg.querySelector('[data-part="' + id + '"]'); if (!n) return; n.classList.toggle('glow', on);
  const old = svg.querySelector('.pc-arrow[data-for="' + id + '"]'); if (old) old.remove(); if (!on) return;
  const b = PARTS[id].box, g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'pc-arrow'); g.dataset.for = id; g.setAttribute('transform', 'translate(' + (b[0] + b[2] / 2) + ' ' + Math.max(80, b[1] + 6) + ')');
  g.innerHTML = '<g class="bob"><path d="M-17 -56 h34 v24 h15 l-32 32 l-32 -32 h15 z" fill="#ffd23f" stroke="#15163a" stroke-width="5" stroke-linejoin="round"/><path d="M-9 -49 h10 v20" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7"/></g>';
  svg.querySelector('.pc-tags').appendChild(g);
}

/* ---------- levels 1 to 3: click the right part ---------- */
function findLevel(kind) {
  return function (body, api) {
    body.innerHTML = '<div class="pc-wrap">' + sceneSvg('desktop', false) + '</div>';
    const svg = body.querySelector('svg'); svg.classList.add('pick');
    svg.addEventListener('click', function (e) {
      const g = e.target.closest('.pc-part'), s = api.step(); if (!g || !s || api.st.locked) return;
      const id = g.dataset.part;
      if (id === s.part) { ORDER.forEach(function (x) { glow(svg, x, false); }); if (!svg.querySelector('.pc-tag[data-id="' + id + '"]')) tag(svg, id); g.classList.add('found'); api.check({ part: id }); }
      else api.miss('That is the ' + PARTS[id].name + '. ' + (kind === 'jobs' ? 'Try another part.' : 'Find the ' + PARTS[s.part].name + '.'));
    });
    api.onTip = function (s) { glow(svg, s.part, true); };
    api.onStep = function (s) { ORDER.forEach(function (x) { glow(svg, x, false); }); if (kind === 'meet' && s) glow(svg, s.part, true); };   // "meet" shows the part while it is explained
  };
}
function findSteps(kind) {
  return ORDER.map(function (id) {
    const p = PARTS[id], nm = p.name.toLowerCase(), ok = function (ev) { return ev.part === id; };
    if (kind === 'meet') return { part: id, say: 'This is the ' + p.name + '. Click it!', sub: p.does, voice: 'This is the ' + nm + '. ' + p.does + ' It is highlighted. Click the ' + nm + '.', win: 'The ' + nm + '! ' + p.does, wait: 2200, tip: [p.look, 'It is the highlighted component. Click it once.'], ok: ok };
    if (kind === 'find') return { part: id, say: 'Click the ' + p.name, voice: 'Where is the ' + nm + '? Click the ' + nm + '.', win: 'That is the ' + nm + '!', tip: [p.look, 'It is highlighted now. Click it once.'], ok: ok };
    return { part: id, say: p.job, win: p.fact, tip: ['Think: ' + p.look, 'The correct component is highlighted now. Click it once.'], ok: ok };
  });
}

/* ---------- level: kinds of computer ---------- */
const KS = 'stroke="#15163a" stroke-width="4" stroke-linejoin="round"';
function scr(x, y, w, h) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="4" fill="#4d8dff"/><path d="M' + x + ' ' + (y + h * 0.78) + ' q' + w * 0.25 + ' ' + (-h * 0.35) + ' ' + w * 0.5 + ' ' + (-h * 0.1) + ' t' + w * 0.5 + ' ' + (-h * 0.08) + ' V' + (y + h) + ' H' + x + ' Z" fill="#3fa84f"/><circle cx="' + (x + w * 0.78) + '" cy="' + (y + h * 0.28) + '" r="' + Math.min(w, h) * 0.11 + '" fill="#ffe14d"/>'; }
/* a laptop seen from the front and a little from the side: a thick base lying on the desk (rows of keys, a space bar, a touchpad), a hinge, and the lid standing up with its screen and camera */
function laptopArt() {
  const M = 'matrix(1 0 -0.5 0.62 62 104)';   // the base is drawn flat (136 wide, 56 deep) and laid down in perspective
  let k = '';
  [6, 15, 24].forEach(function (y) { for (let i = 0; i < 12; i++) k += '<rect x="' + (7 + i * 10.34).toFixed(2) + '" y="' + y + '" width="8.4" height="7" rx="1.6"/>'; });
  k += '<rect x="7" y="33" width="22" height="7" rx="1.6"/><rect x="31" y="33" width="14" height="7" rx="1.6"/><rect x="47" y="33" width="42" height="7" rx="1.6"/><rect x="91" y="33" width="14" height="7" rx="1.6"/><rect x="107" y="33" width="22" height="7" rx="1.6"/>';
  return '<ellipse cx="112" cy="149" rx="96" ry="4.5" fill="#15163a" opacity=".22"/>' +
    '<g transform="' + M + '"><rect x="0" y="10" width="136" height="56" rx="8" fill="#8f95bd" ' + KS + ' vector-effect="non-scaling-stroke"/>' +
    '<rect x="0" y="0" width="136" height="56" rx="8" fill="#c9cdea" ' + KS + ' vector-effect="non-scaling-stroke"/>' +
    '<rect x="4" y="3" width="128" height="44" rx="4" fill="#dfe2f6"/><g fill="#6f75b5">' + k + '</g>' +
    '<rect x="43" y="43" width="50" height="10" rx="3" fill="#aeb4d8" stroke="#6f75b5" stroke-width="1.6" vector-effect="non-scaling-stroke"/></g>' +
    '<path d="M62 104 H198 L204 22 H68 Z" fill="#2b2f5e" ' + KS + '/>' +
    '<g transform="matrix(1 0 -0.071 1 6.96 0)">' + scr(71, 31, 118, 67) + '</g><circle cx="136" cy="26.5" r="1.8" fill="#9aa0d8"/>' +
    '<rect x="88" y="100" width="82" height="6" rx="3" fill="#9ea4c8" ' + KS + '/>';
}
/* a screen with rounded corners: the same picture as every other computer (blue sky, green hills, a sun) */
function roundScr(id, x, y, w, h, r) { return '<clipPath id="' + id + '"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + r + '"/></clipPath><g clip-path="url(#' + id + ')">' + scr(x, y, w, h) + '</g>'; }
/* an iPhone-style phone: flat silver frame, thin black edge, a pill-shaped camera at the top, a bar at the bottom, and side buttons */
function phoneArt() {
  const btn = function (x, y, h) { return '<rect x="' + x + '" y="' + y + '" width="3.5" height="' + h + '" rx="1.5" fill="#c3c7da" stroke="#15163a" stroke-width="2"/>'; };
  return '<ellipse cx="110" cy="152" rx="40" ry="3.5" fill="#15163a" opacity=".22"/>' + btn(76, 30, 7) + btn(76, 44, 13) + btn(76, 61, 13) + btn(140.5, 48, 20) +
    '<rect x="78" y="3" width="64" height="148" rx="16" fill="#e1e4f0" ' + KS + '/><rect x="80.6" y="5.6" width="58.8" height="142.8" rx="13.6" fill="#0d0e1f"/>' +
    roundScr('phScr', 83, 8, 54, 138, 12) +
    '<rect x="99" y="12" width="22" height="6.5" rx="3.25" fill="#0d0e1f"/><circle cx="116" cy="15.2" r="1.3" fill="#2b2f5e"/>' +
    '<rect x="96" y="140" width="28" height="3" rx="1.5" fill="#fff"/>';
}
const KINDS = {
  desktop: { name: 'Desktop', say: 'A desktop has separate parts. The system unit is a box beside the screen.',
    svg: '<rect x="20" y="24" width="124" height="88" rx="8" fill="#2b2f5e" ' + KS + '/>' + scr(30, 34, 104, 68) + '<rect x="72" y="112" width="20" height="18" fill="#9ea4c8" ' + KS + '/><rect x="50" y="128" width="64" height="9" rx="4" fill="#9ea4c8" ' + KS + '/><rect x="158" y="34" width="44" height="104" rx="6" fill="#eef0fb" ' + KS + '/><circle cx="180" cy="58" r="7" fill="#6bcb77" stroke="#15163a" stroke-width="3"/><rect x="166" y="76" width="28" height="5" fill="#9aa0d8"/><circle cx="180" cy="110" r="11" fill="#c7cbee" stroke="#15163a" stroke-width="3"/>' },
  aio: { name: 'All-in-one', say: 'An all-in-one hides the computer inside the screen. There is no box to see.',
    svg: '<rect x="34" y="16" width="152" height="112" rx="10" fill="#eef0fb" ' + KS + '/>' + scr(44, 26, 132, 78) + '<circle cx="110" cy="116" r="5" fill="#6bcb77" stroke="#15163a" stroke-width="2"/><path d="M96 128 h28 l6 14 h-40 z" fill="#9ea4c8" ' + KS + '/>' },
  laptop: { name: 'Laptop', say: 'A laptop folds shut. The screen, keyboard and battery are all in one, so you can carry it.', svg: laptopArt() },
  phone: { name: 'iPhone or phone', say: 'An iPhone or phone is a small computer that fits in your pocket. You touch the screen, and you can call people.', svg: phoneArt() },
  tablet: { name: 'iPad or tablet', say: 'An iPad or tablet is one flat screen. You touch it with your finger.',
    svg: '<rect x="56" y="8" width="108" height="140" rx="13" fill="#e1e4f0" ' + KS + '/><rect x="59" y="11" width="102" height="134" rx="10.5" fill="#0d0e1f"/>' + roundScr('tbScr', 64, 16, 92, 124, 6) + '<circle cx="110" cy="13.6" r="1.4" fill="#2b2f5e"/>' }
};
function kindSvg(k) { return '<svg viewBox="0 0 220 156" xmlns="' + NS + '">' + KINDS[k].svg + '</svg>'; }
function kindsBuild(body, api) {
  body.innerHTML = '<div class="pc-kinds">' + ['laptop', 'desktop', 'phone', 'tablet', 'aio'].map(function (k) { return '<button type="button" class="pc-kind" data-k="' + k + '">' + kindSvg(k) + '<b></b></button>'; }).join('') + '</div>';
  body.querySelectorAll('.pc-kind').forEach(function (b) {
    b.addEventListener('click', function () { b.blur(); const s = api.step(); if (!s || api.st.locked) return;
      if (b.dataset.k === s.kind) { b.classList.add('found'); b.querySelector('b').textContent = KINDS[s.kind].name; body.querySelectorAll('.glow').forEach(function (n) { n.classList.remove('glow'); }); api.check({ k: s.kind }); }
      else api.miss('Not that one. ' + KINDS[s.kind].say); });
  });
  api.onTip = function (s) { body.querySelector('[data-k="' + s.kind + '"]').classList.add('glow'); };
  api.onStep = function () { body.querySelectorAll('.glow').forEach(function (n) { n.classList.remove('glow'); }); };
}
const kindsSteps = [['desktop', 'Click the DESKTOP computer', 'It has a separate system unit beside the monitor'], ['aio', 'Click the ALL-IN-ONE computer', 'The computer is built into the monitor'], ['laptop', 'Click the LAPTOP', 'It folds shut and has a built-in keyboard'], ['tablet', 'Click the IPAD or TABLET', 'A single touchscreen'], ['phone', 'Click the IPHONE or PHONE', 'A small computer for your pocket']].map(function (x) {
  return { kind: x[0], say: x[1], sub: x[2], win: KINDS[x[0]].say, wait: 3000, tip: [KINDS[x[0]].say, 'It is glowing now. Click it.'], ok: function (ev) { return ev.k === x[0]; } };
});

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
      if (b.dataset.v === s.dev[2]) { b.querySelector('.got').appendChild(el('i', '', s.dev[0])); api.check({ v: b.dataset.v }); }
      else api.miss('Not that one. ' + s.dev[3]);
    });
  });
}
const ioSteps = IO.map(function (d) { return { dev: d, say: 'Is the ' + d[1].toLowerCase() + ' INPUT or OUTPUT?', win: d[3], tip: ['INPUT sends something IN to the computer. OUTPUT brings something OUT to you.', d[3]], ok: function (ev) { return ev.v === d[2]; } }; });

/* ---------- levels: plug in the cables, then power on ---------- */
/* plugs: the metal end points UP, towards the socket; the cable leaves from the bottom of the plug (att) */
const PLUG = {
  video: '<path d="M-16,-12 H16 L12,4 H-12 Z" fill="#4d8dff" stroke="#15163a" stroke-width="2.5" stroke-linejoin="round"/><rect x="-8" y="-6" width="16" height="3" fill="#15163a" opacity=".6"/><rect x="-17" y="4" width="34" height="16" rx="4" fill="#2b2f5e" stroke="#15163a" stroke-width="2.5"/><rect x="-10" y="9" width="20" height="3" rx="1.5" fill="#fff" opacity=".6"/>',
  usb: function (ico) { return '<rect x="-12" y="-14" width="24" height="15" rx="2" fill="#cfd3ea" stroke="#15163a" stroke-width="2.5"/><rect x="-7" y="-9" width="5" height="4" fill="#15163a"/><rect x="2" y="-9" width="5" height="4" fill="#15163a"/><rect x="-15" y="1" width="30" height="18" rx="4" fill="#2b2f5e" stroke="#15163a" stroke-width="2.5"/><text y="14" text-anchor="middle" font-size="11">' + ico + '</text>'; },
  audio: '<rect x="-4" y="-14" width="8" height="15" rx="3" fill="#cfd3ea" stroke="#15163a" stroke-width="2.5"/><path d="M-4 -6 H4" stroke="#15163a" stroke-width="2"/><rect x="-9" y="1" width="18" height="18" rx="4" fill="#3fa84f" stroke="#15163a" stroke-width="2.5"/>',
  power: '<rect x="-19" y="-16" width="38" height="30" rx="7" fill="#ff9f45" stroke="#15163a" stroke-width="2.5"/><path d="M-8 -6 V4 M8 -6 V4 M0 0 V8" stroke="#15163a" stroke-width="3.5" stroke-linecap="round"/>'
};
const SETUP = {
  desktop: { ports: { video: [708, 118], usb1: [708, 168], usb2: [708, 214], audio: [708, 264], power: [735, 382] },
    cables: [
      { id: 'monitor',  from: [360, 276], home: [322, 410], port: ['video'], color: '#4d8dff', shape: PLUG.video },
      { id: 'keyboard', from: [300, 370], home: [410, 412], port: ['usb1', 'usb2'], color: '#c9a6ff', shape: PLUG.usb('⌨️') },
      { id: 'mouse',    from: [512, 322], home: [556, 412], port: ['usb1', 'usb2'], color: '#ff9ac8', shape: PLUG.usb('🖱️') },
      { id: 'speakers', from: [203, 296], home: [214, 410], port: ['audio'], color: '#6bcb77', shape: PLUG.audio },
      { id: 'power',    from: [630, 304], home: [634, 410], port: ['power'], color: '#ff9f45', shape: PLUG.power }] },
  aio: { ports: { usb1: [708, 134], usb2: [708, 190], power: [735, 382] },
    cables: [
      { id: 'keyboard', from: [300, 370], home: [330, 412], port: ['usb1', 'usb2'], color: '#c9a6ff', shape: PLUG.usb('⌨️') },
      { id: 'mouse',    from: [512, 322], home: [556, 412], port: ['usb1', 'usb2'], color: '#ff9ac8', shape: PLUG.usb('🖱️') },
      { id: 'power',    from: [394, 276], home: [440, 410], port: ['power'], color: '#ff9f45', shape: PLUG.power }] }
};
Object.keys(SETUP).forEach(function (k) { SETUP[k].cables.forEach(function (c) { c.att = c.id === 'power' ? [0, 14] : [0, 19]; }); });
const PLUG_NAME = { monitor: 'monitor cable', keyboard: 'keyboard cable', mouse: 'mouse cable', speakers: 'speaker cable', power: 'power cable' };
function connectLevel(kind) {
  return function (body, api, year) {
    const cfg = SETUP[kind], SEGS = 18, FLOOR = 440;
    body.innerHTML = '<div class="pc-wrap">' + sceneSvg(kind, true) + '</div>';
    const svg = body.querySelector('svg'), cabG = svg.querySelector('.pc-cables'), plugG = svg.querySelector('.pc-plugs'), st = { in: {}, used: {}, on: false, booting: false, demo: null, demoTok: 0, demoWait: null };
    const hand = document.createElementNS(NS, 'g'); hand.setAttribute('class', 'pc-hand'); hand.setAttribute('visibility', 'hidden'); hand.innerHTML = '<text text-anchor="middle" font-size="42">👆</text>'; svg.querySelector('.pc-tags').appendChild(hand);
    const pt = function (e) { const m = svg.getScreenCTM().inverse(); return { x: e.clientX * m.a + e.clientY * m.c + m.e, y: e.clientX * m.b + e.clientY * m.d + m.f }; };
    const plugs = {}, clear = function () { svg.querySelectorAll('.glow').forEach(function (n) { n.classList.remove('glow'); }); };
    let raf = 0, calm = 0;
    /* A cable is a chain of points. Gravity pulls the chain down, so the cable hangs in a curve, swings when a plug moves and then settles.
       Its length follows the distance between its two ends (a little longer, so it always sags a little). */
    const ropeEnd = function (P) { return [P.x + P.c.att[0], P.y + P.c.att[1]]; };
    function ropeStep(P) {
      const a = P.c.from, b = ropeEnd(P), pts = P.pts, seg = (Math.hypot(b[0] - a[0], b[1] - a[1]) * 1.12 + 26) / SEGS; let moved = 0;
      pts[0].x = a[0]; pts[0].y = a[1]; pts[SEGS].x = b[0]; pts[SEGS].y = b[1];
      for (let i = 1; i < SEGS; i++) { const p = pts[i], vx = (p.x - p.px) * 0.97, vy = (p.y - p.py) * 0.97; p.px = p.x; p.py = p.y; p.x += vx; p.y += vy + 0.55; }
      for (let it = 0; it < 10; it++) {
        for (let i = 0; i < SEGS; i++) {
          const p = pts[i], q = pts[i + 1], dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 0.001, f = (d - seg) / d, wp = i === 0 ? 0 : (i + 1 === SEGS ? 1 : 0.5), wq = i + 1 === SEGS ? 0 : (i === 0 ? 1 : 0.5);
          p.x += dx * f * wp; p.y += dy * f * wp; q.x -= dx * f * wq; q.y -= dy * f * wq;
        }
        for (let i = 1; i < SEGS; i++) if (pts[i].y > FLOOR) pts[i].y = FLOOR;
      }
      for (let i = 1; i < SEGS; i++) moved += Math.abs(pts[i].x - pts[i].px) + Math.abs(pts[i].y - pts[i].py);
      return moved;
    }
    function ropeDraw(P) {
      const pts = P.pts; let d = 'M' + pts[0].x.toFixed(1) + ' ' + pts[0].y.toFixed(1);
      for (let i = 1; i < SEGS; i++) d += ' Q' + pts[i].x.toFixed(1) + ' ' + pts[i].y.toFixed(1) + ' ' + ((pts[i].x + pts[i + 1].x) / 2).toFixed(1) + ' ' + ((pts[i].y + pts[i + 1].y) / 2).toFixed(1);
      d += ' L' + pts[SEGS].x.toFixed(1) + ' ' + pts[SEGS].y.toFixed(1); P.out.setAttribute('d', d); P.path.setAttribute('d', d);
    }
    function loop() {
      raf = 0; if (!svg.isConnected) return; let m = 0;
      Object.keys(plugs).forEach(function (k) { m += ropeStep(plugs[k]); ropeDraw(plugs[k]); });
      if (m > 0.4) calm = 0; else calm++;
      if (calm < 12) raf = requestAnimationFrame(loop);
    }
    function kick() { calm = 0; if (!raf) raf = requestAnimationFrame(loop); }
    /* the plug travels to a place along a gentle arc; grabbing it stops the move */
    function glide(P, to, ms, lift, cb) {
      const tok = ++P.tok, a = [P.x, P.y], t0 = performance.now();
      (function f() {
        if (tok !== P.tok || !svg.isConnected) return;
        const t = Math.min(1, (performance.now() - t0) / ms), e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        P.place(a[0] + (to[0] - a[0]) * e, a[1] + (to[1] - a[1]) * e - Math.sin(Math.PI * e) * lift);
        if (t < 1) requestAnimationFrame(f); else if (cb) cb();
      })();
    }
    cfg.cables.forEach(function (c) {
      const out = document.createElementNS(NS, 'path'), path = document.createElementNS(NS, 'path'); out.setAttribute('class', 'pc-cable-o'); path.setAttribute('class', 'pc-cable'); path.setAttribute('stroke', c.color); cabG.appendChild(out); cabG.appendChild(path);
      const g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'pc-plug'); g.dataset.id = c.id; g.innerHTML = '<circle r="26" cy="4" fill="transparent"/>' + c.shape; plugG.appendChild(g);
      const P = plugs[c.id] = { c: c, g: g, x: c.home[0], y: c.home[1], out: out, path: path, pts: [], tok: 0 };
      P.place = function (x, y) {
        P.x = x; P.y = y; g.setAttribute('transform', 'translate(' + x + ' ' + y + ')');
        if (st.demo === P) hand.setAttribute('transform', 'translate(' + (x + 6) + ' ' + (y + 64) + ')');
        kick();
      };
      const e = ropeEnd(P); for (let i = 0; i <= SEGS; i++) { const k = i / SEGS, x = c.from[0] + (e[0] - c.from[0]) * k, y = c.from[1] + (e[1] - c.from[1]) * k; P.pts.push({ x: x, y: y, px: x, py: y }); }
      for (let k = 0; k < 160; k++) ropeStep(P);
      ropeDraw(P); P.place(P.x, P.y);
      let drag = null;
      g.addEventListener('pointerdown', function (e) {
        if (st.in[c.id] || st.booting) return; e.preventDefault(); if (st.demo) { stopDemo(); L.hush(); }
        P.tok++; try { g.setPointerCapture(e.pointerId); } catch (x) { } const p = pt(e); drag = { dx: P.x - p.x, dy: P.y - p.y }; g.classList.add('drag'); plugG.appendChild(g); L.sfx('clink');
      });
      g.addEventListener('pointermove', function (e) { if (!drag) return; const p = pt(e); P.place(Math.max(15, Math.min(785, p.x + drag.dx)), Math.max(60, Math.min(435, p.y + drag.dy))); });
      const up = function () {
        if (!drag) return; drag = null; g.classList.remove('drag');
        let best = null, bd = 48; Object.keys(cfg.ports).forEach(function (k) { const a = cfg.ports[k], d = Math.hypot(a[0] - P.x, a[1] - P.y); if (d < bd) { bd = d; best = k; } });
        if (best && c.port.indexOf(best) >= 0 && !st.used[best]) {
          st.in[c.id] = best; st.used[best] = c.id; P.place(cfg.ports[best][0], cfg.ports[best][1] + 4); g.classList.add('in'); clear(); L.sfx('pickup'); api.check({ plug: c.id });
          if (!api.st.locked) api.note('The ' + PLUG_NAME[c.id] + ' is in!');
        } else {
          glide(P, c.home, 500, 14);
          if (best) api.miss(st.used[best] && c.port.indexOf(best) >= 0 ? 'That socket is full. Try the other one.' : 'The ' + PLUG_NAME[c.id] + ' does not fit there. Match the shape and the picture.');
        }
      };
      g.addEventListener('pointerup', up); g.addEventListener('pointercancel', up);
    });
    const glowFor = function (s) { clear(); if (s.plug) { plugs[s.plug].g.classList.add('glow'); plugs[s.plug].c.port.forEach(function (k) { if (!st.used[k]) svg.querySelector('[data-port="' + k + '"]').classList.add('glow'); }); } else svg.querySelector('.pc-power').classList.add('glow'); };
    function stopDemo() { st.demoTok++; if (st.demoWait) { st.demoWait(); st.demoWait = null; } st.demo = null; hand.setAttribute('visibility', 'hidden'); }
    /* Year 1: the plug moves to its socket by itself (a hand holds it), goes back, and then the child does the same */
    function startDemo(s) {
      stopDemo(); const P = plugs[s.plug]; if (!P || st.in[s.plug] || st.booting) return;
      const target = P.c.port.filter(function (k) { return !st.used[k]; })[0]; if (!target) return;
      const tok = st.demoTok, ok = function () { return tok === st.demoTok && svg.isConnected && !api.st.dead && !api.st.locked; };
      const wait = function (ms, f) { const h = setTimeout(function () { if (ok()) f(); }, ms); st.demoWait = function () { clearTimeout(h); }; };
      const after = function (min, f) { st.demoWait = L.afterSpeech(function () { if (ok()) f(); }, min, 7000); };
      const to = [cfg.ports[target][0], cfg.ports[target][1] + 4];
      P.tok++; P.place(P.c.home[0], P.c.home[1]); clear(); svg.querySelector('[data-port="' + target + '"]').classList.add('glow'); P.g.classList.add('glow'); api.note('Watch the plug. It moves to the glowing socket.');
      after(500, function () {
        st.demo = P; hand.setAttribute('visibility', 'visible'); P.place(P.x, P.y); L.say('Watch. I move the plug here.'); L.sfx('clink');
        after(900, function () {
          glide(P, to, 1700, 26, function () {
            L.sfx('pickup');
            wait(900, function () {
              glide(P, P.c.home, 1000, 18, function () { stopDemo(); L.say('Now you try. Move the plug to the glowing socket.'); api.note('Now you try!'); glowFor(s); });
            });
          });
        });
      });
    }
    api.onTip = function (s) { if (year === 1 && s.plug && !st.in[s.plug]) startDemo(s); else glowFor(s); };
    api.onStep = function (s) { clear(); stopDemo(); if (!s.plug) svg.querySelector('.pc-power').classList.add('ready'); else if (year === 1) startDemo(s); setTimeout(function () { api.check({}); }, 50); };
    api.plugged = function (id) { return !!st.in[id]; }; api.isOn = function () { return st.on; };
    svg.querySelector('.pc-power').addEventListener('click', function () {
      if (st.booting || st.on) return;
      const missing = cfg.cables.filter(function (c) { return !st.in[c.id]; });
      if (missing.length) { api.miss(missing.some(function (c) { return c.id === 'power'; }) ? 'Nothing happens! The power cable is not plugged in yet.' : 'Not yet. Plug in every cable first.'); return; }
      st.booting = true; boot(svg, kind, function () { st.on = true; st.booting = false; api.check({ power: true }); });
    });
  };
}
/* the computer starts: the light, the fan, the start-up words, the loading bar, then the desktop and a little tune */
function boot(svg, kind, done) {
  const screen = svg.querySelector('.pc-screen'), t = function (ms, f) { setTimeout(function () { if (svg.isConnected) f(); }, ms); }, aio = kind === 'aio';
  const set = function (sel, k, v) { const n = svg.querySelector(sel); if (n) n.setAttribute(k, v); };
  svg.classList.add('on'); set('.led', 'fill', '#6bcb77'); set('.mled', 'fill', '#6bcb77'); const pl = svg.querySelector('[data-port="power"] circle'); if (pl) pl.setAttribute('fill', '#6bcb77');
  L.tone(120, { dur: .5, type: 'sawtooth', vol: .05 }); L.tone(660, { dur: .1, vol: .1 });
  const line = function (y, txt, fill) { return '<text x="270" y="' + y + '" font-size="9" font-family="monospace" fill="' + (fill || '#8fe39a') + '">' + txt + '</text>'; };
  t(500, function () { screen.innerHTML = '<rect x="262" y="82" width="196" height="124" rx="4" fill="#05060f"/>' + line(98, 'Tech Explorers PC'); L.sfx('tick'); });
  t(1000, function () { screen.innerHTML += line(112, 'Keyboard ....... found'); L.sfx('tick'); svg.querySelector('.keys').classList.add('lit'); });
  t(1500, function () { screen.innerHTML += line(126, 'Mouse .......... found'); L.sfx('tick'); set('.whl', 'fill', '#ff5c72'); });
  t(2000, function () { screen.innerHTML += line(140, aio ? 'Screen ......... OK' : 'Speakers ....... found'); L.sfx('tick'); });
  t(2500, function () { screen.innerHTML += line(154, 'Memory ......... OK') + line(176, 'Starting up ...', '#fff'); L.sfx('tick'); });
  t(3200, function () { screen.innerHTML = '<rect x="262" y="82" width="196" height="124" rx="4" fill="#05060f"/><circle cx="360" cy="128" r="18" fill="none" stroke="#4d8dff" stroke-width="5" stroke-dasharray="80 40" class="spin"/><rect x="300" y="170" width="120" height="9" rx="4.5" fill="#2b2f5e"/><rect class="bar" x="300" y="170" width="0" height="9" rx="4.5" fill="#6bcb77"/><text x="360" y="196" text-anchor="middle" font-size="9" fill="#fff">Loading ...</text>'; });
  for (let k = 1; k <= 10; k++) t(3200 + k * 180, function () { const b = screen.querySelector('.bar'); if (b) b.setAttribute('width', k * 12); });
  t(5300, function () {
    screen.innerHTML = '<rect x="262" y="82" width="196" height="124" rx="4" fill="url(#pcWp)"/><circle cx="420" cy="112" r="16" fill="#ffe14d" opacity=".9"/><path d="M262 180 Q320 140 372 172 T458 160 V196 H262 Z" fill="#3fa84f" opacity=".85"/>' +
      [0, 1, 2].map(function (i) { return '<text x="270" y="' + (104 + i * 26) + '" font-size="16">' + ['📁', '🎨', '🌐'][i] + '</text>'; }).join('') +
      '<rect x="262" y="194" width="196" height="12" fill="#15163a" opacity=".85"/><rect x="266" y="197" width="8" height="6" rx="1.5" fill="#4d8dff"/><text x="452" y="203" text-anchor="end" font-size="7" fill="#fff">' + new Date().getHours() + ':' + ('0' + new Date().getMinutes()).slice(-2) + '</text><text class="hello" x="360" y="150" text-anchor="middle" font-size="18" font-weight="bold" fill="#fff" stroke="#15163a" stroke-width=".6">Hello!</text>';
    set('.notes', 'opacity', '1'); svg.classList.add('booted');
    [523, 659, 784, 1047].forEach(function (f, i) { L.tone(f, { delay: i * .16, dur: .28, vol: .14 }); });
  });
  t(6600, done);
}
const DRAG = ['Press on the plug and hold the button down.', 'Slide it to the socket with the same shape.', 'Let go. It clicks in.'];
const plugStep = function (id, say, sub, win, first) { return { plug: id, say: say, sub: sub, win: win, tip: [first].concat(DRAG), ok: function (ev, api) { return api.plugged(id); } }; };
const powerStep = function (where) { return { say: 'Now press the power button ⏻', sub: 'It is on the ' + where, win: 'The computer is ON! Well done!', wait: 2600, tip: ['Look at the ' + where + '.', 'Find the round button with the ⏻ sign. It is glowing.', 'Click it once.'], ok: function (ev, api) { return api.isOn(); } }; };
const connectSteps = [
  plugStep('monitor', 'Plug in the monitor', 'The blue plug goes in the SCREEN socket', 'The monitor is connected!', 'Find the blue plug at the front of the desk.'),
  plugStep('keyboard', 'Plug in the keyboard ⌨️', 'It uses a USB socket', 'The keyboard is connected!', 'Find the plug with the keyboard picture.'),
  plugStep('mouse', 'Plug in the mouse 🖱️', 'It uses the other USB socket', 'The mouse is connected!', 'Find the plug with the mouse picture.'),
  plugStep('speakers', 'Plug in the speakers', 'The small green plug goes in the SOUND socket', 'The speakers are connected!', 'Find the small green plug.'),
  plugStep('power', 'Plug the power cable into the wall ⚡', 'Power always goes in last', 'The computer has power!', 'Find the orange plug under the system unit.'),
  powerStep('system unit')];
const aioSteps = [
  plugStep('keyboard', 'Plug in the keyboard ⌨️', 'The ports are on the back of the screen', 'The keyboard is connected!', 'Find the plug with the keyboard picture.'),
  plugStep('mouse', 'Plug in the mouse 🖱️', 'It uses the other USB socket', 'The mouse is connected!', 'Find the plug with the mouse picture.'),
  plugStep('power', 'Plug the power cable into the wall ⚡', 'Only one power cable is needed', 'The computer has power!', 'Find the orange plug.'),
  powerStep('screen, at the bottom right')];

/* ---------- the lessons (shown before each level) ---------- */
const slide = function (h, p, art, say) { return { h: h, p: p, art: art, say: say }; };
const row = function (ids) { return '<div class="ls-row">' + ids.map(function (id) { return '<div class="ls-card">' + partArt(id) + PARTS[id].name + '</div>'; }).join('') + '</div>'; };
const kcard = function (ks, hot) { return '<div class="ls-row">' + ks.map(function (k) { return '<div class="ls-card' + (k === hot ? ' hot' : '') + '">' + kindSvg(k) + KINDS[k].name + '</div>'; }).join('') + '</div>'; };
const TEACH = {
  meet: [slide('A desktop computer system', ['A computer system is made of hardware components.', 'Each component has a name.', 'Each component has a specific function.'], sceneSvg('desktop', false)),
    slide('How this level works', ['One component is named and its function is explained.', 'That component is highlighted on the screen.', 'Click the highlighted component.'], partArt('monitor'), 'How this level works. One component is named and its function is explained. That component is highlighted on the screen. Click the highlighted component.')],
  find: [slide('Identify the components', ['You have met all six components.', 'This time they are not highlighted.', 'Read or listen to the name, then click the matching component.'], row(['monitor', 'keyboard', 'mouse']))],
  jobs: [slide('Input devices', ['An input device sends information to the computer.', 'The KEYBOARD is used to type text and numbers.', 'The MOUSE is used to move the pointer and to click.'], row(['keyboard', 'mouse'])),
    slide('Output devices', ['An output device presents information from the computer.', 'The MONITOR displays pictures and text. The SPEAKERS produce sound.', 'The PRINTER produces a copy of your work on paper.'], row(['monitor', 'speakers', 'printer'])),
    slide('The system unit', ['Inside the system unit is the processor, also called the CPU.', 'The processor carries out instructions. Memory and storage hold programs and files.', 'The other components are connected to the system unit.'], partArt('unit'))],
  kinds: [slide('Types of computer', ['Computers come in several forms.', 'All of them process information, but they are built differently.'], kcard(['desktop', 'aio', 'laptop', 'tablet', 'phone'])),
    slide('A desktop computer', ['It is made of separate components.', 'The system unit is a case beside the monitor.', 'It is designed to stay on a desk.'], kcard(['desktop'], 'desktop')),
    slide('An all-in-one computer', ['The system unit is built into the monitor.', 'There is no separate case.', 'It needs fewer cables.'], kcard(['aio'], 'aio')),
    slide('Portable computers', ['A laptop folds shut and can be carried.', 'An iPad or tablet is a single touchscreen.', 'An iPhone or phone is a small computer that fits in a pocket.', 'All three contain a battery.'], kcard(['laptop', 'tablet', 'phone']))],
  io: [slide('Input', ['Input is data that the user sends to the computer.', 'Typing, clicking and speaking are forms of input.', 'The keyboard, mouse and microphone are input devices.'], '<div class="ls-row"><div class="ls-card"><span class="ic">⌨️</span>Keyboard</div><div class="ls-card"><span class="ic">🖱️</span>Mouse</div><div class="ls-card"><span class="ic">🎤</span>Microphone</div></div>'),
    slide('Output', ['Output is information that the computer presents to the user.', 'Pictures, sound and printed pages are forms of output.', 'The monitor, speakers and printer are output devices.'], '<div class="ls-row"><div class="ls-card"><span class="ic">🖥️</span>Monitor</div><div class="ls-card"><span class="ic">🔊</span>Speakers</div><div class="ls-card"><span class="ic">🖨️</span>Printer</div></div>')],
  connect: [slide('Cables connect the components', ['The components are connected to the system unit, usually by cables.', 'A cable carries data or power between two devices.', 'Most of the sockets, called ports, are on the BACK of the case.'], sceneSvg('desktop', true)),
    slide('Matching plugs and ports', ['SCREEN: the wide plug for the monitor. This old VGA plug is blue. HDMI plugs are usually black.', 'USB: the flat rectangular plug, for the keyboard and the mouse.', 'SOUND: the small round green plug, for the speakers.'], sceneSvg('desktop', true, '660 50 140 262')),
    slide('Connect the power last', ['The power cable plugs into a wall socket.', 'Then press the power button ⏻.', 'Safety: never touch plugs with wet hands.'], sceneSvg('desktop', true, '540 96 260 330'))],
  aio: [slide('Setting up an all-in-one', ['The computer is built into the monitor.', 'The ports are therefore on the back of the screen.', 'It needs fewer cables than a desktop.'], sceneSvg('aio', true)),
    slide('Fewer cables', ['The keyboard and mouse use USB ports.', 'One power cable connects to the wall socket.', 'The power button is on the screen, usually at the back or the side.'], sceneSvg('aio', true, '232 56 256 232'))]
};

CC.modes.parts = L.game({
  id: 'parts', icon: '🖥️', title: 'Parts of a Computer', color: '#4d8dff', cert: { hero: 'Computer Builder', art: 'parts', hue: 216 },
  sub: function (y) { return y <= 2 ? 'Meet the parts, plug them in and switch the computer on!' : 'Learn the parts and what they do, then build and start a computer.'; },
  stage: function () { return document.getElementById('stage-parts'); }, root: function () { return document.getElementById('parts-root'); },
  speak: function (y) { return y <= 2; }, nudge: function (y) { return y === 1; },
  levels: function (y) {
    const a = [
      { id: 'meet', title: 'Meet the parts', icon: '👋', steps: findSteps('meet'), build: findLevel('meet'), teach: TEACH.meet, learned: 'You have met every part of the computer!' },
      { id: 'find', title: 'Find the parts', icon: '🔎', steps: findSteps('find'), build: findLevel('find'), teach: TEACH.find, learned: 'You know the name of every part!' },
      { id: 'jobs', title: 'What does it do?', icon: '💡', steps: findSteps('jobs'), build: findLevel('jobs'), teach: TEACH.jobs, learned: 'You know what every part does!' },
      { id: 'kinds', title: 'Kinds of computer', icon: '💻', steps: kindsSteps, build: kindsBuild, teach: TEACH.kinds, learned: 'Desktop, all-in-one, laptop, iPad and iPhone: you know them all!' }];
    if (y >= 3) a.push({ id: 'io', title: 'Input or output?', icon: '🔁', steps: ioSteps, build: ioBuild, teach: TEACH.io, learned: 'Input goes IN. Output comes OUT.' });
    a.push({ id: 'connect', title: 'Plug in and power on', icon: '🔌', steps: connectSteps, build: connectLevel('desktop'), teach: TEACH.connect, learned: 'You built a desktop computer and switched it on!' });
    a.push({ id: 'aio', title: 'Set up an all-in-one', icon: '🖥️', steps: aioSteps, build: connectLevel('aio'), teach: TEACH.aio, learned: 'An all-in-one needs fewer cables.' });
    return a;
  }
});
})();
