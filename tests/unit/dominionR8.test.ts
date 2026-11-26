// DOMINION redesign R8 (pass 50): the Empire's and the Chair's page models (r8Pages.ts) read the block and never change
// it, and the pages built from them keep the test ids the browser tests use.
import { describe, expect, it } from 'vitest';
import { atDoor, freshChair } from '../../src/core/dominion/chair';
import { chairModel } from '../../src/core/dominion/chairScreens';
import { withCrew } from '../../src/core/dominion/crew';
import { DOMINION_DATA, setActiveRegion } from '../../src/core/dominion/data';
import { defaultOrders } from '../../src/core/dominion/regions';
import { freshTakeover } from '../../src/core/dominion/takeover';
import { favoursModel, gymCaseModel, nightRows, queueModel, underworldModel } from '../../src/core/dominion/r8Pages';
import { empireModel } from '../../src/core/dominion/regionsScreens';
import { DominionBlockSchema, type DominionAction, type DominionBlock } from '../../src/core/dominion/schema';
import { DOMINION_MODE_ID, startInRun, stepInRun } from '../../src/core/dominion/session';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { r5Favours, r5Queue, r5Visitor, type R5Pics } from '../../src/ui/redux/screens/dominion/r50/chairR8';
import { r5GymCase, r5Regions, r5Underworld, r5World, regionCards } from '../../src/ui/redux/screens/dominion/r50/empireR8';
import { r5RunOf } from '../../src/ui/redux/screens/dominion/r50/run';
import { content } from './helpers';

const started = (seed = 'r8'): RunState => {
  const run = chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
  const out = startInRun(content, run, { types: ['poison', 'dark'], member: 'grunt', look: 0 });
  expect(out.problem).toBeNull();
  return stepInRun(content, out.run, { t: 'open' }).run;
};
const blk = (r: RunState): DominionBlock => r.expansion!.dominion!;
const go = (r: RunState, a: DominionAction): RunState => {
  const out = stepInRun(content, r, a);
  expect(out.ok, `${a.t}: ${out.notice}`).toBe(true);
  return out.run;
};
const edit = (r: RunState, f: (b: DominionBlock) => void): RunState => {
  const b = withCrew(structuredClone(blk(r)));
  f(b);
  return { ...r, expansion: { ...r.expansion, dominion: DominionBlockSchema.parse(b) } };
};
/** Day 2's Evening with the Chair sitting. */
const sitting = (): RunState => {
  let r = go(started(), { t: 'toNight' });
  r = go(r, { t: 'rest' });
  while (blk(r).crew?.talks.length) r = go(r, { t: 'talk', choice: 0 });
  r = go(go(go(r, { t: 'toDay' }), { t: 'endDay' }), { t: 'toNight' });
  expect(blk(r).chair?.open).toBe(true);
  return r;
};
const pics: R5Pics = { body: (l, h) => `<i data-look="${l}" style="height:${h}px"></i>`, face: (l) => `<i data-face="${l}"></i>`, mon: (s) => `<i data-mon="${s}"></i>` };
const run5 = (b: DominionBlock) => r5RunOf(b, [], { open: [0, 1, 2, 3, 4, 5] });

