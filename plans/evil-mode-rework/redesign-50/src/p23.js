/* Pass 23 · Breathing Room. Less chrome, more game: the top bar's three chips fold into one status capsule, the bottom
   line becomes a real Pokémon text box that types itself out and waits on a bouncing ▼, and the buttons sit in a
   choice box with a ▶ cursor. New pages: At a glance (what the capsule means), Focus view (any page with the HUD
   hidden), and Settings › Screen (pick how much HUD you want). */
comp(23, 'top', (s, ttl, sub) => before('top', 23)(s, ttl, sub).replace(/<u class="ic12"/, `<span class="cap23" ${go('glance')}><u class="ic12"`).replace(/(<u class="dy7[^"]*"[^]*?<\/u>)/, '$1</span>'));
comp(23, 'foot', (who, line, ctas) => { const h = before('foot', 23)(who, line, ctas).replace('class="foot', 'class="foot f23').replace(/<\/p>/, '<i class="nx23" data-nocheck>▼</i></p>'); return ctas && ctas.length ? h.replace(/<button/, '<div class="ch23">' + '<button').replace(/<\/section>$/, '</div></section>') : h; });
comp(23, 'keys', k => before('keys', 23)(k).replace(/<span class="ls21" ([^>]*)><kbd>T<\/kbd>Lesson (\d+)<\/span>/, '<span class="ls21 ls23" $1><kbd>T</kbd>Lesson <b>$2</b></span>'));

/* At a glance */
page('glance', { g: 'HQ', t: 'At a glance', kind: 'gl23', from: 23 });
const GL = [['Funds', 'i-coin_case', RUN.funds, 'Money stays in Kanto when you sail', 62], ['Heat', 'bd-fire', RUN.heat + '%', 'Police walk the districts you hit', RUN.heat], ['Day', 'g-town-map', 'Day ' + RUN.day + ' · ' + RUN.when, '1 of 3 orders used today', 33], ['Goal', 'g-relic-crown', RUN.goal + ' ' + RUN.goalPct + '%', 'Take Saffron to finish Kanto', RUN.goalPct]];
const NEED = [['Rocket raid in 3 nights', 'Get the Bolt Hole ready', 'raid', 'bad'], ['Rosa wants a word', 'Missed call · 2 min ago', 'call', ''], ['2 jobs are ready', 'Celadon and Cerulean', 'jobs', ''], ['Johto is waiting', 'Sail when Kanto is yours', 'world', 'gold']];
comp(23, 'k:gl23', s => `<div class="scr nv k-gl23">${C('bg', 'hq')}${C('top', s, 'At a glance', 'What the capsule means')}
  <section class="gl23" ${mm('panel')}>${map(GL, ([n, ic, v, d, p], i) => `<div class="gt23" style="--d:${i * 90}ms;--p:${p}%"><span class="gi">${SP(ic, 34, '', 0)}</span><small>${n}</small><b>${v}</b><em>${d}</em><i class="bar"><i></i></i></div>`)}</section>
  ${C('pn', 'need23', 'Needs you', map(NEED, ([a, b, g, c], i) => `<button class="nd23 ${c}" ${go(g)} ${st(i, 80)}><b>${a}</b><em>${b}</em></button>`), 'det')}
  ${C('foot', 'Rotom', '“Bzzt! Tap the capsule on any page to come back here.”', [['Back', 'hq'], ['Get ready', 'raid']])}${C('tabs', s)}${C('keys', [['↑↓', 'pick'], ['Enter', 'go'], ['Esc', 'back']])}</div>`);

/* Focus view: the HUD folds away */
page('focus', { g: 'The Day', t: 'Focus view', kind: 'fv23', from: 23 });
comp(23, 'k:fv23', s => `<div class="scr nv k-fv23"><div class="fv23" data-nocheck>${C('k:map', PR.pages.map)}</div><span class="fvh23" data-nocheck><kbd>V</kbd>Show the HUD</span><i class="fvs23" data-nocheck></i></div>`);

/* Settings › Screen */
page('hud', { g: 'Settings', t: 'Settings · Screen', kind: 'settings', from: 23, cat: 4, prev: 'hud', rows: [['Status', ['Capsule', 'Full chips', 'Hidden'], 0, 'Funds, Heat and Day in one pill'], ['News ticker', ['On', 'Quiet', 'Off'], 0, 'Quiet shows it only when news breaks'], ['Key hints', ['Full', 'Icons', 'Off'], 0, 'The strip along the bottom'], ['Text speed', ['Slow', 'Mid', 'Fast', 'Instant'], 2, 'How fast the text box types'], ['Focus view', ['V key', 'Off'], 0, 'Fold the HUD away on any page']] });
PREV.hud = () => `<b class="pv-t">The capsule</b><div class="pv-cap23"><span>₽4,310</span><span>22%</span><span>Day 18</span></div><b class="pv-t">The text box</b><div class="pv-tb23"><b>Rosa</b> “You want Celadon, Boss?”<i>▼</i></div>`;
comp(23, 'k:settings', (s, P) => { const h = before('k:settings', 23)(s, P); if (s.cat !== 4) return h; const on = s.prev === 'hud'; return (on ? h.replace('<button class="on" ', `<button class="" ${go('access')} `) : h).replace(`<button ${go('set')}><b>All settings`, `<button class="${on ? 'on' : ''}" ${go(on ? '' : 'hud')}><b>Screen</b></button><button ${go('set')}><b>All settings`); });
