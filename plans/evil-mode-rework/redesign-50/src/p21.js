/* Pass 21 · Rotom's Lessons. The tutorial is woven into the UI itself: every page carries its lesson on T in the key
   strip, a lesson lays a dark sheet over the real page and cuts a spotlight round the one thing it teaches, and Rotom
   points at it with numbered steps. New pages: a lesson on the HQ, the guided first job, and the Lesson book. */
const LESSONS = ['Meet Rotom', 'The top bar', 'Orders', 'First Steps', 'Tasks', 'The night', 'Mornings', 'The Card', 'Heat', 'The board', 'The wheel', 'The Rotom Phone', 'Bills', 'Rocket notices you', 'The Founding'];
const LOF = { Start: 1, Guide: 1, HQ: 4, 'The Day': 7, Jobs: 8, Crew: 5, 'Pokémon': 5, Opposition: 9, Trainers: 8, Gimmicks: 8, Events: 6, Empire: 15, 'The Chair': 13, Rotom: 1, Menu: 12, Settings: 1 };
comp(21, 'keys', k => { const n = LOF[(PR.s || {}).g]; return n ? before('keys', 21)(k).replace('</footer>', `<span class="ls21" ${go('lessons')}><kbd>T</kbd>Lesson ${n}</span></footer>`) : before('keys', 21)(k); });

/* a lesson: the real page under a sheet, a spotlight, Rotom pointing */
const lesson = (under, spot, n, steps, cur, line, tip) => `<div class="scr nv k-ls21"><div class="rp21" data-nocheck>${under}</div>
  <div class="sheet21" style="--x:${spot[0]}px;--y:${spot[1]}px;--w:${spot[2]}px;--h:${spot[3]}px" data-nocheck></div><i class="ring21" style="left:${spot[0] - spot[2] / 2}px;top:${spot[1] - spot[3] / 2}px;width:${spot[2]}px;height:${spot[3]}px" data-nocheck></i>
  <div class="coach21" style="${tip}"><span class="rt">${SP('p-rotom', 64, '', 0)}</span><div class="cb"><small>Lesson ${n} of 15 · ${LESSONS[n - 1]}</small><p>${line}</p><div class="st21">${map(steps, (x, i) => `<i class="${i === cur ? 'on' : i < cur ? 'done' : ''}">${i + 1}</i>`)}<span class="sp"></span><button class="cta">Skip lesson</button><button class="cta on">Next</button></div></div></div>
  ${C('keys', [['Enter', 'next'], ['Esc', 'skip'], ['T', 'replay later']])}</div>`;
page('lessonhq', { g: 'HQ', t: 'Lesson · the lift console', kind: 'les21', from: 21 });
comp(21, 'k:les21', s => lesson(C('k:hub', PR.pages.hq), [480, 488, 940, 46], 4, [0, 1, 2], 0, '“Bzzt! This is your lift console. <b>1 to 6</b> ride to the HQ, the board, the crew, the Pokémon, jobs and the Ledger. The red counts are things waiting for you.”', 'left:250px;top:250px'));
page('lessonjob', { g: 'Jobs', t: 'Lesson · the Card', kind: 'les21b', from: 21 });
comp(21, 'k:les21b', s => lesson(C('k:card', PR.pages.card), [134, 230, 236, 300], 8, [0, 1, 2, 3], 1, '“Bzzt! This ring is your <b>chance</b>. Everything on the right adds to it or takes away. Over 50% and it usually works. Press Enter when you like the odds.”', 'left:300px;top:240px'));

/* the Lesson book */
page('lessons', { g: 'Guide', t: 'Lesson book', kind: 'book21', from: 21 });
comp(21, 'k:book21', s => `<div class="scr nv k-book21">${C('bg', 'hq')}${C('top', s, 'Lesson book', '15 lessons · replay any')}
  <section class="lb21" ${mm('panel')}>${map(LESSONS, (l, i) => `<button class="lb${i === 7 ? ' on' : ''}${i < 12 ? ' seen' : ''}" ${go(i === 3 ? 'lessonhq' : i === 7 ? 'lessonjob' : '')} style="--d:${i * 35}ms"><i>${i + 1}</i><b>${l}</b><em>${i < 12 ? '✓ seen' : 'Not yet'}</em></button>`)}</section>
  <div class="rbk21" data-nocheck>${SP('p-rotom', 110, '', 0)}</div>
  ${C('foot', 'Rotom', '“Bzzt! Lessons never repeat. Replay any here.”', [['Back', 'menu'], ['Replay The Card', 'lessonjob']])}${C('keys', [['←→↑↓', 'lesson'], ['Enter', 'replay'], ['Esc', 'back']])}</div>`);
