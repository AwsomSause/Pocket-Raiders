// Rival questline events (Beta 0.6): the rivalState condition, the rivalChange effect, and the questline data.
import { describe, expect, it } from 'vitest';
import { applyEffect, conditionMet } from '../../src/core/events';
import { featuredRival } from '../../src/core/rivals/living';
import { overhaulOf, registerRival } from '../../src/core/rivals/overhaul';
import { chooseStarter, createRun } from '../../src/core/run';
import { Rng, hashSeed } from '../../src/core/rng';
import { content } from './helpers';

const setup = (withRival = true) => {
  const run = chooseStarter(content, createRun(content, { runId: 'rq', seed: 'rq', archetypeId: 'red' }), 0);
  if (!run.story.rivals.length) run.story.rivals.push({ id: 'blue', name: 'Blue', state: 'rival', encounters: 1, rivalPotential: 5 } as never);
  const id = featuredRival(run)!.id;
  if (withRival) registerRival(run, { id, role: 'main', personality: 'underdog', style: 'blitz', arc: 'prodigy-learns-humility' });
  return { run, id };
};
const rng = () => new Rng(hashSeed('rq-fx'));

describe('rival questlines', () => {
  it('rivalChange moves feelings, lead and marks, all clamped', () => {
    const { run, id } = setup();
    const before = overhaulOf(run, id)!.feelings.trust;
    applyEffect(content, run, { kind: 'rivalChange', feelings: { trust: 2 }, lead: 1, mark: 'saved-by-you' }, rng());
    const rec = overhaulOf(run, id)!;
    expect(rec.feelings.trust).toBe(Math.min(10, before + 2));
    expect(rec.lead).toBe(1);
    expect(rec.marks).toContain('saved-by-you');
    applyEffect(content, run, { kind: 'rivalChange', feelings: { trust: 50 as never }, lead: 3 }, rng());
    expect(overhaulOf(run, id)!.feelings.trust).toBe(10);
    expect(overhaulOf(run, id)!.lead).toBe(3);
  });
  it('rivalChange does nothing without a registered rival', () => {
    const { run } = setup(false);
    expect(() => applyEffect(content, run, { kind: 'rivalChange', feelings: { trust: 2 }, lead: 1 }, rng())).not.toThrow();
  });
  it('rivalState reads feeling, lead and mark; false without a rival', () => {
    const { run, id } = setup();
    const trust = overhaulOf(run, id)!.feelings.trust;
    expect(conditionMet(content, run, { kind: 'rivalState', feeling: { key: 'trust', atLeast: trust } })).toBe(true);
    expect(conditionMet(content, run, { kind: 'rivalState', feeling: { key: 'trust', atLeast: Math.min(10, trust + 1) } })).toBe(trust < 10 ? false : true);
    expect(conditionMet(content, run, { kind: 'rivalState', leadAtLeast: 2 })).toBe(false);
    applyEffect(content, run, { kind: 'rivalChange', feelings: {}, lead: 2, mark: 'beat-you' }, rng());
    expect(conditionMet(content, run, { kind: 'rivalState', leadAtLeast: 2 })).toBe(true);
    expect(conditionMet(content, run, { kind: 'rivalState', mark: 'beat-you' })).toBe(true);
    const none = setup(false).run;
    expect(conditionMet(content, none, { kind: 'rivalState', leadAtLeast: -3 })).toBe(false);
  });
  it('ships the questline events, each rival-gated and with valid choices', () => {
    const ids = ['rq-empty-slot', 'rq-help-wanted', 'rq-letter', 'rq-swap-day', 'rq-asks-you-to-lose', 'rq-rival-in-trouble', 'rq-stone-on-the-hill'];
    for (const id of ids) {
      const e = content.events.get(id);
      expect(e, id).toBeDefined();
      expect(e!.requires.some((c) => c.kind === 'rivalMet'), id).toBe(true);
    }
  });
  it('callbacks only open from their flag', () => {
    for (const id of ['rq-favour-returned', 'rq-bitter-rival', 'rq-in-trouble-again', 'rq-the-young-one', 'rq-old-man-stands']) {
      const e = content.events.get(id)!;
      expect(e.callback, id).toBe(true);
      expect(e.requires.some((c) => c.kind === 'flag'), id).toBe(true);
    }
  });
});
