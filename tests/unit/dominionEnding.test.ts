// DOMINION D17, the run's end (Part 5 §7; Q4; old Part 23 §9.3 = Kice answer 9): complete when every region in the run
// is owned (none lost at that moment) or a run-ending Goal is done; the books across every day; the ending page (Empire
// Map, Ledger graph, crew journeys, Heroes); the run stamped for the main game's finishRun, which pays it in full.
import { describe, expect, it } from 'vitest';
import { cardStatus, freshChair } from '../../src/core/dominion/chair';
import { withCrew } from '../../src/core/dominion/crew';
import { DOMINION_DATA, setActiveRegion } from '../../src/core/dominion/data';
import { actionStatus } from '../../src/core/dominion/field';
import { annalsOf, collapse, collapsed, completion, ENDING, endingModel, endingTitle, finishDominion, noteBooks, PER_PAGE, takenRegions } from '../../src/core/dominion/ending';
import { dominionFinished } from '../../src/core/dominion/charters';
import { defaultOrders, runDay } from '../../src/core/dominion/regions';
import { DominionBlockSchema, type DominionAction, type DominionBlock } from '../../src/core/dominion/schema';
import { dominionBlock, DOMINION_MODE_ID, startInRun, stepInRun } from '../../src/core/dominion/session';
import { freshTakeover } from '../../src/core/dominion/takeover';
import { createProfile, finalizeRun } from '../../src/core/profile';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { endingView } from '../../src/ui/redux/screens/dominion/ending';
import { simRun } from '../../src/core/dominion/autoplay';
import { content } from './helpers';

type Path = 'wipe' | 'shadow' | 'monarch' | 'goal';
const domRun = (seed: string): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
const blk = (r: RunState): DominionBlock => r.expansion!.dominion!;
const quiet = (r: RunState): RunState => {
  const out = structuredClone(r);
  out.expansion!.dominion!.chair = { ...freshChair(), opts: { length: 'off', numbers: 'arrows', speed: 'normal' } };
  return out;
};
const go = (r: RunState, a: DominionAction): RunState => {
  const out = stepInRun(content, r, a);
  expect(out.ok, `${a.t}: ${out.notice}`).toBe(true);
  return out.run;
};
const edit = (r: RunState, f: (b: DominionBlock, r: RunState) => void): RunState => {
  const out = structuredClone(r);
  const b = withCrew(out.expansion!.dominion!);
  f(b, out);
  return { ...out, expansion: { ...out.expansion, dominion: DominionBlockSchema.parse(b) } };
};
const started = (seed = 'd17'): RunState => {
  setActiveRegion('kanto');
  const out = startInRun(content, domRun(seed), { types: ['poison', 'dark'], member: 'grunt', look: 0 });
  expect(out.problem).toBeNull();
  return quiet(go(out.run, { t: 'open' }));
};
/** The region played now Taken by `path`, with Rosa (an Executive to hold it) and Dale (to bring). */
const take = (r: RunState, path: Path = 'shadow', goal: string | null = null): RunState =>
  edit(r, (b) => {
    b.takeover = { ...freshTakeover(), won: { path, day: b.day }, paths: [path], taken: { path, day: b.day } };
    const m0 = b.members[0]!;
    for (const [id, name] of [['rosa', 'Rosa'], ['dale', 'Dale']] as const) if (!b.members.some((m) => m.id === id)) b.members.push({ ...structuredClone(m0), id, name, rank: 'executive', loyalty: 80 });
    if (goal) b.team = { name: 'Team Kettle', primary: 'crimson', secondary: 'gold', initial: 'K', logo: 'shield', motto: 'Up.', goal, day: 1 };
  });
