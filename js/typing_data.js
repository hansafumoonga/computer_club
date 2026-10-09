/* typing_data.js - all the content of the Typing Club, as plain data (no code here).
   To change a level, edit its words or sentences. To add a level, add one object to LEVELS.
   Levels 1-4 only use the letters taught so far, so a learner never meets a key they have not practised.
   Characters used overall: letters, digits, space and . , ? ! -  (all on a normal keyboard).        */
(function () {
'use strict';
const CC = window.CC;

/* the speed a typist of each year is aiming for (words per minute, 1 word = 5 characters). Teachers can change these. */
const TARGET_WPM = { 4: 12, 5: 18, 6: 24 };

const LEVELS = [
  { id: 1, name: 'Home Row', icon: '🏠', theme: 'jungle', keys: 'asdfghjkl', newKeys: 'A S D F G H J K L',
    tip: 'Rest your fingers on A S D F and J K L. Feel the little bumps on F and J.',
    words: ['as', 'ask', 'add', 'all', 'dad', 'fad', 'gas', 'had', 'has', 'lad', 'lag', 'sad', 'sag', 'ash', 'dash', 'fall', 'flag', 'flask', 'glad', 'glass', 'hall', 'lash', 'lass', 'salad', 'shall', 'sash', 'gash', 'jag', 'flash', 'halls', 'falls', 'alfalfa'],
    sentences: ['a lad had a salad', 'dad asks a lad', 'all lads shall dash', 'a glass falls', 'dad had a flask', 'a sad lass falls', 'ask dad as a lad', 'dad has a flag', 'glad lads dash', 'a flash falls as dad asks'] },
  { id: 2, name: 'Meet E and I', icon: '🌴', theme: 'beach', keys: 'asdfghjklei', newKeys: 'E I',
    tip: 'Reach up with your middle fingers for E and I, then come straight back home.',
    words: ['he', 'she', 'see', 'led', 'fed', 'feed', 'feel', 'fish', 'file', 'kid', 'lid', 'aid', 'side', 'slide', 'sled', 'silk', 'like', 'life', 'leaf', 'lake', 'dish', 'disk', 'desk', 'hide', 'jade', 'jig', 'shield', 'daisies', 'fields', 'ideas', 'ladies', 'held', 'sheds', 'shelf', 'shake', 'agile'],
    sentences: ['she feeds a sad fish', 'dad likes a salad', 'she has a leaf', 'a kid slid a disk', 'he said she is glad', 'ask a kid if she sees dad', 'all fish like a lake', 'she likes silk', 'she held a shield', 'ladies like fields', 'dad is glad she sees a lake'] },
  { id: 3, name: 'Top Row', icon: '🌋', theme: 'volcano', keys: 'adefghijklopstuyr', newKeys: 'R T Y U O P',
    tip: 'Your index fingers reach R T and Y U. Ring and little fingers take O and P.',
    words: ['the', 'that', 'this', 'these', 'those', 'there', 'story', 'party', 'pretty', 'outside', 'sports', 'paper', 'tree', 'three', 'happy', 'study', 'lights', 'flight', 'shoot', 'report', 'sharp', 'speed', 'dried', 'turkey', 'horse', 'guitar', 'jetty', 'trophy', 'poetry', 'jury', 'yard', 'play', 'tool', 'door', 'floor', 'proud'],
    sentences: ['the dog is happy', 'the girl reads a story', 'she plays a guitar', 'the sheep eat grass', 'a turkey ate the grass', 'the girl liked the party', 'dad is proud of the report', 'she dried the paper', 'she plays the guitar at the party', 'the story is pretty', 'the horse is at the door'] },
  { id: 4, name: 'Bottom Row', icon: '🌊', theme: 'ocean', keys: 'abcdefghijklmnopqrstuvwxyz', newKeys: 'Z X C V B N M',
    tip: 'Curl your fingers down gently for the bottom row. Keep your wrists relaxed.',
    words: ['quick', 'brown', 'fox', 'jump', 'lazy', 'zebra', 'vivid', 'boxes', 'mix', 'climb', 'nine', 'vowel', 'wizard', 'banana', 'whale', 'queen', 'crazy', 'wave', 'vex', 'zoom', 'bunny', 'cable', 'magic', 'camel', 'ocean', 'jazz', 'verb', 'maze', 'noble', 'quiz'],
    sentences: ['the quick brown fox jumps over the lazy dog', 'a zebra can jump over a box', 'we mix the blue and yellow paint', 'the whale swims in the blue sea', 'nine bananas were on the box', 'a magic camel can zoom away', 'the queen has a vivid crown', 'quick wizards mix the potion'] },
  { id: 5, name: 'Everyday Words', icon: '🏜️', theme: 'desert', keys: 'abcdefghijklmnopqrstuvwxyz', newKeys: '',
    tip: 'Look at the screen, not at your hands. Let your fingers find the keys.',
    words: ['the', 'and', 'you', 'they', 'with', 'have', 'this', 'from', 'that', 'what', 'when', 'been', 'were', 'said', 'each', 'work', 'play', 'good', 'come', 'time', 'make', 'many', 'some', 'could', 'would', 'about', 'other', 'there', 'their', 'which', 'every', 'after', 'again', 'house', 'water', 'small', 'think', 'right', 'great', 'place'],
    sentences: ['we can read and write', 'the cat sat on the mat', 'they have a good time', 'what do you think about this', 'we play after we work', 'every day is a new day', 'there is water in the house', 'they said it was great', 'we could make a big plan', 'each child has a small bag'] },
  { id: 6, name: 'Big Words', icon: '🏔️', theme: 'snow', keys: 'abcdefghijklmnopqrstuvwxyz', newKeys: '',
    tip: 'Do not rush. Smooth and steady is faster than fast and messy.',
    words: ['computer', 'keyboard', 'monitor', 'printer', 'internet', 'teacher', 'school', 'learning', 'practice', 'typing', 'screen', 'weather', 'together', 'because', 'another', 'between', 'morning', 'country', 'chapter', 'strange', 'animals', 'kitchen', 'garden', 'holiday', 'birthday', 'journey', 'science', 'history', 'mystery', 'elephant', 'football', 'friendly'],
    sentences: ['the teacher uses a computer in school', 'our friendly class is learning together', 'practice makes typing smooth and fast', 'the elephant walked through the garden', 'we play football every morning', 'science and history are my favourite subjects', 'the mystery journey began on a birthday', 'animals live in every country'] },
  { id: 7, name: 'Capitals and Punctuation', icon: '🌆', theme: 'city', keys: 'letters, capitals and . , ? !', newKeys: 'Shift  . , ? !',
    tip: 'Hold Shift with your little finger on the OPPOSITE hand, tap the letter, then let go.',
    sentences: ['Lusaka is the capital city of Zambia.', 'My name is Chanda, and I love football.', 'Can you type this sentence?', 'Wow! That was a great game!', 'We live in Lusaka, Zambia.', 'Mr Banda teaches us computers.', 'Do you like to read, write, and draw?', 'Chipo and Mwansa play in the park.', 'Please close the door.', 'Hello, my friend!'] },
  { id: 8, name: 'Computer Facts', icon: '🖥️', theme: 'lab', keys: 'letters, capitals and punctuation', newKeys: '',
    tip: 'Read one phrase ahead while your fingers type. Your eyes lead, your fingers follow.',
    sentences: ['A mouse helps us click and drag on the screen.', 'The keyboard has letters, numbers, and symbols.', 'Always save your work before you close the computer.', 'Type with all ten fingers to go faster.', 'The monitor shows what the computer is doing.', 'Strong passwords keep our accounts safe.', 'Ask for help when you are stuck.', 'A good typist looks at the screen, not the keys.', 'Which key makes a capital letter?', 'We share the computers and take turns.'] },
  { id: 9, name: 'Numbers', icon: '🔢', theme: 'candy', keys: 'letters, numbers, capitals and punctuation', newKeys: '1 2 3 4 5 6 7 8 9 0 -',
    tip: 'Your fingers reach up to the number row. Stretch up, then come straight back.',
    sentences: ['Class 5B has 24 learners.', 'Our club meets on Friday at 2 pm.', 'I can type 15 words in 60 seconds.', 'There are 26 letters and 10 digits.', 'The year is 2026 and I am 10 years old.', 'Row 3 has 8 desks and 32 chairs.', 'Page 47 has 12 pictures.', 'Well-done! You scored 100 points.', 'Our new school has 4 big computer rooms.', 'We read 3 books in 2 weeks.'] },
  { id: 10, name: 'Marathon', icon: '🏆', theme: 'sky', keys: 'everything', newKeys: '',
    tip: 'This is a long one. Breathe, sit tall and keep a steady rhythm to the very end.',
    sentences: ['Typing is a skill that gets better with practice. Sit up straight, keep your fingers on the home row, and look at the screen, not the keys. Slow and steady wins the race!',
      'Computers help us learn, create, and share ideas. A good typist can write a story, finish homework, and send a message in just a few minutes. Keep practising every day!',
      'Our club is full of curious explorers. We click, drag, type, and solve puzzles together. Every small step makes us faster, kinder, and braver.'] }
];

/* the words that Word Blaster uses on the sentence levels: every word of the sentences, with its punctuation */
LEVELS.forEach(function (lv) {
  if (!lv.words) {
    const seen = {}, out = [];
    lv.sentences.forEach(function (s) { s.split(' ').forEach(function (w) { if (w && !seen[w]) { seen[w] = 1; out.push(w); } }); });
    lv.words = out;
  }
});

CC.TYPING = { TARGET_WPM: TARGET_WPM, LEVELS: LEVELS };
})();
