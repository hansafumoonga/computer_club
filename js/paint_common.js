/* paint_common.js - pieces shared by the painting games (Paint Studio, Magic Mix, Art Studio, Scene Maker):
   the colour palette, the choosable backgrounds and the save-as-picture helpers. Plain data and small functions. */
(function () {
'use strict';
const CC = window.CC;

const COLOURS = [['red', '#ff3b4e'], ['orange', '#ff9f1a'], ['yellow', '#ffd800'], ['light green', '#8ee04e'], ['green', '#2fa84f'], ['turquoise', '#1ec8c8'], ['sky blue', '#5ac8ff'], ['blue', '#2f6bff'],
  ['purple', '#8a4dff'], ['pink', '#ff7ac8'], ['brown', '#8a5a2b'], ['tan', '#e8c08a'], ['grey', '#9aa0b4'], ['black', '#222222'], ['white', '#ffffff']];

/* backgrounds: 480 x 300 pictures that sit behind a painting. To add one, add an entry with its own drawing. */
function stars(list, r) { return list.map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (p[2] || r || 2) + '" fill="#fff"/>'; }).join(''); }
function lg(id, a, b, x2, y2) { return '<defs><linearGradient id="bg_' + id + '" x1="0" y1="0" x2="' + (x2 || 0) + '" y2="' + (y2 == null ? 1 : y2) + '"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient></defs><rect width="480" height="300" fill="url(#bg_' + id + ')"/>'; }
function cloud(x, y, s) { s = s || 1; return '<g fill="#fff" opacity=".9"><ellipse cx="' + x + '" cy="' + y + '" rx="' + 38 * s + '" ry="' + 16 * s + '"/><ellipse cx="' + (x - 22 * s) + '" cy="' + (y + 4 * s) + '" rx="' + 24 * s + '" ry="' + 12 * s + '"/><ellipse cx="' + (x + 24 * s) + '" cy="' + (y + 5 * s) + '" rx="' + 24 * s + '" ry="' + 11 * s + '"/><ellipse cx="' + x + '" cy="' + (y - 9 * s) + '" rx="' + 22 * s + '" ry="' + 14 * s + '"/></g>'; }
const BACKGROUNDS = [
  { id: 'white', name: 'White', svg: '<rect width="480" height="300" fill="#ffffff"/>' },
  { id: 'cream', name: 'Paper', svg: '<rect width="480" height="300" fill="#fff6dc"/>' },
  { id: 'sky', name: 'Sky', svg: lg('sky', '#7ccaff', '#e3f6ff') + cloud(90, 70) + cloud(360, 50, 0.8) + cloud(250, 130, 0.7) },
  { id: 'sunset', name: 'Sunset', svg: lg('sunset', '#6a4cc9', '#ffb36b') + '<circle cx="240" cy="230" r="60" fill="#ffe08a"/><rect y="236" width="480" height="64" fill="#3b2a6e"/>' },
  { id: 'night', name: 'Night', svg: lg('night', '#0e1a47', '#3a2f7a') + stars([[40, 40], [120, 80], [200, 30], [290, 70], [380, 36], [440, 100], [70, 150], [330, 140], [150, 200, 1.6], [420, 190, 1.6]], 2.2) + '<circle cx="390" cy="60" r="26" fill="#f6efc8"/><circle cx="400" cy="54" r="22" fill="#0e1a47" opacity=".0"/>' },
  { id: 'grass', name: 'Grass', svg: lg('grass', '#bfe8ff', '#eaf9ff') + '<ellipse cx="120" cy="290" rx="260" ry="90" fill="#86d86f"/><ellipse cx="400" cy="296" rx="240" ry="80" fill="#6cc65a"/>' + cloud(110, 60, 0.9) },
  { id: 'sea', name: 'Sea', svg: lg('sea', '#9fe0ff', '#2f7be8') + '<path d="M0,170 Q40,150 80,170 T160,170 T240,170 T320,170 T400,170 T480,170 V300 H0 Z" fill="#3b8be8" opacity=".85"/><path d="M0,220 Q40,200 80,220 T160,220 T240,220 T320,220 T400,220 T480,220 V300 H0 Z" fill="#2f6bd0" opacity=".9"/>' },
  { id: 'sand', name: 'Beach', svg: lg('sand', '#bfeaff', '#eaf9ff') + '<rect y="110" width="480" height="190" fill="#f3d9a0"/><path d="M0,110 Q60,92 120,110 T240,110 T360,110 T480,110 V130 H0 Z" fill="#6fc7ff"/>' },
  { id: 'snow', name: 'Snow', svg: lg('snow', '#cfe3f7', '#ffffff') + stars([[60, 50], [150, 90], [240, 40], [330, 80], [420, 50], [100, 160], [200, 190], [300, 150], [400, 190], [40, 230], [440, 130]], 3.2) },
  { id: 'space', name: 'Space', svg: lg('space', '#1a1040', '#3b1f6e') + stars([[30, 30], [100, 120], [180, 50], [260, 160], [340, 30], [420, 110], [60, 210], [220, 240], [400, 240], [300, 90]], 1.8) + '<circle cx="380" cy="190" r="30" fill="#ff9f45"/><ellipse cx="380" cy="190" rx="50" ry="9" fill="none" stroke="#ffd9a0" stroke-width="4"/><circle cx="90" cy="70" r="14" fill="#8fd8ff"/>' },
  { id: 'rainbow', name: 'Rainbow', svg: '<defs><linearGradient id="bg_rb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd1dc"/><stop offset=".25" stop-color="#ffe9b3"/><stop offset=".5" stop-color="#d4f5c9"/><stop offset=".75" stop-color="#c9e8ff"/><stop offset="1" stop-color="#e3d1ff"/></linearGradient></defs><rect width="480" height="300" fill="url(#bg_rb)"/>' },
  { id: 'dots', name: 'Dots', svg: '<rect width="480" height="300" fill="#fff0f6"/>' + (function () { let s = ''; for (let y = 20; y < 300; y += 40) for (let x = ((y / 40) % 2) * 20 + 20; x < 480; x += 40) s += '<circle cx="' + x + '" cy="' + y + '" r="7" fill="#ffc2dc"/>'; return s; })() }
];
function bgInner(id, solid) { if (solid) return '<rect width="480" height="300" fill="' + solid + '"/>'; const b = BACKGROUNDS.filter(function (x) { return x.id === id; })[0] || BACKGROUNDS[0]; return b.svg; }
function bgSvg(id, solid) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 300" preserveAspectRatio="none">' + bgInner(id, solid) + '</svg>'; }