const leaveTo = (r: RunState): RunState => quiet(go(go(r, { t: 'leave', holder: 'rosa', orders: defaultOrders(), bring: 'dale' }), { t: 'open' }));
/** Kanto and Johto held, Hoenn (the last of a three-region run) Taken. */
const allTaken = (seed = 'd17'): RunState => take(leaveTo(take(leaveTo(take(started(seed))))), 'wipe');
/** A few nights (Rest each one). */
const nights = (r: RunState, n: number): RunState => {
  for (let i = 0; i < n; i += 1) {
    if (blk(r).phase === 'morning') r = go(r, { t: 'toDay' });
    if (blk(r).phase === 'day') r = go(r, { t: 'endDay' });
    if (blk(r).phase === 'evening') r = go(r, { t: 'toNight' });
    while (blk(r).crew?.talks.length) r = go(r, { t: 'talk', choice: 0 });
    r = go(r, { t: 'rest' });
  }
  return r;
};

describe('D17 ending data', () => {
  it('validates, names real Goals, and never says Claude or AI', () => {
    expect(ENDING.goalEnds).toEqual(['everlasting', 'clean-slate']);
    const text = JSON.stringify(ENDING);
    expect(text).not.toMatch(/\bClaude\b|\bAI\b/);
    expect(ENDING.pay.map((p) => p.id)).toEqual(['regions', 'days', 'towns', 'crew', 'falls']);
  });
});

describe('D17 when the run is complete', () => {
  it('not before a region is Taken, not while a region is left to sail for', () => {
    const r = started();
    expect(completion(blk(r))).toBeNull();
    expect(completion(blk(take(r)))).toBeNull();
    expect(completion(blk(take(leaveTo(take(r)))))).toBeNull();
    expect(finishDominion(take(r))).toBeNull();
  });
  it('every region owned: the last Taken, the held ones still held', () => {
    const r = allTaken();
    expect(blk(r).realm?.at).toBe('hoenn');
    expect(completion(blk(r))).toBe('every');
    expect(dominionFinished(blk(r))).toBe(true);
    expect(takenRegions(blk(r))).toEqual(['kanto', 'johto', 'hoenn']);
    expect(endingTitle(blk(r)).title).toBe('THE EMPIRE');
  });
  it('a held region lost at that moment (seceded, sold out, lost) or a Long Trip pending keeps the run going', () => {
    const r = allTaken();
    for (const status of ['seceded', 'sellout', 'lost'] as const) expect(completion(blk(edit(r, (b) => { b.realm!.held[0]!.status = status; })))).toBeNull();
    expect(completion(blk(edit(r, (b) => { b.realm!.trip = 'kanto'; })))).toBeNull();
  });
  it('a run-ending Goal (Everlasting, Clean Slate) ends it in the first region; other Goals sail on', () => {
    const r = started();
    const ever = take(r, 'goal', 'everlasting');
    expect(completion(blk(ever))).toBe('goal');
    const t = endingTitle(blk(ever));
    expect(t.title).toBe('FOREVER');
    expect(t.goal?.others).toEqual(['Together', 'The Ordinary Year', 'The Tree']);
    expect(completion(blk(take(r, 'goal', 'clean-slate')))).toBe('goal');
    expect(completion(blk(take(r, 'goal', 'apex')))).toBeNull();
    // Everlasting's region taken another way isn't the Goal done.
    expect(completion(blk(take(r, 'wipe', 'everlasting')))).toBeNull();
  });
});

describe('D17 the books across every day', () => {
  it('records funds after each night, and carries them to the next region', () => {
    const r = nights(started(), 3);
    const a = blk(r).annals!;
    expect(a.funds.length).toBeGreaterThanOrEqual(3);
    expect(a.funds.at(-1)).toBe(blk(r).funds);
    const next = leaveTo(take(r));
    expect(blk(next).annals!.funds.slice(0, a.funds.length)).toEqual(a.funds);
  });
  it('fills a gap with the last value and halves past `keep` (one point per two days)', () => {
    const b = structuredClone(blk(started()));
    b.annals = { from: 1, step: 1, funds: [100] };
    b.day = 4;
    b.funds = 400;
    noteBooks(b);
    expect(b.annals.funds).toEqual([100, 100, 100, 400]);
    b.annals = { from: 1, step: 1, funds: Array.from({ length: ENDING.keep - 1 }, (_, i) => i) };
    b.day = ENDING.keep;
    noteBooks(b);
    expect(b.annals.step).toBe(2);
    expect(b.annals.funds.length).toBeLessThanOrEqual(ENDING.keep / 2);
    expect(DominionBlockSchema.safeParse(b).success).toBe(true);
    // A block from before D17 starts its book on the night it's first seen.
    const old = structuredClone(blk(started()));
    delete old.annals;
    expect(annalsOf(old).from).toBe(runDay(old));
  });
});

