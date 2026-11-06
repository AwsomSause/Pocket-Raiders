// Tuning for Battle/AI batch 3 (S157 Focus stat, S158 Ability Awakening). Values: balance.json `growthStats`; rules: growthStats.ts.

import { z } from 'zod';

export const GrowthStatsSchema = z.object({
  /** S157 Focus (0-100, from friendship): at 100 Focus, accuracy x(1 + accuracy) and crit chance + crit. 0 = off. */
  focus: z.object({ accuracy: z.number().min(0).max(1), crit: z.number().min(0).max(1) }),
  /** S158: ability uses that reach each Awakening level (ascending), and the extra damage per level. */
  awakening: z.object({ uses: z.array(z.number().int().min(1)), damagePerLevel: z.number().min(0).max(1) }),
});
export type GrowthStats = z.infer<typeof GrowthStatsSchema>;

export const DEFAULT_GROWTH_STATS: GrowthStats = { focus: { accuracy: 0.1, crit: 0.04 }, awakening: { uses: [10, 30, 60], damagePerLevel: 0.04 } };
