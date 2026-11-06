// Battle/AI batch 1: S156 regional charts, S161 status stacks, S162 reactions, S169 immunity breakers, S170 counter types.
import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { breakImmunity, counterBeats, counterClassOf, counterLine, reactionFor, regionalChart, regionRules, stackableStatus, stackMultiplier } from '../../src/core/battle/typeRules';
import { typeEffectiveness } from '../../src/core/battle/damage';
import { battleContent } from '../../src/core/rules';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import type { PokemonInstance } from '../../src/core/state';
import { content } from './helpers';

const mv = (id: string) => content.moves.get(id)!;

function duel(player: PokemonInstance, enemy: PokemonInstance, seed = 'tr') {
  const battle = createBattle('wild', [enemy], 0, player.uid);
  const ctx: BattleContext = { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed(seed)), captureRng: new Rng(hashSeed(`${seed}c`)), catchMultiplier: 1 };
  return { battle, ctx };
}

describe('S169 immunity breakers', () => {
  it('Thousand Arrows hits a Flying type; an ordinary Ground move does not', () => {
    expect(breakImmunity(content, content.typeChart, 'thousand-arrows', 'ground', ['flying']).broke).toBe('flying');
    expect(breakImmunity(content, content.typeChart, 'earthquake', 'ground', ['flying']).broke).toBeNull();
  });
  it('does nothing when the named type is not immune (boundary)', () => {
    expect(breakImmunity(content, content.typeChart, 'thousand-arrows', 'ground', ['fire']).types).toEqual(['fire']);
  });
  it('lands in battle with a message', () => {
    const p = createPokemon(content, 'zygarde', 60, 'p');
    p.moves = [{ id: 'thousand-arrows', pp: 10 }];
    const e = createPokemon(content, 'pidgeot', 50, 'e');
    e.moves = [{ id: 'splash', pp: 40 }];
    const { battle, ctx } = duel(p, e);
    const before = battle.enemyTeam[0]!.hp;
    const ev = resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(battle.enemyTeam[0]!.hp).toBeLessThan(before);
    expect(ev.some((x) => x.type === 'spectacle' && x.text.includes('immunity'))).toBe(true);
    expect(ev.some((x) => x.type === 'noEffect')).toBe(false);
  });
});

describe('S156 regional type charts', () => {
  it('Kanto: Ghost does not affect Psychic', () => {
    const chart = regionalChart(content.typeChart, regionRules(content, 'kanto'));
    expect(typeEffectiveness(chart, 'ghost', ['psychic'])).toBe(0);
    expect(typeEffectiveness(content.typeChart, 'ghost', ['psychic'])).toBe(2);
  });
  it('a region without rules keeps the same content object', () => {
    expect(battleContent(content, { modifierIds: [] }, 'paldea')).toBe(content);
    expect(battleContent(content, { modifierIds: [] }, null)).toBe(content);
  });
  it('battleContent applies and caches the regional chart', () => {
    const a = battleContent(content, { modifierIds: [] }, 'johto');
    expect(a).toBe(battleContent(content, { modifierIds: [] }, 'johto'));
    expect(typeEffectiveness(a.typeChart, 'dark', ['steel'])).toBe(0.5);
  });
});

