import { describe, expect, it } from 'vitest';
import { ClipBuilder, clipEnd, EASES, fxAllowed, sampleClip, type ClipLevel, type MotionClip } from '../../src/core/presentation/motionClip';
import { aceLandClip, HEAL_PLUS_SIZE, HEAL_PLUSES, healClip, HIT_KNOCK, HIT_KNOCK_BIG, hitClip, hitPower, HIT_THROW, CRIT_FREEZE, critFreezeClip, HIT_STAMPS, hitStampSpot, levelUpClip, WILD_BARS, WILD_CRY, WILD_PLATE, wildEntranceClip, SHINY_CHIP, SHINY_GLINT, shinyClip, standKind, standLook, missClip, FOE_RELEASE, FOE_TRAINER_OFF, foeHand, foeThrowClip, bigHit, CHEER_GAP, cheerClip, cheerWord, expLightsClip, faintClip, recallBallSpot, recallClip, sendClip, sendOpenAt, throwFromSpot, type MonSpot } from '../../src/core/presentation/motionBasics';

const ME: MonSpot = { x: 312, y: 428, h: 180, side: 'player' };
const FOE: MonSpot = { x: 648, y: 240, h: 150, side: 'enemy' };
const LEVELS: ClipLevel[] = ['full', 'reduced', 'off'];
const beats = (c: MotionClip) => c.beats.map((b) => [b.at, b.name]);

describe('motion clips: the timeline sampler', () => {
  it('walks steps like the mockup kit: each `to` starts where the last ended', () => {
    const b = new ClipBuilder('t', 'full');
    b.part('a', { x: 10 }).at(100).to(100, { x: 20 }, 'lin').wait(100).to(100, { x: 0 }, 'lin');
    const c = b.end(400);
    expect(sampleClip(c, 0).a!.x).toBe(10);
    expect(sampleClip(c, 150).a!.x).toBe(15);
    expect(sampleClip(c, 250).a!.x).toBe(20);
    expect(sampleClip(c, 350).a!.x).toBe(10);
    expect(clipEnd(c).a!.x).toBe(0);
  });

  it('set jumps, also keeps the cursor, s means both sx and sy', () => {
    const b = new ClipBuilder('t', 'full');
    b.part('a', { sx: 1, sy: 1, r: 0 }).at(50).set({ r: 5 }).also(100, { r: 9 }, 'lin').to(100, { s: 2 }, 'lin');
    const c = b.end(200);
    expect(sampleClip(c, 49).a).toEqual({ sx: 1, sy: 1, r: 0 });
    expect(sampleClip(c, 50).a!.r).toBe(5);
    expect(sampleClip(c, 100).a).toEqual({ sx: 1.5, sy: 1.5, r: 7 });
  });

  it('an arc travels in a straight line on x and rises h px at the middle on y', () => {
    const b = new ClipBuilder('t', 'full');
    b.part('ball', { x: 0, y: 0 }).at(0).arc(100, 0, 100, 200, 100, 50);
    const c = b.end(100);
    expect(sampleClip(c, 50).ball).toEqual({ x: 100, y: 50 });
    expect(clipEnd(c).ball).toEqual({ x: 200, y: 100 });
  });

  it('the easing curves start at 0 and end at 1', () => {
    for (const ease of Object.values(EASES)) {
      expect(ease(0)).toBeCloseTo(0, 5);
      expect(ease(1)).toBeCloseTo(1, 5);
    }
  });
});

