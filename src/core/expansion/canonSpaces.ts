// Beta 0.6 INSTRUMENTALITY, workstream 18: the Kanto Canon Spaces catalog and the Town Roll.
// Data shape for src/data/expansion/canonSpacesKanto.json (built by `npm run data:canon-spaces`) and the pure function
// that picks which spaces a town offers on entry. No Phaser. The roll uses its own derived seed, never the run's RNG
// streams, so no existing roll changes and nothing needs saving: same seed + town + flags = same menu.

import { z } from 'zod';
import { Rng, hashSeed } from '../rng.ts';

export const SPACE_KINDS = ['PS', 'MC', 'EV', 'HUB', 'SHOP', 'CUT'] as const;
export const SPACE_APPEARS = ['always', 'roll', 'trigger', 'locked', 'route'] as const;
export type SpaceKind = (typeof SPACE_KINDS)[number];

const spaceId = z.string().regex(/^cs\.kanto\.[a-z0-9-]+\.[a-z0-9-]+(\.[a-z0-9-]+)?$/);
const flag = z.string().regex(/^kanto\.[a-z0-9.-]+$/);

export const CanonSpaceSchema = z.object({
  id: spaceId,
  /** A town id, or 'route' for the road events that belong to no town. */
  town: z.string().regex(/^[a-z]+$/),
  /** The space this one sits inside (Mt. Moon's three events, the Samurai face-off), or null. */
  parent: spaceId.nullable(),
  name: z.string().min(1),
  kind: z.enum(SPACE_KINDS),
  appears: z.enum(SPACE_APPEARS),
  /** What must be true before the space can be offered: run flags set and spaces completed or already on the menu. */
  requires: z.object({ flags: z.array(flag), spaces: z.array(spaceId) }),
  /** Set once this space's one-time reward is owned; the space is then skipped by the Town Roll. */
  uniqueRewardFlag: flag.nullable(),
  /** 'relative' = previous stage + offset; 'fixed' = that level range. null = the spec gives no level (shops, cutscenes). */
  level: z.union([z.object({ mode: z.literal('relative'), offset: z.number().int() }), z.object({ mode: z.literal('fixed'), min: z.number().int(), max: z.number().int() })]).nullable(),
  /** Nodes in a Pseudo Stage (null for single-node spaces). */
  length: z.number().int().positive().nullable(),
  /** Run flags the space writes, as listed in its spec. */
  flags: z.array(flag),
  /** The section number in CANON_SPACES_KANTO.md, for tracing. */
  section: z.string(),
});
export type CanonSpace = z.infer<typeof CanonSpaceSchema>;

export const CanonSlotSchema = z.object({
  slot: z.string().regex(/^(interlude-\d|stage-\d|finale)$/),
  town: z.string().regex(/^[a-z]+$/),
  /** Stage number the slot sits on (interludes use the stage before them; 0 for the opening one). */
  stage: z.number().int().min(0).max(8),
  /** Spaces that are always placed in this slot instead of the town's Always spaces (the Viridian return only replays Route 22). */
  always: z.array(spaceId).nullable(),
});
export const CanonTownSchema = z.object({ id: z.string().regex(/^[a-z]+$/), name: z.string().min(1) });

export const CanonSpacesFileSchema = z.object({
  region: z.literal('kanto'),
  /** Optional spaces drawn per town menu: early stages (0 to 3) and later stages (4+). */
  townRoll: z.object({ early: z.number().int().positive(), late: z.number().int().positive(), maxPseudoStages: z.number().int().positive() }),
  towns: z.array(CanonTownSchema).min(10),
  slots: z.array(CanonSlotSchema).min(10),
  spaces: z.array(CanonSpaceSchema).min(60),
});
export type CanonSpacesFile = z.infer<typeof CanonSpacesFileSchema>;

/** Row counts the content gate holds the catalog to. */
export const CANON_KANTO_COUNTS = { towns: 10, slots: 11, spaces: 71 } as const;

/** The run's canon state (stored at run.expansion.canon). A menu is rolled once per slot and then kept, so reloading never re-rolls it. */
export const CanonStateSchema = z.object({
  flags: z.array(flag).default([]),
  completed: z.array(spaceId).default([]),
  menus: z.record(z.string(), z.array(spaceId)).default({}),
  /** Saffron: party members waiting while one Pokémon fights alone (PokemonInstance rows; checked where they are used). */
  stash: z.array(z.unknown()).optional(),
  solo: z.object({ keep: z.string(), order: z.array(z.string()), mode: z.enum(['tournament', 'labyrinth']) }).optional(),
  /** Saffron: Sabrina's Labyrinth. `owed`: the ghost returns in the next region; `returned`: it already did. */
  lab: z.object({ ghost: z.string(), ghostUid: z.string(), regionIndex: z.number().int(), stageIndex: z.number().int(), freed: z.array(z.string()), active: z.boolean(), done: z.boolean(), owed: z.boolean(), returned: z.boolean() }).optional(),
});
export type CanonState = z.infer<typeof CanonStateSchema>;

export interface TownMenuInput {
  seed: string;
  slot: string;
  /** Run flags (`kanto.*`) set so far. */
  flags: ReadonlySet<string>;
  /** Space ids already finished in this run. */
  completed: ReadonlySet<string>;
}

const met = (sp: CanonSpace, flags: ReadonlySet<string>, have: ReadonlySet<string>) => sp.requires.flags.every((f) => flags.has(f)) && sp.requires.spaces.every((s) => have.has(s));

