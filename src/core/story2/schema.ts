// Story Overhaul v2, slice F0: the shapes of all story data (src/data/story/*.json), the profile/run/settings containers and the pure helpers
// (name sanitizing). Story code reads these; nothing here touches battle rules or gameplay RNG.
import { z } from 'zod';

export const Id = z.string().regex(/^[a-z][a-z0-9_]*$/);
export const Key = z.string().regex(/^[a-z][a-z0-9_.]*$/);
const Ver = z.number().int().min(1);
const Scalar = z.union([z.boolean(), z.number(), z.string()]);

/** A condition and an effect: `kind` picks the rule; the rest is the kind's own fields. Effects carry an id for the never-apply-twice ledger. */
export const CondSchema = z.object({ kind: Id }).catchall(z.unknown());
export const EffectSchema = z.object({ id: Id.optional(), kind: Id }).catchall(z.unknown());
const RoleSpec = z.object({ character: Id.optional(), pool: Id.optional() }).catchall(z.unknown());
const Beat = z.object({ id: Id, line: Id.optional(), kind: Id.optional() }).catchall(z.unknown());
const Choice = z.object({ id: Id, textKey: Key, effects: z.array(EffectSchema).default([]), goto: Id.optional() });
const Variant = z.object({ role: Id, id: Id, textKey: Key, when: z.array(CondSchema).default([]) });
const SlotRule = z.object({ slot: Id }).catchall(z.unknown());
const Branch = z.object({ id: Id, exit: Id.optional() }).catchall(z.unknown());

export const CharacterSchema = z.object({
  id: Id, v: Ver, nameKey: Key, age: z.number().int().min(0),
  role: z.enum(['rival', 'leader', 'elite', 'champion', 'villain', 'mentor', 'npc', 'family']),
  poses: z.record(Id, z.string()),
  tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  home: Id.optional(), party: z.array(Id).default([]),
  relationClass: z.enum(['friend', 'rival', 'mentor', 'stranger', 'family']),
  romanceable: z.boolean().default(false),
  tellings: z.array(Id).default([]),
  bio: z.array(z.object({ tier: z.number(), textKey: Key, spoiler: z.boolean() })),
  flags: z.array(Id).default([]),
});
export type StoryCharacter = z.infer<typeof CharacterSchema>;

export const EventSchema = z.object({
  id: Id, v: Ver, tags: z.array(Id), requires: z.array(CondSchema), roles: z.record(Id, RoleSpec),
  beats: z.array(Beat), choices: z.array(Choice), outputs: z.array(EffectSchema),
  variants: z.array(Variant), cost: z.number().int().min(0), tier: z.enum(['A', 'B', 'C']),
  moment: z.enum(['none', 'minor', 'major', 'landmark']).default('none'),
  /** Backstory module this event belongs to (for the parity gate). */
  backstory: Id.optional(),
});
export type StoryEvent = z.infer<typeof EventSchema>;

export const ArcSchema = z.object({
  id: Id, v: Ver, steps: z.array(z.object({ event: Id, onFail: Id.optional() })),
  nodeCost: z.number(), branches: z.array(Branch), effects: z.array(EffectSchema), exits: z.array(Id).min(1),
});

export const ThemeSchema = z.object({
  id: Id, letter: z.string().length(1), nameKey: Key, beatSheet: z.array(z.object({ act: z.number(), slot: Id })),
  slotRules: z.array(SlotRule), endings: z.array(Id).min(1), weight: z.number(), needs: z.array(Id).default([]),
  /** Twist clue slots and the slot that reveals the twist (for the clue-count gate). */
  twist: z.object({ revealSlot: Id, clueSlots: z.array(Id), minClues: z.number().int().min(0) }).optional(),
});

export const RemembranceSchema = z.object({
  id: Id, v: Ver, line: z.array(Id).min(1).max(3), types: z.array(Id).min(1).max(2), temperament: Id, affinity: z.record(Id, z.number()),
  unlock: z.object({ kind: z.enum(['start', 'quiz', 'win', 'mastery', 'event', 'backstory']), arg: z.string().optional() }),
  moves: z.array(Id), keystone: Id, status: z.enum(['supported', 'limited', 'disabled']),
  /** Quiz fields (S3): combat role, generation of origin, whether the line branches, whether stage 1 is a baby, and whether the quiz may offer it. */
  role: z.enum(['sweeper', 'tank', 'support', 'disruptor', 'trapper', 'pivot', 'scout']).optional(),
  generation: z.number().int().min(1).optional(),
  branching: z.boolean().default(false),
  baby: z.boolean().default(false),
  quizEligible: z.boolean().default(true),
});

