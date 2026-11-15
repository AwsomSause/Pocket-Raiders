// New UI operation screens, ported from the mock-ups' Beta 0.6 templates (redux-06.js): the Rescue screen (the impound
// receipt, the holding clock, the plans with their odds words) and the Siege map (the ledger page of districts).
// Pure drawing: the scenes keep the state and the input, and every word comes from the core views the old screens read.

import { act, B, esc, facts, foot, H, paper, TX, W } from '../kit';
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
  const lines = Math.max(1, Math.ceil(d.rows.length / 3)), cell = Math.min(112, Math.floor((340 - 32 - 36 - (lines - 1) * 8) / lines));
  const grid = d.rows.map((r, k) => {
    const col = SIEGE_COLORS[r.status], ring = d.entered === k || (d.entered === null && k === d.index);
    return `<div class="col cen" style="height:${cell}px;gap:6px;justify-content:center;text-align:center;cursor:pointer;background:${col}30;box-shadow:inset 0 0 0 3px ${col}${ring ? ',0 0 0 4px var(--tf)' : ''}"${hit(k)}><b style="font-size:15px">${esc(r.name)}</b>${tagc(r.status)}</div>`;
  }).join('');
  const side = cur
    ? W(`<b class="acc">${esc(cur.name)}</b>${facts([['Status', SIEGE_WORD[cur.status]], ['Cost', siegeCost(cur)], ['Held by', cur.heldBy || 'Nobody'], ...(d.tries ? [['Gate fights lost', String(d.tries)] as const] : [])])}`, 'display:flex;flex-direction:column;gap:6px')
    : '';
  const effects = W(
    `<b class="acc">Lost district effects</b><div class="sm" style="line-height:20px">${lost.length ? lost.map((r) => `${esc(r.name)}: ${esc(r.ifLost)}`).join('<br>') : 'None. No district is lost.'}</div>`,
    'display:flex;flex-direction:column;gap:6px',
  );
  return (
    H(d.header, 'map', [['Enter', 'choose']]) +
    `<div class="abs" style="left:24px;top:74px;width:560px;height:340px">${paper(`<b style="font-size:20px">${esc(d.title)}</b><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px">${grid}</div>`, 'height:100%;box-sizing:border-box')}</div>` +
    `<div class="abs col" style="left:612px;right:24px;top:76px;gap:14px">${side}${effects}${go}</div>` + TX(esc(d.text))
  );
}
