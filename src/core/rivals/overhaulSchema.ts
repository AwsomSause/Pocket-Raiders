// Rival overhaul state (R1-R3, R10): per-rival role lock, Lead, Marks, six feelings and the first-stage pity counter.
// Zod only (no other imports) so the run's expansion block can embed it. Lives at run.expansion.rival[rivalId].

import { z } from 'zod';

export const FEELING_KEYS = ['friendship', 'respect', 'trust', 'rivalry', 'resentment', 'admiration'] as const;
export type FeelingKey = (typeof FEELING_KEYS)[number];

export const RivalOverhaulStateSchema = z.object({
  /** Locked when first met; never changes for the rest of the run. */
  role: z.enum(['main', 'friend']),
  personality: z.string(),
  style: z.string(),
  arc: z.string(),
  /** Who is ahead: +1 per rival win, -1 per rival loss, kept in -3..+3. Never changes levels. */
  lead: z.number().int().min(-3).max(3).default(0),
  /** At most 5, oldest dropped first. */
  marks: z.array(z.string()).max(5).default([]),
  feelings: z.object({
    friendship: z.number().int().min(0).max(10),
    respect: z.number().int().min(0).max(10),
    trust: z.number().int().min(0).max(10),
    rivalry: z.number().int().min(0).max(10),
    resentment: z.number().int().min(0).max(10),
    admiration: z.number().int().min(0).max(10),
  }),
  /** Straight losses by this rival in first-stage fights; any rival win resets it (R10). */
  pityLosses: z.number().int().min(0).default(0),
  /** R4 scouting ledger: what this rival has seen of you, this run only. Optional, so older runs load unchanged. */
  ledger: z
    .object({
      moves: z.array(z.string()).max(60).default([]),
      items: z.array(z.string()).max(30).default([]),
      abilities: z.array(z.string()).max(30).default([]),
      species: z.array(z.string()).max(60).default([]),
      /** Battles scouted, turns watched and the turns you switched (for switch prediction). */
      turns: z.number().int().min(0).default(0),
      switches: z.number().int().min(0).default(0),
    })
    .optional(),
  /** R5: dialogue lines already said this run (stable keys), so none repeats until all are used. */
  bankUsed: z.array(z.string()).max(400).optional(),
  /** R6: meetings so far by region index, and whether the catch step-in happened there. */
  presence: z.record(z.string(), z.object({ meetings: z.number().int().min(0), stepIn: z.boolean().default(false) })).optional(),
});
export type RivalOverhaulState = z.infer<typeof RivalOverhaulStateSchema>;
