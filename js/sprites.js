/* sprites.js - ALL character / enemy / obstacle / bullet / fruit drawing lives here.
   Each function takes (ctx, x, y, ...state) and draws one thing.  The game files only call these,
   so to use your own image instead, replace the body of one function with ctx.drawImage(...).
   Style rules shared by everything: dark-navy outline (OUT, LW), rounded shapes, soft highlight, simple faces. */
(function () {
'use strict';
const OUT = '#1a1b3f', LW = 3;
const TAU = Math.PI * 2;
const SP = CC.sprites = {};

/* ---------- tiny drawing helpers ---------- */
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function fs(ctx, fill) { ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = LW; ctx.strokeStyle = OUT; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
function ell(ctx, x, y, rx, ry, fill) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); fs(ctx, fill); }
function circ(ctx, x, y, r, fill) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); fs(ctx, fill); }
/* radial "puffy" fill: light spot up-left */
const _puffCache = {};
/* gradients are in the coordinate system at fill time, so one gradient can be reused everywhere (much faster) */
function puff(ctx, x, y, r, c1, c2) {
  const key = x + "|" + y + "|" + r + "|" + c1 + "|" + c2; let g = _puffCache[key];
  if (!g) { g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.1); g.addColorStop(0, c1); g.addColorStop(1, c2); _puffCache[key] = g; }
  return g;
}
function shine(ctx, x, y, rx, ry, rot) {
  ctx.save(); ctx.globalAlpha = 0.55; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || -0.6, 0, TAU); ctx.fill(); ctx.restore();
}
function eyes(ctx, x, y, gap, r, look, shut) {
  [-1, 1].forEach(function (s) {
    const ex = x + s * gap;
    if (shut) { ctx.beginPath(); ctx.moveTo(ex - r, y); ctx.quadraticCurveTo(ex, y + r * 0.8, ex + r, y); ctx.lineWidth = 2.5; ctx.strokeStyle = OUT; ctx.stroke(); return; }
    ctx.beginPath(); ctx.arc(ex, y, r, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.beginPath(); ctx.arc(ex + (look || 0) * r * 0.35, y + r * 0.1, r * 0.5, 0, TAU); ctx.fillStyle = OUT; ctx.fill();
    ctx.beginPath(); ctx.arc(ex + (look || 0) * r * 0.35 - r * 0.15, y - r * 0.15, r * 0.17, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill();
  });
}
function smile(ctx, x, y, w, h) {
  ctx.beginPath(); ctx.moveTo(x - w, y); ctx.quadraticCurveTo(x, y + h, x + w, y); ctx.lineWidth = 2.5; ctx.strokeStyle = OUT; ctx.lineCap = 'round'; ctx.stroke();
}
function cheeks(ctx, x, y, gap, r) {
  ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = '#ff7a9a';
  [-1, 1].forEach(function (s) { ctx.beginPath(); ctx.ellipse(x + s * gap, y, r, r * 0.65, 0, 0, TAU); ctx.fill(); });
  ctx.restore();
}
/* angry eyebrows over eyes at (x,y) with gap g and eye radius r */
function brows(ctx, x, y, g, r) {
  ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = Math.max(2.5, r * 0.55);
  [-1, 1].forEach(function (d) { ctx.beginPath(); ctx.moveTo(x + d * (g + r * 1.5), y - r * 1.9); ctx.lineTo(x + d * Math.max(0, g - r * 1.2), y - r * 0.9); ctx.stroke(); });
  ctx.restore();
}
/* fierce glowing eyes with slit pupils and heavy brows (used by bosses) */
function fierceEyes(ctx, x, y, g, r, hurt, iris) {
  [-1, 1].forEach(function (d) {
    const ex = x + d * g;
    if (hurt) { ctx.beginPath(); ctx.moveTo(ex - r, y - r * 0.4); ctx.lineTo(ex + r, y + r * 0.4); ctx.moveTo(ex - r, y + r * 0.4); ctx.lineTo(ex + r, y - r * 0.4); ctx.lineWidth = 3; ctx.strokeStyle = OUT; ctx.stroke(); return; }
    ctx.beginPath(); ctx.ellipse(ex, y, r, r * 0.78, 0, 0, TAU); ctx.fillStyle = '#fff6c8'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = OUT; ctx.stroke();
    circ(ctx, ex - d * r * 0.1, y + r * 0.05, r * 0.62, iris || '#ff4a2a');
    ctx.beginPath(); ctx.ellipse(ex - d * r * 0.1, y + r * 0.05, r * 0.15, r * 0.55, 0, 0, TAU); ctx.fillStyle = OUT; ctx.fill();
    ctx.beginPath(); ctx.moveTo(ex - d * r * 1.7, y - r * 1.9); ctx.lineTo(ex + d * r * 1.1, y - r * 0.55); ctx.lineWidth = r * 0.7; ctx.lineCap = 'round'; ctx.strokeStyle = OUT; ctx.stroke();
  });
}
/* roaring mouth with fangs. w = half width, h = how wide it is open */
function roar(ctx, x, y, w, h) {
  ctx.beginPath(); ctx.moveTo(x - w, y); ctx.quadraticCurveTo(x, y - h * 0.3, x + w, y); ctx.quadraticCurveTo(x + w * 0.8, y + h, x, y + h * 1.1); ctx.quadraticCurveTo(x - w * 0.8, y + h, x - w, y); ctx.closePath(); fs(ctx, '#4a0f1e');
  ctx.beginPath(); ctx.ellipse(x, y + h * 0.78, w * 0.45, h * 0.3, 0, 0, TAU); ctx.fillStyle = '#ff7a9a'; ctx.fill();
  const n = 4; for (let i = 0; i < n; i++) { const fx = x - w * 0.7 + i * (w * 1.4 / (n - 1)); ctx.beginPath(); ctx.moveTo(fx - w * 0.14, y - h * 0.05); ctx.lineTo(fx, y + h * 0.5); ctx.lineTo(fx + w * 0.14, y - h * 0.05); ctx.closePath(); ctx.fillStyle = '#fffbea'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = OUT; ctx.stroke(); }
  [-1, 1].forEach(function (d) { ctx.beginPath(); ctx.moveTo(x + d * w * 0.5, y + h * 1.0); ctx.lineTo(x + d * w * 0.4, y + h * 0.55); ctx.lineTo(x + d * w * 0.65, y + h * 0.85); ctx.closePath(); ctx.fillStyle = '#fffbea'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = OUT; ctx.stroke(); });
}
/* small grumpy toothy mouth for ordinary enemies */
function grr(ctx, x, y, w) {
  ctx.beginPath(); ctx.moveTo(x - w, y); for (let i = 0; i < 5; i++) ctx.lineTo(x - w + (i + 0.5) * w * 0.4, y + (i % 2 ? -2 : 4)); ctx.lineTo(x + w, y); ctx.lineWidth = 2.5; ctx.strokeStyle = OUT; ctx.lineJoin = 'round'; ctx.stroke();
}
SP.helpers = { brows: brows, fierceEyes: fierceEyes, roar: roar, grr: grr, rr: rr, circ: circ, ell: ell, fs: fs, puff: puff, shine: shine, eyes: eyes, smile: smile, cheeks: cheeks };

/* ============ scenery shared by Jump Over! and Commando Run ============ */
const THEMES = [
  { top: '#24265e', bot: '#5b4b9a', far: '#3a3c88', near: '#4c4aa3', ground: '#6a5acd', edge: '#8e7bff' },
  { top: '#1f3a6e', bot: '#4aa0b8', far: '#2c5c92', near: '#3a7fa8', ground: '#2f8f8f', edge: '#5fd3c4' },
  { top: '#3a2a6e', bot: '#d9788f', far: '#6a3f94', near: '#8e4f9a', ground: '#a0527a', edge: '#ff9fb0' },
  { top: '#1d3d4e', bot: '#4fa86f', far: '#2b6a58', near: '#37875f', ground: '#3d9a55', edge: '#8fe08a' },
  { top: '#2c2362', bot: '#e89b5a', far: '#5a3d8a', near: '#7d4a8a', ground: '#b5683f', edge: '#ffc27a' },
  { top: '#202a66', bot: '#7a6fe0', far: '#3d4aa8', near: '#5a62c0', ground: '#4d56b8', edge: '#a9b1ff' },
  { top: '#22345e', bot: '#5ec0d8', far: '#2f6a9a', near: '#3d8fb8', ground: '#2b8aa0', edge: '#8ae8f0' }
];
SP.scene = function (ctx, W, H, groundY, scroll, theme, t) {
  const th = THEMES[theme % THEMES.length];
  const g = ctx.createLinearGradient(0, 0, 0, groundY); g.addColorStop(0, th.top); g.addColorStop(1, th.bot);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // slow, gentle twinkle (no flashing)
  for (let i = 0; i < 28; i++) {
    const sx = (i * 137 + 40) % W, sy = (i * 71 + 20) % (groundY * 0.55);
    ctx.globalAlpha = 0.45 + 0.25 * Math.sin(t * 0.8 + i);
    ctx.fillStyle = '#fff'; ctx.fillRect(sx, sy, 2, 2);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(255,247,200,.9)'; ctx.beginPath(); ctx.arc(W - 110, 70, 28, 0, TAU); ctx.fill();
  // clouds
  ctx.fillStyle = 'rgba(255,255,255,.16)';
  for (let i = 0; i < 4; i++) {
    const cx = ((i * 260 - scroll * 0.12) % (W + 200) + W + 200) % (W + 200) - 100, cy = 60 + (i % 2) * 40;
    ctx.beginPath(); ctx.ellipse(cx, cy, 50, 16, 0, 0, TAU); ctx.ellipse(cx + 28, cy - 8, 32, 14, 0, 0, TAU); ctx.fill();
  }
  // hills (two parallax layers)
  function hills(col, speed, amp, base, wl) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, groundY);
    for (let x = 0; x <= W + 10; x += 10) ctx.lineTo(x, groundY - base - amp * Math.sin((x + scroll * speed) / wl) - amp * 0.5 * Math.sin((x + scroll * speed) / (wl * 0.43)));
    ctx.lineTo(W, groundY); ctx.closePath(); ctx.fill();
  }
  hills(th.far, 0.2, 26, 60, 90); hills(th.near, 0.45, 18, 22, 60);
  // ground
  ctx.fillStyle = th.ground; ctx.fillRect(0, groundY, W, H - groundY);
  ctx.fillStyle = th.edge; ctx.fillRect(0, groundY, W, 6);
  ctx.fillStyle = 'rgba(0,0,0,.12)';
  for (let x = -((scroll) % 60); x < W; x += 60) ctx.fillRect(x, groundY + 22, 28, 5);
  for (let x = -((scroll * 1.0 + 30) % 90); x < W; x += 90) ctx.fillRect(x, groundY + 44, 18, 5);
};

/* ============ hearts (lives) ============ */
SP.heart = function (ctx, x, y, size, full) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size / 20, size / 20);
  ctx.beginPath(); ctx.moveTo(0, 8); ctx.bezierCurveTo(-14, -2, -8, -12, 0, -5); ctx.bezierCurveTo(8, -12, 14, -2, 0, 8);
  ctx.fillStyle = full ? '#ff6b86' : 'rgba(255,255,255,.18)'; ctx.fill();
  ctx.lineWidth = 2.2; ctx.strokeStyle = full ? OUT : 'rgba(255,255,255,.35)'; ctx.stroke();
  if (full) shine(ctx, -4, -4, 2.5, 1.5);
  ctx.restore();
};

