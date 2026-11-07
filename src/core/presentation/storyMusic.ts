// Story Run music picks (Design v2 Part AD): which story music id a Story Run map or Evil Team battle uses. Presentation only; the
// sound itself comes from ui/audio.ts playStoryMusic, which resolves the id through core/storyAudio.ts.

import { storyTrack } from '../storyAudio';

/** Story region ids (regionIdentity.ts) to the story audio region keys. */
const REGION_KEYS: Record<string, string> = { cairnmoor: 'cairnmoor', 'tidewrack-reaches': 'tidewrack', 'orrery-basin': 'orrery_basin' };
/** Evil Team ids (evilTeams.json) to the story audio team keys. */
const TEAM_KEYS: Record<string, string> = {
  marauders: 'mythic_marauders', choir: 'hollow_choir', ironvein: 'ironvein_combine', cartographers: 'pale_cartographers', wildfire: 'wildfire_accord', gilt: 'gilt_circle',
};

/** The story music id for a Story Run region's map ('route'), town or tension cue; null outside the three story regions. */
export function storyRegionTrack(regionId: string, kind: 'town' | 'route' | 'tension' = 'route'): string | null {
  const key = REGION_KEYS[regionId];
  const id = key ? `mu_region_${key}_${kind}` : null;
  return id && storyTrack(id) ? id : null;
}

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
