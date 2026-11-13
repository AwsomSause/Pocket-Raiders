// Beta 0.6 E5b + R9: story raid results, levers, Raids 4/5 gates, and a lost raid starting the rival's rescue clock.
import { describe, expect, it } from 'vitest';
import { ExpansionRunSchema } from '../../src/core/expansion/schema';
import { applyEvilEffect, evilOf, evilStageStart } from '../../src/core/evil/teams';
import { activeHolds, offerDue, rescueOf, RESCUE } from '../../src/core/evil/rescue';
import { pendingRescue } from '../../src/core/evil/rescueGlue';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { RAID_RESULTS, STORY_RAIDS, climaxMods, impoundFor, osChange, raidOffered, raidRecord, resolveStoryRaid } from '../../src/core/raid/storyRaids';
import { content } from './helpers';

const mk = (seed = 'sr1'): RunState => {
  const r = chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red' }), 0);
  const base = r.party[0]!;
  r.party = Array.from({ length: 5 }, (_, i) => ({ ...structuredClone(base), uid: `m${i}` }));
  return r;
};

describe('data', () => {
  it('five Kanto raids, every one has all five results, and OS steps match the design table', () => {
    expect(STORY_RAIDS.raids.map((r) => r.n)).toEqual([1, 2, 3, 4, 5]);
    for (const r of STORY_RAIDS.raids) {
      for (const k of RAID_RESULTS) expect(r.results[k], `${r.id}/${k}`).toBeDefined();
      expect([r.results.triumph.os, r.results.success.os, r.results.partial.os, r.results.failure.os, r.results.declined.os]).toEqual([-3, -2, -1, 2, 1]);
    }
  });
  it('Raid 4 and 5 are the Kanto ids the pack already lists', () => {
    const ids = STORY_RAIDS.raids.map((r) => r.id);
    expect(ids).toContain('pr.kanto.vermilion-docks');
    expect(ids).toContain('pr.kanto.safari-night');
  });
});

describe('gates', () => {
  it('Raid 4 waits for Raid 2; Raid 5 waits for Raid 3 or track step 4', () => {
    const r = mk();
    expect(raidOffered(r, 2)).toBe(true);
    expect(raidOffered(r, 4)).toBe(false);
    expect(raidOffered(r, 5)).toBe(false);
    resolveStoryRaid(content, r, 2, 'partial');
    expect(raidOffered(r, 4)).toBe(true);
    expect(raidOffered(r, 5)).toBe(false);
    r.expansion!.track = { step: 4 };
    expect(raidOffered(r, 5)).toBe(true);
    const r2 = mk('sr2');
    resolveStoryRaid(content, r2, 3, 'declined');
    expect(raidOffered(r2, 5)).toBe(true);
  });
  it('a resolved raid is not offered again', () => {
    const r = mk();
    resolveStoryRaid(content, r, 1, 'success');
    expect(raidOffered(r, 1)).toBe(false);
  });
});

describe('results and levers', () => {
  it('a result applies once; a second call returns the first and changes nothing', () => {
    const r = mk();
    const a = resolveStoryRaid(content, r, 4, 'success');
    const before = JSON.stringify(r.expansion);
    const b = resolveStoryRaid(content, r, 4, 'failure');
    expect(b.alreadyResolved).toBe(true);
    expect(b.record).toEqual(a.record);
    expect(JSON.stringify(r.expansion)).toBe(before);
  });
  it('levers write only siege, apex, cast, cut and the raid record', () => {
    const r = mk();
    resolveStoryRaid(content, r, 4, 'triumph');
    resolveStoryRaid(content, r, 5, 'failure');
    expect(Object.keys(r.expansion!).sort()).toEqual(['apex', 'cast', 'cut', 'raids', 'siege']);
    expect((r.expansion!.siege as { levers: Record<string, string> }).levers).toEqual({ manifest: 'broken', herd: 'strengthened' });
    expect(r.expansion!.cast).toEqual({ ledger: 'joinable' });
    expect(r.expansion!.apex).toEqual({ 'black-label-gauntlet': true });
    expect(climaxMods(r)).toEqual({ convoy: -1 });
  });
  it('boundary: losing every raid is harder but never past +2 OS, +1 gauntlet, +1 phase', () => {
    const r = mk();
    for (const n of [1, 2, 3, 4, 5]) resolveStoryRaid(content, r, n, 'failure');
    expect(osChange(r)).toBe(2);
    expect(climaxMods(r).gauntlet).toBe(1);
    expect(climaxMods(r).phase1).toBe(1);
  });
  it('boundary: winning every raid never goes below -2 OS', () => {
    const r = mk();
    for (const n of [1, 2, 3, 4, 5]) resolveStoryRaid(content, r, n, 'triumph');
    expect(osChange(r)).toBe(-2);
    expect(climaxMods(r).phase1).toBe(-1);
  });
  it('failure: an unknown raid number throws', () => {
    expect(() => resolveStoryRaid(content, mk(), 9, 'failure')).toThrow();
  });
  it('Raid 4 and 5 failures do not impound (their scripts list C2/C8 and C3/C10)', () => {
    const r = mk();
    expect(resolveStoryRaid(content, r, 4, 'failure').hold).toBeNull();
    expect(resolveStoryRaid(content, r, 5, 'failure').hold).toBeNull();
    expect(r.party).toHaveLength(5);
  });
});

