import type { Content } from '../contentSchema';
import type { RunState } from '../state';
import type { StoryTriggerKind } from './schema';

/** How many times a moment has happened this run (counted when it is told), and whether its per-run cap is spent. */
export const momentCountKey = (defId: string) => `mc:${defId}`;
export function momentCapped(content: Content, run: Pick<RunState, 'story'>, trigger: StoryTriggerKind): boolean {
  const def = content.story.definitions.find((d) => d.triggerConditions.trigger === trigger);
  if (!def) return false;
  const r = content.story.rarity;
  return Number(run.story.flags[momentCountKey(def.id)] ?? 0) >= (r.perRunCaps[trigger] ?? r.perRunCap);
}
