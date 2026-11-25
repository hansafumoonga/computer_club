/* sheetcalc.js - working out a formula. It walks the tree made by sheetparse.js and applies the rules a spreadsheet follows
   (text that looks like a number, how values compare, which cells a range covers) and about 120 functions (SUM, IF, VLOOKUP ...).
   Safety: nothing here runs text as code; every loop is bounded by the size of the grid, every piece of text by 32,767 characters,
   and every calculation spends from a budget, so a careless or hostile formula ends in an error instead of freezing the page. */
(function () {
'use strict';
const CC = window.CC = window.CC || {};
const P = CC.sheetparse, Fm = CC.sheetfmt, LIM = P.LIM;

function Err(code) { this.code = code; }
Err.prototype.toString = function () { return this.code; };
const E = { DIV0: new Err('#DIV/0!'), VALUE: new Err('#VALUE!'), REF: new Err('#REF!'), NAME: new Err('#NAME?'), NUM: new Err('#NUM!'), NA: new Err('#N/A'), NULL: new Err('#NULL!'), CIRC: new Err('#CIRC!'), LIMIT: new Err('#LIMIT!') };
const BYCODE = Object.create(null); Object.keys(E).forEach(function (k) { BYCODE[E[k].code] = E[k]; });
function Rng(si, c1, r1, c2, r2) { this.si = si; this.c1 = Math.min(c1, c2); this.c2 = Math.max(c1, c2); this.r1 = Math.min(r1, r2); this.r2 = Math.max(r1, r2); }
const Calc = { bug: null };                                           // set when something unexpected is caught (the tests check that it stays empty)

/* ---------- turning values into numbers, text and true/false ---------- */
function norm(n) { return Number(n.toPrecision(15)); }               // a spreadsheet compares numbers to 15 digits
function chk(n) { if (typeof n !== 'number' || !isFinite(n) || Math.abs(n) > Fm.MAXNUM) throw E.NUM; return n !== 0 && Math.abs(n) < Fm.MINNUM ? 0 : n; }   // a spreadsheet's numbers run from about 2E-308 to 1E+308
function num(v) {
  if (typeof v === 'number') return v;
  if (v === null || v === undefined) return 0;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'string') { const n = Fm.parseNumber(v); if (n === null) throw E.VALUE; return n; }
  if (v instanceof Err) throw v;
  throw E.VALUE;
}
const numText = Fm.numText;                                           // a number written as text: up to 15 digits (see sheetfmt.js)
function str(v) {
  if (typeof v === 'string') return v;
  if (v === null || v === undefined) return '';
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (typeof v === 'number') return numText(v);
  if (v instanceof Err) throw v;
  throw E.VALUE;
}
function bool(v) {
  if (typeof v === 'boolean') return v;
  if (v === null || v === undefined) return false;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') { const u = v.toUpperCase(); if (u === 'TRUE') return true; if (u === 'FALSE') return false; throw E.VALUE; }
  if (v instanceof Err) throw v;
  throw E.VALUE;
}
function int(v) { return Math.trunc(norm(num(v))); }
function cap(s) { if (s.length > LIM.str) throw E.VALUE; return s; }
function sumOf(arr) {
  let s = 0, m = 0;
  for (let i = 0; i < arr.length; i++) { const v = arr[i]; s += v; const q = Math.abs(v); if (q > m) m = q; }
  if (s !== 0 && Math.abs(s) < 8.9e-16 * m) s = 0;                  // 0.1 + 0.2 - 0.3 is 0, not 5.5E-17
  return chk(s);
}

/* ---------- comparing ---------- */
function rank(v) { return typeof v === 'number' ? 0 : typeof v === 'string' ? 1 : 2; }
function cmp(a, b) {                                                  // numbers come before text, text before TRUE/FALSE; capital letters do not matter
  if (a === null && b === null) return 0;
  if (a === null) a = typeof b === 'string' ? '' : typeof b === 'boolean' ? false : 0;
  if (b === null) b = typeof a === 'string' ? '' : typeof a === 'boolean' ? false : 0;
  const ra = rank(a), rb = rank(b);
  if (ra !== rb) return ra < rb ? -1 : 1;
  if (ra === 0) { const x = norm(a), y = norm(b); return x < y ? -1 : x > y ? 1 : 0; }
  if (ra === 1) { const x = a.toLowerCase(), y = b.toLowerCase(); return x < y ? -1 : x > y ? 1 : 0; }
  return a === b ? 0 : a ? 1 : -1;
}
/* wildcards: ? is any one character, * is any number of characters, ~ takes away the special meaning of the next one */
function wildTokens(p) {
  const t = [];
  for (let i = 0; i < p.length; i++) {
    const c = p.charAt(i);
    if (c === '~' && i + 1 < p.length && '*?~'.indexOf(p.charAt(i + 1)) >= 0) t.push([2, p.charAt(++i)]); else if (c === '*') t.push([0]); else if (c === '?') t.push([1]); else t.push([2, c]);
  }
  return t;
}
function hasWild(p) { return /[*?~]/.test(p); }
function wildFull(t, s, x) {                                          // does the whole text match? (no backtracking beyond the last *, so it is always quick)
  let ti = 0, si = 0, star = -1, mark = 0, steps = 0;
  while (si < s.length) {
    if (x && (++steps & 1023) === 0) x.spend(1);
    if (ti < t.length && (t[ti][0] === 1 || (t[ti][0] === 2 && t[ti][1] === s.charAt(si)))) { ti++; si++; }
    else if (ti < t.length && t[ti][0] === 0) { star = ti++; mark = si; }
    else if (star >= 0) { ti = star + 1; si = ++mark; }
    else return false;
  }
  while (ti < t.length && t[ti][0] === 0) ti++;
  return ti === t.length;
}
/* the test used by COUNTIF, SUMIF ...: a number, text, or text such as ">5", "<>apple", "a*" */
function crit(c) {
  if (c instanceof Err) throw c;
  if (c === null) return crit(0);
  if (typeof c === 'number') { const n = norm(c); return function (v) { return (typeof v === 'number' && norm(v) === n) || (typeof v === 'string' && Fm.parseNumber(v) === c); }; }
  if (typeof c === 'boolean') return function (v) { return v === c; };
  const m = /^(<=|>=|<>|<|>|=)?([\s\S]*)$/.exec(c), op = m[1] || '=', rest = m[2], u = rest.toUpperCase();
  let eq;
  if (rest === '') eq = function (v) { return v === null || v === ''; };
  else if (u === 'TRUE' || u === 'FALSE') { const b = u === 'TRUE'; eq = function (v) { return v === b; }; }
  else {
    const n = Fm.parseNumber(rest);
    if (n !== null) {
      const nn = norm(n);
      if (op === '=' || op === '<>') eq = function (v) { return (typeof v === 'number' && norm(v) === nn) || (typeof v === 'string' && Fm.parseNumber(v) === n); };
      else return function (v) { if (typeof v !== 'number') return false; const k = norm(v); return op === '<' ? k < nn : op === '>' ? k > nn : op === '<=' ? k <= nn : k >= nn; };
    } else {
      const low = rest.toLowerCase();
      if (op === '=' || op === '<>') {
        if (hasWild(low)) { const t = wildTokens(low); eq = function (v) { return typeof v === 'string' && wildFull(t, v.toLowerCase(), null); }; }
        else eq = function (v) { return typeof v === 'string' && v.toLowerCase() === low; };
      } else return function (v) { if (typeof v !== 'string') return false; const k = v.toLowerCase(); return op === '<' ? k < low : op === '>' ? k > low : op === '<=' ? k <= low : k >= low; };
    }
  }
  return op === '<>' ? function (v) { return !eq(v); } : eq;
}
/* equality for MATCH / VLOOKUP: the same kind of value, capitals ignored, wildcards allowed in text */
function looseEq(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return norm(a) === norm(b);
  if (typeof a === 'string' && typeof b === 'string') { const x = a.toLowerCase(), y = b.toLowerCase(); return hasWild(y) ? wildFull(wildTokens(y), x, null) : x === y; }
  return typeof a === 'boolean' && a === b;
}
/* ---------- ranges ---------- */
function sheetOf(name, x) { return name == null ? x.si : x.sheetIndex(name); }
function singleRng(a, x) { const si = sheetOf(a.sheet, x); if (si < 0) throw E.REF; return new Rng(si, a.c, a.r, a.c, a.r); }
function clampR(r) { return { c1: r.c1, r1: r.r1, c2: Math.min(r.c2, LIM.cols - 1), r2: Math.min(r.r2, LIM.rows - 1) }; }
function dims(r) { const k = clampR(r); return { h: Math.max(0, k.r2 - k.r1 + 1), w: Math.max(0, k.c2 - k.c1 + 1) }; }
function eachVal(r, x, f) {
  const k = clampR(r); if (k.c1 > k.c2 || k.r1 > k.r2) return;
  x.spend((k.c2 - k.c1 + 1) * (k.r2 - k.r1 + 1));
  for (let rr = k.r1; rr <= k.r2; rr++) for (let cc = k.c1; cc <= k.c2; cc++) f(x.cell(r.si, cc, rr), rr - k.r1, cc - k.c1);
}
function grid(r, x) { const out = []; eachVal(r, x, function (v, i, j) { (out[i] = out[i] || [])[j] = v; }); return out; }
function deref(r, x) {                                               // a range where one value is wanted: a single cell, or the cell in the formula's own row or column
  if (r.c1 === r.c2 && r.r1 === r.r2) return x.cell(r.si, r.c1, r.r1);
  if (r.si === x.si) {
    if (r.c1 === r.c2 && x.r >= r.r1 && x.r <= r.r2) return x.cell(r.si, r.c1, x.r);
    if (r.r1 === r.r2 && x.c >= r.c1 && x.c <= r.c2) return x.cell(r.si, x.c, r.r1);
  }
  throw E.VALUE;
}
function scal(v, x) { return v instanceof Rng ? deref(v, x) : v; }
/* the numbers in the arguments of SUM, AVERAGE ... : text and TRUE/FALSE inside ranges are skipped, but typed directly they count */
function collect(args, x) {
  const out = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a instanceof Rng) eachVal(a, x, function (v) { if (v instanceof Err) throw v; if (typeof v === 'number') out.push(v); });
    else if (a !== null) out.push(num(a));
  }
  return out;
}