describe('a lost raid starts the rescue clock', () => {
  it('Raid 2 lost impounds 1-3 bench Pokémon, keeps two, and records the count', () => {
    const r = mk();
    const out = resolveStoryRaid(content, r, 2, 'failure');
    expect(out.hold).not.toBeNull();
    const n = out.hold!.pokemon.length;
    expect(n).toBeGreaterThanOrEqual(1);
    expect(n).toBeLessThanOrEqual(3);
    expect(r.party).toHaveLength(5 - n);
    expect(raidRecord(r, 2)?.impounded).toBe(n);
    expect(activeHolds(r)).toHaveLength(1);
  });
  it('declining or winning does not impound', () => {
    for (const res of ['declined', 'partial', 'success', 'triumph'] as const) {
      const r = mk('sr-' + res);
      expect(resolveStoryRaid(content, r, 2, res).hold).toBeNull();
      expect(r.party).toHaveLength(5);
    }
  });
  it('the count is the same on replay (hashed from seed + region, no stream)', () => {
    const a = impoundFor(content, mk('same'), 'rocket', 'raid-2')!;
    const b = impoundFor(content, mk('same'), 'rocket', 'raid-2')!;
    expect(a.pokemon).toHaveLength(b.pokemon.length);
    expect(a.dueAt).toBe(b.dueAt);
  });
  it('a team with no holding site impounds nothing', () => {
    const r = mk();
    expect(impoundFor(content, r, 'marauders', 'x')).toBeNull();
    expect(r.party).toHaveLength(5);
  });
  it('the offer comes on the due node and stays off before it', () => {
    const r = mk();
    const h = resolveStoryRaid(content, r, 2, 'failure').hold!;
    expect(offerDue(r, h.impoundNode, true)).toBeNull();
    expect(offerDue(r, h.dueAt, true)?.holdId).toBe(h.id);
  });
  it('save and reload keeps the raids, the levers and the hold', () => {
    const r = mk();
    resolveStoryRaid(content, r, 2, 'failure');
    resolveStoryRaid(content, r, 4, 'success');
    const copy = ExpansionRunSchema.parse(JSON.parse(JSON.stringify(r.expansion)));
    r.expansion = copy;
    expect(raidRecord(r, 2)?.result).toBe('failure');
    expect(raidRecord(r, 4)?.result).toBe('success');
    expect(rescueOf(r).holds).toHaveLength(1);
    expect(raidOffered(r, 4)).toBe(false);
    expect(RESCUE.sites.length).toBeGreaterThan(0);
  });
});

describe('the live operations: letting one through impounds once', () => {
  const withOp = (seed: string): RunState => {
    const r = mk(seed);
    while (!evilOf(r).teamId) evilStageStart(content, r);
    return r;
  };
  it('an operation that goes through starts a hold; shutting it down does not', () => {
    for (let i = 0; i < 12; i++) {
      const r = withOp(`op${i}`);
      const team = evilOf(r).teamId!;
      const has = RESCUE.sites.some((s) => s.team === team);
      applyEvilEffect(content, r, { op: 'succeeded', heat: 0 } as never);
      expect(activeHolds(r).length, team).toBe(has ? 1 : 0);
      const stopped = withOp(`op${i}`);
      applyEvilEffect(content, stopped, { op: 'foiled', heat: 0 } as never);
      expect(activeHolds(stopped)).toHaveLength(0);
    }
  });
  it('the same operation cannot impound twice', () => {
    const r = withOp('op-twice');
    applyEvilEffect(content, r, { op: 'succeeded', heat: 0 } as never);
    const n = r.party.length;
    applyEvilEffect(content, r, { op: 'succeeded', heat: 0 } as never);
    expect(r.party).toHaveLength(n);
    expect(pendingRescue(content, r)).toBeNull();
  });
});

