// Animation redesign pass 8, Conditions: every status has an arrival, a look that lasts and its own turn-by-turn
// tick (plans/animation-redesign/src/p08.js). These are the clips (data, ms, the mockup's numbers); the screen keeps
// the lasting look on the Pokémon itself (src/ui/battleFx/conditionLook.ts). Presentation only: no battle state,
// no gameplay RNG. The scatter of flames and bubbles is a fixed table, so every arrival looks the same.

import { ClipBuilder, type ClipLevel, type MotionClip } from './motionClip';

/** The statuses that have a look. Toxic is drawn as poison. */
export type CondKind = 'brn' | 'psn' | 'par' | 'slp' | 'frz';

/** A Pokémon on the field: its feet, its size on screen, and which side it is on. */
export interface CondSpot {
  x: number;
  y: number;
  w: number;
  h: number;
  side: 'player' | 'enemy';
}

/** The mockup's status colours (`SC` in p08), as numbers. */
export const COND_COLOR: Record<CondKind, number> = { brn: 0xe8582b, psn: 0xa45cc8, par: 0xd9a800, slp: 0x7d8aa3, frz: 0x3fb4e0 };

/** The colour wash each look lays over the Pokémon, and how strong it is once the arrival is over. */
export const COND_TINT: Record<CondKind, { color: number; alpha: number; pulseMs: number }> = {
  brn: { color: 0xff7a1a, alpha: 0.5, pulseMs: 1100 },
  psn: { color: 0xa45cc8, alpha: 0.45, pulseMs: 1400 },
  par: { color: 0xffe14d, alpha: 0.12, pulseMs: 0 },
  slp: { color: 0x000000, alpha: 0, pulseMs: 0 },
  frz: { color: 0x7fd6f5, alpha: 0.5, pulseMs: 0 },
};

/** Maps a battle status to its look (Toxic is poison; anything else has none). */
export function condKind(status: string | null | undefined): CondKind | null {
  if (status === 'tox') return 'psn';
  return status === 'brn' || status === 'psn' || status === 'par' || status === 'slp' || status === 'frz' ? status : null;
}

/** A fixed scatter in -1..1 and 0..1 (the mockup rolls these; ours never change, so no RNG is touched). */
const SPREAD = [-0.8, 0.35, -0.2, 0.9, -0.55, 0.1, 0.65, -0.95, 0.45];
const LIFT = [0.2, 0.75, 0.05, 0.5, 0.9, 0.35, 0.6, 0.15, 0.8];
const SIZE = [0.55, 0.15, 0.85, 0.4, 1, 0.25, 0.7, 0.05, 0.6];

/** The flame picture's width (px); each flame is scaled from it. */
export const FLAME_W = 34;
/** The bubble picture's size (px). */
export const BUBBLE_W = 26;
/** Lasting embers at the feet (burn), against the Pokémon's middle. */
export const EMBERS = [-40, 30];
/** How far a sleeping Pokémon leans (degrees, away from the other side) and sinks (px), and how short it gets. */
export const SLUMP = { rot: 16, dy: 12, sy: 0.86 };

/**
 * A status arrives (pass 8). Parts by status:
 * - brn: `f0`..`f8` flames climb the body from the feet (x, y, sx, sy, alpha); `tint` washes orange; `mon` hops.
 * - psn: `b0`..`b8` bubbles rise through the body and pop with small rings; `tint` washes purple.
 * - par: four bolts crawl over the body; `tint` flashes yellow, then settles faint.
 * - slp: three pink rings close in; `mon` slumps (leans away, sinks, gets shorter).
 * - frz: `ice` grows up from the ground over it (sy); `tint` turns icy; a cold ring on the ground.
 * `tint` and `ice` are the lasting look's own pictures, left at their lasting state. Reduced: the tint and the shapes
 * that stay (ice, slump) without wind-up or particles. Off: the end state at once.
 */
