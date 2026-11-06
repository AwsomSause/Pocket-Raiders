// Battle/AI batch 3. S171 Evolution by Condition Variety: besides level, item and friendship (and the Bond Engine's bond
// route), some Pokémon evolve early when a condition is met after a battle: the weather the battle ended in, knowing a
// move, or using a move often enough. Checked after battles (core/run.ts); pure and RNG-free.

import type { Content } from './contentSchema';
import type { PokemonInstance } from './state';

export type EvoCondition =
  | { kind: 'weather'; weather: 'rain' | 'sun' | 'sand' | 'snow' | 'hail' }
  | { kind: 'knowsMove'; move: string }
  | { kind: 'moveUses'; move: string; count: number };

export interface ConditionEvolution {
  from: string;
  to: string;
  /** The earliest level this route works at. */
  minLevel: number;
  condition: EvoCondition;
}

export const CONDITION_EVOLUTIONS: ConditionEvolution[] = [
  { from: 'sliggoo', to: 'goodra', minLevel: 40, condition: { kind: 'weather', weather: 'rain' } },
  { from: 'aipom', to: 'ambipom', minLevel: 20, condition: { kind: 'knowsMove', move: 'double-hit' } },
  { from: 'yanma', to: 'yanmega', minLevel: 20, condition: { kind: 'knowsMove', move: 'ancient-power' } },
  { from: 'tangela', to: 'tangrowth', minLevel: 20, condition: { kind: 'knowsMove', move: 'ancient-power' } },
  { from: 'lickitung', to: 'lickilicky', minLevel: 20, condition: { kind: 'knowsMove', move: 'rollout' } },
  { from: 'steenee', to: 'tsareena', minLevel: 18, condition: { kind: 'knowsMove', move: 'stomp' } },
  { from: 'bonsly', to: 'sudowoodo', minLevel: 10, condition: { kind: 'knowsMove', move: 'mimic' } },
  { from: 'mime-jr', to: 'mr-mime', minLevel: 10, condition: { kind: 'knowsMove', move: 'mimic' } },
  { from: 'girafarig', to: 'farigiraf', minLevel: 20, condition: { kind: 'knowsMove', move: 'twin-beam' } },
  { from: 'dunsparce', to: 'dudunsparce', minLevel: 20, condition: { kind: 'knowsMove', move: 'hyper-drill' } },
  { from: 'stantler', to: 'wyrdeer', minLevel: 20, condition: { kind: 'moveUses', move: 'psyshield-bash', count: 20 } },
  { from: 'primeape', to: 'annihilape', minLevel: 25, condition: { kind: 'moveUses', move: 'rage-fist', count: 20 } },
];

/** Moves whose uses are counted on the Pokémon (`moveCounts`) because a route needs them. */
export const COUNTED_MOVES = new Set(CONDITION_EVOLUTIONS.flatMap((e) => (e.condition.kind === 'moveUses' ? [e.condition.move] : [])));

/** Counts one use of a move by your Pokémon when a route needs it (mutates `mon`). */
export function countMoveUse(mon: PokemonInstance, moveId: string): void {
  if (!COUNTED_MOVES.has(moveId)) return;
  mon.moveCounts = { ...mon.moveCounts, [moveId]: Math.min(999, (mon.moveCounts?.[moveId] ?? 0) + 1) };
}

/** Plain words for a route ("knows Ancient Power", "battle in rain", "use Rage Fist 20 times"). */
export function conditionText(content: Content, c: EvoCondition): string {
  if (c.kind === 'weather') return `win a battle that ends in ${c.weather}`;
  const name = content.moves.get(c.move)?.name ?? c.move;
  return c.kind === 'knowsMove' ? `know ${name}` : `use ${name} ${c.count} times`;
}

/** The species this Pokémon evolves into by a condition route right now (`weather` = the weather the battle ended in), or null. */
export function conditionEvolutionTarget(content: Content, mon: PokemonInstance, weather: string | null): string | null {
  if (mon.hp <= 0 || mon.care?.holdEvolve) return null;
  for (const e of CONDITION_EVOLUTIONS) {
    if (e.from !== mon.speciesId || mon.level < e.minLevel || !content.species.has(e.to)) continue;
    const c = e.condition;
    const met = c.kind === 'weather' ? weather === c.weather : c.kind === 'knowsMove' ? mon.moves.some((m) => m.id === c.move) : (mon.moveCounts?.[c.move] ?? 0) >= c.count;
    if (met) return e.to;
  }
  return null;
}
