// Gimmick progression (S479 Mega Stone levels, S480 Dynamax Band levels, S482 Z-Ring attunement), run v38.

import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { zMoveOptions } from '../../src/core/battle/transform';
import { gimmickContext, gimmickLevel, noteGimmickUse, stoneKey } from '../../src/core/gimmicks';
import { calcStats, createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { chooseStarter, createRun } from '../../src/core/run';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

function ctxFor(party: ReturnType<typeof createPokemon>[], inventory: Record<string, number>, gimmicks?: BattleContext['gimmicks']): BattleContext {
  const enemy = createPokemon(content, 'snorlax', 90, 'e1');
  enemy.moves = [{ id: 'growl', pp: 40 }];
  const battle = createBattle('wild', [enemy], 0, party[0]!.uid, null);
  return { content, battle, party, inventory, rng: new Rng(hashSeed('gm')), captureRng: new Rng(hashSeed('gm-c')), catchMultiplier: 1, gimmicks };
}
const mon = (species: string, level: number, uid: string, ...moves: string[]) => {
  const m = createPokemon(content, species, level, uid);
  m.moves = moves.map((id) => ({ id, pp: content.moves.get(id)!.pp }));
  return m;
};

describe('gimmick levels', () => {
  it('level thresholds come from balance (2, 5, 9 uses)', () => {
    expect([0, 1, 2, 4, 5, 8, 9, 50].map((n) => gimmickLevel(content, n))).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
  });

  it('a Dynamax lasts one more turn per band level, but only for you', () => {
    const run = (uses: number) => {
      const p = mon('pidgey', 30, 'p1', 'tackle');
      const ctx = ctxFor([p], { 'dynamax-band': 1 }, { uses: { dynamax: uses }, typeUses: {} });
      resolveTurn(ctx, { kind: 'move', index: 0, transform: { kind: 'dynamax' } });
      return ctx.battle.transform.dynamax[p.uid];
    };
    // The first turn already ran down once, so compare the two runs.
    expect(run(9)! - run(0)!).toBe(3);
  });

  it('a levelled Mega Stone heals its Pokémon when it Mega Evolves', () => {
    const heal = (uses: number) => {
      const p = mon('charizard', 50, 'p1', 'flamethrower');
      p.hp = Math.floor(calcStats(content, p).hp / 4);
      const before = p.hp;
      const ctx = ctxFor([p], { 'mega-ring': 1, 'charizardite-y': 1 }, { uses: { [stoneKey('charizardite-y')]: uses }, typeUses: {} });
      resolveTurn(ctx, { kind: 'move', index: 0 });
      return { before, p, ctx };
    };
    const none = heal(0);
    const top = heal(9);
    expect(top.p.hp).toBeGreaterThan(none.p.hp);
  });

  it('the Z-Ring only attunes to a type after enough hits with it', () => {
    const p = mon('charizard', 50, 'p1', 'flamethrower');
    const inv = { 'z-ring': 1, 'firium-z': 1 };
    const need = content.balance.transformations.gimmick.zAttuneUses;
    const early = ctxFor([p], inv, { uses: {}, typeUses: { fire: need - 1 } });
    expect(zMoveOptions(early)).toEqual([null]);
    const ready = ctxFor([p], inv, { uses: {}, typeUses: { fire: need } });
    expect(zMoveOptions(ready)[0]).not.toBeNull();
    // Contexts that carry no gimmick record (raids, old tests) are not gated.
    expect(zMoveOptions(ctxFor([p], inv))[0]).not.toBeNull();
  });

  it('counts uses and type hits from the run, and old runs migrate', () => {
    const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'gm', seed: 'gm-seed', archetypeId: 'red' }), 0));
    noteGimmickUse(run, 'mega', 'charizardite-y');
    noteGimmickUse(run, 'mega', 'charizardite-y');
    noteGimmickUse(run, 'dynamax', null);
    expect(run.gimmicks.uses).toEqual({ 'mega:charizardite-y': 2, dynamax: 1 });
    const uid = run.party[0]!.uid;
    run.story!.histories[uid] = { ...(run.story!.histories[uid] ?? ({} as never)), moves: { ember: 4, growl: 9 } } as never;
    expect(gimmickContext(content, run).typeUses.fire).toBe(4);
    expect(gimmickContext(content, run).typeUses.normal).toBeUndefined();

    const storage = new MemoryStorageProvider();
    const old = structuredClone(run) as any;
    delete old.gimmicks;
    storage.set('pkr.run', JSON.stringify({ format: 'pkmn-roguelike', record: 'run', schemaVersion: 37, savedAt: '', data: old }));
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status).toBe('ok');
    if (loaded.status !== 'ok') return;
    expect(loaded.migratedFrom).toBe(37);
    expect(loaded.data.gimmicks).toEqual({ uses: {} });

    const sm = new SaveManager(new MemoryStorageProvider(), content);
    sm.saveRun(run);
    const again = sm.loadRun();
    expect(again.status === 'ok' && again.data.gimmicks.uses).toEqual(run.gimmicks.uses);
  });
});
