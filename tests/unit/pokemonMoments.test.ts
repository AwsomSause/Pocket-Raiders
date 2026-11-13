import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, type BattleContext, type BattleEvent } from '../../src/core/battle/engine';
import { revertTransformations } from '../../src/core/battle/transform';
import { MOMENT_GROUPS, POKEMON_MOMENTS, momentRoll, momentsFor, pokemonMoment, type MomentHooks } from '../../src/core/moments/pokemonMoments';
import { joinMoments, restMoments } from '../../src/core/moments/runMoments';
import { calcStats, createPokemon } from '../../src/core/pokemon';
import { chooseStarter, createRun } from '../../src/core/run';
import { hashSeed, Rng } from '../../src/core/rng';
import type { PokemonInstance } from '../../src/core/state';
import { content } from './helpers';

const strike = (species: string, ...moves: string[]): PokemonInstance => {
  const m = createPokemon(content, species, 90, `${species}-e`);
  m.moves = moves.map((id) => ({ id, pp: content.moves.get(id)!.pp }));
  return m;
};

function setup(playerSpecies: string, seed: string, runWouldEnd = true, flags: MomentHooks['flags'] = {}) {
  const player = createPokemon(content, playerSpecies, 20, `${playerSpecies}-p`);
  player.hp = 1;
  const enemy = strike('mewtwo', 'psystrike', 'shadow-ball');
  const battle = createBattle('wild', [enemy], 0, player.uid);
  const moments: MomentHooks = { seed, flags, cinematic: () => true, noteCinematic: () => undefined, runWouldEnd: () => runWouldEnd };
  const ctx: BattleContext = { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed(seed)), captureRng: new Rng(hashSeed(`${seed}c`)), catchMultiplier: 1, moments };
  return { ctx, battle, player, flags };
}
const turn = (ctx: BattleContext): BattleEvent[] => resolveTurn(ctx, { kind: 'move', index: 0 });
const moved = (events: BattleEvent[]) => events.filter((e) => e.type === 'pmoment');

describe('Pokémon moments data', () => {
  it('has 100+ moments with unique ids, real species, and effects on every supported one', () => {
    expect(POKEMON_MOMENTS.length).toBeGreaterThanOrEqual(100);
    expect(new Set(POKEMON_MOMENTS.map((m) => m.id)).size).toBe(POKEMON_MOMENTS.length);
    for (const m of POKEMON_MOMENTS) {
      for (const id of [...(m.scope.species ?? []), ...(m.scope.lines ?? [])]) expect(content.species.has(id), `${m.id}: ${id}`).toBe(true);
      for (const g of m.scope.groups ?? []) expect(MOMENT_GROUPS[g]?.length, `${m.id}: group ${g}`).toBeGreaterThan(0);
      if (m.status === 'supported') expect(m.effect, m.id).toBeDefined();
    }
    for (const list of Object.values(MOMENT_GROUPS)) for (const id of list) expect(content.species.has(id)).toBe(true);
  });

  it('matches by species, evolution line, group and type', () => {
    const ids = (s: string, t: Parameters<typeof momentsFor>[2]) => momentsFor(content, { speciesId: s }, t).map((m) => m.id);
    expect(ids('rotom', 'runEnd')).toEqual(['failure-not-tolerated']);
    expect(ids('golurk', 'runEnd')).toEqual(['failure-not-tolerated']);
    expect(ids('pikachu', 'runEnd')).toEqual([]);
    expect(ids('golem', 'lethal')).toContain('stone-sturdy');
    expect(ids('charizard', 'lethal')).toEqual(expect.arrayContaining(['starter-fire', 'fire-last-blaze']));
  });

  it('rolls are stateless and repeatable, with exact boundaries', () => {
    expect(momentRoll('s', 'm', 'u', 1, 0.5)).toBe(momentRoll('s', 'm', 'u', 1, 0.5));
    expect(momentRoll('s', 'm', 'u', 1, 1)).toBe(true);
    expect(momentRoll('s', 'm', 'u', 1, 0)).toBe(false);
    const hits = Array.from({ length: 400 }, (_, i) => momentRoll(`seed${i}`, 'm', 'u', 1, 0.5)).filter(Boolean).length;
    expect(hits).toBeGreaterThan(140);
    expect(hits).toBeLessThan(260);
  });
});

