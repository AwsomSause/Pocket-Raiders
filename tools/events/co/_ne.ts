// Kit for the 100 new events (catalog overhaul row 17, category `new-events`). Not built on its own (the name starts with "_").
// Source: NEW_EVENTS_1 to _4 (scripts) and NEW_EVENTS_PLACED (placement) in the catalog overhaul pack.
// Pack words follow the shared board (/plans/catalog-overhaul/STANDARDS.md): Kindness = Good +1 and `kind-total`,
// Reputation = flag `rep`, Sign = flag `sign-*`, Telling = flag `telling-*`, "+1 Bond" = bondUp(), "(a node)" = takeNode().
import { ch, ev, flag, flagIs, good, type EventOpts, type Json } from '../dsl.ts';

export const CATEGORY = 'new-events';

/** Pages of a scene: a blank line is a page break in the New UI. */
export const P = (...pages: string[]): string => pages.join('\n\n');
/** Lines inside one page. A line shaped `Name: "words"` is a speaker line. */
export const L = (...lines: string[]): string => lines.join('\n');

// ---------- pack words ----------
/** Kindness +N. Spread it: `...kind(2)`. */
export const kind = (n = 1): Json[] => [good(n), flag('kind-total', n)];
/** A Kindness Ledger event done fully: Kindness +N and the stranger remembers. */
export const kindFull = (n = 1): Json[] => [...kind(n), flag('kind-helped-stranger')];
export const rep = (n = 1): Json => flag('rep', n);
export const repLost = (n = 1): Json => flag('rep-lost', n);
/** A Legendary Sign: `own` is whichever Legendary blesses this run (the legends thread turns it into Influence). */
export const sign = (legend = 'own', n = 1): Json => flag(`sign-${legend}`, n);
/** A Mythical's Telling. */
export const telling = (mythical: string): Json => flag(`telling-${mythical}`);
export const promiseStep = (mythical: string): Json => flag(`promise-step-${mythical}`);
export const calmed = (n = 1): Json => flag('calmed-alpha', n);
/** The flag was never set. */
export const not = (key: string): Json => flagIs(key, 0, 0);
export const has = (id: string, count?: number): Json => ({ kind: 'item', id, ...(count ? { count } : {}) });
export const lose = (id: string, count?: number): Json => ({ kind: 'loseItem', id, ...(count ? { count } : {}) });
/** At least one of these flags is set. */
export const anyFlag = (...keys: string[]): Json => ({ kind: 'anyFlag', keys });
/** A passing effect: `battles` fights long (or until the next boss or wild fight). */
export const temp = (label: string, battles: number, until: 'battle' | 'boss' | 'wild', ...effects: Json[]): Json => ({ kind: 'tempEffect', label, effects, battles, until });
export const teach = (move: string, who: Json | string = 'picked'): Json => ({ kind: 'teachMove', move, who });
export const moment = (text: string, importance = 60): Json => ({ kind: 'moment', text, importance });
/** Where the run stands: `stage` and `region` are 1-based ranges; `regionEnd` is the last stage of a region; `lastRegion` the run's final region. */
export const place = (o: { stage?: [number, number]; region?: [number, number]; regionEnd?: boolean; lastRegion?: boolean }): Json => ({ kind: 'runPlace', ...o });

// ---------- placement (NEW_EVENTS_PLACED.md) ----------
export type Tag = 'water' | 'high' | 'forest' | 'city' | 'cave' | 'eerie' | 'hot' | 'snow' | 'storm' | 'night' | 'tide';
export interface Place {
  shape?: string;
  earliest: string;
  home?: number | string;
  window?: [number, number];
  sits: 'must-see' | 'optional' | 'side-branch';
  attaches: 'after' | 'before' | 'instead' | 'rest' | 'town';
  tags?: Tag[];
  level?: string;
  often?: 'run' | 'region';
  note?: string;
}
/** What a placement tag means on today's map: stages themed with one of these types. `night` is the clock, not a type. */
export const TAG_TYPES: Record<Exclude<Tag, 'night'>, string[]> = {
  water: ['water'], tide: ['water'], high: ['flying', 'rock', 'dragon'], forest: ['grass', 'bug'], city: ['normal', 'steel', 'electric', 'poison'],
  cave: ['rock', 'ground', 'dark'], eerie: ['ghost', 'psychic', 'dark'], hot: ['fire', 'ground'], snow: ['ice'], storm: ['electric', 'flying'],
};
export const PLACEMENT: Record<string, Place> = {};
/** NE number (and its afterstories) to the event ids that play it, for the status file. */
export const NE_IDS: Record<string, string> = {};