export const MoveMomentSchema = z.object({
  id: Id, trigger: z.enum(['first_use', 'finisher', 'save', 'comeback', 'bond_move']), templateKey: Key, typeMap: z.record(Id, Key),
});

export const DialogueLineSchema = z.object({
  id: Id, speaker: Id, when: z.array(CondSchema), textKey: Key, tags: z.array(Id), pose: Id.optional(), bubble: Id.optional(), variantOf: Id.optional(),
});

export const LoreEntrySchema = z.object({
  id: Id, category: z.number().min(1).max(11), nameKey: Key, states: z.array(z.enum(['rumor', 'known', 'verified', 'contested'])),
  interpretations: z.array(z.object({ textKey: Key, sources: z.array(Id) })).default([]),
  sources: z.array(Id), related: z.array(Id).default([]), spoiler: z.boolean().default(false),
});

export const NewsTemplateSchema = z.object({ id: Id, category: Id, tokens: z.array(Id), when: z.array(CondSchema), outlets: z.record(Id, Key) });

export const InteractableSchema = z.object({
  id: Id, verbs: z.array(z.enum(['look', 'talk', 'take', 'use', 'read'])), outputs: z.array(EffectSchema), requires: z.array(CondSchema).default([]), icon: Id.optional(),
});

/** A backstory module (5 planned). `parity` lists the parity-checklist items it provides; `endings` the ones it can reach. */
export const BackstorySchema = z.object({
  id: Id, nameKey: Key, parity: z.array(Id), endings: z.array(Id), catchAllEnding: Id.optional(), signatureProp: Id.optional(),
  /** Module manifest (design doc, Backstory module system). Every id must exist; the Module Validator checks them. */
  events: z.array(Id).default([]), echoEvents: z.array(Id).default([]), encounterPools: z.array(Id).default([]),
  remembranceUnlocks: z.array(Id).default([]), exclusiveItem: Id.optional(),
  /** The ending grid: first matching row wins; the last row must have no conditions (the catch-all). */
  endingGrid: z.array(z.object({ ending: Id, when: z.array(CondSchema).default([]) })).default([]),
});

export const QuizQuestionSchema = z.object({
  id: Id, quick: z.boolean().default(false), textKey: Key,
  answers: z.array(z.object({ id: Id, textKey: Key, weights: z.record(Id, z.number()), tag: Id.optional() })).min(2),
});

/** S4: one Story Stop's contract (design Part V-B). `col` is the map column (League: the corridor step); null for a Region Gate or a Finale/Epilogue scene. */
export const STOP_CATEGORIES = ['narrative', 'character', 'conflict', 'discovery', 'relationship', 'branch', 'climax', 'resolution', 'recovery'] as const;
export const StopContractSchema = z.object({
  id: Id, stage: z.number().int().min(1), act: z.number().int().min(1).max(8), col: z.number().int().min(1).nullable(),
  category: z.enum(STOP_CATEGORIES), weight: z.enum(['main', 'side']), slotTags: z.array(Id), intensity: z.number().int().min(1).max(5),
  cinematic: z.boolean(), fallback: Id, locked: z.boolean(), lane: z.number().int().min(0), beat: z.number().int().min(1).max(7).optional(),
});
export type StopContract = z.infer<typeof StopContractSchema>;

export const StoryBlueprintSchema = z.object({
  id: Id, seed: z.string(), contentHash: z.string(), theme: Id, antagonist: Id,
  rivals: z.object({ primary: Id, secondary: Id, friendly: Id }), observer: Id.optional(),
  slots: z.array(z.object({ slot: Id, stop: z.number(), event: Id, fallbacks: z.array(Id) })),
  locks: z.array(Id), replans: z.array(z.object({ at: z.number(), reason: Id })),
  /** S4: the 44 Stop contracts in play order, and a checksum over the whole blueprint (a mismatch on load re-tells the story). */
  stops: z.array(StopContractSchema).default([]),
  checksum: z.string().default(''),
});
export type StoryBlueprint = z.infer<typeof StoryBlueprintSchema>;

