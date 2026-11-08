// Update splash: the first time a player loads a new version, a full-screen picture fades in over birdsong,
// holds about 15 seconds, then fades out into the game. It covers the loading screen and the main menu is skipped
// afterwards. Click or key skips it. Shown once per SPLASH_ID. Presentation only: no gameplay RNG, no save data.

import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './theme';

/** Bump this (and the image) for the next update's splash. */
export const SPLASH_ID = 'beta-0.5';
export const SPLASH_IMAGE = 'assets/images/ui/splash-beta-0.5.png';
export const SPLASH_BIRDS = 'assets/audio/ambience/amb-birds.mp3';
export const SPLASH_STORAGE_KEY = 'pkr.splashSeen';
export const SPLASH_TIMING = { fadeIn: 1500, total: 15000, fadeOut: 1500 } as const;

interface Env {
  seen: string | null;
  webdriver: boolean;
  search: string;
}

/** Pure: should the splash show? Automated browsers skip it unless ?splash=1; ?splash=0 always hides it. */
export function splashDue(env: Env, id: string = SPLASH_ID): boolean {
  if (env.search.includes('splash=0')) return false;
  if (env.search.includes('splash=1')) return true;
  if (env.webdriver) return false;
  return env.seen !== id;
}

export function readSplashEnv(): Env {
  let seen: string | null = null;
  try {
    seen = localStorage.getItem(SPLASH_STORAGE_KEY);
  } catch {
    /* storage unavailable: show it (once per page load) */
  }
  return { seen, webdriver: typeof navigator !== 'undefined' && Boolean(navigator.webdriver), search: typeof location !== 'undefined' ? location.search : '' };
}

export function markSplashSeen(id: string = SPLASH_ID): void {
  try {
    localStorage.setItem(SPLASH_STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}

export interface SplashHandle {
  /** Resolves once the splash has finished fading out (hold ended or skipped). */
  ended: Promise<void>;
}

/** Loads the picture and birdsong, then shows the splash over everything in `scene`. Never throws: a missing file just shortens it. */
export async function playUpdateSplash(scene: Phaser.Scene, audio: { muted: boolean; sfxVolume: number }): Promise<SplashHandle> {
  markSplashSeen();
  await new Promise<void>((resolve) => {
    scene.load.image('splash.update', SPLASH_IMAGE);
    scene.load.audio('splash.birds', SPLASH_BIRDS);
    scene.load.once('complete', () => resolve());
    scene.load.once('loaderror', () => undefined);
    scene.load.start();
  });
  const hasImage = scene.textures.exists('splash.update');
  const cx = GAME_WIDTH / 2;
  const cy = GAME_HEIGHT / 2;
  const root = scene.add.container(0, 0).setDepth(100000).setAlpha(0);
  root.add(scene.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000).setInteractive());
  if (hasImage) {
    const img = scene.add.image(cx, cy, 'splash.update');
    // The art is stored 3x (nearest-neighbour from 688x384) and shown whole, never cropped; smooth minifying keeps the pixel edges crisp.
    scene.textures.get('splash.update').setFilter(Phaser.Textures.FilterMode.LINEAR);
    img.setScale(Math.min(GAME_WIDTH / img.width, GAME_HEIGHT / img.height));
    root.add(img);
  }
  let birds: Phaser.Sound.BaseSound | null = null;
  if (!audio.muted && scene.cache.audio.exists('splash.birds')) {
    birds = scene.sound.add('splash.birds', { loop: true, volume: 0 });
    birds.play();
  }
  const setBirds = (k: number): void => (birds as (Phaser.Sound.BaseSound & { setVolume?: (v: number) => void }) | null)?.setVolume?.(0.5 * audio.sfxVolume * k);

  const ended = new Promise<void>((resolve) => {
    let leaving = false;
    const fadeOut = (): void => {
      if (leaving) return;
      leaving = true;
      scene.input.off('pointerdown', fadeOut);
      scene.input.keyboard?.off('keydown', fadeOut);
      const from = root.alpha;
      scene.tweens.addCounter({
        from: 1,
        to: 0,
        duration: SPLASH_TIMING.fadeOut * Math.max(from, 0.2),
        onUpdate: (t) => {
          root.setAlpha(from * t.getValue()!);
          setBirds(from * t.getValue()!);
        },
        onComplete: () => {
          birds?.stop();
          birds?.destroy();
          root.destroy();
          resolve();
        },
      });
    };
    scene.tweens.addCounter({ from: 0, to: 1, duration: SPLASH_TIMING.fadeIn, onUpdate: (t) => !leaving && (root.setAlpha(t.getValue()!), setBirds(t.getValue()!)) });
    scene.time.delayedCall(SPLASH_TIMING.total - SPLASH_TIMING.fadeOut, fadeOut);
    scene.input.on('pointerdown', fadeOut);
    scene.input.keyboard?.on('keydown', fadeOut);
  });
  return { ended };
}
