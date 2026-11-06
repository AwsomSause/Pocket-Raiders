import { describe, expect, it } from 'vitest';
import { applyCatalog, getCatalogEntry } from '../../src/core/catalog';
import { mapOmens, omenGap, omenTier } from '../../src/core/omens';
import { hashSeed, Rng } from '../../src/core/rng';
import { chooseStarter, createRun, mapChoices } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

const newRun = (seed = 'omen'): RunState => structuredClone(chooseStarter(content, createRun(content, { runId: 'r', seed, archetypeId: 'red' }), 0));

describe('Omens (S380)', () => {
  it('shows nothing without the Augur\'s Bell', () => {
    expect(mapOmens(content, newRun())).toEqual({});
  });

  it('with the bell, every fight you can walk to gets an omen, and looking changes nothing', () => {
    const run = newRun();
    applyCatalog(content, run, getCatalogEntry(content, 'augurs-bell'), undefined, { moneyMultiplier: 1, rng: new Rng(hashSeed('t')) });
    const before = JSON.stringify(run);
    const omens = mapOmens(content, run);
    expect(JSON.stringify(run)).toBe(before);
    const fights = mapChoices(content, run).filter((n) => ['wild', 'trainer', 'gym', 'elite', 'champion'].includes(n.kind));
    expect(fights.length).toBeGreaterThan(0);
    for (const n of fights) expect(['calm', 'uneasy', 'dire']).toContain(omens[n.id]?.tier);
    expect(mapOmens(content, run)).toEqual(omens);
  });

  it('rates the gap between foes and your best fighters', () => {
    const party = [{ hp: 10, level: 20 }, { hp: 10, level: 10 }, { hp: 0, level: 50 }] as never;
    expect(omenGap(content, [{ level: 25 }], party)).toBe(25 - 15);
    expect(omenTier(content, -5)).toBe('calm');
    expect(omenTier(content, 0)).toBe('uneasy');
    expect(omenTier(content, 10)).toBe('dire');
    expect(omenGap(content, [], party)).toBe(0);
    expect(omenGap(content, [{ level: 5 }], [{ hp: 0, level: 5 }] as never)).toBe(0);
  });
});
