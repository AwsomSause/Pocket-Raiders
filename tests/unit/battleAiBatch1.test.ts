// Battle/AI batch 1: S174 Z-Crystal Bonding, S275 Elite Duelist, S43 Pace Controls (Auto-Battle rules).
import { describe, expect, it } from 'vitest';
import { AUTO_RULES, chooseAutoAction } from '../../src/core/battle/autoBattle';
import { createBattle, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { transformProblem } from '../../src/core/battle/transform';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { chooseStarter, createRun, debugReplaceEnemy } from '../../src/core/run';
import { eliteDuelist, makeRules, STANDARD_CHOICE } from '../../src/core/rules';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content, toBattle } from './helpers';

describe('S174 Z-Crystal Bonding', () => {
  const setup = (bond: number) => {
    const p = createPokemon(content, 'pikachu', 50, 'p1');
    p.moves = [{ id: 'thunderbolt', pp: 15 }];
    const e = createPokemon(content, 'snorlax', 50, 'e1');
    const battle = createBattle('wild', [e], 0, p.uid);
    battle.turn = 5;
    const ctx: BattleContext = { content, battle, party: [p], inventory: { 'z-ring': 1, 'electrium-z': 1 }, rng: new Rng(hashSeed('z')), captureRng: new Rng(hashSeed('zc')), catchMultiplier: 1, bondScore: () => bond };
    return ctx;
  };
  it('a Pokémon with a low bond cannot use a Z-Move', () => {
    expect(transformProblem(setup(0), { kind: 'zmove' }, 0)).toMatch(/Not bonded enough/);
  });
  it('the threshold itself is enough (boundary)', () => {
    expect(transformProblem(setup(content.balance.zBond.minBond), { kind: 'zmove' }, 0)).toBeNull();
  });
  it('without a bond reader (simulations) nothing is checked', () => {
    const ctx = setup(0);
    delete ctx.bondScore;
    expect(transformProblem(ctx, { kind: 'zmove' }, 0)).toBeNull();
  });
});

describe('S275 Elite Duelist', () => {
  it('the modifier switches it on', () => {
    expect(eliteDuelist(makeRules({ ...STANDARD_CHOICE, modifierIds: ['elite-duelist'] }))).toBe(true);
    expect(eliteDuelist(makeRules(STANDARD_CHOICE))).toBe(false);
  });
  it('a steady roll is always the middle value and never moves', () => {
    const r = Rng.steady(hashSeed('x'));
    expect([r.float(), r.float()]).toEqual([0.5, 0.5]);
    expect(r.int(85, 100)).toBe(93);
    expect(r.chance(0.1)).toBe(false);
    expect(r.chance(1)).toBe(true);
    expect(r.state).toEqual(hashSeed('x'));
  });
  it('the same fight twice gives the same damage, with no crits', () => {
    const fight = () => {
      const p = createPokemon(content, 'machamp', 50, 'p');
      p.moves = [{ id: 'cross-chop', pp: 5 }];
      const e = createPokemon(content, 'snorlax', 60, 'e');
      e.moves = [{ id: 'splash', pp: 40 }];
      const battle = createBattle('wild', [e], 0, p.uid);
      const ctx: BattleContext = { content, battle, party: [p], inventory: {}, rng: Rng.steady(hashSeed('a')), captureRng: new Rng(hashSeed('b')), catchMultiplier: 1 };
      const ev = resolveTurn(ctx, { kind: 'move', index: 0 });
      return ev.filter((x) => x.type === 'damage' && x.side === 'enemy');
    };
    const a = fight();
    expect(a).toEqual(fight());
    expect(a.every((x) => x.type === 'damage' && !x.crit)).toBe(true);
  });
});

describe('S43 Pace Controls', () => {
  const battleRun = (seed: string) => {
    let run = chooseStarter(content, createRun(content, { runId: `r-${seed}`, seed, archetypeId: 'red' }), 0);
    run = debugReplaceEnemy(content, toBattle(run), 'geodude', 10);
    return run;
  };
  it('every rule has a label and a description', () => {
    for (const r of AUTO_RULES) expect(r.label.length * r.description.length).toBeGreaterThan(0);
  });
  it('"Super-effective first" picks a super-effective attack', () => {
    const run = battleRun('se');
    run.party[0]!.moves = [{ id: 'tackle', pp: 35 }, { id: 'water-gun', pp: 25 }];
    const pick = chooseAutoAction(content, run, ['superEffective']);
    expect(pick?.action).toMatchObject({ kind: 'move', index: 1 });
  });
  it('"Heal under 30%" uses a potion when low; "Save items" alone does not', () => {
    const run = battleRun('heal');
    run.party[0]!.hp = 1;
    run.inventory = { potion: 3 };
    expect(chooseAutoAction(content, run, ['healLow'])?.action.kind).toBe('item');
    expect(chooseAutoAction(content, run, ['noItems'])?.action.kind).not.toBe('item');
  });
  it('old settings (v31) load with no rules; chosen rules survive a reload', () => {
    const storage = new MemoryStorageProvider();
    const current = new SaveManager(storage, content).loadSettings();
    const { autoRules: _r, ...old } = current;
    storage.set('pkr.settings', JSON.stringify({ format: 'pkmn-roguelike', record: 'settings', schemaVersion: 31, savedAt: '', data: old }));
    const loaded = new SaveManager(storage, content).loadSettings();
    expect(loaded.autoRules).toEqual([]);
    new SaveManager(storage, content).saveSettings({ ...loaded, autoRules: ['stayIn', 'healLow'] });
    expect(new SaveManager(storage, content).loadSettings().autoRules).toEqual(['stayIn', 'healLow']);
  });
});
