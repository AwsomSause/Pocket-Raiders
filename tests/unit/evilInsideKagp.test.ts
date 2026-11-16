// Evil Teams Volume III, row 10: Kalos (Flare), Alola (Skull, Aether), Galar (Macro Cosmos, Yell) and Paldea (Star) from
// inside (core/evil/inside.ts; co files evil-story-30 to -41; placement/evil-kagp.json).
import { describe, expect, it } from 'vitest';
import { chooseEvent, conditionMet } from '../../src/core/events';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { applyEvilEffect, evilOf, evilStageStart, evilSummary } from '../../src/core/evil/teams';
import { suspicionOf } from '../../src/core/evil/inside';
import { chainRooms, PSEUDO_CHAINS } from '../../src/core/dungeon/pseudo';
import { readPlacement } from '../../src/core/co/placement';
import placement from '../../src/data/catalogOverhaul/placement/evil-kagp.json';
import { content } from './helpers';

function teamRun(team: string, region: string, seed: string): RunState {
  const run = chooseStarter(content, createRun(content, { runId: 'r', seed, archetypeId: 'red' }), 0);
  while (!evilOf(run).teamId) evilStageStart(content, run);
  const s = evilOf(run);
  s.teamId = team;
  s.region = run.regionIndex;
  run.regionOrder[run.regionIndex] = region;
  return run;
}
let sides = 0;
function choose(run: RunState, eventId: string, index: number) {
  const node = run.stage!.map.nodes[0]!;
  run.stage!.current = node.id;
  run.stage!.visited = [node.id];
  const id = `k-${++sides}`;
  node.sides.push({ id, kind: 'event', used: false, eventId });
  return chooseEvent(content, run, id, index);
}
const open = (run: RunState, id: string) => content.events.get(id)!.requires.every((c) => conditionMet(content, run, c));
const flagOf = (run: RunState, key: string) => Number(run.story.flags[`ev:${key}`] ?? 0);
const view = (run: RunState, id: string) => content.events.get(id)!.choices.map((c) => c.requires.every((x) => conditionMet(content, run, x)));
/** Plays The Files, then answers the Offer (0: yes, 1: no). */
function offered(team: string, region: string, seed: string, choice = 0): RunState {
  const run = teamRun(team, region, seed);
  evilOf(run).beat = 1;
  let r = choose(run, `evil-${team}-evidence`, 0).run;
  const offer = r.stage!.map.nodes[0]!.sides.find((x) => x.eventId === `evil-${team}-offer-${region}` && !x.used);
  expect(offer, `The Files opens ${team}'s Offer`).toBeTruthy();
  r = chooseEvent(content, r, offer!.id, choice).run;
  evilOf(r).nextAt = 0;
  return r;
}

describe('Volume III, row 10: the Offer and Act 1 for each team', () => {
  for (const [team, region, act1, title] of [
    ['flare', 'kalos', 'fl-act1', 'Subscriber'], ['skull', 'alola', 'sk-act1', 'Numbskull'], ['aether', 'alola', 'ae-act1', 'Volunteer'],
    ['yell', 'galar', 'yl-act1', 'Supporter'], ['star', 'paldea', 'st-act1', 'New Kid'],
  ] as const) {
    it(`${team}: yes opens ${act1} with the region's ranks; no keeps the outside story`, () => {
      const run = offered(team, region, `kagp-${team}`);
      expect(flagOf(run, `team-${team}-inside`)).toBe(1);
      expect(open(run, act1)).toBe(true);
      expect(evilSummary(content, run)!.lines.some((l) => l.includes(`${title} (Rank 1)`))).toBe(true);
      const out = offered(team, region, `kagp-${team}-no`, 1);
      expect(flagOf(out, `team-${team}-inside`)).toBe(0);
      expect(open(out, act1)).toBe(false);
    });
  }

  it('Galar: Yell inside closes the Macro Cosmos Offer; the Macro Cosmos Acts need its side flag', () => {
    const run = offered('yell', 'galar', 'kagp-galar');
    expect(flagOf(run, 'galar-side-yell')).toBe(1);
    expect(open(run, 'evil-mc-offer-galar')).toBe(false);
    expect(open(run, 'mc-act1')).toBe(false);
    const out = offered('yell', 'galar', 'kagp-galar-no', 1);
    expect(open(out, 'evil-mc-offer-galar')).toBe(true);
  });
});

