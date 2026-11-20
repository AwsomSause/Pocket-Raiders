// Phantom UI: the battle screen, built from the mock-ups' `battle` page (the foe's box, the command fan round your
// Pokémon, the slanted text box, your own card) and `moves` page (the move cards with their type bands). It draws the
// New UI battle HUD's model (ui/redux/screens/battle.ts) over the canvas, which keeps the arena, the Pokémon and every
// animation, so every battle style stays as it is. Pure drawing; BattleScene keeps the rules, the input and the state.

import type { PhantomVersion } from '../../../core/presentation/phantom';
import { rxUrl } from '../../redux/assets';
import { BATTLE_LIST_ROWS, windowTitle, type BattleBox, type BattleEvolve, type BattleExp, type BattleGimmick, type BattleLevel, type BattleListModel, type BattleModel, type BattleOption, type BattlePanel } from '../../redux/screens/battle';
import { figure, scrollStart } from '../../redux/templates';
import { act, esc, keys, mon, page, TYC, ty } from '../kit';
import { phConfirm } from '../templates';

/** The canvas is 960 wide and the Phantom page 1280: a place on the field, in page units. */
const S = 4 / 3;
/** How far from the Pokémon the fan's tabs stand (battle.css draws them at this radius). */
const FAN_R = 214;
const pct = (r: number): number => Math.max(0, Math.min(100, Math.round(r * 100)));
const slash = (r: number, w = '', cls = ''): string => { const p = pct(r); return `<span class="slash ${cls}${cls === 'xp' ? '' : p <= 20 ? ' low' : p <= 50 ? ' mid' : ''}"${w ? ` style="--w:${w}"` : ''}><i style="width:${p}%"></i></span>`; };
const balls = (n: number, out: number): string => { const k = Math.max(0, Math.min(6, n)); return `<span class="ph-bt-balls" aria-label="${Math.max(0, k - out)} of ${k} left">${Array.from({ length: k }, (_, q) => `<i class="${q >= k - out ? 'out' : ''}"></i>`).join('')}</span>`; };
const tipOf = (b: BattleBox): string => (b.tip ? `${act('pin', b.tip)} data-tip="${esc(b.tip)}"` : '');
const lines = (t: string): string => esc(t).replace(/\n/g, '<br>');

/** A foe's box: the name on a black slash, its marks, the HP slash with its percent, and the Trainer's team as balls. */
const foeBox = (b: BattleBox, k: number, small: boolean): string =>
  `<div class="b3-foe ph-bt-foe${small ? ' sm' : ''}" style="top:${22 + k * 92}px" data-key="foe${k}"${tipOf(b)}><h3>${esc(b.name)} <span>${esc(b.level)}</span></h3>`
  + (b.tags.length || b.types?.length ? `<div class="r">${(b.types ?? []).map(ty).join('')}${b.tags.map((t) => `<em class="st">${esc(t)}</em>`).join('')}</div>` : '')
  + `<div class="r">${slash(b.hp, small ? '220px' : '300px')}<span class="num2">${pct(b.hp)}%</span></div>`
  + (b.weak?.length && !small ? weakRow(b.weak) : '')
  + (b.team ? `<div class="r">${balls(b.team.n, b.team.out)}</div>` : '') + '</div>';

/** The mock-ups' "Weak to" row: a badge per type that hits it super effectively, and the 4x ones named. */
const weakRow = (w: readonly { type: string; times: number }[]): string => {
  const four = w.filter((x) => x.times >= 4).map((x) => `${x.type.charAt(0).toUpperCase()}${x.type.slice(1)} ×${x.times}`);
  return `<div class="r wk"><small>Weak to</small>${w.slice(0, 6).map((x) => `<img class="px" src="${rxUrl(`packs/story/badge/${x.type}.png`)}" alt="${esc(x.type)}" style="background:${TYC[x.type] ?? '#888'}">`).join('')}${four.length ? `<small class="x4">${esc(four.join(' · '))}</small>` : ''}</div>`;
};

