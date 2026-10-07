/* sprites_world.js - themed scenery (15 stages), ground / pits / platforms, and the 12 big boss creatures.
   Same rules as sprites.js: each thing is ONE function taking (ctx, x, y, ...state), so it can be swapped for drawImage later. */
(function () {
'use strict';
const SP = CC.sprites, H = SP.helpers, TAU = Math.PI * 2, OUT = '#1a1b3f';
const rr = H.rr, circ = H.circ, ell = H.ell, fs = H.fs, puff = H.puff, shine = H.shine, eyes = H.eyes, smile = H.smile;

/* ---------- 15 stage themes: sky, hills, ground, liquid in pits, decoration ---------- */
SP.THEMES = [
  { name: 'Forest',  icon: '🌲', top: '#5fb8ff', bot: '#d6f3ff', far: '#7cc88a', near: '#3f9a56', ground: '#4caf50', edge: '#8be28a', dec: ['pine', 'pine', 'bush'], liquid: 'water', plat: '#b8793f', orb: ['#fff3a0', 120, 70, 30], cloud: true },
  { name: 'Ocean',   icon: '🌊', top: '#38a6e8', bot: '#aee8ff', far: '#5ac6e0', near: '#2f9fc4', ground: '#e8c47a', edge: '#fff0b0', dec: ['palm', 'boat', 'palm'], liquid: 'water', plat: '#c98a4a', orb: ['#fff3a0', 650, 70, 30], cloud: true },
  { name: 'Desert',  icon: '🏜️', top: '#ffb35a', bot: '#ffe6a8', far: '#e8a860', near: '#d48a45', ground: '#e0a45a', edge: '#ffd28a', dec: ['cactus', 'dune', 'cactus'], liquid: 'goo', plat: '#c47a3a', orb: ['#ffe066', 600, 80, 44], cloud: false },
  { name: 'Snow',    icon: '⛄', top: '#8ec8f0', bot: '#eaf7ff', far: '#bcd8ee', near: '#9cc4e0', ground: '#f2f8ff', edge: '#ffffff', dec: ['snowpine', 'snowpine', 'snowman'], liquid: 'water', plat: '#9cc4e0', orb: ['#ffffff', 140, 70, 24], cloud: true, snow: true },
  { name: 'Volcano', icon: '🌋', top: '#6a2a3a', bot: '#ff8a4a', far: '#7a3a3a', near: '#a04a3a', ground: '#5a3a3a', edge: '#ff9a5a', dec: ['volcano', 'rockspire'], liquid: 'lava', plat: '#7a4a3a', orb: null, cloud: false },
  { name: 'Jungle',  icon: '🦜', top: '#2f8f5a', bot: '#9be8a0', far: '#2f7a4a', near: '#1f9a50', ground: '#3f8a3a', edge: '#7ad65a', dec: ['jungletree', 'jungletree', 'vine'], liquid: 'water', plat: '#8a5a2a', orb: ['#fff3a0', 640, 60, 26], cloud: false },
  { name: 'Cave',    icon: '💎', top: '#2a2150', bot: '#5a4a9a', far: '#3a3070', near: '#4a4090', ground: '#6a5a9a', edge: '#a99aff', dec: ['crystal', 'stalag', 'crystal'], liquid: 'goo2', plat: '#7a6ab0', orb: null, cloud: false, stars: true },
  { name: 'City',    icon: '🏙️', top: '#3a4a9a', bot: '#ffb0a0', far: '#4a5aa0', near: '#5a68b0', ground: '#5a5f7a', edge: '#aab4e8', dec: ['tower', 'tower', 'tower'], liquid: 'void', plat: '#8a90b0', orb: ['#fff3c0', 140, 80, 32], cloud: false, stars: true },
  { name: 'Sky',     icon: '☁️', top: '#5ab0ff', bot: '#f0faff', far: '#cfe8ff', near: '#bfe0ff', ground: '#ffffff', edge: '#d8ecff', dec: ['cloudpuff', 'balloon', 'cloudpuff'], liquid: 'sky', plat: '#e8f4ff', orb: ['#fff3a0', 650, 70, 30], cloud: true },
  { name: 'Space',   icon: '🪐', top: '#0f0f3a', bot: '#3a2a7a', far: '#26265a', near: '#34347a', ground: '#6a6aa0', edge: '#b0b0ff', dec: ['planet', 'planet', 'rocket'], liquid: 'void', plat: '#8a8ac0', orb: null, cloud: false, stars: true },
  { name: 'Swamp',   icon: '🐸', top: '#4a6a4a', bot: '#a8c878', far: '#5a7a4a', near: '#6a8a3a', ground: '#5a6a3a', edge: '#98b858', dec: ['reed', 'swamptree', 'reed'], liquid: 'goo', plat: '#6a5a2a', orb: ['#e8f0a0', 130, 70, 24], cloud: false },
  { name: 'Ruins',   icon: '🏛️', top: '#d08a6a', bot: '#ffd8a0', far: '#c8946a', near: '#b0805a', ground: '#b09a7a', edge: '#e8d8b0', dec: ['pillar', 'arch', 'pillar'], liquid: 'void', plat: '#c8b48a', orb: ['#fff3a0', 640, 70, 34], cloud: false },
  { name: 'Factory', icon: '⚙️', top: '#4a4a5a', bot: '#9a9ab0', far: '#5a5a70', near: '#6a6a80', ground: '#6a6a7a', edge: '#ffd23f', dec: ['pipe', 'gear', 'pipe'], liquid: 'void', plat: '#8a8aa0', orb: null, cloud: false },
  { name: 'Ice Castle', icon: '🧊', top: '#7ab0f0', bot: '#e0f0ff', far: '#a8c8f0', near: '#90b8e8', ground: '#bfe0ff', edge: '#ffffff', dec: ['icecrystal', 'icecrystal', 'snowpine'], liquid: 'water', plat: '#a8d0ff', orb: ['#ffffff', 140, 70, 24], cloud: true, snow: true },
  { name: 'Castle',  icon: '🏰', top: '#2a1a4a', bot: '#a03a6a', far: '#4a2a6a', near: '#5a3a7a', ground: '#4a3a6a', edge: '#ff9ad0', dec: ['castle', 'castle', 'banner'], liquid: 'lava', plat: '#7a5aa0', orb: ['#ffd0f0', 640, 70, 30], cloud: false, stars: true }
];
const _cache = {};
function cached(key, W, Hh, fn) { let k = _cache[key]; if (!k) { k = document.createElement('canvas'); k.width = W; k.height = Hh; fn(k.getContext('2d')); _cache[key] = k; } return k; }
function hash(i) { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }

/* ---------- decoration items (anchored to ground line gy, x = centre) ---------- */
function deco(c, kind, x, gy, s, th, t) {
  const hgt = 70 + s * 70;
  c.save(); c.translate(x, gy);
  const dark = th.near;
  if (kind === 'pine' || kind === 'snowpine') {
    rr(c, -5, -22, 10, 22, 3); fs(c, '#8a5a2a');
    for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-34 + i * 6, -22 - i * hgt * 0.27); c.lineTo(0, -hgt * 0.45 - i * hgt * 0.27); c.lineTo(34 - i * 6, -22 - i * hgt * 0.27); c.closePath(); fs(c, kind === 'snowpine' ? '#7ab8a0' : '#2f9e55'); }
    if (kind === 'snowpine') { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-10, -hgt * 0.8); c.lineTo(0, -hgt * 0.95); c.lineTo(10, -hgt * 0.8); c.fill(); }
  } else if (kind === 'bush') {
    circ(c, -16, -14, 16, '#4fc46d'); circ(c, 14, -14, 16, '#4fc46d'); circ(c, 0, -22, 20, '#6bd68a');
  } else if (kind === 'palm') {
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(20, -hgt * 0.5, 8, -hgt); c.lineWidth = 12; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 7; c.strokeStyle = '#c98a4a'; c.stroke();
    for (let i = 0; i < 5; i++) { c.save(); c.translate(8, -hgt); c.rotate(-1.2 + i * 0.6 + Math.sin(t + i) * 0.04); c.beginPath(); c.ellipse(24, 0, 28, 7, 0, 0, TAU); fs(c, '#3fb868'); c.restore(); }
  } else if (kind === 'boat') {
    c.translate(0, -8 + Math.sin(t + s * 6) * 3);
    c.beginPath(); c.moveTo(-30, 0); c.lineTo(30, 0); c.lineTo(20, 14); c.lineTo(-20, 14); c.closePath(); fs(c, '#ff6b86');
    c.beginPath(); c.moveTo(0, -4); c.lineTo(0, -56); c.lineTo(26, -8); c.closePath(); fs(c, '#fff');
  } else if (kind === 'cactus') {
    rr(c, -10, -hgt * 0.8, 20, hgt * 0.8, 10); fs(c, '#4fb868');
    rr(c, -28, -hgt * 0.55, 14, 10, 5); fs(c, '#4fb868'); rr(c, -28, -hgt * 0.55 - 20, 10, 26, 5); fs(c, '#4fb868');
    rr(c, 14, -hgt * 0.4, 14, 10, 5); fs(c, '#4fb868'); rr(c, 18, -hgt * 0.4 - 24, 10, 30, 5); fs(c, '#4fb868');
  } else if (kind === 'dune') {
    c.beginPath(); c.moveTo(-80, 0); c.quadraticCurveTo(0, -hgt * 0.9, 80, 0); c.closePath(); c.fillStyle = '#e8b86a'; c.fill();
  } else if (kind === 'snowman') {
    circ(c, 0, -16, 18, '#fff'); circ(c, 0, -42, 13, '#fff'); eyes(c, 0, -44, 5, 2.5, 0); c.beginPath(); c.moveTo(0, -40); c.lineTo(12, -38); c.lineTo(0, -36); fs(c, '#ff9f45');
  } else if (kind === 'volcano') {
    c.beginPath(); c.moveTo(-100, 0); c.lineTo(-26, -hgt * 1.5); c.lineTo(26, -hgt * 1.5); c.lineTo(100, 0); c.closePath(); fs(c, '#7a4a4a');
    c.beginPath(); c.moveTo(-26, -hgt * 1.5); c.quadraticCurveTo(0, -hgt * 1.5 - 20, 26, -hgt * 1.5); c.lineTo(14, -hgt * 1.5 + 14); c.lineTo(-14, -hgt * 1.5 + 14); c.closePath(); c.fillStyle = '#ff7a2a'; c.fill();
    c.fillStyle = 'rgba(80,60,60,.5)'; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(Math.sin(t * .5 + i) * 10, -hgt * 1.5 - 24 - i * 22, 12 + i * 5, 0, TAU); c.fill(); }
  } else if (kind === 'rockspire') {
    c.beginPath(); c.moveTo(-24, 0); c.lineTo(-8, -hgt); c.lineTo(10, -hgt * 0.6); c.lineTo(28, 0); c.closePath(); fs(c, '#8a5a4a');
  } else if (kind === 'jungletree') {
    rr(c, -9, -hgt * 1.1, 18, hgt * 1.1, 6); fs(c, '#8a5a2a'); circ(c, 0, -hgt * 1.15, 42, '#2fa85a'); circ(c, -30, -hgt * 1.0, 28, '#3fbf6a'); circ(c, 30, -hgt * 1.0, 28, '#3fbf6a');
  } else if (kind === 'vine') {
    c.beginPath(); c.moveTo(0, -hgt * 2); c.quadraticCurveTo(14 * Math.sin(t + s), -hgt, 0, -hgt * 0.4); c.lineWidth = 5; c.strokeStyle = '#2f9e55'; c.stroke();
  } else if (kind === 'crystal') {
    [[-16, 0.7, '#8affea'], [4, 1, '#b08aff'], [22, 0.55, '#ff8ad0']].forEach(function (p) { c.beginPath(); c.moveTo(p[0] - 10, 0); c.lineTo(p[0], -hgt * p[1]); c.lineTo(p[0] + 10, 0); c.closePath(); fs(c, p[2]); });
  } else if (kind === 'stalag') {
    c.beginPath(); c.moveTo(-18, 0); c.lineTo(0, -hgt * 0.8); c.lineTo(18, 0); c.closePath(); fs(c, '#6a5aa8');
    c.translate(0, -300); c.beginPath(); c.moveTo(-18, 0); c.lineTo(0, hgt * 0.7); c.lineTo(18, 0); c.closePath(); fs(c, '#6a5aa8');
  } else if (kind === 'tower') {
    const w = 44 + s * 24; rr(c, -w / 2, -hgt * 1.7, w, hgt * 1.7, 4); fs(c, dark);
    c.fillStyle = '#ffe9a8'; for (let r = 0; r < hgt * 1.7 / 22 - 1; r++) for (let q = 0; q < 3; q++) if (hash(r * 3 + q + s * 50) > 0.45) c.fillRect(-w / 2 + 6 + q * (w - 12) / 3, -hgt * 1.7 + 8 + r * 22, 8, 10);
  } else if (kind === 'cloudpuff') {
    c.translate(0, -hgt * 0.5 - 20); c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.ellipse(0, 0, 54, 20, 0, 0, TAU); c.ellipse(-26, -8, 30, 18, 0, 0, TAU); c.ellipse(24, -10, 34, 20, 0, 0, TAU); c.fill();
  } else if (kind === 'balloon') {
    c.translate(0, -hgt * 0.8 + Math.sin(t + s * 9) * 6); circ(c, 0, -30, 22, ['#ff6b86', '#ffd23f', '#6bcb77'][Math.floor(s * 3)]); c.beginPath(); c.moveTo(0, -8); c.lineTo(0, 14); c.lineWidth = 2; c.strokeStyle = OUT; c.stroke(); rr(c, -8, 14, 16, 10, 3); fs(c, '#b8793f');
  } else if (kind === 'planet') {
    c.translate(0, -hgt * 1.2); circ(c, 0, 0, 34 + s * 20, ['#ff9f45', '#a77bff', '#22c6c6'][Math.floor(s * 3)]);
    c.beginPath(); c.ellipse(0, 0, 58 + s * 20, 10, -0.3, 0, TAU); c.lineWidth = 4; c.strokeStyle = 'rgba(255,255,255,.7)'; c.stroke();
  } else if (kind === 'rocket') {
    c.translate(0, -hgt * 0.6); c.rotate(0.3); rr(c, -12, -40, 24, 60, 12); fs(c, '#fff'); circ(c, 0, -14, 7, '#8fd0ff'); c.beginPath(); c.moveTo(-12, 0); c.lineTo(-24, 20); c.lineTo(-12, 16); c.closePath(); fs(c, '#ff6b86');
  } else if (kind === 'reed') {
    for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * 10, 0); c.quadraticCurveTo(i * 10 + Math.sin(t + i) * 4, -hgt * 0.5, i * 14, -hgt * 0.8); c.lineWidth = 4; c.strokeStyle = '#6a8a3a'; c.stroke(); rr(c, i * 14 - 4, -hgt * 0.8 - 18, 8, 20, 4); fs(c, '#8a5a2a'); }
  } else if (kind === 'swamptree') {
    c.beginPath(); c.moveTo(-8, 0); c.quadraticCurveTo(-4, -hgt * 0.6, 14, -hgt); c.lineWidth = 14; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 9; c.strokeStyle = '#6a5a3a'; c.stroke(); circ(c, 14, -hgt - 8, 28, '#6a9a4a');
  } else if (kind === 'pillar') {
    rr(c, -16, -hgt * 1.2, 32, hgt * 1.2, 4); fs(c, '#e8d8b0'); rr(c, -22, -hgt * 1.2 - 10, 44, 12, 4); fs(c, '#d8c8a0'); c.fillStyle = 'rgba(0,0,0,.08)'; c.fillRect(-6, -hgt * 1.2, 4, hgt * 1.2);
  } else if (kind === 'arch') {
    c.beginPath(); c.rect(-50, -hgt, 100, hgt); c.arc(0, -hgt * 0.55, 28, 0, TAU, true); fs(c, '#d8c8a0');
  } else if (kind === 'pipe') {
    rr(c, -14, -hgt * 1.3, 28, hgt * 1.3, 5); fs(c, '#8a8aa0'); rr(c, -20, -hgt * 1.3, 40, 12, 4); fs(c, '#ffd23f'); circ(c, 0, -hgt * 0.6, 7, '#ffd23f');
  } else if (kind === 'gear') {
    c.translate(0, -hgt); c.rotate(t * 0.3 * (s > .5 ? 1 : -1)); const R = 32 + s * 14;
    c.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, r = i % 2 ? R : R + 9; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); fs(c, '#9a9ab8'); circ(c, 0, 0, R * 0.35, '#5a5a70');
  } else if (kind === 'icecrystal') {
    [[-14, 0.8], [8, 1.1], [26, 0.6]].forEach(function (p) { c.beginPath(); c.moveTo(p[0] - 12, 0); c.lineTo(p[0], -hgt * p[1]); c.lineTo(p[0] + 12, 0); c.closePath(); fs(c, 'rgba(180,225,255,.9)'); });
  } else if (kind === 'castle') {
    rr(c, -34, -hgt * 1.6, 68, hgt * 1.6, 3); fs(c, '#6a4a90');
    for (let i = 0; i < 4; i++) rr(c, -34 + i * 18, -hgt * 1.6 - 12, 12, 14, 2), fs(c, '#6a4a90');
    c.beginPath(); c.moveTo(-14, -hgt * 1.6 - 12); c.lineTo(0, -hgt * 1.6 - 46); c.lineTo(14, -hgt * 1.6 - 12); c.closePath(); fs(c, '#ff6b86');
    rr(c, -8, -hgt * 0.5, 16, 26, 8); fs(c, '#ffe9a8');
  } else if (kind === 'banner') {
    c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -hgt * 1.4); c.lineWidth = 5; c.strokeStyle = OUT; c.stroke(); c.beginPath(); c.moveTo(0, -hgt * 1.4); c.lineTo(36 + Math.sin(t * 2) * 4, -hgt * 1.25); c.lineTo(0, -hgt * 1.1); c.closePath(); fs(c, '#ff6b86');
  }
  c.restore();
}

