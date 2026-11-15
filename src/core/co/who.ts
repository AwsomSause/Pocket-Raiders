// Catalog Overhaul Pack: "which Pokémon" for an event effect or condition, and the pack's Bond scale.
// The pack writes "that Pokémon +2 Bond", "a Pokémon with Bond 4": Bond level N is friendship of at least N x balance.co.bondLevelStep
// (the top level is full friendship). Shared by every catalog thread (board: /plans/catalog-overhaul/STANDARDS.md).
import type { Content, TypeName } from '../contentSchema';
import type { PokemonInstance, RunState } from '../state';

export const CO_WHO_NAMES = ['lead', 'party', 'picked', 'starter', 'top', 'firstCatch', 'newest'] as const;
export const CO_MOVE_FLAGS = ['sound', 'wind', 'punch', 'bite', 'pulse', 'bullet', 'slicing', 'powder'] as const;
/** The first party Pokémon able to fight that fits every given part (types: any one of them). */
export interface CoMatch { types?: TypeName[]; moveFlag?: (typeof CO_MOVE_FLAGS)[number]; species?: string[] }
export type CoWho = (typeof CO_WHO_NAMES)[number] | 'weakest' | CoMatch;

export const MAX_BOND_LEVEL = 5;

/** The friendship a Bond level stands for (level 5, "maximum Bond", is full friendship). */
export function bondLevelFriendship(content: Content, level: number): number {
  const { max } = content.balance.friendship;
  return level >= MAX_BOND_LEVEL ? max : Math.min(max, Math.max(0, level) * content.balance.co.bondLevelStep);
}

/** The friendship for the pack's "+N Bond": `bondFriendship` a point on one Pokémon, `bondFriendshipParty` each for the whole party. */
export function bondFriendship(content: Content, points: number, who: CoWho): number {
  return points * (who === 'party' ? content.balance.co.bondFriendshipParty : content.balance.co.bondFriendship);
}

/** A Pokémon's Bond level, 0 to 5. */
export function bondLevel(content: Content, mon: Pick<PokemonInstance, 'friendship'>): number {
  if (mon.friendship >= content.balance.friendship.max) return MAX_BOND_LEVEL;
  return Math.min(MAX_BOND_LEVEL - 1, Math.floor(mon.friendship / content.balance.co.bondLevelStep));
}

const uidNumber = (uid: string): number => Number(uid.replace(/\D+/g, '')) || 0;

export function fitsMatch(content: Content, mon: PokemonInstance, match: CoMatch): boolean {
  if (match.species && match.species.length > 0 && !match.species.includes(mon.speciesId)) return false;
  if (match.types && match.types.length > 0 && !(content.species.get(mon.speciesId)?.types ?? []).some((t) => match.types!.includes(t))) return false;
  if (match.moveFlag && !mon.moves.some((mv) => content.moves.get(mv.id)?.flags.includes(match.moveFlag!))) return false;
  return true;
}

/**
 * The party Pokémon an effect lands on. `picked`: the one the player chose (the lead when nothing was chosen).
 * `starter`: the starter while it is in the party. `top`: the highest friendship (party order breaks a tie).
 * `firstCatch`: the earliest Pokémon caught in a Ball that is still in the party. `newest`: the latest to join.
 * A match: the first able Pokémon that fits. Nobody fits: an empty list (the effect does nothing).
 */
export function whoOf(content: Content, run: RunState, who: CoWho, pickedUid?: string): PokemonInstance[] {
  const party = run.party;
  const able = party.filter((m) => m.hp > 0);
  const one = (m: PokemonInstance | undefined): PokemonInstance[] => (m ? [m] : []);
  if (typeof who !== 'string') return one(able.find((m) => fitsMatch(content, m, who)) ?? party.find((m) => fitsMatch(content, m, who)));
  switch (who) {
    case 'party':
      return party;
    case 'lead':
      return able.slice(0, 1);
    case 'picked':
      return one(party.find((m) => m.uid === pickedUid) ?? able[0] ?? party[0]);
    case 'weakest':
      return [...able].sort((a, b) => a.level - b.level).slice(0, 1);
    case 'starter':
      return one(party.find((m) => m.uid === run.log.starterUid));
    case 'top':
      return one([...party].sort((a, b) => b.friendship - a.friendship)[0]);
    case 'firstCatch':
      return one(firstCatch(run));
    case 'newest':
      return one([...party].sort((a, b) => uidNumber(b.uid) - uidNumber(a.uid))[0]);
  }
}

/** The earliest Pokémon caught in a Ball that is still in the party (never the starter). */
export function firstCatch(run: RunState): PokemonInstance | undefined {
  return [...run.party].filter((m) => m.caughtBall !== undefined && m.uid !== run.log.starterUid).sort((a, b) => uidNumber(a.uid) - uidNumber(b.uid))[0];
}

/** In words, for the outcome list and a locked choice. */
export function whoWords(who: CoWho): string {
  if (typeof who !== 'string') {
    const parts = [who.types?.length ? `${who.types.map((t) => t[0]!.toUpperCase() + t.slice(1)).join(' or ')}-type` : '', who.moveFlag ? `${who.moveFlag}-move Pokémon` : '', who.species?.length ? 'that Pokémon' : ''].filter(Boolean);
    return parts.length > 0 ? `your ${parts.join(' ')}`.replace('-type your', '-type') : 'one Pokémon';
  }
  return { lead: 'lead', party: 'party', picked: 'the chosen Pokémon', weakest: 'lowest-level Pokémon', starter: 'your starter', top: 'your closest Pokémon', firstCatch: 'your first catch', newest: 'your newest Pokémon' }[who];
}

/** A Bond-level check: someone (or the named one) is at this level or above. */
export function bondLevelMet(content: Content, run: RunState, atLeast: number, who: CoWho | 'any' = 'any'): boolean {
  const pool = who === 'any' ? run.party : whoOf(content, run, who);
  return pool.some((m) => bondLevel(content, m) >= atLeast);
}
