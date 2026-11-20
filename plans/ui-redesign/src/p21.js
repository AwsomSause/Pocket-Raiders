/* Pass 21 · Living World: every screen shows the time of day and the weather of the stop you are on. It is Day 3, evening, with rain: the title, town, menus and battle all turn to dusk. New pages: Time of Day, Weather, Weather Rolls In, Rotom Forecast, Night Encounter. */
const wxi = k => `<i class="wxi ${k}" data-nocheck></i>`;
const sky21 = (k, name, sub, cls = '') => `<div class="sky21 ${cls}">${wxi(k)}<b>${name}</b><span>${sub}</span></div>`;
const arena18 = pick(PR.comps.arena, 18).fn;
/* battles carry the weather: streaks over the arena, a chip by the turn counter */
comp(21, 'arena', (o = {}) => { const h = arena18(o); return o.dim || o.noorder || o.bg ? h : h + `<i class="rain21" data-nocheck></i><div class="wx21" ${go('weather')}>${wxi('rain')}<b>Rain</b><span>3 turns left</span></div>`; });
decor(21, 'title', { cls: 'tt21', add: `<i class="sun21" data-nocheck></i>${sky21('eve', 'Evening', 'Kanto · Route 6', 'tt')}` });
decor(21, 'hub', { cls: 'hb21', add: `<i class="glow21" data-nocheck style="left:282px"></i><i class="glow21" data-nocheck style="left:550px"></i><i class="stars21" data-nocheck></i>${sky21('eve', 'Evening', 'Lamps are on', 'hb')}` });
decor(21, 'party', { cls: 'pk21', add: `<i class="stars21" data-nocheck></i><i class="fire21" data-nocheck></i>` });
decor(21, 'fight', { add: `<div class="wxm21"><u>▼</u>Weaker in rain</div>` });
decor(21, 'menu', { cls: 'mn21', add: `<i class="stars21" data-nocheck></i>${sky21('eve', 'Evening', 'Rain until stop 14', 'mn')}` });

const TOD = [['day', 'Day', 'Clear light on every screen.', 'The town is open, banners are up.', 'Daytime evolutions can happen.'], ['eve', 'Evening', 'A low sun. Lamps come on.', 'Menus sit over a sunset.', 'Long shadows in battle.'], ['night', 'Night', 'Stars, lit windows, lantern glow.', 'Menus dim to night blue.', 'Night-time evolutions can happen.']];
const TODSEQ = 'dddennddeenndddennddeenndddenn';
def(21, 'time', { t: 'Time of Day', g: 'World' }, () => `<div class="scr lw21">${C('hdr', 'Time of Day', ['Day 3', 'Evening'], 'guide', ['Menu', 'Journal'])}
  <div class="tod">${TOD.map((t, i) => `<div class="tod-c ${t[0]}${i === 1 ? ' on' : ''}"><div class="tod-v"><img class="px" src="sprites/town-street.png" alt=""><i class="tod-s" data-nocheck></i>${i === 2 ? '<i class="stars21" data-nocheck></i>' : ''}${wxi(t[0])}${i === 1 ? '<em>Now</em>' : ''}</div><b>${t[1]}</b><p>${t[2]}</p><p>${t[3]}</p><p>${t[4]}</p></div>`).join('')}</div>
  <div class="tod-run"><b>This run</b><span class="tod-dots">${rep(30, i => `<i class="${{ d: 'day', e: 'eve', n: 'night' }[TODSEQ[i]]}${i === 11 ? ' on' : ''}"></i>`)}</span><span>Every stop has its own time, set by the run's seed. The same seed always gives the same days.</span></div>
  <div class="tod-n"><i>Stone rule</i>An evolution that needs a time of day can also use a stone at any time.</div>
  ${C('keys', [['←→', 'look at a time'], ['Enter', 'weather'], ['Esc', 'back']])}</div>`);

