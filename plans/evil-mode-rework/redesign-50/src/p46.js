/* Pass 46 · Rotom Live. Rotom stops being a tutorial and becomes your advisor on every page: a small Rotom tab rides
   the top edge of every text box with one useful thought for that page (it opens Ask Rotom), and the lesson chip in
   the dock becomes Rotom’s chip, with a typing bubble when Rotom has something to say. New pages: Ask Rotom (a
   chat), Rotom’s plan (three plans for tonight, one recommended, with the reason), and Rotom’s diary. */
const RT46 = { HQ: 'Barracks are full.', 'The Day': 'Cerulean is clear tonight.', Jobs: 'Wait for dark: +8.', Crew: 'Gus took ₽200. Watch him.', 'Pokémon': 'Persian is at 12%.', Opposition: 'Red is 2 days out.', Trainers: 'Fire beats her Grass team.', Gimmicks: 'Save the Mega for phase two.', Events: 'Crowds mean cover.', Empire: 'Fuchsia is undefended.', 'The Chair': 'He lies about money.' };
comp(46, 'foot', (who, line, ctas) => { const t = RT46[(PR.s || {}).g], h = before('foot', 46)(who, line, ctas); return t && who !== 'Rotom' ? h.replace('</p>', `<i class="rt46" ${go('ask')}><span class="ri" data-nocheck>${SP('p-rotom', 18, '', 0)}</span><b>${t}</b></i></p>`) : h; });
comp(46, 'keys', k => before('keys', 46)(k).replace(/<span class="(ls21[^"]*)" data-go="lessons"><kbd>T<\/kbd>Lesson <b>\d+<\/b><\/span>/, (m, c) => `<span class="${c} rc46" ${go('ask')}><kbd>T</kbd><span class="ri" data-nocheck>${SP('p-rotom', 18, '', 0)}</span>Rotom</span>`));
NAMEK.Rotom = NAMEK.Rotom || 'p-rotom';

/* Ask Rotom */
page('ask', { g: 'Rotom', t: 'Ask Rotom', kind: 'ak46', from: 46 });
const CH46 = [['me', 'Who should run tonight’s job?'], ['ro', 'Bzzt! <b>Rook</b>. His Stealth is 6 and the Day Care has no guard at night. Gus would be faster, but he took ₽200 from the Vault on Tuesday.'], ['me', 'And if Red shows up?'], ['ro', 'He is in Pewter, two days out. If he moves, I will ping you before the job starts. Promise. Zzt.']];
comp(46, 'k:ak46', s => `<div class="scr nv k-ak46">${C('bg', 'hq')}${C('top', s, 'Ask Rotom', 'It knows the whole run')}
  <section class="ch46" ${mm('panel')}>${map(CH46, ([w, t], i) => `<div class="m46 ${w}" style="--d:${i * 350}ms">${w === 'ro' ? `<span class="av">${SP('p-rotom', 34, '', 0)}</span>` : ''}<p>${t}</p></div>`)}<div class="m46 ro ty" style="--d:1500ms"><span class="av">${SP('p-rotom', 34, '', 0)}</span><p><i class="ty46"><u></u><u></u><u></u></i></p></div></section>
  ${C('pn', 'sq46', 'Ask about', map(['Tonight’s best job', 'Who is unhappy', 'Where Red is', 'How to beat Erika', 'What to buy'], (q, i) => `<button class="o29${i === 0 ? ' on' : ''}" ${st(i, 70)}><b>${q}</b></button>`), 'det')}
  ${C('keys', [['↑↓', 'question'], ['Enter', 'ask'], ['Esc', 'close']])}</div>`);

/* Rotom's plan */
page('rplan', { g: 'Rotom', t: 'Rotom’s plan', kind: 'rp46', from: 46 });
const PL46 = [['A', 'Quiet night', 'Rook snatches the Growlithe · everyone else rests', '68%', '+₽1,200', 0], ['B', 'Big night', 'Growlithe and the Dept. Store, two squads', '41%', '+₽3,900', 1], ['C', 'Lie low', 'No jobs · Heat drops to 14%', '100%', '₽0', 0]];
comp(46, 'k:rp46', s => `<div class="scr nv k-rp46">${C('bg', 'night')}${C('top', s, 'Rotom’s plan', 'Three ways to spend tonight')}
  <section class="pl46" ${mm('panel')}>${map(PL46, ([l, n, d, o, v, rec], i) => `<button class="pc46${i === 0 ? ' on rec' : ''}" style="--d:${i * 130}ms"><i class="lt">${l}</i><b>${n}</b><em>${d}</em><span><u>${o}</u><small>chance</small></span><span><u>${v}</u><small>money</small></span>${i === 0 ? `<i class="st46">${SP('p-rotom', 22, '', 0)}Rotom picks this</i>` : ''}</button>`)}</section>
  <div class="why46" ${mm('box')}><b>Why A?</b> Red is two days out and Heat is 22%. One clean job keeps the money coming without giving the police a reason. B pays more, but two squads at once is how crews get caught.</div>
  ${C('keys', [['←→', 'plan'], ['Enter', 'use this plan'], ['Esc', 'I’ll decide']])}</div>`);

/* Rotom's diary */
page('rdiary', { g: 'Rotom', t: 'Rotom’s diary', kind: 'rd46', from: 46 });
const DY46 = [['Morning', 'The Boss drank three coffees. I counted. Bzzt.'], ['Noon', 'Gus took ₽200 from the Vault. I did not tell. Yet.'], ['Evening', 'Fireworks! I tried to look like one. Nobody noticed.'], ['Night', 'Red is in Pewter. I am watching him for the Boss. Watching is my favourite.']];
comp(46, 'k:rd46', s => `<div class="scr nv k-rd46">${C('bg', 'night')}${C('top', s, 'Rotom’s diary', 'Day 18')}
  <section class="dy46" ${mm('panel')}><i class="spine" data-nocheck></i><div class="pg">${map(DY46, ([t, l], i) => `<p style="--d:${i * 220}ms"><b>${t}</b>${l}</p>`)}</div><div class="pg r"><span class="dd46" data-nocheck>${SP('p-rotom', 90, '', 0)}<i></i></span><p class="sig">— Rotom ⚡</p></div></section>
  ${C('foot', 'Rotom', '“Bzzt! Do not read my diary, Boss. …You are reading it.”', [['Close', 'ask'], ['Day 17', 'rdiary']])}${C('keys', [['←→', 'day'], ['Esc', 'close']])}</div>`);
