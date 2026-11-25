/* sheetparse.js - reading spreadsheet formulas. A formula is text such as =SUM(A1:A5)*2. This file turns the text into a tree of
   operations (never into running code: nothing here uses eval or Function), and rewrites the cell references inside a formula when cells
   are copied, moved, inserted or deleted. Pure logic: it never touches the page. */
(function () {
'use strict';
const CC = window.CC = window.CC || {};
/* the limits of this spreadsheet; a formula may also point beyond them, to cells that are simply empty */
const LIM = { rows: 1000, cols: 52, sheets: 10, formula: 4096, tokens: 2500, depth: 48, nodes: 2500, str: 32767, name: 31, cells: 60000 };
const XC = 16384, XR = 1048576;                                      // the size of a full Excel sheet (XFD1048576)

function colName(i) { let s = '', n = i + 1; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }
function colIndex(s) { let n = 0; s = String(s).toUpperCase(); if (!s) return -1; for (let i = 0; i < s.length; i++) { const k = s.charCodeAt(i) - 64; if (k < 1 || k > 26) return -1; n = n * 26 + k; } return n - 1; }
function cellName(r, c) { return colName(c) + (r + 1); }
/* "B7" -> { c: 1, r: 6 } or null */
function parseCellName(s) {
  const m = /^\$?([A-Za-z]{1,3})\$?([0-9]{1,7})$/.exec(String(s).trim()); if (!m) return null;
  const c = colIndex(m[1]), r = Number(m[2]) - 1; return c < 0 || c >= XC || r < 0 || r >= XR ? null : { c: c, r: r };
}

function PErr(msg) { this.message = msg; }                          // a mistake in the formula, with a message a learner can read

const RE_Q = /(?:'((?:[^']|'')+)'|([A-Za-z_ -￿][A-Za-z0-9_. -￿]*))!/y;
const RE_CELLS = /(\$?)([A-Za-z]{1,3})(\$?)(\d{1,7})(?::(\$?)([A-Za-z]{1,3})(\$?)(\d{1,7}))?(?![A-Za-z0-9_(.])/y;
const RE_COLS = /(\$?)([A-Za-z]{1,3}):(\$?)([A-Za-z]{1,3})(?![A-Za-z0-9_(.!])/y;
const RE_ROWS = /(\$?)(\d{1,7}):(\$?)(\d{1,7})(?![0-9A-Za-z_.])/y;
const RE_NUM = /(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/y;
const RE_ERR = /#(?:N\/A|REF!|DIV\/0!|VALUE!|NAME\?|NUM!|NULL!)/iy;
const RE_ID = /[A-Za-z_ -￿][A-Za-z0-9_. -￿]*/y;
function at(re, s, i) { re.lastIndex = i; return re.exec(s); }
function validCol(c) { return c >= 0 && c < XC; }
function validRow(r) { return r >= 0 && r < XR; }

/* the formula text (without "=") as a list of tokens, each with its start and end position */
function tokenize(src) {
  const toks = [], n = src.length; let i = 0, sheet = null, sheetStart = -1;
  function push(t) { t.s = sheetStart >= 0 ? sheetStart : t.s; sheetStart = -1; toks.push(t); if (toks.length > LIM.tokens) throw new PErr('This formula is too long.'); }
  while (i < n) {
    const ch = src.charAt(i);
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === ' ') { i++; continue; }
    if (ch === '"') {
      let j = i + 1, out = '';
      for (;;) {
        if (j >= n) throw new PErr('A piece of text needs a closing quote (").');
        const c2 = src.charAt(j);
        if (c2 === '"') { if (src.charAt(j + 1) === '"') { out += '"'; j += 2; continue; } break; }
        out += c2; j++;
      }
      push({ k: 'str', v: out, s: i, e: j + 1 }); i = j + 1; continue;
    }
    // a sheet name before "!" ( Sheet2!A1 or 'My sheet'!A1:B3 )
    let m = at(RE_Q, src, i);
    if (m) {
      sheet = m[1] !== undefined ? m[1].replace(/''/g, "'") : m[2]; sheetStart = i;
      const j = i + m[0].length, m2 = at(RE_CELLS, src, j) || at(RE_COLS, src, j) || at(RE_ROWS, src, j);
      if (!m2) throw new PErr('A sheet name must be followed by a cell, such as Sheet2!A1.');
      i = j;
    } else sheet = null;
    m = at(RE_CELLS, src, i);
    if (m) {
      const c1 = colIndex(m[2]), r1 = Number(m[4]) - 1;
      if (validCol(c1) && validRow(r1)) {
        if (m[6] === undefined) { push({ k: 'ref', sheet: sheet, c: c1, r: r1, ac: !!m[1], ar: !!m[3], s: i, e: i + m[0].length }); i += m[0].length; continue; }
        const c2 = colIndex(m[6]), r2 = Number(m[8]) - 1;
        if (validCol(c2) && validRow(r2)) { push({ k: 'range', sheet: sheet, c1: c1, r1: r1, c2: c2, r2: r2, ac1: !!m[1], ar1: !!m[3], ac2: !!m[5], ar2: !!m[7], whole: null, s: i, e: i + m[0].length }); i += m[0].length; continue; }
      }
    }
    m = at(RE_COLS, src, i);
    if (m) {
      const c1 = colIndex(m[2]), c2 = colIndex(m[4]);
      if (validCol(c1) && validCol(c2)) { push({ k: 'range', sheet: sheet, c1: c1, r1: 0, c2: c2, r2: XR - 1, ac1: !!m[1], ar1: false, ac2: !!m[3], ar2: false, whole: 'col', s: i, e: i + m[0].length }); i += m[0].length; continue; }
    }
    m = at(RE_ROWS, src, i);
    if (m) {
      const r1 = Number(m[2]) - 1, r2 = Number(m[4]) - 1;
      if (validRow(r1) && validRow(r2)) { push({ k: 'range', sheet: sheet, c1: 0, r1: r1, c2: XC - 1, r2: r2, ac1: false, ar1: !!m[1], ac2: false, ar2: !!m[3], whole: 'row', s: i, e: i + m[0].length }); i += m[0].length; continue; }
    }
    if (sheet !== null) throw new PErr('Check the cell after the sheet name.');
    m = at(RE_NUM, src, i);
    if (m) { const v = CC.sheetfmt.literal(m[0]); if (!isFinite(v) || v > 9.99999999999999e307) throw new PErr('That number is too large.'); push({ k: 'num', v: v, s: i, e: i + m[0].length }); i += m[0].length; continue; }
    m = at(RE_ERR, src, i);
    if (m) { push({ k: 'err', v: m[0].toUpperCase(), s: i, e: i + m[0].length }); i += m[0].length; continue; }
    m = at(RE_ID, src, i);
    if (m) { push({ k: 'name', v: m[0], s: i, e: i + m[0].length }); i += m[0].length; continue; }
    const two = src.substr(i, 2);
    if (two === '<>' || two === '<=' || two === '>=') { push({ k: 'op', v: two, s: i, e: i + 2 }); i += 2; continue; }
    if ('+-*/^&=<>%'.indexOf(ch) >= 0) { push({ k: 'op', v: ch, s: i, e: i + 1 }); i++; continue; }
    if (ch === '(' || ch === ')' || ch === ',') { push({ k: ch, s: i, e: i + 1 }); i++; continue; }
    throw new PErr('The symbol ' + ch + ' cannot be used in a formula.');
  }
  return toks;
}

/* ---------- the parser: operators in the order a spreadsheet applies them ---------- */
function Parser(toks) { this.t = toks; this.i = 0; this.d = 0; this.nodes = 0; }
Parser.prototype.peek = function () { return this.t[this.i]; };
Parser.prototype.isOp = function (v) { const t = this.t[this.i]; return !!t && t.k === 'op' && t.v === v; };
Parser.prototype.node = function (o) { if (++this.nodes > LIM.nodes) throw new PErr('This formula is too long.'); return o; };
Parser.prototype.enter = function () { if (++this.d > LIM.depth) throw new PErr('This formula has too many brackets inside brackets.'); };
Parser.prototype.leave = function () { this.d--; };
Parser.prototype.expr = function () {                           // comparison: = <> < > <= >=
  this.enter(); let a = this.concat();
  for (;;) {
    const t = this.peek(); if (!t || t.k !== 'op' || ['=', '<>', '<', '>', '<=', '>='].indexOf(t.v) < 0) break;
    this.i++; const b = this.concat(); a = this.node({ t: 'bin', op: t.v, a: a, b: b });
  }
  this.leave(); return a;
};
Parser.prototype.concat = function () { let a = this.add(); while (this.isOp('&')) { this.i++; const b = this.add(); a = this.node({ t: 'bin', op: '&', a: a, b: b }); } return a; };
Parser.prototype.add = function () { let a = this.mul(); while (this.isOp('+') || this.isOp('-')) { const op = this.peek().v; this.i++; const b = this.mul(); a = this.node({ t: 'bin', op: op, a: a, b: b }); } return a; };
Parser.prototype.mul = function () { let a = this.pow(); while (this.isOp('*') || this.isOp('/')) { const op = this.peek().v; this.i++; const b = this.pow(); a = this.node({ t: 'bin', op: op, a: a, b: b }); } return a; };
Parser.prototype.pow = function () { let a = this.pct(); while (this.isOp('^')) { this.i++; const b = this.pct(); a = this.node({ t: 'bin', op: '^', a: a, b: b }); } return a; };   // 2^3^2 is (2^3)^2, as in Excel
Parser.prototype.pct = function () { let a = this.unary(); while (this.isOp('%')) { this.i++; a = this.node({ t: 'pct', a: a }); } return a; };
Parser.prototype.unary = function () {                          // -2^2 is 4: the minus sign is applied first, as in Excel
  if (this.isOp('-') || this.isOp('+')) { const op = this.peek().v; this.i++; this.enter(); const a = this.unary(); this.leave(); return this.node({ t: 'un', op: op, a: a }); }
  return this.primary();
};
Parser.prototype.primary = function () {
  const t = this.peek();
  if (!t) throw new PErr('The formula ends too soon: something is missing at the end.');
  this.i++;
  switch (t.k) {
    case 'num': return this.node({ t: 'num', v: t.v });
    case 'str': return this.node({ t: 'str', v: t.v });
    case 'err': return this.node({ t: 'err', v: t.v });
    case 'ref': return this.node({ t: 'ref', sheet: t.sheet, c: t.c, r: t.r, ac: t.ac, ar: t.ar });
    case 'range': return this.node({ t: 'range', sheet: t.sheet, c1: t.c1, r1: t.r1, c2: t.c2, r2: t.r2, whole: t.whole });
    case '(': { const a = this.expr(); const c = this.peek(); if (!c || c.k !== ')') throw new PErr('A closing bracket ) is missing.'); this.i++; return a; }
    case 'name': {
      const nx = this.peek();
      if (nx && nx.k === '(') {
        this.i++; this.enter(); const args = [];
        if (this.peek() && this.peek().k === ')') this.i++;
        else {
          for (;;) {
            const p = this.peek();
            if (!p) throw new PErr('A closing bracket ) is missing.');
            if (p.k === ',' || p.k === ')') args.push(this.node({ t: 'blank' })); else args.push(this.expr());
            const q = this.peek();
            if (!q) throw new PErr('A closing bracket ) is missing.');
            this.i++; if (q.k === ')') break; if (q.k !== ',') throw new PErr('Check the formula: a comma or bracket is missing near ' + describe(q) + '.');
            if (args.length > 64) throw new PErr('A function can have at most 64 values.');
          }
        }
        this.leave(); return this.node({ t: 'fn', name: t.v.toUpperCase(), args: args });
      }
      const u = t.v.toUpperCase(); if (u === 'TRUE' || u === 'FALSE') return this.node({ t: 'bool', v: u === 'TRUE' });
      return this.node({ t: 'name', v: t.v });
    }
    case ')': throw new PErr('There is a closing bracket ) with no opening bracket.');
    case ',': throw new PErr('There is a comma where a value is needed.');
    default: throw new PErr('Check the formula: a value is missing before ' + describe(t) + '.');
  }
};
function describe(t) { return t.k === 'op' ? t.v : t.k === 'name' ? t.v : t.k === 'num' ? String(t.v) : t.k === 'str' ? '"' + t.v + '"' : t.k === 'ref' ? colName(t.c) + (t.r + 1) : t.k; }

/* text such as "=SUM(A1:A5)" -> { ast } or { error: 'message' }. Never throws. */
function parse(text) {
  try {
    if (typeof text !== 'string') return { error: 'This is not a formula.' };
    if (text.length > LIM.formula) return { error: 'This formula is too long.' };
    const src = text.charAt(0) === '=' ? text.slice(1) : text;
    if (!src.trim()) return { error: 'Type a formula after the = sign.' };
    const toks = tokenize(src), p = new Parser(toks), ast = p.expr();
    if (p.i < toks.length) { const t = toks[p.i]; throw new PErr(t.k === ')' ? 'There is a closing bracket ) with no opening bracket.' : 'Check the formula: an operator such as + or - may be missing before ' + describe(t) + '.'); }
    return { ast: ast };
  } catch (e) {
    if (e instanceof PErr) return { error: e.message };
    if (e instanceof RangeError) return { error: 'This formula is too long.' };
    throw e;
  }
}

/* ---------- writing references back as text, and rewriting them ---------- */
function quoteSheet(name) { return /^[A-Za-z_][A-Za-z0-9_.]*$/.test(name) && !parseCellName(name) && !/^R[0-9]*C[0-9]*$/i.test(name) ? name : "'" + name.replace(/'/g, "''") + "'"; }
function cellText(c, r, ac, ar) { return (ac ? '$' : '') + colName(c) + (ar ? '$' : '') + (r + 1); }
function refToText(t) {
  const q = t.sheet != null ? quoteSheet(t.sheet) + '!' : '';
  if (t.k === 'ref') return q + cellText(t.c, t.r, t.ac, t.ar);
  if (t.whole === 'col') return q + (t.ac1 ? '$' : '') + colName(t.c1) + ':' + (t.ac2 ? '$' : '') + colName(t.c2);
  if (t.whole === 'row') return q + (t.ar1 ? '$' : '') + (t.r1 + 1) + ':' + (t.ar2 ? '$' : '') + (t.r2 + 1);
  return q + cellText(t.c1, t.r1, t.ac1, t.ar1) + ':' + cellText(t.c2, t.r2, t.ac2, t.ar2);
}
/* every reference in a formula is passed to fn(token); fn returns the new token, or null for #REF! */
function mapRefs(text, fn) {
  if (typeof text !== 'string' || text.charAt(0) !== '=') return text;
  let toks; try { toks = tokenize(text.slice(1)); } catch (e) { if (e instanceof PErr) return text; throw e; }
  let out = '=', pos = 1;
  toks.forEach(function (t) {
    if (t.k !== 'ref' && t.k !== 'range') return;
    out += text.slice(pos, t.s + 1); const rep = fn(t); out += rep ? refToText(rep) : '#REF!'; pos = t.e + 1;
  });
  return out + text.slice(pos);
}
function sameName(a, b) { return String(a).toLowerCase() === String(b).toLowerCase(); }
function bump(v, abs, d, max) { if (abs) return v; v += d; return v < 0 || v >= max ? NaN : v; }
/* the formula as it becomes when copied dc columns right and dr rows down: relative references move, $absolute ones stay */
function shiftFormula(text, dc, dr) {
  return mapRefs(text, function (t) {
    const o = Object.assign({}, t);
    if (t.k === 'ref') { o.c = bump(t.c, t.ac, dc, XC); o.r = bump(t.r, t.ar, dr, XR); return isNaN(o.c) || isNaN(o.r) ? null : o; }
    if (t.whole !== 'row') { o.c1 = bump(t.c1, t.ac1, dc, XC); o.c2 = bump(t.c2, t.ac2, dc, XC); }
    if (t.whole !== 'col') { o.r1 = bump(t.r1, t.ar1, dr, XR); o.r2 = bump(t.r2, t.ar2, dr, XR); }
    return isNaN(o.c1) || isNaN(o.c2) || isNaN(o.r1) || isNaN(o.r2) ? null : o;
  });
}
/* host is the name of the sheet the formula is in. op is one of:
   { type: 'insert'|'delete', sheet, axis: 'r'|'c', at, count }   rows or columns added or removed in a sheet
   { type: 'rename', from, to }                                   a sheet renamed
   { type: 'dropSheet', name }                                    a sheet deleted
   { type: 'move', sheet, dest, r1, c1, r2, c2, dr, dc }          cells cut from one place and pasted in another */
function rewrite(text, host, op) {
  return mapRefs(text, function (t) {
    const target = t.sheet == null ? host : t.sheet;
    if (op.type === 'rename') { if (t.sheet != null && sameName(t.sheet, op.from)) { const o = Object.assign({}, t); o.sheet = op.to; return o; } return t; }
    if (op.type === 'dropSheet') return sameName(target, op.name) ? null : t;
    if (!sameName(target, op.sheet)) return t;
    if (op.type === 'move') return moveRef(t, host, op);
    const o = Object.assign({}, t), r = op.axis === 'r', lo = r ? 'r' : 'c', max = r ? XR : XC;
    if (t.k === 'ref') { const v = adjustIndex(t[lo], op); if (v === null || v >= max) return null; o[lo] = v; return o; }
    if ((r && t.whole === 'col') || (!r && t.whole === 'row')) return t;              // whole columns do not change when rows move
    const a = r ? t.r1 : t.c1, b = r ? t.r2 : t.c2, lo1 = Math.min(a, b), hi1 = Math.max(a, b), x = adjustRange(lo1, hi1, op);
    if (!x || x[1] >= max) return null;
    if (a <= b) { o[r ? 'r1' : 'c1'] = x[0]; o[r ? 'r2' : 'c2'] = x[1]; } else { o[r ? 'r1' : 'c1'] = x[1]; o[r ? 'r2' : 'c2'] = x[0]; }
    return o;
  });
}
function adjustIndex(v, op) {
  if (op.type === 'insert') return v >= op.at ? v + op.count : v;
  const end = op.at + op.count - 1; if (v >= op.at && v <= end) return null; return v > end ? v - op.count : v;
}
function adjustRange(a, b, op) {                                   // a <= b
  if (op.type === 'insert') return [a >= op.at ? a + op.count : a, b >= op.at ? b + op.count : b];
  const end = op.at + op.count - 1; if (b < op.at) return [a, b]; if (a > end) return [a - op.count, b - op.count];
  const na = a < op.at ? a : op.at, nb = b > end ? b - op.count : op.at - 1; return nb < na ? null : [na, nb];
}
function inside(op, c, r) { return c >= op.c1 && c <= op.c2 && r >= op.r1 && r <= op.r2; }
function moveRef(t, host, op) {
  const o = Object.assign({}, t), toOther = op.dest != null && !sameName(op.dest, op.sheet);
  if (t.k === 'ref') {
    if (!inside(op, t.c, t.r)) return t;
    o.c = t.c + op.dc; o.r = t.r + op.dr; if (!validCol(o.c) || !validRow(o.r)) return null;
    if (toOther) o.sheet = op.dest; return o;
  }
  if (t.whole || !inside(op, t.c1, t.r1) || !inside(op, t.c2, t.r2)) return t;       // only a range that moves completely moves with its cells
  o.c1 += op.dc; o.c2 += op.dc; o.r1 += op.dr; o.r2 += op.dr; if (!validCol(o.c1) || !validCol(o.c2) || !validRow(o.r1) || !validRow(o.r2)) return null;
  if (toOther) o.sheet = op.dest; return o;
}
/* a list of the references in a formula: { sheet, c1, r1, c2, r2 } (used when exporting and when checking a formula) */
function refsOf(text) {
  const out = []; if (typeof text !== 'string' || text.charAt(0) !== '=') return out;
  let toks; try { toks = tokenize(text.slice(1)); } catch (e) { return out; }
  toks.forEach(function (t) { if (t.k === 'ref') out.push({ sheet: t.sheet, c1: t.c, r1: t.r, c2: t.c, r2: t.r }); else if (t.k === 'range') out.push({ sheet: t.sheet, c1: t.c1, r1: t.r1, c2: t.c2, r2: t.r2 }); });
  return out;
}
/* is this a name a sheet may have? Returns the cleaned name or '' */
function cleanSheetName(s) {
  s = String(s == null ? '' : s).replace(/[\u0000-\u001F\u007F‎‏‪-‮⁦-⁩]/g, '').replace(/[\[\]:*?\/\\]/g, ' ').replace(/\s+/g, ' ').trim();
  s = s.replace(/^'+|'+$/g, '').trim(); return s.slice(0, LIM.name).trim();
}

CC.sheetparse = { LIM: LIM, XC: XC, XR: XR, colName: colName, colIndex: colIndex, cellName: cellName, parseCellName: parseCellName, parse: parse, tokenize: tokenize, mapRefs: mapRefs, refToText: refToText,
  shiftFormula: shiftFormula, rewrite: rewrite, refsOf: refsOf, quoteSheet: quoteSheet, cleanSheetName: cleanSheetName, sameName: sameName, PErr: PErr };
})();
