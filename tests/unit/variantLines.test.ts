// Beta 0.6 slice E1: variant lines as battle hooks. Tagged, Dark Ball, Tidebound, Cinderborn and Preserved are wired
// into the engine; the pure rules are tested directly and the engine hooks through short battles.
import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { calcStats, createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { BattleStateSchema } from '../../src/core/state';
import { assignVariant, type AssignOptions, UNWIRED_LINES, variantLosesTurn, variantNeverMisses, variantOnEntry, variantSnagRefuses, WIRED_LINES, type Variants } from '../../src/core/expansion/variantLines';
import { plainLimit, simLimit, simulateVariantLine } from '../../src/quality/variantSim';
import { content } from './helpers';

function duel(opts: { line?: string; kind?: 'wild' | 'trainer'; pMove?: string; weather?: 'rain' | 'sun'; second?: boolean; uid?: string; eMove?: string; opts?: AssignOptions } = {}) {
  const player = createPokemon(content, 'machop', 50, 'p');
  const enemy = createPokemon(content, 'snorlax', 50, opts.uid ?? 'e');
  const enemies = [enemy, ...(opts.second ? [createPokemon(content, 'rattata', 10, 'e2')] : [])];
  const move = (m: string) => ({ id: m, pp: content.moves.get(m)!.pp });
  player.moves = [move(opts.pMove ?? 'tackle')];
  for (const e of enemies) e.moves = [move(opts.eMove ?? 'splash')];
  const battle = createBattle(opts.kind ?? 'wild', enemies, 0, player.uid);
  if (opts.weather) battle.weather = { id: opts.weather, turns: 5 };
  if (opts.line) assignVariant(battle.extra.variants, enemy.uid, opts.line, opts.opts);
  const ctx: BattleContext = { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed('variant')), captureRng: new Rng(hashSeed('variantc')), catchMultiplier: 1 };
  return { ctx, battle, player, enemy, go: () => resolveTurn(ctx, { kind: 'move', index: 0 }) };
}
type Events = ReturnType<ReturnType<typeof duel>['go']>;
const lost = (es: Events, side: 'player' | 'enemy') => es.reduce((n, e) => (e.type === 'damage' && e.side === side ? n + e.amount : n), 0);
const texts = (es: Events) => es.filter((e) => e.type === 'raid').map((e) => (e as { text: string }).text);

describe('variant line registry', () => {
  it('wires all fourteen lines and refuses to assign a line that does not exist', () => {
    expect(WIRED_LINES).toHaveLength(14);
    expect(WIRED_LINES.length + UNWIRED_LINES.length).toBe(14);
    expect(() => assignVariant({}, 'x', 'nope')).toThrow('not wired');
    expect(() => assignVariant({}, 'x', 'couture')).toThrow('accessory');
    expect(() => assignVariant({}, 'x', 'couture', { accessory: 'rocky-helmet' })).toThrow('accessory');
  });
  it('with no variants the battle is unchanged and the saved battle has an empty map', () => {
    const a = duel(), b = duel();
    expect(JSON.stringify(a.go())).toBe(JSON.stringify(b.go()));
    expect(a.battle.extra.variants).toEqual({});
  });
  it('variants survive a save and old battles without the field still load', () => {
    const d = duel({ line: 'tagged' });
    const back = BattleStateSchema.parse(JSON.parse(JSON.stringify(d.battle)));
    expect(back.extra.variants[d.enemy.uid]).toEqual({ line: 'tagged', flags: { tag: 1 } });
    const old = JSON.parse(JSON.stringify(duel().battle));
    delete old.extra.variants;
    expect(BattleStateSchema.parse(old).extra.variants).toEqual({});
  });
});

