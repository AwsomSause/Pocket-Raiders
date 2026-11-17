// New UI operation screens, ported from the mock-ups' Beta 0.6 templates (redux-06.js): the Rescue screen (the impound
// receipt, the holding clock, the plans with their odds words) and the Siege map (the ledger page of districts).
// and the League counter-pick (the registered party, the one the League will answer, and the swap from the box).
// Pure drawing: the scenes keep the state and the input, and every word comes from the core views the old screens read.

import { act, B, esc, facts, foot, H, mini, paper, TX, ty, W } from '../kit';
import type { ReduxCtx } from '../stage';
import { figure, type Art } from '../templates';

// ---------- Rescue ----------

export interface RescueOption {
  label: string;
  /** The odds word on the right (Likely, Even, Safe, Risky, or a dash); empty for none. Never a number. */
  tag: string;
  locked: boolean;
}

export interface RescueModel {
  header: string;
  /** The receipt: its heading, one row per Pokémon taken, the small lines under them and the stamp. */
  head: string;
  held: readonly (readonly [string, string])[];
  notes: readonly string[];
  stamp: string;
  /** The stamp is good news (green) instead of the usual red. */
  stampGood: boolean;
  /** What the receipt itself looks like (the team's own slip), under the rows; empty when none was left. */
  slip: string;
  /** The window under the receipt: the holding clock, or the steps of the plan under way. */
  clock: { title: string; steps: readonly string[]; at: number; done: boolean; note: string };
  /** The choices; empty while lines still wait to be read. */
  options: readonly RescueOption[];
  index: number;
  /** The rival's picture, or null. */
  rival: Art | null;
  who: string | null;
  text: string;
  /** More text waits: a click anywhere (or Enter) turns the page. */
  more: boolean;
}

/** The colour of an odds word. */
export const ODDS_COLORS: Record<string, string> = { Risky: '#d8483a', Even: '#d8a810', Likely: '#3fae5a', Safe: '#3d8bea' };