/* ---------- the evaluator ---------- */
function ev(n, x) {
  switch (n.t) {
    case 'num': case 'str': case 'bool': return n.v;
    case 'blank': return null;
    case 'err': return BYCODE[n.v] || E.VALUE;
    case 'name': return E.NAME;
    case 'ref': { const si = sheetOf(n.sheet, x); return si < 0 ? E.REF : x.cell(si, n.c, n.r); }
    case 'range': { const si = sheetOf(n.sheet, x); return si < 0 ? E.REF : new Rng(si, n.c1, n.r1, n.c2, n.r2); }
    case 'un': { const v = num(scal(ev(n.a, x), x)); return n.op === '-' ? -v : v; }
    case 'pct': return num(scal(ev(n.a, x), x)) / 100;
    case 'bin': return binary(n, x);
    case 'fn': return callFn(n, x);
  }
  throw E.VALUE;
}
function binary(n, x) {
  const a = scal(ev(n.a, x), x), b = scal(ev(n.b, x), x);
  switch (n.op) {
    case '+': { const p = num(a), q = num(b); return snap(chk(p + q), p, q); }
    case '-': { const p = num(a), q = num(b); return snap(chk(p - q), p, q); }
    case '*': return chk(num(a) * num(b));
    case '/': { const p = num(a), q = num(b); if (q === 0) throw E.DIV0; return chk(p / q); }
    case '^': return power(num(a), num(b));
    case '&': return cap(str(a) + str(b));
  }
  if (a instanceof Err) throw a; if (b instanceof Err) throw b;
  const k = cmp(a, b);
  switch (n.op) { case '=': return k === 0; case '<>': return k !== 0; case '<': return k < 0; case '>': return k > 0; case '<=': return k <= 0; case '>=': return k >= 0; }
  throw E.VALUE;
}
function power(p, q) {
  if (p === 0 && q === 0) throw E.NUM; if (p === 0 && q < 0) throw E.DIV0;
  if (p < 0 && q !== Math.trunc(q)) { const k = 1 / Math.abs(q), r = Math.round(k); if (r % 2 === 1 && Math.abs(k - r) < 1e-13) return chk(-Math.pow(-p, q)); throw E.NUM; }   // (-8)^(1/3) is -2; (-8)^0.5 is an error
  return chk(Math.pow(p, q));
}
function snap(r, a, b) { return r !== 0 && Math.abs(r) < 8.9e-16 * Math.max(Math.abs(a), Math.abs(b)) ? 0 : r; }

