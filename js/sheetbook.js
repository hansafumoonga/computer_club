/* sheetbook.js - a workbook: sheets of cells, cell styles, and everything that changes them (typing, copying, filling, sorting,
   inserting and deleting rows and columns, renaming sheets). Formulas are worked out here, on request, with sheetcalc.js.
   Saving writes plain data; loading checks every single value, so a damaged or hand-edited file cannot break the page.
   Pure logic: it never touches the page. */
(function () {
'use strict';
const CC = window.CC = window.CC || {};
const P = CC.sheetparse, Fm = CC.sheetfmt, K = CC.sheetcalc, LIM = P.LIM, E = K.E, Err = K.Err;
const BL = { styles: 400, budget: 4000000, depth: 250, json: 2000000, cf: 60, charts: 12, merges: 400, colW: [24, 600], rowH: [14, 400], cw: 88, rh: 24 };
const FONTS = ['Calibri', 'Arial', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia', 'Comic Sans MS', 'Trebuchet MS', 'Tahoma'];
const COLOR = /^#[0-9a-fA-F]{6}$/;
const CFOPS = ['gt', 'lt', 'ge', 'le', 'eq', 'ne', 'between', 'text'];
const key = function (r, c) { return r * 64 + c; };                  // 52 columns fit in 64, so a cell's place is one number

function normStyle(o) {
  const n = {}; if (!o || typeof o !== 'object') return n;
  if (o.b) n.b = 1; if (o.i) n.i = 1; if (o.u) n.u = 1; if (o.s) n.s = 1;
  if (typeof o.col === 'string' && COLOR.test(o.col)) n.col = o.col.toLowerCase();
  if (typeof o.bg === 'string' && COLOR.test(o.bg)) n.bg = o.bg.toLowerCase();
  if (o.al === 'l' || o.al === 'c' || o.al === 'r') n.al = o.al;
  if (o.va === 't' || o.va === 'm') n.va = o.va;
  if (o.wr) n.wr = 1;
  if (typeof o.fmt === 'string' && o.fmt !== '' && !/^general$/i.test(o.fmt) && o.fmt.length <= 80 && !/[\u0000-\u001F\u007F]/.test(o.fmt)) n.fmt = o.fmt;
  const sz = Number(o.sz); if (Number.isInteger(sz) && sz >= 6 && sz <= 72 && sz !== 11) n.sz = sz;
  if (typeof o.ff === 'string' && FONTS.indexOf(o.ff) > 0) n.ff = o.ff;
  if (typeof o.bd === 'string') { const set = ['t', 'r', 'b', 'l'].filter(function (ch) { return o.bd.indexOf(ch) >= 0; }).join(''); if (set) n.bd = set; }
  return n;
}
function cleanText(s) { return String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F￾￿]/g, ''); }
function newSheet(name) { return { name: name, cells: new Map(), cw: {}, rh: {}, merges: [], freeze: { r: 0, c: 0 }, cf: [], charts: [] }; }
function isEmpty(cell) { return cell.v === undefined && cell.f === undefined; }
const DATE_FORMATS = { TODAY: 'dd/mm/yyyy', NOW: 'dd/mm/yyyy hh:mm', DATE: 'dd/mm/yyyy', EDATE: 'dd/mm/yyyy', EOMONTH: 'dd/mm/yyyy', DATEVALUE: 'dd/mm/yyyy', TIME: 'hh:mm' };
function leadingFormat(ast) { let n = ast; while (n && n.t === 'bin' && (n.op === '+' || n.op === '-') && n.b && n.b.t === 'num') n = n.a; return n && n.t === 'fn' ? DATE_FORMATS[n.name] : undefined; }

function Book() {
  this.sheets = [newSheet('Sheet1')]; this.active = 0;
  this.styles = [{}]; this.styleKeys = Object.create(null); this.styleKeys['{}'] = 0;
  this.ver = 1; this.budget = BL.budget; this.depth = 0;
}
Book.prototype.now = function () { return new Date(); };
Book.prototype.touch = function () { this.ver++; this.budget = BL.budget; };          // something changed: every worked-out formula result is out of date
Book.prototype.spend = function (n) { this.budget -= n; if (this.budget < 0) throw E.LIMIT; };
Book.prototype.sheetIndex = function (name) { const l = String(name).toLowerCase(); for (let i = 0; i < this.sheets.length; i++) if (this.sheets[i].name.toLowerCase() === l) return i; return -1; };

/* ---------- styles ---------- */
Book.prototype.intern = function (st) {
  const n = normStyle(st), k = JSON.stringify(n); let id = this.styleKeys[k];
  if (id === undefined) { if (this.styles.length >= BL.styles) return -1; id = this.styles.length; this.styles.push(n); this.styleKeys[k] = id; }
  return id;
};
Book.prototype.styleAt = function (si, r, c) { const cell = this.sheets[si].cells.get(key(r, c)); return cell ? this.styles[cell.s] : this.styles[0]; };
/* patch: an object of changes ({ b: 1 }, { fmt: '0.00' }, { b: 0 } to remove) or a function (oldStyle) -> changes. Returns false if there are too many different styles. */
Book.prototype.applyStyle = function (si, r1, c1, r2, c2, patch) {
  const sh = this.sheets[si], memo = Object.create(null); let ok = true;
  r1 = Math.max(0, r1); c1 = Math.max(0, c1); r2 = Math.min(LIM.rows - 1, r2); c2 = Math.min(LIM.cols - 1, c2);
  if ((r2 - r1 + 1) * (c2 - c1 + 1) > LIM.cells) return false;
  for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) {
    const k = key(r, c); let cell = sh.cells.get(k);
    const oldId = cell ? cell.s : 0, p = typeof patch === 'function' ? patch(this.styles[oldId], r, c) : patch, mk = oldId + '|' + (typeof patch === 'function' ? JSON.stringify(p) : '');
    let id = memo[mk];
    if (id === undefined) { id = this.intern(Object.assign({}, this.styles[oldId], p)); memo[mk] = id; }
    if (id < 0) { ok = false; continue; }
    if (id === oldId) continue;
    if (!cell) { if (id === 0) continue; cell = { s: 0 }; sh.cells.set(k, cell); }
    cell.s = id; if (id === 0 && isEmpty(cell)) sh.cells.delete(k);
  }
  this.touch(); return ok;
};
/* border: 'all' | 'none' | 'outside' | 'top' | 'bottom' | 'left' | 'right' */
Book.prototype.applyBorder = function (si, r1, c1, r2, c2, mode) {
  return this.applyStyle(si, r1, c1, r2, c2, function (old, r, c) {
    const have = old.bd || ''; let add = '';
    if (mode === 'none') return { bd: '' };
    if (mode === 'all') add = 'trbl';
    else if (mode === 'outside') { if (r === r1) add += 't'; if (r === r2) add += 'b'; if (c === c1) add += 'l'; if (c === c2) add += 'r'; }
    else if (mode === 'top') { if (r === r1) add = 't'; } else if (mode === 'bottom') { if (r === r2) add = 'b'; } else if (mode === 'left') { if (c === c1) add = 'l'; } else if (mode === 'right') { if (c === c2) add = 'r'; }
    return { bd: have + add };
  });
};

