// Beta 0.6 slice E1 (part 1): the cast dossier. Lookups over src/data/expansion (143 characters, 110 special Pokémon, 58 Shadows).
// Custom species such as Alphayena and Megawattrel use the game's own species entries (decision W): a special Pokémon row only
// names species; it never defines one.

import type { ExpansionCharacter, ExpansionData, ExpansionRegion, SpecialPokemon } from '../data';

/** Special-Pokémon slots by rank (plan E1): 0 for a Grunt, 1 for a Specialist or Lieutenant, 2 for Commanders and above. Ranks read "Specialist (2)"; no number (an Ally) means 0. */
export function specialSlotsForRank(rank: string): 0 | 1 | 2 {
  const n = Number(/\((\d+)\)/.exec(rank)?.[1] ?? 0);
  return n >= 4 ? 2 : n >= 2 ? 1 : 0;
}

export interface CastIndex {
  character(id: string): ExpansionCharacter | undefined;
  byRegion(region: ExpansionRegion): ExpansionCharacter[];
  byTeam(team: string): ExpansionCharacter[];
  specialPokemonOf(team: string): SpecialPokemon[];
  /** Special Pokémon that belong to a variant line's region. */
  specialPokemonIn(region: ExpansionRegion): SpecialPokemon[];
}

export function buildCastIndex(data: Pick<ExpansionData, 'characters' | 'specialPokemon'>): CastIndex {
  const chars = new Map(data.characters.map((c) => [c.id, c]));
  return {
    character: (id) => chars.get(id),
    byRegion: (region) => data.characters.filter((c) => c.region === region),
    byTeam: (team) => data.characters.filter((c) => c.team === team),
    specialPokemonOf: (team) => data.specialPokemon.filter((p) => p.team === team),
    specialPokemonIn: (region) => data.specialPokemon.filter((p) => p.region === region),
  };
}
