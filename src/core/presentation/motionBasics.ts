// Battle basics from the animation redesign (plans/animation-redesign, group "Battle basics"):
// recall, faint and send-out, with the mockup's own beats and timings (ms).
//
//   recall    pass 2 + 4: the ball is held out, the Pokémon turns red, braces, is pulled thin up the beam,
//             and the ball jolts as it catches.
//   faint     pass 11 + 2 + 7: a stagger back, a sway, the knees give, then it sinks into the ground with
//             dust, and its base goes dark until the next Pokémon lands.
//   send-out  pass 2: the ball arcs in, lands, bounces once and bursts; the Pokémon pops out white,
//             stretches up, lands flat and wide, and settles. Dust on both landings.
//
// One rule for every clip (pass 25): Reduced keeps the shapes that say what happened and drops the
// wind-ups, flashes and particles; Off moves nothing and only leaves the end state.
// Presentation only: these never touch battle state or gameplay RNG.

import { ClipBuilder, type ClipLevel, type MotionClip } from './motionClip';

/** Where a Pokémon stands: its feet, how tall it is drawn, and whose it is. */
export interface MonSpot {
  x: number;
  y: number;
  h: number;
  side: 'player' | 'enemy';
}

export interface Point {
  x: number;
  y: number;
}

const RECALL_RED = 0xff3b30;

/** Where the ball is held for a recall, and where a throw starts, when no trainer is on screen (the mockup's edges). */
export const recallBallSpot = (side: 'player' | 'enemy'): Point => (side === 'player' ? { x: 40, y: 330 } : { x: 920, y: 120 });
export const throwFromSpot = (side: 'player' | 'enemy'): Point => (side === 'player' ? { x: -30, y: 330 } : { x: 990, y: 110 });

/** Recall: 800 ms at Full, 420 ms Reduced, nothing at Off. Ends with the Pokémon gone (sx = sy = 0). */
export function recallClip(mon: MonSpot, ball: Point, level: ClipLevel): MotionClip {
  const b = new ClipBuilder('recall', level);
  const m = b.part('mon', { sx: 1, sy: 1, red: 0, lift: 0, shadow: 1 });
  if (level === 'off') {
    m.at(0).set({ sx: 0, sy: 0, shadow: 0 });
    b.fx({ kind: 'cue', at: 0, name: 'tuck' });
    return b.end(0);
  }
  const k = b.part('ball', { x: ball.x, y: ball.y, sx: 1, sy: 1, alpha: 0 });
  const beam = { kind: 'streak', x1: ball.x, y1: ball.y, x2: mon.x, y2: mon.y - mon.h / 2, w: 10, color: RECALL_RED } as const;
  if (level === 'reduced') {
    k.at(0).set({ alpha: 1 }).wait(300).to(120, { alpha: 0 });
    m.at(0).to(100, { red: 1 });
    b.fx({ ...beam, at: 60, d: 100, hold: 160, out: 100 });
    m.at(120).to(200, { s: 0 }, 'in');
    m.at(120).to(200, { shadow: 0 });
    b.fx({ kind: 'cue', at: 320, name: 'catch' });
    b.fx({ kind: 'cue', at: 220, name: 'tuck' });
    b.beat(0, 'Ball held out').beat(120, 'Shrinks into the beam');
    return b.end(420);
  }
  k.at(0).set({ alpha: 1 }).to(120, { s: 1.25 }, 'back');
  m.at(50).to(120, { red: 1 });
  b.fx({ ...beam, at: 100, d: 120, hold: 220, out: 120 });
  m.at(120).to(100, { sx: 1.1, sy: 0.9 }, 'out').to(200, { sx: 0.15, sy: 1.25, lift: 0.3 }, 'in3').to(50, { s: 0 });
  m.at(200).to(200, { shadow: 0 });
  k.at(460).to(60, { s: 0.85 }).to(200, { s: 1 }, 'el').wait(150).to(150, { alpha: 0 });
  b.fx({ kind: 'cue', at: 460, name: 'catch' });
  // The info bar tucks away as the catch settles (pass 2, Switch).
  b.fx({ kind: 'cue', at: 600, name: 'tuck' });
  b.beat(0, 'Ball held out').beat(120, 'Braces, then stretches into the beam').beat(460, 'Ball catches it').beat(600, 'The info bar tucks away');
  return b.end(800);
}

/** Faint: 1300 ms at Full, 400 ms Reduced, nothing at Off. Ends sunk into the ground (sink = 1). */
export function faintClip(mon: MonSpot, level: ClipLevel): MotionClip {
  const b = new ClipBuilder('faint', level);
  const m = b.part('mon', { dx: 0, rot: 0, sx: 1, sy: 1, sink: 0, shadow: 1 });
  const dim = { kind: 'dim', x: mon.x, y: mon.y, d: 400 } as const;
  if (level === 'off') {
    m.at(0).set({ sink: 1, shadow: 0 });
    b.fx({ ...dim, at: 0, d: 0 });
    return b.end(0);
  }
  if (level === 'reduced') {
    m.at(0).to(350, { sink: 1 }, 'in3');
    m.at(0).to(350, { shadow: 0 });
    b.fx({ ...dim, at: 0 });
    b.beat(0, 'Sinks away');
    return b.end(400);
  }
  // Away from the other side: your Pokémon reels left, the foe reels right.
  const d = mon.side === 'player' ? -1 : 1;
  m.at(0).to(100, { dx: 14 * d, rot: 7 * d }, 'out').to(120, { dx: 8 * d, rot: 3 * d }).to(100, { dx: 16 * d, rot: 10 * d }, 'in');
  m.at(300).to(120, { dx: 16 * d - 9, rot: -4 }).to(160, { dx: 16 * d + 9, rot: 4 }).to(120, { dx: 16 * d, rot: 0 }).to(200, { sy: 0.78, sx: 1.14 }, 'in');
  m.at(900).to(350, { sink: 1 }, 'in3');
  m.at(900).to(350, { shadow: 0 });
  b.fx({ ...dim, at: 300 });
  b.fx({ kind: 'dust', at: 920, x: mon.x + 16 * d, y: mon.y, n: 10 });
  b.beat(0, 'Staggers back').beat(300, 'Sways').beat(700, 'Knees give').beat(900, 'Drops');
  return b.end(1300);
}

/** When the new Pokémon bursts out of its ball, ms into the send-out clip (the screen shows the sprite then). */
export const sendOpenAt = (level: ClipLevel): number => (level === 'full' ? 900 : level === 'reduced' ? 300 : 0);

/**
 * Send-out, from the moment the ball leaves the hand at `from`: 1500 ms at Full, 550 ms Reduced, nothing
 * at Off. The cue "open" is when the Pokémon appears (its cry, the ball's own opening effect).
 */
