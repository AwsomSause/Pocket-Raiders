import { describe, expect, it } from 'vitest';
import { pickStyle } from '../../src/core/rivals/manager';
import { MAJOR } from '../../src/core/rivals/major';
import { RIVAL_PROFILES } from '../../src/core/rivals/schema';
import { storyLossApplies } from '../../src/core/story2/loss';

describe('rival spread and rival-class losses', () => {
  it('no personality or style is shared by more than two canon characters', () => {
    const count = (key: 'personality' | 'style') => {
      const m: Record<string, number> = {};
      for (const c of Object.values(MAJOR.characters)) m[c[key]] = (m[c[key]] ?? 0) + 1;
      return Math.max(...Object.values(m));
    };
    expect(count('personality')).toBeLessThanOrEqual(2);
    expect(count('style')).toBeLessThanOrEqual(3);
    for (const c of Object.values(MAJOR.characters)) expect(RIVAL_PROFILES.personalities[c.personality]).toBeDefined();
  });

  it('sparked rival styles come out about even across all personalities (boundary rolls stay valid)', () => {
    const counts: Record<string, number> = {};
    const names = Object.keys(RIVAL_PROFILES.personalities);
    for (const p of names) for (let i = 0; i < 200; i++) {
      const st = pickStyle(RIVAL_PROFILES.personalities[p]!.styles, (i + 0.5) / 200);
      counts[st] = (counts[st] ?? 0) + 1;
    }
    const v = Object.values(counts);
    expect(Math.max(...v) / Math.min(...v)).toBeLessThan(5); // the old uniform pick gave 6
    expect(RIVAL_PROFILES.personalities[names[0]!]!.styles).toContain(pickStyle(RIVAL_PROFILES.personalities[names[0]!]!.styles, 0.999999));
    expect(RIVAL_PROFILES.personalities[names[0]!]!.styles).toContain(pickStyle(RIVAL_PROFILES.personalities[names[0]!]!.styles, 0));
  });

  it('losing to a rival-class trainer never ends a run, even with no rival flag', () => {
    const run = { story: { v2: { mode: 'story_run' } }, rules: {} } as never;
    expect(storyLossApplies(run, { trainer: { classId: 'rival' } })).toBe(true);
    expect(storyLossApplies(run, { trainer: { classId: 'hiker' } })).toBe(false);
  });
});
