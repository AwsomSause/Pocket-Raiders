// Story S20: a short Story Run per backstory plays without errors, is deterministic, and every module validates.
import { describe, expect, it } from 'vitest';
import { validateModule } from '../../src/core/story2/moduleValidator';
import { autoplay } from './autoplay';
import { content } from './helpers';

const play = (backstory: string, seed: string) => autoplay({
  seed, campaignId: 'orrery-circuit', steps: 500, smart: true, healOnMap: true,
  onStep: (r) => {
    if (r.story.v2 && !r.story.v2.protagonist) r.story.v2.protagonist = { look: 'look_a', name: 'Sim', pronouns: 'they', backstory };
    return r;
  },
});

describe('story acceptance (S20)', () => {
  for (const b of content.storyData.backstories) {
    it(`${b.id}: module validates and a short Story Run is deterministic`, () => {
      expect(validateModule(content.storyData, b.id)).toEqual([]);
      const a = play(b.id, `acc-${b.id}`), c = play(b.id, `acc-${b.id}`);
      expect(a.story.v2?.mode).toBe('story_run');
      expect(a.story.v2?.protagonist?.backstory).toBe(b.id);
      expect(a.story.events.length).toBeGreaterThan(0);
      expect(JSON.stringify([a.phase, a.encountersCompleted, a.story.flags, a.story.events.length]))
        .toBe(JSON.stringify([c.phase, c.encountersCompleted, c.story.flags, c.story.events.length]));
    }, 60000);
  }
});
