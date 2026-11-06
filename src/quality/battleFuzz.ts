// Fuzz Tester for Battles (idea S341): plays many seeded random battles (random species, levels, team sizes, damage
// taken, with and without the Mega/Z/Tera/Dynamax kit) and reports anything that crashes, never ends, or leaves the
// result in an impossible shape. Deterministic: the same seed gives the same cases. Run it with `npm run fuzz:battle`.

import type { Content } from '../core/contentSchema';
import { createPokemon, maxHp } from '../core/pokemon';
import { hashSeed, Rng } from '../core/rng';
import type { PokemonInstance } from '../core/state';
import { simulateBattle } from './balanceSim';

export interface FuzzFailure { caseIndex: number; seed: string; problem: string }
export interface FuzzReport { cases: number; failures: FuzzFailure[]; wins: number; losses: number; draws: number }

function team(content: Content, rng: Rng, ids: string[], prefix: string, level: number): PokemonInstance[] {
  const size = rng.int(1, 3);
  return Array.from({ length: size }, (_, i) => {
    const mon = createPokemon(content, rng.pick(ids), Math.max(1, level + rng.int(-3, 3)), `${prefix}${i}`);
    // Some start the battle already hurt.
    if (rng.float() < 0.3) mon.hp = Math.max(1, Math.floor(maxHp(content, mon) * (0.1 + rng.float() * 0.9)));
    return mon;
  });
}

export function fuzzBattles(content: Content, seed: string, cases: number): FuzzReport {
  const rng = new Rng(hashSeed(`${seed}#fuzz`));
  const ids = [...content.species.keys()].sort();
  const report: FuzzReport = { cases, failures: [], wins: 0, losses: 0, draws: 0 };
  for (let i = 0; i < cases; i++) {
    const caseSeed = `${seed}#${i}`;
    try {
      const level = rng.int(1, 100);
      const kit = rng.float() < 0.5;
      const ai = rng.float();
      const result = simulateBattle(content, team(content, rng, ids, 'p', level), team(content, rng, ids, 'e', level), ai, caseSeed, kit);
      if (!['player', 'enemy', 'draw'].includes(result.winner)) report.failures.push({ caseIndex: i, seed: caseSeed, problem: `odd winner ${String(result.winner)}` });
      else if (!Number.isInteger(result.turns) || result.turns < 0) report.failures.push({ caseIndex: i, seed: caseSeed, problem: `odd turn count ${result.turns}` });
      else if (result.winner === 'player') report.wins++;
      else if (result.winner === 'enemy') report.losses++;
      else report.draws++;
    } catch (e) {
      report.failures.push({ caseIndex: i, seed: caseSeed, problem: e instanceof Error ? e.message : String(e) });
    }
  }
  return report;
}
