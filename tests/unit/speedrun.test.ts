import { describe, expect, it } from 'vitest';
import { categoryLabel, formatMs, newSplits, parseSplits, splitLines, updateSplits } from '../../src/core/tools/speedrun';

describe('speedrun timer', () => {
  it('formats times', () => {
    expect(formatMs(0)).toBe('0:00');
    expect(formatMs(65_000)).toBe('1:05');
    expect(formatMs(3_725_000)).toBe('1:02:05');
  });
  it('records each badge once, even when called again or after a jump', () => {
    let s = newSplits('r', 1000);
    s = updateSplits(s, 61_000, 1, false);
    s = updateSplits(s, 90_000, 1, false);
    s = updateSplits(s, 121_000, 3, false);
    expect(s.splits.map((x) => [x.label, x.ms])).toEqual([['Badge 1', 60_000], ['Badge 2', 120_000], ['Badge 3', 120_000]]);
  });
  it('finishes once', () => {
    let s = updateSplits(newSplits('r', 0), 5000, 0, true);
    s = updateSplits(s, 9000, 0, true);
    expect(s.finished).toBe(5000);
    expect(splitLines(s, 9999).at(-1)).toBe('Finished  0:05');
  });
  it('labels categories the same whatever the modifier order', () => {
    expect(categoryLabel({ modeId: 'standard', difficultyId: 'hard', modifierIds: ['b', 'a'] })).toBe('standard / hard / a / b');
  });
  it('survives bad stored text', () => {
    expect(parseSplits('nope')).toBeNull();
    expect(parseSplits(null)).toBeNull();
    expect(parseSplits(JSON.stringify(newSplits('r', 3)))).toEqual(newSplits('r', 3));
  });
});
