// Item sprites P5: the held-item hooks added for the library pictures (Weakness Policy ... Terrain Extender),
// Ability Shield, and the Ability Capsule and Patch. One battle test each.

import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, type BattleContext, type BattleEvent } from '../../src/core/battle/engine';
import { applyCatalog, catalogTargetProblem, getCatalogEntry } from '../../src/core/catalog';
import { abilityOf, createPokemon } from '../../src/core/pokemon';
import { chooseStarter, createRun } from '../../src/core/run';
import { hashSeed, Rng } from '../../src/core/rng';
import type { PokemonInstance } from '../../src/core/state';
import { content } from './helpers';

const mon = (species: string, level: number, uid: string, moves: string[], held?: Record<string, number>) => {
  const m = createPokemon(content, species, level, uid);
  m.moves = moves.map((id) => ({ id, pp: content.moves.get(id)!.pp }));
  if (held) m.held = held;
  return m;
};

function setup(player: PokemonInstance, enemy: PokemonInstance, seed = 'p5', reserve: PokemonInstance[] = []) {
  const party = [player, ...reserve];
  const battle = createBattle('wild', [enemy], 0, player.uid, null);
  const ctx: BattleContext = { content, battle, party, inventory: {}, rng: new Rng(hashSeed(seed)), captureRng: new Rng(hashSeed(`${seed}-c`)), catchMultiplier: 1 };
  return { battle, ctx };
}
const move = (index = 0) => ({ kind: 'move', index }) as const;
const damageTo = (events: BattleEvent[], side: 'player' | 'enemy') => events.filter((e) => e.type === 'damage' && e.side === side).map((e) => (e as { amount: number }).amount);

