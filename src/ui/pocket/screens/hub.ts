// The Pocket look's Hub Town (mock-up page `hub`): a street of the town's buildings over the grass, the Route Gate's
// plaque over the arch, the Trainer's card, the party walking the sand and a row of doors along the bottom. The doors
// are the Hub dock's buttons (its two tabs: Town and Last run); the buildings over them light with the lit door.
// It draws what HubScene hands it. Presentation only.

import type { PocketRoad } from '../../../core/presentation/pocket';
import { followerUrl, frontArt, type PkArt, propArt, walkerUrl } from '../art';
import { act, back, esc, hdr, keys, page, type PkKey, ribbon, spr, sprH } from '../kit';
import { fit } from '../templates';

export interface PkHubDoor { label: string; /** A red count on the door (trainers ready to claim, events on now). */ count?: number }
export interface PkHubModel {
  money: string;
  rank: string;
  tabs: readonly string[];
  tab: number;
  doors: readonly PkHubDoor[];
  index: number;
  hero: { art: PkArt | null; name: string; tag: string; /** "Kanto · Stop 12 of 30" for a saved run, else ''. */ where: string };
  /** The Route Gate: "30 stops · 8 Gyms" and the saved run's road (null: a fresh one of `stops`). */
  gate: { line: string; road: PocketRoad | null; stops: number };
  /** The saved run's party as walking sheets (`PIKACHU`), last first; empty without a run. */
  walkers: readonly { sheet: string; ko: boolean }[];
  /** Notices on the board (game events on now). */
  notices: number;
  /** What the town says ('' for nothing): a rival's line, trainers ready to claim. */
  say: string;
}

/** The street: which building stands for which door, where (the mock-up's own places), and its side for the label. */
const STREET: readonly { door: string; prop: string; left: number; side?: 'l' | 'r' }[] = [
  { door: 'Events', prop: 'eventhall', left: -70, side: 'l' },
  { door: 'Trainers', prop: 'achv', left: 132 },
  { door: 'New Run', prop: 'arch', left: 368 },
  { door: 'Unlocks', prop: 'bank', left: 624 },
  { door: 'Town', prop: 'memories', left: 828, side: 'r' },
];
/** The small line under each door's name. */
const DOOR_SUB: Record<string, string> = {
  Settings: 'Sound, display', Trainers: 'Who you play as', 'New Run': 'Fresh journey', Events: 'On this week', Unlocks: 'Bank, research, moves',
  Town: 'Walk the town', 'Hall of Fame': 'Past champions', Team: 'Your last team', 'Run History': 'Every run so far', Memories: 'Moments kept',
  Moments: 'What you have seen', Seeds: 'Play a seed again',
};
export const doorSub = (label: string): string => DOOR_SUB[label] ?? '';

