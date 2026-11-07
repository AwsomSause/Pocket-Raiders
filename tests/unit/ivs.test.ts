// W5 IVs and EVs: rolls, the stat formula, EV caps and gains, Bottle Caps, EV berries, Hidden Power, and the run v40 -> v41 migration.

import { describe, expect, it } from 'vitest';
import { applyCatalog } from '../../src/core/catalog';
import { hashSeed, Rng } from '../../src/core/rng';
import { addEvs, evTotal, evYield, hiddenPowerType, hyperTrain, ivsOf, rollIvs, statIvsOf } from '../../src/core/ivs';
import { calcStats, createPokemon, getSpecies } from '../../src/core/pokemon';
import { chooseStarter, createRun, takeTurn } from '../../src/core/run';
import { currentEnemy } from '../../src/core/state';
import { MIGRATIONS, SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content, toBattle } from './helpers';

const opts = { moneyMultiplier: 1, rng: new Rng(hashSeed('ivs')) };
const envelope = (record: string, v: number, data: unknown) => JSON.stringify({ format: 'pkmn-roguelike', record, schemaVersion: v, savedAt: '', data });

describe('IVs', () => {
  it('are 0-31, fixed by the key, and differ between keys', () => {
    const a = rollIvs('k1');
    expect(rollIvs('k1')).toEqual(a);
    expect(Object.values(a).every((v) => Number.isInteger(v) && v >= 0 && v <= 31)).toBe(true);
    expect(rollIvs('k2')).not.toEqual(a);
  });
  it('new Pokémon get them; a Pokémon without them falls back to the roll for its uid', () => {
    const mon = createPokemon(content, 'bulbasaur', 5, 'p1');
    expect(mon.ivs).toBeDefined();
    const { ivs: _ivs, ...old } = mon;
    expect(ivsOf(old)).toEqual(rollIvs('p1'));
  });
  it('the stat formula uses (2 x base + IV + EV/4) x level / 100', () => {
    const mon = createPokemon(content, 'bulbasaur', 100, 'p1');
    mon.nature = 'hardy';
    const base = getSpecies(content, 'bulbasaur').baseStats;
    mon.ivs = { hp: 31, atk: 0, def: 31, spa: 31, spd: 31, spe: 31 };
    mon.evs = { atk: 252 };
    const s = calcStats(content, mon);
    expect(s.atk).toBe(2 * base.atk + 0 + 63 + 5);
    expect(s.def).toBe(2 * base.def + 31 + 5);
    expect(s.hp).toBe(2 * base.hp + 31 + 100 + 10 + Math.floor(100 * content.balance.hpPerLevel));
  });
});

describe('EVs', () => {
  it('stop at 252 a stat and 510 in all; negative amounts never go below 0', () => {
    const mon = createPokemon(content, 'bulbasaur', 50, 'p1');
    expect(addEvs(content, mon, 'atk', 300)).toBe(252);
    expect(addEvs(content, mon, 'spe', 252)).toBe(252);
    expect(addEvs(content, mon, 'hp', 50)).toBe(6);
    expect(evTotal(mon)).toBe(510);
    expect(addEvs(content, mon, 'hp', -20)).toBe(-6);
    expect(addEvs(content, mon, 'hp', -5)).toBe(0);
  });
  it('yield is the best base stat, 1-3 points by base stat total', () => {
    expect(evYield(getSpecies(content, 'caterpie'))).toEqual({ stat: 'hp', amount: 1 });
    expect(evYield(getSpecies(content, 'garchomp')).amount).toBe(3);
  });
  it('knocking a Pokémon out gives the battling Pokémon its EV yield times the multiplier', () => {
    let run = toBattle(chooseStarter(content, createRun(content, { runId: 'evko', seed: 'evko', archetypeId: 'red' }), 0));
    run.party[0] = createPokemon(content, run.party[0]!.speciesId, 40, run.party[0]!.uid);
    run.stage!.index = 7;
    const y = evYield(getSpecies(content, currentEnemy(run.battle!).speciesId));
    while (run.phase === 'battle') run = takeTurn(content, run, { kind: 'move', index: run.party[0]!.moves.findIndex((m) => m.pp > 0) }).run;
    expect(run.party[0]!.evs?.[y.stat]).toBe(Math.round(y.amount * content.balance.evs.gainMultiplier));
  });
  it('an EV berry lowers that stat by 10 and keeps its friendship boost', () => {
    const run = chooseStarter(content, createRun(content, { runId: 'ev', seed: 'ev', archetypeId: 'red' }), 0);
    const mon = run.party[0]!;
    mon.evs = { hp: 25 };
    const before = mon.friendship;
    applyCatalog(content, run, content.catalog.get('pomeg-berry')!, mon, opts);
    expect(mon.evs.hp).toBe(15);
    expect(mon.friendship).toBeGreaterThan(before);
  });
});

