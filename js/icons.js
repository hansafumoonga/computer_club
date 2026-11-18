/* icons.js - the drawn pictures that stand for the games (no emoji, so they look the same on every computer).
   Everything is drawn in code in the same outlined style as the games: a rounded card for each of the 24 games, round scenery badges for the
   Commando Run / Jump Over! stages, boss faces, a warning sign, a finish flag and an alien badge. Each is drawn once, then copied.
   The emblems are drawn in a 100 x 100 box centred on (0,0). Jump Over!, Star Blaster and Commando Run use the real characters from sprites.js.
   (A few small emoji remain elsewhere on purpose: the key hints on start screens, the certificate tag, and the pause / level-done screens.) */
(function () {
'use strict';
const OUT = '#1a1b3f', TAU = Math.PI * 2, IC = {};

function fs(c, f, lw) { c.fillStyle = f; c.fill(); c.lineWidth = lw || 3; c.strokeStyle = OUT; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function ell(c, x, y, rx, ry, f, rot) { c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, TAU); fs(c, f); }
function circ(c, x, y, r, f, lw) { c.beginPath(); c.arc(x, y, r, 0, TAU); fs(c, f, lw); }
function poly(c, pts, f, lw) { c.beginPath(); pts.forEach(function (p, i) { i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }); c.closePath(); fs(c, f, lw); }
function line(c, x1, y1, x2, y2, w, col) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineWidth = w + 3; c.strokeStyle = OUT; c.lineCap = 'round'; c.stroke(); c.lineWidth = w; c.strokeStyle = col; c.stroke(); }
function puff(c, x, y, r, c1, c2) { const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.1); g.addColorStop(0, c1); g.addColorStop(1, c2); return g; }
function lingrad(c, x0, y0, x1, y1, a, b) { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; }
function shine(c, x, y, rx, ry, rot) { c.save(); c.globalAlpha = 0.55; c.fillStyle = '#fff'; c.beginPath(); c.ellipse(x, y, rx, ry, rot || -0.6, 0, TAU); c.fill(); c.restore(); }
function glow(c, x, y, r, col) { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
function star(c, x, y, r1, r2, n, col, rot) { c.beginPath(); for (let i = 0; i < n * 2; i++) { const a = (rot || -Math.PI / 2) + i * Math.PI / n, r = i % 2 ? r2 : r1; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); fs(c, col, 2.4); }
function shade(hex, amt) {                       // amt > 0 lightens toward white, amt < 0 darkens toward black
  const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255, t = amt > 0 ? 255 : 0, k = Math.abs(amt);
  return 'rgb(' + Math.round(r + (t - r) * k) + ',' + Math.round(g + (t - g) * k) + ',' + Math.round(b + (t - b) * k) + ')';
}
function smile(c, x, y, w, h) { c.beginPath(); c.moveTo(x - w, y); c.quadraticCurveTo(x, y + h, x + w, y); c.lineWidth = 2.4; c.strokeStyle = OUT; c.lineCap = 'round'; c.stroke(); }

/* ---------- the badge every game icon sits on ---------- */
IC.badge = function (c, x, y, S, col, emblem, t) {
  c.save(); c.translate(x, y); c.scale(S / 100, S / 100);
  c.fillStyle = 'rgba(0,0,0,.28)'; rr(c, -46, -43, 92, 92, 24); c.fill();                                  // soft shadow
  rr(c, -48, -48, 96, 96, 24); c.fillStyle = lingrad(c, 0, -48, 0, 48, shade(col, 0.38), col); c.fill();
  c.save(); rr(c, -48, -48, 96, 96, 24); c.clip();                                                          // nothing drawn inside can spill over the edge
  c.fillStyle = 'rgba(255,255,255,.2)'; c.beginPath(); c.ellipse(-14, -44, 56, 22, -0.18, 0, TAU); c.fill();   // gloss
  c.fillStyle = 'rgba(0,0,0,.14)'; c.fillRect(-50, 30, 100, 20);                                           // a darker floor
  emblem(c, t || 0);
  c.restore();
  rr(c, -44, -44, 88, 88, 21); c.lineWidth = 1.8; c.strokeStyle = 'rgba(255,255,255,.4)'; c.stroke();       // thin light edge inside
  rr(c, -48, -48, 96, 96, 24); c.lineWidth = 3.5; c.strokeStyle = OUT; c.lineJoin = 'round'; c.stroke();     // the outline last, so nothing covers it
  c.restore();
};

/* ---------- the emblems ---------- */
const E = IC.emblems = {};
E.mouseclub = function (c) {
  [-2.62, -1.92, -1.22].forEach(function (a) { line(c, -8 + Math.cos(a) * 12, -24 + Math.sin(a) * 12, -8 + Math.cos(a) * 22, -24 + Math.sin(a) * 22, 3.4, '#fff'); });   // click rays, coming out of the left button
  ell(c, 0, 8, 22, 32, puff(c, 0, 8, 34, '#ffffff', '#c9d6f2'));
  c.save(); c.beginPath(); c.ellipse(0, 8, 22, 32, 0, 0, TAU); c.clip(); c.fillStyle = '#ffb0c8'; c.fillRect(-22, -24, 22, 22); c.restore();
  c.beginPath(); c.moveTo(0, -24); c.lineTo(0, 0); c.moveTo(-22, 0); c.lineTo(22, 0); c.lineWidth = 2.6; c.strokeStyle = OUT; c.stroke();
  rr(c, -4, -18, 8, 14, 4); fs(c, '#6a74b0', 2.4); shine(c, -10, -4, 5, 12, -0.2);
};
function house(c, wall, roof, ox) {
  c.save(); c.translate(ox || 0, 0);
  rr(c, -26, -6, 52, 34, 4); fs(c, wall); c.strokeStyle = 'rgba(26,27,63,.3)'; c.lineWidth = 1.6; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-26, 2 + i * 9); c.lineTo(26, 2 + i * 9); c.stroke(); }
  poly(c, [[-32, -6], [0, -34], [32, -6]], roof); rr(c, -7, 10, 14, 18, 3); fs(c, '#ffd23f', 2.4); rr(c, 12, -2, 10, 10, 2); fs(c, '#bfe9ff', 2.4);
  c.restore();
}
E.buildclick = function (c) {
  house(c, puff(c, 0, 10, 40, '#ff9a8a', '#d8544a'), '#7a4a9a', -6);
  poly(c, [[14, 14], [14, 44], [22, 37], [28, 47], [33, 44], [27, 35], [37, 35]], '#fff', 2.4);
};
E.buildtype = function (c) {
  house(c, puff(c, 0, 10, 40, '#8ac0ff', '#3f7ad8'), '#d8544a', -8);
  rr(c, 8, 12, 30, 30, 7); fs(c, '#ffffff'); rr(c, 10, 14, 26, 24, 5); c.fillStyle = '#e8eefc'; c.fill(); c.fillStyle = OUT; c.font = 'bold 22px "Trebuchet MS",sans-serif'; c.textAlign = 'center'; c.fillText('A', 23, 34);
};
E.parts = function (c) {
  rr(c, -34, -36, 68, 46, 8); fs(c, '#e8ecf8'); rr(c, -29, -31, 58, 36, 4); fs(c, lingrad(c, 0, -31, 0, 5, '#5aa8ff', '#2a5ad8'), 2.4);
  shine(c, -14, -22, 9, 3, -0.4); rr(c, -9, 10, 18, 7, 2); fs(c, '#c6cde8', 2.4); rr(c, -18, 16, 36, 6, 3); fs(c, '#c6cde8', 2.4);
  rr(c, -38, 26, 56, 14, 4); fs(c, '#ffffff', 2.4); c.fillStyle = '#9aa4d0'; for (let i = 0; i < 6; i++) c.fillRect(-34 + i * 9, 30, 6, 3);
  ell(c, 30, 33, 8, 7, '#ffffff', 0);
};
E.skills = function (c) {
  c.save(); c.rotate(-0.08); rr(c, -34, -30, 66, 56, 6); fs(c, lingrad(c, 0, -30, 0, 26, '#ffeab0', '#e8b968')); c.restore();
  c.setLineDash([4, 5]); c.beginPath(); c.moveTo(-24, 14); c.quadraticCurveTo(-8, -16, 8, 2); c.quadraticCurveTo(18, 12, 24, -14); c.lineWidth = 3; c.strokeStyle = '#c0453a'; c.stroke(); c.setLineDash([]);
  line(c, 18, -22, 30, -10, 4, '#ff5c72'); line(c, 30, -22, 18, -10, 4, '#ff5c72');
  poly(c, [[26, 8], [38, 20], [26, 38], [14, 20]], '#5ae0f0', 2.6); c.beginPath(); c.moveTo(14, 20); c.lineTo(38, 20); c.moveTo(26, 8); c.lineTo(22, 20); c.lineTo(26, 38); c.lineWidth = 1.6; c.strokeStyle = 'rgba(26,27,63,.5)'; c.stroke();
};
E.fruit = function (c) {
  c.save(); c.rotate(-0.25); c.beginPath(); c.arc(0, -4, 34, 0, Math.PI); c.closePath(); fs(c, '#3fa84f');
  c.beginPath(); c.arc(0, -4, 28, 0, Math.PI); c.closePath(); c.fillStyle = '#e8f6d8'; c.fill(); c.beginPath(); c.arc(0, -4, 24, 0, Math.PI); c.closePath(); c.fillStyle = puff(c, 0, 10, 30, '#ff8a9a', '#e8334e'); c.fill();
  [[-13, 6], [0, 12], [13, 6], [-6, 22], [8, 22]].forEach(function (s) { ell(c, s[0], s[1], 2.8, 4.4, OUT, 0.3); }); c.restore();
  line(c, -34, -30, 34, 12, 4, '#fff'); star(c, 30, -28, 8, 3, 4, '#ffd23f', 0); star(c, -32, 22, 6, 2.4, 4, '#ffd23f', 0);
};
E.words = function (c) {
  const L = 'WORDSEARCH'; for (let i = 0; i < 9; i++) { const x = -30 + (i % 3) * 22, y = -32 + Math.floor(i / 3) * 22; rr(c, x, y, 20, 20, 5); fs(c, i === 4 ? '#ffe45e' : '#ffffff', 2.4); c.fillStyle = OUT; c.font = 'bold 15px "Trebuchet MS",sans-serif'; c.textAlign = 'center'; c.fillText(L[i], x + 10, y + 16); }
  c.beginPath(); c.arc(14, 14, 17, 0, TAU); c.fillStyle = 'rgba(190,240,255,.55)'; c.fill(); c.lineWidth = 6; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 3.2; c.strokeStyle = '#9aa4d0'; c.stroke();
  line(c, 26, 26, 40, 40, 7, '#7a4a9a'); shine(c, 8, 8, 5, 2.4, -0.7);
};
E.typing = function (c) {
  [['F', -26, -4], ['J', 0, -4], ['K', 26, -4]].forEach(function (k, i) {
    rr(c, k[1] - 14, k[2] - 12, 28, 30, 7); fs(c, '#ffffff'); rr(c, k[1] - 11, k[2] - 10, 22, 22, 5); c.fillStyle = '#e4ecff'; c.fill(); c.fillStyle = OUT; c.font = 'bold 17px "Trebuchet MS",sans-serif'; c.textAlign = 'center'; c.fillText(k[0], k[1], k[2] + 8);
    if (i < 2) { c.fillStyle = '#9aa4d0'; c.fillRect(k[1] - 5, k[2] + 12, 10, 2.4); }
  });
  rr(c, -36, 22, 72, 14, 6); fs(c, '#fff', 2.4); c.fillStyle = '#9aa4d0'; c.fillRect(-26, 28, 52, 2.4);
  c.save(); c.translate(24, -34); c.rotate(0.15); c.fillStyle = OUT; c.fillRect(-1.5, -4, 3, 30); poly(c, [[0, -4], [20, 2], [0, 10]], '#ff5c72', 2.4); c.restore();
};
E.desktop = function (c) {
  rr(c, -38, -32, 76, 62, 8); fs(c, '#ffffff'); rr(c, -38, -32, 76, 16, 8); fs(c, lingrad(c, 0, -32, 0, -16, '#6aa8ff', '#3f7ad8'), 3); c.fillStyle = '#3f7ad8'; c.fillRect(-37, -22, 74, 6);
  [['#ff5c72', 26], ['#ffd23f', 18], ['#6bcb77', 10]].forEach(function (d, i) { circ(c, 30 - i * 9, -24, 3, d[0], 1.6); });
  rr(c, -26, -6, 30, 22, 4); fs(c, '#ffd23f', 2.4); poly(c, [[-26, -6], [-18, -12], [-8, -12], [-4, -6]], '#ffb52e', 2.4);
  poly(c, [[10, 6], [10, 34], [17, 28], [23, 38], [28, 35], [22, 26], [31, 26]], '#fff', 2.4);
};
E.shortcuts = function (c) {
  poly(c, [[10, -44], [-14, -6], [-1, -6], [-9, 12], [19, -18], [3, -18], [13, -44]], '#ffe45e', 3);
  [['Ctrl', -22], ['C', 18]].forEach(function (k) { const w = k[0] === 'C' ? 26 : 38; rr(c, k[1] - w / 2, 18, w, 22, 6); fs(c, '#fff', 2.6); c.fillStyle = OUT; c.font = 'bold 13px "Trebuchet MS",sans-serif'; c.textAlign = 'center'; c.fillText(k[0], k[1], 34); });
};
E.letter = function (c) {
  c.save(); c.rotate(-0.06); rr(c, -28, -38, 56, 74, 6); fs(c, '#ffffff'); c.fillStyle = OUT; c.font = 'bold 20px Georgia,serif'; c.textAlign = 'left'; c.fillText('A', -20, -16);
  c.fillStyle = '#c6cde8'; for (let i = 0; i < 5; i++) c.fillRect(-20, -6 + i * 9, i === 4 ? 24 : 40, 3.4); c.restore();
  c.save(); c.translate(14, 16); c.rotate(0.9); rr(c, -5, -28, 10, 36, 3); fs(c, '#ffd23f', 2.6); poly(c, [[-5, 8], [0, 20], [5, 8]], '#ffd9b0', 2.4); poly(c, [[-2, 16], [0, 20], [2, 16]], OUT, 1); rr(c, -5, -32, 10, 7, 3); fs(c, '#ff8fb0', 2.4); c.restore();
};
E.grid = function (c) {
  rr(c, -38, -34, 76, 68, 6); fs(c, '#fff'); rr(c, -38, -34, 76, 14, 6); fs(c, '#3fa84f'); c.fillStyle = '#3fa84f'; c.fillRect(-37, -26, 74, 6);
  c.strokeStyle = '#b8c6e0'; c.lineWidth = 1.6; for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(-38 + i * 19, -20); c.lineTo(-38 + i * 19, 34); c.stroke(); } for (let j = 0; j < 3; j++) { c.beginPath(); c.moveTo(-38, -6 + j * 14); c.lineTo(38, -6 + j * 14); c.stroke(); }
  [[-26, 18, '#5ac8ff'], [-8, 8, '#ffd23f'], [10, -2, '#ff7ac8']].forEach(function (b) { rr(c, b[0] - 6, b[1], 12, 32 - b[1] + 2, 2); fs(c, b[2], 2.2); });
  c.fillStyle = OUT; c.font = 'bold 11px "Trebuchet MS",sans-serif'; c.textAlign = 'center'; c.fillText('Σ', 28, -9);
};
E.network = function (c) {
  const nodes = [[-28, -22], [28, -22], [0, 30]];
  nodes.forEach(function (n) { line(c, 0, 0, n[0], n[1], 3.4, '#fff'); });
  nodes.forEach(function (n) { rr(c, n[0] - 12, n[1] - 9, 24, 17, 4); fs(c, '#e8ecf8', 2.6); rr(c, n[0] - 9, n[1] - 6, 18, 11, 2); fs(c, '#5aa8ff', 1.8); });
  circ(c, 0, 0, 14, puff(c, 0, 0, 16, '#b8fff0', '#1fb8a0'), 3); c.strokeStyle = 'rgba(26,27,63,.55)'; c.lineWidth = 1.6; c.beginPath(); c.ellipse(0, 0, 6, 14, 0, 0, TAU); c.moveTo(-14, 0); c.lineTo(14, 0); c.stroke();
};
E.paint = function (c) {
  c.beginPath(); c.moveTo(-36, -2); c.bezierCurveTo(-40, -34, 0, -42, 28, -30); c.bezierCurveTo(46, -20, 40, 10, 24, 14); c.bezierCurveTo(10, 18, 14, 30, 0, 34); c.bezierCurveTo(-26, 40, -36, 18, -36, -2); c.closePath(); fs(c, puff(c, 0, -6, 44, '#ffe9c8', '#d8a468'));
  circ(c, 6, 18, 5, '#2a2a4a', 2.2); [['#ff5c72', -20, -18], ['#ffd23f', -4, -26], ['#6bcb77', 14, -24], ['#4d8dff', 24, -8], ['#c06bff', -26, 6]].forEach(function (d) { circ(c, d[1], d[2], 6, d[0], 2.2); });
  c.save(); c.translate(12, 14); c.rotate(0.7); rr(c, -4, -32, 8, 38, 3); fs(c, '#ff7a45', 2.4); rr(c, -5, 4, 10, 8, 2); fs(c, '#c6cde8', 2.2); c.beginPath(); c.moveTo(-5, 12); c.quadraticCurveTo(0, 28, 5, 12); fs(c, '#ff5c72', 2.2); c.restore();
};
E.magic = function (c) {
  c.save(); c.globalCompositeOperation = 'multiply'; [['#ff6b86', -14, -12], ['#ffe45e', 14, -12], ['#5ac8ff', 0, 12]].forEach(function (d) { c.beginPath(); c.arc(d[1], d[2], 22, 0, TAU); c.fillStyle = d[0]; c.fill(); }); c.restore();
  [[-14, -12], [14, -12], [0, 12]].forEach(function (d) { c.beginPath(); c.arc(d[0], d[1], 22, 0, TAU); c.lineWidth = 2.6; c.strokeStyle = OUT; c.stroke(); });
  star(c, 30, -32, 9, 3.4, 4, '#fff', 0); star(c, -34, 26, 7, 2.6, 4, '#fff', 0); star(c, 34, 24, 5, 2, 4, '#fff', 0);
};
E.art = function (c) {
  line(c, -22, 40, -6, -10, 5, '#b8793f'); line(c, 22, 40, 6, -10, 5, '#b8793f'); line(c, 0, 40, 0, -4, 5, '#b8793f');
  rr(c, -34, -38, 68, 50, 5); fs(c, '#fff'); c.save(); rr(c, -34, -38, 68, 50, 5); c.clip(); c.fillStyle = '#bfe9ff'; c.fillRect(-34, -38, 68, 30); c.fillStyle = '#6bcb77'; c.beginPath(); c.moveTo(-34, 4); c.quadraticCurveTo(-8, -14, 34, 0); c.lineTo(34, 12); c.lineTo(-34, 12); c.fill(); circ(c, 16, -24, 7, '#ffd23f', 2); c.restore();
  rr(c, -34, -38, 68, 50, 5); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
  c.save(); c.translate(23, 22); c.rotate(0.6); rr(c, -3.5, -28, 7, 32, 3); fs(c, '#ff7a45', 2.2); poly(c, [[-3.5, 4], [0, 16], [3.5, 4]], '#4d8dff', 2.2); c.restore();
};
E.scene = function (c) {
  rr(c, -38, -36, 76, 68, 6); fs(c, '#d29555'); rr(c, -31, -29, 62, 54, 3); fs(c, lingrad(c, 0, -29, 0, 25, '#9be0ff', '#e8f8ff'), 2.4);
  c.save(); rr(c, -31, -29, 62, 54, 3); c.clip(); c.fillStyle = '#6bcb77'; c.beginPath(); c.moveTo(-31, 10); c.quadraticCurveTo(0, -8, 31, 8); c.lineTo(31, 25); c.lineTo(-31, 25); c.fill(); c.restore();
  circ(c, 16, -16, 7, '#ffd23f', 2.2); rr(c, -22, -2, 20, 16, 2); fs(c, '#ff9a8a', 2.2); poly(c, [[-25, -2], [-12, -14], [1, -2]], '#7a4a9a', 2.2);
  rr(c, 14, 6, 5, 12, 1); fs(c, '#b8793f', 1.8); circ(c, 16.5, 2, 9, '#3fa84f', 2.2);
};
E.design = function (c) {
  [[0, 22, '#ff7ac8'], [0, 8, '#ffd23f'], [0, -6, '#5ac8ff']].forEach(function (l) { c.save(); c.translate(l[0], l[1]); poly(c, [[-34, 0], [0, -16], [34, 0], [0, 16]], l[2], 3); c.restore(); });
  star(c, 0, -22, 10, 4, 5, '#fff'); c.save(); c.translate(15, -2); c.rotate(0.7); rr(c, -4, -28, 8, 28, 3); fs(c, '#6a74b0', 2.4); poly(c, [[-4, 0], [0, 14], [4, 0]], '#e8ecff', 2.2); c.restore();
};
E.magiclab = function (c, t) {
  for (let i = 0; i < 8; i++) { c.save(); c.rotate(i * TAU / 8 + t * 0.2); ell(c, 0, -22, 8, 18, 'hsl(' + (i * 45 + 270) + ',80%,68%)'); c.restore(); }
  for (let i = 0; i < 8; i++) { c.save(); c.rotate(i * TAU / 8 + TAU / 16 - t * 0.2); ell(c, 0, -12, 4.5, 9, 'hsl(' + (i * 45 + 40) + ',90%,72%)'); c.restore(); }
  circ(c, 0, 0, 7, puff(c, 0, 0, 8, '#fff', '#c06bff'), 2.6);
};
E.piano = function (c) {
  rr(c, -38, -2, 76, 42, 6); fs(c, '#fff'); c.strokeStyle = OUT; c.lineWidth = 2.2; for (let i = 1; i < 5; i++) { c.beginPath(); c.moveTo(-38 + i * 15.2, -2); c.lineTo(-38 + i * 15.2, 40); c.stroke(); }
  [1, 2, 4].forEach(function (i) { rr(c, -38 + i * 15.2 - 5, -2, 10, 26, 3); fs(c, OUT, 1.6); });
  circ(c, -16, -22, 7, '#ff5c72', 2.6); line(c, -10, -22, -10, -40, 3.4, OUT); c.beginPath(); c.moveTo(-10, -40); c.quadraticCurveTo(4, -37, 2, -28); c.lineWidth = 3.6; c.strokeStyle = OUT; c.stroke();
  circ(c, 20, -16, 6, '#ffd23f', 2.4); line(c, 25, -16, 25, -33, 3, OUT);
};
E.pattern = function (c, t) {
  [['#ff5c72', -1, -1], ['#ffd23f', 1, -1], ['#6bcb77', -1, 1], ['#4d8dff', 1, 1]].forEach(function (p, i) {
    const lit = Math.floor(t * 1.4) % 4 === i; c.save(); if (lit) glow(c, p[1] * 18, p[2] * 18, 30, p[0] + 'aa'); c.restore();
    rr(c, p[1] > 0 ? 2 : -38, p[2] > 0 ? 2 : -38, 36, 36, 10); fs(c, lit ? shade(p[0], 0.45) : p[0]);
  });
  circ(c, 0, 0, 11, '#fff', 3); c.fillStyle = OUT; c.beginPath(); c.arc(-2, 3, 3.2, 0, TAU); c.fill(); line(c, 1, 3, 1, -7, 2.4, OUT); c.beginPath(); c.moveTo(1, -7); c.quadraticCurveTo(7, -5, 5, 0); c.lineWidth = 2.4; c.strokeStyle = OUT; c.stroke();
};
/* these three use the real in-game drawings, so the icon matches the game */
E.jump = function (c, t) {
  const SP = CC.sprites;
  c.setLineDash([2, 6]); c.beginPath(); c.moveTo(-36, 30); c.quadraticCurveTo(-12, -34, 14, 30); c.lineWidth = 3; c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,.9)'; c.stroke(); c.setLineDash([]);
  star(c, 30, -22, 7, 2.8, 5, '#ffe45e'); star(c, -32, -30, 5, 2, 5, '#ffe45e');
  c.save(); c.translate(22, 38); c.scale(0.54, 0.54); SP.bush(c, 0, 0, t); c.restore();
  c.save(); c.translate(-12, 8); c.scale(0.54, 0.54); SP.runner(c, 0, 0, { t: 1, air: true, sx: 0.95, sy: 1.06 }); c.restore();
};
E.blaster = function (c, t) {
  const SP = CC.sprites; star(c, 30, -32, 7, 2.6, 4, '#fff', 0); star(c, -36, 0, 5, 2, 4, '#fff', 0); star(c, 34, 14, 4, 1.6, 4, '#fff', 0);
  c.save(); c.translate(-24, -28); c.scale(0.42, 0.42); SP.ufo(c, 0, 0, 24, t, { pal: ['#ffd8f4', '#c050c0'], eyes: 2 }); c.restore();
  rr(c, -3, -36, 6, 11, 3); fs(c, '#ffe45e', 2);
  c.save(); c.translate(0, 15); c.scale(0.94, 0.94); SP.ship(c, 0, 0, 'normal', t, {}); c.restore();
};
E.commando = function (c, t) {
  const SP = CC.sprites;
  c.save(); c.translate(-18, 42); c.scale(0.68, 0.68); SP.hero(c, 0, 0, { t: 1, facing: 1, weapon: 'normal', moving: false, costume: 0, rank: 1, recoil: 0.6 }); c.restore();
  glow(c, 32, 8, 16, 'rgba(255,220,120,.9)'); star(c, 32, 8, 9, 3.6, 6, '#ffe45e', 0); circ(c, 32, 8, 3.2, '#fff', 1.4);
};
/* ---------- the little scene inside each stage badge (stage 1 to 15) ---------- */
function pine(c, x, base, s) { c.save(); c.translate(x, base); c.scale(s, s); rr(c, -3, -8, 6, 10, 2); fs(c, '#8a5a30', 2); poly(c, [[-15, -6], [0, -24], [15, -6]], '#2f9e55', 2.4); poly(c, [[-12, -16], [0, -34], [12, -16]], '#3fb868', 2.4); poly(c, [[-9, -26], [0, -42], [9, -26]], '#5ad07e', 2.4); c.restore(); }
const SCENE = [
  function forest(c) { pine(c, -18, 32, 1); pine(c, 14, 34, 1.25); },
  function ocean(c) {
    c.fillStyle = '#2f9fc4'; c.beginPath(); c.moveTo(-50, 22); for (let x = -50; x <= 50; x += 10) c.quadraticCurveTo(x + 5, 15, x + 10, 22); c.lineTo(50, 50); c.lineTo(-50, 50); c.closePath(); c.fill();
    poly(c, [[-14, 18], [14, 18], [8, 26], [-8, 26]], '#ff5c72', 2.4); line(c, 0, 18, 0, -16, 3, '#8a5a30'); poly(c, [[2, -14], [2, 14], [18, 14]], '#fff', 2.4); poly(c, [[-3, -6], [-3, 14], [-14, 14]], '#ffd23f', 2.4);
    c.strokeStyle = '#fff'; c.lineWidth = 2.4; c.lineCap = 'round'; for (let x = -40; x < 50; x += 24) { c.beginPath(); c.moveTo(x, 34); c.quadraticCurveTo(x + 6, 29, x + 12, 34); c.stroke(); }
  },
  function desert(c) { circ(c, 22, -22, 11, '#ffe45e', 2.4); rr(c, -7, -8, 14, 40, 7); fs(c, '#3fb868', 2.6); rr(c, -20, 2, 10, 18, 5); fs(c, '#3fb868', 2.4); rr(c, -18, 14, 14, 7, 3); fs(c, '#3fb868', 2.2); rr(c, 10, -4, 10, 20, 5); fs(c, '#3fb868', 2.4); rr(c, 4, 10, 14, 7, 3); fs(c, '#3fb868', 2.2); [[-4, 2], [3, -4], [0, 14]].forEach(function (d) { c.fillStyle = '#c8f5c8'; c.fillRect(d[0], d[1], 1.6, 4); }); },
  function snow(c) { circ(c, 0, 20, 14, puff(c, 0, 20, 16, '#fff', '#cfe4f8')); circ(c, 0, 2, 10, puff(c, 0, 2, 12, '#fff', '#cfe4f8')); circ(c, 0, -12, 8, puff(c, 0, -12, 9, '#fff', '#cfe4f8')); rr(c, -7, -26, 14, 9, 2); fs(c, '#3a3c88', 2.2); rr(c, -10, -19, 20, 4, 2); fs(c, '#3a3c88', 2); poly(c, [[0, -12], [11, -10], [0, -8]], '#ff9a3a', 1.8); circ(c, -3, -15, 1.4, OUT, 1); circ(c, 3, -15, 1.4, OUT, 1); [[0, 0], [0, 8]].forEach(function (d) { circ(c, d[0], d[1], 1.6, OUT, 1); }); line(c, -10, 2, -24, -6, 3, '#8a5a30'); line(c, 10, 2, 24, -8, 3, '#8a5a30'); poly(c, [[-9, -9], [9, -9], [9, -5], [-9, -5]], '#ff5c72', 1.8); },
  function volcano(c) { c.fillStyle = 'rgba(90,70,80,.7)'; [[-4, -34, 9], [6, -44, 7], [-8, -48, 5]].forEach(function (p) { c.beginPath(); c.arc(p[0], p[1], p[2], 0, TAU); c.fill(); }); poly(c, [[-36, 32], [-12, -14], [12, -14], [36, 32]], '#8a4a42', 3); ell(c, 0, -14, 12, 5, '#ff8a2a'); glow(c, 0, -16, 26, 'rgba(255,170,60,.7)'); c.beginPath(); c.moveTo(-8, -12); c.quadraticCurveTo(-14, 6, -20, 22); c.lineTo(-12, 22); c.quadraticCurveTo(-6, 6, -2, -10); c.closePath(); c.fillStyle = '#ff6a2a'; c.fill(); c.beginPath(); c.moveTo(5, -12); c.quadraticCurveTo(10, 8, 6, 28); c.lineTo(14, 28); c.quadraticCurveTo(14, 4, 9, -10); c.closePath(); c.fill(); },
  function jungle(c) { line(c, -30, 18, 30, 18, 4, '#8a5a30'); [[-20, 8, -0.5], [24, 12, 0.6]].forEach(function (l) { c.save(); c.translate(l[0], l[1]); c.rotate(l[2]); ell(c, 0, 0, 12, 5, '#3fb868'); c.restore(); }); [[-12, 30, '#3fb868', 0.55], [-3, 35, '#ffd23f', 0.15], [7, 32, '#4d8dff', -0.35]].forEach(function (f) { ell(c, f[0], f[1], 5, 14, f[2], f[3]); }); ell(c, 4, 4, 12, 17, puff(c, 4, 4, 18, '#ff8a8a', '#d8334e')); ell(c, 10, 6, 6, 11, '#4d8dff', 0.2); circ(c, 2, -14, 10, puff(c, 2, -14, 12, '#ff8a8a', '#d8334e')); poly(c, [[9, -16], [20, -12], [9, -8]], '#ffd23f', 2.2); circ(c, 4, -17, 3.4, '#fff', 1.8); circ(c, 5, -17, 1.6, OUT, 1); },
  function cave(c) { glow(c, 0, 4, 34, 'rgba(180,140,255,.7)'); poly(c, [[-10, 32], [-16, -2], [-8, -12], [-2, 32]], '#7ad8f0', 2.6); poly(c, [[-4, 32], [-9, -16], [0, -34], [10, -14], [8, 32]], '#b08aff', 3); poly(c, [[6, 32], [12, 2], [22, -8], [28, 32]], '#ff8ad8', 2.6); c.beginPath(); c.moveTo(-1, 30); c.lineTo(0, -30); c.lineWidth = 1.6; c.strokeStyle = 'rgba(255,255,255,.7)'; c.stroke(); star(c, 18, -22, 6, 2.2, 4, '#fff', 0); },
  function city(c) { [[-34, 20, 16, '#5a68b0'], [-18, 44, 14, '#6a78c0'], [-4, 30, 16, '#4a58a0'], [12, 52, 14, '#6a78c0'], [26, 34, 14, '#5a68b0']].forEach(function (b) { rr(c, b[0], 34 - b[1], b[2], b[1], 2); fs(c, b[3], 2.2); for (let j = 0; j < Math.floor(b[1] / 11); j++) for (let i = 0; i < 2; i++) { c.fillStyle = (i + j) % 3 ? '#ffe45e' : '#7a86c8'; c.fillRect(b[0] + 3 + i * 6, 34 - b[1] + 4 + j * 11, 4, 6); } }); circ(c, 30, -24, 7, '#fff3b0', 2); },
  function sky(c) { [[-14, 6, 1], [18, -8, 0.7]].forEach(function (k) { c.save(); c.translate(k[0], k[1]); c.scale(k[2], k[2]); c.beginPath(); c.arc(-14, 4, 11, Math.PI * 0.5, Math.PI * 1.5); c.arc(0, -6, 14, Math.PI, 0); c.arc(14, 4, 11, Math.PI * 1.5, Math.PI * 0.5); c.closePath(); fs(c, puff(c, 0, 0, 30, '#fff', '#d8ecff')); c.restore(); }); circ(c, -22, -22, 8, '#ffe45e', 2.2); },
  function space(c) { star(c, -26, -26, 6, 2.4, 4, '#fff', 0); star(c, 28, 20, 5, 2, 4, '#fff', 0); star(c, 26, -30, 7, 2.6, 4, '#fff', 0); c.save(); c.rotate(-0.4); c.beginPath(); c.ellipse(0, 0, 36, 10, 0, Math.PI, TAU); c.lineWidth = 8; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 4.4; c.strokeStyle = '#ffd9a0'; c.stroke(); circ(c, 0, 0, 20, puff(c, 0, 0, 22, '#d8b8ff', '#6a3ab0')); c.beginPath(); c.ellipse(0, 0, 36, 10, 0, 0, Math.PI); c.lineWidth = 8; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 4.4; c.strokeStyle = '#ffd9a0'; c.stroke(); c.restore(); },
  function swamp(c) { ell(c, 0, 26, 30, 9, '#3a8a3a'); c.beginPath(); c.moveTo(0, 26); c.lineTo(20, 20); c.lineWidth = 3; c.strokeStyle = '#5ab85a'; c.stroke(); circ(c, 0, 10, 17, puff(c, 0, 10, 20, '#b8f58a', '#3fae4b')); circ(c, -10, -4, 8, '#b8f58a'); circ(c, 10, -4, 8, '#b8f58a'); [-10, 10].forEach(function (x) { circ(c, x, -5, 5, '#fff', 1.8); circ(c, x + 0.6, -4, 2.4, OUT, 1); }); smile(c, 0, 12, 10, 6); circ(c, -17, 8, 2, '#8ad86a', 1); circ(c, 17, 8, 2, '#8ad86a', 1); },
  function ruins(c) { [[-22, 36], [0, 52], [22, 30]].forEach(function (k, i) { rr(c, k[0] - 8, 32 - k[1], 16, k[1], 2); fs(c, '#e8d8b0', 2.4); c.strokeStyle = 'rgba(120,90,50,.45)'; c.lineWidth = 1.4; for (let j = -1; j <= 1; j++) { c.beginPath(); c.moveTo(k[0] + j * 4, 34 - k[1]); c.lineTo(k[0] + j * 4, 30); c.stroke(); } rr(c, k[0] - 11, 30 - k[1] - (i === 1 ? 0 : -2), 22, 6, 2); fs(c, '#f4e8c8', 2.2); }); poly(c, [[-4, -22], [8, -26], [10, -20], [-2, -16]], '#d8c8a0', 2); },
  function factory(c) { rr(c, 14, -30, 14, 52, 3); fs(c, '#7a7a90', 2.4); c.fillStyle = '#ffd23f'; c.fillRect(14, -14, 14, 6); c.fillStyle = 'rgba(200,200,215,.8)'; [[20, -40, 7], [26, -50, 9], [18, -58, 6]].forEach(function (p) { c.beginPath(); c.arc(p[0], p[1], p[2], 0, TAU); c.fill(); });
    c.save(); c.translate(-8, 8); for (let i = 0; i < 8; i++) { c.save(); c.rotate(i * TAU / 8); rr(c, -5, -26, 10, 12, 2); fs(c, '#9aa4b8', 2.4); c.restore(); } circ(c, 0, 0, 20, puff(c, 0, 0, 22, '#dfe5f2', '#8a94ac')); circ(c, 0, 0, 8, '#4a4a5a', 2.4); c.restore(); },
  function iceCastle(c) { c.save(); c.rotate(-0.12); rr(c, -22, -22, 44, 44, 8); fs(c, lingrad(c, -22, -22, 22, 22, '#e8f8ff', '#7ac0f0')); rr(c, -16, -16, 14, 14, 4); c.fillStyle = 'rgba(255,255,255,.7)'; c.fill(); c.restore(); [[-14, 22], [0, 24], [14, 22]].forEach(function (p) { poly(c, [[p[0] - 5, 20], [p[0], p[1] + 14], [p[0] + 5, 20]], '#bfe0ff', 2); }); star(c, 26, -24, 8, 3, 4, '#fff', 0); star(c, -28, -4, 5, 2, 4, '#fff', 0); },
  function castle(c) { rr(c, -24, -4, 48, 36, 3); fs(c, '#9a7ac8', 2.6); [[-30, '#7a5ab0'], [18, '#7a5ab0']].forEach(function (t) { rr(c, t[0], -18, 14, 50, 3); fs(c, t[1], 2.6); poly(c, [[t[0] - 3, -18], [t[0] + 7, -36], [t[0] + 17, -18]], '#ff5c8a', 2.6); }); rr(c, -7, -26, 14, 36, 3); fs(c, '#b08ae0', 2.6); poly(c, [[-10, -26], [0, -42], [10, -26]], '#ff5c8a', 2.6); line(c, 0, -42, 0, -50, 2.4, OUT); poly(c, [[0, -50], [10, -46], [0, -42]], '#ffd23f', 1.8); c.beginPath(); c.moveTo(-8, 32); c.lineTo(-8, 18); c.arc(0, 18, 8, Math.PI, 0); c.lineTo(8, 32); c.closePath(); fs(c, '#3a2a5a', 2.4); [[-22, 4], [22, 4]].forEach(function (w) { rr(c, w[0] - 3, w[1], 6, 9, 3); fs(c, '#ffe45e', 1.6); }); }
];

