// Catalog Overhaul Pack (places, SF93 The Crystal Hollow): a permanent type shift. The Heart Crystal turns a Pokémon's second type
// into Rock, Ice or Fairy for the rest of the run (kept on the Pokémon as `shiftType`; optional field, no save change).
import type { Content, TypeName } from '../contentSchema';
import { getSpecies } from '../pokemon';
import type { PokemonInstance } from '../state';

/** The Pokémon's own types: its species' types, with the second one replaced by its shift (a single-typed one gains it as a second). */
export function ownTypes(content: Content, mon: Pick<PokemonInstance, 'speciesId' | 'shiftType' | 'crystal'>): readonly TypeName[] {
  const base = getSpecies(content, mon.speciesId).types;
  // Greenneedle gn.32: a carried Blue crystal changes the second type while it is carried.
  const shift = mon.crystal?.blue ?? mon.shiftType;
  if (!shift) return base;
  const first = base[0]!;
  return first === shift ? [first] : [first, shift];
}
