import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, switchProblem, type BattleContext, type BattleEvent } from '../../src/core/battle/engine';
import { pokemonMoment, type MomentHooks } from '../../src/core/moments/pokemonMoments';
import { restMoments } from '../../src/core/moments/runMoments';
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
