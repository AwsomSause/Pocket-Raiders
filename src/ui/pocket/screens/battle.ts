// The Pocket look's battle HUD (mock-up pages `battle` and `fight`, Final Cut): the foe's plate along the top with its
// HP and its trainer's balls, the status strip under it, your plate along the bottom with the Exp edge, and over it
// either the command buttons (Fight, Bag, Pokémon, Auto, Info) or the four move cards in your Pokémon's colours. What
// is said sits in the speech panel at the left. It lies over the canvas, which keeps the arena, the Pokémon and every
// animation (the animations thread). It draws what BattleScene's rxTick hands it (ui/redux/screens/battle.ts); the
// scene keeps the rules, the input and the state. Presentation only.

import { BATTLE_LIST_ROWS, type BattleBox, type BattleListModel, type BattleModel, type BattleOption, type BattlePanel } from '../../redux/screens/battle';
import { gridStart, scrollStart } from '../../redux/templates';
import { ballArt, badgeArt, itemArt, monArt } from '../art';
import { act, esc, frontRotom, hpc, page, spr, typeColour } from '../kit';
import { fit, fitBody, fitPic, pkArtOf, pkConfirm } from '../templates';
import { tyChip } from './party';
import { pkWeather } from './sky';
import { pkCatchParts, pkLevel } from './after';
import { pkGaCrowd, pkGaInfo, pkTmAura } from './galar';

const pct = (r: number): number => Math.max(0, Math.min(100, Math.round(r * 100)));
const hpBar = (r: number): string => `<span class="hp ${hpc(pct(r))}"><i style="width:${pct(r)}%"></i></span>`;
/** A plate's colours: its Pokémon's two types, or the side's own colour while they are not known. */
const plateStyle = (b: BattleBox, side: string): string => {
  const t = b.types ?? [];
  return `--sc:${side};--t:${t[0] ? typeColour(t[0]) : side};--t2:${t[1] ? typeColour(t[1]) : t[0] ? typeColour(t[0]) : side}`;
};
const balls = (n: number, out: number): string => `<span class="balls">${Array.from({ length: Math.max(0, Math.min(6, n)) }, (_, k) => spr(ballArt(k >= n - out ? 'premier' : 'pb'), 1, k >= n - out ? 'gx-bt-out' : '')).join('')}</span>`;
const nameRow = (b: BattleBox, big: number, tag = ''): string => `<span class="lb-n">${(b.types ?? []).map((t) => fitPic(badgeArt(t), 20, 20, '', 1)).join('')}<b style="font-size:${fit(b.name, 180, big, 16, 0.55)}px">${esc(b.name)}</b><span class="lv">${esc(b.level)}</span>${b.shiny ? '<em class="shtag">★ Shiny</em>' : ''}${tag ? `<em class="gymtag">${esc(tag)}</em>` : ''}${powerTag(b)}${b.tags.filter((t) => !(b.power?.kind === 'tera' && /^tera /i.test(t))).map((t) => `<u class="gx-bt-tag">${esc(t)}</u>`).join('')}</span>`;
/** The power a Pokémon has used, as the mock-up's tag (`b-power`): Mega, Tera with its type, Max with turns left as pips, Z. */
const powerTag = (b: BattleBox): string => {
  const p = b.power;
  if (!p) return '';
  const pips = p.kind === 'dmax' && p.turns ? `<i class="pips">${Array.from({ length: 3 }, (_, i) => `<u class="${i < p.turns! ? '' : 'off'}"></u>`).join('')}</i>` : '';
  return `<em class="gtag ${p.kind}" title="${p.kind === 'dmax' ? `${p.turns} ${p.turns === 1 ? 'turn' : 'turns'} left` : p.kind === 'z' ? 'Z-Move spent' : 'All battle'}">${esc(p.text)}</em>${pips}`;
};
const tipAttr = (b: BattleBox): string => (b.tip ? `${act('pin', b.tip)} data-tip="${esc(b.tip)}"` : '');

/** A foe's plate (the first one along the top; more stand under it in a duo or a trio). */
function foePlate(b: BattleBox, k: number, tag = ''): string {
  return `<div class="lb top${k ? ' gx-bt-more' : ''}" style="${plateStyle(b, '#2a75bb')}${k ? `;top:${k * 60}px` : ''}" data-key="bt-foe-${k}"${tipAttr(b)}>${nameRow(b, 30, tag)}<span class="lb-hp"><em>HP</em>${hpBar(b.hp)}<span class="num">${pct(b.hp)}%</span></span><span class="lb-o gx-bt-o">${b.team ? balls(b.team.n, b.team.out) : ''}</span></div>`;
}

/** "Lv 12": the next level for the Exp line. */
const nextLv = (level: string): string => { const m = /(\d+)/.exec(level); return m ? `Lv ${Number(m[1]) + 1}` : 'next level'; };

/** Your plate's top line: name, HP numbers, the Exp to the next level and your party's balls. */
function mePlate(b: BattleBox, party: BattleModel['party'], k: number): string {
  const xp = b.xp === null ? '' : `<span class="tonext">EXP ${pct(b.xp)}% to ${esc(nextLv(b.level))}</span>`;
  return `<div class="lb-me${k ? ' gx-bt-ally' : ''}" data-key="bt-me-${k}"${tipAttr(b)}>${nameRow(b, 26)}<span class="lb-hp"><em>HP</em>${hpBar(b.hp)}<span class="num">${esc(b.hpText.replace(/\s*\/\s*/, '/'))}</span></span><span class="lb-o">${k ? '' : xp}${!k && party ? balls(party.n, party.out) : ''}</span></div>`;
}

