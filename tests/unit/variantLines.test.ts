// Beta 0.6 slice E1: variant lines as battle hooks. Tagged, Dark Ball, Tidebound, Cinderborn and Preserved are wired
// into the engine; the pure rules are tested directly and the engine hooks through short battles.
import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { BattleStateSchema } from '../../src/core/state';
import { assignVariant, UNWIRED_LINES, variantNeverMisses, variantOnEntry, WIRED_LINES, type Variants } from '../../src/core/expansion/variantLines';
import { simLimit, simulateVariantLine } from '../../src/quality/variantSim';
import { content } from './helpers';

function duel(opts: { line?: string; kind?: 'wild' | 'trainer'; pMove?: string; weather?: 'rain' | 'sun'; second?: boolean } = {}) {
  const player = createPokemon(content, 'machop', 50, 'p');
  const enemy = createPokemon(content, 'snorlax', 50, 'e');
  const enemies = [enemy, ...(opts.second ? [createPokemon(content, 'rattata', 10, 'e2')] : [])];
  const move = (m: string) => ({ id: m, pp: content.moves.get(m)!.pp });
  player.moves = [move(opts.pMove ?? 'tackle')];
  for (const e of enemies) e.moves = [move('splash')];
  const battle = createBattle(opts.kind ?? 'wild', enemies, 0, player.uid);
  if (opts.weather) battle.weather = { id: opts.weather, turns: 5 };
  if (opts.line) assignVariant(battle.extra.variants, enemy.uid, opts.line);
  const ctx: BattleContext = { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed('variant')), captureRng: new Rng(hashSeed('variantc')), catchMultiplier: 1 };
  return { ctx, battle, player, enemy, go: () => resolveTurn(ctx, { kind: 'move', index: 0 }) };
}
type Events = ReturnType<ReturnType<typeof duel>['go']>;
const lost = (es: Events, side: 'player' | 'enemy') => es.reduce((n, e) => (e.type === 'damage' && e.side === side ? n + e.amount : n), 0);
const texts = (es: Events) => es.filter((e) => e.type === 'raid').map((e) => (e as { text: string }).text);

describe('variant line registry', () => {
  it('wires five lines, lists the other nine, and refuses to assign an unwired one', () => {
    expect(WIRED_LINES).toHaveLength(5);
    expect(WIRED_LINES.length + UNWIRED_LINES.length).toBe(14);
    expect(() => assignVariant({}, 'x', 'loud')).toThrow('not wired');
  });
  it('with no variants the battle is unchanged and the saved battle has an empty map', () => {
    const a = duel(), b = duel();
    expect(JSON.stringify(a.go())).toBe(JSON.stringify(b.go()));
    expect(a.battle.extra.variants).toEqual({});
  });
  it('variants survive a save and old battles without the field still load', () => {
    const d = duel({ line: 'tagged' });
    const back = BattleStateSchema.parse(JSON.parse(JSON.stringify(d.battle)));
    expect(back.extra.variants[d.enemy.uid]).toEqual({ line: 'tagged', flags: { tag: 1 } });
    const old = JSON.parse(JSON.stringify(duel().battle));
    delete old.extra.variants;
    expect(BattleStateSchema.parse(old).extra.variants).toEqual({});
  });
});

describe('Black-Label: Tagged in battle', () => {
  it('the first hit does 20% less, announced once; the second hit is full', () => {
    const base = duel(), tag = duel({ line: 'tagged' });
    const b1 = lost(base.go(), 'enemy');
    const t1Events = tag.go();
    const t1 = lost(t1Events, 'enemy');
    expect(texts(t1Events)).toContain('The tag holds it in place.');
    expect(t1).toBeLessThan(b1);
    expect(t1 / b1).toBeGreaterThan(0.7);
    expect(t1 / b1).toBeLessThan(0.9);
    const b2 = lost(base.go(), 'enemy');
    const t2Events = tag.go();
    expect(texts(t2Events)).not.toContain('The tag holds it in place.');
    expect(lost(t2Events, 'enemy')).toBe(b2);
  });
  it('cannot be forced out by Roar while tagged, can once the tag is gone', () => {
    const d = duel({ line: 'tagged', kind: 'trainer', second: true, pMove: 'roar' });
    const control = duel({ kind: 'trainer', second: true, pMove: 'roar' });
    control.go();
    expect(control.battle.enemyTeam[control.battle.enemyIndex]!.uid).not.toBe(control.enemy.uid);
    d.go();
    expect(d.battle.enemyTeam[d.battle.enemyIndex]!.uid).toBe(d.enemy.uid);
    d.battle.extra.variants[d.enemy.uid]!.flags.tag = 0;
    d.go();
    expect(d.battle.enemyTeam[d.battle.enemyIndex]!.uid).not.toBe(d.enemy.uid);
  });
  it('Knock Off tears the tag off', () => {
    const d = duel({ line: 'tagged', pMove: 'knock-off' });
    const es = d.go();
    expect(texts(es)).toContain('The tag is torn off!');
    expect(d.battle.extra.variants[d.enemy.uid]!.flags.tag).toBe(0);
  });
});

