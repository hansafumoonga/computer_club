/* number formats (General, rounding, dates, percent, thousands, text) checked against what Excel shows. Run: node tests/formats.test.js */
global.window = {};
require(require('path').join(__dirname, '..', 'js', 'sheetfmt.js'));
const F = window.CC.sheetfmt; let fails = 0, n = 0;
function eq(name, got, want) { n++; const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) { fails++; console.log('FAIL ' + name + ' got=' + JSON.stringify(got) + ' want=' + JSON.stringify(want)); } }

// ---- General
eq('g0', F.general(0), '0'); eq('g1', F.general(1), '1'); eq('g-1.5', F.general(-1.5), '-1.5'); eq('g third (11 characters, as Excel)', F.general(1 / 3), '0.333333333'); eq('g negative third', F.general(-1 / 3), '-0.333333333'); eq('g 100/3', F.general(100 / 3), '33.33333333'); eq('g 1e10/3', F.general(1e10 / 3), '3333333333'); eq('g 0.1+0.2', F.general(0.1 + 0.2), '0.3');
eq('g big int', F.general(123456789), '123456789'); eq('g 1e11', F.general(1e11), '1E+11'); eq('g 12 digits', F.general(123456789012), '1.23457E+11'); eq('g small but exact stays fixed', F.general(0.000001234), '0.000001234'); eq('g small inexact is scientific', F.general(0.000012345678), '1.23457E-05'); eq('g just above 1e-4', F.general(0.00012345678), '0.000123457'); eq('g 1e-9', F.general(1e-9), '0.000000001'); eq('g 1e-10', F.general(1e-10), '1E-10'); eq('g carry', F.general(99999999999.6), '1E+11'); eq('g round up whole', F.general(999999999.99), '1000000000'); eq('g 12 digits sci', F.general(-123456789012), '-1.23457E+11'); eq('g 1.5e-30', F.general(1.5e-30), '1.5E-30');
eq('g 11 digits keeps all', F.general(12345678901.5), '12345678902'); eq('g 1e-5', F.general(1e-5), '0.00001'); eq('g NaN', F.general(NaN), '#NUM!'); eq('g -0', F.general(-0), '0'); eq('g neg big', F.general(-12345678901.4), '-12345678901');
// ---- rounding (half away from zero, on the decimal as written)
eq('r 2.675', F.roundDec(2.675, 2), 2.68); eq('r 1.005', F.roundDec(1.005, 2), 1.01); eq('r -2.5', F.roundDec(-2.5, 0), -3); eq('r 2.5', F.roundDec(2.5, 0), 3); eq('r 28.5', F.roundDec(0.285 * 100, 0), 29);
eq('r neg digits', F.roundDec(1234.5678, -2), 1200); eq('r 5', F.roundDec(5, 2), 5); eq('r 1.45', F.roundDec(1.45, 1), 1.5); eq('r -1.45', F.roundDec(-1.45, 1), -1.5); eq('r .5', F.roundDec(0.5, 0), 1);
eq('r tiny', F.roundDec(1e-10, 5), 0); eq('r 15 -> 20', F.roundDec(15, -1), 20); eq('r 0.07*100', F.roundDec(0.07 * 100, 10), 7); eq('r NaN passes', Number.isNaN(F.roundDec(NaN, 2)), true); eq('r string passes', F.roundDec('x', 2), 'x');
eq('r huge unchanged', F.roundDec(1e300, 2), 1e300);
// ---- number formats
const f = F.format;
eq('f thousands', f(1234.567, '#,##0.00'), '1,234.57'); eq('f thousands neg', f(-1234.567, '#,##0.00'), '-1,234.57'); eq('f zero', f(0, '#,##0.00'), '0.00'); eq('f half', f(0.5, '#,##0.00'), '0.50');
eq('f millions', f(1234567.891, '#,##0.00'), '1,234,567.89'); eq('f carry', f(999.999, '#,##0.00'), '1,000.00'); eq('f no decimals carry', f(999.5, '#,##0'), '1,000'); eq('f no decimals', f(1234, '#,##0'), '1,234'); eq('f no decimals zero', f(0, '#,##0'), '0');
eq('f 2dp', f(3.14159, '0.00'), '3.14'); eq('f 2dp half', f(2.675, '0.00'), '2.68'); eq('f int half', f(2.5, '0'), '3'); eq('f int neg half', f(-2.5, '0'), '-3'); eq('f small positive', f(0.4, '0'), '0'); eq('f small negative has no minus', f(-0.4, '0'), '0');
eq('f pct 7.5', f(0.075, '0%'), '8%'); eq('f pct 28.5', f(0.285, '0%'), '29%'); eq('f pct 150', f(1.5, '0%'), '150%'); eq('f pct neg', f(-0.25, '0%'), '-25%'); eq('f pct 1dp', f(0.0755, '0.0%'), '7.6%'); eq('f pct 2dp', f(0.12345, '0.00%'), '12.35%');
eq('f dollar', f(1234.5, '"$"#,##0.00'), '$1,234.50'); eq('f dollar neg', f(-5, '"$"#,##0.00'), '-$5.00'); eq('f kwacha', f(2500, '"K"#,##0'), 'K2,500'); eq('f pound', f(7, '"£"#,##0.00'), '£7.00'); eq('f euro', f(7, '"€"#,##0.00'), '€7.00');
eq('f pad 3', f(7, '000'), '007'); eq('f pad no truncate', f(123, '00'), '123'); eq('f sci', f(12345, '0.0E+00'), '1.2E+04'); eq('f sci small', f(0.00012, '0.0E+00'), '1.2E-04'); eq('f sci carry', f(999000, '0.0E+00'), '1.0E+06'); eq('f sci minus form', f(12345, '0.0E-00'), '1.2E04');
eq('f brackets pos', f(1234, '#,##0;(#,##0)'), '1,234'); eq('f brackets neg', f(-1234, '#,##0;(#,##0)'), '(1,234)'); eq('f zero section', f(0, '0;-0;"zero"'), 'zero'); eq('f colour ignored', f(-1.5, '0.00;[Red]-0.00'), '-1.50');
eq('f hash dot', f(0.5, '#.##'), '.5'); eq('f hash int keeps the dot (as Excel)', f(2, '#.##'), '2.'); eq('f zero keeps the dot', f(0, '0.##'), '0.'); eq('f optional decimals 1', f(1.5, '0.0#'), '1.5'); eq('f optional decimals 2', f(1.25, '0.0#'), '1.25'); eq('f optional decimals 3', f(1.256, '0.0#'), '1.26');
eq('f at text', f('hi', '@'), 'hi'); eq('f at number', f(5, '@'), '5'); eq('f at prefix', f('x', '"Total: "@'), 'Total: x'); eq('f text under number format', f('abc', '0.00'), 'abc');
eq('f thousand scale', f(1234567, '0,'), '1235'); eq('f million scale', f(2500000, '0.0,,'), '2.5'); eq('f literal only', f(5, '"yes"'), 'yes'); eq('f null', f(null, '0'), ''); eq('f bool', f(true, '0'), 'TRUE');
eq('f general code', f(1 / 3, 'General'), '0.333333333'); eq('f general lower', f(2, 'general'), '2'); eq('f no code', f(2.5), '2.5'); eq('f huge', f(1e20, '0.00'), '100000000000000000000.00'); eq('f beyond a billion billion', f(1e22, '0.00'), '1E+22'); eq('f 15 digit limit', f(1e15, '0'), '1000000000000000'); eq('f text format leaves numbers', f(5, '"x"@'), '5'); eq('f infinity', f(Infinity, '0.00'), '#NUM!');
eq('f long code ignored', f(1.5, '0'.repeat(200)), '1.5'); eq('f proto code', typeof f(5, '__proto__'), 'string'); eq('f ctor code', typeof f(5, 'constructor'), 'string'); eq('no pollution', ({}).polluted, undefined);
// ---- dates and times (46023 is 1 January 2026, 45292 is 1 January 2024, 36526 is 1 January 2000)
eq('d dmy', f(46023, 'dd/mm/yyyy'), '01/01/2026'); eq('d long', f(46023, 'd mmmm yyyy'), '1 January 2026'); eq('d iso', f(45292, 'yyyy-mm-dd'), '2024-01-01'); eq('d y2k', f(36526, 'dd/mm/yyyy'), '01/01/2000');
eq('d dow', f(46023, 'ddd d mmm yy'), 'Thu 1 Jan 26'); eq('d dow long', f(46023, 'dddd'), 'Thursday'); eq('d 1-digit', f(46023 + 8, 'd/m/yyyy'), '9/1/2026');
eq('t noon', f(0.5, 'hh:mm'), '12:00'); eq('t 6pm', f(0.75, 'hh:mm'), '18:00'); eq('t ampm', f(0.75, 'h:mm AM/PM'), '6:00 PM'); eq('t midnight ampm', f(0, 'h:mm AM/PM'), '12:00 AM'); eq('t noon ampm', f(0.5, 'h:mm AM/PM'), '12:00 PM');
eq('t seconds', f(86399 / 86400, 'hh:mm:ss'), '23:59:59'); eq('t minutes then seconds', f(125 / 86400, 'mm:ss'), '02:05'); eq('dt both', f(46023.5, 'dd/mm/yyyy hh:mm'), '01/01/2026 12:00');
eq('t rounds to the second', f(0.1 + 0.2, 'hh:mm:ss'), '07:12:00'); eq('d negative', f(-1, 'dd/mm/yyyy'), '#NUM!'); eq('d too big', f(3000000, 'dd/mm/yyyy'), '#NUM!'); eq('d last day', f(2958465, 'yyyy-mm-dd'), '9999-12-31');
eq('isDate yes', F.isDateFormat('dd/mm/yyyy'), true); eq('isDate time', F.isDateFormat('hh:mm'), true); eq('isDate no', F.isDateFormat('0.00'), false); eq('isDate General', F.isDateFormat('General'), false); eq('isDate none', F.isDateFormat(undefined), false);
eq('serial roundtrip', F.dateToSerial(2026, 1, 1), 46023); eq('serial 2000', F.dateToSerial(2000, 1, 1), 36526); eq('serial 2024', F.dateToSerial(2024, 1, 1), 45292);
// ---- decimals buttons
eq('more General 3.14', F.moreDecimals('General', 3.14), '0.000'); eq('more General 5', F.moreDecimals('General', 5), '0.0'); eq('more 0.00', F.moreDecimals('0.00'), '0.000'); eq('more 0', F.moreDecimals('0'), '0.0'); eq('more thousands', F.moreDecimals('#,##0'), '#,##0.0');
eq('more pct', F.moreDecimals('0%'), '0.0%'); eq('more currency', F.moreDecimals('"$"#,##0.00'), '"$"#,##0.000'); eq('more date untouched', F.moreDecimals('dd/mm/yyyy'), 'dd/mm/yyyy'); eq('more empty', F.moreDecimals('', 2.5), '0.00');
eq('fewer 0.00', F.fewerDecimals('0.00'), '0.0'); eq('fewer 0.0', F.fewerDecimals('0.0'), '0'); eq('fewer 0', F.fewerDecimals('0'), '0'); eq('fewer General 3.14', F.fewerDecimals('General', 3.14), '0.0'); eq('fewer General 3.1', F.fewerDecimals('General', 3.1), '0');
eq('fewer General 3', F.fewerDecimals('General', 3), 'General'); eq('fewer pct', F.fewerDecimals('0.0%'), '0%'); eq('fewer currency', F.fewerDecimals('"$"#,##0.00'), '"$"#,##0.0');
// ---- fitting General into a narrow column
eq('fit pi', F.fitGeneral(Math.PI, 6), '3.1416'); eq('fit fits', F.fitGeneral(5, 1), '5'); eq('fit drops to sci', F.fitGeneral(1234567.891, 5), '1E+06'); eq('fit hashes', F.fitGeneral(123456, 3), '###'); eq('fit text unchanged', F.fitGeneral('abc', 1), 'abc'); eq('fit int keeps digits', F.fitGeneral(12345.678, 7), '12345.7');
// ---- typing into a cell
const p = F.parseEntry;
eq('e blank', p('').k, 'blank'); eq('e spaces', p('   ').k, 'blank'); eq('e quote', p("'123"), { k: 'text', v: '123' }); eq('e quote formula', p("'=1+1"), { k: 'text', v: '=1+1' }); eq('e formula', p('=1+1'), { k: 'formula', v: '=1+1' });
eq('e lone =', p('='), { k: 'text', v: '=' }); eq('e space before =', p(' =1').k, 'text'); eq('e trailing spaces trimmed from formula', p('=A1 ').v, '=A1'); eq('e true', p('true'), { k: 'bool', v: true }); eq('e FALSE', p('FALSE'), { k: 'bool', v: false });
eq('e leading zeros stay', p('007'), { k: 'text', v: '007' }); eq('e phone', p('0977123456').k, 'text'); eq('e 16 digits', p('1234567890123456').k, 'text'); eq('e 15 digits', p('123456789012345').k, 'num');
eq('e int', p('12345'), { k: 'num', v: 12345 }); eq('e neg', p('-5'), { k: 'num', v: -5 }); eq('e plus', p('+5'), { k: 'num', v: 5 }); eq('e .5', p('.5'), { k: 'num', v: 0.5 }); eq('e 5.', p('5.'), { k: 'num', v: 5 }); eq('e 0.5', p('0.5'), { k: 'num', v: 0.5 }); eq('e sci', p('1e3'), { k: 'num', v: 1000 });
eq('e thousands', p('1,234'), { k: 'num', v: 1234, fmt: '#,##0' }); eq('e thousands dp', p('1,234.50'), { k: 'num', v: 1234.5, fmt: '#,##0.00' }); eq('e european comma is text', p('1,5').k, 'text'); eq('e bad thousands is text', p('12,34').k, 'text');
eq('e pct', p('12%'), { k: 'num', v: 0.12, fmt: '0%' }); eq('e pct dp', p('12.5%'), { k: 'num', v: 0.125, fmt: '0.0%' }); eq('e pct 7', p('7%').v, 0.07); eq('e dollar', p('$5'), { k: 'num', v: 5, fmt: '"$"#,##0.00' }); eq('e pound', p('£1,250.5'), { k: 'num', v: 1250.5, fmt: '"£"#,##0.00' }); eq('e neg dollar', p('-$5').v, -5);
eq('e date', p('31/12/2026'), { k: 'num', v: F.dateToSerial(2026, 12, 31), fmt: 'dd/mm/yyyy' }); eq('e date swapped', p('12/31/2026').v, F.dateToSerial(2026, 12, 31)); eq('e iso', p('2026-12-31'), { k: 'num', v: F.dateToSerial(2026, 12, 31), fmt: 'yyyy-mm-dd' });
eq('e bad date', p('31/02/2026').k, 'text'); eq('e month 13', p('13/13/2026').k, 'text'); eq('e time', p('13:45').fmt, 'hh:mm'); eq('e time value', Math.round(p('13:45').v * 86400), 13 * 3600 + 45 * 60); eq('e bad time', p('25:00').k, 'text'); eq('e bad seconds', p('10:00:61').k, 'text');
eq('e word', p('hello'), { k: 'text', v: 'hello' }); eq('e spaces kept', p(' hello ').v, ' hello '); eq('e hex', p('0x10').k, 'text'); eq('e Infinity', p('Infinity').k, 'text'); eq('e 1e999', p('1e999').k, 'text'); eq('e null', p(null).k, 'blank');
eq('e text cell keeps 007', p('007', '@'), { k: 'text', v: '007' }); eq('e text cell keeps =A1', p('=A1', '@'), { k: 'text', v: '=A1' }); eq('e text cell keeps 5', p('5', '@'), { k: 'text', v: '5' });
eq('num 5', F.parseNumber('5'), 5); eq('num abc', F.parseNumber('abc'), null); eq('num 1,000', F.parseNumber('1,000'), 1000); eq('num pct', F.parseNumber('12%'), 0.12); eq('num formula', F.parseNumber('=1'), null); eq('num bool', F.parseNumber('TRUE'), null);
// a format code typed by a person must never crash anything
['', ' ', ';;;', '"', '\\', '[', 'E+', 'E+0', '0.0.0', '00000000000000000000000000000', '#,#,#,#,#', '%%%%', '0,,,,,,,0', 'yyyyyyyyyyyyyy', 'mmmmmm', 'AM/PM', 'h"h"', '_(* #,##0_)', '@@@'].forEach(function (c) {
  [0, 1, -1, 0.5, 1234.5678, 1e15, 1e-9, 'text', 46023, 0.999999999].forEach(function (v) { let r; try { r = f(v, c); } catch (e) { r = null; } eq('survives ' + JSON.stringify(c) + ' ' + String(v), typeof r, 'string'); });
});
console.log(fails ? fails + ' FAILED of ' + n : 'ALL ' + n + ' PASSED');
