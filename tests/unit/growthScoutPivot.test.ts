// Growth paths batch 11: Scout (first strike on a foe that just appeared) and Pivot (U-turn-style exits).
import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { COUNTER_PATHS, DEFAULT_GROWTH_CONFIG as CFG, growthAccuracyMultiplier, growthDamageMultiplier, pathFor } from '../../src/core/overhaul/growth';
import { content } from './helpers';

const hist = (uid: string, growth: Record<string, number>) => ({ uid, knockoutsDealt: 0, closeCalls: 0, growth });

describe('Scout', () => {
  it('is earned from first strikes (5+, most in party) and adds accuracy only against a foe that just appeared', () => {
    expect(COUNTER_PATHS.scout?.counter).toBe('scoutFirst');
    const a = hist('a', { scoutFirst: 5 });
    const b = hist('b', { scoutFirst: 1 });
    expect(pathFor(CFG, a, ['normal'], [a, b])).toBe('scout');
    expect(pathFor(CFG, b, ['normal'], [a, b])).toBeNull();
    const acc = (path: string | undefined, scout: boolean) => growthAccuracyMultiplier(CFG, { growthPath: path }, 90, 'physical', null, 'normal', false, { scout });
    expect(acc('scout', true)).toBeCloseTo(1.03);
    expect(acc('scout', false)).toBe(1);
    expect(acc(undefined, true)).toBe(1);
  });
});

describe('Pivot', () => {
  it('is earned from pivot exits (4+, most in party) and boosts damage only on the flagged first turn', () => {
    expect(COUNTER_PATHS.pivot?.counter).toBe('pivotOut');
    const a = hist('a', { pivotOut: 4 });
    expect(pathFor(CFG, a, ['normal'], [a])).toBe('pivot');
    const hit = (pivoted: boolean) => growthDamageMultiplier(CFG, { growthPath: 'pivot' }, 'normal', 1, 1, ['normal'], { pivoted });
    expect(hit(true)).toBeCloseTo(1.05);
    expect(hit(false)).toBe(1);
  });
  it('U-turn leaves a pivotOut mark and the next switch-in is flagged; a later plain entry is not', () => {
    const a = createPokemon(content, 'scyther', 50, 'a');
    a.moves = [{ id: 'u-turn', pp: 20 }];
    const b = createPokemon(content, 'blissey', 50, 'b');
    const enemy = createPokemon(content, 'blissey', 60, 'e');
    const battle = createBattle('wild', [enemy], 0, a.uid);
    const ctx: BattleContext = { content, battle, party: [a, b], inventory: {}, rng: new Rng(hashSeed('gsp1')), captureRng: new Rng(hashSeed('gsp2')), catchMultiplier: 1 };
    resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(battle.needsSwitch).toBe(true);
    expect(battle.growthMarks).toContain('pivotOut:a');
    resolveTurn(ctx, { kind: 'switch', partyIndex: 1 });
    expect(battle.growthMarks).toContain('pivotIn:b');
    expect(battle.growthMarks).not.toContain('pivoted');
  });
  it('a voluntary switch after dealing damage counts; one without does not', () => {
    const run = (hit: boolean) => {
      const a = createPokemon(content, 'machamp', 50, 'a');
      a.moves = [{ id: 'tackle', pp: 35 }];
      const b = createPokemon(content, 'blissey', 50, 'b');
      const battle = createBattle('wild', [createPokemon(content, 'blissey', 60, 'e')], 0, a.uid);
      const ctx: BattleContext = { content, battle, party: [a, b], inventory: {}, rng: new Rng(hashSeed('gsp3')), captureRng: new Rng(hashSeed('gsp4')), catchMultiplier: 1 };
      if (hit) resolveTurn(ctx, { kind: 'move', index: 0 });
      resolveTurn(ctx, { kind: 'switch', partyIndex: 1 });
      return battle.growthMarks ?? [];
    };
    expect(run(true)).toContain('pivotOut:a');
    expect(run(false)).not.toContain('pivotOut:a');
  });
});