const FUNCS = Object.create(null), LAZY = Object.create(null);
/* spec: one letter for each value a function takes, the last letter repeating -
   S = one value (a range gives the cell in the same row or column), A = a range or values, R = must be a range, E = one value (errors allowed) */
function def(names, spec, min, max, fn) { names.split(' ').forEach(function (nm) { FUNCS[nm] = { spec: spec, min: min, max: max, fn: fn }; }); }
function kindAt(spec, i) { return typeof spec === 'function' ? spec(i) : spec.charAt(Math.min(i, spec.length - 1)); }
function callFn(n, x) {
  const lz = LAZY[n.name]; if (lz) { if (n.args.length < lz.min || n.args.length > lz.max) throw E.VALUE; return lz.fn(n.args, x); }
  const d = FUNCS[n.name]; if (!d) throw E.NAME;
  const k = n.args.length; if (k < d.min || k > d.max) throw E.VALUE;
  x.spend(1);
  const args = new Array(k);
  for (let i = 0; i < k; i++) {
    const kind = kindAt(d.spec, i), a = n.args[i]; let v;
    if (kind === 'A' || kind === 'R') {
      v = a.t === 'ref' ? singleRng(a, x) : ev(a, x);
      if (kind === 'R' && !(v instanceof Rng)) { if (v instanceof Err) throw v; throw E.VALUE; }
      if (v instanceof Err) throw v;
    } else if (kind === 'E') v = safe(a, x);                           // ISERROR(1/0): the error is the value being asked about
    else { v = scal(ev(a, x), x); if (v instanceof Err) throw v; }
    args[i] = v;
  }
  return d.fn(args, x);
}
function lazy(name, min, max, fn) { LAZY[name] = { min: min, max: max, fn: fn }; }
function safe(node, x) { try { const v = scal(ev(node, x), x); return v; } catch (e) { if (e instanceof Err) return e; throw e; } }
lazy('IF', 2, 3, function (a, x) { return bool(scal(ev(a[0], x), x)) ? ev(a[1], x) : (a.length > 2 ? ev(a[2], x) : false); });
lazy('IFERROR', 2, 2, function (a, x) { const v = safe(a[0], x); return v instanceof Err ? ev(a[1], x) : v; });
lazy('IFNA', 2, 2, function (a, x) { const v = safe(a[0], x); return v === E.NA ? ev(a[1], x) : v; });
lazy('IFS', 2, 126, function (a, x) { if (a.length % 2) throw E.VALUE; for (let i = 0; i < a.length; i += 2) if (bool(scal(ev(a[i], x), x))) return ev(a[i + 1], x); throw E.NA; });
lazy('CHOOSE', 2, 255, function (a, x) { const i = int(scal(ev(a[0], x), x)); if (i < 1 || i >= a.length) throw E.VALUE; return ev(a[i], x); });
lazy('SWITCH', 3, 126, function (a, x) {
  const v = scal(ev(a[0], x), x); if (v instanceof Err) throw v;
  const pairs = Math.floor((a.length - 1) / 2);
  for (let i = 0; i < pairs; i++) { const c = scal(ev(a[1 + 2 * i], x), x); if (c instanceof Err) throw c; if (cmp(v, c) === 0) return ev(a[2 + 2 * i], x); }
  if ((a.length - 1) % 2 === 1) return ev(a[a.length - 1], x);
  throw E.NA;
});

