// S259 Retro CRT filter and S260 crit letterbox numbers. Pure data; the DOM and Phaser code lives in ui/display.ts and BattleScene.

import type { Settings } from '../state';

export interface CrtLook {
  /** CSS background for the scanline layer. */
  scanlines: string;
  /** CSS box-shadow that darkens the edges like curved glass. */
  vignette: string;
  /** Corner rounding in px. */
  radius: number;
}

/** `null` when the filter is off. Scanline gap is 3px; Full is darker and more curved. */
export function crtLook(level: Settings['crtFilter']): CrtLook | null {
  if (level === 'off') return null;
  const full = level === 'full';
  const a = full ? 0.28 : 0.14;
  return {
    scanlines: `repeating-linear-gradient(to bottom, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 1px, rgba(0,0,0,${a}) 2px, rgba(0,0,0,0) 3px)`,
    vignette: full ? 'inset 0 0 90px 24px rgba(0,0,0,0.65)' : 'inset 0 0 50px 8px rgba(0,0,0,0.4)',
    radius: full ? 36 : 14,
  };
}

/** Letterbox bar height as a share of the screen, and how long the bars hold, by animation speed. Null = skip it. */
export function letterboxPlan(enabled: boolean, motion: 'full' | 'reduced' | 'off'): { barShare: number; slideMs: number; holdMs: number } | null {
  if (!enabled || motion !== 'full') return null;
  return { barShare: 0.11, slideMs: 160, holdMs: 260 };
}
