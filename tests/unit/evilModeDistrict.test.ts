// Evil Mode slice 2 ("a district"): twenty steps, eight locals, four methods, odds.ts, squads, takings and wages,
// the Evening's rolls from `evil-dispatch`, and how a district ends. Normal, boundary and failure cases.
import { describe, expect, it } from 'vitest';
import { boardModel, newDispatch } from '../../src/core/evilMode/boardScreens';
import { fairPrice, heldCount, layDistrict, townStreet } from '../../src/core/evilMode/board';
import { EVIL_DATA } from '../../src/core/evilMode/data';
import { BEAT_END, step, type EvilAction } from '../../src/core/evilMode/day';
import { dispatchRoll, jobProblem } from '../../src/core/evilMode/dispatch';
import { oddsFor, type JobDraft } from '../../src/core/evilMode/odds';
import { EVIL_MODE_ID, ensureDistrict, foundInRun, stepInRun } from '../../src/core/evilMode/session';
import { EvilModeBlockSchema, type EvilModeBlock, type Holding, type JobMethod } from '../../src/core/evilMode/schema';
import { firstCrew } from '../../src/core/evilMode/schema';
import { foundTeam } from '../../src/core/evilMode/start';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

const found = (seed = 'd1', creed = 'profit', line: 'clean' | 'grey' | 'whatever' = 'grey'): EvilModeBlock => {
  const r = foundTeam({ name: 'Kettle', creed, line, doctrine: 'swarm' }, { boss: 'red', length: 'three', seed });
  if (!r.ok) throw new Error(r.problem);
  // These suites test the district and the Card with the four nameless Grunts of slices 2 and 3 (a migrated block's crew):
  // no talents, no lines. Named people are tested in evilModePeople.test.ts.
  return { ...r.block, crew: firstCrew(4, EVIL_DATA.creeds.find((c) => c.id === creed)!.start.loyalty) };
};
const go = (b: EvilModeBlock, a: EvilAction): EvilModeBlock => {
  const r = step(b, a);
  if (!r.ok) throw new Error(JSON.stringify(r.cues));
  return r.block;
};
const toDispatch = (b: EvilModeBlock) => go(b, { type: 'dismissOvernight' });
/** From Dispatch, through to the next Dispatch (the Evening rolls on the way). */
const endDay = (b: EvilModeBlock) => {
  for (const t of ['send', 'stayIn', 'callItADay', 'lightsOut', 'watchRoad', 'dismissOvernight'] as const) {
    if (b.district?.end) return b;
    b = go(b, { type: t });
  }
  return b;
};
const first = (b: EvilModeBlock, f: (h: Holding) => boolean) => b.district!.holdings.find(f)!;
const withHoldings = (b: EvilModeBlock, f: (h: Holding) => Holding): EvilModeBlock => ({ ...b, district: { ...b.district!, holdings: b.district!.holdings.map(f) } });

