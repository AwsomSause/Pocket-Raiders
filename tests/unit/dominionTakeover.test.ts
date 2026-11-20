// DOMINION D14, Takeover (Part 5 §1-2, takeover-bonuses.md, Part 35): the four paths (Wipe Out, Shadow, Monarch,
// Goal), the Goal Track with its Turning Points, Cost and Moment, Holdings and their bonuses, the League and Plan
// actions, the hijacked broadcast (v4 m13); save/reload; determinism.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { freshChair, payOwed } from '../../src/core/dominion/chair';
import { withCrew } from '../../src/core/dominion/crew';
import { DOMINION_DATA } from '../../src/core/dominion/data';
import { actionDef, actionStatus } from '../../src/core/dominion/field';
import { beginDominionFight } from '../../src/core/dominion/fight';
import { endDominionFight } from '../../src/core/dominion/fightEnd';
import { growthOf } from '../../src/core/dominion/growth';
import { heroTeam } from '../../src/core/dominion/hero';
import { rivalsOf } from '../../src/core/dominion/rivals';
import { DominionBlockSchema, type DominionAction, type DominionBlock } from '../../src/core/dominion/schema';
import { DOMINION_MODE_ID, startInRun, stepInRun } from '../../src/core/dominion/session';
import {
  broadcastOf, checkPaths, freshTakeover, measures, momentProblem, pathsOf, placesHere, stageAt, takeoverOf, takeProblem,
} from '../../src/core/dominion/takeover';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

const T = DOMINION_DATA.takeover;
const domRun = (seed: string): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
/** Day 1, Evening (the Chair switched off so nights stay the same). */
const started = (seed = 'd14'): RunState => {
  const out = startInRun(content, domRun(seed), { types: ['poison', 'dark'], member: 'grunt', look: 0 });
  expect(out.problem).toBeNull();
  const r = structuredClone(stepInRun(content, out.run, { t: 'open' }).run);
  r.expansion!.dominion!.chair = { ...freshChair(), opts: { length: 'off', numbers: 'arrows', speed: 'normal' } };
  return r;
};
const blk = (r: RunState): DominionBlock => r.expansion!.dominion!;
const go = (r: RunState, a: DominionAction): RunState => {
  const out = stepInRun(content, r, a);
  expect(out.ok, `${a.t}: ${out.notice}`).toBe(true);
  return out.run;
};
const answerAll = (r: RunState): RunState => {
  while (blk(r).crew?.talks.length) r = go(r, { t: 'talk', choice: 0 });
  return r;
};
const night = (r: RunState): RunState => answerAll(go(go(r, { t: 'toNight' }), { t: 'rest' }));
const day = (r: RunState): RunState => go(night(r), { t: 'toDay' });
const edit = (r: RunState, f: (b: DominionBlock, r: RunState) => void): RunState => {
  const out = structuredClone(r);
  const b = withCrew(out.expansion!.dominion!);
  f(b, out);
  return { ...out, expansion: { ...out.expansion, dominion: DominionBlockSchema.parse(b) } };
};
const withGoal = (b: DominionBlock, goal: string | null): void => {
  b.teamName = 'Team Venom';
  b.team = { name: 'Team Venom', primary: 'red', secondary: 'black', initial: 'V', logo: 'fang', motto: '', goal, day: 1 };
};
const tk = (op: 'seen' | 'moment' | 'storm' | 'take' | 'bcast', id?: string): DominionAction => ({ t: 'takeover', op, id });
const fightAll = (r: RunState, outcome: 'win' | 'lose' = 'win'): { run: RunState; lines: string[]; fights: number } => {
  const lines: string[] = [];
  let fights = 0;
  while (blk(r).field.fight && !blk(r).field.fight!.begun) {
    const b = beginDominionFight(content, r);
    expect(b, 'the fight starts').not.toBeNull();
    fights += 1;
    lines.push(...endDominionFight(content, b!, outcome));
    r = b!;
    if (outcome === 'lose') break;
  }
  return { run: r, lines, fights };
};