/* a round stage badge: the stage's sky and ground colours with its little picture */
IC.stageBadge = function (c, x, y, R, i) {
  const th = CC.sprites.THEMES[i];
  c.save(); c.translate(x, y); c.scale(R / 50, R / 50);
  c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.arc(0, 3, 48, 0, TAU); c.fill();
  c.save(); c.beginPath(); c.arc(0, 0, 47, 0, TAU); c.clip();
  const g = c.createLinearGradient(0, -48, 0, 28); g.addColorStop(0, th.top); g.addColorStop(1, th.bot); c.fillStyle = g; c.fillRect(-50, -50, 100, 100);
  c.fillStyle = th.far; c.beginPath(); c.moveTo(-50, 14); c.quadraticCurveTo(-24, -6, 0, 12); c.quadraticCurveTo(26, -4, 50, 10); c.lineTo(50, 50); c.lineTo(-50, 50); c.fill();
  c.fillStyle = th.near; c.beginPath(); c.moveTo(-50, 24); c.quadraticCurveTo(-20, 12, 6, 24); c.quadraticCurveTo(30, 14, 50, 22); c.lineTo(50, 50); c.lineTo(-50, 50); c.fill();
  c.fillStyle = th.ground; c.fillRect(-50, 30, 100, 24); c.fillStyle = th.edge; c.fillRect(-50, 30, 100, 3.4);
  SCENE[i](c);
  c.fillStyle = 'rgba(255,255,255,.16)'; c.beginPath(); c.ellipse(-10, -40, 40, 14, -0.2, 0, TAU); c.fill();
  c.restore();
  c.beginPath(); c.arc(0, 0, 47, 0, TAU); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  c.beginPath(); c.arc(0, 0, 43, 0, TAU); c.lineWidth = 1.8; c.strokeStyle = 'rgba(255,255,255,.55)'; c.stroke();
  c.restore();
};
/* a boss icon for the boss health bar: the creature is drawn once into a hidden canvas, measured, and fitted inside the round badge */
const _boss = {};      // each boss picture, measured once
function fitted(key, drawIt) {
  if (_boss[key]) return _boss[key];
  const W = 900, Hh = 700, cv = document.createElement('canvas'); cv.width = W; cv.height = Hh; const k = cv.getContext('2d');
  drawIt(k, W, Hh);
  const img = k.getImageData(0, 0, W, Hh), d = img.data; let x0 = W, x1 = 0, y0 = Hh, y1 = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i] < 60) d[i] = 0;          // the soft glow some bosses are drawn with would show as a box, so it is cleared
  k.putImageData(img, 0, 0);
  for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 200) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < x0) { x0 = y0 = x1 = y1 = 0; }                            // nothing was drawn: keep a 1 pixel picture rather than failing
  const w = x1 - x0 + 1, h = y1 - y0 + 1, k2 = Math.min(1, 160 / Math.max(w, h)), small = document.createElement('canvas');
  small.width = Math.max(1, Math.round(w * k2)); small.height = Math.max(1, Math.round(h * k2));
  small.getContext('2d').drawImage(cv, x0, y0, w, h, 0, 0, small.width, small.height);
  return (_boss[key] = { cv: small, x: 0, y: 0, w: small.width, h: small.height });
}
/* a Commando Run boss (kind and colours as in the stage list) */
function bossPic(kind, palKey) {
  return fitted(kind + '|' + palKey, function (k, W, Hh) { const SP = CC.sprites; k.translate(W / 2, Hh - 120); SP.bossDraw(k, kind, 0, 0, { t: 1, pal: SP.BOSS_PALS[palKey], scale: 1, hp: 1 }); });
}
/* a Star Blaster jellyfish boss (kind 0 to 2) */
function jellyPic(kind) {
  return fitted('jelly|' + kind, function (k, W, Hh) { k.translate(W / 2, Hh / 2); CC.sprites.megaBoss(k, 0, 0, 0, 1, false, kind); });
}
IC.bossBadge = function (c, x, y, R, p) {
  c.save(); c.translate(x, y); c.scale(R / 50, R / 50);
  c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.arc(0, 3, 48, 0, TAU); c.fill();
  c.save(); c.beginPath(); c.arc(0, 0, 47, 0, TAU); c.clip();
  const g = c.createRadialGradient(0, -6, 4, 0, 0, 52); g.addColorStop(0, '#7a3a5a'); g.addColorStop(1, '#2a1a3a'); c.fillStyle = g; c.fillRect(-50, -50, 100, 100);
  const k = 74 / Math.max(p.w, p.h); c.drawImage(p.cv, p.x, p.y, p.w, p.h, -p.w * k / 2, -p.h * k / 2 + 2, p.w * k, p.h * k);
  c.restore(); c.beginPath(); c.arc(0, 0, 47, 0, TAU); c.lineWidth = 4; c.strokeStyle = '#ff5c72'; c.stroke(); c.beginPath(); c.arc(0, 0, 51, 0, TAU); c.lineWidth = 2; c.strokeStyle = OUT; c.stroke();
  c.restore();
};
/* the "big boss" warning sign */
IC.hazard = function (c, x, y, S, t) {
  c.save(); c.translate(x, y); c.scale(S / 100, S / 100); const k = 1 + Math.sin(t * 6) * 0.05; c.scale(k, k);
  c.beginPath(); c.moveTo(0, -44); c.lineTo(46, 36); c.lineTo(-46, 36); c.closePath(); c.lineJoin = 'round'; c.lineWidth = 16; c.strokeStyle = OUT; c.stroke(); fs(c, lingrad(c, 0, -44, 0, 36, '#ffe45e', '#ffb52e'), 3);
  c.fillStyle = OUT; c.font = 'bold 54px "Trebuchet MS",sans-serif'; c.textAlign = 'center'; c.fillText('!', 0, 26);
  c.restore();
};

