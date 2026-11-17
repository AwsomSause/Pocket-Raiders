// A scene that fights "the rival" (Route 22 and others) uses the run's real rival: its name, its class (picture) and a real rival battle.
import { describe, expect, it } from 'vitest';
import { startEventBattle } from '../../src/core/events';
import { Rng, hashSeed } from '../../src/core/rng';
import { chooseStarter, createRun } from '../../src/core/run';
import { content } from './helpers';

describe('event fights against the rival', () => {
  it('fight the run\'s real rival (name, class, rivalId)', () => {
    const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'rv22', seed: 'rv22', archetypeId: 'red' }), 0));
    run.story.rivals.push({ id: 'rvz', name: 'Silvan Test', classId: 'youngster', encounters: 1, setbacks: 0, state: 'active', adaptations: [], bonds: {}, cooldown: 0, rivalPotential: 50, style: 'balanced', traits: { ambition: 50, pride: 40, empathy: 50, adaptability: 40, vindictiveness: 30, resilience: 50 }, memory: { lastBattle: { eventId: 'x', result: 'win', hpLeftShare: 1, turns: 3, team: ['rattata', 'pidgey'], foes: [] } } } as never);
    const b = { kind: 'trainer', name: 'Rival', size: 2, levelBonus: 2, win: [], rival: true, pseudo: true } as never;
    startEventBattle(content, run, run.stage!.map.nodes[0]!, b, new Rng(hashSeed('rv22')), { eventId: 'x', choiceIndex: 0, sideId: 's', success: true });
    expect(run.battle!.trainer!.name).toBe('Silvan Test');
    expect(run.battle!.trainer!.classId).toBe('youngster');
    expect(run.battle!.rivalId).toBe('rvz');
  });
});
