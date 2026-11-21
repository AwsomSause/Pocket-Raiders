/* Pass 13 · Rotom Phone. The Boss Menu becomes a Rotom Phone you hold, with apps, and the phone peeks out of the key strip
   on every page with a count of what's waiting. Every speech line in the game becomes a chat bubble with a tail, and the
   buttons under it become reply chips. New pages: Messages and an incoming call. */
comp(13, 'keys', k => before('keys', 13)(k).replace('<i class="rb"></i>', `<i class="rb"></i><span class="ph13" ${go('menu')}><i class="ph-s">${SP('p-rotom', 24, 'ph-r', 0)}</i><kbd>P</kbd>Phone<i class="ph-b">3</i></span>`));
comp(13, 'foot', (who, line, ctas) => before('foot', 13)(who, line, ctas).replace('class="foot"', 'class="foot f13"').replace(/<button class="cta/g, '<button class="cta rc13'));

/* the Boss Menu is the phone */
const APPS = [['HQ', 'g-storage-key', 'hq', ''], ['Crew', 'g-idcard', 'roster', '2'], ['Pokémon', 'g-ball', 'reserve', ''], ['Map', 'g-town-map', 'map', ''], ['Messages', 'g-letter', 'msgs', '3'], ['Ledger', 'g-journal', 'ledger', ''], ['Rotom', 'g-xtransceiver', 'rotom', ''], ['Settings', 'g-machine-part', 'set', ''], ['Save', 'g-tape', 'save', '']];
const NOTE13 = [['c-rosa', 'Rosa', 'Celadon’s Game Corner man wants a word.', 'msgs', '2 min'], ['t-gio', 'Missed call', 'Unknown number · twice', 'call', '8 min'], ['p-rotom', 'Rotom', 'Bzzt! Rocket raid on your HQ in 3 nights.', 'rival', '1 h'], ['t-applicant', 'Applications', '3 hopefuls are waiting downstairs.', 'apps', '2 h']];
PR.pages.menu.up = Object.assign(PR.pages.menu.up || {}, { 13: { kind: 'phone13' } });
const phone = (body, cls = '') => `<div class="ph13x ${cls}" ${mm('dial')}><div class="eyes13" data-nocheck><i></i><i></i></div><div class="bar13"><b>Day ${RUN.day} · ${RUN.when}</b><span>${RUN.funds}</span></div>${body}</div>`;
comp(13, 'k:phone13', s => `<div class="scr nv k-ph13">${C('bg', 'street')}<div class="dim13" data-nocheck></div>
  <div class="boss13" data-nocheck>${SP('t-natebig', 300, '', 0)}</div>
  ${phone(`<p class="pt13" ${mm('ttl')}>Boss Menu</p><div class="apps13">${map(APPS, ([l, ic, g, b], i) => `<button class="ap13${i === 0 ? ' on' : ''}" ${go(g)} style="--d:${i * 40}ms"><span class="api">${SP(ic, 30, '', 0)}${b ? `<i class="ph-b">${b}</i>` : ''}</span><b>${l}</b></button>`)}</div>
    <p class="q13">“Kanto doesn’t need a hero. It needs a landlord.”</p>`)}
  ${C('pn', 'nt13', 'Notifications', map(NOTE13, ([k, n, t, g, w], i) => `<button class="nt" ${go(g)} ${st(i, 90)}>${face(k, 38)}<span><b>${n}</b><em>${t}</em></span><i>${w}</i></button>`), 'det')}
  ${C('keys', [['←→↑↓', 'app'], ['Enter', 'open'], ['P', 'put the phone away']])}</div>`);

/* Messages */
page('msgs', { g: 'Menu', t: 'Messages', kind: 'msgs13', from: 13 });
const THR = [['c-rosa', 'Rosa', 'The kind with ₽5,000 in it.', '2'], ['t-gio', 'Unknown number', 'Missed call', ''], ['c-mina', 'Mina', 'Background Checks, Boss. Please.', ''], ['t-clerk', 'The Fence', 'Loan’s due Friday. No rush.', '1']];
const CHAT = [['c-rosa', 'Boss. Celadon’s Game Corner manager wants a word.'], ['me', 'What kind of word?'], ['c-rosa', 'The kind with ₽5,000 in it.'], ['c-rosa', 'He wants protection from Rocket. Says they skim his tables.']];
comp(13, 'k:msgs13', s => `<div class="scr nv k-msg13">${C('bg', 'hq')}${C('top', s, 'Messages', 'Rotom Phone')}
  ${C('pn', 'th13', 'Chats', map(THR, ([k, n, t, b], i) => `<button class="row sm th${i === 0 ? ' on' : ''}" ${go(i === 1 ? 'call' : '')} ${st(i)}>${face(k, 38)}<span class="row-t"><b>${n}</b><em>${esc(t)}</em></span>${b ? `<i class="ph-b">${b}</i>` : ''}</button>`), 'rail')}
  ${C('pn', 'cv13', `${face('c-rosa', 30)} Rosa · Celadon`, `<div class="bub13">${map(CHAT, ([k, t], i) => `<p class="bb ${k === 'me' ? 'me' : 'them'}" style="--d:${200 + i * 260}ms">${esc(t)}</p>`)}<p class="bb them typ" style="--d:1300ms"><i></i><i></i><i></i></p></div>
    <div class="rep13">${map([['Set a meeting', 'card'], ['Tell him to wait', ''], ['Ask Mina to check him', 'people']], ([l, g], i) => `<button class="cta rc13${i === 0 ? ' on' : ''}" ${go(g)}>${l}</button>`)}</div>`, 'panel')}
  ${C('keys', [['↑↓', 'chat'], ['←→', 'reply'], ['Enter', 'send'], ['Esc', 'phone']])}</div>`);

/* An incoming call */
page('call', { g: 'Opposition', t: 'Incoming call', kind: 'call13', from: 13 });
comp(13, 'k:call13', s => `<div class="scr nv k-call13">${C('bg', 'blue')}<div class="ring13" data-nocheck><i></i><i></i><i></i></div>
  <div class="cl13" ${mm('ttl')}><small>Incoming call · Unknown number</small><b>GIOVANNI</b><em>Team Rocket · the Boss of Bosses</em></div>
  <div class="cp13" data-nocheck>${SP('t-gio', 250, '', 0)}</div><div class="vib13" data-nocheck>${SP('p-rotom', 70, '', 0)}</div>
  <div class="cb13"><button class="cta no13" ${go('hq')}>Decline</button><button class="cta on yes13" ${go('rival')}>Answer</button></div>
  <p class="ch13">Rotom: “Bzzt... he never calls twice. This is the third time.”</p>${C('keys', [['Enter', 'answer'], ['Esc', 'decline']])}</div>`);
