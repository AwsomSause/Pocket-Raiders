import type { Content } from '../contentSchema';
import { getSpecies, maxHp } from '../pokemon';
import type { PokemonInstance } from '../state';
import type { SpectacleBattle } from './spectacle';

// Berserk Mode (S385): a few rage-prone species (balance.spectacle.berserk.species) lose control once, when badly hurt.
// For a few turns they pick their own strongest move, hit harder, and hurt themselves a little each turn.
// Pure rules; the engine (engine.ts) calls these. No random numbers.

/** Whether this species (or the base of its form) is on the berserker list. */
export function isBerserker(content: Content, mon: PokemonInstance): boolean {
  const species = getSpecies(content, mon.speciesId);
  const list = content.balance.spectacle.berserk.species;
  return list.includes(species.id) || (!!species.form && list.includes(species.form.base));
}

/** Whether this Pokémon goes berserk now: on the list, still standing, hurt enough, and not berserk yet this battle. */
export function berserkDue(content: Content, spec: SpectacleBattle, mon: PokemonInstance): boolean {
  if (spec.berserk || spec.berserked.includes(mon.uid) || mon.hp <= 0 || !isBerserker(content, mon)) return false;
  return mon.hp / maxHp(content, mon) <= content.balance.spectacle.berserk.hpBelow;
}

/** The move it throws while berserk: the strongest damaging move with PP left (-1 when it has none). */
export function berserkMove(content: Content, mon: PokemonInstance): number {
  let best = -1;
  let power = -1;
  mon.moves.forEach((m, i) => {
    if (m.pp <= 0) return;
    const p = content.moves.get(m.id)?.power ?? 0;
    if (p > power) {
      best = i;
      power = p;
    }
  });
  return power > 0 ? best : -1;
}

/** Is this Pokémon berserk right now? */
export const isBerserk = (spec: SpectacleBattle | null, mon: PokemonInstance): boolean => !!spec?.berserk && spec.berserk.uid === mon.uid;
