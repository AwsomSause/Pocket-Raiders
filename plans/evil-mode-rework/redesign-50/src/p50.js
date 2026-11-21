/* Pass 50 · Final Cut. The last synthesis pulls 46 to 49 into one finished look and trims what fights for attention:
   the foil sweep plays only on Empire and title pages, the self-tapping key only teaches on calm pages, and lanterns
   stay off pages where they cover panels. Three pages are rebuilt or added to close the whole redesign: the Title
   (Saffron at dusk with the crew on the roof, a Continue card that previews your save), How pages connect (a lift
   directory: every group, how many pages, and the one door that reaches it), and the Style sheet (the finished kit). */

/* Title: Saffron at dusk */
PR.pages.title.up = Object.assign(PR.pages.title.up || {}, { 50: { kind: 'ti50' } });
const PT50 = ['m-229', 'm-430', 'm-461', 'm-169', 'm-197', 'm-53'];
comp(50, 'k:ti50', s => `<div class="scr nv k-ti50">${C('bg', 'night')}<i class="sk50" data-nocheck></i>
  <div class="city48" data-nocheck>${rep(16, i => `<i style="--h:${[60, 110, 80, 140, 56, 100, 74, 130, 90, 150, 64, 120, 84, 104, 70, 96][i]}px"></i>`)}</div><i class="rf50" data-nocheck></i>
  <div class="lg50" ${mm('ttl')}><span class="cr50" style="--g:71%">N<i class="kw50">${SP('g-relic-crown', 22, '', 0)}</i></span><span class="tx"><small>Pocket Raiders</small><b>DOMINION</b><em>${esc(s.tag)}</em></span></div>
  <nav class="mn50"><button class="cn50 on" ${go('hq')}><span class="fc">${face('t-natebig', 58)}</span><span class="tx"><b>Continue</b><em>Team Nova · Day 18 · ₽4,310</em><span class="pt">${map(PT50, k => SP(k, 20, '', 0))}</span></span><i class="gl"><b>71%</b>Goal</i></button>
    ${map(s.items.slice(1), ([l, d, g], i) => `<button class="wm50" ${go(g)} ${st(i + 1, 80)}><b>${esc(l)}</b>${d ? `<em>${esc(d)}</em>` : ''}</button>`)}</nav>
  <div class="cw50" data-nocheck>${map([['p-persian', 70], ['c-mina', 108], ['t-natebig', 200], ['c-rosa', 108], ['mb-229', 92]], ([k, h], i) => `<span style="--d:${i * 140 + 500}ms">${SP(k, h, '', 0)}</span>`)}</div>
  ${C('keys', [['↑↓', 'move'], ['Enter', 'choose']])}</div>`);

/* How pages connect: a lift directory */
PR.pages.board.up = Object.assign(PR.pages.board.up || {}, { 50: { kind: 'bd50' } });
const DR50 = [['HQ', '1', 'The lift, from any page', '#e0294a'], ['The Day', '2', 'Region map, calendar, papers', '#d9861c'], ['Crew', '3', 'Roster, cards, promotions', '#16938a'], ['Pokémon', '4', 'Party, Reserve, care', '#2f9e44'], ['Jobs', '5', 'Job board, the Card, plans', '#8e2bd1'], ['Empire', '6', 'Ledger, the World, takeover', '#c8971c'], ['Opposition', 'Line', 'The war line, top of screen', '#2860c9'], ['Trainers', 'Job', 'From a job: gyms and rivals', '#d4421c'],
  ['Gimmicks', 'Fight', 'In battle: Mega, Z, Tera', '#e0408a'], ['Events', 'Night', 'The night, or the calendar', '#d9861c'], ['The Chair', 'Visit', 'When someone sits down', '#8a1030'], ['Start', 'Title', 'Title, Founding, next run', '#e0294a'], ['Menu', 'Start', 'Start menu and Rotom Phone', '#6a5a80'], ['Rotom', 'T', 'Ask Rotom, plans, diary', '#e07a10'], ['Guide', 'T', 'Lessons, X-ray, sheets', '#7a5cff'], ['Settings', 'Start', 'Options, then every setting', '#5c6b86']];
const NG50 = g => Object.keys(PR.pages).filter(id => live(id, PR.P) && PR.pages[id].g === g).length;
comp(50, 'k:bd50', s => { const tot = Object.keys(PR.pages).filter(id => live(id, PR.P)).length; return `<div class="scr nv k-bd50">${C('bg', 'hq')}${C('top', s, 'How pages connect', `${tot} pages`)}
  ${C('pn', 'dr50', 'Every page is one or two steps from the HQ', `<div class="dg50">${map(DR50, ([g, k, r, c], i) => `<div class="fl50" style="--c:${c};--d:${i * 40}ms"><kbd>${k}</kbd><b>${g}</b><i>${NG50(g)} pages</i><em>${r}</em></div>`)}</div>`, 'panel')}
  ${C('keys', [['1–6', 'lift'], ['Start', 'menu'], ['T', 'Rotom'], ['Esc', 'back']])}</div>`; });

/* Style sheet: the finished kit */
page('style', { g: 'Guide', t: 'Style sheet', kind: 'ss50', from: 50 });
const SW50 = [['HQ', '#e0294a'], ['The Day', '#d9861c'], ['Jobs', '#8e2bd1'], ['Crew', '#16938a'], ['Pokémon', '#2f9e44'], ['Opposition', '#2860c9'], ['Trainers', '#d4421c'], ['Gimmicks', '#e0408a'], ['Empire', '#c8971c'], ['The Chair', '#8a1030'], ['Rotom', '#e07a10'], ['Settings', '#5c6b86']];
const RU50 = [['One thing pulses at a time', 'the most urgent'], ['Text waits for a key', 'then rewards appear'], ['Every colour has a shape', 'for colour assist'], ['Calm mode stops all motion', 'one switch'], ['Two steps from the HQ', 'no page is deeper'], ['Nothing is cut off', 'checked on every page']];
comp(50, 'k:ss50', s => `<div class="scr nv k-ss50">${C('bg', 'hq')}${C('top', s, 'Style sheet', 'The whole kit on one page')}
  ${C('pn', 'sc50', 'Group colours', `<div class="sg50">${map(SW50, ([g, c], i) => `<span style="--c:${c};--d:${i * 40}ms"><i></i>${g}</span>`)}</div>`, 'panel')}
  ${C('pn', 'sp50', 'Pieces', `<div class="ty50"><b>DOMINION</b><em>Display · titles and names</em><p>Body text is 15px and never smaller than 11px.</p></div>
    <div class="tb50"><b class="who">Rook</b>“The Lookout can see all of Viridian.”<i>▼</i></div>
    <div class="kc50"><span><i class="pad20 p-A">A</i><kbd>Enter</kbd>go on</span><span><i class="pad20 p-B">B</i><kbd>Esc</kbd>back</span><span class="ch">SIEGE IN 3 DAYS</span></div>`, 'det')}
  ${C('pn', 'rl50', 'Rules', map(RU50, ([a, b], i) => `<div class="ru50" ${st(i, 60)}><i>${i + 1}</i><b>${a}</b><em>${b}</em></div>`), 'det')}
  ${C('foot', 'Rotom', '“Bzzt! Fifty passes, one look. This is the whole kit.”', [['Back', 'board'], ['Motion sheet', 'motion']])}${C('keys', [['←→', 'panel'], ['Esc', 'back']])}</div>`);