describe('S161 status stacking', () => {
  it('only burn and plain poison stack', () => {
    expect(stackableStatus({ id: 'brn' }, 'brn')).toBe(true);
    expect(stackableStatus({ id: 'psn', bad: true }, 'psn')).toBe(false);
    expect(stackableStatus({ id: 'par' }, 'par')).toBe(false);
    expect(stackableStatus(null, 'brn')).toBe(false);
  });
  it('Will-O-Wisp on a burned foe stacks up to the cap, and burns hurt more', () => {
    const p = createPokemon(content, 'gengar', 60, 'p');
    p.moves = [{ id: 'will-o-wisp', pp: 40 }];
    const e = createPokemon(content, 'snorlax', 60, 'e');
    e.moves = [{ id: 'splash', pp: 40 }];
    e.status = { id: 'brn' };
    const { battle, ctx } = duel(p, e, 'stack');
    for (let i = 0; i < 4; i++) resolveTurn(ctx, { kind: 'move', index: 0 });
    const max = content.balance.typeRules.statusStacks.maxStacks;
    expect(battle.enemyTeam[0]!.status?.stacks ?? 1).toBeLessThanOrEqual(max);
    expect(battle.enemyTeam[0]!.status?.stacks ?? 1).toBeGreaterThan(1);
    expect(stackMultiplier(content, 3)).toBeCloseTo(1 + 2 * content.balance.typeRules.statusStacks.perStack);
    expect(stackMultiplier(content, undefined)).toBe(1);
  });
});

describe('S162 elemental reactions', () => {
  it('finds reactions in either order', () => {
    expect(reactionFor(content, 'water', 'electric')?.name).toBe('Electro-charged');
    expect(reactionFor(content, 'electric', 'water')?.name).toBe('Electro-charged');
    expect(reactionFor(content, 'water', 'water')).toBeNull();
    expect(reactionFor(content, undefined, 'fire')).toBeNull();
  });
  it('a Water hit then an Electric hit sets off Electro-charged', () => {
    const p = createPokemon(content, 'lanturn', 60, 'p');
    p.moves = [{ id: 'water-gun', pp: 25 }, { id: 'thunder-shock', pp: 30 }];
    const e = createPokemon(content, 'snorlax', 70, 'e');
    e.moves = [{ id: 'splash', pp: 40 }];
    const { battle, ctx } = duel(p, e, 'react');
    resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(battle.enemyVolatile.element).toBe('water');
    const ev = resolveTurn(ctx, { kind: 'move', index: 1 });
    expect(ev.some((x) => x.type === 'spectacle' && x.text === 'Reaction: Electro-charged!')).toBe(true);
    expect(battle.enemyVolatile.element).toBeUndefined();
  });
});

describe('S170 counter types', () => {
  it('classes moves and the cycle', () => {
    expect(counterClassOf(mv('hyper-voice'))).toBe('song');
    expect(counterClassOf(mv('dark-pulse'))).toBe('aura');
    expect(counterClassOf(mv('wrap'))).toBe('trap');
    expect(counterClassOf(mv('stealth-rock'))).toBe('trap');
    expect(counterClassOf(mv('tackle'))).toBeNull();
    expect(counterBeats('song', 'aura')).toBe(true);
    expect(counterBeats('aura', 'song')).toBe(false);
    expect(counterBeats(null, 'song')).toBe(false);
    expect(counterLine(mv('hyper-voice'))).toBe('Song: beats Aura, loses to Trap');
  });
  it('a Song hits harder against a foe that last used an Aura move', () => {
    const run = (foeMove: string) => {
      const p = createPokemon(content, 'exploud', 50, 'p');
      p.moves = [{ id: 'hyper-voice', pp: 10 }];
      const e = createPokemon(content, 'snorlax', 80, 'e');
      e.moves = [{ id: foeMove, pp: 20 }];
      const { battle, ctx } = duel(p, e, 'counter');
      battle.enemyVolatile.lastMove = foeMove;
      const before = battle.enemyTeam[0]!.hp;
      const ev = resolveTurn(ctx, { kind: 'move', index: 0 });
      return { lost: before - battle.enemyTeam[0]!.hp, ev };
    };
    const vsAura = run('dark-pulse');
    const vsPlain = run('splash');
    expect(vsAura.ev.some((x) => x.type === 'spectacle' && x.text.startsWith('Song beats Aura'))).toBe(true);
    expect(vsPlain.ev.some((x) => x.type === 'spectacle' && x.text.startsWith('Song beats'))).toBe(false);
  });
});
