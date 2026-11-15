// New UI Party and Summary, ported from the mock-ups' `party` and `summary` templates. Party: the team as cards
// (lead big and the rest as rows; a three-wide grid; or a list with a detail window). Summary: the Pokémon on the
// left, tabs, and one window of facts for the tab. Pure drawing; ui/pokemonMenu.ts keeps the state and the input.

import { rxUrl } from '../assets';
import { act, type Area, B, esc, facts, H, hpb, mini, mon, TX, ty, TYPE_COLORS, W } from '../kit';
import type { ReduxCtx } from '../stage';
import { pic, scrollStart, type Art } from '../templates';
import { type BattlePanel, tipWindow } from './battle';

type Hints = readonly (readonly [string, string])[];

export interface PartyCard {
  name: string;
  file: string | null;
  level: number;
  hp: number;
  maxHp: number;
  /** What it holds, in a few words ('' for nothing). */
  held: string;
  /** A short mark beside the name: LEAD, a status, or '' . */
  tag: string;
  types: string[];
  ability: string;
  nature: string;
  moves: { name: string; type: string }[];
  /** It cannot be chosen right now (a pick with a reason against it). */
  off: boolean;
}
export interface PartyModel { title: string; mons: PartyCard[]; index: number; text: string; hints: Hints; /** Header colour; the party's green unless the page belongs to another part of the game (the run end's final team). */ area?: Area }

/** How many cards the cursor moves across in the Party layout of this theme (the grid is three wide). */
export const partyCols = (c: Pick<ReduxCtx, 'v'>): number => (c.v(3) === 1 ? 3 : 1);

const pct = (p: { hp: number; maxHp: number }): number => (p.maxHp > 0 ? Math.max(0, Math.min(100, Math.round((p.hp / p.maxHp) * 100))) : 0);
const one = 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
const typeColor = (t: string): string => TYPE_COLORS[t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()] ?? '#888';
const pick = (k: number): string => `${act('pick', k)} data-over="over"`;

