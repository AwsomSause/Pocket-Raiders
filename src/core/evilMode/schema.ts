// Evil Mode (design Part 30): the mode's data schemas and its optional save block `run.expansion.evilMode`.
// Pure Zod, no Phaser. Slice 1 ("the shell") holds only what founding and an empty day need: the team, where the day is,
// the stream counts and the applied set. Later slices add their fields to the block and bump its own `v`.

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
  /** Slice 5: the Boss went in person and played it (Part 7 section 10): it isn't rolled at Evening. */
  played: z.enum(['won', 'lost']).optional(),
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
  n: z.number().int().min(1),
  /** The run's seed, copied so the day machine stays a pure function of the block. */
  seed: z.string().min(1),
  holdings: z.array(HoldingSchema).length(20),
  /** Street indexes where a Persuade has already given Regard. */
  regardStreets: z.array(z.number().int().min(0)),
  end: z.object({ how: z.enum(['held', 'taken']), day: z.number().int().min(1), count: z.number().int().min(0) }).optional(),
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
export const LEAVE_WAYS = ['line', 'loyalty', 'letGo'] as const;
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
  where: z.enum(['in', 'left']),
  outOn: z.number().int().min(1).nullable(),
  /** Jobs that went (Grunt to Lead needs three). */
  jobs: z.number().int().min(0),
  /** Times asked across their line. */
  asked: z.number().int().min(0),
  /** Days unpaid in this district (paid on time a whole district: +1 at its end). */
  unpaid: z.number().int().min(0),
  /** The district ("region:n") their talent last fitted a job in (+1 once a district). */
  fitIn: z.string().nullable(),
  left: z.object({ day: z.number().int().min(1), how: z.enum(LEAVE_WAYS), kindly: z.boolean().optional() }).strict().optional(),
}).strict();
export type Crew = z.infer<typeof CrewSchema>;
export type Person = Crew;

export const ApplicantSchema = z.object({ ref: z.string().min(1), day: z.number().int().min(1), q: QuestionSchema.nullable() }).strict();
export type Applicant = z.infer<typeof ApplicantSchema>;

/** An order across a line, waiting on the Boss's answer in the yard (Part 7 section 11.1). */
export const RefusalSchema = z.object({
  cardId: z.string().min(1),
  job: z.object({ holdingId: z.string().min(1), method: JobMethodSchema, squad: z.array(z.string().min(1)).min(1), offer: z.number().int().min(1).max(100).optional() }).strict(),
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

export const LOG_KINDS = ['card', 'job', 'pay', 'waive', 'halve', 'ask', 'asked', 'hire', 'turned', 'leave', 'promote', 'hero'] as const;

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
  loud: z.object({ scout: z.number().int().min(0).max(3), persuade: z.number().int().min(0).max(3), pay: z.number().int().min(0).max(3), payUnder: z.number().int().min(0).max(3), outplay: z.number().int().min(0).max(3) }).strict(),
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
export const HeroSchema = z.object({
  rivalId: z.string().min(1),
  name: z.string().min(1),
  look: z.string().min(1),
  raisedBy: z.string().min(1),
  personality: PersonalitySchema,
  /** The home street: the Town's street of the district they set out from (holding ids). */
  home: z.object({ region: z.number().int().min(0), district: z.number().int().min(1), street: z.string().min(1), holdings: z.array(z.string().min(1)) }).strict(),
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
  badges: z.array(z.object({ region: z.number().int().min(0), district: z.number().int().min(1), how: z.enum(['full', 'half']), day: z.number().int().min(1) }).strict()),
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
export type Hero = z.infer<typeof HeroSchema>;

/** A battle the day's waiting on (design Part 30 section 6.2 `battleResult`): Outplay in person, or a person posted against the Hero. */
export const FightSchema = z.object({
  kind: z.enum(['outplay', 'hold']),
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

const BlockV5Schema = z.object({
  /** The block's own version, for its own migrations. 2: slice 2 added the district, the crew, the queue and the sheets. 3: slice 3 added the Log, the Cards, Given and Taken, and rates. 4: slice 4 made the crew people, and added applicants, the drawn list and a refusal. 5: slice 5 added the Hero, a waiting fight, who's posted, and the day's in-person job. */
  v: z.literal(5),
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
  /** Slice 4: who's at the notice board today, everyone drawn this run (nobody twice), and an order across a line waiting on an answer. */
  applicants: z.array(ApplicantSchema),
  drawn: z.array(z.string().min(1)),
  refusal: RefusalSchema.nullable(),
  /** Slice 5: the Hero (null only until the session makes them: it needs the run's seed and the Boss's starter), a battle the day waits on, who's posted where today (Hold), and the holding the Boss went to in person today. */
  hero: HeroSchema.nullable(),
  fight: FightSchema.nullable(),
  posted: z.array(PostSchema),
  inPerson: z.object({ day: z.number().int().min(1), holdingId: z.string().min(1) }).strict().nullable(),
}).strict();

/** A nameless Grunt (slices 2 and 3; a block migrated from v3 keeps its four). */
export const namelessGrunt = (i: number, loyalty: number): Crew => ({ id: `g${i}`, ref: null, name: `Grunt ${i}`, age: null, minor: false, talent: null, flaw: null, flawFound: false, line: null, lineHeard: false, rank: 'grunt', loyalty, where: 'in', outOn: null, jobs: 0, asked: 0, unpaid: 0, fitIn: null });
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
 */
export function migrateEvilBlock(raw: unknown): unknown {
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
  return b;
}

export const EvilModeBlockSchema = z.preprocess(migrateEvilBlock, BlockV5Schema);
export type EvilModeBlock = z.infer<typeof BlockV5Schema>;
