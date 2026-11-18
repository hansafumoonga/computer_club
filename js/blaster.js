/* blaster.js - Star Blaster (both sessions). Left/Right move, Space blasts friendly space rocks and alien saucers. 12 levels, 3 big bosses.
   Seven guns: collect a glowing capsule to pick one up, then press Up / Down (or the keys 1 to 7) to switch between the guns you own. */
(function () {
'use strict';

/* =============== TEACHER SETTINGS - easy numbers to nudge =============== */
const BLASTER_LIVES = 6;                 // hearts at the start of each level
const BLASTER_INVINCIBLE_SECONDS = 1.2;  // safe time after a bump
const BLASTER_HITBOX_PAD = 8;            // pixels shaved off each side of ship & rock boxes (bigger = more forgiving)
const SHIP_SPEED = 340;                  // how fast the ship slides on level 1 (pixels/second)
const SHIP_SPEED_GAIN = 1.1;             // the ship slides faster as the falling things get faster (0 = always the same speed; level 12 is about 1.6 times quicker)
const HEART_EVERY = 6;                   // a falling heart (+1 life) comes after every this many things, when you are missing a heart
const BONUS_LIFE_GAP = 4;                // seconds before a second 'double pop' can give another life
const BLASTER_WEAPON_SECONDS = 22;       // how long a picked-up gun lasts (it only counts down while that gun is the one in use)
const FIRE_LIFE = 0.55;                  // how long a Fire Burst flame lasts (about 240 pixels of reach)
const BLAST_RADIUS = 78;                 // how far the Plasma Ball burst reaches
const FIRE_DELAY = { normal: 0.4, rapid: 0.15, spread: 0.45, laser: 0.22, homing: 0.55, big: 1.0, fire: 0.2 };   // seconds between shots when holding Space
const BOSS_DAMAGE = { laser: 0.25, homing: 1.2, fire: 0.45 };    // hit points a shot takes off a boss (anything not listed takes 1)
/* The falling things. speed = pixels/second, r = size (a level can override rock hp with rockHp) */
const ENEMIES = {
  rock:     { r: 32, hp: 2, speed: 55 },                  // slow and big
  comet:    { r: 15, hp: 1, speed: 135 },                 // small and fast
  jelly:    { r: 24, hp: 1, speed: 75, drift: 80 },       // wobbles side to side
  zig:      { r: 20, hp: 1, speed: 95, drift: 150 },      // the alien SCOUT: zig-zags quickly
  splitter: { r: 30, hp: 2, speed: 60 },                  // pops into two little comets
  saucer:   { r: 28, hp: 2, speed: 62, drift: 110 }       // the alien SAUCER: sways slowly, two hits
};
/* One line per level. count = things that fall, gap = [min,max] seconds between them (bigger = easier),
   types = which things appear, speedMul = speed multiplier, rockHp = hits a rock needs,
   boss = a big friendly space monster (kind 3 = the alien mothership) arrives at the end (hp = its hit points). Glowing capsules appear every few things. */
const BLASTER_LEVELS = [
  { count: 12, gap: [2.4, 3.0], types: ['rock'],                                       speedMul: 0.9,  rockHp: 1 },
  { count: 14, gap: [2.2, 2.8], types: ['rock', 'jelly'],                              speedMul: 1.0,  rockHp: 1 },
  { count: 16, gap: [2.0, 2.6], types: ['rock', 'jelly', 'comet'],                     speedMul: 1.0,  rockHp: 1 },
  { count: 16, gap: [1.9, 2.5], types: ['rock', 'jelly', 'comet', 'zig'],              speedMul: 1.05, rockHp: 2, boss: { kind: 0, hp: 40 } },
  { count: 20, gap: [1.7, 2.3], types: ['rock', 'jelly', 'comet', 'zig', 'splitter', 'saucer'],  speedMul: 1.1,  rockHp: 2 },
  { count: 22, gap: [1.6, 2.2], types: ['rock', 'jelly', 'comet', 'zig', 'splitter', 'saucer'],  speedMul: 1.15, rockHp: 2 },
  { count: 24, gap: [1.5, 2.1], types: ['rock', 'jelly', 'comet', 'zig', 'splitter', 'saucer'],  speedMul: 1.2,  rockHp: 2 },
  { count: 22, gap: [1.4, 2.0], types: ['rock', 'jelly', 'comet', 'zig', 'splitter', 'saucer'],  speedMul: 1.25, rockHp: 3, boss: { kind: 1, hp: 70 } },
  { count: 28, gap: [1.3, 1.9], types: ['rock', 'jelly', 'comet', 'zig', 'splitter', 'saucer'],  speedMul: 1.3,  rockHp: 3 },
  { count: 30, gap: [1.2, 1.8], types: ['rock', 'jelly', 'comet', 'zig', 'splitter', 'saucer'],  speedMul: 1.35, rockHp: 3 },
  { count: 32, gap: [1.1, 1.7], types: ['rock', 'jelly', 'comet', 'zig', 'splitter', 'saucer'],  speedMul: 1.4,  rockHp: 3 },
  { count: 28, gap: [1.0, 1.6], types: ['rock', 'jelly', 'comet', 'zig', 'splitter', 'saucer'],  speedMul: 1.45, rockHp: 3, boss: { kind: 3, hp: 110 } }
];
/* the things floating in the sky of each level (they drift slowly down the screen) */
const SCENERY = [
  ['nebula', 'moon', 'astronaut'], ['ringed', 'satellite', 'galaxy'], ['galaxy', 'moon', 'station'], ['nebula', 'ringed', 'satellite'],
  ['astronaut', 'galaxy', 'ringed'], ['moon', 'station', 'nebula'], ['galaxy', 'satellite', 'astronaut'], ['ringed', 'nebula', 'moon'],
  ['station', 'galaxy', 'astronaut'], ['moon', 'ringed', 'satellite'], ['nebula', 'galaxy', 'station'], ['ringed', 'astronaut', 'moon', 'satellite']
];
const SCENE_SIZE = { nebula: { r: 150, v: 2 }, galaxy: { r: 62, v: 3 }, ringed: { r: 30, v: 5 }, moon: { r: 24, v: 5 }, satellite: { r: 0.55, v: 12 }, station: { r: 0.45, v: 9 }, astronaut: { r: 0.55, v: 14 } };
const NEBULA_COLORS = [['255,110,200', '120,90,255'], ['90,220,255', '90,120,255'], ['255,170,90', '255,90,140'], ['120,255,200', '60,160,255']];
const RING_COLORS = [['#ffdcaa', '#e08a3a'], ['#bff0ff', '#3a8ad0'], ['#e4c8ff', '#8a5ad0'], ['#c8ffd8', '#3fae6a']];
/* ======================================================================= */

const SP = CC.sprites, SHIP_Y = 385, LAND_Y = 418;
const SKY = [['#15163a', '#3c2f80'], ['#0f2a4a', '#2a6a9a'], ['#2a1a4a', '#7a3a8a'], ['#102a3a', '#2a7a6a']];
const CAPS = ['rapid', 'spread', 'laser', 'homing', 'big', 'fire'];     // the order the capsules come in (new guns arrive as the levels go on)
let ship, enemies, shots, capsules, lives, invincible, fireCd, wantFire, weapon, owned, spawnIn, spawned, resolved, lv, stars, boss, bossAnn, capCount, blasts, rings, scenery, twinkles, meteors, meteorIn, sceneT, hearts, pops, bonusCd;

const MUSIC_KEY = [0, 2, -2, 3];
function reset(g, level) {
  lv = BLASTER_LEVELS[level]; CC.music.play('blaster', { transpose: MUSIC_KEY[level % 4], tempo: 1 + level * 0.015 });
  ship = { x: g.W / 2, sx: 1, sy: 1 }; enemies = []; shots = []; capsules = []; lives = BLASTER_LIVES; invincible = 0;
  fireCd = 0; wantFire = false; weapon = 'normal'; owned = { normal: Infinity }; spawnIn = 1.5; spawned = 0; resolved = 0; boss = null; bossAnn = 0; capCount = 0; blasts = []; rings = []; hearts = []; pops = []; bonusCd = 0;
  stars = []; for (let i = 0; i < 50; i++) stars.push({ x: Math.random() * g.W, y: Math.random() * g.H, s: 0.5 + Math.random() * 1.5 });
  const kinds = SCENERY[level % SCENERY.length]; scenery = []; sceneT = 0; meteors = []; meteorIn = CC.rand(3, 7);
  kinds.forEach(function (k, i) {
    const z = SCENE_SIZE[k], size = z.r > 1 ? z.r * (k === 'nebula' ? 1.7 : 2.2) : 70;
    scenery.push({ k: k, x: (i + 0.5) * g.W / kinds.length + CC.rand(-50, 50), y: CC.rand(20, g.H - 160), v: z.v, m: size, pal: (level + i) % 4 });
  });
  twinkles = []; for (let i = 0; i < 7; i++) twinkles.push({ x: CC.rand(30, g.W - 30), y: CC.rand(70, 330), r: CC.rand(4, 8) });
}
/* +1 life (never more than the hearts at the top), with a little floating note */
function addLife(g, x, y, text) {
  if (lives >= BLASTER_LIVES) return false;
  lives++; CC.sfx.pickup(); pops.push({ x: x, y: y, t: 0, text: text });
  g.particles.burst(x, y, ['#ff6b86', '#ffd0dc', '#ffffff'], 14, { speed: 160, size: 5, grav: 0 });
  return true;
}
/* popping two or more things with ONE shot (or one burst) is a double pop: it can win a life */
function doublePop(g, x, y) {
  if (bonusCd <= 0 && addLife(g, x, y - 20, '+❤ Double!')) bonusCd = BONUS_LIFE_GAP; else pops.push({ x: x, y: y - 20, t: 0, text: 'Double!' });
}
function ownedList() { return SP.GUN_ORDER.filter(function (k) { return owned[k] > 0; }); }
function setGun(k) { if (!(owned[k] > 0) || k === weapon) return; weapon = k; CC.sfx.clink(); ship.sy = 1.12; ship.sx = 1.08; }
function switchGun(dir) { const l = ownedList(); if (l.length < 2) return; setGun(l[(l.indexOf(weapon) + dir + l.length) % l.length]); }
function fire() {
  const y = SHIP_Y - 30;
  if (weapon === 'spread') [-0.28, 0, 0.28].forEach(function (a) { shots.push({ x: ship.x + a * 40, y: y, vx: Math.sin(a) * 560, vy: -Math.cos(a) * 560, kind: 'spread', pierce: 1 }); });
  else if (weapon === 'laser') shots.push({ x: ship.x, y: y, vx: 0, vy: -1000, kind: 'laser', pierce: 99, hit: [] });
  else if (weapon === 'homing') [-1, 1].forEach(function (d) { shots.push({ x: ship.x + d * 26, y: y + 8, vx: d * 70, vy: -300, kind: 'homing', pierce: 1 }); });
  else if (weapon === 'big') shots.push({ x: ship.x, y: y - 6, vx: 0, vy: -330, kind: 'big', pierce: 1, blast: true });
  else if (weapon === 'fire') for (let i = 0; i < 3; i++) { const a = (Math.random() - 0.5) * 0.5; shots.push({ x: ship.x + (i - 1) * 10, y: y + 6, vx: Math.sin(a) * 430, vy: -Math.cos(a) * 430, kind: 'fire', pierce: 99, hit: [], life: FIRE_LIFE }); }
  else shots.push({ x: ship.x, y: y, vx: 0, vy: -560, kind: weapon, pierce: 1 });
  CC.sfx.shoot(weapon === 'laser' ? 'rapid' : weapon === 'homing' || weapon === 'fire' ? 'spread' : weapon); ship.sy = 1.15; ship.sx = 0.92;
}
function addEnemy(type, x, y) {
  const d = ENEMIES[type], hp = type === 'rock' ? lv.rockHp : d.hp;
  enemies.push({ type: type, x: x, bx: x, y: y, hp: hp, maxHp: hp, ph: Math.random() * 6, hit: 0, v: Math.random() < 0.5 ? 0 : 1 });
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
  g.particles.burst(e.x, e.y, e.type === 'jelly' ? ['#b6fff0', '#2fbfb0', '#ffffff'] : e.type === 'comet' ? ['#ffe08a', '#ff8a3d', '#ffffff'] : e.type === 'zig' ? ['#b8fff0', '#2fbfa0', '#fff'] : e.type === 'saucer' ? ['#ffd8f4', '#c050c0', '#ffffff'] : ['#d3b4a0', '#8a6a7e', '#ffffff'], 14 + d.r / 3, { speed: 190, size: 6 });
  CC.sfx.pop();
  if (e.type === 'splitter') { addEnemy('comet', e.x - 20, e.y); addEnemy('comet', e.x + 20, e.y); enemies[enemies.length - 2].bx = e.x - 20; enemies[enemies.length - 1].bx = e.x + 20; }
  resolved++;
}
function pickUp(g, c) {
  owned[c.kind] = BLASTER_WEAPON_SECONDS; weapon = c.kind; CC.sfx.pickup();
  g.particles.burst(c.x, c.y, [SP.WEAPON_COLORS[c.kind], '#ffffff'], 16, { speed: 170, size: 5, grav: 0 });
  ship.sy = 1.2; ship.sx = 1.1;
}
/* the box a shot hits with */
function shotBox(s) {
  if (s.kind === 'laser') return { x: s.x - 5, y: s.y - 30, w: 10, h: 60 };
  if (s.kind === 'big') return { x: s.x - 13, y: s.y - 13, w: 26, h: 26 };
  if (s.kind === 'fire') return { x: s.x - 11, y: s.y - 11, w: 22, h: 22 };
  if (s.kind === 'homing') return { x: s.x - 9, y: s.y - 10, w: 18, h: 20 };
  return { x: s.x - 6, y: s.y - 8, w: 12, h: 16 };
}
/* a Seeker Star turns towards the nearest enemy (or the boss); with nothing to chase it curves back to straight up */
function steer(s, dt) {
  let best = null, bd = 1e9;
  enemies.forEach(function (e) { if (e.y > 0 && e.y < s.y + 20) { const d = Math.hypot(e.x - s.x, e.y - s.y); if (d < bd) { bd = d; best = e; } } });
  if (boss && boss.dying <= 0 && boss.y > 0) { const d = Math.hypot(boss.x - s.x, boss.y - s.y); if (d < bd) { bd = d; best = boss; } }
  const cur = Math.atan2(s.vy, s.vx), want = best ? Math.atan2(best.y - s.y, best.x - s.x) : -Math.PI / 2;
  let diff = want - cur; while (diff > Math.PI) diff -= 2 * Math.PI; while (diff < -Math.PI) diff += 2 * Math.PI;
  const na = cur + CC.clamp(diff, -5.5 * dt, 5.5 * dt);
  s.vx = Math.cos(na) * 430; s.vy = Math.sin(na) * 430;
}
function hitBoss(g, dmg) {
  boss.hp -= dmg; boss.hit = 0.1; CC.sfx.clink();
  if (boss.hp <= 0) { boss.hp = 0; boss.dying = 1.6; enemies = []; CC.sfx.pop(); }
}
function bossBox() { return lv.boss.kind === 3 ? CC.shrink(boss.x - 105, boss.y - 62, 210, 110, 8) : CC.shrink(boss.x - 80, boss.y - 70, 160, 130, 8); }
/* a Plasma Ball bursts: every enemy close by loses 2 hit points, and the boss loses 6 */
function doBlasts(g) {
  while (blasts.length) {
    const b = blasts.pop(); rings.push({ x: b.x, y: b.y, t: 0 }); CC.sfx.pop(); let kills = 0;
    g.particles.burst(b.x, b.y, ['#d68bff', '#ffffff', '#ffe0ff'], 26, { speed: 250, size: 7 });
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (Math.hypot(e.x - b.x, e.y - b.y) < BLAST_RADIUS + ENEMIES[e.type].r) { e.hp -= 2; e.hit = 0.12; if (e.hp <= 0) { popEnemy(g, e); enemies.splice(i, 1); kills++; } }
    }
    if (kills >= 2) doublePop(g, b.x, b.y);
    if (boss && boss.dying <= 0 && Math.hypot(boss.x - b.x, boss.y - b.y) < BLAST_RADIUS + 85) hitBoss(g, 6);
  }
}
function update(g, dt) {
  const dir = (CC.held.ArrowRight ? 1 : 0) - (CC.held.ArrowLeft ? 1 : 0);
  ship.x = CC.clamp(ship.x + dir * SHIP_SPEED * (1 + (lv.speedMul - 0.9) * SHIP_SPEED_GAIN) * dt, 36, g.W - 36);
  ship.sx += (1 - ship.sx) * Math.min(1, dt * 10); ship.sy += (1 - ship.sy) * Math.min(1, dt * 10);
  fireCd -= dt;
  if ((CC.held.Space || wantFire) && fireCd <= 0) { fire(); fireCd = FIRE_DELAY[weapon]; }
  wantFire = false;
  if (weapon !== 'normal') {                       // a picked-up gun only runs down while it is the one in use
    owned[weapon] -= dt;
    if (owned[weapon] <= 0) { owned[weapon] = 0; const l = ownedList(); weapon = l[l.length - 1]; CC.sfx.clink(); }
  }
  if (invincible > 0) invincible -= dt;
  if (bonusCd > 0) bonusCd -= dt;
  if (bossAnn > 0) bossAnn -= dt;
  for (let i = pops.length - 1; i >= 0; i--) { pops[i].t += dt; if (pops[i].t > 1.2) pops.splice(i, 1); }
  for (let i = rings.length - 1; i >= 0; i--) { rings[i].t += dt; if (rings[i].t > 0.4) rings.splice(i, 1); }
  // spawning
  spawnIn -= dt;
  if (spawned < lv.count && spawnIn <= 0) {
    spawnEnemy(g); spawnIn = CC.rand(lv.gap[0], lv.gap[1]);
    if (spawned % HEART_EVERY === HEART_EVERY - 1 && lives < BLASTER_LIVES) hearts.push({ x: CC.rand(80, g.W - 80), y: -30, t: 0 });
    if (spawned % 5 === 3) capsules.push({ x: CC.rand(80, g.W - 80), y: -30, kind: CAPS[capCount++ % Math.min(CAPS.length, 3 + Math.floor(g.level / 2))], t: 0 });   // new guns arrive as the levels go on
  }
  if (lv.boss && !boss && spawned >= lv.count && enemies.length === 0) {
    boss = { x: g.W / 2, y: -120, hp: lv.boss.hp, maxHp: lv.boss.hp, t: 0, hit: 0, drop: 2, dying: 0 }; bossAnn = 2.2; if (lives <= 3) hearts.push({ x: CC.rand(120, g.W - 120), y: -30, t: 0 }); CC.sfx.warn(); CC.music.play('blasterBoss', { transpose: MUSIC_KEY[g.level % 4] });
  }
  // shots
  for (const s of shots) {
    if (s.kind === 'homing') steer(s, dt);
    s.x += s.vx * dt; s.y += s.vy * dt; if (s.life !== undefined) s.life -= dt;
  }
  shots = shots.filter(function (s) { return s.y > -70 && s.x > -30 && s.x < g.W + 30 && !(s.life !== undefined && s.life <= 0); });
  // capsules
  for (let i = capsules.length - 1; i >= 0; i--) {
    const c = capsules[i]; c.t += dt; c.y += 48 * dt; c.x += Math.sin(c.t * 1.5) * 20 * dt;
    const box = { x: c.x - 24, y: c.y - 16, w: 48, h: 32 };
    let got = CC.overlap(box, { x: ship.x - 24, y: SHIP_Y - 30, w: 48, h: 60 });
    for (let j = shots.length - 1; j >= 0 && !got; j--) if (CC.overlap(box, { x: shots[j].x - 6, y: shots[j].y - 8, w: 12, h: 16 })) { got = true; if (shots[j].kind !== 'laser' && shots[j].kind !== 'fire') shots.splice(j, 1); }
    if (got) { pickUp(g, c); capsules.splice(i, 1); } else if (c.y > g.H + 40) capsules.splice(i, 1);
  }
  // falling hearts: fly into one to win a life
  for (let i = hearts.length - 1; i >= 0; i--) {
    const h = hearts[i]; h.t += dt; h.y += 62 * dt; h.x += Math.sin(h.t * 1.8) * 22 * dt;
    if (CC.overlap({ x: h.x - 26, y: h.y - 26, w: 52, h: 52 }, { x: ship.x - 28, y: SHIP_Y - 32, w: 56, h: 64 })) { if (!addLife(g, h.x, h.y, '+❤')) pops.push({ x: h.x, y: h.y, t: 0, text: '❤' }); hearts.splice(i, 1); ship.sy = 1.15; }
    else if (h.y > g.H + 40) hearts.splice(i, 1);
  }
  // enemies
  const shipBox = CC.shrink(ship.x - 22, SHIP_Y - 30, 44, 56, BLASTER_HITBOX_PAD);
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i], d = ENEMIES[e.type];
    e.y += d.speed * lv.speedMul * dt * (e.type === 'comet' && e.bx !== e.x ? 1.2 : 1); e.ph += dt;
    if (d.drift) e.x = CC.clamp(e.bx + Math.sin(e.ph * (e.type === 'zig' ? 2.6 : e.type === 'saucer' ? 1.1 : 1.6)) * d.drift, d.r, g.W - d.r);
    if (e.hit > 0) e.hit -= dt;
    const box = CC.shrink(e.x - d.r, e.y - d.r, d.r * 2, d.r * 2, Math.max(BLASTER_HITBOX_PAD, 4));
    let dead = false;
    for (let j = shots.length - 1; j >= 0; j--) {
      const s = shots[j]; if (s.hit && s.hit.indexOf(e) >= 0) continue;
      if (CC.overlap(box, shotBox(s))) {
        if (s.blast) { blasts.push({ x: s.x, y: s.y }); shots.splice(j, 1); continue; }
        if (s.hit) s.hit.push(e); else shots.splice(j, 1);
        e.hp--; e.hit = 0.12;
        if (e.hp <= 0) { popEnemy(g, e); dead = true; s.kills = (s.kills || 0) + 1; if (s.kills === 2) doublePop(g, e.x, e.y); break; } else CC.sfx.clink();
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
        boss.x = g.W / 2 + Math.sin(boss.t * (boss.hp < boss.maxHp * 0.5 ? 1.1 : 0.7)) * (g.W / 2 - (lv.boss.kind === 3 ? 140 : 110));
        boss.drop -= dt;
        if (boss.drop <= 0) { addEnemy(boss.hp < boss.maxHp * 0.5 ? 'zig' : 'comet', boss.x, boss.y + 70); spawned++; boss.drop = boss.hp < boss.maxHp * 0.5 ? 1.3 : 1.9; CC.sfx.warn(); }
      }
      const bb = bossBox();
      for (let j = shots.length - 1; j >= 0; j--) {
        const s = shots[j]; if (s.kind !== 'laser' && s.hit && s.hit.indexOf(boss) >= 0) continue;
        if (CC.overlap(bb, shotBox(s))) {
          if (s.blast) { blasts.push({ x: s.x, y: s.y }); shots.splice(j, 1); continue; }
          if (s.kind !== 'laser') { if (s.hit) s.hit.push(boss); else shots.splice(j, 1); }
          hitBoss(g, BOSS_DAMAGE[s.kind] || 1); if (boss.hp <= 0) break;
        }
      }
    }
  }
  if (blasts.length) doBlasts(g);
  if (!lv.boss && spawned >= lv.count && enemies.length === 0) { capsules = []; g.stars = lives >= 4 ? 3 : lives >= 2 ? 2 : 1; g.complete(); }
}
function hrr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
/* the sky: stars, then the slow things floating in it (a nebula, a ringed planet, a moon, a satellite, an astronaut ...) */
function drawSky(g, c) {
  const W = g.W, H = g.H, step = g.state === 'play' ? Math.min(0.1, Math.max(0, g.t - sceneT)) : 0; sceneT = g.t;
  scenery.forEach(function (it) {
    it.y += it.v * step; if (it.y > H + it.m) { it.y = -it.m; it.x = CC.rand(70, W - 70); }
    if (it.k === 'nebula') SP.nebula(c, it.x, it.y, 150, NEBULA_COLORS[it.pal][0], NEBULA_COLORS[it.pal][1]);
    else if (it.k === 'galaxy') SP.galaxy(c, it.x, it.y, SCENE_SIZE.galaxy.r, g.t, it.pal % 2 ? '210,230,255' : '255,200,255');
    else if (it.k === 'ringed') SP.ringedPlanet(c, it.x, it.y, SCENE_SIZE.ringed.r, g.t, RING_COLORS[it.pal]);
    else if (it.k === 'moon') SP.moon(c, it.x, it.y, SCENE_SIZE.moon.r, g.t);
    else if (it.k === 'satellite') SP.satellite(c, it.x, it.y, SCENE_SIZE.satellite.r, g.t);
    else if (it.k === 'station') SP.station(c, it.x, it.y, SCENE_SIZE.station.r, g.t);
    else if (it.k === 'astronaut') SP.astronaut(c, it.x, it.y, SCENE_SIZE.astronaut.r, g.t);
  });
  twinkles.forEach(function (tw) { SP.twinkle(c, tw.x, tw.y, tw.r, g.t); });
  if (step > 0) { meteorIn -= step; if (meteorIn <= 0) { const right = Math.random() < 0.5; meteors.push({ x: right ? CC.rand(W * 0.4, W) : CC.rand(0, W * 0.6), y: -10, dx: right ? -1 : 1, t: 0 }); meteorIn = CC.rand(6, 12); } }
  for (let i = meteors.length - 1; i >= 0; i--) {
    const m = meteors[i]; m.t += step; m.x += m.dx * 380 * step; m.y += 300 * step;
    SP.shootingStar(c, m.x, m.y, 110, m.dx < 0 ? Math.PI - 0.66 : 0.66);
    if (m.y > H + 20 || m.x < -120 || m.x > W + 120) meteors.splice(i, 1);
  }
}
function draw(g) {
  const c = g.ctx, W = g.W, H = g.H, sky = SKY[g.level % SKY.length];
  const bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, sky[0]); bg.addColorStop(1, sky[1]);
  c.fillStyle = bg; c.fillRect(0, 0, W, H);
  for (const s of stars) { if (g.state === 'play') s.y = (s.y + s.s * 0.25) % H; c.globalAlpha = 0.4 + 0.3 * Math.sin(g.t * 0.7 + s.x); c.fillStyle = '#fff'; c.fillRect(s.x, s.y, s.s + 0.5, s.s + 0.5); }
  c.globalAlpha = 1;
  drawSky(g, c);
  // little home planet along the bottom (this is what we protect)
  c.fillStyle = '#2f8f8f'; c.beginPath(); c.ellipse(W / 2, H + 230, W * 0.85, 280, 0, 0, 6.283); c.fill();
  c.fillStyle = '#5fd3c4'; c.beginPath(); c.ellipse(W / 2, H + 238, W * 0.85, 280, 0, Math.PI * 1.02, Math.PI * 1.98); c.lineWidth = 6; c.strokeStyle = '#8be8d8'; c.stroke();
  [[120, 428], [300, 421], [520, 421], [690, 428]].forEach(function (p) {
    c.fillStyle = '#ffe9a8'; c.fillRect(p[0] - 9, p[1] - 6, 18, 14); c.fillStyle = '#ff7a8a'; c.beginPath(); c.moveTo(p[0] - 12, p[1] - 6); c.lineTo(p[0], p[1] - 18); c.lineTo(p[0] + 12, p[1] - 6); c.fill();
  });
  CC.drawKeys(c, W, H, ['ArrowLeft', 'ArrowRight', 'Space']);   // behind the ship so it never covers it
  for (const cp of capsules) SP.capsule(c, cp.x, cp.y, cp.kind, cp.t);
  for (const h of hearts) SP.heartPickup(c, h.x, h.y, h.t);
  if (boss) {
    c.globalAlpha = boss.dying > 0 ? 0.6 + 0.4 * Math.sin(boss.t * 20) * 0.5 : 1;
    if (lv.boss.kind === 3) SP.mothership(c, boss.x, boss.y, boss.t, boss.hp / boss.maxHp, boss.hit > 0); else SP.megaBoss(c, boss.x, boss.y, boss.t, boss.hp / boss.maxHp, boss.hit > 0, lv.boss.kind);
    c.globalAlpha = 1;
  }
  for (const e of enemies) {
    const d = ENEMIES[e.type]; c.globalAlpha = e.hit > 0 ? 0.7 : 1;
    if (e.type === 'rock') SP.rockBig(c, e.x, e.y, d.r, g.t + e.ph, e.hp < e.maxHp);
    else if (e.type === 'comet') SP.comet(c, e.x, e.y, d.r, g.t);
    else if (e.type === 'zig') SP.zig(c, e.x, e.y, d.r, g.t + e.ph);
    else if (e.type === 'saucer') SP.saucer(c, e.x, e.y, d.r, g.t + e.ph, e.v);
    else if (e.type === 'splitter') SP.splitter(c, e.x, e.y, d.r, g.t + e.ph);
    else SP.jelly(c, e.x, e.y, d.r, g.t + e.ph);
    c.globalAlpha = 1;
  }
  for (const s of shots) {
    if (s.kind === 'fire') { const u = 1 - s.life / FIRE_LIFE; c.save(); c.globalAlpha = Math.max(0, 1 - u * 0.9); c.translate(s.x, s.y); c.scale(1 + u * 1.3, 1 + u * 1.3); SP.bullet(c, 0, 0, 'fire', -Math.PI / 2, g.t); c.restore(); continue; }
    if (s.kind === 'homing') for (let k = 1; k <= 3; k++) { c.globalAlpha = 0.4 / k; c.fillStyle = '#ff9fc8'; c.beginPath(); c.arc(s.x - s.vx * 0.022 * k, s.y - s.vy * 0.022 * k, 5 - k, 0, 6.283); c.fill(); }
    c.globalAlpha = 1; SP.bullet(c, s.x, s.y, s.kind, s.kind === 'spread' ? Math.atan2(s.vy, s.vx) : -Math.PI / 2, g.t);
  }
  for (const r of rings) { const u = r.t / 0.4; c.globalAlpha = 1 - u; c.strokeStyle = '#d68bff'; c.lineWidth = 6; c.beginPath(); c.arc(r.x, r.y, 14 + u * BLAST_RADIUS, 0, 6.283); c.stroke(); c.fillStyle = 'rgba(214,139,255,.3)'; c.beginPath(); c.arc(r.x, r.y, 10 + u * (BLAST_RADIUS - 6), 0, 6.283); c.fill(); }
  c.globalAlpha = invincible > 0 ? 0.6 + 0.2 * Math.sin(g.t * 8) : 1;
  SP.ship(c, ship.x, SHIP_Y, weapon, g.t, ship);
  c.globalAlpha = 1;
  g.particles.draw(c);
  for (const p of pops) { c.globalAlpha = Math.min(1, (1.2 - p.t) * 2); CC.outlineText(c, p.text, p.x, p.y - p.t * 40, 24, '#ff8fb0', 'center'); } c.globalAlpha = 1;
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
  const mine = ownedList();
  c.save(); c.translate(32, 74); c.scale(0.78, 0.78); SP.gunRack(c, 0, 0, mine, weapon, weapon === 'normal' ? 1 : owned[weapon] / BLASTER_WEAPON_SECONDS); c.restore();   // the row of guns, small, under the level badge
  if (mine.length > 1) CC.outlineText(c, '↑ ↓', 232, 81, 18, '#ffd23f');
  if (bossAnn > 0) { c.globalAlpha = Math.min(1, bossAnn); c.font = '60px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#fff'; c.fillText('👾❗', W / 2, 190); c.globalAlpha = 1; }
}
function onKeyDown(g, e) {
  if (e.code === 'Space' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') e.preventDefault();
  if (g.state !== 'play') return;
  if (e.code === 'ArrowUp' || e.code === 'ArrowDown') { e.preventDefault(); if (!e.repeat) switchGun(e.code === 'ArrowUp' ? 1 : -1); return; }
  const m = /^(?:Digit|Numpad)([1-7])$/.exec(e.code); if (m && !e.repeat) { setGun(SP.GUN_ORDER[+m[1] - 1]); return; }
  if (!e.repeat && e.code === 'Space') wantFire = true;
}
CC.modes.blaster = CC.makeLevelGame({
  reward: 'blaster',
  stageId: 'stage-blaster', title: 'Level', emoji: '🚀', total: BLASTER_LEVELS.length,
  levelIcon: function (i) { return BLASTER_LEVELS[i].boss ? '👾' : '🚀'; },
  controls: [{ keys: ['←', '→'], icon: '🚀' }, { keys: ['Space'], icon: '💥' }, { keys: ['↑', '↓'], icon: '🔫' }],
  reset: reset, update: update, draw: draw, onKeyDown: onKeyDown
});
CC.modes.blaster._debug = function () { return { ship: ship, enemies: enemies, shots: shots, capsules: capsules, hearts: hearts, lives: lives, weapon: weapon, owned: owned, resolved: resolved, spawned: spawned, lv: lv, boss: boss }; };
CC.modes.blaster._levels = BLASTER_LEVELS;
})();
