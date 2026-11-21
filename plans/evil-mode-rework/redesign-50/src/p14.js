/* Pass 14 · Time and weather: mornings get a pink dawn, Heat sets how hard it rains, and Heat 70% turns the city into a siren page */
page('siren', { g: 'Opposition', t: 'Heat 70% siren', kind: 'siren', from: 14 });
for (const id of ['morning', 'assign', 'tut', 'school', 'market']) PR.pages[id].up = Object.assign(PR.pages[id].up || {}, { 14: { bg: 'dawn' } });
comp(14, 'k:siren', (s, P) => `<div class="scr t3 t3-siren">${city('c3-police')}<div class="t3-beam a"></div><div class="t3-beam b"></div>
  <div class="t3-neonsign sr" ${mm('ttl')}>${'HEAT 70%'.split('').map((c, i) => `<b style="--d:${i * 60}ms">${c === ' ' ? '&nbsp;' : c}</b>`).join('')}</div>
  ${spr('t-looker', 2, 't3-look', '', 'spr-t-looker')}${spr('t-policeman', 2.3, 't3-cop', '', 'spr-t-policeman')}
  <section class="t3-panel t3-sp2" ${mm('panel')}>${sign('LOOKER IS IN TOWN', 'red')}<p>Police patrol every district you hold. Jobs lose 10% and any botch means questioning.</p>${C('bar', 'Heat', 70, 100, 0)}
  <div class="t3-fact"><span>Lie low 3 days</span><b>Heat −6</b></div><div class="t3-fact"><span>Pay off Jenny</span><b>₽2,000 · Heat −15</b></div><button class="t3-go" ${go('morning')}>Lie low</button></section>${C('keys', [['Enter', 'Lie low'], ['Esc', 'Ignore it']])}</div>`);
