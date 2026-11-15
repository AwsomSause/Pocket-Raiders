import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, switchProblem, type BattleContext, type BattleEvent } from '../../src/core/battle/engine';
import { pokemonMoment, type MomentHooks } from '../../src/core/moments/pokemonMoments';
import { evolveMoments, noteCocoon, restMoments } from '../../src/core/moments/runMoments';
import { conditionMet, conditionText } from '../../src/core/events';
import { fillCoText } from '../../src/core/events/coToolkit';
import { calcStats, createPokemon } from '../../src/core/pokemon';
import { chooseStarter, createRun } from '../../src/core/run';
import { hashSeed, Rng } from '../../src/core/rng';
import type { PokemonInstance } from '../../src/core/state';
import { content } from './helpers';

// Catalog Overhaul row 17: the pack's Pokémon Moments (POKEMON_MOMENTS.md). Batch 1: the type moments PT1 to PT18 and the
// statuses they bring (Kindled, Resolute, Remembered, Haunting, plus endure, rooted, Dig In and the ace reveal).

const PT = ['pt1-plain-and-stubborn', 'pt2-embers-left', 'pt3-the-tide-comes-back', 'pt4-sunlight-through-leaves', 'p2-static-discharge', 'pt6-frozen-in-place', 'pt7-one-more-round', 'p2-spite-blood', 'ground-dig-in', 'pt10-catch-the-wind', 'pt11-it-saw-this-coming', 'pt12-the-swarm-answers', 'rock-hold', 'pt14-not-quite-gone', 'pt15-old-blood', 'pt16-takes-advantage', 'pt17-built-to-last', 'pt18-a-small-kindness'];

const mon = (sp: string, level: number, uid: string, moves: string[], hpPct = 100): PokemonInstance => {
  const m = createPokemon(content, sp, level, uid);
  m.moves = moves.map((id) => ({ id, pp: content.moves.get(id)!.pp }));
  m.hp = Math.max(1, Math.floor((calcStats(content, m).hp * hpPct) / 100));
  return m;
};

function fight(seed: string, party: PokemonInstance[], enemies: PokemonInstance[], kind: 'wild' | 'trainer' = 'trainer') {
  const battle = createBattle(kind, enemies, 0, party[0]!.uid);
  const moments: MomentHooks = { seed, flags: {}, cinematic: () => false, noteCinematic: () => undefined, runWouldEnd: () => false };
  const ctx: BattleContext = { content, battle, party, inventory: {}, rng: new Rng(hashSeed(seed)), captureRng: new Rng(hashSeed(`${seed}c`)), catchMultiplier: 1, moments };
  return { ctx, battle };
}
const move = (ctx: BattleContext): BattleEvent[] => resolveTurn(ctx, { kind: 'move', index: 0 });
const played = (events: BattleEvent[], id: string) => events.some((e) => e.type === 'pmoment' && e.id === id);
const said = (events: BattleEvent[], text: string) => events.some((e) => e.type === 'raid' && e.text.includes(text));

/** Tries seeds until `run` returns true (a chance moment played and was checked), failing when none does. */
function someSeed(prefix: string, run: (seed: string) => boolean, tries = 300): void {
  for (let i = 0; i < tries; i++) if (run(`${prefix}-${i}`)) return;
  throw new Error(`no seed played ${prefix}`);
}

describe('pack type moments: data', () => {
  it('all eighteen are supported, one per type, with a [Name] line', () => {
    const types = new Set<string>();
    for (const id of PT) {
      const m = pokemonMoment(id);
      expect(m, id).toBeDefined();
      expect(m!.status).toBe('supported');
      expect(m!.effect, id).toBeDefined();
      types.add(m!.scope.types![0]!);
    }
    expect(types.size).toBe(18);
    expect(pokemonMoment('pt1-plain-and-stubborn')!.presentation).toContain('[Name]');
  });
});