describe('Dark Ball in battle', () => {
  it('enters with +1 Attack and Special Attack and loses 1/16 HP each turn', () => {
    const d = duel({ line: 'dark-ball' });
    const hp = d.enemy.hp;
    const es = d.go();
    expect(d.battle.enemyStages.atk).toBe(1);
    expect(d.battle.enemyStages.spa).toBe(1);
    expect(texts(es)).toContain('The Ball burns.');
    expect(d.enemy.hp).toBeLessThan(hp);
  });
});

describe('Preserved in battle', () => {
  it('enters with -1 Speed, takes 25% less on the first hit, and cannot be given a status', () => {
    const base = duel(), pre = duel({ line: 'preserved' });
    const b1 = lost(base.go(), 'enemy');
    const p1Events = pre.go();
    expect(pre.battle.enemyStages.spe).toBe(-1);
    expect(lost(p1Events, 'enemy') / b1).toBeGreaterThan(0.65);
    expect(lost(p1Events, 'enemy') / b1).toBeLessThan(0.85);
    const thunder = duel({ line: 'preserved', pMove: 'thunder-wave' });
    thunder.go();
    expect(thunder.enemy.status).toBeNull();
    const control = duel({ pMove: 'thunder-wave' });
    control.go();
    expect(control.enemy.status?.id).toBe('par');
  });
});

describe('Tidebound and Cinderborn', () => {
  it('Tidebound: +1 Speed in rain, nothing in sun; Cinderborn: +1 Defense in sun', () => {
    const rain = duel({ line: 'tidebound', weather: 'rain' });
    rain.go();
    expect(rain.battle.enemyStages.spe).toBe(1);
    const sun = duel({ line: 'tidebound', weather: 'sun' });
    sun.go();
    expect(sun.battle.enemyStages.spe).toBe(0);
    const warm = duel({ line: 'cinderborn', weather: 'sun' });
    warm.go();
    expect(warm.battle.enemyStages.def).toBe(1);
  });
  it('their moves cannot miss under their own weather only', () => {
    const v: Variants = {};
    assignVariant(v, 'a', 'tidebound');
    assignVariant(v, 'b', 'cinderborn');
    expect(variantNeverMisses(v, 'a', 'rain', 'water')).toBe(true);
    expect(variantNeverMisses(v, 'a', 'sun', 'water')).toBe(false);
    expect(variantNeverMisses(v, 'a', 'rain', 'fire')).toBe(false);
    expect(variantNeverMisses(v, 'b', 'sun', 'ground')).toBe(true);
    expect(variantNeverMisses(v, 'b', 'rain', 'fire')).toBe(false);
    expect(variantOnEntry(v, 'a', 'sun').message).toBe('The tide is out.');
    expect(variantOnEntry(v, 'b', 'rain').message).toBe('The ground is cold.');
  });
});

describe('balance sim: neither side above 60%', () => {
  it('baseline with no line is balanced', () => {
    const r = simulateVariantLine(content, null, 600);
    expect(r.variantRate, JSON.stringify(r)).toBeGreaterThan(0.4);
    expect(r.variantRate, JSON.stringify(r)).toBeLessThan(0.6);
  }, 60000);
  for (const line of WIRED_LINES) {
    it(`${line}: 600 mirror battles`, () => {
      const r = simulateVariantLine(content, line, 600);
      expect(r.variantRate, JSON.stringify(r)).toBeLessThanOrEqual(simLimit(line));
      expect(r.plainRate, JSON.stringify(r)).toBeLessThanOrEqual(simLimit(line));
    }, 60000);
  }
});
