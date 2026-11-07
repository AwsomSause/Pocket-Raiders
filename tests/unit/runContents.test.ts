import { describe, expect, it } from 'vitest';
import { buildRunCard } from '../../src/core/runCard';
import { runContents } from '../../src/core/runContents';
import { createRun } from '../../src/core/run';
import { content } from './helpers';

describe('run contents and run card (W12)', () => {
  const run = createRun(content, { runId: 'r', seed: 'w12', archetypeId: 'red' });
  it('lists rules and world rows for a fresh run, and is pure', () => {
    const before = JSON.stringify(run);
    const rows = runContents(content, run);
    expect(rows.find((r) => r.title === 'Mode')).toBeTruthy();
    expect(rows.find((r) => r.title === 'Difficulty')).toBeTruthy();
    expect(rows.find((r) => r.title === 'Time')).toBeTruthy();
    expect(rows.every((r) => r.title.length > 0)).toBe(true);
    expect(JSON.stringify(run)).toBe(before);
  });
  it('shows picked modifiers', () => {
    const r = { ...run, mutators: ['unknown-id'] };
    expect(runContents(content, r).some((x) => x.group === 'Picks')).toBe(true);
  });
  it('builds a card with a title, stats and at most 4 highlights', () => {
    const card = buildRunCard(content, run);
    expect(card.title).toBe('Run over');
    expect(card.stats.length).toBe(4);
    expect(card.highlights.length).toBeLessThanOrEqual(4);
    expect(card.footer).toContain('w12');
    expect(buildRunCard(content, { ...run, victory: true }).title).toBe('Run cleared!');
  });
});
