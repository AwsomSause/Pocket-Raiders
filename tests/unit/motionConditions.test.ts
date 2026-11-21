import { describe, expect, it } from 'vitest';
import type { BattleEvent } from '../../src/core/battle/engine';
import { planCues } from '../../src/core/presentation/cues';
import { moveAnims } from '../../src/data/presentation';
import { content } from './helpers';
import { clipEnd, EASES, fxAllowed, sampleClip } from '../../src/core/presentation/motionClip';
import { chevronWaves, COND_TINT, CONFUSE, endTurnChip, endTurnParade, confusionHitClip, GUST_LEAN, protectedClip, SHIELD, gustLeanClip, intimidateClip, condArriveClip, condKind, condTickClip, parCantClip, SLUMP, STAT_COLOR, statClip, thawClip, wakeClip, type CondSpot } from '../../src/core/presentation/motionConditions';

// Animation redesign pass 8 (Conditions): every status arrives, keeps a look and ticks, as the mockup's numbers.
const FOE: CondSpot = { x: 648, y: 240, w: 100, h: 120, side: 'enemy' };
const ME: CondSpot = { x: 312, y: 428, w: 110, h: 150, side: 'player' };

describe('conditions: which statuses have a look', () => {
  it('burn, poison (and Toxic), paralysis, sleep and freeze; nothing else', () => {
    expect(['brn', 'psn', 'tox', 'par', 'slp', 'frz', 'cnf', null, undefined].map(condKind)).toEqual(['brn', 'psn', 'psn', 'par', 'slp', 'frz', null, null, null]);
  });
  it('the bounce ease lands at 1 and never overshoots', () => {
    expect(EASES.bo(0)).toBe(0);
    expect(EASES.bo(1)).toBeCloseTo(1);
    for (let u = 0; u <= 1; u += 0.05) expect(EASES.bo(u)).toBeLessThanOrEqual(1.0001);
  });
});

describe('conditions: arrivals', () => {
  it('burn: nine flames climb the body from the feet one after another, the orange wash comes in, a small hop', () => {
    const c = condArriveClip('brn', FOE, 'full');
    expect(sampleClip(c, 0).f0).toMatchObject({ sx: 0, alpha: 1 });
    expect(sampleClip(c, 150).f0!.sx).toBeGreaterThan(0.5);
    expect(sampleClip(c, 50).f8!.sx).toBe(0);
    // Each flame rises and goes out within its 650 ms.
    expect(clipEnd(c).f8).toMatchObject({ alpha: 0 });
    expect(clipEnd(c).f8!.y).toBeLessThan(FOE.y - 60);
    expect(sampleClip(c, 250).tint!.alpha).toBeCloseTo(COND_TINT.brn.alpha);
    expect(sampleClip(c, 100).mon!.dy).toBeCloseTo(-16);
    expect(clipEnd(c).mon).toMatchObject({ dy: 0 });
  });
  it('poison: nine bubbles rise through the body and pop with small rings; the purple wash comes in', () => {
    const c = condArriveClip('psn', FOE, 'full');
    expect(c.fx.filter((f) => f.kind === 'ring')).toHaveLength(9);
    expect(clipEnd(c).b4).toMatchObject({ alpha: 0 });
    expect(clipEnd(c).tint!.alpha).toBeCloseTo(COND_TINT.psn.alpha);
  });
  it('paralysis: four bolts crawl over the body; the yellow wash flashes and settles faint', () => {
    const c = condArriveClip('par', FOE, 'full');
    const bolts = c.fx.filter((f) => f.kind === 'bolt');
    expect(bolts.map((f) => f.at)).toEqual([0, 100, 200, 300]);
    for (const b of bolts as { y1: number; y2: number }[]) expect([b.y1, b.y2]).toEqual([FOE.y - FOE.h / 2, FOE.y]);
    expect(sampleClip(c, 250).tint!.alpha).toBeCloseTo(0.5);
    expect(clipEnd(c).tint!.alpha).toBeCloseTo(COND_TINT.par.alpha);
  });
  it('sleep: three pink rings close in, then it slumps away from the other side (yours leans the other way)', () => {
    const c = condArriveClip('slp', FOE, 'full');
    expect(c.fx.filter((f) => f.kind === 'ring').map((f) => [(f as { r0: number }).r0, (f as { r1: number }).r1])).toEqual([[150, 20], [150, 20], [150, 20]]);
    expect(clipEnd(c).mon).toMatchObject({ rot: SLUMP.rot, dy: SLUMP.dy, sy: SLUMP.sy });
    expect(clipEnd(condArriveClip('slp', ME, 'full')).mon!.rot).toBe(-SLUMP.rot);
  });
  it('freeze: the ice grows up over it with a spring, the icy wash comes in, a cold ring and a glint', () => {
    const c = condArriveClip('frz', FOE, 'full');
    expect(sampleClip(c, 0).ice!.sy).toBeCloseTo(0);
    expect(clipEnd(c).ice!.sy).toBe(1);
    expect(c.fx.map((f) => f.kind)).toEqual(['ring', 'star']);
  });
  it('Reduced: the lasting shapes at once (wash, ice, slump), no particles; Off: the same, in no time', () => {
    for (const level of ['reduced', 'off'] as const) {
      const c = condArriveClip('frz', FOE, level);
      expect(c.length).toBe(0);
      expect(clipEnd(c)).toMatchObject({ ice: { sy: 1 }, tint: { alpha: COND_TINT.frz.alpha } });
      expect(clipEnd(condArriveClip('slp', FOE, level)).mon).toMatchObject({ rot: SLUMP.rot, dy: SLUMP.dy });
      expect(condArriveClip('brn', FOE, level).fx).toEqual([]);
    }
  });
});