/* ============ JUMP OVER! ============ */
SP.JUMP_OBSTACLES = { bush: { w: 64, h: 46 }, rock: { w: 54, h: 52 }, stump: { w: 50, h: 76 }, bee: { w: 60, h: 40 } };
/* hero blob. anchor = bottom centre. s = {t, air, duck, sx, sy, hurt, look} */
SP.runner = function (ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s.sx || 1, s.sy || 1);
  const run = !s.air && !s.duck ? Math.sin(s.t * 16) : 0;
  const bodyY = s.duck ? -22 : -36, ry = s.duck ? 21 : 31, rx = s.duck ? 34 : 31;
  // feet
  const fy = s.air ? -10 : -5;
  ell(ctx, -13 + (s.air ? -4 : run * 6), fy - Math.max(0, -run) * 4, 11, 7, '#ff9f45');
  ell(ctx, 13 + (s.air ? 4 : -run * 6), fy - Math.max(0, run) * 4, 11, 7, '#ff9f45');
  // antenna (the computer-club touch)
  if (!s.duck) {
    ctx.beginPath(); ctx.moveTo(0, bodyY - ry + 3); ctx.quadraticCurveTo(6 + run, bodyY - ry - 12, 10, bodyY - ry - 18); ctx.lineWidth = 3; ctx.strokeStyle = OUT; ctx.stroke();
    circ(ctx, 10, bodyY - ry - 20, 6, '#ffd23f');
  }
  ctx.beginPath(); ctx.ellipse(0, bodyY, rx, ry, 0, 0, TAU); fs(ctx, puff(ctx, 0, bodyY, 32, '#ff9aa8', '#f2566e'));
  // belly
  ctx.beginPath(); ctx.ellipse(0, bodyY + ry * 0.35, rx * 0.55, ry * 0.45, 0, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fill();
  shine(ctx, -12, bodyY - ry * 0.55, 8, 4);
  eyes(ctx, 0, bodyY - ry * 0.18, 10, s.duck ? 5.5 : 7, 0.6, s.hurt);
  cheeks(ctx, 0, bodyY + ry * 0.12, 18, 5);
  if (s.hurt) { ctx.beginPath(); ctx.arc(0, bodyY + ry * 0.3, 4, 0, TAU); ctx.fillStyle = OUT; ctx.fill(); } else smile(ctx, 0, bodyY + ry * 0.2, 6, 5);
  ctx.restore();
};
/* ground obstacles: anchor bottom-centre.  alpha handled by caller */
SP.bush = function (ctx, x, y, t) {
  ctx.save(); ctx.translate(x, y);
  circ(ctx, -18, -17, 17, puff(ctx, -18, -17, 17, '#8be28a', '#2f9e55'));
  circ(ctx, 18, -17, 17, puff(ctx, 18, -17, 17, '#8be28a', '#2f9e55'));
  circ(ctx, 0, -23, 22, puff(ctx, 0, -23, 22, '#a4f0a0', '#35a85c'));
  eyes(ctx, 0, -24, 7, 5, -0.4); smile(ctx, 0, -14, 4, 3);
  circ(ctx, 14, -38, 4, '#ff5c72'); circ(ctx, -16, -34, 3.5, '#ff5c72');
  ctx.restore();
};
SP.rockFriend = function (ctx, x, y, t) {
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.moveTo(-26, 0); ctx.quadraticCurveTo(-32, -34, -12, -48); ctx.quadraticCurveTo(10, -56, 24, -40); ctx.quadraticCurveTo(32, -20, 26, 0); ctx.closePath();
  fs(ctx, puff(ctx, 0, -28, 32, '#c2c4ea', '#7479b8'));
  shine(ctx, -10, -40, 8, 4);
  eyes(ctx, 0, -28, 8, 6, 0, false); smile(ctx, 0, -14, 6, 4); cheeks(ctx, 0, -20, 15, 4);
  ctx.restore();
};
SP.stump = function (ctx, x, y, t) {
  ctx.save(); ctx.translate(x, y);
  rr(ctx, -22, -66, 44, 66, 9); fs(ctx, '#b8793f');
  ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(-16, -58, 6, 50);
  ell(ctx, 0, -66, 22, 8, '#e8b87a'); ctx.beginPath(); ctx.ellipse(0, -66, 12, 4, 0, 0, TAU); ctx.lineWidth = 1.5; ctx.strokeStyle = '#a0642e'; ctx.stroke();
  // leaf sprout
  ctx.beginPath(); ctx.moveTo(0, -72); ctx.quadraticCurveTo(10, -90, 20, -80); ctx.quadraticCurveTo(10, -72, 0, -72); fs(ctx, '#6bcb77');
  eyes(ctx, 0, -40, 8, 5.5, 0); smile(ctx, 0, -26, 6, 4);
  ctx.restore();
};
/* flying obstacle: anchor = centre */
SP.bee = function (ctx, x, y, t) {
  ctx.save(); ctx.translate(x, y + Math.sin(t * 6) * 2);
  const fl = Math.sin(t * 40) * 0.35;
  ctx.save(); ctx.globalAlpha = 0.85;
  ctx.save(); ctx.rotate(-0.5 + fl); ell(ctx, -6, -20, 9, 14, 'rgba(235,245,255,.9)'); ctx.restore();
  ctx.save(); ctx.rotate(0.5 - fl); ell(ctx, 8, -20, 9, 14, 'rgba(235,245,255,.9)'); ctx.restore();
  ctx.restore();
  ell(ctx, 0, 0, 27, 17, '#ffd23f');
  ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, 27, 17, 0, 0, TAU); ctx.clip();
  ctx.fillStyle = OUT; ctx.fillRect(-6, -20, 7, 40); ctx.fillRect(8, -20, 7, 40); ctx.restore();
  ctx.beginPath(); ctx.ellipse(0, 0, 27, 17, 0, 0, TAU); ctx.lineWidth = LW; ctx.strokeStyle = OUT; ctx.stroke();
  eyes(ctx, -15, -3, 0.01, 5.5, -0.5); smile(ctx, -17, 6, 4, 3);
  ctx.restore();
};
SP.drawJumpObstacle = function (ctx, kind, x, y, t) {
  if (kind === 'bush') SP.bush(ctx, x, y, t);
  else if (kind === 'rock') SP.rockFriend(ctx, x, y, t);
  else if (kind === 'stump') SP.stump(ctx, x, y, t);
  else SP.bee(ctx, x, y, t);
};

/* ============ STAR BLASTER ============ */
SP.WEAPON_COLORS = { normal: '#9ad4ff', rapid: '#ff9f45', spread: '#6bcb77', big: '#d68bff', laser: '#22e0e0', homing: '#ff6fae', fire: '#ff6a2a' };
/* ship: anchor = centre. weapon: normal | rapid | spread */
SP.ship = function (ctx, x, y, weapon, t, s) {
  s = s || {};
  ctx.save(); ctx.translate(x, y); ctx.scale(s.sx || 1, s.sy || 1);
  const col = { normal: ['#ffffff', '#8fc7ff'], rapid: ['#ffd9a8', '#ff8a3d'], spread: ['#c8f5cf', '#4fc46d'], laser: ['#d8ffff', '#22c6c6'] }[weapon] || ['#fff', '#8fc7ff'];
  const fl = 9 + Math.sin(t * 22) * 3 + (weapon === 'rapid' ? 6 : 0);
  // flame
  ctx.beginPath(); ctx.moveTo(-8, 18); ctx.quadraticCurveTo(0, 18 + fl * 2, 8, 18); ctx.fillStyle = '#ffb347'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(-4, 18); ctx.quadraticCurveTo(0, 18 + fl * 1.2, 4, 18); ctx.fillStyle = '#fff3b0'; ctx.fill();
  // wings
  const wing = weapon === 'spread' ? 30 : 24;
  [-1, 1].forEach(function (d) {
    ctx.beginPath(); ctx.moveTo(d * 10, 0); ctx.quadraticCurveTo(d * (wing + 4), 4, d * wing, 22); ctx.lineTo(d * 9, 16); ctx.closePath(); fs(ctx, col[1]);
  });
  if (weapon === 'rapid') [-1, 1].forEach(function (d) { rr(ctx, d * 21 - 5, 2, 10, 24, 5); fs(ctx, '#ff6b2c'); });
  if (weapon === 'laser') { rr(ctx, -4, -42, 8, 26, 4); fs(ctx, '#22c6c6'); circ(ctx, 0, -44, 4, '#e8ffff'); }
  if (weapon === 'spread') [-1, 0, 1].forEach(function (d) { rr(ctx, d * 17 - 4, -22 + Math.abs(d) * 10, 8, 14, 3); fs(ctx, '#2f9e55'); });
  // body
  ctx.beginPath(); ctx.moveTo(0, -30); ctx.quadraticCurveTo(16, -10, 13, 20); ctx.lineTo(-13, 20); ctx.quadraticCurveTo(-16, -10, 0, -30); ctx.closePath();
  fs(ctx, puff(ctx, 0, -6, 24, col[0], col[1]));
  // window w/ friendly face
  circ(ctx, 0, -6, 9, '#bfe9ff'); eyes(ctx, 0, -7, 3.6, 2.6, 0); smile(ctx, 0, -2, 2.6, 2);
  shine(ctx, -5, -18, 3, 6, -0.3);
  ctx.restore();
};
/* falling things. anchor = centre. r = visual radius. */
SP.rockBig = function (ctx, x, y, r, t, damaged) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 1.2) * 0.08);
  ctx.beginPath();
  for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, rad = r * (0.88 + 0.12 * Math.sin(i * 2.3)); ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); }
  ctx.closePath(); fs(ctx, puff(ctx, 0, 0, r, '#d3b4a0', '#8a6a7e'));
  circ(ctx, -r * 0.45, r * 0.35, r * 0.17, '#a08090'); circ(ctx, r * 0.5, r * 0.4, r * 0.12, '#a08090');
  shine(ctx, -r * 0.35, -r * 0.5, r * 0.25, r * 0.12);
  eyes(ctx, 0, -r * 0.1, r * 0.3, r * 0.2, 0, false); smile(ctx, 0, r * 0.3, r * 0.22, r * 0.18);
  if (damaged) { ctx.beginPath(); ctx.moveTo(r * 0.1, -r * 0.8); ctx.lineTo(-r * 0.05, -r * 0.45); ctx.lineTo(r * 0.12, -r * 0.3); ctx.lineWidth = 2.5; ctx.strokeStyle = OUT; ctx.stroke(); }
  ctx.restore();
};
SP.comet = function (ctx, x, y, r, t) {
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.moveTo(-r * 0.7, -r * 0.4); ctx.lineTo(0, -r * 3.2 + Math.sin(t * 20) * 3); ctx.lineTo(r * 0.7, -r * 0.4); ctx.closePath(); ctx.fillStyle = 'rgba(255,170,90,.55)'; ctx.fill();
  circ(ctx, 0, 0, r, puff(ctx, 0, 0, r, '#ffe08a', '#ff8a3d'));
  eyes(ctx, 0, 1, r * 0.38, r * 0.27, 0, false); smile(ctx, 0, r * 0.45, r * 0.25, r * 0.2);
  ctx.restore();
};
SP.jelly = function (ctx, x, y, r, t) {
  ctx.save(); ctx.translate(x, y);
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath(); ctx.moveTo(i * r * 0.36, r * 0.4);
    ctx.quadraticCurveTo(i * r * 0.36 + Math.sin(t * 5 + i) * 6, r * 1.1, i * r * 0.36 + Math.sin(t * 5 + i + 1) * 5, r * 1.5);
    ctx.lineWidth = 5; ctx.strokeStyle = OUT; ctx.stroke(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#66e0d0'; ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(-r, r * 0.45); ctx.bezierCurveTo(-r, -r * 1.25, r, -r * 1.25, r, r * 0.45); ctx.closePath(); fs(ctx, puff(ctx, 0, -r * 0.2, r, '#b6fff0', '#2fbfb0'));
  shine(ctx, -r * 0.4, -r * 0.55, r * 0.25, r * 0.12);
  eyes(ctx, 0, -r * 0.1, r * 0.38, r * 0.24, Math.sin(t * 3)); smile(ctx, 0, r * 0.2, r * 0.22, r * 0.16);
  ctx.restore();
};
/* weapon capsule (friendly glowing pickup). kind: rapid | spread | big | laser | homing | fire */
SP.capsule = function (ctx, x, y, kind, t) {
  const col = SP.WEAPON_COLORS[kind] || '#fff', pulse = 1 + Math.sin(t * 3) * 0.12;
  ctx.save(); ctx.translate(x, y);
  const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 36 * pulse); g.addColorStop(0, col + 'cc'); g.addColorStop(1, col + '00');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 36 * pulse, 0, TAU); ctx.fill();
  rr(ctx, -21, -14, 42, 28, 14); fs(ctx, puff(ctx, 0, 0, 22, '#ffffff', col));
  ctx.fillStyle = OUT; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  if (kind === 'rapid') { for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 7 - 3, -5); ctx.lineTo(i * 7 + 3, 0); ctx.lineTo(i * 7 - 3, 5); ctx.stroke(); } }
  else if (kind === 'spread') { for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(0, 5); ctx.lineTo(i * 9, -5); ctx.stroke(); } }
  else if (kind === 'laser') { ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(11, 0); ctx.lineWidth = 4; ctx.stroke(); ctx.beginPath(); ctx.arc(11, 0, 3, 0, TAU); ctx.fill(); }
  else if (kind === 'homing') { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 4 : 9; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); }
  else if (kind === 'fire') { ctx.beginPath(); ctx.moveTo(0, -9); ctx.quadraticCurveTo(9, 0, 0, 8); ctx.quadraticCurveTo(-9, 0, 0, -9); ctx.fill(); }
  else { ctx.beginPath(); ctx.arc(0, 0, 6, 0, TAU); ctx.fill(); }
  shine(ctx, -9, -8, 5, 2.5, 0);
  ctx.restore();
};
/* a shot / bullet. ang in radians (0 = right). kind: normal|rapid|spread|big|laser|homing|fire */
SP.bullet = function (ctx, x, y, kind, ang, t) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang || 0);
  if (kind === 'big') {
    const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 24); g.addColorStop(0, 'rgba(214,139,255,.9)'); g.addColorStop(1, 'rgba(214,139,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 24, 0, TAU); ctx.fill();
    circ(ctx, 0, 0, 13, puff(ctx, 0, 0, 13, '#ffffff', '#c06bff'));
  } else if (kind === 'rapid') {
    ell(ctx, 0, 0, 12, 4.5, '#ffb066');
    ctx.fillStyle = 'rgba(255,200,120,.4)'; ctx.beginPath(); ctx.ellipse(-12, 0, 10, 2.5, 0, 0, TAU); ctx.fill();
  } else if (kind === 'spread') {
    ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(0, 6); ctx.lineTo(-8, 0); ctx.lineTo(0, -6); ctx.closePath(); fs(ctx, '#8ff0a4');
  } else if (kind === 'laser') {
    const g = ctx.createLinearGradient(-40, 0, 40, 0); g.addColorStop(0, 'rgba(34,224,224,0)'); g.addColorStop(1, 'rgba(34,224,224,.9)');
    ctx.fillStyle = g; ctx.fillRect(-40, -6, 80, 12); rr(ctx, -20, -3, 52, 6, 3); ctx.fillStyle = '#e8ffff'; ctx.fill();
  } else if (kind === 'homing') {
    ctx.rotate((t || 0) * 6); ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 5 : 11; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); fs(ctx, '#ff8fc0');
  } else if (kind === 'fire') {
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 16); g.addColorStop(0, 'rgba(255,230,120,.95)'); g.addColorStop(1, 'rgba(255,100,40,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 16, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(10, 0); ctx.quadraticCurveTo(0, -9, -10, 0); ctx.quadraticCurveTo(0, 9, 10, 0); fs(ctx, '#ff8a3a');
  } else {
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 14); g.addColorStop(0, 'rgba(255,245,170,.8)'); g.addColorStop(1, 'rgba(255,245,170,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU); ctx.fill();
    circ(ctx, 0, 0, 6.5, puff(ctx, 0, 0, 7, '#ffffff', '#ffe06a'));
  }
  ctx.restore();
};

