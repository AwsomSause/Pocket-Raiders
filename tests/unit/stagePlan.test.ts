// Beta 4.4: the next stage is built from what the player did on the last one (core/stagePlan.ts).

import { describe, expect, it } from 'vitest';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { chooseNode, chooseStarter, createRun, takeTurn, type TurnResult } from '../../src/core/run';
import { pickPlannedTheme, stageSignals } from '../../src/core/stagePlan';
import type { RunState } from '../../src/core/state';
import { content, takeAnyReward } from './helpers';

function newRun(seed: string): RunState {
  return chooseStarter(content, createRun(content, { runId: 'r', seed, archetypeId: 'red' }), 0);
}

/** Beats the stage's gym leader with a level 100 lead, which starts the next stage. */
function clearStage(run: RunState): RunState {
  const map = run.stage!.map;
  const gym = map.nodes.find((n) => n.kind === 'gym')!;
  const before = map.nodes.find((n) => n.next.includes(gym.id))!;
  run.stage!.current = before.id;
  run.stage!.visited.push(before.id);
  run = chooseNode(content, run, gym.id);
  const lead = createPokemon(content, 'houndoom', 100, run.party[0]!.uid);
  lead.moves = [{ id: 'flamethrower', pp: 64 }];
  run.party[0] = lead;
  let turn: TurnResult | null = null;
  for (let i = 0; i < 50 && run.phase === 'battle'; i++) {
    run.party[0]!.hp = 1_000_000;
    turn = takeTurn(content, run, { kind: 'move', index: 0 });
    run = turn.run;
  }
  return takeAnyReward(turn!.run);
}

const planStops = (run: RunState) => run.stage!.map.nodes.flatMap((n) => n.sides.filter((s) => s.id.startsWith('plan-')));

describe('stage plan', () => {
  it('the first stage has no plan, and the snapshot starts it', () => {
    const run = newRun('plan-a');
    expect(run.stagePlan).toBeDefined();
    expect(run.stagePlan!.lines).toEqual([]);
    expect(stageSignals(content, run)).toEqual([]);
  });

  it('a quiet stage changes nothing: the theme is the same plain pick as before', () => {
    const run = newRun('plan-b');
    const a = pickPlannedTheme(content, run, [], new Rng(hashSeed('x')));
    const pool = [...content.themes.values()].filter((t) => !run.usedThemes.includes(t.id));
    expect(a.theme.id).toBe(new Rng(hashSeed('x')).pick(pool).id);
    expect(a.line).toBeNull();
  });

  it('a catching stage leads to more new types and a rare-Pokémon stop, and says why', () => {
    let run = newRun('plan-c');
    run.log.counters.pokemonCaught = (run.log.counters.pokemonCaught ?? 0) + 4;
    expect(stageSignals(content, run).map((s) => s.id)).toEqual(['catcher']);
    run = clearStage(run);
    expect(run.stage!.index).toBe(1);
    const lines = run.stagePlan!.lines.join(' ');
    expect(lines).toContain('You caught 4 Pokémon');
    const stops = planStops(run);
    expect(stops.length).toBeGreaterThan(0);
    expect(stops.every((s) => s.kind === 'event' && ['rare', 'swarm', 'wild', 'special'].includes(content.events.get(s.eventId!)!.stop))).toBe(true);
    // The next stage compares with a fresh snapshot.
    expect(stageSignals(content, run).find((s) => s.id === 'catcher')).toBeUndefined();
  });

  it('a team that struggled gets a kinder stage with extra healing', () => {
    let run = newRun('plan-d');
    run.rules.wipes += 1;
    expect(stageSignals(content, run)[0]!.id).toBe('struggled');
    run = clearStage(run);
    const map = run.stage!.map;
    const mid = Math.max(2, Math.floor(map.columns / 2));
    expect(map.nodes.filter((n) => n.column === mid).every((n) => n.sides.some((s) => s.kind === 'heal'))).toBe(true);
    expect(run.stagePlan!.lines.join(' ')).toContain('wiped out once');
  });

  it('a fighter is not told it struggled, and at most two signals shape a stage', () => {
    const run = newRun('plan-e');
    const c = run.log.counters;
    c.battlesWon = (c.battlesWon ?? 0) + 9;
    c.pokemonCaught = (c.pokemonCaught ?? 0) + 3;
    c.eventsCompleted = (c.eventsCompleted ?? 0) + 2;
    const ids = stageSignals(content, run).map((s) => s.id);
    expect(ids).toHaveLength(2);
    expect(ids).toEqual(['fighter', 'catcher']);
  });

  it('is deterministic: the same run and the same play build the same stage', () => {
    const build = () => {
      const run = newRun('plan-f');
      run.log.counters.eventsCompleted = (run.log.counters.eventsCompleted ?? 0) + 3;
      return clearStage(run);
    };
    const a = build();
    const b = build();
    expect(a.stage!.themeId).toBe(b.stage!.themeId);
    expect(JSON.stringify(a.stage!.map)).toBe(JSON.stringify(b.stage!.map));
    expect(a.stagePlan!.lines).toEqual(b.stagePlan!.lines);
  });
});
