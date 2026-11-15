// Catalog Overhaul Pack: where a placed event sits on the stage map.
// Rules: the pack's STAGE_MAP_AND_PLACEMENT.md (version 3) and expanded_notes/PLACEMENT_ON_THE_MAP.md.
// Data: src/data/catalogOverhaul/placement/<category>.json, keyed by event id, written as the docs give it.
// Pure: no RNG object, no run state. The caller (core/events.ts) passes the map and a seed, and puts the result on the map.

import type { MapNode, StageMap } from '../state';

/** A placement block, normalised. Steps are the pack's 1 to 20 (20 is always the Gym). */
export interface CoPlacement {
  shape: string;
  /** Lowest absolute stage it may appear at (A3 = 3). */
  earliest: number;
  /** In-region stage numbers it may appear in (S2 = 2); empty = any. */
  stages: number[];
  /** The step it wants, or null when it has none (then it is drawn like any other event). */
  home: number | null;
  window: [number, number] | null;
  sits: 'must-see' | 'optional' | 'side-branch';
  attaches: 'after' | 'before' | 'instead' | 'rest' | 'town';
  /** Stage tags it needs (water, high, forest, city, cave, eerie, hot, snow, storm, night, high tide, low tide). All must hold. */
  tags: string[];
  /** Battle level as stages away from the current one (A-1 = -1). */
  level: number;
  often: 'run' | 'region';
  /** Beats of one story share a chain id; beat 1 is the opening. */
  chain: string | null;
  beat: number;
  /** What the player sees on the map: its own badge, a "?", or none (both of the last two show as the game's hidden "?" stop until reached). */
  badge: 'own' | '?' | 'none';
}

const SHAPE_STEPS: Record<string, number[]> = { 'stage-three': [6, 12, 17], trial: [9, 12, 16], region: [8, 12, 17], 'world event': [5, 10, 15], tournament: [12], visit: [11] };
const REGION_STAGES = [2, 5, 8];
/** Shapes whose later beats are owed: they are placed before anything else and are never dropped. */
const OWED = new Set(['stage-three', 'trial', 'region', 'run-long', 'companion']);
/** Shapes whose beats all happen inside one stage: a later beat is placed ahead of the player the moment it is earned. */
export const SAME_STAGE = new Set(['stage-three', 'world event']);

const lower = (v: unknown): string => String(v ?? '').trim().toLowerCase().replace(/[‐-―−]/g, '-');
const num = (v: unknown): number | null => {
  const m = /-?\d+/.exec(lower(v));
  return m ? Number(m[0]) : null;
};

/** Reads one raw entry (as a thread wrote it from the doc) into a placement. Unknown or missing lines take the pack's defaults. */
export function readPlacement(raw: Record<string, unknown>): CoPlacement {
  const shape = lower(raw.shape) || 'single';
  const beat = Math.max(1, num(raw.beat) ?? 1);
  const steps = SHAPE_STEPS[shape];
  const home = num(raw.home) ?? steps?.[Math.min(beat, steps.length) - 1] ?? null;
  const win = Array.isArray(raw.window) ? [num(raw.window[0]), num(raw.window[1])] : null;
  const window: [number, number] | null = win && win[0] !== null && win[1] !== null ? [Math.min(win[0]!, win[1]!), Math.max(win[0]!, win[1]!)] : home !== null ? [Math.max(1, home - 2), Math.min(19, home + 2)] : null;
  const sitsRaw = lower(raw.sits);
  // Shape defaults: a Stage-Three's first beat can be missed, its next two cannot; a Trial's third beat and every Region beat are must-see.
  const shapeMust = (shape === 'stage-three' && beat >= 2) || (shape === 'trial' && beat >= 3) || shape === 'region' || shape === 'run-long';
  const sits = sitsRaw.includes('must') || sitsRaw.includes('cannot be skipped') ? 'must-see' : sitsRaw.includes('side') ? 'side-branch' : sitsRaw.includes('optional') ? 'optional' : shapeMust ? 'must-see' : shape === 'visit' ? 'side-branch' : 'optional';
  const at = lower(raw.attaches);
  const attaches = at.includes('instead') || shape === 'door' ? 'instead' : at.includes('before') ? 'before' : at.includes('rest') || at.includes('+') || at.includes('camp') ? 'rest' : at.includes('town') || at.includes('hub') ? 'town' : 'after';
  const level = /a\s*([+-])\s*(\d)/.exec(lower(raw.level));
  const stages = Array.isArray(raw.stages) ? raw.stages.map(num).filter((n): n is number => n !== null) : shape === 'region' ? [REGION_STAGES[Math.min(beat, 3) - 1]!] : [];
  return {
    shape,
    earliest: Math.max(1, num(raw.earliest) ?? 1),
    stages,
    home: home === null ? null : Math.min(19, Math.max(1, home)),
    window: window ? [Math.max(1, window[0]), Math.min(19, window[1])] : null,
    sits,
    attaches,
    tags: (Array.isArray(raw.tags) ? raw.tags : []).map(lower).filter((t) => t !== '' && t !== 'any'),
    level: level ? Math.max(-2, Math.min(2, Number(level[2]) * (level[1] === '-' ? -1 : 1))) : 0,
    often: lower(raw.often).includes('region') ? 'region' : 'run',
    chain: raw.chain ? String(raw.chain) : null,
    beat,
    badge: lower(raw.badge).includes('?') ? '?' : lower(raw.badge).includes('none') ? 'none' : 'own',
  };
}