/* ============ COMMANDO RUN ============ */
/* ---- soldier costumes: one per stage scenery (index = scenery number) ---- */
const COSTUMES = [
  { helm: ['#8aa04a', '#566a2a'], vest: ['#9ab454', '#5a7030'], vest2: '#4a5a28', pants: '#6a7a3a', scarf: '#ff4d5a', acc: 'none' },        // forest
  { helm: ['#5ac8e8', '#2a8aa8'], vest: ['#6ad0f0', '#2a8aa8'], vest2: '#1f6a88', pants: '#2a7a98', scarf: '#ffd23f', acc: 'mask' },        // ocean
  { helm: ['#e8c07a', '#b8863a'], vest: ['#e8c88a', '#b08a4a'], vest2: '#8a6a30', pants: '#b89a5a', scarf: '#f0e0b0', acc: 'shades' },      // desert
  { helm: ['#e8f4ff', '#9cc4e0'], vest: ['#7ab0e8', '#3a70b8'], vest2: '#2a5a98', pants: '#3a5a88', scarf: '#ffffff', acc: 'parka' },       // snow
  { helm: ['#5a4a4a', '#2a2020'], vest: ['#6a5252', '#3a2a2a'], vest2: '#2a1a1a', pants: '#3a2a2a', scarf: '#ff7a2a', acc: 'heat' },        // volcano
  { helm: ['#3f8a3a', '#1f5a22'], vest: ['#5aa04a', '#2f6a2a'], vest2: '#245a24', pants: '#3a6a2a', scarf: '#ffd23f', acc: 'leaf' },        // jungle
  { helm: ['#8a6ad0', '#4a3a90'], vest: ['#7a6ac0', '#3a2a80'], vest2: '#2a1a60', pants: '#3a2a70', scarf: '#8affea', acc: 'lamp' },        // cave
  { helm: ['#5a6078', '#2a2f48'], vest: ['#6a7088', '#2f3450'], vest2: '#1a1f38', pants: '#2a2f48', scarf: '#4af0ff', acc: 'visor' },       // city
  { helm: ['#c8e0ff', '#7aa0d8'], vest: ['#e8f0ff', '#9ab0d8'], vest2: '#6a80b0', pants: '#7a90c0', scarf: '#ffffff', acc: 'aviator' },     // sky
  { helm: ['#f4f4ff', '#b8bcd8'], vest: ['#f0f0ff', '#a8acc8'], vest2: '#7a7ea0', pants: '#c8cce8', scarf: '#ff6b86', acc: 'bubble' },      // space
  { helm: ['#6a7a3a', '#3a4a1a'], vest: ['#7a8a4a', '#4a5a2a'], vest2: '#3a4a1a', pants: '#4a5a2a', scarf: '#c8e070', acc: 'mud' },         // swamp
  { helm: ['#c8a870', '#8a6a30'], vest: ['#b89860', '#7a5a2a'], vest2: '#5a3a1a', pants: '#7a5a2a', scarf: '#e8d8b0', acc: 'explorer' },    // ruins
  { helm: ['#ffd23f', '#d8a800'], vest: ['#ff9a3a', '#d86a1a'], vest2: '#a84a0a', pants: '#4a4f66', scarf: '#c8ccd8', acc: 'hardhat' },     // factory
  { helm: ['#bfe0ff', '#6aa8e8'], vest: ['#a8d0ff', '#5a90d8'], vest2: '#3a70b8', pants: '#4a70a8', scarf: '#ffffff', acc: 'parka' },       // ice castle
  { helm: ['#3a2a50', '#1a1030'], vest: ['#5a4a78', '#2a1a48'], vest2: '#1a1030', pants: '#2a1a48', scarf: '#ff9ad0', acc: 'cape' }         // castle
];
/* the soldier's rifle, drawn along +x from the hand. Every weapon has its own big, detailed shape. t = time (for flickers) */
function gun(ctx, weapon, t) {
  const T = t || 0;
  if (weapon === 'rapid') {                                   // twin-barrel gatling with ammo belt
    rr(ctx, -16, -5, 18, 11, 3); fs(ctx, '#7a5230');
    rr(ctx, 0, -8, 28, 15, 3); fs(ctx, '#e8761a'); rr(ctx, 4, -11, 14, 4, 2); fs(ctx, '#ffb066');
    rr(ctx, 28, -9, 30, 6, 2); fs(ctx, '#ffb066'); rr(ctx, 28, 2, 30, 6, 2); fs(ctx, '#ffb066'); rr(ctx, 54, -11, 6, 10, 2); fs(ctx, '#ffd0a0'); rr(ctx, 54, 1, 6, 10, 2); fs(ctx, '#ffd0a0');
    circ(ctx, 14, 15, 11, '#ff9f45'); ctx.strokeStyle = OUT; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(14, 15); ctx.lineTo(14 + Math.cos(i * 1.57 + T * 8) * 9, 15 + Math.sin(i * 1.57 + T * 8) * 9); ctx.stroke(); }
    for (let i = 0; i < 3; i++) rr(ctx, 6 + i * 4, 4 + i * 2, 6, 4, 1), fs(ctx, '#ffd23f');
  } else if (weapon === 'spread') {                           // three-barrel scatter gun
    rr(ctx, -16, -5, 18, 11, 3); fs(ctx, '#7a5230');
    rr(ctx, 0, -8, 26, 15, 3); fs(ctx, '#2f9e55'); rr(ctx, 4, -11, 14, 4, 2); fs(ctx, '#a8f5b8'); rr(ctx, 6, 5, 8, 12, 3); fs(ctx, '#1f6a3a');
    rr(ctx, 24, -10, 8, 20, 3); fs(ctx, '#1f6a3a');
    [-1, 0, 1].forEach(function (d) { ctx.save(); ctx.translate(32, 0); ctx.rotate(d * 0.34); rr(ctx, 0, -3.5, 26, 7, 3); fs(ctx, '#a8f5b8'); circ(ctx, 27, 0, 4, '#e8ffe8'); ctx.restore(); });
  } else if (weapon === 'big') {                              // heavy energy cannon
    rr(ctx, -14, -6, 16, 12, 3); fs(ctx, '#5a2a90');
    rr(ctx, 0, -10, 32, 20, 6); fs(ctx, '#b36bff'); circ(ctx, 12, 14, 9, '#7a3ad0');
    rr(ctx, 30, -12, 32, 24, 8); fs(ctx, '#8a4ad0');
    [36, 44, 52].forEach(function (x, i) { ctx.beginPath(); ctx.moveTo(x, -12); ctx.lineTo(x, 12); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(227,188,255,' + (0.7 + 0.3 * Math.sin(T * 8 + i)) + ')'; ctx.stroke(); });
    rr(ctx, 60, -15, 9, 30, 4); fs(ctx, '#e3bcff');
  } else if (weapon === 'laser') {                            // sleek laser rifle
    rr(ctx, -14, -4, 16, 10, 4); fs(ctx, '#0f6a6a');
    rr(ctx, 0, -7, 32, 14, 6); fs(ctx, '#22c6c6'); rr(ctx, 6, -10, 18, 4, 2); fs(ctx, '#9affff');
    ctx.strokeStyle = 'rgba(5,70,70,.7)'; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(8 + i * 5, 2); ctx.lineTo(8 + i * 5, 6); ctx.stroke(); }
    rr(ctx, 32, -4, 34, 8, 4); fs(ctx, '#0f8a8a');
    [38, 46, 54].forEach(function (x, i) { ctx.beginPath(); ctx.arc(x, 0, 6, 0, TAU); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(154,255,255,' + (0.6 + 0.4 * Math.sin(T * 10 + i)) + ')'; ctx.stroke(); });
    circ(ctx, 68, 0, 6, '#e8ffff'); circ(ctx, 68, 0, 3, '#22e0e0'); rr(ctx, 6, 5, 7, 11, 3); fs(ctx, '#0f6a6a');
  } else if (weapon === 'homing') {                           // rocket launcher with a pink missile
    rr(ctx, -12, -8, 14, 16, 4); fs(ctx, '#c8326a');
    rr(ctx, 0, -12, 46, 24, 10); fs(ctx, '#ff6fae'); rr(ctx, 12, -12, 8, 24, 2); fs(ctx, '#c8326a'); rr(ctx, 30, -12, 8, 24, 2); fs(ctx, '#c8326a');
    ctx.beginPath(); ctx.moveTo(46, -7); ctx.lineTo(62, 0); ctx.lineTo(46, 7); ctx.closePath(); fs(ctx, '#fff3b0'); circ(ctx, 61, 0, 3, '#ff3a5a');
    circ(ctx, 22, -17, 6, 'rgba(255,255,255,.9)'); ctx.beginPath(); ctx.moveTo(22, -24); ctx.lineTo(22, -10); ctx.moveTo(15, -17); ctx.lineTo(29, -17); ctx.lineWidth = 2; ctx.strokeStyle = '#c8326a'; ctx.stroke();
    rr(ctx, 8, 10, 8, 12, 3); fs(ctx, '#3a3f52');
  } else if (weapon === 'fire') {                             // flamethrower with fuel tank
    rr(ctx, -16, -20, 24, 15, 7); fs(ctx, '#ff6a2a'); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-12, -18, 16, 3);
    ctx.beginPath(); ctx.moveTo(-4, -5); ctx.quadraticCurveTo(0, 8, 14, 4); ctx.lineWidth = 6; ctx.strokeStyle = OUT; ctx.stroke(); ctx.lineWidth = 3; ctx.strokeStyle = '#8a1a1a'; ctx.stroke();
    rr(ctx, 0, -7, 28, 14, 4); fs(ctx, '#8a2a1a'); rr(ctx, 6, 5, 7, 11, 3); fs(ctx, '#3a3f52');
    rr(ctx, 26, -6, 24, 12, 4); fs(ctx, '#c8321a'); rr(ctx, 48, -9, 7, 18, 3); fs(ctx, '#5a1a1a');
    const fl = 7 + Math.sin(T * 24) * 2.5; ctx.beginPath(); ctx.moveTo(55, 0); ctx.quadraticCurveTo(62, -fl, 70 + fl, 0); ctx.quadraticCurveTo(62, fl, 55, 0); ctx.fillStyle = '#ffb347'; ctx.fill(); ctx.beginPath(); ctx.moveTo(55, 0); ctx.quadraticCurveTo(60, -fl * 0.5, 64, 0); ctx.quadraticCurveTo(60, fl * 0.5, 55, 0); ctx.fillStyle = '#ffe066'; ctx.fill();
  } else {                                                    // standard assault rifle
    rr(ctx, -16, -5, 18, 11, 3); fs(ctx, '#7a5230');
    rr(ctx, 4, 4, 8, 13, 3); fs(ctx, '#3a3f52'); rr(ctx, 15, 5, 9, 15, 2); fs(ctx, '#2c2f3e');
    rr(ctx, 0, -7, 28, 13, 3); fs(ctx, '#5a6078'); rr(ctx, 2, -10, 22, 3, 1); fs(ctx, '#9aa5d8');
    rr(ctx, 8, -17, 15, 7, 3); fs(ctx, '#2c2f3e'); circ(ctx, 22, -13, 3, '#8fd0ff');
    rr(ctx, 26, -6, 14, 11, 2); fs(ctx, '#4a4f66'); rr(ctx, 38, -3.5, 20, 7, 2); fs(ctx, '#2c2f3e'); rr(ctx, 56, -6, 7, 12, 2); fs(ctx, '#9aa5d8');
  }
}
/* soldier hero (cartoon, friendly). anchor = bottom centre.
   s = {t, facing, aimUp, duck, weapon, moving, air, hurt, costume (scenery number), rank 0-3, recoil 0..1, glow 0..1 (just picked up a weapon), win} */
SP.hero = function (ctx, x, y, s) {
  const c = COSTUMES[(s.costume || 0) % COSTUMES.length], rank = s.rank || 0, rc = s.recoil || 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(s.facing || 1, 1);
  const run = s.moving && !s.air ? Math.sin(s.t * 16) : 0, k = s.duck ? 0.64 : 1;
  const bob = s.moving && !s.air ? -Math.abs(run) * 2.5 : 0, lean = s.hurt ? -0.2 : (s.moving && !s.air ? 0.05 : 0);
  if (s.win) ctx.translate(0, -Math.abs(Math.sin(s.t * 7)) * 9);
  [-1, 1].forEach(function (d) {                              // boots + legs (legs bend when crouching)
    const lift = s.air ? (d < 0 ? 9 : 4) : Math.max(0, -d * run) * 5, ox = s.air ? d * 5 : d * run * 7;
    rr(ctx, d * 8 - 7 + ox, -22 * k - 2 + bob, 14, 18 * k + 2, 5); fs(ctx, c.pants);
    rr(ctx, d * 8 - 9 + ox, -9 - lift, 20, 9, 4); fs(ctx, '#4a3420');
  });
  ctx.save(); ctx.translate(-rc * 3, -12 + bob); ctx.rotate(lean); ctx.scale(1, k);
  if (c.acc === 'cape') { ctx.beginPath(); ctx.moveTo(-8, -40); ctx.quadraticCurveTo(-36 - Math.abs(run) * 6, -22 + Math.sin(s.t * 9) * 5, -40 + Math.sin(s.t * 7) * 4, 8); ctx.lineTo(-10, -2); ctx.closePath(); fs(ctx, '#c8326a'); }
  const sl = c.acc === 'aviator' ? 20 : 0;                    // scarf tail (flutters)
  ctx.beginPath(); ctx.moveTo(-10, -50); ctx.quadraticCurveTo(-26 - sl - Math.abs(run) * 4, -50 + Math.sin(s.t * 12) * 5, -34 - sl, -44 + Math.sin(s.t * 12 + 1) * 6); ctx.lineTo(-24 - sl * 0.6, -42); ctx.closePath(); fs(ctx, c.scarf);
  // back arm swings as he runs
  const sw = s.moving && !s.air ? run * 7 : 0; ctx.beginPath(); ctx.moveTo(-8, -32); ctx.quadraticCurveTo(-16, -20, -10 + sw, -10); ctx.lineWidth = 10; ctx.strokeStyle = OUT; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineWidth = 6; ctx.strokeStyle = c.vest[0]; ctx.stroke(); circ(ctx, -10 + sw, -9, 4.5, '#fff0d0');
  rr(ctx, -15, -38, 30, 36, 11); fs(ctx, puff(ctx, 0, -20, 22, c.vest[0], c.vest[1]));
  rr(ctx, -11, -34, 22, 22, 7); fs(ctx, c.vest2); rr(ctx, -8, -20, 7, 8, 2); fs(ctx, 'rgba(0,0,0,.28)'); rr(ctx, 2, -20, 7, 8, 2); fs(ctx, 'rgba(0,0,0,.28)');
  circ(ctx, -4, -30, 3, 'rgba(0,0,0,.2)'); circ(ctx, 6, -27, 3, 'rgba(0,0,0,.2)');
  rr(ctx, -15, -10, 30, 7, 2); fs(ctx, '#a07a3a'); rr(ctx, -3, -10, 7, 7, 2); fs(ctx, '#ffd23f');
  if (c.acc === 'heat') { [-1, 1].forEach(function (d) { rr(ctx, d * 14 - 6, -42, 12, 12, 4); fs(ctx, '#ff7a2a'); circ(ctx, d * 14, -36, 3, '#ffe066'); }); }
  if (c.acc === 'bubble') { circ(ctx, 0, -22, 5, 'rgba(120,200,255,.8)'); }
  if (c.acc === 'mud') { circ(ctx, -6, -18, 3.5, '#5a3a1a'); circ(ctx, 8, -30, 3, '#5a3a1a'); }
  for (let i = 0; i < rank; i++) { ctx.beginPath(); ctx.moveTo(-12, -33 + i * 5); ctx.lineTo(-8, -37 + i * 5); ctx.lineTo(-4, -33 + i * 5); ctx.lineWidth = 2.2; ctx.strokeStyle = '#ffd23f'; ctx.stroke(); }   // rank stripes
  if (rank >= 2) { circ(ctx, 8, -24, 3.6, '#ffd23f'); ctx.beginPath(); ctx.moveTo(6, -28); ctx.lineTo(8, -26); ctx.lineTo(10, -28); ctx.lineWidth = 2; ctx.strokeStyle = '#ff4d5a'; ctx.stroke(); }  // medal
  // head
  circ(ctx, 2, -50, 15, puff(ctx, 2, -50, 15, '#fff0d0', '#f2c28a')); circ(ctx, -12, -48, 5, '#f2c28a');
  if (c.acc === 'parka') { for (let i = 0; i < 9; i++) { const a = 0.3 + i * 0.7; circ(ctx, 2 + Math.cos(a) * 17, -50 + Math.sin(a) * 17, 5.5, '#ffffff'); } }
  eyes(ctx, 7, -49, 5, 4.2, 0.7, s.hurt); s.win ? smile(ctx, 8, -43, 5, 5) : smile(ctx, 8, -42, 3.5, 3);
  ctx.beginPath(); ctx.arc(2, -54, 19, Math.PI * 1.02, Math.PI * 1.98); ctx.closePath(); fs(ctx, puff(ctx, 2, -64, 19, c.helm[0], c.helm[1]));
  rr(ctx, -18, -56, 42, 7, 3); fs(ctx, c.helm[1]);
  ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 2.2 : 5; ctx.lineTo(4 + Math.cos(a) * r, -63 + Math.sin(a) * r); } ctx.closePath(); ctx.fillStyle = '#ffd23f'; ctx.fill();
  if (c.acc === 'mask') { circ(ctx, 7, -48, 8.5, 'rgba(150,230,255,.55)'); ctx.beginPath(); ctx.arc(7, -48, 8.5, 0, TAU); ctx.lineWidth = 3; ctx.strokeStyle = '#1f6a88'; ctx.stroke(); ctx.beginPath(); ctx.moveTo(-1, -50); ctx.lineTo(-14, -50); ctx.moveTo(-8, -58); ctx.lineTo(-14, -78); ctx.lineTo(-8, -80); ctx.lineWidth = 3; ctx.strokeStyle = '#1f6a88'; ctx.stroke(); }
  if (c.acc === 'shades') { rr(ctx, 0, -54, 18, 8, 3); fs(ctx, '#1a1a2a'); ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(3, -52, 5, 2); }
  if (c.acc === 'parka') { circ(ctx, 0, -62, 5, '#ffb347'); circ(ctx, 10, -62, 5, '#ffb347'); ctx.beginPath(); ctx.moveTo(-6, -62); ctx.lineTo(16, -62); ctx.lineWidth = 2.5; ctx.strokeStyle = OUT; ctx.stroke(); }
  if (c.acc === 'heat') { rr(ctx, 0, -53, 18, 6, 3); fs(ctx, '#ff4a2a'); }
  if (c.acc === 'leaf') { [[-8, -70], [2, -74], [12, -69]].forEach(function (p, i) { ctx.beginPath(); ctx.ellipse(p[0], p[1], 7, 3.5, -0.6 + i * 0.6, 0, TAU); fs(ctx, '#6bd68a'); }); }
  if (c.acc === 'lamp') { circ(ctx, 14, -62, 5, '#fff6a0'); ctx.fillStyle = 'rgba(255,246,160,.25)'; ctx.beginPath(); ctx.moveTo(18, -62); ctx.lineTo(70, -84); ctx.lineTo(70, -40); ctx.closePath(); ctx.fill(); }
  if (c.acc === 'visor') { rr(ctx, 0, -54, 20, 7, 3); fs(ctx, '#4af0ff'); }
  if (c.acc === 'aviator') { circ(ctx, 3, -48, 6, 'rgba(255,210,63,.7)'); circ(ctx, 13, -48, 6, 'rgba(255,210,63,.7)'); ctx.beginPath(); ctx.arc(3, -48, 6, 0, TAU); ctx.arc(13, -48, 6, 0, TAU); ctx.lineWidth = 2.5; ctx.strokeStyle = OUT; ctx.stroke(); }
  if (c.acc === 'bubble') { circ(ctx, 2, -52, 23, 'rgba(200,240,255,.25)'); ctx.beginPath(); ctx.arc(2, -52, 23, 0, TAU); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.stroke(); shine(ctx, -8, -64, 6, 3); }
  if (c.acc === 'mud') { circ(ctx, 11, -43, 3, '#5a3a1a'); circ(ctx, -3, -60, 3.5, '#5a3a1a'); }
  if (c.acc === 'explorer') { rr(ctx, -24, -57, 54, 7, 3); fs(ctx, '#8a6a30'); rr(ctx, -6, -62, 18, 4, 2); fs(ctx, '#5a3a1a'); }
  if (c.acc === 'hardhat') { rr(ctx, -4, -74, 12, 7, 3); fs(ctx, '#ffe066'); circ(ctx, 14, -62, 4, '#fff6a0'); }
  ctx.restore();
  // rifle arm (rotates to aim; kicks back when firing; glows when a new weapon is picked up)
  const gl = s.glow || 0;
  ctx.save(); ctx.translate(9 + (s.hurt ? -3 : 0), -(s.duck ? 24 : 36) + bob); ctx.rotate((s.aimUp || s.win ? -Math.PI / 2 : 0) - rc * 0.13);
  ctx.save(); ctx.translate(4 - rc * 8, 0); const gs = 0.95 * (1 + 0.28 * gl); ctx.scale(gs, gs); gun(ctx, s.weapon, s.t);
  if (gl > 0) { const gg = ctx.createRadialGradient(30, 0, 4, 30, 0, 70); gg.addColorStop(0, 'rgba(255,255,255,' + 0.8 * gl + ')'); gg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(30, 0, 70, 0, TAU); ctx.fill(); }
  ctx.restore();
  ell(ctx, 0, 0, 7, 6, c.vest[0]); ell(ctx, 18, 2, 5, 5, '#fff0d0');
  ctx.restore();
  ctx.restore();
};
/* where the muzzle is relative to the hero's anchor (used to spawn bullets) */
SP.heroMuzzle = function (s) {
  const ay = s.duck ? -24 : -36, f = s.facing || 1;
  if (s.aimUp) return { x: 9 * f, y: ay - 70 };
  return { x: f * 74, y: ay };
};
/* muzzle flash, different for every weapon. ang = firing direction, k = 1..0 (fades out) */
SP.muzzleFlash = function (ctx, x, y, kind, ang, k) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.globalAlpha = Math.max(0, Math.min(1, k));
  const g = function (r, c0, c1) { const gr = ctx.createRadialGradient(0, 0, 1, 0, 0, r); gr.addColorStop(0, c0); gr.addColorStop(1, c1); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); };
  if (kind === 'big') { g(30 * k + 8, 'rgba(255,255,255,.95)', 'rgba(192,107,255,0)'); ctx.beginPath(); ctx.arc(8, 0, 18 * (1.4 - k * 0.4), 0, TAU); ctx.lineWidth = 4; ctx.strokeStyle = '#e3bcff'; ctx.stroke(); }
  else if (kind === 'laser') { g(18, 'rgba(232,255,255,.95)', 'rgba(34,224,224,0)'); ctx.fillStyle = 'rgba(154,255,255,.8)'; ctx.fillRect(0, -3, 46 * k + 10, 6); }
  else if (kind === 'fire') { ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(26, -16, 54, -2); ctx.quadraticCurveTo(26, 14, 0, 0); ctx.fillStyle = 'rgba(255,150,40,.9)'; ctx.fill(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(16, -7, 32, 0); ctx.quadraticCurveTo(16, 7, 0, 0); ctx.fillStyle = '#ffe066'; ctx.fill(); }
  else if (kind === 'homing') { g(20, 'rgba(255,255,255,.9)', 'rgba(255,143,192,0)'); ctx.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-6 - i * 8, (i - 1) * 6, 6 - i, 0, TAU); ctx.fill(); } }
  else if (kind === 'spread') { [-0.34, 0, 0.34].forEach(function (a) { ctx.save(); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(30, 0); ctx.lineTo(0, 4); ctx.closePath(); ctx.fillStyle = '#a8f5b8'; ctx.fill(); ctx.restore(); }); g(10, '#fff', 'rgba(143,240,164,0)'); }
  else if (kind === 'rapid') { g(13, '#fff', 'rgba(255,176,102,0)'); ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(24, 0); ctx.lineTo(0, 2); ctx.fillStyle = '#ffb066'; ctx.fill(); }
  else { for (let i = 0; i < 6; i++) { ctx.save(); ctx.rotate(-0.9 + i * 0.36); ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(18 + (i % 2) * 8, 0); ctx.lineTo(0, 2); ctx.closePath(); ctx.fillStyle = i % 2 ? '#fff6c8' : '#ffd23f'; ctx.fill(); ctx.restore(); } g(11, '#fff', 'rgba(255,224,106,0)'); }
  ctx.restore();
};

