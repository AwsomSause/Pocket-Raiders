// Shadow II (slice E6): the four tiers on top of the Heart Gauge. Corruption IS the Heart Gauge (1 to 100, 100 = sealed
// tight); a Pokémon with no `shadow` is Clear. Pure rules, no RNG, no Phaser.

import type { PokemonInstance } from '../state';
import { shadow2Data } from './data';

export interface ShadowTier {
  tier: 1 | 2 | 3 | 4;
  name: 'Veiled' | 'Bound' | 'Gripped' | 'Fallen';
  /** Highest corruption in this tier. */
  upTo: number;
  /** Extra damage the Shadow Pokémon deals. */
  damageBonus: number;
  /** Damage multiplier when it is hit (Fallen: its defenses drop 15%). */
  damageTaken: number;
  /** Chance per turn that it replaces your command (announced a turn... before it resolves, never silent). */
  disobeyChance: number;
  /** Chance per turn that it only hesitates and loses the turn (Veiled only). */
  hesitateChance: number;
  /** Counts toward the two-slot limit on Gripped and Fallen Shadows in the party. */
  countsAgainstCap: boolean;
}

export const SHADOW_TIERS: readonly ShadowTier[] = shadow2Data.tiers as ShadowTier[];

/** The most Gripped or Fallen Shadows one party may hold. */
export const SHADOW_SLOT_CAP = shadow2Data.slotCap;

/** The tier of a corruption value (1 to 100), or null when it is 0 (Clear). */
export function tierOfCorruption(corruption: number): ShadowTier | null {
  if (corruption <= 0) return null;
  return SHADOW_TIERS.find((t) => corruption <= t.upTo) ?? SHADOW_TIERS[3]!;
}

export const shadowTierOf = (mon: Pick<PokemonInstance, 'shadow'>): ShadowTier | null => (mon.shadow ? tierOfCorruption(mon.shadow.heart) : null);

/** Gripped and Fallen Shadows in a party. */
export const heavyShadowCount = (party: readonly Pick<PokemonInstance, 'shadow'>[]): number => party.filter((m) => shadowTierOf(m)?.countsAgainstCap).length;

/** The party the player may take into a battle: no more than two Gripped or Fallen Shadows; extras stay out (first ones win). */
export function shadowCapAllowed(party: readonly Pick<PokemonInstance, 'shadow' | 'uid'>[]): Set<string> {
  const allowed = new Set<string>();
  let heavy = 0;
  for (const m of party) {
    if (shadowTierOf(m)?.countsAgainstCap) {
      if (heavy >= SHADOW_SLOT_CAP) continue;
      heavy += 1;
    }
    allowed.add(m.uid);
  }
  return allowed;
}

/** The multipliers one hit uses: the attacker's tier bonus and the target's tier drawback. */
export function shadowTierDamage(user: Pick<PokemonInstance, 'shadow'>, target: Pick<PokemonInstance, 'shadow'>): number {
  return (1 + (shadowTierOf(user)?.damageBonus ?? 0)) * (shadowTierOf(target)?.damageTaken ?? 1);
}
