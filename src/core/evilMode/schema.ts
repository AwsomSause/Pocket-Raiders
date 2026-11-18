// Evil Mode (design Part 30): the mode's data schemas and its optional save block `run.expansion.evilMode`.
// Pure Zod, no Phaser. Slice 1 ("the shell") holds only what founding and an empty day need: the team, where the day is,
// the stream counts and the applied set. Later slices add their fields to the block and bump its own `v`.

import { fromSaveForm } from './saveForm';
import { z } from 'zod';
import creedsRaw from '../../data/evilMode/creeds.json';

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
export const STREAMS = ['evil-dispatch', 'evil-people', 'evil-mole', 'evil-gym', 'evil-neighbour', 'evil-line', 'evil-drift', 'evil-economy', 'evil-scheme'] as const;

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
  look: z.object({
    a: z.string().regex(/^#[0-9a-f]{6}$/i), b: z.string().regex(/^#[0-9a-f]{6}$/i),
    /** Slice 9: the Look page (Part 3 section 8): a symbol, a cut, headgear and the motto's three slots (ids from region.json). Absent on a block founded before slice 9. */
    symbol: z.string().min(1).optional(), cut: z.string().min(1).optional(), head: z.string().min(1).optional(),
    motto: z.tuple([z.string(), z.string(), z.string()]).optional(),
  }),
  /** Slice 9: the Patron's id (region.json `patrons`), or null on a block founded before slice 9. */
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

/** Slice 9 adds Kanto's own holding, a floor of a building (Part 26a section 2.3). */
/** Slice 16 adds Johto's kept place (held by upkeep, pays nothing) and Hoenn's water route (held by running the boats). */
export const HOLDING_KINDS = ['local', 'wild', 'alpha', 'safehouse', 'opportunity', 'town', 'gym', 'floor', 'kept', 'water', 'lake', 'bridge', 'table', 'shrine', 'awayEnd', 'canteen', 'starBase'] as const;
export const HoldingKindSchema = z.enum(HOLDING_KINDS);
export type HoldingKind = z.infer<typeof HoldingKindSchema>;

/** Slice 2 built four methods; slice 6 adds Lean, Take and Expose (Grey or darker for the first two). */
export const JOB_METHODS = ['scout', 'persuade', 'pay', 'outplay', 'lean', 'take', 'expose'] as const;
/** What a Take takes (design Part 7 section 7.1). A Pokémon waits for the Pen (slice 10). */
export const TAKE_THINGS = ['stock', 'deed', 'ledger'] as const;
export const TakeThingSchema = z.enum(TAKE_THINGS);
export type TakeThing = z.infer<typeof TakeThingSchema>;
export const JobMethodSchema = z.enum(JOB_METHODS);
export type JobMethod = z.infer<typeof JobMethodSchema>;

const LocalSchema = z.object({
  id: z.string().min(1), who: z.string().min(1), trade: z.string().min(1), earns: z.number().int().min(0), take: z.number().int().min(0),
  want: z.string().min(1), fear: z.string().min(1), mood: MoodSchema, says: z.string().min(1),
  noPrice: z.string().min(1).optional(), priceTimes: z.number().int().min(1).optional(), minor: z.boolean().optional(),
  /** Slice 6: something true that could be published about them (Expose), and whether Lean is harder (a retired Ace, a guard). */
  secret: z.string().min(1).optional(), hard: z.boolean().optional(),
  /** Slice 9: a region's own local (Part 26a section 1.5): which region, and the district (n) they live in; they're placed there and nowhere else. */
  region: z.number().int().min(0).optional(), home: z.number().int().min(0).optional(),
  /** Slice 9: methods nobody can use on them (a canon face's locks: Mr. Fuji can't be Leaned on or Taken from), and the line shown. */
  locks: z.array(z.enum(['lean', 'take', 'expose', 'pay', 'outplay'])).optional(), lockWhy: z.string().min(1).optional(),
});
export type LocalDef = z.infer<typeof LocalSchema>;

export const DistrictFileSchema = z.object({
  note: z.string(),
  /** Slice 9: a region's eight stages (n 0 the Arrival, 1..6 the districts, 7 the Reckoning), each with its own streets, places and, for a tower, floors. */
  districts: z.array(z.object({
    region: z.number().int().min(0), n: z.number().int().min(0).max(7), town: z.string().min(1), leader: z.string().min(1), grievance: z.string().min(1), status: EvilStatusSchema,
    kind: z.enum(['arrival', 'district', 'reckoning']).optional(),
    streets: z.array(z.string().min(1)).length(4).optional(),
    places: z.partialRecord(HoldingKindSchema, z.array(z.string().min(1)).min(1)).optional(),
    layout: z.object({ local: z.number().int().min(0), wild: z.number().int().min(0), alpha: z.number().int().min(0), safehouse: z.number().int().min(0), opportunity: z.number().int().min(0), floor: z.number().int().min(0), kept: z.number().int().min(0).optional(), water: z.number().int().min(0).optional(),
      /** Slice 19: Sinnoh's lakes, Unova's bridges, Kalos's tables (Part 26b sections 1.3, 2.3, 3.3). */
      lake: z.number().int().min(0).optional(), bridge: z.number().int().min(0).optional(), table: z.number().int().min(0).optional(),
      /** Slice 20: Alola's shrines, Galar's away ends, Paldea's canteen tables and Star bases (Part 26c sections 1.3, 2.3, 3.3; Part 15b section 5). */
      shrine: z.number().int().min(0).optional(), awayEnd: z.number().int().min(0).optional(), canteen: z.number().int().min(0).optional(), starBase: z.number().int().min(0).optional() }).strict().optional(),
    floors: z.array(z.object({ name: z.string().min(1), tenant: z.string().min(1), take: z.number().int().min(0), says: z.string().min(1) }).strict()).optional(),
    tower: z.string().min(1).optional(),
  }).strict()).min(1),
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
  /** Slice 9: the region rule's tags ('deeded' in Kanto) and, for a floor, its number from the bottom (1 lowest). */
  tags: z.array(z.string().min(1)).optional(),
  floor: z.number().int().min(1).optional(),
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
  /** Slice 5: the Boss went in person and played it (Part 7 section 10): it isn't rolled at Evening. */
  played: z.enum(['won', 'lost']).optional(),
  /** Slice 6: Take only: what's taken. */
  thing: TakeThingSchema.optional(),
}).strict();
export type Job = z.infer<typeof JobSchema>;

export const SheetSchema = z.object({
  holdingId: z.string().min(1), method: JobMethodSchema, squad: z.array(z.string()), odds: z.number().int(), certain: z.boolean(),
  roll: z.number().int().min(1).max(100), won: z.boolean(), voice: z.string(), lines: z.array(z.string()),
  /** Slice 5: played in person, not rolled. */
  played: z.boolean().optional(),
}).strict();
export type Sheet = z.infer<typeof SheetSchema>;

export const DistrictSchema = z.object({
  region: z.number().int().min(0),
  n: z.number().int().min(0),
  /** The run's seed, copied so the day machine stays a pure function of the block. */
  seed: z.string().min(1),
  holdings: z.array(HoldingSchema).length(20),
  /** Street indexes where a Persuade has already given Regard. */
  regardStreets: z.array(z.number().int().min(0)),
  /** Slice 9: 'arrival' when the Hero took the first Badge; 'reckoning' when the Hero arrived at the base. */
  end: z.object({ how: z.enum(['held', 'taken', 'arrival', 'reckoning']), day: z.number().int().min(1), count: z.number().int().min(0) }).optional(),
  /** Slice 9: the day this district began (its days count from here); absent on one laid before slice 9 (day 1). */
  from: z.number().int().min(1).optional(),
}).strict();
export type District = z.infer<typeof DistrictSchema>;

// ---- Slice 4: people (design Part 9, Part 10a, Part 5 section 5, Part 30 section 3.3) ----

export const TALENTS = ['voice', 'hands', 'eyes', 'nerve', 'books', 'wheels', 'heart'] as const;
export const TalentSchema = z.enum(TALENTS);
export type Talent = z.infer<typeof TalentSchema>;
export const FLAWS = ['talks', 'drinks', 'doubts', 'skims', 'freezes', 'loves', 'proud', 'kind'] as const;
export const FlawSchema = z.enum(FLAWS);
export type Flaw = z.infer<typeof FlawSchema>;
export const RANKS = ['grunt', 'lead', 'specialist', 'officer', 'executive'] as const;
export const RankSchema = z.enum(RANKS);
export type Rank = z.infer<typeof RankSchema>;
/** Slice 6 adds three of the nine: the Line moved, with the Hero, arrested (Part 9 section 10). */
/** Slice 16 adds 'stayed': stayed behind at a Crossing (kindly; Part 2 section 9.2). */
/** Slice 7 adds two: a handshake, the coat (knock 31). */
export const LEAVE_WAYS = ['line', 'loyalty', 'letGo', 'lineMoved', 'hero', 'arrested', 'reckoning', 'stayed', 'handshake', 'coat'] as const;
export const QUESTIONS = ['cant', 'wont', 'why', 'who'] as const;
export const QuestionSchema = z.enum(QUESTIONS);
export type Question = z.infer<typeof QuestionSchema>;

/**
 * A person on the Roster (Part 30 section 3.3), one per card. The four unnamed Grunts of slices 2 and 3 are people with
 * no `ref`, talent, flaw or line (a block migrated from v3 keeps them). Loyalty is stored per person, never for the team.
 */
export const CrewSchema = z.object({
  id: z.string().min(1),
  /** The deck id (people.json) for a written person; null for a nameless Grunt. */
  ref: z.string().min(1).nullable(),
  name: z.string().min(1),
  age: z.number().int().min(1).nullable(),
  /** From the deck, set once, never edited. */
  minor: z.boolean(),
  talent: TalentSchema.nullable(),
  flaw: FlawSchema.nullable(),
  flawFound: z.boolean(),
  /** The line's number (1..36) in people.json. */
  line: z.number().int().min(1).max(36).nullable(),
  lineHeard: z.boolean(),
  rank: RankSchema,
  /** 0..10. Shown only as a face and a word. */
  loyalty: z.number().int().min(0).max(10),
  /** Slice 9: 'away', an Officer left behind to hold a district (on the Roster under Away, not on jobs or wages). */
  where: z.enum(['in', 'left', 'away']),
  outOn: z.number().int().min(1).nullable(),
  /** Jobs that went (Grunt to Lead needs three). */
  jobs: z.number().int().min(0),
  /** Times asked across their line. */
  asked: z.number().int().min(0),
  /** Days unpaid in this district (paid on time a whole district: +1 at its end). */
  unpaid: z.number().int().min(0),
  /** The district ("region:n") their talent last fitted a job in (+1 once a district). */
  fitIn: z.string().nullable(),
  /** Slice 7: their mood (Part 9: Warm to Shut), moved a step by a knock's answer; and how often they've knocked (the quiet come first). */
  mood: MoodSchema.default('easy'),
  knocks: z.number().int().min(0).default(0),
  left: z.object({ day: z.number().int().min(1), how: z.enum(LEAVE_WAYS), kindly: z.boolean().optional() }).strict().optional(),
  /** Slice 6: the law knows their face (a failed Take they led without Hands). */
  known: z.boolean().optional(),
  /** Slice 10: in the cells after a Raid (where 'away'), and how they were caught (the visit's line). */
  cell: z.object({ day: z.number().int().min(1), how: z.enum(['holds', 'aside', 'slow', 'down']) }).strict().optional(),
}).strict();
export type Crew = z.infer<typeof CrewSchema>;
export type Person = Crew;

export const ApplicantSchema = z.object({ ref: z.string().min(1), day: z.number().int().min(1), q: QuestionSchema.nullable() }).strict();
export type Applicant = z.infer<typeof ApplicantSchema>;

/** An order across a line, waiting on the Boss's answer in the yard (Part 7 section 11.1). */
export const RefusalSchema = z.object({
  cardId: z.string().min(1),
  job: z.object({ holdingId: z.string().min(1), method: JobMethodSchema, squad: z.array(z.string().min(1)).min(1), offer: z.number().int().min(1).max(100).optional(), thing: TakeThingSchema.optional() }).strict(),
  who: z.array(z.string().min(1)).min(1),
}).strict();
export type Refusal = z.infer<typeof RefusalSchema>;

const T = z.string().min(1);
export const PeopleFileSchema = z.object({
  note: z.string(),
  talents: z.array(z.object({ id: TalentSchema, name: T, mark: T, fits: z.array(JobMethodSchema), says: T, missing: T, refuses: T, lead: T }).strict()).length(TALENTS.length),
  flaws: z.array(z.object({ id: FlawSchema, name: T, mark: T, say: T, note: T }).strict()).length(FLAWS.length),
  tags: z.record(z.string(), T),
  lines: z.array(z.object({ n: z.number().int().min(1).max(36), text: T, tags: z.array(z.string().min(1)) }).strict()).length(36),
  ranks: z.array(z.object({ id: RankSchema, title: T, wage: z.number().int().min(0), share: z.number().int().min(0), needs: T }).strict()).length(RANKS.length),
  rules: z.object({
    rosterCap: z.number().int().min(1), applicantsHeld: z.number().int().min(1), applicantsNotHeld: z.number().int().min(0), waitDays: z.number().int().min(1), leadJobs: z.number().int().min(1), letGoKindDays: z.number().int().min(0), rudeRegard: z.number().int(),
    weights: z.object({ base: z.number().int().min(1), more: z.number().int().min(0), lessDivide: z.number().int().min(1), youngUnder: z.number().int(), oldOver: z.number().int() }).strict(),
    creeds: z.record(z.string(), z.object({ more: z.array(z.string()), less: z.array(z.string()) }).strict()),
    loyalty: z.object({ withdrawn: z.number().int(), withdrawnOthers: z.number().int(), swapped: z.number().int(), insistedWatch: z.number().int(), promoted: z.number().int(), passedOver: z.number().int(), unpaid: z.number().int(), paidDistrict: z.number().int(), fit: z.number().int(), most: z.number().int().min(1) }).strict(),
    odds: z.object({ talentLead: z.number().int().multipleOf(5), talentSecond: z.number().int().multipleOf(5), leadRank: z.number().int().multipleOf(5), officerRank: z.number().int().multipleOf(5), devoted: z.number().int().multipleOf(5), distant: z.number().int().multipleOf(5), leaving: z.number().int().multipleOf(5), eyesReach: z.number().int().min(0) }).strict(),
  }).strict(),
  text: z.record(z.string(), z.union([T, z.array(T), z.record(z.string(), T)])),
  questions: z.array(z.object({ id: QuestionSchema, ask: T, answer: T }).strict()).length(QUESTIONS.length),
  people: z.array(z.object({
    id: T, deck: z.enum(['founders', 'kanto']), name: T, age: z.number().int().min(1), why: T, talent: TalentSchema, flaw: FlawSchema,
    line: z.number().int().min(1).max(36), lineText: T.optional(), quest: T, minor: z.boolean().optional(), status: EvilStatusSchema,
  }).strict()).min(1),
});

export const FacesFileSchema = z.object({ note: z.string(), faces: z.array(z.object({ ref: T, sprite: z.string().regex(/^trainer\.[a-z0-9_/]+$/), provenance: T }).strict()).min(1) });

// ---- Slice 3: the Card and the Ledger (design Part 12 section 1, Part 25a section 5, Part 29 sections 6 and 8, Part 30 section 7) ----

export const CardFieldSchema = z.object({ label: z.string().min(1), text: z.string().min(1), unknown: z.boolean() }).strict();
export type CardField = z.infer<typeof CardFieldSchema>;
/**
 * Slice 16: a kept Card's field, packed at a Crossing (design Part 30 section 7.4: "packed, never summarised and never
 * dropped"): a known field is kept as its text alone (its label is the ledger's own, by its place). Read with `unpackField`.
 */
export const StoredFieldSchema = z.union([CardFieldSchema, z.string().min(1)]);
export type StoredField = z.infer<typeof StoredFieldSchema>;
/** A stored field, whole: a packed one gets its label back from the ledger's list (by its place) and is known. */
export const unpackField = (f: StoredField, i: number, labels: readonly string[]): CardField => (typeof f === 'string' ? { label: labels[i] ?? '', text: f, unknown: false } : f);
/** Packs a field: a known one keeps only its text; an unknown one stays whole. */
export const packField = (f: StoredField): StoredField => (typeof f === 'string' || f.unknown ? f : f.text);

/** A confirmed Honest Card, kept with its day (Part 12 section 1.2: "The Card's kept"). Thirteen fields, always in order. */
export const StoredCardSchema = z.object({
  id: z.string().min(1),
  day: z.number().int().min(1),
  region: z.number().int().min(0),
  district: z.number().int().min(0),
  holdingId: z.string().min(1),
  method: JobMethodSchema,
  offer: z.number().int().min(1).max(100).optional(),
  thing: TakeThingSchema.optional(),
  clean: z.boolean(),
  /** Thirteen; fourteen for the Speech (slice 19: "What you're leaving out"). */
  fields: z.array(StoredFieldSchema).min(13).max(14),
}).strict();
export type StoredCard = z.infer<typeof StoredCardSchema>;

export const LOG_KINDS = ['card', 'job', 'pay', 'waive', 'halve', 'ask', 'asked', 'hire', 'turned', 'leave', 'promote', 'hero', 'line', 'law', 'gym', 'econ', 'neighbour', 'scheme', 'base', 'raid', 'ending', 'knock', 'heard', 'wall'] as const;

/** One line of the Log (Part 30 section 7.1, the kinds slice 3 writes). Never edited, never removed. */
export const LogEntrySchema = z.object({
  id: z.string().min(1),
  day: z.number().int().min(1),
  region: z.number().int().min(0),
  district: z.number().int().min(0),
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

// ---- Slice 5: the Hero (design Part 18) ----

export const PERSONALITIES = ['protector', 'champion-chaser', 'strategist', 'bitter-challenger', 'enthusiast', 'idealist', 'prodigy', 'underdog'] as const;
export const PersonalitySchema = z.enum(PERSONALITIES);
export type Personality = z.infer<typeof PersonalitySchema>;
export const REASON_KINDS = ['stop', 'ask', 'find'] as const;
const HS = z.string().min(1);
export const HeroFileSchema = z.object({
  note: z.string(),
  /** The slice's undo (Part 31): false and no Hero is made; slices 1 to 4 still play. */
  on: z.boolean(),
  rivalId: HS,
  kids: z.array(z.object({ name: HS, look: z.string().regex(/^trainer\.[a-z0-9_/]+$/), raisedBy: HS }).strict()).min(1),
  lookProvenance: HS,
  homeRegion: HS,
  openers: z.record(z.string(), z.array(HS).min(1)),
  counters: z.record(z.string(), HS),
  counterAt: z.number().int().min(1),
  personalities: z.array(z.object({ id: PersonalitySchema, word: HS, steps: z.array(z.number().int().min(1).max(3)).min(1), afterLoss: z.number().int().min(0), how: HS }).strict()).length(PERSONALITIES.length),
  loud: z.object({ scout: z.number().int().min(0).max(3), persuade: z.number().int().min(0).max(3), pay: z.number().int().min(0).max(3), payUnder: z.number().int().min(0).max(3), outplay: z.number().int().min(0).max(3), lean: z.number().int().min(0).max(3), take: z.number().int().min(0).max(3), expose: z.number().int().min(0).max(3) }).strict(),
  reasons: z.array(z.object({ n: z.number().int().min(1).max(16), team: HS, says: HS, kind: z.enum(REASON_KINDS), trigger: HS, status: EvilStatusSchema, waits: HS }).strict()).length(16),
  kinds: z.object({ stop: HS, ask: HS, find: HS }).strict(),
  tiers: z.array(z.object({ min: z.number().int().min(0), level: z.number().int(), ace: z.number().int().min(0), party: z.number().int().min(1).max(6) }).strict()).min(1),
  levels: z.object({ kit: z.number().int(), local: z.number().int(), wild: z.number().int(), alpha: z.number().int() }).strict(),
  marks: z.object({ grunt: z.number().int().min(1), lostToGrunt: z.number().int().min(1), max: z.number().int().min(1), words: z.array(z.tuple([z.number().int().min(1), HS])).min(1) }).strict(),
  /** Trainer classes the battle draws (trainers.json ids; a save checks them). */
  classes: z.object({ hero: HS, local: HS, wild: HS, alpha: HS }).strict(),
  fights: z.object({ locals: z.record(z.string(), z.array(HS).min(1).max(6)), wild: z.array(HS).min(1), alpha: z.array(HS).min(1) }).strict(),
  lines: z.record(z.string(), z.union([HS, z.record(z.string(), HS)])),
  file: z.object({ tabs: z.array(HS).length(3), unknown: HS, blank: HS, temper: HS, fires: HS, letters: HS, others: HS, seenNone: HS, saidNone: HS }).strict(),
});

/** The Hero in the block (design Part 30 section 3.8, slice 5's part). The party isn't here: it's the rival record's (`rivalId`). */
const HeroBaseSchema = z.object({
  rivalId: z.string().min(1),
  name: z.string().min(1),
  look: z.string().min(1),
  raisedBy: z.string().min(1),
  personality: PersonalitySchema,
  /** The home street: the Town's street of the district they set out from (holding ids). */
  home: z.object({ region: z.number().int().min(0), district: z.number().int().min(0), street: z.string().min(1), holdings: z.array(z.string().min(1)) }).strict(),
  /** The starter's region (for the File's line). */
  starterRegion: z.string().min(1),
  /** Their step on the district's road. */
  at: z.number().int().min(1).max(20),
  /** The last day they walked, and a day they sit out (after a loss). */
  walked: z.number().int().min(0),
  restOn: z.number().int().min(0),
  marks: z.number().int().min(0),
  battlesWithTeam: z.number().int().min(0),
  lostDays: z.number().int().min(0),
  badges: z.array(z.object({ region: z.number().int().min(0), district: z.number().int().min(0), how: z.enum(['full', 'half']), day: z.number().int().min(1) }).strict()),
  /** Species ids a Grunt has seen them field (the File's slots fill from these). */
  seen: z.array(z.string().min(1)),
  /** The File's lines: what they've seen, and what they've said about the team. Newest last. */
  learned: z.array(z.string().min(1)),
  said: z.array(z.string().min(1)),
  /** The last Hero beat's road, shown at the next Morning. */
  today: z.array(z.string().min(1)),
  /** Their personality has been seen in a line (the File shows the word from then). */
  met: z.boolean(),
}).strict();

/** A battle the day's waiting on (design Part 30 section 6.2 `battleResult`): Outplay in person, or a person posted against the Hero. */
export const FightSchema = z.object({
  /** Slice 13: 'chair' is the Boss against the neighbour's Boss for the Chair; 'legend' the catchable Legend after a Betrayal. */
  /** Slice 8: 'gym' is the Boss's Beat; 'challenge' an Officer's Replace challenge (their kit fights, the Boss's party waits in the box). */
  /** Slice 14: 'heist' is a room's battle inside a heist (a watchman, a dog, the other crew). */
  kind: z.enum(['outplay', 'hold', 'gym', 'challenge', 'chair', 'legend', 'heist', 'walk', 'raid', 'room', 'practice', 'ending']),
  holdingId: z.string().min(1),
  /** Hold: who's standing there. */
  personId: z.string().min(1).optional(),
  /** Uids of the Boss's party, put in the box while a posted person's kit fights (put back when it ends). */
  lent: z.array(z.string().min(1)).optional(),
  /** Set once the battle has been started (a reload mid-battle reopens it as the game already does). */
  begun: z.boolean(),
}).strict();
export type Fight = z.infer<typeof FightSchema>;
export const PostSchema = z.object({ holdingId: z.string().min(1), id: z.string().min(1) }).strict();

export const RateSchema = z.enum(['halved', 'waived']);


// ---- Slice 7: the Night (design Part 24a section 1, Part 24c section 7, Part 25a section 4, Part 30 section 3.10) ----

/** Tonight's knock, drawn on the way into the Night. `who` is a crew id, or null for someone from outside (or nobody). */
export const KnockSchema = z.object({ n: z.number().int().min(1), who: z.string().min(1).nullable(), day: z.number().int().min(1), rule: z.number().int().min(1).max(11) }).strict();
export type Knock = z.infer<typeof KnockSchema>;

export const NightStateSchema = z.object({
  /** Knocks done this run (answered, or shut out twice). No knock twice. */
  had: z.array(z.number().int().min(1)),
  /** "(Not tonight.)" per knock: once returns it to the deck, twice and it's gone. */
  shut: z.record(z.string(), z.number().int().min(0)),
  /** Knocks slept through. On no screen (Part 24a section 1.5). */
  sleptThrough: z.number().int().min(0),
  /** Tonight's knock, waiting at the door; null once answered or when nobody came. */
  knock: KnockSchema.nullable(),
  /** Who knocked last, and on which day (nobody twice running). */
  last: z.object({ who: z.string().min(1), day: z.number().int().min(1) }).strict().nullable(),
  /** The day the Night's one action was taken (one a Night). */
  actedOn: z.number().int().min(0),
  /** Every answer (not a "(Not tonight.)": `shut` and `sleptThrough` count those), kept: the keyed store doors, the walk out and the courtroom read. */
  echoes: z.array(z.object({ n: z.number().int().min(1), who: z.string().nullable(), answer: z.number().int().min(0).max(3), day: z.number().int().min(1) }).strict()),
  /** Things said that come back (night.json `flags`). */
  flags: z.array(z.string().min(1)),
  /** People who won't knock again this region (by region index). */
  hushed: z.record(z.string(), z.number().int().min(0)),
  /** The Wall: what went up, when, and when (if ever) it came down. A thing taken down leaves its gap. */
  wall: z.array(z.object({ item: z.string().min(1), day: z.number().int().min(1), down: z.number().int().min(1).nullable() }).strict()),
  /** ☼ knocks taken out of the deck at Corruption 2 or more, one a district ("region:district:n"). */
  removed: z.array(z.string().min(1)),
  /** Passed over for promotion (rule 6 sends them the next Night). */
  passed: z.array(z.object({ id: z.string().min(1), day: z.number().int().min(1) }).strict()),
  /** The last Night drawn ("region:district:day"): the draw is taken once a Night, and one key keeps the save small. */
  drawn: z.string().nullable(),
  /** The day the door was last answered or shut (0: never), so the Office says it's done for tonight. */
  doorOn: z.number().int().min(0),
}).strict();
export type NightState = z.infer<typeof NightStateSchema>;
export const emptyNight = (): NightState => ({ had: [], shut: {}, sleptThrough: 0, knock: null, last: null, actedOn: 0, echoes: [], flags: [], hushed: {}, wall: [], removed: [], passed: [], drawn: null, doorOn: 0 });

const NT = z.string().min(1);
export const EchoSchema = z.discriminatedUnion('t', [
  z.object({ t: z.literal('mood'), by: z.union([z.literal(1), z.literal(-1)]) }).strict(),
  z.object({ t: z.literal('loyalty'), by: z.union([z.literal(1), z.literal(-1)]) }).strict(),
  z.object({ t: z.literal('team'), stat: z.enum(['regard', 'dread', 'heat']), by: z.union([z.literal(1), z.literal(-1)]) }).strict(),
  z.object({ t: z.literal('regardOrDread') }).strict(),
  z.object({ t: z.literal('localMood'), by: z.literal(-1) }).strict(),
  z.object({ t: z.literal('wall'), item: NT }).strict(),
  z.object({ t: z.literal('flag'), id: NT }).strict(),
  z.object({ t: z.literal('hush') }).strict(),
  z.object({ t: z.literal('leave'), how: z.enum(['handshake', 'coat']) }).strict(),
]);
export type Echo = z.infer<typeof EchoSchema>;
export const WhoSpecSchema = z.object({
  first: z.boolean().optional(), oldest: z.boolean().optional(), talent: TalentSchema.optional(), flaw: FlawSchema.optional(), rank: RankSchema.optional(),
  minLoyalty: z.number().int().min(0).max(10).optional(), maxLoyalty: z.number().int().min(0).max(10).optional(), maxAge: z.number().int().min(1).optional(), minor: z.boolean().optional(),
  outside: NT.optional(), nobody: z.boolean().optional(),
}).strict();
export type WhoSpec = z.infer<typeof WhoSpecSchema>;
export const KnockDefSchema = z.object({
  n: z.number().int().min(1), title: NT, sun: z.boolean(), who: WhoSpecSchema, needs: z.array(NT), shut: z.boolean(), report: z.boolean(), status: EvilStatusSchema, says: NT,
  answers: z.array(z.object({ say: NT, reply: NT, needs: z.array(NT).optional(), echo: z.array(EchoSchema) }).strict()).length(3),
}).strict();
export type KnockDef = z.infer<typeof KnockDefSchema>;
export const WALL_KINDS = ['desk', 'thanks', 'threat', 'other'] as const;
export const NightFileSchema = z.object({
  note: z.string(),
  rules: z.object({ firstNight: z.array(z.number().int().min(1)).min(1), quietWeight: z.number().int().min(1), sunday: z.number().int().min(1), corruptionSun: z.number().int().min(1), shutReturns: z.number().int().min(0), loyaltyBirthday: z.number().int().min(0) }).strict(),
  needs: z.array(z.object({ id: NT, live: z.boolean(), says: NT, waits: NT.optional() }).strict()).min(1),
  flags: z.array(z.object({ id: NT, shown: NT, readBy: NT }).strict()).min(1),
  wall: z.array(z.object({ id: NT, what: NT, kind: z.enum(WALL_KINDS), from: NT }).strict()).min(1),
  text: z.record(z.string(), NT),
  wallStates: z.object({ kept: NT, kind: NT, edited: NT, bare: NT }).strict(),
  hear: z.object({ warmExtra: z.record(TalentSchema, NT), byTalent: z.record(TalentSchema, NT), byPerson: z.record(z.string(), NT) }).strict(),
  knocks: z.array(KnockDefSchema).length(40),
});

// ---- Slice 8: the Gym (design Part 8a, Part 8b, Part 30 section 3.4) ----

export const GYM_WAYS = ['beat', 'buy', 'bend', 'replace', 'befriend'] as const;
export const GymWaySchema = z.enum(GYM_WAYS);
export type GymWay = z.infer<typeof GymWaySchema>;
export const STANDINGS = ['warm', 'easy', 'wary', 'sullen', 'shut', 'gone'] as const;
export const StandingSchema = z.enum(STANDINGS);
export type Standing = z.infer<typeof StandingSchema>;

/** One Leader's state (Part 30 section 3.4, Part 8a section 14). */
export const GymStateSchema = z.object({
  leaderId: z.string().min(1),
  region: z.number().int().min(0),
  district: z.number().int().min(0),
  /** The way carried through and still holding, or null (undealt). */
  way: GymWaySchema.nullable(),
  /** The Leader's standing with the team, as a word, and the last thing that moved it. */
  standing: StandingSchema,
  moved: z.string().min(1),
  /** Ways shut for this district by what happened (a lost challenge; a second insult). */
  closed: z.array(GymWaySchema),
  /** Beats the Boss has lost here (the Leader leads differently next time). */
  tried: z.number().int().min(0),
  /** Steps of the Bend done. */
  bend: z.number().int().min(0),
  /** Replace: the Officer in the chair. */
  officer: z.string().min(1).nullable(),
  /** A Befriended Leader's warnings (a Lean on the Town's street). */
  insults: z.number().int().min(0),
  foundOut: z.boolean(),
  /** The day the way was done and its Heat, for the Evening's loudest. */
  loud: z.object({ day: z.number().int().min(1), heat: z.number().int() }).strict().nullable(),
  /** The Hero at this Gym: tries so far, and how many a Bent Leader makes them take (drawn once from `evil-gym`). */
  heroTries: z.number().int().min(0),
  heroNeeds: z.number().int().min(1).nullable(),
}).strict();
export type GymState = z.infer<typeof GymStateSchema>;

const GS = z.string().min(1);
const GymCardSchema = z.object({ needs: GS, costs: GS, moves: GS, after: GS, hero: GS, badge: GS, lose: z.string() }).strict();
export const LeaderDefSchema = z.object({
  id: GS, boss: GS, name: GS, town: GS,
  region: z.number().int().min(0), n: z.number().int().min(0),
  /** first: the Arrival's (untouchable); eighth: the Hero's road in (untouchable); heir: takes a Gym over (Janine). */
  role: z.enum(['first', 'district', 'eighth', 'heir']),
  them: GS, they: GS, their: GS,
  minor: z.boolean(), age: z.number().int().min(1).optional(),
  type: GS, heir: GS.optional(),
  says: GS,
  rule: z.object({ kind: z.enum(['field', 'weather', 'format', 'order', 'count', 'items', 'clock', 'gauntlet', 'room', 'condition', 'test']), text: GS, status: EvilStatusSchema, waits: z.string() }).strict().nullable(),
  buy: z.object({ price: z.number().int().min(0).nullable(), why: GS, other: GS.optional() }).strict().nullable(),
  bend: z.object({ kind: z.enum(['wrong', 'chance', 'found', 'protected', 'admitted', 'debt']), text: GS, steps: z.array(GS).min(1).max(4), scene: z.array(GS).min(1) }).strict().nullable(),
  respects: z.array(GS),
  respectsNote: GS.optional(),
  replace: z.object({ can: z.boolean(), goes: GS }).strict().nullable(),
  beaten: GS.nullable(),
  toHero: z.partialRecord(GymWaySchema, GS),
  gate: GS.nullable(),
  walksIn: GS.nullable(),
}).strict();
export type LeaderDef = z.infer<typeof LeaderDefSchema>;
const N = z.number().int();
export const GymFileSchema = z.object({
  note: z.string(),
  /** The slice's undo: false and the Gym's a holding like any other. */
  on: z.boolean(),
  ways: z.array(GymWaySchema).length(GYM_WAYS.length),
  names: z.record(GymWaySchema, GS),
  words: z.record(GymWaySchema, GS),
  numbers: z.object({
    beat: z.object({ offset: N, heat: N, dread: N, townColder: N.min(0).max(100), heroOffset: N }).strict(),
    buy: z.object({ heat: N, foundOut: N.min(1), dread: N }).strict(),
    bend: z.object({ regard: N, loyalty: N, seat: N.min(1), seatOf: N.min(1) }).strict(),
    replace: z.object({ offset: N, heat: N, regard: N, officerLoyalty: N, loseLoyalty: N }).strict(),
    befriend: z.object({ regard: N, needRegard: N.min(0).max(10), lostRegard: N }).strict(),
    price: z.object({ first: N.min(0), perDistrict: N.min(0), perRegion: N.min(0) }).strict(),
    heroTries: z.object({ bend: z.tuple([N.min(1), N.min(1)]) }).strict(),
  }).strict(),
  card: z.record(GymWaySchema, GymCardSchema),
  shut: z.object({ line: GS, leader: GS, region: GS, arrival: GS, hero: GS, number: GS, scout: GS, age: GS, officer: GS, build: GS, done: GS, gone: GS, tried: GS }).strict(),
  lines: z.record(z.string(), z.union([GS, z.record(z.string(), GS)])),
  standing: z.object({ start: StandingSchema, words: z.record(StandingSchema, GS), startMoved: GS }).strict(),
  file: z.record(GymWaySchema, GS),
  befriend: z.object({ leader: z.array(GS).length(3), boss: z.record(z.string(), z.array(GS).length(2)) }).strict(),
  leaders: z.array(LeaderDefSchema).min(8),
});

// ---- Slice 9: a region (design Part 2 sections 2, 4 and 5; Part 26a; Part 30 section 3.4) ----

/** A district the team has left this region: it still pays (Part 2 section 4.1). */
export const PastDistrictSchema = z.object({
  district: DistrictSchema,
  /** The Officer left to hold it (Part 2 section 5.1), or null: then it pays half and drifts. */
  leftWith: z.string().min(1).nullable(),
}).strict();
export type PastDistrict = z.infer<typeof PastDistrictSchema>;

const Int0 = z.number().int().min(0);
/** Slice 16: the Crossing (design Part 2 section 9; Part 26a section 1.1). One step at a time: the two tickets, who comes, the base, the quay, the boats. */
export const CrossingSchema = z.object({
  step: z.enum(['tickets', 'who', 'base', 'forms', 'boats']),
  /** The two regions the seed offers (ids), and the one picked. */
  offer: z.array(z.string().min(1)).min(1).max(2),
  pick: z.string().min(1).nullable(),
  /** Who stays (a third of the Roster, by name), and the one asked to come anyway ("We need you."). */
  staying: z.array(z.string().min(1)),
  asked: z.string().min(1).nullable(),
  base: z.enum(['hand', 'sell', 'leave', 'burn', 'none']).nullable(),
  /** The officer left in the old base (Leave an officer in it). */
  baseOfficer: z.string().min(1).nullable(),
  forms: z.boolean().nullable(),
  /** Where the Hero lands: ahead, beside or behind (Part 2 section 9.5). */
  boats: z.enum(['ahead', 'beside', 'behind']),
  lines: z.array(z.string()),
}).strict();
export type CrossingState = z.infer<typeof CrossingSchema>;
/** Slice 16 (Hoenn's second clock, Part 26a sections 1.7 and 4.6): days left, and how it was stopped (or 'met' at nought). */
export const ClockSchema = z.object({
  left: z.number().int().min(0).max(3),
  day: z.number().int().min(1),
  stopped: z.enum(['letters', 'before', 'boss', 'hero', 'together', 'met']).nullable(),
}).strict();
export type ClockState = z.infer<typeof ClockSchema>;

/**
 * Slice 20 (Part 26c; Part 15b sections 3 to 6). Galar's loan (owed, taken on day, the clause's state); the handshake
 * waiting after a televised Beat; Aether's word (Against, Apart, Beside); the girl with the bag; the Star bases visited;
 * each island guardian's visit (once an island).
 */
export const L3Schema = z.object({
  loan: z.object({ owed: Int0, day: z.number().int().min(1), asked: z.boolean(), vested: z.boolean(), repaid: z.boolean() }).strict().nullable(),
  offered: z.enum(['open', 'taken', 'declined']).nullable(),
  shake: z.number().int().min(1).nullable(),
  aether: z.enum(['against', 'apart', 'beside']).nullable(),
  bag: z.enum(['nothing', 'bridge', 'told']).nullable(),
  bagAsk: z.boolean(),
  visited: z.array(z.string().min(1)),
  guardian: z.array(z.number().int().min(0)),
}).strict();
export type L3State = z.infer<typeof L3Schema>;

export const RegionStateSchema = z.object({
  /** The region's id in region.json (Kanto). */
  id: z.string().min(1),
  /** A day being played; the tally after a district; the Road between two; the region's over (the Crossing waits for slice 16). */
  phase: z.enum(['day', 'tally', 'road', 'over']),
  past: z.array(PastDistrictSchema),
  /** The numbers when this district began, for the tally's changes. */
  mark: z.object({ funds: Int0, heat: Int0, loyalty: Int0, regard: Int0, dread: Int0, log: Int0, crew: z.array(z.string()), day: z.number().int().min(1) }).strict(),
  /** Each district's tally, kept: its title and its lines. */
  tallies: z.array(z.object({ n: Int0, title: z.string().min(1), rows: z.array(z.tuple([z.string(), z.string()])), said: z.string() }).strict()),
  /** The day of the Arrival the Hero takes Badge 1 (3 or 4), drawn once from the seed. */
  badgeDay: z.number().int().min(1),
  /** The Hero's friend has walked back through a district nobody held (once a region). */
  doubledBack: z.boolean(),
  /** Lines for the next Morning: a letter from someone away, a double-back, what was heard on the Road. */
  notes: z.array(z.string().min(1)),
  /** Slice 16: the regions crossed from, in order (region ids). Its length is the run's region number less one (R − 1). */
  crossed: z.array(z.string().min(1)),
  /** Slice 16: the Crossing under way (after the Reckoning's tally, when this isn't the last region), or null. */
  crossing: CrossingSchema.nullable(),
  /** Slice 16: what the garrisons and an Officer left in the old base pay each Evening, across the water, at half. */
  abroad: Int0,
  /** Slice 16: the answer at the quay (take this region's forms, or not); null before it's asked. */
  forms: z.boolean().nullable(),
  /** Slice 16 (Hoenn): the letters carried between the two Bosses (three stop tick 3), and the second clock at the Reckoning. */
  letters: Int0,
  clock: ClockSchema.nullable(),
  /** Slice 20: Alola, Galar and Paldea's own state (lastThree.ts). Absent until one of them is played. */
  l3: L3Schema.optional(),
}).strict();
export type RegionState = z.infer<typeof RegionStateSchema>;

// ---- Slice 11: the economy (design Part 12 sections 1 and 2, Part 13 sections 1 and 2, Part 5 sections 2.2 to 2.4) ----

export const ECON_KINDS = ['racket', 'front', 'work'] as const;
export const EconKindSchema = z.enum(ECON_KINDS);
export type EconKind = z.infer<typeof EconKindSchema>;
const ES = z.string().min(1);
const EconTextSchema = z.object({ takes: ES, from: ES, gives: ES, moves: ES, holds: ES, hero: ES, written: ES, other: ES }).strict();
export const EconCardDefSchema = z.object({
  id: ES, kind: EconKindSchema, name: ES,
  /** Districts (n) the Card is offered in; empty: every district after the Arrival. */
  where: z.array(z.number().int().min(0)),
  minLine: LineIdSchema, creeds: z.array(ES).optional(),
  cost: z.number().int().min(0), daily: z.number().int(), days: z.number().int().min(0), needs: TalentSchema.nullable(),
  /** Tags the Roster's lines read (people.json lines): whoever's line it crosses won't go. */
  tags: z.array(ES),
  /** The somebody field 3 names (Part 31: every Card names somebody). */
  names: ES,
  moves: z.object({ heat: z.number().int(), dread: z.number().int(), regard: z.number().int(), loyalty: z.number().int() }).strict(),
  backRoom: z.boolean().optional(), running: z.boolean().optional(),
  /** What moves every seventh day it runs (Part 12 section 2.3: "Regard −1 a week"). */
  weekly: z.object({ dread: z.number().int().optional(), regard: z.number().int().optional() }).strict().optional(),
  text: EconTextSchema,
  honest: z.object({ name: ES, cost: z.number().int().min(0), daily: z.number().int().min(0), says: ES, written: ES }).strict().optional(),
  status: EvilStatusSchema,
}).strict();
export type EconCardDef = z.infer<typeof EconCardDefSchema>;
const EI = z.number().int();
export const EconomyFileSchema = z.object({
  note: z.string(),
  /** The slice's undo: false and holdings pay flat takings, no Card is offered, and a short Evening works as before. */
  on: z.boolean(),
  rules: z.object({
    racket: z.object({ patience: z.object({ easy: EI.min(1), wary: EI.min(1), sullen: EI.min(1) }).strict(), warnAt: EI.min(0), books: EI.min(0), profit: EI.min(0), startHeat: EI, startDread: EI, shutHeat: EI, waive: EI.min(0), leanOnStreet: EI, heroNear: EI, heroSteps: EI.min(0), dreadFreeze: EI.min(0).max(10), breakOneIn: EI.min(1), endEarlyLeft: EI.min(0), honestOff: EI.min(0).max(100), powerPatience: EI.min(0), wonderLoyalty: EI }).strict(),
    front: z.object({ runWellLoyalty: EI.min(0).max(10), regardEach: EI.min(0), regardMost: EI.min(0), straightNeeds: EI.min(1) }).strict(),
    work: z.object({ firstHeat: EI, loyalty: EI, kindFlaws: z.array(FlawSchema), kindTalents: z.array(TalentSchema), given: EI.min(0), feedWeek: EI.min(1) }).strict(),
    bankrupt: z.object({ lowestFirst: EI, everyone: EI, lastJobFrom: EI.min(1), sellFrom: EI.min(1), whipFrom: EI.min(1), whipRegard: EI.min(0).max(10), whipLoyalty: EI, sellBack: EI.min(0).max(100) }).strict(),
  }).strict(),
  words: z.record(z.string(), z.union([ES, z.array(ES)])),
  written: z.record(z.string(), ES),
  cards: z.array(EconCardDefSchema).min(1),
  bust: z.object({
    lastJob: z.object({ name: ES, gives: EI.min(0), heat: EI, dread: EI, taken: EI.min(0), minLine: LineIdSchema, tags: z.array(ES), names: ES, text: EconTextSchema }).strict(),
    sell: z.object({ name: ES, text: EconTextSchema }).strict(),
    whip: z.object({ name: ES, names: ES, text: EconTextSchema }).strict(),
  }).strict(),
});

/** Something the team runs: a racket on a street, a Front in a holding, or a Work being built or running (design Part 30 section 3). */
export const VentureSchema = z.object({
  id: z.string().min(1),
  cardId: z.string().min(1),
  kind: EconKindSchema,
  region: z.number().int().min(0),
  district: z.number().int().min(0),
  /** A racket's street (index); null for a Front or a Work. */
  street: z.number().int().min(0).nullable(),
  /** A Front's holding. */
  holdingId: z.string().min(1).nullable(),
  /** Who runs a Front (they do nothing else). */
  person: z.string().min(1).nullable(),
  since: z.number().int().min(1),
  /** A racket's days till the street's had enough; null when it doesn't run down (made honest, or the Tithe). */
  patience: z.number().int().min(0).nullable(),
  waivedOn: z.number().int().min(0).nullable(),
  /** A racket made honest: it pays its honest figure and never turns. */
  honest: z.boolean(),
  /** A Books led the racket's squad: takings +25% (Part 12 section 2.1). */
  books: z.boolean(),
  /** A Front's back room: open, shut, or null (the Day-Care has none). */
  backRoom: z.boolean().nullable(),
  /** Districts ("region:n") a Front's back room was open in at any time. */
  openIn: z.array(z.string()),
  /** Districts ("region:n") a Front was in profit with the back room shut throughout (Going Straight, Part 13 section 1.3). */
  straight: z.array(z.string()),
  /** A Work: the day its last building day ends (Evening), and whether it's done. */
  doneOn: z.number().int().min(0).nullable(),
  done: z.boolean(),
}).strict();
export type Venture = z.infer<typeof VentureSchema>;

/** A confirmed trade Card, kept with its day (like a job's Card). */
export const EconCardSchema = z.object({ id: z.string().min(1), day: z.number().int().min(1), cardId: z.string().min(1), fields: z.array(StoredFieldSchema).length(13) }).strict();

export const EconomyStateSchema = z.object({
  running: z.array(VentureSchema),
  /** Who's out on trade today (a squad's day). */
  busy: z.object({ day: z.number().int().min(0), ids: z.array(z.string()) }).strict(),
  /** Heat a racket's start puts toward today's loudest. */
  loud: z.object({ day: z.number().int().min(0), heat: z.number().int() }).strict().nullable(),
  /** Evenings in a row that ended short (bankrupt: 1 Short, 2 Broke, 3+ Bust). */
  broke: z.number().int().min(0),
  /** One Last Job's been done in this bankruptcy; the regions the Whip-Round's been held in. */
  lastJob: z.boolean(),
  whip: z.array(z.number().int().min(0)),
  /** Districts ("region:n") a Work's been finished in (the first one's Heat −2). */
  worksIn: z.array(z.string()),
  cards: z.array(EconCardSchema),
}).strict();
export type EconomyState = z.infer<typeof EconomyStateSchema>;
export const emptyEconomy = (): EconomyState => ({ running: [], busy: { day: 0, ids: [] }, loud: null, broke: 0, lastJob: false, whip: [], worksIn: [], cards: [] });
// ---- Slice 13: a neighbour (design Part 15a sections 1 to 7; Part 30 section 3.9) ----

/** Slice 20: 'service' is Star's own (Part 15b section 5.4): the Front that runs backwards. Last, so no older stance moves. */
export const STANCES = ['war', 'rivals', 'wary', 'truce', 'front', 'merger', 'understanding', 'service'] as const;
export const StanceSchema = z.enum(STANCES);
export type Stance = z.infer<typeof StanceSchema>;
const NI = z.number().int();
const NS = z.string().min(1);
export const TABLE_THINGS = ['line', 'person', 'job', 'money', 'fact', 'promise', 'pen'] as const;
export const TableThingSchema = z.enum(TABLE_THINGS);
export type TableThing = z.infer<typeof TableThingSchema>;
/** A message in the neighbour's own format (a card signed "— G."), with the answers it takes, if any. */
export const NeighbourPostSchema = z.object({ id: NS, day: NI.min(1), text: NS, choices: z.array(NS), answer: NI.min(0).nullable(), kind: z.enum(['basket', 'note', 'ask', 'pen', 'vault']) }).strict();
export type NeighbourPost = z.infer<typeof NeighbourPostSchema>;
export const NeighbourStateSchema = z.object({
  /** The neighbour's id in neighbour.json, and the region it's in. */
  id: NS, region: NI.min(0),
  stance: StanceSchema,
  /** Merger only: 'team' (the Chair won: Rocket's the team's) or 'theirs' (the Chair lost: the team works for them). */
  whose: z.enum(['team', 'theirs']).nullable(),
  /** Who broke the last thing agreed, if anyone. */
  broke: z.enum(['player', 'them']).nullable(),
  /** -3..3: the Boss's view of the player, as a word. */
  opinion: NI.min(-3).max(3),
  dread: NI.min(0).max(10),
  pen: NI.min(0),
  /** The five ticks: each waits, fires (on its day) or is stopped; `late` is days added (a stopped tick before it, a war won). */
  ticks: z.array(z.object({ n: NI.min(1).max(5), state: z.enum(['waiting', 'fired', 'stopped']), day: NI.min(1).nullable(), late: NI.min(0) }).strict()).length(5),
  /** A war the team's winning has slowed the clock (once a region). */
  slowed: z.boolean(),
  /** The district ("region:stage") a war job last ran in: a quiet district moves the ladder back. */
  warIn: z.string().nullable(),
  sitDowns: z.array(z.object({ n: NI.min(1), stage: NI.min(1), day: NI.min(1), caller: z.enum(['player', 'them']), chair: z.string().nullable(), said: z.array(z.string()), table: z.array(TableThingSchema) }).strict()),
  /** A Sit-Down going on: which exchange (0 what they know, 1 the offer, 2 what they ask, 3 the table), its answers so far. */
  sitting: z.object({ n: NI.min(1), caller: z.enum(['player', 'them']), ex: NI.min(0).max(3), chair: z.string().nullable(), offered: z.boolean(), son: z.boolean(), said: z.array(z.string()), table: z.array(TableThingSchema), lines: z.array(z.string()) }).strict().nullable(),
  /** His call: the day his Sit-Down is for (the day after tick 2). */
  invited: NI.min(1).nullable(),
  /** The answer to "why are you doing this", word for word (read to the Hero after he loses). */
  kept: z.string().nullable(),
  posts: z.array(NeighbourPostSchema),
  /** The thing they ask, while a Front holds (or the order, while the team's under them). */
  asked: z.object({ n: NI.min(1), day: NI.min(1), stage: NI.min(1), done: z.enum(['did', 'no']).nullable() }).strict().nullable(),
  chair: z.object({ tries: NI.min(0), lostStage: NI.min(1).nullable() }).strict(),
  fallen: z.enum(['hero', 'team']).nullable(),
  fellDay: NI.min(1).nullable(),
  /** The Legend after a Betrayal: none yet; waiting (the team's to meet); a race (tonight only); met. */
  legend: z.enum(['none', 'waiting', 'race', 'fought', 'caught', 'kept', 'freed', 'hero']),
  legendDay: NI.min(1).nullable(),
  /** The caught Legend's uid in the party or box (so "Open the ball" knows which). */
  legendUid: z.string().nullable(),
  understanding: z.enum(['write', 'stop', 'none']).nullable(),
  /** A fallen team's Scheme, stamped four times not clean (slice 14 makes it playable). */
  scheme: z.object({ from: NS, name: NS, parts: z.array(z.object({ part: NS, clean: z.literal(false) }).strict()).length(4), other: NS, inherited: z.literal(true) }).strict().nullable(),
  /** Tick 4's cold day (the holdings warm back the next Morning). */
  cold: NI.min(1).nullable(),
}).strict();
export type NeighbourState = z.infer<typeof NeighbourStateSchema>;

const NeighbourDefSchema = z.object({
  id: NS, team: NS, region: NI.min(0), boss: NS,
  /** Slice 16: a region with two neighbours (Hoenn) picks one by where the base stands: by the shore, or inland (Part 26a section 4.1). */
  side: z.enum(['shore', 'inland']).optional(), teamName: NS, sign: NS, colour: z.string().regex(/^#[0-9a-f]{6}$/i), minors: z.boolean(),
  /** Slice 20 (Star): War, Rivals, Front and Merger never appear; the stance list is Wary, Truce, Service, Understanding (Part 15b section 5.1). */
  noWar: z.boolean().optional(),
  /** Slice 20 (Star): what's said at each base on a Visit, by district n (Part 15b sections 5.2 and 5.4). */
  visits: z.record(z.string(), z.object({ crew: NS, says: NS }).strict()).optional(),
  dread: NI.min(0).max(10), pen: NI.min(0), penAfter: NI.min(0),
  holds: z.record(z.string(), NI.min(0)), kinds: z.array(HoldingKindSchema).min(1), base: NI.min(1).max(6),
  ground: NS, refuses: NS, does: NS,
  ticks: z.array(z.object({ n: NI.min(1).max(5), stage: NI.min(1).max(8), day: NI.min(1), name: NS, text: NS, radio: NS }).strict()).length(5),
  basket: z.object({ stage: NI.min(1), day: NI.min(1), text: NS, choices: z.array(NS).length(4), said: z.array(NS).length(4), opinion: z.array(NI).length(4), war: NS, chair: NS }).strict(),
  rules: z.array(z.object({ n: NI, rule: NS, broken: z.string() }).strict()).length(4),
  sitDown: z.object({
    first: z.object({ opens: NS, mess: NS, warm: NS, you: NS, book: NS, choices: z.array(NS).length(4), voiceOnly: NI, answers: z.array(NS).length(4), offer: NS, frontCard: z.array(z.tuple([NS, NS])).min(1), frontChoices: z.array(NS).length(2), frontSaid: z.array(NS).length(2), ask: NS, dontKnow: NS, wrote: NS }).strict(),
    second: z.object({ opens: NS, stands: NS, kept: NS }).strict(),
    whys: z.record(z.string(), z.array(NS).length(2)),
    pen: z.object({ you: NS, laughs: NS, count: NS, goOn: NS, empty: NS, opens: NI.min(0) }).strict(),
    son: z.object({ you: NS, lines: z.array(NS).min(1), choices: z.array(NS).length(3), said: z.array(NS).length(3), stop: NS }).strict(),
    table: z.object({ line: NS, person: NS, minor: NS, job: NS, jobNo: NS, money: NS, fact: NS, promise: NS }).strict(),
    rise: NS, noTable: NS,
  }).strict(),
  asks: z.array(z.object({ n: NI, job: NS, from: NS, why: NS }).strict()).length(3),
  askSaid: z.object({ did: NS, no: NS }).strict(),
  chair: z.object({ says: NS, won: NS, lost: NS, again: NS, free: NS }).strict(),
  betrayal: z.object({ who: NS, grabs: NS, says: NS }).strict(),
  legend: NS,
  fall: z.object({
    boss: NS,
    admins: z.array(z.object({ id: NS, name: NS, joins: z.boolean(), never: z.boolean().optional(), talent: TalentSchema.optional(), flaw: FlawSchema.optional(), says: NS }).strict()).min(1),
    grunts: NI.min(0), gruntsSaid: NS, holdings: NS,
    pen: z.object({ clean: NS, choice: NS, choices: z.array(NS).length(2), said: z.array(NS).length(2) }).strict(),
    scheme: z.object({ name: NS, parts: z.array(NS).length(4), other: NS }).strict(),
    hero: NS,
  }).strict(),
  vault: z.object({ title: NS, card: z.array(z.tuple([NS, NS])).min(1), choices: z.array(NS).length(2), kept: NS, freed: NS }).strict(),
}).strict();
export type NeighbourDef = z.infer<typeof NeighbourDefSchema>;
export const NeighbourFileSchema = z.object({
  note: z.string(),
  /** The slice's undo: false and there's no neighbour (its holdings are nobody's). */
  on: z.boolean(),
  stances: z.array(z.object({ id: StanceSchema, word: NS, means: NS, board: NS }).strict()).length(STANCES.length),
  ladder: z.tuple([z.literal('war'), z.literal('rivals'), z.literal('wary'), z.literal('truce')]),
  allies: z.array(StanceSchema).min(1),
  opinion: z.object({ words: z.array(NS).length(7) }).strict(),
  neighbours: z.array(NeighbourDefSchema).min(1),
  numbers: z.object({ chairFromStage: NI.min(1), chairOffset: NI, legendOffset: NI, warSlow: NI.min(0), stopLate: NI.min(0), frontHeatFloor: NI.min(0), frontTenth: NI.min(0).max(100), frontEvery: NI.min(1), frontProud: NI, warHeat: NI.min(0), legendDread: NI, legendHeat: NI, legendHeatFloor: NI.min(0).max(10), freedRegard: NI, joinLoyalty: NI.min(0).max(10), basketEvery: NI.min(1), brokeOpinion: NI, maxTable: NI.min(1) }).strict(),
  lines: z.record(z.string(), NS),
}).strict();

// ---- Slice 14: the Scheme (design Part 22; Part 5 section 7; Part 12 section 3; Part 13 section 3; Part 30 section 3.6) ----

export const PARTS = ['means', 'place', 'key', 'moment'] as const;
export const PartIdSchema = z.enum(PARTS);
export type PartId = z.infer<typeof PartIdSchema>;
const SI = z.number().int();
const SS = z.string().min(1);
const WayTextSchema = z.object({ takes: SS, from: SS, gives: SS, hero: SS, written: SS }).strict();
export const SchemeWaySchema = z.object({
  id: SS, name: SS,
  /** job: days and money; heist: through a heist's plan and rooms; dig: a Dig; gyms: Gyms dealt with; wait: the Moment's own day; cause: the Moment, tomorrow; count: the Home's names. */
  how: z.enum(['job', 'heist', 'dig', 'gyms', 'wait', 'cause', 'count']),
  cost: SI.min(0).optional(), days: SI.min(1).optional(), heat: SI.optional(), dread: SI.optional(), regard: SI.optional(),
  heist: SS.optional(), dig: SS.optional(), inPerson: z.boolean().optional(),
  needs: z.object({ regard: SI.optional(), talents: z.array(TalentSchema).optional(), line: LineIdSchema.optional(), gymsClean: SI.optional(), gymsAny: SI.optional(), squads: SI.optional(), proof: SI.optional(), warm: SI.optional() }).strict().optional(),
  tags: z.array(SS).optional(),
  text: WayTextSchema,
  status: EvilStatusSchema.optional(),
}).strict();
export type SchemeWay = z.infer<typeof SchemeWaySchema>;
const SchemePartDefSchema = z.object({ what: SS, clean: SchemeWaySchema, dirty: SchemeWaySchema.optional(), second: SchemeWaySchema.optional(), ledger: z.boolean().optional() }).strict();
export const SchemeFamilySchema = z.object({
  id: SS, name: SS, says: SS,
  pieces: z.object({ means: SS, place: SS, key: SS, moment: SS }).strict(),
  faint: SS,
  sentences: z.array(z.object({ at: SI.min(0).max(100), text: SS }).strict()).min(1),
  legends: z.array(SS).optional(),
  ground: z.object({ text: SS, sources: z.array(z.object({ kind: z.enum(['honest', 'straight', 'persuade', 'gym', 'dig', 'work', 'truth']), pct: SI.min(0) }).strict()).min(1) }).strict(),
  parts: z.object({ means: SchemePartDefSchema, place: SchemePartDefSchema, key: SchemePartDefSchema, moment: SchemePartDefSchema }).strict(),
  status: EvilStatusSchema,
}).strict();
export type SchemeFamily = z.infer<typeof SchemeFamilySchema>;
const LedgerWaySchema = z.object({ name: SS, text: SS, cost: SI.min(0).optional(), days: SI.min(1).optional(), dread: SI.optional(), heat: SI.optional(), regard: SI.optional(), funds: SI.min(0).optional(), war: SI.optional(), heist: SS.optional(), needs: z.object({ sitDown: SI.optional(), truce: SI.optional(), line: LineIdSchema.optional() }).strict().optional() }).strict();
export type LedgerWay = z.infer<typeof LedgerWaySchema>;
const HeistDefSchema = z.object({
  id: SS, name: SS, where: z.array(SI.min(0)), creeds: z.array(SS).optional(), neighbour: z.boolean().optional(),
  takes: SS, from: SS, gives: SI.min(0), ground: SI.min(0).optional(), heat: SI.min(0), heatDown: SI.min(0).optional(), regard: SI.optional(),
  war: z.boolean().optional(), notices: z.boolean().optional(), headline: z.string(), beside: SS, other: SS, tags: z.array(SS), status: EvilStatusSchema,
}).strict();
export type HeistDef = z.infer<typeof HeistDefSchema>;
const PlanWaySchema = z.object({ id: SS, name: SS, talent: TalentSchema.optional(), cost: SI.min(0).optional(), odds: SI.min(0).max(100), heat: SI.optional(), outBy: SI.optional(), bribe: z.boolean().optional(), safehouse: z.boolean().optional() }).strict();
export type PlanWay = z.infer<typeof PlanWaySchema>;
export const ROOM_IDS = ['guard', 'dog', 'lock', 'floor', 'clerk', 'crew'] as const;
const DigDefSchema = z.object({
  id: SS, name: SS, on: z.array(SS).min(1), creeds: z.array(SS).optional(), ground: SI.min(0).optional(), funds: SI.min(0).optional(),
  part: PartIdSchema.optional(), truth: z.boolean().optional(), confirm: z.boolean().optional(), shrine: z.boolean().optional(), fills: SS.optional(), found: SS, tags: z.array(SS), status: EvilStatusSchema,
}).strict();
export type DigDef = z.infer<typeof DigDefSchema>;
export const SchemeFileSchema = z.object({
  note: z.string(),
  /** The slice's undo: false and the Scheme screen's hidden, nothing's stamped. */
  on: z.boolean(),
  rules: z.object({
    part: SI.min(1), groundCap: SI.min(0), readyAt: SI.min(0).max(100), heroBadge: SI, reckoningLost: SI,
    pace: z.object({ one: z.object({ means: SI.min(1), place: SI.min(1), key: SI.min(1), moment: SI.min(1) }).strict(), three: z.record(PartIdSchema, z.tuple([SI.min(0), SI.min(1)])) }).strict(),
    momentDay: SI.min(1), noticeFrom: SI.min(0), homeNeed: SI.min(1),
    homeWeights: z.object({ warm: SI.min(0), handshake: SI.min(0), work: SI.min(0), feedDay: SI.min(0), fed: SI.min(0) }).strict(),
    giveBackDays: SI.min(0), heistHeatBy: SI.min(0), crewPay: SI.min(0), insideCost: SI.min(0), waitOdds: SI.min(0).max(100),
  }).strict(),
  words: z.record(z.string(), SS),
  families: z.array(SchemeFamilySchema).min(1),
  ledger: z.object({
    id: SS, region: SI.min(0), from: SI.min(1), name: SS, says: SS, supplies: z.record(z.string(), PartIdSchema),
    steps: z.array(z.object({ n: SI.min(1), name: SS, clean: LedgerWaySchema, dirty: LedgerWaySchema }).strict()).length(4),
    status: EvilStatusSchema,
  }).strict(),
  heists: z.object({
    plan: z.object({ in: z.array(PlanWaySchema).min(1), out: z.array(PlanWaySchema).min(1), empty: z.object({ in: SS, out: SS }).strict() }).strict(),
    rooms: z.array(z.object({ id: z.enum(ROOM_IDS), name: SS, text: SS }).strict()).length(ROOM_IDS.length),
    thing: z.object({ name: SS, text: SS }).strict(),
    foes: z.object({ guard: z.array(SS).min(1), dog: z.array(SS).min(1), crew: z.array(SS).min(1) }).strict(),
    noise: SI.min(1), guardTurns: SI.min(1), fail: z.object({ in: SI, early: SI }).strict(),
    list: z.array(HeistDefSchema).min(1),
  }).strict(),
  digs: z.object({
    tags: z.array(z.object({ match: SS, tag: SS }).strict()), days: SI.min(1), wonderDouble: z.boolean(),
    putBack: z.object({ regard: SI, loyalty: SI }).strict(),
    list: z.array(DigDefSchema).min(1),
    notes: z.object({ eyes: z.array(SS).min(1), hands: z.array(SS).min(1), doubts: z.array(SS).min(1), after: z.object({ eyes: SS, hands: SS, doubts: SS }).strict() }).strict(),
  }).strict(),
}).strict();

/** One part's slot (Part 30 section 3.6). `clean` is fixed when it's got and never edited; a part found again gets its new way's stamp. */
export const SchemePartSchema = z.object({
  state: z.enum(['empty', 'inHand', 'lost']),
  clean: z.boolean().nullable(),
  day: SI.min(1).nullable(),
  /** The way it was got ('second' when found again), who got it, the Card it was got on. */
  way: SS.nullable(), by: z.string().nullable(), cardId: z.string().nullable(),
  /** Times lost (a part lost can be found again, by its second source). */
  lostTimes: SI.min(0),
}).strict();
export type SchemePart = z.infer<typeof SchemePartSchema>;
const PartsSchema = z.object({ means: SchemePartSchema, place: SchemePartSchema, key: SchemePartSchema, moment: SchemePartSchema }).strict();
export const SchemeJobSchema = z.object({ part: z.union([PartIdSchema, z.literal('ledger')]), way: SS, since: SI.min(1), doneOn: SI.min(1), squad: z.array(z.string()), cardId: SS }).strict();
export const HeistStateSchema = z.object({
  id: SS, part: z.union([PartIdSchema, z.literal('ledger')]).nullable(), way: z.string().nullable(), day: SI.min(1), region: SI.min(0), district: SI.min(0),
  plan: z.object({ in: z.string().nullable(), out: z.string().nullable(), watcher: z.string().nullable(), inside: z.boolean() }).strict(),
  crew: z.array(z.string()),
  stage: z.enum(['plan', 'rooms', 'done', 'failed']),
  rooms: z.array(z.enum(ROOM_IDS)), at: SI.min(0), noise: SI.min(0), quiet: SI.min(0).max(2), warned: z.boolean(),
  /** What it ended with: the take (Funds), and where it failed. */
  took: SI.min(0), failedAt: z.enum(['in', 'early', 'thing', 'out']).nullable(), lines: z.array(z.string()),
  cardId: SS,
}).strict();
export type HeistState = z.infer<typeof HeistStateSchema>;
export const DigStateSchema = z.object({
  id: SS, holdingId: SS, region: SI.min(0), district: SI.min(0), runner: z.string().nullable(), squad: z.array(z.string()),
  since: SI.min(1), doneOn: SI.min(1), notes: z.array(z.string()),
  /** Waiting on the choice at its end; then open (kept open) or put back. */
  ended: z.enum(['running', 'choose', 'open', 'back']),
  part: PartIdSchema.nullable(), cardId: SS,
}).strict();
export type DigState = z.infer<typeof DigStateSchema>;
export const SchemeStateSchema = z.object({
  /** A Creed id, or a fallen neighbour's team when taken up. */
  family: SS,
  parts: PartsSchema,
  /** 0..20. The percentage isn't stored: it's four twenties and this. */
  groundwork: SI.min(0).max(20),
  inherited: z.boolean(),
  /** The team's own Scheme, set aside when a fallen neighbour's was taken up. Nothing's dropped. */
  aside: z.object({ family: SS, parts: PartsSchema, groundwork: SI.min(0).max(20) }).strict().nullable(),
  /** Groundwork's sources already counted, by kind (so nothing's counted twice); Badges already cut for. */
  credited: z.record(z.string(), SI.min(0)),
  jobs: z.array(SchemeJobSchema),
  heist: HeistStateSchema.nullable(),
  /** Districts ("region:n") a heist has been done in (once a district); takes that can be given back. */
  heists: z.array(z.string()),
  takes: z.array(z.object({ id: SS, day: SI.min(1), amount: SI.min(0), back: z.boolean() }).strict()),
  digs: z.array(DigStateSchema),
  /** Kanto's own scheme: steps done (0..4), each step's stamp. */
  ledger: z.object({ step: SI.min(0).max(4), clean: z.array(z.boolean()), forgave: z.boolean().nullable() }).strict(),
  moment: z.object({ day: SI.min(1).nullable(), caused: z.boolean(), came: z.enum(['ready', 'passed']).nullable() }).strict(),
  /** Wonder's eye (Part 22 section 5.1) and the run's Legend. */
  eye: z.enum(['open', 'narrowed', 'shut']),
  legend: z.string().nullable(),
  /** Belonging's bought list: adds a thousand to the number and nobody arrives. */
  bought: z.boolean(),
  cards: z.array(z.object({ id: SS, day: SI.min(1), key: SS, clean: z.boolean(), fields: z.array(StoredFieldSchema).length(13) }).strict()),
}).strict();
export type SchemeState = z.infer<typeof SchemeStateSchema>;
const emptyPart = (): SchemePart => ({ state: 'empty', clean: null, day: null, way: null, by: null, cardId: null, lostTimes: 0 });
export const emptyParts = () => ({ means: emptyPart(), place: emptyPart(), key: emptyPart(), moment: emptyPart() });
export const emptyScheme = (family: string): SchemeState => ({ family, parts: emptyParts(), groundwork: 0, inherited: false, aside: null, credited: {}, jobs: [], heist: null, heists: [], takes: [], digs: [], ledger: { step: 0, clean: [], forgave: null }, moment: { day: null, caused: false, came: null }, eye: 'open', legend: null, bought: false, cards: [] });

// ---- Slice 10: the base and the Raid (design Part 16, Part 17, Part 30 section 3.7) ----

export const ROOM_TYPES = ['barracks', 'mess', 'garage', 'counting', 'infirmary', 'listening', 'workshop', 'vault', 'pen', 'lab', 'office', 'creed'] as const;
export const RoomTypeSchema = z.enum(ROOM_TYPES);
export type RoomType = z.infer<typeof RoomTypeSchema>;
export const PIECE_IDS = ['spin', 'warp', 'switch', 'dark', 'conveyor', 'ice', 'bins', 'lock', 'quiz', 'plate', 'corridor', 'decoy', 'backway', 'slot'] as const;
export const PieceIdSchema = z.enum(PIECE_IDS);
export type PieceId = z.infer<typeof PieceIdSchema>;
/** A square is "x,y"; a door between two squares is "x,y|x,y" (the two in reading order). */
const Sq = z.string().regex(/^\d+,\d+$/);
const Edge = z.string().regex(/^\d+,\d+\|\d+,\d+$/);
export const RoomSchema = z.object({
  id: z.string().min(1), type: RoomTypeSchema, size: z.number().int().min(1).max(3), at: Sq,
  /** Who runs it (a crew id); null for a room that runs on nobody, or one that's shut for want of a Specialist. */
  staff: z.string().min(1).nullable(),
  /** The day it's done (it opens at that day's Evening). A move sets it again. */
  ready: z.number().int().min(0),
  /** A size being built on it: the room works at its old size till then. */
  next: z.object({ size: z.number().int().min(2).max(3), ready: z.number().int().min(1) }).strict().optional(),
}).strict();
export type Room = z.infer<typeof RoomSchema>;
export const PieceSchema = z.object({
  id: z.string().min(1), type: PieceIdSchema,
  /** A floor piece's square, or a door piece's door. */
  at: z.union([Sq, Edge]),
  /** A locked door's key, or a switch door's switch: a square. */
  key: Sq.optional(),
  /** Which of the data's layouts a puzzle floor uses. */
  variant: z.number().int().min(0).optional(),
  /** A quiz door's three facts (ids from base.json `quiz`). */
  quiz: z.array(z.string().min(1)).length(3).optional(),
}).strict();
export type Piece = z.infer<typeof PieceSchema>;
export const WalkSchema = z.object({
  day: z.number().int().min(1),
  /** The squares walked, door to Office, in order. */
  route: z.array(Sq).min(2),
  /** How far along the route; a battle at `at` is fought before going on. */
  at: z.number().int().min(0),
  /** Who's been beaten at each square (a Devoted Grunt is fought twice). */
  beaten: z.array(z.string()),
  lines: z.array(z.string()),
  end: z.enum(['office', 'lost']).optional(),
}).strict();
export const BaseStateSchema = z.object({
  site: z.string().min(1),
  /** The region it's in (one a region). */
  region: z.number().int().min(0),
  rooms: z.array(RoomSchema),
  pieces: z.array(PieceSchema),
  /** People posted at squares (a room holds one person). */
  posts: z.array(z.object({ id: z.string().min(1), at: Sq }).strict()),
  /** Worked out on every change; a base is never stored unfair (Part 17 section 3). */
  fair: z.literal(true),
  /** The region's first room was free. */
  freeUsed: z.boolean(),
  /** The first three rooms built, in order (read by the Roster at Night, Part 16 section 3.3). */
  order: z.array(RoomTypeSchema).max(3),
  /** The Night action spent today, and how many pieces were placed or moved. */
  night: z.object({ day: z.number().int().min(1), what: z.string().min(1), pieces: z.number().int().min(0) }).strict().nullable(),
  latch: z.boolean(),
  walk: WalkSchema.nullable(),
  /** Walked it today: the next Night's change (or none) is written to the Ledger. */
  walked: z.object({ day: z.number().int().min(1), what: z.array(z.string()) }).strict().nullable(),
}).strict();
export type BaseState = z.infer<typeof BaseStateSchema>;
export const WING_IDS = ['front', 'living', 'working', 'keep'] as const;
export const WingIdSchema = z.enum(WING_IDS);
export type WingId = z.infer<typeof WingIdSchema>;
/** The Siege Map's three words (core/formats/siege.ts), and never a fourth. */
export const WingStatusSchema = z.enum(['held', 'contested', 'lost']);
export const ORDER_IDS = ['hold', 'back', 'run', 'down'] as const;
export const OrderIdSchema = z.enum(ORDER_IDS);
export type OrderId = z.infer<typeof OrderIdSchema>;
export const RaidStateSchema = z.object({
  /** warned: a day's notice; door: they're knocking; turns: wing by wing; office: the detective and the Boss; done: the morning after. */
  state: z.enum(['warned', 'door', 'turns', 'office', 'done']),
  day: z.number().int().min(1),
  district: z.string().min(1),
  choice: z.enum(['move', 'empty', 'hold']).nullable(),
  wings: z.record(WingIdSchema, WingStatusSchema),
  /** Turns each wing has left before it's Lost. */
  left: z.record(WingIdSchema, z.number().int().min(0)),
  orders: z.record(WingIdSchema, OrderIdSchema),
  turn: z.number().int().min(0),
  /** Where each person in the base is: a wing, out (the back way), caught, or gone (opened the door, or ran and didn't come back). */
  where: z.record(z.string(), z.union([WingIdSchema, z.enum(['out', 'caught', 'gone'])])),
  how: z.record(z.string(), z.enum(['holds', 'aside', 'slow', 'down'])),
  /** The back way's order (crew ids). */
  queue: z.array(z.string()),
  log: z.array(z.string()),
  /** The Office's end, once chosen; the Raid's cost, once paid. */
  end: z.enum(['battle', 'won', 'lost', 'charge', 'pen', 'window']).nullable(),
  after: z.array(z.string()),
}).strict();
export type RaidState = z.infer<typeof RaidStateSchema>;
export const LawSchema = z.object({
  /** Evenings in a row at the warning's Heat (a cave's late count). */
  hot: z.number().int().min(0),
  /** Districts already raided ("region:stage"): never twice. */
  raids: z.array(z.string()),
  /** A Raid beaten in the Office holds Heat at 8 for the region. */
  heatHeld: z.object({ region: z.number().int().min(0), heat: z.number().int().min(0).max(10) }).strict().nullable(),
}).strict();

// ---- Slice 12: the fires, the other three, the letters, the Reckoning's rooms and the last room (Parts 19, 20, 21) ----

const S12 = z.string().min(1);
export const FIRE_NS = ['first', 'second', 'third', 'last', 'middle'] as const;
export const FireNSchema = z.enum(FIRE_NS);
export type FireN = z.infer<typeof FireNSchema>;
export const LIE_KINDS = ['justWork', 'mislead', 'room'] as const;
export const LetterSchema = z.object({
  id: S12, region: z.number().int().min(0), district: z.number().int().min(0), day: z.number().int().min(1),
  /** Her mood when she wrote it; 'none' when no letter came (Shut, or kept back). */
  mood: z.enum(['warm', 'easy', 'wary', 'sullen', 'shut', 'none']),
  /** The street's news that district, as the Log had it (stored, never re-rolled). */
  news: z.string().nullable(),
  /** The Hero's last reply home, by their temper when it was written. */
  reply: z.number().int().min(0).max(4),
  read: z.boolean(), keptBack: z.boolean(), steamedNote: z.boolean(),
}).strict();
export type Letter = z.infer<typeof LetterSchema>;
export const HeroFireSchema = z.object({
  region: z.number().int().min(0), district: z.number().int().min(0), day: z.number().int().min(0),
  n: FireNSchema,
  /** Choice ids picked, in order ("ex1:2", "andYou:look"...). Missed: none. */
  picks: z.array(S12),
  /** The player's own line, word for word; '' for silence; null when the fire was missed. */
  own: z.string().max(120).nullable(),
  listened: z.number().int().min(0), talked: z.number().int().min(0),
  missed: z.boolean(),
}).strict();
export const HeroSlice12Schema = z.object({
  /** The starter's name as the Hero says it, for lines only (the team itself stays in the rival record). */
  starter: z.string(),
  /** 0 Curious .. 4 Past talking (Part 18 section 5), and why it last moved, newest last. */
  temper: z.number().int().min(0).max(4),
  temperWhy: z.array(S12),
  fires: z.array(HeroFireSchema),
  /** Things said to them that weren't true (Part 19 section 2.2). Kept; `liedToHero` is read from these at the end. */
  lies: z.array(z.object({ kind: z.enum(LIE_KINDS), day: z.number().int().min(1), region: z.number().int().min(0) }).strict()),
  /** "I'm the one in charge", said at a fire. */
  told: z.boolean(),
  /** The Idealist's line for whoever wrote the sentence (chosen at the third fire). */
  heroLine: z.string().nullable(),
  /** The Office notebook: one line on the Night after a fire, 120 letters each. */
  notebook: z.array(z.string().max(120)),
  practiced: z.boolean(),
  mother: z.object({
    mood: z.enum(['warm', 'easy', 'wary', 'sullen', 'shut']),
    letters: z.array(LetterSchema),
    /** Regions written to her in (once a region), and her replies, word for word. */
    written: z.array(z.number().int().min(0)),
    replies: z.array(S12),
    steamed: z.boolean(), keepNext: z.boolean(),
    /** "Have something hot ready." */
    hot: z.boolean(),
  }).strict(),
  /** The File's pages, written the night after a last room. */
  pages: z.array(z.array(S12)),
}).strict();
export const HeroSchema = HeroBaseSchema.extend(HeroSlice12Schema.shape).strict();
export type Hero = z.infer<typeof HeroSchema>;
export const ROAD_ROLES = ['rival', 'friend', 'stray'] as const;
export const RoadTrainerSchema = z.object({
  id: S12, role: z.enum(ROAD_ROLES), name: S12, look: S12, personality: PersonalitySchema,
  /** Every one of the four is a minor; every lock that covers the Hero covers them. */
  minor: z.literal(true),
  state: z.enum(['on', 'home']),
  reason: z.string().nullable(),
  /** The Friend's family's holding (a Lean there sends them home). */
  family: z.string().nullable(),
  today: z.string().nullable(),
  /** Days helped or talked to, and whether they've been misled. */
  helped: z.array(z.number().int().min(1)),
  talked: z.array(z.number().int().min(1)),
  misled: z.boolean(),
}).strict();
export type RoadTrainer = z.infer<typeof RoadTrainerSchema>;
export const FireStateSchema = z.object({
  n: FireNSchema,
  mid: z.number().int().min(0).nullable(),
  step: z.enum(['ex1', 'andYou', 'justWork', 'third', 'ex3', 'practice', 'own', 'done']),
  lines: z.array(S12),
  picks: z.array(S12),
  listened: z.number().int().min(0), talked: z.number().int().min(0),
  /** The temper falls by one whatever the count (the Strategist's "Ask them."). */
  down: z.boolean(),
  /** The Strategist's notebook, opened at this fire. */
  notebook: z.boolean(),
}).strict();
export type FireState = z.infer<typeof FireStateSchema>;
export const ROOM_OUTCOMES = ['talked', 'bossWon', 'heroWon', 'draw', 'window', 'away'] as const;
export const ReckStateSchema = z.object({
  region: z.number().int().min(0),
  /** Day 2's last-day choice, and how many went home when told they could. */
  lastDay: z.enum(['go', 'soup', 'chair', 'leave']).nullable(),
  gone: z.number().int().min(0),
  night: z.array(S12), gate: z.array(S12), walk: z.array(S12),
  /** Room types the walk passed, most telling first (what they've seen). */
  seen: z.array(S12),
  room: z.object({
    open: S12, speech: z.array(S12), lines: z.array(S12),
    asked: z.boolean(), offered: z.boolean(), shown: z.array(S12),
    answer: z.string().nullable(),
    outcome: z.enum(ROOM_OUTCOMES).nullable(),
    /** Who stepped in (line 31). */
    stepped: z.string().nullable(),
  }).strict().nullable(),
}).strict();
export type ReckState = z.infer<typeof ReckStateSchema>;

// ---- Slice 15: the endings (design Part 23; Part 22's Finales) ----

export const ENDING_IDS = ['scheme', 'lastRoom', 'straight', 'handOff', 'recruit', 'caught'] as const;
export const EndingIdSchema = z.enum(ENDING_IDS);
export type EndingId = z.infer<typeof EndingIdSchema>;
/** An ending under way. Its scenes are built from the block and the picks; only the step and the picks are stored. */
export const EndingStateSchema = z.object({
  id: EndingIdSchema,
  /** The colour: "Out of the window.", "Walked in."... (a key of endings.json `subs`), or null. */
  sub: z.string().min(1).nullable(),
  /** What opened it (the trigger), the day and region it began. */
  via: z.string().min(1),
  day: z.number().int().min(1),
  region: z.number().int().min(0),
  /** The scene being shown (0 is the first), and each scene's answer by its key ("t:" before a typed line). */
  step: z.number().int().min(0),
  picks: z.record(z.string(), z.string().max(130)),
  /** The heir (the Hand-Off), when there is one. */
  heir: z.string().nullable(),
  done: z.boolean(),
}).strict();
export type EndingState = z.infer<typeof EndingStateSchema>;
const ES15 = z.string();
const Rec15 = z.record(z.string(), z.unknown());
/** endings.json: the structure the code reads is checked here; its lines are strings throughout. */
export const EndingsFileSchema = z.object({
  note: z.string(), on: z.boolean(),
  names: z.object(Object.fromEntries(ENDING_IDS.map((id) => [id, ES15.min(1)])) as Record<EndingId, z.ZodString>).strict(),
  subs: z.record(z.string(), ES15.min(1)),
  asks: z.object(Object.fromEntries(ENDING_IDS.map((id) => [id, ES15.min(1)])) as Record<EndingId, z.ZodString>).strict(),
  pay: z.object({ perRun: z.number().int().min(0), perDistrict: z.number().int().min(0), perHeld: z.number().int().min(0), perRegion: z.number().int().min(0), perBadge: z.number().int().min(0) }).strict(),
  words: z.record(z.string(), ES15),
  rules: z.record(z.string(), z.number().int()),
  creedOf: z.record(z.string(), ES15.min(1)),
  creedName: z.record(z.string(), ES15.min(1)),
  tempers: z.array(ES15.min(1)).length(5),
  scheme: z.object({ finales: z.record(z.string(), z.object({ title: ES15.min(1), room: ES15.min(1), intro: z.array(ES15.min(1)), dirtyIntro: z.array(ES15.min(1)), prompt: ES15.min(1), choices: z.array(Rec15).min(1), stamps: z.object({ means: ES15.min(1), place: ES15.min(1), key: ES15.min(1), moment: ES15.min(1) }).strict() }).passthrough()), room: Rec15, monday: Rec15, findsOut: z.record(z.string(), ES15.min(1)), late: Rec15, minute: Rec15 }).strict(),
  lastRoom: Rec15, walkOut: Rec15, straight: Rec15, handOff: Rec15, recruit: Rec15, caught: Rec15, ledgerPage: Rec15, cards: Rec15,
  league: z.object({ elite: z.array(z.object({ name: ES15.min(1), team: z.array(ES15.min(1)).min(1) }).strict()).length(4), champion: z.object({ name: ES15.min(1), team: z.array(ES15.min(1)).min(1) }).strict(), eliteOffset: z.number().int(), championOffset: z.number().int() }).strict(),
  hall: z.object({ title: ES15.min(1), line: ES15.min(1) }).strict(),
  banned: z.array(ES15.min(1)).min(1),
}).strict();

const BlockV7Schema = z.object({
  /** The block's own version, for its own migrations. 7: slice 8 added the Gyms. 2: slice 2 added the district, the crew, the queue and the sheets. 3: slice 3 added the Log, the Cards, Given and Taken, and rates. 4: slice 4 made the crew people, and added applicants, the drawn list and a refusal. 5: slice 5 added the Hero, a waiting fight, who's posted, and the day's in-person job. 6: slice 6 added proof held and the last move of the Line. 20 (reserved for slice 7): the Night, and each person's mood and knocks. */
  v: z.literal(20),
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
  /** Slice 19: the Log and Cards from regions older than two, packed at a Crossing (Part 30 section 7.4; pack.ts). Absent until the fourth region. */
  archive: z.object({ log: z.string(), cards: z.string(), nLog: z.number().int().min(0), nCards: z.number().int().min(0) }).strict().optional(),
  given: z.number().int().min(0),
  taken: z.number().int().min(0),
  rates: z.record(z.string(), RateSchema),
  /** Slice 4: who's at the notice board today, everyone drawn this run (nobody twice), and an order across a line waiting on an answer. */
  applicants: z.array(ApplicantSchema),
  drawn: z.array(z.string().min(1)),
  refusal: RefusalSchema.nullable(),
  /** Slice 5: the Hero (null only until the session makes them: it needs the run's seed and the Boss's starter), a battle the day waits on, who's posted where today (Hold), and the holding the Boss went to in person today. */
  hero: HeroSchema.nullable(),
  /** Slice 12: the other three on the road, a fire under way, the Reckoning's three days and the last room. */
  road: z.array(RoadTrainerSchema),
  fire: FireStateSchema.nullable(),
  reck: ReckStateSchema.nullable(),
  fight: FightSchema.nullable(),
  posted: z.array(PostSchema),
  inPerson: z.object({ day: z.number().int().min(1), holdingId: z.string().min(1) }).strict().nullable(),
  /** Slice 7: the Night (Part 30 section 3.10). */
  night: NightStateSchema,
  /** Slice 6: holdings the team holds proof about (a taken ledger), spent by an Expose; and the Line's last move (Hearts go within three days of a move to Whatever it takes). */
  proof: z.array(z.string().min(1)),
  lineMove: z.object({ day: z.number().int().min(1), region: z.number().int().min(0), from: LineIdSchema, to: LineIdSchema }).strict().nullable(),
  /** Slice 8: each Leader the team has had to do with (design Part 30 section 3.4 `gym`), made when first needed. */
  gyms: z.array(GymStateSchema),
  /** Slice 9: the region being played (the Arrival, six districts, the Reckoning), the districts behind, and the tallies. */
  region: RegionStateSchema,
  /** Slice 11: Rackets, Fronts and Works; the squads out on trade today; bankruptcy's days. */
  economy: EconomyStateSchema,
  /** Slice 13: the region's neighbour (Giovanni in Kanto), or null when there's none (the setting's undo, or a region not written). Made on the next step. */
  neighbour: NeighbourStateSchema.nullable(),
  /** Slice 14: the Grand Scheme: four parts and groundwork, heists and Digs, Kanto's Ledger. */
  scheme: SchemeStateSchema,
  /** Slice 10: the base (null until a site's picked, and after it's lost), a Raid under way or warned of, and the law's count. */
  base: BaseStateSchema.nullable(),
  raid: RaidStateSchema.nullable(),
  law: LawSchema,
  /** Slice 15: the ending under way (one a run), or null. */
  ending: EndingStateSchema.nullable(),
}).strict();

/** What a Hero made before slice 12 starts with (and what `makeHero` gives a new one). */
export const heroSlice12Start = (starter = ''): z.infer<typeof HeroSlice12Schema> => ({
  starter, temper: 0, temperWhy: [], fires: [], lies: [], told: false, heroLine: null, notebook: [], practiced: false,
  mother: { mood: 'wary', letters: [], written: [], replies: [], steamed: false, keepNext: false, hot: false }, pages: [],
});

/** A nameless Grunt (slices 2 and 3; a block migrated from v3 keeps its four). */
export const namelessGrunt = (i: number, loyalty: number): Crew => ({ id: `g${i}`, ref: null, name: `Grunt ${i}`, age: null, minor: false, talent: null, flaw: null, flawFound: false, line: null, lineHeard: false, rank: 'grunt', loyalty, where: 'in', outOn: null, jobs: 0, asked: 0, unpaid: 0, fitIn: null, mood: 'easy', knocks: 0 });
/** Four nameless Grunts at a Creed's starting Loyalty. */
export const firstCrew = (n = 4, loyalty = 5): Crew[] => Array.from({ length: n }, (_, i) => namelessGrunt(i + 1, loyalty));
/** A Creed's starting Loyalty, read raw here (the migration can't import data.ts, which imports this file). */
const startLoyalty = (creed: unknown): number => (creedsRaw.creeds.find((c) => c.id === creed)?.start.loyalty ?? 5);

/**
 * Block migrations, one version at a time; nothing is removed.
 * v1 -> v2 (slice 1's block): the district is laid on the next step, the crew are four Grunts.
 * v2 -> v3 (slice 2's block): an empty Log and no Cards (the Log starts here; jobs already queued keep going without one), Given and Taken at 0, no rates.
 * v3 -> v4 (slice 3's block): the four Grunts stay, nameless, as people at the Creed's starting Loyalty; nobody at the notice board, nobody drawn, no refusal.
 * v4 -> v5 (slice 4's block): no Hero yet (the session makes them on the next load, from the run's seed), no fight, nobody posted, nobody gone in person.
 * v5 -> v6 (slice 5's block): no proof held, and the Line never moved (a Line chosen at founding stays where it is).
 * v6 -> v7 (slice 6's block): no Gym dealt with yet (each Leader starts Wary and never asked).
 * v7 -> v8 (slice 8's block): a region. A run founded before slice 9 began in Kanto's District 1 (no Arrival): its stage
 * becomes 2 (District 1 is Stage 2 now), its district keeps its days from day 1, nothing is behind it, and the tally's
 * changes count from the numbers it has now. The Hero's Arrival Badge isn't owed: the Arrival never happened.
 * v8 -> v9 (slice 9's block): nothing running (no racket, Front or Work), nobody out on trade, not bankrupt, and the
 * `evil-economy` stream at 0. Funds, takings and everything played stay as they were.
 * v9 -> v10 (slice 13's block): no neighbour yet. The next step makes Giovanni at Wary; ticks whose day has already passed
 * are marked as happened before the team was watching (none fire late, none fire twice).
 * v10 -> v11 (slice 14's block): an empty Scheme for the team's Creed (nothing in hand, no groundwork, nothing credited:
 * groundwork counts from the next Evening), and the `evil-scheme` stream at 0.
 * v11 -> v12 (slice 14's block): no base yet (a site's offered on the next screen), no Raid, never raided.
 * v13 -> v14 (slice 12's block): no ending yet. A run saved before slice 15 goes on from where it was; its Reckoning in the
 * last region begins the ending the next time it's reached.
 * v12 -> v13 (slice 10's block): the Hero starts Curious with no fires, no lies, nothing told and a mother at Wary who
 * hasn't written yet (her letters start with the next district); the other three are made on the next load (the
 * session needs the run's seed); no fire under way; no Reckoning yet. The starter's read back from the rival record.
 * to v20 (slice 7, its reserved number; from v9 or any later block without it): an empty Night (no knocks had,
 * nothing on the Wall); everyone Easy, nobody's knocked yet. Keyed on the Night being missing, so it holds whichever slices land first.
 */
export function migrateEvilBlock(raw: unknown): unknown {
  // A block read from a save is in its save form (saveForm.ts); it's made whole first, then migrated as ever.
  raw = fromSaveForm(raw);
  if (!raw || typeof raw !== 'object') return raw;
  let b = raw as Record<string, unknown>;
  if (b.v === 1) b = { ...b, v: 2, district: null, crew: firstCrew(), queue: [], sheets: [], evening: [] };
  if (b.v === 2) b = { ...b, v: 3, log: [], cards: [], given: 0, taken: 0, rates: {} };
  if (b.v === 3) {
    const loyalty = startLoyalty((b.team as { creed?: unknown } | undefined)?.creed);
    const crew = Array.isArray(b.crew) ? (b.crew as { id: string; name: string; outOn: number | null }[]).map((c) => ({ ...namelessGrunt(1, loyalty), id: c.id, name: c.name, outOn: c.outOn })) : b.crew;
    b = { ...b, v: 4, crew, applicants: [], drawn: [], refusal: null };
  }
  if (b.v === 4) b = { ...b, v: 5, hero: null, fight: null, posted: [], inPerson: null };
  if (b.v === 5) b = { ...b, v: 6, proof: [], lineMove: null };
  if (b.v === 6) b = { ...b, v: 7, gyms: [] };
  if (b.v === 7) b = migrateToV8(b);
  // Fixed order of the block versions (shared across the slice branches): 9 slice 10, 10 slice 11, 11 slice 13, 12 slice 14, 13 slice 12, 14 slice 15.
  if (b.v === 8) b = { ...b, v: 9, base: null, raid: null, law: { hot: 0, raids: [], heatHeld: null } };
  if (b.v === 9) b = { ...b, v: 10, economy: emptyEconomy(), draws: { ...(b.draws as object), 'evil-economy': 0 } };
  if (b.v === 10) b = { ...b, v: 11, neighbour: null };
  if (b.v === 11) b = { ...b, v: 12, scheme: emptyScheme(String((b.team as { creed?: unknown } | undefined)?.creed ?? 'profit')), draws: { ...(b.draws as object), 'evil-scheme': 0 } };
  if (b.v === 12) b = { ...b, v: 13, hero: b.hero && typeof b.hero === 'object' ? { ...heroSlice12Start(), ...(b.hero as object) } : b.hero ?? null, road: [], fire: null, reck: null };
  if (b.v === 13) b = { ...b, v: 14, ending: null };
  // 15: slice 16, the Crossing (the regions crossed, a Crossing under way, pay from abroad, the quay's answer, Hoenn's letters and second clock).
  if (b.v === 14) b = { ...b, v: 15, region: b.region && typeof b.region === 'object' ? { ...regionSlice16Start(), ...(b.region as object) } : b.region };
  if (typeof b.v === 'number' && b.v >= 9 && b.v < 20) {
    if (!('night' in b)) {
      const crew = Array.isArray(b.crew) ? (b.crew as Record<string, unknown>[]).map((c) => ({ mood: 'easy', knocks: 0, ...c })) : b.crew;
      b = { ...b, crew, night: emptyNight() };
    }
    b = { ...b, v: 20 };
  }
  return b;
}

/** What a region made before slice 16 starts with (and what `newRegion` adds). */
export const regionSlice16Start = () => ({ crossed: [] as string[], crossing: null, abroad: 0, forms: null, letters: 0, clock: null });

export const EvilModeBlockSchema = z.preprocess(migrateEvilBlock, BlockV7Schema);
export type EvilModeBlock = z.infer<typeof BlockV7Schema>;

// ---- Slice 6: the Line (design Part 3 section 7, Part 5 sections 4 and 6, Part 7 sections 6, 7, 9 and 11) ----

const S6 = z.string().min(1);
const I = z.number().int();
const P5 = z.number().int().multipleOf(5);
export const LineFileSchema = z.object({
  note: z.string(),
  lean: z.object({ base: P5, squad: I.min(1), heat: I, failHeat: I, dread: I, takings: I.min(100), streetColder: I.min(0).max(100), taken: I.min(0), loyaltyFail: I }).strict(),
  take: z.object({ base: P5, heat: I, failHeat: I, dread: I, stockDays: I.min(1) }).strict(),
  expose: z.object({ base: P5, heat: I, regard: I, days: I.min(1) }).strict(),
  terms: z.object({ fearKnown: P5, leanDread: P5, leanDreadHigh: P5, leanRegardHigh: P5, leanHard: P5, heroNear: P5, heroNearSteps: I.min(0), exposeRegard: P5, exposeDread: P5, checkpoint: P5 }).strict(),
  things: z.array(z.object({ id: TakeThingSchema, name: S6, gives: S6, written: S6, taken: I.min(0), holds: S6 }).strict()).length(TAKE_THINGS.length),
  heat: z.object({
    lamps: z.object({ amberTo: I.min(0).max(10), rule: I.min(0).max(10) }).strict(),
    ladder: z.array(z.object({ min: I.min(0).max(10), word: S6, doing: S6 }).strict()).min(1),
    districtEnd: I, warrants: I.min(0).max(10), checkpoints: I.min(0).max(10),
  }).strict(),
  dread: z.object({ words: z.array(z.object({ min: I.min(0).max(10), word: S6 }).strict()).min(1), comeOver: I.min(0).max(10), comeOverLine: S6, fade: I }).strict(),
  stops: z.array(z.object({ id: LineIdSchema, allows: S6, darkens: S6 }).strict()).length(LINE_IDS.length),
  move: z.record(z.string(), S6),
  leave: z.record(z.string(), S6),
  proof: z.record(z.string(), S6),
  card: z.record(z.string(), z.record(z.string(), S6)),
  written: z.record(z.string(), S6),
  wont: z.object({ title: S6, method: S6, noHeart: S6, verbs: z.record(z.string(), S6) }).strict(),
}).strict();

/** v7 -> v8 (see `migrateEvilBlock`). Nothing is removed; nothing already played changes. */
function migrateToV8(b: Record<string, unknown>): Record<string, unknown> {
  const team = (b.team ?? {}) as { funds?: number; heat?: number; regard?: number; dread?: number };
  const here = (b.here ?? {}) as { stage?: number; day?: number };
  const district = b.district as { n?: number } | null;
  const crew = Array.isArray(b.crew) ? (b.crew as { id: string; where: string; loyalty: number }[]) : [];
  const inn = crew.filter((c) => c.where === 'in');
  const loyalty = inn.length ? Math.floor(inn.reduce((n, c) => n + c.loyalty, 0) / inn.length) : 0;
  const stage = Math.min(8, Math.max(1, (district?.n ?? 1) + 1));
  return {
    ...b, v: 8,
    here: { ...here, stage },
    region: {
      id: 'kanto', phase: 'day', past: [],
      mark: { funds: team.funds ?? 0, heat: team.heat ?? 0, loyalty, regard: team.regard ?? 0, dread: team.dread ?? 0, log: Array.isArray(b.log) ? b.log.length : 0, crew: inn.map((c) => c.id), day: 1 },
      tallies: [], badgeDay: 3, doubledBack: false, notes: [],
    },
  };
}

// ---- Slice 9: the region file (design Part 26a, Part 2, Part 3 sections 8 and 9, Part 30 section 9) ----

const RS = z.string().min(1);
/** One rule on the one hook (Part 30 section 9): adds before scales; `whileIn` only while the Patron's on the Roster. */
export const RuleModSchema = z.object({
  /** Slice 19: loyaltyMove (Sinnoh: every Loyalty change scaled, toward nothing), standingMove (Unova: Regard and Dread changes scaled), frontPay (Kalos: Fronts' takings scaled), arrivalRegard (Kalos: added at Arrival when the coat has no symbol). */
  kind: z.enum(['odds', 'heat', 'squads', 'scoutReach', 'loyaltyFloor', 'funds', 'heroGym', 'loyaltyMove', 'standingMove', 'frontPay', 'arrivalRegard']),
  method: JobMethodSchema.optional(), tag: RS.optional(),
  /** Slice 16 (Hoenn): only for a team of this Doctrine, or only for a team of any other. */
  doctrine: RS.optional(), notDoctrine: RS.optional(),
  add: z.number().int().optional(), scale: z.number().positive().optional(),
  label: RS, whileIn: z.boolean().optional(),
}).strict();
export type RuleMod = z.infer<typeof RuleModSchema>;
export const RuleDoorSchema = z.object({ method: JobMethodSchema, why: RS }).strict();
const TicketSchema = z.array(RS).length(4);
export const RegionDefSchema = z.object({
  id: RS, index: z.number().int().min(0), name: RS, neighbour: RS, status: EvilStatusSchema, waits: RS.optional(),
  ticket: TicketSchema,
  rule: z.object({ id: RS, name: RS, text: RS, mods: z.array(RuleModSchema), doors: z.array(RuleDoorSchema) }).strict().optional(),
  deeds: z.object({ tag: RS, share: z.number().int().min(0).max(100), kinds: z.array(HoldingKindSchema).min(1), word: RS, byStage: z.record(z.string(), RS).optional(), words: z.record(z.string(), RS).optional() }).strict().optional(),
  homes: z.record(z.string(), z.array(z.number().int().min(0).max(7))).optional(),
  eighth: RS.optional(),
  /** Slice 19 (Unova): the Town is a square, where the Speech is given (Persuade at the Town; Part 26b section 2.4). */
  square: z.boolean().optional(),
  /** Slice 20 (Alola): Gym ways shut everywhere in the region, who shut them, and why (Part 8d section A.1). */
  shut: z.object({ ways: z.array(z.enum(['buy', 'replace'])).min(1), by: RS, why: z.record(z.string(), RS) }).strict().optional(),
}).strict();
export type RegionDef = z.infer<typeof RegionDefSchema>;
const PatronSchema = z.object({
  id: RS, name: RS, who: RS, line: RS, gives: RS,
  person: z.object({ name: RS, age: z.number().int().min(18), talent: TalentSchema, flaw: FlawSchema, note: RS, wage: z.number().int().min(0).optional() }).strict().nullable(),
  mods: z.array(RuleModSchema), status: EvilStatusSchema, limit: RS.optional(),
}).strict();
export type PatronDef = z.infer<typeof PatronSchema>;
export const WAY_IDS = ['bankrupt', 'nobody', 'mutinyLost', 'mutinyWon', 'raided', 'noBase', 'fainted', 'schemeLost', 'heroAhead', 'corruption', 'everyLost', 'bossQuits'] as const;
const Colour = z.tuple([RS, z.string().regex(/^#[0-9a-f]{6}$/i)]);
/**
 * A second clock (Part 26a section 1.7). Hoenn's has letters; slice 19's are stopped before the Reckoning when the
 * neighbour's tick `before` was stopped (Sinnoh's bomb, Kalos's room). At nought, every other held holding goes Free
 * (`freeTags`: only those tagged so). `stopLetters` is the line when it never starts; `acts` the In-person buttons.
 */
const ClockDefSchema = z.object({
  region: RS, letters: z.number().int().min(1).optional(), letterLine: RS.optional(), letterDone: RS.optional(), letterWhy: RS.optional(),
  before: z.number().int().min(1).max(5).optional(), freeTags: z.array(RS).optional(), acts: z.object({ boss: RS, hero: RS }).strict().optional(),
  starts: RS, days: z.array(RS).length(3),
  met: RS, scale: RS, stopBoss: RS, stopHero: RS, stopLetters: RS, together: RS, heroTemper: z.number().int(), bossWhy: RS, open: RS, notRegion: RS,
}).strict();
const Choices3 = z.array(RS).length(3);
export const LastThreeSchema = z.object({
  loan: z.object({
    region: RS, amount: z.number().int().min(1), rate: z.number().int().min(0).max(100), heat: z.number().int().min(1).max(10), offerDay: z.number().int().min(1),
    rings: RS, card: z.array(z.tuple([RS, RS])).length(13), takeAct: RS, take: RS, decline: RS, askAct: RS, ask: RS, repayAct: RS, repaid: RS, interest: RS, vested: RS, called: RS, noFronts: RS, short: RS, straightShut: RS,
  }).strict(),
  pitch: z.object({ region: RS, ask: RS, yes: RS, no: RS, acts: z.tuple([RS, RS]) }).strict(),
  aether: z.object({ region: RS, stage: z.number().int().min(0).max(7), opens: RS, offer: z.array(z.tuple([RS, RS])).min(1), choices: Choices3, said: Choices3, words: Choices3 }).strict(),
  bag: z.object({ region: RS, stage: z.number().int().min(0).max(7), text: RS, choices: Choices3, said: Choices3, sure: RS, sureAct: RS, kindLoss: z.number().int(), file: RS }).strict(),
  shrine: z.object({ region: RS, islands: z.array(z.number().int().min(0)).length(8), warmAt: z.number().int().min(1), sullenOdds: z.number().int(), odds: RS, comes: RS, after: RS, rises: RS, falls: RS }).strict(),
  awayEnd: z.object({ region: RS, regard: z.number().int(), full: RS }).strict(),
  canteen: z.object({ region: RS, warm: RS }).strict(),
  star: z.object({ region: RS, visitAct: RS, visited: RS, refused: RS, opinion: z.number().int() }).strict(),
}).strict();
export type LastThreeDef = z.infer<typeof LastThreeSchema>;

export const RegionFileSchema = z.object({
  note: z.string(),
  /** The slice's undo: false and a run plays one district, as slice 8 left it. */
  on: z.boolean(),
  regions: z.array(RegionDefSchema).length(9),
  stages: z.object({ names: z.array(RS).length(8) }).strict(),
  arrival: z.object({
    days: z.tuple([z.number().int().min(2), z.number().int().min(2)]), doors: z.array(RuleDoorSchema), squads: z.number().int().min(1), squadsWhy: RS,
    home: RS, leaves: RS, badge: RS, end: RS,
    lessons: z.object({ patron: z.array(RS).length(4), nobody: z.array(RS).length(4) }).strict(),
  }).strict(),
  reckoning: z.object({ days: z.literal(3), day: z.array(RS).length(3), badge: RS, outside: RS, arrives: RS, end: RS, over: RS }).strict(),
  road: z.object({
    minRank: z.array(RankSchema).min(1), title: RS, stay: RS, nobody: RS, carried: RS, heroAhead: RS,
    heard: z.object({ regard: z.array(RS).min(1), dread: z.array(RS).min(1), plain: z.array(RS).min(1) }).strict(),
    letter: RS, letters: z.array(RS).min(1), recall: RS, doubleBack: RS, doubleBackNone: RS,
  }).strict(),
  drift: z.object({ oneIn: z.number().int().min(1), share: z.number().int().min(0).max(100), line: RS, takings: RS }).strict(),
  tally: z.object({ said: RS, labels: z.record(z.string(), RS) }).strict(),
  waysForward: z.array(z.object({ id: z.enum(WAY_IDS), state: RS, means: RS, way: RS, status: EvilStatusSchema, waits: RS.optional() }).strict()).length(WAY_IDS.length),
  patrons: z.array(PatronSchema).length(6),
  /** Slice 16: the Crossing's words and numbers (design Part 2 section 9; Part 21's scene, kept short). */
  crossing: z.object({
    title: RS, intro: RS, tickets: RS, heroFollows: RS, stayShare: z.number().int().min(1), askLoyalty: z.number().int().min(0).max(10),
    who: RS, stays: RS, reasons: z.array(RS).min(1), ask: RS, askNo: RS, asked: RS, comes: RS, garrisons: RS,
    base: z.object({ title: RS, none: RS, choices: z.array(z.object({ id: z.enum(['hand', 'sell', 'leave', 'burn']), name: RS, gives: RS, and: RS }).strict()).length(4), sell: z.tuple([z.number().int().min(0), z.number().int().min(0)]), leavePays: z.number().int().min(0), burnHeat: z.number().int() }).strict(),
    carries: z.array(z.tuple([RS, RS])).min(1),
    forms: z.object({ ask: RS, yes: RS, no: RS, none: RS }).strict(),
    boats: z.object({ ahead: RS, beside: RS, behind: RS, steps: z.object({ ahead: z.number().int().min(1), beside: z.number().int().min(1), behind: z.number().int().min(1) }).strict(), night: RS }).strict(),
    abroad: RS, leave: RS, last: RS, emberBoat: RS, keptWarm: RS,
    /** Slice 19 (Kalos): the coat with no symbol, at the quay. */
    noLogo: RS,
  }).strict(),
  /** Slice 16: Hoenn's letters and its second clock (Part 26a sections 1.7 and 4.6; Part 15a section 8.2). */
  clock: ClockDefSchema.extend({ letters: z.number().int().min(1), letterLine: RS, letterDone: RS, letterWhy: RS }),
  /** Slice 19 (Unova): the Speech (Part 26b section 2.4): the Card's fourteenth field, and what's said after. */
  speech: z.object({ label: RS, empty: RS, given: RS, honest: RS, otherHalf: RS }).strict().optional(),
  /** Slice 19: the other regions' second clocks: Sinnoh's mountain, Kalos's light (Part 26b sections 1.6 and 3.6). */
  clocks: z.array(ClockDefSchema).optional(),
  /** Slice 20: Alola, Galar and Paldea's words and numbers (Part 26c; Part 8d; Part 15b sections 3 to 6; Part 5 section 2.6). */
  lastThree: LastThreeSchema.optional(),
  look: z.object({
    a: z.array(Colour).length(12), b: z.array(Colour).length(12), symbols: z.array(RS).length(12), cuts: z.array(RS).length(8), heads: z.array(RS).length(8),
    motto: z.tuple([z.array(RS).min(1), z.array(RS).min(1), z.array(z.string()).min(1)]),
    cold: z.object({ a: RS, b: RS, line: RS }).strict(), warm: z.object({ cut: RS, line: RS }).strict(), eyebrow: RS,
  }).strict(),
}).strict();

// ---- Slice 10: the base file (design Part 16, Part 17, Part 5's building costs) ----

const BS = z.string().min(1);
const Fx = z.array(z.object({ k: BS, v: z.number().int(), from: z.number().int().min(1).max(3), per: z.boolean().optional() }).strict());
const Status = { status: EvilStatusSchema, waits: BS.optional() };
const Pattern = z.object({ name: BS, rows: z.array(z.string().length(5)).length(5) }).strict();
export const BaseFileSchema = z.object({
  note: z.string(),
  /** The slice's undo: false and the base is one room (the Common Room): nothing's built, defended or raided. */
  on: z.boolean(),
  offer: z.object({ kinds: z.number().int().min(1) }).strict(),
  squares: z.object({ door: BS, common: BS, office: BS, floor: BS }).strict(),
  fixed: z.object({ door: BS, common: BS, office: BS }).strict(),
  sites: z.array(z.object({
    id: BS, name: BS, region: BS.nullable(), bg: z.string().regex(/^bg\.[a-z0-9_.]+$/), grid: BS, slots: z.number().int().min(1),
    /** Rows: '#' a square (one becomes the Office), 'D' the front door, 'C' the Common Room, '.' nothing. */
    shape: z.array(z.string().min(1)).min(1).optional(),
    freeRoom: RoomTypeSchema.optional(), raidHeat: z.number().int().optional(), raidLate: z.number().int().min(0).optional(), workshopScale: z.number().positive().optional(), fee: z.number().int().min(0).optional(), regard: z.number().int().optional(),
    and: BS, local: BS, evening: BS,
    effects: z.array(z.object({ text: BS, ...Status }).strict()),
    ...Status,
  }).strict()).min(7),
  rules: z.object({ days: z.array(z.number().int().min(1)).length(3), creedDays: z.number().int().min(1), machinesFaster: z.number().int().min(0), moveCost: z.number().int().min(0), moveDays: z.number().int().min(1), sellBack: z.number().int().min(1), sellLoyalty: z.number().int(), handedLoyalty: z.number().int(), capPerSize: z.number().int().min(0), capMax: z.number().int().min(1), piecesANight: z.number().int().min(1), workshopFree: z.number().int().min(0) }).strict(),
  rooms: z.array(z.object({
    id: RoomTypeSchema, name: BS, runsOn: z.union([TalentSchema, z.enum(['nobody', 'anyone', 'boss', 'patron'])]),
    line: z.array(LineIdSchema).optional(), fixed: z.boolean().optional(), lastRegion: z.boolean().optional(),
    sizes: z.array(z.object({ cost: z.number().int().min(0), does: BS, looks: BS, ...Status }).strict()).min(1).max(3),
    fx: Fx, hand: BS, first: z.object({ talent: TalentSchema.nullable(), line: z.string() }).strict(), says: BS,
    ...Status,
  }).strict()).length(ROOM_TYPES.length),
  creedRooms: z.array(z.object({ creed: BS, name: BS, has: BS }).strict()).length(6),
  adjacency: z.array(z.object({ a: BS, b: BS, does: BS, fx: Fx, ...Status }).strict()).length(18),
  pieces: z.array(z.object({
    id: PieceIdSchema, name: BS, on: z.enum(['floor', 'door']), is: BS, cost: z.number().int().min(0), rule: BS,
    puzzle: z.enum(['spin', 'warp', 'conveyor', 'ice', 'bins']).optional(), lock: z.enum(['switch', 'key', 'quiz']).optional(), needs: z.enum(['light', 'heavy', 'outside']).optional(),
    delay: z.number().int().min(0).optional(), workshop: z.boolean().optional(), writes: BS,
  }).strict()).length(PIECE_IDS.length),
  puzzles: z.object({ limit: z.number().int().min(1), steps: z.number().int().min(1), ice: z.array(Pattern).min(1), spin: z.array(Pattern).min(1), conveyor: z.array(Pattern).min(1), warp: z.array(Pattern).min(1), bins: z.array(Pattern).min(1) }).strict(),
  quiz: z.array(z.object({ id: BS, subject: BS, ask: BS, from: z.union([RoomTypeSchema, z.literal('common')]) }).strict()).min(3),
  fair: z.record(z.string(), BS),
  people: z.object({
    levels: z.record(RankSchema, z.number().int()),
    bands: z.array(z.object({ min: z.number().int().min(0).max(10), word: BS, does: z.enum(['again', 'fight', 'aside', 'opened']), says: BS }).strict()).length(5),
    flaws: z.record(z.string(), BS),
    classes: z.object({ grunt: BS, officer: BS, detective: BS }).strict(),
  }).strict(),
  delay: z.object({ corridors: z.number().int().min(1), cap: z.number().int().min(0), word: BS }).strict(),
  walk: z.record(z.string(), BS),
  night: z.object({ window: z.record(z.string(), BS), rooms: z.record(z.string(), BS) }).catchall(z.union([BS, z.record(z.string(), BS)])),
  post: z.record(z.string(), BS),
  supper: BS,
  built: z.record(z.string(), BS),
  raid: z.object({
    warnAt: z.number().int().min(1).max(10), at: z.number().int().min(1).max(10), heatAfter: z.number().int().min(0).max(10), heatHeld: z.number().int().min(0).max(10), funds: z.number().int().min(0).max(100), backWay: z.number().int().min(1),
    warning: BS, warningPost: BS, lapsed: BS,
    choices: z.array(z.object({ id: z.enum(['move', 'empty', 'hold', 'station']), name: BS, is: BS, costs: BS, gives: BS, heat: z.number().int().optional(), ...Status }).strict()).length(4),
    wings: z.array(z.object({ id: WingIdSchema, name: BS, rooms: z.array(BS).min(1), turns: z.number().int().min(1), is: BS }).strict()).length(WING_IDS.length),
    orders: z.array(z.object({ id: OrderIdSchema, name: BS }).strict()).length(ORDER_IDS.length),
    door: z.record(z.string(), BS), slide: BS, acts: z.record(z.string(), BS), queue: BS, minor: BS, last: BS,
    office: z.object({ speech: BS, clauses: z.record(z.string(), BS), never: BS, choices: z.array(z.object({ id: z.enum(['battle', 'charge', 'pen', 'window']), name: BS }).strict()).length(4) }).catchall(z.union([BS, z.record(z.string(), BS), z.array(z.unknown())])),
    detectives: z.array(z.object({ region: BS, name: BS, age: z.number().int().min(18), works: BS, middle: BS, team: z.array(BS).min(1).max(6) }).strict()).min(1),
    after: z.record(z.string(), BS),
    cells: z.object({ bail: BS, bailed: BS, visit: z.record(z.string(), BS), bailEach: z.number().int().min(0) }).strict(),
  }).strict(),
  first: BS,
}).strict();
export type BaseFile = z.infer<typeof BaseFileSchema>;

// ---- Slice 12's data files (fires.json, road.json, lastRoom.json) ----

const T12 = z.string().min(1);
const Tx = z.array(T12).min(1);
const PersonalityRec = <S extends z.ZodTypeAny>(v: S) => z.record(PersonalitySchema, v);
const CREED_IDS = ['profit', 'cause', 'power', 'wonder', 'belonging', 'spite'] as const;
const CreedRec = <S extends z.ZodTypeAny>(v: S) => z.record(z.enum(CREED_IDS), v);
export const FireChoiceSchema = z.object({ say: T12, kind: z.enum(['listen', 'talk']), reply: Tx, file: T12.optional(), fx: z.enum(['notebook', 'temperDown', 'practice', 'loyalty', 'heroLine']).optional(), id: T12.optional(), lie: z.boolean().optional() }).strict();
const Three = z.array(FireChoiceSchema).length(3);
const FireSchemaOne = z.object({ open: Tx, openNo: Tx.optional(), told: T12.optional(), awake: z.boolean().optional(), ex1: Three, ask: T12, ex3: Three }).strict();
export const FiresFileSchema = z.object({
  note: z.string(), on: z.boolean(),
  rules: z.object({ district: z.number().int().min(1).max(6), day: z.number().int().min(1).max(7), noFlameAt: z.number().int().min(1).max(4), ownMax: z.number().int().min(1).max(120), noteMax: z.number().int().min(1).max(120) }).strict(),
  flame: z.record(z.string(), T12), scene: z.record(z.string(), T12),
  andYou: z.object({ ask: T12, answers: z.array(FireChoiceSchema).length(3), creed: CreedRec(z.object({ say: T12, reply: Tx }).strict()), justWorkThen: z.array(FireChoiceSchema).length(2) }).strict(),
  third: z.object({ answers: z.array(FireChoiceSchema).length(4), sitBack: T12, leave: T12 }).strict(),
  slots: z.record(z.string(), T12),
  /** Every fire has text for all eight personalities (Part 30 section 15, test 18). */
  personalities: PersonalityRec(z.object({ first: FireSchemaOne, second: FireSchemaOne, third: FireSchemaOne, last: FireSchemaOne }).strict()),
  middle: z.array(z.object({ open: T12, ex1: Three }).strict()).length(8),
  idealistDoing: CreedRec(T12), idealistChanged: z.object({ yes: T12, no: T12 }).strict(),
  own: z.object({ always: z.array(T12).length(2), creed: CreedRec(z.array(T12).length(6)), line: z.record(LineIdSchema, z.array(T12).length(6)) }).strict(),
  quoted: z.object({ said: T12, silence: T12, none: T12 }).strict(),
  notebook: z.record(z.string(), z.union([z.string(), z.array(T12)])),
  practice: z.record(z.string(), T12),
  loyalty: T12, heroLine: T12,
}).strict();
const RoleSchema = z.object({
  word: T12, ids: T12, personalities: z.array(PersonalitySchema).min(2), how: T12,
  canon: z.record(z.string(), z.object({ name: T12, who: T12, look: T12 }).strict()).optional(),
  reasons: z.record(z.string(), T12), home: T12,
  lines: z.array(z.object({ text: T12, when: z.enum(['badge', 'replaced', 'mess', 'take', 'lean']).optional() }).strict()).min(6),
  talk: z.object({ where: T12, says: T12 }).strict(), help: T12, mislead: T12,
}).strict();
export const RoadFileSchema = z.object({
  note: z.string(), on: z.boolean(),
  roles: z.object({ rival: RoleSchema, friend: RoleSchema, stray: RoleSchema }).strict(),
  names: z.array(z.object({ name: T12, look: T12, raisedBy: T12 }).strict()).min(3),
  board: z.record(z.string(), T12), approach: z.record(z.enum(ROAD_ROLES), T12),
  mother: z.object({
    start: z.enum(['warm', 'easy', 'wary', 'sullen', 'shut']),
    lines: z.record(z.enum(['warm', 'easy', 'wary', 'sullen']), T12),
    news: T12, noNews: T12, steamed: T12, reply: z.record(z.enum(['0', '1', '2', '3', '4']), T12), none: T12, sealed: T12,
    open: z.record(z.string(), T12), readBy: T12, young: T12, keep: z.record(z.string(), T12),
    write: z.object({ openings: z.array(T12).length(4), warm: z.array(T12).length(4), wary: z.array(T12).length(4), sullen: z.array(T12).length(4), once: T12, night: T12 }).strict(),
  }).strict(),
  temper: z.object({ words: z.array(T12).length(5), does: z.array(T12).length(5), why: z.record(z.string(), T12), angrySteps: z.number().int().min(1).max(3) }).strict(),
}).strict();
const WALL_STATES = ['drawings', 'posters', 'both', 'bare'] as const;
export const WallStateSchema = z.enum(WALL_STATES);
export type WallState = z.infer<typeof WallStateSchema>;
export const LastRoomFileSchema = z.object({
  note: z.string(), on: z.boolean(),
  eighth: z.object({ giovanni: z.object({ regard: T12, dread: T12, level: T12 }).strict(), answers: PersonalityRec(T12), baker: T12 }).strict(),
  lastDay: z.object({ title: T12, help: T12, options: z.record(z.enum(['go', 'soup', 'chair', 'leave']), z.record(z.string(), T12)), used: T12, notNow: T12 }).strict(),
  night: z.object({ title: T12, bands: z.record(z.string(), T12), hot: T12, knock: T12, knockExec: T12 }).strict(),
  gate: z.record(z.string(), T12),
  walk: z.object({ exec: z.record(z.string(), T12), priority: z.array(T12).min(1) }).catchall(T12),
  /** The last room has text for every Wall state (Part 30 section 15, test 19). */
  wall: z.record(WallStateSchema, T12),
  open: z.object({ fire: T12, knew: T12, told: T12, noFire: T12, lied: T12, away: T12 }).strict(),
  awayLeaves: PersonalityRec(T12),
  parts: z.record(z.string(), T12),
  /** And for every Creed. */
  creed: CreedRec(z.object({ door: T12, first: T12, held: T12, not: T12 }).strict()),
  choices: z.record(z.enum(['answer', 'show', 'battle', 'ask', 'window', 'offer', 'nothing']), T12),
  answers: z.record(z.enum(['creed', 'first', 'dontKnow', 'forThem', 'scheme', 'lie']), z.object({ name: T12, say: T12, hero: T12.optional() }).strict()),
  show: z.record(z.enum(['ledger', 'pen', 'wall', 'window', 'notebook', 'someone', 'nothing']), z.object({ name: T12, hero: T12 }).strict()),
  someone: z.record(z.string(), T12),
  ask: PersonalityRec(T12),
  heroLine: T12, offerRefused: T12, offerShut: T12, battleFirst: T12,
  outcomes: z.record(z.enum(ROOM_OUTCOMES), z.object({ hero: T12, page: T12, stepIn: T12.optional() }).strict()),
  evening: T12,
  roster: z.record(z.string(), T12),
  page: z.object({ title: T12, fire: T12, noFire: T12, asked: T12, noAnswer: T12, reason: T12, close: PersonalityRec(T12), soup: T12 }).strict(),
  regionOver: T12,
}).strict();
