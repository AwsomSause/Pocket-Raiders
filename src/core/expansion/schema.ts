// Beta 0.6 INSTRUMENTALITY foundation (slices F1 + F2). The expansion's player settings and its optional run block.
// Pure data + Zod, no Phaser. Every field has the safe default, and nothing in the base game reads these yet, so with the
// defaults the game plays exactly as it did before (see tests/unit/expansionFoundation.test.ts).

import { z } from 'zod';
import { RivalOverhaulStateSchema } from '../rivals/overhaulSchema';

/** F1: every expansion setting at its default (plan section 10). Lives in `settings.expansion` (settings v42). */
export const ExpansionSettingsSchema = z.object({
  /** Climax length: the current climax, or the Extended Cut. Extended becomes the default only after final balance. */
  climaxCut: z.enum(['standard', 'extended']).default('standard'),
  /** Second Shot (decision A): the first climax loss retries; the second never ends the run. */
  climaxSecondShot: z.boolean().default(true),
  /** How many quiet-node story events appear. */
  eventsDensity: z.enum(['low', 'normal', 'full']).default('normal'),
  grandArcEnabled: z.boolean().default(true),
  rivalOverhaul: z.boolean().default(true),
  rivalFriend: z.boolean().default(true),
  /** Second Chance chance, in percent (0 turns it off). */
  secondChancePct: z.number().min(0).max(100).default(5),
  /** Decision D: healing items and revives allowed per battle (E4, rivals and the Champion use the same). */
  healsPerBattle: z.number().int().min(0).max(99).default(10),
  revivesPerBattle: z.number().int().min(0).max(99).default(6),
  /** Decision N: mic input, off until the player turns it on. A button always does the same thing. */
  micInput: z.boolean().default(false),
  /** Decision O: minigame difficulty. */
  minigamesDifficulty: z.enum(['easy', 'normal', 'hard']).default('normal'),
  blessingsEnabled: z.boolean().default(true),
  mythicalsEnabled: z.boolean().default(true),
  ultraBeastsEnabled: z.boolean().default(true),
  /** Whole Run Events: chance a run has one, in percent. */
  wholeRunEventsPct: z.number().min(0).max(100).default(35),
  /** Rocket "what-if" casts (rocket.x.triad and the other what-if switches). */
  whatIfCasts: z.boolean().default(true),
  kantoSevii: z.boolean().default(true),
  /** B6 stage pacing: 4–5 trainer fights per stage (1–2 skippable), an ace trainer, doubles from region 2, EXP −20%. Read when a run starts. */
  stagePacing: z.boolean().default(true),
  /** B9 Evolution Encounters: evolution-themed events and wild pre-evolutions meeting their stone. Risky Evolutions stay off. */
  evolutionEncounters: z.boolean().default(true),
  /** B7 E4 counter-pick: register 6 at the League door, swap 1. */
  leagueCounterPick: z.boolean().default(true),
});
export type ExpansionSettings = z.infer<typeof ExpansionSettingsSchema>;
export const EXPANSION_SETTINGS_DEFAULTS: ExpansionSettings = ExpansionSettingsSchema.parse({});

/**
 * F2: the optional `run.expansion` block (run v43). Every field is optional, so an older run loads untouched and a run
 * that never meets the expansion never has the block. Later slices fill these in; the shapes are loose on purpose until
 * then (`unknown` records) and are tightened by the slice that owns each one.
 */
export const ExpansionRunSchema = z.object({
  /** World-state track step and history (E2). */
  track: z.record(z.string(), z.unknown()).optional(),
  /** Cast statuses (E1). */
  cast: z.record(z.string(), z.unknown()).optional(),
  /** Raids n1–6 (E5b). */
  raids: z.record(z.string(), z.unknown()).optional(),
  eventsSeen: z.array(z.string()).optional(),
  cut: z.record(z.string(), z.unknown()).optional(),
  siege: z.record(z.string(), z.unknown()).optional(),
  apex: z.record(z.string(), z.unknown()).optional(),
  friend: z.record(z.string(), z.unknown()).optional(),
  /** Rival overhaul state by rival id (R1-R3, R10; core/rivals/overhaul.ts). */
  rival: z.record(z.string(), RivalOverhaulStateSchema).optional(),
  rescue: z.record(z.string(), z.unknown()).optional(),
  /** Runs that started with the stage-pacing setting on (B6). Set once at run start, never changed. */
  pacing: z.boolean().optional(),
  /** Runs with Evolution Encounters on (B9). */
  evoEncounters: z.boolean().optional(),
  /** Runs with the E4 counter-pick on (B7). */
  counterPick: z.boolean().optional(),
  /** B7: the Pokémon (uids) registered at the League door. Only these are ever countered; a swapped-in Pokémon is unseen. `swapped` = the one swap is used. */
  league: z.object({ registered: z.array(z.string()), swapped: z.boolean().default(false) }).optional(),
});
export type ExpansionRun = z.infer<typeof ExpansionRunSchema>;
