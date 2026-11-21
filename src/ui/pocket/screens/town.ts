// The Pocket look's Pocket Town (mock-up pages `pt-town`, `pt-map`, `pt-door`): the street keeps the canvas (you walk
// it) under a see-through header with the district and the time, the "Z" line for the door you face and the keys; the
// Town Map is a card per district; a door asks before you go in. It draws what TownScene hands it. Presentation only.

import type { HubTownData } from '../../../core/hubTown/schema';
import type { PocketRoad } from '../../../core/presentation/pocket';
import { monArt, pkPic, propArt } from '../art';
import type { TradeModel, TradeMon } from '../../redux/screens/stops';
import { act, esc, hdr, keys, page, type PkKey, spr } from '../kit';
import { fit, fitBody, fitPic } from '../templates';

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

/** The Trainer Plaza's districts as the mock-up draws them (`pt-plaza`). */
const PLAZA_PROP: Record<string, string> = { market: 'parasol', trading: 'board', gathering: 'fountain', social: 'bench', services: 'pc', secret: 'lamp' };
export const plazaProp = (id: string): string => PLAZA_PROP[id] ?? 'sign';
/** A prop no bigger than a box (never past its own size). */
function propIn(name: string, w: number, h: number): string {
  const a = propArt(name), c = pkPic(a);
  return spr(a, c ? Math.min(1, w / c.w, h / c.h) : 1);
}

export interface PkPlazaModel {
  /** The header's pills (money, standing). */
  pills: readonly string[];
  road: PocketRoad | null;
  districts: readonly { id: string; name: string; text: string; count: number; off: boolean }[];
  index: number;
  /** What the plaza says ('' for nothing). */
  say: string;
}

/** The Trainer Plaza (mock-up `pt-plaza`): its districts as six cards three across; Esc goes back to the map. */
export function pkPlaza(d: PkPlazaModel): string {
  const n = d.districts.length, index = Math.max(0, Math.min(n - 1, d.index));
  const head = hdr('Trainer Plaza', { area: 'town', crumb: ['Map', 'Trainer Plaza'], pills: d.pills, road: d.road });
  const cards = d.districts.map((x, i) => `<div class="pn rw39${i === index ? ' on' : ''}${x.off ? ' gx-pz-off' : ''}" data-key="pz-${x.id}"${act('pick', i, 'over')}><i>${propIn(plazaProp(x.id), 110, 112)}</i><b style="font-size:${fit(x.name, 150, 18, 13, 0.55)}px">${esc(x.name)}</b><p style="font-size:${fitBody(x.text, 150, 60, [13, 12, 11], 1.35)}px">${esc(x.text)}</p>${x.count && !x.off ? `<u class="gx-pz-n">${x.count}</u>` : ''}</div>`).join('');
  const say = d.say ? `<div class="pn gx-pz-say" data-key="pz-say"><p style="font-size:${fit(d.say, 600, 14, 11, 0.5)}px">${esc(d.say)}</p></div>` : '';
  return page('pt-plaza', 51, `<div class="scr nrun pg39" data-key="pt-plaza">${head}<div class="gr39 q3" data-key="pz-grid">${cards}</div>${say}${keys([['←→↑↓', 'district'], ['Enter', 'visit', 'pick', index], ['Esc', 'back to the map', 'pick', n]])}</div>`);
}

const tyWord = (t: readonly string[]): string => t.map((x) => x.charAt(0).toUpperCase() + x.slice(1)).join(' / ');

/** The Trade Post (mock-up `pt-trade`): what you give and what you get, the trader's line, then Trade or No thanks. */
export function pkTrade(d: TradeModel): string {
  const swapped = d.done !== null;
  const side = (label: string, m: TradeMon | null, empty: string, cls: string): string => `<div class="pn${cls}"><em>${label}</em><i>${m?.file ? fitPic(monArt(m.file), 150, 136, swapped ? 'gx-tr-pop' : '', 3) : ''}</i><b style="font-size:${fit(m?.name ?? empty, 260, 24, 14, 0.62)}px">${esc(m?.name ?? empty)}</b>${m ? `<span>Lv ${m.level} · ${esc(tyWord(m.types))}</span>` : ''}</div>`;
  const pills = [...(d.count > 1 ? [`Offer ${d.at + 1} of ${d.count}`] : []), ...(d.cost > 0 ? [`Costs ₽${d.cost.toLocaleString('en-US')}`] : []), `₽ ${d.money.toLocaleString('en-US')}`];
  const head = hdr('Trade Post', { area: 'town', crumb: ['Trainer Plaza', d.title || 'Trade Post'], pills });
  const swap = `<div class="sw39" data-key="tr-swap">${side(swapped ? 'You gave' : 'You give', d.give, 'Nothing they want', '')}<i class="ar39" data-nocheck></i>${side(swapped ? 'You got' : 'You get', d.get, 'No offers today', ' get')}</div>`;
  const line = swapped ? d.done! : d.line;
  const why = !swapped && d.verdict ? `<small class="gx-tr-why${d.bad ? ' bad' : ''}">${esc(d.verdict)}</small>` : '';
  const go = swapped
    ? `<div class="go"><div class="btn on"${act('done')}><b>OK</b></div></div>`
    : `<div class="go"><div class="btn on${d.focus === 0 ? ' gx-tr-f' : ''}${d.bad || !d.get ? ' gx-tr-off' : ''}"${act('accept', 0, 'acc')}><b>Trade</b></div><div class="btn sm${d.focus === 1 ? ' gx-tr-f' : ''}"${act('decline', 0, 'dec')}><b>No thanks</b></div></div>`;
  const talk = `<div class="tk39" data-key="tr-talk"><p><b>${esc(d.trader)}</b><span style="font-size:${fitBody(`"${line}"`, 420, 44, [15, 14, 13, 12], 1.3)}px">"${esc(line)}"</span>${why}</p>${go}</div>`;
  const ks: PkKey[] = swapped ? [['Enter', 'continue', 'done']] : [['Enter', d.focus === 1 ? 'leave' : 'trade', d.focus === 1 ? 'decline' : 'accept'], ...(d.count > 1 ? [['←→', 'next offer', 'step', 1] as PkKey] : []), ['Esc', 'leave', 'decline']];
  return page('pt-trade', 51, `<div class="scr nrun pg39 tr39" data-key="pt-trade">${head}${swap}${talk}${keys(ks)}</div>`);
}
