// Beta 0.6 INSTRUMENTALITY foundation (slices F1 + F2). The expansion's player settings and its optional run block.
// Pure data + Zod, no Phaser. Every field has the safe default, and nothing in the base game reads these yet, so with the
// defaults the game plays exactly as it did before (see tests/unit/expansionFoundation.test.ts).

import { z } from 'zod';
import { CastEntrySchema } from './cast/entry';
import { CanonStateSchema } from './canonSpaces';
import { TrackStateSchema } from './track';
import { RescueStateSchema } from '../evil/rescueSchema';
import { TeamSkyStateSchema } from '../evil/teamSkySchema';
import { EpilogueStateSchema, GrandArcStateSchema } from '../grandArc/schema';
import { UltraRunStateSchema } from '../ultra/schema';
import { StandWithStateSchema } from '../arc/standWithSchema';
import { RivalOverhaulStateSchema } from '../rivals/overhaulSchema';
import { BlessingStateSchema } from '../blessings/schema';
import { SkyStateSchema } from '../sky/state';
import { NodeMenuStateSchema } from '../nodeMenu/state';
import { NodeMenuSpecialStateSchema } from '../nodeMenu/special/schema';
import { RewindStateSchema } from '../rewindSchema';

/** F1: every expansion setting at its default (plan section 10). Lives in `settings.expansion` (settings v42). */
export const ExpansionSettingsSchema = z.object({
  /** Climax length: the current climax, or the Extended Cut. Extended becomes the default only after final balance. */
  climaxCut: z.enum(['standard', 'extended']).default('standard'),
  /** How many quiet-node story events appear. */
  eventsDensity: z.enum(['low', 'normal', 'full']).default('normal'),
  grandArcEnabled: z.boolean().default(true),
  /** Decision N: mic input, off until the player turns it on. A button always does the same thing. */
  micInput: z.boolean().default(false),
  /** Decision O: minigame difficulty. */
  minigamesDifficulty: z.enum(['easy', 'normal', 'hard']).default('normal'),
  kantoSevii: z.boolean().default(true),
  /** B6 stage pacing: 4–5 trainer fights per stage (1–2 skippable), an ace trainer, doubles from region 2, EXP −20%. Read when a run starts. */
  stagePacing: z.boolean().default(true),
  /** B9 Evolution Encounters: evolution-themed events and wild pre-evolutions meeting their stone. Risky Evolutions stay off. */
  evolutionEncounters: z.boolean().default(true),
  /** Beta 0.7 Node Event Menus: every map node becomes a small menu (core/nodeMenu). On by default since the P7 sims (run length within target). Read when a run starts. */
  nodeMenus: z.boolean().default(true),
  /** B7 E4 counter-pick: register 6 at the League door, swap 1. */
  leagueCounterPick: z.boolean().default(true),
  /** E2 world-state tracks (the Kanto Rocket Ledger): shops, shut Centers and thinner wild pools follow how the team's operations go. */
  worldTracks: z.boolean().default(true),
  /** Beta 0.7: team-wide battle traits for Alola and Paldea story events (Hype Man, Reluctant Hand). Off by default; read when a run starts. */
  storyTraits: z.boolean().default(false),
  /** Beta 0.7 Sabrina's Labyrinth accessibility: after losing there, resume from the last Pokémon found instead of starting the Labyrinth over. Read at run start. */
  labyrinthResume: z.boolean().default(false),
  /** Beta 0.7 E11: the Citadark finale is offered after the last region to a run with three Data ROMs (needs the Grand Arc). Off until the final balance pass. */
  finaleEnabled: z.boolean().default(false),
  /** Beta 0.7 D1: the Region of Doom ("The Margin") as an in-run epilogue after the win. Off until the final balance pass. */
  doomEpilogue: z.boolean().default(false),
  /** Beta 0.7 L3 Rewinds (test switch until the blessings grant them): the Time Keeper's rewind in every run, once per stage. Read at run start. */
  rewinds: z.boolean().default(false),
  /** Legendary Blessings (Beta 0.7): each run opens with one Legendary's blessing. On by default (Kice, 2026-11-15, catalog overhaul legends). */
  blessingsEnabled: z.boolean().default(true),
  /** Beta 0.7 U1 Ultra Beast Incursions: on by default (Kice, 2026-11-15, catalog overhaul legends). Read when a run starts. */
  ultraBeastsEnabled: z.boolean().default(true),
  /** Catalog Overhaul (legends) Whole Run Events: 35% of runs follow one story from Stage 2 to the Champion. On by default (Kice: every legends piece on). Read when a run starts. */
  wholeRunEvents: z.boolean().default(true),
  /** Beta 0.7 S1 Second Chance: the percent chance a run-ending loss is turned into a revive, once per run (0 = off). Read when a run starts. */
  secondChancePct: z.number().min(0).max(100).default(5),
  /** H1 heated-moment moves (BALANCE 6): the Hyper slot move needs the conditions, a 6% roll and the per-region/per-run caps. Read when a run starts. */
  heatedMoments: z.boolean().default(true),
  /** Beta 0.7 M1 Mythical Promises (in-run only): Mythicals can be told of, visit and ask for a promise. Read when a run starts. */
  mythicalsEnabled: z.boolean().default(true),
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
  /** Dossier (E1): the cast characters met this run (`sc.*` id -> status and when first met). Raid levers write `cast` above; this is separate. */
  dossier: z.record(z.string(), CastEntrySchema).optional(),
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
  /** Node Event Menus P5 special entries (core/nodeMenu/special): forks, linked follow-ups, the escort, what rivals took. Optional, no save bump. */
  nodeMenuSpecial: NodeMenuSpecialStateSchema.optional(),
  /** Attribute changes that last one stage (Celadon's Bad Luck Charm): undone when the stage changes. No save-version bump: old runs have none. */
  stageMods: z.array(z.object({ key: z.string(), amount: z.number().int(), region: z.number().int(), stage: z.number().int() })).optional(),
  /** Grand Arc (E7): Data ROMs and the Stock track. Present only when the setting was on at run start. */
  grandArc: GrandArcStateSchema.optional(),
  /** Stand With Them (E8): the Inside Man route, once you have joined a team at Ignition. */
  standWith: StandWithStateSchema.optional(),
  /** Legendary Blessing (Beta 0.7): this run's one blessing. Present only when the setting was on at run start; old saves have none, no save-version bump. */
  blessing: BlessingStateSchema.optional(),
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
  /** The `storyTraits` setting the run started with. */
  storyTraits: z.boolean().optional(),
  /** Stages whose Galar tremor (a wild Dynamax, track step 2) has already happened: `regionIndex:stageIndex`. */
  tremors: z.array(z.string()).max(24).optional(),
  /** Story events placed per region so far (E3 scheduler), by region id. */
  xe: z.record(z.string(), z.number().int().min(0)).optional(),
  /** Runs with the world-state tracks on (E2). Set once at run start. */
  tracks: z.boolean().optional(),
  /** Beta 0.7 L3 Rewinds (core/rewind.ts): the run and battle snapshots. Present only when rewinds were granted. */
  rewind: RewindStateSchema.optional(),
  /** Camp scenes: the last player Pokémon to faint and the encounter count then (cleared by a night's rest). */
  lastFaint: z.object({ uid: z.string(), at: z.number().int().min(0) }).optional(),
  /** Beta 0.7 U1 Ultra Beast Incursions (core/ultra/run.ts). Present only when the setting was on at run start. No save bump: old runs have none. */
  ultra: UltraRunStateSchema.optional(),
  /** B7: the Pokémon (uids) registered at the League door. Only these are ever countered; a swapped-in Pokémon is unseen. `swapped` = the one swap is used. */
  league: z.object({ registered: z.array(z.string()), swapped: z.boolean().default(false) }).optional(),
  /** Beta 0.7 Node Event Menus (core/nodeMenu): present only in runs started with the setting on. No save bump. */
  nodeMenus: NodeMenuStateSchema.optional(),
  /** Beta 0.7 S1: the Second Chance percent this run started with (0 or missing = off) and whether it has been used. In-run only. */
  secondChancePct: z.number().min(0).max(100).optional(),
  secondChance: z.object({ at: z.number().int().min(0), rival: z.string().nullable() }).optional(),
  /** Beta 0.7 Flight North (core/instrumentality/flightNorth.ts): the Bug-type that left after the stage. `ready` = its return can still save a lost run. Optional, no save bump. */
  flightNorth: z.object({
    line: z.enum(['caterpie', 'weedle']),
    name: z.string().default(''),
    friendship: z.number().int().min(0).max(255).default(0),
    shiny: z.boolean().default(false),
    state: z.enum(['ready', 'fighting', 'offered', 'kept', 'released']).default('ready'),
    /** The uid the Bug-type has once it is offered again (so keep or release can be told apart). */
    uid: z.string().optional(),
  }).optional(),
  /** Beta 0.7 H1: runs with heated-moment limits on, and what has been granted (per region, total, and which Pokémon). */
  heated: z.boolean().optional(),
  heatedLog: z.object({ perRegion: z.record(z.string(), z.number().int().min(0)).default({}), total: z.number().int().min(0).default(0), mons: z.array(z.string()).default([]) }).optional(),
  /** Beta 0.7 M1: runs with Mythical Promises on, and this run's Tellings, visit and Guest (core/instrumentality/promises.ts). In-run only: no Storybook, no Keepsakes. */
  promises: z.boolean().optional(),
  promise: z.object({
    tellings: z.record(z.string(), z.number().int().min(0)).default({}),
    /** The one Mythical that has visited this run (declined, accepted or lost), or null. */
    visited: z.string().nullable().default(null),
    guest: z.object({ id: z.string(), forgiven: z.boolean().default(false) }).nullable().default(null),
    kept: z.array(z.string()).default([]),
    left: z.array(z.string()).default([]),
  }).optional(),
  /** Beta 0.7 workstream 13: in-run epilogue (Citadark finale, Region of Doom). */
  epilogue: EpilogueStateSchema.optional(),
  /** Beta 0.7: Pidgey's Resolve, the Rivalry of the Sky (core/sky). */
  sky: SkyStateSchema.optional(),
  /** Team Sky run by the player (catalog row 9, HOENN_TEAMS parts 6-7; core/evil/teamSky.ts). Optional, no save bump. */
  teamSky: TeamSkyStateSchema.optional(),
});
export type ExpansionRun = z.infer<typeof ExpansionRunSchema>;
