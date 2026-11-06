// Cross-system check (Overhaul slice 2, THE OVERHAUL.md rule 5): walks every species and form
// and checks, in one place, that the systems that touch a Pokémon still agree about it:
// creating it for battle (stats, moves, ability), evolution, eggs, trades, battle forms and
// sprites. Save/load is checked by tests/unit/crossSystem.test.ts (src/save sits above core).
// A change to one Pokémon's data can't silently break another system: the test fails and names it.
// Never imports Phaser. Read-only: works on copies and never touches gameplay RNG streams.

import type { Content, Species } from '../core/contentSchema';
import type { PokemonInstance, RunState } from '../core/state';
import { abilityOf, calcStats, createPokemon, maxHp } from '../core/pokemon';
import { evolve } from '../core/evolution';
import { hatchEgg, layEgg } from '../core/eggs';
import { familyId } from '../core/mastery';
import { tradeOffer } from '../core/services/flow';
import { traderPool } from '../core/plaza/flow';
import { PLAZA } from '../core/plaza/schema';
import { gmaxFormFor, stoneForms } from '../core/battle/transform';
import { hashSeed, Rng } from '../core/rng';
import { filesOf, pokemonEntries } from '../assets/catalog';
import { isTransformation, meetableSpecies } from './supportStatus';

export const CROSS_SYSTEMS = ['battle', 'evolution', 'egg', 'trade', 'form', 'sprite'] as const;
export type CrossSystem = (typeof CROSS_SYSTEMS)[number];

export interface CrossProblem {
  speciesId: string;
  system: CrossSystem;
  problem: string;
}

export interface CrossInputs {
  /** A run to lay eggs and offer trades in (it is copied, never changed). */
  run: RunState;
  /** Whether a file exists under public/assets/. */
  assetExists: (path: string) => boolean;
  /** Only these species (default: all of them). */
  speciesIds?: readonly string[];
}

/** Why this Pokémon is broken for battle, or null: stats, HP, moves and ability all resolve. */
function battleProblem(content: Content, mon: PokemonInstance): string | null {
  const stats = calcStats(content, mon);
  for (const [k, v] of Object.entries(stats)) if (!Number.isFinite(v) || v <= 0) return `stat ${k} is ${v}`;
  if (!(maxHp(content, mon) > 0) || mon.hp !== maxHp(content, mon)) return `HP ${mon.hp} of ${maxHp(content, mon)}`;
  if (mon.moves.length < 1 || mon.moves.length > 4) return `${mon.moves.length} moves`;
  for (const m of mon.moves) if (!content.moves.has(m.id)) return `unknown move "${m.id}"`;
  const ability = abilityOf(content, mon);
  if (ability !== null && !content.abilities.has(ability)) return `unknown ability "${ability}"`;
  return null;
}

/** Every problem the walk finds, in species order. An empty list means every system agrees. */
export function crossSystemProblems(content: Content, inputs: CrossInputs): CrossProblem[] {
  const problems: CrossProblem[] = [];
  const add = (speciesId: string, system: CrossSystem, problem: string) => problems.push({ speciesId, system, problem });
  const meetable = meetableSpecies(content);
  const ids = inputs.speciesIds ?? [...content.species.keys()];

  // Plaza traders: everything they may hand over is a real, catchable (not battle-only) species.
  for (const t of PLAZA.traders) {
    for (const id of traderPool(content, t)) {
      const s = content.species.get(id);
      if (!s) add(id, 'trade', `Plaza trader "${t.id}" gives a species the game doesn't have`);
      else if (isTransformation(s)) add(id, 'trade', `Plaza trader "${t.id}" gives a battle-only form`);
    }
  }

  for (const id of ids) {
    const s = content.species.get(id);
    if (!s) {
      add(id, 'battle', 'not in the species list');
      continue;
    }
    let mon: PokemonInstance;
    try {
      mon = createPokemon(content, id, 50, `x-${id}`);
      const p = battleProblem(content, mon);
      if (p) add(id, 'battle', p);
    } catch (e) {
      add(id, 'battle', `can't be created: ${(e as Error).message}`);
      continue;
    }
    for (const a of [...s.abilities.normal, ...(s.abilities.hidden ? [s.abilities.hidden] : [])]) if (!content.abilities.has(a)) add(id, 'battle', `lists unknown ability "${a}"`);

    checkEvolutions(content, s, mon, add);
    checkForms(content, s, add);
    checkSprites(s, inputs.assetExists, add);
    if (meetable.has(id) && !isTransformation(s)) {
      checkEgg(content, inputs.run, s, add);
      checkTrade(content, inputs.run, mon, add);
    }
  }
  return problems;
}

type Add = (speciesId: string, system: CrossSystem, problem: string) => void;

