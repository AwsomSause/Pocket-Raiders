/* Pass 15 · The Journey: a run now has a clear start and a clear end. A route line rides on every screen, and New Run, Starter Quiz, Starter Pick, Blessing, Run Over, Run Report and Hall of Fame get their own pages */
const GYMSTOP = [4, 8, 14, 17, 20, 23, 25, 27];
const ribbon = (cls = '', at = 11) => `<i class="rib ${cls}">${rep(30, i => `<u class="${i < at ? 'past' : i === at ? 'on' : ''}${GYMSTOP.includes(i) ? ' gym' : ''}${i === 29 ? ' lg' : ''}"></u>`)}</i>`;
const INRUN = ['Menu', 'Map', 'Party', 'Bag', 'Pokédex', 'Badges', 'Trainer Card'];
const hdr8 = pick(PR.comps.hdr, 8).fn;
comp(15, 'hdr', (t, pills, area, crumb) => { const h = hdr8(t, pills, area, crumb); return crumb && INRUN.includes(crumb[0]) ? h.replace(/<\/div>$/, ribbon('under') + '</div>') : h; });
const steps = on => `<div class="steps">${['Trainer', 'Starter', 'Blessing', 'Set off'].map((s, i) => `<i class="${i === on ? 'on' : i < on ? 'past' : ''}"><b>${i + 1}</b>${s}</i>`).join('')}</div>`;
DOORS[3][3] = 'newrun';
def(15, 'newrun', { t: 'New Run', g: 'Run' }, () => `<div class="scr nrun">${C('hdr', 'New Run', ['Run 13'], 'map', ['Hub', 'New Run'])}${steps(0)}
  <div class="nr-who" style="--c:${TRC.Red}" ${go('trainers')}>${spr('t-red', 4)}<em>Playing as</em><b>Red</b><i><kbd>T</kbd> change</i></div>
  <div class="set-rows pn nr-rows">${C('srow', 'Kind of run', 'A normal run, or a Story Run with scenes between stops.', C('seg', ['Normal', 'Story'], 0), 1)}${C('srow', 'Stage length', 'Stops in each region.', C('seg', ['20', '30', '40', '50'], 1))}${C('srow', 'First region', 'Kanto, Hoenn and Galar are 3× as likely this week.', C('seg', ['Surprise me', 'Choose'], 0))}${C('srow', 'Seed', 'The same seed gives the same run.', C('seg', ['Random', 'Daily', 'Type one'], 0))}</div>
  <div class="nr-go pn"><b>Your run</b><p>Red · 30 stops a region</p><p>Homeland Week is on</p><p>Blessings and Ultra Beasts on</p><div class="btn on" ${go('quiz')}><b>Next: Starter</b></div></div>
  ${C('keys', [['↑↓', 'move'], ['←→', 'change'], ['Enter', 'next'], ['Esc', 'back to the street']])}</div>`);
const QA = ['Find shelter and wait it out', 'Keep walking. A little rain never hurt', 'Look for whoever might need help'];
def(15, 'quiz', { t: 'Starter Quiz', g: 'Run' }, () => `<div class="scr quizp">${C('hdr', 'Starter Quiz', ['Question 2 of 5'], 'map', ['Hub', 'New Run', 'Starter'])}${steps(1)}
  <div class="qz-oak">${spr('t-oak', 4)}</div>
  <div class="qz-q"><em>Professor Oak asks</em><b>A storm rolls in while you are far from town. What do you do?</b></div>
  <div class="qz-a">${QA.map((a, i) => `<div class="btn${i === 0 ? ' on' : ''}" ${go('starter')}><b>${a}</b></div>`).join('')}</div>
  <div class="qz-pips">${rep(5, i => `<i class="${i < 1 ? 'past' : i === 1 ? 'on' : ''}"></i>`)}<span><kbd>S</kbd> skip the quiz and pick freely</span></div>
  ${C('keys', [['↑↓', 'answer'], ['Enter', 'choose'], ['S', 'skip quiz'], ['Esc', 'back']])}</div>`);