describe('P5 held-item hooks', () => {
  it('Weakness Policy: a super-effective hit gives +2 Attack and +2 Sp. Atk, once', () => {
    const { battle, ctx } = setup(mon('bulbasaur', 80, 'p', ['splash'], { 'weakness-policy': 1 }), mon('charmander', 40, 'e', ['ember']));
    resolveTurn(ctx, move());
    expect([battle.playerStages.atk, battle.playerStages.spa]).toEqual([2, 2]);
    resolveTurn(ctx, move());
    expect([battle.playerStages.atk, battle.playerStages.spa]).toEqual([2, 2]);
  });

  it('Blunder Policy: a missed move gives +2 Speed', () => {
    let missed = 0;
    for (let i = 0; i < 40; i++) {
      const { battle, ctx } = setup(mon('pikachu', 30, 'p', ['thunder'], { 'blunder-policy': 1 }), mon('snorlax', 30, 'e', ['splash']), `miss${i}`);
      const events = resolveTurn(ctx, move());
      const miss = events.some((e) => e.type === 'miss' && e.side === 'player');
      expect(battle.playerStages.spe, `seed ${i}`).toBe(miss ? 2 : 0);
      if (miss) missed++;
    }
    expect(missed).toBeGreaterThan(0);
  });

  it('Throat Spray: a sound move gives +1 Sp. Atk, a plain move does not', () => {
    const a = setup(mon('exploud', 40, 'p', ['hyper-voice'], { 'throat-spray': 1 }), mon('snorlax', 40, 'e', ['splash']));
    resolveTurn(a.ctx, move());
    expect(a.battle.playerStages.spa).toBe(1);
    const b = setup(mon('exploud', 40, 'p', ['tackle'], { 'throat-spray': 1 }), mon('snorlax', 40, 'e', ['splash']));
    resolveTurn(b.ctx, move());
    expect(b.battle.playerStages.spa).toBe(0);
  });

  it('Eject Pack: a stat drop from the foe uses the pack up', () => {
    const { ctx } = setup(mon('pikachu', 40, 'p', ['tackle'], { 'eject-pack': 1 }), mon('snorlax', 20, 'e', ['growl']), 'pack', [mon('eevee', 20, 'r', ['tackle'])]);
    const events = resolveTurn(ctx, move());
    expect(events.some((e) => e.type === 'held' && e.itemId === 'eject-pack')).toBe(true);
  });

  it('Room Service: -1 Speed while Trick Room is up', () => {
    const { battle, ctx } = setup(mon('pikachu', 40, 'p', ['trick-room'], { 'room-service': 1 }), mon('snorlax', 40, 'e', ['splash']));
    resolveTurn(ctx, move());
    expect(battle.field.trickRoom).toBeGreaterThan(0);
    expect(battle.playerStages.spe).toBe(-1);
  });

  it('Booster Energy: a Paradox holder comes in with +1 in its best stat; others do not', () => {
    const a = setup(mon('iron-treads', 50, 'p', ['splash'], { 'booster-energy': 1 }), mon('snorlax', 40, 'e', ['splash']));
    resolveTurn(a.ctx, move());
    expect(Object.values(a.battle.playerStages).filter((v) => v === 1)).toHaveLength(1);
    const b = setup(mon('pikachu', 50, 'p', ['splash'], { 'booster-energy': 1 }), mon('snorlax', 40, 'e', ['splash']));
    resolveTurn(b.ctx, move());
    expect(Object.values(b.battle.playerStages).filter((v) => v !== 0)).toHaveLength(0);
  });

  it('Mirror Herb: copies the foe\'s boosts', () => {
    const { battle, ctx } = setup(mon('pikachu', 40, 'p', ['tackle'], { 'mirror-herb': 1 }), mon('snorlax', 40, 'e', ['swords-dance']));
    resolveTurn(ctx, move());
    expect(battle.enemyStages.atk).toBe(2);
    expect(battle.playerStages.atk).toBe(2);
  });

  it('Covert Cloak: added effects never land; Clear Amulet: stats cannot be lowered', () => {
    let burnedWithout = 0;
    for (let i = 0; i < 60; i++) {
      const bare = setup(mon('snorlax', 90, 'p', ['splash']), mon('charizard', 40, 'e', ['flamethrower']), `cc${i}`);
      resolveTurn(bare.ctx, move());
      if (bare.ctx.party[0]!.status?.id === 'brn') burnedWithout++;
      const cloaked = setup(mon('snorlax', 90, 'p', ['splash'], { 'covert-cloak': 1 }), mon('charizard', 40, 'e', ['flamethrower']), `cc${i}`);
      resolveTurn(cloaked.ctx, move());
      expect(cloaked.ctx.party[0]!.status?.id).not.toBe('brn');
    }
    expect(burnedWithout).toBeGreaterThan(0);
    const amulet = setup(mon('pikachu', 40, 'p', ['splash'], { 'clear-amulet': 1 }), mon('snorlax', 20, 'e', ['growl']));
    resolveTurn(amulet.ctx, move());
    expect(amulet.battle.playerStages.atk).toBe(0);
    const bare = setup(mon('pikachu', 40, 'p', ['splash']), mon('snorlax', 20, 'e', ['growl']));
    resolveTurn(bare.ctx, move());
    expect(bare.battle.playerStages.atk).toBe(-1);
  });

  it('Loaded Dice: multi-hit moves always hit 4 or more times', () => {
    let fewer = 0;
    for (let i = 0; i < 30; i++) {
      const bare = damageTo(resolveTurn(setup(mon('meowth', 50, 'p', ['fury-swipes']), mon('snorlax', 90, 'e', ['splash']), `ld${i}`).ctx, move()), 'enemy').length;
      const loaded = damageTo(resolveTurn(setup(mon('meowth', 50, 'p', ['fury-swipes'], { 'loaded-dice': 1 }), mon('snorlax', 90, 'e', ['splash']), `ld${i}`).ctx, move()), 'enemy').length;
      if (bare > 0 && bare < 4) fewer++;
      if (loaded > 0) expect(loaded).toBeGreaterThanOrEqual(4);
    }
    expect(fewer).toBeGreaterThan(0);
  });

  it('Punching Glove: punches hit harder, other moves do not', () => {
    const dmg = (item: Record<string, number> | undefined, m: string) => damageTo(resolveTurn(setup(mon('machop', 40, 'p', [m], item), mon('snorlax', 90, 'e', ['splash']), 'pg').ctx, move()), 'enemy')[0]!;
    expect(dmg({ 'punching-glove': 1 }, 'mach-punch') / dmg(undefined, 'mach-punch')).toBeGreaterThan(1.05);
    expect(dmg({ 'punching-glove': 1 }, 'tackle')).toBe(dmg(undefined, 'tackle'));
  });

  it('Protective Pads: no contact, so Rocky Helmet does nothing', () => {
    const run = (item?: Record<string, number>) => {
      const p = mon('machop', 40, 'p', ['tackle'], item);
      resolveTurn(setup(p, mon('snorlax', 90, 'e', ['splash'], { 'rocky-helmet': 1 }), 'pp').ctx, move());
      return p.hp;
    };
    expect(run()).toBeLessThan(createPokemon(content, 'machop', 40, 'x').hp);
    expect(run({ 'protective-pads': 1 })).toBe(createPokemon(content, 'machop', 40, 'x').hp);
  });

  it('Heavy-Duty Boots: Stealth Rock does not hurt the holder coming in', () => {
    const run = (item?: Record<string, number>) => {
      const lead = mon('pikachu', 40, 'p', ['tackle']);
      const reserve = mon('charizard', 40, 'r', ['tackle'], item);
      const { battle, ctx } = setup(lead, mon('snorlax', 40, 'e', ['splash']), 'hz', [reserve]);
      battle.sideEffects.player.stealthRock = true;
      resolveTurn(ctx, { kind: 'switch', partyIndex: 1 });
      return reserve.hp - createPokemon(content, 'charizard', 40, 'x').hp;
    };
    expect(run()).toBeLessThan(0);
    expect(run({ 'heavy-duty-boots': 1 })).toBe(0);
  });

  it('Utility Umbrella: sun does not boost the holder\'s Fire move', () => {
    const dmg = (item: Record<string, number> | undefined, sun: boolean) => {
      const { battle, ctx } = setup(mon('charmander', 40, 'p', ['ember'], item), mon('snorlax', 90, 'e', ['splash']), 'um');
      battle.weather = sun ? { id: 'sun', turns: 5 } : null;
      return damageTo(resolveTurn(ctx, move()), 'enemy')[0]!;
    };
    expect(dmg(undefined, true)).toBeGreaterThan(dmg(undefined, false));
    expect(dmg({ 'utility-umbrella': 1 }, true)).toBe(dmg({ 'utility-umbrella': 1 }, false));
  });

  it('Terrain Extender: terrain lasts 3 turns longer', () => {
    const turns = (item?: Record<string, number>) => {
      const { battle, ctx } = setup(mon('pikachu', 40, 'p', ['electric-terrain'], item), mon('snorlax', 40, 'e', ['splash']), 'te');
      resolveTurn(ctx, move());
      return battle.terrain!.turns;
    };
    expect(turns({ 'terrain-extender': 1 }) - turns()).toBe(3);
  });

  it('Ability Shield: Skill Swap fails against the holder', () => {
    const run = (item?: Record<string, number>) => {
      const { battle, ctx } = setup(mon('pikachu', 40, 'p', ['splash'], item), mon('snorlax', 40, 'e', ['skill-swap']), 'as');
      resolveTurn(ctx, move());
      return battle.playerVolatile.abilityOverride;
    };
    expect(run()).toBeTruthy();
    expect(run({ 'ability-shield': 1 })).toBeFalsy();
  });
});

