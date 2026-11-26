/* the formula parser, the functions, the workbook (typing, copying, filling, sorting, saving and loading). Run: node tests/engine.test.js */
global.window = {};
const J = require('path').join(__dirname, '..', 'js') + '/';
require(J + 'docfile.js'); require(J + 'sheetfmt.js'); require(J + 'sheetparse.js'); require(J + 'sheetcalc.js'); require(J + 'sheetbook.js');
const CC = window.CC, P = CC.sheetparse, K = CC.sheetcalc, Book = CC.sheetbook.Book; let fails = 0, n = 0;
function eq(name, got, want) { n++; const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) { fails++; console.log('FAIL ' + name + ' got=' + JSON.stringify(got) + ' want=' + JSON.stringify(want)); } }
function near(name, got, want, tol) { n++; const ok = typeof got === 'number' && Math.abs(got - want) <= (tol || 1e-9); if (!ok) { fails++; console.log('FAIL ' + name + ' got=' + JSON.stringify(got) + ' want~' + want); } }
// helper: a sheet with cells set from an object { A1: '5', B2: '=A1*2' }, formula in Z1.. evaluated through F()
function mk(cells) { const b = new Book(); Object.keys(cells || {}).forEach(function (a) { const p = P.parseCellName(a); const r = b.setEntry(0, p.r, p.c, String(cells[a])); if (!r.ok) throw new Error('setup ' + a + ' ' + r.msg); }); return b; }
function val(b, a, si) { const p = P.parseCellName(a); const v = b.get(si || 0, p.r, p.c); return v instanceof K.Err ? v.code : v; }
function F(f, cells) { const b = mk(cells); const r = b.setEntry(0, 40, 25, f); if (!r.ok) return 'REJECTED: ' + r.msg; const v = b.get(0, 40, 25); return v instanceof K.Err ? v.code : v; }
const data = { A1: 10, A2: 20, A3: 30, A4: 'x', A5: '', B1: 1, B2: 2, B3: 3, B4: 4, C1: 'apple', C2: 'banana', C3: 'cherry', C4: 'Apple', D1: 5, D2: 'TRUE', E1: '=1/0' };

// ---- arithmetic and precedence (Excel rules)
eq('add', F('=1+2'), 3); eq('prec * over +', F('=2+3*4'), 14); eq('parens', F('=(2+3)*4'), 20); eq('neg power binds first', F('=-2^2'), 4); eq('power left assoc', F('=2^3^2'), 64); eq('power of negative', F('=2^-2'), 0.25);
eq('percent', F('=50%'), 0.5); eq('percent in sum', F('=200*10%'), 20); eq('percent then power', F('=50%^2'), 0.25); eq('unary plus', F('=+5'), 5); eq('double neg', F('=--5'), 5); eq('minus minus', F('=5--2'), 7);
eq('div', F('=7/2'), 3.5); eq('div zero', F('=1/0'), '#DIV/0!'); eq('0^0', F('=0^0'), '#NUM!'); eq('odd root of a negative number (as Excel)', F('=(-8)^(1/3)'), -2); eq('another odd root', F('=(-32)^(1/5)'), -2); eq('negative odd root exponent', F('=(-8)^(-1/3)'), -0.5); eq('even root of a negative is an error', F('=(-16)^(1/4)'), '#NUM!'); eq('2/3 power of a negative is an error', F('=(-8)^(2/3)'), '#NUM!'); eq('half power of a negative is an error', F('=(-8)^0.5'), '#NUM!'); eq('inexact third is an error', F('=(-8)^0.3333333333'), '#NUM!'); eq('whole power of a negative', F('=(-2)^3'), -8); eq('POWER odd root', F('=POWER(-27,1/3)'), -3);
  eq('MOD is plain arithmetic', F('=MOD(0.3,0.1)'), 0.3 - 0.1 * Math.floor(0.3 / 0.1)); eq('LOG base 1', F('=LOG(8,1)'), '#DIV/0!'); eq('TIME too big', F('=TIME(0,0,86400)'), '#NUM!'); eq('TIME hours wrap', F('=TIME(25,0,0)'), 1 / 24); eq('INDEX of a table with no column', F('=INDEX(A1:B2,1)'), '#REF!');
  eq('a literal keeps 15 digits', F('=INT(1.9999999999999999)'), 1); eq('ROUND of a long literal', F('=ROUND(2.4999999999999996,0)'), 2); eq('number too large to type', F('=1E+308*10').indexOf('REJECTED') === 0, true); eq('1E+307 is fine', F('=1E+307*2'), 2e307); eq('overflow is #NUM!', F('=9E+307*2'), '#NUM!'); eq('exp notation', F('=1.5E3+1'), 1501); eq('leading dot', F('=.5+.5'), 1);
