// Sprite poses and emote bubbles for story moments. Pure mapping from a moment's category (and
// family) to what the Pokémon on screen does. Presentation only: no RNG, never touches battle state.

export type MomentCategory = 'survival' | 'bond' | 'emotion' | 'rivalry' | 'enemy' | 'evolution' | 'legacy' | 'flavour';
export type PoseKind = 'hop' | 'rear' | 'lean' | 'tremble' | 'glow' | 'bow';
export type EmoteKind = 'bang' | 'heart' | 'dots' | 'question' | 'anger' | 'spark' | 'sweat' | 'note';

export interface MomentPose {
  pose: PoseKind;
  emote: EmoteKind;
}

/** The plain-character look of each emote bubble (no emoji font needed) and its colour. */
export const EMOTES: Record<EmoteKind, { text: string; color: string }> = {
  bang: { text: '!', color: '#ffe060' },
  heart: { text: '♥', color: '#ff7aa8' },
  dots: { text: '...', color: '#c8d0e0' },
  question: { text: '?', color: '#9fd8ff' },
  anger: { text: '#!', color: '#ff8a70' },
  spark: { text: '*', color: '#fff0a0' },
  sweat: { text: ';', color: '#9fd8ff' },
  note: { text: '♪', color: '#b8ffb0' },
};

const BY_CATEGORY: Record<MomentCategory, MomentPose> = {
  survival: { pose: 'rear', emote: 'bang' },
  bond: { pose: 'lean', emote: 'heart' },
  emotion: { pose: 'bow', emote: 'dots' },
  rivalry: { pose: 'tremble', emote: 'anger' },
  enemy: { pose: 'rear', emote: 'anger' },
  evolution: { pose: 'glow', emote: 'spark' },
  legacy: { pose: 'bow', emote: 'dots' },
  flavour: { pose: 'hop', emote: 'note' },
};

/** What the Pokémon does for a moment of this category. Hyper moments stand tall; Overdrive ones shake with power. */
export function poseForMoment(category: MomentCategory, family?: 'hyper' | 'overdrive'): MomentPose {
  if (family === 'hyper') return { pose: 'glow', emote: category === 'bond' ? 'heart' : 'spark' };
  if (family === 'overdrive') return { pose: 'tremble', emote: 'anger' };
  return BY_CATEGORY[category];
}

/** One pose for a cue that merged several moments: the first one decides. */
export function poseForMoments(defs: { category: MomentCategory; family?: 'hyper' | 'overdrive' }[]): MomentPose | null {
  const first = defs[0];
  return first ? poseForMoment(first.category, first.family) : null;
}
