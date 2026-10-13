/* scene_items.js - the things Scene Maker children can drag onto their picture. Each is drawn around the point (0,0), about 120 wide,
   from shapes with class "r" (so every part can be painted a new colour). To add an item, add one entry to ITEMS. */
(function () {
'use strict';
const CC = window.CC;
function RR(x, y, w, h, rx, f) { return '<rect class="r" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (rx || 0) + '" fill="' + f + '"/>'; }
function CI(x, y, r, f) { return '<circle class="r" cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + f + '"/>'; }
function EL(x, y, rx, ry, f) { return '<ellipse class="r" cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="' + f + '"/>'; }
function PO(pts, f) { return '<polygon class="r" points="' + pts + '" fill="' + f + '"/>'; }
function PA(d, f) { return '<path class="r" d="' + d + '" fill="' + f + '"/>'; }
function star(cx, cy, R, r, f) { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, d = i % 2 ? r : R; p.push((cx + Math.cos(a) * d).toFixed(1) + ',' + (cy + Math.sin(a) * d).toFixed(1)); } return PO(p.join(' '), f); }

const ITEMS = [
  { id: 'sun', name: 'Sun', svg: [0, 1, 2, 3, 4, 5, 6, 7].map(function (i) { const a = i * Math.PI / 4; return PO((Math.cos(a - 0.2) * 34).toFixed(1) + ',' + (Math.sin(a - 0.2) * 34).toFixed(1) + ' ' + (Math.cos(a) * 56).toFixed(1) + ',' + (Math.sin(a) * 56).toFixed(1) + ' ' + (Math.cos(a + 0.2) * 34).toFixed(1) + ',' + (Math.sin(a + 0.2) * 34).toFixed(1), '#ffb52e'); }).join('') + CI(0, 0, 34, '#ffd800') },
  { id: 'cloud', name: 'Cloud', svg: PA('M-50,18 Q-62,-8 -30,-10 Q-22,-38 4,-28 Q26,-46 38,-18 Q64,-14 50,18 Z', '#ffffff') },
  { id: 'tree', name: 'Tree', svg: RR(-7, 8, 14, 46, 3, '#8a5a2b') + CI(0, -14, 34, '#2fa84f') + CI(-24, 6, 24, '#3fbf5f') + CI(24, 6, 24, '#3fbf5f') },
  { id: 'flower', name: 'Flower', svg: RR(-3, 6, 6, 50, 2, '#2fa84f') + EL(-14, 36, 14, 6, '#3fbf5f') + EL(14, 28, 14, 6, '#3fbf5f') + [0, 1, 2, 3, 4].map(function (i) { const a = i * 1.2566 - 1.57; return CI((Math.cos(a) * 18).toFixed(1), (Math.sin(a) * 18 - 22).toFixed(1), 14, '#ff7ac8'); }).join('') + CI(0, -22, 12, '#ffd800') },
  { id: 'house', name: 'House', svg: RR(-45, -5, 90, 55, 0, '#f3d9a0') + PO('-55,-5 0,-52 55,-5', '#e8604c') + RR(-10, 15, 20, 35, 2, '#8a5a2b') + RR(-36, 4, 20, 20, 2, '#aee6ff') + RR(16, 4, 20, 20, 2, '#aee6ff') },
  { id: 'car', name: 'Car', svg: RR(-56, -4, 112, 32, 12, '#ff3b4e') + PO('-30,-4 -18,-30 22,-30 36,-4', '#ff7a8a') + PO('-22,-6 -14,-24 4,-24 4,-6', '#aee6ff') + PO('10,-6 10,-24 20,-24 28,-6', '#aee6ff') + CI(-30, 30, 14, '#3a3e5a') + CI(-30, 30, 5, '#cfd3e8') + CI(30, 30, 14, '#3a3e5a') + CI(30, 30, 5, '#cfd3e8') },
  { id: 'bus', name: 'Bus', svg: RR(-58, -26, 116, 56, 10, '#ffd800') + [-46, -24, -2, 20].map(function (x) { return RR(x, -18, 18, 18, 3, '#aee6ff'); }).join('') + RR(40, -18, 12, 34, 3, '#aee6ff') + CI(-34, 32, 13, '#3a3e5a') + CI(-34, 32, 5, '#cfd3e8') + CI(30, 32, 13, '#3a3e5a') + CI(30, 32, 5, '#cfd3e8') },
  { id: 'boat', name: 'Boat', svg: PO('2,-52 2,10 46,10', '#ffffff') + PO('-4,-40 -4,10 -36,10', '#fff2c8') + RR(-3, -54, 5, 66, 1, '#8a5a2b') + PA('M-52,12 H52 L38,38 H-38 Z', '#ff9f1a') },
  { id: 'rocket', name: 'Rocket', svg: PA('M-10,34 Q0,60 10,34 Z', '#ffb52e') + PO('-14,10 -34,36 -14,30', '#ff3b4e') + PO('14,10 34,36 14,30', '#ff3b4e') + RR(-15, -34, 30, 70, 14, '#f4f6ff') + PA('M-15,-26 Q0,-62 15,-26 Z', '#ff3b4e') + CI(0, -8, 9, '#5ac8ff') },
  { id: 'star', name: 'Star', svg: star(0, 2, 52, 22, '#ffd800') },
  { id: 'heart', name: 'Heart', svg: PA('M0,40 C-70,-4 -36,-52 0,-20 C36,-52 70,-4 0,40 Z', '#ff3b6e') },
  { id: 'cat', name: 'Cat', svg: PO('-24,-18 -30,-48 -6,-30', '#ff9f1a') + PO('24,-18 30,-48 6,-30', '#ff9f1a') + EL(0, 28, 30, 26, '#ff9f1a') + CI(0, -8, 28, '#ff9f1a') + CI(-10, -10, 5, '#ffffff') + CI(10, -10, 5, '#ffffff') + CI(-10, -10, 2.4, '#222') + CI(10, -10, 2.4, '#222') + PO('-4,0 4,0 0,6', '#ff7ac8') },
  { id: 'fish', name: 'Fish', svg: PO('28,0 58,-24 58,24', '#ff9f1a') + EL(0, 0, 40, 26, '#2f6bff') + CI(-20, -6, 6, '#ffffff') + CI(-20, -6, 2.6, '#222') + PA('M-4,-24 Q10,-44 22,-22 Z', '#5ac8ff') },
  { id: 'butterfly', name: 'Butterfly', svg: EL(-26, -14, 28, 22, '#8a4dff') + EL(26, -14, 28, 22, '#8a4dff') + EL(-20, 20, 20, 16, '#ff7ac8') + EL(20, 20, 20, 16, '#ff7ac8') + EL(0, 4, 6, 34, '#3a3e5a') + CI(-24, -14, 8, '#ffd800') + CI(24, -14, 8, '#ffd800') },
  { id: 'bird', name: 'Bird', svg: PO('-34,0 -52,-12 -52,12', '#ff9f1a') + EL(0, 6, 32, 22, '#5ac8ff') + CI(26, -14, 15, '#5ac8ff') + PO('38,-16 54,-12 38,-8', '#ff9f1a') + CI(30, -17, 3, '#222') + EL(-4, 8, 16, 10, '#2f6bff') },
  { id: 'cow', name: 'Cow', svg: RR(-48, -16, 92, 42, 14, '#ffffff') + RR(-40, 20, 12, 30, 3, '#ffffff') + RR(-14, 20, 12, 30, 3, '#ffffff') + RR(14, 20, 12, 30, 3, '#ffffff') + RR(32, 20, 12, 30, 3, '#ffffff') + EL(-20, -2, 14, 10, '#3a3e5a') + EL(16, 8, 14, 10, '#3a3e5a') + RR(36, -34, 32, 34, 12, '#ffffff') + CI(56, -20, 3, '#222') + EL(58, -8, 11, 6, '#ffb3c7') },
  { id: 'pig', name: 'Pig', svg: RR(-36, 24, 12, 24, 3, '#ff9ab8') + RR(8, 24, 12, 24, 3, '#ff9ab8') + EL(0, 8, 42, 30, '#ffb3c7') + CI(-40, 2, 24, '#ffb3c7') + EL(-60, 8, 10, 8, '#ff8aa8') + CI(-46, -6, 3, '#222') + PO('-52,-18 -44,-34 -34,-16', '#ff8aa8') },
  { id: 'castle', name: 'Castle', svg: RR(-44, -14, 88, 62, 0, '#c9ccd9') + RR(-56, -40, 26, 88, 0, '#b4b8cc') + PO('-60,-40 -43,-62 -26,-40', '#e8604c') + RR(30, -40, 26, 88, 0, '#b4b8cc') + PO('26,-40 43,-62 60,-40', '#e8604c') + PA('M-12,48 V16 Q0,2 12,16 V48 Z', '#6b4a3a') },
  { id: 'balloon', name: 'Balloon', svg: '<path d="M0,22 Q-8,40 4,56" fill="none" stroke="#2b2540" stroke-width="3"/>' + EL(0, -16, 26, 34, '#ff3b4e') + PO('-5,20 5,20 0,28', '#ff3b4e') },
  { id: 'mountain', name: 'Mountain', svg: PO('-58,40 -10,-44 18,0 34,-24 62,40', '#8a90ac') + PO('-10,-44 -26,-16 -14,-22 -6,-12 6,-22 12,-14', '#ffffff') },
  { id: 'moon', name: 'Moon', svg: PA('M10,-50 A46,46 0 1 0 10,50 A36,36 0 1 1 10,-50 Z', '#ffe9a0') },
  { id: 'snowman', name: 'Snowman', svg: CI(0, 32, 26, '#ffffff') + CI(0, -2, 20, '#ffffff') + CI(0, -28, 14, '#ffffff') + RR(-12, -52, 24, 14, 2, '#3a3e5a') + RR(-18, -40, 36, 5, 2, '#3a3e5a') + PO('0,-28 16,-24 0,-22', '#ff9f1a') + CI(-5, -31, 2, '#222') + CI(5, -31, 2, '#222') }
];
CC.SCENE = { ITEMS: ITEMS };
})();
