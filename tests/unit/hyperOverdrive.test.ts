// Overhaul slice 9: Hyper and Overdrive are different states, their conditions add up, and the first-time explanation
// tells the truth. Also profile v18 -> v19 (the read explanations are remembered).
import { describe, expect, it } from 'vitest';
import { createBattle } from '../../src/core/battle/engine';
import { chooseStarter, createRun } from '../../src/core/run';
import { Rng, hashSeed } from '../../src/core/rng';
import { createPokemon } from '../../src/core/pokemon';
import { activationFactor, explainMoment, explanationKeys, explanationText, familyOf, previousUses, turnsOnField, unseenKeys } from '../../src/core/story/hyperRules';
import { buildHyperContext } from '../../src/core/story/hyper';
import type { RunState } from '../../src/core/state';
import { GameSession } from '../../src/game/GameSession';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content, toBattle } from './helpers';

const defs = (family: 'hyper' | 'overdrive') => content.story.definitions.filter((d) => d.family === family);
const def = (id: string) => content.story.definitions.find((d) => d.id === id)!;

function inBattle(seed = 'hy'): RunState {
  const run = structuredClone(toBattle(chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red' }), 0)));
  run.battle = createBattle('wild', [createPokemon(content, 'machamp', 50, 'foe')], 0, run.party[0]!.uid);
  run.party[0]!.friendship = 255;
  return run;
}

describe('two separate identities', () => {
  it('Hyper holds the bond and survival moments, Overdrive the aggressive ones, and no moment is both', () => {
    expect(defs('hyper').map((d) => d.id).sort()).toEqual(['emotional-awakening', 'felt-a-bond', 'hung-in-there', 'protective-instinct', 'pushed-back-up', 'toughened-it-out']);
    expect(defs('overdrive').map((d) => d.id).sort()).toEqual(['defiance', 'heated-rivalry', 'pushed-beyond-limits']);
  });
  it('every Overdrive moment that hits harder or hits back carries a cost; Hyper moments that only protect carry none', () => {
    for (const d of defs('overdrive')) expect(explainMoment(content, d)!.risks.length, d.id).toBeGreaterThan(0);
    for (const id of ['toughened-it-out', 'felt-a-bond', 'pushed-back-up', 'protective-instinct', 'hung-in-there']) expect(explainMoment(content, def(id))!.risks, id).toEqual([]);
  });
  it('an ordinary story moment has no family and no explanation', () => {
    const plain = def('remember-defeat');
    expect(familyOf(plain)).toBeNull();
    expect(explainMoment(content, plain)).toBeNull();
    expect(explanationKeys(plain)).toEqual([]);
    expect(activationFactor(content, plain, { turnsOnField: 0, previousUses: 9, intense: false })).toBe(1);
  });
});

describe('conditions that must add up', () => {
  const rules = content.story.rarity.hyperRules;
  it('Overdrive never starts on the turn a Pokémon comes in; Hyper may (a save needs no warm-up)', () => {
    const od = def('defiance');
    const hy = def('toughened-it-out');
    expect(activationFactor(content, od, { turnsOnField: 1, previousUses: 0, intense: false })).toBe(0);
    expect(activationFactor(content, od, { turnsOnField: rules.minTurnsOnField.overdrive, previousUses: 0, intense: false })).toBe(1);
    expect(activationFactor(content, hy, { turnsOnField: 1, previousUses: 0, intense: false })).toBe(1);
  });
  it('each earlier moment of the family makes the next less likely, down to a floor', () => {
    const od = def('defiance');
    const f = (n: number) => activationFactor(content, od, { turnsOnField: 9, previousUses: n, intense: false });
    expect(f(1)).toBeCloseTo(rules.repeatPenalty);
    expect(f(2)).toBeLessThan(f(1));
    expect(f(50)).toBe(rules.repeatFloor);
  });
  it('a boss, rival or raid fight raises the chance a little, never to a guarantee', () => {
    const hy = def('toughened-it-out');
    expect(activationFactor(content, hy, { turnsOnField: 1, previousUses: 0, intense: true })).toBe(rules.intenseBoost);
    expect(rules.intenseBoost).toBeLessThanOrEqual(1.5);
  });
  it('the engine eligibility follows the rules: a fresh switch-in has no Overdrive, a warmed-up one does, and a repeat is halved', () => {
    const run = inBattle('rules');
    const mon = run.party[0]!;
    const ctx = () => buildHyperContext(content, run, new Rng(hashSeed('x')));
    run.battle!.playerVolatile.turnsOut = 0;
    expect(ctx().eligibility('defiance', mon)).toBeNull();
    expect(ctx().eligibility('toughenedItOut', mon)).not.toBeNull();
    run.battle!.playerVolatile.turnsOut = 3;
    const first = ctx().eligibility('defiance', mon)!;
    expect(first).not.toBeNull();
    run.story.histories[mon.uid]!.hyper['pushed-beyond-limits'] = 1;
    const second = ctx().eligibility('defiance', mon)!;
    expect(second.chance).toBeCloseTo(first.chance * rules.repeatPenalty);
  });
  it('a switch resets the count: turnsOnField comes from the battle, and a benched teammate is never held back', () => {
    const run = inBattle('turns');
    run.battle!.playerVolatile.turnsOut = 0;
    expect(turnsOnField(run, run.party[0]!.uid)).toBe(1);
    run.battle!.playerVolatile.turnsOut = 4;
    expect(turnsOnField(run, run.party[0]!.uid)).toBe(5);
    expect(turnsOnField(run, 'someone-else')).toBe(Number.MAX_SAFE_INTEGER);
  });
  it('the same moment again is not penalised twice (its own "again" halving already applies)', () => {
    const run = inBattle('again');
    const mon = run.party[0]!;
    run.story.histories[mon.uid]!.hyper['defiance'] = 3;
    expect(previousUses(content, run, mon.uid, 'overdrive', 'defiance')).toBe(0);
    expect(previousUses(content, run, mon.uid, 'overdrive')).toBe(3);
  });
});

describe('the first-time explanation', () => {
  it('names the real trigger with the numbers from the data, and only effects the data has', () => {
    const t = explainMoment(content, def('defiance'))!;
    const spec = def('defiance').effect as { kind: 'defy'; minHits: number; retaliateShare: number; cost: Record<string, number> };
    expect(t.why).toContain(`${spec.minHits} times`);
    expect(t.effects.join(' ')).toContain(`${Math.round(spec.retaliateShare * 100)}%`);
    expect(t.risks.join(' ')).toMatch(/Speed -1/);
    const k = explainMoment(content, def('toughened-it-out'))!;
    expect(k.why).toContain('25%');
    expect(k.effects).toEqual(['It survives the hit with 1 HP.']);
  });
  it('every Hyper and Overdrive moment explains itself with a trigger, an effect, a limit and its keys', () => {
    for (const d of [...defs('hyper'), ...defs('overdrive')]) {
      const x = explainMoment(content, d)!;
      expect(x.why.length, d.id).toBeGreaterThan(20);
      expect(x.effects.length, d.id).toBeGreaterThan(0);
      expect(x.limits.length, d.id).toBeGreaterThan(0);
      expect(x.keys).toEqual([`family:${d.family}`, `kind:${d.effect!.kind}`]);
      expect(explanationText(x)).toContain(x.why);
    }
  });
  it('shows once: after the keys are read nothing is unseen, and a different kind still explains itself', () => {
    const a = explainMoment(content, def('toughened-it-out'))!;
    const b = explainMoment(content, def('protective-instinct'))!;
    expect(unseenKeys([], a)).toEqual(['family:hyper', 'kind:endure']);
    expect(unseenKeys(a.keys, a)).toEqual([]);
    expect(unseenKeys(a.keys, b)).toEqual(['kind:intercept']);
  });
});

describe('profile v19: read explanations are remembered', () => {
  it('a v18 profile loads through the save manager with none read, and keeps its other data', () => {
    const storage = new MemoryStorageProvider();
    const sm = new SaveManager(storage, content);
    const { profile } = sm.loadOrCreateProfile(() => 'p1');
    const { hyperExplained: _h, ...old } = profile;
    storage.set('pkr.profile', JSON.stringify({ format: 'pkmn-roguelike', record: 'profile', schemaVersion: 18, savedAt: '', data: { ...old, candies: 77 } }));
    const loaded = new SaveManager(storage, content).loadOrCreateProfile(() => 'p2').profile;
    expect(loaded.hyperExplained).toEqual([]);
    expect(loaded.candies).toBe(77);
    expect(loaded.profileId).toBe(profile.profileId);
  });
  it('markHyperExplained saves once per key and survives a reload', () => {
    const storage = new MemoryStorageProvider();
    const session = new GameSession(content, storage);
    session.markHyperExplained(['family:hyper', 'kind:endure']);
    session.markHyperExplained(['family:hyper']);
    expect(session.profile.hyperExplained).toEqual(['family:hyper', 'kind:endure']);
    expect(new GameSession(content, storage).profile.hyperExplained).toEqual(['family:hyper', 'kind:endure']);
  });
});
