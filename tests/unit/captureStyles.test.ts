// Capture Styles (S224): befriend, negotiate and trap, off by default.
import { describe, expect, it } from 'vitest';
import { createBattle, itemProblem, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { styleProbability, styleProblem, type StyleInput } from '../../src/core/captureStyles';
import { applyRecipe, CRAFTING, recipeProblem } from '../../src/core/crafting';
import { createPokemon } from '../../src/core/pokemon';
import { chooseStarter, createRun } from '../../src/core/run';
import { hashSeed, Rng } from '../../src/core/rng';
import type { PokemonInstance } from '../../src/core/state';
import { serviceView } from '../../src/core/services/flow';
import { content } from './helpers';

const on = { ...content, balance: { ...content.balance, captureStyles: { ...content.balance.captureStyles, enabled: true } } } as typeof content;
const base: StyleInput = { foe: { level: 5, hp: 20, maxHp: 20, catchRate: 255, asleepOrParalysed: false, hasStatus: false }, leadLevel: 15 };

function engine(c: typeof content, foe: PokemonInstance, item: string, seed = 'cs') {
  const player = createPokemon(c, 'charmander', 15, 'p1');
  const battle = createBattle('wild', [foe], 0, player.uid, null);
  const ctx: BattleContext = { content: c, battle, party: [player], inventory: { [item]: 3 }, rng: new Rng(hashSeed(seed)), captureRng: new Rng(hashSeed(`${seed}-c`)), catchMultiplier: 1 };
  return ctx;
}

describe('style odds', () => {
  it('are off by default and say so', () => {
    expect(content.balance.captureStyles.enabled).toBe(false);
    expect(styleProblem(content, 'befriend', base)).toMatch(/switched off/);
    expect(styleProblem(on, 'befriend', base)).toBeNull();
  });
  it('befriend favours easy-going and calm foes, ignores HP', () => {
    const hard = styleProbability(on, 'befriend', { ...base, foe: { ...base.foe, catchRate: 3 } });
    const easy = styleProbability(on, 'befriend', base);
    const calm = styleProbability(on, 'befriend', { ...base, foe: { ...base.foe, asleepOrParalysed: true } });
    expect(easy).toBeGreaterThan(hard);
    expect(calm).toBeGreaterThan(easy);
    expect(styleProbability(on, 'befriend', { ...base, foe: { ...base.foe, hp: 1 } })).toBe(easy);
  });
  it('negotiate follows the level gap, clamped', () => {
    const c = on.balance.captureStyles;
    expect(styleProbability(on, 'negotiate', { ...base, leadLevel: 500 })).toBe(c.negotiateMax);
    expect(styleProbability(on, 'negotiate', { ...base, leadLevel: -500 })).toBe(c.negotiateMin);
    expect(styleProbability(on, 'negotiate', { ...base, leadLevel: 6 })).toBeGreaterThan(styleProbability(on, 'negotiate', { ...base, leadLevel: 5 }));
  });
  it('trap needs a worn-down or afflicted foe', () => {
    expect(styleProblem(on, 'trap', base)).toMatch(/too lively/);
    expect(styleProblem(on, 'trap', { ...base, foe: { ...base.foe, hp: 5 } })).toBeNull();
    expect(styleProblem(on, 'trap', { ...base, foe: { ...base.foe, hasStatus: true } })).toBeNull();
  });
});

describe('in battle', () => {
  it('refuses while switched off, works when on, and is used up', () => {
    const foe = createPokemon(on, 'rattata', 5, 'e1');
    expect(itemProblem(engine(content, foe, 'friend-treat'), 'friend-treat')).toMatch(/switched off/);
    const ctx = engine(on, foe, 'friend-treat');
    expect(itemProblem(ctx, 'friend-treat')).toBeNull();
    expect(itemProblem(engine(on, createPokemon(on, 'rattata', 5, 'e2'), 'snare-trap'), 'snare-trap')).toMatch(/too lively/);
    let caught = 0;
    for (let i = 0; i < 40; i++) {
      const c = engine(on, createPokemon(on, 'rattata', 5, 'e3'), 'peace-offering', `seed${i}`);
      const r = resolveTurn(c, { kind: 'item', itemId: 'peace-offering' });
      expect(c.inventory['peace-offering']).toBe(2);
      if (c.battle.outcome === 'caught') {
        caught++;
        expect(r.some((e) => e.type === 'ball' && e.caught)).toBe(true);
      }
    }
    expect(caught).toBeGreaterThan(10);
    expect(caught).toBeLessThan(40);
  });
});

describe('crafting', () => {
  it('recipes are hidden and refused while off, and craft the item when on', () => {
    const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'cs', seed: 'cs', archetypeId: 'red' }), 0));
    const node = run.stage!.map.nodes.find((n) => n.column === 1)!;
    node.sides = [{ id: 'ws', kind: 'service', serviceId: 'workshop', used: false }];
    run.stage!.current = node.id;
    run.materials = { fiber: 5 };
    const r = CRAFTING.recipes.find((x) => x.id === 'friend-treat')!;
    expect(serviceView(content, run, 'ws').options.some((o) => o.id === 'craft:friend-treat')).toBe(false);
    expect(serviceView(on, run, 'ws').options.some((o) => o.id === 'craft:friend-treat')).toBe(true);
    expect(recipeProblem(content, run, r)).toMatch(/switched off/);
    expect(recipeProblem(on, run, r)).toBeNull();
    applyRecipe(on, run, r);
    expect(run.inventory['friend-treat']).toBe(1);
  });
});
