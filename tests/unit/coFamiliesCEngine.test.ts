// Catalog Overhaul families-c engine pieces: SF69 "evolves only if never put in the PC" (boxBond) and GL2's
// Gym-of-this-region badge (gymHere, gymTypeItem, {gymType}).
import { describe, expect, it } from 'vitest';
import { boxBond, boxedNoEvolve, hereGymType, noteBoxed } from '../../src/core/events/coHelpers';
import { fillCoText } from '../../src/core/events/coToolkit';
import { currentRegion } from '../../src/core/regions';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

function start(): RunState {
  return chooseStarter(content, createRun(content, { runId: 'r', seed: 'fc-engine', archetypeId: 'red' }), 0);
}

describe('boxBond (SF69 Trubbish)', () => {
  it('a bound Pokémon still evolves while it stays in the party', () => {
    const run = start();
    boxBond(run, 'trubbish');
    expect(boxedNoEvolve(run, run.party[0]!)).toBe(false);
  });

  it('once put in the PC it never evolves this run', () => {
    const run = start();
    run.party.push({ ...structuredClone(run.party[0]!), uid: 'p-trubbish' });
    boxBond(run, 'trubbish');
    noteBoxed(run, run.party[1]!); // what depositToBox calls before the Pokémon leaves the party
    expect(boxedNoEvolve(run, { uid: 'p-trubbish' })).toBe(true);
    expect(boxedNoEvolve(run, run.party[0]!)).toBe(false);
  });

  it('boxing an unbound Pokémon changes nothing', () => {
    const run = start();
    noteBoxed(run, run.party[0]!);
    expect(boxedNoEvolve(run, run.party[0]!)).toBe(false);
  });
});

describe('gym of this region (GL2 Janitor)', () => {
  it('before any Gym: no "beaten here", but the badge type is the first Gym not yet met', () => {
    const run = start();
    const leaders = currentRegion(content, run).gymLeaders.filter((id) => content.bosses.has(id));
    expect(hereGymType(content, run, true)).toBeNull();
    expect(hereGymType(content, run, false)).toBe(content.bosses.get(leaders[0]!)!.types[0]);
  });

  it('after a Gym here: the last one beaten', () => {
    const run = start();
    const leaders = currentRegion(content, run).gymLeaders.filter((id) => content.bosses.has(id));
    run.usedLeaders.push(leaders[1]!);
    expect(hereGymType(content, run, true)).toBe(content.bosses.get(leaders[1]!)!.types[0]);
    const word = fillCoText(content, run, '{gymType}');
    expect(word.toLowerCase()).toBe(content.bosses.get(leaders[1]!)!.types[0]);
  });

  it('every badge the effect can give exists as a supported held item', () => {
    for (const t of ['normal', 'fire', 'water', 'grass', 'electric', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy']) {
      expect(content.catalog.get(`old-badge-${t}`)?.status, t).toBe('supported');
    }
  });
});
