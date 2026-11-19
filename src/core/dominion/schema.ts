// Evil Mode rework, DOMINION (design /mnt/project-files/plans/evil-mode-rework/, build plan BUILD_SLICES.md).
// Data shapes and the save block `run.expansion.dominion`. Each slice adds its own section here and its own sub-object
// of the block (optional with a default, or a block `v` bump with a migration in migrate.ts and a test).

import { z } from 'zod';
import type { PokemonInstance } from '../state';
import { migrateDominion } from './migrate';

/**
 * A crew member's Pokémon. state.ts imports this file (through the expansion schema), so this file must not import
 * state.ts at run time: the key fields are checked here and the rest passes through as the Pokémon the run made.
 */
const MonSchema = z.object({ uid: z.string().min(1), speciesId: z.string().min(1), level: z.number().int().min(1) }).passthrough() as unknown as z.ZodType<PokemonInstance, unknown>;

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


// ---------- D2 data: actions.json (the 150 Boss actions, lists/player-actions.md) and field.json ----------

export const SLOTS = ['day', 'night', 'evening'] as const;
export type Slot = (typeof SLOTS)[number];
export type StatId = (typeof STAT_IDS)[number];
const StatEnum = z.enum(STAT_IDS);

export const ActionsFileSchema = z.object({
  _source: S,
  actions: z.array(z.object({
    n: I.min(1), id: S, name: S, section: S, slot: z.enum(SLOTS), stat: z.union([StatEnum, z.literal('all')]).nullable(),
    what: S, levels: z.array(S).length(5), unlock: S,
  }).strict()).length(150),
}).strict();
export type ActionsFile = z.infer<typeof ActionsFileSchema>;
export type ActionDef = ActionsFile['actions'][number];

export const TARGET_KINDS = ['shop', 'street', 'crowd', 'route', 'dock', 'center', 'site', 'police', 'gym', 'cave', 'ghost'] as const;
export type TargetKind = (typeof TARGET_KINDS)[number];
const FoeSchema = z.object({ name: S, cls: S, species: z.array(S).min(1), offset: I }).strict();
const Range = z.tuple([N0, N0]);
const TargetSchema = z.object({
  id: S, name: S, kind: z.enum(TARGET_KINDS),
  owner: z.object({ name: S, look: S, line: S }).strict(),
  trait: z.object({ word: S, odds: I }).strict().nullable(),
  pay: z.number().positive(),
  foe: FoeSchema,
}).strict();
export type Target = z.infer<typeof TargetSchema>;
const DistrictSchema = z.object({
  id: S, name: S, x: N0, y: N0, w: I.min(60).optional(), control: I.min(0).max(100), rival: I.min(0).max(100), police: z.boolean(),
  rivalNote: S.optional(), wild: S, targets: z.array(TargetSchema).min(1),
}).strict();
export type District = z.infer<typeof DistrictSchema>;
export const BATTLE_FOES = ['target', 'police', 'wild', 'ghost', 'member'] as const;
export const EFFECTS = ['scout', 'count', 'scoutDistrict', 'paper', 'catch', 'laylow', 'disguise', 'fine', 'exp', 'spar', 'train', 'plan', 'pamper', 'hide'] as const;
const PlaySchema = z.object({
  kinds: z.array(z.union([z.enum(TARGET_KINDS), z.literal('any')])).min(1).optional(),
  chance: I.min(0).max(100).optional(),
  pay: Range.optional(), wager: Range.optional(), prize: I.min(1).optional(), weekly: N0.optional(), toll: N0.optional(),
  crate: S.optional(), bigMon: z.boolean().optional(), needs: S.optional(), needsPolice: z.boolean().optional(), where: z.literal('hq').optional(),
  heat: I.optional(), failHeat: N0.optional(), regard: I.optional(), dread: I.optional(), wanted: I.optional(), hero: N0.optional(), control: N0.optional(),
  cost: N0.optional(), effect: z.enum(EFFECTS).optional(), scoutDays: I.min(1).optional(), exp: N0.optional(), xp: N0.optional(), friendship: N0.optional(),
  battle: z.object({ chance: I.min(1).max(100), on: z.enum(['fail', 'always']), foe: z.enum(BATTLE_FOES) }).strict().optional(),
  win: S, big: S.optional(), lose: S.optional(),
}).strict();
export type Play = z.infer<typeof PlaySchema>;
const PoliceFoeSchema = z.object({ name: S, cls: S, species: z.array(S).min(1), offset: I }).strict();

