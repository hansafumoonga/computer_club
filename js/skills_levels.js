/* skills_levels.js - ALL the content of "Click & Type Quest" lives here as plain data.
   The engine (skills.js) never mentions a specific level, so a teacher/developer can add a level
   by adding one object to LEVELS - no engine changes needed.

   Stage units: the play area is 100 wide and 56.25 tall (typing levels: 37.5 tall). 1 unit = 1% of the stage width.
   Item: {id, e (emoji) | svg | c (balloon colour) | t (text), x, y (centre), s (size) | w,h, n (spoken name), d:1 (extra, hidden when simplifying)}
   Task: {type, say, ..., min: first year it appears (1/2/3), skill: which skill it practises, win: message}
   Task types:  move | pick | drag | connect | dbl | right | type | capsstate | enter
*/
(function () {
'use strict';
const CC = window.CC;

/* ---- tiny SVG pieces for the building games (viewBox = the piece size in stage units) ---- */
const sv = function (w, h, body) { return '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" aria-hidden="true">' + body + '</svg>'; };
const ART = {
  walls:   sv(30, 18, '<rect x=".6" y=".6" width="28.8" height="16.8" rx="1.2" fill="#f6c667" stroke="#b9822a" stroke-width="1.1"/><path d="M0 6H30M0 12H30" stroke="#e5ad4b" stroke-width=".6"/>'),
  roof:    sv(38, 13, '<polygon points="19,.7 37.3,12.3 .7,12.3" fill="#e0524f" stroke="#a23330" stroke-width="1.1" stroke-linejoin="round"/>'),
  door:    sv(6, 10,  '<rect x=".5" y=".5" width="5" height="9" rx="1" fill="#8a5a2b" stroke="#5c3a18" stroke-width=".7"/><circle cx="4.2" cy="5.4" r=".5" fill="#ffd23f"/>'),
  window:  sv(6, 6,   '<rect x=".5" y=".5" width="5" height="5" rx=".6" fill="#bfe6ff" stroke="#3b82c4" stroke-width=".7"/><path d="M3 .5V5.5M.5 3H5.5" stroke="#3b82c4" stroke-width=".5"/>'),
  chimney: sv(4, 8,   '<rect x=".4" y=".4" width="3.2" height="7.2" fill="#b5543a" stroke="#7a3320" stroke-width=".6"/><path d="M.4 2.8H3.6M.4 5.2H3.6" stroke="#7a3320" stroke-width=".4"/>'),
  carBody: sv(40, 12, '<rect x=".6" y="1" width="38.8" height="10" rx="3.5" fill="#ff5c72" stroke="#c0344c" stroke-width="1"/>'),
  carTop:  sv(22, 9,  '<path d="M.8 8.4L5 1H17L21.2 8.4Z" fill="#ff7b8e" stroke="#c0344c" stroke-width="1" stroke-linejoin="round"/>'),
  carWin:  sv(8, 6,   '<rect x=".5" y=".5" width="7" height="5" rx="1" fill="#cfefff" stroke="#3b82c4" stroke-width=".6"/>'),
  wheel:   sv(9, 9,   '<circle cx="4.5" cy="4.5" r="4" fill="#2a2a3a" stroke="#111" stroke-width=".6"/><circle cx="4.5" cy="4.5" r="1.8" fill="#c9ccd8"/>'),
  light:   sv(3, 3,   '<circle cx="1.5" cy="1.5" r="1.3" fill="#ffe27a" stroke="#d9a400" stroke-width=".3"/>'),
  lBody:   sv(30, 14, '<ellipse cx="15" cy="7" rx="14.4" ry="6.4" fill="#e8a43b" stroke="#a96b14" stroke-width=".9"/>'),
  lHead:   sv(20, 20, '<circle cx="10" cy="10" r="9.4" fill="#b8691f" stroke="#7d4510" stroke-width=".8"/><circle cx="10" cy="10.5" r="6.2" fill="#f1b94f" stroke="#a96b14" stroke-width=".6"/><ellipse cx="10" cy="13" rx="2.2" ry="1.5" fill="#7d4510"/><path d="M7.6 15.6Q10 17.3 12.4 15.6" fill="none" stroke="#7d4510" stroke-width=".5"/>'),
  lLeg:    sv(4, 8,   '<rect x=".4" y=".2" width="3.2" height="7.4" rx="1.4" fill="#e8a43b" stroke="#a96b14" stroke-width=".6"/>'),
  lTail:   sv(4, 14,  '<path d="M3 .6Q.6 6 2.2 10.5" fill="none" stroke="#a96b14" stroke-width="1"/><ellipse cx="2.2" cy="11.6" rx="1.5" ry="2.1" fill="#b8691f"/>'),
  lEar:    sv(4, 4,   '<circle cx="2" cy="2" r="1.8" fill="#f1b94f" stroke="#7d4510" stroke-width=".4"/>'),
  lEye:    sv(3, 3,   '<circle cx="1.5" cy="1.5" r="1.3" fill="#fff" stroke="#333" stroke-width=".2"/><circle cx="1.5" cy="1.5" r=".6" fill="#222"/>')
};

/* ---- the worlds: a CSS class for the sky/ground + decoration emoji [emoji, x, y, size] ---- */
const WORLD = {
  playground: { name: 'Playground',     icon: '🛝', deco: [['🌳', 8, 44, 12], ['🌳', 93, 43, 13], ['🛝', 80, 47, 8], ['🌼', 24, 51, 4], ['🌼', 60, 52, 4], ['☁️', 20, 8, 9], ['☁️', 75, 6, 7]] },
  classroom:  { name: 'Classroom',      icon: '🏫', deco: [['📚', 8, 49, 6], ['🎨', 92, 49, 6], ['🔔', 50, 6, 5], ['✏️', 22, 51, 4], ['📏', 78, 51, 4]] },
  animalpark: { name: 'Animal Park',    icon: '🦁', deco: [['🌴', 6, 42, 13], ['🌳', 94, 40, 14], ['🌿', 30, 52, 5], ['🌿', 70, 52, 5], ['☀️', 88, 7, 8]] },
  building:   { name: 'Building Site',  icon: '🏗️', deco: [['🏗️', 30, 8, 8], ['☁️', 64, 6, 7]] },
  road:       { name: 'Road World',     icon: '🚗', deco: [['☁️', 32, 7, 8], ['☁️', 70, 9, 6], ['☀️', 50, 6, 5]] },
  village:    { name: 'Village',        icon: '🏘️', deco: [['🌷', 8, 51, 5], ['🌻', 92, 51, 5], ['🌳', 50, 51, 6], ['☁️', 40, 6, 7], ['☁️', 62, 9, 6]] },
  magic:      { name: 'Magic Island',   icon: '🏝️', deco: [['🌴', 7, 40, 12], ['🌴', 93, 41, 12], ['🐚', 24, 52, 4], ['🐚', 74, 52, 4], ['⭐', 12, 8, 4], ['✨', 86, 10, 4]] },
  space:      { name: 'Space',          icon: '🚀', deco: [['🪐', 88, 12, 11], ['🌙', 10, 10, 8], ['⭐', 30, 8, 3], ['⭐', 60, 12, 3], ['⭐', 78, 30, 3], ['⭐', 20, 30, 3]] },
  fantasy:    { name: 'Cloud Kingdom',  icon: '🏰', deco: [['🏰', 90, 21, 12], ['🦄', 9, 27, 9], ['🌈', 22, 9, 10], ['☁️', 80, 7, 7]] },
  lab:        { name: 'Computer Lab',   icon: '💻', deco: [['🖥️', 8, 9, 7], ['🖥️', 92, 9, 7], ['⌨️', 50, 6, 5]] }
};

const BALL = '⚽';
const LEVELS = [
/* ================= 1 · MEET THE MOUSE ================= */
{ id: 1, title: 'Meet the Mouse', world: 'playground', badge: 'Mouse Mover', icon: '🖱️',
  intro: "Hi! I'm Buddy! 👋 Let's learn to move the mouse!",
  tasks: [
    { type: 'move', say: 'Move the mouse to the sun ☀️', win: 'Great job! ☀️', demo: true, items: [{ e: '☀️', x: 50, y: 22, s: 20, n: 'sun' }] },
    { type: 'move', say: 'Move LEFT ⬅️ to the cloud ☁️', win: 'You went left! ⬅️', items: [{ e: '☁️', x: 14, y: 30, s: 18, n: 'cloud' }] },
    { type: 'move', say: 'Move RIGHT ➡️ to the flower 🌸', win: 'You went right! ➡️', items: [{ e: '🌸', x: 86, y: 32, s: 17, n: 'flower' }] },
    { type: 'move', say: 'Move UP ⬆️ to the kite 🪁', win: 'Up, up, up! ⬆️', items: [{ e: '🪁', x: 52, y: 10, s: 16, n: 'kite' }] },
    { type: 'move', say: 'Move DOWN ⬇️ to the ball ' + BALL, win: 'Down you go! ⬇️', items: [{ e: BALL, x: 50, y: 46, s: 16, n: 'ball' }] },
    { type: 'move', say: 'Move across to the star ⭐', win: 'Excellent! ⭐', min: 2, items: [{ e: '⭐', x: 88, y: 10, s: 14, n: 'star' }] },
    { type: 'move', say: 'Follow the butterfly! 🦋', win: 'You caught the butterfly! 🦋', dwell: 1800, items: [{ e: '🦋', x: 50, y: 28, s: 17, n: 'butterfly', move: { rx: 24, ry: 9, sp: 0.55 } }] }
  ] },

/* ================= 2 · LEARN TO CLICK ================= */
{ id: 2, title: 'Learn to Click', world: 'classroom', badge: 'Click Star', icon: '👆',
  intro: 'The LEFT mouse button is for clicking. Click, click, click! 🎈',
  tasks: [
    { type: 'pick', say: 'Click the big blue balloon 🔵', win: 'Perfect! You clicked it! 🎈', demo: true, answer: ['blue'],
      items: [{ id: 'red', c: '#ef476f', x: 25, y: 30, s: 15, n: 'red balloon', d: 1 }, { id: 'blue', c: '#3b82f6', x: 50, y: 28, s: 20, n: 'blue balloon' }, { id: 'green', c: '#2fbf71', x: 76, y: 31, s: 15, n: 'green balloon', d: 1 }] },
    { type: 'pick', say: 'Click all the stars ⭐', win: 'Star collector! ⭐⭐⭐', any: true, answer: ['a', 'b', 'c', 'd'],
      items: [{ id: 'a', e: '⭐', x: 18, y: 20, s: 14, n: 'star' }, { id: 'b', e: '⭐', x: 40, y: 38, s: 14, n: 'star' }, { id: 'c', e: '⭐', x: 62, y: 18, s: 14, n: 'star' }, { id: 'd', e: '⭐', x: 82, y: 38, s: 14, n: 'star' }] },
    { type: 'pick', say: 'Click the puppy 🐶', win: 'Woof! You found the puppy! 🐶', answer: ['dog'],
      items: [{ id: 'cat', e: '🐱', x: 22, y: 30, s: 16, n: 'kitten', d: 1 }, { id: 'dog', e: '🐶', x: 50, y: 28, s: 17, n: 'puppy' }, { id: 'rab', e: '🐰', x: 78, y: 31, s: 16, n: 'bunny', d: 1 }] },
    { type: 'pick', say: 'Click the small yellow balloon 🟡', win: 'Great aim! 🎯', min: 2, answer: ['y'],
      items: [{ id: 'r', c: '#ef476f', x: 20, y: 24, s: 14, n: 'red balloon', d: 1 }, { id: 'y', c: '#ffd23f', x: 45, y: 34, s: 10, n: 'yellow balloon' }, { id: 'g', c: '#2fbf71', x: 70, y: 22, s: 14, n: 'green balloon', d: 1 }, { id: 'p', c: '#a77bff', x: 86, y: 38, s: 12, n: 'purple balloon', d: 1 }] }
  ] },

/* ================= 3 · CLICK AND CHOOSE ================= */
{ id: 3, title: 'Click and Choose', world: 'animalpark', badge: 'Super Chooser', icon: '🎯',
  intro: 'Look carefully, then click the right one! 🔎',
  tasks: [
    { type: 'pick', say: 'Click the RED apple 🍎, then the YELLOW banana 🍌', says: ['Click the RED apple 🍎', 'Now click the YELLOW banana 🍌'], win: 'Fruit salad time! 🍎🍌', answer: ['apple', 'banana'], demo: true,
      items: [{ id: 'apple', e: '🍎', x: 22, y: 30, s: 15, n: 'apple' }, { id: 'banana', e: '🍌', x: 44, y: 24, s: 15, n: 'banana' }, { id: 'grape', e: '🍇', x: 66, y: 32, s: 15, n: 'grapes', d: 1 }, { id: 'orange', e: '🍊', x: 84, y: 24, s: 15, n: 'orange', d: 1 }] },
    { type: 'pick', say: 'Click the lion 🦁', win: 'Roar! You found the lion! 🦁', answer: ['lion'],
      items: [{ id: 'mon', e: '🐵', x: 18, y: 28, s: 14, n: 'monkey', d: 1 }, { id: 'lion', e: '🦁', x: 40, y: 34, s: 15, n: 'lion' }, { id: 'ele', e: '🐘', x: 62, y: 26, s: 15, n: 'elephant', d: 1 }, { id: 'zeb', e: '🦓', x: 83, y: 34, s: 15, n: 'zebra', d: 1 }] },
    { type: 'pick', say: 'Click the triangle 🔺', win: 'Shape spotter! 🔺', answer: ['tri'],
      items: [{ id: 'cir', e: '🔵', x: 20, y: 30, s: 14, n: 'circle', d: 1 }, { id: 'sq', e: '🟥', x: 40, y: 22, s: 14, n: 'square', d: 1 }, { id: 'tri', e: '🔺', x: 60, y: 32, s: 14, n: 'triangle' }, { id: 'star', e: '⭐', x: 80, y: 24, s: 14, n: 'star', d: 1 }] },
    { type: 'pick', say: 'Click everything that is YELLOW 💛', win: 'Sunny job! 💛', any: true, answer: ['banana', 'sun', 'star'],
      items: [{ id: 'banana', e: '🍌', x: 18, y: 24, s: 13, n: 'banana' }, { id: 'sun', e: '🌻', x: 38, y: 38, s: 13, n: 'sunflower' }, { id: 'rose', e: '🌹', x: 56, y: 22, s: 13, n: 'red rose', d: 1 }, { id: 'star', e: '⭐', x: 74, y: 36, s: 13, n: 'star' }, { id: 'frog', e: '🐸', x: 88, y: 20, s: 13, n: 'green frog', d: 1 }] },
    { type: 'pick', say: 'Click 1, then 2, then 3 🔢', says: ['Click number 1', 'Now number 2', 'Now number 3'], win: 'You can count AND click! 🔢', answer: ['1', '2', '3'],
      items: [{ id: '2', t: '2', c: '#ff9f45', x: 50, y: 22, s: 14, n: 'number 2' }, { id: '3', t: '3', c: '#6bcb77', x: 80, y: 36, s: 14, n: 'number 3' }, { id: '1', t: '1', c: '#ef476f', x: 20, y: 34, s: 14, n: 'number 1' }] },
    { type: 'pick', say: 'Click 1, 2, 3, 4, 5 in order 🔢', says: ['Number 1', 'Number 2', 'Number 3', 'Number 4', 'Number 5'], win: 'Counting champion! 🔢', min: 2, answer: ['1', '2', '3', '4', '5'],
      items: [{ id: '3', t: '3', c: '#6bcb77', x: 50, y: 20, s: 11, n: 'number 3' }, { id: '5', t: '5', c: '#a77bff', x: 86, y: 28, s: 11, n: 'number 5' }, { id: '1', t: '1', c: '#ef476f', x: 14, y: 36, s: 11, n: 'number 1' }, { id: '4', t: '4', c: '#22c6c6', x: 70, y: 42, s: 11, n: 'number 4' }, { id: '2', t: '2', c: '#ff9f45', x: 32, y: 26, s: 11, n: 'number 2' }] },
    { type: 'pick', say: 'Find the hiding ladybird 🐞', win: 'Sharp eyes! 🐞', min: 2, answer: ['bug'], needLook: true,
      items: [{ id: 'l1', e: '🌿', x: 14, y: 20, s: 11, n: 'leaf' }, { id: 'l2', e: '🍃', x: 32, y: 40, s: 11, n: 'leaf' }, { id: 'l3', e: '🌿', x: 50, y: 18, s: 11, n: 'leaf' }, { id: 'l4', e: '🍃', x: 68, y: 38, s: 11, n: 'leaf' }, { id: 'l5', e: '🌿', x: 86, y: 22, s: 11, n: 'leaf' }, { id: 'bug', e: '🐞', x: 59, y: 29, s: 6, n: 'ladybird' }] }
  ] },

/* ================= 4 · DRAG AND DROP ================= */
{ id: 4, title: 'Drag and Drop', world: 'building', badge: 'Drag & Drop Champion', icon: '🏗️',
  intro: 'Move, hold the button, drag, then let go! Let us build things! 🧱',
  tasks: [
    { type: 'drag', say: 'Drag the ball into the box ⚽➡️📦', win: 'Goal! You dragged it! ⚽', demo: true, drop: 'box',
      pieces: [{ id: 'ball', e: '⚽', s: 10, x: 20, y: 28 }], zones: [{ id: 'box', for: 'ball', e: '📦', x: 76, y: 32, s: 22 }] },
    { type: 'drag', say: 'Drag the roof to the house 🏠', win: 'Amazing! You built a house! 🏠⭐⭐⭐', demo: true, drop: 'house', scene: 'House',
      pieces: [
        { id: 'roof', svg: ART.roof, w: 38, h: 13, z: 3 }, { id: 'walls', svg: ART.walls, w: 30, h: 18, z: 1 }, { id: 'door', svg: ART.door, w: 6, h: 10, z: 2 },
        { id: 'win1', kind: 'window', svg: ART.window, w: 6, h: 6, z: 2 },
        { id: 'win2', kind: 'window', svg: ART.window, w: 6, h: 6, z: 2, min: 2 }, { id: 'chim', svg: ART.chimney, w: 4, h: 8, z: 0, min: 2 },
        { id: 'sun', e: '☀️', s: 11, z: 1, min: 3 }, { id: 'tree', e: '🌳', s: 14, z: 1, min: 3 }],
      zones: [
        { for: 'roof', x: 44, y: 22.5 }, { for: 'walls', x: 44, y: 38 }, { for: 'door', x: 44, y: 42 }, { for: 'win1', x: 34.5, y: 35 }, { for: 'win2', x: 53.5, y: 35, min: 2 },
        { for: 'chim', x: 54, y: 19.5, min: 2 }, { for: 'sun', x: 68, y: 10, min: 3 }, { for: 'tree', x: 69, y: 40, min: 3 }] },
    { type: 'drag', say: 'Plant the garden 🌻 Drag each flower to the soil', win: 'Beautiful garden! 🌻🌷🌹', min: 2, drop: 'garden', scene: 'Garden',
      base: [{ e: '', x: 50, y: 48, w: 46, h: 6, cls: 'soil' }],
      pieces: [{ id: 'f1', kind: 'flower', e: '🌻', s: 9 }, { id: 'f2', kind: 'flower', e: '🌷', s: 9 }, { id: 'f3', kind: 'flower', e: '🌹', s: 9 }, { id: 'tr', e: '🌳', s: 13 }, { id: 'sun', e: '☀️', s: 11 }, { id: 'can', e: '🚿', s: 9 }],
      zones: [{ for: 'f1', x: 36, y: 46 }, { for: 'f2', x: 50, y: 46 }, { for: 'f3', x: 64, y: 46 }, { for: 'tr', x: 66, y: 33 }, { for: 'sun', x: 50, y: 10 }, { for: 'can', x: 34, y: 37 }] }
  ] },

/* ================= 5 · BUILD A CAR ================= */
{ id: 5, title: 'Build and Drive', world: 'road', badge: 'Master Builder', icon: '🚗',
  intro: 'More building! Hold, drag and let go in the right spot. 🚗',
  tasks: [
    { type: 'drag', say: 'Build a car! 🚗 Drag the wheels to the car', win: 'Vroom vroom! You built a car! 🚗⭐⭐⭐', drop: 'car', scene: 'Car',
      base: [{ e: '', x: 50, y: 53, w: 52, h: 5, cls: 'road' }],
      pieces: [{ id: 'body', svg: ART.carBody, w: 40, h: 12, z: 1 }, { id: 'w1', kind: 'wheel', svg: ART.wheel, w: 9, h: 9, z: 3 }, { id: 'w2', kind: 'wheel', svg: ART.wheel, w: 9, h: 9, z: 3 },
        { id: 'top', svg: ART.carTop, w: 22, h: 9, z: 0 }, { id: 'c1', kind: 'win', svg: ART.carWin, w: 8, h: 6, z: 2, min: 2 }, { id: 'light', svg: ART.light, w: 3, h: 3, z: 2, min: 2 }],
      zones: [{ for: 'body', x: 50, y: 44 }, { for: 'w1', x: 38, y: 50 }, { for: 'w2', x: 62, y: 50 }, { for: 'top', x: 50, y: 34.5 }, { for: 'c1', x: 50, y: 36.5, min: 2 }, { for: 'light', x: 68, y: 43, min: 2 }] },
    { type: 'drag', say: 'Build the farm 🚜 Drag the animals to the farm', win: 'What a lovely farm! 🐄🐔🚜', min: 2, drop: 'farm', scene: 'Farm',
      base: [{ e: '', x: 50, y: 50, w: 52, h: 14, cls: 'grass' }],
      pieces: [{ id: 'cow', e: '🐄', s: 11 }, { id: 'hen', e: '🐔', s: 9 }, { id: 'trac', e: '🚜', s: 12 }, { id: 'tree', e: '🌳', s: 13 }, { id: 'fence', e: '🚧', s: 9 }, { id: 'corn', e: '🌽', s: 9 }],
      zones: [{ for: 'cow', x: 40, y: 41 }, { for: 'hen', x: 50, y: 47 }, { for: 'trac', x: 62, y: 41 }, { for: 'tree', x: 70, y: 27 }, { for: 'fence', x: 31, y: 46 }, { for: 'corn', x: 71, y: 49 }] },
    { type: 'drag', say: 'Build a lion 🦁 Put the pieces in the right place', win: 'ROAR! You built a lion! 🦁⭐⭐⭐', min: 3, drop: 'lion', scene: 'Lion',
      pieces: [{ id: 'body', svg: ART.lBody, w: 30, h: 14, z: 1 }, { id: 'head', svg: ART.lHead, w: 20, h: 20, z: 3 }, { id: 'leg1', kind: 'leg', svg: ART.lLeg, w: 4, h: 8, z: 0 }, { id: 'leg2', kind: 'leg', svg: ART.lLeg, w: 4, h: 8, z: 0 },
        { id: 'tail', svg: ART.lTail, w: 4, h: 14, z: 0 }, { id: 'ear1', kind: 'ear', svg: ART.lEar, w: 4, h: 4, z: 4 }, { id: 'ear2', kind: 'ear', svg: ART.lEar, w: 4, h: 4, z: 4 },
        { id: 'eye1', kind: 'eye', svg: ART.lEye, w: 3, h: 3, z: 5 }, { id: 'eye2', kind: 'eye', svg: ART.lEye, w: 3, h: 3, z: 5 }],
      zones: [{ for: 'body', x: 43, y: 36 }, { for: 'head', x: 63, y: 28 }, { for: 'leg1', x: 33, y: 45 }, { for: 'leg2', x: 51, y: 45 }, { for: 'tail', x: 27.5, y: 33 },
        { for: 'ear1', x: 56.5, y: 20.5 }, { for: 'ear2', x: 69.5, y: 20.5 }, { for: 'eye1', x: 59.5, y: 27 }, { for: 'eye2', x: 66.5, y: 27 }] }
  ] },

/* ================= 6 · CONNECT THE PIECES ================= */
{ id: 6, title: 'Connect Them', world: 'village', badge: 'Connector', icon: '🔗',
  intro: 'Press on a picture, hold, and drag a line to its partner! 🔗',
  tasks: [
    { type: 'connect', say: 'Connect each animal to its home 🏠', win: 'Everyone is home! 🏠', demo: true,
      left: [{ id: 'dog', e: '🐶', n: 'puppy' }, { id: 'fish', e: '🐟', n: 'fish' }, { id: 'bird', e: '🐦', n: 'bird' }],
      right: [{ id: 'water', e: '🌊', n: 'sea' }, { id: 'tree', e: '🌳', n: 'tree' }, { id: 'house', e: '🏠', n: 'house' }],
      pairs: { dog: 'house', fish: 'water', bird: 'tree' } },
    { type: 'connect', say: 'Connect the matching colours 🎨', win: 'Colour match! 🎨',
      left: [{ id: 'r', e: '🔴', n: 'red' }, { id: 'y', e: '🟡', n: 'yellow' }, { id: 'g', e: '🟢', n: 'green' }],
      right: [{ id: 'frog', e: '🐸', n: 'green frog' }, { id: 'apple', e: '🍎', n: 'red apple' }, { id: 'ban', e: '🍌', n: 'yellow banana' }],
      pairs: { r: 'apple', y: 'ban', g: 'frog' } },
    { type: 'connect', say: 'Connect each one to its shadow 👤', win: 'Shadow match! 👤', min: 2,
      left: [{ id: 'ele', e: '🐘', n: 'elephant' }, { id: 'car', e: '🚗', n: 'car' }, { id: 'rock', e: '🚀', n: 'rocket' }],
      right: [{ id: 'rock', e: '🚀', n: 'rocket shadow', shadow: 1 }, { id: 'ele', e: '🐘', n: 'elephant shadow', shadow: 1 }, { id: 'car', e: '🚗', n: 'car shadow', shadow: 1 }],
      pairs: { ele: 'ele', car: 'car', rock: 'rock' } },
    { type: 'connect', say: 'Connect each animal to its food 🍽️', win: 'Yum yum! 🍽️', min: 3,
      left: [{ id: 'rab', e: '🐰', n: 'rabbit' }, { id: 'mon', e: '🐵', n: 'monkey' }, { id: 'dog', e: '🐶', n: 'puppy' }, { id: 'cat', e: '🐱', n: 'kitten' }],
      right: [{ id: 'fish', e: '🐟', n: 'fish' }, { id: 'bone', e: '🦴', n: 'bone' }, { id: 'carrot', e: '🥕', n: 'carrot' }, { id: 'ban', e: '🍌', n: 'banana' }],
      pairs: { rab: 'carrot', mon: 'ban', dog: 'bone', cat: 'fish' } }
  ] },

/* ================= 7 · DOUBLE-CLICK & RIGHT-CLICK ================= */
{ id: 7, title: 'Click Click!', world: 'magic', badge: 'Treasure Hunter', icon: '🎁',
  intro: 'Some things open with TWO fast clicks. Ready for treasure? 🎁',
  tasks: [
    { type: 'dbl', say: 'Double-click the treasure box 🎁 Click, click!', win: 'You opened it! 💎', demo: true, reveal: '💎', item: { e: '🎁', x: 50, y: 30, s: 22, n: 'treasure box' } },
    { type: 'dbl', say: 'Double-click the treasure again! 🎁', win: 'Shiny! 👑', reveal: '👑', item: { e: '🎁', x: 24, y: 34, s: 18, n: 'treasure box' } },
    { type: 'dbl', say: 'One more! Double-click! 🎁', win: 'Treasure hunter! 🏆', min: 2, reveal: '🏆', item: { e: '🎁', x: 76, y: 24, s: 15, n: 'treasure box' } },
    { type: 'right', say: 'Right-click the treasure box 🎁 to open the magic menu', win: 'Magic! ✨ The right button opens menus.', min: 3, demo: true, reveal: '✨', item: { e: '🎁', x: 40, y: 30, s: 20, n: 'treasure box' } }
  ] },

/* ================= 8 · FIND THE KEYS ================= */
{ id: 8, title: 'Find the Keys', world: 'space', badge: 'Key Finder', icon: '🔤', kb: true,
  intro: 'Your keyboard has lots of keys. Let us find some letters! 🚀',
  tasks: [
    { type: 'type', say: 'Find the letter A on your keyboard ⌨️', target: 'A', find: true, win: 'You found A! ⭐', skill: 'keys' },
    { type: 'type', say: 'Find the letter S', target: 'S', find: true, win: 'You found S! ⭐', skill: 'keys' },
    { type: 'type', say: 'Type the letters B, C, D', target: 'BCD', find: true, win: 'B C D! Well done! ⭐', skill: 'keys' },
    { type: 'type', say: 'Type the letters M, N, O', target: 'MNO', find: true, win: 'M N O! Great! ⭐', skill: 'keys' },
    { type: 'type', say: 'Type the letters E, F, G, H', target: 'EFGH', find: true, min: 2, win: 'Letters everywhere! ⭐', skill: 'keys' }
  ] },

/* ================= 9 · BIG AND SMALL LETTERS ================= */
{ id: 9, title: 'Big and Small', world: 'fantasy', badge: 'CAPS LOCK Wizard', icon: '🔠', kb: true,
  intro: 'Letters can be small (a) or BIG (A). CAPS LOCK makes them BIG! 🦄',
  tasks: [
    { type: 'type', say: 'Type the small letter  a', target: 'a', exact: true, win: 'A small a! ⭐', skill: 'keys' },
    { type: 'type', say: 'Type the small letters  b c', target: 'bc', exact: true, win: 'Small b and c! ⭐', skill: 'keys' },
    { type: 'type', say: 'Type the BIG letter  A', target: 'A', exact: true, min: 2, win: 'A BIG A! ⭐', skill: 'caps' },
    { type: 'type', say: 'Type the BIG letters  B C', target: 'BC', exact: true, min: 2, win: 'BIG B and C! ⭐', skill: 'caps' },
    { type: 'capsstate', say: 'Press CAPS LOCK to make letters BIG', want: true, min: 3, win: 'CAPS LOCK is ON! 💡', skill: 'caps' },
    { type: 'type', say: 'Make the word BIG! Type  CAT', show: 'cat', target: 'CAT', exact: true, min: 3, win: 'CAT! Big letters! 🐱', skill: 'caps' },
    { type: 'capsstate', say: 'Press CAPS LOCK again to make letters small', want: false, min: 3, win: 'CAPS LOCK is OFF! ⭐', skill: 'caps' },
    { type: 'type', say: 'Make the letters small! Type  cat', show: 'CAT', target: 'cat', exact: true, min: 3, win: 'cat! Small letters! 🐱', skill: 'caps' }
  ] },

/* ================= 10 · TYPING WORDS ================= */
{ id: 10, title: 'Word Adventure', world: 'lab', badge: 'Typing Hero', icon: '⌨️', kb: true,
  intro: 'Type whole words! Space, Backspace and Enter will help you. 💻',
  tasks: [
    { type: 'type', say: 'Type the word:  CAT', target: 'CAT', find: true, win: 'You typed CAT! 🐱', skill: 'words' },
    { type: 'type', say: 'Type the word:  SUN', target: 'SUN', find: true, win: 'You typed SUN! ☀️', skill: 'words' },
    { type: 'type', say: 'Type the word:  DOG', target: 'DOG', find: true, win: 'You typed DOG! 🐶', skill: 'words' },
    { type: 'type', say: 'Type the word:  CAR', target: 'CAR', find: true, min: 2, win: 'You typed CAR! 🚗', skill: 'words' },
    { type: 'type', say: 'Type the word:  BALL', target: 'BALL', find: true, min: 2, win: 'You typed BALL! ⚽', skill: 'words' },
    { type: 'type', say: 'Type the word:  BOOK', target: 'BOOK', find: true, min: 2, win: 'You typed BOOK! 📖', skill: 'words' },
    { type: 'type', say: 'Type the word:  FARM', target: 'FARM', find: true, min: 2, win: 'You typed FARM! 🚜', skill: 'words' },
    { type: 'type', say: 'Type the word:  TREE', target: 'TREE', find: true, min: 3, win: 'You typed TREE! 🌳', skill: 'words' },
    { type: 'type', say: 'Type the word:  HOME', target: 'HOME', find: true, min: 3, win: 'You typed HOME! 🏠', skill: 'words' },
    { type: 'type', say: 'Type the word:  SCHOOL', target: 'SCHOOL', find: true, min: 3, win: 'You typed SCHOOL! 🏫', skill: 'words' },
    { type: 'type', say: 'Type TWO words. Press SPACE between them  ␣', target: 'CAT DOG', find: true, min: 3, win: 'Two words! The SPACE bar made a gap! ⭐', skill: 'special', spaceDemo: true },
    { type: 'type', say: 'Oops! One extra letter. Use BACKSPACE ⌫ to fix it', target: 'CAT', prefill: 'CATT', find: true, min: 3, win: 'Fixed! BACKSPACE takes a letter away. ⭐', skill: 'special' },
    { type: 'type', say: 'Type the sentence:  I SEE A CAT', target: 'I SEE A CAT', find: true, min: 3, win: 'A whole sentence! 🎉', skill: 'words' },
    { type: 'enter', say: 'Press ENTER to start the adventure! 🚀', win: 'ENTER sends you on! 🚀', skill: 'special' }
  ] }
];

CC.SKILLS = { NAME: 'Click & Type Quest', LEVELS: LEVELS, WORLD: WORLD, ART: ART };
})();
