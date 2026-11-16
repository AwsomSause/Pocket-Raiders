import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, switchProblem, type BattleContext, type BattleEvent, type Combatant } from '../../src/core/battle/engine';
import { revivalLines } from '../../src/core/battle/pokemonMoments';
import { endRevivalStatus, revivalFee, startRevivalStatus } from '../../src/core/battle/revivalStatus';
import { POKEMON_MOMENTS, REVIVAL_STATUSES, pokemonMoment, type MomentHooks } from '../../src/core/moments/pokemonMoments';
import { calcStats, createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import type { PokemonInstance } from '../../src/core/state';
import { content } from './helpers';

// Catalog Overhaul row 17, Pokémon Moments batch 3: the last-stand revivals PA17 to PA31 (POKEMON_MOMENTS.md Part 2B) and their
// fifteen revival statuses (core/battle/revivalStatus.ts).

const PA = ['pa17-the-grave-refuses', 'pa18-the-old-blood', 'pa19-nature-reclaims', 'pa20-the-pack-doesnt-leave-its-own', 'pa21-the-contract', 'pa22-critical-mass', 'pa23-ascension', 'pa24-the-oath', 'pa25-hive-mind', 'pa26-the-deep', 'pa27-thrown-away', 'pa28-primal-awakening', 'pa29-supernova', 'pa30-absolute-zero', 'pa31-eclipse'];

const mon = (sp: string, level: number, uid: string, moves: string[]): PokemonInstance => {
  const m = createPokemon(content, sp, level, uid);
  m.moves = moves.map((id) => ({ id, pp: content.moves.get(id)!.pp }));
  m.hp = calcStats(content, m).hp;
  return m;
};
const hooks = (seed: string, flags: MomentHooks['flags'] = {}, wouldEnd = false): MomentHooks => ({ seed, flags, cinematic: () => true, noteCinematic: () => undefined, runWouldEnd: () => wouldEnd });
function fight(seed: string, party: PokemonInstance[], foes: PokemonInstance[], flags: MomentHooks['flags'] = {}, wouldEnd = false) {
  const battle = createBattle('wild', foes, 0, party[0]!.uid);
  const ctx: BattleContext = { content, battle, party, inventory: {}, rng: new Rng(hashSeed(seed)), captureRng: new Rng(hashSeed(`${seed}c`)), catchMultiplier: 1, moments: hooks(seed, flags, wouldEnd) };
  return { ctx, battle };
}
/** Puts the player's lead into a revival status directly (the revival itself is tested on its own below). */
function stand(seed: string, sp: string, status: string, moves: string[], foe: PokemonInstance, fee?: number) {
  const f = fight(seed, [mon(sp, 50, 'me', moves)], [foe]);
  const c: Combatant = { side: 'player', mon: f.ctx.party[0]!, stages: f.battle.playerStages, vol: f.battle.playerVolatile, flinched: false, protected: false };
  const events: BattleEvent[] = [];
  // A real revival happens at the end of the turn before; the status starts as if it had.
  f.battle.turn -= 1;
  startRevivalStatus(f.ctx, c, status, events, fee);
  f.battle.turn += 1;
  return { ...f, me: f.ctx.party[0]!, events };
}
const turn = (ctx: BattleContext, index = 0): BattleEvent[] => resolveTurn(ctx, { kind: 'move', index });
const said = (events: BattleEvent[], text: string) => events.some((e) => e.type === 'raid' && e.text.includes(text));
const played = (events: BattleEvent[], id: string) => events.some((e) => e.type === 'pmoment' && e.id === id);

describe('pack revivals PA17 to PA31: data', () => {
  it('fifteen run-end revivals, each into a status that exists, sharing PA1\'s chance rules, with their own sound, voice and theme', () => {
    for (const id of PA) {
      const m = pokemonMoment(id)!;
      expect(m, id).toBeDefined();
      expect(m.trigger).toBe('runEnd');
      expect(m.chance).toBe(0.1);
      expect(m.chanceBond).toEqual({ above: 3, perStep: 0.05, max: 0.3 });
      expect(m.chancePlus?.plus).toBe(0.1);
      expect(m.chancePlus?.exact).toBe(true);
      expect(m.chancePlus?.species.length).toBe(3);
      expect(REVIVAL_STATUSES[m.effect!.revivalStatus!], id).toBeDefined();
      expect(m.scene?.after).toBe(m.effect!.revivalStatus);
      expect(m.scene?.sound).toMatch(/^pa\d\d_/);
      expect(m.scene?.theme).toMatch(/^pa\d\d_theme$/);
      expect(m.scene?.lines.length).toBe(4);
    }
    expect(Object.keys(REVIVAL_STATUSES)).toHaveLength(15);
    expect(pokemonMoment('pa20-the-pack-doesnt-leave-its-own')!.scene!.voice).toBeUndefined(); // no voice speaks
  });

  it('every status says its cost in its line', () => {
    for (const s of Object.values(REVIVAL_STATUSES)) expect(s.chip, s.name).toMatch(/Cost:/);
  });
});

describe('pack revivals PA17 to PA31: the revival', () => {
  it('PA17 The Grave Refuses: Dusknoir comes back at full HP (x1.5) as a Revenant, and the cost is stated', () => {
    let done = false;
    for (let i = 0; i < 200 && !done; i++) {
      const dusk = mon('dusknoir', 40, 'dk', ['splash']);
      dusk.hp = 1;
      const { ctx } = fight(`pa17-${i}`, [dusk], [mon('tyranitar', 100, 'm', ['crunch'])], {}, true);
      const events = turn(ctx);
      expect(ctx.moments!.flags['pm:runend-used']).toBe(1);
      if (!played(events, 'pa17-the-grave-refuses')) continue;
      done = true;
      expect(dusk.revivalStatus).toBe('revenant');
      expect(dusk.hp).toBe(calcStats(content, dusk).hp);
      expect(calcStats(content, dusk).hp).toBe(Math.floor(calcStats(content, { ...dusk, revivalStatus: undefined }).hp * 1.5));
      expect(said(events, 'Cost:')).toBe(true);
      const ev = events.find((e) => e.type === 'pmoment' && e.id === 'pa17-the-grave-refuses') as Extract<BattleEvent, { type: 'pmoment' }>;
      expect(ev.lines?.at(-1)).toContain('Dusknoir stands up slowly');
    }
    expect(done).toBe(true);
  });

  it('a Pokémon in several archetypes gets one roll, the higher chance (Gengar: PA21 as a signature, not PA17 or PA31)', () => {
    const g = mon('gengar', 40, 'g', ['splash']);
    g.hp = 1;
    const { ctx } = fight('gengar', [g], [mon('tyranitar', 100, 'm', ['crunch'])], {}, true);
    turn(ctx);
    expect(ctx.moments!.flags['pm:pa21-the-contract']).toBe(1);
    expect(ctx.moments!.flags['pm:pa17-the-grave-refuses']).toBeUndefined();
    expect(ctx.moments!.flags['pm:pa31-eclipse']).toBeUndefined();
  });

  it('remembered lines: PA18 after The Slow Road says "And I do not choose this."; PA24 for Sirfetch\'d adds the bent leek', () => {
    const d = mon('dragonite', 60, 'dr', ['splash']);
    const { ctx } = fight('pa18', [d], [mon('rattata', 5, 'r', ['splash'])], { 'pm:pa6-the-slow-road@dr': 1 });
    expect(revivalLines(ctx, pokemonMoment('pa18-the-old-blood')!, d)[3]).toBe('"And I do not choose this."');
    const plain = fight('pa18b', [d], [mon('rattata', 5, 'r', ['splash'])]);
    expect(revivalLines(plain.ctx, pokemonMoment('pa18-the-old-blood')!, d)[3]).toBe('"We end when we choose."');
    const s = mon('sirfetchd', 60, 'sf', ['splash']);
    expect(revivalLines(plain.ctx, pokemonMoment('pa24-the-oath')!, s)).toContain('The leek is bent. It doesn\'t care.');
  });

  it('PA1 keeps its own scene (no last-stand sound), and its data is unchanged in shape', () => {
    const pa1 = POKEMON_MOMENTS.find((m) => m.id === 'failure-not-tolerated')!;
    expect(pa1.effect?.overcharged).toBe(true);
    expect(pa1.scene?.sound).toBeUndefined();
  });
});

describe('pack revivals PA17 to PA31: the statuses in battle', () => {
  const foe = () => mon('snorlax', 50, 'f', ['splash']);

  it('Revenant: loses 1/10 max HP each turn, can\'t be poisoned', () => {
    const { ctx, me } = stand('rev', 'dusknoir', 'revenant', ['splash'], mon('grimer', 50, 'f', ['poison-gas']));
    const max = calcStats(content, me).hp;
    turn(ctx);
    expect(me.hp).toBe(max - Math.floor(max / 10));
    expect(me.status).toBeNull();
  });

  it('Overgrown: can\'t switch out, restores 1/8 HP each turn', () => {
    const { ctx, me, battle } = stand('ovg', 'torterra', 'overgrown', ['splash'], foe());
    ctx.party.push(mon('pidgey', 10, 'p', ['tackle']));
    expect(switchProblem(ctx, 1)).toContain("can't be switched out");
    me.hp = 10;
    turn(ctx);
    expect(me.hp).toBe(10 + Math.floor(calcStats(content, me).hp * 0.125));
    expect(battle.outcome).toBeNull();
  });

  it('Critical Mass: the countdown runs from 5; at 0 it uses Explosion and faints, and downing the last foe wins', () => {
    const weak = mon('caterpie', 5, 'f', ['string-shot']);
    const { ctx, me, battle } = stand('cm', 'electrode', 'critical-mass', ['splash'], weak);
    const all: BattleEvent[] = [];
    for (let i = 0; i < 4; i++) all.push(...turn(ctx));
    expect(said(all, "core: 1.")).toBe(true);
    expect(me.hp).toBeGreaterThan(0);
    const last = turn(ctx);
    expect(said(last, 'It uses Explosion')).toBe(true);
    expect(me.hp).toBe(0);
    expect(battle.outcome).toBe('win');
  });

  it('Oathbound: holds at 1 HP for three turns, then falls if the battle is not won', () => {
    const { ctx, me } = stand('oath', 'kingambit', 'oathbound', ['splash'], mon('machamp', 100, 'f', ['close-combat']));
    turn(ctx);
    expect(me.hp).toBe(1);
    turn(ctx);
    expect(me.hp).toBe(1);
    const third = turn(ctx);
    expect(said(third, 'The oath is spent')).toBe(true);
    expect(me.hp).toBe(0);
  });

  it('Swarm: each hit takes a body, not HP; the third hit ends it; it can\'t Protect', () => {
    const { ctx, me, battle } = stand('swarm', 'vespiquen', 'swarm', ['protect', 'tackle'], mon('machop', 30, 'f', ['karate-chop']));
    const max = me.hp;
    const first = turn(ctx);
    expect(said(first, "can't Protect")).toBe(true);
    expect(me.hp).toBe(max);
    expect(battle.storyEffects).toContain('pm-rev-bodies:me:2');
    turn(ctx, 1);
    turn(ctx, 1);
    expect(me.hp).toBe(0);
  });

  it('Transcendent: Ground and contact moves don\'t touch it; it can\'t use physical moves', () => {
    const { ctx, me } = stand('tr', 'alakazam', 'transcendent', ['tackle'], mon('diglett', 60, 'f', ['earthquake']));
    const events = turn(ctx);
    expect(said(events, "can't use physical moves")).toBe(true);
    expect(me.hp).toBe(calcStats(content, me).hp);
  });

  it('Eclipsed: night for the battle, evasion +1 and no higher, accuracy -1', () => {
    const { ctx, battle } = stand('ecl', 'umbreon', 'eclipsed', ['double-team'], foe());
    expect(battle.playerStages.eva).toBe(1);
    expect(battle.playerStages.acc).toBe(-1);
    turn(ctx);
    expect(battle.playerStages.eva).toBe(1);
    expect(ctx.period).toBe('night');
  });

  it('Absolute Zero: hail for 5 turns; after its first move it acts only every other turn', () => {
    const { ctx, battle } = stand('az', 'froslass', 'absolute-zero', ['tackle'], foe());
    expect(battle.weather).toEqual({ id: 'hail', turns: 5 });
    turn(ctx);
    expect(said(turn(ctx), 'frozen still')).toBe(true);
    expect(said(turn(ctx), 'frozen still')).toBe(false);
  });

  it('Supernova: sun, and the whole field burns 1/16 a turn, itself included', () => {
    const f = foe();
    const { ctx, me, battle } = stand('sn', 'volcarona', 'supernova', ['splash'], f);
    expect(battle.weather?.id).toBe('sun');
    const before = f.hp;
    turn(ctx);
    expect(f.hp).toBe(before - Math.floor(calcStats(content, f).hp / 16));
    expect(me.hp).toBe(calcStats(content, me).hp - Math.floor(calcStats(content, me).hp / 16));
  });

  it('Wrathborn: it throws its highest-damage move whatever you pick', () => {
    const { ctx } = stand('wr', 'dragonite', 'wrathborn', ['splash', 'outrage'], foe());
    expect(said(turn(ctx, 0), "won't hold back")).toBe(true);
  });

  it('Collected: the Collector takes 10%, or 5% for an honest dealer', () => {
    expect(revivalFee(stand('col', 'gengar', 'collected', ['splash'], foe()).battle)).toBe(10);
    const honest = stand('col5', 'gengar', 'collected', ['splash'], foe(), 5);
    expect(revivalFee(honest.battle)).toBe(5);
    expect(said(honest.events, '5%')).toBe(true);
  });

  it('the status ends with the battle: max HP back to normal, keeping its share', () => {
    const { ctx, me } = stand('end', 'dusknoir', 'revenant', ['splash'], foe());
    me.hp = Math.floor(calcStats(content, me).hp / 2);
    endRevivalStatus(ctx, me);
    expect(me.revivalStatus).toBeUndefined();
    expect(Math.abs(me.hp - calcStats(content, me).hp / 2)).toBeLessThanOrEqual(1);
  });
});