export function sendClip(mon: MonSpot, from: Point, level: ClipLevel, weight: SendWeight = 'normal'): MotionClip {
  const b = new ClipBuilder('send', level);
  const open = sendOpenAt(level);
  const m = b.part('mon', { dy: 0, sx: 0, sy: 0, white: 0, shadow: 0, rot: 0 });
  b.fx({ kind: 'cue', at: open, name: 'open' });
  if (level === 'off') {
    m.at(0).set({ sx: 1, sy: 1, shadow: 1 });
    b.fx({ kind: 'cue', at: 0, name: 'plate' });
    return b.end(0);
  }
  const gy = mon.y - 8;
  const spin = mon.side === 'player' ? 540 : -540;
  const k = b.part('ball', { x: from.x, y: from.y, sx: 1, sy: 1, rot: 0, alpha: 0 });
  if (level === 'reduced') {
    k.at(0).set({ alpha: 1 }).arc(open, from.x, from.y, mon.x, gy, 40).to(100, { alpha: 0 });
    b.fx({ kind: 'ring', at: open, x: mon.x, y: gy - 6, r1: 110, flat: 0.4, d: 400 });
    m.at(open).to(200, { s: 1 }, 'out');
    m.at(open).to(200, { shadow: 1 });
    b.fx({ kind: 'cue', at: open, name: 'plate' });
    b.fx({ kind: 'cue', at: open + 200, name: 'cry' });
    b.beat(0, 'Ball thrown').beat(open, 'Appears').beat(open + 200, 'Its cry');
    return b.end(open + 250);
  }
  const land = 500;
  k.at(0).set({ alpha: 1 }).also(land, { rot: spin }, 'lin').arc(land, from.x, from.y, mon.x, gy, 120);
  k.to(50, { sy: 0.6, sx: 1.3 }).to(80, { sy: 1.1, sx: 0.95 }).arc(220, mon.x, gy, mon.x, gy, 26).to(50, { sy: 0.7, sx: 1.25 }).to(100, { s: 1.8, alpha: 0 }, 'out');
  b.fx({ kind: 'cue', at: 0, name: 'throw' });
  b.fx({ kind: 'cue', at: land, name: 'bounce' });
  b.fx({ kind: 'dust', at: land, x: mon.x, y: gy + 8, n: 5 });
  b.fx({ kind: 'flash', at: open, d: 160, alpha: 0.5 });
  b.fx({ kind: 'ring', at: open, x: mon.x, y: gy - 6, r1: 110, flat: 0.4, d: 400 });
  m.at(open).set({ white: 1 });
  m.at(open).to(140, { sx: 0.78, sy: 1.26, dy: -34 }, 'out').to(100, { sx: 1.22, sy: 0.8, dy: 0 }, 'in').to(120, { sx: 0.95, sy: 1.06 }, 'out').to(140, { sx: 1, sy: 1 }, 'io');
  m.at(open + 100).to(200, { white: 0 });
  m.at(open).to(250, { shadow: 1 });
  b.fx({ kind: 'dust', at: open + 240, x: mon.x, y: mon.y, n: 9 });
  // The info bar comes back with the new name while it is still settling (pass 2, Switch).
  b.fx({ kind: 'cue', at: open + 100, name: 'plate' });
  b.beat(0, 'Ball thrown').beat(land, 'Ball lands and bounces').beat(open, 'Bursts open').beat(open + 100, 'The info bar comes back').beat(open + 240, 'Lands');
  // Pass 11 (Light and Heavy): weight is a character trait. A light one bounces twice before its cry; a heavy one
  // comes down like a dropped piano: the screen jolts, dust goes both ways, the plates rattle, the other side is
  // bounced off its feet ("thud"). Every entrance ends with a cry sized to the Pokémon ("cry", see cryClip).
  const L = open + 240;
  const w = SEND_WEIGHT[weight];
  if (weight === 'light') m.at(L + 200).to(100, { dy: -18 }, 'out').to(100, { dy: 0 }, 'in').to(80, { dy: -9 }, 'out').to(80, { dy: 0 }, 'in');
  if (weight === 'heavy') {
    b.fx({ kind: 'cue', at: L, name: 'thud' });
    b.fx({ kind: 'dust', at: L, x: mon.x - 50, y: mon.y, n: 8, big: 1.4 });
    b.fx({ kind: 'dust', at: L, x: mon.x + 50, y: mon.y, n: 8, big: 1.4 });
    b.beat(L, 'Comes down hard: the screen jolts');
  }
  if (weight === 'light') b.beat(L + 200, 'Bounces twice');
  // The cry: it leans back and thrusts forward (the player's faces right, toward the foe; the foe's faces left) while
  // the rings leave its mouth ("cry": the screen draws them from its real size, see cryClip).
  const d = mon.side === 'player' ? 1 : -1;
  const c = L + w.cry;
  m.at(c).to(120, { rot: -6 * d, sx: 0.96 }, 'out').to(80, { rot: 5 * d, sx: 1.05 }, 'in3').wait(200).to(300, { rot: 0, sx: 1 }, 'el');
  b.fx({ kind: 'cue', at: c, name: 'cry' });
  b.beat(c, 'Leans back for its cry').beat(c + 120, 'Thrusts forward');
  return b.end(open + 600 + w.tail);
}

/** How a Pokémon lands when it is sent out (pass 11, Light and Heavy). */
export type SendWeight = 'light' | 'normal' | 'heavy';

/**
 * The mockup's landings: when the cry comes after the landing and how much longer the entrance runs (ms), and the
 * weights (kg) that make a Pokémon light or heavy. The mockup's light ones (Pikachu, Eevee, Pidgey, Hoothoot,
 * Charmander) weigh 22 kg or less; its heavy ones stand heavy, and anything 300 kg or more lands heavy too.
 */
export const SEND_WEIGHT = {
  light: { cry: 600, tail: 500 },
  // 260, not the mockup's 250: the landing's settle ends then, so the lean starts from a Pokémon standing still.
  normal: { cry: 260, tail: 300 },
  heavy: { cry: 300, tail: 400 },
  lightKg: 22,
  heavyKg: 300,
} as const;

/** How a Pokémon lands: heavy if it stands heavy or weighs 300 kg or more, light at 22 kg or less. */
export function sendWeight(dex: number, types: readonly string[], kg: number | undefined, dynamaxed = false): SendWeight {
  if (standKind(dex, types, dynamaxed) === 'heavy' || (kg ?? 0) >= SEND_WEIGHT.heavyKg) return 'heavy';
  return kg !== undefined && kg > 0 && kg <= SEND_WEIGHT.lightKg ? 'light' : 'normal';
}

/** A cry is big for a heavy Pokémon or one drawn taller than 230 px (pass 11). */
export const CRY = { bigH: 230, rings: 2, bigRings: 3, r: 80, bigR: 150, step: 40, gap: 90, w: 4, bigW: 6, d: 450, shakeMs: 300, shake: 5 } as const;

/**
 * Its cry's rings (pass 11), from the "cry" cue of the send-out (which leans the Pokémon back and forward): rings leave
 * its mouth sized to it, two small ones, or three wide ones and a shake ("shake") for a big one. `mon.x`/`mon.y` are
 * its feet, `width` how wide it is drawn, `color` its type's colour (the first ring). Off: nothing.
 */
export function cryClip(mon: MonSpot, width: number, color: number, big: boolean, level: ClipLevel): MotionClip {
  const b = new ClipBuilder('cry', level);
  if (level === 'off') return b.end(0);
  // The player's Pokémon faces right (toward the foe), the foe's faces left.
  const d = mon.side === 'player' ? 1 : -1;
  const mouth = { x: mon.x + d * width * 0.3, y: mon.y - mon.h * 0.68 };
  const n = big ? CRY.bigRings : CRY.rings;
  const t0 = level === 'full' ? 200 : 0;
  // The rings come out on the thrust (200 ms into the lean).
  for (let i = 0; i < n; i++) b.fx({ kind: 'ring', at: t0 + i * CRY.gap, x: mouth.x, y: mouth.y, r0: 14, r1: (big ? CRY.bigR : CRY.r) + i * CRY.step, flat: 1, d: CRY.d, color: i ? 0xffffff : color, w: big ? CRY.bigW : CRY.w });
  const end = t0 + (n - 1) * CRY.gap + CRY.d;
  if (big && level === 'full') b.fx({ kind: 'cue', at: t0, name: 'shake' });
  b.beat(t0, big ? 'Wide rings and a shake' : 'Rings from its mouth');
  return b.end(end);
}

/**
 * The ace lands (pass 15, Ace Call): announced first, it leaps off the band and comes down onto its spot, squashes
 * flat and wide, and the ground answers with dust, a gold ring and a star. "land" is when it hits (shake, sound).
 * Reduced: it appears with the squash and the ring. Off: it is simply there.
 */
