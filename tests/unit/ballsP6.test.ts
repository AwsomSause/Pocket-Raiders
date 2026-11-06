// Item sprites P6: Nature Balls, Training Balls and Tera Jewels.
import { describe, expect, it } from 'vitest';
import { applyCatalog, catalogTargetProblem, getCatalogEntry } from '../../src/core/catalog';
import { hashSeed, Rng } from '../../src/core/rng';
import { beginBattle, chooseStarter, createRun, takeTurn } from '../../src/core/run';
import { getSpecies } from '../../src/core/pokemon';
import { content, toBattle } from './helpers';

/** Throws `ball` at a weakened foe until it is caught (a few seeds), and returns the caught Pokémon. */
function caughtWith(ball: string) {
  for (let n = 0; n < 40; n++) {
    const run = chooseStarter(content, createRun(content, { runId: 'r', seed: `b-${ball}-${n}`, archetypeId: 'red' }), 0);
    const started = beginBattle(content, toBattle(run)).run;
    started.inventory = { ...started.inventory, [ball]: 5 };
    started.battle!.enemyTeam[0]!.hp = 1;
    for (let t = 0; t < 5 && !started.battle!.outcome; t++) {
      const res = takeTurn(content, started, { kind: 'item', itemId: ball });
      Object.assign(started, res.run);
      const decision = res.run.pending.find((d) => d.kind === 'caught');
      if (decision?.kind === 'caught') return decision.mon;
    }
  }
  return null;
}

describe('catch-shaping balls', () => {
  it('a Nature Ball gives the caught Pokémon its nature', () => {
    expect(caughtWith('adamant-ball')?.nature).toBe('adamant');
    expect(caughtWith('timid-ball')?.nature).toBe('timid');
  });

  it('a Training Ball starts the caught Pokémon with +5% in one stat', () => {
    expect(caughtWith('spe-training-ball')?.statBoosts?.spe).toBe(5);
    expect(caughtWith('atk-training-ball')?.statBoosts?.spe).toBeUndefined();
  });

  it('every ball is a catch item with a library picture and a draft pack', () => {
    for (const id of ['adamant-ball', 'quirky-ball', 'hp-training-ball']) {
      const item = content.items.get(id)!;
      expect(item.effect.kind).toBe('catch');
      expect(item.iconAssetId).toMatch(/^item\.library\//);
      expect(getCatalogEntry(content, `${id}-pack`).effect).toMatchObject({ kind: 'bagItem', item: id, count: 3 });
    }
  });
});

describe('Tera Jewels', () => {
  const run = chooseStarter(content, createRun(content, { runId: 'r', seed: 'tj', archetypeId: 'red' }), 0);
  const use = (id: string) => {
    const mon = structuredClone(run.party[0]!);
    applyCatalog(content, run, getCatalogEntry(content, id), mon, { moneyMultiplier: 1, rng: new Rng(hashSeed('tj')) });
    return mon;
  };
  it('Radiant gives the first type, Master the second, Mystery a type', () => {
    const types = getSpecies(content, run.party[0]!.speciesId).types;
    expect(use('radiant-tera-jewel').teraType).toBe(types[0]);
    expect(use('master-tera-jewel').teraType).toBe(types[1] ?? types[0]);
    expect(use('mystery-tera-jewel').teraType).toBeTruthy();
  });
  it('refuses when nothing would change', () => {
    const mon = use('radiant-tera-jewel');
    expect(catalogTargetProblem(content, run, getCatalogEntry(content, 'radiant-tera-jewel'), mon)).toMatch(/already/);
  });
});
