import { describe, expect, it } from 'vitest';
import { simulateBattleDetail } from '../../src/quality/balanceSim';
import { createPlannedPokemon } from '../../src/core/encounters';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { content } from './helpers';

function fight(guardKos: number) {
  const c = { ...content, balance: { ...content.balance, trainerAi: { ...content.balance.trainerAi, sweepGuard: { kos: guardKos, stages: 1, stats: ['def', 'spd', 'spe'] as ('def' | 'spd' | 'spe')[] } } } };
  const strong = createPokemon(c, 'garchomp', 60, 'p0');
  for (const k of ['hp', 'atk', 'spe'] as const) strong.vitamins[k] = 3;
  strong.moves = ['earthquake', 'outrage'].map((id) => ({ id, pp: 10 }));
  strong.hp = maxHp(c, strong);
  const bench = createPokemon(c, 'magikarp', 5, 'p1');
  const foes = ['gengar', 'blissey', 'snorlax', 'alakazam'].map((s, i) => createPlannedPokemon(c, { speciesId: s, level: 50, moves: ['tackle'] }, `e${i}`));
  return simulateBattleDetail(c, [strong, bench], foes, 0.8, 'guard-seed');
}

describe('sweep guard', () => {
  it('is deterministic and the fight ends', () => {
    expect(fight(2)).toEqual(fight(2));
    expect(['player', 'enemy']).toContain(fight(2).winner);
  });
  it('does nothing when switched off (0 KOs)', () => {
    const a = fight(0);
    expect(a.turns).toBeGreaterThan(0);
  });
  it('braced foes make a streak last at least as many turns', () => {
    expect(fight(2).turns).toBeGreaterThanOrEqual(fight(0).turns);
  });
});