function download(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800); }
/* turn svg text into a picture (png blob) of the given size */
function svgToBlob(svgText, w, h) {
  return new Promise(function (resolve) {
    const img = new Image();
    img.onload = function () { const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(img, 0, 0, w, h); c.toBlob(resolve, 'image/png'); };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgText);
  });
}
/* a row of backgrounds to choose from; onPick(id) is called when one is chosen */
function backgroundPicker(current, onPick) {
  const wrap = document.createElement('div'); wrap.className = 'pc-bgs';
  BACKGROUNDS.forEach(function (b) {
    const t = document.createElement('button'); t.type = 'button'; t.className = 'pc-bg' + (b.id === current ? ' on' : ''); t.title = b.name; t.setAttribute('aria-label', b.name + ' background');
    t.innerHTML = bgSvg(b.id).replace(/bg_/g, 'th_') + '<span>' + b.name + '</span>';       // own gradient names, so a hidden picker can never break the real background
    t.addEventListener('click', function () { t.blur(); wrap.querySelectorAll('.pc-bg').forEach(function (x) { x.classList.remove('on'); }); t.classList.add('on'); onPick(b.id); });
    wrap.appendChild(t);
  });
  return wrap;
}
/* the colour palette; returns the element. onPick(hex) */
function palette(current, onPick, withCustom) {
  const pal = document.createElement('div'); pal.className = 'pt-palette';
  COLOURS.forEach(function (c) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'pt-col' + (c[1] === current ? ' on' : ''); b.style.setProperty('--c', c[1]); b.setAttribute('aria-label', c[0]); b.title = c[0];
    b.addEventListener('click', function () { b.blur(); pal.querySelectorAll('.pt-col').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); onPick(c[1]); CC.sfx.tick(); });
    pal.appendChild(b);
  });
  if (withCustom) {
    const l = document.createElement('label'); l.className = 'pt-col custom'; l.title = 'Pick any colour'; l.innerHTML = '<span>＋</span>';
    const i = document.createElement('input'); i.type = 'color'; i.value = '#ff3b4e'; i.setAttribute('aria-label', 'choose any colour');
    i.addEventListener('input', function () { pal.querySelectorAll('.pt-col').forEach(function (x) { x.classList.remove('on'); }); l.classList.add('on'); l.style.setProperty('--c', i.value); onPick(i.value); });
    l.appendChild(i); pal.appendChild(l);
  }
  return pal;
}
CC.PCOM = { COLOURS: COLOURS, BACKGROUNDS: BACKGROUNDS, bgInner: bgInner, bgSvg: bgSvg, download: download, svgToBlob: svgToBlob, backgroundPicker: backgroundPicker, palette: palette };
})();
