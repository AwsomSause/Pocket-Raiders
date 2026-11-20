// Phantom UI: Party and Summary, built from the mock-ups' `party` (six slanted cards) and `summary` (the Pokémon on
// its burst, cut-out name, the six-point stat chart, fact cards, move chips, the team along the bottom) pages. They
// take the same models as the New UI views in ../../redux/screens/party.ts; ui/pokemonMenu.ts keeps the state and
// the input. Presentation only.

import type { PhantomVersion } from '../../../core/presentation/phantom';
import type { BattlePanel } from '../../redux/screens/battle';
import type { PartyCard, PartyModel, SummaryBody, SummaryModel } from '../../redux/screens/party';
import { pic as rxPic, scrollStart } from '../../redux/templates';
import { act, esc, mon, page, ransom, TYC, ty } from '../kit';
import { phHead, phKeys } from '../templates';

const pct = (p: { hp: number; maxHp: number }): number => (p.maxHp > 0 ? Math.max(0, Math.min(100, Math.round((p.hp / p.maxHp) * 100))) : 0);
const bar = (p: number, w: number, cls = ''): string => `<span class="slash ${cls} ${cls ? '' : p <= 20 ? 'low' : p <= 50 ? 'mid' : ''}" style="--w:${w}px"><i style="width:${p}%"></i></span>`;
const tc = (t: string): string => TYC[t.toLowerCase()] ?? '#888';

/** The Party: the team as slanted cards two wide, and the lit Pokémon's ability, nature, item and moves beside them. */
export function phParty(_ph: PhantomVersion, d: PartyModel): string {
  const head = phHead(d.title, d.area === 'end' ? 'Results' : 'Party', 'onred');
  const back = '<div class="bgr"></div><div class="burst" style="--x:90%;--y:20%" aria-hidden="true"></div><div class="dots" aria-hidden="true"></div><div class="shard" style="--cp:polygon(0 0,100% 0,100% 16%,0 30%);inset:0" aria-hidden="true"></div>';
  const say = d.text ? `<div class="pn ph-say ph-say-p" data-key="t${d.index}"><p class="txt">${esc(d.text)}</p></div>` : '';
  if (d.mons.length === 0) return page('party', back + head + say + phKeys(d.hints));
  const card = (p: PartyCard, k: number): string => {
    const ko = p.hp <= 0 && p.line === undefined;
    const life = p.line !== undefined ? `<span class="ph-line">${esc(p.line)}</span>` : ko ? '<span class="stamp" style="position:static;font-size:22px;border-width:4px;transform:rotate(-4deg)">Fainted</span>' : `${bar(pct(p), 190)}<span class="num2">${p.hp}/${p.maxHp}</span>`;
    return `<div class="pc ph-pc${k === d.index ? ' on' : ''}${ko ? ' ko' : ''}${p.off ? ' off' : ''}" style="--i:${k}" data-key="p${k}"${act('pick', k, 'over')}><div class="pic${k === d.index ? ' ph-float' : ''}">${p.file ? mon(p.file, 1.5, k === d.index ? 'olk' : 'ol', ko ? 'filter:grayscale(1)' : '', k === d.index) : ''}</div><div><h4 style="font-size:${p.name.length > 12 ? 24 : p.name.length > 9 ? 29 : 34}px">${esc(p.name)}<span>Lv.${p.level}</span></h4><div class="r">${p.types.map(ty).join('')}</div><div class="r">${life}</div>${p.held ? `<div class="r ph-held">◆ ${esc(p.held)}</div>` : ''}</div>${p.tag ? `<span class="tag" style="left:14px;top:8px">${esc(p.tag)}</span>` : ''}</div>`;
  };
  const cur = d.mons[Math.max(0, Math.min(d.mons.length - 1, d.index))]!;
  const side = `<div class="pn lt ph-pside tilt" style="--r:1.5deg" data-key="s${d.index}"><span class="lab">${esc(cur.name)}</span>${cur.ability ? `<div class="dm-fr"><span>Ability</span><b>${esc(cur.ability)}</b></div>` : ''}${cur.nature ? `<div class="dm-fr"><span>Nature</span><b>${esc(cur.nature)}</b></div>` : ''}<div class="dm-fr"><span>Holds</span><b>${esc(cur.held || 'Nothing')}</b></div><div class="ph-mvs">${cur.moves.map((m) => `<span style="--tc:${tc(m.type)}">${esc(m.name)}</span>`).join('')}</div></div>`;
  return page('party', back + head + `<div class="pcards ph-pcards n${Math.min(6, d.mons.length)}">${d.mons.map(card).join('')}</div>` + side + say + phKeys(d.hints));
}