export function rescueView(c: ReduxCtx, d: RescueModel): string {
  const v = c.v(2), ink = d.stampGood ? '#3fae5a' : '#d8483a';
  const tag = (o: RescueOption, st = ''): string => (o.tag ? `<span class="tg" style="background:${ODDS_COLORS[o.tag] ?? '#888'};color:#fff;${st}">${esc(o.tag)}</span>` : '');
  const receipt = paper(
    `<b style="letter-spacing:.1em">${esc(d.head)}</b><div class="col" style="gap:4px;margin:8px 0">${d.held.map(([n, l]) => `<div class="row"><span class="grow">${esc(n)}</span><span>${esc(l)}</span></div>`).join('')}</div>` +
    (d.slip ? `<i class="sm" style="display:block;margin-bottom:8px;line-height:18px">${esc(d.slip)}</i>` : '') +
    `<div class="row"><span class="grow sm">${d.notes.map(esc).join('<br>')}</span>${d.stamp ? `<b style="flex:none;border:3px solid ${ink};color:${ink};padding:2px 8px;transform:rotate(-8deg)">${esc(d.stamp)}</b>` : ''}</div>`,
    'transform:rotate(-1.2deg);font-size:15px',
  );
  const lit = (k: number): string => (k === d.clock.at ? 'background:var(--acc)' : d.clock.done && k < d.clock.at ? 'background:var(--acc);opacity:.45' : 'background:var(--p2)');
  const clock = W(
    `<b class="acc">${esc(d.clock.title)}</b><div class="row" style="gap:4px;align-items:flex-start">${d.clock.steps.map((s, k) => `<div class="col cen" style="flex:1;gap:3px"><i style="width:100%;height:10px;${lit(k)}"></i><span style="font-size:11px">${esc(s)}</span></div>`).join('')}</div>${d.clock.note ? `<span class="sm">${esc(d.clock.note)}</span>` : ''}`,
    'display:flex;flex-direction:column;gap:6px',
  );
  // A plan name fits one line; an answer in a plan is a sentence, so those buttons grow with their words.
  // The choices wait for the last page of text.
  const options = d.more ? [] : d.options;
  const long = options.some((o) => o.label.length > 34);
  const hit = (k: number): string => `${act('pick', k)} data-over="over"`;
  const list = v
    ? `<div class="abs" style="left:350px;right:24px;top:76px;display:grid;grid-template-columns:${long ? '1fr' : '1fr 1fr'};gap:${long ? 12 : 16}px">${options.map((o, k) => W(`<b style="font-size:15px;line-height:19px">${esc(o.label)}</b>${tag(o, 'align-self:flex-start')}`, `display:flex;flex-direction:column;gap:6px;padding:9px 12px;cursor:pointer${o.locked ? ';opacity:.5' : ''}`, k === d.index ? 'sel' : '', hit(k))).join('')}</div>`
    : `<div class="abs col" style="left:432px;right:24px;top:76px;gap:8px">${options.map((o, k) => `<div class="btn${k === d.index ? ' on' : ''}" style="cursor:pointer${long ? ';height:auto;min-height:42px;padding-top:6px;padding-bottom:8px;white-space:normal;font-size:15px;line-height:19px' : ''}${o.locked ? ';opacity:.5' : ''}"${hit(k)}><span class="grow">${esc(o.label)}</span>${tag(o, 'flex:none')}</div>`).join('')}</div>`;
  const turn = d.more ? `<div class="fill hit" style="z-index:20;cursor:pointer"${act('page')}></div>` : '';
  const mark = d.more ? '<span class="sm rx-more" style="position:absolute;right:14px;bottom:4px">▼</span>' : '';
  return (
    H(d.header, 'story', d.more ? [['Enter', 'next']] : [['Enter', 'choose'], ['Esc', 'back']]) +
    `<div class="abs col" style="left:24px;top:76px;width:${v ? 300 : 380}px;gap:18px">${receipt}${clock}</div>` +
    list + (d.rival ? foot(900, 452, figure(d.rival, 112)) : '') + TX(esc(d.text) + mark, d.who ?? '') + turn
  );
}

// ---------- Siege ----------

export type SiegeStatus = 'held' | 'contested' | 'lost';

export interface SiegeDistrict {
  name: string;
  status: SiegeStatus;
  /** It can be entered by (the middle of the city has no gate). */
  gate: boolean;
  heldBy: string;
  ifLost: string;
}

export interface SiegeMapModel {
  header: string;
  title: string;
  rows: readonly SiegeDistrict[];
  index: number;
  /** The gate already gone through, or null while the choice is open. */
  entered: number | null;
  /** Gate fights lost so far. */
  tries: number;
  /** The words on the button, and whether it can be pressed. */
  button: string;
  ready: boolean;
  text: string;
}

export const SIEGE_COLORS: Record<SiegeStatus, string> = { held: '#3fae5a', contested: '#d8a810', lost: '#d8483a' };
const SIEGE_WORD: Record<SiegeStatus, string> = { held: 'Held', contested: 'Contested', lost: 'Lost' };

/** What going in by a district costs, in the mock-up's words. */
export const siegeCost = (r: SiegeDistrict): string => (!r.gate ? 'No gate' : r.status === 'held' ? 'Free' : 'One battle');
const siegeEffect = (r: SiegeDistrict): string => (r.status === 'lost' ? r.ifLost : !r.gate ? 'No gate here' : r.status === 'held' ? 'Free entry' : 'Costs one battle');

