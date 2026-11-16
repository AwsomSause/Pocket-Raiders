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

describe('Legendary pieces (L1, L16, the other roamers)', () => {
  const bless = (run: RunState, id: string, influence: number): void => {
    run.expansion = { ...run.expansion, blessing: { id, tier: 'greater', influence, seen: true, ashRegions: [], communion: false, riteUsed: false, stagesDone: [] } } as RunState['expansion'];
  };

  it('a Sign raises Influence only when it is the blessed Legendary', async () => {
    const { blessedMet, giveSign } = await import('../../src/core/events/coLegends');
    const run = start();
    run.expansion = { ...run.expansion, blessing: undefined } as RunState['expansion'];
    expect(blessedMet(run, false, undefined, 0)).toBe(true);
    expect(giveSign(run, 'tornadus', 1)).toBe(false);
    expect(run.story.flags['ev:sign-tornadus']).toBe(1);
    bless(run, 'tornadus', 2);
    expect(giveSign(run, 'entei', 1)).toBe(false);
    expect(giveSign(run, 'tornadus', 2)).toBe(true);
    expect(blessedMet(run, true, 'tornadus', 4)).toBe(true);
    expect(blessedMet(run, true, 'tornadus', 5)).toBe(false);
    expect(blessedMet(run, true, 'entei', 0)).toBe(false);
  });

  it('a roamer trail: the chance grows with its Influence and after "Leave it be", and each try is fixed by the seed', async () => {
    const { roamFound, roamPercent } = await import('../../src/core/events/coLegends');
    const run = start();
    run.expansion = { ...run.expansion, blessing: undefined } as RunState['expansion'];
    expect(roamPercent(run, 'tornadus')).toBe(25);
    run.story.flags['ev:roam-tornadus-left'] = 1;
    expect(roamPercent(run, 'tornadus')).toBe(40);
    bless(run, 'tornadus', 10);
    expect(roamPercent(run, 'tornadus')).toBe(90);
    const a = structuredClone(run);
    const b = structuredClone(run);
    expect(roamFound(a, 'tornadus')).toBe(roamFound(b, 'tornadus'));
    expect(a.story.flags['ev:roam-tornadus-chased']).toBe(1);
    expect(a.story.flags['ev:roam-tornadus-left']).toBe(0);
  });

  it('the Tower bowl takes one item of the tier, and nothing when there is none', async () => {
    const { offerItem } = await import('../../src/core/events/coLegends');
    const { tierOf } = await import('../../src/core/events/coHelpers');
    const run = start();
    run.inventory = {};
    expect(offerItem(content, run, 'rare')).toBeNull();
    const common = [...content.catalog.keys()].find((id) => tierOf(content, id) === 'common')!;
    run.inventory[common] = 2;
    expect(offerItem(content, run, 'common')).toBe(common);
    expect(run.inventory[common]).toBe(1);
  });

  it('every Part 0 pointer id is built, and the Noble fight calms on turns it is not hurt', () => {
    for (const id of ['alpha-noble-kleavor', 'beast-lookout', 'beast-clue-ripple', 'roamer-suicune', 'roamer-latias', 'tower-entrance', 'tower-5', 'tower-week-entrance', 'mr-ancient-gym-vault', 'time-capsule', 'rk-sealed-letter-open', 'ovc-the-letter-to-future-you-s3', 'turo-machine', 'oracle', 'rainbow-rocket']) {
      expect(content.events.has(id), id).toBe(true);
    }
    const noble = content.events.get('alpha-noble-kleavor')!;
    const b = noble.choices[0]!.success.battle as { kind: string; rule?: { calm?: number }; friendly?: boolean };
    expect(b.kind).toBe('wild');
    expect(b.rule?.calm).toBe(3);
    expect(b.friendly).toBe(true);
  });
});
