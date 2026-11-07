// Story Overhaul S10 wiring: a Story Run's rivals take the written teams, lines and roles.
import { describe, expect, it } from 'vitest';
import { planFirstRival } from '../../src/core/encounters';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { assignStoryRole, storyFirstRivalPlan, storyRivalPlan, storyRoles, tagPrimary } from '../../src/core/story2/rivalPlan';
import { pickStoryRivals, rivalById, STORY_RIVAL_IDS } from '../../src/core/story2/storyRivals';
import type { Rival } from '../../src/core/story/schema';
import { content } from './helpers';

const storyRun = (seed: string): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', campaignId: 'orrery-circuit' }), 0);
const classicRun = (seed: string): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red' }), 0);
const fakeRival = (over: Partial<Rival> = {}): Rival => ({ id: 'rival-x', classId: 'rival', name: 'Someone', archetype: 'a', style: 's', state: 'recognized', ...over } as Rival);

describe('story rival wiring', () => {
  it('a Story Run writes three distinct story rivals into the blueprint (Friendly never Soren, Kael or Marisol)', () => {
    for (let i = 0; i < 25; i++) {
      const r = storyRoles(storyRun(`wire-${i}`))!;
      expect(new Set([r.primary, r.secondary, r.friendly]).size).toBe(3);
      for (const id of [r.primary, r.secondary, r.friendly]) expect(STORY_RIVAL_IDS).toContain(id as never);
      expect(['rv_soren', 'rv_kael', 'rv_marisol']).not.toContain(r.friendly);
    }
    expect(storyRoles(classicRun('wire-classic'))).toBeUndefined();
  });

  it('seeded role picks are stable and keep the Friendly rule when no theme row applies', () => {
    expect(pickStoryRivals(content.storyData, 'x')).toEqual(pickStoryRivals(content.storyData, 'x'));
    for (let i = 0; i < 40; i++) expect(['rv_soren', 'rv_kael', 'rv_marisol']).not.toContain(pickStoryRivals(content.storyData, `s${i}`)!.friendly);
  });

  it('the first rival of a Story Run is the Primary with its written Act 1 team, never weaker than the scripted one', () => {
    const run = storyRun('wire-first');
    const base = planFirstRival(content, run.seed, 5);
    const plan = storyFirstRivalPlan(content, run, base)!;
    const def = rivalById(content.storyData, storyRoles(run)!.primary)!;
    expect(plan.members.map((m) => m.speciesId)).toEqual(def.teams[0]!.slots.map((s) => s.species));
    expect(plan.members).toHaveLength(2);
    expect(plan.levelInfo).toHaveLength(2);
    const aceIndex = def.teams[0]!.slots.findIndex((s) => s.ace);
    expect(plan.members[aceIndex]!.level).toBeGreaterThanOrEqual(base.members[base.members.length - 1]!.level);
    expect(storyFirstRivalPlan(content, classicRun('wire-first'), base)).toBeNull();
  });

  it('tags the Primary, then sparks become the Secondary and the Friendly in list order; extras stay ordinary', () => {
    const run = storyRun('wire-roles');
    const roles = storyRoles(run)!;
    const major = fakeRival({ id: 'rival-major', major: true });
    run.story.rivals.push(major);
    tagPrimary(content, run, major);
    expect(major.storyRival).toBe(roles.primary);
    const a = fakeRival({ id: 'rival-a' }), b = fakeRival({ id: 'rival-b' }), c = fakeRival({ id: 'rival-c' });
    for (const r of [a, b, c]) { run.story.rivals.push(r); assignStoryRole(content, run, r); }
    expect([a.storyRival, b.storyRival, c.storyRival]).toEqual([roles.secondary, roles.friendly, undefined]);
    expect(run.story.rivals.slice(0, 3).map((r) => r.storyRival)).toEqual([roles.primary, roles.secondary, roles.friendly]);
  });

  it('a returning story rival brings its written team for the Act and other rivals are untouched', () => {
    const run = storyRun('wire-return');
    const roles = storyRoles(run)!;
    const base = planFirstRival(content, run.seed, 30);
    const primary = fakeRival({ id: 'rival-major', major: true, storyRival: roles.primary });
    const plan = storyRivalPlan(content, run, primary, base, 12);
    const def = rivalById(content.storyData, roles.primary)!;
    expect(plan.members.map((m) => m.speciesId).slice(0, def.teams[2]!.slots.length)).toEqual(def.teams[2]!.slots.map((s) => s.species));
    expect(storyRivalPlan(content, run, fakeRival(), base, 12)).toBe(base);
    expect(storyRivalPlan(content, classicRun('wire-return'), primary, base, 12)).toBe(base);
  });
});