export function condArriveClip(kind: CondKind, at: CondSpot, level: ClipLevel): MotionClip {
  const b = new ClipBuilder(`cond-${kind}`, level);
  const m = b.part('mon', { dx: 0, dy: 0, sx: 1, sy: 1, rot: 0 });
  const tint = b.part('tint', { alpha: 0 });
  const away = at.side === 'enemy' ? 1 : -1;
  const mid = at.y - at.h / 2;
  const look = COND_TINT[kind];
  const ice = kind === 'frz' ? b.part('ice', { sy: 0 }) : null;
  const slump = (track: typeof m, t: number, d: number): void => void track.at(t).to(d, { rot: SLUMP.rot * away, dy: SLUMP.dy, sy: SLUMP.sy }, 'io');
  if (level !== 'full') {
    tint.at(0).set({ alpha: look.alpha });
    ice?.at(0).set({ sy: 1 });
    if (kind === 'slp') m.at(0).set({ rot: SLUMP.rot * away, dy: SLUMP.dy, sy: SLUMP.sy });
    return b.end(0);
  }
  switch (kind) {
    case 'brn': {
      SPREAD.forEach((s, i) => {
        const z = (20 + 14 * SIZE[i]!) / FLAME_W;
        const f = b.part(`f${i}`, { x: at.x + s * at.w * 0.4, y: at.y - LIFT[i]! * 20, sx: 0, sy: 0, alpha: 1 });
        f.at(i * 50).to(150, { sx: z, sy: z }, 'out').to(500, { y: at.y - (70 + (at.h - 70) * LIFT[(i + 3) % 9]!), sx: z * 0.3, sy: z * 0.3, alpha: 0 }, 'in');
      });
      tint.at(0).to(250, { alpha: look.alpha });
      m.at(0).to(100, { dy: -16 }, 'out').to(200, { dy: 0 }, 'bo');
      b.beat(0, 'Flames climb').beat(300, 'BRN chip');
      return b.end(1100);
    }
    case 'psn': {
      SPREAD.forEach((s, i) => {
        const z = (12 + 14 * SIZE[i]!) / BUBBLE_W;
        const x = at.x + s * at.w * 0.4;
        const y1 = at.y - (60 + (at.h - 60) * LIFT[(i + 2) % 9]!);
        const bub = b.part(`b${i}`, { x, y: at.y - 10, sx: 0, sy: 0, alpha: 1 });
        bub.at(i * 70).to(150, { sx: z, sy: z }, 'back').to(500, { y: y1 }, 'out').to(60, { sx: z * 1.5, sy: z * 1.5, alpha: 0 });
        b.fx({ kind: 'ring', at: i * 70 + 680, x, y: y1, r1: z * BUBBLE_W, flat: 1, d: 200, color: 0xd9a8f0, w: 3 });
      });
      tint.at(0).to(250, { alpha: look.alpha });
      b.beat(0, 'Bubbles rise and pop').beat(300, 'PSN chip');
      return b.end(1500);
    }
    case 'par': {
      [[-0.7, 0.3], [0.5, -0.4], [-0.1, 0.9], [0.8, -0.85]].forEach(([a, c], i) => {
        b.fx({ kind: 'bolt', at: i * 100, x1: at.x + a! * 70, y1: mid, x2: at.x + c! * 70, y2: at.y, n: 5, j: 20, color: 0xffe14d, color2: 0xffffff, w: 4, d: 80, again: true });
      });
      tint.at(0).to(250, { alpha: 0.5 }).at(500).to(300, { alpha: look.alpha });
      b.beat(0, 'Bolts crawl over it').beat(600, 'It locks up');
      return b.end(900);
    }
    case 'slp': {
      for (let i = 0; i < 3; i++) b.fx({ kind: 'ring', at: i * 150, x: at.x, y: mid, r0: 150, r1: 20, flat: 1, d: 500, color: 0xe59bd0, w: 5 });
      slump(m, 300, 600);
      b.beat(0, 'Rings close in').beat(300, 'Slumps; breathing slows');
      return b.end(900);
    }
    case 'frz': {
      ice!.at(0).to(400, { sy: 1 }, 'back');
      tint.at(0).to(250, { alpha: look.alpha });
      b.fx({ kind: 'ring', at: 0, x: at.x, y: at.y, r1: 170, flat: 0.35, d: 400, color: 0xcdf3ff, w: 8 });
      b.fx({ kind: 'star', at: 500, x: at.x + 30, y: mid - 20, size: 34, points: 4, d: 300 });
      b.beat(0, 'Ice grows from the ground').beat(500, 'Stops dead; a glint');
      return b.end(900);
    }
  }
}

/**
 * The turn's tick (pass 8): burn flares its embers (`e0`, `e1` sx/sy), flashes white and shakes; poison swells one big
 * bubble over the head (`big`) that bursts with a ring, and shakes. Full only; Reduced keeps a small shake.
 */