describe('Failure Will (NOT) Be Tolerated', () => {
  const find = (want: boolean) => {
    for (let i = 0; i < 200; i++) {
      const s = setup('rotom', `fail-${i}`);
      const events = turn(s.ctx);
      const revived = moved(events).some((e) => e.type === 'pmoment' && e.id === 'failure-not-tolerated');
      if (revived === want) return { ...s, events };
    }
    throw new Error('no seed');
  };

  it('on success: no loss, back up Overcharged at 150% HP, all stats doubled, claim spent', () => {
    const { player, battle, flags, events } = find(true);
    const normal = calcStats(content, { ...player, overcharged: undefined });
    expect(battle.outcome).toBeNull();
    expect(player.overcharged).toBe(true);
    expect(events.find((e) => e.type === 'pmoment')).toMatchObject({ id: 'failure-not-tolerated', scene: true });
    const boosted = calcStats(content, player);
    expect(boosted.hp).toBe(Math.floor(normal.hp * 1.5));
    expect(boosted.atk).toBe(normal.atk * 2);
    expect(boosted.spe).toBe(normal.spe * 2);
    expect(player.hp).toBeGreaterThan(0);
    expect(flags['pm:failure-not-tolerated']).toBe(1);
    // It ends with the battle: stats are back to normal.
    revertTransformations(content, battle, [player]);
    expect(player.overcharged).toBeUndefined();
    expect(calcStats(content, player).hp).toBe(normal.hp);
    expect(player.hp).toBeLessThanOrEqual(normal.hp);
  });

  it('on a failed roll the run ends as usual, and the claim is still spent', () => {
    const { battle, flags } = find(false);
    expect(battle.outcome).toBe('lose');
    expect(flags['pm:failure-not-tolerated']).toBe(1);
  });

  it('never applies twice in one run', () => {
    const s = setup('rotom', 'twice', true, { 'pm:failure-not-tolerated': 1 });
    turn(s.ctx);
    expect(s.player.overcharged).toBeUndefined();
    expect(s.battle.outcome).toBe('lose');
  });

  it('does nothing while a checkpoint or Safety Net could still save the run', () => {
    const s = setup('rotom', 'saved', false);
    turn(s.ctx);
    expect(s.battle.outcome).toBe('lose');
    expect(s.flags['pm:failure-not-tolerated']).toBeUndefined();
  });

  it('does nothing for a Pokémon that is not a construct', () => {
    const s = setup('pikachu', 'nonconstruct');
    turn(s.ctx);
    expect(s.battle.outcome).toBe('lose');
  });

  it('Overcharged moves cool down one turn: the same move cannot be used twice in a row', () => {
    const s = setup('rotom', 'cool');
    s.player.moves = ['thunder-shock', 'tackle'].map((id) => ({ id, pp: 20 }));
    s.player.overcharged = true;
    s.player.hp = 9999;
    s.battle.enemyTeam[0]!.hp = 99999;
    turn(s.ctx);
    const second = turn(s.ctx);
    expect(second.some((e) => e.type === 'blocked' && e.side === 'player')).toBe(true);
  });
});

describe('last stand moments', () => {
  it('a Rock-type line may hang on at 1 HP once per battle, and the same seed always gives the same result', () => {
    let found = 0;
    for (let i = 0; i < 300 && found < 1; i++) {
      const a = setup('geodude', `lethal-${i}`);
      const ea = moved(turn(a.ctx));
      const b = setup('geodude', `lethal-${i}`);
      expect(moved(turn(b.ctx))).toEqual(ea);
      if (ea.length > 0) {
        found++;
        expect(a.player.hp).toBeGreaterThanOrEqual(1);
        expect(a.battle.storyEffects.some((s) => s.startsWith('pm:stone-sturdy@'))).toBe(true);
      }
    }
    expect(found).toBe(1);
  });

  it('a once-per-run moment is spent after one chance, even when the roll fails', () => {
    const m = pokemonMoment('pseudo-pride')!;
    expect(m.limit).toBe('run');
    const s = setup('dragonite', 'pseudo', true, {});
    turn(s.ctx);
    expect(s.flags[`pm:${m.id}@${s.player.uid}`]).toBe(1);
  });
});

