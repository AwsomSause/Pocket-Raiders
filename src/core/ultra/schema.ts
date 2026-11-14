// Beta 0.7 U1: the run-state shape (kept free of other imports so state/expansion schemas can load it without cycles).
import { z } from 'zod';

export const CurSchema = z.object({
  dmg: z.record(z.string(), z.number()).default({}),
  taken: z.number().default(0),
  crits: z.number().default(0),
  boosts: z.number().default(0),
  items: z.number().default(0),
  oneHitKos: z.number().default(0),
  spectacle: z.number().default(0),
  faints: z.number().default(0),
  hitsOnFoe: z.number().default(0),
});
const StageFactsSchema = z.object({ bossWins: z.number().default(0), flawless: z.number().default(0), oneHit: z.number().default(0), spectacle: z.number().default(0) });

export const UltraRunStateSchema = z.object({
  /** The ten hidden tallies (never shown to the player). */
  appetites: z.record(z.string(), z.number().int().min(0)).default({}),
  contact: z.enum(['none', 'static', 'tear', 'incursion']).default('none'),
  beastId: z.string().nullable().default(null),
  /** The stage number (1-based, whole run) when the contact stage began. */
  stageNo: z.number().int().min(0).default(0),
  /** Beasts already met this run (one per run). */
  met: z.array(z.string()).default([]),
  /** The Tear's stop id on the current stage map. */
  tearStop: z.string().nullable().default(null),
  /** The Incursion Beast already took its wild fight. */
  incursionDone: z.boolean().default(false),
  /** The Task Force's first Beast Ball was handed over. */
  parcel: z.boolean().default(false),
  /** A held Beast: its uid and Homesickness (0 to 10). */
  homesick: z.object({ uid: z.string(), value: z.number().int().min(0).max(10) }).nullable().default(null),
  /** Beasts that came home with the player and left again (shown once). */
  left: z.array(z.string()).default([]),
  /** Facts of the battle in progress (reset when it begins). */
  cur: CurSchema.default(() => CurSchema.parse({})),
  /** Facts of the stage in progress (they lower Homesickness at the next stage start). */
  stage: StageFactsSchema.default(() => StageFactsSchema.parse({})),
});