export function condTickClip(kind: 'brn' | 'psn', at: CondSpot, level: ClipLevel): MotionClip {
  const b = new ClipBuilder(`tick-${kind}`, level);
  const m = b.part('mon', { dx: 0, dy: 0, sx: 1, sy: 1, white: 0 });
  const head = { x: at.x, y: at.y - at.h - 16 };
  const big = kind === 'psn' ? b.part('big', { x: head.x, y: head.y, sx: 0, sy: 0, alpha: 1 }) : null;
  const embers = kind === 'brn' ? EMBERS.map((_, i) => b.part(`e${i}`, { sx: 1, sy: 1 })) : [];
  if (level === 'off') return b.end(0);
  if (level === 'reduced') {
    m.at(0).to(50, { dx: -6 }).to(50, { dx: 6 }).to(200, { dx: 0 }, 'el');
    return b.end(300);
  }
  if (kind === 'brn') {
    embers.forEach((e) => e.at(200).to(150, { sx: 2.6, sy: 2.6 }, 'out').to(400, { sx: 1, sy: 1 }, 'bo'));
    m.at(250).to(80, { white: 0.6 }).to(200, { white: 0 });
    m.at(250).to(50, { dx: -8 }).to(50, { dx: 8 }).to(200, { dx: 0 }, 'el');
    b.beat(200, 'Flames flare, HP drops');
    return b.end(800);
  }
  big!.at(100).to(400, { sx: 1.4, sy: 1.4 }, 'out').to(50, { sx: 2, sy: 2, alpha: 0 });
  b.fx({ kind: 'ring', at: 520, x: head.x, y: head.y, r1: 60, flat: 1, d: 300, color: 0xd9a8f0, w: 4 });
  m.at(500).to(40, { dx: -6 }).to(40, { dx: 6 }).to(40, { dx: -6 }).to(200, { dx: 0 }, 'el');
  b.beat(100, 'One big bubble swells').beat(520, 'It bursts, HP drops');
  return b.end(900);
}

/**
 * Paralysis stops it (pass 8): it lunges a few px toward the other side, snaps back and sparks; the yellow wash
 * (`tint`) flares and settles. Reduced: the lunge only.
 */
export function parCantClip(at: CondSpot, level: ClipLevel): MotionClip {
  const b = new ClipBuilder('par-cant', level);
  const m = b.part('mon', { dx: 0 });
  const tint = b.part('tint', { alpha: COND_TINT.par.alpha });
  if (level === 'off') return b.end(0);
  const toward = at.side === 'enemy' ? -1 : 1;
  m.at(200).to(100, { dx: 26 * toward }, 'out').to(50, { dx: -6 * toward }).to(250, { dx: 0 }, 'el');
  if (level === 'reduced') return b.end(600);
  b.fx({ kind: 'bolt', at: 300, x1: at.x - 50, y1: at.y - at.h * 0.7, x2: at.x + 30, y2: at.y - 10, n: 5, j: 22, color: 0xffe14d, color2: 0xffffff, w: 5, d: 80, again: true });
  tint.at(300).to(50, { alpha: 0.7 }).to(300, { alpha: COND_TINT.par.alpha });
  b.beat(200, 'Tries to lunge, locks up');
  return b.end(700);
}

/**
 * Waking up (pass 8): it springs up out of the slump (34 px, landing with a bounce), the Z's pop into sparkles and a
 * yellow "!" pops over its head (cue `bang`). Reduced: it simply stands up. Off: at once.
 */
export function wakeClip(at: CondSpot, level: ClipLevel): MotionClip {
  const b = new ClipBuilder('wake', level);
  const away = at.side === 'enemy' ? 1 : -1;
  const m = b.part('mon', { dx: 0, dy: SLUMP.dy, sx: 1, sy: SLUMP.sy, rot: SLUMP.rot * away });
  if (level === 'off') return b.end(0);
  if (level === 'reduced') {
    m.at(0).to(250, { dy: 0, sy: 1, rot: 0 }, 'io');
    return b.end(250);
  }
  m.at(0).to(120, { rot: 0, dy: -34 }, 'out').to(250, { dy: 0 }, 'bo');
  m.at(0).to(100, { sy: 1 });
  b.fx({ kind: 'dust', at: 0, x: at.x - 60, y: at.y - at.h * 0.75, n: 8, cols: [0xffffff, 0xcfd6ea] });
  b.fx({ kind: 'cue', at: 0, name: 'bang' });
  b.beat(0, 'Wakes with a jump');
  return b.end(400);
}

