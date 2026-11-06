// Breeding Nursery (ideas S49): before an Egg hatches, a parent of its family in your party can pass on one
// move, and you pick which of the species' abilities it hatches with (the hidden one only if the Egg rolled it).
// One visit per Egg. Moves go into the Egg's own `eggMoves`; the ability pick is a run counter, so no save bump.

import type { Content } from './contentSchema';
import { familyId } from './mastery';
import { getSpecies } from './pokemon';
import type { Egg, PokemonInstance, RunState } from './state';

export const NURSERY = { maxEggMoves: 4 } as const;

export type NurseryChoice = { kind: 'move'; moveId: string; parent: string } | { kind: 'ability'; slot: number; name: string };

const doneKey = (uid: string) => `nursery-done:${uid}`;
const abilityKey = (uid: string) => `nursery-ability:${uid}`;
export const nurseryDone = (run: Pick<RunState, 'itemCounters'>, eggUid: string) => (run.itemCounters?.[doneKey(eggUid)] ?? 0) > 0;
/** The ability slot chosen for this Egg (-1 hidden), or null for the default roll. */
export const nurseryAbilitySlot = (run: Pick<RunState, 'itemCounters'>, eggUid: string): number | null => {
  const v = run.itemCounters?.[abilityKey(eggUid)] ?? 0;
  return v > 0 ? v - 2 : null;
};

const parentsOf = (content: Content, run: RunState, egg: Egg): PokemonInstance[] => run.party.filter((m) => familyId(content, m.speciesId) === egg.speciesId);

/** What the nursery offers for this Egg (nothing once it has been used). */
export function nurseryChoices(content: Content, run: RunState, egg: Egg): NurseryChoice[] {
  if (nurseryDone(run, egg.uid)) return [];
  const out: NurseryChoice[] = [];
  const species = getSpecies(content, egg.speciesId);
  if (egg.eggMoves.length < NURSERY.maxEggMoves) {
    const pool = new Set([...(content.learnables.get(species.id) ?? []), ...species.learnset.map((e) => e.move), ...(content.eggMoves.get(species.id) ?? [])]);
    const seen = new Set(egg.eggMoves);
    for (const parent of parentsOf(content, run, egg)) {
      for (const slot of parent.moves) {
        if (seen.has(slot.id) || !pool.has(slot.id) || content.moves.get(slot.id)?.supported !== true) continue;
        seen.add(slot.id);
        out.push({ kind: 'move', moveId: slot.id, parent: parent.uid });
      }
    }
  }
  species.abilities.normal.forEach((name, slot) => out.push({ kind: 'ability', slot, name }));
  if (egg.hidden && species.abilities.hidden) out.push({ kind: 'ability', slot: -1, name: species.abilities.hidden });
  return out;
}

/** Applies one choice to the Egg and closes its nursery visit. Returns a message. */
export function applyNursery(content: Content, run: RunState, eggUid: string, choice: NurseryChoice): string {
  const egg = run.eggs.find((e) => e.uid === eggUid);
  if (!egg) throw new Error('No such Egg.');
  const allowed = nurseryChoices(content, run, egg).some((c) => (c.kind === 'move' ? choice.kind === 'move' && c.moveId === choice.moveId : choice.kind === 'ability' && c.slot === choice.slot));
  if (!allowed) throw new Error('The nursery cannot do that for this Egg.');
  run.itemCounters = { ...run.itemCounters, [doneKey(egg.uid)]: 1 };
  if (choice.kind === 'move') {
    run.eggs = run.eggs.map((e) => (e.uid === egg.uid ? { ...e, eggMoves: [...e.eggMoves, choice.moveId] } : e));
    return `The Egg will hatch knowing ${content.moves.get(choice.moveId)!.name}.`;
  }
  run.itemCounters = { ...run.itemCounters, [abilityKey(egg.uid)]: choice.slot + 2 };
  return `The Egg will hatch with ${choice.name}.`;
}
