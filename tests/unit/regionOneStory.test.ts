// Director, 2026-11-16: one of Pidgey's Resolve, Poli-Pond or Flight North is forced into the first region, a different one per run.
import { describe, expect, it } from 'vitest';
import { chooseStarter, createRun, fastForwardToStage } from '../../src/core/run';
import { applyEffect } from '../../src/core/events';
import { REGION_ONE_OPENINGS, flightNorthCertain, regionOneHeld, regionOneOwed, regionOneStory, type RegionOneStory } from '../../src/core/co/regionOneStory';
import { getCampaign } from '../../src/core/regions';
import { hashSeed, Rng } from '../../src/core/rng';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

const begin = (seed: string, expansion: object = { eventsDensity: 'normal' }): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', expansion }), 0);
const onMap = (run: RunState): Set<string> => new Set(run.stage!.kind === 'stage' ? run.stage!.map.nodes.flatMap((n) => n.sides.map((s) => s.eventId).filter((id): id is string => !!id)) : []);
const STORIES: RegionOneStory[] = ['sky', 'pond', 'flight'];

describe('the first region shows one of three stories', () => {
  it('the pick is the same for the same run, and differs from run to run', () => {
    const picks = Array.from({ length: 60 }, (_, i) => regionOneStory(begin(`r1-${i}`)));
    expect(regionOneStory(begin('r1-0'))).toBe(picks[0]);
    for (const s of STORIES) expect(picks.filter((p) => p === s).length).toBeGreaterThan(8);
  });
  it("without the run's story events on, Pidgey's Resolve is never the pick", () => {
    for (let i = 0; i < 30; i++) expect(regionOneStory(begin(`r1-off-${i}`, {}))).not.toBe('sky');
  });
  it('the other two wait only while the run is in its first region', () => {
    const run = begin('r1-wait');
    const pick = regionOneStory(run);
    for (const s of STORIES) for (const id of REGION_ONE_OPENINGS[s]) {
      expect(regionOneHeld(run, id)).toBe(s !== pick);
      expect(regionOneOwed(run, id)).toBe(s === pick);
    }
    run.regionIndex = 1;
    for (const s of STORIES) for (const id of REGION_ONE_OPENINGS[s]) {
      expect(regionOneHeld(run, id)).toBe(false);
      expect(regionOneOwed(run, id)).toBe(false);
    }
    expect(regionOneHeld(begin('r1-wait'), 'rival-buyout')).toBe(false);
  });
  // 18 runs walked over every route (about 60 s on a quiet machine); busy CI runners passed the 90 s default.
  it('on the map: the picked story opens in the first region on every route, and the other two never do', () => {
    const stages = getCampaign(content, begin('r1-x').campaignId).stagesPerRegion;
    const seen = new Set<RegionOneStory>();
    for (let i = 0; i < 18; i++) {
      const run = begin(`r1-map-${i}`);
      const pick = regionOneStory(run);
      seen.add(pick);
      let shown = false;
      for (let s = 0; s < stages; s++) {
        if (s > 0) fastForwardToStage(content, run, 0, s);
        const ids = onMap(run);
        for (const other of STORIES.filter((x) => x !== pick)) for (const id of REGION_ONE_OPENINGS[other]) expect(ids.has(id), `${id} on stage ${s + 1} of run ${i} (pick ${pick})`).toBe(false);
        const mine = REGION_ONE_OPENINGS[pick].find((id) => ids.has(id));
        if (mine && run.stage!.kind === 'stage') {
          shown = true;
          // No route misses it: it sits on every node of its column.
          const nodes = run.stage!.map.nodes.filter((n) => n.sides.some((x) => x.eventId === mine));
          const column = nodes[0]!.column;
          expect(nodes.length).toBe(run.stage!.map.nodes.filter((n) => n.column === column).length);
        }
      }
      expect(shown, `run ${i} never showed ${pick}`).toBe(true);
    }
    expect(seen.size).toBe(3);
  }, 180_000);
  it('Flight North as the pick: the check always ends in the theft in the first region, and keeps its odds anywhere else', () => {
    const roll = content.events.get('gn-13-check')!.choices[0]!.success.effects.find((e) => e.kind === 'gn' && (e as { op: string }).op === 'roll')!;
    const stolen = (run: RunState, k: number): number => {
      applyEffect(content, run, roll, new Rng(hashSeed(`r1-roll-${k}`)));
      return Number(run.story.flags['ev:flight-stolen'] ?? 0);
    };
    let certain = 0, later = 0, n = 0;
    for (let i = 0; i < 90 && n < 20; i++) {
      const run = begin(`r1-fn-${i}`);
      if (regionOneStory(run) !== 'flight') continue;
      n += 1;
      expect(flightNorthCertain(run)).toBe(true);
      certain += stolen(run, i);
      const far = begin(`r1-fn-${i}`);
      far.regionIndex = 1;
      later += stolen(far, i);
    }
    expect(n).toBe(20);
    expect(certain).toBe(20);
    expect(later).toBeLessThan(18);
    expect(later).toBeGreaterThan(2);
  });
});
