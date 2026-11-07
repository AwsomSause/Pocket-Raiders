import { describe, expect, it } from 'vitest';
import { characterProfile, pronounsText } from '../../src/core/story2/profileView';
import { freshProfileStory } from '../../src/core/story2/schema';

const profile = () => ({ story: freshProfileStory() });

describe('character profile view', () => {
  it('a fresh profile has no name yet and sensible defaults', () => {
    const v = characterProfile(profile());
    expect(v.named).toBe(false);
    expect(Object.fromEntries(v.lines.map((l) => [l.label, l.value]))).toMatchObject({ Name: 'Not chosen yet', Pronouns: 'they/them', Look: 'Look A', 'Vance speaks': 'Not decided yet', Prologue: 'Not played yet', 'Story Runs told': '0' });
  });
  it('shows a chosen name, tone, totals and a wanted Look that is not ready', () => {
    const p = profile();
    Object.assign(p.story.protagonist, { name: 'Ash', nameSet: true, pronouns: { subj: 'xe', obj: 'xem', poss: 'xyr', reflexive: 'xemself' }, lookRequested: 'look_b' });
    p.story.prologue.vanceTone = 'playful';
    p.story.prologue.done = true;
    p.story.prologue.mode = 'quick';
    p.story.endingsSeen = ['e1', 'e2'];
    p.story.remembrance.rm_a = { state: 'unlocked', firstSeenRun: 1, runs: 1, mastery: 0 };
    p.story.remembrance.rm_b = { state: 'seen', firstSeenRun: 1, runs: 0, mastery: 0 };
    const v = characterProfile(p);
    const m = Object.fromEntries(v.lines.map((l) => [l.label, l.value]));
    expect(v.named).toBe(true);
    expect(m).toMatchObject({ Name: 'Ash', Pronouns: 'xe/xem', 'Vance speaks': 'Playful', Prologue: 'Done (quick start)', 'Endings seen': '2', 'Remembrances unlocked': '1', 'Look wanted': 'Look B (coming soon)' });
  });
  it('turns the stored short pronouns into text', () => {
    expect(pronounsText('she')).toBe('she/her');
    expect(pronounsText('he')).toBe('he/him');
    expect(pronounsText('ze')).toBe('ze');
  });
});
