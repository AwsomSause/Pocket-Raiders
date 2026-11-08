// Pure gate for the update splash (no Phaser import, so unit tests can load it).

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

