import { describe, expect, it } from 'vitest';
import { buildContent } from '../../src/data';
import { overhaulCatalogs } from '../../src/core/overhaul/catalogs';
import { VolatileSchema } from '../../src/core/state';
import { addGrowth, growthDefenseMultiplier, growthEvasionMultiplier, growthHealMultiplier, turnCounters, turnFacts, waitedTurn, bumpGrowth, growthAccuracyMultiplier, hitCounters, moveCounters, COUNTER_PATHS, koCounters, noteGrowthKo, assignGrowthPaths, DEFAULT_GROWTH_CONFIG as CFG, growthDamageMultiplier, growthLine, pathFor, growthSpeedMultiplier, typePathId, noteMapGrowth } from '../../src/core/overhaul/growth';
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

describe('growth paths batch 4: time of day and weather', () => {
  const m = (p?: string) => ({ growthPath: p });
  const speed = (p: string, f: Partial<{ firstOfDay: boolean; weather: string | null; tailwind: boolean }>) => growthSpeedMultiplier(CFG, m(p), { firstOfDay: false, weather: null, tailwind: false, ...f });
  it('all seven paths are real pack paths with a counter', () => {
    const ids = new Set(overhaulCatalogs().growth_paths.entries.map((p) => p.id));
    for (const id of ['night-owl-path', 'sunbather', 'moonlit', 'weather-wise', 'storm-chaser', 'dawn-runner', 'windrunner']) { expect(ids.has(id)).toBe(true); expect(COUNTER_PATHS[id]).toBeDefined(); }
  });
  it('counts Fairy moves only at night', () => {
    const f = { accuracy: 90, category: 'special', type: 'Fairy', flags: [], hpFrac: 1 };
    expect(moveCounters({ ...f, night: true })).toContain('useFairyNight');
    expect(moveCounters({ ...f, night: false })).not.toContain('useFairyNight');
    expect(moveCounters({ ...f, type: 'Fire', night: true })).not.toContain('useFairyNight');
  });
  it('Night Owl and Sunbather boost by period; Moonlit only Fairy at night', () => {
    expect(growthDamageMultiplier(CFG, m('night-owl-path'), 'fire', 1, 1, [], { period: 'night' })).toBeCloseTo(1.05);
    expect(growthDamageMultiplier(CFG, m('night-owl-path'), 'fire', 1, 1, [], { period: 'morning' })).toBe(1);
    expect(growthDamageMultiplier(CFG, m('sunbather'), 'fire', 1, 1, [], { period: 'afternoon' })).toBeCloseTo(1.05);
    expect(growthDamageMultiplier(CFG, m('sunbather'), 'fire', 1, 1, [], { period: 'evening' })).toBe(1);
    expect(growthDamageMultiplier(CFG, m('moonlit'), 'fairy', 1, 1, ['fairy'], { period: 'night' })).toBeCloseTo(1.05);
    expect(growthDamageMultiplier(CFG, m('moonlit'), 'fire', 1, 1, ['fairy'], { period: 'night' })).toBe(1);
    expect(growthDamageMultiplier(CFG, m('moonlit'), 'fairy', 1, 1, ['fairy'], { period: 'day' })).toBe(1);
  });
  it('Speed paths apply only in their case; Weather-Wise needs weather', () => {
    expect(speed('dawn-runner', { firstOfDay: true })).toBeCloseTo(1.03);
    expect(speed('dawn-runner', {})).toBe(1);
    expect(speed('storm-chaser', { weather: 'rain' })).toBeCloseTo(1.03);
    expect(speed('storm-chaser', { weather: 'sun' })).toBe(1);
    expect(speed('windrunner', { tailwind: true })).toBeCloseTo(1.03);
    expect(speed('windrunner', {})).toBe(1);
    expect(growthAccuracyMultiplier(CFG, m('weather-wise'), 90, 'physical', 'snow')).toBeCloseTo(1.03);
    expect(growthAccuracyMultiplier(CFG, m('weather-wise'), 90, 'physical', null)).toBe(1);
  });
  it('earns by counters, with type gates and a party-top rule', () => {
    const w = (uid: string, g: Record<string, number>) => ({ ...h(uid, 0), growth: g });
    expect(pathFor(CFG, w('a', { winNight: 3 }), ['water'], [w('a', { winNight: 3 })])).toBe('night-owl-path');
    expect(pathFor(CFG, w('a', { winNight: 2 }), ['water'], [w('a', { winNight: 2 })])).toBeNull();
    expect(pathFor(CFG, w('a', { useFairyNight: 6 }), ['fire'], [w('a', { useFairyNight: 6 })])).toBeNull();
    expect(pathFor(CFG, w('a', { useFairyNight: 6 }), ['fairy'], [w('a', { useFairyNight: 6 })])).toBe('moonlit');
    expect(pathFor(CFG, w('a', { turnTailwind: 5 }), ['flying'], [w('a', { turnTailwind: 5 })])).toBe('windrunner');
  });
  it('the info line states the 3% caps', () => {
    expect(growthLine({ growthPath: 'dawn-runner' }, CFG)).toContain('+3% Speed in the first battle of a day');
    expect(growthLine({ growthPath: 'night-owl-path' }, CFG)).toContain('+5% damage in night battles');
  });
});

