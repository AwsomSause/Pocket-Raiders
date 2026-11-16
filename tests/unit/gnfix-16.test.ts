// gn.16 The Fighting Tournament, fixes against the doc: a first-turn hit raises the Crowd, Guard is 10% less damage, the twin's shouting
// shows the Machop's move, the last exchange's three calls differ, and the commentary box calls an evolution when it happens.
import { describe, expect, it } from 'vitest';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';
import { createPokemon } from '../../src/core/pokemon';
import { takeTurn } from '../../src/core/run';
import { ruleEvolution } from '../../src/core/expansion/canonSaffron';
import { mostUsedMove, moveTally } from '../../src/core/greenneedle/tournament';
import { choose, flagOf, gnRun, open, setFlag, win } from './helpers/gnPlay';

const signed = (seed: string): RunState => {
  const run = gnRun(seed);
  const mankey = createPokemon(content, 'mankey', run.party[0]!.level, 'p-r25');
  mankey.moves = [{ id: 'karate-chop', pp: 25 }, { id: 'leer', pp: 30 }];
  run.party.push(mankey);
  setFlag(run, 'kanto-mankey');
  open(run, 'gn-16-door');
  return choose(run, 'gn-16-door', 'Sign up.').run;
};
const toFinal = (seed: string): RunState => {
  let run = signed(seed);
  run = choose(win(choose(run, 'gn-16-r1', 'Step into the ring.').run), 'gn-16-c1', 'Good match.').run;
  run = choose(run, 'gn-16-gap1', 'Power').run;
  run = choose(win(choose(run, 'gn-16-r2', "Don't.").run), 'gn-16-gap2', 'Guard').run;
  run = choose(win(choose(run, 'gn-16-r3', 'Step into the ring.').run), 'gn-16-gap3', 'Footwork').run;
  run = win(choose(run, 'gn-16-r4', 'Step into the ring.').run);
  return choose(run, 'gn-16-gap4', 'Rest.').run;
};
/** The final, paused at the last exchange (both fighters under a quarter). */
const toLast = (seed: string, bond: number): RunState => {
  const fin = choose(toFinal(seed), 'gn-16-final', 'Step into the ring.').run;
  const b = fin.battle!;
  const me = fin.party[b.activeIndex]!;
  b.enemyTeam[0]!.moves = [{ id: 'leer', pp: 30 }];
  me.hp = 1;
  b.enemyTeam[0]!.hp = 1;
  me.friendship = bond;
  return takeTurn(content, fin, { kind: 'move', index: 1 }).run;
};

