// Beta 0.7 Node Event Menus: shapes for the data file (src/data/nodeMenu.json) and the run state
// (run.expansion.nodeMenus, optional, so no save bump). Pure data + Zod, no Phaser.

import { z } from 'zod';
import { EventEffectSchema } from '../contentSchema';
import { MenuCategorySchema } from './state';

export { MENU_CATEGORIES, MenuCategorySchema, type MenuCategory } from './state';

/** P4: a short repeatable entry, so menus never run dry. Effects are ordinary event effects. */
export const MicroEntrySchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  name: z.string().min(1),
  category: MenuCategorySchema,
  blurb: z.string().min(1),
  /** Not before this stage of the run (1 = the first). */
  minStage: z.number().int().min(1).default(1),
  effects: z.array(EventEffectSchema).min(1),
});
export type MicroEntry = z.infer<typeof MicroEntrySchema>;

export const NodeMenuDataSchema = z.object({
  /** How many entries a menu has (2 to 5), by weight. */
  sizeWeights: z.record(z.enum(['2', '3', '4', '5']), z.number().min(0)),
  /** Optional picks per node: `base`, or `bonus` on gym-eve, plaza and 5-entry nodes. */
  picks: z.object({ base: z.number().int().min(1), bonus: z.number().int().min(1) }),
  /** Required entries per node, counting the node's own battle. Never two required battles. */
  maxRequired: z.number().int().min(1).max(2),
  micro: z.array(MicroEntrySchema).min(2),
  /** P1: hand-set categories for events the rules in tags.ts get wrong (event id -> category). */
  tagOverrides: z.record(z.string(), MenuCategorySchema).default({}),
}).refine((d) => new Set(d.micro.map((m) => m.id)).size === d.micro.length, { message: 'micro entry ids must be unique' })
  .refine((d) => new Set(d.micro.map((m) => m.category)).size >= 2, { message: 'micro entries need at least two categories' });
export type NodeMenuData = z.infer<typeof NodeMenuDataSchema>;

