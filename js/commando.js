/* commando.js - Commando Run (Session 2, Makey Makey 5 keys). A friendly run-and-gun adventure through 15 stages.
   Keys: Left/Right run, Up jump (hold Up while standing still to aim up), Down duck (or drop through a platform), Space shoot. */
(function () {
'use strict';

/* =============== TEACHER SETTINGS - easy numbers to nudge =============== */
const COMMANDO_LIVES = 6;                 // hearts per attempt (each stage also has 3 checkpoint flags, and hearts to find)
const KEY_HINT_STAGES = 3;                // the first N stages show little key pictures to teach which key to press (0 = off)
const COMMANDO_INVINCIBLE_SECONDS = 1.3;  // safe time after a bump
const COMMANDO_HITBOX_PAD = 8;            // pixels shaved off the hero & enemy "ouch" boxes (bigger = more forgiving)
const RUN_SPEED = 230;                    // hero running speed (pixels/second)
const JUMP_POWER = 740, GRAVITY = 2000;   // jump strength / gravity
const ORB_SPEED = 150;                    // enemy orb speed (slow so they can be dodged)
const TURRET_WARNING_SECONDS = 0.9;       // glow before an enemy shoots (longer = easier)
const DROP_CHANCE = 0.12;                 // chance an ordinary enemy drops a weapon capsule
const BOSS_HP_BASE = 24, BOSS_HP_PER_STAGE = 7;   // boss hit points = base + stage number x per-stage (bosses fight in 3 phases and get angrier)
/* The 7 weapons. delay = seconds between shots while holding Space, dmg = damage, pierce = how many enemies one shot passes through. */
const WEAPONS = {
  normal: { delay: 0.28, speed: 640, dmg: 1, pierce: 1, life: 1.0 },
  rapid:  { delay: 0.10, speed: 740, dmg: 1, pierce: 1, life: 0.9 },
  spread: { delay: 0.36, speed: 620, dmg: 1, pierce: 1, life: 0.8, fan: [-0.28, 0, 0.28] },
  big:    { delay: 0.50, speed: 560, dmg: 3, pierce: 3, life: 1.0 },
  laser:  { delay: 0.22, speed: 1100, dmg: 1, pierce: 99, life: 0.6 },
  homing: { delay: 0.40, speed: 480, dmg: 2, pierce: 1, life: 1.7, homing: true },
  fire:   { delay: 0.13, speed: 470, dmg: 1, pierce: 2, life: 0.5 }
};
/* The 15 stages. theme = scenery (see THEMES in sprites_world.js), len = stage length in pixels (longer = longer stage),
   d = how busy/tricky it is (0.25 = busy but playable from the very start ... 1 = hardest), boss = which big creature waits at the end, pal = its colours. */
const COMMANDO_LEVELS = [
  { theme: 0, len: 8400, d: 0.25, boss: 'lion',     pal: 'lion' },
  { theme: 1, len: 9100, d: 0.30, boss: 'octopus',  pal: 'octopus' },
  { theme: 2, len: 9800, d: 0.36, boss: 'scorpion', pal: 'scorpion' },
  { theme: 3, len: 10600, d: 0.41, boss: 'yeti',     pal: 'yeti' },
  { theme: 4, len: 11300, d: 0.46, boss: 'dragon',   pal: 'dragon' },
  { theme: 5, len: 12000, d: 0.52, boss: 'gorilla',  pal: 'gorilla' },
  { theme: 6, len: 12600, d: 0.57, boss: 'spider',   pal: 'spider' },
  { theme: 7, len: 13200, d: 0.63, boss: 'robot',    pal: 'robot' },
  { theme: 8, len: 13800, d: 0.68, boss: 'eagle',    pal: 'eagle' },
  { theme: 9, len: 14400, d: 0.73, boss: 'ufo',      pal: 'ufo' },
  { theme: 10, len: 15000, d: 0.79, boss: 'frog',     pal: 'frog' },
  { theme: 11, len: 15600, d: 0.84, boss: 'golem',    pal: 'golem' },
  { theme: 12, len: 16200, d: 0.89, boss: 'robot',    pal: 'robotGold' },
  { theme: 13, len: 16800, d: 0.95, boss: 'dragon',   pal: 'dragonIce' },
  { theme: 14, len: 18000, d: 1.00, boss: 'dragon',   pal: 'dragonKing' }
];
/* How each big creature fights. Phase 1 uses moves; at 2/3 health it adds p2 moves; at 1/3 health it adds p3 moves and gets faster.
   Moves: orbs (aimed shots)  fan (3-5 way)  rain (falling orbs - shadows show where)  wave (ground wave - JUMP it)
          bombs (lobbed bombs that leave fire)  beam (a laser across chest height - DUCK under it or jump)
          summon (calls helpers)  lunge (charges at you, then retreats)  barrage (a fast stream of shots) */
const BOSS_DEF = {
  lion:     { w: 210, h: 160, moves: ['wave', 'orbs'],         p2: ['lunge', 'summon'],  p3: ['barrage', 'bombs'] },
  octopus:  { w: 190, h: 215, moves: ['rain', 'fan'],          p2: ['summon', 'beam'],   p3: ['barrage'] },
  scorpion: { w: 220, h: 200, moves: ['fan', 'wave', 'orbs'],  p2: ['lunge', 'bombs'],   p3: ['beam', 'summon'] },
  yeti:     { w: 190, h: 215, moves: ['rain', 'orbs'],         p2: ['wave', 'bombs'],    p3: ['lunge', 'summon'] },
  dragon:   { w: 250, h: 220, moves: ['fan', 'orbs', 'rain'],  p2: ['beam', 'bombs'],    p3: ['barrage', 'summon', 'lunge'] },
  gorilla:  { w: 200, h: 205, moves: ['wave', 'rain'],         p2: ['lunge', 'orbs'],    p3: ['summon', 'barrage'] },
  spider:   { w: 230, h: 150, moves: ['fan', 'rain'],          p2: ['summon', 'beam'],   p3: ['barrage', 'lunge'] },
  robot:    { w: 170, h: 230, moves: ['orbs', 'fan', 'rain'],  p2: ['beam', 'bombs'],    p3: ['barrage', 'summon', 'wave'] },
  eagle:    { w: 240, h: 150, moves: ['fan', 'rain'],          p2: ['bombs', 'summon'],  p3: ['barrage', 'beam'], hover: 40 },
  ufo:      { w: 230, h: 130, moves: ['rain', 'fan'],          p2: ['beam', 'summon'],   p3: ['barrage', 'bombs'], hover: 75 },
  frog:     { w: 210, h: 160, moves: ['wave', 'orbs', 'rain'], p2: ['lunge', 'bombs'],   p3: ['summon', 'barrage'] },
  golem:    { w: 200, h: 230, moves: ['wave', 'rain', 'orbs'], p2: ['lunge', 'beam'],    p3: ['summon', 'bombs', 'barrage'] }
};
const BOSS_SCALE = 1.2;   // bosses are drawn and hit at this size
Object.keys(BOSS_DEF).forEach(function (k) { BOSS_DEF[k].w *= BOSS_SCALE; BOSS_DEF[k].h *= BOSS_SCALE; });
const SUMMON = { lion: ['walker', 'charger'], octopus: ['flyer', 'hopper'], scorpion: ['walker', 'hopper'], yeti: ['charger', 'walker'], dragon: ['flyer', 'walker'], gorilla: ['charger', 'hopper'],
  spider: ['hopper', 'flyer'], robot: ['gunner', 'walker'], eagle: ['flyer', 'bomber'], ufo: ['flyer', 'gunner'], frog: ['hopper', 'walker'], golem: ['walker', 'charger'] };
const ENEMY_PAL = [['#b5f59a', '#4fb85f'], ['#9ae8f0', '#2f9fc4'], ['#f5d08a', '#c4893a'], ['#d8f0ff', '#7ab0d8'], ['#ff9a7a', '#c23a2a'], ['#a8f08a', '#2f9e55'], ['#d0a8ff', '#7a4ad0'], ['#a8b8ff', '#4a58b8'],
  ['#e8f4ff', '#8ab8e8'], ['#ffa8e8', '#c04aa0'], ['#c8e070', '#6a8a2a'], ['#e8c8a0', '#a07a4a'], ['#c8ccd8', '#6a7088'], ['#c8e8ff', '#5a90d0'], ['#ff9ac8', '#a02a6a']];
const MOVE_MIN = { barrage: 1, beam: 1, lunge: 2, bombs: 2 };   // the nastier boss moves only appear from this stage number on (0 = stage 1)
const AIRBORNE = { flyer: 1, bomber: 1, gunship: 1 };
/* ======================================================================= */

const SP = CC.sprites, GROUND = 370, W = 800;
let hero, cam, L, li, lv, enemies, bullets, orbs, waves, caps, lives, invincible, fireCd, wantFire, weapon, jumpBuf, hurtT, aimUp, stepT, dropT, coyote, lastSafe;
let fires = [], boss, bossAnnounce, cpX = 0, cpSaved = {}, rescue = null, shake = 0, flashT = 0, dustT = 0, hint = null, shotsFired = 0, wasGrounded = true;

/* ---------------- stage builder (same stage every time you play it) ---------------- */
function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function pick(r, list) { let tot = 0; list.forEach(function (x) { tot += x[1]; }); let q = r() * tot; for (let i = 0; i < list.length; i++) { q -= list[i][1]; if (q <= 0) return list[i][0]; } return list[0][0]; }
function mk(type, x, y, bounds, d, idx) {
  const hp = { walker: 1, hopper: idx >= 8 ? 2 : 1, gunner: 2, flyer: 1, bomber: 2, turret: idx >= 8 ? 3 : 2, armoured: 4 + Math.floor(idx / 4),
    mech: 14 + Math.floor(idx * 1.2), tank: 9 + Math.floor(idx * 0.8), gunship: 7 + Math.floor(idx * 0.5), charger: 3 + Math.floor(idx / 6) }[type];
  return { type: type, x: x, y: y, baseY: y, bx: bounds, hp: hp, maxHp: hp, t: Math.random() * 5, hit: 0, dir: -1, shoot: 1 + Math.random(), charge: 0, hy: 0, vyh: 0, hopT: 0.4 + Math.random() * 0.6, act: false, bombT: 1, d: d,
    lunge: 0, lungeT: Math.random() * 1.5, dive: 0, dT: 0, diveCool: Math.random() * 1.2, st: 'walk', stT: 0, cool: 1, burst: 0, burstT: 0, slam: 0 };
}
function buildLevel(idx) {
  const cfg = COMMANDO_LEVELS[idx], d = cfg.d, r = rng(idx * 7919 + 13), len = cfg.len;
  const out = { len: len, ground: [], plats: [], enemies: [], caps: [], flags: [] };
  const wpool = ['rapid', 'spread', 'big', 'laser', 'fire', 'homing'].slice(0, Math.min(6, 2 + idx));
  let x = 650, segStart = 0, chunk = 0, mini1 = false, mini2 = false;
  const gw = [['walker', 3], ['hopper', idx >= 1 ? 2 : 0], ['gunner', idx >= 2 ? 2 : 0], ['armoured', idx >= 3 ? 1 : 0], ['turret', idx >= 3 ? 1.2 : 0], ['charger', idx >= 1 ? 1.6 : 0]];
  function groundEnemy(ex) { const t = pick(r, gw); out.enemies.push(mk(t, ex, GROUND, null, d, idx)); }
  function cap(cx, cy) { out.caps.push({ x: cx, y: cy, base: cy, kind: wpool[Math.floor(r() * wpool.length)], t: r() * 6, vx: 0 }); }
  function heart(cx, cy) { out.caps.push({ x: cx, y: cy, base: cy, kind: 'heart', t: 0, vx: 0 }); }
  while (x < len - 1500) {
    chunk++;
    let kind = pick(r, [['flat', 3], ['plat', 3], ['pit', 1.6], ['swarm', 2], ['chasm', idx >= 1 ? 1.4 : 0], ['nest', idx >= 2 ? 1.6 : 0], ['air', 2], ['mech', idx >= 2 ? 1.5 : 0], ['convoy', idx >= 3 ? 1.4 : 0], ['raid', idx >= 5 ? 1.4 : 0]]);
    if (!mini1 && x > len * 0.45) { kind = 'mini'; mini1 = true; } else if (!mini2 && idx >= 6 && x > len * 0.75) { kind = 'mini'; mini2 = true; }
    if (kind === 'flat') {
      const l = 520 + r() * 240, n = 2 + (r() < 0.5 ? 1 : 0) + Math.floor(d * 3 * r());
      for (let i = 0; i < n; i++) groundEnemy(x + 200 + i * (l - 260) / Math.max(1, n));
      x += l;
    } else if (kind === 'plat') {
      out.plats.push({ x: x + 100, y: GROUND - 85, w: 150 }, { x: x + 330, y: GROUND - 165, w: 140 }, { x: x + 560, y: GROUND - 85, w: 150 });
      if (idx >= 2 && r() < 0.8) out.enemies.push(mk(r() < 0.5 ? 'gunner' : 'turret', x + 400, GROUND - 165, [x + 346, x + 454], d, idx));
      if (chunk % 2 === 0) cap(x + 400, GROUND - 165 - 48);
      groundEnemy(x + 450); if (d > 0.3) groundEnemy(x + 640);
      x += 800;
    } else if (kind === 'swarm') {     // a pack rushing at you
      const n = 3 + Math.floor(d * 3);
      for (let i = 0; i < n; i++) out.enemies.push(mk(r() < 0.5 ? 'walker' : (idx >= 1 ? (r() < 0.5 ? 'hopper' : 'charger') : 'walker'), x + 280 + i * 62, GROUND, null, d, idx));
      if (idx >= 2) groundEnemy(x + 640);
      x += 820;
    } else if (kind === 'chasm') {     // a long gap with a trail of stepping platforms: stay on them or fall (a bubble brings you back, but costs a heart)
      out.ground.push({ x0: segStart, x1: x }); const cw = 700 + Math.floor(d * 2) * 60; segStart = x + cw;
      const hs = [70, 130, 80, 140, 90, 130];
      for (let i = 0; i < 5; i++) out.plats.push({ x: x + 40 + i * ((cw - 150) / 4), y: GROUND - hs[i], w: 104 });
      out.enemies.push(mk('turret', x + 40 + 2 * ((cw - 150) / 4) + 52, GROUND - hs[2], [x + 40 + 2 * ((cw - 150) / 4) + 20, x + 40 + 2 * ((cw - 150) / 4) + 84], d, idx));
      for (let i = 0; i < 2 + Math.floor(d * 2); i++) out.enemies.push(mk('flyer', x + 200 + i * 170, GROUND - 130 - r() * 40, null, d, idx));
      cap(x + 40 + 3 * ((cw - 150) / 4) + 52, GROUND - hs[3] - 48);
      x += cw + 300; groundEnemy(x - 140);
    } else if (kind === 'mini') {      // half-way mini boss: a giant robot, a bomb-lobbing tank, or a big armoured guard
      out.plats.push({ x: x + 120, y: GROUND - 90, w: 140 }, { x: x + 600, y: GROUND - 90, w: 140 });
      const which = (idx + (mini2 ? 1 : 0)) % 3;
      const m = mk(which === 1 ? 'mech' : which === 2 ? 'tank' : 'armoured', x + 540, GROUND, null, d, idx);
      m.hp = m.maxHp = which === 1 ? 24 + Math.floor(idx * 1.6) : which === 2 ? 18 + Math.floor(idx * 1.2) : 10 + Math.floor(idx * 1.2); if (which === 0) m.big = true; out.enemies.push(m);
      out.enemies.push(mk('gunner', x + 190, GROUND - 90, [x + 136, x + 244], d, idx), mk('gunner', x + 670, GROUND - 90, [x + 616, x + 724], d, idx));
      cap(x + 350, GROUND - 48); heart(x + 800, GROUND - 48);
      x += 1050;
    } else if (kind === 'pit') {
      const g = Math.round(110 + d * 50 + r() * 20);
      out.ground.push({ x0: segStart, x1: x }); segStart = x + g;
      if (g > 125) out.plats.push({ x: x + g / 2 - 48, y: GROUND - 70, w: 96 });
      x += g + 320; groundEnemy(x - 150);
    } else if (kind === 'nest') {
      out.plats.push({ x: x + 150, y: GROUND - 90, w: 130 }, { x: x + 380, y: GROUND - 170, w: 150 });
      out.enemies.push(mk('turret', x + 455, GROUND - 170, [x + 396, x + 514], d, idx), mk('turret', x + 215, GROUND - 90, [x + 166, x + 264], d, idx));
      groundEnemy(x + 330); groundEnemy(x + 560); cap(x + 455, GROUND - 170 - 48);
      x += 900;
    } else if (kind === 'mech') {      // a giant robot: stay out of reach of its fists!
      out.enemies.push(mk('mech', x + 560, GROUND, null, d, idx), mk('walker', x + 300, GROUND, null, d, idx), mk('charger', x + 380, GROUND, null, d, idx));
      cap(x + 200, GROUND - 48);
      x += 900;
    } else if (kind === 'convoy') {    // a tank lobbing bombs, with escorts
      out.enemies.push(mk('tank', x + 600, GROUND, null, d, idx), mk('gunner', x + 420, GROUND, null, d, idx), mk('hopper', x + 330, GROUND, null, d, idx));
      out.plats.push({ x: x + 180, y: GROUND - 90, w: 140 });
      x += 900;
    } else if (kind === 'raid') {      // a bomber helicopter with flyers
      out.enemies.push(mk('gunship', x + 520, GROUND - 205, null, d, idx));
      for (let i = 0; i < 2 + Math.floor(d * 2); i++) out.enemies.push(mk('flyer', x + 360 + i * 150, GROUND - 60 - r() * 80, null, d, idx));
      groundEnemy(x + 480); cap(x + 600, GROUND - 48);
      x += 900;
    } else { // air raid: flyers (and bombers later)
      const n = 2 + Math.floor(d * 3);
      for (let i = 0; i < n; i++) out.enemies.push(mk('flyer', x + 350 + i * 160, GROUND - 60 - r() * 70, null, d, idx));
      if (idx >= 4 && r() < 0.7) out.enemies.push(mk('bomber', x + 650, GROUND - 190, null, d, idx));
      groundEnemy(x + 500);
      x += 760;
    }
    if (chunk % 2 === 1 && kind !== 'pit') cap(x - 250, GROUND - 48);
    if (idx > 0 && chunk % 5 === 0 && kind !== 'pit') heart(x - 120, GROUND - 48);
  }
  out.ground.push({ x0: segStart, x1: len });
  // enemy patrol limits = the piece of ground they stand on
  out.enemies.forEach(function (e) {
    if (e.bx || AIRBORNE[e.type]) return;
    const s = out.ground.filter(function (g) { return e.x >= g.x0 && e.x <= g.x1; })[0];
    e.bx = s ? [s.x0 + 26, s.x1 - 26] : null;
  });
  out.enemies = out.enemies.filter(function (e) { return e.bx || AIRBORNE[e.type]; });
  // checkpoint flags at one third and two thirds, always on solid ground
  [0.25, 0.5, 0.75].forEach(function (f) {
    let fx = Math.round(len * f);
    const s = out.ground.filter(function (g) { return fx >= g.x0 + 40 && fx <= g.x1 - 40; })[0] || out.ground.filter(function (g) { return g.x0 > fx; })[0];
    if (s && !(fx >= s.x0 + 40 && fx <= s.x1 - 40)) fx = s.x0 + 70;
    out.flags.push({ x: fx, on: false });
  });
  // nothing sits right on top of a flag
  out.enemies = out.enemies.filter(function (e) { return out.flags.every(function (f) { return Math.abs(e.x - f.x) > 260; }); });
  return out;
}

/* ---------------- reset / spawn ---------------- */
const MUSIC_KEY = [0, 2, 3, 5, 7, -2, -4, 0, 2, 5, 7, 3, -1, -3, 1];   // each stage plays in a different key
function reset(g, level, fromCp) {
  li = level; lv = COMMANDO_LEVELS[level]; CC.music.play('commando', { transpose: MUSIC_KEY[level], tempo: 1 + level * 0.01 }); L = buildLevel(level);
  if (!fromCp) cpSaved[level] = 0;
  cpX = fromCp ? (cpSaved[level] || 0) : 0;
  const sx = cpX ? cpX : 150;
  hero = { x: sx, y: GROUND, vy: 0, facing: 1, grounded: true, duck: false, moving: false };
  cam = CC.clamp(sx - 300, 0, L.len - W);
  enemies = L.enemies; if (cpX) enemies = enemies.filter(function (e) { return e.x > cpX + 350; });
  caps = L.caps; if (cpX) caps = caps.filter(function (c) { return c.x > cpX + 100; });
  L.flags.forEach(function (f) { f.on = cpX >= f.x; });
  bullets = []; orbs = []; waves = []; fires = []; boss = null; bossAnnounce = 0; rescue = null; shake = 0; flashT = 0; dustT = 0; hint = null; shotsFired = 0; wasGrounded = true;
  lives = COMMANDO_LIVES; invincible = 1.5; fireCd = 0; wantFire = false; weapon = 'normal'; jumpBuf = 0; hurtT = 0; aimUp = false; stepT = 0; dropT = 0; coyote = 0; lastSafe = sx;
}
function heroBox() { const h = hero.duck ? 34 : 60; return CC.shrink(hero.x - 15, hero.y - h, 30, h, COMMANDO_HITBOX_PAD); }
function shr(b, pad) { return CC.shrink(b.x, b.y, b.w, b.h, pad); }
function boxOf(e) {
  switch (e.type) {
    case 'walker': return { x: e.x - 23, y: e.y - 46, w: 46, h: 46 };
    case 'hopper': return { x: e.x - 22, y: e.y - e.hy - 42, w: 44, h: 42 };
    case 'gunner': return { x: e.x - 20, y: e.y - 56, w: 40, h: 56 };
    case 'armoured': { const k = e.big ? 1.45 : 1; return { x: e.x - 29 * k, y: e.y - 66 * k, w: 58 * k, h: 66 * k }; }
    case 'turret': return { x: e.x - 24, y: e.y - 40, w: 48, h: 40 };
    case 'flyer': return { x: e.x - 16, y: e.y - 16, w: 32, h: 32 };
    case 'bomber': return { x: e.x - 26, y: e.y - 18, w: 52, h: 36 };
    case 'mech': return { x: e.x - 52, y: e.y - 182, w: 104, h: 182 };
    case 'tank': return { x: e.x - 80, y: e.y - 96, w: 160, h: 96 };
    case 'gunship': return { x: e.x - 62, y: e.y - 40, w: 124, h: 74 };
    case 'charger': return { x: e.x - 52, y: e.y - 62, w: 104, h: 62 };
    default: { const D = BOSS_DEF[e.kind]; return { x: e.x - D.w * 0.4, y: e.baseY - D.h * 0.95, w: D.w * 0.8, h: D.h * 0.9 }; }
  }
}
function muzzle() { const m = SP.heroMuzzle({ facing: hero.facing, aimUp: aimUp, duck: hero.duck }); return { x: hero.x + m.x, y: hero.y + m.y }; }
function support(x, y0, y1) {
  let best = Infinity;
  if (y0 <= GROUND + 1 && y1 >= GROUND) for (const s of L.ground) if (x >= s.x0 - 4 && x <= s.x1 + 4) { best = GROUND; break; }
  if (dropT <= 0) for (const p of L.plats) if (x >= p.x - 6 && x <= p.x + p.w + 6 && y0 <= p.y + 1 && y1 >= p.y && p.y < best) best = p.y;
  return best === Infinity ? null : best;
}

/* ---------------- actions ---------------- */
function fire() {
  const w = WEAPONS[weapon], m = muzzle(), base = aimUp ? -Math.PI / 2 : (hero.facing > 0 ? 0 : Math.PI);
  (w.fan || [0]).forEach(function (da) {
    const a = base + da;
    bullets.push({ x: m.x, y: m.y, vx: Math.cos(a) * w.speed, vy: Math.sin(a) * w.speed, kind: weapon, a: a, dmg: w.dmg, pierce: w.pierce, hit: [], life: w.life, homing: !!w.homing, t: 0 });
  });
  flashT = 0.07; shotsFired++;
  CC.sfx.shoot(weapon === 'laser' || weapon === 'homing' || weapon === 'fire' ? 'spread' : weapon);
}
function dropPickup(e) { caps.push({ x: e.x, y: GROUND - 48, base: GROUND - 48, kind: ['rapid', 'spread', 'big', 'laser', 'fire', 'homing'][Math.floor(Math.random() * Math.min(6, 2 + li))], t: 0, vx: 0 }); }
const hurtLog = []; let god = false;
function hurtHero(g, why) {
  if (invincible > 0 || god) return false;
  hurtLog.push(why + '@' + Math.round(hero.x));
  lives--; invincible = COMMANDO_INVINCIBLE_SECONDS; hurtT = 0.5; weapon = 'normal'; CC.sfx.lifeLost(); shake = 0.35;
  g.particles.burst(hero.x, hero.y - 30, ['#ffd23f', '#ffffff', '#ff9aa8'], 12, { speed: 150, size: 5, up: 100 });
  if (lives <= 0) { lives = 0; g.stars = 1; g.over(); }
  return true;
}
function defeat(g, e) {
  const cols = { walker: ['#b5f59a', '#4fb85f', '#fff'], hopper: ['#ffe08a', '#f2a62a', '#fff'], gunner: ['#d0c8ff', '#7a68d8', '#fff'], flyer: ['#f2a6ff', '#a64fd0', '#fff'], bomber: ['#ffb8d0', '#e0508a', '#fff'],
    turret: ['#ffc989', '#f08a3a', '#fff'], armoured: ['#d8dcf5', '#7f88b8', '#fff'], mech: ['#b8c2f0', '#4a5488', '#ff6a2a', '#fff'], tank: ['#ee7a7a', '#8a2030', '#ffd23f', '#fff'], gunship: ['#ff8a8a', '#8a2030', '#ffd23f', '#fff'], charger: ['#c8844a', '#5a3418', '#fff'] }[e.type] || ['#e2d0ff', '#8a5fe0', '#ffd23f', '#fff'];
  const b = boxOf(e);
  const big = e.type === 'mech' || e.type === 'tank' || e.type === 'gunship';
  g.particles.burst(b.x + b.w / 2, b.y + b.h / 2, cols, big ? 40 : 16, { speed: big ? 300 : 190, size: big ? 8 : 6, life: big ? 0.9 : 0.6 }); CC.sfx.pop(); if (big) { shake = 0.4; CC.sfx.bump(); }
  if (big && Math.random() < 0.6) caps.push({ x: e.x + 40, y: GROUND - 48, base: GROUND - 48, kind: 'heart', t: 0, vx: 0 });
  if (e.type === 'armoured' || big) dropPickup(e); else if (Math.random() < DROP_CHANCE) dropPickup(e);
}
function orb(x, y, tx, ty, speed, extra) {
  const a = Math.atan2(ty - y, tx - x); const o = { x: x, y: y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, t: 0, bomb: false };
  if (extra) Object.assign(o, extra); orbs.push(o); return o;
}
function spawnBoss(g) {
  const D = BOSS_DEF[lv.boss];
  boss = { type: 'boss', kind: lv.boss, x: L.len + 160, baseY: GROUND - (D.hover || 0), hp: BOSS_HP_BASE + li * BOSS_HP_PER_STAGE, maxHp: 0, t: 0, hit: 0, state: 'enter', phase: 1, beam: null, lp: '', holdT: 0, idle: 1.5, dir: -1, tele: 0, act: 0, charge: 0, move: '', q: 0, qT: 0, dying: 0 };
  boss.maxHp = boss.hp; bossAnnounce = 2.2; CC.sfx.warn(); enemies.push(boss); CC.music.play('commandoBoss', { transpose: MUSIC_KEY[li] });
}
function bossPhase(b) { const f = b.hp / b.maxHp; return f > 0.66 ? 1 : f > 0.33 ? 2 : 3; }
function lobBomb(x0, y0, tx, ty, patch) {            // a bomb thrown in an arc that lands near (tx, ty)
  const T = 0.9 + Math.abs(tx - x0) / 900, vx = (tx - x0) / T, vy = (ty - y0 - 0.5 * 520 * T * T) / T;
  orbs.push({ x: x0, y: y0, vx: vx, vy: vy, t: 0, bomb: true, patch: !!patch });
}
function summon(g, b, n) {
  if (enemies.filter(function (e) { return e.type !== 'boss'; }).length > 6) return;
  const kinds = SUMMON[b.kind] || ['walker'];
  for (let i = 0; i < n; i++) {
    let t = kinds[i % kinds.length]; if (li < 1 && t === 'charger') t = 'walker'; if (li < 1 && t === 'hopper') t = 'walker'; const air = AIRBORNE[t];
    const e = mk(t, Math.max(cam + 60, b.x - 150 - i * 80), air ? GROUND - 80 - Math.random() * 70 : GROUND, air ? null : [cam + 40, L.len - 60], lv.d, li);
    e.act = true; enemies.push(e); g.particles.burst(e.x, e.y - 30, ['#ffffff', '#ffd23f', '#c8a8ff'], 12, { speed: 150, size: 5 });
  }
  CC.sfx.pickup();
}
function bossPerform(g, b) {
  const d = lv.d, hx = hero.x, hy = hero.y - 30, bx = b.x - 60, by = b.baseY - 80, p = bossPhase(b);
  if (b.move === 'orbs') { b.q = 1 + (d > 0.4 ? 1 : 0) + (d > 0.8 ? 1 : 0) + (p > 1 ? 1 : 0); b.qT = 0; b.act = 0.4 * b.q + 0.3; }
  else if (b.move === 'fan') { const n = (d > 0.6 ? 5 : 3) + (p === 3 ? 2 : 0); for (let i = 0; i < n; i++) { const a = Math.atan2(hy - by, hx - bx) + (i - (n - 1) / 2) * 0.3; orbs.push({ x: bx, y: by, vx: Math.cos(a) * ORB_SPEED * 1.05, vy: Math.sin(a) * ORB_SPEED * 1.05, t: 0, bomb: false }); } CC.sfx.shoot('spread'); b.act = 0.5; }
  else if (b.move === 'rain') { b.q = 6 + Math.floor(d * 5) + p * 2; b.qT = 0; b.act = b.q * 0.2 + 0.4; }
  else if (b.move === 'wave') { b.q = (d > 0.5 ? 2 : 1) + (p === 3 ? 1 : 0); b.qT = 0; b.act = 0.6 + b.q * 0.8; }
  else if (b.move === 'bombs') { b.q = 2 + p; b.qT = 0; b.act = b.q * 0.35 + 0.5; }
  else if (b.move === 'beam') { b.beam = { y: GROUND - 56, on: true }; b.act = 1.1; CC.sfx.shoot('big'); shake = Math.max(shake, 0.3); }
  else if (b.move === 'summon') { summon(g, b, 1 + p); b.act = 0.8; }
  else if (b.move === 'lunge') { b.lp = 'out'; b.act = 99; }
  else if (b.move === 'barrage') { b.q = 10 + p * 3; b.qT = 0; b.act = b.q * 0.09 + 0.4; b.aim = Math.atan2(hy - by, hx - bx); }
  else { summon(g, b, 2); b.act = 0.8; shake = 0.5; CC.sfx.bump(); g.particles.burst(b.x, b.baseY - 80, ['#ffd23f', '#ff6a2a', '#fff'], 24, { speed: 260, size: 7 }); }   // roar at a new phase
}
function bossUpdate(g, b, dt) {
  const D = BOSS_DEF[b.kind], d = lv.d; b.t += dt; if (b.hit > 0) b.hit -= dt;
  const arenaMin = L.len - 330, arenaMax = L.len - 110;
  if (b.state === 'dying') {
    b.dying -= dt; if (Math.random() < dt * 14) g.particles.burst(b.x + CC.rand(-D.w * 0.4, D.w * 0.4), b.baseY - CC.rand(10, D.h), ['#ffd23f', '#ffffff', '#ff9aa8', '#b5f59a'], 6, { speed: 160, size: 6 });
    if (b.dying <= 0) {
      g.particles.burst(b.x, b.baseY - D.h / 2, ['#ffd23f', '#ffffff', '#ff9aa8', '#b5f59a', '#8affea'], 80, { speed: 340, size: 9, life: 1.2 }); CC.sfx.pop(); CC.sfx.levelComplete(); shake = 0.8;
      enemies.splice(enemies.indexOf(b), 1); orbs = []; waves = []; fires = []; b.beam = null; g.stars = lives >= 4 ? 3 : lives >= 2 ? 2 : 1; g.complete();
    }
    return;
  }
  if (b.state === 'enter') { b.x -= 150 * dt; if (b.x <= L.len - 200) { b.state = 'idle'; b.idle = 1.2; } return; }
  const p = bossPhase(b);
  if (p > b.phase && b.state !== 'tele' && b.state !== 'act') { b.phase = p; b.move = 'roar'; b.state = 'tele'; b.tele = 1.1; b.beam = null; b.lp = ''; CC.sfx.warn(); shake = Math.max(shake, 0.4); }
  const rage = p === 3 ? 0.55 : p === 2 ? 0.8 : 1, spd = 1 + 0.3 * (p - 1);
  if (b.state === 'idle') {
    b.x += b.dir * (28 + d * 20) * spd * dt; if (b.x < arenaMin) b.dir = 1; if (b.x > arenaMax) b.dir = -1;
    b.idle -= dt;
    if (b.idle <= 0) {
      const pool = D.moves.concat(p >= 2 ? D.p2 : [], p >= 3 ? D.p3 : []).filter(function (mv) { return li >= (MOVE_MIN[mv] || 0); }); let m = pool[Math.floor(Math.random() * pool.length)]; if (m === b.move && pool.length > 1) m = pool[(pool.indexOf(m) + 1) % pool.length];
      b.move = m; b.state = 'tele'; b.tele = m === 'beam' ? 1.1 : TURRET_WARNING_SECONDS * (p === 3 ? 0.8 : 1); CC.sfx.warn();
    }
  } else if (b.state === 'tele') {
    const total = b.move === 'beam' || b.move === 'roar' ? 1.1 : TURRET_WARNING_SECONDS * (p === 3 ? 0.8 : 1);
    b.tele -= dt; b.charge = 1 - Math.max(0, b.tele) / total;
    if (b.tele <= 0) { b.charge = 0; bossPerform(g, b); b.state = 'act'; }
  } else if (b.state === 'act') {
    b.act -= dt; b.qT -= dt;
    const mx = b.x - 60, my = b.baseY - 80;
    if (b.move === 'orbs' && b.q > 0 && b.qT <= 0) { orb(mx, my, hero.x, hero.y - 30, ORB_SPEED * 1.1); CC.sfx.shoot('spread'); b.q--; b.qT = 0.4; }
    else if (b.move === 'rain' && b.q > 0 && b.qT <= 0) { orbs.push({ x: CC.rand(cam + 60, cam + W - 60), y: -30, vx: 0, vy: 0, t: 0, wait: 0.75, rain: true, bomb: false }); b.q--; b.qT = 0.2; }
    else if (b.move === 'wave' && b.q > 0 && b.qT <= 0) { waves.push({ x: b.x - D.w * 0.4, vx: -(210 + d * 90), t: 0 }); CC.sfx.bump(); shake = 0.25; g.particles.burst(b.x - D.w * 0.4, GROUND, ['#ffe9a8', '#fff'], 10, { speed: 140, up: 80, size: 5 }); b.q--; b.qT = 0.8; }
    else if (b.move === 'bombs' && b.q > 0 && b.qT <= 0) { lobBomb(mx, my - 30, hero.x + CC.rand(-150, 150), GROUND - 10, true); CC.sfx.shoot('big'); b.q--; b.qT = 0.35; }
    else if (b.move === 'barrage' && b.q > 0 && b.qT <= 0) { const a = b.aim + Math.sin(b.q * 0.9) * 0.5; orbs.push({ x: mx, y: my, vx: Math.cos(a) * ORB_SPEED * 1.25, vy: Math.sin(a) * ORB_SPEED * 1.25, t: 0, bomb: false }); CC.sfx.shoot('rapid'); b.q--; b.qT = 0.09; }
    else if (b.move === 'lunge') {
      const home = arenaMax - 80;
      if (b.lp === 'out') { const tx = Math.max(cam + 400, hero.x + 240); b.x -= 440 * dt; if (Math.random() < dt * 30) g.particles.burst(b.x + 60, GROUND, ['#fff', '#ffe9a8'], 2, { speed: 90, up: 40, size: 5 }); if (b.x <= tx) { b.lp = 'hold'; b.holdT = 0.45; shake = Math.max(shake, 0.3); CC.sfx.bump(); } }
      else if (b.lp === 'hold') { b.holdT -= dt; if (b.holdT <= 0) b.lp = 'back'; }
      else { b.x += 180 * dt; if (b.x >= home) { b.x = Math.min(b.x, arenaMax); b.act = 0; } }
    }
    if (b.act <= 0) { b.state = 'idle'; b.idle = Math.max(0.8, 2.3 - d * 1.0) * rage; b.beam = null; b.lp = ''; }
  }
}

/* a friendly bubble carries you back to the last safe ground (costs one heart) */
function startRescue(g) {
  g.particles.burst(hero.x, GROUND + 40, ['#ffffff', '#8fd0ff', '#c8f0ff'], 16, { speed: 170, up: 240, size: 5 }); CC.sfx.bump(); shake = 0.2;
  const tx = Math.max(cam + 50, lastSafe - 30);
  rescue = { t: 0, dur: 0.95, fx: hero.x, fy: GROUND + 20, tx: tx };
  const was = invincible; invincible = 0; hurtHero(g, 'pit'); invincible = Math.max(was, 3);
  hero.vy = 0; hero.x = rescue.fx; hero.y = rescue.fy;
}
/* ---------------- main update ---------------- */
function update(g, dt) {
  if (invincible > 0) invincible -= dt;
  if (hurtT > 0) hurtT -= dt;
  if (dropT > 0) dropT -= dt;
  if (shake > 0) shake -= dt; if (flashT > 0) flashT -= dt;
  if (rescue) {
    rescue.t += dt; const u = Math.min(1, rescue.t / rescue.dur), e = u * u * (3 - 2 * u);
    hero.x = rescue.fx + (rescue.tx - rescue.fx) * e; hero.y = rescue.fy + (GROUND - rescue.fy) * e - Math.sin(Math.PI * u) * 170; hero.vy = 0; hero.grounded = false;
    cam = Math.max(cam, CC.clamp(hero.x - 300, 0, L.len - W)); if (Math.random() < dt * 20) g.particles.burst(hero.x, hero.y - 20, ['#ffffff', '#c8f0ff'], 2, { speed: 40, size: 3, grav: -20 });
    if (u >= 1) { rescue = null; hero.y = GROUND; hero.grounded = true; hero.vy = 0; invincible = 1.8; wasGrounded = true; }
    return;
  }
  // ---- hero ----
  const Lk = !!CC.held.ArrowLeft, Rk = !!CC.held.ArrowRight;
  hero.duck = !!CC.held.ArrowDown && hero.grounded && hero.y >= GROUND - 1;
  hero.moving = (Lk !== Rk);
  if (hero.moving) { hero.facing = Rk ? 1 : -1; hero.x = CC.clamp(hero.x + hero.facing * RUN_SPEED * (hero.duck ? 0.5 : 1) * dt, cam + 24, L.len - 30); }
  aimUp = !!CC.held.ArrowUp && !hero.moving;
  if (jumpBuf > 0) jumpBuf -= dt;
  if (hero.grounded) coyote = 0.1; else coyote -= dt;
  if (jumpBuf > 0 && coyote > 0 && !hero.duck) { hero.vy = -JUMP_POWER; hero.grounded = false; coyote = 0; jumpBuf = 0; CC.sfx.jump(); }
  hero.vy += GRAVITY * dt;
  const ny = hero.y + hero.vy * dt;
  const sup = hero.vy >= 0 ? support(hero.x, hero.y, ny) : null;
  if (sup !== null) { hero.y = sup; hero.vy = 0; hero.grounded = true; }
  else { hero.y = ny; hero.grounded = false; }
  if (hero.grounded && hero.y >= GROUND - 1 && L.ground.some(function (q) { return hero.x > q.x0 + 40 && hero.x < q.x1 - 40; })) lastSafe = hero.x;
  if (hero.y > GROUND + 90) startRescue(g);
  if (hero.moving && hero.grounded) { stepT -= dt; if (stepT <= 0) { CC.sfx.step(); stepT = 0.26; g.particles.burst(hero.x - hero.facing * 10, hero.y - 2, ['rgba(255,255,255,.5)', 'rgba(200,200,200,.4)'], 2, { speed: 40, size: 3, up: 30, grav: 80, life: 0.35 }); } }
  if (hero.grounded && !wasGrounded) { CC.sfx.step(); g.particles.burst(hero.x, hero.y - 2, ['rgba(255,255,255,.55)'], 5, { speed: 70, size: 4, up: 20, grav: 60, life: 0.4 }); }
  wasGrounded = hero.grounded;
  computeHint();
  // once the big creature arrives, a friendly invisible wall keeps you in the left part of the arena
  if (boss && boss.state !== 'dying' && hero.x > cam + 400) hero.x = Math.max(cam + 400, hero.x - 320 * dt);
  // camera follows (never scrolls back, so you can't retreat past the left edge)
  const maxCam = L.len - W;
  cam = Math.max(cam, CC.clamp(hero.x - 300, 0, maxCam));
  // shooting
  fireCd -= dt;
  if ((CC.held.Space || wantFire) && fireCd <= 0) { fire(); fireCd = WEAPONS[weapon].delay; }
  wantFire = false;
  // checkpoints
  L.flags.forEach(function (f) { if (!f.on && hero.x >= f.x) { f.on = true; cpX = f.x; cpSaved[li] = f.x; CC.sfx.pickup(); g.particles.burst(f.x, GROUND - 70, ['#6bcb77', '#ffd23f', '#fff'], 14, { speed: 160, up: 160, size: 5 }); } });
  // boss trigger
  if (!boss && cam >= maxCam - 2 && hero.x > cam + 140) spawnBoss(g);
  if (bossAnnounce > 0) bossAnnounce -= dt;
  // bullets
  for (const b of bullets) {
    b.t += dt; b.life -= dt;
    if (b.homing) {
      let best = null, bd = 420;
      for (const e of enemies) { if (!e.act && e.type !== 'boss') continue; const bb = boxOf(e), dx = bb.x + bb.w / 2 - b.x, dy = bb.y + bb.h / 2 - b.y, dist = Math.hypot(dx, dy); if (dist < bd) { bd = dist; best = [dx, dy]; } }
      if (best) { const sp = Math.hypot(b.vx, b.vy), cur = Math.atan2(b.vy, b.vx); let da = Math.atan2(best[1], best[0]) - cur; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI; const na = cur + CC.clamp(da, -5 * dt, 5 * dt); b.vx = Math.cos(na) * sp; b.vy = Math.sin(na) * sp; b.a = na; }
    }
    b.x += b.vx * dt; b.y += b.vy * dt;
  }
  // pickups (touch or shoot)
  for (let i = caps.length - 1; i >= 0; i--) {
    const c = caps[i]; c.t += dt; c.y = c.base + Math.sin(c.t * 2.5) * 7;
    const cb = { x: c.x - 22, y: c.y - 16, w: 44, h: 32 };
    let got = CC.overlap(cb, { x: hero.x - 18, y: hero.y - 60, w: 36, h: 60 });
    for (let j = bullets.length - 1; j >= 0 && !got && c.kind !== 'heart'; j--) if (CC.overlap(cb, { x: bullets[j].x - 7, y: bullets[j].y - 7, w: 14, h: 14 })) { got = true; if (bullets[j].pierce <= 1) bullets.splice(j, 1); }
    if (got) {
      if (c.kind === 'heart') { lives = Math.min(COMMANDO_LIVES + 2, lives + 1); }
      else weapon = c.kind;
      CC.sfx.pickup(); g.particles.burst(c.x, c.y, [SP.WEAPON_COLORS[c.kind] || '#ff6b86', '#ffffff'], 16, { speed: 170, size: 5, grav: 0 });
      caps.splice(i, 1);
    }
  }
  // enemies
  const hb = heroBox(), right = cam + W;
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (e.type === 'boss') { bossUpdate(g, e, dt); if (e.state === 'dying') continue; }
    else {
      if (!e.act) { if (e.x < right + 40) e.act = true; else continue; }
      if (e.x < cam - 220) { enemies.splice(i, 1); continue; }
      e.t += dt; if (e.hit > 0) e.hit -= dt;
      enemyAI(g, e, dt);
      if (enemies[i] !== e) continue;
    }
    // player bullets
    const eb = shr(boxOf(e), e.type === 'flyer' || e.type === 'bomber' ? 4 : 3);
    if (e.type !== 'boss' && !(e.x > cam - 40 && e.x < right + 40)) continue;
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      if (b.hit.indexOf(e) >= 0) continue;
      const vert = Math.abs(b.vy) > Math.abs(b.vx), r = b.kind === 'big' ? 11 : 7;
      const bb = b.kind === 'laser' ? (vert ? { x: b.x - 5, y: b.y - 30, w: 10, h: 60 } : { x: b.x - 30, y: b.y - 5, w: 60, h: 10 }) : { x: b.x - r, y: b.y - r, w: r * 2, h: r * 2 };
      if (CC.overlap(eb, bb)) {
        b.hit.push(e); e.hp -= b.dmg; e.hit = 0.12; b.pierce--; if (b.pierce <= 0) bullets.splice(j, 1);
        if (b.kind === 'fire') g.particles.burst(b.x, b.y, ['#ff8a3a', '#ffd23f'], 4, { speed: 80, size: 4, grav: -60 });
        if (e.hp <= 0) {
          if (e.type === 'boss') { e.state = 'dying'; e.dying = 1.6; e.hp = 0; orbs = []; waves = []; CC.sfx.pop(); }
          else { defeat(g, e); enemies.splice(i, 1); }
          break;
        } else CC.sfx.clink();
      }
    }
    if (enemies[i] !== e) continue;
    if (e.hp > 0 && CC.overlap(hb, shr(boxOf(e), e.type === 'boss' ? COMMANDO_HITBOX_PAD + 10 : COMMANDO_HITBOX_PAD))) { hurtHero(g, 'touch-' + e.type); if (g.state !== 'play') return; }
  }
  // enemy orbs, bombs and boss waves
  for (let i = orbs.length - 1; i >= 0; i--) {
    const o = orbs[i]; o.t += dt;
    if (o.rain && o.wait > 0) { o.wait -= dt; if (o.wait <= 0) o.vy = 230; continue; }
    if (o.bomb) o.vy += 520 * dt;
    o.x += o.vx * dt; o.y += o.vy * dt;
    let gone = false;
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      if (CC.overlap({ x: o.x - 9, y: o.y - 9, w: 18, h: 18 }, { x: b.x - 7, y: b.y - 7, w: 14, h: 14 })) { g.particles.burst(o.x, o.y, ['#ff9ac8', '#fff'], 8, { speed: 120, size: 4 }); CC.sfx.clink(); if (--b.pierce <= 0) bullets.splice(j, 1); gone = true; break; }
    }
    if (!gone && CC.overlap(hb, CC.shrink(o.x - 9, o.y - 9, 18, 18, 3))) { gone = true; g.particles.burst(o.x, o.y, ['#ff9ac8', '#fff'], 8, { speed: 120, size: 4 }); hurtHero(g, o.bomb ? 'bomb' : o.rain ? 'rain' : 'orb'); if (g.state !== 'play') return; }
    if (!gone && (o.bomb || o.rain) && o.y > GROUND - 6) { gone = true; if (o.patch) fires.push({ x: o.x, t: 2.4 }); shake = Math.max(shake, 0.12); g.particles.burst(o.x, GROUND - 6, ['#ffd23f', '#ff8a3a', '#fff'], 10, { speed: 150, up: 100, size: 5 }); CC.sfx.bump(); }
    if (gone || o.x < cam - 60 || o.x > cam + W + 60 || o.y < -60 || o.y > GROUND + 40) orbs.splice(i, 1);
  }
  for (let i = waves.length - 1; i >= 0; i--) {
    const w = waves[i]; w.x += w.vx * dt; w.t += dt;
    if (CC.overlap(hb, { x: w.x - 16, y: GROUND - 34, w: 32, h: 34 })) { hurtHero(g, 'wave'); if (g.state !== 'play') return; }
    if (w.x < cam - 40) waves.splice(i, 1);
  }
  if (boss && boss.beam && boss.beam.on && boss.state === 'act') { const band = { x: cam, y: boss.beam.y - 12, w: Math.max(0, boss.x - 60 - cam), h: 24 }; if (CC.overlap(hb, band)) { hurtHero(g, 'beam'); if (g.state !== 'play') return; } }
  for (let i = fires.length - 1; i >= 0; i--) { const f = fires[i]; f.t -= dt; if (CC.overlap(hb, { x: f.x - 24, y: GROUND - 22, w: 48, h: 22 })) { hurtHero(g, 'fire'); if (g.state !== 'play') return; } if (f.t <= 0) fires.splice(i, 1); }
  bullets = bullets.filter(function (b) { return b.life > 0 && b.x > cam - 60 && b.x < cam + W + 60 && b.y > -60 && b.y < GROUND + 60; });
}
function enemyAI(g, e, dt) {
  const d = e.d, dx = hero.x - e.x, toward = dx < 0 ? -1 : 1, onScreen = e.x > cam + 20 && e.x < cam + W - 20;
  e.lungeT -= dt;
  function move(sp) { e.dir = toward; e.x += toward * sp * dt; if (e.bx) e.x = CC.clamp(e.x, e.bx[0], e.bx[1]); }
  function shootOrb(sy, mul) { orb(e.x - 10 * (e.dir || -1), sy, hero.x, hero.y - 30, ORB_SPEED * (1 + d * 0.3) * mul); CC.sfx.shoot('spread'); }
  function aimShoot(mul, burst) {
    if (e.burst > 0) { e.burstT -= dt; if (e.burstT <= 0) { shootOrb(e.y - 24, mul); e.burst--; e.burstT = 0.2; } }
    if (!onScreen) { e.charge = 0; return; }
    e.shoot -= dt; const warn = TURRET_WARNING_SECONDS * (1 - d * 0.25);
    e.charge = e.shoot < warn ? 1 - Math.max(0, e.shoot) / warn : 0;
    if (e.shoot <= 0) { shootOrb(e.y - 24, mul); e.burst = burst || 0; e.burstT = 0.2; e.shoot = 2.5 - d * 1.1 + Math.random() * 0.6; e.charge = 0; }
  }
  switch (e.type) {
    case 'walker': {                       // lunges at you when you get close
      let sp = 42 + d * 48;
      if (e.lunge > 0) { e.lunge -= dt; sp *= 2.7; } else if (Math.abs(dx) < 200 && e.lungeT <= 0 && onScreen) { e.lunge = 0.45; e.lungeT = 2.2; }
      move(sp); break;
    }
    case 'armoured': move(34 + d * 26); break;
    case 'hopper':
      if (e.hy > 0 || e.vyh !== 0) { e.hy += e.vyh * dt; e.vyh -= 1700 * dt; e.x += e.dir * (130 + d * 40) * dt; if (e.bx) e.x = CC.clamp(e.x, e.bx[0], e.bx[1]); if (e.hy <= 0) { e.hy = 0; e.vyh = 0; e.hopT = 0.3 + Math.random() * 0.5; } }
      else { e.hopT -= dt; if (e.hopT <= 0) { e.dir = toward; e.vyh = 600; e.hy = 1; } }
      break;
    case 'gunner': if (Math.abs(dx) > 260) move(30); aimShoot(1, d > 0.5 ? 2 : 1); break;
    case 'turret': aimShoot(1.05, d > 0.6 ? 1 : 0); break;
    case 'flyer':                           // swoops down at you
      if (e.dive === 0) { e.x -= (110 + d * 60) * dt; e.y = e.baseY + Math.sin(e.t * 3.2) * 16; e.diveCool -= dt; if (onScreen && e.x > hero.x + 40 && e.x - hero.x < 320 && e.diveCool <= 0 && d > 0.2) { e.dive = 1; e.dT = 0.35; } }
      else if (e.dive === 1) { e.charge = 1 - e.dT / 0.35; e.dT -= dt; e.x -= 60 * dt; if (e.dT <= 0) { const a = Math.atan2(hero.y - 30 - e.y, hero.x - e.x); e.dvx = Math.cos(a) * 310; e.dvy = Math.sin(a) * 310; e.dive = 2; e.dT = 0.9; e.charge = 0; CC.sfx.warn(); } }
      else if (e.dive === 2) { e.x += e.dvx * dt; e.y += e.dvy * dt; e.dT -= dt; if (e.dT <= 0 || e.y > GROUND - 12) e.dive = 3; }
      else { e.y += (e.baseY - e.y) * Math.min(1, dt * 2.5); e.x -= 150 * dt; }
      if (e.x < cam - 90) e.hp = -99; break;
    case 'bomber':
      if (Math.abs(hero.x - e.x) > 6) e.x += (hero.x > e.x ? 1 : -1) * Math.min(Math.abs(hero.x - e.x) / dt, 72 + d * 30) * dt;
      e.y = e.baseY + Math.sin(e.t * 2) * 10; e.bombT -= dt; e.charge = e.bombT < 0.5 ? 1 - Math.max(0, e.bombT) / 0.5 : 0;
      if (e.bombT <= 0 && Math.abs(hero.x - e.x) < 90) { orbs.push({ x: e.x, y: e.y + 20, vx: 0, vy: 60, t: 0, bomb: true }); e.bombT = 2 - d * 0.6; CC.sfx.warn(); } else if (e.bombT <= 0) e.bombT = 0.3;
      break;
    case 'charger':                         // crouches, then rushes you - jump over it!
      if (e.st === 'walk') { move(48 + d * 22); if (onScreen && dx < 0 && Math.abs(dx) < 460 && Math.abs(dx) > 150) { e.st = 'wind'; e.stT = 0.55; } }
      else if (e.st === 'wind') { e.stT -= dt; e.charge = 1 - Math.max(0, e.stT) / 0.55; e.dir = -1; if (e.stT <= 0) { e.st = 'dash'; e.stT = 1.7; e.charge = 0; CC.sfx.warn(); } }
      else if (e.st === 'dash') { e.x -= (370 + d * 90) * dt; e.stT -= dt; if (Math.random() < dt * 25) g.particles.burst(e.x + 50, GROUND, ['#fff', '#d8c8a8'], 2, { speed: 80, up: 30, size: 5 }); if (e.bx && e.x <= e.bx[0]) { e.x = e.bx[0]; e.st = 'rest'; e.stT = 1; } else if (e.x < hero.x - 240 || e.stT <= 0) { e.st = 'rest'; e.stT = 1.1; } }
      else { e.stT -= dt; if (e.stT <= 0) e.st = 'walk'; }
      break;
    case 'mech': {                          // giant robot: slams the ground when you get near
      e.cool -= dt;
      if (e.st === 'walk' || e.st === 'rest') {
        if (Math.abs(dx) > 120) move(24 + d * 14);
        if (e.st === 'rest') { e.stT -= dt; if (e.stT <= 0) e.st = 'walk'; }
        if (onScreen && Math.abs(dx) < 200 && e.cool <= 0) { e.st = 'wind'; e.stT = 0.8; } else if (onScreen && Math.abs(dx) > 300) aimShoot(0.95, 0);
      } else if (e.st === 'wind') {
        e.stT -= dt; e.charge = 1 - Math.max(0, e.stT) / 0.8;
        if (e.stT <= 0) {
          e.st = 'slam'; e.stT = 0.4; e.charge = 0; e.slam = 1; shake = Math.max(shake, 0.35); CC.sfx.bump();
          const zone = { x: toward < 0 ? e.x - 170 : e.x - 40, y: GROUND - 90, w: 210, h: 90 };
          g.particles.burst(e.x + toward * 100, GROUND, ['#ffe9a8', '#ffffff', '#9aa4dc'], 16, { speed: 190, up: 100, size: 6 });
          waves.push({ x: e.x + toward * 80, vx: toward * (210 + d * 60), t: 0 });
          if (CC.overlap(heroBox(), zone)) { hurtHero(g, 'mech-slam'); }
        }
      } else if (e.st === 'slam') { e.stT -= dt; if (e.stT <= 0) { e.slam = 0; e.st = 'rest'; e.stT = 0.7; e.cool = 2.4 - d * 0.8; } }
      break;
    }
    case 'tank':                            // rolls up and lobs bombs that leave fire
      if (dx > 0 || Math.abs(dx) > 430) move(34);
      if (onScreen) {
        e.shoot -= dt; e.charge = e.shoot < 1 ? 1 - Math.max(0, e.shoot) / 1 : 0;
        if (e.shoot <= 0) { lobBomb(e.x - 90, e.y - 100, hero.x + CC.rand(-40, 40), GROUND - 8, true); CC.sfx.shoot('big'); shake = Math.max(shake, 0.15); e.shoot = 2.6 - d * 0.9; e.charge = 0; }
      } else e.charge = 0;
      break;
    case 'gunship': {                       // bomber helicopter: hovers over you dropping bombs
      const tx = hero.x + 70; if (Math.abs(e.x - tx) > 6) e.x += Math.sign(tx - e.x) * Math.min(Math.abs(tx - e.x), 80 + d * 20 * 1) * dt;
      e.y = e.baseY + Math.sin(e.t * 1.6) * 12; e.bombT -= dt; e.charge = e.bombT < 0.4 ? 1 - Math.max(0, e.bombT) / 0.4 : 0;
      if (e.bombT <= 0 && Math.abs(hero.x - e.x) < 150 && onScreen) { orbs.push({ x: e.x - 10, y: e.y + 40, vx: 0, vy: 70, t: 0, bomb: true, patch: true }); e.bombT = 1.0 - d * 0.3; CC.sfx.warn(); } else if (e.bombT <= 0) e.bombT = 0.2;
      break;
    }
  }
  if (e.hp <= -99) { const i = enemies.indexOf(e); if (i >= 0) enemies.splice(i, 1); }
}