/* ---------- colour helpers + cached scenery layers (richer, more realistic look) ---------- */
function rgbOf(hex) { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
function mix(a, b, k) { const A = rgbOf(a), B = rgbOf(b); return 'rgb(' + ((A[0] + (B[0] - A[0]) * k) | 0) + ',' + ((A[1] + (B[1] - A[1]) * k) | 0) + ',' + ((A[2] + (B[2] - A[2]) * k) | 0) + ')'; }
function mixHex(a, b, k) { const A = rgbOf(a), B = rgbOf(b), v = function (i) { return ((A[i] + (B[i] - A[i]) * k) | 0).toString(16).padStart(2, '0'); }; return '#' + v(0) + v(1) + v(2); }
const TILE = 1200;
/* a seamlessly repeating mountain ridge: gradient body, glowing ridge-line, soft snow/light on the peaks */
function ridgeTile(ti, tag, base, amp, top, bottom, light, seed) {
  return cached('ridge' + ti + tag, TILE, 300, function (k) {
    const pts = [];
    for (let x = 0; x <= TILE; x += 5) { const u = x / TILE * Math.PI * 2; pts.push([x, base - amp * (0.5 * Math.sin(u + seed) + 0.28 * Math.sin(u * 3 + seed * 2.1) + 0.14 * Math.sin(u * 7 + seed * 3.3) + 0.08 * Math.sin(u * 15 + seed))]); }
    const g = k.createLinearGradient(0, base - amp * 1.1, 0, 300); g.addColorStop(0, top); g.addColorStop(1, bottom);
    k.beginPath(); k.moveTo(0, 300); pts.forEach(function (p) { k.lineTo(p[0], p[1]); }); k.lineTo(TILE, 300); k.closePath(); k.fillStyle = g; k.fill();
    k.beginPath(); pts.forEach(function (p, i) { i ? k.lineTo(p[0], p[1]) : k.moveTo(p[0], p[1]); }); k.strokeStyle = light; k.lineWidth = 2.2; k.globalAlpha = 0.55; k.stroke(); k.globalAlpha = 1;
    k.fillStyle = 'rgba(0,0,0,.07)'; for (let i = 0; i < 70; i++) { const x = (i * 83) % TILE, y = base - amp * 0.6 + ((i * 37) % 120); k.beginPath(); k.moveTo(x, y); k.lineTo(x + 26, y + 60); k.lineTo(x + 8, y + 62); k.closePath(); k.fill(); }   // rocky ridges
  });
}
function drawTile(c, tile, par, cam, y) { const off = -((cam * par) % TILE); for (let x = off - TILE; x < 820; x += TILE) c.drawImage(tile, Math.round(x), y); }
/* soft volumetric clouds: three cached sprites */
function cloudSprite(i) {
  return cached('cloud' + i, 260, 110, function (k) {
    const blobs = [[0.18, 0.62, 44], [0.36, 0.42, 52], [0.58, 0.46, 56], [0.78, 0.6, 42], [0.5, 0.66, 60]];
    blobs.forEach(function (b, j) { const x = b[0] * 260 + (i * 9 + j * 5) % 14, y = b[1] * 110, r = b[2] * (0.8 + i * 0.12), g = k.createRadialGradient(x - r * 0.2, y - r * 0.3, 2, x, y, r); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(0.7, 'rgba(240,246,255,.55)'); g.addColorStop(1, 'rgba(225,235,250,0)'); k.fillStyle = g; k.beginPath(); k.arc(x, y, r, 0, TAU); k.fill(); });
    k.globalCompositeOperation = 'source-atop'; const sh = k.createLinearGradient(0, 55, 0, 110); sh.addColorStop(0, 'rgba(120,140,190,0)'); sh.addColorStop(1, 'rgba(120,140,190,.3)'); k.fillStyle = sh; k.fillRect(0, 55, 260, 55);
  });
}
const SUNX = { 0: 120, 1: 650, 2: 600, 3: 140, 5: 640, 8: 650, 9: 600, 10: 130, 11: 640, 13: 140, 14: 640 };

/* background for a stage: graded sky, sun and light rays, drifting clouds, two mountain ranges, haze, parallax decoration */
SP.world = function (c, W, Hh, gy, cam, ti, t) {
  const th = SP.THEMES[ti % SP.THEMES.length];
  c.drawImage(cached('sky2' + ti, W, Hh, function (k) {
    const g = k.createLinearGradient(0, 0, 0, gy); g.addColorStop(0, th.top); g.addColorStop(0.55, mixHex(th.top, th.bot, 0.62)); g.addColorStop(1, th.bot); k.fillStyle = g; k.fillRect(0, 0, W, Hh);
    const ox = th.orb ? th.orb[1] : W * 0.5, hg = k.createRadialGradient(ox, gy - 20, 10, ox, gy - 20, W * 0.7); hg.addColorStop(0, 'rgba(255,240,205,.55)'); hg.addColorStop(1, 'rgba(255,240,205,0)'); k.fillStyle = hg; k.fillRect(0, 0, W, gy + 10);   // horizon glow
  }), 0, 0);
  if (ti % 15 === 3 || ti % 15 === 13) {      // gentle northern lights
    for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(0, 30 + i * 22); for (let x = 0; x <= W; x += 20) c.lineTo(x, 30 + i * 22 + Math.sin(x / 90 + t * 0.4 + i * 2) * 14); c.lineTo(W, 74 + i * 22); for (let x = W; x >= 0; x -= 20) c.lineTo(x, 74 + i * 22 + Math.sin(x / 70 + t * 0.3 + i) * 10); c.closePath(); c.fillStyle = ['rgba(120,255,200,.18)', 'rgba(170,140,255,.16)', 'rgba(120,200,255,.14)'][i]; c.fill(); }
  }
  if (th.stars) { for (let i = 0; i < 60; i++) { c.globalAlpha = 0.35 + 0.4 * Math.sin(t * 0.9 + i * 1.7); c.fillStyle = i % 7 === 0 ? '#ffe9a8' : '#fff'; const sz = i % 5 === 0 ? 3 : 2; c.fillRect((i * 137 + 40) % W, (i * 71 + 20) % (gy * 0.62), sz, sz); } c.globalAlpha = 1; }
  if (th.orb) {                               // sun / moon with a halo and slowly turning rays
    const o = th.orb, rg = c.createRadialGradient(o[1], o[2], 4, o[1], o[2], o[3] * 3.2); rg.addColorStop(0, o[0]); rg.addColorStop(0.35, 'rgba(255,245,200,.35)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = rg; c.beginPath(); c.arc(o[1], o[2], o[3] * 3.2, 0, TAU); c.fill();
    c.save(); c.translate(o[1], o[2]); c.rotate(t * 0.04); c.globalAlpha = 0.055; c.fillStyle = '#fff'; for (let i = 0; i < 9; i++) { c.rotate(TAU / 9); c.beginPath(); c.moveTo(0, 0); c.lineTo(520, -22); c.lineTo(520, 22); c.closePath(); c.fill(); } c.restore(); c.globalAlpha = 1;
    c.fillStyle = o[0]; c.beginPath(); c.arc(o[1], o[2], o[3] * 0.9, 0, TAU); c.fill();
  }
  if (th.cloud) { for (let i = 0; i < 5; i++) { const cx = (((i * 330 - cam * 0.07 - t * 5) % (W + 360)) + W + 360) % (W + 360) - 190, cy = 22 + (i % 3) * 46; c.globalAlpha = 0.85 - (i % 3) * 0.12; c.drawImage(cloudSprite(i % 3), cx, cy, 240 + (i % 2) * 40, 100); } c.globalAlpha = 1; }
  // two mountain ranges with atmospheric haze (further = paler)
  const farTop = mixHex(th.far, th.bot, 0.55), farBot = mixHex(th.far, th.bot, 0.78), midTop = mixHex(th.far, th.bot, 0.22), midBot = mixHex(th.far, th.near, 0.5);
  drawTile(c, ridgeTile(ti, 'a', 200, 78, farTop, farBot, mixHex(th.bot, '#ffffff', 0.5), ti * 1.3 + 0.4), 0.1, cam, gy - 230);
  drawTile(c, ridgeTile(ti, 'b', 210, 62, midTop, midBot, mixHex(th.far, '#ffffff', 0.35), ti * 2.1 + 1.7), 0.22, cam, gy - 214);
  { const hz = c.createLinearGradient(0, gy - 170, 0, gy); hz.addColorStop(0, mixHex(th.bot, th.top, 0) + '00'); hz.addColorStop(1, 'rgba(255,255,255,0.2)'); c.fillStyle = hz; c.fillRect(0, gy - 170, W, 170); }
  // far decoration row (smaller, hazier)
  { const sp2 = 170, f2 = Math.floor(cam * 0.3 / sp2) - 1; c.save(); c.globalAlpha = 0.45;
    for (let i = f2; i < f2 + Math.ceil(W / sp2) + 3; i++) { const s2 = hash(i * 3 + ti * 17), k2 = th.dec[Math.floor(hash(i * 11 + ti) * th.dec.length)]; c.save(); c.translate(i * sp2 + s2 * 60 - cam * 0.3, gy - 4); c.scale(0.62, 0.62); deco(c, k2, 0, 0, s2, th, t); c.restore(); }
    c.restore(); }
  // decoration (with a soft contact shadow so everything sits on the ground)
  const sp = 230, par = 0.5, first = Math.floor(cam * par / sp) - 1;
  for (let i = first; i < first + Math.ceil(W / sp) + 3; i++) {
    const s = hash(i + ti * 31), kind = th.dec[Math.floor(hash(i * 7 + ti) * th.dec.length)], dx = i * sp + s * 80 - cam * par;
    c.fillStyle = 'rgba(0,0,0,.16)'; c.beginPath(); c.ellipse(dx, gy + 8, 30 + s * 22, 6, 0, 0, TAU); c.fill();
    deco(c, kind, dx, gy + 6, s, th, t);
  }
  // near hills with a lit rim
  { const grad = c.createLinearGradient(0, gy - 30, 0, gy); grad.addColorStop(0, mixHex(th.near, '#ffffff', 0.12)); grad.addColorStop(1, th.near);
    c.fillStyle = grad; c.beginPath(); c.moveTo(0, gy); const ptsN = []; for (let x = 0; x <= W + 10; x += 10) { const y = gy - 14 - 12 * Math.sin((x + cam * 0.7) / 60) - 5 * Math.sin((x + cam * 0.7) / 23); ptsN.push([x, y]); c.lineTo(x, y); } c.lineTo(W, gy); c.closePath(); c.fill();
    c.beginPath(); ptsN.forEach(function (p, i) { i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }); c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 2; c.stroke(); }
  { const fg = c.createLinearGradient(0, gy - 90, 0, gy); fg.addColorStop(0, 'rgba(255,255,255,0)'); fg.addColorStop(1, 'rgba(255,255,255,.2)'); c.fillStyle = fg; c.fillRect(0, gy - 90, W, 90); }
  if (th.snow) { c.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 40; i++) { const sx = ((i * 97 + t * 14 * (0.5 + hash(i)) - cam * 0.3) % W + W) % W, sy = ((i * 53 + t * 40 * (0.5 + hash(i + 9))) % gy); c.beginPath(); c.arc(sx, sy, 1.5 + hash(i + 3) * 1.5, 0, TAU); c.fill(); } }
};

