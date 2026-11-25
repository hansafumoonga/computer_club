/* docfile.js - making files in the browser, with no libraries and nothing sent anywhere.
     - a small ZIP packer (a .docx and an .xlsx are ZIP files full of XML)
     - XML escaping that also removes the control characters XML does not allow (Word and Excel refuse a file that contains them)
     - safe file names, downloads, and CSV that cannot run as a formula when it is opened in a spreadsheet
     - reading a picture's real type and size from its first bytes (a name or a "type" label can be false) */
(function () {
'use strict';
const CC = window.CC = window.CC || {};
const enc = new TextEncoder();
function utf8(s) { return enc.encode(String(s)); }

/* ---------- XML ---------- */
function cleanXml(s) {                      // keep only the characters that XML 1.0 allows
  s = String(s == null ? '' : s); let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c === 9 || c === 10 || c === 13 || (c >= 0x20 && c <= 0xD7FF) || (c >= 0xE000 && c <= 0xFFFD)) out += s.charAt(i);
    else if (c >= 0xD800 && c <= 0xDBFF && i + 1 < s.length) { const d = s.charCodeAt(i + 1); if (d >= 0xDC00 && d <= 0xDFFF) { out += s.charAt(i) + s.charAt(i + 1); i++; } }   // a whole surrogate pair is fine; a lone half is dropped
  }
  return out;
}
function esc(s) { return cleanXml(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;'); }

/* ---------- ZIP (stored, not compressed: it is valid, simple and the pictures inside are already compressed) ---------- */
const CRC = (function () { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(b) { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
/* files: [{ name, data: string | Uint8Array }]  ->  Uint8Array */
function zip(files) {
  if (files.length > 60000) throw new Error('too many files');
  const parts = [], central = []; let offset = 0;
  const d = new Date(), dt = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xFFFF, dd = (((Math.max(1980, d.getFullYear()) - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;
  files.forEach(function (f) {
    const name = utf8(f.name), data = typeof f.data === 'string' ? utf8(f.data) : f.data, crc = crc32(data);
    const lh = new Uint8Array(30 + name.length), v = new DataView(lh.buffer);
    v.setUint32(0, 0x04034b50, true); v.setUint16(4, 20, true); v.setUint16(6, 0x0800, true); v.setUint16(8, 0, true); v.setUint16(10, dt, true); v.setUint16(12, dd, true);
    v.setUint32(14, crc, true); v.setUint32(18, data.length, true); v.setUint32(22, data.length, true); v.setUint16(26, name.length, true); v.setUint16(28, 0, true); lh.set(name, 30);
    const ch = new Uint8Array(46 + name.length), c = new DataView(ch.buffer);
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true); c.setUint16(12, dt, true); c.setUint16(14, dd, true);
    c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true); c.setUint16(30, 0, true); c.setUint16(32, 0, true);
    c.setUint16(34, 0, true); c.setUint16(36, 0, true); c.setUint32(38, 0, true); c.setUint32(42, offset, true); ch.set(name, 46);
    parts.push(lh, data); central.push(ch); offset += lh.length + data.length;
  });
  const cdSize = central.reduce(function (n, x) { return n + x.length; }, 0), end = new Uint8Array(22), e = new DataView(end.buffer);
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cdSize, true); e.setUint32(16, offset, true);
  const all = parts.concat(central, [end]), total = all.reduce(function (n, x) { return n + x.length; }, 0), out = new Uint8Array(total); let p = 0;
  all.forEach(function (x) { out.set(x, p); p += x.length; });
  return out;
}

/* ---------- file names and downloads ---------- */
const RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
function safeName(name, fallback) {
  let s = String(name == null ? '' : name).replace(/[\u0000-\u001F\u007F‎‏‪-‮⁦-⁩]/g, '')   // control and direction-changing characters can disguise a file type
    .replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/^\.+/, '').replace(/[. ]+$/, '');
  if (s.length > 60) s = s.slice(0, 60).replace(/[. ]+$/, '');
  if (!s || RESERVED.test(s.split('.')[0])) s = fallback || 'My document';
  return s;
}
const DF = CC.docfile = { utf8: utf8, esc: esc, cleanXml: cleanXml, crc32: crc32, zip: zip, safeName: safeName, noDownload: false, last: null };
DF.download = function (data, filename, mime) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mime || 'application/octet-stream' });
  if (DF.noDownload) { DF.last = { name: filename, blob: blob, mime: mime }; return blob; }       // the automatic tests do not save files
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.rel = 'noopener'; a.style.display = 'none'; document.body.appendChild(a); a.click();
  setTimeout(function () { a.remove(); }, 1000); setTimeout(function () { URL.revokeObjectURL(a.href); }, 40000); return blob;       // the address is kept for a while: a slow save must not lose its file
};

/* ---------- CSV: text that starts with = + - @ could run as a formula in a spreadsheet, so it gets a quote in front (the usual protection) ---------- */
const SAFENUM = /^-?[$£€¥]?\d[\d,]*(\.\d+)?%?$/;                 // a formatted number such as -$1,234.50 or -12%: it starts with a minus sign but cannot run as a formula
function csvField(v) {
  if (v == null) return '';
  if (typeof v === 'number') return isFinite(v) ? String(v) : '';
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  const shown = typeof v === 'object' && typeof v.num === 'string';       // { num: '-$5.00' }: a number written the way the sheet shows it
  let s = cleanXml(shown ? v.num : String(v)).replace(/\u0000/g, '');
  if (/^[=+\-@\t\r]/.test(s) && !(shown && SAFENUM.test(s))) s = "'" + s;
  return /[",\r\n]|^\s|\s$/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
DF.toCSV = function (rows) { return '﻿' + rows.map(function (r) { return r.map(csvField).join(','); }).join('\r\n') + '\r\n'; };
/* reading comma- or tab-separated text (the clipboard from a spreadsheet is tab separated). Limits keep a huge paste from freezing the page. */
DF.parseDelimited = function (text, delim, lim) {
  lim = lim || {}; const maxRows = lim.rows || 2000, maxCols = lim.cols || 52, maxField = lim.field || 32767;
  text = String(text == null ? '' : text); if (text.length > (lim.chars || 2000000)) return { error: 'too big', rows: [] };
  const rows = []; let row = [], f = '', q = false, i = 0; const n = text.length;
  const endField = function () { if (row.length < maxCols) row.push(f.length > maxField ? f.slice(0, maxField) : f); f = ''; };
  const endRow = function () { endField(); rows.push(row); row = []; };
  while (i < n && rows.length < maxRows) {
    const ch = text.charAt(i);
    if (q) { if (ch === '"') { if (text.charAt(i + 1) === '"') { f += '"'; i++; } else q = false; } else f += ch; }
    else if (ch === '"' && f === '') q = true;
    else if (ch === delim) endField();
    else if (ch === '\r') { if (text.charAt(i + 1) === '\n') i++; endRow(); }
    else if (ch === '\n') endRow();
    else f += ch;
    i++;
  }
  if (rows.length < maxRows && (f !== '' || row.length)) endRow();
  if (rows.length && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '') rows.pop();   // the empty line at the very end
  return { rows: rows, truncated: i < n };
};

/* ---------- pictures: the real type and size, read from the first bytes ---------- */
DF.b64bytes = function (b64) { const bin = atob(b64), out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; };
DF.imageInfo = function (b) {
  if (!b || b.length < 24) return null;
  const u16 = function (i) { return (b[i] << 8) | b[i + 1]; }, le16 = function (i) { return b[i] | (b[i + 1] << 8); };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47 && b[4] === 0x0D && b[5] === 0x0A && b[6] === 0x1A && b[7] === 0x0A && b[12] === 0x49 && b[13] === 0x48 && b[14] === 0x44 && b[15] === 0x52) {
    return { type: 'png', w: ((b[16] << 24) | (b[17] << 16) | (b[18] << 8) | b[19]) >>> 0, h: ((b[20] << 24) | (b[21] << 16) | (b[22] << 8) | b[23]) >>> 0 };
  }
  if (b[0] === 0xFF && b[1] === 0xD8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xFF) { i++; continue; }
      const m = b[i + 1];
      if (m === 0xFF) { i++; continue; }
      if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) return { type: 'jpeg', h: u16(i + 5), w: u16(i + 7) };
      if (m === 0xD8 || m === 0x01 || (m >= 0xD0 && m <= 0xD7)) { i += 2; continue; }
      i += 2 + u16(i + 2);
    }
    return null;
  }
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38 && (b[4] === 0x37 || b[4] === 0x39) && b[5] === 0x61) return { type: 'gif', w: le16(6), h: le16(8) };
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 && b.length >= 30) {
    const tag = String.fromCharCode(b[12], b[13], b[14], b[15]);
    if (tag === 'VP8 ') return { type: 'webp', w: le16(26) & 0x3FFF, h: le16(28) & 0x3FFF };
    if (tag === 'VP8L') { const v = (b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24)) >>> 0; return { type: 'webp', w: (v & 0x3FFF) + 1, h: ((v >>> 14) & 0x3FFF) + 1 }; }
    if (tag === 'VP8X') return { type: 'webp', w: (b[24] | (b[25] << 8) | (b[26] << 16)) + 1, h: (b[27] | (b[28] << 8) | (b[29] << 16)) + 1 };
  }
  return null;
};
/* a picture is only accepted as a data: address of one of four ordinary picture types (never SVG, which can carry script) */
DF.parseDataImage = function (u, maxChars) {
  u = String(u == null ? '' : u); if (u.length > (maxChars || 4000000)) return null;
  const m = /^data:image\/(png|jpeg|gif|webp);base64,([A-Za-z0-9+\/]+={0,2})$/.exec(u); if (!m) return null;
  let bytes; try { bytes = DF.b64bytes(m[2]); } catch (e) { return null; }
  const info = DF.imageInfo(bytes); if (!info || info.type !== m[1] || !info.w || !info.h || info.w > 20000 || info.h > 20000 || info.w * info.h > 25000000) return null;   // the first bytes must agree with the label, and a picture that would need hundreds of megabytes to open is refused
  return { type: m[1], bytes: bytes, w: info.w, h: info.h };
};
DF.isSafeImage = function (u) { return !!DF.parseDataImage(u); };
})();
