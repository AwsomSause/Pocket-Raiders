import { describe, expect, it } from 'vitest';
import { content } from './helpers';
import { createProfile } from '../../src/core/profile';
import { questLog, questLogSummary } from '../../src/core/questLog';

describe('quest log', () => {
  it('lists every trainer line and Mythical chain, none finished at the start', () => {
    const rows = questLog(content, createProfile(content, 'p'));
    expect(rows.filter((r) => r.group === 'trainer')).toHaveLength(content.questLines.size);
    expect(rows.filter((r) => r.group === 'mythical').length).toBeGreaterThan(0);
    expect(questLogSummary(rows).finished).toBe(0);
  });
  it('marks a Mythical done once caught, half-done once only seen', () => {
    const p = { ...createProfile(content, 'p'), speciesSeen: ['mew', 'celebi'], speciesCaught: ['mew'] };
    const rows = questLog(content, p);
    expect(rows.find((r) => r.id === 'mythical:mew')).toMatchObject({ done: 3 });
    expect(rows.find((r) => r.id === 'mythical:celebi')).toMatchObject({ done: 2 });
  });
});
