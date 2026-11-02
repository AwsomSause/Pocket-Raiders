// Display settings that act on the whole page rather than one scene: high contrast, interface size and
// whether sprites animate. Presentation only; no outcome depends on them.

import Phaser from 'phaser';
import type { Settings } from '../core/state';
import { crtLook } from '../core/presentation/crtFilter';

const SCALE: Record<Settings['uiScale'], number> = { full: 1, medium: 0.9, small: 0.8 };
let animated = true;
let resizeBound = false;
let lastCrt: Settings['crtFilter'] = 'off';

/** Whether menu icons and idle Pokémon may animate (Settings > Sprite animations). */
export const spritesAnimate = (): boolean => animated;

/** Applies the display settings to the game canvas. Safe to call often. */
export function applyDisplaySettings(game: Phaser.Game, settings: Settings): void {
  animated = settings.spriteAnimations;
  const canvas = game.canvas;
  if (!canvas) return;
  canvas.style.filter = settings.highContrast ? 'contrast(1.3) saturate(1.15)' : '';
  const scale = SCALE[settings.uiScale];
  const parent = canvas.parentElement;
  if (parent) {
    parent.style.display = 'flex';
    parent.style.alignItems = 'center';
    parent.style.justifyContent = 'center';
  }
  applyCrt(canvas, settings.crtFilter);
  if (!resizeBound) {
    resizeBound = true;
    window.addEventListener('resize', () => applyCrt(canvas, lastCrt));
  }
  canvas.style.transform = scale === 1 ? '' : `scale(${scale})`;
}

/** The CRT overlay: one non-interactive div over the canvas. Removed when the filter is off. */
function applyCrt(canvas: HTMLCanvasElement, level: Settings['crtFilter']): void {
  lastCrt = level;
  const look = crtLook(level);
  const id = 'crt-overlay';
  document.getElementById(id)?.remove();
  if (!look) return;
  const rect = canvas.getBoundingClientRect();
  const el = document.createElement('div');
  el.id = id;
  Object.assign(el.style, {
    position: 'fixed', left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`,
    pointerEvents: 'none', zIndex: '50', backgroundImage: look.scanlines, boxShadow: look.vignette, borderRadius: `${look.radius}px`,
  });
  document.body.appendChild(el);
}