describe('redesign R8: the Chair pages', () => {
  it('the waiting room lists the docket from the visitor at the door, and is null with the doors shut', () => {
    expect(queueModel(blk(started()))).toBeNull();
    const r = sitting();
    const b = blk(r);
    const before = JSON.stringify(b);
    const q = queueModel(b)!;
    expect(q.left).toBe(b.chair!.docket.length - b.chair!.at);
    expect(q.rows[0]!.door).toBe(true);
    expect(q.rows.slice(1).every((x) => !x.door)).toBe(true);
    for (const row of q.rows) expect(row.wants).not.toMatch(/^["“]/);
    const html = r5Queue(q, { at: 0, pics, who: null, team: 'Team Nova' }, run5(b));
    expect(html).toContain('data-testid="r8-queue-0"');
    expect(JSON.stringify(b)).toBe(before);
  });

  it('the favour ledger: empty to start, then a Favour, a Grudge and a paying deal in the right columns', () => {
    const r = sitting();
    expect(favoursModel(blk(r))).toEqual({ owe: [], owed: [] });
    expect(r5Favours(favoursModel(blk(r)), { pics, who: null }, run5(blk(r)))).toContain('Nobody yet');
    const card = DOMINION_DATA.court.find((c) => c.who !== 'member')!;
    const r2 = edit(r, (b) => {
      const tags: Record<string, 'favour' | 'grudge'> = {};
      tags[b.members[0]!.id] = 'favour';
      tags[String(card.who)] = 'grudge';
      b.chair!.tags = tags;
      b.chair!.deals = [{ card: card.id, n: 200, clean: true, heat: 0, risk: 0, wanted: 0, mon: 0, item: null, itemN: 0, ten: 0 }];
    });
    const f = favoursModel(blk(r2));
    expect(f.owe.map((x) => x.size).sort()).toEqual(['Deal', 'Favour']);
    expect(f.owe.find((x) => x.size === 'Deal')!.why).toBe('Pays you ₽200 a week');
    expect(f.owed.map((x) => x.size)).toEqual(['Grudge']);
  });

  it('the visitor page keeps the Chair test ids', () => {
    const r = sitting();
    const b = blk(r);
    expect(atDoor(b)).toBeTruthy();
    const m = chairModel(b, r, 0, null);
    expect(m.kind).toBe('visitor');
    if (m.kind !== 'visitor') return;
    const html = r5Visitor(m, { pics, team: 'Team Nova', notice: null, opts: false, queue: queueModel(b)!.left }, run5(b));
    for (const id of ['dom-chair', 'dom-chair-visitor', 'dom-chair-ask', 'dom-chair-answers', 'dom-chair-a0', 'dom-chair-a1', 'dom-chair-top']) expect(html).toContain(`data-testid="${id}"`);
  });

  it('the Night lists at most four of the crew with what they do', () => {
    const r = edit(started(), (b) => {
      const m0 = b.members[0]!;
      for (const id of ['a', 'b', 'c', 'd', 'e']) b.members.push({ ...structuredClone(m0), id, name: id.toUpperCase() });
    });
    const rows = nightRows(blk(r));
    expect(rows).toHaveLength(4);
    for (const x of rows) expect(x.does.length).toBeGreaterThan(0);
  });
});

describe('redesign R8: the Empire pages', () => {
  it('the Underworld: Rocket is met in Kanto, the run\'s next regions are next, the rest wait (at most seven columns)', () => {
    const b = blk(started());
    const u = underworldModel(b);
    expect(u.teams.length).toBeLessThanOrEqual(7);
    expect(u.teams[0]).toMatchObject({ id: 'rocket', state: 'met', here: true });
    expect(u.teams[0]!.where).toContain('Johto');
    expect(u.met).toBe(1);
    expect(u.teams.some((t) => t.state === 'next')).toBe(true);
    expect(u.teams.some((t) => t.state === 'lock')).toBe(true);
    const html = r5Underworld(u, { at: 0, who: null, line: '' }, run5(b));
    for (const t of u.teams) expect(html).toContain(`data-testid="r8-team-${t.id}"`);
  });

  it('the Gym case: all eight Kanto Gyms, one marked next, owned Gyms counted as yours', () => {
    const r = started();
    const g = gymCaseModel(blk(r));
    expect(g.gyms).toHaveLength(8);
    expect(g.gyms.filter((x) => x.who === 'next')).toHaveLength(1);
    expect(g.mine).toBe(0);
    expect(r5GymCase(g, { at: 0, who: null }, run5(blk(r)))).toContain('data-testid="r8-gym-plan"');
  });

  it('the regions grid and the World show four regions, the ones past this run locked', () => {
    const r = started();
    const b = blk(r);
    const m = empireModel(b, r, -1, 0, null, 0, null);
    const cs = regionCards(m, DOMINION_DATA.regions.order);
    expect(cs).toHaveLength(4);
    expect(cs[0]!.id).toBe('kanto');
    expect(cs.at(-1)!.state).toBe('lock');
    const grid = r5Regions(m, { more: DOMINION_DATA.regions.order, notice: null }, run5(b));
    expect(grid).toContain('data-testid="dom-empire-card-kanto"');
    expect(grid).toContain('data-testid="dom-empire-leave"');
    const world = r5World(m, { order: DOMINION_DATA.regions.order, at: 0, who: null, notice: null }, run5(b));
    expect(world).toContain('data-testid="r8-island-kanto"');
    expect(world).toContain('data-testid="dom-world-leave"');
  });
});

describe('redesign R8: Call it in (a Favour spent from the ledger)', () => {
  const C = DOMINION_DATA.courtRules.callIn;
  const withFavour = (r: RunState, tag: 'favour' | 'grudge' = 'favour'): RunState => edit(r, (b) => { b.chair!.tags = { [b.members[0]!.id]: tag }; });

  it('pays back the money, cools the HQ and spends the tag; the ledger row carries who to call', () => {
    const r = withFavour(edit(sitting(), (b) => { b.field.districts[DOMINION_DATA.field.hq]!.heat = 40; }));
    const b = blk(r);
    const who = b.members[0]!.id;
    expect(favoursModel(b).owe[0]).toMatchObject({ size: 'Favour', who });
    const out = stepInRun(content, r, { t: 'callIn', who });
    expect(out.ok, String(out.notice)).toBe(true);
    const nb = blk(out.run);
    expect(nb.funds).toBe(b.funds + C.funds);
    expect(nb.field.districts[DOMINION_DATA.field.hq]!.heat).toBeLessThan(40);
    expect(nb.chair!.tags[who]).toBeUndefined();
    expect(out.notice).toContain(b.members[0]!.name);
    expect(favoursModel(nb).owe).toEqual([]);
  });

  it('a Favour is spent once; Grudges, strangers and shut doors can\'t be called in', () => {
    const r = withFavour(sitting());
    const who = blk(r).members[0]!.id;
    const once = stepInRun(content, r, { t: 'callIn', who });
    expect(once.ok).toBe(true);
    expect(stepInRun(content, once.run, { t: 'callIn', who }).ok).toBe(false);
    expect(stepInRun(content, withFavour(sitting(), 'grudge'), { t: 'callIn', who }).ok).toBe(false);
    expect(stepInRun(content, r, { t: 'callIn', who: 'nobody' }).ok).toBe(false);
    const shut = edit(r, (b) => { b.chair!.open = false; });
    const no = stepInRun(content, shut, { t: 'callIn', who });
    expect(no.ok).toBe(false);
    expect(no.notice).toBe(DOMINION_DATA.courtRules.lines.noFavour);
  });

  it('Heat never goes below zero', () => {
    const r = withFavour(edit(sitting(), (b) => { for (const d of Object.values(b.field.districts)) d.heat = 0; b.heat = 0; }));
    const out = stepInRun(content, r, { t: 'callIn', who: blk(r).members[0]!.id });
    expect(out.ok).toBe(true);
    expect(blk(out.run).field.districts[DOMINION_DATA.field.hq]!.heat).toBe(0);
  });
});

describe('redesign R8: the Magnet Train (Johto to a held Kanto)', () => {
  const M = DOMINION_DATA.regions.magnet;
  /** Kanto Taken and held by Rosa, the Boss now in Johto with money. */
  const inJohto = (): RunState => {
    setActiveRegion('kanto');
    let r = edit(started('r8m'), (b) => {
      b.chair = { ...freshChair(), opts: { length: 'off', numbers: 'arrows', speed: 'normal' } };
      b.takeover = { ...freshTakeover(), won: { path: 'shadow', day: b.day }, paths: ['shadow'], taken: { path: 'shadow', day: b.day } };
      const m0 = b.members[0]!;
      b.members.push({ ...structuredClone(m0), id: 'rosa', name: 'Rosa', rank: 'executive', loyalty: 80 }, { ...structuredClone(m0), id: 'dale', name: 'Dale', rank: 'executive' });
      for (const d of Object.values(b.field.districts).slice(0, 4)) d.control = 90;
    });
    r.party[0]!.level = 36;
    r = go(go(r, { t: 'leave', holder: 'rosa', orders: defaultOrders(), bring: 'dale' }), { t: 'open' });
    return edit(r, (b) => { b.phase = 'day'; b.actions = Math.max(1, b.actions); b.funds = 5000; b.chair = { ...freshChair(), opts: { length: 'off', numbers: 'arrows', speed: 'normal' } }; b.realm!.held[0]!.stability = 50; b.realm!.held[0]!.grievances = 2; });
  };

  it('a ride costs the fare and the rest of the Day, and steadies the region like a short visit', () => {
    const r = inJohto();
    expect(blk(r).realm!.at).toBe('johto');
    expect(blk(r).phase).toBe('day');
    const card = empireModel(blk(r), r).cards.find((c) => c.id === 'kanto')!;
    expect(card.buttons.some((x) => x.op === 'magnet')).toBe(true);
    const out = stepInRun(content, r, { t: 'realm', op: 'magnet', region: 'kanto' });
    expect(out.ok, String(out.notice)).toBe(true);
    const h = blk(out.run).realm!.held[0]!;
    expect(blk(out.run).funds).toBe(5000 - M.fare);
    expect(blk(out.run).actions).toBe(0);
    expect(h.stability).toBe(50 + M.stab);
    expect(h.grievances).toBe(1);
    expect(h.away).toBe(0);
    expect(blk(out.run).realm!.away).toBe(blk(r).realm!.away);
    setActiveRegion('kanto');
  });

  it('no money, the Night, or a region with no line: no ride', () => {
    const r = inJohto();
    const broke = edit(r, (b) => { b.funds = M.fare - 1; });
    expect(stepInRun(content, broke, { t: 'realm', op: 'magnet', region: 'kanto' }).ok).toBe(false);
    const night = edit(r, (b) => { b.phase = 'night'; });
    const late = stepInRun(content, night, { t: 'realm', op: 'magnet', region: 'kanto' });
    expect(late.ok).toBe(false);
    expect(late.notice).toBe(M.lines.late);
    const off = edit(r, (b) => { b.realm!.at = 'hoenn'; });
    const none = stepInRun(content, off, { t: 'realm', op: 'magnet', region: 'kanto' });
    expect(none.ok).toBe(false);
    expect(none.notice).toContain('No Magnet Train');
    setActiveRegion('kanto');
  });

  it('the Evening ride keeps the Evening going', () => {
    const r = edit(inJohto(), (b) => { b.phase = 'evening'; });
    const out = stepInRun(content, r, { t: 'realm', op: 'magnet', region: 'kanto' });
    expect(out.ok, String(out.notice)).toBe(true);
    expect(blk(out.run).phase).toBe('evening');
    setActiveRegion('kanto');
  });
});