export function siegeMapView(c: ReduxCtx, d: SiegeMapModel): string {
  const v = c.v(2), cur = d.rows[d.index];
  const tagc = (s: SiegeStatus): string => `<span class="tg" style="flex:none;background:${SIEGE_COLORS[s]};color:#fff">${SIEGE_WORD[s]}</span>`;
  const hit = (k: number): string => `${act('district', k)} data-over="over"`;
  const go = B(esc(d.button), d.ready, `justify-content:center;cursor:pointer${d.ready ? '' : ';opacity:.5'}`, '', act('enter'));
  const lost = d.rows.filter((r) => r.status === 'lost');
  if (v) {
    const rows = d.rows.map((r, k) => W(
      `<b style="width:170px;flex:none">${esc(r.name)}</b>${tagc(r.status)}<span class="sm grow" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(siegeEffect(r))}</span>${d.entered === k || (d.entered === null && k === d.index && r.gate) ? '<span class="tg" style="flex:none">Chosen gate</span>' : ''}`,
      'display:flex;align-items:center;gap:14px;padding:7px 14px;cursor:pointer', k === d.index ? 'sel' : '', hit(k),
    )).join('');
    return H(d.header, 'map', [['Enter', 'choose']]) + `<div class="abs col" style="left:24px;right:24px;top:72px;gap:10px">${rows}<div class="row" style="justify-content:flex-end">${go}</div></div>` + TX(esc(d.text));
  }
  // The war map: the city inside its wall, a road from every gate to the middle, and each district as a plot that
  // shows how it stands (a flag flying, blades crossed, or burning).
  const BW = 560, BH = 340, cx = BW / 2, cy = 186;
  const spots = siegeSpots(d.rows);
  const chosen = d.entered ?? d.index;
  const roads = d.rows.map((r, k) => {
    const s = spots[k]!;
    if (!r.gate) return '';
    const col = SIEGE_COLORS[r.status], on = k === chosen;
    const x1 = s.x + s.w / 2, y1 = s.y + s.h / 2;
    return `<line x1="${x1}" y1="${y1}" x2="${cx}" y2="${cy}" stroke="#0a1220" stroke-width="${on ? 11 : 8}" stroke-linecap="round"/><line${on ? ' class="wr-march"' : ''} x1="${x1}" y1="${y1}" x2="${cx}" y2="${cy}" stroke="${col}" stroke-width="${on ? 5 : 3}" stroke-dasharray="${on ? '10 8' : r.status === 'held' ? 'none' : '3 7'}" stroke-linecap="round" opacity="${on ? 1 : 0.7}"/>`;
  }).join('');
  const deco = (s: SiegeStatus): string =>
    s === 'held'
      ? '<div class="abs row" style="right:5px;top:-13px;align-items:flex-start"><div class="wr-flagp"></div><div class="wr-flag"></div></div>'
      : s === 'contested'
        ? '<div class="abs wr-clash" style="right:-8px;top:-10px"><svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><path d="M5 5l12 12M17 5L5 17" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M4 13l5 5M18 13l-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></div>'
        : `<div class="abs row" style="left:8px;right:8px;top:-11px;justify-content:space-around;align-items:flex-end">${[0, 0.9, 1.6].map((dl) => `<div style="position:relative"><div class="wr-fire"></div><div class="abs wr-smoke" style="left:-2px;top:-8px;--d:-${dl}s"></div></div>`).join('')}</div>`;
  const nodes = d.rows.map((r, k) => {
    const s = spots[k]!, col = SIEGE_COLORS[r.status], ring = k === chosen;
    return `<div class="abs wr-node s-${r.status}" style="left:${s.x}px;top:${s.y}px;width:${s.w}px;height:${s.h}px;--nc:${col};--nc2:${col}55;--nc3:${col}26;box-shadow:inset 0 0 0 3px ${col}${ring ? ',0 0 0 4px var(--tf)' : ''},0 4px 0 #0008"${hit(k)}>${deco(r.status)}<b>${esc(r.name)}</b>${tagc(r.status)}</div>`;
  }).join('');
  // The city inside the wall: little blocks of houses, laid out from the map's own name so each city has its own streets.
  let seed = 2166136261;
  for (let i = 0; i < d.title.length; i++) seed = Math.imul(seed ^ d.title.charCodeAt(i), 16777619) >>> 0;
  const rnd = (): number => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  let blocks = '';
  for (let i = 0; i < 46; i++) {
    const a = rnd() * Math.PI * 2, q = 0.18 + rnd() * 0.72, bw = 10 + Math.floor(rnd() * 3) * 6, bh = 8 + Math.floor(rnd() * 2) * 6;
    blocks += `<rect x="${Math.round(cx + Math.cos(a) * 214 * q - bw / 2)}" y="${Math.round(cy + Math.sin(a) * 108 * q - bh / 2)}" width="${bw}" height="${bh}" fill="#7fa8e0" opacity="${(0.1 + rnd() * 0.14).toFixed(2)}"/>`;
  }
  const towers = Array.from({ length: 12 }, (_, i) => { const a = ((15 + i * 30) * Math.PI) / 180; return `<rect x="${Math.round(cx + Math.cos(a) * 246 - 5)}" y="${Math.round(cy + Math.sin(a) * 132 - 6)}" width="10" height="12" fill="#b9c8e6" stroke="#0a1220" stroke-width="2"/>`; }).join('');
  const tally = (['held', 'contested', 'lost'] as const).map((s) => [s, d.rows.filter((r) => r.status === s).length] as const);
  const control = `<div class="abs col" style="right:12px;top:10px;width:170px;gap:4px"><div class="wr-ctl">${tally.map(([s, n]) => (n ? `<div style="flex:${n};background:${SIEGE_COLORS[s]}"></div>` : '')).join('')}</div><div class="row sm" style="justify-content:space-between;font-size:11px">${tally.map(([s, n]) => `<span style="color:${SIEGE_COLORS[s]}">${n} ${SIEGE_WORD[s].toLowerCase()}</span>`).join('')}</div></div>`;
  const keep = d.rows.some((r) => !r.gate) ? '' : `<div class="abs" style="left:${cx - 13}px;top:${cy - 13}px;width:26px;height:26px;border-radius:50%;background:#0a1220;box-shadow:0 0 0 3px #7fa8e0,0 0 14px #7fa8e0"></div>`;
  const board =
    `<div class="abs wr-board" style="left:24px;top:74px;width:${BW}px;height:${BH}px">` +
    '<div class="fill wr-grid"></div>' +
    `<div class="abs wr-sweep" style="left:${cx - 250}px;top:${cy - 250}px;width:500px;height:500px"></div>` +
    `<svg class="abs" style="left:0;top:0" width="${BW}" height="${BH}" viewBox="0 0 ${BW} ${BH}" aria-hidden="true"><ellipse cx="${cx}" cy="${cy}" rx="246" ry="132" fill="#0a122066" stroke="#93a8cc" stroke-width="6" stroke-dasharray="14 5"/><ellipse cx="${cx}" cy="${cy}" rx="236" ry="124" fill="none" stroke="#93a8cc55" stroke-width="2"/><ellipse cx="${cx}" cy="${cy}" rx="120" ry="62" fill="none" stroke="#93a8cc33" stroke-width="2" stroke-dasharray="4 6"/>${blocks}${towers}${roads}<g transform="translate(34 ${BH - 36})" stroke="#dfe8f5" stroke-width="2" fill="none"><circle r="15" opacity=".5"/><path d="M0 -20V20M-20 0H20" opacity=".5"/><path d="M0 -20l5 14h-10z" fill="#e8443a" stroke="none"/></g></svg>` +
    `<div class="abs wr-ribbon" style="left:0;top:10px"><b>${esc(d.title)}</b></div>${control}${keep}${nodes}</div>`;
  const side = cur
    ? W(`<div class="row" style="justify-content:space-between;align-items:center;gap:8px"><b class="acc">${esc(cur.name)}</b><span class="wr-stamp" style="color:${SIEGE_COLORS[cur.status]}">${SIEGE_WORD[cur.status]}</span></div>${facts([['Status', SIEGE_WORD[cur.status]], ['Cost', siegeCost(cur)], ['Held by', cur.heldBy || 'Nobody'], ...(d.tries ? [['Gate fights lost', String(d.tries)] as const] : [])])}`, 'display:flex;flex-direction:column;gap:6px')
    : '';
  const effects = W(
    `<b class="acc">Lost district effects</b>${lost.length ? lost.map((r) => `<div class="wr-warn">${esc(r.name)}: ${esc(r.ifLost)}</div>`).join('') : '<div class="sm" style="line-height:20px">None. No district is lost.</div>'}`,
    'display:flex;flex-direction:column;gap:6px',
  );
  const enter = `<div class="btn${d.ready ? ' on wr-go' : ''}" style="justify-content:center;cursor:pointer${d.ready ? '' : ';opacity:.5'}"${act('enter')}>${esc(d.button)}</div>`;
  return H(d.header, 'map', [['Enter', 'choose']]) + board + `<div class="abs col" style="left:612px;right:24px;top:76px;gap:12px">${side}${effects}${enter}</div>` + TX(esc(d.text));
}

