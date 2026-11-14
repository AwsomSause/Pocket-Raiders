// Beta 0.7 L3 Rewinds: the optional `run.expansion.rewind` block (core/rewind.ts). Zod only, so state.ts can import it.

import { z } from 'zod';

/** One change: set `v` at path `p`, delete path `p` (`d`), or cut the array at `p` to length `n`. */
export const PatchOpSchema = z.object({ p: z.array(z.union([z.string(), z.number().int().min(0)])), v: z.unknown().optional(), d: z.literal(1).optional(), n: z.number().int().min(0).optional() });
export type PatchOp = z.infer<typeof PatchOpSchema>;

export const RewindStateSchema = z.object({
  /** Who granted the rewinds: the setting (test switch), or a blessing/promise once those slices call `grantRewinds`. */
  source: z.string(),
  /** The stage the run snapshot belongs to (`region:stage`) and how many rewinds were used in it. */
  stageKey: z.string().default(''),
  usedThisStage: z.number().int().min(0).default(0),
  /** Rewinds used this run, all kinds. */
  used: z.number().int().min(0).default(0),
  /** The run snapshot: the run as this stage began (without this block, the checkpoint or the recorder). */
  base: z.record(z.string(), z.unknown()).optional(),
  /** Which battle `turns` belongs to, and the patches (oldest first). */
  battleKey: z.string().nullable().default(null),
  turns: z.array(z.object({ turn: z.number().int(), patch: z.array(PatchOpSchema) })).default([]),
});
export type RewindState = z.infer<typeof RewindStateSchema>;