/* ---------- reading cells ---------- */
Book.prototype.getCell = function (si, r, c) { return this.sheets[si].cells.get(key(r, c)) || null; };
Book.prototype.ctx = function (si, c, r) {
  const b = this;
  return { si: si, c: c, r: r, cell: function (s, cc, rr) { return b.get(s, rr, cc); }, sheetIndex: function (n) { return b.sheetIndex(n); }, spend: function (n) { b.spend(n); }, now: function () { return b.now(); } };
};
/* the value of a cell: a number, text, true/false, null (empty) or an error object. Formulas are worked out once for each change. */
Book.prototype.get = function (si, r, c) {
  if (c < 0 || r < 0 || c >= LIM.cols || r >= LIM.rows) return null;
  const sh = this.sheets[si]; if (!sh) return E.REF;
  const cell = sh.cells.get(key(r, c)); if (!cell) return null;
  if (cell.f === undefined) return cell.v === undefined ? null : cell.v;
  if (cell.ver === this.ver) return cell.cv;
  if (cell.busy) return E.CIRC;
  if (this.depth >= BL.depth) return E.LIMIT;
  cell.busy = true; this.depth++;
  let v;
  try {
    if (cell.ast === undefined) { const p = P.parse(cell.f); cell.ast = p.ast || null; }
    v = cell.ast ? K.evaluate(cell.ast, this.ctx(si, c, r)) : E.NAME;
  } finally { cell.busy = false; this.depth--; }
  cell.cv = v; cell.ver = this.ver; return v;
};
Book.prototype.calcAll = function () {
  for (let si = 0; si < this.sheets.length; si++) {
    const keys = Array.from(this.sheets[si].cells.keys()).sort(function (a, b) { return a - b; });
    for (let i = 0; i < keys.length; i++) this.get(si, keys[i] >> 6, keys[i] & 63);
  }
};
Book.prototype.display = function (si, r, c) { const v = this.get(si, r, c); return v instanceof Err ? v.code : Fm.format(v, this.styleAt(si, r, c).fmt); };
/* the text shown in the formula bar and when editing a cell */
Book.prototype.editText = function (si, r, c) {
  const cell = this.getCell(si, r, c); if (!cell || isEmpty(cell)) return '';
  if (cell.f !== undefined) return cell.f;
  const v = cell.v, fmt = this.styles[cell.s].fmt;
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (typeof v === 'number') {
    if (fmt && Fm.isDateFormat(fmt)) { return /h|s/.test(fmt.replace(/"[^"]*"/g, '')) && Math.floor(v) !== v ? Fm.format(v, 'dd/mm/yyyy hh:mm:ss') : Fm.format(v, 'dd/mm/yyyy'); }
    if (fmt && /%/.test(fmt.replace(/"[^"]*"/g, ''))) return String(Fm.roundDec(v * 100, 13)) + '%';
    return K.numText(v);
  }
  const p = Fm.parseEntry(v, fmt); return p.k === 'text' && p.v === v ? v : "'" + v;   // text that could be mistaken for a number or a formula is shown with a leading '
};
Book.prototype.isEmptyAt = function (si, r, c) { const cell = this.getCell(si, r, c); return !cell || isEmpty(cell); };
Book.prototype.usedRange = function (si) {
  let r2 = -1, c2 = -1; this.sheets[si].cells.forEach(function (cell, k) { if (!isEmpty(cell)) { const r = k >> 6, c = k & 63; if (r > r2) r2 = r; if (c > c2) c2 = c; } });
  return { r2: r2, c2: c2 };
};

/* ---------- writing cells ---------- */
Book.prototype.ensure = function (si, r, c) { const sh = this.sheets[si], k = key(r, c); let cell = sh.cells.get(k); if (!cell) { cell = { s: 0 }; sh.cells.set(k, cell); } return cell; };
Book.prototype.tidy = function (si, r, c) { const sh = this.sheets[si], k = key(r, c), cell = sh.cells.get(k); if (cell && isEmpty(cell) && cell.s === 0) sh.cells.delete(k); };
Book.prototype.inGrid = function (r, c) { return Number.isInteger(r) && Number.isInteger(c) && r >= 0 && c >= 0 && r < LIM.rows && c < LIM.cols; };
/* what a person types into a cell. Returns { ok: true } or { ok: false, msg } (nothing changes if the formula has a mistake). */
Book.prototype.setEntry = function (si, r, c, text) {
  if (!this.inGrid(r, c) || !this.sheets[si]) return { ok: false, msg: 'That cell is outside the sheet.' };
  text = cleanText(text);
  const cur = this.getCell(si, r, c), fmt = cur ? this.styles[cur.s].fmt : undefined, pr = Fm.parseEntry(text, fmt);
  if (text.length > LIM.str) return { ok: false, msg: 'That is too much text for one cell.' };
  if (pr.k === 'formula') {
    const p = P.parse(pr.v); if (p.error) return { ok: false, msg: p.error };
    const bad = K.validate(p.ast); if (bad) return { ok: false, msg: bad };
    const cell = this.ensure(si, r, c); cell.f = pr.v; cell.ast = p.ast; delete cell.v;
    const lf = leadingFormat(p.ast); if (lf && !this.styles[cell.s].fmt) { const id = this.intern(Object.assign({}, this.styles[cell.s], { fmt: lf })); if (id >= 0) cell.s = id; }      // =TODAY() shows a date, not a number
  } else if (pr.k === 'blank') {
    if (cur) { delete cur.v; delete cur.f; delete cur.ast; this.tidy(si, r, c); }
  } else {
    const cell = this.ensure(si, r, c); cell.v = pr.v; delete cell.f; delete cell.ast;
    if (pr.fmt && !fmt) { const id = this.intern(Object.assign({}, this.styles[cell.s], { fmt: pr.fmt })); if (id >= 0) cell.s = id; }   // typing 12% or 31/12/2026 sets a matching format
  }
  this.touch(); return { ok: true };
};
/* put content straight into a cell: { v } or { f } (used by paste, fill and sort) */
Book.prototype.putContent = function (si, r, c, content, styleId) {
  const sh = this.sheets[si], k = key(r, c); let cell = sh.cells.get(k);
  if (!content && !styleId) { if (cell) sh.cells.delete(k); return; }
  if (!cell) { cell = { s: 0 }; sh.cells.set(k, cell); }
  delete cell.v; delete cell.f; delete cell.ast; delete cell.cv; delete cell.ver;
  if (content && content.f !== undefined) cell.f = content.f; else if (content && content.v !== undefined && content.v !== null) cell.v = content.v;
  if (styleId !== undefined) cell.s = styleId;
  if (isEmpty(cell) && cell.s === 0) sh.cells.delete(k);
};
Book.prototype.clearContents = function (si, r1, c1, r2, c2) {
  const sh = this.sheets[si];
  for (let r = Math.max(0, r1); r <= Math.min(r2, LIM.rows - 1); r++) for (let c = Math.max(0, c1); c <= Math.min(c2, LIM.cols - 1); c++) {
    const cell = sh.cells.get(key(r, c)); if (!cell) continue; delete cell.v; delete cell.f; delete cell.ast; this.tidy(si, r, c);
  }
  this.touch();
};
Book.prototype.clearAll = function (si, r1, c1, r2, c2) {
  const sh = this.sheets[si];
  for (let r = Math.max(0, r1); r <= Math.min(r2, LIM.rows - 1); r++) for (let c = Math.max(0, c1); c <= Math.min(c2, LIM.cols - 1); c++) sh.cells.delete(key(r, c));
  this.touch();
};

/* ---------- rewriting formulas after a structural change ---------- */
Book.prototype.rewriteAll = function (op, skip) {
  const self = this;
  this.sheets.forEach(function (sh, si) {
    sh.cells.forEach(function (cell, k) {
      if (cell.f === undefined || (skip && skip(si, k >> 6, k & 63))) return;
      const nf = P.rewrite(cell.f, sh.name, op); if (nf !== cell.f) { cell.f = nf; delete cell.ast; }
    });
  });
  self.touch();
};
function boxAdjust(b, op) {                                        // a rectangle (merged cells, a formatting rule) after rows or columns are added or removed; null if it vanishes
  const r = op.axis === 'r', lo = r ? 'r1' : 'c1', hi = r ? 'r2' : 'c2', o = Object.assign({}, b);
  if (op.type === 'insert') { if (b[lo] >= op.at) { o[lo] += op.count; o[hi] += op.count; } else if (b[hi] >= op.at) o[hi] += op.count; return o; }
  const end = op.at + op.count - 1; if (b[hi] < op.at) return o; if (b[lo] > end) { o[lo] -= op.count; o[hi] -= op.count; return o; }
  const na = b[lo] < op.at ? b[lo] : op.at, nb = b[hi] > end ? b[hi] - op.count : op.at - 1; if (nb < na) return null; o[lo] = na; o[hi] = nb; return o;
}
function shiftMap(map, op) {                                       // column widths / row heights
  const out = {}; Object.keys(map).forEach(function (k) {
    const i = Number(k), end = op.at + op.count - 1;
    if (op.type === 'insert') out[i >= op.at ? i + op.count : i] = map[k]; else if (i < op.at) out[i] = map[k]; else if (i > end) out[i - op.count] = map[k];
  }); return out;
}
Book.prototype.structure = function (si, axis, type, at, count) {
  const sh = this.sheets[si], isRow = axis === 'r', max = isRow ? LIM.rows : LIM.cols;
  count = Math.max(1, Math.min(count | 0, max)); at = Math.max(0, Math.min(at | 0, max - 1));
  if (type === 'insert') {
    let blocked = false; sh.cells.forEach(function (cell, k) { const i = isRow ? k >> 6 : k & 63; if (i >= max - count && !isEmpty(cell)) blocked = true; });
    if (blocked) return { ok: false, msg: 'Some of the cells at the ' + (isRow ? 'bottom' : 'right') + ' of the sheet would be pushed off the sheet.' };
  } else if (at + count > max) count = max - at;
  const op = { type: type, sheet: sh.name, axis: axis, at: at, count: count }, m = new Map(), end = at + count - 1;
  sh.cells.forEach(function (cell, k) {
    const r = k >> 6, c = k & 63, i = isRow ? r : c; let ni = i;
    if (type === 'insert') ni = i >= at ? i + count : i; else { if (i >= at && i <= end) return; if (i > end) ni = i - count; }
    if (ni >= max) return; m.set(isRow ? key(ni, c) : key(r, ni), cell);
  });
  sh.cells = m;
  if (isRow) sh.rh = shiftMap(sh.rh, op); else sh.cw = shiftMap(sh.cw, op);
  sh.merges = sh.merges.map(function (b) { return boxAdjust(b, op); }).filter(Boolean);
  sh.cf = sh.cf.map(function (b) { return boxAdjust(b, op); }).filter(Boolean);
  sh.charts = sh.charts.map(function (b) { return boxAdjust(b, op); }).filter(Boolean);                // a chart follows its numbers, and goes if they are all deleted
  const fk = isRow ? 'r' : 'c', fz = sh.freeze;                       // the number of frozen rows or columns follows the change
  if (type === 'insert') { if (at < fz[fk]) fz[fk] += count; } else fz[fk] -= Math.max(0, Math.min(end, fz[fk] - 1) - at + 1);
  this.rewriteAll(op); return { ok: true };
};
Book.prototype.insertRows = function (si, at, n) { return this.structure(si, 'r', 'insert', at, n); };
Book.prototype.deleteRows = function (si, at, n) { return this.structure(si, 'r', 'delete', at, n); };
Book.prototype.insertCols = function (si, at, n) { return this.structure(si, 'c', 'insert', at, n); };
Book.prototype.deleteCols = function (si, at, n) { return this.structure(si, 'c', 'delete', at, n); };

/* ---------- sheets ---------- */
Book.prototype.uniqueName = function (want, except) {
  let base = P.cleanSheetName(want) || 'Sheet', name = base, n = 2;
  const taken = function (b, nm) { const i = b.sheetIndex(nm); return i >= 0 && i !== except; };
  while (taken(this, name)) { const suffix = ' (' + n++ + ')'; name = base.slice(0, LIM.name - suffix.length) + suffix; }
  return name;
};
Book.prototype.addSheet = function (name, at) {
  if (this.sheets.length >= LIM.sheets) return { ok: false, msg: 'A workbook can have up to ' + LIM.sheets + ' sheets.' };
  let nm = name; if (!nm) { let n = this.sheets.length + 1; while (this.sheetIndex('Sheet' + n) >= 0) n++; nm = 'Sheet' + n; }
  const sh = newSheet(this.uniqueName(nm, -1)), i = at === undefined ? this.sheets.length : Math.max(0, Math.min(at, this.sheets.length));
  this.sheets.splice(i, 0, sh); if (this.active >= i && this.sheets.length > 1) this.active = i; this.touch(); return { ok: true, index: i };
};
Book.prototype.renameSheet = function (si, name) {
  const clean = P.cleanSheetName(name); if (!clean) return { ok: false, msg: 'A sheet needs a name.' };
  const other = this.sheetIndex(clean); if (other >= 0 && other !== si) return { ok: false, msg: 'There is already a sheet called ' + clean + '.' };
  const old = this.sheets[si].name; if (old === clean) return { ok: true };
  this.rewriteAll({ type: 'rename', from: old, to: clean }); this.sheets[si].name = clean; this.touch(); return { ok: true, name: clean };
};
Book.prototype.deleteSheet = function (si) {
  if (this.sheets.length < 2) return { ok: false, msg: 'A workbook needs at least one sheet.' };
  const name = this.sheets[si].name; this.sheets.splice(si, 1);
  this.rewriteAll({ type: 'dropSheet', name: name }); if (this.active >= this.sheets.length) this.active = this.sheets.length - 1; else if (this.active > si) this.active--;
  this.touch(); return { ok: true };
};
Book.prototype.moveSheet = function (from, to) {
  to = Math.max(0, Math.min(to, this.sheets.length - 1)); if (from === to) return;
  const act = this.sheets[this.active], sh = this.sheets.splice(from, 1)[0]; this.sheets.splice(to, 0, sh); this.active = this.sheets.indexOf(act); this.touch();
};
Book.prototype.duplicateSheet = function (si) {
  if (this.sheets.length >= LIM.sheets) return { ok: false, msg: 'A workbook can have up to ' + LIM.sheets + ' sheets.' };
  const src = this.sheets[si], copy = newSheet(this.uniqueName(src.name + ' (copy)', -1));
  src.cells.forEach(function (cell, k) { const n = { s: cell.s }; if (cell.f !== undefined) n.f = cell.f; else if (cell.v !== undefined) n.v = cell.v; copy.cells.set(k, n); });
  copy.cw = Object.assign({}, src.cw); copy.rh = Object.assign({}, src.rh); copy.merges = src.merges.map(function (b) { return Object.assign({}, b); });
  copy.cf = src.cf.map(function (b) { return Object.assign({}, b); }); copy.charts = src.charts.map(function (b) { return Object.assign({}, b); }); copy.freeze = { r: src.freeze.r, c: src.freeze.c };
  this.sheets.splice(si + 1, 0, copy); this.touch(); return { ok: true, index: si + 1 };
};

/* ---------- copy, paste, move ---------- */
/* a copy of the cells in a block, kept apart from the sheet */
Book.prototype.copy = function (si, r1, c1, r2, c2) {
  const sh = this.sheets[si]; r2 = Math.min(r2, LIM.rows - 1); c2 = Math.min(c2, LIM.cols - 1);
  const rows = []; let count = 0;
  for (let r = r1; r <= r2; r++) {
    const row = []; for (let c = c1; c <= c2; c++) {
      const cell = sh.cells.get(key(r, c));
      if (cell) { count++; const val = cell.f !== undefined ? this.get(si, r, c) : undefined; row.push({ s: this.styles[cell.s], v: cell.v, f: cell.f, val: val instanceof Err ? undefined : val }); } else row.push(null);
    }
    rows.push(row);
  }
  return { sheet: sh.name, r1: r1, c1: c1, h: r2 - r1 + 1, w: c2 - c1 + 1, rows: rows, count: count };
};
/* the text placed on the computer's clipboard: tab between cells, new line between rows (what is shown, as in a real spreadsheet) */
Book.prototype.clipText = function (si, r1, c1, r2, c2) {
  const out = [];
  for (let r = r1; r <= Math.min(r2, LIM.rows - 1); r++) { const row = []; for (let c = c1; c <= Math.min(c2, LIM.cols - 1); c++) row.push(this.display(si, r, c).replace(/[\t\r\n]+/g, ' ')); out.push(row.join('\t')); }
  return out.join('\n');
};
/* mode: 'all' | 'values' | 'formats' | 'formulas'  - returns the number of cells written, or -1 when there are too many styles */
Book.prototype.paste = function (si, r, c, clip, mode) {
  mode = mode || 'all'; let bad = false;
  for (let i = 0; i < clip.h; i++) for (let j = 0; j < clip.w; j++) {
    const tr = r + i, tc = c + j; if (!this.inGrid(tr, tc)) continue;
    const src = clip.rows[i][j], cur = this.getCell(si, tr, tc);
    if (mode === 'formats') {                                       // only the look is pasted; what the cell holds stays
      const fid = src ? this.intern(src.s) : 0; if (fid < 0) { bad = true; continue; }
      this.putContent(si, tr, tc, cur && !isEmpty(cur) ? (cur.f !== undefined ? { f: cur.f } : { v: cur.v }) : null, fid); continue;
    }
    let content = null;
    if (src) {
      if (src.f !== undefined) content = mode === 'values' ? { v: src.val } : { f: P.shiftFormula(src.f, tc - (clip.c1 + j), tr - (clip.r1 + i)) };   // "values" keeps what the formula showed
      else if (src.v !== undefined) content = { v: src.v };
    }
    let id;
    if (mode === 'all') { id = src ? this.intern(src.s) : 0; if (id < 0) { bad = true; id = 0; } } else id = cur ? cur.s : 0;
    this.putContent(si, tr, tc, content, id);
  }
  this.touch(); return bad ? -1 : clip.h * clip.w;
};
/* paste text from outside (tab or comma separated). Formulas typed as text become formulas, as in a real spreadsheet. Returns the cells written. */
Book.prototype.pasteText = function (si, r, c, text) {
  text = cleanText(text).replace(/\r\n?/g, '\n').replace(/\n+$/, '');
  const delim = text.indexOf('\t') >= 0 ? '\t' : ',';
  const parsed = text.indexOf('\n') < 0 && text.indexOf(delim) < 0 ? { rows: [[text]] } : CC.docfile ? CC.docfile.parseDelimited(text, delim, { rows: LIM.rows, cols: LIM.cols }) : { rows: text.split('\n').map(function (l) { return l.split(delim); }) };
  if (parsed.error) return 0;
  let n = 0;
  parsed.rows.forEach(function (row, i) { row.forEach(function (t, j) { if (this.inGrid(r + i, c + j) && this.setEntry(si, r + i, c + j, t).ok) n++; }, this); }, this);
  this.touch(); return n;
};
/* cut and paste inside one sheet: the cells move, formulas that point at them follow */
Book.prototype.move = function (si, r1, c1, r2, c2, tr, tc) {
  const sh = this.sheets[si], dr = tr - r1, dc = tc - c1; r2 = Math.min(r2, LIM.rows - 1); c2 = Math.min(c2, LIM.cols - 1);
  if (!this.inGrid(tr, tc) || !this.inGrid(r2 + dr, c2 + dc) || (dr === 0 && dc === 0)) return { ok: false };
  const op = { type: 'move', sheet: sh.name, dest: sh.name, r1: r1, c1: c1, r2: r2, c2: c2, dr: dr, dc: dc }, moved = [];
  for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) { const k = key(r, c), cell = sh.cells.get(k); if (cell) { moved.push([r + dr, c + dc, cell]); sh.cells.delete(k); } }
  for (let r = r1 + dr; r <= r2 + dr; r++) for (let c = c1 + dc; c <= c2 + dc; c++) sh.cells.delete(key(r, c));
  moved.forEach(function (m) { sh.cells.set(key(m[0], m[1]), m[2]); });
  this.rewriteAll(op); return { ok: true };
};

/* ---------- filling a series (the small square at the corner of a selection) ---------- */
const SERIES = [['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'], ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
  ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'], ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']];
function recase(word, like) { return like === like.toUpperCase() && like.length > 1 ? word.toUpperCase() : like.charAt(0) === like.charAt(0).toUpperCase() && like.charAt(0) !== like.charAt(0).toLowerCase() ? word.charAt(0).toUpperCase() + word.slice(1) : word; }
function textSeries(vals, count) {                                   // vals: the text in the source cells -> the next `count` texts, or null if they do not form a series
  if (vals.length === 1) {
    const w = vals[0].toLowerCase();
    for (let s = 0; s < SERIES.length; s++) { const i = SERIES[s].indexOf(w); if (i >= 0) { const out = []; for (let k = 1; k <= count; k++) out.push(recase(SERIES[s][(i + k) % SERIES[s].length], vals[0])); return out; } }
  }
  const m = vals.map(function (v) { return /^([\s\S]*?)(\d+)$/.exec(v); });
  if (m.every(Boolean) && m.every(function (x) { return x[1] === m[0][1]; })) {
    const nums = m.map(function (x) { return Number(x[2]); }), width = m[0][2].length, pad = m[0][2].charAt(0) === '0' && m.every(function (x) { return x[2].length === width; });
    const step = nums.length > 1 ? nums[1] - nums[0] : 1;
    if (nums.every(function (n, i) { return i === 0 || n - nums[i - 1] === step; })) {
      const out = []; for (let k = 1; k <= count; k++) { let t = String(nums[nums.length - 1] + step * k); if (t.charAt(0) === '-') return null; if (pad) t = t.padStart(width, '0'); out.push(m[0][1] + t); } return out;
    }
  }
  return null;
}
function lineTrend(nums, count) {                                    // a straight-line continuation of numbers
  const n = nums.length; let mx = 0, my = 0; for (let i = 0; i < n; i++) { mx += i; my += nums[i]; } mx /= n; my /= n;
  let sxy = 0, sxx = 0; for (let i = 0; i < n; i++) { sxy += (i - mx) * (nums[i] - my); sxx += (i - mx) * (i - mx); }
  const slope = sxx ? sxy / sxx : 0, out = []; for (let k = 0; k < count; k++) out.push(Fm.roundDec(my + slope * (n + k - mx), 12)); return out;
}
/* fill from the source block to the end row/column. dir: 'down' | 'up' | 'right' | 'left'; to: the last row (down/up) or column (right/left) to fill */
Book.prototype.fill = function (si, r1, c1, r2, c2, dir, to) {
  const vertical = dir === 'down' || dir === 'up', forward = dir === 'down' || dir === 'right';
  const L = vertical ? r2 - r1 + 1 : c2 - c1 + 1, count = forward ? to - (vertical ? r2 : c2) : (vertical ? r1 : c1) - to;
  if (count <= 0 || count * (vertical ? c2 - c1 + 1 : r2 - r1 + 1) > LIM.cells) return { ok: false };
  const lines = vertical ? c2 - c1 + 1 : r2 - r1 + 1;
  for (let line = 0; line < lines; line++) {
    const at = function (i) { return vertical ? [r1 + i, c1 + line] : [r1 + line, c1 + i]; };       // the i-th source cell along the fill direction
    const src = []; for (let i = 0; i < L; i++) { const p = at(i); src.push(this.getCell(si, p[0], p[1])); }
    const pattern = forward ? src : src.slice().reverse();                                           // fill up/left as if the source were read the other way
    const consts = pattern.every(function (cell) { return cell && cell.f === undefined && cell.v !== undefined; });
    let series = null;
    if (consts) {
      const vals = pattern.map(function (cell) { return cell.v; });
      const dateFmt = pattern.every(function (cell) { const f = this.styles[cell.s].fmt; return f && Fm.isDateFormat(f); }, this);
      if (vals.every(function (v) { return typeof v === 'number'; })) {
        if (vals.length >= 2) series = lineTrend(vals, count); else if (dateFmt) series = Array.from({ length: count }, function (_, k) { return vals[0] + k + 1; });
      } else if (vals.every(function (v) { return typeof v === 'string'; })) series = textSeries(vals, count);
    }
    for (let k = 0; k < count; k++) {
      const pos = vertical ? [forward ? r2 + 1 + k : r1 - 1 - k, c1 + line] : [r1 + line, forward ? c2 + 1 + k : c1 - 1 - k];
      if (!this.inGrid(pos[0], pos[1])) continue;
      const base = pattern[k % L], style = base ? base.s : 0;
      let content = null;
      if (series) content = { v: series[k] };
      else if (base && base.f !== undefined) {
        const srcPos = at(forward ? k % L : L - 1 - (k % L));
        content = { f: P.shiftFormula(base.f, pos[1] - srcPos[1], pos[0] - srcPos[0]) };
      } else if (base && base.v !== undefined) content = { v: base.v };
      this.putContent(si, pos[0], pos[1], content, style);
    }
  }
  this.touch(); return { ok: true };
};

/* ---------- sorting ---------- */
Book.prototype.sortRange = function (si, r1, c1, r2, c2, col, asc) {
  const sh = this.sheets[si]; r2 = Math.min(r2, LIM.rows - 1); c2 = Math.min(c2, LIM.cols - 1);
  if (col < c1 || col > c2 || r2 <= r1) return { ok: false, msg: 'Select at least two rows to sort.' };
  const hit = sh.merges.some(function (b) { return b.r1 <= r2 && b.r2 >= r1 && b.c1 <= c2 && b.c2 >= c1; });
  if (hit) return { ok: false, msg: 'Merged cells cannot be sorted. Unmerge them first.' };
  const items = [];
  for (let r = r1; r <= r2; r++) { const v = this.get(si, r, col), row = []; for (let c = c1; c <= c2; c++) { const cell = sh.cells.get(key(r, c)); row.push(cell ? { s: cell.s, v: cell.v, f: cell.f } : null); } items.push({ r: r, v: v, row: row }); }
  const order = function (v) { return v === null || v === '' ? 4 : v instanceof Err ? 3 : typeof v === 'number' ? 0 : typeof v === 'string' ? 1 : 2; };
  items.sort(function (a, b) {
    const oa = order(a.v), ob = order(b.v); if (oa !== ob) return oa - ob;          // empty cells always go last, whichever way the sort runs
    let k = 0; if (oa < 3) k = K.cmp(a.v, b.v); else if (oa === 3) k = String(a.v.code).localeCompare(String(b.v.code));
    if (k) return asc ? k : -k; return a.r - b.r;
  });
  items.forEach(function (it, i) {
    const nr = r1 + i;
    it.row.forEach(function (cell, j) {
      const c = c1 + j; let content = null;
      if (cell && cell.f !== undefined) content = { f: P.shiftFormula(cell.f, 0, nr - it.r) }; else if (cell && cell.v !== undefined) content = { v: cell.v };
      this.putContent(si, nr, c, content, cell ? cell.s : 0);
    }, this);
  }, this);
  this.touch(); return { ok: true };
};

/* ---------- finding ---------- */
/* opt: { matchCase, whole, formulas (look inside formulas), all (every sheet) } -> [{ si, r, c }] in reading order */
Book.prototype.find = function (query, si, opt) {
  opt = opt || {}; const out = [], q = opt.matchCase ? query : query.toLowerCase(); if (!q) return out;
  const sheets = opt.all ? this.sheets.map(function (_, i) { return i; }) : [si];
  sheets.forEach(function (s) {
    const keys = Array.from(this.sheets[s].cells.keys()).sort(function (a, b) { return a - b; });
    keys.forEach(function (k) {
      const r = k >> 6, c = k & 63, cell = this.sheets[s].cells.get(k); if (isEmpty(cell)) return;
      let t = opt.formulas && cell.f !== undefined ? cell.f : this.display(s, r, c); if (!opt.matchCase) t = t.toLowerCase();
      if (opt.whole ? t === q : t.indexOf(q) >= 0) out.push({ si: s, r: r, c: c });
    }, this);
  }, this);
  return out;
};

/* ---------- saving and loading ---------- */
Book.prototype.toJSON = function () {
  const sheets = this.sheets.map(function (sh) {
    const keys = Array.from(sh.cells.keys()).sort(function (a, b) { return a - b; }), cells = [];
    keys.forEach(function (k) {
      const cell = sh.cells.get(k), row = [k >> 6, k & 63, cell.f === undefined ? (cell.v === undefined ? null : cell.v) : null];
      if (cell.s || cell.f !== undefined) row.push(cell.s); if (cell.f !== undefined) row.push(cell.f); cells.push(row);
    });
    const o = { n: sh.name, cells: cells }; if (Object.keys(sh.cw).length) o.cw = sh.cw; if (Object.keys(sh.rh).length) o.rh = sh.rh;
    if (sh.merges.length) o.mg = sh.merges.map(function (b) { return [b.r1, b.c1, b.r2, b.c2]; });
    if (sh.freeze.r || sh.freeze.c) o.fz = [sh.freeze.r, sh.freeze.c];
    if (sh.cf.length) o.cf = sh.cf.map(function (b) { return Object.assign({}, b); });
    if (sh.charts.length) o.ch = sh.charts.map(function (b) { return Object.assign({}, b); });
    return o;
  });
  return { v: 1, act: this.active, styles: this.styles, sheets: sheets };
};
Book.prototype.snapshot = function () { return JSON.stringify(this.toJSON()); };
function intIn(v, lo, hi) { return typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi; }
function readMap(src, dim, range) {
  const out = {}; if (!src || typeof src !== 'object' || Array.isArray(src)) return out; let n = 0;
  Object.keys(src).forEach(function (k) { const i = Number(k), v = src[k]; if (n < 2000 && /^\d{1,4}$/.test(k) && i < dim && typeof v === 'number' && isFinite(v) && v >= range[0] && v <= range[1]) { out[i] = Math.round(v); n++; } });
  return out;
}
/* data (an object from JSON.parse) -> a Book, or null if it is not a workbook at all. Everything is checked; bad parts are dropped. */
Book.fromJSON = function (data) {
  if (!data || typeof data !== 'object' || data.v !== 1 || !Array.isArray(data.sheets) || !data.sheets.length) return null;
  const b = new Book(); b.sheets = []; let total = 0;
  const styleMap = [0];                                            // saved style numbers -> our style numbers (a bad style falls back to the default)
  if (Array.isArray(data.styles)) data.styles.slice(0, BL.styles).forEach(function (s, i) { if (i > 0) { const id = b.intern(s); styleMap[i] = id < 0 ? 0 : id; } });
  data.sheets.slice(0, LIM.sheets).forEach(function (s) {
    if (!s || typeof s !== 'object') return;
    const sh = newSheet(b.uniqueName(typeof s.n === 'string' ? s.n : 'Sheet', -1)); b.sheets.push(sh);
    if (Array.isArray(s.cells)) s.cells.forEach(function (row) {
      if (total >= LIM.cells || !Array.isArray(row) || !intIn(row[0], 0, LIM.rows - 1) || !intIn(row[1], 0, LIM.cols - 1)) return;
      const cell = { s: intIn(row[3], 0, styleMap.length - 1) ? styleMap[row[3]] : 0 }, v = row[2], f = row[4];
      if (typeof f === 'string' && f.charAt(0) === '=' && f.length <= LIM.formula && f.length > 1) cell.f = cleanText(f).replace(/[\r\n]+/g, ' ');
      else if (typeof v === 'number' && isFinite(v) && Math.abs(v) <= Fm.MAXNUM) cell.v = Math.abs(v) < Fm.MINNUM ? 0 : v; else if (typeof v === 'boolean') cell.v = v; else if (typeof v === 'string' && v.length <= LIM.str) cell.v = cleanText(v);
      if (isEmpty(cell) && cell.s === 0) return; total++; sh.cells.set(key(row[0], row[1]), cell);
    });
    sh.cw = readMap(s.cw, LIM.cols, BL.colW); sh.rh = readMap(s.rh, LIM.rows, BL.rowH);
    if (Array.isArray(s.mg)) s.mg.slice(0, BL.merges).forEach(function (m) {
      if (!Array.isArray(m) || !intIn(m[0], 0, LIM.rows - 1) || !intIn(m[1], 0, LIM.cols - 1) || !intIn(m[2], m[0], LIM.rows - 1) || !intIn(m[3], m[1], LIM.cols - 1) || (m[0] === m[2] && m[1] === m[3])) return;
      const bx = { r1: m[0], c1: m[1], r2: m[2], c2: m[3] };
      if (!sh.merges.some(function (o) { return o.r1 <= bx.r2 && o.r2 >= bx.r1 && o.c1 <= bx.c2 && o.c2 >= bx.c1; })) sh.merges.push(bx);
    });
    if (Array.isArray(s.fz) && intIn(s.fz[0], 0, 50) && intIn(s.fz[1], 0, 20)) sh.freeze = { r: s.fz[0], c: s.fz[1] };
    if (Array.isArray(s.cf)) s.cf.slice(0, BL.cf).forEach(function (r) { const x = cleanRule(r); if (x) sh.cf.push(x); });
    if (Array.isArray(s.ch)) s.ch.slice(0, BL.charts).forEach(function (r) { const x = cleanChart(r); if (x) sh.charts.push(x); });
  });
  if (!b.sheets.length) return null;
  b.active = intIn(data.act, 0, b.sheets.length - 1) ? data.act : 0; return b;
};
const CHART_TYPES = ['col', 'bar', 'line', 'pie'];
function cleanChart(r) {
  if (!r || typeof r !== 'object' || CHART_TYPES.indexOf(r.type) < 0) return null;
  if (!intIn(r.r1, 0, LIM.rows - 1) || !intIn(r.c1, 0, LIM.cols - 1) || !intIn(r.r2, r.r1, LIM.rows - 1) || !intIn(r.c2, r.c1, LIM.cols - 1)) return null;
  const num = function (v, lo, hi, d) { return typeof v === 'number' && isFinite(v) ? Math.max(lo, Math.min(hi, Math.round(v))) : d; };
  return { type: r.type, title: typeof r.title === 'string' ? cleanText(r.title).replace(/[\r\n]+/g, ' ').slice(0, 80) : '', r1: r.r1, c1: r.c1, r2: r.r2, c2: r.c2, x: num(r.x, 0, 100000, 40), y: num(r.y, 0, 100000, 40), w: num(r.w, 200, 1200, 480), h: num(r.h, 140, 900, 300), hdr: r.hdr === true, lab: r.lab === true };
}
function cleanRule(r) {
  if (!r || typeof r !== 'object' || CFOPS.indexOf(r.op) < 0) return null;
  if (!intIn(r.r1, 0, LIM.rows - 1) || !intIn(r.c1, 0, LIM.cols - 1) || !intIn(r.r2, r.r1, LIM.rows - 1) || !intIn(r.c2, r.c1, LIM.cols - 1)) return null;
  const okv = function (v) { return (typeof v === 'number' && isFinite(v)) || (typeof v === 'string' && v.length <= 100); };
  if (!okv(r.a) || (r.op === 'between' && !okv(r.b))) return null;
  const o = { r1: r.r1, c1: r.c1, r2: r.r2, c2: r.c2, op: r.op, a: typeof r.a === 'string' ? cleanText(r.a) : r.a }; if (r.op === 'between') o.b = typeof r.b === 'string' ? cleanText(r.b) : r.b;
  if (typeof r.col === 'string' && COLOR.test(r.col)) o.col = r.col.toLowerCase(); if (typeof r.bg === 'string' && COLOR.test(r.bg)) o.bg = r.bg.toLowerCase();
  return o.col || o.bg ? o : null;
}
/* the colours a formatting rule gives a cell, or null */
Book.prototype.ruleStyle = function (si, r, c) {
  const rules = this.sheets[si].cf; if (!rules.length) return null;
  for (let i = 0; i < rules.length; i++) {
    const q = rules[i]; if (r < q.r1 || r > q.r2 || c < q.c1 || c > q.c2) continue;
    const v = this.get(si, r, c); if (v instanceof Err) continue;
    let hit = false; const a = q.a, num = typeof v === 'number';
    const na = typeof a === 'number' ? a : Fm.parseNumber(String(a)), nb = typeof q.b === 'number' ? q.b : Fm.parseNumber(String(q.b));
    if (q.op === 'text') hit = typeof v === 'string' && v.toLowerCase().indexOf(String(a).toLowerCase()) >= 0;
    else if (q.op === 'between') hit = num && na !== null && nb !== null && K.norm(v) >= K.norm(Math.min(na, nb)) && K.norm(v) <= K.norm(Math.max(na, nb));
    else if (q.op === 'eq' || q.op === 'ne') { const eq = na !== null ? num && K.norm(v) === K.norm(na) : typeof v === 'string' && v.toLowerCase() === String(a).toLowerCase(); hit = q.op === 'eq' ? eq : !eq; }
    else if (num && na !== null) { const x = K.norm(v), y = K.norm(na); hit = q.op === 'gt' ? x > y : q.op === 'lt' ? x < y : q.op === 'ge' ? x >= y : x <= y; }
    if (hit) return { col: q.col, bg: q.bg };
  }
  return null;
};
Book.fromSnapshot = function (text) { try { return Book.fromJSON(JSON.parse(text)); } catch (e) { return null; } };

CC.sheetbook = { Book: Book, FONTS: FONTS, BL: BL, normStyle: normStyle, CFOPS: CFOPS, key: key, isEmpty: isEmpty, cleanText: cleanText };
})();