/* ---------- maths ---------- */
def('SUM', 'A', 1, 64, function (a, x) { return sumOf(collect(a, x)); });
def('PRODUCT', 'A', 1, 64, function (a, x) { const v = collect(a, x); let p = 1; for (let i = 0; i < v.length; i++) p *= v[i]; return v.length ? chk(p) : 0; });
def('AVERAGE', 'A', 1, 64, function (a, x) { const v = collect(a, x); if (!v.length) throw E.DIV0; return sumOf(v) / v.length; });
def('MIN', 'A', 1, 64, function (a, x) { const v = collect(a, x); let m = Infinity; for (let i = 0; i < v.length; i++) if (v[i] < m) m = v[i]; return v.length ? m : 0; });
def('MAX', 'A', 1, 64, function (a, x) { const v = collect(a, x); let m = -Infinity; for (let i = 0; i < v.length; i++) if (v[i] > m) m = v[i]; return v.length ? m : 0; });
def('SUMSQ', 'A', 1, 64, function (a, x) { const v = collect(a, x); let s = 0; for (let i = 0; i < v.length; i++) s += v[i] * v[i]; return chk(s); });
def('COUNT', 'A', 1, 64, function (a, x) {
  let n = 0;
  a.forEach(function (v) { if (v instanceof Rng) eachVal(v, x, function (c) { if (typeof c === 'number') n++; }); else if (typeof v === 'number' || typeof v === 'boolean' || (typeof v === 'string' && Fm.parseNumber(v) !== null)) n++; });
  return n;
});
def('COUNTA', 'A', 1, 64, function (a, x) { let n = 0; a.forEach(function (v) { if (v instanceof Rng) eachVal(v, x, function (c) { if (c !== null) n++; }); else if (v !== null) n++; }); return n; });
def('COUNTBLANK', 'R', 1, 1, function (a, x) { let n = 0; eachVal(a[0], x, function (c) { if (c === null || c === '') n++; }); return n; });
def('MEDIAN', 'A', 1, 64, function (a, x) { const v = collect(a, x).sort(function (p, q) { return p - q; }); if (!v.length) throw E.NUM; const m = v.length >> 1; return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2; });
def('MODE MODE.SNGL', 'A', 1, 64, function (a, x) {
  const v = collect(a, x), cnt = new Map(); let best = null, bc = 1;
  v.forEach(function (n) { const k = norm(n); cnt.set(k, (cnt.get(k) || 0) + 1); });
  v.forEach(function (n) { const c = cnt.get(norm(n)); if (c > bc) { bc = c; best = n; } });
  if (best === null) throw E.NA; return best;
});
def('LARGE', 'AS', 2, 2, function (a, x) { const v = collect([a[0]], x).sort(function (p, q) { return q - p; }), k = int(a[1]); if (k < 1 || k > v.length) throw E.NUM; return v[k - 1]; });
def('SMALL', 'AS', 2, 2, function (a, x) { const v = collect([a[0]], x).sort(function (p, q) { return p - q; }), k = int(a[1]); if (k < 1 || k > v.length) throw E.NUM; return v[k - 1]; });
def('RANK RANK.EQ', 'SRS', 2, 3, function (a, x) {
  const n = norm(num(a[0])), desc = a.length < 3 || num(a[2]) === 0; let found = false, better = 0;
  eachVal(a[1], x, function (c) { if (typeof c !== 'number') return; const k = norm(c); if (k === n) found = true; else if (desc ? k > n : k < n) better++; });
  if (!found) throw E.NA; return better + 1;
});
function variance(a, x, sample) { const v = collect(a, x), n = v.length; if (n < (sample ? 2 : 1)) throw E.DIV0; const mean = sumOf(v) / n; let s = 0; for (let i = 0; i < n; i++) s += (v[i] - mean) * (v[i] - mean); return s / (sample ? n - 1 : n); }
def('VAR VAR.S', 'A', 1, 64, function (a, x) { return variance(a, x, true); });
def('VAR.P', 'A', 1, 64, function (a, x) { return variance(a, x, false); });
def('STDEV STDEV.S', 'A', 1, 64, function (a, x) { return Math.sqrt(variance(a, x, true)); });
def('STDEV.P', 'A', 1, 64, function (a, x) { return Math.sqrt(variance(a, x, false)); });
def('SUMPRODUCT', 'A', 1, 30, function (a, x) {
  const arrs = a.map(function (v) { return v instanceof Rng ? { d: dims(v), g: grid(v, x) } : { d: { h: 1, w: 1 }, g: [[v]] }; });
  const d0 = arrs[0].d; let s = 0;
  for (let k = 1; k < arrs.length; k++) if (arrs[k].d.h !== d0.h || arrs[k].d.w !== d0.w) throw E.VALUE;
  for (let i = 0; i < d0.h; i++) for (let j = 0; j < d0.w; j++) {
    let p = 1;
    for (let k = 0; k < arrs.length; k++) { const v = arrs[k].g[i][j]; if (v instanceof Err) throw v; p *= typeof v === 'number' ? v : 0; }
    s += p;
  }
  return chk(s);
});
def('ABS', 'S', 1, 1, function (a) { return Math.abs(num(a[0])); });
def('SIGN', 'S', 1, 1, function (a) { const v = num(a[0]); return v > 0 ? 1 : v < 0 ? -1 : 0; });
def('SQRT', 'S', 1, 1, function (a) { const v = num(a[0]); if (v < 0) throw E.NUM; return Math.sqrt(v); });
def('POWER', 'SS', 2, 2, function (a) { return power(num(a[0]), num(a[1])); });
def('EXP', 'S', 1, 1, function (a) { return chk(Math.exp(num(a[0]))); });
def('LN', 'S', 1, 1, function (a) { const v = num(a[0]); if (v <= 0) throw E.NUM; return Math.log(v); });
def('LOG10', 'S', 1, 1, function (a) { const v = num(a[0]); if (v <= 0) throw E.NUM; return Math.log10(v); });
def('LOG', 'SS', 1, 2, function (a) { const v = num(a[0]), b = a.length > 1 ? num(a[1]) : 10; if (v <= 0 || b <= 0) throw E.NUM; if (b === 1) throw E.DIV0; return Math.log(v) / Math.log(b); });
def('PI', 'S', 0, 0, function () { return Math.PI; });
def('MOD', 'SS', 2, 2, function (a) { const p = num(a[0]), q = num(a[1]); if (q === 0) throw E.DIV0; return p - q * Math.floor(p / q); });
def('QUOTIENT', 'SS', 2, 2, function (a) { const q = num(a[1]); if (q === 0) throw E.DIV0; return Math.trunc(norm(num(a[0]) / q)); });
def('INT', 'S', 1, 1, function (a) { return Math.floor(norm(num(a[0]))); });
def('TRUNC', 'SS', 1, 2, function (a) { return Fm.roundDec(num(a[0]), a.length > 1 ? int(a[1]) : 0, 'down'); });
def('ROUND', 'SS', 2, 2, function (a) { return Fm.roundDec(num(a[0]), int(a[1])); });
def('ROUNDUP', 'SS', 2, 2, function (a) { return Fm.roundDec(num(a[0]), int(a[1]), 'up'); });
def('ROUNDDOWN', 'SS', 2, 2, function (a) { return Fm.roundDec(num(a[0]), int(a[1]), 'down'); });
def('CEILING', 'SS', 1, 2, function (a) { const v = num(a[0]), s = a.length > 1 ? num(a[1]) : 1; if (s === 0) return 0; if (v > 0 && s < 0) throw E.NUM; return Fm.roundDec(Math.ceil(norm(v / s)) * s, 12); });
def('FLOOR', 'SS', 1, 2, function (a) { const v = num(a[0]), s = a.length > 1 ? num(a[1]) : 1; if (s === 0) throw E.DIV0; if (v > 0 && s < 0) throw E.NUM; return Fm.roundDec(Math.floor(norm(v / s)) * s, 12); });
def('MROUND', 'SS', 2, 2, function (a) { const v = num(a[0]), s = num(a[1]); if (s === 0) return 0; if (v * s < 0) throw E.NUM; return Fm.roundDec(Math.round(norm(v / s)) * s, 12); });
def('FACT', 'S', 1, 1, function (a) { const v = int(a[0]); if (v < 0 || v > 170) throw E.NUM; let p = 1; for (let i = 2; i <= v; i++) p *= i; return p; });
def('COMBIN', 'SS', 2, 2, function (a) { const n = int(a[0]), k = int(a[1]); if (n < 0 || k < 0 || k > n || n > 1000) throw E.NUM; let r = 1; const m = Math.min(k, n - k); for (let i = 1; i <= m; i++) r = r * (n - m + i) / i; return chk(Math.round(r)); });
function gcd(p, q) { while (q) { const t = p % q; p = q; q = t; } return p; }
def('GCD', 'A', 1, 64, function (a, x) { const v = collect(a, x).map(function (n) { if (n < 0) throw E.NUM; return Math.trunc(n); }); return v.reduce(gcd, 0); });
def('LCM', 'A', 1, 64, function (a, x) { const v = collect(a, x).map(function (n) { if (n < 0) throw E.NUM; return Math.trunc(n); }); return chk(v.reduce(function (p, q) { return p === 0 || q === 0 ? 0 : p / gcd(p, q) * q; }, 1)); });
def('RAND', 'S', 0, 0, function () { return Math.random(); });
def('RANDBETWEEN', 'SS', 2, 2, function (a) { const lo = Math.ceil(num(a[0])), hi = Math.floor(num(a[1])); if (lo > hi) throw E.NUM; return lo + Math.floor(Math.random() * (hi - lo + 1)); });
def('SIN', 'S', 1, 1, function (a) { return Math.sin(num(a[0])); });
def('COS', 'S', 1, 1, function (a) { return Math.cos(num(a[0])); });
def('TAN', 'S', 1, 1, function (a) { return chk(Math.tan(num(a[0]))); });
def('ASIN', 'S', 1, 1, function (a) { return chk(Math.asin(num(a[0]))); });
def('ACOS', 'S', 1, 1, function (a) { return chk(Math.acos(num(a[0]))); });
def('ATAN', 'S', 1, 1, function (a) { return Math.atan(num(a[0])); });
def('ATAN2', 'SS', 2, 2, function (a) { const p = num(a[0]), q = num(a[1]); if (p === 0 && q === 0) throw E.DIV0; return Math.atan2(q, p); });
def('DEGREES', 'S', 1, 1, function (a) { return num(a[0]) * 180 / Math.PI; });
def('RADIANS', 'S', 1, 1, function (a) { return num(a[0]) * Math.PI / 180; });

