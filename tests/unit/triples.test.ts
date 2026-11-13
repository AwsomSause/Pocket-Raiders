// Triple battles (core/battle/triples.ts + the shared turn code in doubles.ts): who can reach whom from
// every spot, spread moves, Shift, Ally Switch, KO refill order, the centring rule, determinism, saves.

import { describe, expect, it } from 'vitest';
import { createBattle, type BattleContext, type BattleEvent, type SlotCommand } from '../../src/core/battle/engine';
import { autoCommands, monAt, resolveDoublesTurn, startDoubles } from '../../src/core/battle/doubles';
import { canBeTriples, canReach, centringMoves, isTriples, makeTriples, shiftProblem, spotCount, spreadSpots } from '../../src/core/battle/triples';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { BattleStateSchema } from '../../src/core/state';
import { content } from './helpers';

interface MonSpec {
  species?: string;
  level?: number;
  moves?: string[];
  hp?: number;
}
type Target = { side: 'player' | 'enemy'; spot: 0 | 1 | 2 };

function triples(p: MonSpec[], e: MonSpec[], seed = 'tri') {
  const make = (s: MonSpec, uid: string) => {
    const mon = createPokemon(content, s.species ?? 'snorlax', s.level ?? 50, uid);
    mon.moves = (s.moves ?? ['splash']).map((id) => ({ id, pp: content.moves.get(id)!.pp }));
    if (s.hp !== undefined) mon.hp = s.hp;
    return mon;
  };
  const party = p.map((s, i) => make(s, `p${i}`));
  const team = e.map((s, i) => make(s, `e${i}`));
  const battle = createBattle('trainer', team, 0, party[0]!.uid, { classId: 'ace-trainer', name: 'Pat', leaderId: null });
  makeTriples(battle, party);
  const ctx: BattleContext = { content, battle, party, inventory: {}, rng: new Rng(hashSeed(seed)), captureRng: new Rng(hashSeed(`${seed}c`)), catchMultiplier: 1 };
  const cmd = (index: number, target?: Target): SlotCommand => ({ action: { kind: 'move', index }, target });
  const turn = (commands: (SlotCommand | null)[]) => resolveDoublesTurn(ctx, { kind: 'double', commands });
  const uids = (side: 'player' | 'enemy') => [0, 1, 2].map((s) => monAt(ctx, side, s as 0 | 1 | 2)?.uid ?? null);
  return { ctx, battle, party, team, cmd, turn, uids };
}

/** Who took damage, following focus and switch-in events (the way the screen reads them). */
function damaged(events: BattleEvent[], start: Record<'player' | 'enemy', string>): string[] {
  const focus = { ...start };
  const out = new Set<string>();
  for (const e of events) {
    if (e.type === 'focus' || e.type === 'switchIn') focus[e.side] = e.uid;
    if (e.type === 'damage' && e.amount > 0) out.add(focus[e.side]);
  }
  return [...out].sort();
}

const tackle = { id: 'tackle' };
const aerialAce = { id: 'aerial-ace' };
const three = [{}, {}, {}];

describe('triple battle setup', () => {
  it('puts three Pokémon on each side, lead on the left', () => {
    const t = triples(three, three);
    expect(t.uids('player')).toEqual(['p0', 'p1', 'p2']);
    expect(t.uids('enemy')).toEqual(['e0', 'e1', 'e2']);
    expect(t.battle.participants).toEqual(['p0', 'p1', 'p2']);
    expect(isTriples(t.battle)).toBe(true);
    expect(spotCount(t.battle)).toBe(3);
  });
  it('leaves a spot empty when a side has only two Pokémon (boundary)', () => {
    const t = triples([{}, {}], three);
    expect(t.uids('player')).toEqual(['p0', 'p1', null]);
    expect(canBeTriples(t.party, t.team)).toBe(false);
    expect(canBeTriples([...t.party, ...t.party], t.team)).toBe(true);
  });
  it('a double battle is not a triple battle', () => {
    expect(spotCount({ doubles: undefined })).toBe(1);
  });
  it('starts with every entry ability and no random numbers', () => {
    const t = triples(three, three);
    const before = JSON.stringify(t.ctx.rng);
    startDoubles(t.ctx);
    expect(JSON.stringify(t.ctx.rng)).toBe(before);
  });
});