/** Your Pokémon's card: name, HP in numbers, the HP slash, the Exp slash, its level and marks. */
const mineBox = (b: BattleBox, k: number, small: boolean): string =>
  `<div class="m on ph-bt-m${small ? ' sm' : ''}${b.file && !small ? ' pic' : ''}" style="--i:${k}" data-key="mine${k}"${tipOf(b)}>${b.file && !small ? `<div class="pic">${mon(b.file, 0.75)}</div>` : ''}<div><b>${esc(b.name)}<span>${esc(b.hpText || b.level)}</span></b>${slash(b.hp)}`
  + (b.xp === null ? '' : slash(b.xp, '62%', 'xp'))
  + `<div class="ph-bt-mt"><u>${esc(b.level)}</u>${b.tags.map((t) => `<em>${esc(t)}</em>`).join('')}</div></div></div>`;

const GIM: Record<BattleGimmick['kind'], string> = { mega: 'Mega Evolve', tera: 'Terastallize', dynamax: 'Dynamax', zmove: 'Z-Move' };

/** A move card (mock-up `moves`): the type's band and badge, the name, and its small line (PP). */
const moveCard = (o: BattleOption, k: number, on: boolean, small: boolean, at = ''): string => {
  const t = (o.type ?? '').toLowerCase(), size = o.label.length > 16 ? 20 : o.label.length > 12 ? 24 : small ? 26 : 30;
  return `<div class="b3-m ph-bt-mv${at}${on ? ' on' : ''}${o.off ? ' off' : ''}${small ? ' sm' : ''}" style="--i:${k};--tc:${TYC[t] ?? '#888'}" data-key="mv${k}"${act('pick', k, 'over')}${o.tip ? ` data-tip="${esc(o.tip)}"` : ''}>`
    + `${on ? '<kbd>Z</kbd>' : ''}<div class="t">${t ? `<img class="px" src="${rxUrl(`packs/story/badge/${t}.png`)}" alt="${esc(t)}">` : ''}</div><h4 style="font-size:${size}px">${esc(o.label)}</h4><p>${esc(o.sub ?? '')}</p></div>`;
};

/** A plain choice (a target, an answer, a command): a slanted row; a whole sentence steps down a size. */
const choice = (o: BattleOption, k: number, on: boolean, small: boolean): string => {
  const n = o.label.length + (o.sub ? o.sub.length + 2 : 0), size = n > 30 ? 17 : n > 22 ? 20 : n > 15 ? 24 : small ? 26 : 30;
  return `<div class="ph-bt-op${on ? ' on' : ''}${o.off ? ' off' : ''}" style="--i:${k};font-size:${size}px" data-key="op${k}"${act('pick', k, 'over')}${o.tip ? ` data-tip="${esc(o.tip)}"` : ''}><b>${esc(o.label)}</b>${o.sub ? `<small>${esc(o.sub)}</small>` : ''}</div>`;
};

/** A window of the info panel, the move tooltip and the Ability card: the mock-ups' tilted paper. */
const paper = (p: BattlePanel, cls: string, attrs = ''): string =>
  `<div class="pn lt ph-bt-paper ${cls}"${attrs}><span class="lab">${esc(p.tag || 'Info')}</span><h3 class="tl1" style="font-size:${p.head.length > 18 ? 22 : 28}px">${esc(p.head)}</h3>`
  + (p.chips.length ? `<div class="ph-chips">${p.chips.map(ty).join('')}</div>` : '')
  + (p.lead ?? []).map((t) => `<p class="txt">${esc(t)}</p>`).join('')
  + p.facts.map(([a, v]) => `<div class="dm-fr"><span>${esc(a)}</span><b>${esc(v)}</b></div>`).join('')
  + p.lines.map((t) => `<p class="txt">${esc(t)}</p>`).join('') + '</div>';

