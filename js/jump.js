/* jump.js - Jump Over! (both sessions). Space/Up = jump, Down = duck. 12 levels, new obstacles every few levels. */
(function () {
'use strict';

/* =============== TEACHER SETTINGS - easy numbers to nudge =============== */
const JUMP_LIVES = 7;                  // hearts at the start of every level
const JUMP_INVINCIBLE_SECONDS = 1.2;   // safe time right after a bump
const JUMP_HITBOX_PAD = 10;            // pixels shaved off every side of hero & obstacle boxes (bigger = more forgiving)
const JUMP_STOMP_SLACK = 26;           // landing on top of a bush/rock/stump/wall just bounces you (set 0 to turn off)
const JUMP_BUFFER_SECONDS = 0.18;      // a jump pressed this early before landing still counts
const JUMP_GRAVITY = 1900;             // lower = floatier jumps
const JUMP_POWER = 800;                // higher = taller jumps
/* One line per level: speed = how fast things come (pixels/second), count = how many obstacle groups,
   gap = [min,max] seconds between groups (bigger = easier), theme = which scenery (see THEMES in sprites_world.js).
   Which obstacles show up is decided by PATTERNS below: each pattern has a first level (min) and a weight (how common). */
const JUMP_LEVELS = [
  { speed: 200, count: 10, gap: [2.8, 3.4], theme: 0 },
  { speed: 215, count: 12, gap: [2.6, 3.2], theme: 1 },
  { speed: 230, count: 14, gap: [2.4, 3.0], theme: 2 },
  { speed: 245, count: 16, gap: [2.3, 2.9], theme: 3 },
  { speed: 260, count: 18, gap: [2.2, 2.8], theme: 5 },
  { speed: 275, count: 20, gap: [2.1, 2.7], theme: 4 },
  { speed: 290, count: 22, gap: [2.0, 2.6], theme: 6 },
  { speed: 305, count: 24, gap: [1.9, 2.5], theme: 7 },
  { speed: 315, count: 26, gap: [1.8, 2.4], theme: 8 },
  { speed: 325, count: 28, gap: [1.7, 2.3], theme: 9 },
  { speed: 335, count: 30, gap: [1.6, 2.2], theme: 10 },
  { speed: 345, count: 32, gap: [1.5, 2.1], theme: 12 }
];
/* Each pattern = list of [obstacle, pixels-after-the-first]. min = first level it can appear in (0 = level 1). */
const PATTERNS = [
  { min: 0, w: 5, parts: [['bush', 0]] },
  { min: 1, w: 4, parts: [['rock', 0]] },
  { min: 1, w: 3, parts: [['bush', 0], ['rock', 70]] },                       // two close together: one long jump
  { min: 2, w: 3, parts: [['bee', 0]] },                                      // duck!
  { min: 3, w: 3, parts: [['stump', 0]] },
  { min: 3, w: 3, parts: [['bush', 0], ['rock', 230]] },                      // two jumps in a row
  { min: 4, w: 3, parts: [['ball', 0]] },                                     // fast rolling ball
  { min: 5, w: 3, parts: [['pit', 0]] },                                      // gap in the ground
  { min: 6, w: 3, parts: [['swing', 0]] },                                    // duck under the swing
  { min: 7, w: 2, parts: [['wall', 0]] },
  { min: 7, w: 2, parts: [['rock', 0], ['stump', 110]] },
  { min: 8, w: 3, parts: [['bee', 0], ['bush', 260]] },                       // duck, then jump
  { min: 9, w: 2, parts: [['swing', 0], ['pit', 290]] },
  { min: 10, w: 2, parts: [['ball', 0], ['rock', 320]] },
  { min: 11, w: 2, parts: [['bush', 0], ['rock', 230], ['bush', 460]] }
];
/* ======================================================================= */

const GROUND = 370, HERO_X = 150, SP = CC.sprites;
const SIZES = Object.assign({ pit: { w: 130, h: 14 } }, SP.JUMP_OBSTACLES);
const BEE_HEIGHT = 46, SWING_BOTTOM = 56, STOMPABLE = { bush: 1, rock: 1, stump: 1, wall: 1 };
let landedAge = 9, hero, obstacles, coins, lives, invincible, scroll, spawnIn, spawned, passed, lv, jumpBuffer, wasAir, hurtT, got, stars;

function reset(g, level) {
  lv = JUMP_LEVELS[level]; CC.music.play('jump', { tempo: 1 + level * 0.03 });
  hero = { h: 0, vy: 0, sx: 1, sy: 1, duck: false };
  obstacles = []; coins = []; lives = JUMP_LIVES; invincible = 0; scroll = 0; spawnIn = 1.6; spawned = 0; passed = 0; jumpBuffer = 0; wasAir = false; hurtT = 0; got = 0;
}
function doJump() { hero.vy = JUMP_POWER; hero.sx = 0.82; hero.sy = 1.25; CC.sfx.jump(); }
function heroBox() {
  const sprite = { x: HERO_X - 25, y: GROUND - hero.h - (hero.duck ? 40 : 62), w: 50, h: hero.duck ? 40 : 62 };
  return CC.shrink(sprite.x, sprite.y, sprite.w, sprite.h, JUMP_HITBOX_PAD);
}
function obstacleBox(o) {
  const s = SIZES[o.kind];
  if (o.kind === 'bee') return CC.shrink(o.x - s.w / 2, GROUND - BEE_HEIGHT - s.h / 2, s.w, s.h, JUMP_HITBOX_PAD);
  if (o.kind === 'swing') return CC.shrink(o.x - s.w / 2, GROUND - SWING_BOTTOM - s.h, s.w, s.h, JUMP_HITBOX_PAD);
  if (o.kind === 'pit') return { x: o.x - s.w / 2 + 14, y: GROUND - s.h, w: s.w - 28, h: s.h };
  return CC.shrink(o.x - s.w / 2, GROUND - s.h, s.w, s.h, JUMP_HITBOX_PAD);
}
function speedOf(o) { return lv.speed * (o.kind === 'ball' ? 1.45 : 1); }
function spawnPattern(g, level) {
  const avail = PATTERNS.filter(function (p) { return p.min <= level; });
  let tot = 0; avail.forEach(function (p) { tot += p.w; }); let q = Math.random() * tot, pat = avail[0];
  for (const p of avail) { q -= p.w; if (q <= 0) { pat = p; break; } }
  const x0 = g.W + 80;
  pat.parts.forEach(function (part) {
    const kind = part[0], x = x0 + part[1];
    obstacles.push({ kind: kind, x: x, hit: false, counted: false });
    // a little arc of stars above things you jump over
    if (STOMPABLE[kind] || kind === 'pit' || kind === 'ball') {
      const top = kind === 'pit' ? 20 : SIZES[kind].h;
      for (let i = -1; i <= 1; i++) coins.push({ x: x + i * 46, y: GROUND - top - 48 - (i === 0 ? 34 : 14), taken: false });
    }
  });
  spawned++;
}
function update(g, dt) {
  const level = g.level;
  scroll += lv.speed * dt;
  hero.duck = !!CC.held.ArrowDown && hero.h <= 0;
  if (jumpBuffer > 0) jumpBuffer -= dt;
  if (jumpBuffer > 0 && hero.h <= 0) { doJump(); jumpBuffer = 0; }
  if (hero.h > 0 || hero.vy > 0) {
    hero.vy -= JUMP_GRAVITY * dt; hero.h += hero.vy * dt;
    if (hero.h <= 0) { hero.h = 0; hero.vy = 0; landedAge = 0; hero.sx = 1.22; hero.sy = 0.78; if (wasAir) g.particles.burst(HERO_X, GROUND, '#ffffffaa', 5, { speed: 70, size: 4, grav: 0, life: .35 }); }
  }
  wasAir = hero.h > 0; landedAge += dt;
  hero.sx += (1 - hero.sx) * Math.min(1, dt * 12); hero.sy += (1 - hero.sy) * Math.min(1, dt * 12);
  spawnIn -= dt;
  if (spawned < lv.count && spawnIn <= 0) { spawnPattern(g, level); spawnIn = CC.rand(lv.gap[0], lv.gap[1]); }
  if (invincible > 0) invincible -= dt;
  if (hurtT > 0) hurtT -= dt;
  const hb = heroBox();
  for (const o of obstacles) {
    o.x -= speedOf(o) * dt;
    if (!o.hit && STOMPABLE[o.kind] && (hero.vy < 0 || landedAge < 0.12) && CC.overlap(hb, obstacleBox(o))) {
      const top = SIZES[o.kind].h - JUMP_HITBOX_PAD;       // landing on top of it: bounce instead of a bump
      if (hero.h + JUMP_HITBOX_PAD >= top - JUMP_STOMP_SLACK) {
        hero.vy = JUMP_POWER * 0.75; hero.h = Math.max(hero.h, top - JUMP_HITBOX_PAD + 3); landedAge = 9; hero.sx = 0.8; hero.sy = 1.25; CC.sfx.jump();
        g.particles.burst(o.x, GROUND - SIZES[o.kind].h, ['#ffffff', '#ffd23f'], 6, { speed: 110, size: 4, up: 60, life: .4 });
        continue;
      }
    }
    if (!o.hit && invincible <= 0 && CC.overlap(hb, obstacleBox(o))) {
      o.hit = true; lives--; invincible = JUMP_INVINCIBLE_SECONDS; hurtT = 0.5; hero.sx = 1.3; hero.sy = 0.7; CC.sfx.bump();
      g.particles.burst(HERO_X, GROUND - 30, ['#ffd23f', '#ffffff', '#ff9aa8'], 10, { speed: 150, size: 5, up: 100, life: .6 });
      if (lives <= 0) { lives = 0; g.stars = 1; g.over(); return; }
    }
    if (!o.counted && o.x < HERO_X - 40) { o.counted = true; passed++; }
  }
  obstacles = obstacles.filter(function (o) { return o.x > -120; });
  for (const c of coins) {
    c.x -= lv.speed * dt;
    if (!c.taken && Math.abs(c.x - HERO_X) < 30 && Math.abs(c.y - (GROUND - hero.h - (hero.duck ? 20 : 32))) < 44) { c.taken = true; got++; CC.sfx.tick(); g.particles.burst(c.x, c.y, ['#ffd23f', '#fff'], 6, { speed: 90, size: 4, grav: 0, life: .4 }); }
  }
  coins = coins.filter(function (c) { return c.x > -40 && !c.taken; });
  if (spawned >= lv.count && obstacles.length === 0) { g.stars = lives >= 5 ? 3 : lives >= 3 ? 2 : 1; g.complete(); }
}
function draw(g) {
  const c = g.ctx, W = g.W, H = g.H;
  SP.world(c, W, H, GROUND, scroll, lv.theme, g.t);
  // ground, with real gaps where the pits are
  const pits = obstacles.filter(function (o) { return o.kind === 'pit'; }).map(function (o) { return [o.x - SIZES.pit.w / 2, o.x + SIZES.pit.w / 2]; }).sort(function (a, b) { return a[0] - b[0]; });
  let x = 0;
  pits.forEach(function (p) { if (p[0] > x) SP.ground(c, lv.theme, x, Math.min(W, p[0]), GROUND, H); SP.pit(c, lv.theme, Math.max(0, p[0]), Math.min(W, p[1]), GROUND, H, g.t); x = Math.max(x, p[1]); });
  if (x < W) SP.ground(c, lv.theme, x, W, GROUND, H);
  c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(HERO_X, GROUND + 4, 30 - hero.h * 0.08, 7, 0, 0, 6.283); c.fill();
  for (const k of coins) SP.coin(c, k.x, k.y, g.t);
  for (const o of obstacles) {
    c.globalAlpha = o.hit ? 0.35 : 1;
    if (o.kind === 'bee') SP.bee(c, o.x, GROUND - BEE_HEIGHT, g.t);
    else if (o.kind === 'ball') SP.ball(c, o.x, GROUND, g.t);
    else if (o.kind === 'swing') SP.swing(c, o.x, GROUND - SWING_BOTTOM, g.t);
    else if (o.kind === 'wall') SP.wall(c, o.x, GROUND, g.t);
    else if (o.kind !== 'pit') SP.drawJumpObstacle(c, o.kind, o.x, GROUND, g.t);
    c.globalAlpha = 1;
  }
  c.globalAlpha = invincible > 0 ? 0.6 + 0.2 * Math.sin(g.t * 8) : 1;
  SP.runner(c, HERO_X, GROUND - hero.h, { t: g.t, air: hero.h > 0, duck: hero.duck, sx: hero.sx, sy: hero.sy, hurt: hurtT > 0 });
  c.globalAlpha = 1;
  g.particles.draw(c);
  // HUD: pictures and numbers only
  const th = SP.THEMES[lv.theme];
  c.fillStyle = 'rgba(26,27,63,.55)'; hrr(c, 12, 10, 92, 44, 14); c.fill();
  c.font = '26px sans-serif'; c.textAlign = 'left'; c.fillStyle = '#fff'; c.fillText(th.icon, 20, 41);
  CC.outlineText(c, String(g.level + 1), 62, 42, 28, '#ffd23f');
  for (let i = 0; i < JUMP_LIVES; i++) SP.heart(c, W - 24 - i * 26, 28, 20, i < lives);
  const frac = lv ? Math.min(1, passed / Math.max(1, lv.count * 1.4)) : 0, bx = W / 2 - 110;
  c.fillStyle = 'rgba(26,27,63,.55)'; hrr(c, bx - 10, 12, 244, 26, 12); c.fill();
  c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(bx, 21, 220, 8); c.fillStyle = '#ffd23f'; c.fillRect(bx, 21, 220 * (spawned >= lv.count ? Math.max(frac, 0.95 * (1 - obstacles.length / 6)) : (spawned / lv.count) * 0.95), 8);
  c.font = '16px sans-serif'; c.fillStyle = '#fff'; c.fillText('🏁', bx + 224, 34);
  SP.coin(c, 36, 84, g.t); CC.outlineText(c, String(got), 56, 92, 24, '#ffd23f');
  CC.drawKeys(c, W, H, ['ArrowUp', 'ArrowDown', 'Space']);
}
function hrr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function onKeyDown(g, e) {
  if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown') e.preventDefault();
  if (e.repeat || g.state !== 'play') return;
  if (e.code === 'Space' || e.code === 'ArrowUp') jumpBuffer = JUMP_BUFFER_SECONDS;
  if (e.code === 'ArrowDown') CC.sfx.duck();
}

const game = CC.makeLevelGame({
  stageId: 'stage-jump', title: 'Level', emoji: '🏃', total: JUMP_LEVELS.length,
  levelIcon: function (i) { return SP.THEMES[JUMP_LEVELS[i].theme].icon; },
  controls: [{ keys: ['Space', '↑'], icon: '🦘' }, { keys: ['↓'], icon: '⬇️' }],
  reset: reset, update: update, draw: draw, onKeyDown: onKeyDown
});
CC.modes.jump = game;
CC.modes.jump._debug = function () { return { hero: hero, obstacles: obstacles, lives: lives, invincible: invincible, passed: passed, spawned: spawned, lv: lv, got: got, coins: coins }; };
CC.modes.jump._levels = JUMP_LEVELS; CC.modes.jump._patterns = PATTERNS;
// click / tap also jumps (nice for touch screens)
document.getElementById('stage-jump').addEventListener('pointerdown', function (e) {
  if (e.target.closest('.overlay')) return;
  const g = game.game(); if (g && g.state === 'play') jumpBuffer = JUMP_BUFFER_SECONDS;
});
})();
