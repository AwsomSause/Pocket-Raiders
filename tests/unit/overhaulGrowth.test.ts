import { describe, expect, it } from 'vitest';
import { buildContent } from '../../src/data';
import { overhaulCatalogs } from '../../src/core/overhaul/catalogs';
import { bumpGrowth, growthAccuracyMultiplier, hitCounters, moveCounters, COUNTER_PATHS, koCounters, noteGrowthKo, assignGrowthPaths, DEFAULT_GROWTH_CONFIG as CFG, growthDamageMultiplier, growthLine, pathFor, typePathId, noteMapGrowth } from '../../src/core/overhaul/growth';
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

  it('counts moves used and hits landed', () => {
    const mv = { accuracy: 100, category: 'physical', type: 'normal', flags: [] as string[], hpFrac: 1 };
    expect(moveCounters(mv)).toEqual(['useSure']);
    expect(moveCounters({ ...mv, accuracy: 70, flags: ['sound'] })).toEqual(['useRisky', 'useSound']);
    expect(moveCounters({ ...mv, category: 'status', accuracy: null })).toEqual(['useStatus']);
    expect(moveCounters({ ...mv, type: 'Fire', hpFrac: 0.4 })).toContain('useFireLow');
    expect(moveCounters({ ...mv, type: 'fire', hpFrac: 0.6 })).not.toContain('useFireLow');
    expect(hitCounters(100, 100, false)).toEqual(['hitHigh']);
    expect(hitCounters(100, 100, true)).toEqual(['hitHigh', 'koFull']);
    expect(hitCounters(70, 100, true)).toEqual([]);
    expect(hitCounters(76, 100, false)).toEqual(['hitHigh']);
  });

  it('bumps counters only when switched on', () => {
    const h: { growth?: Record<string, number> } = {};
    bumpGrowth({ ...CFG, enabled: false }, h, ['useSure']);
    expect(h.growth).toBeUndefined();
    bumpGrowth(CFG, h, ['useSure', 'useSure']);
    expect(h.growth).toEqual({ useSure: 2 });
  });

  it('batch 3 paths need their own thresholds and boost in their own cases', () => {
    const mk = (uid: string, n: number) => ({ uid, knockoutsDealt: 0, closeCalls: 0, growth: { useSure: n } });
    expect(pathFor(CFG, mk('a', 29), ['normal'], [mk('a', 29)])).toBeNull();
    expect(pathFor(CFG, mk('a', 30), ['normal'], [mk('a', 30)])).toBe('steady');
    const m = (p: string) => ({ growthPath: p });
    expect(growthDamageMultiplier(CFG, m('steady'), 'normal', 1, 1, [], { accuracy: 100 })).toBeCloseTo(1.03);
    expect(growthDamageMultiplier(CFG, m('steady'), 'normal', 1, 1, [], { accuracy: 90 })).toBe(1);
    expect(growthDamageMultiplier(CFG, m('chorus-lead'), 'normal', 1, 1, [], { sound: true })).toBeCloseTo(1.03);
    expect(growthDamageMultiplier(CFG, m('tank-buster'), 'normal', 1, 1, [], { foeHpFrac: 0.8 })).toBeCloseTo(1.05);
    expect(growthDamageMultiplier(CFG, m('tank-buster'), 'normal', 1, 1, [], { foeHpFrac: 0.75 })).toBe(1);
    expect(growthDamageMultiplier(CFG, m('bond-breaker'), 'normal', 1, 1, [], { foeHpFrac: 1 })).toBeCloseTo(1.05);
    expect(growthDamageMultiplier(CFG, m('bond-breaker'), 'normal', 1, 1, [], { foeHpFrac: 0.99 })).toBe(1);
    expect(growthDamageMultiplier(CFG, m('ember-heart'), 'fire', 1, 0.4, [])).toBeCloseTo(1.05);
    expect(growthDamageMultiplier(CFG, m('ember-heart'), 'fire', 1, 0.6, [])).toBe(1);
    expect(growthDamageMultiplier(CFG, m('gambler'), 'normal', 1, 1, [], { accuracy: 70 })).toBe(1);
    expect(growthAccuracyMultiplier(CFG, m('gambler'), 70, 'physical')).toBeCloseTo(1.05);
    expect(growthAccuracyMultiplier(CFG, m('gambler'), 80, 'physical')).toBe(1);
    expect(growthAccuracyMultiplier(CFG, m('support'), null, 'status')).toBe(1);
    expect(growthAccuracyMultiplier(CFG, m('support'), 90, 'status')).toBeCloseTo(1.05);
    expect(growthAccuracyMultiplier(CFG, m('support'), 90, 'physical')).toBe(1);
    expect(growthAccuracyMultiplier(CFG, {}, 50, 'status')).toBe(1);
    expect(growthLine(m('steady'), CFG)).toMatch(/\+3% damage with 100%-accuracy moves/);
  });
});

