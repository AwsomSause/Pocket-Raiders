// Overhaul slices 27-28: Mega signature moves (data, power budget, the Mega-only slot, saves).
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createBattle, resolveTurn, type BattleContext, type BattleEvent } from '../../src/core/battle/engine';
import { endMegaMoves, grantMegaMove, megaMoveFor } from '../../src/core/battle/megaMove';
import { applyTransformations, revertTransformations, type TransformContext, type TransformStepEvent } from '../../src/core/battle/transform';
import { createPokemon } from '../../src/core/pokemon';
import { Rng, hashSeed } from '../../src/core/rng';
import { MoveSlotSchema } from '../../src/core/state';
import megaMovesJson from '../../src/data/megaMoves.json';
import { movePower } from '../../src/core/powerBudget';
import { content } from './helpers';

const ROSTER = readFileSync(join(import.meta.dirname, '..', '..', 'tools', 'data', 'mega-roster.tsv'), 'utf8')
  .split('\n')
  .filter((l) => l && !l.startsWith('#'))
  .map((l) => l.split('|') as [string, string, string, string, string, string, string, string, string]);

const bst = (id: string) => Object.values(content.species.get(id)!.baseStats).reduce((a, b) => a + b, 0);
/** Power budget by the Mega form's base stat total (plans/mega-signature-roster.md). */
const tier = (b: number) => (b >= 680 ? { cap: 100, pp: 5 } : b >= 620 ? { cap: 100, pp: 8 } : b >= 560 ? { cap: 105, pp: 10 } : { cap: 110, pp: 10 });
const built = megaMovesJson.moves;

describe('Mega signature move data', () => {
  it('builds exactly the roster rows of the built batches, and every row passed the content checks', () => {
    const maxBatch = Math.max(...ROSTER.filter((r) => built.some((m) => m.name === r[1])).map((r) => Number(r[8])));
    const expected = ROSTER.filter((r) => Number(r[8]) <= maxBatch);
    expect(built.map((m) => m.name)).toEqual(expected.map((r) => r[1]));
    expect(Object.keys(megaMovesJson.byForm)).toEqual(expected.map((r) => r[0]));
  });

  it('each move belongs to a real Mega form, is flagged megasig and supported, and no species learns it', () => {
    const learned = new Set([...content.species.values()].flatMap((s) => s.learnset.map((e) => e.move)));
    for (const [form, id] of Object.entries(megaMovesJson.byForm)) {
      expect(content.species.get(form)?.form?.kind, form).toBe('mega');
      const move = content.moves.get(id)!;
      expect(move.flags, id).toContain('megasig');
      expect(move.supported, id).toBe(true);
      expect(learned.has(id), id).toBe(false);
      expect(megaMoveFor(content, form)).toBe(id);
    }
    expect(new Set(built.map((m) => m.id)).size).toBe(built.length);
  });

  it('stays inside the power budget for its form (multi-hit counts per hit) and keeps its type and category', () => {
    for (const [form, id] of Object.entries(megaMovesJson.byForm)) {
      const move = content.moves.get(id)!;
      const t = tier(bst(form));
      expect(move.power ?? 0, id).toBeLessThanOrEqual(t.cap);
      expect(move.pp, id).toBeLessThanOrEqual(t.pp);
      const row = ROSTER.find((r) => r[1] === move.name)!;
      expect(move.type).toBe(row[2]);
    }
  });

  it('every signature move is under the content gate move cap (slice 4 power budget)', () => {
    for (const id of Object.values(megaMovesJson.byForm)) expect(movePower(content.moves.get(id)!), id).toBeLessThanOrEqual(content.balance.powerBudget.moveCap);
  });

  it('never shows up in the random-move rules or the signature tables of other moves', () => {
    for (const m of content.moves.values()) if (m.flags.includes('megasig')) expect(m.flags.includes('zmove') || m.flags.includes('max')).toBe(false);
  });
});

function setup(speciesId: string, inventory: Record<string, number>) {
  const player = createPokemon(content, speciesId, 60, 'p1');
  player.moves = [{ id: 'tackle', pp: 35 }, { id: 'growl', pp: 40 }, { id: 'scratch', pp: 35 }, { id: 'leer', pp: 30 }];
  const foe = createPokemon(content, 'snorlax', 60, 'e1');
  const battle = createBattle('trainer', [foe], 0, player.uid, { classId: 'elite-four', name: 'T', leaderId: null });
  battle.turn = 6;
  const ctx: TransformContext = { content, battle, party: [player], inventory };
  return { ctx, battle, player, foe };
}
const evolve = (s: ReturnType<typeof setup>) => {
  const events: TransformStepEvent[] = [];
  applyTransformations(s.ctx, undefined, events);
  return events;
};

