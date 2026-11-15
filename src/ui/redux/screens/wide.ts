// New UI wide-format pages, ported from the mock-ups' `wide` template (redux-06.js): the Breather, the Blackout's
// anchors, the Convoy's road, the Colossus blueprint plate, the Front's lanes and the Debate. Pure drawing:
// FormatScene keeps the cursor and reads everything from the running format's state and card (core/formats).

import { act, B, bg, esc, facts, H, hpb, mini, TX, W } from '../kit';
import type { ReduxCtx } from '../stage';
import { figure, type Art } from '../templates';

export interface WideOption {
  label: string;
  /** A hint on the right of the button, or why it is closed. */
  sub: string;
  locked: boolean;
}

/** One of your Pokémon on a strip: its picture, name, HP in percent and a short note under the bar. */
export interface WideChip { name: string; file: string | null; hp: number; note: string }

interface WideBase {
  title: string;
  /** The picture behind the page (a file of the pack) and the colour laid over it. */
  art: string | null;
  shade: string;
  options: readonly WideOption[];
  index: number;
  text: string;
}

export interface BreatherBody {
  kind: 'breather';
  party: readonly WideChip[];
  /** The fainted Pokémon that can come back, in the order of the options; empty when nobody is down or the rest is over. */
  down: readonly { file: string | null; name: string; sub: string }[];
  /** What the left window says when there is nobody to pick. */
  note: string;
  room: { title: string; text: string; facts: readonly (readonly [string, string])[] };
}
export interface BlackoutBody {
  kind: 'blackout';
  /** Each anchor; `option` is its place in the options (null once it has fallen). */
  anchors: readonly { name: string; art: Art | null; /** A nameless guard: drawn as a black shape. */ dark: boolean; state: string; fallen: boolean; option: number | null }[];
  seal: { title: string; count: string; text: string };
}
export interface ConvoyBody {
  kind: 'convoy';
  caption: string;
  legs: readonly { name: string; note: string; state: 'done' | 'now' | 'ahead' }[];
  party: readonly WideChip[];
}
export interface FrontBody {
  kind: 'front';
  lanes: readonly { name: string; sub: string; foe: string | null; foeHp: number; you: string | null; youHp: number; won: boolean }[];
}
export interface DebateBody {
  kind: 'debate';
  who: { art: Art | null; name: string; sub: string; won: number; of: number; score: string };
  claim: { tag: string; text: string };
  /** The dimmed window under the choices (what comes next), or null. */
  next: { tag: string; text: string } | null;
}
export interface PlateBody {
  kind: 'plate';
  mon: string | null;
  name: string;
  plate: { title: string; rows: readonly (readonly [string, number])[]; note: string };
  lines: readonly string[];
}
export interface PlainBody { kind: 'plain'; lines: readonly string[] }

export type WideModel = WideBase & { body: BreatherBody | BlackoutBody | ConvoyBody | FrontBody | DebateBody | PlateBody | PlainBody };

const hit = (k: number): string => `${act('pick', k)} data-over="over"`;
const strip = (party: readonly WideChip[], st: string, notes: boolean): string =>
  `<div class="abs row" style="gap:8px;justify-content:center;${st}">${party.map((p) => W(`${p.file ? mini(p.file, 40, p.hp <= 0 ? 'sil' : '') : ''}<div class="col grow" style="gap:4px;min-width:0"><span style="font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(p.name)}</span>${hpb(p.hp)}${notes ? `<span style="font-size:11px" class="${p.note ? 'acc' : ''}">${esc(p.note || '—')}</span>` : ''}</div>`, `flex:1;max-width:${party.length < 4 ? 220 : 400}px;min-width:0;display:flex;align-items:center;gap:6px;padding:5px 8px`)).join('')}</div>`;
const pips = (n: number, of: number): string => `<span style="flex:none">${Array.from({ length: of }, (_, k) => `<i style="display:inline-block;width:12px;height:12px;border-radius:50%;margin-right:4px;background:${k < n ? 'var(--acc)' : '#0000'};box-shadow:0 0 0 2px var(--tf)"></i>`).join('')}</span>`;
/** A choice as a button: its hint sits on the right; a closed one is dimmed. */
const button = (d: WideBase, k: number, st = ''): string => {
  const o = d.options[k]!;
  return B(esc(o.label), k === d.index, `cursor:pointer;${o.locked ? 'opacity:.5;' : ''}${st}`, esc(o.sub), hit(k));
};
/** The choices in a row (a format with one or two things to do). */
const row = (d: WideBase, top: number): string =>
  d.options.length ? `<div class="abs row" style="left:24px;right:24px;top:${top}px;gap:12px;justify-content:center">${d.options.map((_, k) => button(d, k, 'min-width:220px;justify-content:center')).join('')}</div>` : '';

