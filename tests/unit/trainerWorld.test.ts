// Beta 0.5 M1/M2: trainers use the player's systems and keep a record (core/trainerWorld).
import { describe, expect, it } from 'vitest';
import { content, toBattle } from './helpers';
import { trainerHistoryLine, friendshipBond, WEALTH_HEAL, WEALTH_POTIONS } from '../../src/core/trainerWorld/trainerWorld';
import { rollLastStand, spectacleOf } from '../../src/core/battle/spectacle';
import { createBattle } from '../../src/core/battle/engine';
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

describe('trainer history lines', () => {
  it('a first meeting says nothing; a return reads the record', () => {
    const run = fresh();
    const rec = applyTrainerParity(content, run, t, team(2))!;
    expect(trainerHistoryLine(content, rec)).toBeNull();
    rec.meetings = 2; rec.losses = 2; rec.ace = 'pidgey';
    expect(trainerHistoryLine(content, rec)).toContain('Joey');
    rec.wins = 3; rec.losses = 0;
    expect(trainerHistoryLine(content, rec)).toContain('remembers beating you');
    rec.reputation = 60;
    expect(trainerHistoryLine(content, rec)).toContain('name people know');
  });
});

describe('trainer parity in play', () => {
  it('a trainer battle built by the run carries friendship, a record and a wealth', () => {
    // Walk the map until a trainer battle opens (the first few nodes may be wild).
    let run = fresh();
    for (let i = 0; i < 6 && run.battle?.kind !== 'trainer'; i++) {
      run = fresh();
      run.seed = `tw-${i}`;
      run = toBattle(run);
    }
    if (run.battle?.kind !== 'trainer') return; // no trainer node reachable with these seeds
    expect(run.battle.trainerWealth).toBeGreaterThanOrEqual(0);
    expect(run.battle.enemyTeam.every((m) => m.friendship > 0)).toBe(true);
    expect(Object.keys(run.story.trainers ?? {}).length).toBe(1);
  });

  it('the trainer side has its own Last Stand cap and a fixed scale', () => {
    const mons = team(2);
    const battle = createBattle('trainer', mons, 0, 'p', { classId: 'youngster', name: 'Joey', leaderId: null });
    const spec = spectacleOf(content, battle)!;
    spec.lastStands.push('x');
    spec.enemyStands.push(mons[0]!.uid);
    expect(rollLastStand(content, { battle, mon: mons[0]!, bond: 100, lastStanding: true, side: 'enemy' })).toBe(false);
    expect(friendshipBond(255)).toBe(100);
    expect(WEALTH_POTIONS.length).toBe(4);
    expect(WEALTH_HEAL.length).toBe(4);
  });

  it('a mastered move hits harder; a bonded foe holds on at 1 HP once', async () => {
    const { resolveTurn } = await import('../../src/core/battle/engine');
    const { Rng, hashSeed } = await import('../../src/core/rng');
    const hit = (mastered: boolean) => {
      const player = createPokemon(content, 'garchomp', 50, 'p1');
      player.moves = [{ id: 'earthquake', pp: 10 }];
      if (mastered) player.mastered = ['earthquake'];
      const foe = createPokemon(content, 'snorlax', 60, 'e1');
      const before = foe.hp;
      const battle = createBattle('trainer', [foe], 0, player.uid);
      const ctx = { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed('m')), captureRng: new Rng(hashSeed('c')), catchMultiplier: 1 };
      resolveTurn(ctx, { kind: 'move', index: 0 });
      return before - foe.hp;
    };
    const plain = hit(false);
    expect(hit(true)).toBeGreaterThan(plain);
    // A bonded last foe at full friendship survives a hit that would faint it, once per battle.
    let survived = 0;
    for (let i = 0; i < 40; i++) {
      const player = createPokemon(content, 'garchomp', 100, 'p1');
      player.moves = [{ id: 'earthquake', pp: 10 }];
      const foe = createPokemon(content, 'rattata', 5, `e${i}`);
      foe.friendship = 255;
      const battle = createBattle('trainer', [foe], 0, player.uid, { classId: 'youngster', name: 'J', leaderId: null });
      const ctx = { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed(`s${i}`)), captureRng: new Rng(hashSeed('c')), catchMultiplier: 1 };
      resolveTurn(ctx, { kind: 'move', index: 0 });
      if (foe.hp === 1) survived += 1;
    }
    expect(survived).toBeGreaterThan(0);
    expect(survived).toBeLessThan(40);
  });
});
