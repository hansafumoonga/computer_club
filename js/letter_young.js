/* letter_young.js - Type a Letter for Years 2 and 3: short, gentle lessons that teach one skill at a time. Every lesson has three guided steps.
     Year 2 (7 lessons): typing words, capital letters, full stops, correcting mistakes, question and exclamation marks with new lines,
       the parts of a letter, then a letter of their own. Only the keyboard is needed, so the toolbar is hidden and the page has larger letters.
     Year 3 (10 lessons): builds on Year 2: greetings, capital letters, correcting and spelling, the layout and date, bold, italic and underline,
       font, size and colour, alignment, lists, saving and print preview, then a letter of their own. Only the tools these lessons use are shown.
   A step has say (the task), sub (how to do it), win, tip (shown by the light bulb or after a long pause), voice (what is read aloud) and ok().
   free: true means the answer is the learner's own, so it is checked only when they stop typing (settle: how long, in milliseconds).
   coach() gives one specific hint when a nearly right answer is left for a moment. The word processor itself is in letter.js.
   The rules taught: capital letters for sentences, names, places, days, months and the word I, but not seasons; Mum has a capital when it
   is used as a name, but not after "my"; a comma follows the greeting; a date needs no commas. */
(function () {
'use strict';
const CC = window.CC, K = CC.letterKit;
if (!K) return;
const slide = K.slide, pageArt = K.pageArt, keysArt = K.keysArt, cards = K.cards, bad = K.bad;

/* ---------- reading the page ---------- */
const lines = function (a) { return a.doc.lines(); };            // the lines that have words on them, from the top
const all = function (a) { return lines(a).join(' '); };
const some = function (a, re) { return lines(a).some(function (l) { return re.test(l); }); };
/* the line the cursor is on; '' when the cursor is not on the page, so a prepared page gets no hint before the learner starts */
function caretLine(a) {
  const page = a.doc.page, s = window.getSelection();
  let n = s && s.rangeCount && page.contains(s.anchorNode) ? s.anchorNode : null;
  while (n && n !== page && !(n.nodeType === 1 && /^(DIV|P|LI|TD)$/.test(n.tagName))) n = n.parentNode;
  if (!n) return '';
  const t = n.innerText.replace(/\u00A0/g, ' ').split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
  return t[t.length - 1] || '';
}
/* the same, but '' for a line that was already on the page (the learner has not written it) */
const typedLine = function (a) { const l = caretLine(a); return a.doc.given.indexOf(l) >= 0 ? '' : l; };

/* ---------- exactly right: the same letters, capitals, spaces and punctuation ---------- */
const reEsc = function (s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); };
/* a space (or the start of the line) comes before it, and words ending in a letter do not run into another letter */
const holds = function (line, t) { return new RegExp('(?:^|\\s)' + reEsc(t) + (/\p{L}$/u.test(t) ? '(?!\\p{L})' : ''), 'u').test(line); };
const exact = function (a, t) { return lines(a).some(function (l) { return holds(l, t); }); };
const onNewLine = function (a, t) { return lines(a).some(function (l, i) { return i > 0 && l.indexOf(t) === 0; }); };   // ENTER was pressed first

/* ---------- the hint for a nearly right answer ---------- */
const MARKS = { '.': 'a full stop', ',': 'a comma', '?': 'a question mark', '!': 'an exclamation mark' };
const CAPS_LOCK = 'CAPS LOCK may be on. Press CAPS LOCK once, then delete the capitals and type again.';
const lettersOf = function (s) { return s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, ''); };
const noMarks = function (s) { return s.replace(/[.,!?]/g, '').replace(/\s+/g, ' ').trim(); };
const noSpaces = function (s) { return s.replace(/\s+/g, ''); };
const howMany = function (s, c) { return s.split(c).length - 1; };
const wordAt = function (s, i) { const from = s.lastIndexOf(' ', i) + 1, to = s.indexOf(' ', i); return s.slice(from, to < 0 ? s.length : to).replace(/[.,!?]/g, ''); };
const shouting = function (s) { const x = s.replace(/[^\p{L}]/gu, ''); return x.length > 2 && x === x.toUpperCase() && x !== x.toLowerCase(); };
function capitalsHint(got, want) {                              // the letters are right; only a capital is wrong
  let i = 0; while (i < want.length && got[i] === want[i]) i++;
  const c = want.charAt(i), w = wordAt(want, i);
  if (c === c.toLowerCase()) return 'Type a small ' + c + ' in "' + w + '". Only capital letters need SHIFT.';
  return (w.length === 1 ? '"' + w + '" is a capital letter here' : '"' + w + '" needs a capital letter') + ': hold SHIFT and press ' + c + '.';
}
function explain(got, before, want) {
  if (shouting(got) && !shouting(want)) return CAPS_LOCK;
  if (got === want) return before && !/\s$/.test(before) ? 'Put a space before "' + wordAt(want, 0) + '".' : 'Check the end. There may be an extra letter.';
  if (got.toLowerCase() === want.toLowerCase()) return capitalsHint(got, want);
  if (noSpaces(got).toLowerCase() === noSpaces(want).toLowerCase()) {
    if (/\s[.,!?]/.test(got)) return 'Do not put a space before the punctuation mark.';
    return got.split(/\s+/).length < want.split(/\s+/).length ? 'Put one space between the words.' : 'Use only one space between the words.';
  }
  if (noMarks(got).toLowerCase() === noMarks(want).toLowerCase()) {
    if (noMarks(got) !== noMarks(want)) return capitalsHint(noMarks(got), noMarks(want));
    const end = want.slice(-1), last = got.slice(-1);
    if (MARKS[end] && MARKS[last] && last !== end) return 'End with ' + MARKS[end] + ', not ' + MARKS[last] + '.';
    const m = (want.match(/[.,!?]/g) || []).filter(function (c) { return howMany(got, c) < howMany(want, c); })[0];
    if (m) { const i = want.indexOf(m); return 'Add ' + MARKS[m] + (i === want.length - 1 ? ' at the end.' : ' after "' + wordAt(want, i) + '".'); }
    return 'Check the punctuation. It should say:  ' + want;
  }
  return 'Look carefully at the letters, capitals and spaces. It should say:  ' + want;
}
/* the part of the line that has the target's letters in order (capitals, spaces and punctuation ignored), with any punctuation just after it */
function attemptIn(line, want) {
  const k = lettersOf(want), at = []; let seen = '';
  for (let i = 0; i < line.length; i++) { const x = lettersOf(line.charAt(i)); for (let j = 0; j < x.length; j++) at.push(i); seen += x; }
  const p = k ? seen.lastIndexOf(k) : -1; if (p < 0) return null;
  const from = at[p]; let to = at[p + k.length - 1] + 1; while (to < line.length && /[\s.,!?]/.test(line.charAt(to))) to++;
  return { text: line.slice(from, to).trim(), before: line.slice(0, from) };
}
function distance(a, b) {                                       // how many letters are wrong, missing, extra or swapped
  const d = [];
  for (let i = 0; i <= a.length; i++) d[i] = [i];
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
  }
  return d[a.length][b.length];
}
/* for a "type this" task: what to change so that a line says exactly the target (newLine: it must be on its own line below the first) */
function coachFor(want, newLine) {
  return function (a) {
    if (newLine ? onNewLine(a, want) : exact(a, want)) return '';
    if (newLine && holds(lines(a)[0] || '', want)) return 'It needs its own line. Click just before "' + wordAt(want, 0) + '" and press ENTER.';
    const line = caretLine(a); if (!line) return '';
    const m = attemptIn(line, want);
    if (m) return newLine && m.text === want && m.before.trim() ? 'It needs its own line. Click just before "' + wordAt(want, 0) + '" and press ENTER.' : explain(m.text, m.before, want);
    const k = lettersOf(want), got = lettersOf(line);
    for (let n = /[.?!]$/.test(line) ? 0 : Math.min(got.length, k.length - 1); n > 0; n--) if (got.slice(-n) === k.slice(0, n)) return '';   // still typing it (no end mark yet)
    return got.length >= k.length - 1 && distance(got.slice(-k.length), k) <= Math.max(1, Math.floor(k.length / 6)) ? 'Check your spelling. It should say:  ' + want : '';
  };
}

