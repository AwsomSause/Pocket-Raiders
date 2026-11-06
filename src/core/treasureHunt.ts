// Treasure Hunt Season (idea S150): a map in five pieces, found one at a time over several runs.
// Run events set `ev:th-piece-N` when a piece is found; a finished run folds them into the profile, and every new
// run starts with the pieces already held. The last event pays once when all five are held. Pure; no RNG.

import { z } from 'zod';
import type { RunState } from './state';
import type { StoryState } from './story/schema';

export const TREASURE_PIECES = 5;

export const TreasureHuntSchema = z.object({
  /** Which pieces (1 to 5) the player holds. */
  pieces: z.array(z.number().int().min(1).max(TREASURE_PIECES)),
  /** The treasure has been dug up: nothing more to find. */
  claimed: z.boolean(),
});
export type TreasureHunt = z.infer<typeof TreasureHuntSchema>;
export const freshTreasureHunt = (): TreasureHunt => ({ pieces: [], claimed: false });

/** Puts the pieces already held (and a claimed treasure) into a new run's story flags. */
export function seedTreasureHunt<S extends Pick<StoryState, 'flags'>>(story: S, hunt: TreasureHunt | undefined): S {
  if (!hunt) return story;
  for (const n of hunt.pieces) story.flags[`ev:th-piece-${n}`] = 1;
  if (hunt.claimed) story.flags['ev:th-claimed'] = 1;
  return story;
}

/** Folds a finished run's flags into the hunt (returns a new hunt): pieces found are kept, a dug-up treasure ends it. */
export function foldTreasureHunt(hunt: TreasureHunt, run: Pick<RunState, 'story'>): TreasureHunt {
  const found = new Set(hunt.pieces);
  for (let n = 1; n <= TREASURE_PIECES; n++) if (Number(run.story.flags[`ev:th-piece-${n}`] ?? 0) > 0) found.add(n);
  const claimed = hunt.claimed || Number(run.story.flags['ev:th-claimed'] ?? 0) > 0;
  return { pieces: [...found].sort((a, b) => a - b), claimed };
}
