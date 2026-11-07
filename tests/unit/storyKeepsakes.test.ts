import { describe, expect, it } from 'vitest';
import { chooseStarter, createRun } from '../../src/core/run';
import { createProfile } from '../../src/core/profile';
import { foldKeepsakes, keepsakeDef, keepsakesEarned, KEEPSAKES, SLOT_TOTALS, slotCounts, wearKeepsake } from '../../src/core/story2/keepsakes';
import { StoryV2Schema } from '../../src/core/story2/schema';
import { personalityOfMon } from '../../src/core/overhaul/personality';
import { temperamentOf } from '../../src/core/story2/temperament';
import { content } from './helpers';

function setup() {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'kp', seed: 'kp', archetypeId: 'red' }), 0));
  const v2 = StoryV2Schema.parse({ mode: 'story_run' });
  v2.heartbond.partner = run.party[0]!.uid;
  run.story.v2 = v2;
  return { run, v2, tm: temperamentOf(personalityOfMon(run.party[0]!).id) };
}

describe('keepsakes', () => {
  it('the catalog has 20 items with the design slot counts', () => {
    expect(KEEPSAKES).toHaveLength(20);
    expect(slotCounts()).toEqual(SLOT_TOTALS);
    expect(new Set(KEEPSAKES.map((k) => k.id)).size).toBe(20);
  });
  it('earns nothing without a Story Run partner', () => {
    const { run } = setup();
    run.story.v2 = undefined;
    expect(keepsakesEarned(run)).toEqual([]);
  });
  it('latch 5 and 7 give the Charm Necklace and Star Pin for any Starter; a Keystone gives the Tiny Hat', () => {
    const { run, v2 } = setup();
    expect(keepsakesEarned(run)).toEqual([]);
    v2.heartbond.latched = [1, 2, 3, 4, 5];
    expect(keepsakesEarned(run)).toContain('kp_charm_necklace');
    expect(keepsakesEarned(run)).not.toContain('kp_star_pin');
    v2.heartbond.latched = [1, 2, 3, 4, 5, 6, 7];
    v2.feats.gains.push('keystone');
    const got = keepsakesEarned(run);
    expect(got).toEqual(expect.arrayContaining(['kp_charm_necklace', 'kp_star_pin', 'kp_tiny_hat']));
  });
  it('the Bell Collar and Ribbon Bow need the right Temperament', () => {
    const { run, v2, tm } = setup();
    v2.heartbond.latched = [1, 2, 3, 4, 5, 6];
    const got = keepsakesEarned(run);
    expect(got.includes('kp_bell_collar')).toBe(tm === 'tm_playful' || tm === 'tm_mischievous');
    expect(got.includes('kp_ribbon_bow')).toBe(tm === 'tm_affectionate' || tm === 'tm_playful');
  });
  it('only live rules are ever earned', () => {
    const { run, v2 } = setup();
    v2.heartbond.latched = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    v2.feats.gains.push('keystone');
    for (const id of keepsakesEarned(run)) expect(keepsakeDef(id)!.status).toBe('live');
  });
  it('folding adds only new ones, once, and wearing needs an unlock and the right slot', () => {
    const { run, v2 } = setup();
    const profile = createProfile(content, 'p');
    v2.heartbond.latched = [1, 2, 3, 4, 5];
    expect(foldKeepsakes(profile, run)).toContain('kp_charm_necklace');
    expect(foldKeepsakes(profile, run)).toEqual([]);
    expect(wearKeepsake(profile, 'neck', 'kp_star_pin')).toBe(false); // locked
    expect(wearKeepsake(profile, 'head', 'kp_charm_necklace')).toBe(false); // wrong slot
    expect(wearKeepsake(profile, 'neck', 'kp_charm_necklace')).toBe(true);
    expect(profile.story.worn).toEqual({ neck: 'kp_charm_necklace' });
    expect(wearKeepsake(profile, 'neck', null)).toBe(true);
    expect(profile.story.worn).toEqual({});
  });
});
