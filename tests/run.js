/* Runs every test in this folder and prints one summary. Needs only Node (no packages): node tests/run.js
   formats.test.js  number formats          engine.test.js  formulas and the workbook
   fuzz.test.js     hostile input           files.test.js   ZIP, file names, CSV, pictures
   (The sanitiser and the Word and Excel files are also checked in a real browser and in real Word and Excel; see README.md, Security.) */
const cp = require('child_process'), path = require('path');
const files = ['formats.test.js', 'engine.test.js', 'files.test.js', 'fuzz.test.js'];
let bad = 0;
files.forEach(function (f) {
  const r = cp.spawnSync(process.execPath, [path.join(__dirname, f)], { encoding: 'utf8', timeout: 240000 }), out = (r.stdout || '') + (r.stderr || '');
  const last = out.trim().split('\n').filter(function (l) { return /PASSED|FAILED|FUZZ|Error/.test(l); }).slice(-1)[0] || out.trim().split('\n').slice(-1)[0];
  const ok = r.status === 0 && !/FAIL(ED)?\b|FUZZ PROBLEM|Error/.test(out.replace(/PASS /g, ''));
  console.log((ok ? 'ok     ' : 'FAILED ') + f + '  ' + last); if (!ok) { bad++; console.log(out.split('\n').filter(function (l) { return /FAIL|PROBLEM|Error/.test(l); }).slice(0, 10).join('\n')); }
});
console.log(bad ? '\n' + bad + ' test file(s) failed' : '\nAll tests passed');
process.exit(bad ? 1 : 0);
