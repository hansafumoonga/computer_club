/* clipart.js - the pictures a learner can add to a document (the colourful Scene Maker things and the Paint Studio drawings).
   Each one is drawn from the site's own SVG data and turned into a PNG picture first, so a document only ever holds PNG pictures
   (never SVG, which could carry script). */
(function () {
'use strict';
const CC = window.CC = window.CC || {};
const STYLE = '.r{stroke:#2b2540;stroke-width:3;stroke-linejoin:round}.ln{fill:none;stroke:#2b2540;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}';
const GROUPS = [
  { id: 'nature', name: 'Nature', icon: '🌳', items: ['sun', 'cloud', 'tree', 'flower', 'mountain', 'moon'] },
  { id: 'animals', name: 'Animals', icon: '🐱', items: ['cat', 'fish', 'butterfly', 'bird', 'cow', 'pig'] },
  { id: 'transport', name: 'Transport', icon: '🚗', items: ['car', 'bus', 'boat', 'rocket', 'balloon'] },
  { id: 'places', name: 'Places', icon: '🏠', items: ['house', 'castle'] },
  { id: 'shapes', name: 'Shapes', icon: '⭐', items: ['star', 'heart', 'snowman'] }
];
let list = null, cache = Object.create(null);
function build() {
  list = []; const scene = (CC.SCENE && CC.SCENE.ITEMS) || [], paint = (CC.PAINT && CC.PAINT.PICS) || [], byId = {};
  scene.forEach(function (it) { byId[it.id] = it; });
  GROUPS.forEach(function (g) { g.items.forEach(function (id) { if (byId[id]) list.push({ id: 's:' + id, name: byId[id].name, cat: g.id, svg: byId[id].svg, box: '-70 -70 140 140', w: 1, h: 1 }); }); });
  paint.forEach(function (p) { if (p.cat && p.svg) list.push({ id: 'p:' + p.id, name: p.name, cat: 'colouring', svg: p.svg, box: '0 0 480 300', w: 480, h: 300 }); });
}
function cats() {
  if (!list) build(); const out = GROUPS.map(function (g) { return { id: g.id, name: g.name, icon: g.icon }; });
  if (list.some(function (x) { return x.cat === 'colouring'; })) out.push({ id: 'colouring', name: 'Colouring pictures', icon: '🖍️' });
  return out;
}
function items(cat) { if (!list) build(); return list.filter(function (x) { return x.cat === cat; }).map(function (x) { return { id: x.id, name: x.name }; }); }
/* a clip-art picture as a PNG data address, drawn width pixels wide on a clear background: Promise of { src, w, h } */
function png(id, width) {
  if (!list) build(); width = Math.max(32, Math.min(1000, Math.round(width || 360)));
  const it = list.filter(function (x) { return x.id === id; })[0]; if (!it) return Promise.reject(new Error('That picture is not in the library.'));
  const k = id + '@' + width; if (cache[k]) return Promise.resolve(cache[k]);
  const ratio = it.h / it.w, w = width, h = Math.max(16, Math.round(width * ratio));
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + it.box + '" width="' + w + '" height="' + h + '"><style>' + STYLE + '</style>' + it.svg + '</svg>';
  return new Promise(function (ok, no) {
    const im = new Image();
    im.onload = function () {
      try {
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d').drawImage(im, 0, 0, w, h);
        const src = cv.toDataURL('image/png'); if (CC.docfile && !CC.docfile.isSafeImage(src)) { no(new Error('That picture could not be made.')); return; }
        cache[k] = { src: src, w: w, h: h }; ok(cache[k]);
      } catch (e) { no(e); }
    };
    im.onerror = function () { no(new Error('That picture could not be made.')); };
    im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}
CC.clipart = { cats: cats, items: items, png: png };
})();
