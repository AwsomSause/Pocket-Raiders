// Form Research (Untitled doc §8 "Research Quest"): three clues, then a research battle with a regional form.

import { describe, expect, it } from 'vitest';
import { eligibleEvents } from '../../src/core/events';
import { chooseStarter, createRun } from '../../src/core/run';
import { specialFamily } from '../../src/core/specialForms';
import { content } from './helpers';

function runAt(clues: number, stageIndex = 4, met = 0) {
  const run = chooseStarter(content, createRun(content, { runId: 'r', seed: 'form-research', archetypeId: 'red' }), 0);
  run.story.flags['ev:form-clue'] = clues;
  run.story.flags['ev:form-met'] = met;
  run.stage!.index = stageIndex;
  return run;
}
const ids = (clues: number) => eligibleEvents(content, runAt(clues)).map((e) => e.id).filter((id) => id.startsWith('form-'));

// The Catalog Overhaul Pack merged the Form Research clues and battle into Linden's Delta Study (D1); its own tests are in
// coLegendsDelta.test.ts. The Secret route still opens on the old \`form-met\` flag.
describe('Form Research chain', () => {
  it('is merged into the Delta Study: the old ids are disabled and their replacements exist', () => {
    for (const id of ['form-clue-fur', 'form-clue-sketch', 'form-clue-tracks', 'form-research-battle']) expect(content.events.get(id)?.disabled ?? true, id).toBe(true);
    for (const id of ['delta-clue-nest', 'delta-clue-scales', 'delta-clue-song', 'delta-research-battle']) expect(content.events.has(id), id).toBe(true);
    expect(ids(0)).toEqual([]);
  });
});

describe('Secret route', () => {
  const hidden = (met: number) => {
    const run = runAt(3, 6, met);
    return eligibleEvents(content, run).some((e) => e.id === 'secret-route-path');
  };
  it('opens only after the research battle was won', () => {
    expect(hidden(0)).toBe(false);
    expect(hidden(1)).toBe(true);
  });
  it('leads to regional forms only', () => {
    const species = JSON.stringify(content.events.get('secret-route-path')).match(/"species":\[([^\]]*)\]/)![1]!.replace(/"/g, '').split(',');
    for (const id of species) expect(specialFamily(content.species.get(id)!), id).toBe('regional');
  });
});