describe('Bottle Caps and Hidden Power', () => {
  it('a Bottle Cap trains the lowest IV; a Gold one trains the rest; real IVs stay', () => {
    const mon = createPokemon(content, 'bulbasaur', 50, 'p1');
    mon.ivs = { hp: 10, atk: 3, def: 31, spa: 20, spd: 31, spe: 5 };
    expect(hyperTrain(mon, 'lowest')).toEqual(['atk']);
    expect(statIvsOf(mon).atk).toBe(31);
    expect(ivsOf(mon).atk).toBe(3);
    expect(hyperTrain(mon, 'all')).toEqual(['hp', 'spa', 'spe']);
    expect(Object.values(statIvsOf(mon)).every((v) => v === 31)).toBe(true);
    expect(hyperTrain(mon, 'all')).toEqual([]);
  });
  it('the catalog Bottle Cap raises the stat it trains', () => {
    const run = chooseStarter(content, createRun(content, { runId: 'bc', seed: 'bc', archetypeId: 'red' }), 0);
    const mon = run.party[0]!;
    mon.ivs = { hp: 31, atk: 0, def: 31, spa: 31, spd: 31, spe: 31 };
    const atk = calcStats(content, mon).atk;
    applyCatalog(content, run, content.catalog.get('bottle-cap')!, mon, opts);
    expect(calcStats(content, mon).atk).toBeGreaterThan(atk);
  });
  it('Hidden Power follows the IVs (main-series spreads)', () => {
    expect(hiddenPowerType({ uid: 'x', ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 } })).toBe('dark');
    expect(hiddenPowerType({ uid: 'x', ivs: { hp: 30, atk: 30, def: 30, spa: 30, spd: 30, spe: 30 } })).toBe('fighting');
    expect(hiddenPowerType({ uid: 'x', ivs: { hp: 31, atk: 30, def: 31, spa: 30, spd: 31, spe: 30 } })).toBe('fire');
    expect(hiddenPowerType({ uid: 'x', ivs: { hp: 31, atk: 30, def: 30, spa: 31, spd: 31, spe: 31 } })).toBe('ice');
  });
});

describe('run v40 -> v41', () => {
  it('run_v40_loads_to_v41: every Pokémon gets IVs (its uid roll) and empty EVs', () => {
    const r = structuredClone(chooseStarter(content, createRun(content, { runId: 'w5', seed: 'w5', archetypeId: 'red' }), 0)) as unknown as { party: Record<string, unknown>[] };
    for (const m of r.party) {
      delete m.ivs;
      delete m.evs;
    }
    const uid = r.party[0]!.uid as string;
    const storage = new MemoryStorageProvider();
    storage.set('pkr.run', envelope('run', 40, r));
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status).toBe('ok');
    if (loaded.status !== 'ok') return;
    expect(loaded.migratedFrom).toBe(40);
    expect(loaded.data.party[0]!.ivs).toEqual(rollIvs(uid));
    expect(loaded.data.party[0]!.evs).toEqual({});
  });
  it('keeps IVs that are already there and leaves non-Pokémon objects alone', () => {
    const out = MIGRATIONS.run[40]!({ a: { uid: 'u', speciesId: 's', level: 5, vitamins: {}, ivs: { hp: 1 } }, b: { uid: 'v' } }) as Record<string, Record<string, unknown>>;
    expect(out.a!.ivs).toEqual({ hp: 1 });
    expect(out.b!.ivs).toBeUndefined();
  });
});
