// Story Overhaul S4: the Orrery Circuit campaign and the Narrative Director (blueprint, Story Stops, Acts, evil override, League gate).

import { describe, expect, it } from 'vitest';
import { evilConfig, HIDEOUT_AT_LEAGUE, leagueAfterRegion } from '../../src/core/campaign/circuit';
import {
  buildBlueprint, checksumOf, CHAMPION_STAGE, ELITE_STAGE, ensureStoryRun, replanStops, SCENE_STAGE, storyActOf, validateBlueprint, type DirectorInputs,
} from '../../src/core/campaign/storyDirector';
import type { Content } from '../../src/core/contentSchema';
import { createPokemon } from '../../src/core/pokemon';
import { freshEvil } from '../../src/core/evil/schema';
import { applyEvilEffect, evilConditionMet, evilOf, evilStageStart } from '../../src/core/evil/teams';
import { chooseNodeWithNotes, chooseStarter, createRun, debugJumpToColumn, debugJumpToLeague, mapChoices, resolveDecision, takeTurn } from '../../src/core/run';
import { RunStateSchema, type RunState } from '../../src/core/state';
import { content, takeAnyReward } from './helpers';

const CIRCUIT = content.campaigns.get('orrery-circuit')!;
const inputs = (seed: string): DirectorInputs => ({ seed, contentHash: 'h', antagonist: 'rocket', rivals: { primary: 'kael', secondary: 'soren', friendly: 'mira' }, columns: CIRCUIT.columns, eliteFourSize: CIRCUIT.eliteFourSize });
const storyRun = (seed: string): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', campaignId: 'orrery-circuit' }), 0);
const classicRun = (seed: string): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red' }), 0);

/** Walks onto the gym node with a level-400 lead against a one-HP gym team and wins it, then clicks through rewards and decisions. */
function winGym(run: RunState): RunState {
  let r = debugJumpToColumn(run, run.stage!.map.columns);
  const mon = createPokemon(content, 'houndoom', 400, r.party[0]!.uid);
  mon.moves = [{ id: 'flamethrower', pp: 64 }, { id: 'crunch', pp: 64 }];
  r.party[0] = mon;
  r = chooseNodeWithNotes(content, r, mapChoices(content, r)[0]!.id).run;
  for (let guard = 0; r.phase !== 'map' && r.phase !== 'over' && guard < 600; guard++) {
    if (r.phase === 'battle') {
      for (const m of r.battle!.enemyTeam) m.hp = Math.min(m.hp, 1);
      r = takeTurn(content, r, { kind: 'move', index: 1 }).run;
    }
    else if (r.phase === 'reward') r = takeAnyReward(r);
    else if (r.phase === 'decision') r = resolveDecision(content, r, r.pending[0]!.kind === 'caught' ? { kind: 'release' } : { kind: 'skipMove' }).run;
    else break;
  }
  return r;
}