describe('D17 losing: Collapse (Part 5 §8)', () => {
  /** HQ rooms all ruined, ₽ below 0, nothing held; three members of different loyalty. */
  const fallen = (): DominionBlock => {
    const b = structuredClone(blk(take(started())));
    b.takeover = undefined;
    const room = { uid: 'r1', id: DOMINION_DATA.buildings[0]!.id, tier: 1, cond: 0, spent: 500, building: false, up: false, ready: 1, shut: false, ruined: true, at: null };
    b.hq = { ...b.hq!, rooms: [room, { ...room, uid: 'r2' }] };
    b.funds = -800;
    for (const d of Object.values(b.field.districts)) d.control = 0;
    b.members[0]!.loyalty = 40;
    b.members.find((m) => m.id === 'rosa')!.loyalty = 95;
    return b;
  };
  it('only when all three hold: HQ destroyed, ₽ below 0, no district held', () => {
    expect(collapsed(fallen())).toBe(true);
    const rich = fallen(); rich.funds = 5;
    const standing = fallen(); standing.hq!.rooms[1]!.ruined = false;
    const holding = fallen(); Object.values(holding.field.districts)[0]!.control = 95;
    const bare = fallen(); bare.hq!.rooms = [];
    for (const b of [rich, standing, holding, bare]) {
      expect(collapsed(b)).toBe(false);
      expect(collapse(b)).toEqual([]);
    }
  });
  it('a new warehouse in the same region, the most loyal member, ₽1,000; never the end of the run', () => {
    const b = fallen();
    const lines = collapse(b);
    expect(lines.join(' ')).toContain('Humble beginnings, again.');
    expect(b.members.map((m) => m.name)).toEqual(['Rosa']);
    expect(b.funds).toBe(ENDING.collapse.funds);
    expect(b.hqLevel).toBe(1);
    expect(b.hq!.rooms).toEqual([]);
    expect(b.annals!.falls).toBe(1);
    expect(b.crew!.gone.some((g) => g.why === 'collapse')).toBe(true);
    expect(DominionBlockSchema.safeParse(b).success).toBe(true);
    expect(collapsed(b)).toBe(false);
  });
});

describe('D17 the ending page', () => {
  it('shows the Empire Map, the Ledger graph, every journey (holders too) and how far it got', () => {
    const r = allTaken();
    const m = endingModel(blk(r), r);
    expect(m.map.map((x) => [x.id, x.pill])).toEqual([['kanto', 'HELD'], ['johto', 'HELD'], ['hoenn', 'TAKEN']]);
    expect(m.map[2]!.path).toBe('Wipe Out');
    for (const x of m.map) expect(x.hero).toMatch(/stood last|No Hero/);
    expect(m.pay[0]).toEqual(['Regions taken', '3 / 3']);
    const all = Array.from({ length: m.pages }, (_, p) => endingModel(blk(r), r, p).crew).flat();
    expect(all.some((j) => j.where === 'Holding Kanto')).toBe(true);
    expect(all.some((j) => j.where === 'Holding Johto')).toBe(true);
    for (const j of all) expect(j.first.length && j.last.length).toBeTruthy();
    expect(m.crew.length).toBeLessThanOrEqual(PER_PAGE);
    const html = endingView(m, null);
    for (const id of ['dom-ending', 'dom-end-region-kanto', 'dom-end-ledger', 'dom-end-crew', 'dom-end-pay', 'dom-end-close']) expect(html).toContain(id);
    expect(html).not.toMatch(/\bClaude\b/);
  });
  it('same block, same page (nothing rolls)', () => {
    const r = allTaken();
    expect(endingModel(blk(r), r, 1)).toEqual(endingModel(blk(r), r, 1));
  });
});

