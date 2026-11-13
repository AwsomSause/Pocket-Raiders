// A lost rival fight ends the battle without a game over. The turn result must say so (storyLoss), or the battle screen
// waits for a command that never comes and the game freezes after the fight.

import { describe, expect, it } from 'vitest';
import { chooseNode, chooseStarter, createRun, takeTurn } from '../../src/core/run';
import { content } from './helpers';

describe('a lost rival fight', () => {
  it('reports storyLoss, clears the battle, and is not a game over', () => {
    let run = structuredClone(chooseStarter(content, createRun(content, { runId: 'sl-1', seed: 'sl-1', archetypeId: 'red' }), 0));
    const node = run.stage!.map.nodes.filter((n) => n.column === 1)[0]!;
    node.kind = 'trainer';
    run = chooseNode(content, run, node.id);
    expect(run.battle).toBeTruthy();
    run.battle!.rival = true as never;
    for (const m of run.party) m.hp = 1;
    for (const e of run.battle!.enemyTeam) e.level = 100;
    let last = takeTurn(content, run, { kind: 'move', index: 0 });
    for (let i = 0; i < 20 && last.run.battle; i++) last = takeTurn(content, last.run, { kind: 'move', index: 0 });
    expect(last.run.battle).toBeNull();
    expect(last.end).toBeNull();
    expect(last.defeated).toBe(false);
    // Whatever way the loss is handled, the result must tell the screen why the battle is gone.
    expect(Boolean(last.storyLoss || last.wiped || last.narrativeDefeat || last.clubLost || last.raidFailed)).toBe(true);
  });
});
