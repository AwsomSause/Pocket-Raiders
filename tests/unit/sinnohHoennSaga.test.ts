// Beta 0.7 E9: the Sinnoh and Hoenn Evil Team saga (Standard Cut): story events, world-state tracks, track page, cast, battle effects.
import { describe, expect, it } from 'vitest';
import { expansionData } from '../../src/data/expansion';
import { EVENT_MEETINGS, TRACK_MEETINGS_BY_REGION } from '../../src/core/expansion/cast/meet';
import { hoennEffects, sinnohEffects, trackEffectsFor } from '../../src/core/expansion/track';
import { advanceTrack, applyTrackToBattle, hoennNodeWeather, trackBannerLine, trackEffects } from '../../src/core/expansion/trackRun';
import { trackPage } from '../../src/core/expansion/trackView';
import { createBattle } from '../../src/core/battle/engine';
import { chooseStarter, createRun } from '../../src/core/run';
import { content } from './helpers';

const run = (seed: string, region: 'sinnoh' | 'hoenn') => {
  const r = chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', expansion: { worldTracks: true, eventsDensity: 'normal' } }), 0);
  r.regionOrder[r.regionIndex] = region;
  return r;
};
const step = (r: ReturnType<typeof run>, region: string, n: number) => {
  for (let i = 0; i < n; i++) advanceTrack(r, region, 'raidFailed', `t${i}`);
};
const withBattle = (r: ReturnType<typeof run>) => {
  r.battle = createBattle('wild', [structuredClone(r.party[0]!)], 0, r.party[0]!.uid);
};

describe('Sinnoh and Hoenn story events', () => {
  it('each region has its 8 events, all in the content, all with the saga gate', () => {
    for (const region of ['sinnoh', 'hoenn']) {
      const listed = expansionData.events.filter((e) => e.region === region).map((e) => e.id);
      expect(listed).toHaveLength(8);
      for (const id of listed) {
        const e = content.events.get(id);
        expect(e, id).toBeDefined();
        expect(JSON.stringify(e!.requires)).toContain('xevents');
        expect(JSON.stringify(e!.requires)).toContain(region);
      }
      expect(listed.filter((id) => content.events.get(id)!.priority === 100)).toHaveLength(1); // one anchor
    }
  });
  it('every cast id the events and tracks name exists', () => {
    const ids = new Set(expansionData.characters.map((c) => c.id));
    for (const list of Object.values(EVENT_MEETINGS)) for (const m of list) expect(ids.has(typeof m === 'string' ? m : m[0])).toBe(true);
    for (const t of Object.values(TRACK_MEETINGS_BY_REGION)) for (const list of Object.values(t)) for (const m of list) expect(ids.has(typeof m === 'string' ? m : m[0])).toBe(true);
  });
});

describe('Sinnoh track effects', () => {
  it('turn on step by step', () => {
    expect(sinnohEffects(1).centerHeal).toBe(1);
    expect(sinnohEffects(2)).toMatchObject({ centerHeal: 0.8, nightAccuracy: 0.95, noPlayerCrit: false });
    expect(sinnohEffects(3).noPlayerCrit).toBe(true);
    expect(sinnohEffects(5).adverts).toBe(true);
    expect(trackEffectsFor('sinnoh', 3, content.balance.expansionTrack)).toEqual(sinnohEffects(3));
  });
  it('the player cannot crit once the lakes fall, and night is darker', () => {
    const r = run('sin-1', 'sinnoh');
    step(r, 'sinnoh', 3);
    expect(trackEffects(content, r).noPlayerCrit).toBe(true);
    withBattle(r);
    applyTrackToBattle(content, r);
    expect(r.battle!.noPlayerCrit).toBe(true);
    expect(trackBannerLine(content, r)).toBe('');
    step(r, 'sinnoh', 5);
    expect(trackBannerLine(content, r)).toMatch(/clock/);
  });
  it('no effect with the track off or at step 0', () => {
    const r = run('sin-0', 'sinnoh');
    withBattle(r);
    applyTrackToBattle(content, r);
    expect(r.battle!.noPlayerCrit).toBeUndefined();
    expect(r.battle!.accuracyMult).toBeUndefined();
  });
});

describe('Hoenn track effects', () => {
  it('weather mode by step', () => {
    expect([1, 2, 3, 4, 5].map((n) => hoennEffects(n).weather)).toEqual(['split', 'tilt', 'swing', 'swing', 'awakening']);
  });
  it('step 3 flips the weather every two turns and step 2 follows the tilt; same seed, same sky', () => {
    const r = run('hoe-1', 'hoenn');
    step(r, 'hoenn', 3);
    withBattle(r);
    applyTrackToBattle(content, r);
    expect(r.battle!.eventRule?.weatherCycle).toEqual(['rain', 'rain', 'sun', 'sun']);
    const t = run('hoe-2', 'hoenn');
    t.story.flags['ev:aqua-ahead'] = 2;
    expect(hoennNodeWeather(t, 2, 'n1')).toBe('rain');
    t.story.flags['ev:aqua-ahead'] = 0;
    t.story.flags['ev:magma-ahead'] = 1;
    expect(hoennNodeWeather(t, 2, 'n1')).toBe('sun');
    expect(hoennNodeWeather(t, 1, 'n1')).toBe(hoennNodeWeather(t, 1, 'n1'));
  });
});

describe('Track page', () => {
  it('Sinnoh shows five steps (the three lakes are one) and Hoenn five', () => {
    for (const region of ['sinnoh', 'hoenn'] as const) {
      const r = run(`pg-${region}`, region);
      step(r, region, 2);
      const page = trackPage(content, r)!;
      expect(page.steps.map((s) => s.step)).toEqual([1, 2, 3, 4, 5]);
      expect(page.scales).toHaveLength(5);
      expect(page.steps[0]!.state).toBe('seen');
    }
  });
});