SP.walker = function (ctx, x, y, t, pal) {
  pal = pal || ['#b5f59a', '#4fb85f']; // anchor bottom centre, ~46x46
  ctx.save(); ctx.translate(x, y);
  const w = Math.sin(t * 6);
  ell(ctx, -10 + w * 4, -4, 9, 6, '#2f9e55'); ell(ctx, 10 - w * 4, -4, 9, 6, '#2f9e55');
  ctx.beginPath(); ctx.ellipse(0, -24, 23, 22, 0, 0, TAU); fs(ctx, puff(ctx, 0, -24, 24, pal[0], pal[1]));
  shine(ctx, -9, -34, 6, 3);
  tri2(ctx, -15, -42, -22, -60, -6, -44, '#fffbea'); tri2(ctx, 4, -45, 12, -62, 16, -41, '#fffbea');   // horns
  for (let i = 0; i < 3; i++) tri2(ctx, 16 + i * 2, -40 + i * 10, 34 + i * 2, -36 + i * 10, 18 + i * 2, -28 + i * 10, '#2f8f45');   // back spikes
  eyes(ctx, -3, -26, 7, 6, -0.7); brows(ctx, -3, -26, 7, 6); grr(ctx, -6, -13, 7);
  ctx.beginPath(); ctx.moveTo(2, -45); ctx.lineTo(4, -54); ctx.lineWidth = 3; ctx.strokeStyle = OUT; ctx.stroke(); circ(ctx, 4, -56, 4, '#ff9f45');
  ctx.restore();
};
SP.flyer = function (ctx, x, y, t) { // anchor centre, ~34 wide
  ctx.save(); ctx.translate(x, y);
  const p = Math.sin(t * 30) * 14;
  ctx.beginPath(); ctx.moveTo(-p, -19); ctx.lineTo(p, -19); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, -19); ctx.stroke();
  [-1, 1].forEach(function (d) { const fw = Math.sin(t * 25) * 9; ctx.beginPath(); ctx.moveTo(d * 8, -4); ctx.lineTo(d * 30, -20 + fw); ctx.lineTo(d * 26, -6); ctx.lineTo(d * 44, -8 + fw); ctx.lineTo(d * 30, 6); ctx.lineTo(d * 16, 8); ctx.closePath(); fs(ctx, '#6a2a90'); });   // sharp bat wings
  circ(ctx, 0, 0, 16, puff(ctx, 0, 0, 16, '#f2a6ff', '#a64fd0'));
  circ(ctx, -4, -1, 8, '#fff'); circ(ctx, -6, -1, 3.8, OUT); ctx.beginPath(); ctx.moveTo(-15, -11); ctx.lineTo(2, -5); ctx.lineWidth = 3.5; ctx.strokeStyle = OUT; ctx.lineCap = 'round'; ctx.stroke(); // one angry eye
  ctx.beginPath(); ctx.moveTo(10, 4); ctx.lineTo(24, 0); ctx.lineTo(24, 10); ctx.closePath(); fs(ctx, '#ffd23f');
  ctx.restore();
};
/* turret: anchor bottom centre; ang = aim angle; charge 0..1 telegraph glow */
SP.turret = function (ctx, x, y, ang, charge, t) {
  ctx.save(); ctx.translate(x, y);
  rr(ctx, -24, -16, 48, 16, 6); fs(ctx, '#8c6a4a');
  ctx.save(); ctx.translate(0, -22); ctx.rotate(ang);
  rr(ctx, 0, -6, 28, 12, 5); fs(ctx, '#bfa0ff'); ctx.restore();
  ctx.beginPath(); ctx.arc(0, -16, 20, Math.PI, 0); ctx.closePath(); fs(ctx, puff(ctx, 0, -26, 22, '#ffc989', '#f08a3a'));
  eyes(ctx, 0, -24, 7, 5, Math.cos(ang) * -1); brows(ctx, 0, -24, 7, 5);
  if (charge > 0) {
    ctx.save(); ctx.translate(0, -22); ctx.rotate(ang);
    const r = 5 + charge * 9; const g = ctx.createRadialGradient(34, 0, 1, 34, 0, r + 6); g.addColorStop(0, 'rgba(255,120,180,.95)'); g.addColorStop(1, 'rgba(255,120,180,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(34, 0, r + 6, 0, TAU); ctx.fill(); ctx.restore();
  }
  ctx.restore();
};
/* armoured walker: anchor bottom centre, ~58x66. hpFrac 0..1 */
SP.armoured = function (ctx, x, y, t, hpFrac) {
  ctx.save(); ctx.translate(x, y);
  const w = Math.sin(t * 4);
  ell(ctx, -14 + w * 4, -5, 12, 7, '#707aa8'); ell(ctx, 14 - w * 4, -5, 12, 7, '#707aa8');
  rr(ctx, -28, -52, 56, 48, 16); fs(ctx, puff(ctx, 0, -30, 34, '#d8dcf5', '#7f88b8'));
  ctx.beginPath(); ctx.arc(0, -46, 26, Math.PI, 0); ctx.closePath(); fs(ctx, '#9aa2d0');
  [-16, 0, 16].forEach(function (d) { circ(ctx, d, -50, 2.6, '#e8eaff'); });
  tri2(ctx, -28, -46, -44, -64, -20, -52, '#e8eaff'); tri2(ctx, 28, -46, 44, -64, 20, -52, '#e8eaff');   // shoulder spikes
  rr(ctx, -20, -42, 40, 20, 8); fs(ctx, '#2b2f66');
  eyes(ctx, -2, -32, 8, 5, -0.7, false); brows(ctx, -2, -32, 8, 5);
  if (hpFrac < 0.7) { ctx.beginPath(); ctx.moveTo(-18, -20); ctx.lineTo(-8, -12); ctx.lineTo(-12, -6); ctx.lineWidth = 2.5; ctx.strokeStyle = OUT; ctx.stroke(); }
  if (hpFrac < 0.4) { ctx.beginPath(); ctx.moveTo(14, -26); ctx.lineTo(22, -16); ctx.lineWidth = 2.5; ctx.strokeStyle = OUT; ctx.stroke(); }
  ctx.restore();
};
/* boss: anchor bottom centre, ~120x130 */
/* hopper: bouncy frog-like blob. anchor bottom centre. air = true while jumping (stretches) */
SP.hopper = function (ctx, x, y, t, air) {
  ctx.save(); ctx.translate(x, y); const sy = air ? 1.18 : 0.92 + Math.sin(t * 6) * 0.04; ctx.scale(2 - sy, sy);
  ell(ctx, -12, -4, 10, 6, '#e0881f'); ell(ctx, 12, -4, 10, 6, '#e0881f');
  ctx.beginPath(); ctx.ellipse(0, -22, 22, 20, 0, 0, TAU); fs(ctx, puff(ctx, 0, -22, 22, '#ffe08a', '#f2a62a'));
  shine(ctx, -8, -32, 6, 3); eyes(ctx, -2, -26, 7, 6.5, -0.7); brows(ctx, -2, -26, 7, 6.5); grr(ctx, -5, -13, 7);
  ctx.restore();
};
/* gunner: little robot with an arm cannon. ang = aim angle, charge 0..1 telegraph */
SP.gunner = function (ctx, x, y, t, ang, charge) {
  ctx.save(); ctx.translate(x, y); const w = Math.sin(t * 5);
  ell(ctx, -9 + w * 3, -4, 9, 5, '#6a5ac8'); ell(ctx, 9 - w * 3, -4, 9, 5, '#6a5ac8');
  rr(ctx, -18, -44, 36, 38, 12); fs(ctx, puff(ctx, 0, -26, 24, '#d0c8ff', '#7a68d8'));
  rr(ctx, -14, -40, 28, 17, 7); fs(ctx, '#2b2f66'); eyes(ctx, -2, -32, 6, 4.4, Math.cos(ang) < 0 ? -0.8 : 0.8); brows(ctx, -2, -32, 6, 4.4);
  ctx.beginPath(); ctx.moveTo(0, -44); ctx.lineTo(0, -54); ctx.lineWidth = 3; ctx.strokeStyle = OUT; ctx.stroke(); circ(ctx, 0, -57, 4, charge > 0 ? '#ff6b86' : '#ffd23f');
  ctx.save(); ctx.translate(0, -24); ctx.rotate(ang); rr(ctx, 4, -5, 26, 10, 4); fs(ctx, '#bfa0ff');
  if (charge > 0) { const r = 4 + charge * 8, g = ctx.createRadialGradient(34, 0, 1, 34, 0, r + 6); g.addColorStop(0, 'rgba(255,120,180,.95)'); g.addColorStop(1, 'rgba(255,120,180,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(34, 0, r + 6, 0, TAU); ctx.fill(); }
  ctx.restore(); ctx.restore();
};
/* bomber: flying drone that drops bombs. anchor centre */
SP.bomber = function (ctx, x, y, t, charge) {
  ctx.save(); ctx.translate(x, y); const p = Math.sin(t * 28) * 18;
  ctx.beginPath(); ctx.moveTo(-p, -22); ctx.lineTo(p, -22); ctx.lineWidth = 5; ctx.strokeStyle = OUT; ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(0, -22); ctx.stroke();
  ell(ctx, 0, 0, 26, 17, puff(ctx, 0, 0, 26, '#ffb8d0', '#e0508a')); shine(ctx, -10, -8, 7, 3);
  circ(ctx, -9, -2, 8, '#fff'); circ(ctx, -11, -2, 4, OUT); ctx.beginPath(); ctx.moveTo(-20, -12); ctx.lineTo(-3, -6); ctx.lineWidth = 3.5; ctx.strokeStyle = OUT; ctx.lineCap = 'round'; ctx.stroke(); grr(ctx, 8, 7, 7);
  circ(ctx, 0, 17, 7, charge > 0 ? '#ff6b86' : '#3a3a58');
  ctx.restore();
};
SP.bomb = function (ctx, x, y, t) {
  const g = ctx.createRadialGradient(x, y, 2, x, y, 20); g.addColorStop(0, 'rgba(255,170,90,.6)'); g.addColorStop(1, 'rgba(255,170,90,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 20, 0, TAU); ctx.fill();
  circ(ctx, x, y, 9, puff(ctx, x, y, 9, '#8a8aa8', '#2c2f4e')); ctx.beginPath(); ctx.moveTo(x, y - 9); ctx.lineTo(x + 3, y - 15); ctx.lineWidth = 2.5; ctx.strokeStyle = OUT; ctx.stroke(); circ(ctx, x + 3, y - 16, 3, '#ffd23f');
};
SP.shockwave = function (ctx, x, y, t) {   // low ground wave from a boss stomp (jump over it!)
  ctx.save(); ctx.translate(x, y); const g = ctx.createRadialGradient(0, -10, 2, 0, -10, 30); g.addColorStop(0, 'rgba(255,230,140,.95)'); g.addColorStop(1, 'rgba(255,170,60,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -12, 24, 26, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-18, 0); ctx.quadraticCurveTo(-10, -34, 8, -26); ctx.quadraticCurveTo(24, -14, 18, 0); ctx.closePath(); fs(ctx, '#ffd86a'); ctx.restore();
};

/* ============ extra Jump Over! things ============ */
SP.JUMP_OBSTACLES.ball = { w: 50, h: 50 }; SP.JUMP_OBSTACLES.swing = { w: 46, h: 46 }; SP.JUMP_OBSTACLES.wall = { w: 40, h: 108 };
SP.ball = function (ctx, x, y, t) {   // rolling ball, anchor bottom centre
  ctx.save(); ctx.translate(x, y - 25); ctx.rotate(-t * 5);
  circ(ctx, 0, 0, 25, puff(ctx, 0, 0, 25, '#ffd0a0', '#ff6b86'));
  ctx.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 3; i++) { ctx.save(); ctx.rotate(i * 2.09); rr(ctx, -5, -24, 10, 14, 4); ctx.fill(); ctx.restore(); }
  ctx.rotate(t * 5); eyes(ctx, 0, -2, 7, 5.5, -0.8); smile(ctx, -2, 9, 5, 4); ctx.restore();
};
SP.swing = function (ctx, x, y, t) {  // hangs from the top of the screen; anchor = bottom of the ball (x, y)
  ctx.save(); ctx.translate(x, 0); const a = Math.sin(t * 2.5) * 0.12, len = y - 46;
  ctx.rotate(a); ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(0, len); ctx.lineWidth = 6; ctx.strokeStyle = OUT; ctx.stroke(); ctx.lineWidth = 3; ctx.strokeStyle = '#6bcb77'; ctx.stroke();
  circ(ctx, 0, len + 23, 23, puff(ctx, 0, len + 23, 23, '#e8c8ff', '#9a5ad8')); eyes(ctx, 0, len + 20, 7, 5.5, 0); smile(ctx, 0, len + 31, 5, 4);
  ctx.restore();
};
SP.wall = function (ctx, x, y, t) {   // tall friendly block: needs a full jump. anchor bottom centre
  ctx.save(); ctx.translate(x, y); rr(ctx, -20, -108, 40, 108, 10); fs(ctx, puff(ctx, 0, -54, 60, '#ffe9a8', '#e8a83a'));
  ctx.strokeStyle = 'rgba(160,100,20,.5)'; ctx.lineWidth = 2; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-20, -108 + i * 27); ctx.lineTo(20, -108 + i * 27); ctx.stroke(); }
  eyes(ctx, 0, -78, 7, 5.5, 0); smile(ctx, 0, -62, 6, 4); ctx.restore();
};
SP.coin = function (ctx, x, y, t) {   // collectible star
  const k = Math.abs(Math.cos(t * 3 + x * 0.01)) * 0.5 + 0.5; ctx.save(); ctx.translate(x, y); ctx.scale(k, 1);
  ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 6 : 13; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); fs(ctx, '#ffd23f'); ctx.restore();
};
/* ============ extra Star Blaster things ============ */
SP.zig = function (ctx, x, y, r, t) {       // zig-zag flyer
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 5) * 0.2);
  ell(ctx, 0, 4, r * 1.5, r * 0.55, puff(ctx, 0, 4, r * 1.5, '#ffd0f0', '#d058c0')); ctx.beginPath(); ctx.arc(0, 0, r * 0.8, Math.PI, 0); fs(ctx, 'rgba(190,240,255,.9)');
  eyes(ctx, 0, -3, r * 0.3, r * 0.25, Math.sin(t * 5)); [-1, 0, 1].forEach(function (d) { circ(ctx, d * r * 0.8, r * 0.35, 3, '#ffd23f'); }); ctx.restore();
};
SP.splitter = function (ctx, x, y, r, t) {  // pod that splits in two when popped
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t) * 0.1);
  circ(ctx, 0, 0, r, puff(ctx, 0, 0, r, '#ffe8b0', '#ee8a30')); ctx.beginPath(); ctx.moveTo(0, -r); ctx.quadraticCurveTo(r * 0.3, 0, 0, r); ctx.lineWidth = 3; ctx.strokeStyle = OUT; ctx.stroke();
  eyes(ctx, -r * 0.4, -2, 0.01, r * 0.2, 0.5); eyes(ctx, r * 0.4, -2, 0.01, r * 0.2, -0.5); smile(ctx, 0, r * 0.45, r * 0.25, r * 0.15); ctx.restore();
};
SP.megaBoss = function (ctx, x, y, t, hpFrac, hurt, kind) {   // big friendly space bosses
  ctx.save(); ctx.translate(x, y + Math.sin(t * 1.5) * 4);
  const pals = [['#e8c8ff', '#9a5ad8'], ['#c8ffe8', '#2fbf90'], ['#ffd8a8', '#e8802a']], p = pals[kind % 3];
  for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 20, 40); ctx.quadraticCurveTo(i * 20 + Math.sin(t * 4 + i) * 12, 80, i * 20 + Math.sin(t * 4 + i + 1) * 10, 110); ctx.lineWidth = 11; ctx.strokeStyle = OUT; ctx.stroke(); ctx.lineWidth = 6; ctx.strokeStyle = p[1]; ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(-84, 50); ctx.bezierCurveTo(-96, -110, 96, -110, 84, 50); ctx.closePath(); fs(ctx, puff(ctx, 0, -20, 90, p[0], p[1])); shine(ctx, -36, -52, 20, 8);
  eyes(ctx, 0, -10, 30, 17, Math.sin(t * 2), hurt); smile(ctx, 0, 24, 18, hpFrac < 0.4 ? 5 : 11);
  ctx.beginPath(); ctx.moveTo(0, -78); ctx.lineTo(0, -100); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke(); circ(ctx, 0, -104, 8, '#ffd23f'); ctx.restore();
};