describe('pack type moments: battle', () => {
  it('PT13 Still Standing: a super-effective hit that does not knock it out gives Defence +1, every time', () => {
    const { ctx, battle } = fight('pt13', [mon('golem', 60, 'g', ['splash'])], [mon('squirtle', 5, 's', ['water-gun'])]);
    const events = move(ctx);
    expect(played(events, 'rock-hold')).toBe(true);
    expect(battle.playerStages.def).toBe(1);
  });

  it('PT17 Built to Last: from full HP a knockout hit leaves it at 1; from below full it does not', () => {
    const full = fight('pt17', [mon('registeel', 20, 'r', ['splash']), mon('pidgey', 20, 'b', ['tackle'])], [mon('machamp', 90, 'm', ['close-combat'])]);
    move(full.ctx);
    expect(full.ctx.party[0]!.hp).toBeGreaterThanOrEqual(1);
    let fell = 0;
    for (let i = 0; i < 40; i++) {
      const hurt = fight(`pt17-hurt-${i}`, [mon('registeel', 20, 'r', ['splash'], 90), mon('pidgey', 20, 'b', ['tackle'])], [mon('machamp', 90, 'm', ['close-combat'])]);
      const events = move(hurt.ctx);
      expect(played(events, 'pt17-built-to-last')).toBe(false);
      if (hurt.ctx.party[0]!.hp === 0) fell++;
    }
    expect(fell).toBeGreaterThan(0);
  });

  it('PT1 Plain and Stubborn: alone and below a quarter, the next knockout hit leaves it at 1 HP', () => {
    someSeed('pt1', (seed) => {
      const { ctx } = fight(seed, [mon('rattata', 30, 'r', ['splash'], 20)], [mon('caterpie', 5, 'c', ['string-shot'])], 'wild');
      if (!played(move(ctx), 'pt1-plain-and-stubborn')) return false;
      expect(ctx.battle.storyEffects).toContain('pm-endure:r');
      const foe = ctx.battle.enemyTeam[0]!;
      foe.level = 90;
      foe.moves = [{ id: 'close-combat', pp: 5 }];
      const events = move(ctx);
      expect(ctx.party[0]!.hp).toBe(1);
      expect(said(events, 'is still here')).toBe(true);
      expect(ctx.battle.storyEffects).not.toContain('pm-endure:r');
      return true;
    });
  });

  it('PT1 needs it to be the last one standing', () => {
    for (let i = 0; i < 60; i++) {
      const { ctx } = fight(`pt1-two-${i}`, [mon('rattata', 30, 'r', ['splash'], 20), mon('pidgey', 30, 'p', ['tackle'])], [mon('caterpie', 5, 'c', ['string-shot'])]);
      expect(played(move(ctx), 'pt1-plain-and-stubborn')).toBe(false);
    }
  });

  it('PT6 Frozen in Place: Defence and Sp. Def up for two turns and it cannot be switched out meanwhile', () => {
    someSeed('pt6', (seed) => {
      const { ctx, battle } = fight(seed, [mon('snorunt', 30, 'i', ['splash'], 20), mon('pidgey', 30, 'p', ['tackle'], 0)], [mon('caterpie', 5, 'c', ['string-shot'])]);
      ctx.party[1]!.hp = 0;
      if (!played(move(ctx), 'pt6-frozen-in-place')) return false;
      expect(battle.playerStages.def).toBe(1);
      expect(battle.playerStages.spd).toBe(1);
      ctx.party[1]!.hp = 10;
      expect(switchProblem(ctx, 1)).toContain("won't give ground");
      move(ctx);
      move(ctx);
      move(ctx);
      expect(switchProblem(ctx, 1)).toBeNull();
      return true;
    });
  });

  it('PT7 One More Round: Resolute stops confusion and gives the next move +1 priority', () => {
    someSeed('pt7', (seed) => {
      const { ctx, battle } = fight(seed, [mon('machop', 30, 'f', ['splash'], 20)], [mon('caterpie', 5, 'c', ['string-shot'])]);
      if (!played(move(ctx), 'pt7-one-more-round')) return false;
      expect(battle.storyEffects).toContain('pm-noconfuse:f');
      expect(battle.storyEffects.some((t) => t.startsWith('pm-nextprio:f:'))).toBe(true);
      battle.enemyTeam[0]!.moves = [{ id: 'confuse-ray', pp: 10 }];
      move(ctx);
      expect(battle.playerVolatile.confusion).toBe(0);
      // The next-move priority is spent once the turn after it was set is over.
      expect(battle.storyEffects.some((t) => t.startsWith('pm-nextprio:f:'))).toBe(false);
      return true;
    });
  });

  it('PT9 Dig In: against a Flying-type ace, the first Ground move hits Flying-types; not in a wild battle', () => {
    const { ctx, battle } = fight('pt9', [mon('diglett', 50, 'd', ['mud-slap'])], [mon('pidgey', 20, 'p', ['splash']), mon('pidgeot', 40, 'po', ['splash'])]);
    const events = move(ctx);
    expect(played(events, 'ground-dig-in')).toBe(true);
    expect(battle.enemyTeam[0]!.hp).toBeLessThan(calcStats(content, battle.enemyTeam[0]!).hp);
    expect(battle.storyEffects).not.toContain('pm-groundflying:d');
    const wild = fight('pt9-wild', [mon('diglett', 50, 'd', ['mud-slap'])], [mon('pidgey', 20, 'p', ['splash'])], 'wild');
    expect(played(move(wild.ctx), 'ground-dig-in')).toBe(false);
  });

  it('PT11 It Saw This Coming names the ace (trainers only)', () => {
    someSeed('pt11', (seed) => {
      const { ctx } = fight(seed, [mon('abra', 30, 'a', ['splash'])], [mon('pidgey', 20, 'p', ['splash']), mon('pidgeot', 40, 'po', ['splash'])]);
      const events = move(ctx);
      if (!played(events, 'pt11-it-saw-this-coming')) return false;
      expect(said(events, 'the last one will be Pidgeot, Lv. 40')).toBe(true);
      return true;
    });
  });

  it('PT2 Embers Left: the next Fire-type sent in is Kindled (+50% Fire damage); a non-Fire one is not', () => {
    someSeed('pt2', (seed) => {
      const { ctx, battle } = fight(seed, [mon('vulpix', 20, 'v', ['splash'], 5), mon('pidgey', 20, 'p', ['tackle']), mon('growlithe', 20, 'g', ['ember'])], [mon('machamp', 60, 'm', ['close-combat'])], 'wild');
      const events = move(ctx);
      if (!played(events, 'pt2-embers-left')) return false;
      expect(battle.storyEffects).toContain('pm-kindlenext:fire:50');
      resolveTurn(ctx, { kind: 'switch', partyIndex: 1 });
      expect(battle.storyEffects.some((t) => t.startsWith('pm-kindled:p:'))).toBe(false);
      expect(battle.storyEffects).toContain('pm-kindlenext:fire:50');
      return true;
    });
  });

  it('PT14 Not Quite Gone: Haunting strikes the foe for up to three turns after it falls', () => {
    someSeed('pt14', (seed) => {
      const { ctx, battle } = fight(seed, [mon('gastly', 30, 'g', ['lick'], 5), mon('snorlax', 60, 's', ['splash'])], [mon('machop', 60, 'r', ['bite'])], 'wild');
      const events = move(ctx);
      if (!played(events, 'pt14-not-quite-gone')) return false;
      expect(battle.storyEffects.some((t) => t.startsWith('pm-haunt:g:'))).toBe(true);
      const before = battle.enemyTeam[0]!.hp;
      let strikes = 0;
      if (battle.needsSwitch) strikes += resolveTurn(ctx, { kind: 'switch', partyIndex: 1 }).filter((e) => e.type === 'raid' && e.text.includes('spirit strikes')).length;
      for (let t = 0; t < 5; t++) strikes += move(ctx).filter((e) => e.type === 'raid' && e.text.includes('spirit strikes')).length;
      expect(strikes).toBeGreaterThanOrEqual(1);
      expect(strikes).toBeLessThanOrEqual(3);
      expect(battle.enemyTeam[0]!.hp).toBeLessThan(before);
      expect(battle.storyEffects.some((t) => t.startsWith('pm-haunt:'))).toBe(false);
      return true;
    });
  });

  it('PT8 Spite in the Blood: knocked out by a contact move, the attacker is badly poisoned', () => {
    someSeed('pt8', (seed) => {
      const { ctx, battle } = fight(seed, [mon('grimer', 20, 'gr', ['splash'], 5), mon('snorlax', 60, 's', ['splash'])], [mon('rattata', 40, 'r', ['tackle'])], 'wild');
      if (!played(move(ctx), 'p2-spite-blood')) return false;
      expect(battle.enemyTeam[0]!.status).toMatchObject({ id: 'psn', bad: true });
      return true;
    });
  });

  it('PT16 Takes Advantage and PT3 The Tide Comes Back are end-of-turn checks', () => {
    someSeed('pt16', (seed) => {
      const { ctx, battle } = fight(seed, [mon('poochyena', 30, 'd', ['splash'])], [mon('rattata', 30, 'r', ['splash'])], 'wild');
      // The battle starts its foes at full HP, so the wound comes after.
      battle.enemyTeam[0]!.hp = Math.floor(calcStats(content, battle.enemyTeam[0]!).hp / 5);
      if (!played(move(ctx), 'pt16-takes-advantage')) return false;
      expect(battle.storyEffects.some((t) => t.startsWith('pm-nextprio:d:'))).toBe(true);
      return true;
    });
    const { ctx, battle } = fight('pt3', [mon('squirtle', 30, 'w', ['splash'], 50)], [mon('caterpie', 5, 'c', ['string-shot'])]);
    battle.weather = { id: 'rain', turns: 5 };
    const before = ctx.party[0]!.hp;
    expect(played(move(ctx), 'pt3-the-tide-comes-back')).toBe(true);
    expect(ctx.party[0]!.hp).toBeGreaterThan(before);
    expect(played(move(ctx), 'pt3-the-tide-comes-back')).toBe(false);
  });

  it('PT18 A Small Kindness: the next Pokémon sent in is Remembered (+10% stats but HP)', () => {
    someSeed('pt18', (seed) => {
      const { ctx, battle } = fight(seed, [mon('pidgey', 20, 'p', ['splash'], 5), mon('clefairy', 30, 'f', ['splash']), mon('snorlax', 60, 's', ['splash'])], [mon('machamp', 60, 'm', ['close-combat'])], 'wild');
      if (!played(move(ctx), 'pt18-a-small-kindness')) return false;
      // Whoever comes in next is Remembered, not only the Fairy-type.
      const events = resolveTurn(ctx, { kind: 'switch', partyIndex: 2 });
      expect(said(events, 'Remembered')).toBe(true);
      expect(battle.storyEffects).toContain('pm-remembered:s');
      expect(battle.storyEffects).not.toContain('pm-remembernext');
      return true;
    });
  });

  it('is repeatable: the same seed gives the same events', () => {
    const a = fight('rep', [mon('gastly', 30, 'g', ['lick'], 5), mon('snorlax', 60, 's', ['splash'])], [mon('rattata', 60, 'r', ['bite'])]);
    const b = fight('rep', [mon('gastly', 30, 'g', ['lick'], 5), mon('snorlax', 60, 's', ['splash'])], [mon('rattata', 60, 'r', ['bite'])]);
    expect(JSON.stringify(move(a.ctx))).toBe(JSON.stringify(move(b.ctx)));
  });
});

