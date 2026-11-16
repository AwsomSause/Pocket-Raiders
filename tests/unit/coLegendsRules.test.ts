// Catalog Overhaul Pack (legends): the RULE ids. Old events retired into the systems (co-legends-10.json), the Sign and Telling
// stops that replace them, Telling stops, the Presence on the Legendary gate and the Legend weeks' starting Influence.
import { describe, expect, it } from 'vitest';
import { chooseEvent } from '../../src/core/events';
import { legendFlag, syncLegendFlags, weekInfluence } from '../../src/core/legends/signs';
import { presenceFocus } from '../../src/core/legendary/legendary';
import { MYTHICALS } from '../../src/core/instrumentality/promisesData';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import ten from '../../src/data/events/co-legends-10.json';
import status from '../../src/data/catalogOverhaul/status/legends.json';
import { content } from './helpers';

const blessed = (id: string | null, seed = 'rule'): RunState => {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'ru', seed, archetypeId: 'red' }), 0));
  run.expansion = { ...run.expansion, promises: true, ...(id ? { blessing: { id, tier: 'common', influence: 0, seen: true, ashRegions: [], communion: false, riteUsed: false, stagesDone: [] } } : { blessing: undefined }) } as never;
  syncLegendFlags(run);
  return run;
};
const at = (run: RunState, eventId: string): RunState => {
  const node = run.stage!.map.nodes[0]!;
  run.stage!.current = node.id;
  run.stage!.visited = [node.id];
  node.sides.push({ id: 'x', kind: 'event', used: false, eventId } as never);
  return run;
};
const f = (run: RunState, key: string) => run.story.flags[`ev:${key}`] ?? 0;

describe('the RULE ids', () => {
  it('every retired id is gone from the draw, is in the rule bucket, and the stops that replace them exist', () => {
    const rule = (status as { rule: Record<string, string> }).rule;
    for (const id of ten.remove) {
      expect(rule[id], id).toBeTruthy();
      const e = content.events.get(id);
      expect(!e || e.disabled, id).toBe(true);
    }
    expect(Object.keys(rule).length).toBeGreaterThan(250);
    for (const e of ten.events) expect(content.events.get(e.id), e.id).toBeDefined();
  });

  it('Sign stops need a blessing; a Sign there raises the blessing\'s Influence', () => {
    expect(content.events.get('co-rule-landmark')!.requires).toContainEqual(expect.objectContaining({ key: 'blessed' }));
    expect(f(blessed(null), 'blessed')).toBe(0);
    const run = blessed('ho-oh');
    expect(f(run, 'blessed')).toBe(1);
    const after = chooseEvent(content, at(run, 'co-rule-shrine'), 'x', 1).run;
    expect(after.expansion!.blessing!.influence).toBe(1);
  });

  it('a Telling stop tells of the half-told Mythical first, never of a disabled one, and stops once one has visited', () => {
    const run = blessed(null);
    legendFlag(run, 'telling-zeraora', 1);
    const line = legendFlag(run, 'telling-any', 1);
    expect(line[0]).toMatch(/Lightning That Walks Alone \(2\/3\)/);
    const fresh = blessed(null, 'other');
    const heard = new Set<string>();
    for (let i = 0; i < 40; i++) {
      legendFlag(fresh, 'telling-any', 1);
      for (const [id, n] of Object.entries(fresh.expansion!.promise!.tellings)) if (n > 0) heard.add(id);
    }
    const disabled = MYTHICALS.filter((m) => m.status === 'disabled').map((m) => m.id);
    expect([...heard].some((id) => disabled.includes(id))).toBe(false);
    expect(heard.size).toBeGreaterThan(5);
    const visited = blessed(null);
    legendFlag(visited, 'telling-mew', 3);
    legendFlag(visited, 'vow-mew', 1);
    expect(legendFlag(visited, 'telling-any', 1)).toEqual([]);
  });

  it('the Presence: the blessing Legendary is a gate focus whose chance grows with Influence; no blessing, no focus', () => {
    expect(presenceFocus(blessed(null))).toEqual([]);
    const low = presenceFocus(blessed('ho-oh'))[0]!;
    const run = blessed('ho-oh');
    run.expansion!.blessing!.influence = 9;
    const high = presenceFocus(run)[0]!;
    expect(low.species).toEqual(['ho-oh']);
    expect(high.gateChance).toBeGreaterThan(low.gateChance);
    expect(1 - Math.pow(1 - high.gateChance, 8)).toBeCloseTo(0.65);
  });

  it('Legend weeks: +1 starting Influence for the matching blessing, a Telling for each Mythical in the week', () => {
    const run = blessed('ho-oh');
    run.perkEffects = [{ kind: 'legendaryFocus', species: ['ho-oh', 'lugia', 'celebi'], weight: 2, gateChance: 0.5 }] as never;
    weekInfluence(run);
    expect(run.expansion!.blessing!.influence).toBe(1);
    expect(run.expansion!.promise!.tellings.celebi).toBe(1);
    const none = blessed('ho-oh');
    none.perkEffects = [];
    weekInfluence(none);
    expect(none.expansion!.blessing!.influence).toBe(0);
  });
});