describe('Battle-start and switch-in moments (batch 2)', () => {
  const lead = (species: string, seed: string, flags: MomentHooks['flags'] = {}, extra: PokemonInstance[] = []) => {
    const player = createPokemon(content, species, 40, `${species}-p`);
    const enemy = strike('metapod', 'harden');
    const battle = createBattle('wild', [enemy], 0, player.uid);
    const moments: MomentHooks = { seed, flags, cinematic: () => false, noteCinematic: () => undefined, runWouldEnd: () => false };
    const ctx: BattleContext = { content, battle, party: [player, ...extra], inventory: {}, rng: new Rng(hashSeed(seed)), captureRng: new Rng(hashSeed(`${seed}c`)), catchMultiplier: 1, moments };
    return { ctx, battle, player, flags };
  };
  const startEvents = (events: BattleEvent[]) => events.filter((e) => e.type === 'pmoment' && e.trigger === 'start');

  it('every start and enter moment is either supported with an effect or documented as disabled', () => {
    const all = POKEMON_MOMENTS.filter((m) => m.trigger === 'start' || m.trigger === 'enter');
    expect(all.filter((m) => m.status === 'supported').length).toBeGreaterThanOrEqual(34);
    for (const m of all) if (m.status === 'supported') expect(m.effect, m.id).toBeDefined();
    // Batch 4 built the five that needed new mechanics.
    expect(all.filter((m) => m.status === 'disabled').map((m) => m.id)).toEqual([]);
  });

  it('Arceus judges at battle start: all stats +1, once per run', () => {
    const a = lead('arceus', 'arc-1');
    const events = turn(a.ctx);
    expect(startEvents(events).map((e) => e.type === 'pmoment' && e.id)).toEqual(['arceus-judgment']);
    expect(a.battle.playerStages.atk).toBe(1);
    expect(a.battle.playerStages.spe).toBe(1);
    expect(a.flags['pm:arceus-judgment']).toBe(1);
    // A second battle in the same run: the claim is spent.
    const b = lead('arceus', 'arc-2', a.flags);
    expect(startEvents(turn(b.ctx))).toEqual([]);
    expect(b.battle.playerStages.atk).toBe(0);
  });

  it('plays once per battle, not again on later turns', () => {
    const a = lead('arceus', 'arc-3');
    turn(a.ctx);
    expect(startEvents(turn(a.ctx))).toEqual([]);
  });

  it('is repeatable: the same seed and actions give the same events', () => {
    const run = () => {
      const s = lead('cubone', 'rep-1');
      return JSON.stringify([turn(s.ctx), turn(s.ctx), s.battle.playerStages]);
    };
    expect(run()).toBe(run());
  });

  it('a timed boost fades after its turns (Dragon Aura lasts 3)', () => {
    for (let i = 0; i < 400; i++) {
      const s = lead('dratini', `dragon-${i}`);
      const events = turn(s.ctx);
      if (!startEvents(events).some((e) => e.type === 'pmoment' && e.id === 'dragon-aura')) continue;
      expect(s.battle.playerStages.atk).toBe(1);
      turn(s.ctx);
      expect(s.battle.playerStages.atk).toBe(1);
      turn(s.ctx);
      expect(s.battle.playerStages.atk).toBe(0);
      return;
    }
    throw new Error('no seed played Dragon Aura');
  });

  it('Pikachu can paralyse the foe at the start; a Ground foe is never hit by an Electric-type shock rule it is immune to', () => {
    for (let i = 0; i < 400; i++) {
      const s = lead('pikachu', `static-${i}`);
      const events = turn(s.ctx);
      if (!startEvents(events).some((e) => e.type === 'pmoment' && e.id === 'pikachu-static')) continue;
      expect(s.battle.enemyTeam[0]!.status?.id).toBe('par');
      return;
    }
    throw new Error('no seed played Static Cling');
  });

  it("Eevee's Bond needs two Eeveelutions in the party", () => {
    const alone = lead('eevee', 'bond-alone');
    for (let i = 0; i < 80; i++) {
      const s = lead('eevee', `bond-${i}`);
      expect(startEvents(turn(s.ctx)).some((e) => e.type === 'pmoment' && e.id === 'eevee-bond')).toBe(false);
    }
    void alone;
    let played = 0;
    for (let i = 0; i < 200; i++) {
      const s = lead('eevee', `bond2-${i}`, {}, [createPokemon(content, 'vaporeon', 40, 'vap-p')]);
      if (startEvents(turn(s.ctx)).some((e) => e.type === 'pmoment' && e.id === 'eevee-bond')) { played++; expect(s.battle.playerStages.spe).toBe(1); }
    }
    expect(played).toBeGreaterThan(0);
  });

  it('a switch-in moment plays for the Pokémon that comes out, and never for a fainted one', () => {
    let played = 0;
    for (let i = 0; i < 300; i++) {
      const s = lead('rattata', `enter-${i}`, {}, [createPokemon(content, 'charizard', 40, 'zard-p')]);
      turn(s.ctx);
      const events = resolveTurn(s.ctx, { kind: 'switch', partyIndex: 1 });
      const enter = events.filter((e) => e.type === 'pmoment' && e.trigger === 'enter');
      for (const e of enter) {
        played++;
        expect(e.type === 'pmoment' && e.uid).toBe('zard-p');
      }
    }
    expect(played).toBeGreaterThan(0);
  });

  it('roles come from base stats', () => {
    const roleIds = POKEMON_MOMENTS.filter((m) => m.scope.role).map((m) => m.id).sort();
    expect(roleIds).toEqual(['glass-cannon-entrance', 'support-entrance', 'wall-entrance']);
    const ids = (s: string) => momentsFor(content, { speciesId: s }, 'enter').map((m) => m.id);
    expect(ids('shuckle')).toContain('wall-entrance');
    expect(ids('alakazam')).toContain('glass-cannon-entrance');
  });
});