export function partyView(c: ReduxCtx, d: PartyModel): string {
  const v = c.v(3), head = H(d.title, d.area ?? 'party', d.hints);
  const cls = (p: PartyCard, k: number): string => (k === d.index ? 'sel' : p.hp > 0 && !p.off ? '' : 'dim');
  const tag = (p: PartyCard): string => (p.tag ? `<span class="tg no" style="font-size:11px">${esc(p.tag)}</span>` : '');
  if (d.mons.length === 0) return head + TX(esc(d.text));
  if (v === 1) {
    return head + `<div class="abs" style="left:24px;right:24px;top:74px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:18px">${d.mons.map((p, k) => W(`<div class="cell" style="height:92px;aspect-ratio:auto;background:#0000">${p.file ? mini(p.file, 86) : ''}</div><div class="row"><b class="grow" style="font-size:16px;min-width:0;${one}">${esc(p.name)}</b>${tag(p)}<span class="sm">Lv ${p.level}</span></div>${hpb(pct(p))}<span class="sm" style="${one}">${p.held ? '◆ ' + esc(p.held) : 'No item'}</span>`, 'display:flex;flex-direction:column;gap:5px;padding:8px 12px;min-width:0', cls(p, k), pick(k))).join('')}</div>` + TX(esc(d.text));
  }
  if (v === 2) {
    const p = d.mons[Math.max(0, Math.min(d.mons.length - 1, d.index))]!;
    return head + `<div class="abs col" style="left:24px;top:72px;width:400px;gap:8px">${d.mons.map((m, k) => `<div class="btn${k === d.index ? ' on' : ''}" style="height:44px${m.hp > 0 && !m.off ? '' : ';opacity:.55'}"${pick(k)}>${m.file ? mini(m.file, 36) : ''}<span class="grow" style="min-width:0;${one}">${esc(m.name)}</span>${hpb(pct(m), 80)}<small>Lv ${m.level}</small></div>`).join('')}</div><div class="abs" style="left:456px;right:26px;top:76px">${W(`<div class="row" style="align-items:flex-start;gap:14px"><div class="cell" style="width:150px;height:150px;flex:none">${p.file ? mini(p.file, 140) : ''}</div><div class="col grow" style="gap:6px;min-width:0"><b class="acc" style="font-size:22px;${one}">${esc(p.name)}</b><div class="row" style="gap:5px">${p.types.map(ty).join('')}</div>${facts([['Ability', p.ability], ['Item', p.held || 'None'], ['Nature', p.nature]])}</div></div><div class="row" style="flex-wrap:wrap;gap:6px">${p.moves.map((m) => `<span class="ty" style="--tc:${typeColor(m.type)};font-size:13px;padding:5px 9px">${esc(m.name)}</span>`).join('')}</div>`, 'display:flex;flex-direction:column;gap:12px')}</div>` + TX(esc(d.text));
  }
  const row = (p: PartyCard, k: number, big: boolean): string =>
    W(`<div class="row" style="gap:10px">${p.file ? mini(p.file, big ? 110 : 52) : ''}<div class="col grow" style="gap:5px;min-width:0"><div class="row"><b class="grow" style="font-size:${big ? 22 : 16}px;min-width:0;${one}">${esc(p.name)}</b>${big ? '' : tag(p)}<span class="sm">Lv ${p.level}</span></div>${hpb(pct(p))}<div class="row sm" style="gap:6px"><span class="grow">${p.hp > 0 ? `${p.hp} / ${p.maxHp}` : 'Fainted'}</span>${big ? tag(p) : ''}${p.held ? `<span style="max-width:62%;${one}">◆ ${esc(p.held)}</span>` : ''}</div></div></div>`, `padding:${big ? '18px 16px' : '7px 12px'}`, cls(p, k), pick(k));
  return head + `<div class="abs" style="left:24px;top:76px;width:330px">${row(d.mons[0]!, 0, true)}</div><div class="abs col" style="left:384px;right:24px;top:72px;gap:10px">${d.mons.slice(1).map((p, k) => row(p, k + 1, false)).join('')}</div>` + TX(esc(d.text));
}

/** The Pokémon on the left of the Summary. */
export interface SummaryFace {
  name: string;
  file: string | null;
  /** The backdrop picture behind it (a file with its extension), or null for a plain cell. */
  art: string | null;
  level: number;
  /** '♂', '♀' or ''. */
  gender: string;
  types: string[];
  /** "No. 006". */
  no: string;
  /** "Holding 3 items" or "Holding nothing". */
  held: string;
  hpPct: number;
  xpPct: number;
}
export type SummaryBody =
  | { kind: 'overview'; ability: { name: string; text: string } | null; facts: [string, string][]; note: string; moves: { name: string; type: string }[] }
  | { kind: 'stats'; rows: { label: string; value: number; pct: number; iv: string; ev: number; up: boolean; perfect: boolean; delta: string }[]; foot: string; versus: string }
  | { kind: 'moves'; moves: { name: string; type: string; pp: string }[]; cursor: number; facts: [string, string][]; lines: string[] }
  | { kind: 'items'; summary: string; items: { name: string; art: Art | null; mode: string; text: string }[]; cursor: number; lines: string[]; takeOff: boolean }
  | { kind: 'text'; head: string; bars: { label: string; value: number }[]; sections: { title: string; lines: string[]; side?: boolean }[] };
export interface SummaryModel {
  title: string;
  hints: Hints;
  face: SummaryFace;
  tabs: readonly string[];
  tab: number;
  /** The tab whose button on the left card lights up (Items). */
  itemsTab: number;
  body: SummaryBody;
  text: string;
  /** The action menu over the screen (Make lead, Care…), or null. */
  menu: { options: { label: string; off: boolean }[]; index: number } | null;
  /** The tooltip of the move the pointer rests on (the mock-ups' move tooltip for any menu), or null. */
  tip?: BattlePanel | null;
}

