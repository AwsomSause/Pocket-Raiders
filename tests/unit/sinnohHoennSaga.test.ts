// Beta 0.7 E9: the Sinnoh and Hoenn Evil Team saga (Standard Cut): story events, world-state tracks, track page, cast, battle effects.
import { describe, expect, it } from 'vitest';
import { expansionData } from '../../src/data/expansion';
import { EVENT_MEETINGS, TRACK_MEETINGS_BY_REGION } from '../../src/core/expansion/cast/meet';
import { hoennEffects, sinnohEffects, trackEffectsFor } from '../../src/core/expansion/track';
import { advanceTrack, applyTrackToBattle, hoennNodeWeather, trackForgetStock, trackBannerLine, trackEffects } from '../../src/core/expansion/trackRun';
import { trackPage } from '../../src/core/expansion/trackView';
import { createBattle } from '../../src/core/battle/engine';
import { beginClimax, EXTENDED_REGIONS } from '../../src/core/arc/climaxExtended';
import { cardOf, chooseOption, formatOver, startFormat } from '../../src/core/formats/registry';
import { currentFormat } from '../../src/core/formats/store';
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

describe('Sinnoh lakes and hum', () => {
  it('step 3 halves friendship gains; step 4 forgets one shop item (stable per run)', () => {
    expect(sinnohEffects(2).friendshipFactor).toBe(1);
    expect(sinnohEffects(3).friendshipFactor).toBe(0.5);
    expect(sinnohEffects(3).shopForgets).toBe(false);
    expect(sinnohEffects(4).shopForgets).toBe(true);
    const r = run('sin-shop', 'sinnoh');
    const stock = ['a', 'b', 'c', 'd'];
    expect(trackForgetStock(content, r, stock)).toEqual(stock);
    step(r, 'sinnoh', 4);
    const some = trackForgetStock(content, r, stock);
    expect(some).toHaveLength(3);
    expect(trackForgetStock(content, r, stock)).toEqual(some);
    expect(trackForgetStock(content, { seed: 'x' }, stock)).toEqual(stock);
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

describe('Extended Cut: Siege Map for Sinnoh and Hoenn', () => {
  const mk = (seed: string) => {
    const r = chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red' }), 0);
    r.party = Array.from({ length: 3 }, (_, i) => ({ ...structuredClone(r.party[0]!), uid: `m${i}` }));
    return r;
  };
  const ctxOf = (r: ReturnType<typeof mk>) => ({ content, run: r });
  const rec = (result: string) => ({ id: 'pr.x.x', result, node: 0, os: 0 });
  const st = (r: ReturnType<typeof mk>) => Object.fromEntries((currentFormat(r)!.state.districts as { id: string; status: string }[]).map((d) => [d.id, d.status]));

  it('both regions are in the Extended Cut list', () => {
    expect(EXTENDED_REGIONS).toEqual(expect.arrayContaining(['sinnoh', 'hoenn']));
  });
  it('Sinnoh: four gates, the Summit is not one, statuses follow raids and flags', () => {
    const r = mk('sg-sin');
    r.expansion = { raids: { n1: rec('success'), n4: rec('failure'), n5: rec('partial') } };
    r.story.flags['ev:galactic-looker-ally'] = 1;
    r.story.flags['ev:galactic-cynthia-ally'] = 1;
    expect(startFormat('siege', ctxOf(r), { region: 'sinnoh' })).toBe(true);
    expect(st(r)).toEqual({ 'oreburgh-gate': 'held', 'hearthome-road': 'held', 'celestic-path': 'held', 'snowpoint-trail': 'lost', summit: 'contested' });
    expect(cardOf(ctxOf(r))!.options.map((o) => o.id)).toEqual(['oreburgh-gate', 'hearthome-road', 'celestic-path', 'snowpoint-trail']);
    chooseOption(ctxOf(r), 'oreburgh-gate');
    expect(formatOver(ctxOf(r))).toBe(true);
    expect(r.expansion!.siege!.lost).toEqual(['sinnoh.snowpoint-trail']);
    expect(r.expansion!.siege!.entered).toBe('sinnoh.oreburgh-gate');
  });
  it('Hoenn: the ledges follow the tilt, a contested gate costs a battle', () => {
    const r = mk('sg-hoe');
    r.story.flags['ev:magma-ahead'] = 1;
    r.story.flags['ev:hoenn-keepers-promise'] = 1;
    expect(startFormat('siege', ctxOf(r), { region: 'hoenn' })).toBe(true);
    expect(st(r)).toEqual({ 'harbor-tunnel': 'contested', 'west-ledge': 'held', 'east-ledge': 'contested', 'white-rock': 'held', 'cave-mouth': 'contested' });
    chooseOption(ctxOf(r), 'east-ledge');
    expect(r.battle!.event!.eventId).toBe('format:siege');
    expect(r.battle!.trainer!.name).toMatch(/Crater Cordon/);
  });
  it('the climax director starts in these regions and Johto still cannot', () => {
    const r = mk('sg-dir');
    r.expansion = { cut: { climaxCut: 'extended' } };
    expect(beginClimax(r, 'sinnoh')).toBe(true);
    expect(beginClimax(r, 'johto')).toBe(false);
  });
});
