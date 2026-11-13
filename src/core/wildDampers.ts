// Beta 0.6 B2: wild dampeners. The same Pokémon (and its relatives) turn up less the more you have already met them this run,
// the first few wild fights never repeat a species, and each early stage has one "odd one out" uncommon.
// Pure: reads the run's pick history ('wildMet', filled by rememberPick in run.ts) and a private hash; it draws from no run stream.

import { availabilityOf } from './availability';
import type { Content } from './contentSchema';
import { familyId } from './mastery';
import { hashSeed, Rng } from './rng';
import type { RunState } from './state';
import { recentPicks } from './variety';

/** History pool that keeps every species met in the wild this run (up to its window). */
export const WILD_MET_POOL = 'wildMet';

/** Weight multiplier for a drawn species from what this run has already met. 1 when the dampeners are off. */
export function wildMetWeight(content: Content, run: Pick<RunState, 'history'>): (speciesId: string) => number {
  const cfg = content.balance.wildDampeners;
  if (!cfg.enabled) return () => 1;
  const met = recentPicks(run, WILD_MET_POOL);
  if (met.length === 0) return () => 1;
  const families = met.map((id) => familyId(content, id));
  return (id) => {
    const family = familyId(content, id);
    let exact = 0;
    let relatives = 0;
    met.forEach((m, i) => {
      if (m === id) exact++;
      else if (families[i] === family) relatives++;
    });
    let w = cfg.perMeet ** exact * cfg.perFamilyMeet ** relatives;
    // No species repeats in the first fights: a near-zero weight (not zero, so a small pool can never run dry).
    if (met.length < cfg.noRepeatFirst && exact + relatives > 0) w *= 0.0001;
    return w;
  };
}

/** Whether this wild node is its stage's "odd one out": one wild node per early stage, chosen by hash (no stream used). */
export function isOddOneOutNode(content: Content, run: Pick<RunState, 'seed' | 'regionIndex' | 'stage'>, stageNumber: number, nodeId: string): boolean {
  const cfg = content.balance.wildDampeners;
  if (!cfg.enabled || stageNumber >= cfg.oddOneOutStages || !run.stage) return false;
  const wild = run.stage.map.nodes.filter((n: { kind: string; id: string }) => n.kind === 'wild').map((n) => n.id);
  if (wild.length === 0) return false;
  const pick = new Rng(hashSeed(`${run.seed}:balance-odd-one:${run.regionIndex}:${run.stage.index}`)).int(0, wild.length - 1);
  return wild[pick] === nodeId;
}

/** On the odd-one-out node, uncommon species keep their weight and everything else is nearly out. */
export function oddOneOutWeight(content: Content): (speciesId: string) => number {
  const off = content.balance.wildDampeners.oddOneOutOffWeight;
  return (id) => (availabilityOf(content, id)?.rarity === 'uncommon' ? 1 : off);
}
