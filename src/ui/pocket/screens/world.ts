// The Pocket look's World Tour (mock-up `world`) and Badge Case (mock-up `badges`), opened from the stage map (M and G,
// or a click on the Gym card). The World Tour is a card per region of this run in order: where you are, the next one,
// the ones ahead (their level cap and boss powers). The Badge Case is this region's Gyms as discs (won, next, not met
// yet), the lit one's card, and the Pokémon League. They draw what MapScene hands them. Presentation only.

import type { Art } from '../../redux/templates';
import { badgeArt } from '../art';
import { act, esc, hdr, keys, page, sprH } from '../kit';
import type { PocketRoad } from '../../../core/presentation/pocket';
import { regionColours } from './region';
import { leaderLine } from './run';
import { hallTag } from './hall';
import { fit, fitBody, pkArtOf } from '../templates';

const cap = (t: string): string => t.charAt(0).toUpperCase() + t.slice(1);

export interface PkWorldModel {
  regions: readonly { name: string; tagline: string; /** "Cap 150 · 1 boss power". */ small: string; state: 'done' | 'now' | 'next' | 'ahead' }[];
  /** "12 of 30": where you stand in the region you are in. */
  here: string;
  cap: number;
  road: PocketRoad | null;
  index: number;
}

export function pkWorld(d: PkWorldModel): string {
  const n = d.regions.length, at = d.regions.findIndex((r) => r.state === 'now');
  const head = hdr('World Tour', { area: 'map', crumb: ['Map', 'World Tour'], pills: [`Region ${at + 1} of ${n}`, `Level cap ${d.cap}`], road: d.road });
  // Nine cards a page (three by three); the page that holds the lit card.
  const first = Math.floor(Math.max(0, d.index) / 9) * 9;
  const cards = d.regions.slice(first, first + 9).map((r, k) => {
    const i = first + k, [r1, r2] = regionColours(r.name);
    const em = r.state === 'now' ? `You are here · ${d.here}` : r.state === 'next' ? 'Next region' : r.state === 'done' ? 'Cleared' : `Region ${i + 1}`;
    return `<div class="wt ${r.state === 'done' ? 'gx-wt-done' : r.state}${i === d.index ? ' on gx-wt-on' : ''}" style="--r1:${r1};--r2:${r2}" data-key="wt-${i}"${act('popPick', i)}><i class="wt-liv"></i><i class="stamp" style="--c:${r1}"><b data-nocheck style="font-size:${fit(r.name, 58, 18, 9, 0.62)}px">${esc(r.name)}</b><u data-nocheck>Region ${i + 1}</u></i><div class="wt-b"><em>${esc(em)}</em><b style="font-size:${fit(r.name, 150, 30, 16, 0.6)}px">${esc(r.name)}</b>${r.tagline ? `<span style="font-size:${fit(r.tagline, 160, 13, 10, 0.5)}px">${esc(r.tagline)}</span>` : ''}<small style="font-size:${fitBody(r.small, 160, 30, [12, 11, 10], 1.25)}px">${esc(r.small)}</small></div></div>`;
  }).join('');
  return page('world', 26, `<div class="scr world" data-key="world">${head}<i class="wm17" data-nocheck>World</i><div class="wt-grid" data-key="wt-grid">${cards}</div>${keys([['←→↑↓', 'look around'], ['Esc', 'back', 'pop']])}</div>`);
}

export interface PkBadgeSlot {
  /** null: a Gym not met yet (the game picks each Gym Leader when its stage begins). */
  name: string | null;
  type: string;
  state: 'got' | 'next' | 'later';
  art: Art | null;
  /** The types that hit this Gym hard. */
  weak: readonly string[];
}

export interface PkBadgesModel {
  region: string;
  slots: readonly PkBadgeSlot[];
  index: number;
  /** Stops to the next Gym (0: it is the next stop or the League stands). */
  stops: number;
  badges: number;
  cap: number;
  road: PocketRoad | null;
  league: { size: number; faces: readonly (Art | null)[]; champion: Art | null };
}

