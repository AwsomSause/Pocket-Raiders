import { describe, expect, it } from 'vitest';
import { chooseEvent } from '../../src/core/events';
import { chooseStarter, createRun } from '../../src/core/run';
import { RunStateSchema } from '../../src/core/state';
import { content } from './helpers';

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
});
