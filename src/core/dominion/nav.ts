// DOMINION slice D28 (round-4 mockups m5-m7, plans/evil-mode-rework/mockups-v4 interval 3): getting around. The list of
// Dominion pages, the Boss's board (the page map: one pinned photo per page, red string for the normal way between
// pages, gold dashed string for the Boss Menu), the eight places on the hold-Q command wheel, the "last pages" list and
// what waits on each place. Pure: no Phaser, no DOM, no random stream, nothing saved. The scene does the jumping.

import { waiting as deskWaiting } from './desk';
import { DOMINION_DATA } from './data';
import type { DominionBlock } from './schema';

/** Every Dominion page a player can be on (the scene maps its screens and controllers onto these). */
export const PAGE_IDS = [
  'title', 'menu', 'settings', 'hq', 'morning', 'assign', 'crew', 'ledger', 'rotom', 'map', 'district', 'card', 'takeover', 'chair',
  'base', 'rival', 'hero', 'voices', 'founding', 'persona', 'pyramid', 'squads', 'reserve', 'desk', 'interrupt', 'police', 'debate', 'spy',
  // D15: the Empire across regions.
  'empire',
  // D16: Snagem and Cipher.
  'partners',
] as const;
export type PageId = (typeof PAGE_IDS)[number];

/** How a page is reached: `jump` (the board and the wheel take you there) or `comes` (the game brings it: the Hero
 *  stepping in, police questioning, a Debate, a Confront; nobody walks into those). */
export type Reach = 'jump' | 'comes';

export interface Pin {
  id: PageId;
  /** Board sheet: 0 = the main routes (mockup m5 exactly), 1 = the back rooms (the pages built after the mockup). */
  sheet: 0 | 1;
  x: number; y: number; r: number;
  icon: string; name: string; how: string;
  cls: '' | 'new' | 'gold new';
  reach: Reach;
}

const P = (id: PageId, sheet: 0 | 1, x: number, y: number, r: number, icon: string, name: string, how: string, cls: Pin['cls'] = '', reach: Reach = 'jump'): Pin =>
  ({ id, sheet, x, y, r, icon, name, how, cls, reach });

