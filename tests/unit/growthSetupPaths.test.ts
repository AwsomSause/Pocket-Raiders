// Growth paths batch 6: status and setup-move paths (engine effects and the counters behind them).
import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { COUNTER_PATHS, DEFAULT_GROWTH_CONFIG as CFG, growthAccuracyMultiplier, growthDamageMultiplier, growthStatusChance, moveRoleCounters, pathFor } from '../../src/core/overhaul/growth';
import { content } from './helpers';

function duel(move: string, path: string | undefined, opts: { species?: string; hp?: number; seed?: string } = {}) {
  const player = createPokemon(content, opts.species ?? 'blissey', 50, 'p');
  player.moves = [{ id: move, pp: content.moves.get(move)!.pp }];
  if (path) player.growthPath = path;
  if (opts.hp) player.hp = opts.hp;
  const enemy = createPokemon(content, 'machop', 3, 'e');
  const battle = createBattle('wild', [enemy], 0, player.uid);
  const ctx: BattleContext = { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed(opts.seed ?? 'gsp')), captureRng: new Rng(hashSeed('gspc')), catchMultiplier: 1 };
  const events = resolveTurn(ctx, { kind: 'move', index: 0 });
  return { battle, player, enemy, events, ctx };
}
const turnsOf = (move: string, path: string | undefined, read: (b: ReturnType<typeof duel>['battle']) => number) => read(duel(move, path).battle);

describe('batch 6 effects', () => {
  it('Rain Dancer: its weather lasts one turn longer, others do not', () => {
    const base = turnsOf('rain-dance', undefined, (b) => b.weather?.turns ?? 0);
    expect(base).toBeGreaterThan(0);
    expect(turnsOf('rain-dance', 'rain-dancer', (b) => b.weather?.turns ?? 0)).toBe(base + 1);
    expect(turnsOf('rain-dance', 'striker', (b) => b.weather?.turns ?? 0)).toBe(base);
  });
  it('Terrain Master and Trick Roomer add a turn', () => {
    const t = turnsOf('electric-terrain', undefined, (b) => b.terrain?.turns ?? 0);
    expect(turnsOf('electric-terrain', 'terrain-master', (b) => b.terrain?.turns ?? 0)).toBe(t + 1);
    const r = turnsOf('trick-room', undefined, (b) => b.field.trickRoom);
    expect(turnsOf('trick-room', 'trick-roomer', (b) => b.field.trickRoom)).toBe(r + 1);
  });
  it('Screen Keeper adds a turn to Reflect', () => {
    const r = turnsOf('reflect', undefined, (b) => b.sideEffects.player.reflect);
    expect(turnsOf('reflect', 'screen-keeper', (b) => b.sideEffects.player.reflect)).toBe(r + 1);
  });
  it('Toxic Weaver: Toxic starts one step stronger', () => {
    const seed = ['a', 'b', 'c', 'd', 'e', 'f'].find((x) => duel('toxic', 'toxic-weaver', { seed: x }).enemy.status?.bad);
    expect(seed).toBeDefined();
    const plain = duel('toxic', undefined, { seed }).enemy.status?.turns ?? 0;
    expect(duel('toxic', 'toxic-weaver', { seed }).enemy.status?.turns).toBe(plain + 1);
  });
  it('Buffer heals 1/32 on a stat-raising move; Cleaner heals 1/16 on removal', () => {
    const hurt = (path?: string) => duel('swords-dance', path, { hp: 200 }).player.hp;
    expect(hurt('buffer')).toBeGreaterThan(hurt(undefined));
    const clean = (path?: string) => duel('rapid-spin', path, { hp: 200 }).events.filter((e) => e.type === 'heal').length;
    expect(clean('cleaner')).toBeGreaterThan(clean(undefined));
  });
  it('Disruptor raises accuracy of stat-lowering moves only; the other paths give no damage edge', () => {
    expect(growthAccuracyMultiplier(CFG, { growthPath: 'disruptor' }, 90, 'status', null, '', true)).toBeCloseTo(1.05);
    expect(growthAccuracyMultiplier(CFG, { growthPath: 'disruptor' }, 90, 'status', null, '', false)).toBe(1);
    for (const id of ['live-wire', 'rain-dancer', 'cleaner', 'buffer', 'tricky-feet']) expect(growthDamageMultiplier(CFG, { growthPath: id }, 'electric', 2, 1, ['electric'])).toBe(1);
  });
  it('status chance bonuses: +5 / +3 points, only for the right status', () => {
    expect(growthStatusChance(CFG, { growthPath: 'live-wire' }, 'par')).toBeCloseTo(5);
    expect(growthStatusChance(CFG, { growthPath: 'live-wire' }, 'brn')).toBe(0);
    expect(growthStatusChance(CFG, { growthPath: 'glacial-mind' }, 'frz')).toBeCloseTo(3);
    expect(growthStatusChance(CFG, { growthPath: 'dream-weaver' }, 'confusion')).toBeCloseTo(3);
    expect(growthStatusChance(CFG, { growthPath: 'dream-weaver' }, 'slp')).toBeCloseTo(3);
    expect(growthStatusChance(CFG, { growthPath: undefined }, 'par')).toBe(0);
    expect(growthStatusChance({ ...CFG, enabled: false }, { growthPath: 'live-wire' }, 'par')).toBe(0);
  });
});

describe('batch 6 counters', () => {
  it('reads real moves', () => {
    const c = (id: string) => { const m = content.moves.get(id)!; return moveRoleCounters({ id, category: m.category, ...m.effects }); };
    expect(c('rain-dance')).toContain('setWeather');
    expect(c('electric-terrain')).toContain('setTerrain');
    expect(c('trick-room')).toContain('useRoom');
    expect(c('reflect')).toContain('useScreen');
    expect(c('spikes')).toContain('setHazard');
    expect(c('toxic')).toContain('useToxic');
    expect(c('rapid-spin')).toContain('useClean');
    expect(c('growl')).toContain('dropFoe');
    expect(c('swords-dance')).toContain('raiseSelf');
    expect(c('tackle')).toEqual([]);
  });
  it('paths are earned with their counter, type gate and party top', () => {
    const w = (uid: string, g: Record<string, number>) => ({ uid, knockoutsDealt: 0, closeCalls: 0, growth: g });
    const a = w('a', { inflictPar: 3 });
    expect(pathFor(CFG, a, ['electric'], [a])).toBe('live-wire');
    expect(pathFor(CFG, a, ['water'], [a])).toBeNull();
    const s = w('s', { setWeather: 3 });
    expect(pathFor(CFG, s, ['water'], [s])).toBe('rain-dancer');
    expect(pathFor(CFG, s, ['water'], [s, w('t', { setWeather: 3 })])).toBeNull();
    for (const id of ['live-wire', 'glacial-mind', 'dream-weaver', 'toxic-weaver', 'rain-dancer', 'terrain-master', 'trick-roomer', 'screen-keeper', 'hazard-setter', 'cleaner', 'disruptor', 'buffer', 'tricky-feet']) expect(COUNTER_PATHS[id]).toBeDefined();
  });
});