describe('battle basics match the redesign mockups', () => {
  it('recall: ball held out, red, brace, pulled thin up the beam, the ball catches (800 ms)', () => {
    const c = recallClip(ME, { x: 70, y: 330 }, 'full');
    expect(c.length).toBe(800);
    expect(beats(c)).toEqual([[0, 'Ball held out'], [120, 'Braces, then stretches into the beam'], [460, 'Ball catches it'], [600, 'The info bar tucks away']]);
    expect(sampleClip(c, 170).mon!.red).toBe(1);
    // The brace: wider and shorter. Then thin and tall, lifted 30% of its height.
    expect(sampleClip(c, 220).mon).toMatchObject({ sx: 1.1, sy: 0.9 });
    const thin = sampleClip(c, 420).mon!;
    expect(thin.sx).toBeCloseTo(0.15);
    expect(thin.sy).toBeCloseTo(1.25);
    expect(thin.lift).toBeCloseTo(0.3);
    expect(clipEnd(c).mon).toMatchObject({ sx: 0, sy: 0, shadow: 0 });
    // The beam runs from the ball to the middle of the Pokémon.
    const beam = c.fx.find((f) => f.kind === 'streak');
    expect(beam).toMatchObject({ at: 100, x1: 70, y1: 330, x2: 312, y2: 338, d: 120, hold: 220, out: 120 });
    expect(c.fx.find((f) => f.kind === 'cue')).toMatchObject({ at: 460, name: 'catch' });
    expect(clipEnd(c).ball!.alpha).toBe(0);
  });

  it('faint: staggers back, sways, the knees give, then sinks with dust and a dark base (1300 ms)', () => {
    const c = faintClip(FOE, 'full');
    expect(c.length).toBe(1300);
    expect(beats(c)).toEqual([[0, 'Staggers back'], [300, 'Sways'], [700, 'Knees give'], [900, 'Drops']]);
    // The foe reels right (away from you); yours reels left.
    expect(sampleClip(c, 320).mon!.dx).toBeGreaterThan(0);
    expect(sampleClip(faintClip(ME, 'full'), 320).mon!.dx).toBeLessThan(0);
    expect(sampleClip(c, 900).mon).toMatchObject({ sx: 1.14, sy: 0.78, sink: 0, rot: 0 });
    expect(clipEnd(c).mon).toMatchObject({ sink: 1, shadow: 0 });
    expect(c.fx.map((f) => [f.kind, f.at])).toEqual([['dim', 300], ['dust', 920]]);
  });

  it('send-out: the ball lands at 500 ms, bounces, bursts at 900 ms; the Pokémon stretches, lands and settles (1500 ms)', () => {
    const c = sendClip(ME, { x: 100, y: 300 }, 'full');
    expect(c.length).toBe(1500);
    expect(sendOpenAt('full')).toBe(900);
    expect(sampleClip(c, 500).ball).toMatchObject({ x: 312, y: 420 });
    // The bounce: 26 px up at its top.
    expect(sampleClip(c, 740).ball!.y).toBeCloseTo(420 - 26);
    expect(sampleClip(c, 899).mon).toMatchObject({ sx: 0, sy: 0 });
    expect(sampleClip(c, 1040).mon).toMatchObject({ sx: 0.78, sy: 1.26, dy: -34 });
    // It pops out white and the white fades once it is in the air.
    expect(sampleClip(c, 1000).mon!.white).toBe(1);
    expect(sampleClip(c, 1140).mon).toMatchObject({ sx: 1.22, sy: 0.8, dy: 0 });
    expect(clipEnd(c).mon).toMatchObject({ sx: 1, sy: 1, dy: 0, white: 0, shadow: 1 });
    expect(c.fx.filter((f) => f.kind !== 'cue').map((f) => [f.kind, f.at])).toEqual([['dust', 500], ['flash', 900], ['ring', 900], ['dust', 1140]]);
    expect(c.fx.filter((f) => f.kind === 'cue').map((f) => f.kind === 'cue' && f.name)).toEqual(['throw', 'bounce', 'open', 'plate']);
    // The foe's ball spins the other way.
    expect(clipEnd(sendClip(FOE, throwFromSpot('enemy'), 'full')).ball!.rot).toBe(-540);
  });

  it('exp lights: seven lights leave the fallen foe and the bar fills as they arrive', () => {
    const c = expLightsClip({ x: 648, y: 240 }, { x: 860, y: 506 }, 'full');
    expect(c.fx[0]).toMatchObject({ kind: 'orbs', n: 7, gap: 60, d: 550, y0: 210, x1: 860 });
    expect(c.fx[1]).toMatchObject({ kind: 'cue', at: 550, name: 'arrive' });
    for (const level of ['reduced', 'off'] as const) {
      const calm = expLightsClip({ x: 648, y: 240 }, { x: 860, y: 506 }, level);
      expect(calm.length).toBe(0);
      expect(calm.fx).toEqual([{ kind: 'cue', at: 0, name: 'arrive' }]);
    }
  });

  it('the edges a ball comes from when no trainer is on screen are the mockup’s', () => {
    expect(recallBallSpot('player')).toEqual({ x: 40, y: 330 });
    expect(recallBallSpot('enemy')).toEqual({ x: 920, y: 120 });
    expect(throwFromSpot('player')).toEqual({ x: -30, y: 330 });
  });
});