/** The six-point chart: HP at the top, then Attack, Defense, Speed, Sp. Def, Sp. Atk clockwise (the mock-up's order). */
function radar(rows: { label: string; value: number; pct: number; up: boolean }[]): string {
  const order = [0, 1, 2, 5, 4, 3].map((k) => rows[k]!), cx = 200, cy = 200, R = 140;
  const at = (k: number, r: number): [number, number] => { const a = (-90 + k * 60) * (Math.PI / 180); return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
  const ring = (f: number): string => `<polygon class="web" points="${order.map((_, k) => at(k, R * f).map((n) => n.toFixed(1)).join(',')).join(' ')}"></polygon>`;
  const val = order.map((r, k) => at(k, R * (0.18 + 0.82 * Math.max(0, Math.min(100, r.pct)) / 100)).map((n) => n.toFixed(1)).join(',')).join(' ');
  const text = order.map((r, k) => { const [x, y] = at(k, R + 36); const ty2 = k === 0 ? y - 2 : k === 3 ? y + 8 : y; return `<text x="${x.toFixed(1)}" y="${(ty2 - 8).toFixed(0)}"${r.up ? ' class="up"' : ''}>${esc(r.label.toUpperCase())}${r.up ? ' ▲' : ''}</text><text class="n" x="${x.toFixed(1)}" y="${(ty2 + 16).toFixed(0)}">${r.value}</text>`; }).join('');
  return `<svg class="radar" viewBox="-40 0 480 400">${ring(1)}${ring(0.66)}${ring(0.33)}${order.map((_, k) => { const [x, y] = at(k, R); return `<line class="axis" x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"></line>`; }).join('')}<polygon class="val" points="${val}"></polygon>${text}</svg>`;
}

const kv = (k: number, small: string, big: string, p = ''): string => `<div class="kv" style="--i:${k}"><small>${esc(small)}</small><b>${big}</b>${p ? `<p>${esc(p)}</p>` : ''}</div>`;
const lines = (l: readonly string[]): string => l.map((t) => `<p class="txt">${esc(t)}</p>`).join('');

function body(b: SummaryBody): string {
  if (b.kind === 'overview') {
    return `<div class="sm-side ph-sm-wide">${kv(0, 'Ability', esc(b.ability?.name ?? 'No ability'), b.ability?.text ?? '')}${b.facts.map(([a, v], k) => kv(k + 1, a, esc(v))).join('')}</div>`
      + (b.note ? `<div class="pn ph-sm-note"><p class="txt">${esc(b.note)}</p></div>` : '')
      + `<div class="sm-moves ph-sm-moves">${b.moves.map((m, k) => `<span style="--tc:${tc(m.type)}" data-tip="move:${k}">${esc(m.name)}</span>`).join('')}</div>`;
  }
  if (b.kind === 'stats') {
    const chart = b.rows.length === 6 ? radar(b.rows) : '';
    return chart + `<div class="sm-side ph-sm-stats${chart ? '' : ' wide'}"><div class="ph-sth"><span>Stat</span><span>IV</span><span>EV</span>${b.versus ? '<span>±</span>' : ''}</div>${b.rows.map((r, k) => `<div class="kv ph-st${r.up ? ' up' : ''}" style="--i:${k}"><span>${esc(r.label)}${chart ? '' : ` <b>${r.value}</b>`}</span><span class="${r.perfect ? 'best' : ''}">${esc(r.iv)}</span><span>${r.ev}</span>${b.versus ? `<span>${esc(r.delta)}</span>` : ''}</div>`).join('')}</div>`
      + `<div class="pn ph-sm-note low"><p class="txt">${esc(b.foot)}</p>${b.versus ? `<p class="txt">${esc(b.versus)}</p>` : ''}</div>`;
  }
  if (b.kind === 'moves') {
    if (b.moves.length === 0) return '<div class="pn ph-sm-note"><p class="txt">No moves.</p></div>';
    return `<div class="ph-sm-list">${b.moves.map((m, k) => `<div class="ch ph-mv${k === b.cursor ? ' on' : ''}" style="--i:${k};--tc:${tc(m.type)}" data-key="m${k}"${act('cursor', k)}><kbd>${k + 1}</kbd><b>${esc(m.name)}</b><span>${esc(m.type.toUpperCase())} · PP ${esc(m.pp)}</span></div>`).join('')}</div>`
      + `<div class="pn lt ph-sm-info" data-key="i${b.cursor}"><span class="lab">${esc(b.moves[b.cursor]?.name ?? 'Move')}</span>${b.facts.map(([a, v]) => `<div class="dm-fr"><span>${esc(a)}</span><b>${esc(v)}</b></div>`).join('')}${lines(b.lines)}</div>`;
  }
  if (b.kind === 'items') {
    if (b.items.length === 0) return `<div class="pn ph-sm-note"><span class="lab">${esc(b.summary)}</span><p class="txt">This Pokémon holds nothing. Held items come from drafts, shops and events.</p></div>`;
    const from = scrollStart(b.items.length, b.cursor, 5);
    return `<div class="ph-sm-list items"><div class="ph-sm-sum"><span>${esc(b.summary)}</span>${b.items.length > 5 ? `<span>${from + 1}–${Math.min(b.items.length, from + 5)} of ${b.items.length}</span>` : ''}${b.takeOff ? `<em${act('takeoff')}>Take off</em>` : ''}</div>${b.items.slice(from, from + 5).map((it, q) => { const k = from + q; return `<div class="it ph-it2${k === b.cursor ? ' on' : ''}" style="--i:${q}" data-key="h${k}"${act('cursor', k)}>${rxPic(it.art, 40) || '<i></i>'}<div>${esc(it.name)}</div><span>${esc(it.mode)}</span></div>`; }).join('')}</div>`
      + `<div class="pn lt ph-sm-info" data-key="i${b.cursor}"><span class="lab">${esc(b.items[b.cursor]?.name ?? 'Item')}</span>${b.lines.length ? lines(b.lines) : `<p class="txt">${esc(b.items[b.cursor]?.text ?? '')}</p>`}</div>`;
  }
  const sec = (s: { title: string; lines: string[] }): string => `<div class="ph-sec"><span class="lab">${esc(s.title)}</span>${lines(s.lines)}</div>`;
  const main = b.sections.filter((s) => !s.side), side = b.sections.filter((s) => s.side);
  const bars = b.bars.length ? `<div class="ph-bars">${b.bars.map((x) => `<div><span>${esc(x.label)}</span>${bar(Math.max(0, Math.min(100, x.value)), 150, 'xp')}<b>${x.value}</b></div>`).join('')}</div>` : '';
  const heavy = b.sections.reduce((n, s) => n + s.lines.reduce((m, l) => m + Math.ceil(l.length / 46) + 0, 1), 0);
  return `<div class="pn ph-sm-text${heavy > 26 ? ' xs' : heavy > 18 ? ' sm' : ''}">${b.head ? `<h3 class="tl1">${esc(b.head)}</h3>` : ''}${bars}<div class="ph-cols${side.length ? ' two' : ''}"><div>${main.map(sec).join('')}</div>${side.length ? `<div>${side.map(sec).join('')}</div>` : ''}</div></div>`;
}

/** The move tooltip while the pointer rests on a move chip. */
export const phTip = (p: BattlePanel, cls = ''): string =>
  `<div class="pn lt ph-tip ${cls}" aria-hidden="true"><span class="lab">${esc(p.tag ?? 'Move')}</span><h3 class="tl1">${esc(p.head)}</h3><div class="ph-chips">${p.chips.map(ty).join('')}</div>${(p.lead ?? []).map((t) => `<p class="txt">${esc(t)}</p>`).join('')}${p.facts.map(([a, v]) => `<div class="dm-fr"><span>${esc(a)}</span><b>${esc(v)}</b></div>`).join('')}${lines(p.lines)}</div>`;

/** The Summary: the Pokémon, its name in cut-out letters, the tabs, and the open tab's facts. */
export function phSummary(_ph: PhantomVersion, d: SummaryModel): string {
  const f = d.face, n = d.tabs.length;
  let menu = '';
  if (d.menu) {
    const m = d.menu, size = 8, from = scrollStart(m.options.length, m.index, size);
    menu = `<div class="ph-shade"${act('menuBack')}></div><div class="ph-smenu" data-key="menu">${m.options.slice(from, from + size).map((o, q) => `<div class="blade${from + q === m.index ? ' on' : ''}${o.off ? ' off' : ''}" style="--i:${q};--sh:#000;--r:${-4 + (q % 3) * 1.5}deg"${act('menu', from + q, 'menuOver')}>${esc(o.label)}</div>`).join('')}${m.options.length > size ? `<span class="ph-more2" style="position:static">${m.index + 1} of ${m.options.length}</span>` : ''}</div>`;
  }
  return page('summary', '<div class="bgr"></div><div class="burst" style="--x:20%;--y:50%" aria-hidden="true"></div><div class="dots" aria-hidden="true"></div><div class="shard" style="--cp:polygon(40% 0,100% 0,100% 100%,36% 100%);inset:0" aria-hidden="true"></div>'
    + `<div class="sm-pic" data-key="pic${esc(f.name)}"><div>${f.file ? mon(f.file, 3.4, 'ol', '', true) : ''}</div></div><div class="sm-name" style="font-size:${f.name.length > 11 ? 40 : f.name.length > 8 ? 50 : 64}px" data-key="n${esc(f.name)}">${ransom(f.name.toUpperCase(), f.name.length * 7 + 3)}</div><div class="sm-lv">Lv.${f.level}${f.gender ? ` ${esc(f.gender)}` : ''}</div>`
    + `<div class="ph-face"><div class="ph-chips">${f.types.map(ty).join('')}<span class="ph-no">${esc(f.no)}</span></div><div class="ph-fb"><small>HP</small>${bar(Math.max(0, Math.min(100, f.hpPct)), 230)}</div><div class="ph-fb"><small>EXP</small>${bar(Math.max(0, Math.min(100, f.xpPct)), 230, 'xp')}</div><div class="ph-held2${d.tab === d.itemsTab ? ' on' : ''}"${act('tab', d.itemsTab)}>◆ ${esc(f.held)}</div></div>`
    + `<div class="sm-tabs ph-sm-tabs${n > 6 ? ' many' : n > 4 ? ' some' : ''}">${d.tabs.map((t, k) => `<span class="${k === d.tab ? 'on' : ''}"${act('tab', k)}>${esc(t)}</span>`).join('')}</div>`
    + `<div class="ph-sm-body k-${d.body.kind}" data-key="b${d.tab}">${body(d.body)}</div>`
    + (d.text ? `<div class="pn ph-say ph-say-sm${d.menu ? ' top' : ''}" data-key="t"><p class="txt">${esc(d.text)}</p></div>` : '')
    + phKeys(d.hints) + menu + (d.tip && !d.menu ? phTip(d.tip) : ''));
}
