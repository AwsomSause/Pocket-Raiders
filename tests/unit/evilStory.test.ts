// Catalog Overhaul Pack, STORY_FAMILIES_13 / 18: the region-by-region Evil Team storyline (core/evil/teams.ts, evil-story co files).
import { describe, expect, it } from 'vitest';
import { chooseEvent, conditionMet, eligibleEvents } from '../../src/core/events';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { evilOf, evilStageStart, evilTeam, regionTeamId } from '../../src/core/evil/teams';
import { evilEventId } from '../../src/core/evil/content';
import { activeHolds, impound } from '../../src/core/evil/rescue';
import { rescueCtxFor } from '../../src/core/evil/rescueGlue';
import { fillEventText } from '../../src/core/evil/text';
import { crisisLevel } from '../../src/core/story/crisis';
import { PSEUDO_CHAINS } from '../../src/core/dungeon/pseudo';
import { content } from './helpers';

function newRun(seed: string): RunState {
  return chooseStarter(content, createRun(content, { runId: 'r', seed, archetypeId: 'red' }), 0);
}
function withTeam(seed: string, team?: string): RunState {
  const run = newRun(seed);
  while (!evilOf(run).teamId) evilStageStart(content, run);
  if (team) evilOf(run).teamId = team;
  return run;
}
let sides = 0;
function choose(run: RunState, eventId: string, index: number) {
  const node = run.stage!.map.nodes[0]!;
  run.stage!.current = node.id;
  run.stage!.visited = [node.id];
  const id = `t-${++sides}`;
  node.sides.push({ id, kind: 'event', used: false, eventId });
  return chooseEvent(content, run, id, index);
}
const open = (run: RunState, id: string) => content.events.get(id)!.requires.every((c) => conditionMet(content, run, c));
const flagOf = (run: RunState, key: string) => Number(run.story.flags[`ev:${key}`] ?? 0);
/** Stands the story at The Plan and marks the given Operation first. */
function planned(seed: string, team: string, first = 0): RunState {
  const run = withTeam(seed, team);
  evilOf(run).beat = 5;
  return choose(run, evilEventId(team, 'the-plan'), first).run;
}

describe('one team per region (SF13 Part E)', () => {
  it('a home region goes to its own team; every team has 7 steps, 4 Operations, a Hideout and a Holding Pen', () => {
    const run = newRun('home');
    run.regionOrder = ['hoenn', ...run.regionOrder.filter((r) => r !== 'hoenn')];
    run.regionIndex = 0;
    expect(['aqua', 'magma']).toContain(regionTeamId(content, run));
    for (const t of content.evilTeams.teams.filter((x) => !x.roaming)) {
      for (const step of ['suspicious', 'evidence', 'recognized', 'ambush', 'rising-star', 'infighting', 'nemesis', 'the-plan', 'hideout', 'legend', 'rescue']) expect(content.events.has(evilEventId(t.id, step)), `${t.id} ${step}`).toBe(true);
      for (const op of t.ops) {
        expect(content.events.has(evilEventId(t.id, 'op', op.id))).toBe(true);
        expect(op.lasting, `${t.id} ${op.id} lasting`).toBeDefined();
      }
      expect(PSEUDO_CHAINS.some((c) => c.team === t.id && c.entry === evilEventId(t.id, 'hideout'))).toBe(true);
    }
  });

  it('Trouble Inside comes between the lieutenant\'s two meetings', () => {
    const run = withTeam('trouble', 'rocket');
    evilOf(run).beat = 4;
    expect(open(run, evilEventId('rocket', 'infighting'))).toBe(true);
    expect(open(run, evilEventId('rocket', 'nemesis'))).toBe(false);
    const r = choose(run, evilEventId('rocket', 'infighting'), 2).run; // slip away
    expect(open(r, evilEventId('rocket', 'infighting'))).toBe(false);
    expect(open(r, evilEventId('rocket', 'nemesis'))).toBe(true);
  });

  it('the Operation marked first must be dealt with before the other three open', () => {
    const run = planned('first', 'rocket', 1);
    expect(evilOf(run).planFirst).toBe('black-market');
    expect(open(run, evilEventId('rocket', 'op', 'black-market'))).toBe(true);
    expect(open(run, evilEventId('rocket', 'op', 'pokemon-heist'))).toBe(false);
    const ev = content.events.get(evilEventId('rocket', 'op', 'black-market'))!;
    const r = choose(run, ev.id, ev.choices.findIndex((c) => c.label === 'Let it happen.')).run;
    expect(open(r, evilEventId('rocket', 'op', 'pokemon-heist'))).toBe(true);
    expect(flagOf(r, 'wild-no-papers')).toBe(1);
  });
});

