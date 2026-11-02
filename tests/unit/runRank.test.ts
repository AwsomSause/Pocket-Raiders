import { describe, expect, it } from 'vitest';
import { runScore } from '../../src/core/boards';
import { nextRank, rankFor, rankLines, RANKS, scoreBreakdown } from '../../src/core/runRank';

const run = (over: Partial<Parameters<typeof scoreBreakdown>[0]> = {}) => ({ victory: false, regionsCleared: [] as string[], badges: [] as string[], encountersCompleted: 0, ...over }) as Parameters<typeof scoreBreakdown>[0];

describe('run score breakdown and rank', () => {
  it('parts add up to runScore, and the multiplier scales the total', () => {
    const r = run({ victory: true, regionsCleared: ['a', 'b'], badges: ['x', 'y', 'z'], encountersCompleted: 40, rules: { rewardMultiplier: 1.5 } });
    const b = scoreBreakdown(r);
    expect(b.parts.reduce((n, p) => n + p.points, 0)).toBe(runScore(r));
    expect(b.base).toBe(1000 + 600 + 300 + 200);
    expect(b.total).toBe(Math.round(b.base * 1.5));
  });
  it('an empty run is Bronze with 0 points; no multiplier means x1', () => {
    const b = scoreBreakdown(run());
    expect(b.total).toBe(0);
    expect(b.multiplier).toBe(1);
    expect(rankFor(0).id).toBe('bronze');
  });
  it('rank boundaries are inclusive and Master has no next rank', () => {
    expect(rankFor(599).id).toBe('bronze');
    expect(rankFor(600).id).toBe('silver');
    expect(rankFor(5000).id).toBe('master');
    expect(rankFor(99999).id).toBe('master');
    expect(nextRank(5000)).toBeNull();
    expect(nextRank(590)).toEqual({ rank: RANKS[1], needs: 10 });
  });
  it('Game Over lines name the rank and skip zero parts', () => {
    const lines = rankLines(run({ badges: ['x'], encountersCompleted: 10 }));
    expect(lines[0]).toBe('Rank: Bronze · score 150');
    expect(lines.some((l) => l.includes('Victory'))).toBe(false);
    expect(lines.at(-1)).toContain('450 more for Silver');
  });
});