describe('DOMINION D14: the data', () => {
  it('483 Holdings (51 in Kanto), 14 Goals, four paths; every place has an honest status', () => {
    expect(T.holdings).toHaveLength(483);
    expect(placesHere()).toHaveLength(51);
    expect(T.goals).toHaveLength(14);
    expect(T.paths.map((p) => p.id)).toEqual(['wipe', 'shadow', 'monarch', 'goal']);
    for (const h of T.holdings) {
      if (h.region !== 'kanto') expect(h.status, h.id).toBe('disabled');
      if (h.status === 'limited') expect(h.note, h.id).toBeTruthy();
    }
    for (const g of T.goals) expect(g.stages, g.id).toHaveLength(5);
  });
  it('every line the rules read is written, and none names the in-game helper anything but Rotom', () => {
    const src = readFileSync('src/core/dominion/takeover.ts', 'utf8');
    const keys = new Set([...src.matchAll(/Ln\('([A-Za-z0-9]+)'\)/g)].map((m) => m[1]!));
    for (const m of src.matchAll(/Ln\(\w+ \? '(\w+)' : '(\w+)'\)/g)) keys.add(m[1]!).add(m[2]!);
    for (const k of keys) expect(T.lines[k], k).toBeTruthy();
    for (const h of placesHere()) if (h.needs && h.status !== 'disabled') expect(T.lines[`need:${h.needs}`], h.needs).toBeTruthy();
    const text = JSON.stringify([T.lines, T.broadcast, T.goals, placesHere(), T.play, T.status]);
    expect(text).not.toMatch(/Claude|\bAI\b/);
  });
  it('the 32 actions that waited for D14 (League, Plans, Pirate Radio, Meet the Champion) are played now; none waits', () => {
    expect(Object.keys(T.play)).toHaveLength(32);
    for (const id of ['pirate-radio', 'meet-the-champion', 'study-the-elite-four', 'elite-duel', 'champion-duel', 'wipe-out-plan', 'shadow-plan', 'monarch-plan', 'goal-plan', 'victory-parade']) {
      expect(actionStatus(actionDef(id)!).play, id).toBe(true);
    }
    expect(DOMINION_DATA.actions.actions.filter((a) => actionStatus(a).slice === 'D14')).toHaveLength(0);
    expect(Object.keys(DOMINION_DATA.growthActions.status)).toHaveLength(450);
  });
  it('the takeover crew tasks are live', () => {
    const live = DOMINION_DATA.tasks.filter((t) => t.effect?.kind === 'takeover' && t.status !== 'disabled');
    expect(live.length).toBeGreaterThanOrEqual(4);
  });
});

describe('DOMINION D14: the four paths', () => {
  it('a new empire has four paths, none done; the Goal path asks for a Goal first', () => {
    const b = blk(started());
    const p = pathsOf(b);
    expect(p.map((x) => x.id)).toEqual(['wipe', 'shadow', 'monarch', 'goal']);
    expect(p.every((x) => !x.done)).toBe(true);
    expect(p[3]!.rows[0]!.text).toBe(T.lines.rowRule);
    expect(checkPaths(structuredClone(b))).toEqual([]);
  });
  it('Wipe Out: every rival site and the Boss beaten wins the region, calls the final stand, then Taken after it', () => {
    const r = edit(started('wipe'), (b) => {
      const rv = (b.rivals ??= rivalsOf(b));
      const team = DOMINION_DATA.rivals.teams.find((t) => t.id === 'rocket')!;
      for (const s of team.sites) rv.teams.rocket!.sites[s.id] = 'yours';
      rv.teams.rocket!.admins = [];
      b.flags.push('beat:rocket:hq');
    });
    const b = structuredClone(blk(r));
    expect(pathsOf(b)[0]!.done).toBe(true);
    const lines = checkPaths(b);
    expect(lines.join(' ')).toContain('Wipe Out');
    expect(takeoverOf(b).won?.path).toBe('wipe');
    expect(b.hero?.stand?.state).toBe('due');
    expect(checkPaths(b)).toEqual([]); // once
    b.hero!.stand!.state = 'done';
    expect(checkPaths(b).join(' ')).toContain('Taken');
    expect(takeoverOf(b).taken?.path).toBe('wipe');
    expect(takeoverOf(b).bcast.queue).toContain('region');
  });
  it('Plan points shrink the Hero\'s final stand, never below the floor', () => {
    const r = started('plan');
    const b = structuredClone(blk(r));
    const full = heroTeam(b, r, 'hero', 'stand').team.length;
    b.takeover = { ...freshTakeover(), plan: 2 };
    expect(heroTeam(b, r, 'hero', 'stand').team.length).toBe(full - 2);
    b.takeover.plan = 9;
    expect(heroTeam(b, r, 'hero', 'stand').team.length).toBe(T.league.standMin);
  });
});