describe('D17 closing the books: account rewards', () => {
  it('stamps the run over and won, counts the regions Taken, and finishRun pays its ordinary rewards in full', () => {
    const r = allTaken();
    const done = finishDominion(r)!;
    expect(done.phase).toBe('over');
    expect(done.victory).toBe(true);
    expect(done.regionsCleared).toEqual(expect.arrayContaining(['kanto', 'johto', 'hoenn']));
    expect(done.money).toBe(r.money);
    expect(finishDominion(done)).toBeNull();
    const before = createProfile(content, 'p');
    const out = finalizeRun(content, before, done, '2026-11-21T00:00:00.000Z');
    expect(out.applied).toBe(true);
    expect(out.profile.bankCredits).toBeGreaterThan(before.bankCredits);
    expect(out.profile.runHistory[0]?.regionsCleared).toBe(3);
    // A Goal ending pays by the same rule: one region Taken, one region's stipend (no ending pays more for being one).
    const ever = finishDominion(take(started(), 'goal', 'everlasting'))!;
    expect(finalizeRun(content, createProfile(content, 'q'), ever).profile.runHistory[0]?.regionsCleared).toBe(1);
  });
  it('a fight still going blocks it', () => {
    const r = allTaken();
    const busy = { ...r, battle: { kind: 'x' } } as unknown as RunState;
    expect(finishDominion(busy)).toBeNull();
  });
});

describe('D17 saves', () => {
  it('a block with books round-trips; damaged books fail; no books loads unchanged', () => {
    const r = nights(started(), 2);
    const storage = new MemoryStorageProvider();
    new SaveManager(storage, content).saveRun(r);
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status).toBe('ok');
    if (loaded.status !== 'ok') return;
    expect(dominionBlock(loaded.data)?.annals).toEqual(blk(r).annals);
    const bad = structuredClone(blk(r)) as unknown as { annals: { step: number } };
    bad.annals.step = 0;
    expect(DominionBlockSchema.safeParse(bad).success).toBe(false);
    const old = structuredClone(blk(r));
    delete old.annals;
    expect(DominionBlockSchema.parse(old).annals).toBeUndefined();
    setActiveRegion('kanto');
  });
});

describe('D17 the audit: every Boss action, crew task, rival action, street meeting and Chair card has a status', () => {
  it('nothing is left without one, and nothing waits for D17', () => {
    const D = DOMINION_DATA;
    const actions = D.actions.actions.map((a) => actionStatus(a));
    expect(actions).toHaveLength(600);
    for (const s of actions) if (!s.play) expect(s.slice).toMatch(/^D\d+$/);
    expect(actions.some((s) => s.slice === 'D17')).toBe(false);
    for (const t of D.tasks) {
      expect(['supported', 'limited', 'disabled']).toContain(t.status);
      if (t.status === 'disabled') expect(t.needs).toMatch(/^D\d+[a-z]?$/);
      expect(t.needs).not.toBe('D17');
    }
    for (const a of D.rivalActions.actions) expect(['supported', 'limited', 'disabled']).toContain(a.status);
    for (const o of D.outside) {
      expect(['supported', 'limited', 'disabled']).toContain(o.status);
      if (o.status === 'disabled') expect((o as { waits?: string }).waits).toMatch(/^D\d+$/);
    }
    // The Chair: a card still waiting names the follow-up building it (D8's cards 8-9, D10's follow-up with D5's six and
    // the quiz). Once those land, none waits.
    const waiting = D.court.filter((c) => cardStatus(c) === 'disabled');
    for (const c of waiting) expect(['D5', 'D8', 'D10', 'quiz']).toContain(c.wait);
  });
});

describe('D17 the balance sim (npm run sim:evil)', () => {
  it('plays days through the real steps without getting stuck, and the same seed plays the same', () => {
    const a = simRun(content, 'sim-test', 'mix', 10);
    expect(a.stuck).toBeNull();
    expect(a.days.length).toBeGreaterThanOrEqual(9);
    expect(a.acts).toBeGreaterThan(0);
    expect(simRun(content, 'sim-test', 'mix', 10)).toEqual(a);
    setActiveRegion('kanto');
  }, 60_000);
});
