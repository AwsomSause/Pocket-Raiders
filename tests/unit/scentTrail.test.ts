// Scent Trails (S220).
import { describe, expect, it } from 'vitest';
import { serviceView, useService } from '../../src/core/services/flow';
import { chooseStarter, createRun, tickTempEffects } from '../../src/core/run';
import { followTrail, trailOptions, trailProblem } from '../../src/core/scentTrail';
import { speciesWeightPerk } from '../../src/core/encounters';
import type { BattleState, RunState } from '../../src/core/state';
import { content } from './helpers';

function shopRun(seed = 'trail'): RunState {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'tr', seed, archetypeId: 'red' }), 0));
  const node = run.stage!.map.nodes.find((n) => n.column === 1)!;
  node.sides = [{ id: 'ws', kind: 'service', serviceId: 'workshop', used: false }];
  run.stage!.current = node.id;
  run.materials = { scrap: 20, fiber: 20, ember: 20, tide: 20, aether: 20 };
  return run;
}

describe('scent trails', () => {
  it('offers the stage habitat species at the Workshop', () => {
    const run = shopRun();
    const opts = trailOptions(content, run);
    expect(opts.length).toBeGreaterThan(0);
    const view = serviceView(content, run, 'ws');
    for (const o of opts) expect(view.options.some((x) => x.id === `craft:trail-${o.speciesId}`)).toBe(true);
  });
  it('spends materials, boosts that line for 2 wild battles, then runs out', () => {
    const run = shopRun();
    const o = trailOptions(content, run)[0]!;
    const before = run.materials[o.material]!;
    const done = useService(content, run, 'ws', `craft:trail-${o.speciesId}`).run;
    expect(done.materials[o.material]).toBe(before - o.cost);
    expect(speciesWeightPerk(content, done.perkEffects, o.speciesId)).toBe(6);
    expect(trailProblem(content, done, o.speciesId)).toMatch(/already/);
    for (let i = 0; i < 2; i++) tickTempEffects(done, { kind: 'wild' } as BattleState, false);
    expect(speciesWeightPerk(content, done.perkEffects, o.speciesId)).toBe(1);
  });
  it('refuses without materials or for a species not on offer', () => {
    const run = shopRun();
    const o = trailOptions(content, run)[0]!;
    run.materials = {};
    expect(trailProblem(content, run, o.speciesId)).toMatch(/Needs/);
    expect(trailProblem(content, shopRun(), 'nope')).toMatch(/cold/);
    expect(() => followTrail(content, shopRun(), o.speciesId)).not.toThrow();
  });
});
