import { describe, expect, it } from 'vitest';
import { migrationWildWeight, seasonOf } from '../../src/core/clock';
import { content } from './helpers';

const at = (day: number) => ({ clock: { day, tick: 0, celebrated: [] as number[] } });
const len = content.balance.clock.seasonLength;
const m = content.balance.clock.migration!;

describe('Migration Seasons (S135)', () => {
  it('species of the passing season are common, and rarer in the opposite season', () => {
    const spring = at(1);
    const autumn = at(1 + 2 * len);
    expect(seasonOf(content, spring)).toBe('Spring');
    expect(seasonOf(content, autumn)).toBe('Autumn');
    expect(migrationWildWeight(content, autumn, 'machop')).toBe(m.factor);
    expect(migrationWildWeight(content, spring, 'machop')).toBe(m.awayFactor);
  });
  it('unknown species stay at weight 1', () => {
    expect(migrationWildWeight(content, at(1), 'nonexistent-species')).toBe(1);
  });
  it('each season is read only from the day counter (same day, same weight)', () => {
    for (let d = 1; d < 4 * len; d++) expect(migrationWildWeight(content, at(d), 'squirtle')).toBe(migrationWildWeight(content, at(d), 'squirtle'));
  });
});
