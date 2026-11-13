// Beta 0.6 E2: the world-state track (Kanto "The Ledger Fills"). Reducer table, clamps, idempotence, effects, run glue, save shape.

import { describe, expect, it } from 'vitest';
import { ExpansionRunSchema } from '../../src/core/expansion/schema';
import { freshTrack, insuredIndex, kantoEffects, reduceTrack, trackEffectsFor, TRACK_INPUTS, TrackStateSchema, wildTaken, type TrackInput } from '../../src/core/expansion/track';
import { advanceTrack, healStopShut, trackEffects, trackOnClimax, trackOnOperation, trackShopFactor, trackStep, trackWildWeight } from '../../src/core/expansion/trackRun';
import { trackPage } from '../../src/core/expansion/trackView';
import { resolveStoryRaid } from '../../src/core/raid/storyRaids';
import { createRun, chooseStarter } from '../../src/core/run';
import { content } from './helpers';

const cfg = content.balance.expansionTrack;
const run = (seed: string, tracks = true) => {
  const r = chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', ...(tracks ? { expansion: { worldTracks: true } } : {}) }), 0);
  r.regionOrder[0] = 'kanto';
  return r;
};

describe('reduceTrack', () => {
  it('adds a step for a failed or declined raid and for the climax, removes one for a success or a turned officer', () => {
    const rows: [TrackInput, number][] = [['raidFailed', 1], ['raidDeclined', 1], ['climaxScheduled', 1], ['raidSuccess', -1], ['officerTurned', -1]];
    for (const [input, delta] of rows) {
      const from = { ...freshTrack(), step: 2 };
      expect(reduceTrack(from, input, 'k').step).toBe(2 + delta);
    }
    expect(TRACK_INPUTS).toHaveLength(rows.length);
  });

  it('stays within 0 to 5 and keeps the peak', () => {
    let s = freshTrack();
    expect(reduceTrack(s, 'raidSuccess', 'a').step).toBe(0);
    for (let i = 0; i < 9; i++) s = reduceTrack(s, 'raidFailed', `f${i}`);
    expect(s.step).toBe(5);
    s = reduceTrack(s, 'raidSuccess', 's1');
    expect(s.step).toBe(4);
    expect(s.peak).toBe(5);
  });

  it('counts a key once, and does not mutate its input', () => {
    const s = freshTrack();
    const a = reduceTrack(s, 'raidFailed', 'op1');
    expect(reduceTrack(a, 'raidFailed', 'op1')).toBe(a);
    expect(s.step).toBe(0);
    expect(a.log).toEqual([{ input: 'raidFailed', delta: 1, step: 1 }]);
  });

  it('round-trips through its schema with bounded history', () => {
    let s = freshTrack();
    for (let i = 0; i < 80; i++) s = reduceTrack(s, i % 2 ? 'raidSuccess' : 'raidFailed', `k${i}`);
    expect(TrackStateSchema.parse(JSON.parse(JSON.stringify(s)))).toEqual(s);
    expect(s.log.length).toBeLessThanOrEqual(12);
    expect(s.applied.length).toBeLessThanOrEqual(40);
  });
});

describe('Kanto effects', () => {
  it('turn on step by step and stack', () => {
    const at = (n: number) => kantoEffects(n, cfg);
    expect(at(0)).toEqual({ shopMarkup: 0, healShutAtNight: false, roadblocks: false, wildShrink: 0, adverts: false });
    expect(at(1).shopMarkup).toBe(0.1);
    expect(at(2).healShutAtNight).toBe(true);
    expect(at(3).roadblocks).toBe(true);
    expect(at(4).wildShrink).toBe(0.25);
    expect(at(5).adverts).toBe(true);
    expect(at(5).shopMarkup).toBe(0.1);
  });

  it('never carries anything that could raise an enemy (closed list of fields)', () => {
    const keys = Object.keys(kantoEffects(5, cfg)).sort();
    expect(keys).toEqual(['adverts', 'healShutAtNight', 'roadblocks', 'shopMarkup', 'wildShrink']);
    expect(trackEffectsFor('johto', 5, cfg).shopMarkup).toBe(0);
  });

  it('marks exactly one of N shops and a stable quarter of species', () => {
    const picks = new Set(Array.from({ length: 40 }, (_, i) => insuredIndex('s', `0:${i}`, 3)));
    expect([...picks].every((p) => p >= 0 && p < 3)).toBe(true);
    expect(insuredIndex('s', '0:1', 3)).toBe(insuredIndex('s', '0:1', 3));
    const taken = [...content.species.keys()].slice(0, 400).filter((id) => wildTaken('seed', 'kanto', id, 0.25)).length;
    expect(taken).toBeGreaterThan(60);
    expect(taken).toBeLessThan(140);
  });
});