describe('the district (board.ts)', () => {
  it('twenty steps: the Gym at 20, eight locals, the layout\'s counts, all distinct locals', () => {
    const d = found().district!;
    expect(d.holdings).toHaveLength(20);
    expect(d.holdings[19]!.kind).toBe('gym');
    const count = (k: string) => d.holdings.filter((h) => h.kind === k).length;
    const L = EVIL_DATA.district.layout;
    expect([count('local'), count('wild'), count('alpha'), count('safehouse'), count('opportunity'), count('town')]).toEqual([L.local, L.wild, L.alpha, L.safehouse, L.opportunity, 1]);
    const refs = d.holdings.filter((h) => h.kind === 'local').map((h) => h.ref);
    expect(new Set(refs).size).toBe(8);
    expect(d.holdings.every((h) => h.scouted === 0 && h.owner === 'nobody')).toBe(true);
  });
  it('the same seed lays the same district; another seed another', () => {
    expect(found('a').district).toEqual(found('a').district);
    expect(found('a').district!.holdings.map((h) => h.ref)).not.toEqual(found('b').district!.holdings.map((h) => h.ref));
  });
  it('laying a district draws from no gameplay stream (a run\'s streams are unchanged by founding)', () => {
    const run = chooseStarter(content, createRun(content, { runId: 'r', seed: 'r', archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: EVIL_MODE_ID } }), 0);
    const after = foundInRun(run, { name: 'Kettle', creed: 'profit', line: 'grey', doctrine: 'swarm' }, 'three').run;
    expect(after.rng).toEqual(run.rng);
    expect(after.expansion!.evilMode!.draws['evil-dispatch']).toBe(0);
  });
  it('first moods: Dread 4+ makes every local Sullen (boundary 3 does not)', () => {
    const d4 = layDistrict('x', 0, 1, { regard: 0, dread: 4 });
    expect(d4.holdings.filter((h) => h.kind === 'local').every((h) => h.mood === 'sullen')).toBe(true);
    const d3 = layDistrict('x', 0, 1, { regard: 0, dread: 3 });
    expect(d3.holdings.filter((h) => h.kind === 'local').some((h) => h.mood !== 'sullen')).toBe(true);
  });
  it('a fair price is six days of the team\'s share, a fifth lower if they fear the bank; no price for the retired Ace or a child', () => {
    const h = (ref: string): Holding => ({ id: 's1', step: 1, kind: 'local', ref, mood: 'wary', scouted: 0, owner: 'nobody', holds: false, tried: [] });
    expect(fairPrice(h('zamora'))).toBe(1800);
    expect(fairPrice(h('eze'))).toBe(1450); // 1800 * 4/5 = 1440, to the nearest 50
    expect(fairPrice(h('baumgartner'))).toBe(10800);
    expect(fairPrice(h('ferreira'))).toBeNull();
    expect(fairPrice(h('amadi'))).toBeNull();
  });
});

describe('odds.ts: what is shown is what is rolled', () => {
  it('for a hundred seeded jobs the odds fixed at Send equal the preview, and a job wins exactly when its roll is at or under them', () => {
    let checked = 0;
    for (let s = 0; checked < 100; s++) {
      let b = toDispatch(found(`odds${s}`));
      const methods: JobMethod[] = ['persuade', 'outplay', 'pay', 'scout'];
      const queued: { id: string; preview: number }[] = [];
      for (const m of methods) {
        const h = b.district!.holdings.find((x) => !queued.some((q) => q.id === x.id) && jobProblem(b, { holdingId: x.id, method: m, squad: m === 'scout' ? ['g4'] : ['g1', 'g2'], offer: 75 }) === null);
        if (!h) continue;
        const job: JobDraft = { holdingId: h.id, method: m, squad: m === 'scout' ? ['g4'] : m === 'outplay' ? ['g3', 'g4'] : ['g1', 'g2'], offer: 75 };
        const r = step(b, { type: 'queueJob', job });
        if (!r.ok) continue;
        b = r.block;
        queued.push({ id: h.id, preview: oddsFor(b, job).odds });
      }
      b = go(go(b, { type: 'send' }), { type: 'stayIn' });
      for (const q of queued) {
        const sheet = b.sheets.find((x) => x.holdingId === q.id)!;
        expect(sheet.odds).toBe(q.preview);
        expect(sheet.won).toBe(sheet.certain || sheet.roll <= sheet.odds);
        checked++;
      }
    }
  });
  it('a preview draws nothing: looking at odds and the board a hundred times changes no state and no stream count', () => {
    const b = toDispatch(found());
    const snap = JSON.stringify(b);
    const h = first(b, (x) => x.kind === 'local');
    for (let i = 0; i < 100; i++) {
      oddsFor(b, { holdingId: h.id, method: 'persuade', squad: ['g1', 'g2'] });
      boardModel(b, { ...newDispatch(), at: i % 20, step: 'how', how: i % 7, squad: ['g1', 'g2'] });
    }
    expect(JSON.stringify(b)).toBe(snap);
    expect(b.draws['evil-dispatch']).toBe(0);
  });
  it('the terms add up: Persuade on a scouted Easy local with a short squad; clamped at 5 and 95', () => {
    let b = toDispatch(found());
    const h = first(b, (x) => x.kind === 'local');
    b = withHoldings(b, (x) => (x.id === h.id ? { ...x, mood: 'easy', scouted: 2 } : x));
    const o = oddsFor(b, { holdingId: h.id, method: 'persuade', squad: ['g1', 'g2'] });
    expect(o.terms.map((t) => t.value)).toEqual([50, 10, 20, 10, -10]);
    expect(o.odds).toBe(80);
    const warm = withHoldings({ ...b, team: { ...b.team, regard: 10 } }, (x) => (x.id === h.id ? { ...x, mood: 'warm', tried: ['persuade'] } : x));
    expect(oddsFor(warm, { holdingId: h.id, method: 'persuade', squad: ['g1', 'g2', 'g3'] }).odds).toBe(95);
    const cold = withHoldings({ ...b, team: { ...b.team, dread: 9 } }, (x) => (x.id === h.id ? { ...x, mood: 'sullen', scouted: 0 } : x));
    expect(oddsFor(cold, { holdingId: h.id, method: 'persuade', squad: ['g1', 'g2'] }).odds).toBe(10);
  });
  it('unscouted, the mood is red ink: the screen shows a band and the rolled figure lies inside it', () => {
    const b = toDispatch(found());
    const h = first(b, (x) => x.kind === 'local');
    const o = oddsFor(b, { holdingId: h.id, method: 'persuade', squad: ['g1', 'g2', 'g3'] });
    expect(o.lo).toBeLessThan(o.hi);
    expect(o.odds).toBeGreaterThanOrEqual(o.lo);
    expect(o.odds).toBeLessThanOrEqual(o.hi);
  });
});

