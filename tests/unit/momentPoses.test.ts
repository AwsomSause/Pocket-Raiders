import { describe, expect, it } from 'vitest';
import { EMOTES, poseForMoment, poseForMoments, type MomentCategory } from '../../src/core/presentation/poses';

const CATEGORIES: MomentCategory[] = ['survival', 'bond', 'emotion', 'rivalry', 'enemy', 'evolution', 'legacy', 'flavour'];

describe('moment poses', () => {
  it('gives every category a pose and a known emote', () => {
    for (const c of CATEGORIES) {
      const p = poseForMoment(c);
      expect(EMOTES[p.emote].text.length).toBeGreaterThan(0);
    }
  });
  it('Hyper stands tall, Overdrive shakes with power', () => {
    expect(poseForMoment('survival', 'hyper').pose).toBe('glow');
    expect(poseForMoment('bond', 'hyper').emote).toBe('heart');
    expect(poseForMoment('bond', 'overdrive')).toEqual({ pose: 'tremble', emote: 'anger' });
  });
  it('a merged cue follows its first moment; no moments means no pose', () => {
    expect(poseForMoments([{ category: 'bond' }, { category: 'enemy' }])).toEqual(poseForMoment('bond'));
    expect(poseForMoments([])).toBeNull();
  });
});
