// Catalog Overhaul Pack, singles (STORY_FAMILIES_19 to 22): small event pieces the singles scripts need.
// Deterministic: rolls only with the event's own Rng. No save change: state lives in `run.story.flags`
// (`co:fog-items` holds what the Memory Fog took, `co:epitaph` the line written in the Unwritten Library). Guide: docs/status/co-singles.md.

import type { Content, EventEffect, TypeName } from '../contentSchema';
import { typeEffectiveness } from '../battle/damage';
import type { Rng } from '../rng';
import type { PokemonInstance, RunState } from '../state';
import { leastUsed, mostUsed } from './coToolkit';

export type SinglesEffect = Extract<EventEffect, { kind: 'coAdvice' | 'coFog' | 'coEpitaph' }>;

const FOG = 'co:fog-items';
export const EPITAPH = 'co:epitaph';

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

const itemName = (content: Content, id: string): string => content.catalog.get(id)?.name ?? content.items.get(id)?.name ?? id;

/** SF142 The Memory Fog: up to `count` items (one copy each, never key items) are taken and remembered in order. */
function fogTake(content: Content, run: RunState, count: number, rng: Rng): string {
  const taken: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const ids = Object.keys(run.inventory).filter((id) => (run.inventory[id] ?? 0) > 0 && !(content.catalog.get(id)?.family ?? '').startsWith('Key items')).sort();
    if (ids.length === 0) break;
    const id = rng.pick(ids);
    run.inventory[id]! -= 1;
    if (run.inventory[id] === 0) delete run.inventory[id];
    taken.push(id);
  }
  const before = String(run.story.flags[FOG] ?? '');
  run.story.flags[FOG] = [...(before ? before.split(',') : []), ...taken].join(',');
  return taken.length ? `The fog takes ${taken.map((id) => itemName(content, id)).join(', then ')}` : 'Your pockets were empty: the fog takes nothing';
}

/** SF142 The Fog Gives It Back: everything the fog took comes back, in the order it went. */
function fogGive(content: Content, run: RunState): string {
  const taken = String(run.story.flags[FOG] ?? '').split(',').filter(Boolean);
  delete run.story.flags[FOG];
  for (const id of taken) run.inventory[id] = (run.inventory[id] ?? 0) + 1;
  return taken.length ? `Back: ${taken.map((id) => itemName(content, id)).join(', then ')}` : '';
}

export function singlesEffectWords(e: SinglesEffect): string {
  switch (e.kind) {
    case 'coAdvice': return e.topic === 'weakness' ? 'advice about your team' : 'advice about how you fight';
    case 'coFog': return e.action === 'take' ? `up to ${e.count} item${e.count === 1 ? '' : 's'} lost in the fog` : 'what the fog took comes back';
    case 'coEpitaph': return 'your line becomes the run\'s epitaph';
  }
}

/** `pickedUid`: the Pokémon pointed at on a `pick` choice (`{picked}` in an epitaph; the lead when none). */
export function applySinglesEffect(content: Content, run: RunState, e: SinglesEffect, rng: Rng, pickedUid?: string): string {
  switch (e.kind) {
    case 'coAdvice': return adviceText(content, run, e.topic);
    case 'coFog': return e.action === 'take' ? fogTake(content, run, e.count, rng) : fogGive(content, run);
    case 'coEpitaph': {
      const mon = run.party.find((m) => m.uid === pickedUid) ?? run.party[0];
      run.story.flags[EPITAPH] = e.text.replaceAll('{picked}', mon ? nameOf(content, mon) : 'my partner');
      return `Epitaph: ${String(run.story.flags[EPITAPH])}`;
    }
  }
}