/* ---------- the learner's own writing: greeting, message, date, closing ---------- */
const NAME = "\\p{Lu}[\\p{L}'’.-]*";
const NAMES = NAME + '(?: (?:and |& )?' + NAME + ')*';                          // one name or more, such as: Gran, or Mum and Dad
const GREET = new RegExp('^Dear ' + NAMES + ',$', 'u');
const isGreeting = function (l) { return GREET.test(l) && !l.split(' ').some(shouting); };
function coachGreeting(a) {
  const l = typedLine(a); if (!l || isGreeting(l) || /^\d/.test(l)) return '';             // (a date line is left alone)
  if (/^dear[^\s,]/i.test(l)) return 'Put a space after Dear.';
  if (!/^dear/i.test(l)) return /^d(e(a)?)?$/i.test(l) ? '' : 'Start your greeting with the word Dear.';
  if (l.split(' ').some(shouting)) return CAPS_LOCK;
  if (l.charAt(0) !== 'D') return 'Start the word Dear with a capital D.';
  if (/^Dear [^,]+,\s*\S/.test(l)) return 'Press ENTER after the comma, so your message starts on a new line.';
  const names = l.slice(4).replace(/,\s*$/, '').trim().split(/\s+/).filter(function (w) { return w && w !== 'and' && w !== '&'; });
  if (!names.length) return 'Type a space, then a name after Dear.';
  if (names.some(function (w) { return /^\p{Ll}/u.test(w); })) return 'A name starts with a capital letter. Hold SHIFT for its first letter.';
  if (/\s,/.test(l)) return 'Do not put a space before the comma.';
  return /,$/.test(l) ? '' : 'Add a comma after the name.';
}

