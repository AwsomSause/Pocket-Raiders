// Regional Form Shifts (ideas S52): a ritual swaps a Pokémon between its base form and a regional variant
// (Arcanine <-> Hisuian Arcanine). The ritual costs one Moon Stone. Level, moves, nature and bond stay;
// its HP keeps the same share. Reversible, so a shift is a choice and never a trap. No save change.

import type { Content } from './contentSchema';
import { consumeItem, itemCount } from './items';
import { maxHp, getSpecies } from './pokemon';
import { discover } from './progress';
import type { PokemonInstance, RunState } from './state';

export const FORM_SHIFT = { item: 'moon-stone' } as const;

/** The forms this Pokémon can swap to: its regional variants, or its base when it is one. */
export function formShiftTargets(content: Content, mon: PokemonInstance): string[] {
  const species = getSpecies(content, mon.speciesId);
  if (species.form?.kind === 'regional') return content.species.has(species.form.base) ? [species.form.base] : [];
  return [...content.species.values()].filter((s) => s.form?.kind === 'regional' && s.form.base === species.id).map((s) => s.id).sort();
}

/** Why this shift cannot happen, or null. */
export function formShiftProblem(content: Content, run: Pick<RunState, 'inventory'>, mon: PokemonInstance, target: string): string | null {
  if (!formShiftTargets(content, mon).includes(target)) return 'That Pokémon has no such form.';
  if (mon.hp <= 0) return 'A fainted Pokémon cannot take part in the ritual.';
  if (itemCount(run.inventory, FORM_SHIFT.item) <= 0) return `The ritual needs a ${content.items.get(FORM_SHIFT.item)?.name ?? FORM_SHIFT.item}.`;
  return null;
}

/** Performs the ritual (mutates the run) and returns the message. */
export function applyFormShift(content: Content, run: RunState, uid: string, target: string): string {
  const mon = run.party.find((m) => m.uid === uid);
  if (!mon) throw new Error('Choose a Pokémon');
  const problem = formShiftProblem(content, run, mon, target);
  if (problem) throw new Error(problem);
  const from = getSpecies(content, mon.speciesId).name;
  consumeItem(run.inventory, FORM_SHIFT.item);
  const next = switchForm(content, run, mon, target);
  return `${from} shifted into ${next.name}!`;
}

/** Swaps a Pokémon into another form of its species: level, moves, nature and bond stay, HP keeps its share, the new form is marked caught. No item cost; callers charge it. */
export function switchForm(content: Content, run: RunState, mon: PokemonInstance, target: string) {
  const share = mon.hp / maxHp(content, mon);
  mon.speciesId = target;
  const next = getSpecies(content, target);
  if (mon.abilitySlot >= next.abilities.normal.length || (mon.abilitySlot < 0 && !next.abilities.hidden)) mon.abilitySlot = 0;
  mon.hp = Math.max(1, Math.round(maxHp(content, mon) * share));
  discover(run, target, true);
  return next;
}