export function pkBadges(d: PkBadgesModel): string {
  const n = d.slots.length, at = Math.max(0, Math.min(n - 1, d.index)), s = d.slots[at];
  const head = hdr('Badge Case', { area: 'card', crumb: ['Map', 'Badges'], pills: [`Badges ${d.badges}`, `Level cap ${d.cap}`], road: d.road });
  const disc = (b: PkBadgeSlot, i: number): string => `<div class="bc ${b.state === 'got' ? 'got' : b.state === 'next' ? 'next' : ''}${i === at ? ' gx-bc-on' : ''}" style="--t:${hallTag(b.type)}" data-key="bc-${i}"${act('popPick', i)}><i>${b.type ? sprH(badgeArt(b.type), 44) : '<u class="gx-bc-q">?</u>'}</i><b style="font-size:${fit(b.name ?? '???', 90, 14, 10, 0.6)}px">${esc(b.name ?? '???')}</b><span>${esc(b.type ? cap(b.type) : 'Not met yet')}</span></div>`;
  const tip = (t: string): string => `<span class="ty" style="--t:${hallTag(t)}">${sprH(badgeArt(t), 16)}${esc(cap(t))}</span>`;
  const em = !s ? '' : s.state === 'got' ? 'Badge won' : s.state === 'next' ? (d.stops > 0 ? `Next gym · in ${d.stops} ${d.stops === 1 ? 'stop' : 'stops'}` : 'Next gym') : 'Later in this region';
  const body = !s ? '' : s.name
    ? `<b style="font-size:${fit(s.name, 380, 46, 24, 0.6)}px">${esc(s.name)}</b><span>${esc(`${d.region} Gym${s.type ? ` · ${cap(s.type)} type` : ''}`)}</span><p>${esc(s.state === 'got' ? 'You beat this Gym. Its badge is in your case.' : `${s.state === 'next' ? 'Its ace is announced when it comes out. ' : ''}${leaderLine([], s.weak).replace(' hard.', ' hard here.')}`)}</p>${s.weak.length && s.state !== 'got' ? `<div class="bc-tip">${s.weak.slice(0, 3).map(tip).join('')}<i>good picks</i></div>` : ''}`
    : `<b>???</b><span>${esc(`${d.region} Gym`)}</span><p>This Gym Leader is chosen when the stage begins. Clear the Gym before it to meet them.</p>`;
  const next = s ? `<div class="bc-next pn" style="--t:${hallTag(s.type)}" data-key="bc-card">${s.art && s.name ? `<i class="bc-ldr">${sprH(pkArtOf(s.art), 220)}</i>` : ''}<div><em>${esc(em)}</em>${body}</div></div>` : '';
  const face = (a: Art | null, champ = false): string => `<i class="${champ ? 'champ' : ''}">${a ? sprH(pkArtOf(a), champ ? 64 : 50) : ''}</i>`;
  const L = d.league;
  const league = `<div class="bc-league pn" data-key="bc-league"><b>Pokémon League</b><div class="bc-e4">${Array.from({ length: L.size }, (_, k) => face(L.faces[k] ?? null)).join('')}${face(L.champion, true)}</div><span>Opens with ${n} ${n === 1 ? 'badge' : 'badges'}. ${L.size === 1 ? 'One battle' : `${cap(numberWord(L.size))} in a row`}, then the Champion.</span></div>`;
  return page('badges', 26, `<div class="scr badges" data-key="badges">${head}<i class="wm17" data-nocheck>Badge</i><div class="bc-case pn" style="grid-template-columns:repeat(${Math.max(1, n)},1fr)" data-key="bc-case">${d.slots.map(disc).join('')}</div>${next}${league}${keys([['←→', 'badge'], ['Esc', 'back', 'pop']])}</div>`);
}

const numberWord = (n: number): string => ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][n] ?? `${n}`;