describe('one rule for Reduced and Off (redesign pass 25)', () => {
  const clips = (level: ClipLevel): MotionClip[] => [recallClip(ME, recallBallSpot('player'), level), faintClip(FOE, level), sendClip(ME, throwFromSpot('player'), level)];

  it('every level ends in the same place, so what happened never depends on the animation', () => {
    // What a clip must leave behind: gone after a recall, sunk after a faint, standing after a send-out.
    const must = [['sx', 'sy', 'shadow'], ['sink', 'shadow'], ['sx', 'sy', 'shadow']];
    const want: Record<string, number>[] = [{ sx: 0, sy: 0, shadow: 0 }, { sink: 1, shadow: 0 }, { sx: 1, sy: 1, shadow: 1 }];
    for (const level of LEVELS) {
      clips(level).forEach((c, i) => {
        const end = clipEnd(c).mon!;
        for (const prop of must[i]!) expect(end[prop], `${c.id} ${level} ${prop}`).toBeCloseTo(want[i]![prop]!);
      });
    }
  });

  it('Off takes no time and moves nothing; Reduced is short and has no wind-up', () => {
    for (const c of clips('off')) {
      expect(c.length).toBe(0);
      expect(c.segs.every((s) => s.d === 0)).toBe(true);
    }
    const reduced = clips('reduced');
    const full = clips('full');
    reduced.forEach((c, i) => expect(c.length).toBeLessThan(full[i]!.length / 1.8));
    // No stagger, sway or squash in a reduced faint: it only sinks.
    expect(new Set(reduced[1]!.segs.map((s) => s.prop))).toEqual(new Set(['sink', 'shadow']));
  });

  it('Reduced never flashes or throws particles; Off keeps only the dark base and the cues', () => {
    for (const level of LEVELS) {
      for (const c of clips(level)) {
        const kinds = c.fx.filter((f) => fxAllowed(f, level)).map((f) => f.kind);
        if (level !== 'full') expect(kinds).not.toContain('flash');
        if (level !== 'full') expect(kinds).not.toContain('dust');
        if (level === 'off') expect(kinds.every((k) => k === 'cue' || k === 'dim')).toBe(true);
      }
    }
    expect(fxAllowed({ kind: 'streak', at: 0, x1: 0, y1: 0, x2: 1, y2: 1, w: 1, color: 0, d: 1, hold: 1, out: 1 }, 'reduced')).toBe(true);
    expect(fxAllowed({ kind: 'orbs', at: 0, x0: 0, y0: 0, x1: 1, y1: 1, n: 1, gap: 1, d: 1 }, 'reduced')).toBe(false);
  });

  it('the new sprite is shown at the open cue at every level', () => {
    for (const level of LEVELS) {
      const c = sendClip(ME, throwFromSpot('player'), level);
      expect(c.fx.find((f) => f.kind === 'cue' && f.name === 'open')?.at).toBe(sendOpenAt(level));
      expect(sendOpenAt(level)).toBeLessThanOrEqual(c.length);
    }
  });
});

describe('the ace lands (pass 15, Ace Call)', () => {
  it('Full: it leaps off the band, comes down onto its spot at 360 ms, squashes flat and wide, and the ground answers', () => {
    const c = aceLandClip(FOE, 'full');
    expect(sampleClip(c, 0).mon!.lift).toBeCloseTo(0.9);
    expect(sampleClip(c, 140).mon!.lift).toBeCloseTo(1.15);
    expect(sampleClip(c, 360).mon!.lift).toBeCloseTo(0);
    expect(sampleClip(c, 420).mon).toMatchObject({ sx: 1.2, sy: 0.75 });
    const at = (k: string) => c.fx.filter((f) => f.kind === k).map((f) => f.at);
    expect(at('cue')).toEqual([360]);
    expect(at('dust')).toEqual([360]);
    expect(at('ring')).toEqual([360]);
    expect(at('star')).toEqual([360]);
    expect(c.fx.find((f) => f.kind === 'ring')).toMatchObject({ color: 0xffcb05, r1: 260, flat: 0.4, d: 700 });
    expect(c.length).toBe(820);
  });

  it('every level ends with it standing whole on its spot; Reduced has no star or dust, Off takes no time', () => {
    for (const level of LEVELS) expect(clipEnd(aceLandClip(FOE, level)).mon).toMatchObject({ lift: 0, sx: 1, sy: 1, alpha: 1, shadow: 1 });
    expect(aceLandClip(FOE, 'reduced').fx.filter((f) => fxAllowed(f, 'reduced')).map((f) => f.kind).sort()).toEqual(['cue', 'ring']);
    expect(aceLandClip(FOE, 'off').length).toBe(0);
    expect(fxAllowed({ kind: 'star', at: 0, x: 0, y: 0, size: 1, points: 12, d: 1 }, 'reduced')).toBe(false);
  });
});

describe('the info bar on a switch (pass 2, Switch)', () => {
  it('tucks away 200 ms before the recall ends and comes back 500 ms before the send-out ends', () => {
    const cue = (c: MotionClip, name: string) => c.fx.find((f) => f.kind === 'cue' && f.name === name)?.at;
    expect(cue(recallClip(ME, recallBallSpot('player'), 'full'), 'tuck')).toBe(600);
    expect(cue(sendClip(ME, throwFromSpot('player'), 'full'), 'plate')).toBe(1000);
    for (const level of LEVELS) {
      const r = recallClip(ME, recallBallSpot('player'), level);
      const s = sendClip(ME, throwFromSpot('player'), level);
      expect(cue(r, 'tuck')).toBeLessThanOrEqual(r.length);
      expect(cue(s, 'plate')).toBeLessThanOrEqual(s.length);
    }
  });
});