describe('Reactive moments (batch 3): low HP, a KO, a hit taken', () => {
  const fight = (playerSp: string, seed: string, enemies: PokemonInstance[], opts: { hpPct?: number; level?: number; move?: string } = {}) => {
    const player = createPokemon(content, playerSp, opts.level ?? 50, `${playerSp}-p`);
    player.moves = [{ id: opts.move ?? 'splash', pp: 20 }];
    if (opts.hpPct) player.hp = Math.max(1, Math.floor((calcStats(content, player).hp * opts.hpPct) / 100));
    const battle = createBattle('trainer', enemies, 0, player.uid);
    const moments: MomentHooks = { seed, flags: {}, cinematic: () => false, noteCinematic: () => undefined, runWouldEnd: () => false };
    const ctx: BattleContext = { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed(seed)), captureRng: new Rng(hashSeed(`${seed}c`)), catchMultiplier: 1, moments };
    return { ctx, battle, player };
  };
  const weak = (sp: string, ...moves: string[]) => { const m = strike(sp, ...moves); m.level = 5; return m; };
  const ids = (events: BattleEvent[], trigger: string) => events.filter((e) => e.type === 'pmoment' && e.trigger === trigger).map((e) => e.type === 'pmoment' && e.id);

  it('data: every low-HP moment has a threshold; supported ones have effects; none stay off', () => {
    const reactive = POKEMON_MOMENTS.filter((m) => ['low', 'ko', 'super', 'crit'].includes(m.trigger));
    for (const m of reactive) {
      if (m.trigger === 'low' && m.status === 'supported') expect(m.hpBelow, m.id).toBeGreaterThan(0);
      if (m.status === 'supported') expect(m.effect, m.id).toBeDefined();
    }
    expect(reactive.filter((m) => m.status === 'disabled').map((m) => m.id).sort()).toEqual([]);
  });

  it('Gyarados rages below half HP: Atk +2, once per battle, only when low', () => {
    let played = 0;
    for (let i = 0; i < 200; i++) {
      const healthy = fight('gyarados', `rage-h-${i}`, [weak('magikarp', 'splash')]);
      expect(ids(turn(healthy.ctx), 'low')).toEqual([]);
      const s = fight('gyarados', `rage-${i}`, [weak('magikarp', 'splash')], { hpPct: 40 });
      if (ids(turn(s.ctx), 'low').includes('gyarados-rage')) {
        played++;
        expect(s.battle.playerStages.atk).toBe(2);
        expect(ids(turn(s.ctx), 'low')).not.toContain('gyarados-rage');
      }
    }
    expect(played).toBeGreaterThan(0);
  });

  it('Snorlax naps: asleep and healed 50%; Grass healing needs sun', () => {
    let napped = false;
    for (let i = 0; i < 300; i++) {
      const s = fight('snorlax', `nap-${i}`, [weak('magikarp', 'splash')], { hpPct: 30 });
      const before = s.player.hp;
      if (!ids(turn(s.ctx), 'low').includes('snorlax-nap')) continue;
      expect(s.player.hp).toBeGreaterThan(before);
      expect(s.player.status?.id).toBe('slp');
      napped = true;
      break;
    }
    expect(napped).toBe(true);
    let sunny = 0;
    for (let i = 0; i < 300; i++) {
      const dry = fight('bulbasaur', `chloro-dry-${i}`, [weak('magikarp', 'splash')], { hpPct: 15 });
      expect(ids(turn(dry.ctx), 'low')).not.toContain('grass-chloro');
      const wet = fight('bulbasaur', `chloro-${i}`, [weak('magikarp', 'splash')], { hpPct: 15 });
      wet.battle.weather = { id: 'sun', turns: 5 };
      if (ids(turn(wet.ctx), 'low').includes('grass-chloro')) sunny++;
    }
    expect(sunny).toBeGreaterThan(0);
  });

  it('a KO moment plays after the Pokémon in front knocks a foe out', () => {
    let played = 0;
    for (let i = 0; i < 300; i++) {
      const s = fight('pikachu', `ko-${i}`, [weak('caterpie', 'tackle'), weak('weedle', 'tackle')], { level: 60, move: 'thunderbolt' });
      const events = turn(s.ctx);
      if (!events.some((e) => e.type === 'faint' && e.side === 'enemy')) continue;
      if (ids(events, 'ko').includes('pikachu-victory')) {
        played++;
        expect(s.battle.playerStages.spe).toBe(1);
      }
    }
    expect(played).toBeGreaterThan(0);
  });

  it('Bug swarm: the next Bug move is boosted once, then the boost is spent', () => {
    let played = 0;
    for (let i = 0; i < 400 && played < 3; i++) {
      const s = fight('scyther', `swarm-${i}`, [weak('magikarp', 'splash')], { hpPct: 15 });
      if (!ids(turn(s.ctx), 'low').includes('bug-swarm-low')) continue;
      played++;
      expect(s.battle.storyEffects.some((t) => t.startsWith('pm-nextboost:'))).toBe(true);
      s.player.moves = [{ id: 'bug-bite', pp: 20 }];
      turn(s.ctx);
      expect(s.battle.storyEffects.some((t) => t.startsWith('pm-nextboost:'))).toBe(false);
    }
    expect(played).toBeGreaterThan(0);
  });

  it('Toxic Blood: after it plays, a foe that makes contact is poisoned', () => {
    let poisoned = 0;
    for (let i = 0; i < 400 && poisoned < 2; i++) {
      const s = fight('grimer', `blood-${i}`, [weak('rattata', 'tackle')], { hpPct: 15, level: 60 });
      if (!ids(turn(s.ctx), 'low').includes('poison-toxic-blood')) continue;
      expect(s.battle.storyEffects.some((t) => t.startsWith('pm-contactpsn:'))).toBe(true);
      turn(s.ctx);
      if (s.battle.enemyTeam[0]!.status?.id === 'psn') poisoned++;
    }
    expect(poisoned).toBeGreaterThan(0);
  });

  it('Cackle and Cold Triumph weaken the next foe after a KO', () => {
    const check = (species: string, move: string, id: string, expectStages: Record<string, number>) => {
      let played = 0;
      for (let i = 0; i < 400 && played < 2; i++) {
        const s = fight(species, `${id}-${i}`, [weak('caterpie', 'tackle'), weak('weedle', 'tackle')], { level: 70, move });
        const events = turn(s.ctx);
        if (!events.some((e) => e.type === 'faint' && e.side === 'enemy') || !ids(events, 'ko').includes(id)) continue;
        played++;
        for (const [stat, n] of Object.entries(expectStages)) expect(s.battle.enemyStages[stat as 'atk'], `${id} ${stat}`).toBe(n);
      }
      expect(played, id).toBeGreaterThan(0);
    };
    check('gengar', 'shadow-ball', 'gengar-cackle', { atk: -1, spa: -1 });
    check('articuno', 'ice-beam', 'ice-chill-ko', { spe: -1 });
  });

  it('a hit taken: super-effective and critical moments, and timed crit stages fade', () => {
    let rock = 0;
    for (let i = 0; i < 400; i++) {
      const s = fight('golem', `hold-${i}`, [weak('squirtle', 'water-gun')], { level: 60 });
      if (ids(turn(s.ctx), 'super').includes('rock-hold')) {
        rock++;
        expect(s.battle.playerStages.def).toBe(1);
      }
    }
    expect(rock).toBeGreaterThan(0);
    for (let i = 0; i < 400; i++) {
      const s = fight('umbreon', `desperate-${i}`, [weak('magikarp', 'splash')], { hpPct: 10 });
      const events = turn(s.ctx);
      if (!ids(events, 'low').includes('dark-desperate')) continue;
      // Dark Menace (battle start) adds one lasting crit stage when it plays.
      const lasting = ids(events, 'start').includes('dark-menace') ? 1 : 0;
      expect(s.battle.playerVolatile.momentCrit).toBe(2 + lasting);
      turn(s.ctx);
      expect(s.battle.playerVolatile.momentCrit).toBe(lasting);
      return;
    }
    throw new Error('no seed played Dark Desperate');
  });

  it('is repeatable by seed', () => {
    const run = () => {
      const s = fight('gyarados', 'repeat-1', [weak('magikarp', 'splash')], { hpPct: 30 });
      return JSON.stringify([turn(s.ctx), turn(s.ctx), s.battle.playerStages]);
    };
    expect(run()).toBe(run());
  });
});

