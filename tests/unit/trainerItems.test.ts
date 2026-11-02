// S271: every trainer (ai 0 included) heals when low; only smart ones switch on purpose.
import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { content } from './helpers';

function run(ai: number, flag: boolean) {
  const c = { ...content, balance: { ...content.balance, trainerAi: { ...content.balance.trainerAi, allTrainersUseItems: flag } } };
  const player = createPokemon(c, 'rattata', 50, 'p');
  player.moves = [{ id: 'splash', pp: 40 }];
  const enemy = createPokemon(c, 'snorlax', 50, 'e');
  enemy.moves = [{ id: 'splash', pp: 40 }];
  enemy.hp = 5;
  const battle = createBattle('trainer', [enemy], 0, player.uid);
  battle.ai = ai;
  const ctx: BattleContext = { content: c, battle, party: [player], inventory: {}, rng: new Rng(hashSeed('s271')), captureRng: new Rng(hashSeed('s271c')), catchMultiplier: 1 };
  const events = resolveTurn(ctx, { kind: 'move', index: 0 });
  return { battle, events };
}

describe('S271 all trainers use items', () => {
  it('an ordinary trainer (ai 0) heals once when low', () => {
    const r = run(0, true);
    expect(r.battle.enemyItemsUsed).toBe(1);
    expect(r.events.some((e) => e.type === 'item')).toBe(true);
  });
  it('flag off keeps the old behaviour', () => {
    expect(run(0, false).battle.enemyItemsUsed).toBe(0);
  });
  it('a smart trainer still heals', () => {
    expect(run(0.5, false).battle.enemyItemsUsed).toBe(1);
  });
});