describe('trainer face chip (pass 19)', () => {
  it('says the mockup words for each moment', () => {
    expect(cheerWord({ kind: 'hit', on: 'foe', superEffective: true })).toBe('Yes!');
    expect(cheerWord({ kind: 'hit', on: 'foe', superEffective: false })).toBe('Nice hit!');
    expect(cheerWord({ kind: 'hit', on: 'you', superEffective: true })).toBe('Hang in there!');
    expect(cheerWord({ kind: 'faint', on: 'foe' })).toBe('We did it!');
    expect(cheerWord({ kind: 'faint', on: 'you' })).toBe('You did great.');
  });

  it('counts a hit as big from 40% of max HP, a super-effective hit or a crit, and not below', () => {
    expect(bigHit(40, 100, 1, false)).toBe(true);
    expect(bigHit(39, 100, 1, false)).toBe(false);
    expect(bigHit(1, 100, 2, false)).toBe(true);
    expect(bigHit(1, 100, 0.5, true)).toBe(true);
    expect(bigHit(5, 0, 1, false)).toBe(false);
  });

  it('pops the face in, hops once and leaves; the word follows 80 ms later; Off shows nothing', () => {
    const full = cheerClip({ x: 902, y: 424 }, 'full');
    expect(full.length).toBe(1050);
    expect(sampleClip(full, 0).face).toMatchObject({ sx: 0, x: 902, y: 424 });
    expect(sampleClip(full, 200).face!.sx).toBeCloseTo(1);
    expect(sampleClip(full, 280).face!.y).toBeCloseTo(416);
    expect(sampleClip(full, 400).face!.y).toBeCloseTo(424);
    expect(sampleClip(full, 80).word!.sx).toBeCloseTo(0);
    expect(sampleClip(full, 1050).face!.sx).toBeCloseTo(0);
    expect(sampleClip(full, 1050).word!.sx).toBeCloseTo(0);
    expect(sampleClip(full, 0).word).toMatchObject({ x: 862 });
    const reduced = cheerClip({ x: 902, y: 424 }, 'reduced');
    expect(reduced.length).toBe(1000);
    expect(sampleClip(reduced, 500).face).toMatchObject({ sx: 1, alpha: 1, y: 424 });
    expect(cheerClip({ x: 902, y: 424 }, 'off').length).toBe(0);
    expect(CHEER_GAP).toBe(1200);
  });
});

describe('foe trainer step-in (pass 4)', () => {
  const spot = { x: 648, y: 240 };
  it('slides in onto the spot, steps back to throw, releases at the hand, and leaves before the clip ends', () => {
    const c = foeThrowClip(spot, 'full');
    expect(sampleClip(c, 0).tr).toMatchObject({ x: FOE_TRAINER_OFF, y: 248, rot: 0 });
    expect(sampleClip(c, 420).tr!.x).toBeCloseTo(648);
    expect(sampleClip(c, 890).tr).toMatchObject({ x: 648 + 126 });
    expect(sampleClip(c, 890).tr!.rot).toBeCloseTo(9);
    expect(c.fx.find((f) => f.kind === 'cue' && f.name === 'release')!.at).toBe(FOE_RELEASE);
    expect(sampleClip(c, c.length).tr!.x).toBeGreaterThan(960);
    expect(sampleClip(c, c.length).tr!.rot).toBeCloseTo(0);
    expect(foeHand(spot, 208)).toEqual({ x: 698, y: 248 - 208 * 0.7 });
  });
  it('Reduced and Off bring no trainer: the release cue fires at once', () => {
    for (const level of ['reduced', 'off'] as const) {
      const c = foeThrowClip(spot, level);
      expect(c.length).toBe(0);
      expect(c.fx).toEqual([{ kind: 'cue', at: 0, name: 'release' }]);
    }
  });
});

