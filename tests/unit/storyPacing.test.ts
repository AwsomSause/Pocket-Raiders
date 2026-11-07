// Story Overhaul S19 (W8): every pacing rule of the design doc holds on every seed, with no allowance left.

import { describe, expect, it } from 'vitest';
import { buildBlueprint, type DirectorInputs } from '../../src/core/campaign/storyDirector';
import { PACING_KNOWN_LIMITS, pacingFailures, pacingRules } from '../../src/core/story2/sim';
import { content } from './helpers';

const CIRCUIT = content.campaigns.get('orrery-circuit')!;
const base: Omit<DirectorInputs, 'seed'> = { contentHash: 'h', antagonist: 'rocket', rivals: { primary: 'kael', secondary: 'soren', friendly: 'mira' }, columns: CIRCUIT.columns, eliteFourSize: CIRCUIT.eliteFourSize };

describe('story pacing rules', () => {
  it('no rule has a known-limit allowance any more', () => {
    expect(PACING_KNOWN_LIMITS).toEqual({});
  });
  it('people cadence, downtime cadence and Act endings hold at 0 violations on 200 seeds', () => {
    for (let i = 0; i < 200; i++) {
      const bp = buildBlueprint(content, { ...base, seed: `pace-${i}` });
      const rules = pacingRules(content, bp);
      for (const id of ['people_cadence', 'downtime_cadence', 'act_endings']) expect(rules.find((r) => r.id === id)!.violations, `${id} seed ${i}`).toBe(0);
      expect(pacingFailures(content, bp), `seed ${i}`).toEqual([]);
    }
  });
});
