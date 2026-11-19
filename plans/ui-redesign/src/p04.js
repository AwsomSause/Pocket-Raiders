/* Pass 4 · In Motion: everything moves. Ball cursor, idle sprites, marching route, plus pages that show the animations */
comp(4, 'tl', (steps, on) => `<div class="tl">${steps.map((s, i) => `<span class="${i === on ? 'on' : i < on ? 'past' : ''}"><i>${s[0]}</i>${s[1]}</span>`).join('')}</div>`);
const WILD = { k: '163', n: 'Hoothoot', ty: ['normal', 'flying'], lv: 31, g: '♀' };
def(4, 'encounter', { t: 'Battle Start', g: 'Battle' }, () => `<div class="scr battle b2 enc"><img class="px ar-bg" src="sprites/a-forest-bg.png" alt="">
  <div class="ar-foe">${spr('a-forest-b', 3, 'ar-base')}${spr('m-' + WILD.k, 3, 'ar-mon')}</div>
  <div class="ar-me">${spr('a-forest-a', 4, 'ar-base')}${spr('mb-6', 4, 'ar-mon')}</div>
  <div class="plate foe" style="${tgrad(WILD.ty)}"><div class="pl-in"><div class="pl-1"><b>${WILD.n}</b><i class="gd">${WILD.g}</i>${WILD.ty.map(t => C('medal', t, .625)).join('')}<span class="lv">Lv ${WILD.lv}</span></div><div class="pl-2"><em>HP</em>${C('hp', 100)}</div><div class="pl-3"><span>Wild Pokémon</span><span>Not caught yet</span></div></div></div>
  ${C('box', '', 'A wild <b>Hoothoot</b> appeared!')}
  <div class="iris top"></div><div class="iris bot"></div><div class="iris-btn"></div>
  ${C('tl', [['0.0s', 'Ball snaps shut'], ['0.4s', 'Ball splits open'], ['0.8s', 'Hoothoot slides in'], ['1.2s', 'Plate drops, text types'], ['1.8s', 'Go! Charizard!']], 3)}
  <div class="enc-next btn on" ${go('battle')}><b>Next</b></div></div>`);
def(4, 'hit', { t: 'Move Hit', g: 'Battle' }, () => `<div class="scr battle b2 hitp">${C('arena')}
  <div class="fx-burst" style="--t:${TYC.fire}"></div><div class="fx-flash"></div>
  <div class="dmg" data-nocheck><b>−38</b><span>Weak hit</span></div>
  ${C('box', '', '<b>Charizard</b> used <b>Flamethrower</b>! It is not very effective…')}
  ${C('tl', [['0.0s', 'Charizard lunges'], ['0.2s', 'Fire burst on Blastoise'], ['0.3s', 'Flash, shake, number pops'], ['0.5s', 'HP drains'], ['1.1s', 'Text confirms']], 3)}
  <div class="enc-next btn on" ${go('battle')}><b>Next</b></div></div>`);
def(4, 'motion', { t: 'Motion Sheet', g: 'Guide' }, () => { const rows = [['Change page', 'Any menu page', '0.30s', 'Old page slides out left, new one slides in; shared pieces morph', 'slide'], ['Enter battle', 'Map to battle', '0.70s', 'Poké Ball iris: snaps shut, then splits open', 'iris'], ['Move the cursor', 'Every list', '0.18s', 'Ball cursor hops to the new row, row springs out', 'hop'], ['Deal cards', 'Party, Bag, moves', '0.04s each', 'Cards pop in one after another', 'deal'], ['HP change', 'Battle', '0.60s', 'Bar drains with a pale ghost of the lost HP', 'drain'], ['Text', 'All text boxes', '40 letters/s', 'Types out; a bouncing arrow waits for input', 'type']]; return `<div class="scr motion">${C('hdr', 'Motion Sheet', ['Pass 4'])}
  <div class="mo-list pn">${rows.map(r => `<div class="mo-row"><b>${r[0]}</b><span>${r[1]}</span><em>${r[2]}</em><p>${r[3]}</p><div class="demo d-${r[4]}"><i></i><i></i><i></i></div></div>`).join('')}</div>
  ${C('box', '', 'Every animation is skipped when Reduced motion is on, and none of them delays a result.')}
  ${C('keys', [['Esc', 'back']])}</div>`; });
