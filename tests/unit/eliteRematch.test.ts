import { describe, expect, it } from 'vitest';
import { eliteRematchDue } from '../../src/core/story/eliteRematch';
import type { Content } from '../../src/core/contentSchema';
import type { RunState } from '../../src/core/state';

const content = (enabled = true) => ({ balance: { eliteRematch: { enabled, winsPerRegion: 25 } } }) as unknown as Content;
const run = (battlesWon: number, regionIndex: number) => ({ log: { battlesWon }, regionIndex }) as unknown as RunState;

describe('Elite Four rematches (S127)', () => {
  it('stays off below the wins-per-region line and turns on at it', () => {
    expect(eliteRematchDue(content(), run(24, 0))).toBe(false);
    expect(eliteRematchDue(content(), run(25, 0))).toBe(true);
  });
  it('counts per region cleared so far', () => {
    expect(eliteRematchDue(content(), run(75, 2))).toBe(true);
    expect(eliteRematchDue(content(), run(75, 3))).toBe(false);
  });
  it('can be switched off', () => {
    expect(eliteRematchDue(content(false), run(500, 0))).toBe(false);
  });
});