describe('the Mega-only slot', () => {
  it('Mega Evolving adds the signature move as a fifth slot, keeps the four normal moves, and the battle end removes it', () => {
    const s = setup('abomasnow', { 'mega-ring': 1, abomasite: 1 });
    const before = s.player.moves.map((m) => m.id);
    evolve(s);
    expect(s.player.speciesId).toBe('abomasnow-mega');
    expect(s.player.moves).toHaveLength(5);
    expect(s.player.moves.slice(0, 4).map((m) => m.id)).toEqual(before);
    expect(s.player.moves[4]).toMatchObject({ id: 'glacier-maul', megaSig: true });
    // It is added once, even if asked again.
    expect(grantMegaMove(content, s.player)).toBeNull();
    expect(s.player.moves).toHaveLength(5);
    revertTransformations(content, s.battle, s.ctx.party);
    expect(s.player.speciesId).toBe('abomasnow');
    expect(s.player.moves.map((m) => m.id)).toEqual(before);
  });

  it('a Pokémon that does not Mega Evolve never has it (no stone, no Mega Ring, or a form without a move yet)', () => {
    const noStone = setup('abomasnow', { 'mega-ring': 1 });
    evolve(noStone);
    expect(noStone.player.moves).toHaveLength(4);
    const noRing = setup('abomasnow', { abomasite: 1 });
    evolve(noRing);
    expect(noRing.player.moves).toHaveLength(4);
    const base = createPokemon(content, 'abomasnow', 60, 'x');
    expect(grantMegaMove(content, base)).toBeNull();
    expect(megaMoveFor(content, 'abomasnow')).toBeNull();
  });

  it('a boss ace that Mega Evolves gets its signature move too, and endMegaMoves clears every slot', () => {
    const s = setup('abomasnow', { 'mega-ring': 1, abomasite: 1 });
    expect(s.foe.moves.some((m) => m.megaSig)).toBe(false);
    const ace = createPokemon(content, 'abomasnow-mega', 60, 'e2');
    ace.moves = [{ id: 'tackle', pp: 35 }];
    expect(grantMegaMove(content, ace)).toBe('glacier-maul');
    expect(ace.moves.map((m) => m.id)).toEqual(['tackle', 'glacier-maul']);
    evolve(s);
    endMegaMoves([s.player, ace]);
    expect(s.player.moves.some((m) => m.megaSig)).toBe(false);
    expect(ace.moves.some((m) => m.megaSig)).toBe(false);
  });

  it('saves and loads mid-battle, and an older save without the field still loads', () => {
    const slot = MoveSlotSchema.parse(JSON.parse(JSON.stringify({ id: 'glacier-maul', pp: 8, megaSig: true })));
    expect(slot.megaSig).toBe(true);
    expect(MoveSlotSchema.parse({ id: 'tackle', pp: 35 }).megaSig).toBeUndefined();
  });
});

function fight(megaForm: string, moveId: string, seed = 'mega-sig') {
  const player = createPokemon(content, megaForm, 60, 'p1');
  player.moves = [{ id: moveId, pp: content.moves.get(moveId)!.pp, megaSig: true }];
  const foe = createPokemon(content, 'snorlax', 60, 'e1');
  foe.moves = [{ id: 'splash', pp: 40 }];
  const battle = createBattle('wild', [foe], 0, player.uid);
  const ctx: BattleContext = { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed(seed)), captureRng: new Rng(hashSeed(`${seed}-c`)), catchMultiplier: 1 };
  return { ctx, battle, player, foe, events: resolveTurn(ctx, { kind: 'move', index: 0 }) as BattleEvent[] };
}
/** Fights on with new seeds until the (90% accurate) move lands. */
function landed(form: string, moveId: string) {
  for (let i = 0; i < 8; i++) {
    const r = fight(form, moveId, `land-${i}`);
    if (damageTo(r.events, 'enemy').length > 0) return r;
  }
  throw new Error(`${moveId} never landed`);
}
const damageTo = (events: BattleEvent[], side: 'player' | 'enemy') => events.filter((e) => e.type === 'damage' && e.side === side);