/** "Flamethrower" with "PP 12/15 · Special": the move card's lines. */
function moveCard(o: BattleOption, k: number, on: boolean): string {
  const t = o.type ? typeColour(o.type) : '#56627f';
  const bits = (o.sub ?? '').split(/\s+·\s+|\s{2,}/).filter(Boolean);
  return `<div class="mv3${on ? ' on' : ''}${o.off ? ' gx-bt-off' : ''}" style="--t:${t}" data-key="bt-mv-${k}"${act('pick', k, 'over')}${o.tip ? ` data-tip="${esc(o.tip)}"` : ''}>${o.type ? fitPic(badgeArt(o.type), 18, 18, 'gx-bt-ty', 1) : ''}<b style="font-size:${fit(o.label, 170, 22, 14, 0.55)}px">${esc(o.label)}</b><span class="mv-r">${bits.map((x) => `<i>${esc(x)}</i>`).join('')}</span></div>`;
}

/** Any other choice (a target, an answer in the middle of a fight, Run): a plain button in the bar. */
const optButton = (o: BattleOption, k: number, on: boolean): string =>
  `<div class="btn${on ? ' on' : ''}${o.off ? ' gx-bt-off' : ''}" data-key="bt-o-${k}"${act('pick', k, 'over')}${o.tip ? ` data-tip="${esc(o.tip)}"` : ''}><b style="font-size:${fit(o.label, 180, 16, 11, 0.55)}px">${esc(o.label)}</b>${o.sub ? `<small>${esc(o.sub)}</small>` : ''}</div>`;

/** The page tabs as the mock-up's command buttons: Fight (Attack), Bag (Item), Pokémon (Party), Auto, Info. */
const CMD: Record<string, readonly [string, string]> = { Attack: ['Fight', '#e8452b'], Party: ['Pokémon', '#e3350d'], Item: ['Bag', '#e8791a'], Auto: ['Auto', '#56627f'], Info: ['Info', '#2a75bb'], i: ['Info', '#2a75bb'] };
function commands(tabs: NonNullable<BattleModel['tabs']>, small: boolean): string {
  const b = tabs.labels.map((t, k) => {
    const [word, colour] = CMD[t] ?? [t, '#56627f'];
    const on = k === tabs.index || (t === 'Auto' && tabs.auto);
    return `<div class="cw${on ? ' on' : ''}${t === 'Auto' && tabs.autoOff ? ' gx-bt-off' : ''}" style="--a:${colour}" data-key="bt-tab-${k}"${act('tab', k)}><b>${esc(word)}</b><kbd>${k + 1}</kbd></div>`;
  }).join('');
  return small ? `<div class="gx-bt-tabs" data-key="bt-tabs">${b}</div>` : `<div class="cmd17" data-key="bt-cmd">${b}</div>`;
}

/** A window of the info panel, a move's details or an Ability card. */
const panel = (p: BattlePanel, cls: string, extra = ''): string =>
  `<div class="pn gx-bt-pn ${cls}"${extra}><div class="gx-bt-ph"><b>${esc(p.head)}</b>${p.chips.map(tyChip).join('')}${p.tag ? `<u>${esc(p.tag)}</u>` : ''}</div>${(p.lead ?? []).map((t) => `<strong>${esc(t)}</strong>`).join('')}${p.facts.map(([l, v]) => `<p><span>${esc(l)}</span><em>${esc(v)}</em></p>`).join('')}${p.lines.map((t) => `<small>${esc(t)}</small>`).join('')}</div>`;

/** A Battle Info side card (mock-up `b-info`): the Pokémon, its types, Ability, held item, status and stat stages. */
function infoSide(x: NonNullable<NonNullable<BattleModel['pkInfo']>['foe']>, file: string | null, cls: 'foe' | 'me'): string {
  const t = x.types.map(typeColour);
  return `<div class="in-side ${cls}" style="--t:${t[0] ?? '#56627f'};--t2:${t[1] ?? t[0] ?? '#56627f'}" data-key="in-${cls}"><div class="in-h"><i>${file ? fitPic(monArt(file), 56, 52, '', 2) : ''}</i><div><b style="font-size:${fit(x.name, 180, 28, 16, 0.6)}px">${esc(x.name)}</b><span>${esc(x.sub)}</span></div></div><div class="in-ty">${x.types.map(tyChip).join('')}</div>`
    + `<dl><dt>Ability</dt><dd>${esc(x.ability)}</dd><dt>Held item</dt><dd style="font-size:${fit(x.held, 160, 14, 10, 0.55)}px">${esc(x.held)}</dd><dt>Status</dt><dd>${esc(x.status)}</dd></dl>`
    + `<div class="in-stg">${x.stages.map(([w, n]) => `<span class="stg${n > 0 ? ' up' : n < 0 ? ' dn' : ''}"><em>${esc(w)}</em><b>${n > 0 ? '+' : ''}${n}</b></span>`).join('')}</div>${x.note ? `<p style="font-size:${fit(x.note, 240, 13, 10, 0.55)}px">${esc(x.note)}</p>` : ''}</div>`;
}

