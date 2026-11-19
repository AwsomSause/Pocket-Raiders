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
export const BATTLE_FOES = ['target', 'police', 'wild', 'ghost', 'member', 'rival'] as const;
export const EFFECTS = ['scout', 'count', 'scoutDistrict', 'paper', 'catch', 'laylow', 'disguise', 'fine', 'exp', 'spar', 'train', 'plan', 'pamper', 'hide', 'launder',
  // D9 (rivals.ts addActEffect)
  'rivalHit', 'rivalSpy', 'counterSpy', 'truceTalk', 'war', 'poach', 'court'] as const;
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
  /** D3: the crew file (Part 2, Part 9 A17-A18). Optional so a D1 save loads; `crewOf` fills it. */
  crew: z.lazy(() => MemberCrewSchema).optional(),
}).strict();
export type Member = z.infer<typeof MemberSchema>;


// ---------- D2: the Boss's hands (block v2, `field`) ----------

const DistrictStateSchema = z.object({ heat: I.min(0).max(100), control: I.min(0).max(100), rival: I.min(0).max(100), regard: I, dread: I }).strict();
export type DistrictState = z.infer<typeof DistrictStateSchema>;

/** A battle an action (or the police) is waiting on. The fight bridge (fight.ts) starts it; fightEnd settles it. */
export const FieldFightSchema = z.object({
  why: z.enum(['fail', 'always', 'police', 'looker', 'raid', 'rival']),
  foe: z.enum(['target', 'police', 'wild', 'ghost', 'member', 'looker', 'raid', 'rival']),
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
  /** D3: the crew's shared state (stores, leads, waiting list, hire list, talks, Patrons). Optional; `crewState` fills it. */
  crew: z.lazy(() => CrewStateSchema).optional(),
  /** D5: the HQ's rooms, outside buildings, works, clean money, laundering and loans. Optional; `hqOf` fills it. */
  hq: z.lazy(() => HqStateSchema).optional(),
  /** D9: the rival teams (Tension, plan, spies, truces, raids). Optional; `rivalsOf` fills it. */
  rivals: z.lazy(() => RivalsStateSchema).optional(),
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
  | { t: 'buy'; vehicle: string }
  // D3, the crew
  | { t: 'assign'; member: string; task: string }
  | { t: 'talk'; choice: number }
  | { t: 'evTalk'; member: string }
  | { t: 'hire'; index: number }
  | { t: 'approach'; lead: string; pitch: string }
  | { t: 'admit'; lead: string }
  | { t: 'bail'; member: string }
  | { t: 'gift'; member: string; item: string }
  | { t: 'patron'; patron: string }
  // D5, the HQ (hq.ts)
  | { t: 'upgrade' }
  | { t: 'build'; building: string; district: string | null }
  | { t: 'tierUp'; room: string }
  | { t: 'sell'; room: string }
  | { t: 'rebuild'; room: string }
  | { t: 'launder'; amount: number }
  | { t: 'loan'; amount: number }
  | { t: 'repay'; amount: number }
  | { t: 'letGo'; member: string }
  // D9, the rival team (rivals.ts)
  | { t: 'truce'; team: string }
  | { t: 'breakTruce'; team: string }
  | { t: 'card'; index: number; choice: number }
  | { t: 'ransom'; member: string };

// ---------- D3 data: crew.json, tasks.json, gruntTypes.json ----------

export const STAT = z.enum(STAT_IDS);
const Pct = I.min(0).max(100);

export const TaskEffectSchema = z.object({
  kind: z.enum(['guard', 'money', 'scout', 'recruit', 'train', 'trainMon', 'rest', 'catch', 'steal', 'berries', 'audit', 'welcome', 'interview', 'mentor', 'rally', 'drills', 'coach',
    // D9 (rivals.ts)
    'rivalSpy', 'rivalIntel', 'counterSpy', 'poachRival', 'rivalHit', 'rescue', 'rumours', 'truceTalk']),
  funds: Range.optional(),
  heat: I.optional(),
  risky: z.boolean().optional(),
  caughtHeat: N0.optional(),
  fine: N0.optional(),
  sure: z.boolean().optional(),
  grow: STAT.optional(),
  xp: I.min(1).optional(),
  injury: Pct.optional(),
}).strict();
export type TaskEffect = z.infer<typeof TaskEffectSchema>;

export const TaskSchema = z.object({
  n: N0, id: S, name: S, section: z.string().regex(/^[A-M]$/), group: S, stat: STAT.nullable(), min: S, does: S,
  levels: z.array(S).length(5), risk: S, source: S.optional(),
  status: z.enum(['supported', 'limited', 'disabled']),
  note: S.optional(), needs: z.string().regex(/^D\d+$/).optional(), effect: TaskEffectSchema.optional(),
  /** D5: the room the task needs (buildings.json id). */
  room: S.optional(),
}).strict().refine((t) => (t.status === 'disabled') === !t.effect, { message: 'a live task has an effect; a disabled one has none' })
  .refine((t) => t.status !== 'disabled' || !!t.needs, { message: 'a disabled task names the slice it waits for' })
  .refine((t) => t.status !== 'limited' || !!t.note, { message: 'a limited task says what waits' });
export type Task = z.infer<typeof TaskSchema>;
export const TasksFileSchema = z.object({ _source: S, tasks: z.array(TaskSchema).min(150) }).strict();

export const GruntTypeSchema = z.object({
  n: I.min(1), id: S, name: S, group: S, found: S, rarity: z.enum(['C', 'U', 'R']), lean: STAT, green: S, favours: z.array(S).min(1),
  bestAt: S, grows: S, region: S.optional(), once: z.boolean().optional(),
}).strict();
export type GruntType = z.infer<typeof GruntTypeSchema>;
export const GruntTypesFileSchema = z.object({ _source: S, types: z.array(GruntTypeSchema).length(150), _newTraits: z.record(S, S) }).strict();

const ModsSchema = z.object({
  family: S.optional(), task: S.optional(), stat: STAT.optional(), pct: I.optional(), heat: I.optional(), yieldPct: I.optional(),
  noFlee: z.boolean().optional(), noSkip: z.boolean().optional(), xpMult: I.min(1).optional(), recruitPoints: N0.optional(),
  pocket: Pct.optional(), ambition: N0.optional(), loyaltyCap: Pct.optional(), loyaltyFloor: Pct.optional(), disloyal: I.min(1).optional(),
  mentor: N0.optional(), planned: N0.optional(), pitch: N0.optional(), medic: z.boolean().optional(), refuse: z.array(S).optional(),
  reroll: z.boolean().optional(), jailDays: N0.optional(), trainXp: N0.optional(), noQuit: z.boolean().optional(), pHeat: N0.optional(),
}).strict();
export type Mods = z.infer<typeof ModsSchema>;
const TREATS = ['praise', 'push', 'leave', 'spar', 'payOnTime', 'payLate', 'punish', 'bring', 'win'] as const;
export const TREAT = z.enum(TREATS);
export type Treat = z.infer<typeof TREAT>;

const TalkChoiceSchema = z.object({
  label: S, loy: I.optional(), mor: I.optional(), amb: I.optional(), heat: I.optional(), pHeat: I.optional(), funds: I.optional(), wage: I.optional(),
  stat: z.partialRecord(STAT, I).optional(), crewMor: I.optional(), crewLoy: I.optional(), treat: TREAT.optional(), flag: S.optional(),
  memory: S.optional(), nick: S.optional(), action: I.optional(), task: S.optional(), half: z.boolean().optional(), gift: z.boolean().optional(),
  nerveTest: z.boolean().optional(), promiseAgain: z.boolean().optional(), saveLine: z.boolean().optional(), force: z.boolean().optional(),
  leave: z.boolean().optional(), unpunish: z.boolean().optional(), loudmouthMor: I.optional(),
}).strict();
const TalkTriggerSchema = z.object({
  newMember: z.boolean().optional(), moraleBelow: Pct.optional(), loyaltyAtLeast: Pct.optional(), loyaltyBelow: Pct.optional(),
  loyaltyBetween: z.tuple([Pct, Pct]).optional(), wageStaleDays: I.min(1).optional(), lastTask: z.enum(['success', 'fail', 'caught', 'arrested']).optional(),
  pHeatAtLeast: Pct.optional(), hasHeldItem: z.boolean().optional(), chance: Pct.optional(), rested: z.boolean().optional(), workedDays: I.min(1).optional(),
  kind: S.optional(), green: S.optional(), brokePromise: I.min(1).optional(), refused: z.boolean().optional(), fundsAtLeast: N0.optional(),
  rankAtLeast: S.optional(), bigSuccess: z.boolean().optional(), leaving: z.boolean().optional(),
}).strict();
const TalkSchema = z.object({
  n: I.min(1), id: S, name: S, needs: z.string().regex(/^D\d+$/).optional(), when: z.enum(['morning', 'evening', 'leaving']).optional(),
  trigger: TalkTriggerSchema.optional(), once: z.boolean().optional(), text: S.optional(), choices: z.array(TalkChoiceSchema).min(1).max(3).optional(),
}).strict().refine((t) => !!t.needs !== !!t.choices, { message: 'a talk is either live (choices) or waits (needs)' });
export type Talk = z.infer<typeof TalkSchema>;
export type TalkChoice = z.infer<typeof TalkChoiceSchema>;

const PatronSchema = z.object({
  id: S, name: S, who: S, look: S, gender: z.enum(['m', 'f']), rumour: S,
  job: z.union([z.object({ kind: z.literal('tasks'), family: S, n: I.min(1) }).strict(), z.object({ kind: z.literal('funds'), amount: I.min(1) }).strict()]),
  jobText: S, perk: S, mods: ModsSchema, live: z.boolean(), needs: S.optional(), seat: S.nullable(),
}).strict();
export type Patron = z.infer<typeof PatronSchema>;

export const CrewFileSchema = z.object({
  _source: S,
  ranks: z.array(z.object({ id: S, n: I.min(1).max(15), word: S, level: I.min(1).max(30), wage: N0 }).strict()).length(15),
  traitRanks: z.object({ first: S, second: S, signature: S }).strict(),
  rules: z.object({
    xpBase: I.min(1), xpPerLevel: N0, maxLevel: I.min(1), statPerSuccess: I.min(1), statStep: I.min(1),
    oddsPerStat: N0, oddsPerLevel: N0, oddsMin: Pct, oddsMax: Pct, bestAtBonus: N0,
    taskLevelXp: z.array(N0).length(5), taskLevelOdds: z.array(N0).length(5), taskLevelYield: z.array(N0).length(5),
    lowMorale: Pct, lowMoralePenalty: Pct, fatiguePerJob: Pct, fatigueRest: Pct, tiredAt: Pct, tiredPenalty: Pct,
    pHeatCool: Pct, pHeatRestCool: Pct, pHeatOnCaught: Pct, heatOnCaught: Pct, arrestAt: Pct, arrestCaughtChance: Pct,
    bail: N0, jailDays: I.min(1), injuryDays: I.min(1), injuryChance: Pct, restMorale: Pct, thiefChance: Pct, thiefMax: N0, thiefPct: Pct,
    disloyalAt: Pct, quitChance: Pct, stealChance: Pct, sellOutChance: Pct, sellOutHeat: Pct,
    workedDaysForTimeOff: I.min(1), talksPerDay: I.min(1), talkRepeatDays: I.min(1),
    berries: z.array(S).min(1), rareBerries: z.array(S).min(1), catchLevel: Range, stealLevel: Range,
    scoutActions: I.min(1), loudmouthHeat: N0, greedyPocket: Pct, lazySkip: Pct, lostWander: Pct, clumsyPenalty: Pct, nervousPenalty: Pct,
    trainXp: I.min(1), successXp: N0, doneXp: N0, memoryLength: I.min(1), halfDayPenalty: Pct, giftMorale: Pct,
    rallyMorale: N0, mentorXp: N0, coachXp: N0, pushFatigue: N0, traitDays: N0, resentfulPunish: N0, thrillMorale: N0, belongingMorale: N0, moneyLoyalty: N0, stealBase: N0, stealPerLevel: N0, arrestBase: N0, welcomeMorale: N0, welcomeLoyalty: N0, auditLoyalty: N0, lawyerCool: N0, maxLeads: N0, neverMargin: N0, finderLoyalty: N0, joinLoyalty: N0, nerveTestBase: N0, loudmouthBackfire: N0, bailLoyalty: N0,
  }).strict(),
  quick: z.array(S).length(6),
  quickLabels: z.record(S, S),
  taskIcons: z.record(S, S),
  families: z.record(S, z.array(S).min(1)),
  greens: z.array(z.object({ id: S, name: S, effect: S, temperaments: z.array(S).min(1) }).strict()).length(8),
  temperaments: z.array(z.object({ id: S, word: S, leans: S }).strict()).min(8),
  formed: z.array(z.object({
    id: S, name: S, from: z.array(S), family: S.nullable().optional(), treat: TREAT.optional(), text: S, mods: ModsSchema, live: z.boolean(), needs: S.optional(),
  }).strict()).min(12),
  signatures: z.array(z.object({ id: S, name: S, family: S, text: S }).strict()).length(20),
  motives: z.array(z.object({ id: S, name: S, text: S, pitch: S }).strict()).length(6),
  lines: z.record(S, z.array(S).min(1)),
  growLine: S,
  patrons: z.array(PatronSchema).length(6),
  patronNotoriety: N0,
  refusals: z.record(S, z.object({ leader: S, leaderName: S, e4: S, e4Name: S }).strict()),
  refusalLine: S,
  recruit: z.object({
    leadDays: I.min(1), waitDays: I.min(1), notYetDays: I.min(1), notYetBonus: N0, matchBonus: N0, hatePenalty: N0, charmPer: N0, hqPer: N0,
    interviewBonus: N0, approachHeat: N0, fearLoyalty: Pct, fearHeat: N0, powerAmbition: N0, moneyWage: z.number().min(1), noCauseLine: S, noCausePenalty: N0,
    pitches: z.array(z.object({ id: S, name: S, text: S }).strict()).length(4),
    kinds: z.array(z.object({ id: S, name: S, chance: Range, rank: S }).strict()).min(1),
    classes: z.array(z.object({ cls: S, kind: S, look: S, gender: z.enum(['m', 'f']), lean: STAT, role: S.optional() }).strict()).min(4),
    roles: z.record(S, z.object({ text: S, live: z.boolean(), needs: S.optional() }).strict()),
    names: z.object({ m: z.array(S).min(4), f: z.array(S).min(4) }).strict(),
    says: z.object({ yes: S, notYet: S, never: S, full: S }).strict(),
  }).strict(),
  hire: z.object({
    count: I.min(1), rarityWeights: z.object({ C: N0, U: N0, R: N0 }).strict(), rareFromDay: I.min(1), onceFromDay: I.min(1),
    price: z.object({ C: N0, U: N0, R: N0 }).strict(), rank: S, wage: N0, loyalty: Pct, morale: Pct, monLevel: Range,
  }).strict(),
  report: z.record(S, S),
  talks: z.array(TalkSchema).length(30),
  talksLeft: N0,
  pools: z.record(S, z.object({ catch: z.array(S).min(4), steal: z.array(S).min(4) }).strict()),
}).strict();
export type CrewFile = z.infer<typeof CrewFileSchema>;

// ---------- D19 data: personality.json, and the card on a member (Claude API draft §5.3 A, mockup a3) ----------

const QuirkSchema = z.object({
  id: S.optional(), text: S, pre: S.optional(), end: S.optional(), swap: z.tuple([S, S]).optional(), upper: z.boolean().optional(),
}).strict();
export type Quirk = z.infer<typeof QuirkSchema>;
const TraitEffectSchema = z.object({
  text: S,
  /** A live modifier on the member (read by crew.ts modsOf). */
  mods: ModsSchema.optional(),
  /** Morale added to every other member each night (at most once a night, however many have it). */
  squadMor: I.min(1).optional(),
  /** On-time pay: Loyalty from pay times this (the Money motive's gain, given to anyone with the trait). */
  payLoy: I.min(2).optional(),
  /** Loyalty change on a pay day they weren't paid (on top of D1's −15). */
  unpaidLoy: I.optional(),
  /** The slice that makes this effect work (shown on the card until then). */
  needs: S.optional(),
}).strict();
const LineKinds = z.object({ hello: z.array(S).min(1), done: z.array(S).min(1), fail: z.array(S).min(1), scared: z.array(S).min(1), pay: z.array(S).min(1) }).strict();
export const PersonalityFileSchema = z.object({
  _source: S,
  traits: z.array(z.object({ id: S, name: S, icon: S, tone: z.enum(['g', 'y', 'r', 'v', 'b', 'm', 'k']), effects: z.array(TraitEffectSchema).length(2) }).strict()).min(6),
  /** Trait pairs that never roll together. */
  clash: z.array(z.tuple([S, S])),
  quirks: z.array(QuirkSchema.extend({ id: S })).min(1),
  wants: z.array(S).min(1),
  fears: z.array(S).min(1),
  towns: z.record(S, z.array(S).min(1)),
  lines: z.record(S, LineKinds),
  canon: z.record(S, z.object({ name: S, team: S, traits: z.tuple([S, S]), quirk: QuirkSchema, want: S, fear: S, home: S }).strict()),
  report: z.object({ squad: S, pay: S, unpaid: S, unpaidHurt: S }).strict(),
  rotom: z.object({ off: S, note: S }).strict(),
}).strict().superRefine((f, ctx) => {
  const ids = new Set(f.traits.map((t) => t.id));
  for (const t of f.traits) if (!f.lines[t.id]) ctx.addIssue({ code: 'custom', message: `trait ${t.id} has no lines` });
  for (const [a, b] of f.clash) if (!ids.has(a) || !ids.has(b)) ctx.addIssue({ code: 'custom', message: `clash ${a}/${b}: unknown trait` });
  for (const [id, c] of Object.entries(f.canon)) for (const t of c.traits) if (!ids.has(t)) ctx.addIssue({ code: 'custom', message: `canon ${id}: unknown trait ${t}` });
});
export type PersonalityFile = z.infer<typeof PersonalityFileSchema>;
export type LineKind = keyof z.infer<typeof LineKinds>;

/** A rolled card keeps ids and texts, never list indexes, so a longer list never changes a saved card. A canon card names its sheet. */
export const CardSchema = z.union([
  z.object({ canon: S }).strict(),
  z.object({ t: z.tuple([S, S]), q: S, w: S, f: S, h: S }).strict(),
]);
export type Card = z.infer<typeof CardSchema>;

// ---------- D3 save shapes ----------

const Stat10 = z.object({ brawn: N0, nerve: N0, wits: N0, charm: N0, stealth: N0 }).strict();

export const MemberCrewSchema = z.object({
  /** Grunt type id (gruntTypes.json) or null for a named recruit. */
  type: S.nullable(),
  /** Recruit class (crew.json recruit.classes), for named recruits. */
  cls: S.nullable(),
  kind: S.nullable(),
  role: S.nullable(),
  green: S,
  temperament: S,
  /** Formed traits, oldest first (Part 2 §4.2). */
  formed: z.array(S),
  /** The trait that grew most recently and the Green trait it replaced (the Crew File's GREW! badge). */
  grew: z.object({ from: S, to: S, day: I.min(1) }).strict().nullable(),
  motive: S,
  ambition: Pct,
  /** Personal Heat (A18). */
  pHeat: Pct,
  fatigue: Pct,
  xp: N0,
  /** Tenths towards +1 on each stat (Part 2 §3: +0.2 a success). */
  statXp: Stat10,
  /** Task XP per task id (team-actions.md task levels 1-5). */
  taskXp: z.record(S, N0),
  /** What they do most (by task family) and how you treat them (Part 2 §4.2). */
  tally: z.record(S, N0),
  treat: z.partialRecord(TREAT, N0),
  /** Today's task id (kept day to day until changed). */
  task: S,
  /** The task set earlier than the day before it ran (Planner). */
  setDay: I.min(0),
  /** How yesterday's task went (talk triggers). */
  last: z.enum(['none', 'success', 'big', 'fail', 'caught', 'arrested', 'refused', 'skipped', 'wandered']),
  lastTask: S.nullable(),
  /** Out of action: hurt or in a cell, with days left. */
  out: z.object({ why: z.enum(['hurt', 'jail', 'held']), days: I.min(1) }).strict().nullable(),
  /** Days worked in a row (Ask for Time Off). */
  worked: N0,
  /** Tasks they refuse (their Line). */
  line: z.array(S),
  memory: z.array(z.object({ day: I.min(1), line: S }).strict()),
  nick: S.nullable(),
  wageDay: I.min(1),
  /** ₽ pocketed this week (Greedy, Embezzler); Audit the Books gets it back. */
  pocketed: N0,
  flags: z.array(S),
  /** Talk id -> the last day it came up. */
  talked: z.record(S, I.min(1)),
  /** D19: the personality card, rolled once (personality.ts) and kept. Optional: older saves get it on the next step. */
  card: CardSchema.optional(),
}).strict();
export type MemberCrew = z.infer<typeof MemberCrewSchema>;

export const LeadSchema = z.object({
  id: S, name: S, cls: S, kind: S, look: S, gender: z.enum(['m', 'f']), role: S.nullable(),
  stats: StatsSchema, green: S, motive: S, hates: S, chance: Pct, foundBy: S, day: I.min(1),
  /** Day they can be asked again after "not yet", or 0. */
  notBefore: N0, bonus: N0,
  /** Said yes but the HQ is full: on the waiting list. */
  waiting: z.boolean(),
  pitch: S.nullable(),
}).strict();
export type Lead = z.infer<typeof LeadSchema>;

export const HireSchema = z.object({ type: S, name: S, price: N0, temperament: S, green: S, sold: z.boolean() }).strict();
export type Hire = z.infer<typeof HireSchema>;

export const AlertSchema = z.object({ kind: z.enum(['crew', 'money', 'rival', 'police', 'hero', 'world']), time: S, text: S }).strict();
export type Alert = z.infer<typeof AlertSchema>;

export const CrewStateSchema = z.object({
  /** Caught and stolen Pokémon (D4 turns this into the Reserve). */
  stores: z.array(MonSchema),
  leads: z.array(LeadSchema),
  hires: z.array(HireSchema),
  hireDay: N0,
  /** The talk cards waiting for an answer (member id + talk id). */
  talks: z.array(z.object({ member: S, talk: S, task: S.nullable() }).strict()),
  talksToday: N0,
  talkDay: N0,
  /** The crew's part of the last Night Report, with times (mockup 2). */
  alerts: z.array(AlertSchema),
  /** Day actions the scouts saved for today (a favour can spend one: below zero). */
  saved: I,
  /** Grunt types used once (#150), and names already taken. */
  used: z.array(S),
  /** Patron id -> 'rumour' | 'found' | 'won', plus job progress. */
  patrons: z.record(S, z.object({ state: z.enum(['rumour', 'found', 'won']), progress: N0, day: I.min(1) }).strict()),
  /** Members who left, for the Goodbye talk. */
  gone: z.array(z.object({ id: S, name: S, day: I.min(1), why: S }).strict()),
  /** Next member id number. */
  next: I.min(2),
  /** The weekly reroll (Fortunate) used this week, by member id. */
  rerolled: z.array(S),
  /** What the night made that needs the run to finish (a caught Pokémon, a level, an item); the session settles it. */
  pending: z.array(z.union([
    z.object({ k: z.literal('mon'), species: S, level: I.min(1) }).strict(),
    z.object({ k: z.literal('level'), member: S, uid: S, level: I.min(1) }).strict(),
    z.object({ k: z.literal('item'), id: S, n: I.min(1) }).strict(),
  ])),
}).strict();
export type CrewState = z.infer<typeof CrewStateSchema>;

// ---------- D5 data: hq.json (Part 3 §3, Part 9 A21-A22) and buildings.json (lists/buildings*.md) ----------

const Pair = z.tuple([S, S]);
export const HqLevelSchema = z.object({
  lv: I.min(1).max(6), name: S, cost: N0,
  /** Null: the region cap (the main game's rule: 100 in the first region, +50 a region, max 500). */
  levelCap: I.min(1).nullable(), crewCap: I.min(1), slots: I.min(1), defense: N0,
  needs: z.object({ districts: I.min(1).optional(), crew: I.min(1).optional(), gym: z.boolean().optional(), admin: z.boolean().optional(), half: z.boolean().optional(), feared: z.boolean().optional() }).strict(),
  look: S, wall: Pair, roof: Pair,
}).strict();
export const BuildingTierSchema = z.object({ t: I.min(1).max(8), name: S, cost: z.number().positive(), effect: z.number().positive(), days: I.min(1), hq: I.min(1).max(6), region: I.min(1), gym: z.boolean().optional() }).strict();
export const HqFileSchema = z.object({
  _source: S,
  levels: z.array(HqLevelSchema).length(6),
  upgradeDays: I.min(1),
  tiers: z.array(BuildingTierSchema).length(8),
  rules: z.object({
    storageBase: N0, upkeepPct: N0, unpaidCondition: N0, rebuildPct: N0, sellPct: N0, loanPer: N0, loanRate: N0, loanWeeks: I.min(1),
    launderDays: I.min(1), launderAction: z.object({ max: I.min(1), fee: N0, days: I.min(1) }).strict(), brokeDefense: N0, regionsInRun: I.min(1), hideoutDistricts: S,
  }).strict(),
  /** An action's or task's unlock word -> the building that opens it. */
  rooms: z.record(S, S),
  /** The first seven on the Buy Room list (Kice's poster). */
  poster: z.array(S).length(7),
  menu: z.array(z.object({ id: S, label: S, key: S }).strict()).min(6),
  lines: z.record(S, S),
  icons: z.object({ groups: z.record(S, S), ids: z.record(S, S), colours: z.record(S, Pair) }).strict(),
}).strict();
export type HqFile = z.infer<typeof HqFileSchema>;

/** What a building does at T1 (scaled by the tier's Effect x). See tools/dominion/buildings-to-json.py. */
export const BuildingFxSchema = z.object({
  crewCap: N0.optional(), morale: N0.optional(), loyalty: N0.optional(), income: N0.optional(), clean: N0.optional(), weekly: N0.optional(),
  heatDay: N0.optional(), heatWeek: N0.optional(), heatOnce: N0.optional(), control: N0.optional(), trainXp: N0.optional(), injury: Pct.optional(),
  recruit: N0.optional(), hireOff: Pct.optional(), launder: Pct.optional(), treasury: N0.optional(), storage: N0.optional(), defense: N0.optional(),
  dayActions: N0.optional(), nightActions: N0.optional(), restBonus: N0.optional(), fatigue: N0.optional(), repair: N0.optional(), incomePct: N0.optional(),
  items: z.record(S, I.min(1)).optional(), weeklyItems: z.record(S, I.min(1)).optional(), unlock: z.boolean().optional(),
  // D9 (rivals.ts): intel (the rival's weekly plan shows), spyCatch (% of planted spies caught at the door), cipher (% off
  // your spies being caught), raidDef (Defense in raids only), warn (days' warning of the Boss's raid), fireCut (% off
  // building damage), truceOff (% off tribute).
  intel: N0.optional(), spyCatch: Pct.optional(), cipher: Pct.optional(), raidDef: N0.optional(), warn: N0.optional(), fireCut: Pct.optional(), truceOff: Pct.optional(),
}).strict();
export type BuildingFx = z.infer<typeof BuildingFxSchema>;
export const BuildingSchema = z.object({
  n: S, id: S, name: S, listName: S, group: z.string().regex(/^[A-JPQ]$/), sub: S.optional(), groupName: S, focus: z.enum(['hq', 'pokemon', 'grunt']),
  part3: z.boolean(), slots: N0, outside: z.boolean(), canOutside: z.boolean(), cost: N0, t1: S, per: S, cap: S, ladder: z.array(S).length(8),
  minTier: I.min(0).max(5), status: z.enum(['supported', 'limited', 'disabled']), fx: BuildingFxSchema, waits: S.nullable(), note: S.optional(),
}).strict().refine((b) => (b.status === 'disabled') === !Object.keys(b.fx).length, { message: 'a live building has an effect; a disabled one has none' })
  .refine((b) => b.status !== 'disabled' || !!b.waits, { message: 'a disabled building names what it waits for' })
  .refine((b) => b.status !== 'limited' || !!b.note, { message: 'a limited building says what waits' });
export type Building = z.infer<typeof BuildingSchema>;
export const BuildingsFileSchema = z.object({ _source: S, buildings: z.array(BuildingSchema).min(266) }).strict();

// ---------- D5: the save block's `hq` (optional; no block bump) ----------

export const RoomSchema = z.object({
  uid: S,
  /** Building id (buildings.json). */
  id: S,
  tier: I.min(1).max(8),
  /** Condition 0-100 (lists/buildings.md §1): raids, sabotage, the Hero and unpaid upkeep lower it; 0 ruins it. */
  cond: I.min(0).max(100),
  /** ₽ spent on it so far (upkeep is a share of this; selling gives back a share). */
  spent: N0,
  /** Being built (new) or raised a tier: works from `ready` (the morning of that day). */
  building: z.boolean(),
  up: z.boolean(),
  ready: N0,
  /** Shut while broke (A22). */
  shut: z.boolean(),
  /** Ruined at Condition 0: rebuild at 60% cost, one tier lower. */
  ruined: z.boolean(),
  /** Outside buildings: the district it stands in (null inside the HQ). */
  at: S.nullable(),
}).strict();
export type Room = z.infer<typeof RoomSchema>;

export const HqStateSchema = z.object({
  rooms: z.array(RoomSchema),
  next: I.min(1),
  /** The HQ upgrade under way (Part 3 §3.1: three days): the level it reaches, the day it's done, the level cap it brings. */
  upgrade: z.object({ to: I.min(2).max(6), ready: I.min(1), cap: I.min(1) }).strict().nullable(),
  /** The clean part of the funds (A21: upgrades and Buy Outs take clean money only). Never more than the funds. */
  clean: N0,
  /** Money in the wash: comes back clean on `ready`. */
  wash: z.array(z.object({ net: I.min(1), ready: I.min(1), front: S }).strict()),
  /** A Fence's loan (A22): what's owed and the weeks it has run. */
  loan: z.object({ owed: N0, weeks: N0 }).strict().nullable(),
  /** Broke at the last weekly bill (A22): Defense down, the costliest room shut until paid. */
  broke: z.boolean(),
}).strict();
export type HqState = z.infer<typeof HqStateSchema>;

// ---------- D9 data: rivals.json, rivalActions.json, outside.json (Part 4 §1-2, Part 3 §4, Part 9 A7) ----------

export const RIVAL_STAGES = ['unaware', 'watching', 'annoyed', 'hostile', 'war', 'boss'] as const;
export type RivalStage = (typeof RIVAL_STAGES)[number];
/** What the engine does with a rival action (rivals.ts KINDS). */
export const RIVAL_KINDS = [
  'spy', 'intel', 'heat', 'rent', 'money', 'sweep', 'closed', 'cond', 'mood', 'jam', 'racket', 'smash', 'vault', 'stealMon', 'kidnap', 'burn',
  'poach', 'loyalty', 'loyalty1', 'recruitCut', 'skim', 'regard', 'hero', 'control', 'fight', 'demand', 'deal', 'defect', 'bossRaid', 'truce',
  'tension', 'grow', 'research', 'arm', 'hide', 'hurt',
] as const;
export type RivalKind = (typeof RIVAL_KINDS)[number];
const LadderKey = z.enum(['S', 'M', 'P', 'D', 'H', 'C', 'R', 'N']);
export type LadderKey = z.infer<typeof LadderKey>;
export const RivalActionSchema = z.object({
  n: I.min(1).max(150), id: S, name: S, cat: z.string().regex(/^[A-O]$/), stage: z.enum(RIVAL_STAGES).exclude(['unaware']), text: S,
  uses: z.array(LadderKey), milestones: z.record(z.enum(['3', '6', '8']), S),
  status: z.enum(['supported', 'limited', 'disabled']), kind: z.enum(RIVAL_KINDS).optional(), note: S.optional(), waits: z.string().regex(/^D\d+$/).optional(),
}).strict().refine((a) => (a.status === 'disabled') === !a.kind, { message: 'a live action has a kind; a disabled one has none' })
  .refine((a) => a.status !== 'disabled' || !!a.waits, { message: 'a disabled action names the slice it waits for' })
  .refine((a) => a.status !== 'limited' || !!a.note, { message: 'a limited action says what waits' });
export type RivalAction = z.infer<typeof RivalActionSchema>;
export const RivalActionsFileSchema = z.object({
  _source: S, categories: z.record(S, S), ladders: z.record(LadderKey, z.array(z.number()).length(8)), actions: z.array(RivalActionSchema).length(150),
}).strict();
export type RivalActionsFile = z.infer<typeof RivalActionsFileSchema>;

export const OutsideRowSchema = z.object({
  id: z.string().regex(/^O\d{3}$/), section: z.string().regex(/^[A-L]$/), what: S, who: S, choices: z.array(S).min(1),
  marks: z.array(z.enum(['minor', 'night', 'day', 'scales', 'chain'])), status: z.enum(['supported', 'limited', 'disabled']), waits: z.string().regex(/^D\d+$/).optional(),
}).strict().refine((r) => r.status !== 'disabled' || !!r.waits, { message: 'a disabled row names the slice it waits for' });
export type OutsideRow = z.infer<typeof OutsideRowSchema>;
export const OutsideFileSchema = z.object({ _source: S, sections: z.record(S, S), rows: z.array(OutsideRowSchema).length(300) }).strict();

const RivalFoeSchema = z.object({ id: S, name: S, species: z.array(S).min(1) }).strict();
export const RivalTeamSchema = z.object({
  id: S, region: S, on: z.boolean(), name: S, tag: S, colour: S, note: S.optional(),
  boss: z.object({ id: S, name: S, personality: S, look: S.nullable(), species: z.array(S).min(1) }).strict(),
  admins: z.array(RivalFoeSchema),
  grunt: z.object({ name: S, species: z.array(S).min(1) }).strict(),
  sites: z.array(z.object({ id: S, name: S, district: S, hq: z.boolean().optional() }).strict()),
}).strict();
export type RivalTeam = z.infer<typeof RivalTeamSchema>;
/** One choice on a rival street meeting (outside.json section F): what it changes. Money is in M-ladder steps (+ gain, − cost). */
export const StreetChoiceSchema = z.object({
  label: S, ten: I.optional(), rg: I.optional(), dr: I.optional(), h: I.optional(), money: I.optional(), control: I.optional(), theirControl: I.optional(),
  fight: z.enum(['grunt', 'admin']).optional(), racket: z.boolean().optional(), lead: z.boolean().optional(), intel: z.boolean().optional(), mySpy: z.boolean().optional(),
  spyGone: z.boolean().optional(), foil: z.boolean().optional(), theirIntel: I.optional(), theirPower: I.optional(), item: S.optional(), truceDays: I.min(1).optional(),
  loot: z.boolean().optional(), gamble: z.boolean().optional(), debate: z.boolean().optional(), mon: z.boolean().optional(), site: z.boolean().optional(),
}).strict();
export type StreetChoice = z.infer<typeof StreetChoiceSchema>;
export const RivalsFileSchema = z.object({
  _source: S, region: S,
  teams: z.array(RivalTeamSchema).min(1),
  stages: z.array(z.object({ id: z.enum(RIVAL_STAGES), min: I.min(0).max(100), name: S, word: S, does: S }).strict()).length(6),
  tension: z.object({ start: N0, perControl: I.min(1), perMember: N0, perHqLevel: N0, hitSite: N0, poach: N0, decay: N0, quietNights: N0, truceWeek: N0, breakTruce: N0, bossWin: N0, raidHeld: N0 }).strict(),
  ap: z.object({ base: N0, perAdmin: N0 }).strict(),
  plan: z.object({
    day: I.min(1), count: I.min(1),
    priorities: z.array(z.object({ id: S, name: S, text: S, cats: z.array(z.string().regex(/^[A-O]$/)).min(1) }).strict()).length(6),
    personalities: z.record(S, z.record(S, N0)), lawHeat: N0, research: N0, seeHq: I.min(1), inPlan: N0, perRoom: N0, perMember: N0,
  }).strict(),
  raid: z.object({ hold: N0, perDefense: N0, perGuard: N0, theirSpy: N0, mySpy: N0, min: N0, max: N0, jam: N0, lossPower: N0 }).strict(),
  bossRaid: z.object({ warn: I.min(1), size: I.min(1).max(6), min: I.min(1), perDefense: I.min(1), level: I, dread: N0, vaultPct: N0, held: I.min(1), after: Pct }).strict(),
  truce: z.object({ tributeK: z.number().positive(), askChance: N0, minTension: N0 }).strict(),
  spy: z.object({ max: I.min(1), caught: N0, raidCut: N0, sweepBase: N0 }).strict(),
  held: z.object({ days: I.min(1), ransomK: z.number().positive() }).strict(),
  cards: z.object({ days: I.min(1) }).strict(),
  street: z.object({ chance: N0, night: N0, minTension: N0, rows: z.record(S, z.array(StreetChoiceSchema).min(1)) }).strict(),
  lines: z.record(S, S),
}).strict();
export type RivalsFile = z.infer<typeof RivalsFileSchema>;

// ---------- D9: the save block's `rivals` (optional; no block bump) ----------

const SITE = z.enum(['theirs', 'yours', 'gone']);
export const RivalTeamStateSchema = z.object({
  tension: Pct,
  peak: Pct,
  /** The stage last announced (0 Unaware .. 5 Boss's attention). */
  stage: I.min(0).max(5),
  /** Nights since Tension last rose (it cools after `quietNights`). */
  quiet: N0,
  /** The week's three priorities (A7) and the day they were picked. */
  plan: z.array(S),
  planDay: N0,
  /** Action Points left this week. */
  ap: N0,
  /** Admins still standing (ids). */
  admins: z.array(S),
  /** Their strength beyond the start: more Grunts, levels, mercenaries (+), raids lost (−). */
  power: I,
  /** Their Goal track (Research priority). */
  research: Pct,
  /** What they know about you: raid odds +%. */
  intel: Pct,
  /** Their spies planted in your crew. */
  spies: N0,
  /** Stockpiled arms: the next raid is this % stronger. */
  arm: Pct,
  /** Cells reorganised: your spies find this % less. */
  hide: Pct,
  /** A truce: the weekly tribute (0 for a set-length truce that ends on `until`). */
  truce: z.object({ tribute: N0, since: I.min(1), paid: N0, until: I.min(1).nullable() }).strict().nullable(),
  sites: z.record(S, SITE),
  /** The night the Boss raids the HQ (Tension 80+), or null. */
  raid: I.nullable(),
  /** This week's moves, newest last (the Rival File). */
  log: z.array(z.object({ day: I.min(1), text: S }).strict()),
  /** What the last night saw (Tension from growth). */
  seen: z.object({ control: N0, members: N0, hq: I.min(1) }).strict(),
}).strict();
export type RivalTeamState = z.infer<typeof RivalTeamStateSchema>;
export const RivalCardSchema = z.object({
  kind: z.enum(['fight', 'demand', 'deal', 'defect', 'truce', 'street']),
  team: S,
  /** The rival action (rivalActions.json id) or street row (O141..O165). */
  ref: S,
  who: S,
  amount: N0,
  district: S.nullable(),
  /** A truce offer that asks for a member or a district instead of money. */
  ask: z.enum(['money', 'member', 'district']).nullable(),
  until: I.min(1),
}).strict();
export type RivalCard = z.infer<typeof RivalCardSchema>;
export const RivalsStateSchema = z.object({
  teams: z.record(S, RivalTeamStateSchema),
  /** Your spies inside a rival team (crew task Spy). */
  mySpies: z.array(z.object({ member: S, team: S, day: I.min(1) }).strict()),
  rent: z.object({ pct: Pct, until: I.min(1) }).strict().nullable(),
  recruit: z.object({ pct: Pct, until: I.min(1) }).strict().nullable(),
  /** The night the alarms are jammed. */
  jam: N0,
  /** Rooms the rival shut, and the day they open again. */
  closed: z.array(z.object({ uid: S, until: I.min(1) }).strict()),
  /** Rackets paying a rival until a day. */
  turned: z.array(z.object({ racket: RacketSchema, team: S, until: I.min(1) }).strict()),
  /** Members a rival is holding. */
  held: z.array(z.object({ member: S, team: S, day: I.min(1), ransom: N0 }).strict()),
  cards: z.array(RivalCardSchema),
  /** Street rows met this run (each at most once). */
  street: z.array(S),
  /** Rolls made on `dominion-rival-card` (answers and street meetings). */
  rolls: N0,
  /** The Boss's highest Pokémon level, read at each step: the rival actions' tier (rival-team-actions.md). */
  top: I.min(1),
}).strict();
export type RivalsState = z.infer<typeof RivalsStateSchema>;
