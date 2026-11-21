// The Pocket look's Event Hall (mock-up `events`, the Hub's Event Hall): the event on now big with its rule, goals and
// time left, this week's event at the right (or the Contract Board when the week's event is the one on now), and the
// next three weeks along the bottom. It draws what HubScene hands it. Presentation only.

import { esc, hdr, keys, page, spr } from '../kit';
import { ballArt } from '../art';
import { fit, fitBody } from '../templates';

export interface PkEventCard {
  name: string;
  text: string;
  rule: string;
  /** Milliseconds left (the main card) or until it starts (the next ones). */
  ms: number;
  goals?: readonly [number, number];
  colour?: string;
  /** Regions the event points at (Homeland Week's home regions), drawn as stamps. */
  regions?: readonly string[];
}

export interface PkEventsModel {
  date: string;
  main: PkEventCard | null;
  /** This week's event when it is not the main card; else the Contract Board's lines. */
  week: PkEventCard | null;
  contracts: readonly string[];
  next: readonly PkEventCard[];
}

const DAY = 86_400_000;
const REGION_NO: Record<string, number> = { kanto: 1, johto: 2, hoenn: 3, sinnoh: 4, unova: 5, kalos: 6, alola: 7, galar: 8, paldea: 9 };
const STAMP_C = ['#e3350d', '#c9302c', '#c2185b'] as const;
const stamps = (rs: readonly string[] | undefined): string => (rs?.length
  ? `<div class="evh-st">${rs.slice(0, 3).map((r, i) => `<i class="stamp sm" style="--c:${STAMP_C[i % 3]}"><b data-nocheck>${esc(r[0]!.toUpperCase() + r.slice(1))}</b>${REGION_NO[r] ? `<u data-nocheck>Region ${REGION_NO[r]}</u>` : ''}</i>`).join('')}</div>`
  : '');
const inWeeks = (ms: number): string => { const w = Math.max(1, Math.round(ms / (7 * DAY))); return `In ${w} ${w === 1 ? 'week' : 'weeks'}`; };

export function pkEvents(d: PkEventsModel): string {
  const head = hdr('Event Hall', { area: 'town', crumb: ['Hub', 'Events'], pills: [d.date] });
  const m = d.main;
  const left = m ? Math.max(0, m.ms) : 0, days = Math.floor(left / DAY), hours = Math.floor((left % DAY) / 3_600_000);
  const main = m
    ? `<div class="evh-main pn on" data-key="evh-main"${m.colour ? ` style="--c:${m.colour}"` : ''}><em>On now</em><b style="font-size:${fit(m.name, 540, 58, 30, 0.5)}px">${esc(m.name)}</b><span style="font-size:${fit(m.text, 540, 16, 12, 0.5)}px">${esc(m.text)}</span><p style="font-size:${fitBody(m.rule, 330, 84, [15, 14, 13, 12, 11], 1.4)}px">${esc(m.rule)}</p>${stamps(m.regions)}`
      + `<div class="evh-end"><i><b>${days}</b>${days === 1 ? 'day' : 'days'}</i><i><b>${hours}</b>${hours === 1 ? 'hour' : 'hours'}</i><u>left${m.goals ? ` · goals ${m.goals[0]} of ${m.goals[1]} done` : ''}</u></div></div>`
    : '<div class="evh-main pn" data-key="evh-main"><em>Quiet week</em><b>No event on</b><span>The next one opens on Monday.</span></div>';
  const w = d.week;
  const week = w
    ? `<div class="evh-week pn" data-key="evh-week"><em>This week</em><b style="font-size:${fit(w.name, 290, 34, 20, 0.5)}px">${esc(w.name)}</b><p style="font-size:${fitBody(w.rule, 290, 110, [14, 13, 12, 11], 1.4)}px">${esc(w.rule)}</p><i>${spr(ballArt('gb'), 4)}</i></div>`
    : `<div class="evh-week pn" data-key="evh-week"><em>Contract Board</em>${d.contracts.slice(0, 4).map((c) => `<p style="font-size:${fit(c, 290, 13, 10, 0.5)}px">${esc(c)}</p>`).join('')}</div>`;
  const next = `<div class="evh-next" data-key="evh-next">${d.next.slice(0, 3).map((e) => `<div class="pn"><em>${inWeeks(e.ms)}</em><b style="font-size:${fit(e.name, 250, 20, 14, 0.55)}px">${esc(e.name)}</b><span style="font-size:${fitBody(e.rule, 250, 40, [13, 12, 11, 10], 1.3)}px">${esc(e.rule)}</span></div>`).join('')}</div>`;
  return page('events', 26, `<div class="scr evh" data-key="events">${head}${main}${week}${next}${keys([['Esc', 'back to the street']])}</div>`);
}