const lines = (l: readonly string[], st = ''): string => l.map((t) => `<div class="sm" style="line-height:18px;${st}">${esc(t)}</div>`).join('');

function bodyOf(b: SummaryBody): string {
  if (b.kind === 'overview') return `<b class="acc">${esc(b.ability?.name ?? 'No ability')}</b>${b.ability ? `<div class="sm" style="line-height:20px">${esc(b.ability.text)}</div>` : ''}${facts(b.facts)}${b.note ? `<div class="sm" style="line-height:18px">${esc(b.note)}</div>` : ''}<div class="row" style="flex-wrap:wrap;gap:6px">${b.moves.map((m, k) => `<span class="ty" style="--tc:${typeColor(m.type)};font-size:13px;padding:4px 9px" data-tip="move:${k}">${esc(m.name)}</span>`).join('')}</div>`;
  if (b.kind === 'stats') {
    return `<div class="row sm" style="font-weight:700"><span style="width:90px">Stat</span><span style="width:42px">Value</span><span class="grow"></span><span style="width:34px">IV</span><span style="width:40px">EV</span>${b.versus ? '<span style="width:40px;text-align:right">±</span>' : ''}</div>${b.rows.map((r) => `<div class="row"><span style="width:90px;white-space:nowrap" class="${r.up ? 'acc' : ''}">${esc(r.label)}${r.up ? ' ▲' : ''}</span><b style="width:42px">${r.value}</b>${hpb(Math.max(0, Math.min(100, r.pct)), 0, ' gold')}<span style="width:34px" class="${r.perfect ? 'acc' : ''}">${esc(r.iv)}</span><span style="width:40px">${r.ev}</span>${b.versus ? `<b style="width:40px;text-align:right">${esc(r.delta)}</b>` : ''}</div>`).join('')}<div class="row sm"><span class="grow" style="line-height:18px">${esc(b.foot)}</span></div>${b.versus ? `<div class="sm">${esc(b.versus)}</div>` : ''}`;
  }
  if (b.kind === 'moves') {
    if (b.moves.length === 0) return '<div class="sm">No moves.</div>';
    return `${b.moves.map((m, k) => `<div class="btn mv${k === b.cursor ? ' on' : ''}" style="--tc:${typeColor(m.type)};height:36px;flex:none"${act('cursor', k)}><span class="grow">${esc(m.name)}</span><small>PP ${esc(m.pp)}</small></div>`).join('')}${facts(b.facts)}${lines(b.lines)}`;
  }
  if (b.kind === 'items') {
    if (b.items.length === 0) return `<div class="sm">${esc(b.summary)}</div><div style="line-height:22px">This Pokémon holds nothing. Held items come from drafts, shops and events.</div>`;
    const from = scrollStart(b.items.length, b.cursor, 4);
    return `<div class="row sm"><span class="grow">${esc(b.summary)}</span>${b.items.length > 4 ? `<span>${from + 1}–${Math.min(b.items.length, from + 4)} of ${b.items.length}</span>` : ''}${b.takeOff ? `<span class="tg" style="cursor:pointer"${act('takeoff')}>Take off</span>` : ''}</div>${b.items.slice(from, from + 4).map((it, q) => { const k = from + q, on = k === b.cursor; return `<div class="row" style="gap:10px;align-items:flex-start;cursor:pointer"${act('cursor', k)}>${pic(it.art, on ? 40 : 28)}<div class="col grow" style="gap:2px;min-width:0"><div class="row"><b class="grow${on ? ' acc' : ''}">${esc(it.name)}</b><span class="sm">${esc(it.mode)}</span></div>${on ? lines(b.lines) : `<span class="sm" style="${one}">${esc(it.text)}</span>`}</div></div>`; }).join('')}`;
  }
  const bars = b.bars.length ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 18px">${b.bars.map((x) => `<div class="row sm"><span style="width:92px;${one}">${esc(x.label)}</span>${hpb(Math.max(0, Math.min(100, x.value)), 0, ' gold')}<b style="width:26px;text-align:right">${x.value}</b></div>`).join('')}</div>` : '';
  const sec = (s: { title: string; lines: string[] }): string => `<div class="col" style="gap:2px"><b class="sm acc">${esc(s.title)}</b>${lines(s.lines)}</div>`;
  const main = b.sections.filter((s) => !s.side), side = b.sections.filter((s) => s.side);
  const cols = side.length ? `<div class="row" style="align-items:flex-start;gap:18px"><div class="col grow" style="gap:8px;flex-basis:0">${main.map(sec).join('')}</div><div class="col grow" style="gap:8px;flex-basis:0">${side.map(sec).join('')}</div></div>` : main.map(sec).join('');
  return (b.head ? `<b>${esc(b.head)}</b>` : '') + bars + cols;
}

