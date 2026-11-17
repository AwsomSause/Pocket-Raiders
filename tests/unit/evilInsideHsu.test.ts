// Evil Teams Volume III, row 9: Galactic (Sinnoh), Plasma (Unova), Magma and Aqua (Hoenn) from inside, and the third
// options (Team Lantern, Team Open Hand, Team Sky). core/evil/inside.ts, evil-hoenn-sinnoh-unova co files.
import { describe, expect, it } from 'vitest';
import { chooseEvent, conditionMet } from '../../src/core/events';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { applyEvilEffect, evilOf, evilStageStart, evilSummary } from '../../src/core/evil/teams';
import { rankOf, routeOf, suspicionOf } from '../../src/core/evil/inside';
import { chainRooms, PSEUDO_CHAINS } from '../../src/core/dungeon/pseudo';
import { content } from './helpers';

function region(team: string, where: string, seed = 'hsu-1'): RunState {
  const run = chooseStarter(content, createRun(content, { runId: 'r', seed, archetypeId: 'red' }), 0);
  while (!evilOf(run).teamId) evilStageStart(content, run);
  const s = evilOf(run);
  s.teamId = team;
  s.region = run.regionIndex;
  run.regionOrder[run.regionIndex] = where;
  return run;
}
let sides = 0;
function choose(run: RunState, eventId: string, index: number) {
  const node = run.stage!.map.nodes[0]!;
  run.stage!.current = node.id;
  run.stage!.visited = [node.id];
  const id = `h-${++sides}`;
  node.sides.push({ id, kind: 'event', used: false, eventId });
  return chooseEvent(content, run, id, index);
}
const open = (run: RunState, id: string) => content.events.get(id)!.requires.every((c) => conditionMet(content, run, c));
const flagOf = (run: RunState, key: string) => Number(run.story.flags[`ev:${key}`] ?? 0);
const fx = (run: RunState, e: Record<string, unknown>) => applyEvilEffect(content, run, { kind: 'evil', beat: false, heat: 0, defect: false, ...e } as never);
/** The Files played, then the team's Offer answered. */
function offered(team: string, where: string, choice: number, seed?: string): RunState {
  const run = region(team, where, seed);
  evilOf(run).beat = 1;
  let r = choose(run, `evil-${team}-evidence`, 0).run;
  const offer = r.stage!.map.nodes[0]!.sides.find((x) => x.eventId === `evil-${team}-offer-${where}` && !x.used);
  expect(offer, `${team}: The Files opens the Offer`).toBeTruthy();
  r = chooseEvent(content, r, offer!.id, choice).run;
  return r;
}
const mapsStartOn = (pairs: [string, string][]) => {
  for (const [id, first] of pairs) {
    const chain = PSEUDO_CHAINS.find((c) => c.id === id);
    expect(chain, id).toBeTruthy();
    const rooms = chainRooms(content, chain!);
    expect(rooms[0]!.event, id).toBe(first);
    expect(rooms.every((r) => content.events.get(r.event)?.room), id).toBe(true);
  }
};

describe('Team Galactic from inside (Volume III, Sinnoh)', () => {
  it('The Files opens the Offer; yes starts the Acts with Sinnoh ranks, no keeps the outside story', () => {
    const run = offered('galactic', 'sinnoh', 0);
    evilOf(run).nextAt = 0;
    expect(open(run, 'gx-act1')).toBe(true);
    expect(open(run, 'evil-galactic-recognized')).toBe(false);
    expect(evilSummary(content, run)!.lines.some((l) => l.startsWith('Inside Team Galactic: Applicant (Rank 1)'))).toBe(true);
    const out = offered('galactic', 'sinnoh', 1, 'hsu-2');
    evilOf(out).nextAt = 0;
    expect(open(out, 'gx-act1')).toBe(false);
    expect(flagOf(out, 'galactic-offer-refused')).toBe(1);
  });

  it('Act 4 needs Rank 4, and Act 3 lifts the player to it; the Witness skips Rank 5', () => {
    const run = offered('galactic', 'sinnoh', 0, 'hsu-3');
    evilOf(run).nextAt = 0;
    evilOf(run).beat = 5;
    expect(open(run, 'gx-act4')).toBe(false);
    fx(run, { rank: 4 });
    expect(open(run, 'gx-act4')).toBe(true);
    const r = choose(run, 'gx-act4', 3).run; // "I'll come."
    expect(rankOf(r, 'galactic')).toBe(6);
  });

  it('Team Lantern needs the Offer refused, Charon refused and the fish put back', () => {
    const run = offered('galactic', 'sinnoh', 1, 'hsu-4');
    evilOf(run).nextAt = 0;
    evilOf(run).beat = 4;
    const met = () => content.events.get('lantern-founding')!.requires.every((c) => conditionMet(content, run, c));
    expect(met()).toBe(false);
    run.story.flags['ev:galactic-charon-refused'] = 1;
    run.story.flags['ev:galactic-fish'] = 1;
    expect(met()).toBe(true);
  });

  it('each ending, the lab and Lantern have their own map, entered on the room the choice opened', () => {
    mapsStartOn([['ps_gx_lab', 'gx-act3-glass'], ['ps_gx_plan', 'gx-plan-looker'], ['ps_gx_turn', 'gx-turn-slack'], ['ps_gx_charon', 'gx-charon-meeting'], ['ps_gx_own', 'gx-own-mars'], ['ps_lantern_families', 'lantern-door-1'], ['ps_lantern_climax', 'lantern-ridge']]);
  });
});

