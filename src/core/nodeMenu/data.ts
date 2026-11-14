// Beta 0.7 Node Event Menus: loads and checks src/data/nodeMenu.json once.

import raw from '../../data/nodeMenu.json';
import { NodeMenuDataSchema, type NodeMenuData } from './schema';

let cached: NodeMenuData | null = null;

export function nodeMenuData(): NodeMenuData {
  cached ??= NodeMenuDataSchema.parse(raw);
  return cached;
}
