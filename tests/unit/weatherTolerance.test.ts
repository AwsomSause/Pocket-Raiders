// S168: a Pokémon that has endured a weather's chip damage takes less of it.
import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, weatherCut, type BattleContext } from '../../src/core/battle/engine';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { content } from './helpers';

function sandTurn(endured: number) {
  const player = createPokemon(content, 'rattata', 50, 'p');
  player.moves = [{ id: 'splash', pp: 40 }];
  if (endured) player.weatherEndured = { sand: endured };
  const enemy = createPokemon(content, 'snorlax', 50, 'e');
  enemy.moves = [{ id: 'splash', pp: 40 }];
  const battle = createBattle('wild', [enemy], 0, player.uid);
  battle.weather = { id: 'sand', turns: 5 };
  const ctx: BattleContext = { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed('s168')), captureRng: new Rng(hashSeed('s168c')), catchMultiplier: 1 };
  const before = player.hp;
  resolveTurn(ctx, { kind: 'move', index: 0 });
  return { lost: before - player.hp, player };
}

describe('S168 weather tolerance', () => {
  it('no history means no cut', () => {
    expect(weatherCut(content, createPokemon(content, 'rattata', 5, 'x'), 'sand')).toBe(0);
  });
  it('endured turns cut chip damage, capped at maxLevels', () => {
    const cfg = content.balance.weatherTolerance;
    const mon = createPokemon(content, 'rattata', 5, 'x');
    mon.weatherEndured = { sand: cfg.turnsPerLevel * 99 };
    expect(weatherCut(content, mon, 'sand')).toBeCloseTo(cfg.maxLevels * cfg.cutPerLevel);
    expect(weatherCut(content, mon, 'hail')).toBe(0);
  });
  it('a seasoned Pokémon loses less HP and keeps counting', () => {
    const fresh = sandTurn(0);
    const seasoned = sandTurn(content.balance.weatherTolerance.turnsPerLevel * 3);
    expect(seasoned.lost).toBeLessThan(fresh.lost);
    expect(fresh.player.weatherEndured?.sand).toBe(1);
  });
});
