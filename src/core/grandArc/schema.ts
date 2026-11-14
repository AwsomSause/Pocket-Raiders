// The Grand Arc (Beta 0.6 slice E7): Data ROMs from Cipher's liaisons and the Stock track. Pure data + Zod, no Phaser.

import { z } from 'zod';

/** `run.expansion.grandArc`. Present only when the Grand Arc setting was on when the run started. */
export const GrandArcStateSchema = z.object({
  /** Data ROMs earned in their own region ("K"); each opens one lock on XD001 and one bank of tanks. */
  roms: z.array(z.string()).default([]),
  /** ROMs taken late from their liaison at the finale: a bank of tanks, no lock. */
  late: z.array(z.string()).default([]),
  /** Stock steps gained so far (1 to 5, each at most once). */
  stock: z.array(z.number().int().min(1).max(5)).default([]),
  /** Region ids whose liaison left unbeaten (they return at the finale). */
  left: z.array(z.string()).default([]),
});
export type GrandArcState = z.infer<typeof GrandArcStateSchema>;
export const freshGrandArc = (): GrandArcState => GrandArcStateSchema.parse({});

/**
 * Beta 0.7 epilogue (E10/E11/D1): what the run's two optional last chapters (the Citadark finale and the Region of Doom) are
 * set to do, and how they ended. Optional block on `run.expansion` (no save bump); an older run has none. In-run only: nothing here is kept between runs.
 */
export const FINALE_RESULTS = ['sung', 'silent', 'sold', 'declined'] as const;
export const DOOM_RESULTS = ['cleared', 'fled', 'declined'] as const;
export const EpilogueStateSchema = z.object({
  /** The Citadark finale is on for this run (settings `finaleEnabled` at run start; it still needs the Grand Arc and three ROMs). */
  finale: z.boolean().default(false),
  /** The Region of Doom epilogue is on for this run (setting `doomEpilogue` at run start). */
  doom: z.boolean().default(false),
  /** How the finale ended (written once). A lost or declined finale never undoes the won run. */
  finaleResult: z.enum(FINALE_RESULTS).optional(),
  /** The Rainbow Door: `empty` (no Apex was lost), or `open` (one was; its world stays a faction in the Region of Doom). */
  rainbow: z.enum(['empty', 'open']).optional(),
  /** Choices made in the finale's cards (greevil, machines, trio, ...), by card id. */
  picks: z.record(z.string(), z.string()).default({}),
  /** How the Region of Doom ended (written once), with the Doom Marks won and the districts taken back. */
  doomResult: z.enum(DOOM_RESULTS).optional(),
  marks: z.number().int().min(0).max(8).default(0),
  taken: z.array(z.string()).default([]),
});
export type EpilogueState = z.infer<typeof EpilogueStateSchema>;