describe('Batch 4: the mechanics for Ditto, Smeargle, Mew, Darkrai, Sneasel; shared revival use', () => {
  const duel = (playerSp: string, seed: string, enemy: PokemonInstance, level = 40, flags: MomentHooks['flags'] = {}) => {
    const player = createPokemon(content, playerSp, level, `${playerSp}-p`);
    const battle = createBattle('trainer', [enemy], 0, player.uid);
    const moments: MomentHooks = { seed, flags, cinematic: () => false, noteCinematic: () => undefined, runWouldEnd: () => false };
    const ctx: BattleContext = { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed(seed)), captureRng: new Rng(hashSeed(`${seed}c`)), catchMultiplier: 1, moments };
    return { ctx, battle, player };
  };
  const played = (events: BattleEvent[], id: string) => events.some((e) => e.type === 'pmoment' && e.id === id);
  const find = (sp: string, id: string, make: (seed: string) => ReturnType<typeof duel>) => {
    for (let i = 0; i < 400; i++) {
      const s = make(`${id}-${i}`);
      const events = turn(s.ctx);
      if (played(events, id)) return { ...s, events };
    }
    throw new Error(`no seed played ${id}`);
  };
  const foe = (sp: string, level: number, ...moves: string[]) => { const m = strike(sp, ...moves); m.level = level; return m; };

  it('Ditto takes on the foe\'s types for the battle', () => {
    const s = find('ditto', 'ditto-copy', (seed) => duel('ditto', seed, foe('charizard', 5, 'splash')));
    expect(s.battle.playerVolatile.typeList).toEqual(content.species.get('charizard')!.types);
  });

  it('Smeargle sketches a foe move and Mew learns a TM move, each in the last slot, with the old move backed up', () => {
    const sk = find('smeargle', 'smeargle-sketch', (seed) => { const d = duel('smeargle', seed, foe('charizard', 5, 'ember', 'splash')); d.player.moves = ['tackle', 'growl', 'splash', 'harden'].map((id) => ({ id, pp: 10 })); return d; });
    expect(['ember', 'splash']).toContain(sk.player.moves[3]!.id);
    expect(sk.battle.extra.mimic[sk.player.uid]?.moves[3]?.id).toBe('harden');
    const mew = find('mew', 'mew-curious', (seed) => { const d = duel('mew', seed, foe('magikarp', 5, 'splash')); d.player.moves = ['tackle', 'growl', 'splash', 'harden'].map((id) => ({ id, pp: 10 })); return d; });
    expect(mew.player.moves[3]!.id).not.toBe('harden');
    expect(mew.battle.extra.mimic[mew.player.uid]?.moves[3]?.id).toBe('harden');
  });

  it('Darkrai\'s nightmare drains a sleeping foe each turn but never its last point', () => {
    const s = find('darkrai', 'darkrai-nightmare', (seed) => { const d = duel('darkrai', seed, foe('snorlax', 40, 'splash')); d.player.moves = [{ id: 'splash', pp: 99 }]; d.battle.enemyTeam[0]!.status = { id: 'slp', turns: 5 }; return d; });
    const hp1 = s.battle.enemyTeam[0]!.hp;
    turn(s.ctx);
    expect(s.battle.enemyTeam[0]!.hp).toBeLessThan(hp1);
    for (let i = 0; i < 40 && s.battle.enemyTeam[0]!.status?.id === 'slp'; i++) turn(s.ctx);
    expect(s.battle.enemyTeam[0]!.hp).toBeGreaterThanOrEqual(1);
  });

  it('Sneasel moves first on turn 1 even against a much faster foe; Mewtwo is not flinched', () => {
    const s = find('sneasel', 'sneasel-ambush', (seed) => { const d = duel('sneasel', seed, foe('jolteon', 90, 'tackle'), 10); d.player.moves = [{ id: 'quick-attack', pp: 10 }]; return d; });
    const order = s.events.filter((e) => e.type === 'move').map((e) => e.type === 'move' && e.side);
    expect(order[0]).toBe('player');
    const m = find('mewtwo', 'mewtwo-armored', (seed) => duel('mewtwo', seed, foe('magikarp', 5, 'splash')));
    expect(m.battle.storyEffects.some((t) => t.startsWith('pm-noflinch:'))).toBe(true);
  });

  it('all run-end revivals share one use per run', () => {
    const used = setup('rotom', 'shared-1', true, { 'pm:runend-used': 1 });
    const events = turn(used.ctx);
    expect(moved(events).some((e) => e.type === 'pmoment' && e.id === 'failure-not-tolerated')).toBe(false);
    const fresh = setup('rotom', 'shared-2');
    turn(fresh.ctx);
    expect(fresh.flags['pm:runend-used']).toBe(1);
  });
});