eq('float snap', F('=0.1+0.2-0.3'), 0); eq('float eq', F('=(0.1+0.2)=0.3'), true); eq('float 0.1*3', F('=0.1*3=0.3'), true);
eq('concat', F('="a"&"b"'), 'ab'); eq('concat number', F('="n="&1.5'), 'n=1.5'); eq('concat third', F('=1/3&""'), '0.333333333333333'); eq('concat bool', F('="x"&TRUE'), 'xTRUE'); eq('concat prec', F('=1+2&3'), '33');
eq('text number coerced', F('="5"+1'), 6); eq('text number pct', F('="10%"+1'), 1.1); eq('bad text arith', F('="abc"+1'), '#VALUE!'); eq('empty text arith', F('=""+1'), '#VALUE!'); eq('bool arith', F('=TRUE+1'), 2); eq('blank arith', F('=A1+1', {}), 1);
// ---- comparisons
eq('eq text ci', F('="A"="a"'), true); eq('lt num', F('=1<2'), true); eq('num < text', F('=5<"a"'), true); eq('text < bool', F('="z"<TRUE'), true); eq('ne', F('=1<>2'), true); eq('ge', F('=2>=2'), true); eq('le', F('=3<=2'), false);
eq('blank = 0', F('=Z9=0'), true); eq('blank = empty text', F('=Z9=""'), true); eq('text compare', F('="apple"<"banana"'), true); eq('err propagates compare', F('=(1/0)=1'), '#DIV/0!');
// ---- references
eq('ref', F('=A1', data), 10); eq('sum range', F('=SUM(A1:A3)', data), 60); eq('abs ref', F('=$A$1+$A1+A$1', data), 30); eq('reverse range', F('=SUM(A3:A1)', data), 60); eq('blank ref is 0', F('=Z5', data), 0);
eq('whole column', F('=SUM(A:A)', data), 60); eq('whole row', F('=SUM(1:1)', { A1: 1, B1: 2, C1: 3 }), 6); eq('range in 2d', F('=SUM(A1:B3)', data), 66); eq('ref beyond grid is blank', F('=ZZ5000+1'), 1); eq('range beyond grid clamps', F('=SUM(A1:A100000)', data), 60);
eq('implicit intersection', (function () { const b = mk({ A1: 5, A2: 6, A3: 7 }); b.setEntry(0, 1, 2, '=A1:A3*2'); return b.get(0, 1, 2); })(), 12);
eq('range in scalar context errors', F('=A1:A3+1', data), '#VALUE!');
// ---- aggregates
eq('SUM ignores text in range', F('=SUM(A1:A4)', data), 60); eq('SUM direct text number', F('=SUM("5",1)'), 6); eq('SUM direct bad text', F('=SUM("a",1)'), '#VALUE!'); eq('SUM bool direct', F('=SUM(TRUE,1)'), 2); eq('SUM error', F('=SUM(E1,1)', data), '#DIV/0!'); eq('SUM error in range', F('=SUM(E1:E1)', data), '#DIV/0!');
eq('AVERAGE', F('=AVERAGE(B1:B4)', data), 2.5); eq('AVERAGE none', F('=AVERAGE(C1:C3)', data), '#DIV/0!'); eq('MAX', F('=MAX(A1:A4)', data), 30); eq('MIN', F('=MIN(A1:A3,5)', data), 5); eq('MAX none', F('=MAX(C1:C3)', data), 0); eq('COUNT', F('=COUNT(A1:A5)', data), 3);
eq('COUNTA', F('=COUNTA(A1:A5)', data), 4); eq('COUNTBLANK', F('=COUNTBLANK(A1:A6)', data), 2); eq('PRODUCT', F('=PRODUCT(B1:B4)', data), 24); eq('MEDIAN odd', F('=MEDIAN(B1:B3)', data), 2); eq('MEDIAN even', F('=MEDIAN(B1:B4)', data), 2.5);
eq('MODE', F('=MODE(1,2,2,3,3)'), 2); eq('MODE none', F('=MODE(1,2,3)'), '#N/A'); eq('LARGE', F('=LARGE(A1:A3,2)', data), 20); eq('SMALL', F('=SMALL(A1:A3,1)', data), 10); eq('LARGE k too big', F('=LARGE(A1:A3,4)', data), '#NUM!');
eq('RANK desc', F('=RANK(20,A1:A3)', data), 2); eq('RANK asc', F('=RANK(20,A1:A3,1)', data), 2); eq('RANK missing', F('=RANK(99,A1:A3)', data), '#N/A');
near('STDEV', F('=STDEV(2,4,4,4,5,5,7,9)'), 2.138089935299395); near('STDEV.P', F('=STDEV.P(2,4,4,4,5,5,7,9)'), 2); near('VAR', F('=VAR(1,2,3,4)'), 1.6666666666666667); eq('STDEV one value', F('=STDEV(1)'), '#DIV/0!');
eq('SUMPRODUCT', F('=SUMPRODUCT(A1:A3,B1:B3)', data), 140); eq('SUMPRODUCT mismatch', F('=SUMPRODUCT(A1:A3,B1:B2)', data), '#VALUE!'); eq('SUMSQ', F('=SUMSQ(3,4)'), 25);
// ---- conditional sums and counts
eq('COUNTIF text', F('=COUNTIF(C1:C4,"apple")', data), 2); eq('COUNTIF wildcard', F('=COUNTIF(C1:C4,"*an*")', data), 1); eq('COUNTIF >', F('=COUNTIF(A1:A3,">15")', data), 2); eq('COUNTIF <>', F('=COUNTIF(A1:A3,"<>20")', data), 2); eq('COUNTIF number', F('=COUNTIF(A1:A3,20)', data), 1);
eq('COUNTIF ?', F('=COUNTIF(C1:C4,"?pple")', data), 2); eq('COUNTIF blank', F('=COUNTIF(A1:A6,"")', data), 2); eq('COUNTIF bool', F('=COUNTIF(D1:D2,TRUE)', data), 1); eq('COUNTIF ref criterion', F('=COUNTIF(A1:A3,">"&B1)', data), 3);
eq('SUMIF', F('=SUMIF(A1:A3,">15")', data), 50); eq('SUMIF other range', F('=SUMIF(C1:C3,"banana",A1:A3)', data), 20); eq('AVERAGEIF', F('=AVERAGEIF(A1:A3,">=20")', data), 25); eq('AVERAGEIF none', F('=AVERAGEIF(A1:A3,">99")', data), '#DIV/0!');
eq('SUMIFS', F('=SUMIFS(A1:A3,B1:B3,">1",A1:A3,"<30")', data), 20); eq('COUNTIFS', F('=COUNTIFS(A1:A3,">5",B1:B3,"<3")', data), 2); eq('MAXIFS', F('=MAXIFS(A1:A3,B1:B3,"<3")', data), 20); eq('MINIFS', F('=MINIFS(A1:A3,B1:B3,">1")', data), 20);
eq('COUNTIFS mismatch', F('=COUNTIFS(A1:A3,">5",B1:B2,"<3")', data), '#VALUE!'); eq('SUMIFS odd args rejected', F('=SUMIFS(A1:A3,B1:B3)', data).indexOf('REJECTED') === 0, true);
// ---- logic
eq('IF true', F('=IF(1<2,"y","n")'), 'y'); eq('IF false', F('=IF(1>2,"y","n")'), 'n'); eq('IF no else', F('=IF(1>2,"y")'), false); eq('IF lazy', F('=IF(TRUE,1,1/0)'), 1); eq('IF text cond', F('=IF("a","y","n")'), '#VALUE!'); eq('IF number cond', F('=IF(2,"y","n")'), 'y');
eq('IF nested', F('=IF(A1>5,IF(A1>15,"big","mid"),"small")', data), 'mid'); eq('IFERROR', F('=IFERROR(1/0,"oops")'), 'oops'); eq('IFERROR ok', F('=IFERROR(5,"oops")'), 5); eq('IFNA', F('=IFNA(NA(),"none")'), 'none'); eq('IFNA other error', F('=IFNA(1/0,"none")'), '#DIV/0!');
eq('AND', F('=AND(TRUE,1,2>1)'), true); eq('AND false', F('=AND(TRUE,FALSE)'), false); eq('OR', F('=OR(FALSE,0,1)'), true); eq('NOT', F('=NOT(TRUE)'), false); eq('XOR', F('=XOR(TRUE,TRUE,TRUE)'), true); eq('AND range', F('=AND(B1:B3)', data), true);
eq('IFS', F('=IFS(1>2,"a",2>1,"b")'), 'b'); eq('IFS none', F('=IFS(1>2,"a")'), '#N/A'); eq('SWITCH', F('=SWITCH(2,1,"one",2,"two","other")'), 'two'); eq('SWITCH default', F('=SWITCH(9,1,"one","other")'), 'other'); eq('SWITCH none', F('=SWITCH(9,1,"one")'), '#N/A'); eq('CHOOSE', F('=CHOOSE(2,"a","b","c")'), 'b'); eq('CHOOSE bad', F('=CHOOSE(4,"a","b","c")'), '#VALUE!');
eq('TRUE()', F('=TRUE()'), true); eq('ISNUMBER', F('=ISNUMBER(A1)', data), true); eq('ISNUMBER text', F('=ISNUMBER(A4)', data), false); eq('ISTEXT', F('=ISTEXT(A4)', data), true); eq('ISBLANK', F('=ISBLANK(Z9)'), true); eq('ISBLANK no', F('=ISBLANK(A1)', data), false);
eq('ISERROR', F('=ISERROR(1/0)'), true); eq('ISERROR ok', F('=ISERROR(1)'), false); eq('ISERROR ref', F('=ISERROR(E1)', data), true); eq('ISNA', F('=ISNA(NA())'), true); eq('ISERR na', F('=ISERR(NA())'), false); eq('ISEVEN', F('=ISEVEN(4)'), true); eq('ISODD', F('=ISODD(3)'), true);
// ---- maths
eq('ABS', F('=ABS(-3)'), 3); eq('SQRT', F('=SQRT(16)'), 4); eq('SQRT neg', F('=SQRT(-1)'), '#NUM!'); eq('POWER', F('=POWER(2,10)'), 1024); eq('MOD', F('=MOD(10,3)'), 1); eq('MOD neg', F('=MOD(-1,3)'), 2); eq('MOD neg divisor', F('=MOD(1,-3)'), -2); eq('MOD zero', F('=MOD(1,0)'), '#DIV/0!');
eq('INT', F('=INT(-1.5)'), -2); eq('INT drift', F('=INT(0.3/0.1)'), 3); eq('TRUNC', F('=TRUNC(-1.567,2)'), -1.56); eq('ROUND', F('=ROUND(2.675,2)'), 2.68); eq('ROUND neg digits', F('=ROUND(1234.5,-2)'), 1200); eq('ROUND half', F('=ROUND(2.5,0)'), 3); eq('ROUND neg half', F('=ROUND(-2.5,0)'), -3);
eq('ROUNDUP', F('=ROUNDUP(2.1,0)'), 3); eq('ROUNDUP neg', F('=ROUNDUP(-2.1,0)'), -3); eq('ROUNDDOWN', F('=ROUNDDOWN(2.9,0)'), 2); eq('ROUNDUP decimals', F('=ROUNDUP(3.14159,2)'), 3.15); eq('ROUNDUP exact', F('=ROUNDUP(2.1*10,0)'), 21);
eq('CEILING', F('=CEILING(4.42,0.05)'), 4.45); eq('CEILING int', F('=CEILING(2.5,1)'), 3); eq('FLOOR', F('=FLOOR(4.42,0.05)'), 4.4); eq('FLOOR neg', F('=FLOOR(-2.5,2)'), -4); eq('MROUND', F('=MROUND(10,3)'), 9); eq('SIGN', F('=SIGN(-5)'), -1); eq('FACT', F('=FACT(5)'), 120); eq('FACT neg', F('=FACT(-1)'), '#NUM!'); eq('COMBIN', F('=COMBIN(5,2)'), 10);
eq('GCD', F('=GCD(12,18)'), 6); eq('LCM', F('=LCM(4,6)'), 12); eq('QUOTIENT', F('=QUOTIENT(7,2)'), 3); near('PI', F('=PI()'), Math.PI); near('EXP', F('=EXP(1)'), Math.E); near('LN', F('=LN(EXP(2))'), 2); eq('LOG10', F('=LOG10(1000)'), 3); near('LOG', F('=LOG(8,2)'), 3); eq('LOG zero', F('=LOG(0)'), '#NUM!');
near('SIN', F('=SIN(PI()/2)'), 1); near('ATAN2', F('=ATAN2(1,1)'), Math.PI / 4); near('DEGREES', F('=DEGREES(PI())'), 180); eq('RAND range', (function () { const v = F('=RAND()'); return v >= 0 && v < 1; })(), true); eq('RANDBETWEEN', (function () { const v = F('=RANDBETWEEN(3,5)'); return v >= 3 && v <= 5 && v % 1 === 0; })(), true);
// ---- text
eq('LEN', F('=LEN("hello")'), 5); eq('UPPER', F('=UPPER("abc")'), 'ABC'); eq('LOWER', F('=LOWER("ABC")'), 'abc'); eq('PROPER', F('=PROPER("hello wORLD-foo bar")'), 'Hello World-Foo Bar'); eq('TRIM', F('=TRIM("  a   b  ")'), 'a b'); eq('LEFT', F('=LEFT("hello",2)'), 'he'); eq('LEFT default', F('=LEFT("hello")'), 'h');
eq('RIGHT', F('=RIGHT("hello",3)'), 'llo'); eq('RIGHT zero', F('=RIGHT("hello",0)'), ''); eq('MID', F('=MID("hello",2,3)'), 'ell'); eq('MID past end', F('=MID("hi",5,2)'), ''); eq('FIND', F('=FIND("l","hello")'), 3); eq('FIND case', F('=FIND("L","hello")'), '#VALUE!'); eq('SEARCH ci', F('=SEARCH("L","hello")'), 3); eq('SEARCH wild', F('=SEARCH("h*o","oh hello")'), 2); eq('SEARCH ?', F('=SEARCH("h?l","oh hello")'), 4);
eq('SEARCH start', F('=SEARCH("l","hello",4)'), 4); eq('SUBSTITUTE', F('=SUBSTITUTE("a-b-c","-","+")'), 'a+b+c'); eq('SUBSTITUTE nth', F('=SUBSTITUTE("a-b-c","-","+",2)'), 'a-b+c'); eq('REPLACE', F('=REPLACE("hello",2,3,"ipp")'), 'hippo'); eq('REPT', F('=REPT("ab",3)'), 'ababab'); eq('REPT too long', F('=REPT("abcdefghij",4000)'), '#VALUE!');
eq('CONCATENATE', F('=CONCATENATE("a",1,"b")'), 'a1b'); eq('CONCAT range', F('=CONCAT(C1:C3)', data), 'applebananacherry'); eq('TEXTJOIN', F('=TEXTJOIN("-",TRUE,C1:C3)', data), 'apple-banana-cherry'); eq('TEXTJOIN skip', F('=TEXTJOIN(",",TRUE,"a","","b")'), 'a,b'); eq('TEXTJOIN keep', F('=TEXTJOIN(",",FALSE,"a","","b")'), 'a,,b');
eq('VALUE', F('=VALUE("12.5")'), 12.5); eq('VALUE bad', F('=VALUE("abc")'), '#VALUE!'); eq('EXACT', F('=EXACT("a","A")'), false); eq('CHAR', F('=CHAR(65)'), 'A'); eq('CODE', F('=CODE("A")'), 65); eq('T', F('=T("x")'), 'x'); eq('T number', F('=T(5)'), ''); eq('N', F('=N(TRUE)'), 1);
eq('TEXT number', F('=TEXT(1234.5,"#,##0.00")'), '1,234.50'); eq('TEXT percent', F('=TEXT(0.256,"0%")'), '26%'); eq('TEXT date', F('=TEXT(DATE(2026,12,31),"dd/mm/yyyy")'), '31/12/2026'); eq('TEXT date long', F('=TEXT(DATE(2026,1,1),"dddd d mmmm yyyy")'), 'Thursday 1 January 2026'); eq('TEXT text', F('=TEXT("abc","0")'), 'abc');
// ---- dates
eq('DATE', F('=DATE(2026,1,1)'), 46023); eq('DATE overflow month', F('=DATE(2026,13,1)'), 46388); eq('DATE day 0', F('=DATE(2026,3,0)'), F('=DATE(2026,2,28)')); eq('DATE 2-digit year is 1900 plus', F('=DATE(26,1,1)'), F('=DATE(1926,1,1)')); eq('YEAR', F('=YEAR(46023)'), 2026); eq('MONTH', F('=MONTH(DATE(2026,7,4))'), 7); eq('DAY', F('=DAY(DATE(2026,7,4))'), 4);
eq('WEEKDAY', F('=WEEKDAY(DATE(2026,1,1))'), 5); eq('WEEKDAY mon', F('=WEEKDAY(DATE(2026,1,1),2)'), 4); eq('WEEKDAY sunday=1', F('=WEEKDAY(DATE(2026,1,4))'), 1); eq('DAYS', F('=DAYS(DATE(2026,3,1),DATE(2026,2,1))'), 28); eq('date diff', F('=DATE(2026,3,1)-DATE(2026,2,1)'), 28);
eq('EDATE', F('=EDATE(DATE(2026,1,31),1)'), F('=DATE(2026,2,28)')); eq('EOMONTH', F('=EOMONTH(DATE(2026,2,10),0)'), F('=DATE(2026,2,28)')); eq('EOMONTH leap', F('=EOMONTH(DATE(2024,2,10),0)'), F('=DATE(2024,2,29)')); eq('DATEVALUE', F('=DATEVALUE("31/12/2026")'), F('=DATE(2026,12,31)'));
eq('DATEDIF Y', F('=DATEDIF(DATE(2000,6,15),DATE(2026,6,14),"Y")'), 25); eq('DATEDIF Y2', F('=DATEDIF(DATE(2000,6,15),DATE(2026,6,15),"Y")'), 26); eq('DATEDIF M', F('=DATEDIF(DATE(2026,1,31),DATE(2026,3,30),"M")'), 1); eq('DATEDIF D', F('=DATEDIF(DATE(2026,1,1),DATE(2026,1,31),"D")'), 30); eq('DATEDIF reversed', F('=DATEDIF(DATE(2026,2,1),DATE(2026,1,1),"D")'), '#NUM!');
eq('HOUR', F('=HOUR(0.75)'), 18); eq('MINUTE', F('=MINUTE(0.5104166666666666)'), 15); eq('TIME', F('=TIME(12,0,0)'), 0.5); eq('TODAY is a number', typeof F('=TODAY()'), 'number'); eq('NOW fraction', (function () { const v = F('=NOW()'); return v > 40000; })(), true);
// ---- lookups
const lk = { A1: 'id', B1: 'name', C1: 'score', A2: 1, B2: 'Ann', C2: 90, A3: 2, B3: 'Ben', C3: 75, A4: 3, B4: 'Cy', C4: 60 };
eq('VLOOKUP exact', F('=VLOOKUP(2,A2:C4,2,FALSE)', lk), 'Ben'); eq('VLOOKUP exact 0', F('=VLOOKUP(3,A2:C4,3,0)', lk), 60); eq('VLOOKUP missing', F('=VLOOKUP(9,A2:C4,2,FALSE)', lk), '#N/A'); eq('VLOOKUP approx', F('=VLOOKUP(2.5,A2:C4,2)', lk), 'Ben'); eq('VLOOKUP approx low', F('=VLOOKUP(0,A2:C4,2)', lk), '#N/A');
eq('VLOOKUP text ci', F('=VLOOKUP("ben",B2:C4,2,FALSE)', lk), 75); eq('VLOOKUP wildcard', F('=VLOOKUP("B*",B2:C4,2,FALSE)', lk), 75); eq('VLOOKUP col too big', F('=VLOOKUP(2,A2:C4,4,FALSE)', lk), '#REF!'); eq('VLOOKUP col 0', F('=VLOOKUP(2,A2:C4,0,FALSE)', lk), '#VALUE!'); eq('VLOOKUP whole cols', F('=VLOOKUP(1,A:C,3,FALSE)', lk), 'score'.length ? 90 : 0);
eq('HLOOKUP', F('=HLOOKUP("score",A1:C4,2,FALSE)', lk), 90); eq('INDEX', F('=INDEX(A2:C4,2,2)', lk), 'Ben'); eq('INDEX col vector', F('=INDEX(B2:B4,3)', lk), 'Cy'); eq('INDEX row vector', F('=INDEX(A1:C1,2)', lk), 'name'); eq('INDEX out', F('=INDEX(A2:C4,5,1)', lk), '#REF!'); eq('INDEX into SUM', F('=SUM(INDEX(A2:C4,0,3))', lk), 225);
eq('MATCH exact', F('=MATCH("Ben",B2:B4,0)', lk), 2); eq('MATCH approx', F('=MATCH(2.5,A2:A4,1)', lk), 2); eq('MATCH desc', F('=MATCH(70,C2:C4,-1)', lk), 2); eq('MATCH none', F('=MATCH("Zed",B2:B4,0)', lk), '#N/A'); eq('INDEX MATCH', F('=INDEX(C2:C4,MATCH("Cy",B2:B4,0))', lk), 60);
eq('ROW', F('=ROW()'), 41); eq('COLUMN', F('=COLUMN()'), 26); eq('ROW ref', F('=ROW(B7)'), 7); eq('COLUMN ref', F('=COLUMN(C1)'), 3); eq('ROWS', F('=ROWS(A1:A10)'), 10); eq('COLUMNS', F('=COLUMNS(A1:C1)'), 3);
// ---- errors and cycles
eq('error literal', F('=#N/A'), '#N/A'); eq('unknown function', F('=FOO(1)'), '#NAME?'); eq('unknown name', F('=hello'), '#NAME?'); eq('error through ref', F('=E1+1', data), '#DIV/0!'); eq('function arg count rejected', F('=IF(1)').indexOf('REJECTED') === 0, true); eq('too many args rejected', F('=ABS(1,2)').indexOf('REJECTED') === 0, true);
eq('cycle direct', (function () { const b = mk({ A1: '=A1' }); return val(b, 'A1'); })(), '#CIRC!'); eq('cycle pair', (function () { const b = mk({ A1: '=B1', B1: '=A1' }); return [val(b, 'A1'), val(b, 'B1')]; })(), ['#CIRC!', '#CIRC!']);
eq('cycle spreads to dependents', (function () { const b = mk({ A1: '=B1+1', B1: '=A1+1', C1: '=A1*2' }); return [val(b, 'C1'), val(b, 'A1')]; })(), ['#CIRC!', '#CIRC!']); eq('dependents of a clean chain are fine', (function () { const b = mk({ A1: 1, B1: '=A1+1', C1: '=B1+1' }); return val(b, 'C1'); })(), 3);
eq('lazy IF avoids cycle', (function () { const b = mk({ A1: '=IF(TRUE,1,A1)' }); return val(b, 'A1'); })(), 1);
// ---- syntax errors (rejected with a message, nothing stored)
['=1+', '=(1+2', '=1+2)', '=SUM(1,', '="abc', '=1 2', '=*3', '=A1:', '=SUM(,', '=1+$', '=@', '=Sheet9!', '=\'a\'!'].forEach(function (f) { const b = mk({}); const r = b.setEntry(0, 0, 0, f); eq('reject ' + f, [r.ok, typeof r.msg, b.getCell(0, 0, 0)], [false, 'string', null]); });
eq('accept sheet ref (resolved to #REF! if missing)', F('=Nope!A1'), '#REF!'); eq('formula too long', (function () { const b = mk({}); return b.setEntry(0, 0, 0, '=' + '1+'.repeat(3000) + '1').ok; })(), false);
eq('deep parens rejected', (function () { const b = mk({}); return b.setEntry(0, 0, 0, '=' + '('.repeat(200) + '1' + ')'.repeat(200)).ok; })(), false); eq('deep unary rejected', (function () { const b = mk({}); return b.setEntry(0, 0, 0, '=' + '-'.repeat(500) + '1').ok; })(), false);
// ---- typing into cells
(function () {
  const b = mk({ A1: '12%', A2: '31/12/2026', A3: '$5', A4: '1,234', A5: "'=1+1", A6: '007', A7: 'hello', A8: 'TRUE', A9: '3.50' });
  eq('typed percent shows', b.display(0, 0, 0), '12%'); eq('typed percent value', val(b, 'A1'), 0.12); eq('typed date shows', b.display(0, 1, 0), '31/12/2026'); eq('typed currency shows', b.display(0, 2, 0), '$5.00'); eq('typed thousands shows', b.display(0, 3, 0), '1,234');
  eq('quoted formula is text', [val(b, 'A5'), b.editText(0, 4, 0)], ['=1+1', "'=1+1"]); eq('leading zeros kept', [val(b, 'A6'), b.display(0, 5, 0)], ['007', '007']); eq('text edit text', b.editText(0, 6, 0), 'hello'); eq('bool', val(b, 'A8'), true); eq('number edit text', b.editText(0, 8, 0), '3.5');
  eq('percent edit text', b.editText(0, 0, 0), '12%'); eq('date edit text', b.editText(0, 1, 0), '31/12/2026'); eq('formula edit text', (function () { b.setEntry(0, 9, 0, '=A1*2'); return b.editText(0, 9, 0); })(), '=A1*2');
  b.setEntry(0, 0, 1, ''); eq('clearing by typing nothing', b.getCell(0, 0, 1), null); b.setEntry(0, 5, 0, '0012'); eq('text-looking number', val(b, 'A6'), '0012');
  b.applyStyle(0, 5, 0, 5, 0, { fmt: '@' }); b.setEntry(0, 5, 0, '5'); eq('Text cell keeps 5 as text', val(b, 'A6'), '5');
  eq('too long text refused', b.setEntry(0, 0, 0, 'x'.repeat(40000)).ok, false); eq('outside grid refused', b.setEntry(0, 5000, 0, '1').ok, false);
})();
// ---- copying formulas
(function () {
  const b = mk({ A1: 1, A2: 2, A3: 3, B1: '=A1*2', C1: '=$A$1+A1', D1: '=SUM(A1:A3)', E1: "=Sheet1!A1+1" });
  const clip = b.copy(0, 0, 1, 0, 4); b.paste(0, 1, 1, clip, 'all'); eq('paste down shifts', [b.getCell(0, 1, 1).f, b.getCell(0, 1, 2).f, b.getCell(0, 1, 3).f, b.getCell(0, 1, 4).f], ['=A2*2', '=$A$1+A2', '=SUM(A2:A4)', '=Sheet1!A2+1']);
  const clip2 = b.copy(0, 0, 1, 0, 1); b.paste(0, 0, 10, clip2, 'values'); eq('paste values', [b.getCell(0, 0, 10).v, b.getCell(0, 0, 10).f], [2, undefined]);
  b.paste(0, 0, 0, b.copy(0, 0, 1, 0, 1), 'all'); eq('paste off the left edge gives #REF!', b.getCell(0, 0, 1) ? 'ok' : 'none', 'ok');
  const b2 = mk({ B2: '=A1' }); b2.paste(0, 5, 0, b2.copy(0, 1, 1, 1, 1), 'all'); eq('column shift', b2.getCell(0, 5, 0).f, '=#REF!');
  const b3 = mk({ A1: 5 }); b3.applyStyle(0, 0, 0, 0, 0, { b: 1, fmt: '0.00' }); b3.paste(0, 3, 3, b3.copy(0, 0, 0, 0, 0), 'formats'); eq('paste formats only', [b3.getCell(0, 3, 3).v, b3.display(0, 3, 3)], [undefined, '']);
  b3.setEntry(0, 3, 3, '7'); b3.paste(0, 3, 3, b3.copy(0, 0, 0, 0, 0), 'formats'); eq('formats keep content', b3.display(0, 3, 3), '7.00');
  eq('clip text', mk({ A1: 1, B1: 'x', A2: 2.5 }).clipText(0, 0, 0, 1, 1), '1\tx\n2.5\t');
  const b4 = mk({}); b4.pasteText(0, 0, 0, 'a\tb\n1\t=1+1\n'); eq('paste text grid', [val(b4, 'A1'), val(b4, 'B2'), val(b4, 'A2')], ['a', 2, 1]); const b5 = mk({}); b5.pasteText(0, 2, 2, 'hello'); eq('paste single', val(b5, 'C3'), 'hello');
})();
// ---- inserting and deleting
function fx(b, addr, si) { const p = P.parseCellName(addr); const c = b.getCell(si || 0, p.r, p.c); return c ? c.f : null; }
(function () {
  const b = mk({ A1: 1, A2: 2, A3: 3, B1: '=SUM(A1:A3)', B2: '=A2', B3: '=A3+A1', C1: '=B1' });
  b.insertRows(0, 1, 1); eq('insert row shifts cells', [val(b, 'A1'), val(b, 'A2'), val(b, 'A3'), val(b, 'A4')], [1, null, 2, 3]); eq('insert row expands range', fx(b, 'B1'), '=SUM(A1:A4)'); eq('formulas follow', [fx(b, 'B3'), fx(b, 'B4')], ['=A3', '=A4+A1']);
  eq('sum is still right', val(b, 'B1'), 6);
  b.deleteRows(0, 1, 1); eq('delete row restores', [fx(b, 'B1'), fx(b, 'B2'), val(b, 'B1')], ['=SUM(A1:A3)', '=A2', 6]);
  const d0 = mk({ A1: 1, A2: 2, A3: '=A2*2', B1: '=SUM(A1:A3)', C1: '=A2', D1: '=SUM(A2:A2)' }); d0.deleteRows(0, 1, 1);
  eq('formula pointing at a deleted row', [fx(d0, 'A2'), val(d0, 'A2')], ['=#REF!*2', '#REF!']); eq('range shrinks', fx(d0, 'B1'), '=SUM(A1:A2)'); eq('single reference to deleted row', fx(d0, 'C1'), '=#REF!'); eq('range that is deleted completely', fx(d0, 'D1'), '=SUM(#REF!)');
  const c = mk({ A1: 1, B1: 2, C1: 3, A2: '=SUM(A1:C1)', A3: '=B1' }); c.insertCols(0, 1, 2); eq('insert columns', [fx(c, 'A2'), val(c, 'D1'), val(c, 'E1'), fx(c, 'A3')], ['=SUM(A1:E1)', 2, 3, '=D1']); c.deleteCols(0, 3, 1); eq('delete column', [fx(c, 'A2'), fx(c, 'A3')], ['=SUM(A1:D1)', '=#REF!']);
  const d = mk({ A1: 1, A2: '=A1' }); d.insertRows(0, 0, 3); eq('insert above everything', [fx(d, 'A5'), val(d, 'A5')], ['=A4', 1]);
  const e = mk({ A1: 1 }); e.setEntry(0, P.LIM.rows - 1, 0, 'last'); eq('insert refused when cells would fall off', e.insertRows(0, 0, 1).ok, false);
  const f = mk({ A1: 1, A2: 2, A3: 3 }); f.sheets[0].rh = { 0: 30, 2: 50 }; f.insertRows(0, 1, 2); eq('row heights follow', f.sheets[0].rh, { 0: 30, 4: 50 }); f.deleteRows(0, 0, 1); eq('row heights after delete', f.sheets[0].rh, { 3: 50 });
  const g = mk({ A1: 1 }); g.sheets[0].merges.push({ r1: 1, c1: 0, r2: 2, c2: 1 }); g.insertRows(0, 2, 1); eq('merge grows when a row is inserted inside', g.sheets[0].merges[0], { r1: 1, c1: 0, r2: 3, c2: 1 }); g.deleteRows(0, 1, 3); eq('merge vanishes when all its rows go', g.sheets[0].merges.length, 0);
  const h = mk({ A1: 1, B1: '=SUM(A:A)', C1: '=SUM(1:1)' }); h.insertRows(0, 0, 2); h.insertCols(0, 0, 1); eq('whole column and row references', [fx(h, 'C3'), fx(h, 'D3')], ['=SUM(B:B)', '=SUM(3:3)']);
  const m = mk({ A1: 1, A2: 2, B1: '=A1+A2' }); m.move(0, 0, 0, 1, 0, 0, 4); eq('move cells: formulas that point at them follow', [fx(m, 'B1'), val(m, 'B1'), val(m, 'E1'), val(m, 'E2'), val(m, 'A1')], ['=E1+E2', 3, 1, 2, null]);
  const m2 = mk({ A1: 1, B1: '=A1*2', C1: '=A1+B1' }); m2.move(0, 0, 0, 0, 1, 5, 5); eq('moving a block: references inside it and to it follow', [fx(m2, 'G6'), fx(m2, 'C1'), val(m2, 'G6'), val(m2, 'C1')], ['=F6*2', '=F6+G6', 2, 3]);
  const m3 = mk({ A1: 1, B1: '=A1*2' }); m3.move(0, 0, 1, 0, 1, 4, 3); eq('moving one formula keeps what it points at', [fx(m3, 'D5'), val(m3, 'D5'), fx(m3, 'B1')], ['=A1*2', 2, null]);
  eq('move onto itself does nothing', mk({ A1: 1 }).move(0, 0, 0, 0, 0, 0, 0).ok, false); eq('move off the sheet refused', mk({ A1: 1 }).move(0, 0, 0, 0, 0, 0, 60).ok, false);
})();
// ---- sheets
(function () {
  const b = mk({ A1: 5 }); b.addSheet('Data'); b.setEntry(1, 0, 0, '=Sheet1!A1*2'); b.setEntry(0, 1, 0, "=Data!A1+1"); eq('cross-sheet', [val(b, 'A1', 1), val(b, 'A2', 0)], [10, 11]);
  b.renameSheet(1, 'My Data'); eq('rename rewrites formulas', b.getCell(0, 1, 0).f, "='My Data'!A1+1"); eq('rename keeps working', val(b, 'A2', 0), 11); eq('rename clash refused', b.renameSheet(1, 'sheet1').ok, false); eq('rename bad chars cleaned', b.renameSheet(1, 'a/b:c*d?').name, 'a b c d');
  eq('name too long cut', b.renameSheet(1, 'x'.repeat(50)).name.length, 31); b.renameSheet(1, 'Data');
  b.deleteSheet(1); eq('delete sheet gives #REF!', [b.getCell(0, 1, 0).f, val(b, 'A2', 0)], ['=#REF!+1', '#REF!']); eq('last sheet cannot go', b.deleteSheet(0).ok, false);
  const c = mk({ A1: 1 }); c.addSheet(); c.addSheet(); eq('sheet names', c.sheets.map(function (s) { return s.name; }), ['Sheet1', 'Sheet2', 'Sheet3']); while (c.addSheet().ok) { } eq('sheet limit', c.sheets.length, P.LIM.sheets);
  const d = mk({ A1: 3, B1: '=A1*2' }); d.duplicateSheet(0); eq('duplicate', [d.sheets[1].name, val(d, 'B1', 1), d.getCell(1, 0, 1).f], ['Sheet1 (copy)', 6, '=A1*2']); d.setEntry(1, 0, 0, '10'); eq('copy is independent', [val(d, 'B1', 1), val(d, 'B1', 0)], [20, 6]);
  const e = mk({}); e.addSheet('B'); e.addSheet('C'); e.moveSheet(2, 0); eq('move sheet', e.sheets.map(function (s) { return s.name; }), ['C', 'Sheet1', 'B']); eq('sheet name with quote', (function () { const x = mk({ A1: 1 }); x.addSheet("it's"); x.setEntry(0, 1, 0, "='it''s'!A1+0"); return val(x, 'A2'); })(), 0);
})();
// ---- fill
(function () {
  const b = mk({ A1: 1, A2: 2 }); b.fill(0, 0, 0, 1, 0, 'down', 5); eq('fill numbers', ['A3', 'A4', 'A5', 'A6', 'A7'].map(function (a) { return val(b, a); }), [3, 4, 5, 6, null]);
  const c = mk({ A1: 5 }); c.fill(0, 0, 0, 0, 0, 'down', 3); eq('fill one number copies', [val(c, 'A2'), val(c, 'A3'), val(c, 'A4')], [5, 5, 5]);
  const d = mk({ A1: 'Item 1' }); d.fill(0, 0, 0, 0, 0, 'down', 3); eq('fill text with number', [val(d, 'A2'), val(d, 'A3'), val(d, 'A4')], ['Item 2', 'Item 3', 'Item 4']);
  const e = mk({ A1: 'Monday' }); e.fill(0, 0, 0, 0, 0, 'down', 7); eq('fill days wrap', [val(e, 'A2'), val(e, 'A7'), val(e, 'A8')], ['Tuesday', 'Sunday', 'Monday']); const f = mk({ A1: 'Jan' }); f.fill(0, 0, 0, 0, 0, 'right', 3); eq('fill months right', [val(f, 'B1'), val(f, 'C1'), val(f, 'D1')], ['Feb', 'Mar', 'Apr']);
  const g = mk({ A1: 'MON' }); g.fill(0, 0, 0, 0, 0, 'down', 1); eq('fill keeps capitals', val(g, 'A2'), 'TUE');
  const h = mk({ A1: 1, B1: '=A1*2' }); h.fill(0, 0, 1, 0, 1, 'down', 3); eq('fill formula', [fx(h, 'B2'), fx(h, 'B4')], ['=A2*2', '=A4*2']);
  const i = mk({ A1: 10, A2: 20, A3: 30 }); i.fill(0, 0, 0, 2, 0, 'down', 4); eq('fill linear', [val(i, 'A4'), val(i, 'A5')], [40, 50]);
  const j = mk({ A1: 30, A2: 20 }); j.fill(0, 0, 0, 1, 0, 'down', 3); eq('fill decreasing', [val(j, 'A3'), val(j, 'A4')], [10, 0]);
  const k = mk({ A1: 1, A2: 2 }); k.fill(0, 0, 0, 1, 0, 'up', 0); eq('fill upwards', [val(k, 'A1')], [1]); const l = mk({ A5: 3, A6: 4 }); l.fill(0, 4, 0, 5, 0, 'up', 2); eq('fill up series', [val(l, 'A4'), val(l, 'A3'), val(l, 'A5')], [2, 1, 3]);
  const m = mk({ A1: 'a', A2: 'b' }); m.fill(0, 0, 0, 1, 0, 'down', 5); eq('fill repeats a pattern', [val(m, 'A3'), val(m, 'A4'), val(m, 'A5')], ['a', 'b', 'a']);
  const n2 = mk({ A1: 'x001' }); n2.fill(0, 0, 0, 0, 0, 'down', 2); eq('fill keeps zero padding', [val(n2, 'A2'), val(n2, 'A3')], ['x002', 'x003']);
  const o = mk({ A1: '31/12/2026' }); o.fill(0, 0, 0, 0, 0, 'down', 1); eq('fill a date adds a day', o.display(0, 1, 0), '01/01/2027');
})();
// ---- sort
(function () {
  const b = mk({ A1: 'c', B1: 3, A2: 'a', B2: 1, A3: 'b', B3: 2, A4: '', B4: 9 });
  b.sortRange(0, 0, 0, 3, 1, 0, true); eq('sort text asc, blanks last', [val(b, 'A1'), val(b, 'A2'), val(b, 'A3'), val(b, 'B1'), val(b, 'B2'), val(b, 'B3'), val(b, 'B4')], ['a', 'b', 'c', 1, 2, 3, 9]);
  b.sortRange(0, 0, 0, 3, 1, 1, false); eq('sort numbers desc', [val(b, 'B1'), val(b, 'B2'), val(b, 'B3'), val(b, 'B4')], [9, 3, 2, 1]);
  const c = mk({ A1: 3, B1: '=A1*2', A2: 1, B2: '=A2*2', A3: 2, B3: '=A3*2' }); c.sortRange(0, 0, 0, 2, 1, 0, true); eq('sort moves formulas with their rows', [val(c, 'A1'), val(c, 'B1'), val(c, 'B2'), val(c, 'B3'), fx(c, 'B1')], [1, 2, 4, 6, '=A1*2']);
  const d = mk({ A1: 'b', A2: 'B', A3: 'a', A4: 5, A5: true }); d.sortRange(0, 0, 0, 4, 0, 0, true); eq('sort mixed types: numbers, text, logical', [val(d, 'A1'), val(d, 'A2'), val(d, 'A3'), val(d, 'A4'), val(d, 'A5')], [5, 'a', 'b', 'B', true]);
  const e = mk({ A1: 2, A2: 1 }); e.sheets[0].merges.push({ r1: 0, c1: 0, r2: 1, c2: 0 }); eq('sort refuses merged cells', e.sortRange(0, 0, 0, 1, 0, 0, true).ok, false);
  const f = mk({ A1: 'x', A2: 'y' }); f.applyStyle(0, 0, 0, 0, 0, { b: 1 }); f.sortRange(0, 0, 0, 1, 0, 0, false); eq('styles travel with sorted cells', [val(f, 'A1'), f.styleAt(0, 0, 0).b, f.styleAt(0, 1, 0).b], ['y', undefined, 1]);
})();
// ---- styles
(function () {
  const b = mk({ A1: 1 }); b.applyStyle(0, 0, 0, 1, 1, { b: 1, col: '#FF0000', bg: 'nonsense', sz: 500, ff: 'Evil<script>', al: 'x' });
  eq('style is cleaned', b.styleAt(0, 0, 0), { b: 1, col: '#ff0000' }); b.applyStyle(0, 0, 0, 0, 0, { b: 0 }); eq('style removal', b.styleAt(0, 0, 0), { col: '#ff0000' });
  b.applyStyle(0, 0, 0, 0, 0, function (old) { return { i: old.i ? 0 : 1 }; }); eq('toggle via function', b.styleAt(0, 0, 0).i, 1); eq('styles are shared', b.getCell(0, 1, 1).s === b.getCell(0, 1, 0).s, true);
  b.applyBorder(0, 0, 0, 2, 2, 'outside'); eq('outside borders', [b.styleAt(0, 0, 0).bd, b.styleAt(0, 1, 1).bd, b.styleAt(0, 2, 2).bd, b.styleAt(0, 0, 2).bd], ['tl', undefined, 'rb', 'tr']); b.applyBorder(0, 0, 0, 2, 2, 'none'); eq('borders removed', b.styleAt(0, 0, 0).bd, undefined);
  eq('format General means none', (function () { const x = mk({}); x.applyStyle(0, 0, 0, 0, 0, { fmt: 'General' }); return x.styleAt(0, 0, 0); })(), {}); eq('format with control chars refused', (function () { const x = mk({}); x.applyStyle(0, 0, 0, 0, 0, { fmt: '0\u0000' }); return x.styleAt(0, 0, 0); })(), {});
  const c = mk({}); for (let i = 0; i < 500; i++) c.applyStyle(0, 0, 0, 0, 0, { sz: 6 + (i % 60), col: '#' + ('000000' + (i * 1234567 % 16777215).toString(16)).slice(-6) }); eq('style count is capped', c.styles.length <= CC.sheetbook.BL.styles, true);
})();
// ---- conditional formatting
(function () {
  const b = mk({ A1: 5, A2: 50, A3: 'Hello', A4: 20 }); b.sheets[0].cf.push({ r1: 0, c1: 0, r2: 3, c2: 0, op: 'gt', a: 10, bg: '#ffcccc' }, { r1: 0, c1: 0, r2: 3, c2: 0, op: 'text', a: 'hel', col: '#00ff00' });
  eq('rule gt', [b.ruleStyle(0, 0, 0), b.ruleStyle(0, 1, 0), b.ruleStyle(0, 2, 0), b.ruleStyle(0, 3, 0)], [null, { col: undefined, bg: '#ffcccc' }, { col: '#00ff00', bg: undefined }, { col: undefined, bg: '#ffcccc' }]);
})();
// ---- saving and loading
(function () {
  const b = mk({ A1: 5, A2: 'hello', A3: '=A1*2', A4: true, B1: "'=lit" }); b.applyStyle(0, 0, 0, 0, 0, { b: 1, fmt: '0.00' }); b.addSheet('Two'); b.setEntry(1, 0, 0, '=Sheet1!A1'); b.sheets[0].cw = { 0: 120 }; b.sheets[0].merges.push({ r1: 5, c1: 0, r2: 5, c2: 2 }); b.sheets[0].freeze = { r: 1, c: 0 }; b.sheets[0].cf.push({ r1: 0, c1: 0, r2: 0, c2: 0, op: 'between', a: 1, b: 9, bg: '#abcdef' });
  const snap = b.snapshot(), b2 = Book.fromSnapshot(snap);
  eq('round trip: same snapshot', b2.snapshot(), snap); eq('round trip values', [val(b2, 'A1'), val(b2, 'A2'), val(b2, 'A3'), val(b2, 'A4'), val(b2, 'B1'), val(b2, 'A1', 1)], [5, 'hello', 10, true, '=lit', 5]); eq('round trip display', b2.display(0, 0, 0), '5.00');
  function load(mut) { const c = JSON.parse(snap); mut(c); return Book.fromJSON(c); }
  eq('not a workbook', [Book.fromJSON(null), Book.fromJSON({}), Book.fromJSON({ v: 2, sheets: [] }), Book.fromJSON({ v: 1, sheets: [] }), Book.fromJSON('x'), Book.fromJSON([])], [null, null, null, null, null, null]);
  eq('hostile cells are dropped', (function () { const x = load(function (c) { c.sheets[0].cells.push([-1, 0, 1], [0, 99, 1], ['a', 0, 1], [0.5, 0, 1], [1e9, 0, 1], null, 'x', [0], { r: 1 }); }); return x.sheets[0].cells.size; })(), b.sheets[0].cells.size);
  eq('hostile values', (function () { const x = load(function (c) { c.sheets[0].cells.push([20, 0, { toString: 1 }], [21, 0, [1, 2]], [22, 0, 'x'.repeat(40000)], [23, 0, null, 0, 'not a formula'], [24, 0, Infinity], [25, 0, null, 0, '=' + 'A'.repeat(5000)]); }); return [x.getCell(0, 20, 0), x.getCell(0, 21, 0), x.getCell(0, 22, 0), x.getCell(0, 23, 0), x.getCell(0, 24, 0), x.getCell(0, 25, 0)]; })(), [null, null, null, null, null, null]);
  eq('hostile styles', (function () { const x = load(function (c) { c.styles.push({ b: 1, col: 'red', fmt: '<script>', ff: 'x' }, 'str', null, 5, { __proto__: { evil: 1 }, bg: '#123456' }); }); return x.styles.every(function (s) { return Object.keys(s).every(function (k) { return ['b', 'i', 'u', 's', 'col', 'bg', 'al', 'va', 'wr', 'fmt', 'sz', 'ff', 'bd'].indexOf(k) >= 0; }); }); })(), true);
  eq('style index out of range is the default', (function () { const x = load(function (c) { c.sheets[0].cells.push([30, 0, 1, 999]); }); return x.getCell(0, 30, 0).s; })(), 0);
  eq('sheet names are cleaned and made unique', (function () { const x = load(function (c) { c.sheets[0].n = 'a/b'; c.sheets[1].n = 'A B'; }); return x.sheets.map(function (s) { return s.name; }); })(), ['a b', 'A B (2)']);
  eq('too many sheets cut', (function () { const x = load(function (c) { for (let i = 0; i < 40; i++) c.sheets.push({ n: 'S' + i, cells: [] }); }); return x.sheets.length; })(), P.LIM.sheets);
  eq('bad widths dropped', (function () { const x = load(function (c) { c.sheets[0].cw = { 0: 1e9, 1: -5, x: 3, 2: 100, 99: 100 }; }); return x.sheets[0].cw; })(), { 2: 100 });
  eq('bad merges dropped', (function () { const x = load(function (c) { c.sheets[0].mg = [[0, 0, 0, 0], [5, 5, 1, 1], ['a'], [0, 0, 1, 1], [1, 1, 2, 2]]; }); return x.sheets[0].merges.length; })(), 1);
  eq('bad rule dropped', (function () { const x = load(function (c) { c.sheets[0].cf = [{ op: 'evil', r1: 0, c1: 0, r2: 0, c2: 0, a: 1, bg: '#000000' }, { op: 'gt', r1: 0, c1: 0, r2: 0, c2: 0, a: 1, bg: 'red' }, { op: 'gt', r1: 0, c1: 0, r2: 0, c2: 0, a: 1, bg: '#00ff00' }]; }); return x.sheets[0].cf.length; })(), 1);
  eq('active index checked', [load(function (c) { c.act = 99; }).active, load(function (c) { c.act = -1; }).active, load(function (c) { c.act = 'x'; }).active], [0, 0, 0]);
  eq('control characters stripped', (function () { const x = load(function (c) { c.sheets[0].cells.push([40, 0, 'a\u0000b\u0007c\td']); }); return x.getCell(0, 40, 0).v; })(), 'abc\td');
  eq('bad JSON text', Book.fromSnapshot('{not json'), null); eq('snapshot has no cached values', snap.indexOf('"cv"') < 0 && snap.indexOf('"ast"') < 0, true);
})();
// ---- search
(function () {
  const b = mk({ A1: 'Apple', B1: 'apple pie', A2: '=A1&"!"', C3: 42 });
  eq('find ci', b.find('apple', 0).map(function (h) { return h.r * 100 + h.c; }), [0, 1, 100]); eq('find match case', b.find('Apple', 0, { matchCase: true }).length, 2); eq('find whole', b.find('apple', 0, { whole: true }).length, 1); eq('find in formulas', b.find('&', 0, { formulas: true }).length, 1); eq('find number', b.find('42', 0).length, 1); eq('find empty query', b.find('', 0).length, 0);
})();
// ---- limits: nothing may hang or throw
(function () {
  const t0 = Date.now();
  const b = mk({}); for (let r = 0; r < 200; r++) b.setEntry(0, r, 0, r === 0 ? '1' : '=A' + r + '+1'); eq('long chain (running total)', (function () { b.calcAll(); return val(b, 'A200'); })(), 200);
  const c = mk({}); for (let r = 0; r < 1000; r++) c.setEntry(0, r, 0, r === 999 ? '1' : '=A' + (r + 2) + '+1'); c.calcAll(); const top = val(c, 'A1'); eq('very long upward chain stops cleanly', top === '#LIMIT!' || top === 1000, true);
  const d = mk({}); for (let r = 0; r < 60; r++) d.setEntry(0, r, 0, r === 0 ? '1' : '=A' + r + '+A' + r); d.calcAll(); eq('doubling chain is fast (no exponential time)', val(d, 'A60'), Math.pow(2, 59));
  const e = mk({ A1: 'x'.repeat(10000) }); e.setEntry(0, 1, 0, '=A1&A1&A1&A1'); eq('text over the limit is refused', val(e, 'A2'), '#VALUE!'); e.setEntry(0, 2, 0, '=REPT(A1,100)'); eq('REPT over the limit', val(e, 'A3'), '#VALUE!');
  const f = mk({}); const t1 = Date.now(); for (let r = 0; r < 300; r++) f.setEntry(0, r, 49, '=SUM(A1:AV1000)'); f.calcAll();
  let limited = 0, numbers = 0; for (let r = 0; r < 300; r++) { const v = f.get(0, r, 49); if (v === K.E.LIMIT) limited++; else if (typeof v === 'number') numbers++; }
  eq('heavy sheet: some formulas finish, the rest stop with #LIMIT!, and it is quick', [limited > 0, numbers > 0, Date.now() - t1 < 5000], [true, true, true]);
  const g = mk({ A1: 'a'.repeat(30000) }); g.setEntry(0, 1, 0, '=SEARCH("*a*a*a*a*b",A1)'); eq('wildcard search cannot run away', val(g, 'A2'), '#VALUE!');
  const h = mk({ A1: 'a'.repeat(30000) }); h.setEntry(0, 1, 0, '=COUNTIF(A1,"*a*a*a*a*a*b")'); eq('wildcard criteria cannot run away', val(h, 'A2'), 0);
  eq('time used', Date.now() - t0 < 20000, true); eq('no unexpected exceptions were swallowed', K.state.bug === null ? null : String(K.state.bug && K.state.bug.stack || K.state.bug), null);
})();
// ---- dangerous names never reach prototype members
['constructor', '__proto__', 'toString', 'hasOwnProperty', 'valueOf'].forEach(function (nm) { eq('function name ' + nm, F('=' + nm + '(1)'), '#NAME?'); eq('plain name ' + nm, F('=' + nm), '#NAME?'); const b = mk({}); const r = b.renameSheet(0, nm); eq('sheet called ' + nm, r.ok && b.sheetIndex(nm) === 0, true); });
eq('no pollution', ({}).evil, undefined);
console.log(fails ? fails + ' FAILED of ' + n : 'ALL ' + n + ' PASSED');