SP.enemyOrb = function (ctx, x, y, t) {
  const g = ctx.createRadialGradient(x, y, 2, x, y, 16); g.addColorStop(0, 'rgba(255,150,200,.9)'); g.addColorStop(1, 'rgba(255,150,200,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 16, 0, TAU); ctx.fill();
  circ(ctx, x, y, 7 + Math.sin(t * 8) * 0.8, puff(ctx, x, y, 8, '#ffffff', '#ff6fae'));
};

/* ============ BIG ENEMIES (Commando Run) - all face LEFT, toward the hero ============ */
/* giant robot: slams the ground if you get close. anchor = bottom centre, ~120 x 190. s = {wind 0..1 (arm lifting), slam 0..1, hurt} */
SP.mech = function (ctx, x, y, t, s) {
  s = s || {}; ctx.save(); ctx.translate(x, y); const w = Math.sin(t * 3) * 2.5;
  rr(ctx, -64, -14, 54, 14, 6); fs(ctx, '#3a3f66'); rr(ctx, 10, -14, 54, 14, 6); fs(ctx, '#3a3f66');
  rr(ctx, -50, -66 + w, 30, 54, 8); fs(ctx, '#6a74b0'); rr(ctx, 20, -66 - w, 30, 54, 8); fs(ctx, '#6a74b0');
  circ(ctx, -35, -50, 8, '#8a94d0'); circ(ctx, 35, -50, 8, '#8a94d0');
  rr(ctx, -54, -88, 108, 28, 10); fs(ctx, '#4a5488');
  // back exhaust pipes + smoke
  rr(ctx, 40, -172, 14, 40, 5); fs(ctx, '#5a5a78'); rr(ctx, 58, -164, 12, 34, 5); fs(ctx, '#5a5a78');
  ctx.fillStyle = 'rgba(90,90,110,.5)'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(52 + Math.sin(t * 2 + i) * 6, -176 - i * 16 - ((t * 20) % 16), 6 + i * 2, 0, TAU); ctx.fill(); }
  rr(ctx, -60, -158, 120, 76, 18); fs(ctx, puff(ctx, 0, -120, 80, '#b8c2f0', '#4a5488'));
  ctx.save(); rr(ctx, -60, -102, 120, 14, 3); ctx.clip(); ctx.fillStyle = '#ffd23f'; ctx.fillRect(-60, -102, 120, 14); ctx.fillStyle = '#1a1b3f'; for (let i = -6; i < 8; i++) { ctx.beginPath(); ctx.moveTo(i * 16, -102); ctx.lineTo(i * 16 + 8, -102); ctx.lineTo(i * 16 + 22, -88); ctx.lineTo(i * 16 + 14, -88); ctx.closePath(); ctx.fill(); } ctx.restore();
  rr(ctx, -60, -102, 120, 14, 3); ctx.lineWidth = 3; ctx.strokeStyle = OUT; ctx.stroke();
  const pulse = 0.6 + 0.4 * Math.sin(t * 5) + (s.wind || 0); const cg = ctx.createRadialGradient(0, -128, 2, 0, -128, 26); cg.addColorStop(0, 'rgba(255,220,120,' + Math.min(1, pulse) + ')'); cg.addColorStop(1, 'rgba(255,90,40,0)'); ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(0, -128, 26, 0, TAU); ctx.fill();
  circ(ctx, 0, -128, 11, '#ff6a2a');
  [-1, 1].forEach(function (d) { circ(ctx, d * 66, -150, 21, '#7a84c0'); for (let i = -1; i <= 1; i++) tri2(ctx, d * 66 + i * 12 - 5, -166, d * 66 + i * 12, -190 + Math.abs(i) * 6, d * 66 + i * 12 + 5, -166, '#d0d6ff'); });
  rr(ctx, -34, -202, 68, 52, 14); fs(ctx, puff(ctx, 0, -176, 40, '#a8b2e8', '#4a5488'));
  rr(ctx, -27, -194, 54, 26, 9); fs(ctx, '#2b0f1e');
  [-1, 1].forEach(function (d) { ctx.beginPath(); ctx.ellipse(d * 12, -181, 8, 6, 0, 0, TAU); ctx.fillStyle = '#ff3a2a'; ctx.fill(); ctx.beginPath(); ctx.moveTo(d * 22, -192); ctx.lineTo(d * 3, -184); ctx.lineWidth = 4; ctx.strokeStyle = '#ff9a8a'; ctx.stroke(); });
  tri2(ctx, -30, -202, -42, -232, -14, -204, '#d0d6ff'); tri2(ctx, 30, -202, 42, -232, 14, -204, '#d0d6ff');
  ctx.beginPath(); ctx.moveTo(0, -202); ctx.lineTo(0, -222); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke(); circ(ctx, 0, -226, 7, s.wind > 0 ? '#ff3a2a' : '#ffd23f');
  // back arm with cannon
  ctx.beginPath(); ctx.moveTo(66, -146); ctx.quadraticCurveTo(100, -110, 92, -70); ctx.lineWidth = 22; ctx.strokeStyle = OUT; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineWidth = 15; ctx.strokeStyle = '#8a94d0'; ctx.stroke();
  rr(ctx, 78, -78, 30, 22, 6); fs(ctx, '#3a3f66'); rr(ctx, 100, -72, 22, 10, 3); fs(ctx, '#2c2f3e');
  // front arm: rests low, lifts high when winding up, crashes down on slam
  const wd = s.wind || 0, sl = s.slam || 0; const fx = -98 - sl * 24, fy = sl > 0 ? -30 : -58 - wd * 150;
  ctx.beginPath(); ctx.moveTo(-66, -146); ctx.quadraticCurveTo(-112 - wd * 10, (-146 + fy) / 2, fx, fy); ctx.lineWidth = 26; ctx.strokeStyle = OUT; ctx.stroke(); ctx.lineWidth = 19; ctx.strokeStyle = '#9aa4dc'; ctx.stroke();
  rr(ctx, fx - 26, fy - 24, 52, 48, 12); fs(ctx, puff(ctx, fx, fy, 30, '#c8d0ff', '#5a6498'));
  for (let i = 0; i < 4; i++) tri2(ctx, fx - 22 + i * 12, fy - 22, fx - 16 + i * 12, fy - 36, fx - 10 + i * 12, fy - 22, '#e8ecff');
  if (s.hurt) { ctx.globalAlpha = 0.3; ctx.fillStyle = '#fff'; ctx.fillRect(-120, -240, 250, 250); ctx.globalAlpha = 1; }
  ctx.restore();
};
function tri2(ctx, x1, y1, x2, y2, x3, y3, col) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.closePath(); fs(ctx, col); }
/* tank that lobs bombs. anchor = bottom centre, ~170 x 100. s = {charge 0..1, hurt} */
SP.tank = function (ctx, x, y, t, s) {
  s = s || {}; ctx.save(); ctx.translate(x, y);
  rr(ctx, -80, -32, 160, 32, 16); fs(ctx, '#2f3350');
  for (let i = 0; i < 5; i++) { const wx = -58 + i * 29; circ(ctx, wx, -16, 12, '#555a80'); ctx.save(); ctx.translate(wx, -16); ctx.rotate(t * 5); ctx.strokeStyle = '#2f3350'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.moveTo(0, -8); ctx.lineTo(0, 8); ctx.stroke(); ctx.restore(); }
  ctx.fillStyle = '#1c1e30'; for (let i = 0; i < 20; i++) ctx.fillRect(-76 + i * 8 + ((t * 30) % 8), -34, 4, 4);
  rr(ctx, -70, -68, 140, 40, 12); fs(ctx, puff(ctx, 0, -48, 80, '#ee7a7a', '#8a2030'));
  ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(-60, -64, 120, 5);
  for (let i = 0; i < 6; i++) circ(ctx, -56 + i * 22, -36, 2.5, '#ffd0d0');
  ctx.beginPath(); ctx.moveTo(-70, -34); ctx.lineTo(-104, -12); ctx.lineTo(-70, -10); ctx.closePath(); fs(ctx, '#8a8aa8');
  for (let i = 0; i < 3; i++) tri2(ctx, -98 + i * 8, -14 + i * 0, -90 + i * 8, -26 - i * 2, -84 + i * 8, -12, '#d8d8f0');
  ctx.save(); ctx.translate(-4, -80); ctx.rotate(0.95 - (s.charge || 0) * 0.08); rr(ctx, -74, -8, 70, 16, 6); fs(ctx, '#4a4f66'); rr(ctx, -84, -12, 12, 24, 4); fs(ctx, '#2c2f3e');
  if (s.charge > 0) { const r = 6 + s.charge * 12, gg = ctx.createRadialGradient(-88, 0, 1, -88, 0, r + 8); gg.addColorStop(0, 'rgba(255,170,60,.95)'); gg.addColorStop(1, 'rgba(255,100,40,0)'); ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(-88, 0, r + 8, 0, TAU); ctx.fill(); }
  ctx.restore();
  circ(ctx, 8, -84, 28, puff(ctx, 8, -84, 28, '#f08a8a', '#9a2a3a'));
  ctx.beginPath(); ctx.ellipse(-2, -86, 8, 7, 0, 0, TAU); ctx.fillStyle = '#fff6c8'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = OUT; ctx.stroke(); circ(ctx, -4, -86, 4, '#ff3030');
  ctx.beginPath(); ctx.ellipse(20, -86, 8, 7, 0, 0, TAU); ctx.fillStyle = '#fff6c8'; ctx.fill(); ctx.stroke(); circ(ctx, 18, -86, 4, '#ff3030');
  ctx.beginPath(); ctx.moveTo(-14, -100); ctx.lineTo(4, -92); ctx.moveTo(34, -100); ctx.lineTo(16, -92); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.lineCap = 'round'; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(40, -100); ctx.lineTo(40, -126); ctx.lineWidth = 3; ctx.stroke(); tri2(ctx, 40, -126, 62, -118, 40, -110, '#1a1b3f');
  if (s.hurt) { ctx.globalAlpha = 0.3; ctx.fillStyle = '#fff'; ctx.fillRect(-110, -130, 220, 140); ctx.globalAlpha = 1; }
  ctx.restore();
};
/* bomber helicopter. anchor = centre, ~170 x 80. s = {charge, hurt} */
SP.gunship = function (ctx, x, y, t, s) {
  s = s || {}; ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.moveTo(40, -4); ctx.lineTo(112, -14); ctx.lineTo(112, 2); ctx.lineTo(44, 14); ctx.closePath(); fs(ctx, '#8a2030');
  ctx.save(); ctx.translate(112, -6); ctx.rotate(t * 30); ctx.fillStyle = '#c8c8e0'; ctx.fillRect(-14, -2, 28, 4); ctx.restore();
  ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(0, -40); ctx.lineWidth = 6; ctx.strokeStyle = OUT; ctx.stroke();
  const rw = 92 * Math.abs(Math.cos(t * 26)) + 20; ctx.beginPath(); ctx.ellipse(0, -42, rw, 4, 0, 0, TAU); ctx.fillStyle = 'rgba(210,210,235,.8)'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = OUT; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, 0, 62, 34, 0, 0, TAU); fs(ctx, puff(ctx, 0, 0, 62, '#ff8a8a', '#8a2030'));
  ctx.beginPath(); ctx.ellipse(-28, -6, 28, 20, 0, 0, TAU); ctx.fillStyle = 'rgba(190,240,255,.92)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = OUT; ctx.stroke();
  [-36, -20].forEach(function (ex) { ctx.beginPath(); ctx.ellipse(ex, -4, 6, 5, 0, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke(); circ(ctx, ex - 1, -4, 2.6, '#ff3030'); });
  ctx.beginPath(); ctx.moveTo(-46, -18); ctx.lineTo(-28, -10); ctx.moveTo(-8, -18); ctx.lineTo(-24, -10); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.lineCap = 'round'; ctx.stroke();
  rr(ctx, -22, 24, 44, 14, 5); fs(ctx, s.charge > 0 ? '#ff7a2a' : '#2c2f4e');
  ctx.beginPath(); ctx.moveTo(-50, 40); ctx.lineTo(50, 40); ctx.lineWidth = 5; ctx.strokeStyle = OUT; ctx.stroke(); ctx.beginPath(); ctx.moveTo(-30, 30); ctx.lineTo(-34, 40); ctx.moveTo(30, 30); ctx.lineTo(34, 40); ctx.stroke();
  rr(ctx, -84, 4, 36, 8, 3); fs(ctx, '#4a4f66');
  if (s.hurt) { ctx.globalAlpha = 0.3; ctx.fillStyle = '#fff'; ctx.fillRect(-90, -50, 210, 100); ctx.globalAlpha = 1; }
  ctx.restore();
};
/* charging beast. anchor = bottom centre, ~110 x 70. s = {wind 0..1 (crouching), dash (bool)} */
SP.charger = function (ctx, x, y, t, s) {
  s = s || {}; ctx.save(); ctx.translate(x, y); if (s.wind > 0) ctx.scale(1 + s.wind * 0.08, 1 - s.wind * 0.1);
  const r = s.dash ? Math.sin(t * 26) * 8 : Math.sin(t * 5) * 3;
  [-34, -14, 18, 38].forEach(function (lx, i) { rr(ctx, lx - 8 + (i % 2 ? r : -r), -26, 16, 26, 6); fs(ctx, i % 2 ? '#7a4a22' : '#8a5a2a'); });
  for (let i = 0; i < 6; i++) tri2(ctx, -26 + i * 14, -54 - (i % 2) * 4, -20 + i * 14, -72 - (i % 2) * 6, -14 + i * 14, -54, '#3a2210');
  ctx.beginPath(); ctx.ellipse(8, -38, 46, 28, 0, 0, TAU); fs(ctx, puff(ctx, 8, -38, 50, '#c8844a', '#5a3418'));
  ctx.beginPath(); ctx.ellipse(-44, -34, 26, 22, 0, 0, TAU); fs(ctx, puff(ctx, -44, -34, 26, '#d8944a', '#6a3c1a'));
  tri2(ctx, -62, -40, -104, -58, -62, -26, '#fffbea'); tri2(ctx, -48, -52, -60, -78, -38, -54, '#fffbea');
  tri2(ctx, -58, -20, -76, -8, -50, -14, '#fffbea');
  fierceEyes(ctx, -46, -40, 6, 5, false, '#ff3a2a');
  if (s.wind > 0 || s.dash) { ctx.fillStyle = 'rgba(255,255,255,.6)'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-76 - i * 8 - ((t * 60) % 10), -26 + i * 4, 3 + i, 0, TAU); ctx.fill(); } }
  ctx.restore();
};
SP.firePatch = function (ctx, x, y, t, life) {
  ctx.save(); ctx.translate(x, y); const k = Math.min(1, life * 2);
  for (let i = -2; i <= 2; i++) { const h = (18 + (2 - Math.abs(i)) * 7 + Math.sin(t * 9 + i * 2) * 5) * k; ctx.beginPath(); ctx.moveTo(i * 11 - 8, 0); ctx.quadraticCurveTo(i * 11 - 6, -h * 0.6, i * 11, -h); ctx.quadraticCurveTo(i * 11 + 6, -h * 0.6, i * 11 + 8, 0); ctx.closePath(); ctx.fillStyle = i % 2 ? '#ff9a2a' : '#ff5a1a'; ctx.fill(); ctx.beginPath(); ctx.moveTo(i * 11 - 4, 0); ctx.quadraticCurveTo(i * 11, -h * 0.5, i * 11 + 4, 0); ctx.fillStyle = '#ffe066'; ctx.fill(); }
  ctx.restore();
};

