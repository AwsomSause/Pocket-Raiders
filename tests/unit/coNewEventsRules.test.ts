// Catalog Overhaul row 17 (new events), Part 1 fixes: heal everyone but the lead, the sky clears for a stage, a flag that may be
// unset but must be fresh, the next region's name in text, a one-on-one duel, and the run's first Z-Move.
import { describe, expect, it } from 'vitest';
import { conditionMet, applyEffect } from '../../src/core/events';
import { fillCoText } from '../../src/core/events/coToolkit';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { beginBattle, chooseStarter, createRun, takeTurn } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { stageFronts } from '../../src/core/world';
import { content, toBattle } from './helpers';
import type { EventCondition, EventEffect } from '../../src/core/contentSchema';

const freshRun = (): RunState => chooseStarter(content, createRun(content, { runId: 'nr', seed: 'ne-rules', archetypeId: 'red' }), 0);
const rng = () => new Rng(hashSeed('ne-rules'));
const withTwo = (): RunState => {
  const run = freshRun();
  run.party.push(createPokemon(content, 'rattata', 10, 'second'));
  return run;
};

describe('heal: everyone but the lead (NE19 bad dream)', () => {
  it('the lead keeps its HP, the rest are healed', () => {
    const run = withTwo();
    for (const m of run.party) m.hp = 1;
    applyEffect(content, run, { kind: 'heal', share: 1, who: 'others' }, rng());
    expect(run.party[0]!.hp).toBe(1);
    expect(run.party[1]!.hp).toBe(maxHp(content, run.party[1]!));
  });
  it('a fainted Pokémon is not brought back (boundary)', () => {
    const run = withTwo();
    run.party[1]!.hp = 0;
    applyEffect(content, run, { kind: 'heal', share: 1, who: 'others' }, rng());
    expect(run.party[1]!.hp).toBe(0);
  });
});

describe('clearSky (NE9: the storm waited out)', () => {
  it('no weather front for the rest of the stage', () => {
    const run = freshRun();
    run.stage!.extraFronts.push({ weather: 'rain', from: 3, to: 5 });
    expect(stageFronts(content, run).length).toBeGreaterThan(0);
    applyEffect(content, run, { kind: 'clearSky' } as EventEffect, rng());
    expect(stageFronts(content, run)).toEqual([]);
  });
});

describe('a flag that may be unset but must be from this region (NE8 crystal)', () => {
  const fresh = { kind: 'flag', key: 'z-crystal-left', atLeast: 0, atMost: 99, regionsAgoMost: 0 } as EventCondition;
  it('holds while unset and in the region it was set in, not a region later', () => {
    const run = freshRun();
    expect(conditionMet(content, run, fresh)).toBe(true);
    applyEffect(content, run, { kind: 'flag', key: 'z-crystal-left', amount: 1, stamp: 'region' }, rng());
    expect(conditionMet(content, run, fresh)).toBe(true);
    run.regionIndex += 1;
    expect(conditionMet(content, run, fresh)).toBe(false);
  });
  it('an ordinary stamped check still needs the flag (failure case)', () => {
    const run = freshRun();
    expect(conditionMet(content, run, { kind: 'flag', key: 'z-crystal-left', atLeast: 1, atMost: 99, regionsAgoMost: 0 } as EventCondition)).toBe(false);
  });
});

describe('{nextRegion} in event text (NE17)', () => {
  it('names the next region, or the League in the last one', () => {
    const run = freshRun();
    const next = content.regions.get(run.regionOrder[1]!)!.name;
    expect(fillCoText(content, run, 'After this comes {nextRegion}.')).toBe(`After this comes ${next}.`);
    run.regionIndex = run.regionOrder.length - 1;
    expect(fillCoText(content, run, '{nextRegion}')).toBe('the League');
  });
});

describe('a one-on-one duel (NE23)', () => {
  it('the fight is lost when the duellist goes down, even with others able to fight', () => {
    const run = beginBattle(content, toBattle(withTwo())).run;
    const b = run.battle!;
    b.eventRule = { ...(b.eventRule ?? {}), noSwitch: true, oneOnOne: true } as typeof b.eventRule;
    const lead = run.party[b.activeIndex]!;
    lead.hp = 1;
    lead.moves = [{ id: 'splash', pp: 40 }];
    for (const e of b.enemyTeam) e.level = 100;
    const fight = (rule: boolean) => {
      let r = structuredClone(run);
      if (!rule) r.battle!.eventRule = { ...r.battle!.eventRule, oneOnOne: false } as typeof b.eventRule;
      let defeated = false;
      for (let i = 0; i < 10 && !defeated && r.battle && !r.battle.outcome && (r.party.find((m) => m.uid === lead.uid)?.hp ?? 0) > 0; i++) {
        const res = takeTurn(content, r, { kind: 'move', index: 0 });
        r = res.run;
        defeated = res.defeated;
      }
      return { r, lost: defeated || r.battle?.outcome === 'lose' };
    };
    const duel = fight(true);
    expect(duel.r.party.find((m) => m.uid === lead.uid)!.hp).toBe(0);
    expect(duel.r.party.some((m) => m.uid !== lead.uid && m.hp > 0)).toBe(true);
    expect(duel.lost).toBe(true);
    // Without the rule the fight goes on: the second Pokémon can still come out.
    expect(fight(false).lost).toBe(false);
  });
});

describe('the run remembers its first Z-Move (NE8 afterstory)', () => {
  it('a won battle with a Z-Move used sets z-move-used; one without does not', () => {
    for (const used of [true, false]) {
      const run = beginBattle(content, toBattle(freshRun())).run;
      const b = run.battle!;
      if (used) b.transform.used.player.push('zmove');
      for (const e of b.enemyTeam) e.hp = 1;
      run.party[b.activeIndex]!.moves = [{ id: 'tackle', pp: 35 }];
      run.party[b.activeIndex]!.level = 100;
      let r = run;
      for (let i = 0; i < 6 && r.battle; i++) r = takeTurn(content, r, { kind: 'move', index: 0 }).run;
      expect(Number(r.story.flags['ev:z-move-used'] ?? 0)).toBe(used ? 1 : 0);
    }
  });
});