/* ---------- conditions ---------- */
def('AND OR XOR', 'A', 1, 64, null);
['AND', 'OR', 'XOR'].forEach(function (nm) {
  FUNCS[nm].fn = function (a, x) {
    const vals = [];
    a.forEach(function (v) { if (v instanceof Rng) eachVal(v, x, function (c) { if (c instanceof Err) throw c; if (typeof c === 'boolean') vals.push(c); else if (typeof c === 'number') vals.push(c !== 0); }); else vals.push(bool(v)); });
    if (!vals.length) throw E.VALUE;
    if (nm === 'AND') return vals.every(Boolean); if (nm === 'OR') return vals.some(Boolean); return vals.filter(Boolean).length % 2 === 1;
  };
});
def('NOT', 'S', 1, 1, function (a) { return !bool(a[0]); });
def('TRUE', 'S', 0, 0, function () { return true; });
def('FALSE', 'S', 0, 0, function () { return false; });
function critPairs(a, x, from) {                               // (range, criteria) pairs from position `from`: the list of row/column positions that pass every test
  if ((a.length - from) % 2) throw E.VALUE;
  let d0 = null, ok = null;
  for (let i = from; i < a.length; i += 2) {
    const r = a[i], f = crit(a[i + 1]), d = dims(r);
    if (d0 && (d.h !== d0.h || d.w !== d0.w)) throw E.VALUE;
    if (!d0) { d0 = d; ok = []; for (let p = 0; p < d.h; p++) ok.push(new Array(d.w).fill(true)); }
    eachVal(r, x, function (v, p, q) { if (v instanceof Err || !f(v)) ok[p][q] = false; });
  }
  return { ok: ok, d: d0 };
}
function pick(r, ok, x, f) { eachVal(r, x, function (v, p, q) { if (ok[p] && ok[p][q]) f(v); }); }
const IFSPEC = function (i) { return i === 0 ? 'R' : (i % 2 === 1 ? 'R' : 'S'); }, CNTSPEC = function (i) { return i % 2 === 0 ? 'R' : 'S'; };
def('COUNTIF', 'RS', 2, 2, function (a, x) { const f = crit(a[1]); let n = 0; eachVal(a[0], x, function (v) { if (!(v instanceof Err) && f(v)) n++; }); return n; });
def('SUMIF', 'RSR', 2, 3, function (a, x) {
  const f = crit(a[1]), out = []; const sumR = a.length > 2 ? a[2] : a[0], g = grid(sumR, x);
  eachVal(a[0], x, function (v, p, q) { if (!(v instanceof Err) && f(v)) { const s = g[p] && g[p][q]; if (s instanceof Err) throw s; if (typeof s === 'number') out.push(s); } });
  return sumOf(out);
});
def('AVERAGEIF', 'RSR', 2, 3, function (a, x) {
  const f = crit(a[1]), out = []; const avgR = a.length > 2 ? a[2] : a[0], g = grid(avgR, x);
  eachVal(a[0], x, function (v, p, q) { if (!(v instanceof Err) && f(v)) { const s = g[p] && g[p][q]; if (s instanceof Err) throw s; if (typeof s === 'number') out.push(s); } });
  if (!out.length) throw E.DIV0; return sumOf(out) / out.length;
});
def('COUNTIFS', CNTSPEC, 2, 126, function (a, x) { const r = critPairs(a, x, 0); let n = 0; r.ok.forEach(function (row) { row.forEach(function (b) { if (b) n++; }); }); return n; });
function ifsNums(a, x) { const r = critPairs(a, x, 1), nums = [], d = dims(a[0]); if (d.h !== r.d.h || d.w !== r.d.w) throw E.VALUE; pick(a[0], r.ok, x, function (v) { if (v instanceof Err) throw v; if (typeof v === 'number') nums.push(v); }); return nums; }
def('SUMIFS', IFSPEC, 3, 127, function (a, x) { return sumOf(ifsNums(a, x)); });
def('AVERAGEIFS', IFSPEC, 3, 127, function (a, x) { const v = ifsNums(a, x); if (!v.length) throw E.DIV0; return sumOf(v) / v.length; });
def('MAXIFS', IFSPEC, 3, 127, function (a, x) { const v = ifsNums(a, x); let m = -Infinity; v.forEach(function (n) { if (n > m) m = n; }); return v.length ? m : 0; });
def('MINIFS', IFSPEC, 3, 127, function (a, x) { const v = ifsNums(a, x); let m = Infinity; v.forEach(function (n) { if (n < m) m = n; }); return v.length ? m : 0; });

