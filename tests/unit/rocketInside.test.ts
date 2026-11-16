// Evil Teams Volume III: Team Rocket from inside, Kanto (core/evil/inside.ts, evil-story-6 to -8 co files).
import { describe, expect, it } from 'vitest';
import { chooseEvent, conditionMet } from '../../src/core/events';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { applyEvilEffect, evilOf, evilStageStart, evilSummary } from '../../src/core/evil/teams';
import { rankOf, standingOf, suspicionOf } from '../../src/core/evil/inside';
import { chainRooms, PSEUDO_CHAINS } from '../../src/core/dungeon/pseudo';
import { content } from './helpers';

function kanto(seed = 'inside-1'): RunState {
  const run = chooseStarter(content, createRun(content, { runId: 'r', seed, archetypeId: 'red' }), 0);
  while (!evilOf(run).teamId) evilStageStart(content, run);
  const s = evilOf(run);
  s.teamId = 'rocket';
  s.region = run.regionIndex;
  run.regionOrder[run.regionIndex] = 'kanto';
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
/** Stands the run at the Offer's moment (The Files played) and says yes. */
function inside(seed?: string, choice = 0): RunState {
  const run = kanto(seed);
  evilOf(run).beat = 1;
  let r = choose(run, 'evil-rocket-evidence', 0).run;
  const offer = r.stage!.map.nodes[0]!.sides.find((x) => x.eventId === 'evil-rocket-offer-kanto' && !x.used);
  expect(offer, 'The Files opens the Offer').toBeTruthy();
  r = chooseEvent(content, r, offer!.id, choice).run;
  return r;
}

describe('Team Rocket from inside (Volume III, Kanto)', () => {
  it('the Offer comes after The Files; yes swaps the outside steps for the Acts', () => {
    const run = inside();
    expect(flagOf(run, 'team-rocket-inside')).toBe(1);
    expect(evilOf(run).beat).toBe(2);
    evilOf(run).nextAt = 0;
    expect(open(run, 'rk-act1')).toBe(true);
    expect(open(run, 'evil-rocket-recognized')).toBe(false);
    expect(rankOf(run, 'rocket')).toBe(1);
    expect(evilSummary(content, run)!.lines.some((l) => l.startsWith('Inside Team Rocket: Recruit (Rank 1)'))).toBe(true);
  });

  it('no keeps the outside story, and the Acts never open', () => {
    const run = inside(undefined, 1);
    evilOf(run).nextAt = 0;
    expect(flagOf(run, 'rocket-offer-refused')).toBe(1);
    expect(open(run, 'evil-rocket-recognized')).toBe(true);
    expect(open(run, 'rk-act1')).toBe(false);
  });

  it('Standing raises the rank at 2, 4, 6, 8 and 10; both meters stay between 0 and 10', () => {
    const run = inside();
    applyEvilEffect(content, run, { kind: 'evil', beat: false, heat: 0, defect: false, standing: 3 });
    expect(rankOf(run, 'rocket')).toBe(2);
    for (let i = 0; i < 5; i++) applyEvilEffect(content, run, { kind: 'evil', beat: false, heat: 0, defect: false, standing: 3 });
    expect(standingOf(run, 'rocket')).toBe(10);
    expect(rankOf(run, 'rocket')).toBe(6);
    applyEvilEffect(content, run, { kind: 'evil', beat: false, heat: 0, defect: false, suspicion: -3 });
    expect(suspicionOf(run, 'rocket')).toBe(0);
  });

  it('the Inside Man gathers Suspicion faster; a careful recruit starts one lower', () => {
    const man = inside('inside-2', 3);
    expect(flagOf(man, 'team-rocket-inside-man')).toBe(1);
    applyEvilEffect(content, man, { kind: 'evil', beat: false, heat: 0, defect: false, suspicion: 1 });
    expect(suspicionOf(man, 'rocket')).toBe(2);
    const careful = inside('inside-3');
    evilOf(careful).nextAt = 0;
    const r = choose(careful, 'rk-act1', 3).run; // (Say nothing.)
    applyEvilEffect(content, r, { kind: 'evil', beat: false, heat: 0, defect: false, suspicion: 1 });
    expect(suspicionOf(r, 'rocket')).toBe(0);
    applyEvilEffect(content, r, { kind: 'evil', beat: false, heat: 0, defect: false, suspicion: 1 });
    expect(suspicionOf(r, 'rocket')).toBe(1);
  });

  it('the loyalty test opens at Suspicion 7, being found out at 10', () => {
    const run = inside();
    evilOf(run).nextAt = 0;
    applyEvilEffect(content, run, { kind: 'evil', beat: false, heat: 0, defect: false, suspicion: 4 });
    applyEvilEffect(content, run, { kind: 'evil', beat: false, heat: 0, defect: false, suspicion: 3 });
    expect(open(run, 'rk-loyalty-test')).toBe(true);
    expect(open(run, 'rk-found-out')).toBe(false);
    applyEvilEffect(content, run, { kind: 'evil', beat: false, heat: 0, defect: false, suspicion: 3 });
    expect(open(run, 'rk-loyalty-test')).toBe(false);
    expect(open(run, 'rk-found-out')).toBe(true);
  });

  it('the Final Choice: the police need Looker met, taking it all needs Rank 5 and the Boss confided', () => {
    const run = inside();
    const view = (id: string) => content.events.get(id)!.choices.map((c) => c.requires.every((x) => conditionMet(content, run, x)));
    expect(view('rk-final-choice')).toEqual([true, true, false, false]);
    run.story.flags['ev:rocket-looker-met'] = 1;
    applyEvilEffect(content, run, { kind: 'evil', beat: false, heat: 0, defect: false, rank: 5, mark: 'confided' });
    expect(view('rk-final-choice')).toEqual([true, true, true, true]);
  });

  it('each ending is its own map, entered on the room the choice opened', () => {
    for (const [id, first] of [['ps_rk_plan', 'rk-plan-hold'], ['ps_rk_turn', 'rk-turn-11'], ['ps_rk_police', 'rk-police-cordon'], ['ps_rk_own', 'rk-own-duel'], ['ps_rk_tower', 'rk-tower-graves']] as const) {
      const chain = PSEUDO_CHAINS.find((c) => c.id === id)!;
      const rooms = chainRooms(content, chain);
      expect(rooms[0]!.event, id).toBe(first);
      expect(rooms.every((r) => content.events.get(r.event)?.room), id).toBe(true);
    }
  });

  it('the region closing takes the meters with it (Johto starts fresh)', () => {
    const run = inside();
    applyEvilEffect(content, run, { kind: 'evil', beat: false, heat: 0, defect: false, standing: 3 });
    run.regionIndex += 1;
    evilStageStart(content, run);
    expect(flagOf(run, 'team-rocket-inside')).toBe(0);
    expect(standingOf(run, 'rocket')).toBe(0);
  });
});