describe('the blueprint', () => {
  it('10,000 generated blueprints pass every validator', () => {
    const bad: string[] = [];
    for (let i = 0; i < 10_000; i++) {
      const problems = validateBlueprint(content, buildBlueprint(content, inputs(`bp${i}`)), CIRCUIT.columns);
      if (problems.length > 0) bad.push(`bp${i}: ${problems.join('; ')}`);
    }
    expect(bad.slice(0, 5)).toEqual([]);
  });

  it('same seed, same blueprint; other seeds move unlocked Stops', () => {
    expect(buildBlueprint(content, inputs('same'))).toEqual(buildBlueprint(content, inputs('same')));
    const cols = new Set(Array.from({ length: 30 }, (_, i) => buildBlueprint(content, inputs(`v${i}`)).stops.map((s) => s.col).join()));
    expect(cols.size).toBeGreaterThan(1);
  });

  it('has 44 Stops in the Act budgets and evil beats 1 to 7 on stages 2, 6, 10, 14, 18, 22 and the League', () => {
    const bp = buildBlueprint(content, inputs('shape'));
    expect(bp.stops).toHaveLength(44);
    expect([1, 2, 3, 4, 5, 6, 7, 8].map((a) => bp.stops.filter((s) => s.act === a).length)).toEqual([8, 8, 8, 7, 6, 4, 2, 1]);
    expect(bp.stops.filter((s) => s.beat).map((s) => [s.beat, s.stage])).toEqual([[1, 2], [2, 6], [3, 10], [4, 14], [5, 18], [6, 22], [7, ELITE_STAGE]]);
    expect(bp.stops.filter((s) => s.stage === CHAMPION_STAGE).every((s) => s.col === CIRCUIT.eliteFourSize + 1)).toBe(true);
    expect(bp.stops.filter((s) => s.stage === SCENE_STAGE)).toHaveLength(3);
    const known = new Set(content.storyData.events.map((e) => e.id));
    expect(bp.slots.every((s) => s.event === s.fallbacks[0] || known.has(s.event))).toBe(true); // a story event by tag, or the fallback
  });

  it('fills slots from story events by tag, keeping the repeat rules', () => {
    const events = ['clue_a', 'clue_b', 'rest_a'].map((id) => ({ id, tags: id.startsWith('clue') ? ['clue', 'discovery'] : ['downtime'] }));
    const withEvents = { ...content, storyData: { ...content.storyData, events } } as unknown as Content;
    for (let i = 0; i < 200; i++) {
      const bp = buildBlueprint(withEvents, inputs(`ev${i}`));
      expect(validateBlueprint(withEvents, bp, CIRCUIT.columns)).toEqual([]);
      const filled = bp.slots.filter((s) => s.event !== s.fallbacks[0]);
      expect(filled.length).toBeGreaterThan(0);
      for (const id of ['clue_a', 'clue_b', 'rest_a']) {
        const at = filled.filter((s) => s.event === id).map((s) => s.stop);
        expect(at.length).toBeLessThanOrEqual(content.balance.story.sameEventMaxPerRun);
        for (let j = 1; j < at.length; j++) expect(at[j]! - at[j - 1]!).toBeGreaterThanOrEqual(content.balance.story.sameEventGapStops);
      }
      expect(bp.stops.filter((s) => s.beat).every((s) => bp.slots.find((x) => x.slot === s.id)!.event === `evil_beat_${s.beat}`)).toBe(true);
    }
  });

  it('the validator catches a broken blueprint', () => {
    const bp = buildBlueprint(content, inputs('broken'));
    bp.stops[0]!.col = 1;
    expect(validateBlueprint(content, bp, CIRCUIT.columns).join()).toMatch(/rule 1.*checksum|checksum/);
    const short = buildBlueprint(content, inputs('short'));
    short.stops.pop();
    expect(validateBlueprint(content, short, CIRCUIT.columns).join()).toMatch(/43 stops/);
  });

  it('replans only unlocked slots whose event is gone', () => {
    const run = storyRun('replan');
    const bp = run.story.v2!.blueprint!;
    const open = bp.stops.findIndex((s) => !s.locked);
    const locked = bp.stops.findIndex((s) => s.locked);
    bp.slots[open]!.event = 'ghost_event';
    bp.slots[locked]!.event = 'ghost_locked';
    replanStops(content, run, 0);
    expect(bp.slots[open]!.event).toBe(bp.stops[open]!.fallback);
    expect(bp.slots[locked]!.event).toBe('ghost_locked');
    expect(bp.replans).toEqual([{ at: 0, reason: 'event_missing' }]);
    expect(bp.checksum).toBe(checksumOf(bp));
  });
});

describe('Acts', () => {
  it('maps stage numbers to the six run Acts', () => {
    expect([0, 1, 5, 6, 11, 12, 18, 19, 24, 25, 26].map((s) => storyActOf(content, s))).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 6]);
  });
});

