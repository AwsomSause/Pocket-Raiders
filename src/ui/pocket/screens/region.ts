// The Pocket look's region arrival (mock-up `region`): the region's name huge over its two colours and its map, the
// region's numbers, the Regional forms question when one of the party may change, and a bar that welcomes you with Set
// off. It shows when a run reaches a new region (MapScene, instead of the old sign) and while a form offer is open.
// Presentation only: the answer goes back to MapScene, which asks the session.

import { act, back, esc, page } from '../kit';
import { fit, fitBody } from '../templates';

/** Each region's two colours (the mock-ups' own where they give them). */
const COLOURS: Record<string, readonly [string, string]> = {
  kanto: ['#e3350d', '#2f9e44'], johto: ['#c99700', '#8d99ad'], hoenn: ['#c9302c', '#2a6fdb'], sinnoh: ['#4f7fe0', '#e07fae'],
  unova: ['#30343f', '#9aa3b5'], kalos: ['#2f66c8', '#d9468f'], alola: ['#e8791a', '#1a9aa0'], galar: ['#9b2c8f', '#2a75bb'],
  paldea: ['#b8462f', '#7a4fc8'], hisui: ['#5a6a8a', '#c9a36a'],
};
export const regionColours = (name: string): readonly [string, string] => COLOURS[name.toLowerCase().replace(/[^a-z]/g, '')] ?? ['#2a75bb', '#e3350d'];

export interface PkRegionModel {
  name: string;
  /** Its place in this run (1 for the first) and how many regions the run has. */
  no: number;
  of: number;
  tagline: string;
  /** The region's numbers as [value, word] ("30", "stops"). */
  facts: readonly (readonly [string, string])[];
  /** The welcome line; the words between ** ** are bold. */
  welcome: string;
  /** The Regional forms question: the line, the answers (the last is "Not now"), the lit one. */
  ask: { text: string; options: readonly string[]; index: number; more: number } | null;
}

export function pkRegion(d: PkRegionModel): string {
  const [r1, r2] = regionColours(d.name);
  const map = back(/kanto/i.test(d.name) ? 'packs/memories/townmap/region1.png' : 'packs/memories/townmap/region0.png', 'rg-map');
  const title = `<div class="rg-t" data-key="rg-title"><small>Region ${d.no} of ${d.of}</small><b style="font-size:${fit(d.name, 470, 150, 70, 0.62)}px">${esc(d.name)}</b>${d.tagline ? `<span style="font-size:${fit(d.tagline, 440, 18, 13, 0.52)}px">${esc(d.tagline)}</span>` : ''}</div>`;
  const stamp = `<i class="stamp big" style="--c:${r1}"><b data-nocheck style="font-size:${fit(d.name, 120, 40, 16, 0.62)}px">${esc(d.name)}</b><u data-nocheck>Region ${d.no}</u></i>`;
  const facts = `<div class="rg-facts" data-key="rg-facts">${d.facts.slice(0, 4).map(([v, w]) => `<span><b style="font-size:${fit(v, 84, 40, 22, 0.6)}px">${esc(v)}</b>${esc(w)}</span>`).join('')}</div>`;
  const a = d.ask;
  const ask = a ? `<div class="rg-ask pn" data-key="rg-ask"><b>Regional forms</b><span style="font-size:${fitBody(a.text, 294, 76, [13.5, 12.5, 11.5], 1.4)}px">${esc(a.text)}</span><span class="seg gx-rg-seg">${a.options.map((o, i) => `<i class="${i === a.index ? 'on' : ''}" style="font-size:${fit(o, a.options.length > 2 ? 90 : 140, 14, 10, 0.55)}px" data-key="rg-opt-${i}"${act('form', i, 'formOver')}>${esc(o)}</i>`).join('')}</span>${a.more > 0 ? `<small class="gx-rg-more">${a.more} more of your party after this</small>` : ''}</div>` : '';
  const say = esc(d.welcome).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  const word = a ? 'Choose' : 'Set off';
  const go = a ? act('form', a.index) : act('regionGo');
  const bar = `<div class="vs-say" data-key="rg-say"><p style="font-size:${fitBody(d.welcome, 700, 52, [18, 16, 14], 1.35)}px">${say}</p><div class="btn on nx"${go}><b>${word}</b></div></div>`;
  return page('region', 26, `<div class="scr rg" style="--r1:${r1};--r2:${r2}" data-key="region">${map}<i class="rg-a"></i><i class="rg-b"></i>${title}${stamp}${facts}${ask}${bar}</div>`);
}