export const SLOT_RULES_PLACEHOLDER = z.object({ weights: z.record(Id, z.number()).default({}) });

/** Everything `src/data/story/*.json` holds, parsed. Empty arrays are valid (F0 ships no content). */
export const StoryDataSchema = z.object({
  characters: z.array(CharacterSchema), events: z.array(EventSchema), arcs: z.array(ArcSchema), themes: z.array(ThemeSchema),
  remembrances: z.array(RemembranceSchema), moveMoments: z.array(MoveMomentSchema), dialogue: z.array(DialogueLineSchema),
  lore: z.array(LoreEntrySchema), news: z.array(NewsTemplateSchema), interactables: z.array(InteractableSchema),
  backstories: z.array(BackstorySchema), quiz: z.array(QuizQuestionSchema), blueprintRules: SLOT_RULES_PLACEHOLDER,
  text: z.record(Key, z.string()),
  hash: z.string(),
});
export type StoryData = z.infer<typeof StoryDataSchema>;

// ---------- save containers (profile v20, run v40, settings v39) ----------

export const PronounsSchema = z.object({ subj: z.string().max(12), obj: z.string().max(12), poss: z.string().max(12), reflexive: z.string().max(12) });

const ProfileStoryObject = z.object({
  protagonist: z.object({
    look: z.enum(['look_a', 'look_b']).default('look_a'), name: z.string().max(16).default(''), pronouns: z.union([z.string(), PronounsSchema]).default('they'), nameSet: z.boolean().default(false),
  }).default({ look: 'look_a', name: '', pronouns: 'they', nameSet: false }),
  prologue: z.object({ done: z.boolean().default(false), mode: z.enum(['full', 'quick', 'skipped']).default('full'), beatsSeen: z.array(z.string()).max(12).default([]) }).default({ done: false, mode: 'full', beatsSeen: [] }),
  quiz: z.object({ lastResult: z.object({ traitVector: z.record(z.string(), z.number()), picks: z.array(z.string()).max(3) }).nullable().default(null) }).default({ lastResult: null }),
  remembrance: z.record(z.string(), z.object({ state: z.enum(['locked', 'seen', 'unlocked']), firstSeenRun: z.number().int().nullable().default(null), runs: z.number().int().default(0), mastery: z.number().default(0) })).default({}),
  lore: z.record(z.string(), z.object({ state: z.enum(['rumor', 'known', 'verified', 'contested']), sources: z.array(z.string()).max(4).default([]) })).default({}),
  cast: z.record(z.string(), z.object({ tellings: z.array(z.string()).max(6).default([]), wins: z.number().int().default(0), losses: z.number().int().default(0), runs: z.array(z.string()).default([]) })).default({}),
  chronicles: z.array(z.unknown()).max(40).default([]),
  sceneSnapshots: z.array(z.unknown()).max(60).default([]),
  endingsSeen: z.array(z.string()).max(60).default([]),
  newBadges: z.array(z.string()).max(100).default([]),
  contentHashSeen: z.string().default(''),
});
export type ProfileStory = z.infer<typeof ProfileStoryObject>;
export const freshProfileStory = (): ProfileStory => ProfileStoryObject.parse({});
/** A damaged `story` object falls back to the defaults; the rest of the profile survives. */
export const ProfileStorySchema = ProfileStoryObject.catch(() => freshProfileStory()).default(freshProfileStory());

