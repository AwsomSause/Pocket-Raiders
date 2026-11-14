// Beta 0.7 workstream 10 (E9): the Kalos and Galar story events, Evil Team Standard Cut.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { advanceTrack, healStopShut, trackBannerLine, trackHealShare, trackShopFactor } from '../../src/core/expansion/trackRun';
import { trackPage } from '../../src/core/expansion/trackView';
import { conditionMet, eligibleEvents } from '../../src/core/events';
import { getCampaign } from '../../src/core/regions';
import { addEventStops } from '../../src/core/events';
import { meetFromEvent, meetFromTrack } from '../../src/core/expansion/cast/meet';
import { chooseStarter, createRun } from '../../src/core/run';
import { expansionData } from '../../src/data/expansion';
import type { RunState } from '../../src/core/state';
import { beginClimax, climaxPhases, EXTENDED_REGIONS, nextStep } from '../../src/core/arc/climaxExtended';
import { startFormat } from '../../src/core/formats/registry';
import { content } from './helpers';

const KALOS = ['boutique', 'cafe', 'courier', 'essentia', 'factory', 'squishy', 'tall-man', 'under-time'].map((s) => `xe.kalos.${s}`);
const GALAR = ['ball-guy', 'gig', 'insurance', 'mine', 'partner-firm', 'press-release', 'road-closed', 'their-majesties'].map((s) => `xe.galar.${s}`);

const regionRun = (seed: string, region: 'kalos' | 'galar'): RunState => {
  const r = chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', expansion: { eventsDensity: 'normal', worldTracks: true } }), 0);
  r.regionOrder[r.regionIndex] = region;
  return r;
};
const placed = (r: RunState) => r.stage!.map.nodes.flatMap((n) => n.sides.filter((s) => s.eventId?.startsWith('xe.')).map((s) => ({ id: s.eventId!, column: n.column })));

describe.each([['kalos', KALOS], ['galar', GALAR]] as const)('the %s story events', (region, ids) => {
  it('are eight, match the data skeleton, and the file is current', () => {
    expect([...content.events.keys()].filter((id) => id.startsWith(`xe.${region}.`)).sort()).toEqual(ids);
    expect(expansionData.events.filter((e) => e.region === region).map((e) => e.id).sort()).toEqual(ids);
    expect(JSON.parse(readFileSync(`src/data/events/xe-${region}.json`, 'utf8')).events).toHaveLength(8);
  });
  it('are only eligible in their region with the saga on', () => {
    const r = regionRun(`xe-${region}-on`, region);
    r.stage!.index = 3;
    const here = eligibleEvents(content, r).filter((e) => e.id.startsWith('xe.')).map((e) => e.id);
    expect(here.every((id) => id.startsWith(`xe.${region}.`))).toBe(true);
    const away = regionRun(`xe-${region}-away`, region);
    away.regionOrder[away.regionIndex] = 'johto';
    expect(eligibleEvents(content, away).some((e) => e.id.startsWith(`xe.${region}.`))).toBe(false);
  });
  it('place the anchor, never twice, never on neighbouring columns', () => {
    const r = regionRun(`xe-${region}-place`, region);
    const stages = getCampaign(content, r.campaignId).stagesPerRegion;
    const seen: string[] = [];
    for (let i = 0; i < stages; i++) {
      r.stage!.index = i;
      r.stage!.map.nodes.forEach((n) => (n.sides = []));
      addEventStops(content, r);
      const cols = placed(r).map((p) => p.column).sort((a, b) => a - b);
      for (let j = 1; j < cols.length; j++) expect(cols[j]! - cols[j - 1]!).toBeGreaterThan(1);
      seen.push(...placed(r).map((p) => p.id));
    }
    expect(new Set(seen).size).toBe(seen.length);
    expect(seen).toContain(region === 'kalos' ? 'xe.kalos.boutique' : 'xe.galar.ball-guy');
  });
  it('every story event has a way out and a fight or a flag', () => {
    for (const id of ids) {
      const e = content.events.get(id)!;
      expect(e.choices.length).toBeGreaterThanOrEqual(3);
      expect(e.choices.some((c) => c.requires.length === 0)).toBe(true);
    }
  });
});