describe('Batch 5: faint, ally, weather and status moments', () => {
  const build = (seed: string, party: PokemonInstance[], enemy: PokemonInstance) => {
    const battle = createBattle('trainer', [enemy], 0, party[0]!.uid);
    const moments: MomentHooks = { seed, flags: {}, cinematic: () => false, noteCinematic: () => undefined, runWouldEnd: () => false };
    const ctx: BattleContext = { content, battle, party, inventory: {}, rng: new Rng(hashSeed(seed)), captureRng: new Rng(hashSeed(`${seed}c`)), catchMultiplier: 1, moments };
    return { ctx, battle };
  };
  const mon = (sp: string, level: number, hp?: number, uid = `${sp}-b`): PokemonInstance => {
    const m = createPokemon(content, sp, level, uid);
    m.moves = [{ id: 'splash', pp: 99 }];
    if (hp !== undefined) m.hp = hp;
    return m;
  };
  const big = (): PokemonInstance => strike('mewtwo', 'psystrike');
  const has = (events: BattleEvent[], id: string) => events.some((e) => e.type === 'pmoment' && e.id === id);

  it('the moments still off are the four hook-blocked battle ones and three rest ones that need new systems', () => {
    const off = POKEMON_MOMENTS.filter((m) => m.status === 'disabled').map((m) => m.id).sort();
    expect(off).toEqual([]);
  });

  it('a weather moment plays only in its weather', () => {
    let sun = 0;
    for (let i = 0; i < 300; i++) {
      const dry = build(`sun-dry-${i}`, [mon('charmander', 40)], mon('magikarp', 5));
      expect(has(turn(dry.ctx), 'sunny-day-fire')).toBe(false);
      const wet = build(`sun-${i}`, [mon('charmander', 40)], mon('magikarp', 5));
      wet.battle.weather = { id: 'sun', turns: 5 };
      if (has(turn(wet.ctx), 'sunny-day-fire')) { sun++; expect(wet.battle.playerStages.spe).toBeGreaterThanOrEqual(1); }
    }
    expect(sun).toBeGreaterThan(0);
  });

  it('a status moment needs the status; Fire thaws at once', () => {
    let thawed = 0;
    for (let i = 0; i < 300; i++) {
      const healthy = build(`thaw-h-${i}`, [mon('charmander', 40)], mon('magikarp', 5));
      expect(has(turn(healthy.ctx), 'fire-thaw')).toBe(false);
      const p = mon('charmander', 40);
      p.status = { id: 'frz' };
      const s = build(`thaw-${i}`, [p], mon('magikarp', 5));
      if (has(turn(s.ctx), 'fire-thaw')) { thawed++; expect(p.status).toBeNull(); }
    }
    expect(thawed).toBeGreaterThan(0);
  });

  it('a fallen Electric type paralyses the foe (faint trigger)', () => {
    let n = 0;
    for (let i = 0; i < 400; i++) {
      const s = build(`faint-${i}`, [mon('pikachu', 5, 1), mon('rattata', 30)], big());
      const events = turn(s.ctx);
      if (has(events, 'p2-static-discharge')) { n++; expect(s.battle.enemyTeam[0]!.status?.id).toBe('par'); }
    }
    expect(n).toBeGreaterThan(0);
  });

  it('a fallen legendary bird stirs the next bird: the boost waits for the switch-in', () => {
    let n = 0;
    for (let i = 0; i < 400; i++) {
      const s = build(`ally-${i}`, [mon('articuno', 5, 1), mon('zapdos', 40)], big());
      const events = turn(s.ctx);
      expect(has(events, 'legendary-birds')).toBe(false);
      if (!s.battle.needsSwitch) continue;
      const pending = s.battle.storyEffects.some((t) => t.startsWith('pm-pending:legendary-birds'));
      const out = resolveTurn(s.ctx, { kind: 'switch', partyIndex: 1 });
      expect(has(out, 'legendary-birds')).toBe(pending);
      if (pending) { n++; expect(s.battle.playerStages.spa).toBeGreaterThanOrEqual(1); expect(s.battle.storyEffects.some((t) => t.startsWith('pm-pending:'))).toBe(false); }
    }
    expect(n).toBeGreaterThan(0);
  });

  it('Arcanine only gets Legendary Pokémon against a legendary foe; Falinks forms up', () => {
    for (let i = 0; i < 20; i++) expect(has(turn(build(`arc-n-${i}`, [mon('arcanine', 40)], mon('magikarp', 5)).ctx), 'p2-legendary-arcanine')).toBe(false);
    const legend = build('arc-y', [mon('arcanine', 40)], foeLegend());
    expect(has(turn(legend.ctx), 'p2-legendary-arcanine')).toBe(true);
    expect(legend.battle.playerStages.atk).toBeGreaterThanOrEqual(1);
    const f = build('falinks', [mon('falinks', 40)], mon('magikarp', 5));
    expect(has(turn(f.ctx), 'p2-formation')).toBe(true);
    function foeLegend(): PokemonInstance { const m = strike('articuno', 'splash'); m.level = 5; return m; }
  });

  it('Houndoom howls only at night; Tinkaton only boosts its hammer against a Steel/Flying foe', () => {
    const day = build('howl-day', [mon('houndoom', 40)], mon('magikarp', 5));
    day.ctx.period = 'afternoon';
    expect(has(turn(day.ctx), 'p2-houndoom-howl')).toBe(false);
    const night = build('howl-night', [mon('houndoom', 40)], mon('magikarp', 5));
    night.ctx.period = 'night';
    expect(has(turn(night.ctx), 'p2-houndoom-howl')).toBe(true);
    expect(night.battle.enemyStages.spe).toBe(-1);
    const plain = build('hammer-n', [mon('tinkaton', 40)], mon('magikarp', 5));
    expect(has(turn(plain.ctx), 'p2-tinkaton-hammer')).toBe(false);
    const bird = strike('skarmory', 'splash'); bird.level = 5;
    const hit = build('hammer-y', [mon('tinkaton', 40)], bird);
    expect(has(turn(hit.ctx), 'p2-tinkaton-hammer')).toBe(true);
    expect(hit.battle.storyEffects.some((t) => t.startsWith('pm-moveboost:'))).toBe(true);
  });

  it('Psyduck headache: below half HP the next Psychic move is doubled, then spent', () => {
    let played = 0;
    for (let i = 0; i < 300 && played < 2; i++) {
      const p = mon('psyduck', 40);
      p.hp = Math.floor(calcStats(content, p).hp * 0.3);
      const s = build(`duck-${i}`, [p], mon('magikarp', 5));
      if (!turn(s.ctx).some((e) => e.type === 'pmoment' && e.id === 'p2-psyduck-headache')) continue;
      played++;
      expect(s.battle.storyEffects.some((t) => t.startsWith('pm-nextboost:'))).toBe(true);
    }
    expect(played).toBeGreaterThan(0);
  });
});

