// Shared vocabulary for the Kanto Canon Spaces rebuild (Catalog Overhaul Pack, category `kanto-canon`).
// Source docs: /mnt/project-files/catalog_overhaul_pack/kanto_canon_spaces/KANTO_PLACED_1..6.md (placement + script),
// CANON_SPACES_KANTO.md and CANON_SPACES_KANTO_EXPANDED.md (rules, rewards, odds).
// Files starting with "_" are not built. Every species, item and move id is checked here, so a typo fails the build.
import { readdirSync, readFileSync } from 'node:fs';
import type { Json } from '../dsl.ts';

const read = (f: string) => JSON.parse(readFileSync(new URL(`../../../src/data/${f}`, import.meta.url), 'utf8'));
const list = (x: any, key: string): any[] => (Array.isArray(x) ? x : (x[key] ?? Object.values(x)));
const speciesIds = new Set<string>([...list(read('species.json'), 'species'), ...list(read('customSpecies.json'), 'species')].map((s) => s.id));
const moveIds = new Set<string>(list(read('moves.json'), 'moves').map((m) => m.id));
const batchDir = new URL('../../../src/data/itemCatalog/', import.meta.url);
const batches = readdirSync(batchDir).filter((f) => f.endsWith('.json')).flatMap((f) => JSON.parse(readFileSync(new URL(f, batchDir), 'utf8')) as any[]);
const itemIds = new Set<string>([...list(read('itemCatalog.json'), 'items'), ...Object.values(read('items.json') as Record<string, any>), ...batches, ...list(read('megaStones.json'), 'items')].map((i) => i.id));

export const sp = (id: string): string => { if (!speciesIds.has(id)) throw new Error(`kanto-canon: unknown species ${id}`); return id; };
export const sps = (...ids: string[]): string[] => ids.map(sp);
export const mv = (id: string): string => { if (!moveIds.has(id)) throw new Error(`kanto-canon: unknown move ${id}`); return id; };
export const it = (id: string): string => { if (!itemIds.has(id)) throw new Error(`kanto-canon: unknown item ${id}`); return id; };
export const hasSpecies = (id: string): boolean => speciesIds.has(id);
export const hasItem = (id: string): boolean => itemIds.has(id);

export const GROUP = 'Canon Spaces: Kanto';
export const TINTS: Record<string, string> = {
  viridian: '#3f6b3a', pewter: '#6b6257', cerulean: '#2f5f8a', vermilion: '#2f5d73', lavender: '#4a3a66', celadon: '#3d7a4a',
  fuchsia: '#7a3d6b', saffron: '#8a7a2f', cinnabar: '#8a3a2a', indigo: '#3a3f7a', route: '#5a6b3a', sevii: '#2a6b6b',
};

// ---------- the catalog rows (src/data/expansion/canonSpacesKanto.json, merged in by tools/build-canon-spaces.ts) ----------
export type Kind = 'PS' | 'MC' | 'EV' | 'HUB' | 'SHOP' | 'CUT';
export interface Placed {
  /** Kanto stage (1 to 8); several when the doc gives more than one. */
  stage: number[];
  /** Home step on the 20-step map (the doc's fallback step for town scenes "until towns exist"). */
  home: number;
  /** Window of steps it may slide to. */
  window?: [number, number];
  /** How it sits: must-see, optional, at the Town node, at a + node, behind a door (Pseudo Stage side branch), hub. */
  sits: 'must' | 'optional' | 'town' | 'plus' | 'door' | 'hub';
  /** Before / instead of / after the node's battle, or at a Town / + node. */
  attaches: 'before' | 'instead' | 'after' | 'town' | 'plus';
  /** The map badge the doc names. */
  badge: string;
  /** Level offset from the absolute stage (`A-2` = -2); null = no battle. */
  level: number | null;
  /** The doc's "How often" line. */
  often: string;
  /** A different home step at a later Kanto stage, keyed by stage number (Route 22 at Stage 8: Step 18). */
  homes?: Record<string, number>;
}
export interface SpaceRow {
  id: string; town: string; name: string; kind: Kind; appears: 'always' | 'roll' | 'trigger' | 'locked' | 'route';
  parent?: string | null; requires?: { flags?: string[]; spaces?: string[] }; uniqueRewardFlag?: string | null;
  length?: number | null; flags?: string[]; section: string; placed: Placed;
  /** A Pseudo Stage: its drawn map (name, background theme, mood). The entry event opens the first room. */
  ps?: { name: string; themeId: string; mood: string };
}
export const SPACES: SpaceRow[] = [];
export const EXTRA: Record<string, string> = {};
/** Follow-up scenes (placed at the start of a Kanto stage once their `requires` hold) and road spaces (rolled per stage). */
export const FOLLOWUPS: { event: string; stages?: number[] }[] = [];
export const ROUTES: { event: string; stages: number[]; chance: number }[] = [];
export const followup = (event: string, stages?: number[]): void => { FOLLOWUPS.push({ event, ...(stages ? { stages } : {}) }); };
/** Options for a follow-up scene: never drawn at random (a room), placed by core/expansion/canonKantoPlaced.ts. */
export const later = (x: Json = {}): Json => ({ room: true, stop: 'event', ...x });
export const road = (event: string, stages: number[], chance: number): void => { ROUTES.push({ event, stages, chance }); };