export const FieldFileSchema = z.object({
  _source: S,
  region: S, hq: S, rivalTeam: S,
  districts: z.array(DistrictSchema).min(8).max(12),
  routes: z.array(z.tuple([S, S])).min(1),
  water: z.array(z.tuple([S, S])),
  starting: z.array(S).length(9),
  play: z.record(S, PlaySchema),
  crates: z.record(S, z.object({ picks: I.min(1), cash: Range, items: z.array(z.tuple([S, I.min(1)])).min(1) }).strict()),
  foes: z.object({ ghost: z.array(S).min(1), member: S }).strict(),
  odds: z.object({ min: N0, max: I.max(100), scouted: N0, heatPer: I.min(1), outsider: I, rangeHalf: N0, scoutDays: I.min(1), bigShare: z.number().min(0).max(1), statPer: N0, crewPer: N0, maxBrought: N0 }).strict(),
  edge: z.object({ start: I.min(1), cap: I.min(1).max(10), xpPerPoint: I.min(1), xp: z.object({ fail: N0, win: N0, big: N0 }).strict() }).strict(),
  mastery: z.object({ names: z.array(S).length(5), thresholds: z.array(I.min(1)).length(4), odds: z.array(I).length(5), heat: z.array(I).length(5), pay: z.array(I).length(5), intelFrom: I.min(1).max(5), xp: z.object({ fail: N0, win: N0, big: N0 }).strict() }).strict(),
  control: z.object({ foothold: N0, contested: N0, held: N0, owned: N0, rival: N0, racketPay: z.object({ out: z.number(), foot: z.number(), contested: z.number(), held: z.number(), owned: z.number() }).strict(), ownedHeat: z.number().min(0).max(1) }).strict(),
  levels: z.object({ min: I.min(1), overCap: N0 }).strict(),
  police: z.object({
    bands: z.array(z.object({ min: N0, id: S, word: S }).strict()).length(5),
    failBattle: N0, patrolBattle: N0, stationBattle: N0, nightFactor: z.number().min(0).max(1), wantedDecay: N0,
    jenny: PoliceFoeSchema, looker: PoliceFoeSchema, raid: PoliceFoeSchema,
    lost: z.object({ fine: z.number().min(0).max(1), fineMin: N0, heat: N0 }).strict(),
    raidTake: z.number().min(0).max(1), raidWin: I, lookerWin: I,
    lines: z.record(S, S),
  }).strict(),
  travel: z.object({
    lines: z.record(S, S),
    fly: z.object({ hq: I.min(1), move: S }).strict(),
    vehicles: z.array(z.object({ id: S, name: S, price: N0, hq: I.min(1).max(6), does: S }).strict()).min(1),
  }).strict(),
  later: z.object({ byAction: z.record(S, S), byUnlock: z.array(z.tuple([S, S])) }).strict(),
  lines: z.object({ wrongPhase: z.object({ day: S, night: S, evening: S }).strict() }).catchall(S),
}).strict();
export type FieldFile = z.infer<typeof FieldFileSchema>;

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


// ---------- D2: the Boss's hands (block v2, `field`) ----------

const DistrictStateSchema = z.object({ heat: I.min(0).max(100), control: I.min(0).max(100), rival: I.min(0).max(100), regard: I, dread: I }).strict();
export type DistrictState = z.infer<typeof DistrictStateSchema>;

