// Motion clips: the animation redesign's timelines as plain data (plans/animation-redesign).
//
// A clip is a list of timed steps on named parts ("mon", "ball") plus one-shot effects (dust, a ring,
// a beam). It is written the way the mockup kit writes them (`at`, `to`, `wait`, `also`, `arc`), in
// milliseconds, and sampled at any time. The screen-side player (src/ui/battleFx/motionPlayer.ts) only
// applies the sampled numbers to sprites. Presentation only: no Phaser, no game state, no gameplay RNG.

/** The mockup kit's easing curves (plans/animation-redesign/src/kit.js), so the game moves the same way. */
export const EASES = {
  lin: (u: number) => u,
  in: (u: number) => u * u,
  out: (u: number) => 1 - (1 - u) * (1 - u),
  io: (u: number) => (u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u)),
  in3: (u: number) => u * u * u,
  out3: (u: number) => 1 - (1 - u) ** 3,
  back: (u: number) => 1 + 2.70158 * (u - 1) ** 3 + 1.70158 * (u - 1) ** 2,
  back2: (u: number) => 1 + 4.2 * (u - 1) ** 3 + 3.2 * (u - 1) ** 2,
  el: (u: number) => (u === 0 || u === 1 ? u : 2 ** (-10 * u) * Math.sin((u * 10 - 0.75) * 2.0944) + 1),
  /** Bounces to rest (the mockup's `bo`). */
  bo: (u: number) => {
    const n = 7.5625;
    const d = 2.75;
    if (u < 1 / d) return n * u * u;
    if (u < 2 / d) return n * (u - 1.5 / d) ** 2 + 0.75;
    if (u < 2.5 / d) return n * (u - 2.25 / d) ** 2 + 0.9375;
    return n * (u - 2.625 / d) ** 2 + 0.984375;
  },
} as const;
export type EaseName = keyof typeof EASES;

/** How much the player lets a clip do: the battle animation setting. */
export type ClipLevel = 'full' | 'reduced' | 'off';

/** One step: a part's number goes to `to` over `d` ms. `from` and `h` make it one leg of a thrown arc. */
export interface MotionSeg {
  part: string;
  prop: string;
  at: number;
  d: number;
  to: number;
  ease: EaseName;
  /** Starts from this value instead of wherever the number is. */
  from?: number;
  /** Arc height: the value dips by 4·h·u·(1-u) on the way (a throw's rise, in px). */
  h?: number;
}

/** A one-shot effect at a moment of the clip. Positions are screen pixels (960×540). */
export type MotionFx =
  | { kind: 'dust'; at: number; x: number; y: number; n: number; /** Its own colours (ice shards, sparkles); dust colours when left out. */ cols?: number[]; /** Size and speed, 1 = dust. */ big?: number }
  | { kind: 'flash'; at: number; d: number; alpha: number; color?: number }
  | { kind: 'ring'; at: number; x: number; y: number; r1: number; flat: number; d: number; color?: number; w?: number; /** Starts at this radius (a ring closing in when it is bigger than r1). */ r0?: number }
  /** A jagged bolt from one point to the other, shown for `d` ms (and once more when `again`). */
  | { kind: 'bolt'; at: number; x1: number; y1: number; x2: number; y2: number; n: number; j: number; color: number; color2: number; w: number; d: number; again?: boolean }
  /** A many-pointed burst of light that grows and fades (the ace's star). */
  | { kind: 'star'; at: number; x: number; y: number; size: number; points: number; d: number }
  | { kind: 'streak'; at: number; x1: number; y1: number; x2: number; y2: number; w: number; color: number; d: number; hold: number; out: number }
  | { kind: 'orbs'; at: number; x0: number; y0: number; x1: number; y1: number; n: number; gap: number; d: number }
  | { kind: 'dim'; at: number; x: number; y: number; d: number }
  /** A named moment the screen answers itself (a sound, showing the new sprite). */
  | { kind: 'cue'; at: number; name: string };

export interface MotionClip {
  id: string;
  level: ClipLevel;
  /** How long the clip runs, ms. 0 = nothing moves; only the end state is applied. */
  length: number;
  /** Each part's numbers before any step. */
  base: Record<string, Record<string, number>>;
  segs: MotionSeg[];
  fx: MotionFx[];
  /** The readable beats (what a viewer should see, and when). */
  beats: { at: number; name: string }[];
}

export type PartState = Record<string, number>;

/** A cursor on one part, as in the mockup kit: each `to` starts where the last one ended. */
export class Track {
  private c = 0;

  constructor(private readonly clip: MotionClip, private readonly part: string) {}

  at(ms: number): this {
    this.c = ms;
    return this;
  }

  wait(ms: number): this {
    this.c += ms;
    return this;
  }

