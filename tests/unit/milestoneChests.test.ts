import { describe, expect, it } from 'vitest';
import { createProfile, finalizeRun } from '../../src/core/profile';
import { awardMilestoneChests } from '../../src/core/modeRewards';
import { chooseStarter, createRun } from '../../src/core/run';
import { content } from './helpers';

const over = (id: string) => ({ ...chooseStarter(content, createRun(content, { runId: id, seed: id, archetypeId: 'red' }), 0), phase: 'over' as const });
const chest = (n: number) => content.balance.luck.milestoneChests.find((c) => c.runs === n)!;

describe('Milestone Chests (S312)', () => {
  it('opens a chest once when the finished-run count reaches it', () => {
    let profile = createProfile(content, 'p');
    const texts: string[] = [];
    for (let i = 1; i <= 3; i++) {
      const out = finalizeRun(content, profile, over(`m${i}`));
      profile = out.profile;
      texts.push(...(out.summary?.modeRewards ?? []).map((m) => m.text).filter((t) => t.startsWith('Milestone Chest')));
    }
    expect(texts).toHaveLength(1);
    expect(texts[0]).toContain('3 runs');
    expect(profile.claims['chest:3']).toBeTruthy();
  });
  it('never pays the same chest twice, even called again', () => {
    const profile = createProfile(content, 'p');
    profile.stats.runsEnded = 3;
    const run = over('again');
    const first = awardMilestoneChests(content, profile, run, 'now');
    const bank = profile.bankCredits;
    expect(first).toHaveLength(1);
    expect(bank).toBeGreaterThanOrEqual(chest(3).bankCredits);
    expect(awardMilestoneChests(content, profile, run, 'now')).toEqual([]);
    expect(profile.bankCredits).toBe(bank);
  });
  it('pays several chests a long-idle profile has reached, and nothing for runs that earn no rewards', () => {
    const profile = createProfile(content, 'p');
    profile.stats.runsEnded = 25;
    const adventure = over('adv');
    adventure.rules.progressionEligible = false;
    expect(awardMilestoneChests(content, profile, adventure, 'now')).toEqual([]);
    expect(awardMilestoneChests(content, profile, over('ok'), 'now')).toHaveLength(3);
  });
});
