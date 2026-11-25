/* the ZIP packer, XML escaping, safe file names, CSV, and reading a picture's real type and size. Run: node tests/files.test.js */
global.window = {}; global.atob = global.atob || ((s) => Buffer.from(s, 'base64').toString('binary'));
require(require('path').join(__dirname, '..', 'js', 'docfile.js')); const DF = window.CC.docfile; const fs = require('fs'); let fails = 0;
function eq(n, got, want) { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + n + (ok ? '' : ' got=' + JSON.stringify(got) + ' want=' + JSON.stringify(want))); }
const BS = String.fromCharCode(92), TAB = String.fromCharCode(9), NL = String.fromCharCode(10), CR = String.fromCharCode(13), BOM = String.fromCharCode(0xFEFF);
// pictures: real files
const FX = require('path').join(__dirname, 'fixtures'); const rd = (f) => new Uint8Array(fs.readFileSync(FX + '/' + f)); const pick = (o) => o && [o.type, o.w, o.h];
eq('png info', pick(DF.imageInfo(rd('t.png'))), ['png', 37, 21]); eq('jpeg info', pick(DF.imageInfo(rd('t.jpg'))), ['jpeg', 37, 21]); eq('gif info', pick(DF.imageInfo(rd('t.gif'))), ['gif', 37, 21]);
eq('webp (lossy) info', pick(DF.imageInfo(rd('t.webp'))), ['webp', 37, 21]); eq('webp (lossless) info', pick(DF.imageInfo(rd('tl.webp'))), ['webp', 37, 21]); eq('png with transparency', pick(DF.imageInfo(rd('alpha.png'))), ['png', 50, 40]);
eq('not a picture (svg text)', DF.imageInfo(new Uint8Array(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><script>alert(1)</script></svg>'))), null);
eq('not a picture (zeros)', DF.imageInfo(new Uint8Array(64)), null); eq('truncated PNG', DF.imageInfo(rd('t.png').slice(0, 20)), null);
const b64 = (f, mime) => 'data:' + mime + ';base64,' + fs.readFileSync(FX + '/' + f).toString('base64');
eq('data png accepted', !!DF.parseDataImage(b64('t.png', 'image/png')), true); eq('data jpeg accepted', !!DF.parseDataImage(b64('t.jpg', 'image/jpeg')), true); eq('data gif accepted', !!DF.parseDataImage(b64('t.gif', 'image/gif')), true); eq('data webp accepted', !!DF.parseDataImage(b64('t.webp', 'image/webp')), true);
eq('label must agree with the bytes (png labelled jpeg)', DF.parseDataImage(b64('t.png', 'image/jpeg')), null);
eq('svg data refused', DF.parseDataImage('data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>').toString('base64')), null);
eq('javascript: refused', DF.parseDataImage('javascript:alert(1)'), null); eq('http picture refused', DF.parseDataImage('https://example.com/a.png'), null);
eq('text/html data refused', DF.parseDataImage('data:text/html;base64,PHNjcmlwdD4='), null); eq('not base64 refused', DF.parseDataImage('data:image/png;base64,@@@'), null);
eq('huge refused', DF.parseDataImage('data:image/png;base64,' + 'A'.repeat(5000000)), null);
eq('png with a script hidden after the picture still parses as a picture only', pick(DF.parseDataImage('data:image/png;base64,' + Buffer.concat([fs.readFileSync(FX + '/t.png'), Buffer.from('<script>alert(1)</script>')]).toString('base64'))), ['png', 37, 21]);
// file names
eq('name: slashes', DF.safeName('a/b' + BS + 'c:d*e?f"g<h>i|j'), 'a b c d e f g h i j'); eq('name: empty', DF.safeName('   ', 'Fallback'), 'Fallback'); eq('name: reserved', DF.safeName('CON'), 'My document'); eq('name: dots', DF.safeName('..hidden.'), 'hidden');
eq('name: direction trick removed', DF.safeName('invoice' + String.fromCharCode(0x202E) + 'fdp.exe'), 'invoicefdp.exe'); eq('name: long', DF.safeName('x'.repeat(200)).length, 60); eq('name: control chars', DF.safeName('a' + String.fromCharCode(0) + 'b' + String.fromCharCode(7) + 'c'), 'abc');
// xml
eq('xml: escape', DF.esc('<a href="x">&' + "'" + '</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&apos;&lt;/a&gt;');
eq('xml: control chars removed', DF.esc('a' + String.fromCharCode(0, 8) + 'b' + String.fromCharCode(11) + 'c' + String.fromCharCode(0xFFFF) + 'd'), 'abcd'); eq('xml: emoji kept', DF.esc('hi ' + String.fromCharCode(0xD83D, 0xDE00)), 'hi ' + String.fromCharCode(0xD83D, 0xDE00)); eq('xml: lone surrogate dropped', DF.esc('a' + String.fromCharCode(0xD83D) + 'b'), 'ab');
// csv
const line = (rows) => DF.toCSV(rows).replace(BOM, '').split(CR + NL)[0];
eq('csv: plain', DF.toCSV([['a', 'b'], [1, 2.5]]), BOM + 'a,b' + CR + NL + '1,2.5' + CR + NL); eq('csv: quotes and commas', line([['x,y', 'say "hi"']]), '"x,y","say ""hi"""');
eq('csv: formula text is defused', line([['=1+1', '+SUM(A1)', '-2+3', '@A1', TAB + 'cmd', '=HYPERLINK("http://evil","x")']]), "'=1+1,'+SUM(A1),'-2+3,'@A1,'" + TAB + 'cmd,"' + "'=HYPERLINK(" + '""http://evil"",""x"")"');
eq('csv: a real negative number is left alone', line([[-5, true, null]]), '-5,TRUE,');
eq('csv: BOM first', DF.toCSV([['a']]).charCodeAt(0), 0xFEFF);
// reading csv / tsv
eq('parse: simple', DF.parseDelimited('a,b' + CR + NL + '1,2' + NL, ',').rows, [['a', 'b'], ['1', '2']]); eq('parse: quoted', DF.parseDelimited('"a,1","say ""x""","l1' + NL + 'l2"', ',').rows, [['a,1', 'say "x"', 'l1' + NL + 'l2']]);
eq('parse: tabs', DF.parseDelimited('a' + TAB + 'b' + NL + '1' + TAB + '2', TAB).rows, [['a', 'b'], ['1', '2']]);
eq('parse: too big refused', DF.parseDelimited('x'.repeat(3000000), ',').error, 'too big'); eq('parse: columns capped', DF.parseDelimited(Array(300).fill('1').join(','), ',').rows[0].length, 52); eq('parse: rows capped', DF.parseDelimited('1' + NL).rows ? DF.parseDelimited('1' + NL.repeat(1) + ('1' + NL).repeat(5000), ',').rows.length : 0, 2000);
eq('parse: an unfinished quote does not hang', DF.parseDelimited('"abc', ',').rows, [['abc']]);
// zip: write a file for Python to check
const files = [{ name: '[Content_Types].xml', data: '<a/>' }, { name: 'word/document.xml', data: '<w:t>h' + String.fromCharCode(0xE9) + 'llo ' + String.fromCharCode(0x2603) + '</w:t>' }, { name: 'word/media/image1.png', data: rd('t.png') }, { name: 'empty.txt', data: '' }];
fs.writeFileSync(require('path').join(require('os').tmpdir(), 'te-test.zip'), Buffer.from(DF.zip(files)));       // written to the temporary folder, never into the project eq('crc32 of 123456789', DF.crc32(new Uint8Array(Buffer.from('123456789'))), 0xCBF43926);
console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
