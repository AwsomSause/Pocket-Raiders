// DOMINION redesign R6 (pass 50): the Pokémon pages. The Reserve box (mockup `reserve`, kind grid), the Card that
// gives a Reserve Pokémon to a member (`give`, kind card), the Boss's party (`party`, pass 31), a Pokémon's summary
// (`summary`, pass 31) and the Bag (`bag`, pass 41). Display data in, HTML out: the scene keeps the cursors and does
// the acts. Every data-testid the old Reserve view had is kept.

import './r6.css';
import { esc, faceOf, frame, map, rep, SP, type R5Cta, type R5Key, type R5Run, type R5Speaker } from './kit';

const act = (name: string, arg: string | number = ''): string => `data-act="${esc(name)}" data-arg="${esc(String(arg))}"`;
const tid = (t?: string): string => (t ? ` data-testid="${esc(t)}"` : '');
/** A notice over the page (the Start menu's description bar): a tap or Enter closes it. */
const note = (n: string | null): string => (n ? `<div class="sd25" ${act('dismiss')} data-testid="dom-notice">${esc(n)}<i class="nx23" data-nocheck="">▼</i></div>` : '');

// ---------- the Reserve (mockup `reserve`) ----------

export interface R5Cell { name: string; types: string; pic: string; stars: number; tag: string; on: boolean; fits: boolean }

export interface R5ReserveView {
  /** "Box 1 of 2 · 9 of 20 · Poison and Dark". `count` is the "9 / 20" part, kept as its own test id. */
  box: string;
  count: string;
  types: string;
  cells: readonly R5Cell[];
  empty: string;
  fitsOnly: boolean;
  auto: boolean;
  /** Who Enter gives to (screen readers and tests). */
  who: string;
  notice: string | null;
}

export function r5Reserve(v: R5ReserveView, run: R5Run): string {
  const cells = v.cells.length
    ? map(v.cells, (c, i) => `<button class="cell${c.on ? ' on' : ''}" style="--pc:#3a2a34;--i:${i};--d:${i * 50}ms" ${act('tile', i)} data-over="tileOver" data-testid="dom-tile-${i}"><i class="rr14">${'★'.repeat(c.stars)}</i><span class="cs">${c.pic}</span><b>${esc(c.name)}</b><em>${esc(c.types)}</em>${c.tag ? `<i class="tag">${esc(c.tag)}</i>` : ''}</button>`)
    : `<p class="r6-empty">${esc(v.empty)}</p>`;
  const body = `<section class="pn g-main" data-m="panel" data-testid="dom-reserve"><h3><i>${esc(v.box)} · <span data-testid="dom-reserve-count">${esc(v.count)}</span> · ${esc(v.types)}</i></h3><div class="cells n12">${cells}</div><span class="r6-sr" data-testid="dom-who">${esc(v.who)}</span></section>${note(v.notice)}`;
  const ks: R5Key[] = [['Enter', 'Choose'], ['Esc', 'Back'], ['F', v.fitsOnly ? 'Fits' : 'All', 'fitsToggle', 'dom-fits'], ['A', `Auto ${v.auto ? 'on' : 'off'}`, 'autoFill', 'dom-auto']];
  return frame({ id: 'reserve', g: 'Pokémon', kind: 'grid g-box', top: { title: 'Pokémon Reserve', crumb: null }, body, keys: ks, run });
}

// ---------- the Card: give a Reserve Pokémon (mockup `give`) ----------

export interface R5GiveView {
  mon: string;
  who: string;
  /** "Rook · BST cap 355". */
  sub: string;
  ok: boolean;
  parts: readonly (readonly [label: string, value: string, bad: boolean])[];
  /** The member (or the Boss), the team now, and the Pokémon given; `focus` marks the team slot Tab picked. */
  person: string;
  team: readonly { pic: string; bad: boolean }[];
  pick: string;
  focus: number | null;
  facts: readonly (readonly [string, string])[];
  speaker: R5Speaker;
  line: string;
  cta: string;
  notice: string | null;
}