/** True when the placer puts this event on a chosen step; false when it is drawn like any other event (a Pool, or a single with no step). */
export const positioned = (p: CoPlacement): boolean => p.shape !== 'pool' && (p.home !== null || p.window !== null || p.sits !== 'optional' || p.attaches === 'rest' || p.attaches === 'instead');

const TAG_TYPES: Record<string, string[]> = {
  water: ['water', 'ice'], high: ['flying', 'rock', 'dragon', 'ice'], forest: ['grass', 'bug', 'fairy'], city: ['normal', 'electric', 'steel', 'poison', 'fighting'],
  cave: ['rock', 'ground', 'dark'], eerie: ['ghost', 'dark', 'psychic'], hot: ['fire', 'ground'], snow: ['ice'],
};

/** The tags a stage has, from its types and its header: the time of day and the tide (pack section 6). */
export function stageTags(types: readonly string[], period: string, tide?: 'high' | 'low'): Set<string> {
  const tags = new Set<string>();
  for (const [tag, list] of Object.entries(TAG_TYPES)) if (types.some((t) => list.includes(t))) tags.add(tag);
  if (types.includes('electric') && (types.includes('flying') || types.includes('water'))) tags.add('storm');
  if (period === 'evening' || period === 'night') tags.add('night');
  if (tide) tags.add(`${tide} tide`);
  return tags;
}

/** A tide need as the docs write it ("high tide", "tide: low", "low-tide") reads as `high tide` or `low tide`; a bare "tide" fits either. */
const tagHolds = (tag: string, tags: ReadonlySet<string>): boolean => {
  if (!tag.includes('tide')) return tags.has(tag);
  const want = tag.includes('high') ? 'high tide' : tag.includes('low') ? 'low tide' : null;
  return want ? tags.has(want) : tags.has('high tide') || tags.has('low tide');
};

/** May it appear on this stage at all (earliest absolute stage, in-region stage, tags)? */
export function fitsStage(p: CoPlacement, absStage: number, stageInRegion: number, tags: ReadonlySet<string>): boolean {
  return absStage >= p.earliest && (p.stages.length === 0 || p.stages.includes(stageInRegion)) && p.tags.every((t) => tagHolds(t, tags));
}

/** A pack step (1 to 20) as a column of this map; the last column is the Gym and is never used. */
export function stepColumn(step: number, columns: number): number {
  return Math.max(1, Math.min(columns - 1, Math.round((step * columns) / 20)));
}

/** FNV-1a, for seeded picks that never touch a gameplay RNG stream. */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

export interface CoEntry { id: string; p: CoPlacement; /** It opens a pseudo stage (a Door). */ door: boolean }
export interface CoPlaced { id: string; nodeIds: string[]; hidden: boolean }

/** Pack section 7, "the event budget". `hard` counts events whose battle is at A+1 or A+2 (never on back-to-back steps; one A+2 at most). */
export const CO_BUDGET = { events: 8, mustSee: 3, doors: 1, badges: 3, hard: 2, hardest: 1 };

const priority = (e: CoEntry): number => (OWED.has(e.p.shape) && e.p.beat >= 2 ? 0 : e.p.sits === 'must-see' || e.p.shape === 'world event' ? 1 : e.door || e.p.shape === 'door' ? 2 : 3);

/**
 * Places the stage's positioned events (pack section 7). `only` limits the nodes that may be used (the ones still ahead of the player, when
 * placing a beat mid-stage). Events that find no place are left out: a single waits for a later stage; an owed beat takes the next free
 * chokepoint after its window, and failing that every node of its home column, so it is never dropped.
 */
