// Phantom UI: moving on to the next region. The ticket page after a region's Champion (mock-up `travel`) and the
// offer of a regional form when the party arrives (mock-up `forms`). The game fixes the order of a run's regions when
// the run starts, so the ticket page shows the one ticket the run holds, on the road it has travelled; the form
// offer is the game's own (one free offer for each Pokémon in each region). Both only draw.

import type { PhantomVersion } from '../../../core/presentation/phantom';
import { rxUrl } from '../../redux/assets';
import { act, esc, keys, mon, page, ty } from '../kit';
import { phHead } from '../templates';

const fit = (t: string, room: number, big: number, small: number): number => Math.max(small, Math.min(big, Math.floor(room / Math.max(1, t.length * 0.56))));
const art = (file: string | null | undefined): string => (file ? `<div class="art" style="background-image:url(${rxUrl(file)})"></div>` : '<div class="bgk"></div>');

export interface TravelModel {
  /** The region ahead and its number in the run (2 for the second). */
  region: string;
  no: number;
  /** The run's regions in order, with the ones that are done. */
  road: readonly { name: string; done: boolean; next: boolean }[];
  tagline: string;
  /** How many regional forms live there (0: none). */
  forms: number;
  /** "What changes" rows: a name and its value. */
  facts: readonly (readonly [string, string])[];
  backdrop: string | null;
}

export function phTravel(_ph: PhantomVersion, d: TravelModel): string {
  // A long run shows the regions around the next one, so the road stays on one line.
  const at = Math.max(0, d.road.findIndex((r) => r.next)), from = Math.max(0, Math.min(at - 2, d.road.length - 4));
  const road = d.road.slice(from, from + 4).map((r) => `<span class="${r.next ? 'on' : r.done ? 'd' : ''}">${esc(r.name)}</span>`).join('<i></i>');
  return page('travel', art(d.backdrop) + '<div class="dim" style="background:linear-gradient(90deg,rgba(8,6,10,.85) 0 40%,rgba(8,6,10,.25))"></div>'
    + phHead('Next region', `Region ${d.no} · Your ticket`)
    + `<div class="tv-way ph-tv-way" aria-label="the road of this run">${from > 0 ? '<em>…</em>' : ''}${road}${from + 4 < d.road.length ? '<em>…</em>' : ''}</div>`
    + `<div class="tv-tix"><div class="tv-t on ph-tv-t" style="--i:0;--r:-2deg"${act('next')}><small>Region ${d.no} · one way</small><b style="font-size:${fit(d.region, 230, 60, 30)}px">${esc(d.region)}</b>${d.tagline ? `<p>${esc(d.tagline)}</p>` : ''}<em>${d.forms > 0 ? `${d.forms} regional ${d.forms === 1 ? 'form' : 'forms'}` : 'No regional forms'}</em><u aria-hidden="true"></u></div></div>`
    + `<div class="pn tv-next ph-tv-next"><span class="lab">What changes in region ${d.no}</span>${d.facts.map(([a, b]) => `<div class="dm-fr"><span>${esc(a)}</span><b>${esc(b)}</b></div>`).join('')}</div>`
    + keys(['Z', 'Board', 'next']) + `<div class="ph-fill"${act('next')}></div>`);
}

export interface FormsModel {
  region: string;
  /** The Pokémon that is asked about. */
  name: string;
  /** The game's own line ("Vulpix is loving the beaches of Alola. Want it to start surfing?"). */
  prompt: string;
  from: { file: string | null; types: readonly string[] };
  /** One card for each form it may take. */
  targets: readonly { name: string; file: string | null; types: readonly string[] }[];
  /** The answers: one for each form, then "Not now". */
  options: readonly { label: string; small: string }[];
  index: number;
  backdrop: string | null;
  /** How many more Pokémon are asked after this one. */
  more: number;
}

export function phForms(_ph: PhantomVersion, d: FormsModel): string {
  // The line's first sentence is the small line, the question is the big one.
  const cutAt = d.prompt.indexOf('. '), lead = cutAt > 0 ? d.prompt.slice(0, cutAt + 1) : `${d.name} can take its ${d.region} form.`, ask = cutAt > 0 ? d.prompt.slice(cutAt + 2) : d.prompt;
  const side = (cls: string, file: string | null, types: readonly string[]): string => `<div class="${cls}">${file ? mon(file, 1.4, 'ol', '', true) : '<b class="ph-de-q s">?</b>'}<div class="fm-ty">${types.map(ty).join('')}</div></div>`;
  const tilt = ['-2deg', '1deg', '-1deg'];
  const cards = d.targets.slice(0, 3).map((t, i) => `<div class="fm-c ph-fm-c" data-key="f${i}" style="--i:${i};--r:${tilt[i % 3]}">${side('fm-a', d.from.file, d.from.types)}<i aria-hidden="true"></i>${side('fm-b', t.file, t.types)}<b style="font-size:${fit(t.name, 330, 24, 15)}px">${esc(t.name)}</b></div>`).join('');
  const n = d.options.length;
  const answers = d.options.map((o, i) => `<div class="ch${i === d.index ? ' on' : ''}" data-key="a${i}" style="--i:${i}"${act('form', i, 'formOver')}><kbd>${i + 1}</kbd><b style="font-size:${fit(o.label, n > 3 ? 230 : 300, 23, 14)}px">${esc(o.label)}</b><span>${esc(o.small)}</span></div>`).join('');
  return page('forms', art(d.backdrop) + '<div class="dim" style="background:rgba(8,6,10,.6)"></div>'
    + phHead('Regional forms', `Arriving · ${d.region}`)
    + `<div class="fm-q ph-fm-q"><small>${esc(lead)}</small><span style="font-size:${fit(ask, 1050, 36, 20)}px">${esc(ask)}</span></div>`
    + `<div class="fm-row">${cards}</div><div class="fm-ch ph-fm-ch${n > 3 ? ' many' : ''}">${answers}</div>`
    + `<p class="fm-n">One free offer for each Pokémon in each region.${d.more > 0 ? ` ${d.more} more of your party ${d.more === 1 ? 'is' : 'are'} asked after this.` : ''}</p>`
    + keys(['◀▶', 'Answer'], ['Z', 'Choose', 'form', d.index], ['X', 'Not now', 'form', n - 1]));
}