describe('growth paths: run-map counters and run-stat paths', () => {
  const hist = (uid: string, extra: Record<string, unknown> = {}) => ({ uid, knockoutsDealt: 0, closeCalls: 0, battles: 0, evolutions: [], ...extra }) as never;
  it('counts map events on the right Pokémon and only when switched on', () => {
    const run = { story: { histories: { a: hist('a') } } } as never;
    noteMapGrowth(content, run, 'a', 'shopVisit');
    noteMapGrowth(content, run, 'a', 'shopVisit');
    noteMapGrowth(content, run, 'zzz', 'shopVisit');
    noteMapGrowth(content, run, undefined, 'shopVisit');
    expect((run as never as { story: { histories: Record<string, { growth: Record<string, number> }> } }).story.histories.a!.growth.shopVisit).toBe(2);
    const off = { ...content, balance: { ...content.balance, overhaulGrowth: { ...CFG, enabled: false } } };
    noteMapGrowth(off, run, 'a', 'eggHatch');
    expect((run as never as { story: { histories: Record<string, { growth: Record<string, number> }> } }).story.histories.a!.growth.eggHatch).toBeUndefined();
  });
  it('earns map paths from enough of the counter, most in the party', () => {
    const lead = hist('a', { growth: { nodeClean: 10, berryFeed: 5 } });
    const other = hist('b', { growth: { nodeClean: 4 } });
    expect(pathFor(CFG, lead, ['water'], [lead, other])).toBe('pathfinder');
    expect(pathFor(CFG, hist('c', { growth: { nodeClean: 9 } }), ['water'], [lead])).toBeNull();
    expect(pathFor(CFG, hist('d', { growth: { berryFeed: 5 } }), ['water'], [hist('d', { growth: { berryFeed: 5 } })])).toBe('caretaker');
    expect(pathFor(CFG, hist('e', { growth: { eggHatch: 2 } }), [], [hist('e', { growth: { eggHatch: 2 } })])).toBe('egg-warm');
    expect(pathFor(CFG, hist('f', { growth: { fieldItem: 5 } }), [], [hist('f', { growth: { fieldItem: 5 } })])).toBe('treasure-nose');
    expect(pathFor(CFG, hist('g', { growth: { tmLearned: 3 } }), [], [hist('g', { growth: { tmLearned: 3 } })])).toBe('move-collector');
  });
  it('earns run-stat paths: shiny, elder, late bloomer, trainer pet, prodigy', () => {
    const a = hist('a', { battles: 12 });
    expect(pathFor(CFG, a, [], [a], true)).toBe('shiny-glint');
    expect(pathFor(CFG, a, [], [a], false)).toBeNull();
    const old = hist('o', { battles: 25 });
    expect(pathFor(CFG, old, [], [old, hist('y', { battles: 5 })])).toBe('elder');
    expect(pathFor(CFG, old, [], [old, hist('y', { battles: 25 })])).toBeNull();
    const evo = hist('e', { evolutions: [1, 2] });
    expect(pathFor(CFG, evo, [], [evo, hist('n')])).toBe('late-bloomer');
    const pet = hist('p', { bond: { trust: 120, affection: 90 } });
    expect(pathFor(CFG, pet, [], [pet, hist('q', { bond: { trust: 60, affection: 40 } })])).toBe('trainer-pet');
    const fast = hist('f', { growth: { lv30: 10 } });
    expect(pathFor(CFG, fast, [], [fast, hist('s', { growth: { lv30: 14 } }), hist('t')])).toBe('prodigy');
    expect(pathFor(CFG, hist('s', { growth: { lv30: 14 } }), [], [fast, hist('s', { growth: { lv30: 14 } })])).toBeNull();
  });
  it('gives the flat edge and a plain-words line', () => {
    for (const id of ['pathfinder', 'frontline-pet', 'egg-warm', 'caretaker', 'treasure-nose', 'move-collector', 'shiny-glint', 'elder', 'late-bloomer', 'trainer-pet', 'prodigy']) {
      const m = mon('x', 'pikachu', id);
      expect(growthDamageMultiplier(CFG, m, 'normal', 1, 1, ['electric'])).toBeCloseTo(1.05);
      expect(growthLine(m, CFG)).toContain('+5%');
    }
  });
});