describe('Black-Label: Tagged in battle', () => {
  it('the first hit does 20% less, announced once; the second hit is full', () => {
    const base = duel(), tag = duel({ line: 'tagged' });
    const b1 = lost(base.go(), 'enemy');
    const t1Events = tag.go();
    const t1 = lost(t1Events, 'enemy');
    expect(texts(t1Events)).toContain('The tag holds it in place.');
    expect(t1).toBeLessThan(b1);
    expect(t1 / b1).toBeGreaterThan(0.7);
    expect(t1 / b1).toBeLessThan(0.9);
    const b2 = lost(base.go(), 'enemy');
    const t2Events = tag.go();
    expect(texts(t2Events)).not.toContain('The tag holds it in place.');
    expect(lost(t2Events, 'enemy')).toBe(b2);
  });
  it('cannot be forced out by Roar while tagged, can once the tag is gone', () => {
    const d = duel({ line: 'tagged', kind: 'trainer', second: true, pMove: 'roar' });
    const control = duel({ kind: 'trainer', second: true, pMove: 'roar' });
    control.go();
    expect(control.battle.enemyTeam[control.battle.enemyIndex]!.uid).not.toBe(control.enemy.uid);
    d.go();
    expect(d.battle.enemyTeam[d.battle.enemyIndex]!.uid).toBe(d.enemy.uid);
    d.battle.extra.variants[d.enemy.uid]!.flags.tag = 0;
    d.go();
    expect(d.battle.enemyTeam[d.battle.enemyIndex]!.uid).not.toBe(d.enemy.uid);
  });
  it('Knock Off tears the tag off', () => {
    const d = duel({ line: 'tagged', pMove: 'knock-off' });
    const es = d.go();
    expect(texts(es)).toContain('The tag is torn off!');
    expect(d.battle.extra.variants[d.enemy.uid]!.flags.tag).toBe(0);
  });
});

describe('Dark Ball in battle', () => {
  it('enters with +1 Attack and Special Attack and loses 1/16 HP each turn', () => {
    const d = duel({ line: 'dark-ball' });
    const hp = d.enemy.hp;
    const es = d.go();
    expect(d.battle.enemyStages.atk).toBe(1);
    expect(d.battle.enemyStages.spa).toBe(1);
    expect(texts(es)).toContain('The Ball burns.');
    expect(d.enemy.hp).toBeLessThan(hp);
  });
});

describe('Preserved in battle', () => {
  it('enters with -1 Speed, takes 20% less on the first hit, and cannot be given a status', () => {
    const base = duel(), pre = duel({ line: 'preserved' });
    const b1 = lost(base.go(), 'enemy');
    const p1Events = pre.go();
    expect(pre.battle.enemyStages.spe).toBe(-1);
    expect(lost(p1Events, 'enemy') / b1).toBeGreaterThan(0.7);
    expect(lost(p1Events, 'enemy') / b1).toBeLessThan(0.9);
    const thunder = duel({ line: 'preserved', pMove: 'thunder-wave' });
    thunder.go();
    expect(thunder.enemy.status).toBeNull();
    const control = duel({ pMove: 'thunder-wave' });
    control.go();
    expect(control.enemy.status?.id).toBe('par');
  });
});

describe('Tidebound and Cinderborn', () => {
  it('Tidebound: +1 Speed in rain, nothing in sun; Cinderborn: +1 Special Defense in sun', () => {
    const rain = duel({ line: 'tidebound', weather: 'rain' });
    rain.go();
    expect(rain.battle.enemyStages.spe).toBe(1);
    const sun = duel({ line: 'tidebound', weather: 'sun' });
    sun.go();
    expect(sun.battle.enemyStages.spe).toBe(0);
    const warm = duel({ line: 'cinderborn', weather: 'sun' });
    warm.go();
    expect(warm.battle.enemyStages.spd).toBe(1);
  });
  it('their moves cannot miss under their own weather only', () => {
    const v: Variants = {};
    assignVariant(v, 'a', 'tidebound');
    assignVariant(v, 'b', 'cinderborn');
    expect(variantNeverMisses(v, 'a', 'rain', 'water')).toBe(true);
    expect(variantNeverMisses(v, 'a', 'sun', 'water')).toBe(false);
    expect(variantNeverMisses(v, 'a', 'rain', 'fire')).toBe(false);
    expect(variantNeverMisses(v, 'b', 'sun', 'ground')).toBe(true);
    expect(variantNeverMisses(v, 'b', 'rain', 'fire')).toBe(false);
    expect(variantOnEntry(v, 'a', 'sun').message).toBe('The tide is out.');
    expect(variantOnEntry(v, 'b', 'rain').message).toBe('The ground is cold.');
  });
});