/* ============ PATTERN POP pad ============ */
SP.pad = function (ctx, x, y, w, h, color, lit, label, keyLabel, t) {
  ctx.save(); ctx.translate(x, y);
  if (lit) { const g = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w); g.addColorStop(0, color + 'aa'); g.addColorStop(1, color + '00'); ctx.fillStyle = g; ctx.fillRect(-w / 2, -h / 2, w * 2, h * 2); }
  const dy = lit ? 6 : 0;
  rr(ctx, 0, dy, w, h, 24); fs(ctx, lit ? puff(ctx, w / 2, h * .4, w, '#ffffff', color) : puff(ctx, w / 2, h * .4, w, color + 'cc', shade(color)));
  if (lit) shine(ctx, w * 0.3, h * 0.2 + dy, w * 0.18, h * 0.06, 0);
  ctx.fillStyle = lit ? OUT : '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = 'bold ' + Math.round(h * 0.34) + 'px "Trebuchet MS",sans-serif'; ctx.fillText(label, w / 2, h * 0.42 + dy);
  ctx.font = 'bold ' + Math.round(h * 0.17) + 'px "Trebuchet MS",sans-serif'; ctx.fillText(keyLabel, w / 2, h * 0.76 + dy);
  ctx.restore();
};
function shade(hex) { // darker copy of #rrggbb
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) * 0.6, g = ((n >> 8) & 255) * 0.6, b = (n & 255) * 0.6;
  return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')';
}

