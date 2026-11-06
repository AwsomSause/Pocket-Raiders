// Contest conditions (S487-S489, run v37): Poffins raise the lead's conditions, the contest reads them, curry heals, old runs migrate.

import { describe, expect, it } from 'vitest';
import { beginMinigame, minigameAct, minigameView } from '../../src/core/minigame/flow';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

function stopRun(gameId: string): RunState {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'ct', seed: 'ct-seed', archetypeId: 'red' }), 0));
  const node = run.stage!.map.nodes.find((n) => n.column === 1)!;
  node.sides = [{ id: 'mg-test', kind: 'minigame', minigameId: gameId, used: false }];
  run.stage!.current = node.id;
  return run;
}

describe('contest conditions', () => {
  it('a finished Poffin blend raises one condition of the lead and survives save and reload', () => {
    let run = beginMinigame(content, stopRun('berry-blending'), 'mg-test', 0);
    const want = (run.minigame!.state as any).want as number[];
    // Add exactly the wanted flavours with the single-flavour berries (cells 0-4), then serve.
    for (let f = 0; f < 5; f++) for (let n = 0; n < Math.ceil(want[f]! / 2); n++) if (!run.minigame!.outcome) run = minigameAct(content, run, String(f));
    if (!run.minigame!.outcome) run = minigameAct(content, run, 'serve');
    const out = run.minigame!.outcome!;
    const lead = run.party[0]!;
    if (out.medal === 'none') expect(run.minigames.contest[lead.uid]).toBeUndefined();
    else {
      const c = run.minigames.contest[lead.uid]!;
      expect(c.reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
      expect(out.lines.join(' ')).toMatch(/Poffin/);
    }
    const sm = new SaveManager(new MemoryStorageProvider(), content);
    const saved = structuredClone(run);
    sm.saveRun(saved);
    const again = sm.loadRun();
    expect(again.status === 'ok' && again.data.minigames.contest).toEqual(run.minigames.contest);
  });

  it('the contest adds the lead\'s condition to its appeals and rewards the judged one', () => {
    const base = stopRun('pokemon-contest');
    const lead = base.party[0]!;
    base.minigames.contest[lead.uid] = [10, 0, 0, 0, 0];
    let run = beginMinigame(content, base, 'mg-test', 0);
    expect((run.minigame!.state as any).cond[0]).toBe(10);
    const judged = (run.minigame!.state as any).judge[0] as number;
    run = minigameAct(content, run, '0');
    const pts = (run.minigame!.state as any).points as number;
    expect(pts).toBeGreaterThanOrEqual(2 + 10 + (judged === 0 ? 6 : 0));
    expect(minigameView(content, run).hud.join(' ')).toContain('Cool 10');
  });

  it('camp cooking now heals on silver and gold', () => {
    const def = content.minigames.games.find((g) => g.id === 'camp-cooking')!;
    expect(def.rewardTable.silver.effect?.kind).toBe('heal');
    expect(def.rewardTable.gold.effect?.kind).toBe('heal');
  });

  it('a version 36 run loads with no conditions', () => {
    const storage = new MemoryStorageProvider();
    const run = structuredClone(stopRun('berry-blending')) as any;
    delete run.minigames.contest;
    storage.set('pkr.run', JSON.stringify({ format: 'pkmn-roguelike', record: 'run', schemaVersion: 36, savedAt: '', data: run }));
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status).toBe('ok');
    if (loaded.status !== 'ok') return;
    expect(loaded.migratedFrom).toBe(36);
    expect(loaded.data.minigames.contest).toEqual({});
  });
});
