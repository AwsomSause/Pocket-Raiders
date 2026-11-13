// Beta 0.6 slice E1 (part 7): signature traits of Kanto's nine special Pokémon (data: src/data/expansion/specialPokemon.json, the
// "trait" column). Like variant lines, state lives in `battle.extra.traits` (uid -> trait and counters, saved with the battle) and the
// engine calls these pure functions at its hook points. No Phaser, no RNG.

import { z } from 'zod';

export const TRAIT_IDS = ['seat-at-the-table', 'drill-through', 'house-wins', 'double-entry', 'collections', 'fed-and-paid', 'payout', 'lights-out', 'translator'] as const;
export type TraitId = (typeof TRAIT_IDS)[number];

export const TraitStateSchema = z.object({ trait: z.enum(TRAIT_IDS), flags: z.record(z.string(), z.number()).default({}) });
export const TraitsSchema = z.record(z.string(), TraitStateSchema).default({});
export type Traits = z.infer<typeof TraitsSchema>;

/** The special-Pokémon id (data) each trait belongs to, and the species that carry it in a fight. */
export const TRAIT_CAST: Record<TraitId, { dossier: string; species: readonly string[]; team: string }> = {
  'seat-at-the-table': { dossier: 'sv.rocket.chairman', species: ['persian'], team: 'rocket' },
  'drill-through': { dossier: 'sv.rocket.vault-breaker', species: ['rhydon', 'rhyperior'], team: 'rocket' },
  'house-wins': { dossier: 'sv.rocket.house-pair', species: ['nidoking', 'nidoqueen'], team: 'rocket' },
  'double-entry': { dossier: 'sv.rocket.ledger', species: ['porygon', 'porygon2', 'porygon-z'], team: 'rocket' },
  collections: { dossier: 'sv.rocket.big-tab', species: ['raticate', 'bruticate'], team: 'rocket' },
  'fed-and-paid': { dossier: 'sv.rocket.roadblock', species: ['snorlax'], team: 'rocket' },
  payout: { dossier: 'sv.rocket.jackpot', species: ['dratini', 'dragonair'], team: 'rocket' },
  'lights-out': { dossier: 'sv.rocket.blackout', species: ['voltorb', 'electrode'], team: 'rocket' },
  translator: { dossier: 'sv.rocket.meowth', species: ['meowth'], team: 'rocket-remnants' },
};

/** The trait a Pokémon of this species carries in a fight against this team in this region, or null. Kanto Rocket carries eight; Meowth's Translator belongs to the Rocket Remnants trio. */
export function traitForSpecies(teamId: string, regionId: string, speciesId: string): TraitId | null {
  for (const id of TRAIT_IDS) {
    const c = TRAIT_CAST[id];
    if (!c.species.includes(speciesId) || c.team !== teamId) continue;
    if (c.team === 'rocket' && regionId !== 'kanto') continue;
    return id;
  }
  return null;
}

export function assignTrait(traits: Traits, uid: string, trait: TraitId): void {
  traits[uid] = { trait, flags: {} };
}
const traitOf = (traits: Traits, uid: string): TraitId | null => traits[uid]?.trait ?? null;
const flags = (traits: Traits, uid: string): Record<string, number> => traits[uid]?.flags ?? {};

/** Seat at the Table: on entry, the foe's stat boosts are cleared (announced). */
export const traitSeatMessage = (traits: Traits, uid: string): string | null => (traitOf(traits, uid) === 'seat-at-the-table' ? 'Seat at the Table: the foe\'s boosts are swept away.' : null);

/** Drill Through: its first Ground or Rock move each battle ignores Protect and screens. Call once as the move starts; true only the first time. */
export function traitDrill(traits: Traits, uid: string, moveType: string): boolean {
  if (traitOf(traits, uid) !== 'drill-through' || (moveType !== 'ground' && moveType !== 'rock')) return false;
  const f = flags(traits, uid);
  if (f.drilled) return false;
  f.drilled = 1;
  return true;
}

/** The House Wins: when one of the pair faints, the other gains +1 Attack and +1 Special Defense (right away if it is out, otherwise as it comes in). */
export const HOUSE_WINS_STAGES = { atk: 1, spd: 1 } as const;
export const isHousePair = (traits: Traits, uid: string): boolean => traitOf(traits, uid) === 'house-wins';
/** Marks a partner whose bonus is waiting for it to come in; `takePending` hands it over once. */
export function housePending(traits: Traits, uid: string): void {
  flags(traits, uid).pending = 1;
}
export function takeHousePending(traits: Traits, uid: string): boolean {
  const f = flags(traits, uid);
  if (traitOf(traits, uid) !== 'house-wins' || !f.pending) return false;
  f.pending = 0;
  return true;
}

/** Double Entry: once per battle, when the foe's stat changes, it copies that change onto itself. True the first time. */
export function traitDoubleEntry(traits: Traits, uid: string): boolean {
  if (traitOf(traits, uid) !== 'double-entry') return false;
  const f = flags(traits, uid);
  if (f.used) return false;
  f.used = 1;
  return true;
}

/** Collections: its biting moves take the target's Berry. */
export const traitTakesBerry = (traits: Traits, uid: string, moveFlags: readonly string[]): boolean => traitOf(traits, uid) === 'collections' && moveFlags.includes('bite');

/** Fed and Paid: heals 1/8 of its HP each turn until its food is knocked away. */
export function traitFeedHeal(traits: Traits, uid: string, maxHp: number): number {
  if (traitOf(traits, uid) !== 'fed-and-paid' || flags(traits, uid).foodGone) return 0;
  return Math.max(1, Math.floor(maxHp / 8));
}
export function traitFoodKnocked(traits: Traits, uid: string, moveId: string): string | null {
  if (traitOf(traits, uid) !== 'fed-and-paid' || flags(traits, uid).foodGone || !['knock-off', 'thief', 'covet', 'trick', 'switcheroo'].includes(moveId)) return null;
  flags(traits, uid).foodGone = 1;
  return 'Its food is knocked away.';
}

/** Payout: when it knocks out a foe, the battle's prize money is doubled. */
export const traitPayout = (traits: Traits, uid: string): boolean => traitOf(traits, uid) === 'payout';

/** Lights Out: when it faints the field goes dark for 3 turns (accuracy -10% for both sides). */
export const LIGHTS_OUT_TURNS = 3;
export const LIGHTS_OUT_ACCURACY = 0.9;
export const traitLightsOut = (traits: Traits, uid: string): boolean => traitOf(traits, uid) === 'lights-out';

/** Translator: once per battle he overhears the foe and reveals its next move. True the first time. */
export function traitOverhears(traits: Traits, uid: string): boolean {
  if (traitOf(traits, uid) !== 'translator') return false;
  const f = flags(traits, uid);
  if (f.used) return false;
  f.used = 1;
  return true;
}
