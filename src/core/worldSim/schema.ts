// W8: what `story.sim` holds. Pure schema, so story/schema.ts can import it without a cycle.
import { z } from 'zod';

/** What `story.sim` holds (optional on the story state, so no save bump). */
export const WorldSimSchema = z.object({
  clock: z.number().int().min(0),
  rumors: z.array(z.object({ id: z.string(), text: z.string(), shown: z.boolean() })).max(12),
  mystery: z.array(z.object({ id: z.string(), name: z.string(), dungeon: z.string(), at: z.number().int().min(0), found: z.boolean() })).max(8),
  disturbances: z.array(z.object({ region: z.number().int(), stage: z.number().int() })).max(6),
  heard: z.record(z.string(), z.boolean()),
  seen: z.object({ dungeons: z.array(z.string()).max(40), pseudo: z.array(z.string()).max(40) }),
  flagsDone: z.array(z.string()).max(60),
});
export type WorldSim = z.infer<typeof WorldSimSchema>;
export const freshWorldSim = (): WorldSim => ({ clock: 0, rumors: [], mystery: [], disturbances: [], heard: {}, seen: { dungeons: [], pseudo: [] }, flagsDone: [] });

