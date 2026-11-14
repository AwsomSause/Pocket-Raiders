import { describe, expect, it } from 'vitest';
import { chooseEvent } from '../../src/core/events';
import { chooseStarter, createRun } from '../../src/core/run';
import { RunStateSchema } from '../../src/core/state';
import { MAX_FOES, MAX_FOES_LISTED } from '../../src/core/bossLimits';
import { content } from './helpers';

// Beta 0.7: a listed story boss may field a 7th Pokémon; everything else stays at 6.
const SEVEN = ['persian', 'rhydon', 'nidoking', 'porygon', 'raticate', 'snorlax', 'dragonair'];

function fight(seventh: boolean, team: string[]) {
  const id = `test-seven-${seventh ? 'listed' : 'plain'}`;
  const base = [...content.events.values()].find((e) => e.choices.some((c) => c.success.battle?.kind === 'trainer'))!;
  const event = structuredClone(base);
  event.id = id;
  event.choices = [{ ...structuredClone(base.choices[0]!), success: { text: 'x', effects: [], battle: { kind: 'trainer', name: 'Boss', size: team.length, levelBonus: 0, shadow: 0, chain: 1, ghost: false, retired: false, rival: false, types: [], team, ...(seventh ? { seventh: true } : {}) } } }] as never;
  content.events.set(id, event);
  try {
    const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'r', seed: 'seven', archetypeId: 'red' }), 0));
    const node = run.stage!.map.nodes[0]!;
    run.stage!.current = node.id;
    run.stage!.visited = [node.id];
    node.sides.push({ id: 'duel', kind: 'event', used: false, eventId: id });
    return chooseEvent(content, run, 'duel', 0).run;
  } finally {
    content.events.delete(id);
  }
}

describe('7-foe boss battles', () => {
  it('limits are 6 and 7', () => {
    expect([MAX_FOES, MAX_FOES_LISTED]).toEqual([6, 7]);
  });
  it('a listed boss fields 7 and the battle survives a save round trip', () => {
    const run = fight(true, SEVEN);
    expect(run.battle!.enemyTeam).toHaveLength(7);
    expect(RunStateSchema.parse(JSON.parse(JSON.stringify(run))).battle!.enemyTeam).toHaveLength(7);
  });
  it('an unlisted team of 7 is cut to 6 (never random)', () => {
    expect(fight(false, SEVEN).battle!.enemyTeam).toHaveLength(6);
  });
});
