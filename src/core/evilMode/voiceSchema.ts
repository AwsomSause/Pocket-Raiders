// Evil Mode slice 18, the voice: the shape of voice.json and of the block's `voice` state (design Part 25a, Part 25b,
// Part 30 section 3.10). Kept in its own file so the slices built beside it don't collide in schema.ts.

import { z } from 'zod';

const T = z.string().min(1);
const I = z.number().int();

/** What a reply does. Nothing moves by more than one (Part 25b section 1), money aside. */
export const PostFxSchema = z.object({
  loyalty: I.min(-1).max(1).optional(),
  teamLoyalty: I.min(-1).max(1).optional(),
  heat: I.min(-1).max(1).optional(),
  regard: I.min(-1).max(1).optional(),
  dread: I.min(-1).max(1).optional(),
  opinion: I.min(-1).max(1).optional(),
  given: z.literal(1).optional(),
  taken: z.literal(1).optional(),
  funds: I.optional(),
  flag: T.optional(),
  recall: z.literal(true).optional(),
}).strict();
export type PostFx = z.infer<typeof PostFxSchema>;

export const PostChoiceSchema = z.object({ say: T, reply: T, fx: PostFxSchema }).strict();
export type PostChoice = z.infer<typeof PostChoiceSchema>;
const Choices = z.array(PostChoiceSchema).length(3);

const TALENT = z.enum(['voice', 'hands', 'eyes', 'nerve', 'books', 'wheels', 'heart']);
const FLAW = z.enum(['talks', 'drinks', 'doubts', 'skims', 'freezes', 'loves', 'proud', 'kind']);
const MOOD5 = <S extends z.ZodTypeAny>(s: S) => z.object({ warm: s, easy: s, wary: s, sullen: s, shut: s }).strict();
const BARK_MOMENTS = z.object({ board: T, dispatchGo: T, mess: T, jobWon: T, jobLost: T, door: T }).strict();
const Live = z.object({ live: z.boolean(), waits: T.optional() });

export const OfficerLetterSchema = z.object({
  n: I.min(1).max(40),
  talent: TALENT.optional(), flaw: FLAW.optional(), any: z.literal(true).optional(),
  kind: z.enum(['quiet', 'trouble', 'third', 'fourth', 'flaw', 'staying', 'wedding', 'back', 'nightBefore']),
  text: T,
  choices: Choices.optional(),
  straight: z.literal(true).optional(),
  flag: T.optional(),
  after: T.optional(),
  status: z.enum(['supported', 'disabled']).optional(),
  waits: T.optional(),
}).strict();
export type OfficerLetter = z.infer<typeof OfficerLetterSchema>;

const Paper4 = z.object({ low: z.array(T).min(1), mid: z.array(T).min(1), high: z.array(T).min(1), top: z.array(T).min(1) }).strict();
const Five = z.array(T).length(5);

