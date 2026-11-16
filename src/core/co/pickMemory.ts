// Catalog Overhaul (families-b, STORY_FAMILIES_6 "Who Keeps Watch"): the Pokémon a "pick a Pokémon" choice named is remembered
// for the rest of the run, so the scenes that follow can act on it (`who: 'picked'`, the `picked` condition). Same-run memory only.
import type { RunState } from '../state';

const KEY = 'co:picked';

/** Remembers the picked Pokémon (the lead when the choice was taken without a pick). */
export function rememberPick(run: RunState, uid?: string): void {
  const mon = run.party.find((m) => m.uid === uid) ?? run.party.find((m) => m.hp > 0) ?? run.party[0];
  if (mon) run.story.flags[KEY] = mon.uid;
}

/** The remembered Pokémon, if it is still in the party. */
export function rememberedPick(run: RunState): RunState['party'][number] | undefined {
  const uid = run.story.flags[KEY];
  return typeof uid === 'string' ? run.party.find((m) => m.uid === uid) : undefined;
}
