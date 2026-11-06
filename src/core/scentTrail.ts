// Scent Trails (S220): at the Workshop, follow the traces of a species this stage's route throws up, and the next wild
// encounters are far likelier to be that species (and its evolution line). Same temp-effect route as lures, so no save change.

import type { ArchetypeModifier, Content } from './contentSchema';
import { CRAFTING, materialName } from './crafting';
import { habitatIds } from './habitat';
import type { RunState } from './state';

export const TRAIL_PREFIX = 'trail-';
const TRAIL = { materials: 3, battles: 2, value: 6 } as const;

export interface TrailOption {
  /** Base-form species id the trail leads to. */
  speciesId: string;
  name: string;
  material: string;
  cost: number;
}

/** The trails on offer: the stage's likeliest species, each costing the material of its first type. */
export function trailOptions(content: Content, run: RunState): TrailOption[] {
  return habitatIds(content, run, 4).flatMap((speciesId) => {
    const sp = content.species.get(speciesId);
    const material = sp ? CRAFTING.typeMaterial[sp.types[0]!] : undefined;
    return sp && material ? [{ speciesId, name: sp.name, material, cost: TRAIL.materials }] : [];
  });
}

export function trailProblem(content: Content, run: RunState, speciesId: string): string | null {
  const opt = trailOptions(content, run).find((o) => o.speciesId === speciesId);
  if (!opt) return 'That trail has gone cold.';
  if ((run.materials[opt.material] ?? 0) < opt.cost) return `Needs ${opt.cost} ${materialName(opt.material)} (you have ${run.materials[opt.material] ?? 0}).`;
  if (run.tempEffects.some((t) => t.effects.some((m) => m.kind === 'speciesEncounterWeight' && m.lines?.includes(speciesId)))) return 'You are already on that trail.';
  return null;
}

/** Spends the cost and starts the trail (mutates `run`; the caller checked `trailProblem`). Returns a message. */
export function followTrail(content: Content, run: RunState, speciesId: string): string {
  const opt = trailOptions(content, run).find((o) => o.speciesId === speciesId)!;
  run.materials[opt.material] = (run.materials[opt.material] ?? 0) - opt.cost;
  if (run.materials[opt.material] === 0) delete run.materials[opt.material];
  const effects: ArchetypeModifier[] = [{ kind: 'speciesEncounterWeight', lines: [speciesId], value: TRAIL.value }];
  run.perkEffects.push(...effects);
  run.tempEffects.push({ effects, battles: TRAIL.battles, until: 'wild' });
  return `You pick up the scent of ${opt.name}: the next ${TRAIL.battles} wild encounters are far likelier to be its line.`;
}
