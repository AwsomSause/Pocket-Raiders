// Greenneedle gn.11 Kaiju Tentacruel: freeing the injured Tentacool takes two turns inside the raid. One party Pokémon cuts the net
// (a slicing move, or claws) and is out of the fight; the rest protect it from the Kaiju's panicked swings (event raid `rule.surviveTurns: 2`).
// Also: a lost raid shuts the stage's market.
import type { Content } from '../contentSchema';
import type { PokemonInstance, RunState } from '../state';

const TAG = 'kaiju-cutter';

const cuts = (content: Content, m: PokemonInstance): boolean =>
  m.moves.some((s) => { const mv = content.moves.get(s.id); return !!mv && mv.category !== 'status' && (mv.flags.includes('slicing') || s.id.includes('claw')); });

/** Who would cut the net: the first standing party Pokémon with a slicing or claw move, when someone else is standing to protect it. */
export function netCutter(content: Content, run: RunState): PokemonInstance | null {
  const standing = run.party.filter((m) => m.hp > 0);
  const cutter = standing.find((m) => cuts(content, m));
  return cutter && standing.length >= 2 ? cutter : null;
}

/** The cutter goes to the net: it leaves the party for the two turns (kept in the box, tagged). */
export function kaijuCut(content: Content, run: RunState): string {
  const cutter = netCutter(content, run);
  if (!cutter) return '';
  cutter.gn = [...(cutter.gn ?? []), TAG];
  run.party = run.party.filter((m) => m !== cutter);
  run.box = [...run.box, cutter];
  return `${content.species.get(cutter.speciesId)?.name ?? 'Your Pokémon'} goes for the net`;
}

/** The cutter comes back (to its place at the front if the party filled up meanwhile, the newest member goes to the box). */
export function kaijuBack(run: RunState): string {
  const cutter = run.box.find((m) => m.gn?.includes(TAG));
  if (!cutter) return '';
  cutter.gn = (cutter.gn ?? []).filter((t) => t !== TAG);
  run.box = run.box.filter((m) => m !== cutter);
  if (run.party.length >= 6) run.box = [...run.box, run.party.pop()!];
  run.party = [...run.party, cutter];
  return '';
}

/** The raid was lost: every shop still open on this stage shuts for the stage. Returns how many shut. */
export function shutMarket(run: RunState): number {
  let shut = 0;
  for (const node of run.stage?.map.nodes ?? []) {
    for (const side of node.sides) {
      if (side.kind !== 'shop' || side.used) continue;
      side.used = true;
      shut += 1;
    }
  }
  return shut;
}