export function aceLandClip(mon: MonSpot, level: ClipLevel): MotionClip {
  const b = new ClipBuilder('aceLand', level);
  const m = b.part('mon', { lift: 0, sx: 1, sy: 1, alpha: 0, shadow: 0 });
  if (level === 'off') {
    m.at(0).set({ alpha: 1, shadow: 1 });
    b.fx({ kind: 'cue', at: 0, name: 'land' });
    return b.end(0);
  }
  const gold = 0xffcb05;
  if (level === 'reduced') {
    m.at(0).to(120, { alpha: 1, shadow: 1 });
    m.at(0).set({ sx: 1.12, sy: 0.85 }).to(300, { sx: 1, sy: 1 }, 'out');
    b.fx({ kind: 'cue', at: 0, name: 'land' });
    b.fx({ kind: 'ring', at: 0, x: mon.x, y: mon.y - 10, r1: 260, flat: 0.4, d: 700, color: gold, w: 10 });
    b.beat(0, 'The ace is there');
    return b.end(400);
  }
  const hit = 360;
  // Off the band: up a little and smaller, then down onto its spot.
  m.at(0).set({ alpha: 1, lift: 0.9, sx: 0.9, sy: 0.9 }).to(140, { lift: 1.15 }, 'out').to(220, { lift: 0, sx: 1, sy: 1 }, 'in');
  m.at(hit).set({ shadow: 1 }).to(60, { sx: 1.2, sy: 0.75 }).to(400, { sx: 1, sy: 1 }, 'el');
  b.fx({ kind: 'cue', at: hit, name: 'land' });
  b.fx({ kind: 'dust', at: hit, x: mon.x, y: mon.y, n: 14 });
  b.fx({ kind: 'ring', at: hit, x: mon.x, y: mon.y - 10, r1: 260, flat: 0.4, d: 700, color: gold, w: 10 });
  b.fx({ kind: 'star', at: hit, x: mon.x, y: mon.y - mon.h / 2, size: 300, points: 12, d: 350 });
  b.beat(0, 'It leaps off the band').beat(hit, 'It lands; the ground answers');
  return b.end(hit + 460);
}

/** Exp lights (pass 23): a fallen foe's experience leaves it as lights and flies to your bar. The bar fills on "arrive". */
export function expLightsClip(from: Point, bar: Point, level: ClipLevel): MotionClip {
  const b = new ClipBuilder('expLights', level);
  if (level !== 'full') {
    b.fx({ kind: 'cue', at: 0, name: 'arrive' });
    return b.end(0);
  }
  b.fx({ kind: 'orbs', at: 0, x0: from.x, y0: from.y - 30, x1: bar.x, y1: bar.y, n: 7, gap: 60, d: 550 });
  b.fx({ kind: 'cue', at: 550, name: 'arrive' });
  b.beat(0, 'Its experience flies to your bar').beat(550, 'The bar fills');
  return b.end(910);
}

/** What just happened that your trainer reacts to (pass 19). */
export type CheerMoment = { kind: 'hit'; on: 'foe' | 'you'; superEffective: boolean } | { kind: 'faint'; on: 'foe' | 'you' };

/** A hit counts as big when it is super effective, a critical hit, or takes at least 40% of the target's HP. */
export function bigHit(damage: number, maxHp: number, effectiveness: number, crit: boolean): boolean {
  return effectiveness >= 2 || crit || (maxHp > 0 && damage >= maxHp * 0.4);
}

/** The word on your trainer's chip, as the mockup says it. */
export function cheerWord(m: CheerMoment): string {
  if (m.kind === 'faint') return m.on === 'foe' ? 'We did it!' : 'You did great.';
  return m.on === 'you' ? 'Hang in there!' : m.superEffective ? 'Yes!' : 'Nice hit!';
}

/** How long two chips stay apart: at most one every 1.2 s. */
export const CHEER_GAP = 1200;

/**
 * Trainer face chip (pass 19): your trainer's face pops in at the bottom right with a word beside it, hops once,
 * and goes. `face` is the round picture's centre; the word's right edge sits 40 px left of it.
 */
export function cheerClip(face: Point, level: ClipLevel): MotionClip {
  const b = new ClipBuilder('cheer', level);
  const f = b.part('face', { x: face.x, y: face.y, sx: 0, sy: 0, alpha: 1 });
  const w = b.part('word', { x: face.x - 40, y: face.y, sx: 0, sy: 0, alpha: 1 });
  if (level === 'off') return b.end(0);
  if (level === 'reduced') {
    f.at(0).set({ sx: 1, sy: 1, alpha: 0 }).to(150, { alpha: 1 }).wait(700).to(150, { alpha: 0 });
    w.at(0).set({ sx: 1, sy: 1, alpha: 0 }).to(150, { alpha: 1 }).wait(700).to(150, { alpha: 0 });
    b.beat(0, 'Your trainer says a word');
    return b.end(1000);
  }
  f.at(0).to(200, { s: 1 }, 'back2').to(80, { y: face.y - 8 }, 'out').to(120, { y: face.y }, 'in').wait(500).to(150, { s: 0 }, 'in');
  w.at(80).to(180, { s: 1 }, 'back2').wait(620).to(120, { s: 0 }, 'in');
  b.beat(0, 'Your trainer pops in').beat(200, 'A little hop').beat(900, 'Gone again');
  return b.end(1050);
}

/** Where the foe trainer comes from and goes back to: just off the right edge (pass 4). */
export const FOE_TRAINER_OFF = 1090;
/** When the foe trainer's ball leaves the hand, from the start of `foeThrowClip`. */
export const FOE_RELEASE = 550 + 430;

/** The foe trainer's hand at the release, for a trainer `h` px tall standing at `spot` (the ball starts here). */
export function foeHand(spot: Point, h: number): Point {
  return { x: spot.x + 50, y: spot.y + 8 - h * 0.7 };
}

/**
 * Foe trainer step-in (pass 4, trainers): the trainer skids in from the right onto the empty spot with a little dust,
 * steps back, leans into the wind-up and whips the ball (cue "release" at the hand), then leaves to the right while
 * the ball is still in the air. The trainer is never on screen during a turn. Full only; Reduced and Off throw as
 * before (no trainer).
 */
export function foeThrowClip(spot: Point, level: ClipLevel): MotionClip {
  const b = new ClipBuilder('foeThrow', level);
  const X = spot.x;
  const Y = spot.y + 8;
  const tr = b.part('tr', { x: FOE_TRAINER_OFF, y: Y, rot: 0, alpha: 1 });
  if (level !== 'full') {
    b.fx({ kind: 'cue', at: 0, name: 'release' });
    return b.end(0);
  }
  tr.at(0).to(420, { x: X }, 'out3');
  b.fx({ kind: 'dust', at: 360, x: X + 30, y: Y - 4, n: 6 });
  const wind = 550;
  tr.at(wind).to(200, { x: X + 110 }, 'out').to(140, { x: X + 126, rot: 9 }, 'out').to(90, { x: X + 92, rot: -12 }, 'in3').to(300, { rot: 0 }, 'back');
  b.fx({ kind: 'cue', at: FOE_RELEASE, name: 'release' });
  tr.at(FOE_RELEASE + 400).wait(100).to(300, { x: FOE_TRAINER_OFF + 20 }, 'in3');
  b.beat(0, 'The trainer slides in').beat(wind, 'Steps back, winds up').beat(FOE_RELEASE, 'Release').beat(FOE_RELEASE + 500, 'Steps out');
  return b.end(FOE_RELEASE + 800);
}

/**
 * Miss (pass 2): the target sees it coming. The attacker leans back and dashes at it; the target ducks and side-steps
 * away with a stretch, so the attacker overshoots and skids (dust at both feet); then both spring back to their spots.
 * Reduced: only the side-step, smaller. Off: nothing moves. Positions are the two Pokémon's feet.
 */
