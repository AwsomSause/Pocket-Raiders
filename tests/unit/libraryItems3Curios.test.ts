// Item uses D: fossils, Reins of Unity, Bag balls and the Seed of Mastery.
import { describe, expect, it } from 'vitest';
import { applyCatalog, getCatalogEntry } from '../../src/core/catalog';
import { itemCount } from '../../src/core/items';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { chooseStarter, createRun } from '../../src/core/run';
import { content } from './helpers';

const run0 = () => chooseStarter(content, createRun(content, { runId: 'r', seed: 'library-items-3-curios', archetypeId: 'red' }), 0);
const apply = (run: ReturnType<typeof run0>, id: string, target?: ReturnType<typeof createPokemon>) => applyCatalog(content, run, getCatalogEntry(content, id), target, { moneyMultiplier: 1, rng: new Rng(hashSeed('curios')) });

describe('Item uses D (curios)', () => {
  it('a new fossil revives its Pokémon', () => {
    const run = run0();
    const res = apply(run, 'enigma-fossil');
    expect(res.pending.some((p) => p.kind === 'caught' && p.mon.speciesId === 'unown') || run.party.some((m) => m.speciesId === 'unown')).toBe(true);
  });

  it('the Reins of Unity only help Calyrex', () => {
    const effect = getCatalogEntry(content, 'icy-reins-of-unity').effect as { hooks: { hook: string; to?: string }[] };
    expect(effect.hooks.find((h) => h.hook === 'formHeld')?.to).toBe('calyrex-ice');
    expect(content.species.has('calyrex-ice')).toBe(true);
  });

  it('the ball pictures put balls in the Bag', () => {
    const run = run0();
    apply(run, 'mb-ball');
    apply(run, 'rb-ball');
    expect(itemCount(run.inventory, 'master-ball')).toBe(1);
    expect(itemCount(run.inventory, 'ultra-ball')).toBeGreaterThanOrEqual(3);
  });

  it('the Seed of Mastery hyper trains a Pokémon’s lowest IV', () => {
    const run = run0();
    const mon = createPokemon(content, 'eevee', 20, 'e');
    apply(run, 'seed-of-mastery', mon);
    expect(mon.hyperTrained?.length).toBe(1);
  });

  it('the Moon Dial favours Dark and Ghost wild Pokémon for a stage', () => {
    const entry = getCatalogEntry(content, 'moon-dial');
    expect(entry.effect).toMatchObject({ kind: 'encounter', lasts: { for: 'stage' }, mods: [{ mod: 'types', types: ['dark', 'ghost'] }] });
  });
});
