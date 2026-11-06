// Story Overhaul S18: the Story section of the settings screen.

import { describe, expect, it } from 'vitest';
import { changeSetting, settingsIn, SETTINGS } from '../../src/core/settingsRegistry';
import { STORY_SETTINGS_DEFAULTS } from '../../src/core/story2/schema';
import { DEFAULT_SETTINGS } from '../../src/save/saveManager';

const story = settingsIn('story');
const byId = (id: string) => SETTINGS.find((d) => d.id === id)!;

describe('story settings', () => {
  it('the Story category lists every story setting plus the Reduce motion shortcut', () => {
    expect(story.map((d) => d.id)).toEqual(expect.arrayContaining(['storyIntensity', 'storyDramatic', 'storyAutonomy', 'storyRomance', 'storyActivities', 'storyReduceMotion', 'storySubtitleSize', 'storySubtitleStyle', 'storySpoilerGuard', 'storyJournalVoice']));
  });
  it('each one starts at its default and cycles through every value back to the start', () => {
    for (const d of story.filter((x) => x.id !== 'storyRomance' && x.id !== 'storyReduceMotion')) {
      const seen = new Set<string>();
      let s = DEFAULT_SETTINGS;
      for (let i = 0; i < 6; i++) {
        seen.add(d.show(s));
        s = d.next(s);
      }
      expect(seen.size, d.id).toBeGreaterThan(1);
      expect(s.story.intensity).toBeDefined();
    }
    expect(DEFAULT_SETTINGS.story).toEqual(STORY_SETTINGS_DEFAULTS);
  });
  it('a story setting changes only the story object, never the accessibility profile', () => {
    const next = byId('storyDramatic').next(DEFAULT_SETTINGS);
    expect(next.story.dramaticMoments).not.toBe(DEFAULT_SETTINGS.story.dramaticMoments);
    expect({ ...next, story: DEFAULT_SETTINGS.story }).toEqual(DEFAULT_SETTINGS);
  });
  it('Romance is greyed and cannot change', () => {
    const d = byId('storyRomance');
    expect(d.disabled!(DEFAULT_SETTINGS)).toBe(true);
    expect(d.next(DEFAULT_SETTINGS)).toEqual(DEFAULT_SETTINGS);
    expect(changeSetting(DEFAULT_SETTINGS, 'storyRomance')).toEqual(DEFAULT_SETTINGS);
  });
  it('Reduce motion sets animation intensity and reduced flash together, and toggles back', () => {
    const d = byId('storyReduceMotion');
    const on = d.next(DEFAULT_SETTINGS);
    expect(on.animationIntensity).toBe('reduced');
    expect(on.reducedFlash).toBe(true);
    expect(d.show(on)).toBe('On');
    expect(d.next(on).animationIntensity).toBe('normal');
  });
});
