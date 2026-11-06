// Growth paths batch 7: KO situations and a few move kinds (Hunter, Sweeper, Comeback, Duelist, Glass Cannon, Speedster,
// Scarfer, Legend Hunter, Rival Mirror, Grudge Keeper, Silk Spinner, Haunt Keeper, Trickster).
import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { chooseStarter, createRun } from '../../src/core/run';
import { COUNTER_PATHS, DEFAULT_GROWTH_CONFIG as CFG, growthAccuracyMultiplier, growthDamageMultiplier, growthDefenseMultiplier, growthSpeedMultiplier, koCounters, moveRoleCounters, pathFor } from '../../src/core/overhaul/growth';
import { openHistory } from '../../src/core/story/record';
import { recordBattleTurn } from '../../src/core/story/hooks';
import { content, toBattle } from './helpers';

const dmg = (path: string, hit: Parameters<typeof growthDamageMultiplier>[6], hpFrac = 0.5, type = 'normal') => growthDamageMultiplier(CFG, { growthPath: path }, type, 1, hpFrac, ['normal'], hit);

describe('batch 7 counters', () => {
  it('a KO tells every situation it was in', () => {
    const base = { by: ['normal'], foe: ['normal'], rival: false, trainerClass: null, solo: false };
    expect(koCounters({ ...base, foeLow: true, chain: true, behind: true, duel: true, healthy: true, scarf: true, grudge: true }).sort())
      .toEqual(['koBehind', 'koChain', 'koDuel', 'koGrudge', 'koHealthy', 'koLow', 'koScarf']);
    expect(koCounters(base)).toEqual([]);
  });
  it('move kinds', () => {
    expect(moveRoleCounters({ id: 'string-shot', category: 'status', type: 'bug', statChanges: [{ stat: 'spe', stages: -2, target: 'enemy' }] })).toContain('dropSpe');
    expect(moveRoleCounters({ id: 'x', category: 'status', type: 'bug', statChanges: [{ stat: 'atk', stages: -1, target: 'enemy' }] })).not.toContain('dropSpe');
    expect(moveRoleCounters({ id: 'curse', category: 'status', type: 'ghost' })).toContain('hauntMove');
    expect(moveRoleCounters({ id: 'shadow-ball', category: 'special', type: 'ghost' })).not.toContain('hauntMove');
    expect(moveRoleCounters({ id: 'fake-out', category: 'physical', type: 'normal' })).toContain('useTrick');
  });
  it('a path needs the single top count (and its type)', () => {
    const h = (n: number) => ({ uid: 'a', knockoutsDealt: 0, closeCalls: 0, growth: { koLow: n, koGrudge: n } });
    const other = { uid: 'b', knockoutsDealt: 0, closeCalls: 0, growth: { koLow: 1 } };
    expect(['hunter', 'grudge-keeper']).toContain(pathFor(CFG, h(4), ['normal'], [h(4), other]));
    expect(pathFor(CFG, h(3), ['normal'], [h(3), other])).toBeNull();
    const bug = { uid: 'a', knockoutsDealt: 0, closeCalls: 0, growth: { dropSpe: 4 } };
    expect(pathFor(CFG, bug, ['bug'], [bug])).toBe('silk-spinner');
    expect(pathFor(CFG, bug, ['fire'], [bug])).toBeNull();
  });
  it('every new path is a known pack path', () => {
    for (const id of ['hunter', 'sweeper', 'comeback', 'duelist', 'glass-cannon', 'speedster', 'scarfer', 'legend-hunter', 'rival-mirror', 'grudge-keeper', 'silk-spinner', 'haunt-keeper', 'trickster']) expect(COUNTER_PATHS[id], id).toBeDefined();
  });
});

