// Kice 2026-11-08: the three starter choices always come from three different regions (generation = region).
import { describe, expect, it } from 'vitest';
import { starterSet } from '../../src/core/daily';
import { createRun } from '../../src/core/run';
import { drawRemembranceStarters } from '../../src/core/story2/starterDraw';
import { content } from './helpers';

/** The region of a starter line: its Remembrance's generation. */
const regionOf = (id: string) => content.storyData.remembrances.find((r) => r.line[0] === id)?.generation ?? `own:${id}`;
const regionsOf = (ids: string[]) => ids.map(regionOf);

describe('starter choices from different regions', () => {
  it('the seeded Remembrance draw gives three different regions for 200 seeds, the same every time', () => {
    for (let i = 0; i < 200; i++) {
      const a = drawRemembranceStarters(content, `starter-regions-${i}`);
      expect(a).toHaveLength(3);
      expect(new Set(regionsOf(a)).size, a.join()).toBe(3);
      expect(drawRemembranceStarters(content, `starter-regions-${i}`)).toEqual(a);
    }
  });

  it('Daily and Weekly starter sets use three different regions', () => {
    for (let i = 0; i < 100; i++) expect(new Set(regionsOf(starterSet(content, `seed-${i}`))).size).toBe(3);
  });

  it('every new run, with or without a quiz, starts from three different regions', () => {
    for (let i = 0; i < 40; i++) {
      const run = createRun(content, { runId: 'r', seed: `run-${i}`, archetypeId: 'red' });
      expect(new Set(regionsOf(run.starterChoices)).size, run.starterChoices.join()).toBe(3);
    }
  });
});
