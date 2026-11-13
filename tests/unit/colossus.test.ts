// Beta 0.6 E4: the Colossus is a normal multi-phase raid (raids.json `ss-rocket-m2`) started by the Kanto M2 format.
import { describe, expect, it } from 'vitest';
import { getRaid } from '../../src/core/raid/raid';
import { M2_RAID } from '../../src/core/formats/colossus';
import { battleEnded, chooseOption, startFormat } from '../../src/core/formats/registry';
import { chooseStarter, createRun } from '../../src/core/run';
import { RunStateSchema } from '../../src/core/state';
import { content } from './helpers';

const mk = (seed: string) => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red' }), 0);
const ctxOf = (run: ReturnType<typeof mk>) => ({ content, run });

describe('Colossus raid (Kanto M2)', () => {
  it('M2 is a raid with three shields, three phases, a charge, an extra action and a 10 turn timer; it is never a random den', () => {
    const def = getRaid(content, M2_RAID);
    expect(def.species).toEqual(['mewtwo']);
    expect(def.shield!.at).toEqual([0.75, 0.5, 0.25]);
    expect(def.phases.map((p) => p.atHp)).toEqual([0.75, 0.5, 0.25]);
    expect(def.telegraph).not.toBeNull();
    expect(def.extraActions).not.toBeNull();
    expect(def.timerTurns).toBe(10);
    expect(def.special).toBe('canon');
    expect(def.rewards.joinChance).toBe(0);
  });

  it('the format starts the raid: the raid state is on the battle, with the timer and shields; no seal state exists', () => {
    const run = mk('m2a');
    expect(startFormat('colossus', ctxOf(run))).toBe(true);
    chooseOption(ctxOf(run), 'fight');
    expect(run.phase).toBe('battle');
    expect(run.battle!.enemyTeam[0]!.speciesId).toBe('mewtwo');
    const raid = run.battle!.raid!;
    expect(raid.id).toBe(M2_RAID);
    expect(raid.timerLeft).toBe(10);
    expect(raid.pendingShields).toHaveLength(3);
    expect((run.battle as Record<string, unknown>).colossus).toBeUndefined();
    expect(run.battle!.event!.eventId).toBe('format:colossus');
    const back = RunStateSchema.parse(JSON.parse(JSON.stringify(run)));
    expect(back.battle!.raid!.timerLeft).toBe(10);
  });

  it('the madame adds a turn, and the Seal Diagram leaves the first shield already cracked', () => {
    const run = mk('m2b');
    run.story.flags['rocket.x.madame'] = 1;
    run.story.flags['rocket.x.seal-diagram'] = 1;
    startFormat('colossus', ctxOf(run));
    chooseOption(ctxOf(run), 'fight');
    expect(run.battle!.raid!.timerLeft).toBe(11);
    expect(run.battle!.raid!.pendingShields).toEqual([0.5, 0.25]);
  });

  it('each ending is written once: won = broken, timer out = taken, fallen = lost', () => {
    for (const [won, timedOut, want] of [[true, false, 'broken'], [false, true, 'taken'], [false, false, 'lost']] as const) {
      const run = mk(`m2-${want}`);
      startFormat('colossus', ctxOf(run));
      chooseOption(ctxOf(run), 'fight');
      if (timedOut) run.battle!.raid!.timerLeft = 0;
      battleEnded(ctxOf(run), won);
      expect(run.story.flags['rocket.x.m2']).toBe(want);
      expect(run.story.flags['legend-cerulean-cave']).toBe(want === 'broken' ? 1 : undefined);
      battleEnded(ctxOf(run), true); // ignored: already settled
      expect(run.story.flags['rocket.x.m2']).toBe(want);
    }
  });
});