export function missClip(attacker: Point, target: Point, level: ClipLevel): MotionClip {
  const b = new ClipBuilder('miss', level);
  const dir = target.x >= attacker.x ? 1 : -1;
  const a = b.part('atk', { dx: 0, dy: 0, sx: 1, sy: 1 });
  const t = b.part('tgt', { dx: 0, dy: 0, sx: 1, sy: 1 });
  if (level === 'off') return b.end(0);
  if (level === 'reduced') {
    t.at(0).to(130, { dx: dir * 28 }, 'out').to(200, { dx: 0 }, 'io');
    b.beat(0, 'Side-step');
    return b.end(330);
  }
  // The attacker: wind-up away from the target, a dash to where the target stood, a held skid, back home.
  a.at(0).to(160, { dx: -dir * 18 }, 'out').to(100, { dx: target.x - dir * 150 - attacker.x, dy: target.y - 60 - attacker.y }, 'in3').wait(120).to(300, { dx: 0, dy: 0 }, 'io');
  a.at(160).to(100, { sx: 1.18, sy: 0.88 }).wait(120).to(250, { sx: 1, sy: 1 }, 'back');
  // The target: a quick step away from the attacker with a squash and stretch, a beat, then back.
  t.at(140).to(100, { dx: dir * 70 }, 'out3').wait(300).to(250, { dx: 0 }, 'back');
  t.at(140).to(80, { sx: 1.15, sy: 0.86 }).to(120, { sx: 0.95, sy: 1.05 }).to(200, { sx: 1, sy: 1 });
  b.fx({ kind: 'dust', at: 200, x: target.x + dir * 20, y: target.y, n: 5 });
  b.fx({ kind: 'dust', at: 270, x: target.x - dir * 120, y: target.y - 20, n: 6 });
  b.beat(0, 'The attacker winds up').beat(140, 'Side-step').beat(260, 'Overshoot and skid').beat(600, 'Reset');
  return b.end(800);
}

/** How a Pokémon stands between turns (pass 11, Standing): its own way of breathing and moving in place. */
export type StandKind = 'steady' | 'hover' | 'float' | 'heavy' | 'twitch' | 'sway';

/** The mockup's own picks by National Dex number, then by first type; everything else stands steady. */
const STAND_BY_DEX: Record<number, StandKind> = { 6: 'hover', 16: 'hover', 163: 'hover', 149: 'hover', 94: 'float', 150: 'float', 890: 'float', 9: 'heavy', 143: 'heavy', 812: 'heavy', 834: 'heavy', 25: 'twitch', 130: 'sway', 131: 'sway', 448: 'steady' };
const STAND_BY_TYPE: Record<string, StandKind> = { flying: 'hover', dragon: 'hover', ghost: 'float', psychic: 'float', fairy: 'float', rock: 'heavy', steel: 'heavy', ground: 'heavy', electric: 'twitch', water: 'sway', grass: 'sway', poison: 'sway' };

/** A Pokémon's way of standing: by species, then its first type; a Dynamaxed giant stands heavy. */
export function standKind(dex: number, types: readonly string[], dynamaxed = false): StandKind {
  if (dynamaxed) return 'heavy';
  return STAND_BY_DEX[dex] ?? STAND_BY_TYPE[types[0] ?? ''] ?? 'steady';
}

/**
 * One loop of standing, as the mockup's numbers: `ms` per breath, the height and width at the top of the breath
 * (1 = as drawn), a rise in px, a tilt either way in degrees, and a hop (`hop` px every `hopEvery` ms).
 * `x` moves are left out: the game's attack lunges move the Pokémon sideways.
 */
export interface StandLook {
  ms: number;
  sy: number;
  sx: number;
  rise: number;
  tilt: number;
  tiltMs: number;
  hop: number;
  hopEvery: number;
}

export function standLook(kind: StandKind): StandLook {
  const still = { rise: 0, tilt: 0, tiltMs: 0, hop: 0, hopEvery: 0 };
  switch (kind) {
    case 'hover':
      return { ...still, ms: 1500, sy: 1.02, sx: 1, rise: 8 };
    case 'float':
      return { ...still, ms: 2600, sy: 1, sx: 1, rise: 12, tilt: 2, tiltMs: 2600 };
    case 'heavy':
      return { ...still, ms: 2800, sy: 1.04, sx: 0.98 };
    case 'twitch':
      return { ...still, ms: 1100, sy: 1.035, sx: 1, hop: 9, hopEvery: 2600 };
    case 'sway':
      return { ...still, ms: 1900, sy: 1.025, sx: 1, tilt: 2.5, tiltMs: 2300 };
    default:
      return { ...still, ms: 1900, sy: 1.03, sx: 0.988 };
  }
}

/** When the shiny's stars collapse onto it (cue "glint": the glint and the arena brightening) and the chip leaves. */
export const SHINY_GLINT = 850;
export const SHINY_CHIP = 1000;

/**
 * Shiny entrance (pass 11): six stars circle in around the Pokémon and collapse onto it; at the collapse a flash,
 * a glint across the sprite and the arena brightening (cue "glint") and three rings; then a "SHINY" chip springs
 * up over it and flies to its name plate (cue "chip"; the screen moves the chip, which needs the plate's place).
 * `mon` is the middle of the Pokémon. Reduced: only the chip (cue at 0). Off: only the chip, no motion.
 */
export function shinyClip(mon: Point, level: ClipLevel): MotionClip {
  const b = new ClipBuilder('shiny', level);
  const stars = Array.from({ length: 6 }, (_, i) => b.part(`star${i}`, { x: mon.x, y: mon.y, sx: 1, sy: 1, alpha: 0 }));
  if (level !== 'full') {
    b.fx({ kind: 'cue', at: 0, name: 'chip' });
    return b.end(0);
  }
  // Each star spirals in on an ellipse that shrinks from 170 x 110 to 20 x 10 px over 0.8 s, 60° apart.
  const steps = 10;
  stars.forEach((s, i) => {
    const at = (u: number): Point => ({ x: mon.x + (170 - 150 * u) * Math.cos(u * 6 + i * 1.047), y: mon.y + (110 - 100 * u) * Math.sin(u * 6 + i * 1.047) });
    const p0 = at(0);
    s.at(0).set({ alpha: 1, x: p0.x, y: p0.y });
    for (let k = 1; k <= steps; k++) {
      const p = at(k / steps);
      s.to(800 / steps, { x: p.x, y: p.y }, 'lin');
    }
    s.to(100, { s: 2, alpha: 0 });
  });
  b.fx({ kind: 'cue', at: SHINY_GLINT, name: 'glint' });
  b.fx({ kind: 'flash', at: SHINY_GLINT, d: 300, alpha: 0.6 });
  [0xffffff, 0xffcb05, 0xffffff].forEach((color, i) => b.fx({ kind: 'ring', at: SHINY_GLINT + i * 80, x: mon.x, y: mon.y, r1: 150 + i * 50, flat: 1, d: 500, color, w: 5 }));
  b.fx({ kind: 'cue', at: SHINY_CHIP, name: 'chip' });
  b.beat(0, 'Six stars circle in').beat(SHINY_GLINT, 'Collapse: glint, the arena brightens').beat(SHINY_CHIP, 'Star chip flies to the plate');
  return b.end(SHINY_CHIP + 1300);
}

/** When the wild Pokémon's colour floods in with its cry, and when its plate flies in (pass 5, Wild Encounter). */
export const WILD_CRY = 1150;
export const WILD_PLATE = 1350;
/** The nine dark bars that cover the screen and pull apart: 980 x 61 px, 60 px apart. */
export const WILD_BARS = 9;

/**
 * A wild Pokémon appears (pass 5): two white flashes, the screen is nine dark bars that pull apart left and right,
 * the Pokémon slides in from the right as a black shape, its colour floods in with its cry (three rings) and it hops,
 * then its plate flies in. `foe` is its feet; `h` its height on screen (the rings go round its middle). Parts: `foe` (the Pokémon; `black` is its silhouette) and `bar0`..`bar8` (x, y).
 * Reduced: the shape is just there and its colour fades in. Off: nothing moves.
 */
