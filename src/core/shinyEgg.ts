// W9 (design 14.24): the Max Luck shiny egg.
// Qualifier B (director's answer): effective Luck is at the attribute cap. The run is given one guaranteed-shiny egg
// of a random valid first-stage species, once per run. The species comes from its own stream `${seed}::shiny-egg`, so no
// existing roll moves. The shiny is forced: no roll, and the shiny meter and catch chain are untouched.
// State: `run.itemCounters['shiny-egg'] = 1` (no save bump). Cosmetic egg variants are not built (optional in the design).
import { layEgg } from './eggs';
import { effectiveAttributes } from './attributes';
import { Rng, hashSeed } from './rng';
import { isWildEligible } from './themes';
import { familyId } from './mastery';
import type { Content } from './contentSchema';
import type { RunState } from './state';

export const SHINY_EGG_KEY = 'shiny-egg';

/** Does this run qualify (and has it not been given the egg yet)? Pure read. */
export function shinyEggDue(content: Content, run: RunState): boolean {
  if (run.itemCounters?.[SHINY_EGG_KEY]) return false;
  return effectiveAttributes(content, run).luck >= content.balance.attributeMax;
}

/** The families the egg can be: first stages that are wild-eligible (regional and alternate forms count), never legendary-like. */
export function shinyEggSpecies(content: Content): string[] {
  return [...content.species.values()].filter((s) => s.evolutionStage === 1 && isWildEligible(content, s, true)).map((s) => s.id).sort();
}

/** Gives the egg if due. Returns true when it was given. Safe to call every stage (it grants once). */
export function grantShinyEgg(content: Content, run: RunState): boolean {
  if (!shinyEggDue(content, run)) return false;
  const pool = shinyEggSpecies(content);
  if (pool.length === 0) return false;
  const rng = new Rng(hashSeed(`${run.seed}::shiny-egg`));
  const species = pool[rng.int(0, pool.length - 1)]!;
  const levels = run.party.map((m) => m.level);
  const level = Math.max(1, Math.floor(levels.reduce((a, b) => a + b, 0) / Math.max(1, levels.length)) - 5);
  const cfg = content.balance.shinyEgg;
  layEgg(content, run, familyId(content, species), { level, left: cfg.left, unit: 'stage', source: 'Shiny Egg', origin: cfg.origin, forceShiny: true }, rng);
  run.itemCounters = { ...run.itemCounters, [SHINY_EGG_KEY]: 1 };
  return true;
}