/* little key pictures that show a beginner what to press (first stages only) */
function computeHint() {
  hint = null; if (li >= KEY_HINT_STAGES) return;
  if (cam < 40 && hero.x < 360 && !hero.moving && shotsFired === 0) { hint = { keys: ['→'] }; return; }
  if (hero.grounded && hero.y >= GROUND - 1) {
    const ahead = L.ground.some(function (q) { return hero.x + 40 > q.x0 && hero.x + 40 < q.x1; });
    const pit = !L.ground.some(function (q) { return hero.x + 150 > q.x0 && hero.x + 150 < q.x1; });
    if (pit && ahead) { hint = { keys: ['↑'] }; return; }
  }
  for (const e of enemies) { if (e.type !== 'boss' && e.act && e.x > hero.x && e.x - hero.x < 380 && shotsFired < 6) { hint = { keys: ['Space'] }; return; } }
  if (hero.grounded && hero.y < GROUND - 4 && li === 0) hint = { keys: ['↓'] };
}
/* ---------------- drawing ---------------- */
function hrr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function draw(g) {
  const c = g.ctx, th = SP.THEMES[lv.theme];
  SP.world(c, W, g.H, GROUND, cam, lv.theme, g.t);
  c.save(); c.translate(-cam + (shake > 0 ? (Math.random() - 0.5) * shake * 18 : 0), shake > 0 ? (Math.random() - 0.5) * shake * 12 : 0);
  for (let i = 0; i < L.ground.length; i++) {
    const s = L.ground[i]; if (!(s.x1 < cam - 20 || s.x0 > cam + W + 20)) SP.ground(c, lv.theme, Math.max(s.x0, cam - 20), Math.min(s.x1, cam + W + 20), GROUND, g.H);
    const n = L.ground[i + 1]; if (n && n.x0 > cam - 20 && s.x1 < cam + W + 20) SP.pit(c, lv.theme, s.x1, n.x0, GROUND, g.H, g.t);
  }
  for (const p of L.plats) if (p.x + p.w > cam - 20 && p.x < cam + W + 20) SP.platform(c, lv.theme, p.x, p.y, p.w);
  L.flags.forEach(function (f) { if (f.x > cam - 60 && f.x < cam + W + 60) SP.flag(c, f.x, GROUND, g.t, f.on); });
  for (const cp of caps) if (cp.x > cam - 50 && cp.x < cam + W + 50) { if (cp.kind === 'heart') SP.heartPickup(c, cp.x, cp.y, cp.t); else SP.capsule(c, cp.x, cp.y, cp.kind, cp.t); }
  for (const e of enemies) {
    if (e.type !== 'boss' && !(e.x > cam - 80 && e.x < cam + W + 80)) continue;
    c.globalAlpha = e.hit > 0 ? 0.7 : 1;
    const ang = Math.atan2(hero.y - 30 - (e.y - 24), hero.x - e.x);
    if (e.type === 'walker') SP.walker(c, e.x, e.y, e.t, ENEMY_PAL[lv.theme % ENEMY_PAL.length]);
    else if (e.type === 'hopper') SP.hopper(c, e.x, e.y - e.hy, e.t, e.hy > 0);
    else if (e.type === 'gunner') SP.gunner(c, e.x, e.y, e.t, ang, e.charge);
    else if (e.type === 'armoured') { if (e.big) { c.save(); c.translate(e.x, e.y); c.scale(1.45, 1.45); SP.armoured(c, 0, 0, e.t, e.hp / e.maxHp); c.restore(); } else SP.armoured(c, e.x, e.y, e.t, e.hp / e.maxHp); }
    else if (e.type === 'turret') SP.turret(c, e.x, e.y, ang, e.charge, e.t);
    else if (e.type === 'flyer') SP.flyer(c, e.x, e.y, e.t);
    else if (e.type === 'bomber') SP.bomber(c, e.x, e.y, e.t, e.charge);
    else if (e.type === 'mech') SP.mech(c, e.x, e.y, e.t, { wind: e.st === 'wind' ? e.charge : 0, slam: e.slam, hurt: e.hit > 0 });
    else if (e.type === 'tank') SP.tank(c, e.x, e.y, e.t, { charge: e.charge, hurt: e.hit > 0 });
    else if (e.type === 'gunship') SP.gunship(c, e.x, e.y, e.t, { charge: e.charge, hurt: e.hit > 0 });
    else if (e.type === 'charger') SP.charger(c, e.x, e.y, e.t, { wind: e.st === 'wind' ? e.charge : 0, dash: e.st === 'dash' });
    else SP.bossDraw(c, e.kind, e.x, e.baseY, { t: e.t, hurt: e.hit > 0, pal: SP.BOSS_PALS[lv.pal], charge: e.charge, hp: e.hp / e.maxHp, scale: BOSS_SCALE, rage: e.phase === 3, phase: e.phase, acting: e.state === 'act', move: e.move });
    c.globalAlpha = 1;
  }
  for (const o of orbs) {
    if (o.rain) { c.fillStyle = 'rgba(0,0,0,' + (o.wait > 0 ? 0.25 : 0.12) + ')'; c.beginPath(); c.ellipse(o.x, GROUND + 2, 14, 4, 0, 0, 6.283); c.fill(); if (o.wait > 0) { c.globalAlpha = 0.5; SP.enemyOrb(c, o.x, 20, o.t); c.globalAlpha = 1; continue; } }
    if (o.bomb) SP.bomb(c, o.x, o.y, o.t); else SP.enemyOrb(c, o.x, o.y, o.t);
  }
  for (const f of fires) SP.firePatch(c, f.x, GROUND, g.t, f.t);
  if (boss && boss.state === 'tele' && boss.move === 'beam') { const by = GROUND - 56, bw = boss.x - 60 - cam; c.fillStyle = 'rgba(255,60,60,' + (0.25 + 0.5 * boss.charge) + ')'; c.fillRect(cam, by - 3, bw, 6); }
  if (boss && boss.beam && (boss.state === 'act' || boss.state === 'tele')) {      // laser across chest height: duck (or jump)!
    const bw = boss.x - 60 - cam, by = boss.beam.y, on = boss.state === 'act';
    if (bw > 0) { c.save(); if (on) { const bg = c.createLinearGradient(0, by - 18, 0, by + 18); bg.addColorStop(0, 'rgba(255,60,60,0)'); bg.addColorStop(0.5, 'rgba(255,230,200,.95)'); bg.addColorStop(1, 'rgba(255,60,60,0)'); c.fillStyle = bg; c.fillRect(cam, by - 18, bw, 36); c.fillStyle = '#ff4a3a'; c.fillRect(cam, by - 5, bw, 10); } c.restore(); }
  } else if (boss && boss.state === 'tele' && boss.move === 'beam') { }
  for (const w of waves) SP.shockwave(c, w.x, GROUND, w.t);
  if (hero.grounded) { c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(hero.x, hero.y + 3, 22, 5, 0, 0, 6.283); c.fill(); }
  if (rescue) { const bx = hero.x, by = hero.y - 34, rr2 = 46 + Math.sin(g.t * 8) * 2; c.fillStyle = 'rgba(160,220,255,.28)'; c.beginPath(); c.arc(bx, by, rr2, 0, 6.283); c.fill(); c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 3; c.stroke(); c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.ellipse(bx - 16, by - 22, 8, 4, -0.6, 0, 6.283); c.fill(); }
  c.globalAlpha = rescue ? 0.95 : invincible > 0 ? 0.6 + 0.2 * Math.sin(g.t * 8) : 1;
  SP.hero(c, hero.x, hero.y, { t: g.t, facing: hero.facing, aimUp: aimUp, duck: hero.duck, weapon: weapon, moving: hero.moving, air: !hero.grounded, hurt: hurtT > 0 });
  c.globalAlpha = 1;
  for (const b of bullets) SP.bullet(c, b.x, b.y, b.kind, b.a, b.t);
  if (flashT > 0) { const m = muzzle(), col = SP.WEAPON_COLORS[weapon] || '#ffe06a'; c.globalAlpha = flashT / 0.07; c.fillStyle = col; c.beginPath(); c.arc(m.x, m.y, 14, 0, 6.283); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(m.x, m.y, 7, 0, 6.283); c.fill(); c.globalAlpha = 1; }
  g.particles.draw(c);
  if (hint && !rescue) drawHint(c, hero.x, hero.y - (hero.duck ? 60 : 96), g.t);
  c.restore();
  SP.worldFront(c, W, g.H, GROUND, cam, lv.theme, g.t);
  CC.drawKeys(c, W, g.H, ['ArrowLeft', 'ArrowUp', 'ArrowDown', 'ArrowRight', 'Space']);
  // ---- HUD (pictures, almost no words) ----
  c.fillStyle = 'rgba(26,27,63,.55)'; hrr(c, 12, 10, 92, 44, 14); c.fill();
  c.font = '26px sans-serif'; c.textAlign = 'left'; c.fillStyle = '#fff'; c.fillText(th.icon, 20, 41);
  CC.outlineText(c, String(li + 1), 62, 42, 28, '#ffd23f');
  const total = Math.max(lives, COMMANDO_LIVES);
  for (let i = 0; i < total; i++) SP.heart(c, W - 24 - i * 26, 28, 20, i < lives);
  if (boss && boss.state !== 'enter' && boss.hp > 0) {
    c.fillStyle = 'rgba(26,27,63,.55)'; hrr(c, W / 2 - 130, 10, 266, 30, 12); c.fill();
    c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(W / 2 - 100, 18, 220, 14); c.fillStyle = '#ff8fb0'; c.fillRect(W / 2 - 100, 18, 220 * boss.hp / boss.maxHp, 14);
    c.strokeStyle = '#1a1b3f'; c.lineWidth = 2; c.strokeRect(W / 2 - 100, 18, 220, 14); c.fillStyle = '#1a1b3f'; c.fillRect(W / 2 - 100 + 220 / 3 - 1, 18, 2, 14); c.fillRect(W / 2 - 100 + 440 / 3 - 1, 18, 2, 14); c.font = '22px sans-serif'; c.fillStyle = '#fff'; c.fillText(boss.phase === 3 ? '😡' : '👹', W / 2 - 126, 34);
  } else {
    const bx = W / 2 - 120, bw = 240; c.fillStyle = 'rgba(26,27,63,.55)'; hrr(c, bx - 10, 12, bw + 34, 26, 12); c.fill();
    c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(bx, 21, bw, 8);
    c.fillStyle = '#ffd23f'; c.fillRect(bx, 21, bw * CC.clamp(hero.x / L.len, 0, 1), 8);
    L.flags.forEach(function (f) { c.fillStyle = f.on ? '#6bcb77' : '#fff'; c.fillRect(bx + bw * f.x / L.len - 1.5, 15, 3, 20); });
    c.font = '16px sans-serif'; c.fillStyle = '#fff'; c.fillText('👹', bx + bw + 4, 33);
    c.beginPath(); c.arc(bx + bw * CC.clamp(hero.x / L.len, 0, 1), 25, 6, 0, 6.283); c.fillStyle = '#ff6b86'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#1a1b3f'; c.stroke();
  }
  if (weapon !== 'normal') SP.capsule(c, 44, 84, weapon, g.t);
  if (bossAnnounce > 0) { c.globalAlpha = Math.min(1, bossAnnounce); c.font = '60px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#fff'; c.fillText('👹❗', W / 2, 130); c.globalAlpha = 1; }
}

