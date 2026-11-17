// Greenneedle gn.new.31, the Fox at the Shrine: nine lanterns, nine small tasks across a region.
// gn op `giveDearest` (`key`): the seventh lantern asks for "the item you'd least like to give": the rarest item in the Bag
// that is not a key item is given away (one copy; ties go to the item id's order). The run flag `key` becomes 1, or 0 when
// the Bag held nothing to give.
import type { Content } from '../contentSchema';
import type { RunState } from '../state';
import { bagEntries } from '../bag';
import { consumeItem } from '../items';

const RANK: Record<string, number> = { common: 0, uncommon: 1, rare: 2, epic: 3 };

export function giveDearest(content: Content, run: RunState, key: string): string {
  const give = bagEntries(content, run)
    .filter((e) => e.source === 'bag' && e.pocket !== 'key' && (run.inventory[e.itemId] ?? 0) > 0)
    .sort((a, b) => (RANK[b.rarity ?? 'common'] ?? 0) - (RANK[a.rarity ?? 'common'] ?? 0) || a.itemId.localeCompare(b.itemId))[0];
  run.story.flags[`ev:${key}`] = give ? 1 : 0;
  if (!give) return '';
  consumeItem(run.inventory, give.itemId);
  return `Given away: ${give.name}`;
}