describe('DOMINION D14: the Goal Track', () => {
  it('stages sit at 20/40/60/80', () => {
    expect([0, 19.9, 20, 59, 80, 100].map(stageAt)).toEqual([0, 0, 1, 2, 4, 4]);
  });
  it('a night after a Gym is won feeds the Track; crossing a stage is a Turning Point once, cleared by seen', () => {
    let r = edit(started('goal'), (b) => withGoal(b, 'total-takeover'));
    r = day(r); // the first night sets the base
    expect(takeoverOf(blk(r)).goal.track).toBe(0);
    r = edit(r, (b) => {
      takeoverOf(b).goal.track = 15;
      growthOf(b).gyms['pewter-gym'] = { way: 'buy', day: b.day, defiance: 0, told: false, leader: null };
    });
    r = day(go(r, { t: 'endDay' }));
    const st = takeoverOf(blk(r)).goal;
    // A Gym is a Gym (×8 for Total Takeover) and its town counts as held (×3).
    const g = T.goals.find((x) => x.id === 'total-takeover')!;
    expect(st.track).toBe(15 + g.metrics.gyms! + g.metrics.held!);
    expect(st.stage).toBe(1);
    expect(st.tp).toBe(1);
    r = go(r, tk('seen'));
    expect(takeoverOf(blk(r)).goal.tp).toBeNull();
    expect(takeoverOf(blk(r)).goal.stage).toBe(1);
  });
  it('the Moment waits for 100 and a Goal with a finish line; won, the Goal path is done', () => {
    let r = day(edit(started('moment'), (b) => withGoal(b, 'total-takeover')));
    expect(momentProblem(blk(r))).toContain('100');
    expect(stepInRun(content, r, tk('moment')).ok).toBe(false);
    r = edit(r, (b) => {
      takeoverOf(b).goal.track = 100;
    });
    expect(momentProblem(blk(r))).toBeNull();
    const out = stepInRun(content, r, tk('moment'));
    expect(out.ok).toBe(true);
    expect(out.fight).toBe(true);
    const f = fightAll(out.run);
    expect(f.fights).toBe(1);
    expect(takeoverOf(blk(f.run)).goal.done).toBe(true);
    expect(pathsOf(blk(f.run))[3]!.done).toBe(true);
  });
  it('losing the Moment costs Track (failure); a Goal with no finish line has no Moment (boundary)', () => {
    let r = day(edit(started('lose'), (b) => withGoal(b, 'total-takeover')));
    r = edit(r, (b) => {
      takeoverOf(b).goal.track = 100;
    });
    const f = fightAll(go(r, tk('moment')), 'lose');
    expect(takeoverOf(blk(f.run)).goal.track).toBe(100 - T.goal.lose);
    expect(takeoverOf(blk(f.run)).goal.done).toBe(false);
    const hate = edit(r, (b) => withGoal(b, 'pure-hate'));
    expect(momentProblem(blk(hate))).toBe(T.lines.rowNoFinish);
  });
  it('a full Cost lets the Opposition strike within a week', () => {
    let r = day(edit(started('cost'), (b) => withGoal(b, 'total-takeover')));
    r = edit(r, (b) => {
      takeoverOf(b).goal.track = 50;
    });
    let struck = false;
    for (let i = 0; i < 8 && !struck; i++) {
      r = edit(r, (b) => {
        takeoverOf(b).goal.cost = T.goal.max;
      });
      r = day(go(r, { t: 'endDay' }));
      struck = takeoverOf(blk(r)).goal.track < 50;
    }
    expect(struck).toBe(true);
    expect(takeoverOf(blk(r)).goal.track).toBe(50 - T.goal.strike);
  });
});

