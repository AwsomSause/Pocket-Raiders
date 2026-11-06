import { describe, expect, it } from 'vitest';
import { remembranceArchive } from '../../src/core/story2/remembranceView';
import { freshProfileStory } from '../../src/core/story2/schema';
import { content } from './helpers';

const nameOf = (id: string) => id.toUpperCase();
const profile = () => ({ story: freshProfileStory() });

describe('remembrance archive view', () => {
  it('lists every non-disabled line, all locked on a fresh profile, hiding names', () => {
    const v = remembranceArchive(content.storyData, profile(), nameOf, true);
    expect(v.total).toBe(content.storyData.remembrances.filter((r) => r.status !== 'disabled').length);
    expect(v.unlocked).toBe(0);
    expect(v.entries.every((e) => e.title === '???' && e.detail === 'Not found yet.')).toBe(true);
  });
  it('spoiler guard off shows how a locked line unlocks', () => {
    const v = remembranceArchive(content.storyData, profile(), nameOf, false);
    expect(v.entries.some((e) => e.detail !== 'Not found yet.')).toBe(true);
  });
  it('seen shows the line, unlocked shows everything and mastery pips (clamped 0..3)', () => {
    const p = profile();
    const [a, b] = content.storyData.remembrances.filter((r) => r.status !== 'disabled');
    p.story.remembrance[a!.id] = { state: 'seen', firstSeenRun: 1, runs: 0, mastery: 0 };
    p.story.remembrance[b!.id] = { state: 'unlocked', firstSeenRun: 1, runs: 4, mastery: 9 };
    const v = remembranceArchive(content.storyData, p, nameOf, true);
    expect(v.unlocked).toBe(1);
    const seen = v.entries.find((e) => e.id === a!.id)!;
    expect(seen).toMatchObject({ state: 'seen', right: 'Seen', title: nameOf(a!.line[0]!) });
    const done = v.entries.find((e) => e.id === b!.id)!;
    expect(done.right).toBe('●●●');
    expect(done.detail).toContain('Runs: 4');
    expect(done.detail).toContain('Keystone:');
  });
});
