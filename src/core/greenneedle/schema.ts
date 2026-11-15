// Greenneedle events (Catalog Overhaul Pack, docs GREENNEEDLE_*): the small data shapes their own mechanics need.
// Kept apart from contentSchema.ts so the Greenneedle rules live in one folder; contentSchema only adds these to its unions.
import { z } from 'zod';

const Key = z.string().regex(/^[a-z][a-z0-9-]*$/);

/** The full event-effect schema, bound by contentSchema.ts once it exists (a `when` step carries ordinary effects). */
let effectSchema: z.ZodType = z.never();
export const bindGnEffects = (schema: z.ZodType): void => {
  effectSchema = schema;
};

/**
 * A Greenneedle story step (effect `gn`). Rolls use the event stop's own seeded stream, so a reload gives the same result.
 *  - `duelist`: the newest conscious party Pokémon of `type` becomes the forest's duelist (Viridian Forest, gn.03). Does nothing when one is already marked.
 *  - `capFlag`: the run flag `key` is cut down to at most `n` (Flame 0 to 5, Standing 0 to 3, Respect 0 to 5).
 *  - `setFlag`: the run flag `key` becomes exactly `n`.
 *  - `unmark`: the mark `key` is taken off every Pokémon (the story is over).
 *  - `roll`: the run flag `key` becomes 1 with `n` percent chance, else 0 ("10%: the fog").
 *  - `pick`: the run flag `key` becomes 1, 2, 3... by `weights` ("which Fire-type").
 *  - `when`: if the run flag `key` is within `min`..`max`, the `then` effects apply and `text` is shown.
 *  - `route`: opens the room `to.ids[value of key]` (the last one for larger values): the story branches on what was counted.
 *  - `scene`: opens the event `key` beside the node the player stands on. Unlike `addEvent` it is not a room of the pseudo-stage map: a node can
 *    hold several scenes (a dance in three prompts, a mine with three swings) and still be one node.
 *  - `stageMod`: the run flag `key` becomes (stage number counted from the start of the run) modulo `n` (the moon's phase: 1 new, 3 full with n = 4).
 *  - `stampRegion`: the run flag `key` remembers the region the player is in now (read with the `gn` condition `regionChanged`).
 *  - `fossil`: a fossil by region (`key`: `local` = 70% this region's and 30% another's, `far` = the rarer half of the table, another region's).
 *  - `stampStage`: the run flag `key` remembers the stage number now (read with the `gn` conditions `laterStage`, `sameStage`, `notThisStage`).
 *  - `partyHas`: the run flag `key` becomes 1 when a party Pokémon is one of `species`, else 0 (a Clefairy or Clefable sees the secret dance).
 */
export const GN_OPS = ['duelist', 'capFlag', 'setFlag', 'unmark', 'roll', 'pick', 'when', 'route', 'scene', 'stageMod', 'fossil', 'stampRegion', 'partyHas', 'stampStage', 'leadBoost', 'itemEach', 'noFaint', 'clampFlag', 'stash', 'unstash'] as const;
export const GnEffectSchema = z.object({
  kind: z.literal('gn'),
  op: z.enum(GN_OPS),
  key: Key.optional(),
  n: z.number().int().optional(),
  type: z.string().optional(),
  species: z.array(z.string().min(1)).min(1).max(12).optional(),
  weights: z.array(z.number().positive()).min(2).max(16).optional(),
  min: z.number().int().min(0).optional(),
  max: z.number().int().min(0).optional(),
  text: z.string().min(1).optional(),
  then: z.array(z.lazy(() => effectSchema)).max(8).optional(),
  /** Written as an `addEventFrom` so the pseudo-stage map (core/dungeon/pseudo.ts opensNext) sees every room a route can open. */
  to: z.object({ kind: z.literal('addEventFrom'), ids: z.array(z.string().min(1)).min(1).max(16) }).optional(),
}).refine((e) => (e.op === 'route' ? !!e.to && !!e.key : true), { message: 'a route needs `key` and `to`' })
  .refine((e) => (e.op === 'when' ? !!e.key && (!!e.then?.length || !!e.text) : true), { message: 'a when needs `key` and `then` or `text`' })
  .refine((e) => (e.op === 'pick' ? !!e.key && !!e.weights : true), { message: 'a pick needs `key` and `weights`' })
  .refine((e) => (e.op === 'roll' || e.op === 'capFlag' || e.op === 'setFlag' || e.op === 'stageMod' ? !!e.key && e.n !== undefined : true), { message: 'needs `key` and `n`' })
  .refine((e) => (e.op === 'scene' || e.op === 'fossil' || e.op === 'stampRegion' || e.op === 'stampStage' ? !!e.key : true), { message: 'needs `key`' })
  .refine((e) => (e.op === 'partyHas' ? !!e.key && !!e.species : true), { message: 'a partyHas needs `key` and `species`' })
  // leadBoost: the lead's next battle opens with stat `type` at `n` stages ("the lead starts its next battle at -1 Speed").
  .refine((e) => (e.op === 'leadBoost' ? ['atk', 'def', 'spa', 'spd', 'spe', 'acc'].includes(e.type ?? '') && !!e.n : true), { message: 'a leadBoost needs a stat `type` and `n`' })
  // itemEach: one of item `key` for every party Pokémon ("one Berry each for the party").
  .refine((e) => (e.op === 'itemEach' ? !!e.key : true), { message: 'an itemEach needs `key` (the item)' })
  // noFaint: adds `n` to flag `key` when nobody in the party has fainted (a battle won "without letting anyone faint").
  .refine((e) => (e.op === 'noFaint' ? !!e.key && e.n !== undefined : true), { message: 'a noFaint needs `key` and `n`' })
  // clampFlag: holds flag `key` between `min` and `max` (the rain's Flame, 0 to 5).
  .refine((e) => (e.op === 'clampFlag' ? !!e.key && e.min !== undefined && e.max !== undefined : true), { message: 'a clampFlag needs `key`, `min` and `max`' });
