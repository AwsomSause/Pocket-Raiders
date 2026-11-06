// Story Overhaul "Role pool casting": any boss fills any league role, wild cards are capped, the cast is seeded and stored on the run.

import { describe, expect, it } from 'vitest';
import { getCampaign } from '../../src/core/regions';
import { hashSeed } from '../../src/core/rng';
import { bossTier, castGymLeader, castLeague } from '../../src/core/rolePool';
import { chooseStarter, createRun } from '../../src/core/run';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

const envelope = (v: number, data: unknown) => JSON.stringify({ format: 'pkmn-roguelike', record: 'run', schemaVersion: v, savedAt: '', data });
const themes = [...content.themes.values()];
const campaign = getCampaign(content, createRun(content, { runId: 'c', seed: 'c', archetypeId: 'red' }).campaignId);

/** Casts every region of a run the way enterStage / enterLeague do. */
function castRun(seed: string, tweak?: (run: ReturnType<typeof createRun>) => void) {
  const run = createRun(content, { runId: seed, seed, archetypeId: 'red' });
  tweak?.(run);
  const regions = 4;
  for (let region = 0; region < regions; region++) {
    for (let stage = 0; stage < campaign.stagesPerRegion; stage++) {
      const leader = castGymLeader(content, run, themes[(region * 7 + stage) % themes.length]!, region, stage);
      run.usedLeaders.push(leader.id);
    }
    const league = castLeague(content, run, campaign, region);
    run.usedLeaders.push(...league.eliteFour, league.champion);
  }
  return run;
}

describe('role pool casting', () => {
  it('same seed gives the same cast, and the cast is stored on the run', () => {
    const a = castRun('cast-1');
    expect(castRun('cast-1').roleCast).toEqual(a.roleCast);
    expect(a.roleCast.length).toBe(4 * (campaign.stagesPerRegion + campaign.eliteFourSize + 1));
    expect(castRun('cast-2').roleCast).not.toEqual(a.roleCast);
  });

  it('holds over 100 seeds: nobody twice, wild-card caps, distinct Elite Four types, no region lock', () => {
    const cfg = content.balance.rolePool.wildCardMax;
    let offRegion = 0;
    for (let i = 0; i < 100; i++) {
      const run = castRun(`s${i}`);
      const ids = run.roleCast.map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(run.roleCast.filter((c) => c.role === 'elite' && c.tier === 'wild_card').length).toBeLessThanOrEqual(cfg.elitePerRun);
      expect(run.roleCast.filter((c) => c.role === 'champion' && c.tier === 'wild_card').length).toBeLessThanOrEqual(cfg.championPerRun);
      for (let r = 0; r < 4; r++) {
        const gyms = run.roleCast.filter((c) => c.role === 'gym' && c.regionIndex === r);
        expect(gyms.filter((c) => c.tier === 'wild_card').length).toBeLessThanOrEqual(cfg.gymPerRegion);
        const types = run.roleCast.filter((c) => c.role === 'elite' && c.regionIndex === r).map((c) => content.bosses.get(c.id)!.types[0]);
        expect(new Set(types).size).toBe(types.length);
      }
      const home = new Set(content.regions.get('kanto')?.gymLeaders ?? []);
      offRegion += run.roleCast.filter((c) => c.role === 'gym' && c.regionIndex === 0 && !home.has(c.id)).length;
    }
    expect(offRegion).toBeGreaterThan(0);
  });

  it('never casts a run rival or the evil team leader', () => {
    for (let i = 0; i < 40; i++) {
      const run = castRun(`x${i}`, (r) => {
        r.story.evil = { ...(r.story.evil as object), teamId: 'rocket' } as never;
        r.story.rivals = [{ name: 'Lance' }, { name: 'Elm' }, { name: 'Brock' }] as never;
      });
      const ids = run.roleCast.map((c) => c.id);
      for (const banned of ['giovanni', 'lance', 'elm', 'brock']) expect(ids).not.toContain(banned);
    }
  });

  it('tiers: Elm is a wild card, Brock is core', () => {
    expect(bossTier(content, 'elm')).toBe('wild_card');
    expect(bossTier(content, 'brock')).toBe('core');
  });
});

describe('run saves keep the cast', () => {
  const base = () => structuredClone(chooseStarter(content, createRun(content, { runId: 'rc', seed: 'rc', archetypeId: 'red' }), 0));
  it('round-trips roleCast and the roleCast stream', () => {
    const r = castRun('rt');
    const sm = new SaveManager(new MemoryStorageProvider(), content);
    sm.saveRun(r);
    const again = sm.loadRun();
    expect(again.status === 'ok' && again.data).toEqual(r);
  });
  it('run_v39_gets_roleCast_stream_from_seed', () => {
    const { roleCast: _c, ...old } = base();
    const { roleCast: _s, ...rng } = old.rng;
    const storage = new MemoryStorageProvider();
    storage.set('pkr.run', envelope(39, { ...old, rng }));
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status).toBe('ok');
    if (loaded.status !== 'ok') return;
    expect(loaded.data.roleCast).toEqual([]);
    expect(loaded.data.rng.roleCast).toEqual(hashSeed('rc::roleCast'));
  });
  it('a v40 run saved before the stream existed still loads', () => {
    const { roleCast: _c, ...old } = base();
    const { roleCast: _s, ...rng } = old.rng;
    const storage = new MemoryStorageProvider();
    storage.set('pkr.run', envelope(40, { ...old, rng }));
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status).toBe('ok');
    if (loaded.status === 'ok') expect(loaded.data.roleCast).toEqual([]);
  });
});
