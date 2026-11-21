/* Pass 24 · Nova Mark. Team Nova finally has a brand, and the whole UI wears it: every page opens with a crimson Nova
   star that bursts open like an iris, a giant Nova star turns slowly behind every page, every panel head is stamped with
   the four-point star, and every crew portrait wears a crimson armband. New pages: The Mark (pick your team colour and
   emblem), Uniforms (the crew lined up in armbands), and the Calling card you leave at a job. */
comp(24, 'bg', b => before('bg', 24)(b) + '<i class="nova24" data-nocheck></i><i class="iris24" data-nocheck></i>');

/* The Mark */
page('mark', { g: 'HQ', t: 'The Mark', kind: 'mark24', from: 24 });
const MCOL = [['Crimson', '#e0294a'], ['Midnight', '#2860c9'], ['Gold', '#e8b23a'], ['Jade', '#16938a'], ['Violet', '#8e2bd1']];
const MEMB = [['Nova star', '✦'], ['Bolt', 'ϟ'], ['Fang', '▼'], ['Eye', '◉']];
comp(24, 'k:mark24', s => `<div class="scr nv k-mark24">${C('bg', 'hq')}${C('top', s, 'The Mark', 'Team Nova’s colours')}
  <div class="flag24" ${mm('emb')}><i class="rays" data-nocheck></i><span class="st">N</span><b>TEAM NOVA</b></div>
  ${C('pn', 'mk24', 'Your mark', `<b class="mh24">Colour</b><div class="sw24">${map(MCOL, ([n, c], i) => `<button class="${i === 0 ? 'on' : ''}" style="--c:${c};--d:${i * 60}ms"><i></i><em>${n}</em></button>`)}</div>
    <b class="mh24">Emblem</b><div class="em24">${map(MEMB, ([n, g], i) => `<button class="${i === 0 ? 'on' : ''}" style="--d:${i * 60}ms"><i>${g}</i><em>${n}</em></button>`)}</div>
    <b class="mh24">Armband letter</b><div class="lt24"><kbd>N</kbd><em>Shows on every crew armband</em></div>`, 'det')}
  ${C('foot', 'Rosa', '“Every wall in Celadon knows this mark now.”', [['Uniforms', 'uniform'], ['Keep it', 'hq']])}${C('tabs', s)}${C('keys', [['↑↓', 'row'], ['←→', 'pick'], ['Enter', 'keep']])}</div>`);

/* Uniforms */
page('uniform', { g: 'Crew', t: 'Uniforms', kind: 'uni24', from: 24 });
comp(24, 'k:uni24', s => `<div class="scr nv k-uni24">${C('bg', 'hq')}${C('top', s, 'Uniforms', '6 crew in armbands')}
  <div class="line24" data-nocheck></div>
  <section class="par24" ${mm('panel')}>${map(CREW, (c, i) => `<button class="pu24${i === 4 ? ' on' : ''}" style="--d:${i * 110}ms"><span class="sp">${SP(c.s, 108, '', 0)}</span><i class="ab24"><u>N</u>${esc(c.r)}</i><b>${esc(c.n)}</b></button>`)}</section>
  ${C('foot', 'Dale', '“Pressed and ready, Boss. Even Gus tucked his shirt in.”', [['The Mark', 'mark'], ['Done', 'roster']])}${C('tabs', s)}${C('keys', [['←→', 'crew'], ['Enter', 'inspect'], ['Esc', 'back']])}</div>`);

/* The Calling card */
page('calling', { g: 'Jobs', t: 'Calling card', kind: 'cc24', from: 24 });
comp(24, 'k:cc24', s => `<div class="scr nv k-cc24">${C('bg', 'night')}${C('top', s, 'Calling card', 'Celadon Dept. Store')}
  <div class="tbl24" data-nocheck></div>
  <div class="cc24" ${mm('card')}><i class="stamp" data-nocheck></i><small>Night 18 · Celadon Dept. Store</small><b>TEAM NOVA<br>WAS HERE</b><em>We took what we came for. We will be back.</em></div>
  ${C('pn', 'ccw24', 'What the card does', map([['Dread in Celadon', '+4', 1], ['Regard in Celadon', '−2', -1], ['Heat', '+3', -1], ['Rocket', 'notices you', -1]], ([a, b, v], i) => `<div class="chg ${v < 0 ? 'dn' : 'up'}" ${st(i)}><i>${v < 0 ? '▼' : '▲'}</i><b>${a}</b><em>${b}</em></div>`), 'det')}
  ${C('foot', 'Gus', '“Leave a card? Feels like bragging, Boss. I like it.”', [['No card', 'morning'], ['Leave the card', 'morning']])}${C('keys', [['←→', 'choose'], ['Enter', 'confirm']])}</div>`);
PR.pages.done.up = Object.assign(PR.pages.done.up || {}, { 24: { cta: ['Leave a card', 'calling'] } });
