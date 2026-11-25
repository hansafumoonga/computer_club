/* 40,000 random and hostile formulas and damaged saved copies: nothing may throw and nothing may be swallowed. Run: node tests/fuzz.test.js */
global.window = {};
const J = require('path').join(__dirname, '..', 'js') + '/';
require(J + 'docfile.js'); require(J + 'sheetfmt.js'); require(J + 'sheetparse.js'); require(J + 'sheetcalc.js'); require(J + 'sheetbook.js');
const CC = window.CC, P = CC.sheetparse, K = CC.sheetcalc, Book = CC.sheetbook.Book;
let seed = 12345; function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; } function pick(a) { return a[Math.floor(rnd() * a.length)]; }
const names = K.functionNames();
const atoms = ['1', '0', '-1', '2.5', '1e308', '1E-308', '"a"', '""', '"x""y"', 'TRUE', 'FALSE', 'A1', 'B2', '$C$3', 'A1:B3', 'A:A', '1:2', 'Sheet2!A1', "'S 1'!A1:B2", 'ZZ99999', '#N/A', '#REF!', 'foo', '1%', '(', ')', ',', '+', '-', '*', '/', '^', '&', '=', '<>', '<=', '>', ' ', '!', ':', '"', "'", '$', '#', '@', '\u0000', '\u202e', '\ud83d\ude00', '\ud83d'];
function randomFormula() {
  const parts = ['='], n = 1 + Math.floor(rnd() * 14);
  for (let i = 0; i < n; i++) { const r = rnd(); if (r < 0.3) parts.push(pick(names) + '('); else parts.push(pick(atoms)); if (rnd() < 0.2) parts.push(')'); if (rnd() < 0.3) parts.push(','); }
  return parts.join('');
}
function validFormula(depth) {
  depth = depth || 0; const r = rnd();
  if (depth > 3 || r < 0.35) return pick(['1', '2.5', 'A1', 'B2', '"txt"', 'A1:B3', 'TRUE', '$A$1', 'C1:C20', '0', '-3', '1E5']);
  if (r < 0.6) return validFormula(depth + 1) + pick(['+', '-', '*', '/', '^', '&', '=', '<', '>=', '<>']) + validFormula(depth + 1);
  if (r < 0.65) return '(' + validFormula(depth + 1) + ')';
  const f = pick(names), argc = Math.floor(rnd() * 4), args = []; for (let i = 0; i < argc; i++) args.push(validFormula(depth + 1)); return f + '(' + args.join(',') + ')';
}
function mutate(s) { const a = s.split(''); const k = 1 + Math.floor(rnd() * 3); for (let i = 0; i < k; i++) { const op = rnd(), p = Math.floor(rnd() * (a.length + 1)); if (op < 0.4) a.splice(p, 1); else if (op < 0.8) a.splice(p, 0, pick(atoms)); else a[p] = pick(atoms); } return a.join(''); }
const b = new Book(); b.addSheet('Sheet2'); b.addSheet('S 1');
for (let r = 0; r < 20; r++) for (let c = 0; c < 4; c++) b.setEntry(0, r, c, pick(['1', '2', '3.5', 'abc', 'Hello World', 'TRUE', '', '=1/0', '12%', '31/12/2026', '0042', '-7']));
let accepted = 0, rejected = 0, errors = 0, t0 = Date.now(), thrown = 0;
const N = 40000;
for (let i = 0; i < N; i++) {
  const f = '=' + (i % 3 === 0 ? validFormula() : i % 3 === 1 ? mutate('=' + validFormula()).replace(/^[^=]/, '=$&') : randomFormula().slice(1));
  try {
    const r = b.setEntry(i % 2 ? 1 : 0, 30 + (i % 50), 5 + (i % 20), f);
    if (r.ok) { accepted++; const v = b.get(i % 2 ? 1 : 0, 30 + (i % 50), 5 + (i % 20)); b.display(i % 2 ? 1 : 0, 30 + (i % 50), 5 + (i % 20)); if (v instanceof K.Err) errors++; } else rejected++;
    if (i % 1000 === 999) { b.calcAll(); if (b.snapshot().length > 5e6) throw new Error('huge'); }
  } catch (e) { thrown++; if (thrown < 6) console.log('THROWN for ' + JSON.stringify(f) + ': ' + (e && e.stack || e)); }
}
// structure changes with random formulas present must not throw either
for (let k = 0; k < 40; k++) { try { const op = k % 4; if (op === 0) b.insertRows(0, Math.floor(rnd() * 60), 1 + Math.floor(rnd() * 3)); else if (op === 1) b.deleteRows(0, Math.floor(rnd() * 60), 1 + Math.floor(rnd() * 3)); else if (op === 2) b.insertCols(0, Math.floor(rnd() * 20), 1); else b.deleteCols(0, Math.floor(rnd() * 20), 1); b.calcAll(); } catch (e) { thrown++; console.log('THROWN in structure op ' + k + ': ' + (e && e.stack || e)); } }
// loading arbitrary mutated snapshots
const snap = b.snapshot(); let loaded = 0, bad = 0;
for (let i = 0; i < 300; i++) { const s2 = mutate(snap.slice(0, 4000)) + snap.slice(4000); try { const x = Book.fromSnapshot(s2); if (x) { loaded++; x.calcAll(); x.snapshot(); } else bad++; } catch (e) { thrown++; console.log('THROWN loading: ' + (e && e.stack || e)); } }
console.log('formulas: accepted ' + accepted + ', rejected ' + rejected + ', evaluating to an error ' + errors + '; snapshots loaded ' + loaded + ', refused ' + bad + '; ms ' + (Date.now() - t0));
console.log(thrown === 0 && K.state.bug === null ? 'FUZZ OK: nothing thrown, nothing swallowed' : 'FUZZ PROBLEM: thrown=' + thrown + ' swallowed=' + (K.state.bug && (K.state.bug.stack || K.state.bug)));
