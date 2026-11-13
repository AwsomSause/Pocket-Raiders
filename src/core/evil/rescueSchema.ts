// Rival Rescue Plan (Beta 0.6 R9): data shapes and saved state. Zod only (no other core imports) so the run's expansion
// block can embed the state. Data lives in src/data/rivalRescue.json; state at run.expansion.rescue.

import { z } from 'zod';

export const PLAN_IDS = ['quiet', 'loud', 'deal', 'inside', 'exchange'] as const;
export type PlanId = (typeof PLAN_IDS)[number];
export const SHORTCUT_IDS = ['trio', 'looker', 'wes'] as const;
export type ShortcutId = (typeof SHORTCUT_IDS)[number];
export const ARCHETYPES = ['hotshot', 'prodigy', 'friendly', 'bitter', 'scholar', 'heir', 'lone-wolf', 'mirror'] as const;
export type Archetype = (typeof ARCHETYPES)[number];

export const HOLD_STATES = ['logged', 'processed', 'assigned', 'held-too-long'] as const;
export type HoldState = (typeof HOLD_STATES)[number];
export const RESCUE_RESULTS = ['full', 'partial', 'fail', 'deal'] as const;
export type RescueResult = (typeof RESCUE_RESULTS)[number];

const text = z.string().min(1);

// ---------- data ----------

export const RescueDataSchema = z.object({
  note: z.string(),
  stages: z.array(z.string()).length(22),
  archetypes: z.array(z.enum(ARCHETYPES)).length(8),
  lines: z.record(z.enum(ARCHETYPES), z.record(z.string(), text)),
  beatenToIt: z.record(z.enum(ARCHETYPES), text),
  froze: z.record(z.enum(ARCHETYPES), text),
  teams: z.array(z.string()).length(14),
  receipts: z.record(z.string(), text),
  effects: z.record(z.string(), z.object({ processed: text, assigned: text, heldTooLong: text })),
  sites: z.array(z.object({ team: z.string(), name: text, site: text, annexPr: z.string().regex(/^pr\.[a-z0-9-]+\.[a-z0-9-]+$/), note: text, approach: text, door: text, cage: text, jailer: text, jailerLine: text })).length(14),
  complications: z.array(z.object({ id: z.number().int().min(1).max(12), name: text, sees: text, good: text, poor: text })).length(12),
  /** The choice text of each beat (PS-RESCUE), by plan and beat; the Exchange has right and wrong lines. */
  beats: z.record(z.enum(['quiet', 'loud', 'inside']), z.record(z.string(), z.object({ good: text, neutral: text, bad: text }))),
  exchange: z.record(z.string(), z.object({ good: text, wrong: text })),
  /** Cellmate species (weakest first) for teams that have no entry in evilTeams.json. */
  gruntPools: z.record(z.string(), z.array(z.string()).min(2)),
  tuning: z.object({
    waitMin: z.number().int(), waitSpan: z.number().int(), secondOfferGap: z.number().int(),
    pMin: z.number(), pMax: z.number(), partialBand: z.number(),
    base: z.object({ quiet: z.number(), loud: z.number(), inside: z.number() }),
    preferredBonus: z.number(), beatStep: z.number(), raidStep: z.number(), latePenalty: z.number(), exchangePenalty: z.number(), insiderGoodBonus: z.number(),
    attitudePerPoint: z.number(), intelPerTier: z.number(), osFree: z.number(), osPerPoint: z.number(),
    dealMoneyPct: z.number(), dealMoneyPctRep: z.number(), dealIntelCost: z.number(), dealIntelOffPct: z.number(),
    heat: z.object({ quietBad: z.number(), loudAlways: z.number(), fail: z.number() }),
    cellmateChance: z.number(), assignedNodes: z.number().int(), processedAt: z.number().int(), assignedAt: z.number().int(),
    poundHpShare: z.number(), warrantNodes: z.number().int(), tooLongCorruption: z.number().int(),
    labels: z.object({ risky: z.number(), even: z.number(), likely: z.number() }),
  }),
  attitude: z.record(z.enum(ARCHETYPES), z.object({ full: z.number(), partial: z.number(), fail: z.number(), declined: z.number() })),
  prefers: z.record(z.enum(ARCHETYPES), z.enum(['quiet', 'loud', 'deal'])),
  /** Teams that bind nothing, so a Pokémon held too long comes back without a Veiled taint. */
  noBinding: z.array(z.string()),
  summaryLines: z.record(z.enum(HOLD_STATES), text),
});
export type RescueData = z.infer<typeof RescueDataSchema>;

