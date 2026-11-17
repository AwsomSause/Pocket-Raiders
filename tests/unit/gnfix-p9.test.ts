// Greenneedle doc fixes (events gn.new.20-38): the abilities and items whose rules changed to match the design doc.
import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, type BattleContext, type BattleEvent } from '../../src/core/battle/engine';
import { heldStatMultiplier } from '../../src/core/battle/held';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { TAILWIND_HEART } from '../../src/core/greenneedle/daycare';
import { content } from './helpers';
import { choose, flagOf, gnRun, open, win } from './helpers/gnPlay';

function fight(seed: string, party: ReturnType<typeof createPokemon>[], foeId: string, foeMove: string, extra: Partial<BattleContext> = {}) {
  const foe = createPokemon(content, foeId, 40, 'e1');
  foe.moves = [{ id: foeMove, pp: 40 }];
  const battle = createBattle('wild', [foe], 0, party[0]!.uid);
  const ctx: BattleContext = { content, battle, party, inventory: {}, rng: new Rng(hashSeed(seed)), captureRng: new Rng(hashSeed(`${seed}-c`)), catchMultiplier: 1, ...extra };
  return { ctx, battle, foe };
}
const firstMover = (events: BattleEvent[]): string | undefined => {
  const e = events.find((x) => x.type === 'move');
  return e && e.type === 'move' ? e.side : undefined;
};

describe('Foster Wing (gn.new.37) is an ability', () => {
  const team = (hurt: boolean) => {
    const ally = createPokemon(content, 'snorlax', 40, 'a1');
    if (hurt) ally.hp = Math.floor(maxHp(content, ally) / 2) - 1;
    const bird = createPokemon(content, 'fletchinder', 40, 'b1');
    bird.fixedAbility = 'foster-wing';
    return [ally, bird];
  };
  it('sent in for an ally under half HP: Defense rises one stage, once a battle', () => {
    const party = team(true);
    const { ctx, battle } = fight('fw-a', party, 'magikarp', 'splash');
    resolveTurn(ctx, { kind: 'switch', partyIndex: 1 });
    expect(battle.playerStages.def).toBe(1);
    expect(battle.storyEffects).toContain('foster-wing-used');
    resolveTurn(ctx, { kind: 'switch', partyIndex: 0 });
    resolveTurn(ctx, { kind: 'switch', partyIndex: 1 });
    expect(battle.playerStages.def).toBe(0);
  });
  it('boundary: an ally at half HP or more gets no cover', () => {
    const party = team(false);
    party[0]!.hp = Math.ceil(maxHp(content, party[0]!) / 2);
    const { ctx, battle } = fight('fw-b', party, 'magikarp', 'splash');
    resolveTurn(ctx, { kind: 'switch', partyIndex: 1 });
    expect(battle.playerStages.def).toBe(0);
    expect(battle.storyEffects).not.toContain('foster-wing-used');
  });
  it('a Fletchinder without the ability does nothing', () => {
    const party = team(true);
    party[1]!.fixedAbility = undefined;
    const { ctx, battle } = fight('fw-c', party, 'magikarp', 'splash');
    resolveTurn(ctx, { kind: 'switch', partyIndex: 1 });
    expect(battle.playerStages.def).toBe(0);
  });
});

describe('Guiding Light (gn.new.36): its accuracy cannot be lowered', () => {
  it('Sand Attack does not lower a holder; it lowers anyone else', () => {
    const lit = createPokemon(content, 'chinchou', 40, 'c1');
    lit.fixedAbility = 'guiding-light';
    lit.moves = [{ id: 'splash', pp: 40 }];
    const a = fight('gl-a', [lit], 'pidgey', 'sand-attack');
    resolveTurn(a.ctx, { kind: 'move', index: 0 });
    expect(a.battle.playerStages.acc).toBe(0);
    const plain = createPokemon(content, 'chinchou', 40, 'c2');
    plain.fixedAbility = 'volt-absorb';
    plain.moves = [{ id: 'splash', pp: 40 }];
    const b = fight('gl-a', [plain], 'pidgey', 'sand-attack');
    resolveTurn(b.ctx, { kind: 'move', index: 0 });
    expect(b.battle.playerStages.acc).toBe(-1);
  });
});