describe('miss (pass 2)', () => {
  const foe = { x: 648, y: 240 }, me = { x: 250, y: 420 };
  it('the attacker dashes past where the target stood while the target steps away, then both are home', () => {
    const c = missClip(foe, me, 'full');
    expect(c.length).toBe(800);
    expect(sampleClip(c, 160).atk!.dx).toBeCloseTo(18);
    expect(sampleClip(c, 260).atk).toMatchObject({ dx: 250 + 150 - 648, dy: 420 - 60 - 240 });
    expect(sampleClip(c, 240).tgt!.dx).toBeCloseTo(-70);
    for (const part of ['atk', 'tgt']) expect(sampleClip(c, 800)[part]).toMatchObject({ dx: 0, dy: 0, sx: 1, sy: 1 });
    const mine = missClip(me, foe, 'full');
    expect(sampleClip(mine, 240).tgt!.dx).toBeCloseTo(70);
  });
  it('Reduced only side-steps a little; Off moves nothing', () => {
    const r = missClip(foe, me, 'reduced');
    expect(sampleClip(r, 130).tgt!.dx).toBeCloseTo(-28);
    expect(sampleClip(r, 130).atk!.dx).toBe(0);
    expect(missClip(foe, me, 'off').length).toBe(0);
  });
});

describe('standing (pass 11)', () => {
  it('picks the mockup way by species, then by first type, and a giant stands heavy', () => {
    expect(standKind(6, ['fire', 'flying'])).toBe('hover');
    expect(standKind(25, ['electric'])).toBe('twitch');
    expect(standKind(9, ['water'])).toBe('heavy');
    expect(standKind(448, ['fighting', 'steel'])).toBe('steady');
    expect(standKind(1, ['grass', 'poison'])).toBe('sway');
    expect(standKind(92, ['ghost', 'poison'])).toBe('float');
    expect(standKind(19, ['normal'])).toBe('steady');
    expect(standKind(25, ['electric'], true)).toBe('heavy');
  });
  it('uses the mockup numbers, and nothing moves sideways', () => {
    expect(standLook('steady')).toMatchObject({ ms: 1900, sy: 1.03, sx: 0.988, rise: 0 });
    expect(standLook('hover')).toMatchObject({ ms: 1500, rise: 8, sy: 1.02 });
    expect(standLook('float')).toMatchObject({ ms: 2600, rise: 12, tilt: 2 });
    expect(standLook('heavy')).toMatchObject({ ms: 2800, sy: 1.04, sx: 0.98 });
    expect(standLook('twitch')).toMatchObject({ ms: 1100, hop: 9, hopEvery: 2600 });
    expect(standLook('sway')).toMatchObject({ ms: 1900, tilt: 2.5, tiltMs: 2300 });
    for (const k of ['steady', 'hover', 'float', 'heavy', 'twitch', 'sway'] as const) expect(Object.keys(standLook(k))).not.toContain('x');
  });
});

describe('shiny entrance (pass 11)', () => {
  const mid = { x: 648, y: 180 };
  it('six stars spiral in from a wide ellipse and collapse onto the middle; glint and chip cues follow', () => {
    const c = shinyClip(mid, 'full');
    expect(sampleClip(c, 0).star0).toMatchObject({ x: mid.x + 170, y: mid.y, alpha: 1 });
    const end = sampleClip(c, 800).star3!;
    expect(Math.hypot(end.x! - mid.x, end.y! - mid.y)).toBeLessThan(25);
    expect(sampleClip(c, 900).star3!.alpha).toBeCloseTo(0);
    const cues = c.fx.filter((f) => f.kind === 'cue').map((f) => [f.at, (f as { name: string }).name]);
    expect(cues).toEqual([[SHINY_GLINT, 'glint'], [SHINY_CHIP, 'chip']]);
    expect(c.fx.filter((f) => f.kind === 'ring')).toHaveLength(3);
  });
  it('Reduced and Off keep only the chip', () => {
    for (const level of ['reduced', 'off'] as const) expect(shinyClip(mid, level).fx).toEqual([{ kind: 'cue', at: 0, name: 'chip' }]);
  });
});

