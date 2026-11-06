// Overhaul slice 3: the shared generator (eligibility, then diversity) and the run's pick history (run v39).

import { describe, expect, it } from 'vitest';
import { familyId } from '../../src/core/mastery';
import { hashSeed, Rng } from '../../src/core/rng';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { pickVaried, recentPicks, rememberPick, varietyWeight, type Candidate } from '../../src/core/variety';
import { buildContent } from '../../src/data';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { autoplay } from './autoplay';
import { content } from './helpers';

const newRun = (): RunState => structuredClone(chooseStarter(content, createRun(content, { runId: 'v', seed: 'variety', archetypeId: 'red' }), 0));
const ten: Candidate<string>[] = Array.from({ length: 10 }, (_, i) => ({ item: `s${i}`, key: `s${i}`, weight: 1 }));

/** Picks n times from the pool, remembering each pick, and counts picks already in the last 5. */
function repeatsOver(c: typeof content, n: number): number {
  const run = { history: {} as Record<string, string[]> };
  const rng = new Rng(hashSeed('repeats'));
  let repeats = 0;
  for (let i = 0; i < n; i++) {
    const before = new Set(recentPicks(run, 'wild').slice(-5));
    const pick = pickVaried(c, run, 'wild', ten, rng);
    if (before.has(pick)) repeats++;
    rememberPick(c, run, 'wild', pick);
  }
  return repeats;
}

describe('Shared generator: eligibility, then diversity', () => {
  it('a recent pick is down-weighted by the balance penalty and the history keeps only the window (normal)', () => {
    const run = newRun();
    expect(run.history).toEqual({});
    for (const id of ['a', 'b', 'c', 'd', 'e', 'f']) rememberPick(content, run, 'wild', id);
    const window = content.balance.variety.window.wild!;
    expect(recentPicks(run, 'wild')).toEqual(['a', 'b', 'c', 'd', 'e', 'f'].slice(-window));
    const w = varietyWeight(content, run, 'wild');
    expect(w('f')).toBe(content.balance.variety.penalty);
    expect(w('zz')).toBe(1);
    expect(content.balance.variety.penalty).toBeLessThan(1);
  });

  it('picking with history repeats far less than picking without it, and the same seed gives the same picks', () => {
    const off = buildContent();
    off.balance.variety = { penalty: 1, window: { wild: 5 } };
    expect(repeatsOver(content, 300)).toBeLessThan(repeatsOver(off, 300) * 0.6);
    expect(repeatsOver(content, 50)).toBe(repeatsOver(content, 50));
  });

  it('when every candidate is recent, it still picks one; a pool with no window keeps no history (boundary)', () => {
    const run = { history: { wild: ['s0', 's1', 's2', 's3', 's4'] } as Record<string, string[]> };
    const five = ten.slice(0, 5);
    expect(five.map((c) => c.item)).toContain(pickVaried(content, run, 'wild', five, new Rng(hashSeed("one"))));
    rememberPick(content, run, 'no-such-pool', 'x');
    expect(run.history['no-such-pool']).toBeUndefined();
    expect(varietyWeight(content, run, 'no-such-pool')('s0')).toBe(1);
  });

  it('throws a clear error when nothing is eligible (failure)', () => {
    expect(() => pickVaried(content, { history: {} }, 'wild', [{ item: 'x', key: 'x', weight: 0 }], new Rng(hashSeed("one")))).toThrow(/Nothing eligible in the "wild" pool/);
  });

  it('a real run remembers the families of the wild Pokémon it meets', () => {
    const run = autoplay({ seed: 'variety-run', steps: 120, healOnMap: true });
    const wild = recentPicks(run, 'wild');
    expect(wild.length).toBeGreaterThan(0);
    expect(wild.length).toBeLessThanOrEqual(content.balance.variety.window.wild!);
    for (const id of wild) expect(familyId(content, id)).toBe(id);
  });

  it('a run saved before v39 loads with an empty history, and the history survives save and reload', () => {
    const run = newRun();
    rememberPick(content, run, 'wild', 'pidgey');
    const storage = new MemoryStorageProvider();
    const old = structuredClone(run) as Partial<RunState>;
    delete old.history;
    storage.set('pkr.run', JSON.stringify({ format: 'pkmn-roguelike', record: 'run', schemaVersion: 38, savedAt: '', data: old }));
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status).toBe('ok');
    if (loaded.status !== 'ok') return;
    expect(loaded.migratedFrom).toBe(38);
    expect(loaded.data.history).toEqual({});

    const sm = new SaveManager(new MemoryStorageProvider(), content);
    sm.saveRun(run);
    const again = sm.loadRun();
    expect(again.status === 'ok' && again.data.history).toEqual({ wild: ['pidgey'] });
  });
});