/**
 * Thawing (pass 8): cracks run through the ice (white bolts) while it shakes (`ice` x; its foot is at the feet + 8), then it shatters into shards
 * with a cold flash, the icy wash (`tint`) fades and the Pokémon shakes itself off. Reduced: the ice and wash fade.
 */
export function thawClip(at: CondSpot, level: ClipLevel): MotionClip {
  const b = new ClipBuilder('thaw', level);
  const m = b.part('mon', { dx: 0 });
  const ice = b.part('ice', { x: at.x, y: at.y + 8, alpha: 1 });
  const tint = b.part('tint', { alpha: COND_TINT.frz.alpha });
  if (level === 'off') {
    ice.at(0).set({ alpha: 0 });
    tint.at(0).set({ alpha: 0 });
    return b.end(0);
  }
  if (level === 'reduced') {
    ice.at(0).to(300, { alpha: 0 });
    tint.at(0).to(300, { alpha: 0 });
    return b.end(300);
  }
  const mid = at.y - at.h / 2;
  [[-0.6, 0.4], [0.3, -0.7], [0.9, 0.1]].forEach(([a, c], i) => {
    b.fx({ kind: 'bolt', at: i * 120, x1: at.x + a! * 50, y1: mid - 40, x2: at.x + c! * 60, y2: at.y, n: 4, j: 16, color: 0xffffff, color2: 0xcdf3ff, w: 3, d: 80, again: true });
  });
  ice.at(0);
  for (let k = 0; k < 6; k++) ice.to(80, { x: at.x + (k % 2 ? -4 : 4) });
  ice.to(40, { x: at.x });
  const shatter = 550;
  ice.at(shatter).set({ alpha: 0 });
  b.fx({ kind: 'dust', at: shatter, x: at.x, y: mid, n: 20, cols: [0xffffff, 0xcdf3ff, 0x7fd6f5], big: 2.5 });
  b.fx({ kind: 'flash', at: shatter, d: 200, alpha: 0.5, color: 0xcdf3ff });
  tint.at(shatter).to(300, { alpha: 0 });
  m.at(shatter).to(50, { dx: -8 }).to(50, { dx: 8 }).to(50, { dx: -6 }).to(200, { dx: 0 }, 'el');
  b.fx({ kind: 'dust', at: shatter + 100, x: at.x, y: mid - 20, n: 8, cols: [0xffffff, 0xe8fbff] });
  b.beat(0, 'Thaw: cracks run through').beat(shatter, 'Shatters; it shakes itself off');
  return b.end(shatter + 400);
}

// ---------- stat changes (pass 8, "Stat Changes") ----------

/** Each stat's colour: Attack red, Defense violet and Speed blue are the mockup's; the other four are ours. */
export const STAT_COLOR: Record<string, number> = { atk: 0xe3350d, def: 0x8a6fd0, spe: 0x3fa9f5, spa: 0xf85888, spd: 0x3ec46d, acc: 0xffcb05, eva: 0xb8c4e0 };
/** A drop's stamp is the mockup's sky blue (`.stamp.b`); a boost's is the stat's own colour. */
export const STAT_DOWN_STAMP = 0x2a75bb;
/** A chevron is 30 x 20 px, 6 x 4 px bigger for each stage the change moves. */
export const CHEVRON = { w: 30, h: 20, dw: 6, dh: 4 } as const;
/** How many chevrons and waves a change of `change` stages sends: five a wave, one wave a stage (at most three). */
export const chevronWaves = (change: number): number => Math.max(1, Math.min(3, Math.abs(change)));

/**
 * A stat change (pass 8): chevrons in the stat's colour sweep the whole body, up from the feet for a boost and down
 * from the head for a drop, five a wave, 160 ms between waves, each fading where it stops; the colour washes over it at .45 and fades; it
 * stretches up (a boost) or squashes down (a drop). `at.w` is the Pokémon's full drawn width. Parts: `mon`
 * (`tint`, `tintColor`), chevrons `c0`.. (x, y, alpha). The stamp and the stage pips are the screen's.
 * Reduced: the wash only. Off: nothing.
 */
