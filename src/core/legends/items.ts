// Signature item pictures for every Legendary, Mythical and Ultra Beast species (art only; no new item rules).
// Data: src/data/legendItems.json. Pictures: public/assets/images/items/legend/<speciesId>.png (32x32), asset id `item.legend/<speciesId>`.
// Blessings use these as their object picture. Never touches RNG, so old seeds are unchanged.

import { z } from 'zod';
import raw from '../../data/legendItems.json';

const LegendItemsSchema = z.object({
  note: z.string(),
  status: z.literal('supported'),
  items: z.record(z.string().min(1), z.object({ name: z.string().min(1), look: z.string().min(1) })),
});
export const LEGEND_ITEMS = LegendItemsSchema.parse(raw).items;

/** Asset id of a species' signature item picture, or null for a species without one. */
export const legendItemIcon = (speciesId: string): string | null => (LEGEND_ITEMS[speciesId] ? `item.legend/${speciesId}` : null);
/** Signature item name of a species, or null. */
export const legendItemName = (speciesId: string): string | null => LEGEND_ITEMS[speciesId]?.name ?? null;
