import { describe, expect, it } from 'vitest';
import { canSwapLead, leadChoices, nextLead, swapOpeningLead } from '../../src/core/battle/openingLead';
import { createPokemon } from '../../src/core/pokemon';
import { beginBattle, chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content, toBattle } from './helpers';

// "Change who leads" (Kice 2026-11-20): before the first turn of a single battle, another healthy Pokémon may lead,
// for free. It happens before either side's entry abilities run, rolls nothing, and is closed once the fight begins.

/** A run in its first battle, before the entry abilities, with a party of three (the second has fainted). */
function inBattle(seed = 'LEADSWAP'): RunState {
  const run = toBattle(chooseStarter(content, createRun(content, { runId: 'ls', seed, archetypeId: 'red' }), 0));
  expect(run.phase).toBe('battle');
  run.party.push(createPokemon(content, 'pidgey', 5, 'ls-p2'), createPokemon(content, 'rattata', 5, 'ls-p3'));
  run.party[1]!.hp = 0;
  return run;
}

describe('Change who leads', () => {
  it('is open on turn 1 before anyone has entered, and lists only Pokémon that can fight', () => {
    const run = inBattle();
    expect(run.battle!.pendingEntry).toContain('player');
    expect(canSwapLead(run)).toBe(true);
    expect(leadChoices(run)).toEqual([0, 2]);
  });

  it('swaps the lead at no cost: the turn, the foe, the rolls and the party order stay as they were', () => {
    const run = inBattle();
    const before = structuredClone(run);
    const after = swapOpeningLead(run, 2);
    expect(after.battle!.activeIndex).toBe(2);
    expect(after.battle!.turn).toBe(1);
    expect(after.battle!.enemyTeam).toEqual(before.battle!.enemyTeam);
    expect(after.rng).toEqual(before.rng);
    expect(after.party.map((m) => m.uid)).toEqual(before.party.map((m) => m.uid));
    expect(after.party.map((m) => m.hp)).toEqual(before.party.map((m) => m.hp));
    expect(after.battle!.pendingEntry).toEqual(before.battle!.pendingEntry);
    // The one that stepped aside never fought, so it gets no share of the experience; the new lead does.
    expect(after.battle!.participants).toEqual(['ls-p3']);
    // The input run is not changed.
    expect(run).toEqual(before);
  });

  it("the new lead is the one whose entry runs when the fight begins, and the lead can't change after that", () => {
    const swapped = swapOpeningLead(inBattle(), 2);
    const begun = beginBattle(content, swapped).run;
    expect(begun.battle!.activeIndex).toBe(2);
    expect(begun.battle!.pendingEntry).toEqual([]);
    expect(canSwapLead(begun)).toBe(false);
    expect(() => swapOpeningLead(begun, 0)).toThrow(/before the first turn/);
  });

  it('can change back and forth before the fight begins; the same lead again changes nothing', () => {
    const run = inBattle();
    expect(swapOpeningLead(run, 0)).toBe(run);
    const back = swapOpeningLead(swapOpeningLead(run, 2), 0);
    expect(back.battle!.activeIndex).toBe(0);
    expect(back.battle!.participants).toEqual([run.party[0]!.uid]);
  });

  it('steps round the healthy Pokémon, skipping a fainted one, both ways', () => {
    const run = inBattle();
    expect(nextLead(run, 1)).toBe(2);
    expect(nextLead(run, -1)).toBe(2);
    expect(nextLead(swapOpeningLead(run, 2), 1)).toBe(0);
  });

  it('refuses a fainted Pokémon or an empty slot', () => {
    const run = inBattle();
    expect(() => swapOpeningLead(run, 1)).toThrow(/cannot lead/);
    expect(() => swapOpeningLead(run, 9)).toThrow(/cannot lead/);
  });

  it('is closed with only one Pokémon that can fight, after turn 1, in a double battle, and in a fight whose rules fix the lead', () => {
    const one = inBattle();
    one.party[2]!.hp = 0;
    expect(canSwapLead(one)).toBe(false);
    const later = inBattle();
    later.battle!.turn = 2;
    expect(canSwapLead(later)).toBe(false);
    const doubles = inBattle();
    doubles.battle!.doubles = { size: 2 } as never;
    expect(canSwapLead(doubles)).toBe(false);
    for (const rule of [{ noSwitch: true }, { oneOnOne: true }, { pondDuel: true }, { leadType: 'fire' }, { matchLead: true }]) {
      const fixed = inBattle();
      fixed.battle!.eventRule = rule as never;
      expect(canSwapLead(fixed), JSON.stringify(rule)).toBe(false);
    }
    const map = inBattle();
    map.phase = 'map';
    expect(canSwapLead(map)).toBe(false);
  });
});
