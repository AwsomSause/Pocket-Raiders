// S118 Family Tree of Rivals: when a rival gives up after too many defeats (state "retired"), a sibling
// may step forward and take up its grudge. The sibling is a new rival of the same trainer class with the
// parent's character (more vindictive), a share of its rival potential, and a name chosen on a seed of
// its own, so no other roll changes. One sibling per rival; it counts against the run's rival limit.

import type { Content } from '../contentSchema';
import { hashSeed, Rng } from '../rng';
import type { RunState } from '../state';
import type { Rival, Traits } from '../story/schema';
import { TRAIT_KEYS } from '../story/schema';
import { factionFor } from './standing';
import { RIVAL_ARCS, RIVAL_CONFIG } from './schema';

const clamp = (n: number) => Math.max(0, Math.min(100, n));

/** A retired rival's sibling, made on a seeded roll (at most once per rival). Returns the sibling and the rumour, or null. */
export function maybeSibling(content: Content, run: RunState, parent: Rival, stageKey: string): { sibling: Rival; rumor: string } | null {
  const cfg = RIVAL_CONFIG.siblings;
  const rivals = run.story.rivals;
  if (parent.state !== 'retired' || parent.sibling) return null;
  if (rivals.filter((r) => r.state !== 'retired').length >= RIVAL_CONFIG.maxRivals) return null;
  const rng = new Rng(hashSeed(`${run.seed}::rival-sibling::${stageKey}::${parent.id}`));
  if (!rng.chance(cfg.chance)) return null;
  const taken = new Set(rivals.map((r) => r.name));
  const names = cfg.names.filter((n) => !taken.has(n));
  const name = rng.pick(names.length ? names : cfg.names);
  const traits = Object.fromEntries(TRAIT_KEYS.map((k) => [k, parent.traits[k]])) as Traits;
  traits.vindictiveness = clamp(traits.vindictiveness + cfg.vindictivenessGain);
  const id = `${parent.id}-sibling`;
  const sibling: Rival = {
    id,
    classId: parent.classId,
    name,
    archetype: parent.archetype,
    style: parent.style,
    traits,
    rivalPotential: Math.round(parent.rivalPotential * cfg.potentialShare),
    state: 'recognized',
    arc: null,
    away: 0,
    faction: parent.faction ?? factionFor(parent.archetype),
    cooldown: 0,
    progress: 0,
    encounters: 0,
    setbacks: 0,
    adaptations: [],
    bonds: {},
    offscreen: [],
    origin: { ...parent.origin, eventId: `${parent.origin.eventId}:sibling`, path: parent.origin.path },
    siblingOf: { id: parent.id, name: parent.name },
    memory: structuredClone(parent.memory),
  };
  const arc = RIVAL_ARCS.arcs.find((a) => a.personalities.includes(parent.archetype));
  if (arc) sibling.arc = { id: arc.id, stage: 0, ticks: 0, resolution: null };
  parent.sibling = id;
  rivals.push(sibling);
  const cls = content.trainers.get(parent.classId)?.name ?? 'Trainer';
  return { sibling, rumor: `${cls} ${name}, ${parent.name}'s sibling, has vowed to settle the score` };
}
