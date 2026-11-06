// S242 Parallax map layers: how far each map layer slides for a pointer position. Pure and presentation-only.

/** Layers from far to near: the nearer the layer, the more it slides. */
export const PARALLAX_DEPTH = { scenery: 0.25, landmark: 0.5, air: 0.75, ground: 1 } as const;
export type ParallaxLayer = keyof typeof PARALLAX_DEPTH;
/** The most a layer moves, in pixels, at depth 1. */
export const PARALLAX_RANGE = 22;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Pointer position as -1..1 across the screen (0 is the centre). */
export const pointerShare = (pos: number, size: number): number => (size > 0 ? clamp((pos / size) * 2 - 1, -1, 1) : 0);

/** Offset in pixels for a layer; zero when off or under reduced motion. Layers move against the pointer, like looking around. */
export function parallaxOffset(enabled: boolean, motion: 'full' | 'reduced' | 'off', share: number, layer: ParallaxLayer): number {
  if (!enabled || motion !== 'full') return 0;
  return -clamp(share, -1, 1) * PARALLAX_RANGE * PARALLAX_DEPTH[layer];
}