describe('on a run', () => {
  it('stays inert without the world-tracks flag', () => {
    const r = run('wt-off', false);
    trackOnOperation(r, 0, 'x', 'succeeded');
    expect(r.expansion?.track).toBeUndefined();
    expect(trackWildWeight(content, r, 'pidgey')).toBe(1);
  });

  it('moves with operations and the climax, once each', () => {
    const r = run('wt-ops');
    trackOnOperation(r, 0, 'op-a', 'succeeded');
    trackOnOperation(r, 0, 'op-a', 'succeeded');
    expect(trackStep(r, 'kanto')).toBe(1);
    trackOnOperation(r, 0, 'op-b', 'foiled');
    expect(trackStep(r, 'kanto')).toBe(0);
    trackOnClimax(r, 0);
    trackOnClimax(r, 0);
    expect(trackStep(r, 'kanto')).toBe(1);
    expect(ExpansionRunSchema.parse(JSON.parse(JSON.stringify(r.expansion))).track?.kanto?.step).toBe(1);
  });

  it('marks up exactly one shop per stage at step 1+, and shuts the first Center at night at step 2+', () => {
    const r = run('wt-fx');
    expect(trackEffects(content, r).shopMarkup).toBe(0);
    advanceTrack(r, 'kanto', 'raidFailed', 'a');
    advanceTrack(r, 'kanto', 'raidFailed', 'b');
    const stage = r.stage!;
    const shopNodes = stage.map.nodes.filter((n) => n.sides.some((s) => s.kind === 'shop'));
    let marked = 0;
    for (const n of shopNodes) {
      r.shop = { type: 'mart', place: `${r.regionIndex}:${stage.index}:${n.id}` };
      if (trackShopFactor(content, r) > 1) marked += 1;
    }
    expect(marked).toBe(shopNodes.length > 0 ? 1 : 0);
    const heal = stage.map.nodes.flatMap((n) => n.sides).filter((s) => s.kind === 'heal');
    r.clock.tick = 3;
    expect(heal.filter((s) => healStopShut(content, r, s.id)).length).toBe(heal.length > 0 ? 1 : 0);
    r.clock.tick = 0;
    expect(heal.some((s) => healStopShut(content, r, s.id))).toBe(false);
  });
});

describe('Notebook track page', () => {
  it('shows only what has been reached and hides the rest as ???', () => {
    const r = run('wt-page');
    expect(trackPage(content, run('wt-none', false))).toBeNull();
    let p = trackPage(content, r)!;
    expect(p.title).toBe('The Ledger Fills');
    expect(p.seenCount).toBe(0);
    expect(p.steps.map((s) => s.state)).toEqual(['next', 'locked', 'locked', 'locked', 'locked']);
    advanceTrack(r, 'kanto', 'raidFailed', 'a');
    advanceTrack(r, 'kanto', 'raidFailed', 'b');
    advanceTrack(r, 'kanto', 'raidFailed', 'c');
    advanceTrack(r, 'kanto', 'raidSuccess', 'd');
    p = trackPage(content, r)!;
    expect(p.steps.map((s) => s.state)).toEqual(['seen', 'now', 'seen', 'next', 'locked']);
    expect(p.seenCount).toBe(3);
    expect(p.steps[4]!.rule).toBe('???');
    expect(p.scales[3]!.text).toContain('???');
    expect(p.scales[2]!.seen).toBe(true);
  });
});

describe('story raids drive the track', () => {
  it('failed and declined raids add a step, a won raid removes one, a partial changes nothing, and operations step aside', () => {
    const r = run('wt-raid');
    resolveStoryRaid(content, r, 1, 'failure');
    resolveStoryRaid(content, r, 2, 'declined');
    expect(trackStep(r, 'kanto')).toBe(2);
    resolveStoryRaid(content, r, 3, 'partial');
    expect(trackStep(r, 'kanto')).toBe(2);
    resolveStoryRaid(content, r, 4, 'success');
    expect(trackStep(r, 'kanto')).toBe(1);
    trackOnOperation(r, 0, 'op-z', 'succeeded');
    expect(trackStep(r, 'kanto')).toBe(1);
  });
});

describe('the track event effect and condition', () => {
  it('moves the track once per stop and reads back as a condition', async () => {
    const { applyEffect, conditionMet } = await import('../../src/core/events');
    const { Rng, hashSeed } = await import('../../src/core/rng');
    const r = run('wt-effect');
    advanceTrack(r, 'kanto', 'raidFailed', 'a');
    advanceTrack(r, 'kanto', 'raidFailed', 'b');
    expect(conditionMet(content, r, { kind: 'track', atLeast: 2, atMost: 5 })).toBe(true);
    applyEffect(content, r, { kind: 'track', input: 'raidSuccess' }, new Rng(hashSeed('x')));
    applyEffect(content, r, { kind: 'track', input: 'raidSuccess' }, new Rng(hashSeed('x')));
    expect(trackStep(r, 'kanto')).toBe(1);
    expect(conditionMet(content, r, { kind: 'track', atLeast: 2, atMost: 5 })).toBe(false);
  });
});
