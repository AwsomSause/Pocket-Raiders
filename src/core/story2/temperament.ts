// The 16 Core Temperaments (design Part II-C): the story layer over the 58 repo personalities.
// Every personality maps to exactly one Temperament; a test fails the build if one is added without a mapping.
// Mapping rule for a new personality: pick the Temperament whose arc fits the emotional need (what raises its bond);
// when two fit, pick the one with fewer members.

export const TEMPERAMENTS = {
  tm_brave: ['brave', 'bold', 'daring', 'tough'],
  tm_timid: ['timid', 'anxious', 'superstitious'],
  tm_mischievous: ['mischievous', 'sly', 'goofy'],
  tm_curious: ['curious', 'adventurous', 'mysterious'],
  tm_stubborn: ['stubborn', 'grumpy', 'fussy', 'moody'],
  tm_affectionate: ['affectionate', 'gentle', 'soft-hearted', 'clingy', 'romantic', 'nostalgic'],
  tm_independent: ['independent', 'aloof', 'rebellious'],
  tm_competitive: ['competitive', 'proud', 'showy', 'perfectionist'],
  tm_protective: ['protective', 'loyal', 'noble', 'honorable'],
  tm_lazy: ['lazy', 'dreamy', 'zen', 'calm'],
  tm_energetic: ['cheerful', 'sunny', 'earnest'],
  tm_intelligent: ['scholarly', 'wise', 'scheming'],
  tm_shy: ['shy', 'sensitive', 'humble'],
  tm_reckless: ['reckless', 'aggressive', 'hot-headed', 'wild'],
  tm_playful: ['playful', 'dramatic', 'foodie', 'friendly'],
  tm_serious: ['serious', 'stoic', 'patient'],
} as const satisfies Record<string, readonly string[]>;

export type TemperamentId = keyof typeof TEMPERAMENTS;

export const TEMPERAMENT_NAMES: Record<TemperamentId, string> = {
  tm_brave: 'Brave', tm_timid: 'Timid', tm_mischievous: 'Mischievous', tm_curious: 'Curious', tm_stubborn: 'Stubborn',
  tm_affectionate: 'Affectionate', tm_independent: 'Independent', tm_competitive: 'Competitive', tm_protective: 'Protective',
  tm_lazy: 'Lazy', tm_energetic: 'Energetic', tm_intelligent: 'Intelligent', tm_shy: 'Shy', tm_reckless: 'Reckless',
  tm_playful: 'Playful', tm_serious: 'Serious',
};

const BY_PERSONALITY: ReadonlyMap<string, TemperamentId> = new Map(
  (Object.entries(TEMPERAMENTS) as [TemperamentId, readonly string[]][]).flatMap(([tm, ids]) => ids.map((id) => [id, tm] as const)),
);

/** The Core Temperament of a repo personality id, or undefined for an id nobody mapped. */
export const temperamentOf = (personalityId: string): TemperamentId | undefined => BY_PERSONALITY.get(personalityId);
