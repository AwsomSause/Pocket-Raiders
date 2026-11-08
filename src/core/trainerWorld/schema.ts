// Beta 0.5 M1/M2 (§3 "Main Character Syndrome"): one shared record for every trainer the player meets.
// Run state only (stored in run.story.trainers, optional, so older saves load without it and need no save bump).
// Pure data: no Phaser, no gameplay RNG.

import { z } from 'zod';

export const SPECIALIZATIONS = ['offensive', 'defensive', 'status', 'weather', 'setup', 'trickRoom', 'balanced', 'improviser'] as const;
export const SpecializationSchema = z.enum(SPECIALIZATIONS);
export type Specialization = z.infer<typeof SpecializationSchema>;

/** How well off a trainer is: it limits the items they carry (M1 items). 0 = struggling, 3 = wealthy. */
export const WealthSchema = z.number().int().min(0).max(3);

/** A moment in a trainer's past worth remembering and mentioning (limited list, newest last). */
export const TrainerNoteSchema = z.object({
  kind: z.enum(['won', 'lost', 'ace-lost', 'ace-evolved', 'mastered', 'bonded', 'counter-plan', 'fame', 'mentored']),
  /** Stage number of the run when it happened. */
  stage: z.number().int().min(0),
  /** Optional species or move id the note is about. */
  subject: z.string().optional(),
});
export type TrainerNote = z.infer<typeof TrainerNoteSchema>;

export const TrainerRecordSchema = z.object({
  /** Stable id: the boss/leader id, the rival id, or `class:<classId>:<name>` for ordinary trainers. */
  key: z.string().min(1),
  name: z.string(),
  classId: z.string(),
  leaderId: z.string().nullable(),
  specialization: SpecializationSchema,
  wealth: WealthSchema,
  /** Battles fought against the player and their results (from the trainer's point of view). */
  meetings: z.number().int().min(0).default(0),
  wins: z.number().int().min(0).default(0),
  losses: z.number().int().min(0).default(0),
  /** Stage number of the last meeting. */
  lastStage: z.number().int().min(-1).default(-1),
  /** Their strongest Pokémon (species id) as last seen. */
  ace: z.string().nullable().default(null),
  /** Their bond: the two species closest to each other and the friendship the pair reached (0-255). */
  bond: z.object({ a: z.string(), b: z.string(), friendship: z.number().int().min(0).max(255) }).nullable().default(null),
  /** Times the trainer's Pokémon used a move across meetings (key `species:move`). Feeds their move mastery. */
  moveUses: z.record(z.string(), z.number().int().min(0)).default({}),
  /** -100 (infamous) to 100 (famous): how the world rates them, moved by wins, losses and big results. */
  reputation: z.number().int().min(-100).max(100).default(0),
  notes: z.array(TrainerNoteSchema).default([]),
  /** The Pokémon of yours that last beat them (species and its types): they remember it and plan for it. */
  beatenBy: z.object({ speciesId: z.string(), types: z.array(z.string()) }).nullable().default(null),
});
export type TrainerRecord = z.infer<typeof TrainerRecordSchema>;

export const TrainerWorldSchema = z.record(z.string(), TrainerRecordSchema);
export type TrainerWorld = z.infer<typeof TrainerWorldSchema>;

export const TRAINER_NOTES_KEPT = 12;