describe('DOMINION D14: Holdings', () => {
  it('buying a home takes a Boss action and its price, adds Control, and its weekly bonus starts', () => {
    let r = day(started('home'));
    r = edit(r, (b) => {
      b.funds = 50000;
    });
    const h = placesHere().find((x) => x.id === 'kanto:reds-house-pallet')!;
    const before = blk(r);
    const out = stepInRun(content, r, tk('take', h.id));
    expect(out.ok, out.notice ?? '').toBe(true);
    const b = blk(out.run);
    expect(b.funds).toBe(before.funds - T.holding.price[h.size]!);
    expect(b.actions).toBe(before.actions - 1);
    expect(takeoverOf(b).hold[h.id]).toMatchObject({ way: 'home', until: null });
    expect(b.field.districts.pallet!.control).toBeGreaterThan(before.field.districts.pallet!.control);
    expect(measures(b).holdings).toBe(1);
    expect(takeProblem(b, h.id)).toContain('already');
  });
  it('a Seize is a fight, then days of holding on before the place is yours', () => {
    let r = day(started('seize'));
    const id = 'kanto:victory-road';
    const out = stepInRun(content, r, tk('take', id));
    expect(out.ok, out.notice ?? '').toBe(true);
    expect(out.fight).toBe(true);
    const f = fightAll(out.run);
    expect(f.fights).toBe(1);
    const h = takeoverOf(blk(f.run)).hold[id]!;
    expect(h.until).toBeGreaterThan(blk(f.run).day);
    r = f.run;
    for (let i = 0; i < 12 && takeoverOf(blk(r)).hold[id]?.until !== null; i++) r = day(go(r, { t: 'endDay' }));
    const end = takeoverOf(blk(r)).hold[id];
    // Rival hits may cost the seizure; either way it settles.
    expect(end === undefined || end.until === null).toBe(true);
  });
  it('the reasons a place can\'t be taken (failure, boundary)', () => {
    const ev = started('no');
    const b = blk(ev);
    expect(takeProblem(b, 'kanto:reds-house-pallet')).toBe(T.lines.dayOnly);
    const johto = T.holdings.find((h) => h.region !== 'kanto')!;
    expect(takeProblem(b, johto.id)).toBe(T.lines.noPlace);
    const via = placesHere().find((h) => h.via?.startsWith('gym:'))!;
    expect(takeProblem(b, via.id)).toContain('Gym');
    const r = edit(day(ev), (x) => {
      x.funds = 0;
    });
    expect(takeProblem(blk(r), 'kanto:reds-house-pallet')).toContain('₽');
    expect(stepInRun(content, r, tk('take', 'kanto:reds-house-pallet')).ok).toBe(false);
    expect(takeProblem(blk(r), 'kanto:celadon-city')).toContain('more places');
  });
});

