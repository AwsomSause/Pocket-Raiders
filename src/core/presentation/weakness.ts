// What a Pokémon is weak to, for the battle screen's foe panel (the mock-ups' "Weak to" row). Pure: the type chart
// and the Pokémon's types in, the attacking types that hit it super effectively out (4x first, then 2x, chart order).

import { typeEffectiveness } from '../battle/damage';
import type { TypeChart, TypeName } from '../contentSchema';

export interface Weakness { type: TypeName; times: number }

export function weaknesses(chart: TypeChart, defenders: readonly TypeName[]): Weakness[] {
  if (defenders.length === 0) return [];
  return (Object.keys(chart) as TypeName[])
    .map((type, k) => ({ type, times: typeEffectiveness(chart, type, defenders), k }))
    .filter((w) => w.times > 1)
    .sort((a, b) => b.times - a.times || a.k - b.k)
    .map(({ type, times }) => ({ type, times }));
}