describe('conditions: ticks and endings', () => {
  it('burn: the embers flare 2.6x and bounce back, a white flinch and a shake', () => {
    const c = condTickClip('brn', FOE, 'full');
    expect(sampleClip(c, 350).e0!.sx).toBeCloseTo(2.6);
    expect(clipEnd(c)).toMatchObject({ e0: { sx: 1 }, e1: { sx: 1 }, mon: { dx: 0, white: 0 } });
    expect(sampleClip(c, 330).mon!.white).toBeCloseTo(0.6);
  });
  it('poison: one big bubble swells over its head and bursts with a ring', () => {
    const c = condTickClip('psn', FOE, 'full');
    expect(sampleClip(c, 0).big).toMatchObject({ x: FOE.x, y: FOE.y - FOE.h - 16, sx: 0 });
    expect(sampleClip(c, 500).big!.sx).toBeCloseTo(1.4);
    expect(clipEnd(c).big).toMatchObject({ sx: 2, alpha: 0 });
    expect(c.fx).toContainEqual({ kind: 'ring', at: 520, x: FOE.x, y: FOE.y - FOE.h - 16, r1: 60, flat: 1, d: 300, color: 0xd9a8f0, w: 4 });
  });
  it('a tick at Reduced is a small shake; at Off nothing', () => {
    expect(condTickClip('brn', FOE, 'reduced').fx).toEqual([]);
    expect(condTickClip('brn', FOE, 'reduced').length).toBe(300);
    expect(condTickClip('psn', FOE, 'off').length).toBe(0);
  });
  it('paralysis stops it: a lunge toward the other side that locks up, a spark, the wash flares', () => {
    expect(sampleClip(parCantClip(FOE, 'full'), 300).mon!.dx).toBeCloseTo(-26);
    expect(sampleClip(parCantClip(ME, 'full'), 300).mon!.dx).toBeCloseTo(26);
    const c = parCantClip(FOE, 'full');
    expect(sampleClip(c, 350).tint!.alpha).toBeCloseTo(0.7);
    expect(clipEnd(c)).toMatchObject({ mon: { dx: 0 }, tint: { alpha: COND_TINT.par.alpha } });
    expect(parCantClip(FOE, 'reduced').fx).toEqual([]);
  });
  it('waking: from the slump it jumps 34 px and lands upright; sparkles and the "!" cue', () => {
    const c = wakeClip(FOE, 'full');
    expect(sampleClip(c, 0).mon).toMatchObject({ dy: SLUMP.dy, rot: SLUMP.rot });
    expect(sampleClip(c, 120).mon).toMatchObject({ dy: -34, rot: 0 });
    expect(clipEnd(c).mon).toMatchObject({ dy: 0, sy: 1, rot: 0 });
    expect(c.fx.map((f) => f.kind)).toEqual(['dust', 'cue']);
  });
  it('thawing: cracks while the ice shakes, then it shatters with a cold flash and the wash fades', () => {
    const c = thawClip(FOE, 'full');
    expect(c.fx.filter((f) => f.kind === 'bolt')).toHaveLength(3);
    expect(sampleClip(c, 500).ice!.alpha).toBe(1);
    expect(sampleClip(c, 560).ice!.alpha).toBe(0);
    expect(clipEnd(c)).toMatchObject({ ice: { x: FOE.x, alpha: 0 }, tint: { alpha: 0 }, mon: { dx: 0 } });
    const r = thawClip(FOE, 'reduced');
    expect(r.fx.filter((f) => fxAllowed(f, 'reduced'))).toEqual([]);
    expect(clipEnd(r)).toMatchObject({ ice: { alpha: 0 }, tint: { alpha: 0 } });
  });
});

