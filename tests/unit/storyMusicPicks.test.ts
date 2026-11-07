// Story Run music and emote picks (Part AD): story regions and Evil Teams map to their own story music ids, which resolve to
// distinct existing songs; every care emote has an icon.
import { describe, expect, it } from 'vitest';
import { STORY_ICONS, storyIconId } from '../../src/assets/storyIcons';
import { CARE_ACTIONS } from '../../src/core/care';
import { careEmote, storyRegionTrack, storyTeamTrack } from '../../src/core/presentation/storyMusic';
import { storyAssetId } from '../../src/core/storyAudio';
import { content } from './helpers';

describe('story music picks', () => {
  it('the three story regions each get their own route song; other regions get none', () => {
    const songs = ['cairnmoor', 'tidewrack-reaches', 'orrery-basin'].map((r) => storyAssetId(storyRegionTrack(r)!));
    expect(new Set(songs).size).toBe(3);
    expect(storyRegionTrack('kanto')).toBeNull();
  });

  it('every story Evil Team has a tense and a final song, and the six teams sound apart', () => {
    const story = ['marauders', 'choir', 'ironvein', 'cartographers', 'wildfire', 'gilt'];
    for (const t of story) expect(content.evilTeams.teams.some((x) => x.id === t), t).toBe(true);
    const finals = story.map((t) => storyAssetId(storyTeamTrack(t, 'leader')!));
    expect(new Set(finals).size).toBe(6);
    expect(storyTeamTrack('marauders', 'grunt')).toMatch(/_tense$/);
    expect(storyTeamTrack('rocket', 'leader')).toBeNull();
  });

  it('every care emote is an icon in the story pack; a feed shows how the berry went down', () => {
    const ids = new Set(STORY_ICONS.map((i) => i.id));
    for (const a of CARE_ACTIONS) {
      const e = careEmote(a, 'neutral');
      if (e) expect(ids.has(storyIconId('emote', e)), `${a} -> ${e}`).toBe(true);
    }
    expect([careEmote('feed', 'liked'), careEmote('feed', 'hated')]).toEqual(['heart', 'frown']);
  });
});
