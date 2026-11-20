// The Pocket look's Trainer Card (mock-up page `tcard`): the card itself at the left (red top with the ID number, the
// Trainer's picture, six facts, the eight badge discs lit for the badges won) and a side panel with the rest of the
// record. The same page shows the run card at the end of a run and the Code Name card. It draws what the hub's
// Trainer Card room, the run's end and the event hand it (ui/redux/screens/over.ts). Presentation only.

import type { RunCardModel } from '../../redux/screens/over';
import { badgeArt, monArt } from '../art';
import { act, esc, hdr, keys, page, type PkKey } from '../kit';
import { fit, fitBody, fitPic, pkArtOf } from '../templates';

/** The badge on each of the eight discs: Kanto's Gyms in order (rock, water, electric, grass, poison, psychic, fire, ground). */
export const CARD_BADGES = ['rock', 'water', 'electric', 'grass', 'poison', 'psychic', 'fire', 'ground'] as const;

/** "Rank 4" as a fact (Rank, 4); any other tag ("Win") as how the run went. */
export const rankFact = (rank: string): readonly [string, string] => {
  const m = /^(rank)\s+(.+)$/i.exec(rank.trim());
  return m ? ['Rank', m[2]!] : ['Outcome', rank];
};

export function pkCard(d: RunCardModel): string {
  const lit = Math.max(0, Math.min(8, Math.floor(d.badges)));
  const all = [['Name', d.name] as const, rankFact(d.rank), ...d.facts];
  const grid = all.slice(0, 6), more = all.slice(6);
  const cell = ([l, v]: readonly [string, string]): string => `<p><span>${esc(l)}</span><b style="font-size:${fit(v, 180, 24, 14, 0.6)}px">${esc(v)}</b></p>`;
  const tap = d.save === false ? (d.tap ? act(d.tap) : '') : act('save');
  const card = `<div class="tkcard" data-key="tc-card"${tap}><div class="tk-top"><b>${esc(d.title)}</b>${d.id ? `<span>ID No. ${esc(d.id)}</span>` : ''}</div>`
    + `<div class="tk-photo">${fitPic(pkArtOf(d.trainer), 160, 236, '', 2)}</div>`
    + `<div class="tk-f">${grid.map(cell).join('')}</div>`
    + `<div class="tk-badges" data-key="tc-badges">${CARD_BADGES.map((t, k) => `<i class="${k < lit ? 'got' : ''}">${fitPic(badgeArt(t), 32, 32, '', 1)}</i>`).join('')}</div><i class="kc-foil"></i></div>`;
  const team = d.team.filter((f): f is string => !!f);
  const button = d.save !== false ? `<div class="btn on sm"${act('save')}><b>Save as picture</b></div>` : d.tap ? `<div class="btn on sm"${act(d.tap)}><b>Next</b></div>` : '';
  const side = `<div class="tk-side pn" data-key="tc-side"><b>${esc(d.sideTitle ?? (d.area === 'hub' ? 'Record' : 'This run'))}</b>${more.map(([l, v]) => `<p><span>${esc(l)}</span><u style="font-size:${fit(v, 200, 14, 10, 0.55)}px">${esc(v)}</u></p>`).join('')}`
    + '<i class="gx-tc-gap"></i>' + (team.length ? `<div class="gx-tc-team">${team.slice(0, 6).map((f) => fitPic(monArt(f), 48, 44, '', 1)).join('')}</div>` : '')
    + `${button}${d.text ? `<small class="gx-tc-say" style="font-size:${fitBody(d.text, 300, 40, [13, 12, 11, 10], 1.3)}px">${esc(d.text)}</small>` : ''}</div>`;
  const ks: PkKey[] = d.hints.map(([k, t]) => [k, t, k === 'Esc' ? 'back' : k === 'Enter' ? (d.save === false ? d.tap : 'save') : undefined] as const);
  return page('tcard', 26, `<div class="scr tcp" style="--c:#e3350d" data-key="tcard">${hdr(d.title, { area: 'card', crumb: [d.area === 'hub' ? 'Menu' : 'Records', d.title] })}${card}${side}${keys(ks)}</div>`);
}