/** Battle Info (mock-up `b-info`): the foe, the four field cards, your Pokémon, then Battle Log or Back. */
function infoPage(d: NonNullable<BattleModel['pkInfo']>): string {
  const hidden = '<div class="in-side foe gx-in-hid" data-key="in-foe"><div class="in-h"><i></i><div><b>???</b><span>Hidden until it moves</span></div></div></div>';
  const mid = `<div class="in-mid" data-key="in-mid">${d.mid.map((c, k) => `<div class="in-c${k === 0 && c.b !== 'Clear' ? ' w' : ''}"${k === 0 ? act('pkWeather') : ''}><em>${esc(c.em)}</em><b style="font-size:${fit(c.b, 110, 26, 14, 0.6)}px">${esc(c.b)}</b><span style="font-size:${fitBody(c.span, 170, 48, [12, 11, 10], 1.3)}px">${esc(c.span)}</span></div>`).join('')}</div>`;
  const foot = `<div class="in-foot" data-key="in-foot"><div class="btn on"${act('pkLog')}><b>Battle Log</b></div><div class="btn"${act('info')}><b>Back</b></div></div>`;
  return `<i class="gx-bt-dim" data-nocheck${act('info')}></i><div class="gp-h gx-gp" data-key="in-head"><b>Battle Info</b><span>Everything in play this turn. Looking here does not use your turn.</span></div>${d.foe ? infoSide(d.foe, d.foeFile, 'foe') : hidden}${mid}${d.me ? infoSide(d.me, d.meFile, 'me') : ''}${foot}${keys2([['Esc', 'back', 'info']])}`;
}

/** The move card (mock-up `moveinfo`): the move's numbers on its type colour and how it fares against the foe. */
function movePage(m: NonNullable<BattleModel['pkMove']>): string {
  const t = typeColour(m.type);
  const card = `<div class="mi-card" style="--t:${t}" data-key="mi-card"><i class="gx-mi-badge">${fitPic(badgeArt(m.type), 96, 96, '', 3)}</i><small>Move</small><b style="font-size:${fit(m.name, 420, 60, 30, 0.6)}px">${esc(m.name)}</b><div class="mi-row">${tyChip(m.type)}<span>${esc(m.category)}</span><span>${m.contact ? 'Contact' : 'No contact'}</span></div><div class="mi-nums"><div><span>Power</span><b>${esc(m.power)}</b></div><div><span>Accuracy</span><b>${esc(m.accuracy)}</b></div><div><span>PP</span><b>${esc(m.pp)}</b></div></div><p style="font-size:${fitBody(m.text, 330, 110, [16, 15, 14, 13, 12], 1.35)}px">${esc(m.text)}</p></div>`;
  const v = m.vs;
  const mult = (n: number): string => `× ${Number.isInteger(n) ? n : n.toFixed(2).replace(/0$/, '')}`;
  const vs = v
    ? `<b style="font-size:${fit(`Against ${v.foe}`, 350, 30, 18, 0.6)}px">Against ${esc(v.foe)}</b><div class="mult"><span>${tyChip(m.type)} into ${v.foeTypes.map(tyChip).join('')}</span><b class="${v.mult > 1 ? 'good' : v.mult < 1 ? 'bad' : ''}">${mult(v.mult)}</b></div>${v.stab ? `<div class="mult"><span>Same type as ${esc(v.user)}</span><b class="good">× 1.5</b></div>` : ''}<p>${esc(v.word)}</p>`
    : `<b>No damage</b><p>${m.category === 'Status' ? 'A status move: it does not hit for damage.' : 'The foe is hidden until it moves.'}</p>`;
  return `<i class="gx-bt-dim" data-nocheck${act('info')}></i>${card}<div class="mi-vs pn" data-key="mi-vs">${vs}<div class="row"><div class="btn on"${act('pkUse')}><b>Use it</b></div><div class="btn"${act('info')}><b>Back</b></div></div></div>`;
}

/** The Battle Log (mock-up `b-log`): what was said, newest at the bottom, the filter tabs and the turn so far. */
function logPage(l: NonNullable<BattleModel['log']>, turn: number): string {
  const rows = l.lines.length ? l.lines.map((x) => `<div class="lg-r gx-lg-row"><b>${esc(x)}</b></div>`).join('') : '<div class="lg-r gx-lg-row"><b>Nothing here yet.</b></div>';
  const list = `<div class="lg-list" data-key="lg-list"><div class="lg-t now"><em>Turn ${Math.max(1, turn)}</em>${rows}</div></div>`;
  const sum = `<div class="lg-sum" data-key="lg-sum"><b>Show</b><span class="gx-lg-seg">${l.tabs.map((t, k) => `<i class="${k === l.index ? 'on' : ''}"${act('log', k)}><kbd>${k + 1}</kbd>${esc(t)}</i>`).join('')}</span><dl><dt>Turn</dt><dd>${Math.max(1, turn)}</dd><dt>Lines</dt><dd>${l.lines.length}</dd></dl><div class="btn on"${act('logClose')}><b>Back to battle</b></div></div>`;
  return `<i class="gx-bt-dim" data-nocheck${act('logClose')}></i><div class="gp-h gx-gp" data-key="lg-head"><b>Battle Log</b><span>What happened so far, newest at the bottom.</span></div>${list}${sum}${keys2([['1-5', 'filter'], ['H', 'close', 'logClose']])}`;
}