  /** Animates each number to its value over `d` ms and moves the cursor on. `s` means both sx and sy. */
  to(d: number, props: Record<string, number>, ease: EaseName = 'out'): this {
    for (const [k, v] of Object.entries(props)) {
      for (const prop of k === 's' ? ['sx', 'sy'] : [k]) this.clip.segs.push({ part: this.part, prop, at: this.c, d, to: v, ease });
    }
    this.c += d;
    return this;
  }

  /** Jumps the numbers at the cursor. */
  set(props: Record<string, number>): this {
    const c = this.c;
    this.to(0, props, 'lin');
    this.c = c;
    return this;
  }

  /** Like `to`, but the cursor stays (something else happens at the same time). */
  also(d: number, props: Record<string, number>, ease: EaseName = 'out'): this {
    const c = this.c;
    this.to(d, props, ease);
    this.c = c;
    return this;
  }

  /** A throw: x and y travel from one point to another over `d` ms, rising `h` px on the way. */
  arc(d: number, x0: number, y0: number, x1: number, y1: number, h: number): this {
    this.clip.segs.push({ part: this.part, prop: 'x', at: this.c, d, to: x1, ease: 'lin', from: x0 });
    this.clip.segs.push({ part: this.part, prop: 'y', at: this.c, d, to: y1, ease: 'lin', from: y0, h });
    this.c += d;
    return this;
  }
}

/** Builds a clip step by step. */
export class ClipBuilder {
  readonly clip: MotionClip;

  constructor(id: string, level: ClipLevel) {
    this.clip = { id, level, length: 0, base: {}, segs: [], fx: [], beats: [] };
  }

  /** A part with its numbers before the clip starts. */
  part(name: string, base: Record<string, number> = {}): Track {
    this.clip.base[name] = { ...(this.clip.base[name] ?? {}), ...base };
    return new Track(this.clip, name);
  }

  fx(fx: MotionFx): this {
    this.clip.fx.push(fx);
    return this;
  }

  beat(at: number, name: string): this {
    this.clip.beats.push({ at, name });
    return this;
  }

  end(length: number): MotionClip {
    this.clip.length = length;
    this.clip.fx.sort((a, b) => a.at - b.at);
    this.clip.beats.sort((a, b) => a.at - b.at);
    return this.clip;
  }
}

const sorted = new WeakMap<MotionClip, Map<string, MotionSeg[]>>();

function lanes(clip: MotionClip): Map<string, MotionSeg[]> {
  let map = sorted.get(clip);
  if (map) return map;
  map = new Map();
  for (const s of clip.segs) {
    const key = `${s.part}\n${s.prop}`;
    const lane = map.get(key);
    if (lane) lane.push(s);
    else map.set(key, [s]);
  }
  // Stable: steps written later win at the same moment.
  for (const lane of map.values()) lane.sort((a, b) => a.at - b.at);
  sorted.set(clip, map);
  return map;
}

/** Every part's numbers at `t` ms into the clip (before 0 = the base, after the end = the end state). */
export function sampleClip(clip: MotionClip, t: number): Record<string, PartState> {
  const out: Record<string, PartState> = {};
  for (const [part, base] of Object.entries(clip.base)) out[part] = { ...base };
  for (const [key, lane] of lanes(clip)) {
    const [part, prop] = key.split('\n') as [string, string];
    const state = (out[part] ??= {});
    let v = state[prop] ?? 0;
    for (const s of lane) {
      if (t < s.at) break;
      const from = s.from ?? v;
      const u = s.d <= 0 ? 1 : Math.min(1, (t - s.at) / s.d);
      v = from + (s.to - from) * EASES[s.ease](u) - (s.h ? 4 * s.h * u * (1 - u) : 0);
    }
    state[prop] = v;
  }
  return out;
}

/** The clip's end state: what must be true on screen when it is over, or at once when nothing may move. */
export const clipEnd = (clip: MotionClip): Record<string, PartState> => sampleClip(clip, Math.max(clip.length, lastStep(clip)));

function lastStep(clip: MotionClip): number {
  let end = 0;
  for (const s of clip.segs) end = Math.max(end, s.at + s.d);
  return end;
}

/**
 * The effects a level may show (pass 25's one rule): Reduced never flashes, shakes or throws particles,
 * so only shapes that say what happened stay (the beam, the ring, the darkened base). Off shows none.
 */
export function fxAllowed(fx: MotionFx, level: ClipLevel): boolean {
  if (level === 'off') return fx.kind === 'cue' || fx.kind === 'dim';
  if (level === 'reduced') return fx.kind !== 'flash' && fx.kind !== 'dust' && fx.kind !== 'orbs' && fx.kind !== 'star' && fx.kind !== 'bolt';
  return true;
}
