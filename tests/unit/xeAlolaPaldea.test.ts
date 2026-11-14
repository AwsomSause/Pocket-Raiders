// Beta 0.7 E9: the Alola and Paldea story events, track effects and page text.

import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { EVENT_MEETINGS } from '../../src/core/expansion/cast/meet';
import { NO_EFFECTS, trackEffectsFor } from '../../src/core/expansion/track';
import { ALOLA_PAGE, PALDEA_PAGE } from '../../src/core/expansion/trackRegions';
import { chooseStarter, createRun } from '../../src/core/run';
import { eligibleEvents } from '../../src/core/events';
import { trackPage } from '../../src/core/expansion/trackView';
import { advanceTrack } from '../../src/core/expansion/trackRun';
import { content } from './helpers';

const cfg = content.balance.expansionTrack;
const run = (seed: string, region: string) => {
  const r = chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', expansion: { eventsDensity: 'normal', worldTracks: true } }), 0);
  r.regionOrder[r.regionIndex] = region;
  return r;
};

describe.each(['alola', 'paldea'])('%s story events', (region) => {
  it('are eight, one anchor, all gated to the region and the saga', () => {
    const evs = [...content.events.values()].filter((e) => e.id.startsWith(`xe.${region}.`));
    expect(evs).toHaveLength(8);
    expect(evs.filter((e) => e.priority === 100)).toHaveLength(1);
    for (const e of evs) expect(EVENT_MEETINGS[e.id]).toBeDefined();
  });
  it('are not eligible outside the region', () => {
    const r = run(`xe-${region}-away`, 'kanto');
    expect(eligibleEvents(content, r).some((e) => e.id.startsWith(`xe.${region}.`))).toBe(false);
  });
  it('the anchor is eligible in the region', () => {
    const r = run(`xe-${region}-in`, region);
    r.stage!.index = Math.max(r.stage!.index, 2);
    expect(eligibleEvents(content, r).some((e) => e.id.startsWith(`xe.${region}.`))).toBe(true);
  });
  it('has a Notebook page once the track moves', () => {
    const r = run(`xe-${region}-page`, region);
    advanceTrack(r, region, 'raidFailed', 'k1');
    const page = trackPage(content, r);
    expect(page?.steps).toHaveLength(5);
    expect(Object.keys(region === 'alola' ? ALOLA_PAGE : PALDEA_PAGE)).toHaveLength(5);
  });
});

describe('track effects', () => {
  it('Alola thins the wild pool by a fifth from step 3; Paldea only adverts at step 5', () => {
    expect(trackEffectsFor('alola', 2, cfg).wildShrink).toBe(0);
    expect(trackEffectsFor('alola', 3, cfg).wildShrink).toBe(0.2);
    expect(trackEffectsFor('paldea', 4, cfg)).toEqual(NO_EFFECTS);
    expect(trackEffectsFor('paldea', 5, cfg).adverts).toBe(true);
  });
});

it('the event files are current', () => {
  expect(() => execFileSync('node', ['tools/build-xe-alola-paldea.ts', '--check'], { stdio: 'pipe' })).not.toThrow();
});

import { climaxPhases, beginClimax, nextStep, EXTENDED_REGIONS } from '../../src/core/arc/climaxExtended';
import { startFormat } from '../../src/core/formats/registry';
import { DEBATE_TABLE } from '../../src/core/formats/debate';
import { trackBannerLine } from '../../src/core/expansion/trackRun';

describe('Extended Cut for Alola and Paldea', () => {
  const extended = (region: string) => {
    const r = chooseStarter(content, createRun(content, { runId: `cut-${region}`, seed: `cut-${region}`, archetypeId: 'red', expansion: { worldTracks: true, climaxCut: 'extended' } }), 0);
    r.regionOrder[r.regionIndex] = region;
    return r;
  };
  it('begins in Alola and Paldea but not in an unwired region', () => {
    expect(EXTENDED_REGIONS).toEqual(expect.arrayContaining(['kanto', 'alola', 'paldea']));
    expect(beginClimax(extended('alola'), 'alola')).toBe(true);
    expect(beginClimax(extended('paldea'), 'paldea')).toBe(true);
    expect(beginClimax(extended('johto'), 'johto')).toBe(false);
  });
  it('formats with only Kanto content do not start in these regions', () => {
    for (const region of ['alola', 'paldea']) {
      const r = extended(region);
      beginClimax(r, region);
      for (const id of ['siege', 'blackout', 'colossus', 'convoy', 'front'] as const) expect(startFormat(id, { content, run: r })).toBe(false);
    }
  });
  it('Alola skips to the Gauntlet; Paldea keeps the Debate in its list', () => {
    const r = extended('alola');
    beginClimax(r, 'alola');
    expect(climaxPhases('paldea').some((p) => p.label === 'Debate')).toBe(true);
    expect(nextStep(r)).not.toBeNull();
  });
  it('Debate evidence counts the Paldea event flags', () => {
    const script = DEBATE_TABLE.find((d) => d.region === 'paldea')!;
    expect(script.evidence.filter((e) => e.ev).length).toBeGreaterThanOrEqual(4);
  });
  it('step 5 shows a map line in both regions', () => {
    for (const region of ['alola', 'paldea']) {
      const r = extended(region);
      for (let i = 0; i < 5; i++) advanceTrack(r, region, 'raidFailed', `k${i}`);
      expect(trackBannerLine(content, r).length).toBeGreaterThan(10);
    }
  });
});
