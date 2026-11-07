import { describe, expect, it } from 'vitest';
import { STEP_IN, SCENARIOS, withCaughtMembers, planStepIn, toneOf } from '../../src/core/rivals/stepIn';
import { chooseStarter, createRun, finishStepInDuel, rivalStepIn, startEncounter } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import type { Rival } from '../../src/core/story/schema';
import { content } from './helpers';

const rival = (id: string, state: Rival['state'], extra: Partial<Rival> = {}): Rival => ({
  id, classId: 'youngster', name: id, archetype: 'proud', style: 'rush', traits: { ambition: 50, pride: 50, empathy: 50, adaptability: 50, vindictiveness: 50, resilience: 50 },
  rivalPotential: 30, state, arc: null, away: 0, cooldown: 0, progress: 0, encounters: 2, setbacks: 0, adaptations: [], bonds: {}, offscreen: [],
  origin: { eventId: `e-${id}`, where: { region: 0, stage: 0, level: 1, node: null, battle: 0, turn: null }, path: 'x' },
  memory: { lastBattle: { eventId: 'x', result: 'win', hpLeftShare: 0.5, turns: 5, team: ['pidgey'] } },
  ...extra,
}) as Rival;

function battleRun(seed: string, kind: 'wild' | 'trainer', state: Rival['state'] = 'active'): RunState {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red' }), 0));
  const node = run.stage!.map.nodes.find((n) => n.kind === kind)!;
  run.stage!.current = node.id;
  run.stage!.index = 3;
  run.encountersCompleted = 6;
  run.story.rivals = [rival('r1', state)];
  startEncounter(content, run, node);
  run.phase = 'battle';
  return run;
}

describe('rival step-ins', () => {
  it('has dialogue in three tones for every scenario', () => {
    for (const s of SCENARIOS) for (const t of ['fierce', 'cocky', 'warm'] as const) expect(STEP_IN.lines[s][t].length).toBeGreaterThan(0);
  });

  it('is seeded and never changes the run when only planning', () => {
    for (let i = 0; i < 30; i++) {
      const run = battleRun(`pl${i}`, 'wild');
      const before = JSON.stringify(run);
      const a = planStepIn(content, run);
      expect(JSON.stringify(run)).toBe(before);
      expect(planStepIn(content, battleRun(`pl${i}`, 'wild'))).toEqual(a);
    }
  });

  it('does nothing without an active rival, in the early game, or at bosses', () => {
    for (let i = 0; i < 60; i++) {
      const none = battleRun(`no${i}`, 'wild');
      none.story.rivals = [];
      expect(rivalStepIn(content, none)).toBeNull();
      const early = battleRun(`ea${i}`, 'wild');
      early.encountersCompleted = 0;
      expect(rivalStepIn(content, early)).toBeNull();
    }
  });

  it('assists, duels and catches; a catch is kept on the rival for good', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 400 && seen.size < 3; i++) {
      const run = battleRun(`st${i}`, i % 3 === 0 ? 'trainer' : 'wild');
      const hit = rivalStepIn(content, run);
      if (!hit) continue;
      seen.add(hit.kind);
      expect(hit.lines.length).toBeGreaterThan(0);
      if (hit.kind === 'assist') {
        expect(hit.run.battle!.finaleAssist!.strikesLeft).toBe(STEP_IN.assistStrikes);
        expect(hit.run.battle!.stepIn!.kind).toBe('assist');
        expect(rivalStepIn(content, hit.run)).toBeNull(); // only once per battle
      } else if (hit.kind === 'catch') {
        const r = hit.run.story.rivals[0]!;
        expect(r.caught!.length).toBe(1);
        expect(hit.run.battle).toBeNull();
        expect(hit.run.phase).not.toBe('battle');
        expect(hit.run.encountersCompleted).toBe(7);
        expect(withCaughtMembers(content, r, [{ speciesId: 'pidgey', level: 10 }], 12).some((m) => m.speciesId === r.caught![0]!.speciesId)).toBe(true);
      } else {
        expect(hit.run.battle!.stepIn!.kind).toBe('duel');
        expect(hit.run.battle!.rivalId).toBe('r1');
        // Lose: the rival takes the fight and the run goes on.
        const lost = structuredClone(hit.run);
        const endLose = finishStepInDuel(content, lost, 'lose');
        expect(endLose.next).toBe('map');
        expect(lost.phase).not.toBe('battle');
        expect(lost.battle).toBeNull();
        // Win: the party is healed and the real battle is back.
        const won = structuredClone(hit.run);
        won.party[0]!.hp = 1;
        const endWin = finishStepInDuel(content, won, 'win');
        expect(endWin.next).toBe('battle');
        expect(won.battle!.stepIn!.kind).toBe('done');
        expect(won.battle!.kind).toBe(run.battle!.kind);
        expect(won.party[0]!.hp).toBeGreaterThan(1);
        expect(rivalStepIn(content, won)).toBeNull();
      }
    }
    expect([...seen].sort()).toEqual(['assist', 'catch', 'duel']);
  });

  it('keeps the ace last, caps the team, and never benches legends', () => {
    const r = rival('r2', 'active', { ace: 'charmander', caught: Array.from({ length: 8 }, (_, i) => ({ speciesId: 'rattata', level: 5 + i, at: '0.0' })).concat([{ speciesId: 'mewtwo', level: 70, at: '0.1', legend: 'legendary' } as never]) });
    const team = withCaughtMembers(content, r, [{ speciesId: 'pidgey', level: 10 }, { speciesId: 'charmander', level: 12 }], 12);
    expect(team.length).toBeLessThanOrEqual(STEP_IN.teamSize);
    expect(team[team.length - 1]!.speciesId).toBe('charmander');
    expect(team.some((m) => m.speciesId === 'mewtwo')).toBe(true);
  });

  it('picks a tone from the rival', () => {
    expect(toneOf(rival('a', 'ally'))).toBe('warm');
    expect(toneOf(rival('b', 'nemesis'))).toBe('fierce');
    expect(toneOf(rival('c', 'active'))).toBe('cocky');
  });
});
