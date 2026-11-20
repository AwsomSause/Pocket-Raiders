// Readable mobile fallback (catalog #125): when to show the on-screen pad and the rotate hint. Pure.

export interface Viewport {
  width: number;
  height: number;
  /** True for touch-first devices (pointer: coarse). */
  coarse: boolean;
}

/** The pad appears on touch devices and on narrow windows, where there is no keyboard to rely on. */
export function showTouchPad(v: Viewport): boolean {
  return v.coarse || v.width < 700;
}

/**
 * Where the pad goes. `side`: a landscape touch screen keeps the full-height canvas and floats the pad over
 * its two corners (the letterbox bars on wide phones). `bottom`: portrait or narrow windows reserve a strip.
 */
export function padMode(v: Viewport, buttons = true): 'off' | 'side' | 'bottom' {
  // Settings > Phone > Touch buttons: off hides the pad everywhere.
  if (!buttons || !showTouchPad(v)) return 'off';
  return v.coarse && v.width > v.height && v.height <= 600 ? 'side' : 'bottom';
}

/** Portrait phones get a hint: the 16:9 game is much larger when the phone is turned. */
export function showRotateHint(v: Viewport): boolean {
  return v.width < 600 && v.height > v.width;
}

/** The canvas keeps 16:9; this is its on-screen width at the viewport (the pad takes `padHeight` from the height). */
export function canvasWidth(v: Viewport, padHeight: number): number {
  return Math.floor(Math.min(v.width, (v.height - padHeight) * (16 / 9)));
}

/** Text is kept readable if the canvas is at least this wide (the game's smallest text is ~16 px at 960 wide). */
export const MIN_READABLE_CANVAS = 480;

// --- Phone settings (settings v47) --------------------------------------------------------------------------------

/** Settings > Phone > Touch button size: how much bigger or smaller the pad is drawn. */
export const TOUCH_SIZE: Record<'small' | 'medium' | 'large', number> = { small: 0.8, medium: 1, large: 1.25 };

/** A swipe is a quick, mostly sideways stroke of one finger: at least this far, in at most this long. */
export const SWIPE_MIN_PX = 56;
export const SWIPE_MAX_MS = 600;

/** Which way a finger's stroke went as a swipe, or null when it was a tap, a slow drag or an up-and-down scroll. A stroke to the left asks for the next one. */
export function swipeOf(dx: number, dy: number, ms: number): 'next' | 'prev' | null {
  if (!(ms >= 0) || ms > SWIPE_MAX_MS || Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < Math.abs(dy) * 2) return null;
  return dx < 0 ? 'next' : 'prev';
}

/** A finger that rested this long was reading (Hold for details): the tap that ends it does not also press the button. */
export const HOLD_MS = 450;
