// Growth paths: doubles battles fill the same counters, credited to the Pokémon that acted (focus events).
import { describe, expect, it } from 'vitest';
import { makeDoubles } from '../../src/core/battle/doubles';
import { createPokemon } from '../../src/core/pokemon';
import { chooseStarter, createRun } from '../../src/core/run';
import { doublesTurnFacts } from '../../src/core/overhaul/growth';
import { openHistory } from '../../src/core/story/record';
import { recordBattleTurn } from '../../src/core/story/hooks';
import { content, toBattle } from './helpers';

describe('doublesTurnFacts', () => {
  it('credits moves and hits to whoever moved, damage taken to the focused Pokémon', () => {
    const f = doublesTurnFacts([
      { type: 'move', side: 'player' },
      { type: 'damage', side: 'enemy', amount: 10 },
      { type: 'focus', side: 'player', uid: 'b' },
      { type: 'move', side: 'player' },
      { type: 'miss', side: 'player' },
      { type: 'move', side: 'enemy' },
      { type: 'damage', side: 'player', amount: 7 },
    ], { player: 'a', enemy: 'x' });
    expect(f.get('a')).toMatchObject({ moved: true, hitFoe: true, tookHit: false });
    expect(f.get('b')).toMatchObject({ moved: true, missed: true, hitFoe: false, tookHit: true, absorbed: 7 });
  });
  it('a Pokémon that switched out is marked', () => {
    const f = doublesTurnFacts([{ type: 'switchOut', side: 'player', uid: 'a' }], { player: 'a', enemy: undefined });
    expect(f.get('a')?.switched).toBe(true);
  });
});

describe('doubles counters in the story hooks', () => {
  it('fills both partners\' counters, each for its own turn', () => {
    const run = structuredClone(toBattle(chooseStarter(content, createRun(content, { runId: 'gd', seed: 'gd', archetypeId: 'red' }), 0)));
    const second = createPokemon(content, 'machop', 10, 'second');
    run.party.push(second);
    run.battle!.enemyTeam.push(createPokemon(content, 'rattata', 3, 'e2'));
    makeDoubles(run.battle!, run.party);
    const [a, b] = [run.party[0]!, run.party[1]!];
    for (const m of run.party) openHistory(content, run, m.uid, m.speciesId, 'starter' as never);
    const before = structuredClone(run);
    const h = (u: string) => run.story.histories[u]?.growth ?? {};
    recordBattleTurn(content, before, run, [
      { type: 'move', side: 'player', moveId: 'tackle' } as never,
      { type: 'focus', side: 'player', uid: b.uid } as never,
      { type: 'move', side: 'player', moveId: 'tackle' } as never,
    ]);
    expect(h(a.uid).quietTurn).toBe(1);
    expect(h(b.uid).quietTurn).toBe(1);
    expect(h(a.uid).leadBattle).toBe(1);
    expect(h(b.uid).leadBattle).toBe(1);
  });
});
