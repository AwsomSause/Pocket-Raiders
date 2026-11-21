/* Pass 10 · Story Beats. Every event now plays in four beats (talk, choose, result, reward) with a beat bar on top, the
   place fills the screen, and the text box is rebuilt for reading: it waits for a key, keeps a log, and rewards only appear
   after the text is closed. New pages: Event · choose, Event · result, Text log. */
const BEATS = ['Talk', 'Choose', 'Result', 'Reward'];
comp(10, 'beats', on => `<ol class="beats10" ${mm('beats')}>${map(BEATS, (b, i) => `<li class="${i === on ? 'on' : i < on ? 'done' : ''}"><i>${i + 1}</i>${b}</li>`)}</ol>`);
PR.pages.event.up = Object.assign(PR.pages.event.up || {}, { 10: { choices: [['Enter', 'Next', 'evchoose']] } });
PR.pages.reward.up = Object.assign(PR.pages.reward.up || {}, { 10: { kind: 'evreward' } });
page('evchoose', { g: 'Events', t: 'Event · choose', kind: 'evbeat', beat: 1, from: 10 });
page('evresult', { g: 'Events', t: 'Event · result', kind: 'evbeat', beat: 2, from: 10 });
page('log', { g: 'Events', t: 'Text log', kind: 'textlog', from: 10 });
comp(10, 'k:scene', (s, P) => { let h = before('k:scene', 10)(s, P); if (s.mode === 'event') h = h.replace('<div class="act l"', C('beats', 0) + '<div class="act l"');
  return h.replace('<i class="more">▼</i>', `<span class="tb-chips"><i ${go('log')}>L · Log</i><i>Auto: off</i></span><i class="more">▼</i>`); });
const EVC = [['1', 'Find the Persian', 'Wits 6 vs 5', 74, 'g-scope-lens', '₽800 and a thank-you'], ['2', 'Keep the locket', 'Charm 4', 100, 'g-amulet-coin', 'Money now, Regard −4'], ['3', 'Walk on', 'No roll', 100, 'g-letter', 'Nothing changes']];
comp(10, 'k:evbeat', s => { const ch = s.beat === 1; return `<div class="scr nv k-ev10 ${ch ? 'b-ch' : 'b-res'}">${C('bg', 'street')}${C('beats', s.beat)}
  <div class="act l" style="--pc:${pc('t-rich')}">${SP('t-rich', 230)}<span class="plate"><b>Gentleman</b><em>Celadon</em></span></div>
  ${ch ? `<nav class="evc">${map(EVC, ([k, l, r, o, ic, d], i) => `<button class="evc-c${i === 0 ? ' on' : ''}" ${go('evresult')} style="--d:${i * 100}ms">${spr(ic, 1.6, '')}<span class="row-t"><b>${l}</b><em>${d}</em></span><span class="evc-r"><kbd>${k}</kbd><b>${o}%</b><em>${r}</em></span></button>`)}</nav>
  <section class="tbox" ${mm('box')}><span class="spk6" style="--pc:${pc('c-gus')}">${face('c-gus', 62)}<b>Gus</b></span><p>Boss, the locket’s gold. Real gold. Just saying.</p><i class="more">▼</i></section>`
  : `<div class="evr-art">${SP('p-persian', 120)}<span class="evr-lk">${spr('g-amulet-coin', 1.6, '')}</span></div><div class="act r" style="--pc:${pc('c-gus')}">${SP('c-gus', 200, 'flip')}<span class="plate"><b>Gus</b><em>Grunt</em></span></div>
  <div class="roll10"><em>Wits 6 vs 5</em><b>SUCCESS</b><span>rolled 31 · needed 74 or less</span></div>
  <section class="tbox" ${mm('box')}><span class="spk6" style="--pc:${pc('t-rich')}">${face('t-rich', 62)}<b>Gentleman</b></span><p>My Persian! And the locket! You are not what people say you are. Here, for your trouble.</p><span class="tb-chips"><i>Reward shows after this text</i></span><i class="more">▼</i></section>`}
  ${C('keys', ch ? [['1-3', 'choose'], ['Enter', 'confirm'], ['L', 'log']] : [['Enter', 'close the text'], ['L', 'log']])}</div>`; });
comp(10, 'k:evreward', s => `<div class="scr nv k-rw10">${C('bg', 'gold')}${C('beats', 3)}<div class="rw-burst" data-nocheck></div>
  <div class="rw-h" ${mm('ttl')}><small>Event reward</small><b>${esc(s.big)}</b></div>
  <div class="rw-cards">${map(s.lines, ([a, b, d], i) => `<div class="rw-c" style="--d:${300 + i * 150}ms">${spr(['g-amulet-coin', 'g-relic-crown', 'g-idcard'][i] || 'g-nugget', 2, '')}<b>${esc(a)}</b><em>${esc(b)}</em></div>`)}</div>
  <p class="rw-n">The text is closed, so the reward shows. It stays until you press a key.</p>
  <button class="cta on rw-go" ${go(s.cta[1])}>${esc(s.cta[0])}</button>${C('keys', [['Enter', 'take it and close']])}</div>`);
const LOG = [['Gentleman', 't-rich', 'You there! Your sort “finds” things, yes?'], ['Gentleman', 't-rich', 'My Persian has run off with my late wife’s locket. I will pay. Discreetly.'], ['Gus', 'c-gus', 'Boss, the locket’s gold. Real gold. Just saying.'], ['Nate', 't-natebig', 'You chose: Find the Persian.'], ['Gentleman', 't-rich', 'My Persian! And the locket! Here, for your trouble.']];
comp(10, 'k:textlog', s => `<div class="scr nv k-log">${C('bg', 'street')}${C('top', s, 'Text log', 'Street event')}
  ${C('pn', 'log10', 'Everything said in this event', map(LOG, ([n, k, t], i) => `<div class="lg" ${st(i, 60)}>${face(k, 40)}<span><b style="color:${pc(k)}">${n}</b><p>${esc(t)}</p></span></div>`), 'panel')}${C('keys', [['↑↓', 'scroll'], ['L', 'close'], ['Esc', 'back']])}</div>`);
