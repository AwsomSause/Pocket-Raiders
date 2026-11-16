// Catalog overhaul, families-a (SF16 The Hollow Lantern): the Pokémon the player let go this run.
// Same-run memory only (Kice 2026-11-14): the lantern bears the name of the last Pokémon released this run.
// Pure, no RNG. The run flags hold it: `ev:released-count` (a number events can read), `co:released` (species id)
// and `co:released-level`.

import type { Content } from '../contentSchema';
import type { PokemonInstance, RunState } from '../state';

type Run = Pick<RunState, 'story'>;

/** Called when the player releases a Pokémon (run.ts): remembers it for the lantern. */
export function noteReleased(run: Run, mon: Pick<PokemonInstance, 'speciesId' | 'level'>): void {
  const flags = run.story.flags;
  flags['ev:released-count'] = Number(flags['ev:released-count'] ?? 0) + 1;
  flags['co:released'] = mon.speciesId;
  flags['co:released-level'] = mon.level;
}

/** The last Pokémon released this run, or undefined. */
export function lastReleased(run: Run): { speciesId: string; level: number } | undefined {
  const speciesId = run.story.flags['co:released'];
  if (typeof speciesId !== 'string' || !speciesId) return undefined;
  return { speciesId, level: Math.max(1, Number(run.story.flags['co:released-level'] ?? 5)) };
}

/** Fills {released} (its name) and {releasedType} (its first type) in event text. Without a release, "the one you let go" and "pale". */
export function fillFamiliesAText(content: Content, run: Run, text: string): string {
  if (!text.includes('{released')) return text;
  const mon = lastReleased(run);
  const species = mon ? content.species.get(mon.speciesId) : undefined;
  return text
    .replace(/\{releasedType\}/g, species ? String(species.types[0]) : 'pale')
    .replace(/\{released\}/g, species ? species.name : 'the one you let go');
}
