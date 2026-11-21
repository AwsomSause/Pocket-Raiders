/* Pass 32 · Dirty Money. Money gets a colour: every page's Funds now shows clean money and dirty money as a two-tone
   bar under the number, a little +₽ floats up from the capsule when you arrive with news of cash, and the Ledger
   button's coin spins. New pages: the Black market (spend dirty money), the Laundromat (wash it clean, with a real
   spinning drum), and Payday (pay the crew, and see what each one thinks of it). */
const CLEAN = 4310, DIRTY = 9800, CP = Math.round(CLEAN / (CLEAN + DIRTY) * 100);
comp(32, 'top', (s, ttl, sub) => before('top', 32)(s, ttl, sub).replace(/(<u class="ic12" [^>]*>[^]*?)(<\/u>)/, `$1<i class="cd32" style="--c:${CP}%" data-nocheck></i>$2`).replace('<span class="cap23"', `<span class="cap23" data-plus="+₽1,200"`));

/* the Black market */
page('market', { g: 'Jobs', t: 'Black market', kind: 'bm32', from: 32 });
const WARE = [['i-focus_sash', 'Focus Sash', '₽1,800', 'Survives one hit'], ['i-scanner', 'Silph Scanner', '₽4,000', 'Reads any safe'], ['i-rare_candy', 'Rare Candy', '₽900', 'One level, no questions'], ['i-revive', 'Revive', '₽1,200', 'Back on its feet'], ['i-black_glasses', 'Black Glasses', '₽2,400', 'Dark moves hit harder'], ['i-big_nugget', 'Big Nugget', '₽6,000', 'Sells clean for ₽5,000']];
comp(32, 'k:bm32', s => `<div class="scr nv k-bm32">${C('bg', 'night')}${C('top', s, 'Black market', 'Celadon · back room')}
  <section class="sh32" ${mm('panel')}>${map(WARE, ([ic, n, p, d], i) => `<button class="wr32${i === 1 ? ' on' : ''}" style="--d:${i * 70}ms"><span class="ic">${spr(ic, 2.4, '')}</span><b>${n}</b><em>${d}</em><i>${p}</i></button>`)}</section>
  <div class="dl32" data-nocheck>${SP('t-rich', 150, '', 0)}</div>
  ${C('foot', 'Gentleman', '“Dirty money spends just fine in here, friend.”', [['Leave', 'map'], ['Buy Silph Scanner', 'market']])}${C('keys', [['←→↑↓', 'item'], ['Enter', 'buy'], ['Esc', 'leave']])}</div>`);

/* the Laundromat */
page('launder', { g: 'HQ', t: 'Laundromat', kind: 'ld32', from: 32 });
comp(32, 'k:ld32', s => `<div class="scr nv k-ld32">${C('bg', 'hq')}${C('top', s, 'Laundromat', 'Ground Floor · ₽120 a day')}
  <div class="wm32" ${mm('card')}><i class="door"><i class="drum" data-nocheck>${rep(6, i => `<i style="--a:${i * 60}deg">₽</i>`)}</i></i><span class="pnl"><i></i><i></i><b>WASHING</b></span></div>
  ${C('pn', 'lw32', 'Wash tonight', `<div class="tt32"><span><small>Dirty</small><b>₽9,800</b></span><i>→</i><span class="c"><small>Clean</small><b>₽8,330</b></span></div><div class="rate32"><b>Rate 85%</b><em>Bookkeeper on staff: +5%</em></div><div class="hz32"><b>Heat +1</b><em>Washing over ₽10,000 a night draws Looker</em></div>`, 'det')}
  ${C('foot', 'Dale', '“Clean money buys real things, Boss. The Fortress, for one.”', [['Back', 'hq'], ['Wash ₽9,800', 'launder']])}${C('tabs', s)}${C('keys', [['←→', 'amount'], ['Enter', 'wash'], ['Esc', 'back']])}</div>`);

/* Payday */
page('payday', { g: 'Crew', t: 'Payday', kind: 'pd32', from: 32 });
const PAY = [[0, 300, 'Fair', '♪'], [1, 300, 'Fair', '…'], [2, 250, 'Wants more', '#'], [3, 200, 'Thrilled', '♥'], [4, 600, 'Expected', '…'], [5, 400, 'Fair', '♪']];
comp(32, 'k:pd32', s => `<div class="scr nv k-pd32">${C('bg', 'hq')}${C('top', s, 'Payday', 'Week 3 · ₽2,050 total')}
  <section class="pay32" ${mm('panel')}>${map(PAY, ([ci, amt, fl, e], i) => { const c = CREW[ci]; return `<div class="pc32${i === 2 ? ' on' : ''}" style="--d:${i * 90}ms">${face(c.s, 56)}<span class="tx"><b>${c.n}</b><em>${fl}</em></span><span class="env"><i>₽${amt}</i></span><i class="em32 e-${e === '♥' ? 'love' : e === '#' ? 'mad' : e === '♪' ? 'joy' : 'dots'}">${e}</i></div>`; })}</section>
  ${C('foot', 'Gus', '“₽250? Boss, I found that locket. That has to be worth a bonus.”', [['Pay as is', 'hq'], ['Give Gus ₽100 more', 'hq']])}${C('tabs', s)}${C('keys', [['↑↓', 'crew'], ['←→', 'amount'], ['Enter', 'pay']])}</div>`);
