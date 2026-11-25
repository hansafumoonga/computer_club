/* xlsx.js - saving a workbook as an Excel file (.xlsx), a CSV file, or a printable page.
   A formula is written to the file only if it was read successfully and uses only functions this spreadsheet knows; anything else is
   written as plain text, so a saved file can never carry a formula that was not checked. All text is escaped for XML. */
(function () {
'use strict';
const CC = window.CC = window.CC || {};
const DF = CC.docfile, P = CC.sheetparse, Fm = CC.sheetfmt, K = CC.sheetcalc, Err = K.Err;
const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main', RNS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const STD = { 'General': 0, '0': 1, '0.00': 2, '#,##0': 3, '#,##0.00': 4, '0%': 9, '0.00%': 10, '@': 49 };
const STDERR = { '#DIV/0!': 1, '#N/A': 1, '#NAME?': 1, '#NULL!': 1, '#NUM!': 1, '#REF!': 1, '#VALUE!': 1 };
const CFOP = { gt: 'greaterThan', lt: 'lessThan', ge: 'greaterThanOrEqual', le: 'lessThanOrEqual', eq: 'equal', ne: 'notEqual', between: 'between' };
const esc = DF.esc, X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const argb = function (hex) { return 'FF' + hex.slice(1).toUpperCase(); };

/* a formula as Excel writes it in a file (no "=", capital letters, newer functions marked _xlfn.), or null if it should not be exported */
function excelFormula(text) {
  const p = P.parse(text); if (p.error) return null;
  let ok = true;
  (function walk(n) {
    if (!ok || !n) return;
    if (n.t === 'fn') { if (!K.hasFunction(n.name)) ok = false; n.args.forEach(walk); } else if (n.t === 'name') ok = false;
    else if (n.t === 'bin') { walk(n.a); walk(n.b); } else if (n.t === 'un' || n.t === 'pct') walk(n.a);
  })(p.ast);
  if (!ok) return null;
  const src = text.slice(1); let toks; try { toks = P.tokenize(src); } catch (e) { return null; }
  let out = '', pos = 0;
  toks.forEach(function (t, i) {
    let rep = null;
    if (t.k === 'ref' || t.k === 'range') rep = P.refToText(t);
    else if (t.k === 'name') { const u = t.v.toUpperCase(); rep = toks[i + 1] && toks[i + 1].k === '(' ? (K.XLFN[u] ? '_xlfn.' + u : u) : u; }
    if (rep !== null) { out += src.slice(pos, t.s) + rep; pos = t.e; }
  });
  out += src.slice(pos);
  return out.length > 8000 ? null : out;
}

function Styles() {
  this.fonts = []; this.fills = []; this.borders = []; this.fmts = []; this.xfs = []; this.dxfs = []; this.keys = {};
  this.font({}); this.fills.push('<fill><patternFill patternType="none"/></fill>', '<fill><patternFill patternType="gray125"/></fill>'); this.border(''); this.xfs.push('<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>');
}
Styles.prototype.add = function (list, xml) { const i = list.indexOf(xml); if (i >= 0) return i; list.push(xml); return list.length - 1; };
Styles.prototype.font = function (s) {
  return this.add(this.fonts, '<font>' + (s.b ? '<b/>' : '') + (s.i ? '<i/>' : '') + (s.s ? '<strike/>' : '') + (s.u ? '<u/>' : '') + '<sz val="' + (s.sz || 11) + '"/>' + '<color rgb="' + argb(s.col || '#000000') + '"/>' + '<name val="' + esc(s.ff || 'Calibri') + '"/><family val="2"/></font>');
};
Styles.prototype.fill = function (bg) { return bg ? this.add(this.fills, '<fill><patternFill patternType="solid"><fgColor rgb="' + argb(bg) + '"/><bgColor indexed="64"/></patternFill></fill>') : 0; };
Styles.prototype.border = function (bd) {
  const side = function (n, on) { return on ? '<' + n + ' style="thin"><color rgb="FF000000"/></' + n + '>' : '<' + n + '/>'; };
  return this.add(this.borders, '<border>' + side('left', bd.indexOf('l') >= 0) + side('right', bd.indexOf('r') >= 0) + side('top', bd.indexOf('t') >= 0) + side('bottom', bd.indexOf('b') >= 0) + '<diagonal/></border>');
};
Styles.prototype.numFmt = function (code) {
  if (!code) return 0; if (STD[code] !== undefined) return STD[code];
  let i = this.fmts.indexOf(code); if (i < 0) { this.fmts.push(code); i = this.fmts.length - 1; } return 164 + i;
};
/* our style (from the workbook) -> a number in the file's list of cell formats */
Styles.prototype.xf = function (s) {
  const k = JSON.stringify(s); if (this.keys[k] !== undefined) return this.keys[k];
  const nf = this.numFmt(s.fmt), fo = this.font(s), fi = this.fill(s.bg), bo = this.border(s.bd || '');
  const al = (s.al ? ' horizontal="' + { l: 'left', c: 'center', r: 'right' }[s.al] + '"' : '') + (s.va ? ' vertical="' + { t: 'top', m: 'center' }[s.va] + '"' : '') + (s.wr ? ' wrapText="1"' : '');
  const xml = '<xf numFmtId="' + nf + '" fontId="' + fo + '" fillId="' + fi + '" borderId="' + bo + '" xfId="0"' + (nf ? ' applyNumberFormat="1"' : '') + (fo ? ' applyFont="1"' : '') + (fi ? ' applyFill="1"' : '') + (bo ? ' applyBorder="1"' : '') + (al ? ' applyAlignment="1"><alignment' + al + '/></xf>' : '/>');
  this.xfs.push(xml); this.keys[k] = this.xfs.length - 1; return this.keys[k];
};
Styles.prototype.dxf = function (col, bg) {
  return this.add(this.dxfs, '<dxf>' + (col ? '<font><color rgb="' + argb(col) + '"/></font>' : '') + (bg ? '<fill><patternFill><bgColor rgb="' + argb(bg) + '"/></patternFill></fill>' : '') + '</dxf>');
};
Styles.prototype.xml = function () {
  const list = function (tag, items) { return '<' + tag + ' count="' + items.length + '">' + items.join('') + '</' + tag + '>'; };
  return X + '<styleSheet xmlns="' + NS + '">' + (this.fmts.length ? list('numFmts', this.fmts.map(function (c, i) { return '<numFmt numFmtId="' + (164 + i) + '" formatCode="' + esc(c) + '"/>'; })) : '') +
    list('fonts', this.fonts) + list('fills', this.fills) + list('borders', this.borders) + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' + list('cellXfs', this.xfs) +
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' + (this.dxfs.length ? list('dxfs', this.dxfs) : '') + '</styleSheet>';
};

function cellRef(r, c) { return P.colName(c) + (r + 1); }
function numStr(n) { return String(Math.abs(n) < Fm.MINNUM ? 0 : n); }                  // Excel keeps numbers between about 2.2E-308 and 9.99E+307
function sheetXml(book, si, st, sst, active) {
  const sh = book.sheets[si], keys = Array.from(sh.cells.keys()).sort(function (a, b) { return a - b; }), rows = {};
  let minR = Infinity, maxR = -1, maxC = -1;
  keys.forEach(function (k) {
    const r = k >> 6, c = k & 63, cell = sh.cells.get(k), s = book.styles[cell.s];
    let x = '<c r="' + cellRef(r, c) + '"', sid = cell.s ? st.xf(s) : 0;
    if (cell.f === undefined && cell.v === undefined && !cell.s) return;
    if (sid) x += ' s="' + sid + '"';
    if (cell.f !== undefined) {
      const ef = excelFormula(cell.f), v = book.get(si, r, c);
      if (ef === null) { x += ' t="s"><v>' + sst.add(cell.f) + '</v></c>'; }          // not safe to export as a formula: kept as the text that was typed
      else {
        let t = '', val = '';
        if (v instanceof Err) { if (STDERR[v.code]) { t = ' t="e"'; val = '<v>' + esc(v.code) + '</v>'; } }
        else if (typeof v === 'number') { if (isFinite(v)) val = '<v>' + numStr(v) + '</v>'; } else if (typeof v === 'boolean') { t = ' t="b"'; val = '<v>' + (v ? 1 : 0) + '</v>'; } else if (typeof v === 'string') { t = ' t="str"'; val = '<v>' + esc(v) + '</v>'; }
        x += t + '><f>' + esc(ef) + '</f>' + val + '</c>';
      }
    } else if (cell.v === undefined) x += '/>';
    else if (typeof cell.v === 'number') x += '><v>' + numStr(cell.v) + '</v></c>';
    else if (typeof cell.v === 'boolean') x += ' t="b"><v>' + (cell.v ? 1 : 0) + '</v></c>';
    else x += ' t="s"><v>' + sst.add(cell.v) + '</v></c>';
    (rows[r] = rows[r] || []).push(x); if (r < minR) minR = r; if (r > maxR) maxR = r; if (c > maxC) maxC = c;
  });
  Object.keys(sh.rh).forEach(function (r) { r = Number(r); rows[r] = rows[r] || []; });
  let data = '';
  Object.keys(rows).map(Number).sort(function (a, b) { return a - b; }).forEach(function (r) {
    const h = sh.rh[r]; data += '<row r="' + (r + 1) + '"' + (h ? ' ht="' + Math.round(h * 75) / 100 + '" customHeight="1"' : '') + (rows[r].length ? '>' + rows[r].join('') + '</row>' : '/>');
  });
  let cols = ''; Object.keys(sh.cw).map(Number).sort(function (a, b) { return a - b; }).forEach(function (c) { const w = Math.max(0.5, Math.round((sh.cw[c] - 5) / 7 * 100) / 100); cols += '<col min="' + (c + 1) + '" max="' + (c + 1) + '" width="' + w + '" customWidth="1"/>'; });
  const fz = sh.freeze; let pane = '';
  if (fz.r || fz.c) {
    pane = '<pane' + (fz.c ? ' xSplit="' + fz.c + '"' : '') + (fz.r ? ' ySplit="' + fz.r + '"' : '') + ' topLeftCell="' + cellRef(fz.r, fz.c) + '" activePane="' + (fz.r && fz.c ? 'bottomRight' : fz.r ? 'bottomLeft' : 'topRight') + '" state="frozen"/>';
  }
  let cf = '', prio = 1;
  sh.cf.forEach(function (q) {
    const sq = cellRef(q.r1, q.c1) + ':' + cellRef(q.r2, q.c2), dxf = st.dxf(q.col, q.bg), lit = function (v) { return typeof v === 'number' ? numStr(v) : '"' + String(v).replace(/"/g, '""') + '"'; };
    let rule;
    if (q.op === 'text') rule = '<cfRule type="containsText" dxfId="' + dxf + '" priority="' + prio + '" operator="containsText" text="' + esc(q.a) + '"><formula>NOT(ISERROR(SEARCH(' + esc(lit(String(q.a))) + ',' + cellRef(q.r1, q.c1) + ')))</formula></cfRule>';
    else rule = '<cfRule type="cellIs" dxfId="' + dxf + '" priority="' + prio + '" operator="' + CFOP[q.op] + '"><formula>' + esc(lit(q.a)) + '</formula>' + (q.op === 'between' ? '<formula>' + esc(lit(q.b)) + '</formula>' : '') + '</cfRule>';
    prio++; cf += '<conditionalFormatting sqref="' + sq + '">' + rule + '</conditionalFormatting>';
  });
  const dim = maxR < 0 ? 'A1' : cellRef(minR, 0) + ':' + cellRef(maxR, maxC);
  return X + '<worksheet xmlns="' + NS + '" xmlns:r="' + RNS + '"><dimension ref="' + dim + '"/><sheetViews><sheetView workbookViewId="0"' + (active ? ' tabSelected="1"' : '') + '>' + pane + '</sheetView></sheetViews>' +
    '<sheetFormatPr defaultRowHeight="18" customHeight="1" defaultColWidth="11.86"/>' + (cols ? '<cols>' + cols + '</cols>' : '') + '<sheetData>' + data + '</sheetData>' +
    (sh.merges.length ? '<mergeCells count="' + sh.merges.length + '">' + sh.merges.map(function (m) { return '<mergeCell ref="' + cellRef(m.r1, m.c1) + ':' + cellRef(m.r2, m.c2) + '"/>'; }).join('') + '</mergeCells>' : '') + cf +
    '<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/></worksheet>';
}
function SST() { this.map = new Map(); this.list = []; this.count = 0; }
SST.prototype.add = function (s) { s = String(s); this.count++; let i = this.map.get(s); if (i === undefined) { i = this.list.length; this.list.push(s); this.map.set(s, i); } return i; };
SST.prototype.xml = function () {
  return X + '<sst xmlns="' + NS + '" count="' + this.count + '" uniqueCount="' + this.list.length + '">' + this.list.map(function (s) { return '<si><t xml:space="preserve">' + esc(s) + '</t></si>'; }).join('') + '</sst>';
};
/* the files of an .xlsx package */
function xlsxFiles(book, who) {
  book.calcAll(); const st = new Styles(), sst = new SST(), files = [], n = book.sheets.length, now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  const sheets = book.sheets.map(function (sh, i) { return sheetXml(book, i, st, sst, i === book.active); });
  files.push({ name: '[Content_Types].xml', data: X + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' + book.sheets.map(function (_, i) { return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join('') +
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>' +
    '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>' });
  files.push({ name: '_rels/.rels', data: X + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>' });
  files.push({ name: 'docProps/core.xml', data: X + '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:creator>' + esc(who || 'Tech Explorers') +
    '</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">' + now + '</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">' + now + '</dcterms:modified></cp:coreProperties>' });
  files.push({ name: 'docProps/app.xml', data: X + '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Tech Explorers</Application></Properties>' });
  files.push({ name: 'xl/workbook.xml', data: X + '<workbook xmlns="' + NS + '" xmlns:r="' + RNS + '"><bookViews><workbookView activeTab="' + book.active + '"/></bookViews><sheets>' +
    book.sheets.map(function (sh, i) { return '<sheet name="' + esc(sh.name) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>'; }).join('') + '</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>' });
  files.push({ name: 'xl/_rels/workbook.xml.rels', data: X + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    book.sheets.map(function (_, i) { return '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'; }).join('') +
    '<Relationship Id="rId' + (n + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId' + (n + 2) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>' });
  sheets.forEach(function (x, i) { files.push({ name: 'xl/worksheets/sheet' + (i + 1) + '.xml', data: x }); });
  files.push({ name: 'xl/styles.xml', data: st.xml() }); files.push({ name: 'xl/sharedStrings.xml', data: sst.xml() });
  return files;
}
function toXlsx(book, who) { return DF.zip(xlsxFiles(book, who)); }
/* rows of what the sheet shows, for a CSV file */
function csvRows(book, si) {
  const u = book.usedRange(si), rows = [];
  for (let r = 0; r <= u.r2; r++) {
    const row = [];
    for (let c = 0; c <= u.c2; c++) {
      const v = book.get(si, r, c), fmt = book.styleAt(si, r, c).fmt;
      if (v === null) row.push(''); else if (v instanceof Err) row.push(v.code); else if (typeof v === 'number') row.push(fmt ? { num: Fm.format(v, fmt) } : v); else row.push(typeof v === 'boolean' ? v : Fm.format(v, fmt));
    }
    rows.push(row);
  }
  return rows;
}
function toCSV(book, si) { return DF.toCSV(csvRows(book, si)); }
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
function saveXlsx(book, name, who) { return DF.download(toXlsx(book, who), DF.safeName(name, 'My spreadsheet') + '.xlsx', XLSX_MIME); }
function saveCsv(book, si, name) { return DF.download(toCSV(book, si), DF.safeName(name, 'My spreadsheet') + '.csv', 'text/csv;charset=utf-8'); }

CC.xlsx = { toXlsx: toXlsx, files: xlsxFiles, toCSV: toCSV, csvRows: csvRows, saveXlsx: saveXlsx, saveCsv: saveCsv, excelFormula: excelFormula, MIME: XLSX_MIME };
})();