describe('failure costs (C2, C3, C8, C10, C11)', () => {
  const failed = (n: number, setup: (r: RunState) => void = () => undefined, seed = 'cost') => {
    const r = mk(seed);
    r.money = 1000;
    r.plaza.rep = 20;
    r.inventory = { potion: 5, 'poke-ball': 5, ...Object.fromEntries([...content.items.values()].filter((i) => i.category === 'key').slice(0, 1).map((i) => [i.id, 1])) };
    setup(r);
    const out = resolveStoryRaid(content, r, n, 'failure');
    return { r, out };
  };
  it('Raid 4 failure: a fine of 40-60%, reputation -15, a 3-battle setback; items and party untouched', () => {
    const { r, out } = failed(4);
    expect(r.money).toBeGreaterThanOrEqual(400);
    expect(r.money).toBeLessThanOrEqual(600);
    expect(r.plaza.rep).toBe(5);
    expect(r.tempEffects.at(-1)).toMatchObject({ battles: 3, effects: [{ kind: 'moneyMultiplier', value: 0.75 }, { kind: 'xpMultiplier', value: 0.75 }, { kind: 'researchMultiplier', value: 0.75 }] });
    expect(out.record.costs).toEqual(['C2', 'C8', 'C11']);
    expect(Object.values(r.inventory).reduce((a, b) => a + b, 0)).toBe(11);
    expect(r.party.some((p) => p.shadow)).toBe(false);
  });
  it('Raid 5 failure: 2-4 items taken (never Key Items), one Pokémon shadowed with a high Heart Gauge, a setback', () => {
    const { r, out } = failed(5);
    const keyId = [...content.items.values()].find((i) => i.category === 'key')!.id;
    expect(r.inventory[keyId]).toBe(1);
    const left = Object.entries(r.inventory).filter(([id]) => id !== keyId).reduce((a, [, b]) => a + b, 0);
    expect(left).toBeGreaterThanOrEqual(6);
    expect(left).toBeLessThanOrEqual(8);
    const sh = r.party.filter((p) => p.shadow);
    expect(sh).toHaveLength(1);
    expect(sh[0]!.shadow!.heart).toBeGreaterThanOrEqual(80);
    expect(out.record.costs).toEqual(['C3', 'C10', 'C11']);
    expect(r.tempEffects.length).toBe(1);
  });
  it('Raid 5 failure can take Pokémon-held items too, and never leaves a zero count behind', () => {
    let tookHeld = false;
    for (let i = 0; i < 20 && !tookHeld; i++) {
      const { r } = failed(5, (x) => { x.inventory = {}; x.party[0]!.held = { 'oran-berry': 1 }; x.party[1]!.held = { leftovers: 2 }; }, `held${i}`);
      const left = r.party.flatMap((p) => Object.entries(p.held ?? {}));
      expect(left.every(([, c]) => c >= 1)).toBe(true);
      tookHeld = left.reduce((a, [, c]) => a + c, 0) < 3;
    }
    expect(tookHeld).toBe(true);
  });
  it('boundary: no money, no bag, no rep means nothing to take and nothing breaks', () => {
    const { r, out } = failed(4, (x) => { x.money = 0; x.plaza.rep = 0; }, 'poor');
    expect(r.money).toBe(0);
    expect(r.plaza.rep).toBe(0);
    expect(out.record.costs).toEqual(['C11']);
    const bare = failed(5, (x) => { x.inventory = {}; x.party.forEach((p) => { p.shadow = { heart: 50 }; }); }, 'bare');
    expect(bare.out.record.costs).toEqual(['C11']);
  });
  it('costs apply once, same numbers on replay, and only on failure', () => {
    const a = failed(4, undefined, 'rep1');
    const b = failed(4, undefined, 'rep1');
    expect(a.r.money).toBe(b.r.money);
    const again = resolveStoryRaid(content, a.r, 4, 'failure');
    expect(again.alreadyResolved).toBe(true);
    expect(a.r.money).toBe(b.r.money);
    const ok = mk('win');
    ok.money = 1000;
    resolveStoryRaid(content, ok, 4, 'partial');
    expect(ok.money).toBe(1000);
    expect(ok.tempEffects).toHaveLength(0);
  });
  it('save and reload keeps the shadow taint and the setback', () => {
    const { r } = failed(5);
    const back = JSON.parse(JSON.stringify(r));
    expect(back.party.filter((p: { shadow?: unknown }) => p.shadow)).toHaveLength(1);
    expect(back.tempEffects).toHaveLength(1);
  });
});