describe('track gates', () => {
  it('Kalos events wait for their track step', () => {
    const r = regionRun('xe-kalos-gates', 'kalos');
    const need = { 'xe.kalos.tall-man': 2, 'xe.kalos.courier': 3, 'xe.kalos.under-time': 4 } as const;
    for (const [id, step] of Object.entries(need)) {
      const e = content.events.get(id)!;
      expect(e.requires.every((c) => conditionMet(content, r, c)), `${id} before`).toBe(false);
      for (let i = 0; i < step; i++) advanceTrack(r, 'kalos', 'raidFailed', `${id}:${i}`);
      const ok = e.requires.filter((c) => c.kind !== 'period').every((c) => conditionMet(content, r, c));
      expect(ok, `${id} at step ${step}`).toBe(true);
      r.expansion = { ...r.expansion!, track: {} };
    }
  });
  it('Galar events wait for their track step', () => {
    const r = regionRun('xe-galar-gates', 'galar');
    const need = { 'xe.galar.insurance': 1, 'xe.galar.mine': 2, 'xe.galar.their-majesties': 3, 'xe.galar.partner-firm': 4 } as const;
    for (const [id, step] of Object.entries(need)) {
      const e = content.events.get(id)!;
      expect(e.requires.every((c) => conditionMet(content, r, c)), `${id} before`).toBe(false);
      for (let i = 0; i < step; i++) advanceTrack(r, 'galar', 'raidFailed', `${id}:${i}`);
      expect(e.requires.every((c) => conditionMet(content, r, c)), `${id} at step ${step}`).toBe(true);
      r.expansion = { ...r.expansion!, track: {} };
    }
  });
});

describe('Kalos and Galar world-state effects in a run', () => {
  it('Kalos: the Guest List page, night-shut Center, members-first heal, Flare Key lifts it', () => {
    const r = regionRun('xe-kalos-run', 'kalos');
    expect(trackPage(content, r)?.title).toBe('The Guest List');
    expect(trackHealShare(content, r)).toBe(1);
    for (let i = 0; i < 3; i++) advanceTrack(r, 'kalos', 'raidFailed', `k${i}`);
    expect(trackHealShare(content, r)).toBe(0.85);
    expect(trackBannerLine(content, r)).toBe('');
    advanceTrack(r, 'kalos', 'raidFailed', 'k3');
    expect(trackBannerLine(content, r)).toContain('Holo Caster');
    r.story.flags['ev:flare-member'] = 1;
    expect(trackHealShare(content, r)).toBe(1);
    expect(typeof healStopShut(content, r, 'x')).toBe('boolean');
  });
  it('Galar: the Forecast page, partner shop discount then supply issues, red sky at step 5', () => {
    const r = regionRun('xe-galar-run', 'galar');
    expect(trackPage(content, r)?.title).toBe('The Forecast');
    r.shop = { place: `0:0:${r.stage!.map.nodes.find((n) => n.sides.some((s) => s.kind === 'shop'))?.id ?? 'x'}` } as never;
    advanceTrack(r, 'galar', 'raidFailed', 'g1');
    const f1 = trackShopFactor(content, r);
    expect([1, 0.95]).toContain(f1);
    for (let i = 2; i <= 4; i++) advanceTrack(r, 'galar', 'raidFailed', `g${i}`);
    expect([1, 1.1]).toContain(trackShopFactor(content, r));
    advanceTrack(r, 'galar', 'raidFailed', 'g5');
    expect(trackBannerLine(content, r)).toContain('red');
  });
  it('the Dossier fills from the new scenes and tracks', () => {
    const r = regionRun('xe-dossier', 'kalos');
    meetFromEvent(r, { id: 'xe.kalos.cafe' });
    meetFromTrack(r, 'galar', 2);
    expect(Object.keys(r.expansion!.dossier!).sort()).toEqual(['sc.flare.diantha', 'sc.flare.sycamore', 'sc.macro-cosmos.ball-guy', 'sc.yell.gaz']);
  });
});

describe('Extended Cut for Kalos and Galar', () => {
  const extended = (region: 'kalos' | 'galar') => {
    const r = chooseStarter(content, createRun(content, { runId: `cut-${region}`, seed: `cut-${region}`, archetypeId: 'red', expansion: { worldTracks: true, climaxCut: 'extended' } }), 0);
    r.regionOrder[r.regionIndex] = region;
    return r;
  };
  it('begins, plays its own phase list, and Kanto-only formats skip themselves', () => {
    for (const region of ['kalos', 'galar'] as const) {
      const r = extended(region);
      expect(EXTENDED_REGIONS).toContain(region);
      expect(beginClimax(r, region)).toBe(true);
      expect(climaxPhases(region).length).toBeGreaterThan(6);
      expect(nextStep(r)).not.toBeNull();
      for (const id of ['siege', 'blackout', 'colossus', 'convoy', 'front'] as const) expect(startFormat(id, { content, run: r })).toBe(false);
    }
  });
});