describe('conditions: stat changes', () => {
  it('a boost: five chevrons in the stat colour rise from the feet to just over the head and fade there; a wash, a stretch', () => {
    const c = statClip(ME, 1, STAT_COLOR.atk!, 'full');
    expect(Object.keys(c.base).filter((p) => p.startsWith('c'))).toHaveLength(5);
    expect(sampleClip(c, 0).c0).toMatchObject({ y: ME.y, alpha: 0.95 });
    expect(sampleClip(c, 0).c4!.alpha).toBe(0);
    expect(sampleClip(c, 500).c0!.y).toBeCloseTo(ME.y - ME.h - 10);
    expect(sampleClip(c, 500).c0!.alpha).toBeCloseTo(0.95);
    expect(sampleClip(c, 1000).c0!.alpha).toBeCloseTo(0);
    expect(sampleClip(c, 0).c0!.x).toBeCloseTo(ME.x - 0.4 * ME.w);
    expect(sampleClip(c, 250).mon).toMatchObject({ tint: 0.45, tintColor: 0xe3350d });
    expect(sampleClip(c, 120).mon!.sy).toBeCloseTo(1.06);
    expect(clipEnd(c).mon).toMatchObject({ tint: 0, sx: 1, sy: 1 });
  });
  it('a drop of two stages: two waves of bigger chevrons fall from the head to the feet; it squashes', () => {
    const c = statClip(FOE, -2, STAT_COLOR.def!, 'full');
    expect(chevronWaves(-2)).toBe(2);
    expect(chevronWaves(5)).toBe(3);
    expect(Object.keys(c.base).filter((p) => p.startsWith('c'))).toHaveLength(10);
    expect(sampleClip(c, 160).c5).toMatchObject({ y: FOE.y - FOE.h, alpha: 0.95 });
    expect(sampleClip(c, 660).c5!.y).toBeCloseTo(FOE.y);
    expect(sampleClip(c, 120).mon!.sy).toBeCloseTo(0.93);
    expect(c.length).toBe(160 + 160 + 1000);
  });
  it('Reduced: the wash only; Off: nothing', () => {
    const r = statClip(FOE, 1, STAT_COLOR.spe!, 'reduced');
    expect(sampleClip(r, 250).mon!.tint).toBeCloseTo(0.45);
    expect(sampleClip(r, 120).mon!.sy).toBe(1);
    expect(sampleClip(r, 300).c0!.alpha).toBe(0);
    expect(statClip(FOE, 1, STAT_COLOR.spe!, 'off').length).toBe(0);
  });
});