const WXI: Record<string, string> = { Rain: 'rain', Sun: 'sun', Sand: 'sand', Hail: 'snow', Snow: 'snow', Clear: 'clear' };
/** The battle Status page (mock-up `b-status`): turn order, weather, money, the event's goal, your bench, the foe's team so far. */
function statusPage(d: NonNullable<BattleModel['pkStatus']>): string {
  const mons = (ms: NonNullable<BattleModel['pkStatus']>['bench'], bars: boolean): string => ms.map((m) => `<i class="${m.ko ? 'ko' : ''}" title="${esc(m.name)}">${m.file ? fitPic(monArt(m.file), 38, 34, '', 1) : '<b>?</b>'}${bars ? `<s><u style="width:${Math.round(Math.max(0, Math.min(1, m.hp)) * 100)}%"></u></s>` : ''}</i>`).join('');
  const order = d.order.map((o, k) => `<p><i>${k + 1}</i>${esc(o.name)} <u>Speed ${o.speed}</u></p>`).join('') || '<p>Hidden until it moves</p>';
  const w = d.weather;
  const cards = [
    `<div><b>Turn order</b>${order}${d.trickRoom ? '<p>Trick Room: the slower one goes first.</p>' : ''}</div>`,
    `<div class="gx-st-go"${act('pkWeather')}><b>Weather</b><p>${WXI[w.b] ? `<i class="wxi ${WXI[w.b]}"></i>` : ''}${esc(w.b)}</p><p style="font-size:${fitBody(w.span, 180, 40, [13, 12, 11], 1.35)}px">${esc(w.span)}</p></div>`,
    `<div><b>This battle</b><p>Turn ${d.turn}</p>${d.money ? `<p>${spr(itemArt('amulet_coin'), 0.5)}${esc(d.money)} in your pocket</p>` : ''}</div>`,
    d.event ? `<div><b style="font-size:${fit(d.event.name, 180, 20, 13, 0.6)}px">${esc(d.event.name)}</b><p>${esc(d.event.goal)}</p><p>${esc(d.event.left)}</p></div>` : '<div><b>Events</b><p>No event on right now.</p></div>',
    `<div class="wide"><b>Your bench</b><span>${mons(d.bench, true) || '<em>No one else in your party</em>'}</span></div>`,
    `<div class="wide"><b style="font-size:${fit(d.foeName, 360, 20, 13, 0.6)}px">${esc(d.foeName)}</b><span>${mons(d.foes, false) || '<em>Hidden until it moves</em>'}${d.unseen ? `<em>${d.unseen} more not seen yet</em>` : ''}</span></div>`,
  ].join('');
  const foot = `<div class="in-foot" data-key="st-foot"><div class="btn on"${act('pkInfoOpen')}><b>Battle Info</b></div><div class="btn"${act('pkLog')}><b>Battle Log</b></div><div class="btn"${act('info')}><b>Back</b></div></div>`;
  return `<i class="gx-bt-dim" data-nocheck${act('info')}></i><div class="gp-h gx-gp" data-key="st-head"><b>Status</b><span>Everything the one-line bar folds away. Looking here does not use your turn.</span></div><div class="stg23" data-key="st-grid">${cards}</div>${foot}${keys2([['I', 'battle info', 'pkInfoOpen'], ['H', 'battle log', 'pkLog'], ['Esc', 'back', 'info']])}`;
}

/** A keys bar for the battle pages. */
const keys2 = (ks: readonly (readonly [string, string, string?])[]): string => `<div class="keys k20 gx-bt-keys">${ks.map(([k, w, a]) => `<span${a ? act(a) : ''}><kbd>${esc(k)}</kbd>${esc(w)}</span>`).join('')}</div>`;

