/* Pass 7 · Chapters: days become comic chapters; a Wanted poster for Heat; crew banter as a 3-panel strip */
page('chapter', { g: 'The Day', t: 'Chapter cover', kind: 'chapter', from: 7 });
page('wanted', { g: 'Opposition', t: 'Wanted poster', kind: 'wanted', from: 7 });
page('strip', { g: 'Rotom', t: 'Crew banter strip', kind: 'strip', from: 7 });
comp(7, 'k:chapter', (s, P) => `<div class="scr t2 t2-chapter">${C('bg', 'night')}<div class="t2-rays7"></div>
  <div class="t2-chn">CHAPTER 18</div><div class="t2-cht" ${mm('ttl')}>THE GROWLITHE JOB</div>
  <div class="t2-chart">${spr('c-rook', 3.2, 't2-c1', '', 'spr-c-rook')}${spr('p-growlithe', 3, 't2-c2', '', 'spr-p-growlithe')}${spr('t-redbig', 2.2, 't2-c3', '', 'spr-t-redbig')}</div>
  <div class="t2-cap t2-chcap">Can Rook snatch a Growlithe from under the Hero’s nose? Read on!</div>${C('keys', [['Enter', 'Begin the day']])}</div>`);
comp(7, 'k:wanted', (s, P) => `<div class="scr t2 t2-wantedp">${C('bg', 'street')}${C('top', s, 'Wanted poster')}
  <section class="t2-poster" ${mm('panel')}><div class="t2-wt">WANTED</div><div class="t2-wphoto">${spr('t-natebig', 1.7, '', '', 'spr-t-natebig')}</div><div class="t2-wn">“THE BOSS” OF TEAM NOVA</div><div class="t2-wr">REWARD ₽18,000</div><p class="t2-wsig">— Officer Jenny, Viridian Police</p></section>
  <section class="t2-pan t2-wside" ${mm('det')}>${C('cap', 'HEAT IS THE BOUNTY')}${C('bar', 'Heat', RUN.heat, 100, 0)}<div class="t2-fact"><span>At 40%</span><b>Police patrol your districts</b></div><div class="t2-fact"><span>At 70%</span><b>Siren · Looker comes to town</b></div><div class="t2-fact"><span>At 100%</span><b>Raid on the HQ</b></div>${balloon('Gus', 'Boss, your face is on every lamp post. Nice photo though.', 'sm')}<button class="t2-pow" ${go('morning')}>Lie low!</button></section>${C('keys')}</div>`);
comp(7, 'k:strip', (s, P) => { const B = [['c-gus', 'Gus', 'Boss says lie low.'], ['c-rook', 'Rook', 'So... no snatching?'], ['p-rotom', 'Rotom', 'Bzzt! Gus has snatched 3 sandwiches today.']];
  return `<div class="scr t2 t2-strip">${C('bg', 'hq')}${C('top', s, 'Crew banter')}<div class="t2-row3">${map(B, ([k, n, t], i) => `<section class="t2-pan t2-sp" ${st(i, 220)}>${balloon(n, t, '')}${spr(k, fit2(k, 150), 't2-sps', '', 'spr-' + k)}</section>`)}</div>
  ${C('cap', 'Banter comes from each crew member’s personality card · shown between pages, never in the way')}${C('keys', [['Enter', 'Next'], ['Esc', 'Skip']])}</div>`; });