describe('who can reach whom', () => {
  // [user spot][target spot] for an ordinary single-target move at a foe.
  const FOES = [
    [true, true, false],
    [true, true, true],
    [false, true, true],
  ];
  const ALLIES = [
    [false, true, false],
    [true, false, true],
    [false, true, false],
  ];
  it('has the full targeting table for every position', () => {
    for (const u of [0, 1, 2]) for (const v of [0, 1, 2]) {
      expect(canReach(3, { side: 'player', spot: u }, { side: 'enemy', spot: v }, tackle), `foe ${u}->${v}`).toBe(FOES[u]![v]);
      expect(canReach(3, { side: 'enemy', spot: u }, { side: 'player', spot: v }, tackle), `enemy ${u}->${v}`).toBe(FOES[u]![v]);
      expect(canReach(3, { side: 'player', spot: u }, { side: 'player', spot: v }, tackle), `ally ${u}->${v}`).toBe(ALLIES[u]![v]);
      // Long-range moves reach anyone but the user.
      expect(canReach(3, { side: 'player', spot: u }, { side: 'enemy', spot: v }, aerialAce)).toBe(true);
      expect(canReach(3, { side: 'player', spot: u }, { side: 'player', spot: v }, aerialAce)).toBe(u !== v);
    }
  });
  it('in doubles everyone is in reach', () => {
    for (const u of [0, 1]) for (const v of [0, 1]) expect(canReach(2, { side: 'player', spot: u }, { side: 'enemy', spot: v }, tackle)).toBe(true);
  });
  it('spread moves reach the adjacent spots', () => {
    expect(spreadSpots(3, 0)).toEqual({ foes: [0, 1], allies: [1] });
    expect(spreadSpots(3, 1)).toEqual({ foes: [0, 1, 2], allies: [0, 2] });
    expect(spreadSpots(3, 2)).toEqual({ foes: [1, 2], allies: [1] });
    expect(spreadSpots(2, 0)).toEqual({ foes: [0, 1], allies: [1] });
  });
  it('refuses an ordinary move aimed at the far edge (failure)', () => {
    const t = triples([{ moves: ['tackle'] }, {}, {}], three);
    expect(() => t.turn([t.cmd(0, { side: 'enemy', spot: 2 }), t.cmd(0), t.cmd(0)])).toThrow(/can't reach/);
  });
  it('lets a long-range move hit the far edge', () => {
    const t = triples([{ moves: ['aerial-ace'], level: 100 }, {}, {}], three, 'ace');
    const events = t.turn([t.cmd(0, { side: 'enemy', spot: 2 }), t.cmd(0), t.cmd(0)]);
    expect(damaged(events, { player: 'p0', enemy: 'e0' })).toEqual(['e2']);
  });
  it('an attack with nobody in reach fails instead of hitting the far edge', () => {
    // e0 and e1 fall to the fast centre's Hyper Voice; the slow left Pokémon then has only e2, out of reach.
    const t = triples([{ moves: ['tackle'], level: 5 }, { moves: ['hyper-voice'], level: 100 }, {}], [{ hp: 1 }, { hp: 1 }, {}], 'reach');
    const events = t.turn([t.cmd(0, { side: 'enemy', spot: 0 }), t.cmd(0), t.cmd(0)]);
    expect(t.team[0]!.hp).toBe(0);
    expect(t.team[1]!.hp).toBe(0);
    // Only Hyper Voice's three hits landed; the Tackle hit nobody.
    expect(events.filter((e) => e.type === 'damage' && e.side === 'enemy')).toHaveLength(3);
    expect(events.some((e) => e.type === 'fail' && e.side === 'player')).toBe(true);
  });
  it('the foe only aims at Pokémon it can reach', () => {
    for (const seed of ['a1', 'a2', 'a3', 'a4', 'a5', 'a6']) {
      const t = triples(three, [{ moves: ['tackle'], level: 100 }, {}, {}], seed);
      t.battle.ai = 1;
      const p2 = t.party[2]!.hp;
      t.turn([t.cmd(0), t.cmd(0), t.cmd(0)]);
      expect(t.party[2]!.hp, seed).toBe(p2);
    }
  });
  it('autoCommands aim each Pokémon at a foe in reach', () => {
    const t = triples(three, three);
    const commands = autoCommands(t.ctx);
    expect(commands.map((c) => c?.target?.spot)).toEqual([0, 0, 1]);
  });
});

describe('spread moves', () => {
  it('Hyper Voice from an edge hits the two adjacent foes, from the centre all three', () => {
    const edge = triples([{ moves: ['hyper-voice'] }, {}, {}], three, 'hv');
    expect(damaged(edge.turn([edge.cmd(0), edge.cmd(0), edge.cmd(0)]), { player: 'p0', enemy: 'e0' })).toEqual(['e0', 'e1']);
    const right = triples([{}, {}, { moves: ['hyper-voice'] }], three, 'hv');
    expect(damaged(right.turn([right.cmd(0), right.cmd(0), right.cmd(0)]), { player: 'p0', enemy: 'e0' })).toEqual(['e1', 'e2']);
    const mid = triples([{}, { moves: ['hyper-voice'] }, {}], three, 'hv');
    expect(damaged(mid.turn([mid.cmd(0), mid.cmd(0), mid.cmd(0)]), { player: 'p0', enemy: 'e0' })).toEqual(['e0', 'e1', 'e2']);
  });
  it('Earthquake from an edge hits the adjacent foes and the centre ally, not the far ally', () => {
    const t = triples([{ moves: ['earthquake'] }, {}, {}], three, 'eq');
    expect(damaged(t.turn([t.cmd(0), t.cmd(0), t.cmd(0)]), { player: 'p0', enemy: 'e0' })).toEqual(['e0', 'e1', 'p1']);
  });
  it('a spread move that hits several Pokémon does 0.75× damage', () => {
    // With one foe left on the field the same move is not spread: compare the damage on e1.
    const hit = (others: number) => {
      const t = triples([{}, { moves: ['hyper-voice'] }, {}], [{ hp: others }, { level: 100 }, { hp: others }], 'spread');
      const events = t.turn([t.cmd(0), t.cmd(0), t.cmd(0)]);
      let focus = 'e0';
      let dmg = 0;
      for (const e of events) {
        if (e.type === 'focus' && e.side === 'enemy') focus = e.uid;
        if (e.type === 'damage' && e.side === 'enemy' && focus === 'e1') {
          expect(e.crit).toBe(false);
          dmg += e.amount;
        }
      }
      return dmg;
    };
    const spread = hit(500);
    const lone = hit(0);
    expect(spread).toBeGreaterThan(0);
    // 0.75 × the top roll is still below the lowest roll (0.85) of an unspread hit.
    expect(spread).toBeLessThan(lone);
  });
});

describe('Shift and Ally Switch', () => {
  it('an edge Pokémon shifts to the centre before any move', () => {
    const t = triples(three, three);
    const events = t.turn([{ action: { kind: 'shift' } }, t.cmd(0), t.cmd(0)]);
    expect(t.uids('player')).toEqual(['p1', 'p0', 'p2']);
    const shifts = events.filter((e) => e.type === 'shift');
    expect(shifts).toEqual([
      { type: 'shift', side: 'player', uid: 'p0', from: 0, to: 1 },
      { type: 'shift', side: 'player', uid: 'p1', from: 1, to: 0 },
    ]);
    expect(events.findIndex((e) => e.type === 'shift')).toBeLessThan(events.findIndex((e) => e.type === 'move'));
  });
  it('the right edge can shift too', () => {
    const t = triples(three, three);
    t.turn([t.cmd(0), t.cmd(0), { action: { kind: 'shift' } }]);
    expect(t.uids('player')).toEqual(['p0', 'p2', 'p1']);
  });
  it('the centre can\'t shift, nor anyone in a double battle (failure)', () => {
    const t = triples(three, three);
    expect(() => t.turn([t.cmd(0), { action: { kind: 'shift' } }, t.cmd(0)])).toThrow(/centre can't shift/);
    expect(shiftProblem(2, 0)).toMatch(/only possible in a triple battle/);
    expect(shiftProblem(3, 0)).toBeNull();
  });
  it('Ally Switch trades the two edges and fails in the centre', () => {
    const t = triples([{ moves: ['ally-switch'] }, {}, {}], three, 'as');
    t.turn([t.cmd(0), t.cmd(0), t.cmd(0)]);
    expect(t.uids('player')).toEqual(['p2', 'p1', 'p0']);
    const mid = triples([{}, { moves: ['ally-switch'] }, {}], three, 'as');
    const events = mid.turn([mid.cmd(0), mid.cmd(0), mid.cmd(0)]);
    expect(mid.uids('player')).toEqual(['p0', 'p1', 'p2']);
    expect(events.some((e) => e.type === 'fail' && e.side === 'player')).toBe(true);
  });
});

describe('fainting and replacements', () => {
  it('the trainer refills fainted spots left to right; an empty bench leaves the spot empty', () => {
    const t = triples([{}, { moves: ['hyper-voice'], level: 100 }, {}], [{ hp: 1 }, { hp: 1 }, { hp: 1 }, {}, {}], 'ko');
    t.turn([t.cmd(0), t.cmd(0), t.cmd(0)]);
    expect(t.uids('enemy')).toEqual(['e3', 'e4', null]);
    expect(t.battle.outcome).toBeFalsy();
  });
  it('the player refills spots in order, choosing one at a time', () => {
    const t = triples([{ hp: 1 }, { hp: 1 }, { hp: 1 }, {}, {}], [{}, { moves: ['hyper-voice'], level: 100 }, {}], 'ko2');
    t.turn([t.cmd(0), t.cmd(0), t.cmd(0)]);
    expect(t.battle.doubles!.refill).toEqual([0, 1]);
    expect(t.uids('player')[2]).toBeNull();
    expect(t.battle.needsSwitch).toBe(true);
    // Sending out one that is already on its way is refused (failure).
    resolveDoublesTurn(t.ctx, { kind: 'switch', partyIndex: 4 });
    expect(() => resolveDoublesTurn(t.ctx, { kind: 'switch', partyIndex: 4 })).toThrow(/already in battle/);
    resolveDoublesTurn(t.ctx, { kind: 'switch', partyIndex: 3 });
    expect(t.uids('player')).toEqual(['p4', 'p3', null]);
    expect(t.battle.needsSwitch).toBe(false);
  });
  it('the last Pokémon on each side, on opposite edges, both move to the centre', () => {
    // p0's Earthquake KOs e0, e1 and its partner p1; p2's Explosion takes itself (and e1) out. Left: p0 and e2.
    const t = triples([{ moves: ['earthquake'], level: 100 }, { hp: 1 }, { moves: ['explosion'], level: 100 }], [{ hp: 1 }, { hp: 1 }, { level: 100 }], 'centre');
    const events = t.turn([t.cmd(0), t.cmd(0), t.cmd(0)]);
    expect(t.party.map((m) => m.hp > 0)).toEqual([true, false, false]);
    expect(t.team.map((m) => m.hp > 0)).toEqual([false, false, true]);
    expect(t.uids('player')[1]).toBe('p0');
    expect(t.uids('enemy')[1]).toBe('e2');
    expect(events.filter((e) => e.type === 'shift').map((e) => (e as { uid: string }).uid).sort()).toEqual(['e2', 'p0']);
  });
  it('centring only applies to opposite edges', () => {
    expect(centringMoves(3, { player: 0, enemy: 2 })).toEqual({ player: 0, enemy: 2 });
    expect(centringMoves(3, { player: 0, enemy: 1 })).toBeNull();
    expect(centringMoves(3, { player: 2, enemy: 2 })).toBeNull();
    expect(centringMoves(3, { player: null, enemy: 0 })).toBeNull();
    expect(centringMoves(2, { player: 0, enemy: 1 })).toBeNull();
  });
});

describe('determinism and saves', () => {
  const play = () => {
    const t = triples([{ moves: ['hyper-voice', 'tackle'] }, { moves: ['earthquake'] }, { moves: ['aerial-ace'] }, {}], [{ moves: ['tackle'] }, { moves: ['rock-slide'] }, { moves: ['hyper-voice'] }, {}], 'same');
    t.battle.ai = 0.5;
    const log: BattleEvent[] = [];
    for (let i = 0; i < 6 && !t.battle.outcome; i++) {
      if (t.battle.needsSwitch) {
        const spare = t.party.findIndex((m, idx) => m.hp > 0 && ![0, 1, 2].some((s) => monAt(t.ctx, 'player', s as 0 | 1 | 2)?.uid === t.party[idx]!.uid));
        log.push(...resolveDoublesTurn(t.ctx, { kind: 'switch', partyIndex: spare }));
        continue;
      }
      log.push(...t.turn(autoCommands(t.ctx)));
    }
    return { log, battle: t.battle };
  };
  it('the same seed and commands give the same battle', () => {
    const a = play();
    const b = play();
    expect(JSON.stringify(a.log)).toBe(JSON.stringify(b.log));
    expect(JSON.stringify(a.battle)).toBe(JSON.stringify(b.battle));
  });
  it('a triple battle survives a save and reload', () => {
    const t = triples(three, three);
    t.turn([{ action: { kind: 'shift' } }, t.cmd(0), t.cmd(0)]);
    const loaded = BattleStateSchema.parse(JSON.parse(JSON.stringify(t.battle)));
    expect(loaded.doubles!.trio).toEqual(t.battle.doubles!.trio);
    expect(isTriples(loaded)).toBe(true);
  });
  it('an old double-battle save still loads (no trio)', () => {
    const t = triples(three, three);
    const old = JSON.parse(JSON.stringify(t.battle));
    delete old.doubles.trio;
    expect(BattleStateSchema.parse(old).doubles!.trio).toBeUndefined();
  });
});
