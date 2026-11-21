/* Pass 2 · Big & Bold. Every title is a crimson slash, words get big, sprites double, the battle gets big slanted commands.
   New pages: the Staff Office (three posts) and Pick the crew (who goes on the job). */
page('staff', { g: 'HQ', t: 'Staff Office', kind: 'grid', from: 2, head: 'Staff Office · Upper Floor · 3 posts', cells: [['c-mina', 'Auto-Checker', 'Wits · hires Grunts every morning · Gear 2', 'On'], ['c-rosa', 'Bookkeeper', 'Charm · launders ₽1,500 a night · Gear 2', 'On'], ['c-dale', 'Caretaker', 'Brawn · repairs 10 a night · Gear 1', 'On']], sel: 0, go: ['auto', 'ledger', 'hq'] });
page('crewpick', { g: 'Jobs', t: 'Pick the crew', kind: 'grid', from: 2, head: 'Snatch a Growlithe · pick up to 2 · Stealth job', cells: [['c-rook', 'Rook', 'Stealth 5 · +25%', '✓'], ['c-gruntb', 'Bram', 'Stealth 4 · +18%'], ['c-rosa', 'Rosa', 'Stealth 6 · busy in Celadon', 'Busy'], ['c-gus', 'Gus', 'Stealth 3 · +10%'], ['c-mina', 'Mina', 'Stealth 5 · +20%'], ['c-dale', 'Dale', 'Stealth 2 · guarding the HQ', 'Busy']], sel: 0, go: ['card'] });
PR.pages.floor.up = { 2: { items: PR.pages.floor.items.map(it => it.l === 'Staff Office' ? Object.assign({}, it, { go: 'staff' }) : it), detail: Object.assign({}, PR.pages.floor.detail, { cta: ['Open the office', 'staff'] }) } };
PR.pages.map.up = { 2: {} };

comp(2, 'top', (s, ttl, sub) => `<header class="nb2" ${mm('top')}><span class="nb-sig" ${mm('emb')}>N</span><b class="nb2-t" ${mm('ttl')}><i>${esc(ttl || s.t)}</i></b>${sub ? `<em class="nb-sub">${esc(sub)}</em>` : ''}<span class="nb-sp"></span>
  <u ${mm('funds')}>Funds <b>${RUN.funds}</b></u><u class="heat" ${mm('heat')}>Heat <b>${RUN.heat}%</b></u><u>Day <b>${RUN.day}</b></u></header>`);
comp(2, 'pn', (cls, head, body, m) => `<section class="pn ${cls}" ${m ? mm(m) : ''}>${head ? `<h3><i>${head}</i></h3>` : ''}${body}</section>`);
/* grid cells can now be links */
comp(2, 'k:grid', (s, P) => before('k:grid', 2)(s, P).replace(/<button class="cell([^"]*)" style="--i:(\d+);/g, (m, c, i) => `<button class="cell${c}" ${go((s.go || [])[+i] || (s.go || [])[0] || '')} style="--i:${i};`));
PR.pages.card.up = { 2: {} };
comp(2, 'k:card', (s, P) => before('k:card', 2)(s, P).replace(`${go('map')}>Back`, `${go('crewpick')}>Change crew`));

/* battle: big slanted command words stacked under the right thumb */
comp(2, 'k:battle', s => `<div class="scr nv k-bat2">${C('bg', 'arena')}<div class="court" data-nocheck></div>
  <div class="bpl foe" ${mm('foeplate')}><b>${s.foe[1]}</b><em>Lv ${s.foe[2]}</em><i class="hp"><u style="width:${s.foe[3]}%"></u></i><span>${s.foe[3]}%</span></div>
  <div class="b-raid"><b>HIDEOUT RAID</b>Hold for 4 more turns</div>
  ${SP(s.foe[0], 190, 'b-foe')}${SP(s.me[0], 220, 'b-me')}
  <section class="b-ask" ${mm('box')}><p>What will <b>${s.me[1]}</b> do, Boss?</p><em>Rosa: “Hold the door and he runs out of time.”</em></section>
  <div class="bpl me" ${mm('meplate')}><b>${s.me[1]}</b><em>Lv ${s.me[2]}</em><i class="hp"><u style="width:${s.me[3]}%"></u></i><span>${Math.round(s.me[3] * 1.4)} / 140</span></div>
  <nav class="b-words">${map([['FIGHT', ''], ['ORDER', '1 ready'], ['CRATE', '3 items'], ['CREW', '4 left'], ['RETREAT', '']], ([l, d], i) => `<button class="bw${i === 0 ? ' on' : ''}" ${st(i, 60)}><kbd>${i + 1}</kbd><b>${l}</b>${d ? `<em>${d}</em>` : ''}</button>`)}</nav></div>`);
comp(2, 'k:result', (s, P) => before('k:result', 2)(s, P).replace('class="r-big"', `class="r-big${s.big.length > 8 ? ' long' : ''}"`));
