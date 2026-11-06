// Story Overhaul icon pack (slice P7): 107 generated 32x32 icons (the trophy is 48x48), imported by
// tools/import-story-icons.mjs into images/packs/story/<group>/<slug>.png. No runtime imports (the Node tools use this).
// Later slices look icons up here: emote bubbles (S16), Heartbond hearts + snacks + keepsakes (S6), badges (S9).

export const EMOTES = [
  'anger', 'broken_heart', 'clover', 'dizzy_spiral', 'double_note', 'ellipsis', 'exclaim_question', 'exclamation', 'flame', 'frown',
  'gift', 'gloom_cloud', 'heart', 'hourglass', 'hungry', 'lightbulb', 'music_note', 'nervous_sweat', 'paw', 'question',
  'shield', 'shocked', 'smile', 'snot_bubble', 'sparkle', 'star', 'sweat_drop', 'teardrop', 'thumbs_up', 'zzz',
] as const;
export const TONES = ['curious', 'firm', 'humor', 'warm'] as const;
export const SNACKS = [
  'bitter_herb_tea', 'dried_berry_pack', 'fruit_tart', 'honey_puff', 'mushroom_skewer', 'nut_bar',
  'rice_ball', 'sour_candy', 'spice_biscuit', 'strange_jelly', 'sweet_berry', 'warm_bun',
] as const;
export const HEART_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export const ELITE_TOKENS = [1, 2, 3, 4] as const;
/** One badge per type: the 24 gym towns (8 per region) reuse these by the leader's type. */
export const BADGE_TYPES = [
  'bug', 'dark', 'dragon', 'electric', 'fairy', 'fighting', 'fire', 'flying', 'ghost',
  'grass', 'ground', 'ice', 'normal', 'poison', 'psychic', 'rock', 'steel', 'water',
] as const;
export const KEEPSAKES = [
  'bandana', 'bell_collar', 'bowtie', 'cape', 'charm_necklace', 'feather', 'flower_crown', 'flower_pin', 'glasses', 'goggles',
  'headband', 'leaf_crown', 'medal', 'monocle', 'party_hat', 'ribbon_bow', 'satchel', 'scarf', 'star_pin', 'tiny_hat',
] as const;
export const BALL_EXIT_FX = ['electric_spark', 'flame_burst', 'leaf_swirl', 'ring_pulse', 'shadow_smoke', 'sparkle_burst', 'star_swirl', 'water_splash'] as const;

export type StoryIconGroup = 'emote' | 'tone' | 'snack' | 'heart' | 'elite' | 'trophy' | 'badge' | 'keepsake' | 'ballfx';

const GROUPS: Record<StoryIconGroup, readonly (string | number)[]> = {
  emote: EMOTES, tone: TONES, snack: SNACKS, heart: HEART_LEVELS, elite: ELITE_TOKENS, trophy: ['champion'],
  badge: BADGE_TYPES, keepsake: KEEPSAKES, ballfx: BALL_EXIT_FX,
};

/** Catalog id: `icon.emote.heart`, `icon.heart.7`, `icon.badge.fire`, `icon.trophy.champion`. */
export const storyIconId = (group: StoryIconGroup, name: string | number): string => `icon.${group}.${name}`;
/** Bond heart for a Heartbond level (clamped to 1-10). */
export const heartIconId = (level: number): string => storyIconId('heart', Math.min(10, Math.max(1, Math.round(level))));
/** Gym badge for a leader's type; null when the type has no badge. */
export const badgeIconId = (type: string): string | null => ((BADGE_TYPES as readonly string[]).includes(type.toLowerCase()) ? storyIconId('badge', type.toLowerCase()) : null);

/** Whole-number scale for a 32 px icon (48 px trophy): pixel art stays sharp, never below 1x. */
export const storyIconScale = (targetPx: number, sourcePx = 32): number => Math.max(1, Math.round(targetPx / sourcePx));

export interface StoryIconEntry { id: string; group: StoryIconGroup; name: string; path: string; size: number }
export const STORY_ICONS: StoryIconEntry[] = (Object.entries(GROUPS) as [StoryIconGroup, readonly (string | number)[]][]).flatMap(([group, names]) =>
  names.map((n) => ({ id: storyIconId(group, n), group, name: String(n), path: `images/packs/story/${group}/${n}.png`, size: group === 'trophy' ? 48 : 32 })),
);
