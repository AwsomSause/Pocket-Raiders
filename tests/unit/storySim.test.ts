// Story Overhaul S19: the simulation harness (bots, blueprint batches, pacing rules, ending reachability).

import { describe, expect, it } from 'vitest';
import { buildBlueprint, type DirectorInputs } from '../../src/core/campaign/storyDirector';
import { hashSeed, Rng } from '../../src/core/rng';
import { BOT_KINDS, botPick, type BotNode } from '../../src/core/story2/bots';
import type { StopContract } from '../../src/core/story2/schema';
import { backstoryEndingProblems, endingProblems, pacingFailures, pacingRules, simulateBlueprints } from '../../src/core/story2/sim';
import { content } from './helpers';
import { walkStoryRun } from './storyWalk';

const CIRCUIT = content.campaigns.get('orrery-circuit')!;
const base: Omit<DirectorInputs, 'seed'> = { contentHash: 'h', antagonist: 'rocket', rivals: { primary: 'kael', secondary: 'soren', friendly: 'mira' }, columns: CIRCUIT.columns, eliteFourSize: CIRCUIT.eliteFourSize };
const stop = (category: StopContract['category']): StopContract => ({ id: 's', stage: 1, act: 1, col: 3, category, weight: 'main', slotTags: [], intensity: 1, cinematic: false, fallback: 'f', locked: false, lane: 0 });
const node = (kind: string, unplayed: StopContract[] = [], harder = false): BotNode => ({ kind, harder, stops: unplayed, unplayed });

describe('the bots', () => {
  const rng = (b: string) => new Rng(hashSeed(`t::${b}`));
  it('there are six, each picks inside the list and the same seed picks the same', () => {
    expect(BOT_KINDS).toHaveLength(6);
    const nodes = [node('wild'), node('trainer', [stop('conflict')], true), node('wild', [stop('relationship'), stop('character')]), node('wild', [stop('narrative'), stop('discovery'), stop('recovery')])];
    for (const b of BOT_KINDS) {
      const a = Array.from({ length: 30 }, () => 0).map(((r) => () => botPick(b, nodes, r))(rng(b)));
      const c = Array.from({ length: 30 }, () => 0).map(((r) => () => botPick(b, nodes, r))(rng(b)));
      expect(a).toEqual(c);
      expect(a.every((i) => i >= 0 && i < nodes.length)).toBe(true);
    }
  });
  it('each bot follows its own taste', () => {
    const nodes = [node('wild'), node('trainer', [stop('conflict')], true), node('wild', [stop('relationship'), stop('character')]), node('wild', [stop('narrative'), stop('discovery'), stop('recovery')])];
    expect(botPick('first_choice', nodes, rng('a'))).toBe(0);
    expect(botPick('aggressive', nodes, rng('a'))).toBe(1);
    expect(botPick('relationship', nodes, rng('a'))).toBe(2);
    expect(botPick('completionist', nodes, rng('a'))).toBe(3);
    const r = rng('chaos');
    const picks = Array.from({ length: 200 }, () => botPick('chaos', nodes, r));
    expect(picks.filter((i) => i === 0).length).toBeGreaterThan(picks.length / 2); // it avoids Stops when it can
    expect(new Set(picks).size).toBeGreaterThan(1);
    expect(botPick('random', [node('wild')], rng('a'))).toBe(0);
  });
});

describe('blueprint batches', () => {
  it('1,000 blueprints: all valid, all different, pacing holds, endings reachable, same seeds same report', () => {
    const r = simulateBlueprints(content, 1000, base);
    expect(r.invalid).toEqual([]);
    expect(r.pacing).toEqual({});
    expect(r.endingProblems).toBe(0);
    expect(r.distinctBlueprints).toBe(1000);
    expect(r.slotsTotal).toBe(44000);
    expect(r.slotsFilled).toBeGreaterThan(0);
    expect(Object.keys(r.characters).length).toBeGreaterThan(0);
    expect(simulateBlueprints(content, 50, base)).toEqual(simulateBlueprints(content, 50, base));
  });
  it('the pacing rules catch a broken blueprint', () => {
    const bp = buildBlueprint(content, { ...base, seed: 'p1' });
    expect(pacingFailures(content, bp)).toEqual([]);
    expect(pacingRules(content, bp).map((r) => r.id)).toContain('downtime_cadence');
    const noRest = { ...bp, stops: bp.stops.map((s) => (s.category === 'recovery' || s.slotTags.includes('downtime') ? { ...s, category: 'narrative' as const, slotTags: [] } : s)) };
    expect(pacingFailures(content, noRest).join()).toContain('downtime_cadence');
    const reveals = { ...bp, stops: bp.stops.map((s, i) => (i < 3 ? { ...s, slotTags: ['reveal'] } : s)) };
    expect(pacingFailures(content, reveals).join()).toContain('reveals_spaced');
    const gaps = { ...bp, stops: bp.stops.filter((s) => s.stage !== 7) };
    expect(pacingFailures(content, gaps).join()).toContain('every_stage_has_a_stop');
    const dup = { ...bp, slots: bp.slots.map((sl, i) => (i < 4 ? { ...sl, event: 'ev_dup' } : sl)), stops: bp.stops.map((s, i) => (i < 4 ? { ...s, fallback: 'zz' } : s)) };
    expect(pacingFailures(content, dup).join()).toContain('event_repeats');
  });
  it('the ending check catches a missing Epilogue, and every backstory has a catch-all ending', () => {
    const bp = buildBlueprint(content, { ...base, seed: 'e1' });
    expect(endingProblems(bp)).toEqual([]);
    expect(endingProblems({ ...bp, stops: bp.stops.slice(0, -1) }).length).toBeGreaterThan(0);
    expect(backstoryEndingProblems(content)).toEqual([]);
    const gutted = { ...content, storyData: { ...content.storyData, backstories: content.storyData.backstories.map((b, i) => (i === 0 ? { ...b, catchAllEnding: undefined } : b)) } };
    expect(backstoryEndingProblems(gutted)).toHaveLength(1);
  });
});

describe('bots walk a real Story Run', () => {
  it('every bot reaches the Epilogue with the same seed, and the completionist plays the most Stops', () => {
    const results = BOT_KINDS.map((b) => walkStoryRun(b, 'walk1'));
    for (const w of results) {
      expect(w.error, `${w.bot}: ${w.error}`).toBeUndefined();
      expect(w.run.phase, w.bot).toBe('over');
      expect(w.ending, `${w.bot} reached the Epilogue`).toBe(true);
      expect(w.planned).toBe(44);
      expect(w.played, w.bot).toBeGreaterThan(30);
    }
    const most = Math.max(...results.map((w) => w.played));
    expect(results.find((w) => w.bot === 'completionist')!.played).toBe(most);
    const again = walkStoryRun('random', 'walk1');
    expect(again.run.story.v2?.stops.done).toEqual(results.find((w) => w.bot === 'random')!.run.story.v2?.stops.done);
  }, 600000);
});