describe('pack type moments: rest', () => {
  it('PT4 Sunlight Through Leaves: every rest, Bond +1 and status cured', () => {
    let run = createRun(content, { runId: 'pt4', seed: 'pt4', archetypeId: 'red' });
    run = chooseStarter(content, run, 0);
    run.party = [mon('oddish', 20, 'o', ['absorb'])];
    run.party[0]!.status = { id: 'psn' };
    const before = run.party[0]!.friendship;
    const lines = restMoments(content, run);
    expect(lines.some((l) => l.includes('Sunlight Through Leaves'))).toBe(true);
    expect(run.party[0]!.status).toBeNull();
    expect(run.party[0]!.friendship).toBeGreaterThan(before);
    expect(restMoments(content, run).some((l) => l.includes('Sunlight Through Leaves'))).toBe(true);
  });
});

describe('pack archetype moments: run end (shared use, layer and Bond order)', () => {
  function wipe(seed: string, party: PokemonInstance[], foe = mon('machamp', 90, 'm', ['close-combat']), starterUid: string | null = null) {
    for (const p of party) p.hp = 1;
    const battle = createBattle('wild', [foe], 0, party[0]!.uid);
    const flags: MomentHooks['flags'] = {};
    const moments: MomentHooks = { seed, flags, cinematic: () => true, noteCinematic: () => undefined, runWouldEnd: () => true, starterUid };
    const ctx: BattleContext = { content, battle, party, inventory: {}, rng: new Rng(hashSeed(seed)), captureRng: new Rng(hashSeed(`${seed}c`)), catchMultiplier: 1, moments };
    return { ctx, battle, flags };
  }
  /** Knocks the whole party out with one strong hit per turn, until the battle ends or someone gets back up. */
  const fall = (ctx: BattleContext): BattleEvent[] => {
    const all: BattleEvent[] = [];
    for (let i = 0; i < 12 && !ctx.battle.outcome; i++) {
      if (ctx.battle.needsSwitch) {
        const next = ctx.party.findIndex((p) => p.hp > 0);
        if (next < 0) break;
        all.push(...resolveTurn(ctx, { kind: 'switch', partyIndex: next }));
      } else all.push(...move(ctx));
      if (all.some((e) => e.type === 'pmoment' && e.trigger === 'runEnd')) break;
    }
    return all;
  };

  it('PA16 The Mascots: back up at 25% HP with Speed +2 (doubled); the shared use is spent', () => {
    someSeed('pa16', (seed) => {
      const { ctx, battle, flags } = wipe(seed, [mon('pikachu', 30, 'pk', ['splash'])]);
      const events = fall(ctx);
      expect(flags['pm:runend-used']).toBe(1);
      if (!played(events, 'pa16-the-mascots')) return false;
      const pk = ctx.party[0]!;
      expect(pk.hp).toBe(Math.max(1, Math.floor(calcStats(content, pk).hp / 4)));
      expect(battle.playerStages.spe).toBe(2);
      expect(battle.outcome).toBeNull();
      return true;
    });
  });

  it('PA10 The Starters: only the chosen starter, at 1 HP and Resolute', () => {
    someSeed('pa10', (seed) => {
      const { ctx, battle } = wipe(seed, [mon('bulbasaur', 30, 'st', ['splash'])], undefined, 'st');
      const events = fall(ctx);
      if (!played(events, 'pa10-the-starters')) return false;
      expect(ctx.party[0]!.hp).toBe(1);
      expect(battle.storyEffects).toContain('pm-noconfuse:st');
      return true;
    });
    for (let i = 0; i < 40; i++) {
      const { ctx } = wipe(`pa10-not-${i}`, [mon('bulbasaur', 30, 'st', ['splash'])], undefined, 'someone-else');
      expect(played(fall(ctx), 'pa10-the-starters')).toBe(false);
    }
  });

  it('only one revival per run: after one roll the next wipe has none', () => {
    const { ctx, flags } = wipe('once', [mon('pikachu', 30, 'pk', ['splash'])]);
    fall(ctx);
    expect(flags['pm:runend-used']).toBe(1);
    const again = wipe('once-2', [mon('pikachu', 30, 'pk2', ['splash'])]);
    again.ctx.moments!.flags['pm:runend-used'] = 1;
    expect(fall(again.ctx).some((e) => e.type === 'pmoment' && e.trigger === 'runEnd')).toBe(false);
  });

  it('PA13 The Weight of the World: never against its own trio', () => {
    for (let i = 0; i < 60; i++) {
      const { ctx } = wipe(`pa13-${i}`, [mon('zapdos', 50, 'z', ['splash'])], mon('articuno', 90, 'a', ['ice-beam']));
      expect(played(fall(ctx), 'pa13-the-weight-of-the-world')).toBe(false);
    }
    someSeed('pa13-ok', (seed) => {
      const { ctx } = wipe(seed, [mon('zapdos', 50, 'z', ['splash'])], mon('golem', 90, 'g', ['rock-slide']));
      const events = fall(ctx);
      if (!played(events, 'pa13-the-weight-of-the-world')) return false;
      expect(ctx.party[0]!.hp).toBe(Math.floor(calcStats(content, ctx.party[0]!).hp / 2));
      return true;
    });
  });

  it('a higher-Bond starter goes before the machine (PA10 over PA1); a tie keeps PA1 first', () => {
    const order = (bond: number): string[] => {
      const party = [mon('rotom', 30, 'ro', ['splash']), mon('pichu', 30, 'st', ['splash'])];
      party[1]!.friendship = bond;
      // Rotom is part Ghost, so the foe bites.
      const { ctx } = wipe('order', party, mon('machamp', 90, 'm', ['crunch']), 'st');
      const seen: string[] = [];
      const flags = ctx.moments!.flags;
      const proxy = new Proxy(flags, { set: (t, k, v) => { if (typeof k !== 'string') return false; if (k.startsWith('pm:') && k !== 'pm:runend-used') seen.push(k); (t as Record<string, unknown>)[k] = v; return true; } });
      ctx.moments!.flags = proxy;
      fall(ctx);
      return seen;
    };
    const low = order(0);
    expect(low[0]).toContain('failure-not-tolerated');
    const high = order(255);
    expect(high[0]).toMatch(/pa10-the-starters|pa16-the-mascots/);
  });
});