describe('batch 7 effects', () => {
  it('damage edges apply only in their case', () => {
    expect(dmg('hunter', { foeHpFrac: 0.4 })).toBeCloseTo(1.05);
    expect(dmg('hunter', { foeHpFrac: 0.6 })).toBe(1);
    expect(dmg('sweeper', { chain: true })).toBeCloseTo(1.05);
    expect(dmg('sweeper', {})).toBe(1);
    expect(dmg('comeback', { behind: true })).toBeCloseTo(1.05);
    expect(dmg('comeback', { behind: false })).toBe(1);
    expect(dmg('duelist', { duel: true })).toBeCloseTo(1.05);
    expect(dmg('glass-cannon', {}, 1)).toBeCloseTo(1.05);
    expect(dmg('glass-cannon', {}, 0.9)).toBe(1);
    expect(dmg('legend-hunter', { legend: true })).toBeCloseTo(1.05);
    expect(dmg('legend-hunter', { legend: false })).toBe(1);
    expect(dmg('rival-mirror', { mirror: true })).toBeCloseTo(1.03);
    expect(dmg('grudge-keeper', { grudge: true })).toBeCloseTo(1.05);
    expect(dmg('grudge-keeper', {})).toBe(1);
  });
  it('the speed, accuracy and defense paths do not touch damage', () => {
    for (const id of ['speedster', 'scarfer', 'silk-spinner', 'haunt-keeper', 'trickster']) expect(dmg(id, { foeHpFrac: 0.1, behind: true, chain: true, duel: true }, 1), id).toBe(1);
  });
  it('Glass Cannon gives up 3% Defense', () => {
    expect(growthDefenseMultiplier(CFG, { growthPath: 'glass-cannon' }, 1)).toBeCloseTo(0.97);
    expect(growthDefenseMultiplier(CFG, { growthPath: 'striker' }, 1)).toBe(1);
  });
  it('Speedster and Scarfer are faster after a KO', () => {
    const f = (koed: boolean) => ({ firstOfDay: false, weather: null, tailwind: false, koed });
    for (const id of ['speedster', 'scarfer']) {
      expect(growthSpeedMultiplier(CFG, { growthPath: id }, f(true))).toBeCloseTo(1.03);
      expect(growthSpeedMultiplier(CFG, { growthPath: id }, f(false))).toBe(1);
    }
  });
  it('accuracy paths', () => {
    const acc = (path: string, category: string, type: string, extra: { moveId?: string; lowersSpe?: boolean }) => growthAccuracyMultiplier(CFG, { growthPath: path }, 90, category, null, type, false, extra);
    expect(acc('silk-spinner', 'status', 'bug', { lowersSpe: true })).toBeCloseTo(1.05);
    expect(acc('silk-spinner', 'status', 'bug', {})).toBe(1);
    expect(acc('haunt-keeper', 'status', 'ghost', {})).toBeCloseTo(1.05);
    expect(acc('haunt-keeper', 'physical', 'ghost', {})).toBe(1);
    expect(acc('trickster', 'status', 'dark', { moveId: 'taunt' })).toBeCloseTo(1.05);
    expect(acc('trickster', 'status', 'dark', { moveId: 'growl' })).toBe(1);
  });
});

describe('batch 7 in the story hooks', () => {
  it('a KO on a weak foe, in a duel, with a Choice item credits the winner', () => {
    const run = structuredClone(toBattle(chooseStarter(content, createRun(content, { runId: 'b7', seed: 'b7', archetypeId: 'red' }), 0)));
    const me = run.party[0]!;
    me.held = { 'choice-scarf': 1 };
    me.hp = maxHp(content, me);
    for (const m of run.party.slice(1)) m.hp = 0;
    openHistory(content, run, me.uid, me.speciesId, 'starter');
    const foe = run.battle!.enemyTeam[0]!;
    const before = structuredClone(run);
    foe.hp = 0;
    run.battle!.grudgeMons = [me.uid];
    const max = maxHp(content, foe);
    recordBattleTurn(content, before, run, [
      { type: 'move', side: 'player', moveId: 'tackle' } as never,
      { type: 'damage', side: 'enemy', amount: max, hpAfter: 0, uid: foe.uid, effectiveness: 1, crit: false } as never,
      { type: 'faint', side: 'enemy', uid: foe.uid } as never,
    ]);
    const g = run.story.histories[me.uid]!.growth!;
    expect(g.koLow, 'a KO from full HP is not a low-HP KO').toBeUndefined();
    expect(g.koDuel).toBe(1);
    expect(g.koScarf).toBe(1);
    expect(g.koGrudge).toBe(1);
    expect(g.koHealthy).toBe(1);
    expect(g.movedFirst).toBe(1);
    expect(run.battle!.growthMarks).toContain(`ko:${me.uid}`);
  });
});

describe('batch 7 in the battle engine', () => {
  const hit = (path: string | undefined, foeHp: number, mutate?: (b: ReturnType<typeof createBattle>) => void) => {
    const player = createPokemon(content, 'machamp', 100, 'p');
    player.moves = [{ id: 'tackle', pp: 35 }];
    if (path) player.growthPath = path;
    const enemy = createPokemon(content, 'snorlax', 100, 'e');
    enemy.hp = Math.min(enemy.hp, foeHp);
    const battle = createBattle('wild', [enemy], 0, player.uid);
    mutate?.(battle);
    const ctx: BattleContext = { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed('b7e')), captureRng: new Rng(hashSeed('b7c')), catchMultiplier: 1 };
    const events = resolveTurn(ctx, { kind: 'move', index: 0 });
    return events.filter((e) => e.type === 'damage' && e.side === 'enemy').reduce((n, e) => n + (e as { amount: number }).amount, 0);
  };
  it('Hunter hits harder only below half HP', () => {
    const full = createPokemon(content, 'snorlax', 100, 'e').hp;
    expect(hit('hunter', Math.floor(full * 0.4))).toBeGreaterThan(hit(undefined, Math.floor(full * 0.4)));
    expect(hit('hunter', full)).toBe(hit(undefined, full));
  });
  it('Sweeper and Grudge Keeper read the battle marks', () => {
    const none = hit(undefined, 9999);
    expect(hit('sweeper', 9999)).toBe(none);
    expect(hit('sweeper', 9999, (b) => { b.growthMarks = ['ko:p']; })).toBeGreaterThan(none);
    expect(hit('grudge-keeper', 9999, (b) => { b.grudgeMons = ['p']; })).toBeGreaterThan(none);
  });
});
