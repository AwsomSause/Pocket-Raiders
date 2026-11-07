// Story Overhaul S5: the backstory module loader plays Viridian end to end (intro, events, arcs, echoes, ending), never applies an effect twice,
// survives a save/reload, and folds its results into the profile.

import { describe, expect, it } from 'vitest';
import { ensureStoryRun } from '../../src/core/campaign/storyDirector';
import { chooseStarter, createRun } from '../../src/core/run';
import { createProfile } from '../../src/core/profile';
import { RunStateSchema, type RunState } from '../../src/core/state';
import { buildChronicle, chronicleView } from '../../src/core/story2/chronicle';
import { validateModule } from '../../src/core/story2/moduleValidator';
import { activeScene, applyEffects, chooseBackstory, finishScene, foldModuleIntoProfile, pickEnding, queueStopScene } from '../../src/core/story2/module';
import { content } from './helpers';

const storyRun = (seed: string): RunState => {
  const run = chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', campaignId: 'orrery-circuit' }), 0);
  chooseBackstory(content, run, 'bs_viridian'); // these tests are about the Viridian slice; the seed would pick any of the five
  return run;
};

/** Plays every Stop of the blueprint in order, answering each choice scene with the option picked by `pick`. Returns the event ids played. */
function playAll(run: RunState, pick: (choices: string[], at: number) => number = () => 0): string[] {
  const v2 = run.story.v2!;
  const played: string[] = [];
  // The intro is waiting before the first Stop.
  const drain = (): void => {
    for (let guard = 0; guard < 4 && v2.module!.active; guard++) {
      const s = activeScene(content, run)!;
      played.push(s.eventId);
      expect(finishScene(content, run, s.choices.length > 0 ? s.choices[pick(s.choices.map((c) => c.id), played.length)]!.id : undefined)).toBe(true);
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

describe('the backstory module loader (S5)', () => {
  it('a Story Run gets Viridian, the rolled hidden flag and the intro waiting; Classic gets nothing', () => {
    const run = storyRun('s5-a');
    const m = run.story.v2!.module!;
    expect(m.backstory).toBe('bs_viridian');
    expect(run.story.v2!.protagonist).toMatchObject({ backstory: 'bs_viridian', signatureProp: 'prop_leaf_satchel' });
    expect(['practiced', 'resonant']).toContain(run.story.v2!.facts.rapport_nature);
    expect(m.active).toBe('ev_intro_viridian');
    const scene = activeScene(content, run)!;
    expect(scene.kicker).toBe('Your Story Begins');
    expect(scene.lines.length).toBeGreaterThan(1);
    expect(scene.choices).toHaveLength(3);
    const classic = chooseStarter(content, createRun(content, { runId: 'c', seed: 'c', archetypeId: 'red' }), 0);
    expect(classic.story.v2?.module).toBeUndefined();
  });

  it('the same seed rolls the same flag and plays the same scenes; the module passes the validator', () => {
    expect(storyRun('s5-b').story.v2!.facts.rapport_nature).toBe(storyRun('s5-b').story.v2!.facts.rapport_nature);
    expect(playAll(storyRun('s5-b'))).toEqual(playAll(storyRun('s5-b')));
    expect(validateModule(content.storyData, 'bs_viridian')).toEqual([]);
    const rolls = new Set(Array.from({ length: 60 }, (_, i) => storyRun(`roll${i}`).story.v2!.facts.rapport_nature));
    expect(rolls).toEqual(new Set(['practiced', 'resonant']));
  });

  it('plays the whole slice: intro, events, both arcs, an echo and exactly one ending, with a Chronicle', () => {
    const run = storyRun('s5-c');
    const played = playAll(run);
    const v2 = run.story.v2!;
    for (const id of ['ev_intro_viridian', 'ev_forest_remembers', 'ev_old_friend', 'ev_old_friend_2', 'ev_migration_1', 'ev_migration_5', 'ev_childhood_map', 'ev_first_aid', 'ev_researchers_offer', 'ev_last_summer']) expect(played).toContain(id);
    expect(played.filter((id) => id.startsWith('ev_echo_viridian')).length).toBeGreaterThan(0);
    expect(played.filter((id) => id.startsWith('ev_end_'))).toHaveLength(1);
    expect(new Set(played).size).toBe(played.length);
    expect(v2.arcs.arc_old_friend).toMatchObject({ state: 'done' });
    expect(v2.arcs.arc_migration).toMatchObject({ state: 'done' });
    expect(v2.facts['unlock.rm_weedle']).toBe(true);
    expect(v2.module!.ending).toBe(pickEnding(content, run));
    const rec = buildChronicle(run, '2026-11-07T00:00:00Z')!;
    expect(rec.ending).toBe(v2.module!.ending);
    expect(chronicleView(content.storyData, rec).lines.join('\n')).toContain('Ending:');
  });

  it('100 seeds with mixed answers always reach an ending, never repeat a scene, and every scene has text', () => {
    for (let i = 0; i < 100; i++) {
      const run = storyRun(`fuzz${i}`);
      const played = playAll(run, (ids, at) => (at * 7 + i) % ids.length);
      const ends = played.filter((id) => id.startsWith('ev_end_'));
      expect(ends, `fuzz${i}`).toHaveLength(1);
      expect(new Set(played).size, `fuzz${i}`).toBe(played.length);
      expect(played.length, `fuzz${i}`).toBeGreaterThanOrEqual(12);
      expect(RunStateSchema.safeParse(JSON.parse(JSON.stringify(run))).success).toBe(true);
    }
  });

  it('all four Viridian endings can be reached, in the grid order', () => {
    const endingFor = (facts: Record<string, string | number | boolean>): string | null => {
      const run = storyRun('s5-end');
      Object.assign(run.story.v2!.facts, facts);
      return pickEnding(content, run);
    };
    expect(endingFor({ rapport: 6, rapport_nature: 'resonant', migration: 'exposed' })).toBe('end_echo');
    expect(endingFor({ rapport: 6, rapport_nature: 'practiced', migration: 'exposed' })).toBe('end_gardener');
    expect(endingFor({ rapport: 5, rapport_nature: 'resonant', migration: 'negotiated' })).toBe('end_echo');
    expect(endingFor({ rapport: 5, rapport_nature: 'practiced', migration: 'negotiated' })).toBe('end_gardener');
    expect(endingFor({ rapport: 3, rapport_nature: 'practiced', migration: 'sabotaged' })).toBe('end_listener');
    expect(endingFor({ rapport: 1, rapport_nature: 'resonant', migration: 'none' })).toBe('end_reckoning');
    // And real play gets there: always taking the kind option reaches a good ending on some seed of each nature.
    const kind = ['follow', 'expose', 'ridge', 'sit', 'decline', 'speak'];
    const seen = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const run = storyRun(`kind${i}`);
      playAll(run, (ids) => Math.max(0, ids.findIndex((id) => id === kind.find((k) => ids.includes(k)))));
      seen.add(`${run.story.v2!.facts.rapport_nature}:${run.story.v2!.module!.ending}`);
    }
    expect(seen).toContain('resonant:end_echo');
    expect(seen).toContain('practiced:end_gardener');
  });

  it('an effect with an id never applies twice; a choice scene needs a valid choice', () => {
    const run = storyRun('s5-d');
    const eff = [{ id: 'fx_test_1', kind: 'add_counter', counter: 'rapport', amount: 2 }];
    applyEffects(content, run, eff);
    applyEffects(content, run, eff);
    expect(run.story.v2!.facts.rapport).toBe(2);
    expect(finishScene(content, run, 'not_a_choice')).toBe(false);
    expect(finishScene(content, run)).toBe(false);
    expect(run.story.v2!.module!.active).toBe('ev_intro_viridian');
    expect(finishScene(content, run, 'i_listen')).toBe(true);
    expect(run.story.v2!.facts).toMatchObject({ curiosity: 1, adaptability: 1, bs_viridian_intro: true });
  });

  it('reloads mid-scene: the waiting scene and the played list come back from the save', () => {
    const run = storyRun('s5-e');
    finishScene(content, run, 'they_talk');
    const v2 = run.story.v2!;
    v2.stops.done.push(v2.blueprint!.stops[0]!.id);
    v2.stops.index = 1;
    const copy = RunStateSchema.parse(JSON.parse(JSON.stringify(run)));
    expect(copy.story.v2!.module).toEqual(v2.module);
    expect(copy.story.v2!.facts).toEqual(v2.facts);
    expect(activeScene(content, copy)).toEqual(activeScene(content, run));
  });

  it('folds Remembrances, Lore, the ending and scene snapshots into the profile once', () => {
    const run = storyRun('s5-f');
    playAll(run);
    const profile = createProfile(content, 'p');
    foldModuleIntoProfile(profile, run);
    foldModuleIntoProfile(profile, run);
    const m = run.story.v2!.module!;
    expect(profile.story.endingsSeen).toEqual([m.ending]);
    expect(profile.story.remembrance.rm_weedle?.state).toBe('unlocked');
    expect(profile.story.lore.lore_weedle_two_readings?.state).toBe('known');
    expect(profile.story.sceneSnapshots.length).toBe(m.snapshots.length);
    expect(profile.story.sceneSnapshots.length).toBeGreaterThan(5);
  });
});