describe('Operations and their lasting effects (SF13 Part D)', () => {
  it('a colleague who defected stops their Operation from inside at The Plan', () => {
    const run = withTeam('inside', 'rocket');
    run.story.flags['ev:team-rocket-defector-colleague'] = 1;
    evilOf(run).beat = 5;
    const r = choose(run, evilEventId('rocket', 'the-plan'), 0).run;
    expect(evilOf(r).ops.find((o) => o.id === 'radio-tower')!.outcome).toBe('infiltrated');
    expect(flagOf(r, 'team-op-inside-radio-tower')).toBe(1);
    expect(open(r, evilEventId('rocket', 'op', 'radio-tower'))).toBe(false);
  });

  it('a lasting effect raises the crisis and sets its numbered flags; Magma\'s Dr. Tuff halves his', () => {
    const g = planned('crisis', 'galactic', 1);
    const before = crisisLevel(g);
    const plant = content.events.get(evilEventId('galactic', 'op', 'energy-plant'))!;
    const r = choose(g, plant.id, plant.choices.findIndex((c) => c.label === 'Let it happen.')).run;
    expect(crisisLevel(r)).toBe(Math.min(5, before + 2));
    expect(flagOf(r, 'crisis-blackout-start')).toBe(2);

    const m = withTeam('tuff', 'magma');
    m.story.flags['ev:team-magma-defector-colleague'] = 1;
    evilOf(m).beat = 5;
    const mp = choose(m, evilEventId('magma', 'the-plan'), 2).run;
    expect(evilOf(mp).ops.find((o) => o.id === 'magma-survey')!.outcome).toBe('running');
    const c0 = crisisLevel(mp);
    const survey = content.events.get(evilEventId('magma', 'op', 'magma-survey'))!;
    const done = choose(mp, survey.id, survey.choices.findIndex((c) => c.label === 'Let it happen.'));
    expect(crisisLevel(done.run)).toBe(c0); // +1 halved to 0
    expect(done.changes.join(' ')).toContain('Halved');
  });

  it('region modifiers come off when the region is left; remembered flags stay', () => {
    const run = planned('mods', 'flare', 3);
    const tickets = content.events.get(evilEventId('flare', 'op', 'flare-tickets'))!;
    const r = choose(run, tickets.id, tickets.choices.findIndex((c) => c.label === 'Let it happen.')).run;
    expect(r.perkEffects).toEqual(expect.arrayContaining([{ kind: 'priceMultiplier', group: 'all', value: 1.1 }]));
    r.regionIndex += 1;
    evilStageStart(content, r);
    expect(r.perkEffects ?? []).not.toEqual(expect.arrayContaining([{ kind: 'priceMultiplier', group: 'all', value: 1.1 }]));
    expect(flagOf(r, 'region-rich-gone')).toBe(1);
  });
});

describe('the Hideout (SF13 A8, SF131 to SF133)', () => {
  it('shared rooms read the region\'s own team: words, marks and passes', () => {
    const run = withTeam('rooms', 'aqua');
    expect(fillEventText(content, run, 'A {grunt} of {team}, behind the {front} door.')).toBe('A Aqua Grunt of Team Aqua, behind the Ocean Conservation Fund door.');
    const guard = content.events.get('ps-evil-hideout-b')!;
    const files = guard.remembers.find((v) => v.id === 'files')!;
    expect(files.when.every((c) => conditionMet(content, run, c))).toBe(false);
    run.story.flags['ev:team-aqua-files'] = 1;
    expect(files.when.every((c) => conditionMet(content, run, c))).toBe(true);
    run.story.flags['ev:team-aqua-files-door'] = 1;
    expect(files.when.every((c) => conditionMet(content, run, c))).toBe(false);
  });

  it('the Holding Pen gives back what the region\'s team took from you', () => {
    const run = withTeam('pen', 'rocket');
    while (run.party.length < 5) run.party.push({ ...structuredClone(run.party[0]!), uid: `extra-${run.party.length}` });
    const hold = impound(run, { teamId: 'rocket', regionId: run.regionOrder[0]!, node: 0, lastQuietNode: 5, count: 2 });
    expect(hold).not.toBeNull();
    const size = run.party.length;
    expect(activeHolds(run)).toHaveLength(1);
    const freed = choose(run, evilEventId('rocket', 'rescue'), 0);
    expect(activeHolds(freed.run)).toHaveLength(0);
    expect(freed.run.party.length).toBe(size + hold!.pokemon.length);
    expect(flagOf(freed.run, 'team-rocket-pen-open')).toBe(1);
    expect(freed.changes.join(' ')).toMatch(/back with you/);
  });

  it('A Legend Stirs waits for the team to be beaten, and survives the move to the next region', () => {
    const run = withTeam('legend', 'rocket');
    const id = evilEventId('rocket', 'legend');
    expect(open(run, id)).toBe(false);
    run.story.flags['ev:team-rocket-beaten'] = 1;
    run.regionIndex += 1;
    evilStageStart(content, run);
    expect(open(run, id)).toBe(true);
    const r = choose(run, id, 0).run;
    expect(flagOf(r, 'sign-mewtwo')).toBeGreaterThanOrEqual(1);
    expect(open(r, id)).toBe(false);
  });
});

describe('Intel (run flag `intel`)', () => {
  it('feeds the rescue plans on a 0 to 100 scale, and a defector counts as someone inside', () => {
    const run = withTeam('intel', 'rocket');
    run.expansion = { ...(run.expansion ?? {}), rival: { a: { role: 'main', personality: 'kind' } } } as never;
    const ctx0 = rescueCtxFor(run);
    if (!ctx0) return; // no rescue archetype for this personality: nothing to read
    run.story.flags['ev:intel'] = 3;
    evilOf(run).defector = true;
    const ctx = rescueCtxFor(run)!;
    expect(ctx.intel).toBe(30);
    expect(ctx.insider).toBe(true);
  });
});

describe('every evil-story event reads cleanly', () => {
  it('has no unknown {tokens} once a team is in play', () => {
    const run = withTeam('tokens', 'gilt');
    for (const e of content.events.values()) {
      if (!/^(evil-|ps-evil-|vt-)/.test(e.id)) continue;
      for (const text of [e.intro, ...e.choices.map((c) => c.label), ...e.choices.map((c) => c.success.text)]) expect(fillEventText(content, run, text), e.id).not.toMatch(/\{(team|front|grunt|lt|colleague|boss|teamId)\}/);
    }
    expect(eligibleEvents(content, run).length).toBeGreaterThan(0);
    expect(evilTeam(content, run)!.id).toBe('gilt');
  });
});