/* ---------- text ---------- */
def('LEN', 'S', 1, 1, function (a) { return str(a[0]).length; });
def('UPPER', 'S', 1, 1, function (a) { return str(a[0]).toUpperCase(); });
def('LOWER', 'S', 1, 1, function (a) { return str(a[0]).toLowerCase(); });
def('PROPER', 'S', 1, 1, function (a) { return str(a[0]).toLowerCase().replace(/(^|[^A-Za-zÀ-ɏ])([A-Za-zÀ-ɏ])/g, function (m, p, c) { return p + c.toUpperCase(); }); });
def('TRIM', 'S', 1, 1, function (a) { return str(a[0]).replace(/ +/g, ' ').replace(/^ | $/g, ''); });
def('CLEAN', 'S', 1, 1, function (a) { return str(a[0]).replace(/[\u0000-\u001F]/g, ''); });
def('EXACT', 'SS', 2, 2, function (a) { return str(a[0]) === str(a[1]); });
def('LEFT', 'SS', 1, 2, function (a) { const n = a.length > 1 ? int(a[1]) : 1; if (n < 0) throw E.VALUE; return str(a[0]).slice(0, n); });
def('RIGHT', 'SS', 1, 2, function (a) { const n = a.length > 1 ? int(a[1]) : 1, s = str(a[0]); if (n < 0) throw E.VALUE; return n === 0 ? '' : s.slice(-n); });
def('MID', 'SSS', 3, 3, function (a) { const s = int(a[1]), n = int(a[2]); if (s < 1 || n < 0) throw E.VALUE; return str(a[0]).substr(s - 1, n); });
def('REPT', 'SS', 2, 2, function (a) { const t = str(a[0]), n = int(a[1]); if (n < 0 || t.length * n > LIM.str) throw E.VALUE; return t.repeat(n); });
def('CHAR', 'S', 1, 1, function (a) { const n = int(a[0]); if (n < 1 || n > 255) throw E.VALUE; return String.fromCharCode(n); });
def('CODE', 'S', 1, 1, function (a) { const s = str(a[0]); if (!s) throw E.VALUE; return s.charCodeAt(0); });
def('T', 'S', 1, 1, function (a) { return typeof a[0] === 'string' ? a[0] : ''; });
def('N', 'S', 1, 1, function (a) { const v = a[0]; return typeof v === 'number' ? v : v === true ? 1 : 0; });
def('VALUE', 'S', 1, 1, function (a) { const v = a[0]; if (typeof v === 'number') return v; const n = Fm.parseNumber(str(v)); if (n === null) throw E.VALUE; return n; });
def('TEXT', 'SS', 2, 2, function (a) {
  let v = a[0]; if (typeof v === 'string') { const n = Fm.parseNumber(v); if (n !== null) v = n; }
  return typeof v === 'number' ? cap(Fm.format(v, str(a[1]))) : str(v);
});
def('FIND', 'SSS', 2, 3, function (a) { const f = str(a[0]), w = str(a[1]), s = a.length > 2 ? int(a[2]) : 1; if (s < 1 || s > w.length + 1) throw E.VALUE; const i = w.indexOf(f, s - 1); if (i < 0) throw E.VALUE; return i + 1; });
def('SEARCH', 'SSS', 2, 3, function (a, x) {
  const f = str(a[0]).toLowerCase(), w = str(a[1]).toLowerCase(), s = a.length > 2 ? int(a[2]) : 1; if (s < 1 || s > w.length + 1) throw E.VALUE;
  if (!hasWild(f)) { const i = w.indexOf(f, s - 1); if (i < 0) throw E.VALUE; return i + 1; }
  const t = wildTokens(f); t.push([0]);                                  // the pattern may match only the start of what is left
  for (let i = s - 1; i <= w.length; i++) { if (wildFull(t, w.slice(i), x)) return i + 1; x.spend(1); }
  throw E.VALUE;
});
def('SUBSTITUTE', 'SSSS', 3, 4, function (a) {
  const t = str(a[0]), o = str(a[1]), r = str(a[2]); if (o === '') return t;
  if (a.length > 3) {
    const n = int(a[3]); if (n < 1) throw E.VALUE; let from = 0, k = 0;
    for (;;) { const i = t.indexOf(o, from); if (i < 0) return t; if (++k === n) return cap(t.slice(0, i) + r + t.slice(i + o.length)); from = i + o.length; }
  }
  let out = '', from = 0;
  for (;;) { const i = t.indexOf(o, from); if (i < 0) break; out += t.slice(from, i) + r; from = i + o.length; cap(out); }
  return cap(out + t.slice(from));
});
def('REPLACE', 'SSSS', 4, 4, function (a) { const t = str(a[0]), s = int(a[1]), n = int(a[2]); if (s < 1 || n < 0) throw E.VALUE; return cap(t.slice(0, s - 1) + str(a[3]) + t.slice(s - 1 + n)); });
function texts(a, x) { const out = []; a.forEach(function (v) { if (v instanceof Rng) eachVal(v, x, function (c) { if (c instanceof Err) throw c; out.push(c); }); else out.push(v); }); return out; }
def('CONCATENATE', 'S', 1, 64, function (a) { let s = ''; a.forEach(function (v) { s = cap(s + str(v)); }); return s; });
def('CONCAT', 'A', 1, 64, function (a, x) { let s = ''; texts(a, x).forEach(function (v) { s = cap(s + str(v)); }); return s; });
def('TEXTJOIN', 'SSA', 3, 64, function (a, x) {
  const d = str(a[0]), skip = bool(a[1]); let parts = texts(a.slice(2), x).map(function (v) { return v === null ? '' : str(v); });
  if (skip) parts = parts.filter(function (s) { return s !== ''; });
  return cap(parts.join(d));
});

