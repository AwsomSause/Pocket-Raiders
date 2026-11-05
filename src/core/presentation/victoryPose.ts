// S250 Victory poses: a pose for the winner picked from its types and weight, so a Fire Pokémon flares, a Water
// Pokémon splashes, a heavy one stomps. Pure data; the tweens are in ui/battleFx/spectacle.ts. Presentation only.

export type VictoryPose = 'hop' | 'flare' | 'splash' | 'spin' | 'stomp' | 'flip' | 'zap' | 'sparkle';

/** Types that decide the pose, strongest match first. The first type of the Pokémon that has a pose wins. */
const BY_TYPE: Record<string, VictoryPose> = {
  fire: 'flare',
  water: 'splash',
  ice: 'splash',
  flying: 'spin',
  psychic: 'spin',
  ghost: 'spin',
  dragon: 'spin',
  ground: 'stomp',
  rock: 'stomp',
  steel: 'stomp',
  fighting: 'flip',
  bug: 'flip',
  electric: 'zap',
  fairy: 'sparkle',
  grass: 'sparkle',
};

/** Heavy Pokémon (kg) stomp whatever their type. */
export const HEAVY_KG = 150;

export function victoryPoseFor(types: readonly string[], weightKg?: number): VictoryPose {
  if (weightKg !== undefined && weightKg >= HEAVY_KG) return 'stomp';
  for (const t of types) {
    const pose = BY_TYPE[t];
    if (pose) return pose;
  }
  return 'hop';
}
