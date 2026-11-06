// Raid boss definitions (Blueprint: Raids, Mega-Expeditions, Totem Pokémon & Minigames, section 1).
// A raid is a boss with mechanics: a big HP pool, shields, phases, telegraphed attacks, extra actions,
// an optional turn timer and a reward table. Every mechanic is optional (low tiers use one or two).

import { z } from 'zod';
import { BoostStatSchema, TerrainSchema, TypeNameSchema, WeatherSchema } from '../contentSchema';

const Fraction = z.number().gt(0).lt(1);

export const RaidPhaseSchema = z.object({
  /** The phase starts once the boss is at or below this share of its HP. */
  atHp: Fraction,
  /** Shown to the player when the phase starts. */
  text: z.string().min(1),
  /** Stat stages the boss gains. */
  boost: z.partialRecord(BoostStatSchema, z.number().int().min(-6).max(6)).optional(),
  weather: WeatherSchema.optional(),
  /** Wipes the player's stat changes. */
  clearPlayerStages: z.boolean().optional(),
  /** Cures the boss's status condition and lowers its own negative stages to 0. */
  cleanse: z.boolean().optional(),
  /** S392 Raid Shields by Phase: a fresh shield worth this share of the boss's max HP rises when the phase starts. */
  shield: z.number().min(0.05).max(0.5).optional(),
});
export type RaidPhase = z.infer<typeof RaidPhaseSchema>;

/** Field rules of a raid (Raid Battles pack): all optional. */
export const RaidModifiersSchema = z.object({
  /** A terrain that lasts the whole fight. */
  terrain: TerrainSchema.optional(),
  /** Elemental surge: the boss's moves of this type hit `boost` times as hard. */
  surge: z.object({ type: TypeNameSchema, boost: z.number().min(1.1).max(2), text: z.string().min(1) }).optional(),
  /** Healing restriction: no healing items and no Healing cheer. */
  noHealing: z.boolean().optional(),
  /** Rotating weakness: every `everyTurns` turns the boss is weak to the next type (your moves of it do `boost` times the damage). */
  /** S397 Boss Weak Spots: the exposed zone swaps every `everyTurns` turns between the body (physical hits do `boost` times the damage) and the core (special hits do). */
  weakSpots: z.object({ everyTurns: z.number().int().min(2).max(6), boost: z.number().min(1.1).max(1.6) }).optional(),
  rotatingWeakness: z.object({ types: z.array(TypeNameSchema).min(2).max(6), everyTurns: z.number().int().min(2).max(6), boost: z.number().min(1.1).max(2) }).optional(),
  /** S412 Boss Arenas: a hazard unique to this boss's arena. Each turn end your Pokémon in front loses `percent` of its max HP (never to 0), unless it is one of the `immune` types. */
  hazard: z.object({ type: TypeNameSchema, percent: z.number().min(0.03).max(0.15), text: z.string().min(1), immune: z.array(TypeNameSchema).default([]) }).optional(),
  /** S406 Titan Mode: no single hit takes more than `hitCapPercent` of the boss's max HP while it is braced. A status in `openedBy`, or its Defense at -`defDrop`, topples it and lifts the cap. */
  titan: z.object({ hitCapPercent: z.number().int().min(5).max(30), openedBy: z.array(z.enum(['slp', 'par', 'frz'])).default(['slp', 'par', 'frz']), defDrop: z.number().int().min(1).max(3).default(2), text: z.string().min(1) }).optional(),
  /** S411 Boss Puzzles: the boss's defence takes `guard` times the damage until you hit it with a pattern of `steps` types in order (a wrong damaging hit starts over). The pattern comes from `pool`, the same every time for one fight. */
  puzzle: z.object({ steps: z.number().int().min(2).max(4), pool: z.array(TypeNameSchema).min(3).max(8), guard: z.number().min(0.2).max(0.9), text: z.string().min(1) }).optional(),
});
export type RaidModifiers = z.infer<typeof RaidModifiersSchema>;