/* ---------- information ---------- */
def('ISNUMBER', 'E', 1, 1, function (a) { return typeof a[0] === 'number'; });
def('ISTEXT', 'E', 1, 1, function (a) { return typeof a[0] === 'string'; });
def('ISNONTEXT', 'E', 1, 1, function (a) { return typeof a[0] !== 'string'; });
def('ISLOGICAL', 'E', 1, 1, function (a) { return typeof a[0] === 'boolean'; });
def('ISBLANK', 'E', 1, 1, function (a) { return a[0] === null; });
def('ISERROR', 'E', 1, 1, function (a) { return a[0] instanceof Err; });
def('ISERR', 'E', 1, 1, function (a) { return a[0] instanceof Err && a[0] !== E.NA; });
def('ISNA', 'E', 1, 1, function (a) { return a[0] === E.NA; });
def('ISEVEN', 'S', 1, 1, function (a) { return Math.trunc(num(a[0])) % 2 === 0; });
def('ISODD', 'S', 1, 1, function (a) { return Math.abs(Math.trunc(num(a[0]))) % 2 === 1; });
def('NA', 'S', 0, 0, function () { throw E.NA; });

/* ---------- dates ---------- */
const DAY = 86400000;
function serialOf(v) { const n = Math.floor(norm(num(v))); if (n < 0 || n > Fm.MAXSERIAL) throw E.NUM; return n; }
function ymd(v) { const d = Fm.serialToDate(serialOf(v)); return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), wd: d.getUTCDay() }; }
function makeDate(y, m, d) { const t = Date.UTC(y, m - 1, d); const s = Math.round((t - Fm.serialToDate(0).getTime()) / DAY); if (!isFinite(s) || s < 0 || s > Fm.MAXSERIAL) throw E.NUM; return s; }
def('TODAY', 'S', 0, 0, function (a, x) { const d = x.now(); return Fm.dateToSerial(d.getFullYear(), d.getMonth() + 1, d.getDate()); });
def('NOW', 'S', 0, 0, function (a, x) { const d = x.now(); return Fm.dateToSerial(d.getFullYear(), d.getMonth() + 1, d.getDate()) + (d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()) / 86400; });
def('DATE', 'SSS', 3, 3, function (a) { let y = int(a[0]); const m = int(a[1]), d = int(a[2]); if (y < 0 || y > 9999) throw E.NUM; if (y < 1900) y += 1900; return makeDate(y, m, d); });
def('YEAR', 'S', 1, 1, function (a) { return ymd(a[0]).y; });
def('MONTH', 'S', 1, 1, function (a) { return ymd(a[0]).m; });
def('DAY', 'S', 1, 1, function (a) { return ymd(a[0]).d; });
def('WEEKDAY', 'SS', 1, 2, function (a) { const wd = ymd(a[0]).wd, t = a.length > 1 ? int(a[1]) : 1; if (t === 1) return wd + 1; if (t === 2) return (wd + 6) % 7 + 1; if (t === 3) return (wd + 6) % 7; throw E.NUM; });
def('DAYS', 'SS', 2, 2, function (a) { return serialOf(a[0]) - serialOf(a[1]); });
function timeParts(v) { const f = norm(num(v)); if (f < 0) throw E.NUM; const t = Math.round((f - Math.floor(f)) * 86400); return { h: Math.floor(t / 3600) % 24, m: Math.floor(t / 60) % 60, s: t % 60 }; }
def('HOUR', 'S', 1, 1, function (a) { return timeParts(a[0]).h; });
def('MINUTE', 'S', 1, 1, function (a) { return timeParts(a[0]).m; });
def('SECOND', 'S', 1, 1, function (a) { return timeParts(a[0]).s; });
def('TIME', 'SSS', 3, 3, function (a) { const h = int(a[0]), m = int(a[1]), s = int(a[2]); if (h < 0 || m < 0 || s < 0 || h > 32767 || m > 32767 || s > 32767) throw E.NUM; return ((h * 3600 + m * 60 + s) % 86400) / 86400; });
def('DATEVALUE', 'S', 1, 1, function (a) { const r = Fm.parseEntry(str(a[0])); if (r.k === 'num' && Fm.isDateFormat(r.fmt)) return Math.floor(r.v); throw E.VALUE; });
function monthShift(v, months) { const p = ymd(v), t = p.y * 12 + (p.m - 1) + int(months); return { y: Math.floor(t / 12), m: (t % 12 + 12) % 12 + 1, d: p.d }; }
def('EDATE', 'SS', 2, 2, function (a) { const q = monthShift(a[0], a[1]), last = new Date(Date.UTC(q.y, q.m, 0)).getUTCDate(); return makeDate(q.y, q.m, Math.min(q.d, last)); });
def('EOMONTH', 'SS', 2, 2, function (a) { const q = monthShift(a[0], a[1]); return makeDate(q.y, q.m + 1, 0); });
def('DATEDIF', 'SSS', 3, 3, function (a) {
  const s = serialOf(a[0]), e = serialOf(a[1]), u = str(a[2]).toUpperCase(); if (s > e) throw E.NUM;
  const p = ymd(s), q = ymd(e), months = (q.y - p.y) * 12 + (q.m - p.m) - (q.d < p.d ? 1 : 0);
  if (u === 'D') return e - s; if (u === 'M') return months; if (u === 'Y') return Math.floor(months / 12); if (u === 'YM') return months % 12;
  throw E.NUM;
});

