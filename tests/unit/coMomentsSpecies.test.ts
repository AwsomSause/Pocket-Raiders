import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, type BattleContext, type BattleEvent } from '../../src/core/battle/engine';
import { KOS_FLAG, ONE_HP_FLAG, momentAccAll, momentCounterMult } from '../../src/core/battle/pokemonMoments';
import { pokemonMoment, type MomentHooks } from '../../src/core/moments/pokemonMoments';
import { evolveMoments, restMoments } from '../../src/core/moments/runMoments';
import { calcStats, createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { chooseStarter, createRun } from '../../src/core/run';
import type { PokemonInstance } from '../../src/core/state';
import { content } from './helpers';

// Catalog Overhaul row 17, Pokémon Moments batch 5: species moments PS1 to PS45 and individual moments PI1 to PI14 (POKEMON_MOMENTS.md Parts 4 and 5).

const mon = (sp: string, level: number, uid: string, moves: string[] = ['splash']): PokemonInstance => {
  const m = createPokemon(content, sp, level, uid);
  m.moves = moves.map((id) => ({ id, pp: content.moves.get(id)!.pp }));
  m.hp = calcStats(content, m).hp;
  return m;
};
function fight(seed: string, party: PokemonInstance[], foes: PokemonInstance[], opts: { flags?: MomentHooks['flags']; kind?: 'wild' | 'trainer'; finalBoss?: boolean } = {}) {
  const battle = createBattle(opts.kind ?? 'wild', foes, 0, party[0]!.uid);
  const moments: MomentHooks = { seed, flags: opts.flags ?? {}, cinematic: () => false, noteCinematic: () => undefined, runWouldEnd: () => false, finalBoss: opts.finalBoss };
  const ctx: BattleContext = { content, battle, party, inventory: {}, rng: new Rng(hashSeed(seed)), captureRng: new Rng(hashSeed(`${seed}c`)), catchMultiplier: 1, moments };
  return { ctx, battle, flags: moments.flags };
}
const turn = (ctx: BattleContext, index = 0): BattleEvent[] => resolveTurn(ctx, { kind: 'move', index });
const played = (events: BattleEvent[], id: string) => events.some((e) => e.type === 'pmoment' && e.id === id);
const said = (events: BattleEvent[], text: string) => events.some((e) => e.type === 'raid' && e.text.includes(text));
const runWith = (id: string, party: PokemonInstance[]) => {
  let run = createRun(content, { runId: id, seed: id, archetypeId: 'red' });
  run = chooseStarter(content, run, 0);
  run.party = party;
  run.stage!.current = run.stage!.map.nodes[1]!.id;
  return run;
};

describe('species moments PS1 to PS45: data', () => {
  it('every built species and individual moment is written and has a status', () => {
    for (const id of ['ps1-the-magikarp-that-could', 'ps2-the-empty-shell', 'ps3-copy-of-a-copy', 'ps5-aura-sight', 'ps6-i-will-protect-my-trainer-gardevoir', 'ps6-i-will-protect-my-trainer-gallade', 'ps8-just-five-more-minutes', 'ps9-just-standing-there', 'ps10-one-hundred-and-eight', 'ps11-dont-look', 'ps12-wrong-face', 'ps13-wait-for-it', 'ps15-lucky-star', 'ps16-nurses-orders', 'ps17-your-shadow', 'ps18-the-ferryman', 'ps20-leader-of-the-pack', 'ps22-one-in-a-hundred', 'ps27-self-portrait', 'ps28-the-leek', 'ps32-the-speed', 'ps33-corrupted', 'ps38-the-school', 'ps40-asleep-the-whole-time', 'ps44-just-a-bidoof', 'ps45-presents', 'pi1-the-first-one', 'pi3-one-hp', 'pi5-most-knockouts']) {
      expect(pokemonMoment(id), id).toBeDefined();
    }
    for (const id of ['ps45-presents']) for (const item of pokemonMoment(id)!.effect!.present!) expect(content.items.has(item) || content.catalog.has(item), item).toBe(true);
  });
});

describe('species moments: battle', () => {
  it('PS1 Magikarp: against a Gym Leader it promises to evolve if it lasts three turns', () => {
    const { ctx, battle } = fight('ps1', [mon('magikarp', 15, 'k')], [mon('onix', 15, 'o', ['harden'])], { kind: 'trainer' });
    battle.trainer = { classId: 'gym-leader' } as typeof battle.trainer;
    expect(played(turn(ctx), 'ps1-the-magikarp-that-could')).toBe(true);
    expect(battle.storyEffects.some((t) => t.startsWith('pm-evoafter:k:gyarados:4'))).toBe(true);
    const wild = fight('ps1-wild', [mon('magikarp', 15, 'k')], [mon('onix', 15, 'o', ['harden'])]);
    expect(played(turn(wild.ctx), 'ps1-the-magikarp-that-could')).toBe(false);
  });

  it('PS3 Copy of a Copy: two Ditto both lose their first turn', () => {
    const { ctx } = fight('ps3', [mon('ditto', 30, 'd', ['tackle'])], [mon('ditto', 30, 'e', ['tackle'])]);
    const events = turn(ctx);
    expect(played(events, 'ps3-copy-of-a-copy')).toBe(true);
    expect(events.filter((e) => e.type === 'blocked').length).toBe(2);
    expect(events.some((e) => e.type === 'damage')).toBe(false);
  });

  it('PS5 Aura Sight names the next trainer Pokémon; a wild battle has no one next', () => {
    const { ctx } = fight('ps5', [mon('lucario', 50, 'l')], [mon('rattata', 20, 'a', ['harden']), mon('pidgey', 20, 'b')], { kind: 'trainer' });
    expect(said(turn(ctx), 'Pidgey comes next')).toBe(true);
    const wild = fight('ps5-wild', [mon('lucario', 50, 'l')], [mon('rattata', 20, 'a', ['harden'])]);
    expect(played(turn(wild.ctx), 'ps5-aura-sight')).toBe(false);
  });

  it('PS9 and PS15 helpers: the Counter multiplier and Lucky Star accuracy read their tags', () => {
    const { ctx, battle } = fight('ps9', [mon('wobbuffet', 40, 'w')], [mon('rattata', 5, 'f')]);
    battle.storyEffects.push('pm-counterx:w:3', 'pm-accall:10');
    expect(momentCounterMult(ctx, { side: 'player', mon: ctx.party[0]! })).toBe(3);
    expect(momentCounterMult(ctx, { side: 'enemy', mon: ctx.party[0]! })).toBe(1);
    expect(momentAccAll(ctx)).toBe(10);
  });

  it('PS17 Your Shadow plays only at night', () => {
    let seen = false;
    for (let i = 0; i < 30 && !seen; i++) {
      const night = fight(`ps17-${i}`, [mon('gengar', 40, 'g')], [mon('rattata', 5, 'f', ['harden'])]);
      night.ctx.period = 'night';
      if (played(turn(night.ctx), 'ps17-your-shadow')) { seen = true; expect(night.battle.enemyStages.acc).toBe(-1); }
    }
    expect(seen).toBe(true);
    const day = fight('ps17-day', [mon('gengar', 40, 'g')], [mon('rattata', 5, 'f', ['harden'])]);
    day.ctx.period = 'afternoon';
    expect(played(turn(day.ctx), 'ps17-your-shadow')).toBe(false);
  });

  it('PS20 Leader of the Pack: knocking out a Bisharp promises Kingambit after the battle', () => {
    const { ctx, battle } = fight('ps20', [mon('bisharp', 70, 'b', ['close-combat'])], [mon('bisharp', 10, 'e', ['splash'])]);
    const events = turn(ctx);
    expect(battle.outcome).toBe('win');
    expect(played(events, 'ps20-leader-of-the-pack')).toBe(true);
    expect(battle.storyEffects.some((t) => t.startsWith('pm-evoafter:b:kingambit:'))).toBe(true);
  });

  it('PS21 Rage Past Death: twenty Rage Fists this run promise Annihilape after the battle; nineteen do not', () => {
    const p = mon('primeape', 30, 'p');
    p.moves.push({ id: 'rage-fist', pp: 10, uses: 20 });
    const { ctx, battle } = fight('ps21', [p], [mon('rattata', 5, 'f', ['harden'])]);
    expect(played(turn(ctx), 'ps21-rage-past-death')).toBe(true);
    expect(battle.storyEffects.some((t) => t.startsWith('pm-evoafter:p:annihilape:'))).toBe(true);
    const q = mon('primeape', 30, 'q');
    q.moves.push({ id: 'rage-fist', pp: 10, uses: 19 });
    const short = fight('ps21b', [q], [mon('rattata', 5, 'f', ['harden'])]);
    expect(played(turn(short.ctx), 'ps21-rage-past-death')).toBe(false);
  });

  it('PS2 The Empty Shell: when Shedinja falls, Ninjask comes in with Speed +2', () => {
    const { ctx, battle } = fight('ps2', [mon('shedinja', 30, 's'), mon('ninjask', 30, 'n')], [mon('charmander', 30, 'f', ['ember'])]);
    ctx.party[0]!.hp = 1;
    const first = turn(ctx);
    expect(played(first, 'ps2-the-empty-shell')).toBe(true);
    expect(ctx.party[0]!.hp).toBe(0);
    expect(battle.storyEffects.some((t) => t.startsWith('pm-entryboost:ninjask:spe:2'))).toBe(true);
    const events = resolveTurn(ctx, { kind: 'switch', partyIndex: 1 });
    expect(said(events, 'For the empty shell')).toBe(true);
    // +2 from the moment (Speed Boost may add its own +1 at the end of the turn).
    expect(battle.playerStages.spe).toBeGreaterThanOrEqual(2);
  });

  it('PS44 Just a Bidoof and PI5: a knockout is counted for the run; a plain foe is not a Legendary', () => {
    const { ctx, flags } = fight('ps44', [mon('bidoof', 60, 'b', ['tackle'])], [mon('rattata', 2, 'e', ['splash'])]);
    const events = turn(ctx);
    expect(flags[`${KOS_FLAG}b`]).toBe(1);
    expect(played(events, 'ps44-just-a-bidoof')).toBe(false);
  });

  it('PI3 One HP: a hit that leaves it on 1 HP is counted', () => {
    const { ctx, flags } = fight('pi3', [mon('magikarp', 5, 'k')], [mon('rattata', 5, 'e', ['false-swipe'])]);
    ctx.party[0]!.hp = 2;
    turn(ctx);
    if (ctx.party[0]!.hp === 1) expect(flags[`${ONE_HP_FLAG}k`]).toBe(1);
    else expect(flags[`${ONE_HP_FLAG}k`]).toBeUndefined();
  });

  it('PI5 Most Knockouts: only against the final opponent, and only the party leader in knockouts', () => {
    const party = [mon('pikachu', 50, 'p'), mon('eevee', 50, 'e')];
    const flags = { [`${KOS_FLAG}p`]: 5, [`${KOS_FLAG}e`]: 2 };
    const final = fight('pi5', party, [mon('rattata', 5, 'f', ['harden'])], { flags, finalBoss: true });
    expect(played(turn(final.ctx), 'pi5-most-knockouts')).toBe(true);
    const ordinary = fight('pi5-no', [mon('pikachu', 50, 'p'), mon('eevee', 50, 'e')], [mon('rattata', 5, 'f', ['harden'])], { flags: { ...flags } });
    expect(played(turn(ordinary.ctx), 'pi5-most-knockouts')).toBe(false);
  });
});

describe('species moments: rest and evolution', () => {
  it('PS10 One Hundred and Eight: Kindness 108 cracks the keystone, and every battle after it has +10%', () => {
    const run = runWith('ps10', [mon('spiritomb', 40, 's')]);
    run.story.flags.kindness = 107;
    expect(restMoments(content, run).some((l) => l.includes('One Hundred and Eight'))).toBe(false);
    run.story.flags.kindness = 108;
    expect(restMoments(content, run).some((l) => l.includes('One Hundred and Eight'))).toBe(true);
    expect(run.story.flags['pm-keystone:s']).toBe(1);
    const { ctx } = fight('ps10b', [mon('spiritomb', 40, 's')], [mon('rattata', 5, 'f', ['harden'])], { flags: run.story.flags });
    expect(played(turn(ctx), 'ps10-one-hundred-and-eight-cracked')).toBe(true);
  });

  it('PS16 Nurse\'s Orders cures the team and heals the lowest', () => {
    const run = runWith('ps16', [mon('chansey', 40, 'c'), mon('rattata', 20, 'r')]);
    run.party[1]!.hp = 1;
    run.party[1]!.status = { id: 'psn' } as PokemonInstance['status'];
    restMoments(content, run);
    expect(run.party[1]!.status).toBeNull();
    expect(run.party[1]!.hp).toBeGreaterThan(1);
  });

  it('PS8 Just Five More Minutes opens beside the stop; a slept Snorlax starts the next battle +1 and spends it', () => {
    const run = runWith('ps8', [mon('snorlax', 40, 's')]);
    restMoments(content, run);
    const here = run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!;
    expect(here.sides.some((x) => x.kind === 'event' && x.eventId === 'ps8-just-five-more-minutes')).toBe(true);
    const flags: MomentHooks['flags'] = { 'pm-snorlax-slept': 1 };
    const { ctx, battle } = fight('ps8b', [mon('snorlax', 40, 's')], [mon('rattata', 5, 'f', ['harden'])], { flags });
    expect(played(turn(ctx), 'ps8-just-five-more-minutes-rested')).toBe(true);
    expect(battle.playerStages.atk).toBe(1);
    expect(flags['pm-snorlax-slept']).toBeUndefined();
  });

  it('PS45 Presents gives one item from its list', () => {
    let given = false;
    for (let i = 0; i < 40 && !given; i++) {
      const run = runWith(`ps45-${i}`, [mon('delibird', 30, 'd')]);
      const lines = restMoments(content, run);
      if (lines.some((l) => l.includes('Presents'))) {
        given = true;
        expect(Object.values(run.inventory).reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
        expect(lines.join(' ')).toContain('Inside:');
      }
    }
    expect(given).toBe(true);
  });

  it('PS22 One in a Hundred: a rare Dudunsparce becomes the Three-Segment form', () => {
    let found = false;
    for (let i = 0; i < 400 && !found; i++) {
      const run = runWith(`ps22-${i}`, [mon('dudunsparce', 40, `d${i}`)]);
      if (evolveMoments(content, run, run.party[0]!, 'dunsparce').length) { found = true; expect(run.party[0]!.speciesId).toBe('dudunsparce-three-segment'); }
    }
    expect(found).toBe(true);
  });
});
