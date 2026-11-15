// Catalog Overhaul Pack, singles (STORY_FAMILIES_19 to 22): small event pieces the singles scripts need.
// Pure and deterministic: reads the party only, never rolls dice, changes nothing. Guide: docs/status/co-singles.md.

import type { Content, EventEffect, TypeName } from '../contentSchema';
import { typeEffectiveness } from '../battle/damage';
import type { PokemonInstance, RunState } from '../state';
import { leastUsed, mostUsed } from './coToolkit';

export type SinglesEffect = Extract<EventEffect, { kind: 'coAdvice' }>;

const nameOf = (content: Content, mon: PokemonInstance): string => mon.care?.nickname || (content.species.get(mon.speciesId)?.name ?? mon.speciesId);
const cap = (t: string): string => `${t.charAt(0).toUpperCase()}${t.slice(1)}`;

/** Attacking types that hit two or more party Pokémon super-effectively, the worst first (ties: type name). */
export function teamWeaknesses(content: Content, run: Pick<RunState, 'party'>): { type: TypeName; mons: PokemonInstance[] }[] {
  const types = Object.keys(content.typeChart).sort() as TypeName[];
  return types
    .map((type) => ({ type, mons: run.party.filter((m) => typeEffectiveness(content.typeChart, type, content.species.get(m.speciesId)?.types ?? []) > 1) }))
    .filter((w) => w.mons.length >= 2)
    .sort((a, b) => b.mons.length - a.mons.length || a.type.localeCompare(b.type));
}

/** The move a Pokémon has used most this run (ties: the earlier slot), or null if it has not fought. */
export function favouriteMove(content: Content, mon: PokemonInstance): string | null {
  let best: string | null = null;
  let count = 0;
  for (const slot of mon.moves) {
    const n = mon.moveCounts?.[slot.id] ?? 0;
    if (n > count) { best = slot.id; count = n; }
  }
  return best ? (content.moves.get(best)?.name ?? best) : null;
}

/** SF138 Coverage Judge ("weakness") and Playstyle Mentor ("habits"): advice read from the real party. */
export function adviceText(content: Content, run: Pick<RunState, 'party'>, topic: 'weakness' | 'habits'): string {
  if (topic === 'weakness') {
    const weak = teamWeaknesses(content, run).slice(0, 2);
    if (weak.length === 0) return '"Nothing hits more than one of them hard. How dull. Well done."';
    return weak.map((w) => `${cap(w.type)} hits ${w.mons.length} of your team hard (${w.mons.map((m) => nameOf(content, m)).join(', ')}).`).join(' ') + ' "Cover that, darling."';
  }
  const most = mostUsed(run);
  const least = leastUsed(run);
  if (!most) return '"You haven\'t fought yet. Come back when you have."';
  const move = favouriteMove(content, most);
  const lean = move ? `"You lean on ${nameOf(content, most)}. ${move} is its answer to everything."` : `"You lean on ${nameOf(content, most)}."`;
  return least && least.uid !== most.uid ? `${lean} "And ${nameOf(content, least)} has barely been asked to fight."` : lean;
}

export function singlesEffectWords(e: SinglesEffect): string {
  return e.topic === 'weakness' ? 'advice about your team' : 'advice about how you fight';
}

export function applySinglesEffect(content: Content, run: RunState, e: SinglesEffect): string {
  return adviceText(content, run, e.topic);
}