const STARTERS = [['4', 'Charmander', 'fire', 0, 'on'], ['258', 'Mudkip', 'water', 2, ''], ['656', 'Froakie', 'water', 5, '']];
def(15, 'starter', { t: 'Starter Pick', g: 'Run' }, () => `<div class="scr startp">${C('hdr', 'Starter Pick', ['One from three regions'], 'map', ['Hub', 'New Run', 'Starter'])}${steps(1)}
  <div class="sp-row">${STARTERS.map(s => `<div class="spc ${s[4]}" style="--t:${TYC[s[2]]}" ${go('blessing')}><i class="sp-ball"></i>${spr('m-' + s[0], s[4] ? 4 : 3, 'sp-mon')}${stamp(s[3], 'sm')}<b>${s[1]}</b>${C('ty', s[2])}<em>Starter Remembrance</em></div>`).join('')}</div>
  ${C('box', '', 'Professor Oak: "Your answers point to these three. Each comes from a different region. Take your time."')}
  ${C('keys', [['←→', 'starter'], ['Enter', 'choose'], ['I', 'summary'], ['Esc', 'back']])}</div>`);
const BLESS = [['146', 'Lesser', 'The Spring Fire', 'THE FIRST WARMTH', 'Burns on your Pokémon do half damage.', '#e8791a', ''], ['249', 'Greater', 'The Guardian of the Sea', 'A LONG NOTE UNDER WATER', 'Once per stage, call a Calm in battle: weather, terrain and every stat change are cleared.', '#4f7fe0', 'on'], ['250', 'Divine', 'The Rainbow', 'SACRED ASH', 'Once per region, after a battle, every fainted Pokémon in your party is restored.', '#f2a900', '']];
def(15, 'blessing', { t: 'Blessing', g: 'Run' }, () => `<div class="scr blessp">${C('hdr', 'Blessing', ['1 of 3'], 'map', ['Hub', 'New Run', 'Blessing'])}${steps(2)}
  <div class="bl-row">${BLESS.map(b => `<div class="blc ${b[6]}" style="--c:${b[5]}" ${go('travel')}><em>${b[1]}</em><i>${spr('m-' + b[0], fitS('m-' + b[0], 150, 110))}</i><b>${b[2]}</b><u>${b[3]}</u><p>${b[4]}</p></div>`).join('')}</div>
  <div class="bl-pass"><i>"When the fire and the ice and the lightning quarrel, there is one beneath the sea who is not angry."</i></div>
  ${C('keys', [['←→', 'blessing'], ['Enter', 'accept'], ['N', 'go without one'], ['Esc', 'back']])}</div>`);
def(15, 'gameover', { t: 'Run Over', g: 'Run' }, () => `<div class="scr res overp" style="--c:#56627f"><i class="glow"></i>
  <div class="ov-t"><small>Run 13 · Kanto</small><b>The journey ends</b><span>Lost to Gym Leader Lt. Surge at stop 15 of 30</span></div>
  ${ribbon('big', 14)}
  <div class="ov-team">${PARTY.map(p => `<i>${spr('m-' + p.k, fitS('m-' + p.k, 84, 76))}</i>`).join('')}</div>
  <div class="ov-keep"><b>You keep</b><span>${coin()} 620 Bank credits</span><span>2 achievements</span><span>9 Pokédex entries</span></div>
  <div class="ov-btns"><div class="btn on" ${go('report')}><b>Run Report</b></div><div class="btn" ${go('newrun')}><b>New Run</b></div><div class="btn" ${go('hub')}><b>Back to the Hub</b></div></div>
  ${C('tl', [['0.0s', 'Screen dims'], ['0.6s', 'Title fades up'], ['1.2s', 'Route line draws to where you fell'], ['2.0s', 'Buttons appear']], 3)}</div>`);