export function wildEntranceClip(foe: Point & { h: number }, level: ClipLevel): MotionClip {
  const b = new ClipBuilder('wild-entrance', level);
  const f = b.part('foe', { dx: 0, dy: 0, sx: 1, sy: 1, black: 0, shadow: 1 });
  const bars = Array.from({ length: WILD_BARS }, (_, i) => b.part(`bar${i}`, { x: 480, y: 30 + i * 60, alpha: level === 'full' ? 1 : 0 }));
  if (level === 'off') {
    b.fx({ kind: 'cue', at: 0, name: 'cry' }).fx({ kind: 'cue', at: 0, name: 'plate' });
    return b.end(0);
  }
  if (level === 'reduced') {
    f.at(0).set({ black: 1 }).to(300, { black: 0 });
    b.fx({ kind: 'cue', at: 0, name: 'cry' }).fx({ kind: 'cue', at: 300, name: 'plate' });
    b.beat(0, 'Colour and cry');
    return b.end(300);
  }
  b.fx({ kind: 'flash', at: 0, d: 100, alpha: 1 }).fx({ kind: 'flash', at: 160, d: 100, alpha: 1 });
  bars.forEach((bar, i) => bar.at(320 + i * 20).to(340, { x: i % 2 ? 1500 : -540 }, 'in3'));
  f.at(0).set({ dx: 1150 - foe.x, black: 1 }).at(500).to(550, { dx: 0 }, 'out3');
  f.at(WILD_CRY).to(300, { black: 0 });
  // Its contact shadow waits on the spot until it has nearly arrived.
  f.at(0).set({ shadow: 0 }).at(850).to(200, { shadow: 1 });
  b.fx({ kind: 'cue', at: WILD_CRY, name: 'cry' });
  for (let i = 0; i < 3; i++) b.fx({ kind: 'ring', at: 1200 + i * 100, x: foe.x - 40, y: foe.y - foe.h / 2 - 10, r1: 70 + i * 30, flat: 1, d: 400, color: 0xffffff, w: 4 });
  // The hop with the cry: a squash, up 22 px with a stretch, down, and a springy settle.
  f.at(1200).to(60, { sy: 0.9, sx: 1.08 }).to(140, { dy: -22, sy: 1.06 }, 'out').to(120, { dy: 0 }, 'in').to(200, { sy: 1, sx: 1 }, 'el');
  b.fx({ kind: 'cue', at: WILD_PLATE, name: 'plate' });
  b.beat(0, 'Two flashes').beat(320, 'Bars pull apart').beat(500, 'Dark shape slides in').beat(WILD_CRY, 'Colour and cry').beat(WILD_PLATE, 'The plate flies in');
  return b.end(1720);
}

/**
 * Level up (pass 2, EXP and Level Up), from the moment the bar is full: a pale blue flash, the level ticks over on the
 * plate (cue `tick`), the Pokémon does two happy hops with dust on each landing, and a yellow LEVEL stamp springs out
 * over it, hangs and lifts away. `me` is its feet; `h` its height on screen. Parts: `mon`, `stamp` (x, y, sx, sy, alpha).
 * Reduced: the stamp shows and fades, no flash, hops or dust. Off: only the tick.
 */
export function levelUpClip(me: Point & { h: number }, level: ClipLevel): MotionClip {
  const b = new ClipBuilder('level-up', level);
  const m = b.part('mon', { dx: 0, dy: 0, sx: 1, sy: 1 });
  const at = { x: me.x + 40, y: me.y - me.h / 2 - 120 };
  const st = b.part('stamp', { x: at.x, y: at.y, sx: 0.4, sy: 0.4, alpha: 0 });
  b.fx({ kind: 'cue', at: 0, name: 'tick' });
  if (level === 'off') {
    st.at(0).set({ sx: 1, sy: 1 });
    return b.end(0);
  }
  if (level === 'reduced') {
    st.at(0).set({ sx: 1, sy: 1 }).to(150, { alpha: 1 }).wait(900).to(300, { alpha: 0 });
    b.beat(0, 'The level ticks over');
    return b.end(1350);
  }
  b.fx({ kind: 'flash', at: 0, d: 250, alpha: 0.45, color: 0x9ae4ff });
  // Two hops: a squash, up 46 px, down; a deeper squash, up 30 px, down; a last squash and a springy settle.
  m.at(100)
    .to(70, { sy: 0.86, sx: 1.1 })
    .to(160, { dy: -46, sy: 1.1, sx: 0.94 }, 'out')
    .to(140, { dy: 0 }, 'in')
    .to(60, { sy: 0.84, sx: 1.14 })
    .to(140, { dy: -30, sy: 1.06, sx: 0.96 }, 'out')
    .to(120, { dy: 0 }, 'in')
    .to(50, { sy: 0.9, sx: 1.08 })
    .to(200, { sy: 1, sx: 1 }, 'el');
  b.fx({ kind: 'dust', at: 470, x: me.x, y: me.y, n: 6 });
  b.fx({ kind: 'dust', at: 800, x: me.x, y: me.y, n: 5 });
  st.at(100).set({ alpha: 1 }).to(140, { sx: 1, sy: 1 }, 'back2').wait(1000).to(300, { y: at.y - 40, alpha: 0 }, 'in');
  b.beat(0, 'Flash, number ticks over').beat(100, 'Two hops').beat(100, 'LEVEL stamp');
  return b.end(1700);
}

/** How far a hit throws the target (pass 2), and how much further a super effective or critical one does (pass 12). */
export const HIT_KNOCK = 30;
export const HIT_KNOCK_BIG = 46;

/** The light a hit throws (pass 18): its radius on the body and on the floor, for a hit and for a big hit. */
export const HIT_LIGHT = { body: 190, bodyBig: 300, floor: 220, floorBig: 330 };

/**
 * Hit (pass 2, 12, 17, 18; the target's side of Attack and Hit): the target goes white for a beat and squashes thin and
 * tall, is thrown back away from the attacker (further on a big hit) and springs back to its spot, with dust where it
 * was thrown to. The hit is a light in the move's colour: a glow on the body (`light`) and a pool on the floor
 * (`floor`); a big hit also lights the other Pokémon (cue `glow`), and a sharp one (critical, super effective or
 * 60% of its HP) flashes a white star where it lands. `target` is its feet, `h` its height; `away` is +1 when it is
 * thrown to the right (the foe) and -1 to the left (yours). Full only: Reduced and Off keep the battle's own blink.
 */
export function hitClip(target: Point & { h: number }, away: 1 | -1, o: { big: boolean; sharp: boolean; /** Pass 12 power (`hitPower`): above 0 the hit throws it further, with two dust clouds. */ p?: number }, level: ClipLevel): MotionClip {
  const b = new ClipBuilder('hit', level);
  const m = b.part('mon', { dx: 0, dy: 0, sx: 1, sy: 1, white: 0 });
  const mid = { x: target.x, y: target.y - target.h / 2 };
  const light = b.part('light', { x: mid.x, y: mid.y, sx: 1, sy: 1, alpha: 0 });
  const floor = b.part('floor', { alpha: 0 });
  if (level !== 'full') return b.end(0);
  const k = (o.big ? HIT_KNOCK_BIG : HIT_KNOCK) * away;
  m.at(0).set({ white: 1 }).wait(80).to(100, { white: 0 });
  m.at(0).set({ sx: 0.8, sy: 1.14 }).wait(70).to(340, { sx: 1, sy: 1 }, 'el');
  const p = o.p ?? 0;
  if (p > 0) {
    // Pass 12: a normal or heavy hit throws it a body-width or more, with dust halfway and where it lands.
    const far = (HIT_THROW.base + HIT_THROW.per * p) * away;
    m.at(70).to(140, { dx: far }, 'out3').wait(100).to(400, { dx: 0 }, 'back');
    b.fx({ kind: 'dust', at: 120, x: target.x + far * 0.5, y: target.y, n: 5 });
    b.fx({ kind: 'dust', at: 200, x: target.x + far, y: target.y, n: 7 });
  } else {
    m.at(70).to(90, { dx: k }, 'out').to(300, { dx: 0 }, 'back');
    b.fx({ kind: 'dust', at: 160, x: target.x + k, y: target.y, n: 4 });
  }
  light.at(0).set({ alpha: 1, sx: 0.3, sy: 0.3 }).to(100, { sx: 1, sy: 1 }, 'out3').to(450, { alpha: 0 }, 'in');
  floor.at(0).set({ alpha: 0.9 }).to(600, { alpha: 0 }, 'in');
  if (o.big) b.fx({ kind: 'cue', at: 0, name: 'glow' });
  if (o.sharp) b.fx({ kind: 'star', at: 0, x: mid.x, y: mid.y, size: 340, points: 14, d: 120 });
  b.beat(0, 'Hit-stop: white, squash, the light').beat(70, 'Thrown back').beat(160, 'Springs home');
  return b.end(p > 0 ? 710 : 600);
}

