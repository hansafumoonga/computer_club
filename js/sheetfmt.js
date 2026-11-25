/* sheetfmt.js - how a spreadsheet shows a value: number formats (the same format codes Excel uses, so a saved .xlsx keeps them),
   decimal-aware rounding, dates, and reading what a person types into a cell. Pure logic: it never touches the page. */
(function () {
'use strict';
const CC = window.CC = window.CC || {};
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const EPOCH = Date.UTC(1899, 11, 30);                     // day 0 of a spreadsheet's calendar (dates from March 1900 onwards agree with Excel)
const MAXSERIAL = 2958465;                                // 31 December 9999
const MAXNUM = 9.99999999999999e307, MINNUM = 2.2250738585072e-308;   // the largest and smallest numbers a spreadsheet keeps (beyond them: an error, or 0)
const MAXCODE = 80;                                       // a longer format code is ignored
const two = function (n) { return (n < 10 ? '0' : '') + n; };

/* rounding that works on the decimal number as written, half away from zero, as a spreadsheet does (so 2.675 rounds to 2.68 and 1.005 to 1.01) */
function roundDec(x, d, mode) {                           // mode: 'up' (away from zero), 'down' (towards zero), or nearest
  if (typeof x !== 'number' || !isFinite(x) || x === 0) return x;
  d = Math.max(-15, Math.min(15, Math.trunc(d || 0)));
  const p = Number(Math.abs(x).toPrecision(15)).toExponential().split('e'), sh = Number(p[0] + 'e' + (Number(p[1]) + d)), r = mode === 'up' ? Math.ceil(sh) : mode === 'down' ? Math.floor(sh) : Math.round(sh);
  if (!isFinite(r) || r > 1e15) return x;
  const out = Number(r + 'e' + (-d)); return x < 0 ? -out : out;
}
function trimFixed(s) { return s.indexOf('.') < 0 ? s : s.replace(/0+$/, '').replace(/\.$/, ''); }
function expText(mant, ex) { return mant + 'E' + (ex < 0 ? '-' : '+') + (Math.abs(ex) < 10 ? '0' : '') + Math.abs(ex); }
function sci(a, decimals) { const p = a.toExponential(decimals).split('e'); return expText(p[0].replace(/\.?0+$/, ''), Number(p[1])); }
/* the "General" format, worked out the way Excel does it: at most 11 characters (not counting a minus sign); a number that cannot be
   shown exactly in that space and is below 0.0001, or is 100 000 000 000 or more, is written in scientific form (1.23457E+11) */
function general(n) {
  if (typeof n !== 'number') return String(n);
  if (!isFinite(n)) return '#NUM!'; if (n === 0) return '0';
  const a = Number(Math.abs(n).toPrecision(15)); let out;
  if (a >= 1) {
    let digits = Math.floor(Math.log10(a)) + 1; if (Math.pow(10, digits) <= a) digits++;
    const r = roundDec(a, Math.max(0, 10 - digits));
    out = r >= 1e11 ? sci(a, 5) : trimFixed(r.toFixed(Math.max(0, 10 - digits)));
  } else {
    const r = roundDec(a, 9);
    out = (a >= 1e-4 && r !== 0) || (r === a && r !== 0) ? trimFixed(r.toFixed(9)) : sci(a, 5);                       // below 0.0001 only a number that fits exactly stays in fixed form
  }
  return (n < 0 ? '-' : '') + out;
}
/* a number as the text that "&", CONCAT and the formula bar use: up to 15 digits, and no scientific form until it is 1E+20 or tiny */
function numText(n) {
  if (!isFinite(n)) return '#NUM!'; if (n === 0) return '0';
  const p = Math.abs(n).toExponential(14).split('e'), e = Number(p[1]); let sig = p[0].replace('.', '').replace(/0+$/, ''), out;
  if (!sig) sig = '0';
  const mant = sig.charAt(0) + (sig.length > 1 ? '.' + sig.slice(1) : '');
  if (e >= 20) out = expText(mant, e);
  else if (e >= 0) out = sig.length - 1 <= e ? sig + '0'.repeat(e - sig.length + 1) : sig.slice(0, e + 1) + '.' + sig.slice(e + 1);
  else out = (-e - 1) + sig.length > 18 ? expText(mant, e) : '0.' + '0'.repeat(-e - 1) + sig;
  return (n < 0 ? '-' : '') + out;
}
/* a number typed or written in a formula: only its first 15 digits count, the rest become zeros (Excel does the same) */
function literal(t) {
  const m = /^(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/.exec(t); if (!m) return Number(t);
  const ip = m[1] || '', fp = m[2] || '', ex = m[3] ? parseInt(m[3], 10) : 0, digits = ip + fp, sig = digits.replace(/^0+/, '');
  if (sig.length <= 15) return Number(t);
  return Number(sig.slice(0, 15) + 'e' + (sig.length - 15 + ex - fp.length));
}
/* General, shortened to fit a column that is only maxChars wide: decimals are dropped first, then the number turns scientific, then "#" */
function fitGeneral(n, maxChars) {
  const s = general(n); if (typeof n !== 'number' || !isFinite(n) || s.length <= maxChars) return s;
  if (!/E/.test(s)) {
    const decs = (s.split('.')[1] || '').length;
    for (let k = decs - 1; k >= 0; k--) { const t = roundDec(n, k).toFixed(k); if (t.length <= maxChars) return t; }
  }
  for (let k = 4; k >= 0; k--) { const m = n.toExponential(k).split('e'), ex = Number(m[1]), t = m[0] + 'E' + (ex < 0 ? '-' : '+') + (Math.abs(ex) < 10 ? '0' : '') + Math.abs(ex); if (t.length <= maxChars) return t; }
  return '#'.repeat(Math.max(1, maxChars));
}
function serialToDate(s) { return new Date(EPOCH + Math.round(s * 86400) * 1000); }          // to the nearest second, so 0.1 + 0.2 of a day is not a hair short
function dateToSerial(y, m, d) { return Math.round((Date.UTC(y, m - 1, d) - EPOCH) / 86400000); }

/* ---------- reading a format code ---------- */
const CACHE = Object.create(null); let cacheN = 0;
function splitSections(code) {
  const out = []; let cur = '', q = false;
  for (let i = 0; i < code.length; i++) { const ch = code.charAt(i); if (ch === '"') q = !q; if (ch === ';' && !q) { out.push(cur); cur = ''; } else cur += ch; }
  out.push(cur); return out;
}
function compileSection(s) {
  const toks = []; let i = 0; const n = s.length;
  while (i < n) {
    const ch = s.charAt(i);
    if (ch === '"') { const j = s.indexOf('"', i + 1), e = j < 0 ? n : j; toks.push({ lit: s.slice(i + 1, e) }); i = e + 1; continue; }
    if (ch === '\\') { toks.push({ lit: s.charAt(i + 1) }); i += 2; continue; }
    if (ch === '[') { const j = s.indexOf(']', i); i = j < 0 ? n : j + 1; continue; }              // colours and conditions are not shown
    if (ch === '_') { toks.push({ lit: ' ' }); i += 2; continue; }
    if (ch === '*') { i += 2; continue; }
    if (/^general/i.test(s.slice(i, i + 7))) { toks.push({ gen: 1 }); i += 7; continue; }
    const ap = /^(am\/pm|a\/p)/i.exec(s.slice(i, i + 5)); if (ap) { toks.push({ ampm: ap[1].length === 5 ? 2 : 1 }); i += ap[1].length; continue; }
    if (/[ymdhsYMDHS]/.test(ch)) { let j = i; while (j < n && s.charAt(j).toLowerCase() === ch.toLowerCase()) j++; toks.push({ d: ch.toLowerCase(), n: j - i }); i = j; continue; }
    if (ch === '0' || ch === '#' || ch === '?') { toks.push({ ph: ch }); i++; continue; }
    if (ch === '.') { toks.push({ dot: 1 }); i++; continue; }
    if (ch === ',') { toks.push({ comma: 1 }); i++; continue; }
    if (ch === '%') { toks.push({ pct: 1 }); i++; continue; }
    if (ch === '@') { toks.push({ txt: 1 }); i++; continue; }
    if ((ch === 'E' || ch === 'e') && /^[+-]0/.test(s.slice(i + 1, i + 3))) { let j = i + 2; while (s.charAt(j) === '0') j++; toks.push({ exp: j - i - 2, sign: s.charAt(i + 1) }); i = j; continue; }
    toks.push({ lit: ch }); i++;
  }
  // "m" is a month, unless it sits next to hours or seconds (then it is minutes)
  for (let k = 0; k < toks.length; k++) if (toks[k].d === 'm') {
    const pv = toks[k - 1], nx = toks[k + 1];
    if ((pv && pv.d === 'h') || (pv && pv.lit === ':' && toks[k - 2] && toks[k - 2].d === 'h') || (nx && nx.d === 's') || (nx && nx.lit === ':' && toks[k + 2] && toks[k + 2].d === 's')) toks[k].d = 'min';
  }
  const any = function (f) { return toks.some(f); };
  const kind = any(function (t) { return t.d || t.ampm; }) ? 'date' : any(function (t) { return t.ph || t.exp !== undefined; }) ? 'num' : any(function (t) { return t.gen; }) ? 'gen' : any(function (t) { return t.txt; }) ? 'text' : 'lit';
  return { toks: toks, kind: kind };
}
function parseFmt(code) {
  let c = CACHE[code]; if (c) return c;
  if (cacheN > 300) { for (const k in CACHE) delete CACHE[k]; cacheN = 0; }
  c = splitSections(code).slice(0, 4).map(compileSection); CACHE[code] = c; cacheN++; return c;
}

function formatNumberSection(sec, v, signed) {
  const toks = sec.toks; let pct = 0, minInt = 0, thousands = false, scale = 0, seenDot = false, dec = 0, hasExp = null; const fracPh = [];
  toks.forEach(function (t, i) {
    if (t.pct) pct++;
    if (t.exp !== undefined) hasExp = t;
    if (t.dot) seenDot = true;
    if (t.ph) { if (seenDot) { dec++; fracPh.push(t.ph); } else if (t.ph === '0') minInt++; }
    if (t.comma) {
      const before = toks.slice(0, i).some(function (x) { return x.ph; }), after = toks.slice(i + 1).some(function (x) { return x.ph; });
      if (before && after) thousands = true; else if (before && !after) scale++;
    }
  });
  const x = Math.abs(v) * Math.pow(100, pct) / Math.pow(1000, scale);
  if (!isFinite(x) || x >= 1e21) return general(v);
  let body, shown;                                          // shown: the number that appears (after rounding), to decide whether a minus sign is needed
  if (hasExp) {
    let e = x === 0 ? 0 : Math.floor(Math.log10(x));
    if (x !== 0) { if (Math.pow(10, e + 1) <= x) e++; else if (Math.pow(10, e) > x) e--; }
    let m = x === 0 ? 0 : roundDec(x / Math.pow(10, e), dec);
    if (m >= 10) { m = m / 10; e++; }                       // rounding carried over (9.99 becomes 10.0)
    shown = m; body = m.toFixed(dec) + 'E' + (e < 0 ? '-' : (hasExp.sign === '+' ? '+' : '')) + String(Math.abs(e)).padStart(hasExp.exp, '0');
  } else {
    const r = roundDec(x, dec); shown = r; const s = r >= 1e15 && dec === 0 ? String(r) : r.toFixed(dec); let ip = s.split('.')[0], fp = s.split('.')[1] || '';   // a big number is written with its first 15 digits and then zeros
    if (ip.length < minInt) ip = '0'.repeat(minInt - ip.length) + ip;
    if (minInt === 0 && ip === '0') ip = '';                // "#.##" shows .5, not 0.5
    if (thousands) ip = ip.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    let fk = fp.length; while (fk > 0 && fracPh[fk - 1] !== '0' && fp.charAt(fk - 1) === '0') fk--;   // a trailing # or ? hides a zero
    fp = fp.slice(0, fk); body = ip + (fp ? '.' + fp : seenDot ? '.' : '');                 // "#.##" shows 2. for 2, as Excel does
  }
  let out = '', placed = false;
  toks.forEach(function (t) {
    if (t.lit !== undefined) out += t.lit; else if (t.pct) out += '%';
    else if ((t.ph || t.exp !== undefined) && !placed) { out += body; placed = true; }
  });
  return (signed && v < 0 && shown > 0 ? '-' : '') + out;
}
function formatDateSection(sec, v) {
  const d = serialToDate(v), H = d.getUTCHours(), has12 = sec.toks.some(function (t) { return t.ampm; });
  let out = '';
  sec.toks.forEach(function (t) {
    if (t.lit !== undefined) { out += t.lit; return; }
    if (t.ampm) { out += t.ampm === 2 ? (H < 12 ? 'AM' : 'PM') : (H < 12 ? 'A' : 'P'); return; }
    if (!t.d) return;
    if (t.d === 'y') out += t.n <= 2 ? two(d.getUTCFullYear() % 100) : String(d.getUTCFullYear());
    else if (t.d === 'm') out += t.n === 1 ? String(d.getUTCMonth() + 1) : t.n === 2 ? two(d.getUTCMonth() + 1) : t.n === 3 ? MONTHS[d.getUTCMonth()].slice(0, 3) : MONTHS[d.getUTCMonth()];
    else if (t.d === 'd') out += t.n === 1 ? String(d.getUTCDate()) : t.n === 2 ? two(d.getUTCDate()) : t.n === 3 ? DAYS[d.getUTCDay()].slice(0, 3) : DAYS[d.getUTCDay()];
    else if (t.d === 'h') { const h = has12 ? (H % 12 === 0 ? 12 : H % 12) : H; out += t.n === 1 ? String(h) : two(h); }
    else if (t.d === 'min') out += t.n === 1 ? String(d.getUTCMinutes()) : two(d.getUTCMinutes());
    else if (t.d === 's') out += t.n === 1 ? String(d.getUTCSeconds()) : two(d.getUTCSeconds());
  });
  return out;
}
/* the text a value is shown as, for a format code */
function format(v, code) {
  if (v == null) return '';
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (typeof code !== 'string' || code.length > MAXCODE || /^general$/i.test(code)) return typeof v === 'number' ? general(v) : String(v);
  try {
    const secs = parseFmt(code);
    if (typeof v === 'string') { const t = secs.filter(function (s) { return s.kind === 'text'; })[0]; return t ? t.toks.map(function (k) { return k.txt ? v : k.lit || ''; }).join('') : v; }
    if (!isFinite(v)) return '#NUM!';
    let sec = secs[0], signed = true;
    if (v < 0 && secs[1]) { sec = secs[1]; signed = false; } else if (v === 0 && secs[2]) sec = secs[2];
    if (sec.kind === 'text') return general(v);                                           // a format that only describes text leaves a number as it is
    if (sec.kind === 'lit') return sec.toks.map(function (k) { return k.lit || ''; }).join('');
    if (sec.kind === 'gen') return general(v);
    if (sec.kind === 'date') return (v < 0 || v >= MAXSERIAL + 1) ? '#NUM!' : formatDateSection(sec, v);
    return formatNumberSection(sec, v, signed);
  } catch (e) { return typeof v === 'number' ? general(v) : String(v); }
}
function isDateFormat(code) { if (typeof code !== 'string' || !code || code.length > MAXCODE) return false; return parseFmt(code).some(function (s) { return s.kind === 'date'; }); }
/* how many decimals General shows for a value */
function shownDecimals(v) { return typeof v === 'number' && isFinite(v) ? Math.min(14, (general(v).split('.')[1] || '').replace(/E.*$/, '').length) : 0; }
/* the buttons "Increase decimals" and "Decrease decimals" change the code (v is the cell's value, used when the cell is still General) */
function moreDecimals(code, v) {
  if (!code || /^general$/i.test(code)) return '0.' + '0'.repeat(Math.min(15, shownDecimals(v) + 1));
  const s = splitSections(code), a = s[0], k = a.indexOf('.');
  if (k < 0) { const last = Math.max(a.lastIndexOf('0'), a.lastIndexOf('#')); if (last < 0) return code; s[0] = a.slice(0, last + 1) + '.0' + a.slice(last + 1); }
  else { let e = k + 1; while (a.charAt(e) === '0' || a.charAt(e) === '#') e++; if (e - k - 1 >= 15) return code; s[0] = a.slice(0, e) + '0' + a.slice(e); }
  return s.join(';');
}
function fewerDecimals(code, v) {
  if (!code || /^general$/i.test(code)) { const n = shownDecimals(v); return n <= 0 ? 'General' : n === 1 ? '0' : '0.' + '0'.repeat(n - 1); }
  const s = splitSections(code), a = s[0], k = a.indexOf('.'); if (k < 0) return code;
  let e = k + 1; while (a.charAt(e) === '0' || a.charAt(e) === '#') e++;
  s[0] = e - k - 1 <= 1 ? a.slice(0, k) + a.slice(e) : a.slice(0, e - 1) + a.slice(e);
  return s.join(';');
}
const PRESETS = [
  ['General', 'General'], ['Number', '#,##0.00'], ['Number (no decimals)', '#,##0'], ['Currency ($)', '"$"#,##0.00'], ['Currency (£)', '"£"#,##0.00'], ['Currency (€)', '"€"#,##0.00'], ['Currency (K)', '"K"#,##0.00'],
  ['Percentage', '0%'], ['Percentage (2 decimals)', '0.00%'], ['Date (31/12/2026)', 'dd/mm/yyyy'], ['Date (31 December 2026)', 'd mmmm yyyy'], ['Date (2026-12-31)', 'yyyy-mm-dd'], ['Time', 'hh:mm'], ['Text', '@']
];

/* ---------- reading what a person types into a cell ---------- */
const NUMRE = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i, THOUS = /^[+-]?\d{1,3}(,\d{3})+(\.\d+)?$/;
/* fmt is the cell's number format: a Text cell keeps whatever is typed, even 0012 or =A1 */
function parseEntry(text, fmt) {
  const t0 = String(text == null ? '' : text), t = t0.trim();
  if (t === '') return { k: 'blank', v: null };
  if (t0.charAt(0) === "'") return { k: 'text', v: t0.slice(1) };                       // a leading ' makes the rest plain text
  if (fmt === '@') return { k: 'text', v: t0 };
  if (t0.charAt(0) === '=' && t0.length > 1) return { k: 'formula', v: t0.replace(/\s+$/, '') };
  if (/^true$/i.test(t)) return { k: 'bool', v: true }; if (/^false$/i.test(t)) return { k: 'bool', v: false };
  if (/^0\d+$/.test(t) || /^\d{16,}$/.test(t)) return { k: 'text', v: t0 };              // 0977123456 or a 16-digit number is an identifier, not a quantity: it stays exactly as typed
  if (NUMRE.test(t)) { const n = literal(t); return isFinite(n) && Math.abs(n) <= MAXNUM ? { k: 'num', v: Math.abs(n) < MINNUM ? 0 : n } : { k: 'text', v: t0 }; }
  if (THOUS.test(t)) return { k: 'num', v: Number(t.replace(/,/g, '')), fmt: '#,##0' + (t.indexOf('.') >= 0 ? '.' + '0'.repeat(t.length - t.indexOf('.') - 1) : '') };
  let m;
  if ((m = /^([+-]?\d+(?:\.(\d+))?)%$/.exec(t))) return { k: 'num', v: roundDec(Number(m[1]) / 100, 15), fmt: m[2] ? '0.' + '0'.repeat(m[2].length) + '%' : '0%' };
  if ((m = /^([+-]?)([$£€¥])\s?(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)$/.exec(t))) return { k: 'num', v: (m[1] === '-' ? -1 : 1) * Number(m[3].replace(/,/g, '')), fmt: '"' + m[2] + '"#,##0.00' };
  if ((m = /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/.exec(t))) {
    let d = +m[1], mo = +m[2]; const y = +m[3]; if (mo > 12 && d <= 12) { const x = d; d = mo; mo = x; }       // day first, but 12/31/2026 is still understood
    const dt = new Date(Date.UTC(y, mo - 1, d)); if (mo >= 1 && mo <= 12 && dt.getUTCDate() === d && y >= 1900 && y <= 9999) return { k: 'num', v: dateToSerial(y, mo, d), fmt: 'dd/mm/yyyy' };
  }
  if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t))) { const y = +m[1], mo = +m[2], d = +m[3], dt = new Date(Date.UTC(y, mo - 1, d)); if (mo >= 1 && mo <= 12 && dt.getUTCDate() === d && y >= 1900) return { k: 'num', v: dateToSerial(y, mo, d), fmt: 'yyyy-mm-dd' }; }
  if ((m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(t)) && +m[1] < 24 && +m[2] < 60 && (m[3] === undefined || +m[3] < 60)) return { k: 'num', v: (+m[1] * 3600 + +m[2] * 60 + (+m[3] || 0)) / 86400, fmt: m[3] ? 'hh:mm:ss' : 'hh:mm' };
  return { k: 'text', v: t0 };
}
/* text that a spreadsheet would read as a number (used when a formula adds "5" to 1): the number, or null */
function parseNumber(str) { const r = parseEntry(str); return r.k === 'num' ? r.v : null; }

CC.sheetfmt = { roundDec: roundDec, general: general, numText: numText, literal: literal, fitGeneral: fitGeneral, format: format, isDateFormat: isDateFormat, moreDecimals: moreDecimals, fewerDecimals: fewerDecimals,
  PRESETS: PRESETS, parseEntry: parseEntry, parseNumber: parseNumber, serialToDate: serialToDate, dateToSerial: dateToSerial, MONTHS: MONTHS, DAYS: DAYS, MAXSERIAL: MAXSERIAL, MAXNUM: MAXNUM, MINNUM: MINNUM };
})();