/** The level-up window (mock-up `learn`'s left half): the Pokémon, the level step, and what each stat gained. */
export function phLevel(d: BattleLevel): string {
  const rows = d.stats.map(([s, n, p], k) => `<div class="dm-fr" style="--i:${k}"><span>${esc(s)}</span><b>${n}<i>${p >= 0 ? '+' : ''}${p}</i></b></div>`).join('');
  return `<div class="ph-shade" data-key="lv-shade"></div><div class="pn lt ph-bt-lv tilt" style="--r:-1.5deg" data-key="lv${d.to}"><span class="lab">Level up</span><div class="ph-bt-lvh">${d.file ? mon(d.file, 1.4, 'olk', '', true) : ''}<div><h3 class="tl1">${esc(d.name)}</h3><p class="ph-bt-lvn">Lv ${d.from}<i>▶</i><b>${d.to}</b></p></div></div>${rows}</div>`;
}

/**
 * An evolution (mock-up `evolve`): black page, the burst, the old form until the new one is out, the words under it.
 * `sil` false shows the form in colour before it changes (the evolution scene's first line); `tap`: a click anywhere moves on.
 */
export function phEvolve(d: BattleEvolve & { sil?: boolean; tap?: boolean }, text: string): string {
  const f = d.done ? d.to : d.from;
  return page('evolve', '<div class="bgk"></div><div class="burst ph-bt-evb" style="--x:50%;--y:46%" aria-hidden="true"></div>'
    + `<div class="ph-bt-ev${d.done ? ' done' : ''}" data-key="ev${d.done ? 1 : 0}">${f ? mon(f, 4.4, d.done || d.sil === false ? 'ol' : 'sil', '', true) : ''}</div>`
    + (d.done ? '<div class="ph-bt-evt" aria-hidden="true">Evolved!</div>' : '')
    + (text ? `<div class="say ph-bt-say" data-key="say">${lines(text)}</div>` : '')
    + (d.tap ? `<div class="ph-ld-any" data-key="tap"${act('next')}></div>` : ''), false);
}

const expRows = (rows: readonly BattleExp[]): string => {
  const tight = rows.length > 4;
  return `<div class="ph-bt-exp${tight ? ' sm' : ''}">${rows.map((r, k) => `<div class="pn${r.up ? ' lt' : ''}" style="--i:${k}" data-key="xp${k}">${r.file ? mon(r.file, tight ? 0.5 : 0.7) : ''}<div><b>${esc(r.name)}<span>${esc(r.text)}</span></b>${slash(r.xp, '100%', 'xp')}</div></div>`).join('')}</div>`;
};

/** The fan's angles: the tabs spread round your Pokémon, the first at the top. */
export function fanAngles(n: number, last = 22): number[] {
  // At least 17 degrees between two tabs, so a low last tab (a tall menu under the fan) pushes the first one up.
  const first = Math.min(-62, last - 17 * (n - 1));
  return Array.from({ length: n }, (_, k) => (n < 2 ? -14 : Math.round(first + (k * (last - first)) / (n - 1))));
}

