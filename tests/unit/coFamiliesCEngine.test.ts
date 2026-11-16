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

describe('Mystery Dungeon (SF73)', () => {
  it('plays every room of a floor before going down, then the Spring, then walks out', async () => {
    const { dungeonNext, dungeonStart } = await import('../../src/core/events/coDungeon');
    const run = start();
    dungeonStart(run, false);
    const seen: string[] = [];
    let from = 'md-entrance';
    for (let i = 0; i < 12; i++) {
      const r = dungeonNext(run, from);
      if (r.out || !r.next) break;
      seen.push(r.next);
      from = r.next;
    }
    expect(seen.slice(0, 3).sort()).toEqual(['md-1-item-room', 'md-1-monster-house', 'md-1-trap-corridor']);
    expect(seen.slice(3, 6).sort()).toEqual(['md-2-fork', 'md-2-shop', 'md-2-sleeping-den']);
    expect(seen.slice(6, 8).sort()).toEqual(['md-3-ambush', 'md-3-boss-door']);
    expect(seen[8]).toBe('md-3-spring');
    expect(seen).toHaveLength(9);
  });

  it('out of Luck: pushed back up, one held item lost, the rest kept', async () => {
    const { dropOneHeld, dungeonNext, dungeonStart } = await import('../../src/core/events/coDungeon');
    const run = start();
    dungeonStart(run, true);
    expect(run.story.flags['ev:dungeon-luck']).toBe(4);
    run.story.flags['ev:dungeon-luck'] = 0;
    run.party[0]!.held = { 'silk-scarf': 1, charcoal: 1 };
    expect(dungeonNext(run, 'md-1-item-room')).toEqual({ out: true });
    expect(dropOneHeld(run)).toBe('charcoal');
    expect(run.party[0]!.held).toEqual({ 'silk-scarf': 1 });
  });

  it('a thief finds the NO room where the shop was', async () => {
    const { dungeonNext, dungeonStart } = await import('../../src/core/events/coDungeon');
    const run = start();
    dungeonStart(run, false);
    run.story.flags['co:md-done'] = 'md-1-item-room,md-1-monster-house,md-1-trap-corridor,md-2-fork,md-2-sleeping-den';
    run.story.flags['ev:md-stole'] = 1;
    expect(dungeonNext(run, 'md-2-fork')).toEqual({ out: false, next: 'md-2-no' });
    expect(dungeonNext(run, 'md-2-no')).toEqual({ out: false, next: expect.stringMatching(/^md-3-(ambush|boss-door)$/) });
  });
});
