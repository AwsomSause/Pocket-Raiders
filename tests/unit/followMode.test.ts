// Follow mode (S501): the lead walks beside you, grows fonder, and now and then digs something up.

import { describe, expect, it } from 'vitest';
import { campAction, freshCampProfile } from '../../src/core/camp';
import { followerOf, followStep } from '../../src/core/followMode';
import { freshCamp } from '../../src/core/camp/schema';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

function setup(seed: string): RunState {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red' }), 0));
  run.phase = 'map';
  run.camp = freshCamp();
  run.camp.follow = true;
  return run;
}

describe('follow mode', () => {
  it('data: every find is a real item', () => {
    for (const id of content.balance.friendship.followFinds) expect(content.items.has(id), id).toBe(true);
  });
  it('the lead gains friendship each step', () => {
    const run = setup('f1');
    run.party[0]!.friendship = 100;
    followStep(content, run);
    expect(run.party[0]!.friendship).toBe(100 + content.balance.friendship.perStep);
  });
  it('does nothing until Follow Mode is switched on at camp', () => {
    const run = setup('f0');
    run.camp!.follow = false;
    const before = run.party[0]!.friendship;
    expect(followStep(content, run)).toBeNull();
    expect(run.party[0]!.friendship).toBe(before);
    const fresh = setup('f0');
    delete fresh.camp;
    expect(followStep(content, fresh)).toBeNull();
    const out = campAction(content, setup('f0'), freshCampProfile(), 'follow');
    expect(out.ok).toBe(true);
    expect(out.run.camp!.follow).toBe(false);
  });
  it('a fainted lead hands the walk to the next Pokémon; no one standing means no walk', () => {
    const run = setup('f2');
    expect(followerOf(run)).toBe(run.party[0]);
    run.party[0]!.hp = 0;
    expect(followerOf(run)).toBe(run.party[1]);
    for (const m of run.party) m.hp = 0;
    expect(followStep(content, run)).toBeNull();
  });
  it('finds are seeded: the same run and step give the same result, and some steps find something', () => {
    const finds: number[] = [];
    for (const seed of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']) {
      const one = setup(seed);
      const two = setup(seed);
      const a = followStep(content, one);
      const b = followStep(content, two);
      expect(a).toBe(b);
      expect(one.inventory).toEqual(two.inventory);
      finds.push(a ? 1 : 0);
    }
    expect(finds.some((x) => x === 1)).toBe(true);
    expect(finds.some((x) => x === 0)).toBe(true);
  });
});
