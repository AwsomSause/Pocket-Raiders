// DOMINION D30: whether the job moments and the morning paper play, and whether the Boss order cut-in plays.
// Both follow D27's Settings · Dominion effects (core/dominion/fx.ts fxOf): its "Cut-ins: Show / Skip" row and preset,
// capped by the game's own Motion settings (Disable all animations or Battle motion Off mean Calm, which skips it).

import { fxOf } from '../../../../core/dominion/fx';
import type { Settings } from '../../../../core/state';

/** The Boss order cut-in plays (else Do it goes straight to what comes next). */
export function cutInsOn(s: Settings): boolean {
  return fxOf(s).cutIns;
}

/** The result pages and the paper hold still (no slam, no slide). */
export function stillFx(s: Settings): boolean {
  return fxOf(s).level !== 'full' || !cutInsOn(s) || s.animationIntensity === 'reduced';
}

/**
 * The job moments and the morning paper are on. A browser driven by automation (the Playwright tests) keeps the
 * older flow unless it asks with `?moments=1` (the older Dominion specs read the notice line after Do it and expect
 * the Morning straight after the night), the same way `?ui=new` opts into the New look.
 */
export function momentsOn(): boolean {
  if (typeof location === 'undefined') return true;
  const q = new URLSearchParams(location.search).get('moments');
  if (q === '1' || q === '0') return q === '1';
  return !(typeof navigator !== 'undefined' && navigator.webdriver);
}
