// Beta 0.6 INSTRUMENTALITY foundation (slices F1 + F2). The expansion's player settings and its optional run block.
// Pure data + Zod, no Phaser. Every field has the safe default, and nothing in the base game reads these yet, so with the
// defaults the game plays exactly as it did before (see tests/unit/expansionFoundation.test.ts).

import { z } from 'zod';
import { CanonStateSchema } from './canonSpaces';
import { TrackStateSchema } from './track';
import { RescueStateSchema } from '../evil/rescueSchema';
import { GrandArcStateSchema } from '../grandArc/schema';
import { StandWithStateSchema } from '../arc/standWithSchema';
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
  /** E2 world-state tracks (the Kanto Rocket Ledger): shops, shut Centers and thinner wild pools follow how the team's operations go. */
  worldTracks: z.boolean().default(true),
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
  track: z.record(z.string(), TrackStateSchema).optional(),
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
  /** Rival Rescue Plan (R9; core/evil/rescue.ts): holds, the running plan, returned Pokémon, attitude, memory. */
  rescue: RescueStateSchema.optional(),
  /** Canon Spaces (workstream 18): `kanto.*` flags, finished spaces and the town menus already rolled. No save-version bump: old runs have none. */
  canon: CanonStateSchema.optional(),
  /** Field Notes: special Pokémon met (`sv.*`) and, per special Shadow (`ss.*`), how many of its key hints were given (1-3). Observation only; no cross-run memory. */
  fieldNotes: z.object({ special: z.array(z.string()).default([]), shadow: z.record(z.string(), z.number().int().min(1).max(3)).default({}) }).optional(),
  /** Grand Arc (E7): Data ROMs and the Stock track. Present only when the setting was on at run start. */
  grandArc: GrandArcStateSchema.optional(),
  /** Stand With Them (E8): the Inside Man route, once you have joined a team at Ignition. */
  standWith: StandWithStateSchema.optional(),
  /** Runs that started with the stage-pacing setting on (B6). Set once at run start, never changed. */
  pacing: z.boolean().optional(),
  /** Runs with Evolution Encounters on (B9). */
  evoEncounters: z.boolean().optional(),
  /** Runs with the E4 counter-pick on (B7). */
  counterPick: z.boolean().optional(),
  /** The story-event density this run started with (E3): how many quiet-node story events a region gets. Set once at run start. */
  density: z.enum(['low', 'normal', 'full']).optional(),
  /** The climax length the run started with (the `climaxCut` setting); run events that need the Extended Cut read it. */
  climaxCut: z.enum(['standard', 'extended']).optional(),
  /** Story events placed per region so far (E3 scheduler), by region id. */
  xe: z.record(z.string(), z.number().int().min(0)).optional(),
  /** Runs with the world-state tracks on (E2). Set once at run start. */
  tracks: z.boolean().optional(),
  /** Camp scenes: the last player Pokémon to faint and the encounter count then (cleared by a night's rest). */
  lastFaint: z.object({ uid: z.string(), at: z.number().int().min(0) }).optional(),
  /** B7: the Pokémon (uids) registered at the League door. Only these are ever countered; a swapped-in Pokémon is unseen. `swapped` = the one swap is used. */
  league: z.object({ registered: z.array(z.string()), swapped: z.boolean().default(false) }).optional(),
});
export type ExpansionRun = z.infer<typeof ExpansionRunSchema>;
