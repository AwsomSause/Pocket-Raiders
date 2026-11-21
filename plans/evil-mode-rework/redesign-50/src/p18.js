/* Pass 18 · Headlines. Kanto talks about you now: a news ticker crawls under the top bar of every page, every result
   comes with a newspaper clipping about what you just did, and Dread and Regard come from how the papers tell it.
   New pages: the Newsstand (three papers, three spins), the Scrapbook, and a Press interview. */
const TICK = ['CELADON DEPT. STORE RAIDED · POLICE HAVE “NO LEADS”', 'ROCKET DENIES ANY PART IN IT', 'RED SPOTTED IN PEWTER, HEADED EAST', 'GAME CORNER TAKINGS DOWN 12%', 'RAIN FOR DAY 19', 'WHO ARE THE CRIMSON ARMBANDS?'];
comp(18, 'top', (s, ttl, sub) => before('top', 18)(s, ttl, sub) + `<div class="tick18" ${go('papers')} data-nocheck><b>KANTO NEWS</b><span><i>${TICK.join(' ◆ ')} ◆ ${TICK.join(' ◆ ')}</i></span></div>`);
const CLIP = { 'PAID IN FULL': 'GROWLITHE SNATCHED FROM DAY CARE', 'DAY 18 DONE': 'CRIME WAVE: THREE JOBS IN ONE DAY', FOUNDED: 'NEW GANG IN VIRIDIAN? POLICE SHRUG' };
comp(18, 'k:result', (s, P) => { const h = before('k:result', 18)(s, P), c = CLIP[s.stamp]; return c ? h.replace(/<\/div>$/, `<div class="clip18" ${go('papers')}><small>The Kanto Ledger · Day 18</small><b>${c}</b><em>Dread +3 · Regard −1</em></div></div>`) : h; });

/* the Newsstand */
page('papers', { g: 'The Day', t: 'Newsstand', kind: 'news18', from: 18 });
const PAP = [['The Kanto Ledger', 'NIGHT RAID ON CELADON DEPT. STORE', 'Masked crew, “no leads”', 'c-rosa', 'Heat +4', 'plain'], ['Celadon Times', 'CROOKS IN CRIMSON: IS YOUR SHOP NEXT?', 'Shopkeepers lock their doors', 'c-gus', 'Dread +3', 'fear'], ['Saffron Gazette', 'THE POLITE THIEVES', 'Clerk: “They said thank you”', 'p-growlithe', 'Regard +2', 'kind']];
comp(18, 'k:news18', s => `<div class="scr nv k-news18">${C('bg', 'street')}${C('top', s, 'Newsstand', 'Day 18 · 3 papers')}
  <div class="ns18" ${mm('panel')}>${map(PAP, ([m, h, sub, k, fx, c], i) => `<div class="np18 ${c}${i === 1 ? ' on' : ''}" style="--d:${i * 150}ms"><b class="mast">${m}</b><b class="hl">${h}</b><em>${sub}</em><span class="ph">${SP(k, 90, '', 0)}</span><i class="fx">${fx}</i></div>`)}</div>
  ${C('foot', 'Rosa', '“Celadon’s scared. Saffron thinks we’re charming.”', [['Scrapbook', 'scrap'], ['Give an interview', 'press']])}${C('tabs', s)}${C('keys', [['←→', 'paper'], ['Enter', 'read'], ['S', 'scrapbook']])}</div>`);

/* the Scrapbook */
page('scrap', { g: 'The Day', t: 'Scrapbook', kind: 'scrap18', from: 18 });
const SCR = [['Day 7', 'NEW GANG IN VIRIDIAN?', 'Police shrug'], ['Day 9', 'PAWN SHOP PAYS UP', 'Owner “just being friendly”'], ['Day 12', 'MART TOLL BOOTH SEIZED', 'Rocket furious'], ['Day 15', 'LOOKER ARRIVES IN KANTO', 'International Police'], ['Day 17', 'GROWLITHE SNATCHED', 'Day Care in tears'], ['Day 18', 'NIGHT RAID ON CELADON', 'The polite thieves']];
comp(18, 'k:scrap18', s => `<div class="scr nv k-scrap18">${C('bg', 'hq')}${C('top', s, 'Scrapbook', '18 days of Team Nova')}
  <section class="cork18" ${mm('panel')}><svg class="str18" viewBox="0 0 928 334" data-nocheck><polyline points="150,60 460,70 770,60 770,220 460,230 150,220"/></svg>${map(SCR, ([d, h, sub], i) => `<div class="cl18" style="--r:${[-2, 1.5, -1, 2, -1.5, 1][i]}deg;--d:${i * 110}ms"><i class="tack"></i><small>${d}</small><b>${h}</b><em>${sub}</em></div>`)}</section>
  ${C('foot', 'Nate', '“Six headlines. Kanto’s starting to remember the name.”', [['Back', 'papers']])}${C('tabs', s)}${C('keys', [['←→↑↓', 'clipping'], ['Esc', 'back']])}</div>`);

/* a press interview */
page('press', { g: 'Events', t: 'Press interview', kind: 'scene', mode: 'talk', bg: 'street', from: 18, left: { s: 't-natebig', n: 'Nate', r: 'The Boss' }, right: { s: 't-clerk', n: 'Reporter', r: 'Kanto TV' }, speaker: 'Reporter', line: 'Mr. Nate! Some say the crimson armbands are yours. Any comment for Kanto?', choices: [['1', '“We’re businessmen. Kanto is safer with us.” · Regard +3', 'papers'], ['2', '“Kanto should be afraid.” · Dread +5', 'papers'], ['3', 'Walk past the camera', 'hq']] });