describe('motion clips: the wild encounter (pass 5)', () => {
  const at = { x: 648, y: 240, h: 120 };
  it('two flashes, nine bars pull apart, the dark shape slides in, colour and cry, then the plate', () => {
    const c = wildEntranceClip(at, 'full');
    expect(c.fx.filter((f) => f.kind === 'flash').map((f) => f.at)).toEqual([0, 160]);
    const s0 = sampleClip(c, 0);
    expect(s0.foe).toMatchObject({ dx: 1150 - at.x, black: 1, shadow: 0 });
    for (let i = 0; i < WILD_BARS; i++) expect(s0[`bar${i}`]).toMatchObject({ x: 480, y: 30 + i * 60, alpha: 1 });
    // Bars leave in turn, 20 ms apart, alternating sides, gone by 1 s.
    const s1 = sampleClip(c, 1000);
    expect(s1.bar0!.x).toBe(-540);
    expect(s1.bar1!.x).toBe(1500);
    expect(sampleClip(c, 330).bar8!.x).toBe(480);
    expect(sampleClip(c, 1050).foe!.dx).toBeCloseTo(0);
    expect(sampleClip(c, WILD_CRY).foe!.black).toBe(1);
    expect(sampleClip(c, WILD_CRY + 300).foe!.black).toBe(0);
    expect(sampleClip(c, 1400).foe!.dy).toBeCloseTo(-22);
    const cues = c.fx.filter((f) => f.kind === 'cue').map((f) => [f.at, (f as { name: string }).name]);
    expect(cues).toEqual([[WILD_CRY, 'cry'], [WILD_PLATE, 'plate']]);
    // Three cry rings round its middle (the mockup's X - 40, Y - 10, Y being the sprite's middle).
    expect(c.fx.filter((f) => f.kind === 'ring').map((f) => [(f as { x: number }).x, (f as { y: number }).y])).toEqual([[608, 170], [608, 170], [608, 170]]);
    expect(clipEnd(c).foe).toMatchObject({ dx: 0, dy: 0, sx: 1, sy: 1, black: 0, shadow: 1 });
  });
  it('Reduced: no flashes or bars, the colour fades in; Off: nothing moves, the cry and plate come at once', () => {
    const r = wildEntranceClip(at, 'reduced');
    expect(r.fx.some((f) => f.kind === 'flash')).toBe(false);
    expect(sampleClip(r, 0).bar0!.alpha).toBe(0);
    expect(sampleClip(r, 0).foe!.black).toBe(1);
    expect(clipEnd(r).foe!.black).toBe(0);
    const o = wildEntranceClip(at, 'off');
    expect(o.length).toBe(0);
    expect(o.fx).toEqual([{ kind: 'cue', at: 0, name: 'cry' }, { kind: 'cue', at: 0, name: 'plate' }]);
    expect(clipEnd(o).foe).toMatchObject({ dx: 0, black: 0 });
  });
});

describe('motion clips: level up (pass 2)', () => {
  const me = { x: 312, y: 428, h: 160 };
  it('a pale blue flash and the tick, two hops with dust on each landing, the LEVEL stamp springs out and lifts away', () => {
    const c = levelUpClip(me, 'full');
    expect(c.fx.find((f) => f.kind === 'flash')).toMatchObject({ at: 0, d: 250, alpha: 0.45, color: 0x9ae4ff });
    expect(c.fx.find((f) => f.kind === 'cue')).toEqual({ kind: 'cue', at: 0, name: 'tick' });
    // Squash 70 ms, then the first hop tops out 46 px up; the second, after landing, 30 px up.
    expect(sampleClip(c, 170)).toMatchObject({ mon: { sy: 0.86, sx: 1.1 } });
    expect(sampleClip(c, 330).mon!.dy).toBeCloseTo(-46);
    expect(sampleClip(c, 470).mon!.dy).toBeCloseTo(0);
    expect(sampleClip(c, 670).mon!.dy).toBeCloseTo(-30);
    expect(c.fx.filter((f) => f.kind === 'dust').map((f) => [f.at, (f as { y: number }).y])).toEqual([[470, me.y], [800, me.y]]);
    // The stamp: 40 px right of the Pokémon and 120 px over its middle, 0.4 to full in 140 ms, hangs 1 s, lifts 40 px.
    expect(sampleClip(c, 100).stamp).toMatchObject({ x: me.x + 40, y: me.y - 80 - 120, sx: 0.4, alpha: 1 });
    expect(sampleClip(c, 240).stamp!.sx).toBeCloseTo(1);
    expect(sampleClip(c, 1200).stamp).toMatchObject({ y: me.y - 200, alpha: 1 });
    expect(clipEnd(c)).toMatchObject({ mon: { dx: 0, dy: 0, sx: 1, sy: 1 }, stamp: { y: me.y - 240, alpha: 0 } });
  });
  it('Reduced: the stamp shows and fades, nothing hops or flashes; Off: only the tick', () => {
    const r = levelUpClip(me, 'reduced');
    expect(r.fx.map((f) => f.kind)).toEqual(['cue']);
    expect(r.segs.some((s) => s.part === 'mon')).toBe(false);
    expect(sampleClip(r, 600).stamp).toMatchObject({ sx: 1, alpha: 1 });
    expect(clipEnd(r).stamp!.alpha).toBe(0);
    const o = levelUpClip(me, 'off');
    expect(o.length).toBe(0);
    expect(o.fx).toEqual([{ kind: 'cue', at: 0, name: 'tick' }]);
  });
});

