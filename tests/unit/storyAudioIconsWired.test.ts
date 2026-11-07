// The story sounds and icons the screens now use all exist (S17 audio ids resolve; every Keepsake has its icon).
import { describe, expect, it } from 'vitest';
import { STORY_ICONS, heartIconId, storyIconId } from '../../src/assets/storyIcons';
import { KEEPSAKES } from '../../src/core/story2/keepsakes';
import { storyAssetId } from '../../src/core/storyAudio';

const USED_AUDIO = ['se_page_flip', 'se_choice_hover', 'se_choice_confirm', 'se_error', 'se_heartbond_tick', 'st_feat', 'st_tip', 'mu_battle_rival_a', 'mu_quiz_lab_base'];

describe('story audio and icons in use', () => {
  it('every story audio id the screens play resolves to a catalog sound', () => {
    for (const id of USED_AUDIO) expect(storyAssetId(id), id).toBeTruthy();
  });
  it('every Keepsake, the first Heartbond heart and the exclamation emote have icons', () => {
    const ids = new Set(STORY_ICONS.map((i) => i.id));
    for (const k of KEEPSAKES) expect(ids.has(storyIconId('keepsake', k.id.replace(/^kp_/, ''))), k.id).toBe(true);
    expect(ids.has(heartIconId(1))).toBe(true);
    expect(ids.has(storyIconId('emote', 'exclamation'))).toBe(true);
  });
});
