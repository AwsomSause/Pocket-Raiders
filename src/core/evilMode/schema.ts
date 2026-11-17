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

export const EvilModeBlockSchema = z.object({
  /** The block's own version, for its own migrations. */
  v: z.literal(1),
  from: z.enum(['founding', 'charter', 'turn']),
  /** Copied from Settings at founding, so a setting changed mid-run never changes this run. */
  settings: z.object({ length: RunLengthSchema }),
  team: EvilTeamSchema,
  here: z.object({ region: z.number().int().min(0), stage: z.number().int().min(1).max(8), day: z.number().int().min(1), beat: BeatSchema }),
  /** How many numbers each stream has given out (design Part 30 section 5.1). */
  draws: z.record(z.enum(STREAMS), z.number().int().min(0)),
  /** Ids of things that happened once and can't again (section 6.4). */
  applied: z.array(z.string()),
}).strict();
export type EvilModeBlock = z.infer<typeof EvilModeBlockSchema>;