export function summaryView(c: ReduxCtx, d: SummaryModel): string {
  const v = c.v(2), f = d.face;
  const backdrop = f.art ? `background:url(${rxUrl(f.art)}) 50% 60%/cover;image-rendering:pixelated` : '';
  const left = W(`<div class="cell" style="height:170px;aspect-ratio:auto;flex:none;${backdrop}">${f.file ? mon(f.file, 2, '', true) : ''}</div><div class="row"><b class="grow" style="font-size:21px;min-width:0;${one}">${esc(f.name)}</b><span class="sm">Lv ${f.level}${f.gender ? ' ' + esc(f.gender) : ''}</span></div><div class="row" style="gap:5px">${f.types.map(ty).join('')}<span class="grow"></span><span class="sm">${esc(f.no)}</span></div><div class="btn${d.tab === d.itemsTab ? ' on' : ''}" style="height:34px;font-size:14px;cursor:pointer"${act('tab', d.itemsTab)}>${esc(f.held)}<small>open</small></div>${hpb(f.hpPct)}${hpb(f.xpPct, 0, ' xp')}`, `position:absolute;left:24px;top:${v ? 74 : 72}px;width:280px;display:flex;flex-direction:column;gap:8px`);
  const tabs = v
    ? `<div class="abs col" style="right:24px;top:74px;width:120px;gap:6px">${d.tabs.map((t, k) => B(esc(t), k === d.tab, 'height:32px;font-size:14px;padding:0 10px', '', act('tab', k))).join('')}</div>`
    : `<div class="abs tabs" style="left:332px;top:62px">${d.tabs.map((t, k) => `<span class="${k === d.tab ? 'on' : ''}" style="cursor:pointer"${act('tab', k)}>${esc(t)}</span>`).join('')}</div>`;
  const body = W(bodyOf(d.body), `position:absolute;left:332px;right:${v ? 160 : 24}px;top:${v ? 74 : 102}px;max-height:${v ? 372 : 344}px;overflow:hidden;display:flex;flex-direction:column;gap:8px`);
  let menu = '';
  if (d.menu) {
    const n = d.menu.options.length, size = 9, from = scrollStart(n, d.menu.index, size);
    menu = `<div class="shade" style="z-index:8"${act('menuBack')}></div>` + W(`${d.menu.options.slice(from, from + size).map((o, q) => B(esc(o.label), from + q === d.menu!.index, `height:32px;font-size:15px;flex:none${o.off ? ';opacity:.5' : ''}`, '', `${act('menu', from + q)} data-over="menuOver"`)).join('')}${n > size ? `<span class="sm" style="text-align:right">${from > 0 ? '▲ ' : ''}${d.menu.index + 1} of ${n}${from + size < n ? ' ▼' : ''}</span>` : ''}`, 'position:absolute;left:350px;top:84px;width:270px;display:flex;flex-direction:column;gap:5px;padding:12px;z-index:9');
  }
  // With the action menu open the text box stays lit: it explains the focused action.
  return H(d.title, 'party', d.hints) + left + tabs + body + TX(esc(d.text), '', d.menu ? 'z-index:9' : '') + menu + (d.tip && !d.menu ? tipWindow(d.tip) : '');
}
