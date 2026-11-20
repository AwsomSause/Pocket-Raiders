/* Pass 23 · Breathing Room: twenty-two passes of adding made the main screens busy, so this pass takes things away. Each screen keeps one job. Battle folds five strips into one status bar, the title keeps only the menu and the face-off, the party shows details for one Pokémon at a time, the phone and the town tuck extras behind one button. New pages hold what was folded away: Battle Status, News, This Run, and a before / after sheet. */
const arena22 = pick(PR.comps.arena, 22).fn;
comp(23, 'arena', (o = {}) => { const h = arena22(o), f = o.foe || FOE; return o.dim || o.noorder || o.bg ? h : h + `<div class="bar23" ${go('b-status')} ${mm('status')}><b>Turn 3</b><span>${f.n} moves first</span><i>${wxi('rain')}3</i><i>${spr('i-amulet_coin', .5)}₽ 2,280</i><em>More</em><u ${go('menu')}>Menu</u></div>`; });
decor(23, 'title', { cls: 'tt23', add: `<div class="news23" ${go('news')}><b>News</b><u>3</u></div><div class="st23">Rank 4<i></i>Best: Stage 18<i></i>Evening in Kanto</div>` });
decor(23, 'hub', { cls: 'hb23', add: `<div class="news23 hb" ${go('news')}><b>Notice board</b><u>4</u></div>` });
decor(23, 'party', { cls: 'pk23' });
decor(23, 'menu', { cls: 'mn23', add: `<div class="runc23" ${go('run-app')}><b>This run</b><span>Stage ${RUN.stage} of ${RUN.stages} · ${RUN.gym}</span><span>${stars(3)} 12,480 · 2 powers ready</span><em>Open</em></div>` });

def(23, 'b-status', { t: 'Battle · Status', g: 'Battle' }, () => over16('st23p', 'Status', 'Everything the one-line bar folds away. Looking here does not use your turn.',
  `<div class="stg23"><div><b>Turn order</b><p><i>1</i>Blastoise <u>Speed 78</u></p><p><i>2</i>Charizard <u>Speed 71</u></p></div>
  <div ${go('weather')}><b>Weather</b><p>${wxi('rain')}Rain · 3 turns left</p><p>Water moves hit harder. Fire moves hit softer.</p></div>
  <div><b>Prize</b><p>${spr('i-amulet_coin', .5)}₽ 2,280 if you win</p><p>${stars(3)} three stars so far</p></div>
  <div ${go('homeland')}><b>Homeland Week</b><p>Defeat 3 Gym Leaders</p><p>2 of 3 · 3 days left</p></div>
  <div class="wide" ${go('b-switch')}><b>Your bench</b><span>${PARTY.slice(1).map(p => `<i class="${p.hp ? '' : 'ko'}">${spr('m-' + p.k, fitS('m-' + p.k, 38, 34))}<s><u style="width:${pct(p.hp, p.mx)}%"></u></s></i>`).join('')}</span></div>
  <div class="wide"><b>Blue's team</b><span><i class="ko">${spr('m-59', fitS('m-59', 38, 34))}</i><i>${spr('m-9', fitS('m-9', 38, 34))}</i><em>2 more not seen yet</em></span></div></div>
  <div class="in-foot"><div class="btn on" ${go('b-info')}><b>Battle Info</b></div><div class="btn" ${go('b-log')}><b>Battle Log</b></div><div class="btn" ${go('battle')}><b>Back</b></div></div>${C('keys', [['←→', 'move'], ['Enter', 'open'], ['Esc', 'back']])}`));

const NEWS = [['homeland', '#2f86c4', 'Game event', 'Homeland Week', '3 days left. Goals 2 of 3 done.'], ['forecast', '#57307c', 'Forecast', 'Evening, rain until stop 14', 'Rain at the Gym helps Misty.'], ['rivals', '#2a75bb', 'Rivals', 'Blue is around stop 15', 'You are 1 win, 1 loss against him.'], ['tcard', '#b97f00', 'Your record', 'Best: Stage 18', 'Rank 4 · 2 badges this run.']];
def(23, 'news', { t: 'News', g: 'Start' }, () => `<div class="scr nw23">${C('hdr', 'News', ['3 new'], 'guide', ['Title', 'News'])}
  <div class="nws">${NEWS.map((n, i) => `<div class="nw${i === 0 ? ' on' : ''}" style="--c:${n[1]}" ${go(n[0])}><em>${n[2]}</em><b>${n[3]}</b><span>${n[4]}</span><u data-nocheck>›</u></div>`).join('')}</div>
  <div class="nw-rot">${rotom(1)}<p><b>Rotom</b>Bzzt! I keep the news here so the title screen stays clean.</p></div>
  ${C('keys', [['↑↓', 'move'], ['Enter', 'open'], ['Esc', 'back']])}</div>`);

def(23, 'run-app', { t: 'This Run', g: 'Menu' }, () => `<div class="scr ra23">${C('hdr', 'This Run', ['Stage ' + RUN.stage + ' of ' + RUN.stages, 'Seed ' + RUN.seed], 'map', ['Menu', 'This Run'])}
  <div class="ra-g"><div class="pn"><b>Powers</b>${GIM.map(g => `<p class="${g.st}" style="--c:${g.c}"><i>${spr(g.ic, g.ts)}</i>${g.n || ''}<u>${GST[g.st]}</u></p>`).join('')}</div>
  <div class="pn"><b>Run score</b><p class="big">${stars(3)}12,480</p><p>5 wins in a row</p><p>2 badges · 14 Pokémon caught</p></div>
  <div class="pn" ${go('boss')}><b>Next Gym</b><p class="big">${spr('t-misty', 1)}Misty</p><p>${C('ty', 'water')} in 3 stops</p><p>Best pick: Pikachu</p></div>
  <div class="pn" ${go('rivals')}><b>Rivals</b>${RIV.map(r => `<p><i>${spr(r[1], 1)}</i>${r[0]}<u>${r[5]}</u></p>`).join('')}</div></div>
  ${C('keys', [['←→', 'move'], ['Enter', 'open'], ['Esc', 'back']])}</div>`);

const RULES23 = [['One job per screen', 'Battle is for choosing a move. The title is for starting. Everything else gets its own page.'], ['Six things or fewer', 'No screen asks your eyes to track more than six groups at once.'], ['One tap away', 'Folded things live behind one button: More in battle, News on the title, This Run on the phone.']];
def(23, 'declutter', { t: 'Before and After', g: 'Guide' }, () => `<div class="scr sz20 dc23">${szh('Breathing room', 'Pass 22 on the left, this pass on the right.')}
  <div class="dc-two"><div><img src="sprites/ss-battle-22.png" alt=""><em class="bad">Before · 13 things on screen</em></div><div>${emb('battle', .4583)}<em class="good">After · 7 things on screen</em></div></div>
  <div class="dc-r">${RULES23.map((r, i) => `<p><i>${i + 1}</i><b>${r[0]}</b><span>${r[1]}</span></p>`).join('')}</div>
  ${C('keys', [['Enter', 'open the battle'], ['Esc', 'back']])}</div>`);
