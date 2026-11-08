// Kice 2026-11-08: the three starter choices always come from three different regions (Regional Research is the one rule that asks for one region).
import { describe, expect, it } from 'vitest';
import { hashSeed, Rng } from '../../src/core/rng';
import { defaultPrep, draftStarters, homeRegionOf, pickDistinctRegions, eligibleSpecies } from '../../src/core/runPrep';
import { starterSet } from '../../src/core/daily';
import { content } from './helpers';

const regionsOf = (ids: string[]) => ids.map((id) => homeRegionOf(content, id));

describe('starter choices from different regions', () => {
  it('every pool that spans three or more regions drafts three different regions, for 40 seeds each', () => {
    let checked = 0;
    for (const p of content.starterPools.values()) {
      if (p.mastered) continue;
      const ids = eligibleSpecies(content, p);
      if (ids.length < 3 || new Set(regionsOf(ids)).size < 3) continue;
      checked++;
      const prep = { ...defaultPrep(content), poolId: p.id };
      for (let i = 0; i < 40; i++) {
        const draft = draftStarters(content, new Rng(hashSeed(`starter-regions-${p.id}-${i}`)), prep);
        expect(new Set(regionsOf(draft.choices)).size, `${p.id}: ${draft.choices.join()}`).toBe(3);
      }
    }
    expect(checked).toBeGreaterThan(10);
  });

  it('Daily and Weekly starter sets use three different regions', () => {
    for (let i = 0; i < 100; i++) expect(new Set(regionsOf(starterSet(content, `seed-${i}`))).size).toBe(3);
  });

  it('pickDistinctRegions prefers new regions, keeps order, and fills when the list has too few regions', () => {
    const pool = [...content.starterPools.values()].find((p) => p.category === 'classic')!;
    const ids = eligibleSpecies(content, pool);
    const out = pickDistinctRegions(content, ids, 3);
    expect(out).toHaveLength(3);
    const oneRegion = ids.filter((id) => homeRegionOf(content, id) === homeRegionOf(content, ids[0]!));
    expect(pickDistinctRegions(content, oneRegion, 3)).toEqual(oneRegion.slice(0, 3));
    expect(pickDistinctRegions(content, [], 3)).toEqual([]);
  });
});
