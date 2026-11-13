/* desktop_levels.js - ALL the content of "Desktop Skills" lives here as plain data. The engine (desktop.js) never mentions a level.

   A level:  { id, title, icon, gem (see skills_gems.js), intro, tasks: [ ... ], min (first school year that gets the level; the pro levels 9 to 13 use 4), pro (true = real-computer level: Start menu, search, snipping and recording tools on the bar) }
   A task:   { say: the short instruction, sub: a smaller second line (optional), win: the cheer, y6: { say, sub } (a shorter line for Year 6 that does not name the keys),
               choices + answer: a keys quiz (pick the right keycaps) instead of goal,
               min / max: first and last school year it appears in (1 to 6; leave out for every year),
               scene: the desktop to start from (leave it out to carry on from the last task),
               hint: a CSS selector (or a list) for what should glow, goal: function (ev, o) -> true when the task is done,
               oops: function (ev, o) -> a short message for a mistake (optional) }
   A scene:  { files: [ F(id, name, icon, kind, parent) ], wins: [ { ref, g: [x, y, w, h], min, max } ], target: [x, y, w, h], edit: id }
             parent is 'desk', a folder id, or 'bin'. kind is folder | pic | doc | song | junk.
             g is a box in fractions of the desktop (0 to 1). ref is 'f:<folder id>' (a folder window), 'v:<file id>' (a picture or
             document window) or 'b:bin' (the Recycle Bin window).
   An event (ev) that goal() sees:
     open {id, ref}  close {ref}  min {ref}  restore {ref}  max {ref, via}  unmax {ref}  front {ref}
     move {ref}  resize {ref, w, h, w0, h0}  newfolder {id, via}  rename {id, name}  drop {id, to}
     delete {id, ids}  restoreBin {id, ids}  empty {}  copy {id, ids}  cut {id, ids}  paste {id, ids, src, to, cut, via}  drop {id, ids, to}
     select {ids, via: click | ctrl | shift | key | box | menu}  undo {}  snap {ref, side: left | right | top}  searchopen {via}  search {q}  searchpick {id, q}
     snip {full, over: [window refs inside the box]}  record {on}  recordstop {secs, opened}  uninstall {id, via: menu | settings}  settings {}  pick {value}
   o gives goal() the state:  o.file(id)  o.kids(id)  o.wins()  o.win(ref)  o.centerIn(ref, g)  o.near(ref, g)  o.all(ids, parent)
   To add a level: add one object to LEVELS below. */