/** How the player takes on a raid (regional approach, rival choice). Chosen at the den; the cost is paid on entering. */
export const RaidApproachSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  label: z.string().min(1),
  text: z.string().min(1),
  cost: z.number().int().min(0).default(0),
  /** Added to the boss's HP boost (percent; negative = a weaker boss). */
  hpDeltaPercent: z.number().int().min(-60).max(100).default(0),
  /** The boss starts the fight at this share of its HP (a rival already fought it); shields above it are gone. */
  startHp: Fraction.optional(),
  /** Sets or shifts the timer (a race): added to the raid's timer, or to 20 when it has none. */
  timerDelta: z.number().int().min(-15).max(15).default(0),
  /** Prize money and extra draft choices after the win. */
  rewardPercent: z.number().int().min(10).max(200).default(100),
  draftDelta: z.number().int().min(-2).max(2).default(0),
  /** A rival trainer fights beside you ("The Rival Who Stood Beside You" for the Pokémon in front). */
  rivalHelps: z.boolean().default(false),
  /** A rival races you for the last hit (hits harder, and a rival that lands the final blow takes half the prize). */
  rivalRaces: z.boolean().default(false),
  /** Walk away: no fight, the den is used up. */
  leave: z.boolean().default(false),
});
export type RaidApproach = z.infer<typeof RaidApproachSchema>;

export const RaidRewardSchema = z.object({
  /** Prize money = this × the boss's level. */
  moneyPerLevel: z.number().int().min(0),
  /** Bag items, each with its own chance (rolled once, from a seeded generator). */
  items: z.array(z.object({ item: z.string(), chance: z.number().min(0).max(1) })).default([]),
  /** Extra choices in the reward draft after the win. */
  draftExtra: z.number().int().min(0).max(3).default(0),
  /** The beaten boss offers to join the team (a normal catch decision). */
  joinChance: z.number().min(0).max(1).default(0),
  /** Mega resources: Mega Stones for good (one per party Pokémon that can use one, up to this many), plus a Mega Ring if you have none. */
  megaStones: z.number().int().min(0).max(3).default(0),
  /** Rare-encounter tokens: the next this-many wild encounters are far likelier to be rare or Legendary. */
  rareEncounters: z.number().int().min(0).max(3).default(0),
});

export const RaidDefSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  tier: z.number().int().min(1).max(6),
  blurb: z.string().min(1),
  /** The boss is one of these species (picked from a seeded generator, so a den is stable). */
  species: z.array(z.string()).min(1),
  /** Levels above the region's top wild level (always kept at or under the region's level cap). */
  levelBonus: z.number().int().min(0).max(10),
  /** Extra max HP, in percent (300 = four times the normal HP pool). */
  hpBoostPercent: z.number().int().min(0).max(900),
  /** Money the player pays at the den (spent once, when the raid starts). */
  entryCost: z.number().int().min(0),
  /** Shields: each threshold raises a shield worth `points` of the boss's max HP; the boss can't drop below the threshold until it breaks. */
  shield: z.object({ at: z.array(Fraction).min(1).max(3), points: z.number().min(0.05).max(0.5) }).nullable().default(null),
  phases: z.array(RaidPhaseSchema).max(3).default([]),
  /** Every `everyTurns` turns the boss charges: its next hit is `boost` times stronger unless the player breaks a shield first, or puts the boss under one of the `interruptedBy` statuses (counterplay, catalog 24). */
  telegraph: z.object({ everyTurns: z.number().int().min(2).max(6), boost: z.number().min(1.1).max(2), text: z.string(), interruptedBy: z.array(z.enum(['slp', 'par', 'frz'])).default(['slp', 'par', 'frz']) }).nullable().default(null),
  /** An extra attack after the normal actions, once the boss is under `belowHp`; at most `max` times per battle. */
  extraActions: z.object({ belowHp: Fraction, max: z.number().int().min(1).max(3) }).nullable().default(null),
  /** The raid ends when the timer runs out. */
  timerTurns: z.number().int().min(5).max(60).nullable().default(null),
  /** S396 Boss Enrage Timer: from turn `afterTurn` the boss hits `boostPercent` harder, again every `everyTurns` turns, up to `maxStacks` times. */
  enrage: z.object({ afterTurn: z.number().int().min(3).max(40), everyTurns: z.number().int().min(2).max(10), boostPercent: z.number().int().min(5).max(50), maxStacks: z.number().int().min(1).max(5) }).nullable().default(null),
  weather: WeatherSchema.nullable().default(null),
  /** wild: the plain den. regional: choose how to prepare. rival: a rival is already fighting it. anomaly: strange rules and a research find. */
  kind: z.enum(['wild', 'regional', 'rival', 'anomaly']).default('wild'),
  approaches: z.array(RaidApproachSchema).max(3).default([]),
  modifiers: RaidModifiersSchema.default({}),
  /** Moves the boss knows beyond the usual four (up to two more). */
  extraMoves: z.array(z.string()).max(2).default([]),
  rewards: RaidRewardSchema,
  /** Boss HP lines at which it calls a minion. Never authored: badge scaling fills it in (core/raid/scaling.ts). */
  summons: z.array(Fraction).max(3).default([]),
  /**
   * A Gang Raid (APPROVED.md §12): an evil faction's stronghold. The boss is a Shadow Pokémon; the approaches are the
   * ways in (stealth, direct, rescue-first). Never in the random den pool: the shadow world places it (shadowWorld/world.ts).
   */
  gang: z.object({
    faction: z.string().min(1),
    shadowBoss: z.boolean().default(true),
    /** The Shadow boss joins you when you win (kept Shadow; purify it over the run). */
    rescue: z.boolean().default(true),
    /** The faction's lieutenant leads this raid (escapes twice, then is caught). */
    lieutenant: z.boolean().default(false),
    /** Operations of the faction that fall when you win. */
    heatDrop: z.number().int().min(1).max(3).default(1),
  }).optional(),
  /** The finale of a Legendary world event (core/legendary): never drawn for a den or an ordinary expedition. */
  legendary: z.boolean().default(false),
  /** S407 Gauntlet Bosses: when the boss would faint it rises in the next form (full HP, new moves); it falls for good after the last. */
  gauntlet: z.object({ forms: z.array(z.object({ species: z.string(), text: z.string().min(1) })).min(1).max(4) }).optional(),
  /** S409 Boss Pokémon Capture: a Poké Ball works once the boss is at or below this share of its HP; the catch ends the raid as a win. */
  capture: Fraction.optional(),
  /** Special dens (titan, gauntlet, mini-boss) are never drawn for an ordinary den: the world places them on their own (core/raid/raid.ts placeSpecialDens). */
  special: z.enum(['titan', 'gauntlet', 'mini']).optional(),
  /** The Grand-Enemy's own fights (core/story/grandEnemy): placed by the campaign, never in the random den pool. */
  grand: z.enum(['contact', 'reckoning']).optional(),
});
export type RaidDef = z.infer<typeof RaidDefSchema>;

