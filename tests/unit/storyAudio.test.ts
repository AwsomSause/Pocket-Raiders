import { describe, expect, it } from 'vitest';
import { FIXED_ASSETS } from '../../src/assets/catalog';
import { audioBudgetProblems, crossfadePlan, nextBarLineMs, STORY_MUSIC, storyAssetId, storyTrack, type StoryTrack } from '../../src/core/storyAudio';

const catalog = new Set(FIXED_ASSETS.filter((a) => a.kind === 'audio').map((a) => a.id));
const count = (pred: (t: StoryTrack) => boolean) => STORY_MUSIC.tracks.filter(pred).length;

describe('story audio (S17)', () => {
  it('lists the Part AD music: 48 leitmotifs, 18 team themes, 9 region tracks, 14 battle themes, 12 stingers, opening and quiz stems', () => {
    expect(count((t) => t.group === 'leitmotif')).toBe(48);
    expect(count((t) => t.group === 'team')).toBe(18);
    expect(count((t) => t.group === 'region')).toBe(9);
    expect(count((t) => t.group === 'battle')).toBe(14);
    expect(count((t) => t.group === 'stinger')).toBe(12);
    expect(count((t) => t.group === 'opening' || t.group === 'quiz')).toBe(4);
    expect(count((t) => t.kind === 'sfx')).toBe(34);
  });

  it('passes the audio budget gate: every reuse sound exists and nothing is over budget', () => {
    expect(audioBudgetProblems(catalog)).toEqual([]);
  });

  it('the gate catches a missing sound, a duplicate id, a made loop without loop points and an overlong stinger', () => {
    const bad = {
      ...STORY_MUSIC,
      tracks: [
        { id: 'mu_a', kind: 'loop', group: 'x', lengthSec: 60, source: 'reuse', reuse: 'bgm.nope' },
        { id: 'mu_a', kind: 'loop', group: 'x', lengthSec: 60, source: 'original', asset: 'bgm.menu', composer: 'A', licence: 'own', reuse: 'bgm.menu', loopStartMs: null, loopEndMs: null },
        { id: 'st_long', kind: 'oneShot', group: 'stinger', lengthSec: 20, source: 'reuse', reuse: 'me.badge' },
      ] as StoryTrack[],
    };
    const lines = audioBudgetProblems(catalog, bad).join('\n');
    expect(lines).toContain('bgm.nope');
    expect(lines).toContain('duplicate id');
    expect(lines).toContain('loop points');
    expect(lines).toContain('1 to 8 seconds');
  });

  it('plays the reuse sound until a real file exists', () => {
    expect(storyAssetId('mu_battle_rival_a')).toBe('bgm.battle_rival');
    expect(storyAssetId('st_news')).toBe('ui.page');
    expect(storyAssetId('mu_unknown')).toBeNull();
    expect(storyTrack('st_tip')?.lengthSec).toBe(1);
  });

  it('cross-fades arrangements of one motif at the next bar line, and nothing else', () => {
    expect(nextBarLineMs(5000, 2000)).toBe(6000);
    expect(nextBarLineMs(6000, 2000)).toBe(6000);
    expect(crossfadePlan('mu_lm_ch_dara_calm', 'mu_lm_ch_dara_tense', 5000, 2000)).toEqual({ startMs: 6000, fadeMs: 2000 });
    expect(crossfadePlan('mu_lm_ch_dara_calm', 'mu_lm_ch_hale_tense', 5000, 2000)).toBeNull();
    expect(crossfadePlan('mu_lm_ch_dara_calm', 'se_page_flip', 5000, 2000)).toBeNull();
    expect(crossfadePlan('mu_quiz_lab_base', 'mu_quiz_lab_think', 100, 1000)).toEqual({ startMs: 1000, fadeMs: 2000 });
  });
});