describe('Ability Capsule and Patch', () => {
  it('Capsule swaps between two normal abilities; Patch gives the hidden one', () => {
    const species = [...content.species.values()].find((s) => s.abilities.normal.length >= 2 && s.abilities.hidden)!;
    const m = createPokemon(content, species.id, 20, 'a');
    m.abilitySlot = 0;
    const run = chooseStarter(content, createRun(content, { runId: 'r', seed: 'ab', archetypeId: 'red' }), 0);
    const first = abilityOf(content, m);
    applyCatalog(content, run, getCatalogEntry(content, 'ability-capsule'), m, { moneyMultiplier: 1, rng: new Rng(1) });
    expect(abilityOf(content, m)).toBe(species.abilities.normal[1]);
    expect(abilityOf(content, m)).not.toBe(first);
    expect(catalogTargetProblem(content, run, getCatalogEntry(content, 'ability-patch'), m)).toBeNull();
    applyCatalog(content, run, getCatalogEntry(content, 'ability-patch'), m, { moneyMultiplier: 1, rng: new Rng(1) });
    expect(abilityOf(content, m)).toBe(species.abilities.hidden);
    expect(catalogTargetProblem(content, run, getCatalogEntry(content, 'ability-patch'), m)).toMatch(/already/);
    expect(catalogTargetProblem(content, run, getCatalogEntry(content, 'ability-capsule'), m)).toMatch(/hidden/);
  });
});
