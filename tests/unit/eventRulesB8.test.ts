import { describe, expect, it } from 'vitest';
import { eventRuleEnd } from '../../src/core/battle/engine';
import { chooseEvent } from '../../src/core/events';
import { chooseStarter, createRun } from '../../src/core/run';
import { RunStateSchema } from '../../src/core/state';
import { content } from './helpers';

const currentFoe = (b: { enemyTeam: { moves: { id: string }[] }[]; enemyIndex: number }) => b.enemyTeam[b.enemyIndex]!;

describe('hidden-foe rules (run events B batch 8)', () => {
  const start = (eventId: string) => {
    const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'r', seed: 'rb8', archetypeId: 'red' }), 0));
    const node = run.stage!.map.nodes[0]!;
    run.stage!.current = node.id;
    run.stage!.visited = [node.id];
    node.sides.push({ id: 'duel', kind: 'event', used: false, eventId });
    return chooseEvent(content, run, 'duel', 0).run;
  };
  it('Blindfold Bout hides the foe and Magician\'s Misdirection names a decoy, both saved on the battle', () => {
    const blind = start('blindfold-bout');
    expect(blind.battle?.eventRule?.hiddenFoe).toBe(true);
    const magic = start('magicians-misdirection');
    expect(magic.battle?.eventRule?.decoyFoe).toBe('magikarp');
    expect(content.species.has(magic.battle!.eventRule!.decoyFoe!)).toBe(true);
    expect(RunStateSchema.parse(JSON.parse(JSON.stringify(magic))).battle?.eventRule).toEqual(magic.battle?.eventRule);
  });
  it('batch 9: mimic copies your move, spare wins without a KO, and the events carry their rules', () => {
    const mime = start('mimic-mayhem');
    const battle = mime.battle!;
    battle.playerVolatile.lastMove = 'tackle';
    eventRuleEnd(battle, [], mime.party, content);
    expect(currentFoe(battle).moves.map((m) => m.id)).toEqual(['tackle']);
    const ranger = start('eco-ranger-test').battle!;
    expect(ranger.eventRule?.spare).toBe(true);
    ranger.enemyTeam.forEach((m) => (m.hp = 1));
    eventRuleEnd(ranger, [], [], content);
    expect(ranger.outcome).toBe('win');
    const awake = start('eco-ranger-test').battle!;
    eventRuleEnd(awake, [], [], content);
    expect(awake.outcome).toBeNull();
    expect(start('library-duel-silence').battle?.eventRule?.silent).toBe(true);
    expect(start('rooftop-rumble').battle?.eventRule?.turnLimit).toBe(4);
  });
});
