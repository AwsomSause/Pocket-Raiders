// Helpers shared by the Greenneedle modules (greenneedle-*.ts). Files starting with "_" are not built.
// Docs: /mnt/project-files/catalog_overhaul_pack/catalog_overhaul/GREENNEEDLE_*.md. Rules: docs/status/co-greenneedle.md.
import { ch, flag, flagIs, fr, good, type Json } from '../dsl.ts';

export const CATEGORY = 'greenneedle';
export const GROUP = 'Greenneedle';

export interface GnOpts {
  stop?: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic';
  tags?: string[];
  types?: string[];
  minStage?: number;
  requires?: Json[];
  /** Must-see: always placed (queued if the map is full). */
  forced?: boolean;
  /** A follow-up scene: gets a stop on the first later stage where its `requires` hold. */
  callback?: boolean;
  /** A room of a pseudo stage or a chain: only another event opens it. */
  room?: boolean;
  cast?: string[];
  pokemon?: string;
  tint?: string;
  effect?: string;
  remembers?: Json[];
  countdown?: number;
  timeoutChoice?: number;
}

/** A full Greenneedle event. */
export function gev(id: string, name: string, o: GnOpts, intro: string, choices: Json[]): Json {
  const { cast = [], pokemon, tint, effect = 'none', ...rest } = o;
  return { id, name, group: GROUP, ...rest, scene: { cast, ...(pokemon ? { pokemon } : {}), ...(tint ? { tint } : {}), effect }, intro, choices };
}

/** A room: never drawn on its own. */
export const rm = (id: string, name: string, o: GnOpts, intro: string, choices: Json[]): Json => gev(id, name, { ...o, room: true }, intro, choices);

/** A choice that is not listed at all unless `showIf` holds (a `requires` choice stays visible, locked). */
export function chIf(showIf: Json[], label: string, success: Json, o: Parameters<typeof ch>[2] = {}): Json {
  return { ...ch(label, success, o), showIf };
}

/** Joins lines of a scene into one text: each line its own paragraph. */
export const say = (...lines: string[]): string => lines.join('\n\n');

// ---------- remembered flags ----------
export const not = (key: string): Json => flagIs(key, 0, 0);
export const is = (key: string, atLeast = 1, atMost = 99): Json => flagIs(key, atLeast, atMost);
export const exactly = (key: string, n: number): Json => flagIs(key, n, n);

// ---------- the pack's words (STANDARDS.md) ----------
/** "+1 Bond" on the lead: friendship +5 per point. */
export const bond = (n = 1): Json => fr(5 * n, 'lead');
/** "+1 Bond" for the whole party: friendship +3 each per point. */
export const bondAll = (n = 1): Json => fr(3 * n, 'party');
/** "Intel +1". */
export const intel = (n = 1): Json => flag('intel', n);
/** "Kindness +1". */
export const kindness = (n = 1): Json => good(n);

