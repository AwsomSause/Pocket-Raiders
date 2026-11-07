// Item uses B: rings in the Bag, Mega Stone gifts and IV Charms for the whole party.
import { describe, expect, it } from 'vitest';
import { applyCatalog, getCatalogEntry, isCatalogUseful } from '../../src/core/catalog';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { chooseStarter, createRun } from '../../src/core/run';
import { itemCount } from '../../src/core/items';
import { statIvsOf } from '../../src/core/ivs';
import { content } from './helpers';

const run0 = () => chooseStarter(content, createRun(content, { runId: 'r', seed: 'library-items-3-gear', archetypeId: 'red' }), 0);
const use = (run: ReturnType<typeof run0>, id: string) => applyCatalog(content, run, getCatalogEntry(content, id), undefined, { moneyMultiplier: 1, rng: new Rng(hashSeed('gear')) });

describe('Item uses B (gear)', () => {
  it('the ring items put the key item in the Bag', () => {
    const run = run0();
    use(run, 'mega-cuff');
    use(run, 'z-power-ring');
    use(run, 'dynamax-crystal');
    expect(['mega-ring', 'z-ring', 'dynamax-band'].map((id) => itemCount(run.inventory, id))).toEqual([1, 1, 1]);
  });

  it('Keystone gives the Mega Stone of a party member and a Mega Ring, and only when someone can use one', () => {
    const run = run0();
    run.party = [createPokemon(content, 'eevee', 20, 'a')];
    expect(isCatalogUseful(content, run, getCatalogEntry(content, 'keystone'))).toBe(false);
    run.party.push(createPokemon(content, 'abomasnow', 50, 'b'));
    expect(isCatalogUseful(content, run, getCatalogEntry(content, 'keystone'))).toBe(true);
    use(run, 'keystone');
    expect(itemCount(run.inventory, 'abomasite')).toBe(1);
    expect(itemCount(run.inventory, 'mega-ring')).toBe(1);
    expect(isCatalogUseful(content, run, getCatalogEntry(content, 'keystone'))).toBe(false);
  });

  it('IV Charm II hyper trains every IV of the whole party', () => {
    const run = run0();
    run.party.push(createPokemon(content, 'pikachu', 10, 'c'));
    expect(isCatalogUseful(content, run, getCatalogEntry(content, 'iv-charm-2'))).toBe(true);
    use(run, 'iv-charm-2');
    for (const mon of run.party) expect(Object.values(statIvsOf(mon)).every((v) => v === 31)).toBe(true);
    expect(isCatalogUseful(content, run, getCatalogEntry(content, 'iv-charm-2'))).toBe(false);
  });

  it('IV Charm trains only the lowest IV of each Pokémon', () => {
    const run = run0();
    use(run, 'iv-charm');
    for (const mon of run.party) expect(mon.hyperTrained?.length ?? 0).toBeLessThanOrEqual(1);
  });
});