export function pkHub(d: PkHubModel): string {
  const n = d.doors.length, index = Math.max(0, Math.min(n - 1, d.index));
  const lit = d.doors[index]?.label ?? '';
  const town = d.tab === 0;
  const doorAt = (label: string): number => (town ? d.doors.findIndex((x) => x.label === label) : -1);
  const head = hdr('Hub Town', { area: 'town', pills: [d.rank, d.money] });
  const street = STREET.map((b) => {
    const k = doorAt(b.door);
    return `<div class="bld ${b.side ?? ''}${town && lit === b.door ? ' on' : ''}" style="left:${b.left}px" data-key="hub-b-${b.prop}"${k >= 0 ? act('pick', k, 'over') : ''}>${spr(propArt(b.prop), 1)}<span class="bld-s">${esc(b.door)}</span></div>`;
  }).join('');
  const props = [spr(propArt('lamp'), 1, 'tw-p', 'left:330px'), spr(propArt('lamp'), 1, 'tw-p', 'left:598px'), spr(propArt('bench'), 1, 'tw-p', 'left:22px;bottom:150px'), spr(propArt('sign'), 1, 'tw-p', 'left:800px')].join('');
  const road = d.gate.road ?? { n: d.gate.stops, at: 0, gyms: [] };
  const run = doorAt('New Run');
  const plaque = `<div class="plaque" data-key="hub-gate"${run >= 0 ? act('pick', run) : act('tab', 0)}><em>Route Gate</em><b>New Run</b><span style="font-size:${fit(d.gate.line, 220, 13, 10, 0.55)}px">${esc(d.gate.line)}</span>${ribbon(road, 'pq')}</div>`;
  const card = `<div class="hb-card" data-key="hub-card"${act('card')}><i>${d.hero.art ? sprH(d.hero.art, 90) : ''}</i><b style="font-size:${fit(d.hero.name, 200, 22, 14, 0.55)}px">${esc(d.hero.name)}</b><span>${esc(d.hero.tag)}</span><em>${esc(d.hero.where || 'Trainer Card')}</em></div>`;
  const walk = d.walkers.length ? `<div class="walkrow">${d.walkers.slice(0, 6).map((w) => `<i class="wk ${w.ko ? 'ko' : ''}" style="--s:1;--d:2;background-image:url(${followerUrl(w.sheet)});"></i>`).join('')}</div>` : '';
  const npcs = `<i class="wk npc" style="--s:1;--d:1;background-image:url(${walkerUrl('NPC_B2W2_Lass')});left:742px;top:392px"></i><i class="wk npc idle" style="--s:1;--d:0;background-image:url(${walkerUrl('NPC_B2W2_Youngster')});left:96px;top:386px"></i>`;
  const tabs = d.tabs.length > 1 ? `<div class="gx-hb-tabs" data-key="hub-tabs">${d.tabs.map((t, k) => `<span class="${k === d.tab ? 'on' : ''}"${act('tab', k)}>${esc(t)}</span>`).join('')}</div>` : '';
  const doors = `<div class="doors" data-key="hub-doors">${d.doors.map((x, k) => `<div class="door${k === index ? ' on' : ''}" data-key="hub-d-${k}"${act('pick', k, 'over')}><b style="font-size:${fit(x.label, 104, 15, 11, 0.55)}px">${esc(x.label)}${x.count ? `<u>${x.count}</u>` : ''}</b><span>${esc(doorSub(x.label))}</span></div>`).join('')}</div>`;
  const ks: PkKey[] = [['←→', 'walk the street'], ['↓', d.tabs[(d.tab + 1) % Math.max(1, d.tabs.length)] ?? 'tab', 'tab', (d.tab + 1) % Math.max(1, d.tabs.length)], ['Enter', 'go in', 'pick', index], ['Esc', 'title', 'back']];
  const news = `<div class="news23 hb" data-key="hub-news"${act('news')}><b>Notice board</b>${d.notices ? `<u>${d.notices}</u>` : ''}</div>`;
  const say = d.say ? `<div class="pn gx-hb-say" data-key="hub-say">${sprH(frontArt(479), 34)}<p style="font-size:${fit(d.say, 520, 14, 11, 0.5)}px">${esc(d.say)}</p></div>` : '';
  const deco = '<i class="glow21" data-nocheck style="left:282px"></i><i class="glow21" data-nocheck style="left:550px"></i><i class="stars21" data-nocheck></i><i class="bunt22 hb a" data-nocheck></i><i class="bunt22 hb b" data-nocheck></i><i class="cf22 hb" data-nocheck></i><i class="em24 hb" data-nocheck style="--z:44px"></i>';
  return page('hub', 26, `<div class="scr hb26 hb25 hb24 hb23 hb22 hb21 hb16 hb15 hb14 hb13 hub tw11" data-key="hub">${back('ui/pocket/town-ground.png', 'tw-bg')}${head}${street}${props}${plaque}${card}${walk}${npcs}${tabs}${doors}${keys(ks)}${news}${say}${deco}</div>`);
}
