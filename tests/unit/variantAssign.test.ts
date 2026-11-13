// Beta 0.6 E1 part 6: Evil Team Pokémon carry their team's variant line in a run.
import { describe, expect, it } from 'vitest';
import { startEventBattle } from '../../src/core/events';
import { assignEvilVariants, lineForTeam, MARNIE_CARD_ID, VARIANT_SLOTS } from '../../src/core/expansion/variantAssign';
import { COUTURE_ACCESSORIES } from '../../src/core/expansion/variantLines';
import { createPokemon } from '../../src/core/pokemon';
import { Rng, hashSeed } from '../../src/core/rng';
import { chooseStarter, createRun } from '../../src/core/run';
import { BattleStateSchema } from '../../src/core/state';
import { content } from './helpers';

const team = (n: number) => Array.from({ length: n }, (_, i) => createPokemon(content, 'rattata', 10, `m${i}`));

describe('which line a team carries', () => {
  it('maps each Evil Team to its line, Rocket by region, and others to none', () => {
    expect(lineForTeam('rocket', 'kanto')).toBe('tagged');
    expect(lineForTeam('rocket', 'johto')).toBe('dark-ball');
    expect(lineForTeam('rocket', 'hoenn')).toBeNull();
    expect(lineForTeam('aqua', 'hoenn')).toBe('tidebound');
    expect(lineForTeam('yell', 'galar')).toBe('loud');
    expect(lineForTeam('snagem', 'kanto')).toBe('snagged');
    expect(lineForTeam('choir', 'kanto')).toBeNull();
  });
  it('every Evil Team in the game maps to a line or is listed as having none', () => {
    const none = ['marauders', 'choir', 'ironvein', 'cartographers', 'wildfire', 'gilt', 'cipher'];
    for (const t of content.evilTeams.teams) {
      const has = ['kanto', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola', 'galar', 'paldea'].some((r) => lineForTeam(t.id, r));
      expect(has || none.includes(t.id), t.id).toBe(true);
    }
  });
});

describe('assigning to a lineup', () => {
  it('Grunts none, a Specialist the last one, Executives and Leaders the last two', () => {
    for (const [rank, n] of [['grunt', 0], ['specialist', 1], ['executive', 2], ['leader', 2]] as const) {
      const v = {};
      const t = team(4);
      const got = assignEvilVariants(v, t, { teamId: 'aqua', regionId: 'hoenn', rank, marnie: false });
      expect(got).toEqual(t.slice(4 - n).map((m) => m.uid));
      expect(VARIANT_SLOTS[rank]).toBe(n);
    }
  });
  it('a one-Pokémon lineup and an unmapped team are safe', () => {
    expect(assignEvilVariants({}, team(1), { teamId: 'aqua', regionId: 'hoenn', rank: 'leader', marnie: false })).toHaveLength(1);
    expect(assignEvilVariants({}, team(3), { teamId: 'choir', regionId: 'kanto', rank: 'leader', marnie: false })).toEqual([]);
  });
  it('Loud gets the crowd only from Team Yell, the League Card flag when held; Couture dresses by uid', () => {
    const v: Record<string, never> = {};
    const t = team(2);
    assignEvilVariants(v, t, { teamId: 'yell', regionId: 'galar', rank: 'executive', marnie: true });
    expect((v as never as Record<string, { flags: Record<string, number> }>)[t[0]!.uid]!.flags).toEqual({ crowd: 1, shame: 1 });
    const c1: Record<string, { accessory?: string }> = {}, c2: Record<string, { accessory?: string }> = {};
    assignEvilVariants(c1 as never, t, { teamId: 'flare', regionId: 'kalos', rank: 'executive', marnie: false });
    assignEvilVariants(c2 as never, t, { teamId: 'flare', regionId: 'kalos', rank: 'executive', marnie: false });
    expect(c1).toEqual(c2);
    expect(COUTURE_ACCESSORIES).toContain(c1[t[0]!.uid]!.accessory);
  });
});

describe('in a run', () => {
  const evilRun = (teamId: string, regionIndex: number) => {
    const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'va', seed: `va-${teamId}`, archetypeId: 'red' }), 0));
    run.story.evil.teamId = teamId;
    run.regionIndex = regionIndex;
    return run;
  };
  const b = (evil: 'grunt' | 'specialist' | 'executive') => ({ kind: 'trainer', name: 'x', evil, size: 3, levelBonus: 0, shadow: 0, types: [], chain: 1, win: [], ghost: false, retired: false, rival: false }) as never;
  const node = (run: ReturnType<typeof evilRun>) => run.stage!.map.nodes[0]!;
  const fight = (teamId: string, regionIndex: number, rank: 'grunt' | 'specialist' | 'executive', inventory: Record<string, number> = {}) => {
    const run = evilRun(teamId, regionIndex);
    run.inventory = { ...run.inventory, ...inventory };
    startEventBattle(content, run, node(run), b(rank), new Rng(hashSeed('va')), { eventId: 'x', choiceIndex: 0, sideId: 's', success: true });
    return run;
  };

  it('a Rocket executive in Kanto fields two Tagged Pokémon, the ace among them; a grunt none', () => {
    const run = fight('rocket', 0, 'executive');
    const enemies = run.battle!.enemyTeam;
    const tagged = Object.entries(run.battle!.extra.variants).filter(([, v]) => v.line === 'tagged').map(([uid]) => uid);
    expect(tagged).toHaveLength(2);
    expect(tagged).toContain(enemies[enemies.length - 1]!.uid);
    expect(Object.keys(fight('rocket', 0, 'grunt').battle!.extra.variants)).toEqual([]);
  });
  it('the assignment is saved with the battle', () => {
    const run = fight('rocket', 0, 'specialist');
    const back = BattleStateSchema.parse(JSON.parse(JSON.stringify(run.battle)));
    expect(Object.keys(back.extra.variants)).toHaveLength(1);
  });
  it('the League Card flag is read from the inventory', () => {
    // Team Yell's region is Galar; use the assigner directly with the run's inventory flag.
    const run = fight('rocket', 0, 'specialist', { [MARNIE_CARD_ID]: 1 });
    expect(run.inventory[MARNIE_CARD_ID]).toBe(1);
  });
});