/**
 * The critical hit (pass 12): at the moment of contact everything stops for 280 ms. The target is white, a white star
 * bursts on it and ten yellow rays shoot out from it; cue `freeze` lets the screen close its black bars, jump the camera
 * in and drain the colour. Then the hit itself lands (`hitClip`). Full only: Reduced and Off keep the plain hit.
 */
export const CRIT_FREEZE = {
  ms: 280,
  bar: 70, barIn: 60, barHold: 900, barOut: 200,
  zoom: 1.32, camIn: 60, camHold: 320, camOut: 400,
  drainIn: 40, drainHold: 240, drainOut: 200, dim: 0.6,
  star: 200, rays: 10, ray: 300,
} as const;

export function critFreezeClip(mid: Point, level: ClipLevel): MotionClip {
  const b = new ClipBuilder('crit-freeze', level);
  const m = b.part('mon', { white: 0 });
  if (level !== 'full') return b.end(0);
  const F = CRIT_FREEZE;
  m.at(0).set({ white: 1 }).wait(F.ms).set({ white: 0 });
  b.fx({ kind: 'cue', at: 0, name: 'freeze' });
  b.fx({ kind: 'star', at: 0, x: mid.x, y: mid.y, size: F.star, points: 10, d: F.ms });
  for (let i = 0; i < F.rays; i++) {
    const a = i * ((Math.PI * 2) / F.rays);
    b.fx({ kind: 'streak', at: 20, x1: mid.x, y1: mid.y, x2: mid.x + F.ray * Math.cos(a), y2: mid.y + F.ray * Math.sin(a), w: 4, color: 0xffcb05, d: 100, hold: 160, out: 100 });
  }
  b.beat(0, 'Contact: everything stops').beat(20, 'Bars close, the camera jumps, the colour drains').beat(F.ms, 'The hit lands');
  return b.end(F.ms);
}

/**
 * The word stamps after a hit (pass 5 "Numbers and Stamps"): a critical hit's yellow CRITICAL HIT! slams on first, a
 * super effective hit's red stamp slams on 120 ms later just under it; not very effective and no effect settle in
 * softly. They sit beside the target: left of the foe near the top, right of your Pokémon above its middle.
 */
export const HIT_STAMPS: Record<string, { word: string; fill: string; ink: string; soft: boolean; at: number; dy: number }> = {
  crit: { word: 'CRITICAL HIT!', fill: '#ffcb05', ink: '#131c36', soft: false, at: 0, dy: -48 },
  super: { word: 'SUPER EFFECTIVE!', fill: '#e3350d', ink: '#ffffff', soft: false, at: 120, dy: 0 },
  weak: { word: 'Not very effective…', fill: '#2a75bb', ink: '#ffffff', soft: true, at: 120, dy: 0 },
  immune: { word: 'NO EFFECT', fill: '#131c36', ink: '#ffffff', soft: true, at: 120, dy: 0 },
};

/** Where a hit's stamps sit: `mon` is the target's feet x and body middle y. */
export function hitStampSpot(side: 'player' | 'enemy', mon: Point): Point {
  return side === 'enemy' ? { x: mon.x - 170, y: 134 } : { x: mon.x + 210, y: mon.y - 70 };
}

/**
 * Multi-hit (pass 12): a combo counter beside the target ticks up with every hit and grows (×1 at 1.5 then 1, each
 * next one 0.15 and 0.12 bigger), the screen shakes 3 px more each hit, and at the end the counter lifts away, a
 * yellow HIT N TIMES! stamp slams on and the total slams in as one big number (the per-hit numbers stay away).
 * `dx`/`dy` place the counter against the target's feet (the mockup's 700,120 by a foe standing at 752,232); the stamp sits `stampDx` from the foe, at `stampY`.
 */
export const COMBO = { dx: -52, dy: -112, size: 60, pop: 1.5, popPer: 0.15, rest: 1, restPer: 0.12, upMs: 40, downMs: 140, shake: 3, outMs: 150, lift: 20, stampDx: -112, stampY: 134 } as const;

/** The counter's size for hit `k` (1-based): how big it pops and where it settles. */
export function comboScale(k: number): { pop: number; rest: number } {
  const i = Math.max(0, k - 1);
  return { pop: COMBO.pop + COMBO.popPer * i, rest: COMBO.rest + COMBO.restPer * i };
}

/** What the turn's multi-hit moves show: each hit's damage event gets its count, the `hits` line gets the total. */
export type ComboStep = { k: number; side: 'player' | 'enemy' } | { count: number; total: number; side: 'player' | 'enemy' };

export function comboPlan(events: readonly ({ type: string } & Record<string, unknown>)[]): Map<number, ComboStep> {
  const plan = new Map<number, ComboStep>();
  let start = 0;
  events.forEach((e, i) => {
    if (e.type === 'move') start = i + 1;
    if (e.type !== 'hits' || typeof e.count !== 'number' || e.count < 2) return;
    const side = e.side as 'player' | 'enemy';
    let k = 0;
    let total = 0;
    for (let j = start; j < i; j++) {
      const d = events[j]!;
      if (d.type !== 'damage' || d.side !== side) continue;
      k += 1;
      total += Number(d.amount) || 0;
      plan.set(j, { k, side });
    }
    if (k >= 2) plan.set(i, { count: e.count, total, side });
    else for (let j = start; j < i; j++) plan.delete(j);
  });
  return plan;
}

/**
 * Priority move (pass 12): a yellow FIRST! tag snaps onto the user before anything else on the turn can start (from
 * 2.4 times its size, tilted 8 degrees, in 100 ms), holds 0.9 s and lifts away. It sits 30 px toward the foe and
 * 150 px above the user's middle.
 */
export const FIRST_TAG = { dx: 30, dy: -150, from: 2.4, tilt: -8, inMs: 100, hold: 900, lift: 0 } as const;

/** One-hit KO (pass 12): the red ONE-HIT KO! stamp slams on left of the foe (the mockup's 600,134 by a foe at 752). */
export const OHKO_STAMP = { dx: -152, y: 134 } as const;

/** Pass 12 power tiers: how far a hit throws (px: base + per x power) and how hard it shakes the field. */
export const HIT_THROW = { base: 34, per: 60, shake: 5, shakePer: 8, heavyAt: 0.8, strong: 1.3 } as const;

/**
 * How hard a hit lands (pass 12 "Power Tiers"), from the share of its HP it took: under 30% it is a tap (weak: the
 * plain recoil, no shake); from 30% to 90% it throws further and shakes harder (normal); near the top it is heavy (the
 * number is twice the size). A critical or super effective hit counts 1.3 times (the mockup's strong hits).
 */
export function hitPower(amount: number, max: number, strong: boolean): { tier: 'weak' | 'normal' | 'heavy'; p: number; shake: number } {
  const pct = (amount / Math.max(1, max)) * 100;
  const p = Math.min(1, Math.max(0, (pct - 30) / 60)) * (strong ? HIT_THROW.strong : 1);
  const tier = p <= 0 ? 'weak' : p >= HIT_THROW.heavyAt ? 'heavy' : 'normal';
  return { tier, p, shake: p > 0 ? HIT_THROW.shake + HIT_THROW.shakePer * p : 0 };
}