export function pkBattle(d: BattleModel): string {
  // Pocket pages over the battle: Battle Info, a move's card, the Battle Log (the arena stays drawn underneath).
  if (d.pkInfo && !d.evolve) return page('b-info', 26, `<div class="scr battle b6 ov16 inf gx-bt gx-bt-page" data-key="b-info">${infoPage(d.pkInfo)}</div>`, true);
  if (d.pkGaInfo && !d.evolve) return d.pkGaInfo.aura ? pkTmAura(d.pkGaInfo.aura) : d.pkGaInfo.crowdPage ? pkGaCrowd(d.pkGaInfo.crowdPage) : pkGaInfo(d.pkGaInfo);
  if (d.pkWeather && !d.evolve) return pkWeather({ ...d.pkWeather, crumb: ['Battle', 'Weather'], road: null }, { pick: 'pkWx', back: 'info' });
  if (d.pkStatus && !d.evolve) return page('b-status', 26, `<div class="scr battle b6 ov16 st23p gx-bt gx-bt-page" data-key="b-status">${statusPage(d.pkStatus)}</div>`, true);
  if (d.pkMove && !d.evolve) return page('moveinfo', 26, `<div class="scr battle b2 minfo gx-bt gx-bt-page" data-key="moveinfo">${movePage(d.pkMove)}</div>`, true);
  if (d.log && !d.evolve) return page('b-log', 26, `<div class="scr battle b6 ov16 lg gx-bt gx-bt-page" data-key="b-log">${logPage(d.log, d.turn ?? 0)}</div>`, true);
  if (d.level && !d.evolve && !d.menu) return pkLevel({ ...d.level, types: d.level.types ?? [], say: d.text, go: 'say' });
  if (d.evolve) {
    const pic = (f: string | null, sil: boolean): string => (f ? `<span class="${sil ? 'gx-sil' : ''}">${fitPic(monArt(f), 200, 200, '', 4)}</span>` : '');
    return page('battle', 26, `<div class="scr battle gx-bt gx-bt-evo" data-key="battle"><i class="gx-bt-burst"></i><div class="gx-bt-evo-pics">${pic(d.evolve.from, d.evolve.done)}<b>→</b>${pic(d.evolve.to, !d.evolve.done)}</div>${d.text ? `<div class="say17 gx-bt-say"><i>${spr(frontRotom, 1)}</i><p>${esc(d.text)}</p></div>` : ''}</div>`, true);
  }
  const opts = d.menu?.options ?? [], on = d.menu?.index ?? -1;
  const moves = opts.length > 0 && opts.every((o) => !!o.type);
  const me = d.mine[0];
  // Your plate along the bottom, and what stands in its row: the move cards, other choices, or nothing.
  let row = '';
  if (moves) {
    const gim = d.gim?.length ? `<div class="pwt" data-key="bt-gim"${act('gim', d.gim.findIndex((g) => g.on) >= 0 ? d.gim.findIndex((g) => g.on) : 0)}><div><b>${esc(d.gim.map((g) => ({ mega: 'Mega', tera: 'Tera', dynamax: 'Dynamax', zmove: 'Z-Move' })[g.kind]).join(' / '))}</b><span>${d.gim.some((g) => g.on) ? 'Armed' : 'Ready'}</span></div></div>` : '';
    row = `${gim}<div class="moves${opts.length > 4 ? ' gx-bt-many' : ''}" data-key="bt-moves">${opts.map((o, k) => moveCard(o, k, k === on)).join('')}</div>`;
  } else if (opts.length) {
    row = `<div class="gx-bt-opts${opts.length > 4 ? ' gx-bt-many' : ''}" data-key="bt-opts">${opts.map((o, k) => optButton(o, k, k === on)).join('')}</div>`;
  }
  const allies = d.mine.slice(1).map((b, k) => mePlate(b, null, k + 1)).join('');
  const bot = me || row
    ? `<div class="lb bot${row ? '' : ' gx-bt-low'}" style="${me ? plateStyle(me, '#e3350d') : '--sc:#e3350d;--t:#e3350d;--t2:#e3350d'}" data-key="bt-bot">${me && me.xp !== null ? `<i class="xpedge"><u style="width:${pct(me.xp)}%"></u></i>` : ''}${allies}${me ? mePlate(me, d.party, 0) : ''}${row ? `<div class="lb-row">${row}</div>` : ''}</div>`
    : '';
  const cmd = d.tabs ? commands(d.tabs, moves || opts.length > 0) : '';
  // The run header as the status strip under the foe's plate: "Stage 1 · Candlelit Wishes · Level 1/30 · ₽0".
  const parts = d.header.split(/\s*·\s*|\n/).map((x) => x.trim()).filter(Boolean);
  const money = parts.find((x) => /^₽/.test(x)), rest = parts.filter((x) => x !== money);
  const strip = parts.length ? `<div class="bar23 gx-bt-bar" ${d.foes.length > 1 ? ` style="top:${d.foes.length * 60 + 36}px"` : ''} data-key="bt-bar"${act('pkStatus')}><b>${esc(rest[0] ?? '')}</b><span>${esc(rest.slice(1).join(' · '))}</span>${money ? `<i>${esc(money)}</i>` : ''}<em>More</em></div>` : '';
  const lines = [d.status, d.momentum].filter(Boolean).map((t) => `<p>${esc(t)}</p>`).join('');
  const side = lines ? `<div class="gx-bt-lines" style="top:${Math.max(1, d.foes.length) * 60 + 70 + (d.pkBoss ? 160 : 0)}px">${lines}</div>` : '';
  const say = d.text ? `<div class="say17 gx-bt-say${row ? ' gx-up' : ''}" data-key="bt-say"><i>${me?.file ? fitPic(monArt(me.file), 42, 42, '', 1) : spr(frontRotom, 1)}</i><p style="font-size:${fitBody(d.text, 520, 76, [20, 18, 16, 15, 14], 1.25)}px">${esc(d.text).replace(/\n/g, '<br>')}</p></div>` : '';
  const note = d.note ? `<div class="gx-bt-note"><span>${esc(d.note)}</span></div>` : '';
  const pin = d.auto ? `<div class="gx-bt-auto"${act('auto')}><b>AUTO ▶▶</b></div>` : '';
  const marks = (d.marks ?? []).map((m) => `<u class="gx-bt-mark" style="left:${Math.round(m.x)}px;top:${Math.round(m.y)}px">${esc(m.text)}</u>`).join('');
  const exp = d.exp?.length ? `<div class="gx-bt-exp" data-key="bt-exp">${d.exp.map((r) => `<div class="pn${r.up ? ' on' : ''}">${r.file ? fitPic(monArt(r.file), 40, 36, '', 1) : ''}<div><p><b>${esc(r.name)}</b><span>${esc(r.text)}</span></p><span class="xp"><i style="width:${pct(r.xp)}%"></i></span></div></div>`).join('')}</div>` : '';
  const level = d.level ? `<div class="gx-shade"></div><div class="pn gx-bt-level" data-key="bt-level"><div class="gx-bt-lvh">${d.level.file ? fitPic(monArt(d.level.file), 64, 60, '', 2) : ''}<div><b>${esc(d.level.name)}</b><span>Lv ${d.level.from} → ${d.level.to}</span></div></div>${d.level.stats.map(([s, n, p]) => `<p><span>${esc(s)}</span><b>${n}</b><em>${p >= 0 ? '+' : ''}${p}</em></p>`).join('')}</div>` : '';
  const panels = d.panels?.length
    ? d.panelAt === 'tip' ? panel(d.panels[0]!, 'gx-bt-tip', act('info')) : `<div class="gx-bt-panels${d.panels.length > 3 ? ' gx-many' : ''}"${act('info')}>${d.panels.map((p) => panel(p, '')).join('')}</div>`
    : '';
  const tip = d.tip && !d.panels?.length ? panel(d.tip, 'gx-bt-tip gx-still') : '';
  const card = d.card && !d.panels?.length && !d.log && !d.level ? panel(d.card, `gx-bt-card${d.card.pinned ? '' : ' gx-still'}`, d.card.pinned ? act('pin', '') : '') : '';
  const log = d.log ? `<div class="pn gx-bt-log" data-key="bt-log"><div class="gx-bt-logt">${d.log.tabs.map((t, k) => `<span class="${k === d.log!.index ? 'on' : ''}"${act('log', k)}>${esc(t)}</span>`).join('')}</div>${d.log.lines.length ? d.log.lines.map((l) => `<small>${esc(l)}</small>`).join('') : '<small class="gx-dim">Nothing here yet.</small>'}</div>` : '';
  const f = d.fx ?? {};
  const meter = (label: string, [used, max]: readonly [number, number]): string => `<p><span>${label}</span><span class="hp ${used >= max ? 'low' : 'ok'}"><i style="width:${max > 0 ? Math.round((Math.min(used, max) / max) * 100) : 0}%"></i></span><b>${used} / ${max}</b></p>`;
  const fx = [
    f.budget ? `<div class="pn gx-bt-fx gx-bt-budget"><b>Item budget <small>this battle</small></b>${meter('Heals', f.budget.heals)}${meter('Revives', f.budget.revives)}<small>${f.budget.heals[0] >= f.budget.heals[1] ? 'No healing items are left for this battle.' : `Healing item ${f.budget.heals[1] + 1} is refused.`} Bosses and rivals get the same budget.</small></div>` : '',
    f.rally ? `<div class="gx-bt-rally"><b>${esc(f.rally)}</b></div>` : '',
    f.rule ? `<div class="pn gx-bt-fx gx-bt-rule"><b>${esc(f.rule.name)}</b><small>${esc(f.rule.text)}</small></div>` : '',
    f.variant && !f.budget ? '<div class="pn gx-bt-fx gx-bt-variant"><small>A ring marks a variant-line Pokémon. Press <kbd>I</kbd> to read its rule.</small></div>' : '',
    f.trait ? `<div class="pn gx-bt-fx gx-bt-trait">${f.trait.file ? fitPic(monArt(f.trait.file), 40, 40, '', 1) : ''}<div><small>Signature trait · ${esc(f.trait.name)}</small><b>${esc(f.trait.text)}</b></div></div>` : '',
    f.shadow ? `<div class="pn gx-bt-fx gx-bt-shadow"><b>${esc(f.shadow.head)}</b>${f.shadow.plan ? `<small>${esc(f.shadow.plan)}</small>` : ''}</div>` : '',
  ].join('');
  const bp = d.pkBoss, cap = (t: string): string => t.charAt(0).toUpperCase() + t.slice(1);
  const POWER: Record<string, string> = { mega: 'mega_bracelet', tera: 'tera_orb', dynamax: 'dynamax_band', zmove: 'z_ring' };
  const boss = bp ? `<div class="boss18" data-key="bt-boss"><b style="font-size:${fit(bp.name, 210, 22, 15, 0.5)}px">${esc(bp.name)}</b>`
    + (bp.power ? `<p><em>Boss power</em><i class="bp">${fitPic(itemArt(POWER[bp.power.kind] ?? 'mega_bracelet'), 24, 22, '', 1)}</i><span>${bp.power.ready ? 'Ready' : 'Used'}</span></p>` : '')
    + `<p><em>Heals left</em><i class="hl">${Array.from({ length: Math.min(8, bp.heals[1]) }, (_, k) => `<u class="${k < bp.heals[0] ? 'on' : ''}"></u>`).join('')}</i><span>${bp.heals[0]} of ${bp.heals[1]}</span></p>`
    + (bp.badge ? `<p><em>Badge</em><i class="bp">${fitPic(badgeArt(bp.badge), 32, 32, '', 1)}</i><span>${esc(cap(bp.badge))}</span></p>` : '') + '</div>' : '';
  const ar = d.pkArea;
  const area = ar ? `<div class="gx-bt-area ar28 a-${ar.key} ms39" data-key="bt-area"><div class="st38 k-${ar.key}"><i class="emb28 ${ar.key} hud" data-nocheck></i><b>${esc(ar.word)}</b>${ar.bar !== undefined ? `<i class="fav37"${act('gaCrowd')}><s style="width:${Math.max(0, Math.min(100, ar.bar))}%"></s></i>` : ''}${ar.chips.map(([b, t]) => `<span class="n40"><b>${esc(b)}</b>${esc(t)}</span>`).join('')}${ar.key === 'ga' ? `<u${act('gaInfo')}>Match info</u>` : ar.key === 'tm' ? `<u${act('tmAura')}>The aura</u>` : `<u${act('pkInfoOpen')}><kbd>I</kbd> Info</u>`}</div>`
    + `<div class="fw50" data-m="flow">${ar.flow.map((t, k) => `<i class="${k < ar.step ? 'past' : k === ar.step ? 'on' : ''}">${esc(t)}</i>`).join('')}</div></div>` : '';
  const notice = d.notice ? pkConfirm({ title: d.notice.title, body: d.notice.body, options: [d.notice.button], index: 0 }) : '';
  const quiet = !!(d.exp?.length || d.level || f.budget || f.variant);
  return page(bp ? 'boss-battle' : 'battle', 26, `<div class="scr b20 battle b6 b7 b16 b17 gx-bt${bp ? ' bb18' : ''}${d.pkCatch ? ' capp' : ''}${d.pkBand ? ' evs' : ''}${d.shadow ? ' gx-bt-shadow' : ''}${d.foes.length > 1 ? ' gx-bt-duo' : ''}" data-key="battle">`
    + d.foes.map((b, k) => foePlate(b, k, k === 0 && bp ? bp.tag : '')).join('') + (quiet ? '' : strip) + (quiet ? '' : boss) + (quiet ? '' : area) + (d.exp?.length || d.level ? '' : side) + bot + cmd + say + note + pin + marks
    + (d.level ? '' : fx + exp) + level + panels + tip + card + log + notice + (d.pkCatch ? pkCatchParts(d.pkCatch) : '') + (d.pkBand ? `<div class="evs-band" data-key="evs-band"><em>${esc(d.pkBand.em)}</em><b style="font-size:${fit(d.pkBand.b, 380, 36, 22, 0.5)}px">${esc(d.pkBand.b)}</b><span>${esc(d.pkBand.span)}</span></div>` : '') + '</div>', true);
}

