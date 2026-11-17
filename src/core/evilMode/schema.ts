// Evil Mode (design Part 30): the mode's data schemas and its optional save block `run.expansion.evilMode`.
// Pure Zod, no Phaser. Slice 1 ("the shell") holds only what founding and an empty day need: the team, where the day is,
// the stream counts and the applied set. Later slices add their fields to the block and bump its own `v`.

import { z } from 'zod';

/** Content status (design Part 30 section 12): every entry has one. Passing the schema is not "supported". */
export const EvilStatusSchema = z.enum(['supported', 'limited', 'disabled', 'invalid']);

export const LINE_IDS = ['clean', 'grey', 'whatever'] as const;
export const LineIdSchema = z.enum(LINE_IDS);
export type LineId = z.infer<typeof LineIdSchema>;

/** The six beats of a day, in order (design Part 30 section 6.1). */
export const BEATS = ['morning', 'dispatch', 'inPerson', 'evening', 'night', 'hero'] as const;
export const BeatSchema = z.enum(BEATS);
export type Beat = z.infer<typeof BeatSchema>;

/** The five gameplay streams (design Part 30 section 5). Slice 1 draws from none; counts start at 0. */
export const STREAMS = ['evil-dispatch', 'evil-people', 'evil-mole', 'evil-gym', 'evil-neighbour'] as const;

const StartSchema = z.object({ funds: z.number().int().min(0), heat: z.number().int().min(0).max(10), loyalty: z.number().int().min(1).max(10), regard: z.number().int().min(0).max(10), dread: z.number().int().min(0).max(10), roster: z.number().int().min(0) });

export const CreedSchema = z.object({
  id: z.string().min(1), name: z.string().min(1), line: z.string().min(1), pays: z.string().min(1), applies: z.string().min(1),
  startsWith: z.string().min(1), room: z.string().min(1), scheme: z.string().min(1), also: z.string().min(1), face: z.string().min(1),
  start: StartSchema, status: EvilStatusSchema,
});
export const CreedsFileSchema = z.object({ note: z.string(), creeds: z.array(CreedSchema).length(6) });

export const DoctrineSchema = z.object({
  id: z.string().min(1), name: z.string().min(1), line: z.string().min(1), perk: z.string().min(1), weakness: z.string().min(1), home: z.string().min(1),
  kanto: z.array(z.string().min(1)).min(2), kits: z.array(z.array(z.string().min(1)).min(2).max(3)).length(3), says: z.string().min(1), status: EvilStatusSchema,
});
export const DoctrinesFileSchema = z.object({ note: z.string(), doctrines: z.array(DoctrineSchema).length(8) });

export const MethodSchema = z.object({ id: z.string().min(1), name: z.string().min(1), word: z.string().min(1), minLine: LineIdSchema, status: EvilStatusSchema });
export const MethodsFileSchema = z.object({ note: z.string(), methods: z.array(MethodSchema).length(7) });

