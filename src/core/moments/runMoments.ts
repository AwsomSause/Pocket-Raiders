// Pokémon moments outside battle (Beta 0.6 batch 6): "rest" (a healing stop) and "catch" (a Pokémon joins the party).
// Rolls are stateless and seeded like the battle ones; a once-per-run moment is claimed only when it plays, so a failed roll
// at one rest does not use up the chance at the next. No new RNG stream: nothing else's rolls move.

import { displayName } from '../care';
import type { Content } from '../contentSchema';
import { changeFriendship } from '../friendship';
import { addItem } from '../items';
import { hashSeed, Rng } from '../rng';
import type { PokemonInstance, RunState } from '../state';
import { momentRoll, momentsFor, runClaimKey, type PokemonMoment } from './pokemonMoments';

const BERRIES = ['oran-berry', 'sitrus-berry'];
const TALENT_STATS = ['atk', 'def', 'spa', 'spd', 'spe'] as const;

const nameOf = (content: Content, mon: PokemonInstance): string => displayName(content, mon);

/** One moment's roll at this point in the run: the run seed, the moment, the Pokémon and how many fights are behind it. */
function plays(run: RunState, m: PokemonMoment, mon: PokemonInstance): boolean {
  if (m.limit === 'run' && run.story.flags[runClaimKey(m)] !== undefined) return false;
  if (!momentRoll(run.seed, m.id, mon.uid, run.encountersCompleted, m.chance)) return false;
  if (m.limit === 'run') run.story.flags[runClaimKey(m)] = 1;
  return true;
}

/** A healing stop: each party member's rest moments get one roll. Returns the lines to show. */
export function restMoments(content: Content, run: RunState): string[] {
  if (content.balance.pokemonMoments === false) return [];
  const lines: string[] = [];
  for (const mon of [...run.party]) {
    for (const m of momentsFor(content, mon, 'rest')) {
      if (!m.effect || !plays(run, m, mon)) continue;
      const fx = m.effect;
      if (fx.friendship) changeFriendship(content, mon, fx.friendship);
      if (fx.teamFriendship) for (const p of run.party) changeFriendship(content, p, fx.teamFriendship);
      if (fx.freeBerry) addItem(run.inventory, BERRIES[Math.floor(new Rng(hashSeed(`${run.seed}:pmoment:${m.id}:${mon.uid}:berry`)).float() * BERRIES.length)]!, 1);
      lines.push(`${nameOf(content, mon)}: ${m.name}. ${m.effectText}`);
      break;
    }
  }
  return lines;
}

/** A Pokémon has just joined the party: its catch moments get one roll. `healParty` is passed in (run.ts owns it). */
export function joinMoments(content: Content, run: RunState, joined: PokemonInstance, healParty: () => void): string[] {
  if (content.balance.pokemonMoments === false) return [];
  const lines: string[] = [];
  for (const m of momentsFor(content, joined, 'catch')) {
    if (!m.effect) continue;
    const fx = m.effect;
    // A talent it already has is kept: the moment does nothing, so it is not claimed.
    if (fx.talentRoll && joined.care?.talent) continue;
    if (!plays(run, m, joined)) continue;
    if (fx.healTeam) healParty();
    if (fx.friendship) changeFriendship(content, joined, fx.friendship);
    if (fx.talentRoll) {
      const care = (joined.care ??= {} as NonNullable<PokemonInstance['care']>);
      care.talent = TALENT_STATS[Math.floor(new Rng(hashSeed(`${run.seed}:pmoment:${m.id}:${joined.uid}:talent`)).float() * TALENT_STATS.length)]!;
    }
    lines.push(`${nameOf(content, joined)}: ${m.name}. ${m.effectText}`);
  }
  return lines;
}