describe('pack archetype moments: battle', () => {
  it('PA8 The Pack: with two pack Pokémon each gets +5% stats (Speed shows it)', () => {
    const { ctx, battle } = fight('pa8', [mon('poochyena', 30, 'a', ['splash']), mon('houndour', 30, 'b', ['splash'])], [mon('caterpie', 5, 'c', ['string-shot'])], 'wild');
    expect(played(move(ctx), 'pa8-the-pack')).toBe(true);
    expect(battle.storyEffects).toContain('pm-statpct:a:5');
    expect(battle.storyEffects).toContain('pm-statpct:b:5');
    const solo = fight('pa8-solo', [mon('poochyena', 30, 'a', ['splash'])], [mon('caterpie', 5, 'c', ['string-shot'])], 'wild');
    expect(played(move(solo.ctx), 'pa8-the-pack')).toBe(false);
  });

  it('PA12 Out of Time: facing its own counterpart, Protosynthesis turns on', () => {
    const { ctx, battle } = fight('pa12', [mon('great-tusk', 50, 'gt', ['splash'])], [mon('donphan', 50, 'd', ['splash'])], 'wild');
    expect(played(move(ctx), 'pa12-out-of-time')).toBe(true);
    expect(battle.storyEffects).toContain('pm-paradox:gt');
    const other = fight('pa12-no', [mon('great-tusk', 50, 'gt', ['splash'])], [mon('phanpy', 50, 'd', ['splash'])], 'wild');
    expect(played(move(other.ctx), 'pa12-out-of-time')).toBe(false);
  });

  it('PA5 Older Than the Map: the first super-effective hit is cut by a quarter, then the cut is spent', () => {
    someSeed('pa5', (seed) => {
      const { ctx, battle } = fight(seed, [mon('kabuto', 40, 'k', ['splash'])], [mon('oddish', 30, 'o', ['absorb'])], 'wild');
      const events = move(ctx);
      if (!played(events, 'pa5-older-than-the-map')) return false;
      expect(battle.storyEffects.some((t) => t.startsWith('pm-supercut:k:'))).toBe(false);
      return true;
    });
  });

  it('PA7 Playing Dead: back up at a quarter HP, once per run for that Pokémon', () => {
    someSeed('pa7', (seed) => {
      const { ctx } = fight(seed, [mon('zorua', 20, 'z', ['splash']), mon('snorlax', 60, 's', ['splash'])], [mon('machamp', 80, 'm', ['close-combat'])], 'wild');
      const events = move(ctx);
      if (!played(events, 'pa7-playing-dead')) return false;
      expect(ctx.party[0]!.hp).toBeGreaterThan(1);
      expect(ctx.moments!.flags['pm:pa7-playing-dead@z']).toBe(1);
      return true;
    });
  });

  it('PA3 Set in Stone: the next ally sent in is Guarded with Defence +1, and the guardian takes its next hit', () => {
    someSeed('pa3', (seed) => {
      const party = [mon('pidgey', 20, 'p', ['splash'], 5), mon('sudowoodo', 50, 'su', ['splash']), mon('snorlax', 60, 's', ['splash'])];
      const { ctx, battle } = fight(seed, party, [mon('machamp', 60, 'm', ['close-combat'])], 'wild');
      if (!played(move(ctx), 'pa3-set-in-stone')) return false;
      resolveTurn(ctx, { kind: 'switch', partyIndex: 2 });
      expect(battle.storyEffects).toContain('pm-guarded:s:su');
      expect(battle.playerStages.def).toBe(1);
      const snorlaxHp = ctx.party[2]!.hp;
      const guardHp = ctx.party[1]!.hp;
      const events = move(ctx);
      expect(said(events, 'takes the hit')).toBe(true);
      expect(ctx.party[2]!.hp).toBe(snorlaxHp);
      expect(ctx.party[1]!.hp).toBeLessThan(guardHp);
      return true;
    });
  });

  it('PA15 Sleeping Giants: a giant on the bench takes the knockout hit', () => {
    someSeed('pa15', (seed) => {
      const { ctx } = fight(seed, [mon('pidgey', 20, 'p', ['splash'], 5), mon('snorlax', 60, 's', ['splash'])], [mon('rattata', 40, 'r', ['tackle'])], 'wild');
      const events = move(ctx);
      if (!played(events, 'pa15-sleeping-giants')) return false;
      expect(ctx.party[0]!.hp).toBeGreaterThan(0);
      expect(ctx.party[1]!.hp).toBeLessThan(calcStats(content, ctx.party[1]!).hp);
      return true;
    });
  });
});

