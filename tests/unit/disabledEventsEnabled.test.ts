import { describe, expect, it } from 'vitest';
import { applyEffect, conditionMet, eligibleEvents } from '../../src/core/events';
import { rivalLastResult } from '../../src/core/rivals/living';
import { chooseStarter, createRun } from '../../src/core/run';
import { hashSeed, Rng } from '../../src/core/rng';
import { freshWorldSim } from '../../src/core/worldSim/tick';
import { content } from './helpers';

const IDS = ['ev-trainer-reunion', 'ev-rival-emergency', 'ev-evil-team-raid', 'ev-legendary-disturbance', 'ev-rivals-victory', 'ev-rivals-defeat', 'ev-forgotten-research-lab', 'ev-treasure-expedition', 'ev-dimensional-collision'];
const newRun = () => structuredClone(chooseStarter(content, createRun(content, { runId: 'dis', seed: 'dis', archetypeId: 'red' }), 0));
const rivalWith = (result: 'win' | 'lose') => ({ state: 'active', encounters: 2, memory: { lastBattle: { eventId: 'x', result, hpLeftShare: 0.5 } } }) as never;

describe('the nine formerly disabled events', () => {
  it('are all enabled, and everything they open exists', () => {
    for (const id of IDS) {
      const e = content.events.get(id)!;
      expect(e.disabled, id).toBe(false);
      for (const c of e.choices) for (const o of [c.success, c.failure]) for (const x of o?.effects ?? []) if (x.kind === 'addEvent') expect(content.events.has(x.eventId), x.eventId).toBe(true);
    }
  });
  it('the dungeons they open are new and the Distortion World gate is live', () => {
    expect(content.events.get('dg-forgotten-lab-a')?.room).toBe(true);
    expect(content.events.get('dg-treasure-dig-a')?.room).toBe(true);
    expect(content.events.get('ps-distortion-world-gate')?.room).toBe(true);
  });
  it('lab and treasure show up in a normal run', () => {
    const ids = eligibleEvents(content, newRun()).map((e) => e.id);
    expect(ids).toContain('ev-forgotten-research-lab');
    expect(ids).toContain('ev-treasure-expedition');
  });
  it('rival milestones follow how the last meeting ended', () => {
    const run = newRun();
    expect(rivalLastResult(run)).toBeNull();
    run.story.rivals = [rivalWith('lose')];
    expect(conditionMet(content, run, { kind: 'rivalLast', result: 'lose' })).toBe(true);
    expect(conditionMet(content, run, { kind: 'rivalLast', result: 'win' })).toBe(false);
    run.story.rivals = [rivalWith('win')];
    expect(conditionMet(content, run, { kind: 'rivalLast', result: 'win' })).toBe(true);
  });
  it('the disturbance events need an unsettled disturbance, and calming settles it', () => {
    const run = newRun();
    run.stage!.index = 3; // past the minimum stage
    expect(conditionMet(content, run, { kind: 'disturbance' })).toBe(false);
    run.story.sim = { ...freshWorldSim(), disturbances: [{ region: 0, stage: 1 }] };
    expect(conditionMet(content, run, { kind: 'disturbance' })).toBe(true);
    applyEffect(content, run, { kind: 'calmDisturbance' }, new Rng(hashSeed('c')));
    expect(conditionMet(content, run, { kind: 'disturbance' })).toBe(false);
  });
  it('the trainer reunion needs the earlier challenge to have been played', () => {
    const run = newRun();
    const e = content.events.get('ev-trainer-reunion')!;
    expect(e.requires.every((c) => conditionMet(content, run, c))).toBe(false);
    run.itemCounters = { ...run.itemCounters, 'event-seen:ev-unexpected-challenge': 1 };
    expect(e.requires.every((c) => conditionMet(content, run, c))).toBe(true);
  });
});