/** The event id of a space: `cs.kanto.pewter.rest` -> `cs-kanto-pewter-rest`. */
export const eid = (space: string, suffix = ''): string => space.replace(/\./g, '-') + (suffix ? `-${suffix}` : '');

export interface Ctx {
  /** Registers the space and returns its entry event. */
  entry: (name: string, intro: string, choices: Json[], extra?: Json) => Json;
  /** A further room of the space (opened by `open`). */
  room: (suffix: string, name: string, intro: string, choices: Json[], extra?: Json) => Json;
  /** Effect: opens a room of this space. */
  open: (suffix: string) => Json;
  openFrom: (...suffixes: string[]) => Json;
  id: (suffix?: string) => string;
  lv: number;
}

/** Declares a space: its catalog row, and a small context for writing its events. Events are collected in `out`. */
export function space(out: Json[], row: SpaceRow): Ctx {
  if (SPACES.some((s) => s.id === row.id)) throw new Error(`kanto-canon: space ${row.id} declared twice`);
  SPACES.push(row);
  const tint = TINTS[row.town] ?? TINTS.route!;
  const base = (id: string, name: string, intro: string, choices: Json[], extra: Json = {}): Json => {
    if (choices.length < 1 || choices.length > 4) throw new Error(`kanto-canon: ${id} has ${choices.length} choices (1 to 4)`);
    const { scene, ...rest } = extra as { scene?: Json };
    const e = { id, name, group: GROUP, stop: 'event', rarity: 'common', tags: [], types: [], minStage: 1, requires: [], remembers: [], callback: false, forced: false, scene: { cast: [], effect: 'none', tint, ...(scene ?? {}) }, intro, choices, ...rest };
    out.push(e);
    return e;
  };
  const id = (suffix = '') => eid(row.id, suffix);
  EXTRA[row.id] = id();
  return {
    entry: (name, intro, choices, extra = {}) => base(id(), name, intro, choices, { canon: row.id, stop: row.kind === 'SHOP' ? 'merchant' : 'event', ...extra }),
    room: (suffix, name, intro, choices, extra = {}) => base(id(suffix), name, intro, choices, { room: true, stop: 'delve', ...extra }),
    open: (suffix) => ({ kind: 'addEvent', eventId: id(suffix) }),
    openFrom: (...suffixes) => ({ kind: 'addEventFrom', ids: suffixes.map((s) => id(s)) }),
    id,
    lv: row.placed.level ?? 0,
  };
}