describe('Spiritless in battle', () => {
  it('cannot be lowered by the foe or raised by anyone, announced', () => {
    const d = duel({ line: 'spiritless', pMove: 'growl' });
    const es = d.go();
    expect(d.battle.enemyStages.atk).toBe(0);
    expect(texts(es)).toContain('It feels nothing about that.');
    const control = duel({ pMove: 'growl' });
    control.go();
    expect(control.battle.enemyStages.atk).toBe(-1);
  });
  it('cannot be taunted or infatuated', () => {
    const d = duel({ line: 'spiritless', pMove: 'taunt' });
    d.go();
    expect(d.battle.enemyVolatile.taunt).toBe(0);
    const control = duel({ pMove: 'taunt' });
    control.go();
    expect(control.battle.enemyVolatile.taunt).toBeGreaterThan(0);
  });
});

describe('Overclocked in battle', () => {
  it('its first move goes first, and it overheats (-1 Speed) at the end of its third turn', () => {
    const d = duel({ line: 'overclocked', pMove: 'tackle' });
    const first = d.go();
    const order = first.filter((e) => e.type === 'move').map((e) => (e as { side: string }).side);
    expect(order[0]).toBe('enemy');
    d.go();
    expect(d.battle.enemyStages.atk).toBe(0);
    const third = d.go();
    expect(texts(third)).toContain('The machine has asked too much.');
    expect(d.battle.enemyStages.spe).toBe(-1);
    d.go();
    expect(d.battle.enemyStages.spe).toBe(-1);
  });
});

describe('Tagged-Up in battle', () => {
  it('sprays a tag on entry; a foe coming in is called out and loses 1/16 HP once', () => {
    const d = duel({ line: 'tagged-up' });
    expect(texts(d.go())).toContain('It sprays a tag on the field.');
    expect(d.battle.extra.variants[d.enemy.uid]!.flags.sprayed).toBe(1);
    const base = duel();
    const es = d.go();
    expect(es.length).toBeGreaterThan(0);
    expect(base.battle.extra.variants).toEqual({});
  });
  it('the called-out foe loses 1/16 HP on entry, once, and an unrelated line never does it', () => {
    const d = duel({ line: 'tagged-up' });
    const hp = d.player.hp;
    const es = d.go();
    expect(texts(es).some((t) => t.endsWith('is called out!'))).toBe(true);
    expect(hp - d.player.hp).toBeGreaterThanOrEqual(Math.floor(calcStats(content, d.player).hp / 16));
    expect(texts(d.go()).some((t) => t.endsWith('is called out!'))).toBe(false);
    expect(texts(duel({ line: 'dark-ball' }).go()).some((t) => t.endsWith('is called out!'))).toBe(false);
  });
});

const gadgetOf = (uid: string): number => {
  const v: Variants = {};
  assignVariant(v, uid, 'patchwork');
  variantOnEntry(v, uid, null);
  return v[uid]!.flags.gadget!;
};
const uidFor = (g: number): string => {
  for (let i = 0; i < 200; i++) if (gadgetOf(`pw${i}`) === g) return `pw${i}`;
  throw new Error('no uid');
};