/** How badges scale a raid (spec 31). Badges are the main progression signal; special raids take a share of it, the Grand-Enemy and gang raids none. */
export const BadgeScalingSchema = z.object({
  /** Extra boss levels per badge (kept at or under the region's level cap), up to `maxLevelBonus`. */
  levelPerBadge: z.number().min(0).max(2),
  maxLevelBonus: z.number().int().min(0).max(12),
  /** Extra boss HP (percent of the base pool) per badge, up to `maxHpPercent`. */
  hpPercentPerBadge: z.number().min(0).max(30),
  maxHpPercent: z.number().int().min(0).max(300),
  /** Each shield is worth this much more of the boss's HP per badge. */
  shieldPointsPerBadge: z.number().min(0).max(0.05),
  /** The charged attack hits this much harder per badge (never above ×2), and charges one turn sooner from `fasterChargeBadges`. */
  telegraphBoostPerBadge: z.number().min(0).max(0.1),
  fasterChargeBadges: z.number().int().min(1),
  /** From this many badges the boss knows its second extra move, uses its hidden ability, gets one more bonus attack and (tier 3+) a last shield at 25% HP. */
  secondMoveBadges: z.number().int().min(1),
  hiddenAbilityBadges: z.number().int().min(1),
  extraActionBadges: z.number().int().min(1),
  lastShieldBadges: z.number().int().min(1),
  /** Prize money grows by this percent per badge (up to `maxMoneyPercent`); one more draft choice and (tier 5+) one more rare-encounter token from these badge counts. */
  moneyPercentPerBadge: z.number().min(0).max(20),
  maxMoneyPercent: z.number().int().min(0).max(300),
  extraDraftBadges: z.number().int().min(1),
  rareTokenBadges: z.number().int().min(1),
  /** The share of the badge count used by each raid kind (default 1; the Grand-Enemy and gang raids are never scaled). */
  kindShare: z.partialRecord(z.enum(['wild', 'regional', 'rival', 'anomaly']), z.number().min(0).max(1)).default({}),
  /** Reinforcements: the boss calls a minion when its HP falls to `atHp`, once `minBadges` badges are earned on a raid of at least `minTier`. The minion fights in its place until it faints. */
  reinforcements: z.array(z.object({ minBadges: z.number().int().min(1), minTier: z.number().int().min(1).max(6), atHp: Fraction })).max(3),
  /** The minion's species by the boss's first type, and its level relative to the boss. */
  minionByType: z.record(z.string(), z.string()),
  minionLevelOffset: z.number().int().min(-15).max(0),
  /** Badges needed before a den can hold a raid of tier 1 to 6 (an open tier is not enough on its own). */
  tierBadges: z.array(z.number().int().min(0)).length(6),
  /** Names of tiers 1 to 6 (Standard, Advanced, Elite, Exceptional, Legendary), and the label of rival and anomaly raids. */
  tierNames: z.array(z.string().min(1)).length(6),
  eventLabel: z.string().min(1),
});
export type BadgeScaling = z.infer<typeof BadgeScalingSchema>;