describe('Volume III, row 10: Paldea, Team Star', () => {
  it("Team Star doesn't test people: Odin asks at Suspicion 7; at 10 you walk out, with no battle", () => {
    const run = offered('star', 'paldea', 'kagp-odin');
    applyEvilEffect(content, run, { kind: 'evil', beat: false, heat: 0, defect: false, suspicion: 7 });
    expect(suspicionOf(run, 'star')).toBe(7);
    expect(open(run, 'st-odin-asks')).toBe(true);
    expect(open(run, 'st-found-out')).toBe(false);
    applyEvilEffect(content, run, { kind: 'evil', beat: false, heat: 0, defect: false, suspicion: 3 });
    expect(open(run, 'st-odin-asks')).toBe(false);
    expect(open(run, 'st-found-out')).toBe(true);
    expect(content.events.get('st-found-out')!.choices.every((c) => !c.success.battle)).toBe(true);
  });

  it('the Final Choice: asking Mr. Upshaw needs him seen; taking it all needs Rank 5 and Penny confided', () => {
    const run = offered('star', 'paldea', 'kagp-final');
    expect(view(run, 'st-final-choice')).toEqual([true, true, false, false]);
    run.story.flags['ev:upshaw-seen'] = 1;
    applyEvilEffect(content, run, { kind: 'evil', beat: false, heat: 0, defect: false, rank: 5, mark: 'confided' });
    expect(view(run, 'st-final-choice')).toEqual([true, true, true, true]);
  });

  it('Team Homeroom is founded only by a player who refused the helmet, refused Clive, and sent Yusuf to his volcano', () => {
    const run = offered('star', 'paldea', 'kagp-homeroom', 1);
    evilOf(run).beat = 4;
    const met = () => content.events.get('hr-founding')!.requires.every((c) => conditionMet(content, run, c));
    expect(met()).toBe(false);
    run.story.flags['ev:star-volcano'] = 1;
    expect(met()).toBe(true);
    run.story.flags['ev:star-clive-friend'] = 1;
    expect(met()).toBe(false);
  });
});

describe('Volume III, row 10: maps and placement', () => {
  it('each ending, door and third-option walk is its own map, entered on the room the choice opened', () => {
    const ids = ['ps_fl_stones', 'ps_fl_plan', 'ps_fl_turn', 'ps_fl_az', 'ps_fl_own', 'ps_ember_laundry', 'ps_sk_cold', 'ps_ae_cold', 'ps_sk_plan', 'ps_ae_turn', 'ps_ae_case',
      'ps_sk_placed', 'ps_tp_entries', 'ps_tp_still', 'ps_mc_flicker', 'ps_mc_plan', 'ps_mc_turn', 'ps_mc_lift', 'ps_mc_own', 'ps_yl_plan', 'ps_yl_turn', 'ps_yl_bought', 'ps_yl_own',
      'ps_enc_quarry', 'ps_enc_island', 'ps_enc_12k', 'ps_st_file', 'ps_st_plan', 'ps_st_turn', 'ps_st_academy', 'ps_st_own', 'ps_hr_lunch1', 'ps_hr_lunch2', 'ps_hr_pyjamas'];
    for (const id of ids) {
      const chain = PSEUDO_CHAINS.find((c) => c.id === id);
      expect(chain, id).toBeTruthy();
      const rooms = chainRooms(content, chain!);
      expect(rooms.length, id).toBeGreaterThan(0);
      expect(rooms.every((r) => content.events.get(r.event)?.room), id).toBe(true);
    }
  });

  it('every placed event exists, is not a room or a callback, and sits inside its region (in-region stages 3 to 8)', () => {
    for (const [id, raw] of Object.entries(placement)) {
      if (id.startsWith('$')) continue;
      const ev = content.events.get(id);
      expect(ev, id).toBeTruthy();
      expect(ev!.room || ev!.callback, id).toBeFalsy();
      const p = readPlacement(raw as Record<string, unknown>);
      expect(p.stages.length, id).toBeGreaterThan(0);
      expect(p.stages.every((s) => s >= 2 && s <= 8), id).toBe(true);
      expect(p.sits, id).not.toBe('must-see');
    }
  });
});