/** A compass word a gate's name starts with, as an angle (north is up). */
const COMPASS: Record<string, number> = { north: -90, east: 0, south: 90, west: 180 };

/**
 * Where each district stands on the war map (a 560 x 340 board): gates round the wall, the gateless middle in the
 * middle. Gates named for the compass stand where their name says; otherwise they are spread evenly from the top.
 * Plots get smaller as the list grows so that none overlaps another or leaves the board.
 */
export function siegeSpots(rows: readonly SiegeDistrict[]): { x: number; y: number; w: number; h: number }[] {
  const gates = rows.map((r, k) => (r.gate ? k : -1)).filter((k) => k >= 0), inner = rows.map((r, k) => (r.gate ? -1 : k)).filter((k) => k >= 0);
  const n = gates.length, w = n > 10 ? 72 : n > 8 ? 84 : n > 6 ? 94 : 116, h = n > 10 ? 40 : n > 6 ? 44 : 54;
  const cx = 280, cy = 186, rx = 246 - w / 2 - 22, ry = 132 - h / 2 + 2;
  const words = gates.map((k) => COMPASS[rows[k]!.name.trim().split(/\s+/)[0]!.toLowerCase()]);
  const byName = n > 0 && words.every((a) => a !== undefined) && new Set(words).size === n;
  const out: { x: number; y: number; w: number; h: number }[] = rows.map(() => ({ x: 0, y: 0, w, h }));
  // Not every gate has a compass name: the ones that do take the free place nearest their side, the rest fill in round the wall.
  const slots = gates.map((_, i) => -90 + (360 / n) * i), deg: number[] = gates.map(() => NaN);
  if (!byName) {
    const free = new Set(slots.map((_, i) => i));
    const turn = (a: number, b: number): number => Math.abs(((a - b + 540) % 360) - 180);
    const take = (i: number, want: number | undefined): void => {
      let best = -1;
      for (const j of free) if (best < 0 || (want !== undefined && turn(slots[j]!, want) < turn(slots[best]!, want))) best = j;
      free.delete(best); deg[i] = slots[best]!;
    };
    words.forEach((a, i) => { if (a !== undefined) take(i, a); });
    words.forEach((a, i) => { if (a === undefined) take(i, undefined); });
  }
  gates.forEach((k, i) => {
    const a = ((byName ? words[i]! : deg[i]!) * Math.PI) / 180;
    out[k] = { x: Math.round(cx + Math.cos(a) * rx - w / 2), y: Math.round(cy + Math.sin(a) * ry - h / 2), w, h };
  });
  const iw = Math.min(w, 110), ih = Math.min(h, inner.length > 2 ? 36 : 48);
  inner.forEach((k, i) => {
    out[k] = { x: Math.round(cx - iw / 2), y: Math.round(cy - (inner.length * (ih + 6) - 6) / 2 + i * (ih + 6)), w: iw, h: ih };
  });
  return out;
}

