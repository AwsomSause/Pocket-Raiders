// Story Run Starter arcs: one 3-scene arc per Remembrance line (arc_rm_<line>), played alongside any backstory for the
// run's own starter, and the arc Signature II waits for.

import { describe, expect, it } from 'vitest';
import { chooseStarter, createRun } from '../../src/core/run';
import { RunStateSchema, type RunState } from '../../src/core/state';
import { activeScene, chooseBackstory, finishScene, queueStopScene } from '../../src/core/story2/module';
import { checkSignatures, signatureMoves } from '../../src/core/story2/signature';
import { content } from './helpers';

const storyRun = (seed: string, backstory = 'bs_viridian'): RunState => {
  const run = chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', campaignId: 'orrery-circuit' }), 0);
  chooseBackstory(content, run, backstory);
  return run;
};

function playAll(run: RunState, pick = 0): string[] {
  const v2 = run.story.v2!;
  const played: string[] = [];
  const drain = (): void => {
    for (let guard = 0; guard < 4 && v2.module!.active; guard++) {
      const s = activeScene(content, run)!;
      played.push(s.eventId);
      expect(finishScene(content, run, s.choices.length > 0 ? s.choices[Math.min(pick, s.choices.length - 1)]!.id : undefined)).toBe(true);
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

describe('Starter arcs', () => {
  it('every one of the 84 lines has a 3-scene arc whose text exists, gated to its own starter', () => {
    const lines = content.storyData.remembrances;
    expect(lines).toHaveLength(84);
    for (const r of lines) {
      const arc = content.storyData.arcs.find((a) => a.id === `arc_${r.id}`);
      expect(arc, r.id).toBeDefined();
      expect(arc!.steps).toHaveLength(3);
      for (const step of arc!.steps) {
        const e = content.storyData.events.find((x) => x.id === step.event)!;
        expect(e.requires).toEqual([{ kind: 'starter_line', op: '==', value: r.id }]);
        for (const b of e.beats) expect(content.storyData.text[String(b.textKey)], `${e.id}`).toBeTruthy();
        for (const c of e.choices) expect(content.storyData.text[c.textKey]).toBeTruthy();
      }
    }
  });

  it('plays the starter own arc in order across a whole run, for every backstory, and only that line', () => {
    for (const bs of content.balance.story.module.enabledBackstories) {
      const run = storyRun('s14', bs); // a seed whose starter (Charmander) has a Remembrance line
      const line = run.story.v2!.starter!.lineId;
      const played = playAll(run);
      const own = played.filter((id) => id.startsWith('ev_sa_'));
      const name = line.replace(/^rm_/, '');
      expect(own, bs).toEqual([`ev_sa_${name}_1`, `ev_sa_${name}_2`, `ev_sa_${name}_3`]);
      expect(run.story.v2!.arcs[`arc_${line}`]?.state, bs).toBe('done');
      expect(run.story.v2!.facts[`sa_${name}`]).toBe('together');
    }
  });

  it('binds the starter as the Heartbond partner and names its line; Vulpix gets its line; a starter outside the lines gets no arc', () => {
    const run = storyRun('s14');
    expect(run.story.v2!.heartbond.partner).toBe(run.party[0]!.uid);
    expect(run.story.v2!.starter).toMatchObject({ lineId: 'rm_charmander', temperament: 'tm_brave' });
    const vulpix = storyRun('s1');
    expect(vulpix.party[0]!.speciesId).toBe('vulpix');
    expect(vulpix.story.v2!.starter?.lineId).toBe('rm_vulpix');
    const other = storyRun('s4'); // Geodude: not a Remembrance line
    expect(other.party[0]!.speciesId).toBe('geodude');
    expect(other.story.v2!.heartbond.partner).toBe(other.party[0]!.uid);
    expect(other.story.v2!.starter).toBeUndefined();
    expect(playAll(other).some((id) => id.startsWith('ev_sa_'))).toBe(false);
  });

  it('the same seed plays the same scenes, survives a save round trip, and then unlocks Signature II at Heartbond 7', () => {
    const a = storyRun('s6');
    const b = storyRun('s6');
    expect(playAll(a, 1)).toEqual(playAll(b, 1));
    const line = a.story.v2!.starter!.lineId;
    expect(a.story.v2!.facts[`sa_${line.replace(/^rm_/, '')}`]).toBe('trusted');
    const loaded = RunStateSchema.parse(JSON.parse(JSON.stringify(a)));
    loaded.story.v2!.heartbond.partner = loaded.party[0]!.uid;
    loaded.story.v2!.heartbond.latched.push(7);
    const first = content.storyData.remembrances.find((r) => r.id === line)!.line[0]!;
    expect(checkSignatures(content, loaded, 'recovery')).toEqual([{ slot: 'sig2', moveId: signatureMoves(first)!.sig2 }]);
  });
});
