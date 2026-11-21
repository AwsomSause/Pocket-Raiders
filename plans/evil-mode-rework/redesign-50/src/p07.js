/* Pass 7 · The Heist. A job is now a heist in five beats: pick it on the Job board, pick the crew, read the Card, give the order,
   watch it play out live, then walk through the report one step at a time. Orders left ride in the top bar on every page.
   New pages: Job board, The job · live. */
page('jobs', { g: 'Jobs', t: 'Job board', kind: 'jobboard', from: 7 });
page('live', { g: 'Jobs', t: 'The job · live', kind: 'live', from: 7 });
PR.pages.order.up = Object.assign(PR.pages.order.up || {}, { 7: { choices: [['Enter', 'Go', 'live']] } });
PR.pages.morning.up = Object.assign(PR.pages.morning.up || {}, { 7: {} });
comp(7, 'top', (s, ttl, sub) => before('top', 7)(s, ttl, sub).replace(`<u>Day <b>${RUN.day}</b></u>`, `<u class="dy7">Day <b>${RUN.day}</b><span title="orders used">${rep(3, i => `<i class="${i < 1 ? 'on' : ''}"></i>`)}</span></u>`));
const JOBS = [['Snatch a Growlithe', 'Celadon Day Care', 'tw-flowershop', 52, 'Growlithe Lv 21', '+3', ['c-rook'], 'Stealth'], ['Extort the Bike Shop', 'Cerulean', 'tw-bank', 64, '₽300–550, then ₽120 a week', '+6', ['c-rosa', 'c-gruntb'], 'Nerve'], ['Scout Silph Co.', 'Saffron', 'tw-tower', 85, 'Intel ×2 · Rocket’s plans', '+1', ['c-mina'], 'Wits']];
comp(7, 'k:jobboard', s => `<div class="scr nv k-jobs">${C('bg', 'night')}${C('top', s, 'Job board', '3 orders today')}
  ${map(JOBS, ([n, w, b, o, pay, h, who, stat], i) => `<button class="hc${i === 0 ? ' on' : ''}" style="left:${24 + i * 310}px;--d:${i * 120}ms;--pc:${pc(who[0])}" ${go(i === 0 ? 'crewpick' : '')}><span class="hc-h"><b>${n}</b><em>${w} · ${stat} job</em></span>
    <span class="hc-art">${spr(b, b === 'tw-tower' ? .62 : .7, '', '', i === 0 ? 'spr-' + b : '')}<span class="hc-o" style="--p:${o}"><b>${o}%</b></span></span>
    <span class="hc-f"><span><em>Pay</em><b>${pay}</b></span><span><em>Heat</em><b>${h}</b></span><span class="hc-who">${map(who, k => face(k, 34))}</span></span></button>`)}
  ${C('foot', 'Mina', '“The Day Care has one night guard. He naps at two.”', [['Pick the crew', 'crewpick']])}${C('tabs', s)}${C('keys', [['←→', 'job'], ['Enter', 'take it'], ['Esc', 'back']])}</div>`);
comp(7, 'k:live', s => { const B = [['Case it', 1], ['Slip in', 1], ['Grab', 0], ['Get out', 0]];
  return `<div class="scr nv k-live">${C('bg', 'night')}${C('top', s, 'The job · live', 'Snatch a Growlithe')}
  <section class="lv-stage" ${mm('panel')}><div class="lv-sky" data-nocheck></div>${spr('tw-flowershop', 1.1, 'lv-bld', '', 'spr-tw-flowershop')}<div class="lv-path" data-nocheck></div>
    ${map(B, ([n, d], i) => `<span class="lv-cp${d ? ' done' : ''}${i === 2 ? ' now' : ''}" style="left:${70 + i * 150}px"><i></i><b>${n}</b></span>`)}
    <span class="lv-rook">${SP('c-rook', 74)}</span><span class="lv-dog">${SP('p-growlithe', 46)}</span><span class="lv-alert" data-nocheck>!</span></section>
  ${C('pn', 'lv-ev', 'Something happens', `<p class="lv-q">A staff member looks up from the desk. Rook freezes behind the shelves.</p>${map([['1', 'Stay still', 'Stealth 5 vs 3 · 70%'], ['2', 'Throw a Smoke Ball', 'Clean escape · lose the grab'], ['3', 'Grab it and run', 'Heat +4 · 45%']], ([k, l, d], i) => `<button class="ch${i === 0 ? ' on' : ''}" ${go(i === 0 ? 'done' : 'botched')} ${st(i, 90)}><kbd>${k}</kbd><span class="row-t"><b>${l}</b><em>${d}</em></span></button>`)}`, 'det')}
  <div class="lv-odds">${C('bar', 'Odds now', 52, 100, 0)}</div>${C('keys', [['1-3', 'react'], ['Enter', 'choose']])}</div>`; });
/* the job report walks through steps */
const RAIL = ['The take', 'Heat', 'Crew', 'Loot', 'Next'];
comp(7, 'k:result', (s, P) => { const h = before('k:result', 7)(s, P); return /Job|Out of|Event reward|Tally/.test(s.t) ? h.replace('<div class="r-l">', `<ol class="rail7" ${mm('rail')}>${map(RAIL, (r, i) => `<li class="${i === 0 ? 'on' : ''}"><i>${i + 1}</i>${r}</li>`)}</ol><div class="r-l r7">`) : h; });
comp(7, 'k:scene', (s, P) => { const h = before('k:scene', 7)(s, P); return s.mode === 'cut' ? h.replace('<div class="act l"', '<div class="speed7" data-nocheck></div><div class="stamp7" data-nocheck>ORDER</div><div class="act l"') : h; });
