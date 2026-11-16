// Greenneedle gn.new.20, The Drought Ranch (doc GREENNEEDLE_PLACED_2.md lines 10–42).
// Dig a second channel and the ranch has water to spare: a Fresh Milk at every rest stop for the rest of the region.
import type { Content } from '../contentSchema';
import { addItem } from '../items';
import type { RunState } from '../state';

export const FRESH_MILK = 'fresh-milk';

const f = (run: Pick<RunState, 'story'>, k: string): number => Number(run.story.flags[`ev:${k}`] ?? 0);

/** At a rest stop: a Fresh Milk from the ranch, in the region where the channel was dug. Returns the line to show, or ''. */
export function ranchRest(content: Content, run: Pick<RunState, 'story' | 'regionIndex' | 'inventory'>): string {
  if (f(run, 'ranch-dug') < 1 || f(run, 'ranch-dug-region') !== run.regionIndex + 1 || !(content.items.has(FRESH_MILK) || content.catalog.has(FRESH_MILK))) return '';
  addItem(run.inventory, FRESH_MILK, 1);
  return 'A can of Fresh Milk is waiting by the door, with a note: "From the ranch. Both channels are running."';
}
