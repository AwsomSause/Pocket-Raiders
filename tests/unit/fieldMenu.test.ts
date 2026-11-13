// What the battle screen offers in double and triple battles (core/battle/fieldMenu.ts): the command plan, target choices
// (reach, ally moves, the best-by-type arrow) and the Shift option. Anything offered must be accepted by the turn.

import { describe, expect, it } from 'vitest';
import { createBattle, type BattleContext, type SlotCommand } from '../../src/core/battle/engine';
import { makeDoubles, monAt, resolveDoublesTurn } from '../../src/core/battle/doubles';
import { commandPlan, shiftOptionProblem, targetChoices } from '../../src/core/battle/fieldMenu';
import { makeTriples } from '../../src/core/battle/triples';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { content } from './helpers';

interface MonSpec {
  species?: string;
  level?: number;
  moves?: string[];
  hp?: number;
}
type Target = { side: 'player' | 'enemy'; spot: 0 | 1 | 2 };

function field(p: MonSpec[], e: MonSpec[], seed = 'menu', size: 2 | 3 = 3) {
  const make = (s: MonSpec, uid: string) => {
    const mon = createPokemon(content, s.species ?? 'snorlax', s.level ?? 50, uid);
    mon.moves = (s.moves ?? ['splash']).map((id) => ({ id, pp: content.moves.get(id)!.pp }));
    if (s.hp !== undefined) mon.hp = s.hp;
    return mon;
  };
  const party = p.map((s, i) => make(s, `p${i}`));
  const team = e.map((s, i) => make(s, `e${i}`));
  const battle = createBattle('trainer', team, 0, party[0]!.uid, { classId: 'ace-trainer', name: 'Pat', leaderId: null });
  if (size === 3) makeTriples(battle, party);
  else makeDoubles(battle, party);
  const ctx: BattleContext = { content, battle, party, inventory: {}, rng: new Rng(hashSeed(seed)), captureRng: new Rng(hashSeed(`${seed}c`)), catchMultiplier: 1 };
  const cmd = (index: number, target?: Target): SlotCommand => ({ action: { kind: 'move', index }, target });
  const turn = (commands: (SlotCommand | null)[]) => resolveDoublesTurn(ctx, { kind: 'double', commands });
  const uids = (side: 'player' | 'enemy') => [0, 1, 2].map((s) => monAt(ctx, side, s as 0 | 1 | 2)?.uid ?? null);
  return { ctx, battle, party, team, cmd, turn, uids };
}

const move = (id: string) => content.moves.get(id)!;
const spotsOf = (choices: ReturnType<typeof targetChoices>) => choices.map((c) => `${c.target.side[0]}${c.target.spot}`);
const three = [{}, {}, {}];

describe('targetChoices', () => {
  it('doubles: every foe can be aimed at, and the partner for ally moves', () => {
    const t = field([{}, {}], [{}, {}], 'd', 2);
    expect(spotsOf(targetChoices(t.ctx, content, 0, move('tackle')))).toEqual(['e0', 'e1']);
    expect(spotsOf(targetChoices(t.ctx, content, 1, move('pollen-puff')))).toEqual(['e0', 'e1', 'p0']);
  });
  it('triples: an edge reaches the two foes in front of it; the centre reaches all three', () => {
    const t = field(three, three);
    expect(spotsOf(targetChoices(t.ctx, content, 0, move('tackle')))).toEqual(['e0', 'e1']);
    expect(spotsOf(targetChoices(t.ctx, content, 2, move('tackle')))).toEqual(['e1', 'e2']);
    expect(spotsOf(targetChoices(t.ctx, content, 1, move('tackle')))).toEqual(['e0', 'e1', 'e2']);
  });
  it('triples: long-range moves reach the far edge; ally moves only reach a partner next to you', () => {
    const t = field(three, three);
    expect(spotsOf(targetChoices(t.ctx, content, 0, move('aerial-ace')))).toEqual(['e0', 'e1', 'e2']);
    expect(spotsOf(targetChoices(t.ctx, content, 0, move('pollen-puff')))).toEqual(['e0', 'e1', 'p1']);
    expect(spotsOf(targetChoices(t.ctx, content, 1, move('pollen-puff')))).toEqual(['e0', 'e1', 'e2', 'p0', 'p2']);
  });
  it('leaves out fainted foes (boundary) and marks the best foe by type only when it beats the others', () => {
    const t = field(three, [{ species: 'charizard' }, {}, { hp: 0 }]);
    const water = targetChoices(t.ctx, content, 1, move('surf'));
    expect(spotsOf(water)).toEqual(['e0', 'e1']);
    expect(water.map((c) => c.best)).toEqual([true, false]);
    expect(targetChoices(t.ctx, content, 1, move('tackle')).some((c) => c.best)).toBe(false);
    expect(targetChoices(t.ctx, null, 1, move('surf')).some((c) => c.best)).toBe(false);
  });
  it('is empty outside a double or triple battle (failure)', () => {
    const t = field(three, three);
    delete t.battle.doubles;
    expect(targetChoices(t.ctx, content, 0, move('tackle'))).toEqual([]);
    expect(commandPlan(t.ctx)).toEqual([]);
  });
  it('every target offered is accepted by the turn, from every spot', () => {
    for (const id of ['tackle', 'aerial-ace']) {
      for (const spot of [0, 1, 2] as const) {
        for (const choice of targetChoices(field(three, three).ctx, content, spot, move(id))) {
          const t = field([{ moves: [id] }, { moves: [id] }, { moves: [id] }], three);
          const commands: (SlotCommand | null)[] = [0, 1, 2].map(() => ({ action: { kind: 'move', index: 0 } }));
          commands[spot] = { action: { kind: 'move', index: 0 }, target: choice.target };
          expect(() => resolveDoublesTurn(t.ctx, { kind: 'double', commands }), `${id} ${spot} ${choice.target.spot}`).not.toThrow();
        }
      }
    }
  });
});

describe('commandPlan', () => {
  it('asks each healthy spot, skips fainted ones, and fills in forced moves', () => {
    const t = field([{}, {}, { moves: ['tackle', 'solar-beam'] }], three);
    monAt(t.ctx, 'player', 1)!.hp = 0;
    expect(monAt(t.ctx, 'player', 2)!.uid).toBe('p2');
    t.battle.doubles!.trio!.player[2]!.vol.charging = 'solar-beam';
    expect(commandPlan(t.ctx)).toEqual([{ spot: 0, kind: 'ask' }, { spot: 1, kind: 'skip' }, { spot: 2, kind: 'forced', index: 1 }]);
  });
  it('doubles: two spots', () => {
    expect(commandPlan(field([{}, {}], [{}, {}], 'd2', 2).ctx).map((s) => s.kind)).toEqual(['ask', 'ask']);
  });
});

describe('shiftOptionProblem', () => {
  it('offers Shift to the edges of a triple battle only, once a turn', () => {
    const t = field(three, three);
    expect(shiftOptionProblem(t.battle, 0)).toBeNull();
    expect(shiftOptionProblem(t.battle, 2)).toBeNull();
    expect(shiftOptionProblem(t.battle, 1)).toMatch(/centre/);
    expect(shiftOptionProblem(t.battle, 2, [{ action: { kind: 'shift' } }, null])).toMatch(/Only one/);
    expect(shiftOptionProblem(field([{}, {}], [{}, {}], 'd3', 2).battle, 0)).toMatch(/only possible in a triple/);
  });
});