function breather(d: WideBase, b: BreatherBody): string {
  const small = b.down.length > 1;
  const rows = b.down.map((m, k) => `<div class="row" style="gap:10px">${m.file ? mini(m.file, small ? 40 : 60, 'sil') : ''}<div class="col grow" style="gap:3px"><b>${esc(m.name)}</b><span class="sm">${esc(m.sub)}</span></div>${small && d.options[k] ? button(d, k, 'height:34px;font-size:14px') : ''}</div>`).join('');
  const rest = small ? '' : d.options.map((_, k) => button(d, k, 'justify-content:center')).join('');
  const left = W(`<b class="acc">Bring one back</b>${rows || `<span class="sm">${esc(b.note)}</span>`}${rest}`, 'flex:1;min-width:0;display:flex;flex-direction:column;gap:9px');
  const right = W(`<b class="acc">${esc(b.room.title)}</b><div class="sm" style="line-height:20px">${esc(b.room.text)}</div>${facts(b.room.facts)}`, 'flex:1;min-width:0;display:flex;flex-direction:column;gap:7px');
  return strip(b.party, 'left:24px;right:24px;top:90px', true) + `<div class="abs row" style="left:24px;right:24px;top:190px;gap:16px;align-items:stretch">${left}${right}</div>`;
}

function blackout(d: WideBase, b: BlackoutBody): string {
  const cards = b.anchors.map((a) => W(
    `<div class="cell" style="height:130px;aspect-ratio:auto;background:#0000">${a.art ? (a.dark ? `<span class="sil" style="display:block">${figure(a.art, 120)}</span>` : figure(a.art, 120)) : ''}</div><b>${esc(a.name)}</b><span class="sm">${esc(a.state)}</span>`,
    `flex:1;min-width:0;display:flex;flex-direction:column;gap:6px;text-align:center${a.option !== null ? ';cursor:pointer' : ''}`,
    a.fallen ? 'dim' : a.option !== null && a.option === d.index ? 'sel' : '', a.option !== null ? hit(a.option) : '',
  )).join('');
  // Once the streets are open the only choice left has no anchor: it gets a button under the Seal.
  const loose = d.options.map((_, k) => k).filter((k) => !b.anchors.some((a) => a.option === k));
  const seal = W(`<div class="row"><b class="acc grow">${esc(b.seal.title)}</b><span>${esc(b.seal.count)}</span></div>${b.seal.text ? `<div class="sm">${esc(b.seal.text)}</div>` : ''}`, 'display:flex;flex-direction:column;gap:5px');
  const more = loose.length ? `<div class="row" style="justify-content:flex-end">${loose.map((k) => button(d, k, 'min-width:220px;justify-content:center')).join('')}</div>` : '';
  // One column, so a long state line under an anchor pushes the Seal down instead of sitting under it.
  return `<div class="abs col" style="left:24px;right:24px;top:84px;gap:14px"><div class="row" style="gap:16px;align-items:stretch">${cards}</div>${seal}${more}</div>`;
}

function convoy(d: WideBase, b: ConvoyBody): string {
  const n = Math.max(1, b.legs.length), step = 860 / n;
  const trucks = b.legs.map((l, q) => `<div class="abs col cen" style="left:${Math.round(57.5 + step * (q + 0.5) - 75)}px;top:150px;width:150px;gap:4px"><div style="width:120px;height:60px;background:${l.state === 'done' ? '#3fae5a' : l.state === 'now' ? 'var(--acc)' : 'var(--p2)'};box-shadow:0 0 0 3px #000;border-radius:6px 16px 4px 4px"></div><div style="height:26px"></div><b style="color:#fff;text-align:center">${esc(l.name)}</b><span class="sm" style="color:#fff">${esc(l.note)}</span></div>`).join('');
  return (
    (b.caption ? `<div class="abs sm" style="left:40px;top:92px;color:#fff">${esc(b.caption)}</div>` : '') +
    '<div class="abs" style="left:40px;right:40px;top:230px;height:14px;background:#444;box-shadow:0 0 0 3px #000"><div class="fill" style="background:repeating-linear-gradient(90deg,#fff 0 30px,#0000 30px 60px);height:2px;top:6px"></div></div>' +
    trucks + row(d, 320) + strip(b.party, 'left:24px;right:24px;bottom:100px', false)
  );
}

function front(d: WideBase, b: FrontBody): string {
  const lanes = b.lanes.map((l) => W(
    `<div class="row"><b class="grow">${esc(l.name)}</b>${l.won ? '<span class="tg" style="flex:none">Lane won</span>' : ''}</div>${l.sub ? `<span class="sm" style="margin-top:-4px">${esc(l.sub)}</span>` : ''}<div class="col cen" style="gap:2px">${l.foe ? mini(l.foe, 80, l.won ? 'sil' : '') : '<i style="height:80px"></i>'}${hpb(l.foeHp, 120)}</div><div style="height:6px;background:var(--f)"></div><div class="col cen" style="gap:2px">${hpb(l.youHp, 120)}${l.you ? mini(l.you, 80, l.youHp <= 0 ? 'sil' : '') : '<i style="height:80px"></i>'}</div>`,
    'flex:1;min-width:0;display:flex;flex-direction:column;gap:6px',
  )).join('');
  return `<div class="abs row" style="left:24px;right:24px;top:70px;gap:14px;align-items:stretch">${lanes}</div>` + row(d, b.lanes.some((l) => l.sub) ? 372 : 352);
}

