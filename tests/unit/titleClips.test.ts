import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { clipAt, CLIP_FADE, CLIP_HOLD, TITLE_CLIPS } from '../../src/core/presentation/titleClips';

describe('title backdrop clips', () => {
  it('ships all six clips', () => {
    expect(TITLE_CLIPS).toHaveLength(6);
    for (const f of TITLE_CLIPS) expect(existsSync(`public/${f}`), f).toBe(true);
  });
  it('plays every clip once before repeating, from any start', () => {
    for (let start = 0; start < 6; start++) {
      const seen = [0, 1, 2, 3, 4, 5].map((step) => clipAt(start, step));
      expect(new Set(seen).size).toBe(6);
      expect(clipAt(start, 6)).toBe(start);
    }
  });
  it('wraps a bad start into range', () => {
    expect(clipAt(-1, 0)).toBe(5);
    expect(clipAt(0, 1, 1)).toBe(0);
  });
  it('fades for less time than a clip stays up', () => {
    expect(CLIP_FADE).toBeLessThan(CLIP_HOLD / 2);
  });
});