/**
 * The spaces a town offers when the run enters `slot`, in play order: Always spaces, then spaces whose trigger is met,
 * then the Town Roll draw. Optional spaces are drawn without replacement (2 early, 3 later), never more than the
 * Pseudo Stage cap in total, and a space whose requirements are not met, or whose one-time reward is already owned,
 * is never drawn. A space needing another space is drawn only once that one is on the menu or completed.
 */
export function buildTownMenu(file: CanonSpacesFile, input: TownMenuInput): string[] {
  const slot = file.slots.find((s) => s.slot === input.slot);
  if (!slot) throw new Error(`unknown canon slot ${input.slot}`);
  // Sub-spaces ride inside their parent; routes belong to no town. Only top-level town spaces are on a menu.
  const inTown = file.spaces.filter((s) => s.town === slot.town && s.parent === null);
  const owned = (sp: CanonSpace) => sp.uniqueRewardFlag !== null && input.flags.has(sp.uniqueRewardFlag);
  const menu: CanonSpace[] = [];
  const onMenu = new Set<string>(input.completed);
  const add = (sp: CanonSpace) => { menu.push(sp); onMenu.add(sp.id); };

  if (slot.always) for (const id of slot.always) add(file.spaces.find((s) => s.id === id)!);
  else for (const sp of inTown) if (sp.appears === 'always') add(sp);
  for (const sp of inTown) if ((sp.appears === 'trigger' || sp.appears === 'locked') && met(sp, input.flags, input.completed) && !owned(sp)) add(sp);

  const rng = new Rng(hashSeed(`${input.seed}::canon.townroll::${input.slot}`));
  const want = slot.stage >= 4 ? file.townRoll.late : file.townRoll.early;
  let drawn = 0;
  while (drawn < want) {
    const psCount = menu.filter((s) => s.kind === 'PS').length;
    const pool = inTown.filter((sp) => sp.appears === 'roll' && !onMenu.has(sp.id) && !owned(sp) && met(sp, input.flags, onMenu) && !(sp.kind === 'PS' && psCount >= file.townRoll.maxPseudoStages));
    if (pool.length === 0) break;
    add(pool[rng.int(0, pool.length - 1)]!);
    drawn++;
  }
  return menu.map((s) => s.id);
}

/** Problems in the catalog itself (duplicate ids, dangling parents or requirements, a slot with no town). Empty when clean. */
export function canonSpaceGaps(file: CanonSpacesFile): string[] {
  const out: string[] = [];
  const ids = new Set<string>();
  for (const s of file.spaces) { if (ids.has(s.id)) out.push(`duplicate canon space ${s.id}`); ids.add(s.id); }
  const towns = new Set([...file.towns.map((t) => t.id), 'route']);
  for (const s of file.spaces) {
    if (!towns.has(s.town)) out.push(`${s.id}: unknown town ${s.town}`);
    if (s.parent && !ids.has(s.parent)) out.push(`${s.id}: parent ${s.parent} missing`);
    for (const r of s.requires.spaces) if (!ids.has(r)) out.push(`${s.id}: requires missing space ${r}`);
  }
  for (const sl of file.slots) if (!file.towns.some((t) => t.id === sl.town)) out.push(`slot ${sl.slot}: unknown town ${sl.town}`);
  if (file.slots.length !== CANON_KANTO_COUNTS.slots) out.push(`${file.slots.length} slots (need ${CANON_KANTO_COUNTS.slots})`);
  if (file.towns.length !== CANON_KANTO_COUNTS.towns) out.push(`${file.towns.length} towns (need ${CANON_KANTO_COUNTS.towns})`);
  if (file.spaces.length !== CANON_KANTO_COUNTS.spaces) out.push(`${file.spaces.length} spaces (need ${CANON_KANTO_COUNTS.spaces})`);
  return out;
}

const stateOf = (run: { expansion?: { canon?: CanonState } }): CanonState => run.expansion?.canon ?? { flags: [], completed: [], menus: {} };

/** The menu for a slot, rolled on first entry from the run seed and the flags and finished spaces at that moment, then stored. */
export function enterCanonSlot(file: CanonSpacesFile, run: { seed: string; expansion?: { canon?: CanonState } }, slot: string): string[] {
  const st = stateOf(run);
  const kept = st.menus[slot];
  if (kept) return kept;
  const menu = buildTownMenu(file, { seed: run.seed, slot, flags: new Set(st.flags), completed: new Set(st.completed) });
  (run as { expansion?: object }).expansion = { ...run.expansion, canon: { ...st, menus: { ...st.menus, [slot]: menu } } };
  return menu;
}

/** Marks a space finished (once) and sets the flags its result wrote. Unknown flags are rejected so a typo cannot silently do nothing. */
export function finishCanonSpace(file: CanonSpacesFile, run: { expansion?: { canon?: CanonState } }, id: string, setFlags: readonly string[] = []): void {
  const space = file.spaces.find((s) => s.id === id);
  if (!space) throw new Error(`unknown canon space ${id}`);
  for (const f of setFlags) if (!space.flags.includes(f)) throw new Error(`${id} does not write flag ${f}`);
  const st = stateOf(run);
  // A space made of several events calls this again from its later ones: it counts as finished once, but late flags still get copied.
  const flags = [...new Set([...st.flags, ...setFlags])];
  if (st.completed.includes(id) && flags.length === st.flags.length) return;
  (run as { expansion?: object }).expansion = { ...run.expansion, canon: { ...st, completed: st.completed.includes(id) ? st.completed : [...st.completed, id], flags } };
}
