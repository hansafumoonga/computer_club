/* builder_data.js - the pictures of Builder Club, drawn as plain SVG pieces (no images needed).
   Every build is drawn on a 480 x 300 canvas. A piece is { w: the word to type, s: its drawing }.
   Pieces appear in order, so later pieces are drawn on top of earlier ones.
   To add a build: copy one entry in BUILDS, change the name, bg and pieces.  Words should be short and simple. */
(function () {
'use strict';
const CC = window.CC;

/* tiny drawing helpers (outlines come from CSS, so every shape gets the same friendly dark outline) */
function R(x, y, w, h, f, rx) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (rx || 0) + '" fill="' + f + '"/>'; }
function C(x, y, r, f) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + f + '"/>'; }
function E(x, y, rx, ry, f) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="' + f + '"/>'; }
function P(pts, f) { return '<polygon points="' + pts + '" fill="' + f + '"/>'; }
function D(d, f) { return '<path d="' + d + '" fill="' + (f || 'none') + '"/>'; }
function L(d, col, w) { return '<path d="' + d + '" fill="none" class="ln" style="stroke:' + col + ';stroke-width:' + (w || 5) + '"/>'; }
function X(x, y, w, h, f, rx) { return '<rect class="ns" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (rx || 0) + '" fill="' + f + '"/>'; }
function XC(x, y, r, f) { return '<circle class="ns" cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + f + '"/>'; }
function star(cx, cy, Ro, ri, f) { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, d = i % 2 ? ri : Ro; p.push((cx + Math.cos(a) * d).toFixed(1) + ',' + (cy + Math.sin(a) * d).toFixed(1)); } return '<polygon points="' + p.join(' ') + '" fill="' + f + '"/>'; }
function sun(x, y, r) { return C(x, y, r, '#ffd23f') + XC(x - r * 0.35, y - r * 0.1, r * 0.1, '#3a2f5a') + XC(x + r * 0.35, y - r * 0.1, r * 0.1, '#3a2f5a') + D('M' + (x - r * 0.35) + ',' + (y + r * 0.3) + ' Q' + x + ',' + (y + r * 0.65) + ' ' + (x + r * 0.35) + ',' + (y + r * 0.3)); }
function cloud(x, y, s) { s = s || 1; return E(x, y, 34 * s, 16 * s, '#fff') + E(x - 20 * s, y + 4 * s, 22 * s, 12 * s, '#fff') + E(x + 22 * s, y + 5 * s, 22 * s, 11 * s, '#fff') + E(x, y - 8 * s, 20 * s, 14 * s, '#fff'); }
function bird(x, y) { return L('M' + (x - 14) + ',' + y + ' Q' + (x - 7) + ',' + (y - 10) + ' ' + x + ',' + y + ' Q' + (x + 7) + ',' + (y - 10) + ' ' + (x + 14) + ',' + y, '#3a3e5a', 4); }
function tree(x, y, s) { s = s || 1; return R(x - 6 * s, y - 38 * s, 12 * s, 38 * s, '#a9703f') + C(x, y - 58 * s, 28 * s, '#4fbf5f') + C(x - 16 * s, y - 44 * s, 18 * s, '#5fcf6f') + C(x + 16 * s, y - 46 * s, 18 * s, '#5fcf6f'); }
function win(x, y, w, h) { return R(x, y, w, h, '#aee6ff', 3); }

const SKY = '#bfe8ff';
function grass(y) { return '<rect x="0" y="' + y + '" width="480" height="' + (300 - y) + '" fill="#86d86f"/><rect x="0" y="' + y + '" width="480" height="8" fill="#6cc65a"/>'; }
function sky(c) { return '<rect width="480" height="300" fill="' + (c || SKY) + '"/>'; }

const BUILDS = [
  { id: 1, name: 'Car', icon: '🚗', intro: 'Let us build a car!',
    bg: sky() + '<ellipse cx="90" cy="215" rx="150" ry="55" fill="#a9e49a"/><ellipse cx="400" cy="220" rx="130" ry="45" fill="#9ade8a"/>' + '<rect x="0" y="225" width="480" height="75" fill="#5b607a"/>' + '<rect x="0" y="225" width="480" height="6" fill="#8a90ac"/>' + [20, 120, 220, 320, 420].map(function (x) { return '<rect x="' + x + '" y="270" width="50" height="7" rx="3" fill="#fff"/>'; }).join(''),
    pieces: [
      { w: 'car', s: R(100, 168, 290, 52, '#ff5c72', 20) },
      { w: 'roof', s: P('165,172 196,114 310,114 340,172', '#ff8a98') },
      { w: 'glass', s: P('180,170 204,124 244,124 244,170', '#aee6ff') + P('252,170 252,124 300,124 322,170', '#aee6ff') },
      { w: 'wheel', s: C(160, 224, 31, '#3a3e5a') + C(160, 224, 13, '#cfd3e8') + C(334, 224, 31, '#3a3e5a') + C(334, 224, 13, '#cfd3e8') },
      { w: 'lamp', s: E(388, 194, 10, 13, '#ffe27a') + R(96, 188, 12, 20, '#ff9f45', 4) },
      { w: 'door', s: R(250, 176, 60, 42, '#ff7a8a', 8) + R(292, 190, 12, 5, '#fff', 2) },
      { w: 'sun', s: sun(420, 50, 30) }] },
  { id: 2, name: 'House', icon: '🏠', intro: 'Let us build a house!',
    bg: sky('#cdeeff') + cloud(90, 55) + grass(235),
    pieces: [
      { w: 'wall', s: R(130, 140, 220, 105, '#ffd9a0') },
      { w: 'roof', s: P('105,145 240,55 375,145', '#e8604c') },
      { w: 'door', s: R(218, 182, 46, 63, '#8a5a3a', 8) + C(254, 216, 3.5, '#ffd23f') },
      { w: 'glass', s: win(150, 165, 44, 44) + L('M172,165 V209 M150,187 H194', '#fff', 3) + win(286, 165, 44, 44) + L('M308,165 V209 M286,187 H330', '#fff', 3) },
      { w: 'pipe', s: R(302, 64, 30, 46, '#c9553f', 3) + R(298, 58, 38, 12, '#a8402f', 3) },
      { w: 'tree', s: tree(70, 245, 1.1) },
      { w: 'rose', s: L('M410,245 V215 M435,245 V205 M385,245 V220', '#3f9f4f', 4) + C(410, 212, 11, '#ff5c72') + C(435, 202, 11, '#ff8ad8') + C(385, 217, 10, '#ffd23f') },
      { w: 'sun', s: sun(425, 52, 30) }] },
  { id: 3, name: 'Rocket', icon: '🚀', intro: 'Let us build a rocket!',
    bg: sky('#1d2a66') + [[40, 40], [110, 100], [60, 180], [400, 60], [440, 140], [350, 30], [170, 30], [300, 120]].map(function (p) { return XC(p[0], p[1], 2.4, '#fff'); }).join('') + '<rect x="0" y="252" width="480" height="48" fill="#8a8fb5"/><rect x="0" y="252" width="480" height="6" fill="#a9aed0"/>',
    pieces: [
      { w: 'rocket', s: R(206, 85, 68, 150, '#f4f6ff', 30) },
      { w: 'nose', s: D('M206,100 Q240,0 274,100 Z', '#ff5c72') },
      { w: 'fin', s: P('206,175 162,238 206,228', '#ff5c72') + P('274,175 318,238 274,228', '#ff5c72') },
      { w: 'glass', s: C(240, 140, 22, '#7fd4ff') + XC(233, 133, 6, '#fff') },
      { w: 'fire', s: D('M214,236 Q240,300 266,236 Z', '#ffb52e') + D('M226,236 Q240,276 254,236 Z', '#ffe27a') },
      { w: 'star', s: star(90, 70, 16, 7, '#ffd23f') + star(380, 100, 12, 5, '#ffd23f') + star(420, 40, 10, 4, '#ffd23f') },
      { w: 'moon', s: C(80, 160, 38, '#f1ecd2') + C(68, 150, 8, '#d8d2b2') + C(92, 172, 6, '#d8d2b2') + C(96, 146, 5, '#d8d2b2') }] },
  { id: 4, name: 'Farm', icon: '🐄', intro: 'Let us build a farm!',
    bg: sky() + cloud(300, 45) + '<ellipse cx="120" cy="215" rx="190" ry="48" fill="#9ade8a"/>' + grass(230),
    pieces: [
      { w: 'barn', s: R(165, 120, 140, 110, '#e8604c') + P('153,126 235,66 317,126', '#a8402f') + R(210, 166, 50, 64, '#fff', 4) + L('M210,166 L260,230 M260,166 L210,230', '#e8604c', 4) },
      { w: 'silo', s: R(328, 96, 46, 134, '#cfd3e8', 6) + D('M328,100 Q351,60 374,100 Z', '#8a90ac') + L('M328,140 H374 M328,180 H374', '#aab0cc', 3) },
      { w: 'fence', s: L('M12,238 H146 M12,256 H146', '#c28f5a', 6) + [20, 55, 90, 125].map(function (x) { return R(x, 222, 10, 50, '#d9a46a', 3); }).join('') },
      { w: 'cow', s: '<g transform="translate(0,-16)">' + R(40, 250, 80, 36, '#fff', 16) + R(22, 244, 30, 28, '#fff', 10) + C(56, 262, 6, '#3a3e5a') + C(92, 268, 8, '#3a3e5a') + R(46, 280, 8, 14, '#fff', 2) + R(104, 280, 8, 14, '#fff', 2) + XC(30, 254, 2.5, '#3a3e5a') + '</g>' },
      { w: 'pig', s: '<g transform="translate(0,-16)">' + E(222, 268, 34, 22, '#ffb3c7') + C(262, 262, 17, '#ffb3c7') + E(274, 266, 7, 5, '#ff8aa8') + XC(262, 256, 2.5, '#3a3e5a') + R(204, 282, 9, 12, '#ff8aa8', 2) + R(230, 282, 9, 12, '#ff8aa8', 2) + '</g>' },
      { w: 'hay', s: '<g transform="translate(0,-16)">' + R(340, 246, 66, 40, '#f2c75c', 10) + L('M352,246 V286 M373,246 V286 M394,246 V286', '#d8a93a', 3) + '</g>' },
      { w: 'sun', s: sun(430, 48, 30) }] },
  { id: 5, name: 'Castle', icon: '🏰', intro: 'Let us build a castle!',
    bg: sky('#d6e6ff') + cloud(80, 50) + cloud(400, 70, 0.8) + grass(240),
    pieces: [
      { w: 'wall', s: R(120, 135, 240, 108, '#c9ccd9') + [126, 160, 194, 228, 262, 296, 330].map(function (x) { return R(x, 122, 22, 18, '#c9ccd9'); }).join('') + L('M120,175 H360 M120,210 H360', '#aeb2c4', 2) },
      { w: 'tower', s: R(78, 80, 56, 163, '#b4b8cc') + P('68,86 106,22 144,86', '#e8604c') + R(98, 120, 16, 28, '#4a4f72', 8) + R(346, 80, 56, 163, '#b4b8cc') + P('336,86 374,22 412,86', '#e8604c') + R(366, 120, 16, 28, '#4a4f72', 8) },
      { w: 'gate', s: D('M206,243 V190 Q240,150 274,190 V243 Z', '#6b4a3a') + L('M240,162 V243 M222,185 V243 M258,185 V243', '#4a3226', 3) },
      { w: 'flag', s: L('M106,24 V4', '#5a3f2a', 4) + P('106,5 106,19 136,12', '#ffd23f') + L('M374,24 V4', '#5a3f2a', 4) + P('374,5 374,19 404,12', '#ff5c72') },
      { w: 'moat', s: D('M30,246 Q70,236 110,246 T190,246 T270,246 T350,246 T430,246 V272 H30 Z', '#4f9bff') },
      { w: 'king', s: R(222, 212, 36, 40, '#a77bff', 8) + C(240, 200, 14, '#ffd9b0') + P('226,194 230,176 236,188 240,172 244,188 250,176 254,194', '#ffd23f') },
      { w: 'sun', s: sun(436, 112, 26) }] },
  { id: 6, name: 'Robot', icon: '🤖', intro: 'Let us build a robot!',
    bg: sky('#e6ddff') + '<rect x="0" y="262" width="480" height="38" fill="#c9bdf2"/><rect x="0" y="262" width="480" height="6" fill="#b3a5e8"/>' + XC(70, 60, 24, '#fff') + XC(420, 90, 30, '#fff'),
    pieces: [
      { w: 'body', s: R(180, 138, 120, 108, '#5aa8ff', 16) },
      { w: 'head', s: R(194, 62, 92, 72, '#9ad0ff', 18) },
      { w: 'eyes', s: C(222, 92, 14, '#fff') + C(258, 92, 14, '#fff') + C(224, 94, 6, '#3a3e5a') + C(256, 94, 6, '#3a3e5a') },
      { w: 'smile', s: D('M218,116 Q240,134 262,116') },
      { w: 'wire', s: L('M240,62 V30', '#3a3e5a', 4) + C(240, 24, 9, '#ff5c72') },
      { w: 'arms', s: R(132, 150, 40, 18, '#9ad0ff', 9) + C(132, 184, 14, '#ffd23f') + R(132, 160, 14, 24, '#9ad0ff', 5) + R(308, 150, 40, 18, '#9ad0ff', 9) + C(348, 184, 14, '#ffd23f') + R(334, 160, 14, 24, '#9ad0ff', 5) },
      { w: 'legs', s: R(200, 244, 26, 30, '#9ad0ff', 4) + R(254, 244, 26, 30, '#9ad0ff', 4) + R(188, 270, 48, 18, '#ff9f45', 8) + R(244, 270, 48, 18, '#ff9f45', 8) },
      { w: 'heart', s: D('M240,214 C214,190 222,168 240,182 C258,168 266,190 240,214 Z', '#ff5c72') }] },
  { id: 7, name: 'Boat', icon: '⛵', intro: 'Let us build a boat!',
    bg: sky() + cloud(110, 50) + '<rect x="0" y="195" width="480" height="105" fill="#3b8be8"/>' + '<path d="M0,195 Q30,185 60,195 T120,195 T180,195 T240,195 T300,195 T360,195 T420,195 T480,195 V210 H0 Z" fill="#5aa8ff"/>',
    pieces: [
      { w: 'boat', s: D('M130,200 H350 L320,250 H160 Z', '#ff9f45') + R(150, 214, 180, 6, '#ffd23f') },
      { w: 'mast', s: R(236, 62, 8, 140, '#8a5a3a', 2) },
      { w: 'sail', s: P('246,66 246,190 330,190', '#fff') + P('234,86 234,190 170,190', '#fff4d8') },
      { w: 'flag', s: P('242,62 242,84 280,73', '#ff5c72') },
      { w: 'wave', s: D('M120,228 Q145,216 170,228 T220,228 T270,228 T320,228 T370,228 V250 H120 Z', '#2f7be8') },
      { w: 'sun', s: sun(420, 52, 30) },
      { w: 'fish', s: E(70, 232, 20, 11, '#ff9f45') + P('88,232 106,220 106,244', '#ff9f45') + XC(58, 229, 2.5, '#3a3e5a') },
      { w: 'bird', s: bird(360, 90) + bird(400, 120) }] },
  { id: 8, name: 'Garden', icon: '🌷', intro: 'Let us build a garden!',
    bg: sky('#d6f0ff') + cloud(330, 55) + '<ellipse cx="240" cy="260" rx="300" ry="70" fill="#86d86f"/>',
    pieces: [
      { w: 'pond', s: E(130, 262, 78, 24, '#58b8ff') + E(110, 258, 20, 6, '#a8dcff') + C(160, 264, 11, '#4fbf5f') },
      { w: 'tree', s: tree(405, 250, 1.3) },
      { w: 'rose', s: L('M255,258 V218 M285,258 V208 M315,258 V224', '#3f9f4f', 4) + C(255, 214, 12, '#ff5c72') + C(285, 204, 12, '#ff8ad8') + C(315, 220, 11, '#ff5c72') },
      { w: 'tulip', s: L('M215,262 V228 M345,262 V230', '#3f9f4f', 4) + D('M205,228 Q215,200 225,228 Z', '#ffd23f') + D('M335,230 Q345,202 355,230 Z', '#a77bff') },
      { w: 'bee', s: E(300, 150, 16, 11, '#ffd23f') + R(296, 140, 5, 20, '#3a3e5a') + R(306, 141, 5, 18, '#3a3e5a') + E(296, 136, 10, 7, '#e3f4ff') + E(308, 136, 10, 7, '#e3f4ff') },
      { w: 'bug', s: C(60, 214, 13, '#ff5c72') + C(60, 202, 6, '#3a3e5a') + XC(55, 214, 2.5, '#3a3e5a') + XC(66, 218, 2.5, '#3a3e5a') },
      { w: 'bow', s: L('M40,170 Q150,40 260,170', '#ff5c72', 9) + L('M52,170 Q150,62 248,170', '#ffb52e', 9) + L('M64,170 Q150,84 236,170', '#ffe27a', 9) + L('M76,170 Q150,106 224,170', '#6bcb77', 9) + L('M88,170 Q150,128 212,170', '#4f9bff', 9) },
      { w: 'sun', s: sun(430, 48, 28) }] },
  { id: 9, name: 'Airport', icon: '✈️', intro: 'Let us build an airport!',
    bg: sky('#c2e8ff') + '<rect x="0" y="228" width="480" height="72" fill="#7a809c"/><rect x="0" y="228" width="480" height="6" fill="#9aa0ba"/>' + [10, 90, 170, 250, 330, 410].map(function (x) { return '<rect x="' + x + '" y="270" width="50" height="6" rx="3" fill="#fff"/>'; }).join(''),
    pieces: [
      { w: 'tower', s: R(50, 90, 36, 138, '#cfd3e8', 4) + R(36, 56, 64, 38, '#7fd4ff', 8) + R(30, 48, 76, 12, '#ff5c72', 5) + L('M68,48 V28', '#3a3e5a', 4) },
      { w: 'plane', s: E(270, 160, 100, 24, '#fff') + P('196,148 150,100 178,100 220,142', '#4f9bff') + P('290,170 250,210 290,210 330,170', '#4f9bff') + P('180,150 160,118 188,130', '#ff5c72') + [230, 262, 294, 326].map(function (x) { return C(x, 156, 7, '#aee6ff'); }).join('') + D('M356,150 Q372,160 356,172 Z', '#ff9f45') },
      { w: 'cloud', s: cloud(380, 60) + cloud(140, 40, 0.8) },
      { w: 'bus', s: R(340, 222, 100, 44, '#ffd23f', 10) + R(350, 230, 20, 16, '#aee6ff', 3) + R(376, 230, 20, 16, '#aee6ff', 3) + R(402, 230, 20, 16, '#aee6ff', 3) + C(362, 268, 12, '#3a3e5a') + C(418, 268, 12, '#3a3e5a') },
      { w: 'bag', s: R(130, 244, 40, 30, '#a77bff', 6) + L('M142,244 V236 H158 V244', '#3a3e5a', 4) + R(130, 256, 40, 5, '#7c5ad9') },
      { w: 'sun', s: sun(430, 40, 26) },
      { w: 'bird', s: bird(110, 100) + bird(150, 70) }] },
  { id: 10, name: 'City', icon: '🏙️', intro: 'The big one! Let us build a whole city!',
    bg: sky('#c8ecff') + '<rect x="0" y="255" width="480" height="45" fill="#86d86f"/>',
    pieces: [
      { w: 'road', s: R(0, 232, 480, 56, '#5b607a') + R(0, 228, 480, 8, '#b9c0d4') + [10, 80, 150, 220, 290, 360, 430].map(function (x) { return X(x, 258, 44, 6, '#fff', 3); }).join('') },
      { w: 'home', s: R(14, 168, 80, 62, '#ffd9a0') + P('6,172 54,126 102,172', '#e8604c') + R(44, 192, 20, 38, '#8a5a3a', 4) + win(20, 182, 18, 18) + win(70, 182, 18, 18) },
      { w: 'shop', s: R(104, 150, 72, 80, '#ff8ad8') + P('98,150 182,150 176,170 104,170', '#fff') + L('M116,152 V170 M134,152 V170 M152,152 V170 M170,152 V170', '#ff5c72', 5) + R(120, 192, 40, 38, '#aee6ff', 4) + R(118, 128, 44, 20, '#ffd23f', 4) },
      { w: 'school', s: R(186, 138, 112, 92, '#e8604c') + P('176,142 242,92 308,142', '#a8402f') + R(228, 176, 28, 54, '#8a5a3a', 4) + win(196, 156, 24, 22) + win(264, 156, 24, 22) + C(242, 124, 10, '#fff') },
      { w: 'tower', s: R(306, 52, 56, 178, '#4f9bff') + [66, 94, 122, 150, 178, 206].map(function (y) { return win(316, y, 14, 14) + win(338, y, 14, 14); }).join('') + R(326, 40, 16, 14, '#3a6fc0') },
      { w: 'bank', s: R(372, 148, 70, 82, '#a77bff') + P('366,150 407,118 448,150', '#7c5ad9') + [380, 398, 416].map(function (x) { return R(x, 164, 10, 50, '#e6ddff', 2); }).join('') + R(366, 214, 82, 16, '#7c5ad9') },
      { w: 'park', s: E(452, 232, 30, 10, '#6bcb77') + R(440, 214, 28, 6, '#a9703f') + R(442, 220, 4, 10, '#a9703f') + R(462, 220, 4, 10, '#a9703f') },
      { w: 'tree', s: tree(180, 232, 0.55) + tree(300, 232, 0.5) },
      { w: 'car', s: R(40, 244, 62, 18, '#ff5c72', 8) + R(54, 232, 34, 16, '#ff8a98', 6) + C(54, 264, 8, '#3a3e5a') + C(90, 264, 8, '#3a3e5a') },
      { w: 'bus', s: R(190, 240, 84, 26, '#ffd23f', 7) + R(198, 245, 14, 10, '#aee6ff', 2) + R(218, 245, 14, 10, '#aee6ff', 2) + R(238, 245, 14, 10, '#aee6ff', 2) + R(258, 245, 10, 10, '#aee6ff', 2) + C(208, 267, 8, '#3a3e5a') + C(256, 267, 8, '#3a3e5a') },
      { w: 'bridge', s: R(0, 108, 170, 9, '#8a90ac') + R(10, 117, 8, 38, '#8a90ac') + R(150, 117, 8, 38, '#8a90ac') + L('M0,121 Q80,150 170,121', '#8a90ac', 3) },
      { w: 'train', s: R(18, 86, 44, 22, '#ff5c72', 5) + R(66, 86, 40, 22, '#ffd23f', 5) + R(110, 86, 40, 22, '#4fbf5f', 5) + win(24, 90, 12, 10) + win(72, 90, 12, 10) + win(116, 90, 12, 10) + C(32, 110, 5, '#3a3e5a') + C(90, 110, 5, '#3a3e5a') + C(134, 110, 5, '#3a3e5a') },
      { w: 'sun', s: sun(30, 32, 22) },
      { w: 'cloud', s: cloud(250, 48, 0.9) + cloud(120, 32, 0.7) },
      { w: 'bird', s: bird(200, 72) + bird(228, 90) },
      { w: 'kite', s: P('90,40 112,64 90,88 68,64', '#ff5c72') + L('M90,88 Q80,120 92,150', '#8a5a3a', 2) + P('88,100 80,112 92,108', '#ffd23f') },
      { w: 'rocket', s: R(396, 22, 20, 52, '#f4f6ff', 10) + D('M396,32 Q406,2 416,32 Z', '#ff5c72') + P('396,56 384,76 396,70', '#ff5c72') + P('416,56 428,76 416,70', '#ff5c72') + C(406, 44, 5, '#7fd4ff') + D('M398,74 Q406,96 414,74 Z', '#ffb52e') },
      { w: 'balloon', s: E(448, 70, 16, 20, '#ff8ad8') + L('M448,90 Q444,108 450,124', '#8a5a3a', 2) + R(444, 124, 12, 8, '#a9703f', 2) },
      { w: 'flag', s: L('M242,92 V66', '#5a3f2a', 3) + P('242,66 242,78 262,72', '#ffd23f') }] }
];

CC.BUILDER = { BUILDS: BUILDS };
})();
