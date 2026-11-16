// Catalog Overhaul (families-b, STORY_FAMILIES_6 SF37 "The Captain's Chest"): the captain's compass is a key item for the run
// ("sea nodes show their hazards"). While its flag is set, every new stage shows its hidden Water-type event stops, and on a
// Water-themed stage its hidden Biome Hazard stops too, instead of "?". Pure, no RNG.
import type { Content } from '../contentSchema';
import type { RunState } from '../state';

export const COMPASS_FLAG = 'ev:chest-compass';

/** Reveals the stage's sea stops for a compass holder; returns how many were revealed. */
export function compassReveal(content: Content, run: RunState): number {
  const stage = run.stage;
  if (!stage || !(Number(run.story.flags[COMPASS_FLAG] ?? 0) > 0)) return 0;
  const sea = stage.themeId.split('-').includes('water');
  let shown = 0;
  for (const node of stage.map.nodes) {
    for (const side of node.sides) {
      if (side.kind !== 'event' || !side.hidden || !side.eventId) continue;
      const ev = content.events.get(side.eventId);
      if (!ev || !(ev.types.includes('water') || (sea && ev.group === 'Biome Hazards'))) continue;
      delete side.hidden;
      shown++;
    }
  }
  return shown;
}