// ---------- Greenneedle story steps (core/greenneedle) ----------
export const gn = (op: string, o: Json = {}): Json => ({ kind: 'gn', op, ...o });
/** The run flag is cut down to at most `n`. */
export const cap = (key: string, n: number): Json => gn('capFlag', { key, n });
export const setTo = (key: string, n: number): Json => gn('setFlag', { key, n });
/** The run flag becomes 1 with `percent` chance (the stop's own seeded roll), else 0. */
export const roll = (key: string, percent: number): Json => gn('roll', { key, n: percent });
/** The run flag becomes 1, 2, 3... by weight. */
export const pick = (key: string, ...weights: number[]): Json => gn('pick', { key, weights });
/** If the flag is within min..max: the effects apply (and the line shows). */
export const when = (key: string, range: { min?: number; max?: number }, then: Json[], text?: string): Json => gn('when', { key, ...range, then, ...(text ? { text } : {}) });
/** Opens the room at index = the flag's value (the last one for larger values). */
export const route = (key: string, ...ids: string[]): Json => gn('route', { key, to: { kind: 'addEventFrom', ids } });
/** Opens a scene beside the node the player stands on (not a node of the pseudo-stage map). */
export const scene = (eventId: string): Json => gn('scene', { key: eventId });
/** The run flag becomes (stage number from the start of the run) modulo n. */
export const stageMod = (key: string, n: number): Json => gn('stageMod', { key, n });
/** A fossil by region: 'local' (70% this region's, 30% another's) or 'far' (another region's: the rarer half). */
export const fossil = (table: 'local' | 'far'): Json => gn('fossil', { key: table });
/** Remembers the region the player is in now; `regionChanged(key)` holds once they are in a later one. */
export const stampRegion = (key: string): Json => gn('stampRegion', { key });
export const regionChanged = (key: string): Json => ({ kind: 'gn', test: 'regionChanged', key });
/** The run flag becomes 1 when a party Pokémon is one of these species, else 0. */
export const partyHas = (key: string, ...species: string[]): Json => gn('partyHas', { key, species });
/** Holds when no party Pokémon knows a move of any of these types. */
export const noMoveOf = (...types: string[]): Json => ({ kind: 'gn', test: 'noMoveType', types });
/** One item by weight: `pick` then one `when` per entry (the flag `key` keeps which one). */
export const weighted = (key: string, table: [string, number][]): Json[] => [
  pick(key, ...table.map(([, w]) => w)),
  ...table.map(([id], i) => when(key, { min: i + 1, max: i + 1 }, [{ kind: 'item', id, count: 1 }])),
];
/** Holds unless the flag was stamped (`stampRegion`) in this region. */
export const notThisRegion = (key: string): Json => ({ kind: 'gn', test: 'notThisRegion', key });
/** Remembers the stage number now; read with laterStage / sameStage / notThisStage. */
export const stampStage = (key: string): Json => gn('stampStage', { key });
export const laterStage = (key: string): Json => ({ kind: 'gn', test: 'laterStage', key });
export const sameStage = (key: string): Json => ({ kind: 'gn', test: 'sameStage', key });
export const notThisStage = (key: string): Json => ({ kind: 'gn', test: 'notThisStage', key });
export const leavePseudo = (): Json => ({ kind: 'leavePseudo' });
export const teach = (move: string, o: Json = {}): Json => ({ kind: 'teachMove', move, ...o });
export const moment = (text: string, importance = 60): Json => ({ kind: 'moment', text, importance });

/** A wild fight whose story goes on whether the Pokémon is beaten or caught (a catch does not pay `win`). */
export const eitherWay = (battle: Json): Json => ({ ...battle, caught: battle.win });

/** A fight inside a pseudo stage: a loss ejects to the map and the run goes on. */
export const inside = (battle: Json): Json => ({ ...battle, pseudo: true });

// ---------- placement (src/data/catalogOverhaul/placement/greenneedle.json; the lead's placer reads it) ----------
export interface Placement {
  /** The Greenneedle id (`gn.03`). */
  gn: string;
  shape: string;
  earliest: string;
  home?: number;
  window?: [number, number];
  sits?: 'must-see' | 'optional' | 'side-branch';
  attaches?: 'after' | 'before' | 'instead' | 'rest' | 'town';
  /** The doc's category labels (written to the data as `kinds`; the placer's `tags` are the stage needs below). */
  tags?: string[];
  /** In-region stages it may appear in (S1 = 1); empty = any, or the key event's beat stage. */
  stages?: number[];
  level?: string;
  often?: 'run' | 'region';
  /** Map tags the stage needs (water, forest, cave, high); several = any one of them. */
  needs?: string[];
  /** Its name and place when the region is Kanto, and its name elsewhere. */
  dressing?: { kanto: string; kantoStage?: string; elsewhere?: string };
  /** A story in several beats, each with its own stage, home and window. */
  beats?: { beat: string; event?: string; stage: string; home?: number; window?: [number, number] }[];
  /** The map badge: its own (default), "?" or "None" (a surprise). */
  badge?: string;
  /** A Region story's beat number and the id its beats share (core/co/placement.ts places beats 2 and 3 once earned). */
  beat?: number;
  chain?: string;
  note?: string;
}
