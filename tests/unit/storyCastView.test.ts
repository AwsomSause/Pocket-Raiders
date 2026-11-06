import { describe, expect, it } from 'vitest';
import { castDatabase } from '../../src/core/story2/castView';
import { freshProfileStory } from '../../src/core/story2/schema';
import { content } from './helpers';

const data = content.storyData;
const ch = data.characters[0]!;
const profile = (cast: Record<string, { tellings: string[]; wins: number; losses: number; runs: string[] }>) => ({ story: { ...freshProfileStory(), cast } });

describe('character database view', () => {
  it('hides everyone not met and counts the total from the data', () => {
    const d = castDatabase(data, profile({}));
    expect(d.entries).toEqual([]);
    expect(d).toMatchObject({ met: 0, total: data.characters.length, complete: 0 });
  });
  it('shows a met character with record, tellings left, and ??? for biography tiers not earned yet', () => {
    const d = castDatabase(data, profile({ [ch.id]: { tellings: ['x:friend'], wins: 5, losses: 3, runs: ['r1'] } }));
    const e = d.entries[0]!;
    expect(e.name).toBe(data.text[ch.nameKey]);
    expect(e.record).toBe('W 5  L 3');
    expect(e.runs).toBe(1);
    expect(e.tellings[0]).toBe('Friend');
    if (ch.bio.some((b) => b.tier > 1)) expect(e.bio).toContain('???');
    expect(e.complete).toBe(false);
  });
  it('a record for a character that no longer exists is skipped', () => {
    const d = castDatabase(data, profile({ ghost_id: { tellings: [], wins: 0, losses: 0, runs: ['r1'] } }));
    expect(d.met).toBe(0);
  });
});
