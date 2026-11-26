/* docx.js - saving a document as a Word file (.docx), a web page (.html) or plain text (.txt).
   The file is made from the CLEANED copy of the document (see docsafe.js), never from what the editor holds, and every piece of text
   is escaped for XML. A Word file is a zip of small XML parts; the parts, and the order of the elements inside them, follow the
   Office Open XML schema so Word, LibreOffice and Google Docs all open it. */
(function () {
'use strict';
const CC = window.CC = window.CC || {};
const DF = CC.docfile, DS = CC.docsafe;
const NSW = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main', NSR = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const NSDOC = ' xmlns:w="' + NSW + '" xmlns:r="' + NSR + '" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';
const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n', esc = DF.esc;
const EMU = 9525, TW = 15;                                   // one pixel is 9525 EMU and 15 twips
const PAGES = { a4: { w: 11906, h: 16838 }, letter: { w: 12240, h: 15840 } };
const ALIGN = { left: 'left', right: 'right', center: 'center', justify: 'both' };
const MARGIN = 1440;                                         // one inch
const DEFAULT = { font: 'Calibri', pt: 12 };                 // the editor starts with this look
const LINE = 1.35, SINGLE = 1.2207;                          // the editor's line height, and the height of Word's single line in Calibri (both in em)
const lineTw = function (h) { return Math.ceil(h / SINGLE * 240); };    // Word's line spacing for the same height, rounded up so Word never fits an extra line on a page
const CELLPAD = '<w:tblCellMar><w:top w:w="60" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:bottom w:w="60" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tblCellMar>';   // 4px by 8px, as on screen

function parseStyle(s) { const o = {}; String(s || '').split(';').forEach(function (p) { const i = p.indexOf(':'); if (i > 0) o[p.slice(0, i).trim()] = p.slice(i + 1).trim(); }); return o; }
function attr(el, n) { return el.getAttribute ? el.getAttribute(n) : null; }

/* ---------- text properties ---------- */
function runState(parent, el) {
  const st = Object.assign({}, parent), t = el.localName;
  if (t === 'b') st.b = true; else if (t === 'i') st.i = true; else if (t === 'u') st.u = true; else if (t === 's') st.s = true; else if (t === 'sub') st.va = 'subscript'; else if (t === 'sup') st.va = 'superscript';
  const sx = parseStyle(attr(el, 'style'));
  if (sx['font-weight'] === 'bold') st.b = true;
  if (sx['font-style'] === 'italic') st.i = true;
  const td = sx['text-decoration'] || ''; if (/underline/.test(td)) st.u = true; if (/line-through/.test(td)) st.s = true;
  if (/^#[0-9a-f]{6}$/.test(sx.color || '')) st.color = sx.color.slice(1).toUpperCase();
  if (/^#[0-9a-f]{6}$/.test(sx['background-color'] || '')) st.bg = sx['background-color'].slice(1).toUpperCase();
  const fs = /^(\d+(?:\.\d+)?)pt$/.exec(sx['font-size'] || ''); if (fs) st.sz = Math.max(2, Math.min(400, Math.round(parseFloat(fs[1]) * 2)));
  if (sx['font-family']) { const f = DS.FONTS[sx['font-family'].split(',')[0].replace(/["']/g, '').trim().toLowerCase()]; if (f) st.font = f[0]; }
  if (sx['vertical-align'] === 'sub') st.va = 'subscript'; else if (sx['vertical-align'] === 'super') st.va = 'superscript';
  return st;
}
function rPr(st) {                                           // the order of these elements is fixed by the schema
  let x = '';
  if (st.link) x += '<w:rStyle w:val="Hyperlink"/>';
  if (st.font) x += '<w:rFonts w:ascii="' + esc(st.font) + '" w:hAnsi="' + esc(st.font) + '" w:cs="' + esc(st.font) + '"/>';
  if (st.b) x += '<w:b/><w:bCs/>'; if (st.i) x += '<w:i/><w:iCs/>'; if (st.s) x += '<w:strike/>';
  if (st.color) x += '<w:color w:val="' + st.color + '"/>';
  if (st.sz) x += '<w:sz w:val="' + st.sz + '"/><w:szCs w:val="' + st.sz + '"/>';
  if (st.u) x += '<w:u w:val="single"/>';
  if (st.bg) x += '<w:shd w:val="clear" w:color="auto" w:fill="' + st.bg + '"/>';
  if (st.va) x += '<w:vertAlign w:val="' + st.va + '"/>';
  return x ? '<w:rPr>' + x + '</w:rPr>' : '';
}
function textRuns(text, st) {
  let out = ''; const pr = rPr(st);
  text.split(/(\t|\n)/).forEach(function (p) {
    if (p === '') return;
    if (p === '\t') out += '<w:r>' + pr + '<w:tab/></w:r>'; else if (p === '\n') out += '<w:r>' + pr + '<w:br/></w:r>';
    else out += '<w:r>' + pr + '<w:t xml:space="preserve">' + esc(p) + '</w:t></w:r>';
  });
  return out;
}

/* ---------- the parts that are built as the document is read ---------- */
function Parts(opt) {
  this.rels = []; this.media = []; this.nextRel = 10; this.docPr = 1; this.links = {}; this.nums = []; this.exts = {};
  this.maxW = Math.round((opt.page.w - 2 * MARGIN) / TW);       // widest picture, in pixels
  this.textW = opt.page.w - 2 * MARGIN;                         // text width in twips
}
Parts.prototype.link = function (url) {
  if (this.links[url]) return this.links[url]; const id = 'rId' + this.nextRel++; this.links[url] = id;
  this.rels.push('<Relationship Id="' + id + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="' + esc(url) + '" TargetMode="External"/>'); return id;
};
Parts.prototype.image = function (bytes, ext) {
  const n = this.media.length + 1, id = 'rId' + this.nextRel++, name = 'image' + n + '.' + ext;
  this.media.push({ name: 'word/media/' + name, data: bytes }); this.exts[ext] = true;
  this.rels.push('<Relationship Id="' + id + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/' + name + '"/>'); return { id: id, name: name };
};
Parts.prototype.list = function (ordered, start) {            // every ordered list gets its own number so it starts again at its own start
  if (!ordered) return 1; this.nums.push(start); return 1 + this.nums.length;
};

/* ---------- inline content ---------- */
function imageRun(el, S) {
  const info = DF.parseDataImage(attr(el, 'src')); if (!info || (info.type !== 'png' && info.type !== 'jpeg' && info.type !== 'gif')) return '';
  let w = parseInt(attr(el, 'width'), 10) || info.w, h = parseInt(attr(el, 'height'), 10) || info.h;
  if (w > S.maxW) { h = Math.round(h * S.maxW / w); w = S.maxW; } w = Math.max(1, w); h = Math.max(1, h);
  const m = S.image(info.bytes, info.type), cx = w * EMU, cy = h * EMU, id = S.docPr++, alt = esc(String(attr(el, 'alt') || '').slice(0, 300));
  return '<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="' + cx + '" cy="' + cy + '"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="' + id + '" name="Picture ' + id + '" descr="' + alt + '"/>' +
    '<wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="' + id + '" name="' + m.name + '" descr="' + alt + '"/><pic:cNvPicPr/></pic:nvPicPr>' +
    '<pic:blipFill><a:blip r:embed="' + m.id + '"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>';
}
function inlineNode(n, st, S) {
  if (n.nodeType === 3) return textRuns(n.nodeValue, st);
  if (n.nodeType !== 1) return '';
  const t = n.localName;
  if (t === 'br') return '<w:r>' + rPr(st) + '<w:br/></w:r>';
  if (t === 'img') return imageRun(n, S);
  if (t === 'a') { const url = attr(n, 'href'); if (!url) return inlineChildren(n, st, S); return '<w:hyperlink r:id="' + S.link(url) + '" w:history="1">' + inlineChildren(n, Object.assign(runState(st, n), { link: true }), S) + '</w:hyperlink>'; }
  return inlineChildren(n, runState(st, n), S);
}
function inlineChildren(el, st, S) { let x = ''; for (let c = el.firstChild; c; c = c.nextSibling) x += inlineNode(c, st, S); return x; }

/* ---------- paragraphs, lists, tables ---------- */
function pPr(c) {                                             // pStyle, numPr, spacing, ind, jc: the order the schema asks for
  let x = '';
  if (c.style) x += '<w:pStyle w:val="' + c.style + '"/>';
  if (c.num) x += '<w:numPr><w:ilvl w:val="' + c.num.lvl + '"/><w:numId w:val="' + c.num.id + '"/></w:numPr>';
  if (c.picture) x += '<w:spacing w:line="240" w:lineRule="auto"/>'; else if (c.line) x += '<w:spacing w:line="' + lineTw(c.line) + '" w:lineRule="auto"/>';     // single spacing keeps a picture its own height
  if (c.left && !c.num) x += '<w:ind w:left="' + Math.round(c.left * TW) + '"/>';
  if (c.align) x += '<w:jc w:val="' + ALIGN[c.align] + '"/>';
  return x ? '<w:pPr>' + x + '</w:pPr>' : '';
}
function paragraph(nodes, c, st, S) {
  const list = nodes.slice(), last = list[list.length - 1];
  if (last && last.nodeType === 1 && last.localName === 'br') list.pop();                          // the line break the browser keeps at the end of a line
  let inner = ''; list.forEach(function (n) { inner += inlineNode(n, st, S); });
  return '<w:p>' + pPr(inner.indexOf('<w:drawing>') >= 0 ? Object.assign({}, c, { picture: true }) : c) + inner + '</w:p>';
}
const BLOCKTAG = { div: 1, h1: 1, h2: 1, h3: 1, blockquote: 1, ul: 1, ol: 1, li: 1, table: 1, hr: 1 };
function blockProps(el, c) {
  const o = Object.assign({}, c), t = el.localName, sx = parseStyle(attr(el, 'style')), ds = attr(el, 'data-st');
  if (t === 'h1') o.style = ds === 'title' ? 'Title' : 'Heading1'; else if (t === 'h2') o.style = 'Heading2'; else if (t === 'h3') o.style = 'Heading3'; else if (t === 'blockquote') o.style = 'Quote';
  else if (ds === 'title') o.style = 'Title'; else if (ds === 'subtitle') o.style = 'Subtitle';
  if (ALIGN[sx['text-align']]) o.align = sx['text-align'];
  if (sx['line-height'] && +sx['line-height'] >= 1 && +sx['line-height'] <= 3) o.line = +sx['line-height'];
  const ml = /^(\d+)px$/.exec(sx['margin-left'] || ''); if (ml) o.left = (o.left || 0) + +ml[1];
  return o;
}
/* one block element (a paragraph, heading, list, table or line) as XML */
function blockNode(n, c, st, S, depth) {
  const t = n.localName;
  if (t === 'hr') return '<w:p>' + (n.getAttribute('data-pb') === '1' ? '<w:r><w:br w:type="page"/></w:r>' : '<w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="808080"/></w:pBdr></w:pPr>') + '</w:p>';
  if (t === 'ul' || t === 'ol') return list(n, c, st, S, depth || 0);
  if (t === 'table') return table(n, st, S, depth || 0);
  const c2 = blockProps(n, c), st2 = runState(st, n);
  return hasBlock(n) ? blocks(n, c2, st2, S, depth) : paragraph(childList(n), c2, st2, S);
}
/* the children of an element become paragraphs (inline pieces gather into one paragraph; blocks start new ones) */
function blocks(parent, c, st, S, depth) {
  let group = [], out = '';
  const flush = function () { if (group.length) { out += paragraph(group, c, st, S); group = []; } };
  for (let n = parent.firstChild; n; n = n.nextSibling) {
    if (n.nodeType === 3) { if (!group.length && /^\s*$/.test(n.nodeValue) && n.nodeValue.indexOf('\n') >= 0) continue; group.push(n); continue; }   // spaces and line breaks between blocks are layout, not content
    if (n.nodeType !== 1) continue;
    if (!BLOCKTAG[n.localName]) { group.push(n); continue; }
    flush(); out += blockNode(n, c, st, S, depth);
  }
  flush(); return out;
}
function childList(el) { const a = []; for (let n = el.firstChild; n; n = n.nextSibling) a.push(n); return a; }
function hasBlock(el) { for (let n = el.firstChild; n; n = n.nextSibling) if (n.nodeType === 1 && BLOCKTAG[n.localName]) return true; return false; }
function list(el, c, st, S, depth) {
  const ordered = el.localName === 'ol', lvl = Math.min(depth, 8);
  const id = S.list(ordered, Math.max(1, parseInt(attr(el, 'start'), 10) || 1)); let out = '';
  for (let n = el.firstChild; n; n = n.nextSibling) {
    if (n.nodeType !== 1) continue;
    if (n.localName === 'ul' || n.localName === 'ol') { out += list(n, c, st, S, depth + 1); continue; }
    const c2 = Object.assign(blockProps(n, c), { num: { id: id, lvl: lvl } }), plain = Object.assign({}, c2, { num: null }), st2 = runState(st, n); let group = [], first = true;
    const emit = function (xml) { out += xml; first = false; };                                    // the first paragraph of an item carries the bullet or number, the rest do not
    const flush = function () { if (group.length) { emit(paragraph(group, first ? c2 : plain, st2, S)); group = []; } };
    for (let k = n.firstChild; k; k = k.nextSibling) {
      if (k.nodeType === 1 && (k.localName === 'ul' || k.localName === 'ol')) { flush(); if (first) emit(paragraph([], c2, st2, S)); out += list(k, c, st, S, depth + 1); continue; }
      if (k.nodeType === 1 && BLOCKTAG[k.localName]) { flush(); emit(blockNode(k, first ? c2 : plain, st2, S, depth)); continue; }
      group.push(k);
    }
    flush(); if (first) emit(paragraph([], c2, st2, S));                                         // an empty item still shows its bullet
  }
  return out;
}
function table(el, st, S, depth) {
  const rows = []; for (let tb = el.firstChild; tb; tb = tb.nextSibling) if (tb.nodeType === 1 && tb.localName === 'tbody') for (let tr = tb.firstChild; tr; tr = tr.nextSibling) if (tr.nodeType === 1 && tr.localName === 'tr') rows.push(tr);
  if (!rows.length) return '';
  const grid = rows.map(function (tr) { const cells = []; for (let td = tr.firstChild; td; td = td.nextSibling) if (td.nodeType === 1 && (td.localName === 'td' || td.localName === 'th')) cells.push({ el: td, span: Math.max(1, parseInt(attr(td, 'colspan'), 10) || 1) }); return cells; });
  const ncol = Math.max.apply(null, grid.map(function (r) { return r.reduce(function (s, c) { return s + c.span; }, 0); })), total = S.textW;
  let widths = new Array(ncol).fill(Math.floor(total / ncol));
  const first = grid[0]; if (first.length && first.every(function (c) { return /^\d+px$/.test(parseStyle(attr(c.el, 'style')).width || ''); }) && first.every(function (c) { return c.span === 1; }) && first.length === ncol) {
    const px = first.map(function (c) { return parseInt(parseStyle(attr(c.el, 'style')).width, 10); }), sum = px.reduce(function (a, b) { return a + b; }, 0);
    widths = px.map(function (p) { return Math.max(300, Math.floor(p * TW * Math.min(1, total / (sum * TW)))); });
  }
  const bd = attr(el, 'data-bd') || 'grid', ln = function (n, on) { return on ? '<w:' + n + ' w:val="single" w:sz="4" w:space="0" w:color="808080"/>' : '<w:' + n + ' w:val="nil"/>'; };
  const box = bd === 'grid' || bd === 'box', inner = bd === 'grid';
  let x = '<w:tbl><w:tblPr><w:tblW w:w="' + widths.reduce(function (a, b) { return a + b; }, 0) + '" w:type="dxa"/><w:tblBorders>' + ln('top', box) + ln('left', box) + ln('bottom', box) + ln('right', box) + ln('insideH', inner) + ln('insideV', inner) + '</w:tblBorders><w:tblLayout w:type="fixed"/>' + CELLPAD + '<w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/></w:tblPr>';
  x += '<w:tblGrid>' + widths.map(function (w) { return '<w:gridCol w:w="' + w + '"/>'; }).join('') + '</w:tblGrid>';
  grid.forEach(function (cells) {
    x += '<w:tr>'; let col = 0;
    cells.forEach(function (cell) {
      const td = cell.el, sx = parseStyle(attr(td, 'style')), span = Math.min(cell.span, ncol - col); let w = 0; for (let k = 0; k < span; k++) w += widths[col + k]; col += span;
      let tcPr = '<w:tcW w:w="' + w + '" w:type="dxa"/>' + (span > 1 ? '<w:gridSpan w:val="' + span + '"/>' : '');
      if (/^#[0-9a-f]{6}$/.test(sx['background-color'] || '')) tcPr += '<w:shd w:val="clear" w:color="auto" w:fill="' + sx['background-color'].slice(1).toUpperCase() + '"/>';
      if (/^(top|middle|bottom)$/.test(sx['vertical-align'] || '')) tcPr += '<w:vAlign w:val="' + { top: 'top', middle: 'center', bottom: 'bottom' }[sx['vertical-align']] + '"/>';
      const c0 = { align: ALIGN[sx['text-align']] ? sx['text-align'] : null }, th = td.localName === 'th', st2 = th ? Object.assign(runState(st, td), { b: true }) : runState(st, td);
      let inner = hasBlock(td) ? blocks(td, c0, st2, S, depth + 1) : paragraph(childList(td), c0, st2, S);
      if (!/<\/w:p>$/.test(inner)) inner += '<w:p/>';                           // a cell must end with a paragraph
      x += '<w:tc><w:tcPr>' + tcPr + '</w:tcPr>' + inner + '</w:tc>';
    });
    for (; col < ncol; col++) x += '<w:tc><w:tcPr><w:tcW w:w="' + widths[col] + '" w:type="dxa"/></w:tcPr><w:p/></w:tc>';          // a short row is filled up with empty cells
    x += '</w:tr>';
  });
  return x + '</w:tbl>';
}

/* ---------- fixed parts ---------- */
function numberingXml(S) {
  const lvls = function (bullet) {
    let x = '';
    for (let i = 0; i < 9; i++) {
      const fmt = bullet ? 'bullet' : ['decimal', 'lowerLetter', 'lowerRoman'][i % 3], txt = bullet ? ['•', 'o', '▪'][i % 3] : '%' + (i + 1) + '.';
      x += '<w:lvl w:ilvl="' + i + '"><w:start w:val="1"/><w:numFmt w:val="' + fmt + '"/><w:lvlText w:val="' + txt + '"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="' + (480 * (i + 1)) + '" w:hanging="360"/></w:pPr>' + (bullet ? '<w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri" w:hint="default"/></w:rPr>' : '') + '</w:lvl>';
    }
    return x;
  };
  let x = X + '<w:numbering xmlns:w="' + NSW + '"><w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="hybridMultilevel"/>' + lvls(true) + '</w:abstractNum><w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="hybridMultilevel"/>' + lvls(false) + '</w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>';
  S.nums.forEach(function (start, i) { x += '<w:num w:numId="' + (2 + i) + '"><w:abstractNumId w:val="1"/><w:lvlOverride w:ilvl="0"><w:startOverride w:val="' + start + '"/></w:lvlOverride></w:num>'; });
  return x + '</w:numbering>';
}
function stylesXml() {
  const head = function (id, name, size, color, bold, italic, before, after, outline, extra) {
    return '<w:style w:type="paragraph" w:styleId="' + id + '"><w:name w:val="' + name + '"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:uiPriority w:val="9"/><w:qFormat/><w:pPr>' + (outline !== null ? '<w:keepLines/>' : '') +
      '<w:spacing w:before="' + before + '" w:after="' + after + '"' + (id === 'Subtitle' ? '' : ' w:line="' + lineTw(1.2) + '" w:lineRule="auto"') + '/>' + (outline !== null ? '<w:outlineLvl w:val="' + outline + '"/>' : '') + '</w:pPr><w:rPr>' + (bold ? '<w:b/><w:bCs/>' : '') + (italic ? '<w:i/><w:iCs/>' : '') + '<w:color w:val="' + color + '"/><w:sz w:val="' + size + '"/><w:szCs w:val="' + size + '"/></w:rPr></w:style>';
  };
  return X + '<w:styles xmlns:w="' + NSW + '"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="' + DEFAULT.font + '" w:hAnsi="' + DEFAULT.font + '" w:eastAsia="' + DEFAULT.font + '" w:cs="' + DEFAULT.font + '"/><w:sz w:val="' + DEFAULT.pt * 2 + '"/><w:szCs w:val="' + DEFAULT.pt * 2 + '"/><w:lang w:val="en-GB" w:eastAsia="en-US" w:bidi="ar-SA"/></w:rPr></w:rPrDefault>' +
    '<w:pPrDefault><w:pPr><w:widowControl w:val="0"/><w:spacing w:after="0" w:line="' + lineTw(LINE) + '" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>' +
    '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>' +
    '<w:style w:type="character" w:default="1" w:styleId="DefaultParagraphFont"><w:name w:val="Default Paragraph Font"/><w:uiPriority w:val="1"/><w:semiHidden/><w:unhideWhenUsed/></w:style>' +
    '<w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:uiPriority w:val="99"/><w:semiHidden/><w:unhideWhenUsed/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="60" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:bottom w:w="60" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>' +
    '<w:style w:type="numbering" w:default="1" w:styleId="NoList"><w:name w:val="No List"/><w:uiPriority w:val="99"/><w:semiHidden/><w:unhideWhenUsed/></w:style>' +
    head('Title', 'Title', 52, '1E1B4B', true, false, 0, 104, null) + head('Subtitle', 'Subtitle', 28, '4B5563', false, true, 0, 0, null) +
    head('Heading1', 'heading 1', 40, '312E81', true, false, 240, 80, 0) + head('Heading2', 'heading 2', 32, '3730A3', true, false, 160, 64, 1) + head('Heading3', 'heading 3', 26, '4338CA', true, false, 104, 52, 2) +
    '<w:style w:type="paragraph" w:styleId="Quote"><w:name w:val="Quote"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:uiPriority w:val="29"/><w:qFormat/><w:pPr><w:pBdr><w:left w:val="single" w:sz="18" w:space="8" w:color="A5B4FC"/></w:pBdr><w:spacing w:before="96" w:after="96"/><w:ind w:left="612"/></w:pPr><w:rPr><w:i/><w:iCs/><w:color w:val="4B5563"/></w:rPr></w:style>' +
    '<w:style w:type="character" w:styleId="Hyperlink"><w:name w:val="Hyperlink"/><w:basedOn w:val="DefaultParagraphFont"/><w:uiPriority w:val="99"/><w:unhideWhenUsed/><w:rPr><w:color w:val="0563C1"/><w:u w:val="single"/></w:rPr></w:style></w:styles>';
}
const FOOTER = X + '<w:ftr xmlns:w="' + NSW + '"><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>1</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>';

/* root: a cleaned element (from DS.fragment). opt: { title, author, page: 'a4'|'letter', pageNumbers } -> the bytes of the .docx */
function toDocx(root, opt) {
  opt = opt || {}; const page = PAGES[opt.page] || PAGES.a4, S = new Parts({ page: page });
  let body = blocks(root, {}, {}, S, 0).replace(/<\/w:tbl><w:tbl>/g, '</w:tbl><w:p/><w:tbl>');    // an empty paragraph keeps two tables from joining
  if (!body) body = '<w:p/>';
  if (/<\/w:tbl>$/.test(body)) body += '<w:p/>';
  const foot = !!opt.pageNumbers, now = new Date().toISOString().replace(/\.\d+Z$/, 'Z'), who = DF.safeName(opt.author || 'Tech Explorers', 'Tech Explorers');
  const sect = '<w:sectPr>' + (foot ? '<w:footerReference w:type="default" r:id="rId4"/>' : '') + '<w:pgSz w:w="' + page.w + '" w:h="' + page.h + '"/><w:pgMar w:top="' + MARGIN + '" w:right="' + MARGIN + '" w:bottom="' + MARGIN + '" w:left="' + MARGIN + '" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr>';
  const files = [];
  files.push({ name: '[Content_Types].xml', data: X + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
    Object.keys(S.exts).map(function (e) { return '<Default Extension="' + e + '" ContentType="image/' + e + '"/>'; }).join('') +
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
    '<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>' +
    (foot ? '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>' : '') +
    '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>' });
  files.push({ name: '_rels/.rels', data: X + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>' });
  files.push({ name: 'docProps/core.xml', data: X + '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>' + esc(opt.title || '') +
    '</dc:title><dc:creator>' + esc(who) + '</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">' + now + '</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">' + now + '</dcterms:modified></cp:coreProperties>' });
  files.push({ name: 'docProps/app.xml', data: X + '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Tech Explorers</Application></Properties>' });
  files.push({ name: 'word/document.xml', data: X + '<w:document' + NSDOC + '><w:body>' + body + sect + '</w:body></w:document>' });
  files.push({ name: 'word/_rels/document.xml.rels', data: X + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>' +
    (foot ? '<Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>' : '') + S.rels.join('') + '</Relationships>' });
  files.push({ name: 'word/styles.xml', data: stylesXml() }); files.push({ name: 'word/numbering.xml', data: numberingXml(S) });
  files.push({ name: 'word/settings.xml', data: X + '<w:settings xmlns:w="' + NSW + '"><w:zoom w:percent="100"/><w:defaultTabStop w:val="720"/><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>' });
  if (foot) files.push({ name: 'word/footer1.xml', data: FOOTER });
  S.media.forEach(function (m) { files.push(m); });
  return DF.zip(files);
}
/* a picture kind that Word cannot show (WebP) is drawn again as PNG first; returns a promise of the root */
function prepare(root) {
  const jobs = [];
  Array.prototype.slice.call(root.querySelectorAll('img')).forEach(function (img) {
    const info = DF.parseDataImage(img.getAttribute('src')); if (!info) { img.remove(); return; }
    if (info.type !== 'webp') return;
    jobs.push(new Promise(function (ok) {
      const im = new Image(); im.onload = function () {
        try { const cv = document.createElement('canvas'); cv.width = info.w; cv.height = info.h; cv.getContext('2d').drawImage(im, 0, 0); const u = cv.toDataURL('image/png'); if (DF.isSafeImage(u)) img.setAttribute('src', u); else img.remove(); } catch (e) { img.remove(); }
        ok();
      }; im.onerror = function () { img.remove(); ok(); }; im.src = img.getAttribute('src');
    }));
  });
  return Promise.all(jobs).then(function () { return root; });
}
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
function saveDocx(root, name, opt) { return prepare(root).then(function (r) { return DF.download(toDocx(r, Object.assign({ title: name }, opt)), DF.safeName(name, 'My document') + '.docx', DOCX_MIME); }); }

/* ---------- a web page and plain text ---------- */
const PAGE_CSS = 'body{font-family:Calibri,Carlito,Arial,sans-serif;font-size:12pt;line-height:1.35;max-width:46rem;margin:2rem auto;padding:0 1rem;color:#111}h1{font-size:20pt;color:#312e81}h2{font-size:16pt;color:#3730a3}h3{font-size:13pt;color:#4338ca}' +
  '[data-st=title]{font-size:26pt;font-weight:700;color:#1e1b4b}[data-st=subtitle]{font-size:14pt;font-style:italic;color:#4b5563}table{border-collapse:collapse}table[data-bd=grid] td,table[data-bd=grid] th{border:1px solid #808080}table[data-bd=box]{border:1px solid #808080}td,th{padding:4px 8px;vertical-align:top}' +
  'img{max-width:100%;height:auto}hr[data-pb]{border:0;border-top:1px dashed #aaa}blockquote{margin-left:0;padding-left:1rem;border-left:4px solid #a5b4fc;color:#4b5563;font-style:italic}';
function toHtml(root, title) {
  const t = esc(title || 'My document');
  return '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data:; style-src \'unsafe-inline\'; base-uri \'none\'; form-action \'none\'">' +
    '<title>' + t + '</title><style>' + PAGE_CSS + '</style></head><body>' + root.innerHTML + '</body></html>';
}
function saveHtml(root, name) { return DF.download(toHtml(root, name), DF.safeName(name, 'My document') + '.html', 'text/html;charset=utf-8'); }
function saveText(root, name) { return DF.download('\uFEFF' + DS.plainText(root).replace(/\n/g, '\r\n'), DF.safeName(name, 'My document') + '.txt', 'text/plain;charset=utf-8'); }

CC.docx = { toDocx: toDocx, prepare: prepare, saveDocx: saveDocx, toHtml: toHtml, saveHtml: saveHtml, saveText: saveText, MIME: DOCX_MIME, PAGES: PAGES, DEFAULT: DEFAULT };
})();
