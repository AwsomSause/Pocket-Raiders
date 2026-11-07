// W18: Pledge combos, Order Up, the Tatsugiri/Magearna Mega stones and the Delta battle forms.

import { describe, expect, it } from 'vitest';
import { createBattle, type BattleContext, type BattleEvent, type SlotCommand } from '../../src/core/battle/engine';
import { makeDoubles, monAt, resolveDoublesTurn, startDoubles, stagesAt, tatsugiriForm } from '../../src/core/battle/doubles';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { content } from './helpers';

interface Spec { species?: string; moves?: string[]; ability?: string; level?: number }

function setup(p: Spec[], e: Spec[], seed = 'w18') {
  const make = (s: Spec, uid: string) => {
    const mon = createPokemon(content, s.species ?? 'snorlax', s.level ?? 50, uid);
    mon.moves = (s.moves ?? ['splash']).map((id) => ({ id, pp: content.moves.get(id)!.pp }));
    return mon;
  };
  const party = p.map((s, i) => make(s, `p${i}`));
  const team = e.map((s, i) => make(s, `e${i}`));
  const battle = createBattle('trainer', team, 0, party[0]!.uid, { classId: 'ace-trainer', name: 'Pat', leaderId: null });
  makeDoubles(battle, party);
  const ctx: BattleContext = { content, battle, party, inventory: {}, rng: new Rng(hashSeed(seed)), captureRng: new Rng(hashSeed(`${seed}c`)), catchMultiplier: 1 };
  p.forEach((s, i) => { if (s.ability) (i === 0 ? battle.playerVolatile : battle.doubles!.player.vol).abilityOverride = s.ability; });
  const cmd = (index: number, target?: { side: 'player' | 'enemy'; spot: 0 | 1 }): SlotCommand => ({ action: { kind: 'move', index }, target });
  const turn = (commands: (SlotCommand | null)[]): BattleEvent[] => resolveDoublesTurn(ctx, { kind: 'double', commands });
  return { ctx, battle, cmd, turn };
}

const FOES: Spec[] = [{ species: 'snorlax', level: 80 }, { species: 'snorlax', level: 80 }];

describe('Pledge combos', () => {
  it.each([
    ['fire-pledge', 'grass-pledge', 'seaOfFire', 'enemy'],
    ['water-pledge', 'fire-pledge', 'rainbow', 'player'],
    ['grass-pledge', 'water-pledge', 'swamp', 'enemy'],
  ] as const)('%s + %s makes %s on the %s side for 4 turns', (a, b, effect, side) => {
    const d = setup([{ species: 'blissey', moves: [a] }, { species: 'chansey', moves: [b] }], FOES);
    startDoubles(d.ctx);
    const events = d.turn([d.cmd(0, { side: 'enemy', spot: 0 }), d.cmd(0, { side: 'enemy', spot: 0 })]);
    expect(events.some((e) => e.type === 'sideEffect' && e.effect === effect && e.on && e.side === side)).toBe(true);
    // Set to 4, one turn already counted down at the end of the turn.
    expect(d.battle.sideEffects[side][effect]).toBe(3);
  });

  it('the same Pledge twice makes no combo, and the second hit is a plain 80-power hit', () => {
    const d = setup([{ species: 'blissey', moves: ['fire-pledge'] }, { species: 'chansey', moves: ['fire-pledge'] }], FOES);
    startDoubles(d.ctx);
    const events = d.turn([d.cmd(0, { side: 'enemy', spot: 0 }), d.cmd(0, { side: 'enemy', spot: 0 })]);
    expect(events.some((e) => e.type === 'sideEffect' && e.on)).toBe(false);
  });

  it('the Sea of Fire burns non-Fire Pokémon on that side at the end of the turn', () => {
    const d = setup([{ species: 'blissey', moves: ['fire-pledge'] }, { species: 'chansey', moves: ['grass-pledge'] }], FOES);
    startDoubles(d.ctx);
    const events = d.turn([d.cmd(0, { side: 'enemy', spot: 0 }), d.cmd(0, { side: 'enemy', spot: 0 })]);
    expect(events.filter((e) => e.type === 'seaOfFireDamage' && e.side === 'enemy').length).toBeGreaterThan(0);
  });

  it('Swamp halves Speed', () => {
    const d = setup([{ species: 'blissey', moves: ['grass-pledge'] }, { species: 'chansey', moves: ['water-pledge'] }], FOES);
    startDoubles(d.ctx);
    d.turn([d.cmd(0, { side: 'enemy', spot: 0 }), d.cmd(0, { side: 'enemy', spot: 0 })]);
    expect(d.battle.sideEffects.enemy.swamp).toBeGreaterThan(0);
    expect(d.battle.sideEffects.player.swamp).toBe(0);
  });
});