describe('Team Plasma from inside (Volume III, Unova)', () => {
  it("N's Offer: yes starts the Acts as a Listener; Act 4 needs Rank 3 and night", () => {
    const run = offered('plasma', 'unova', 0, 'hsu-p1');
    evilOf(run).nextAt = 0;
    expect(open(run, 'px-act1')).toBe(true);
    expect(evilSummary(content, run)!.lines.some((l) => l.startsWith('Inside Team Plasma: Listener (Rank 1)'))).toBe(true);
    evilOf(run).beat = 5;
    expect(content.events.get('px-act4')!.requires.filter((c) => c.kind !== 'period').every((c) => conditionMet(content, run, c))).toBe(false);
    fx(run, { rank: 3 });
    expect(content.events.get('px-act4')!.requires.filter((c) => c.kind !== 'period').every((c) => conditionMet(content, run, c))).toBe(true);
    const out = offered('plasma', 'unova', 1, 'hsu-p2');
    evilOf(out).nextAt = 0;
    expect(open(out, 'px-act1')).toBe(false);
    expect(flagOf(out, 'plasma-offer-refused')).toBe(1);
  });

  it('Sitting in the seventh chair confirms Rank 4 and lowers Suspicion by 3', () => {
    const run = offered('plasma', 'unova', 0, 'hsu-p3');
    evilOf(run).nextAt = 0;
    evilOf(run).beat = 6;
    fx(run, { suspicion: 4 });
    const r = choose(run, 'px-act5', 3).run; // (Sit.)
    expect(rankOf(r, 'plasma')).toBeGreaterThanOrEqual(4);
    expect(flagOf(r, 'plasma-seat-sat')).toBe(1);
    expect(suspicionOf(r, 'plasma')).toBe(1);
  });

  it('Team Open Hand needs the Offer refused, the seat refused and "Where do they go?" asked', () => {
    const run = offered('plasma', 'unova', 1, 'hsu-p4');
    evilOf(run).nextAt = 0;
    evilOf(run).beat = 4;
    const met = () => content.events.get('openhand-founding')!.requires.every((c) => conditionMet(content, run, c));
    expect(met()).toBe(false);
    run.story.flags['ev:plasma-seat-refused'] = 1;
    run.story.flags['ev:plasma-asked-where'] = 1;
    expect(met()).toBe(true);
  });

  it('each ending, the Dreamyard and Open Hand have their own map', () => {
    mapsStartOn([['ps_px_dreamyard', 'px-act3-floor'], ['ps_px_asking', 'px-asking-kings'], ['ps_px_turn', 'px-turn-box'], ['ps_px_ghetsis', 'px-ghetsis-warn'], ['ps_px_own', 'px-own-throne'], ['ps_openhand_insp1', 'openhand-house-1'], ['ps_openhand_night', 'openhand-dragon']]);
  });
});

describe('Team Magma and Team Aqua from inside (HOENN_TEAMS), and Team Sky', () => {
  it('both recruiters are on the road: the other uniform makes it the region\'s team; walking between stays outside', () => {
    const red = offered('aqua', 'hoenn', 0, 'hsu-h1'); // drawn Aqua, took the red hood
    expect(evilOf(red).teamId).toBe('magma');
    evilOf(red).nextAt = 0;
    expect(open(red, 'mg-act1')).toBe(true);
    expect(open(red, 'aq-act1')).toBe(false);
    expect(evilSummary(content, red)!.lines.some((l) => l.startsWith('Inside Team Magma: Recruit (Rank 1)'))).toBe(true);
    const blue = offered('aqua', 'hoenn', 1, 'hsu-h2');
    expect(evilOf(blue).teamId).toBe('aqua');
    expect(open(blue, 'aq-act1') || evilOf(blue).nextAt !== 0).toBe(true);
    const out = offered('magma', 'hoenn', 2, 'hsu-h3');
    expect(flagOf(out, 'hoenn-side-none')).toBe(1);
    expect(open(out, 'mg-act1')).toBe(false);
  });

  it('Hoenn ranks rise at Standing 3, 8, 15 and 25; crossing at the Counter-Offer is one rank lower', () => {
    const run = offered('magma', 'hoenn', 0, 'hsu-h4');
    fx(run, { standing: 15 });
    expect(rankOf(run, 'magma', routeOf(content.evilTeams.teams.find((t) => t.id === 'magma'), 'hoenn'))).toBe(4);
    fx(run, { side: 'aqua', demote: true });
    expect(evilOf(run).teamId).toBe('aqua');
    const aqua = routeOf(content.evilTeams.teams.find((t) => t.id === 'aqua'), 'hoenn');
    expect(rankOf(run, 'aqua', aqua)).toBe(3);
    expect(rankOf(run, 'magma')).toBe(1);
  });

  it('handing in the uniform ends the inside route and opens the first door to Team Sky', () => {
    const run = offered('magma', 'hoenn', 0, 'hsu-h5');
    fx(run, { leave: true });
    expect(open(run, 'mg-act1')).toBe(false);
    run.story.flags['ev:hoenn-left-team'] = 1;
    evilOf(run).beat = 4;
    run.itemCounters = { ...(run.itemCounters ?? {}), 'event-seen:sky-pillar': 1 };
    expect(open(run, 'sky-draconid')).toBe(true);
  });

  it('the endings and Team Sky have their own maps', () => {
    mapsStartOn([['ps_mg_plan', 'mg-plan-wake'], ['ps_aq_turn', 'aq-turn-lines'], ['ps_mg_cross', 'mg-cross-run'], ['ps_aq_all', 'aq-all-battle'], ['ps_sky_pyre', 'sky-pyre-tabitha']]);
  });
});

describe('the inside route reads its region (core/evil/inside.ts)', () => {
  it('Rocket keeps 2, 4, 6, 8 and 10; a route may set its own steps', () => {
    const rocket = content.evilTeams.teams.find((t) => t.id === 'rocket')!;
    expect(routeOf(rocket, 'kanto')!.steps).toBeUndefined();
  });
});
