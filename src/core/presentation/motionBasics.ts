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
export function sendClip(mon: MonSpot, from: Point, level: ClipLevel): MotionClip {
  const b = new ClipBuilder('send', level);
  const open = sendOpenAt(level);
  const m = b.part('mon', { dy: 0, sx: 0, sy: 0, white: 0, shadow: 0 });
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
    b.beat(0, 'Ball thrown').beat(open, 'Appears');
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
  return b.end(open + 600);
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