const WX = [['clear', 'Clear', 'grass', 'No effect.', 'The arena looks as the time of day paints it.'], ['sun', 'Harsh Sun', 'desert', 'Fire moves hit harder.', 'Water moves hit softer.'], ['rain', 'Rain', 'sea', 'Water moves hit harder.', 'Fire moves hit softer.'], ['sand', 'Sandstorm', 'mountain', 'Hurts every Pokémon each turn,', 'except Rock, Ground and Steel.'], ['snow', 'Snow', 'ice_cave', 'Ice types take less', 'damage from physical moves.']];
def(21, 'weather', { t: 'Weather', g: 'World' }, () => `<div class="scr lw21">${C('hdr', 'Weather', ['Now: Rain', '3 turns left'], 'guide', ['Battle', 'Info'])}
  <div class="wxs">${WX.map(w => `<div class="wx-c ${w[0]}${w[0] === 'rain' ? ' on' : ''}"><div class="wx-v"><img class="px" src="sprites/a-${w[2]}-bg.png" alt=""><i class="wx-fx" data-nocheck></i>${w[0] === 'rain' ? '<em>Now</em>' : ''}</div><b>${wxi(w[0])}${w[1]}</b><p>${w[3]}</p><p>${w[4]}</p></div>`).join('')}</div>
  <div class="wx-how"><b>How the screen tells you</b><p><i>1</i>A chip by the turn counter names the weather and counts its turns.</p><p><i>2</i>The whole arena changes: streaks, glare, grit or flakes.</p><p><i>3</i><span>Move buttons show <u class="up">▲</u> or <u class="dn">▼</u> when the weather changes their power.</span></p></div>
  ${C('keys', [['←→', 'look at a weather'], ['Enter', 'see it roll in'], ['Esc', 'back']])}</div>`);

def(21, 'wx-change', { t: 'Weather Rolls In', g: 'World' }, () => `<div class="scr battle b6 b7 b16 b17 wxc21">${C('arena', { noorder: 1, text: 'Blastoise used <b>Rain Dance</b>. It started to rain!', right: nextBtn('battle') })}
  <i class="cloud21 c1" data-nocheck></i><i class="cloud21 c2" data-nocheck></i><i class="rain21" data-nocheck></i>
  <div class="wxword" data-nocheck>RAIN</div><div class="wx21 big">${wxi('rain')}<b>Rain</b><span>5 turns</span></div>
  ${C('tl', [['0.0s', 'Clouds slide in'], ['0.4s', 'Light drops'], ['0.7s', 'Rain starts, chip pops'], ['1.1s', 'Moves show ▲ ▼']], 2)}</div>`);

const FC = [['13', 'Wild Pokémon', 'eve', 'rain', 'Route 6'], ['14', 'Event', 'night', 'rain', 'The Old Lighthouse'], ['15', 'Trainer', 'night', 'clear', 'Ace Trainer'], ['16', 'Gym', 'day', 'rain', 'Misty · Water'], ['17', 'Wild Pokémon', 'day', 'sun', 'Route 9'], ['18', 'Shop', 'eve', 'clear', 'Poké Mart']];
const TODN = { day: 'Day', eve: 'Evening', night: 'Night' }, WXN = { clear: 'Clear', rain: 'Rain', sun: 'Harsh Sun', sand: 'Sandstorm', snow: 'Snow' };
def(21, 'forecast', { t: 'Rotom Forecast', g: 'World' }, () => `<div class="scr lw21">${C('hdr', 'Forecast', ['Kanto', 'Stage ' + RUN.stage + ' of ' + RUN.stages], 'map', ['Menu', 'Map'])}
  <div class="fcs">${FC.map((f, i) => `<div class="fc ${f[2]}${f[1] === 'Gym' ? ' gym' : ''}${i === 0 ? ' on' : ''}"><em>Stop ${f[0]}</em><b>${f[1]}</b><span>${f[4]}</span><div class="fc-i">${wxi(f[2])}${wxi(f[3])}</div><u>${TODN[f[2]]}</u><u>${WXN[f[3]]}</u></div>`).join('')}</div>
  <div class="fc-rot">${rotom(1)}<p><b>Rotom</b>Bzzt! Rain at the Gym. Misty's Water moves will hit harder there. Lead with <b>Pikachu</b> and save a Revive for <b>Lucario</b>.</p><div class="btn on nx" ${go('party')}><b>Fix my team</b></div></div>
  ${C('keys', [['←→', 'pick a stop'], ['Enter', 'fix my team'], ['Esc', 'back']])}</div>`);

def(21, 'night-wild', { t: 'Night Encounter', g: 'World' }, () => `<div class="scr battle b6 b7 b16 b17 nt21">${C('arena', { foe: WILD, bg: 'forest', noorder: 1, text: 'A wild <b>Hoothoot</b> swoops out of the dark!', right: nextBtn('sendout') })}
  <i class="dark21" data-nocheck></i><i class="stars21" data-nocheck></i>
  ${sky21('night', 'Night', 'Some Pokémon only come out after dark', 'nt')}
  ${C('tl', [['0.0s', 'Screen is black, two eyes blink'], ['0.5s', 'Lantern light opens on Hoothoot'], ['0.9s', 'Stars fade in, plates slide in']], 1)}</div>`);