/**
 * What the world is doing can raise the chance of a raid den and steer which kind appears (spec 31 "Integration").
 * Every condition given must hold. The same stage and run always roll the same.
 */
export const DenTriggerSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  /** Shown on the den's preview. */
  text: z.string().min(1),
  /** A story flag (see core/shadowWorld/world.ts flagOf) at or above a value: evil team operations, kindness, choices made. */
  flag: z.object({ key: z.string(), min: z.number().int().min(1) }).optional(),
  /** A Legendary world event has been offered this run. */
  legendary: z.boolean().optional(),
  /** The run's calendar day (or the real day when it has none) is a Saturday or Sunday. */
  weekend: z.boolean().optional(),
  /** The calendar month (1-12) is one of these (seasonal events). */
  months: z.array(z.number().int().min(1).max(12)).optional(),
  /** The run has reached this region (regional progression). */
  minRegion: z.number().int().min(0).optional(),
  chanceBonus: z.number().min(0).max(0.5),
  /** Steer the den to this kind of raid when one fits. */
  prefer: z.enum(['wild', 'regional', 'rival', 'anomaly']).optional(),
});
export type DenTrigger = z.infer<typeof DenTriggerSchema>;

const StageChanges = z.partialRecord(BoostStatSchema, z.number().int().min(-6).max(6));

/** S401 Boss Gimmick Cards: a card turns on an extra rule for the boss; the prize grows with it. */
export const GimmickCardSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  label: z.string().min(1),
  text: z.string().min(1),
  hpDeltaPercent: z.number().int().min(0).max(100).default(0),
  rewardPercent: z.number().int().min(100).max(250).default(100),
  draftDelta: z.number().int().min(0).max(2).default(0),
  modifiers: RaidModifiersSchema.optional(),
  enrage: z.object({ afterTurn: z.number().int().min(3).max(40), everyTurns: z.number().int().min(2).max(10), boostPercent: z.number().int().min(5).max(50), maxStacks: z.number().int().min(1).max(5) }).optional(),
});
export type GimmickCard = z.infer<typeof GimmickCardSchema>;

/** S402 Boss Dialogue Trees: lines you can say before the fight. Each shifts stat stages (and a little boss HP); a line may lead to a second set of lines. */
export interface TalkChoice {
  id: string;
  label: string;
  reply: string;
  boss?: Partial<Record<z.infer<typeof BoostStatSchema>, number>>;
  player?: Partial<Record<z.infer<typeof BoostStatSchema>, number>>;
  hpPercent?: number;
  next?: TalkChoice[];
}
const TalkChoiceSchema: z.ZodType<TalkChoice> = z.lazy(() => z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  label: z.string().min(1),
  reply: z.string().min(1),
  boss: StageChanges.optional(),
  player: StageChanges.optional(),
  hpPercent: z.number().int().min(-30).max(30).optional(),
  next: z.array(TalkChoiceSchema).max(3).optional(),
}));
export const RaidTalkSchema = z.object({ prompt: z.string().min(1), choices: z.array(TalkChoiceSchema).min(2).max(4) });
export type RaidTalk = z.infer<typeof RaidTalkSchema>;

