// The saved shape of a run's Legendary Blessing (kept apart from the rules so the run schema can import it without a cycle).

import { z } from 'zod';

export const BLESSING_TIERS = ['lesser', 'greater', 'divine', 'primordial', 'origin'] as const;
export type BlessingTier = (typeof BLESSING_TIERS)[number];

/** The run's blessing. Optional on the run (old saves have none; no save-version bump). */
export const BlessingStateSchema = z.object({
  id: z.string(),
  tier: z.enum(BLESSING_TIERS),
  /** Hidden "attention" score. Starts at the tier's value; Signs, Echoes and the Trial are not built yet, so nothing raises it. */
  influence: z.number().int().min(0),
  /** The opening has been shown (so resuming a saved run does not replay it). */
  seen: z.boolean().default(false),
  /** Regions where Sacred Ash has already been used. */
  ashRegions: z.array(z.number().int()).default([]),
  /** Communion: the player has obtained this blessing's own Legendary. The blessing becomes its stronger form. */
  communion: z.boolean().default(false),
  /** The Rite (one act per run) has been used. */
  riteUsed: z.boolean().default(false),
  /** Stages (`region:stage`) whose first battle has been fought (for first-battle-of-the-stage blessings). */
  stagesDone: z.array(z.string()).default([]),
});
export type BlessingState = z.infer<typeof BlessingStateSchema>;

