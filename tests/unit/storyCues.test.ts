import { describe, expect, it } from 'vitest';
import { storyTrackIsMade, storyTrack } from '../../src/core/storyAudio';

describe('story cue hooks (W16)', () => {
  it('knows the hooked stingers and that none is made yet', () => {
    for (const id of ['st_evolution_moment', 'st_badge_circuit', 'st_league_gate']) {
      expect(storyTrack(id)).toBeDefined();
      expect(storyTrackIsMade(id)).toBe(false);
    }
    expect(storyTrackIsMade('st_nope')).toBe(false);
  });
});
