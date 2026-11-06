// Training Camps (ideas S46): up to two Pokémon waiting in the Box can be sent to a camp. Every battle you win,
// each camper trains and gains experience, so a benched Pokémon keeps growing. Assignments live in run
// `itemCounters` (`camp:<uid>` = 1), so there is no save change.

import type { Content } from './contentSchema';
import { gainXp } from './pokemon';
import { runLevelCap } from './regions';
import type { PokemonInstance, RunState } from './state';

export const CAMP_RULES = { slots: 2, xpPerRegion: 30 } as const;
const key = (uid: string) => `camp:${uid}`;

/** The Box Pokémon currently in camp (a camper that left the Box is no longer counted). */
export function campers(run: Pick<RunState, 'box' | 'itemCounters'>): PokemonInstance[] {
  return run.box.filter((m) => (run.itemCounters?.[key(m.uid)] ?? 0) > 0);
}

/** Why this Box Pokémon cannot be sent to camp, or null. */
export function campProblem(run: Pick<RunState, 'box' | 'itemCounters'>, uid: string): string | null {
  if (!run.box.some((m) => m.uid === uid)) return 'Only Pokémon waiting in the Box can train at camp.';
  if ((run.itemCounters?.[key(uid)] ?? 0) > 0) return null;
  return campers(run).length >= CAMP_RULES.slots ? `The camp only has ${CAMP_RULES.slots} places.` : null;
}

/** Sends a Box Pokémon to camp, or calls it back. Returns the message. */
export function toggleCamp(run: RunState, uid: string): string {
  const problem = campProblem(run, uid);
  if (problem) throw new Error(problem);
  const going = !((run.itemCounters?.[key(uid)] ?? 0) > 0);
  run.itemCounters = { ...run.itemCounters, [key(uid)]: going ? 1 : 0 };
  return going ? 'Sent to the training camp.' : 'Called back from camp.';
}

/** After a won battle: every camper gains experience (never past the level cap). Returns what each gained. */
export function trainCampers(content: Content, run: RunState): { uid: string; levels: number }[] {
  const amount = CAMP_RULES.xpPerRegion * (run.regionIndex + 1);
  const cap = runLevelCap(content, run);
  return campers(run).map((m) => ({ uid: m.uid, levels: gainXp(content, m, amount, cap).levelsGained }));
}