function drawHint(c, x, y, t) {
  const k = hint.keys[0], w = k.length > 1 ? 74 : 40, bob = Math.sin(t * 6) * 4;
  c.save(); c.translate(x, y + bob);
  c.fillStyle = '#fff'; c.strokeStyle = '#1a1b3f'; c.lineWidth = 3; hrr(c, -w / 2, -20, w, 38, 10); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(-7, 18); c.lineTo(0, 28); c.lineTo(7, 18); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#1a1b3f'; c.font = 'bold 22px "Trebuchet MS",sans-serif'; c.textAlign = 'center'; c.fillText(k, 0, 8); c.restore();
}
function onKeyDown(g, e) {
  if (CC.MAKEY_KEYS.indexOf(e.code) >= 0) e.preventDefault();
  if (e.repeat || g.state !== 'play') return;
  if (e.code === 'ArrowUp') jumpBuf = 0.15;
  if (e.code === 'ArrowDown' && hero.grounded && hero.y < GROUND - 4) { dropT = 0.3; hero.grounded = false; hero.y += 3; }   // drop through a platform
  if (e.code === 'Space') wantFire = true;
}
CC.modes.commando = CC.makeLevelGame({
  makey: true,
  stageId: 'stage-commando', title: 'Stage', emoji: '🤖', total: COMMANDO_LEVELS.length,
  levelIcon: function (i) { return SP.THEMES[COMMANDO_LEVELS[i].theme].icon; },
  controls: [{ keys: ['←', '→'], icon: '🏃' }, { keys: ['↑'], icon: '🦘' }, { keys: ['↓'], icon: '⬇️' }, { keys: ['Space'], icon: '💥' }],
  reset: reset, update: update, draw: draw, onKeyDown: onKeyDown
});
/* test hooks (used only by the automated checks) */
CC.modes.commando._spawn = function (type, x) {
  const g = CC.modes.commando.game();
  if (type === 'boss') { spawnBoss(g); if (x != null) boss.x = x; return boss; }
  const e = mk(type, x != null ? x : hero.x + 400, type === 'flyer' ? GROUND - 60 : type === 'bomber' ? GROUND - 190 : type === 'gunship' ? GROUND - 205 : GROUND, null, lv.d, li);
  e.bx = [e.x - 400, e.x + 400]; e.act = true; enemies.push(e); return e;
};
CC.modes.commando._god = function (on) { god = !!on; };
CC.modes.commando._setWeapon = function (w) { weapon = w; };
CC.modes.commando._tp = function (x) { hero.x = x; cam = Math.max(cam, CC.clamp(x - 300, 0, L.len - W)); };
CC.modes.commando._debug = function () { return { hero: hero, cam: cam, L: L, enemies: enemies, bullets: bullets, orbs: orbs, caps: caps, lives: lives, weapon: weapon, boss: boss, waves: waves, cpX: cpX, li: li }; };
CC.modes.commando._levels = COMMANDO_LEVELS; CC.modes.commando._fires = function () { return fires; }; CC.modes.commando._hurt = hurtLog;
})();
