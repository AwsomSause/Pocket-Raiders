// Berserk Mode (S385): rage-prone species lose control once when badly hurt.

import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, type BattleContext, type BattleEvent, type PlayerAction } from '../../src/core/battle/engine';
import { isBerserker } from '../../src/core/battle/berserk';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import type { PokemonInstance } from '../../src/core/state';
import { content } from './helpers';

const mon = (species: string, level: number, moves: string[], uid = species) => {
  const m = createPokemon(content, species, level, uid);
  m.moves = moves.map((id) => ({ id, pp: content.moves.get(id)!.pp }));
  return m;
};

function fight(me: PokemonInstance, hpShare: number) {
  me.hp = Math.max(1, Math.floor(maxHp(content, me) * hpShare));
  const foe = mon('snorlax', 100, ['harden'], 'foe');
  foe.hp = foe.hp * 20; // soaks up three berserk hits
  const battle = createBattle('trainer', [foe], 0, me.uid, { classId: 'youngster', name: 'Joey', leaderId: null });
  battle.ai = 0;
  const ctx: BattleContext = { content, battle, party: [me], inventory: {}, rng: new Rng(hashSeed('berserk')), captureRng: new Rng(hashSeed('cap')), catchMultiplier: 1 };
  return { battle, me, turn: (a: PlayerAction): BattleEvent[] => resolveTurn(ctx, a) };
}
const said = (ev: BattleEvent[], kind: string) => ev.filter((e) => e.type === 'spectacle' && e.kind === kind).length;
const moves = (ev: BattleEvent[]) => ev.filter((e) => e.type === 'move' && e.side === 'player').map((e) => (e as { moveId: string }).moveId);

describe('Berserk Mode', () => {
  it('only the listed species are berserkers', () => {
    for (const id of ['primeape', 'annihilape', 'tyranitar', 'pangoro', 'vigoroth']) expect(isBerserker(content, createPokemon(content, id, 30, 'x')), id).toBe(true);
    expect(isBerserker(content, createPokemon(content, 'blastoise', 30, 'x'))).toBe(false);
    expect(isBerserker(content, createPokemon(content, 'mankey', 30, 'x'))).toBe(false);
  });

  it('snaps when badly hurt, throws its strongest move for three turns, then calms down once', () => {
    const f = fight(mon('tyranitar', 50, ['tackle', 'crunch'], 'ty'), 0.3);
    const first = f.turn({ kind: 'move', index: 0 });
    expect(said(first, 'berserk')).toBe(1);
    expect(f.battle.spectacle!.berserk?.uid).toBe('ty');
    const used: string[] = [];
    let calm = 0;
    for (let i = 0; i < 3; i++) {
      const ev = f.turn({ kind: 'move', index: 0 }); // we ask for Tackle
      used.push(...moves(ev));
      calm += said(ev, 'berserk');
    }
    expect(used).toEqual(['crunch', 'crunch', 'crunch']);
    expect(calm).toBe(1);
    expect(f.battle.spectacle!.berserk).toBeNull();
    expect(f.me.hp).toBeGreaterThan(0);
    // Not a second time this battle, and it picks its own move again.
    const after = f.turn({ kind: 'move', index: 0 });
    expect(said(after, 'berserk')).toBe(0);
    expect(moves(after)).toEqual(['tackle']);
  });

  it('hurts itself a little each berserk turn but never knocks itself out', () => {
    const f = fight(mon('primeape', 50, ['tackle', 'close-combat'], 'pm'), 0.05);
    f.turn({ kind: 'move', index: 0 });
    for (let i = 0; i < 3; i++) f.turn({ kind: 'move', index: 0 });
    expect(f.me.hp).toBeGreaterThanOrEqual(1);
  });

  it('does not touch a healthy berserker or another species', () => {
    const healthy = fight(mon('tyranitar', 50, ['tackle', 'crunch'], 'ty'), 1);
    expect(said(healthy.turn({ kind: 'move', index: 0 }), 'berserk')).toBe(0);
    const other = fight(mon('blastoise', 50, ['tackle', 'surf'], 'bl'), 0.2);
    expect(said(other.turn({ kind: 'move', index: 0 }), 'berserk')).toBe(0);
  });
});