/** A battle an action (or the police) is waiting on. The fight bridge (fight.ts) starts it; fightEnd settles it. */
export const FieldFightSchema = z.object({
  why: z.enum(['fail', 'always', 'police', 'looker', 'raid']),
  foe: z.enum(['target', 'police', 'wild', 'ghost', 'member', 'looker', 'raid']),
  begun: z.boolean(),
  action: S.nullable(),
  target: S.nullable(),
  district: S,
  /** The odds roll passed (an 'always' fight's bonus), and passed big. */
  pass: z.boolean(),
  big: z.boolean(),
  /** A street duel's stake. */
  wager: N0,
  /** Looker's case: the Racket he came for. */
  racket: S.nullable(),
}).strict();
export type FieldFight = z.infer<typeof FieldFightSchema>;

export const RacketSchema = z.object({ target: S, district: S, weekly: N0, day: I.min(1), kind: z.enum(['racket', 'toll']) }).strict();

export const FieldSchema = z.object({
  /** Where the Boss is (Part 9 A20: back at the HQ every morning). */
  at: S,
  /** Day actions the Boss had when today started (the Card's "Action 2 of 3"). */
  today: N0,
  /** Free trips left today (Bike, Plan the Week). */
  free: N0,
  /** Plan the Week: one more free trip tomorrow. */
  planned: z.boolean(),
  /** Fly used today. */
  flew: z.boolean(),
  /** Districts the Boss has been to (Fly goes only there). */
  visited: z.array(S),
  /** Each district's Heat, Control, rival Control, Regard and Dread (Part 1 §3.4, Part 3 §2). */
  districts: z.record(S, DistrictStateSchema),
  /** The Boss's Edge stats and Infamy XP towards the next point (Part 1 §3.3). */
  edge: z.object({ stats: StatsSchema, xp: z.object({ brawn: N0, nerve: N0, wits: N0, charm: N0, stealth: N0 }).strict() }).strict(),
  /** Each action's mastery XP (lists/player-actions.md, five levels). */
  mastery: z.record(S, N0),
  /** Scouted targets: target id -> the last day the intel holds. */
  scouted: z.record(S, I),
  /** Targets whose guards were counted (any fight there is half as likely). */
  counted: z.array(S),
  rackets: z.array(RacketSchema),
  vehicles: z.array(S),
  /** Rolls made so far: each action's roll is seeded by the run seed and this count (stream `dominion-act`). */
  rolls: N0,
  /** Evening actions done this evening (each once an evening). */
  evening: z.array(S),
  /** Tonight's Night action, once done. */
  night: S.nullable(),
  /** The police's moves for today (World Turn): a closed district (checkpoint) and the patrol's district. */
  closed: S.nullable(),
  patrol: S.nullable(),
  /** Hide in the Warehouse: tonight's police sweep finds nothing. */
  hidden: z.boolean(),
  /** Change Clothes: the next field action's Heat is halved. */
  disguise: z.boolean(),
  /** Wanted from big events, on top of the districts' average (falls 1 a day). */
  wanted: I.min(0).max(100),
  /** The week Looker last came (once a week). */
  lookerWeek: I,
  /** Hero attention from Attacks (D11 reads it). */
  hero: N0,
  fight: FieldFightSchema.nullable(),
}).strict();
export type Field = z.infer<typeof FieldSchema>;

const BlockSchema = z.object({
  /** The block's own version (migrations in migrate.ts): v2 added `field` (D2). */
  v: z.literal(2),
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
  /** D2: the Boss's hands (districts, Heat, the Edge, travel, the fight an action waits on). */
  field: FieldSchema,
}).strict();
export const DominionBlockSchema = z.preprocess(migrateDominion, BlockSchema);
export type DominionBlock = z.infer<typeof BlockSchema>;

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
  | { t: 'endDay' }
  /** D2: a Boss action from the Region Map (travel included), bringing up to two members. */
  | { t: 'act'; action: string; target: string | null; district: string; bring: string[] }
  | { t: 'buy'; vehicle: string };