/* drawn IN FRONT of the action: drifting weather, dark foreground plants, soft vignette */
const AMB = ['leaf', 'bubble', 'sand', 'snow', 'ember', 'leaf', 'spark', 'none', 'wisp', 'spark', 'firefly', 'sand', 'spark', 'snow', 'ember'];
SP.worldFront = function (c, W, Hh, gy, cam, ti, t) {
  const k = AMB[ti % AMB.length];
  for (let i = 0; i < 26 && k !== 'none'; i++) {
    const r1 = hash(i * 5.1 + 1), r2 = hash(i * 7.7 + 2), r3 = hash(i * 3.3 + 3);
    let x = ((r1 * W * 1.4 + t * (10 + r2 * 30) * (k === 'sand' ? 5 : k === 'ember' ? 0.4 : 1) - cam * 0.9) % (W + 60) + W + 60) % (W + 60) - 30, y;
    if (k === 'ember' || k === 'bubble' || k === 'spark') y = ((r2 * Hh - t * (12 + r3 * 26)) % Hh + Hh) % Hh; else y = ((r2 * Hh + t * (14 + r3 * 24)) % Hh + Hh) % Hh;
    c.globalAlpha = k === 'spark' || k === 'firefly' ? 0.4 + 0.4 * Math.sin(t * 2 + i) : 0.75;
    if (k === 'leaf') { c.fillStyle = r3 > 0.5 ? '#6bd68a' : '#f2c04a'; c.beginPath(); c.ellipse(x, y, 5, 2.5, t + i, 0, TAU); c.fill(); }
    else if (k === 'bubble') { c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, 3 + r3 * 5, 0, TAU); c.stroke(); }
    else if (k === 'sand') { c.fillStyle = 'rgba(255,235,180,.6)'; c.fillRect(x, y, 10 + r3 * 14, 1.6); }
    else if (k === 'snow') { c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y, 2 + r3 * 2.5, 0, TAU); c.fill(); }
    else if (k === 'ember') { c.fillStyle = r3 > 0.5 ? '#ffb347' : '#ff6a2a'; c.beginPath(); c.arc(x, y, 2 + r3 * 2, 0, TAU); c.fill(); }
    else if (k === 'firefly') { c.fillStyle = '#f4ff8a'; c.beginPath(); c.arc(x, y, 2.5, 0, TAU); c.fill(); }
    else if (k === 'wisp') { c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(x, y, 22, 4, 0, 0, TAU); c.fill(); }
    else { c.fillStyle = '#e8e8ff'; c.fillRect(x, y, 2, 2); }
  }
  c.globalAlpha = 1;
  if (ti % 15 === 10) { c.strokeStyle = 'rgba(210,230,255,.45)'; c.lineWidth = 1.5; c.beginPath(); for (let i = 0; i < 46; i++) { const rx = ((hash(i * 3.1) * (W + 80) + t * 120 - cam * 0.3) % (W + 80) + W + 80) % (W + 80) - 40, ry = ((hash(i * 5.7) * Hh + t * 520) % Hh); c.moveTo(rx, ry); c.lineTo(rx - 5, ry + 16); } c.stroke(); }
  c.fillStyle = 'rgba(8,8,30,.38)';
  for (let i = Math.floor(cam * 1.25 / 140) - 1; i < Math.floor(cam * 1.25 / 140) + Math.ceil(W / 140) + 2; i++) {
    const x = i * 140 + hash(i * 2.1) * 60 - cam * 1.25, h = 14 + hash(i * 3.7) * 26;
    c.beginPath(); c.moveTo(x - 14, Hh); c.quadraticCurveTo(x - 4, Hh - h, x + 2, Hh - h * 1.2); c.quadraticCurveTo(x + 6, Hh - h * 0.5, x + 18, Hh); c.closePath(); c.fill();
  }
  { const th2 = SP.THEMES[ti % SP.THEMES.length]; if (th2.orb) { c.save(); c.globalCompositeOperation = 'lighter'; const bg = c.createRadialGradient(th2.orb[1], th2.orb[2], 10, th2.orb[1], th2.orb[2], 420); bg.addColorStop(0, 'rgba(255,230,170,.16)'); bg.addColorStop(1, 'rgba(255,230,170,0)'); c.fillStyle = bg; c.fillRect(0, 0, W, Hh); c.restore(); } }
  c.drawImage(cached('vig', W, Hh, function (k) { const v = k.createRadialGradient(W / 2, Hh / 2, Hh * 0.45, W / 2, Hh / 2, W * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,20,.38)'); k.fillStyle = v; k.fillRect(0, 0, W, Hh); }), 0, 0);
};
/* ground block from x0 to x1 (world coords): layered soil with strata, lit grassy lip, stones and tufts */
function dk(hex, k) { const n = parseInt(hex.slice(1), 16), r = (n >> 16) * k, g = ((n >> 8) & 255) * k, b = (n & 255) * k; return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')'; }
SP.ground = function (c, ti, x0, x1, gy, Hh) {
  const th = SP.THEMES[ti % SP.THEMES.length], w = x1 - x0;
  const gr = c.createLinearGradient(0, gy, 0, Hh); gr.addColorStop(0, mixHex(th.ground, '#ffffff', 0.08)); gr.addColorStop(0.18, th.ground); gr.addColorStop(1, dk(th.ground, 0.42));
  c.fillStyle = gr; c.fillRect(x0, gy, w, Hh - gy);
  c.fillStyle = 'rgba(0,0,0,.1)'; for (let y = gy + 30; y < Hh; y += 26) c.fillRect(x0, y, w, 2.5);                         // soil strata
  c.fillStyle = 'rgba(255,255,255,.07)'; for (let y = gy + 31; y < Hh; y += 26) c.fillRect(x0, y + 2.5, w, 1.5);
  for (let x = Math.floor(x0 / 70) * 70; x < x1; x += 70) { const yy = gy + 26 + hash(x * 1.7) * 64, rw = 8 + hash(x * 2.3) * 14, px = x + hash(x) * 40; c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(px, yy, rw, rw * 0.6, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.1)'; c.beginPath(); c.ellipse(px - 2, yy - 2, rw * 0.6, rw * 0.3, 0, 0, TAU); c.fill(); }
  // grass / frost / sand lip: two tones of blades, then a bright rim
  const lip = th.edge, lip2 = mixHex(th.edge, th.ground, 0.55);
  for (let x = Math.floor(x0 / 7) * 7; x < x1; x += 7) { const h = 5 + hash(x * 0.37) * 9, lean = (hash(x * 1.3) - 0.5) * 6; c.fillStyle = hash(x) > 0.5 ? lip : lip2; c.beginPath(); c.moveTo(x, gy + 9); c.lineTo(x + 3 + lean, gy - h); c.lineTo(x + 7, gy + 9); c.closePath(); c.fill(); }
  c.fillStyle = lip; c.fillRect(x0, gy + 4, w, 5);
  c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x0, gy + 4, w, 1.8);                                                      // light catching the top edge
  const sh = c.createLinearGradient(0, gy + 9, 0, gy + 34); sh.addColorStop(0, 'rgba(0,0,0,.28)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = sh; c.fillRect(x0, gy + 9, w, 25);
  c.fillStyle = 'rgba(0,0,0,.24)'; c.fillRect(x0, gy + 8, 3, Hh); c.fillRect(x1 - 3, gy + 8, 3, Hh);
};
/* pit liquid between ground blocks */
SP.pit = function (c, ti, x0, x1, gy, Hh, t) {
  const th = SP.THEMES[ti % SP.THEMES.length], k = th.liquid, w = x1 - x0;
  const cols = { water: ['#4ab8f0', '#1f6aa8'], lava: ['#ff9a3a', '#c8321a'], goo: ['#b8c85a', '#6a7a2a'], goo2: ['#c06aff', '#5a2a9a'], void: ['#2a2a6a', '#0c0c26'], sky: ['#9ad0ff', '#4a90e0'] }[k];
  const gr = c.createLinearGradient(0, gy + 20, 0, Hh); gr.addColorStop(0, cols[0]); gr.addColorStop(1, cols[1]);
  c.fillStyle = gr; c.fillRect(x0, gy + 24, w, Hh - gy - 24);
  if (k !== 'void' && k !== 'sky') { c.beginPath(); c.moveTo(x0, gy + 28); for (let x = 0; x <= w; x += 8) c.lineTo(x0 + x, gy + 24 + Math.sin(x / 14 + t * 2) * 4); c.lineTo(x1, gy + 40); c.lineTo(x0, gy + 40); c.closePath(); c.fillStyle = cols[0]; c.fill();
    c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 2; c.beginPath(); for (let x = 0; x <= w; x += 8) { const yy = gy + 24 + Math.sin(x / 14 + t * 2) * 4; x ? c.lineTo(x0 + x, yy) : c.moveTo(x0, yy); } c.stroke(); }
  if (k === 'lava') { c.fillStyle = '#ffd23f'; for (let i = 0; i < w / 40; i++) { c.beginPath(); c.arc(x0 + 20 + i * 40, gy + 50 + Math.sin(t * 2 + i) * 8, 4, 0, TAU); c.fill(); } const lg = c.createLinearGradient(0, gy, 0, gy + 70); lg.addColorStop(0, 'rgba(255,140,40,.35)'); lg.addColorStop(1, 'rgba(255,140,40,0)'); c.fillStyle = lg; c.fillRect(x0 - 20, gy - 30, w + 40, 100); }
  if (k === 'void' || k === 'sky') { c.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < w / 30; i++) c.fillRect(x0 + 12 + i * 30, gy + 60 + (i * 37) % 50, 2, 2); }
};
/* one-way platform (stand on top, jump up through it, press Down to drop): bevelled, riveted, with a shadow beneath */
SP.platform = function (c, ti, x, y, w) {
  const th = SP.THEMES[ti % SP.THEMES.length];
  c.fillStyle = 'rgba(0,0,0,.16)'; c.beginPath(); c.ellipse(x + w / 2, y + 30, w * 0.46, 6, 0, 0, TAU); c.fill();
  const g = c.createLinearGradient(0, y, 0, y + 16); g.addColorStop(0, mixHex(th.plat, '#ffffff', 0.25)); g.addColorStop(0.5, th.plat); g.addColorStop(1, dk(th.plat, 0.62));
  rr(c, x, y, w, 16, 7); fs(c, g);
  c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(x + 7, y + 3, w - 14, 2.5);
  c.fillStyle = 'rgba(0,0,0,.2)'; for (let i = 14; i < w - 8; i += 24) c.fillRect(x + i, y + 9, 10, 3);
  c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(x + 9, y + 8, 2, 0, TAU); c.arc(x + w - 9, y + 8, 2, 0, TAU); c.fill();
};
SP.flag = function (c, x, y, t, on) {
  c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 70); c.lineWidth = 5; c.strokeStyle = OUT; c.lineCap = 'round'; c.stroke();
  c.beginPath(); c.moveTo(x, y - 70); c.quadraticCurveTo(x + 22, y - 66 + Math.sin(t * 3) * 3, x + 42, y - 58 + Math.sin(t * 3 + 1) * 4); c.lineTo(x, y - 40); c.closePath(); fs(c, on ? '#6bcb77' : '#ffd23f');
  circ(c, x, y - 72, 5, '#fff');
};
/* heart pickup bubble */
SP.heartPickup = function (c, x, y, t) {
  const p = 1 + Math.sin(t * 3) * 0.1; c.save(); c.translate(x, y);
  const g = c.createRadialGradient(0, 0, 4, 0, 0, 34 * p); g.addColorStop(0, 'rgba(255,120,150,.8)'); g.addColorStop(1, 'rgba(255,120,150,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 34 * p, 0, TAU); c.fill();
  SP.heart(c, 0, 0, 34, true); c.restore();
};

/* ======================= BIG BOSSES =======================
   All face LEFT (toward the hero). Anchor = bottom centre (hovering ones use y as their centre-bottom too).
   s = {hurt (bool), t, pal:[c1,c2,c3], charge 0..1 (telegraph), hp (0..1)} */
const fierceEyes = H.fierceEyes, roar = H.roar, grr = H.grr, brows = H.brows;
const B = {};
function limbs(c, pts, w, col) { c.lineCap = 'round'; c.beginPath(); c.moveTo(pts[0], pts[1]); c.quadraticCurveTo(pts[2], pts[3], pts[4], pts[5]); c.lineWidth = w + 5; c.strokeStyle = OUT; c.stroke(); c.lineWidth = w; c.strokeStyle = col; c.stroke(); }
function flash(c, s) { if (s.hurt) { c.save(); c.globalAlpha = 0.28; c.fillStyle = '#fff'; c.fillRect(-170, -250, 340, 270); c.restore(); } }
function tri(c, x1, y1, x2, y2, x3, y3, col) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineTo(x3, y3); c.closePath(); fs(c, col); }
function claws(c, x, y, n, col) { for (let i = 0; i < n; i++) tri(c, x - 9 + i * 9, y - 2, x - 5 + i * 9, y + 9, x - 1 + i * 9, y - 2, col || '#fffbea'); }
function spikes(c, cx, cy, n, r1, r2, wob, t, colA, colB) {
  for (let i = 0; i < n; i++) { const a = i / n * TAU, r = r2 + (i % 2) * 12 + Math.sin(t * 5 + i) * wob, w = 0.5 / n * TAU * 1.1;
    tri(c, cx + Math.cos(a - w) * r1, cy + Math.sin(a - w) * r1, cx + Math.cos(a) * r, cy + Math.sin(a) * r, cx + Math.cos(a + w) * r1, cy + Math.sin(a + w) * r1, i % 2 ? colA : colB); }
}

B.lion = function (c, s) {
  const t = s.t, open = s.charge > 0 ? 1 : 0.35;
  limbs(c, [70, -82, 138, -96 + Math.sin(t * 3) * 10, 128, -142], 9, '#b8641e');
  c.beginPath(); c.moveTo(118, -140); c.quadraticCurveTo(130, -176, 142, -146); c.quadraticCurveTo(150, -132, 136, -128); c.closePath(); fs(c, '#ff7a2a');   // fiery tail tuft
  [-56, -22, 44, 80].forEach(function (x, i) { rr(c, x - 15, -46, 30, 46, 12); fs(c, i % 2 ? '#b8641e' : '#d8832e'); claws(c, x, -3, 3); });
  ell(c, 26, -82, 94, 54, puff(c, 26, -82, 94, '#f0b45a', '#a85a1a'));
  ctx_stripes(c);
  spikes(c, -82, -114, 18, 42, 72, 4, t, '#9a3a0a', '#e0701a');                                                           // wild mane
  circ(c, -82, -114, 46, puff(c, -82, -114, 46, '#ffd890', '#d8923c'));
  tri(c, -118, -146, -108, -176, -92, -152, '#d8923c'); tri(c, -72, -152, -56, -176, -46, -146, '#d8923c');                  // ears
  ell(c, -84, -92, 28, 20, '#ffe9c0');
  fierceEyes(c, -82, -126, 19, 10, s.hurt, '#ffb000');
  tri(c, -94, -108, -70, -108, -82, -96, '#3a1a1a');                                                                       // nose
  roar(c, -82, -88, 22, 10 + open * 18);
  c.strokeStyle = 'rgba(120,40,10,.6)'; c.lineWidth = 3; c.lineCap = 'round'; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-58 + i * 5, -112 + i * 2); c.lineTo(-48 + i * 5, -96 + i * 2); c.stroke(); }
};
function ctx_stripes(c) { c.strokeStyle = 'rgba(120,50,10,.35)'; c.lineWidth = 5; c.lineCap = 'round'; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(30 + i * 22, -122); c.quadraticCurveTo(38 + i * 22, -98, 28 + i * 22, -66); c.stroke(); } }