describe('dispatch: who can go, and what is refused (failure cases, checked in step)', () => {
  const b = toDispatch(found('fail', 'profit', 'clean'));
  const local = first(b, (x) => x.kind === 'local' && !EVIL_DATA.district.locals.find((l) => l.id === x.ref)?.noPrice);
  const q = (job: Partial<JobDraft> & { method: JobMethod }) => step(b, { type: 'queueJob', job: { holdingId: local.id, squad: ['g1', 'g2'], ...job } });
  it('one person can only scout; four is too many; nobody is refused', () => {
    expect(q({ method: 'persuade', squad: ['g1'] }).ok).toBe(false);
    expect(q({ method: 'scout', squad: ['g1'] }).ok).toBe(true);
    expect(q({ method: 'scout', squad: ['g1', 'g2', 'g3', 'g4'] }).ok).toBe(false);
    expect(q({ method: 'scout', squad: [] }).ok).toBe(false);
  });
  it('a Grunt already going somewhere can\'t be sent twice', () => {
    const one = go(b, { type: 'queueJob', job: { holdingId: local.id, method: 'persuade', squad: ['g1', 'g2'] } });
    const other = first(one, (x) => x.kind === 'wild');
    expect(step(one, { type: 'queueJob', job: { holdingId: other.id, method: 'outplay', squad: ['g2', 'g3'] } }).ok).toBe(false);
    expect(step(one, { type: 'queueJob', job: { holdingId: other.id, method: 'outplay', squad: ['g3', 'g4'] } }).ok).toBe(true);
  });
  it('the Gym, an opportunity\'s Persuade, Shut doors, a child, unknown methods and short Funds are refused with a reason', () => {
    const gym = first(b, (x) => x.kind === 'gym');
    // Slice 8: the Gym can be scouted (a talk with the caretaker); every other method is refused (its five ways are in person).
    expect(step(b, { type: 'queueJob', job: { holdingId: gym.id, method: 'persuade', squad: ['g1', 'g2'] } }).ok).toBe(false);
    expect(step(b, { type: 'queueJob', job: { holdingId: gym.id, method: 'scout', squad: ['g1'] } }).ok).toBe(true);
    const opp = first(b, (x) => x.kind === 'opportunity');
    expect(step(b, { type: 'queueJob', job: { holdingId: opp.id, method: 'persuade', squad: ['g1', 'g2'] } }).ok).toBe(false);
    const shut = withHoldings(b, (x) => (x.id === local.id ? { ...x, mood: 'shut' } : x));
    expect(jobProblem(shut, { holdingId: local.id, method: 'persuade', squad: ['g1', 'g2'] })).toMatch(/Shut/);
    expect(jobProblem(shut, { holdingId: local.id, method: 'outplay', squad: ['g1', 'g2'] })).toBeNull();
    const child = withHoldings(b, (x) => (x.id === local.id ? { ...x, ref: 'amadi' } : x));
    expect(jobProblem(child, { holdingId: local.id, method: 'outplay', squad: ['g1', 'g2'] })).toBe("She's eleven.");
    expect(jobProblem(child, { holdingId: local.id, method: 'pay', squad: ['g1', 'g2'] })).toBe("She's eleven.");
    expect(jobProblem(child, { holdingId: local.id, method: 'persuade', squad: ['g1', 'g2'] })).toBeNull();
    expect(step(b, { type: 'queueJob', job: { holdingId: local.id, method: 'lean' as JobMethod, squad: ['g1', 'g2'] } }).ok).toBe(false);
    const poor = { ...b, team: { ...b.team, funds: 0 } };
    expect(jobProblem(poor, { holdingId: local.id, method: 'pay', squad: ['g1', 'g2'] })).toMatch(/Not enough Funds/);
  });
  it('jobs can only be queued at Dispatch', () => {
    expect(step(found(), { type: 'queueJob', job: { holdingId: local.id, method: 'scout', squad: ['g1'] } }).ok).toBe(false);
  });
});

