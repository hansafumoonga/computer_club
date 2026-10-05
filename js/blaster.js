/* blaster.js - Star Blaster (both sessions). Left/Right move, Space blasts friendly space rocks. 12 levels, 3 big bosses. */
(function () {
'use strict';

/* =============== TEACHER SETTINGS - easy numbers to nudge =============== */
const BLASTER_LIVES = 6;                 // hearts at the start of each level
const BLASTER_INVINCIBLE_SECONDS = 1.2;  // safe time after a bump
const BLASTER_HITBOX_PAD = 8;            // pixels shaved off each side of ship & rock boxes (bigger = more forgiving)
const SHIP_SPEED = 340;                  // how fast the ship slides (pixels/second)
const BLASTER_WEAPON_SECONDS = 22;       // how long a pickup weapon lasts
const FIRE_DELAY = { normal: 0.4, rapid: 0.15, spread: 0.45, laser: 0.22 };   // seconds between shots when holding Space
/* The falling things. speed = pixels/second, r = size, hp = shots needed (a level can override rock hp with rockHp) */
const ENEMIES = {
  rock:     { r: 32, hp: 2, speed: 55 },                  // slow and big
  comet:    { r: 15, hp: 1, speed: 135 },                 // small and fast
  jelly:    { r: 24, hp: 1, speed: 75, drift: 80 },       // wobbles side to side
  zig:      { r: 20, hp: 1, speed: 95, drift: 150 },      // zig-zags quickly
  splitter: { r: 30, hp: 2, speed: 60 }                   // pops into two little comets
};
/* One line per level. count = things that fall, gap = [min,max] seconds between them (bigger = easier),
   types = which things appear, speedMul = speed multiplier, rockHp = hits a rock needs,
   boss = a big friendly space monster arrives at the end (hp = its hit points). Glowing capsules appear every few things. */
const BLASTER_LEVELS = [
  { count: 12, gap: [2.4, 3.0], types: ['rock'],                                       speedMul: 0.9,  rockHp: 1 },
  { count: 14, gap: [2.2, 2.8], types: ['rock', 'jelly'],                              speedMul: 1.0,  rockHp: 1 },
  { count: 16, gap: [2.0, 2.6], types: ['rock', 'jelly', 'comet'],                     speedMul: 1.0,  rockHp: 1 },
  { count: 16, gap: [1.9, 2.5], types: ['rock', 'jelly', 'comet', 'zig'],              speedMul: 1.05, rockHp: 2, boss: { kind: 0, hp: 40 } },
  { count: 20, gap: [1.7, 2.3], types: ['rock', 'jelly', 'comet', 'zig', 'splitter'],  speedMul: 1.1,  rockHp: 2 },
  { count: 22, gap: [1.6, 2.2], types: ['rock', 'jelly', 'comet', 'zig', 'splitter'],  speedMul: 1.15, rockHp: 2 },
  { count: 24, gap: [1.5, 2.1], types: ['rock', 'jelly', 'comet', 'zig', 'splitter'],  speedMul: 1.2,  rockHp: 2 },
  { count: 22, gap: [1.4, 2.0], types: ['rock', 'jelly', 'comet', 'zig', 'splitter'],  speedMul: 1.25, rockHp: 3, boss: { kind: 1, hp: 70 } },
  { count: 28, gap: [1.3, 1.9], types: ['rock', 'jelly', 'comet', 'zig', 'splitter'],  speedMul: 1.3,  rockHp: 3 },
  { count: 30, gap: [1.2, 1.8], types: ['rock', 'jelly', 'comet', 'zig', 'splitter'],  speedMul: 1.35, rockHp: 3 },
  { count: 32, gap: [1.1, 1.7], types: ['rock', 'jelly', 'comet', 'zig', 'splitter'],  speedMul: 1.4,  rockHp: 3 },
  { count: 28, gap: [1.0, 1.6], types: ['rock', 'jelly', 'comet', 'zig', 'splitter'],  speedMul: 1.45, rockHp: 3, boss: { kind: 2, hp: 110 } }
];
/* ======================================================================= */

const SP = CC.sprites, SHIP_Y = 385, LAND_Y = 418;
const SKY = [['#15163a', '#3c2f80'], ['#0f2a4a', '#2a6a9a'], ['#2a1a4a', '#7a3a8a'], ['#102a3a', '#2a7a6a']];
const CAPS = ['rapid', 'spread', 'laser'];
let ship, enemies, shots, capsules, lives, invincible, fireCd, wantFire, weapon, weaponLeft, spawnIn, spawned, resolved, lv, stars, boss, bossAnn, capCount;

const MUSIC_KEY = [0, 2, -2, 3];
function reset(g, level) {
  lv = BLASTER_LEVELS[level]; CC.music.play('blaster', { transpose: MUSIC_KEY[level % 4], tempo: 1 + level * 0.015 });
  ship = { x: g.W / 2, sx: 1, sy: 1 }; enemies = []; shots = []; capsules = []; lives = BLASTER_LIVES; invincible = 0;
  fireCd = 0; wantFire = false; weapon = 'normal'; weaponLeft = 0; spawnIn = 1.5; spawned = 0; resolved = 0; boss = null; bossAnn = 0; capCount = 0;
  stars = []; for (let i = 0; i < 50; i++) stars.push({ x: Math.random() * g.W, y: Math.random() * g.H, s: 0.5 + Math.random() * 1.5 });
}
function fire() {
  const y = SHIP_Y - 30;
  if (weapon === 'spread') [-0.28, 0, 0.28].forEach(function (a) { shots.push({ x: ship.x + a * 40, y: y, vx: Math.sin(a) * 560, vy: -Math.cos(a) * 560, kind: 'spread', pierce: 1 }); });
  else if (weapon === 'laser') shots.push({ x: ship.x, y: y, vx: 0, vy: -1000, kind: 'laser', pierce: 99, hit: [] });
  else shots.push({ x: ship.x, y: y, vx: 0, vy: -560, kind: weapon, pierce: 1 });
  CC.sfx.shoot(weapon === 'laser' ? 'rapid' : weapon); ship.sy = 1.15; ship.sx = 0.92;
}
function addEnemy(type, x, y) {
  const d = ENEMIES[type], hp = type === 'rock' ? lv.rockHp : d.hp;
  enemies.push({ type: type, x: x, bx: x, y: y, hp: hp, maxHp: hp, ph: Math.random() * 6, hit: 0 });
}
function spawnEnemy(g) {
  const type = lv.types[Math.floor(Math.random() * lv.types.length)], d = ENEMIES[type];
  addEnemy(type, CC.rand(d.r + 40, g.W - d.r - 40), -d.r - 10); spawned++;
}
function loseLife(g, x, y) {
  lives--; invincible = BLASTER_INVINCIBLE_SECONDS; CC.sfx.lifeLost(); ship.sx = 1.25; ship.sy = 0.8;
  g.particles.burst(x, y, ['#ffd23f', '#ffffff', '#ff9aa8'], 10, { speed: 140, size: 5, up: 60 });
  if (lives <= 0) { lives = 0; g.stars = 1; g.over(); }
}
function popEnemy(g, e) {
  const d = ENEMIES[e.type];
  g.particles.burst(e.x, e.y, e.type === 'jelly' ? ['#b6fff0', '#2fbfb0', '#ffffff'] : e.type === 'comet' ? ['#ffe08a', '#ff8a3d', '#ffffff'] : e.type === 'zig' ? ['#ffd0f0', '#d058c0', '#fff'] : ['#d3b4a0', '#8a6a7e', '#ffffff'], 14 + d.r / 3, { speed: 190, size: 6 });
  CC.sfx.pop();
  if (e.type === 'splitter') { addEnemy('comet', e.x - 20, e.y); addEnemy('comet', e.x + 20, e.y); enemies[enemies.length - 2].bx = e.x - 20; enemies[enemies.length - 1].bx = e.x + 20; }
  resolved++;
}
function pickUp(g, c) {
  weapon = c.kind; weaponLeft = BLASTER_WEAPON_SECONDS; CC.sfx.pickup();
  g.particles.burst(c.x, c.y, [SP.WEAPON_COLORS[c.kind], '#ffffff'], 16, { speed: 170, size: 5, grav: 0 });
  ship.sy = 1.2; ship.sx = 1.1;
}
function update(g, dt) {
  const dir = (CC.held.ArrowRight ? 1 : 0) - (CC.held.ArrowLeft ? 1 : 0);
  ship.x = CC.clamp(ship.x + dir * SHIP_SPEED * dt, 36, g.W - 36);
  ship.sx += (1 - ship.sx) * Math.min(1, dt * 10); ship.sy += (1 - ship.sy) * Math.min(1, dt * 10);
  fireCd -= dt;
  if ((CC.held.Space || wantFire) && fireCd <= 0) { fire(); fireCd = FIRE_DELAY[weapon]; }
  wantFire = false;
  if (weaponLeft > 0) { weaponLeft -= dt; if (weaponLeft <= 0) weapon = 'normal'; }
  if (invincible > 0) invincible -= dt;
  if (bossAnn > 0) bossAnn -= dt;
  // spawning
  spawnIn -= dt;
  if (spawned < lv.count && spawnIn <= 0) {
    spawnEnemy(g); spawnIn = CC.rand(lv.gap[0], lv.gap[1]);
    if (spawned % 5 === 3) capsules.push({ x: CC.rand(80, g.W - 80), y: -30, kind: CAPS[capCount++ % CAPS.length], t: 0 });
  }
  if (lv.boss && !boss && spawned >= lv.count && enemies.length === 0) {
    boss = { x: g.W / 2, y: -120, hp: lv.boss.hp, maxHp: lv.boss.hp, t: 0, hit: 0, drop: 2, dying: 0 }; bossAnn = 2.2; CC.sfx.warn(); CC.music.play('blasterBoss', { transpose: MUSIC_KEY[g.level % 4] });
  }
  // shots
  for (const s of shots) { s.x += s.vx * dt; s.y += s.vy * dt; }
  shots = shots.filter(function (s) { return s.y > -70 && s.x > -30 && s.x < g.W + 30; });
  // capsules
  for (let i = capsules.length - 1; i >= 0; i--) {
    const c = capsules[i]; c.t += dt; c.y += 48 * dt; c.x += Math.sin(c.t * 1.5) * 20 * dt;
    const box = { x: c.x - 24, y: c.y - 16, w: 48, h: 32 };
    let got = CC.overlap(box, { x: ship.x - 24, y: SHIP_Y - 30, w: 48, h: 60 });
    for (let j = shots.length - 1; j >= 0 && !got; j--) if (CC.overlap(box, { x: shots[j].x - 6, y: shots[j].y - 8, w: 12, h: 16 })) { got = true; shots.splice(j, 1); }
    if (got) { pickUp(g, c); capsules.splice(i, 1); } else if (c.y > g.H + 40) capsules.splice(i, 1);
  }
  // enemies
  const shipBox = CC.shrink(ship.x - 22, SHIP_Y - 30, 44, 56, BLASTER_HITBOX_PAD);
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i], d = ENEMIES[e.type];
    e.y += d.speed * lv.speedMul * dt * (e.type === 'comet' && e.bx !== e.x ? 1.2 : 1); e.ph += dt;
    if (d.drift) e.x = CC.clamp(e.bx + Math.sin(e.ph * (e.type === 'zig' ? 2.6 : 1.6)) * d.drift, d.r, g.W - d.r);
    if (e.hit > 0) e.hit -= dt;
    const box = CC.shrink(e.x - d.r, e.y - d.r, d.r * 2, d.r * 2, Math.max(BLASTER_HITBOX_PAD, 4));
    let dead = false;
    for (let j = shots.length - 1; j >= 0; j--) {
      const s = shots[j]; if (s.hit && s.hit.indexOf(e) >= 0) continue;
      const sb = s.kind === 'laser' ? { x: s.x - 5, y: s.y - 30, w: 10, h: 60 } : { x: s.x - 6, y: s.y - 8, w: 12, h: 16 };
      if (CC.overlap(box, sb)) {
        if (s.hit) s.hit.push(e); else shots.splice(j, 1);
        e.hp--; e.hit = 0.12;
        if (e.hp <= 0) { popEnemy(g, e); dead = true; break; } else CC.sfx.clink();
      }
    }
    if (dead) { enemies.splice(i, 1); continue; }
    if (CC.overlap(box, shipBox)) {
      enemies.splice(i, 1); resolved++; g.particles.burst(e.x, e.y, '#ffffffcc', 8, { speed: 120, size: 5 });
      if (invincible <= 0) { loseLife(g, ship.x, SHIP_Y); if (g.state !== 'play') return; } else CC.sfx.pop();
      continue;
    }
    if (e.y + d.r * 0.5 > LAND_Y) {      // reached the ground: gentle puff, costs a heart (unless safe)
      enemies.splice(i, 1); resolved++; g.particles.burst(e.x, LAND_Y, '#ffffffcc', 8, { speed: 100, size: 5, up: 60 });
      if (invincible <= 0) { loseLife(g, e.x, LAND_Y - 20); if (g.state !== 'play') return; } else CC.sfx.pop();
    }
  }
  // boss
  if (boss) {
    boss.t += dt; if (boss.hit > 0) boss.hit -= dt;
    if (boss.dying > 0) {
      boss.dying -= dt; if (Math.random() < dt * 14) g.particles.burst(boss.x + CC.rand(-70, 70), boss.y + CC.rand(-60, 60), ['#ffd23f', '#ffffff', '#ff9aa8'], 6, { speed: 160, size: 6 });
      if (boss.dying <= 0) { g.particles.burst(boss.x, boss.y, ['#ffd23f', '#ffffff', '#ff9aa8', '#b5f59a'], 60, { speed: 320, size: 8, life: 1.1 }); CC.sfx.pop(); capsules = []; enemies = []; boss = null; g.stars = lives >= 4 ? 3 : lives >= 2 ? 2 : 1; g.complete(); return; }
    } else {
      if (boss.y < 105) boss.y += 70 * dt; else {
        boss.x = g.W / 2 + Math.sin(boss.t * (boss.hp < boss.maxHp * 0.5 ? 1.1 : 0.7)) * (g.W / 2 - 110);
        boss.drop -= dt;
        if (boss.drop <= 0) { addEnemy(boss.hp < boss.maxHp * 0.5 ? 'zig' : 'comet', boss.x, boss.y + 70); spawned++; boss.drop = boss.hp < boss.maxHp * 0.5 ? 1.3 : 1.9; CC.sfx.warn(); }
      }
      const bb = CC.shrink(boss.x - 80, boss.y - 70, 160, 130, 8);
      for (let j = shots.length - 1; j >= 0; j--) {
        const s = shots[j], sb = s.kind === 'laser' ? { x: s.x - 5, y: s.y - 30, w: 10, h: 60 } : { x: s.x - 6, y: s.y - 8, w: 12, h: 16 };
        if (CC.overlap(bb, sb)) { if (s.kind !== 'laser') shots.splice(j, 1); boss.hp -= (s.kind === 'laser' ? 0.25 : 1); boss.hit = 0.1; CC.sfx.clink(); if (boss.hp <= 0) { boss.hp = 0; boss.dying = 1.6; enemies = []; CC.sfx.pop(); break; } }
      }
    }
  }
  if (!lv.boss && spawned >= lv.count && enemies.length === 0) { capsules = []; g.stars = lives >= 4 ? 3 : lives >= 2 ? 2 : 1; g.complete(); }
}
function hrr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function draw(g) {
  const c = g.ctx, W = g.W, H = g.H, sky = SKY[g.level % SKY.length];
  const bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, sky[0]); bg.addColorStop(1, sky[1]);
  c.fillStyle = bg; c.fillRect(0, 0, W, H);
  for (const s of stars) { if (g.state === 'play') s.y = (s.y + s.s * 0.25) % H; c.globalAlpha = 0.4 + 0.3 * Math.sin(g.t * 0.7 + s.x); c.fillStyle = '#fff'; c.fillRect(s.x, s.y, s.s + 0.5, s.s + 0.5); }
  c.globalAlpha = 1;
  // little home planet along the bottom (this is what we protect)
  c.fillStyle = '#2f8f8f'; c.beginPath(); c.ellipse(W / 2, H + 230, W * 0.85, 280, 0, 0, 6.283); c.fill();
  c.fillStyle = '#5fd3c4'; c.beginPath(); c.ellipse(W / 2, H + 238, W * 0.85, 280, 0, Math.PI * 1.02, Math.PI * 1.98); c.lineWidth = 6; c.strokeStyle = '#8be8d8'; c.stroke();
  [[120, 428], [300, 421], [520, 421], [690, 428]].forEach(function (p) {
    c.fillStyle = '#ffe9a8'; c.fillRect(p[0] - 9, p[1] - 6, 18, 14); c.fillStyle = '#ff7a8a'; c.beginPath(); c.moveTo(p[0] - 12, p[1] - 6); c.lineTo(p[0], p[1] - 18); c.lineTo(p[0] + 12, p[1] - 6); c.fill();
  });
  CC.drawKeys(c, W, H, ['ArrowLeft', 'ArrowRight', 'Space']);   // behind the ship so it never covers it
  for (const cp of capsules) SP.capsule(c, cp.x, cp.y, cp.kind, cp.t);
  if (boss) { c.globalAlpha = boss.dying > 0 ? 0.6 + 0.4 * Math.sin(boss.t * 20) * 0.5 : 1; SP.megaBoss(c, boss.x, boss.y, boss.t, boss.hp / boss.maxHp, boss.hit > 0, lv.boss.kind); c.globalAlpha = 1; }
  for (const e of enemies) {
    const d = ENEMIES[e.type]; c.globalAlpha = e.hit > 0 ? 0.7 : 1;
    if (e.type === 'rock') SP.rockBig(c, e.x, e.y, d.r, g.t + e.ph, e.hp < e.maxHp);
    else if (e.type === 'comet') SP.comet(c, e.x, e.y, d.r, g.t);
    else if (e.type === 'zig') SP.zig(c, e.x, e.y, d.r, g.t + e.ph);
    else if (e.type === 'splitter') SP.splitter(c, e.x, e.y, d.r, g.t + e.ph);
    else SP.jelly(c, e.x, e.y, d.r, g.t + e.ph);
    c.globalAlpha = 1;
  }
  for (const s of shots) SP.bullet(c, s.x, s.y, s.kind, s.kind === 'spread' ? Math.atan2(s.vy, s.vx) : -Math.PI / 2, g.t);
  c.globalAlpha = invincible > 0 ? 0.6 + 0.2 * Math.sin(g.t * 8) : 1;
  SP.ship(c, ship.x, SHIP_Y, weapon, g.t, ship);
  c.globalAlpha = 1;
  g.particles.draw(c);
  // HUD: pictures and numbers only
  c.fillStyle = 'rgba(26,27,63,.55)'; hrr(c, 12, 10, 92, 44, 14); c.fill();
  c.font = '26px sans-serif'; c.textAlign = 'left'; c.fillStyle = '#fff'; c.fillText('🚀', 20, 41); CC.outlineText(c, String(g.level + 1), 62, 42, 28, '#ffd23f');
  for (let i = 0; i < BLASTER_LIVES; i++) SP.heart(c, W - 24 - i * 26, 28, 20, i < lives);
  if (boss && boss.dying <= 0 && boss.y >= 100) {
    c.fillStyle = 'rgba(26,27,63,.55)'; hrr(c, W / 2 - 130, 10, 266, 30, 12); c.fill();
    c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(W / 2 - 100, 18, 220, 14); c.fillStyle = '#ff8fb0'; c.fillRect(W / 2 - 100, 18, 220 * boss.hp / boss.maxHp, 14);
    c.strokeStyle = '#1a1b3f'; c.lineWidth = 2; c.strokeRect(W / 2 - 100, 18, 220, 14); c.font = '22px sans-serif'; c.fillStyle = '#fff'; c.fillText('👾', W / 2 - 126, 34);
  } else {
    const frac = lv ? Math.min(1, resolved / (lv.count + (lv.boss ? 2 : 0))) : 0, bx = W / 2 - 110;
    c.fillStyle = 'rgba(26,27,63,.55)'; hrr(c, bx - 10, 12, 244, 26, 12); c.fill();
    c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(bx, 21, 220, 8); c.fillStyle = '#ffd23f'; c.fillRect(bx, 21, 220 * frac, 8);
    c.font = '16px sans-serif'; c.fillStyle = '#fff'; c.fillText(lv && lv.boss ? '👾' : '🏁', bx + 224, 34);
  }
  if (weapon !== 'normal') { SP.capsule(c, 44, 84, weapon, g.t); c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(76, 78, 90, 10); c.fillStyle = SP.WEAPON_COLORS[weapon]; c.fillRect(76, 78, 90 * Math.max(0, weaponLeft / BLASTER_WEAPON_SECONDS), 10); }
  if (bossAnn > 0) { c.globalAlpha = Math.min(1, bossAnn); c.font = '60px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#fff'; c.fillText('👾❗', W / 2, 190); c.globalAlpha = 1; }
}
function onKeyDown(g, e) {
  if (e.code === 'Space' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') e.preventDefault();
  if (!e.repeat && e.code === 'Space' && g.state === 'play') wantFire = true;
}
CC.modes.blaster = CC.makeLevelGame({
  stageId: 'stage-blaster', title: 'Level', emoji: '🚀', total: BLASTER_LEVELS.length,
  levelIcon: function (i) { return BLASTER_LEVELS[i].boss ? '👾' : '🚀'; },
  controls: [{ keys: ['←', '→'], icon: '🚀' }, { keys: ['Space'], icon: '💥' }],
  reset: reset, update: update, draw: draw, onKeyDown: onKeyDown
});
CC.modes.blaster._debug = function () { return { ship: ship, enemies: enemies, shots: shots, capsules: capsules, lives: lives, weapon: weapon, resolved: resolved, spawned: spawned, lv: lv, boss: boss }; };
CC.modes.blaster._levels = BLASTER_LEVELS;
})();
