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

// ---- Lantern 4: "Keep silent for a step: every choice that step is '…'" ----
/** The step the player stands on, as one number (region, stage and column); 0 off the stage map. */
const stepKey = (run: Pick<RunState, 'stage' | 'regionIndex'>): number => {
  const stage = run.stage;
  const node = stage && stage.kind === 'stage' ? stage.map.nodes.find((n) => n.id === stage.current) : undefined;
  return stage && node ? (run.regionIndex * 100 + stage.index) * 100 + node.column + 1 : 0;
};
/** gn op `foxSilence`: the silence is kept for the rest of this step (run flag `fox-silence` holds the step). */
export function foxSilence(run: RunState): string {
  run.story.flags['ev:fox-silence'] = stepKey(run);
  return '';
}
/** Is the player keeping silent on the step they stand on? (Every event choice there reads "…".) */
export function foxSilent(run: Pick<RunState, 'stage' | 'regionIndex' | 'story'>): boolean {
  const kept = Number(run.story.flags['ev:fox-silence'] ?? 0);
  return kept > 0 && kept === stepKey(run);
}