describe('the Evening and the end of a district', () => {
  it('a day replays the same: same seed and the same actions give the same block', () => {
    const play = () => {
      let b = toDispatch(found('replay'));
      const locals = b.district!.holdings.filter((h) => h.kind === 'local');
      b = go(b, { type: 'queueJob', job: { holdingId: locals[0]!.id, method: 'persuade', squad: ['g1', 'g2'] } });
      b = go(b, { type: 'queueJob', job: { holdingId: locals[1]!.id, method: 'scout', squad: ['g3'] } });
      return endDay(b);
    };
    expect(play()).toEqual(play());
  });
  it('rolls come from evil-dispatch in queue order: one draw per job, counted in the block', () => {
    let b = toDispatch(found('order'));
    const [a, c] = b.district!.holdings.filter((h) => h.kind === 'local');
    b = go(b, { type: 'queueJob', job: { holdingId: a!.id, method: 'persuade', squad: ['g1', 'g2'] } });
    b = go(b, { type: 'queueJob', job: { holdingId: c!.id, method: 'scout', squad: ['g3'] } });
    b = go(go(b, { type: 'send' }), { type: 'stayIn' });
    expect(b.sheets.map((s) => s.roll)).toEqual([dispatchRoll(b.district!.seed, 0), dispatchRoll(b.district!.seed, 1)]);
    expect(b.draws['evil-dispatch']).toBe(2);
    expect(b.queue).toEqual([]);
  });
  it('the Evening applies once: a replayed Evening on the same day changes nothing', () => {
    let b = toDispatch(found());
    b = go(go(b, { type: 'send' }), { type: 'stayIn' });
    const again = { ...b, here: { ...b.here, beat: 'inPerson' as const } };
    expect(go(again, { type: 'stayIn' }).team).toEqual(b.team);
  });
  it('scouting fills in the target and what touches it within two steps; scouting again fills in wants', () => {
    let b = toDispatch(found());
    const h = b.district!.holdings[9]!;
    b = endDay(go(b, { type: 'queueJob', job: { holdingId: h.id, method: 'scout', squad: ['g1'] } }));
    const near = b.district!.holdings.filter((x) => Math.abs(x.step - h.step) <= 2);
    expect(near.every((x) => x.scouted >= 1)).toBe(true);
    expect(b.district!.holdings[0]!.scouted).toBe(0);
    b = endDay(go(b, { type: 'queueJob', job: { holdingId: h.id, method: 'scout', squad: ['g1'] } }));
    expect(b.district!.holdings[9]!.scouted).toBe(2);
  });
  it('a fair Pay holds and costs the price; takings and wages move Funds; Heat falls on a quiet day', () => {
    let b = toDispatch(found('pay'));
    const h = first(b, (x) => x.kind === 'local' && (EVIL_DATA.district.locals.find((l) => l.id === x.ref)?.take ?? 0) > 0 && fairPrice(x) !== null && fairPrice(x)! <= b.team.funds);
    const price = fairPrice(h)!;
    const take = EVIL_DATA.district.locals.find((l) => l.id === h.ref)!.take;
    const before = b.team;
    b = go(b, { type: 'queueJob', job: { holdingId: h.id, method: 'pay', squad: ['g1', 'g2'], offer: 100 } });
    b = go(go(b, { type: 'send' }), { type: 'stayIn' });
    const held = b.district!.holdings.find((x) => x.id === h.id)!;
    expect(held).toMatchObject({ owner: 'team', method: 'pay', holds: true });
    expect(b.team.funds).toBe(before.funds - price + take - 4 * EVIL_DATA.district.rules.wage);
    expect(b.team.heat).toBe(Math.max(0, before.heat - 1));
  });
  it('a lowball that lands would turn and leaves the local one colder', () => {
    let b = toDispatch(found('low'));
    const h = first(b, (x) => x.kind === 'local' && fairPrice(x) !== null && x.mood === 'wary');
    let n = 0;
    while (dispatchRoll(b.district!.seed, n) > 30) n++;
    b = { ...b, draws: { ...b.draws, 'evil-dispatch': n } };
    b = go(go(go(b, { type: 'queueJob', job: { holdingId: h.id, method: 'pay', squad: ['g1', 'g2'], offer: 50 } }), { type: 'send' }), { type: 'stayIn' });
    expect(b.district!.holdings.find((x) => x.id === h.id)).toMatchObject({ owner: 'team', holds: false, mood: 'sullen' });
  });
  it('a lost Outplay rests the squad tomorrow and opens a rematch at +10', () => {
    let b = toDispatch(found('lose'));
    const h = first(b, (x) => x.kind === 'wild');
    let n = 0;
    while (dispatchRoll(b.district!.seed, n) <= 95) n++;
    b = { ...b, draws: { ...b.draws, 'evil-dispatch': n } };
    b = endDay(go(b, { type: 'queueJob', job: { holdingId: h.id, method: 'outplay', squad: ['g1', 'g2'] } }));
    expect(b.district!.holdings.find((x) => x.id === h.id)!.tried).toContain('outplay');
    expect(jobProblem(b, { holdingId: h.id, method: 'outplay', squad: ['g1', 'g3'] })).toMatch(/resting/);
    const terms = oddsFor(b, { holdingId: h.id, method: 'outplay', squad: ['g3', 'g4'] }).terms;
    expect(terms.some((t) => t.label === 'A rematch' && t.value === 10)).toBe(true);
  });
  it('the Town follows its street and counts double', () => {
    const b = toDispatch(found());
    const street = townStreet(b.district!).map((h) => h.id);
    const three = withHoldings(b, (x) => (street.slice(0, 3).includes(x.id) ? { ...x, owner: 'team', method: 'persuade', since: 1, holds: true } : x));
    const after = go(go(go(three, { type: 'send' }), { type: 'stayIn' }), { type: 'callItADay' });
    expect(after.district!.holdings.find((h) => h.kind === 'town')!.owner).toBe('team');
    expect(heldCount(after)).toBe(5);
    const two = withHoldings(b, (x) => (street.slice(0, 2).includes(x.id) ? { ...x, owner: 'team', holds: true } : x));
    expect(go(go(two, { type: 'send' }), { type: 'stayIn' }).district!.holdings.find((h) => h.kind === 'town')!.owner).toBe('nobody');
  });
  it('eleven held ends the district at that Evening (boundary: ten does not, before day seven)', () => {
    const b = toDispatch(found());
    // Ten holdings that aren't locals (so the Town's street stays empty), then one local more.
    const ten = b.district!.holdings.filter((h) => ['wild', 'alpha', 'safehouse', 'opportunity'].includes(h.kind)).map((h) => h.id);
    expect(ten).toHaveLength(10);
    const own = (ids: string[]) => withHoldings(b, (x) => (ids.includes(x.id) ? { ...x, owner: 'team', method: 'persuade', since: 1, holds: true } : x));
    const notEnded = go(go(own(ten), { type: 'send' }), { type: 'stayIn' });
    expect(heldCount(notEnded)).toBe(10);
    expect(notEnded.district!.end).toBeUndefined();
    const eleven = go(go(own([...ten, first(b, (h) => h.kind === 'local').id]), { type: 'send' }), { type: 'stayIn' });
    expect(eleven.district!.end).toMatchObject({ how: 'held', day: 1, count: 11 });
    expect(step(eleven, { type: 'callItADay' }).ok).toBe(false);
  });
  it('the seventh day ends it either way: an empty week is not held', () => {
    let b = toDispatch(found());
    for (let i = 0; i < 10 && !b.district!.end; i++) b = endDay(b);
    expect(b.district!.end).toMatchObject({ how: 'taken', day: 7 });
    expect(b.here.day).toBe(7);
  });
  it('Belonging pays shares (half of the day\'s takings), never wages, so it can\'t go short', () => {
    let b = toDispatch(found('bel', 'belonging'));
    const funds = b.team.funds;
    b = go(go(b, { type: 'send' }), { type: 'stayIn' });
    expect(b.team.funds).toBe(funds);
  });
});

