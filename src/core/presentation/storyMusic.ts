// Story Run music and emote picks (Design v2 Part AD): the story music id an Evil Team battle uses (BattleScene plays it through
// ui/audio storyOr once its real file exists) and the emote icon a care action shows. Presentation only.

import { storyTrack } from '../storyAudio';

/** Evil Team ids (evilTeams.json) to the story audio team keys. */
const TEAM_KEYS: Record<string, string> = {
  marauders: 'mythic_marauders', choir: 'hollow_choir', ironvein: 'ironvein_combine', cartographers: 'pale_cartographers', wildfire: 'wildfire_accord', gilt: 'gilt_circle',
};

/** The story music id for an Evil Team battle: 'final' for the team's leader, 'tense' for grunts and admins; null for other teams. */
export function storyTeamTrack(teamId: string, rank: string): string | null {
  const key = TEAM_KEYS[teamId];
  const id = key ? `mu_team_${key}_${rank === 'leader' ? 'final' : 'tense'}` : null;
  return id && storyTrack(id) ? id : null;
}

/** Story emote icon (assets/storyIcons EMOTES) a care action shows over the Pokemon; a feed shows how the snack went down. */
export function careEmote(action: string, snack: 'liked' | 'neutral' | 'hated' | null): string | null {
  if (action === 'feed') return snack === 'liked' ? 'heart' : snack === 'hated' ? 'frown' : 'smile';
  const map: Record<string, string> = {
    pet: 'smile', hug: 'heart', embrace: 'heart', groom: 'sparkle', lullaby: 'zzz', cheer: 'music_note', train: 'flame', spar: 'flame', sing: 'music_note',
    singalong: 'double_note', teamdance: 'double_note', dress: 'sparkle', fetch: 'paw', story: 'lightbulb', wake: 'exclamation', showoff: 'star', hold: 'heart',
    race: 'flame', healcircle: 'clover', birthday: 'gift', praise: 'thumbs_up', scold: 'sweat_drop', cry: 'teardrop',
  };
  return map[action] ?? null;
}
