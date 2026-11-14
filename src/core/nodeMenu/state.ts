// Beta 0.7 Node Event Menus: the run state (run.expansion.nodeMenus, optional, so no save bump) and the menu categories.
// Kept apart from schema.ts so expansion/schema.ts can import it without pulling in contentSchema.

import { z } from 'zod';

/** P1: the menu category every entry (and every event) carries, so a menu can mix kinds. */
export const MENU_CATEGORIES = ['battle', 'treasure', 'shop', 'recovery', 'social', 'training', 'story', 'explore', 'challenge'] as const;
export const MenuCategorySchema = z.enum(MENU_CATEGORIES);
export type MenuCategory = z.infer<typeof MenuCategorySchema>;

/** What an entry opens: the node's own battle, a side stop, a micro entry, or a special entry (P5, core/nodeMenu/special). */
export const NodeMenuEntrySchema = z.object({
  id: z.string(),
  kind: z.string(),
  category: MenuCategorySchema,
  /** Must be done before the player may leave the node. */
  required: z.boolean(),
  /** Story-critical: never trimmed, never locked, does not use a pick. */
  keep: z.boolean().default(false),
  label: z.string(),
  sideId: z.string().optional(),
  microId: z.string().optional(),
  /** P5 special entries: their own id and data. */
  specialId: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  /** Micro and special entries: played. (A side entry is done when its stop is used.) */
  done: z.boolean().default(false),
});
export type NodeMenuEntry = z.infer<typeof NodeMenuEntrySchema>;

export const NodeMenuSchema = z.object({
  nodeId: z.string(),
  entries: z.array(NodeMenuEntrySchema),
  /** Optional picks allowed here. */
  picks: z.number().int().min(0),
  /** Entry ids picked (optional ones only). */
  picked: z.array(z.string()).default([]),
  /** Side stops on this node that did not make the menu: hidden while menus are on. */
  dropped: z.array(z.string()).default([]),
  /** The player left the node: the menu is over. */
  closed: z.boolean().default(false),
});
export type NodeMenu = z.infer<typeof NodeMenuSchema>;

/** run.expansion.nodeMenus: present only in runs started with the setting on. Menus of the current stage, by node id. */
export const NodeMenuStateSchema = z.object({
  stage: z.string().default(''),
  menus: z.record(z.string(), NodeMenuSchema).default({}),
  /** Totals for the pacing report: menus shown, picks made, micro entries played, entries skipped. */
  tally: z.object({ menus: z.number().int().min(0).default(0), picks: z.number().int().min(0).default(0), micro: z.number().int().min(0).default(0), skipped: z.number().int().min(0).default(0) }).default({ menus: 0, picks: 0, micro: 0, skipped: 0 }),
});
export type NodeMenuState = z.infer<typeof NodeMenuStateSchema>;