describe('conditions: Intimidate', () => {
  it('the owner leans in toward the other side, the glare sweeps, the other shrinks back and trembles, all home after', () => {
    const c = intimidateClip(FOE, ME, 'full');
    expect(sampleClip(c, 600).owner).toMatchObject({ dx: -40, dy: 14 });
    expect(sampleClip(c, 600).owner!.sx).toBeCloseTo(1.12);
    expect(intimidateClip(ME, FOE, 'full').base.owner).toBeDefined();
    expect(sampleClip(intimidateClip(ME, FOE, 'full'), 600).owner!.dx).toBe(40);
    expect(sampleClip(c, 650).cone).toMatchObject({ x: FOE.x - 60, y: FOE.y - FOE.h / 2 - 40 });
    expect(sampleClip(c, 850).cone!.sx).toBeCloseTo(1);
    expect(sampleClip(c, 950).target).toMatchObject({ dx: -18 });
    expect(sampleClip(c, 950).target!.sy).toBeCloseTo(0.94);
    expect(c.fx.filter((f) => f.kind === 'star').map((f) => (f as { color?: number }).color)).toEqual([0xff4d4d, 0xff4d4d]);
    expect(c.fx.filter((f) => f.kind === 'cue').map((f) => (f as { name: string }).name)).toEqual(['dim', 'undim']);
    expect(clipEnd(c)).toMatchObject({ owner: { dx: 0, dy: 0, sx: 1 }, target: { dx: 0, sy: 1 }, cone: { alpha: 0 } });
  });
  it('Reduced and Off: nothing moves (the flag alone says it)', () => {
    for (const level of ['reduced', 'off'] as const) expect(intimidateClip(FOE, ME, level).length).toBe(0);
  });
});

describe('conditions: the sandstorm gust', () => {
  it('both lean into the wind (left), hold it, spring back, with a white blink as the sand hits', () => {
    const c = gustLeanClip('full');
    expect(sampleClip(c, 200).mon).toMatchObject({ dx: 0, rot: 0 });
    expect(sampleClip(c, 500).mon).toMatchObject({ dx: GUST_LEAN.dx, rot: GUST_LEAN.rot });
    expect(sampleClip(c, 480).mon!.white).toBeCloseTo(0.5);
    expect(clipEnd(c).mon).toMatchObject({ dx: 0, rot: 0, white: 0 });
    expect(c.length).toBe(1100);
  });
  it('Reduced: the blink only; Off: nothing', () => {
    const r = gustLeanClip('reduced');
    expect(sampleClip(r, 500).mon).toMatchObject({ dx: 0, rot: 0 });
    expect(sampleClip(r, 480).mon!.white).toBeCloseTo(0.5);
    expect(gustLeanClip('off').length).toBe(0);
  });
});

describe('conditions: an attack meets Protect', () => {
  it('rings burst in front of the protected one, the stamp slams in, the attacker is pushed back 30 px and springs home', () => {
    const c = protectedClip(FOE, ME, 'full');
    const rings = c.fx.filter((f) => f.kind === 'ring') as { x: number; y: number; r1: number; color?: number }[];
    expect(rings.map((r) => r.r1)).toEqual([120, 170, 220]);
    expect(rings[0]).toMatchObject({ x: ME.x + SHIELD.ahead + 20, y: ME.y - ME.h / 2 - SHIELD.up - 10, color: SHIELD.color });
    expect(c.fx.filter((f) => f.kind === 'cue').map((f) => (f as { name: string }).name).sort()).toEqual(['shake', 'stamp']);
    expect(sampleClip(c, 170).attacker!.dx).toBeCloseTo(30);
    expect(sampleClip(protectedClip(ME, FOE, 'full'), 170).attacker!.dx).toBeCloseTo(-30);
    expect(protectedClip(ME, FOE, 'full').fx.find((f) => f.kind === 'ring')).toMatchObject({ x: FOE.x - SHIELD.ahead - 20 });
    expect(clipEnd(c).attacker!.dx).toBe(0);
  });
  it('Reduced: the stamp only; Off: nothing', () => {
    const r = protectedClip(FOE, ME, 'reduced');
    expect(r.fx.map((f) => f.kind)).toEqual(['cue']);
    expect(sampleClip(r, 170).attacker!.dx).toBe(0);
    expect(protectedClip(FOE, ME, 'off').length).toBe(0);
  });
});