describe('gn.16 fixes', () => {
  it('a hit on the first turn raises the Crowd by one when the bout is won; a first turn without a hit does not', () => {
    const r1 = choose(signed('gnfix16-hit'), 'gn-16-r1', 'Step into the ring.').run;
    expect(flagOf(r1, 'tournament-crowd')).toBe(0);
    // Turn one: a damaging move that lands.
    const hit = structuredClone(r1);
    hit.battle!.enemyTeam[0]!.moves = [{ id: 'leer', pp: 30 }];
    const afterHit = takeTurn(content, hit, { kind: 'move', index: 0 }).run;
    const landed = afterHit.battle ? afterHit.battle.enemyTeam[0]!.hp < r1.battle!.enemyTeam[0]!.hp : true;
    expect(flagOf(afterHit, 'tc-first-hit')).toBe(landed ? 1 : 0);
    expect(landed).toBe(true);
    expect(flagOf(win(afterHit), 'tournament-crowd')).toBe(1);
    // Turn one: Leer. A hit on turn two is not a first-turn hit.
    const slow = structuredClone(r1);
    slow.battle!.enemyTeam[0]!.moves = [{ id: 'leer', pp: 30 }];
    const afterLeer = takeTurn(content, slow, { kind: 'move', index: 1 }).run;
    expect(flagOf(afterLeer, 'tc-first-hit')).toBe(0);
    const done = win(afterLeer);
    expect(flagOf(done, 'tc-first-hit')).toBe(0);
    expect(flagOf(done, 'tournament-crowd')).toBe(0);
  });
  it('the twin shouts the move: the Machop\'s opening move is shown before you pick', () => {
    const r1 = choose(signed('gnfix16-twin'), 'gn-16-r1', 'Step into the ring.').run;
    const shown = r1.battle!.lesson?.foeMove;
    expect(shown).toBeTruthy();
    expect(r1.battle!.enemyTeam[0]!.moves.map((m) => m.id)).toContain(shown);
    // Only in round one.
    const r2 = choose(choose(choose(win(r1), 'gn-16-c1', 'Walk on.').run, 'gn-16-gap1', 'Power').run, 'gn-16-r2', "Don't.").run;
    expect(r2.battle!.lesson?.foeMove).toBeUndefined();
  });
  it('Guard is 10% less damage taken, not a Defence boost', () => {
    const guard = content.events.get('gn-16-gap1')!.choices.find((c) => c.label === 'Guard')!;
    const temp = guard.success.effects.find((e) => e.kind === 'tempEffect') as { effects: unknown[] };
    expect(temp.effects).toEqual([{ kind: 'damageTakenMultiplier', value: 0.9 }]);
  });
  it('the moves used all tournament are counted, from round one', () => {
    let run = signed('gnfix16-tally');
    expect(moveTally(run)).toEqual({});
    run = choose(run, 'gn-16-r1', 'Step into the ring.').run;
    run.battle!.enemyTeam[0]!.moves = [{ id: 'leer', pp: 30 }];
    run = takeTurn(content, run, { kind: 'move', index: 1 }).run;
    run = takeTurn(content, run, { kind: 'move', index: 1 }).run;
    run.battle!.enemyTeam[0]!.moves = [{ id: 'leer', pp: 30 }];
    run = takeTurn(content, run, { kind: 'move', index: 0 }).run;
    expect(moveTally(run)).toEqual({ leer: 2, 'karate-chop': 1 });
    const me = run.party.find((m) => m.uid === 'p-r25')!;
    expect(mostUsedMove(run, me)).toBe(1);
    // A move with no PP left, or one never used, is not chosen.
    expect(mostUsedMove(run, { moves: [{ id: 'karate-chop', pp: 5 }, { id: 'leer', pp: 0 }] })).toBe(0);
    expect(mostUsedMove(run, { moves: [{ id: 'tackle', pp: 5 }] })).toBe(-1);
  });
  it('"Now!" strikes first; "Wait for it." strikes second and harder; they are not the same call', () => {
    const paused = toLast('gnfix16-calls', 70);
    const now = choose(structuredClone(paused), 'gn-16-last', 'Now!').run;
    const me = now.party[now.battle!.activeIndex]!;
    expect(now.battle!.storyEffects).toContain(`kind:${me.uid}`);
    expect(now.battle!.playerStages.atk).toBe(0);
    const wait = choose(structuredClone(paused), 'gn-16-last', 'Wait for it.').run;
    expect(wait.battle!.storyEffects).not.toContain(`kind:${me.uid}`);
    expect(wait.battle!.playerStages.atk).toBe(2);
    expect(wait.battle!.playerStages.spe).toBe(-6);
  });
  it('"You choose." at Bond 3: it uses the move it has used most, first; below Bond 3 the player still calls it', () => {
    const paused = toLast('gnfix16-choose', 200);
    const last = choose(paused, 'gn-16-last', 'You choose.').run;
    const me = last.party[last.battle!.activeIndex]!;
    expect(last.battle!.storyEffects).toContain(`kind:${me.uid}`);
    const most = mostUsedMove(last, me);
    expect(most).toBeGreaterThanOrEqual(0);
    const other = most === 0 ? 1 : 0;
    const before = moveTally(last)[me.moves[most]!.id]!;
    const played = takeTurn(content, last, { kind: 'move', index: other });
    // The player pressed the other move; the fighter threw its own.
    expect(moveTally(played.run)[me.moves[most]!.id]).toBe(before + 1);
    expect(played.events.some((e) => 'text' in e && typeof e.text === 'string' && e.text.includes('decides for itself'))).toBe(true);
    const cold = choose(toLast('gnfix16-choose', 70), 'gn-16-last', 'You choose.');
    const shy = cold.run.party[cold.run.battle!.activeIndex]!;
    expect(cold.run.battle!.storyEffects).not.toContain(`kind:${shy.uid}`);
    expect([cold.text, ...cold.changes].join(' ')).toMatch(/You call the moves/);
    const called = takeTurn(content, cold.run, { kind: 'move', index: 0 });
    expect(called.events.some((e) => 'text' in e && typeof e.text === 'string' && e.text.includes('decides for itself'))).toBe(false);
  });
  it('the commentary box calls the evolution when it happens in the final, once', () => {
    const fin = choose(toFinal('gnfix16-evo'), 'gn-16-final', 'Step into the ring.').run;
    fin.battle!.turn = 3;
    const events = ruleEvolution(content, fin);
    const evolved = events.filter((e) => e.type === 'evolved').length;
    const called = events.filter((e) => 'text' in e && typeof e.text === 'string' && e.text.includes('EVOLVING')).length;
    expect(called).toBe(evolved > 0 ? 1 : 0);
    expect(evolved).toBeGreaterThan(0);
    expect(ruleEvolution(content, fin).filter((e) => 'text' in e && typeof e.text === 'string' && e.text.includes('EVOLVING'))).toHaveLength(0);
    // The last-exchange room no longer claims an evolution that may not have happened.
    expect(content.events.get('gn-16-last')!.intro).not.toMatch(/EVOLVING/);
  });
});
