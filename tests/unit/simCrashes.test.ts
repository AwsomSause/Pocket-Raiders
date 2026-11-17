// Crashes the 100k sim found: a rival remembering more than 4 moves, and a Ditto that got an empty care record.

import { describe, expect, it } from 'vitest';
import { rememberedMoves } from '../../src/core/story/hooks';
import { RivalSchema } from '../../src/core/story/schema';
import { pokemonInfluence } from '../../src/core/rivals/relations';
import { joinMoments } from '../../src/core/moments/runMoments';
import { calcStats, createPokemon } from '../../src/core/pokemon';
import { chooseStarter, createRun } from '../../src/core/run';
import { content } from './helpers';

const fresh = (seed: string) => chooseStarter(content, createRun(content, { runId: `sc-${seed}`, seed, archetypeId: 'red' }), 0);

describe('rival memory moves', () => {
  it('keeps at most 4 moves per Pokémon, so the save check passes', () => {
    const mon = createPokemon(content, 'mew', 50, 'm1');
    mon.moves = ['psychic', 'ice-beam', 'thunderbolt', 'flamethrower', 'shadow-ball', 'recover'].map((id) => ({ id, pp: 10 }));
    const [moves] = rememberedMoves([mon]);
    expect(moves).toEqual(['psychic', 'ice-beam', 'thunderbolt', 'flamethrower']);
    expect(RivalSchema.shape.memory.shape.lastBattle.shape.moves.safeParse([moves]).success).toBe(true);
  });

  it('still leaves out lent, Hyper and Mega signature moves', () => {
    const mon = createPokemon(content, 'mew', 50, 'm2');
    mon.moves = [{ id: 'psychic', pp: 10 }, { id: 'tackle', pp: 10, lent: true } as never, { id: 'splash', pp: 10 }];
    expect(rememberedMoves([mon])).toEqual([['psychic', 'splash']]);
  });
});

describe('Ditto talent on joining', () => {
  it('gets a full care record, so its stats stay real numbers', () => {
    const run = fresh('simcrash-ditto');
    const ditto = createPokemon(content, 'ditto', 20, 'ditto-care');
    expect(joinMoments(content, run, ditto, () => undefined).length).toBe(1);
    expect(ditto.care?.talent).toBeTruthy();
    for (const v of Object.values(calcStats(content, ditto))) expect(Number.isFinite(v)).toBe(true);
    expect(Number.isFinite(ditto.care?.mood)).toBe(true);
  });
});

describe('rival Pokémon sparring', () => {
  it('does nothing when a rival has no team bonds, instead of crashing on an empty pick', () => {
    const run = fresh('simcrash-spar');
    const mk = (id: string) => ({ id, name: id, bonds: {}, memory: { lastBattle: { team: [] } } }) as never;
    const a = mk('a');
    const b = mk('b');
    expect(pokemonInfluence(run, a, b, '1.8')).toBeNull();
  });
});
