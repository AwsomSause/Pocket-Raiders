// Story Overhaul S10: the written rival scenes play on the Stops (Primary on rival Stops, Secondary and Friendly on spare Stops, the Primary's
// epilogue after the ending), each effect once, and the written counter slot swaps a studied team.
import { describe, expect, it } from 'vitest';
import { chooseStarter, createRun } from '../../src/core/run';
import { createPokemon } from '../../src/core/pokemon';
import { RunStateSchema, type RunState } from '../../src/core/state';
import { activeScene, chooseBackstory, finishScene, queueStopScene } from '../../src/core/story2/module';
import { dueRivalScene } from '../../src/core/story2/rivalPlan';
import { storyRivalPlan, storyRoles } from '../../src/core/story2/rivalPlan';
import { planFirstRival } from '../../src/core/encounters';
import { rivalById } from '../../src/core/story2/storyRivals';
import type { Rival } from '../../src/core/story/schema';
import { content } from './helpers';

const storyRun = (seed: string): RunState => {
  const run = chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', campaignId: 'orrery-circuit' }), 0);
  chooseBackstory(content, run, 'bs_viridian');
  return run;
};

function playAll(run: RunState): string[] {
  const v2 = run.story.v2!;
  const played: string[] = [];
  const drain = (): void => {
    for (let guard = 0; guard < 8 && v2.module!.active; guard++) {
      const s = activeScene(content, run)!;
      played.push(s.eventId);
      expect(finishScene(content, run, s.choices.length > 0 ? s.choices[0]!.id : undefined)).toBe(true);
    }
  };
  drain();
  v2.blueprint!.stops.forEach((stop, i) => {
    v2.stops.done.push(stop.id);
    v2.stops.index = i + 1;
    queueStopScene(content, run, stop.id);
    drain();
  });
  return played;
}

describe('rival key scenes', () => {
  it('plays the Primary\'s four scenes in beat order (the last after the ending), never one twice, across 20 seeds', () => {
    let secondary = 0, friendly = 0;
    for (let i = 0; i < 20; i++) {
      const run = storyRun(`rvs-${i}`);
      const roles = storyRoles(run)!;
      const played = playAll(run);
      const rv = played.filter((e) => e.startsWith('ev_rv_'));
      expect(new Set(played).size).toBe(played.length);
      const mine = rv.filter((e) => e.startsWith(`ev_${roles.primary}_`.replace('ev_rv_', 'ev_rv_')));
      expect(mine.map((e) => e.slice(-2))).toEqual(['b2', 'b4', 'b6', 'b8']);
      expect(played.indexOf(mine[3]!)).toBeGreaterThan(played.findIndex((e) => !e.startsWith('ev_rv_') && e.includes('ending') || e.startsWith('ev_gardener') ));
      secondary += rv.filter((e) => e.startsWith(`ev_${roles.secondary}_`)).length;
      friendly += rv.filter((e) => e.startsWith(`ev_${roles.friendly}_`)).length;
      for (const e of rv) expect(run.story.v2!.module!.played).toContain(e);
    }
    expect(secondary + friendly).toBeGreaterThan(0);
  });

  it('applies a choice once: the relationship shifts and the done flag is set', () => {
    const run = storyRun('rvs-effect');
    const v2 = run.story.v2!;
    const id = storyRoles(run)!.primary;
    const first = rivalById(content.storyData, id)!;
    v2.module!.queue = [];
    v2.module!.active = first.scenes.find((s) => s.beat === 2)!.event;
    const ch = content.storyData.characters.find((c) => c.id === first.character)!;
    expect(finishScene(content, run, content.storyData.events.find((e) => e.id === v2.module!.active)!.choices[0]!.id)).toBe(true);
    expect(v2.facts[`${id}_b2_done`]).toBe(true);
    const rec = v2.cast[ch.id]!;
    expect(Object.values(rec.attrs).some((n) => n !== 0)).toBe(true);
    expect(RunStateSchema.parse(JSON.parse(JSON.stringify(run))).story.v2!.module!.played).toContain(first.scenes[0]!.event);
  });

  it('dueRivalScene holds a later beat until the Act allows it and skips played scenes', () => {
    const run = storyRun('rvs-due');
    const id = storyRoles(run)!.primary;
    const def = rivalById(content.storyData, id)!;
    const ev = (b: number) => def.scenes.find((s) => s.beat === b)!.event;
    expect(dueRivalScene(content, run, 1, true, [], [])).toBe(ev(2));
    expect(dueRivalScene(content, run, 1, true, [ev(2)], [])).not.toBe(ev(4));
    expect(dueRivalScene(content, run, 2, true, [ev(2)], [])).toBe(ev(4));
    expect(dueRivalScene(content, run, 4, true, [ev(2), ev(4)], [])).toBe(ev(6));
  });
});

describe('written counter slots', () => {
  const fake = (over: Partial<Rival>): Rival => ({ id: 'rival-major', classId: 'rival', name: 'Dara Quinlan', archetype: 'a', style: 's', state: 'recurring', major: true, storyRival: 'rv_dara', memory: { lastBattle: { eventId: 'x', result: 'win', hpLeftShare: 0.5, turns: 5, team: [], foes: [] } }, ...over } as Rival);

  it('swaps the Act 1 slot for Pidove when the player beat Dara and leads with a Grass type; says it is studying you', () => {
    const run = storyRun('rvs-counter');
    run.story.v2!.blueprint!.rivals.primary = 'rv_dara';
    run.party[0] = createPokemon(content, 'bulbasaur', 10, run.party[0]!.uid);
    const rival = fake({});
    run.story.rivals.push(rival);
    const plan = storyRivalPlan(content, run, rival, planFirstRival(content, run.seed, 5), 1);
    expect(plan.members.map((m) => m.speciesId)).toEqual(['quaxly', 'pidove'].slice(0, 1).concat('pidove').slice(0, 2).map((s, i) => (i === 1 ? 'pidove' : s)));
    expect(plan.memoryNote).toBe("I've been studying you.");
  });

  it('does not swap when the player lost last time, when the lead is not a weak type, or for a Friendly rival', () => {
    const run = storyRun('rvs-nocounter');
    run.story.v2!.blueprint!.rivals.primary = 'rv_dara';
    run.party[0] = createPokemon(content, 'charmander', 10, run.party[0]!.uid);
    const base = planFirstRival(content, run.seed, 5);
    const lost = fake({ memory: { lastBattle: { eventId: 'x', result: 'lose', hpLeftShare: 0.5, turns: 5, team: [], foes: [] } } as never });
    run.story.rivals.push(lost);
    expect(storyRivalPlan(content, run, lost, base, 1).members[1]!.speciesId).toBe('starly');
    lost.memory.lastBattle.result = 'win';
    expect(storyRivalPlan(content, run, lost, base, 1).members[1]!.speciesId).toBe('starly');
    run.story.v2!.blueprint!.rivals = { primary: 'rv_hale', secondary: 'rv_ines', friendly: 'rv_dara' };
    run.party[0] = createPokemon(content, 'bulbasaur', 10, run.party[0]!.uid);
    expect(storyRivalPlan(content, run, lost, base, 1).members[1]!.speciesId).toBe('starly');
  });
});