export function phBattle(_ph: PhantomVersion, d: BattleModel): string {
  if (d.evolve) return phEvolve(d.evolve, d.text);
  const opts = d.menu?.options ?? [], n = opts.length, on = d.menu?.index ?? -1;
  const duo = d.foes.length > 1 || d.mine.length > 1;
  const typed = n > 0 && opts.some((o) => o.type);
  // The tray: the choices at the right (move cards two to a row, plain choices in a column or two), the words at the left.
  const cols = typed ? 2 : n > 4 ? 2 : 1, rows = Math.ceil(n / cols), small = rows > 2;
  const cellH = typed ? (small ? 62 : 84) : small ? 44 : 52, gap = typed ? (small ? 10 : 16) : 8;
  // The command menu (Fight, Bag, Pokémon...) stands in the fan round your Pokémon, as the mock-up draws it.
  const cmd = !!d.tabs && d.tabs.index < 0 && n > 0 && !typed && opts.some((o) => /^fight$/i.test(o.label));
  const cross = typed && n <= 4 && !duo && d.foes.length === 1 && d.tabs?.index === 0;
  const trayH = n && !cmd && !cross ? rows * cellH + (rows - 1) * gap : 0;
  // The Fight page of a single battle (mock-up `moves`): the field dims, up to four move cards stand on a cross,
  // and the target's card at the right says who they hit. More moves (or two foes) keep the tray below.
  const xMenu = cross ? `<div class="b3-x ph-bt-x">${opts.map((o, k) => moveCard(o, k, k === on, false, ` d${k}`)).join('')}<div class="b3-pad" aria-hidden="true"><i></i><i></i></div></div>` : '';
  const foe0 = d.foes[0];
  const target = cross && foe0 ? `<div class="pn b3-tg ph-bt-tg" data-key="tg"><span class="lab">Target</span><div class="b3-tp">${foe0.file ? mon(foe0.file, 2.2, 'ol') : ''}<div class="ring" aria-hidden="true"></div></div><h3 class="tl1">${esc(foe0.name)} <small>${esc(foe0.level)}</small></h3><div class="b3-hp" style="--hp:${foe0.hp <= 0.2 ? 'var(--red)' : foe0.hp <= 0.5 ? 'var(--gold)' : '#3fd16a'}"><i style="width:${pct(foe0.hp)}%"></i></div><p class="b3-est"><b>${pct(foe0.hp)}%</b>of its HP left</p>${d.text ? `<p class="txt">${lines(d.text)}</p>` : ''}</div>` : '';
  const menu = n && !cmd && !cross ? `<div class="ph-bt-menu${typed ? ' mvs' : ''}${cols === 2 ? ' two' : ''}" style="--h:${cellH}px;gap:${gap}px ${typed ? 22 : 10}px">${opts.map((o, k) => (typed ? moveCard(o, k, k === on, small) : choice(o, k, k === on, small))).join('')}</div>` : '';
  const len = d.text.length, size = n && !cmd ? (len > 150 ? 17 : len > 100 ? 19 : len > 44 ? 22 : 28) : len > 170 ? 19 : len > 110 ? 22 : len > 60 ? 25 : 30;
  const say = d.text && !cross ? `<div class="say ph-bt-say${n && !cmd ? ' half' : ''}${cmd ? ' cmd' : ''}" style="font-size:${size}px" data-key="say">${lines(d.text)}</div>` : '';
  // The page tabs are the mock-up's fan; Q and E step along it.
  const tabs = d.tabs;
  const fanY = Math.round((d.me?.y ?? 428) * S) - 100;
  const fanAt = `left:${Math.round((d.me?.x ?? 312) * S)}px;top:${fanY}px`;
  // A wide menu (move cards, two columns) reaches under the fan: the last tab stays clear of its top edge.
  const wide = n > 0 && !cmd && cols === 2, room = 720 - 26 - trayH - 34 - fanY;
  const last = wide ? Math.max(-12, Math.min(22, Math.round((Math.asin(Math.max(-1, Math.min(1, room / FAN_R))) * 180) / Math.PI))) : 22;
  const info = !!d.panels?.length && d.panelAt !== 'tip';
  // The key of page tab k: Q and E step through the pages (all but Auto and Info, which have their own keys).
  const keyOf = (k: number): string => {
    if (!tabs) return '';
    const m = tabs.labels.length, pages = tabs.labels.filter((x, q) => x !== 'Auto' && q < m - 1).length || m, at = tabs.index;
    return tabs.labels[k] === 'Auto' ? 'T' : k >= pages ? 'I' : k === at ? '' : k === (at < 0 ? 0 : (at + 1) % pages) ? 'E' : k === ((at < 0 ? 0 : at) + pages - 1) % pages ? 'Q' : '';
  };
  const tabItem = (k: number, a: number, i: number): string => {
    const t = tabs!.labels[k]!, auto = t === 'Auto', m = tabs!.labels.length, lit = k === tabs!.index || (auto && tabs!.auto) || (info && k === m - 1), key = keyOf(k);
    return `<div class="b3-c ph-bt-tab${lit ? ' on' : ''}${auto ? ' g' : ''}${auto && tabs!.autoOff ? ' off' : ''}" style="--a:${a}deg;--i:${i}" data-key="tab${k}"${act('tab', k)}>${key ? `<kbd>${key}</kbd>` : ''}<b>${esc(t === 'i' ? 'Info' : t)}</b>${auto ? `<small>${tabs!.auto ? 'ON' : tabs!.autoOff ? 'N/A' : 'OFF'}</small>` : ''}</div>`;
  };
  // In the command menu the fan holds Info, the commands (each with the page key that also opens it), then Auto.
  const PAGE_OF: Record<string, string> = { fight: 'Attack', 'pokémon': 'Party', bag: 'Item' };
  const fanItems = (): string => {
    const lab = tabs!.labels, infoK = lab.length - 1, autoK = lab.indexOf('Auto');
    const count = 1 + n + (autoK >= 0 ? 1 : 0), angles = fanAngles(count, 46);
    const cmds = opts.map((o, k) => {
      const page = lab.indexOf(PAGE_OF[o.label.toLowerCase()] ?? ''), key = k === on ? 'Z' : page >= 0 ? keyOf(page) : '';
      return `<div class="b3-c ph-bt-op ph-bt-cmd${k === on ? ' on' : ''}${o.off ? ' off' : ''}" style="--a:${angles[k + 1]}deg;--i:${k + 1}" data-key="op${k}"${act('pick', k, 'over')}>${key ? `<kbd>${key}</kbd>` : ''}<b>${esc(o.label)}</b>${o.sub ? `<small>${esc(o.sub)}</small>` : ''}</div>`;
    }).join('');
    return tabItem(infoK, angles[0]!, 0) + cmds + (autoK >= 0 ? tabItem(autoK, angles[n + 1]!, n + 1) : '');
  };
  const fan = tabs && !cross ? `<div class="b3-arc ph-bt-arc" style="${fanAt}" aria-hidden="true"></div><div class="b3-fan ph-bt-fan${cmd ? ' cmd' : ''}" style="${fanAt}">${cmd ? fanItems() : tabs.labels.map((_, k) => tabItem(k, fanAngles(tabs.labels.length, last)[k]!, k)).join('')}</div>` : '';
  const above = trayH ? trayH + 40 : 96;
  const gimRow = d.gim?.length || d.gimPage;
  const gim = gimRow ? `<div class="ph-bt-gims${cross ? ' x' : ''}" style="bottom:${cross ? 22 : above}px">${(d.gim ?? []).map((g, k) => `<div class="gim ph-bt-gim${g.on ? ' on' : ''}" data-key="gim${k}"${act('gim', k)}>${esc(GIM[g.kind])}${g.on ? '<small>READY</small>' : ''}</div>`).join('')}${d.gimPage ? `<div class="gim ph-bt-gim all" data-key="gimall"${act('gims')}><kbd>G</kbd>Gimmicks</div>` : ''}</div>` : '';
  const foes = cross ? '' : d.foes.map((b, k) => foeBox(b, k, duo)).join('');
  // In the command menu your card stands at the top of the stack with the rest of the party under it (mock-up `battle`).
  const bench = cmd && !duo && d.bench?.length ? d.bench.map((b, k) => `<div class="m ph-bt-bn${b.hp <= 0 ? ' out' : ''}" style="--i:${k + 1}"><div class="pic">${b.file ? mon(b.file, 0.55, '', b.hp <= 0 ? 'filter:grayscale(1)' : '') : ''}</div><div><b>${esc(b.name)}<span>${b.hp <= 0 ? 'KO' : esc(b.level)}</span></b>${slash(b.hp)}</div></div>`).join('') : '';
  const mine = d.mine.length && !cross ? `<div class="stack ph-bt-stack${bench ? ' top' : ''}"${bench ? '' : ` style="bottom:${above + (gimRow ? 62 : 0)}px"`}>${d.mine.map((b, k) => mineBox(b, k, duo)).join('')}${bench}${d.party && !duo && !bench ? `<div class="ph-bt-party">${balls(d.party.n, d.party.out)}</div>` : ''}</div>` : '';
  const ord = cmd && d.turn ? `<div class="b3-ord ph-bt-ord"><b>Turn ${d.turn}</b></div>` : '';
  // Small lines over the field. The run header gives its corner to the Exp rows, the level window and the budget.
  const rowsX = d.exp ?? [], f = d.fx ?? {};
  const level = d.level ? phLevel(d.level) : '';
  const budgetOn = !!f.budget && !level;
  const header = d.header && !rowsX.length && !level && !budgetOn && !f.variant ? `<div class="ph-bt-line hd2">${lines(d.header)}</div>` : '';
  const momentum = d.momentum && !rowsX.length && !level ? `<div class="ph-bt-line mo${duo ? ' top' : ''}">${lines(d.momentum)}</div>` : '';
  const status = d.status ? `<div class="ph-bt-line st" style="top:${duo ? 30 + d.foes.length * 92 : d.foes[0]?.team ? 196 : 164}px">${lines(d.status)}</div>` : '';
  const note = d.note ? `<div class="ph-bt-note" data-key="note:${esc(d.note.slice(0, 20))}">${esc(d.note)}</div>` : '';
  const pin = d.auto ? `<div class="gim ph-bt-auto"${act('auto')}>Auto ▶▶</div>` : '';
  const marks = (d.marks ?? []).map((m) => `<div class="ph-bt-mark" style="left:${Math.round(m.x * S)}px;top:${Math.round(m.y * S)}px">${esc(m.text)}</div>`).join('');
  const exp = rowsX.length ? expRows(rowsX) : '';
  // The info panel and the log lie over the field; a click closes the panel.
  const panels = !d.panels?.length ? ''
    : d.panelAt === 'tip' ? paper(d.panels[0]!, 'tip', `${act('info')} style="bottom:${above + 20}px"`)
      : `<div class="ph-bt-panels${d.panels.length > 3 ? ' many' : ''}"${act('info')}>${d.panels.map((p) => paper(p, 'col')).join('')}</div>`;
  const tip = d.tip && !d.panels?.length ? paper(d.tip, 'tip still', ` style="bottom:${above + 20}px" aria-hidden="true"`) : '';
  const card = d.card ? paper({ ...d.card, tag: d.card.tag || 'Ability' }, `abil${d.card.pinned ? ' pinned' : ''}`, d.card.pinned ? act('pin', '') : ' aria-hidden="true"') : '';
  const log = d.log ? `<div class="pn ph-bt-log" data-key="log"><div class="pockets ph-tabs ph-bt-logt">${d.log.tabs.map((t, k) => `<span class="${k === d.log!.index ? 'on' : ''}"${act('log', k)}>${esc(t)}</span>`).join('')}</div>${d.log.lines.length ? d.log.lines.map((l) => `<p class="txt">${esc(l)}</p>`).join('') : '<p class="txt">Nothing yet.</p>'}</div>` : '';
  // The Beta 0.6 pieces: each shows only while its rule is in play, and takes no clicks.
  const meter = (label: string, [used, max]: readonly [number, number]): string => `<div class="dm-fr"><span>${label}</span><b>${used} / ${max}</b></div>${slash(max > 0 ? Math.min(used, max) / max : 0, '100%', 'xp')}`;
  const budget = f.budget ? `<div class="pn lt ph-bt-fx bud"><span class="lab">Item budget · this battle</span>${meter('Heals', f.budget.heals)}${meter('Revives', f.budget.revives)}<p class="txt">${f.budget.heals[0] >= f.budget.heals[1] ? 'No more healing items this battle.' : 'Healing items are limited each battle.'}</p></div>` : '';
  const rally = f.rally ? `<div class="gim ph-bt-fx rally">${esc(f.rally)}</div>` : '';
  const rule = f.rule ? `<div class="pn ph-bt-fx rule"><span class="lab">${esc(f.rule.name)}</span><p class="txt">${esc(f.rule.text)}</p></div>` : '';
  const variant = f.variant && !budget ? '<div class="pn ph-bt-fx var"><p class="txt">A ring marks a variant-line Pokémon. Press <kbd>I</kbd> to read its rule.</p></div>' : '';
  const trait = f.trait ? `<div class="pn lt ph-bt-fx trait">${f.trait.file ? mon(f.trait.file, 0.7) : ''}<div><span class="lab">${esc(f.trait.name)}</span><p class="txt">${esc(f.trait.text)}</p></div></div>` : '';
  const dark = f.shadow ? `<div class="pn ph-bt-fx dark" style="bottom:${above + (gimRow ? 62 : 0)}px"><span class="lab">${esc(f.shadow.head)}</span>${f.shadow.plan ? `<p class="txt">${esc(f.shadow.plan)}</p>` : ''}</div>` : '';
  const pieces = level ? '' : budget + rally + rule + variant + trait + dark;
  const notice = d.notice ? phConfirm({ title: d.notice.title, body: d.notice.body, options: [d.notice.button], index: 0 }) : '';
  return page('battle', (d.shadow ? '<div class="ph-bt-shadow" aria-hidden="true"></div>' : '') + '<div class="frame" aria-hidden="true"></div>'
    + (cross ? `<div class="dim ph-bt-dim" aria-hidden="true"></div><div class="hd ph-bt-hd"><small>${esc(d.mine[0]?.name ?? '')}${d.turn ? ` · Turn ${d.turn}` : ''}</small>Fight</div>` : '')
    + foes + ord + fan + mine + say + menu + xMenu + target + gim + (cross ? keys(['Z', 'Use that move'], ['Q E', 'Page', 'tab', 1], ['I', 'Details', 'tab', (d.tabs?.labels.length ?? 1) - 1], ['X', 'Back', 'back']) : '') + marks + header + momentum + status + note + pin + exp + pieces + panels + tip + card + log + level + notice, false);
}

