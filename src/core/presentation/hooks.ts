// Plugin API (idea S344): hooks that may change a battle's presentation cues, and nothing else. A hook gets a copy of
// the planned cues and the battle events (read only) and returns the cues to play. It never sees a random stream or
// the run, so it cannot change an outcome. Hooks that throw, return the wrong shape or return a cue this game does
// not know are ignored for that turn. Pure; the browser exposes `register` as `window.pkrPlugins.onCues`.

import type { Cue } from './cues';

export type CueHook = (cues: Cue[][], events: readonly { type: string }[]) => Cue[][];

export const MAX_HOOKS = 8;

/** Every cue kind the battle screen can play (must match the `Cue` union). */
export const KNOWN_CUES: ReadonlySet<string> = new Set(['telegraph', 'moveAnim', 'pulse', 'impact', 'number', 'badge', 'commonAnim', 'statArrows', 'abilityAnim', 'textAnim', 'storyAnim']);

const hooks: { name: string; fn: CueHook }[] = [];

/** Adds a hook. Returns false when the name is taken or there are too many hooks. */
export function registerCueHook(name: string, fn: CueHook): boolean {
  if (hooks.length >= MAX_HOOKS || hooks.some((h) => h.name === name) || typeof fn !== 'function') return false;
  hooks.push({ name, fn });
  return true;
}

export const unregisterCueHook = (name: string): void => {
  const i = hooks.findIndex((h) => h.name === name);
  if (i >= 0) hooks.splice(i, 1);
};

export const hookNames = (): string[] => hooks.map((h) => h.name);

const valid = (out: unknown, length: number): out is Cue[][] =>
  Array.isArray(out) && out.length === length && out.every((list) => Array.isArray(list) && list.every((c) => !!c && typeof c === 'object' && KNOWN_CUES.has((c as { kind?: string }).kind ?? '')));

/** Runs every hook in order over the planned cues. A bad hook is skipped and the cues stay as they were. */
export function applyCueHooks(cues: Cue[][], events: readonly { type: string }[]): Cue[][] {
  let current = cues;
  for (const h of hooks) {
    try {
      const out = h.fn(structuredClone(current), Object.freeze(events.map((e) => Object.freeze({ ...e }))));
      if (valid(out, current.length)) current = out;
    } catch {
      /* presentation never breaks a battle */
    }
  }
  return current;
}
