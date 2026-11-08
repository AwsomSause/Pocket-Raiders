// Beta 0.5 M1/M2: trainers use the player's systems and keep a record (core/trainerWorld).
import { describe, expect, it } from 'vitest';
import { content } from './helpers';
import { chooseStarter, createRun } from '../../src/core/run';
import { createPokemon } from '../../src/core/pokemon';
import { applyTrainerParity, battleTrainerKey, noteTrainerMove, recordTrainerResult, specializationOf, trainerKey } from '../../src/core/trainerWorld/trainerWorld';
import { StoryStateSchema } from '../../src/core/story/schema';
import { createStoryState } from '../../src/core/story/record';

const ids = [...content.species.keys()];
const team = (n: number, level = 30) => ids.slice(10, 10 + n).map((s, i) => createPokemon(content, s, level + i, `e${i}`));
const fresh = () => structuredClone(chooseStarter(content, createRun(content, { runId: 'tw-seed', seed: 'tw-seed', archetypeId: 'red' }), 0));
const t = { classId: 'youngster', name: 'Joey', leaderId: null };

describe('trainer parity', () => {
  it('gives Pokémon friendship, a bond and a record, the same every time', () => {
    const a = fresh(); const b = fresh();
    const ta = team(3); const tb = team(3);
    const ra = applyTrainerParity(content, a, t, ta)!;
    const rb = applyTrainerParity(content, b, t, tb)!;
    expect(ta.map((m) => m.friendship)).toEqual(tb.map((m) => m.friendship));
    expect(ra).toEqual(rb);
    expect(ta.every((m) => m.friendship >= 0 && m.friendship <= 255)).toBe(true);
    expect(a.story.trainers?.[trainerKey(t)]).toBeDefined();
  });

  it('bosses bond and carry a mastered move; ordinary trainers start with none', () => {
    const run = fresh();
    const boss = { classId: 'gym-leader', name: 'Brock', leaderId: 'brock' };
    const bt = team(3);
    applyTrainerParity(content, run, boss, bt);
    const ace = bt.reduce((x, y) => (y.level >= x.level ? y : x));
    expect(ace.mastered?.length ?? 0).toBeLessThanOrEqual(content.balance.trainerWorld.maxMastered);
    expect(bt.some((m) => m.bondWith)).toBe(true);
    const ot = team(3);
    applyTrainerParity(content, run, t, ot);
    expect(ot.every((m) => !m.mastered)).toBe(true);
  });

  it('moves used often enough become mastered at the next meeting', () => {
    const run = fresh();
    const first = team(2);
    applyTrainerParity(content, run, t, first);
    const mon = first[1]!;
    const moveId = mon.moves[0]!.id;
    const battle = { kind: 'trainer', trainer: t, rivalId: null, enemyTeam: first, enemyIndex: 1 } as never;
    for (let i = 0; i < content.balance.trainerWorld.masteryUses; i++) noteTrainerMove(content, run, battle, moveId);
    const again = team(2);
    applyTrainerParity(content, run, t, again);
    expect(again[1]!.mastered).toContain(moveId);
  });

  it('records results and reputation after a battle, and keeps the note list short', () => {
    const run = fresh();
    const mons = team(2);
    applyTrainerParity(content, run, t, mons);
    for (let i = 0; i < 20; i++) {
      run.battle = { kind: 'trainer', trainer: t, rivalId: null, enemyTeam: mons, enemyIndex: 0, outcome: i % 2 ? 'win' : 'lose' } as never;
      recordTrainerResult(content, run, i);
    }
    const rec = run.story.trainers![trainerKey(t)]!;
    expect(rec.meetings).toBe(20);
    expect(rec.wins + rec.losses).toBe(20);
    expect(rec.notes.length).toBeLessThanOrEqual(content.balance.trainerWorld.notesKept);
    expect(battleTrainerKey({ kind: 'wild', trainer: null, rivalId: null } as never)).toBeNull();
  });

  it('picks a specialization from the team and works for every team', () => {
    expect(specializationOf(content, team(3), 'x')).toBeTruthy();
    const trickRoom = team(2);
    trickRoom[0]!.moves = [{ id: 'trick-room', pp: 5 }];
    expect(specializationOf(content, trickRoom, 'x')).toBe('trickRoom');
  });

  it('a story saved before trainer records existed still loads', () => {
    const old = createStoryState() as Record<string, unknown>;
    delete old.trainers;
    expect(StoryStateSchema.safeParse(old).success).toBe(true);
  });
});
