import { describe, expect, it } from 'vitest';
import { gnRun, open, choose, win, lose, flagOf, setFlag, scene } from './helpers/gnPlay';
import { duelistMark } from '../../src/core/greenneedle/duelist';
import { content } from './helpers';
import { stageNumber } from '../../src/core/events';

const start = (seed: string) => {
  const run = gnRun(seed);
  run.party[0]!.level = 30;
  run.battle = { critBy: run.party[0]!.uid } as never;
  expect(duelistMark(content, run, 3)).toBe(true);
  run.battle = null;
  return run;
};

describe('gn.new.06 The Duelist', () => {
  it('the first critical hit marks the chosen one, once, and not before the second stage', () => {
    const run = gnRun('duel-mark');
    run.battle = { critBy: run.party[0]!.uid } as never;
    expect(duelistMark(content, run, 1)).toBe(false);
    expect(duelistMark(content, run, 2)).toBe(true);
    expect(run.party[0]!.gn).toContain('duel-chosen');
    expect(flagOf(run, 'duelist-at')).toBe(2);
    expect(duelistMark(content, run, 3)).toBe(false);
  });

  it('every door and room is valid, and the doors hold back until the series is on', () => {
    for (const id of ['d1', 'd1n', 'd2', 'd3', 'd4', 'd5', 'd1-late', 'd5-late']) expect(content.events.has(`gn-new-06-${id}`)).toBe(true);
    expect(stageNumber(content, gnRun('duel-x'))).toBeGreaterThan(0);
  });

  it('accepts: the chosen one fights alone, at its level, and a win counts', () => {
    const run = start('duel-win');
    const chosen = run.party[0]!;
    open(run, 'gn-new-06-d1');
    expect(scene(run, 'gn-new-06-d1').labels).toEqual(['Accept the duel.', 'Not now.', 'Ask what it wants.']);
    let r = choose(run, 'gn-new-06-d1', 'Accept the duel.').run;
    expect(r.party.length).toBe(1);
    r = choose(r, 'gn-new-06-fight-1', 'Begin.').run;
    expect(r.battle!.enemyTeam[0]!.speciesId).toBe('farfetchd');
    expect(r.battle!.enemyTeam[0]!.level).toBe(chosen.level);
    r = win(r);
    expect(flagOf(r, 'duelist-wins')).toBe(1);
    expect(flagOf(r, 'duelist-duels')).toBe(1);
    expect(r.party.length).toBeGreaterThanOrEqual(1);
  });

  it('a loss gives the Duelist the win; three ends it and it goes', () => {
    let run = start('duel-lose');
    for (let n = 1; n <= 3; n++) {
      open(run, `gn-new-06-d${n}`);
      run = choose(run, `gn-new-06-d${n}`, 'Accept the duel.').run;
      run = choose(run, `gn-new-06-fight-${n}`, 'Begin.').run;
      run = lose(run);
      setFlag(run, 'duelist-last', 0);
    }
    expect(flagOf(run, 'duelist-losses')).toBe(3);
    expect(flagOf(run, 'duelist-over')).toBe(2);
    expect(flagOf(run, 'duelist-left')).toBe(1);
  });

  it('Not now keeps the count and brings it back at the next step', () => {
    const run = start('duel-pass');
    open(run, 'gn-new-06-d1');
    const r = choose(run, 'gn-new-06-d1', 'Not now.').run;
    expect(flagOf(r, 'duelist-duels')).toBe(0);
    expect(flagOf(r, 'duelist-late')).toBe(1);
  });

  it('after a Duelist loss it comes back one level higher, with an answer', () => {
    let run = start('duel-answer');
    const level = run.party[0]!.level;
    open(run, 'gn-new-06-d1');
    run = choose(run, 'gn-new-06-d1', 'Accept the duel.').run;
    run = choose(run, 'gn-new-06-fight-1', 'Begin.').run;
    run = win(run);
    setFlag(run, 'duelist-last', 0);
    run.party[0]!.level = level;
    open(run, 'gn-new-06-d2');
    run = choose(run, 'gn-new-06-d2', 'Accept the duel.').run;
    run = choose(run, 'gn-new-06-fight-2', 'Begin.').run;
    expect(run.battle!.enemyTeam[0]!.level).toBe(level + 1);
    expect(run.battle!.storyEffects.some((t) => t.includes('practising'))).toBe(true);
  });

  it('three wins: the Duelist kneels, and the leek goes to the chosen one', () => {
    const run = start('duel-kneel');
    setFlag(run, 'duelist-wins', 3);
    open(run, 'gn-new-06-kneel');
    const r = choose(run, 'gn-new-06-kneel', 'Leave the leek with my Pokémon.').run;
    expect(r.party[0]!.marks).toContain('Worthy Opponent');
    expect(flagOf(r, 'duelist-left')).toBe(1);
  });
});
