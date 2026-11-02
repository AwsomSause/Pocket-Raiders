// Portrait phones: the 16:9 game is turned 90° to fill the tall screen (about twice as large as a letterboxed
// strip), like a phone held sideways. A CSS rotation of #game plus two Phaser patches: the parent size is read
// from the unrotated layout box, and pointer positions are mapped back through the rotation. Presentation only.

import type Phaser from 'phaser';
import { GAME_WIDTH } from './theme';

const PAD_PX = 120;

export const wantsRotation = (w: number, h: number, coarse: boolean): boolean => coarse && h > w;

/** Screen point to the rotated box's own (layout) space: the box is turned 90° clockwise about its top-left corner after moving right by the viewport width. */
export function toLayout(sx: number, sy: number, viewportWidth: number): { x: number; y: number } {
  return { x: sy, y: viewportWidth - sx };
}

export function installPortraitRotate(game: Phaser.Game): void {
  if (typeof document === 'undefined') return;
  const sm = game.scale;
  const canvas = game.canvas;
  const parent = document.getElementById('game');
  if (!parent || !canvas) return;
  let rotated = false;
  let stash: { x: number; y: number } | null = null;

  const origBounds = sm.getParentBounds.bind(sm);
  sm.getParentBounds = () => {
    if (!rotated) return origBounds();
    const w = parent.clientWidth, h = parent.clientHeight;
    if (sm.parentSize.width !== w || sm.parentSize.height !== h) {
      sm.parentSize.setSize(w, h);
      return true;
    }
    return false;
  };
  const origX = sm.transformX.bind(sm), origY = sm.transformY.bind(sm);
  sm.transformX = (pageX: number) => (rotated && stash ? ((stash.x - canvas.offsetLeft) * GAME_WIDTH) / Math.max(1, canvas.offsetWidth) : origX(pageX));
  sm.transformY = (pageY: number) => (rotated && stash ? ((stash.y - canvas.offsetTop) * (game.scale.gameSize.height)) / Math.max(1, canvas.offsetHeight) : origY(pageY));
  const origPointer = game.input.transformPointer.bind(game.input);
  game.input.transformPointer = (pointer, pageX, pageY, wasMove) => {
    stash = rotated ? toLayout(pageX, pageY, window.innerWidth) : null;
    origPointer(pointer, pageX, pageY, wasMove);
  };

  const update = () => {
    const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    const on = wantsRotation(window.innerWidth, window.innerHeight, coarse);
    if (on !== rotated) {
      rotated = on;
      document.body.classList.toggle('rot-portrait', on);
    }
    document.documentElement.style.setProperty('--vw', `${window.innerWidth}px`);
    document.documentElement.style.setProperty('--pad', `${PAD_PX}px`);
    sm.getParentBounds();
    sm.refresh();
  };
  window.addEventListener('resize', update);
  window.addEventListener('orientationchange', update);
  update();
}