const SCORE = [['Stops cleared', '14', '4,200'], ['Gym badges', '3', '3,000'], ['Pokémon caught', '9', '1,350'], ['Rivals beaten', '2', '1,000'], ['Flawless wins', '5', '1,250'], ['Best streak', '5 in a row', '1,680']];
def(15, 'report', { t: 'Run Report', g: 'Run' }, () => `<div class="scr reportp">${C('hdr', 'Run Report', ['Run 13'], 'map', ['Hub', 'Run Report'])}
  <div class="rr-score pn"><b>Score</b>${SCORE.map(s => `<p><span>${s[0]}</span><u>${s[1]}</u><em>${s[2]}</em></p>`).join('')}<p class="tot"><span>Run score</span>${stars(3, 5)}<em>12,480</em></p></div>
  <div class="rr-side"><div class="rr-mvp pn" style="${tgrad(PARTY[0].ty)}"><em>Run MVP</em><i>${spr('m-6', 2)}</i><b>Charizard</b><span>11 knock-outs · never fainted</span></div>
    <div class="rr-got pn"><b>Earned</b><p>${coin()}<span>620 Bank credits</span></p><p>${spr('b-pb', 2)}<span>Trainer Tamer</span></p><p>${spr('bd-rock', .5)}<span>First Gym Badge</span></p></div></div>
  <div class="rr-btns"><div class="btn on" ${go('newrun')}><b>New Run</b></div><div class="btn" ${go('hub')}><b>Back to the Hub</b></div></div>
  ${C('keys', [['←→', 'move'], ['Enter', 'choose'], ['J', 'read the journal']])}</div>`);
def(15, 'hof', { t: 'Hall of Fame', g: 'Run' }, () => `<div class="scr res hofp" style="--c:#f2a900"><i class="glow"></i><i class="confetti"></i>
  <div class="hf-t"><small>Kanto cleared · Run 13 · 2:14:06</small><b>Hall of Fame</b></div>
  <div class="hf-row">${PARTY.slice(0, 3).map((p, i) => `<i style="--i:${i};--t:${TYC[p.ty[0]]}">${spr('m-' + p.k, fitS('m-' + p.k, 120, 110))}<u>${p.n}</u></i>`).join('')}<i class="me" style="--i:3;--t:${TRC.Red}">${spr('t-red', 3)}<u>Champion Red</u></i>${PARTY.slice(3).map((p, i) => `<i style="--i:${i + 4};--t:${TYC[p.ty[0]]}">${spr('m-' + p.k, fitS('m-' + p.k, 120, 110))}<u>${p.n}</u></i>`).join('')}</div>
  <div class="vs-say" ${mm('tb')}><p>Your team is recorded in the Hall of Fame. <b>Johto</b> is next, with a higher level cap and tougher bosses.</p>${nextBtn('region', 'On to Johto')}</div>
  ${C('tl', [['0.0s', 'Lights go out'], ['0.5s', 'Spotlights land one by one'], ['1.8s', 'Confetti and fanfare'], ['2.6s', 'Record is saved']], 2)}</div>`);
const arena14 = pick(PR.comps.arena, 14).fn;
comp(15, 'arena', (o = {}) => arena14(o) + (o.dim ? '' : ribbon('bat')));
decor(15, 'title', { cls: 'tt15', fn: h => h.replace('<small>Kanto · Stage 12 of 30</small>', `<small>Kanto · Stage 12 of 30 · Gym in 3 stops</small>${ribbon('tk')}`) });
decor(15, 'menu', { cls: 'mn15', fn: h => h.replace('<div class="rp-note"', ribbon('ph') + '<div class="rp-note"') });
decor(15, 'hub', { cls: 'hb15', fn: h => h.replace('<span>Start a fresh journey</span>', `<span>Kanto · 30 stops · 8 Gyms</span>${ribbon('pq', 0)}`).replace('<em>Trainer Card</em>', '<em>Continue · stop 12 of 30</em>') });