/** The board's photos. Sheet 0 is mockup m5 (positions, tilts, icons and words as drawn). */
export const PINS: readonly Pin[] = [
  P('title', 0, 30, 70, -3, 'i-leaders_crest', 'Title', 'start'),
  P('menu', 0, 428, 66, 2, 'g-relic-crown', 'Boss Menu', 'Esc, anywhere', 'gold new'),
  P('settings', 0, 800, 70, -2, 'g-scope-lens', 'Settings', 'from the Menu', 'gold new'),
  P('hq', 0, 30, 222, 3, 'g-card-key', 'HQ', 'tab 1'),
  P('morning', 0, 182, 210, -2, 'g-calendar', 'Morning', 'each day'),
  P('assign', 0, 334, 222, 2, 'c-mina', 'Assign', 'Enter on a grunt', 'new'),
  P('crew', 0, 486, 210, -3, 'g-fame-checker', 'Crew File', 'tab 3'),
  P('ledger', 0, 638, 222, 2, 'g-journal', 'Ledger', 'tab 6 or L'),
  P('rotom', 0, 800, 214, -2, 'p-rotom', 'Rotom', 'from Settings'),
  P('map', 0, 40, 372, 2, 'g-town-map', 'Region Map', 'tab 2'),
  P('district', 0, 190, 382, -3, 'g-bicycle', 'District', 'click a town', 'new'),
  P('card', 0, 340, 372, 3, 'g-member-card', 'Action Card', 'pick an action'),
  P('takeover', 0, 490, 382, -2, 'g-relic-statue', 'Takeover', 'control 50+'),
  P('chair', 0, 640, 372, 2, 't-petrel', 'The Chair', 'every evening'),
  // Sheet 1, the back rooms: same grid, same string rules.
  P('base', 1, 30, 70, -3, 'g-storage-key', 'HQ menu', 'B on the HQ'),
  P('rival', 1, 182, 66, 2, 'g-vs-seeker', 'Rival File', 'R on the HQ'),
  P('hero', 1, 334, 70, -2, 'g-badgecard', 'Hero file', 'H'),
  P('voices', 1, 486, 66, 3, 'g-mic', 'Voices', 'V, evenings'),
  P('founding', 1, 638, 70, -2, 'g-idcard', 'Founding', 'O'),
  P('desk', 1, 800, 66, 2, 'p-rotom', 'Rotom desk', 'I, by day'),
  P('hq', 1, 30, 222, 3, 'g-card-key', 'HQ', 'tab 1'),
  P('crew', 1, 182, 210, -2, 'g-fame-checker', 'Crew File', 'tab 3'),
  P('persona', 1, 334, 222, 2, 'g-silph-scope', 'Personality', 'C on the Crew File'),
  P('pyramid', 1, 486, 210, -3, 'g-dark-gem', 'Pyramid', 'P on the Crew File'),
  P('squads', 1, 638, 222, 2, 'g-black-belt', 'Squads', 'U on the Crew File'),
  P('reserve', 1, 800, 214, -2, 'g-ball', 'Reserve', 'tab 4'),
  P('interrupt', 1, 40, 372, 2, 'g-dire-hit', 'Hero steps in', 'comes to you', '', 'comes'),
  P('police', 1, 190, 382, -3, 't-policeman', 'Questioning', 'comes to you', '', 'comes'),
  P('debate', 1, 340, 372, 3, 'g-letter', 'Debate', 'comes to you', '', 'comes'),
  P('spy', 1, 490, 382, -2, 'g-devon-scope', 'Confront', 'comes to you', '', 'comes'),
  P('empire', 1, 640, 372, 2, 'g-xtransceiver', 'Empire', 'G'),
  P('partners', 1, 790, 382, -3, 'g-smoke-ball', 'Partners', 'J, a Syndicate'),
];

export interface Edge { sheet: 0 | 1; a: PageId; b: PageId; gold: boolean; label: string }
const E = (sheet: 0 | 1, a: PageId, b: PageId, gold: boolean, label = ''): Edge => ({ sheet, a, b, gold, label });

/** Red string: the normal way between pages. Gold dashed string: the Boss Menu. Sheet 0 is m5's EDGES. */
export const EDGES: readonly Edge[] = [
  E(0, 'title', 'hq', false, 'New run'), E(0, 'hq', 'morning', false), E(0, 'morning', 'assign', false, 'Enter'), E(0, 'hq', 'map', false, 'Tab 2'),
  E(0, 'map', 'district', false), E(0, 'district', 'card', false, '1–9'), E(0, 'card', 'takeover', false), E(0, 'morning', 'chair', false, 'day ends'),
  E(0, 'hq', 'crew', false), E(0, 'crew', 'ledger', false), E(0, 'menu', 'settings', true, 'S'), E(0, 'settings', 'rotom', true),
  E(0, 'menu', 'hq', true, 'Esc'), E(0, 'menu', 'morning', true), E(0, 'menu', 'assign', true), E(0, 'menu', 'crew', true),
  // Sheet 1: each row is a chain of neighbours; the tag is the key that opens the next page (top row: keys on the HQ,
  // middle row: keys on the Crew File), so the strings stay short and readable.
  E(1, 'hq', 'base', false, 'B'), E(1, 'base', 'rival', false, 'R'), E(1, 'rival', 'hero', false, 'H'), E(1, 'hero', 'voices', false, 'V'),
  E(1, 'voices', 'founding', false, 'O'), E(1, 'founding', 'desk', false, 'I'), E(1, 'hq', 'crew', false, 'Tab 3'), E(1, 'crew', 'persona', false, 'C'),
  E(1, 'persona', 'pyramid', false, 'P'), E(1, 'pyramid', 'squads', false, 'U'), E(1, 'squads', 'reserve', false, 'Tab 4'),
  E(1, 'reserve', 'empire', false, 'G'), E(1, 'empire', 'partners', false, 'J'),
];

