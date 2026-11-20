// DOMINION D30: whether the job moments and the morning paper play, and whether the Boss order cut-in plays.
// D27 adds the real "Cut-ins: Show / Skip" row (settings.expansion.dominionFx, read through core/dominion/fx.ts
// fxOf(settings).cutIns); whichever of D27 and D30 merges second points `cutInsOn` at it. Until then the cut-in
// follows the game's own switches: Disable all animations or Battle motion Off skip it.

import type { Settings } from '../../../../core/state';

/** The Boss order cut-in plays (else Do it goes straight to what comes next). */
export function cutInsOn(s: Settings): boolean {
  return !s.disableAllAnimations && s.battleAnimations !== 'off';
}

/** The result pages and the paper hold still (no slam, no slide). */
export function stillFx(s: Settings): boolean {
  return !cutInsOn(s) || s.battleAnimations === 'reduced' || s.animationIntensity === 'reduced';
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