describe('motion clips: the target takes a hit (pass 2, 12, 17, 18)', () => {
  const at = { x: 648, y: 240, h: 120 };
  const plain = { big: false, sharp: false };
  it('white for 80 ms, squashed thin and tall, thrown away from the attacker, springs home with dust', () => {
    const c = hitClip(at, 1, plain, 'full');
    expect(sampleClip(c, 0).mon).toMatchObject({ white: 1, sx: 0.8, sy: 1.14, dx: 0 });
    expect(sampleClip(c, 80).mon!.white).toBe(1);
    expect(sampleClip(c, 180).mon!.white).toBe(0);
    expect(sampleClip(c, 160).mon!.dx).toBeCloseTo(HIT_KNOCK);
    expect(c.fx).toEqual([{ kind: 'dust', at: 160, x: at.x + HIT_KNOCK, y: at.y, n: 4 }]);
    expect(clipEnd(c).mon).toMatchObject({ dx: 0, sx: 1, sy: 1, white: 0 });
    // Your Pokémon is thrown left; a big hit throws further.
    expect(sampleClip(hitClip(at, -1, { big: true, sharp: false }, 'full'), 160).mon!.dx).toBeCloseTo(-HIT_KNOCK_BIG);
  });
  it('the hit is a light: it blooms on the body in 100 ms and dies in 450; the floor pool fades over 600', () => {
    const c = hitClip(at, 1, plain, 'full');
    expect(sampleClip(c, 0).light).toMatchObject({ x: at.x, y: at.y - 60, alpha: 1 });
    expect(sampleClip(c, 0).light!.sx).toBeCloseTo(0.3);
    expect(sampleClip(c, 100).light).toMatchObject({ sx: 1, alpha: 1 });
    expect(sampleClip(c, 550).light!.alpha).toBeCloseTo(0);
    expect(sampleClip(c, 0).floor!.alpha).toBe(0.9);
    expect(clipEnd(c)).toMatchObject({ light: { alpha: 0 }, floor: { alpha: 0 } });
  });
  it('a big hit lights the other Pokémon; a sharp one flashes a white star where it lands', () => {
    const big = hitClip(at, 1, { big: true, sharp: true }, 'full');
    expect(big.fx).toContainEqual({ kind: 'cue', at: 0, name: 'glow' });
    expect(big.fx).toContainEqual({ kind: 'star', at: 0, x: at.x, y: at.y - 60, size: 340, points: 14, d: 120 });
    expect(hitClip(at, 1, plain, 'full').fx.some((f) => f.kind === 'cue' || f.kind === 'star')).toBe(false);
  });
  it('power tiers (pass 12): a harder hit throws it further, with dust halfway and where it lands', () => {
    const c = hitClip(at, 1, { ...plain, p: 0.5 }, 'full');
    const far = HIT_THROW.base + HIT_THROW.per * 0.5;
    expect(sampleClip(c, 210).mon!.dx).toBeCloseTo(far);
    expect(sampleClip(c, 310).mon!.dx).toBeCloseTo(far);
    expect(c.fx).toEqual([
      { kind: 'dust', at: 120, x: at.x + far / 2, y: at.y, n: 5 },
      { kind: 'dust', at: 200, x: at.x + far, y: at.y, n: 7 },
    ]);
    expect(c.length).toBe(710);
    expect(clipEnd(c).mon).toMatchObject({ dx: 0 });
    // Your Pokémon is thrown left.
    expect(sampleClip(hitClip(at, -1, { ...plain, p: 1 }, 'full'), 210).mon!.dx).toBeCloseTo(-(HIT_THROW.base + HIT_THROW.per));
  });
  it('hitPower: under 30% a tap, to 90% normal, near the top heavy; critical or super effective counts 1.3 times', () => {
    expect(hitPower(20, 100, false)).toEqual({ tier: 'weak', p: 0, shake: 0 });
    expect(hitPower(30, 100, false).tier).toBe('weak');
    const mid = hitPower(60, 100, false);
    expect(mid.tier).toBe('normal');
    expect(mid.p).toBeCloseTo(0.5);
    expect(mid.shake).toBeCloseTo(HIT_THROW.shake + HIT_THROW.shakePer * 0.5);
    expect(hitPower(90, 100, false)).toMatchObject({ tier: 'heavy', p: 1 });
    expect(hitPower(70, 100, false).tier).toBe('normal');
    expect(hitPower(70, 100, true).tier).toBe('heavy');
    expect(hitPower(500, 100, false).p).toBe(1);
    expect(hitPower(5, 0, false).tier).toBe('heavy');
  });
  it('Reduced and Off leave it to the battle blink', () => {
    for (const level of ['reduced', 'off'] as const) {
      const c = hitClip(at, 1, { big: true, sharp: true }, level);
      expect([c.length, c.segs.length, c.fx.length]).toEqual([0, 0, 0]);
    }
  });
});

