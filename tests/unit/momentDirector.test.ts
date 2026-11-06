// Overhaul slice 5: the Moment Director's per-run caps and cooldowns (balance.json `moments`).

import { describe, expect, it } from 'vitest';
import { momentAllowed, momentsLeft, momentsShown, noteMoments } from '../../src/core/story/momentDirector';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { buildContent } from '../../src/data';
import { autoplay } from './autoplay';
import { content } from './helpers';

const newRun = (): RunState => structuredClone(chooseStarter(content, createRun(content, { runId: 'md', seed: 'md', archetypeId: 'red' }), 0));
const at = (run: RunState, battle: number) => ((run.encountersCompleted = battle), run);

describe('Moment Director', () => {
  it('landmark moments: at most the cap per run, and a cooldown between two (normal)', () => {
    const rule = content.balance.moments.landmark;
    expect(rule.perRun).toBeGreaterThan(0);
    const run = at(newRun(), 0);
    expect(momentAllowed(content, run, 'landmark')).toBe(true);
    noteMoments(run, 'landmark');
    expect(momentsShown(run, 'landmark')).toBe(1);
    expect(momentAllowed(content, at(run, rule.cooldownBattles - 1), 'landmark')).toBe(false);
    expect(momentAllowed(content, at(run, rule.cooldownBattles), 'landmark')).toBe(true);
    for (let i = 1; i < rule.perRun!; i++) noteMoments(at(run, i * rule.cooldownBattles), 'landmark');
    expect(momentsLeft(content, at(run, 1000), 'landmark')).toBe(0);
  });

  it('a tier with no cap and no cooldown is never limited; counts survive in the save-safe story flags (boundary)', () => {
    const c = buildContent();
    c.balance.moments.minor = { perRun: null, cooldownBattles: 0 };
    const run = newRun();
    for (let i = 0; i < 500; i++) noteMoments(run, 'minor');
    expect(momentAllowed(c, run, 'minor')).toBe(true);
    expect(run.story.flags['md:minor:n']).toBe(500);
    noteMoments(run, 'minor', 0);
    expect(momentsShown(run, 'minor')).toBe(500);
  });

  it('at most one cinematic (major) moment per battle, as the director chose', () => {
    expect(content.balance.moments.major).toEqual({ perRun: null, cooldownBattles: 1 });
    const run = at(newRun(), 4);
    noteMoments(run, 'major');
    expect(momentAllowed(content, run, 'major')).toBe(false);
    expect(momentAllowed(content, at(run, 5), 'major')).toBe(true);
    const played = autoplay({ seed: 'md-one', steps: 400, healOnMap: true, smart: true });
    expect(momentsShown(played, 'major')).toBeLessThanOrEqual(played.encountersCompleted + 1);
  });

  it('a cap of 0 switches a tier off (failure case: nothing may show)', () => {
    const c = buildContent();
    c.balance.moments.landmark = { perRun: 0, cooldownBattles: 0 };
    expect(momentAllowed(c, newRun(), 'landmark')).toBe(false);
  });

  it('caps cinematic story cues across a whole run, and the same seed gives the same count', () => {
    const c = buildContent();
    c.balance.moments.major = { perRun: 2, cooldownBattles: 0 };
    const a = autoplay({ content: c, seed: 'md-run', steps: 500, healOnMap: true, smart: true });
    expect(momentsShown(a, 'major')).toBeLessThanOrEqual(2);
    const off = buildContent();
    off.balance.moments.major = { perRun: null, cooldownBattles: 0 };
    const free = autoplay({ content: off, seed: 'md-run', steps: 500, healOnMap: true, smart: true });
    expect(momentsShown(free, 'major')).toBeGreaterThan(2);
    expect(momentsShown(autoplay({ content: off, seed: 'md-run', steps: 500, healOnMap: true, smart: true }), 'major')).toBe(momentsShown(free, 'major'));
    // Only how a moment is told changes: the battles fought are the same.
    expect(a.encountersCompleted).toBe(free.encountersCompleted);
  });
});
