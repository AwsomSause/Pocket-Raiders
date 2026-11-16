// Greenneedle gn.new.23, The Appliance Shop (doc GREENNEEDLE_PLACED_2.md lines 104–142).
// Afterstory (within the run): the shop is a hub at a later town. One free held-item repair per visit:
// a berry the picked Pokémon holds has been used up in the field; Mr. Dufresne puts one back.
import type { RunState } from '../state';

/** Puts back one spent berry on the picked Pokémon. Returns the line to show. */
export function applianceRepair(run: RunState, pickedUid?: string): string {
  const mon = run.party.find((m) => m.uid === pickedUid);
  if (!mon) return '';
  const id = Object.keys(mon.held ?? {}).sort().find((k) => k.endsWith('-berry') && (mon.held![k] ?? 0) > 0);
  if (!id) return 'Mr. Dufresne turns it over twice. "Nothing wrong with it. Nothing at all. Pleasure to look."';
  mon.held = { ...mon.held, [id]: (mon.held![id] ?? 0) + 1 };
  return 'Mr. Dufresne mends what wore out. One more of what it was holding, as good as new.';
}
