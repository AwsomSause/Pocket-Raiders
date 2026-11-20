/* Pass 24 · The Tilted Ball: the game gets a mark of its own. A Poké Ball whose belt is tipped 14 degrees, the same slant as the title's slash. It becomes the O in the logo, the sun behind the hero, the court painted on every battlefield, the cap on every party card, every app on the phone, every page icon and the save mark. Buttons become capsules. New pages: The Signature, Save Marks, Screen Wipe. */
const em24 = (z = 64, cls = '') => `<i class="em24 ${cls}" data-nocheck style="--z:${z}px"></i>`;
const hdr22 = pick(PR.comps.hdr, 22).fn, arena23 = pick(PR.comps.arena, 23).fn;
comp(24, 'arena', (o = {}) => { const h = arena23(o); return o.dim ? h : h.replace(/(<img class="px ar-bg[^>]*>)/, '$1<i class="court24" data-nocheck></i>'); });
decor(24, 'title', { cls: 'tt24', add: em24(54, 'go'), fn: h => h.replace('<b>Pocket</b>', `<b>P${em24(62, 'lo')}cket</b>`) });
decor(24, 'ev-title', { fn: h => h.replace('<b>Pocket</b>', `<b>P${em24(62, 'lo')}cket</b>`) });
decor(24, 'hub', { cls: 'hb24', add: em24(44, 'hb') });
decor(24, 'party', { cls: 'pk24', add: em24(430, 'bgp') });
decor(24, 'menu', { cls: 'mn24', add: em24(560, 'bgm') });

const SW = [['Raider Red', '#e3350d'], ['Pika Yellow', '#ffcb05'], ['Ink', '#1d2a4d'], ['Paper', '#ffffff'], ['Sky', '#2a75bb']];
const LIVES = ['The O in the logo', 'The sun behind the hero', 'The court on every battlefield', 'The cap on every party card', 'Every app on the Rotom Phone', 'Every page icon', 'Saving, loading and the screen wipe'];
def(24, 'brand', { t: 'The Signature', g: 'Guide' }, () => `<div class="scr sz20 br24">${szh('The tilted ball', 'One mark, tipped 14 degrees like the slash on the title. If a screen has it, it is Pocket Raiders.')}
  <div class="br-big">${em24(190)}<span>14°</span></div>
  <div class="br-c"><b>Three shapes</b><p><i class="s1"></i>Capsule: every button</p><p><i class="s2"></i>Leaf corner: every panel</p><p><i class="s3"></i>Slash: every header and wipe</p></div>
  <div class="br-c col"><b>Five colours</b>${SW.map(s => `<p><i style="background:${s[1]}"></i>${s[0]}</p>`).join('')}</div>
  <div class="br-c wh"><b>Where it lives</b>${LIVES.map(l => `<p>${em24(16)}${l}</p>`).join('')}</div>
  <div class="br-use">${['title', 'battle', 'party'].map(i => emb(i, .2146)).join('')}</div>
  ${C('keys', [['Enter', 'save marks'], ['Esc', 'back']])}</div>`);
const MARKS = [['spin', 'Saving', 'The ball spins while the game writes. Never close the game on this mark.'], ['ok', 'Saved', 'The belt snaps level and the button turns green for one second.'], ['load', 'Loading', 'The ball rocks side to side, like a catch that has not settled.'], ['bad', 'Could not save', 'The ball pops open. Your last good save and its backup are untouched.']];
def(24, 'saving', { t: 'Save Marks', g: 'Guide' }, () => `<div class="scr sz20 sv24">${szh('Save marks', 'One small ball in the corner tells you what the game is doing with your save.')}
  <div class="sv-row">${MARKS.map(m => `<div class="sv-c ${m[0]}"><div>${em24(92, m[0])}</div><b>${m[1]}</b><p>${m[2]}</p></div>`).join('')}</div>
  <div class="sv-toast">${em24(30, 'spin')}<b>Saving</b><span>Slot 1 · Kanto · Stage 12 of 30</span></div>
  <div class="sz-n"><i>Where</i>bottom right of every screen<i>How long</i>under a second<i>Setting</i>Save &amp; Data › Show save mark</div>
  ${C('keys', [['Enter', 'screen wipe'], ['Esc', 'back']])}</div>`);
def(24, 'wipe', { t: 'Screen Wipe', g: 'Guide' }, () => `<div class="scr sz20 wp24">${szh('Screen wipe', 'Every big change of place shuts like a ball and opens on the new screen.')}
  <div class="wp-row"><div class="wp-f a">${emb('map', .302)}<i class="wp-t" data-nocheck></i><i class="wp-b" data-nocheck></i><em>0.0s · Two halves slide in on the slant</em></div>
  <div class="wp-f b"><i class="wp-t" data-nocheck></i><i class="wp-b" data-nocheck></i>${em24(70, 'mid')}<em>0.3s · Shut. The button flashes</em></div>
  <div class="wp-f c">${emb('battle', .302)}<i class="wp-t" data-nocheck></i><i class="wp-b" data-nocheck></i><em>0.5s · Opens on the battle</em></div></div>
  <div class="sz-n"><i>Used for</i>map to battle, battle to reward, town to road<i>Not used for</i>menus and tabs, which slide<i>Reduced motion</i>a plain fade</div>
  ${C('keys', [['Enter', 'play it'], ['Esc', 'back']])}</div>`);
