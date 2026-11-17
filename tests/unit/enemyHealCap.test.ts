// Enemy trainers use at most 4 healing items a battle, and the potion gets stronger by region.
import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { content } from './helpers';

function fight(region: number, used: number, rival = false) {
  const player = createPokemon(content, 'rattata', 50, 'p');
  player.moves = [{ id: 'splash', pp: 40 }];
  const enemy = createPokemon(content, 'snorlax', 50, 'e');
  enemy.moves = [{ id: 'splash', pp: 40 }];
  enemy.hp = 5;
  const battle = createBattle('trainer', [enemy], 0, player.uid);
  battle.ai = 0;
  if (rival) (battle as { rival?: unknown }).rival = { id: 'x' };
  battle.enemyItemsUsed = used;
  const ctx: BattleContext = { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed('cap')), captureRng: new Rng(hashSeed('capc')), catchMultiplier: 1, foeHealTier: region };
  const events = resolveTurn(ctx, { kind: 'move', index: 0 });
  return { battle, item: events.find((e) => e.type === 'item') as { itemId: string; hpAfter: number } | undefined };
}

describe('enemy healing cap and scaling', () => {
  it('region 0 drinks a plain Potion, later regions stronger ones', () => {
    expect(fight(0, 0).item?.itemId).toBe('potion');
    expect(fight(1, 0).item?.itemId).toBe('super-potion');
    expect(fight(2, 0).item?.itemId).toBe('hyper-potion');
    expect(fight(0, 0).item!.hpAfter).toBeLessThan(fight(3, 0).item!.hpAfter);
  });
  it('stops at the cap of 4 items', () => {
    const cap = content.balance.trainerAi.maxHealItems;
    expect(cap).toBe(4);
    expect(fight(3, cap).item).toBeUndefined();
    expect(fight(3, cap, true).item).toBeUndefined();
  });
});