export const StoryV2Schema = z.object({
  mode: z.literal('story_run'),
  protagonist: z.object({ look: z.string(), name: z.string(), pronouns: z.union([z.string(), PronounsSchema]), backstory: z.string().optional(), signatureProp: z.string().optional() }).optional(),
  blueprintId: z.string().optional(),
  blueprint: StoryBlueprintSchema.optional(),
  contentHash: z.string().default(''),
  quiz: z.object({ traitVector: z.record(z.string(), z.number()), picks: z.array(z.string()) }).optional(),
  starter: z.object({ lineId: z.string(), temperament: z.string(), twist: z.string().optional(), keystone: z.array(z.string()).default([]) }).optional(),
  heartbondOverrides: z.number().int().min(0).default(0),
  cast: z.record(z.string(), z.object({
    stage: z.string(), attrs: z.record(z.string(), z.number()).default({}), memories: z.array(z.string()).default([]),
    /** S8 relationship record: flags (met, owes_player...), gate events passed, structured memories, the stage waiting to settle, last contact. */
    flags: z.record(z.string(), z.boolean()).default({}),
    gates: z.array(z.string()).default([]),
    mem: z.array(z.object({ tag: z.string(), salience: z.number().int().min(1).max(10), node: z.number().int().min(0) })).default([]),
    scenes: z.number().int().min(0).default(0),
    pending: z.string().nullable().default(null),
    last: z.object({ node: z.number().int().min(0), summary: z.string() }).nullable().default(null),
  })).default({}),
  arcs: z.record(z.string(), z.object({ state: z.string(), step: z.number().int().default(0), nodeCost: z.number().default(0) })).default({}),
  facts: z.record(z.string(), Scalar).default({}),
  stops: z.object({ index: z.number().int().default(0), planned: z.number().int().default(0), done: z.array(z.string()).default([]) }).default({ index: 0, planned: 0, done: [] }),
  replans: z.array(z.record(z.string(), Scalar)).default([]),
  /** W3: per-rival relationship record (Respect, Rivalry, Affection, Suspicion, 0 to 100) and the gate events passed. */
  rel: z.record(z.string(), z.object({ respect: z.number().int().min(0).max(100), rivalry: z.number().int().min(0).max(100), affection: z.number().int().min(0).max(100), suspicion: z.number().int().min(0).max(100), met: z.boolean().default(true), gates: z.array(z.string()).default([]) })).default({}),
  /** W3: hidden consequences waiting to surface (due is a linear stage number), the scenes already played and the consequences already fired. */
  queue: z.array(z.object({ id: z.string(), hidden: z.string(), rival: z.string(), due: z.number().int().min(0) })).default([]),
  scenesDone: z.array(z.string()).default([]),
  fired: z.array(z.string()).default([]),
});
export type StoryV2 = z.infer<typeof StoryV2Schema>;

export const STORY_SETTINGS_DEFAULTS = {
  intensity: 'full', dramaticMoments: 'full', autonomy: 'full', romance: 'off', activities: 'standard',
  subtitleSize: 'medium', subtitleStyle: 'boxed', spoilerGuard: true, journalVoice: 'vance',
} as const;
export const StorySettingsSchema = z.object({
  intensity: z.enum(['full', 'streamlined', 'minimal']).default('full'),
  dramaticMoments: z.enum(['off', 'quiet', 'full', 'prompt']).default('full'),
  autonomy: z.enum(['off', 'flavor', 'full']).default('full'),
  romance: z.enum(['off', 'on']).default('off'),
  activities: z.enum(['standard', 'quick']).default('standard'),
  subtitleSize: z.enum(['small', 'medium', 'large']).default('medium'),
  subtitleStyle: z.enum(['plain', 'boxed']).default('boxed'),
  spoilerGuard: z.boolean().default(true),
  journalVoice: z.enum(['vance', 'plain']).default('vance'),
});
export type StorySettings = z.infer<typeof StorySettingsSchema>;

/** Romance stays off until the director turns it on in balance.json (story.romanceEnabled). */
export function romanceEnabled(settings: { story?: StorySettings }, balanceFlag: boolean): boolean {
  return balanceFlag && settings.story?.romance === 'on';
}

// ---------- name sanitizing (rules from the design doc, Data schemas) ----------

const FORBIDDEN = /[\p{Cc}\p{Cf}‪-‮⁦-⁩<>{}%]/u;
const ALLOWED = /^[\p{L}\p{M}\p{N} \-'.]+$/u;
const segmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
export function graphemeCount(s: string): number {
  return segmenter ? [...segmenter.segment(s)].length : [...s].length;
}
/** The stored name, or null if the input is rejected. Trims and collapses spaces; 1 to 16 grapheme clusters; letters, marks, digits, space, hyphen, apostrophe, period only. */
export function sanitizeName(input: string): string | null {
  if (typeof input !== 'string' || input.length > 200 || FORBIDDEN.test(input)) return null;
  const name = input.normalize('NFC').replace(/\s+/g, ' ').trim();
  if (!name || graphemeCount(name) > 16 || !ALLOWED.test(name) || /^[\p{N} ]+$/u.test(name)) return null;
  return name;
}