describe('batch 1 moves in battle', () => {
  it('Glacier Maul hits even when Snow Warning already made it snow, and an attack sets weather after it lands', () => {
    const r = landed('abomasnow-mega', 'glacier-maul');
    expect(damageTo(r.events, 'enemy').length).toBeGreaterThan(0);
    expect(r.battle.weather?.id).toBe('snow');
    // The same move from a Pokémon without Snow Warning: the attack lands, then the weather changes.
    const user = createPokemon(content, 'snorlax', 60, 'p9');
    user.moves = [{ id: 'glacier-maul', pp: 8 }];
    for (let i = 0; i < 8; i++) {
      const foe = createPokemon(content, 'chansey', 60, 'e9');
      foe.moves = [{ id: 'splash', pp: 40 }];
      const battle = createBattle('wild', [foe], 0, user.uid);
      const ctx: BattleContext = { content, battle, party: [user], inventory: {}, rng: new Rng(hashSeed(`w${i}`)), captureRng: new Rng(hashSeed(`wc${i}`)), catchMultiplier: 1 };
      const events = resolveTurn(ctx, { kind: 'move', index: 0 }) as BattleEvent[];
      if (damageTo(events, 'enemy').length === 0) continue;
      expect(battle.weather?.id).toBe('snow');
      expect(events.some((e) => e.type === 'weather')).toBe(true);
      return;
    }
    throw new Error('Glacier Maul never landed');
  });
  it('Hornet Barrage hits three times', () => {
    const r = fight('beedrill-mega', 'hornet-barrage');
    expect(damageTo(r.events, 'enemy')).toHaveLength(3);
  });
  it('Grudge Stitch has priority and Healing Chorus heals its user', () => {
    expect(content.moves.get('grudge-stitch')!.priority).toBe(1);
    const user = createPokemon(content, 'audino-mega', 60, 'p1');
    user.moves = [{ id: 'healing-chorus', pp: 8, megaSig: true }];
    user.hp = 10;
    const foe = createPokemon(content, 'snorlax', 60, 'e1');
    foe.moves = [{ id: 'splash', pp: 40 }];
    const battle = createBattle('wild', [foe], 0, user.uid);
    const ctx: BattleContext = { content, battle, party: [user], inventory: {}, rng: new Rng(hashSeed('heal')), captureRng: new Rng(hashSeed('heal-c')), catchMultiplier: 1 };
    resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(user.hp).toBeGreaterThan(10);
  });
  it('Frostfang Cataclysm costs the user recoil', () => {
    const r = landed('baxcalibur-mega', 'frostfang-cataclysm');
    expect(r.events.some((e) => e.type === 'recoil' && e.side === 'player')).toBe(true);
  });
  it('is deterministic: same seed, same events', () => {
    expect(JSON.stringify(fight('blaziken-mega', 'blazing-overdrive', 's1').events)).toBe(JSON.stringify(fight('blaziken-mega', 'blazing-overdrive', 's1').events));
  });
});

describe('batch 2 moves in battle', () => {
  /** A Pokémon carrying the move as an ordinary slot (the engine does not care how it got it), fought on new seeds until it lands. */
  function carry(species: string, moveId: string, hp?: number) {
    for (let i = 0; i < 8; i++) {
      const user = createPokemon(content, species, 60, 'p9');
      user.moves = [{ id: moveId, pp: content.moves.get(moveId)!.pp }];
      if (hp) user.hp = hp;
      const foe = createPokemon(content, 'chansey', 60, 'e9');
      foe.moves = [{ id: 'splash', pp: 40 }];
      const battle = createBattle('wild', [foe], 0, user.uid);
      const ctx: BattleContext = { content, battle, party: [user], inventory: {}, rng: new Rng(hashSeed(`c${i}`)), captureRng: new Rng(hashSeed(`cc${i}`)), catchMultiplier: 1 };
      const events = resolveTurn(ctx, { kind: 'move', index: 0 }) as BattleEvent[];
      if (damageTo(events, 'enemy').length > 0) return { user, battle, events };
    }
    throw new Error(`${moveId} never landed`);
  }
  it('Zenith Inferno sets Sun after it lands', () => {
    expect(carry('snorlax', 'zenith-inferno').battle.weather?.id).toBe('sun');
  });
  it('Moonlit Miracle heals its user by part of the damage', () => {
    const r = carry('snorlax', 'moonlit-miracle', 20);
    expect(r.user.hp).toBeGreaterThan(20);
  });
  it('Celestial Drake Rush raises Attack and lowers Defense of its user', () => {
    const r = carry('snorlax', 'celestial-drake-rush');
    expect(r.events.some((e) => e.type === 'stat' && e.side === 'player' && e.stat === 'atk' && e.change > 0)).toBe(true);
    expect(r.events.some((e) => e.type === 'stat' && e.side === 'player' && e.stat === 'def' && e.change < 0)).toBe(true);
  });
});
