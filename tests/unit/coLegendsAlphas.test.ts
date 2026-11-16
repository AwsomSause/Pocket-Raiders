// Catalog Overhaul Pack (legends): the Alphas A2 to A11 (co-legends-1.json), their Door chains, Hush and Three Faces.
import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, startBattle, type BattleContext } from '../../src/core/battle/engine';
import { abilityStatus } from '../../src/core/battle/abilities';
import { chainRooms, PSEUDO_CHAINS } from '../../src/core/dungeon/pseudo';
import { chooseEvent } from '../../src/core/events';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { chooseStarter, createRun } from '../../src/core/run';
import type { PokemonInstance, RunState } from '../../src/core/state';
import file from '../../src/data/events/co-legends-1.json';
import placement from '../../src/data/catalogOverhaul/placement/legends.json';
import { content } from './helpers';

const ALPHAS = ['black-tide', 'frostbound', 'hushed-one', 'orchard-warden', 'quarry-king', 'rooftop-watcher', 'sleeper', 'static-choir', 'unwelcome-guest', 'weeping-lantern'].map((n) => `story-alpha-${n}`);

function at(eventId: string, seed: string, setup?: (run: RunState) => void): RunState {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'al', seed, archetypeId: 'red' }), 0));
  const node = run.stage!.map.nodes[0]!;
  run.stage!.current = node.id;
  run.stage!.visited = [node.id];
  node.sides.push({ id: 'x', kind: 'event', used: false, eventId } as never);
  setup?.(run);
  return run;
}
const offer = (run: RunState) => run.pending.find((p) => p.kind === 'caught') as { mon: PokemonInstance } | undefined;

describe('Alphas A2 to A11', () => {
  it('every Alpha is live in every run (not Story Run only), placed, and only its rooms are rooms', () => {
    for (const id of ALPHAS) {
      const e = content.events.get(id)!;
      expect(e, id).toBeDefined();
      expect(e.requires, id).toEqual([]);
      expect((placement as Record<string, unknown>)[id], id).toBeDefined();
    }
    const rooms = file.events.filter((e) => e.id.startsWith('co-'));
    expect(rooms.every((e) => (e as { room?: boolean; callback?: boolean }).room || (e as { callback?: boolean }).callback)).toBe(true);
  });

  it('the three Door Alphas are chains whose every room is reachable and walks out', () => {
    const doors = PSEUDO_CHAINS.filter((c) => ALPHAS.includes(c.entry));
    expect(doors.map((c) => c.entry).sort()).toEqual(['story-alpha-black-tide', 'story-alpha-frostbound', 'story-alpha-hushed-one']);
    for (const c of doors) {
      const rooms = chainRooms(content, c);
      expect(rooms.length, c.id).toBeGreaterThan(1);
      expect(rooms.some((r) => r.next.length === 0), c.id).toBe(true);
    }
  });

  it('reading the keeper\'s letter calms the Black Tide at once: it joins with the Alpha Mark and Keeper\'s Lamp', () => {
    const run = chooseEvent(content, at('co-tide-lamp-2', 'tide', (r) => { r.story.flags['ev:tide-letters'] = 1; }), 'x', 1).run;
    const mon = offer(run)!.mon;
    expect(mon.speciesId).toBe('gyarados');
    expect(mon.alpha).toBe(true);
    expect(mon.moves.map((m) => m.id)).toContain('keepers-lamp');
    expect(run.story.flags['ev:calmed-alpha']).toBe(1);
  });

  it('without the letters the lamp room only offers the lamp, a calm fight that fills by itself', () => {
    const run = at('co-tide-lamp-2', 'tide2');
    expect(() => chooseEvent(content, run, 'x', 1)).toThrow();
    const lit = chooseEvent(content, run, 'x', 0).run;
    expect(lit.phase).toBe('battle');
    expect(lit.battle!.calm).toMatchObject({ need: 6, bar: 0 });
    expect(lit.battle!.enemyTeam[0]!.alpha).toBe(true);
  });

  it('a fight-only Alpha has no Calm bar, so a ball works; a caught Alpha keeps only the Alpha Mark', () => {
    const run = chooseEvent(content, at('story-alpha-sleeper', 'sleep'), 'x', 0).run;
    expect(run.phase).toBe('battle');
    expect(run.battle!.calm).toBeUndefined();
    const foe = run.battle!.enemyTeam[0]!;
    expect(maxHp(content, foe)).toBeGreaterThan(maxHp(content, { ...foe, alpha: undefined, statBoosts: undefined }) * 1.9);
  });
});

describe('Hush and Three Faces', () => {
  const mon = (species: string, uid: string, ability: string, ...moves: string[]): PokemonInstance => {
    const m = createPokemon(content, species, 30, uid);
    m.fixedAbility = ability;
    m.moves = moves.map((id) => ({ id, pp: content.moves.get(id)!.pp }));
    return m;
  };
  const setup = (player: PokemonInstance, enemy: PokemonInstance) => {
    const battle = createBattle('wild', [enemy], 0, player.uid);
    const ctx: BattleContext = { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed('hush')), captureRng: new Rng(hashSeed('hush-c')), catchMultiplier: 1 };
    return { ctx, battle };
  };

  it('are supported abilities with data', () => {
    expect(abilityStatus('hush')).toBe('supported');
    expect(abilityStatus('three-faces')).toBe('supported');
    expect(content.moves.get('last-winter')!.effects.sureIn).toBe('hail');
  });

  it('Hush silences sound moves on both sides for three turns, then they work again', () => {
    const { ctx } = setup(mon('noctowl', 'p1', 'hush', 'growl', 'peck'), mon('jigglypuff', 'e1', 'cute-charm', 'sing', 'pound'));
    const events = startBattle(ctx);
    expect(events.some((e) => e.type === 'ability' && e.ability === 'hush')).toBe(true);
    const { battle } = ctx;
    resolveTurn(ctx, { kind: 'move', index: 0 }); // Growl, silenced
    expect(battle.enemyStages.atk).toBe(0);
    resolveTurn(ctx, { kind: 'move', index: 1 });
    resolveTurn(ctx, { kind: 'move', index: 1 });
    resolveTurn(ctx, { kind: 'move', index: 0 }); // the fourth turn: the silence is over
    expect(battle.enemyStages.atk).toBe(-1);
  });

  it('Three Faces moves first on its first move only', () => {
    const { ctx } = setup(mon('gastly', 'p1', 'three-faces', 'lick'), mon('jolteon', 'e1', 'volt-absorb', 'tackle'));
    startBattle(ctx);
    const order = (ev: ReturnType<typeof resolveTurn>) => ev.filter((e) => e.type === 'move').map((e) => (e as { side: string }).side);
    expect(order(resolveTurn(ctx, { kind: 'move', index: 0 }))[0]).toBe('player');
    expect(order(resolveTurn(ctx, { kind: 'move', index: 0 }))[0]).toBe('enemy');
  });
});