describe('Little Cup (gn.new.27): Defense and Sp. Def +30% on a first-stage Pokémon only', () => {
  const mult = (species: string, stat: 'atk' | 'def' | 'spd') => {
    const mon = createPokemon(content, species, 20, 'm1');
    mon.held = { 'little-cup': 1 };
    return heldStatMultiplier({ content }, mon, 'player', stat);
  };
  it('first stage: both defences up, nothing else', () => {
    expect(mult('pidgey', 'def')).toBeCloseTo(1.3);
    expect(mult('pidgey', 'spd')).toBeCloseTo(1.3);
    expect(mult('pidgey', 'atk')).toBe(1);
  });
  it('an evolved holder gets nothing', () => {
    expect(mult('pidgeotto', 'def')).toBe(1);
    expect(mult('pidgeot', 'spd')).toBe(1);
  });
});

describe('Thundermark (gn.new.32): a team charm; Electric-types act first on turn one in rain', () => {
  const setup = (seed: string, species: string, rain: boolean, charm: boolean) => {
    const mon = createPokemon(content, species, 20, 'p1');
    mon.moves = [{ id: 'tackle', pp: 35 }];
    const f = fight(seed, [mon], 'ninjask', 'tackle', charm ? { teamItems: { thundermark: 1 } } : {});
    if (rain) f.battle.weather = { id: 'rain', turns: 5 };
    return f;
  };
  it('a slow Electric-type moves before a fast foe on turn one, and not on turn two', () => {
    const f = setup('tm-a', 'ampharos', true, true);
    expect(firstMover(resolveTurn(f.ctx, { kind: 'move', index: 0 }))).toBe('player');
    if (!f.battle.outcome) expect(firstMover(resolveTurn(f.ctx, { kind: 'move', index: 0 }))).toBe('enemy');
  });
  it('no rain, no charm, or not Electric: the foe is faster', () => {
    expect(firstMover(resolveTurn(setup('tm-b', 'ampharos', false, true).ctx, { kind: 'move', index: 0 }))).toBe('enemy');
    expect(firstMover(resolveTurn(setup('tm-c', 'ampharos', true, false).ctx, { kind: 'move', index: 0 }))).toBe('enemy');
    expect(firstMover(resolveTurn(setup('tm-d', 'snorlax', true, true).ctx, { kind: 'move', index: 0 }))).toBe('enemy');
  });
});

describe('Tailwind Heart (gn.new.33): works when its holder led the battle', () => {
  it('the ally sent in after the leading holder gains a stage of Speed, once', () => {
    const lead = createPokemon(content, 'pidgeot', 40, 'h1');
    lead.gn = [TAILWIND_HEART];
    const ally = createPokemon(content, 'snorlax', 40, 'a1');
    const { ctx, battle } = fight('th-a', [lead, ally], 'magikarp', 'splash');
    resolveTurn(ctx, { kind: 'switch', partyIndex: 1 });
    expect(battle.playerStages.spe).toBe(1);
    expect(battle.storyEffects).toContain('th-used');
  });
});

describe('The Old Courier (gn.new.33): no hidden roll on the sea approach', () => {
  const D = 'gn-new-33-door';
  const toSea = (seed: string, storm: string) => {
    let run = gnRun(seed);
    open(run, D);
    run = choose(run, D, "I'll come.").run;
    run = win(choose(run, 'gn-new-33-foothills', 'Fight from its back.').run);
    return choose(run, 'gn-new-33-storm', storm).run;
  };
  it('having gone Over, "You can do this." always ends with it set down; any other way it makes the door', () => {
    for (const seed of ['oc-1', 'oc-2', 'oc-3']) {
      expect(flagOf(choose(toSea(seed, 'Over.'), 'gn-new-33-sea', 'You can do this.').run, 'courier-down')).toBe(1);
      expect(flagOf(choose(toSea(seed, 'Through.'), 'gn-new-33-sea', 'You can do this.').run, 'courier-down')).toBe(0);
    }
  });
});