/** The battle's Party and Item windows (mock-ups `pocket` and the battle party list): a tilted list over the field's left. */
export function phBattleList(_ph: PhantomVersion, d: BattleListModel): string {
  const n = Math.max(0, d.n), index = Math.max(0, Math.min(n - 1, d.index));
  const s = scrollStart(n, index, BATTLE_LIST_ROWS), end = Math.min(n, s + BATTLE_LIST_ROWS);
  const head = windowTitle(d.title);
  const tabs = d.tabs ? `<div class="pockets ph-tabs ph-bl-tabs">${d.tabs.labels.map((t, k) => `<span class="${k === d.tabs!.index ? 'on' : ''}"${act('tab', k)}>${esc(t)}</span>`).join('')}</div>` : '';
  const rows = Array.from({ length: end - s }, (_, q) => {
    const i = s + q, r = d.row(i);
    const right = r.hp === null ? (r.tag ? `<em>${esc(r.tag.replace(/^[×x]\s*(\d+)$/, '× $1'))}</em>` : '') : `${r.tag ? `<em class="st">${esc(r.tag)}</em>` : ''}${slash(r.hp, '110px')}`;
    return `<div class="ph-bl-r${i === index ? ' on' : ''}${r.off ? ' off' : ''}" style="--i:${q}" data-key="bl${i}"${act('pick', i, 'over')}><span class="ph-bl-pic">${r.art ? figure(r.art, 40) : ''}</span><b>${esc(r.label)}</b>${right}</div>`;
  }).join('');
  const where = n > BATTLE_LIST_ROWS ? `${s + 1}–${end} of ${n}` : '';
  const foot = where || d.note || head.note || d.back ? `<div class="ph-bl-f"><span>${esc([where, d.note || head.note].filter(Boolean).join(' · '))}</span>${d.back ? `<u${act('back')}><kbd>Esc</kbd>Back</u>` : ''}</div>` : '';
  const lead = d.lead ? `<div class="ph-bl-lead">${esc(d.lead)}</div>` : '';
  return page('blist', `<div class="pn lt ph-bl${d.center ? ' mid' : ''} tilt" style="--r:-1.2deg${d.center ? '' : `;top:${Math.round((d.top ?? 92) * S)}px`}">${lead}${head.title && !d.tabs ? `<span class="lab">${esc(head.title)}</span>` : ''}${tabs}${rows}${n ? '' : '<p class="txt">Nothing here.</p>'}${foot}</div>`, false);
}
