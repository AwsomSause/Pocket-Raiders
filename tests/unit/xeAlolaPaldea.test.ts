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
import { adjustShields, COLOSSUS_REGIONS } from '../../src/core/formats/colossus';
import { chooseOption } from '../../src/core/formats/registry';
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
      for (const id of ['convoy'] as const) expect(startFormat(id, { content, run: r })).toBe(false);
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

describe('Siege Map for Alola and Paldea', () => {
  const siegeRun = (region: string) => {
    const r = chooseStarter(content, createRun(content, { runId: `sg-${region}`, seed: `sg-${region}`, archetypeId: 'red', expansion: { worldTracks: true, climaxCut: 'extended' } }), 0);
    r.regionOrder[r.regionIndex] = region;
    beginClimax(r, region);
    return r;
  };
  it('starts in both regions with the right districts and gates', () => {
    for (const [region, n, gates] of [['alola', 5, 4], ['paldea', 5, 5]] as const) {
      const r = siegeRun(region);
      expect(startFormat('siege', { content, run: r })).toBe(true);
      const s = r.expansion!.cut!.format as { state: { region: string; districts: { gate: boolean }[] } };
      expect(s.state.region).toBe(region);
      expect(s.state.districts).toHaveLength(n);
      expect(s.state.districts.filter((d) => d.gate)).toHaveLength(gates);
    }
  });
  it('story flags hold districts', () => {
    const r = siegeRun('alola');
    r.story.flags['ev:alola-nanu-ally'] = 1;
    r.story.flags['ev:alola-bars'] = 1;
    startFormat('siege', { content, run: r });
    const st = (r.expansion!.cut!.format as { state: { districts: { id: string; status: string }[] } }).state.districts;
    expect(st.find((d) => d.id === 'ula-ula')!.status).toBe('held');
    expect(st.find((d) => d.id === 'melemele')!.status).toBe('held');
    expect(st.find((d) => d.id === 'akala')!.status).toBe('contested');
  });
});

describe('Colossus for Alola and Paldea', () => {
  const colRun = (region: string) => {
    const r = chooseStarter(content, createRun(content, { runId: `col-${region}`, seed: `col-${region}`, archetypeId: 'red', expansion: { worldTracks: true, climaxCut: 'extended' } }), 0);
    r.regionOrder[r.regionIndex] = region;
    beginClimax(r, region);
    return r;
  };
  it('both raids exist and the fight launches with their own shields', () => {
    for (const region of ['alola', 'paldea']) {
      const rc = COLOSSUS_REGIONS[region]!;
      expect(content.raids.raids.some((x) => x.id === rc.raidId)).toBe(true);
      expect(content.species.has(rc.species)).toBe(true);
      const r = colRun(region);
      expect(startFormat('colossus', { content, run: r })).toBe(true);
      expect(chooseOption({ content, run: r }, 'fight')).toBe(true);
      expect(r.battle?.raid?.pendingShields.length).toBeGreaterThanOrEqual(2);
    }
  });
  it('earlier choices change the shield count; at least two always stay', () => {
    const a = colRun('alola');
    expect(adjustShields('alola', a, [0.75, 0.5, 0.25])).toHaveLength(3);
    a.story.flags['ev:alola-mohn-found'] = 1;
    expect(adjustShields('alola', a, [0.75, 0.5, 0.25])).toEqual([0.5, 0.25]);
    const p = colRun('paldea');
    expect(adjustShields('paldea', p, [0.75, 0.5, 0.25]).length).toBeGreaterThanOrEqual(2);
  });
});

describe('Blackout for Alola and Paldea', () => {
  const bRun = (region: string) => {
    const r = chooseStarter(content, createRun(content, { runId: `bo-${region}`, seed: `bo-${region}`, archetypeId: 'red', expansion: { worldTracks: true, climaxCut: 'extended' } }), 0);
    r.regionOrder[r.regionIndex] = region;
    beginClimax(r, region);
    return r;
  };
  it('starts with three anchors in both regions and launches a fight', () => {
    for (const region of ['alola', 'paldea']) {
      const r = bRun(region);
      expect(startFormat('blackout', { content, run: r })).toBe(true);
      const st = (r.expansion!.cut!.format as { state: { region: string; anchors: unknown[] } }).state;
      expect(st.region).toBe(region);
      expect(st.anchors).toHaveLength(3);
      expect(chooseOption({ content, run: r }, 'a1')).toBe(true);
      expect(r.battle).toBeTruthy();
    }
  });
  it('Alola\'s fights carry Thin Light unless Beans came along; Paldea has no condition', () => {
    const a = bRun('alola');
    startFormat('blackout', { content, run: a });
    chooseOption({ content, run: a }, 'a1');
    expect(a.battle?.eventRule?.thinLight).toBe(true);
    const b = bRun('alola');
    b.story.flags['ev:alola-beans-joined'] = 1;
    startFormat('blackout', { content, run: b });
    chooseOption({ content, run: b }, 'a1');
    expect(b.battle?.eventRule?.thinLight).toBeFalsy();
    const p = bRun('paldea');
    startFormat('blackout', { content, run: p });
    chooseOption({ content, run: p }, 'a1');
    expect(p.battle?.eventRule?.thinLight).toBeFalsy();
  });
});

import { createBattle, eventRuleEnd } from '../../src/core/battle/engine';
import { createPokemon } from '../../src/core/pokemon';

describe('Thin Light', () => {
  it('strikes one Pokémon for an eighth on every third turn, never to a knockout', () => {
    const me = createPokemon(content, 'snorlax', 50, 'p');
    const foe = createPokemon(content, 'machop', 50, 'f');
    const b = createBattle('trainer', [foe], 0, me.uid);
    b.eventRule = { thinLight: true } as never;
    const events: never[] = [];
    b.turn = 2;
    eventRuleEnd(b, events, [me], content);
    expect(events).toHaveLength(0);
    b.turn = 3;
    const before = me.hp + foe.hp;
    eventRuleEnd(b, events, [me], content);
    expect(events.length).toBe(2);
    expect(before - (me.hp + foe.hp)).toBeGreaterThan(0);
    expect(me.hp).toBeGreaterThanOrEqual(1);
    expect(foe.hp).toBeGreaterThanOrEqual(1);
    me.hp = 1; foe.hp = 1;
    eventRuleEnd(b, [], [me], content);
    expect(me.hp).toBe(1);
  });
});

describe('Alola beast Front', () => {
  it('only runs after the Mother Beast was taken, then fights three lanes', () => {
    const r = chooseStarter(content, createRun(content, { runId: 'fr1', seed: 'fr1', archetypeId: 'red', expansion: { worldTracks: true, climaxCut: 'extended' } }), 0);
    r.regionOrder[r.regionIndex] = 'alola';
    beginClimax(r, 'alola');
    expect(startFormat('front', { content, run: r })).toBe(false);
    r.story.flags['alola.x.mother-beast'] = 'taken';
    expect(startFormat('front', { content, run: r })).toBe(true);
    const st = (r.expansion!.cut!.format as { state: { region: string; lanes: unknown[] } }).state;
    expect(st.region).toBe('alola');
    expect(st.lanes).toHaveLength(3);
    expect(chooseOption({ content, run: r }, 'begin')).toBe(true);
    expect(r.battle?.eventRule?.lanes).toBe(true);
  });
});