export const GROUP = {
  alpha: 'Alphas', anomaly: 'Mega, Delta and Z anomalies', legend: 'Legendary Signs', myth: 'Mythical Tellings', ultra: 'Ultra Beasts',
  champ: 'Past Champions and Gym Leaders', ally: 'Past allies', rival: 'Rival questline', future: 'Future events', anime: 'Anime-inspired',
  ash: 'Pokémon-anime stories', team: 'Tricksters, villains and teams', trade: 'Trades', road: 'Road people and town stories', wild: 'Wild Scenes',
  hazard: 'Biome Hazards', camp: 'Rests, camp and bond', puzzle: 'Puzzles and mysteries', shop: 'Shops, services and games', fest: 'Festivals and whole-run events',
} as const;

/** The pack's line limit: a line holds at most 30 words. A longer line is split at sentence ends into lines of the same page. */
export const MAX_LINE_WORDS = 30;
const words = (t: string) => t.split(/\s+/).filter(Boolean).length;
function fitLine(line: string): string {
  // A rival's `{say ...}` line is filled in later from the rival's own lines: leave it whole.
  if (words(line) <= MAX_LINE_WORDS || line.includes('{say')) return line;
  const sentences = line.match(/[^.!?]+(?:[.!?]+["')]*|$)\s*/g)?.map((x) => x.trim()).filter(Boolean) ?? [line];
  const out: string[] = [];
  for (const s of sentences) {
    const last = out[out.length - 1];
    if (last !== undefined && words(last) + words(s) <= MAX_LINE_WORDS) out[out.length - 1] = `${last} ${s}`;
    else out.push(s);
  }
  return out.join('\n');
}
/** Every line of every page under the limit. */
export const fitText = (text: string): string => text.split('\n\n').map((page) => page.split('\n').map(fitLine).join('\n')).join('\n\n');
function fitAll(o: unknown): void {
  if (Array.isArray(o)) for (const x of o) fitAll(x);
  else if (o && typeof o === 'object') {
    const n = o as Record<string, unknown>;
    for (const k of ['intro', 'text', 'notice']) if (typeof n[k] === 'string') n[k] = fitText(n[k] as string);
    for (const v of Object.values(n)) if (v && typeof v === 'object') fitAll(v);
  }
}

type Outcome = { text: string; effects: Json[]; battle?: Json };
const outcomesOf = (choices: Json[]): Outcome[] => choices.flatMap((c) => [c.success, c.failure].filter(Boolean) as Outcome[]);
const stamp = (choices: Json[], done: Json): void => {
  for (const o of outcomesOf(choices)) o.effects.push(done);
  // A branch replaces the outcome's effects when its conditions hold, so it needs the done flag too.
  for (const c of choices) for (const b of (c.branches as { effects: Json[] }[] | undefined) ?? []) b.effects.push(done);
};

const fitted = (e: Json): Json => {
  fitAll(e);
  return e;
};

export interface NeOpts extends EventOpts {
  /** Keep an older build's id (NE36 to NE40, NE76 to NE85). */
  id?: string;
  /** Written in full but off until the hook it needs exists (NE100: the run end). */
  disabled?: boolean;
  place: Place;
  tags?: string[];
  priority?: number;
  /** Not once per run (the scene itself limits it). */
  repeat?: boolean;
}

/**
 * Remembered variants that read a flag only another row's event sets (none is built yet). They stay written here but are left out
 * of the built data until that event exists, so no memory reads a flag nothing sets (tests/unit/eventMemory.test.ts). When a row
 * builds the setter, delete its key here and rebuild. Listed in docs/status/co-new-events.md.
 */
export const WAITING_FLAGS = new Set([
  'little-league-look-after', 'took-egg', 'egg-returned', 'bought-stolen', 'elder-ditto-met', 'team-op-stopped-magma-drill', 'sign-broken',
  'glove-duel-accepted', 'journalist-interview', 'haddon-ferried', 'lighthouse-lit',
]);
/** Variant ids held back, by event: written to the status file. */
export const WAITING_MEMORY: Record<string, string[]> = {};
const reads = (v: Json): string[] => ((v.when as Json[] | undefined) ?? []).flatMap((c) => (c.kind === 'flag' && typeof c.key === 'string' ? [c.key] : []));
function ready(id: string, remembers?: Json[]): Json[] | undefined {
  if (!remembers) return remembers;
  const out = remembers.filter((v) => !reads(v).some((k) => WAITING_FLAGS.has(k)));
  const held = remembers.filter((v) => !out.includes(v)).map((v) => `${String(v.id)} (needs ${reads(v).filter((k) => WAITING_FLAGS.has(k)).join(', ')})`);
  if (held.length > 0) WAITING_MEMORY[id] = held;
  return out.length > 0 ? out : undefined;
}

/**
 * One of the hundred. Once per run: it needs `<id>-done` unset and every outcome sets it. `earliest` becomes minStage, the placement tags
 * become stage types (and a gate on the stage's theme), `night` becomes the evening or night clock, a + node becomes a rest stop.
 */
export function ne(n: number, slug: string, name: string, group: string, o: NeOpts, intro: string, choices: Json[], all?: Json[]): Json {
  const { id = `ne${String(n).padStart(2, '0')}-${slug}`, place: where, repeat, requires = [], ...opts } = o;
  const tags = (where.tags ?? []).filter((t): t is Exclude<Tag, 'night'> => t !== 'night');
  const types = [...new Set(tags.flatMap((t) => TAG_TYPES[t]))];
  const remembers = ready(id, all);
  const gates: Json[] = [...requires];
  if (types.length > 0) gates.push({ kind: 'stageTypes', types });
  if (where.tags?.includes('night')) gates.push({ kind: 'period', in: ['evening', 'night'] });
  if (!repeat) {
    gates.push(not(`${id}-done`));
    stamp(choices, flag(`${id}-done`));
    for (const v of remembers ?? []) stamp((v.addChoices as Json[] | undefined) ?? [], flag(`${id}-done`));
  }
  PLACEMENT[id] = { shape: 'Single', often: 'run', ...where };
  NE_IDS[`NE${n}`] = id;
  const stop = opts.stop ?? (where.attaches === 'rest' ? 'rest' : 'event');
  return fitted({ ...ev(id, name, group, { rarity: 'uncommon', ...opts, stop, types: opts.types ?? types, minStage: Number(where.earliest.replace(/\D+/g, '')) || 1, requires: gates }, intro, choices), ...(remembers ? { remembers } : {}) });
}

/** An afterstory or a later beat: a follow-up scene that gets its stop on the first later stage where `when` holds. Plays once. */
export function after(n: number, id: string, name: string, group: string, when: Json[], o: EventOpts & { minStage?: number; tags?: string[] }, intro: string, choices: Json[], all?: Json[]): Json {
  const remembers = ready(id, all);
  stamp(choices, flag(`${id}-done`));
  for (const v of remembers ?? []) stamp((v.addChoices as Json[] | undefined) ?? [], flag(`${id}-done`));
  NE_IDS[`NE${n}:${id}`] = id;
  return fitted({ ...ev(id, name, group, { rarity: 'common', ...o, callback: true, requires: [...when, not(`${id}-done`)] }, intro, choices), ...(remembers ? { remembers } : {}) });
}

/** A second step of the same scene: opens beside the node from another choice's `room(id)`, never drawn on its own. */
export function step(n: number, id: string, name: string, group: string, o: EventOpts, intro: string, choices: Json[], all?: Json[]): Json {
  const remembers = ready(id, all);
  NE_IDS[`NE${n}:${id}`] = id;
  return fitted({ ...ev(id, name, group, { rarity: 'common', ...o, room: true }, intro, choices), ...(remembers ? { remembers } : {}) });
}

/** A remembered variant. */
export const variant = (id: string, when: Json[], o: { intro?: string; notice?: string; hide?: number[]; addChoices?: Json[] }): Json => ({ id, when, ...o });

export { ch };