// ---------- saved state (inside run.expansion.rescue; no save-version bump) ----------

export const HoldSchema = z.object({
  id: z.string(),
  teamId: z.string(),
  regionId: z.string(),
  /** The Pokémon taken (full instances; opaque here, restored as they were). */
  pokemon: z.array(z.record(z.string(), z.unknown())).min(1),
  impoundNode: z.number().int().min(0),
  waitNodes: z.number().int().min(0),
  lastQuietNode: z.number().int().min(0),
  dueAt: z.number().int().min(0),
  receipt: z.boolean(),
  offers: z.number().int().min(0).default(0),
  declines: z.number().int().min(0).default(0),
  lastDeclineNode: z.number().int().nullable().default(null),
  /** A stay-out or the climax passed with Pokémon still held; the Late Plan is due at the next region's first rest node. */
  lateDue: z.boolean().default(false),
  late: z.boolean().default(false),
  /** The clock stops here when a plan is accepted. */
  frozenAt: z.number().int().nullable().default(null),
  accepted: z.enum(PLAN_IDS).nullable().default(null),
  /** Warrant: the node it arrives. */
  warrantAt: z.number().int().nullable().default(null),
  heldAtClimax: z.boolean().default(false),
});
export type Hold = z.infer<typeof HoldSchema>;

export const PlanRunSchema = z.object({
  holdId: z.string(),
  plan: z.enum(PLAN_IDS),
  complication: z.number().int().min(1).max(12),
  /** Ratings so far: good +beatStep, neutral 0, bad -beatStep. */
  beats: z.array(z.enum(['good', 'neutral', 'bad'])).default([]),
  complicationAnswer: z.enum(['good', 'poor']).nullable().default(null),
  exchangeWrong: z.number().int().min(0).default(0),
  /** Extra negative from a failed Exchange turning into a Loud Grab. */
  penalty: z.number().default(0),
  late: z.boolean().default(false),
  heatDone: z.number().int().default(0),
});
export type PlanRun = z.infer<typeof PlanRunSchema>;

export const ReturnedSchema = z.object({
  /** The Pokémon's uid. */
  uid: z.string(),
  teamId: z.string(),
  state: z.enum(HOLD_STATES),
  /** The five-node effect and the summary line last until this node. */
  until: z.number().int(),
  veiled: z.boolean().default(false),
  bondGain: z.number().int().default(0),
});
export type Returned = z.infer<typeof ReturnedSchema>;

export const RescueStateSchema = z.object({
  holds: z.array(HoldSchema).default([]),
  active: PlanRunSchema.nullable().default(null),
  returned: z.array(ReturnedSchema).default([]),
  /** The main rival's attitude toward the player from rescues (-5..+5, halves allowed). */
  attitude: z.number().min(-5).max(5).default(0),
  balloonUsed: z.boolean().default(false),
  /** Memory kinds earned (rescue-together, rescue-partial, rescue-failed, rescue-declined, rescue-froze, rescue-beaten-to-it, rescue-pound). */
  memory: z.array(z.string()).default([]),
  /** Last shortcut used, rescue.cellmate and rescue.pound flags (docs X12.1). */
  flags: z.record(z.string(), z.string()).default({}),
  /** Run Event Log entries (impound.applied, rescue.offered ...), newest last, at most 60. */
  log: z.array(z.string()).max(60).default([]),
  /** Holds lost for good when a climax was lost (Doom Ledger: lost-with-impounded). */
  lost: z.array(z.string()).default([]),
});
export type RescueState = z.infer<typeof RescueStateSchema>;