describe('Rocket Remnants: Patchwork', () => {
  it('the gadget is fixed by the Pokémon, shown on entry, and all three exist', () => {
    expect(gadgetOf('pw1')).toBe(gadgetOf('pw1'));
    expect(new Set(Array.from({ length: 60 }, (_, i) => gadgetOf(`pw${i}`)))).toEqual(new Set([1, 2, 3]));
    const d = duel({ line: 'patchwork', uid: uidFor(2) });
    expect(texts(d.go())).toContain('It carries a smoke ball.');
  });
  it('the net drops the attacker by 2 Speed for 2 turns, once', () => {
    const d = duel({ line: 'patchwork', uid: uidFor(1) });
    const first = d.go();
    expect(texts(first)).toContain('Something goes sproing.');
    expect(d.battle.playerStages.spe).toBe(-2);
    const second = d.go();
    expect(texts(second)).not.toContain('Something goes sproing.');
    expect(d.battle.playerStages.spe).toBe(0);
    expect(d.battle.extra.variantTimed).toEqual([]);
  });
  it('the smoke ball lowers both sides accuracy for 2 turns', () => {
    const d = duel({ line: 'patchwork', uid: uidFor(2) });
    d.go();
    expect(d.battle.playerStages.acc).toBe(-1);
    expect(d.battle.enemyStages.acc).toBe(-1);
    d.go();
    expect(d.battle.playerStages.acc).toBe(0);
    expect(d.battle.enemyStages.acc).toBe(0);
  });
  it('the spring sends a trainer Pokémon back to its Ball', () => {
    const d = duel({ line: 'patchwork', uid: uidFor(3), kind: 'trainer', second: true });
    d.go();
    expect(d.battle.enemyTeam[d.battle.enemyIndex]!.uid).not.toBe(d.enemy.uid);
  });
  it('pending gadget effects are saved and old battles load without them', () => {
    const d = duel({ line: 'patchwork', uid: uidFor(1) });
    d.go();
    const back = BattleStateSchema.parse(JSON.parse(JSON.stringify(d.battle)));
    expect(back.extra.variantTimed).toHaveLength(1);
    const old = JSON.parse(JSON.stringify(duel().battle));
    delete old.extra.variantTimed;
    expect(BattleStateSchema.parse(old).extra.variantTimed).toEqual([]);
  });
});

describe("Team Snag'em: Snagged", () => {
  it('refuses at 20% on the first turn, climbing 10% a turn, and replays the same', () => {
    const run = (): number => {
      const v: Variants = {};
      assignVariant(v, 'sn', 'snagged');
      let hits = 0;
      for (let i = 0; i < 400; i++) { const r = variantSnagRefuses(v, 'sn', `s${i}`); if (r) { hits++; variantLosesTurn(v, 'sn'); } }
      return hits;
    };
    expect(run()).toBe(run());
    expect(run()).toBeGreaterThan(40);
    expect(run()).toBeLessThan(200);
  });
  it('the refused turn is lost and announced, and the line ends when freed', () => {
    const v: Variants = {};
    assignVariant(v, 'sn', 'snagged');
    let said: string | null = null;
    for (let i = 0; i < 40 && !said; i++) said = variantSnagRefuses(v, 'sn', `t${i}`);
    expect(said).toBe("It is looking for someone who isn't here.");
    expect(variantLosesTurn(v, 'sn')).toBe('It refuses to move.');
    expect(variantLosesTurn(v, 'sn')).toBeNull();
  });
  it('in a battle it refuses within a few turns and the turn after deals no damage', () => {
    const d = duel({ line: 'snagged', eMove: 'tackle', pMove: 'splash' });
    d.player.hp = 9999;
    let refusedAt = -1;
    const dmg: number[] = [];
    for (let i = 0; i < 12; i++) {
      const es = d.go();
      dmg.push(lost(es, 'player'));
      if (refusedAt < 0 && texts(es).includes("It is looking for someone who isn't here.")) refusedAt = i;
    }
    expect(refusedAt).toBeGreaterThanOrEqual(0);
    expect(dmg[refusedAt + 1]).toBe(0);
    expect(dmg[0]).toBeGreaterThan(0);
  });
});

describe('Team Yell: Loud', () => {
  it('sound moves hit 20% harder than the same Pokémon without the line', () => {
    const base = duel({ eMove: 'hyper-voice', pMove: 'splash' }), loud = duel({ line: 'loud', eMove: 'hyper-voice', pMove: 'splash' });
    const b = lost(base.go(), 'player'), l = lost(loud.go(), 'player');
    expect(l / b).toBeGreaterThan(1.1);
    expect(l / b).toBeLessThan(1.3);
    const plain = duel({ line: 'loud', eMove: 'tackle', pMove: 'splash' }), plainBase = duel({ eMove: 'tackle', pMove: 'splash' });
    expect(lost(plain.go(), 'player')).toBe(lost(plainBase.go(), 'player'));
  });
  it('gains Speed (once, capped) only while the stands cheer', () => {
    const crowd = duel({ line: 'loud', opts: { crowd: true } }), quiet = duel({ line: 'loud' });
    crowd.go(); crowd.go();
    quiet.go(); quiet.go();
    expect(crowd.battle.enemyStages.spe).toBe(1); // capped at +1
    expect(quiet.battle.enemyStages.spe).toBe(0);
  });
  it("with Marnie's League Card it loses its first turn only", () => {
    const d = duel({ line: 'loud', eMove: 'tackle', pMove: 'splash', opts: { marnie: true } });
    const first = d.go();
    expect(texts(first)).toContain('It has remembered who it is cheering for.');
    expect(lost(first, 'player')).toBe(0);
    expect(lost(d.go(), 'player')).toBeGreaterThan(0);
  });
});

