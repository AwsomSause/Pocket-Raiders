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
 */
export const GN_OPS = ['duelist', 'capFlag', 'setFlag', 'unmark', 'roll', 'pick', 'when', 'route', 'scene', 'stageMod', 'fossil', 'stampRegion'] as const;
export const GnEffectSchema = z.object({
  kind: z.literal('gn'),
  op: z.enum(GN_OPS),
  key: Key.optional(),
  n: z.number().int().optional(),
  type: z.string().optional(),
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
  .refine((e) => (e.op === 'scene' || e.op === 'fossil' || e.op === 'stampRegion' ? !!e.key : true), { message: 'needs `key`' });
export type GnEffect = z.infer<typeof GnEffectSchema>;

/**
 * A Greenneedle condition (condition `gn`).
 *  - `regionChanged`: the run flag `key` was stamped (`stampRegion`) in an earlier region than the one the player is in now ("he's back next region").
 */
export const GnCondSchema = z.object({ kind: z.literal('gn'), test: z.enum(['regionChanged']), key: Key });
export type GnCond = z.infer<typeof GnCondSchema>;

/**
 * A Greenneedle fight rule (event rule `gn`), see core/greenneedle/index.ts for what each one does.
 *  - `samurai`: the Samurai's duel (gn.03). His Pinsir will not strike a foe that is not facing it: after a guarding move it waits a turn.
 *    A duelist that trusts you (friendship) moves first on its first move.
 *  - `tully`: Damian's friend Tully (gn.05). His Pokémon uses Splash, on purpose, twice, before it does anything else.
 *  - `bex`: Damian's friend Bex (gn.05). She spends the first turn looking for the attack button.
 */
export const GN_RULES = ['samurai', 'tully', 'bex'] as const;
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
};