export function statClip(at: CondSpot, change: number, color: number, level: ClipLevel): MotionClip {
  const b = new ClipBuilder(`stat-${change > 0 ? 'up' : 'down'}`, level);
  const up = change > 0;
  const n = chevronWaves(change);
  const from = up ? at.y : at.y - at.h;
  const to = up ? at.y - at.h - 10 : at.y;
  const m = b.part('mon', { sx: 1, sy: 1, tint: 0, tintColor: color });
  const chevs = Array.from({ length: n * 5 }, (_, j) => b.part(`c${j}`, { x: at.x + ((j % 5) - 2) * at.w * 0.2, y: from, alpha: 0 }));
  if (level === 'off') return b.end(0);
  m.at(0).to(250, { tint: 0.45 });
  m.at(500).to(300, { tint: 0 });
  if (level === 'reduced') return b.end(800);
  if (up) m.at(0).to(120, { sy: 1.06, sx: 0.97 }, 'out').to(300, { sy: 1, sx: 1 }, 'el');
  else m.at(0).to(120, { sy: 0.93, sx: 1.04 }, 'out').to(400, { sy: 1, sx: 1 }, 'el');
  chevs.forEach((c, j) => {
    const k = Math.floor(j / 5);
    const i = j % 5;
    // As the mockup: it travels for 0.5 s, then fades over the next 0.5 s where it stopped.
    c.at(k * 160 + i * 40).set({ alpha: 0.95 }).to(500, { y: to }, up ? 'out3' : 'in3').also(500, { alpha: 0 }, 'in3');
  });
  b.beat(0, up ? 'Chevrons sweep up the body' : 'Chevrons sweep down the body');
  if (n > 1) b.beat(160, `${n} stages: ${n} waves, bigger chevrons`);
  return b.end((n - 1) * 160 + 160 + 1000);
}

// ---------- ability trigger (pass 8, "Ability Trigger") ----------

/** The ability flag holds this long before it folds away (the mockup's 2 s). */
export const FLAG_HOLD = 2000;
/** Intimidate's glare: the cone from its eyes across the field (620 x 180 px), aimed at the other Pokémon. */
export const GLARE = { w: 620, h: 180 } as const;

/**
 * Intimidate acted out (pass 8): 0.4 s after its flag unrolls the owner leans in toward the other side (40 px, 14 px
 * down, 1.12x) while the field dims around it; two red glints flash at its eyes and its glare (`cone`) sweeps across;
 * the other Pokémon shrinks back 18 px and trembles, then springs home. Parts: `owner`, `target` (mons), `cone` (free:
 * x, y, sx, alpha). Cues: `dim` and `undim`. Reduced and Off: nothing moves (the flag is the screen's).
 */
export function intimidateClip(owner: CondSpot, target: CondSpot, level: ClipLevel): MotionClip {
  const b = new ClipBuilder('intimidate', level);
  const toward = owner.side === 'enemy' ? -1 : 1;
  // The other one is pushed the same way: back, away from the owner.
  const away = toward;
  const eyes = { x: owner.x + toward * 60, y: owner.y - owner.h / 2 - 40 };
  const o = b.part('owner', { dx: 0, dy: 0, sx: 1, sy: 1 });
  const t = b.part('target', { dx: 0, sy: 1 });
  const cone = b.part('cone', { x: eyes.x, y: eyes.y, sx: 0, alpha: 0.5 });
  if (level !== 'full') return b.end(0);
  const T = 400;
  o.at(T).to(200, { dx: toward * 40, dy: 14, sx: 1.12, sy: 1.12 }, 'out3').wait(800).to(300, { dx: 0, dy: 0, sx: 1, sy: 1 }, 'io');
  b.fx({ kind: 'cue', at: T, name: 'dim' });
  for (const k of [-1, 1]) b.fx({ kind: 'star', at: T + 200, x: eyes.x + k * 16, y: eyes.y, size: 40, points: 4, inner: 0.12, d: 500, color: 0xff4d4d });
  cone.at(T + 250).to(200, { sx: 1 }, 'out').wait(300).to(300, { alpha: 0 });
  t.at(T + 450).to(100, { dx: away * 18, sy: 0.94 }, 'out');
  for (let i = 0; i < 5; i++) t.to(50, { dx: away * 22 }, 'io').to(50, { dx: away * 18 }, 'io');
  t.to(300, { dx: 0, sy: 1 }, 'back');
  b.fx({ kind: 'cue', at: T + 1100, name: 'undim' });
  b.beat(0, 'The ability flag unrolls').beat(T, 'It leans in').beat(T + 250, 'The glare crosses the field').beat(T + 450, 'The other shrinks back');
  return b.end(T + 450 + 100 + 500 + 300);
}

/** The sandstorm's end-of-turn lean (pass 8 "Sandstorm"): how far it leans into the wind (px, degrees). */
export const GUST_LEAN = { dx: -8, rot: -4 } as const;