describe('the Orrery Circuit', () => {
  it('starts a Story Run with a frozen, valid blueprint, a fixed region order and Stops on the first map', () => {
    const run = storyRun('circuit1');
    expect(run.regionOrder).toEqual(['cairnmoor', 'tidewrack-reaches', 'orrery-basin']);
    expect(run.story.v2?.mode).toBe('story_run');
    const bp = run.story.v2!.blueprint!;
    expect(validateBlueprint(content, bp, CIRCUIT.columns)).toEqual([]);
    expect(run.story.v2!.stops.planned).toBe(44);
    for (const s of bp.stops.filter((x) => x.stage === 1)) {
      const nodes = run.stage!.map.nodes.filter((n) => n.column === s.col);
      expect(nodes.some((n) => n.storyStops?.includes(s.id))).toBe(true);
      if (s.weight === 'main') expect(nodes.every((n) => n.storyStops?.includes(s.id))).toBe(true);
    }
    expect(RunStateSchema.safeParse(run).success).toBe(true);
    // A reload keeps the same blueprint (it is never re-rolled).
    const again = RunStateSchema.parse(JSON.parse(JSON.stringify(run)));
    ensureStoryRun(content, again);
    expect(again.story.v2!.blueprint).toEqual(bp);
    expect(storyRun('circuit1').story.v2!.blueprint).toEqual(bp);
  });

  it('a damaged blueprint is re-told from the seed, not dropped', () => {
    const run = storyRun('circuit2');
    const good = structuredClone(run.story.v2!.blueprint!);
    run.story.v2!.blueprint!.stops[3]!.col = 11;
    ensureStoryRun(content, run);
    expect(run.story.v2!.blueprint).toEqual(good);
    expect(run.journal).toContain('The story was re-told.');
  });

  it('reaching a Stop plays it once: a line on the map and a chronicle moment', () => {
    let run = storyRun('circuit3');
    const first = run.story.v2!.blueprint!.stops[0]!;
    run = debugJumpToColumn(run, first.col!);
    const node = mapChoices(content, run).find((n) => n.storyStops?.includes(first.id))!;
    const out = chooseNodeWithNotes(content, run, node.id);
    expect(out.crossing).toMatch(/The road turns a page/);
    expect(out.run.story.v2!.stops.done).toContain(first.id);
    expect(out.run.story.chronicle.some((c) => JSON.stringify(c).includes('The road turns a page'))).toBe(true);
  });

  it('only the third region ends in a League; the first two go straight on and count as cleared', () => {
    expect([0, 1, 2].map((i) => leagueAfterRegion(CIRCUIT, i))).toEqual([false, false, true]);
    expect(leagueAfterRegion(content.campaigns.get('multi-region')!, 0)).toBe(true);
    let run = storyRun('circuit4');
    run.stage!.index = 7;
    run = winGym(run);
    expect(run.phase).toBe('map');
    expect(run.regionIndex).toBe(1);
    expect(run.stage!.kind).toBe('stage');
    expect(run.stage!.index).toBe(0);
    expect(run.regionsCleared).toEqual(['cairnmoor']);
    const gateStop = run.story.v2!.blueprint!.stops.find((s) => s.stage === 8 && s.col === null)!;
    expect(run.story.v2!.stops.done).toContain(gateStop.id);
    run.regionIndex = 2;
    run.stage!.index = 7;
    run = winGym(run);
    expect(run.stage!.kind).toBe('league');
    const champ = run.stage!.map.nodes.find((n) => n.kind === 'champion')!;
    expect(champ.storyStops).toHaveLength(4);
    expect(run.stage!.map.nodes.filter((n) => n.kind === 'elite').flatMap((n) => n.storyStops ?? [])).toHaveLength(6);
  });

  it('Classic runs are untouched: no story container, no Story Stops, no story regions', () => {
    for (let i = 0; i < 20; i++) {
      const run = classicRun(`classic${i}`);
      expect(run.story.v2).toBeUndefined();
      expect(run.regionOrder.some((id) => content.regions.get(id)!.story)).toBe(false);
      expect(run.stage!.map.nodes.some((n) => n.storyStops)).toBe(false);
    }
  });
});

describe('Evil Team beats on the Circuit (Appendix S.7)', () => {
  it('uses the campaign override; Classic keeps the global config', () => {
    expect(evilConfig(content, { campaignId: 'orrery-circuit' })).toMatchObject({ beatEvery: 4, firstStage: 2, hideoutAtLeague: true });
    expect(evilConfig(content, { campaignId: 'full' })).toMatchObject({ beatEvery: content.evilTeams.config.beatEvery, firstStage: content.evilTeams.config.firstStage, hideoutAtLeague: false });
  });

  it('beats 1 to 6 come due on stages 2, 6, 10, 14, 18, 22, then the hideout waits for the League', () => {
    const run = storyRun('evil1');
    run.story.evil = freshEvil();
    const due: number[] = [];
    for (let stage = 1; stage <= 24; stage++) {
      evilStageStart(content, run);
      const s = evilOf(run);
      if (s.teamId && evilConditionMet(content, run, { kind: 'evil', beat: s.beat } as never)) {
        due.push(stage);
        applyEvilEffect(content, run, { kind: 'evil', beat: true, heat: 0 } as never);
      }
    }
    expect(due).toEqual([2, 6, 10, 14, 18, 22]);
    expect(evilOf(run).nextAt).toBe(HIDEOUT_AT_LEAGUE);
    // League entry: beat 7 comes due and sits on the first corridor step with its Story Stop.
    const league = debugJumpToLeague(content, run);
    const s = evilOf(league);
    expect(s.nextAt).toBe(s.stages);
    expect(evilConditionMet(content, league, { kind: 'evil', beat: 6 } as never)).toBe(true);
    const step1 = league.stage!.map.nodes.find((n) => n.column === 1)!;
    expect(step1.sides.some((x) => x.kind === 'event' && x.eventId?.startsWith(`evil-${s.teamId}-`))).toBe(true);
    const hideout = league.story.v2!.blueprint!.stops.find((x) => x.beat === 7)!;
    expect(step1.storyStops).toContain(hideout.id);
  });
});
