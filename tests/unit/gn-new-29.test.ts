// Greenneedle gn.new.29 The Borrowed Team (tools/events/co/greenneedle-new-29.ts; rules in src/core/greenneedle/borrowed.ts).
import { describe, expect, it } from 'vitest';
import { createPokemon } from '../../src/core/pokemon';
import { BORROWED, BORROW_BENCH, borrowEnd, borrowMeet, borrowStart, borrowTokens } from '../../src/core/greenneedle/borrowed';
import { content } from './helpers';
import { choose, flagOf, gnRun, lose, open, scene, win } from './helpers/gnPlay';

const three = (seed: string) => {
  const run = gnRun(seed);
  run.party = [...run.party, createPokemon(content, 'pidgey', 20, 'p-pidgey'), createPokemon(content, 'rattata', 20, 'p-rattata')];
  return run;
};
const mine = (run: ReturnType<typeof gnRun>): string[] => run.party.map((m) => m.speciesId);

describe('gn.new.29 The Borrowed Team', () => {
  it('declining ends it for the run and changes nothing', () => {
    const run = three('bt-no');
    const before = mine(run);
    open(run, 'gn-new-29-hats');
    const r = choose(run, 'gn-new-29-hats', 'Not today.');
    expect(mine(r.run)).toEqual(before);
    expect(flagOf(r.run, 'borrow-met')).toBe(1);
  });

  it('swap: you command the rival\'s team, they command yours, and the teams come home', () => {
    let run = three('bt-win');
    const before = mine(run);
    open(run, 'gn-new-29-hats');
    run = choose(run, 'gn-new-29-hats', 'Swap.').run;
    expect(run.party.every((m) => m.gn?.includes(BORROWED))).toBe(true);
    expect(run.box.filter((m) => m.gn?.includes(BORROW_BENCH)).map((m) => m.speciesId)).toEqual(before);
    expect(scene(run, 'gn-new-29-fight').labels).toEqual(['Battle.']);
    const started = choose(run, 'gn-new-29-fight', 'Battle.');
    expect(started.battle).toBe(true);
    expect(started.run.battle!.enemyTeam.map((m) => m.speciesId)).toEqual(before);
    run = win(started.run);
    expect(mine(run)).toEqual(before);
    expect(run.party.some((m) => m.gn?.includes(BORROWED) || m.gn?.includes(BORROW_BENCH))).toBe(false);
    expect(run.box.some((m) => m.gn?.includes(BORROW_BENCH))).toBe(false);
    expect(flagOf(run, 'borrow-result')).toBe(1);
    expect(flagOf(run, 'borrow-knows')).toBe(1);
    expect(run.inventory['lucky-egg'] ?? 0).toBeGreaterThan(0);
    expect(flagOf(run, 'borrow-bonus')).toBe(1);
  });

  it('a loss gives no prize but the teams still come home (nobody\'s run ends)', () => {
    let run = three('bt-lose');
    const before = mine(run);
    open(run, 'gn-new-29-hats');
    run = choose(run, 'gn-new-29-hats', 'Swap.').run;
    run = lose(choose(run, 'gn-new-29-fight', 'Battle.').run);
    expect(run.phase).not.toBe('over');
    expect(mine(run)).toEqual(before);
    expect(flagOf(run, 'borrow-result')).toBe(2);
    expect(run.inventory['lucky-egg'] ?? 0).toBe(0);
  });

  it('boundary: the next rival meeting gets the one-battle bonus once, then it is spent', () => {
    const run = three('bt-bonus');
    borrowStart(content, run, (s, l, u) => createPokemon(content, s, l, u));
    borrowEnd(content, run, 1);
    const battle = { rival: true, playerStages: { atk: 0 }, enemyStages: { atk: 0 }, storyEffects: [] as string[] } as never as Parameters<typeof borrowMeet>[1];
    borrowMeet(run, battle);
    expect((battle as unknown as { playerStages: { atk: number } }).playerStages.atk).toBe(1);
    expect(flagOf(run, 'borrow-bonus')).toBe(2);
    const again = { rival: true, playerStages: { atk: 0 }, enemyStages: { atk: 0 }, storyEffects: [] as string[] } as never as Parameters<typeof borrowMeet>[1];
    borrowMeet(run, again);
    expect((again as unknown as { playerStages: { atk: number } }).playerStages.atk).toBe(0);
  });

  it('tokens fill in the rival and the lingerers', () => {
    const run = three('bt-tok');
    borrowStart(content, run, (s, l, u) => createPokemon(content, s, l, u));
    const text = borrowTokens(content, run, '{borrow:dont} {borrow:mine} {borrow:theirs}');
    expect(text).not.toContain('{borrow');
    expect(text).toContain('Don\'t break them');
  });
});
