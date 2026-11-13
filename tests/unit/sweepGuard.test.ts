import { describe, expect, it } from 'vitest';
import { simulateBattleDetail } from '../../src/quality/balanceSim';
import { createPlannedPokemon } from '../../src/core/encounters';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { rallyStages } from '../../src/core/battle/rally';
import { content } from './helpers';

function fight(guardKos: number) {
  const c = { ...content, balance: { ...content.balance, trainerAi: { ...content.balance.trainerAi, sweepGuard: { ...content.balance.trainerAi.sweepGuard, kos: guardKos } } } };
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

describe('Rally stacking and ceiling', () => {
  const cfg = content.balance.trainerAi.sweepGuard;
  it('is +1 at the first streak, +2 when it doubles, and off below the streak', () => {
    expect(rallyStages(cfg, cfg.kos - 1, 0)).toBe(0);
    expect(rallyStages(cfg, cfg.kos, 0)).toBe(1);
    expect(rallyStages(cfg, cfg.kos * 2, 0)).toBe(2);
    expect(rallyStages(cfg, cfg.kos * 9, 0)).toBe(cfg.maxStages * cfg.stages);
  });
  it('never lifts a stat past the ceiling and is off at 0 KOs', () => {
    expect(rallyStages(cfg, 9, cfg.ceiling - 1)).toBe(1);
    expect(rallyStages(cfg, 9, cfg.ceiling)).toBe(0);
    expect(rallyStages({ ...cfg, kos: 0 }, 9, 0)).toBe(0);
  });
  it('the shipped numbers are +1/+2 on Defence and Sp. Def with a +4 ceiling', () => {
    expect([cfg.kos, cfg.stages, cfg.maxStages, cfg.ceiling, [...cfg.stats].sort().join()]).toEqual([2, 1, 2, 4, 'def,spd']);
  });
});
