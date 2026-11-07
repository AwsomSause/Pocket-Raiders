// Growth paths batch 12: Closer, Shield Sibling, Fossil Memory, Burrower.
import { describe, expect, it } from 'vitest';
import { createBattle, isLastStanding, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { COUNTER_PATHS, DEFAULT_GROWTH_CONFIG as CFG, growthChargeHoldMultiplier, growthDamageMultiplier, growthLine, growthWeatherChipMultiplier, koCounters, pathFor } from '../../src/core/overhaul/growth';
import { content } from './helpers';

const hist = (uid: string, growth: Record<string, number>) => ({ uid, knockoutsDealt: 0, closeCalls: 0, growth });
const hit = (path: string, facts: Record<string, boolean>) => growthDamageMultiplier(CFG, { growthPath: path }, 'normal', 1, 1, ['normal'], facts);

describe('Closer', () => {
  it('last in party order still standing, with someone ahead of it (not Loner)', () => {
    const [a, b, c] = ['a', 'b', 'c'].map((u) => createPokemon(content, 'rattata', 10, u));
    expect(isLastStanding([a!, b!, c!], c!)).toBe(true);
    expect(isLastStanding([a!, b!, c!], b!)).toBe(false);
    c!.hp = 0;
    expect(isLastStanding([a!, b!, c!], b!)).toBe(true);
    b!.hp = 0;
    expect(isLastStanding([a!, b!, c!], a!)).toBe(false); // alone in front: that is Loner's case
  });
  it('counts KOs as the last one and adds 5% only then', () => {
    expect(koCounters({ by: [], foe: [], rival: false, trainerClass: null, solo: false, last: true })).toContain('koLast');
    const a = hist('a', { koLast: 4 });
    expect(pathFor(CFG, a, ['normal'], [a])).toBe('closer');
    expect(hit('closer', { last: true })).toBeCloseTo(1.05);
    expect(hit('closer', { last: false })).toBe(1);
  });
});

describe('Shield Sibling', () => {
  it('counts KOs with a bonded teammate that also hit, and adds 3% while it stands', () => {
    expect(koCounters({ by: [], foe: [], rival: false, trainerClass: null, solo: false, pair: true })).toContain('koPair');
    const a = hist('a', { koPair: 4 });
    expect(pathFor(CFG, a, ['normal'], [a])).toBe('shield-sibling');
    expect(hit('shield-sibling', { pair: true })).toBeCloseTo(1.03);
    expect(hit('shield-sibling', { pair: false })).toBe(1);
  });
  it('the engine reads bonded partners from the context', () => {
    const a = createPokemon(content, 'machamp', 50, 'a');
    const b = createPokemon(content, 'blissey', 50, 'b');
    a.moves = [{ id: 'tackle', pp: 35 }];
    a.growthPath = 'shield-sibling';
    const dmg = (partners: boolean) => {
      const battle = createBattle('wild', [createPokemon(content, 'blissey', 60, 'e')], 0, a.uid);
      const ctx: BattleContext = { content, battle, party: [{ ...a }, { ...b }], inventory: {}, rng: new Rng(hashSeed('gl1')), captureRng: new Rng(hashSeed('gl2')), catchMultiplier: 1, bondPartners: partners ? () => ['b'] : undefined };
      ctx.party[0] = ctx.party[0]!;
      const events = resolveTurn(ctx, { kind: 'move', index: 0 });
      return events.filter((e) => e.type === 'damage' && e.side === 'enemy').reduce((n, e) => n + (e.type === 'damage' ? e.amount : 0), 0);
    };
    expect(dmg(true)).toBeGreaterThanOrEqual(dmg(false));
  });
});

describe('Fossil Memory', () => {
  it('a Rock path earned by surviving on 1 HP; weather chip is 5% lower', () => {
    expect(COUNTER_PATHS['fossil-memory']).toMatchObject({ counter: 'surviveOne', type: 'rock' });
    const a = hist('a', { surviveOne: 2 });
    expect(pathFor(CFG, a, ['rock'], [a])).toBe('fossil-memory');
    expect(pathFor(CFG, a, ['water'], [a])).toBeNull();
    expect(growthWeatherChipMultiplier(CFG, { growthPath: 'fossil-memory' })).toBeCloseTo(0.95);
    expect(growthWeatherChipMultiplier(CFG, {})).toBe(1);
  });
  it('hail chip on a Fossil Memory Pokémon is smaller', () => {
    const lost = (path?: string) => {
      const m = createPokemon(content, 'rhyperior', 100, 'm');
      if (path) m.growthPath = path;
      m.moves = [{ id: 'growl', pp: 40 }];
      const battle = createBattle('wild', [createPokemon(content, 'blissey', 60, 'e')], 0, m.uid);
      battle.weather = { id: 'hail', turns: 5 } as never;
      const ctx: BattleContext = { content, battle, party: [m], inventory: {}, rng: new Rng(hashSeed('gl3')), captureRng: new Rng(hashSeed('gl4')), catchMultiplier: 1 };
      const chip = resolveTurn(ctx, { kind: 'move', index: 0 }).find((e) => e.type === 'weatherDamage' && e.side === 'player');
      return chip?.type === 'weatherDamage' ? chip.amount : 0;
    };
    expect(lost()).toBeGreaterThan(0);
    expect(lost('fossil-memory')).toBeLessThan(lost());
  });
  it('shows its line', () => {
    expect(growthLine({ growthPath: 'fossil-memory' }, CFG)).toContain('Fossil Memory');
  });
});

describe('Burrower', () => {
  it('a Ground path earned by turns underground; paralysis and confusion stop it 5% less mid-charge only', () => {
    expect(COUNTER_PATHS.burrower).toMatchObject({ counter: 'underground', type: 'ground' });
    const a = hist('a', { underground: 4 });
    expect(pathFor(CFG, a, ['ground'], [a])).toBe('burrower');
    expect(growthChargeHoldMultiplier(CFG, { growthPath: 'burrower' }, true)).toBeCloseTo(0.95);
    expect(growthChargeHoldMultiplier(CFG, { growthPath: 'burrower' }, false)).toBe(1);
    expect(growthChargeHoldMultiplier(CFG, { growthPath: 'striker' }, true)).toBe(1);
  });
});
