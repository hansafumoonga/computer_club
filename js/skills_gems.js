/* skills_gems.js - the jewels of Click & Type Quest. Every finished level gives one drawn gem (instead of a badge).
   Each gem is plain SVG made in code, so nothing is downloaded. CC.SKILLS.gem(kind, px) returns the picture as a string.
   To add a gem: add a name to GEMS (colour, cut) and put the same kind on a level in skills_levels.js. */
(function () {
'use strict';
const CC = window.CC; if (!CC || !CC.SKILLS) return;
const TAU = Math.PI * 2;
let uid = 0;

/* ---- cuts: each returns the outline of the gem as [x,y] points around (0,0) ---- */
function circ(n, rx, ry, rot) { const p = []; for (let i = 0; i < n; i++) { const a = (rot || 0) + i / n * TAU; p.push([Math.cos(a) * rx, Math.sin(a) * ry]); } return p; }
function superell(n, rx, ry, e) { const p = []; for (let i = 0; i < n; i++) { const a = i / n * TAU, c = Math.cos(a), s = Math.sin(a); p.push([Math.sign(c) * Math.pow(Math.abs(c), 2 / e) * rx, Math.sign(s) * Math.pow(Math.abs(s), 2 / e) * ry]); } return p; }
const CUT = {
  round:    function () { return circ(16, 80, 80, 0.2); },
  oval:     function () { return circ(20, 62, 82, 0); },
  cushion:  function () { return superell(20, 76, 76, 3.2); },
  emerald:  function () { const w = 60, h = 82, c = 26; return [[-w + c, -h], [w - c, -h], [w, -h + c], [w, h - c], [w - c, h], [-w + c, h], [-w, h - c], [-w, -h + c]]; },
  princess: function () { const s = 72, p = []; [[-s, -s], [0, -s], [s, -s], [s, 0], [s, s], [0, s], [-s, s], [-s, 0]].forEach(function (q) { p.push(q); }); return p; },
  hex:      function () { return circ(6, 82, 82, Math.PI / 6); },
  marquise: function () { return superell(20, 56, 86, 1.55); },
  pear:     function () { const p = []; for (let i = 0; i < 22; i++) { const t = i / 22 * TAU; p.push([80 * Math.sin(t) * Math.sin(t / 2), -82 * Math.cos(t)]); } return p; },
  heart:    function () { const p = []; for (let i = 0; i < 24; i++) { const t = i / 24 * TAU; p.push([16 * Math.pow(Math.sin(t), 3), -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]); } return p; },
  tri:      function () { const c = circ(3, 88, 88, -Math.PI / 2), p = []; for (let i = 0; i < 3; i++) { const a = c[i], b = c[(i + 1) % 3]; for (let k = 0; k < 3; k++) p.push([a[0] + (b[0] - a[0]) * k / 3, a[1] + (b[1] - a[1]) * k / 3]); } return p; },
  star:     function () { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, d = i % 2 ? 40 : 90; p.push([Math.cos(a) * d, Math.sin(a) * d]); } return p; }
};
/* scale a point list to a 150 box and centre it at (100,96) */
function fit(pts, size) {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; pts.forEach(function (p) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
  const k = size / Math.max(x1 - x0, y1 - y0), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  return pts.map(function (p) { return [100 + (p[0] - cx) * k, 96 + (p[1] - cy) * k]; });
}
function pts(a) { return a.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '); }
function sparkle(x, y, r, o) { return '<path d="M' + x + ' ' + (y - r) + ' Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + ' Q' + x + ' ' + y + ' ' + x + ' ' + (y + r) + ' Q' + x + ' ' + y + ' ' + (x - r) + ' ' + y + ' Q' + x + ' ' + y + ' ' + x + ' ' + (y - r) + 'Z" fill="#fff" opacity="' + (o || 0.95) + '"/>'; }
function wrap(id, body, extra) {
  return '<svg class="gem" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><radialGradient id="sh' + id + '"><stop offset="0" stop-color="#000" stop-opacity=".38"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>' + (extra || '') + '</defs>' +
    '<ellipse cx="100" cy="182" rx="58" ry="10" fill="url(#sh' + id + ')"/>' + body + '</svg>';
}

/* a faceted gem: an outer ring of facets (lit from the top left), a bright table in the middle and little sparkles */
function faceted(cut, hue, sat, base, id) {
  const o = fit(CUT[cut](), 150), n = o.length, k = cut === 'star' ? 0.5 : 0.58;
  const inn = o.map(function (p) { return [100 + (p[0] - 100) * k, 96 + (p[1] - 96) * k - 4]; });
  const L = -2.3; let g = '';
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n, mx = (o[i][0] + o[j][0]) / 2 - 100, my = (o[i][1] + o[j][1]) / 2 - 96, a = Math.atan2(my, mx), sh = Math.cos(a - L);
    const light = base + 24 * sh + (i % 2 ? 5 : -5);
    g += '<polygon points="' + pts([o[i], o[j], inn[j], inn[i]]) + '" fill="hsl(' + hue + ',' + sat + '%,' + light.toFixed(0) + '%)" stroke="rgba(255,255,255,.4)" stroke-width="1.2" stroke-linejoin="round"/>';
  }
  const tb = 'hsl(' + hue + ',' + sat + '%,' + (base + 24) + '%)', td = 'hsl(' + hue + ',' + sat + '%,' + (base + 6) + '%)';
  g += '<polygon points="' + pts(inn) + '" fill="url(#tb' + id + ')" stroke="rgba(255,255,255,.55)" stroke-width="1.4" stroke-linejoin="round"/>';
  g += '<polygon points="' + pts(o) + '" fill="none" stroke="hsl(' + hue + ',' + sat + '%,' + Math.max(14, base - 26) + '%)" stroke-width="3.2" stroke-linejoin="round"/>';
  g += '<polygon points="' + pts(inn.map(function (p) { return [100 + (p[0] - 100) * 0.55, 92 + (p[1] - 92) * 0.55]; })) + '" fill="#fff" opacity=".32"/>';
  g += sparkle(70, 62, 13) + sparkle(138, 126, 8, 0.85) + sparkle(150, 58, 5, 0.8);
  return wrap(id, g, '<linearGradient id="tb' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + tb + '"/><stop offset="1" stop-color="' + td + '"/></linearGradient>');
}

/* the opal: a smooth dome with soft rainbow colours inside */
function opal(id) {
  let g = '<ellipse cx="100" cy="100" rx="82" ry="70" fill="url(#ob' + id + ')" stroke="#5a4a7a" stroke-width="3.5"/>';
  [['#ff7ad0', 70, 86, 34], ['#5ee0ff', 118, 76, 30], ['#7dffa6', 92, 120, 32], ['#ffe27a', 132, 112, 26], ['#b58cff', 62, 118, 22]].forEach(function (b) { g += '<circle cx="' + b[1] + '" cy="' + b[2] + '" r="' + b[3] + '" fill="' + b[0] + '" opacity=".5" clip-path="url(#oc' + id + ')"/>'; });
  g += '<ellipse cx="100" cy="100" rx="82" ry="70" fill="url(#ov' + id + ')"/>';
  g += '<ellipse cx="72" cy="66" rx="30" ry="14" fill="#fff" opacity=".7" transform="rotate(-24 72 66)"/>' + sparkle(142, 70, 10) + sparkle(60, 120, 6, 0.8);
  return wrap(id, g, '<radialGradient id="ob' + id + '" cx=".4" cy=".35" r=".85"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#d8e8ff"/><stop offset="1" stop-color="#8d78c8"/></radialGradient>' +
    '<radialGradient id="ov' + id + '" cx=".5" cy=".5" r=".6"><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#4a3a8a" stop-opacity=".45"/></radialGradient>' +
    '<clipPath id="oc' + id + '"><ellipse cx="100" cy="100" rx="82" ry="70"/></clipPath>');
}

/* the golden crown: the big prize for the last level */
function crown(id) {
  let g = '<path d="M30 150 L22 66 L62 104 L100 44 L138 104 L178 66 L170 150 Z" fill="url(#cg' + id + ')" stroke="#7a5200" stroke-width="3.5" stroke-linejoin="round"/>';
  g += '<path d="M62 104 L100 150 M138 104 L100 150" stroke="#b8860b" stroke-width="2" opacity=".6"/>';
  g += '<rect x="28" y="140" width="144" height="30" rx="8" fill="url(#cb' + id + ')" stroke="#7a5200" stroke-width="3.5"/>';
  [[22, 62], [100, 40], [178, 62]].forEach(function (p) { g += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="10" fill="url(#cp' + id + ')" stroke="#9a8a9a" stroke-width="2"/>'; });
  [[56, '#ff3b5c'], [100, '#3b82f6'], [144, '#2fd07a']].forEach(function (p) { g += '<ellipse cx="' + p[0] + '" cy="155" rx="12" ry="10" fill="' + p[1] + '" stroke="#fff" stroke-width="2.2"/><ellipse cx="' + (p[0] - 3) + '" cy="151" rx="4" ry="2.6" fill="#fff" opacity=".85"/>'; });
  g += '<polygon points="100,72 108,90 100,108 92,90" fill="#fff" stroke="#fff3b0" stroke-width="1.5" opacity=".92"/>' + sparkle(52, 90, 12) + sparkle(150, 92, 8, 0.9);
  return wrap(id, g, '<linearGradient id="cg' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3b0"/><stop offset=".4" stop-color="#f5c542"/><stop offset=".75" stop-color="#c98f0b"/><stop offset="1" stop-color="#f7d46a"/></linearGradient>' +
    '<linearGradient id="cb' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe98a"/><stop offset="1" stop-color="#b8860b"/></linearGradient>' +
    '<radialGradient id="cp' + id + '" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#c8c8dc"/></radialGradient>');
}

/* name, cut, hue, saturation, base lightness; the order matches the levels */
const GEMS = {
  diamond:   { name: 'Diamond',     cut: 'round',    h: 198, s: 62, l: 66 },
  ruby:      { name: 'Ruby',        cut: 'heart',    h: 350, s: 80, l: 46 },
  emerald:   { name: 'Emerald',     cut: 'emerald',  h: 146, s: 70, l: 38 },
  sapphire:  { name: 'Sapphire',    cut: 'oval',     h: 222, s: 82, l: 44 },
  amethyst:  { name: 'Amethyst',    cut: 'pear',     h: 276, s: 62, l: 46 },
  topaz:     { name: 'Topaz',       cut: 'hex',      h: 32,  s: 92, l: 50 },
  quartz:    { name: 'Rose Quartz', cut: 'marquise', h: 330, s: 72, l: 62 },
  aqua:      { name: 'Aquamarine',  cut: 'princess', h: 176, s: 70, l: 46 },
  citrine:   { name: 'Citrine',     cut: 'tri',      h: 48,  s: 94, l: 52 },
  opal:      { name: 'Opal',        special: 'opal',  h: 268, s: 45, l: 70 },
  stargem:   { name: 'Star Gem',    cut: 'star',     h: 44,  s: 96, l: 54 },
  crown:     { name: 'Golden Crown', special: 'crown', h: 44, s: 90, l: 55 },
  /* the gems of Desktop Skills */
  garnet:    { name: 'Garnet',      cut: 'cushion',  h: 8,   s: 72, l: 38 },
  peridot:   { name: 'Peridot',     cut: 'marquise', h: 78,  s: 70, l: 46 },
  moonstone: { name: 'Moonstone',   cut: 'oval',     h: 212, s: 38, l: 68 },
  tanzanite: { name: 'Tanzanite',   cut: 'princess', h: 252, s: 72, l: 46 },
  jade:      { name: 'Jade',        cut: 'hex',      h: 160, s: 56, l: 38 },
  amber:     { name: 'Amber',       cut: 'emerald',  h: 34,  s: 90, l: 46 },
  /* the pro levels of Desktop Skills (Years 4 to 6) */
  turquoise: { name: 'Turquoise',   cut: 'pear',     h: 174, s: 68, l: 46 },
  rhodolite: { name: 'Rhodolite',   cut: 'heart',    h: 335, s: 68, l: 50 },
  sunstone:  { name: 'Sunstone',    cut: 'tri',      h: 22,  s: 92, l: 52 },
  iolite:    { name: 'Iolite',      cut: 'round',    h: 232, s: 58, l: 42 },
  spinel:    { name: 'Spinel',      cut: 'cushion',  h: 345, s: 80, l: 44 }
};

/* CC.SKILLS.gem('ruby', 96) -> an <svg> string, px wide; CC.SKILLS.gemName('ruby') -> 'Ruby' */
CC.SKILLS.GEMS = GEMS;
CC.SKILLS.gemInfo = function (kind) { return GEMS[kind] || null; };
CC.SKILLS.gemName = function (kind) { return GEMS[kind] ? GEMS[kind].name : ''; };
CC.SKILLS.gem = function (kind, px) {
  const d = GEMS[kind]; if (!d) return '';
  const id = 'g' + (uid++);
  const svg = d.special === 'opal' ? opal(id) : d.special === 'crown' ? crown(id) : faceted(d.cut, d.h, d.s, d.l, id);
  return px ? svg.replace('<svg ', '<svg width="' + px + '" height="' + px + '" ') : svg;
};
})();
