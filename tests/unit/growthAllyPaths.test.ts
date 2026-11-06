// Growth paths batch 8: Medic, Bodyguard, Trapper, Berry Friend, Vanguard, Lucky, Fossil Memory, Scale Guard.
import { describe, expect, it } from 'vitest';
import { makeDoubles } from '../../src/core/battle/doubles';
import { createBattle, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { COUNTER_PATHS, DEFAULT_GROWTH_CONFIG as CFG, growthBerryMultiplier, growthCritBonus, growthHealMultiplier, growthIncomingMultiplier, growthVanguardMultiplier, moveRoleCounters, pathFor } from '../../src/core/overhaul/growth';
import { chooseStarter, createRun } from '../../src/core/run';
import { recordBattleTurn } from '../../src/core/story/hooks';
import { openHistory } from '../../src/core/story/record';
import { content, toBattle } from './helpers';

describe('multipliers', () => {
  it('each path changes only its own number', () => {
    const p = (growthPath: string) => ({ growthPath });
    expect(growthHealMultiplier(CFG, p('medic'))).toBeCloseTo(1.05);
    expect(growthHealMultiplier(CFG, p('striker'))).toBe(1);
    expect(growthBerryMultiplier(CFG, p('berry-friend'))).toBeCloseTo(1.05);
    expect(growthBerryMultiplier(CFG, p('medic'))).toBe(1);
    expect(growthVanguardMultiplier(CFG, p('vanguard'), 0)).toBeCloseTo(1.05);
    expect(growthVanguardMultiplier(CFG, p('vanguard'), 1)).toBe(1);
    expect(growthIncomingMultiplier(CFG, p('scale-guard'), 'Ice')).toBeCloseTo(0.97);
    expect(growthIncomingMultiplier(CFG, p('scale-guard'), 'fire')).toBe(1);
    expect(growthCritBonus(CFG, p('lucky'))).toBeCloseTo(0.01);
    expect(growthCritBonus(CFG, p('striker'))).toBe(0);
  });
  it('binding and trapping moves are counted for Trapper', () => {
    expect(moveRoleCounters({ id: 'wrap', category: 'physical', bind: true })).toContain('useTrap');
    expect(moveRoleCounters({ id: 'mean-look', category: 'status', trap: true })).toContain('useTrap');
    expect(moveRoleCounters({ id: 'tackle', category: 'physical' })).not.toContain('useTrap');
  });
  it('type gates', () => {
    const h = (counter: string) => ({ uid: 'a', knockoutsDealt: 0, closeCalls: 0, growth: { [counter]: 10 } });
    expect(pathFor(CFG, h('resistHit'), ['dragon'], [h('resistHit')])).toBe('scale-guard');
    for (const id of ['medic', 'bodyguard', 'trapper', 'berry-friend', 'vanguard', 'lucky']) expect(COUNTER_PATHS[id], id).toBeDefined();
  });
});

describe('engine effects', () => {
  const ctxOf = (player: ReturnType<typeof createPokemon>, enemy: ReturnType<typeof createPokemon>, seed = 'b8') => {
    const battle = createBattle('wild', [enemy], 0, player.uid);
    const ctx: BattleContext = { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed(seed)), captureRng: new Rng(hashSeed(`${seed}c`)), catchMultiplier: 1 };
    return { battle, ctx };
  };
  it('Trapper: its binding move binds one turn longer', () => {
    const run = (path?: string) => {
      const player = createPokemon(content, 'machamp', 50, 'p');
      player.moves = [{ id: 'wrap', pp: 20 }];
      if (path) player.growthPath = path;
      const enemy = createPokemon(content, 'snorlax', 100, 'e');
      const { battle, ctx } = ctxOf(player, enemy);
      resolveTurn(ctx, { kind: 'move', index: 0 });
      return battle.enemyVolatile.bound;
    };
    const base = run();
    expect(base).toBeGreaterThan(0);
    expect(run('trapper')).toBe(base + 1);
  });
  it('Medic: its healing move restores more', () => {
    const run = (path?: string) => {
      const player = createPokemon(content, 'blissey', 50, 'p');
      player.moves = [{ id: 'floral-healing', pp: 10 }];
      if (path) player.growthPath = path;
      const enemy = createPokemon(content, 'snorlax', 100, 'e');
      enemy.hp = 1;
      const { ctx } = ctxOf(player, enemy);
      resolveTurn(ctx, { kind: 'move', index: 0 });
      return enemy.hp;
    };
    expect(run('medic')).toBeGreaterThan(run());
  });
});

describe('story hooks', () => {
  function setup(seed: string) {
    const run = structuredClone(toBattle(chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red' }), 0)));
    for (const m of run.party) openHistory(content, run, m.uid, m.speciesId, 'starter');
    return run;
  }
  const growth = (run: ReturnType<typeof setup>, uid: string) => run.story.histories[uid]?.growth ?? {};
  it('Vanguard: a fresh switch-in that takes a hit; Scale Guard: a resisted hit', () => {
    const run = setup('b8-van');
    const me = run.party[0]!;
    const before = structuredClone(run);
    recordBattleTurn(content, before, run, [
      { type: 'switchIn', side: 'player', uid: me.uid, speciesId: me.speciesId, level: me.level } as never,
      { type: 'move', side: 'enemy', moveId: 'tackle' } as never,
      { type: 'damage', side: 'player', amount: 5, hpAfter: 1, effectiveness: 0.5, crit: false } as never,
    ]);
    expect(growth(run, me.uid)).toMatchObject({ vanguardHit: 1, resistHit: 1 });
  });
  it('Lucky counts a crit only from a move with no crit boost; others do not', () => {
    const run = setup('b8-luck');
    const me = run.party[0]!;
    const before = structuredClone(run);
    recordBattleTurn(content, before, run, [
      { type: 'move', side: 'player', moveId: 'tackle' } as never,
      { type: 'damage', side: 'enemy', amount: 5, hpAfter: 20, effectiveness: 1, crit: true } as never,
      { type: 'move', side: 'player', moveId: 'slash' } as never,
      { type: 'damage', side: 'enemy', amount: 5, hpAfter: 15, effectiveness: 1, crit: true } as never,
    ]);
    expect(growth(run, me.uid).critLucky).toBe(1);
  });
  it('Medic and Bodyguard count in doubles only', () => {
    const run = setup('b8-med');
    run.party.push(createPokemon(content, 'machop', 10, 'second'));
    openHistory(content, run, 'second', 'machop', 'caught');
    run.battle!.enemyTeam.push(createPokemon(content, 'rattata', 3, 'e2'));
    makeDoubles(run.battle!, run.party);
    const me = run.party[0]!;
    const before = structuredClone(run);
    recordBattleTurn(content, before, run, [
      { type: 'move', side: 'player', moveId: 'floral-healing' } as never,
      { type: 'heal', side: 'player', amount: 10, hpAfter: 30 } as never,
      { type: 'move', side: 'player', moveId: 'wide-guard' } as never,
    ]);
    expect(growth(run, me.uid)).toMatchObject({ healAlly: 1, guardAlly: 1 });
    const solo = setup('b8-solo');
    const b2 = structuredClone(solo);
    recordBattleTurn(content, b2, solo, [{ type: 'move', side: 'player', moveId: 'wide-guard' } as never]);
    expect(growth(solo, solo.party[0]!.uid).guardAlly).toBeUndefined();
  });
});