// ---------- League counter-pick ----------

export interface CounterMon {
  name: string;
  file: string | null;
  types: readonly string[];
  /** 'answer': the one the League has studied most. 'registered': on the list. 'out': in the party but not registered. */
  state: 'answer' | 'registered' | 'out';
}

export interface CounterModel {
  party: readonly CounterMon[];
  /** Boxed Pokémon that can take the answered one's place. */
  bench: readonly { name: string; file: string | null; sub: string }[];
  /** The boxed Pokémon marked "Pick". */
  pick: number;
  /** The cursor: a bench row, then the swap button (bench.length), then the keep button. */
  at: number;
  swap: string;
  keep: string;
  who: string;
  text: string;
  /** The result line once the choice is made; it stays until the next input. */
  result: string | null;
}

const COUNTER_TAG: Record<CounterMon['state'], string> = { answer: 'The League will answer this', registered: 'Registered', out: 'Not registered' };

export function counterView(c: ReduxCtx, d: CounterModel): string {
  const v = c.v(2), n = d.bench.length;
  const tiles = d.party.map((p) => W(
    `<div class="row">${p.file ? mini(p.file, 48) : ''}<div class="col grow" style="gap:3px;min-width:0"><b style="font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(p.name)}</b><div class="row" style="gap:3px">${p.types.map(ty).join('')}</div></div></div>` +
    (p.state === 'answer' ? `<span class="tg" style="background:#d8483a;color:#fff;align-self:flex-start;font-size:11px;padding-left:6px;padding-right:6px;white-space:nowrap">${COUNTER_TAG.answer}</span>` : `<span class="sm">${COUNTER_TAG[p.state]}</span>`),
    `display:flex;flex-direction:column;gap:6px;padding:8px 10px;min-width:0${p.state === 'out' ? ';opacity:.6' : ''}`, p.state === 'answer' ? 'sel' : '',
  )).join('');
  const hit = (k: number): string => `${act('pick', k)} data-over="over"`;
  const rows = d.bench.map((m, k) => `<div class="row" style="cursor:pointer;padding:2px 4px;margin:-2px -4px${k === d.at ? ';box-shadow:0 0 0 2px var(--tf)' : ''}"${hit(k)}>${m.file ? mini(m.file, 40) : ''}<span class="grow">${esc(m.name)}</span><span class="sm" style="flex:none">${esc(m.sub)}</span>${k === d.pick ? '<span class="tg" style="flex:none">Pick</span>' : ''}</div>`).join('');
  const side = W(`<b class="acc">Swap it for a boxed Pokémon?</b>${rows}`, 'display:flex;flex-direction:column;gap:7px');
  const done = d.result !== null;
  const buttons = done ? '' : B(esc(d.swap), d.at === n, 'justify-content:center;cursor:pointer', '', hit(n)) + B(esc(d.keep), d.at === n + 1, 'justify-content:center;cursor:pointer', '', hit(n + 1));
  const end = done ? `<div class="fill hit" style="z-index:20;cursor:pointer"${act('done')}></div>` : '';
  return (
    H('League counter-pick', 'battle', done ? [['Enter', 'continue']] : [['Enter', 'choose']]) +
    `<div class="abs" style="left:24px;top:74px;width:${v ? 560 : 600}px;display:grid;grid-template-columns:repeat(3,1fr);gap:14px">${tiles}</div>` +
    `<div class="abs col" style="left:${v ? 610 : 650}px;right:24px;top:74px;gap:10px">${side}${buttons}</div>` +
    TX(esc(done ? d.result! : d.text), done ? '' : d.who) + end
  );
}