export function planCoStage(map: StageMap, entries: readonly CoEntry[], seed: string, only?: ReadonlySet<string>): CoPlaced[] {
  const usable = map.nodes.filter((n) => n.column < map.columns && (!only || only.has(n.id)));
  const byColumn = new Map<number, MapNode[]>();
  for (const n of usable) byColumn.set(n.column, [...(byColumn.get(n.column) ?? []), n]);
  // A column is a chokepoint only when the whole map has one node there (not just the nodes still ahead).
  const whole = new Map<number, number>();
  for (const n of map.nodes) whole.set(n.column, (whole.get(n.column) ?? 0) + 1);
  const badges = new Map<string, number>(usable.map((n) => [n.id, n.sides.filter((s) => s.kind === 'event').length]));
  const doorNodes = new Set<string>();
  const mustColumns = new Set<number>();
  let mustSee = 0;
  let doors = 0;
  let total = 0;
  const hardColumns: number[] = [];
  let hardest = 0;
  const out: CoPlaced[] = [];
  const order = [...entries].sort((a, b) => priority(a) - priority(b) || hash(`${seed}::${a.id}`) - hash(`${seed}::${b.id}`) || a.id.localeCompare(b.id));
  const free = (n: MapNode, alone: boolean) => !doorNodes.has(n.id) && (alone ? (badges.get(n.id) ?? 0) === 0 : (badges.get(n.id) ?? 0) < CO_BUDGET.badges);

  for (const e of order) {
    const { p } = e;
    const owed = priority(e) === 0;
    const isDoor = e.door || p.shape === 'door';
    const must = p.sits === 'must-see';
    if (!owed && total >= CO_BUDGET.events) continue;
    if (must && !owed && mustSee >= CO_BUDGET.mustSee) continue;
    if (isDoor && doors >= CO_BUDGET.doors) continue;
    const hard = p.level >= 1;
    if (hard && !owed && (hardColumns.length >= CO_BUDGET.hard || (p.level >= 2 && hardest >= CO_BUDGET.hardest))) continue;
    const home = stepColumn(p.home ?? Math.round(((p.window?.[0] ?? 1) + (p.window?.[1] ?? 19)) / 2), map.columns);
    const lo = stepColumn(p.window?.[0] ?? 1, map.columns);
    const hi = stepColumn(p.window?.[1] ?? 19, map.columns);
    // Home first, then later steps, then earlier ones (the loser of a collision slides toward the later step first).
    const columns = [home];
    for (let c = home + 1; c <= hi; c++) columns.push(c);
    for (let c = home - 1; c >= lo; c--) columns.push(c);
    if (owed) for (let c = hi + 1; c < map.columns; c++) columns.push(c);
    // Two hard battles never sit on back-to-back steps.
    if (hard) for (let i = columns.length - 1; i >= 0; i--) if (hardColumns.some((h) => Math.abs(h - columns[i]!) <= 1)) columns.splice(i, 1);
    if (columns.length === 0) continue;
    const pick = (nodes: MapNode[]): MapNode | undefined => nodes[hash(`${seed}::node::${e.id}`) % Math.max(1, nodes.length)];
    let nodes: MapNode[] = [];

    if (p.attaches === 'rest') {
      // The + node nearest the home step inside the window; with none, an ordinary node (the scene is dressed as a camp by the road).
      const rests = columns.flatMap((c) => byColumn.get(c) ?? []).filter((n) => n.sides.some((s) => s.kind === 'heal') && free(n, false));
      rests.sort((a, b) => Math.abs(a.column - home) - Math.abs(b.column - home) || a.row - b.row);
      if (rests[0]) nodes = [rests[0]];
    }
    if (nodes.length === 0 && must) {
      const choke = columns.find((c) => whole.get(c) === 1 && !mustColumns.has(c) && (byColumn.get(c) ?? []).some((n) => free(n, isDoor)));
      if (choke !== undefined) nodes = byColumn.get(choke)!;
      else {
        // No chokepoint in reach: every node of the home column (or the first column that can take it), so no route misses it.
        const col = columns.find((c) => !mustColumns.has(c) && (byColumn.get(c) ?? []).length > 0 && (byColumn.get(c) ?? []).every((n) => free(n, isDoor)));
        if (col !== undefined) nodes = byColumn.get(col)!;
      }
    } else if (nodes.length === 0 && p.sits === 'side-branch') {
      for (const c of columns) {
        const col = [...(byColumn.get(c) ?? [])].sort((a, b) => a.row - b.row);
        if ((whole.get(c) ?? 0) < 3 || col.length === 0) continue;
        const edge = [col[0]!, col[col.length - 1]!].filter((n, i, list) => list.indexOf(n) === i && free(n, isDoor));
        const middle = col.length >= 3 ? col.slice(1, -1) : [];
        const n = pick(edge.filter((x) => !middle.includes(x)));
        if (n) { nodes = [n]; break; }
      }
    } else if (nodes.length === 0) {
      for (const c of columns) {
        const n = pick((byColumn.get(c) ?? []).filter((x) => free(x, isDoor)));
        if (n) { nodes = [n]; break; }
      }
    }
    if (nodes.length === 0) continue;

    for (const n of nodes) badges.set(n.id, (badges.get(n.id) ?? 0) + 1);
    if (isDoor) { doors += 1; for (const n of nodes) doorNodes.add(n.id); }
    if (must) { mustSee += 1; mustColumns.add(nodes[0]!.column); }
    if (hard) { hardColumns.push(nodes[0]!.column); if (p.level >= 2) hardest += 1; }
    total += 1;
    out.push({ id: e.id, nodeIds: nodes.map((n) => n.id), hidden: p.shape === 'visit' || p.badge !== 'own' });
  }
  return out;
}

/** The nodes still ahead of the player: everything reachable from `fromId` (not the node itself). */
export function nodesAhead(map: StageMap, fromId: string): Set<string> {
  const byId = new Map(map.nodes.map((n) => [n.id, n]));
  const seen = new Set<string>();
  const queue = [...(byId.get(fromId)?.next ?? [])];
  while (queue.length > 0) {
    const id = queue.pop()!;
    if (seen.has(id)) continue;
    seen.add(id);
    queue.push(...(byId.get(id)?.next ?? []));
  }
  return seen;
}
