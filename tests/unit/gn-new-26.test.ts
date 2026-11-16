// gn.new.26 The Rival's Missing Ace (tools/events/co/greenneedle-new-26.ts; rules in src/core/greenneedle/missingAce.ts).
import { describe, expect, it } from 'vitest';
import type { BattleState, RunState } from '../../src/core/state';
import { createPokemon } from '../../src/core/pokemon';
import { aceBows, rivalBeatenOnce } from '../../src/core/greenneedle/missingAce';
import { gnConditionMet } from '../../src/core/greenneedle';
import { content } from './helpers';
import { choose, flagOf, gnRun, open, scene, setFlag } from './helpers/gnPlay';

const here = (run: RunState) => run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!;
/** Walks to the next node (the one the search was put on). */
function stepOn(run: RunState, id: string): RunState {
  const next = run.stage!.map.nodes.find((n) => here(run).next.includes(n.id) && n.sides.some((s) => s.eventId === id && !s.used));
  expect(next, `${id} placed on the next step`).toBeTruthy();
  run.stage!.current = next!.id;
  return run;
}
const said = (r: { text: string; changes: string[] }): string => [r.text, ...r.changes].join(' ');

describe('gn.new.26 The Rival\'s Missing Ace', () => {
  it('is gated on the rival having lost to the player once', () => {
    const run = gnRun('t26-gate');
    const door = content.events.get('gn-new-26-door')!;
    expect(door.requires.some((r) => r.kind === 'gn' && r.test === 'rivalBeaten')).toBe(true);
    run.story.rivals = [{ id: 'r1', name: 'Blue', state: 'active', rivalPotential: 1, memory: { lastBattle: { result: 'lose', team: [] } } } as never];
    expect(rivalBeatenOnce(run)).toBe(false);
    expect(gnConditionMet(content, run, door.requires.find((r) => r.kind === 'gn')! as never, 6)).toBe(false);
    (run.story.rivals[0] as never as { memory: { lastBattle: { result: string } } }).memory.lastBattle.result = 'win';
    expect(rivalBeatenOnce(run)).toBe(true);
  });

  it('says the doc\'s opening and offers its three choices', () => {
    const s = scene(gnRun('t26-open'), 'gn-new-26-door');
    expect(s.labels).toEqual(["I'll help you look.", "It'll come back.", 'Not my problem.']);
    expect(s.intro).toContain('turning out their bag');
  });

  it('searching: three steps, each line more than the last; Stay says sorry (Trust +2, ace found)', () => {
    let run = gnRun('t26-stay');
    open(run, 'gn-new-26-door');
    let r = choose(run, 'gn-new-26-door', "I'll help you look.");
    expect(said(r)).toContain('It was my first. Before I was any good.');
    run = stepOn(r.run, 'gn-new-26-s2');
    expect(scene(run, 'gn-new-26-s2').intro).toContain("I shouted at it. After the loss. I've never done that.");
    r = choose(run, 'gn-new-26-s2', 'Follow the tracks.');
    run = stepOn(r.run, 'gn-new-26-s3');
    expect(scene(run, 'gn-new-26-s3').intro).toContain("I don't think I do this any more");
    r = choose(run, 'gn-new-26-s3', 'Follow the sound.');
    expect(scene(r.run, 'gn-new-26-found').labels).toEqual(['Stay.', 'Step away.']);
    expect(scene(r.run, 'gn-new-26-found').intro).toContain('practising the move that failed');
    r = choose(r.run, 'gn-new-26-found', 'Stay.');
    expect(said(r)).toContain("I'm sorry. It wasn't you. It was me.");
    expect(flagOf(r.run, 'rival-ace-found')).toBe(1);
    expect(flagOf(r.run, 'rival-gave-space')).toBe(0);
  });

  it('Step away: you do not hear what is said; the space is remembered', () => {
    let run = gnRun('t26-away');
    open(run, 'gn-new-26-door');
    run = stepOn(choose(run, 'gn-new-26-door', "I'll help you look.").run, 'gn-new-26-s2');
    run = stepOn(choose(run, 'gn-new-26-s2', 'Follow the tracks.').run, 'gn-new-26-s3');
    run = choose(run, 'gn-new-26-s3', 'Follow the sound.').run;
    const r = choose(run, 'gn-new-26-found', 'Step away.');
    expect(said(r)).toContain("You don't hear what's said");
    expect(flagOf(r.run, 'rival-ace-found')).toBe(1);
    expect(flagOf(r.run, 'rival-gave-space')).toBe(1);
  });

  it('refusing to help (either way) leaves them to find it alone: wasn\'t there, no search follows', () => {
    for (const label of ["It'll come back.", 'Not my problem.']) {
      const run = gnRun(`t26-${label.length}`);
      open(run, 'gn-new-26-door');
      const r = choose(run, 'gn-new-26-door', label);
      expect(flagOf(r.run, 'rival-wasnt-there')).toBe(1);
      expect(flagOf(r.run, 'rival-ace-found')).toBe(0);
      expect(r.run.stage!.map.nodes.some((n) => n.sides.some((s) => s.eventId === 'gn-new-26-s2'))).toBe(false);
    }
  });

  it('afterstory: the ace is sent out first, and bows, once', () => {
    const run = gnRun('t26-bow');
    setFlag(run, 'rival-ace-found');
    const team = [createPokemon(content, 'rattata', 20, 'e1'), createPokemon(content, 'pidgey', 20, 'e2'), createPokemon(content, 'eevee', 24, 'e3')];
    const battle = { enemyTeam: team, levelInfo: [], doubles: undefined, rivalNote: '' } as unknown as BattleState;
    aceBows(content, run, battle, 'Blue');
    expect(battle.enemyTeam[0]!.uid).toBe('e3');
    expect(battle.rivalNote).toContain('bows');
    expect(flagOf(run, 'rival-ace-bowed')).toBe(1);
    const again = { enemyTeam: [createPokemon(content, 'rattata', 20, 'x1')], levelInfo: [], rivalNote: '' } as unknown as BattleState;
    aceBows(content, run, again, 'Blue');
    expect(again.rivalNote).toBe('');
    const never = gnRun('t26-never');
    const b3 = { enemyTeam: [createPokemon(content, 'rattata', 20, 'y1')], levelInfo: [], rivalNote: '' } as unknown as BattleState;
    aceBows(content, never, b3, 'Blue');
    expect(b3.rivalNote).toBe('');
  });
});
