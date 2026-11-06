// S240 Dynamic battle camera: which camera move a big moment gets. Pure and presentation-only: it never reads or
// changes the battle, uses no gameplay RNG, and does nothing under reduced motion or "off".

export type CameraMode = 'off' | 'subtle' | 'cinematic';
export const CAMERA_MODES: readonly CameraMode[] = ['off', 'subtle', 'cinematic'];

export interface CameraMoment {
  type: string;
  side?: 'player' | 'enemy';
  crit?: boolean;
  effectiveness?: number;
  /** The foe is the boss's last Pokémon (its ace). */
  bossAce?: boolean;
}

export interface CameraShot {
  /** Camera zoom while the shot holds (1 = normal). */
  zoom: number;
  /** How long the push-in takes, in ms (the pull-back takes the same). */
  moveMs: number;
  /** How long the shot holds before it pulls back. */
  holdMs: number;
  /** Pixels the framing shifts up so the target sits a little above the centre. */
  lift: number;
}

/** The shot for a moment, or null for no camera move. */
export function cameraShot(mode: CameraMode, m: CameraMoment, motion: 'full' | 'reduced' | 'off'): CameraShot | null {
  if (mode === 'off' || motion !== 'full') return null;
  const big = mode === 'cinematic';
  if (m.type === 'faint') {
    if (m.side === 'enemy') return { zoom: m.bossAce ? 1.4 : big ? 1.28 : 1.12, moveMs: big ? 320 : 220, holdMs: m.bossAce ? 520 : 300, lift: 30 };
    return big ? { zoom: 0.94, moveMs: 260, holdMs: 240, lift: 0 } : null;
  }
  if (m.type === 'damage' && m.crit) return { zoom: big ? 1.2 : 1.07, moveMs: big ? 200 : 140, holdMs: big ? 260 : 160, lift: 20 };
  if (m.type === 'damage' && big && (m.effectiveness ?? 1) >= 2) return { zoom: 1.1, moveMs: 160, holdMs: 140, lift: 10 };
  return null;
}