describe('pack archetype moments: milestones, camp and gifts (batch 2b)', () => {
  const runWith = (id: string, party: PokemonInstance[]) => {
    let run = createRun(content, { runId: id, seed: id, archetypeId: 'red' });
    run = chooseStarter(content, run, 0);
    run.party = party;
    return run;
  };
  const withFlags = (seed: string, party: PokemonInstance[], enemies: PokemonInstance[], flags: Record<string, number>) => {
    const f = fight(seed, party, enemies, 'wild');
    f.ctx.moments!.flags = flags;
    return f;
  };

  it('PA4 The Little Ones: a baby facing a foe 15+ levels higher is noted brave when it lands a move; not against an even foe', () => {
    const { ctx, battle } = withFlags('pa4', [mon('pichu', 10, 'p', ['thunder-shock'])], [mon('geodude', 30, 'g', ['splash'])], {});
    const events = move(ctx);
    expect(played(events, 'pa4-the-little-ones')).toBe(true);
    expect(played(events, 'pa4-the-little-ones-grown')).toBe(false);
    const even = withFlags('pa4-even', [mon('pichu', 10, 'p', ['thunder-shock'])], [mon('rattata', 20, 'r', ['splash'])], {});
    expect(played(move(even.ctx), 'pa4-the-little-ones')).toBe(false);
    expect(battle.storyEffects.some((t) => t.startsWith('pm-brave-hit:p'))).toBe(false); // Ground: the shock did not land
    const lands = withFlags('pa4-hit', [mon('pichu', 10, 'p', ['thunder-shock'])], [mon('pidgeotto', 30, 'w', ['splash'])], {});
    move(lands.ctx);
    expect(lands.battle.storyEffects.some((t) => t.startsWith('pm-brave-hit:p'))).toBe(true);
  });

  it('PA4 grown: after three brave battles it plays Resolute instead of hiding', () => {
    const { ctx } = withFlags('pa4-grown', [mon('pichu', 10, 'p', ['thunder-shock'])], [mon('pidgeotto', 30, 'w', ['splash'])], { 'pm-brave-count:p': 3 });
    const events = move(ctx);
    expect(played(events, 'pa4-the-little-ones-grown')).toBe(true);
    expect(played(events, 'pa4-the-little-ones')).toBe(false);
  });

  it('PA6 The Slow Road: reaching the final form gives Bond once; a middle form does not', () => {
    const drago = mon('dragonite', 55, 'd', ['tackle']);
    const run = runWith('pa6', [drago]);
    const before = drago.friendship;
    expect(evolveMoments(content, run, drago, 'dragonair').some((l) => l.includes('The Slow Road'))).toBe(true);
    expect(drago.friendship).toBeGreaterThan(before);
    expect(evolveMoments(content, run, drago, 'dragonair')).toEqual([]);
    const mid = mon('dragonair', 30, 'm', ['tackle']);
    expect(evolveMoments(content, runWith('pa6-mid', [mid]), mid, 'dratini')).toEqual([]);
  });

  it('PA9 What It Becomes: out of a cocoon held a full stage, +1 effort in every stat; straight through, nothing', () => {
    const pod = mon('metapod', 10, 'c', ['harden']);
    const run = runWith('pa9', [pod]);
    noteCocoon(run, pod);
    run.regionIndex += 1; // a later stage
    pod.speciesId = 'butterfree';
    expect(evolveMoments(content, run, pod, 'metapod').some((l) => l.includes('What It Becomes'))).toBe(true);
    expect(pod.evs?.atk).toBe(1);
    expect(pod.evs?.spe).toBe(1);
    const quick = mon('metapod', 10, 'q', ['harden']);
    const r2 = runWith('pa9-quick', [quick]);
    noteCocoon(r2, quick);
    quick.speciesId = 'butterfree';
    expect(evolveMoments(content, r2, quick, 'metapod')).toEqual([]);
  });

  it('PA11 Not From Here: the camp scene needs an Ultra Beast and names it; after three nights its Beast Boost fires at battle start', () => {
    const run = runWith('pa11', [mon('pikachu', 30, 'k', ['tackle']), mon('buzzwole', 50, 'b', ['tackle'])]);
    const c = { kind: 'partyGroup', group: 'ultra-beasts', atLeast: 1 } as const;
    expect(conditionMet(content, run, c)).toBe(true);
    expect(conditionText(content, c)).toContain('ultra beasts');
    expect(fillCoText(content, run, '{group:ultra-beasts} looks up.')).toBe('Buzzwole looks up.');
    run.party = [mon('pikachu', 30, 'k', ['tackle'])];
    expect(conditionMet(content, run, c)).toBe(false);
    const ev = content.events.get('pa11-not-from-here')!;
    expect(ev.room).toBe(true); // never drawn on its own: the rest moment opens it
    expect(ev.requires.some((r) => r.kind === 'partyGroup')).toBe(true);
    const asleep = withFlags('pa11-b', [mon('buzzwole', 50, 'b', ['splash'])], [mon('caterpie', 5, 'c', ['string-shot'])], { 'pa11-sleeps': 1 });
    expect(played(move(asleep.ctx), 'pa11-sleeps-by-the-fire')).toBe(true);
    const awake = withFlags('pa11-a', [mon('buzzwole', 50, 'b', ['splash'])], [mon('caterpie', 5, 'c', ['string-shot'])], {});
    expect(played(move(awake.ctx), 'pa11-sleeps-by-the-fire')).toBe(false);
  });

  it('PA11 at a healing stop: the rest moment opens the scene beside the stop, until it sleeps by the fire', () => {
    let opened = 0;
    for (let i = 0; i < 40; i++) {
      let run = createRun(content, { runId: `pa11r-${i}`, seed: `pa11r-${i}`, archetypeId: 'red' });
      run = chooseStarter(content, run, 0);
      run.party = [mon('buzzwole', 50, 'b', ['tackle'])];
      const here = run.stage!.map.nodes[1]!;
      run.stage!.current = here.id;
      const lines = restMoments(content, run);
      const side = here.sides.some((x) => x.kind === 'event' && x.eventId === 'pa11-not-from-here');
      expect(side).toBe(lines.some((l) => l.includes('Not From Here')));
      if (side) opened += 1;
      run.story.flags['pa11-sleeps'] = 1;
      expect(restMoments(content, run).some((l) => l.includes('Not From Here'))).toBe(false);
    }
    expect(opened).toBeGreaterThan(2);
    expect(opened).toBeLessThan(20);
  });

  it('PA14 The Promised Ones: a kept promise brings its item once per region; no promise, nothing', () => {
    const mew = mon('mew', 40, 'mw', ['pound']);
    const run = runWith('pa14', [mew]);
    expect(restMoments(content, run).some((l) => l.includes('The Promised Ones'))).toBe(false);
    run.story.histories[mew.uid] = { ...(run.story.histories[mew.uid] ?? {}), hyper: { 'promise-kept': 1 } } as never;
    expect(restMoments(content, run).some((l) => l.includes('The Promised Ones'))).toBe(true);
    expect(run.inventory.leftovers).toBe(1);
    expect(restMoments(content, run).some((l) => l.includes('The Promised Ones'))).toBe(false);
    run.regionIndex += 1;
    expect(restMoments(content, run).some((l) => l.includes('The Promised Ones'))).toBe(true);
    expect(run.inventory.leftovers).toBe(2);
  });
});