/** "×3" as the mock-ups write a count. */
const countText = (t: string): string => t.replace(/^[×x]\s*(\d+)$/, '× $1');

/** The battle Bag's tiles stand three across, three rows deep (mock-up `b-bag`). */
export const PK_BAG_COLS = 3;
export const PK_BAG_SIZE = 9;
/** A list is the Bag's tile grid when its rows are items, not Pokémon, and it is not a map stop's quick choice. */
export const isBagList = (d: Pick<BattleListModel, 'n' | 'row' | 'center'>): boolean => !d.center && d.n > 0 && d.row(0).hp === null;

/**
 * The battle's Party and Item windows (mock-ups `b-switch`, `b-bag`), and a map stop's quick choice. The party stands
 * as pills down the left with the lit one large on a card at the right; the Bag is pocket tabs over a grid of tiles
 * with the lit item's card at the right; a quick choice is one window in the middle. `sheet` is a summary laid over it.
 */
export function pkBattleList(d: BattleListModel, sheet: string | null = null): string {
  const n = Math.max(0, d.n), index = Math.max(0, Math.min(n - 1, d.index));
  const over = sheet === null ? '' : `<div class="gx-shade hit"${act('back')}></div><div class="pn gx-bl-sheet"${act('back')}><p>${esc(sheet).replace(/\n/g, '<br>')}</p><small>Press I, Enter or Esc to go back to the list</small></div>`;
  const cur = n ? d.row(index) : null;
  if (cur && !d.center && cur.hp !== null) {
    const s = scrollStart(n, index, BATTLE_LIST_ROWS), end = Math.min(n, s + BATTLE_LIST_ROWS);
    const rows = Array.from({ length: end - s }, (_, q) => {
      const i = s + q, r = d.row(i), a = pkArtOf(r.art), t = r.types ?? [];
      const fnt = r.hp !== null && r.hp <= 0;
      const tag = r.tag ? (r.tag === 'FNT' ? 'Fainted' : r.tag) : fnt ? 'Fainted' : '';
      return `<div class="sw btn typed${i === index ? ' on' : ''}${fnt ? ' fnt' : ''}${r.off ? ' gx-bl-off' : ''}" style="--t:${typeColour(t[0])};--t2:${typeColour(t[1] ?? t[0])}" data-key="bl-${i}"${act('pick', i, 'over')}><div class="sw-r">${a ? fitPic(a, 74, 81, 'pc-s', 2) : '<i class="gx-bl-nopic"></i>'}<b style="font-size:${fit(r.label, 116, 18, 12, 0.55)}px">${esc(r.label)}</b>${t.map((x) => fitPic(badgeArt(x), 20, 20, 'medal', 1)).join('')}${r.level ? `<span class="lv">Lv ${r.level}</span>` : ''}${hpBar(r.hp ?? 0)}${tag ? `<em class="hint" style="font-size:${fit(tag, 120, 13, 10, 0.55)}px">${esc(tag)}</em>` : ''}</div></div>`;
    }).join('');
    const a = pkArtOf(cur.art), t = cur.types ?? [];
    const go = /switch|send|swap/i.test(d.title) ? 'Send out' : 'Choose';
    const where = n > BATTLE_LIST_ROWS ? `<small class="gx-bl-where">${s + 1}–${end} of ${n}</small>` : '';
    const side = `<div class="sw-pick pn typed-card" style="--t:${typeColour(t[0])};--t2:${typeColour(t[1] ?? t[0])}" data-key="bl-side">${a ? fitPic(a, 117, 138, '', 3) : ''}<b style="font-size:${fit(cur.label, 280, 24, 15, 0.55)}px">${esc(cur.label)}</b><div>${t.map(tyChip).join('')}</div>${d.hint ? `<p style="font-size:${fitBody(d.hint, 280, 40, [13, 12, 11, 10], 1.3)}px">${esc(d.hint)}</p>` : ''}${cur.off && d.why ? `<small class="gx-bl-why">${esc(d.why)}</small>` : ''}<div class="row"><div class="btn on${cur.off ? ' gx-bl-off' : ''}"${act('pick', index)}><b>${go}</b></div>${d.back ? `<div class="btn"${act('back')}><b>Back</b></div>` : ''}</div></div>`;
    return page('b-switch', 26, `<div class="scr battle b2 bsw gx-bl-scr" data-key="b-list"><i class="gx-bl-dim"></i><div class="sw-list" data-key="bl">${rows}</div>${where}${side}${over}</div>`, true);
  }
  if (cur && isBagList(d)) {
    const s = gridStart(n, index, PK_BAG_SIZE, PK_BAG_COLS), end = Math.min(n, s + PK_BAG_SIZE);
    const labels = d.tabs?.labels ?? [d.title || 'Bag'], on = d.tabs?.index ?? 0;
    const tabs = `<div class="bb-tabs" data-key="bl-tabs">${labels.map((t, k) => `<div class="btn${k === on ? ' on' : ''}"${d.tabs ? act('tab', k) : ''}><b>${esc(t)}</b></div>`).join('')}${d.back ? `<div class="btn back"${act('back')}><b>Back</b></div>` : ''}</div>`;
    const tiles = Array.from({ length: end - s }, (_, q) => {
      const i = s + q, r = d.row(i), a = pkArtOf(r.art);
      return `<div class="it pn${i === index ? ' on' : ''}${r.off ? ' gx-bl-off' : ''}" data-key="bl-${i}"${act('pick', i, 'over')}>${a ? fitPic(a, 64, 64, '', 2) : '<i class="gx-bl-nopic"></i>'}<b style="font-size:${fit(r.label, 160, 15, 11, 0.55)}px">${esc(r.label)}</b>${r.tag ? `<span class="num">${esc(countText(r.tag))}</span>` : ''}</div>`;
    }).join('');
    const a = pkArtOf(cur.art);
    const where = n > PK_BAG_SIZE ? `<small class="gx-bl-where gx-bl-bagw">${s + 1}–${end} of ${n}</small>` : '';
    const side = `<div class="bb-use pn" data-key="bl-side"><b style="font-size:${fit(cur.label, 290, 22, 15, 0.55)}px">${esc(cur.label)}</b>${d.hint ? `<p style="font-size:${fitBody(d.hint, 290, 42, [14, 13, 12, 11], 1.35)}px">${esc(d.hint)}</p>` : ''}<div class="bb-t">${a ? fitPic(a, 111, 111, '', 3) : ''}<div><b>In your Bag</b><span>${esc(cur.tag ? countText(cur.tag) : '× 1')}</span>${cur.off && d.why ? `<small class="gx-bl-why">${esc(d.why)}</small>` : ''}</div></div><div class="btn on${cur.off ? ' gx-bl-off' : ''}"${act('pick', index)}><b>Use</b></div></div>`;
    return page('b-bag', 26, `<div class="scr battle b2 bbag gx-bl-scr" data-key="b-list"><i class="gx-bl-dim"></i>${tabs}<div class="bb-grid" data-key="bl">${tiles}</div>${where}${side}${over}</div>`, true);
  }

  const s = scrollStart(n, index, BATTLE_LIST_ROWS), end = Math.min(n, s + BATTLE_LIST_ROWS);
  const tabs = d.tabs ? `<div class="gx-bl-tabs">${d.tabs.labels.map((t, k) => `<span class="${k === d.tabs!.index ? 'on' : ''}"${act('tab', k)}>${esc(t)}</span>`).join('')}</div>` : '';
  const rows = Array.from({ length: end - s }, (_, q) => {
    const i = s + q, r = d.row(i), a = pkArtOf(r.art);
    const right = r.hp === null ? (r.tag ? `<em>${esc(countText(r.tag))}</em>` : '') : `${r.tag ? `<u>${esc(r.tag)}</u>` : ''}${hpBar(r.hp)}`;
    return `<div class="gx-bl-r${i === index ? ' on' : ''}${r.off ? ' gx-bt-off' : ''}" data-key="bl-${i}"${act('pick', i, 'over')}><i>${a ? fitPic(a, 34, 30, '', 1) : ''}</i><b style="font-size:${fit(r.label, 150, 15, 11, 0.55)}px">${esc(r.label)}</b>${right}</div>`;
  }).join('');
  const where = n > BATTLE_LIST_ROWS ? `${s + 1}–${end} of ${n}` : '';
  const foot = where || d.note || d.back ? `<div class="gx-bl-foot"><span>${esc([where, d.note].filter(Boolean).join(' · '))}</span>${d.back ? `<span class="gx-bl-back"${act('back')}><kbd>Esc</kbd> back</span>` : ''}</div>` : '';
  const lead = d.lead ? `<b class="gx-bl-lead">${esc(d.lead)}</b>` : '';
  const title = d.title && !d.tabs ? `<b class="gx-bl-t">${esc(d.title)}</b>` : '';
  return page('b-list', 26, `<div class="scr battle gx-bt gx-bl-scr" data-key="b-list"><div class="pn gx-bl${d.center ? ' gx-mid' : ''}" style="top:${d.top ?? 96}px" data-key="bl">${tabs}${lead}${title}${rows}${n ? '' : '<small class="gx-dim">Nothing here.</small>'}${foot}</div>${over}</div>`, true);
}
