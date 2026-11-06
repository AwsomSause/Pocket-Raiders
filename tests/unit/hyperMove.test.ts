import { describe, expect, it } from 'vitest';
import { doublesSteps } from '../../src/core/battle/engine';
import { endHyperMoves, grantHyperMoves, hyperMoveFor } from '../../src/core/battle/hyperMove';
import { createPokemon } from '../../src/core/pokemon';
import { chooseStarter, createRun } from '../../src/core/run';
import { RunStateSchema, type RunState } from '../../src/core/state';
import { content, toBattle } from './helpers';

const battleRun = (): RunState => toBattle(chooseStarter(content, createRun(content, { runId: 'r', seed: 'hyper-slot', archetypeId: 'red' }), 0));
const hyperEvent = (uid: string) => ({ type: 'hyper', side: 'player', uid, defId: 'toughenedItOut', variant: null, hpAfter: 1, cured: false }) as never;

describe('Hyper slot (Beta 4.4 #12)', () => {
  it('a Hyper moment unlocks one new move in an extra slot, once per battle, with +20 power', () => {
    const run = battleRun();
    const mon = run.party[0]!;
    const before = mon.moves.length;
    const lines = grantHyperMoves(content, run, [hyperEvent(mon.uid)]);
    expect(lines).toHaveLength(1);
    expect(mon.moves).toHaveLength(before + 1);
    const slot = mon.moves[before]!;
    expect(slot.hyper).toBe(true);
    expect(mon.moves.slice(0, before).some((m) => m.id === slot.id)).toBe(false);
    expect(slot.pp).toBeLessThanOrEqual(content.balance.hyperMove.pp);
    const base = content.moves.get(slot.id)!.power!;
    expect(doublesSteps.resolveMove(content, mon, before).power).toBe(base + content.balance.hyperMove.powerBonus);
    expect(grantHyperMoves(content, run, [hyperEvent(mon.uid)])).toHaveLength(0);
    // It saves and loads mid-battle.
    expect(RunStateSchema.parse(JSON.parse(JSON.stringify(run))).party[0]!.moves[before]!.hyper).toBe(true);
  });

  it('after a win the slot goes and the move is offered to keep; after a loss it just fades', () => {
    const won = battleRun();
    grantHyperMoves(content, won, [hyperEvent(won.party[0]!.uid)]);
    const id = won.party[0]!.moves.find((m) => m.hyper)!.id;
    endHyperMoves(won, true);
    expect(won.party[0]!.moves.some((m) => m.hyper)).toBe(false);
    expect(won.pending).toContainEqual({ kind: 'learnMove', uid: won.party[0]!.uid, moveId: id });
    const lost = battleRun();
    grantHyperMoves(content, lost, [hyperEvent(lost.party[0]!.uid)]);
    endHyperMoves(lost, false);
    expect(lost.party[0]!.moves.some((m) => m.hyper)).toBe(false);
    expect(lost.pending.some((p) => p.kind === 'learnMove')).toBe(false);
  });

  it('picks a strong move the Pokémon can learn and does not know', () => {
    const mon = createPokemon(content, 'charmeleon', 30, 'c1');
    const id = hyperMoveFor(content, mon)!;
    expect(content.moves.get(id)!.category).not.toBe('status');
    expect(mon.moves.some((m) => m.id === id)).toBe(false);
  });
});