describe('saves: block v2 and the migration from v1', () => {
  it('a slice-1 block (v1, no district) migrates: nothing lost, four Grunts, and the district is laid from the run\'s seed', () => {
    const run = chooseStarter(content, createRun(content, { runId: 'mig', seed: 'mig', archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: EVIL_MODE_ID } }), 0);
    const v2 = foundInRun(run, { name: 'Kettle', creed: 'profit', line: 'grey', doctrine: 'swarm' }, 'three').run;
    const b2 = v2.expansion!.evilMode!;
    const { district: _d, crew: _c, queue: _q, sheets: _s, evening: _e, log: _l, cards: _k, given: _g, taken: _t, rates: _r, applicants: _a, drawn: _dr, refusal: _rf, ...rest } = b2;
    const v1 = { ...rest, v: 1 };
    const parsed = EvilModeBlockSchema.parse(v1);
    // Slice 4 took the block to v4; a v1 block goes through v2 and v3 to v4 in one load.
    expect(parsed).toMatchObject({ v: 7, applicants: [], refusal: null, district: null, queue: [], sheets: [], log: [], cards: [], given: 0, taken: 0, rates: {} });
    expect(parsed.crew.map((c) => c.name)).toEqual(['Grunt 1', 'Grunt 2', 'Grunt 3', 'Grunt 4']);
    expect(parsed.team).toEqual(b2.team);
    const storage = new MemoryStorageProvider();
    new SaveManager(storage, content).saveRun({ ...v2, expansion: { ...v2.expansion, evilMode: v1 as never } });
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status).toBe('ok');
    if (loaded.status !== 'ok') return;
    const laid = ensureDistrict(loaded.data);
    expect(laid.expansion!.evilMode!.district).toEqual(b2.district);
    expect(stepInRun(loaded.data, { type: BEAT_END.morning }).run.expansion!.evilMode!.district).not.toBeNull();
  });
  it('a queued job survives a save mid-Dispatch and a reload rolls the same Evening', () => {
    const run = chooseStarter(content, createRun(content, { runId: 'q', seed: 'q', archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: EVIL_MODE_ID } }), 0);
    let r = foundInRun(run, { name: 'Kettle', creed: 'profit', line: 'grey', doctrine: 'swarm' }, 'three').run;
    r = stepInRun(r, { type: 'dismissOvernight' }).run;
    const h = r.expansion!.evilMode!.district!.holdings.find((x) => x.kind === 'local')!;
    r = stepInRun(r, { type: 'queueJob', job: { holdingId: h.id, method: 'persuade', squad: ['g1', 'g2'] } }).run;
    const storage = new MemoryStorageProvider();
    new SaveManager(storage, content).saveRun(r);
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status === 'ok' && loaded.data).toEqual(r);
    if (loaded.status !== 'ok') return;
    const eve = (x: typeof r) => stepInRun(stepInRun(x, { type: 'send' }).run, { type: 'stayIn' }).run.expansion!.evilMode!;
    expect(eve(loaded.data)).toEqual(eve(r));
  });
  it('a damaged district does not pass the schema (failure)', () => {
    const b = found();
    expect(EvilModeBlockSchema.safeParse({ ...b, district: { ...b.district!, holdings: b.district!.holdings.slice(0, 19) } }).success).toBe(false);
    expect(EvilModeBlockSchema.safeParse({ ...b, queue: [{ holdingId: 's1', method: 'shadow', squad: ['g1'], odds: null, certain: false, terms: [] }] }).success).toBe(false);
  });
});
