// Evil Mode rework, DOMINION (design /mnt/project-files/plans/evil-mode-rework/, build plan BUILD_SLICES.md).
// Data shapes and the save block `run.expansion.dominion`. Each slice adds its own section here and its own sub-object
// of the block (optional with a default, or a block `v` bump with a migration in migrate.ts and a test).

import { z } from 'zod';
import { PokemonInstanceSchema, type PokemonInstance } from '../state';

/** Lazy both ways: state.ts imports this file through the expansion schema (which reads this block lazily too), so the Pokémon shape is read at parse time. */
const MonSchema = z.lazy((): z.ZodType<PokemonInstance, unknown> => PokemonInstanceSchema);

const S = z.string().min(1);
const I = z.number().int();
const N0 = I.min(0);

// ---------- D1 data: start.json ----------

export const PHASES = ['morning', 'day', 'evening', 'night'] as const;
export type Phase = (typeof PHASES)[number];
export const STAT_IDS = ['brawn', 'nerve', 'wits', 'charm', 'stealth'] as const;
const StatsSchema = z.object({ brawn: I.min(1).max(10), nerve: I.min(1).max(10), wits: I.min(1).max(10), charm: I.min(1).max(10), stealth: I.min(1).max(10) }).strict();

const MemberStartSchema = z.object({
  rank: S, traitPoints: N0, monLevel: I.min(1).max(100), wage: N0, stats: StatsSchema,
  loyalty: I.min(0).max(100), morale: I.min(0).max(100), pitch: S, facts: z.array(S).min(1),
});

export const StartFileSchema = z.object({
  _source: S,
  start: z.object({ funds: N0, heat: I.min(0).max(100), hqLevel: I.min(1), hqName: S, rosterCap: I.min(1), levelCap: I.min(1), region: S, inventory: z.record(S, N0), keyItems: z.array(S) }).strict(),
  clock: z.object({
    dayActions: I.min(1), nightActions: I.min(1), restBonus: N0, exhaustedAfter: I.min(1), oddJobPay: N0, heatCoolPerDay: N0, rent: N0, weekLength: I.min(1),
    phases: z.array(z.object({ id: z.enum(PHASES), word: S, colour: S }).strict()).length(4),
  }).strict(),
  types: z.object({ allowed: z.array(S).length(16), banned: z.array(S).length(2), bannedLine: S, hint: z.array(S).min(1) }).strict(),
  members: z.object({
    grunt: MemberStartSchema.extend({ name: S, gender: z.literal('m'), look: S }).strict(),
    admin: MemberStartSchema.extend({ looks: z.array(z.object({ file: S, gender: z.enum(['m', 'f']), name: S, cls: S }).strict()).min(2) }).strict(),
    monRules: z.object({ maxGeneration: I.min(1), maxBst: I.min(100) }).strict(),
  }).strict(),
  opening: z.array(S).min(1),
  adminOpening: z.array(S).min(1),
  orders: z.array(z.object({ id: S, label: S, phase: z.literal('day'), report: S, heat: I, funds: I, flag: S }).strict()).min(1),
  firstSteps: z.array(z.object({ id: S, label: S, reward: N0, earned: N0.optional(), flag: S.optional() }).strict()).min(1),
  firstStepsDays: I.min(1),
  says: z.object({ grunt: z.array(S).min(1), admin: z.array(S).min(1) }).strict(),
  report: z.object({ guard: S, rest: S, tired: S, exhausted: S, cool: S, week: S, broke: S, step: S }).strict(),
  lockedTab: S,
}).strict();
export type StartFile = z.infer<typeof StartFileSchema>;

// ---------- the save block ----------

export const MemberSchema = z.object({
  id: S,
  name: S,
  /** Rank id on the Rank Pyramid (Part 8). D1 uses 'grunt' and 'admin'; D4 adds the other thirteen. */
  rank: S,
  gender: z.enum(['m', 'f']),
  /** Picture: an asset file (`trainer/pr/...` atlas, or `dominion/*.png`). */
  look: S,
  level: I.min(1).max(30),
  stats: StatsSchema,
  loyalty: I.min(0).max(100),
  morale: I.min(0).max(100),
  traitPoints: N0,
  /** Until the first trait forms (D3). */
  untrained: z.boolean(),
  wage: N0,
  /** The member's own Pokémon (Part 7: each has a Team Type). */
  team: z.array(MonSchema).max(6),
  joinedDay: I.min(1),
  /** Unpaid weeks in a row. */
  unpaid: N0,
}).strict();
export type Member = z.infer<typeof MemberSchema>;

export const DominionBlockSchema = z.object({
  /** The block's own version (migrations in migrate.ts). */
  v: z.literal(1),
  day: I.min(1),
  phase: z.enum(PHASES),
  /** Day actions left today (Part 1 §2.1). */
  actions: N0,
  /** Night actions left tonight. */
  nightActions: N0,
  /** Nights in a row without Rest (3 = Exhausted). */
  noRest: N0,
  /** Rested last night: +1 Day action, used up when the Day starts. */
  rested: z.boolean(),
  funds: I,
  /** Money earned since Day 1 (First Step "Earn your first ₽500"). */
  earned: N0,
  /** The region's Wanted, shown as Heat % on the top bar (D2 adds per-district Heat). */
  heat: I.min(0).max(100),
  hqLevel: I.min(1).max(6),
  rosterCap: I.min(1),
  levelCap: I.min(1),
  /** Null until the Founding (Part 9 A15): the top bar says "UNNAMED CREW". */
  teamName: S.nullable(),
  /** The two Team Types (Part 7), fixed for the run. */
  types: z.tuple([S, S]),
  members: z.array(MemberSchema),
  keyItems: z.array(S),
  /** Today's Orders: order ids planned for the Day, in order (Part 6 §2). */
  orders: z.array(S),
  /** Order ids done for good (the starting three are one-time). */
  ordersDone: z.array(S),
  flags: z.array(S),
  /** First Step ids done (Part 1 §1.3). The panel leaves after `firstStepsDays`. */
  stepsDone: z.array(S),
  /** The last World Turn's lines, shown as the Night Report in the Morning (Part 9 A1). */
  report: z.array(S),
  /** The opening scene has been read. */
  opened: z.boolean(),
}).strict();
export type DominionBlock = z.infer<typeof DominionBlockSchema>;

/** What the setup pages hand to `newBlock`. */
export interface DominionSetup {
  types: [string, string];
  member: 'grunt' | 'admin';
  /** Index into `members.admin.looks` when the member is an Admin. */
  look: number;
}

export type DominionAction =
  | { t: 'open' }
  | { t: 'plan'; order: string }
  | { t: 'do'; order: string }
  | { t: 'toNight' }
  | { t: 'rest' }
  | { t: 'skipNight' }
  | { t: 'toDay' }
  | { t: 'endDay' };
