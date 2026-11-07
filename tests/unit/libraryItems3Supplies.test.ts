// Item uses C: the Canari Pal upgrade line (Plush Workshop events), Warp Lab Bag items and the EV-wiping mochi.
import { describe, expect, it } from 'vitest';
import { applyCatalog, getCatalogEntry } from '../../src/core/catalog';
import { chooseEvent } from '../../src/core/events';
import { itemCount } from '../../src/core/items';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content, toBattle } from './helpers';

const COLOURS = ['red', 'blue', 'green', 'pink', 'gold'];

function atWorkshop(colour: string): RunState {
  const run = structuredClone(toBattle(chooseStarter(content, createRun(content, { runId: 'pw', seed: 'pw', archetypeId: 'red' }), 0)));
  run.phase = 'map';
  const node = run.stage!.map.nodes[0]!;
  run.stage!.current = node.id;
  node.sides.push({ id: 'pw', kind: 'event', used: false, eventId: `plush-workshop-${colour}` });
  return run;
}

describe('Item uses C (supplies)', () => {
  it('each colour has three Pals that get stronger with the level', () => {
    for (const c of COLOURS) {
      const effects = [1, 2, 3].map((lv) => getCatalogEntry(content, `${c}-canari-pal-${lv}`).effect as { percent: number });
      expect(effects[0]!.percent).toBeLessThan(effects[1]!.percent);
      expect(effects[1]!.percent).toBeLessThan(effects[2]!.percent);
    }
  });

  it('the Plush Workshop trades a Pal up one level for the fee, and is locked without the Pal or the money', () => {
    for (const c of COLOURS) {
      const run = atWorkshop(c);
      run.passives = { [`${c}-canari-pal-1`]: 1 };
      run.money = 1000;
      const out = chooseEvent(content, run, 'pw', 0).run;
      expect(out.passives?.[`${c}-canari-pal-1`]).toBeUndefined();
      expect(out.passives?.[`${c}-canari-pal-2`]).toBe(1);
      expect(out.money).toBe(500);
      const poor = atWorkshop(c);
      poor.passives = { [`${c}-canari-pal-2`]: 1 };
      poor.money = 100;
      expect(() => chooseEvent(content, poor, 'pw', 1)).toThrow();
      expect(() => chooseEvent(content, atWorkshop(c), 'pw', 0)).toThrow();
    }
  });

  it('a Warp Lab urge item puts two urges in the Bag', () => {
    const run = chooseStarter(content, createRun(content, { runId: 'r', seed: 'c', archetypeId: 'red' }), 0);
    applyCatalog(content, run, getCatalogEntry(content, 'wl-reset-urge'), undefined, { moneyMultiplier: 1, rng: new Rng(hashSeed('c')) });
    expect(itemCount(run.inventory, 'reset-urge')).toBe(2);
  });

  it('Fresh Start Mochi removes EVs', () => {
    const run = chooseStarter(content, createRun(content, { runId: 'r', seed: 'c', archetypeId: 'red' }), 0);
    const mon = createPokemon(content, 'eevee', 20, 'e');
    mon.evs = { atk: 100, spe: 40 };
    applyCatalog(content, run, getCatalogEntry(content, 'fresh-start-mochi'), mon, { moneyMultiplier: 1, rng: new Rng(hashSeed('c')) });
    expect(Object.values(mon.evs ?? {}).reduce((a, b) => a + (b ?? 0), 0)).toBe(0);
  });
});