// ---------- outcomes, battles and small effects (every event battle is `pseudo`: a loss never ends the run) ----------
export const o = (text: string, ...effects: Json[]): Json => ({ text, effects });
export const c = (label: string, success: Json, x: { requires?: Json[]; chance?: number; check?: string; prompt?: [string, 'ok' | 'good' | 'perfect']; fail?: Json; pick?: { types?: string[] } } = {}): Json => ({
  label, ...(x.pick ? { pick: x.pick } : {}), ...(x.requires ? { requires: x.requires } : {}), ...(x.chance !== undefined ? { chance: x.chance } : {}), ...(x.check ? { check: x.check } : {}),
  ...(x.prompt ? { prompt: { id: x.prompt[0], needs: x.prompt[1] } } : {}), success, ...(x.fail ? { failure: x.fail } : {}),
});
export const battle = (text: string, b: Json, ...effects: Json[]): Json => ({ text, effects, battle: b });
export const wild = (species: string[], x: Json = {}): Json => ({ kind: 'wild', pseudo: true, species: sps(...species), levelBonus: 0, win: [], ...x });
export const foe = (name: string, x: Json = {}): Json => {
  const team = (x as { team?: string[] }).team;
  if (team) sps(...team);
  return { kind: 'trainer', pseudo: true, name, size: team ? team.length : 2, levelBonus: 0, win: [], ...x };
};
export const flag = (key: string, amount = 1): Json => ({ kind: 'flag', key, amount });
export const is = (key: string, atLeast = 1, atMost = 99): Json => ({ kind: 'flag', key, atLeast, atMost });
export const not = (key: string): Json => ({ kind: 'flag', key, atLeast: 0, atMost: 0 });
export const item = (id: string, count = 1): Json => ({ kind: 'item', id: it(id), count });
export const has = (id: string): Json => ({ kind: 'item', id: it(id) });
export const cash = (amount: number): Json => ({ kind: 'money', amount });
export const afford = (atLeast: number): Json => ({ kind: 'money', atLeast });
export const join = (species: string[], x: Json = {}): Json => ({ kind: 'join', species: sps(...species), levelBonus: 0, ...x });
export const teach = (move: string, x: Json = {}): Json => ({ kind: 'teachMove', move: mv(move), ...x });
export const heal = (share = 1): Json => ({ kind: 'heal', share });
export const fr = (amount: number, who: 'lead' | 'party' | 'picked' = 'party'): Json => ({ kind: 'friendship', amount, who });
export const good = (n = 1): Json => ({ kind: 'attribute', key: 'goodEvil', amount: n });
/** "Kindness +1" (shared board): Good/Evil +1 and the run's Kindness total. */
export const kind = (): Json[] => [good(1), flag('kind-total')];
/** "Intel +1" (shared board). */
export const intel = (): Json => flag('intel');
export const moment = (text: string): Json => ({ kind: 'moment', text });
export const relic = (id: string, name: string, effects: Json[]): Json => ({ kind: 'relic', id, name, effects });
export const temp = (label: string, effects: Json[], battles = 1, until: 'battle' | 'boss' | 'wild' = 'battle'): Json => ({ kind: 'tempEffect', label, effects, battles, until });
export const heat = (n: number): Json => ({ kind: 'evil', heat: n });
export const lvl = (amount: number, who: 'lead' | 'party' | 'weakest' = 'lead'): Json => ({ kind: 'levels', amount, who });
/** A priced choice: shows the price, needs the money, takes it. */
export const buy = (label: string, price: number, text: string, ...effects: Json[]): Json => c(`${label} (₽${price.toLocaleString('en-US')})`, o(text, cash(-price), ...effects), { requires: [afford(price)] });
/** Kanto canon rules that have no general effect (src/core/expansion/canonKantoRules.ts). */
export const kc = (act: string, x: Json = {}): Json => ({ kind: 'kc', act, ...x });

// ---------- retiring the simplified builds ----------
const oldCanon: string[] = ['eventsCanonKanto.json', 'eventsCanonFuchsia.json', 'eventsCanonSaffron.json', 'eventsCanonVermilion.json', 'events/canon-kanto-start.json', 'events/canonCinnabar.json'].flatMap((f) => list(read(f), 'events').map((e: any) => String(e.id)));
/** Old event ids of the given spaces (their entry and rooms) that this module no longer builds: they go on the REMOVE list. */
export function retired(events: Json[]): string[] {
  const built = new Set(events.map((e) => String(e.id)));
  // The spaces this module declared: the ones whose entry event it built.
  const roots = SPACES.map((x) => eid(x.id)).filter((r) => built.has(r));
  return oldCanon.filter((id) => !built.has(id) && roots.some((r) => id === r || id.startsWith(`${r}-`))).sort();
}
