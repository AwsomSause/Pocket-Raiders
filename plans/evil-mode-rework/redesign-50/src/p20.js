/* Pass 20 · Every Player. Dominion is built for any player and any screen: the key strip shows the controller button
   next to every key, whatever you have picked wears a bright focus ring you can always find, and Settings gains Access
   and Controls. New pages: Settings · Access, Controls, and the HQ on a phone. */
const PAD = { Enter: 'A', Esc: 'B', Q: 'Y', P: 'X', Tab: 'R', L: 'L', T: '−' };
comp(20, 'keys', k => before('keys', 20)(k).replace(/<span><kbd>([^<]+)<\/kbd>/g, (m, key) => PAD[key] ? `<span><i class="pad20 p-${PAD[key] === '−' ? 'm' : PAD[key]}">${PAD[key]}</i><kbd>${key}</kbd>` : m));

/* Settings: Access and Controls join the four Dominion categories */
const SET20 = SETCAT.map(c => c[0] === 'Display' ? ['Access', 'access', 'g-town-map', 'Text L · Shapes on'] : c[0] === 'Controls' ? ['Controls', 'controls', 'g-card-key', 'Keys, pad and touch'] : c);
comp(20, 'k:sethome', s => `<div class="scr nv k-sethome">${C('bg', 'hq')}${C('top', s, 'Settings')}
  <section class="sh-grid" ${mm('panel')}>${map(SET20, ([n, g, ic, d], i) => `<button class="sh-t${i === 4 ? ' on' : ''}${g ? '' : ' same'}" ${go(g)} ${st(i, 50)}><span class="sh-i">${spr(ic, 2.6, '')}</span><b>${n}</b><em>${d}</em></button>`)}</section>
  ${C('foot', 'Rotom', '“Bzzt! Access and Controls work for the whole game.”', [['Open Access', 'access']])}${C('keys', [['←→↑↓', 'category'], ['Enter', 'open'], ['Esc', 'back']])}</div>`);
page('access', { g: 'Settings', t: 'Settings · Access', kind: 'settings', from: 20, cat: 4, prev: 'acc', rows: [['Text size', ['S', 'M', 'L', 'XL'], 2, 'Every page grows with it'], ['Colour help', ['Off', 'Shapes', 'High contrast'], 1, 'Owners get shapes, not just colours'], ['Motion', ['Full', 'Less', 'None'], 1, 'Less keeps the story, drops the shake'], ['One-button play', ['On', 'Off'], 1, 'Hold to move, tap to pick'], ['Focus ring', ['On', 'Off'], 0, 'A bright ring on what you picked']] });
PREV.acc = () => `<div class="pv-txt"><b>Rosa</b><p>“You want Celadon, Boss? Give me two nights.”</p></div><div class="pv-own">${map([['Team Nova', '#e0294a', '▲'], ['Foothold', '#f2b632', '■'], ['Team Rocket', '#6a6f86', '●'], ['Nobody yet', '#3d4256', '◆']], ([n, c, sh]) => `<span style="--c:${c}"><i>${sh}</i>${n}</span>`)}</div><p>Large text and shapes for owners, as you will see them.</p>`;
comp(20, 'k:settings', (s, P) => s.cat === 4 ? before('k:settings', 20)(s, P).replace(/<nav class="s5-cat"[^]*?<\/nav>/, `<nav class="s5-cat" ${mm('tab')}>${map(SET20.slice(0, 6).filter((c, i) => i !== 5), ([n, g, ic], i) => `<button class="${n === 'Access' ? 'on' : ''}" ${go(n === 'Access' ? '' : g)}>${spr(ic, 1, '')}<b>${n}</b></button>`)}<button ${go('set')}><b>All settings</b></button></nav>`) : before('k:settings', 20)(s, P));

/* Controls */
page('controls', { g: 'Settings', t: 'Controls', kind: 'ctrl20', from: 20 });
const CTRL = [['Choose', 'Enter', 'A', 'Tap'], ['Back', 'Esc', 'B', 'Swipe right'], ['Wheel (hold)', 'Q', 'Y', 'Long press'], ['Rotom Phone', 'P', 'X', 'Two-finger tap'], ['Text log', 'L', 'L', 'Swipe up'], ['Replay a lesson', 'T', '−', 'Settings › Lessons']];
comp(20, 'k:ctrl20', s => `<div class="scr nv k-ctrl20">${C('bg', 'hq')}${C('top', s, 'Controls', 'Keys, pad and touch')}
  <div class="pad20x" data-nocheck><i class="dpad"></i><span class="fb"><i class="p-Y">Y</i><i class="p-X">X</i><i class="p-B">B</i><i class="p-A">A</i></span><i class="sh l">L</i><i class="sh r">R</i></div>
  ${C('pn', 'ct20', 'Every action, three ways', `<div class="ctr hd"><b>Action</b><b>Keyboard</b><b>Pad</b><b>Touch</b></div>${map(CTRL, ([a, k, p, t], i) => `<div class="ctr${i === 0 ? ' on' : ''}" ${st(i, 50)}><b>${a}</b><span><kbd>${k}</kbd></span><span><i class="pad20 p-${p === '−' ? 'm' : p}">${p}</i></span><em>${t}</em></div>`)}`, 'panel')}
  ${C('foot', 'Rotom', '“Bzzt! Press any button and I’ll show you which one it was.”', [['On a phone', 'portrait'], ['Back', 'set']])}${C('keys', [['↑↓', 'action'], ['Enter', 'rebind'], ['Esc', 'back']])}</div>`);

/* the HQ on a phone */
page('portrait', { g: 'Settings', t: 'On a phone', kind: 'port20', from: 20 });
comp(20, 'k:port20', s => `<div class="scr nv k-port20">${C('bg', 'hq')}${C('top', s, 'On a phone', 'Same game, tall screen')}
  <div class="pf20" data-nocheck><div class="pf-top"><b>THE COMPOUND</b><span>₽4,310 · 22%</span></div><div class="pf-tk">KANTO NEWS · CELADON DEPT. STORE RAIDED</div>
    <div class="pf-bld">${map(FLOORS, (f, i) => `<div class="pf-fl"><b>${f.f}</b>${map(f.rooms.slice(0, 4), ([n]) => `<i>${INR11[n] ? SP(INR11[n], 22, '', 0) : ''}</i>`)}</div>`)}</div>
    <div class="pf-list">${map(['Assign 3 free crew', 'Rosa wants a word', 'Plan a job'], (l, i) => `<span class="${i === 0 ? 'on' : ''}">${l}</span>`)}</div><div class="pf-bub">Rook: “Upper Floor’s done, Boss.”</div>
    <div class="pf-tabs">${map(TABI, ([ic], i) => `<i class="${i === 0 ? 'on' : ''}">${SP(ic, 16, '', 0)}</i>`)}</div></div>
  ${C('pn', 'pt20', 'What moves on a tall screen', map([['Tabs drop to the bottom', 'Thumbs reach the lift console'], ['The building stacks', 'One floor per row, people still in their rooms'], ['Panels become sheets', 'Swipe up for Tonight, down to close'], ['Nothing is cut', 'Every page passes the same fit check']], ([a, b], i) => `<div class="chg up" ${st(i)}><i>▲</i><b>${a}</b><em>${b}</em></div>`), 'det')}
  ${C('keys', [['Esc', 'back']])}</div>`);