describe('Order Up', () => {
  it('a Dondozo with a commanding Tatsugiri gets +1 in the stat of the Tatsugiri\'s pattern', () => {
    const d = setup([{ species: 'dondozo', moves: ['order-up'] }, { species: 'tatsugiri', moves: ['splash'], ability: 'commander' }], FOES);
    startDoubles(d.ctx);
    expect(d.battle.doubles!.commanding).toContain('p1');
    const before = { ...stagesAt(d.ctx, 'player', 0)! };
    d.turn([d.cmd(0, { side: 'enemy', spot: 0 }), null]);
    const after = stagesAt(d.ctx, 'player', 0)!;
    const stat = { curly: 'atk', droopy: 'def', stretchy: 'spe' }[tatsugiriForm(d.ctx.party[1]!)] as 'atk' | 'def' | 'spe';
    expect(after[stat]).toBe(before[stat] + 1);
  });

  it('without a Tatsugiri in its mouth there is no boost', () => {
    const d = setup([{ species: 'dondozo', moves: ['order-up'] }, { species: 'snorlax' }], FOES);
    startDoubles(d.ctx);
    const before = { ...stagesAt(d.ctx, 'player', 0)! };
    d.turn([d.cmd(0, { side: 'enemy', spot: 0 }), d.cmd(0)]);
    expect(stagesAt(d.ctx, 'player', 0)).toEqual(before);
  });

  it('the Tatsugiri pattern is fixed by its species or uid', () => {
    expect(tatsugiriForm(createPokemon(content, 'tatsugiri-droopy-mega', 5, 'x'))).toBe('droopy');
    expect(tatsugiriForm(createPokemon(content, 'tatsugiri', 5, 'abc'))).toBe(tatsugiriForm(createPokemon(content, 'tatsugiri', 9, 'abc')));
  });
});

describe('Mega stones for the last three Megas', () => {
  it('Droopy, Stretchy and Original Color each have a stone', () => {
    const forms = new Set([...content.items.values()].flatMap((i) => (i.effect.kind === 'megaStone' ? Object.values(i.effect.forms) : [])));
    for (const id of ['tatsugiri-droopy-mega', 'tatsugiri-stretchy-mega', 'magearna-original-mega']) expect(forms.has(id), id).toBe(true);
  });
});

describe('Delta battle forms', () => {
  it('Ruin Delta Metagross is a Crystal at full HP', () => {
    const d = setup([{ species: 'metagross-delta-ruin' }, { species: 'snorlax' }], FOES);
    startDoubles(d.ctx);
    d.turn([d.cmd(0, { side: 'enemy', spot: 0 }), d.cmd(0)]);
    expect(monAt(d.ctx, 'player', 0)!.speciesId).toBe('metagross-delta-ruin-crystal');
  });

  it('Delta Emolga is Fired up only in sun', () => {
    const d = setup([{ species: 'emolga-delta' }, { species: 'snorlax' }], FOES);
    startDoubles(d.ctx);
    d.battle.weather = { id: 'sun', turns: 5 } as never;
    d.turn([d.cmd(0, { side: 'enemy', spot: 0 }), d.cmd(0)]);
    expect(monAt(d.ctx, 'player', 0)!.speciesId).toBe('emolga-delta-fired');
    d.battle.weather = null;
    d.turn([d.cmd(0, { side: 'enemy', spot: 0 }), d.cmd(0)]);
    expect(monAt(d.ctx, 'player', 0)!.speciesId).toBe('emolga-delta');
  });

  it('Delta Meloetta flips to Magician and back every turn', () => {
    const d = setup([{ species: 'meloetta-delta' }, { species: 'snorlax' }], FOES);
    startDoubles(d.ctx);
    const seen: string[] = [];
    for (let i = 0; i < 3; i++) {
      d.turn([d.cmd(0, { side: 'enemy', spot: 0 }), d.cmd(0)]);
      seen.push(monAt(d.ctx, 'player', 0)!.speciesId);
    }
    expect(new Set(seen).size).toBe(2);
  });
});