export function r5Give(v: R5GiveView, run: R5Run): string {
  const p = v.ok ? 100 : 0;
  const odds = `<section class="pn c-odds" data-m="det"><div class="ring" style="--p:${p}"><b class="cnt" style="--to:${p}"></b><em>chance</em></div><b class="det-t">Give ${esc(v.mon)} to ${esc(v.who)}</b><p>${esc(v.sub)}</p></section>`;
  const parts = `<section class="pn c-parts" data-m="panel"><h3><i>How the odds are made</i></h3>${map(v.parts, ([l, x, bad], i) => `<div class="part" style="--i:${i};--d:${i * 70}ms"><span>${esc(l)}</span><b class="${bad ? 'neg' : ''}"${l.endsWith('BST cap') ? ' data-testid="dom-bstcap"' : l === 'Level cap' ? ' data-testid="dom-lvcap"' : ''}>${esc(x)}</b></div>`)}<div class="part tot"><span>Total</span><b>${p}%</b></div></section>`;
  const team = map(v.team, (t, i) => `<div class="who${v.focus === i ? ' r6-on' : ''}${t.bad ? ' r6-bad' : ''}" ${act('takeSlot', i)} data-testid="dom-slot-${i}">${t.pic}</div>`);
  const who = `<section class="pn c-who" data-testid="dom-give"><h3><i>Who is there</i></h3><div class="who">${v.person}</div>${team}${v.pick ? `<div class="who${v.ok ? ' r6-ghost' : ' r6-bad'}" data-testid="dom-ghost">${v.pick}</div>` : ''}<dl class="facts">${map(v.facts, ([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`)}</dl><span class="r6-sr" data-testid="dom-who">${esc(v.who)}</span></section>`;
  const ctas: R5Cta[] = [['Change crew', 'who', 1, 'dom-give-who'], [v.cta, 'giveIt', '', 'dom-give-cta']];
  const ks: R5Key[] = [['Enter', 'do it'], ['Esc', 'back'], ['W', 'crew', 'whoBack'], ['Tab', 'team']];
  return frame({ id: 'give', g: 'Pokémon', kind: 'card', bg: 'street', top: { title: 'The Card', sub: `Give ${v.mon} to ${v.who}` }, body: `${odds}\n  ${parts}\n  ${who}${note(v.notice)}`, who: v.speaker, line: v.line, ctas, keys: ks, run });
}

// ---------- the party (mockup `party`, pass 31) ----------

export interface R5PartyMon { name: string; level: number; types: string; hp: number; item: string; pic: string; big: string }

export interface R5PartyView {
  mons: readonly R5PartyMon[];
  at: number;
  /** A Pokémon picked to swap (S), or an item being used on one ("Use Potion on…"). */
  swap: number | null;
  using: string | null;
  speaker: R5Speaker;
  line: string;
  notice: string | null;
}

const hpCls = (hp: number): string => (hp < 25 ? 'low' : hp < 50 ? 'mid' : 'ok');

export function r5Party(v: R5PartyView, run: R5Run): string {
  const lead = v.mons[0];
  const cards = map(v.mons, (m, i) => `<button class="pm31${i === 0 ? ' ld' : ''}${i === v.at ? ' on' : ''}${v.swap === i ? ' r6-swap' : ''}" ${act('partyPick', i)} data-over="partyOver" data-testid="r6-party-${i}" style="--d:${i * 80}ms"><span class="ball"></span><span class="sp">${i === 0 ? m.big : m.pic}</span><span class="tx"><b>${esc(m.name)}</b><em>Lv ${m.level} · ${esc(m.types)}</em><span class="hp31 ${hpCls(m.hp)}"><i style="width:${m.hp}%"></i></span><small>${m.item ? `◆ ${esc(m.item)}` : 'No item'}</small></span></button>`);
  const sub = v.using ? `Use ${v.using} on…` : `${v.mons.length} of 6${lead ? ` · lead ${lead.name}` : ''}`;
  const ctas: R5Cta[] = v.using ? [['Back', 'partyBack', '', 'r6-party-back'], ['Use it', 'partyGo', '', 'r6-party-go']] : [['Back', 'partyBack', '', 'r6-party-back'], ['Summary', 'partyGo', '', 'r6-party-go']];
  const ks: R5Key[] = v.using ? [['↑↓', 'Pokémon'], ['Enter', 'use'], ['Esc', 'back']] : [['↑↓', 'Pokémon'], ['Enter', 'summary'], ['S', v.swap === null ? 'swap' : 'swap here', 'partySwap', 'r6-party-swap']];
  return frame({ id: 'party', g: 'Pokémon', kind: 'pt31', top: { title: 'Party', sub, subTestid: 'r6-party-sub' }, body: `<section class="pg31" data-m="panel" data-testid="r6-party">${cards}</section>${note(v.notice)}`, who: v.speaker, line: v.line, ctas, keys: ks, run });
}

// ---------- the summary (mockup `summary`, pass 31) ----------

export interface R5SummaryView {
  name: string;
  level: number;
  pic: string;
  line1: string;
  /** Base stats for the shape, the Pokémon's own for the numbers (HP Atk Def SpA SpD Spe). */
  base: readonly number[];
  stats: readonly number[];
  moves: readonly { name: string; type: string; pp: string }[];
  ability: string;
  item: string;
  speaker: R5Speaker;
  line: string;
}

const LBL = ['HP', 'Atk', 'Def', 'SpA', 'SpD', 'Spe'];
/** The six corners clockwise from the top, `r` out of 80 (the mockup's 200x200 hexagon). */
const hex = (r: (i: number) => number): string => LBL.map((_, i) => {
  const a = (Math.PI / 3) * i - Math.PI / 2;
  return `${100 + r(i) * Math.cos(a)},${100 + r(i) * Math.sin(a)}`;
}).join(' ');

export function r5Summary(v: R5SummaryView, run: R5Run): string {
  const card = `<div class="sp31" data-m="card" data-testid="r6-summary"><i class="sh"></i>${v.pic}<b>${esc(v.name.toUpperCase())}</b><em>${esc(v.line1)}</em></div>`;
  const stats = `<section class="pn st31" data-m="det"><h3><i>Stats</i></h3><svg class="hx31" viewBox="0 0 200 200" data-nocheck=""><polygon class="g" points="${hex(() => 80)}"></polygon><polygon class="v" points="${hex((i) => 80 * Math.min(1, (v.base[i] ?? 0) / 120))}"></polygon></svg><dl class="sl31">${map(LBL, (l, i) => `<dt>${l}</dt><dd>${v.stats[i] ?? 0}</dd>`)}</dl></section>`;
  const moves = `<section class="pn mv31" data-m="det"><h3><i>Moves</i></h3>${map(v.moves, (m, i) => `<div class="mr31 t-${esc(m.type.toLowerCase())}" style="--i:${i};--d:${i * 60}ms"><b>${esc(m.name)}</b><em>${esc(m.type)}</em><i>${esc(m.pp)}</i></div>`)}<p class="ab31"><b>Ability</b> ${esc(v.ability)} · <b>Item</b> ${esc(v.item)}</p></section>`;
  const ks: R5Key[] = [['←→', 'Pokémon'], ['Esc', 'back']];
  return frame({ id: 'summary', g: 'Pokémon', kind: 'sm31', top: { title: 'Summary', sub: `${v.name} · Lv ${v.level}` }, body: `${card}\n  ${stats}\n  ${moves}`, who: v.speaker, line: v.line, ctas: [['Back', 'partyBack', '', 'r6-summary-back']], keys: ks, run });
}

// ---------- the Bag (mockup `bag`, pass 41) ----------

export interface R5BagItem { name: string; count: number; icon: string; /** The detail box's bigger picture. */ big: string; about: string; usable: boolean }

export interface R5BagView {
  pocket: string;
  pockets: number;
  pocketAt: number;
  items: readonly R5BagItem[];
  at: number;
  initial: string;
  notice: string | null;
}

/** Rows the list shows at once (the mockup's panel fits five). */
export const BAG_ROWS = 5;

export function r5Bag(v: R5BagView, run: R5Run): string {
  const first = Math.max(0, Math.min(v.at - 2, v.items.length - BAG_ROWS));
  const rows = v.items.slice(first, first + BAG_ROWS);
  const total = v.items.reduce((n, x) => n + x.count, 0);
  const sat = `<section class="bs41" data-m="panel"><span class="sat" data-nocheck=""><i class="flap"></i><i class="n">${esc(v.initial)}</i></span><span class="pk"><i ${act('bagPocket', -1)}>◀</i><b data-testid="r6-bag-pocket">${esc(v.pocket)}</b><i ${act('bagPocket', 1)}>▶</i></span><span class="dots">${rep(v.pockets, (i) => `<u class="${i === v.pocketAt ? 'on' : ''}"></u>`)}</span></section>`;
  const list = `<section class="pn bl41" data-m="panel" data-testid="r6-bag"><h3><i>${esc(v.pocket)}</i></h3>${rows.length ? map(rows, (x, j) => `<div class="bi41${first + j === v.at ? ' on' : ''}" style="--i:${j};--d:${j * 60}ms" ${act('bagPick', first + j)} data-testid="r6-bag-${first + j}">${x.icon}<b>${esc(x.name)}</b><i>× ${x.count}</i></div>`) : '<div class="bi41"><b>Nothing in this pocket.</b></div>'}</section>`;
  const cur = v.items[v.at];
  const det = `<div class="bd41" data-m="box">${cur ? `${cur.big}<p><b>${esc(cur.name)}</b>${esc(cur.about)}</p>` : '<p><b>Empty</b>Nothing in this pocket yet.</p>'}</div>`;
  const ks: R5Key[] = [['←→', 'pocket'], ['↑↓', 'item'], ['Enter', cur?.usable ? 'use' : 'look'], ['Esc', 'close']];
  return frame({ id: 'bag', g: 'Pokémon', kind: 'bg41', top: { title: 'Bag', sub: `${v.pocket} · ${total} item${total === 1 ? '' : 's'}` }, body: `${sat}\n  ${list}\n  ${det}${note(v.notice)}`, keys: ks, run });
}

/** A round face for a member or the Boss in a text box (team colour ring). */
export const r6Face = (pic: string, colour: string): string => faceOf(pic, 40, colour);
export { SP };
