/* desktop_levels.js - ALL the content of "Desktop Skills" lives here as plain data. The engine (desktop.js) never mentions a level.

   A level:  { id, title, icon, gem (see skills_gems.js), intro, tasks: [ ... ] }
   A task:   { say: the short instruction, sub: a smaller second line (optional), win: the cheer,
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
     delete {id}  restoreBin {id}  empty {}  copy {id}  paste {id, src, to}
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
      scene: { files: [F('f1', 'My Folder', '📁', 'folder'), DOG('f1'), SUN('f1'), CAT('f1')], wins: [{ ref: 'f:f1', g: [0.72, 0.06, 0.26, 0.7] }] },
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
  ] }
];
/* the folder the learner made and named SCHOOL (its id is made by the game) */
function named(o, parent, name) { const k = o.kids(parent); for (let i = 0; i < k.length; i++) if (k[i].kind === 'folder' && same(k[i].name, name)) return k[i].id; return null; }
function schoolId(o) { const k = o.kids('desk'); for (let i = 0; i < k.length; i++) if (k[i].kind === 'folder' && same(k[i].name, 'SCHOOL')) return k[i].id; return null; }

CC.DESKTOP = { NAME: 'Desktop Skills', LEVELS: LEVELS };
})();