describe('growth paths batch 5: turn counters', () => {
  const g = (counter: string, n: number) => ({ uid: 'a', knockoutsDealt: 0, closeCalls: 0, growth: { [counter]: n } });
  const opt = { turn: 3, lead: true, boss: false, maxHp: 100, hpAfter: 80 };
  const ev = (...e: Array<[string, string, number?]>) => e.map(([type, side, amount]) => ({ type, side, amount }));

  it('reads one turn: hits, misses, waiting', () => {
    const f = turnFacts(ev(['move', 'player'], ['damage', 'enemy', 10], ['move', 'enemy'], ['damage', 'player', 30], ['miss', 'enemy']));
    expect(f).toMatchObject({ hitFoe: true, tookHit: true, foeMisses: 1, absorbed: 30 });
    expect(waitedTurn(f)).toBe(false);
    expect(waitedTurn(turnFacts(ev(['move', 'player'], ['stat', 'player'])))).toBe(true);
    expect(waitedTurn(turnFacts(ev(['move', 'player'], ['miss', 'player'])))).toBe(false);
    expect(waitedTurn(turnFacts(ev(['switchOut', 'player'], ['move', 'player'])))).toBe(false);
  });

  it('counts turns for the active Pokémon, none when it switched out', () => {
    const f = turnFacts(ev(['move', 'player'], ['damage', 'enemy', 5], ['damage', 'player', 40], ['miss', 'enemy']));
    const c = Object.fromEntries(turnCounters(f, { ...opt, turn: 1, boss: true }));
    expect(c).toMatchObject({ leadBattle: 1, healthyTurn: 1, absorbed: 40, tradeTurn: 1, bossTurn: 1, forcedMiss: 1 });
    expect(c.quietTurn).toBeUndefined();
    expect(turnCounters(turnFacts(ev(['switchOut', 'player'])), opt)).toEqual([]);
    // A faint earns no healthy, boss or absorbed credit.
    const d = Object.fromEntries(turnCounters(f, { ...opt, hpAfter: 0 }));
    expect(d.healthyTurn ?? d.absorbed ?? d.bossTurn).toBeUndefined();
  });

  it('adds counters only when switched on', () => {
    const hist: { growth?: Record<string, number> } = {};
    addGrowth({ ...CFG, enabled: false }, hist, [['quietTurn', 1]]);
    expect(hist.growth).toBeUndefined();
    addGrowth(CFG, hist, [['quietTurn', 1], ['quietTurn', 2]]);
    expect(hist.growth).toEqual({ quietTurn: 3 });
  });

  it('each new path needs its threshold and the party top; Steady Hand needs a Normal type', () => {
    for (const [id, counter, min] of [['lead-out', 'leadBattle', 5], ['opener', 'koFirst', 4], ['quiet-strength', 'quietTurn', 20], ['patient', 'waitTurn', 12], ['wall', 'absorbed', 300], ['bruiser', 'tradeTurn', 15], ['anchor', 'bossTurn', 20], ['dodger', 'forcedMiss', 10]] as const) {
      expect(COUNTER_PATHS[id]?.counter).toBe(counter);
      expect(overhaulCatalogs().growth_paths.entries.some((p) => p.id === id)).toBe(true);
      expect(pathFor(CFG, g(counter, min - 1), ['fire'], [g(counter, min - 1)])).toBeNull();
      expect(pathFor(CFG, g(counter, min), ['fire'], [g(counter, min)])).toBe(id);
    }
    expect(pathFor(CFG, g('healthyTurn', 40), ['fire'], [g('healthyTurn', 40)])).toBeNull();
    expect(pathFor(CFG, g('healthyTurn', 40), ['normal'], [g('healthyTurn', 40)])).toBe('steady-hand');
  });

  it('boosts in each path\'s own case', () => {
    const mult = (id: string, hpFrac: number, hit = {}) => growthDamageMultiplier(CFG, { growthPath: id }, 'normal', 1, hpFrac, ['normal'], hit);
    expect(mult('lead-out', 1, { turn: 2 })).toBeCloseTo(1.05);
    expect(mult('lead-out', 1, { turn: 3 })).toBe(1);
    expect(mult('opener', 1, { turnsOut: 0 })).toBeCloseTo(1.05);
    expect(mult('opener', 1, { turnsOut: 1 })).toBe(1);
    expect(mult('patient', 1, { waited: true })).toBeCloseTo(1.05);
    expect(mult('patient', 1, {})).toBe(1);
    expect(mult('quiet-strength', 1, { unhit: true })).toBeCloseTo(1.03);
    expect(mult('quiet-strength', 1, { unhit: false })).toBe(1);
    expect(mult('bruiser', 1)).toBeCloseTo(1.03);
    expect(mult('bruiser', 0.9)).toBe(1);
    const w = { growthPath: 'wall' }, b = { growthPath: 'bruiser' };
    expect(growthDefenseMultiplier(CFG, w, 0.6)).toBeCloseTo(1.05);
    expect(growthDefenseMultiplier(CFG, w, 0.5)).toBe(1);
    expect(growthDefenseMultiplier(CFG, b, 1)).toBeCloseTo(1.03);
    expect(growthDefenseMultiplier(CFG, b, 0.99)).toBe(1);
    expect(growthEvasionMultiplier(CFG, { growthPath: 'dodger' }, 0.8)).toBeCloseTo(1.03);
    expect(growthEvasionMultiplier(CFG, { growthPath: 'dodger' }, 0.75)).toBe(1);
    expect(growthHealMultiplier(CFG, { growthPath: 'anchor' })).toBeCloseTo(1.05);
    expect(growthHealMultiplier(CFG, { growthPath: 'wall' })).toBe(1);
    expect(growthAccuracyMultiplier(CFG, { growthPath: 'steady-hand' }, 90, 'physical', null, 'Normal')).toBeCloseTo(1.03);
    expect(growthAccuracyMultiplier(CFG, { growthPath: 'steady-hand' }, 90, 'physical', null, 'fire')).toBe(1);
    expect(growthLine({ growthPath: 'wall' }, CFG)).toContain('+5% Defense while above 50% HP');
  });

  it('an old save without the new battle flags still loads, as false', () => {
    const old = VolatileSchema.parse({ confusion: 0 });
    expect(old.waited).toBe(false);
    expect(old.unhit).toBe(false);
  });
});