function debate(d: WideBase, b: DebateBody): string {
  const many = d.options.length > 4;
  const who = W(`<div class="cell" style="height:150px;aspect-ratio:auto">${figure(b.who.art, 136)}</div><b>${esc(b.who.name)}</b><span class="sm">${esc(b.who.sub)}</span><div class="row" style="justify-content:center">${pips(b.who.won, b.who.of)}<span class="sm">${esc(b.who.score)}</span></div>`, 'display:flex;flex-direction:column;gap:6px;text-align:center');
  const claim = W(`<span class="tg no">${esc(b.claim.tag)}</span><div style="line-height:22px;margin-top:4px${many ? ';font-size:15px;line-height:19px' : ''}">${esc(b.claim.text)}</div>`, '');
  const next = b.next && !many ? W(`<span class="tg no">${esc(b.next.tag)}</span><div class="sm" style="margin-top:4px">${esc(b.next.text)}</div>`, 'opacity:.6') : '';
  // Many arguments (your evidence and the three lines): shorter buttons, so the list stays above the text box.
  const list = d.options.map((_, k) => button(d, k, many ? 'height:32px;font-size:14px' : '')).join('');
  return `<div class="abs" style="left:24px;top:76px;width:230px">${who}</div><div class="abs col" style="left:282px;right:24px;top:76px;gap:${many ? 6 : 10}px">${claim}${list}${next}</div>`;
}

function plate(d: WideBase, b: PlateBody): string {
  const bare = !b.plate.rows.length && !b.plate.note;
  const sheet = bare ? '' : W(
    `<div class="row"><b class="acc grow">${esc(b.plate.title)}</b></div>${b.plate.rows.map(([n, p]) => `<div class="row" style="gap:8px"><span style="width:130px;font-size:14px">${esc(n)}</span>${hpb(p, 0, ' gold')}</div>`).join('')}${b.plate.note ? `<span class="sm">${esc(b.plate.note)}</span>` : ''}`,
    'position:absolute;right:24px;top:76px;width:310px;display:flex;flex-direction:column;gap:6px;padding:10px 12px;background:#12305a;color:#cfe6ff',
  );
  const mon = W(`<div class="cell" style="height:170px;aspect-ratio:auto;background:#0000">${b.mon ? mini(b.mon, 160) : ''}</div><b style="font-size:20px">${esc(b.name)}</b>`, 'position:absolute;left:24px;top:76px;width:240px;display:flex;flex-direction:column;gap:6px;text-align:center');
  const words = b.lines.length ? W(b.lines.map((l) => `<div class="sm" style="line-height:20px">${esc(l)}</div>`).join(''), `position:absolute;left:292px;right:${bare ? 24 : 362}px;top:76px;display:flex;flex-direction:column;gap:8px`) : '';
  return mon + words + sheet + row(d, 352);
}

function plain(d: WideBase, b: PlainBody): string {
  return `<div class="abs col" style="left:24px;right:24px;top:76px;gap:12px">${b.lines.length ? W(b.lines.map((l) => `<div style="line-height:22px">${esc(l)}</div>`).join(''), 'display:flex;flex-direction:column;gap:8px') : ''}<div class="col" style="gap:8px">${d.options.map((_, k) => button(d, k)).join('')}</div></div>`;
}

/** `phases`: the run is in an Extended Cut climax, so the header also offers its phase list (X, or a click on the hint). */
export function wideView(_c: ReduxCtx, d: WideModel, phases = false): string {
  const b = d.body;
  const body = b.kind === 'breather' ? breather(d, b) : b.kind === 'blackout' ? blackout(d, b) : b.kind === 'convoy' ? convoy(d, b) : b.kind === 'front' ? front(d, b) : b.kind === 'debate' ? debate(d, b) : b.kind === 'plate' ? plate(d, b) : plain(d, b);
  return (d.art ? bg(d.art) : '') + (d.shade ? `<div class="fill" style="background:${d.shade}"></div>` : '') + (phases ? H(d.title, 'battle', [['P', 'phases'], ['Enter', 'choose']]).replace('<span><kbd>P</kbd>', `<span style="cursor:pointer"${act('phases')}><kbd>P</kbd>`) : H(d.title, 'battle', [['Enter', 'choose']])) + body + TX(esc(d.text));
}