export const SHEETS = ['the main routes', 'the back rooms'] as const;

/** Page names for the shutter, the hub and the last-pages list. */
export const PAGE_NAMES: Record<PageId, string> = {
  title: 'Title', menu: 'Boss Menu', settings: 'Settings', hq: 'HQ', morning: 'Morning report', assign: 'Assign', crew: 'Crew File',
  ledger: 'Ledger', rotom: 'Rotom', map: 'Region Map', district: 'District file', card: 'Action Card', takeover: 'Takeover', chair: 'The Chair',
  base: 'HQ menu', rival: 'Rival File', hero: 'Hero file', voices: 'Voices', founding: 'Founding', persona: 'Personality', pyramid: 'Pyramid',
  squads: 'Squads', reserve: 'Reserve', desk: 'Rotom desk', interrupt: 'Hero steps in', police: 'Questioning', debate: 'Debate', spy: 'Confront',
  empire: 'Empire', partners: 'Partners',
};

/** Pages a player can be sent to (the board's photos and the wheel's lists take you there). */
export const jumpable = (p: PageId): boolean => PINS.some((x) => x.id === p && x.reach === 'jump');

/** The page a wheel place or a board photo actually opens (Morning, Assign and The Chair are the HQ at that time of
 *  day; the District file and the Action Card live on the Region Map until D29 splits them out; Takeover is a card). */
export const OPENS: Partial<Record<PageId, PageId>> = { morning: 'hq', chair: 'hq', card: 'map', takeover: 'map' };

// ---------- the command wheel (m6) ----------

export interface Spot { id: PageId | 'ops'; icon: string; name: string; key: string; tab: number | null }
/** Eight places clockwise from the top (m6's WO): the six tabs keep their number keys, Rotom is R, the Boss Menu Esc. */
export const SPOTS: readonly Spot[] = [
  { id: 'hq', icon: 'g-card-key', name: 'HQ', key: '1', tab: 0 },
  { id: 'map', icon: 'g-town-map', name: 'Region Map', key: '2', tab: 1 },
  { id: 'crew', icon: 'g-fame-checker', name: 'Roster', key: '3', tab: 2 },
  { id: 'reserve', icon: 'g-ball', name: 'Pokémon', key: '4', tab: 3 },
  { id: 'ops', icon: 'g-machine-part', name: 'Operations', key: '5', tab: 4 },
  { id: 'ledger', icon: 'g-journal', name: 'Ledger', key: '6', tab: 5 },
  { id: 'rotom', icon: 'p-rotom', name: 'Rotom', key: 'R', tab: null },
  { id: 'menu', icon: 'g-relic-crown', name: 'Boss Menu', key: 'Esc', tab: null },
];

/** ◀ ▶ (and ▲ ▼) turn the pointer one place; from nothing they start at the place you are on (or the top). */
export function turn(at: number | null, dir: -1 | 1, here: number | null): number {
  if (at === null) return here ?? 0;
  return (at + dir + SPOTS.length) % SPOTS.length;
}

/** The place a pointer offset (dx, dy from the wheel's centre) points at; inside the hub it points at nothing. */
export function spotAt(dx: number, dy: number, hub: number): number | null {
  if (Math.hypot(dx, dy) < hub) return null;
  const deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90; // 0 at the top, clockwise
  return Math.round((((deg % 360) + 360) % 360) / 45) % SPOTS.length;
}

