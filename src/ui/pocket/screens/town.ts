// The Pocket look's Pocket Town (mock-up pages `pt-town`, `pt-map`, `pt-door`): the street keeps the canvas (you walk
// it) under a see-through header with the district and the time, the "Z" line for the door you face and the keys; the
// Town Map is a card per district; a door asks before you go in. It draws what TownScene hands it. Presentation only.

import type { HubTownData } from '../../../core/hubTown/schema';
import { pkPic, propArt } from '../art';
import { act, esc, hdr, keys, page, type PkKey, spr } from '../kit';
import { fit, fitBody } from '../templates';

/** Each district's picture on the Town Map (the mock-up's own). */
const DISTRICT_PROP: Record<string, string> = { training: 'dojo', culture: 'memories', home: 'cherry', play: 'parasol', plaza: 'fountain' };
export const districtProp = (id: string): string => DISTRICT_PROP[id] ?? 'house_b';

const NOT_A_BUILDING = /^(pine|tree|cherry|pinktree|lamp|bench|fence|planter|sign|mailbox|bust|well|banner|statue|smallpool|pool|parasol|fountain)/;
/** The building that draws a place: the prop whose foot is at the door's row, nearest across (null: none near). */
export function placeProp(map: Pick<HubTownData, 'props' | 'tile'>, door: { x: number; y: number }): string | null {
  const t = map.tile, px = door.x * t + t / 2, foot = (door.y + 1) * t;
  let best: string | null = null, gap = Infinity;
  for (const [frame, x, , depth] of map.props) {
    if (NOT_A_BUILDING.test(frame) || Math.abs(depth - foot) > 72) continue;
    const d = Math.abs(x + 90 - px);
    if (d < gap) { gap = d; best = frame; }
  }
  return gap <= 140 ? best : null;
}

export interface PkTownHudModel {
  /** "Evening". */
  time: string;
  /** The district you stand in ('' between them). */
  district: string;
  /** The door or person you face: "Enter" / "Talk", the name, its line. */
  prompt: { verb: string; name: string; text: string } | null;
}

/** The street's header, the line for what you face, and the keys (over the canvas). */
export function pkTownHud(d: PkTownHudModel): string {
  const head = hdr('Pocket Town', { area: 'town', crumb: ['Hub', 'Pocket Town'], pills: [d.time, ...(d.district ? [d.district] : [])] });
  const p = d.prompt;
  const zp = p ? `<div class="zp39" data-key="pt-z"${act('townZ')}><kbd>Z</kbd><b style="font-size:${fit(p.name, 360, 15, 11, 0.6)}px">${esc(p.name)}</b><span style="font-size:${fitBody(p.text, 380, 17, [12, 11, 10], 1.3)}px">${esc(p.text)}</span></div>` : '';
  const ks: PkKey[] = [['←→↑↓', 'walk'], ['Z', p ? p.verb.toLowerCase() : 'enter', 'townZ'], ['M', 'town map', 'townMap'], ['Esc', 'menu', 'townMenu']];
  return page('pt-town', 51, `<div class="scr pt39 gx-pt-hud" data-key="pt-town">${head}${zp}${keys(ks)}</div>`, true);
}

export interface PkTownMapModel {
  districts: readonly { id: string; name: string; text: string; color: string }[];
  index: number;
  /** The district you stand in (-1: none). */
  here: number;
}

/** The Town Map: one card per district, the lit one walks you there. */
export function pkTownMap(d: PkTownMapModel): string {
  const n = d.districts.length, index = Math.max(0, Math.min(n - 1, d.index));
  const head = hdr('Town Map', { area: 'town', crumb: ['Pocket Town', 'Town Map'], pills: [`${n} districts`] });
  const cards = d.districts.map((x, i) => `<div class="pn${i === index ? ' on' : ''}" style="--c:${x.color}" data-key="pt-d-${x.id}"${act('mapPick', i, 'mapOver')}><i>${spr(propArt(districtProp(x.id)), 0.5)}</i><b style="font-size:${fit(x.name, 168, 18, 13, 0.52)}px">${esc(x.name)}</b><p style="font-size:${fitBody(x.text, 150, 40, [13, 12, 11], 1.35)}px">${esc(x.text)}</p>${i === d.here ? '<u>You are here</u>' : ''}</div>`).join('');
  return page('pt-map', 51, `<div class="scr nrun pg39" data-key="pt-map">${head}<div class="gr39 q${Math.min(5, Math.max(1, n))}" data-key="pt-grid">${cards}</div>${keys([['←→', 'district'], ['Enter', 'walk there', 'mapPick', index], ['Esc', 'back', 'mapBack']])}</div>`);
}

export interface PkTownDoorModel { district: string; name: string; text: string; prop: string | null; /** Why it is shut, or null. */ shut: string | null }

/** At a door: the building, what it is, and Go in or Keep walking. */
export function pkTownDoor(d: PkTownDoorModel): string {
  // The building as large as the mock-up's (one and a half times), smaller when it is a tall one.
  const a = propArt(d.prop ?? 'house_b'), c = pkPic(a), pic = spr(a, c ? Math.min(1.5, 250 / c.h, 260 / c.w) : 1);
  const line = d.shut ?? 'Nothing here changes your run.';
  return page('pt-door', 51, `<div class="scr pt39 dr39 gx-pt-door" data-key="pt-door"><i class="dim39" data-nocheck${act('doorBack')}></i><div class="dc39 pn"><i>${pic}</i><div><em>${esc(d.district || 'Pocket Town')}</em><b style="font-size:${fit(d.name, 360, 34, 20, 0.6)}px">${esc(d.name)}</b><p style="font-size:${fitBody(d.text, 360, 48, [17, 15, 14, 13], 1.35)}px">${esc(d.text)}</p><span>${esc(line)}</span><div class="go"><div class="btn on${d.shut ? ' gx-bl-off' : ''}"${act('doorGo')}><b>Go in</b></div><div class="btn sm"${act('doorBack')}><b>Keep walking</b></div></div></div></div>${keys([['Z', 'go in', 'doorGo'], ['Esc', 'keep walking', 'doorBack']])}</div>`, true);
}
