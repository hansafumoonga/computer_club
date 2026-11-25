/* tools.js - the Tools screen: two real tools, a Word Processor and a Number Grid, with no lessons or hints. Each tool's files are
   fetched the first time its tab is opened, so the rest of the site opens as fast as it always did. */
(function () {
'use strict';
const CC = window.CC;
const TOOLS = [
  { id: 'writer', label: '📝 Word Processor', files: ['js/docfile.js', 'js/docsafe.js', 'js/clipart.js', 'js/docx.js', 'js/writer.js'], mount: 'writerMount' },
  { id: 'sheet', label: '📊 Number Grid', files: ['css/sheet.css', 'js/docfile.js', 'js/sheetfmt.js', 'js/sheetparse.js', 'js/sheetcalc.js', 'js/sheetbook.js', 'js/xlsx.js', 'js/sheetdoc.js', 'js/sheetchart.js', 'js/sheet.js'], mount: 'sheetMount' }
];
let built = false, current = 'writer'; const panes = {}, tabs = {}, inst = {}, loading = {};
function message(pane, text) { pane.textContent = ''; const p = document.createElement('p'); p.className = 'tl-loading'; p.textContent = text; pane.appendChild(p); }
function select(id) {
  current = id; Object.keys(tabs).forEach(function (k) { const on = k === id; tabs[k].classList.toggle('on', on); tabs[k].setAttribute('aria-selected', on ? 'true' : 'false'); panes[k].hidden = !on; });
  const t = TOOLS.filter(function (x) { return x.id === id; })[0], pane = panes[id];
  if (inst[id]) { inst[id].show(); return; }
  if (loading[id]) return;
  message(pane, 'Loading ' + t.label.replace(/^\S+\s/, '') + '...');
  loading[id] = CC.loadFiles(t.files).then(function () {
    if (typeof CC.tools[t.mount] !== 'function') throw new Error(t.id + ' did not start');
    pane.textContent = ''; inst[id] = CC.tools[t.mount](pane); if (current === id) inst[id].show();
  }).catch(function (e) { console.error(e); message(pane, t.label.replace(/^\S+\s/, '') + ' could not be loaded. Please check your connection and try again.'); }).then(function () { loading[id] = null; });
}
function open(root, which) {
  if (!built) {
    root.textContent = ''; built = true;
    const bar = document.createElement('div'); bar.className = 'tl-tabs'; bar.setAttribute('role', 'tablist'); const body = document.createElement('div'); body.className = 'tl-body';
    TOOLS.forEach(function (t) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'tl-tab'; b.textContent = t.label; b.setAttribute('role', 'tab'); b.addEventListener('click', function () { select(t.id); }); bar.appendChild(b); tabs[t.id] = b;
      const p = document.createElement('div'); p.className = 'tl-pane'; p.setAttribute('role', 'tabpanel'); p.hidden = true; body.appendChild(p); panes[t.id] = p;
    });
    const note = document.createElement('span'); note.className = 'tl-note'; note.textContent = 'Your work is kept on this computer for ' + CC.keep.hours + ' hours after your last change. Download a copy to keep it.'; bar.appendChild(note);
    root.append(bar, body);
  }
  select(which || current);
}
function leave() { Object.keys(inst).forEach(function (k) { if (inst[k] && inst[k].leave) inst[k].leave(); }); }
CC.tools = Object.assign(CC.tools || {}, { open: open, leave: leave, instance: function (id) { return inst[id] || null; } });
})();
