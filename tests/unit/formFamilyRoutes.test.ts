// Spooky forms have their own clue chain and battle (not only a starter set). The Delta and Z routes were rebuilt by the
// Catalog Overhaul Pack (Linden's Delta Study, the Z sigils): tests/unit/coLegendsDelta.test.ts and coLegendsZ.test.ts.

import { describe, expect, it } from 'vitest';
import { eligibleEvents } from '../../src/core/events';
import { chooseStarter, createRun } from '../../src/core/run';
import { specialFamily } from '../../src/core/specialForms';
import { content } from './helpers';

const FAMILIES = [
  { key: 'spooky-light', met: 'spooky-met', battle: 'spooky-detour-battle', family: 'spooky', need: 2, stage: 4, prefix: 'spooky-light|spooky-detour' },
];

function ids(key: string, n: number, met: number, stage: number, prefix: string) {
  const run = chooseStarter(content, createRun(content, { runId: 'r', seed: 'form-family', archetypeId: 'red' }), 0);
  run.story.flags[`ev:${key}`] = n;
  run.story.flags[`ev:${FAMILIES.find((f) => f.key === key)!.met}`] = met;
  run.stage!.index = stage;
  return eligibleEvents(content, run).map((e) => e.id).filter((id) => prefix.split('|').some((p) => id.startsWith(p)));
}

describe.each(FAMILIES)('$family route', (f) => {
  it('offers clues first, then only the battle, once', () => {
    const early = ids(f.key, 0, 0, f.stage, f.prefix);
    expect(early.length).toBeGreaterThanOrEqual(f.need - 0);
    expect(early).not.toContain(f.battle);
    expect(ids(f.key, f.need, 0, f.stage, f.prefix)).toEqual([f.battle]);
    expect(ids(f.key, f.need, 1, f.stage, f.prefix)).toEqual([]);
  });
  it('battle foes are all in that special-form family', () => {
    const fight = JSON.stringify(content.events.get(f.battle)).match(/"species":\[([^\]]*)\]/)![1]!.replace(/"/g, '').split(',');
    expect(fight.length).toBeGreaterThan(4);
    for (const id of fight) expect(specialFamily(content.species.get(id)!), id).toBe(f.family);
  });
});
