import { describe, expect, it } from 'vitest';
import { bossLootPreview, chooseStarter, createRun } from '../../src/core/run';
import { content } from './helpers';

describe('Loot Previews (S320)', () => {
  it('shows whole-percent odds that add to about 100 and does not change the run', () => {
    const run = chooseStarter(content, createRun(content, { runId: 'l', seed: 'loot', archetypeId: 'red' }), 0);
    const before = JSON.stringify(run);
    const a = bossLootPreview(content, run);
    expect(a.length).toBeGreaterThan(0);
    expect(Math.abs(a.reduce((n, l) => n + l.percent, 0) - 100)).toBeLessThanOrEqual(2);
    expect(bossLootPreview(content, run)).toEqual(a);
    expect(JSON.stringify(run)).toBe(before);
  });
});
