/* Pass 19 · The Chair. The Boss's authority runs through the whole UI: every panel gets gold corner brackets like a
   framed decree, and every main button is a gold plate pressed with a crimson wax seal. The Chair itself becomes a
   first-person view across the Boss's desk. New pages: the Waiting room and the Favour ledger. */
PR.pages.chair.up = Object.assign(PR.pages.chair.up || {}, { 19: { kind: 'chair19' } });
const ANS = [['1', 'Give him the alley', 'Rocket Tension −10 · lose ₽300 a day', 'Regard', 'g-town-map', 'tally'], ['2', 'Smile and say no', 'Petrel holds a Grudge · Dread +4', 'Dread', 'g-dark-gem', 'tally'], ['3', 'Hand it off · 1 left', 'Dale answers · leans Regard', 'Staff', 'g-idcard', 'handoff']];
comp(19, 'k:chair19', s => `<div class="scr nv k-ch19">${C('bg', 'chair')}<div class="lamp19" data-nocheck></div>
  <div class="vis19" data-nocheck>${SP('t-petrel', 250, '', 0)}</div><div class="desk19" data-nocheck><span class="per19">${SP('p-persian', 96, '', 0)}</span><span class="led19">${SP('g-journal', 40, '', 0)}</span><span class="cig19"></span><b class="np19">TEAM NOVA · THE BOSS</b></div>
  <div class="plq19"><b>Petrel</b><em>Rocket Admin · came with a Grudge</em></div>
  <section class="ask19" ${mm('box')}><small>He asks</small><p>“The Boss sends his regards. And a question. Viridian’s back alley, or your teeth?”</p></section>
  <nav class="ans19">${map(ANS, ([k, l, d, lean, ic, g], i) => `<button class="evc-c a19${i === 1 ? ' on' : ''}" ${go(g)} style="--d:${400 + i * 120}ms">${SP(ic, 30, '', 0)}<span class="row-t"><b>${l}</b><em>${d}</em></span><span class="evc-r"><kbd>${k}</kbd><i class="ln19 ${lean.toLowerCase()}">${lean}</i></span></button>`)}</nav>
  <div class="dale19" data-nocheck>${SP('c-dale', 150, 'flip', 0)}</div>${C('keys', [['1-3', 'answer'], ['Enter', 'seal it'], ['Q', 'queue']])}</div>`);

/* the Waiting room */
page('queue', { g: 'The Chair', t: 'Waiting room', kind: 'queue19', from: 19 });
const VIS = [['t-petrel', 'Petrel', 'Rocket Admin', 'Wants: Viridian’s back alley', 'Grudge', 'chair'], ['t-rich', 'Mick', 'Pawn shop owner', 'Wants: his Growlithe back', 'Nervous', 'chair'], ['t-erika', 'Erika', 'Celadon Gym Leader', 'Wants: quiet near her Gym', 'Cold', 'chair']];
comp(19, 'k:queue19', s => `<div class="scr nv k-q19">${C('bg', 'chair')}${C('top', s, 'Waiting room', 'Day 9 · 3 visitors')}
  <div class="bench19" ${mm('panel')}>${map(VIS, ([k, n, r, w, mood, g], i) => `<button class="vq${i === 0 ? ' on' : ''}" ${go(g)} style="--pc:${pc(k)};--d:${i * 140}ms"><i class="num">${i + 1}</i><span class="vs">${SP(k, 170, '', 0)}</span><b>${n}</b><em>${r}</em><span class="want">${w}</span><i class="mood">${mood}</i></button>`)}</div>
  ${C('foot', 'Dale', '“Petrel first, Boss. He doesn’t like waiting.”', [['Favour ledger', 'favours'], ['Call him in', 'chair']])}${C('tabs', s)}${C('keys', [['←→', 'visitor'], ['Enter', 'call in'], ['F', 'favours']])}</div>`);

/* the Favour ledger */
page('favours', { g: 'The Chair', t: 'Favour ledger', kind: 'favour19', from: 19 });
const OWE = [['t-rich', 'Mick', 'You let him keep his Growlithe', 'Big', 1], ['t-erika', 'Erika', 'Paid ₽1,500 · looks away once', 'Small', 1], ['t-sci', 'Silph clerk', 'You kept his name out of the paper', 'Small', 1]];
const OWD = [['t-clerk', 'The Fence', 'Loan of ₽5,000 · due Friday', 'Big', 0], ['t-petrel', 'Petrel', 'Grudge: you said no at the Chair', 'Grudge', 0]];
const fav = ([k, n, d, sz, us], i) => `<div class="fv" ${st(i)}>${face(k, 38)}<span class="row-t"><b>${n}</b><em>${d}</em></span><i class="sz ${sz.toLowerCase()}">${sz}</i>${us ? `<button class="cta">Call it in</button>` : ''}</div>`;
comp(19, 'k:favour19', s => `<div class="scr nv k-fv19">${C('bg', 'chair')}${C('top', s, 'Favour ledger', 'Who owes whom')}
  ${C('pn', 'fo19', 'They owe you', map(OWE, fav), 'panel')}${C('pn', 'fd19', 'You owe them', map(OWD, fav), 'det')}
  ${C('foot', 'Dale', '“Mick’s favour is a big one. Save it for when Red comes.”', [['Back', 'queue']])}${C('tabs', s)}${C('keys', [['↑↓', 'favour'], ['Enter', 'call it in'], ['Esc', 'back']])}</div>`);