/* ============ FRUIT SLICE ============ */
SP.FRUIT_KINDS = ['apple', 'orange', 'banana', 'strawberry', 'pear', 'grapes', 'melon'];
SP.FRUIT_JUICE = { apple: ['#ff5c72', '#ffd0d6'], orange: ['#ff9f45', '#ffe0b8'], banana: ['#ffe066', '#fff6c8'], strawberry: ['#ff4d6d', '#ffc2cf'],
  pear: ['#c9ec6b', '#f1ffc4'], grapes: ['#a366ff', '#e1ccff'], melon: ['#ff6b86', '#b6f5b0'] };
/* fruit body only (no letter). centre anchor, r = radius */
SP.fruit = function (ctx, kind, x, y, r, t) {
  ctx.save(); ctx.translate(x, y);
  if (kind === 'apple') {
    ctx.beginPath(); ctx.moveTo(0, -r * 0.7); ctx.bezierCurveTo(r * 0.5, -r * 1.1, r * 1.25, -r * 0.5, r * 1.0, r * 0.35); ctx.bezierCurveTo(r * 0.8, r * 1.1, r * 0.2, r * 1.1, 0, r * 0.95);
    ctx.bezierCurveTo(-r * 0.2, r * 1.1, -r * 0.8, r * 1.1, -r * 1.0, r * 0.35); ctx.bezierCurveTo(-r * 1.25, -r * 0.5, -r * 0.5, -r * 1.1, 0, -r * 0.7); ctx.closePath();
    fs(ctx, puff(ctx, 0, 0, r * 1.2, '#ff9aa8', '#e0243f'));
    ctx.beginPath(); ctx.moveTo(0, -r * 0.7); ctx.quadraticCurveTo(r * 0.1, -r * 1.2, r * 0.25, -r * 1.35); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(r * 0.5, -r * 1.05, r * 0.35, r * 0.17, -0.4, 0, TAU); fs(ctx, '#6bcb77'); shine(ctx, -r * 0.5, -r * 0.3, r * 0.2, r * 0.1);
  } else if (kind === 'orange') {
    circ(ctx, 0, 0, r, puff(ctx, 0, 0, r, '#ffd08a', '#f07c14'));
    ctx.fillStyle = 'rgba(190,90,0,.25)'; for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.arc(Math.cos(i * 2.1) * r * 0.6, Math.sin(i * 3.3) * r * 0.6, 2, 0, TAU); ctx.fill(); }
    ctx.beginPath(); ctx.ellipse(r * 0.25, -r * 1.0, r * 0.4, r * 0.18, -0.5, 0, TAU); fs(ctx, '#6bcb77'); shine(ctx, -r * 0.4, -r * 0.4, r * 0.2, r * 0.1);
  } else if (kind === 'banana') {
    ctx.save(); ctx.rotate(-0.4);
    ctx.beginPath(); ctx.moveTo(-r * 1.1, -r * 0.2); ctx.quadraticCurveTo(0, r * 1.5, r * 1.1, -r * 0.7); ctx.quadraticCurveTo(r * 0.9, -r * 0.1, r * 0.1, r * 0.35); ctx.quadraticCurveTo(-r * 0.6, r * 0.45, -r * 1.1, -r * 0.2); ctx.closePath();
    fs(ctx, puff(ctx, 0, 0, r * 1.2, '#fff3a0', '#f2c100'));
    rr(ctx, r * 0.95, -r * 0.95, r * 0.25, r * 0.4, 3); fs(ctx, '#8a6a2c'); shine(ctx, -r * 0.2, r * 0.45, r * 0.4, r * 0.07, -0.2); ctx.restore();
  } else if (kind === 'strawberry') {
    ctx.beginPath(); ctx.moveTo(0, r * 1.05); ctx.bezierCurveTo(-r * 1.3, r * 0.2, -r * 1.1, -r * 0.8, 0, -r * 0.75); ctx.bezierCurveTo(r * 1.1, -r * 0.8, r * 1.3, r * 0.2, 0, r * 1.05); ctx.closePath();
    fs(ctx, puff(ctx, 0, 0, r * 1.2, '#ff8fa3', '#e3254a'));
    ctx.fillStyle = '#ffe9a8'; [[-.5, -.2], [.4, -.3], [0, .1], [-.3, .45], [.35, .35], [0, .7], [-.6, .2], [.6, .1]].forEach(function (p) { ctx.beginPath(); ctx.ellipse(p[0] * r, p[1] * r, 2, 3, 0, 0, TAU); ctx.fill(); });
    ctx.beginPath(); ctx.moveTo(-r * 0.7, -r * 0.8); ctx.lineTo(-r * 0.25, -r * 1.05); ctx.lineTo(0, -r * 0.7); ctx.lineTo(r * 0.25, -r * 1.05); ctx.lineTo(r * 0.7, -r * 0.8); ctx.lineTo(0, -r * 0.55); ctx.closePath(); fs(ctx, '#4fc46d');
  } else if (kind === 'pear') {
    ctx.beginPath(); ctx.moveTo(0, -r * 1.05); ctx.bezierCurveTo(r * 0.5, -r * 1.05, r * 0.5, -r * 0.2, r * 0.9, r * 0.2); ctx.bezierCurveTo(r * 1.2, r * 0.9, -r * 1.2, r * 0.9, -r * 0.9, r * 0.2); ctx.bezierCurveTo(-r * 0.5, -r * 0.2, -r * 0.5, -r * 1.05, 0, -r * 1.05); ctx.closePath();
    fs(ctx, puff(ctx, 0, 0, r * 1.2, '#e6f9a0', '#8cc63f'));
    ctx.beginPath(); ctx.moveTo(0, -r * 1.05); ctx.quadraticCurveTo(r * 0.1, -r * 1.3, r * 0.3, -r * 1.4); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke(); shine(ctx, -r * 0.4, r * 0.2, r * 0.18, r * 0.1);
  } else if (kind === 'grapes') {
    [[-.5, -.5], [.5, -.5], [0, -.1], [-.6, .2], [.6, .2], [-.2, .55], [.3, .6], [0, 1.0]].forEach(function (p, i) {
      circ(ctx, p[0] * r * 0.9, p[1] * r * 0.9, r * 0.38, puff(ctx, p[0] * r * 0.9, p[1] * r * 0.9, r * 0.4, '#d3a8ff', '#7a3fd0')); });
    ctx.beginPath(); ctx.moveTo(0, -r * 0.8); ctx.quadraticCurveTo(r * 0.1, -r * 1.2, r * 0.3, -r * 1.3); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(r * 0.4, -r * 1.0, r * 0.35, r * 0.16, -0.4, 0, TAU); fs(ctx, '#6bcb77');
  } else { // melon slice (half-moon)
    ctx.beginPath(); ctx.arc(0, -r * 0.3, r * 1.15, 0, Math.PI); ctx.closePath(); fs(ctx, '#4fc46d');
    ctx.beginPath(); ctx.arc(0, -r * 0.3, r * 0.95, 0, Math.PI); ctx.closePath(); ctx.fillStyle = '#ffe9e9'; ctx.fill();
    ctx.beginPath(); ctx.arc(0, -r * 0.3, r * 0.8, 0, Math.PI); ctx.closePath(); ctx.fillStyle = puff(ctx, 0, 0, r, '#ff9aa8', '#ff4d6d'); ctx.fill();
    ctx.fillStyle = OUT; [[-.4, .25], [0, .45], [.4, .25], [-.2, .1], [.2, .1]].forEach(function (p) { ctx.beginPath(); ctx.ellipse(p[0] * r, p[1] * r, 2.5, 4, 0, 0, TAU); ctx.fill(); });
  }
  ctx.restore();
};
/* the big, high-contrast letter badge drawn on top of a fruit */
SP.fruitLetter = function (ctx, ch, x, y, r) {
  ctx.save(); ctx.translate(x, y);
  circ(ctx, 0, 0, r * 0.62, '#ffffff');
  ctx.fillStyle = '#1a1b3f'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = 'bold ' + Math.round(r * 0.9) + 'px "Trebuchet MS",Arial,sans-serif'; ctx.fillText(ch, 0, r * 0.05);
  ctx.restore();
};
})();
