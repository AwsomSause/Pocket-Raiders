// Shadow II: handing the player a Named Shadow (an event effect). Kept apart from keys.ts because it needs the run's Pokémon maker.

import type { Content } from '../contentSchema';
import { newMon } from '../run';
import type { PokemonInstance, RunState } from '../state';
import { noteShadow } from '../expansion/fieldNotes';
import { keyOf } from './data';

/** Builds a Named Shadow Pokémon: its Shadow II fields set and hint one given. Null for an unknown id or species. */
export function makeNamedShadow(content: Content, run: RunState, ssId: string, level: number): PokemonInstance | null {
  const key = keyOf(ssId);
  if (!key || !content.species.get(key.speciesId)) return null;
  const mon = newMon(content, run, key.speciesId, level, 'p');
  mon.shadow = { heart: key.corruption, named: ssId, hints: 1 };
  return mon;
}

/** Offers a Named Shadow through the normal "caught" decision (party, PC or release). Returns the Pokémon's name, or null. */
export function grantNamedShadow(content: Content, run: RunState, ssId: string, level: number): string | null {
  const mon = makeNamedShadow(content, run, ssId, level);
  if (!mon) return null;
  noteShadow(run, ssId, 1);
  run.pending.unshift({ kind: 'caught', mon });
  return content.species.get(mon.speciesId)?.name ?? mon.speciesId;
}