describe('DOMINION D14: hand-offs from other slices', () => {
  it('storming Rocket\'s HQ (Admins, then Giovanni) wins Wipe Out\'s HQ row and hands over the Viridian Gym', () => {
    let r = edit(day(started('storm')), (b) => {
      const rv = (b.rivals ??= rivalsOf(b));
      const team = DOMINION_DATA.rivals.teams.find((t) => t.id === 'rocket')!;
      for (const s of team.sites) if (!s.hq) rv.teams.rocket!.sites[s.id] = 'yours';
    });
    const out = stepInRun(content, r, tk('storm'));
    expect(out.ok, out.notice ?? '').toBe(true);
    const f = fightAll(out.run);
    expect(f.fights).toBe(5);
    r = f.run;
    expect(blk(r).flags).toContain('beat:rocket:hq');
    expect(growthOf(blk(r)).gyms['viridian-gym']).toMatchObject({ way: 'break' });
    expect(pathsOf(blk(r))[0]!.done).toBe(true);
    expect(stepInRun(content, r, tk('storm')).ok).toBe(false);
  });
  it('the Chair\'s Goal, Shadow and Wipe Out numbers move for real now', () => {
    const b = withCrew(structuredClone(blk(started('owed'))));
    withGoal(b, 'total-takeover');
    expect(payOwed(b, 'goal', 5)).toBe(true);
    expect(takeoverOf(b).goal.track).toBe(5);
    const regard = b.field.districts.pewter!.regard;
    expect(payOwed(b, 'shadow', 1)).toBe(true);
    expect(b.field.districts.pewter!.regard).toBe(regard + 2);
    b.rivals = rivalsOf(b);
    const mine = (): number => Object.values(b.rivals!.teams.rocket!.sites).filter((x) => x === 'yours').length;
    const had = mine();
    expect(payOwed(b, 'wipe', 1)).toBe(true); // card 82, the deserter Admin's HQ plans: one site
    expect(mine()).toBe(had + 1);
    expect(payOwed(b, 'stab', 1)).toBe(false); // Stability waits for D15
  });
});

describe('DOMINION D14: the hijacked broadcast', () => {
  it('a town turned Owned is announced once; the broadcast names the team and the town', () => {
    let r = edit(day(started('tv')), (b) => {
      withGoal(b, null);
      b.field.districts.pewter!.control = 100;
      b.field.districts.pewter!.rival = 0;
    });
    r = day(go(r, { t: 'endDay' }));
    const t = takeoverOf(blk(r));
    expect(t.bcast.queue).toContain('pewter');
    const tv = broadcastOf(blk(r))!;
    expect(tv.head).toContain('Team Venom');
    expect(tv.head).toContain('Pewter');
    expect(tv.ticker.length).toBeGreaterThan(0);
    r = go(r, tk('bcast'));
    expect(takeoverOf(blk(r)).bcast.seen).toContain('pewter');
    r = day(go(r, { t: 'endDay' }));
    expect(takeoverOf(blk(r)).bcast.queue).not.toContain('pewter');
  });
});

describe('DOMINION D14: saves and determinism', () => {
  it('a save from before D14 (no `takeover`) loads unchanged; with a Takeover it round-trips', () => {
    const r = started('save');
    const old = edit(r, (b) => {
      delete b.takeover;
    });
    const storage = new MemoryStorageProvider();
    new SaveManager(storage, content).saveRun(old);
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status).toBe('ok');
    if (loaded.status !== 'ok') return;
    expect(loaded.data).toEqual(old);
    const grown = edit(loaded.data, (b) => {
      const t = takeoverOf(b);
      t.hold['kanto:reds-house-pallet'] = { day: 1, way: 'home', cond: 100, paid: true, until: null };
      t.goal.track = 33;
      t.plan = 1;
    });
    new SaveManager(storage, content).saveRun(grown);
    const back = new SaveManager(storage, content).loadRun();
    expect(back.status).toBe('ok');
    if (back.status === 'ok') expect(back.data).toEqual(grown);
  });
  it('a damaged Takeover does not pass the schema (failure)', () => {
    const b = withCrew(structuredClone(blk(started('bad'))));
    b.takeover = { ...freshTakeover(), plan: -1 };
    expect(DominionBlockSchema.safeParse(b).success).toBe(false);
    b.takeover = { ...freshTakeover(), paths: ['rule' as never] };
    expect(DominionBlockSchema.safeParse(b).success).toBe(false);
  });
  it('same seed and steps give the same Takeover', () => {
    const play = (): DominionBlock => {
      let r = edit(started('same'), (b) => {
        withGoal(b, 'perfect-order');
        b.funds = 60000;
      });
      r = day(r);
      r = go(r, tk('take', 'kanto:blues-house-pallet'));
      for (let i = 0; i < 3; i++) r = day(go(r, { t: 'endDay' }));
      return blk(r);
    };
    expect(play()).toEqual(play());
  });
});