(function () {
'use strict';
const CC = window.CC;
const F = function (id, name, ico, kind, parent) { return { id: id, name: name, ico: ico, kind: kind, parent: parent || 'desk' }; };
const DOG = function (p) { return F('p1', 'Dog', '🐶', 'pic', p); }, SUN = function (p) { return F('p2', 'Sun', '☀️', 'pic', p); }, CAT = function (p) { return F('p3', 'Cat', '🐱', 'pic', p); };
const STORY = function (p) { return F('d1', 'Story', '📄', 'doc', p); }, HW = function (p) { return F('d2', 'Homework', '📝', 'doc', p); };
const SONG = function (p) { return F('s1', 'Song', '🎵', 'song', p); }, TUNE = function (p) { return F('s2', 'Tune', '🎵', 'song', p); };
const OLD = function (p) { return F('j1', 'Old file', '📃', 'junk', p); }, OLD2 = function (p) { return F('j2', 'Old copy', '📃', 'junk', p); }, OLD3 = function (p) { return F('j3', 'Old photo', '📃', 'junk', p); };
const BIGWIN = [0.1, 0.06, 0.62, 0.72];
const same = function (a, b) { return String(a || '').toUpperCase() === b; };
const APP = function (id, name, ico, size) { return { id: id, name: name, ico: ico, kind: 'app', parent: 'desk', size: size }; };
const sameSet = function (a, b) { a = a || []; return a.length === b.length && b.every(function (x) { return a.indexOf(x) >= 0; }); };

const LEVELS = [
/* ================= 1 · OPEN AND CLOSE ================= */
{ id: 1, title: 'Open & Close', icon: '🪟', gem: 'garnet', intro: 'Folders and files open in WINDOWS.',
  tasks: [
    { say: 'Double-click the folder', win: 'It opened in a window!', hint: '.dk-ico[data-id="f1"]',
      scene: { files: [F('f1', 'My Folder', '📁', 'folder'), DOG('f1'), STORY('f1')], wins: [] },
      goal: function (ev) { return ev.t === 'open' && ev.id === 'f1'; } },
    { say: 'Click the red ✖ to close the window', win: 'Closed! The red ✖ closes a window.', hint: '.dk-win .b-cls',
      scene: { files: [F('f1', 'My Folder', '📁', 'folder'), DOG('f1'), STORY('f1')], wins: [{ ref: 'f:f1' }] },
      goal: function (ev) { return ev.t === 'close'; } },
    { say: 'Double-click the picture', win: 'A picture window!', hint: '.dk-win .dk-ico[data-id="p1"]',
      scene: { files: [F('f1', 'My Folder', '📁', 'folder'), DOG('f1'), STORY('f1')], wins: [{ ref: 'f:f1' }] },
      goal: function (ev) { return ev.t === 'open' && ev.id === 'p1'; } },
    { say: 'Close the picture window', win: 'Closed!', hint: '[data-w="v:p1"] .b-cls',
      scene: { files: [F('f1', 'My Folder', '📁', 'folder'), DOG('f1'), STORY('f1')], wins: [{ ref: 'f:f1', g: [0.08, 0.08, 0.5, 0.6] }, { ref: 'v:p1', g: [0.34, 0.2, 0.46, 0.58] }] },
      goal: function (ev) { return ev.t === 'close' && ev.ref === 'v:p1'; } },
    { say: 'Close all the windows', win: 'All closed!', min: 2, max: 3, hint: '.dk-win .b-cls',
      scene: { files: [F('f1', 'My Folder', '📁', 'folder'), DOG('f1'), STORY('f1')], wins: [{ ref: 'f:f1', g: [0.06, 0.06, 0.5, 0.6] }, { ref: 'v:p1', g: [0.26, 0.18, 0.4, 0.5] }, { ref: 'v:d1', g: [0.46, 0.28, 0.4, 0.5] }] },
      goal: function (ev, o) { return ev.t === 'close' && o.wins().length === 0; } },
    /* Years 4 to 6 */
    { say: 'Click the Story, then press ENTER to open it', sub: 'No double-click this time', win: 'Opened with the keyboard!', min: 4, hint: '.dk-win .dk-ico[data-id="d1"]',
      scene: { files: [F('f1', 'My Folder', '📁', 'folder'), DOG('f1'), SUN('f1'), STORY('f1')], wins: [{ ref: 'f:f1', g: [0.04, 0.06, 0.3, 0.7] }] },
      goal: function (ev) { return ev.t === 'open' && ev.id === 'd1' && ev.via === 'key'; },
      oops: function (ev) { return ev.t === 'open' && ev.via !== 'key' ? 'Use the ENTER key this time. Press ↺ to try again.' : ''; } },
    { say: 'Open all three pictures', win: 'Three windows are open!', min: 4, hint: '.dk-win .dk-ico',
      scene: { files: [F('f1', 'My Folder', '📁', 'folder'), DOG('f1'), SUN('f1'), CAT('f1')], wins: [{ ref: 'f:f1', g: [0.64, 0.06, 0.34, 0.86] }] },
      goal: function (ev, o) { return ev.t === 'open' && !!o.win('v:p1') && !!o.win('v:p2') && !!o.win('v:p3'); } },
    { say: 'Close all the windows', win: 'All closed!', min: 4, hint: '.dk-win .b-cls',
      goal: function (ev, o) { return ev.t === 'close' && o.wins().length === 0; } }
  ] },

/* ================= 2 · HIDE AND SHOW ================= */
{ id: 2, title: 'Hide & Show', icon: '🫥', gem: 'peridot', intro: 'A window can hide on the bar, or grow big.',
  tasks: [
    { say: 'Click  —  to hide the window', win: 'Hidden! It waits on the bar below.', max: 3, hint: '.dk-win .b-min',
      scene: { files: [F('f1', 'My Folder', '📁', 'folder'), DOG('f1'), SUN('f1')], wins: [{ ref: 'f:f1', g: [0.12, 0.08, 0.6, 0.68] }] },
      goal: function (ev) { return ev.t === 'min'; } },
    { say: 'Click the folder on the bar to bring it back', win: 'It is back!', max: 3, hint: '.dk-tb',
      scene: { files: [F('f1', 'My Folder', '📁', 'folder'), DOG('f1'), SUN('f1')], wins: [{ ref: 'f:f1', g: [0.12, 0.08, 0.6, 0.68], min: true }] },
      goal: function (ev) { return ev.t === 'restore'; } },
    { say: 'Click  ▢  to make the window BIG', win: 'Nice and big!', max: 3, hint: '.dk-win .b-max',
      scene: { files: [F('f1', 'My Folder', '📁', 'folder'), DOG('f1'), SUN('f1')], wins: [{ ref: 'f:f1', g: [0.12, 0.08, 0.6, 0.68] }] },
      goal: function (ev) { return ev.t === 'max'; } },
    { say: 'Click  ❐  to make it small again', win: 'Small again!', max: 3, hint: '.dk-win .b-max',
      scene: { files: [F('f1', 'My Folder', '📁', 'folder'), DOG('f1'), SUN('f1')], wins: [{ ref: 'f:f1', g: [0.12, 0.08, 0.6, 0.68], max: true }] },
      goal: function (ev) { return ev.t === 'unmax'; } },
    { say: 'Hide BOTH windows', win: 'Both are hiding on the bar!', min: 4, hint: '.dk-win .b-min',
      scene: { files: [F('f1', 'Pictures', '📁', 'folder'), F('f2', 'Music', '📁', 'folder'), DOG('f1'), SUN('f1'), SONG('f2')], wins: [{ ref: 'f:f1', g: [0.05, 0.08, 0.45, 0.6] }, { ref: 'f:f2', g: [0.42, 0.2, 0.45, 0.6] }] },
      goal: function (ev, o) { return ev.t === 'min' && o.wins().every(function (w) { return w.min; }); } },
    { say: 'Bring BOTH windows back from the bar', win: 'Both are back!', min: 4, hint: '.dk-tb',
      scene: { files: [F('f1', 'Pictures', '📁', 'folder'), F('f2', 'Music', '📁', 'folder'), DOG('f1'), SUN('f1'), SONG('f2')], wins: [{ ref: 'f:f1', g: [0.05, 0.08, 0.45, 0.6], min: true }, { ref: 'f:f2', g: [0.42, 0.2, 0.45, 0.6], min: true }] },
      goal: function (ev, o) { return ev.t === 'restore' && o.wins().every(function (w) { return !w.min; }); } },
    { say: 'Double-click the title bar to make it BIG', sub: 'It is a quick way!', win: 'A quick way!', min: 3, hint: '.dk-win .dk-title',
      scene: { files: [F('f1', 'My Folder', '📁', 'folder'), DOG('f1'), SUN('f1')], wins: [{ ref: 'f:f1', g: [0.12, 0.08, 0.6, 0.68] }] },
      goal: function (ev) { return ev.t === 'max' && ev.via === 'title'; } },
    { say: 'Double-click the title bar to make it small again', win: 'Small again!', min: 4, hint: '.dk-win .dk-title',
      scene: { files: [F('f1', 'My Folder', '📁', 'folder'), DOG('f1'), SUN('f1')], wins: [{ ref: 'f:f1', g: [0.12, 0.08, 0.6, 0.68], max: true }] },
      goal: function (ev) { return ev.t === 'unmax' && ev.via === 'title'; } }
  ] },

/* ================= 3 · MOVE AND RESIZE ================= */
{ id: 3, title: 'Move & Resize', icon: '↔️', gem: 'moonstone', intro: 'Drag a window to move it. Drag its corner to change its size.',
  tasks: [
    { say: 'Drag the window to the dotted box', sub: 'Hold the top bar', win: 'You moved it!', hint: ['.dk-win .dk-title', '.dk-target'],
      scene: { files: [F('f1', 'My Folder', '📁', 'folder'), DOG('f1')], wins: [{ ref: 'f:f1', g: [0.04, 0.1, 0.36, 0.5] }], target: [0.54, 0.14, 0.4, 0.58] },
      goal: function (ev, o) { return ev.t === 'move' && o.centerIn(ev.ref, [0.54, 0.14, 0.4, 0.58]); } },
    { say: 'Drag the corner to make it BIGGER', win: 'Bigger!', min: 2, max: 3, hint: '.dk-grip',
      scene: { files: [F('f1', 'My Folder', '📁', 'folder'), DOG('f1')], wins: [{ ref: 'f:f1', g: [0.06, 0.08, 0.34, 0.44] }] },
      goal: function (ev) { return ev.t === 'resize' && ev.w >= ev.w0 * 1.3; } },
    { say: 'Drag the corner to make it SMALLER', win: 'Smaller!', min: 2, max: 3, hint: '.dk-grip',
      scene: { files: [F('f1', 'My Folder', '📁', 'folder'), DOG('f1')], wins: [{ ref: 'f:f1', g: [0.06, 0.08, 0.72, 0.84] }] },
      goal: function (ev) { return ev.t === 'resize' && ev.w <= ev.w0 * 0.75; } },
    { say: 'Make the window fit the dotted box', sub: 'Move it, then pull the corner', win: 'A perfect fit!', min: 3, hint: ['.dk-win .dk-title', '.dk-grip', '.dk-target'],
      scene: { files: [F('f1', 'My Folder', '📁', 'folder'), DOG('f1')], wins: [{ ref: 'f:f1', g: [0.04, 0.1, 0.3, 0.42] }], target: [0.5, 0.1, 0.46, 0.66] },
      goal: function (ev, o) { return (ev.t === 'move' || ev.t === 'resize') && o.near(ev.ref, [0.5, 0.1, 0.46, 0.66]); } },
    { say: 'Stretch the window to fill the whole desktop', sub: 'Drag the corner. Do not use the ▢ button.', win: 'Huge!', min: 4, hint: '.dk-grip',
      scene: { files: [F('f1', 'My Folder', '📁', 'folder'), DOG('f1')], wins: [{ ref: 'f:f1', g: [0.03, 0.05, 0.3, 0.4] }] },
      goal: function (ev, o) { return ev.t === 'resize' && o.near(ev.ref, [0.02, 0.02, 0.96, 0.92]); },
      oops: function (ev) { return ev.t === 'max' ? 'Use the corner, not the ▢ button.' : ''; } },
    { say: 'Pictures on the LEFT. Music on the RIGHT.', sub: 'Move each window to its side', win: 'Side by side!', min: 4, hint: '.dk-win .dk-title',
      scene: { files: [F('f1', 'Pictures', '📁', 'folder'), F('f2', 'Music', '📁', 'folder'), DOG('f1'), SONG('f2')], wins: [{ ref: 'f:f1', g: [0.55, 0.12, 0.38, 0.55] }, { ref: 'f:f2', g: [0.07, 0.12, 0.38, 0.55] }] },
      goal: function (ev, o) { return ev.t === 'move' && o.centerIn('f:f1', [0, 0, 0.5, 1]) && o.centerIn('f:f2', [0.5, 0, 0.5, 1]); } }
  ] },

/* ================= 4 · MANY WINDOWS ================= */
{ id: 4, title: 'Many Windows', icon: '🗂️', gem: 'tanzanite', intro: 'Windows can sit on top of each other.',
  tasks: [
    { say: 'Click the window at the BACK', sub: 'Bring it to the front', win: 'Now it is in front!', max: 3, hint: '[data-w="v:d1"]',
      scene: { files: [F('f1', 'Pictures', '📁', 'folder'), DOG('f1'), SUN('f1'), STORY('desk')], wins: [{ ref: 'v:d1', g: [0.06, 0.08, 0.5, 0.58] }, { ref: 'f:f1', g: [0.3, 0.22, 0.5, 0.58] }] },
      goal: function (ev) { return ev.t === 'front' && ev.ref === 'v:d1'; } },
    { say: 'Close the window in front', win: 'Closed! The other one is waiting.', max: 3, hint: '[data-w="f:f1"] .b-cls',
      scene: { files: [F('f1', 'Pictures', '📁', 'folder'), DOG('f1'), SUN('f1'), STORY('desk')], wins: [{ ref: 'v:d1', g: [0.06, 0.08, 0.5, 0.58] }, { ref: 'f:f1', g: [0.3, 0.22, 0.5, 0.58] }] },
      goal: function (ev) { return ev.t === 'close' && ev.ref === 'f:f1'; } },
    { say: 'Use the bar to open the Song window', win: 'You switched windows!', min: 2, hint: '.dk-tb[data-w="v:s1"]',
      scene: { files: [F('f1', 'Pictures', '📁', 'folder'), DOG('f1'), SONG('desk'), STORY('desk')], wins: [{ ref: 'v:s1', g: [0.4, 0.3, 0.4, 0.5], min: true }, { ref: 'v:d1', g: [0.06, 0.08, 0.5, 0.58] }, { ref: 'f:f1', g: [0.3, 0.2, 0.5, 0.58] }] },
      goal: function (ev) { return (ev.t === 'restore' || ev.t === 'front') && ev.ref === 'v:s1'; } },
    { say: 'Close all the windows', win: 'A clean desktop!', min: 3, max: 3, hint: '.dk-win .b-cls',
      scene: { files: [F('f1', 'Pictures', '📁', 'folder'), DOG('f1'), SONG('desk'), STORY('desk')], wins: [{ ref: 'v:s1', g: [0.4, 0.3, 0.4, 0.5] }, { ref: 'v:d1', g: [0.06, 0.08, 0.5, 0.58] }, { ref: 'f:f1', g: [0.3, 0.2, 0.5, 0.58] }] },
      goal: function (ev, o) { return ev.t === 'close' && o.wins().length === 0; } },
    { say: 'Close the Story window. It is hiding at the back!', win: 'Found it!', min: 4, hint: '[data-w="v:d1"] .b-cls',
      scene: { files: [F('f1', 'Pictures', '📁', 'folder'), DOG('f1'), SUN('f1'), STORY('desk'), SONG('desk')], wins: [{ ref: 'v:d1', g: [0.04, 0.06, 0.45, 0.5] }, { ref: 'v:s1', g: [0.2, 0.2, 0.45, 0.5] }, { ref: 'f:f1', g: [0.38, 0.32, 0.45, 0.5] }] },
      goal: function (ev) { return ev.t === 'close' && ev.ref === 'v:d1'; },
      oops: function (ev) { return ev.t === 'close' && ev.ref !== 'v:d1' ? 'Not that one! Find the STORY window.' : ''; } },
    { say: 'Close both pictures. Keep the Story open.', win: 'Just the Story is left!', min: 4, hint: ['[data-w="v:p1"] .b-cls', '[data-w="v:p2"] .b-cls'],
      scene: { files: [DOG('desk'), SUN('desk'), STORY('desk')], wins: [{ ref: 'v:p1', g: [0.04, 0.06, 0.42, 0.5] }, { ref: 'v:d1', g: [0.3, 0.16, 0.42, 0.5] }, { ref: 'v:p2', g: [0.5, 0.28, 0.42, 0.5] }] },
      goal: function (ev, o) { return ev.t === 'close' && !o.win('v:p1') && !o.win('v:p2') && !!o.win('v:d1'); },
      oops: function (ev) { return ev.t === 'close' && ev.ref === 'v:d1' ? 'Keep the Story open! Press ↺ to try again.' : ''; } },
    { say: 'Hide every window except the Song', win: 'Only the Song is showing!', min: 4, hint: ['[data-w="v:p1"] .b-min', '[data-w="v:d1"] .b-min'],
      scene: { files: [DOG('desk'), STORY('desk'), SONG('desk')], wins: [{ ref: 'v:p1', g: [0.04, 0.06, 0.42, 0.5] }, { ref: 'v:s1', g: [0.3, 0.16, 0.42, 0.5] }, { ref: 'v:d1', g: [0.5, 0.28, 0.42, 0.5] }] },
      goal: function (ev, o) { return ev.t === 'min' && !!o.win('v:s1') && !o.win('v:s1').min && !!o.win('v:p1').min && !!o.win('v:d1').min; },
      oops: function (ev) { return ev.t === 'min' && ev.ref === 'v:s1' ? 'Keep the Song showing! Press ↺ to try again.' : ''; } }
  ] },

/* ================= 5 · MAKE A FOLDER ================= */
{ id: 5, title: 'Make a Folder', icon: '📁', gem: 'jade', intro: 'Folders keep your files tidy.',
  tasks: [
    { say: 'Click  ➕ New folder', win: 'A new folder!', max: 1, hint: '.tool-new',
      scene: { files: [F('f1', 'My Folder', '📁', 'folder')], wins: [{ ref: 'f:f1', g: BIGWIN }] },
      goal: function (ev) { return ev.t === 'newfolder'; } },
    { say: 'Press ENTER to keep the name', win: 'Named!', max: 1, hint: '.dk-edit',
      scene: { files: [F('f1', 'My Folder', '📁', 'folder'), F('n1', 'New folder', '📁', 'folder', 'f1')], wins: [{ ref: 'f:f1', g: BIGWIN }], edit: 'n1' },
      goal: function (ev) { return ev.t === 'rename'; } },
    { say: 'Right-click the empty space, then choose New folder', win: 'You made a folder!', min: 2, max: 3, hint: '.dk-win .dk-files',
      scene: { files: [F('f1', 'My Folder', '📁', 'folder')], wins: [{ ref: 'f:f1', g: BIGWIN }] },
      goal: function (ev) { return ev.t === 'newfolder' && ev.via === 'menu'; },
      oops: function (ev) { return ev.t === 'newfolder' ? 'Right-click the empty space, then choose New folder.' : ''; } },
    { say: 'Type the name ART, then press ENTER', win: 'Named ART!', min: 2, max: 3, hint: '.dk-edit',
      scene: { files: [F('f1', 'My Folder', '📁', 'folder'), F('n1', 'New folder', '📁', 'folder', 'f1')], wins: [{ ref: 'f:f1', g: BIGWIN }], edit: 'n1' },
      goal: function (ev) { return ev.t === 'rename' && same(ev.name, 'ART'); },
      oops: function (ev) { return ev.t === 'rename' ? 'The name should be ART.' : ''; } },
    { say: 'Double-click your folder to open it', win: 'Your folder is open!', max: 3, hint: '.dk-win .dk-ico[data-id="n1"]',
      scene: { files: [F('f1', 'My Folder', '📁', 'folder'), F('n1', 'ART', '📁', 'folder', 'f1')], wins: [{ ref: 'f:f1', g: BIGWIN }] },
      goal: function (ev) { return ev.t === 'open' && ev.id === 'n1'; } },
    { say: 'Rename this folder to GAMES', sub: 'Right-click it and choose Rename', win: 'Renamed!', min: 3, max: 3, hint: '.dk-win .dk-ico[data-id="n1"]',
      scene: { files: [F('f1', 'My Folder', '📁', 'folder'), F('n1', 'New folder', '📁', 'folder', 'f1')], wins: [{ ref: 'f:f1', g: BIGWIN }] },
      goal: function (ev) { return ev.t === 'rename' && same(ev.name, 'GAMES'); },
      oops: function (ev) { return ev.t === 'rename' ? 'The name should be GAMES.' : ''; } },
    { say: 'Right-click the desktop. Make a folder named PHOTOS.', win: 'PHOTOS is ready!', min: 4, hint: '.dk-area',
      scene: { files: [], wins: [] },
      goal: function (ev, o) { return ev.t === 'rename' && same(ev.name, 'PHOTOS') && !!o.file(ev.id) && o.file(ev.id).parent === 'desk'; },
      oops: function (ev) { return ev.t === 'rename' ? 'The name should be PHOTOS.' : ''; } },
    { say: 'Open PHOTOS. Inside it, make a folder named 2025.', sub: 'A folder inside a folder', win: 'A folder inside a folder!', min: 4, hint: ['.dk-icons .dk-ico.folder', '.dk-win .dk-files'],
      goal: function (ev, o) { const f = o.file(ev.id), p = f && o.file(f.parent); return ev.t === 'rename' && same(ev.name, '2025') && !!p && same(p.name, 'PHOTOS'); },
      oops: function (ev) { return ev.t === 'rename' ? 'The name should be 2025, inside PHOTOS.' : ''; } },
    { say: 'Click the folder, press F2 and type GAMES', sub: 'F2 is the rename key', win: 'Renamed with the keyboard!', min: 4, hint: '.dk-win .dk-ico[data-id="n1"]',
      scene: { files: [F('f1', 'My Folder', '📁', 'folder'), F('n1', 'New folder', '📁', 'folder', 'f1'), DOG('f1')], wins: [{ ref: 'f:f1', g: BIGWIN }] },
      goal: function (ev) { return ev.t === 'rename' && ev.id === 'n1' && same(ev.name, 'GAMES'); },
      oops: function (ev) { return ev.t === 'rename' ? 'The name should be GAMES.' : ''; } }
  ] },

/* ================= 6 · ORGANISE ================= */
{ id: 6, title: 'Organise', icon: '🧺', gem: 'stargem', intro: 'Put things where they belong.',
  tasks: [
    { say: 'Drag the 🐶 into the folder', win: 'In the folder!', max: 3, hint: ['.dk-icons .dk-ico[data-id="p1"]', '.dk-icons .dk-ico[data-id="f1"]'],
      scene: { files: [F('f1', 'Pictures', '📁', 'folder'), DOG('desk')], wins: [] },
      goal: function (ev) { return ev.t === 'drop' && ev.id === 'p1' && ev.to === 'f1'; } },
    { say: 'Put all 3 pictures in the folder', win: 'All tidy!', max: 3, hint: ['.dk-icons .dk-ico.pic', '.dk-icons .dk-ico[data-id="f1"]'],
      scene: { files: [F('f1', 'Pictures', '📁', 'folder'), DOG('desk'), SUN('desk'), CAT('desk')], wins: [] },
      goal: function (ev, o) { return ev.t === 'drop' && o.all(['p1', 'p2', 'p3'], 'f1'); } },
    { say: 'Sort the files into the right folders', sub: 'Pictures, Music, Documents', win: 'Perfectly sorted!', min: 2, hint: '.dk-icons .dk-ico',
      scene: { files: [F('f1', 'Pictures', '📁', 'folder'), F('f2', 'Music', '📁', 'folder'), F('f3', 'Documents', '📁', 'folder'), DOG('desk'), SUN('desk'), SONG('desk'), STORY('desk'), HW('desk')], wins: [] },
      goal: function (ev, o) { return ev.t === 'drop' && o.all(['p1', 'p2'], 'f1') && o.all(['s1'], 'f2') && o.all(['d1', 'd2'], 'f3'); } },
    { say: 'Copy the Story into Backup', sub: 'Copy it, then Paste in Backup', win: 'Copied!', min: 3, max: 3, hint: ['[data-w="f:f1"] .dk-ico[data-id="d1"]', '[data-w="f:f2"] .dk-files'],
      scene: { files: [F('f1', 'Homework', '📁', 'folder'), F('f2', 'Backup', '📁', 'folder'), STORY('f1')], wins: [{ ref: 'f:f1', g: [0.04, 0.1, 0.44, 0.62] }, { ref: 'f:f2', g: [0.52, 0.1, 0.44, 0.62] }] },
      goal: function (ev, o) { return ev.t === 'paste' && ev.to === 'f2' && !!o.file('d1') && o.file('d1').parent === 'f1'; } },
    { say: 'Sort ALL the files', sub: 'Pictures, Music, Documents. Old files go in the bin.', win: 'Everything is in its place!', min: 4, hint: '.dk-icons .dk-ico',
      scene: { files: [F('f1', 'Pictures', '📁', 'folder'), F('f2', 'Music', '📁', 'folder'), F('f3', 'Documents', '📁', 'folder'), DOG('desk'), SONG('desk'), OLD('desk'), STORY('desk'), SUN('desk'), TUNE('desk'), HW('desk'), OLD2('desk'), CAT('desk')], wins: [] },
      goal: function (ev, o) { return (ev.t === 'drop' || ev.t === 'delete') && o.all(['p1', 'p2', 'p3'], 'f1') && o.all(['s1', 's2'], 'f2') && o.all(['d1', 'd2'], 'f3') && o.all(['j1', 'j2'], 'bin'); } },
    { say: 'Copy the Story into Backup with the keyboard', sub: 'Click it, Ctrl+C. Click Backup, Ctrl+V.', win: 'Copied with the keyboard!', min: 4, hint: ['[data-w="f:f1"] .dk-ico[data-id="d1"]', '[data-w="f:f2"] .dk-files'],
      scene: { files: [F('f1', 'Homework', '📁', 'folder'), F('f2', 'Backup', '📁', 'folder'), STORY('f1'), HW('f1')], wins: [{ ref: 'f:f1', g: [0.04, 0.1, 0.44, 0.62] }, { ref: 'f:f2', g: [0.52, 0.1, 0.44, 0.62] }] },
      goal: function (ev, o) { return ev.t === 'paste' && ev.via === 'key' && ev.to === 'f2' && !!o.file('d1') && o.file('d1').parent === 'f1'; },
      oops: function (ev) { return ev.t === 'copy' && ev.via !== 'key' || ev.t === 'paste' && ev.via !== 'key' ? 'Use the keyboard: Ctrl+C and Ctrl+V.' : ''; } }
  ] },

/* ================= 7 · DELETE AND BRING BACK ================= */
{ id: 7, title: 'Delete & Bring Back', icon: '🗑️', gem: 'amber', intro: 'The Recycle Bin keeps deleted files safe for a while.',
  tasks: [
    { say: 'Drag the old file into the bin 🗑️', win: 'Deleted! It is in the bin.', max: 3, hint: ['.dk-icons .dk-ico[data-id="j1"]', '.dk-bin'],
      scene: { files: [OLD('desk'), DOG('desk')], wins: [] },
      goal: function (ev) { return ev.t === 'delete' && ev.id === 'j1'; },
      oops: function (ev) { return ev.t === 'delete' ? 'Not that one! Only the OLD file.' : ''; } },
    { say: 'Click the file, then click ♻ Put back', win: 'It came back!', max: 3, hint: ['.dk-win .dk-ico', '.tool-restore'],
      scene: { files: [OLD('bin'), DOG('desk')], wins: [{ ref: 'b:bin', g: [0.2, 0.1, 0.5, 0.62] }] },
      goal: function (ev) { return ev.t === 'restoreBin'; } },
    { say: 'Delete the old file', sub: 'Right-click it, or click it and press the Delete key', win: 'Deleted!', min: 2, max: 3, hint: '.dk-win .dk-ico[data-id="j1"]',
      scene: { files: [F('f1', 'My Folder', '📁', 'folder'), OLD('f1'), DOG('f1'), SUN('f1')], wins: [{ ref: 'f:f1', g: BIGWIN }] },
      goal: function (ev) { return ev.t === 'delete' && ev.id === 'j1'; },
      oops: function (ev) { return ev.t === 'delete' ? 'Not that one! Only the OLD file.' : ''; } },
    { say: 'Open the bin and put the picture back', win: 'Rescued!', min: 2, max: 3, hint: '.dk-bin',
      scene: { files: [DOG('bin'), SUN('desk')], wins: [] },
      goal: function (ev) { return ev.t === 'restoreBin' && ev.id === 'p1'; } },
    { say: 'Delete all three OLD files', sub: 'Keep the pictures!', win: 'All three are in the bin!', min: 4, hint: '.dk-win .dk-ico.junk',
      scene: { files: [F('f1', 'My Folder', '📁', 'folder'), OLD('f1'), DOG('f1'), OLD2('f1'), SUN('f1'), OLD3('f1')], wins: [{ ref: 'f:f1', g: BIGWIN }] },
      goal: function (ev, o) { return ev.t === 'delete' && o.all(['j1', 'j2', 'j3'], 'bin'); },
      oops: function (ev, o) { return ev.t === 'delete' && o.file(ev.id) && o.file(ev.id).kind !== 'junk' ? 'Keep the pictures! Press ↺ to try again.' : ''; } },
    { say: 'The Dog was deleted by mistake. Rescue ONLY the Dog.', sub: 'Leave the old files in the bin', win: 'The Dog is safe!', min: 4, hint: ['.dk-win .dk-ico[data-id="p1"]', '.tool-restore'],
      scene: { files: [OLD('bin'), DOG('bin'), OLD2('bin'), SUN('desk')], wins: [{ ref: 'b:bin', g: [0.2, 0.1, 0.5, 0.62] }] },
      goal: function (ev, o) { return ev.t === 'restoreBin' && ev.id === 'p1' && o.all(['j1', 'j2'], 'bin'); },
      oops: function (ev) { return ev.t === 'restoreBin' && ev.id !== 'p1' ? 'Leave the old files! Press ↺ to try again.' : ''; } },
    { say: 'Empty the bin', sub: 'This deletes the files for good', win: 'The bin is empty!', min: 3, hint: '.tool-empty',
      scene: { files: [OLD('bin'), OLD2('bin'), F('j3', 'Old photo', '📃', 'junk', 'bin')], wins: [{ ref: 'b:bin', g: [0.2, 0.1, 0.5, 0.62] }] },
      goal: function (ev) { return ev.t === 'empty'; } }
  ] },

/* ================= 8 · TIDY UP ================= */
{ id: 8, title: 'Tidy Up!', icon: '✨', gem: 'crown', intro: 'Use everything you learned to tidy the desktop!',
  tasks: [
    { say: 'Put the pictures in the folder', win: 'Neat!', max: 1, hint: ['.dk-icons .dk-ico.pic', '.dk-icons .dk-ico[data-id="f1"]'],
      scene: { files: [F('f1', 'Pictures', '📁', 'folder'), DOG('desk'), SUN('desk'), CAT('desk'), OLD('desk')], wins: [] },
      goal: function (ev, o) { return ev.t === 'drop' && o.all(['p1', 'p2', 'p3'], 'f1'); } },
    { say: 'Put the old file in the bin', win: 'Gone!', max: 1, hint: ['.dk-icons .dk-ico[data-id="j1"]', '.dk-bin'],
      goal: function (ev) { return ev.t === 'delete' && ev.id === 'j1'; },
      oops: function (ev) { return ev.t === 'delete' ? 'Only the OLD file goes in the bin.' : ''; } },
    { say: 'Open the folder to check your pictures', win: 'All tidy!', max: 1, hint: '.dk-icons .dk-ico[data-id="f1"]',
      goal: function (ev) { return ev.t === 'open' && ev.id === 'f1'; } },
    { say: 'Make a new folder on the desktop', sub: 'Right-click the empty desktop. Name it SCHOOL.', win: 'SCHOOL is ready!', min: 2, max: 3, hint: '.dk-area',
      scene: { files: [DOG('desk'), SUN('desk'), STORY('desk'), SONG('desk'), OLD('desk'), OLD2('desk')], wins: [] },
      goal: function (ev, o) { return ev.t === 'rename' && same(ev.name, 'SCHOOL') && !!o.file(ev.id) && o.file(ev.id).parent === 'desk'; },
      oops: function (ev) { return ev.t === 'rename' ? 'The name should be SCHOOL.' : ''; } },
    { say: 'Put the pictures and the story in SCHOOL', win: 'Well organised!', min: 2, max: 3, hint: ['.dk-icons .dk-ico.pic', '.dk-icons .dk-ico.doc'],
      goal: function (ev, o) { const s = schoolId(o); return ev.t === 'drop' && !!s && o.all(['p1', 'p2', 'd1'], s); } },
    { say: 'Put the old files in the bin', win: 'Clean!', min: 2, max: 3, hint: ['.dk-icons .dk-ico.junk', '.dk-bin'],
      goal: function (ev, o) { return ev.t === 'delete' && o.all(['j1', 'j2'], 'bin'); } },
    { say: 'Make a new folder on the desktop. Name it PROJECT.', sub: 'Right-click the empty desktop', win: 'PROJECT is ready!', min: 4, hint: '.dk-area',
      scene: { files: [DOG('desk'), SUN('desk'), CAT('desk'), STORY('desk'), SONG('desk'), OLD('desk'), OLD2('desk')], wins: [] },
      goal: function (ev, o) { return ev.t === 'rename' && same(ev.name, 'PROJECT') && !!o.file(ev.id) && o.file(ev.id).parent === 'desk'; },
      oops: function (ev) { return ev.t === 'rename' ? 'The name should be PROJECT.' : ''; } },
    { say: 'Put the pictures, the story and the song in PROJECT', win: 'Well organised!', min: 4, hint: ['.dk-icons .dk-ico.pic', '.dk-icons .dk-ico.doc', '.dk-icons .dk-ico.song'],
      goal: function (ev, o) { const s = named(o, 'desk', 'PROJECT'); return ev.t === 'drop' && !!s && o.all(['p1', 'p2', 'p3', 'd1', 's1'], s); } },
    { say: 'Delete the old files', win: 'Clean!', min: 4, hint: ['.dk-icons .dk-ico.junk', '.dk-bin'],
      goal: function (ev, o) { return ev.t === 'delete' && o.all(['j1', 'j2'], 'bin'); } },
    { say: 'Empty the bin', win: 'Spotless!', min: 3, hint: ['.dk-bin', '.tool-empty'],
      goal: function (ev) { return ev.t === 'empty'; } },
    { say: 'Open SCHOOL and make the window BIG', win: 'Almost there!', min: 3, max: 3, hint: ['.dk-icons .dk-ico.folder', '.dk-win .b-max'],
      goal: function (ev, o) { const s = schoolId(o); return ev.t === 'max' && !!s && ev.ref === 'f:' + s; } },
    { say: 'Open PROJECT. Inside it, make a folder named BACKUP.', win: 'BACKUP is ready!', min: 4, hint: ['.dk-icons .dk-ico.folder', '.dk-win .dk-files'],
      goal: function (ev, o) { const f = o.file(ev.id), p = named(o, 'desk', 'PROJECT'); return ev.t === 'rename' && same(ev.name, 'BACKUP') && !!f && !!p && f.parent === p; },
      oops: function (ev) { return ev.t === 'rename' ? 'The name should be BACKUP, inside PROJECT.' : ''; } },
    { say: 'Copy the Story into BACKUP', sub: 'Ctrl+C on the Story. Open BACKUP. Ctrl+V.', win: 'You are a Desktop Hero!', min: 4, hint: '.dk-win .dk-ico',
      goal: function (ev, o) { const p = named(o, 'desk', 'PROJECT'), b = p && named(o, p, 'BACKUP'); return ev.t === 'paste' && !!b && ev.to === b; } }
  ] },

/* ============================================================================================================================
   THE PRO LEVELS (Years 4 to 6 only, level.min = 4): real computer skills.
   Year 4: glowing hints from the start. Year 5: the keys are named in the task, hints on request (the lightbulb). Year 6: a shorter task
   (task.y6) that does not name the keys, and no hints at all. A task with "choices" and "answer" is a keys quiz (for the shortcuts a web
   page cannot catch, like the Windows key). */

/* ================= 9 · SELECT MANY ================= */
{ id: 9, title: 'Select Many', icon: '☑️', gem: 'turquoise', pro: true, min: 4, intro: 'Pick lots of files at once, then move or delete them together.',
  tasks: [
    { say: 'Click the Dog. Hold CTRL and click the Sun.', sub: 'Now two files are selected', win: 'Two files selected!', min: 4, max: 5, hint: ['.dk-icons .dk-ico[data-id="p1"]', '.dk-icons .dk-ico[data-id="p2"]'],
      scene: { files: [F('f1', 'Pictures', '📁', 'folder'), DOG('desk'), SUN('desk'), CAT('desk'), STORY('desk'), SONG('desk')], wins: [] },
      goal: function (ev) { return ev.t === 'select' && sameSet(ev.ids, ['p1', 'p2']); } },
    { say: 'Drag them both into the Pictures folder', sub: 'One drag moves everything that is selected', win: 'Both moved at once!', min: 4, max: 5, hint: ['.dk-icons .dk-ico.sel', '.dk-icons .dk-ico[data-id="f1"]'],
      goal: function (ev) { return ev.t === 'drop' && ev.to === 'f1' && sameSet(ev.ids, ['p1', 'p2']); } },
    { say: 'Click the Story. Hold SHIFT and click the Song.', sub: 'Everything in between is selected too', win: 'A whole row selected!', min: 4, max: 5, hint: ['.dk-icons .dk-ico[data-id="d1"]', '.dk-icons .dk-ico[data-id="s1"]'],
      scene: { files: [F('f1', 'Documents', '📁', 'folder'), STORY('desk'), HW('desk'), SONG('desk'), DOG('desk')], wins: [] },
      goal: function (ev) { return ev.t === 'select' && ev.via === 'shift' && sameSet(ev.ids, ['d1', 'd2', 's1']); } },
    { say: 'Select the Story, Homework and Song with just two clicks', win: 'Two clicks!', min: 6,
      scene: { files: [F('f1', 'Documents', '📁', 'folder'), STORY('desk'), HW('desk'), SONG('desk'), DOG('desk')], wins: [] },
      goal: function (ev) { return ev.t === 'select' && ev.via === 'shift' && sameSet(ev.ids, ['d1', 'd2', 's1']); } },
    { say: 'Press CTRL + A to select everything', y6: { say: 'Select every file on the desktop with one key combination' }, win: 'Everything selected!', min: 4, hint: '.dk-icons',
      scene: { files: [DOG('desk'), SUN('desk'), CAT('desk'), STORY('desk'), SONG('desk')], wins: [] },
      goal: function (ev) { return ev.t === 'select' && ev.via === 'key' && ev.ids.length === 5; } },
    { say: 'Drag a box around the 3 pictures', sub: 'Start on the empty desktop and drag', y6: { say: 'Select just the 3 pictures by dragging on the empty desktop' }, win: 'Box selection!', min: 5, hint: '.dk-area',
      scene: { files: [DOG('desk'), SUN('desk'), CAT('desk'), STORY('desk'), SONG('desk')], wins: [] },
      goal: function (ev) { return ev.t === 'select' && ev.via === 'box' && sameSet(ev.ids, ['p1', 'p2', 'p3']); } },
    { say: 'Select the 3 OLD files with CTRL, then press the DELETE key', win: 'All three deleted at once!', min: 4, max: 5, hint: '.dk-icons .dk-ico.junk',
      scene: { files: [OLD('desk'), DOG('desk'), OLD2('desk'), SUN('desk'), OLD3('desk')], wins: [] },
      goal: function (ev) { return ev.t === 'delete' && sameSet(ev.ids, ['j1', 'j2', 'j3']); },
      oops: function (ev) { return ev.t === 'delete' ? 'Only the OLD files! Press ↺ to try again.' : ''; } },
    { say: 'Delete only the old files, all at once', win: 'Clean in one go!', min: 6,
      scene: { files: [OLD('desk'), DOG('desk'), OLD2('desk'), SUN('desk'), STORY('desk'), OLD3('desk'), CAT('desk')], wins: [] },
      goal: function (ev) { return ev.t === 'delete' && sameSet(ev.ids, ['j1', 'j2', 'j3']); },
      oops: function (ev) { return ev.t === 'delete' ? 'Only the OLD files, and all in one go! Press ↺.' : ''; } },
    { say: 'Sort the pictures and the documents into their folders', sub: 'Select, then drag. Two moves is enough.', win: 'Sorted fast!', min: 6,
      scene: { files: [F('f1', 'Pictures', '📁', 'folder'), F('f2', 'Documents', '📁', 'folder'), DOG('desk'), STORY('desk'), SUN('desk'), HW('desk'), CAT('desk')], wins: [] },
      goal: function (ev, o) { return ev.t === 'drop' && o.all(['p1', 'p2', 'p3'], 'f1') && o.all(['d1', 'd2'], 'f2'); } }
  ] },

/* ================= 10 · SPLIT SCREEN ================= */
{ id: 10, title: 'Split Screen', icon: '⬛', gem: 'rhodolite', pro: true, min: 4, intro: 'Put two windows side by side so you can see both.',
  tasks: [
    { say: 'Drag the window to the LEFT edge', sub: 'Let go at the edge. It snaps to half the screen.', y6: { say: 'Snap the window to the left half' }, win: 'Snapped to the left!', min: 4, hint: '.dk-win .dk-title',
      scene: { files: [F('f1', 'Pictures', '📁', 'folder'), DOG('f1')], wins: [{ ref: 'f:f1', g: [0.25, 0.14, 0.5, 0.6] }] },
      goal: function (ev) { return ev.t === 'snap' && ev.side === 'left' && ev.ref === 'f:f1'; } },
    { say: 'Now drag the Music window to the RIGHT edge', y6: { say: 'Snap the Music window to the right half' }, win: 'Side by side!', min: 4, hint: '[data-w="f:f2"] .dk-title',
      scene: { files: [F('f1', 'Pictures', '📁', 'folder'), F('f2', 'Music', '📁', 'folder'), DOG('f1'), SONG('f2')], wins: [{ ref: 'f:f1', g: [0, 0, 0.5, 1] }, { ref: 'f:f2', g: [0.3, 0.16, 0.5, 0.6] }] },
      goal: function (ev) { return ev.t === 'snap' && ev.side === 'right' && ev.ref === 'f:f2'; } },
    { say: 'Drag the Song from Music into the Pictures window', y6: { say: 'Move the Song into the Pictures folder' }, win: 'Moved between windows!', min: 4, hint: ['[data-w="f:f2"] .dk-ico[data-id="s1"]', '[data-w="f:f1"] .dk-files'],
      scene: { files: [F('f1', 'Pictures', '📁', 'folder'), F('f2', 'Music', '📁', 'folder'), DOG('f1'), SONG('f2')], wins: [{ ref: 'f:f1', g: [0, 0, 0.5, 1] }, { ref: 'f:f2', g: [0.5, 0, 0.5, 1] }] },
      goal: function (ev) { return ev.t === 'drop' && ev.id === 's1' && ev.to === 'f1'; } },
    { say: 'Which keys snap a window to the LEFT?', choices: ['Win + ←', 'Win + →', 'Alt + ←', 'Ctrl + ←'], answer: 'Win + ←', win: 'Yes! The Windows key and the arrow.', min: 4,
      scene: { files: [F('f1', 'Pictures', '📁', 'folder'), DOG('f1')], wins: [{ ref: 'f:f1', g: [0.1, 0.1, 0.5, 0.45] }] } },
    { say: 'Which keys switch between open windows?', choices: ['Alt + Tab', 'Alt + F4', 'Ctrl + Tab', 'Win + D'], answer: 'Alt + Tab', win: 'Alt + Tab flips through your windows!', min: 4,
      scene: { files: [F('f1', 'Pictures', '📁', 'folder'), F('f2', 'Music', '📁', 'folder'), DOG('f1'), SONG('f2')], wins: [{ ref: 'f:f1', g: [0.06, 0.1, 0.45, 0.45] }, { ref: 'f:f2', g: [0.4, 0.3, 0.45, 0.45] }] } },
    { say: 'Drag the window to the TOP edge to fill the screen', y6: { say: 'Make the window fill the screen without using the ▢ button' }, win: 'Full screen!', min: 5, hint: '.dk-win .dk-title',
      scene: { files: [F('f1', 'Pictures', '📁', 'folder'), DOG('f1')], wins: [{ ref: 'f:f1', g: [0.2, 0.2, 0.5, 0.5] }] },
      goal: function (ev) { return ev.t === 'snap' && ev.side === 'top'; },
      oops: function (ev) { return ev.t === 'max' ? 'Drag the title bar to the top edge instead.' : ''; } },
    { say: 'Swap sides: Pictures on the RIGHT, Music on the LEFT', win: 'Swapped!', min: 5, hint: '.dk-win .dk-title',
      scene: { files: [F('f1', 'Pictures', '📁', 'folder'), F('f2', 'Music', '📁', 'folder'), DOG('f1'), SONG('f2')], wins: [{ ref: 'f:f1', g: [0, 0, 0.5, 1] }, { ref: 'f:f2', g: [0.5, 0, 0.5, 1] }] },
      goal: function (ev, o) { return ev.t === 'snap' && o.centerIn('f:f1', [0.5, 0, 0.5, 1]) && o.centerIn('f:f2', [0, 0, 0.5, 1]); } },
    { say: 'Which keys show the desktop?', choices: ['Win + D', 'Win + E', 'Win + L', 'Alt + D'], answer: 'Win + D', win: 'Win + D hides every window!', min: 5,
      scene: { files: [F('f1', 'Pictures', '📁', 'folder'), DOG('f1')], wins: [{ ref: 'f:f1', g: [0.1, 0.1, 0.5, 0.45] }] } },
    { say: 'Split the screen: Pictures on the left, Music on the right. Then move the Song across.', win: 'A real split-screen worker!', min: 6,
      scene: { files: [F('f1', 'Pictures', '📁', 'folder'), F('f2', 'Music', '📁', 'folder'), DOG('f1'), SONG('f2')], wins: [{ ref: 'f:f1', g: [0.35, 0.2, 0.5, 0.5] }, { ref: 'f:f2', g: [0.1, 0.1, 0.5, 0.5] }] },
      goal: function (ev, o) { return ev.t === 'drop' && ev.id === 's1' && ev.to === 'f1' && o.centerIn('f:f1', [0, 0, 0.5, 1]) && o.centerIn('f:f2', [0.5, 0, 0.5, 1]); } }
  ] },

/* ================= 11 · SEARCH AND FIND ================= */
{ id: 11, title: 'Search & Find', icon: '🔍', gem: 'sunstone', pro: true, min: 4, intro: 'Lost a file? Do not click through every folder. Search for it!',
  tasks: [
    { say: 'Find the file called Report', sub: 'Click 🔍 (or press CTRL + F), type report, then click the result', y6: { say: 'Find the file called Report' }, win: 'Found it!', min: 4, hint: '.tb-search',
      scene: { files: [F('f1', 'School', '📁', 'folder'), F('f2', 'Art', '📁', 'folder', 'f1'), F('d3', 'Report', '📄', 'doc', 'f2'), F('f3', 'Done', '📁', 'folder'), DOG('f1'), SUN('f2')], wins: [] },
      goal: function (ev) { return ev.t === 'searchpick' && ev.id === 'd3'; } },
    { say: 'Drag the Report onto the Done folder', y6: { say: 'Put the Report in the Done folder' }, win: 'Report filed!', min: 4, hint: ['[data-w="f:f2"] .dk-ico[data-id="d3"]', '.dk-icons .dk-ico[data-id="f3"]'],
      goal: function (ev) { return ev.t === 'drop' && ev.id === 'd3' && ev.to === 'f3'; } },
    { say: 'Find the file called Tune', sub: 'You can type just part of a name', y6: { say: 'Find the file called Tune' }, win: 'Found the Tune!', min: 5, hint: '.tb-search',
      scene: { files: [F('f1', 'Music', '📁', 'folder'), F('f2', 'Old stuff', '📁', 'folder'), F('f3', 'Backup', '📁', 'folder', 'f2'), F('s2', 'Tune', '🎵', 'song', 'f3'), SONG('f1'), DOG('f2')], wins: [] },
      goal: function (ev) { return ev.t === 'searchpick' && ev.id === 's2'; } },
    { say: 'Find the file called Secret. Move it onto the desktop.', sub: 'It is hidden deep inside folders', win: 'Mission complete!', min: 6,
      scene: { files: [F('f1', 'Work', '📁', 'folder'), F('f2', 'Year 6', '📁', 'folder', 'f1'), F('f3', 'Private', '📁', 'folder', 'f2'), F('d4', 'Secret', '📄', 'doc', 'f3'), STORY('f2'), DOG('f1'), SUN('desk')], wins: [] },
      goal: function (ev) { return ev.t === 'drop' && ev.id === 'd4' && ev.to === 'desk'; } }
  ] },

/* ================= 12 · SHORTCUT PRO ================= */
{ id: 12, title: 'Shortcut Pro', icon: '⌨️', gem: 'iolite', pro: true, min: 4, intro: 'Keyboard shortcuts are faster than the mouse.',
  tasks: [
    { say: 'Move the Song into Music: click it, CTRL + X, click Music, CTRL + V', y6: { say: 'Move the Song into Music with the keyboard only' }, win: 'Cut and pasted!', min: 4, hint: ['[data-w="f:f1"] .dk-ico[data-id="s1"]', '[data-w="f:f2"] .dk-files'],
      scene: { files: [F('f1', 'Mixed', '📁', 'folder'), F('f2', 'Music', '📁', 'folder'), SONG('f1'), DOG('f1')], wins: [{ ref: 'f:f1', g: [0.04, 0.1, 0.44, 0.62] }, { ref: 'f:f2', g: [0.52, 0.1, 0.44, 0.62] }] },
      goal: function (ev, o) { return ev.t === 'paste' && ev.cut && ev.via === 'key' && ev.to === 'f2' && o.all(['s1'], 'f2'); },
      oops: function (ev) { return ev.t === 'paste' && ev.via !== 'key' ? 'Use the keyboard: CTRL + X, then CTRL + V.' : ''; } },
    { say: 'Click the Dog and press the DELETE key', win: 'Deleted!', min: 4, max: 5, hint: '.dk-win .dk-ico[data-id="p1"]',
      scene: { files: [F('f1', 'My Folder', '📁', 'folder'), DOG('f1'), SUN('f1')], wins: [{ ref: 'f:f1', g: BIGWIN }] },
      goal: function (ev) { return ev.t === 'delete' && ev.via === 'key' && ev.id === 'p1'; } },
    { say: 'Oops! Press CTRL + Z to bring it back', win: 'Undo to the rescue!', min: 4, max: 5,
      goal: function (ev, o) { return ev.t === 'undo' && !!o.file('p1') && o.file('p1').parent === 'f1'; } },
    { say: 'Press CTRL + F to open the search box', y6: { say: 'Open the search box using only the keyboard' }, win: 'Search opens with CTRL + F!', min: 4,
      scene: { files: [DOG('desk'), SUN('desk'), STORY('desk')], wins: [] },
      goal: function (ev) { return ev.t === 'searchopen' && ev.via === 'key'; } },
    { say: 'Which keys select EVERYTHING?', choices: ['Ctrl + A', 'Ctrl + S', 'Ctrl + P', 'Ctrl + Z'], answer: 'Ctrl + A', win: 'A for All!', min: 4,
      scene: { files: [DOG('desk'), SUN('desk')], wins: [] } },
    { say: 'Which keys CUT a file so you can move it?', choices: ['Ctrl + X', 'Ctrl + C', 'Ctrl + V', 'Ctrl + Z'], answer: 'Ctrl + X', win: 'X is for cut, like scissors!', min: 4 },
    { say: 'Which key renames a selected file?', choices: ['F2', 'F5', 'F11', 'Esc'], answer: 'F2', win: 'F2 renames!', min: 5 },
    { say: 'Copy ALL the files in Work into Backup', sub: 'Keyboard only: CTRL + A, CTRL + C, then CTRL + V in Backup', win: 'Copied them all!', min: 6,
      scene: { files: [F('f1', 'Work', '📁', 'folder'), F('f2', 'Backup', '📁', 'folder'), DOG('f1'), SUN('f1'), STORY('f1')], wins: [{ ref: 'f:f1', g: [0.04, 0.1, 0.44, 0.62] }, { ref: 'f:f2', g: [0.52, 0.1, 0.44, 0.62] }] },
      goal: function (ev) { return ev.t === 'paste' && ev.via === 'key' && !ev.cut && ev.to === 'f2' && ev.ids.length === 3; },
      oops: function (ev) { return ev.t === 'paste' && ev.via !== 'key' ? 'Keys only this time! Press ↺ to try again.' : ''; } },
    { say: 'Delete everything in this folder. Then bring it all back.', win: 'You can always undo!', min: 6,
      scene: { files: [F('f1', 'My Folder', '📁', 'folder'), DOG('f1'), SUN('f1'), STORY('f1')], wins: [{ ref: 'f:f1', g: BIGWIN }] },
      goal: function (ev, o) { return ev.t === 'undo' && o.kids('f1').length === 3; } }
  ] },

/* ================= 13 · SCREENSHOTS & APPS ================= */
{ id: 13, title: 'Screenshots & Apps', icon: '📸', gem: 'spinel', pro: true, min: 4, intro: 'Take pictures of your screen, record it, and remove apps you do not need.',
  tasks: [
    { say: 'Press the PRINT SCREEN key (PrtScn)', sub: 'It takes a picture of the whole screen. No PrtScn key? Click ✂️ and drag around everything.', y6: { say: 'Take a screenshot of the whole screen' }, win: 'Screenshot saved on the desktop!', min: 4, hint: '.tb-snip',
      scene: { files: [DOG('desk'), STORY('desk')], wins: [{ ref: 'v:p1', g: [0.08, 0.12, 0.4, 0.6] }, { ref: 'v:d1', g: [0.52, 0.12, 0.4, 0.6] }] },
      goal: function (ev) { return ev.t === 'snip' && ev.full; } },
    { say: 'Click ✂️ on the bar. Drag a box around ONLY the Dog window.', y6: { say: 'Take a screenshot of just the Dog window' }, win: 'A neat snip!', min: 4, hint: '.tb-snip',
      scene: { files: [DOG('desk'), STORY('desk')], wins: [{ ref: 'v:p1', g: [0.08, 0.12, 0.4, 0.6] }, { ref: 'v:d1', g: [0.52, 0.12, 0.4, 0.6] }] },
      goal: function (ev) { return ev.t === 'snip' && sameSet(ev.over, ['v:p1']); },
      oops: function (ev) { return ev.t === 'snip' ? 'Just the Dog window, nothing else. Press ↺ to try again.' : ''; } },
    { say: 'Which keys snip PART of the screen?', choices: ['Win + Shift + S', 'Win + Shift + R', 'Alt + F4', 'Win + L'], answer: 'Win + Shift + S', win: 'Win + Shift + S, then drag!', min: 4,
      scene: { files: [DOG('desk')], wins: [] } },
    { say: 'Which keys start a screen RECORDING?', choices: ['Win + Alt + R', 'Win + Shift + R', 'Alt + R', 'Ctrl + R'], answer: 'Win + Alt + R', win: 'Press them again to stop.', min: 5 },
    { say: 'Press ⏺ to record. Open the Story. Press ⏺ again to stop.', sub: 'Record for at least 2 seconds', y6: { say: 'Record yourself opening the Story' }, win: 'Your recording is on the desktop!', min: 4, hint: '.tb-rec',
      scene: { files: [STORY('desk'), DOG('desk')], wins: [] },
      goal: function (ev) { return ev.t === 'recordstop' && ev.secs >= 2 && ev.opened >= 1; },
      oops: function (ev) { return ev.t === 'recordstop' ? 'Record for 2 seconds and open the Story. Press ↺ to try again.' : ''; } },
    { say: 'Right-click the app Doodle and choose Uninstall', y6: { say: 'Uninstall the app Doodle' }, win: 'Doodle is gone!', min: 4, max: 5, hint: '.dk-icons .dk-ico[data-id="a1"]',
      scene: { files: [APP('a1', 'Doodle', '🎨', 120), APP('a2', 'Games Hub', '🎮', 900), APP('a3', 'Music Maker', '🎹', 300)], wins: [] },
      goal: function (ev) { return ev.t === 'uninstall' && ev.id === 'a1'; },
      oops: function (ev) { return ev.t === 'uninstall' ? 'Wrong app! Press ↺ to try again.' : ''; } },
    { say: 'Click 🪟, then Settings. Uninstall Games Hub.', y6: { say: 'Uninstall Games Hub using Settings' }, win: 'Uninstalled from Settings!', min: 5, hint: ['.tb-start', '.app-un[data-id="a2"]'],
      scene: { files: [APP('a1', 'Doodle', '🎨', 120), APP('a2', 'Games Hub', '🎮', 900), APP('a3', 'Music Maker', '🎹', 300)], wins: [] },
      goal: function (ev) { return ev.t === 'uninstall' && ev.id === 'a2' && ev.via === 'settings'; },
      oops: function (ev) { return ev.t === 'uninstall' ? 'Use Settings, and pick Games Hub. Press ↺ to try again.' : ''; } },
    { say: 'Your storage is full! Uninstall the BIGGEST app.', sub: 'Check the sizes in Settings', win: 'Space saved!', min: 6,
      scene: { files: [APP('a1', 'Doodle', '🎨', 120), APP('a2', 'Games Hub', '🎮', 900), APP('a3', 'Music Maker', '🎹', 300), APP('a4', 'Photo Pro', '📷', 1400)], wins: [] },
      goal: function (ev) { return ev.t === 'uninstall' && ev.id === 'a4'; },
      oops: function (ev) { return ev.t === 'uninstall' ? 'That is not the biggest one. Press ↺ to try again.' : ''; } }
  ] }
];
/* the folder the learner made and named SCHOOL (its id is made by the game) */
function named(o, parent, name) { const k = o.kids(parent); for (let i = 0; i < k.length; i++) if (k[i].kind === 'folder' && same(k[i].name, name)) return k[i].id; return null; }
function schoolId(o) { const k = o.kids('desk'); for (let i = 0; i < k.length; i++) if (k[i].kind === 'folder' && same(k[i].name, 'SCHOOL')) return k[i].id; return null; }

/* ---- Year 1: what Bo SAYS for each step (voice) and how the moving pointer SHOWS it (demo).
   One list per level, one entry per Year 1 step, in order: [voice, demo].
   demo: 'click' | 'dbl' (double-click) | 'drag' (from the first glowing thing to the second) | 'seq' (click the first, then the second) | 'enter' (the Enter key).
   Leave demo out and Bo clicks the glowing thing, or drags when two things glow. */
const BO_Y1 = {
  1: [['This is a folder. Double-click it to open it. Click two times, quickly. Click, click!', 'dbl'],
      ['Now close the window. Click the red X at the top.'],
      ['Double-click the picture of the dog to open it. Click, click!', 'dbl'],
      ['Close the picture window. Click its red X.']],
  2: [['Click the little line at the top of the window. The window will hide.'],
      ['The window is hiding on the bar at the bottom. Click it to bring it back.'],
      ['Click the square at the top to make the window big.'],
      ['Click the two little squares to make the window small again.']],
  3: [['Hold the top bar of the window. Keep holding, and drag it to the dotted box. Then let go.', 'drag']],
  4: [['One window is hiding at the back. Click it to bring it to the front.'],
      ['Now close the window in front. Click its red X.']],
  5: [['Click the New folder button to make a folder.'],
      ['Press the Enter key on the keyboard to keep the name.', 'enter'],
      ['Double-click your new folder to open it. Click, click!', 'dbl']],
  6: [['Drag the dog into the folder. Hold the mouse button down, move to the folder, then let go.', 'drag'],
      ['Put all three pictures in the folder. Drag them one by one.', 'drag']],
  7: [['Drag the old file into the bin.', 'drag'],
      ['Click the file. Then click Put back.', 'seq']],
  8: [['Put the pictures in the folder. Drag them one by one.', 'drag'],
      ['Now drag the old file into the bin.', 'drag'],
      ['Double-click the folder to check your pictures. Click, click!', 'dbl']]
};
LEVELS.forEach(function (lv) {
  const list = BO_Y1[lv.id]; if (!list) return;
  lv.tasks.filter(function (t) { return !t.min || t.min <= 1; }).forEach(function (t, i) { if (list[i]) { t.voice = list[i][0]; if (list[i][1]) t.demo = list[i][1]; } });
});

/* ---------- exact "how to do it" steps for the tasks with more than one move (shown by the helper after two slips or a long wait).
   The key is the start of the task's "say" line. Every other task gets its steps worked out from its words (helpFor in desktop.js). ---------- */
const HOW = [
  ['Click the Story, then press ENTER', 'keys', 'Enter ↵', ['Click the Story once. It turns blue.', 'Do not click again.', 'Press the ENTER key on the keyboard.']],
  ['Open all three pictures', 'dbl', '', ['Double-click the first picture: two quick clicks.', 'Its window opens. The folder is still there behind it.', 'Double-click the next picture, then the last one.']],
  ['Click the window at the BACK', 'click', '', ['Two windows are on top of each other.', 'Find the one that is partly hidden.', 'Click any part of it that you can see.']],
  ['Use the bar to open the Song', 'click', '', ['Look at the bar along the bottom of the screen.', 'Every open window has a button there.', 'Click the button that says Song.']],
  ['Open the bin and put the picture back', 'dbl', '', ['Double-click the Bin to open it.', 'Click the picture inside once.', 'Click ♻ Put back at the top of the window.']],
  ['Delete the old file', 'rclick', '', ['Right-click the old file: press the RIGHT mouse button on it.', 'A small menu opens. Click Delete with the LEFT button.', 'Another way: click the file once, then press the DELETE key.']],
  ['Delete all three OLD files', 'keys', 'Delete', ['Click one OLD file once.', 'Press the DELETE key on the keyboard.', 'Do the same for the other two OLD files. Leave the pictures.']],
  ['Delete the old files', 'drag', '', ['Press on an old file and hold the button down.', 'Slide it onto the Bin and let go.', 'Do the same for the other old file.']],
  ['Empty the bin', 'dbl', '', ['If the Bin window is not open, double-click the Bin.', 'Click 🗑 Empty at the top of the Bin window.']],
  ['Open SCHOOL and make the window BIG', 'dbl', '', ['Double-click the SCHOOL folder to open it.', 'Find the ▢ button at the top right of its window.', 'Click ▢ once.']],
  ['Open PHOTOS. Inside it', 'dbl', '', ['Double-click the PHOTOS folder to open it.', 'Right-click the empty space inside the window.', 'Click New folder in the menu.', 'Type 2025 and press ENTER.']],
  ['Open PROJECT. Inside it', 'dbl', '', ['Double-click the PROJECT folder to open it.', 'Right-click the empty space inside the window.', 'Click New folder in the menu.', 'Type BACKUP and press ENTER.']],
  ['Rename this folder to GAMES', 'rclick', '', ['Right-click the folder: press the RIGHT mouse button on it.', 'Click Rename in the menu with the LEFT button.', 'Type GAMES and press ENTER.']],
  ['Copy the Story into Backup', 'rclick', '', ['Right-click the Story and click Copy.', 'Right-click the empty space in the Backup window.', 'Click Paste.']],
  ['Copy the Story into Backup with the keyboard', 'keys', 'CTRL + C', ['Click the Story once.', 'Hold CTRL, tap C, let go. That copies it.', 'Click the empty space in the Backup window.', 'Hold CTRL, tap V, let go. That pastes it.']],
  ['Copy the Story into BACKUP', 'keys', 'CTRL + C', ['Click the Story once, then hold CTRL and tap C.', 'Double-click PROJECT, then double-click BACKUP to open it.', 'Click the empty space in BACKUP, then hold CTRL and tap V.']],
  ['Make the window fit the dotted box', 'drag', '', ['Drag the top bar of the window to move it over the dotted box.', 'Then drag the bottom right corner to change its size.', 'Keep going until the window covers the box.']],
  ['Pictures on the LEFT. Music on the RIGHT.', 'drag', '', ['Press on the top bar of the Pictures window and hold.', 'Slide it to the left side and let go.', 'Do the same with Music, to the right side.']],
  ['Close both pictures. Keep the Story open.', 'click', '', ['Read the name at the top of each window.', 'Click the red ✖ on the Dog window.', 'Click the red ✖ on the Sun window. Do not close the Story.']],
  ['Hide every window except the Song', 'click', '', ['Read the name at the top of each window.', 'Click — on the Dog window.', 'Click — on the Story window. Leave the Song alone.']],
  ['Select the 3 OLD files with CTRL', 'seq', 'CTRL', ['Click the first OLD file.', 'Hold the CTRL key down and click the other two OLD files.', 'Let go of CTRL, then press the DELETE key.']],
  ['Drag a box around the 3 pictures', 'drag', '', ['Put the pointer on the empty desktop, above and left of the pictures.', 'Press and hold, then slide down and right. A box appears.', 'Let go when all 3 pictures are inside the box.']],
  ['Move the Song into Music: click it', 'keys', 'CTRL + X', ['Click the Song once.', 'Hold CTRL, tap X, let go. That cuts it.', 'Click the empty space in the Music window.', 'Hold CTRL, tap V, let go. That pastes it.']],
  ['Swap sides', 'drag', '', ['Drag the top bar of Pictures to the RIGHT edge and let go.', 'Drag the top bar of Music to the LEFT edge and let go.']],
  ['Click ✂️ on the bar', 'click', '', ['Click the ✂️ on the bar at the bottom.', 'Press at one corner of the window you want.', 'Hold and slide to the opposite corner, then let go.']],
  ['Press ⏺ to record', 'click', '', ['Click the ⏺ on the bar at the bottom. Recording starts.', 'Double-click the Story to open it.', 'Click the ⏺ again to stop.']],
  ['Click 🪟, then Settings', 'click', '', ['Click the 🪟 button at the left of the bar.', 'Click Settings in the menu.', 'Find Games Hub in the list and click Uninstall.']]
];
LEVELS.forEach(function (lv) { lv.tasks.forEach(function (t) { let best = null; HOW.forEach(function (h) { if (t.say.indexOf(h[0]) === 0 && (!best || h[0].length > best[0].length)) best = h; }); if (best) { t.how = best[3]; if (!t.demo) t.demo = best[1]; t.keys = best[2]; } }); });

CC.DESKTOP = { NAME: 'Desktop Skills', LEVELS: LEVELS };
})();