/** The heal's ten plus-signs (pass 3): where each starts and ends, against the Pokémon's feet, and its size in px. */
export const HEAL_PLUSES: readonly { dx: number; y0: number; y1: number; size: number }[] = [
  { dx: -62, y0: 12, y1: 214, size: 38 },
  { dx: 48, y0: 40, y1: 182, size: 30 },
  { dx: -18, y0: 4, y1: 248, size: 44 },
  { dx: 84, y0: 26, y1: 230, size: 28 },
  { dx: -88, y0: 52, y1: 176, size: 34 },
  { dx: 12, y0: 30, y1: 260, size: 40 },
  { dx: 66, y0: 8, y1: 200, size: 46 },
  { dx: -40, y0: 58, y1: 238, size: 26 },
  { dx: 30, y0: 18, y1: 172, size: 36 },
  { dx: -74, y0: 36, y1: 252, size: 32 },
];
/** The size the plus-sign picture is drawn at; each plus is scaled from it. */
export const HEAL_PLUS_SIZE = 46;

/**
 * Healing (pass 3): green plus-signs rise through the Pokémon, it brightens green and gives one small hop, and a green
 * ring spreads on the ground. `me` is its feet. Parts: `mon` (`green` is its tint), `plus0`..`plus9` (x, y, sx, sy, alpha).
 * Reduced: the green glow and the ring. Off: nothing.
 */
export function healClip(me: Point, level: ClipLevel): MotionClip {
  const b = new ClipBuilder('heal', level);
  const m = b.part('mon', { dx: 0, dy: 0, sx: 1, sy: 1, green: 0 });
  const pluses = HEAL_PLUSES.map((p, i) => b.part(`plus${i}`, { x: me.x + p.dx, y: me.y - p.y0, sx: p.size / HEAL_PLUS_SIZE, sy: p.size / HEAL_PLUS_SIZE, alpha: 0 }));
  if (level === 'off') return b.end(0);
  m.at(0).to(250, { green: 0.6 }).to(500, { green: 0 });
  b.fx({ kind: 'ring', at: 0, x: me.x, y: me.y - 8, r1: 120, flat: 0.4, d: 400, color: 0x7dffa0, w: 4 });
  if (level === 'reduced') {
    b.beat(0, 'Green glow');
    return b.end(750);
  }
  pluses.forEach((p, i) => {
    const d = HEAL_PLUSES[i]!;
    p.at(i * 60).set({ alpha: 1 }).to(700, { y: me.y - d.y1 }, 'out');
    p.at(400 + i * 60).to(300, { alpha: 0 });
  });
  m.at(300).to(70, { sy: 0.9, sx: 1.07 }).to(150, { dy: -22, sy: 1.05, sx: 0.97 }, 'out').to(130, { dy: 0 }, 'in').to(200, { sy: 1, sx: 1 }, 'el');
  b.beat(0, 'Plus-signs rise').beat(300, 'Hop');
  return b.end(1300);
}

/**
 * Flinch (pass 11): the moment the move never comes. Times in ms from the "flinched" line: `bang` is the "!" over its
 * head, `stamp` the FLINCHED stamp, `sweat` the sweat drop; the drop falls `drop` px. Positions are from its feet
 * and height (the mockup's 60 px out and 150 above the middle of a Pokémon about 200 px tall).
 */
export const FLINCH = { bang: 200, stamp: 400, sweat: 500, sweatMs: 600, drop: 40, bangDx: 60, sweatDx: 50 } as const;

/**
 * Flinch (pass 11): it starts its lunge (30 px toward the foe), jerks to a stop, pulls its head down with a shiver,
 * backs up two steps and only then settles back where it stood. Reduced: one small step back and home. Off: nothing
 * moves (the line says it).
 */
export function flinchClip(mon: MonSpot, level: ClipLevel): MotionClip {
  const b = new ClipBuilder('flinch', level);
  const m = b.part('mon', { dx: 0, sx: 1, sy: 1 });
  if (level === 'off') return b.end(0);
  const d = mon.side === 'player' ? 1 : -1;
  if (level === 'reduced') {
    m.at(0).to(150, { dx: -10 * d }, 'out').wait(300).to(300, { dx: 0 }, 'io');
    b.fx({ kind: 'cue', at: 0, name: 'stamp' });
    b.beat(0, 'Steps back');
    return b.end(750);
  }
  m.at(100).to(100, { dx: 30 * d }, 'out').to(40, { dx: 22 * d });
  m.at(220).to(60, { sy: 0.86, sx: 1.08 }, 'out');
  m.at(280).to(40, { dx: 22 * d - 4 }).to(40, { dx: 22 * d + 4 }).to(40, { dx: 22 * d - 4 }).to(200, { dx: 22 * d, sy: 0.94, sx: 1.02 });
  m.at(600).to(150, { dx: 6 * d }, 'out').wait(100).to(150, { dx: -10 * d }, 'out').wait(400).to(300, { dx: 0 }, 'io');
  m.at(1400).to(300, { sy: 1, sx: 1 }, 'el');
  b.fx({ kind: 'cue', at: FLINCH.bang, name: 'bang' });
  b.fx({ kind: 'cue', at: FLINCH.stamp, name: 'stamp' });
  b.fx({ kind: 'cue', at: FLINCH.sweat, name: 'sweat' });
  b.beat(100, 'Starts to lunge').beat(220, 'Jerks to a stop').beat(600, 'Backs up two steps').beat(1400, 'Settles');
  return b.end(1700);
}

/**
 * Worn out (pass 11): under a fifth of its HP the Pokémon itself shows it. It slumps (down `dy` px, tipped `tilt`
 * degrees, over `inMs`), a little shorter and wider (`sy`, `sx`), breathes fast and shallow (one breath in `breathMs`),
 * its colour dulls (`br` brightness, `sat` saturation), and a sweat drop flicks off every `sweatEvery` ms, arcing
 * `sweatDx` px out and `sweatFall` px down in `sweatMs`. Healed, it hops `hop` px, straightens with a shake and its
 * colour comes back over `outMs`.
 */
export const WORN = { dy: 8, tilt: 5, inMs: 400, sy: 0.94, sx: 1.02, breathMs: 620, br: 0.88, sat: 0.8, sweatEvery: 450, sweatDx: 50, sweatFall: 30, sweatArc: 30, sweatMs: 400, hop: 10, shake: 5, outMs: 300 } as const;

/** Winner's moment (pass 11): when the "free" cue lets the battle go on (ms), and where the note and heart pop. */
export const WIN = { free: 1300, noteAt: 500, heartAt: 1400, noteDx: 90, noteDy: -110, heartDx: -80, heartDy: -60, lean: 18, leanRot: 5 } as const;

/**
 * Winner's moment (pass 11): after a knock-out your Pokémon gets a second to itself. It hops twice (40 px, then 54 px
 * spinning once on the way), lands with a squash and dust, a note pops out ("note") with a spray of gold stars, then
 * it leans toward you and a heart pops ("heart"). A heavy one stamps once instead of hopping: a crouch, a short rise
 * and a hard landing ("stamp": the screen answers). `mon.y` is its feet. Reduced: one small hop and the note.
 * Off: nothing. "free" is when the battle may go on (the lean finishes while the EXP comes).
 */