/* ---------- the five tabs of the year menu: Beginner, Medium, Advanced, Advanced Pro, Skill Games ---------- */
const TAB = {
  b: function (c) {                                   // a sprout
    ell(c, 0, 36, 24, 9, '#a0683a');
    c.beginPath(); c.moveTo(0, 36); c.quadraticCurveTo(-3, 14, 0, -6); c.lineWidth = 8; c.strokeStyle = OUT; c.lineCap = 'round'; c.stroke(); c.lineWidth = 4; c.strokeStyle = '#3fb868'; c.stroke();
    ell(c, -17, -8, 19, 10, puff(c, -17, -8, 20, '#9af0a8', '#2f9e55'), -0.55); ell(c, 17, -20, 19, 10, puff(c, 17, -20, 20, '#b8ffc0', '#3fb868'), 0.55);
  },
  m: function (c) { star(c, 0, 2, 42, 18, 5, puff(c, 0, 2, 44, '#fff3a8', '#ffb52e')); shine(c, -10, -12, 7, 3, -0.6); },    // a star
  a: function (c) {                                   // a rocket
    poly(c, [[-12, 16], [-30, 40], [-10, 30]], '#ff5c72'); poly(c, [[12, 16], [30, 40], [10, 30]], '#ff5c72');
    c.beginPath(); c.moveTo(-9, 38); c.quadraticCurveTo(0, 56, 9, 38); c.fillStyle = '#ffb347'; c.fill();
    ell(c, 0, -2, 16, 36, puff(c, 0, -2, 40, '#ffffff', '#b8c6ee'));
    c.save(); c.beginPath(); c.ellipse(0, -2, 16, 36, 0, 0, TAU); c.clip(); poly(c, [[-18, -22], [0, -50], [18, -22]], '#ff5c72'); c.restore();
    circ(c, 0, -2, 8, puff(c, 0, -2, 10, '#bfe9ff', '#3f8ae8'), 2.6);
  },
  p: function (c) {                                   // a trophy
    ell(c, 0, 40, 22, 6, '#8a5a30'); rr(c, -6, 20, 12, 20, 3); fs(c, '#e8a820'); rr(c, -18, 32, 36, 10, 4); fs(c, '#8a5a30');
    [-1, 1].forEach(function (d) { c.beginPath(); c.arc(d * 26, -14, 13, d > 0 ? -Math.PI / 2 : Math.PI / 2, d > 0 ? Math.PI / 2 : -Math.PI / 2, d < 0); c.lineWidth = 9; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 4.4; c.strokeStyle = '#ffd23f'; c.stroke(); });
    c.beginPath(); c.moveTo(-28, -38); c.lineTo(28, -38); c.bezierCurveTo(28, 2, 14, 22, 0, 22); c.bezierCurveTo(-14, 22, -28, 2, -28, -38); c.closePath(); fs(c, puff(c, 0, -10, 40, '#fff3a8', '#e8a820'));
    star(c, 0, -14, 12, 5, 5, '#fff', -Math.PI / 2);
  },
  g: function (c) { poly(c, [[12, -46], [-18, 2], [-2, 2], [-12, 34], [22, -14], [4, -14], [16, -46]], puff(c, 0, 0, 50, '#fff3a8', '#ffb52e'), 3.4); }    // a lightning bolt
};
/* the finish flag (the end of the progress bar) */
IC.flag = function (c, x, y, S) {
  c.save(); c.translate(x, y); c.scale(S / 100, S / 100);
  line(c, -26, 44, -26, -42, 5, '#c6cde8');
  for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) { c.fillStyle = (r + k) % 2 ? OUT : '#fff'; c.fillRect(-23 + k * 15, -42 + r * 15, 15, 15); }
  c.beginPath(); c.rect(-23, -42, 60, 45); c.lineWidth = 3.4; c.strokeStyle = OUT; c.lineJoin = 'round'; c.stroke();
  c.restore();
};
/* an alien saucer in a round badge: the sign for the alien boss of Star Blaster */
IC.alienBadge = function (c, x, y, R) {
  c.save(); c.translate(x, y); c.scale(R / 50, R / 50);
  c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.arc(0, 3, 48, 0, TAU); c.fill();
  c.save(); c.beginPath(); c.arc(0, 0, 47, 0, TAU); c.clip();
  const g = c.createRadialGradient(0, -6, 4, 0, 0, 52); g.addColorStop(0, '#5a4aa0'); g.addColorStop(1, '#1f1a4a'); c.fillStyle = g; c.fillRect(-50, -50, 100, 100);
  c.save(); c.translate(0, 8); c.scale(0.95, 0.95); CC.sprites.ufo(c, 0, 0, 25, 0, { pal: ['#fff0c0', '#d98a2a'], eyes: 3, lights: 9 }); c.restore();
  c.restore(); c.beginPath(); c.arc(0, 0, 47, 0, TAU); c.lineWidth = 4; c.strokeStyle = '#ff5c72'; c.stroke(); c.beginPath(); c.arc(0, 0, 51, 0, TAU); c.lineWidth = 2; c.strokeStyle = OUT; c.stroke();
  c.restore();
};