export const VoiceFileSchema = z.object({
  note: z.string(),
  on: z.boolean(),
  rules: z.object({
    postPerDay: z.literal(1), steamHeat: I, steamDelay: I.min(1), emptyDread: I, detectiveHeat: I, marginLoyalty: I, loudHeat: I, radioHeat: I,
    paperKnows: I, bothAt: I, wallStanding: I, postcardLoyalty: I, comeBackLoyalty: I, comeBackDistricts: I, basketStances: z.array(T).min(1),
    planks: I, squadBack: I, boxGiven: I, fishLane: I, cannery: I, dockers: I, barkPerBeat: z.literal(1),
  }).strict(),
  words: z.object({ fx: z.record(z.string(), T) }).catchall(z.union([T, z.record(z.string(), T)])),
  moments: z.array(T).length(14),
  barks: z.object({
    bands: z.array(z.object({ id: z.enum(['leaving', 'distant', 'steady', 'easy', 'devoted']), min: I.min(0) }).strict()).length(5),
    loyalty: z.object({ devoted: BARK_MOMENTS, easy: BARK_MOMENTS, steady: BARK_MOMENTS, distant: BARK_MOMENTS, leaving: BARK_MOMENTS }).strict(),
    mood: MOOD5(z.array(T)),
    flaw: z.record(FLAW, z.object({ mess: T, dispatchGo: T, door: T }).strict()),
    talent: z.record(TALENT, T),
    doctrine: z.record(z.string(), T),
    creed: z.record(z.string(), T),
    line: z.object({ persuade: z.record(z.string(), T), lean: z.record(z.string(), T), take: z.record(z.string(), T) }).strict(),
    hero: z.object({ curious: T, curiousWork: T, uneasy: T, set: T, angry: T, past: T, ate: T, beat: T, beaten: T }).strict(),
    raid: z.record(z.string(), z.array(T).min(1)),
    crossing: z.object({ glad: T, notGlad: T, staying: T, obadiah: T, beatriz: T, hortense: T }).strict(),
    named: z.record(z.string(), z.array(T).length(6)),
  }).strict(),
  radio: z.object({
    presenters: z.record(z.string(), z.object({ who: T, says: T }).strict()),
    ticks: z.record(z.string(), Five),
    stopped: z.record(z.string(), Five),
    badge: T,
    leaders: z.record(z.string(), z.object({ badge: T, quote: T }).strict()),
    loud: T, loudWhat: z.record(z.string(), T), work: T, front: T, heat: T, heatGuess: z.array(T).min(1), birthday: T, songs: z.array(T).min(1),
    quiet: z.array(T).min(1),
    names: z.object({ unknown: T, regard: T, dread: T, both: T, regardHigh: T, dreadHigh: T, bothHigh: T }).strict(),
    requests: z.array(z.object({ from: T, for: T, what: T }).merge(Live).strict()).length(6),
    requestLine: T,
  }).strict(),
  paper: z.object({
    regard: Paper4, dread: Paper4, both: T, bothNoInterview: T,
    guesses: z.object({ waive: T, work: T, heist: T, front: T, dig: T, pen: T, nothing: T }).strict(),
    ferry: T,
    hero: z.object({ first: T, third: T, tick: T, work: T }).strict(),
    neighbour: z.object({ war: T, rivals: T, truce: T, front: T, merger: T }).strict(),
    endings: z.object({ scheme: T, schemeCause: T, lastRoom: T, straight: T, handOff: T, recruit: T, caught: T }).strict(),
    letGoColdly: T,
  }).strict(),
  margins: z.object({ ngozi: T, obadiah: T, priya: T, any: T, anyBusy: T }).strict(),
  officer: z.array(OfficerLetterSchema).length(40),
  garrison: z.array(z.object({ id: T, text: T, needs: T.optional(), choices: Choices.optional() }).strict()).length(5),
  cells: z.object({
    holds: z.array(T).length(3), slow: z.array(T).length(2), aside: z.array(T).length(2),
    flaw: z.record(FLAW, T), kindChoices: Choices, lawyer: T, jailbreak: T,
    epilogue: z.object({ hortense: T, tobi: T, obadiah: T, heir: T, hero: T }).strict(),
  }).strict(),
  leavers: z.object({
    line: T, loyalty: z.null(), loyaltyWritten: T, lineMoved: T, hero: T, poached: T, quest: T, stayed: T, letGoKindly: T, letGoColdly: z.null(), handshake: T,
    waits: z.record(z.string(), T),
  }).strict(),
  mothers: z.object({
    told: z.object({ front: T, truth: T, mates: T }).strict(), toldWaits: T, frontNote: T,
    unprompted: z.array(z.object({ id: T, from: T, text: T, note: T.optional() }).strict()).length(3),
  }).strict(),
  town: MOOD5(z.string()).extend({ empty: T, child: T, erika: T, detective: T }).strict(),
  baskets: z.object({ cards: z.array(T).length(9), big: T, basket: T, others: z.record(z.string(), z.object({ text: T }).merge(Live).strict()) }).strict(),
  postcards: z.object({ prodigy: z.object({ nobody: T, truth: T, silent: z.string() }).strict(), hero: T, looker: T, stray: T, leave: T, chaser: T }).strict(),
  notebook: z.object({ straight: T }).catchall(z.union([T, z.object({ name: T, free: T, caught: T }).strict()])),
  songs: z.record(z.string(), z.object({ intro: T, lines: z.array(T).length(4), after: T }).merge(Live).strict()),
}).strict();
export type VoiceFile = z.infer<typeof VoiceFileSchema>;

/** One thing said or printed on a day: an id and its fill-ins (never the sentence). */
export const SaidSchema = z.object({ day: I.min(1), id: T, args: z.record(z.string(), z.string()) }).strict();
export type Said = z.infer<typeof SaidSchema>;

/** One piece of post (Part 30 section 3.10 `inbox`): made, due, delivered (day), opened, steamed, pinned, answered. */
export const PieceSchema = z.object({
  id: T,
  /** The letter's text id ("officer:18", "town:wary", "basket:3"...). */
  what: T,
  /** Whose it is, by crew id, or null (the town, a neighbour). */
  who: z.string().nullable(),
  args: z.record(z.string(), z.string()),
  made: I.min(1),
  due: I.min(1),
  /** The Morning it reached the Board; null while it waits (one a day: the older first). */
  day: I.min(1).nullable(),
  opened: z.boolean(),
  steamed: z.boolean(),
  pinned: z.boolean(),
  /** The reply's index (0-2), when it's been answered. */
  answer: I.min(0).max(2).nullable(),
  /** Left unopened through a whole district ("left to them", Part 9). */
  left: z.boolean(),
}).strict();
export type Piece = z.infer<typeof PieceSchema>;

export const VoiceStateSchema = z.object({
  /** Yesterday's numbers, kept at each Morning, to tell what happened since. */
  mark: z.object({ day: I.min(1), heat: I.min(0), regard: I.min(0), dread: I.min(0), log: I.min(0), stance: z.string().nullable(), nb: z.string().nullable(), counts: z.record(z.string(), I.min(0)) }).strict().nullable(),
  radioOff: z.boolean(),
  /** The set's been switched off this run (a Night action nobody takes twice). */
  radioWasOff: z.boolean(),
  /** The last week's Radio items and headlines (the Hero hears the same). */
  radio: z.array(SaidSchema),
  paper: z.array(SaidSchema),
  inbox: z.array(PieceSchema),
  /** Once-only keys: a letter sent, a request played, a basket. */
  sent: z.array(T),
  flags: z.array(T),
  /** Giovanni's last stance, carried across the water for the fruit baskets; a War seen since the last Truce. */
  giovanni: z.string().nullable(),
  war: z.boolean(),
  /** Heat's highest this region (the detective's quiet-quarter letter). */
  hotMax: I.min(0),
}).strict();
export type VoiceState = z.infer<typeof VoiceStateSchema>;
export const emptyVoice = (): VoiceState => ({ mark: null, radioOff: false, radioWasOff: false, radio: [], paper: [], inbox: [], sent: [], flags: [], giovanni: null, war: false, hotMax: 0 });