export function winClip(mon: MonSpot, heavy: boolean, level: ClipLevel): MotionClip {
  const b = new ClipBuilder('win', level);
  const m = b.part('mon', { dy: 0, dx: 0, rot: 0, sx: 1, sy: 1 });
  if (level === 'off') {
    b.fx({ kind: 'cue', at: 0, name: 'free' });
    return b.end(0);
  }
  if (level === 'reduced') {
    m.at(0).to(140, { dy: -20 }, 'out').to(140, { dy: 0 }, 'in');
    b.fx({ kind: 'cue', at: 140, name: 'note' });
    b.fx({ kind: 'cue', at: 400, name: 'free' });
    b.beat(0, 'A small hop and a note');
    return b.end(400);
  }
  const top = mon.y - mon.h * 0.55;
  if (heavy) {
    m.at(0).to(120, { sy: 0.9, sx: 1.06 }, 'out').to(160, { dy: -24, sy: 1.05, sx: 0.97 }, 'out').to(120, { dy: 0 }, 'in').to(60, { sy: 0.86, sx: 1.1 }).to(300, { sy: 1, sx: 1 }, 'el');
    b.fx({ kind: 'cue', at: 400, name: 'stamp' });
    b.fx({ kind: 'dust', at: 400, x: mon.x - 40, y: mon.y, n: 8, big: 1.3 });
    b.fx({ kind: 'dust', at: 400, x: mon.x + 40, y: mon.y, n: 8, big: 1.3 });
    b.beat(0, 'Crouches').beat(400, 'Stamps once');
  } else {
    m.at(0).to(140, { dy: -40 }, 'out').to(140, { dy: 0 }, 'in').to(50, { sy: 0.92 }).to(140, { dy: -54, sy: 1.04 }, 'out');
    m.at(330).to(280, { rot: 360 }, 'io');
    m.at(470).to(160, { dy: 0 }, 'in').to(60, { sy: 0.88, sx: 1.08 }).to(300, { sy: 1, sx: 1 }, 'el');
    m.at(990).set({ rot: 0 });
    b.fx({ kind: 'dust', at: 300, x: mon.x, y: mon.y, n: 5 });
    b.fx({ kind: 'dust', at: 660, x: mon.x, y: mon.y, n: 9 });
    b.beat(0, 'Two hops and a spin');
  }
  b.fx({ kind: 'cue', at: WIN.noteAt, name: 'note' });
  // The gold stars round it as it lands (the mockup's spread, fixed so it is the same every time).
  const spread = [[-0.8, -0.6], [0.7, -0.9], [-0.3, 0.2], [0.9, 0.1], [-0.95, -0.1], [0.2, -1]] as const;
  spread.forEach(([sx, sy], i) => b.fx({ kind: 'star', at: 660 + i * 50, x: mon.x + sx * 110, y: top + sy * 70, size: 30, points: 4, inner: 0.15, color: 0xffcb05, d: 300 }));
  const d = mon.side === 'player' ? 1 : -1;
  m.at(WIN.free).to(300, { dx: -WIN.lean * d, rot: -WIN.leanRot * d }, 'io').wait(500).to(300, { dx: 0, rot: 0 }, 'io');
  b.fx({ kind: 'cue', at: WIN.free, name: 'free' });
  b.fx({ kind: 'cue', at: WIN.heartAt, name: 'heart' });
  b.beat(WIN.noteAt, 'A note pops out').beat(WIN.free, 'Leans toward you').beat(WIN.heartAt, 'A heart');
  return b.end(WIN.free + 1100);
}

/** Toughed it out (pass 11): the moments ("free" lets the battle go on) and where the heart pops. */
export const TOUGH = { skid: 40, spark: 650, plant: 1400, stamp: 1500, heart: 2000, glow: 0xffcb05, heartDx: -70, heartDy: -70 } as const;

/**
 * Toughed it out (pass 11): its bar has caught at a single point. It skids back 40 px with dust, drops low and shakes
 * ("spark": the bar catches with a spark), then plants its feet: it springs up, steps back home and glows gold for a
 * heartbeat ("glow"), the HUNG ON! stamp lands ("stamp") and a heart floats up toward you ("heart"). Reduced: it dips
 * and stands, with the stamp. Off: nothing.
 */
export function toughClip(mon: MonSpot, level: ClipLevel): MotionClip {
  const b = new ClipBuilder('tough', level);
  const m = b.part('mon', { dx: 0, sy: 1 });
  if (level === 'off') {
    b.fx({ kind: 'cue', at: 0, name: 'free' });
    return b.end(0);
  }
  if (level === 'reduced') {
    m.at(0).to(200, { sy: 0.85 }, 'out').to(250, { sy: 1 }, 'out');
    b.fx({ kind: 'cue', at: 0, name: 'stamp' });
    b.fx({ kind: 'cue', at: 450, name: 'free' });
    b.beat(0, 'Dips and stands');
    return b.end(450);
  }
  const d = mon.side === 'player' ? 1 : -1;
  const back = -TOUGH.skid * d;
  m.at(0).to(300, { dx: back }, 'out3');
  b.fx({ kind: 'dust', at: 50, x: mon.x + back + 30 * d, y: mon.y, n: 10 });
  m.at(300).to(300, { sy: 0.8 }, 'out');
  // It shakes where it crouches: seven quick shivers.
  m.at(600);
  for (let i = 0; i < 7; i++) m.to(33, { dx: back + 3 }).to(33, { dx: back - 3 }).to(34, { dx: back });
  b.fx({ kind: 'cue', at: TOUGH.spark, name: 'spark' });
  m.at(TOUGH.plant).to(200, { sy: 1.06 }, 'back').to(200, { sy: 1 });
  m.at(TOUGH.plant).to(300, { dx: 0 }, 'back');
  b.fx({ kind: 'cue', at: TOUGH.plant, name: 'glow' });
  b.fx({ kind: 'cue', at: TOUGH.plant, name: 'free' });
  b.fx({ kind: 'cue', at: TOUGH.stamp, name: 'stamp' });
  b.fx({ kind: 'cue', at: TOUGH.heart, name: 'heart' });
  b.beat(0, 'Skids back').beat(300, 'Drops low and shakes').beat(TOUGH.spark, 'The bar catches').beat(TOUGH.plant, 'Plants its feet and glows').beat(TOUGH.heart, 'A heart for you');
  return b.end(TOUGH.plant + 1000);
}

/**
 * Waiting on you (pass 11): how long the command menu sits with no input before your Pokémon notices (`idleMs`), and
 * the look of it: it glances round (`glance` degrees, `dx` px) as a yellow "?" pops at (`askDx`, `askDy`) from its
 * middle, then bounces on its feet twice (`hop` px) with a puff of dust each time and the message box nudges.
 */
export const WAIT = { idleMs: 6000, glance: 8, dx: -10, ask: 150, askDx: -70, askDy: -150, hops: 1100, hop: 16, nudge: 1.04 } as const;

/**
 * Waiting on you (pass 11): your Pokémon glances round with a "?" ("ask"), settles, then bounces twice ("nudge": the
 * message box nudges) with dust. Never blocks input: it is only a look. Reduced: just the "?". Off: nothing.
 */
export function waitClip(mon: MonSpot, level: ClipLevel): MotionClip {
  const b = new ClipBuilder('wait', level);
  const m = b.part('mon', { dx: 0, dy: 0, rot: 0 });
  if (level === 'off') return b.end(0);
  b.fx({ kind: 'cue', at: level === 'full' ? WAIT.ask : 0, name: 'ask' });
  if (level === 'reduced') {
    b.beat(0, 'A "?"');
    return b.end(700);
  }
  m.at(0).to(200, { rot: WAIT.glance, dx: WAIT.dx }, 'io').wait(500).to(200, { rot: 0, dx: 0 }, 'io');
  m.at(WAIT.hops).to(100, { dy: -WAIT.hop }, 'out').to(100, { dy: 0 }, 'in').to(100, { dy: -WAIT.hop }, 'out').to(100, { dy: 0 }, 'in');
  b.fx({ kind: 'cue', at: WAIT.hops, name: 'nudge' });
  b.fx({ kind: 'dust', at: WAIT.hops + 200, x: mon.x, y: mon.y, n: 3 });
  b.fx({ kind: 'dust', at: WAIT.hops + 400, x: mon.x, y: mon.y, n: 3 });
  b.beat(0, 'Glances round, "?"').beat(WAIT.hops, 'Bounces twice');
  return b.end(WAIT.hops + 500);
}
