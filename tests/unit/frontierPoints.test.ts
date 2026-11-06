// Battle Frontier Points (S490, run v36): earned from Frontier facilities, spent on prizes, saved, and old runs migrate.

import { describe, expect, it } from 'vitest';
import { beginMinigame, buyFrontierPrize, payout, getMinigame } from '../../src/core/minigame/flow';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

function stopRun(gameId: string): RunState {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'fp', seed: 'fp-seed', archetypeId: 'red' }), 0));
  const node = run.stage!.map.nodes.find((n) => n.column === 1)!;
  node.sides = [{ id: 'mg-test', kind: 'minigame', minigameId: gameId, used: false }];
  run.stage!.current = node.id;
  return run;
}

describe('Frontier Points', () => {
  it('Frontier games pay points by medal and tier; other games pay none', () => {
    const run = beginMinigame(content, stopRun('battle-factory'), 'mg-test', 2);
    const def = getMinigame(content, 'battle-factory');
    const out = payout(content, run, def, 2, 4, 4); // gold on the hard tier
    expect(out.medal).toBe('gold');
    expect(run.minigames.frontierPoints).toBe(content.minigames.economy.frontier.points.gold * 3);
    const other = beginMinigame(content, stopRun('sky-race'), 'mg-test', 1);
    payout(content, other, getMinigame(content, 'sky-race'), 1, 20, 20);
    expect(other.minigames.frontierPoints).toBe(0);
  });

  it('buying spends points once, gives the item, and refuses when short', () => {
    const run = stopRun('battle-factory');
    const prize = content.minigames.economy.frontier.prizes[0]!;
    expect(() => buyFrontierPrize(content, run, prize.id)).toThrow(/Not enough/);
    run.minigames.frontierPoints = prize.cost + 1;
    const after = buyFrontierPrize(content, run, prize.id);
    expect(after.minigames.frontierPoints).toBe(1);
    expect(after.inventory[prize.item]).toBe((run.inventory[prize.item] ?? 0) + prize.count);
    expect(() => buyFrontierPrize(content, after, 'nope')).toThrow(/No Frontier prize/);
  });

  it('prize items all exist', () => {
    for (const p of content.minigames.economy.frontier.prizes) expect(content.items.has(p.item), p.item).toBe(true);
  });

  it('a version 35 run loads with zero points and a saved run keeps its points', () => {
    const storage = new MemoryStorageProvider();
    const run = structuredClone(stopRun('battle-palace')) as any;
    delete run.minigames.frontierPoints;
    storage.set('pkr.run', JSON.stringify({ format: 'pkmn-roguelike', record: 'run', schemaVersion: 35, savedAt: '', data: run }));
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status).toBe('ok');
    if (loaded.status !== 'ok') return;
    expect(loaded.migratedFrom).toBe(35);
    expect(loaded.data.minigames.frontierPoints).toBe(0);

    const sm = new SaveManager(new MemoryStorageProvider(), content);
    const r2 = structuredClone(stopRun('battle-palace'));
    r2.minigames.frontierPoints = 7;
    sm.saveRun(r2);
    const again = sm.loadRun();
    expect(again.status === 'ok' && again.data.minigames.frontierPoints).toBe(7);
  });
});
