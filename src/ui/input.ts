// Keyboard controls shared by every screen.
//   Arrows / WASD : move        Enter / Space / Z : confirm        Esc / X / Backspace : back

import type Phaser from 'phaser';
import { InputBuffer } from '../core/inputBuffer';
import { services } from '../game/services';

/** Beta 4.4 skip guard: how long a new screen ignores confirm/back presses (ms). */
export const SKIP_GUARD_MS = 250;

function guardOn(): boolean {
  try {
    return services().session.settings.skipGuard !== false;
  } catch {
    return true;
  }
}

/** Whether the skip guard swallows this press: a held (repeating) key or a press right after the screen opened. Pure. */
export function guarded(action: InputAction, repeat: boolean, sinceOpenMs: number, on: boolean): boolean {
  if (!on || (action !== 'confirm' && action !== 'back')) return false;
  return repeat || sinceOpenMs < SKIP_GUARD_MS;
}

export type InputAction = 'up' | 'down' | 'left' | 'right' | 'confirm' | 'back';

const KEY_MAP: Record<string, InputAction> = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  Enter: 'confirm', NumpadEnter: 'confirm', Space: 'confirm', KeyZ: 'confirm',
  Escape: 'back', KeyX: 'back', Backspace: 'back',
};

const buffer = new InputBuffer<InputAction>();
let handled = false;
let watching = false;

/** One window-level watcher: a press that no screen handled is kept for the next screen (#122). */
function watchDroppedKeys(): void {
  if (watching || typeof window === 'undefined') return;
  watching = true;
  window.addEventListener(
    'keydown',
    (event) => {
      const action = KEY_MAP[event.code];
      if (!action || event.repeat) return;
      handled = false;
      setTimeout(() => {
        if (!handled) buffer.drop(action, performance.now());
      }, 0);
    },
    true,
  );
}

/** Calls `handler` with a game action for each key press while the scene is running. */
export function onInputAction(scene: Phaser.Scene, handler: (action: InputAction) => void): void {
  const keyboard = scene.input.keyboard;
  if (!keyboard) return;
  const listener = (event: KeyboardEvent) => {
    // Let the debug panel's text boxes receive typing.
    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA')) return;
    const action = KEY_MAP[event.code];
    if (action) {
      handled = true;
      if (guarded(action, event.repeat, performance.now() - opened, guardOn())) return;
      handler(action);
    }
  };
  const opened = performance.now();
  watchDroppedKeys();
  keyboard.on('keydown', listener);
  const kept = buffer.take(performance.now());
  // A confirm/back pressed during the change of screen is not replayed into the new one while the guard is on.
  if (kept && !guarded(kept, false, 0, guardOn())) setTimeout(() => handler(kept), 0);
  scene.events.once('shutdown', () => keyboard.off('keydown', listener));
}