/** S393 Raid Lobby Bots: an AI ally with a personality. striker hits the boss each turn, guard softens its blows, medic mends your lead. */
export const RaidBotSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  label: z.string().min(1),
  text: z.string().min(1),
  kind: z.enum(['striker', 'guard', 'medic']),
  /** striker: share of the boss's max HP per turn; guard: share of the boss's damage absorbed; medic: share of your lead's max HP mended per turn. */
  power: z.number().min(0.02).max(0.5),
  cost: z.number().int().min(0).default(0),
});
export type RaidBot = z.infer<typeof RaidBotSchema>;

export const RaidFileSchema = z.object({
  badgeScaling: BadgeScalingSchema,
  denTriggers: z.array(DenTriggerSchema).default([]),
  /** The most the triggers can add to a stage's den chance. */
  maxTriggerBonus: z.number().min(0).max(0.5).default(0.3),
  /** Chance that a stage has a raid den (the Pokémon League never does). */
  denChance: z.number().min(0).max(1),
  /** Raid tiers a den can have, by region index (the last entry covers later regions). */
  tiersByRegion: z.array(z.array(z.number().int().min(1).max(6)).min(1)).min(1),
  /** After a lost or abandoned raid: the party is back on its feet at this share of max HP. */
  failureHealFraction: z.number().min(0.1).max(1),
  /** Raid tiers open from the very first run. A higher tier opens for later runs once a raid one tier below it is won (in any run). */
  openTiers: z.number().int().min(1).max(6).default(3),
  /** S391 Raid Roles: a Pokémon fights as a Striker, Tank or Support by its base stats. */
  roles: z.object({
    strikerDamage: z.number().min(1).max(1.5).default(1.1),
    tankDamageTaken: z.number().min(0.5).max(1).default(0.9),
    supportHeal: z.number().min(0).max(0.25).default(0.0625),
  }).default({ strikerDamage: 1.1, tankDamageTaken: 0.9, supportHeal: 0.0625 }),
  /** S403 Raid Cheering: the crowd meter (0 to 100) grows each turn and with every cheer; at `roused` your lead gets +1 Attack and Sp. Atk, at 100 the crowd mends it and the meter starts over. */
  crowd: z.object({ perTurn: z.number().min(0).max(30).default(6), perCheer: z.number().min(0).max(60).default(20), roused: z.number().int().min(10).max(90).default(50), roarHeal: z.number().min(0).max(0.5).default(0.25) }).default({ perTurn: 6, perCheer: 20, roused: 50, roarHeal: 0.25 }),
  /** S410 Team Co-op Raids: two local players share one raid, taking turns on one device. Your party is split between them (slots 1, 3, 5 and 2, 4, 6); the boss is tougher, the crowd louder and the prize bigger. */
  coop: z.object({ hpPercent: z.number().int().min(0).max(100).default(40), rewardPercent: z.number().int().min(100).max(250).default(125), draftDelta: z.number().int().min(0).max(2).default(1), cheersEach: z.number().int().min(1).max(5).default(3), crowdBonus: z.number().min(0).max(20).default(4) }).default({ hpPercent: 40, rewardPercent: 125, draftDelta: 1, cheersEach: 3, crowdBonus: 4 }),
  /** S401 cards, S402 talk and S393 bots offered at ordinary dens (story raids and practice have none). */
  gimmickCards: z.array(GimmickCardSchema).default([]),
  talk: RaidTalkSchema.nullable().default(null),
  bots: z.array(RaidBotSchema).default([]),
  /** S405 Raid Dens Map: dens without their own weather take one of these by stage (rotating with the run's stage index and region). */
  denWeathers: z.array(WeatherSchema).default([]),
  /** S394 Raid Weekly Rotation: the featured raid of the week pays more; `extraDenChance` is the chance a stage also holds a den for it. */
  weekly: z.object({ rewardPercent: z.number().int().min(100).max(300).default(150), draftDelta: z.number().int().min(0).max(2).default(1), extraDenChance: z.number().min(0).max(0.5).default(0.2) }).default({ rewardPercent: 150, draftDelta: 1, extraDenChance: 0.2 }),
  /** Chance per stage of a special den (titan, gauntlet or mini-boss), from the region where each unlocks. */
  specialDenChance: z.number().min(0).max(0.5).default(0.2),
  raids: z.array(RaidDefSchema).min(1),
});
export type RaidFile = z.infer<typeof RaidFileSchema>;