/**
 * The sandstorm gusts at the end of the turn (pass 8): both Pokémon lean into the wind (left, like the grit), hold
 * it and spring back, with a quick white blink as the sand hits. Reduced: the blink only. Off: nothing.
 */
export function gustLeanClip(level: ClipLevel): MotionClip {
  const b = new ClipBuilder('gust-lean', level);
  const m = b.part('mon', { dx: 0, rot: 0, white: 0 });
  if (level === 'off') return b.end(0);
  m.at(400).to(80, { white: 0.5 }).to(200, { white: 0 });
  if (level === 'reduced') return b.end(680);
  m.at(250).to(150, { dx: GUST_LEAN.dx, rot: GUST_LEAN.rot }, 'out').wait(400).to(300, { dx: 0, rot: 0 }, 'back');
  b.beat(250, 'Both lean into the gust');
  return b.end(1100);
}

/** The shield's ring colour and where the blow lands (in front of the protected Pokémon, toward the attacker). */
export const SHIELD = { color: 0xb8ffe2, ahead: 150, up: 40 } as const;

/**
 * An attack meets Protect (pass 8 "Protect", from the blow on): three rings burst where it lands in front of the
 * protected Pokémon, the screen shakes, the "PROTECTED" stamp slams in (cue `stamp`) and the attacker is pushed back
 * 30 px and springs home. The shield itself belongs to the Protect move's own animation and is not drawn here.
 * Parts: `attacker` (dx). Reduced: the stamp only. Off: nothing.
 */
export function protectedClip(attacker: CondSpot, guarded: CondSpot, level: ClipLevel): MotionClip {
  const b = new ClipBuilder('protected', level);
  const a = b.part('attacker', { dx: 0 });
  if (level === 'off') return b.end(0);
  b.fx({ kind: 'cue', at: 100, name: 'stamp' });
  if (level === 'reduced') return b.end(1200);
  const toward = guarded.side === 'enemy' ? -1 : 1;
  const away = attacker.side === 'enemy' ? 1 : -1;
  const x = guarded.x + toward * (SHIELD.ahead + 20);
  const y = guarded.y - guarded.h / 2 - SHIELD.up - 10;
  for (let i = 0; i < 3; i++) b.fx({ kind: 'ring', at: i * 80, x, y, r1: 120 + i * 50, flat: 1, d: 400, color: SHIELD.color, w: 4 });
  b.fx({ kind: 'cue', at: 0, name: 'shake' });
  a.at(50).to(120, { dx: 30 * away }, 'out').to(400, { dx: 0 }, 'back');
  b.beat(0, 'The attack lands on the shield').beat(50, 'Attacker is pushed back');
  return b.end(1200);
}

/**
 * Confusion (pass 8): three yellow stars circle its head (an oval 52 px wide each way, 13 px tall, about 5 radians a
 * second, a third of a turn apart) and it sways under them (5 degrees and 6 px each way, 1.6 s a sway) for as long
 * as it is confused.
 */
export const CONFUSE = { rx: 52, ry: 13, spin: 5, star: 22, above: 6, popMs: 200, popGap: 80, sway: { rot: 5, dx: 6, ms: 1600 } } as const;

/**
 * It hurts itself in its confusion (pass 8): it swings at nothing (40 px away from the other side and back), then a
 * yellow star bursts on its own head, it blinks white, squashes and springs back, and the screen shakes (cue `shake`).
 * Reduced: the blink only. Off: nothing.
 */
export function confusionHitClip(at: CondSpot, level: ClipLevel): MotionClip {
  const b = new ClipBuilder('confusion-hit', level);
  const m = b.part('mon', { dx: 0, sy: 1, white: 0 });
  if (level === 'off') return b.end(0);
  const bonk = 200;
  m.at(bonk).to(60, { white: 0.7 }).to(200, { white: 0 });
  if (level === 'reduced') return b.end(bonk + 260);
  const away = at.side === 'enemy' ? 1 : -1;
  m.at(0).to(120, { dx: 40 * away }, 'out').to(200, { dx: 0 }, 'back');
  m.at(bonk).to(60, { sy: 0.86 }).to(300, { sy: 1 }, 'el');
  b.fx({ kind: 'star', at: bonk, x: at.x + 10 * away, y: at.y - at.h - CONFUSE.above + 30, size: 90, points: 4, d: 400, color: 0xffcb05 });
  b.fx({ kind: 'cue', at: bonk, name: 'shake' });
  b.beat(0, 'Swings at nothing').beat(bonk, 'Bonks itself');
  return b.end(bonk + 400);
}
