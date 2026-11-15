// Catalog Overhaul (families-b, STORY_FAMILIES_6 SF41.7 "The Mirror Lake"): "six Pokémon the player could have caught and didn't".
// The species seen this run that were never caught and are not in the party, most recently seen first. Same-run memory only, no RNG.
import type { RunState } from '../state';

export function passedBy(run: RunState): string[] {
  const caught = new Set([...run.log.speciesCaught, ...run.party.map((m) => m.speciesId)]);
  const out: string[] = [];
  for (const id of [...run.log.speciesSeen].reverse()) if (!caught.has(id) && !out.includes(id)) out.push(id);
  return out;
}