function checkEvolutions(content: Content, s: Species, mon: PokemonInstance, add: Add): void {
  for (const evo of s.evolutions) {
    const target = content.species.get(evo.to);
    if (!target) {
      add(s.id, 'evolution', `evolves into unknown species "${evo.to}"`);
      continue;
    }
    if (evo.item && !content.items.has(evo.item)) add(s.id, 'evolution', `evolves with unknown item "${evo.item}"`);
    if (isTransformation(target)) add(s.id, 'evolution', `evolves into battle-only form "${evo.to}"`);
    const copy = structuredClone(mon);
    try {
      evolve(content, copy, evo.to);
      if (copy.speciesId !== evo.to) add(s.id, 'evolution', `evolving into "${evo.to}" left it as "${copy.speciesId}"`);
      const p = battleProblem(content, { ...copy, hp: maxHp(content, copy) });
      if (p) add(s.id, 'evolution', `after evolving into "${evo.to}": ${p}`);
    } catch (e) {
      add(s.id, 'evolution', `evolving into "${evo.to}" throws: ${(e as Error).message}`);
    }
  }
}

function checkForms(content: Content, s: Species, add: Add): void {
  if (s.form && !content.species.has(s.form.base)) add(s.id, 'form', `form of unknown species "${s.form.base}"`);
  for (const primal of [false, true]) {
    for (const o of stoneForms(content, s.id, primal)) {
      const f = content.species.get(o.formId);
      if (!f) add(s.id, 'form', `${primal ? 'orb' : 'stone'} "${o.itemId}" turns it into unknown form "${o.formId}"`);
      else if (!isTransformation(f)) add(s.id, 'form', `${primal ? 'orb' : 'stone'} "${o.itemId}" turns it into "${o.formId}", which is not a battle form`);
    }
  }
  const gmax = gmaxFormFor(content, s.id);
  if (gmax && content.species.get(gmax)?.form?.base !== s.id && !gmax.startsWith(`${s.id}-`)) add(s.id, 'form', `Gigantamax form "${gmax}" belongs to another species`);
}

function checkSprites(s: Species, assetExists: (p: string) => boolean, add: Add): void {
  const [front, , , , icon, cry] = pokemonEntries(s.assets);
  for (const [entry, what] of [[front!, 'front sprite'], [icon!, 'party icon'], [cry!, 'cry']] as const) {
    const missing = filesOf(entry).filter((p) => !assetExists(p));
    if (missing.length) add(s.id, 'sprite', `${what} missing: ${missing.join(', ')}`);
  }
}

function checkEgg(content: Content, base: RunState, s: Species, add: Add): void {
  const family = familyId(content, s.id);
  if (!content.species.has(family)) {
    add(s.id, 'egg', `egg family "${family}" is not a species`);
    return;
  }
  const run = structuredClone(base);
  try {
    const egg = layEgg(content, run, s.id, { level: 10, left: 1, unit: 'battle', source: 'cross-check' }, new Rng(hashSeed(`cross::${s.id}`)));
    const hatched = hatchEgg(content, run, egg);
    if (hatched.speciesId !== family) add(s.id, 'egg', `egg of "${family}" hatched as "${hatched.speciesId}"`);
    const p = battleProblem(content, hatched);
    if (p) add(s.id, 'egg', `hatchling: ${p}`);
    if (!reaches(content, family, s.id)) add(s.id, 'egg', `its egg hatches as "${family}", which never evolves into it`);
  } catch (e) {
    add(s.id, 'egg', `egg can't be laid or hatched: ${(e as Error).message}`);
  }
}

/** Whether `from` becomes `to` through some chain of evolutions (or regional/alternate form of it). */
function reaches(content: Content, from: string, to: string): boolean {
  const seen = new Set<string>();
  const queue = [from];
  while (queue.length) {
    const id = queue.pop()!;
    if (id === to) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    for (const e of content.species.get(id)?.evolutions ?? []) queue.push(e.to);
  }
  const t = content.species.get(to);
  return Boolean(t?.form && t.form.base !== to && reaches(content, from, t.form.base));
}

function checkTrade(content: Content, base: RunState, mon: PokemonInstance, add: Add): void {
  const run = structuredClone(base);
  run.party = [mon];
  try {
    const to = tradeOffer(content, run, 'cross-check', mon);
    if (to === null) return;
    const t = content.species.get(to);
    if (!t) add(mon.speciesId, 'trade', `Trade Post offers unknown species "${to}"`);
    else if (isTransformation(t)) add(mon.speciesId, 'trade', `Trade Post offers battle-only form "${to}"`);
    else {
      const p = battleProblem(content, createPokemon(content, to, mon.level, `t-${to}`));
      if (p) add(mon.speciesId, 'trade', `traded-for "${to}": ${p}`);
    }
  } catch (e) {
    add(mon.speciesId, 'trade', `Trade Post throws: ${(e as Error).message}`);
  }
}