export type GnEffect = z.infer<typeof GnEffectSchema>;

/**
 * A Greenneedle condition (condition `gn`).
 *  - `regionChanged`: the run flag `key` was stamped (`stampRegion`) in an earlier region than the one the player is in now ("he's back next region").
 *  - `notThisRegion`: the run flag `key` was not stamped in the region the player is in now (never stamped counts: "at most once per region").
 *  - `laterStage` / `sameStage` / `notThisStage`: against the stage stamped in `key` (`stampStage`): a later stage than it, the same stage,
 *    or any stage but it (never stamped counts as "not this stage").
 *  - `thisRegion`: the run flag `key` was stamped in the region the player is in now ("later in the region").
 *  - `notRegion`: the run is in none of the regions listed in `types` (a Greenneedle event that Kanto shows through its own canon space).
 *  - `noMoveType`: no party Pokémon knows a move of any of `types` (the mine's pickaxe is for a party with no Fighting, Steel or Ground move).
 */
export const GnCondSchema = z.object({ kind: z.literal('gn'), test: z.enum(['regionChanged', 'notThisRegion', 'laterStage', 'sameStage', 'notThisStage', 'noMoveType', 'notRegion', 'thisRegion']), key: Key.optional(), types: z.array(z.string().min(1)).min(1).max(6).optional() })
  .refine((c) => (c.test === 'noMoveType' || c.test === 'notRegion' ? !!c.types : !!c.key), { message: 'noMoveType and notRegion need `types` (move types / region ids), the others need `key`' });
export type GnCond = z.infer<typeof GnCondSchema>;

/**
 * A Greenneedle fight rule (event rule `gn`), see core/greenneedle/index.ts for what each one does.
 *  - `samurai`: the Samurai's duel (gn.03). His Pinsir will not strike a foe that is not facing it: after a guarding move it waits a turn.
 *    A duelist that trusts you (friendship) moves first on its first move.
 *  - `tully`: Damian's friend Tully (gn.05). His Pokémon uses Splash, on purpose, twice, before it does anything else.
 *  - `bex`: Damian's friend Bex (gn.05). She spends the first turn looking for the attack button.
 *  - `damian`: Damian himself (gn.05). His last Pokémon is the ace he actually trained: `ace` levels higher, a held item that fits its type,
 *    and two moves that cover its weaknesses.
 */
export const GN_RULES = ['samurai', 'tully', 'bex', 'damian', 'lastflame'] as const;
export const GnRuleSchema = z.enum(GN_RULES);
export type GnRule = z.infer<typeof GnRuleSchema>;

const Stages = z.partialRecord(z.enum(['atk', 'def', 'spa', 'spd', 'spe']), z.number().int().min(-6).max(6));
/** Extra fields of an event fight's rule that the Greenneedle events use. */
export const GnRuleFields = {
  /** A named Greenneedle rule. */
  gn: GnRuleSchema.optional(),
  /** Your Pokémon carrying this Greenneedle mark leads (the forest duelist). */
  leadMark: Key.optional(),
  /** Stat stages your first Pokémon starts with (the Squad's hose: Speed -1). */
  myStages: Stages.optional(),
  /** Stat stages the foe's first Pokémon starts with. */
  foeStages: Stages.optional(),
  /** With rule `damian`: how many levels the ace stands above the rest of the team. */
  ace: z.number().int().min(0).max(5).optional(),
};
