// S418 temporary mints: a nature that lasts a few won battles, then the real one returns.
import { describe, expect, it } from 'vitest';
import { applyCatalog } from '../../src/core/catalog';
import { calcStats, createPokemon } from '../../src/core/pokemon';
import { Rng, hashSeed } from '../../src/core/rng';
import { effectiveNature } from '../../src/core/natures';
import { chooseStarter, createRun } from '../../src/core/run';
import { content, toBattle } from './helpers';

describe('temporary mints (S418)', () => {
  const entry = content.catalog.get('fleeting-adamant-mint')!;

  it('is a supported catalog item for 3 battles', () => {
    expect(entry.status).toBe('supported');
    expect(entry.effect).toMatchObject({ kind: 'nature', nature: 'adamant', battles: 3 });
  });

  it('changes the stats for a while and keeps the real nature underneath', () => {
    const run = structuredClone(toBattle(chooseStarter(content, createRun(content, { runId: 'tm', seed: 'tm', archetypeId: 'red' }), 0)));
    const mon = createPokemon(content, 'machop', 30, 'm1');
    mon.nature = 'modest';
    const before = calcStats(content, mon);
    applyCatalog(content, run, entry, mon, { moneyMultiplier: 1, rng: new Rng(hashSeed('tm')) });
    expect(mon.nature).toBe('modest');
    expect(mon.tempNature).toEqual({ nature: 'adamant', battles: 3 });
    expect(effectiveNature(mon)).toBe('adamant');
    const after = calcStats(content, mon);
    expect(after.atk).toBeGreaterThan(before.atk);
    expect(after.spa).toBeLessThan(before.spa);
    mon.tempNature = undefined;
    expect(effectiveNature(mon)).toBe('modest');
  });

  it('a finished mint (0 battles) no longer counts', () => {
    expect(effectiveNature({ nature: 'modest', tempNature: { nature: 'adamant', battles: 0 } })).toBe('modest');
  });
});
