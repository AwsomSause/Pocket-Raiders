// Node Event Menus P5: the special entries (fork, linked, Rival Takes It, escort). Zod shapes for the data file and the
// run state. The state shape imports only Zod so the run's expansion block can embed it (run.expansion.nodeMenuSpecial,
// optional: old runs and runs with menus off never have it, so no save bump).

import { z } from 'zod';

/** Run state for the special entries. Every list keeps ids only; effects are looked up in the data file. */
export const NodeMenuSpecialStateSchema = z.object({
  /** Fork branches whose "later" half pays out at a later node: stage key, the column it pays at. */
  pending: z.array(z.object({ forkId: z.string(), branch: z.enum(['a', 'b']), stage: z.string(), atColumn: z.number().int().min(1) })).default([]),
  /** Linked entries started and waiting for their follow-up, which shows up in columns `from`..`until` of the same stage. */
  links: z.array(z.object({ linkId: z.string(), stage: z.string(), from: z.number().int().min(1), until: z.number().int().min(1) })).default([]),
  /** The escort in progress (one at a time). `lastNode` makes the node tick safe against re-composing the same node. */
  escort: z.object({ escortId: z.string(), stage: z.string(), nodesLeft: z.number().int().min(0), nerve: z.number().int().min(0), lastNode: z.string() }).nullable().default(null),
  /** Rival Takes It: what each rival took, and whether its level bonus was already used in a fight. */
  spoils: z.array(z.object({ rivalId: z.string(), entry: z.string(), stage: z.string(), spent: z.boolean() })).max(60).default([]),
  /** Keys of things already applied (forks chosen, links started/finished, escorts started), so nothing applies twice. */
  done: z.array(z.string()).default([]),
});
export type NodeMenuSpecialState = z.infer<typeof NodeMenuSpecialStateSchema>;