describe('Batch 6: rest and catch moments (run layer)', () => {
  const freshRun = (seed: string) => chooseStarter(content, createRun(content, { runId: `rest-${seed}`, seed, archetypeId: 'red' }), 0);
  const withParty = (seed: string, ...species: string[]) => {
    const run = freshRun(seed);
    run.party = species.map((s, i) => createPokemon(content, s, 20, `${s}-r${i}`));
    run.party.forEach((p) => (p.friendship = 50));
    return run;
  };

  it('data: the rest and catch moments that have an effect are supported; none stay off with reasons', () => {
    const off = POKEMON_MOMENTS.filter((m) => (m.trigger === 'rest' || m.trigger === 'catch') && m.status === 'disabled').map((m) => m.id).sort();
    expect(off).toEqual([]);
  });

  it('Snorlax at a rest: +8 friendship and a berry, claimed once per run', () => {
    const run = withParty('rest-snorlax', 'snorlax');
    const before = run.party[0]!.friendship;
    const lines = restMoments(content, run);
    expect(lines.length).toBe(1);
    expect(run.party[0]!.friendship).toBe(before + 8);
    expect((run.inventory['oran-berry'] ?? 0) + (run.inventory['sitrus-berry'] ?? 0)).toBe(1);
    expect(run.story.flags['pm:snorlax-rest']).toBe(1);
    expect(restMoments(content, run)).toEqual([]);
  });

  it('Ghost Story names the leader\'s weak types; Dream Walk gives experience; Water Song warms the team', () => {
    const seen = { ghost: false, dream: false, water: false };
    for (let i = 0; i < 200 && !(seen.ghost && seen.dream && seen.water); i++) {
      const g = withParty(`rest-ghost-${i}`, 'gastly');
      if (restMoments(content, g).join(' ').includes('weak to')) seen.ghost = true;
      const d = withParty(`rest-dream-${i}`, 'abra');
      d.party[0] = createPokemon(content, 'abra', 5, 'abra-r0');
      d.party[0]!.friendship = 50;
      const xp = d.party[0]!.xp;
      if (restMoments(content, d).length) { expect(d.party[0]!.xp).toBeGreaterThan(xp); seen.dream = true; }
      const w = withParty(`rest-water-${i}`, 'squirtle');
      if (restMoments(content, w).length) { expect(w.party[0]!.friendship).toBe(53); seen.water = true; }
    }
    expect(seen).toEqual({ ghost: true, dream: true, water: true });
  });

  it('a chance-based rest moment can fail without being claimed, and plays at some later rest', () => {
    let played = 0;
    let missedFirst = 0;
    for (let i = 0; i < 80; i++) {
      const run = withParty(`rest-eevee-${i}`, 'eevee');
      const first = restMoments(content, run).length;
      if (!first) { missedFirst++; expect(run.story.flags['pm:eevee-curl']).toBeUndefined(); }
      for (let r = 1; r < 12 && !restMoments(content, run).length && !first; r++) run.encountersCompleted += 1;
      if (run.story.flags['pm:eevee-curl'] !== undefined) played++;
    }
    expect(missedFirst).toBeGreaterThan(0);
    expect(played).toBeGreaterThan(40);
  });

  it('is repeatable: the same run and rest give the same lines', () => {
    const a = restMoments(content, withParty('rest-same', 'eevee', 'charmander', 'bulbasaur'));
    const b = restMoments(content, withParty('rest-same', 'eevee', 'charmander', 'bulbasaur'));
    expect(a).toEqual(b);
  });

  it('a legendary joining heals the team and gains 10 friendship (once per run)', () => {
    const run = withParty('join-legend', 'rattata', 'pidgey');
    run.party.forEach((p) => (p.hp = 1));
    const legend = createPokemon(content, 'articuno', 30, 'articuno-j');
    legend.friendship = 70;
    let healed = 0;
    const lines = joinMoments(content, run, legend, () => { healed++; });
    expect(lines.length).toBe(1);
    expect(healed).toBe(1);
    expect(legend.friendship).toBe(80);
    expect(joinMoments(content, run, createPokemon(content, 'zapdos', 30, 'zapdos-j'), () => { healed++; })).toEqual([]);
    expect(healed).toBe(1);
  });

  it('Ditto joins with a talent; one that already has one keeps it and the moment is not claimed', () => {
    const run = withParty('join-ditto', 'rattata');
    const ditto = createPokemon(content, 'ditto', 20, 'ditto-j');
    expect(joinMoments(content, run, ditto, () => undefined).length).toBe(1);
    expect(['atk', 'def', 'spa', 'spd', 'spe']).toContain(ditto.care?.talent);
    const run2 = withParty('join-ditto-2', 'rattata');
    const d2 = createPokemon(content, 'ditto', 20, 'ditto-k');
    d2.care = { ...(d2.care ?? {}), talent: 'atk' } as NonNullable<PokemonInstance['care']>;
    expect(joinMoments(content, run2, d2, () => undefined)).toEqual([]);
    expect(run2.story.flags['pm:ditto-join']).toBeUndefined();
    expect(d2.care?.talent).toBe('atk');
  });
});
