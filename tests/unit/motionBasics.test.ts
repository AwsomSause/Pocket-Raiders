import { describe, expect, it } from 'vitest';
import { ClipBuilder, clipEnd, EASES, fxAllowed, sampleClip, type ClipLevel, type MotionClip } from '../../src/core/presentation/motionClip';
import { aceLandClip, bigHit, CHEER_GAP, cheerClip, cheerWord, expLightsClip, faintClip, recallBallSpot, recallClip, sendClip, sendOpenAt, throwFromSpot, type MonSpot } from '../../src/core/presentation/motionBasics';

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
