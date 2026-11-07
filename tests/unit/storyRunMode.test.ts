// Story Run entry: the 'story-run' mode plays the Orrery Circuit as a Story Run and counts for progress.

import { describe, expect, it } from 'vitest';
import { chooseStarter, createRun } from '../../src/core/run';
import { campaignCounts, getMode, STANDARD_CHOICE } from '../../src/core/rules';
import { content } from './helpers';

describe('Story Run mode', () => {
  it('is a supported mode tied to the Orrery Circuit', () => {
    expect(getMode('story-run')).toMatchObject({ status: 'supported', campaignId: 'orrery-circuit', progressionEligible: true });
  });

  it('starts a Story Run on the Orrery Circuit whatever campaign the desk had', () => {
    const run = chooseStarter(content, createRun(content, { runId: 'sr', seed: 'sr', archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: 'story-run' } }), 0);
    expect(run.campaignId).toBe('orrery-circuit');
    expect(run.story?.v2).toBeTruthy();
    expect(campaignCounts(content.campaigns.get('orrery-circuit')!, 'story-run')).toBe(true);
  });

  it('leaves Standard runs on their own campaign', () => {
    const run = createRun(content, { runId: 'std', seed: 'std', archetypeId: 'red', rules: { ...STANDARD_CHOICE } });
    expect(run.campaignId).not.toBe('orrery-circuit');
    expect(campaignCounts(content.campaigns.get('orrery-circuit')!, 'standard')).toBe(false);
  });
});
