// DOMINION redesign R3 (pass 50, "The Day"): the clock dial (mockup `clock`), last night (`recap`) and the calendar
// (`calendar`). Live data only; the scene's DayPages builds the models. Pure markup.

import { esc, go, map, pn, rep, SP, type R5Cta, type R5Run, type R5Speaker } from './kit';
import { frame } from './day';

// ---------- The Day: the clock (mockup `clock`) ----------

export type R5Phase = 'morning' | 'day' | 'evening' | 'night';
export const PHASES: readonly R5Phase[] = ['morning', 'day', 'evening', 'night'];
const Q: Record<R5Phase, [string, string, string, number]> = {
  morning: ['q-morn', 'wx-sun', 'Morning', -20], day: ['q-noon', 'wx-sun', 'Day', 70], evening: ['q-eve', 'wx-set', 'Evening', 160], night: ['q-night', 'wx-moon', 'Night', 250],
};

export interface R5Clock {
  day: number;
  phase: R5Phase;
  /** Orders used and the day's orders (the pips). */
  used: number;
  max: number;
  /** The small line under the pips ("2 actions left"). */
  left: string;
  /** One row per phase: what happens, and its tag ("Now", "3 actions"). */
  rows: readonly { phase: R5Phase; what: string; tag: string | null }[];
  at: number;
  cta: string;
  who: R5Speaker | null;
  line: string;
}

export function r5Clock(c: R5Clock, run: R5Run): string {
  const quads = map(PHASES, (p, i) => `<span class="q15 ${Q[p][0]}${p === c.phase ? ' on' : ''}" style="--r:${-45 + i * 90}deg;--d:${i * 120}ms" data-nocheck=""></span>`);
  const labels = map(PHASES, (p, i) => `<b class="ql15 l${i}"><i class="wx ${Q[p][1]}" data-nocheck=""></i>${Q[p][2]}</b>`);
  const dial = `<div class="dial15" data-m="dial" data-testid="dom-clock-dial">${quads}\n    <i class="hand15" data-nocheck="" style="transform:rotate(${Q[c.phase][3]}deg)"></i>${labels}<div class="dc15"><b>${c.day}</b><em>${Q[c.phase][2]}</em><span>${rep(c.max, (i) => `<i class="${i < c.used ? 'on' : ''}"></i>`)}</span><small>${esc(c.left)}</small></div></div>`;
  const rows = map(c.rows, (r, i) => `<button class="row ph${i === c.at ? ' on' : ''}" ${go('clockRow', i)} style="--i:${i};--d:${i * 60}ms" data-testid="dom-clock-${r.phase}"><i class="wx ${Q[r.phase][1]}" data-nocheck=""></i><span class="row-t"><b>${Q[r.phase][2]}</b><em>${esc(r.what)}</em></span>${r.tag ? `<i class="tag">${esc(r.tag)}</i>` : ''}</button>`);
  return frame({
    id: 'clock', g: 'The Day', kind: 'clk15', bg: 'night', run,
    top: { title: 'The Day', sub: `Day ${c.day}`, crumb: ['Map', 'map'] },
    body: dial + '\n  ' + pn('ph15', 'Today', rows, 'det'),
    who: c.who, line: c.line,
    ctas: [['Back', 'dayBack', '', 'dom-clock-back'], [c.cta, 'clockNext', '', 'dom-clock-next']],
    keys: [['↑↓', 'phase'], ['C', 'calendar', 'dayCal'], ['Enter', 'go'], ['Esc', 'back']],
  });
}

// ---------- Last night (mockup `recap`) ----------

export interface R5RecapCard { tag: string; pic: string; head: string; line: string; val: string }

export function r5Recap(o: { from: number; cards: readonly R5RecapCard[]; who: R5Speaker | null; line: string; cta: string }, run: R5Run): string {
  const cards = o.cards.length ? o.cards : [{ tag: 'Night', pic: SP('p-rotom', 90), head: 'A quiet night', line: 'Nothing to report.', val: '' }];
  const grid = `<section class="rg30" data-m="panel" data-testid="dom-recap" style="grid-template-columns:repeat(${Math.max(1, cards.length)},1fr)">${map(cards, (c, i) => `<div class="rcd30" style="--d:${i * 220}ms" data-testid="dom-recap-${i}"><small>${esc(c.tag)}</small>${c.pic}<b>${esc(c.head)}</b><em>${esc(c.line)}</em><i>${esc(c.val)}</i></div>`)}</section>`;
  return frame({
    id: 'recap', g: 'The Day', kind: 'rc30', bg: 'street', run,
    top: { title: 'Last night', sub: `Day ${o.from} → Day ${o.from + 1}`, crumb: ['Map', 'map'] },
    body: grid,
    who: o.who, line: o.line,
    ctas: [['Skip', 'dayBack', '', 'dom-recap-skip'], [o.cta, 'dayBack', '', 'dom-recap-go']],
    keys: [['Enter', 'the Morning report'], ['Esc', 'skip']],
  });
}

// ---------- The calendar (mockup `calendar`) ----------

export interface R5CalDay { d: number; past: boolean; now: boolean; ev: { cls: string; word: string } | null }

export function r5Calendar(o: { region: string; month: number; days: readonly R5CalDay[]; at: number; title: string; sub: string; body: string; who: R5Speaker | null; line: string }, run: R5Run): string {
  const wd = map(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], (d) => `<b class="wd">${d}</b>`);
  const cells = map(o.days, (c, i) => `<i class="dc34${c.past ? ' past' : ''}${c.now ? ' now' : ''}${c.ev ? ` ${c.ev.cls}` : ''}${i === o.at ? ' sel50' : ''}" ${go('calDay', i)} style="--d:${i * 18}ms" data-testid="dom-cal-${c.d}"><u>${c.d}</u>${c.ev ? `<em>${esc(c.ev.word)}</em>` : ''}</i>`);
  const det = pn('cl34', o.at >= 0 && !o.days[o.at]?.now ? `Day ${o.days[o.at]?.d ?? ''}` : 'Today', `<div class="tn34" data-testid="dom-cal-day"><b>${esc(o.title)}</b><em>${esc(o.sub)}</em><p>${esc(o.body)}</p></div>`, 'det');
  return frame({
    id: 'calendar', g: 'The Day', kind: 'cal34', bg: 'hq', run,
    top: { title: 'Calendar', sub: `${o.region} · Month ${o.month}`, crumb: ['Map', 'map'] },
    body: `<section class="cal34" data-m="panel" data-testid="dom-cal">${wd}${cells}</section>\n  ${det}`,
    who: o.who, line: o.line,
    ctas: [['Back', 'dayBack', '', 'dom-cal-back']] as R5Cta[],
    keys: [['←→↑↓', 'day'], ['Esc', 'back']],
  });
}

