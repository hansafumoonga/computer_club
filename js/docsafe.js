/* docsafe.js - keeps documents safe. Everything that comes into a document from outside (pasted text, work loaded from the saved copy,
   pictures chosen from the computer) passes through here first.
     - sanitize() rebuilds the content from an ALLOW-LIST: only the listed tags, attributes and style properties survive, and every
       value is checked. Nothing is copied across as it was: new elements are created and filled in, so no script, event handler,
       outside address or hidden element can come along. (The page also has a Content-Security-Policy that blocks inline script.)
     - importImage() accepts only PNG, JPEG, GIF and WebP (never SVG, which can carry script). It reads the picture's real type and
       size from its first bytes, refuses very large pictures, then draws it again on a canvas: that removes hidden data such as the
       place a photo was taken, and any extra bytes added to the file. */
(function () {
'use strict';
const CC = window.CC = window.CC || {};
const DF = CC.docfile;
const LIM = { nodes: 40000, depth: 40, chars: 3000000, rows: 300, cols: 40, images: 40, imgChars: 4000000, href: 1000 };

const FONTS = { 'georgia': ['Georgia', 'Georgia, serif'], 'arial': ['Arial', 'Arial, sans-serif'], 'comic sans ms': ['Comic Sans MS', "'Comic Sans MS', cursive"], 'courier new': ['Courier New', "'Courier New', monospace"],
  'verdana': ['Verdana', 'Verdana, sans-serif'], 'times new roman': ['Times New Roman', "'Times New Roman', serif"], 'trebuchet ms': ['Trebuchet MS', "'Trebuchet MS', sans-serif"], 'tahoma': ['Tahoma', 'Tahoma, sans-serif'],
  'calibri': ['Calibri', 'Calibri, Carlito, sans-serif'], 'cambria': ['Cambria', 'Cambria, serif'], 'garamond': ['Garamond', 'Garamond, serif'], 'palatino linotype': ['Palatino Linotype', "'Palatino Linotype', serif"],
  'consolas': ['Consolas', 'Consolas, monospace'], 'impact': ['Impact', 'Impact, sans-serif'] };
const NAMED = { black: '#000000', white: '#ffffff', red: '#ff0000', green: '#008000', blue: '#0000ff', yellow: '#ffff00', orange: '#ffa500', purple: '#800080', gray: '#808080', grey: '#808080', pink: '#ffc0cb', brown: '#a52a2a', cyan: '#00ffff', magenta: '#ff00ff', navy: '#000080', teal: '#008080', lime: '#00ff00', maroon: '#800000', silver: '#c0c0c0', gold: '#ffd700' };
const SIZEWORDS = { 'xx-small': 7, 'x-small': 8, small: 10, medium: 12, large: 14, 'x-large': 18, 'xx-large': 24, 'xxx-large': 32 };
const DROP = { script: 1, style: 1, iframe: 1, frame: 1, frameset: 1, object: 1, embed: 1, applet: 1, link: 1, meta: 1, base: 1, head: 1, title: 1, form: 1, input: 1, button: 1, textarea: 1, select: 1, option: 1, optgroup: 1,
  svg: 1, math: 1, canvas: 1, video: 1, audio: 1, source: 1, track: 1, map: 1, area: 1, noscript: 1, template: 1, xmp: 1, plaintext: 1, listing: 1, noembed: 1, noframes: 1, dialog: 1, slot: 1, portal: 1, datalist: 1, output: 1, progress: 1, meter: 1, picture: 1 };
const BLOCKS = { div: 'div', p: 'div', h1: 'h1', h2: 'h2', h3: 'h3', h4: 'h3', h5: 'h3', h6: 'h3', blockquote: 'blockquote', pre: 'div', address: 'div', center: 'div', section: 'div', article: 'div', header: 'div', footer: 'div', main: 'div', nav: 'div', aside: 'div', figure: 'div', figcaption: 'div', li: 'li', dd: 'div', dt: 'div', dl: 'div' };
const INLINE = { span: 'span', b: 'b', strong: 'b', i: 'i', em: 'i', cite: 'i', var: 'i', dfn: 'i', u: 'u', ins: 'u', s: 's', strike: 's', del: 's', sub: 'sub', sup: 'sup', mark: 'span', code: 'span', kbd: 'span', samp: 'span', tt: 'span', small: 'span', big: 'span', font: 'span', label: 'span', abbr: 'span', time: 'span', q: 'span', bdi: 'span', bdo: 'span' };

/* ---------- checking single values ---------- */
const hex2 = function (n) { return ('0' + Math.max(0, Math.min(255, Math.round(n))).toString(16)).slice(-2); };
function colour(v) {          // a colour as #rrggbb, or null when it is not a plain colour (or is fully transparent)
  v = String(v == null ? '' : v).trim().toLowerCase(); let m;
  if ((m = /^#([0-9a-f]{3})$/.exec(v))) return '#' + m[1].split('').map(function (c) { return c + c; }).join('');
  if (/^#[0-9a-f]{6}$/.test(v)) return v;
  if ((m = /^rgba?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*(?:[,/]\s*([\d.]+%?)\s*)?\)$/.exec(v))) {
    if (m[4] !== undefined && parseFloat(m[4]) === 0) return null;
    return '#' + hex2(+m[1]) + hex2(+m[2]) + hex2(+m[3]);
  }
  return NAMED[v] || null;
}
function sizePt(v) {          // a font size in points (6 to 200) or null
  v = String(v == null ? '' : v).trim().toLowerCase(); let m, pt;
  if ((m = /^(\d+(?:\.\d+)?)\s*(pt|px)$/.exec(v))) pt = m[2] === 'px' ? +m[1] * 0.75 : +m[1];
  else if (SIZEWORDS[v]) pt = SIZEWORDS[v];
  else return null;
  if (!(pt >= 6 && pt <= 200)) return null; return Math.round(pt * 2) / 2;
}
function lengthPx(v, min, max) {   // a length in px (accepts px, pt, in, em as written) or null
  v = String(v == null ? '' : v).trim().toLowerCase(); let m, px;
  if ((m = /^(-?\d+(?:\.\d+)?)\s*(px|pt|in|em|cm|mm)?$/.exec(v))) { const n = +m[1], u = m[2] || 'px'; px = u === 'px' ? n : u === 'pt' ? n * 4 / 3 : u === 'in' ? n * 96 : u === 'em' ? n * 16 : u === 'cm' ? n * 37.8 : n * 3.78; }
  else return null;
  if (!(px >= min && px <= max)) return null; return Math.round(px);
}
function family(v) {           // the first font family, when it is one of the known fonts
  const first = String(v == null ? '' : v).split(',')[0].replace(/["']/g, '').trim().toLowerCase(); return FONTS[first] || null;
}
function href(v) {             // a link address that is http, https or mailto (never javascript: or data:)
  v = String(v == null ? '' : v).trim(); if (!v || v.length > LIM.href) return null;
  try { const u = new URL(v); return /^(https?:|mailto:)$/.test(u.protocol) ? u.href : null; } catch (e) { return null; }   // the browser's own address reader decides the type, so tricks such as "java	script:" are seen for what they are
}
const int = function (v, min, max) { const n = parseInt(v, 10); return isFinite(n) && n >= min && n <= max ? n : null; };
const CTRL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;

/* the style properties kept for each kind of element, each one checked and written in one standard form */
function styleOf(el, kind) {
  const s = el.style, out = []; if (!s) return '';
  const g = function (p) { return s.getPropertyValue(p); };
  if (kind !== 'img') {
    const fw = g('font-weight'); if (fw && (/^(bold|bolder)$/i.test(fw) || (+fw >= 600))) out.push('font-weight:bold');
    const fs = g('font-style'); if (/^(italic|oblique)/i.test(fs)) out.push('font-style:italic');
    const td = (g('text-decoration-line') || g('text-decoration')).toLowerCase(); const dec = []; if (/underline/.test(td)) dec.push('underline'); if (/line-through/.test(td)) dec.push('line-through'); if (dec.length) out.push('text-decoration:' + dec.join(' '));
    const c = colour(g('color')); if (c) out.push('color:' + c);
    const bg = colour(g('background-color')); if (bg) out.push('background-color:' + bg);
    const sz = sizePt(g('font-size')); if (sz) out.push('font-size:' + sz + 'pt');
    const ff = family(g('font-family')); if (ff) out.push('font-family:' + ff[1]);
    const va = g('vertical-align').toLowerCase(); if (kind === 'inline' && (va === 'sub' || va === 'super')) out.push('vertical-align:' + va);
  }
  if (kind === 'block' || kind === 'cell') {
    const ta = g('text-align').toLowerCase(); if (/^(left|right|center|justify)$/.test(ta)) out.push('text-align:' + ta);
  }
  if (kind === 'block') {
    const lh = g('line-height'); if (lh) { let n = NaN; if (/^\d+(\.\d+)?$/.test(lh)) n = +lh; else if (/%$/.test(lh)) n = parseFloat(lh) / 100; if (n >= 1 && n <= 3) out.push('line-height:' + Math.round(n * 100) / 100); }
    const ml = lengthPx(g('margin-left') || g('padding-left'), 0, 600); if (ml) out.push('margin-left:' + ml + 'px');
  }
  if (kind === 'cell') {
    const va = g('vertical-align').toLowerCase(); if (/^(top|middle|bottom)$/.test(va)) out.push('vertical-align:' + va);
    const w = lengthPx(g('width'), 12, 1600); if (w) out.push('width:' + w + 'px');
  }
  return out.join(';');
}

/* ---------- the cleaner ---------- */
function newDoc() { return document.implementation.createHTMLDocument(''); }   // a page with no screen: nothing in it loads or runs
function sanitizeInto(srcRoot, doc, opts) {
  opts = opts || {}; const out = doc.createElement('div'); let nodes = 0, images = 0, chars = 0;
  function canon(css, kind) { const probe = doc.createElement('span'); probe.setAttribute('style', css); return styleOf(probe, kind); }   // the same properties in the one standard order, so cleaning twice gives the same result
  function mk(tag) { nodes++; return doc.createElement(tag); }
  function walk(src, dest, depth, ctx) {
    for (let n = src.firstChild; n; n = n.nextSibling) {
      if (nodes > LIM.nodes || chars > LIM.chars) return;
      if (n.nodeType === 3) { let t = n.nodeValue.replace(CTRL, ''); if (chars + t.length > LIM.chars) t = t.slice(0, Math.max(0, LIM.chars - chars)); if (t) { chars += t.length; dest.appendChild(doc.createTextNode(t)); nodes++; } continue; }
      if (n.nodeType !== 1) continue;                                             // comments, instructions and the like are dropped
      const tag = n.localName; if (DROP[tag] || (n.namespaceURI && n.namespaceURI !== 'http://www.w3.org/1999/xhtml')) continue;
      if (depth >= LIM.depth) { walk(n, dest, depth, ctx); continue; }           // too deeply nested: keep the words, not the nesting
      if (tag === 'br') { dest.appendChild(mk('br')); continue; }
      if (tag === 'hr') { const h = mk('hr'); if (n.getAttribute('data-pb') === '1') h.setAttribute('data-pb', '1'); dest.appendChild(h); continue; }
      if (tag === 'img') {
        const info = images < LIM.images ? DF.parseDataImage(n.getAttribute('src'), LIM.imgChars) : null;   // only an inline picture that really is a PNG, JPEG, GIF or WebP
        if (!info) continue; images++;
        const el = mk('img'); el.setAttribute('src', n.getAttribute('src'));
        let w = int(n.getAttribute('width'), 8, 4000) || lengthPx(n.style && n.style.getPropertyValue('width'), 8, 4000) || Math.min(info.w, 600), h = Math.max(1, Math.round(w * info.h / info.w));
        w = Math.min(w, 1600); h = Math.max(1, Math.round(w * info.h / info.w));      // the shape always follows the picture itself
        el.setAttribute('width', String(w)); el.setAttribute('height', String(h)); el.setAttribute('style', 'width:' + w + 'px;height:' + h + 'px');
        const alt = String(n.getAttribute('alt') || '').replace(CTRL, '').slice(0, 300); if (alt) el.setAttribute('alt', alt);
        dest.appendChild(el); continue;
      }
      if (tag === 'a') {
        const url = href(n.getAttribute('href')), a = url ? mk('a') : null;
        if (a) { a.setAttribute('href', url); a.setAttribute('rel', 'noopener noreferrer'); a.setAttribute('target', '_blank'); dest.appendChild(a); walk(n, a, depth + 1, ctx); } else walk(n, dest, depth, ctx);
        continue;
      }
      if (tag === 'table') {
        if (ctx.inCell || ctx.inTable) { walk(n, dest, depth, ctx); continue; }   // a table inside a table is not kept: its words are
        const t = mk('table'), body = mk('tbody'); t.appendChild(body); const bd = n.getAttribute('data-bd'); t.setAttribute('data-bd', /^(grid|none|box)$/.test(bd) ? bd : 'grid');
        const rows = []; (function find(e) { for (let c = e.firstChild; c; c = c.nextSibling) { if (c.nodeType !== 1) continue; if (c.localName === 'tr') rows.push(c); else if (/^(thead|tbody|tfoot)$/.test(c.localName)) find(c); } })(n);
        for (let r = 0; r < rows.length && r < LIM.rows; r++) {
          const tr = mk('tr'); let cells = 0;
          for (let c = rows[r].firstChild; c && cells < LIM.cols; c = c.nextSibling) {
            if (c.nodeType !== 1 || !/^(td|th)$/.test(c.localName)) continue; cells++;
            const td = mk(c.localName === 'th' ? 'th' : 'td'), span = int(c.getAttribute('colspan'), 2, LIM.cols); if (span) td.setAttribute('colspan', String(span));
            const st = styleOf(c, 'cell'); if (st) td.setAttribute('style', st);
            tr.appendChild(td); walk(c, td, depth + 2, { inCell: true, inTable: true });
            if (!td.firstChild) td.appendChild(mk('br'));
          }
          if (tr.firstChild) body.appendChild(tr);
        }
        if (body.firstChild) dest.appendChild(t); continue;
      }
      if (tag === 'tr' || tag === 'td' || tag === 'th' || tag === 'thead' || tag === 'tbody' || tag === 'tfoot' || tag === 'caption' || tag === 'colgroup' || tag === 'col') { walk(n, dest, depth, ctx); continue; }
      if (tag === 'ul' || tag === 'ol') {
        const l = mk(tag); if (tag === 'ol') { const st = int(n.getAttribute('start'), 1, 9999); if (st && st !== 1) l.setAttribute('start', String(st)); }
        dest.appendChild(l); walk(n, l, depth + 1, ctx); continue;
      }
      let bt = BLOCKS[tag]; if (bt === 'blockquote' && n.getAttribute('data-q') !== '1') bt = 'div';       // a browser's Indent button makes a blockquote: only one marked as a quotation stays one
      if (bt) {
        if (bt === 'li') { const li = mk('li'), st = styleOf(n, 'block'); if (st) li.setAttribute('style', st); dest.appendChild(li); walk(n, li, depth + 1, ctx); continue; }
        const b = mk(bt), st = styleOf(n, 'block'); if (st) b.setAttribute('style', st); if (bt === 'blockquote') b.setAttribute('data-q', '1');
        const ds = n.getAttribute('data-st'); if ((bt === 'div' || bt === 'h1') && (ds === 'title' || ds === 'subtitle')) b.setAttribute('data-st', ds);
        if (tag === 'center') b.setAttribute('style', canon('text-align:center' + (st ? ';' + st : ''), 'block'));
        if (tag === 'pre') b.setAttribute('style', canon('font-family:' + FONTS['courier new'][1] + (st ? ';' + st : ''), 'block'));
        dest.appendChild(b); walk(n, b, depth + 1, ctx); continue;
      }
      const it = INLINE[tag];
      if (it) {
        const e = mk(it); let st = styleOf(n, 'inline');
        if (tag === 'font') {                              // the old <font> tag (the browser can still write it): colour, face and size
          const fc = colour(n.getAttribute('color')), ff = family(n.getAttribute('face')), fz = { 1: 8, 2: 10, 3: 12, 4: 14, 5: 18, 6: 24, 7: 36 }[n.getAttribute('size')];
          st = canon([fc && 'color:' + fc, ff && 'font-family:' + ff[1], fz && 'font-size:' + fz + 'pt', st].filter(Boolean).join(';'), 'inline');
        }
        if (tag === 'mark') st = canon('background-color:#fff27a' + (st ? ';' + st : ''), 'inline');
        if (tag === 'code' || tag === 'kbd' || tag === 'samp' || tag === 'tt') st = canon('font-family:' + FONTS['courier new'][1] + (st ? ';' + st : ''), 'inline');
        if (st) e.setAttribute('style', st);
        dest.appendChild(e); walk(n, e, depth + 1, ctx); continue;
      }
      walk(n, dest, depth, ctx);                           // any other tag: its words stay, the tag goes
    }
  }
  walk(srcRoot, out, 0, {});
  return out;
}
/* html (a string) -> a clean element, built in a page that has no screen */
function fragment(html) {
  html = String(html == null ? '' : html); if (html.length > LIM.chars * 2) html = html.slice(0, LIM.chars * 2);
  const parsed = new DOMParser().parseFromString('<!doctype html><html><body>' + html + '</body></html>', 'text/html');   // scripts here never run and pictures never load
  return sanitizeInto(parsed.body, newDoc());
}
function sanitize(html) { return fragment(html).innerHTML; }
/* plain text with a line break between blocks (for a .txt download and for counting words) */
function plainText(html) {
  const root = typeof html === 'string' ? fragment(html) : html, parts = []; let line = '';
  const flush = function () { parts.push(line); line = ''; };
  (function w(e) {
    for (let n = e.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3) line += n.nodeValue;
      else if (n.nodeType === 1) {
        const t = n.localName;
        if (t === 'br') { flush(); continue; }
        if (t === 'img') { line += ''; continue; }
        if (t === 'td' || t === 'th') { w(n); line += '\t'; continue; }
        const block = /^(div|h1|h2|h3|blockquote|li|tr|table|ul|ol|hr)$/.test(t);
        if (block && line) flush();
        if (t === 'hr') { flush(); continue; }
        w(n); if (block && line) flush();
      }
    }
  })(root);
  if (line) flush();
  return parts.join('\n').replace(/\t\n/g, '\n').replace(/\u00A0/g, ' ');
}

/* ---------- pictures chosen from the computer ---------- */
function decode(blob) {
  if (window.createImageBitmap) return window.createImageBitmap(blob);
  return new Promise(function (ok, no) { const u = URL.createObjectURL(blob), im = new Image(); im.onload = function () { URL.revokeObjectURL(u); ok(im); }; im.onerror = function () { URL.revokeObjectURL(u); no(new Error('decode')); }; im.src = u; });
}
function importImage(file, opt) {
  opt = opt || {}; const maxDim = opt.maxDim || 1400, maxBytes = opt.maxBytes || 12e6, maxOut = opt.maxOut || 1100000;
  return Promise.resolve().then(function () {
    if (!file || typeof file.size !== 'number' || !file.arrayBuffer) throw new Error('Choose a picture file.');
    if (file.size > maxBytes) throw new Error('That picture file is too big. The limit is 12 MB.');
    return file.arrayBuffer();
  }).then(function (ab) {
    const bytes = new Uint8Array(ab), info = DF.imageInfo(bytes);
    if (!info) throw new Error('This file is not a PNG, JPEG, GIF or WebP picture.');
    if (!info.w || !info.h || info.w * info.h > 60e6 || info.w > 20000 || info.h > 20000) throw new Error('That picture is too large.');
    return decode(new Blob([bytes], { type: 'image/' + info.type })).then(function (bmp) { return { bmp: bmp, info: info }; }, function () { throw new Error('That picture could not be read. It may be damaged.'); });
  }).then(function (o) {
    const bmp = o.bmp, sw = bmp.naturalWidth || bmp.width, sh = bmp.naturalHeight || bmp.height; let scale = Math.min(1, maxDim / Math.max(sw, sh)), res = null;
    for (let attempt = 0; attempt < 4 && !res; attempt++) {
      const w = Math.max(1, Math.round(sw * scale)), h = Math.max(1, Math.round(sh * scale)), cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const g = cv.getContext('2d'); g.drawImage(bmp, 0, 0, w, h);
      const px = new Uint32Array(g.getImageData(0, 0, w, h).data.buffer); let alpha = false; for (let i = 0; i < px.length; i++) { if ((px[i] >>> 24) !== 255) { alpha = true; break; } }   // does any part show through?
      let best = cv.toDataURL('image/png');
      if (!alpha) { const jp = cv.toDataURL('image/jpeg', 0.85); if (jp.length < best.length && /^data:image\/jpeg/.test(jp)) best = jp; }
      if (best.length <= maxOut) res = { src: best, w: w, h: h }; else scale *= 0.7;
    }
    if (bmp.close) bmp.close();
    if (!res) throw new Error('That picture is too detailed to add. Choose a smaller picture.');
    if (!DF.isSafeImage(res.src)) throw new Error('That picture could not be read.');
    return res;
  });
}

CC.docsafe = { sanitize: sanitize, fragment: fragment, plainText: plainText, importImage: importImage, colour: colour, sizePt: sizePt, href: href, FONTS: FONTS, LIM: LIM };
})();
