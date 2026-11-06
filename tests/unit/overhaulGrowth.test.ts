import { describe, expect, it } from 'vitest';
import { buildContent } from '../../src/data';
import { overhaulCatalogs } from '../../src/core/overhaul/catalogs';
import { COUNTER_PATHS, koCounters, noteGrowthKo, assignGrowthPaths, DEFAULT_GROWTH_CONFIG as CFG, growthDamageMultiplier, growthLine, pathFor, typePathId } from '../../src/core/overhaul/growth';
import type { PokemonInstance } from '../../src/core/state';

const content = buildContent();
const h = (uid: string, kos: number, closeCalls = 0) => ({ uid, knockoutsDealt: kos, closeCalls });
const mon = (uid: string, speciesId: string, growthPath?: string) => ({ uid, speciesId, growthPath }) as unknown as PokemonInstance;

describe('growth paths (first cut)', () => {
  it('uses real pack paths for every type and the two named ones', () => {
    const ids = new Set(overhaulCatalogs().growth_paths.entries.map((p) => p.id));
    expect(ids.has('striker') && ids.has('last-stand')).toBe(true);
    for (const t of ['fire', 'water', 'grass', 'electric', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy', 'normal']) expect(ids.has(typePathId(t)!)).toBe(true);
  });

  it('earns: close calls, then the single top KO count, then a type path', () => {
    const party = [h('a', 9), h('b', 3), h('c', 1, 2)];
    expect(pathFor(CFG, h('c', 1, 2), ['water'], party)).toBe('last-stand');
    expect(pathFor(CFG, h('a', 9), ['fire'], party)).toBe('striker');
    expect(pathFor(CFG, h('b', 3), ['fire'], party)).toBeNull();
    const tie = [h('a', 9), h('b', 9)];
    expect(pathFor(CFG, h('a', 9), ['fire'], tie)).toBe(typePathId('fire'));
  });

  it('assigns once and never replaces a path', () => {
    const party = [mon('a', 'charmander'), mon('b', 'squirtle', 'striker')];
    const hist = { a: h('a', 9), b: h('b', 12, 3) };
    const lines = assignGrowthPaths(content, party, hist);
    expect(lines).toHaveLength(1);
    expect(party[0]!.growthPath).toBe(typePathId('fire'));
    expect(party[1]!.growthPath).toBe('striker');
    expect(assignGrowthPaths(content, party, hist)).toEqual([]);
  });

  it('does nothing when switched off or without history', () => {
    const off = { ...content, balance: { ...content.balance, overhaulGrowth: { ...CFG, enabled: false } } };
    const party = [mon('a', 'charmander')];
    expect(assignGrowthPaths(off, party, { a: h('a', 50) })).toEqual([]);
    expect(assignGrowthPaths(content, party, {})).toEqual([]);
    expect(party[0]!.growthPath).toBeUndefined();
  });

  it('boosts only in its own conditions, by the configured amount', () => {
    const m = (p?: string) => ({ growthPath: p });
    expect(growthDamageMultiplier(CFG, m('last-stand'), 'fire', 1, 0.2, ['fire'])).toBeCloseTo(1.05);
    expect(growthDamageMultiplier(CFG, m('last-stand'), 'fire', 1, 0.5, ['fire'])).toBe(1);
    expect(growthDamageMultiplier(CFG, m('striker'), 'fire', 2, 1, ['fire'])).toBeCloseTo(1.05);
    expect(growthDamageMultiplier(CFG, m('striker'), 'fire', 1, 1, ['fire'])).toBe(1);
    expect(growthDamageMultiplier(CFG, m(typePathId('fire')!), 'fire', 1, 1, ['fire'])).toBeCloseTo(1.05);
    expect(growthDamageMultiplier(CFG, m(typePathId('fire')!), 'water', 1, 1, ['fire'])).toBe(1);
    expect(growthDamageMultiplier(CFG, m(undefined), 'fire', 2, 0.1, ['fire'])).toBe(1);
    expect(growthDamageMultiplier(CFG, m('not-a-path'), 'fire', 2, 0.1, ['fire'])).toBe(1);
  });

  it('describes a path in plain words', () => {
    expect(growthLine({ growthPath: 'striker' }, CFG)).toMatch(/Striker: \+5% on super-effective/);
    expect(growthLine({}, CFG)).toBeNull();
  });

  it('counts KOs by kind from the facts of one KO', () => {
    const base = { by: ['water'], foe: ['fire'], rival: false, trainerClass: null, solo: false };
    expect(koCounters(base)).toEqual(['koWaterVsFRG']);
    expect(koCounters({ ...base, by: ['steel'], foe: ['fairy'], trainerClass: 'gym-leader', rival: true, solo: true })).toEqual(['koRival', 'koGym', 'koSolo', 'koSteelVsIRF']);
    expect(koCounters({ ...base, trainerClass: 'elite-four' })).toContain('koElite');
    expect(koCounters({ ...base, trainerClass: 'champion' })).toContain('koChampion');
    expect(koCounters({ by: ['normal'], foe: ['normal'], rival: false, trainerClass: 'youngster', solo: false })).toEqual([]);
  });

  it('adds to the history only when switched on, and has a real pack path for each counter path', () => {
    const h: { growth?: Record<string, number> } = {};
    const facts = { by: ['normal'], foe: ['normal'], rival: true, trainerClass: null, solo: false };
    noteGrowthKo({ ...CFG, enabled: false }, h, facts);
    expect(h.growth).toBeUndefined();
    noteGrowthKo(CFG, h, facts); noteGrowthKo(CFG, h, facts);
    expect(h.growth).toEqual({ koRival: 2 });
    noteGrowthKo(CFG, undefined, facts);
    const ids = new Set(overhaulCatalogs().growth_paths.entries.map((p) => p.id));
    for (const id of Object.keys(COUNTER_PATHS)) expect(ids.has(id)).toBe(true);
  });

  it('a counter path needs enough KOs and the most in the party', () => {
    const mk = (uid: string, n: number) => ({ uid, knockoutsDealt: 0, closeCalls: 0, growth: { koGym: n } });
    const party = [mk('a', 5), mk('b', 3)];
    expect(pathFor(CFG, party[0]!, ['normal'], party)).toBe('gym-slayer');
    expect(pathFor(CFG, party[1]!, ['normal'], party)).toBeNull();
    expect(pathFor(CFG, mk('c', 3), ['normal'], [mk('c', 3)])).toBeNull();
    expect(pathFor(CFG, mk('a', 5), ['normal'], [mk('a', 5), mk('b', 5)])).toBeNull();
  });

  it('boosts counter paths only in their case', () => {
    const m = (p: string) => ({ growthPath: p });
    expect(growthDamageMultiplier(CFG, m('gym-slayer'), 'fire', 1, 1, [], { trainerClass: 'gym-leader' })).toBeCloseTo(1.05);
    expect(growthDamageMultiplier(CFG, m('gym-slayer'), 'fire', 1, 1, [], { trainerClass: 'champion' })).toBe(1);
    expect(growthDamageMultiplier(CFG, m('loner'), 'fire', 1, 1, [], { solo: true })).toBeCloseTo(1.05);
    expect(growthDamageMultiplier(CFG, m('loner'), 'fire', 1, 1, [], { solo: false })).toBe(1);
    expect(growthDamageMultiplier(CFG, m('deep-swimmer'), 'water', 1, 1, [], { foeTypes: ['Fire'] })).toBeCloseTo(1.05);
    expect(growthDamageMultiplier(CFG, m('deep-swimmer'), 'fire', 1, 1, [], { foeTypes: ['Fire'] })).toBe(1);
    expect(growthDamageMultiplier(CFG, m('rival-breaker'), 'fire', 1, 1, [], { rival: true })).toBeCloseTo(1.05);
    expect(growthLine(m('forge-born'), CFG)).toMatch(/Steel damage against Ice/);
  });
});