B.octopus = function (c, s) {
  const t = s.t, col = s.pal[0];
  for (let i = 0; i < 7; i++) {
    const bx = -96 + i * 32, w = Math.sin(t * 3 + i) * 14;
    limbs(c, [bx * 0.6, -96, bx + w, -44, bx * 1.3 + w * 1.4, -4], 17, col);
    for (let k = 0; k < 3; k++) circ(c, bx * 0.95 + w * 0.8, -84 + k * 22, 3.5, '#ffe0f0');
    tri(c, bx * 1.3 + w * 1.4 - 8, -6, bx * 1.3 + w * 1.4, 10, bx * 1.3 + w * 1.4 + 8, -6, s.pal[1]);
  }
  spikes(c, 0, -142, 12, 74, 92, 3, t, s.pal[1], s.pal[2]);
  ell(c, 0, -142, 80, 84, puff(c, 0, -142, 84, s.pal[2], col)); shine(c, -34, -192, 18, 8);
  fierceEyes(c, -4, -160, 28, 14, s.hurt, '#ffd000');
  roar(c, -4, -122, 34, 14 + (s.charge > 0 ? 18 : 6));
};
B.scorpion = function (c, s) {
  const t = s.t, col = s.pal[0];
  for (let i = 0; i < 3; i++) limbs(c, [-40 + i * 36, -36, -54 + i * 36, -4, -30 + i * 36 + Math.sin(t * 4 + i) * 6, 0], 8, '#8a3a0a');
  c.beginPath(); c.moveTo(66, -78); c.bezierCurveTo(136, -96, 150, -180, 86, -204); c.bezierCurveTo(74, -160, 96, -134, 70, -104); c.closePath(); fs(c, col);
  tri(c, 78, -206, 98, -228, 100, -196, '#ff3a3a');                                                                          // sharp stinger
  ell(c, 0, -62, 92, 44, puff(c, 0, -62, 92, s.pal[2], col));
  for (let i = 0; i < 4; i++) { c.strokeStyle = 'rgba(80,30,0,.4)'; c.lineWidth = 4; c.beginPath(); c.moveTo(-40 + i * 26, -100); c.quadraticCurveTo(-34 + i * 26, -62, -40 + i * 26, -22); c.stroke(); }
  [-1, 1].forEach(function (d) { limbs(c, [-74, -62 + d * 14, -124, -62 + d * 44, -140, -84 + d * 38], 14, col); c.beginPath(); c.moveTo(-134, -84 + d * 38 - 16); c.lineTo(-170, -84 + d * 38); c.lineTo(-134, -84 + d * 38 + 16); c.closePath(); fs(c, '#d8602a'); });
  fierceEyes(c, -56, -90, 11, 8, s.hurt, '#ff3030'); roar(c, -52, -56, 14, 8 + (s.charge > 0 ? 10 : 2));
};
B.yeti = function (c, s) {
  const t = s.t;
  rr(c, -58, -34, 40, 34, 14); fs(c, '#dff0ff'); rr(c, 18, -34, 40, 34, 14); fs(c, '#dff0ff'); claws(c, -38, -2, 3, '#cfeaff'); claws(c, 38, -2, 3, '#cfeaff');
  ell(c, 0, -102, 80, 94, puff(c, 0, -102, 92, '#ffffff', '#a8c8e8'));
  [-1, 1].forEach(function (d) { limbs(c, [d * 70, -142, d * 116, -102 + Math.sin(t * 3 + d) * 8, d * 98, -50], 28, '#e8f4ff'); circ(c, d * 98, -44, 21, '#d0e8fa'); claws(c, d * 98, -26, 3, '#fffbea'); });
  ell(c, -4, -152, 48, 42, '#4a68a8');
  tri(c, -50, -178, -62, -214, -34, -184, '#fffbea'); tri(c, 40, -178, 54, -214, 26, -184, '#fffbea');                          // horns
  fierceEyes(c, -6, -158, 19, 11, s.hurt, '#ff5030'); roar(c, -6, -130, 26, 10 + (s.charge > 0 ? 18 : 6));
  c.fillStyle = '#fff'; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(-60 + i * 22, -192 + Math.abs(i - 2.5) * 5, 13, 0, TAU); c.fill(); }
};
/* ---------- the great fire dragon: bat wings that beat, a long spiked tail, horned head, jaws that open and breathe fire ---------- */
function taper(c, pts, w0, w1, fillStyle, spikeCol) {          // a tapering tube along a bezier (tails, necks)
  const P = function (u) { const a = 1 - u; return [a * a * a * pts[0] + 3 * a * a * u * pts[2] + 3 * a * u * u * pts[4] + u * u * u * pts[6], a * a * a * pts[1] + 3 * a * a * u * pts[3] + 3 * a * u * u * pts[5] + u * u * u * pts[7]]; };
  const L = [], R = [], N = 22;
  for (let i = 0; i <= N; i++) { const u = i / N, p = P(u), q = P(Math.min(1, u + 0.02)), r = P(Math.max(0, u - 0.02)), dx = q[0] - r[0], dy = q[1] - r[1], l = Math.hypot(dx, dy) || 1, w = (w0 + (w1 - w0) * u) / 2; L.push([p[0] - dy / l * w, p[1] + dx / l * w]); R.push([p[0] + dy / l * w, p[1] - dx / l * w]); }
  c.beginPath(); L.forEach(function (p, i) { i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }); for (let i = N; i >= 0; i--) c.lineTo(R[i][0], R[i][1]); c.closePath(); fs(c, fillStyle);
  if (spikeCol) for (let i = 2; i < N; i += 3) { const a = R[i], b = R[i + 1], u = i / N, h = 16 * (1 - u * 0.6); tri(c, a[0], a[1], (a[0] + b[0]) / 2 + (b[1] - a[1]) * 1.4, (a[1] + b[1]) / 2 - (b[0] - a[0]) * 1.4 - h * 0.3, b[0], b[1], spikeCol); }
  return P;
}
function batWing(c, x, y, ang, sc, p, flap) {
  c.save(); c.translate(x, y); c.rotate(ang); c.scale(sc, sc);
  const g = c.createLinearGradient(0, -140, 200, 60); g.addColorStop(0, mixHex(p[1], '#ffffff', 0.08)); g.addColorStop(1, dk(p[1], 0.55));
  c.beginPath(); c.moveTo(0, 0); c.lineTo(60, -112); c.lineTo(214, -150); c.quadraticCurveTo(196, -96, 204, -58); c.quadraticCurveTo(190, -34, 214, 14); c.quadraticCurveTo(172, -4, 160, 22); c.quadraticCurveTo(150, 52, 168, 78); c.quadraticCurveTo(110, 40, 82, 52); c.quadraticCurveTo(46, 36, 0, 0); c.closePath(); fs(c, g);
  c.strokeStyle = OUT; c.lineCap = 'round'; [[60, -112, 214, -150], [60, -112, 204, -58], [60, -112, 214, 14], [60, -112, 168, 78]].forEach(function (b) { c.beginPath(); c.moveTo(b[0], b[1]); c.lineTo(b[2], b[3]); c.lineWidth = 8; c.stroke(); });
  c.strokeStyle = p[0]; [[60, -112, 214, -150], [60, -112, 204, -58], [60, -112, 214, 14], [60, -112, 168, 78]].forEach(function (b) { c.beginPath(); c.moveTo(b[0], b[1]); c.lineTo(b[2], b[3]); c.lineWidth = 4; c.stroke(); });
  c.beginPath(); c.moveTo(0, 0); c.lineTo(60, -112); c.lineWidth = 12; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 7; c.strokeStyle = p[0]; c.stroke();
  tri(c, 214, -150, 232, -166, 222, -140, '#fff3b0');                         // wing claw
  c.restore();
}
B.dragon = function (c, s) {
  const t = s.t, p = s.pal, rage = s.rage, flap = Math.sin(t * (s.enter ? 6 : 3.2)), jaw = (s.charge > 0 || s.acting) ? 1 : 0.22 + 0.1 * Math.sin(t * 2), up = (flap * 0.5 + 0.5);
  const wingA = 0.25 - up * (s.enter ? 1.15 : 0.9);
  batWing(c, 36, -168, wingA - 0.12, 0.92, p, flap);                                                            // far wing
  const tip = taper(c, [70, -64, 150, -40 + Math.sin(t * 2) * 14, 190, -112 + Math.sin(t * 2.4) * 16, 262, -78 + Math.sin(t * 2.7) * 22], 46, 6, puff(c, 150, -80, 80, p[2], p[0]), '#fff3b0');   // tail
  { const e = tip(1); tri(c, e[0] - 6, e[1] - 16, e[0] + 26, e[1] + 4, e[0] - 6, e[1] + 18, p[1]); }                // spade tip
  [[96, 0, 34], [60, 0, 30]].forEach(function (L, i) { ell(c, L[0] - 6, -52, 30, 38, puff(c, L[0], -52, 38, p[2], p[0])); rr(c, L[0] - 24 + (i ? 4 : 0), -22, 36, 22, 9); fs(c, p[0]); claws(c, L[0] - 6, -2, 3); });  // hind legs
  ell(c, 8, -98, 96, 62, puff(c, 20, -106, 100, p[2], p[0]));                                                    // body
  ell(c, -4, -80, 62, 36, '#ffe3a0'); c.strokeStyle = 'rgba(150,80,20,.45)'; c.lineWidth = 2.5; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-54 + i * 4, -104 + i * 12); c.quadraticCurveTo(-4, -92 + i * 12, 46 - i * 4, -104 + i * 12); c.stroke(); }
  c.fillStyle = 'rgba(255,255,255,.14)'; c.beginPath(); c.ellipse(26, -128, 52, 12, -0.18, 0, TAU); c.fill();
  for (let i = 0; i < 7; i++) tri(c, -34 + i * 17, -152 + Math.abs(i - 3) * 4, -26 + i * 17, -176 + Math.abs(i - 3) * 4, -16 + i * 17, -150 + Math.abs(i - 3) * 4, '#fff3b0');   // back spikes
  if (rage) { c.strokeStyle = 'rgba(255,120,40,.85)'; c.lineWidth = 3; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-20 + i * 26, -138); c.lineTo(-14 + i * 26, -118); c.lineTo(-24 + i * 26, -100); c.stroke(); } }   // glowing cracks when furious
  batWing(c, 18, -150, wingA, 1.0, p, flap);                                                                     // near wing
  [[-46, 0], [14, 0]].forEach(function (L, i) { rr(c, L[0] - 16, -62, 32, 62, 13); fs(c, p[0]); rr(c, L[0] - 22, -16, 44, 16, 7); fs(c, p[0]); claws(c, L[0] - 4, -2, 4); });   // front legs
  taper(c, [-44, -122, -96, -126, -112, -154 - Math.sin(t * 2) * 4, -116, -196], 48, 36, puff(c, -90, -150, 70, p[2], p[0]), null);   // neck
  // head
  c.save(); c.translate(-148, -196 + Math.sin(t * 2.2) * 2); c.rotate(-0.06 - jaw * 0.04);
  [[22, -22, 70, -80, 4], [4, -30, 40, -92, 3]].forEach(function (h) { c.beginPath(); c.moveTo(h[0], h[1]); c.quadraticCurveTo(h[0] + 36, h[1] - 30, h[2], h[3]); c.quadraticCurveTo(h[0] + 22, h[1] - 26, h[0] - 14, h[1] + 10); c.closePath(); fs(c, '#fff3b0'); });   // horns
  c.save(); c.translate(24, 12); c.rotate(jaw * 0.52); c.beginPath(); c.moveTo(0, 0); c.lineTo(-70, 2); c.lineTo(-86, 18); c.lineTo(-38, 30); c.lineTo(4, 28); c.closePath(); fs(c, puff(c, -30, 14, 56, p[2], p[1]));
  c.fillStyle = '#fffbea'; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-16 - i * 13, 4); c.lineTo(-10 - i * 13, -9); c.lineTo(-4 - i * 13, 4); c.closePath(); c.fill(); c.stroke(); } c.restore();
  c.beginPath(); c.moveTo(34, 12); c.lineTo(-62, 8); c.lineTo(-24, 8 + jaw * 14); c.closePath(); c.fillStyle = s.charge > 0 || s.acting ? '#ff5a2a' : '#6a1a2a'; c.fill();     // mouth inside (glows when breathing)
  c.beginPath(); c.moveTo(36, -28); c.lineTo(-24, -40); c.lineTo(-84, -16); c.lineTo(-92, 0); c.lineTo(-78, 12); c.lineTo(-16, 10); c.lineTo(36, 14); c.closePath(); fs(c, puff(c, -20, -14, 70, p[2], p[0]));   // skull and upper jaw
  c.fillStyle = '#fffbea'; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-72 + i * 13, 8); c.lineTo(-66 + i * 13, 22); c.lineTo(-60 + i * 13, 8); c.closePath(); c.fill(); c.stroke(); }
  ell(c, -78, -8, 4, 3, '#2a0a0a'); ell(c, -64, -10, 3, 2.2, '#2a0a0a');                                           // nostrils
  tri(c, -44, -34, 0, -40, -4, -14, dk(p[1], 0.8));                                                              // heavy brow
  circ(c, -22, -20, 9, rage ? '#ff4a2a' : '#ffd23f'); c.fillStyle = '#1a0a0a'; c.beginPath(); c.ellipse(-22, -20, 2.4, 7, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(-25, -23, 2, 0, TAU); c.fill();
  [[18, 0], [8, 10]].forEach(function (k) { tri(c, k[0], k[1] - 6, k[0] + 22, k[1] + 4, k[0], k[1] + 8, '#fff3b0'); });   // cheek spikes
  if (p[3]) { c.beginPath(); c.moveTo(-16, -38); c.lineTo(-8, -64); c.lineTo(2, -42); c.lineTo(12, -68); c.lineTo(22, -40); c.lineTo(32, -62); c.lineTo(34, -30); c.closePath(); fs(c, '#ffd23f'); circ(c, 8, -46, 4, '#ff3a5a'); }   // the dragon king's crown
  if (!s.acting && s.charge <= 0) { c.fillStyle = 'rgba(80,80,90,.35)'; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(-86 - ((t * 24 + i * 12) % 36), -12 - ((t * 20 + i * 9) % 30), 3 + i, 0, TAU); c.fill(); } }   // smoke from the nostrils
  if (s.charge > 0 || (s.acting && s.move === 'breath')) {                                                       // fire gathers in the mouth, then streams out
    const k = s.acting ? 1 : s.charge, len = 60 + k * 120, fl = 0.55 + Math.sin(t * 34) * 0.18;
    const fg = c.createLinearGradient(-80, 0, -80 - len, 0); fg.addColorStop(0, 'rgba(255,240,150,.95)'); fg.addColorStop(0.45, 'rgba(255,130,40,.8)'); fg.addColorStop(1, 'rgba(255,60,20,0)');
    c.fillStyle = fg; c.beginPath(); c.moveTo(-76, -2); c.quadraticCurveTo(-80 - len * 0.55, -34 * fl - 6, -80 - len, -8); c.quadraticCurveTo(-80 - len * 0.55, 34 * fl + 8, -76, 14); c.closePath(); c.fill();
    const gl = c.createRadialGradient(-76, 6, 2, -76, 6, 30 + k * 26); gl.addColorStop(0, 'rgba(255,255,200,.9)'); gl.addColorStop(1, 'rgba(255,140,40,0)'); c.fillStyle = gl; c.beginPath(); c.arc(-76, 6, 30 + k * 26, 0, TAU); c.fill();
  }
  c.restore();
};
B.alien = function (c, s) {
  const t = s.t, p = s.pal, rage = s.rage, jaw = (s.charge > 0 || s.acting) ? 1 : 0.2 + 0.08 * Math.sin(t * 3), glow = rage ? '#ff4a6a' : p[2];
  taper(c, [60, -70, 130, -30 + Math.sin(t * 3) * 14, 170, -110 + Math.sin(t * 2.6) * 16, 236, -86 + Math.sin(t * 3.1) * 22], 30, 5, puff(c, 130, -80, 70, p[0], p[1]), null);    // tail
  { const e = [236, -86 + Math.sin(t * 3.1) * 22]; tri(c, e[0] - 4, e[1] - 18, e[0] + 38, e[1] + 2, e[0] - 4, e[1] + 18, '#cfeff0'); }                                                     // blade tip
  for (let i = 0; i < 5; i++) { const x = 8 + i * 18, y = -128 + Math.abs(i - 2) * 6; c.beginPath(); c.moveTo(x, y + 18); c.quadraticCurveTo(x + 14, y - 22, x + 30 + i * 4, y - 46 - i * 4); c.lineWidth = 9; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 5; c.strokeStyle = p[0]; c.stroke(); circ(c, x + 30 + i * 4, y - 46 - i * 4, 4, glow); }  // back tubes
  [[44, 0], [80, 0]].forEach(function (L, i) { limbs(c, [L[0] - 10, -70, L[0] + 24, -38 - i * 6, L[0] - 2, -6], 22, p[0]); rr(c, L[0] - 24, -14, 38, 14, 6); fs(c, p[1]); claws(c, L[0] - 8, -2, 3, '#cfeff0'); });   // legs
  ell(c, 6, -92, 64, 54, puff(c, 14, -100, 74, p[0], p[1]));                                                       // body
  c.strokeStyle = 'rgba(160,255,235,.35)'; c.lineWidth = 3; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-34 + i * 4, -122 + i * 14); c.quadraticCurveTo(8, -108 + i * 14, 48 - i * 4, -122 + i * 14); c.stroke(); }   // ribs
  c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.ellipse(22, -128, 38, 8, -0.2, 0, TAU); c.fill();
  [-1, 1].forEach(function (d, i) { const w = Math.sin(t * 4 + i * 2) * 8; limbs(c, [-34, -108 + i * 14, -92, -96 + i * 16 + w, -118, -52 + i * 10], 17, p[0]); [[-118, -52 + i * 10]].forEach(function (h) { for (let k = 0; k < 3; k++) tri(c, h[0] - 14 + k * 8, h[1] - 3, h[0] - 22 + k * 8, h[1] + 20, h[0] - 8 + k * 8, h[1] - 3, '#cfeff0'); }); });   // clawed arms
  limbs(c, [-34, -128, -62, -146, -76, -168], 30, p[0]);                                                          // neck
  c.save(); c.translate(-98, -178); c.rotate(-0.12 + (jaw > 0.9 ? -0.05 : 0));
  c.beginPath(); c.moveTo(70, -6); c.quadraticCurveTo(52, -50, -4, -40); c.quadraticCurveTo(-52, -30, -66, 2); c.lineTo(-48, 10); c.quadraticCurveTo(0, 6, 70, 14); c.closePath(); fs(c, puff(c, 10, -16, 82, p[0], p[1]));   // long smooth skull
  shine(c, 14, -34, 30, 5, -0.12);
  c.save(); c.translate(-44, 8); c.rotate(jaw * 0.5); c.beginPath(); c.moveTo(0, 0); c.lineTo(-22, 8); c.lineTo(-12, 20); c.lineTo(40, 18); c.lineTo(46, 4); c.closePath(); fs(c, p[1]); c.restore();   // lower jaw
  c.beginPath(); c.moveTo(-48, 8); c.lineTo(-6, 6); c.lineTo(-30, 8 + jaw * 16); c.closePath(); c.fillStyle = s.charge > 0 || s.acting ? '#7dff6a' : '#16321a'; c.fill();
  c.fillStyle = '#e8ffff'; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-52 + i * 9, 8); c.lineTo(-48 + i * 9, 20); c.lineTo(-44 + i * 9, 8); c.closePath(); c.fill(); c.stroke(); }
  [[-34, -14, 5], [-16, -22, 6], [4, -24, 5]].forEach(function (e) { const g = c.createRadialGradient(e[0], e[1], 1, e[0], e[1], e[2] * 3); g.addColorStop(0, glow); g.addColorStop(1, 'rgba(120,255,230,0)'); c.fillStyle = g; c.beginPath(); c.arc(e[0], e[1], e[2] * 3, 0, TAU); c.fill(); circ(c, e[0], e[1], e[2], '#eaffff'); });   // three glowing eyes
  c.restore();
  if (s.acting && s.move === 'breath') { const k = 1, g = c.createRadialGradient(-142, -166, 2, -142, -166, 56); g.addColorStop(0, 'rgba(220,255,160,.9)'); g.addColorStop(1, 'rgba(110,255,90,0)'); c.fillStyle = g; c.beginPath(); c.arc(-142, -166, 56, 0, TAU); c.fill(); }
};
/* a ball of fire (or green acid) that leaves a glowing tail behind it */
SP.fireball = function (c, x, y, t, ang, acid) {
  c.save(); c.translate(x, y); c.rotate(ang);
  const A = acid ? ['rgba(240,255,200,.95)', 'rgba(120,230,70,.85)', 'rgba(40,150,40,0)'] : ['rgba(255,250,190,.95)', 'rgba(255,140,40,.85)', 'rgba(220,40,20,0)'];
  const tl = c.createLinearGradient(0, 0, -46, 0); tl.addColorStop(0, A[1]); tl.addColorStop(1, A[2]); c.fillStyle = tl; c.beginPath(); c.moveTo(0, -9); c.quadraticCurveTo(-26, -14 - Math.sin(t * 40) * 3, -48, 0); c.quadraticCurveTo(-26, 14 + Math.sin(t * 40 + 1) * 3, 0, 9); c.closePath(); c.fill();
  const g = c.createRadialGradient(0, 0, 1, 0, 0, 14); g.addColorStop(0, A[0]); g.addColorStop(0.55, A[1]); g.addColorStop(1, A[2]); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 14, 0, TAU); c.fill();
  c.restore();
};
B.gorilla = function (c, s) {
  const t = s.t, col = s.pal[0];
  rr(c, -52, -38, 40, 38, 14); fs(c, col); rr(c, 14, -38, 40, 38, 14); fs(c, col);
  ell(c, 0, -104, 72, 80, puff(c, 0, -104, 82, s.pal[2], col));
  [-1, 1].forEach(function (d) { limbs(c, [d * 62, -150, d * 112, -108, d * 94 - 16, -22 + Math.sin(t * 5 + d) * 4], 32, col); circ(c, d * 94 - 16, -22, 21, '#2a2a3c'); });
  ell(c, 0, -112, 42, 46, '#a89478');
  circ(c, 0, -180, 40, puff(c, 0, -180, 40, s.pal[2], col));
  rr(c, -36, -202, 72, 22, 10); fs(c, '#2a2a3c');                                                                          // heavy brow ridge
  ell(c, -4, -164, 30, 24, '#c0a888');
  fierceEyes(c, -4, -182, 15, 8, s.hurt, '#ff4020'); roar(c, -4, -164, 22, 8 + (s.charge > 0 ? 16 : 5));
};
B.spider = function (c, s) {
  const t = s.t, col = s.pal[0];
  for (let i = 0; i < 4; i++) [-1, 1].forEach(function (d) { limbs(c, [d * 30, -70, d * (82 + i * 16), -128 + i * 12 + Math.sin(t * 4 + i) * 6, d * (114 + i * 24), -2], 10, col); });
  spikes(c, 40, -76, 10, 50, 66, 2, t, s.pal[1], '#ff6b86');
  ell(c, 38, -76, 56, 46, puff(c, 38, -76, 62, s.pal[2], col)); circ(c, 38, -86, 11, 'rgba(255,60,60,.7)');
  ell(c, -28, -86, 44, 40, puff(c, -28, -86, 46, s.pal[2], col));
  fierceEyes(c, -34, -100, 15, 9, s.hurt, '#ff2020');
  [[-46, -76], [-24, -76]].forEach(function (e) { circ(c, e[0], e[1], 5, '#ff2020'); });
  tri(c, -50, -64, -44, -42, -38, -64, '#fffbea'); tri(c, -28, -64, -22, -42, -16, -64, '#fffbea');                         // fangs
};
B.robot = function (c, s) {
  const t = s.t, p = s.pal;
  rr(c, -72, -28, 62, 28, 10); fs(c, '#5a5a78'); rr(c, 10, -28, 62, 28, 10); fs(c, '#5a5a78');
  rr(c, -64, -142, 128, 120, 22); fs(c, puff(c, 0, -80, 82, p[2], p[0])); rr(c, -42, -120, 84, 52, 12); fs(c, '#2b2f66');
  circ(c, 0, -52, 11, s.charge > 0 ? '#ff3030' : p[1]);
  tri(c, -64, -142, -84, -176, -44, -142, '#8a90b8'); tri(c, 64, -142, 84, -176, 44, -142, '#8a90b8');                         // shoulder spikes
  [-1, 1].forEach(function (d) { limbs(c, [d * 64, -122, d * 112, -92 + Math.sin(t * 3 + d) * 6, d * 102, -50], 20, '#8a90b8'); rr(c, d * 102 - 14, -64, 28, 30, 8); fs(c, '#3a3a58'); circ(c, d * 102, -40, 8, '#ff6b2c'); });
  rr(c, -48, -212, 96, 72, 18); fs(c, puff(c, 0, -176, 62, p[2], p[0]));
  rr(c, -38, -198, 76, 30, 10); fs(c, '#2b0f1e');
  fierceEyes(c, 0, -184, 19, 9, s.hurt, '#ff2a2a');
  rr(c, -30, -166, 60, 14, 4); fs(c, '#e8e8f8'); for (let i = 0; i < 6; i++) tri(c, -28 + i * 10, -166, -23 + i * 10, -154, -18 + i * 10, -166, '#3a3a58');
  c.beginPath(); c.moveTo(0, -212); c.lineTo(0, -232); c.lineWidth = 5; c.strokeStyle = OUT; c.stroke(); circ(c, 0, -236, 8, s.charge > 0 ? '#ff2a2a' : '#ffd23f');
};
B.eagle = function (c, s) {
  const t = s.t, fl = Math.sin(t * 5) * 0.35, p = s.pal;
  [-1, 1].forEach(function (d) { c.save(); c.translate(d * 20, -92); c.rotate(d * (0.5 + fl)); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(d * 100, -76, d * 156, -12); for (let i = 0; i < 4; i++) { c.lineTo(d * (150 - i * 28), 18 + (i % 2) * 14); c.lineTo(d * (136 - i * 28), 8); } c.lineTo(0, 22); c.closePath(); fs(c, p[0]); c.restore(); });
  ell(c, 22, -78, 66, 42, puff(c, 22, -78, 72, p[2], p[0])); tri(c, 70, -92, 128, -60, 70, -64, p[1]);
  circ(c, -44, -104, 33, puff(c, -44, -104, 33, '#ffffff', '#e0e0ec'));
  c.beginPath(); c.moveTo(-72, -106); c.quadraticCurveTo(-112, -100, -102, -66); c.quadraticCurveTo(-90, -86, -70, -88); c.closePath(); fs(c, '#ffc02a');   // hooked beak
  fierceEyes(c, -48, -114, 11, 8, s.hurt, '#ff2a2a');
  [-8, 24].forEach(function (x) { limbs(c, [x, -42, x - 4, -26, x - 10, -12], 7, '#ffc02a'); claws(c, x - 10, -8, 3, '#fffbea'); });
};
B.ufo = function (c, s) {
  const t = s.t, p = s.pal;
  c.save(); c.translate(0, Math.sin(t * 2) * 4);
  c.beginPath(); c.arc(0, -86, 52, Math.PI, 0); c.closePath(); c.fillStyle = 'rgba(190,240,255,.85)'; c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
  circ(c, 0, -102, 24, '#7fe08a'); fierceEyes(c, 0, -106, 9, 6.5, s.hurt, '#ff2a2a'); roar(c, 0, -94, 10, 6 + (s.charge > 0 ? 7 : 2));
  ell(c, 0, -62, 112, 29, puff(c, 0, -62, 112, p[2], p[0]));
  for (let i = -5; i <= 5; i++) tri(c, i * 20 - 7, -48, i * 20, -32, i * 20 + 7, -48, '#8a8ac0');                                  // spiky underside
  for (let i = -4; i <= 4; i++) circ(c, i * 22, -58 + Math.abs(i) * 1.4, 6, s.charge > 0 ? '#ff3030' : (i % 2 ? '#ffd23f' : '#ff6b86'));
  c.restore();
};
B.frog = function (c, s) {
  const t = s.t, col = s.pal[0];
  [-1, 1].forEach(function (d) { ell(c, d * 82, -24, 46, 22, col); ell(c, d * 40, -30, 24, 20, col); claws(c, d * 82, -6, 4, '#fffbea'); });
  for (let i = 0; i < 5; i++) tri(c, -60 + i * 30, -134 + Math.abs(i - 2) * 8, -52 + i * 30, -160 + Math.abs(i - 2) * 8, -44 + i * 30, -134 + Math.abs(i - 2) * 8, s.pal[1]);
  ell(c, 0, -80, 94, 72, puff(c, 0, -80, 102, s.pal[2], col)); ell(c, 0, -60, 60, 36, '#e8f8b8');
  [-1, 1].forEach(function (d) { circ(c, d * 42, -148, 29, col); });
  fierceEyes(c, 0, -152, 42, 15, s.hurt, '#ffb000');
  roar(c, 0, -96, 56, 12 + (s.charge > 0 ? 22 : 8));
};
B.golem = function (c, s) {
  const t = s.t, p = s.pal;
  rr(c, -58, -42, 48, 42, 8); fs(c, '#8a8aa0'); rr(c, 10, -42, 48, 42, 8); fs(c, '#8a8aa0');
  rr(c, -66, -152, 132, 118, 16); fs(c, puff(c, 0, -92, 82, '#b8b8d0', p[0]));
  c.strokeStyle = 'rgba(40,40,70,.5)'; c.lineWidth = 3; c.beginPath(); c.moveTo(-40, -150); c.lineTo(-20, -110); c.lineTo(-44, -80); c.moveTo(30, -140); c.lineTo(46, -100); c.stroke();
  [-1, 1].forEach(function (d) { tri(c, d * 66, -150, d * 96, -190, d * 40, -150, '#8a8aa8'); rr(c, d * 98 - 24, -142, 48, 58, 10); fs(c, '#a0a0bc'); rr(c, d * 98 - 30, -86 + Math.sin(t * 3 + d) * 5, 60, 54, 12); fs(c, '#8a8aa0'); });
  rr(c, -46, -220, 92, 74, 14); fs(c, puff(c, 0, -184, 58, '#c8c8e0', p[0]));
  tri(c, -46, -220, -38, -250, -20, -220, '#8a8aa8'); tri(c, 46, -220, 38, -250, 20, -220, '#8a8aa8');
  fierceEyes(c, 0, -194, 19, 9, s.hurt, s.charge > 0 ? '#ffb000' : '#ff3a2a');
  roar(c, 0, -170, 24, 6 + (s.charge > 0 ? 14 : 3));
  circ(c, -40, -150, 8, '#5ac66a'); circ(c, 54, -112, 9, '#5ac66a');
};
SP.BOSS_KINDS = Object.keys(B);
/* kind: lion|octopus|scorpion|yeti|dragon|gorilla|spider|robot|eagle|ufo|frog|golem */
SP.bossDraw = function (c, kind, x, y, s) {
  const sc = s.scale || 1.2, pal = s.pal || [], rage = s.rage;
  c.save(); c.translate(x, y); c.scale(sc, sc);
  if (s.charge > 0) c.translate(Math.sin(s.t * 40) * 2 * s.charge, 0);
  // glowing aura behind the creature (red and angry in the last phase)
  const ar = c.createRadialGradient(0, -110, 20, 0, -110, 190); const ac = rage ? '255,60,40' : '255,200,120'; ar.addColorStop(0, 'rgba(' + ac + ',' + (rage ? 0.32 : 0.16) + ')'); ar.addColorStop(1, 'rgba(' + ac + ',0)');
  c.fillStyle = ar; c.beginPath(); c.arc(0, -110, 190, 0, TAU); c.fill();
  (B[kind] || B.robot)(c, s);
  // special effects while attacking
  if (kind === 'ufo' && s.acting) { const tg = c.createLinearGradient(0, -40, 0, 0); tg.addColorStop(0, 'rgba(160,255,200,.55)'); tg.addColorStop(1, 'rgba(160,255,200,0)'); c.fillStyle = tg; c.beginPath(); c.moveTo(-50, -34); c.lineTo(50, -34); c.lineTo(120, 40); c.lineTo(-120, 40); c.closePath(); c.fill(); }
  if (rage) { c.fillStyle = 'rgba(255,120,40,.8)'; for (let i = 0; i < 8; i++) { const ex = Math.sin(i * 12.9 + s.t * 1.3) * 90, ey = -((s.t * 60 + i * 37) % 200) - 20; c.beginPath(); c.arc(ex, ey, 3, 0, TAU); c.fill(); } }
  flash(c, s);
  c.restore();
};
SP.BOSS_PALS = {
  lion: ['#e8821f', '#c8641a', '#ffe0a0'], octopus: ['#c06aff', '#8a3ad0', '#e8c0ff'], scorpion: ['#e8883a', '#c8641a', '#ffd8a0'], yeti: ['#fff', '#b8d8f0', '#fff'],
  dragon: ['#ff6b4a', '#c8321a', '#ffa88a'], alien: ['#3b8f9a', '#17323f', '#8af5e2'], dragonIce: ['#6ab8ff', '#3a7ad0', '#c8e8ff'], dragonKing: ['#c8321a', '#4a0f1a', '#ff8a4a', true],
  gorilla: ['#5a5a70', '#3a3a50', '#8a8aa0'], spider: ['#8a5ad0', '#5a2a9a', '#c8a8ff'], robot: ['#7a8ad0', '#ffd23f', '#d0d8ff'], robotGold: ['#ffc83a', '#ff6b86', '#fff0b0'],
  eagle: ['#a0703a', '#6a4a22', '#d8a860'], ufo: ['#8a8ac8', '#ffd23f', '#d8d8ff'], frog: ['#5ac66a', '#2f9e55', '#a8f0a0'], golem: ['#8a8aa8', '#6a6a88', '#c8c8e0']
};
})();