const SENTENCE = /[^.!?]+[.!?]+/g;
const wordCount = function (s) { return s.split(/\s+/).filter(function (w) { return /\p{L}/u.test(w); }).length; };
const smallI = function (s) { return /(?:^|\s)i(?=[\s.,!?'’]|$)/.test(s); };
/* a finished sentence: a capital letter first, at least three words, an end mark with no space before it, and I as a capital */
const isSentence = function (s) { return /^\p{Lu}/u.test(s) && wordCount(s) >= 3 && !/\s[.!?]+$/.test(s) && !smallI(s) && !shouting(s); };
const sentencesIn = function (l) { return (l.match(SENTENCE) || []).map(function (s) { return s.trim(); }).filter(isSentence); };
const SIGN = /^(?:From|Love from|Best wishes),?$/;
const SIGNED = new RegExp('^(?:From|Love from|Best wishes),? (' + NAMES + ')$', 'u');
const ONLY_NAME = new RegExp('^' + NAMES + '$', 'u');
const goodName = function (s) { return ONLY_NAME.test(s) && s.replace(/[^\p{L}]/gu, '').length >= 2 && !s.split(' ').some(shouting); };
/* the sentences of the message (not the greeting or the closing) */
const message = function (a) { return lines(a).filter(function (l) { return !isGreeting(l) && !SIGN.test(l) && !SIGNED.test(l); }).reduce(function (list, l) { return list.concat(sentencesIn(l)); }, []); };
function coachSentence(a) {
  const l = typedLine(a); if (!l) return '';
  if (/^Dear [^,]+,\s*\S/.test(l)) return 'Press ENTER after the comma, so your message starts on a new line.';
  if (isGreeting(l) || SIGN.test(l)) return '';
  if (shouting(l)) return CAPS_LOCK;
  if (smallI(l)) return 'The word I is always a capital letter.';
  const rest = l.replace(SENTENCE, '').trim();
  if (rest) {
    if (/^\p{Ll}/u.test(rest)) return 'Start the sentence with a capital letter.';
    return wordCount(rest) >= 3 ? 'When your sentence is finished, end it with a full stop, a question mark or an exclamation mark.' : '';
  }
  const last = ((l.match(SENTENCE) || []).pop() || '').trim();
  if (/^\p{Ll}/u.test(last)) return 'Start the sentence with a capital letter.';
  if (/\s[.!?]+$/.test(last)) return 'Do not put a space before the punctuation mark.';
  return last && wordCount(last) < 3 ? 'Make the sentence longer: use at least three words.' : '';
}
/* the letter ends with its closing: "From Sam" on one line, or "From" (or "Best wishes,") with the name on the next line */
function closed(a) {
  const l = lines(a), n = l.length; if (!n) return false;
  const one = SIGNED.exec(l[n - 1]); if (one) return goodName(one[1]);
  return n > 1 && SIGN.test(l[n - 2]) && goodName(l[n - 1]);
}
function coachClosing(a) {
  if (closed(a)) return '';
  const l = typedLine(a); if (!l) return '';
  if (/^(from|love from|best wishes)\b/.test(l)) return 'Start the closing with a capital letter.';
  if (/^(FROM|LOVE FROM|BEST WISHES)\b/.test(l)) return CAPS_LOCK;
  if (SIGN.test(l)) return 'Now add your name: press ENTER or SPACE, then type it with a capital letter.';
  const m = /^(?:From|Love from|Best wishes),? (.+)$/.exec(l);
  if (m) return /^\p{Ll}/u.test(m[1]) ? 'Your name starts with a capital letter.' : m[1].split(' ').some(shouting) ? CAPS_LOCK : '';
  if (/^(?:Love From|Best Wishes)\b/.test(l)) return 'Only the first word of a closing needs a capital letter, like this:  Best wishes';
  if (/\S (?:From|Best wishes)\b/.test(l)) return 'Press ENTER, so the closing starts on a new line.';
  const above = lines(a)[lines(a).length - 2] || '';
  return SIGN.test(above) && /^\p{Ll}/u.test(l) ? 'Your name starts with a capital letter.' : '';
}

const MONTHS = 'January|February|March|April|May|June|July|August|September|October|November|December';
const DAYS = 'Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday';
const DATE = new RegExp('^(?:(?:' + DAYS + '),? )?(?:0?[1-9]|[12]\\d|3[01])(?:st|nd|rd|th)?(?: of)? (?:' + MONTHS + ')(?: \\d{4})?$');
function coachDate(a) {
  const l = typedLine(a); if (!l || DATE.test(l) || !new RegExp('^\\d|^(?:' + MONTHS + '|' + DAYS + ')\\b', 'i').test(l)) return '';
  if (/,/.test(l)) return 'A date needs no commas.';
  if (new RegExp('^(?:' + MONTHS + ') *\\d', 'i').test(l)) return 'Write the day number first, then the month, like this: 3 May';
  if (/^\d{1,2}[./-]\d/.test(l)) return 'Write the month as a word, like this: 3 May';
  if (new RegExp('^\\d{1,2}(?:st|nd|rd|th)?(?:' + MONTHS + ')', 'i').test(l)) return 'Put a space between the number and the month.';
  if (/\s{2,}/.test(l)) return 'Use only one space between the words.';
  const m = new RegExp('(?:^|\\s)(' + MONTHS + ')(?:\\s|$)', 'i').exec(l);
  if (m && m[1].charAt(0) !== m[1].charAt(0).toUpperCase()) return 'A month starts with a capital letter.';
  return /^\d{1,2}(?:st|nd|rd|th)? \p{L}{3,}$/u.test(l) ? 'Check the spelling of the month.' : '';
}

/* right words in the wrong place */
const topGreeting = function (a) { const l = typedLine(a); return isGreeting(l) && lines(a)[0] !== l ? 'The greeting goes at the very top of your letter. Delete anything above it.' : coachGreeting(a); };
const topDate = function (a) { const l = typedLine(a); return DATE.test(l) && lines(a)[0] !== l ? 'The date goes at the very top. Click on the first line.' : coachDate(a); };
const underDate = function (a) { const l = typedLine(a); return isGreeting(l) && lines(a)[1] !== l ? 'The greeting goes just under the date, above the message.' : coachGreeting(a); };
const atEnd = function (a) { const l = lines(a), i = l.findIndex(function (x) { return SIGN.test(x) || SIGNED.test(x); }); return !closed(a) && i >= 0 && l.slice(i + 1).some(function (x) { return sentencesIn(x).length; }) ? 'The closing goes at the very end, below the message.' : coachClosing(a); };

/* a step that is the learner's own words: it is finished when they pause and the rule is met */
const own = function (rule) { return function (e, a) { return e.t === 'pause' && rule(a); }; };

/* ---------- Year 2 ---------- */
/* a letter with each part named beside it (wider than the other lesson pages, so the names stay on their lines) */
const labelled = function (parts) { return '<div class="ls-page ls-labelled">' + parts.map(function (p) { return '<p' + (p[2] ? ' style="text-align:' + p[2] + '"' : '') + '>' + p[0] + ' <span class="ls-tag">' + p[1] + '</span></p>'; }).join('') + '</div>'; };
const letterParts = labelled([['Dear Gran,', 'greeting'], ['Thank you for my present.', 'message'], ['From Sam', 'closing']]);
const stack = function (x, y) { return '<div class="ls-stack">' + x + y + '</div>'; };
/* typing words on one line: ENTER used instead of the SPACE bar gets its own hint */
function spaced(before, word) {
  const hint = coachFor(before + ' ' + word);
  return function (a) {
    const l = lines(a), i = l.findIndex(function (x) { return x.toLowerCase().indexOf(word) === 0; });
    return i > 0 && l[i - 1].toLowerCase().slice(-before.length) === before ? 'Use the SPACE bar, not ENTER. Click just before ' + word + ', press BACKSPACE once, then press SPACE.' : hint(a);
  };
}
const nameAfterGran = function (a) { const m = /(?:^|\s)Gran[.,]? +(\p{Lu}[\p{L}'’-]+)/u.exec(all(a)); return !!m && !shouting(m[1]); };
function coachName(a) {
  if (/(?:^|\s)Gran\p{L}{2,}/u.test(all(a))) return 'Put a space after Gran.';
  const m = /(?:^|\s)Gran[.,]? +(\S+)/.exec(all(a)); if (!m) return '';
  if (shouting(m[1])) return CAPS_LOCK;
  return /^\p{Ll}/u.test(m[1]) ? 'Your name starts with a capital letter. Hold SHIFT for the first letter.' : '';
}

const YEAR2 = [
  { id: 'y2words', title: 'Type words', icon: '⌨️', learned: 'You typed words with one space between them.',
    teach: [
      slide('The cursor', ['The thin blinking line on the page is the cursor.', 'The letters you type appear where the cursor is.'], pageArt('<p>do<i class="cur"></i></p>')),
      slide('Keys and the SPACE bar', ['The letter keys show capital letters, but they type small letters.', 'The SPACE bar is the long key at the bottom.', 'Press it once to put a space between two words.'], stack(keysArt([['D', 'types d'], ['Space', 'a space']]), pageArt('<p>dog cat</p>')), 'The letter keys show capital letters, but they type small letters. The space bar is the long key at the bottom. Press it once to put a space between two words.')],
    steps: [
      { say: 'Click on the page and type the word  dog', sub: 'Find each letter on the keyboard and press it once.', win: 'You typed your first word!', tip: ['Click on the white page.', 'Find the keys D, O and G.', 'Press each key once.'], ok: function (e, a) { return /(?:^|\s)[dD]og(?!\p{L})/u.test(all(a)); }, coach: coachFor('dog') },
      { say: 'Press the SPACE bar once. Then type  cat', sub: 'The SPACE bar is the long key at the bottom.', win: 'A space keeps the two words apart.', tip: ['Check that the cursor is after dog.', 'Press the SPACE bar once.', 'Type C, A and T.'], ok: function (e, a) { return some(a, /(?:^|\s)[dD]og cat(?!\p{L})/u); }, coach: spaced('dog', 'cat') },
      { say: 'Press SPACE once more. Then type  sun', sub: 'One space goes between the words.', win: 'Three words with spaces between them!', tip: ['Press the SPACE bar once.', 'Type S, U and N.'], ok: function (e, a) { return some(a, /(?:^|\s)[dD]og cat sun(?!\p{L})/u); }, coach: spaced('dog cat', 'sun') }] },
  { id: 'y2caps', title: 'Capital letters', icon: '🔠', learned: 'Names start with a capital letter. SHIFT makes a capital letter.',
    teach: [
      slide('The SHIFT key', ['There are two SHIFT keys, one at each end of the bottom row of letters.', 'Hold SHIFT down, press a letter once, then let go.', 'The letter appears as a capital letter.'], stack(keysArt([['Shift', 'hold it'], ['S', 'press once']]), pageArt('<p><b>S</b></p>')), 'There are two shift keys, one at each end of the bottom row of letters. Hold shift down, press a letter once, then let go. The letter appears as a capital letter.'),
      slide('When to use a capital', ['The names of people and places start with a capital letter: Sam, London.', 'The word I is always a capital letter.'], pageArt('<p><b>S</b>am &nbsp; <b>G</b>ran</p><p><b>L</b>ondon &nbsp; <b>I</b></p>'), 'The names of people and places start with a capital letter, like Sam and London. The word I is always a capital letter.')],
    steps: [
      { say: 'Type the name  Sam  with a capital S', sub: 'Hold SHIFT, press S, let go, then type a and m.', voice: 'Type the name Sam, with a capital S. Hold shift and press S. Let go, then type a and m.', win: 'Sam starts with a capital S.', tip: ['Hold one SHIFT key down.', 'Press S once, then let go of SHIFT.', 'Type a, then m.'], ok: function (e, a) { return exact(a, 'Sam'); }, coach: coachFor('Sam') },
      { say: 'Press SPACE. Type the name  Gran  with a capital G', sub: 'Gran is used as a name here, so it has a capital.', voice: 'Press space. Type the name Gran, with a capital G.', win: 'Gran has a capital G too.', tip: ['Press the SPACE bar once.', 'Hold SHIFT and press G.', 'Let go of SHIFT and type ran.'], ok: function (e, a) { return exact(a, 'Gran'); }, coach: coachFor('Gran') },
      { say: 'Press SPACE. Type your own first name', sub: 'Start your name with a capital letter.', win: 'Your name starts with a capital letter!', tip: ['Press the SPACE bar once.', 'Hold SHIFT and press the first letter of your name.', 'Let go of SHIFT and type the rest.'], free: true, settle: 3500, ok: own(nameAfterGran), coach: coachName }] },
  { id: 'y2stop', title: 'Full stops', icon: '✏️', learned: 'A sentence starts with a capital letter and ends with a full stop.',
    teach: [
      slide('What is a sentence?', ['A sentence is a group of words that makes sense.', 'It starts with a capital letter.', 'A sentence that tells you something ends with a full stop.'], pageArt('<p><b>I</b> like cats<b>.</b></p>')),
      slide('The full stop key', ['The full stop key is two keys to the right of the letter M.', 'Type it straight after the last word, with no space before it.'], keysArt([['M', 'letter M'], [',', 'comma'], ['.', 'full stop']]), 'The full stop key is two keys to the right of the letter M. Type it straight after the last word, with no space before it.')],
    steps: [
      { say: 'Type this sentence:  I like cats.', sub: 'A capital I first, and a full stop at the end.', voice: 'Type this sentence. I like cats. Start with a capital I, and end with a full stop.', win: 'That is a whole sentence!', tip: ['Hold SHIFT and press I.', 'Put one space between the words.', 'Press the full stop key after cats.'], ok: function (e, a) { return exact(a, 'I like cats.'); }, coach: coachFor('I like cats.') },
      { say: 'Press SPACE. Then type:  They are soft.', sub: 'Hold SHIFT for the capital T.', voice: 'Press space. Then type: They are soft. Remember the capital T and the full stop.', win: 'Two sentences!', tip: ['Press the SPACE bar once.', 'Hold SHIFT and press T.', 'End with a full stop.'], ok: function (e, a) { return exact(a, 'They are soft.'); }, coach: coachFor('They are soft.') },
      { say: 'Press SPACE. Write your own sentence about food', sub: 'At least three words, a capital first and a full stop at the end.', voice: 'Press space. Write your own sentence about food. Use at least three words. Start with a capital letter and end with a full stop.', win: 'You wrote your own sentence!', tip: ['Think of what you like to eat.', 'Start with a capital letter, for example: I like rice.', 'End with a full stop.'], free: true, coachAfter: 6000, ok: own(function (a) { return message(a).length >= 3; }), coach: coachSentence }] },
  { id: 'y2fix', title: 'Fix mistakes', icon: '🔧', learned: 'BACKSPACE deletes the letter before the cursor. You can correct your own work.',
    teach: [
      slide('BACKSPACE', ['Everyone makes typing mistakes, and you can correct them.', 'BACKSPACE deletes the letter just before the cursor.', 'Press it once for each letter you want to delete.'], keysArt([['⌫', 'delete the letter before']]), 'Everyone makes typing mistakes, and you can correct them. Back space deletes the letter just before the cursor. Press it once for each letter you want to delete.'),
      slide('Moving the cursor', ['Click next to a mistake to move the cursor there.', 'The left and right arrow keys move the cursor one letter at a time.'], keysArt([['←', 'left'], ['→', 'right']]))],
    html: '<div>Dear Gran,</div><div>i lik my new bikee.</div>',
    steps: [
      { say: 'The word  bikee  has one e too many. Delete one e.', sub: 'Click just after bikee, then press BACKSPACE once.', voice: 'The last word has one e too many. Click just after the second e, before the full stop. Then press back space once.', win: 'bike is right!', tip: ['Click just after the last e, before the full stop.', 'Press BACKSPACE once.', 'The arrow keys can move the cursor to the right place.'], ok: function (e, a) { return /new bike\./.test(all(a)) && !/bikee/i.test(all(a)); },
        coach: function (a) { return !/bikee/i.test(all(a)) && !/new bike\./.test(all(a)) ? 'Check the end of the sentence. It should say:  new bike.' : ''; } },
      { say: 'The word  lik  needs an e. Make it  like', sub: 'Click just after the k, then type e.', voice: 'The second word needs an e. Click just after the k, then type e.', win: 'like is right!', tip: ['Click just after the k in lik.', 'Type the letter e.'], ok: function (e, a) { return /(?:^|\s)like(?!\p{L})/u.test(all(a)); },
        coach: function (a) { return /(?:^|\s)lik(?:e)?(?!\p{L})/u.test(all(a)) ? '' : 'The word should be:  like'; } },
      { say: 'The sentence must start with a capital  I', sub: 'Click just after the small i, press BACKSPACE, then hold SHIFT and press I.', voice: 'The sentence must start with a capital I. Click just after the small i. Press back space. Then hold shift and press I.', win: 'You corrected every mistake!', tip: ['Click just after the small i.', 'Press BACKSPACE once.', 'Hold SHIFT and press I.'], ok: function (e, a) { return exact(a, 'I like my new bike.'); },
        coach: function (a) { const l = caretLine(a); return /^i /.test(l) ? '' : /^(?:Ii|iI) /.test(l) ? 'Now there are two letters i. Delete the small one.' : coachFor('I like my new bike.')(a); } }] },
  { id: 'y2ask', title: 'Ask and exclaim', icon: '❓', learned: 'A question ends with a question mark. An exclamation mark shows strong feeling. ENTER starts a new line.',
    teach: [
      slide('Question marks', ['A question asks something, and it ends with a question mark.', 'To type one, hold SHIFT and press the key next to the full stop.'], stack(pageArt('<p>How are you<b>?</b></p>'), keysArt([['Shift', 'hold it'], ['? /', 'press once']])), 'A question asks something, and it ends with a question mark. To type one, hold shift and press the key next to the full stop.'),
      slide('Exclamation marks and ENTER', ['An exclamation mark shows strong feeling, such as joy or surprise.', 'To type one, hold SHIFT and press the number 1.', 'The ENTER key starts a new line.'], stack(pageArt('<p>How are you?</p><p>I am very happy<b>!</b></p>'), keysArt([['Enter', 'new line']])), 'An exclamation mark shows strong feeling, such as joy or surprise. To type one, hold shift and press the number 1. The enter key starts a new line.')],
    steps: [
      { say: 'Type the question:  How are you?', sub: 'For ? hold SHIFT and press the key next to the full stop.', voice: 'Type the question: How are you? For the question mark, hold shift and press the key next to the full stop.', win: 'That is a question!', tip: ['Hold SHIFT and press H.', 'Put one space between the words.', 'Hold SHIFT and press the ? key, next to the full stop.'], ok: function (e, a) { return exact(a, 'How are you?'); }, coach: coachFor('How are you?') },
      { say: 'Press ENTER to start a new line', sub: 'ENTER is on the right side of the keyboard.', win: 'The cursor is on a new line.', tip: ['Find the ENTER key.', 'Press it once.'], ok: function (e, a) { return a.doc.page.children.length >= 2 || /\S\n/.test(a.doc.page.innerText); } },
      { say: 'Now type:  I am very happy!', sub: 'For ! hold SHIFT and press 1.', voice: 'Now type: I am very happy! For the exclamation mark, hold shift and press 1.', win: 'You asked a question and showed a feeling!', tip: ['Hold SHIFT and press I.', 'At the end, hold SHIFT and press 1.'], ok: function (e, a) { return onNewLine(a, 'I am very happy!'); }, coach: coachFor('I am very happy!', true) }] },
  { id: 'y2parts', title: 'Parts of a letter', icon: '✉️', learned: 'A letter has a greeting, a message and a closing.',
    teach: [
      slide('The parts of a letter', ['The greeting, such as "Dear Gran,", says who the letter is for.', 'The message is what you want to say.', 'The closing, such as "From Sam", says who sent it.'], letterParts),
      slide('One part on each line', ['A comma follows the greeting.', 'Press ENTER after the greeting.', 'Press ENTER again before the closing.'], letterParts)],
    steps: [
      { say: 'Type the greeting:  Dear Gran,', sub: 'Capital D and G, then a comma. The comma key is next to M.', voice: 'Type the greeting: Dear Gran. Use a capital D and a capital G, then a comma. The comma key is next to M.', win: 'A greeting with a comma!', tip: ['Hold SHIFT for D and for G.', 'Put one space between the words.', 'The comma key is next to the letter M.'], ok: function (e, a) { return exact(a, 'Dear Gran,'); }, coach: coachFor('Dear Gran,') },
      { say: 'Press ENTER. Type:  Thank you for my present.', sub: 'This is the message.', voice: 'Press enter. Type the message: Thank you for my present. End with a full stop.', win: 'That is the message.', tip: ['Press ENTER once.', 'Hold SHIFT and press T.', 'End with a full stop.'], ok: function (e, a) { return onNewLine(a, 'Thank you for my present.'); }, coach: coachFor('Thank you for my present.', true) },
      { say: 'Press ENTER. Type  From  and then your name', sub: 'From, a space, then your name with a capital letter.', voice: 'Press enter. Type From, then a space, then your name with a capital letter.', win: 'Your letter has all three parts!', tip: ['Press ENTER once.', 'Hold SHIFT and press F, then type rom.', 'Press SPACE and type your name.'], free: true, settle: 3500, ok: own(function (a) { return lines(a).length >= 3 && closed(a); }), coach: coachClosing }] },
  { id: 'y2own', title: 'My own letter', icon: '🌟', learned: 'You wrote a whole letter by yourself!',
    teach: [slide('Your own letter', ['Think of someone you would like to write to.', 'Write a greeting, a message and a closing, each on a new line.', 'Read your letter again and correct any mistakes.'], letterParts)],
    steps: [
      { say: 'Type a greeting to someone you choose', sub: 'Dear, a name and a comma. For example:  Dear Mum,', voice: 'Type a greeting to someone you choose. Type Dear, then a name, then a comma.', win: 'A good greeting!', tip: ['Type Dear with a capital D.', 'Press SPACE and type a name with a capital letter.', 'Type a comma.'], free: true, ok: own(function (a) { return isGreeting(lines(a)[0] || ''); }), coach: topGreeting },
      { say: 'Press ENTER. Write two sentences for your message', sub: 'Each has three words or more, and ends with . ? or !', voice: 'Press enter. Write two sentences. Each one has three words or more, and ends with a full stop, a question mark or an exclamation mark.', win: 'A lovely message!', tip: ['Press ENTER once.', 'Start each sentence with a capital letter.', 'You may ask a question, such as: How are you today?'], free: true, coachAfter: 6000, ok: own(function (a) { return isGreeting(lines(a)[0] || '') && message(a).length >= 2; }), coach: coachSentence },
      { say: 'Press ENTER. Finish with  From  and your name', sub: 'Then read your letter and check it.', voice: 'Press enter. Finish with From and your name. Then read your letter and check it.', win: 'Your own letter is finished!', tip: ['Press ENTER once.', 'Type From, press SPACE, then type your name.'], free: true, settle: 3500, ok: own(function (a) { return isGreeting(lines(a)[0] || '') && message(a).length >= 2 && closed(a); }), coach: coachClosing }] }
];

/* ---------- Year 3 ---------- */
const COPIED = ['My birthday is in May.', 'On Monday I will visit London.'];
/* a sentence of the learner's own with a person's name after the first word: a word with a capital that is not a day, and not a month used
   as a date ("in May"; April, May and June can also be names) */
const hasName = function (s) {
  const w = s.split(' ');
  return w.some(function (x, i) { return i > 0 && /^\p{Lu}\p{Ll}/u.test(x) && !new RegExp('^(?:' + DAYS + ')\\b').test(x) && !(new RegExp('^(?:' + MONTHS + ')\\b').test(x) && /^(?:in|on|of|last|next|this|since|until|during|\d+(?:st|nd|rd|th)?)$/i.test(w[i - 1])); });
};
const ownSentences = function (a) { return message(a).filter(function (s) { return COPIED.indexOf(s) < 0; }); };
const layoutOk = function (a) { return DATE.test(lines(a)[0] || '') && isGreeting(lines(a)[1] || ''); };
const listItems = function (a) { return Array.prototype.filter.call(a.doc.page.querySelectorAll('ul li, ol li'), function (li) { return li.textContent.trim(); }).length; };
const askLetter = function (a) { const m = message(a); return m.length >= 3 && m.some(function (s) { return /\?$/.test(s); }); };
const styled = function (a, words, style) { return a.doc.styled(words, style); };

const YEAR3 = [
  { id: 'y3greet', title: 'Greet and ask', icon: '👋', learned: 'A comma follows the greeting. A question ends with a question mark, and an exclamation mark shows strong feeling.',
    teach: [
      slide('The start of a letter', ['A letter starts with a greeting, such as Dear Sam, and a comma follows it.', 'Press ENTER so that the message starts on a new line.'], pageArt('<p>Dear Sam<b>,</b></p><p>How are you?</p>')),
      slide('Ending a sentence', ['A full stop ends a statement, which tells the reader something.', 'A question mark ends a question.', 'An exclamation mark shows strong feeling, such as joy or surprise.'], pageArt('<p>I am at home<b>.</b></p><p>How are you<b>?</b></p><p>What fun we had<b>!</b></p>'))],
    steps: [
      { say: 'Type the greeting:  Dear Sam,', sub: 'The comma key is next to the letter M.', voice: 'Type the greeting: Dear Sam, with a comma after Sam.', win: 'A greeting with a comma.', tip: ['Hold SHIFT for the capital D and S.', 'Type the comma straight after Sam.'], ok: function (e, a) { return exact(a, 'Dear Sam,'); }, coach: coachFor('Dear Sam,') },
      { say: 'Press ENTER. Type the question:  How are you?', sub: 'For ? hold SHIFT and press the key next to the full stop.', voice: 'Press enter. Type the question: How are you? Remember the question mark.', win: 'A question ends with a question mark.', tip: ['Press ENTER once.', 'Hold SHIFT and press H.', 'Hold SHIFT and press the ? key.'], ok: function (e, a) { return onNewLine(a, 'How are you?'); }, coach: coachFor('How are you?', true) },
      { say: 'Press SPACE. Type:  What a great holiday we had!', sub: 'For ! hold SHIFT and press 1.', voice: 'Press space. Type: What a great holiday we had! End with an exclamation mark.', win: 'The exclamation mark shows how happy you are.', tip: ['Press the SPACE bar once.', 'At the end, hold SHIFT and press 1.'], ok: function (e, a) { return exact(a, 'What a great holiday we had!'); }, coach: coachFor('What a great holiday we had!') }] },
  { id: 'y3caps', title: 'Capital letters', icon: '🔠', learned: 'Sentences, names, places, days, months and the word I take capital letters.',
    teach: [
      slide('When to use a capital', ['Every sentence starts with a capital letter.', 'So do the names of people and places, such as Ben and London.', 'Days, months and the word I do too. Seasons, such as summer, do not.'], pageArt('<p><b>M</b>onday &nbsp; <b>M</b>ay</p><p><b>B</b>en &nbsp; <b>L</b>ondon &nbsp; <b>I</b></p><p>summer</p>')),
      slide('Mum or my mum?', ['Used as a name, Mum has a capital letter, as in "Dear Mum,".', 'After the word my, it does not: I love my mum.'], pageArt('<p>Dear <b>M</b>um,</p><p>I love my <b>m</b>um.</p>'))],
    steps: [
      { say: 'Type:  My birthday is in May.', sub: 'May is a month, so it starts with a capital M.', voice: 'Type: My birthday is in May. May is a month, so it needs a capital M.', win: 'May has a capital because it is a month.', tip: ['Hold SHIFT for the capital letters.', 'End with a full stop.'], ok: function (e, a) { return exact(a, COPIED[0]); }, coach: coachFor(COPIED[0]) },
      { say: 'Press SPACE. Type:  On Monday I will visit London.', sub: 'Monday, I and London each need a capital letter.', voice: 'Press space. Type: On Monday I will visit London.', win: 'A day, the word I and a place.', tip: ['Capitals: O, M, I and L.', 'End with a full stop.'], ok: function (e, a) { return exact(a, COPIED[1]); }, coach: coachFor(COPIED[1]) },
      { say: 'Press ENTER. Write a sentence with a friend\'s name in the middle', sub: 'For example:  My friend is Ben.  The name needs a capital letter.', voice: 'Press enter. Write your own sentence with the name of a friend in the middle of it.', win: 'Your friend\'s name has a capital letter.', tip: ['Press ENTER once.', 'Start with a capital letter.', 'Put the name after the first word, then finish with a full stop.'], free: true, coachAfter: 6000, ok: own(function (a) { return ownSentences(a).some(hasName); }),
        coach: function (a) { const mine = ownSentences(a); return mine.length && !mine.some(hasName) ? 'Put a friend\'s name in the middle of your sentence, with a capital letter, like this: My friend is Ben.' : coachSentence(a); } }] },
  { id: 'y3fix', title: 'Fix and check', icon: '🔧', learned: 'BACKSPACE deletes on the left of the cursor, DELETE on the right. A spell checker cannot find every mistake.',
    teach: [
      slide('Two keys that delete', ['BACKSPACE deletes the character before the cursor, on its left.', 'DELETE deletes the character after the cursor, on its right.', 'The arrow keys move the cursor one character at a time.'], keysArt([['⌫', 'deletes left'], ['Delete', 'deletes right']])),
      slide('Checking the spelling', ['A red wavy line marks a possible spelling mistake.', 'Right-click the word, then click the correct spelling.', 'A spell checker cannot find every mistake, so read your work too.'], pageArt('<p>My <u class="bad">scool</u> is big.</p>'))],
    html: '<div>Dear Ali,</div><div>Thank you four the ' + bad('lovly', 'lovely') + ' present.</div><div>I read my new book every every day.</div>',
    steps: [
      { say: 'Right-click the red word and choose the right spelling', sub: 'The right mouse button opens a small menu.', win: 'lovely is spelled correctly.', tip: ['Point at the word with the red wavy line.', 'Press the right mouse button.', 'Click the correct spelling in the menu.'], ok: function (e, a) { return a.doc.has('lovely') && !a.doc.has('lovly'); } },
      /* "four" is a real word, so a spell checker passes it: only reading the sentence finds it */
      { say: 'Read the first sentence. Change  four  to  for', sub: 'Click just before the u, then press DELETE.', voice: 'Read the first sentence. Change the number word four to the word for. Click just before the letter u, then press delete.', win: 'for is right. four is a real word, so a spell checker did not mark it.', tip: ['Click just before the letter u in four.', 'Press DELETE once: it deletes the letter after the cursor.', 'Read the sentence again.'], ok: function (e, a) { return a.doc.has('thank you for the') && !a.doc.has('four'); },
        coach: function (a) { return a.doc.has('thank you for the') || a.doc.has('four') ? '' : 'The words should be:  Thank you for the'; } },
      { say: 'The word  every  is typed twice. Delete one of them', sub: 'Double-click one of them, then press DELETE.', win: 'Every mistake is corrected!', tip: ['Double-click one word every. It turns blue.', 'Press DELETE.', 'Check that one space is left between the words.'], ok: function (e, a) { return a.doc.count('every') === 1 && a.doc.has('every day'); },
        coach: function (a) { return a.doc.count('every') === 0 ? 'Keep one of them: the sentence should say  every day.' : ''; } }] },
  { id: 'y3parts', title: 'Parts of a letter', icon: '📨', learned: 'A letter has a date, a greeting, a message, a closing and your name.',
    teach: [
      slide('The layout of a letter', ['The date goes at the top, often on the right.', 'Below it come the greeting and then the message.', 'The closing and your name go at the end.'], labelled([['3 May', 'date', 'right'], ['Dear Sam,', 'greeting'], ['We had fun.', 'message'], ['Best wishes,', 'closing'], ['Mia', 'name']])),
      slide('Dates and closings', ['Write the number, then the month: 3 May. No comma is needed.', 'A month always starts with a capital letter.', 'Best wishes and From are common closings.'], pageArt('<p style="text-align:right">3 May</p><p>Best wishes,</p><p>Mia</p>'))],
    html: '<div><br></div><div><br></div><div>We had a super holiday by the lake. I learned to swim.</div><div><br></div>',
    steps: [
      { say: 'Click the first line. Type a date, such as today\'s date', sub: 'The number, a space, then the month:  3 May', voice: 'Click the first line. Type a date, such as today. Write the number, then the month.', win: 'The date is at the top.', tip: ['Click on the very first empty line.', 'Type the day number and press SPACE.', 'Type the month with a capital letter.'], free: true, settle: 2500, ok: own(function (a) { return lines(a).length >= 2 && DATE.test(lines(a)[0]); }), coach: topDate },
      { say: 'Click the empty line under the date. Type a greeting', sub: 'Dear, a name and a comma. For example:  Dear Auntie,', voice: 'Click the empty line under the date. Type Dear, then a name, then a comma.', win: 'The greeting is in the right place.', tip: ['Click on the second empty line.', 'Type Dear, press SPACE and type a name with a capital letter.', 'Type a comma.'], free: true, ok: own(layoutOk), coach: underDate },
      { say: 'Add the closing  Best wishes,  and then your name', sub: 'Click below the message. Type Best wishes, press ENTER, then type your name.', voice: 'Add the closing. Click below the message. Type Best wishes, with a comma. Press enter, then type your name.', win: 'Your letter has every part!', tip: ['Click on the empty line under the message.', 'Type Best wishes, with a comma.', 'Press ENTER and type your name.'], free: true, settle: 3500, ok: own(function (a) { return layoutOk(a) && lines(a).length >= 4 && closed(a); }), coach: atEnd }] },
  { id: 'y3style', title: 'Bold, italic, underline', icon: '🅱️', learned: 'Select the words first, then choose bold, italic or underline.',
    teach: [
      slide('Select, then format', ['First select the words: double-click one word, or press and drag across several.', 'Selected words are highlighted in blue.', 'Then click a button on the toolbar.'], pageArt('<p>You Are <mark>Invited</mark></p>')),
      slide('Bold, italic and underline', ['Bold makes letters thicker and darker.', 'Italic makes letters slant.', 'Underline draws a line beneath the letters.'], pageArt('<p><b>Bold</b> &nbsp; <i>Italic</i> &nbsp; <u>Underline</u></p>'))],
    html: '<div>You Are Invited</div><div>Dear Maya,</div><div>Please come to my party on Saturday.</div><div>Bring a friend.</div><div>From Leo</div>',
    steps: [
      { say: 'Make the title  You Are Invited  bold', sub: 'Drag across the three words, then click B.', win: 'The title stands out.', btn: 'bold', tip: ['Click just before You, hold the mouse button and drag to the end of Invited.', 'The words turn blue.', 'Click the B button.'], ok: function (e, a) { return styled(a, 'You Are Invited', a.doc.T.bold); } },
      { say: 'Make the word  Saturday  italic', sub: 'Double-click Saturday, then click I.', win: 'Italic letters slant.', btn: 'italic', tip: ['Double-click the word Saturday.', 'Click the I button.'], ok: function (e, a) { return styled(a, 'Saturday', a.doc.T.italic); } },
      { say: 'Underline the words  Bring a friend', sub: 'Drag across the words, then click U.', win: 'Underlined!', btn: 'underline', tip: ['Press just before Bring and drag to the end of friend.', 'Click the U button.'], ok: function (e, a) { return styled(a, 'Bring friend', a.doc.T.underline); } }] },
  { id: 'y3font', title: 'Font, size and colour', icon: '🎨', learned: 'A font is a design of letters. Size is measured in points.',
    teach: [
      slide('Font and size', ['A font is a design of letters, such as Georgia or Comic Sans.', 'Size is measured in points: 12 is usual in a letter and 24 is large.', 'Select the words, then choose from the font or size box.'], pageArt('<p style="font-family:Comic Sans MS;font-size:1.5em">Party Time</p><p style="font-size:.85em">Georgia, 12 points</p>')),
      slide('Font colour', ['Font colour changes the colour of the letters.', 'Colour only a few important words, so the letter stays easy to read.'], pageArt('<p>See you on <span style="color:#e02f44">Saturday</span>.</p>'))],
    html: '<div>Party Time</div><div>Dear Maya,</div><div>Please come to my party on Saturday.</div><div>From Leo</div>',
    steps: [
      { say: 'Change the title  Party Time  to Comic Sans', sub: 'Select the title, then use the font box.', win: 'A fun font for a party.', btn: 'font', tip: ['Drag across Party Time so it turns blue.', 'Click the font box (it says Georgia).', 'Choose Comic Sans.'], ok: function (e, a) { return styled(a, 'Party Time', a.doc.T.font(/comic/i)); } },
      { say: 'Make the title bigger: choose size 24', sub: 'Select the title, then use the size box.', win: '24 points is a good size for a title.', btn: 'size', tip: ['Select Party Time again if it is not blue.', 'Click the size box (it says 12).', 'Choose 24.'], ok: function (e, a) { return styled(a, 'Party Time', a.doc.T.size(24)); } },
      { say: 'Make the word  Saturday  red', sub: 'Double-click it, then click the red circle.', win: 'The day is easy to see.', btn: 'c1', tip: ['Double-click the word Saturday.', 'Click the red circle on the toolbar.'], ok: function (e, a) { return styled(a, 'Saturday', a.doc.T.color(1)); } }] },
  { id: 'y3align', title: 'Line up the letter', icon: '📐', learned: 'A title can be centred, a date is often on the right, and the message is on the left.',
    teach: [slide('Alignment', ['Alignment sets where a line sits across the page.', 'Left alignment is usual for the message.', 'Centre suits a title. A date is often placed on the right.'], pageArt('<p style="text-align:center"><b>My News</b></p><p style="text-align:right">3 May</p><p>Dear Gran,</p>'))],
    html: '<div>My News</div><div>3 May</div><div>Dear Gran,</div><div style="text-align:center">I joined the swimming club. I love it!</div><div>From Mia</div>',
    steps: [
      { say: 'Put the title  My News  in the centre', sub: 'Click in the title, then click Centre.', win: 'The title is centred.', btn: 'justifyCenter', tip: ['Click anywhere in My News.', 'Click the Centre button.'], ok: function (e, a) { return styled(a, 'My News', a.doc.T.center); } },
      { say: 'Move the date to the right side', sub: 'Click in the date, then click Align right.', win: 'The date is on the right.', btn: 'justifyRight', tip: ['Click anywhere in 3 May.', 'Click the Align right button.'], ok: function (e, a) { return styled(a, '3 May', a.doc.T.right); } },
      { say: 'The message is centred by mistake. Put it on the left', sub: 'Click in the message, then click Align left.', win: 'The letter is lined up correctly.', btn: 'justifyLeft', tip: ['Click anywhere in the message.', 'Click the Align left button.'], ok: function (e, a) { return styled(a, 'joined', a.doc.T.left); } }] },
  { id: 'y3list', title: 'Make a list', icon: '📋', learned: 'A list puts each item on its own line. Use bullets for any order, and numbers for items that go in order.',
    teach: [
      slide('Lists in a letter', ['A list puts each item on its own line, so it is easy to read.', 'Bullets suit items that can be in any order.', 'Numbers suit items that go in order: 1, 2, 3.'], pageArt('<ul><li>A hat</li><li>A game</li></ul>')),
      slide('Adding to a list', ['Click at the end of the last item and press ENTER.', 'A new bullet or number appears, ready for the next item.'], pageArt('<ul><li>A snack</li><li><i class="cur"></i></li></ul>'))],
    html: '<div>Please bring:</div><div>A hat</div><div>A game</div><div>A snack</div>',
    steps: [
      { say: 'Turn the three items into a list with bullets', sub: 'Drag from A hat to the end of A snack, then click Bullets.', win: 'A neat list.', btn: 'insertUnorderedList', tip: ['Press just before A hat and drag to the end of A snack.', 'All three lines turn blue.', 'Click the Bullets button.'], ok: function (e, a) { return a.doc.page.querySelectorAll('ul li').length >= 3; } },
      { say: 'Add one more item to the list', sub: 'Click after A snack, press ENTER and type the item.', win: 'Your list has one more item.', tip: ['Click at the very end of A snack.', 'Press ENTER.', 'Type something to bring, such as A towel.'], free: true, settle: 2500, start: function (a) { a.doc.st.items = listItems(a); }, ok: own(function (a) { return listItems(a) > a.doc.st.items; }) },
      { say: 'Change the bullets to numbers', sub: 'Select the whole list, then click Numbering.', win: 'Now the list is numbered.', btn: 'insertOrderedList', tip: ['Drag from the first item to the end of the last item.', 'Click the Numbering button, next to Bullets.'], ok: function (e, a) { return a.doc.page.querySelectorAll('ol li').length >= 4; } }] },
  { id: 'y3save', title: 'Save and check', icon: '💾', learned: 'Save your work often, and check a print preview before you print.', needs: K.NEEDS,
    teach: [
      slide('Why save?', ['Saving keeps your work as a file with a name.', 'Work that is not saved can be lost.', 'Press CTRL and S together to save. Save often.'], cards([['💾', 'Save'], ['📁', 'a named file']]), 'Saving keeps your work as a file with a name. Work that is not saved can be lost. Press control and S together to save. Save often.'),
      slide('Print preview', ['A print preview shows how the page will look on paper.', 'Check it before you print, so that you do not waste paper.', 'Press CTRL and P together to open it.'], cards([['👀', 'preview'], ['🖨️', 'print']]), 'A print preview shows how the page will look on paper. Check it before you print, so that you do not waste paper. Press control and P together to open it.')],
    html: '<div>Dear Grandad,</div><div>We went to the farm today.</div>',
    steps: [
      { say: 'Click at the end of the last line. Add a sentence about the farm', sub: 'Press SPACE, then write three words or more.', voice: 'Click at the end of the last line. Press space and write a sentence about the farm.', win: 'A good sentence.', tip: ['Click just after today.', 'Press SPACE.', 'Write a sentence, such as: We fed the goats.'], free: true, coachAfter: 6000, ok: own(function (a) { return message(a).length >= 2; }), coach: coachSentence },
      { say: 'Save your letter', sub: 'Press CTRL + S, type a file name, then click Save.', voice: 'Save your letter. Press control and S, type a name for the file, then click Save.', win: 'Saved. The file has a name.', btn: 'save', tip: ['Hold CTRL and press S. Or click the 💾 button at the top.', 'Type a name for the file.', 'Click Save.'], ok: function (e) { return e.t === 'save'; } },
      { say: 'Open the print preview, check the page, then close it', sub: 'Press CTRL + P. Click Close when you have checked it.', voice: 'Open the print preview. Press control and P. Check the page, then click Close.', win: 'Always check before you print.', btn: 'print', tip: ['Hold CTRL and press P. Or click the 🖨️ button.', 'Read your page.', 'Click Close. Only click Print if your teacher says so.'], ok: function (e) { return e.t === 'preview' || e.t === 'print'; } }] },
  { id: 'y3own', title: 'My own letter', icon: '📝', learned: 'You planned and wrote a whole letter by yourself.',
    teach: [slide('Plan, write, check', ['Decide who your letter is for and what you want to tell them.', 'Write a greeting, a message and a closing, each on a new line.', 'Read it again and correct any mistakes.'], letterParts)],
    steps: [
      { say: 'Type a greeting to the person you chose', sub: 'Dear, a name and a comma.', voice: 'Type a greeting to the person you chose. Type Dear, then a name, then a comma.', win: 'A good start.', tip: ['Type Dear, press SPACE and type a name.', 'Names start with a capital letter.', 'Type a comma.'], free: true, ok: own(function (a) { return isGreeting(lines(a)[0] || ''); }), coach: topGreeting },
      { say: 'Press ENTER. Write three sentences, with one question', sub: 'Each starts with a capital and ends with . ? or !', voice: 'Press enter. Write your message with three sentences. Make one of them a question.', win: 'A clear, friendly message.', tip: ['Press ENTER once.', 'Tell your news in two sentences.', 'Ask the reader a question, and end it with a question mark.'], free: true, coachAfter: 7000, ok: own(function (a) { return isGreeting(lines(a)[0] || '') && askLetter(a); }),
        coach: function (a) { return message(a).length >= 3 && !askLetter(a) ? 'Ask the reader a question, and end it with a question mark.' : coachSentence(a); } },
      { say: 'Press ENTER. Finish with a closing and your name', sub: 'Best wishes, or From, then your name.', voice: 'Press enter. Finish with Best wishes, or From, and then your name.', win: 'You wrote a whole letter!', tip: ['Press ENTER once.', 'Type Best wishes, with a comma, or type From.', 'Press ENTER and type your name. Then read your letter again.'], free: true, settle: 3500, ok: own(function (a) { return isGreeting(lines(a)[0] || '') && askLetter(a) && closed(a); }), coach: coachClosing }] }
];

[[YEAR2, 'y2'], [YEAR3, 'y3']].forEach(function (pair) {
  pair[0].forEach(function (lv) { lv.ribbon = pair[1]; lv.build = function (body, api, year) { K.build(body, api, year, lv); }; });
});
CC.letterYoung = {
  2: { sub: 'Learn to type a letter, one small step at a time.', levels: YEAR2 },
  3: { sub: 'Build your letter skills, one small step at a time.', levels: YEAR3 }
};
})();