/* ---------- what the rest of the game uses: small pictures drawn once and kept ---------- */
const kept = {};
function made(key, size, draw) {
  const k = key + '|' + size; if (kept[k]) return kept[k];
  const cv = document.createElement('canvas'); cv.width = cv.height = size; draw(cv.getContext('2d'), size); return (kept[k] = cv);
}
CC.icons = {
  colour: {},       // the menu colour of each game (filled in by main.js, which owns the game list)
  has: function (id) { return !!E[id]; },
  /* the card picture of a game */
  game: function (id) { return E[id] ? made('game:' + id, 224, function (c, S) { IC.badge(c, S / 2, S / 2, S * 0.94, CC.icons.colour[id] || '#4d8dff', E[id], 0); }) : null; },
  /* the round picture of a Commando Run / Jump Over! scenery (theme number 0 to 14) */
  stage: function (theme) { return made('stage:' + theme, 160, function (c, S) { IC.stageBadge(c, S / 2, S / 2, S * 0.46, theme); }); },
  /* a boss face (Commando Run) */
  boss: function (kind, pal) { return made('boss:' + kind + ':' + pal, 128, function (c, S) { IC.bossBadge(c, S / 2, S / 2, S * 0.44, bossPic(kind, pal)); }); },
  /* a Star Blaster boss: the jellyfish (kind 0 to 2) or, for kind 3, the alien mothership */
  blasterBoss: function (kind) { return kind === 3 ? CC.icons.alien() : made('jelly:' + kind, 128, function (c, S) { IC.bossBadge(c, S / 2, S / 2, S * 0.44, jellyPic(kind)); }); },
  /* a level tab of the year menu: b, m, a, p (Beginner to Advanced Pro) or g (Skill Games) */
  tab: function (id) { return TAB[id] ? made('tab:' + id, 96, function (c, S) { c.translate(S / 2, S / 2); c.scale(S / 110, S / 110); TAB[id](c); }) : null; },
  hazard: function () { return made('hazard', 96, function (c, S) { IC.hazard(c, S / 2, S / 2 + 3, S * 0.9, 0); }); },
  flag: function () { return made('flag', 64, function (c, S) { IC.flag(c, S / 2, S / 2, S * 0.9); }); },
  alien: function () { return made('alien', 128, function (c, S) { IC.alienBadge(c, S / 2, S / 2, S * 0.44); }); },
  /* a page element showing a kept picture (sized by the .gicon style, in em) */
  el: function (src) {
    const e = document.createElement('canvas'); e.width = src.width; e.height = src.height; e.className = 'gicon'; e.setAttribute('aria-hidden', 'true');
    e.getContext('2d').drawImage(src, 0, 0); return e;
  },
  /* draw a kept picture centred on (x, y) in a game canvas */
  draw: function (ctx, src, x, y, size) { ctx.drawImage(src, x - size / 2, y - size / 2, size, size); }
};
})();