/** The spot a page sits under (Morning is the HQ, the Pyramid the Roster...), for the pointer's starting place. */
export function spotOf(p: PageId | null): number | null {
  if (!p) return null;
  const home: Partial<Record<PageId, PageId>> = { ...OPENS, assign: 'hq', district: 'map', base: 'hq', rival: 'hq', hero: 'hq', voices: 'hq', founding: 'hq', empire: 'ledger', partners: 'ledger', desk: 'rotom', persona: 'crew', pyramid: 'crew', squads: 'crew', settings: 'menu' };
  const i = SPOTS.findIndex((s) => s.id === (home[p] ?? p));
  return i < 0 ? null : i;
}

/** The last pages, newest first: the page just left goes on top, no repeats, at most three, only pages you can jump to. */
export function pushLast(list: readonly PageId[], left: PageId, now: PageId): PageId[] {
  if (left === now || !jumpable(left)) return list.filter((p) => p !== now);
  return [left, ...list.filter((p) => p !== left && p !== now)].slice(0, 3);
}

/** The middle of the wheel: what waits on the place you point at, so you can check before you go. */
export function hubLine(b: DominionBlock, spot: Spot): string {
  const s = (n: number, w: string): string => `${n} ${w}${n === 1 ? '' : 's'}`;
  switch (spot.id) {
    case 'hq': return `Day ${b.day}, ${b.phase}. ${b.crew?.talks.length ? `${s(b.crew.talks.length, 'talk')} waiting.` : 'All quiet.'}`;
    case 'map': return b.phase === 'day' ? `${s(b.actions, 'action')} left today.` : `Actions come back by day. Day ${b.day}.`;
    case 'crew': return `${s(b.members.length, 'member')} on the roster.`;
    case 'reserve': return `${s(b.reserve?.box.length ?? 0, 'Pokémon')} in the Reserve.`.replace('Pokémons', 'Pokémon');
    case 'ops': return DOMINION_DATA.start.lockedTab;
    case 'ledger': return `₽${b.funds.toLocaleString('en-US')} in the books. Heat ${b.heat}.`;
    case 'rotom': return 'Rotom and the Key-Card, in Settings.';
    case 'menu': return 'Pause, save and Settings.';
  }
  return '';
}

export interface Waiting { icon: string; text: string; go: PageId }

/** The wheel's pinned column: what is waiting for the Boss right now (a crew talk, Rotom's desk, a rival move). */
export function pinned(b: DominionBlock): Waiting[] {
  const out: Waiting[] = [];
  const talk = b.crew?.talks[0];
  if (talk) out.push({ icon: 'g-letter', text: `${b.members.find((m) => m.id === talk.member)?.name ?? 'A grunt'} wants a word`, go: b.phase === 'morning' ? 'morning' : 'crew' });
  const desk = deskWaiting(b);
  if (desk) out.push({ icon: 'p-rotom', text: `Rotom desk · ${desk} waiting`, go: 'desk' });
  const rival = b.crew?.alerts.find((a) => a.kind === 'rival');
  if (rival) out.push({ icon: 'g-vs-seeker', text: rival.text.length > 30 ? `${rival.text.slice(0, 29)}…` : rival.text, go: 'rival' });
  return out.slice(0, 3);
}

// ---------- the board's keyboard cursor ----------

/** The photo the arrows move to from photo `at` on a sheet: the nearest one that lies that way. */
export function boardMove(sheet: 0 | 1, at: number, dir: 'left' | 'right' | 'up' | 'down'): number {
  const pins = PINS.filter((p) => p.sheet === sheet);
  const from = pins[at];
  if (!from) return 0;
  let best = at, bestD = Infinity;
  pins.forEach((p, i) => {
    const dx = p.x - from.x, dy = p.y - from.y;
    const ok = dir === 'left' ? dx < -20 : dir === 'right' ? dx > 20 : dir === 'up' ? dy < -40 : dy > 40;
    if (!ok) return;
    const d = dir === 'left' || dir === 'right' ? Math.abs(dx) + Math.abs(dy) * 3 : Math.abs(dy) + Math.abs(dx) * 0.6;
    if (d < bestD) { bestD = d; best = i; }
  });
  return best;
}
