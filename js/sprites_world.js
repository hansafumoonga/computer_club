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

/* background for a stage: sky, sun/moon, clouds, far hills, decoration (all parallax) */
SP.world = function (c, W, Hh, gy, cam, ti, t) {
  const th = SP.THEMES[ti % SP.THEMES.length];
  c.drawImage(cached('sky' + ti, W, Hh, function (k) { const g = k.createLinearGradient(0, 0, 0, gy); g.addColorStop(0, th.top); g.addColorStop(1, th.bot); k.fillStyle = g; k.fillRect(0, 0, W, Hh); }), 0, 0);
  if (ti % 15 === 3 || ti % 15 === 13) {      // gentle northern lights
    for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(0, 30 + i * 22); for (let x = 0; x <= W; x += 20) c.lineTo(x, 30 + i * 22 + Math.sin(x / 90 + t * 0.4 + i * 2) * 14); c.lineTo(W, 74 + i * 22); for (let x = W; x >= 0; x -= 20) c.lineTo(x, 74 + i * 22 + Math.sin(x / 70 + t * 0.3 + i) * 10); c.closePath(); c.fillStyle = ['rgba(120,255,200,.16)', 'rgba(170,140,255,.14)', 'rgba(120,200,255,.12)'][i]; c.fill(); }
  }
  if (th.stars) { for (let i = 0; i < 40; i++) { c.globalAlpha = 0.4 + 0.3 * Math.sin(t * 0.8 + i); c.fillStyle = '#fff'; c.fillRect((i * 137 + 40) % W, (i * 71 + 20) % (gy * 0.6), 2, 2); } c.globalAlpha = 1; }
  if (th.orb) { const o = th.orb, gr = c.createRadialGradient(o[1], o[2], 4, o[1], o[2], o[3] * 2.4); gr.addColorStop(0, o[0]); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.beginPath(); c.arc(o[1], o[2], o[3] * 2.4, 0, TAU); c.fill(); circ(c, o[1], o[2], o[3] * 0.9, o[0]); }
  if (th.cloud) { c.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 5; i++) { const cx = (((i * 300 - cam * 0.08 - t * 4) % (W + 300)) + W + 300) % (W + 300) - 150, cy = 50 + (i % 3) * 40; c.beginPath(); c.ellipse(cx, cy, 52, 15, 0, 0, TAU); c.ellipse(cx + 28, cy - 8, 32, 14, 0, 0, TAU); c.fill(); } }
  // far hills
  c.fillStyle = th.far; c.beginPath(); c.moveTo(0, gy);
  for (let x = 0; x <= W + 10; x += 10) c.lineTo(x, gy - 70 - 28 * Math.sin((x + cam * 0.2) / 110) - 14 * Math.sin((x + cam * 0.2) / 47));
  c.lineTo(W, gy); c.closePath(); c.fill();
  // far decoration row (smaller, hazier)
  { const sp2 = 170, f2 = Math.floor(cam * 0.3 / sp2) - 1; c.save(); c.globalAlpha = 0.5;
    for (let i = f2; i < f2 + Math.ceil(W / sp2) + 3; i++) { const s2 = hash(i * 3 + ti * 17), k2 = th.dec[Math.floor(hash(i * 11 + ti) * th.dec.length)]; c.save(); c.translate(i * sp2 + s2 * 60 - cam * 0.3, gy - 4); c.scale(0.62, 0.62); deco(c, k2, 0, 0, s2, th, t); c.restore(); }
    c.restore(); }
  // decoration
  const sp = 230, par = 0.5, first = Math.floor(cam * par / sp) - 1;
  for (let i = first; i < first + Math.ceil(W / sp) + 3; i++) {
    const s = hash(i + ti * 31), kind = th.dec[Math.floor(hash(i * 7 + ti) * th.dec.length)];
    deco(c, kind, i * sp + s * 80 - cam * par, gy + 6, s, th, t);
  }
  // near hills
  c.fillStyle = th.near; c.beginPath(); c.moveTo(0, gy);
  for (let x = 0; x <= W + 10; x += 10) c.lineTo(x, gy - 14 - 12 * Math.sin((x + cam * 0.7) / 60));
  c.lineTo(W, gy); c.closePath(); c.fill();
  { const fg = c.createLinearGradient(0, gy - 90, 0, gy); fg.addColorStop(0, 'rgba(255,255,255,0)'); fg.addColorStop(1, 'rgba(255,255,255,.18)'); c.fillStyle = fg; c.fillRect(0, gy - 90, W, 90); }
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
  c.drawImage(cached('vig', W, Hh, function (k) { const v = k.createRadialGradient(W / 2, Hh / 2, Hh * 0.45, W / 2, Hh / 2, W * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,20,.38)'); k.fillStyle = v; k.fillRect(0, 0, W, Hh); }), 0, 0);
};
/* ground block from x0 to x1 (world coords): soil gradient, grassy lip, stones */
function dk(hex, k) { const n = parseInt(hex.slice(1), 16), r = (n >> 16) * k, g = ((n >> 8) & 255) * k, b = (n & 255) * k; return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')'; }
SP.ground = function (c, ti, x0, x1, gy, Hh) {
  const th = SP.THEMES[ti % SP.THEMES.length];
  const gr = c.createLinearGradient(0, gy, 0, Hh); gr.addColorStop(0, th.ground); gr.addColorStop(1, dk(th.ground, 0.55));
  c.fillStyle = gr; c.fillRect(x0, gy, x1 - x0, Hh - gy);
  c.fillStyle = th.edge;
  for (let x = Math.floor(x0 / 14) * 14; x < x1; x += 14) { const h = 4 + hash(x * 0.37) * 7; c.beginPath(); c.moveTo(x, gy + 8); c.lineTo(x + 5 + hash(x) * 4, gy - h); c.lineTo(x + 14, gy + 8); c.closePath(); c.fill(); }
  c.fillRect(x0, gy + 4, x1 - x0, 6);
  c.fillStyle = 'rgba(0,0,0,.14)'; c.fillRect(x0, gy + 10, x1 - x0, 3);
  for (let x = Math.floor(x0 / 70) * 70; x < x1; x += 70) { const yy = gy + 26 + hash(x * 1.7) * 64, rw = 8 + hash(x * 2.3) * 14; c.fillStyle = 'rgba(0,0,0,.16)'; c.beginPath(); c.ellipse(x + hash(x) * 40, yy, rw, rw * 0.6, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.08)'; c.beginPath(); c.ellipse(x + hash(x) * 40 - 2, yy - 2, rw * 0.6, rw * 0.3, 0, 0, TAU); c.fill(); }
  c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(x0, gy + 8, 3, Hh); c.fillRect(x1 - 3, gy + 8, 3, Hh);
};
/* pit liquid between ground blocks */
SP.pit = function (c, ti, x0, x1, gy, Hh, t) {
  const th = SP.THEMES[ti % SP.THEMES.length], k = th.liquid, w = x1 - x0;
  const cols = { water: ['#4ab8f0', '#1f6aa8'], lava: ['#ff9a3a', '#c8321a'], goo: ['#b8c85a', '#6a7a2a'], goo2: ['#c06aff', '#5a2a9a'], void: ['#2a2a6a', '#0c0c26'], sky: ['#9ad0ff', '#4a90e0'] }[k];
  const gr = c.createLinearGradient(0, gy + 20, 0, Hh); gr.addColorStop(0, cols[0]); gr.addColorStop(1, cols[1]);
  c.fillStyle = gr; c.fillRect(x0, gy + 24, w, Hh - gy - 24);
  if (k !== 'void' && k !== 'sky') { c.beginPath(); c.moveTo(x0, gy + 28); for (let x = 0; x <= w; x += 8) c.lineTo(x0 + x, gy + 24 + Math.sin(x / 14 + t * 2) * 4); c.lineTo(x1, gy + 40); c.lineTo(x0, gy + 40); c.closePath(); c.fillStyle = cols[0]; c.fill(); }
  if (k === 'lava') { c.fillStyle = '#ffd23f'; for (let i = 0; i < w / 40; i++) { c.beginPath(); c.arc(x0 + 20 + i * 40, gy + 50 + Math.sin(t * 2 + i) * 8, 4, 0, TAU); c.fill(); } }
  if (k === 'void' || k === 'sky') { c.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < w / 30; i++) c.fillRect(x0 + 12 + i * 30, gy + 60 + (i * 37) % 50, 2, 2); }
};
/* one-way platform (stand on top, jump up through it, press Down to drop) */
SP.platform = function (c, ti, x, y, w) {
  const th = SP.THEMES[ti % SP.THEMES.length];
  rr(c, x, y, w, 16, 7); fs(c, th.plat);
  c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x + 6, y + 3, w - 12, 3);
  c.fillStyle = 'rgba(0,0,0,.18)'; for (let i = 14; i < w - 8; i += 24) c.fillRect(x + i, y + 9, 10, 3);
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
B.dragon = function (c, s) {
  const t = s.t, p = s.pal, fl = Math.sin(t * 4) * 0.25;
  c.save(); c.translate(30, -150); c.rotate(-0.5 + fl); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(40, -120, 118, -78); c.lineTo(96, -52); c.quadraticCurveTo(100, -44, 84, -30); c.lineTo(60, -26); c.quadraticCurveTo(40, -20, 30, 18); c.closePath(); fs(c, p[1]); c.restore();    // jagged wing
  limbs(c, [60, -70, 154, -72, 164, -142 + Math.sin(t * 2) * 12], 24, p[0]); tri(c, 154, -146, 188, -156, 168, -122, p[1]);
  for (let i = 0; i < 6; i++) tri(c, -20 + i * 18, -150 + Math.abs(i - 2) * 6, -12 + i * 18, -176 + Math.abs(i - 2) * 6, -4 + i * 18, -148 + Math.abs(i - 2) * 6, '#fff3b0');   // back spikes
  rr(c, -52, -52, 36, 52, 14); fs(c, p[0]); rr(c, 30, -52, 36, 52, 14); fs(c, p[0]); claws(c, -34, -3, 3); claws(c, 48, -3, 3);
  ell(c, 20, -100, 86, 58, puff(c, 20, -100, 92, p[2], p[0])); ell(c, 14, -86, 56, 36, '#ffe9a8');
  limbs(c, [-40, -140, -84, -132, -92, -172], 32, p[0]);
  ell(c, -96, -180, 48, 38, puff(c, -96, -180, 48, p[2], p[0])); ell(c, -132, -168, 26, 20, p[0]);
  [[-64, -212, -78, -246], [-100, -218, -118, -252]].forEach(function (h) { tri(c, h[0] - 8, h[1] + 12, h[2], h[3], h[0] + 10, h[1] + 12, '#fff3b0'); });
  fierceEyes(c, -102, -192, 11, 9, s.hurt, '#ffd000');
  roar(c, -126, -158, 16, 8 + (s.charge > 0 ? 16 : 4));
  if (p[3]) { c.beginPath(); c.moveTo(-124, -212); c.lineTo(-114, -236); c.lineTo(-102, -216); c.lineTo(-90, -238); c.lineTo(-80, -212); c.closePath(); fs(c, '#ffd23f'); }
  if (s.charge > 0) { c.fillStyle = 'rgba(255,170,60,' + (0.3 + s.charge * 0.5) + ')'; circ(c, -158, -162, 8 + s.charge * 16, 'rgba(255,170,60,.8)'); }
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
  if (kind === 'dragon' && (s.acting || s.charge > 0)) { c.save(); c.translate(-132, -158); const fl = 0.5 + Math.sin(s.t * 30) * 0.15, len = 70 + (s.acting ? 70 : s.charge * 40); const fg = c.createLinearGradient(0, 0, -len, 0); fg.addColorStop(0, 'rgba(255,230,120,.95)'); fg.addColorStop(0.5, 'rgba(255,120,40,.8)'); fg.addColorStop(1, 'rgba(255,60,20,0)'); c.fillStyle = fg; c.beginPath(); c.moveTo(0, -6); c.quadraticCurveTo(-len * 0.6, -26 * fl - 8, -len, -4); c.quadraticCurveTo(-len * 0.6, 26 * fl + 8, 0, 8); c.closePath(); c.fill(); c.restore(); }
  if (kind === 'ufo' && s.acting) { const tg = c.createLinearGradient(0, -40, 0, 0); tg.addColorStop(0, 'rgba(160,255,200,.55)'); tg.addColorStop(1, 'rgba(160,255,200,0)'); c.fillStyle = tg; c.beginPath(); c.moveTo(-50, -34); c.lineTo(50, -34); c.lineTo(120, 40); c.lineTo(-120, 40); c.closePath(); c.fill(); }
  if (rage) { c.fillStyle = 'rgba(255,120,40,.8)'; for (let i = 0; i < 8; i++) { const ex = Math.sin(i * 12.9 + s.t * 1.3) * 90, ey = -((s.t * 60 + i * 37) % 200) - 20; c.beginPath(); c.arc(ex, ey, 3, 0, TAU); c.fill(); } }
  flash(c, s);
  c.restore();
};
SP.BOSS_PALS = {
  lion: ['#e8821f', '#c8641a', '#ffe0a0'], octopus: ['#c06aff', '#8a3ad0', '#e8c0ff'], scorpion: ['#e8883a', '#c8641a', '#ffd8a0'], yeti: ['#fff', '#b8d8f0', '#fff'],
  dragon: ['#ff6b4a', '#c8321a', '#ffa88a'], dragonIce: ['#6ab8ff', '#3a7ad0', '#c8e8ff'], dragonKing: ['#a77bff', '#5a2a9a', '#d0b8ff', true],
  gorilla: ['#5a5a70', '#3a3a50', '#8a8aa0'], spider: ['#8a5ad0', '#5a2a9a', '#c8a8ff'], robot: ['#7a8ad0', '#ffd23f', '#d0d8ff'], robotGold: ['#ffc83a', '#ff6b86', '#fff0b0'],
  eagle: ['#a0703a', '#6a4a22', '#d8a860'], ufo: ['#8a8ac8', '#ffd23f', '#d8d8ff'], frog: ['#5ac66a', '#2f9e55', '#a8f0a0'], golem: ['#8a8aa8', '#6a6a88', '#c8c8e0']
};
})();
