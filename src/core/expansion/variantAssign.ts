// Beta 0.6 slice E1 (part 6): which Evil Team Pokémon carry their team's variant line in a run. Pure rules; the only caller is
// startEventBattle (src/core/events.ts), right after the battle is built. No gameplay RNG: the Couture accessory comes from a
// hash of the Pokémon's uid, so the same run always dresses the same Pokémon the same way.

import type { PokemonInstance } from '../state';
import type { Variants, VariantLineId } from './variantLines';
import { assignVariant, COUTURE_ACCESSORIES } from './variantLines';
import { hashSeed, Rng } from '../rng';
import { assignTrait, traitForSpecies, traitHolds, traitOfDossier, type Traits } from './traits';

export type EvilRank = 'grunt' | 'specialist' | 'executive' | 'leader';

/** The line a team's Pokémon carry, by team id (and region, for Rocket: Tagged in Kanto, Dark Ball in Johto). Macro Cosmos has no Evil Team in the game yet, so Overcharged has no route. */
const TEAM_LINE: Record<string, VariantLineId | ((region: string) => VariantLineId | null)> = {
  rocket: (region) => (region === 'kanto' ? 'tagged' : region === 'johto' ? 'dark-ball' : null),
  aqua: 'tidebound',
  magma: 'cinderborn',
  galactic: 'spiritless',
  plasma: 'overclocked',
  flare: 'couture',
  skull: 'tagged-up',
  aether: 'preserved',
  yell: 'loud',
  star: 'tuned',
  'rocket-remnants': 'patchwork',
  snagem: 'snagged',
};

/** How many of a fight's Pokémon carry the line: none for Grunts, one for a Specialist, two for Executives and Leaders (plan E1 slots). The last ones in the lineup, so the ace always has it. */
export const VARIANT_SLOTS: Record<EvilRank, number> = { grunt: 0, specialist: 1, executive: 2, leader: 2 };

export function lineForTeam(teamId: string, regionId: string): VariantLineId | null {
  const entry = TEAM_LINE[teamId];
  return typeof entry === 'function' ? entry(regionId) : (entry ?? null);
}

export interface EvilVariantContext {
  teamId: string;
  regionId: string;
  rank: EvilRank;
  /** The player holds Marnie's League Card (Loud's first-turn shame). */
  marnie: boolean;
}

/** Gives the last Pokémon of an Evil Team lineup their team's line. Returns the uids that got it. Team Yell's Grunts watch from the stands whenever a higher rank fights, which is what lets Loud cheer. */
export function assignEvilVariants(variants: Variants, team: readonly PokemonInstance[], ctx: EvilVariantContext): string[] {
  const line = lineForTeam(ctx.teamId, ctx.regionId);
  const count = Math.min(team.length, VARIANT_SLOTS[ctx.rank]);
  if (!line || count === 0) return [];
  const chosen = team.slice(team.length - count);
  for (const mon of chosen) {
    const accessory = COUTURE_ACCESSORIES[Math.floor(new Rng(hashSeed(`couture:${mon.uid}`)).float() * COUTURE_ACCESSORIES.length)];
    assignVariant(variants, mon.uid, line, { crowd: ctx.teamId === 'yell', marnie: ctx.marnie, accessory });
  }
  return chosen.map((m) => m.uid);
}

/** Gives a lineup's named special Pokémon their signature trait (Specialists and above; Grunts never carry one). Returns the uids that got one. */
export function assignEvilTraits(traits: Traits, team: readonly PokemonInstance[], ctx: Pick<EvilVariantContext, 'teamId' | 'regionId' | 'rank'>): string[] {
  if (ctx.rank === 'grunt') return [];
  const given: string[] = [];
  for (const mon of team) {
    const trait = traitForSpecies(ctx.teamId, ctx.regionId, mon.speciesId);
    if (!trait) continue;
    assignTrait(traits, mon.uid, trait);
    given.push(mon.uid);
  }
  return given;
}

/** An event battle names its special Pokémon (`special`: a dossier id such as sv.rocket.roadblock): the first foe of a matching species carries its trait. Returns that foe's uid, or null. */
export function assignSpecialTrait(traits: Traits, team: readonly PokemonInstance[], dossierId: string): string | null {
  const trait = traitOfDossier(dossierId);
  const holder = trait ? team.find((m) => traitHolds(trait, m.speciesId)) : undefined;
  if (!trait || !holder) return null;
  assignTrait(traits, holder.uid, trait);
  return holder.uid;
}

/** Marnie's League Card: the Team Yell Blockade event's "Chant along" branch adds the event flag `marnies-league-card` (event flags live in `run.story.flags` as `ev:<key>`). Once held it stays for the run. */
export const MARNIE_CARD_FLAG = 'ev:marnies-league-card';
export const holdsMarnieCard = (run: { story: { flags: Record<string, unknown> } }): boolean => Number(run.story.flags[MARNIE_CARD_FLAG] ?? 0) >= 1;
