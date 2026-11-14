// Beta 0.7 E9: the Johto and Unova story events, track effects and track page (Standard Cut).

import { describe, expect, it } from 'vitest';
import { addEventStops, eligibleEvents } from '../../src/core/events';
import { johtoEffects, trackEffectsFor, unovaEffects } from '../../src/core/expansion/track';
import { trackPage } from '../../src/core/expansion/trackView';
import { advanceTrack } from '../../src/core/expansion/trackRun';
import { getCampaign } from '../../src/core/regions';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

const REGIONS = [
  { id: 'johto', anchor: 'xe.johto.tail-market', count: 8 },
  { id: 'unova', anchor: 'xe.unova.speech', count: 8 },
] as const;

const runIn = (seed: string, region: string, density: 'low' | 'normal' | 'full' | null = 'normal'): RunState => {
  const r = chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', ...(density ? { expansion: { eventsDensity: density, worldTracks: true } } : {}) }), 0);
  r.regionOrder[r.regionIndex] = region;
  return r;
};
const placed = (r: RunState) => r.stage!.map.nodes.flatMap((n) => n.sides.filter((s) => s.eventId?.startsWith('xe.')).map((s) => ({ id: s.eventId!, column: n.column })));

describe.each(REGIONS)('the $id story events', ({ id, anchor, count }) => {
  it('are eight, all loaded, each with two or more ways to answer', () => {
    const ev = [...content.events.values()].filter((e) => e.id.startsWith(`xe.${id}.`));
    expect(ev).toHaveLength(count);
    for (const e of ev) expect(e.choices.length).toBeGreaterThanOrEqual(2);
  });
  it('are never eligible without the saga on', () => {
    expect(eligibleEvents(content, runIn(`off-${id}`, id, null)).some((e) => e.id.startsWith('xe.'))).toBe(false);
  });
  it('are not eligible in another region', () => {
    const r = runIn(`away-${id}`, id);
    r.regionOrder[r.regionIndex] = 'paldea';
    expect(eligibleEvents(content, r).some((e) => e.id.startsWith(`xe.${id}.`))).toBe(false);
  });
  it('place the anchor, never twice, never on neighbouring columns, inside the density quota', () => {
    for (const density of ['low', 'normal', 'full'] as const) {
      const r = runIn(`xe-${id}-${density}`, id, density);
      const stages = getCampaign(content, r.campaignId).stagesPerRegion;
      const seen: string[] = [];
      for (let i = 0; i < stages; i++) {
        r.stage!.index = i;
        r.stage!.map.nodes.forEach((n) => (n.sides = []));
        addEventStops(content, r);
        const here = placed(r);
        const cols = here.map((p) => p.column).sort((a, b) => a - b);
        for (let j = 1; j < cols.length; j++) expect(cols[j]! - cols[j - 1]!).toBeGreaterThan(1);
        seen.push(...here.map((p) => p.id));
      }
      expect(new Set(seen).size).toBe(seen.length);
      expect(seen).toContain(anchor);
      expect(seen.every((s) => s.startsWith(`xe.${id}.`))).toBe(true);
      expect(seen.length).toBeLessThanOrEqual(content.balance.expansionEvents.density[density] + 1);
    }
  });
  it('is not placed in a run without the saga flag', () => {
    const r = runIn(`none-${id}`, id, null);
    addEventStops(content, r);
    expect(placed(r)).toEqual([]);
  });
});

describe('Johto and Unova world-state tracks', () => {
  const cfg = content.balance.expansionTrack;
  it('have step tables that only touch the world, never an enemy', () => {
    for (const fx of [johtoEffects, unovaEffects]) expect(Object.keys(fx(5, cfg)).sort()).toEqual(['adverts', 'healShutAtNight', 'roadblocks', 'shopMarkup', 'wildShrink']);
    expect(trackEffectsFor('johto', 2, cfg).shopMarkup).toBe(cfg.shopMarkup);
    expect(trackEffectsFor('johto', 1, cfg).shopMarkup).toBe(0);
    expect(trackEffectsFor('unova', 3, cfg).healShutAtNight).toBe(true);
    expect(trackEffectsFor('unova', 2, cfg).healShutAtNight).toBe(false);
    expect(trackEffectsFor('hoenn', 5, cfg)).toEqual(trackEffectsFor('nowhere', 0, cfg));
  });
  it('show a Notebook page that reveals only reached steps', () => {
    for (const region of ['johto', 'unova']) {
      const r = runIn(`page-${region}`, region);
      advanceTrack(r, region, 'raidFailed', 'a');
      const page = trackPage(content, r)!;
      expect(page.region).toBe(region);
      expect(page.steps.map((s) => s.state)).toEqual(['now', 'next', 'locked', 'locked', 'locked']);
      expect(page.scales.filter((s) => s.seen)).toHaveLength(1);
    }
  });
});
