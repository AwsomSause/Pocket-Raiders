// Beat 9 Field Trial (design O.4): a fixed script, five teaching beats in order, can't be lost, writes the rival's first values once.
import { describe, expect, it } from 'vitest';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { FIELD_TRIAL, FIELD_TRIAL_DONE, fieldTrialDue, finishFieldTrial, reactionFor, teachingOrder, trialCast, trialTurns, trialView } from '../../src/core/story2/fieldTrial';
import { typeEffectiveness } from '../../src/core/battle/damage';
import { content } from './helpers';

const storyRun = (seed = 'trial-1'): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', campaignId: 'orrery-circuit' }), 0);

describe('Field Trial', () => {
  it('teaches the five beats once each, in order; Quick keeps turns 0, 1, 3, 7', () => {
    expect(teachingOrder(trialTurns(false))).toEqual(['moves', 'switch', 'items', 'heartbond', 'feat']);
    expect(trialTurns(true).map((t) => t.turn)).toEqual([0, 1, 3, 7]);
    expect(teachingOrder(trialTurns(true))).toEqual(['moves', 'switch', 'feat']);
  });

  it('can never be lost: the player side never reaches 0 HP and the rival ends at 0', () => {
    for (const t of FIELD_TRIAL) expect(Math.min(t.playerHp, t.loanerHp)).toBeGreaterThan(0);
    expect(FIELD_TRIAL.at(-1)!.rivalHp).toBe(0);
  });

  it("picks a rival Pokemon that is super-effective against the starter's main type", () => {
    for (const starter of ['bulbasaur', 'charmander', 'squirtle', 'pikachu', 'eevee', 'geodude']) {
      const cast = trialCast(content, starter);
      const main = content.species.get(starter)!.types[0]!;
      const atk = content.species.get(cast.rival)!.types[0]!;
      expect(typeEffectiveness(content.typeChart, atk, [main]), starter).toBeGreaterThan(1);
      expect(content.species.has(cast.loaner)).toBe(true);
    }
  });

  it('is due once at the start of a Story Run and fills every line', () => {
    const run = storyRun();
    expect(fieldTrialDue(content, run)).toBe(true);
    const view = trialView(content, run, false)!;
    expect(view.steps).toHaveLength(8);
    for (const s of view.steps) for (const l of s.lines) expect(l.text).not.toMatch(/^$|\{\w+\}/);
    expect(view.reaction.lines[0]).toBeTruthy();
    expect(view.ask.options.map((o) => o.id)).toEqual(['full', 'quiet', 'off']);
    expect(trialView(content, run, true)!.tips).toHaveLength(2);
  });

  it("writes the main rival's first values once, then is not due again", () => {
    const run = storyRun('trial-2');
    const rival = run.story.v2!.blueprint!.rivals.primary;
    expect(finishFieldTrial(run)).toBe(true);
    const r = reactionFor(rival);
    expect(run.story.v2!.rel[rival]).toMatchObject({ respect: r.respect, rivalry: r.rivalry, suspicion: r.suspicion, met: true });
    expect(finishFieldTrial(run)).toBe(false);
    expect(run.story.v2!.rel[rival]!.respect).toBe(r.respect);
    expect(run.story.v2!.facts[FIELD_TRIAL_DONE]).toBe(true);
    expect(fieldTrialDue(content, run)).toBe(false);
  });

  it('is never due outside Story Runs', () => {
    const run = chooseStarter(content, createRun(content, { runId: 'x', seed: 'x', archetypeId: 'red' }), 0);
    expect(fieldTrialDue(content, run)).toBe(false);
  });
});