describe('conditions: confusion', () => {
  it('stars circle the head and it sways, as the mockup numbers', () => {
    expect(CONFUSE).toMatchObject({ rx: 52, ry: 13, star: 22, sway: { rot: 5, dx: 6, ms: 1600 } });
  });
  it('hurting itself: it swings away from the other side and back, bonks (white, squash, star, shake) and stands home', () => {
    const c = confusionHitClip(FOE, 'full');
    expect(sampleClip(c, 120).mon!.dx).toBeCloseTo(40);
    expect(sampleClip(confusionHitClip(ME, 'full'), 120).mon!.dx).toBeCloseTo(-40);
    expect(sampleClip(c, 260).mon!.white).toBeCloseTo(0.7);
    expect(sampleClip(c, 260).mon!.sy).toBeCloseTo(0.86);
    expect(c.fx.find((f) => f.kind === 'star')).toMatchObject({ size: 90, color: 0xffcb05 });
    expect(c.fx.some((f) => f.kind === 'cue' && f.name === 'shake')).toBe(true);
    expect(clipEnd(c).mon).toMatchObject({ dx: 0, sy: 1, white: 0 });
  });
  it('Reduced: the blink only; Off: nothing', () => {
    const r = confusionHitClip(FOE, 'reduced');
    expect(sampleClip(r, 120).mon!.dx).toBe(0);
    expect(sampleClip(r, 260).mon!.white).toBeCloseTo(0.7);
    expect(confusionHitClip(FOE, 'off').length).toBe(0);
  });
  it('the cues let the screen show its stars for becoming confused, the "is confused!" check and hurting itself', () => {
    const events = [{ type: 'confused', side: 'enemy' }, { type: 'confusion', side: 'enemy' }, { type: 'confusionHit', side: 'enemy', amount: 5, hpAfter: 10 }] as BattleEvent[];
    const cues = planCues(events, content, moveAnims(), { mode: 'full', intensity: 1 });
    const conds = cues.map((list) => list.find((c) => c.kind === 'commonAnim'));
    expect(conds.map((c) => (c as { cond?: { at: string; status: string } } | undefined)?.cond)).toEqual([{ at: 'arrive', status: 'cnf' }, { at: 'cant', status: 'cnf' }, { at: 'tick', status: 'cnf' }]);
  });
});

describe('the end of a turn', () => {
  const item = (id: string) => (id === 'leftovers' ? 'Leftovers' : id);
  it('each end-of-turn effect has its chip and colour; other events have none', () => {
    expect(endTurnChip({ type: 'held', itemId: 'leftovers', what: 'heal' }, item)).toEqual({ word: 'Leftovers', color: '#7be08a' });
    expect(endTurnChip({ type: 'residual', status: 'tox' }, item)).toEqual({ word: 'Poison', color: '#a45cc8' });
    expect(endTurnChip({ type: 'residual', status: 'brn' }, item)?.word).toBe('Burn');
    expect(endTurnChip({ type: 'weatherDamage', weather: 'sand' }, item)).toEqual({ word: 'Sandstorm', color: '#e2c98a' });
    expect(endTurnChip({ type: 'held', itemId: 'leftovers', what: 'survive' }, item)).toBeNull();
    expect(endTurnChip({ type: 'damage' }, item)).toBeNull();
  });
  it('the parade takes only what comes after the last move, one chip per kind, at most four', () => {
    const events = [
      { type: 'residual', status: 'psn' },
      { type: 'move' },
      { type: 'damage' },
      { type: 'held', itemId: 'leftovers', what: 'heal' },
      { type: 'residual', status: 'psn' },
      { type: 'weatherDamage', weather: 'sand' },
      { type: 'weatherDamage', weather: 'sand' },
    ];
    const p = endTurnParade(events, item);
    expect(p.chips.map((c) => c.word)).toEqual(['Leftovers', 'Poison', 'Sandstorm']);
    expect([...p.at.entries()]).toEqual([[3, 0], [4, 1], [5, 2], [6, 2]]);
    expect(endTurnParade([{ type: 'move' }, { type: 'damage' }], item).chips).toEqual([]);
    const many = ['brn', 'psn'].map((status) => ({ type: 'residual', status })).concat([{ type: 'seedDamage' } as never, { type: 'bindDamage' } as never, { type: 'weatherDamage', weather: 'hail' } as never]);
    expect(endTurnParade(many, item).chips).toHaveLength(4);
  });
});
