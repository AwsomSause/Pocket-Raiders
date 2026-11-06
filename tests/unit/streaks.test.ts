import { describe, expect, it } from 'vitest';
import { chooseStarter, createRun } from '../../src/core/run';
import { advanceStreak, applyPity } from '../../src/core/streaks';
import { MemoryStorageProvider } from '../../src/save/storage';
import { SaveManager } from '../../src/save/saveManager';
import { content } from './helpers';

const fresh = () => chooseStarter(content, createRun(content, { runId: 's', seed: 'streak', archetypeId: 'red' }), 0);

describe('Streak Bonuses (S313)', () => {
  it('pays at the milestones and repeats them', () => {
    const run = fresh();
    const gifts = Array.from({ length: 12 }, () => advanceStreak(content, run)?.item ?? null);
    expect(gifts[2]).toBe('super-potion'); // 3rd win
    expect(gifts[5]).toBe('ultra-ball'); // 6th win beats the potion
    expect(gifts[8]).toBe('super-potion'); // 9th
    expect(gifts[9]).toBe('revive'); // 10th
    expect(gifts[0]).toBeNull();
    expect(run.streaks.best).toBe(12);
  });
  it('a new faint resets the streak, an old one does not', () => {
    const run = fresh();
    advanceStreak(content, run); advanceStreak(content, run);
    run.party[0]!.hp = 0;
    expect(advanceStreak(content, run)).toBeNull();
    expect(run.streaks.wins).toBe(0);
    advanceStreak(content, run);
    expect(run.streaks.wins).toBe(1); // the same fainted Pokémon is not a new faint
    expect(run.streaks.best).toBe(2);
  });
});

describe('Pity Counters (S321)', () => {
  const plain = () => [...content.rewards.values()].filter((r) => r.rarity === 'common').slice(0, 3).map((r) => r.id);
  it('forces a rare reward after enough drafts without one, deterministically', () => {
    const a = fresh(); const b = fresh();
    const draft = plain();
    let out = draft;
    for (let i = 0; i < content.balance.luck.pityRareAfter; i++) out = applyPity(content, a, draft);
    expect(out).toEqual(draft);
    expect(a.streaks.rareMisses).toBe(content.balance.luck.pityRareAfter);
    out = applyPity(content, a, draft);
    expect(out).not.toEqual(draft);
    expect(['rare', 'epic']).toContain(content.rewards.get(out.at(-1)!)!.rarity);
    expect(a.streaks.rareMisses).toBe(0);
    let again = draft;
    for (let i = 0; i <= content.balance.luck.pityRareAfter; i++) again = applyPity(content, b, draft);
    expect(again).toEqual(out);
  });
  it('a draft that already has a rare reward resets the counter', () => {
    const run = fresh();
    run.streaks.rareMisses = 3;
    const rare = [...content.rewards.values()].find((r) => r.rarity === 'rare')!.id;
    expect(applyPity(content, run, [rare, ...plain().slice(0, 2)])).toContain(rare);
    expect(run.streaks.rareMisses).toBe(0);
  });
});

describe('run v35', () => {
  it('a version 34 run loads with an empty streak', () => {
    const storage = new MemoryStorageProvider();
    const run = structuredClone(fresh()) as Record<string, unknown>;
    delete run.streaks;
    storage.set('pkr.run', JSON.stringify({ format: 'pkmn-roguelike', record: 'run', schemaVersion: 34, savedAt: '', data: run }));
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status).toBe('ok');
    if (loaded.status !== 'ok') return;
    expect(loaded.migratedFrom).toBe(34);
    expect(loaded.data.streaks).toEqual({ wins: 0, best: 0, faintedSeen: 0, rareMisses: 0 });
  });
  it('a streak survives a save and reload', () => {
    const saves = new SaveManager(new MemoryStorageProvider(), content);
    const run = fresh();
    run.streaks = { wins: 4, best: 7, faintedSeen: 1, rareMisses: 2 };
    saves.saveRun(run);
    const loaded = saves.loadRun();
    expect(loaded.status === 'ok' && loaded.data.streaks).toEqual({ wins: 4, best: 7, faintedSeen: 1, rareMisses: 2 });
  });
});