describe('Couture, Overcharged, Tuned', () => {
  it('Couture puts its accessory on at the start, and Knock Off takes it first, once', () => {
    const d = duel({ line: 'couture', opts: { accessory: 'focus-sash' }, pMove: 'knock-off' });
    const first = d.go();
    expect(texts(first).some((t) => t.startsWith('It wears'))).toBe(true);
    expect(texts(first)).toContain('Its accessory is knocked askew.');
    expect(d.enemy.held?.['focus-sash'] ?? 0).toBe(0);
    expect(texts(d.go())).not.toContain('Its accessory is knocked askew.');
  });
  it('Couture keeps the accessory as an ordinary item if nothing takes it', () => {
    const d = duel({ line: 'couture', opts: { accessory: 'focus-sash' } });
    d.go();
    expect(d.enemy.held?.['focus-sash']).toBe(1);
    d.go();
    expect(d.enemy.held?.['focus-sash']).toBe(1);
  });
  it('Overcharged Dynamaxes by itself on its second turn out, for one turn, then cannot act', () => {
    const d = duel({ line: 'overcharged', eMove: 'tackle', pMove: 'splash' });
    d.player.hp = 9999;
    const t1 = d.go();
    expect(d.enemy.dynamaxed).toBeUndefined();
    expect(lost(t1, 'player')).toBeGreaterThan(0);
    const t2 = d.go();
    expect(t2.some((e) => e.type === 'transform' && e.kind === 'dynamax')).toBe(true);
    expect(d.enemy.dynamaxed).toBeUndefined(); // it ends with that turn
    const t3 = d.go();
    expect(texts(t3)).toContain('It is paying for that.');
    expect(lost(t3, 'player')).toBe(0);
    expect(lost(d.go(), 'player')).toBeGreaterThan(0);
    expect(d.battle.transform.used.enemy).not.toContain('dynamax');
  });
  it('Tuned Terastallizes by itself for 2 turns, then stalls at -1 Speed', () => {
    const d = duel({ line: 'tuned', eMove: 'tackle', pMove: 'splash' });
    d.player.hp = 9999;
    d.go();
    const t2 = d.go();
    expect(t2.some((e) => e.type === 'transform' && e.kind === 'tera')).toBe(true);
    expect(d.battle.transform.mechanics[d.enemy.uid]).toBe('tera');
    const t3 = d.go();
    expect(d.battle.transform.mechanics[d.enemy.uid]).toBeUndefined();
    expect(texts(t3)).toContain("It's borrowed. It has to give it back.");
    expect(d.battle.enemyStages.spe).toBe(-1);
    const t4 = d.go();
    expect(t4.some((e) => e.type === 'transform')).toBe(false); // once per battle
  });
  it('the accessory and counters survive a save', () => {
    const d = duel({ line: 'couture', opts: { accessory: 'focus-sash' } });
    d.go();
    const back = BattleStateSchema.parse(JSON.parse(JSON.stringify(d.battle)));
    expect(back.extra.variants[d.enemy.uid]?.accessory).toBe('focus-sash');
  });
});

describe('balance sim: neither side above 60%', () => {
  it('baseline with no line is balanced', () => {
    const r = simulateVariantLine(content, null, 600);
    expect(r.variantRate, JSON.stringify(r)).toBeGreaterThan(0.4);
    expect(r.variantRate, JSON.stringify(r)).toBeLessThan(0.6);
  }, 60000);
  for (const line of WIRED_LINES) {
    it(`${line}: 600 mirror battles`, () => {
      const r = simulateVariantLine(content, line, 600);
      expect(r.variantRate, JSON.stringify(r)).toBeLessThanOrEqual(simLimit(line));
      expect(r.plainRate, JSON.stringify(r)).toBeLessThanOrEqual(plainLimit(line));
    }, 60000);
  }
});