export const FoundingFileSchema = z.object({
  note: z.string(),
  opening: z.array(z.string().min(1)).length(3),
  oldLookLine: z.string().min(1),
  confirmLine: z.string().min(1),
  names: z.object({ maxLength: z.number().int().min(1), lists: z.record(z.string(), z.array(z.string().min(1)).min(1)), taken: z.array(z.string().min(1)) }),
  lines: z.array(z.object({ id: LineIdSchema, name: z.string().min(1), feel: z.string().min(1), heat: z.number().int().min(0), regard: z.number().int().min(0) })).length(3),
  look: z.object({ a: z.string().regex(/^#[0-9a-f]{6}$/i), b: z.string().regex(/^#[0-9a-f]{6}$/i) }),
  region: z.object({ id: z.string().min(1), name: z.string().min(1) }),
  bands: z.array(z.object({ min: z.number().int().min(0), name: z.string().min(1), face: z.string().min(1) })).length(5),
  beats: z.array(z.object({ id: BeatSchema, name: z.string().min(1), button: z.string().min(1), empty: z.string().min(1) })).length(BEATS.length),
});

export const RUN_LENGTHS = ['three', 'six'] as const;
export const RunLengthSchema = z.enum(RUN_LENGTHS);
export type RunLength = z.infer<typeof RunLengthSchema>;

export const EvilTeamSchema = z.object({
  name: z.string().min(1).max(14),
  sayable: z.boolean(),
  /** The Boss: the trainer the run was started with (any owned trainer). */
  boss: z.string().min(1),
  creed: z.string().min(1),
  line: LineIdSchema,
  /** Regions (by index) in which the Line was moved; once a region at most. */
  lineMovedInRegion: z.array(z.number().int().min(0)),
  doctrine: z.string().min(1),
  /** The team's two colours. Slice 1 has no Look page: cream and green. */
  look: z.object({ a: z.string().regex(/^#[0-9a-f]{6}$/i), b: z.string().regex(/^#[0-9a-f]{6}$/i) }),
  /** No Patron page until a later slice. */
  patron: z.string().nullable(),
  funds: z.number().int().min(0),
  heat: z.number().int().min(0).max(10),
  regard: z.number().int().min(0).max(10),
  dread: z.number().int().min(0).max(10),
  corruption: z.number().int().min(0),
});
export type EvilTeam = z.infer<typeof EvilTeamSchema>;

// ---- Slice 2: a district (design Parts 6 and 7, Part 30 sections 3.4 and 3.5) ----

export const MOODS = ['warm', 'easy', 'wary', 'sullen', 'shut'] as const;
export const MoodSchema = z.enum(MOODS);
export type Mood = z.infer<typeof MoodSchema>;

export const HOLDING_KINDS = ['local', 'wild', 'alpha', 'safehouse', 'opportunity', 'town', 'gym'] as const;
export const HoldingKindSchema = z.enum(HOLDING_KINDS);
export type HoldingKind = z.infer<typeof HoldingKindSchema>;

/** The four methods slice 2 builds. Lean, Take and Expose arrive later (their buttons show, refused, with why). */
export const JOB_METHODS = ['scout', 'persuade', 'pay', 'outplay'] as const;
export const JobMethodSchema = z.enum(JOB_METHODS);
export type JobMethod = z.infer<typeof JobMethodSchema>;

const LocalSchema = z.object({
  id: z.string().min(1), who: z.string().min(1), trade: z.string().min(1), earns: z.number().int().min(0), take: z.number().int().min(0),
  want: z.string().min(1), fear: z.string().min(1), mood: MoodSchema, says: z.string().min(1),
  noPrice: z.string().min(1).optional(), priceTimes: z.number().int().min(1).optional(), minor: z.boolean().optional(),
});
export type LocalDef = z.infer<typeof LocalSchema>;

export const DistrictFileSchema = z.object({
  note: z.string(),
  districts: z.array(z.object({ region: z.number().int().min(0), n: z.number().int().min(1), town: z.string().min(1), leader: z.string().min(1), grievance: z.string().min(1), status: EvilStatusSchema })).min(1),
  layout: z.object({ steps: z.literal(20), local: z.number().int().min(1), wild: z.number().int().min(0), alpha: z.number().int().min(0), safehouse: z.number().int().min(0), opportunity: z.number().int().min(0), town: z.literal(1) }),
  rules: z.object({ days: z.number().int().min(1), toHold: z.number().int().min(1), townStreet: z.number().int().min(1), scoutReach: z.number().int().min(0), fairDays: z.number().int().min(1), crew: z.number().int().min(1), squadMax: z.number().int().min(1), townTakings: z.number().int().min(0), safehouseRent: z.number().int().min(0), wage: z.number().int().min(0), wageCause: z.number().int().min(0) }),
  streets: z.array(z.object({ name: z.string().min(1), from: z.number().int().min(1), to: z.number().int().min(1) })).min(1),
  moods: z.array(z.object({ id: MoodSchema, name: z.string().min(1), dot: z.string().regex(/^#[0-9a-f]{6}$/i), persuade: z.number().int().multipleOf(5) })).length(MOODS.length),
  kinds: z.array(z.object({ id: HoldingKindSchema, name: z.string().min(1), mark: z.string().min(1), methods: z.array(JobMethodSchema), places: z.array(z.string().min(1)).optional(), outplay: z.number().int().multipleOf(5).optional(), price: z.number().int().min(0).optional(), mood: MoodSchema.optional(), why: z.string().optional() })).length(HOLDING_KINDS.length),
  methods: z.object({
    persuade: z.object({ base: z.number().int().multipleOf(5), heat: z.number().int(), regard: z.number().int() }),
    pay: z.object({ heat: z.number().int(), offers: z.array(z.object({ pct: z.number().int().min(1).max(100), odds: z.number().int().multipleOf(5).nullable(), fair: z.boolean(), lowball: z.boolean().optional() })).min(1) }),
    outplay: z.object({ base: z.number().int().multipleOf(5), heat: z.number().int(), regard: z.number().int() }),
    scout: z.object({ heat: z.number().int() }),
  }),
  terms: z.object({ scouted: z.number().int().multipleOf(5), short: z.number().int().multipleOf(5), triedBefore: z.number().int().multipleOf(5), wantKnown: z.number().int().multipleOf(5), regardPerPoint: z.number().int().multipleOf(5), regardMost: z.number().int().multipleOf(5), dread: z.number().int().multipleOf(5), floor: z.number().int().min(0), ceiling: z.number().int().max(100) }),
  voices: z.record(z.string(), z.array(z.string().min(1)).min(1)),
  ends: z.object({ held: z.string().min(1), taken: z.string().min(1) }),
  locals: z.array(LocalSchema).min(8),
});

export const HoldingSchema = z.object({
  id: z.string().min(1),
  /** 1..20 on the district's road. */
  step: z.number().int().min(1).max(20),
  kind: HoldingKindSchema,
  /** The place or the local's deck id. */
  ref: z.string().min(1),
  mood: MoodSchema.nullable(),
  /** 0 nothing known, 1 who/trade/earns/mood/price, 2 and want and fear (design Part 7 section 8). */
  scouted: z.number().int().min(0).max(2),
  owner: z.enum(['team', 'nobody']),
  method: JobMethodSchema.optional(),
  since: z.number().int().min(1).optional(),
  /** "Yours, holds" (true) or "Yours, would turn" (false). */
  holds: z.boolean(),
  /** Methods tried here and failed (the next try is +10%). */
  tried: z.array(JobMethodSchema),
}).strict();
export type Holding = z.infer<typeof HoldingSchema>;

export const OddsTermSchema = z.object({ label: z.string().min(1), value: z.number().int() });
export type OddsTerm = z.infer<typeof OddsTermSchema>;

export const JobSchema = z.object({
  holdingId: z.string().min(1),
  method: JobMethodSchema,
  squad: z.array(z.string().min(1)).min(1),
  /** Pay only: the offer as a percent of the fair price. */
  offer: z.number().int().min(1).max(100).optional(),
  /** Fixed at "Send them" (design Part 30 section 3.5); null while still being built. */
  odds: z.number().int().min(0).max(100).nullable(),
  certain: z.boolean(),
  terms: z.array(OddsTermSchema),
  /** Slice 3: the Honest Card this job was confirmed on (absent only on a job queued before slice 3). */
  cardId: z.string().min(1).optional(),
}).strict();
export type Job = z.infer<typeof JobSchema>;

export const SheetSchema = z.object({
  holdingId: z.string().min(1), method: JobMethodSchema, squad: z.array(z.string()), odds: z.number().int(), certain: z.boolean(),
  roll: z.number().int().min(1).max(100), won: z.boolean(), voice: z.string(), lines: z.array(z.string()),
}).strict();
export type Sheet = z.infer<typeof SheetSchema>;

export const DistrictSchema = z.object({
  region: z.number().int().min(0),
  n: z.number().int().min(1),
  /** The run's seed, copied so the day machine stays a pure function of the block. */
  seed: z.string().min(1),
  holdings: z.array(HoldingSchema).length(20),
  /** Street indexes where a Persuade has already given Regard. */
  regardStreets: z.array(z.number().int().min(0)),
  end: z.object({ how: z.enum(['held', 'taken']), day: z.number().int().min(1), count: z.number().int().min(0) }).optional(),
}).strict();
export type District = z.infer<typeof DistrictSchema>;

export const CrewSchema = z.object({ id: z.string().min(1), name: z.string().min(1), outOn: z.number().int().min(1).nullable() }).strict();
export type Crew = z.infer<typeof CrewSchema>;

// ---- Slice 3: the Card and the Ledger (design Part 12 section 1, Part 25a section 5, Part 29 sections 6 and 8, Part 30 section 7) ----

export const CardFieldSchema = z.object({ label: z.string().min(1), text: z.string().min(1), unknown: z.boolean() }).strict();
export type CardField = z.infer<typeof CardFieldSchema>;

/** A confirmed Honest Card, kept with its day (Part 12 section 1.2: "The Card's kept"). Thirteen fields, always in order. */
export const StoredCardSchema = z.object({
  id: z.string().min(1),
  day: z.number().int().min(1),
  region: z.number().int().min(0),
  district: z.number().int().min(1),
  holdingId: z.string().min(1),
  method: JobMethodSchema,
  offer: z.number().int().min(1).max(100).optional(),
  clean: z.boolean(),
  fields: z.array(CardFieldSchema).length(13),
}).strict();
export type StoredCard = z.infer<typeof StoredCardSchema>;

export const LOG_KINDS = ['card', 'job', 'pay', 'waive', 'halve', 'ask'] as const;

/** One line of the Log (Part 30 section 7.1, the kinds slice 3 writes). Never edited, never removed. */
export const LogEntrySchema = z.object({
  id: z.string().min(1),
  day: z.number().int().min(1),
  region: z.number().int().min(0),
  district: z.number().int().min(1),
  kind: z.enum(LOG_KINDS),
  /** Crew ids. */
  who: z.array(z.string()),
  /** The holding the line is about. */
  to: z.string().optional(),
  method: JobMethodSchema.optional(),
  cardId: z.string().optional(),
  result: z.enum(['went', 'didnt', 'called off']).optional(),
  /** The sentence, in the Ledger's grammar (Part 25a section 5.1). A card's is its twelfth field, character for character. */
  text: z.string().min(1),
  /** Fields still in red ink when it was confirmed ("Confirmed without looking"). */
  unknowns: z.number().int().min(0).optional(),
  given: z.number().int().min(0).optional(),
  taken: z.number().int().min(0).optional(),
}).strict();
export type LogEntry = z.infer<typeof LogEntrySchema>;

const S = z.string().min(1);
export const LedgerFileSchema = z.object({
  note: z.string(),
  fields: z.array(S).length(13),
  written: z.object({ scout: S, persuade: S, persuadeFavour: S, persuadeUnknown: S, persuadeRooms: S, payFair: S, payUnder: S, outplay: S, outplayGround: S, went: S, didnt: S, calledOff: S, wages: S, shares: S, short: S, waive: S, halve: S, ask: S }).strict(),
  card: z.object({
    takes: z.object({ scout: S, persuade: S, persuadeFavour: S, persuadeRooms: S, persuadeNothing: S, pay: S, outplay: S, outplayLocal: S }).strict(),
    from: z.object({ nobody: S, local: S, localNothing: S, notScouted: S, place: S }).strict(),
    gives: z.object({ scout: S, money: S, favour: S, rooms: S, ground: S, notKnown: S }).strict(),
    holds: z.object({ holds: S, turns: S, nothing: S }).strict(),
    hero: S, wont: S, notKnownNone: S, clean: S, underPrice: S, lead: S, unseen: S, day: S,
  }).strict(),
  count: z.object({ wageHead: z.number().int().min(0), waive: z.number().int().min(0) }).strict(),
  ask: z.array(S).min(1),
  tabs: z.array(S).length(4),
  givenTaken: S,
});

export const RateSchema = z.enum(['halved', 'waived']);

const BlockV3Schema = z.object({
  /** The block's own version, for its own migrations. 2: slice 2 added the district, the crew, the queue and the sheets. 3: slice 3 added the Log, the Cards, Given and Taken, and rates. */
  v: z.literal(3),
  from: z.enum(['founding', 'charter', 'turn']),
  /** Copied from Settings at founding, so a setting changed mid-run never changes this run. */
  settings: z.object({ length: RunLengthSchema }),
  team: EvilTeamSchema,
  here: z.object({ region: z.number().int().min(0), stage: z.number().int().min(1).max(8), day: z.number().int().min(1), beat: BeatSchema }),
  /** How many numbers each stream has given out (design Part 30 section 5.1). */
  draws: z.record(z.enum(STREAMS), z.number().int().min(0)),
  /** Ids of things that happened once and can't again (section 6.4). */
  applied: z.array(z.string()),
  /** Null only on a block migrated from v1, until the session lays the district (it needs the run's seed). */
  district: DistrictSchema.nullable(),
  crew: z.array(CrewSchema),
  /** Today's jobs, in the order they were queued. */
  queue: z.array(JobSchema),
  /** The last Evening's result sheets (shown again in the next Morning's Overnight). */
  sheets: z.array(SheetSchema),
  /** The last Evening's money and numbers, one line each. */
  evening: z.array(z.string()),
  /** Slice 3: the Log (append only), every confirmed Card, the two totals (kept as counters; a test checks they equal the Log's sums), and the lines waived or halved. */
  log: z.array(LogEntrySchema),
  cards: z.array(StoredCardSchema),
  given: z.number().int().min(0),
  taken: z.number().int().min(0),
  rates: z.record(z.string(), RateSchema),
}).strict();

/** Four unnamed Grunts (slice 4 brings named people). */
export const firstCrew = (n = 4): Crew[] => Array.from({ length: n }, (_, i) => ({ id: `g${i + 1}`, name: `Grunt ${i + 1}`, outOn: null }));

/**
 * Block migrations, one version at a time; nothing is removed.
 * v1 -> v2 (slice 1's block): the district is laid on the next step, the crew are four Grunts.
 * v2 -> v3 (slice 2's block): an empty Log and no Cards (the Log starts here; jobs already queued keep going without one), Given and Taken at 0, no rates.
 */
export function migrateEvilBlock(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  let b = raw as Record<string, unknown>;
  if (b.v === 1) b = { ...b, v: 2, district: null, crew: firstCrew(), queue: [], sheets: [], evening: [] };
  if (b.v === 2) b = { ...b, v: 3, log: [], cards: [], given: 0, taken: 0, rates: {} };
  return b;
}

export const EvilModeBlockSchema = z.preprocess(migrateEvilBlock, BlockV3Schema);
export type EvilModeBlock = z.infer<typeof BlockV3Schema>;