/* ---------- looking things up ---------- */
def('ROW', 'R', 0, 1, function (a, x) { return a.length ? a[0].r1 + 1 : x.r + 1; });
def('COLUMN', 'R', 0, 1, function (a, x) { return a.length ? a[0].c1 + 1 : x.c + 1; });
def('ROWS', 'R', 1, 1, function (a) { return a[0].r2 - a[0].r1 + 1; });
def('COLUMNS', 'R', 1, 1, function (a) { return a[0].c2 - a[0].c1 + 1; });
def('INDEX', 'RSS', 2, 3, function (a, x) {
  const r = a[0], d = dims(r); let i = int(a[1]), j = a.length > 2 ? int(a[2]) : null;
  if (j === null) { if (d.w === 1) { j = 1; } else if (d.h === 1) { j = i; i = 1; } else throw E.REF; }   // INDEX(table, row) with no column is not a single value
  if (i < 0 || j < 0 || i > d.h || j > d.w) throw E.REF;
  if (i === 0 && j === 0) return new Rng(r.si, r.c1, r.r1, r.c1 + d.w - 1, r.r1 + d.h - 1);
  if (i === 0) return new Rng(r.si, r.c1 + j - 1, r.r1, r.c1 + j - 1, r.r1 + d.h - 1);
  if (j === 0) return new Rng(r.si, r.c1, r.r1 + i - 1, r.c1 + d.w - 1, r.r1 + i - 1);
  return x.cell(r.si, r.c1 + j - 1, r.r1 + i - 1);
});
function vector(r, x) { const d = dims(r); if (d.h !== 1 && d.w !== 1) throw E.NA; const out = []; eachVal(r, x, function (v) { out.push(v); }); return out; }
def('MATCH', 'SRS', 2, 3, function (a, x) {
  const look = a[0], v = vector(a[1], x), t = a.length > 2 ? num(a[2]) : 1;
  if (t === 0) { for (let i = 0; i < v.length; i++) if (looseEq(v[i], look)) return i + 1; throw E.NA; }
  let best = -1;
  for (let i = 0; i < v.length; i++) {
    const c = v[i]; if (c === null || rank(c) !== rank(look)) continue;
    const k = cmp(c, look);
    if (t > 0) { if (k <= 0) best = i; else break; } else { if (k >= 0) best = i; else break; }
  }
  if (best < 0) throw E.NA; return best + 1;
});
function lookupTable(a, x, byRow) {
  const look = a[0], r = a[1], d = dims(r), idx = int(a[2]), exact = a.length > 3 && !bool(a[3]);
  if (idx < 1) throw E.VALUE; if (idx > (byRow ? d.h : d.w)) throw E.REF;
  const g = grid(r, x), n = byRow ? d.w : d.h; let found = -1;
  const key = function (i) { return byRow ? g[0][i] : g[i][0]; };
  if (exact) { for (let i = 0; i < n; i++) if (looseEq(key(i), look)) { found = i; break; } }
  else for (let i = 0; i < n; i++) { const c = key(i); if (c === null || rank(c) !== rank(look)) continue; if (cmp(c, look) <= 0) found = i; else break; }
  if (found < 0) throw E.NA;
  const v = byRow ? g[idx - 1][found] : g[found][idx - 1]; return v === undefined ? null : v;
}
def('VLOOKUP', 'SRSS', 3, 4, function (a, x) { return lookupTable(a, x, false); });
def('HLOOKUP', 'SRSS', 3, 4, function (a, x) { return lookupTable(a, x, true); });

/* ---------- checking a formula when it is typed ---------- */
function describeFn(name) { const d = FUNCS[name] || LAZY[name]; return d ? { min: d.min, max: d.max } : null; }
const PAIRS = { IFS: 0, COUNTIFS: 0, SUMIFS: 1, AVERAGEIFS: 1, MAXIFS: 1, MINIFS: 1 };      // how many values are left over when the arguments are counted in twos
function validate(ast) {
  let msg = null;
  (function walk(n) {
    if (msg || !n) return;
    if (n.t === 'fn') {
      const d = describeFn(n.name);
      if (d && (n.args.length < d.min || n.args.length > d.max)) msg = n.name + (n.args.length < d.min ? ' needs at least ' + d.min + ' value' + (d.min === 1 ? '' : 's') + '.' : ' can take at most ' + d.max + ' value' + (d.max === 1 ? '' : 's') + '.');
      else if (PAIRS[n.name] !== undefined && n.args.length % 2 !== PAIRS[n.name]) msg = n.name + (PAIRS[n.name] ? ' needs a range first, then pairs of range and condition.' : ' needs its values in pairs.');
      n.args.forEach(walk);
    } else if (n.t === 'bin') { walk(n.a); walk(n.b); } else if (n.t === 'un' || n.t === 'pct') walk(n.a);
  })(ast);
  return msg;
}
/* work out a formula. x: { si, c, r, cell(si, c, r), sheetIndex(name), spend(n), now() } */
function evaluate(ast, x) {
  try { let v = ev(ast, x); if (v instanceof Rng) v = deref(v, x); return v === null ? 0 : v; }
  catch (e) {
    if (e instanceof Err) return e;
    if (e instanceof RangeError) return E.LIMIT;
    Calc.bug = e; return E.VALUE;
  }
}
const XLFN = { 'XOR': 1, 'CONCAT': 1, 'TEXTJOIN': 1, 'IFS': 1, 'SWITCH': 1, 'MAXIFS': 1, 'MINIFS': 1, 'IFNA': 1, 'DAYS': 1, 'RANK.EQ': 1, 'STDEV.S': 1, 'STDEV.P': 1, 'VAR.S': 1, 'VAR.P': 1, 'MODE.SNGL': 1 };
CC.sheetcalc = { Err: Err, E: E, Rng: Rng, evaluate: evaluate, validate: validate, numText: numText, cmp: cmp, norm: norm, hasFunction: function (n) { return !!(FUNCS[n] || LAZY[n]); },
  functionNames: function () { return Object.keys(FUNCS).concat(Object.keys(LAZY)).sort(); }, XLFN: XLFN, state: Calc, wild: { tokens: wildTokens, full: wildFull } };
})();