describe('the critical hit freeze (pass 12) and the hit stamps (pass 5)', () => {
  const mid = { x: 648, y: 180 };
  it('everything stops for 280 ms: white, a white star, ten yellow rays, then the hit lands', () => {
    const c = critFreezeClip(mid, 'full');
    expect(c.length).toBe(CRIT_FREEZE.ms);
    expect(sampleClip(c, 0).mon!.white).toBe(1);
    expect(sampleClip(c, 270).mon!.white).toBe(1);
    expect(clipEnd(c).mon!.white).toBe(0);
    expect(c.fx).toContainEqual({ kind: 'cue', at: 0, name: 'freeze' });
    expect(c.fx).toContainEqual({ kind: 'star', at: 0, x: mid.x, y: mid.y, size: 200, points: 10, d: 280 });
    const rays = c.fx.filter((f) => f.kind === 'streak');
    expect(rays).toHaveLength(10);
    expect(rays[0]).toMatchObject({ at: 20, x1: mid.x, y1: mid.y, x2: mid.x + 300, w: 4, color: 0xffcb05 });
    expect(rays[0]!.kind === 'streak' && rays[0]!.y2).toBeCloseTo(mid.y);
  });
  it('the bars, camera and colour drain follow the mockup timings', () => {
    expect(CRIT_FREEZE).toMatchObject({ bar: 70, barIn: 60, barHold: 900, barOut: 200, zoom: 1.32, camHold: 320, camOut: 400, drainHold: 240, dim: 0.6 });
  });
  it('Reduced and Off: no freeze', () => {
    for (const level of ['reduced', 'off'] as const) expect(critFreezeClip(mid, level).length).toBe(0);
  });
  it('stamps: yellow CRITICAL HIT! slams first and above, red SUPER EFFECTIVE! under it; weak and immune settle softly', () => {
    expect(HIT_STAMPS.crit).toMatchObject({ word: 'CRITICAL HIT!', fill: '#ffcb05', soft: false, at: 0, dy: -48 });
    expect(HIT_STAMPS.super).toMatchObject({ word: 'SUPER EFFECTIVE!', fill: '#e3350d', soft: false, dy: 0 });
    expect(HIT_STAMPS.weak!.soft && HIT_STAMPS.immune!.soft).toBe(true);
    expect(HIT_STAMPS.super!.at).toBeGreaterThan(HIT_STAMPS.crit!.at);
    expect(hitStampSpot('enemy', { x: 648, y: 180 })).toEqual({ x: 478, y: 134 });
    expect(hitStampSpot('player', { x: 312, y: 370 })).toEqual({ x: 522, y: 300 });
  });
});

describe('motion clips: healing (pass 3)', () => {
  const me = { x: 312, y: 428 };
  it('ten green plus-signs rise through it one by one, it glows green and hops once, a green ring spreads', () => {
    const c = healClip(me, 'full');
    expect(HEAL_PLUSES).toHaveLength(10);
    for (const p of HEAL_PLUSES) {
      expect(Math.abs(p.dx)).toBeLessThanOrEqual(90);
      expect(p.size).toBeGreaterThanOrEqual(26);
      expect(p.size).toBeLessThanOrEqual(HEAL_PLUS_SIZE);
      expect(p.y1).toBeGreaterThanOrEqual(170);
      expect(p.y1).toBeLessThanOrEqual(260);
    }
    expect(sampleClip(c, 0).plus0).toMatchObject({ x: me.x + HEAL_PLUSES[0]!.dx, y: me.y - HEAL_PLUSES[0]!.y0, alpha: 1 });
    expect(sampleClip(c, 0).plus9!.alpha).toBe(0);
    expect(sampleClip(c, 540).plus9!.alpha).toBe(1);
    expect(sampleClip(c, 700).plus0!.y).toBeCloseTo(me.y - HEAL_PLUSES[0]!.y1);
    expect(sampleClip(c, 250).mon!.green).toBeCloseTo(0.6);
    expect(sampleClip(c, 520).mon!.dy).toBeCloseTo(-22);
    expect(c.fx).toEqual([{ kind: 'ring', at: 0, x: me.x, y: me.y - 8, r1: 120, flat: 0.4, d: 400, color: 0x7dffa0, w: 4 }]);
    expect(clipEnd(c)).toMatchObject({ mon: { dy: 0, sx: 1, sy: 1, green: 0 }, plus0: { alpha: 0 }, plus9: { alpha: 0 } });
  });
  it('Reduced: the green glow and the ring; Off: nothing', () => {
    const r = healClip(me, 'reduced');
    expect(r.segs.some((s) => s.part.startsWith('plus') || s.prop === 'dy')).toBe(false);
    expect(sampleClip(r, 250).mon!.green).toBeCloseTo(0.6);
    expect(healClip(me, 'off').length).toBe(0);
  });
});
