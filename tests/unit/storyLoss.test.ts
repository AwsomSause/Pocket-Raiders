// Story Overhaul S1b: losing a rival fight keeps the run going (Story Runs, and since the harder-rivals change every run except Adventure and Death-Block).

import { describe, expect, it } from 'vitest';
import { chooseStarter, createRun, debugReplaceEnemy, takeTurn } from '../../src/core/run';
import { storyLossFlag } from '../../src/core/story2/loss';
import { StoryV2Schema } from '../../src/core/story2/schema';
import { RunStateSchema, type RunState } from '../../src/core/state';
import { content, toBattle } from './helpers';

const start = (seed: string): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red' }), 0);
const rivalFight = (run: RunState): RunState => {
  const r = debugReplaceEnemy(content, toBattle(run), 'mewtwo', 100);
  r.battle!.rivalId = 'rv1';
  r.party.forEach((p) => (p.level = 1));
  return r;
};
function playOut(run: RunState): RunState {
  let r = run;
  for (let guard = 0; r.phase === 'battle' && guard < 200; guard++) r = takeTurn(content, r, { kind: 'move', index: 0 }).run;
  return r;
}
const asStoryRun = (run: RunState): RunState => {
  run.story.v2 = StoryV2Schema.parse({ mode: 'story_run' });
  return run;
};

describe('lost rival fights', () => {
  it('story_loss_continues: a Story Run goes on, the party is healed and the loss is recorded', () => {
    const after = playOut(rivalFight(asStoryRun(start('sl1'))));
    expect(after.phase).not.toBe('over');
    expect(after.party.every((p) => p.hp > 0)).toBe(true);
    expect(after.story.flags[storyLossFlag('rv1')]).toBeDefined();
    expect(after.story.v2!.facts.story_losses).toBe(1);
    expect(after.story.chronicle.some((c) => /won this one/.test(JSON.stringify(c)))).toBe(true);
    expect(RunStateSchema.safeParse(after).success).toBe(true);
  });
  it('harder_rivals: a Classic run also survives a rival loss (healed, loss counted), but not a non-rival loss', () => {
    const after = playOut(rivalFight(start('sl2')));
    expect(after.phase).not.toBe('over');
    expect(after.party.every((p) => p.hp > 0)).toBe(true);
    expect(after.story.flags['story:losses']).toBe(1);
    expect(RunStateSchema.safeParse(after).success).toBe(true);
  });
  it('the scripted first rival is never a run-ender either', () => {
    const run = start('sl4');
    const r = debugReplaceEnemy(content, toBattle(run), 'mewtwo', 100);
    r.battle!.firstRival = true;
    r.party.forEach((p) => (p.level = 1));
    expect(playOut(r).phase).not.toBe('over');
  });
  it('a Story Run still ends on a loss to an ordinary (non-rival) trainer fight', () => {
    const run = asStoryRun(start('sl3'));
    const r = debugReplaceEnemy(content, toBattle(run), 'mewtwo', 100);
    r.party.forEach((p) => (p.level = 1));
    expect(playOut(r).phase).toBe('over');
  });
});
