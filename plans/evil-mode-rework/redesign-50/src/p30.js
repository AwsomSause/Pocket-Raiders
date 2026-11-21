/* Pass 30 · Second Cut. The second synthesis pulls 26 to 29 together and clears space: the strip under the top bar now
   carries news only where news matters and the Nova against Rocket war line everywhere else, every page arrives with a
   Black and White style place sign that slides in and away, and the speaker's name moves onto a tab on top of the text
   box so the words get the whole box. New pages: Last night (a quick recap each morning), the Adventure log, and the
   Hall of Infamy. */
const NEWSG = ['The Day', 'Jobs', 'Opposition', 'Events', 'Trainers', 'Gimmicks'];
comp(30, 'top', (s, ttl, sub) => { let h = before('top', 30)(s, ttl, sub); const pl = (PLACE[s.g] || [])[1];
  if (!NEWSG.includes(s.g)) h = h.replace(/<div class="tick18"[^]*?<\/div>/, `<div class="war30" ${go('war')} data-nocheck><b>NOVA ${WAR}</b><span><i style="width:${WAR}%"></i><em style="left:${WAR}%"></em></span><b class="r">${100 - WAR} ROCKET</b></div>`);
  return h + (pl ? `<div class="sign30" data-nocheck><i></i><b>${esc(pl)}</b></div>` : ''); });
comp(30, 'foot', (who, line, ctas) => before('foot', 30)(who, line, ctas).replace('class="foot', `class="foot${who ? ' nm30' : ''}`));

/* Last night: a quick recap each morning */
page('recap', { g: 'The Day', t: 'Last night', kind: 'rc30', from: 30 });
const RECAP = [['Job', 'Celadon Day Care', 'Rook snatched a Growlithe', '+₽1,200', 'c-rook'], ['War', 'Celadon held', 'Archer’s grunts ran', 'Nova 42', 't-grunt'], ['Crew', 'Rosa and Rook', 'Bond grew to 4', '♥', 'c-rosa'], ['Police', 'Looker in Saffron', 'Heat 22%, patrols east', '+3', 't-looker']];
comp(30, 'k:rc30', s => `<div class="scr nv k-rc30">${C('bg', 'street')}${C('top', s, 'Last night', 'Day 17 → Day 18')}
  <section class="rg30" ${mm('panel')}>${map(RECAP, ([k, a, b, v, sp], i) => `<div class="rcd30" style="--d:${i * 220}ms"><small>${k}</small><span class="sp">${SP(sp, 96, '', 0)}</span><b>${a}</b><em>${b}</em><i>${v}</i></div>`)}</section>
  ${C('foot', 'Rotom', '“Bzzt! Previously, on Team Nova… Ready for Day 18?”', [['Skip', 'morning'], ['Start Day 18', 'morning']])}${C('tabs', s)}${C('keys', [['Enter', 'start the day'], ['Esc', 'skip']])}</div>`);

/* the Adventure log */
page('journal', { g: 'Menu', t: 'Adventure log', kind: 'jl30', from: 30 });
const JL = [['Day 18', 'Held Celadon against Archer. Rosa says Rocket is cracking.', 1], ['Day 17', 'Snatched a Growlithe from the Day Care. Rook never made a sound.', 1], ['Day 16', 'Red beat Koga’s gym. He is coming our way.', 0], ['Day 15', 'Opened the Laundromat. Clean money, finally.', 1], ['Day 14', 'Gus pocketed a take. I let it slide. This time.', 0]];
comp(30, 'k:jl30', s => `<div class="scr nv k-jl30">${C('bg', 'hq')}${C('top', s, 'Adventure log', 'Written by the Boss')}
  <div class="bk30" ${mm('card')}><div class="pg l">${map(JL.slice(0, 3), ([d, t, g], i) => `<p class="en30" style="--d:${i * 200}ms"><b>${d}</b>${esc(t)}${g ? '<i>✦</i>' : ''}</p>`)}</div><div class="pg r">${map(JL.slice(3), ([d, t, g], i) => `<p class="en30" style="--d:${(i + 3) * 200}ms"><b>${d}</b>${esc(t)}${g ? '<i>✦</i>' : ''}</p>`)}<span class="sig30">— Nate</span></div></div>
  ${C('foot', 'Rosa', '“You write in that every night? Boss, you’re soft.”', [['Back', 'start'], ['Older pages', '']])}${C('keys', [['←→', 'page'], ['Esc', 'back']])}</div>`);

/* the Hall of Infamy */
page('infamy', { g: 'Empire', t: 'Hall of Infamy', kind: 'hi30', from: 30 });
comp(30, 'k:hi30', s => `<div class="scr nv k-hi30">${C('bg', 'night')}<i class="spot30" data-nocheck></i>${C('top', s, 'Hall of Infamy', 'Kanto taken · Day 64')}
  <section class="hall30" ${mm('panel')}>${map([['t-natebig', 'Nate', 'The Boss'], ['c-rosa', 'Rosa', 'Holder of Kanto'], ['mb-229', 'Houndoom', 'Ace · Lv 52'], ['c-rook', 'Rook', 'Never caught'], ['c-mina', 'Mina', 'Brains']], ([k, n, r], i) => `<div class="ped30${i === 0 ? ' top' : ''}" style="--d:${i * 160}ms"><span class="sp">${SP(k, i === 0 ? 150 : 110, '', 0)}</span><i class="base"></i><b>${n}</b><em>${r}</em></div>`)}</section>
  ${C('foot', 'Rotom', '“Bzzt! Saved to the Hall. Kanto will remember. Kanto will not forgive.”', [['Credits', 'ending'], ['Sail on', 'world']])}${C('tabs', s)}${C('keys', [['Enter', 'continue']])}</div>`);
