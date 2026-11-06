// Choice Items 2.0 (S429): a Lock Breaker lets a Choice holder leave its lock for a price in HP.

import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, type BattleContext, type BattleEvent, type PlayerAction } from '../../src/core/battle/engine';
import { moveBlockReason } from '../../src/core/battle/moveBlock';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { content } from './helpers';

function fight(withBreaker: boolean) {
  const me = createPokemon(content, 'tyranitar', 50, 'ty');
  me.moves = ['crunch', 'tackle'].map((id) => ({ id, pp: content.moves.get(id)!.pp }));
  me.held = { 'choice-band': 1, ...(withBreaker ? { 'lock-breaker': 1 } : {}) };
  const foe = createPokemon(content, 'snorlax', 100, 'foe');
  foe.moves = [{ id: 'harden', pp: 30 }];
  foe.hp *= 20;
  const battle = createBattle('trainer', [foe], 0, me.uid, { classId: 'youngster', name: 'Joey', leaderId: null });
  battle.ai = 0;
  const ctx: BattleContext = { content, battle, party: [me], inventory: {}, rng: new Rng(hashSeed('lb')), captureRng: new Rng(hashSeed('cap')), catchMultiplier: 1 };
  return { battle, me, turn: (a: PlayerAction): BattleEvent[] => resolveTurn(ctx, a) };
}
const used = (ev: BattleEvent[]) => ev.filter((e) => e.type === 'move' && e.side === 'player').map((e) => (e as { moveId: string }).moveId);

describe('Lock Breaker', () => {
  it('without it, a Choice holder keeps using the locked move', () => {
    const f = fight(false);
    expect(used(f.turn({ kind: 'move', index: 0 }))).toEqual(['crunch']);
    expect(moveBlockReason(content, f.battle, f.me, 1)).toBe('Choice lock');
    expect(used(f.turn({ kind: 'move', index: 1 }))).toEqual(['crunch']);
  });

  it('with it, the holder can pick another move for 10% max HP, and that move becomes the lock', () => {
    const f = fight(true);
    f.turn({ kind: 'move', index: 0 });
    expect(moveBlockReason(content, f.battle, f.me, 1)).toBeNull();
    const before = f.me.hp;
    const ev = f.turn({ kind: 'move', index: 1 });
    expect(used(ev)).toEqual(['tackle']);
    expect(before - f.me.hp).toBeGreaterThanOrEqual(Math.floor(maxHp(content, f.me) * 0.1));
    expect(ev.some((e) => e.type === 'spectacle' && e.kind === 'lockBreak')).toBe(true);
    expect(f.battle.held!.choice['ty']).toBe('tackle');
    // Staying on the same move costs nothing.
    const hp = f.me.hp;
    f.turn({ kind: 'move', index: 1 });
    expect(f.me.hp).toBe(hp);
  });

  it('never faints the holder', () => {
    const f = fight(true);
    f.turn({ kind: 'move', index: 0 });
    f.me.hp = 1;
    expect(moveBlockReason(content, f.battle, f.me, 1)).toBe('Choice lock');
    expect(used(f.turn({ kind: 'move', index: 1 }))).toEqual(['crunch']);
    expect(f.me.hp).toBe(1);
  });
});
