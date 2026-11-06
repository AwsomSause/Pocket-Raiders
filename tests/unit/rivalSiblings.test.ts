// S118 Family Tree of Rivals: a retired rival's sibling takes up its grudge.

import { describe, expect, it } from 'vitest';
import { chooseStarter, createRun } from '../../src/core/run';
import { maybeSibling } from '../../src/core/rivals/siblings';
import { RivalSchema, type Rival } from '../../src/core/story/schema';
import { RIVAL_CONFIG } from '../../src/core/rivals/schema';
import { content } from './helpers';

const rival = (over: Partial<Rival> = {}): Rival =>
  ({
    id: 'r1', classId: 'youngster', name: 'Joey', archetype: 'x', style: 'y', rivalPotential: 40, state: 'retired', encounters: 3, setbacks: 3, away: 0, cooldown: 0, progress: 0, bonds: {}, offscreen: [], adaptations: [],
    arc: null, origin: { eventId: 'e', where: { region: 0, stage: 1, level: 1, node: 'n', battle: 1, turn: 0 }, path: 'p' },
    traits: { empathy: 50, vindictiveness: 30, resilience: 50, pride: 40, ambition: 80, adaptability: 50 },
    memory: { lastBattle: { eventId: 'e', result: 'win', hpLeftShare: 0.5, turns: 6, team: ['rattata', 'pidgey'] } },
    ...over,
  }) as unknown as Rival;

const newRun = () => chooseStarter(content, createRun(content, { runId: 'sib', seed: 'sib', archetypeId: 'red' }), 0);

function make(run: ReturnType<typeof newRun>, r: Rival) {
  for (let i = 0; i < 60; i++) {
    const made = maybeSibling(content, run, r, `0.${i}`);
    if (made) return made;
  }
  throw new Error('no sibling');
}

describe('Family Tree of Rivals', () => {
  it('a retired rival gets one sibling that inherits its grudge', () => {
    const run = newRun();
    const r = rival();
    run.story.rivals = [r];
    const { sibling, rumor } = make(run, r);
    expect(rumor).toContain("Joey's sibling");
    expect(r.sibling).toBe(sibling.id);
    expect(sibling.siblingOf).toEqual({ id: 'r1', name: 'Joey' });
    expect(sibling.classId).toBe('youngster');
    expect(sibling.traits.vindictiveness).toBe(30 + RIVAL_CONFIG.siblings.vindictivenessGain);
    expect(sibling.rivalPotential).toBe(Math.round(40 * RIVAL_CONFIG.siblings.potentialShare));
    expect(sibling.state).toBe('recognized');
    const parsed = RivalSchema.safeParse(JSON.parse(JSON.stringify(sibling)));
    expect(parsed.success ? [] : parsed.error.issues).toEqual([]);
    expect(run.story.rivals).toHaveLength(2);
    for (let i = 0; i < 60; i++) expect(maybeSibling(content, run, r, `1.${i}`)).toBeNull(); // once only
  });

  it('is deterministic for the same seed', () => {
    const a = newRun(), b = newRun();
    a.story.rivals = [rival()]; b.story.rivals = [rival()];
    expect(make(a, a.story.rivals[0]!).sibling).toEqual(make(b, b.story.rivals[0]!).sibling);
  });

  it('does not appear for a rival that has not retired, or when the run has no room', () => {
    const run = newRun();
    const live = rival({ state: 'active' });
    run.story.rivals = [live];
    for (let i = 0; i < 60; i++) expect(maybeSibling(content, run, live, `0.${i}`)).toBeNull();
    const gone = rival({ id: 'r2' });
    run.story.rivals = [gone, ...Array.from({ length: RIVAL_CONFIG.maxRivals }, (_, k) => rival({ id: `x${k}`, state: 'active' }))];
    for (let i = 0; i < 60; i++) expect(maybeSibling(content, run, gone, `0.${i}`)).toBeNull();
  });
});
